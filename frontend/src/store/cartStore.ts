import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,
      addItem: (item) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === item.productId);
        if (existing) {
          const updated = items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
              : i
          );
          set({
            items: updated,
            total: updated.reduce((sum, i) => sum + i.price * i.quantity, 0),
            itemCount: updated.reduce((sum, i) => sum + i.quantity, 0),
          });
        } else {
          const newItem: CartItem = {
            ...item,
            quantity: item.quantity ?? 1,
          };
          const updated = [...items, newItem];
          set({
            items: updated,
            total: updated.reduce((sum, i) => sum + i.price * i.quantity, 0),
            itemCount: updated.reduce((sum, i) => sum + i.quantity, 0),
          });
        }
      },
      removeItem: (productId) => {
        const updated = get().items.filter((i) => i.productId !== productId);
        set({
          items: updated,
          total: updated.reduce((sum, i) => sum + i.price * i.quantity, 0),
          itemCount: updated.reduce((sum, i) => sum + i.quantity, 0),
        });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const updated = get().items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        );
        set({
          items: updated,
          total: updated.reduce((sum, i) => sum + i.price * i.quantity, 0),
          itemCount: updated.reduce((sum, i) => sum + i.quantity, 0),
        });
      },
      clearCart: () => set({ items: [], total: 0, itemCount: 0 }),
    }),
    { name: 'cart-storage' }
  )
);
