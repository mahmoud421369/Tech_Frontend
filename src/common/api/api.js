import axios from 'axios';
import useAuthStore from '../store/Auth';
import { parseAccessToken, isTokenExpired } from '../utils/authSession';

const base = process.env.REACT_APP_API_URL || 'https://api.tech-restore.tech';

const api = axios.create({
  baseURL: base,
  withCredentials: true,
});


const RECENT_AUTH_MS = 2 * 60 * 1000;

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
  '/api/auth/google/session',
  '/api/subscriptions/renew/status',
];

const isPublicRoute = (url = '') => PUBLIC_ROUTES.some((route) => url.includes(route));

const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

const bearerOf = (config) => String(config?.headers?.Authorization || '').replace(/^Bearer\s+/i, '');

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
    if (!originalRequest) return Promise.reject(error);

    const isRenewalRoute =
      originalRequest.url?.includes('/api/subscriptions/all') ||
      originalRequest.url?.includes('/api/subscriptions/renew') ||
      originalRequest.url?.includes('/api/subscriptions/cash');

   
    const isPublic = isPublicRoute(originalRequest.url);

   
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.skipRefresh ||
      isRenewalRoute ||
      isPublic
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

 
    const current = useAuthStore.getState().accessToken;
    const sent = bearerOf(originalRequest);
    if (current && sent && current !== sent) {
      originalRequest.headers.Authorization = `Bearer ${current}`;
      return api(originalRequest);
    }

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
      const res = await axios.post(`${base}/api/auth/refresh-token`, {}, { withCredentials: true });

      const data = res.data || {};
    
      const session = parseAccessToken(data.access_token, { checkExpiry: false });
      if (!session) throw new Error('Invalid refresh response');

   
      const prev = useAuthStore.getState();
      const roles = session.roles.length ? session.roles : toArray(data.roles ?? data.role);
      useAuthStore.getState().setUserData(
        session.token,
        roles.length ? roles : prev.roles ?? [],
        session.id ?? data.userId ?? data.id ?? prev.userId ?? null,
        session.email ?? data.email ?? prev.email ?? null
      );

      processQueue(null, session.token);
      originalRequest.headers.Authorization = `Bearer ${session.token}`;
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr);

    
      const status = refreshErr?.response?.status;
      const refreshRejected = status === 401 || status === 403;
      const st = useAuthStore.getState();
      const recentlyAuthed = Date.now() - (st.authAt || 0) < RECENT_AUTH_MS;
      const tokenStillGood = !isTokenExpired(st.accessToken);

      if (!refreshRejected || recentlyAuthed || tokenStillGood) {
        return Promise.reject(error);
      }

      st.clearAuth();
      const isInventoryOrOrders =
        originalRequest.url?.includes('/api/shop/inventory') ||
        originalRequest.url?.includes('/api/shops/orders');

      if (!isInventoryOrOrders && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;