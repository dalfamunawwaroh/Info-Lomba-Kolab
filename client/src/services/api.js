import axios from 'axios';
import { API_BASE_URL } from '@/utils/constants';
import { storage } from '@/utils/storage';

// Halaman auth publik: tidak boleh di-reload paksa ke /login saat request 401
const PUBLIC_AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];
const isPublicAuthPage = () => PUBLIC_AUTH_PATHS.some((p) => window.location.pathname.startsWith(p));

const goLoginUnlessPublicPage = () => {
  if (!isPublicAuthPage()) window.location.href = '/login';
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = storage.getRefreshToken();
      if (!refreshToken) {
        // Pengunjung belum login (fetch publik yang balas 401) → jangan paksa
        // reload; di halaman auth biarkan halaman tetap tampil.
        const wasLoggedIn = Boolean(storage.getAccessToken());
        storage.clear();
        if (wasLoggedIn) goLoginUnlessPublicPage();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = data.data;
        storage.setTokens(access_token, refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        storage.clear();
        goLoginUnlessPublicPage();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
