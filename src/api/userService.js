import api from './axiosConfig';

// ===== User Profile ===== //

export const getProfile = () => api.get('/api/users/profile');
export const updateProfile = (data) => api.put('/api/users/profile', data);
export const deleteAccount = () => api.delete('/api/users/profile');


// ===== User Profile Details ===== //

export const getUserRepairRequests = () => api.get('/api/users/repair-requests');
export const getUserOrders = () => api.get('/api/users/orders');
export const getUserTransactions = () => api.get('/api/users/transactions');


// ===== Reviews ===== //

export const addReview = (shop_id,review) => api.post(`/api/shops/${shop_id}/reviews`, review);
export const updateReview = (review_id,data) => api.put(`/api/reviews/${review_id}`, data);

// ===== Tracking ===== //

export const getTrackingInfo = (request_id) => api.get(`/api/repair-requests/${request_id}/tracking`);


// ===== Shopping Cart ===== //

export const getCart = () => api.get(`/api/cart`);
export const addItem = (item_id) => api.post(`/api/cart/items/${item_id}/`, item_id);
export const updateItem = (item_id,data) => api.put(`/api/cart/items/${item_id}`, data);
export const removeItem = (item_id) => api.delete(`/api/cart/items/${item_id}`);
export const clearCart = () => api.delete(`/api/cart`);


// ===== Product Catalog ===== //

export const getAllProducts = () => api.get(`/api/products`);
export const getProductDetails = (product_id) => api.get(`/api/products/${product_id}`);
export const searchProducts = () => api.get(`/api/products/search`);
export const filterByCategories = (category) => api.get(`/api/products?category=${category}`);
export const filterByConditions = (condition) => api.get(`/api/products?condition=${condition} `);








