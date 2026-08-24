import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo,
} from 'react';
import {
  FiChevronDown, FiSearch, FiInfo, FiChevronLeft, FiChevronRight, FiX,
  FiHash, FiCheck, FiFilter, FiCopy, FiPlus, FiEdit3, FiTrash2, FiTag,
  FiAlertCircle, FiCalendar,
} from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ar } from 'date-fns/locale';
import api from '../api';
import debounce from 'lodash/debounce';

const ROWS_OPTIONS = [5, 10, 25, 50];

const STATUS_TRANSLATIONS = {
  ACTIVE: 'نشط',
  SCHEDULED: 'قادم',
  EXPIRED: 'منتهي',
  all: 'جميع الحالات',
};

const STATUSES = ['ACTIVE', 'SCHEDULED', 'EXPIRED'];

const DISCOUNT_TYPES = [
  { value: 'all', label: 'كل الأنواع' },
  { value: 'PERCENTAGE', label: 'خصم مئوي' },
  { value: 'FIXED_AMOUNT', label: 'خصم ثابت' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث أولاً' },
  { value: 'oldest', label: 'الأقدم أولاً' },
  { value: 'highest', label: 'الأعلى خصماً' },
  { value: 'lowest', label: 'الأقل خصماً' },
];

const STATUS_STYLE = {
  ACTIVE: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  SCHEDULED: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', dot: 'bg-amber-500' },
  EXPIRED: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', dot: 'bg-red-500' },
};

const getStatusStyle = (s) => STATUS_STYLE[s] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
const formatDiscount = (o) => `${o.discountValue}${o.discountType === 'PERCENTAGE' ? '%' : ' ج.م'}`;

const EMPTY_FORM = {
  name: '', description: '', discountValue: '',
  discountType: 'PERCENTAGE', status: 'ACTIVE',
  startDate: null, endDate: null,
};

let swalPromise = null;
const loadSwal = () => {
  if (!swalPromise) swalPromise = import('sweetalert2').then((m) => m.default);
  return swalPromise;
};

const EmptyOffersIllustration = memo(() => (
  <svg viewBox="0 0 140 110" className="w-28 h-24 mx-auto">
    <ellipse cx="70" cy="96" rx="42" ry="6" fill="rgba(0,0,0,0.05)" className="dark:fill-white/5" />
    <path d="M24 42 L70 24 L116 42 L116 78 L70 92 L24 78 Z" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" className="dark:fill-gray-800 dark:stroke-gray-700" />
    <path d="M24 42 L70 58 L116 42" fill="none" stroke="#e5e7eb" strokeWidth="2" className="dark:stroke-gray-700" />
    <path d="M70 58 L70 92" fill="none" stroke="#e5e7eb" strokeWidth="2" className="dark:stroke-gray-700" />
    <g transform="translate(56,2) rotate(-14)">
      <path d="M0,8 L16,8 L26,18 L16,28 L0,28 Z" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="6" cy="14" r="2" fill="#10b981" />
    </g>
  </svg>
));
EmptyOffersIllustration.displayName = 'EmptyOffersIllustration';

const TagIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#84cc16" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#84cc16" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <path d="M18 18 L34 18 L46 30 L30 46 L18 34 Z" fill="none" stroke="#84cc16" strokeWidth="2.4" strokeLinejoin="round" />
    <circle cx="24" cy="24" r="2.6" fill="#84cc16" />
  </svg>
));
TagIllustration.displayName = 'TagIllustration';

const ShieldCheckIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#10b981" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <path d="M32 15 L44 19 L44 30 C44 38 39 42 32 45 C25 42 20 38 20 30 L20 19 Z" fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinejoin="round" className="dark:stroke-emerald-400" />
    <path d="M27 30 L31 34 L38 25" fill="none" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-emerald-400" />
  </svg>
));
ShieldCheckIllustration.displayName = 'ShieldCheckIllustration';

const PercentIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#3b82f6" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <circle cx="25" cy="25" r="4.4" fill="none" stroke="#3b82f6" strokeWidth="2.4" />
    <circle cx="39" cy="39" r="4.4" fill="none" stroke="#3b82f6" strokeWidth="2.4" />
    <line x1="39" y1="25" x2="25" y2="39" stroke="#3b82f6" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
));
PercentIllustration.displayName = 'PercentIllustration';

const CoinsIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#f97316" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <ellipse cx="27" cy="38" rx="11" ry="4.5" fill="none" stroke="#f97316" strokeWidth="2.2" />
    <ellipse cx="27" cy="33" rx="11" ry="4.5" fill="none" stroke="#f97316" strokeWidth="2.2" />
    <circle cx="38" cy="21" r="6.5" fill="none" stroke="#f97316" strokeWidth="2.2" />
    <text x="38" y="24.5" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#f97316">$</text>
  </svg>
));
CoinsIllustration.displayName = 'CoinsIllustration';

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
        {value} عروض لكل صفحة
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
              {n} عروض لكل صفحة
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
RowsDropdown.displayName = 'RowsDropdown';

const STAT_ILLUSTRATIONS = {
  'إجمالي العروض': TagIllustration,
  'العروض النشطة': ShieldCheckIllustration,
  'خصم مئوي': PercentIllustration,
  'خصم ثابت': CoinsIllustration,
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
  { icon: FiInfo, tone: 'text-amber-500 border-amber-200 dark:border-amber-900/50', label: 'تفاصيل', desc: 'عرض كامل بيانات العرض الترويجي' },
  { icon: FiCheck, tone: 'text-emerald-600 border-emerald-200 dark:border-emerald-900/50', label: 'تفعيل / إيقاف', desc: 'تبديل حالة ظهور العرض للعملاء' },
  { icon: FiEdit3, tone: 'text-blue-500 border-blue-200 dark:border-blue-900/50', label: 'تعديل', desc: 'تحديث بيانات العرض وتواريخه' },
  { icon: FiTrash2, tone: 'text-red-600 border-red-200 dark:border-red-900/50', label: 'حذف', desc: 'إزالة العرض نهائياً من المتجر' },
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
        العروض "منتهية" تختفي تلقائياً من واجهة العملاء بمجرد تجاوز تاريخ الانتهاء.
      </p>
    </div>
  </div>
));
IconLegendCard.displayName = 'IconLegendCard';

const OfferRow = memo(({ offer, onDetails, onCopy, onToggle, onEdit, onDelete }) => {
  const cs = getStatusStyle(offer.status);
  return (
    <tr className="hover:bg-emerald-50/10 dark:hover:bg-emerald-900/5 transition-colors group">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
            <FiTag size={18} />
          </div>
          <div>
            <p className="text-xs font-black text-gray-900 dark:text-white">{offer.name}</p>
            <p className="text-[10px] font-bold text-gray-400 truncate max-w-[160px] mt-0.5">{offer.description || 'بدون وصف'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-black text-sm text-emerald-600">
        {formatDiscount(offer)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <p className="text-[10px] font-black text-gray-900 dark:text-white">{new Date(offer.startDate).toLocaleDateString('ar-EG')}</p>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">إلى {new Date(offer.endDate).toLocaleDateString('ar-EG')}</p>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${cs.bg} ${cs.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cs.dot} animate-pulse`} />
          {STATUS_TRANSLATIONS[offer.status] || offer.status}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-left">
        <div className="flex items-center justify-start gap-1.5">
          <button title="تفاصيل العرض" onClick={() => onDetails(offer)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all active:scale-95">
            <FiInfo size={14} />
          </button>
          <button title="نسخ رقم العرض" onClick={() => onCopy(offer.id)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-lime-500 hover:border-lime-300 transition-all active:scale-95">
            <FiCopy size={14} />
          </button>
          <button title={offer.status === 'ACTIVE' ? 'إيقاف العرض' : 'تفعيل العرض'} onClick={() => onToggle(offer)} className="p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all active:scale-95">
            <FiCheck size={14} />
          </button>
          <button title="تعديل العرض" onClick={() => onEdit(offer)} className="p-2 rounded-lg border border-blue-200 dark:border-blue-900/50 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95">
            <FiEdit3 size={14} />
          </button>
          <button title="حذف العرض" onClick={() => onDelete(offer.id)} className="p-2 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95">
            <FiTrash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
});
OfferRow.displayName = 'OfferRow';

const OfferDetailsModal = memo(({ offer, onClose, onCopy, onToggle, onEdit, onDelete }) => {
  const cs = getStatusStyle(offer.status);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="px-5 py-3.5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between bg-gray-50/60 dark:bg-gray-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <FiTag size={17} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white">تفاصيل العرض</h3>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                #{String(offer.id).slice(0, 8)}
                <button onClick={() => onCopy(offer.id)} className="hover:text-emerald-500 transition-colors">
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
            <p className={`text-sm font-black ${cs.text}`}>{offer.name}</p>
            <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">{offer.description || 'لا يوجد وصف لهذا العرض'}</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-500/10 border border-gray-500/10 text-center">
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">قيمة الخصم</p>
              <p className="text-lg font-black text-emerald-600 tracking-tighter">{formatDiscount(offer)}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">الحالة</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${cs.bg} ${cs.text}`}>
                {STATUS_TRANSLATIONS[offer.status] || offer.status}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-2">
              <FiCalendar className="text-gray-400" size={12} />
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">فترة سريان العرض</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">يبدأ من</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">{new Date(offer.startDate).toLocaleString('ar-EG')}</span>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ينتهي في</span>
                <span className="text-xs font-bold text-red-500">{new Date(offer.endDate).toLocaleString('ar-EG')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-700 flex gap-2.5">
          <button onClick={onToggle} className="flex-1 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
            {offer.status === 'ACTIVE' ? 'إيقاف العرض' : 'تفعيل العرض'}
          </button>
          <button onClick={onEdit} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
            تعديل العرض
          </button>
          <button onClick={onClose} className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-red-500 transition-all">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
});
OfferDetailsModal.displayName = 'OfferDetailsModal';

const FilterPanel = memo(({
  statusFilter, onStatusChange, sortBy, onSortChange,
  discountTypeFilter, onDiscountTypeChange, onClose,
}) => (
  <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
    <div className="relative w-full lg:max-w-md bg-white dark:bg-gray-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500 max-h-[90vh] flex flex-col">
      <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تصفية العروض</h3>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">خصص طريقة عرض حملاتك</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-all">
          <FiX size={16} />
        </button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar-thin">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">حالة العرض</p>
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
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">نوع الخصم</p>
          <div className="flex flex-wrap gap-2">
            {DISCOUNT_TYPES.map((o) => (
              <button
                key={o.value}
                onClick={() => onDiscountTypeChange(o.value)}
                className={`px-4 py-2.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  discountTypeFilter === o.value
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-emerald-500 hover:text-emerald-600'
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

const AddEditModal = memo(({ editingOffer, formData, onChange, onClose, onSubmit }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
    <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar-thin">
      <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <FiTag size={20} />
          </div>
          <h3 className="text-base font-black text-gray-900 dark:text-white">{editingOffer ? 'تعديل بيانات العرض' : 'إنشاء حملة ترويجية جديدة'}</h3>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
          <FiX size={18} />
        </button>
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">اسم العرض</label>
          <input type="text" value={formData.name} onChange={(e) => onChange({ ...formData, name: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">قيمة الخصم</label>
          <input type="number" value={formData.discountValue} onChange={(e) => onChange({ ...formData, discountValue: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">نوع الخصم</label>
          <select value={formData.discountType} onChange={(e) => onChange({ ...formData, discountType: e.target.value })} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all cursor-pointer">
            <option value="PERCENTAGE">نسبة مئوية (%)</option>
            <option value="FIXED_AMOUNT">مبلغ ثابت (ج.م)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">تاريخ البداية</label>
          <DatePicker selected={formData.startDate} onChange={(date) => onChange({ ...formData, startDate: date })} showTimeSelect dateFormat="dd/MM/yyyy HH:mm" locale={ar} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">تاريخ النهاية</label>
          <DatePicker selected={formData.endDate} onChange={(date) => onChange({ ...formData, endDate: date })} showTimeSelect dateFormat="dd/MM/yyyy HH:mm" locale={ar} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">وصف العرض</label>
          <textarea value={formData.description} onChange={(e) => onChange({ ...formData, description: e.target.value })} rows="3" className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all resize-none" />
        </div>
      </div>

      <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-700 flex gap-4">
        <button onClick={onClose} className="flex-1 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-red-500 transition-all">إلغاء</button>
        <button onClick={onSubmit} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">{editingOffer ? 'حفظ التعديلات' : 'اضافة العرض'}</button>
      </div>
    </div>
  </div>
));
AddEditModal.displayName = 'AddEditModal';

const ShopOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [detailsOffer, setDetailsOffer] = useState(null);

  useEffect(() => { document.title = 'إدارة العروض'; }, []);

  const showToast = useCallback(async (text, icon) => {
    const Swal = await loadSwal();
    Swal.fire({
      text, icon, toast: true, position: 'top-start',
      showConfirmButton: false, timer: 3000,
    });
  }, []);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/shop/offers');
      setOffers(Array.isArray(res.data) ? res.data : res.data.content || []);
    } catch {
      showToast('فشل في تحميل العروض', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const stats = useMemo(() => ({
    total: offers.length,
    active: offers.filter((o) => o.status === 'ACTIVE').length,
    percentage: offers.filter((o) => o.discountType === 'PERCENTAGE').length,
    fixed: offers.filter((o) => o.discountType === 'FIXED_AMOUNT').length,
  }), [offers]);

  const filteredOffers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let list = offers;

    if (term) {
      list = list.filter((o) =>
        o.name?.toLowerCase().includes(term) ||
        o.description?.toLowerCase().includes(term));
    }

    if (statusFilter !== 'all') {
      list = list.filter((o) => o.status === statusFilter);
    }

    if (discountTypeFilter !== 'all') {
      list = list.filter((o) => o.discountType === discountTypeFilter);
    }

    const sorted = [...list];
    if (sortBy === 'oldest') sorted.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    else if (sortBy === 'highest') sorted.sort((a, b) => (b.discountValue || 0) - (a.discountValue || 0));
    else if (sortBy === 'lowest') sorted.sort((a, b) => (a.discountValue || 0) - (b.discountValue || 0));
    else sorted.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    return sorted;
  }, [offers, searchTerm, statusFilter, discountTypeFilter, sortBy]);

  const debouncedSetSearch = useMemo(() => debounce((v) => setSearchTerm(v), 250), []);

  const paginated = useMemo(() => filteredOffers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filteredOffers, currentPage, rowsPerPage]);
  const totalPages = Math.ceil(filteredOffers.length / rowsPerPage);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.discountValue || !formData.startDate || !formData.endDate) {
      showToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }
    try {
      if (editingOffer) {
        await api.put(`/api/shop/offers/${editingOffer.id}`, formData);
        showToast('تم تعديل العرض بنجاح', 'success');
      } else {
        await api.post('/api/shop/offers', formData);
        showToast('تم إضافة العرض بنجاح', 'success');
      }
      setShowAddEdit(false);
      fetchOffers();
    } catch {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const deleteOffer = useCallback(async (offerId) => {
    const Swal = await loadSwal();
    const { isConfirmed } = await Swal.fire({
      title: 'تأكيد الحذف', text: 'هل أنت متأكد من حذف هذا العرض نهائياً؟', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/api/shop/offers/${offerId}`);
      showToast('تم حذف العرض بنجاح', 'success');
      fetchOffers();
    } catch {
      showToast('فشل حذف العرض', 'error');
    }
  }, [fetchOffers, showToast]);

  const toggleOfferStatus = useCallback(async (offer) => {
    const nextStatus = offer.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
    try {
      await api.put(`/api/shop/offers/${offer.id}`, { ...offer, status: nextStatus });
      showToast(`تم ${nextStatus === 'ACTIVE' ? 'تفعيل' : 'إيقاف'} العرض`, 'success');
      fetchOffers();
    } catch {
      showToast('فشل تغيير الحالة', 'error');
    }
  }, [fetchOffers, showToast]);

  const statCards = useMemo(() => [
    { label: 'إجمالي العروض', value: stats.total.toLocaleString('ar-EG'), description: 'جميع الحملات الترويجية' },
    { label: 'العروض النشطة', value: stats.active.toLocaleString('ar-EG'), description: 'متاحة للعملاء الآن' },
    { label: 'خصم مئوي', value: stats.percentage.toLocaleString('ar-EG'), description: 'عروض بنسبة مئوية' },
    { label: 'خصم ثابت', value: stats.fixed.toLocaleString('ar-EG'), description: 'خصم مبالغ محددة' },
  ], [stats]);

  const handleDetails = useCallback((offer) => setDetailsOffer(offer), []);
  const handleCopy = useCallback((id) => {
    navigator.clipboard.writeText(id);
    showToast('تم نسخ رقم العرض', 'success');
  }, [showToast]);
  const handleEdit = useCallback((offer) => {
    setEditingOffer(offer);
    setFormData({ ...offer, startDate: new Date(offer.startDate), endDate: new Date(offer.endDate) });
    setShowAddEdit(true);
  }, []);

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (discountTypeFilter !== 'all' ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end mt-3 justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">الحملات التسويقية</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">إدارة <span className="text-emerald-500">العروض</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">جذب المزيد من العملاء من خلال إنشاء خصومات وعروض حصرية لمتجرك</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              title="تصفية النتائج"
              onClick={() => setShowFilterPanel(true)}
              className="relative flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-black uppercase tracking-widest hover:border-emerald-300 hover:text-emerald-600 transition-all active:scale-95"
            >
              <FiFilter size={16} /> تصفية
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <button
              onClick={() => { setEditingOffer(null); setFormData(EMPTY_FORM); setShowAddEdit(true); }}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gray-900 dark:bg-emerald-500 text-white dark:text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white transition-all shadow-xl shadow-gray-900/10 active:scale-95"
            >
              <FiPlus size={16} /> إنشاء عرض جديد
            </button>
          </div>
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
                placeholder="ابحث باسم العرض أو الوصف..."
                defaultValue={searchTerm}
                onChange={(e) => debouncedSetSearch(e.target.value)}
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
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">العرض</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">الخصم</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">الصلاحية</th>
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
                          <EmptyOffersIllustration />
                        </div>
                        <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">لا توجد عروض حالياً</p>
                        <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">ابدأ بإطلاق أولى حملاتك الترويجية الآن</p>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((o) => (
                      <OfferRow
                        key={o.id}
                        offer={o}
                        onDetails={handleDetails}
                        onCopy={handleCopy}
                        onToggle={toggleOfferStatus}
                        onEdit={handleEdit}
                        onDelete={deleteOffer}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest order-2 sm:order-1">
                  عرض <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> إلى <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, filteredOffers.length)}</span> من <span className="text-gray-900 dark:text-white">{filteredOffers.length}</span> عرض
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

      {detailsOffer && (
        <OfferDetailsModal
          offer={detailsOffer}
          onClose={() => setDetailsOffer(null)}
          onCopy={handleCopy}
          onToggle={() => { toggleOfferStatus(detailsOffer); setDetailsOffer(null); }}
          onEdit={() => { handleEdit(detailsOffer); setDetailsOffer(null); }}
        />
      )}

      {showFilterPanel && (
        <FilterPanel
          statusFilter={statusFilter}
          onStatusChange={(s) => { setStatusFilter(s); setCurrentPage(1); }}
          sortBy={sortBy}
          onSortChange={setSortBy}
          discountTypeFilter={discountTypeFilter}
          onDiscountTypeChange={setDiscountTypeFilter}
          onClose={() => setShowFilterPanel(false)}
        />
      )}

      {showAddEdit && (
        <AddEditModal
          editingOffer={editingOffer}
          formData={formData}
          onChange={setFormData}
          onClose={() => setShowAddEdit(false)}
          onSubmit={handleSubmit}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
        .react-datepicker-wrapper { width: 100%; }
      `,
      }}
      />
    </div>
  );
};

export default memo(ShopOffers);