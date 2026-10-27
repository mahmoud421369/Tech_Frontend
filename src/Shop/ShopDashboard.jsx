import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo, lazy, Suspense, createContext, useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity, FiZap, FiShoppingBag, FiTool, FiRefreshCw, FiCalendar,
  FiAlertCircle, FiChevronLeft, FiChevronRight, FiPackage,
  FiBox, FiTag, FiCreditCard, FiPieChart, FiBarChart2,
} from "react-icons/fi";
import api from "../common/api/api";
import useAuthStore from "../common/store/Auth";
import { UI3D_CSS, Defs3D } from "../components/user/Ui3D";
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from "../components/user/UiExtras";
import {
  BTN_ICON, BTN_MD, BTN_PRIMARY, CARD, PANEL, FIELD, LABEL, SCROLL_CSS,
  useDarkMode, useShopLocale, IconTile,
} from "../components/shop/TableKit";
import { ensureShopAssets } from "../common/utils/shopFonts";

ensureShopAssets();

const PAGE_CSS = UI3D_CSS + EXTRAS_CSS + SCROLL_CSS;
const INK = "#04261a";

const BarChart = lazy(async () => {
  const [cjs, rc] = await Promise.all([import("chart.js"), import("react-chartjs-2")]);
  cjs.Chart.register(cjs.CategoryScale, cjs.LinearScale, cjs.BarElement, cjs.Tooltip);
  return { default: rc.Bar };
});

const LocaleCtx = createContext(null);
const useL = () => useContext(LocaleCtx);

const FMT_CACHE = {};
const getFmt = (locale) =>
  (FMT_CACHE[locale] ||= {
    num: new Intl.NumberFormat(locale),
    day: new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }),
    monthYear: new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }),
    time: new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    longMonth: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    todayLong: new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }),
  });

const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const normStatus = (s) => (s ? String(s).toUpperCase() : "");

const DT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;
const MIN_DT = `${MIN_YEAR}-01-01T00:00`;
const MAX_DT = `${MAX_YEAR}-12-31T23:59`;

const toLocalInputValue = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const parseLocalInput = (v) => {
  if (typeof v !== "string" || v.length !== 16 || !DT_RE.test(v)) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  if (y < MIN_YEAR || y > MAX_YEAR) return null;
  if (toLocalInputValue(d) !== v) return null;
  return d;
};


const STATUS_STYLE = {
  PENDING:     { hex: "#f59e0b", ink: INK },
  SUBMITTED:   { hex: "#f59e0b", ink: INK },
  PROCESSING:  { hex: "#3b82f6", ink: "#ffffff" },
  IN_PROGRESS: { hex: "#3b82f6", ink: "#ffffff" },
  SHIPPED:     { hex: "#6366f1", ink: "#ffffff" },
  DELIVERED:   { hex: "#10b981", ink: INK },
  COMPLETED:   { hex: "#34d399", ink: INK },
  REJECTED:    { hex: "#ef4444", ink: "#ffffff" },
  CANCELLED:   { hex: "#ef4444", ink: "#ffffff" },
};
const FALLBACK_STATUS = { hex: "#9ca3af", ink: INK };
const getStatusStyle = (s) => STATUS_STYLE[normStatus(s)] || FALLBACK_STATUS;

const REDUCED = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400";



const Spinner = memo(({ size = 20, className = "" }) => (
  <svg className={`animate-spin motion-reduce:animate-none ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-20" />
    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
));

const SectionTitle = ({ icon: Icon, children }) => (
  <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase">
    {Icon && <Icon size={14} className="nb-ic flex-shrink-0" aria-hidden="true" />}
    <span className="nb-ul">{children}</span>
  </h3>
);

const Meter = memo(({ pct, color, className = "h-2.5" }) => (
  <span className={`nb-gray nb-line block overflow-hidden border-2 ${className}`} aria-hidden="true">
    <span
      className="block h-full"
      style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color || "var(--nb-accent)", transition: REDUCED ? "none" : "width .5s ease" }}
    />
  </span>
));

const SkeletonBlock = ({ className }) => (
  <div className={`${CARD} nb-gray animate-pulse motion-reduce:animate-none ${className}`} />
);

const EmptyBlock = ({ text }) => {
  const { darkMode } = useL();
  return (
    <div className="flex h-full items-center justify-center py-4">
      <EmptyState3D kind="box" title={text} darkMode={darkMode} />
    </div>
  );
};

const LoadingBlock = () => {
  const { t } = useL();
  return (
    <div role="status" aria-label={t.loadingAria} className="nb-ic flex h-full items-center justify-center py-10">
      <Spinner size={24} />
    </div>
  );
};

const RetryBlock = ({ onRetry }) => {
  const { t } = useL();
  return (
    <div className="text-center">
      <p role="alert" className="text-xs font-bold text-red-500">{t.errors.load}</p>
      <button type="button" onClick={onRetry} className={`${BTN_MD} mt-2 h-8 uppercase`}>{t.retry}</button>
    </div>
  );
};

const ChartFallback = () => <div className="nb-gray nb-line h-full w-full animate-pulse border-2 motion-reduce:animate-none" />;

const useInView = (margin = "240px") => {
  const ref = useRef(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (seen || !ref.current) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin: margin });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen];
};

const Panel = memo(({ title, subtitle, icon, action, children }) => (
  <section className={`${CARD} flex min-w-0 flex-col p-5`}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <SectionTitle icon={icon}>{title}</SectionTitle>
        {subtitle && <p className="nb-muted mt-1.5 text-[11px] font-semibold">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
));

const StatusChip = ({ status, labels }) => {
  const st = getStatusStyle(status);
  return (
    <span className="nb-chip !normal-case" style={{ background: st.hex, color: st.ink }}>
      {labels[normStatus(status)] || status || "—"}
    </span>
  );
};



const STAT_META = {
  totalSales:   { icon: FiActivity,    tone: "em",  color: "#34d399", to: "/shop/transactions" },
  todaySales:   { icon: FiZap,         tone: "te",  color: "#2dd4bf", to: "/shop/transactions" },
  totalOrders:  { icon: FiShoppingBag, tone: "sky", color: "#38bdf8", to: "/shop/orders" },
  todayRepairs: { icon: FiTool,        tone: "am",  color: "#fbbf24", to: "/shop/repair-requests" },
  totalRepairs: { icon: FiTool,        tone: "vi",  color: "#a78bfa", to: "/shop/repair-requests" },
};

const StatTile = memo(({ meta, label, caption, value, percent, onNavigate, wide }) => (
  <button
    type="button"
    onClick={() => onNavigate(meta.to)}
    className={`${CARD} min-w-0 p-4 text-start transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none ${FOCUS} ${wide ? "sm:col-span-2" : ""}`}
  >
    <div className="flex items-center gap-3">
      <IconTile icon={meta.icon} tone={meta.tone} className="h-11 w-11 flex-shrink-0" size={19} />
      <div className="min-w-0">
        <p className="nb-muted truncate text-[10px] font-bold uppercase">{label}</p>
        <p className="truncate text-xl font-extrabold leading-tight tabular-nums">{value}</p>
      </div>
    </div>
    {percent !== undefined && (
      <div className="mt-3 flex items-center gap-2">
        <Meter pct={percent} color={meta.color} className="h-2.5 flex-1" />
        <span className="w-9 text-end text-[10px] font-extrabold tabular-nums">{percent}%</span>
      </div>
    )}
    <p className={`nb-muted truncate text-[11px] font-semibold ${percent !== undefined ? "mt-2" : "mt-3"}`}>{caption}</p>
  </button>
));



const QUICK_LINKS = [
  { key: "orders",       path: "/shop/orders",          icon: FiShoppingBag, tone: "sky" },
  { key: "repairs",      path: "/shop/repair-requests", icon: FiTool,        tone: "am" },
  { key: "products",     path: "/shop/devices",         icon: FiPackage,     tone: "em" },
  { key: "inventory",    path: "/shop/inventory",       icon: FiBox,         tone: "vi" },
  { key: "offers",       path: "/shop/offers",          icon: FiTag,         tone: "ro" },
  { key: "transactions", path: "/shop/transactions",    icon: FiCreditCard,  tone: "te" },
];

const QuickLink = memo(({ item, title, desc, onOpen }) => (
  <li>
    <button
      type="button"
      onClick={() => onOpen(item.path)}
      className={`${PANEL} group flex w-full items-center gap-3 p-2.5 text-start transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none ${FOCUS}`}
    >
      <IconTile icon={item.icon} tone={item.tone} className="h-10 w-10 flex-shrink-0" size={16} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-extrabold uppercase">{title}</span>
        <span className="nb-muted block truncate text-[11px] font-semibold">{desc}</span>
      </span>
      <FiChevronRight size={15} className="nb-ic flex-shrink-0 rtl:rotate-180" aria-hidden="true" />
    </button>
  </li>
));



const MiniCalendar = memo(() => {
  const { t, f } = useL();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const today = new Date();

  const { title, cells } = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const arr = Array.from({ length: first }, () => null);
    for (let d = 1; d <= days; d++) arr.push(d);
    return { title: f.longMonth.format(cursor), cells: arr };
  }, [cursor, f]);

  const shift = (n) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));
  const isToday = (d) => d && d === today.getDate() && cursor.getMonth() === today.getMonth() && cursor.getFullYear() === today.getFullYear();

  return (
    <section className={`${CARD} flex h-full flex-col p-5`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <button type="button" onClick={() => shift(-1)} aria-label={t.calendar.prev} className={BTN_ICON}>
          <FiChevronLeft size={15} className="rtl:rotate-180" />
        </button>
        <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">{title}</span></h3>
        <button type="button" onClick={() => shift(1)} aria-label={t.calendar.next} className={BTN_ICON}>
          <FiChevronRight size={15} className="rtl:rotate-180" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {t.weekdays.map((w) => <span key={w} className="nb-muted py-1 text-[10px] font-extrabold uppercase rtl:tracking-normal">{w}</span>)}
        {cells.map((d, i) => (
          <span
            key={i}
            className={`mx-auto flex h-8 w-8 items-center justify-center text-xs font-bold tabular-nums ${d ? "" : "invisible"}`}
            style={isToday(d)
              ? { background: "var(--nb-accent)", color: INK, border: `2px solid ${INK}`, boxShadow: "2px 2px 0 var(--nb-shadow)" }
              : undefined}
          >
            {d ? f.num.format(d) : ""}
          </span>
        ))}
      </div>
      <div className="mt-auto pt-4">
        <div className={`${PANEL} px-4 py-3`}>
          <p className="nb-muted text-[10px] font-bold uppercase">{t.calendar.today}</p>
          <p className="mt-0.5 text-sm font-extrabold">{f.todayLong.format(today)}</p>
        </div>
      </div>
    </section>
  );
});



const DATE_PRESET_KEYS = ["today", "week", "month", "all"];

const DateFilter = memo(({ startDate, endDate, onStartChange, onEndChange, onReset, error, loading }) => {
  const { t } = useL();
  const d = t.filter;

  const applyPreset = useCallback((key) => {
    const now = new Date();
    if (key === "all") { onReset(); return; }
    let start;
    if (key === "today") start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    else if (key === "week") start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else start = new Date(now.getFullYear(), now.getMonth(), 1);
    onStartChange(toLocalInputValue(start));
    onEndChange(toLocalInputValue(now));
  }, [onStartChange, onEndChange, onReset]);

  const fields = [
    { id: "df-from", label: d.from, value: startDate, onChange: onStartChange, min: MIN_DT, max: endDate || MAX_DT },
    { id: "df-to", label: d.to, value: endDate, onChange: onEndChange, min: startDate || MIN_DT, max: MAX_DT },
  ];

  return (
    <section className={`${CARD} space-y-4 p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle icon={FiCalendar}>{d.title}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {DATE_PRESET_KEYS.map((k) => (
            <button key={k} type="button" onClick={() => applyPreset(k)} className={`${BTN_MD} h-8 uppercase`}>
              {d.presets[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((fld) => (
            <div key={fld.id}>
              <label htmlFor={fld.id} className={LABEL}>{fld.label}</label>
              <input
                id={fld.id}
                type="datetime-local"
                value={fld.value}
                min={fld.min}
                max={fld.max}
                autoComplete="off"
                aria-invalid={!!error}
                onChange={(e) => fld.onChange(e.target.value)}
                className={`${FIELD} w-full`}
              />
            </div>
          ))}
        </div>

        <button type="button" onClick={onReset} className={`${BTN_PRIMARY} h-10 shrink-0 uppercase`}>
          {loading ? <Spinner size={13} /> : <FiRefreshCw size={13} aria-hidden="true" />} {d.reset}
        </button>
      </div>

      {error && (
        <p role="alert" className="nb-card flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold !border-red-500 text-red-600 dark:text-red-300">
          <FiAlertCircle size={13} aria-hidden="true" /> {error}
        </p>
      )}
    </section>
  );
});



const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const abortRef = useRef(null);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await api.get("/api/shops/orders/control", {
        params: { page: 0, size: 500, sort: "createdAt,desc" },
        signal: controller.signal,
      });
      const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
      if (!controller.signal.aborted) { setOrders(data); setError(false); }
    } catch {
      if (!controller.signal.aborted) setError(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => abortRef.current?.abort();
  }, [refresh]);

  return { orders, loading, error, refresh };
};



const Insight = memo(({ label, value, tone }) => (
  <div className={`${PANEL} min-w-0 px-3.5 py-3`}>
    <p className="nb-muted truncate text-[10px] font-bold uppercase">{label}</p>
    <p className={`mt-0.5 truncate text-lg font-extrabold tabular-nums ${tone || ""}`}>{value}</p>
  </div>
));

const bucketKey = (d, period) => {
  if (period === "DAILY") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (period === "MONTHLY") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return String(d.getFullYear());
};

const buildEmptyBuckets = (period, f) => {
  const now = new Date();
  const out = [];
  if (period === "DAILY") {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      out.push({ key: bucketKey(d, period), label: f.day.format(d), value: 0 });
    }
  } else if (period === "MONTHLY") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({ key: bucketKey(d, period), label: f.monthYear.format(d), value: 0 });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear() - i, 0, 1);
      out.push({ key: bucketKey(d, period), label: f.num.format(d.getFullYear()).replace(/[,٬]/g, ""), value: 0 });
    }
  }
  return out;
};

const aggregateByPeriod = (records, period, f) => {
  const buckets = buildEmptyBuckets(period, f);
  const map = new Map(buckets.map((b) => [b.key, b]));
  for (const r of records) {
    if (!r.createdAt) continue;
    const d = new Date(r.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const bucket = map.get(bucketKey(d, period));
    if (bucket) bucket.value += 1;
  }
  return buckets;
};

const PERIOD_KEYS = ["DAILY", "MONTHLY", "YEARLY"];

const OrdersChartCard = memo(({ orders, loading, doneRate }) => {
  const { t, f, fontFamily, darkMode } = useL();
  const c = t.ordersChart;
  const [period, setPeriod] = useState("DAILY");
  const [ref, seen] = useInView();

  const buckets = useMemo(() => aggregateByPeriod(orders, period, f), [orders, period, f]);
  const { total, best, max } = useMemo(() => {
    let sum = 0, top = null, mx = 0;
    for (const b of buckets) {
      sum += b.value;
      if (b.value > mx) { mx = b.value; top = b; }
    }
    return { total: sum, best: top, max: mx };
  }, [buckets]);

  const trend = useMemo(() => {
    const mid = Math.floor(buckets.length / 2);
    const a = buckets.slice(0, mid).reduce((s, d) => s + d.value, 0);
    const b = buckets.slice(mid).reduce((s, d) => s + d.value, 0);
    if (a === 0 && b === 0) return null;
    if (a === 0) return { pct: 100, up: true };
    return { pct: Math.round(((b - a) / a) * 100), up: b >= a };
  }, [buckets]);

  const edge = darkMode ? "rgba(236,253,245,0.9)" : INK;

  const data = useMemo(() => ({
    labels: buckets.map((b) => b.label),
    datasets: [{
      data: buckets.map((b) => b.value),
      backgroundColor: buckets.map((b) => (max > 0 && b.value === max ? "#34d399" : darkMode ? "rgba(52,211,153,0.35)" : "#a7f3d0")),
      borderColor: edge,
      borderWidth: 2,
      borderRadius: 0,
      borderSkipped: false,
      maxBarThickness: 36,
    }],
  }), [buckets, max, darkMode, edge]);

  const options = useMemo(() => {
    const text = darkMode ? "#d1d5db" : "#1f2937";
    const grid = darkMode ? "rgba(255,255,255,0.08)" : "rgba(4,38,26,0.1)";
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: REDUCED ? false : { duration: 300 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: INK,
          titleColor: "#ecfdf5",
          bodyColor: "#ecfdf5",
          borderColor: "#34d399",
          borderWidth: 2,
          cornerRadius: 0,
          padding: 10,
          titleFont: { family: fontFamily, weight: "bold" },
          bodyFont: { family: fontFamily },
          callbacks: { label: (ctx) => ` ${f.num.format(toNum(ctx.parsed?.y))} ${c.unit}` },
        },
      },
      scales: {
        x: { grid: { display: false }, border: { color: edge, width: 2 }, ticks: { color: text, maxRotation: 0, autoSkip: true, font: { family: fontFamily, weight: "bold" } } },
        y: { beginAtZero: true, grid: { color: grid }, border: { color: edge, width: 2 }, ticks: { color: text, precision: 0, font: { family: fontFamily, weight: "bold" } } },
      },
    };
  }, [darkMode, f, c.unit, fontFamily, edge]);

  const periodToggle = (
    <div className="flex items-center gap-1.5" role="group" aria-label={c.periodAria}>
      {PERIOD_KEYS.map((k) => (
        <button
          key={k}
          type="button"
          aria-pressed={period === k}
          onClick={() => setPeriod(k)}
          className={`${period === k ? BTN_PRIMARY : BTN_MD} h-8 uppercase`}
        >
          {c.periods[k]}
        </button>
      ))}
    </div>
  );

  return (
    <Panel title={c.title} subtitle={c.subtitle} icon={FiBarChart2} action={periodToggle}>
      <div ref={ref} className="relative h-56">
        {loading ? <LoadingBlock />
          : orders.length === 0 ? <EmptyBlock text={c.noData} />
          : seen ? <Suspense fallback={<ChartFallback />}><BarChart data={data} options={options} /></Suspense>
          : <ChartFallback />}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Insight label={c.total} value={f.num.format(total)} />
        <Insight label={c.best} value={best ? best.label : "-"} />
        <Insight
          label={c.trend}
          value={trend ? `${trend.up ? "+" : "-"}${f.num.format(Math.abs(trend.pct))}%` : "-"}
          tone={trend ? (trend.up ? "text-emerald-600 dark:text-emerald-300" : "text-red-500") : undefined}
        />
        <Insight label={c.completion} value={`${f.num.format(doneRate)}%`} />
      </div>
    </Panel>
  );
});



const BreakdownRow = memo(({ row }) => {
  const { f } = useL();
  return (
    <li className={`${PANEL} p-3`}>
      <div className="flex items-center gap-2.5">
        <span className="nb-line h-3 w-3 flex-shrink-0 border-2" style={{ background: row.color }} aria-hidden="true" />
        <span className="flex-1 truncate text-xs font-extrabold uppercase">{row.label}</span>
        <span className="text-sm font-extrabold tabular-nums">{f.num.format(row.count)}</span>
        <span className="nb-muted w-10 text-end text-[11px] font-bold tabular-nums">{f.num.format(row.pct)}%</span>
      </div>
      <div className="mt-2"><Meter pct={row.pct} color={row.color} className="h-2" /></div>
    </li>
  );
});



const TH = "px-3 py-2.5 text-[10px] font-extrabold uppercase rtl:tracking-normal";
const ROW_CLS = "nb-line border-b-2 last:border-b-0";
const PRICE_CLS = "whitespace-nowrap px-5 py-3 text-end text-xs font-extrabold tabular-nums";

const TableShell = ({ icon, tone, title, children }) => (
  <section className={`${CARD} min-w-0 overflow-hidden`}>
    <div className="nb-gray nb-line flex items-center gap-2.5 border-b-2 px-5 py-3.5">
      <IconTile icon={icon} tone={tone} className="h-9 w-9 flex-shrink-0" size={16} />
      <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">{title}</span></h3>
    </div>
    <div className="slim-scroll min-h-[260px] overflow-x-auto">{children}</div>
  </section>
);

const TableHead = ({ cols }) => (
  <thead>
    <tr className="nb-line border-b-2">
      {cols.map(([label, align], i) => (
        <th key={label} scope="col" className={`${TH} ${i === 0 || i === cols.length - 1 ? "px-5" : ""} ${align}`}>{label}</th>
      ))}
    </tr>
  </thead>
);

const StateRow = ({ children }) => (
  <tr>
    <td colSpan={3} className="px-6 py-8">{children}</td>
  </tr>
);

const OrderRow = memo(({ o }) => {
  const { t, f } = useL();
  const d = t.latestOrders;
  const fullName = [o.firstName, o.lastName].filter(Boolean).join(" ");
  return (
    <tr className={ROW_CLS}>
      <td className="px-5 py-3">
        <p className="text-xs font-extrabold">{fullName || d.unknownCustomer}</p>
        <p className="nb-muted mt-0.5 text-[11px] font-semibold" dir="ltr">{o.phoneNumber || "-"}</p>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-center"><StatusChip status={o.status} labels={t.orderStatus} /></td>
      <td className={PRICE_CLS}>{f.num.format(toNum(o.totalPrice))} {t.currency}</td>
    </tr>
  );
});

const LatestOrdersTable = memo(({ orders: all, loading, error, onRetry }) => {
  const { t } = useL();
  const d = t.latestOrders;
  const orders = useMemo(() => all.slice(0, 5), [all]);
  return (
    <TableShell icon={FiShoppingBag} tone="sky" title={d.title}>
      <table className="w-full text-start">
        <TableHead cols={[[d.customer, "text-start"], [d.status, "text-center"], [d.total, "text-end"]]} />
        <tbody>
          {loading ? <StateRow><LoadingBlock /></StateRow>
            : error && orders.length === 0 ? <StateRow><RetryBlock onRetry={onRetry} /></StateRow>
            : orders.length === 0 ? <StateRow><EmptyBlock text={d.empty} /></StateRow>
            : orders.map((o) => <OrderRow key={o.id} o={o} />)}
        </tbody>
      </table>
    </TableShell>
  );
});

const RepairRow = memo(({ r }) => {
  const { t, f } = useL();
  const d = t.latestRepairs;
  return (
    <tr className={ROW_CLS}>
      <td className="px-5 py-3">
        <p className="max-w-[200px] truncate text-xs font-extrabold">{r.description || d.noDescription}</p>
        <p className="nb-muted mt-0.5 text-[11px] font-semibold">{r.shopName || "-"}</p>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-center"><StatusChip status={r.status} labels={t.repairStatus} /></td>
      <td className={PRICE_CLS}>{f.num.format(toNum(r.price))} {t.currency}</td>
    </tr>
  );
});

const LatestRepairsTable = memo(({ reloadKey }) => {
  const { t } = useL();
  const d = t.latestRepairs;
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [localKey, setLocalKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    (async () => {
      try {
        const res = await api.get("/api/shops/repair-request", {
          params: { page: 0, size: 5, sort: "createdAt,desc" },
          signal: controller.signal,
        });
        const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
        if (!controller.signal.aborted) setRepairs(data.slice(0, 5));
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [reloadKey, localKey]);

  const retry = useCallback(() => { setLoading(true); setLocalKey((k) => k + 1); }, []);

  return (
    <TableShell icon={FiTool} tone="am" title={d.title}>
      <table className="w-full text-start">
        <TableHead cols={[[d.request, "text-start"], [d.status, "text-center"], [d.price, "text-end"]]} />
        <tbody>
          {loading ? <StateRow><LoadingBlock /></StateRow>
            : error && repairs.length === 0 ? <StateRow><RetryBlock onRetry={retry} /></StateRow>
            : repairs.length === 0 ? <StateRow><EmptyBlock text={d.empty} /></StateRow>
            : repairs.map((r) => <RepairRow key={r.id} r={r} />)}
        </tbody>
      </table>
    </TableShell>
  );
});



const POLL_MS = 60000;
const INITIAL_STATS = { totalSales: 0, todaySales: 0, totalOrders: 0, todayRepairs: 0, totalRepairs: 0 };

const mergeStats = (prev, patch) => {
  for (const k in patch) if (prev[k] !== patch[k]) return { ...prev, ...patch };
  return prev;
};

const ShopDashboard = ({ darkMode: darkModeProp }) => {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hookDark = useDarkMode();
  const darkMode = darkModeProp ?? hookDark;
  const loc = useShopLocale();
  const { language, L, dir, font } = loc;
  const isAr = loc.isAr ?? language === "ar";
  const t = L.dashboard;
  const f = getFmt(L.locale || (isAr ? "ar-EG" : "en-US"));
  const fontFamily = font?.fontFamily;
  const ctx = useMemo(() => ({ t, f, fontFamily, darkMode }), [t, f, fontFamily, darkMode]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fieldError, setFieldError] = useState(false);
  const [applied, setApplied] = useState({ startDate: "", endDate: "" });

  const [stats, setStats] = useState(INITIAL_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const appliedRef = useRef(applied);
  const rangeAbort = useRef(null);
  const liveAbort = useRef(null);
  const firstRun = useRef(true);
  const tRef = useRef(t);
  tRef.current = t;

  const { orders, loading: ordersLoading, error: ordersError, refresh: refreshOrders } = useOrders();

  useEffect(() => { document.title = t.docTitle; }, [t.docTitle]);

  useEffect(() => { if (!accessToken) navigate("/login"); }, [accessToken, navigate]);

  const handleStartChange = useCallback((v) => {
    if (v === "" || parseLocalInput(v)) { setStartDate(v); setFieldError(false); }
    else setFieldError(true);
  }, []);
  const handleEndChange = useCallback((v) => {
    if (v === "" || parseLocalInput(v)) { setEndDate(v); setFieldError(false); }
    else setFieldError(true);
  }, []);

  const rangeInvalid = useMemo(() => {
    const s = parseLocalInput(startDate);
    const e = parseLocalInput(endDate);
    return !!(s && e && s > e);
  }, [startDate, endDate]);
  const dateError = fieldError ? t.filter.invalidDate : rangeInvalid ? t.filter.rangeError : "";

  useEffect(() => {
    if (rangeInvalid) return undefined;
    const id = setTimeout(() => {
      setApplied((p) => (p.startDate === startDate && p.endDate === endDate ? p : { startDate, endDate }));
    }, 400);
    return () => clearTimeout(id);
  }, [startDate, endDate, rangeInvalid]);

  const fetchRange = useCallback(async () => {
    rangeAbort.current?.abort();
    const controller = new AbortController();
    rangeAbort.current = controller;
    const { startDate: s, endDate: e } = appliedRef.current;
    const payload = { startDate: s || null, endDate: e || null };
    const opts = { signal: controller.signal };

    const [sales, ordersTotal] = await Promise.allSettled([
      api.post("/api/shops/dashboard/sales/total", payload, opts),
      api.post("/api/shops/dashboard/orders/total", payload, opts),
    ]);
    if (controller.signal.aborted) return undefined;

    const patch = {};
    if (sales.status === "fulfilled") patch.totalSales = toNum(sales.value.data);
    if (ordersTotal.status === "fulfilled") patch.totalOrders = toNum(ordersTotal.value.data);
    setStats((prev) => mergeStats(prev, patch));
    return sales.status === "fulfilled" && ordersTotal.status === "fulfilled";
  }, []);

  const fetchLive = useCallback(async () => {
    liveAbort.current?.abort();
    const controller = new AbortController();
    liveAbort.current = controller;
    const opts = { signal: controller.signal };

    const [salesStats, repairsStats, repairsTotal] = await Promise.allSettled([
      api.get("/api/shops/dashboard/sales/stats", opts),
      api.get("/api/shops/dashboard/repairs/stats", opts),
      api.get("/api/shops/dashboard/repairs/total", opts),
    ]);
    if (controller.signal.aborted) return undefined;

    const patch = {};
    if (salesStats.status === "fulfilled") patch.todaySales = toNum(salesStats.value.data?.todaySales);
    if (repairsStats.status === "fulfilled") patch.todayRepairs = toNum(repairsStats.value.data?.todayRepairs);
    if (repairsTotal.status === "fulfilled") patch.totalRepairs = toNum(repairsTotal.value.data);
    setStats((prev) => mergeStats(prev, patch));
    return [salesStats, repairsStats, repairsTotal].every((r) => r.status === "fulfilled");
  }, []);

  const loadStats = useCallback(async ({ range = true, live = true, silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    const [rangeOk, liveOk] = await Promise.all([
      range ? fetchRange() : true,
      live ? fetchLive() : true,
    ]);
    if (rangeOk === undefined || liveOk === undefined) return;
    setStatsError(!(rangeOk && liveOk));
    setLastUpdated(new Date());
    setIsLoading(false);
  }, [fetchRange, fetchLive]);

  useEffect(() => {
    appliedRef.current = applied;
    if (firstRun.current) { firstRun.current = false; return; }
    loadStats({ live: false });
  }, [applied, loadStats]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(() => { if (!document.hidden) loadStats({ silent: true }); }, POLL_MS);
    return () => {
      clearInterval(interval);
      rangeAbort.current?.abort();
      liveAbort.current?.abort();
    };
  }, [loadStats]);

  const resetDates = useCallback(() => {
    setStartDate("");
    setEndDate("");
    setFieldError(false);
    toast({ icon: "success", title: tRef.current.filter.resetToast });
  }, []);

  const [repairsKey, setRepairsKey] = useState(0);
  const refreshAll = useCallback(() => {
    loadStats();
    refreshOrders();
    setRepairsKey((k) => k + 1);
  }, [loadStats, refreshOrders]);

  const goTo = useCallback((to) => navigate(to), [navigate]);

  const { statusRows, doneRate } = useMemo(() => {
    const counts = new Map();
    for (const o of orders) {
      const k = o.status ? normStatus(o.status).slice(0, 24) : "UNKNOWN";
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    const sum = orders.length;
    const rows = [...counts]
      .map(([key, count]) => ({
        key,
        count,
        pct: sum ? Math.round((count / sum) * 100) : 0,
        color: getStatusStyle(key).hex,
        label: t.orderStatus[key] || (key === "UNKNOWN" ? t.unknown : key),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    const done = (counts.get("DELIVERED") || 0) + (counts.get("COMPLETED") || 0);
    return { statusRows: rows, doneRate: sum ? Math.round((done / sum) * 100) : 0 };
  }, [orders, t]);

  const statCards = useMemo(() => {
    const price = (v) => `${f.num.format(v)} ${t.currency}`;
    const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);
    return [
      { key: "totalSales",   value: price(stats.totalSales) },
      { key: "todaySales",   value: price(stats.todaySales), percent: pct(stats.todaySales, stats.totalSales) },
      { key: "totalOrders",  value: f.num.format(stats.totalOrders) },
      { key: "todayRepairs", value: f.num.format(stats.todayRepairs), percent: pct(stats.todayRepairs, stats.totalRepairs) },
      { key: "totalRepairs", value: f.num.format(stats.totalRepairs), wide: true },
    ].map((c) => ({
      ...c,
      meta: STAT_META[c.key],
      label: t.stats[c.key].label,
      caption: t.stats[c.key].caption,
    }));
  }, [stats, t, f]);

  const showSkeleton = isLoading && !lastUpdated;
  const hasError = statsError || ordersError;

  const wrapperProps = {
    dir,
    lang: language,
    style: font,
    className: "nb-page min-h-screen py-6 lg:ps-64 mt-16 text-start",
  };

  return (
    <LocaleCtx.Provider value={ctx}>
      <div {...wrapperProps}>
        <style>{PAGE_CSS}</style>
        <Defs3D />
        <Toaster darkMode={darkMode} />

        <div key={language} className="lang-fade mx-auto max-w-7xl space-y-6 px-4 sm:px-6">

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide rtl:tracking-normal">
                <span className="nb-bar" aria-hidden="true" />
                <FiCalendar size={12} aria-hidden="true" /> {f.todayLong.format(new Date())}
              </p>
              <h1 className="mt-2 text-2xl font-extrabold leading-[1.15] tracking-tight rtl:tracking-normal sm:text-3xl">
                <span className="nb-ul">{t.title}</span>
              </h1>
              <p className="nb-muted mt-2 text-xs font-semibold">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="nb-chip !normal-case" role="status" aria-live="polite">
                {t.lastUpdated}: <span className="tabular-nums">{lastUpdated ? f.time.format(lastUpdated) : "..."}</span>
              </div>
              <button type="button" onClick={refreshAll} aria-label={t.refresh} title={t.refresh} className={`${BTN_MD} h-10 uppercase`}>
                <FiRefreshCw size={14} className={isLoading ? "animate-spin motion-reduce:animate-none" : ""} /> {t.refresh}
              </button>
            </div>
          </div>

          {hasError && (
            <div role="alert" className="nb-card flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 !border-red-500">
              <p className="flex items-center gap-2 text-[11px] font-bold text-red-600 dark:text-red-300">
                <FiAlertCircle size={14} className="flex-shrink-0" aria-hidden="true" />
                {t.errors.partial}
              </p>
              <button type="button" onClick={refreshAll} className={`${BTN_MD} h-8 uppercase`}>{t.retry}</button>
            </div>
          )}

          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={handleStartChange}
            onEndChange={handleEndChange}
            onReset={resetDates}
            error={dateError}
            loading={isLoading && !!lastUpdated}
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2 lg:col-span-2" aria-busy={showSkeleton}>
              {showSkeleton
                ? [...Array(5)].map((_, i) => <SkeletonBlock key={i} className={`h-[124px] ${i === 4 ? "sm:col-span-2" : ""}`} />)
                : statCards.map(({ key, ...c }) => <StatTile key={key} {...c} onNavigate={goTo} />)}
            </div>
            <MiniCalendar />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Panel title={t.quick.title} subtitle={t.quick.subtitle} icon={FiZap}>
              <ul className="space-y-2.5">
                {QUICK_LINKS.map((q) => (
                  <QuickLink key={q.path} item={q} title={t.quick.items[q.key].title} desc={t.quick.items[q.key].desc} onOpen={goTo} />
                ))}
              </ul>
            </Panel>

            <OrdersChartCard orders={orders} loading={ordersLoading} doneRate={doneRate} />

            <Panel title={t.breakdown.title} subtitle={t.breakdown.subtitle} icon={FiPieChart}>
              {ordersLoading ? <LoadingBlock />
                : statusRows.length === 0 ? <EmptyBlock text={t.breakdown.empty} />
                : (
                  <ul className="space-y-2.5">
                    {statusRows.map((r) => <BreakdownRow key={r.key} row={r} />)}
                  </ul>
                )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <LatestOrdersTable orders={orders} loading={ordersLoading} error={ordersError} onRetry={refreshOrders} />
            <LatestRepairsTable reloadKey={repairsKey} />
          </div>
        </div>
      </div>
    </LocaleCtx.Provider>
  );
};

export default memo(ShopDashboard);