import axios from 'axios';
import toast  from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// ── Request: attach JWT Bearer token ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  // Read from Zustand persist storage key
  try {
    const raw   = localStorage.getItem('iuea_auth');
    const state = raw ? JSON.parse(raw) : null;
    const token = state?.state?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // Ignore parse errors
  }
  return config;
});

// ── Response: handle 401 + network errors ────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Clear persisted auth and redirect
      localStorage.removeItem('iuea_auth');
      // Avoid redirect loop if already on login page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    } else if (err.response?.status === 429) {
      toast.error('Too many requests. Please slow down.');
    } else if (!err.response) {
      toast.error('Network error. Please check your connection.');
    }
    return Promise.reject(err);
  }
);

export default api;
