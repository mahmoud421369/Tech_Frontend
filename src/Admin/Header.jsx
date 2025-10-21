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
  FiSearch,
} from "react-icons/fi";
import { RiGift2Line, RiStore2Line, RiStore3Line, RiTruckLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import logo from "../images/logo.png";

const Header = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount] = useState(3);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);

  const notifications = [
    { id: 1, title: "New device registered", message: "A new iPhone 13 was added", time: "10 min ago", read: false },
    { id: 2, title: "Maintenance required", message: "Device #1234 needs servicing", time: "2 hours ago", read: true },
    { id: 3, title: "New message", message: "You have a new message", time: "1 day ago", read: true },
  ];

  const user = {
    name: "Mahmoud Ali",
    email: "tech@repairdevices.com",
  };

  const menuItems = [
    { name: "dashboard", icon: <FiHome />, label: "Dashboard", path: "/dashboard" },
    { name: "users", icon: <FiUsers />, label: "Users", path: "/users" },
    {
      name: "shops",
      icon: <RiStore3Line />,
      label: "Shops",
      path: "/repair-shops",
      subMenu: [
        { name: "shops", icon: <RiStore2Line />, label: "Stores", path: "/repair-shops" },

        { name: "products", icon: <FiBox />, label: "Products", path: "/admin/products" },
        { name: "repair requests", icon: <FiTool />, label: "Repair Requests", path: "/admin/repair-requests" },
      ],
    },
    { name: "categories", icon: <FiList />, label: "Categories", path: "/category" },
    { name: "offers", icon: <FiTag />, label: "Offers", path: "/admin/offers" },
    { name: "reviews", icon: <FiStar />, label: "Reviews", path: "/reviews" },
    { name: "delivery", icon: <RiTruckLine />, label: "Delivery", path: "/deliveries" },
    { name: "assigners", icon: <RiGift2Line />, label: "Assigners", path: "/assigners" },
    { name: "assignment-logs", icon: <FiClipboard />, label: "Assignment Logs", path: "/admin/assignment-logs" },
  ];

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    setFilteredMenuItems(menuItems); // Initialize with all menu items
  }, []);

  useEffect(() => {
    // Live search filtering
    if (searchQuery.trim() === "") {
      setFilteredMenuItems(menuItems);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = menuItems
        .map((item) => {
          const matchesMain = item.label.toLowerCase().includes(query);
          if (item.subMenu) {
            const filteredSubMenu = item.subMenu.filter((subItem) =>
              subItem.label.toLowerCase().includes(query)
            );
            return matchesMain || filteredSubMenu.length > 0
              ? { ...item, subMenu: filteredSubMenu }
              : null;
          }
          return matchesMain ? item : null;
        })
        .filter((item) => item !== null);
      setFilteredMenuItems(filtered);
    }
  }, [searchQuery]);

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
          darkMode ? "bg-indigo-950" : "bg-indigo-600"
        } shadow-lg lg:shadow-none`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-indigo-200 dark:border-indigo-700 lg:border-b-0">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-indigo-500 dark:text-indigo-300 hover:text-indigo-700"
            >
              <FiChevronDown className="w-5 h-5 rotate-90" />
            </button>
          </div>
          <ul className="flex-1 py-4 space-y-4">
            <h3 className="sm:text-sm text-center text-lg text-white dark:text-indigo-200">
              Admin Management System
            </h3>
            <hr className="border border-white/20 dark:border-indigo-700 flex justify-center items-center" />
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => (
                <li key={item.name}>
                  {item.subMenu ? (
                    <div className="overflow-hidden">
                      <button
                        onClick={() => setShopDropdownOpen(!shopDropdownOpen)}
                        className={`flex items-center w-full px-4 py-2 text-sm font-medium ${
                          darkMode
                            ? "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                            : "text-white m-2 rounded-xl px-3 py-2 hover:bg-indigo-100 hover:text-indigo-800"
                        }`}
                      >
                        <span className="mr-0 lg:mr-3 text-lg">{item.icon}</span>
                        <span className="hidden lg:block">{item.label}</span>
                        <FiChevronDown
                          className={`ml-auto hidden lg:block transform ${
                            shopDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {shopDropdownOpen && item.subMenu.length > 0 && (
                        <ul className="pl-8 space-y-2">
                          {item.subMenu.map((subItem) => (
                            <li key={subItem.name}>
                              <Link
                                to={subItem.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center px-4 py-2 text-sm font-medium ${
                                  darkMode
                                    ? "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                                    : "text-white hover:bg-indigo-100 hover:text-indigo-800"
                                }`}
                              >
                                <span className="mr-3 text-lg">{subItem.icon}</span>
                                <span className="hidden lg:block">{subItem.label}</span>
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
                      className={`flex items-center px-4 py-2 text-sm font-medium ${
                        darkMode
                          ? "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                          : "text-white m-2 rounded-xl px-3 py-2 hover:bg-indigo-100 hover:text-indigo-800"
                      }`}
                    >
                      <span className="mr-0 lg:mr-3 text-lg">{item.icon}</span>
                      <span className="hidden lg:block">{item.label}</span>
                    </Link>
                  )}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-indigo-500 dark:text-indigo-300">
                No results found
              </li>
            )}
          </ul>
        </div>
      </nav>

     
      <header
        className={`fixed top-0 left-0 w-full h-16 z-20 shadow-sm flex items-center justify-between px-4 ${
          darkMode ? "bg-indigo-950 text-indigo-200" : "bg-indigo-600 text-white"
        } lg:pl-16 lg:pl-64`}
      >
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded hover:bg-indigo-100 dark:hover:bg-indigo-800"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          {/* <img src={logo} alt="Logo" className="h-10 w-auto" /> */}
          <span className="font-bold hidden sm:inline">Tech & Restore</span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search dashboard..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                darkMode ? "bg-indigo-900 text-indigo-200" : "bg-indigo-100 text-indigo-800"
              }`}
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" />
          </div>

          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${
              darkMode ? "bg-indigo-800 text-yellow-400" : "bg-indigo-100 text-indigo-600"
            }`}
          >
            {darkMode ? <FiMoon /> : <FiSun />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-full ${
                darkMode ? "hover:bg-indigo-800" : "hover:bg-indigo-100"
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
                    ? "bg-indigo-900 border-indigo-700"
                    : "bg-indigo-50 border-indigo-200"
                }`}
              >
                <div className="px-4 py-2 border-b border-indigo-200 dark:border-indigo-700">
                  <h3 className="font-medium">Notifications</h3>
                </div>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b ${
                      darkMode
                        ? "border-indigo-700 hover:bg-indigo-800"
                        : "border-indigo-200 hover:bg-indigo-100"
                    } ${!n.read ? (darkMode ? "bg-indigo-800" : "bg-indigo-100") : ""}`}
                  >
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-indigo-300 dark:text-indigo-400">
                      {n.message}
                    </p>
                    <p className="text-xs text-indigo-400">{n.time}</p>
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
              <div className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
                {user.name.charAt(0)}
              </div>
              <span className="hidden sm:inline">{user.name}</span>
              <FiChevronDown />
            </button>

            {showProfileMenu && (
              <div
                className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg py-2 z-20 border ${
                  darkMode
                    ? "bg-indigo-900 border-indigo-700"
                    : "bg-indigo-50 border-indigo-200"
                }`}
              >
                <div className="px-4 py-2 border-b border-indigo-200 dark:border-indigo-700">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-indigo-400">{user.email}</p>
                </div>

                <div className="border-t border-indigo-200 dark:border-indigo-700 my-1"></div>

                <a
                  href="#"
                  className={`flex items-center px-4 py-2 text-sm ${
                    darkMode
                      ? "hover:bg-indigo-800 hover:text-white"
                      : "hover:bg-indigo-100 hover:text-indigo-800"
                  }`}
                >
                  <FiUser className="mr-2" /> Profile
                </a>
                <a
                  href="#"
                  className={`flex items-center px-4 py-2 text-sm ${
                    darkMode
                      ? "hover:bg-indigo-800 hover:text-white"
                      : "hover:bg-indigo-100 hover:text-indigo-800"
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