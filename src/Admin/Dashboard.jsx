import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import {
  FiBell, FiCheckCircle, FiTruck, FiActivity, FiUsers,
  FiBox, FiTool, FiClipboard, FiRefreshCw, FiTrash2, FiTrendingUp,
  FiChevronRight, FiClock, FiArrowRight, FiInfo, FiZap, FiPackage, FiShoppingBag, FiLayers, FiCreditCard
} from "react-icons/fi";
import {
  Chart, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const REFRESH_INTERVAL = 30_000;

const isTokenExpired = (token) => {
  if (!token) return true;
  try { const d = jwtDecode(token); return !d.exp || d.exp < Date.now() / 1000; }
  catch { return true; }
};

const formatTime = (date) => {
  if (!date) return "Just now";
  const d = new Date(date), now = new Date(), diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return d.toLocaleDateString();
};

const showToast = (text, icon) => {
  Swal.fire({ text, icon, toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
};

const COLOR_HEX = { emerald: '#10b981', blue: '#3b82f6', orange: '#f97316', teal: '#14b8a6', purple: '#a855f7', rose: '#f43f5e' };

const CardIllustration = memo(({ kind, color }) => {
  const c = color || '#10b981';
  const paths = {
    users: (
      <>
        <circle cx="15" cy="13" r="6" fill="none" stroke={c} strokeWidth="2.2" />
        <path d="M5 33c0-7 4.5-11 10-11s10 4 10 11" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="29" cy="15" r="4.2" fill="none" stroke={c} strokeWidth="2" opacity="0.55" />
        <path d="M27 33c0-4.3 2-7.2 5.5-8.2" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      </>
    ),
    shop: (
      <>
        <path d="M6 14 L20 8 L34 14 L34 18 L6 18 Z" fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round" />
        <rect x="8" y="18" width="24" height="15" rx="2" fill="none" stroke={c} strokeWidth="2.2" />
        <rect x="16" y="23" width="8" height="10" fill="none" stroke={c} strokeWidth="2" />
      </>
    ),
    wrench: (
      <>
        <rect x="9" y="18" width="22" height="6" rx="3" fill="none" stroke={c} strokeWidth="2.2" transform="rotate(-30 20 21)" />
        <circle cx="10" cy="10" r="6" fill="none" stroke={c} strokeWidth="2.2" strokeDasharray="18 100" strokeLinecap="round" transform="rotate(140 10 10)" />
      </>
    ),
    package: (
      <>
        <path d="M8,14 L20,8 L32,14 L32,28 L20,34 L8,28 Z" fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M8,14 L20,20 L32,14" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" />
        <line x1="20" y1="20" x2="20" y2="34" stroke={c} strokeWidth="2" />
      </>
    ),
    card: (
      <>
        <rect x="5" y="11" width="30" height="19" rx="3" fill="none" stroke={c} strokeWidth="2.2" />
        <line x1="5" y1="17" x2="35" y2="17" stroke={c} strokeWidth="2.2" />
        <line x1="9" y1="24" x2="18" y2="24" stroke={c} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    truck: (
      <>
        <rect x="4" y="14" width="18" height="12" rx="2" fill="none" stroke={c} strokeWidth="2.2" />
        <path d="M22 18 H30 L34 23 V26 H22 Z" fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="12" cy="29" r="3" fill={c} />
        <circle cx="29" cy="29" r="3" fill={c} />
      </>
    ),
    clipboard: (
      <>
        <rect x="9" y="8" width="21" height="26" rx="3" fill="none" stroke={c} strokeWidth="2.2" />
        <rect x="14" y="5" width="11" height="5" rx="1.5" fill="none" stroke={c} strokeWidth="2" />
        <path d="M13 18 H26 M13 24 H26 M13 30 H20" stroke={c} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  };
  return <svg viewBox="0 0 40 40" className="w-7 h-7">{paths[kind]}</svg>;
});




const StatCard = memo(({ kind, label, value, color }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-400/5 transition-all duration-500 group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
    <div className="relative flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all duration-500`}>
        <CardIllustration kind={kind} color={COLOR_HEX[color]} />
      </div>
    </div>
  </div>
));

const FeatureCard = memo(({ title, kind, desc, path, navigate, color }) => (
  <div onClick={() => navigate(path)}
    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:shadow-emerald-400/10 transition-all duration-500 cursor-pointer group flex flex-col h-full">
    <div className="flex items-center justify-between mb-6">
      <div className={`w-14 h-14 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}>
        <CardIllustration kind={kind} color={COLOR_HEX[color]} />
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-300 group-hover:bg-emerald-400 group-hover:text-white transition-all duration-500">
        <FiArrowRight size={14} />
      </div>
    </div>
    <div className="space-y-2 mt-auto">
      <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">{desc}</p>
    </div>
  </div>
));

const NotifItem = memo(({ notif, onDelete }) => (
  <div className={`flex items-start gap-4 p-5 border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-emerald-50/10 dark:hover:bg-emerald-900/5 transition-all group
    ${!notif.read ? "bg-emerald-50/20 dark:bg-emerald-900/10" : ""}`}>
    <div className="flex-shrink-0 mt-1">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notif.read ? "bg-gray-100 dark:bg-gray-700 text-gray-400" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500"}`}>
        {notif.read ? <FiCheckCircle size={18} /> : <FiZap size={18} />}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-800 dark:text-gray-100 font-bold leading-snug tracking-tight">{notif.message || notif.title || "New Platform Activity"}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <FiClock size={10} className="text-gray-400" />
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{formatTime(notif.createdAt || notif.timestamp)}</p>
      </div>
    </div>
    <button
      onClick={e => { e.stopPropagation(); onDelete(notif.id); }}
      className="opacity-0 group-hover:opacity-100 transition-all p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 flex-shrink-0"
      aria-label="Delete notification">
      <FiTrash2 size={16} />
    </button>
  </div>
));




const Dashboard = ({ darkMode }) => {
  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem('authToken'));

  const [stats, setStats] = useState(null);
  const [notifications, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  useEffect(() => {
    document.title = "Platform Admin Dashboard";
  }, []);

  useEffect(() => {
    const token = tokenRef.current;
    if (!token || isTokenExpired(token)) { localStorage.clear(); navigate("/login"); }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    setLoading(true);
    try {
      const statsRes = await api.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      setStats(statsRes.data);
    } catch {
      showToast("Sync issue detected", "warning");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  const deleteNotification = useCallback(async (id) => {
    const token = tokenRef.current;
    try {
      await api.delete(`/api/admin/notification/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifs(prev => prev.filter(n => n.id !== id));
      showToast("Notification cleared", "success");
    } catch {
      showToast("Could not clear notification", "error");
    }
  }, []);

  const statCardsData = useMemo(() => [
    { kind: 'users',   label: 'Total Users',     value: stats?.users || 0,   color: 'emerald' },
    { kind: 'shop',    label: 'Total Shops',     value: stats?.shops || 0,   color: 'blue' },
    { kind: 'wrench',  label: 'Repair Requests', value: stats?.repairs || 0, color: 'orange' },
    { kind: 'package', label: 'Total Orders',    value: stats?.orders || 0,  color: 'teal' },
  ], [stats]);

  const featureCards = useMemo(() => [
    { title: "User Management", kind: 'users',     desc: "Control accounts and permissions",       path: "/admin/users",           color: "emerald" },
    { title: "Merchant Stores", kind: 'shop',      desc: "Oversee shop registrations and status",  path: "/admin/shops",           color: "blue" },
    { title: "Subscriptions",   kind: 'card',      desc: "Manage shop plans and billing",          path: "/admin/subscriptions",   color: "purple" },
    { title: "Global Products", kind: 'package',   desc: "Inventory and catalog oversight",        path: "/admin/products",        color: "teal" },
    { title: "Logistics Hub",   kind: 'truck',     desc: "Manage delivery and assigner network",   path: "/admin/deliveries",      color: "orange" },
    { title: "Platform Logs",   kind: 'clipboard', desc: "Historical audit and activity feed",     path: "/admin/assignment-logs", color: "rose" },
  ], []);

  const pieData = useMemo(() => ({
    labels: ['Users', 'Shops', 'Repairs', 'Orders'],
    datasets: [{
      data: [stats?.users || 0, stats?.shops || 0, stats?.repairs || 0, stats?.orders || 0],
      backgroundColor: ['#34d399', '#3b82f6', '#f59e0b', '#ef4444'],
      borderColor: darkMode ? '#1f2937' : '#fff',
      borderWidth: 3,
      hoverOffset: 16,
    }],
  }), [stats, darkMode]);

  const pieOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { font: { size: 12 }, padding: 14, color: darkMode ? '#d1d5db' : '#374151' } },
      tooltip: { backgroundColor: darkMode ? '#374151' : '#1f2937', titleColor: '#fff', bodyColor: '#e5e7eb' },
    },
  }), [darkMode]);

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-250 dark:bg-gray-700 rounded-full" />
              <div className="h-10 w-48 bg-gray-300 dark:bg-gray-700 rounded-2xl" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded-full" />
            </div>
            <div className="h-14 w-48 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm flex items-center justify-between h-28">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded-xl" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-750" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm h-40 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-gray-150 dark:bg-gray-700" />
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-750" />
                    </div>
                    <div className="space-y-2 mt-auto">
                      <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded-md" />
                      <div className="h-3 w-48 bg-gray-250 dark:bg-gray-700 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl p-8 h-[24rem] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-28 bg-gray-350 dark:bg-gray-600 rounded-md" />
                  <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-750" />
                </div>
                <div className="w-48 h-48 rounded-full bg-gray-150 dark:bg-gray-700 mx-auto flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Console Overview</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Admin Control</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Holistic management of the TechBazaar ecosystem</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={fetchData} disabled={loading} title="Refresh Dashboard"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:border-emerald-400/30 transition-all disabled:opacity-40">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center text-gray-400">
                  <FiBell size={18} />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 text-white text-[10px] font-black flex items-center justify-center rounded-lg shadow-lg border-2 border-white dark:border-gray-800 animate-bounce">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Feed</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{unreadCount} Pending Alerts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCardsData.map(card => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {featureCards.map(card => (
                 <FeatureCard key={card.title} {...card} navigate={navigate} />
               ))}
             </div>
          </div>

          <div className="space-y-8">
             <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Platform Mix</h2>
                  <FiTrendingUp size={20} className="text-emerald-400" />
                </div>
                <div className="h-64">
                   <Pie data={pieData} options={pieOptions} />
                </div>
             </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #374151; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #34d399; }
      `}} />
    </div>
  );
};

export default Dashboard;