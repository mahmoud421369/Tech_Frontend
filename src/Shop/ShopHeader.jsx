import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  FiMoon, FiSun, FiUser, FiLogOut, FiMenu, FiX,
  FiBox, FiTool, FiSearch, FiBell, FiGrid, FiTag,
  FiMessageSquare, FiShoppingBag, FiCreditCard,
  FiPackage, FiCalendar, FiExternalLink,
  FiTrash2, FiCheck, FiInfo, FiAlertTriangle, FiAlertCircle,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import logo from "../images/logo-bg.png";
import { ToastContainer, toast } from "react-toastify";
import { RiBellLine, RiNotification2Line, RiCheckDoubleLine } from "react-icons/ri";


const MENU_GROUPS = [
  {
    label: "المركز الرئيسي",
    items: [
      { name: "لوحة التحكم", path: "/shop/dashboard", icon: <FiGrid size={18} /> },
      { name: "المحادثات", path: "/shop/chats", icon: <FiMessageSquare size={18} /> },
    ],
  },
  {
    label: "المبيعات والطلبات",
    items: [
      { name: "الطلبات", path: "/shop/orders", icon: <FiShoppingBag size={18} /> },
      { name: "العروض", path: "/shop/offers", icon: <FiTag size={18} /> },
      { name: "المعاملات", path: "/shop/transactions", icon: <FiCreditCard size={18} /> },
    ],
  },
  {
    label: "الخدمات والمخزون",
    items: [
      { name: "طلبات التصليح", path: "/shop/repair-requests", icon: <FiTool size={18} /> },
      { name: "المنتجات", path: "/shop/devices", icon: <FiPackage size={18} /> },
      { name: "المخزون", path: "/shop/inventory", icon: <FiBox size={18} /> },
    ],
  },
  {
    label: "الحساب",
    items: [
      { name: "الاشتراك", path: "/shop/subscriptions", icon: <FiCalendar size={18} /> },
    ],
  },
];


const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const d = jwtDecode(token);
    return d.exp < Date.now() / 1000;
  } catch { return true; }
};

const formatTimeAr = (ts) => {
  if (!ts) return "";
  try {
    const now = new Date();
    const date = new Date(ts);
    const diffMs = now - date;
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return "الآن";
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days === 1) return "أمس";
    if (days < 7) return `منذ ${days} أيام`;
    return date.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
  } catch { return ""; }
};

const getNotifMeta = (notif) => {
  const type = (notif.type || notif.category || "").toLowerCase();
  if (type.includes("order") || type.includes("طلب"))
    return { icon: <FiShoppingBag size={13} />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/25" };
  if (type.includes("repair") || type.includes("تصليح"))
    return { icon: <FiTool size={13} />, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10", border: "border-orange-200 dark:border-orange-500/25" };
  if (type.includes("payment") || type.includes("دفع") || type.includes("معاملة"))
    return { icon: <FiCreditCard size={13} />, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/25" };
  if (type.includes("warning") || type.includes("تحذير"))
    return { icon: <FiAlertTriangle size={13} />, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-500/10", border: "border-yellow-200 dark:border-yellow-500/25" };
  if (type.includes("error") || type.includes("خطأ"))
    return { icon: <FiAlertCircle size={13} />, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-200 dark:border-red-500/25" };
  if (type.includes("message") || type.includes("رسالة") || type.includes("chat"))
    return { icon: <FiMessageSquare size={13} />, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200 dark:border-purple-500/25" };
  return { icon: <FiInfo size={13} />, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/25" };
};


const NavLink = memo(({ item, active, onClick }) => (
  <Link
    to={item.path}
    onClick={onClick}
    className={`group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold
      transition-all duration-300 relative overflow-hidden
      ${active
        ? "bg-lime-500 text-white shadow-lg shadow-lime-500/20"
        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"}`}
    style={{ fontFamily: "'Cairo', sans-serif" }}
  >
    <span className={`shrink-0 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}>
      {item.icon}
    </span>
    <span className="relative z-10">{item.name}</span>
    {active && <div className="absolute left-3 w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />}
    {!active && <div className="absolute inset-y-0 right-0 w-0 group-hover:w-[3px] bg-lime-500 rounded-l-full transition-all duration-300" />}
  </Link>
));



const NotifItem = memo(({ notif, darkMode, onDelete, onMarkRead, idx }) => {
  const meta = useMemo(() => getNotifMeta(notif), [notif]);
  const [exit, setExit] = useState(false);

  const triggerDelete = (e) => {
    e.stopPropagation();
    setExit(true);
    setTimeout(() => onDelete(notif.id), 300);
  };

  const triggerRead = (e) => {
    e.stopPropagation();
    onMarkRead(notif.id);
  };

  return (
    <div

      className={`notif-item group relative flex items-start gap-3 px-4 py-3.5 border-b
        transition-all duration-300 cursor-default select-none
        ${exit ? "opacity-0 scale-95 -translate-x-3" : ""}
        ${!notif.read
          ? darkMode
            ? "bg-emerald-500/5 border-gray-800/40"
            : "bg-gradient-to-l from-emerald-50/80 to-transparent border-emerald-100/60"
          : darkMode
            ? "border-gray-800/40 hover:bg-white/[0.02]"
            : "border-gray-50 hover:bg-gray-50/70"
        }`}
      style={{ animationDelay: `${idx * 0.04}s` }}
    >

      <div className={`shrink-0 mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center border ${meta.bg} ${meta.border} ${meta.color}`}>
        {meta.icon}
      </div>


      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <p className={`text-[13px] font-bold leading-snug ${darkMode ? "text-gray-100" : "text-gray-900"}`}
            style={{ fontFamily: "'Cairo', sans-serif" }}>
            {notif.title}
          </p>
          {!notif.read && (
            <span className="shrink-0 mt-1 w-2 h-2 rounded-full bg-emerald-500"
              style={{ boxShadow: "0 0 5px rgba(16,185,129,0.7)" }} />
          )}
        </div>
        <p className={`text-xs mt-0.5 leading-relaxed line-clamp-2 ${darkMode ? "text-gray-500" : "text-gray-500"}`}
          style={{ fontFamily: "'Cairo', sans-serif" }}>
          {notif.message}
        </p>
        <p className={`text-[10px] mt-1.5 font-semibold ${meta.color}`}>
          {formatTimeAr(notif.timestamp || notif.createdAt)}
        </p>
      </div>


      <div className="shrink-0 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {!notif.read && (
          <button
            onClick={triggerRead}
            title="تعليم كمقروء"
            className={`p-1.5 rounded-lg transition
              ${darkMode ? "hover:bg-emerald-500/15 text-gray-600 hover:text-emerald-400" : "hover:bg-emerald-50 text-gray-300 hover:text-emerald-500"}`}
          >
            <FiCheck size={11} />
          </button>
        )}
        <button
          onClick={triggerDelete}
          title="حذف"
          className={`p-1.5 rounded-lg transition
            ${darkMode ? "hover:bg-red-500/15 text-gray-600 hover:text-red-400" : "hover:bg-red-50 text-gray-300 hover:text-red-500"}`}
        >
          <FiX size={11} />
        </button>
      </div>
    </div>
  );
});


const NotificationPanel = memo(({
  darkMode, notifications, loadingNotifs, unreadCount,
  onDelete, onMarkRead, onMarkAllRead, onClearAll, onClose,
}) => {
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() =>
    tab === "unread" ? notifications.filter(n => !n.read) : notifications,
    [notifications, tab]
  );

  return (
    <div
      dir="rtl"

      className={`notif-panel absolute top-full left-full   mt-3 w-[400px] rounded-2xl overflow-hidden border shadow-2xl z-50
        ${darkMode
          ? "bg-gray-900/97 backdrop-blur-2xl border-emerald-500/15 shadow-[0_24px_60px_rgba(0,0,0,0.75)]"
          : "bg-white border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.1)]"}`}
      onClick={e => e.stopPropagation()}
    >

      <div className={`px-5 py-4 border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>

        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${darkMode ? "bg-emerald-500/12" : "bg-emerald-50"}`}>
              <RiNotification2Line size={15} className="text-emerald-500" />
            </div>
            <div>
              <p className={`text-sm font-black ${darkMode ? "text-white" : "text-gray-900"}`}
                style={{ fontFamily: "'Cairo', sans-serif" }}>
                الإشعارات
              </p>
              <p className={`text-[11px] font-semibold ${unreadCount > 0 ? "text-emerald-500" : darkMode ? "text-gray-600" : "text-gray-400"}`}
                style={{ fontFamily: "'Cairo', sans-serif" }}>
                {unreadCount > 0 ? `${unreadCount} غير مقروء` : "كل شيء بخير ✓"}
              </p>
            </div>
          </div>


          <div className="flex items-center gap-0.5">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                title="تعليم الكل كمقروء"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition
                  ${darkMode ? "hover:bg-emerald-500/12 text-emerald-400" : "hover:bg-emerald-50 text-emerald-600"}`}
                style={{ fontFamily: "'Cairo', sans-serif" }}
              >
                <RiCheckDoubleLine size={13} />
                قراءة الكل
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                title="حذف جميع الإشعارات"
                className={`p-1.5 rounded-xl transition
                  ${darkMode ? "hover:bg-red-500/12 text-gray-600 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-500"}`}
              >
                <FiTrash2 size={13} />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition
                ${darkMode ? "hover:bg-white/8 text-gray-500 hover:text-white" : "hover:bg-gray-100 text-gray-400"}`}
            >
              <FiX size={15} />
            </button>
          </div>
        </div>


        <div className={`flex gap-1 p-1 rounded-xl ${darkMode ? "bg-black/30" : "bg-gray-100"}`}>
          {[
            { key: "all", label: `الكل`, count: notifications.length },
            { key: "unread", label: `غير مقروء`, count: unreadCount },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-black transition-all duration-200
                ${tab === t.key
                  ? darkMode
                    ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                    : "bg-white text-emerald-600 shadow-sm"
                  : darkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                }`}
              style={{ fontFamily: "'Cairo', sans-serif" }}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black leading-none
                ${tab === t.key
                  ? darkMode ? "bg-white/20" : "bg-emerald-50 text-emerald-600"
                  : darkMode ? "bg-white/8 text-gray-600" : "bg-gray-200 text-gray-500"
                }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>


      <div className="max-h-[360px] overflow-y-auto notif-scroll">
        {loadingNotifs ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className={`w-8 h-8 rounded-xl shrink-0 ${darkMode ? "bg-white/6" : "bg-gray-100"}`} />
                <div className="flex-1 space-y-2 pt-1">
                  <div className={`h-3 rounded-full w-3/4 ${darkMode ? "bg-white/6" : "bg-gray-100"}`} />
                  <div className={`h-2.5 rounded-full w-full ${darkMode ? "bg-white/4" : "bg-gray-50"}`} />
                  <div className={`h-2 rounded-full w-1/4 ${darkMode ? "bg-white/4" : "bg-gray-50"}`} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className={`p-5 rounded-2xl ${darkMode ? "bg-emerald-500/8" : "bg-emerald-50"}`}>
              <RiBellLine size={30} className="text-emerald-400" />
            </div>
            <p className={`text-sm font-bold ${darkMode ? "text-gray-500" : "text-gray-400"}`}
              style={{ fontFamily: "'Cairo', sans-serif" }}>
              {tab === "unread" ? "لا توجد إشعارات غير مقروءة" : "لا توجد إشعارات"}
            </p>
            <p className={`text-xs ${darkMode ? "text-gray-700" : "text-gray-300"}`}
              style={{ fontFamily: "'Cairo', sans-serif" }}>
              ستظهر التحديثات الجديدة هنا تلقائياً
            </p>
          </div>
        ) : (
          filtered.map((notif, idx) => (
            <NotifItem
              key={notif.id}
              notif={notif}
              darkMode={darkMode}
              onDelete={onDelete}
              onMarkRead={onMarkRead}
              idx={idx}
            />
          ))
        )}
      </div>



      {notifications.length > 0 && !loadingNotifs && (
        <div className={`px-5 py-2.5 border-t ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
          <p className={`text-center text-[10px] font-semibold ${darkMode ? "text-gray-700" : "text-gray-300"}`}
            style={{ fontFamily: "'Cairo', sans-serif" }}>
            إجمالي {notifications.length} إشعار • يتحدث كل 30 ثانية
          </p>
        </div>
      )}
    </div>
  );
});




const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

  html, body { overflow-x: hidden; max-width: 100vw; }

  @keyframes notifSlideIn {
    from { opacity: 0; transform: translateY(-10px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes badgePop {
    0%   { transform: scale(0.4); opacity: 0; }
    65%  { transform: scale(1.3); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes bellGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.45); }
    50%       { box-shadow: 0 0 0 7px rgba(16,185,129,0); }
  }

  .notif-panel { animation: notifSlideIn 0.24s cubic-bezier(.16,1,.3,1) both; }
  .notif-item  { animation: fadeUp 0.2s ease both; }
  .badge-pop   { animation: badgePop 0.38s cubic-bezier(.16,1,.3,1) both; }
  .bell-ring   { animation: bellGlow 0.9s ease-in-out 3; }

  .notif-scroll::-webkit-scrollbar       { width: 3px; }
  .notif-scroll::-webkit-scrollbar-track { background: transparent; }
  .notif-scroll::-webkit-scrollbar-thumb { background: rgba(16,185,129,0.22); border-radius: 4px; }
  .notif-scroll::-webkit-scrollbar-thumb:hover { background: rgba(16,185,129,0.45); }

  .custom-scrollbar-thin::-webkit-scrollbar       { width: 4px; }
  .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
  .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
  .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }

  .icon-btn {
    position: relative; display: flex; align-items: center;
    justify-content: center; width: 42px; height: 42px;
    border-radius: 12px; cursor: pointer;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    border: 1px solid transparent;
  }
  .icon-btn:hover  { transform: translateY(-1px); }
  .icon-btn:active { transform: scale(0.93); }
  .dark-icon-btn  { background: rgba(16,185,129,0.06); border-color: rgba(16,185,129,0.12); }
  .dark-icon-btn:hover {
    background: rgba(16,185,129,0.14); border-color: rgba(16,185,129,0.25);
    box-shadow: 0 0 16px rgba(16,185,129,0.18);
  }
  .light-icon-btn { background: #f3f4f6; border-color: #e5e7eb; }
  .light-icon-btn:hover { background: #e9f7f0; border-color: #a7f3d0; }
`;



const ShopHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [token] = useState(localStorage.getItem("authToken"));
  const [userProfile, setUserProfile] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [badgeKey, setBadgeKey] = useState(0);
  const [bellRinging, setBellRinging] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const notifRef = useRef(null);
  const prevUnreadRef = useRef(0);


  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
    };
    if (showNotifications) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifications]);


  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const toggleDark = useCallback(() => setDarkMode(d => !d), []);



  useEffect(() => {
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
    } else {
      localStorage.clear();
      navigate("/login");
    }
  }, [token, navigate]);



  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoadingNotifs(true);
    try {
      const res = await api.get("/api/notifications/shops");
      const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
      const newUnread = data.filter(n => !n.read).length;

      setNotifications(data);
      setUnreadCount(newUnread);

      if (newUnread > prevUnreadRef.current) {
        setBadgeKey(k => k + 1);
        setBellRinging(true);
        setTimeout(() => setBellRinging(false), 2800);
      }
      prevUnreadRef.current = newUnread;
    } catch {
      console.warn("Failed to load notifications");
    } finally {
      setLoadingNotifs(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(iv);
  }, [isAuthenticated, fetchNotifications]);


  const handleDelete = useCallback(async (id) => {
    try {
      await api.delete(`/api/notifications/shops/${id}`);
      setNotifications(prev => {
        const next = prev.filter(n => n.id !== id);
        const u = next.filter(n => !n.read).length;
        setUnreadCount(u);
        prevUnreadRef.current = u;
        return next;
      });
      toast.success("تم حذف الإشعار");
    } catch {
      toast.error("فشل حذف الإشعار");
    }
  }, []);



  const handleMarkRead = useCallback(async (id) => {

    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      const u = next.filter(n => !n.read).length;
      setUnreadCount(u);
      prevUnreadRef.current = u;
      return next;
    });
    try { await api.put(`/api/notifications/shops/${id}/read`); } catch { }
  }, []);



  const handleMarkAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    prevUnreadRef.current = 0;
    toast.success("تم تعليم جميع الإشعارات كمقروءة");
    try { await api.put("/api/notifications/shops/read-all"); } catch { }
  }, []);


  const handleClearAll = useCallback(async () => {
    const { isConfirmed } = await Swal.fire({
      title: "حذف جميع الإشعارات",
      text: "هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "حذف الكل",
      cancelButtonText: "إلغاء",
      background: darkMode ? "#111827" : "#fff",
      color: darkMode ? "#fff" : "#000",
    });
    if (!isConfirmed) return;
    try {
      await api.delete("/api/notifications/shops/clear-all");
      setNotifications([]);
      setUnreadCount(0);
      prevUnreadRef.current = 0;
      toast.success("تم مسح جميع الإشعارات");
    } catch {
      toast.error("فشل مسح الإشعارات");
    }
  }, [darkMode]);



  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    const { isConfirmed } = await Swal.fire({
      title: "تأكيد تسجيل الخروج",
      text: "هل أنت متأكد من إنهاء جلستك التجارية؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#84cc16",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "خروج",
      cancelButtonText: "إلغاء",
      background: darkMode ? "#111827" : "#fff",
      color: darkMode ? "#fff" : "#000",
    });
    if (!isConfirmed) return;
    try {
      if (token && refreshToken)
        await api.post("/api/auth/logout", { refreshToken }, { headers: { Authorization: `Bearer ${token}` } });
    } catch { }
    localStorage.clear();
    navigate("/login");
  }, [token, navigate, darkMode]);

  const isActive = (path) => location.pathname === path;
  const closeSidebar = () => setSidebarOpen(false);




  return (
    <div dir="rtl" className="transition-colors duration-300">
      <style>{STYLES}</style>

      <ToastContainer
        position="top-left"
        theme={darkMode ? "dark" : "light"}
        toastStyle={{ fontFamily: "'Cairo', sans-serif", fontSize: 13 }}
      />



      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}



      <aside
        className={`fixed inset-y-0 right-0 z-[70] w-64
          bg-white/90 dark:bg-gray-900/95 backdrop-blur-2xl
          border-l border-gray-100 dark:border-gray-800
          shadow-2xl flex flex-col
          transition-transform duration-500
          ${sidebarOpen ? "translate-x-0" : "translate-x-full"} lg:translate-x-0`}
      >


        <div className="relative h-32 flex flex-col items-center justify-center px-6 border-b border-gray-50 dark:border-gray-800/50">
          <Link to="/shop/dashboard" className="flex flex-col items-center group" onClick={closeSidebar}>
            <div className="w-32 h-24 rounded-3xl p-1 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
              <div className="w-full h-full rounded-2xl flex items-center justify-center overflow-hidden">
                <img src={logo} alt="شعار" className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700" />
              </div>
            </div>
          </Link>
          <button
            onClick={closeSidebar}
            className="lg:hidden absolute top-4 left-4 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-red-500 transition-all active:scale-90"
          >
            <FiX size={20} />
          </button>
        </div>



        <div className="px-4 pt-5 pb-1">
          <div className="relative group">
            <FiSearch
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors"
              size={15}
            />
            <input
              type="text"
              placeholder="بحث في النظام..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50
                border border-transparent focus:border-lime-200 dark:focus:border-lime-900/50
                text-xs font-bold text-gray-800 dark:text-white placeholder-gray-400
                focus:outline-none focus:ring-4 focus:ring-lime-500/5 transition-all"
              style={{ fontFamily: "'Cairo', sans-serif" }}
            />
          </div>
        </div>



        <div className="flex-1 overflow-y-auto py-4 px-4 custom-scrollbar-thin space-y-5">
          {MENU_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 flex items-center gap-2 mb-2">
                {group.label}
                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800/60" />
              </h3>
              {group.items
                .filter(item => !searchQuery || item.name.includes(searchQuery))
                .map(item => (
                  <NavLink key={item.name} item={item} active={isActive(item.path)} onClick={closeSidebar} />
                ))}
            </div>
          ))}
        </div>



        <div className="p-4 border-t border-gray-50 dark:border-gray-800/50 bg-gray-50/30 dark:bg-gray-800/20">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
            <div className="flex gap-2">
              <button
                onClick={toggleDark}
                title={darkMode ? "الوضع النهاري" : "الوضع الليلي"}
                className="flex-1 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-lime-500 transition-all active:scale-95"
              >
                {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
              </button>
              <button
                onClick={handleLogout}
                title="تسجيل الخروج"
                className="flex-1 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all active:scale-95"
              >
                <FiLogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>



      <header
        className="fixed top-0 left-0 right-0 h-[72px] z-[40]
          bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl
          border-b border-gray-100 dark:border-gray-800
          flex items-center justify-between px-5 lg:pr-72
          transition-all duration-500"
      >


        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-11 h-11 rounded-2xl bg-gray-50 dark:bg-gray-800
              flex items-center justify-center text-gray-600 dark:text-gray-300
              hover:bg-lime-500 hover:text-white transition-all active:scale-95"
          >
            <FiMenu size={20} />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight"
              style={{ fontFamily: "'Cairo', sans-serif" }}>
              لوحة تحكم المتجر
            </h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-lime-600 dark:text-lime-500">
                النظام نشط
              </p>
            </div>
          </div>
        </div>



        <div className="flex items-center gap-3">



          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              className={`icon-btn ${darkMode ? "dark-icon-btn" : "light-icon-btn"} ${bellRinging ? "bell-ring" : ""}`}
              aria-label="الإشعارات"
              aria-expanded={showNotifications}
            >
              <FiBell
                size={19}
                className={`transition-colors ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
              />
              {unreadCount > 0 && (
                <span
                  key={badgeKey}
                  className="badge-pop absolute -top-1.5 -left-1.5 text-white text-[9px] font-black rounded-full
                    min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none"
                  style={{
                    background: "linear-gradient(135deg,#ef4444,#dc2626)",
                    boxShadow: "0 0 8px rgba(239,68,68,0.5)",
                    fontFamily: "'Cairo', sans-serif",
                  }}
                >
                  {unreadCount > 9 ? "+9" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <NotificationPanel
                darkMode={darkMode}
                notifications={notifications}
                loadingNotifs={loadingNotifs}
                unreadCount={unreadCount}
                onDelete={handleDelete}
                onMarkRead={handleMarkRead}
                onMarkAllRead={handleMarkAllRead}
                onClearAll={handleClearAll}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>

          <div className="h-9 w-px bg-gray-100 dark:bg-gray-800" />



          <Link
            to="/shop/profile"
            className="flex items-center gap-3 pl-1 pr-3 py-1.5 rounded-2xl
              hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group
              border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
          >
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest"
                style={{ fontFamily: "'Cairo', sans-serif" }}>
                {userProfile?.name?.split(" ")[0] || "المالك"}
              </p>
              <div className="flex items-center gap-1 justify-end">
                <p className="text-[9px] font-bold text-gray-400"
                  style={{ fontFamily: "'Cairo', sans-serif" }}>
                  الملف التجاري
                </p>
                <FiExternalLink size={8} className="text-gray-300 group-hover:text-lime-500 transition-colors" />
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center
              text-gray-400 group-hover:text-lime-500 shadow-sm overflow-hidden
              border-2 border-white dark:border-gray-800 group-hover:border-lime-500
              transition-all duration-300">
              {userProfile?.imageUrl
                ? <img src={userProfile.imageUrl} className="w-full h-full object-cover" alt="الملف الشخصي" />
                : <FiUser size={18} />
              }
            </div>
          </Link>
        </div>
      </header>
    </div>
  );
};

export default ShopHeader;