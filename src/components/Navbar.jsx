import React, { useEffect, useState, useCallback, useMemo, useRef, useTransition } from "react";
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiX, FiBell } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import { motion } from "framer-motion";
import api from "../api";
import {
  RiAccountBoxLine, RiDeviceLine,
  RiLoginBoxLine, RiRegisteredLine, RiShoppingCartLine,
  RiStore2Line, RiSunLine, RiMoonLine, RiTruckLine, RiHome2Line,
  RiLogoutBoxRLine, RiNotificationLine,
} from "react-icons/ri";
import { RiHome4Line } from "@remixicon/react";

const queryClient = new QueryClient();

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

  :root {
    --em: #10b981;
    --em-dim: rgba(16,185,129,0.15);
    --em-glow: rgba(16,185,129,0.35);
    --red-badge: #ef4444;
    --ease-snap: cubic-bezier(.2,.8,.2,1);
  }

  html, body { overflow-x: hidden; max-width: 100vw; }
  .nav-pill, .nav-pill * { font-family: 'Poppins', sans-serif; }
  .Toastify__toast { font-family: 'Poppins', sans-serif; }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes badgePop {
    0%   { transform: scale(0.5); opacity: 0; }
    60%  { transform: scale(1.18); }
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

  .notif-panel { animation: slideDown 0.14s var(--ease-snap) both; }
  .notif-item  { animation: fadeUp 0.12s ease both; }

  .badge-pop { animation: badgePop 0.2s var(--ease-snap) both; }

  .shimmer-line {
    background: linear-gradient(90deg, transparent 25%, rgba(16,185,129,0.18) 50%, transparent 75%);
    background-size: 200% auto;
    animation: shimmer 2.4s linear infinite;
  }

  .icon-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.12s var(--ease-snap), border-color 0.12s var(--ease-snap), transform 0.1s var(--ease-snap), box-shadow 0.12s var(--ease-snap);
    border: 1px solid transparent;
  }
  .icon-btn:hover { transform: translateY(-1px); }
  .icon-btn:active { transform: scale(0.93); }

  .dark-icon-btn {
    background: rgba(16,185,129,0.08);
    border-color: rgba(16,185,129,0.16);
  }
  .dark-icon-btn:hover {
    background: rgba(16,185,129,0.2);
    border-color: rgba(16,185,129,0.35);
    box-shadow: 0 0 14px rgba(16,185,129,0.25);
  }
  .light-icon-btn {
    background: rgba(255,255,255,0.5);
    border-color: rgba(16,185,129,0.15);
  }
  .light-icon-btn:hover {
    background: rgba(16,185,129,0.12);
    border-color: rgba(16,185,129,0.35);
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
    transition: background 0.14s var(--ease-snap), color 0.14s var(--ease-snap), border-color 0.14s var(--ease-snap), box-shadow 0.14s var(--ease-snap), transform 0.1s var(--ease-snap);
    white-space: nowrap;
    text-decoration: none;
  }
  .nav-link-item:active { transform: scale(0.97); }

  .nav-link-active-dark {
    background: linear-gradient(135deg, rgba(16,185,129,0.28), rgba(5,150,105,0.18));
    color: #6ee7b7;
    border: 1px solid rgba(16,185,129,0.35);
    box-shadow: 0 0 20px rgba(16,185,129,0.18), inset 0 1px 0 rgba(255,255,255,0.06);
  }
  .nav-link-active-light {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    box-shadow: 0 4px 14px rgba(16,185,129,0.3);
  }
  .nav-link-inactive-dark {
    color: #a7f3d0;
    border: 1px solid transparent;
  }
  .nav-link-inactive-dark:hover {
    background: rgba(16,185,129,0.1);
    border-color: rgba(16,185,129,0.2);
    color: #6ee7b7;
  }
  .nav-link-inactive-light {
    color: #065f46;
    border: 1px solid transparent;
  }
  .nav-link-inactive-light:hover {
    background: rgba(16,185,129,0.1);
    border-color: rgba(16,185,129,0.25);
    color: #047857;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 20px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.14s var(--ease-snap), box-shadow 0.14s var(--ease-snap), transform 0.1s var(--ease-snap);
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
  .logout-btn:active { transform: scale(0.96); }

  .notif-item:nth-child(1) { animation-delay: 0.01s; }
  .notif-item:nth-child(2) { animation-delay: 0.025s; }
  .notif-item:nth-child(3) { animation-delay: 0.04s; }
  .notif-item:nth-child(4) { animation-delay: 0.055s; }
  .notif-item:nth-child(5) { animation-delay: 0.07s; }

  .mobile-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-radius: 14px;
    font-size: 10px;
    font-weight: 600;
    transition: background 0.14s var(--ease-snap), color 0.14s var(--ease-snap), transform 0.1s var(--ease-snap);
    text-decoration: none;
    min-width: 52px;
  }
  .mobile-tab:active { transform: scale(0.94); }

  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
    pointer-events: none;
    animation: glowPulse 3s ease-in-out infinite;
  }

  .nav-bar-desktop {
    transition: background-color 0.25s var(--ease-snap), border-color 0.25s var(--ease-snap),
                box-shadow 0.25s var(--ease-snap), padding 0.25s var(--ease-snap),
                margin 0.25s var(--ease-snap), border-radius 0.25s var(--ease-snap),
                transform 0.25s var(--ease-snap), backdrop-filter 0.25s var(--ease-snap);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    backdrop-filter: saturate(180%) blur(20px);
  }
  .nav-bar-mobile {
    transition: background-color 0.25s var(--ease-snap), border-color 0.25s var(--ease-snap),
                box-shadow 0.25s var(--ease-snap), margin 0.25s var(--ease-snap),
                border-radius 0.25s var(--ease-snap), transform 0.25s var(--ease-snap);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    backdrop-filter: saturate(180%) blur(20px);
  }

  .glass-dark-top {
    background: rgba(6, 20, 14, 0.35);
    border-color: rgba(16,185,129,0.14);
  }
  .glass-dark-scrolled {
    background: rgba(31, 34, 33, 0.68);
    border-color: rgba(16,185,129,0.22);
    box-shadow: 0 10px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(16,185,129,0.05) inset;
  }
  .glass-dark-deep {
    background: rgba(26, 29, 28, 0.78);
    border-color: rgba(16,185,129,0.28);
    box-shadow: 0 14px 50px rgba(0,0,0,0.55), 0 0 20px rgba(16,185,129,0.1);
  }
  .glass-light-top {
    background: rgba(255, 255, 255, 0.45);
    border-color: rgba(16,185,129,0.12);
  }
  .glass-light-scrolled {
    background: rgba(243, 244, 246, 0.78);
    border-color: rgba(209, 213, 219, 0.6);
    box-shadow: 0 10px 34px rgba(0,0,0,0.08);
  }
  .glass-light-deep {
    background: rgba(229, 231, 235, 0.85);
    border-color: rgba(16,185,129,0.2);
    box-shadow: 0 14px 40px rgba(0,0,0,0.1);
  }

  .notif-scroll::-webkit-scrollbar { width: 4px; }
  .notif-scroll::-webkit-scrollbar-track { background: transparent; }
  .notif-scroll::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.3); border-radius: 4px; }

  @media (prefers-reduced-motion: reduce) {
    .notif-panel, .notif-item, .badge-pop, .shimmer-line, .glow-orb,
    .icon-btn, .nav-link-item, .logout-btn, .mobile-tab,
    .nav-bar-desktop, .nav-bar-mobile {
      animation-duration: 0.001s !important;
      transition-duration: 0.001s !important;
    }
  }
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

const BrandMark = ({ darkMode, size = 34 }) => {
  const line = darkMode ? "#34d399" : "#059669";
  const soft = darkMode ? "rgba(52,211,153,0.18)" : "rgba(5,150,105,0.12)";
  return (
    <motion.svg
      viewBox="0 0 48 48"
      width={size} height={size}
      animate={{ rotate: [0, 4, 0, -4, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <rect x="3" y="3" width="42" height="42" rx="13" fill={soft} />
      <rect x="14" y="10" width="20" height="28" rx="5" fill="none" stroke={line} strokeWidth="2.6" />
      <line x1="19" y1="16" x2="29" y2="16" stroke={line} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="31" r="3.2" fill="none" stroke={line} strokeWidth="2.2" />
      <motion.path
        d="M31 21 L36 16 M36 16 L36 20 M36 16 L32 16"
        stroke={line} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
};

const AllCaughtUpIllustration = ({ darkMode, size = 64 }) => {
  const line = darkMode ? "#34d399" : "#059669";
  const soft = darkMode ? "rgba(52,211,153,0.14)" : "rgba(5,150,105,0.1)";
  return (
    <svg viewBox="0 0 120 120" width={size} height={size}>
      <motion.circle cx="60" cy="60" r="46" fill={soft}
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
      <circle cx="60" cy="60" r="30" fill="none" stroke={line} strokeWidth="2" opacity="0.5" />
      <motion.path
        d="M44 61 L55 72 L78 47"
        fill="none" stroke={line} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
};

const NavbarContent = ({ onCartClick, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);

  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const [scrollTier, setScrollTier] = useState("top");
  const [hideOnScroll, setHideOnScroll] = useState(false);
  const lastScrollY = useRef(0);

  const queryClient = useQueryClient();

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const last = lastScrollY.current;

        if (y > 120) setScrollTier("deep");
        else if (y > 12) setScrollTier("scrolled");
        else setScrollTier("top");

        if (y > last && y > 160) setHideOnScroll(true);
        else if (y < last) setHideOnScroll(false);

        lastScrollY.current = y;
        ticking = false;
      });
    };

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

  const { data: notifications = [], isLoading: loadingNotifs } = useQuery({
    queryKey: ['notifications', token],
    queryFn: async () => {
      const res = await api.get("/api/notifications/users", { headers: { Authorization: `Bearer ${token}` } });
      return res.data?.content || res.data || [];
    },
    enabled: isAuthenticated && !!token,
    refetchInterval: 30000,
  });

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  useEffect(() => {
    if (unreadCount > 0) {
      setBadgeKey(k => k + 1);
    }
  }, [unreadCount]);

  const deleteNotification = async (notifId) => {
    try {
      await api.delete(`/api/notifications/users/${notifId}`, { headers: { Authorization: `Bearer ${token}` } });
      queryClient.setQueryData(['notifications', token], (old) => old ? old.filter(n => n.id !== notifId) : []);
      toast.success("Notification removed");
    } catch { toast.error("Failed to delete"); }
  };

  const navItems = useMemo(() =>
    isAuthenticated
      ? [
          { name: "Home",    path: "/",        icon: <RiHome4Line size={17} /> },
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

  const scrolled = scrollTier !== "top";
  const deep = scrollTier === "deep";

  const glassClass = useMemo(() => {
    const tone = darkMode ? "dark" : "light";
    return `glass-${tone}-${scrollTier}`;
  }, [darkMode, scrollTier]);

  const pillBg = useMemo(() =>
    darkMode
      ? "bg-emerald-950/40 border border-emerald-400/20"
      : "bg-white/50 border border-emerald-500/15",
    [darkMode]
  );

  const desktopShellStyle = useMemo(() => ({
    marginLeft: scrolled ? 16 : 0,
    marginRight: scrolled ? 16 : 0,
    marginTop: scrolled ? (deep ? 10 : 12) : 0,
    borderRadius: scrolled ? 9999 : 0,
    paddingLeft: 32,
    paddingRight: 32,
    paddingTop: deep ? 10 : 16,
    paddingBottom: deep ? 10 : 16,
    transform: hideOnScroll ? "translateY(-140%)" : "translateY(0)",
  }), [scrolled, deep, hideOnScroll]);

  const mobileTopShellStyle = useMemo(() => ({
    marginLeft: scrolled ? 10 : 0,
    marginRight: scrolled ? 10 : 0,
    marginTop: scrolled ? 8 : 0,
    borderRadius: scrolled ? 26 : 0,
  }), [scrolled]);

  return (
    <>
      <style>{STYLES}</style>

      <ToastContainer
        position="top-right"
        theme={darkMode ? "dark" : "light"}
        toastStyle={{ fontFamily: "'Poppins', sans-serif", fontSize: 14 }}
      />

      <nav
        className={`nav-pill nav-bar-desktop hidden md:flex items-center justify-between fixed top-0 left-0 right-0 z-50  ${glassClass}`}
        style={desktopShellStyle}
      >
        {darkMode && (
          <div
            className="glow-orb"
            style={{ width: 320, height: 60, top: -20, left: "40%", background: "rgba(16,185,129,0.08)" }}
          />
        )}

        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="relative">
            <BrandMark darkMode={darkMode} />
            {darkMode && (
              <div className="absolute inset-0 rounded-xl bg-emerald-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-150 -z-10" />
            )}
          </div>
          <span
            className="font-extrabold leading-none tracking-tight bg-clip-text text-transparent"
            style={{
              fontSize: deep ? 17 : 19,
              backgroundImage: darkMode
                ? "linear-gradient(135deg, #6ee7b7, #10b981 55%, #047857)"
                : "linear-gradient(135deg, #059669, #10b981 55%, #047857)",
              transition: "font-size 0.18s var(--ease-snap)",
            }}
          >
            Tech<span className={darkMode ? "text-emerald-200/70" : "text-emerald-900/60"}> &amp; </span>Restore
          </span>
        </Link>

        <div className={`flex items-center gap-1 px-2 py-2 rounded-full backdrop-blur-md ${pillBg}`}>
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
                  onClick={() => startTransition(() => setShowNotifications(v => !v))}
                  className={`icon-btn ${darkMode ? "dark-icon-btn" : "light-icon-btn"}`}
                  aria-label="Notifications"
                >
                  <FiBell
                    size={20}
                    className={darkMode ? "text-emerald-400" : "text-emerald-700"}
                  />
                  {unreadCount > 0 && (
                    <span
                      key={badgeKey}
                      className="badge-pop absolute -top-1.5 -right-1.5 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                      style={{
                        background: "linear-gradient(135deg,#ef4444,#dc2626)",
                        boxShadow: "0 0 10px rgba(239,68,68,0.55)",
                      }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div
                    className={`notif-panel absolute right-0 mt-3 w-[380px] rounded-2xl overflow-hidden border shadow-2xl backdrop-blur-2xl ${
                      darkMode
                        ? "bg-emerald-950/60 border-emerald-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
                        : "bg-white/80 border-emerald-500/20 shadow-[0_20px_60px_rgba(16,185,129,0.18)]"
                    }`}
                  >
                    <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-emerald-500/15" : "border-emerald-100"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${darkMode ? "bg-emerald-500/15" : "bg-emerald-50"}`}>
                          <RiNotificationLine size={16} className="text-emerald-500" />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
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
                        onClick={() => startTransition(() => setShowNotifications(false))}
                        className={`p-1.5 rounded-lg transition-colors duration-100 ${darkMode ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-emerald-100 text-gray-400 hover:text-gray-700"}`}
                      >
                        <FiX size={16} />
                      </button>
                    </div>

                    <div className="notif-scroll max-h-[340px] overflow-y-auto">
                      {loadingNotifs ? (
                        <div className="p-6 space-y-3">
                          {[1,2,3].map(i => (
                            <div key={i} className={`h-14 rounded-xl shimmer-line ${darkMode ? "bg-white/5" : "bg-emerald-50"}`} />
                          ))}
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <AllCaughtUpIllustration darkMode={darkMode} />
                          <p className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            You're all caught up!
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`notif-item group px-5 py-4 border-b transition-colors duration-100 ${
                              darkMode
                                ? `border-emerald-500/08 hover:bg-emerald-500/06 ${!notif.read ? "bg-emerald-500/06" : ""}`
                                : `border-emerald-50 hover:bg-emerald-50/60 ${!notif.read ? "bg-emerald-50/70" : ""}`
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
                                <p className={`text-sm font-semibold leading-snug truncate ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
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
                                className={`shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-colors duration-100 ${darkMode ? "hover:bg-red-500/20 text-gray-600 hover:text-red-400" : "hover:bg-red-50 text-gray-300 hover:text-red-400"}`}
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
                  className={darkMode ? "text-emerald-400" : "text-emerald-700"}
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
                transition: "transform 0.2s var(--ease-snap)",
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

      <nav
        className={`nav-pill nav-bar-mobile md:hidden fixed top-0 left-0 right-0 z-50  ${glassClass}`}
        style={mobileTopShellStyle}
      >
        <div
          className="flex justify-between items-center px-5 transition-all duration-150 ease-out"
          style={{ paddingTop: deep ? 8 : 12, paddingBottom: deep ? 8 : 12 }}
        >
          <Link to="/" className="flex items-center gap-2">
            <BrandMark darkMode={darkMode} size={26} />
            <span
              className="font-extrabold leading-none tracking-tight bg-clip-text text-transparent"
              style={{
                fontSize: 14,
                backgroundImage: darkMode
                  ? "linear-gradient(135deg, #6ee7b7, #10b981 55%, #047857)"
                  : "linear-gradient(135deg, #059669, #10b981 55%, #047857)",
              }}
            >
              Tech<span className={darkMode ? "text-emerald-200/70" : "text-emerald-900/60"}> &amp; </span>Restore
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => startTransition(() => setShowNotifications(v => !v))}
                  className={`icon-btn ${darkMode ? "dark-icon-btn" : "light-icon-btn"}`}
                >
                  <FiBell size={19} className={darkMode ? "text-emerald-400" : "text-emerald-700"} />
                  {unreadCount > 0 && (
                    <span
                      className="badge-pop absolute -top-1 -right-1 text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] flex items-center justify-center px-0.5"
                      style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <button onClick={onCartClick} className={`icon-btn ${darkMode ? "dark-icon-btn" : "light-icon-btn"}`}>
                  <RiShoppingCartLine size={19} className={darkMode ? "text-emerald-400" : "text-emerald-700"} />
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
          <div className={`notif-panel mx-4 mb-3 rounded-2xl overflow-hidden border backdrop-blur-2xl ${
            darkMode
              ? "bg-emerald-950/70 border-emerald-500/25"
              : "bg-white/85 border-emerald-500/20 shadow-lg"
          }`}>
            <div className={`flex justify-between items-center px-4 py-3 border-b ${darkMode ? "border-emerald-500/15" : "border-emerald-100"}`}>
              <span className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Notifications {unreadCount > 0 && <span className="text-emerald-500">({unreadCount})</span>}
              </span>
              <button onClick={() => startTransition(() => setShowNotifications(false))}>
                <FiX size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
              </button>
            </div>
            <div className="notif-scroll max-h-64 overflow-y-auto">
              {loadingNotifs ? (
                <p className="p-6 text-center text-sm text-gray-500">Loading...</p>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <AllCaughtUpIllustration darkMode={darkMode} size={48} />
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No notifications</p>
                </div>
              ) : notifications.map(notif => (
                <div key={notif.id} className={`notif-item flex items-start gap-3 px-4 py-3 border-b ${darkMode ? "border-white/5" : "border-emerald-50"}`}>
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

      <div className={`nav-pill nav-bar-mobile md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-2xl ${
        darkMode
          ? "bg-emerald-950/60 border-emerald-500/15"
          : "bg-white/75 border-emerald-100"
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
                      : "text-white bg-emerald-500"
                    : darkMode ? "text-emerald-200/50" : "text-gray-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span style={{
                    filter: isActive && darkMode ? "drop-shadow(0 0 6px rgba(16,185,129,0.7))" : "none",
                    transition: "filter 0.12s var(--ease-snap), transform 0.12s var(--ease-snap)",
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

export default function Navbar(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <NavbarContent {...props} />
    </QueryClientProvider>
  );
}