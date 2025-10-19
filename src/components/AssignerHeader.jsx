import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FiMoon, FiSun, FiUser, FiLogOut, FiMenu, FiX, FiActivity, FiUsers, FiBox, FiTool, FiClipboard, FiRefreshCw, FiSearch } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import api from "../api";

const AssignerHeader = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
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

  const menuItems = useMemo(
    () => [
      { name: "Dashboard", path: "/assigner-dashboard", icon: <FiActivity size={20} /> },
      { name: "Delivery Persons", path: "/assigner/delivery-persons", icon: <FiUsers size={20} /> },
      { name: "Orders", path: "/assigner/orders", icon: <FiBox size={20} /> },
      { name: "Repairs", path: "/assigner/repair-requests", icon: <FiTool size={20} /> },
      { name: "Logs", path: "/assigner/assignment-logs", icon: <FiClipboard size={20} /> },
      { name: "Assigned Orders", path: "/assigner/assigned-orders", icon: <FiBox size={20} /> },
      { name: "Assigned Repairs", path: "/assigner/assigned-repairs", icon: <FiTool size={20} /> },
      { name: "Reassign Repairs", path: "/assigner/reassign-repairs", icon: <FiRefreshCw size={20} /> },
      { name: "Reassign Orders", path: "/assigner/reassign-orders", icon: <FiRefreshCw size={20} /> },
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

  
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const filtered = menuItems.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(filtered);
  }, [menuItems]);

  const handleSearchResultClick = (result) => {
    navigate(result.path);
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
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
    <>
      <header className="relative z-50">
        {isInitialLoading ? (
          SkeletonLoader
        ) : (
          <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-black dark:to-gray-950 text-white shadow-md gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-full bg-indigo-500 dark:bg-gray-900 hover:bg-indigo-700 dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-110 lg:hidden"
                aria-label={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
              >
                {sidebarOpen ? <FiX size={18} /> : <FiMenu size={18} />}
              </button>
              <h1 className="font-bold text-xl tracking-wide">Assigner Dashboard</h1>
            </div>

          
            <div className="flex-1 mx-8 hidden md:block">
              <div className="relative">
                <div className="flex items-center bg-white/20 dark:bg-gray-800 rounded-3xl px-3 py-2">
                  <FiSearch size={18} className="text-white" />
                  <input
                    type="text"
                    placeholder="Search orders, repairs, persons..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    className="flex-1 ml-2 bg-transparent text-gray-800 dark:text-white outline-none placeholder-white dark:placeholder-gray-500"
                  />
                </div>

               
                {searchOpen && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                    {searchResults.length > 0 ? (
                      searchResults.map((result) => (
                        <button
                          key={result.name}
                          onClick={() => handleSearchResultClick(result)}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-100 dark:hover:bg-gray-700 transition-all border-b border-gray-200 dark:border-gray-700 last:border-b-0 flex items-center gap-3"
                        >
                          {result.icon}
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {result.name}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No results found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full bg-indigo-500 dark:bg-gray-900 hover:bg-indigo-700 dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-110"
                aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
              </button>

              {isAuthenticated && (
                <Link
                  to="/assigner/profile"
                  className="p-2 rounded-full bg-indigo-500 dark:bg-gray-900 hover:bg-indigo-700 dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-110"
                  aria-label="Go to Profile"
                >
                  <FiUser size={18} />
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

     
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-indigo-600 dark:bg-gray-950 text-white transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out shadow-lg flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 border-b border-indigo-500 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-center">Assigner Management System</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-full hover:bg-indigo-700 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Close Sidebar"
          >
            <FiX size={20} />
          </button>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-indigo-700 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-500 dark:border-gray-800">
          <button
            className="flex items-center gap-3 px-4 py-3 text-sm w-full hover:bg-indigo-700 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
            onClick={handleLogout}
            aria-label="Log Out"
          >
            <FiLogOut size={20} />
            Logout
          </button>
        </div>
      </div>

     
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

     
      {searchOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setSearchOpen(false)}
        ></div>
      )}
    </>
  );
};

export default AssignerHeader;