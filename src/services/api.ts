import axios from 'axios';
import { clearStoredPin } from '../utils/crypto';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const tokenExpiryKey = 'tokenExpiry';

const parseTokenExpiry = (jwt: string) => {
  try {
    const base64 = (jwt.split('.')[1] || '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return payload.exp ?? null;
  } catch {
    return null;
  }
};

const storeToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('token', token);
    const exp = parseTokenExpiry(token);
    if (exp) localStorage.setItem(tokenExpiryKey, String(exp));
    else localStorage.removeItem(tokenExpiryKey);
  } else {
    localStorage.removeItem('token');
    localStorage.removeItem(tokenExpiryKey);
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const requestUrl = err.config?.url as string | undefined;
    const isAuthRequest = requestUrl?.includes('/auth/login') || requestUrl?.includes('/auth/refresh');

    if (err.response?.status === 401 && !isAuthRequest) {
      const originalRequest = err.config as (typeof err.config & { _retry?: boolean }) | undefined;
      if (originalRequest?._retry) {
        storeToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('isKeySet');
        clearStoredPin();
        window.location.href = '/login';
        return Promise.reject(err);
      }

      if (!originalRequest) return Promise.reject(err);
      originalRequest._retry = true;
      try {
        const refreshRes = await api.post('/auth/refresh');
        const newToken = refreshRes.data?.token as string | undefined;
        const isKeySet = refreshRes.data?.isKeySet as boolean | undefined;
        if (newToken) {
          storeToken(newToken);
          if (typeof isKeySet === 'boolean') {
            localStorage.setItem('isKeySet', isKeySet ? '1' : '0');
          }
          clearStoredPin();
          window.dispatchEvent(new CustomEvent('amantra:token-updated', { detail: { token: newToken, isKeySet } }));
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${newToken}`,
          };
          return api(originalRequest);
        }
      } catch {
        storeToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('isKeySet');
        clearStoredPin();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) => api.post('/auth/register', data),
  verify: (data: { email: string; otp: string }) => api.post('/auth/verify', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  forgotPassword: (data: { email: string }) => api.post('/auth/forgot-password', data),
  resetPassword: (data: { email: string; otp: string; password: string }) => api.post('/auth/reset-password', data),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
};

// Vault
export const vaultAPI = {
  fetch: (data: { pageSize: number; offSet: number }) => api.post('/vault/fetch', data),
  add: (data: { title: string; username: string; password: string; category: string; key: string }) => api.post('/vault/add', data),
  decrypt: (id: string, key: string) => api.post(`/vault/${id}`, { key }),
  update: (data: { id: string; title: string; username: string; password: string; notes?: string; category: string; key: string }) => api.patch('/vault/update', data),
  delete: (id: string) => api.delete(`/vault/delete/${id}`),
};

// Journal/Notes
export const notesAPI = {
  fetch: () => api.get('/journal/fetch'),
  add: (data: { title: string; content: string; key: string; category: string }) => api.post('/journal/add', data),
  decrypt: (id: string, key: string) => api.post(`/journal/${id}`, { key }),
  update: (data: { id: string; title: string; content: string; key: string; category: string }) => api.patch('/journal/update', data),
  delete: (id: string) => api.delete(`/journal/delete/${id}`),
};

// Watchlist
export const watchlistAPI = {
  fetch: () => api.get('/watchlist/fetch'),
  add: (data: Record<string, unknown>) => api.post('/watchlist/add', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/watchlist/update/${id}`, data),
  delete: (id: string) => api.delete(`/watchlist/delete/${id}`),
};

// Newsletter
export const newsletterAPI = {
  feed: (category?: string) => api.get('/newsletter/feed', { params: category ? { category } : {} }),
};

// User
export const userAPI = {
  fetch: () => api.get('/user/fetch'),
  update: (data: { name?: string; dateOfBirth?: string; weatherCity?: string }) => api.patch('/user/update', data),
  changePassword: (data: { oldPassword: string; newPassword: string }) => api.patch('/user/changePassword', data),
  deactivate: () => api.delete('/user/deactivate'),
};

// PIN
export const pinAPI = {
  verify: (key: string) => api.post('/pin/verify', { key }),
  set: (key: string) => api.post('/pin/setText', { key }),
  reset: () => api.get('/pin/reset'),
};

export default api;
