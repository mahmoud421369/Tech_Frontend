import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../images/logo.png";
import { FaHome, FaSearch, FaTaxi, FaUser } from "react-icons/fa";
import { FiSun, FiMoon, FiShoppingCart, FiLogOut, FiHome, FiTruck } from "react-icons/fi";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";

const Navbar = ({ cartCount, onCartClick, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      if (!decoded.exp) return true;
      const now = Date.now() / 1000;
      return decoded.exp < now;
    } catch (e) {
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

  const navItems = isAuthenticated
    ? [
        { name: "Home", path: "/", icon: <FiHome size={18} /> },
        { name: "Explore", path: "/explore", icon: <FaSearch size={18} /> },
        { name: "Track", path: "/track", icon: <FiTruck size={18} /> },
        { name: "Account", path: "/account", icon: <FaUser size={18} /> },
      ]
    : [
        { name: "Home", path: "/" },
        { name: "Login", path: "/login" },
        { name: "Signup", path: "/signup" },
      ];

  return (
    <>
 
      <nav
        className={`hidden md:flex items-center justify-between py-4 px-6 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          darkMode ? "bg-gray-900 shadow-lg" : "bg-gradient-to-r from-indigo-600 to-blue-600 shadow-md"
        }`}
      >

        <Link to="/" className="flex items-center gap-2">
          <img src={logo} className="h-12 w-auto object-cover" alt="Logo" />
          <h2 className="text-white text-2xl font-extrabold tracking-tight">Tech & Restore</h2>
        </Link>

       
        <div className="flex space-x-6">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-white hover:bg-indigo-700/50 dark:hover:bg-gray-700"
                }`
              }
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.name}
            </NavLink>
          ))}
        </div>

       
        <div className="flex items-center space-x-4">
    
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-all duration-200 ${
              darkMode
                ? "text-yellow-300 hover:bg-gray-800"
                : "text-white hover:bg-indigo-700/50"
            }`}
          >
            {darkMode ? <FiSun className="w-6 h-6" /> : <FiMoon className="w-6 h-6" />}
          </button>

     
          {isAuthenticated && (
            <button
              onClick={onCartClick}
              className="relative p-2 text-white hover:bg-indigo-700/50 dark:hover:bg-gray-800 rounded-full transition-all duration-200"
            >
              <FiShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}

    
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/30 dark:bg-black/30 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all duration-200"
            >
              <FiLogOut className="w-5 h-5" />
              Logout
            </button>
          )}
        </div>
      </nav>

      
      <nav
        className={`md:hidden fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-3 shadow-md transition-all duration-300 ${
          darkMode ? "bg-gray-900 border-b border-gray-700" : "bg-gradient-to-r from-indigo-600 to-blue-600"
        }`}
      >
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} className="h-10 w-auto object-cover" alt="Logo" />
          <h2 className="text-white text-xl font-bold">Tech & Restore</h2>
        </Link>
        <div className="flex items-center space-x-3">
          {!isAuthenticated && (
            <>
              <Link
                to="/login"
                className="px-3 py-2 bg-white text-indigo-600 text-sm font-semibold rounded-xl hover:bg-gray-100 transition"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-3 py-2 bg-white text-indigo-600 text-sm font-semibold rounded-xl hover:bg-gray-100 transition"
              >
                Signup
              </Link>
            </>
          )}

          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-all duration-200 ${
              darkMode
                ? "text-yellow-300 hover:bg-gray-800"
                : "text-white hover:bg-indigo-700/50"
            }`}
          >
            {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>

          
          {isAuthenticated && (
            <button
              onClick={onCartClick}
              className="relative p-2 text-white hover:bg-indigo-700/50 dark:hover:bg-gray-800 rounded-full transition-all duration-200"
            >
              <FiShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </nav>

     
      {isAuthenticated && (
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around py-3 shadow-lg transition-all duration-300 ${
            darkMode ? "bg-gray-900 border-t border-gray-700" : "bg-white border-t border-gray-200"
          }`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center text-sm font-semibold transition-colors duration-200 ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : darkMode
                    ? "text-gray-300 hover:text-gray-100"
                    : "text-gray-700 hover:text-gray-900"
                }`
              }
            >
              {item.icon && <span className="mb-1">{item.icon}</span>}
              {item.name}
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
};

export default Navbar;