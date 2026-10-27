
import api from '../api/api';

const enc = encodeURIComponent;
const convo = (userId, shopId) => `/api/chats/${enc(userId)}/shop/${enc(shopId)}`;


export const parseCount = (data) => Number(data?.unreadCount ?? data?.count ?? data) || 0;

export const chatApi = {

  mySessions: () => api.get('/api/chats/my/sessions'),


  shopSessions: () => api.get('/api/chats/shop/sessions'),

 
  
  messages: (userId, shopId) => api.get(`${convo(userId, shopId)}/paginated`),


  sendMessage: (userId, shopId, body) => api.post(convo(userId, shopId), body),


  
  markRead: (userId, shopId) => api.put(`${convo(userId, shopId)}/mark-read`),


  
  close: (userId, shopId) => api.put(`${convo(userId, shopId)}/close`),


  
  unreadCount: (id) => api.get(`/api/chats/${enc(id)}/unread-count`),
};

export default chatApi;