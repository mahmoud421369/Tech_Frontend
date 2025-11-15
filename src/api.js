import axios from 'axios';
import useAuthStore from './store/Auth';

const base = 'http://localhost:8080';

const api = axios.create({
  baseURL: base,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

// -------------------------------------------------
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

// ------------------------------------------------- REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  console.log(
    `%c[REQUEST]`,
    'color: #4CAF50',
    config.method?.toUpperCase(),
    config.url,
    '| Token:',
    accessToken ? 'Present' : 'None'
  );
  return config;
});

// ------------------------------------------------- RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    console.log(
      `%c[RESPONSE ✅]`,
      'color: #2196F3',
      response.config.url,
      '| Status:',
      response.status
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.log(
      `%c[RESPONSE ❌]`,
      'color: #f44336',
      originalRequest?.url,
      '| Status:',
      error.response?.status,
      '| Data:',
      error.response?.data
    );

    // ---------- 403 → try refresh ----------
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // wait for the ongoing refresh
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
        console.log('Refreshing token...');
        const res = await axios.post(
          `${base}/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        // ---- BACKEND PAYLOAD EXAMPLE ----
        // {
        //   access_token: "eyJhbGciOi...",
        //   roles: ["USER", "ADMIN"],
        //   userId: "12345",
        //   email: "john@example.com"
        // }
        const { access_token: newToken, roles, userId, email } = res.data;

        console.log('New token received:', newToken);

        // ---- UPDATE STORE & LOCALSTORAGE (including email) ----
        const store = useAuthStore.getState();
        store.setUserData(newToken, roles ?? [], userId ?? null, email ?? null);

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr.response?.data || refreshErr.message);

        const store = useAuthStore.getState();
        store.clearAuth();               // clears email too
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