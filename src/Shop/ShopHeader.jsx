// src/components/ShopHeader.js
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiHome,
  FiBox,
  FiShoppingCart,
  FiUser,
  FiSettings,
  FiBell,
  FiLogOut,
} from "react-icons/fi";
import { RiBox2Line, RiInbox2Line, RiMessage2Line, RiMoneyDollarCircleLine, RiPriceTag2Line, RiShoppingBag2Line, RiStore2Fill, RiStore2Line, RiToolsFill } from "react-icons/ri";

const ShopHeader = ({ darkMode, setDarkMode, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  // dropdown states
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

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
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`flex h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-[#f1f5f9] text-gray-800"
      } font-cairo`}
    >
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full transition-all duration-300 z-40 ${
          sidebarOpen ? "w-64" : "w-20"
        } ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}
      >
        <div className="flex items-center justify-between p-4">
          {sidebarOpen && <h1 className="text-lg text-center text-blue-500 font-bold border-b p-3 border-gray-100">Tech & Restore</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="space-y-2 mt-10 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setActivePage(item.name)}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                activePage === item.name
                  ? darkMode
                    ? "bg-blue-900 text-white"
                    : "bg-blue-100 text-blue-700"
                  : darkMode
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="font-bold hidden md:block">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "md:ml-60" : "md:ml-16"
        }`}
      >
        {/* Header */}
        <header
          className={`fixed top-0 right-0 left-0 h-16 flex items-center justify-between px-4 shadow-md z-30 ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          }`}
        >
          {/* Mobile Hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>

          {/* Actions (right side always) */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <FiBell />
              </button>
              {notificationsOpen && (
                <div
                  className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg p-3 ${
                    darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
                  }`}
                >
                  <p className="font-bold mb-2">الإشعارات</p>
                  <ul className="space-y-2 text-sm">
                    <li className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                      طلب جديد #123
                    </li>
                    <li className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                      عميل جديد مسجل
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Dark Mode */}
            <button
              onClick={setDarkMode}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {darkMode ? "🌙" : "☀"}
            </button>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <FiUser />
                <span className="hidden sm:block">حسابي</span>
              </button>
              {profileOpen && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg p-3 ${
                    darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
                  }`}
                >
                  <Link
                    to="/shop/settings"
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <FiSettings /> الإعدادات
                  </Link>
                  <button
                    className="flex items-center gap-2 p-2 w-full text-left rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <FiLogOut /> تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1  p-6 overflow-y-auto min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ShopHeader;


     


