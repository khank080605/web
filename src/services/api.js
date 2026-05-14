import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/login') &&
      !originalRequest.url.includes('/refresh-token')
    ) {
      originalRequest._retry = true;

      try {
        // Detect if user is admin/staff by checking stored user role
        let userRole = 'customer';
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) userRole = JSON.parse(userStr).role || 'customer';
        } catch (e) { /* ignore */ }

        // Use correct refresh endpoint based on role
        const refreshEndpoint = (userRole === 'admin' || userRole === 'staff')
          ? `${API_URL}/admin/refresh-token`
          : `${API_URL}/auth/refresh-token`;

        const res = await axios.post(refreshEndpoint, {}, { withCredentials: true });
        const newAccessToken = res.data.accessToken || res.data.token;

        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Token expired — clear storage and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
