import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToastStore } from './useToastStore';
import { calculateDeliveryCharge, DEFAULT_DELIVERY_CHARGE } from '../config/delivery';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      deliveryCharge: DEFAULT_DELIVERY_CHARGE,
      
      addToCart: (product, variant, qty = 1) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (i) => i.product.id === product.id && i.variant === variant
          );

          if (existingItemIndex > -1) {
            const newItems = [...state.items];
            newItems[existingItemIndex].qty += qty;
            return { items: newItems };
          }
          
          return { items: [...state.items, { product, variant, qty }] };
        });
        useToastStore.getState().showToast(`Added ${product.name} to cart!`);
      },
      
      removeFromCart: (productId, variant) => set((state) => ({
        items: state.items.filter(item => !(item.product.id === productId && item.variant === variant))
      })),
      
      updateQuantity: (productId, variant, qty) => set((state) => {
        if (qty <= 0) {
          return {
            items: state.items.filter(item => !(item.product.id === productId && item.variant === variant))
          };
        }
        
        return {
          items: state.items.map(item => 
            (item.product.id === productId && item.variant === variant) 
              ? { ...item, qty } 
              : item
          )
        };
      }),

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.variant?.price || item.product.price || 0;
          return sum + (price * item.qty);
        }, 0);
      },

      getTotalSavings: () => {
        return get().items.reduce((sum, item) => {
          const originalPrice = item.variant?.originalPrice || item.product.originalPrice;
          const currentPrice = item.variant?.price || item.product.price;
          if (originalPrice && originalPrice > currentPrice) {
            return sum + ((originalPrice - currentPrice) * item.qty);
          }
          return sum;
        }, 0);
      },

      getDeliveryFee: () => {
        const subtotal = get().getSubtotal();
        return calculateDeliveryCharge(subtotal);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        return subtotal > 0 ? subtotal + calculateDeliveryCharge(subtotal) : 0;
      }
    }),
    {
      name: 'pooja-cart-storage',
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        deliveryCharge: DEFAULT_DELIVERY_CHARGE
      })
    }
  )
);
