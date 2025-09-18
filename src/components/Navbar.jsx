import React, { useEffect,useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../images/logo.png";
import { FaHome, FaSearch, FaTaxi, FaUser } from "react-icons/fa";
import { FiSun, FiMoon, FiShoppingCart, FiLogOut } from "react-icons/fi";
import Swal from "sweetalert2";
import {jwtDecode} from "jwt-decode";

const Navbar = ({ cartCount, onCartClick, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();

 

    const [token, setToken] = useState(localStorage.getItem("authToken"));

  const isAuthenticated = !!token;

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





const handleLogout = async () => {
  const token = localStorage.getItem("authToken");
  const refreshToken = localStorage.getItem("refreshToken");

  try {
    if (token && refreshToken) {
      const res = await fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || "Logout failed");
      }
    }

  
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");

    Swal.fire("Logged out", "You have been logged out successfully", "success");
    navigate("/login");
  } catch (err) {
    console.error("Logout error:", err);

    
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");


    navigate("/login");
  }
};

  const navItems = isAuthenticated
    ? [
        { name: "Home", path: "/",icon: <FaHome size={18} /> },
        { name: "Explore", path: "/explore",icon: <FaSearch size={18} /> },
        { name: "Track", path: "/track", icon: <FaTaxi size={18} /> },
        { name: "Account", path: "/account",icon: <FaUser size={18} /> },
      ]
    : [
        { name: "Home", path: "/" },
        { name: "Login", path: "/login" },
        { name: "Signup", path: "/signup" },
      ];

  return (
    <>
   
      <nav
        className={`hidden md:flex items-center justify-between shadow-md py-3 px-6 fixed top-0 left-0 right-0 z-50 ${
          darkMode ? "bg-gray-900" : "bg-gradient-to-r from-blue-500 to-indigo-600"
        }`}
      >
      
        <img src={logo} className="h-16 w-auto object-cover" alt="Logo" />

   
        <div className="flex space-x-8">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 rounded-3xl text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-white text-blue-600"
                    : "text-white hover:bg-blue-700/40"
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
            className={`p-2 rounded-full ${
              darkMode
                ? "text-yellow-300 hover:bg-gray-700"
                : "text-white hover:bg-blue-700/40"
            }`}
          >
            {darkMode ? <FiSun className="w-6 h-6" /> : <FiMoon className="w-6 h-6" />}
          </button>

        
          {isAuthenticated && (
            <button
              onClick={onCartClick}
              className="relative p-2 text-white hover:bg-blue-700/40 rounded-full"
            >
              <FiShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}

     
          {token && isAuthenticated && (
            <button
              onClick={handleLogout}
              className="flex items-center bg-white text-indigo-500 text-sm font-bold px-4 py-2 rounded-3xl"
            >
              <FiLogOut className="mr-2" /> Logout
            </button>
          )}
        </div>
      </nav>

    
      <nav
        className={`md:hidden fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 py-2 shadow-md ${
          darkMode ? "bg-gray-900" : "bg-gradient-to-r from-blue-500 to-indigo-600"
        }`}
      >
        
        <img src={logo} className="h-12 w-auto object-cover" alt="Logo" />

        <div className="flex items-center space-x-3">
         
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${
              darkMode
                ? "text-yellow-300 hover:bg-gray-700"
                : "text-white hover:bg-blue-700/40"
            }`}
          >
            {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          </button>

         
          {isAuthenticated && (
            <button
              onClick={onCartClick}
              className="relative p-2 text-white hover:bg-blue-700/40 rounded-full"
            >
              <FiShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </nav>

      
      {isAuthenticated && (
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around py-2 shadow-lg ${
            darkMode ? "bg-gray-900" : "bg-white"
          }`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center text-xs ${
                  isActive
                    ? "text-blue-600 font-bold"
                    : darkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }`
              }
            >
              {item.icon && <span>{item.icon}</span>}
              {item.name}
            </NavLink>
          ))}
        </div>
      )}
    </>
  );
};

export default Navbar;