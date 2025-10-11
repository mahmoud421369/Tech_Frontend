import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FiMoon, FiSun, FiUser, FiLogOut, FiBell } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import api from "../api";

const AssignerHeader = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

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
    if (isAuthenticated && notificationsOpen) {
      fetchNotifications();
    }
  }, [isAuthenticated, notificationsOpen, fetchNotifications]);

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

  

  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    const result = await Swal.fire({
      title: "Confirm Logout",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, log out",
      position: "top",
      customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
    });

    if (!result.isConfirmed) return;

    try {
      if (token && refreshToken) {
        await api.post(
          "/api/auth/logout",
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      setToken(null);
      setIsAuthenticated(false);
      Swal.fire({
        icon: "success",
        title: "Logged Out",
        text: "You have been logged out successfully",
        position: "top",
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to log out",
        position: "top",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
      navigate("/login");
    }
  }, [token, navigate, darkMode]);

  const menuItems = useMemo(
    () => [
      { name: "Profile", path: "/assigner/profile" },
      { name: "Dashboard", path: "/assigner-dashboard" },
      { name: "Delivery Persons", path: "/assigner/delivery-persons" },
      { name: "Orders", path: "/assigner/orders" },
      { name: "Repairs", path: "/assigner/repair-requests" },
      { name: "Logs", path: "/assigner/assignment-logs" },
      { name: "Assigned Orders", path: "/assigner/assigned-orders" },
      { name: "Assigned Repairs", path: "/assigner/assigned-repairs" },
      { name: "Reassign Repairs", path: "/assigner/reassign-repairs" },
      { name: "Reassign Orders", path: "/assigner/reassign-orders" },
    ],
    []
  );

  const SkeletonLoader = useMemo(
    () => (
      <div className="flex justify-between items-center px-6 py-4 bg-indigo-600 dark:bg-gray-950 text-white shadow-md animate-pulse">
        <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
    ),
    []
  );

  return (
    <header className="relative z-50">
      {isInitialLoading ? (
        SkeletonLoader
      ) : (
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-900 dark:to-blue-900 text-white shadow-md">
          <h1 className="font-bold text-xl tracking-wide">Assigner Dashboard</h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-indigo-500 dark:bg-gray-900 hover:bg-indigo-700 dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-110"
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {isAuthenticated && (
              <>
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setOpen(false); // Close user menu if open
                    }}
                    className="relative p-2 rounded-full bg-indigo-500 dark:bg-gray-900 hover:bg-indigo-700 dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-110"
                    aria-label="Open Notifications"
                    aria-expanded={notificationsOpen}
                  >
                    <FiBell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden animate-fade-in z-50 max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-indigo-200 dark:border-indigo-700">
                        <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                          Notifications
                        </h3>
                      </div>
                      {isLoadingNotifications ? (
                        <div className="p-4 flex justify-center">
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
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-indigo-100 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-start gap-3 ${
                              notification.read ? "opacity-75" : ""
                            }`}
                          >
                            <div className="flex-1">
                              <p className="text-sm text-gray-700 dark:text-gray-200">
                                {notification.message || "No message content"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatDate(notification.timestamp)}
                              </p>
                            </div>
                        
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No notifications available
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setOpen(!open);
                      setNotificationsOpen(false); // Close notifications if open
                    }}
                    className="flex items-center gap-2 bg-indigo-500 dark:bg-gray-900 hover:bg-indigo-700 dark:hover:bg-gray-800 px-3 py-2 rounded-full transition-all duration-300 transform hover:scale-110"
                    aria-label="Open User Menu"
                    aria-expanded={open}
                  >
                    <FiUser size={18} />
                  </button>

                  {open && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden animate-fade-in z-50">
                      {menuItems.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-all duration-200"
                          onClick={() => setOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                      <button
                        className="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 text-left hover:bg-indigo-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-all duration-200"
                        onClick={handleLogout}
                        aria-label="Log Out"
                      >
                        <FiLogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default AssignerHeader;