import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiUser, FiSettings, FiBell, FiLogOut, FiMoon, FiSun, FiMenu } from 'react-icons/fi';
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
      const now = Date.now() / 1000;
      return decoded.exp < now;
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
      Swal.fire('Logged out', 'You have been logged out successfully', 'success');
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
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
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
    <div className={`min-h-screen font-cairo transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      {/* Header */}
      <header className={`fixed top-0 w-full h-16 flex items-center justify-between px-4 sm:px-6  z-30 transition-colors duration-200 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 md:hidden"
          >
            <FiMenu className="text-xl" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold">Tech & Restore</h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors duration-200 ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-600'}`}
          >
            {darkMode ? <FiMoon className="text-lg" /> : <FiSun className="text-lg" />}
          </button>
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <FiUser className="text-lg" />
              <span className="hidden sm:inline text-sm sm:text-base">حسابي</span>
            </button>
            {profileOpen && (
              <div className={`absolute right-0 mt-2 w-56 sm:w-64 rounded-lg shadow-lg p-3 transition-colors duration-200 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}>
                <Link
                  to="/shop/profile"
                  className="flex items-center gap-2 p-2 text-blue-500 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  onClick={() => setProfileOpen(false)}
                >
                  <FiUser className="text-lg" /> بيانات الحساب
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 p-2 w-full text-left rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
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
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-32 md:w-64 bg-white dark:bg-gray-800 text-white transform transition-transform duration-300 ease-in-out z-20
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <nav className="flex flex-col p-4 h-full">
            <ul className="space-y-2 flex-1 mt-6">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 p-3 rounded-lg font-bold transition-colors duration-200 ${
                      location.pathname === item.path
                        ? 'bg-blue-500 text-white'
                        : ' text-blue-600'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.icon}
                    <span className="hidden md:inline text-sm md:text-base">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pt-16 md:pl-64 px-4 sm:px-6 pb-6 min-h-screen transition-all duration-300">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default ShopHeader;