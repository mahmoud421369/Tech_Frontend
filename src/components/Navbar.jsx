import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaSearch, FaUser, FaBell } from "react-icons/fa";
import { FiSun, FiMoon, FiShoppingCart, FiLogOut, FiHome, FiTruck } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import logo from "../images/logo.png";
import Swal from "sweetalert2";

const Navbar = ({ cartItems, setCartItems, onCartClick, addToCart, darkMode, toggleDarkMode, updateCartCount }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const cartCount = (cartItems || []).length; // Fallback to empty array if cartItems is undefined

  const fetchCart = useCallback(async () => {
    if (!token || isTokenExpired(token)) return;
    setIsCartLoading(true);
    try {
      const response = await api.get("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = response.data.items || [];
      setCartItems(items);
      updateCartCount(items);
    } catch (error) {
      console.error("Error fetching cart:", error.response?.data || error.message);
      toast.error("Failed to load cart", {
        position: "top-right",
        autoClose: 3000,
      });
      setCartItems([]);
      updateCartCount([]);
    } finally {
      setIsCartLoading(false);
    }
  }, [token, setCartItems, updateCartCount]);

  const fetchNotifications = useCallback(async () => {
    if (!token || isTokenExpired(token)) return;
    try {
      const response = await api.get("/api/notifications/users");
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error.response?.data || error.message);
      toast.error("Failed to load notifications", {
        position: "top-right",
        autoClose: 3000,
      });
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
    const timer = setTimeout(() => setIsInitialLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
      fetchNotifications();
      fetchCart();
    } else {
      setIsAuthenticated(false);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      setToken(null);
      setCartItems([]);
      updateCartCount([]);
      if (location.pathname !== "/login" && location.pathname !== "/signup") {
        Swal.fire({
          title: 'Session Expired',
          text: 'Please login to continue!',
          icon: 'warning',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
        });
        navigate("/login");
      }
    }
  }, [token, location.pathname, navigate, setCartItems, updateCartCount, isTokenExpired, fetchNotifications, fetchCart]);

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
      setCartItems([]);
      updateCartCount([]);
      Swal.fire({
        title: 'Success',
        text: 'Logout successfully!',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
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
      setCartItems([]);
      updateCartCount([]);
      navigate("/login");
    }
  }, [token, navigate, setCartItems, updateCartCount]);

  const handleAddToCart = useCallback(
    async (product) => {
      if (!isAuthenticated) {
        Swal.fire({
          title: 'Not Logged In',
          text: 'Please login to add items to cart',
          icon: 'warning',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
        });
        navigate("/login");
        return;
      }

      setIsCartLoading(true);
      try {
        // Optimistic update: Add item to cart locally
        setCartItems((prev = []) => {
          const existingItem = prev.find((item) => item.productId === product.id);
          if (existingItem) {
            return prev.map((item) =>
              item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
          }
          return [...prev, {
            id: Date.now(),
            productId: product.id,
            productName: product.name,
            productPrice: product.price,
            quantity: 1,
            imageUrl: product.imageUrl || (product.imageUrls && product.imageUrls[0]),
          }];
        });
        updateCartCount([...(cartItems || []), {
          id: Date.now(),
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          quantity: 1,
          imageUrl: product.imageUrl || (product.imageUrls && product.imageUrls[0]),
        }]);

        // Update server cart
        await api.post("/api/cart/items", {
          productId: product.id,
          quantity: 1,
          price: product.price,
          name: product.name,
          imageUrl: product.imageUrl || (product.imageUrls && product.imageUrls[0]),
        });

        // Update local cart in App
        addToCart({
          id: product.id,
          price: product.price,
          name: product.name,
          imageUrl: product.imageUrl || (product.imageUrls && product.imageUrls[0]),
        });

        toast.success(`${product.name} added to cart!`, {
          position: "top-end",
          autoClose: 1500,
        });
      } catch (error) {
        console.error("Error adding to cart:", error.response?.data || error.message);
        // Revert optimistic update
        setCartItems((prev = []) => prev.filter((item) => item.productId !== product.id));
        updateCartCount(cartItems || []);
        toast.error(error.response?.data?.message || "Failed to add item to cart", {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setIsCartLoading(false);
      }
    },
    [addToCart, isAuthenticated, navigate, setCartItems, cartItems, updateCartCount]
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

  const filterRecentNotifications = (notifications) => {
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = Date.now();
    return notifications.filter((notification) => {
      const timestamp = new Date(notification.createdAt || notification.timestamp).getTime();
      return !isNaN(timestamp) && now - timestamp <= oneDayInMs;
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
        className={`flex justify-between items-center px-6 py-4 w-full fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse`}
      >
        <div className="flex items-center gap-2">
          <div className="h-12 w-12 bg-gray-300 rounded-full"></div>
          <div className="h-8 w-40 bg-gray-300 rounded"></div>
        </div>
        <div className="hidden md:flex space-x-6">
          {Array.from({ length: isAuthenticated ? 4 : 3 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-300 rounded-xl"></div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
          {isAuthenticated && (
            <>
              <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
              <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
              <div className="h-8 w-24 bg-gray-300 rounded-xl"></div>
            </>
          )}
        </div>
      </div>
    ),
    [isAuthenticated]
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      {isInitialLoading ? (
        SkeletonLoader
      ) : (
        <nav
          className={`flex items-center justify-between py-4 px-6 fixed top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-black dark:to-gray-950 shadow-md hidden md:flex`}
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
                      ? "bg-indigo-700 text-white shadow-sm"
                      : "text-white hover:bg-indigo-500"
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
              className="p-2 rounded-full transition-all duration-200 transform hover:-translate-y-1 text-white hover:bg-indigo-500"
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <FiSun className="w-6 h-6" /> : <FiMoon className="w-6 h-6" />}
            </button>

            {isAuthenticated && (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-white hover:bg-indigo-500 rounded-full transition-all duration-200 transform hover:-translate-y-1"
                    aria-label="View notifications"
                  >
                    <FaBell className="w-6 h-6" />
                    {filterRecentNotifications(notifications).length > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {filterRecentNotifications(notifications).length}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-indigo-600 rounded-xl shadow-lg border border-indigo-700 max-h-96 overflow-y-auto z-50">
                      <div className="p-4 border-b border-indigo-700">
                        <h3 className="text-lg font-semibold text-white">
                          Notifications
                        </h3>
                      </div>
                      {filterRecentNotifications(notifications).length === 0 ? (
                        <div className="p-4 text-center text-white">
                          No recent notifications
                        </div>
                      ) : (
                        filterRecentNotifications(notifications).map((notification, index) => (
                          <div
                            key={index}
                            className="p-4 border-b border-indigo-700 last:border-b-0 hover:bg-indigo-500 transition-colors"
                          >
                            <p className="text-sm text-white">
                              {notification.message || "No message"}
                            </p>
                            <p className="text-xs text-white/80 mt-1">
                              {formatDate(notification.createdAt || notification.timestamp)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={onCartClick}
                  className="relative p-2 text-white hover:bg-indigo-500 rounded-full transition-all duration-200 transform hover:-translate-y-1"
                  aria-label="View cart"
                >
                  <FiShoppingCart className="w-6 h-6" />
                  {/* {isCartLoading ? (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-spin">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  ) :  */}
                  {cartCount > 0 ? (
                    <span className="absolute top-0 right-0 bg-white text-indigo-600 text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ">
                      {cartCount}
                    </span>
                  ) : null}
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-700 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all duration-200 transform hover:-translate-y-1"
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
          className={`md:hidden flex justify-between items-center px-4 py-3 w-full fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse`}
        >
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
            <div className="h-6 w-32 bg-gray-300 rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
            {isAuthenticated && (
              <>
                <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
              </>
            )}
          </div>
        </div>
      ) : (
        <nav
          className={`md:hidden flex justify-between items-center px-4 py-3 w-full fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-black dark:to-gray-950 border-b border-indigo-700`}
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
              className="p-2 rounded-full transition-all duration-200 transform hover:-translate-y-1 text-white hover:bg-indigo-500"
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            {isAuthenticated && (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-white hover:bg-indigo-500 rounded-full transition-all duration-200 transform hover:-translate-y-1"
                    aria-label="View notifications"
                  >
                    <FaBell className="w-5 h-5" />
                    {filterRecentNotifications(notifications).length > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {filterRecentNotifications(notifications).length}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-64 bg-indigo-600 rounded-xl shadow-lg border border-indigo-700 max-h-80 overflow-y-auto z-50">
                      <div className="p-4 border-b border-indigo-700">
                        <h3 className="text-lg font-semibold text-white">
                          Notifications
                        </h3>
                      </div>
                      {filterRecentNotifications(notifications).length === 0 ? (
                        <div className="p-4 text-center text-white">
                          No recent notifications
                        </div>
                      ) : (
                        filterRecentNotifications(notifications).map((notification, index) => (
                          <div
                            key={index}
                            className="p-4 border-b border-indigo-700 last:border-b-0 hover:bg-indigo-500 transition-colors"
                          >
                            <p className="text-sm text-white">
                              {notification.message || "No message"}
                            </p>
                            <p className="text-xs text-white/80 mt-1">
                              {formatDate(notification.createdAt || notification.timestamp)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={onCartClick}
                  className="relative p-2 text-white hover:bg-indigo-500 rounded-full transition-all duration-200 transform hover:-translate-y-1"
                  aria-label="View cart"
                >
                  <FiShoppingCart className="w-5 h-5" />
                  {/* {isCartLoading ? (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-spin">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  ) : */}
                   {cartCount > 0 ? (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {cartCount}
                    </span>
                  ) : null }
                </button>
              </>
            )}
          </div>
        </nav>
      )}

      {!isInitialLoading && (
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 w-full z-50 flex justify-around py-3 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-black dark:to-gray-950 border-t border-indigo-700`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center text-sm font-semibold transition-all duration-200 transform hover:-translate-y-1 ${
                  isActive
                    ? "text-white"
                    : "text-white/80 hover:text-white"
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