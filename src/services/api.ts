import axios from 'axios';
import { PIN_STORAGE_KEY } from '../utils/crypto';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestUrl = err.config?.url as string | undefined;
    const isLoginRequest = requestUrl?.includes('/auth/login');

    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem(PIN_STORAGE_KEY);
      window.location.href = '/login';
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
