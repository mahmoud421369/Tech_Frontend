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
  FiDollarSign,
} from "react-icons/fi";
import {
  RiAccountBox2Line,
  RiGift2Line,
  RiStore2Line,
  RiStore3Line,
  RiTruckLine,
} from "react-icons/ri";
import { Link } from "react-router-dom";
import logo from "../images/logo-bg.png";

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
        subMenu: [
          { name: "shops", icon: <RiStore2Line />, label: "Stores", path: "/repair-shops" },
          { name: "subscriptions", icon: <RiAccountBox2Line />, label: "Subscription", path: "/shop/subscriptions" },
          { name: "products", icon: <FiBox />, label: "Products", path: "/admin/products" },
          { name: "repair requests", icon: <FiTool />, label: "Repair Requests", path: "/admin/repair-requests" },
           { name: "offers", icon: <FiTag />, label: "Offers", path: "/admin/offers" },
      { name: "reviews", icon: <FiStar />, label: "Reviews", path: "/reviews" },
        ],
      },
      { name: "categories", icon: <FiList />, label: "Categories", path: "/category" },
      { name: "transactions", icon: <FiDollarSign />, label: "Transactions", path: "/admin/transactions" },

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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar – Glassmorphism + Neon Glow in Dark Mode */}
      <nav
        className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto transform transition-all duration-500 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${
          darkMode
            ? "bg-black/40 backdrop-blur-2xl border-r border-emerald-500/20 shadow-2xl shadow-emerald-500/20"
            : "bg-white/95 backdrop-blur-xl border-r border-gray-200 shadow-xl"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={`p-8 border-b ${darkMode ? "border-emerald-500/20" : "border-gray-200"}`}>
            <div className="flex items-center justify-center">
              <div className={`relative group ${darkMode ? "animate-pulse" : ""}`}>
                <img
                  src={logo}
                  alt="Tech & Bazaar"
                  className={`h-32 w-auto object-contain transition-all duration-500 ${
                    darkMode
                      ? "drop-shadow-2xl shadow-emerald-500/80 filter brightness-110"
                      : ""
                  } group-hover:scale-105`}
                />
                {darkMode && (
                  <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-3xl animate-ping" />
                )}
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-6 right-6 lg:hidden p-2 text-gray-400 hover:text-emerald-400 transition"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Menu */}
          <ul className="flex-1 py-6 space-y-2 px-4">
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => (
                <li key={item.name}>
                  {item.subMenu ? (
                    <div>
                      <button
                        onClick={() => setShopDropdownOpen(!shopDropdownOpen)}
                        className={`flex items-center justify-between w-full px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                          darkMode
                            ? "text-emerald-400 hover:bg-emerald-500/10 hover:text-white hover:shadow-lg hover:shadow-emerald-500/20"
                            : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`${darkMode ? "text-emerald-400" : "text-emerald-600"} text-lg`}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        <FiChevronDown
                          className={`w-4 h-4 transition-transform ${shopDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {shopDropdownOpen && (
                        <ul className="mt-2 ml-10 space-y-1">
                          {item.subMenu.map((sub) => (
                            <li key={sub.name}>
                              <Link
                                to={sub.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-sm transition-all duration-300 ${
                                  darkMode
                                    ? "text-emerald-300 hover:bg-emerald-500/10 hover:text-white"
                                    : "text-gray-600 hover:bg-emerald-50"
                                }`}
                              >
                                <span className="text-emerald-500">{sub.icon}</span>
                                <span>{sub.label}</span>
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
                      className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                        darkMode
                          ? "text-emerald-400 hover:bg-emerald-500/10 hover:text-white hover:shadow-lg hover:shadow-emerald-500/20"
                          : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      <span className={`${darkMode ? "text-emerald-400" : "text-emerald-600"} text-lg`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              ))
            ) : (
              <li className="text-center py-8 text-gray-500 dark:text-emerald-400 text-sm">
                لا توجد نتائج
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* Header – Clean & Minimal (No Logo) */}
      <header
        className={`fixed top-0 left-0 right-0 h-16 z-20 flex items-center justify-between px-6 shadow-lg transition-all duration-500  lg:pl-64 ${
          darkMode
            ? "bg-black/40 backdrop-blur-2xl border-r border-emerald-500/20 shadow-2xl shadow-emerald-500/20"
            : "bg-white/90 border-b border-gray-200"
        }`}
      >
        {/* Left: Mobile Menu Only */}
        <div className="flex items-center">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-3 rounded-xl text-gray-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition"
          >
            <FiMenu className="w-6 h-6" />
          </button>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-4">

          {/* Search */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-72 pl-11 pr-5 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300 ${
                darkMode
                  ? "bg-emerald-950/50 border border-emerald-500/30 text-white placeholder-emerald-400"
                  : "bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500"
              }`}
            />
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-2xl transition-all duration-500 relative overflow-hidden ${
              darkMode
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 shadow-lg shadow-emerald-500/50"
                : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
            }`}
          >
            {darkMode ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
            {darkMode && <div className="absolute inset-0 bg-emerald-500/20 animate-ping" />}
          </button>

        
          <div className="relative notif-btn">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 rounded-2xl hover:bg-emerald-500/10 transition"
            >
              <FiBell className="w-5 h-5 text-gray-600 dark:text-emerald-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* {showNotifications && (
              <div
                className={`absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl overflow-hidden z-50 border ${
                  darkMode
                    ? "bg-black/70 backdrop-blur-xl border-emerald-500/30 shadow-emerald-500/30"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="p-5 border-b border-emerald-500/20">
                  <h3 className="font-bold text-emerald-400">الإشعارات</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 border-b border-emerald-500/10 transition ${
                        !n.read ? (darkMode ? "bg-emerald-500/10" : "bg-emerald-50") : ""
                      } hover:bg-emerald-500/10`}
                    >
                      <p className="font-medium text-sm text-white">{n.title}</p>
                      <p className="text-xs text-emerald-300 mt-1">{n.message}</p>
                      <p className="text-xs text-emerald-500 mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        
          <div className="relative profile-btn">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-2 rounded-2xl hover:bg-emerald-500/10 transition"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-emerald-500/30">
                {user.name.charAt(0)}
              </div>
              <span className="hidden md:inline font-medium text-black">{user.name}</span>
              <FiChevronDown className="text-emerald-400" />
            </button>

            {showProfileMenu && (
              <div
                className={`absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl overflow-hidden z-50 border backdrop-blur-xl ${
                  darkMode
                    ? "bg-black/70 border-emerald-500/30 shadow-emerald-500/50"
                    : "bg-white/95 border-gray-200"
                }`}
              >
                <div className="p-5 border-b border-emerald-500/20">
                  <p className="font-bold text-white">{user.name}</p>
                  <p className="text-xs text-emerald-400">{user.email}</p>
                </div>
                <a
                  href="#"
                  className="flex items-center gap-3 px-5 py-4 text-sm hover:bg-emerald-500/10 text-emerald-300 transition"
                >
                  <FiUser /> Profile
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 px-5 py-4 text-sm hover:bg-emerald-500/10 text-emerald-300 transition"
                >
                  <FiLogOut /> Logout
                </a>
              </div>
            )}
          </div> */}
        </div>
        </div>
      </header>
    </>
  );
};

export default Header;