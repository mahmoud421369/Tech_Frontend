
import React, { useState, useRef, useEffect } from "react";

import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FiUser, FiSettings, FiBell, FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import {
  RiBox2Line,
  RiInbox2Line,
  RiMessage2Line,
  RiMoneyDollarCircleLine,
  RiPriceTag2Line,
  RiShoppingBag2Line,
  RiStore2Line,
  RiToolsFill,
} from "react-icons/ri";
import { jwtDecode } from "jwt-decode";
const ShopHeader = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
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

  const menuItems = [
    { name: "dashboard", icon: <RiStore2Line />, label: "لوحة التحكم", path: "/shop-dashboard" },
    { name: "repairs", icon: <RiToolsFill />, label: "طلبات التصليح", path: "/repair/requests" },
    { name: "devices", icon: <RiBox2Line />, label: "المنتجات", path: "/shop/devices" },
    { name: "orders", icon: <RiShoppingBag2Line />, label: "الطلبات", path: "/shop/orders" },
    { name: "transactions", icon: <RiMoneyDollarCircleLine />, label: "الفواتير", path: "/shop/transactions" },
    { name: "inventory", icon: <RiInbox2Line />, label: "جرد", path: "/shop/inventory" },
    { name: "offers", icon: <RiPriceTag2Line />, label: "العروض", path: "/shop/offers" },
    { name: "support", icon: <RiMessage2Line />, label: "الدعم", path: "/support" },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


    useEffect(() => {
      const savedMode = localStorage.getItem("darkMode");
      if (savedMode === "true") {
        setDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    }, []);
  
    const toggleDarkMode = () => {
      setDarkMode((prev) => {
        const newMode = !prev;
        localStorage.setItem("darkMode", newMode);
        if (newMode) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
        return newMode;
      });
    };
  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-[#f1f5f9] text-gray-800"} font-cairo min-h-screen`}>
  
      <header
        className={`fixed top-0 w-full h-16 flex items-center justify-between px-6 shadow-md z-30 transition-colors
          ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}
      >
        <h1 className="text-xl font-bold">Tech & Restore</h1>

        <div className="flex items-center gap-4">
         
     

           <button
             onClick={toggleDarkMode}
             className={`p-2 rounded-full ${
               darkMode ? "bg-gray-700 text-yellow-400" : "bg-gray-100 text-gray-600"
             }`}
           >
             {darkMode ? <FiMoon/>: <FiSun/>}
           </button>
    
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <FiUser />
              <span>حسابي</span>
            </button>
            {profileOpen && (
              <div
                className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg p-3 transition-colors
                  ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"}`}
              >
                <Link to="/shop/profile" className="flex items-center gap-2 p-2 text-blue-500 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><FiUser/> بيانات الحساب </Link><br />
                <p className="font-bold mb-2">القائمة</p>
                <ul className="space-y-2 text-sm">
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.path}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {item.icon} {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <hr className="my-2 border-gray-400" />
                <button onClick={handleLogout} className="flex items-center gap-2 p-2 w-full text-left rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <FiLogOut /> تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

  
      <main className="pt-20 px-6 pb-6">

          {children} 
        


      </main>
    </div>
  );
};

export default ShopHeader;