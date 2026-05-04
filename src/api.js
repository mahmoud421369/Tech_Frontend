import axios from 'axios';
import useAuthStore from './store/Auth';

const base = 'http://localhost:8080';

const api = axios.create({
  baseURL: base,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const PUBLIC_ROUTES = [
  '/api/auth/register/user',
  '/api/auth/register/shop',
  '/api/auth/register/delivery',
  '/api/auth/register/assigner',
  '/api/auth/verify-email',
  '/api/auth/login',
  '/api/auth/refresh-token',
  '/api/auth/reset-password',
  '/api/auth/forgot-password',
  '/api/auth/get-code',  
];

const isPublicRoute = (url = '') =>
  PUBLIC_ROUTES.some((route) => url.includes(route));

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  if (isPublicRoute(config.url)) {
    delete config.headers.Authorization;
    return config;
  }

  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    const isRenewalRoute = 
      originalRequest.url?.includes('/api/subscriptions/all') ||
      originalRequest.url?.includes('/api/subscriptions/renew') ||
      originalRequest.url?.includes('/api/subscriptions/cash');

    if (error.response?.status === 403 && !originalRequest._retry && !isRenewalRoute) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        const res = await axios.post(
          `${base}/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { access_token: newToken, roles, userId, email } = res.data;

        const store = useAuthStore.getState();
        store.setUserData(newToken, roles ?? [], userId ?? null, email ?? null);

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        const store = useAuthStore.getState();
        store.clearAuth();
        processQueue(refreshErr);
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;