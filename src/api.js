import axios from 'axios';
import useAuthStore from './store/Auth';

const base = 'http://localhost:8080';

const api = axios.create({
  baseURL: base,
  withCredentials: true,
});


let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};


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


    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

 
      if (isRefreshing) {
        console.log(`⏳ Queuing request: ${originalRequest.url} until refresh finishes`);
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
        console.log('🔄 Refreshing token...');
        const res = await axios.post(
          `${base}/api/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data.access_token;
        console.log('✅ New token received:', newToken);

       
        const authStore = useAuthStore.getState();
        authStore.setAccessToken(newToken);
        localStorage.setItem('authToken', newToken); 

       
        processQueue(null, newToken);

      
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        console.error('❌ Token refresh failed:', err.response?.data || err.message);

    
        const authStore = useAuthStore.getState();
        authStore.clearAuth();
        localStorage.removeItem('authToken');
        localStorage.removeItem('roles');
        localStorage.removeItem('userId');

        processQueue(err);
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

  
    return Promise.reject(error);
  }
);

export default api;