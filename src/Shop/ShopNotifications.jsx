import React, { useEffect, useState } from "react";
import { FiBell, FiCheckCircle, FiTrash } from "react-icons/fi";

const ShopNotifications = () => {
  const token = localStorage.getItem("authToken");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8080/api/notifications/shops", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/notifications/shops/${id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) return <div className="p-4 text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div style={{marginTop:"-570px"}} className="p-6 max-w-4xl mx-auto">
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
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "bg-white dark:bg-gray-900"
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