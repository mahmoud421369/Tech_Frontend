import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  FiChevronDown, FiSearch, FiInfo, FiCheckSquare, FiXCircle,
  FiChevronLeft, FiChevronRight, FiX, FiPackage, FiClock,
  FiTruck, FiCheckCircle, FiAlertCircle,
  FiCalendar, FiUser, FiPhone, FiCreditCard, FiDollarSign,
  FiTag, FiShoppingBag, FiHash,
  FiCheck, FiFilter, FiArrowLeft, FiCopy, FiThumbsUp, FiSettings,
  FiChevronsDown, FiArrowUp, FiArrowDown, FiExternalLink, FiMoreHorizontal, FiActivity
} from 'react-icons/fi';
import { RiShoppingCartLine } from 'react-icons/ri';
import Swal from 'sweetalert2';
import api from '../api';
import debounce from 'lodash/debounce';




const ROWS_OPTIONS = [5,10, 25, 50];

const STATUS_TRANSLATIONS = {
  PENDING: 'معلق',
  CONFIRMED: 'مؤكد',
  PROCESSING: 'قيد المعالجة',
  FINISHPROCESSING: 'تمت المعالجة',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغى',
  all: 'جميع الحالات',
};

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'FINISHPROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const LIFECYCLE_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'FINISHPROCESSING', 'SHIPPED', 'DELIVERED'];

const NEXT_STATUSES = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING'],
  PROCESSING: ['FINISHPROCESSING'],
  FINISHPROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const STATUS_STYLE = {
  PENDING: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', dot: 'bg-blue-500' },
  CONFIRMED: { bg: 'bg-lime-50 dark:bg-lime-900/20', text: 'text-lime-600', dot: 'bg-lime-500' },
  PROCESSING: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600', dot: 'bg-yellow-500' },
  FINISHPROCESSING: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', dot: 'bg-amber-500' },
  SHIPPED: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', dot: 'bg-purple-500' },
  DELIVERED: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  CANCELLED: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', dot: 'bg-red-500' },
};

const getStatusStyle = (s) => STATUS_STYLE[s] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };

const formatPrice = (p) => `EGP ${Number(p || 0).toLocaleString('en-US')}`;


const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
};

const EmptyOrdersIllustration = memo(() => (
  <svg viewBox="0 0 140 110" className="w-28 h-24 mx-auto">
    <ellipse cx="70" cy="96" rx="42" ry="6" fill="rgba(0,0,0,0.05)" className="dark:fill-white/5" />
    <path d="M24 42 L70 24 L116 42 L116 78 L70 92 L24 78 Z" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" className="dark:fill-gray-800 dark:stroke-gray-700" />
    <path d="M24 42 L70 58 L116 42" fill="none" stroke="#e5e7eb" strokeWidth="2" className="dark:stroke-gray-700" />
    <path d="M70 58 L70 92" fill="none" stroke="#e5e7eb" strokeWidth="2" className="dark:stroke-gray-700" />
    <path d="M46 34 L94 50" fill="none" stroke="#d1d5db" strokeWidth="2" className="dark:stroke-gray-600" />
    <circle cx="70" cy="16" r="8" fill="none" stroke="#10b981" strokeWidth="2.4" />
    <path d="M67 16 L69.5 18.5 L74 13.5" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));

const NoNextStepIllustration = memo(() => (
  <svg viewBox="0 0 100 80" className="w-20 h-16 mx-auto">
    <circle cx="50" cy="38" r="30" fill="rgba(16,185,129,0.08)" className="dark:fill-emerald-900/20" />
    <path d="M32 40 L44 52 L70 26" fill="none" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="80" cy="16" r="2.4" fill="#fbbf24" />
  </svg>
));

const CartIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(16,185,129,0.10)" className="dark:fill-emerald-900/20" />
    <path d="M16 18 H22 L27 40 H46 L50 24 H24" fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinejoin="round" className="dark:stroke-emerald-400" />
    <circle cx="29" cy="47" r="3" fill="#10b981" className="dark:fill-emerald-400" />
    <circle cx="44" cy="47" r="3" fill="#10b981" className="dark:fill-emerald-400" />
  </svg>
));

const PendingClockIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(59,130,246,0.10)" className="dark:fill-blue-900/20" />
    <circle cx="32" cy="32" r="16" fill="none" stroke="#3b82f6" strokeWidth="2.4" />
    <path d="M32 23 V32 L39 37" fill="none" stroke="#3b82f6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));

const ConfirmedCheckIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(16,185,129,0.10)" className="dark:fill-emerald-900/20" />
    <circle cx="32" cy="32" r="16" fill="none" stroke="#10b981" strokeWidth="2.4" className="dark:stroke-emerald-400" />
    <path d="M25 32 L30 38 L40 26" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-emerald-400" />
  </svg>
));

const DeliveredTruckIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(99,102,241,0.10)" className="dark:fill-indigo-900/20" />
    <rect x="12" y="26" width="26" height="14" rx="2" fill="none" stroke="#6366f1" strokeWidth="2.2" />
    <path d="M38 30 H46 L50 35 V40 H38 Z" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinejoin="round" />
    <circle cx="21" cy="42" r="3" fill="#6366f1" />
    <circle cx="42" cy="42" r="3" fill="#6366f1" />
  </svg>
));

const ProcessingGearIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(234,179,8,0.10)" className="dark:fill-yellow-900/20" />
    <circle cx="32" cy="32" r="10" fill="none" stroke="#eab308" strokeWidth="2.4" />
    <path d="M32 14 v6 M32 44 v6 M14 32 h6 M44 32 h6 M19 19 l4 4 M41 41 l4 4 M45 19 l-4 4 M23 41 l-4 4" stroke="#eab308" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
));

const FinishProcessingIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(245,158,11,0.10)" className="dark:fill-amber-900/20" />
    <rect x="18" y="18" width="28" height="28" rx="4" fill="none" stroke="#f59e0b" strokeWidth="2.4" />
    <path d="M24 32 L30 38 L40 26" fill="none" stroke="#f59e0b" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));

const DeliveredBoxIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(16,185,129,0.10)" className="dark:fill-emerald-900/20" />
    <path d="M20 24 L32 18 L44 24 L44 40 L32 46 L20 40 Z" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M20 24 L32 30 L44 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M27 33 L31 37 L38 28" fill="none" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));

const CancelledIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="26" fill="rgba(239,68,68,0.10)" className="dark:fill-red-900/20" />
    <circle cx="32" cy="32" r="16" fill="none" stroke="#ef4444" strokeWidth="2.4" />
    <path d="M25 25 L39 39 M39 25 L25 39" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
));

const STATUS_ILLUSTRATION_MAP = {
  PENDING: PendingClockIllustration,
  CONFIRMED: ConfirmedCheckIllustration,
  PROCESSING: ProcessingGearIllustration,
  FINISHPROCESSING: FinishProcessingIllustration,
  SHIPPED: DeliveredTruckIllustration,
  DELIVERED: DeliveredBoxIllustration,
  CANCELLED: CancelledIllustration,
};

const RowsDropdown = memo(({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between gap-3 min-w-[168px] px-5 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 cursor-pointer transition-all"
      >
        {value} طلبات لكل صفحة
        <FiChevronDown className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} size={14} />
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
          {options.map(n => (
            <button
              key={n}
              onClick={() => { onChange(n); setOpen(false); }}
              className={`w-full text-right px-5 py-2.5 text-xs font-bold transition ${
                value === n ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60'
              }`}
            >
              {n} طلبات لكل صفحة
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const STAT_ILLUSTRATIONS = {
  'إجمالي الطلبات': CartIllustration,
  'طلبات معلقة': PendingClockIllustration,
  'طلبات مؤكدة': ConfirmedCheckIllustration,
  'تم التسليم': DeliveredTruckIllustration,
};

const StatCard = memo(({ label, value, color, description }) => {
  const Illustration = STAT_ILLUSTRATIONS[label];
  return (
    <div className="relative group bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-none overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
      <div className="flex flex-col h-full relative z-10 text-right">
        <div className="w-14 h-14 mb-4 group-hover:rotate-6 transition-transform">
          {Illustration && <Illustration />}
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
        <p className="text-[9px] font-bold text-gray-400 mt-2">{description}</p>
      </div>
    </div>
  );
});

const StatusTimeline = memo(({ status }) => {
  if (status === 'CANCELLED') return null;
  const idx = LIFECYCLE_STATUSES.indexOf(status);
  return (
    <div className="flex items-center">
      {LIFECYCLE_STATUSES.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className={`w-3 h-3 rounded-full transition-colors ${i <= idx ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <span className={`text-[8px] font-black uppercase tracking-tight text-center leading-tight w-12 ${i <= idx ? 'text-emerald-600' : 'text-gray-400'}`}>
              {STATUS_TRANSLATIONS[s]}
            </span>
          </div>
          {i < LIFECYCLE_STATUSES.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${i < idx ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
});

const OrderRow = memo(({ order, onDetails, onCopy, onUpdateStatus }) => {
  const cs = getStatusStyle(order.status);
  const totalQty = (order.orderItems || []).reduce((sum, i) => sum + i.quantity, 0);
  const isPending = order.status === 'PENDING';
  return (
    <tr className="hover:bg-emerald-50/10 dark:hover:bg-emerald-900/5 transition-colors group">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
            <FiHash size={18} />
          </div>
          <div>
            <p className="text-xs font-mono text-gray-900 dark:text-white">#{String(order.id).slice(0, 8)}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{totalQty} منتجات</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <p className="text-xs font-black text-gray-900 dark:text-white">{order.firstName} {order.lastName}</p>
        <p dir='ltr' className="text-[10px] font-bold text-gray-400 tracking-tight">{order.phoneNumber || "بدون هاتف"}</p>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-black text-sm text-emerald-600">
         {formatPrice(order.totalPrice)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <p className="text-[10px] font-black text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <span
          onClick={() => { if (!isPending) onUpdateStatus(order); }}
          title={isPending ? 'يرجى قبول أو رفض الطلب أولاً' : ''}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${cs.bg} ${cs.text} ${isPending ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
        >
          
          {STATUS_TRANSLATIONS[order.status] || order.status}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-left">
        <div className="flex items-center justify-start gap-1.5">
          <button title="تفاصيل الطلب" onClick={() => onDetails(order)} className="flex items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-gray-950 font-bold dark:bg-gray-800 text-amber-500 hover:text-amber-500 text-[10px] gap-1 transition-all active:scale-95">
            <FiInfo size={13} /> تفاصيل
          </button>
          <button title='نسخ' onClick={() => onCopy(order.id)} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 transition-all active:scale-95">
            <FiCopy size={12} />
          </button>

          {isPending && (
            <div className="flex gap-1.5">
              <button title="قبول الطلب" onClick={() => onUpdateStatus(order, 'CONFIRMED')} className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 transition-all active:scale-95">
                <FiCheck size={13} />
              </button>
              <button title="رفض الطلب" onClick={() => onUpdateStatus(order, 'CANCELLED')} className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-all active:scale-95">
                <FiX size={13} />
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});




const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');


  useEffect(() => { document.title = 'إدارة الطلبات'; }, []);

  const showToast = (text, icon) =>
    Swal.fire({
      text, icon, toast: true, position: 'top-start',
      showConfirmButton: false, timer: 3000,
    });

  const fetchOrders = useCallback(async (status, search = '') => {
    setLoading(true);
    try {
      const endpoint = status === 'all'
        ? '/api/shops/orders/control'
        : `/api/shops/orders/control/status/${status}`;
      const res = await api.get(endpoint, { params: { query: search } });
      setOrders(Array.isArray(res.data) ? res.data : res.data.content || []);
    } catch {
      showToast('فشل تحميل الطلبات', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useMemo(() => debounce(fetchOrders, 300), [fetchOrders]);

  useEffect(() => {
    debouncedFetch(statusFilter, searchTerm);
    return () => debouncedFetch.cancel();
  }, [statusFilter, searchTerm, debouncedFetch]);

  useEffect(() => {
    if (!selectedOrder) return;
    const updated = orders.find(o => o.id === selectedOrder.id);
    if (updated) setSelectedOrder(updated);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return orders;
    return orders.filter(o =>
      String(o.id).toLowerCase().includes(term) ||
      `${o.firstName} ${o.lastName}`.toLowerCase().includes(term) ||
      String(o.phoneNumber).toLowerCase().includes(term) ||
      (o.orderItems || []).some(item => item.productName?.toLowerCase().includes(term))
    );
  }, [orders, searchTerm]);

  const paginated = useMemo(() => filteredOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filteredOrders, currentPage, rowsPerPage]);
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  }), [orders]);

  const updateOrderStatus = async (orderId, newStatus) => {
   
    
    const applyOptimistic = (id, status) => {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    };

    const previousOrders = [...orders];

    try {
      if (newStatus === 'CONFIRMED') {
        const { isConfirmed } = await Swal.fire({
          title: 'قبول الطلب؟', text: 'سيتم خصم الكميات من المخزون', icon: 'question',
          showCancelButton: true, confirmButtonText: 'قبول', cancelButtonText: 'إلغاء',
          confirmButtonColor: '#84cc16',
        });
        if (!isConfirmed) return;
        
        applyOptimistic(orderId, 'CONFIRMED');
        await api.post(`/api/shops/orders/control/${orderId}/accept`);
      } else if (newStatus === 'CANCELLED') {
        const { isConfirmed } = await Swal.fire({
          title: 'رفض الطلب؟', icon: 'warning',
          showCancelButton: true, confirmButtonText: 'رفض', cancelButtonText: 'إلغاء',
          confirmButtonColor: '#ef4444',
        });
        if (!isConfirmed) return;
        
        applyOptimistic(orderId, 'CANCELLED');
        await api.post(`/api/shops/orders/control/${orderId}/reject`);
      } else {
        applyOptimistic(orderId, newStatus);
        await api.put(`/api/shops/orders/control/${orderId}/status`, { status: newStatus });
      }
      showToast('تم تحديث الحالة بنجاح', 'success');
      
      
      fetchOrders(statusFilter, searchTerm);
    } catch {
      setOrders(previousOrders);
      showToast('فشل تحديث الحالة', 'error');
    }
  };

  const statCards = useMemo(() => [
    { icon: RiShoppingCartLine, label: 'إجمالي الطلبات', value: stats.total.toLocaleString('ar-EG'), color: "lime", description: "طلبات قيد المعالجة" },
    { icon: FiClock, label: 'طلبات معلقة', value: stats.pending.toLocaleString('ar-EG'), color: "blue", description: "بانتظار المراجعة" },
    { icon: FiCheckCircle, label: 'طلبات مؤكدة', value: stats.confirmed.toLocaleString('ar-EG'), color: "emerald", description: "في مرحلة التنفيذ" },
    { icon: FiTruck, label: 'تم التسليم', value: stats.delivered.toLocaleString('ar-EG'), color: "indigo", description: "عمليات مكتملة" },
  ], [stats]);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">



        <div className="flex flex-col md:flex-row md:items-end mt-3 justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">سجل المعاملات</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">إدارة <span className="text-emerald-500">الطلبات</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">تابع وحسن تجربة عملائك من خلال إدارة الطلبات الفعالة</p>
          </div>

          <button
            title="تصفية النتائج"
            onClick={() => setShowFilterPanel(true)}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gray-900 dark:bg-emerald-500 text-white dark:text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white transition-all shadow-xl shadow-gray-900/10 active:scale-95"
          >
            <FiFilter size={16} /> تصفية النتائج
          </button>
        </div>



        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="ابحث برقم الطلب، اسم العميل، أو المنتج..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 cursor-pointer rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-200 transition-all"
              />
            </div>
            <RowsDropdown value={rowsPerPage} onChange={(n) => { setRowsPerPage(n); setCurrentPage(1); }} options={ROWS_OPTIONS} />
          </div>
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900  dark:border-gray-700">
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الطلب</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">العميل</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">المجموع</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">التاريخ</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">الحالة</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  [...Array(rowsPerPage)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-8 py-6"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="mb-6">
                        <EmptyOrdersIllustration />
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">لا توجد طلبات</p>
                      <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">السجل فارغ أو لا يطابق شروط البحث</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(o => (
                    <OrderRow
                      key={o.id}
                      order={o}
                      onDetails={(order) => { setSelectedOrder(order); setShowDetailsModal(true); }}
                      onCopy={(id) => { navigator.clipboard.writeText(id); showToast('تم نسخ رقم الطلب', 'success'); }}
                      onUpdateStatus={(order, nextStatus) => {
                        if (nextStatus) {
                          updateOrderStatus(order.id, nextStatus);
                        } else {
                          setStatusModalOrder(order);
                          setShowStatusModal(true);
                        }
                      }}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>



          {totalPages > 1 && (
            <div className="p-4 bg-gray-100 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest order-2 sm:order-1">
                عرض <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> إلى <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, filteredOrders.length)}</span> من <span className="text-gray-900 dark:text-white">{filteredOrders.length}</span> طلب
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-white dark:bg-gray-800 text-gray-400 hover:text-emerald-500 disabled:opacity-30 transition-all">
                  <FiChevronRight size={20} />
                </button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-white dark:bg-gray-800 text-gray-400 hover:text-emerald-500 disabled:opacity-30 transition-all">
                  <FiChevronLeft size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>



      {showDetailsModal && selectedOrder && (() => {
        const cs = getStatusStyle(selectedOrder.status);
        const StatusIllustration = STATUS_ILLUSTRATION_MAP[selectedOrder.status] || CartIllustration;
        const isPending = selectedOrder.status === 'PENDING';
        const hasNext = (NEXT_STATUSES[selectedOrder.status] || []).length > 0;
        const totalQty = (selectedOrder.orderItems || []).reduce((s, i) => s + i.quantity, 0);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowDetailsModal(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="px-5 py-3.5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-gray-50/60 dark:bg-gray-900/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <RiShoppingCartLine size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">تفاصيل الطلب</h3>
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      #{String(selectedOrder.id).slice(0, 8)}
                      <button onClick={() => { navigator.clipboard.writeText(selectedOrder.id); showToast('تم نسخ رقم الطلب', 'success'); }} className="hover:text-emerald-500 transition-colors">
                        <FiCopy size={10} />
                      </button>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shadow-sm flex-shrink-0">
                  <FiX size={15} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar-thin">

                <div className={`rounded-xl p-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 ${cs.bg}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0">
                      <StatusIllustration />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-black ${cs.text}`}>{STATUS_TRANSLATIONS[selectedOrder.status]}</p>
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                        {timeAgo(selectedOrder.createdAt)} · {new Date(selectedOrder.createdAt).toLocaleString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  {selectedOrder.status !== 'CANCELLED' && (
                    <div className="mt-3.5">
                      <StatusTimeline status={selectedOrder.status} />
                    </div>
                  )}
                  {isPending && (
                    <div className="mt-3 flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-white/70 dark:bg-black/20">
                      <FiAlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={12} />
                      <p className="text-[10px] font-bold text-gray-600 dark:text-gray-300">بانتظار قرارك — لا يمكن تحديث الحالة قبل القبول أو الرفض.</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-emerald-500 border border-gray-100 dark:border-gray-700 flex-shrink-0">
                      <FiUser size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">العميل</p>
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate">{selectedOrder.firstName} {selectedOrder.lastName}</p>
                    </div>
                  </div>
                  <a href={selectedOrder.phoneNumber ? `tel:${selectedOrder.phoneNumber}` : undefined} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex items-center gap-2.5 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-emerald-500 border border-gray-100 dark:border-gray-700 flex-shrink-0">
                      <FiPhone size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">هاتف · اتصال</p>
                      <p dir="ltr" className="text-xs font-black text-gray-900 dark:text-white truncate">{selectedOrder.phoneNumber || "—"}</p>
                    </div>
                  </a>
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">المنتجات المطلوبة</p>
                    <span className="text-[9px] font-black text-emerald-600">{totalQty} قطعة</span>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {(selectedOrder.orderItems || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-700 flex-shrink-0">
                            <FiPackage size={13} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-gray-900 dark:text-white truncate">{item.productName}</p>
                            <p className="text-[9px] font-bold text-gray-400">
                              {item.quantity} × {formatPrice(item.priceAtCheckout)} 
                              {item.shopName ? ` · ${item.shopName}` : ''}
                            </p>
                          </div>
                        </div>
                        <p className="text-[11px] font-black text-emerald-600 font-mono flex-shrink-0">{formatPrice(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">طريقة الدفع</p>
                    <p className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                      {selectedOrder.paymentMethod === 'CASH'
                        ? <FiDollarSign className="text-emerald-500" size={12} />
                        : <FiCreditCard className="text-blue-500" size={12} />}
                      {selectedOrder.paymentMethod === 'CASH' ? 'نقدي عند الاستلام' : (selectedOrder.paymentMethod || '—')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-500/10 border border-gray-500/10">
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">الإجمالي النهائي</p>
                    <p className="text-base font-black text-emerald-600 tracking-tighter">{formatPrice(selectedOrder.totalPrice)}</p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-700 flex gap-2.5">
                {isPending ? (
                  <>
                    <button onClick={() => { updateOrderStatus(selectedOrder.id, 'CANCELLED'); setShowDetailsModal(false); }} className="flex-1 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/30 transition-all">
                      رفض الطلب
                    </button>
                    <button onClick={() => { updateOrderStatus(selectedOrder.id, 'CONFIRMED'); setShowDetailsModal(false); }} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                      قبول الطلب
                    </button>
                  </>
                ) : hasNext ? (
                  <button onClick={() => { setStatusModalOrder(selectedOrder); setShowStatusModal(true); }} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                    تحديث الحالة
                  </button>
                ) : (
                  <div className="flex-1 py-2.5 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">لا توجد إجراءات إضافية</div>
                )}
                <button onClick={() => setShowDetailsModal(false)} className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-red-500 transition-all">
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}



      {showFilterPanel && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowFilterPanel(false)} />
          <div className="relative w-full lg:max-w-md bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500">
            <div className="p-8 border-b border-gray-50 dark:border-gray-700">
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تصفية الطلبات</h3>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">اختر الحالة المطلوبة للعرض</p>
            </div>
            <div className="p-8 grid grid-cols-2 gap-4">
              {['all', ...STATUSES].map(s => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setShowFilterPanel(false); setCurrentPage(1); }}
                  className={`px-4 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-emerald-500 hover:text-emerald-600"
                    }`}
                >
                  {STATUS_TRANSLATIONS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}



      {showStatusModal && statusModalOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowStatusModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 dark:border-gray-700">
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تحديث حالة الطلب</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">#{statusModalOrder.id}</p>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">اختر المرحلة التالية</p>
              <div className="space-y-2">
                {(NEXT_STATUSES[statusModalOrder.status] || []).length > 0 ? (
                  (NEXT_STATUSES[statusModalOrder.status] || []).map(status => (
                    <button
                      key={status}
                      onClick={() => { updateOrderStatus(statusModalOrder.id, status); setShowStatusModal(false); }}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 text-xs font-black text-gray-700 dark:text-gray-200 hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-between group"
                    >
                      {STATUS_TRANSLATIONS[status]}
                      <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <NoNextStepIllustration />
                    <p className="text-xs font-bold text-gray-400">لا توجد مراحل تالية متاحة لهذا الطلب</p>
                  </div>
                )}
              </div>
            </div>
            <div className="px-8 pb-8">
              <button onClick={() => setShowStatusModal(false)} className="w-full py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">إلغاء</button>
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
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
};

export default memo(Orders);