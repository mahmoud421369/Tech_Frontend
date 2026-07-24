import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPackage, FiTrendingUp, FiRefreshCw, FiStar, FiActivity, FiArrowRight, 
  FiShoppingBag, FiTool, FiZap, FiTarget, FiBox, FiClock, FiCalendar
} from 'react-icons/fi';
import { RiMoneyDollarCircleLine, RiToolsLine } from 'react-icons/ri';
import { FaChartLine } from 'react-icons/fa';
import { motion } from 'framer-motion';
import api from '../api';
import useAuthStore from '../store/Auth';
import debounce from 'lodash/debounce';
import Swal from 'sweetalert2';

const StoreIllustration = memo(() => (
  <svg viewBox="0 0 120 90" className="w-20 h-16 sm:w-24 sm:h-20">
    <circle cx="98" cy="18" r="20" fill="rgba(16,185,129,0.10)" />
    <circle cx="14" cy="72" r="14" fill="rgba(16,185,129,0.08)" />
    <path d="M18 32 L60 18 L102 32 L102 40 L18 40 Z" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" className="dark:fill-gray-800 dark:stroke-gray-700" />
    <rect x="22" y="40" width="76" height="36" rx="3" fill="#ffffff" stroke="#e5e7eb" strokeWidth="2" className="dark:fill-gray-900 dark:stroke-gray-700" />
    <rect x="46" y="52" width="28" height="24" rx="2" fill="rgba(16,185,129,0.14)" stroke="#10b981" strokeWidth="2" />
    <circle cx="60" cy="64" r="2" fill="#10b981" />
    <path d="M30 14 L34 6 L38 14 L34 14 Z" fill="#fbbf24" />
    <circle cx="108" cy="52" r="2.4" fill="#34d399" />
  </svg>
));

const AnalyticsIllustration = memo(() => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20">
    <circle cx="50" cy="50" r="42" fill="rgba(16,185,129,0.10)" className="dark:fill-emerald-900/20" />
    <path d="M28 62 V72 M44 52 V72 M60 42 V72 M76 32 V72" stroke="#10b981" strokeWidth="5" strokeLinecap="round" className="dark:stroke-emerald-400" />
    <path d="M26 50 L44 38 L60 46 L78 26" fill="none" stroke="#34d399" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-emerald-300" />
    <circle cx="78" cy="26" r="3.4" fill="#34d399" className="dark:fill-emerald-300" />
  </svg>
));

const InventoryIllustration = memo(() => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20">
    <circle cx="50" cy="50" r="42" fill="rgba(255,255,255,0.06)" />
    <path d="M28 38 L50 26 L72 38 L72 66 L50 78 L28 66 Z" fill="none" stroke="#34d399" strokeWidth="2.6" strokeLinejoin="round" />
    <path d="M28 38 L50 50 L72 38 M50 50 V78" fill="none" stroke="#34d399" strokeWidth="2.2" strokeLinejoin="round" />
    <circle cx="76" cy="22" r="2.6" fill="#fbbf24" />
  </svg>
));

const CalendarIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(16,185,129,0.10)" className="dark:fill-emerald-900/20" />
    <rect x="16" y="18" width="32" height="28" rx="4" fill="none" stroke="#10b981" strokeWidth="2.4" className="dark:stroke-emerald-400" />
    <path d="M16 26 H48" stroke="#10b981" strokeWidth="2.4" className="dark:stroke-emerald-400" />
    <path d="M23 14 V22 M41 14 V22" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" className="dark:stroke-emerald-400" />
    <circle cx="26" cy="34" r="2" fill="#34d399" />
    <circle cx="34" cy="34" r="2" fill="#34d399" />
    <circle cx="26" cy="40" r="2" fill="#34d399" />
  </svg>
));

const StatCard = memo(({ label, value, icon: Icon, color, to, description }) => (
  <Link
    to={to}
    className="relative group bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-8 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none transition-all duration-500 overflow-hidden"
  >
    <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-br-full -translate-x-8 -translate-y-8 group-hover:-translate-x-4 group-hover:-translate-y-4 transition-transform duration-700" />
    
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
          <FiArrowRight size={14} className="rotate-180" />
        </div>
      </div>
    </div>
  </Link>
));

const Link = ({ to, children, className }) => {
  const navigate = useNavigate();
  return <div onClick={() => navigate(to)} className={`cursor-pointer ${className}`}>{children}</div>;
};

const ShopDashboard = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();

  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    totalOrders: 0,
    todayRepairs: 0,
    totalRepairs: 0,
  });
  const [isLoading, setIsLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);


    useEffect(() => { document.title = ' لوحة التحكم'; }, []);
  
  const showToast = (text, icon) => {
    Swal.fire({ text, icon, toast: true, position: "top-start", timer: 3000, showConfirmButton: false });
  };

  const fetchStats = useCallback(async () => {
    try {
      const [sales, salesStats, orders, repairsStats, repairsTotal] = await Promise.all([
        api.post('/api/shops/dashboard/sales/total', { startDate, endDate }).catch(() => ({ data: 0 })),
        api.get('/api/shops/dashboard/sales/stats').catch(() => ({ data: {} })),
        api.post('/api/shops/dashboard/orders/total', { startDate, endDate }).catch(() => ({ data: 0 })),
        api.get('/api/shops/dashboard/repairs/stats').catch(() => ({ data: {} })),
        api.get('/api/shops/dashboard/repairs/total').catch(() => ({ data: 0 })),
      ]);

      setStats({
        totalSales: sales.data || 0,
        todaySales: salesStats.data?.todaySales || 0,
        totalOrders: orders.data || 0,
        todayRepairs: repairsStats.data?.todayRepairs || 0,
        totalRepairs: repairsTotal.data || 0,
      });
      setLastUpdated(new Date());
    } catch {
      showToast("فشل تحديث البيانات", "error");
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const resetDates = () => {
    setStartDate('');
    setEndDate('');
    showToast("تمت إعادة تعيين الفلتر", "success");
  };

  const dashboardMetrics = useMemo(() => [
    { label: "إجمالي المبيعات", value: `EGP ${stats.totalSales.toLocaleString('ar-EG')}`, icon: FiActivity, color: "lime", to: "/shop/transactions", description: "إجمالي الأرباح" },
    { label: "مبيعات اليوم", value: `EGP ${stats.todaySales.toLocaleString('ar-EG')}`, icon: FiZap, color: "emerald", to: "/shop/transactions", description: "النشاط الحالي" },
    { label: "إجمالي الطلبات", value: stats.totalOrders.toLocaleString('ar-EG'), icon: FiShoppingBag, color: "blue", to: "/shop/orders", description: "طلبات المنتجات" },
    { label: "تصليحات اليوم", value: stats.todayRepairs.toLocaleString('ar-EG'), icon: FiTool, color: "orange", to: "/shop/repair-requests", description: "الصيانة الجارية" },
    { label: "إجمالي التصليحات", value: stats.totalRepairs.toLocaleString('ar-EG'), icon: RiToolsLine, color: "amber", to: "/shop/repair-requests", description: "سجل التصليح" },
    { label: "حالة الخدمة", value: "نشط", icon: FiActivity, color: "indigo", to: "/shop/subscriptions", description: "نظام التشغيل" },
  ], [stats]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">

       
       

        <div className="flex flex-col mt-3 md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-end gap-4 mt-3">
            <div className="flex-shrink-0 hidden sm:block">
              <StoreIllustration />
            </div>
            <div className="space-y-2 text-right">
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                لوحة <span className="text-emerald-500">المتجر</span>
              </h1>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                تابع أداء متجرك ومبيعاتك في الوقت الفعلي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="px-5 py-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">آخر تحديث</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
                <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                  {lastUpdated ? lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '...'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => fetchStats()}
              className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-lime-500 hover:rotate-180 transition-all duration-700"
            >
              <FiRefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

       
       
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-8">
           <div className="flex items-center gap-3 mb-8 justify-start">
              <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-emerald-500">
                <FiCalendar size={20} />
              </div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تصفية حسب التاريخ</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">من تاريخ</label>
                <input 
                  type="datetime-local" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">إلى تاريخ</label>
                <input 
                  type="datetime-local" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" 
                />
              </div>
              <button 
                onClick={resetDates}
                className="h-12 flex items-center justify-center gap-2 px-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-lime-500 dark:hover:bg-lime-500 hover:text-white transition-all shadow-xl shadow-gray-900/10"
              >
                <FiRefreshCw size={14} /> إعادة تعيين
              </button>
           </div>
        </div>

       
       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && !lastUpdated ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white dark:bg-gray-800 rounded-[2.5rem] animate-pulse border border-gray-100 dark:border-gray-700" />
            ))
          ) : (
            dashboardMetrics.map((c) => <StatCard key={c.label} {...c} />)
          )}
        </div>

        
        
        <div className="grid lg:grid-cols-2 gap-8">
           <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 p-10 flex flex-col items-center text-center space-y-6">
              <AnalyticsIllustration />
              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">تحليلات الأداء</h3>
                <p className="text-sm font-bold text-gray-400 leading-relaxed">
                  يتم الآن معالجة بيانات المبيعات والطلبات لتزويدك بتقارير دقيقة.
                </p>
              </div>
             
           </div>

           <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-full translate-x-16 -translate-y-16" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="space-y-6">
                  <InventoryIllustration />
                  <div className="space-y-2 text-right">
                    <h3 className="text-2xl font-black tracking-tight">إدارة المخزون</h3>
                    <p className="text-sm font-bold text-gray-400 leading-relaxed">
                      تأكد من تحديث منتجاتك بانتظام لتجنب إلغاء الطلبات.
                    </p>
                  </div>
                </div>
                <div onClick={() => navigate("/shop/inventory")} className="mt-8 cursor-pointer inline-flex items-center gap-2 text-emerald-500 font-black uppercase tracking-widest text-xs hover:gap-4 transition-all">
                  إدارة المخزون الآن <FiArrowRight className="rotate-180" />
                </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default memo(ShopDashboard);