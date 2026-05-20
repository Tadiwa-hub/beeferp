/**
 * Authentication Store (Zustand)
 * Manages auth state globally
 */

import { create } from 'zustand';
import { authAPI } from './api-service';

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoading: false,
  error: null,

  // Actions
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({
        user,
        accessToken,
        refreshToken,
        isLoading: false,
      });

      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register({ name, email, password });
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({
        user,
        accessToken,
        refreshToken,
        isLoading: false,
      });

      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      set({ error: errorMsg, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
    });
  },

  setUser: (user) => set({ user }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  isAuthenticated: () => {
    const state = get();
    return !!state.accessToken && !!state.user;
  },

  isAdmin: () => {
    const state = get();
    return state.user?.role === 'admin';
  },
}));

export default useAuthStore;
