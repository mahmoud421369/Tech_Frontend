import api from './axiosConfig';


// ===== User Management ===== //

export const getUsers = () => api.get('/api/admin/users');
export const getUserDetails = (user_id) => api.get(`/api/admin/users/${user_id}`);
export const suspendUser = (user_id) => api.put(`/api/admin/users/${user_id}/suspend`);
export const activateUser = (user_id) => api.put(`/api/admin/users/${user_id}/activate`);


// ===== Shop Management ===== //

export const getShops = () => api.get(`/api/admin/shops`);
export const approveShop = (shop_id) => api.put(`/api/admin/shops/${shop_id}/approve`);
export const suspendShop = (shop_id) => api.put(`/api/admin/shops/${shop_id}/suspend`);
export const updateProduct = (shop_id, request_id, updates) => 
  api.put(`/api/shops/${shop_id}/repair-requests/${request_id}/status`, updates);


// ===== Reviews ===== //

export const getReviews = () => api.get('/api/reviews');
export const getReviewDetails = (review_id) => api.get(`/api/reviews/${review_id}`);
export const deleteReview = (review_id) => api.get(`/api/reviews/${review_id}`);


// ===== Status ===== //

export const updateStatus = (request_id, data) => api.put(`/api/repair-requests/${request_id}/status `, data);



