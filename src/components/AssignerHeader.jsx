import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FiMoon, FiSun, FiUser, FiLogOut } from "react-icons/fi";
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
      });
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to log out",
        position: "top",
      });
      navigate("/login");
    }
  }, [token, navigate]);


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
        <div className="flex justify-between items-center px-6 py-4 bg-indigo-600 dark:bg-gray-950 text-white shadow-md">
          <h1 className="font-bold text-xl tracking-wide">Assigner Dashboard</h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-indigo-500 dark:bg-gray-900 hover:bg-indigo-700 dark:hover:bg-gray-800 transition"
              aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 bg-indigo-500 dark:bg-gray-900 hover:bg-indigo-700 dark:hover:bg-gray-800 px-3 py-2 rounded-full transition"
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
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-gray-700 transition"
                        onClick={() => setOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <button
                      className="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 text-left hover:bg-indigo-100 dark:hover:bg-gray-700 flex items-center gap-2 transition"
                      onClick={handleLogout}
                      aria-label="Log Out"
                    >
                      <FiLogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default AssignerHeader;