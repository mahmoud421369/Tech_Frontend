/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from "react";
import {
  FiSettings,
  FiLogOut,
  FiBell,
  FiUser,
  FiChevronDown,
  FiHome,
  FiUsers,
  FiStar,
  FiTag,
  FiList,
  FiMoon,
  FiSun,
} from "react-icons/fi";
import { RiGift2Line, RiTruckLine } from "react-icons/ri";
import { RiStore2Line } from "@remixicon/react";
import { Link } from "react-router-dom";
import logo from "../images/logo.png";

const Header = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount] = useState(3);

  const notifications = [
    { id: 1, title: "New device registered", message: "A new iPhone 13 was added", time: "10 min ago", read: false },
    { id: 2, title: "Maintenance required", message: "Device #1234 needs servicing", time: "2 hours ago", read: true },
    { id: 3, title: "New message", message: "You have a new message", time: "1 day ago", read: true },
  ];

  const user = {
    name: "Mahmoud Ali",
    email: "tech@repairdevices.com",
  };

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

  const menuItems = [
    { name: "dashboard", icon: <FiHome />, label: "Dashboard", path: "/dashboard" },
    { name: "users", icon: <FiUsers />, label: "Users", path: "/users" },
    { name: "repair shops", icon: <FiHome />, label: "Repair Shops", path: "/repair-shops" },
    { name: "categories", icon: <FiList />, label: "Categories", path: "/category" },
    { name: "offers", icon: <FiTag />, label: "Offers", path: "/admin/offers" },
    { name: "reviews", icon: <FiStar />, label: "Reviews", path: "/reviews" },
    { name: "delivery", icon: <RiTruckLine />, label: "Delivery", path: "/deliveries" },
    { name: "assigners", icon: <RiGift2Line />, label: "Assigners", path: "/assigners" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full h-16 z-20 shadow-sm flex items-center justify-between px-4 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"
      }`}
    >
   
      <div className="flex items-center space-x-2">
        <img src={logo} alt="Logo" className="h-10 w-auto" />
        <span className="font-bold hidden sm:inline">Tech & Restore</span>
      </div>

     
      <div className="flex items-center space-x-4">
 
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${
            darkMode ? "bg-gray-700 text-yellow-400" : "bg-gray-100 text-gray-600"
          }`}
        >
          {darkMode ? <FiMoon/>: <FiSun/>}
        </button>

    
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FiBell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div
              className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 z-20 max-h-96 overflow-y-auto ${
                darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
              }`}
            >
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium">Notifications</h3>
              </div>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b ${
                    darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"
                  } ${!n.read ? (darkMode ? "bg-gray-900" : "bg-blue-50") : ""}`}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{n.message}</p>
                  <p className="text-xs text-gray-400">{n.time}</p>
                </div>
              ))}
            </div>
          )}
        </div>

       
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2"
          >
            <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
              {user.name.charAt(0)}
            </div>
            <span className="hidden sm:inline">{user.name}</span>
            <FiChevronDown />
          </button>

          {showProfileMenu && (
            <div
              className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg py-2 z-20 ${
                darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
              }`}
            >
              
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>

              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

    
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

             
              <a href="#" className="flex items-center px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700">
                <FiUser className="mr-2" /> Profile
              </a>
           
              <a href="#" className="flex items-center px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700">
                <FiLogOut className="mr-2" /> Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;