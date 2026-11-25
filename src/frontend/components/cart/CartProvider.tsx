'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type CartLine = { productId: string; quantity: number };

type CartContextValue = {
  items: CartLine[];
  ready: boolean;
  addItem: (productId: string, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  count: number;
};

const STORAGE_KEY = 'emo-cart-v1';
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const decoded: unknown = JSON.parse(stored);
          if (Array.isArray(decoded)) {
            const restored = decoded.filter((entry): entry is CartLine =>
              entry &&
              typeof entry.productId === 'string' &&
              Number.isSafeInteger(entry.quantity) &&
              entry.quantity >= 1 &&
              entry.quantity <= 99,
            );
            if (active) setItems(restored);
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (active) setReady(true);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const addItem = useCallback((productId: string, quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) return;
    setItems((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (!existing) return [...current, { productId, quantity }];
      return current.map((item) => item.productId === productId
        ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
        : item);
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) return;
    setItems((current) => current.map((item) =>
      item.productId === productId ? { ...item, quantity } : item,
    ));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({
    items,
    ready,
    addItem,
    setQuantity,
    removeItem,
    clear,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
  }), [items, ready, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider.');
  return context;
}

