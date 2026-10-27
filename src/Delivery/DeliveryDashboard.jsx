import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo, lazy, Suspense, createContext, useContext,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  FiActivity, FiTruck, FiTool, FiPackage, FiRefreshCw, FiCalendar, FiAlertCircle,
  FiChevronLeft, FiChevronRight, FiClipboard, FiSettings, FiZap, FiPieChart, FiBarChart2,
} from "react-icons/fi";
import { getAvailableOrders, getAvailableRepairs, getMyDeliveries, getMyRepairs } from "../common/api/deliveryApi";
import { UI3D_CSS, Defs3D } from "../components/user/Ui3D";
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from "../components/user/UiExtras";
import {
  BTN_ICON, BTN_MD, CARD, PANEL, SCROLL_CSS, useDarkMode, IconTile,
} from "../components/shop/TableKit";
import { useAppLanguage } from "../common/utils/useAppLanguage";
import { getFontStyle, ensureShopAssets } from "../common/utils/shopFonts";

ensureShopAssets();

const PAGE_CSS = UI3D_CSS + EXTRAS_CSS + SCROLL_CSS;
const INK = "#04261a";
const REFRESH_INTERVAL = 60_000;
const MIN_GAP = 15_000;
const MAX_INTERVAL = 300_000;
const CACHE_KEY = "delivery_dash_v1";
const REDUCED = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400";
const KEYS = ["availableOrders", "myOrders", "availableRepairs", "myRepairs"];

const Chart = lazy(async () => {
  const [cjs, rc] = await Promise.all([import("chart.js"), import("react-chartjs-2")]);
  cjs.Chart.register(cjs.CategoryScale, cjs.LinearScale, cjs.BarElement, cjs.Tooltip, cjs.ArcElement);
  const { Doughnut, Bar } = rc;
  return {
    default: ({ type, data, options }) =>
      type === "bar" ? <Bar data={data} options={options} /> : <Doughnut data={data} options={options} />,
  };
});

const EN = {
  locale: "en-US",
  docTitle: "Delivery Dashboard | Tech Restore",
  title: "Delivery Control",
  subtitle: "Pick up orders and repairs and track your active work across the Tech & Restore platform.",
  lastUpdated: "Last updated",
  refresh: "Refresh",
  retry: "Retry",
  loadingAria: "Loading",
  currency: "EGP",
  syncIssue: "Sync issue detected",
  errors: { partial: "Some data could not be loaded. Check your connection and try again." },
  stats: {
    availableOrders: { label: "Available Orders", caption: "Ready for pickup" },
    myOrders: { label: "Active Deliveries", caption: "In progress" },
    availableRepairs: { label: "Pending Repairs", caption: "Awaiting service" },
    myRepairs: { label: "Active Repairs", caption: "Being handled" },
  },
  statShare: "of total workload",
  quick: {
    title: "Quick Access",
    subtitle: "Jump straight to a work area",
    items: {
      availableOrders: { title: "Available Orders", desc: "Orders ready for pickup" },
      availableRepairs: { title: "Available Repairs", desc: "Repairs awaiting an agent" },
      myOrders: { title: "Assigned Orders", desc: "Deliveries you are handling" },
      myRepairs: { title: "Assigned Repairs", desc: "Repairs you are handling" },
      profile: { title: "Agent Profile", desc: "Your details and settings" },
    },
  },
  queue: {
    title: "Queue Overview",
    subtitle: "Totals side by side",
    total: "Total workload",
    largest: "Largest segment",
    open: "Open items",
    mine: "My active items",
    unit: "items",
    noData: "No workload yet",
  },
  breakdown: {
    title: "Workload Breakdown",
    subtitle: "Share of each item type",
    center: "Total workload",
    empty: "No workload yet",
  },
  labels: {
    availableOrders: "Open Orders",
    myOrders: "My Orders",
    availableRepairs: "Open Repairs",
    myRepairs: "My Repairs",
  },
  latest: {
    title: "Latest Deliveries",
    activeHint: "Your most recent activity",
    idleHint: "No active delivery right now",
    history: "Full History",
    empty: "No recent delivery activity",
    customer: "Customer",
    id: "ID",
    type: "Type",
    destination: "Destination",
    amount: "Amount",
    status: "Status",
    updated: "Last Updated",
    order: "Order",
    repair: "Repair",
    defaultCustomer: "Customer",
  },
  status: {
    PENDING: "Pending",
    ASSIGNED: "Assigned",
    PICKED_UP: "Picked up",
    OUT_FOR_DELIVERY: "Out for delivery",
    IN_PROGRESS: "In progress",
    DELIVERED: "Delivered",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    FAILED: "Failed",
    REJECTED: "Rejected",
  },
  unknown: "Unknown",
  calendar: { prev: "Previous month", next: "Next month", today: "Today" },
  weekdays: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
};

const AR = {
  locale: "ar-EG",
  docTitle: "لوحة التوصيل | Tech Restore",
  title: "التحكم في التوصيل",
  subtitle: "استلم الطلبات وطلبات الصيانة وتابع أعمالك الجارية على منصة Tech & Restore.",
  lastUpdated: "آخر تحديث",
  refresh: "تحديث",
  retry: "إعادة المحاولة",
  loadingAria: "جارٍ التحميل",
  currency: "ج.م",
  syncIssue: "تم رصد مشكلة في المزامنة",
  errors: { partial: "تعذر تحميل بعض البيانات. تحقق من اتصالك وحاول مرة أخرى." },
  stats: {
    availableOrders: { label: "الطلبات المتاحة", caption: "جاهزة للاستلام" },
    myOrders: { label: "التوصيلات الجارية", caption: "قيد التنفيذ" },
    availableRepairs: { label: "الصيانة المعلقة", caption: "بانتظار الخدمة" },
    myRepairs: { label: "الصيانة الجارية", caption: "قيد المعالجة" },
  },
  statShare: "من إجمالي العمل",
  quick: {
    title: "وصول سريع",
    subtitle: "انتقل مباشرة إلى منطقة العمل",
    items: {
      availableOrders: { title: "الطلبات المتاحة", desc: "طلبات جاهزة للاستلام" },
      availableRepairs: { title: "الصيانة المتاحة", desc: "صيانة بانتظار مندوب" },
      myOrders: { title: "الطلبات المسندة", desc: "التوصيلات التي تتولاها" },
      myRepairs: { title: "الصيانة المسندة", desc: "الصيانة التي تتولاها" },
      profile: { title: "ملف المندوب", desc: "بياناتك وإعداداتك" },
    },
  },
  queue: {
    title: "نظرة على الطابور",
    subtitle: "الإجماليات جنبًا إلى جنب",
    total: "إجمالي العمل",
    largest: "أكبر قسم",
    open: "عناصر مفتوحة",
    mine: "عناصري الجارية",
    unit: "عنصر",
    noData: "لا يوجد عمل بعد",
  },
  breakdown: {
    title: "توزيع العمل",
    subtitle: "حصة كل نوع",
    center: "إجمالي العمل",
    empty: "لا يوجد عمل بعد",
  },
  labels: {
    availableOrders: "طلبات مفتوحة",
    myOrders: "طلباتي",
    availableRepairs: "صيانة مفتوحة",
    myRepairs: "صيانتي",
  },
  latest: {
    title: "أحدث التوصيلات",
    activeHint: "أحدث نشاط لك",
    idleHint: "لا توجد توصيلة نشطة حاليًا",
    history: "السجل الكامل",
    empty: "لا يوجد نشاط توصيل حديث",
    customer: "العميل",
    id: "الرقم",
    type: "النوع",
    destination: "الوجهة",
    amount: "المبلغ",
    status: "الحالة",
    updated: "آخر تحديث",
    order: "طلب",
    repair: "صيانة",
    defaultCustomer: "عميل",
  },
  status: {
    PENDING: "قيد الانتظار",
    ASSIGNED: "مسند",
    PICKED_UP: "تم الاستلام",
    OUT_FOR_DELIVERY: "في الطريق",
    IN_PROGRESS: "قيد التنفيذ",
    DELIVERED: "تم التوصيل",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
    FAILED: "فشل",
    REJECTED: "مرفوض",
  },
  unknown: "غير معروف",
  calendar: { prev: "الشهر السابق", next: "الشهر التالي", today: "اليوم" },
  weekdays: ["ح", "ن", "ث", "ر", "خ", "ج", "س"],
};

const LocaleCtx = createContext(null);
const useL = () => useContext(LocaleCtx);

const FMT_CACHE = {};
const getFmt = (locale) =>
  (FMT_CACHE[locale] ||= {
    num: new Intl.NumberFormat(locale),
    dateTime: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    time: new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    longMonth: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    todayLong: new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }),
  });

const num = (n) => { const v = Number(n); return Number.isFinite(v) ? v : 0; };
const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : "");
const toTime = (v) => { const t = new Date(v).getTime(); return Number.isNaN(t) ? 0 : t; };
const shortId = (id) => String(id ?? "").slice(-8);
const normStatus = (s) => String(s || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
const humanStatus = (s) =>
  String(s || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const statusStyle = (status) => {
  const s = normStatus(status).toLowerCase();
  if (/(cancel|fail|reject|delay)/.test(s)) return { hex: "#ef4444", ink: "#ffffff" };
  if (/(pending|wait)/.test(s)) return { hex: "#f59e0b", ink: INK };
  if (/out_for/.test(s)) return { hex: "#6366f1", ink: "#ffffff" };
  if (/(deliver|complete|done)/.test(s)) return { hex: "#34d399", ink: INK };
  if (/(assign|pick|progress)/.test(s)) return { hex: "#3b82f6", ink: "#ffffff" };
  return { hex: "#9ca3af", ink: INK };
};
const isFinished = (status) => /(delivered|cancel|complete|fail)/i.test(String(status || ""));

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const d = jwtDecode(token);
    return !d.exp || d.exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

const endSession = () => {
  try {
    const dark = localStorage.getItem("darkMode");
    const lang = localStorage.getItem("appLanguage");
    localStorage.clear();
    sessionStorage.clear();
    if (dark) localStorage.setItem("darkMode", dark);
    if (lang) localStorage.setItem("appLanguage", lang);
  } catch {}
};

const readCache = () => {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    return c && c.data ? c : null;
  } catch {
    return null;
  }
};

const asList = (v) => {
  const d = v?.data ?? v;
  if (Array.isArray(d)) return d;
  return Array.isArray(d?.content) ? d.content : [];
};

const normalize = (list, type) =>
  list.map((o) => ({
    key: `${type}-${o.id}`,
    id: o.id,
    type,
    customer: [o.customerName, o.customer?.name, o.user?.name, o.userName, o.fullName].map(str).find(Boolean) || "",
    destination:
      [o.destination, o.shippingAddress?.city, o.deliveryAddress?.city, o.address?.city, o.city, o.address]
        .map(str)
        .find(Boolean) || "",
    amount: Number(type === "order" ? o.totalPrice : o.price) || 0,
    status: o.status || "",
    time: toTime(o.updatedAt || o.createdAt),
  }));

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

const ChartFallback = () => <div className="nb-gray nb-line h-full w-full animate-pulse border-2 motion-reduce:animate-none" />;

const ChartBox = memo(({ className, children }) => {
  const [ref, seen] = useInView();
  return (
    <div ref={ref} className={`relative ${className}`}>
      {seen ? <Suspense fallback={<ChartFallback />}>{children}</Suspense> : <ChartFallback />}
    </div>
  );
});

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

const StatusChip = ({ status }) => {
  const { t } = useL();
  const st = statusStyle(status);
  const key = normStatus(status);
  return (
    <span className="nb-chip !normal-case" style={{ background: st.hex, color: st.ink }}>
      {t.status[key] || humanStatus(status) || t.unknown}
    </span>
  );
};

const STAT_META = {
  availableOrders: { icon: FiPackage, tone: "em", color: "#34d399", to: "/delivery/available-orders" },
  myOrders: { icon: FiTruck, tone: "te", color: "#2dd4bf", to: "/delivery/my-deliveries" },
  availableRepairs: { icon: FiTool, tone: "am", color: "#fbbf24", to: "/delivery/available-repair-requests" },
  myRepairs: { icon: FiActivity, tone: "vi", color: "#a78bfa", to: "/delivery/my-repairs" },
};

const StatTile = memo(({ meta, label, caption, value, percent, shareLabel, onNavigate }) => (
  <button
    type="button"
    onClick={() => onNavigate(meta.to)}
    className={`${CARD} min-w-0 p-4 text-start transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none ${FOCUS}`}
  >
    <div className="flex items-center gap-3">
      <IconTile icon={meta.icon} tone={meta.tone} className="h-11 w-11 flex-shrink-0" size={19} />
      <div className="min-w-0">
        <p className="nb-muted truncate text-[10px] font-bold uppercase">{label}</p>
        <p className="truncate text-xl font-extrabold leading-tight tabular-nums">{value}</p>
      </div>
    </div>
    <div className="mt-3 flex items-center gap-2" role="img" aria-label={`${percent}% ${shareLabel}`}>
      <Meter pct={percent} color={meta.color} className="h-2.5 flex-1" />
      <span className="w-9 text-end text-[10px] font-extrabold tabular-nums">{percent}%</span>
    </div>
    <p className="nb-muted mt-2 truncate text-[11px] font-semibold">{caption}</p>
  </button>
));

const QUICK_LINKS = [
  { key: "availableOrders", path: "/delivery/available-orders", icon: FiPackage, tone: "em" },
  { key: "availableRepairs", path: "/delivery/available-repair-requests", icon: FiTool, tone: "am" },
  { key: "myOrders", path: "/delivery/my-deliveries", icon: FiClipboard, tone: "sky" },
  { key: "myRepairs", path: "/delivery/my-repairs", icon: FiTool, tone: "vi" },
  { key: "profile", path: "/delivery/profile", icon: FiSettings, tone: "te" },
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
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

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

const Insight = memo(({ label, value }) => (
  <div className={`${PANEL} min-w-0 px-3.5 py-3`}>
    <p className="nb-muted truncate text-[10px] font-bold uppercase">{label}</p>
    <p className="mt-0.5 truncate text-lg font-extrabold tabular-nums">{value}</p>
  </div>
));

const BreakdownRow = memo(({ row }) => {
  const { f } = useL();
  return (
    <li className={`${PANEL} p-3`}>
      <div className="flex items-center gap-2.5">
        <span className="nb-line h-3 w-3 flex-shrink-0 border-2" style={{ background: row.color }} aria-hidden="true" />
        <span className="flex-1 truncate text-xs font-extrabold uppercase">{row.label}</span>
        <span className="text-sm font-extrabold tabular-nums">{f.num.format(row.value)}</span>
        <span className="nb-muted w-10 text-end text-[11px] font-bold tabular-nums">{f.num.format(row.percent)}%</span>
      </div>
      <div className="mt-2"><Meter pct={row.percent} color={row.color} className="h-2" /></div>
    </li>
  );
});

const TH = "px-3 py-2.5 text-[10px] font-extrabold uppercase rtl:tracking-normal";
const ROW_CLS = "nb-line border-b-2 last:border-b-0";

const DeliveryRow = memo(({ row }) => {
  const { t, f } = useL();
  const d = t.latest;
  const name = row.customer || d.defaultCustomer;
  return (
    <tr className={ROW_CLS}>
      <td className="px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="nb-tile h-8 w-8 text-xs font-extrabold uppercase">{name.charAt(0)}</span>
          <span className="max-w-[160px] truncate text-xs font-extrabold">{name}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs font-bold" dir="ltr">#{shortId(row.id)}</td>
      <td className="whitespace-nowrap px-3 py-3 text-xs font-bold">{row.type === "order" ? d.order : d.repair}</td>
      <td className="nb-muted hidden max-w-[180px] truncate px-3 py-3 text-xs font-semibold md:table-cell">{row.destination || "—"}</td>
      <td className="whitespace-nowrap px-3 py-3 text-xs font-extrabold tabular-nums">{f.num.format(row.amount)} {t.currency}</td>
      <td className="whitespace-nowrap px-3 py-3"><StatusChip status={row.status} /></td>
      <td className="nb-muted whitespace-nowrap px-5 py-3 text-[11px] font-semibold">
        {row.time ? f.dateTime.format(new Date(row.time)) : "—"}
      </td>
    </tr>
  );
});

const LatestTable = memo(({ latest, hasActive, loading, initialLoading, onRefresh }) => {
  const { t } = useL();
  const d = t.latest;
  return (
    <section className={`${CARD} min-w-0 overflow-hidden`} aria-label={d.title}>
      <div className="nb-gray nb-line flex flex-wrap items-center justify-between gap-3 border-b-2 px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconTile icon={FiTruck} tone="em" className="h-9 w-9 flex-shrink-0" size={16} />
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">{d.title}</span></h3>
            <p className="nb-muted mt-1.5 text-[11px] font-semibold">{hasActive ? d.activeHint : d.idleHint}</p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button type="button" onClick={onRefresh} disabled={loading} aria-label={t.refresh} title={t.refresh} className={BTN_ICON}>
            <FiRefreshCw size={14} className={loading ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" />
          </button>
          <Link to="/delivery/my-deliveries" className={`${BTN_MD} h-8 uppercase`}>{d.history}</Link>
        </div>
      </div>
      <div className="slim-scroll min-h-[260px] overflow-x-auto">
        <table className="w-full min-w-[720px] text-start">
          <thead>
            <tr className="nb-line border-b-2">
              <th scope="col" className={`${TH} px-5 text-start`}>{d.customer}</th>
              <th scope="col" className={`${TH} text-start`}>{d.id}</th>
              <th scope="col" className={`${TH} text-start`}>{d.type}</th>
              <th scope="col" className={`${TH} hidden text-start md:table-cell`}>{d.destination}</th>
              <th scope="col" className={`${TH} text-start`}>{d.amount}</th>
              <th scope="col" className={`${TH} text-start`}>{d.status}</th>
              <th scope="col" className={`${TH} px-5 text-start`}>{d.updated}</th>
            </tr>
          </thead>
          <tbody>
            {initialLoading ? (
              <tr><td colSpan={7} className="px-6 py-8"><LoadingBlock /></td></tr>
            ) : latest.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8"><EmptyBlock text={d.empty} /></td></tr>
            ) : (
              latest.map((r) => <DeliveryRow key={r.key} row={r} />)
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
});

const INITIAL_STATS = { availableOrders: 0, myOrders: 0, availableRepairs: 0, myRepairs: 0 };

const DeliveryDashboard = ({ darkMode: darkModeProp }) => {
  const navigate = useNavigate();
  const hookDark = useDarkMode();
  const darkMode = darkModeProp ?? hookDark;
  const language = useAppLanguage();
  const isAr = language === "ar";
  const t = isAr ? AR : EN;
  const dir = isAr ? "rtl" : "ltr";
  const font = useMemo(() => getFontStyle(language), [language]);
  const fontFamily = font?.fontFamily;
  const f = getFmt(t.locale);
  const ctx = useMemo(() => ({ t, f, fontFamily, darkMode }), [t, f, fontFamily, darkMode]);

  const tokenRef = useRef(null);
  if (tokenRef.current === null) {
    try { tokenRef.current = localStorage.getItem("authToken") || ""; } catch { tokenRef.current = ""; }
  }
  const cached = useMemo(() => readCache(), []);

  const [stats, setStats] = useState(() => cached?.data ?? null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => (cached?.ts ? new Date(cached.ts) : null));

  const statsRef = useRef(stats);
  statsRef.current = stats;
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const lastRef = useRef(cached?.ts || 0);
  const failRef = useRef(0);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => { document.title = t.docTitle; }, [t.docTitle]);

  useEffect(() => {
    if (isTokenExpired(tokenRef.current)) {
      endSession();
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getAvailableOrders(),
        getAvailableRepairs(),
        getMyDeliveries(),
        getMyRepairs(),
      ]);
      if (!mountedRef.current) return;

      const unauthorized = results.some(
        (x) => x.status === "rejected" && [401, 403].includes(x.reason?.response?.status)
      );
      if (unauthorized) {
        endSession();
        navigate("/login", { replace: true });
        return;
      }
      if (results.every((x) => x.status === "rejected")) throw new Error("sync");

      const [ao, ar, mo, mr] = results.map((x) => (x.status === "fulfilled" ? asList(x.value) : null));
      const prev = statsRef.current;
      const next = {
        availableOrders: ao ? ao.length : prev?.availableOrders ?? 0,
        myOrders: mo ? mo.length : prev?.myOrders ?? 0,
        availableRepairs: ar ? ar.length : prev?.availableRepairs ?? 0,
        myRepairs: mr ? mr.length : prev?.myRepairs ?? 0,
      };

      const now = Date.now();
      lastRef.current = now;
      failRef.current = 0;
      setFailed(results.some((x) => x.status === "rejected"));
      setLastUpdated(new Date(now));
      setStats(prev && KEYS.every((k) => prev[k] === next[k]) ? prev : next);

      if (mo || mr) {
        setItems(
          [...normalize((mo || []).slice(0, 15), "order"), ...normalize((mr || []).slice(0, 15), "repair")]
            .sort((a, b) => b.time - a.time)
        );
      }
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: next, ts: now })); } catch {}
    } catch {
      if (!mountedRef.current) return;
      setFailed(true);
      if (failRef.current++ === 0) toast({ icon: "warning", title: tRef.current.syncIssue });
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let timer;
    let stopped = false;
    const stale = (ms) => Date.now() - lastRef.current > ms;
    const run = async () => {
      if (stopped) return;
      if (!document.hidden && stale(MIN_GAP)) await fetchData();
      if (stopped) return;
      const wait = Math.min(REFRESH_INTERVAL * 2 ** failRef.current, MAX_INTERVAL) + Math.random() * 3000;
      timer = setTimeout(run, wait);
    };
    const onVisible = () => { if (!document.hidden && stale(REFRESH_INTERVAL)) fetchData(); };
    run();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    lastRef.current = 0;
    fetchData();
  }, [fetchData]);

  const goTo = useCallback((to) => navigate(to), [navigate]);

  const current = stats || INITIAL_STATS;
  const initialLoading = loading && !stats;
  const values = useMemo(() => KEYS.map((k) => num(current[k])), [current]);
  const total = useMemo(() => values.reduce((a, b) => a + b, 0), [values]);

  const rows = useMemo(
    () => KEYS.map((k, i) => ({
      key: k,
      label: t.labels[k],
      value: values[i],
      color: STAT_META[k].color,
      percent: total ? Math.round((values[i] / total) * 100) : 0,
    })),
    [values, total, t]
  );

  const statCards = useMemo(
    () => rows.map((r) => ({
      key: r.key,
      meta: STAT_META[r.key],
      label: t.stats[r.key].label,
      caption: t.stats[r.key].caption,
      value: f.num.format(r.value),
      percent: r.percent,
      shareLabel: t.statShare,
    })),
    [rows, t, f]
  );

  const insights = useMemo(() => {
    const top = rows.reduce((a, b) => (b.value > a.value ? b : a), rows[0]);
    return [
      { label: t.queue.total, value: f.num.format(total) },
      { label: t.queue.largest, value: total ? top.label : "-" },
      { label: t.queue.open, value: f.num.format(values[0] + values[2]) },
      { label: t.queue.mine, value: f.num.format(values[1] + values[3]) },
    ];
  }, [rows, total, values, t, f]);

  const latest = useMemo(() => items.slice(0, 5), [items]);
  const hasActive = useMemo(() => items.some((i) => !isFinished(i.status)), [items]);

  const edge = darkMode ? "rgba(236,253,245,0.9)" : INK;
  const labels = useMemo(() => rows.map((r) => r.label), [rows]);
  const colors = useMemo(() => rows.map((r) => r.color), [rows]);

  const doughnutData = useMemo(() => ({
    labels,
    datasets: [{ data: values, backgroundColor: colors, borderColor: edge, borderWidth: 2, hoverOffset: 6 }],
  }), [labels, values, colors, edge]);

  const barData = useMemo(() => ({
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderColor: edge,
      borderWidth: 2,
      borderRadius: 0,
      borderSkipped: false,
      maxBarThickness: 44,
    }],
  }), [labels, values, colors, edge]);

  const tooltip = useMemo(() => ({
    backgroundColor: INK,
    titleColor: "#ecfdf5",
    bodyColor: "#ecfdf5",
    borderColor: "#34d399",
    borderWidth: 2,
    cornerRadius: 0,
    padding: 10,
    titleFont: { family: fontFamily, weight: "bold" },
    bodyFont: { family: fontFamily },
    callbacks: {
      label: (ctx) => {
        const v = num(ctx.parsed?.y ?? ctx.parsed);
        const p = total ? Math.round((v / total) * 100) : 0;
        return ` ${f.num.format(v)} ${t.queue.unit} (${f.num.format(p)}%)`;
      },
    },
  }), [fontFamily, total, f, t.queue.unit]);

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    animation: REDUCED ? false : { duration: 300 },
    plugins: { legend: { display: false }, tooltip },
  }), [tooltip]);

  const barOptions = useMemo(() => {
    const text = darkMode ? "#d1d5db" : "#1f2937";
    const grid = darkMode ? "rgba(255,255,255,0.08)" : "rgba(4,38,26,0.1)";
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: REDUCED ? false : { duration: 300 },
      plugins: { legend: { display: false }, tooltip },
      scales: {
        x: { grid: { display: false }, border: { color: edge, width: 2 }, ticks: { color: text, maxRotation: 0, autoSkip: true, font: { family: fontFamily, weight: "bold" } } },
        y: { beginAtZero: true, grid: { color: grid }, border: { color: edge, width: 2 }, ticks: { color: text, precision: 0, font: { family: fontFamily, weight: "bold" } } },
      },
    };
  }, [darkMode, edge, fontFamily, tooltip]);

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
              <p className="nb-muted mt-2 max-w-2xl text-xs font-semibold">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="nb-chip !normal-case" role="status" aria-live="polite">
                {t.lastUpdated}: <span className="tabular-nums">{lastUpdated ? f.time.format(lastUpdated) : "..."}</span>
              </div>
              <button type="button" onClick={refresh} aria-label={t.refresh} title={t.refresh} className={`${BTN_MD} h-10 uppercase`}>
                <FiRefreshCw size={14} className={loading ? "animate-spin motion-reduce:animate-none" : ""} /> {t.refresh}
              </button>
            </div>
          </div>

          {failed && (
            <div role="alert" className="nb-card flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 !border-red-500">
              <p className="flex items-center gap-2 text-[11px] font-bold text-red-600 dark:text-red-300">
                <FiAlertCircle size={14} className="flex-shrink-0" aria-hidden="true" />
                {t.errors.partial}
              </p>
              <button type="button" onClick={refresh} className={`${BTN_MD} h-8 uppercase`}>{t.retry}</button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2 lg:col-span-2" aria-busy={initialLoading}>
              {initialLoading
                ? KEYS.map((k) => <SkeletonBlock key={k} className="h-[124px]" />)
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

            <Panel title={t.queue.title} subtitle={t.queue.subtitle} icon={FiBarChart2}>
              {initialLoading ? <div className="h-56"><LoadingBlock /></div>
                : total === 0 ? <div className="h-56"><EmptyBlock text={t.queue.noData} /></div>
                : (
                  <ChartBox className="h-56">
                    <Chart type="bar" data={barData} options={barOptions} />
                  </ChartBox>
                )}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {insights.map((i) => <Insight key={i.label} {...i} />)}
              </div>
            </Panel>

            <Panel title={t.breakdown.title} subtitle={t.breakdown.subtitle} icon={FiPieChart}>
              {initialLoading ? <div className="h-44"><LoadingBlock /></div>
                : total === 0 ? <div className="h-44"><EmptyBlock text={t.breakdown.empty} /></div>
                : (
                  <ChartBox className="h-44">
                    <Chart type="doughnut" data={doughnutData} options={doughnutOptions} />
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold tabular-nums">{f.num.format(total)}</span>
                      <span className="nb-muted text-[10px] font-bold uppercase">{t.breakdown.center}</span>
                    </div>
                  </ChartBox>
                )}
              <ul className="mt-4 space-y-2.5">
                {rows.map((r) => <BreakdownRow key={r.key} row={r} />)}
              </ul>
            </Panel>
          </div>

          <LatestTable
            latest={latest}
            hasActive={hasActive}
            loading={loading}
            initialLoading={initialLoading}
            onRefresh={refresh}
          />
        </div>
      </div>
    </LocaleCtx.Provider>
  );
};

export default memo(DeliveryDashboard);