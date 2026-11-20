import type { z } from 'zod';
import type { checkoutSchema, quoteSchema } from '@/lib/validation';

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;

