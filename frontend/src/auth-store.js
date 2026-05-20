/**
 * Authentication Store (Zustand)
 * Manages auth state globally and handles session persistence
 */

import { create } from 'zustand';
import { authAPI } from './api-service';

// Helper to decode JWT token payload on client side
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

// Initial state load from localStorage
const token = localStorage.getItem('accessToken');
const refreshToken = localStorage.getItem('refreshToken');
let initialUser = null;

if (token) {
  const decoded = decodeJWT(token);
  if (decoded) {
    initialUser = {
      id: decoded.id,
      name: decoded.name,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };
  }
}

export const useAuthStore = create((set, get) => ({
  // State
  user: initialUser,
  accessToken: token || null,
  refreshToken: refreshToken || null,
  isLoading: false,
  error: null,

  // Actions
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(username, password);
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

  register: async (name, username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register({ name, username, email, password });
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
