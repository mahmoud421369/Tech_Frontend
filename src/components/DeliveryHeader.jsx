import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FiMoon,
  FiSun,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiPackage,
  FiTool,
  FiHome,
  FiClipboardCheck,
  FiSettings,
  FiClipboard,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import api from "../api";

const DeliveryHeader = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      navigate("/login");
    }
  }, [token, isTokenExpired, navigate]);

  const handleLogout = useCallback(async () => {
    const result = await Swal.fire({
      title: "Log out?",
      text: "You'll be signed out of your delivery account",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, log out",
      cancelButtonText: "Stay logged in",
      confirmButtonColor: "#dc2626",
      background: darkMode ? "#1f2937" : "#fff",
      color: darkMode ? "#fff" : "#000",
    });

    if (!result.isConfirmed) return;

    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (token && refreshToken) {
        await api.post("/api/auth/logout", { refreshToken }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      setToken(null);

      Swal.fire({
        icon: "success",
        title: "Logged out",
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false,
        background: "#10b981",
        color: "#fff"
      });

      navigate("/login");
    } catch (err) {
      navigate("/login");
    }
  }, [token, navigate, darkMode]);


  const menuItems = [
    { name: "Dashboard", path: "/delivery-dashboard", icon: FiHome },
    { name: "Available Orders", path: "/delivery/available-orders", icon: FiPackage },
    { name: "Available Repairs", path: "/delivery/available-repair-requests", icon: FiTool },
    { name: "My Deliveries", path: "/delivery/my-deliveries", icon: FiClipboard },
    { name: "My Repairs", path: "/delivery/my-repairs", icon: FiTool },
    { name: "Profile", path: "/delivery/profile", icon: FiSettings },
  ];

  const SkeletonHeader = () => (
    <div className="h-20 bg-gradient-to-r from-emerald-500 to-teal-600 animate-pulse">
      <div className="flex justify-between items-center h-full px-6">
        <div className="h-10 w-64 bg-white/30 rounded-2xl"></div>
        <div className="flex gap-4">
          <div className="h-10 w-10 bg-white/30 rounded-full"></div>
          <div className="h-10 w-10 bg-white/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isInitialLoading ? (
        <SkeletonHeader />
      ) : (
        <header className="fixed top-0 left-0 right-0 z-50 shadow-xl">
     
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600"></div>

          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95">
            <div className="flex justify-between items-center px-6 py-5 max-w-7xl mx-auto">

              
              <Link to="/delivery-dashboard" className="flex items-center gap-4 group">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300">
                  <FiUser size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Delivery 
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fast • Reliable • Trusted</p>
                </div>
              </Link>

             
              <div className="hidden lg:flex items-center gap-6">
                
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-3 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-110"
                >
                  {darkMode ? <FiSun size={22} className="text-yellow-500" /> : <FiMoon size={22} className="text-indigo-600" />}
                </button>

               
                {isAuthenticated && (
                  <div className="relative group">
                    <button className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-medium shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                      <FiUser size={20} />
                      <span>My Account</span>
                    </button>

                    <div className="absolute right-0 mt-3 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {menuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              to={item.path}
                              className="flex items-center gap-4 px-6 py-4 text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <Icon size={18} className="text-emerald-600 dark:text-emerald-400" />
                              <span className="font-medium">{item.name}</span>
                            </Link>
                          );
                        })}
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-4 px-6 py-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-200 font-medium"
                        >
                          <FiLogOut size={18} />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              
              <div className="flex lg:hidden items-center gap-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-md"
                >
                  {darkMode ? <FiSun className="text-yellow-500" /> : <FiMoon className="text-indigo-600" />}
                </button>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"
                >
                  {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
              </div>
            </div>
          </div>

         
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
              <div className="fixed right-0 top-20 w-80 h-full bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 animate-slide-in-right">
                <div className="p-6 space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
                      >
                        <Icon size={20} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-lg font-medium text-gray-800 dark:text-white">{item.name}</span>
                      </Link>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                  >
                    <FiLogOut size={20} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>
      )}
    </>
  );
};

export default DeliveryHeader;