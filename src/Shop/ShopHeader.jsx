// src/components/ShopHeader.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import {
  FiUser, FiLogOut, FiMenu, FiX, FiSearch,
  FiTag,
} from 'react-icons/fi';
import {
  RiBox2Line, RiInbox2Line, RiMessage2Line, RiMoneyDollarCircleLine,
  RiPriceTag2Line, RiShoppingBag2Line, RiStore2Line, RiToolsFill,
} from 'react-icons/ri';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import logo from '../images/new-logo.jpg';

/* --------------------------------------------------------------- */
/* Debounce utility for search                                      */
/* --------------------------------------------------------------- */
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/* --------------------------------------------------------------- */
/* ShopHeader component                                            */
/* --------------------------------------------------------------- */
const ShopHeader = ({ children }) => {
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
    { name: 'repairs',   icon: <RiToolsFill className="text-xl" />,   label: 'طلبات التصليح', path: '/repair/requests' },
    { name: 'devices',   icon: <RiBox2Line className="text-xl" />,   label: 'المنتجات', path: '/shop/devices' },
    { name: 'orders',    icon: <RiShoppingBag2Line className="text-xl" />, label: 'الطلبات', path: '/shop/orders' },
    { name: 'transactions', icon: <RiMoneyDollarCircleLine className="text-xl" />, label: 'الفواتير', path: '/shop/transactions' },
    { name: 'inventory', icon: <RiInbox2Line className="text-xl" />, label: 'جرد', path: '/shop/inventory' },
    { name: 'subscription', icon: <RiPriceTag2Line className="text-xl" />, label: 'الاشتراك', path: '/subscriptions' },
    { name: 'offers',    icon: <FiTag className="text-xl" />, label: 'العروض', path: '/shop/offers' },
    { name: 'support',   icon: <RiMessage2Line className="text-xl" />, label: 'الدردشات', path: '/support' },
  ];

  const isTokenExpired = useCallback((t) => {
    try {
      const decoded = jwtDecode(t);
      return !decoded.exp || decoded.exp < Date.now() / 1000;
    } catch { return true; }
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
      toast.success('تم تسجيل الخروج بنجاح');
      navigate('/login');
    } catch (err) {
      console.error(err);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  }, [navigate, token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setSidebarOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(
    debounce((query) => {
      if (!query.trim()) setFilteredMenuItems(menuItems);
      else {
        const lower = query.toLowerCase();
        const filtered = menuItems.filter(i => i.label.toLowerCase().includes(lower));
        setFilteredMenuItems(filtered);
      }
    }, 300),
    [menuItems]
  );

  useEffect(() => { handleSearch(searchQuery); }, [searchQuery, handleSearch]);

  return (
    <div dir="rtl" className="min-h-screen font-cairo bg-gradient-to-br from-lime-50 via-white to-lime-50 text-black">
      {/* ====================== Header ====================== */}
      <header className="fixed top-0 inset-x-0 h-16 flex items-center justify-between px-4 sm:px-6 z-40  bg-white">
        <Link to="/shop-dashboard" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-8 sm:h-32 w-auto " />
          {/* <h1 className="hidden sm:block text-lg font-extrabold text-white drop-shadow">Tech & Restore</h1> */}
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="ابحث..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-full text-sm bg-white/90 backdrop-blur-sm text-black placeholder-gray-500 border border-lime-200 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500 transition-all"
            />
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/20 transition-all"
            >
              <FiUser className="text-gray-200" />
              <span className="hidden sm:inline text-sm font-bold text-gray-700">حسابي</span>
            </button>

            {profileOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-lg shadow-xl p-3 bg-white border border-lime-100">
                <Link
                  to="/shop/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-lime-50 text-black transition-colors"
                >
                  <FiUser className="text-gray-500" />
                  بيانات الحساب
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 p-2 w-full text-left text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <FiLogOut />
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-full text-white hover:bg-white/20 transition-all md:hidden"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </header>

      {/* ====================== Sidebar ====================== */}
      <aside
        ref={sidebarRef}
        className={`fixed top-16 right-0 h-[calc(100vh-4rem)] overflow-y-auto w-20 md:w-64 transition-transform duration-300 z-30 shadow-xl bg-white border-l border-lime-100 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <nav className="p-4 h-full flex flex-col">
          <ul className="space-y-2 flex-1 mt-6">
            {(filteredMenuItems.length ? filteredMenuItems : menuItems).map(item => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-lg font-bold transition-all group ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-lime-500 to-lime-400 text-white shadow-md'
                      : 'text-gray-700 hover:bg-lime-50'
                  }`}
                >
                  <span className={location.pathname === item.path ? 'text-white' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  <span className="hidden md:inline">{item.label}</span>
                  <span className="absolute -left-full mr-2 px-2 py-1 text-sm text-white bg-lime-600 rounded opacity-0 group-hover:opacity-100 transition-opacity md:hidden">
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ====================== Main Content ====================== */}
      <main className="pt-16 transition-all duration-300 min-h-screen bg-gradient-to-br from-lime-50 via-white to-lime-50 pr-20 md:pr-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ShopHeader;