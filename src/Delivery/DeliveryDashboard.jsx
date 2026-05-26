import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { 
  FiPackage, FiTool, FiClock, FiCheckCircle, 
  FiBell, FiX, FiHome, FiTrendingUp, FiActivity, FiArrowRight,
  FiZap, FiTruck, FiMapPin, FiShield
} from "react-icons/fi";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { getAvailableOrders, getAvailableRepairs, getMyDeliveries, getMyRepairs } from "../api/deliveryApi";
import api from "../api";
import { DashboardSkeleton } from "../components";





const StatCard = memo(({ label, value, icon: Icon, color, to, description }) => (
  <Link
    to={to}
    aria-label={`View details for ${label}`}
    className="relative group bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none transition-all duration-500 overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
    
    <div className="relative z-10 flex flex-col h-full">
      <div className={`w-14 h-14 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
        <Icon size={28} />
      </div>
      
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-400">{description}</span>
        <div className={`w-8 h-8 rounded-full bg-${color}-50 dark:bg-${color}-900/30 flex items-center justify-center text-${color}-600 dark:text-${color}-400 opacity-0 group-hover:opacity-100 transition-all duration-500`}>
          <FiArrowRight size={14} />
        </div>
      </div>
    </div>
  </Link>
));

const ActivityRow = memo(({ act }) => (
  <div className="group flex items-center gap-4 p-4 rounded-[1.5rem] hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
      act.type === "order"
        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
        : "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
    }`}>
      <act.icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-sm font-black text-gray-900 dark:text-white truncate">{act.title}</p>
        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${
          act.type === 'order' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {act.type}
        </span>
      </div>
      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate mt-0.5 uppercase tracking-widest">{act.desc}</p>
    </div>
    <div className="text-right">
      <p className="text-[10px] font-black text-gray-900 dark:text-white">
        {new Date(act.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Logged</p>
    </div>
  </div>
));

const NotifCard = memo(({ notif, onDismiss }) => (
  <div className="relative group p-5 bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-lime-200 dark:hover:border-lime-900/50 transition-all duration-300">
    <button
      onClick={() => onDismiss(notif.id)}
      aria-label="Dismiss Alert"
      className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
    >
      <FiX size={14} />
    </button>
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-2xl bg-lime-50 dark:bg-lime-900/20 flex items-center justify-center text-lime-600 flex-shrink-0">
        <FiBell size={18} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-black text-gray-900 dark:text-white mb-1 uppercase tracking-tight">{notif.title}</p>
        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{notif.message}</p>
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-lime-500" />
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">
            {new Date(notif.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  </div>
));





const DeliveryDashboard = () => {
  const [stats, setStats]               = useState({ availableOrders: 0, myOrders: 0, availableRepairs: 0, myRepairs: 0 });
  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [token]                         = useState(localStorage.getItem("authToken"));

  const showToast = useCallback((text, icon) => {
    Swal.fire({ text, icon, toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
  }, []);

  useEffect(() => {
    document.title = 'Delivery Dashboard | Tech Restore';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = 'Live operational console for Tech Restore delivery personnel. Manage active deliveries, repairs and track tasks.';
  }, []);
  

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/api/notifications/delivery");
      setNotifications(res.data.content || res.data || []);
    } catch {}
  }, []);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [availOrders, availRepairs, myOrdersRes, myRepairsRes] = await Promise.all([
        getAvailableOrders().catch(() => []),
        getAvailableRepairs().catch(() => []),
        getMyDeliveries().catch(() => []),
        getMyRepairs().catch(() => []),
      ]);
      
      const ao = availOrders?.content || availOrders || [];
      const ar = availRepairs?.content || availRepairs || [];
      const mo = myOrdersRes?.content || myOrdersRes || [];
      const mr = myRepairsRes?.content || myRepairsRes || [];

      setStats({ availableOrders: ao.length, availableRepairs: ar.length, myOrders: mo.length, myRepairs: mr.length });

      const activity = [
        ...mo.slice(0, 5).map((o) => ({
          id: o.id, type: "order",
          title: `Delivery #${o.id.slice(-8)}`,
          desc: `${(o.status || "").replace(/_/g, " ")} • EGP ${o.totalPrice || 0}`,
          time: new Date(o.updatedAt || o.createdAt).getTime(),
          icon: FiPackage,
        })),
        ...mr.slice(0, 5).map((r) => ({
          id: r.id, type: "repair",
          title: `Repair Request #${r.id.slice(-8)}`,
          desc: `${(r.status || "").replace(/_/g, " ")} • EGP ${r.price || 0}`,
          time: new Date(r.updatedAt || r.createdAt).getTime(),
          icon: FiTool,
        })),
      ].sort((a, b) => b.time - a.time).slice(0, 10);

      setRecentActivity(activity);
      if (!silent) fetchNotifications();
    } catch {
      if (!silent) showToast("Sync issue detected", "warning");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [fetchNotifications]);

  const dismissNotification = useCallback(async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.delete(`/api/notifications/delivery/${id}`);
      showToast("Notification cleared", "success");
    } catch { showToast("Could not clear notification", "error"); }
  }, [showToast]);

  useEffect(() => { loadData(false); }, [loadData]);
  
  useEffect(() => {
    const a = setInterval(() => loadData(true), 30000);
    const b = setInterval(fetchNotifications, 60000);
    return () => { clearInterval(a); clearInterval(b); };
  }, [loadData, fetchNotifications]);

  const statCardsData = useMemo(() => [
    { label: "Available Orders",  value: stats.availableOrders,  icon: FiTruck,    color: "lime",   to: "/delivery/available-orders",         description: "Ready for Pickup" },
    { label: "Active Deliveries", value: stats.myOrders,         icon: FiActivity, color: "blue",   to: "/delivery/my-deliveries",            description: "In Progress" },
    { label: "Pending Repairs",   value: stats.availableRepairs, icon: FiZap,      color: "amber",  to: "/delivery/available-repair-requests", description: "Awaiting Service" },
    { label: "Active Repairs",    value: stats.myRepairs,        icon: FiShield,   color: "indigo", to: "/delivery/my-repairs",               description: "Being Handled" },
  ], [stats]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">

      
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">Personnel Hub</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Delivery <span className="text-lime-500">Console</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Live operational overview for active agents</p>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="px-5 py-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">System Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
                <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">Connected</span>
              </div>
            </div>
            <button 
              onClick={() => loadData(false)}
              aria-label="Refresh Dashboard State"
              className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-lime-500 hover:rotate-180 transition-all duration-700"
            >
              <FiActivity size={18} />
            </button>
          </div>
        </div>

       
       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-white dark:bg-gray-800 rounded-[2.5rem] animate-pulse border border-gray-100 dark:border-gray-700" />
            ))
          ) : (
            statCardsData.map((c) => <StatCard key={c.label} {...c} />)
          )}
        </div>

        
        
        
        <div className="grid lg:grid-cols-3 gap-8">
          
         
         
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-lime-50 dark:bg-lime-900/20 flex items-center justify-center text-lime-600">
                  <FiActivity size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Recent Activity</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Real-time task log</p>
                </div>
              </div>
              <Link to="/delivery/my-deliveries" className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 text-[10px] font-black text-gray-500 hover:text-lime-500 transition-all uppercase tracking-widest">
                Full History
              </Link>
            </div>

            <div className="space-y-2 min-h-[300px]">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-50 dark:bg-gray-900/50 rounded-[1.5rem] animate-pulse" />
                ))
              ) : recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-300">
                    <FiMapPin size={32} />
                  </div>
                  <p className="text-sm font-bold text-gray-400">No recent operational data found</p>
                </div>
              ) : (
                recentActivity.map((act) => <ActivityRow key={`${act.type}-${act.id}`} act={act} />)
              )}
            </div>
          </div>

          
          

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-lime-50 dark:bg-lime-900/20 flex items-center justify-center text-lime-600">
                  <FiBell size={20} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">System Feed</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Operational Alerts</p>
                </div>
                {notifications.length > 0 && (
                  <span className="w-6 h-6 rounded-lg bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-red-500/20">
                    {notifications.length}
                  </span>
                )}
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar-thin">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <FiShield size={40} className="text-gray-100 dark:text-gray-700" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Your console is clear<br/>No active alerts</p>
                  </div>
                ) : (
                  notifications.map((n) => <NotifCard key={n.id} notif={n} onDismiss={dismissNotification} />)
                )}
              </div>
            </div>

            
            
            
            <div className="bg-gradient-to-br from-lime-500 to-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-lime-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full translate-x-8 -translate-y-8" />
              <FiZap className="relative z-10 mb-4" size={32} />
              <h3 className="relative z-10 text-xl font-black tracking-tight mb-2">Priority Dispatch</h3>
              <p className="relative z-10 text-xs font-bold text-lime-50/80 leading-relaxed">Higher efficiency leads to better performance ratings. Stay active!</p>
              <Link to="/delivery/available-orders" className="relative z-10 mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white text-lime-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-lime-50 transition-colors shadow-lg shadow-black/5">
                Check Queue <FiArrowRight />
              </Link>
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
};

export default memo(DeliveryDashboard);