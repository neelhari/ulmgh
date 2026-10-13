import { create } from 'zustand';
import api from '../utils/api';

const BACKEND = import.meta.env.VITE_BACKEND_URL?.replace('/api', '') || 'http://localhost:5000';


export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  addresses: [],
  orders: [],
  loading: false,
  error: null,

  signup: async (name, email, phone, password) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/signup', { name, email, phone, password });
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Signup failed';
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  verifyOtp: async (email, otp) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      localStorage.setItem('token', data.token);
      set({ token: data.token, user: data.user, loading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'OTP verification failed';
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      set({ token: data.token, user: data.user, loading: false });
      return { success: true, role: data.user.role };
    } catch (err) {
      const error = err.response?.data?.error || 'Login failed';
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/forgot-password', { email });
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Failed to send OTP';
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  verifyResetOtp: async (email, otp) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/verify-reset-otp', { email, otp });
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Invalid OTP';
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Password reset failed';
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  fetchProfile: async () => {
    if (!get().token) return;
    set({ loading: true });
    try {
      const { data } = await api.get('/auth/profile');
      set({ user: data.user, addresses: data.addresses, orders: data.orders, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  updateProfile: async (name, phone) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.put('/auth/profile', { name, phone });
      set({ user: data.user, loading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Update failed';
      set({ loading: false, error });
      return { success: false, error };
    }
  },

  addAddress: async (addressData) => {
    try {
      const { data } = await api.post('/auth/address', addressData);
      set((state) => ({ addresses: [...state.addresses, data.address] }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to add address' };
    }
  },

  deleteAddress: async (id) => {
    try {
      await api.delete(`/auth/address/${id}`);
      set((state) => ({ addresses: state.addresses.filter((a) => a.id !== id) }));
    } catch {}
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, addresses: [], orders: [] });
  },

  isLoggedIn: () => !!get().token,

  // Google OAuth - redirects to backend which handles Google flow
  loginWithGoogle: () => {
    window.location.href = `${BACKEND}/api/auth/google`;
  },

  // Called on redirect back from Google with ?token=xxx in URL
  handleGoogleCallback: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user });
  },
}));
