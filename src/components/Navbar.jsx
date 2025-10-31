
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaSearch, FaUser, FaBell, FaStore } from "react-icons/fa";
import { FiSun, FiMoon, FiShoppingCart, FiLogOut, FiHome, FiTruck, FiSmartphone } from "react-icons/fi";
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
  const isFetchingCart = useRef(false); // Prevent duplicate fetches

  const cartCount = (cartItems || []).length;

  // Check token expiration
  const isTokenExpired = useCallback((token) => {
    try {
      const decoded = jwtDecode(token);
      if (!decoded.exp) return true;
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }, []);

  // Debounce function to limit API calls
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Fetch Cart
  const fetchCart = useCallback(async (controller) => {
    if (!token || isTokenExpired(token) || isFetchingCart.current) return;
    isFetchingCart.current = true;
    setIsCartLoading(true);
    try {
      const response = await api.get("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      const items = response.data.items || [];
      setCartItems(items);
      updateCartCount(items);
    } catch (error) {
      if (error.name !== "AbortError") {
        setCartItems([]);
        updateCartCount([]);
        // toast.error("Failed to fetch cart", { position: "top-end", autoClose: 1500 });
      }
    } finally {
      setIsCartLoading(false);
      isFetchingCart.current = false;
    }
  }, [token, setCartItems, updateCartCount, isTokenExpired]);

  // Debounced fetchCart
  const debouncedFetchCart = useMemo(() => debounce(fetchCart, 500), [fetchCart]);

  // Fetch Notifications (kept commented as in original)
  // const fetchNotifications = useCallback(async (controller) => {
  //   if (!token || isTokenExpired(token)) return;
  //   try {
  //     const response = await api.get("/api/notifications/users", {
  //       headers: { Authorization: `Bearer ${token}` },
  //       signal: controller.signal,
  //     });
  //     setNotifications(response.data || []);
  //   } catch (error) {
  //     if (error.name !== "AbortError") {
  //       setNotifications([]);
  //     }
  //   }
  // }, [token, isTokenExpired]);

  // Handle Logout
  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (token && refreshToken) {
        await api.post("/api/auth/logout", { refreshToken });
      }
      localStorage.clear();
      setToken(null);
      setIsAuthenticated(false);
      setNotifications([]);
      setCartItems([]);
      updateCartCount([]);
      toast.success("Logged out successfully!", { position: "top-end", autoClose: 1500 });
      navigate("/login");
    } catch (err) {
      localStorage.clear();
      setToken(null);
      setIsAuthenticated(false);
      setNotifications([]);
      setCartItems([]);
      updateCartCount([]);
      navigate("/login");
    }
  }, [token, navigate, setCartItems, updateCartCount]);

  // Handle Add to Cart
  const handleAddToCart = useCallback(
    async (product) => {
      if (!isAuthenticated) {
        Swal.fire({
          title: "Login Required",
          text: "Please log in to add items",
          icon: "warning",
          toast: true,
          position: "top-end",
          timer: 1500,
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
        navigate("/login");
        return;
      }

      setIsCartLoading(true);
      try {
        setCartItems((prev = []) => {
          const existing = prev.find((i) => i.productId === product.id);
          if (existing) {
            return prev.map((i) =>
              i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
            );
          }
          return [
            ...prev,
            {
              id: Date.now(),
              productId: product.id,
              productName: product.name,
              productPrice: product.price,
              quantity: 1,
              imageUrl: product.imageUrl || product.imageUrls?.[0],
            },
          ];
        });

        await api.post("/api/cart/items", {
          productId: product.id,
          quantity: 1,
          price: product.price,
          name: product.name,
          imageUrl: product.imageUrl || product.imageUrls?.[0],
        });

        addToCart?.({
          id: product.id,
          price: product.price,
          name: product.name,
          imageUrl: product.imageUrl || product.imageUrls?.[0],
        });

        toast.success(`${product.name} added!`, {
          position: "top-end",
          autoClose: 1500,
        });
      } catch (error) {
        setCartItems((prev = []) => prev.filter((i) => i.productId !== product.id));
        toast.error("Failed to add to cart", { position: "top-end" });
      } finally {
        setIsCartLoading(false);
      }
    },
    [addToCart, isAuthenticated, navigate, setCartItems]
  );

  // Initial Loading
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Authentication Check
  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      localStorage.clear();
      setToken(null);
      setCartItems([]);
      updateCartCount([]);
      if (!["/login", "/signup"].includes(location.pathname)) {
        Swal.fire({
          title: "Session Expired",
          text: "Please log in again",
          icon: "warning",
          toast: true,
          position: "top-end",
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
        navigate("/login");
      }
    }
  }, [token, location.pathname, navigate, setCartItems, updateCartCount, isTokenExpired]);

  // Fetch Cart
  useEffect(() => {
    const controller = new AbortController();
    if (isAuthenticated) {
      debouncedFetchCart(controller);
    }
    return () => controller.abort();
  }, [isAuthenticated, debouncedFetchCart]);

  // Fetch Notifications (kept commented as in original)
  // useEffect(() => {
  //   const controller = new AbortController();
  //   if (isAuthenticated) {
  //     fetchNotifications(controller);
  //   }
  //   return () => controller.abort();
  // }, [isAuthenticated, fetchNotifications]);

  // Click Outside for Notifications
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date) => {
    if (!date) return "Just now";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const recentNotifications = useMemo(() => {
    const oneDay = 24 * 60 * 60 * 1000;
    return (notifications || []).filter((n) => {
      const time = new Date(n.createdAt || n.timestamp).getTime();
      return !isNaN(time) && Date.now() - time <= oneDay;
    });
  }, [notifications]);

  const navItems = useMemo(
    () =>
      isAuthenticated
        ? [
            { name: "Home", path: "/", icon: <FiHome /> },
            { name: "Devices", path: "/devices", icon: <FiSmartphone /> },
            { name: "Shops", path: "/shops", icon: <FaStore /> },
            { name: "Track", path: "/track", icon: <FiTruck /> },
            { name: "Account", path: "/account", icon: <FaUser /> },
          ]
        : [
            { name: "Home", path: "/", icon: <FiHome /> },
            { name: "Login", path: "/login", icon: <FaUser /> },
            { name: "Signup", path: "/signup", icon: <FaUser /> },
          ],
    [isAuthenticated]
  );

  const SkeletonLoader = (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 animate-pulse">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          <div className="w-32 h-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="hidden md:flex gap-6">
          {Array(4).fill().map((_, i) => (
            <div key={i} className="w-24 h-8 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ToastContainer position="top-end" autoClose={2000} />

      {/* Desktop Navbar */}
      {isInitialLoading ? (
        SkeletonLoader
      ) : (
        <nav
          className={`hidden md:flex items-center justify-between px-6 py-4 fixed top-0 left-0 right-0 z-50 backdrop-blur-xl ${
            darkMode
              ? "bg-gray-900/90 border-b border-gray-800"
              : "bg-white/90 border-b border-gray-200"
          } shadow-lg`}
        >
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <img
              src={logo}
              alt="Tech & Restore"
              className="h-12 w-12 object-contain rounded-xl shadow-md"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Tech & Restore
            </h1>
          </Link>

          {/* Nav Links */}
          <div className="flex gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg"
                      : darkMode
                      ? "text-gray-300 hover:bg-gray-800"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Dark Mode */}
            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                darkMode ? "bg-gray-800 text-yellow-400" : "bg-gray-100 text-indigo-600"
              } hover:scale-110`}
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {isAuthenticated && (
              <>
                {/* Notifications (commented as in original) */}
                {/* <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2.5 rounded-xl transition-all ${
                      darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                    }`}
                  >
                    <FaBell size={20} className={darkMode ? "text-gray-300" : "text-gray-700"} />
                    {recentNotifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {recentNotifications.length}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div
                      className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl overflow-hidden border ${
                        darkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      } max-h-96`}
                    >
                      <div className="p-4 border-b border-gray-700 dark:border-gray-600">
                        <h3 className="font-bold text-lg">Notifications</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {recentNotifications.length === 0 ? (
                          <p className="p-4 text-center text-gray-500">No new notifications</p>
                        ) : (
                          recentNotifications.map((n, i) => (
                            <div
                              key={i}
                              className={`p-4 border-b border-gray-700 dark:border-gray-600 last:border-0 hover:bg-indigo-500/10 transition`}
                            >
                              <p className="text-sm font-medium">{n.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(n.createdAt)}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div> */}

                {/* Cart */}
                <button
                  onClick={onCartClick}
                  className={`relative p-2.5 rounded-xl transition-all ${
                    darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                  }`}
                >
                  <FiShoppingCart size={22} className={darkMode ? "text-gray-300" : "text-gray-700"} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105"
                >
                  <FiLogOut />
                  Logout
                </button>
              </>
            )}
          </div>
        </nav>
      )}

      {/* Mobile Navbar */}
      {isInitialLoading ? (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-3 animate-pulse">
          <div className="flex justify-between">
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="w-24 h-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </div>
      ) : (
        <nav
          className={`md:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-xl py-3 px-4 ${
            darkMode ? "bg-gray-900/90 border-b border-gray-800" : "bg-white/90 border-b border-gray-200"
          }`}
        >
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg shadow" />
              <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Tech & Restore
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-xl ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
              >
                {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
              </button>

              {isAuthenticated && (
                <>
                  {/* Notifications (commented as in original) */}
                  {/* <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2"
                    >
                      <FaBell size={18} />
                      {recentNotifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4"></span>
                      )}
                    </button>
                    {showNotifications && (
                      <div className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-xl border ${
                        darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                      }`}>
                        <div className="p-3 border-b">Notifications</div>
                        {recentNotifications.length === 0 ? (
                          <p className="p-3 text-center text-sm text-gray-500">No alerts</p>
                        ) : (
                          recentNotifications.slice(0, 3).map((n, i) => (
                            <div key={i} className="p-3 border-b last:border-0 text-sm">
                              {n.message}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div> */}

                  <button onClick={onCartClick} className="relative p-2">
                    <FiShoppingCart size={20} />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Bottom Nav */}
      {!isInitialLoading && (
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl py-3 px-4 border-t ${
            darkMode ? "bg-gray-900/90 border-gray-800" : "bg-white/90 border-gray-200"
          }`}
        >
          <div className="flex justify-around">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 text-xs font-medium transition-all ${
                    isActive
                      ? "text-indigo-600"
                      : darkMode ? "text-gray-400" : "text-gray-600"
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
