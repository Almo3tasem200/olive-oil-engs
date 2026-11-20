export type AdminRoleName = 'OWNER' | 'MANAGER' | 'FULFILLMENT';

export function canEditPrices(role: string) {
  return role === 'OWNER';
}

export function canManageProducts(role: string) {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canManageDelivery(role: string) {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canManageOrders(role: string) {
  return role === 'OWNER' || role === 'MANAGER' || role === 'FULFILLMENT';
}

export function canManageSettings(role: string) {
  return role === 'OWNER';
}

