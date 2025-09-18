import api from './axiosConfig';

// ===== Shop Operations ===== //

export const getShops = () => api.get('/api/shops');
export const getShopDetails = (shopId) => api.get(`/api/shops/${shopId}`);
export const updateShop = (shopId, data) => api.put(`/api/shops/${shopId}`, data);
export const searchShops = (query) => api.get('/api/shops/search', { params: query });

// ===== Shop Products ===== //

export const getShopProducts = (shopId) => api.get(`/api/shops/${shopId}/products`);
export const addProduct = (shopId, product) => api.post(`/api/shops/${shopId}/products`, product);
export const updateProduct = (shopId, productId, updates) => 
  api.put(`/api/shops/${shopId}/products/${productId}`, updates);
export const deleteProduct = (product) => api.delete(`/api/shops/${product}/products`);

// ===== Reviews ===== //

export const getShopReviews = (shop_id) => api.get(`/api/shops/${shop_id}/reviews`);


// ===== Subscriptions ===== //

export const getShopSubscriptions = (shop_id) => api.get(`/api/shops/${shop_id}/subscription`);
export const processPayment = (shop_id) => api.post(`api/shops/${shop_id}/subscription/pay`);
export const getBillingHistory = (shop_id) => api.get(`/api/shops/${shop_id}/subscription/invoices`);


// ===== Device Categories ===== //

export const getCategories = () => api.get(`/api/categories`);
export const getCategoriesProducts = (category_id) => api.get(`/api/categories/${category_id}/products`);

// ===== Status ===== //

export const updateStatus = (request_id, data) => api.put(`/api/repair-requests/${request_id}/status `, data);



