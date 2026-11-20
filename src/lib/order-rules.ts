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

