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
  FiBox,
  FiTool,
  FiClipboard,
  FiMenu,
} from "react-icons/fi";
import { RiGift2Line, RiStore3Line, RiTruckLine } from "react-icons/ri";
import { RiStore2Line } from "@remixicon/react";
import { Link } from "react-router-dom";
import logo from "../images/logo.png";

const Header = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    { name: "shops", icon: <RiStore3Line />, label: "Shops", path: "/repair-shops" },
    { name: "repair requests", icon: <FiTool />, label: "Repair Requests", path: "/admin/repair-requests" },
    { name: "products ", icon: <FiBox />, label: "Products", path: "/admin/products" },
    { name: "categories", icon: <FiList />, label: "Categories", path: "/category" },
    { name: "offers", icon: <FiTag />, label: "Offers", path: "/admin/offers" },
    { name: "reviews", icon: <FiStar />, label: "Reviews", path: "/reviews" },
    { name: "delivery", icon: <RiTruckLine />, label: "Delivery", path: "/deliveries" },
    { name: "assigners", icon: <RiGift2Line />, label: "Assigners", path: "/assigners" },
    { name: "assignment-logs", icon: <FiClipboard />, label: "Assignment Logs", path: "/admin/assignment-logs" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed inset-y-0 left-0 z-30 w-16 lg:w-64 overflow-y-auto transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-200 ease-in-out ${
          darkMode ? "bg-gray-950" : "bg-white"
        } shadow-lg lg:shadow-none `}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-blue-200 dark:border-indigo-800 lg:border-b-0">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600"
            >
              <FiChevronDown className="w-5 h-5 rotate-90" />
            </button>
          </div>
          <ul className="flex-1 py-4 space-y-4">
            <h3 className="p-2 text-center text-lg text-gray-700 dark:text-white">Admin Managment System</h3><hr  className="border border-gray-100 flex justify-center items-center dark:border-gray-900"/>
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-4 py-2 text-sm font-medium ${
                    darkMode
                      ? "text-gray-300 hover:bg-indigo-800 hover:text-white"
                      : "text-blue-500  m-2 rounded-xl px-3 py-2 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <span className="mr-0 lg:mr-3 text-lg">{item.icon}</span>
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 w-full h-16 z-20 shadow-sm flex items-center justify-between px-4 ${
          darkMode ? "bg-gray-950 text-white " : "bg-white text-gray-800 "
        } lg:pl-16 lg:pl-64`} // Adjust for sidebar width on lg+
      >
        <div className="flex items-center space-x-2">
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded hover:bg-blue-100 dark:hover:bg-indigo-800"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          <span className="font-bold hidden sm:inline">Tech & Restore</span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${
              darkMode ? "bg-indigo-800 text-yellow-400" : "bg-blue-100 text-blue-600"
            }`}
          >
            {darkMode ? <FiMoon /> : <FiSun />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-full ${
                darkMode ? "hover:bg-indigo-800" : "hover:bg-blue-50"
              }`}
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
                className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 z-20 max-h-96 overflow-y-auto border ${
                  darkMode
                    ? "bg-indigo-900 border-indigo-800"
                    : "bg-white border-blue-200"
                }`}
              >
                <div className="px-4 py-2 border-b border-blue-200 dark:border-indigo-800">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b ${
                      darkMode
                        ? "border-indigo-800 hover:bg-indigo-800"
                        : "border-blue-200 hover:bg-blue-50"
                    } ${!n.read ? (darkMode ? "bg-indigo-800" : "bg-blue-50") : ""}`}
                  >
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-gray-300 dark:text-gray-400">
                      {n.message}
                    </p>
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
                className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg py-2 z-20 border ${
                  darkMode
                    ? "bg-indigo-900 border-indigo-800"
                    : "bg-white border-blue-200"
                }`}
              >
                <div className="px-4 py-2 border-b border-blue-200 dark:border-indigo-800">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>

                <div className="border-t border-blue-200 dark:border-indigo-800 my-1"></div>

                <a
                  href="#"
                  className={`flex items-center px-4 py-2 text-sm ${
                    darkMode
                      ? "hover:bg-indigo-800 hover:text-white"
                      : "hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FiUser className="mr-2" /> Profile
                </a>
                <a
                  href="#"
                  className={`flex items-center px-4 py-2 text-sm ${
                    darkMode
                      ? "hover:bg-indigo-800 hover:text-white"
                      : "hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <FiLogOut className="mr-2" /> Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;