import api from './axiosConfig';

// ==== Orders ===== // 
// =============== //



// ===== User Operations ===== //

export const createOrder = (shop_id,order) => api.post(`/api/shops/${shop_id}/reviews`, order);
export const cancelOrder = (order_id) => api.put(`/api/orders/${order_id}/cancel`);
export const trackDelivery = (order_id) => api.delete(`/api/orders/${order_id}/tracking`);


// ===== Shop Operations ===== //

export const getOrderDetails = (order_id) => api.get(`/api/orders/${order_id}`);

export const getUserOrders = () => api.get('/api/users/orders');
export const getUserTransactions = () => api.get('/api/users/transactions');


// ===== Reviews ===== //

export const addReview = (shop_id,review) => api.post(`/api/shops/${shop_id}/reviews`, review);
export const updateReview = (data) => api.put('/api/reviews/{review_id}', data);

// ===== Tracking ===== //

export const getTrackingInfo = (request_id) => api.get(`/api/repair-requests/${request_id}/tracking`);
