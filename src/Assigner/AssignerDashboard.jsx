import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import {
  FiBell, FiCheckCircle, FiAlertCircle, FiActivity, FiUsers,
  FiBox, FiTool, FiClipboard, FiRefreshCw, FiTrash2, FiTrendingUp,
  FiChevronRight, FiClock, FiArrowRight, FiInfo, FiZap, FiPackage
} from "react-icons/fi";


const isTokenExpired = (token) => {
  if (!token) return true;
  try { const d = jwtDecode(token); return !d.exp || d.exp < Date.now() / 1000; }
  catch { return true; }
};

const formatTime = (date) => {
  if (!date) return "Just now";
  const d = new Date(date), now = new Date(), diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
};




const StatCard = memo(({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md p-6 shadow-sm hover:shadow-xl hover:shadow-lime-500/5 transition-all duration-500 group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
    <div className="relative flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-500 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
));



const FeatureCard = memo(({ title, icon, desc, path, navigate, color }) => (
  <div onClick={() => navigate(path)}
    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md p-6 shadow-sm hover:shadow-2xl hover:shadow-lime-500/10 transition-all duration-500 cursor-pointer group flex flex-col h-full">
    <div className="flex items-center justify-between mb-6">
      <div className={`w-14 h-14 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}>
        {icon}
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-300 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
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
  <div className={`flex items-start gap-4 p-5 border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-all group
    ${!notif.read ? "bg-lime-50/20 dark:bg-lime-900/10" : ""}`}>
    <div className="flex-shrink-0 mt-1">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notif.read ? "bg-gray-100 dark:bg-gray-700 text-gray-400" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"}`}>
        {notif.read ? <FiCheckCircle size={18} /> : <FiZap size={18} />}
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-800 dark:text-gray-100 font-bold leading-snug tracking-tight">{notif.message || "New Logistics Activity"}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <FiClock size={10} className="text-gray-400" />
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{formatTime(notif.timestamp)}</p>
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




const AssignerDashboard = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const [notifications, setNotifs] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [stats, setStats] = useState({ orders: 0, repairs: 0, agents: 0 });

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  useEffect(() => {
    document.title = "Assigner - Premium Dashboard";
  }, []);

  useEffect(() => {
    if (!token || isTokenExpired(token)) { localStorage.clear(); navigate("/login"); }
  }, [token, navigate]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoadingNotifs(true);
    try {
      const [notifsRes, ordersRes, repairsRes, agentsRes] = await Promise.allSettled([
        api.get("/api/notifications/assigner", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/api/assigner/orders-for-assignment", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/api/assigner/repairs-for-assignment", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/api/assigner/delivery-persons", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (notifsRes.status === 'fulfilled') setNotifs(notifsRes.value.data?.content || notifsRes.value.data || []);

      setStats({
        orders: ordersRes.status === 'fulfilled' ? (ordersRes.value.data?.content || ordersRes.value.data || []).length : 0,
        repairs: repairsRes.status === 'fulfilled' ? (repairsRes.value.data?.content || repairsRes.value.data || []).length : 0,
        agents: agentsRes.status === 'fulfilled' ? (agentsRes.value.data?.content || agentsRes.value.data || []).length : 0,
      });

    } catch {
      showToast("Sync issue detected", "warning");
    } finally { setLoadingNotifs(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (text, icon) => {
    Swal.fire({ text, icon, toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
  };

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/api/notifications/assigner/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifs(prev => prev.filter(n => n.id !== id));
      showToast("Notification cleared", "success");
    } catch {
      showToast("Could not clear notification", "error");
    }
  }, [token]);

  const featureCards = [
    { title: "Delivery Network", icon: <FiUsers size={24} />, desc: "Monitor agent status and availability", path: "/assigner/delivery", color: "lime" },
    { title: "Order Queue", icon: <FiPackage size={24} />, desc: "Dispatch and track shipping orders", path: "/assigner/orders", color: "blue" },
    { title: "Repair Queue", icon: <FiTool size={24} />, desc: "Manage device pickup and delivery", path: "/assigner/repair-requests", color: "orange" },
    { title: "Assignment Logs", icon: <FiClipboard size={24} />, desc: "Historical record of all logistics", path: "/assigner/assignment-logs", color: "emerald" },
    { title: "Reassign Requests ", icon: <FiRefreshCw size={24} />, desc: "Reassign tasks to different agents", path: "/assigner/reassign-orders", color: "purple" },
    { title: "Account Hub", icon: <FiActivity size={24} />, desc: "Personal performance and settings", path: "/assigner/profile", color: "rose" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">



        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Overview Central</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Assigner Console</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Coordinate logistics and optimize delivery throughput</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center text-gray-400">
                  <FiBell size={18} />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center rounded-lg shadow-lg border-2 border-white dark:border-gray-800 animate-bounce">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Feed</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{unreadCount} New Alerts</p>
              </div>
            </div>
          </div>
        </div>



        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard icon={FiPackage} label="Pending Orders" value={stats.orders} color="lime" />
          <StatCard icon={FiTool} label="Active Repairs" value={stats.repairs} color="blue" />
          <StatCard icon={FiUsers} label="Total Agents" value={stats.agents} color="emerald" />
        </div>



        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map(card => (
            <FeatureCard key={card.title} {...card} navigate={navigate} />
          ))}
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden group">
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-3xl bg-emerald-500 flex items-center justify-center text-white">
                <FiZap size={20} />
              </div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Recent Activity</h2>
            </div>
            <button onClick={fetchData} className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:text-lime-500 transition-all active:scale-95 shadow-sm">
              <FiRefreshCw size={16} />
            </button>
          </div>

          <div className="max-h-[450px] overflow-y-auto custom-scrollbar-thin">
            {loadingNotifs ? (
              <div className="py-24 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Syncing logistics feed...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-700">
                  <FiBell size={32} className="text-gray-200 dark:text-gray-700" />
                </div>
                <p className="text-gray-400 font-bold">Logistics Feed Clear</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400/50 mt-1">System is running at peak efficiency</p>
              </div>
            ) : notifications.map(notif => (
              <NotifItem key={notif.id} notif={notif} onDelete={deleteNotification} />
            ))}
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #374151; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
};

export default AssignerDashboard;