import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo,
} from 'react';
import {
  FiChevronDown, FiSearch, FiInfo, FiChevronLeft, FiChevronRight, FiX,
  FiHash, FiCheck, FiFilter, FiCopy, FiTool, FiPackage, FiCreditCard,
  FiDollarSign, FiMapPin, FiAlertCircle, FiHome, FiTruck,
} from 'react-icons/fi';
import { RiStore2Line } from 'react-icons/ri';
import api from '../api';
import debounce from 'lodash/debounce';

const ROWS_OPTIONS = [5, 10, 25, 50];

const STATUS_TRANSLATIONS = {
  SUBMITTED: 'تم التقديم',
  QUOTE_SENT: 'تم إرسال العرض',
  QUOTE_APPROVED: 'موافقة على العرض',
  QUOTE_REJECTED: 'رفض العرض',
  DEVICE_COLLECTED: 'تم استلام الجهاز',
  REPAIRING: 'تحت الإصلاح',
  REPAIR_COMPLETED: 'تم الإصلاح',
  DEVICE_DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغاة',
  FAILED: 'فشلت',
  all: 'جميع الحالات',
};

const STATUSES = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'QUOTE_REJECTED', 'DEVICE_COLLECTED', 'REPAIRING', 'REPAIR_COMPLETED', 'DEVICE_DELIVERED', 'CANCELLED', 'FAILED'];
const LIFECYCLE_STATUSES = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'DEVICE_COLLECTED', 'REPAIRING', 'REPAIR_COMPLETED', 'DEVICE_DELIVERED'];
const TERMINAL_NEGATIVE = ['CANCELLED', 'FAILED', 'QUOTE_REJECTED'];

const NEXT_STATUSES = {
  SUBMITTED: ['CANCELLED'],
  QUOTE_SENT: ['QUOTE_APPROVED', 'QUOTE_REJECTED'],
  QUOTE_APPROVED: ['DEVICE_COLLECTED'],
  QUOTE_REJECTED: ['CANCELLED'],
  DEVICE_COLLECTED: ['REPAIRING'],
  REPAIRING: ['REPAIR_COMPLETED'],
  REPAIR_COMPLETED: [],
  DEVICE_DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
};

const DELIVERY_METHODS = [
  { value: 'all', label: 'جميع طرق الاستلام' },
  { value: 'SHOP_VISIT', label: 'زيارة المتجر' },
  { value: 'HOME_DELIVERY', label: 'استلام من المنزل' },
  { value: 'COURIER', label: 'توصيل عبر مندوب' },
];

const PAYMENT_METHODS = [
  { value: 'all', label: 'جميع طرق الدفع' },
  { value: 'CASH', label: 'نقداً' },
  { value: 'CARD', label: 'بطاقة ائتمان' },
  { value: 'ONLINE', label: 'دفع إلكتروني' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث أولاً' },
  { value: 'oldest', label: 'الأقدم أولاً' },
  { value: 'highest', label: 'الأعلى سعراً' },
  { value: 'lowest', label: 'الأقل سعراً' },
];

const STATUS_STYLE = {
  SUBMITTED: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', dot: 'bg-blue-500' },
  QUOTE_SENT: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600', dot: 'bg-teal-500' },
  QUOTE_APPROVED: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  QUOTE_REJECTED: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', dot: 'bg-amber-500' },
  DEVICE_COLLECTED: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600', dot: 'bg-purple-500' },
  REPAIRING: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', dot: 'bg-orange-500' },
  REPAIR_COMPLETED: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600', dot: 'bg-green-500' },
  DEVICE_DELIVERED: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700', dot: 'bg-emerald-600' },
  CANCELLED: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', dot: 'bg-red-500' },
  FAILED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700', dot: 'bg-red-600' },
};

const getStatusStyle = (s) => STATUS_STYLE[s] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
const formatPrice = (p) => (p || p === 0) ? `EGP ${Number(p).toLocaleString('en-US')}` : null;

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

const DELIVERY_META = {
  SHOP_VISIT: { label: 'زيارة المتجر', icon: RiStore2Line },
  HOME_DELIVERY: { label: 'استلام من المنزل', icon: FiHome },
  COURIER: { label: 'توصيل عبر مندوب', icon: FiTruck },
};
const getDeliveryMeta = (v) => DELIVERY_META[(v || '').toUpperCase()] || { label: v || '—', icon: FiMapPin };

const PAYMENT_META = {
  CASH: { label: 'نقداً', icon: FiDollarSign },
  CARD: { label: 'بطاقة ائتمان', icon: FiCreditCard },
  ONLINE: { label: 'دفع إلكتروني', icon: FiCreditCard },
};
const getPaymentMeta = (v) => PAYMENT_META[(v || '').toUpperCase()] || { label: v || '—', icon: FiDollarSign };

let swalPromise = null;
const loadSwal = () => {
  if (!swalPromise) swalPromise = import('sweetalert2').then((m) => m.default);
  return swalPromise;
};

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
EmptyRepairsIllustration.displayName = 'EmptyRepairsIllustration';

const NoNextStepIllustration = memo(() => (
  <svg viewBox="0 0 100 80" className="w-20 h-16 mx-auto">
    <circle cx="50" cy="38" r="30" fill="rgba(16,185,129,0.08)" className="dark:fill-emerald-900/20" />
    <path d="M32 40 L44 52 L70 26" fill="none" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="80" cy="16" r="2.4" fill="#fbbf24" />
  </svg>
));
NoNextStepIllustration.displayName = 'NoNextStepIllustration';

const PackageIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#3b82f6" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <path d="M16 22 L32 14 L48 22 L48 42 L32 50 L16 42 Z" fill="none" stroke="#3b82f6" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M16 22 L32 30 L48 22" fill="none" stroke="#3b82f6" strokeWidth="2.4" strokeLinejoin="round" />
  </svg>
));
PackageIllustration.displayName = 'PackageIllustration';

const ClockIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#f97316" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <circle cx="32" cy="32" r="14" fill="none" stroke="#f97316" strokeWidth="2.6" />
    <path d="M32 24 V32 L38 36" fill="none" stroke="#f97316" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
ClockIllustration.displayName = 'ClockIllustration';

const WrenchIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#6366f1" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <rect x="19" y="27" width="26" height="7" rx="3.5" fill="none" stroke="#6366f1" strokeWidth="2.4" transform="rotate(-32 32 30.5)" />
    <circle cx="22" cy="19" r="7.5" fill="none" stroke="#6366f1" strokeWidth="2.4" strokeDasharray="22 100" strokeLinecap="round" transform="rotate(140 22 19)" />
  </svg>
));
WrenchIllustration.displayName = 'WrenchIllustration';

const CheckCircleIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#10b981" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <circle cx="32" cy="32" r="14" fill="none" stroke="#10b981" strokeWidth="2.6" className="dark:stroke-emerald-400" />
    <path d="M26 32 L30.5 37 L39 26" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-emerald-400" />
  </svg>
));
CheckCircleIllustration.displayName = 'CheckCircleIllustration';

const TruckIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#10b981" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <rect x="11" y="25" width="26" height="15" rx="2.5" fill="none" stroke="#10b981" strokeWidth="2.4" />
    <path d="M37 29 H46 L51 35 V40 H37 Z" fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinejoin="round" />
    <circle cx="21" cy="43" r="3.2" fill="#10b981" />
    <circle cx="43" cy="43" r="3.2" fill="#10b981" />
  </svg>
));
TruckIllustration.displayName = 'TruckIllustration';

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
  SUBMITTED: ClockIllustration,
  QUOTE_SENT: PackageIllustration,
  QUOTE_APPROVED: CheckCircleIllustration,
  QUOTE_REJECTED: CancelledIllustration,
  DEVICE_COLLECTED: PackageIllustration,
  REPAIRING: WrenchIllustration,
  REPAIR_COMPLETED: CheckCircleIllustration,
  DEVICE_DELIVERED: TruckIllustration,
  CANCELLED: CancelledIllustration,
  FAILED: CancelledIllustration,
};

const RepairTimeline = memo(({ status }) => {
  const upper = (status || '').toUpperCase();
  if (TERMINAL_NEGATIVE.includes(upper) || upper === 'FAILED') {
    const cs = getStatusStyle(upper);
    return (
      <div className={`flex items-center gap-3 p-3.5 rounded-xl ${cs.bg}`}>
        <FiX className={cs.text} size={20} />
        <div>
          <p className={`text-sm font-black ${cs.text}`}>{STATUS_TRANSLATIONS[upper]}</p>
          <p className="text-[10px] font-bold text-gray-400 mt-0.5">تم إيقاف مسار هذا الطلب عند هذه المرحلة</p>
        </div>
      </div>
    );
  }
  const idx = LIFECYCLE_STATUSES.indexOf(upper);
  return (
    <div className="overflow-x-auto custom-scrollbar-thin pb-1">
      <div className="flex items-center min-w-[560px] px-1">
        {LIFECYCLE_STATUSES.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[76px]">
              <div className={`w-3 h-3 rounded-full transition-colors ${i <= idx ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <span className={`text-[8px] font-black uppercase tracking-tight text-center leading-tight ${i <= idx ? 'text-emerald-600' : 'text-gray-400'}`}>
                {STATUS_TRANSLATIONS[s]}
              </span>
            </div>
            {i < LIFECYCLE_STATUSES.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors ${i < idx ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});
RepairTimeline.displayName = 'RepairTimeline';

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
  'إجمالي الطلبات': PackageIllustration,
  'بانتظار عرض سعر': ClockIllustration,
  'قيد الإصلاح': WrenchIllustration,
  'تم الانتهاء': CheckCircleIllustration,
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
  { icon: FiInfo, tone: 'text-amber-500 border-amber-200 dark:border-amber-900/50', label: 'تفاصيل', desc: 'عرض كامل بيانات طلب التصليح' },
  { icon: FiCopy, tone: 'text-gray-400 border-gray-200 dark:border-gray-700', label: 'نسخ', desc: 'نسخ رقم الطلب إلى الحافظة' },
  { icon: FiDollarSign, tone: 'text-emerald-600 border-emerald-200 dark:border-emerald-900/50', label: 'تسعير', desc: 'تحديد أو تعديل سعر عرض الإصلاح' },
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
        اضغط على شارة الحالة داخل الجدول لتحديث مرحلة الطلب إلى المرحلة التالية.
      </p>
    </div>
  </div>
));
IconLegendCard.displayName = 'IconLegendCard';

const RepairRow = memo(({ repair, onDetails, onCopy, onPrice, onOpenStatusModal }) => {
  const upper = (repair.status || '').toUpperCase();
  const cs = getStatusStyle(upper);
  const hasNext = (NEXT_STATUSES[upper] || []).length > 0;
  const canEditPrice = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_REJECTED'].includes(upper);
  const deliveryMeta = getDeliveryMeta(repair.deliveryMethod);
  const DeliveryIcon = deliveryMeta.icon;
  const formattedPrice = formatPrice(repair.price);

  return (
    <tr className="hover:bg-emerald-50/10 dark:hover:bg-emerald-900/5 transition-colors group">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
            <FiHash size={18} />
          </div>
          <div>
            <p className="text-xs font-mono text-gray-900 dark:text-white">#{String(repair.id).slice(0, 8)}</p>
            <p className="text-[10px] font-bold text-gray-400 truncate max-w-[140px] mt-0.5">{repair.description || 'بدون وصف'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <p className="text-xs font-black text-gray-900 dark:text-white">{repair.shopName || '—'}</p>
        <p className="text-[10px] font-bold text-gray-400 inline-flex items-center gap-1 justify-center mt-0.5">
          <DeliveryIcon size={11} className="text-emerald-500" /> {deliveryMeta.label}
        </p>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-black text-sm text-emerald-600">
        {formattedPrice || <span className="text-red-500 font-sans text-[10px] font-black uppercase tracking-widest">لم يتم التسعير</span>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <span
          onClick={() => { if (hasNext) onOpenStatusModal(repair); }}
          title={hasNext ? 'اضغط لتحديث حالة الطلب' : 'لا توجد مراحل تالية متاحة'}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${cs.bg} ${cs.text} ${hasNext ? 'cursor-pointer' : 'cursor-not-allowed opacity-90'}`}
        >
          {STATUS_TRANSLATIONS[upper] || repair.status}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-left">
        <div className="flex items-center justify-start gap-1.5">
          <button title="تفاصيل الطلب" onClick={() => onDetails(repair)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all active:scale-95">
            <FiInfo size={14} />
          </button>
          <button title="نسخ رقم الطلب" onClick={() => onCopy(repair.id)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-lime-500 hover:border-lime-300 transition-all active:scale-95">
            <FiCopy size={14} />
          </button>
          {canEditPrice && (
            <button title="تحديد أو تعديل سعر الإصلاح" onClick={() => onPrice(repair)} className="p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all active:scale-95">
              <FiDollarSign size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});
RepairRow.displayName = 'RepairRow';

const RepairDetailsModal = memo(({ repair, onClose, onCopy, onPrice, onOpenStatusModal }) => {
  const upper = (repair.status || '').toUpperCase();
  const cs = getStatusStyle(upper);
  const StatusIllustration = STATUS_ILLUSTRATION_MAP[upper] || PackageIllustration;
  const hasNext = (NEXT_STATUSES[upper] || []).length > 0;
  const canEditPrice = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_REJECTED'].includes(upper);
  const deliveryMeta = getDeliveryMeta(repair.deliveryMethod);
  const paymentMeta = getPaymentMeta(repair.paymentMethod);
  const DeliveryIcon = deliveryMeta.icon;
  const PaymentIcon = paymentMeta.icon;
  const formattedPrice = formatPrice(repair.price);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="px-5 py-3.5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-gray-50/60 dark:bg-gray-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <FiTool size={17} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white">تفاصيل طلب التصليح</h3>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                #{String(repair.id).slice(0, 8)}
                <button onClick={() => onCopy(repair.id)} className="hover:text-emerald-500 transition-colors">
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
                <p className={`text-sm font-black ${cs.text}`}>{STATUS_TRANSLATIONS[upper]}</p>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">
                  {timeAgo(repair.createdAt)} {repair.createdAt ? `· ${new Date(repair.createdAt).toLocaleString('ar-EG')}` : ''}
                </p>
              </div>
            </div>
            <div className="mt-3.5">
              <RepairTimeline status={upper} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3.5 bg-gray-50 dark:bg-gray-900/50 flex items-start gap-2.5">
            <FiTool className="text-gray-400 mt-0.5 flex-shrink-0" size={14} />
            <div className="min-w-0">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">وصف العطل</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 leading-relaxed">{repair.description || 'لا يوجد وصف مفصل للعطل'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-emerald-500 border border-gray-100 dark:border-gray-700 flex-shrink-0">
                <RiStore2Line size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">المتجر</p>
                <p className="text-xs font-black text-gray-900 dark:text-white truncate">{repair.shopName || '—'}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-emerald-500 border border-gray-100 dark:border-gray-700 flex-shrink-0">
                <DeliveryIcon size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">طريقة الاستلام</p>
                <p className="text-xs font-black text-gray-900 dark:text-white truncate">{deliveryMeta.label}</p>
              </div>
            </div>
          </div>

          {repair.deliveryAddressDetails && (
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3.5 bg-gray-50 dark:bg-gray-900/50 flex items-start gap-2.5">
              <FiMapPin className="text-emerald-500 mt-0.5 flex-shrink-0" size={14} />
              <div className="min-w-0">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">عنوان التسليم</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 leading-relaxed">{repair.deliveryAddressDetails}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">طريقة الدفع</p>
              <p className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <PaymentIcon className="text-blue-500" size={12} />
                {paymentMeta.label}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-500/10 border border-gray-500/10">
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">المبلغ المطلوب</p>
              <p className="text-base font-black text-emerald-600 tracking-tighter">{formattedPrice || '—'}</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-700 flex gap-2.5">
          {canEditPrice ? (
            <button onClick={onPrice} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
              تحديد السعر
            </button>
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
RepairDetailsModal.displayName = 'RepairDetailsModal';

const FilterPanel = memo(({
  statusFilter, onStatusChange, sortBy, onSortChange,
  deliveryFilter, onDeliveryChange, paymentFilter, onPaymentChange, onClose,
}) => (
  <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
    <div className="relative w-full lg:max-w-md bg-white dark:bg-gray-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500 max-h-[90vh] flex flex-col">
      <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تصفية طلبات التصليح</h3>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">خصص طريقة عرض الطلبات</p>
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
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">طريقة الاستلام</p>
          <div className="flex flex-wrap gap-2">
            {DELIVERY_METHODS.map((o) => (
              <button
                key={o.value}
                onClick={() => onDeliveryChange(o.value)}
                className={`px-4 py-2.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  deliveryFilter === o.value
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
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">طريقة الدفع</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((o) => (
              <button
                key={o.value}
                onClick={() => onPaymentChange(o.value)}
                className={`px-4 py-2.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  paymentFilter === o.value
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

const StatusUpdateModal = memo(({ repair, onClose, onSelectStatus }) => {
  const nextOptions = NEXT_STATUSES[(repair.status || '').toUpperCase()] || [];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-gray-50 dark:border-gray-700">
          <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تحديث مرحلة الإصلاح</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">#{repair.id}</p>
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

const PriceModal = memo(({ repair, price, onPriceChange, onClose, onSubmit }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
    <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
      <div className="p-8 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <FiDollarSign size={18} />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تحديد عرض السعر</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">طلب #{String(repair.id).slice(0, 8)}</p>
        </div>
      </div>
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">المبلغ المقترح (ج.م)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-lg font-black text-gray-900 dark:text-white focus:outline-none transition-all text-center"
          />
        </div>
      </div>
      <div className="px-8 pb-8 flex gap-3">
        <button onClick={onClose} className="flex-1 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">إلغاء</button>
        <button onClick={onSubmit} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">إرسال العرض</button>
      </div>
    </div>
  </div>
));
PriceModal.displayName = 'PriceModal';

const RepairRequests = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalRepair, setStatusModalRepair] = useState(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceModalRepair, setPriceModalRepair] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  const repairsRef = useRef(repairs);
  useEffect(() => { repairsRef.current = repairs; }, [repairs]);

  useEffect(() => { document.title = 'إدارة طلبات التصليح'; }, []);

  const showToast = useCallback(async (text, icon) => {
    const Swal = await loadSwal();
    Swal.fire({
      text, icon, toast: true, position: 'top-start',
      showConfirmButton: false, timer: 3000,
    });
  }, []);

  const fetchRepairs = useCallback(async (status, search = '') => {
    setLoading(true);
    try {
      const url = status === 'all'
        ? '/api/shops/repair-request'
        : `/api/shops/repair-request/status/${status}`;
      const res = await api.get(url, { params: { query: search } });
      setRepairs(Array.isArray(res.data) ? res.data : res.data.content || []);
    } catch {
      showToast('فشل جلب طلبات التصليح', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const debouncedFetch = useMemo(() => debounce(fetchRepairs, 300), [fetchRepairs]);

  useEffect(() => {
    debouncedFetch(statusFilter, searchTerm);
    return () => debouncedFetch.cancel();
  }, [statusFilter, searchTerm, debouncedFetch]);

  useEffect(() => {
    setSelectedRepair((prev) => {
      if (!prev) return prev;
      return repairs.find((r) => r.id === prev.id) || prev;
    });
  }, [repairs]);

  const updateRepairStatus = useCallback(async (repairId, newStatus) => {
    const previousRepairs = repairsRef.current;
    setRepairs((prev) => prev.map((r) => (r.id === repairId ? { ...r, status: newStatus } : r)));
    try {
      await api.put(`/api/shops/repair-request/${repairId}/status`, { status: newStatus });
      showToast('تم تحديث الحالة بنجاح', 'success');
      fetchRepairs(statusFilter, searchTerm);
    } catch {
      setRepairs(previousRepairs);
      showToast('فشل تحديث الحالة', 'error');
    }
  }, [statusFilter, searchTerm, fetchRepairs, showToast]);

  const submitPrice = useCallback(async () => {
    if (!newPrice || Number(newPrice) <= 0) { showToast('يرجى إدخال سعر صحيح', 'warning'); return; }
    const repairId = priceModalRepair.id;
    const priceVal = Number(newPrice);
    const previousRepairs = repairsRef.current;
    setRepairs((prev) => prev.map((r) => (r.id === repairId ? { ...r, price: priceVal } : r)));
    setShowPriceModal(false);
    try {
      await api.put(`/api/shops/repair-request/${repairId}/price`, { price: priceVal });
      showToast('تم تحديد السعر بنجاح', 'success');
      fetchRepairs(statusFilter, searchTerm);
    } catch {
      setRepairs(previousRepairs);
      showToast('فشل في تحديد السعر', 'error');
    }
  }, [newPrice, priceModalRepair, statusFilter, searchTerm, fetchRepairs, showToast]);

  const filteredRepairs = useMemo(() => {
    let list = repairs;

    if (deliveryFilter !== 'all') {
      list = list.filter((r) => (r.deliveryMethod || '').toUpperCase() === deliveryFilter);
    }
    if (paymentFilter !== 'all') {
      list = list.filter((r) => (r.paymentMethod || '').toUpperCase() === paymentFilter);
    }

    const sorted = [...list];
    if (sortBy === 'oldest') sorted.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    else if (sortBy === 'highest') sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'lowest') sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    else sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return sorted;
  }, [repairs, deliveryFilter, paymentFilter, sortBy]);

  const paginated = useMemo(
    () => filteredRepairs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    [filteredRepairs, currentPage, rowsPerPage],
  );
  const totalPages = Math.ceil(filteredRepairs.length / rowsPerPage);

  const stats = useMemo(() => ({
    total: repairs.length,
    pendingQuote: repairs.filter((r) => ['SUBMITTED', 'QUOTE_SENT'].includes((r.status || '').toUpperCase())).length,
    underRepair: repairs.filter((r) => (r.status || '').toUpperCase() === 'REPAIRING').length,
    completed: repairs.filter((r) => ['REPAIR_COMPLETED', 'DEVICE_DELIVERED'].includes((r.status || '').toUpperCase())).length,
  }), [repairs]);

  const statCards = useMemo(() => [
    { label: 'إجمالي الطلبات', value: stats.total.toLocaleString('ar-EG'), description: 'جميع الطلبات المستلمة' },
    { label: 'بانتظار عرض سعر', value: stats.pendingQuote.toLocaleString('ar-EG'), description: 'تحتاج إلى تسعير فوراً' },
    { label: 'قيد الإصلاح', value: stats.underRepair.toLocaleString('ar-EG'), description: 'داخل الورشة الآن' },
    { label: 'تم الانتهاء', value: stats.completed.toLocaleString('ar-EG'), description: 'طلبات جاهزة للتسليم' },
  ], [stats]);

  const handleDetails = useCallback((repair) => { setSelectedRepair(repair); setShowDetailsModal(true); }, []);
  const handleCopy = useCallback((id) => {
    navigator.clipboard.writeText(id);
    showToast('تم نسخ رقم الطلب', 'success');
  }, [showToast]);
  const handlePrice = useCallback((repair) => { setPriceModalRepair(repair); setNewPrice(repair.price || ''); setShowPriceModal(true); }, []);
  const handleOpenStatusModal = useCallback((repair) => { setStatusModalRepair(repair); setShowStatusModal(true); }, []);

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (deliveryFilter !== 'all' ? 1 : 0) + (paymentFilter !== 'all' ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
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
                placeholder="ابحث برقم الطلب، اسم العميل، أو نوع الجهاز..."
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
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">المتجر / الاستلام</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">السعر</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">الحالة</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {loading ? (
                    [...Array(rowsPerPage)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {[...Array(5)].map((_, j) => (
                          <td key={j} className="px-8 py-6"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center">
                        <div className="mb-6">
                          <EmptyRepairsIllustration />
                        </div>
                        <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">لا توجد طلبات تصليح</p>
                        <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">السجل فارغ أو لا يطابق شروط البحث</p>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((r) => (
                      <RepairRow
                        key={r.id}
                        repair={r}
                        onDetails={handleDetails}
                        onCopy={handleCopy}
                        onPrice={handlePrice}
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
                  عرض <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> إلى <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, filteredRepairs.length)}</span> من <span className="text-gray-900 dark:text-white">{filteredRepairs.length}</span> طلب
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

      {showDetailsModal && selectedRepair && (
        <RepairDetailsModal
          repair={selectedRepair}
          onClose={() => setShowDetailsModal(false)}
          onCopy={handleCopy}
          onPrice={() => { setPriceModalRepair(selectedRepair); setNewPrice(selectedRepair.price || ''); setShowPriceModal(true); setShowDetailsModal(false); }}
          onOpenStatusModal={() => { setStatusModalRepair(selectedRepair); setShowStatusModal(true); setShowDetailsModal(false); }}
        />
      )}

      {showFilterPanel && (
        <FilterPanel
          statusFilter={statusFilter}
          onStatusChange={(s) => { setStatusFilter(s); setCurrentPage(1); }}
          sortBy={sortBy}
          onSortChange={setSortBy}
          deliveryFilter={deliveryFilter}
          onDeliveryChange={setDeliveryFilter}
          paymentFilter={paymentFilter}
          onPaymentChange={setPaymentFilter}
          onClose={() => setShowFilterPanel(false)}
        />
      )}

      {showStatusModal && statusModalRepair && (
        <StatusUpdateModal
          repair={statusModalRepair}
          onClose={() => setShowStatusModal(false)}
          onSelectStatus={(status) => { updateRepairStatus(statusModalRepair.id, status); setShowStatusModal(false); }}
        />
      )}

      {showPriceModal && priceModalRepair && (
        <PriceModal
          repair={priceModalRepair}
          price={newPrice}
          onPriceChange={setNewPrice}
          onClose={() => setShowPriceModal(false)}
          onSubmit={submitPrice}
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

export default memo(RepairRequests);