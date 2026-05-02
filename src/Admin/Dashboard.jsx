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
import DOMPurify from 'dompurify';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const REFRESH_INTERVAL = 30_000;
const sanitize = (str) => DOMPurify.sanitize(String(str ?? ''));

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




const StatCard = memo(({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-lime-500/5 transition-all duration-500 group relative overflow-hidden">
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
    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:shadow-lime-500/10 transition-all duration-500 cursor-pointer group flex flex-col h-full">
    <div className="flex items-center justify-between mb-6">
      <div className={`w-14 h-14 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}>
        {icon}
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-300 group-hover:bg-lime-500 group-hover:text-white transition-all duration-500">
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
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notif.read ? "bg-gray-100 dark:bg-gray-700 text-gray-400" : "bg-lime-100 dark:bg-lime-900/30 text-lime-600"}`}>
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
  const token = localStorage.getItem('authToken');

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  useEffect(() => { 
    document.title = "Platform Admin Dashboard"; 
  }, []);

  useEffect(() => {
    if (!token || isTokenExpired(token)) { localStorage.clear(); navigate("/login"); }
  }, [token, navigate]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.allSettled([
        api.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/admin/users?page=0&size=100', { headers: { Authorization: `Bearer ${token}` } }),
        
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (usersRes.status === 'fulfilled') setUsers(Array.isArray(usersRes.value.data) ? usersRes.value.data : usersRes.value.data?.content || []);
     
    } catch {
      showToast("Sync issue detected", "warning");
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  const showToast = (text, icon) => {
    Swal.fire({ text, icon, toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
  };

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/api/admin/notification/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifs(prev => prev.filter(n => n.id !== id));
      showToast("Notification cleared", "success");
    } catch {
      showToast("Could not clear notification", "error");
    }
  }, [token]);

  const statCardsData = [
    { icon: FiUsers, label: 'Total Users', value: stats?.users || 0, color: 'lime' },
    { icon: FiShoppingBag, label: 'Total Shops', value: stats?.shops || 0, color: 'blue' },
    { icon: FiTool, label: 'Repair Requests', value: stats?.repairs || 0, color: 'orange' },
    { icon: FiPackage, label: 'Total Orders', value: stats?.orders || 0, color: 'emerald' },
  ];

  const featureCards = [
    { title: "User Management", icon: <FiUsers size={24} />, desc: "Control accounts and permissions", path: "/admin/users", color: "lime" },
    { title: "Merchant Stores", icon: <FiShoppingBag size={24} />, desc: "Oversee shop registrations and status", path: "/admin/shops", color: "blue" },
    { title: "Subscriptions", icon: <FiCreditCard size={24} />, desc: "Manage shop plans and billing", path: "/admin/subscriptions", color: "purple" },
    { title: "Global Products", icon: <FiPackage size={24} />, desc: "Inventory and catalog oversight", path: "/admin/products", color: "emerald" },
    { title: "Logistics Hub", icon: <FiTruck size={24} />, desc: "Manage delivery and assigner network", path: "/admin/deliveries", color: "orange" },
    { title: "Platform Logs", icon: <FiClipboard size={24} />, desc: "Historical audit and activity feed", path: "/admin/assignment-logs", color: "rose" },
  ];

  const pieData = useMemo(() => ({
    labels: ['Users', 'Shops', 'Repairs', 'Orders'],
    datasets: [{
      data: [stats?.users || 0, stats?.shops || 0, stats?.repairs || 0, stats?.orders || 0],
      backgroundColor: ['#84cc16', '#3b82f6', '#f59e0b', '#ef4444'],
      borderColor: darkMode ? '#1f2937' : '#fff',
      borderWidth: 3,
      hoverOffset: 16,
    }],
  }), [stats, darkMode]);

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { font: { size: 12 }, padding: 14, color: darkMode ? '#d1d5db' : '#374151' } },
      tooltip: { backgroundColor: darkMode ? '#374151' : '#1f2937', titleColor: '#fff', bodyColor: '#e5e7eb' },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

       
       
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">Console Overview</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Admin Control</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Holistic management of the TechBazaar ecosystem</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center text-gray-400">
                  <FiBell size={18} />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-lime-500 text-white text-[10px] font-black flex items-center justify-center rounded-lg shadow-lg border-2 border-white dark:border-gray-800 animate-bounce">
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

            
            
             <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Recent Users</h2>
                  <FiUsers size={20} className="text-lime-500" />
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full">
                     <thead className="bg-gray-50 dark:bg-gray-900/50">
                       <tr>
                         {['User', 'Role', 'Status'].map(h => (
                           <th key={h} className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                         ))}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50 text-center dark:divide-gray-800">
                       {users.slice(0, 5).map(u => (
                         <tr key={u.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors">
                           <td className="px-6 py-4">
                             <div>
                               <p className="text-sm font-bold text-gray-900 dark:text-white">{sanitize(`${u.firstName} ${u.lastName}`)}</p>
                               <p className="text-[10px] text-gray-400 font-medium">{u.email}</p>
                             </div>
                           </td>
                           <td className="px-6 py-4">
                             <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">
                               {u.role}
                             </span>
                           </td>
                           <td className="px-6 py-4">
                             <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.activate ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "bg-red-50 dark:bg-red-900/20 text-red-600"}`}>
                               <span className={`w-1.5 h-1.5 rounded-full ${u.activate ? "bg-emerald-500" : "bg-red-500"}`} />
                               {u.activate ? 'Active' : 'Inactive'}
                             </span>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
             </div>
          </div>

          
          
          <div className="space-y-8">
            
            
             <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Platform Mix</h2>
                  <FiTrendingUp size={20} className="text-lime-500" />
                </div>
                <div className="h-64">
                   <Pie data={pieData} options={pieOptions} />
                </div>
             </div>

             
             
             <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Recent Feed</h2>
                  <button onClick={fetchData} className="text-gray-400 hover:text-lime-500 transition-colors">
                    <FiRefreshCw size={16} />
                  </button>
                </div>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar-thin">
                  {loading ? (
                    <div className="py-20 text-center animate-pulse">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Syncing Feed...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-20 text-center">
                      <p className="text-xs font-bold text-gray-400">No recent activity</p>
                    </div>
                  ) : notifications.map(n => (
                    <NotifItem key={n.id} notif={n} onDelete={deleteNotification} />
                  ))}
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
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
};

export default Dashboard;