import React, { useState, useEffect } from "react";
import { FiMoon, FiSun, FiUser, FiLogOut } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {jwtDecode} from "jwt-decode";

const AssignerHeader = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage
    return localStorage.getItem("darkMode") === "true";
  });
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // ✅ Check token expiration
  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      if (!decoded.exp) return true;
      const now = Date.now() / 1000;
      return decoded.exp < now;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
    }
  }, [token]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (token && refreshToken) {
        await fetch("http://localhost:8080/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      setToken(null);
      setIsAuthenticated(false);
      Swal.fire("Logged out", "You have been logged out successfully", "success");
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/login");
    }
  };

  // ✅ Dropdown links
  const menuItems = [
    { name: "Profile", path: "/assigner/profile" },

    { name: "Dashboard", path: "/assigner-dashboard" },
    { name: "Delivery Persons", path: "/assigner/delivery-persons" },
    { name: "Orders", path: "/assigner/orders" },
    { name: "Repairs", path: "/assigner/repairs-requests" },
    { name: "Logs", path: "/assigner/assignment-logs" },
    { name: "Assigned Orders", path: "/assigner/assigned-orders" },
    { name: "Assigned Repairs", path: "/assigner/assigned-repairs" },
    { name: "Reassign Repairs", path: "/assigner/reassign-repairs" },
    { name: "Reassign Orders", path: "/assigner/reassign-orders" },
  ];

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-indigo-600 dark:bg-gray-950 text-white shadow-md">
      {/* Brand */}
      <h1 className="font-bold text-xl tracking-wide">Assigner Dashboard</h1>

      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-full bg-indigo-500 dark:bg-gray-900 hover:bg-indigo-700 transition"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 bg-indigo-500 dark:bg-gray-900 hover:bg-indigo-700 px-3 py-2 rounded-full transition"
          >
            <FiUser size={18} />

          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden animate-fade-in z-50">
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
                className="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 text-left hover:bg-indigo-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={handleLogout}
              >
                <FiLogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AssignerHeader;