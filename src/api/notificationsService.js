import api from './axiosConfig';

// ===== Notifications System ===== //

export const getUserNotifications = () => api.get('/api/notifications');
export const markAsRead = (notification_id) => api.put(`/api/notifications/${notification_id}/read`);
export const markAllAsRead = () => api.put(`/api/notifications/mark-all-read`);
export const deleteNotification = (notification_id) => api.delete(`/api/notifications/${notification_id}`);


