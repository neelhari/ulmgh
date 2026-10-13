

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set) => ({
      items: [],
      
      toggleWishlist: (productId) => set((state) => {
        if (state.items.includes(productId)) {
          return { items: state.items.filter(id => id !== productId) };
        } else {
          return { items: [...state.items, productId] };
        }
      }),
      
      isInWishlist: (productId) => {
        return false; // we will check using items.includes in components for reactivity
      }
    }),
    {
      name: 'pooja-wishlist-storage',
    }
  )
);
