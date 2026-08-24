import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo,
} from 'react';
import {
  FiChevronDown, FiSearch, FiInfo, FiChevronLeft, FiChevronRight, FiX,
  FiClock, FiTruck, FiCheckCircle, FiHash, FiCheck, FiFilter, FiCopy,
  FiUser, FiPhone, FiPackage, FiDollarSign, FiCreditCard, FiAlertCircle,
} from 'react-icons/fi';
import { RiShoppingCartLine } from 'react-icons/ri';
import api from '../api';
import debounce from 'lodash/debounce';

const ROWS_OPTIONS = [5, 10, 25, 50];

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

const PAYMENT_METHODS = [
  { value: 'all', label: 'جميع طرق الدفع' },
  { value: 'CASH', label: 'نقدي عند الاستلام' },
  { value: 'CARD', label: 'بطاقة إلكترونية' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث أولاً' },
  { value: 'oldest', label: 'الأقدم أولاً' },
  { value: 'highest', label: 'الأعلى سعراً' },
  { value: 'lowest', label: 'الأقل سعراً' },
];

const DATE_RANGES = [
  { value: 'all', label: 'كل الأوقات' },
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'آخر ٧ أيام' },
  { value: 'month', label: 'آخر ٣٠ يوم' },
];

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

let swalPromise = null;
const loadSwal = () => {
  if (!swalPromise) swalPromise = import('sweetalert2').then((m) => m.default);
  return swalPromise;
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
EmptyOrdersIllustration.displayName = 'EmptyOrdersIllustration';

const NoNextStepIllustration = memo(() => (
  <svg viewBox="0 0 100 80" className="w-20 h-16 mx-auto">
    <circle cx="50" cy="38" r="30" fill="rgba(16,185,129,0.08)" className="dark:fill-emerald-900/20" />
    <path d="M32 40 L44 52 L70 26" fill="none" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="80" cy="16" r="2.4" fill="#fbbf24" />
  </svg>
));
NoNextStepIllustration.displayName = 'NoNextStepIllustration';

const CartIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <defs>
      <linearGradient id="orders-grad-cart" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a3e635" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="27" fill="url(#orders-grad-cart)" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="url(#orders-grad-cart)" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <path d="M16 18 H22 L27 40 H46 L50 24 H24" fill="none" stroke="#10b981" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" className="dark:stroke-emerald-400" />
    <circle cx="29" cy="47" r="3.2" fill="#10b981" className="dark:fill-emerald-400" />
    <circle cx="44" cy="47" r="3.2" fill="#10b981" className="dark:fill-emerald-400" />
  </svg>
));
CartIllustration.displayName = 'CartIllustration';

const PendingClockIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#3b82f6" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <circle cx="32" cy="32" r="14" fill="none" stroke="#3b82f6" strokeWidth="2.6" />
    <path d="M32 24 V32 L38 36" fill="none" stroke="#3b82f6" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
PendingClockIllustration.displayName = 'PendingClockIllustration';

const ConfirmedCheckIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#10b981" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <circle cx="32" cy="32" r="14" fill="none" stroke="#10b981" strokeWidth="2.6" className="dark:stroke-emerald-400" />
    <path d="M26 32 L30.5 37 L39 26" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-emerald-400" />
  </svg>
));
ConfirmedCheckIllustration.displayName = 'ConfirmedCheckIllustration';

const DeliveredTruckIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#6366f1" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <rect x="11" y="25" width="26" height="15" rx="2.5" fill="none" stroke="#6366f1" strokeWidth="2.4" />
    <path d="M37 29 H46 L51 35 V40 H37 Z" fill="none" stroke="#6366f1" strokeWidth="2.4" strokeLinejoin="round" />
    <circle cx="21" cy="43" r="3.2" fill="#6366f1" />
    <circle cx="43" cy="43" r="3.2" fill="#6366f1" />
  </svg>
));
DeliveredTruckIllustration.displayName = 'DeliveredTruckIllustration';

const ProcessingGearIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#eab308" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <circle cx="32" cy="32" r="10" fill="none" stroke="#eab308" strokeWidth="2.6" />
    <path d="M32 13 v6 M32 45 v6 M13 32 h6 M45 32 h6 M19.5 19.5 l4.2 4.2 M40.3 40.3 l4.2 4.2 M44.5 19.5 l-4.2 4.2 M23.7 40.3 l-4.2 4.2" stroke="#eab308" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
));
ProcessingGearIllustration.displayName = 'ProcessingGearIllustration';

const FinishProcessingIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#f59e0b" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <rect x="17" y="17" width="30" height="30" rx="5" fill="none" stroke="#f59e0b" strokeWidth="2.6" />
    <path d="M23 32 L29.5 38.5 L41 24" fill="none" stroke="#f59e0b" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
FinishProcessingIllustration.displayName = 'FinishProcessingIllustration';

const DeliveredBoxIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#10b981" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <path d="M19 23 L32 17 L45 23 L45 41 L32 47 L19 41 Z" fill="none" stroke="#10b981" strokeWidth="2.3" strokeLinejoin="round" />
    <path d="M19 23 L32 29 L45 23" fill="none" stroke="#10b981" strokeWidth="2.3" strokeLinejoin="round" />
    <path d="M27 33 L31 37 L38.5 27" fill="none" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
DeliveredBoxIllustration.displayName = 'DeliveredBoxIllustration';

const CancelledIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#ef4444" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <circle cx="32" cy="32" r="14" fill="none" stroke="#ef4444" strokeWidth="2.6" />
    <path d="M25.5 25.5 L38.5 38.5 M38.5 25.5 L25.5 38.5" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
));
CancelledIllustration.displayName = 'CancelledIllustration';

const STATUS_ILLUSTRATION_MAP = {
  PENDING: PendingClockIllustration,
  CONFIRMED: ConfirmedCheckIllustration,
  PROCESSING: ProcessingGearIllustration,
  FINISHPROCESSING: FinishProcessingIllustration,
  SHIPPED: DeliveredTruckIllustration,
  DELIVERED: DeliveredBoxIllustration,
  CANCELLED: CancelledIllustration,
};

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
StatusTimeline.displayName = 'StatusTimeline';

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
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-3 min-w-[168px] px-5 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 cursor-pointer transition-all"
      >
        {value} طلبات لكل صفحة
        <FiChevronDown className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} size={14} />
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
          {options.map((n) => (
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
RowsDropdown.displayName = 'RowsDropdown';

const STAT_ILLUSTRATIONS = {
  'إجمالي الطلبات': CartIllustration,
  'طلبات معلقة': PendingClockIllustration,
  'طلبات مؤكدة': ConfirmedCheckIllustration,
  'تم التسليم': DeliveredTruckIllustration,
};

const StatCard = memo(({ label, value, description }) => {
  const Illustration = STAT_ILLUSTRATIONS[label];
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none">
      <div className="w-11 h-11 flex-shrink-0 group-hover:scale-105 transition-transform">
        {Illustration && <Illustration />}
      </div>
      <div className="min-w-0 text-right">
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 truncate">{label}</p>
        <p className="text-xl font-black text-gray-900 dark:text-white leading-tight">{value}</p>
        <p className="text-[9px] font-bold text-gray-400 truncate">{description}</p>
      </div>
    </div>
  );
});
StatCard.displayName = 'StatCard';

const LEGEND_ITEMS = [
  { icon: FiInfo, tone: 'text-amber-500 border-amber-200 dark:border-amber-900/50', label: 'تفاصيل', desc: 'عرض كامل بيانات الطلب والمنتجات' },
  { icon: FiCopy, tone: 'text-gray-400 border-gray-200 dark:border-gray-700', label: 'نسخ', desc: 'نسخ رقم الطلب إلى الحافظة' },
  { icon: FiCheck, tone: 'text-emerald-600 border-emerald-200 dark:border-emerald-900/50', label: 'قبول', desc: 'قبول طلب معلق وخصم الكمية من المخزون' },
  { icon: FiX, tone: 'text-red-600 border-red-200 dark:border-red-900/50', label: 'رفض', desc: 'رفض طلب معلق وإلغاؤه نهائياً' },
];

const IconLegendCard = memo(() => (
  <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-5">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400">
        <FiAlertCircle size={13} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">دليل الأيقونات</p>
    </div>
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      {LEGEND_ITEMS.map(({ icon: Icon, tone, label, desc }) => (
        <div key={label} className="flex items-start gap-3 min-w-[200px] flex-1">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${tone}`}>
            <Icon size={13} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black text-gray-900 dark:text-white">{label}</p>
            <p className="text-[10px] font-bold text-gray-400 leading-relaxed mt-0.5">{desc}</p>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex items-start gap-1.5">
      <FiAlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={12} />
      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
        طلب "تم التسليم" مغلق نهائياً ولا يمكن تعديل حالته بعد ذلك.
      </p>
    </div>
  </div>
));
IconLegendCard.displayName = 'IconLegendCard';

const OrderRow = memo(({ order, onDetails, onCopy, onAccept, onReject, onOpenStatusModal }) => {
  const cs = getStatusStyle(order.status);
  const totalQty = (order.orderItems || []).reduce((sum, i) => sum + i.quantity, 0);
  const isPending = order.status === 'PENDING';
  const isDelivered = order.status === 'DELIVERED';
  const canChangeStatus = !isPending && !isDelivered;

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
        <p dir="ltr" className="text-[10px] font-bold text-gray-400 tracking-tight">{order.phoneNumber || 'بدون هاتف'}</p>
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
          onClick={() => { if (canChangeStatus) onOpenStatusModal(order); }}
          title={isPending ? 'يرجى قبول أو رفض الطلب أولاً' : isDelivered ? 'تم تسليم الطلب — لا يمكن تعديل الحالة' : ''}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${cs.bg} ${cs.text} ${canChangeStatus ? 'cursor-pointer' : 'cursor-not-allowed opacity-90'}`}
        >
          {STATUS_TRANSLATIONS[order.status] || order.status}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-left">
        <div className="flex items-center justify-start gap-1.5">
          <button title="تفاصيل الطلب" onClick={() => onDetails(order)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all active:scale-95">
            <FiInfo size={14} />
          </button>
          <button title="نسخ رقم الطلب" onClick={() => onCopy(order.id)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-lime-500 hover:border-lime-300 transition-all active:scale-95">
            <FiCopy size={14} />
          </button>
          {isPending && (
            <>
              <button title="قبول الطلب" onClick={() => onAccept(order)} className="p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all active:scale-95">
                <FiCheck size={14} />
              </button>
              <button title="رفض الطلب" onClick={() => onReject(order)} className="p-2 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95">
                <FiX size={14} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});
OrderRow.displayName = 'OrderRow';

const OrderDetailsModal = memo(({ order, onClose, onCopy, onAccept, onReject, onOpenStatusModal }) => {
  const cs = getStatusStyle(order.status);
  const StatusIllustration = STATUS_ILLUSTRATION_MAP[order.status] || CartIllustration;
  const isPending = order.status === 'PENDING';
  const isDelivered = order.status === 'DELIVERED';
  const hasNext = (NEXT_STATUSES[order.status] || []).length > 0;
  const totalQty = (order.orderItems || []).reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="px-5 py-3.5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-gray-50/60 dark:bg-gray-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <RiShoppingCartLine size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white">تفاصيل الطلب</h3>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                #{String(order.id).slice(0, 8)}
                <button onClick={() => onCopy(order.id)} className="hover:text-emerald-500 transition-colors">
                  <FiCopy size={10} />
                </button>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-all flex-shrink-0">
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
                <p className={`text-sm font-black ${cs.text}`}>{STATUS_TRANSLATIONS[order.status]}</p>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                  {timeAgo(order.createdAt)} · {new Date(order.createdAt).toLocaleString('ar-EG')}
                </p>
              </div>
            </div>
            {order.status !== 'CANCELLED' && (
              <div className="mt-3.5">
                <StatusTimeline status={order.status} />
              </div>
            )}
            {isPending && (
              <div className="mt-3 flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-white/70 dark:bg-black/20">
                <FiAlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={12} />
                <p className="text-[10px] font-bold text-gray-600 dark:text-gray-300">بانتظار قرارك — لا يمكن تحديث الحالة قبل القبول أو الرفض.</p>
              </div>
            )}
            {isDelivered && (
              <div className="mt-3 flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-white/70 dark:bg-black/20">
                <FiAlertCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={12} />
                <p className="text-[10px] font-bold text-gray-600 dark:text-gray-300">تم تسليم الطلب بنجاح — لا يمكن تعديل الحالة بعد الآن.</p>
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
                <p className="text-xs font-black text-gray-900 dark:text-white truncate">{order.firstName} {order.lastName}</p>
              </div>
            </div>
            <a href={order.phoneNumber ? `tel:${order.phoneNumber}` : undefined} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex items-center gap-2.5 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-emerald-500 border border-gray-100 dark:border-gray-700 flex-shrink-0">
                <FiPhone size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">هاتف · اتصال</p>
                <p dir="ltr" className="text-xs font-black text-gray-900 dark:text-white truncate">{order.phoneNumber || '—'}</p>
              </div>
            </a>
          </div>

          <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">المنتجات المطلوبة</p>
              <span className="text-[9px] font-black text-emerald-600">{totalQty} قطعة</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {(order.orderItems || []).map((item, idx) => (
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
                {order.paymentMethod === 'CASH'
                  ? <FiDollarSign className="text-emerald-500" size={12} />
                  : <FiCreditCard className="text-blue-500" size={12} />}
                {order.paymentMethod === 'CASH' ? 'نقدي عند الاستلام' : (order.paymentMethod || '—')}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-500/10 border border-gray-500/10">
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">الإجمالي النهائي</p>
              <p className="text-base font-black text-emerald-600 tracking-tighter">{formatPrice(order.totalPrice)}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-700 flex gap-2.5">
          {isPending ? (
            <>
              <button onClick={onReject} className="flex-1 py-2.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                رفض الطلب
              </button>
              <button onClick={onAccept} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                قبول الطلب
              </button>
            </>
          ) : hasNext ? (
            <button onClick={onOpenStatusModal} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
              تحديث الحالة
            </button>
          ) : (
            <div className="flex-1 py-2.5 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">لا توجد إجراءات إضافية</div>
          )}
          <button onClick={onClose} className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-red-500 transition-all">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
});
OrderDetailsModal.displayName = 'OrderDetailsModal';

const FilterPanel = memo(({
  statusFilter, onStatusChange, sortBy, onSortChange,
  paymentFilter, onPaymentChange, dateRange, onDateRangeChange, onClose,
}) => (
  <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
    <div className="relative w-full lg:max-w-md bg-white dark:bg-gray-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500 max-h-[90vh] flex flex-col">
      <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تصفية الطلبات</h3>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">خصص طريقة عرض طلباتك</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-all">
          <FiX size={16} />
        </button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar-thin">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">حالة الطلب</p>
          <div className="grid grid-cols-2 gap-3">
            {['all', ...STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`px-4 py-3.5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  statusFilter === s
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-emerald-500 hover:text-emerald-600'
                }`}
              >
                {STATUS_TRANSLATIONS[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">الترتيب حسب</p>
          <div className="grid grid-cols-2 gap-3">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => onSortChange(o.value)}
                className={`px-4 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  sortBy === o.value
                    ? 'bg-gray-900 dark:bg-emerald-500 border-gray-900 dark:border-emerald-500 text-white'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-gray-400'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">طريقة الدفع</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((o) => (
              <button
                key={o.value}
                onClick={() => onPaymentChange(o.value)}
                className={`px-4 py-2.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  paymentFilter === o.value
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-emerald-500 hover:text-emerald-600'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">النطاق الزمني</p>
          <div className="flex flex-wrap gap-2">
            {DATE_RANGES.map((o) => (
              <button
                key={o.value}
                onClick={() => onDateRangeChange(o.value)}
                className={`px-4 py-2.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  dateRange === o.value
                    ? 'bg-gray-900 dark:bg-emerald-500 border-gray-900 dark:border-emerald-500 text-white'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-gray-400'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-50 dark:border-gray-700 flex-shrink-0">
        <button onClick={onClose} className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
          تطبيق الفلاتر
        </button>
      </div>
    </div>
  </div>
));
FilterPanel.displayName = 'FilterPanel';

const StatusUpdateModal = memo(({ order, onClose, onSelectStatus }) => {
  const nextOptions = NEXT_STATUSES[order.status] || [];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-gray-50 dark:border-gray-700">
          <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تحديث حالة الطلب</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">#{order.id}</p>
        </div>
        <div className="p-8 space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">اختر المرحلة التالية</p>
          <div className="space-y-2">
            {nextOptions.length > 0 ? (
              nextOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => onSelectStatus(status)}
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
          <button onClick={onClose} className="w-full py-4 border border-gray-200 dark:border-gray-700 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 hover:border-red-300 transition-all">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
});
StatusUpdateModal.displayName = 'StatusUpdateModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalOrder, setStatusModalOrder] = useState(null);

  const ordersRef = useRef(orders);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  useEffect(() => { document.title = 'إدارة الطلبات'; }, []);

  const showToast = useCallback(async (text, icon) => {
    const Swal = await loadSwal();
    Swal.fire({
      text, icon, toast: true, position: 'top-start',
      showConfirmButton: false, timer: 3000,
    });
  }, []);

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
  }, [showToast]);

  const debouncedFetch = useMemo(() => debounce(fetchOrders, 300), [fetchOrders]);

  useEffect(() => {
    debouncedFetch(statusFilter, searchTerm);
    return () => debouncedFetch.cancel();
  }, [statusFilter, searchTerm, debouncedFetch]);

  useEffect(() => {
    setSelectedOrder((prev) => {
      if (!prev) return prev;
      return orders.find((o) => o.id === prev.id) || prev;
    });
  }, [orders]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    const applyOptimistic = (id, status) => {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    };
    const previousOrders = ordersRef.current;
    const Swal = await loadSwal();

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
  }, [statusFilter, searchTerm, fetchOrders, showToast]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let list = orders;

    if (term) {
      list = list.filter((o) =>
        String(o.id).toLowerCase().includes(term) ||
        `${o.firstName} ${o.lastName}`.toLowerCase().includes(term) ||
        String(o.phoneNumber).toLowerCase().includes(term) ||
        (o.orderItems || []).some((item) => item.productName?.toLowerCase().includes(term)));
    }

    if (paymentFilter !== 'all') {
      list = list.filter((o) => o.paymentMethod === paymentFilter);
    }

    if (dateRange !== 'all') {
      const now = Date.now();
      const spanMs = dateRange === 'today' ? 864e5 : dateRange === 'week' ? 6048e5 : 2592e6;
      list = list.filter((o) => now - new Date(o.createdAt).getTime() <= spanMs);
    }

    const sorted = [...list];
    if (sortBy === 'oldest') sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === 'highest') sorted.sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0));
    else if (sortBy === 'lowest') sorted.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
    else sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return sorted;
  }, [orders, searchTerm, paymentFilter, dateRange, sortBy]);

  const paginated = useMemo(
    () => filteredOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [filteredOrders, currentPage, rowsPerPage],
  );
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    confirmed: orders.filter((o) => o.status === 'CONFIRMED').length,
    delivered: orders.filter((o) => o.status === 'DELIVERED').length,
  }), [orders]);

  const statCards = useMemo(() => [
    { label: 'إجمالي الطلبات', value: stats.total.toLocaleString('ar-EG'), description: 'طلبات قيد المعالجة' },
    { label: 'طلبات معلقة', value: stats.pending.toLocaleString('ar-EG'), description: 'بانتظار المراجعة' },
    { label: 'طلبات مؤكدة', value: stats.confirmed.toLocaleString('ar-EG'), description: 'في مرحلة التنفيذ' },
    { label: 'تم التسليم', value: stats.delivered.toLocaleString('ar-EG'), description: 'عمليات مكتملة' },
  ], [stats]);

  const handleDetails = useCallback((order) => { setSelectedOrder(order); setShowDetailsModal(true); }, []);
  const handleCopy = useCallback((id) => {
    navigator.clipboard.writeText(id);
    showToast('تم نسخ رقم الطلب', 'success');
  }, [showToast]);
  const handleAccept = useCallback((order) => updateOrderStatus(order.id, 'CONFIRMED'), [updateOrderStatus]);
  const handleReject = useCallback((order) => updateOrderStatus(order.id, 'CANCELLED'), [updateOrderStatus]);
  const handleOpenStatusModal = useCallback((order) => { setStatusModalOrder(order); setShowStatusModal(true); }, []);

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (paymentFilter !== 'all' ? 1 : 0) + (dateRange !== 'all' ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
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
            className="relative flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gray-900 dark:bg-emerald-500 text-white dark:text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white transition-all shadow-xl shadow-gray-900/10 active:scale-95"
          >
            <FiFilter size={16} /> تصفية النتائج
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="ابحث برقم الطلب، اسم العميل، أو المنتج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 cursor-pointer rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-200 transition-all"
              />
            </div>
            <RowsDropdown value={rowsPerPage} onChange={(n) => { setRowsPerPage(n); setCurrentPage(1); }} options={ROWS_OPTIONS} />
          </div>
        </div>

        <IconLegendCard />

        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar-thin">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-900 dark:border-gray-700">
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">الطلب</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">العميل</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">المجموع</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">التاريخ</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">الحالة</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">إجراءات</th>
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
                    paginated.map((o) => (
                      <OrderRow
                        key={o.id}
                        order={o}
                        onDetails={handleDetails}
                        onCopy={handleCopy}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        onOpenStatusModal={handleOpenStatusModal}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest order-2 sm:order-1">
                  عرض <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> إلى <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, filteredOrders.length)}</span> من <span className="text-gray-900 dark:text-white">{filteredOrders.length}</span> طلب
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-emerald-500 hover:border-emerald-300 disabled:opacity-30 transition-all">
                    <FiChevronRight size={20} />
                  </button>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-emerald-500 hover:border-emerald-300 disabled:opacity-30 transition-all">
                    <FiChevronLeft size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

      
        </div>
      </div>

      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setShowDetailsModal(false)}
          onCopy={handleCopy}
          onAccept={() => { updateOrderStatus(selectedOrder.id, 'CONFIRMED'); setShowDetailsModal(false); }}
          onReject={() => { updateOrderStatus(selectedOrder.id, 'CANCELLED'); setShowDetailsModal(false); }}
          onOpenStatusModal={() => { setStatusModalOrder(selectedOrder); setShowStatusModal(true); }}
        />
      )}

      {showFilterPanel && (
        <FilterPanel
          statusFilter={statusFilter}
          onStatusChange={(s) => { setStatusFilter(s); setCurrentPage(1); }}
          sortBy={sortBy}
          onSortChange={setSortBy}
          paymentFilter={paymentFilter}
          onPaymentChange={setPaymentFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onClose={() => setShowFilterPanel(false)}
        />
      )}

      {showStatusModal && statusModalOrder && (
        <StatusUpdateModal
          order={statusModalOrder}
          onClose={() => setShowStatusModal(false)}
          onSelectStatus={(status) => { updateOrderStatus(statusModalOrder.id, status); setShowStatusModal(false); }}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `,
      }}
      />
    </div>
  );
};

export default memo(Orders);