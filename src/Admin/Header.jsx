/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FiSettings, FiLogOut, FiUser, FiChevronDown,
  FiHome, FiUsers, FiStar, FiTag, FiList, FiMoon, FiSun,
  FiBox, FiTool, FiClipboard, FiMenu, FiSearch, FiX, FiDollarSign
} from "react-icons/fi";
import {
  RiAccountBox2Line, RiGift2Line, RiStore2Line, RiStore3Line, RiTruckLine
} from "react-icons/ri";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../images/logo-bg.png";
import Swal from "sweetalert2";
import api from "../api";
import { jwtDecode } from "jwt-decode";

const Header = () => {
  
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileMenu] = useState(false); // unused now but kept in case
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const user = {
    name: "Mahmoud Ali",
    email: "tech@repairdevices.com",
  };

  const menuItems = useMemo(
    () => [
      { name: "dashboard", icon: <FiHome />, label: "Dashboard", path: "/dashboard" },
      { name: "users", icon: <FiUsers />, label: "Users", path: "/users" },
      {
        name: "shops",
        icon: <RiStore3Line />,
        label: "Shop",
        subMenu: [
          { name: "shops", icon: <RiStore2Line />, label: "Stores", path: "/repair-shops" },
          { name: "subscriptions", icon: <RiAccountBox2Line />, label: "Subscription", path: "/shop/subscriptions" },
          { name: "products", icon: <FiBox />, label: "Products", path: "/admin/products" },
          { name: "repair requests", icon: <FiTool />, label: "Repair Requests", path: "/admin/repair-requests" },
          { name: "offers", icon: <FiTag />, label: "Offers", path: "/admin/offers" },
          { name: "reviews", icon: <FiStar />, label: "Reviews", path: "/reviews" },
        ],
      },
      { name: "categories", icon: <FiList />, label: "Categories", path: "/category" },
      { name: "transactions", icon: <FiDollarSign />, label: "Transactions", path: "/admin/transactions" },
      { name: "delivery", icon: <RiTruckLine />, label: "Delivery", path: "/deliveries" },
      { name: "assigners", icon: <RiGift2Line />, label: "Assigner", path: "/assigners" },
      { name: "assignment-logs", icon: <FiClipboard />, label: "Assignment Logs", path: "/admin/assignment-logs" },
    ],
    []
  );

  /* ------------------------------------------------------------------ */
  /*  AUTH & JWT                                                        */
  /* ------------------------------------------------------------------ */
  const safeDecodeJwt = useCallback((token) => {
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
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
    } catch (err) { /* ignore */ }
    localStorage.clear();
    setToken(null);
    setIsAuthenticated(false);
    Swal.fire({ title: "Logged out!", icon: "success", timer: 1500, showConfirmButton: false });
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
  /*  DARK MODE                                                         */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
    document.documentElement.classList.toggle("dark", newMode);
  };

  /* ------------------------------------------------------------------ */
  /*  SEARCH FILTERING                                                  */
  /* ------------------------------------------------------------------ */
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const q = searchQuery.toLowerCase();
    return menuItems
      .map(item => {
        const matchesMain = item.label.toLowerCase().includes(q);
        if (item.subMenu) {
          const filteredSub = item.subMenu.filter(s => s.label.toLowerCase().includes(q));
          return matchesMain || filteredSub.length > 0 ? { ...item, subMenu: filteredSub } : null;
        }
        return matchesMain ? item : null;
      })
      .filter(Boolean);
  }, [menuItems, searchQuery]);

  return (
    <>
   
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      
      <nav className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/95 dark:bg-black/40 backdrop-blur-2xl border-r border-gray-200 dark:border-emerald-500/30 shadow-2xl transition-all duration-500 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-emerald-500/30">
            <div className="flex items-center justify-center relative group">
              <img src={logo} alt="Tech & Bazaar" className="h-28 object-contain drop-shadow-2xl group-hover:scale-105 transition-all duration-500" />
              {darkMode && <div className="absolute inset-0 bg-emerald-500/30 blur-3xl animate-pulse" />}
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 lg:hidden text-gray-500 hover:text-emerald-500">
              <FiX size={24} />
            </button>
          </div>

          <ul className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
            {filteredMenuItems.map(item => (
              <li key={item.name}>
                {item.subMenu ? (
                  <div>
                    <button
                      onClick={() => setShopDropdownOpen(prev => prev === item.name ? null : item.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all ${darkMode ? "text-emerald-400 hover:bg-emerald-500/10" : "text-gray-700 hover:bg-emerald-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-600 dark:text-emerald-400 text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <FiChevronDown className={`transition-transform ${shopDropdownOpen === item.name ? "rotate-180" : ""}`} />
                    </button>
                    {shopDropdownOpen === item.name && (
                      <ul className="mt-2 ml-10 space-y-4">
                        {item.subMenu.map(sub => (
                          <li key={sub.name}>
                            <Link
                              to={sub.path}
                              onClick={() => setIsSidebarOpen(false)}
                              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${darkMode ? "text-emerald-300 hover:bg-emerald-500/10" : "text-gray-600 hover:bg-emerald-50"}`}
                            >
                              <span className="text-emerald-600 dark:text-emerald-400 text-base">{sub.icon}</span>
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${darkMode ? "text-emerald-400 hover:bg-emerald-500/10" : "text-gray-700 hover:bg-emerald-50"}`}
                  >
                    <span className="text-emerald-600 dark:text-emerald-400 text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      
      <header className={`fixed top-0 left-0 right-0 h-20 z-40 flex items-center justify-between px-6 shadow-lg lg:pl-64 transition-all duration-500 ${
        darkMode 
          ? "bg-gray-950/95 backdrop-blur-2xl border-b border-emerald-500/30" 
          : "bg-white/95 border-b border-gray-200"
      }`}>
        
        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition">
          <FiMenu size={24} />
        </button>

        <div className="flex items-center gap-6 ml-auto">
          
          <div className="relative hidden lg:block">
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-80 pl-12 pr-6 py-4 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all ${
                darkMode 
                  ? "bg-emerald-950/50 border border-emerald-500/40 text-white placeholder-emerald-400" 
                  : "bg-gray-100 border border-gray-300 text-gray-900"
              }`}
            />
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={20} />
          </div>

        
          <button onClick={toggleDarkMode} className={`p-4 rounded-2xl transition-all ${
            darkMode 
              ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/50" 
              : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
          }`}>
            {darkMode ? <FiMoon size={22} /> : <FiSun size={22} />}
          </button>

          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg"
          >
            <FiLogOut size={20} /> Logout
          </button>
        </div>
      </header>
    </>
  );
};

export default Header;