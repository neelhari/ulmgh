import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toast: null,
  showToast: (message, type = 'success') => {
    const id = Date.now();
    set({ toast: { message, type, id } });
    setTimeout(() => {
      set((state) => (state.toast?.id === id ? { toast: null } : state));
    }, 3000);
  },
  hideToast: () => set({ toast: null }),
}));
