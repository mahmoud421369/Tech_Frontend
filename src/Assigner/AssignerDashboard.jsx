import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { FiBell, FiCheckCircle, FiAlertCircle, FiActivity } from "react-icons/fi";

const AssignerDashboard = ({ darkMode }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const isTokenExpired = useCallback((token) => {
    try {
      const decoded = jwtDecode(token);
      if (!decoded.exp) return true;
      const now = Date.now() / 1000;
      return decoded.exp < now;
    } catch {
      return true;
    }
  }, []);

  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      navigate("/login");
    }
  }, [token, isTokenExpired, navigate]);

  const fetchNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      const response = await api.get("/api/notifications/assigner", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.content || response.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err.response?.data || err.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load notifications",
        position: "top",
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [token, darkMode]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  const formatDate = (date) => {
    if (!date || isNaN(new Date(date))) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-6 bg-white dark:bg-gray-950 p-4 sm:p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-gray-100 flex items-center gap-2">
            <FiActivity size={24} />
            Assigner Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Stay updated with your latest activities and notifications
          </p>
        </div>

      
        <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <FiBell size={20} />
              Last Activity
            </h2>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1 rounded-full mt-2 sm:mt-0">
              {unreadCount > 0 ? `${unreadCount} unread` : "All read"}
            </span>
          </div>
          {isLoadingNotifications ? (
            <div className="flex justify-center p-6">
              <svg
                className="animate-spin h-8 w-8 text-indigo-500"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : notifications.length > 0 ? (
            <>
              <div className="space-y-3">
                {displayedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-all duration-200 flex items-start gap-3 ${
                      notification.read ? "opacity-75 bg-gray-50 dark:bg-gray-900" : "bg-indigo-50/50 dark:bg-indigo-900/30"
                    }`}
                  >
                    <div className="mt-1">
                      {notification.read ? (
                        <FiCheckCircle
                          size={20}
                          className="text-green-500 dark:text-green-400"
                        />
                      ) : (
                        <FiAlertCircle
                          size= {20}
                          className="text-indigo-500 dark:text-indigo-400"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {notification.message || "No message content"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {notifications.length > 5 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-gray-800"
                  >
                    {showAll ? "See Less" : "See More"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <FiBell size={24} className="mx-auto mb-2 text-indigo-500 dark:text-indigo-400" />
              <p>No notifications available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignerDashboard;