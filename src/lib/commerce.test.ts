import { describe, expect, it } from 'vitest';
import {
  calculateSubtotal,
  calculateTotal,
  formatEgp,
  parseEgpToPiasters,
} from '@/lib/money';
import { normalizeEgyptianPhone } from '@/lib/phone';
import { canEditPrices, canManageProducts } from '@/lib/permissions';
import { validStatusTransition } from '@/lib/order-rules';
import { capacityLabel, packageLabel } from '@/lib/product-labels';
import {
  customerRegistrationSchema,
  passwordResetCompleteSchema,
  passwordResetRequestSchema,
  priceUpdateSchema,
  productContentSchema,
} from '@/lib/validation';

describe('money calculations', () => {
  it('parses exact EGP values into integer piastres', () => {
    expect(parseEgpToPiasters('550')).toBe(55000);
    expect(parseEgpToPiasters('275.50')).toBe(27550);
    expect(parseEgpToPiasters('٦١٠٠')).toBe(610000);
    expect(() => parseEgpToPiasters('12.345')).toThrow();
  });

  it('calculates cart subtotal and total without floating-point arithmetic', () => {
    const subtotal = calculateSubtotal([
      { unitPricePiasters: 27500, quantity: 2 },
      { unitPricePiasters: 55000, quantity: 1 },
    ]);
    expect(subtotal).toBe(110000);
    expect(calculateTotal(subtotal, 2500)).toBe(112500);
    expect(calculateTotal(subtotal, 0, 10000)).toBe(100000);
  });

  it('rejects invalid quantities and discounts larger than subtotal', () => {
    expect(() => calculateSubtotal([{ unitPricePiasters: 55000, quantity: 0 }])).toThrow();
    expect(() => calculateTotal(1000, 0, 1001)).toThrow();
  });

  it('formats EGP for Arabic and English locales', () => {
    expect(formatEgp(55000, 'ar')).toContain('٥٥٠');
    expect(formatEgp(55000, 'en')).toContain('550');
  });
});

describe('Egyptian phone normalization', () => {
  it('normalizes common local and international mobile formats', () => {
    expect(normalizeEgyptianPhone('01012345678')).toBe('+201012345678');
    expect(normalizeEgyptianPhone('+20 101 234 5678')).toBe('+201012345678');
    expect(normalizeEgyptianPhone('00201012345678')).toBe('+201012345678');
  });

  it('rejects invalid and landline numbers', () => {
    expect(normalizeEgyptianPhone('0233333333')).toBeNull();
    expect(normalizeEgyptianPhone('123')).toBeNull();
  });
});

describe('authorization and order status rules', () => {
  it('allows only the owner to edit prices', () => {
    expect(canEditPrices('OWNER')).toBe(true);
    expect(canEditPrices('MANAGER')).toBe(false);
    expect(canEditPrices('FULFILLMENT')).toBe(false);
    expect(canManageProducts('MANAGER')).toBe(true);
  });

  it('rejects price fields from the general product content endpoint', () => {
    const content = {
      nameAr: 'زيت زيتون', nameEn: 'Olive oil', volumeMl: 500,
      packaging: 'DARK_PLASTIC_BOTTLE', isAvailable: true, isFeatured: false, isActive: false,
    };
    expect(productContentSchema.safeParse({ ...content, priceEgp: '1.00' }).success).toBe(false);
    expect(productContentSchema.safeParse({ ...content, pricePiasters: 100 }).success).toBe(false);
    expect(priceUpdateSchema.safeParse({ priceEgp: '550.00', reason: 'Annual price update' }).success).toBe(true);
    expect(priceUpdateSchema.safeParse({ priceEgp: '550.00' }).success).toBe(false);
  });

  it('permits normal fulfillment transitions and rejects skips/terminal changes', () => {
    expect(validStatusTransition('NEW', 'CONFIRMED')).toBe(true);
    expect(validStatusTransition('PROCESSING', 'SHIPPED')).toBe(true);
    expect(validStatusTransition('NEW', 'DELIVERED')).toBe(false);
    expect(validStatusTransition('DELIVERED', 'CANCELLED')).toBe(false);
  });
});

describe('customer registration validation', () => {
  it('requires a valid email, a name, and a 12-character password', () => {
    expect(customerRegistrationSchema.safeParse({ name: 'Mona Ali', email: 'mona@example.com', password: 'long-password-123' }).success).toBe(true);
    expect(customerRegistrationSchema.safeParse({ name: 'Mona Ali', email: 'not-an-email', password: 'long-password-123' }).success).toBe(false);
    expect(customerRegistrationSchema.safeParse({ name: 'Mona Ali', email: 'mona@example.com', password: 'short' }).success).toBe(false);
  });
});

describe('customer password reset validation', () => {
  it('accepts a six-digit email code and a strong replacement password', () => {
    expect(passwordResetRequestSchema.safeParse({ email: 'customer@example.com' }).success).toBe(true);
    expect(passwordResetCompleteSchema.safeParse({
      email: 'customer@example.com',
      code: '004281',
      password: 'new-olive-password-2026',
    }).success).toBe(true);
  });

  it('rejects malformed codes and weak passwords', () => {
    expect(passwordResetCompleteSchema.safeParse({
      email: 'customer@example.com',
      code: '4281',
      password: 'new-olive-password-2026',
    }).success).toBe(false);
    expect(passwordResetCompleteSchema.safeParse({
      email: 'customer@example.com',
      code: '004281',
      password: 'short',
    }).success).toBe(false);
    expect(passwordResetRequestSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });
});

describe('catalog labels', () => {
  it('labels the 12 liter jerrycan in Arabic and English', () => {
    expect(capacityLabel(12000, 'en')).toBe('12 liters');
    expect(capacityLabel(12000, 'ar')).toBe('12 لتر');
    expect(packageLabel('PLASTIC_JERRYCAN', 'en')).toBe('Plastic jerrycan');
  });
});

