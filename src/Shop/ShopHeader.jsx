import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiUser, FiSettings, FiBell, FiLogOut, FiMoon, FiSun, FiMenu, FiX } from 'react-icons/fi';
import {
  RiBox2Line,
  RiInbox2Line,
  RiMessage2Line,
  RiMoneyDollarCircleLine,
  RiPriceTag2Line,
  RiShoppingBag2Line,
  RiStore2Line,
  RiToolsFill,
} from 'react-icons/ri';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

const ShopHeader = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profileRef = useRef(null);
  const sidebarRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isTokenExpired = useCallback((token) => {
    try {
      const decoded = jwtDecode(token);
      if (!decoded.exp) return true;
      return decoded.exp < Date.now() / 1000;
    } catch (e) {
      return true;
    }
  }, []);

  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      navigate('/login');
    }
  }, [token, isTokenExpired, navigate]);

  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (token && refreshToken) {
        await api.post('/api/auth/logout', { refreshToken });
      }
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      setToken(null);
      setIsAuthenticated(false);
      Swal.fire({
        title: 'Logged out',
        text: 'You have been logged out successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err.response?.data || err.message);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      setToken(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  }, [navigate, token]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode);
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    document.documentElement.classList.toggle('dark', savedMode);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { name: 'dashboard', icon: <RiStore2Line className="text-xl" />, label: 'لوحة التحكم', path: '/shop-dashboard' },
    { name: 'repairs', icon: <RiToolsFill className="text-xl" />, label: 'طلبات التصليح', path: '/repair/requests' },
    { name: 'devices', icon: <RiBox2Line className="text-xl" />, label: 'المنتجات', path: '/shop/devices' },
    { name: 'orders', icon: <RiShoppingBag2Line className="text-xl" />, label: 'الطلبات', path: '/shop/orders' },
    { name: 'transactions', icon: <RiMoneyDollarCircleLine className="text-xl" />, label: 'الفواتير', path: '/shop/transactions' },
    { name: 'inventory', icon: <RiInbox2Line className="text-xl" />, label: 'جرد', path: '/shop/inventory' },
    { name: 'offers', icon: <RiPriceTag2Line className="text-xl" />, label: 'العروض', path: '/shop/offers' },
    { name: 'support', icon: <RiMessage2Line className="text-xl" />, label: 'الدعم', path: '/support' },
  ];

  return (
    <div className={`min-h-screen font-cairo transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-800'}`}>
      {/* Header */}
      <header className={`fixed top-0 w-full h-16 flex items-center justify-between px-4 sm:px-6 z-40  transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">Tech & Restore</h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-600'}`}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FiMoon className="text-lg" /> : <FiSun className="text-lg" />}
          </button>
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle profile menu"
              aria-expanded={profileOpen}
            >
              <FiUser className="text-lg" />
              <span className="hidden sm:inline text-sm font-medium">حسابي</span>
            </button>
            {profileOpen && (
              <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg p-3 transition-all duration-200 transform ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} z-50`}>
                <Link
                  to="/shop/profile"
                  className="flex items-center gap-2 p-2 text-blue-500 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => setProfileOpen(false)}
                >
                  <FiUser className="text-lg" /> بيانات الحساب
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 p-2 w-full text-left text-red-500 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <FiLogOut className="text-lg" /> تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className="flex">
        <aside
          ref={sidebarRef}
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-20 md:w-64 bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-in-out z-30
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <nav className="flex flex-col p-4 h-full">
            <ul className="space-y-4 flex-1 mt-6">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center text-decoration-none gap-3 p-3 rounded-lg font-bold transition-colors duration-200 relative group
                      ${location.pathname === item.path ? 'bg-blue-500 text-white' : 'text-blue-600 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    onClick={() => setSidebarOpen(false)}
                    aria-label={item.label}
                  >
                    {item.icon}
                    <span className="hidden md:inline text-sm md:text-base group-hover:md:underline">{item.label}</span>
                    {/* Tooltip for mobile view */}
                    <span className="absolute left-full ml-2 px-2 py-1 text-sm text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 md:hidden">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 pt-16 md:pl-64 px-4 sm:px-6 pb-6 min-h-screen transition-all duration-300">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default ShopHeader;