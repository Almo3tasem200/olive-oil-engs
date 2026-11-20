export const MAX_PRICE_PIASTERS = 2_000_000_000;
export const MAX_QUANTITY_PER_ITEM = 99;
export const MAX_CART_ITEMS = 20;

function normalizeDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776));
}

export function parseEgpToPiasters(value: string): number {
  const normalized = normalizeDigits(value.trim());
  const match = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(normalized);

  if (!match) {
    throw new Error('Enter an amount with up to two decimal places.');
  }

  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? '').padEnd(2, '0'));
  const amount = whole * 100 + fraction;

  if (!Number.isSafeInteger(amount) || amount < 1 || amount > MAX_PRICE_PIASTERS) {
    throw new Error('Price is outside the allowed range.');
  }

  return amount;
}

export function formatEgp(piasters: number, locale: 'ar' | 'en' = 'ar') {
  if (!Number.isSafeInteger(piasters) || piasters < 0) {
    throw new Error('Invalid money amount.');
  }

  return new Intl.NumberFormat(locale === 'en' ? 'en-EG' : 'ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(piasters / 100);
}

export type PricedItem = { unitPricePiasters: number; quantity: number };

export function calculateSubtotal(items: PricedItem[]) {
  if (items.length < 1 || items.length > MAX_CART_ITEMS) {
    throw new Error('Cart item count is invalid.');
  }

  let subtotal = 0;
  for (const item of items) {
    if (
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_QUANTITY_PER_ITEM ||
      !Number.isSafeInteger(item.unitPricePiasters) ||
      item.unitPricePiasters < 1
    ) {
      throw new Error('Cart quantity or price is invalid.');
    }

    subtotal += item.unitPricePiasters * item.quantity;
    if (!Number.isSafeInteger(subtotal) || subtotal > MAX_PRICE_PIASTERS) {
      throw new Error('Order subtotal is outside the allowed range.');
    }
  }

  return subtotal;
}

export function calculateTotal(subtotalPiasters: number, deliveryPiasters: number, discountPiasters = 0) {
  for (const amount of [subtotalPiasters, deliveryPiasters, discountPiasters]) {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new Error('Order amount is invalid.');
    }
  }

  if (discountPiasters > subtotalPiasters) {
    throw new Error('Discount cannot exceed subtotal.');
  }

  const total = subtotalPiasters - discountPiasters + deliveryPiasters;
  if (!Number.isSafeInteger(total) || total > MAX_PRICE_PIASTERS) {
    throw new Error('Order total is outside the allowed range.');
  }

  return total;
}

