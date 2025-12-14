
import React, { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { FiBell, FiCheckCircle, FiTrash } from 'react-icons/fi';
import api from '../api'; 

const ShopNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  
  const fetchNotifications = useCallback(async () => {
    const controller = new AbortController();
    try {
      setLoading(true);
      const res = await api.get('/api/notifications/shops', {
        signal: controller.signal,
      });
      setNotifications(res.data || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching notifications:', err.response?.data || err.message);
        Swal.fire('Error', 'Failed to fetch notifications', 'error');
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);


  const markAsRead = useCallback(async (id) => {
    try {
      await api.put(`/api/notifications/shops/${id}`);
      Swal.fire('Success', 'Notification marked as read', 'success');
      await fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err.response?.data || err.message);
      Swal.fire('Error', 'Failed to mark notification as read', 'error');
    }
  }, [fetchNotifications]);


  const removeNotification = useCallback(async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'This notification will be deleted permanently.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
      });

      if (!result.isConfirmed) return;

      await api.delete(`/api/notifications/shops/${id}`);
      Swal.fire('Deleted', 'Notification has been removed', 'success');
      await fetchNotifications(); 
    } catch (err) {
      console.error('Error removing notification:', err.response?.data || err.message);
      Swal.fire('Error', 'Failed to remove notification', 'error');
    }
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
    return () => {
      
    };
  }, [fetchNotifications]);

  if (loading) {
    return <div className="p-4 text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div style={{marginTop:"-600px"}} className="p-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-gray-200">
            <FiBell className="text-blue-500" /> Shop Notifications
          </h2>
          {notifications.length > 0 && (
            <span className="text-sm px-3 py-1 bg-blue-500 text-white rounded-full">
              {notifications.filter((n) => !n.read).length} Unread
            </span>
          )}
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start justify-between gap-4 p-4 transition-colors ${
                  !notif.read
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'bg-white dark:bg-gray-900'
                }`}
              >
                <div>
                  <p className="text-gray-800 dark:text-gray-200">{notif.message}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(notif.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-full"
                      title="Mark as Read"
                    >
                      <FiCheckCircle />
                    </button>
                  )}
                  <button
                    onClick={() => removeNotification(notif.id)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-full"
                    title="Remove"
                  >
                    <FiTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopNotifications;
