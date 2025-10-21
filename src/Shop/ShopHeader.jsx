import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiUser, FiSettings, FiBell, FiLogOut, FiMoon, FiSun, FiMenu, FiX, FiSearch } from 'react-icons/fi';
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
import logo from '../images/logo.png';

// Debounce utility for search
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const ShopHeader = ({ children, darkMode: parentDarkMode, toggleDarkMode: parentToggleDarkMode }) => {
  const [darkMode, setDarkMode] = useState(parentDarkMode || false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const profileRef = useRef(null);
  const sidebarRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        await api.post('/api/auth/logout', { refreshToken }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setIsAuthenticated(false);
      Swal.fire({
        title: 'تم تسجيل الخروج',
        text: 'لقد تم تسجيل خروجك بنجاح',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: darkMode ? 'bg-indigo-800 text-indigo-100' : 'bg-blue-50 text-blue-800' },
      });
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err.response?.data || err.message);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  }, [navigate, token, darkMode]);

  const toggleDarkMode = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (parentToggleDarkMode) {
      parentToggleDarkMode();
    } else {
      localStorage.setItem('darkMode', newMode);
      document.documentElement.classList.toggle('dark', newMode);
    }
  }, [darkMode, parentToggleDarkMode]);

  useEffect(() => {
    if (!parentDarkMode) {
      const savedMode = localStorage.getItem('darkMode') === 'true';
      setDarkMode(savedMode);
      document.documentElement.classList.toggle('dark', savedMode);
    }
  }, [parentDarkMode]);

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

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((query) => {
      if (query.trim() === '') {
        setFilteredMenuItems(menuItems);
      } else {
        const lowerQuery = query.toLowerCase();
        const filtered = menuItems.filter((item) =>
          item.label.toLowerCase().includes(lowerQuery)
        );
        setFilteredMenuItems(filtered);
      }
    }, 300),
    [menuItems]
  );

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  return (
    <div className={`min-h-screen font-cairo transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-indigo-100' : 'bg-blue-50 text-indigo-900'}`}>
      {/* Header */}
      <header className={`fixed top-0 w-full h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-40 shadow-md transition-all duration-300 ${darkMode ? 'bg-indigo-800 text-indigo-100' : 'bg-gradient-to-r from-indigo-600 to-blue-500 text-white'}`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 md:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
          <Link to="/shop-dashboard" className="flex items-center gap-2">
            <img src={logo} alt="Tech & Restore Logo" className="h-8 sm:h-10 w-auto" />
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight hidden sm:block">Tech & Restore</h1>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="ابحث في لوحة التحكم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 ${darkMode ? 'bg-indigo-900 text-indigo-100 border-indigo-700' : 'bg-blue-100 text-indigo-900 border-blue-200'}`}
              dir="rtl"
              aria-label="Search dashboard"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
          </div>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? 'bg-indigo-900 text-yellow-300 hover:bg-indigo-700' : 'bg-blue-600 text-yellow-200 hover:bg-blue-700'}`}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FiMoon className="text-lg" /> : <FiSun className="text-lg" />}
          </button>
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? 'hover:bg-indigo-900' : 'hover:bg-blue-600'}`}
              aria-label="Toggle profile menu"
              aria-expanded={profileOpen}
              aria-haspopup="true"
            >
              <FiUser className="text-lg" />
              <span className="hidden sm:inline text-sm font-medium">حسابي</span>
            </button>
            {profileOpen && (
              <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-xl p-3 transition-all duration-300 ease-in-out transform origin-top-right ${darkMode ? 'bg-indigo-800 text-indigo-100 border-indigo-700' : 'bg-blue-50 text-indigo-900 border-blue-200'} scale-0 ${profileOpen ? 'scale-100' : ''} z-50`}>
                <Link
                  to="/shop/profile"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-indigo-900 transition-colors duration-200"
                  onClick={() => setProfileOpen(false)}
                  aria-label="View profile"
                >
                  <FiUser className="text-lg text-blue-500 dark:text-blue-400" /> بيانات الحساب
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 p-2 w-full text-left text-red-500 dark:text-red-400 rounded-lg hover:bg-blue-100 dark:hover:bg-indigo-900 transition-colors duration-200"
                  aria-label="Logout"
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
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-20 md:w-64 transition-all duration-300 ease-in-out z-30 shadow-lg ${darkMode ? 'bg-indigo-800 text-indigo-100' : 'bg-gradient-to-b from-indigo-600 to-blue-500 text-white'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <nav className="flex flex-col p-4 h-full">
            <ul className="space-y-4 flex-1 mt-6">
              {filteredMenuItems.length > 0 ? (
                filteredMenuItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 p-3 rounded-lg font-bold transition-all duration-200 relative group ${location.pathname === item.path ? 'bg-blue-500 text-white dark:bg-blue-600' : 'text-white dark:text-indigo-100 hover:bg-blue-400 dark:hover:bg-indigo-900'}`}
                      onClick={() => setSidebarOpen(false)}
                      aria-label={item.label}
                    >
                      {item.icon}
                      <span className="hidden md:inline text-sm md:text-base group-hover:underline">{item.label}</span>
                      {/* Tooltip for mobile view */}
                      <span className="absolute left-full ml-2 px-2 py-1 text-sm text-white bg-indigo-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 md:hidden">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="p-3 text-sm text-blue-200 dark:text-indigo-300 text-center">
                  لا توجد نتائج
                </li>
              )}
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
        {/* <main className="flex-1 pt-16 md:pl-64 sm:pl-24 pl-20 px-4 sm:px-6 lg:px-8 pb-6 min-h-screen transition-all duration-300">
          <div className="max-w-full sm:max-w-7xl mx-auto">{children}</div>
        </main> */}
      </div>
    </div>
  );
};

export default ShopHeader;