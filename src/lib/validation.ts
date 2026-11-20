import { z } from 'zod';
import { MAX_CART_ITEMS, MAX_QUANTITY_PER_ITEM, parseEgpToPiasters } from '@/lib/money';
import { normalizeEgyptianPhone } from '@/lib/phone';

const nonEmptyText = (max: number) => z.string().trim().min(1).max(max);

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
}).strict();

export const customerRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(200),
}).strict();

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email().max(254),
}).strict();

export const passwordResetCompleteSchema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(12).max(200),
}).strict();

export const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
  }).strict()).min(1).max(MAX_CART_ITEMS),
  customerName: nonEmptyText(160),
  phone: z.string().trim().min(9).max(32).refine((value) => normalizeEgyptianPhone(value) !== null, 'Enter a valid Egyptian mobile number.'),
  governorate: nonEmptyText(120),
  city: nonEmptyText(120),
  area: nonEmptyText(120),
  deliveryZoneId: z.string().uuid(),
  address: nonEmptyText(500),
  buildingNumber: nonEmptyText(80),
  floorApartment: z.string().trim().max(80).optional().or(z.literal('')),
  landmark: nonEmptyText(200),
  customerNotes: z.string().trim().max(1000).optional().or(z.literal('')),
  contactPreference: z.enum(['PHONE', 'WHATSAPP']).optional(),
  idempotencyKey: z.string().uuid(),
  expectedSubtotalPiasters: z.number().int().nonnegative(),
  expectedDeliveryPiasters: z.number().int().nonnegative(),
  expectedTotalPiasters: z.number().int().nonnegative(),
}).strict().superRefine((value, context) => {
  const ids = value.items.map((item) => item.productId);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: 'custom',
      path: ['items'],
      message: 'Remove duplicate product lines before checkout.',
    });
  }
});

export const quoteSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
  }).strict()).min(1).max(MAX_CART_ITEMS),
  deliveryZoneId: z.string().uuid().optional(),
}).strict();

export const productContentSchema = z.object({
  nameAr: nonEmptyText(160),
  nameEn: nonEmptyText(160),
  shortDescriptionAr: z.string().trim().max(300).optional().or(z.literal('')),
  shortDescriptionEn: z.string().trim().max(300).optional().or(z.literal('')),
  descriptionAr: z.string().trim().max(5000).optional().or(z.literal('')),
  descriptionEn: z.string().trim().max(5000).optional().or(z.literal('')),
  volumeMl: z.number().int().positive().max(100000),
  packaging: z.enum(['DARK_PLASTIC_BOTTLE', 'PLASTIC_JERRYCAN', 'OTHER_PLASTIC']),
  isAvailable: z.boolean(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
}).strict();

export const newProductSchema = productContentSchema.extend({
  sku: z.string().trim().min(3).max(80).regex(/^[A-Za-z0-9_-]+$/),
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9-]+$/),
  priceEgp: z.string().trim().refine((value) => {
    try {
      parseEgpToPiasters(value);
      return true;
    } catch {
      return false;
    }
  }, 'Enter a valid EGP price.'),
}).strict();

export const priceUpdateSchema = z.object({
  priceEgp: z.string().trim().refine((value) => {
    try {
      parseEgpToPiasters(value);
      return true;
    } catch {
      return false;
    }
  }, 'Enter a valid EGP price.'),
  reason: z.string().trim().min(3).max(300),
}).strict();

export const deliveryZoneSchema = z.object({
  code: z.string().trim().min(2).max(100).regex(/^[A-Za-z0-9_-]+$/),
  governorateAr: nonEmptyText(120),
  governorateEn: nonEmptyText(120),
  cityAr: nonEmptyText(120),
  cityEn: nonEmptyText(120),
  areaAr: nonEmptyText(120),
  areaEn: nonEmptyText(120),
  feeEgp: z.string().trim().refine((value) => {
    try {
      parseEgpToPiasters(value);
      return true;
    } catch {
      return false;
    }
  }, 'Enter a valid EGP delivery fee.'),
  freeDeliveryOverEgp: z.string().trim().optional().or(z.literal('')),
  isActive: z.boolean(),
}).strict();

export const orderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().trim().max(500).optional().or(z.literal('')),
}).strict();

export const orderNoteSchema = z.object({
  body: nonEmptyText(2000),
}).strict();

export const settingsSchema = z.object({
  businessNameAr: nonEmptyText(160),
  businessNameEn: nonEmptyText(160),
  phone: z.string().trim().max(32).optional().or(z.literal('')),
  whatsapp: z.string().trim().max(32).optional().or(z.literal('')),
  facebookUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
  instagramUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
  publicAddressAr: z.string().trim().max(500).optional().or(z.literal('')),
  publicAddressEn: z.string().trim().max(500).optional().or(z.literal('')),
  hoursAr: z.string().trim().max(500).optional().or(z.literal('')),
  hoursEn: z.string().trim().max(500).optional().or(z.literal('')),
  deliveryPolicyAr: z.string().trim().max(5000).optional().or(z.literal('')),
  deliveryPolicyEn: z.string().trim().max(5000).optional().or(z.literal('')),
  privacyPolicyAr: z.string().trim().max(20000).optional().or(z.literal('')),
  privacyPolicyEn: z.string().trim().max(20000).optional().or(z.literal('')),
  termsAr: z.string().trim().max(20000).optional().or(z.literal('')),
  termsEn: z.string().trim().max(20000).optional().or(z.literal('')),
  codEnabled: z.boolean(),
}).strict();

