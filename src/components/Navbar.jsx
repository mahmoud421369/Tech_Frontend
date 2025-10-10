import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaSearch, FaUser, FaBell } from "react-icons/fa";
import { FiSun, FiMoon, FiShoppingCart, FiLogOut, FiHome, FiTruck } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import logo from "../images/logo.png";

const Navbar = ({ cartCount, setCartCount, onCartClick, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const fetchCartCount = useCallback(async () => {
    if (!token || isTokenExpired(token)) return;
    try {
      const response = await api.get("/api/cart/items/count");
      setCartCount(response.data.count || 0);
    } catch (error) {
      console.error("Error fetching cart count:", error.response?.data || error.message);
    }
  }, [token, setCartCount]);

  const fetchNotifications = useCallback(async () => {
    if (!token || isTokenExpired(token)) return;
    try {
      const response = await api.get("/api/notifications/users");
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error.response?.data || error.message);
      toast.error("Failed to load notifications");
    }
  }, [token]);

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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
      fetchCartCount();
      fetchNotifications();
    } else {
      setIsAuthenticated(false);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      setToken(null);
      setCartCount(0);
      setNotifications([]);
      if (location.pathname !== "/login" && location.pathname !== "/signup") {
        toast.warn("Session Expired. Please log in to continue.", {
          position: "top-right",
        });
        navigate("/login");
      }
    }
  }, [token, location.pathname, navigate, fetchCartCount, setCartCount, isTokenExpired]);

  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (token && refreshToken) {
        await api.post("/api/auth/logout", { refreshToken });
      }
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      setToken(null);
      setIsAuthenticated(false);
      setNotifications([]);
      toast.success("Logged out successfully!", {
        position: "top-right",
        autoClose: 2000,
      });
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to log out", {
        position: "top-right",
      });
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      setToken(null);
      setIsAuthenticated(false);
      setNotifications([]);
      navigate("/login");
    }
  }, [token, navigate]);

  const handleAddToCart = useCallback(
    async (product) => {
      try {
        await api.post("/api/cart/items", {
          productId: product.id,
          quantity: 1,
          price: product.price,
          name: product.name,
          imageUrl: product.imageUrl || (product.imageUrls && product.imageUrls[0]),
        });
        await fetchCartCount();
        toast.success(`${product.name} added to cart!`, {
          position: "top-end",
          autoClose: 1500,
        });
      } catch (error) {
        console.error("Error adding to cart:", error.response?.data || error.message);
        toast.error(error.response?.data?.message || "Failed to add item to cart", {
          position: "top-right",
        });
      }
    },
    [fetchCartCount]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const navItems = useMemo(
    () =>
      isAuthenticated
        ? [
            { name: "Home", path: "/", icon: <FiHome size={20} /> },
            { name: "Explore", path: "/explore", icon: <FaSearch size={20} /> },
            { name: "Track", path: "/track", icon: <FiTruck size={20} /> },
            { name: "Account", path: "/account", icon: <FaUser size={20} /> },
          ]
        : [
            { name: "Home", path: "/", icon: <FiHome size={20} /> },
            { name: "Login", path: "/login", icon: <FaUser size={20} /> },
            { name: "Signup", path: "/signup", icon: <FaUser size={20} /> },
          ],
    [isAuthenticated]
  );

  const SkeletonLoader = useMemo(
    () => (
      <div
        className={`flex justify-between items-center px-6 py-4 w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          darkMode ? "bg-gray-900" : "bg-gradient-to-r from-indigo-600 to-blue-600"
        } animate-pulse`}
      >
        <div className="flex items-center gap-2">
          <div className="h-12 w-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          <div className="h-8 w-40 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="hidden md:flex space-x-6">
          {Array.from({ length: isAuthenticated ? 4 : 3 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          {isAuthenticated && (
            <>
              <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="h-8 w-24 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
            </>
          )}
        </div>
      </div>
    ),
    [darkMode, isAuthenticated]
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      {isInitialLoading ? (
        SkeletonLoader
      ) : (
        <nav
          className={`flex items-center justify-between py-4 px-6 fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
            darkMode
              ? "bg-gray-900 shadow-lg"
              : "bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md"
          } ${isScrolled ? "rounded-b-2xl max-w-7xl mx-auto" : ""} animate-fade-in hidden md:flex`}
        >
          <Link
            to="/"
            className="flex items-center gap-2 transform hover:-translate-y-1 transition-all duration-200"
            aria-label="Tech & Restore Home"
          >
            <img src={logo} className="h-12 w-auto object-cover" alt="Tech & Restore Logo" />
            <h2 className="text-white text-2xl font-extrabold tracking-tight">
              Tech & Restore
            </h2>
          </Link>

          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:-translate-y-1 ${
                    isActive
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400"
                      : "text-white hover:bg-indigo-700/50 dark:hover:bg-gray-700"
                  }`
                }
                aria-label={item.name}
              >
                {item.icon && <span className="mr-2">{item.icon}</span>}
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-all duration-200 transform hover:-translate-y-1 ${
                darkMode
                  ? "text-yellow-300 hover:bg-gray-800"
                  : "text-white hover:bg-indigo-700/50"
              }`}
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <FiSun className="w-6 h-6" /> : <FiMoon className="w-6 h-6" />}
            </button>

            {isAuthenticated && (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-white hover:bg-indigo-700/50 dark:hover:bg-gray-800 rounded-full transition-all duration-200 transform hover:-translate-y-1"
                    aria-label="View notifications"
                  >
                    <FaBell className="w-6 h-6" />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          Notifications
                        </h3>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No notifications available
                        </div>
                      ) : (
                        notifications.map((notification, index) => (
                          <div
                            key={index}
                            className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <p className="text-sm text-gray-700 dark:text-gray-200">
                              {notification.message || "No message"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDate(notification.timestamp)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={onCartClick}
                  className="relative p-2 text-white hover:bg-indigo-700/50 dark:hover:bg-gray-800 rounded-full transition-all duration-200 transform hover:-translate-y-1"
                  aria-label="View cart"
                >
                  <FiShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-white/30 dark:bg-black/30 text-white text-sm font-semibold rounded-xl hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-200 transform hover:-translate-y-1"
                  aria-label="Log out"
                >
                  <FiLogOut className="w-5 h-5" />
                  Logout
                </button>
              </>
            )}
          </div>
        </nav>
      )}

      {isInitialLoading ? (
        <div
          className={`md:hidden flex justify-between items-center px-4 py-3 w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            darkMode ? "bg-gray-900 border-b border-gray-700" : "bg-gradient-to-r from-indigo-600 to-blue-600"
          } animate-pulse`}
        >
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            {isAuthenticated && (
              <>
                <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              </>
            )}
          </div>
        </div>
      ) : (
        <nav
          className={`md:hidden flex justify-between items-center px-4 py-3 w-full fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            darkMode ? "bg-gray-900 border-b border-gray-700" : "bg-gradient-to-r from-indigo-600 to-blue-600"
          } ${isScrolled ? "rounded-b-2xl max-w-7xl mx-auto" : ""} animate-fade-in`}
        >
          <Link
            to="/"
            className="flex items-center gap-2 transform hover:-translate-y-1 transition-all duration-200"
            aria-label="Tech & Restore Home"
          >
            <img src={logo} className="h-10 w-auto object-cover" alt="Tech & Restore Logo" />
            <h2 className="text-white text-xl font-bold">Tech & Restore</h2>
          </Link>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-all duration-200 transform hover:-translate-y-1 ${
                darkMode
                  ? "text-yellow-300 hover:bg-gray-800"
                  : "text-white hover:bg-indigo-700/50"
              }`}
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            {isAuthenticated && (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-white hover:bg-indigo-700/50 dark:hover:bg-gray-800 rounded-full transition-all duration-200 transform hover:-translate-y-1"
                    aria-label="View notifications"
                  >
                    <FaBell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-50">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          Notifications
                        </h3>
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No notifications available
                        </div>
                      ) : (
                        notifications.map((notification, index) => (
                          <div
                            key={index}
                            className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <p className="text-sm text-gray-700 dark:text-gray-200">
                              {notification.message || "No message"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={onCartClick}
                  className="relative p-2 text-white hover:bg-indigo-700/50 dark:hover:bg-gray-800 rounded-full transition-all duration-200 transform hover:-translate-y-1"
                  aria-label="View cart"
                >
                  <FiShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>
        </nav>
      )}

      {!isInitialLoading && (
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 w-full z-50 flex justify-around py-3 shadow-lg transition-all duration-300 ${
            darkMode ? "bg-gray-900 border-t border-gray-700" : "bg-white border-t border-gray-200"
          } animate-fade-in`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center text-sm font-semibold transition-all duration-200 transform hover:-translate-y-1 ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : darkMode
                    ? "text-gray-300 hover:text-gray-100"
                    : "text-gray-700 hover:text-gray-900"
                }`
              }
              aria-label={item.name}
            >
              {item.icon && <span className="mb-1 text-xl">{item.icon}</span>}
              {item.name}
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
};

export default Navbar;