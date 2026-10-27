import api from './axiosConfig';



export const registerUser = (data) => api.post('/api/auth/users/register', data);
export const loginUser = (credentials) => api.post('/api/auth/users/login', credentials);
export const forgotPassword = (email) => api.post('/api/auth/users/forgot-password', { email });
export const resetPassword = (token, newPassword) => api.post('/api/auth/users/reset-password', { token, newPassword });



export const registerShop = (data) => api.post('/api/auth/shops/register', data);
export const loginShop = (credentials) => api.post('/api/auth/shops/login', credentials);
export const shopForgotPassword = (email) => api.post('/api/auth/shops/forgot-password', { email });


export const loginAdmin = (credentials) => api.post('/api/auth/admins/login', credentials);