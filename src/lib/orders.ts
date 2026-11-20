import 'server-only';
import { randomBytes } from 'node:crypto';
import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { calculateSubtotal, calculateTotal } from '@/lib/money';
import { normalizeEgyptianPhone } from '@/lib/phone';
import { decryptSecret, encryptSecret, newOpaqueToken, sha256 } from '@/lib/security';
import type { CheckoutInput, QuoteInput } from '@/lib/types';

export class CommerceError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = 'CommerceError';
    this.code = code;
    this.status = status;
  }
}

function orderNumber() {
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return 'EMO-' + day + '-' + randomBytes(5).toString('hex').toUpperCase();
}

function deliveryCost(subtotalPiasters: number, zone: { feePiasters: number; freeDeliveryOverPiasters: number | null }) {
  if (
    zone.freeDeliveryOverPiasters !== null &&
    subtotalPiasters >= zone.freeDeliveryOverPiasters
  ) {
    return 0;
  }
  return zone.feePiasters;
}

async function loadCartQuote(
  db: Pick<Prisma.TransactionClient, 'product' | 'deliveryZone'>,
  items: QuoteInput['items'],
  deliveryZoneId?: string,
) {
  const ids = items.map((item) => item.productId);
  const products = await db.product.findMany({
    where: { id: { in: ids }, isActive: true, isAvailable: true },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });

  if (products.length !== ids.length) {
    throw new CommerceError('PRODUCT_UNAVAILABLE', 'One or more products are unavailable. Update your cart.');
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const subtotalPiasters = calculateSubtotal(items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) throw new CommerceError('PRODUCT_UNAVAILABLE', 'A product is unavailable.');
    return { unitPricePiasters: product.pricePiasters, quantity: item.quantity };
  }));

  if (!deliveryZoneId) {
    return {
      subtotalPiasters,
      deliveryPiasters: null,
      discountPiasters: 0,
      totalPiasters: null,
      deliveryZone: null,
      items: items.map((item) => {
        const product = productById.get(item.productId)!;
        return {
          productId: product.id,
          slug: product.slug,
          sku: product.sku,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          volumeMl: product.volumeMl,
          packaging: product.packaging,
          imageKey: product.images[0]?.objectKey ?? null,
          unitPricePiasters: product.pricePiasters,
          quantity: item.quantity,
          lineTotalPiasters: product.pricePiasters * item.quantity,
        };
      }),
    };
  }

  const zone = await db.deliveryZone.findFirst({
    where: { id: deliveryZoneId, isActive: true },
  });
  if (!zone) throw new CommerceError('DELIVERY_UNAVAILABLE', 'Choose an available delivery area.');

  const deliveryPiasters = deliveryCost(subtotalPiasters, zone);
  const totalPiasters = calculateTotal(subtotalPiasters, deliveryPiasters);

  return {
    subtotalPiasters,
    deliveryPiasters,
    discountPiasters: 0,
    totalPiasters,
    deliveryZone: {
      id: zone.id,
      governorateAr: zone.governorateAr,
      cityAr: zone.cityAr,
      areaAr: zone.areaAr,
    },
    items: items.map((item) => {
      const product = productById.get(item.productId)!;
      return {
        productId: product.id,
        slug: product.slug,
        sku: product.sku,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        volumeMl: product.volumeMl,
        packaging: product.packaging,
        imageKey: product.images[0]?.objectKey ?? null,
        unitPricePiasters: product.pricePiasters,
        quantity: item.quantity,
        lineTotalPiasters: product.pricePiasters * item.quantity,
      };
    }),
  };
}

export async function quoteCart(input: QuoteInput) {
  return loadCartQuote(prisma, input.items, input.deliveryZoneId);
}

export async function createOrder(input: CheckoutInput, customerAccountId?: string) {
  const normalizedPhone = normalizeEgyptianPhone(input.phone);
  if (!normalizedPhone) throw new CommerceError('INVALID_PHONE', 'Enter a valid Egyptian mobile number.');

  const fingerprint = sha256(JSON.stringify({
    ...input,
    ...(customerAccountId ? { customerAccountId } : {}),
    phone: normalizedPhone,
    items: [...input.items].sort((a, b) => a.productId.localeCompare(b.productId)),
  }));

  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    if (existing.idempotencyFingerprint !== fingerprint) {
      throw new CommerceError('IDEMPOTENCY_KEY_REUSED', 'This checkout key belongs to a different order attempt.', 409);
    }
    return {
      orderNumber: existing.orderNumber,
      totalPiasters: existing.totalPiasters,
      token: decryptSecret(existing.confirmationTokenCiphertext),
      existing: true,
    };
  }

  const token = newOpaqueToken();
  const tokenHash = sha256(token);
  const encryptedToken = encryptSecret(token);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const settings = await tx.storeSettings.findUnique({ where: { id: 1 } });
      if (!settings?.codEnabled) {
        throw new CommerceError('PAYMENT_DISABLED', 'Cash on delivery is not currently enabled.', 409);
      }

      const quote = await loadCartQuote(tx, input.items, input.deliveryZoneId);
      const zone = await tx.deliveryZone.findFirst({
        where: { id: input.deliveryZoneId, isActive: true },
      });
      if (!zone || quote.totalPiasters === null || quote.deliveryPiasters === null) {
        throw new CommerceError('DELIVERY_UNAVAILABLE', 'Choose an available delivery area.');
      }
      if (
        quote.subtotalPiasters !== input.expectedSubtotalPiasters ||
        quote.deliveryPiasters !== input.expectedDeliveryPiasters ||
        quote.totalPiasters !== input.expectedTotalPiasters
      ) {
        throw new CommerceError('QUOTE_CHANGED', 'Product prices or delivery charges changed. Review the updated total before placing the order.', 409);
      }

      const itemCreates: Prisma.OrderItemCreateWithoutOrderInput[] = quote.items.map((item) => {
        const productNameAr = item.nameAr;
        const productNameEn = item.nameEn;
        return {
          product: { connect: { id: item.productId } },
          skuSnapshot: item.sku,
          nameArSnapshot: productNameAr,
          nameEnSnapshot: productNameEn,
          volumeMlSnapshot: item.volumeMl,
          packagingSnapshot: item.packaging,
          unitPricePiasters: item.unitPricePiasters,
          quantity: item.quantity,
          lineTotalPiasters: item.lineTotalPiasters,
        };
      });

      const created = await tx.order.create({
        data: {
          orderNumber: orderNumber(),
          idempotencyKey: input.idempotencyKey,
          idempotencyFingerprint: fingerprint,
          confirmationTokenHash: tokenHash,
          confirmationTokenCiphertext: encryptedToken,
          confirmationExpiresAt: expiresAt,
          customerName: input.customerName,
          customerPhone: normalizedPhone,
          customerAccountId: customerAccountId ?? null,
          contactPreference: input.contactPreference,
          governorate: input.governorate,
          city: input.city,
          area: input.area,
          address: input.address,
          buildingNumber: input.buildingNumber,
          floorApartment: input.floorApartment || null,
          landmark: input.landmark,
          customerNotes: input.customerNotes || null,
          deliveryZoneId: zone.id,
          deliveryZoneLabel: [zone.governorateAr, zone.cityAr, zone.areaAr].join('، '),
          subtotalPiasters: quote.subtotalPiasters,
          discountPiasters: 0,
          deliveryPiasters: quote.deliveryPiasters,
          totalPiasters: quote.totalPiasters,
          paymentMethod: 'CASH_ON_DELIVERY',
          paymentStatus: 'UNPAID',
          status: 'NEW',
          items: { create: itemCreates },
          statusHistory: {
            create: { fromStatus: null, toStatus: 'NEW', note: 'Order placed by customer.' },
          },
          notifications: {
            create: {
              channel: 'ADMIN_DASHBOARD',
              eventKey: 'NEW_ORDER:' + input.idempotencyKey,
              status: 'PENDING',
            },
          },
        },
        select: { orderNumber: true, totalPiasters: true },
      });

      return { orderNumber: created.orderNumber, totalPiasters: created.totalPiasters };
    }, { isolationLevel: 'Serializable' });

    return { ...result, token, existing: false };
  } catch (error) {
    const duplicate = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (duplicate) {
      if (duplicate.idempotencyFingerprint !== fingerprint) {
        throw new CommerceError('IDEMPOTENCY_KEY_REUSED', 'This checkout key belongs to a different order attempt.', 409);
      }
      return {
        orderNumber: duplicate.orderNumber,
        totalPiasters: duplicate.totalPiasters,
        token: decryptSecret(duplicate.confirmationTokenCiphertext),
        existing: true,
      };
    }
    throw error;
  }
}

export async function getOrderConfirmation(token: string) {
  if (token.length < 32 || token.length > 200) return null;
  const order = await prisma.order.findFirst({
    where: {
      confirmationTokenHash: sha256(token),
      confirmationExpiresAt: { gt: new Date() },
    },
    include: { items: true },
  });
  if (!order) return null;

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotalPiasters: order.subtotalPiasters,
    deliveryPiasters: order.deliveryPiasters,
    totalPiasters: order.totalPiasters,
    items: order.items.map((item) => ({
      nameAr: item.nameArSnapshot,
      nameEn: item.nameEnSnapshot,
      volumeMl: item.volumeMlSnapshot,
      quantity: item.quantity,
      unitPricePiasters: item.unitPricePiasters,
      lineTotalPiasters: item.lineTotalPiasters,
    })),
  };
}

export function validStatusTransition(from: string, to: string) {
  const transitions: Record<string, string[]> = {
    NEW: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };
  return transitions[from]?.includes(to) ?? false;
}

