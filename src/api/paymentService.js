import api from './axiosConfig';


// ===== Payments ===== //


export const processPayment = () => api.post('/api/payments/process');
export const paymentDetails = (payment_id) => api.get(`/api/payments/${payment_id}`);
export const processRefund = () => api.post('/api/payments/refund');


export const savedPaymentMethod = () => api.get('/api/payments/methods')
export const addPaymentMethod = (method) => api.post(`/api/payments/methods`, method);
export const removePaymentMethod = (method_id) => api.delete(`/api/payments/methods/${method_id}`);

