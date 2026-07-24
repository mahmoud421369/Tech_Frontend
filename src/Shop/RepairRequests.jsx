import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import {
  FiSearch, FiChevronDown, FiInfo, FiX, FiChevronLeft, FiChevronRight,
  FiTool, FiPackage, FiCopy, FiCreditCard, FiDollarSign, FiCheckCircle,
  FiTruck, FiMapPin, FiArrowDownLeft, FiCheck, FiClock, FiXCircle,
  FiPauseCircle, FiArrowUp, FiArrowDown, FiChevronsDown, FiActivity, FiExternalLink, FiMoreHorizontal, FiHash,
  FiHome, FiShoppingBag
} from 'react-icons/fi';
import { RiFilter3Line, RiStore2Line, RiVerifiedBadgeLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import api from '../api';
import debounce from 'lodash/debounce';

const EASE = [0.16, 1, 0.3, 1];



const nextStatuses = {
  SUBMITTED: ['CANCELLED'],
  QUOTE_SENT: ['QUOTE_APPROVED', 'QUOTE_REJECTED'],
  QUOTE_APPROVED: ['DEVICE_COLLECTED'],
  QUOTE_REJECTED: ['CANCELLED'],
  DEVICE_COLLECTED: ['REPAIRING'],
  REPAIRING: ['REPAIR_COMPLETED'],
  REPAIR_COMPLETED: [],
  // DEVICE_DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
};

const STATUS_META = {
  SUBMITTED: { label: 'تم التقديم', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', dot: 'bg-blue-500' },
  QUOTE_SENT: { label: 'تم إرسال العرض', bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600', dot: 'bg-teal-500' },
  QUOTE_APPROVED: { label: 'موافقة على العرض', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  QUOTE_REJECTED: { label: 'رفض العرض', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', dot: 'bg-amber-500' },
  DEVICE_COLLECTED: { label: 'تم استلام الجهاز', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', dot: 'bg-purple-500' },
  REPAIRING: { label: 'تحت الإصلاح', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', dot: 'bg-orange-500' },
  REPAIR_COMPLETED: { label: 'تم الإصلاح', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600', dot: 'bg-green-500' },
  DEVICE_DELIVERED: { label: 'تم التسليم', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700', dot: 'bg-emerald-600' },
  CANCELLED: { label: 'ملغاة', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', dot: 'bg-red-500' },
  FAILED: { label: 'فشلت', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700', dot: 'bg-red-600' },
};

const getStatusMeta = (status) => STATUS_META[(status || '').toUpperCase()] || { label: status || '—', bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' };

const TRACK_ORDER = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'DEVICE_COLLECTED', 'REPAIRING', 'REPAIR_COMPLETED', 'DEVICE_DELIVERED'];
const TERMINAL_NEGATIVE = ['CANCELLED', 'FAILED', 'QUOTE_REJECTED'];

const DELIVERY_METHOD_LABELS = {
  SHOP_VISIT: { label: 'زيارة المتجر', icon: RiStore2Line },
  HOME_DELIVERY: { label: 'استلام من المنزل', icon: FiHome },
  COURIER: { label: 'توصيل عبر مندوب', icon: FiTruck },
};
const getDeliveryMeta = (v) => DELIVERY_METHOD_LABELS[(v || '').toUpperCase()] || { label: v || '—', icon: FiMapPin };

const PAYMENT_METHOD_LABELS = {
  CASH: { label: 'نقداً', icon: FiDollarSign },
  CARD: { label: 'بطاقة ائتمان', icon: FiCreditCard },
  ONLINE: { label: 'دفع إلكتروني', icon: FiCreditCard },
};
const getPaymentMeta = (v) => PAYMENT_METHOD_LABELS[(v || '').toUpperCase()] || { label: v || '—', icon: FiDollarSign };

const formatEGP = (value) => (value || value === 0) ? `EGP ${Number(value).toLocaleString('en-EG')}` : null;

const ROWS_OPTIONS = [5, 10, 25, 50];

const COLOR_HEX = { lime: '#84cc16', emerald: '#10b981', blue: '#3b82f6', orange: '#f97316' };



const PackageIllustration = memo(({ color }) => (
  <svg viewBox="0 0 44 44" className="w-6 h-6">
    <motion.g
      animate={{ y: [0, -1.5, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M8,14 L22,7 L36,14 L36,30 L22,37 L8,30 Z" fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M8,14 L22,21 L36,14" fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
      <line x1="22" y1="21" x2="22" y2="37" stroke={color} strokeWidth="2.2" />
    </motion.g>
  </svg>
));

const ClockIllustration = memo(({ color }) => (
  <svg viewBox="0 0 44 44" className="w-6 h-6">
    <circle cx="22" cy="22" r="15" fill="none" stroke={color} strokeWidth="2.4" />
    <motion.line
      x1="22" y1="22" x2="22" y2="12" stroke={color} strokeWidth="2.4" strokeLinecap="round"
      animate={{ rotate: 360 }} style={{ transformOrigin: '22px 22px' }}
      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
    />
    <line x1="22" y1="22" x2="28" y2="22" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
));

const WrenchIllustration = memo(({ color }) => (
  <svg viewBox="0 0 44 44" className="w-6 h-6">
    <motion.g
      animate={{ rotate: [-12, 12, -12] }}
      style={{ transformOrigin: '30px 14px' }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <rect x="16" y="20" width="26" height="7" rx="3.5" fill="none" stroke={color} strokeWidth="2.4" transform="rotate(-32 29 23.5)" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke={color} strokeWidth="2.4" strokeDasharray="22 100" strokeLinecap="round" transform="rotate(140 12 12)" />
    </motion.g>
  </svg>
));

const CheckIllustration = memo(({ color }) => (
  <svg viewBox="0 0 44 44" className="w-6 h-6">
    <circle cx="22" cy="22" r="15" fill="none" stroke={color} strokeWidth="2.4" />
    <motion.path
      d="M15,22 L20,28 L30,15"
      fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.8, ease: EASE }}
    />
  </svg>
));

const EmptyRepairsIllustration = memo(() => (
  <svg viewBox="0 0 140 110" className="w-28 h-24 mx-auto">
    <ellipse cx="70" cy="96" rx="42" ry="6" fill="rgba(0,0,0,0.05)" className="dark:fill-white/5" />
    <path d="M24 42 L70 24 L116 42 L116 78 L70 92 L24 78 Z" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" className="dark:fill-gray-800 dark:stroke-gray-700" />
    <path d="M24 42 L70 58 L116 42" fill="none" stroke="#e5e7eb" strokeWidth="2" className="dark:stroke-gray-700" />
    <path d="M70 58 L70 92" fill="none" stroke="#e5e7eb" strokeWidth="2" className="dark:stroke-gray-700" />
    <g transform="translate(58,4) rotate(18)">
      <rect x="0" y="10" width="20" height="6" rx="3" fill="none" stroke="#10b981" strokeWidth="2.2" />
      <circle cx="0" cy="13" r="5.5" fill="none" stroke="#10b981" strokeWidth="2.2" strokeDasharray="16 100" strokeLinecap="round" transform="rotate(140 0 13)" />
    </g>
  </svg>
));

const PriceTagIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(16,185,129,0.10)" className="dark:fill-emerald-900/20" />
    <path d="M18 18 L34 18 L46 30 L30 46 L18 34 Z" fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinejoin="round" className="dark:stroke-emerald-400" />
    <circle cx="24" cy="24" r="2.6" fill="#10b981" className="dark:fill-emerald-400" />
  </svg>
));

const TrackFlagIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(16,185,129,0.10)" className="dark:fill-emerald-900/20" />
    <path d="M22 14 V50" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" className="dark:stroke-emerald-400" />
    <path d="M22 16 H40 L35 22 L40 28 H22 Z" fill="#10b981" fillOpacity="0.8" className="dark:fill-emerald-400" />
  </svg>
));

const StatCard = memo(({ Illustration, label, value, color, description }) => (
  <div className="relative group bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
    <div className="flex flex-col h-full relative z-10 text-right">
      <div className={`w-12 h-12 rounded-full bg-white border-2 border-gray-100 dark:border-gray-800 dark:bg-${color}-900/20 flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform`}>
        <Illustration color={COLOR_HEX[color] || '#10b981'} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
      <p className="text-[9px] font-bold text-gray-400 mt-2">{description}</p>
    </div>
  </div>
));

const RowsPerPageDropdown = memo(({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title="عدد الصفوف في كل صفحة"
        onClick={() => setOpen(v => !v)}
        className="w-full sm:w-auto flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 cursor-pointer transition-all"
      >
        <span>{value} صفوف لكل صفحة</span>
        <FiChevronDown className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: EASE }}
            className="absolute z-30 mt-2 w-full sm:w-44 right-0 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
          >
            {ROWS_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                title={`${n} صفوف لكل صفحة`}
                onClick={() => { onChange(n); setOpen(false); }}
                className={`w-full text-right px-5 py-3 text-xs font-bold transition-colors ${
                  n === value ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {n} صفوف لكل صفحة
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

const RepairTracker = memo(({ status }) => {
  const upperStatus = (status || '').toUpperCase();

  if (TERMINAL_NEGATIVE.includes(upperStatus)) {
    const meta = getStatusMeta(upperStatus);
    return (
      <div className={`flex items-center gap-3 p-4 rounded-2xl ${meta.bg}`}>
        <FiXCircle className={meta.text} size={22} />
        <div>
          <p className={`text-sm font-black ${meta.text}`}>{meta.label}</p>
          <p className="text-[11px] font-bold text-gray-400 mt-0.5">تم إيقاف مسار هذا الطلب عند هذه المرحلة</p>
        </div>
      </div>
    );
  }

  const idx = TRACK_ORDER.indexOf(upperStatus);

  return (
    <div className="overflow-x-auto custom-scrollbar-thin pb-1">
      <div className="flex items-center min-w-[600px] px-1">
        {TRACK_ORDER.map((step, i) => {
          const done = idx >= i;
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-2 w-[80px] flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600'
                }`}>
                  {done ? <FiCheck size={14} /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                </div>
                <p className={`text-[9px] font-black text-center uppercase tracking-tight leading-tight ${done ? 'text-emerald-600' : 'text-gray-400 dark:text-gray-600'}`}>
                  {STATUS_META[step].label}
                </p>
              </div>
              {i < TRACK_ORDER.length - 1 && (
                <div className={`h-0.5 flex-1 -mt-5 transition-colors ${idx > i ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});




const RepairRequests = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalRepair, setStatusModalRepair] = useState(null);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceModalRepair, setPriceModalRepair] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsRepair, setDetailsRepair] = useState(null);

  const [stats, setStats] = useState({ totalRepairs: 0, pendingQuote: 0, underRepair: 0, completed: 0 });

  useEffect(() => { document.title = 'إدارة طلبات التصليح'; }, []);

  const showToast = useCallback((text, icon) =>
    Swal.fire({
      text, icon, toast: true, position: 'top-start',
      showConfirmButton: false, timer: 3000,
    }), []);

  const fetchRepairs = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all'
        ? '/api/shops/repair-request'
        : `/api/shops/repair-request/status/${statusFilter.toUpperCase()}`;
      const res = await api.get(url, { params: { query: searchTerm } });
      const data = Array.isArray(res.data) ? res.data : res.data.content || [];
      setRepairs(data);
      setStats({
        totalRepairs: data.length,
        pendingQuote: data.filter(r => ['SUBMITTED', 'QUOTE_SENT'].includes((r.status || '').toUpperCase())).length,
        underRepair: data.filter(r => (r.status || '').toUpperCase() === 'REPAIRING').length,
        completed: data.filter(r => ['REPAIR_COMPLETED', 'DEVICE_DELIVERED'].includes((r.status || '').toUpperCase())).length,
      });
    } catch { showToast('فشل جلب طلبات التصليح', 'error'); }
    finally { setLoading(false); }
  }, [statusFilter, searchTerm]);

  const debouncedFetch = useMemo(() => debounce(fetchRepairs, 400), [fetchRepairs]);
  useEffect(() => { debouncedFetch(); return () => debouncedFetch.cancel(); }, [debouncedFetch]);

  const updateRepairStatus = useCallback(async (repairId, newStatus) => {
    const previousRepairs = [...repairs];
    setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, status: newStatus } : r));

    try {
      await api.put(`/api/shops/repair-request/${repairId}/status`, { status: newStatus });
      showToast('تم تحديث الحالة بنجاح', 'success');
      fetchRepairs();
    } catch { 
      setRepairs(previousRepairs);
      showToast('فشل تحديث الحالة', 'error'); 
    }
  }, [repairs, fetchRepairs, showToast]);

  const updateRepairPrice = useCallback(async () => {
    if (!newPrice || newPrice <= 0) { showToast('يرجى إدخال سعر صحيح', 'error'); return; }
    const repairId = priceModalRepair.id;
    const priceVal = Number(newPrice);

    const previousRepairs = [...repairs];
    setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, price: priceVal } : r));
    setShowPriceModal(false);

    try {
      await api.put(`/api/shops/repair-request/${repairId}/price`, { price: priceVal });
      showToast('تم تحديد السعر بنجاح', 'success');
      fetchRepairs();
    } catch { 
      setRepairs(previousRepairs);
      showToast('فشل في تحديد السعر', 'error'); 
    }
  }, [newPrice, priceModalRepair, repairs, fetchRepairs, showToast]);

  const paginated = useMemo(() => repairs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [repairs, currentPage, rowsPerPage]);
  const totalPages = Math.ceil(repairs.length / rowsPerPage);

  const statCards = useMemo(() => [
    { Illustration: PackageIllustration, label: 'إجمالي الطلبات', value: stats.totalRepairs.toLocaleString('ar-EG'), color: "lime", description: "جميع الطلبات المستلمة" },
    { Illustration: ClockIllustration, label: 'بانتظار عرض سعر', value: stats.pendingQuote.toLocaleString('ar-EG'), color: "orange", description: "تحتاج إلى تسعير فوراً" },
    { Illustration: WrenchIllustration, label: 'قيد الإصلاح', value: stats.underRepair.toLocaleString('ar-EG'), color: "blue", description: "داخل الورشة الآن" },
    { Illustration: CheckIllustration, label: 'تم الانتهاء', value: stats.completed.toLocaleString('ar-EG'), color: "emerald", description: "طلبات جاهزة للتسليم" },
  ], [stats]);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">



        <div className="flex flex-col md:flex-row md:items-end mt-3 justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">خدمات الصيانة</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">طلبات <span className="text-emerald-500">التصليح</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">أدر دورة حياة الإصلاح بالكامل من التقديم حتى التسليم النهائي</p>
          </div>

          <button
            title="تصفية الطلبات حسب الحالة"
            onClick={() => setShowFilterPanel(true)}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gray-900 dark:bg-emerald-500 text-white dark:text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white transition-all shadow-xl shadow-gray-900/10 active:scale-95"
          >
            <RiFilter3Line size={16} /> تصفية الطلبات
          </button>
        </div>

        
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="ابحث برقم الطلب، اسم العميل أو نوع الجهاز..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-200 transition-all"
              />
            </div>
            <RowsPerPageDropdown value={rowsPerPage} onChange={(n) => { setRowsPerPage(n); setCurrentPage(1); }} />
          </div>
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900 dark:border-gray-700">
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">رقم الطلب</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">المتجر</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الاستلام</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الدفع</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">السعر </th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الحالة</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  [...Array(rowsPerPage)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-3 py-2.5"><div className="h-3.5 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center">
                      <div className="mb-4">
                        <EmptyRepairsIllustration />
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">لا توجد طلبات تصليح</p>
                      <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">السجل فارغ أو لا يطابق البحث</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(r => {
                    const cs = getStatusMeta(r.status);
                    const canEditPrice = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_REJECTED'].includes((r.status || '').toUpperCase());
                    const hasNext = nextStatuses[(r.status || '').toUpperCase()]?.length > 0;
                    const deliveryMeta = getDeliveryMeta(r.deliveryMethod);
                    const paymentMeta = getPaymentMeta(r.paymentMethod);
                    const DeliveryIcon = deliveryMeta.icon;
                    const PaymentIcon = paymentMeta.icon;
                    const formattedPrice = formatEGP(r.price);
                    return (
                      <tr key={r.id} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-900/5 transition-colors group">
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 flex-shrink-0">
                              <FiHash size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-gray-900 dark:text-white">#{String(r.id).slice(0, 8)}</p>
                              <p className="text-[9px] font-bold text-gray-400 truncate max-w-[120px]">{r.description || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-center">
                          <p className="text-[11px] font-black text-gray-900 dark:text-white">{r.shopName || "—"}</p>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-center">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                            <DeliveryIcon size={12} className="text-emerald-500 flex-shrink-0" /> {deliveryMeta.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-center">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                            <PaymentIcon size={12} className="text-emerald-500 flex-shrink-0" /> {paymentMeta.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-center font-mono font-black text-[11px] text-emerald-600">
                          {formattedPrice || <span className="text-red-500 font-sans">لم يتم التسعير</span>}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-center">
                          <span
                            title={hasNext ? 'اضغط لتحديث حالة الطلب' : 'لا توجد مراحل تالية'}
                            onClick={() => { if (hasNext) { setStatusModalRepair(r); setShowStatusModal(true); } }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${cs.bg} ${cs.text} ${hasNext ? 'cursor-pointer hover:opacity-80' : ''}`}
                          >
                            
                            {cs.label}
                            {hasNext && <FiChevronDown size={11} />}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-left">
                          <div className="flex items-center justify-start gap-1.5">
                            <button title="عرض تفاصيل الطلب الكاملة" onClick={() => { setDetailsRepair(r); setShowDetailsModal(true); }} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-emerald-500 transition-all active:scale-95">
                              <FiInfo size={13} />
                            </button>
                            <button title='نسخ رقم الطلب' onClick={() => { navigator.clipboard.writeText(r.id); showToast('تم نسخ رقم الطلب', 'success'); }} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-emerald-500 transition-all active:scale-95">
                              <FiCopy size={12} />
                            </button>
                            {canEditPrice && (
                              <button title='تحديد أو تعديل سعر الإصلاح' onClick={() => { setPriceModalRepair(r); setNewPrice(r.price || ''); setShowPriceModal(true); }} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-emerald-500 transition-all active:scale-95">
                                <FiDollarSign size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>



          {totalPages > 1 && (
            <div className="p-4 bg-gray-100 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest order-2 sm:order-1">
                عرض <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> إلى <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, repairs.length)}</span> من <span className="text-gray-900 dark:text-white">{repairs.length}</span> طلب
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button title="الصفحة السابقة" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-white dark:bg-gray-800 text-gray-400 hover:text-emerald-500 disabled:opacity-30 transition-all">
                  <FiChevronRight size={20} />
                </button>
                <button title="الصفحة التالية" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-white dark:bg-gray-800 text-gray-400 hover:text-emerald-500 disabled:opacity-30 transition-all">
                  <FiChevronLeft size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>



      {showFilterPanel && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowFilterPanel(false)} />
          <div className="relative w-full lg:max-w-md bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
            <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
              <div className="w-10 h-10 flex-shrink-0"><TrackFlagIllustration /></div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تصفية طلبات التصليح</h3>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">اختر الحالة لعرض الطلبات المتعلقة بها</p>
              </div>
            </div>
            <div className="p-8 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar-thin">
              <button title="عرض جميع الطلبات بلا استثناء" onClick={() => { setStatusFilter('all'); setShowFilterPanel(false); setCurrentPage(1); }} className={`px-4 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? "bg-emerald-500 border-emerald-500 text-white" : "bg-gray-50 dark:bg-gray-900 text-gray-500 hover:border-emerald-500"}`}>جميع الحالات</button>
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <button key={key} title={`عرض الطلبات بحالة ${meta.label}`} onClick={() => { setStatusFilter(key); setShowFilterPanel(false); setCurrentPage(1); }} className={`px-4 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === key ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-emerald-500 hover:text-emerald-600"}`}>
                  {meta.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}



      {showDetailsModal && detailsRepair && (() => {
        const dr = detailsRepair;
        const deliveryMeta = getDeliveryMeta(dr.deliveryMethod);
        const paymentMeta = getPaymentMeta(dr.paymentMethod);
        const DeliveryIcon = deliveryMeta.icon;
        const PaymentIcon = paymentMeta.icon;
        const formattedPrice = formatEGP(dr.price);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowDetailsModal(false)} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <WrenchIllustration color="#10b981" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-white">تفاصيل طلب التصليح</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">طلب رقم #{String(dr.id).slice(0, 8)}</p>
                  </div>
                </div>
                <button title="إغلاق النافذة" onClick={() => setShowDetailsModal(false)} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                  <FiX size={18} />
                </button>
              </div>

              <div className="px-8 py-8 space-y-7 overflow-y-auto max-h-[70vh] custom-scrollbar-thin text-right">

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-3 rounded-full bg-emerald-500" /> مسار تتبع الطلب
                  </p>
                  <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <RepairTracker status={dr.status} />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-3 rounded-full bg-emerald-500" /> تفاصيل الطلب
                  </p>
                  <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                    <div className="flex items-start gap-3">
                      <FiTool className="text-gray-400 mt-1 flex-shrink-0" size={16} />
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">وصف العطل</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 leading-relaxed">{dr.description || "لا يوجد وصف مفصل للعطل"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-start gap-2">
                        <RiStore2Line className="text-gray-400 mt-0.5 flex-shrink-0" size={14} />
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">المتجر</p>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{dr.shopName || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <DeliveryIcon className="text-gray-400 mt-0.5 flex-shrink-0" size={14} />
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">طريقة الاستلام</p>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{deliveryMeta.label}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-3 rounded-full bg-emerald-500" /> التسليم والدفع
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-2">
                      <div className="flex items-center gap-2">
                        <FiMapPin className="text-emerald-500" size={14} />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">عنوان التسليم</p>
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-relaxed">{dr.deliveryAddressDetails || "—"}</p>
                    </div>
                    <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-2">
                      <div className="flex items-center gap-2">
                        <PaymentIcon className="text-emerald-500" size={14} />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">طريقة الدفع</p>
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{paymentMeta.label}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0"><PriceTagIllustration /></div>
                    <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">المبلغ المطلوب</p>
                  </div>
                  <p className="text-2xl font-black text-emerald-600 tracking-tighter">{formattedPrice || "—"}</p>
                </div>
              </div>

              <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-700">
                <button title="إغلاق نافذة التفاصيل" onClick={() => setShowDetailsModal(false)} className="w-full py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-emerald-500 transition-all">إغلاق</button>
              </div>
            </div>
          </div>
        );
      })()}



      {showStatusModal && statusModalRepair && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowStatusModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
              <div className="w-11 h-11 flex-shrink-0"><TrackFlagIllustration /></div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تحديث مرحلة الإصلاح</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">طلب #{String(statusModalRepair.id).slice(0, 8)}</p>
              </div>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                {nextStatuses[(statusModalRepair.status || '').toUpperCase()]?.map(status => (
                  <button
                    key={status}
                    title={`تغيير الحالة إلى ${getStatusMeta(status).label}`}
                    onClick={() => { updateRepairStatus(statusModalRepair.id, status); setShowStatusModal(false); }}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-xs font-black text-gray-700 dark:text-gray-200 hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-between group"
                  >
                    {getStatusMeta(status).label}
                    <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
            <div className="px-8 pb-8">
              <button title="إلغاء العملية والرجوع" onClick={() => setShowStatusModal(false)} className="w-full py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">إلغاء</button>
            </div>
          </div>
        </div>
      )}



      {showPriceModal && priceModalRepair && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowPriceModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
              <div className="w-11 h-11 flex-shrink-0"><PriceTagIllustration /></div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تحديد عرض السعر</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">إرسال عرض مالي للعميل</p>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">المبلغ المقترح (ج.م)</label>
                <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-lg font-black text-gray-900 dark:text-white focus:outline-none transition-all text-center" />
              </div>
            </div>
            <div className="px-8 pb-8 flex gap-3">
              <button title="إلغاء وعدم إرسال العرض" onClick={() => setShowPriceModal(false)} className="flex-1 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">إلغاء</button>
              <button title="إرسال عرض السعر إلى العميل" onClick={updateRepairPrice} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">إرسال العرض</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #10b981; }
      `}} />
    </div>
  );
};

export default memo(RepairRequests);