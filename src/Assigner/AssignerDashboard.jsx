import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import {
  FiBell,
  FiCheckCircle,
  FiAlertCircle,
  FiActivity,
  FiUsers,
  FiBox,
  FiTool,
  FiClipboardList,
  FiRefreshCw,
  FiTrash2,
  FiTrendingUp,
  FiClipboard,
} from "react-icons/fi";

const AssignerDashboard = ({ darkMode }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const isTokenExpired = useCallback((token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      return !decoded.exp || decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }, []);

useEffect(() =>{

document.title = "Assigner - Dashboard";

},[]);

  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
    } else {
      localStorage.clear();
      navigate("/login");
    }
  }, [token, isTokenExpired, navigate]);

  const fetchNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      const res = await api.get("/api/notifications/assigner", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.content || res.data || [];
      console.log(data);
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not load notifications",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
  }, [isAuthenticated, fetchNotifications]);

  const deleteNotification = async (notifId) => {
    const result = await Swal.fire({
      title: "Delete Notification?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/notifications/assigner/${notifId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete notification",
        toast: true,
        position: "top-end",
      });
    }
  };

  const formatTime = (date) => {
    if (!date) return "Just now";
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

 
  const featureCards = [
    {
      title: "Dashboard Overview",
      icon: <FiActivity size={28} />,
      desc: "Monitor real-time assignments & performance",
      path: "/assigner-dashboard",
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Delivery Persons",
      icon: <FiUsers size={28} />,
      desc: "Manage & track all delivery agents",
      path: "/assigner/delivery-persons",
      color: "from-emerald-600 to-cyan-600",
    },
    {
      title: "Active Orders",
      icon: <FiBox size={28} />,
      desc: "View and assign pending delivery orders",
      path: "/assigner/orders",
      color: "from-teal-600 to-blue-600",
    },
    {
      title: "Repair Requests",
      icon: <FiTool size={28} />,
      desc: "Handle device repair assignments",
      path: "/assigner/repair-requests",
      color: "from-cyan-600 to-indigo-600",
    },
    {
      title: "Assignment Logs",
      icon: <FiClipboard size={28} />,
      desc: "View complete history of assignments",
      path: "/assigner/assignment-logs",
      color: "from-indigo-600 to-purple-600",
    },
    {
      title: "Reassign Tasks",
      icon: <FiRefreshCw size={28} />,
      desc: "Quickly reassign orders & repairs",
      path: "/assigner/reassign-orders",
      color: "from-purple-600 to-pink-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 pt-6 lg:pl-72 transition-all duration-500">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

        
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3 justify-center lg:justify-start">
            <FiTrendingUp className="text-emerald-500" size={36} />
            Welcome back, Assigner!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-lg">
            Here's what's happening with your assignments today
          </p>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {featureCards.map((card, idx) => (
            <div
              key={idx}
              onClick={() => navigate(card.path)}
              className="group cursor-pointer bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:-translate-y-2"
            >
              <div className={`h-2 bg-gradient-to-r ${card.color}`} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-2xl text-emerald-600 dark:text-emerald-400">
                    {card.icon}
                  </div>
                  <FiActivity className="text-gray-400 group-hover:text-emerald-500 transition-colors" size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

     
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <FiBell size={26} className="text-emerald-500" />
                Recent Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                  {unreadCount} New
                </span>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoadingNotifications ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <FiBell size={48} className="mx-auto mb-4 text-emerald-400 opacity-50" />
                <p className="text-lg">No notifications yet</p>
                <p className="text-sm mt-2">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-5 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all flex items-start gap-4 group ${
                      !notif.read ? "bg-emerald-50/30 dark:bg-emerald-900/30" : ""
                    }`}
                  >
                    <div className="mt-1">
                      {notif.read ? (
                        <FiCheckCircle size={22} className="text-green-500" />
                      ) : (
                        <FiAlertCircle size={22} className="text-emerald-500 animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {notif.message || "New activity"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatTime(notif.timestamp)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg text-red-500"
                      title="Delete notification"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignerDashboard;