import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiActivity, FiZap, FiShoppingBag, FiTool, FiRefreshCw, FiCalendar, FiArrowRight, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
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

// Precomputed, literal Tailwind class strings per accent color. Using string
// interpolation like `bg-${color}-50` is invisible to Tailwind's JIT scanner,
// so every color actually used is spelled out here instead.
const COLOR_STYLES = {
  lime:    { icon: 'bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400',       ring: 'text-lime-500',    chip: 'bg-lime-50 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400' },
  emerald: { icon: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', ring: 'text-emerald-500', chip: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
  blue:    { icon: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',       ring: 'text-blue-500',    chip: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  orange:  { icon: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400', ring: 'text-orange-500',  chip: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  purple:  { icon: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400', ring: 'text-purple-500',  chip: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
};
const getColorStyle = (color) => COLOR_STYLES[color] || COLOR_STYLES.emerald;

// Compact dot + label instead of heavy pill badges — matches the reference
// design and keeps rows short.
const ORDER_STATUS_STYLE = {
  PENDING:    { dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400' },
  PROCESSING: { dot: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400' },
  SHIPPED:    { dot: 'bg-indigo-500',  text: 'text-indigo-600 dark:text-indigo-400' },
  DELIVERED:  { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  COMPLETED:  { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  CANCELLED:  { dot: 'bg-red-500',     text: 'text-red-600 dark:text-red-400' },
};
const REPAIR_STATUS_STYLE = {
  SUBMITTED:   { dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400' },
  PENDING:     { dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400' },
  IN_PROGRESS: { dot: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400' },
  COMPLETED:   { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  REJECTED:    { dot: 'bg-red-500',     text: 'text-red-600 dark:text-red-400' },
  CANCELLED:   { dot: 'bg-red-500',     text: 'text-red-600 dark:text-red-400' },
};
const getStatusStyle = (map, s) => map[s] || { dot: 'bg-gray-400', text: 'text-gray-500 dark:text-gray-400' };

const ScrollbarStyles = memo(() => (
  <style>{`
    .styled-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
    .styled-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .styled-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 9999px; }
    .styled-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.8); }
    .styled-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(156, 163, 175, 0.5) transparent; }
  `}</style>
));

const SkeletonBlock = ({ className }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl animate-pulse border border-gray-100 dark:border-gray-700 ${className}`} />
);

// Single lightweight spinner (CSS transform + animate-spin only) used for any
// async section instead of layout-heavy pulsing skeleton rows.
const Spinner = memo(({ size = 20, className = '' }) => (
  <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-20" />
    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
));

// Small ring/donut progress used inside stat cards. Pure SVG, no dependency,
// transitions only strokeDashoffset so it stays cheap even with several on screen.
const RingProgress = memo(({ percent = 0, size = 38, stroke = 3, colorClass = 'text-emerald-500' }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = c - (clamped / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="currentColor" fill="none" className="text-gray-100 dark:text-gray-700" />
      <circle
        cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="currentColor" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset} className={colorClass}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
});

const EmptyIllustration = memo(() => (
  <svg viewBox="0 0 100 80" className="w-14 h-12 mx-auto">
    <path d="M14 34 L28 12 H72 L86 34" fill="none" stroke="#d1d5db" strokeWidth="2.4" strokeLinejoin="round" className="dark:stroke-gray-600" />
    <path d="M14 34 H36 C37 40 43 44 50 44 C57 44 63 40 64 34 H86 V64 C86 67 84 69 81 69 H19 C16 69 14 67 14 64 Z" fill="none" stroke="#d1d5db" strokeWidth="2.4" strokeLinejoin="round" className="dark:stroke-gray-600" />
    <circle cx="50" cy="52" r="2" fill="#d1d5db" className="dark:fill-gray-600" />
  </svg>
));

const EmptyRow = ({ colSpan, text }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-8 text-center">
      <EmptyIllustration />
      <p className="mt-2 text-[10px] font-bold text-gray-400">{text}</p>
    </td>
  </tr>
);

const LoadingRow = ({ colSpan }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-8">
      <div className="flex items-center justify-center text-emerald-500">
        <Spinner size={22} />
      </div>
    </td>
  </tr>
);

const StoreIllustration = memo(() => (
  <svg viewBox="0 0 120 90" className="w-16 h-13 sm:w-20 sm:h-16">
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

const StatCard = memo(({ label, value, icon: Icon, color, to, description, percent }) => {
  const navigate = useNavigate();
  const c = getColorStyle(color);
  return (
    <div
      onClick={() => navigate(to)}
      className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 sm:p-3.5 hover:shadow-lg hover:shadow-gray-200/40 dark:hover:shadow-none hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 38, height: 38 }}>
          {percent !== undefined && <RingProgress percent={percent} size={38} stroke={3} colorClass={c.ring} />}
          <div className={`absolute inset-0 m-auto flex items-center justify-center w-6 h-6 rounded-lg ${c.icon}`}>
            <Icon size={13} />
          </div>
        </div>
        <div className={`w-6 h-6 rounded-full ${c.chip} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300`}>
          <FiArrowRight size={11} className="rotate-180" />
        </div>
      </div>
      <div className="mt-2.5 space-y-0.5">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-[15px] sm:text-base font-black text-gray-900 dark:text-white truncate">{value}</p>
        <p className="text-[9px] font-semibold text-gray-400">{description}</p>
      </div>
    </div>
  );
});

// Converts a Date to the local "YYYY-MM-DDTHH:mm" string a datetime-local
// input expects (Date#toISOString is UTC, which would shift the displayed time).
const toLocalInputValue = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const DATE_PRESETS = [
  { key: 'today', label: 'اليوم' },
  { key: 'week', label: 'آخر ٧ أيام' },
  { key: 'month', label: 'هذا الشهر' },
  { key: 'all', label: 'كل الوقت' },
];

const DateFilter = memo(({ startDate, endDate, onStartChange, onEndChange, onReset, error, loading }) => {
  const applyPreset = useCallback((key) => {
    const now = new Date();
    if (key === 'all') { onReset(); return; }
    let start;
    if (key === 'today') start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (key === 'week') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else start = new Date(now.getFullYear(), now.getMonth(), 1);
    onStartChange(toLocalInputValue(start));
    onEndChange(toLocalInputValue(now));
  }, [onStartChange, onEndChange, onReset]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-3 sm:p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-gray-400">
          <FiCalendar size={15} className="text-emerald-500" />
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">تصفية حسب التاريخ</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2.5">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="relative">
            <span className="absolute -top-2 right-3 px-1.5 text-[9px] font-bold bg-white dark:bg-gray-800 text-gray-400 rounded">من</span>
            <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 pointer-events-none" size={13} />
            <input
              type="datetime-local"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => onStartChange(e.target.value)}
              className="w-full pr-9 pl-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-xs font-bold text-gray-900 dark:text-white focus:outline-none transition-colors"
            />
          </div>
          <div className="relative">
            <span className="absolute -top-2 right-3 px-1.5 text-[9px] font-bold bg-white dark:bg-gray-800 text-gray-400 rounded">إلى</span>
            <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 pointer-events-none" size={13} />
            <input
              type="datetime-local"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => onEndChange(e.target.value)}
              className="w-full pr-9 pl-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-xs font-bold text-gray-900 dark:text-white focus:outline-none transition-colors"
            />
          </div>
        </div>

        <button
          onClick={onReset}
          className="h-10 md:h-[42px] shrink-0 flex items-center justify-center gap-1.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-[11px] font-bold hover:bg-emerald-500 dark:hover:bg-emerald-500 dark:hover:text-white transition-colors"
        >
          {loading ? <Spinner size={13} /> : <FiRefreshCw size={13} />} إعادة تعيين
        </button>
      </div>

      {error && <p className="mt-2 text-[10px] font-bold text-red-500 px-1">{error}</p>}
    </div>
  );
});

const CHART_PERIODS = [
  { key: 'DAILY', label: 'يوم' },
  { key: 'MONTHLY', label: 'شهر' },
  { key: 'YEARLY', label: 'سنة' },
];

// Local (not UTC) bucket key so day/month boundaries match the shop's
// own clock instead of shifting with toISOString().
const bucketKey = (d, period) => {
  if (period === 'DAILY') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (period === 'MONTHLY') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return String(d.getFullYear());
};

// Builds a fixed, continuous set of empty buckets (last 14 days / 12 months /
// 6 years) so the chart still shows the full trailing window — including
// zero-activity periods — instead of only the dates that happen to have data.
const buildEmptyBuckets = (period) => {
  const now = new Date();
  const buckets = [];
  if (period === 'DAILY') {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.push({ key: bucketKey(d, period), label: d.toLocaleDateString('ar-EG', { day: '2-digit', month: 'short' }), value: 0 });
    }
  } else if (period === 'MONTHLY') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: bucketKey(d, period), label: d.toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' }), value: 0 });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear() - i, 0, 1);
      buckets.push({ key: bucketKey(d, period), label: String(d.getFullYear()), value: 0 });
    }
  }
  return buckets;
};

// Counts how many records (orders or repairs) fall into each bucket, purely
// client-side — no dedicated chart endpoint needed.
const aggregateByPeriod = (records, period, dateField) => {
  const buckets = buildEmptyBuckets(period);
  const map = new Map(buckets.map((b) => [b.key, b]));
  records.forEach((r) => {
    const raw = r[dateField];
    if (!raw) return;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return;
    const bucket = map.get(bucketKey(d, period));
    if (bucket) bucket.value += 1;
  });
  return buckets;
};

// Orders/repairs bar chart with a day • month • year toggle, built entirely
// from the shop's existing orders/repairs records (fetched once, then
// re-bucketed client-side on every toggle — no network round trip when
// switching granularity). Highlights the single best-performing bucket so
// the shop can see at a glance which day, month, or year is doing best.
const BarChartCard = memo(({ title, icon: Icon, color, endpoint, unitLabel, dateField = 'createdAt' }) => {
  const [period, setPeriod] = useState('DAILY');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const c = getColorStyle(color);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        // One generously-sized page keeps this a single request. If a shop
        // can have more than this many orders/repairs in total, switch to a
        // pagination loop (or a real aggregation endpoint) instead.
        const res = await api.get(endpoint, {
          params: { page: 0, size: 500, sort: `${dateField},desc` },
          signal: controller.signal,
        });
        const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
        setRecords(data);
      } catch {
        if (!controller.signal.aborted) setRecords([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [endpoint, dateField]);

  const buckets = useMemo(() => aggregateByPeriod(records, period, dateField), [records, period, dateField]);
  const maxValue = useMemo(() => Math.max(1, ...buckets.map((d) => d.value)), [buckets]);
  const total = useMemo(() => buckets.reduce((s, d) => s + d.value, 0), [buckets]);
  const best = useMemo(() => (buckets.length ? buckets.reduce((a, b) => (b.value > a.value ? b : a), buckets[0]) : null), [buckets]);
  const trend = useMemo(() => {
    if (buckets.length < 2) return null;
    const mid = Math.floor(buckets.length / 2);
    const firstSum = buckets.slice(0, mid).reduce((s, d) => s + d.value, 0);
    const secondSum = buckets.slice(mid).reduce((s, d) => s + d.value, 0);
    if (firstSum === 0 && secondSum === 0) return null;
    if (firstSum === 0) return { pct: 100, up: true };
    return { pct: Math.round(((secondSum - firstSum) / firstSum) * 100), up: secondSum >= firstSum };
  }, [buckets]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-3.5 sm:p-4">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg ${c.icon} flex items-center justify-center flex-shrink-0`}>
            <Icon size={14} />
          </div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-1">
          {CHART_PERIODS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                period === opt.key ? `${c.chip}` : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && records.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[10px] font-semibold text-gray-400">
            الإجمالي: <span className="font-black text-gray-700 dark:text-gray-200">{total.toLocaleString('ar-EG')}</span>{unitLabel ? ` ${unitLabel}` : ''}
          </p>
          {trend && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${trend.up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {trend.up ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />} {Math.abs(trend.pct)}%
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-14 text-emerald-500">
          <Spinner size={24} />
        </div>
      ) : records.length === 0 ? (
        <div className="py-6 text-center">
          <EmptyIllustration />
          <p className="mt-2 text-[10px] font-bold text-gray-400">لا توجد بيانات كافية بعد</p>
        </div>
      ) : (
        <>
          <div className="h-32 sm:h-36 overflow-x-auto styled-scrollbar">
            <div
              className="flex items-end gap-1.5 sm:gap-2 h-full px-0.5"
              style={{ minWidth: buckets.length > 8 ? `${buckets.length * 34}px` : '100%' }}
            >
              {buckets.map((d, i) => {
                const pct = Math.max(4, Math.round((d.value / maxValue) * 100));
                const isBest = best && d.value === best.value && d.value > 0;
                return (
                  <div
                    key={d.key}
                    title={`${d.label}: ${d.value.toLocaleString('ar-EG')}`}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-1 min-w-[22px]"
                  >
                    <span className={`text-[8px] font-bold ${isBest ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                      {d.value > 0 ? d.value.toLocaleString('ar-EG') : ''}
                    </span>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isBest ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-[8px] font-semibold text-gray-400 truncate max-w-[30px]">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {best && best.value > 0 && (
            <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold ${c.chip}`}>
              <FiTrendingUp size={13} className="flex-shrink-0" />
              أفضل أداء: <span className="font-black">{best.label}</span> بـ {best.value.toLocaleString('ar-EG')}{unitLabel ? ` ${unitLabel}` : ''}
            </div>
          )}
        </>
      )}
    </div>
  );
});

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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 border-b border-gray-50 dark:border-gray-700">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 flex-shrink-0">
          <FiShoppingBag size={14} />
        </div>
        <h3 className="text-sm font-black text-gray-900 dark:text-white">أحدث 5 طلبات</h3>
      </div>

      <div className="overflow-x-auto styled-scrollbar">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50">
              <th className="px-4 sm:px-5 py-2.5 text-[9px] font-bold text-gray-400">العميل</th>
              <th className="px-3 py-2.5 text-[9px] font-bold text-gray-400">المنتجات</th>
              <th className="px-3 py-2.5 text-[9px] font-bold text-gray-400 text-center">الحالة</th>
              <th className="px-3 py-2.5 text-[9px] font-bold text-gray-400 text-center">الدفع</th>
              <th className="px-3 py-2.5 text-[9px] font-bold text-gray-400 text-center">الإجمالي</th>
              <th className="px-4 sm:px-5 py-2.5 text-[9px] font-bold text-gray-400 text-left">التاريخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <LoadingRow colSpan={6} />
            ) : orders.length === 0 ? (
              <EmptyRow colSpan={6} text="لا توجد طلبات حديثة" />
            ) : (
              orders.map((o) => {
                const st = getStatusStyle(ORDER_STATUS_STYLE, o.status);
                const items = o.orderItems || [];
                const firstItem = items[0];
                const extraCount = items.length - 1;
                const fullName = [o.firstName, o.lastName].filter(Boolean).join(' ');
                return (
                  <tr key={o.id} className="hover:bg-blue-50/10 dark:hover:bg-blue-900/5 transition-colors">
                    <td className="px-4 sm:px-5 py-2.5">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{fullName || 'عميل غير محدد'}</p>
                      <p className="text-[9px] font-semibold text-gray-400 mt-0.5">{o.phoneNumber || '-'}</p>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-200">{firstItem?.productName || '-'}</p>
                      {extraCount > 0 && <p className="text-[9px] font-bold text-gray-400 mt-0.5">+{extraCount} منتج آخر</p>}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {o.status || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-[9px] font-semibold text-gray-400 whitespace-nowrap">
                      {o.paymentMethod || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-black text-[11px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatPrice(o.totalPrice)}
                    </td>
                    <td className="px-4 sm:px-5 py-2.5 text-left text-[9px] font-semibold text-gray-400 whitespace-nowrap">
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 sm:px-5 py-3 border-b border-gray-50 dark:border-gray-700">
        <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 flex-shrink-0">
          <FiTool size={14} />
        </div>
        <h3 className="text-sm font-black text-gray-900 dark:text-white">أحدث 5 طلبات تصليح</h3>
      </div>

      <div className="overflow-x-auto styled-scrollbar">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50">
              <th className="px-4 sm:px-5 py-2.5 text-[9px] font-bold text-gray-400">الطلب</th>
              <th className="px-3 py-2.5 text-[9px] font-bold text-gray-400">المتجر</th>
              <th className="px-3 py-2.5 text-[9px] font-bold text-gray-400 text-center">الحالة</th>
              <th className="px-3 py-2.5 text-[9px] font-bold text-gray-400 text-center">التسليم</th>
              <th className="px-3 py-2.5 text-[9px] font-bold text-gray-400 text-center">السعر</th>
              <th className="px-4 sm:px-5 py-2.5 text-[9px] font-bold text-gray-400 text-left">التأكيد</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <LoadingRow colSpan={6} />
            ) : repairs.length === 0 ? (
              <EmptyRow colSpan={6} text="لا توجد طلبات تصليح حديثة" />
            ) : (
              repairs.map((r) => {
                const st = getStatusStyle(REPAIR_STATUS_STYLE, r.status);
                return (
                  <tr key={r.id} className="hover:bg-orange-50/10 dark:hover:bg-orange-900/5 transition-colors">
                    <td className="px-4 sm:px-5 py-2.5">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[160px]">{r.description || 'بدون وصف'}</p>
                      <p className="text-[9px] font-semibold text-gray-400 mt-0.5">{r.paymentMethod || '-'}</p>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-[10px] font-semibold text-gray-700 dark:text-gray-200">
                      {r.shopName || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {r.status || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-[9px] font-semibold text-gray-400 whitespace-nowrap">
                      {r.deliveryMethod || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-black text-[11px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatPrice(r.price)}
                    </td>
                    <td className="px-4 sm:px-5 py-2.5 text-left whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${
                        r.confirmed ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${r.confirmed ? 'bg-emerald-500' : 'bg-gray-400'}`} />
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
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [stats, setStats] = useState({
    totalSales: 0,
    todaySales: 0,
    totalOrders: 0,
    todayRepairs: 0,
    totalRepairs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const abortRef = useRef(null);

  useEffect(() => { document.title = ' لوحة التحكم'; }, []);

  useEffect(() => {
    if (!accessToken) navigate('/login');
  }, [accessToken, navigate]);

  const showToast = useCallback((text, icon) => {
    Swal.fire({
      text, icon, toast: true, position: 'top-end', timer: 3000, showConfirmButton: false,
      customClass: { popup: 'rounded-2xl font-cairo text-xs font-bold shadow-lg' },
    });
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
    { label: 'إجمالي المبيعات', value: formatPrice(stats.totalSales), icon: FiActivity, color: 'lime', to: '/shop/transactions', description: 'إجمالي الأرباح' },
    {
      label: 'مبيعات اليوم', value: formatPrice(stats.todaySales), icon: FiZap, color: 'emerald', to: '/shop/transactions', description: 'النشاط الحالي',
      percent: stats.totalSales > 0 ? (stats.todaySales / stats.totalSales) * 100 : 0,
    },
    { label: 'إجمالي الطلبات', value: stats.totalOrders.toLocaleString('ar-EG'), icon: FiShoppingBag, color: 'blue', to: '/shop/orders', description: 'طلبات المنتجات' },
    {
      label: 'تصليحات اليوم', value: stats.todayRepairs.toLocaleString('ar-EG'), icon: FiTool, color: 'orange', to: '/shop/repair-requests', description: 'الصيانة الجارية',
      percent: stats.totalRepairs > 0 ? (stats.todayRepairs / stats.totalRepairs) * 100 : 0,
    },
    { label: 'إجمالي التصليحات', value: stats.totalRepairs.toLocaleString('ar-EG'), icon: FiTool, color: 'purple', to: '/shop/repair-requests', description: 'كل طلبات الصيانة' },
  ], [stats]);

  const showSkeleton = isLoading && !lastUpdated;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-5 lg:pr-64 mt-16 transition-colors duration-300 font-cairo antialiased" dir="rtl">
      <ScrollbarStyles />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-end gap-3">
            <div className="flex-shrink-0 hidden sm:block">
              <StoreIllustration />
            </div>
            <div className="space-y-1 text-right">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                لوحة <span className="text-emerald-500">المتجر</span>
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">
                تابع أداء متجرك ومبيعاتك في الوقت الفعلي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="px-3.5 py-1.5">
              <p className="text-[9px] font-bold text-gray-400 mb-0.5">آخر تحديث</p>
              <span className="text-[11px] font-black text-gray-900 dark:text-white">
                {lastUpdated ? lastUpdated.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '...'}
              </span>
            </div>
            <button
              onClick={() => fetchStats()}
              className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:rotate-180 transition-all duration-700"
            >
              <FiRefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
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
          loading={isLoading && !!lastUpdated}
        />

        {showSkeleton ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => <SkeletonBlock key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {dashboardMetrics.map((c) => <StatCard key={c.label} {...c} />)}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          <BarChartCard title="الطلبات" icon={FiShoppingBag} color="blue" endpoint="/api/shops/orders/control" unitLabel="طلب" />
          <BarChartCard title="التصليحات" icon={FiTool} color="orange" endpoint="/api/shops/repair-request" unitLabel="تصليح" />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <LatestOrdersTable />
          <LatestRepairsTable />
        </div>

      </div>
    </div>
  );
};

export default memo(ShopDashboard);