import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiX, FiShoppingCart, FiBell } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import logo from "../images/final-logobg.webp";
import {
  RiAccountBoxLine, RiBellLine, RiDeviceLine, RiHome3Line,
  RiLoginBoxLine, RiRegisteredLine, RiShoppingCartLine,
  RiStore2Line, RiSunLine, RiMoonLine, RiTruckLine, RiHome2Line,
  RiLogoutBoxRLine, RiNotificationLine
} from "react-icons/ri";



const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

  :root {
    --em: #10b981;
    --em-dim: rgba(16,185,129,0.15);
    --em-glow: rgba(16,185,129,0.35);
    --red-badge: #ef4444;
  }

  html, body { overflow-x: hidden; max-width: 100vw; }
  .nav-pill { font-family: 'Poppins', sans-serif; }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes badgePop {
    0%   { transform: scale(0.5); opacity: 0; }
    70%  { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 0.9; }
  }

  .notif-panel { animation: slideDown 0.22s cubic-bezier(.16,1,.3,1) both; }
  .notif-item  { animation: fadeUp 0.18s ease both; }

  .badge-pop { animation: badgePop 0.35s cubic-bezier(.16,1,.3,1) both; }

  .shimmer-line {
    background: linear-gradient(90deg, transparent 25%, rgba(16,185,129,0.18) 50%, transparent 75%);
    background-size: 200% auto;
    animation: shimmer 2.4s linear infinite;
  }

  .active-indicator {
    position: relative;
  }
  .active-indicator::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background: var(--em);
    border-radius: 50%;
    box-shadow: 0 0 6px var(--em-glow);
  }

  .icon-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
    border: 1px solid transparent;
  }
  .icon-btn:hover { transform: translateY(-1px); }
  .icon-btn:active { transform: scale(0.94); }

  .dark-icon-btn {
    background: rgba(16,185,129,0.06);
    border-color: rgba(16,185,129,0.12);
  }
  .dark-icon-btn:hover {
    background: rgba(16,185,129,0.14);
    border-color: rgba(16,185,129,0.25);
    box-shadow: 0 0 14px rgba(16,185,129,0.18);
  }
  .light-icon-btn {
    background: #f3f4f6;
    border-color: #e5e7eb;
  }
  .light-icon-btn:hover {
    background: #e9f7f0;
    border-color: #a7f3d0;
  }

  .nav-link-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 50px;
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: 0.01em;
    transition: all 0.22s cubic-bezier(.16,1,.3,1);
    white-space: nowrap;
    text-decoration: none;
  }

  .nav-link-active-dark {
    background: linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.14));
    color: #34d399;
    border: 1px solid rgba(16,185,129,0.3);
    box-shadow: 0 0 20px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
  }
  .nav-link-active-light {
    background: white;
    color: #059669;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(16,185,129,0.15);
  }
  .nav-link-inactive-dark {
    color: #6ee7b7;
    border: 1px solid transparent;
  }
  .nav-link-inactive-dark:hover {
    background: rgba(16,185,129,0.08);
    border-color: rgba(16,185,129,0.15);
    color: #34d399;
  }
  .nav-link-inactive-light {
    color: #374151;
    border: 1px solid transparent;
  }
  .nav-link-inactive-light:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #111827;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 20px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 700;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    border: none;
    box-shadow: 0 4px 14px rgba(16,185,129,0.35);
    letter-spacing: 0.02em;
  }
  .logout-btn:hover {
    background: linear-gradient(135deg, #059669, #047857);
    box-shadow: 0 6px 20px rgba(16,185,129,0.45);
    transform: translateY(-1px);
  }
  .logout-btn:active { transform: scale(0.97); }

  .notif-item:nth-child(1) { animation-delay: 0.02s; }
  .notif-item:nth-child(2) { animation-delay: 0.05s; }
  .notif-item:nth-child(3) { animation-delay: 0.08s; }
  .notif-item:nth-child(4) { animation-delay: 0.11s; }
  .notif-item:nth-child(5) { animation-delay: 0.14s; }

  .mobile-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-radius: 14px;
    font-size: 10px;
    font-weight: 600;
    font-family: 'Outfit', sans-serif;
    transition: all 0.2s;
    text-decoration: none;
    min-width: 52px;
  }

  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    pointer-events: none;
    animation: glowPulse 3s ease-in-out infinite;
  }

  /* Thin scrollbar for notif panel */
  .notif-scroll::-webkit-scrollbar { width: 4px; }
  .notif-scroll::-webkit-scrollbar-track { background: transparent; }
  .notif-scroll::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.3); border-radius: 4px; }
`;

const formatTime = (ts) => {
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch { return ""; }
};





const Navbar = ({ onCartClick, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);

  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0);


  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
    };
    if (showNotifications) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifications]);

  const safeDecodeJwt = useCallback((t) => {
    if (!t) return null;
    try { return jwtDecode(t); } catch { return null; }
  }, []);

  const isTokenExpired = useCallback((t) => {
    const d = safeDecodeJwt(t);
    return !d || !d.exp || d.exp < Date.now() / 1000;
  }, [safeDecodeJwt]);

  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (token && refreshToken)
        await api.post("/api/auth/logout", { refreshToken });
    } catch {}
    localStorage.clear();
    setToken(null);
    setIsAuthenticated(false);
    toast.success("Logged out successfully!");
    navigate("/login", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    const cur = localStorage.getItem("authToken");
    if (!cur || isTokenExpired(cur)) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      setIsAuthenticated(false);
      if (!["/login", "/signup"].includes(location.pathname)) navigate("/login");
    } else {
      setToken(cur);
      setIsAuthenticated(true);
    }
  }, [location.pathname, navigate, isTokenExpired]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoadingNotifs(true);
    try {
      const res = await api.get("/api/notifications/users");
      const data = res.data?.content || res.data || [];
      const prevUnread = unreadCount;
      const newUnread = data.filter(n => !n.read).length;
      setNotifications(data);
      if (newUnread > prevUnread) setBadgeKey(k => k + 1);
      setUnreadCount(newUnread);
    } catch { console.warn("Failed to load notifications"); }
    finally { setLoadingNotifs(false); }
  }, [token, unreadCount]);

  const deleteNotification = async (notifId) => {
    try {
      await api.delete(`/api/notifications/users/${notifId}`);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success("Notification removed");
    } catch { toast.error("Failed to delete"); }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const iv = setInterval(fetchNotifications, 30000);
      return () => clearInterval(iv);
    }
  }, [isAuthenticated, fetchNotifications]);

  const navItems = useMemo(() =>
    isAuthenticated
      ? [
          { name: "Home",    path: "/",        icon: <RiHome3Line size={17} /> },
          { name: "Devices", path: "/devices", icon: <RiDeviceLine size={17} /> },
          { name: "Shops",   path: "/shops",   icon: <RiStore2Line size={16} /> },
          { name: "Track",   path: "/track",   icon: <RiTruckLine size={17} /> },
          { name: "Account", path: "/account", icon: <RiAccountBoxLine size={16} /> },
        ]
      : [
          { name: "Home",   path: "/",       icon: <RiHome2Line size={17} /> },
          { name: "Login",  path: "/login",  icon: <RiLoginBoxLine size={16} /> },
          { name: "Signup", path: "/signup", icon: <RiRegisteredLine size={16} /> },
        ],
    [isAuthenticated]
  );


  
  const navBg = useMemo(() => 
    darkMode
      ? scrolled
        ? "bg-[#030a06]/85 border-emerald-500/20 shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
        : "bg-[#030a06]/70 border-emerald-500/12"
      : scrolled
        ? "bg-white/98 border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
        : "bg-white/95 border-gray-200",
    [darkMode, scrolled]
  );

  const pillBg = useMemo(() => 
    darkMode
      ? "bg-[#0d1a12]/80 border border-emerald-900/40"
      : "bg-gray-100/90 border border-gray-200",
    [darkMode]
  );

  return (
    <>
      
      

      <style>{STYLES}</style>

      <ToastContainer
        position="top-right"
        theme={darkMode ? "dark" : "light"}
        toastStyle={{ fontFamily: "'Poppins', sans-serif", fontSize: 14 }}
      />

     
     
     
      <nav className={`nav-pill font-sans hidden md:flex items-center justify-between px-8 py-4 fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl  transition-all duration-300 ${navBg}`}>

      
      
        {darkMode && (
          <div
            className="glow-orb"
            style={{ width: 320, height: 60, top: -20, left: "40%", background: "rgba(16,185,129,0.07)" }}
          />
        )}

        
        
        <Link to="/" className="flex items-center shrink-0 group">
          <div className="relative">
            <img
              src={logo}
              alt="Tech & Restore"
              className="h-14 w-auto rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ transform: "scale(1.35)", transformOrigin: "left center" }}
            />
            {darkMode && (
              <div className="absolute inset-0 rounded-xl bg-emerald-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10" />
            )}
          </div>
        </Link>

        
        
        <div className={`flex items-center gap-1 px-2 py-2 rounded-full ${pillBg}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `nav-link-item ${
                  isActive
                    ? darkMode ? "nav-link-active-dark" : "nav-link-active-light"
                    : darkMode ? "nav-link-inactive-dark" : "nav-link-inactive-light"
                }`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

      
      
        <div className="flex items-center gap-2 shrink-0">

          {isAuthenticated && (
            <>
            
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(v => !v)}
                  className={`icon-btn ${darkMode ? "dark-icon-btn" : "light-icon-btn"}`}
                  aria-label="Notifications"
                >
                  <FiBell
                    size={20}
                    className={darkMode ? "text-emerald-400" : "text-emerald-600"}
                    style={{ transition: "transform 0.2s" }}
                  />
                  {unreadCount > 0 && (
                    <span
                      key={badgeKey}
                      className="badge-pop absolute -top-1.5 -right-1.5 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                      style={{
                        background: "linear-gradient(135deg,#ef4444,#dc2626)",
                        boxShadow: "0 0 10px rgba(239,68,68,0.55)",
                        fontFamily: "'Outfit',sans-serif"
                      }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

               
               
                {showNotifications && (
                  <div
                    className={`notif-panel absolute right-0 mt-3 w-[380px] rounded-2xl overflow-hidden border shadow-2xl ${
                      darkMode
                        ? "bg-[#050e08]/95 backdrop-blur-2xl border-emerald-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
                        : "bg-white border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
                    }`}
                  >
                    
                    
                    <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-emerald-500/15" : "border-gray-100"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${darkMode ? "bg-emerald-500/15" : "bg-emerald-50"}`}>
                          <RiNotificationLine size={16} className="text-emerald-500" />
                        </div>
                        <div>
                          <p className={`text-sm font-700 font-bold ${darkMode ? "text-white" : "text-gray-900"}`} style={{ fontFamily: "'Outfit',sans-serif" }}>
                            Notifications
                          </p>
                          {unreadCount > 0 && (
                            <p className="text-xs text-emerald-500 font-medium">
                              {unreadCount} unread
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className={`p-1.5 rounded-lg transition ${darkMode ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"}`}
                      >
                        <FiX size={16} />
                      </button>
                    </div>

                    
                    
                    <div className="notif-scroll max-h-[340px] overflow-y-auto">
                      {loadingNotifs ? (
                        <div className="p-6 space-y-3">
                          {[1,2,3].map(i => (
                            <div key={i} className={`h-14 rounded-xl shimmer-line ${darkMode ? "bg-white/5" : "bg-gray-100"}`} />
                          ))}
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <div className={`p-4 rounded-2xl ${darkMode ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                            <RiBellLine size={28} className="text-emerald-500/60" />
                          </div>
                          <p className={`text-sm font-medium ${darkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "'Outfit',sans-serif" }}>
                            You're all caught up!
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif, idx) => (
                          <div
                            key={notif.id}
                            className={`notif-item group px-5 py-4 border-b transition-all ${
                              darkMode
                                ? `border-emerald-500/08 hover:bg-emerald-500/06 ${!notif.read ? "bg-emerald-500/06" : ""}`
                                : `border-gray-50 hover:bg-gray-50 ${!notif.read ? "bg-emerald-50/60" : ""}`
                            }`}
                          >
                            <div className="flex items-start gap-3">
                            
                            
                              <div className="mt-1.5 shrink-0">
                                {!notif.read
                                  ? <div className="w-2 h-2 rounded-full bg-emerald-500" style={{ boxShadow: "0 0 6px rgba(16,185,129,0.7)" }} />
                                  : <div className={`w-2 h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold leading-snug truncate ${darkMode ? "text-gray-100" : "text-gray-900"}`} style={{ fontFamily: "'Outfit',sans-serif" }}>
                                  {notif.title}
                                </p>
                                <p className={`text-xs mt-0.5 line-clamp-2 ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                                  {notif.message}
                                </p>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-1.5 font-medium">
                                  {formatTime(notif.timestamp)}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteNotification(notif.id)}
                                className={`shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition ${darkMode ? "hover:bg-red-500/20 text-gray-600 hover:text-red-400" : "hover:bg-red-50 text-gray-300 hover:text-red-400"}`}
                              >
                                <FiX size={13} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

             
             
              <button
                onClick={onCartClick}
                className={`icon-btn ${darkMode ? "dark-icon-btn" : "light-icon-btn"}`}
                aria-label="Cart"
              >
                <RiShoppingCartLine
                  size={20}
                  className={darkMode ? "text-emerald-400" : "text-emerald-600"}
                />
              </button>
            </>
          )}

         
         
          <button
            onClick={toggleDarkMode}
            className={`icon-btn ${darkMode ? "dark-icon-btn" : "light-icon-btn"} overflow-hidden`}
            aria-label="Toggle theme"
          >
            <span
              style={{
                display: "inline-flex",
                transition: "transform 0.4s cubic-bezier(.16,1,.3,1), opacity 0.3s",
                transform: darkMode ? "rotate(0deg)" : "rotate(180deg)",
              }}
            >
              {darkMode
                ? <RiMoonLine size={20} className="text-emerald-400" />
                : <RiSunLine size={20} className="text-amber-500" />
              }
            </span>
          </button>

         
         

          {isAuthenticated && (
            <button onClick={handleLogout} className="logout-btn ml-1">
              <RiLogoutBoxRLine size={16} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </nav>


      
      

      <nav className={`nav-pill md:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b dark:border-none transition-all duration-300 ${navBg}`}>
        <div className="flex justify-between items-center px-5 py-3">
          <Link to="/">
            <img
              src={logo}
              alt="Logo"
              className="h-12 rounded-xl object-cover"
              style={{ transform: "scale(1.25)", transformOrigin: "left center" }}
            />
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
               
               
                <button
                  onClick={() => setShowNotifications(v => !v)}
                  className={`icon-btn ${darkMode ? "dark-icon-btn" : "light-icon-btn"}`}
                >
                  <FiBell size={19} className={darkMode ? "text-emerald-400" : "text-emerald-600"} />
                  {unreadCount > 0 && (
                    <span
                      className="badge-pop absolute -top-1 -right-1 text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] flex items-center justify-center px-0.5"
                      style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", fontFamily: "'Outfit',sans-serif" }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <button onClick={onCartClick} className={`icon-btn ${darkMode ? "dark-icon-btn" : "light-icon-btn"}`}>
                  <RiShoppingCartLine size={19} className={darkMode ? "text-emerald-400" : "text-emerald-600"} />
                </button>
              </>
            )}
            <button
              onClick={toggleDarkMode}
              className={`icon-btn ${darkMode ? "dark-icon-btn" : "light-icon-btn"}`}
            >
              {darkMode
                ? <RiMoonLine size={19} className="text-emerald-400" />
                : <RiSunLine size={19} className="text-amber-500" />}
            </button>
          </div>
        </div>

       
       
        {showNotifications && (
          <div className={`notif-panel mx-4 mb-3 rounded-2xl overflow-hidden border ${
            darkMode
              ? "bg-[#050e08]/98 border-emerald-500/25"
              : "bg-white border-gray-200 shadow-lg"
          }`}>
            <div className={`flex justify-between items-center px-4 py-3 border-b ${darkMode ? "border-emerald-500/15" : "border-gray-100"}`}>
              <span className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`} style={{ fontFamily: "'Outfit',sans-serif" }}>
                Notifications {unreadCount > 0 && <span className="text-emerald-500">({unreadCount})</span>}
              </span>
              <button onClick={() => setShowNotifications(false)}>
                <FiX size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
              </button>
            </div>
            <div className="notif-scroll max-h-64 overflow-y-auto">
              {loadingNotifs ? (
                <p className="p-6 text-center text-sm text-gray-500">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500">No notifications</p>
              ) : notifications.map(notif => (
                <div key={notif.id} className={`notif-item flex items-start gap-3 px-4 py-3 border-b ${darkMode ? "border-white/5" : "border-gray-50"}`}>
                  <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${!notif.read ? "bg-emerald-500" : darkMode ? "bg-gray-700" : "bg-gray-300"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{notif.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{notif.message}</p>
                  </div>
                  <button onClick={() => deleteNotification(notif.id)}>
                    <FiX size={12} className="text-gray-400 hover:text-red-400 mt-1" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>


      
      <div className={`nav-pill md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl border-t transition-all duration-300 ${
        darkMode
          ? "bg-[#030a06]/90 border-emerald-500/15"
          : "bg-white/98 border-gray-200"
      }`}>
       
       
        {darkMode && (
          <div className="absolute top-0 left-0 right-0 h-px shimmer-line" />
        )}
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `mobile-tab ${
                  isActive
                    ? darkMode
                      ? "text-emerald-400 bg-emerald-500/12"
                      : "text-emerald-600 bg-white border"
                    : darkMode
                      ? "text-gray-500"
                      : "text-gray-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span style={{
                    filter: isActive && darkMode ? "drop-shadow(0 0 6px rgba(16,185,129,0.7))" : "none",
                    transition: "filter 0.2s, transform 0.2s",
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                    display: "inline-flex"
                  }}>
                    {item.icon}
                  </span>
                  <span style={{ letterSpacing: "0.01em" }}>{item.name}</span>
                  {isActive && (
                    <span
                      className="absolute bottom-1 left-1/2 w-4 h-0.5 rounded-full bg-emerald-500"
                      style={{
                        transform: "translateX(-50%)",
                        boxShadow: darkMode ? "0 0 6px rgba(16,185,129,0.8)" : "none"
                      }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};

export default memo(Navbar);