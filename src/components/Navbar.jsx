import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiSun, FiMoon, FiShoppingCart, FiLogOut, FiHome,
  FiTruck, FiSmartphone, FiBell, FiX, FiCheckCircle
} from "react-icons/fi";
import { FaStore, FaUser } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import logo from "../images/logo-bg.png";

const Navbar = ({ onCartClick, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  /* ------------------------------------------------------------------ */
  /*  AUTH & JWT                                                        */
  /* ------------------------------------------------------------------ */
  const safeDecodeJwt = useCallback((token) => {
    if (!token) return null;
    try { return jwtDecode(token); } catch { return null; }
  }, []);

  const isTokenExpired = useCallback((token) => {
    const decoded = safeDecodeJwt(token);
    return !decoded || !decoded.exp || decoded.exp < Date.now() / 1000;
  }, [safeDecodeJwt]);

  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (token && refreshToken) {
        await api.post("/api/auth/logout", { refreshToken });
      }
    } catch (err) {  }
    localStorage.clear();
    setToken(null);
    setIsAuthenticated(false);
    toast.success("Logged out successfully!");
    navigate("/login", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    const currentToken = localStorage.getItem("authToken");
    if (!currentToken || isTokenExpired(currentToken)) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      setIsAuthenticated(false);
      if (!["/login", "/signup"].includes(location.pathname)) {
        navigate("/login");
      }
    } else {
      setToken(currentToken);
      setIsAuthenticated(true);
    }
  }, [location.pathname, navigate, isTokenExpired]);

  /* ------------------------------------------------------------------ */
  /*  FETCH USER NOTIFICATIONS                                          */
  /* ------------------------------------------------------------------ */
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoadingNotifs(true);
    try {
      const res = await api.get("/api/notifications/users");
      const data = res.data?.content || res.data || [];
      console.log("Fetched notifications:", data);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      console.warn("Failed to load notifications");
    } finally {
      setLoadingNotifs(false);
    }
  }, [token]);

  const markAsRead = async (notifId) => {
    try {
      await api.delete(`/api/notifications/users/${notifId}`);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      await api.delete(`/api/notifications/users/${notifId}`);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setUnreadCount(prev => prev > 0 ? prev - 1 : 0);
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNotifications]);

  /* ------------------------------------------------------------------ */
  /*  NAV ITEMS                                                         */
  /* ------------------------------------------------------------------ */
  const navItems = useMemo(() => 
    isAuthenticated
      ? [
          { name: "Home", path: "/", icon: <FiHome size={20} /> },
          { name: "Devices", path: "/devices", icon: <FiSmartphone size={20} /> },
          { name: "Shops", path: "/shops", icon: <FaStore size={18} /> },
          { name: "Track", path: "/track", icon: <FiTruck size={20} /> },
          { name: "Account", path: "/account", icon: <FaUser size={18} /> },
        ]
      : [
          { name: "Home", path: "/", icon: <FiHome size={20} /> },
          { name: "Login", path: "/login", icon: <FaUser size={18} /> },
          { name: "Signup", path: "/signup", icon: <FaUser size={18} /> },
        ],
    [isAuthenticated]
  );

  return (
    <>
      <ToastContainer position="top-right" theme={darkMode ? "dark" : "light"} />

      
      <nav className={`hidden md:flex items-center justify-between px-8 py-5 fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b ${
        darkMode 
          ? "bg-black/50 border-emerald-500/20 shadow-2xl shadow-emerald-500/20" 
          : "bg-white/95 border-gray-200"
      }`}>
        
    
        <Link to="/" className="flex items-center gap-4 group">
          <div className="relative">
            <img src={logo} alt="Tech & Restore" className="h-16 w-auto rounded-2xl group-hover:scale-110 transition-all duration-500" />
            {darkMode && <div className="absolute inset-0 bg-emerald-500/40 blur-3xl animate-pulse" />}
          </div>
        </Link>

     
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-3">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300
                  ${isActive 
                    ? "bg-gradient-to-r from-lime-500 to-lime-600 text-white rounded-3xl shadow-lg shadow-emerald-500/50" 
                    : darkMode 
                      ? "text-emerald-300 hover:bg-emerald-500/10" 
                      : "text-gray-700 hover:bg-emerald-50"
                  }
                `}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>

   
        <div className="flex items-center gap-4">
          
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-4 rounded-2xl hover:bg-emerald-500/10 transition-all"
              >
                <FiBell size={22} className="text-lime-600 dark:text-emerald-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                    {unreadCount}
                  </span>
                )}
              </button>

              
              {showNotifications && (
                <div className={`absolute right-0 mt-4 w-96 rounded-3xl shadow-2xl overflow-hidden border ${
                  darkMode ? "bg-black/70 backdrop-blur-xl border-emerald-500/40" : "bg-white border-gray-200"
                }`}>
                  <div className="p-6 border-b border-emerald-500/20 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-emerald-500">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-emerald-500">
                      <FiX size={20} />
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {loadingNotifs ? (
                      <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">No notifications</div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`p-5 border-b border-emerald-500/10 hover:bg-emerald-500/10 transition ${!notif.read ? "bg-emerald-500/10" : ""}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-white">{notif.title}</p>
                              <p className="text-sm text-gray-700 mt-1">{notif.message}</p>
                              <p className="text-xs text-emerald-500 mt-2">
                                {new Date(notif.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-3">
                              <button onClick={() => deleteNotification(notif.id)} className="text-red-400 hover:text-red-300">
                                <FiX size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isAuthenticated && (
            <button onClick={onCartClick} className="p-4 rounded-2xl hover:bg-emerald-500/10 transition-all">
              <FiShoppingCart size={22} className="text-lime-600 dark:text-emerald-400" />
            </button>
          )}

          <button
            onClick={toggleDarkMode}
            className={`p-4 rounded-3xl transition-all ${darkMode ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-lime-100 text-lime-600 hover:bg-emerald-200"}`}
          >
            {darkMode ? <FiMoon size={22} /> : <FiSun size={22} />}
          </button>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg"
            >
              <FiLogOut size={20} /> Logout
            </button>
          )}
        </div>
      </nav>

     
      <nav className={`md:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl py-4 px-6 border-b ${
        darkMode ? "bg-black/50 border-emerald-500/20" : "bg-white/95 border-gray-200"
      }`}>
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-14 rounded-xl shadow-lg" /> {/* Bigger on mobile too */}
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <>
                {/* <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-3">
                  <FiBell size={22} className="text-emerald-600 dark:text-emerald-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button> */}
                <button onClick={onCartClick} className="p-3">
                  <FiShoppingCart size={22} className="text-emerald-600 dark:text-emerald-400" />
                </button>
              </>
            )}
            <button onClick={toggleDarkMode} className="p-3">
              {darkMode ? <FiMoon size={20} /> : <FiSun size={20} />}
            </button>
          </div>
        </div>
      </nav>

     
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl py-4 px-6 border-t ${
        darkMode ? "bg-black/50 border-emerald-500/20" : "bg-white/95 border-gray-200"
      }`}>
        <div className="flex justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center gap-1 text-xs font-semibold transition-all
                ${isActive ? "text-emerald-500" : darkMode ? "text-gray-400" : "text-gray-600"}
              `}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </div>

    
      {/* {showNotifications && isAuthenticated && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center md:hidden">
          <div className={`w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl overflow-hidden ${darkMode ? "border-t border-emerald-500/40" : ""}`}>
            <div className="p-6 border-b border-gray-200 dark:border-emerald-500/40 flex justify-between">
              <h3 className="text-xl font-bold text-emerald-500">Notifications</h3>
              <button onClick={() => setShowNotifications(false)}>
                <FiX size={24} className="text-gray-500" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-8 text-center text-gray-500">No notifications</p>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className="p-5 border-b border-gray-200 dark:border-emerald-500/20">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{notif.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
                      </div>
                      <button onClick={() => deleteNotification(notif.id)} className="text-red-500">
                        <FiX size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )} */}
    </>
  );
};

export default Navbar;