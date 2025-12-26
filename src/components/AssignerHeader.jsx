import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FiMoon,
  FiSun,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiActivity,
  FiUsers,
  FiBox,
  FiTool,
  FiClipboard,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import api from "../api";

const AssignerHeader = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

 
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);


  const isTokenExpired = useCallback((token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      return !decoded.exp || decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }, []);

  
  const menuItems = useMemo(
    () => [
      { name: "Dashboard", path: "/assigner-dashboard", icon: <FiActivity size={20} /> },
      { name: "Delivery", path: "/assigner/delivery-persons", icon: <FiUsers size={20} /> },
      { name: "Orders", path: "/assigner/orders", icon: <FiBox size={20} /> },
      { name: "Repairs", path: "/assigner/repair-requests", icon: <FiTool size={20} /> },
      { name: "Logs", path: "/assigner/assignment-logs", icon: <FiClipboard size={20} /> },
      { name: "Assigned Orders", path: "/assigner/assigned-orders", icon: <FiBox size={20} /> },
      { name: "Assigned Repairs", path: "/assigner/assigned-repairs", icon: <FiTool size={20} /> },
      { name: "Reassign Orders", path: "/assigner/reassign-orders", icon: <FiRefreshCw size={20} /> },
      { name: "Reassign Repairs", path: "/assigner/reassign-repairs", icon: <FiRefreshCw size={20} /> },
    ],
    []
  );

  
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

 
  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      const filtered = menuItems.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    },
    [menuItems]
  );

  const handleSearchResultClick = (result) => {
    navigate(result.path);
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    setSidebarOpen(false);
  };

 
  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    const result = await Swal.fire({
      title: "Logout Confirmation",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Yes, Logout",
      customClass: {
        popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "",
      },
    });

    if (!result.isConfirmed) return;

    try {
      if (token && refreshToken) {
        await api.post("/api/auth/logout", { refreshToken }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      setToken(null);
      setIsAuthenticated(false);

      Swal.fire({
        icon: "success",
        title: "Logged Out",
        text: "See you soon!",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });

      navigate("/login");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Logout Failed",
        text: "Please try again.",
      });
      navigate("/login");
    }
  }, [token, navigate, darkMode]);


  const SkeletonLoader = useMemo(
    () => (
      <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg animate-pulse">
        <div className="h-9 w-56 bg-white/30 rounded-full"></div>
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-white/30 rounded-full"></div>
          <div className="w-10 h-10 bg-white/30 rounded-full"></div>
          <div className="w-10 h-10 bg-white/30 rounded-full"></div>
        </div>
      </div>
    ),
    []
  );

  return (
    <>
      
      <header className="sticky top-0 z-50 shadow-lg" aria-label="Main Navigation">
        {isInitialLoading ? (
          SkeletonLoader
        ) : (
          <div className="flex justify-between items-center px-4 md:px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-800 dark:to-teal-900 text-white">
           
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all hover:scale-110 lg:hidden"
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              >
                {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                Assigner Panel
              </h1>
            </div>

            
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <div className="flex items-center bg-white/25 backdrop-blur-md rounded-full px-5 py-3 shadow-inner">
                  <FiSearch size={20} className="text-white/80" />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    className="ml-3 bg-transparent text-white placeholder-white/70 outline-none flex-1 font-medium"
                  />
                </div>

             
                {searchOpen && searchQuery && (
                  <div
                    className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {searchResults.length > 0 ? (
                      searchResults.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => handleSearchResultClick(item)}
                          className="w-full text-left px-5 py-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
                        >
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {item.icon}
                          </span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {item.name}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="px-5 py-6 text-center text-gray-500 dark:text-gray-400">
                        No results found
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all hover:scale-110"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
              </button>

              {isAuthenticated && (
                <Link
                  to="/assigner/profile"
                  className="p-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all hover:scale-110"
                  aria-label="View profile"
                >
                  <FiUser size={20} />
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 flex flex-col`}
        aria-label="Sidebar navigation"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-emerald-600 text-center dark:text-emerald-400">
              Tech Bazaar
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
              aria-label="Close sidebar"
            >
              <FiX size={22} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-4 px-5 py-4 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all group"
            >
              <span className="text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                {item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium"
            aria-label="Logout"
          >
            <FiLogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      
      {searchOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSearchOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default AssignerHeader;