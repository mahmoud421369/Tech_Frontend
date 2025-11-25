import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  FiSun,
  FiMoon,
  FiShoppingCart,
  FiLogOut,
  FiHome,
  FiTruck,
  FiSmartphone,
} from "react-icons/fi";
import { FaStore, FaUser } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import logo from "../images/logo-bg.png";

const Navbar = ({
  onCartClick,
  darkMode,
  toggleDarkMode,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  /* ------------------------------------------------------------------ */
  /*  SAFE JWT DECODE                                                   */
  /* ------------------------------------------------------------------ */
  const safeDecodeJwt = useCallback((token) => {
    if (!token || typeof token !== "string" || token.trim() === "") return null;
    try {
      return jwtDecode(token);
    } catch (error) {
      console.warn("Invalid JWT token:", error.message);
      return null;
    }
  }, []);

  const isTokenExpired = useCallback(
    (token) => {
      const decoded = safeDecodeJwt(token);
      if (!decoded) return true;
      return !decoded.exp || decoded.exp < Date.now() / 1000;
    },
    [safeDecodeJwt]
  );

  /* ------------------------------------------------------------------ */
  /*  LOGOUT                                                            */
  /* ------------------------------------------------------------------ */
  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (token && refreshToken) {
        await api.post("/api/auth/logout", { refreshToken });
      }
    } catch (err) {
      console.warn("Logout API failed (ignored):", err);
    } finally {
      localStorage.clear();
      setToken(null);
      setIsAuthenticated(false);
      toast.success("Logged out!", { autoClose: 1500 });
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  /* ------------------------------------------------------------------ */
  /*  AUTH CHECK + REDIRECT UNAUTHENTICATED USERS                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const checkAuth = () => {
      const currentToken = localStorage.getItem("authToken");

      if (!currentToken || currentToken.trim() === "") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        setToken(null);
        setIsAuthenticated(false);
        return;
      }

      setToken(currentToken);

      if (!isTokenExpired(currentToken)) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        setToken(null);
        setIsAuthenticated(false);

        const publicPaths = ["/login", "/signup"];
        if (!publicPaths.includes(location.pathname)) {
          toast.warn("Session expired. Please log in again.", { autoClose: 2000 });
          navigate("/login", { replace: true });
        }
      }
    };

    checkAuth();
  }, [location.pathname, navigate, isTokenExpired]);

  /* ------------------------------------------------------------------ */
  /*  INITIAL LOADING SKELETON                                          */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  NAV ITEMS                                                         */
  /* ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------ */
  /*  SKELETON LOADER                                                   */
  /* ------------------------------------------------------------------ */
  const SkeletonLoader = (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm p-4 animate-pulse border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gray-300 rounded-xl"></div>
          <div className="w-40 h-7 bg-gray-300 rounded"></div>
        </div>
        <div className="hidden md:flex gap-6">
          {Array(4)
            .fill()
            .map((_, i) => (
              <div
                key={i}
                className="w-28 h-10 bg-gray-300 rounded-full"
              ></div>
            ))}
        </div>
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  RENDER                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <>
      <ToastContainer position="top-end" autoClose={2000} />

      {/* Desktop Navbar */}
      {isInitialLoading ? (
        SkeletonLoader
      ) : (
        <nav
          className={`hidden md:flex items-center justify-between px-6 py-4 fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b ${
            darkMode
              ? "bg-gray-900/95 border-gray-800"
              : "bg-gradient-to-r from-white via-gray-50 to-white border-gray-200"
          } shadow-sm`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="Tech & Restore"
              className="h-12 w-56 object-cover rounded-xl  transition-all"
            />
            {/* <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
              Tech & Bazaar
            </h1> */}
          </Link>

          {/* Nav Links */}
          <div className="flex gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-lime-500 to-lime-600 text-white  shadow-md"
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
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl transition-all duration-300 ${
                darkMode
                  ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } hover:scale-110`}
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>

            {/* Cart Icon (No Count, Just Icon) */}
            {isAuthenticated && (
              <button
                onClick={onCartClick}
                className={`p-2.5 rounded-xl transition-all ${
                  darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                }`}
              >
                <FiShoppingCart
                  size={22}
                  className={darkMode ? "text-gray-300" : "text-gray-700"}
                />
              </button>
            )}

            {/* Logout */}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105"
              >
                <FiLogOut />
                Logout
              </button>
            )}
          </div>
        </nav>
      )}

      {/* Mobile Top Bar */}
      {isInitialLoading ? (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm p-3 animate-pulse border-b border-gray-200">
          <div className="flex justify-between">
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="w-24 h-5 bg-gray-300 rounded"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      ) : (
        <nav
          className={`md:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-xl py-3 px-4 border-b ${
            darkMode
              ? "bg-gray-900/95 border-gray-800"
              : "bg-gradient-to-r from-white via-gray-50 to-white border-gray-200"
          }`}
        >
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logo}
                alt="Logo"
                className="h-12 w-12 rounded-xl shadow-md ring-2 ring-gray-300"
              />
              <span className="font-bold text-lg bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
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
                <button
                  onClick={onCartClick}
                  className="p-2"
                >
                  <FiShoppingCart size={20} className={darkMode ? "text-gray-300" : "text-gray-700"} />
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Mobile Bottom Navigation */}
      {!isInitialLoading && (
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl py-3 px-4 border-t ${
            darkMode
              ? "bg-gray-900/95 border-gray-800"
              : "bg-gradient-to-r from-white via-gray-50 to-white border-gray-200"
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
                      ? "text-lime-600"
                      : darkMode
                      ? "text-gray-400"
                      : "text-gray-600"
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