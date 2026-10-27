import api from './axiosConfig';

export const repairService = {



  createRequest: (requestData) => 
    api.post('/api/repair-requests', requestData),
  getUserRequests: () => 
    api.get('/api/users/repair-requests'),
  updateUserRequest: (requestId, updates) => 
    api.put(`/api/repair-requests/${requestId}`, updates),
  cancelRequest: (requestId) => 
    api.delete(`/api/repair-requests/${requestId}`),
  


  getShopRequests: (shopId) => 
    api.get(`/api/shops/${shopId}/repair-requests`),
  addShopRepairService: (shopId, serviceData) => 
    api.post(`/api/shops/${shopId}/repair-requests`, serviceData),
  updateRequestStatus: (shopId, requestId, statusData) => 
    api.put(`/api/shops/${shopId}/repair-requests/${requestId}/status`, statusData),
  


  getRequestDetails: (requestId) => 
    api.get(`/api/repair-requests/${requestId}`),
  getRequestTracking: (requestId) => 
    api.get(`/api/repair-requests/${requestId}/tracking`),
  
 
  
  getRequestsByStatus: (status) => 
    api.get('/api/repair-requests', { params: { status } }),
  getRequestsByShop: (shopId) => 
    api.get('/api/repair-requests', { params: { shop_id: shopId } }),
  getRequestsByUser: (userId) => 
    api.get('/api/repair-requests', { params: { user_id: userId } })
};