/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  FiSearch,
  FiX,
} from "react-icons/fi";
import {
  RiAccountBox2Line,
  RiGift2Line,
  RiStore2Line,
  RiStore3Line,
  RiTruckLine,
} from "react-icons/ri";
import { Link } from "react-router-dom";
import logo from "../images/new-logo.jpg";

const Header = () => {
  // === State ===
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const unreadCount = 3;

  const notifications = [
    { id: 1, title: "New device registered", message: "A new iPhone 13 was added", time: "10 min ago", read: false },
    { id: 2, title: "Maintenance required", message: "Device #1234 needs servicing", time: "2 hours ago", read: true },
    { id: 3, title: "New message", message: "You have a new message", time: "1 day ago", read: true },
  ];

  const user = {
    name: "Mahmoud Ali",
    email: "tech@repairdevices.com",
  };

  const menuItems = useMemo(
    () => [
      { name: "dashboard", icon: <FiHome />, label: "Dashboard", path: "/dashboard" },
      { name: "users", icon: <FiUsers />, label: "Users", path: "/users" },
      {
        name: "shops",
        icon: <RiStore3Line />,
        label: "Shop",
        path: "/repair-shops",
        subMenu: [
          { name: "shops", icon: <RiStore2Line />, label: "Stores", path: "/repair-shops" },
          { name: "subscriptions", icon: <RiAccountBox2Line />, label: "Subscription", path: "/shop/subscriptions" },
          { name: "products", icon: <FiBox />, label: "Products", path: "/admin/products" },
          { name: "repair requests", icon: <FiTool />, label: "Repair Requests", path: "/admin/repair-requests" },
        ],
      },
      { name: "categories", icon: <FiList />, label: "Category", path: "/category" },
      { name: "offers", icon: <FiTag />, label: "Offers", path: "/admin/offers" },
      { name: "reviews", icon: <FiStar />, label: "Reviews", path: "/reviews" },
      { name: "delivery", icon: <RiTruckLine />, label: "Delivery", path: "/deliveries" },
      { name: "assigners", icon: <RiGift2Line />, label: "Assigner", path: "/assigners" },
      { name: "assignment-logs", icon: <FiClipboard />, label: "Assignment Logs", path: "/admin/assignment-logs" },
    ],
    []
  );

  // === Dark Mode ===
  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("darkMode", newMode);
      document.documentElement.classList.toggle("dark", newMode);
      return newMode;
    });
  }, []);

  // === Search Filtering ===
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const q = searchQuery.toLowerCase();
    return menuItems
      .map((item) => {
        const matchesMain = item.label.toLowerCase().includes(q);
        if (item.subMenu) {
          const filteredSub = item.subMenu.filter((s) => s.label.toLowerCase().includes(q));
          return matchesMain || filteredSub.length > 0 ? { ...item, subMenu: filteredSub } : null;
        }
        return matchesMain ? item : null;
      })
      .filter(Boolean);
  }, [menuItems, searchQuery]);

  // === Close on outside click ===
  useEffect(() => {
    const closeMenus = (e) => {
      if (!e.target.closest(".profile-btn") && showProfileMenu) setShowProfileMenu(false);
      if (!e.target.closest(".notif-btn") && showNotifications) setShowNotifications(false);
    };
    document.addEventListener("click", closeMenus);
    return () => document.removeEventListener("click", closeMenus);
  }, [showProfileMenu, showNotifications]);

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar – Blue/Indigo */}
      <nav
        className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${
          darkMode ? "bg-indigo-950" : "bg-white"
        } shadow-2xl lg:shadow-lg border-r border-indigo-200 dark:border-indigo-800`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between">
              <img src={logo} alt="Logo" className="h-40 w-auto" /> 
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Menu */}
          <ul className="flex-1 py-4 space-y-3 px-3">
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => (
                <li key={item.name}>
                  {item.subMenu ? (
                    <div>
                      <button
                        onClick={() => setShopDropdownOpen(!shopDropdownOpen)}
                        className={`flex items-center justify-start w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          darkMode
                            ? "text-gray-300 hover:bg-indigo-900 hover:text-white"
                            : "text-indigo-700 hover:bg-indigo-50"
                        }`}
                      >
                        <span className="text-gray-400 mr-3 text-lg">{item.icon}</span>
                        <span className="flex-1 text-left">{item.label}</span>
                        <FiChevronDown
                          className={`transition-transform ${shopDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {shopDropdownOpen && (
                        <ul className="pr-8 mt-1 space-y-1">
                          {item.subMenu.map((sub) => (
                            <li key={sub.name}>
                              <Link
                                to={sub.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center justify-start px-4 py-2.5 rounded-lg text-sm transition-all ${
                                  darkMode
                                    ? "text-gray-400 hover:bg-indigo-900 hover:text-white"
                                    : "text-indigo-600 hover:bg-indigo-50"
                                }`}
                              >
                                <span className="text-gray-400 mr-3 text-base">{sub.icon}</span>
                                <span className="text-left">{sub.label}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center justify-start px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        darkMode
                          ? "text-gray-300 hover:bg-indigo-900 hover:text-white"
                          : "text-indigo-700 hover:bg-indigo-50"
                      }`}
                    >
                      <span className="text-gray-400 mr-3 text-lg">{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                    </Link>
                  )}
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-sm text-gray-400 text-center">
                لا توجد نتائج
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* Header – Blue/Indigo */}
      <header
        className={`fixed top-0 left-0 right-0 h-16 z-20 flex items-center justify-between px-4 lg:px-6 shadow-md transition-colors ${
          darkMode ? "bg-indigo-950 text-white" : "bg-white text-indigo-800"
        } lg:pl-64`}
      >
        {/* Left: Mobile Menu + Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-9 w-auto" />
            <span className="hidden sm:inline font-bold text-indigo-700 dark:text-indigo-300">
              Tech & Restore
            </span>
          </div>
        </div>

        {/* Right: Search, Dark Mode, Notifications, Profile */}
        <div className="flex items-center gap-3">

          {/* Search */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder=" Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-64 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                darkMode
                  ? "bg-indigo-900 text-white placeholder-gray-400"
                  : "bg-indigo-50 text-indigo-800 placeholder-indigo-400"
              }`}
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Dark Mode */}
          <button
            onClick={toggleDarkMode}
            className={`p-2.5 rounded-xl transition ${
              darkMode
                ? "bg-indigo-800 text-yellow-400 hover:bg-indigo-700"
                : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
            }`}
          >
            {darkMode ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative notif-btn">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2.5 rounded-xl transition ${
                darkMode ? "hover:bg-indigo-800" : "hover:bg-indigo-100"
              }`}
            >
              <FiBell className="w-5 h-5 text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div
                className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl overflow-hidden z-50 border ${
                  darkMode
                    ? "bg-indigo-900 border-indigo-700"
                    : "bg-white border-indigo-200"
                }`}
              >
                <div className="p-4 border-b border-indigo-200 dark:border-indigo-700">
                  <h3 className="font-bold text-indigo-700 dark:text-indigo-300">الإشعارات</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 border-b border-indigo-100 dark:border-indigo-800 transition ${
                        !n.read
                          ? darkMode
                            ? "bg-indigo-800"
                            : "bg-indigo-50"
                          : ""
                      } hover:bg-indigo-100 dark:hover:bg-indigo-800`}
                    >
                      <p className="font-medium text-sm text-indigo-900 dark:text-white">{n.title}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">{n.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative profile-btn">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0)}
              </div>
              <span className="hidden md:inline text-sm font-medium text-indigo-700 dark:text-indigo-300">
                {user.name}
              </span>
              <FiChevronDown className="text-gray-400 text-sm" />
            </button>
            {showProfileMenu && (
              <div
                className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-xl overflow-hidden z-50 border ${
                  darkMode
                    ? "bg-indigo-900 border-indigo-700"
                    : "bg-white border-indigo-200"
                }`}
              >
                <div className="p-4 border-b border-indigo-200 dark:border-indigo-700">
                  <p className="font-bold text-indigo-700 dark:text-white">{user.name}</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">{user.email}</p>
                </div>
                <a
                  href="#"
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition ${
                    darkMode
                      ? "hover:bg-indigo-800 text-gray-300"
                      : "hover:bg-indigo-50 text-indigo-700"
                  }`}
                >
                  <FiUser className="text-gray-400" />  Profile
                </a>
                <a
                  href="#"
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition ${
                    darkMode
                      ? "hover:bg-indigo-800 text-gray-300"
                      : "hover:bg-indigo-50 text-indigo-700"
                  }`}
                >
                  <FiLogOut className="text-gray-400" /> Logout
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