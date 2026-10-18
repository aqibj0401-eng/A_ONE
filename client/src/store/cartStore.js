import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item._id === product._id);
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item._id === product._id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            items: [...state.items, { ...product, quantity }],
          };
        });
      },
      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item._id !== productId),
        }));
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
