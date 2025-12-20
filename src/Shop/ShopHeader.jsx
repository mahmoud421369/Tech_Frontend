// src/components/ShopHeader.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiUser, FiLogOut, FiMenu, FiX, FiSearch, FiBell, FiTrash2,
  FiTag
} from 'react-icons/fi';
import {
  RiBox2Line, RiInbox2Line, RiMessage2Line, RiMoneyDollarCircleLine,
  RiPriceTag2Line, RiShoppingBag2Line, RiStore2Line, RiToolsFill,
} from 'react-icons/ri';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import logo from '../images/new-logo.jpg';

/* --------------------------------------------------------------- */
/* Debounce utility                                                */
/* --------------------------------------------------------------- */
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const ShopHeader = ({ children }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);

  
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);
  const sidebarRef = useRef(null);
  const notificationRef = useRef(null);
 

  const location = useLocation();
  const navigate = useNavigate();

  const [token,setToken] = useState(localStorage.getItem('authToken'));
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
      return decoded.exp < Date.now() / 1000;
    } catch {
      return true;
    }
  }, []);

  const handleLogout = useCallback(async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      try {
        if (token && refreshToken) {
          await api.post("/api/auth/logout", { refreshToken });
        }
      } catch (err) {
        console.warn("Logout API failed (ignored):", err);
      } finally {
        localStorage.clear();
        setToken(null);
        setIsAuthenticated(false);
        toast.success("Logged out!", { autoClose: 1500 });
        navigate("/login", { replace: true });
      }
    }, [token, navigate]);

 
  const fetchNotifications = useCallback(async () => {
    if (!token || isTokenExpired(token)) return;

    setLoading(true);
    try {
      const res = await api.get('/api/notifications/shops', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = res.data || [];
      
      const sorted = data.sort((a, b) => new Date(b.timestamps) - new Date(a.timestamps));
      setNotifications(sorted);


      const unread = sorted.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error(err);
      toast.error('فشل تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  }, [token, isTokenExpired]);

 
  const deleteNotification = async (id) => {
    try {
      await api.delete(`/api/notifications/shops/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(prev => prev > 0 ? prev - 1 : 0);
      toast.success('تم حذف الإشعار');
    } catch (err) {
      toast.error('فشل حذف الإشعار');
    }
  };


  const deleteAllNotifications = async () => {
    try {
      await api.delete('/api/notifications/shops', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      setUnreadCount(0);
      toast.success('تم حذف جميع الإشعارات');
    } catch (err) {
      toast.error('فشل حذف الإشعارات');
    }
  };


  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setSidebarOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(
    debounce((query) => {
      if (!query.trim()) {
        setFilteredMenuItems(menuItems);
      } else {
        const filtered = menuItems.filter(item =>
          item.label.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredMenuItems(filtered);
      }
    }, 300),
    []
  );

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  return (
    <div dir="rtl" className="min-h-screen font-cairo bg-gradient-to-br from-lime-50 via-white to-lime-50 text-black">
     
      <header className="fixed top-0 inset-x-0 h-16 flex items-center justify-between flex-row-reverse px-4 sm:px-6 z-40 bg-white shadow-md">
        <Link to="/shop-dashboard" className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-14 w-32 object-cover" />
        </Link>

        <div className="flex items-center gap-4">

          
          <div className="hidden md:block relative w-64">
            <input
              type="text"
              placeholder="ابحث في القوائم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-full bg-gray-100 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-400 transition"
            />
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

         
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2.5 rounded-full hover:bg-gray-100 transition-all"
            >
              <FiBell className="text-2xl text-gray-500" />
              
              
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

           
            {notificationsOpen && (
              <div className="absolute left-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
     
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">الإشعارات</h3>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-500">{unreadCount} غير مقرؤة</p>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={deleteAllNotifications}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 transition"
                    >
                      <FiTrash2 className="text-lg" />
                      مسح الكل
                    </button>
                  )}
                </div>

                
                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-10 text-center text-gray-400">جاري التحميل...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-10 text-center text-gray-400">
                      <FiBell className="mx-auto text-4xl mb-3 text-gray-300" />
                      <p>لا توجد إشعارات</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-6 py-4 border-b border-gray-50 hover:bg-lime-50 transition cursor-pointer ${
                          !notif.isRead ? 'bg-lime-50/70' : 'bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800">{notif.title || 'إشعار'}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notif.timestamp).toLocaleString('ar-EG', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="text-gray-400 hover:text-red-600 transition"
                          >
                            <FiX className="text-lg" />
                          </button>
                        </div>
                        {!notif.isRead && (
                          <div className="mt-3 w-2 h-2 bg-lime-500 rounded-full"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                
                <div className="p-4 bg-gray-50 text-center border-t">
                  <Link
                    to="/shop/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-lime-600 hover:text-lime-700 font-medium text-sm"
                  >
                    عرض جميع الإشعارات →
                  </Link>
                </div>
              </div>
            )}
          </div>

         
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <FiUser className="text-xl text-gray-500" />
              {/* <span className="hidden sm:inline text-gray-700 font-medium">حسابي</span> */}
            </button>

            {profileOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                <Link to="/shop/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-lime-50">
                  <FiUser /> بيانات الحساب
                </Link>
                <button onClick={() => { handleLogout(); setProfileOpen(false); }} className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg hover:bg-red-50 text-red-600">
                  <FiLogOut /> تسجيل الخروج
                </button>
              </div>
            )}
          </div>

          
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 md:hidden"
          >
            {sidebarOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
          </button>
        </div>
      </header>

      
      <aside
        ref={sidebarRef}
        className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-20 md:w-64 bg-white shadow-xl transition-transform z-30 border-l border-lime-100 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <nav className="p-4 mt-6">
          <ul className="space-y-2">
            {(filteredMenuItems.length ? filteredMenuItems : menuItems).map(item => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-lg font-bold transition-all group ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-lime-500 to-lime-400 text-white'
                      : 'text-gray-700 hover:bg-lime-50'
                  }`}
                >
                  {item.icon}
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="pt-16 pr-20 md:pr-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ShopHeader;