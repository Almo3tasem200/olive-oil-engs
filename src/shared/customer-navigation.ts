export type CustomerCheckoutPath = '/checkout' | '/en/checkout';

export function customerCheckoutReturnPath(
  value: unknown,
  locale: 'ar' | 'en',
): CustomerCheckoutPath | undefined {
  const expectedPath = locale === 'en' ? '/en/checkout' : '/checkout';
  return value === expectedPath ? expectedPath : undefined;
}
