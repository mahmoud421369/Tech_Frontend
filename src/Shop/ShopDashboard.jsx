import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiActivity, FiZap, FiShoppingBag, FiTool, FiRefreshCw, FiCalendar, FiArrowRight } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';
import useAuthStore from '../store/Auth';

const isValidDate = (v) => !v || !Number.isNaN(new Date(v).getTime());
const formatPrice = (p) => `EGP ${Number(p || 0).toLocaleString('en-US')}`;
const formatDate = (d) => {
  if (!d) return '-';
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('ar-EG', { day: '2-digit', month: 'short' });
};

const ORDER_STATUS_STYLE = {
  PENDING:    { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
  PROCESSING: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600' },
  SHIPPED:    { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600' },
  DELIVERED:  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
  COMPLETED:  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
  CANCELLED:  { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600' },
};
const REPAIR_STATUS_STYLE = {
  SUBMITTED:   { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
  PENDING:     { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
  IN_PROGRESS: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600' },
  COMPLETED:   { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
  REJECTED:    { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600' },
  CANCELLED:   { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600' },
};
const getStyle = (map, s) => map[s] || { bg: 'bg-gray-50 dark:bg-gray-900', text: 'text-gray-500' };

const ScrollbarStyles = memo(() => (
  <style>{`
    .styled-scrollbar::-webkit-scrollbar {
      height: 6px;
      width: 6px;
    }
    .styled-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .styled-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(16, 185, 129, 0.35);
      border-radius: 9999px;
    }
    .styled-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(16, 185, 129, 0.6);
    }
    .styled-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(16, 185, 129, 0.35) transparent;
    }
  `}</style>
));

const SkeletonBlock = ({ className }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-2xl animate-pulse border border-gray-100 dark:border-gray-700 ${className}`} />
);

const EmptyIllustration = memo(() => (
  <svg viewBox="0 0 100 80" className="w-16 h-14 mx-auto">
    <path d="M14 34 L28 12 H72 L86 34" fill="none" stroke="#d1d5db" strokeWidth="2.4" strokeLinejoin="round" className="dark:stroke-gray-600" />
    <path d="M14 34 H36 C37 40 43 44 50 44 C57 44 63 40 64 34 H86 V64 C86 67 84 69 81 69 H19 C16 69 14 67 14 64 Z" fill="none" stroke="#d1d5db" strokeWidth="2.4" strokeLinejoin="round" className="dark:stroke-gray-600" />
    <circle cx="50" cy="52" r="2" fill="#d1d5db" className="dark:fill-gray-600" />
  </svg>
));

const EmptyRow = ({ colSpan, text }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-10 text-center">
      <EmptyIllustration />
      <p className="mt-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">{text}</p>
    </td>
  </tr>
);

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

const StatCard = memo(({ label, value, icon: Icon, color, to, description }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(to)}
      className="group cursor-pointer bg-white dark:bg-gray-800 rounded-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:shadow-gray-200/40 dark:hover:shadow-none transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 dark:text-${color}-400`}>
          <Icon size={16} />
        </div>
        <div className={`w-6 h-6 rounded-full bg-${color}-50 dark:bg-${color}-900/30 flex items-center justify-center text-${color}-600 dark:text-${color}-400 opacity-0 group-hover:opacity-100 transition-all duration-300`}>
          <FiArrowRight size={11} className="rotate-180" />
        </div>
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-[9px] font-bold text-gray-400">{description}</p>
      </div>
    </div>
  );
});

const DateFilter = memo(({ startDate, endDate, onStartChange, onEndChange, onReset, error }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex items-center gap-2 shrink-0 text-gray-400">
        <FiCalendar size={16} className="text-emerald-500" />
        <span className="text-[10px] font-black uppercase tracking-widest">تصفية حسب التاريخ</span>
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="datetime-local"
          value={startDate}
          max={endDate || undefined}
          onChange={e => onStartChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-xs font-bold text-gray-900 dark:text-white focus:outline-none transition-all"
        />
        <input
          type="datetime-local"
          value={endDate}
          min={startDate || undefined}
          onChange={e => onEndChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-lime-200 text-xs font-bold text-gray-900 dark:text-white focus:outline-none transition-all"
        />
      </div>

      <button
        onClick={onReset}
        className="h-10 shrink-0 flex items-center justify-center gap-2 px-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white transition-all"
      >
        <FiRefreshCw size={12} /> إعادة تعيين
      </button>
    </div>

    {error && (
      <p className="mt-2 text-[10px] font-black text-red-500 uppercase tracking-widest px-1">{error}</p>
    )}
  </div>
));

const LatestOrdersTable = memo(() => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await api.get('/api/shops/orders/control', {
          params: { page: 0, size: 5, sort: 'createdAt,desc' },
          signal: controller.signal,
        });
        const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
        setOrders(data.slice(0, 5));
      } catch {
        if (!controller.signal.aborted) setOrders([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 dark:border-gray-700">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
          <FiShoppingBag size={15} />
        </div>
        <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">أحدث 5 طلبات</h3>
      </div>

      <div className="overflow-x-auto styled-scrollbar">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50">
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400">العميل</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400">المنتجات</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">الحالة</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">الدفع</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">الإجمالي</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 text-left">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-6 py-3"><div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-full" /></td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <EmptyRow colSpan={6} text="لا توجد طلبات حديثة" />
            ) : (
              orders.map((o) => {
                const st = getStyle(ORDER_STATUS_STYLE, o.status);
                const items = o.orderItems || [];
                const firstItem = items[0];
                const extraCount = items.length - 1;
                const fullName = [o.firstName, o.lastName].filter(Boolean).join(' ');
                return (
                  <tr key={o.id} className="hover:bg-blue-50/10 dark:hover:bg-blue-900/5 transition-colors">
                    <td className="px-6 py-3">
                      <p className="text-xs font-black text-gray-900 dark:text-white">{fullName || 'عميل غير محدد'}</p>
                      <p className="text-[9px] font-bold text-gray-400 mt-0.5">{o.phoneNumber || '-'}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-[10px] font-bold text-gray-700 dark:text-gray-200">{firstItem?.productName || '-'}</p>
                      {extraCount > 0 && (
                        <p className="text-[9px] font-black text-gray-400 mt-0.5">+{extraCount} منتج آخر</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${st.bg} ${st.text}`}>
                        {o.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {o.paymentMethod || '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-black text-[11px] text-emerald-600 whitespace-nowrap">
                      {formatPrice(o.totalPrice)}
                    </td>
                    <td className="px-6 py-3 text-left text-[9px] font-bold text-gray-400 whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const LatestRepairsTable = memo(() => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await api.get('/api/shops/repair-request', {
          params: { page: 0, size: 5, sort: 'createdAt,desc' },
          signal: controller.signal,
        });
        const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
        setRepairs(data.slice(0, 5));
      } catch {
        if (!controller.signal.aborted) setRepairs([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 dark:border-gray-700">
        <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
          <FiTool size={15} />
        </div>
        <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">أحدث 5 طلبات تصليح</h3>
      </div>

      <div className="overflow-x-auto styled-scrollbar">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50">
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400">الطلب</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400">المتجر</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">الحالة</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">التسليم</th>
              <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">السعر</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-gray-400 text-left">التأكيد</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-6 py-3"><div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-full" /></td>
                </tr>
              ))
            ) : repairs.length === 0 ? (
              <EmptyRow colSpan={6} text="لا توجد طلبات تصليح حديثة" />
            ) : (
              repairs.map((r) => {
                const st = getStyle(REPAIR_STATUS_STYLE, r.status);
                return (
                  <tr key={r.id} className="hover:bg-orange-50/10 dark:hover:bg-orange-900/5 transition-colors">
                    <td className="px-6 py-3">
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate max-w-[160px]">{r.description || 'بدون وصف'}</p>
                      <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">{r.paymentMethod || '-'}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[10px] font-bold text-gray-700 dark:text-gray-200">
                      {r.shopName || '-'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${st.bg} ${st.text}`}>
                        {r.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {r.deliveryMethod || '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-black text-[11px] text-emerald-600 whitespace-nowrap">
                      {formatPrice(r.price)}
                    </td>
                    <td className="px-6 py-3 text-left whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        r.confirmed
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                          : 'bg-gray-50 dark:bg-gray-900 text-gray-400'
                      }`}>
                        {r.confirmed ? 'مؤكد' : 'قيد الانتظار'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const ShopDashboard = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [dateError, setDateError] = useState('');
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    totalOrders: 0,
    todayRepairs: 0,
    totalRepairs: 0,
  });
  const [isLoading, setIsLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const abortRef = useRef(null);

  useEffect(() => { document.title = ' لوحة التحكم'; }, []);

  useEffect(() => {
    if (!accessToken) navigate('/login');
  }, [accessToken, navigate]);

  const showToast = useCallback((text, icon) => {
    Swal.fire({ text, icon, toast: true, position: 'top-start', timer: 3000, showConfirmButton: false });
  }, []);

  const fetchStats = useCallback(async () => {
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      setDateError('صيغة التاريخ غير صالحة');
      return;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setDateError('تاريخ البداية يجب أن يسبق تاريخ النهاية');
      return;
    }
    setDateError('');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    try {
      const payload = { startDate: startDate || null, endDate: endDate || null };
      const opts = { signal: controller.signal };

      const [sales, salesStats, orders, repairsStats, repairsTotal] = await Promise.all([
        api.post('/api/shops/dashboard/sales/total', payload, opts).catch(() => ({ data: 0 })),
        api.get('/api/shops/dashboard/sales/stats', opts).catch(() => ({ data: {} })),
        api.post('/api/shops/dashboard/orders/total', payload, opts).catch(() => ({ data: 0 })),
        api.get('/api/shops/dashboard/repairs/stats', opts).catch(() => ({ data: {} })),
        api.get('/api/shops/dashboard/repairs/total', opts).catch(() => ({ data: 0 })),
      ]);

      if (controller.signal.aborted) return;

      setStats({
        totalSales: Number(sales.data) || 0,
        todaySales: Number(salesStats.data?.todaySales) || 0,
        totalOrders: Number(orders.data) || 0,
        todayRepairs: Number(repairsStats.data?.todayRepairs) || 0,
        totalRepairs: Number(repairsTotal.data) || 0,
      });
      setLastUpdated(new Date());
    } catch {
      if (!controller.signal.aborted) showToast('فشل تحديث البيانات', 'error');
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, [startDate, endDate, showToast]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 60000);
    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [fetchStats]);

  const resetDates = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setDateError('');
    showToast('تمت إعادة تعيين الفلتر', 'success');
  }, [showToast]);

  const dashboardMetrics = useMemo(() => [
    { label: 'إجمالي المبيعات', value: `EGP ${stats.totalSales.toLocaleString('ar-EG')}`, icon: FiActivity, color: 'lime', to: '/shop/transactions', description: 'إجمالي الأرباح' },
    { label: 'مبيعات اليوم', value: `EGP ${stats.todaySales.toLocaleString('ar-EG')}`, icon: FiZap, color: 'emerald', to: '/shop/transactions', description: 'النشاط الحالي' },
    { label: 'إجمالي الطلبات', value: stats.totalOrders.toLocaleString('ar-EG'), icon: FiShoppingBag, color: 'blue', to: '/shop/orders', description: 'طلبات المنتجات' },
    { label: 'تصليحات اليوم', value: stats.todayRepairs.toLocaleString('ar-EG'), icon: FiTool, color: 'orange', to: '/shop/repair-requests', description: 'الصيانة الجارية' },
  ], [stats]);

  const showSkeleton = isLoading && !lastUpdated;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo" dir="rtl">
      <ScrollbarStyles />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

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
               
                <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                  {lastUpdated ? lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '...'}
                </span>
              </div>
            </div>
            <button
              onClick={() => fetchStats()}
              className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:rotate-180 transition-all duration-700"
            >
              <FiRefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          onReset={resetDates}
          error={dateError}
        />

        {showSkeleton ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonBlock key={i} className="h-28" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {dashboardMetrics.map((c) => <StatCard key={c.label} {...c} />)}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <LatestOrdersTable />
          <LatestRepairsTable />
        </div>

      </div>
    </div>
  );
};

export default memo(ShopDashboard);