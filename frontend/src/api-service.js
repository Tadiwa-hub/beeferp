/**
 * API Service
 * Axios instance with JWT interceptors for the frontend
 */

import axios from 'axios';

// Use relative URL so Vite's proxy handles routing to the backend.
// This prevents Windows Firewall issues on port 5000 when testing from mobile.
const API_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Add JWT token to headers
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * Handle token refresh on 401
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic for auth endpoints — let login/register errors pass through cleanly
    const isAuthRoute = originalRequest?.url?.includes('/api/auth/');
    if (isAuthRoute) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * API Endpoints
 */

// Auth
export const authAPI = {
  register: (data) => apiClient.post('/api/auth/register', data),
  login: (username, password) => apiClient.post('/api/auth/login', { username, password }),
  logout: () => apiClient.post('/api/auth/logout'),
  refresh: (refreshToken) => apiClient.post('/api/auth/refresh', { refreshToken }),
};

// Animals
export const animalsAPI = {
  getAll: (page = 1, limit = 20) => apiClient.get(`/api/animals?page=${page}&limit=${limit}`),
  getById: (id) => apiClient.get(`/api/animals/${id}`),
  create: (data) => apiClient.post('/api/animals', data),
  update: (id, data) => apiClient.put(`/api/animals/${id}`, data),
  delete: (id) => apiClient.delete(`/api/animals/${id}`),
};

// Weight Records
export const weightsAPI = {
  getByAnimal: (animalId) => apiClient.get(`/api/weight-records/${animalId}`),
  create: (data) => apiClient.post('/api/weight-records', data),
  createBulk: (data) => apiClient.post('/api/weight-records/bulk', data),
  getADG: (animalId) => apiClient.get(`/api/weight-records/${animalId}/adg`),
};

// Feed Logs
export const feedAPI = {
  getByAnimal: (animalId) => apiClient.get(`/api/feed-logs/${animalId}`),
  create: (data) => apiClient.post('/api/feed-logs', data),
  getEfficiency: (animalId) => apiClient.get(`/api/feed-logs/${animalId}/efficiency`),
};

// Veterinary Records
export const vetAPI = {
  getByAnimal: (animalId) => apiClient.get(`/api/vet-records/${animalId}`),
  create: (data) => apiClient.post('/api/vet-records', data),
  getUpcoming: () => apiClient.get('/api/vet-records/upcoming'),
};

// Analytics
export const analyticsAPI = {
  getOverview: () => apiClient.get('/api/analytics/overview'),
  getADG: () => apiClient.get('/api/analytics/adg'),
  getPerformance: () => apiClient.get('/api/analytics/performance'),
  getForecast: () => apiClient.get('/api/analytics/forecast'),
  getCosts: () => apiClient.get('/api/analytics/costs'),
  getAIInsights: () => apiClient.get('/api/analytics/ai-insights'),
  sendAIChat: (data) => apiClient.post('/api/analytics/ai-chat', data),
};

// Reports
export const reportsAPI = {
  getPDF: (type, params) => apiClient.get(`/api/reports/pdf/${type}`, { params }),
  getCSV: (type, params) => apiClient.get(`/api/reports/csv/${type}`, { params }),
};

// Users (Admin)
export const usersAPI = {
  getAll: () => apiClient.get('/api/users'),
  create: (data) => apiClient.post('/api/users', data),
  update: (id, data) => apiClient.put(`/api/users/${id}`, data),
};
