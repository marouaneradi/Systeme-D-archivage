import axios from 'axios';

// ── Axios instance configured for the Laravel API ─────────────────
// NOTE: No default Content-Type here — it is set dynamically in the
// request interceptor to allow FormData requests to keep their
// correct multipart/form-data boundary (set automatically by the browser).
const api = axios.create({
  baseURL: '/api',
  headers: {
    Accept: 'application/json',
  },
});

// ── Request interceptor ───────────────────────────────────────────
api.interceptors.request.use((config) => {
  // Attach Bearer token automatically
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Set JSON Content-Type only for non-FormData payloads.
  // When data is FormData, let the browser set multipart/form-data
  // with the correct boundary automatically.
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

// ── Response interceptor: handle 401 globally ─────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and reload
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ── Auth helpers ──────────────────────────────────────────────────
export const authService = {
  login:          (email, password) => api.post('/auth/login', { email, password }),
  logout:         ()                => api.post('/auth/logout'),
  me:             ()                => api.get('/auth/me'),
  updateProfile:  (name, email)     => api.patch('/auth/me', { name, email }),
  forgotPassword: (email)           => api.post('/auth/forgot-password', { email }),
  verifyCode:     (email, code)     => api.post('/auth/verify-code', { email, code }),
  resetPassword:  (email, code, password, password_confirmation) => api.post('/auth/reset-password', { email, code, password, password_confirmation }),
  changePassword: (current_password, new_password, new_password_confirmation) => api.post('/auth/change-password', { current_password, new_password, new_password_confirmation }),
};

export default api;
