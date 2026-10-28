import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo, lazy, Suspense,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity, FiZap, FiShoppingBag, FiTool, FiRefreshCw, FiCalendar,
  FiAlertCircle, FiChevronLeft, FiChevronRight, FiPackage, FiBox, FiTag,
  FiCreditCard, FiBarChart2, FiTarget, FiFilter, FiDollarSign, FiAlertTriangle,
  FiMessageSquare, FiStar, FiCheckCircle,
} from "react-icons/fi";
import api from "../common/api/api";
import { chatApi, parseCount } from "../common/services/chatApi";
import { fetchOverview, fetchToday } from "../common/api/shopReports";
import useAuthStore from "../common/store/Auth";
import { UI3D_CSS, Defs3D } from "../components/user/Ui3D";
import { EXTRAS_CSS, Toaster } from "../components/user/UiExtras";
import {
  BTN_ICON, BTN_MD, BTN_PRIMARY, CARD, PANEL, SCROLL_CSS,
  useDarkMode, useShopLocale, IconTile,
} from "../components/shop/TableKit";
import {
  INK, FOCUS, REDUCED, LocaleCtx, useL, getFmt, toNum, normStatus,
  useDateRange, useRangeResource, useInView,
  Panel, Metric, StatTile, StatusChip, SkeletonBlock, EmptyBlock, LoadingBlock, RetryBlock,
  DateFilter, ScoreCard, InsightList, SectionTitle, Meter,
} from "../components/shop/DashboardKit";
import { pickReportText } from "../components/shop/reportsText";
import { ensureShopAssets } from "../common/utils/shopFonts";

ensureShopAssets();

const PAGE_CSS = UI3D_CSS + EXTRAS_CSS + SCROLL_CSS;
const POLL_MS = 60000;
const RATING_POLL_MS = 300000;
const REPORTS_PATH = "/shop/reports";
const UNREAD_EVENT = "shopChatUnread";
const DEFAULT_THRESHOLD = 5;

/* Endpoints (same ones used by the Orders / RepairRequests / Inventory pages) */
const ORDERS_PATH = "/api/shops/orders/control";
const REPAIRS_PATH = "/api/shops/repair-request";
const INVENTORY_PATH = "/api/shop/inventory/search";
const RATING_PATH = "/api/shops/reviews/summary"; // adjust if your backend uses another path

/* Module-level constants keep hook dependencies stable (no refetch loops) */
const LIST_PARAMS = Object.freeze({ page: 0, size: 500, sort: "createdAt,desc" });
const INVENTORY_PARAMS = Object.freeze({ query: "", page: 0, size: 500 });
const EMPTY_RANGE = Object.freeze({ startDate: "", endDate: "" });

/* Local copy for the new sections (no locale-file change needed) */
const ACTION_TEXT = {
  en: {
    title: "Action center",
    subtitle: "Things that need your attention right now",
    needsAction: "Needs action",
    allClear: "All clear",
    open: "Open",
    pendingTotal: "{n} to handle",
    items: {
      orders: { label: "New orders", desc: "Waiting for your approval" },
      repairs: { label: "Repairs waiting", desc: "New requests that need a price quote" },
      quotes: { label: "Quotes", desc: "Sent or rejected quotes to follow up" },
      stock: { label: "Low stock", desc: "Products running low or out of stock" },
      messages: { label: "Unread messages", desc: "Customer chats waiting for a reply" },
    },
    rating: {
      title: "Shop rating",
      caption: "Average customer rating",
      reviews: "{n} reviews",
      outOf: "/ 5",
      noData: "No ratings yet",
    },
    statsTitle: "Performance",
    statsSubtitle: "Sales, orders and repairs at a glance",
  },
  ar: {
    title: "مركز الإجراءات",
    subtitle: "أمور تحتاج انتباهك الآن",
    needsAction: "يحتاج إجراء",
    allClear: "كل شيء جاهز",
    open: "فتح",
    pendingTotal: "{n} للمعالجة",
    items: {
      orders: { label: "طلبات جديدة", desc: "بانتظار موافقتك" },
      repairs: { label: "تصليحات بالانتظار", desc: "طلبات جديدة تحتاج عرض سعر" },
      quotes: { label: "عروض الأسعار", desc: "عروض مُرسلة أو مرفوضة للمتابعة" },
      stock: { label: "مخزون منخفض", desc: "منتجات على وشك النفاد أو نفدت" },
      messages: { label: "رسائل غير مقروءة", desc: "محادثات العملاء بانتظار الرد" },
    },
    rating: {
      title: "تقييم المتجر",
      caption: "متوسط تقييم العملاء",
      reviews: "{n} تقييم",
      outOf: "/ 5",
      noData: "لا توجد تقييمات بعد",
    },
    statsTitle: "الأداء",
    statsSubtitle: "المبيعات والطلبات والتصليحات في لمحة",
  },
};

const ACTIONS = [
  { key: "orders",   path: "/shop/orders",          icon: FiShoppingBag,  tone: "sky", hex: "#38bdf8" },
  { key: "repairs",  path: "/shop/repair-requests", icon: FiTool,         tone: "am",  hex: "#fbbf24" },
  { key: "quotes",   path: "/shop/repair-requests", icon: FiDollarSign,   tone: "te",  hex: "#2dd4bf" },
  { key: "stock",    path: "/shop/inventory",       icon: FiAlertTriangle, tone: "ro", hex: "#fb7185" },
  { key: "messages", path: "/shop/chats",           icon: FiMessageSquare, tone: "vi", hex: "#a78bfa" },
];

const tpl = (str, vars) => String(str).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
const readStorage = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const listOf = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : []);
const mapInventory = (d) => listOf(d).map((i) => ({
  stock: Math.max(0, toNum(i?.stock ?? i?.stockQuantity)),
  threshold: toNum(i?.threshold) > 0 ? toNum(i.threshold) : DEFAULT_THRESHOLD,
}));

const BarChart = lazy(async () => {
  const [cjs, rc] = await Promise.all([import("chart.js"), import("react-chartjs-2")]);
  cjs.Chart.register(cjs.CategoryScale, cjs.LinearScale, cjs.BarElement, cjs.Tooltip);
  return { default: rc.Bar };
});

const ChartFallback = () => <div className="nb-gray nb-line h-full w-full animate-pulse border-2 motion-reduce:animate-none" />;

const STAT_META = {
  totalSales:   { icon: FiActivity,    tone: "em",  color: "#34d399", to: "/shop/transactions" },
  todaySales:   { icon: FiZap,         tone: "te",  color: "#2dd4bf", to: "/shop/transactions" },
  totalOrders:  { icon: FiShoppingBag, tone: "sky", color: "#38bdf8", to: "/shop/orders" },
  todayRepairs: { icon: FiTool,        tone: "am",  color: "#fbbf24", to: "/shop/repair-requests" },
  totalRepairs: { icon: FiTool,        tone: "vi",  color: "#a78bfa", to: "/shop/repair-requests" },
};

const QUICK_LINKS = [
  { key: "orders",       path: "/shop/orders",          icon: FiShoppingBag, tone: "sky" },
  { key: "repairs",      path: "/shop/repair-requests", icon: FiTool,        tone: "am" },
  { key: "products",     path: "/shop/devices",         icon: FiPackage,     tone: "em" },
  { key: "inventory",    path: "/shop/inventory",       icon: FiBox,         tone: "vi" },
  { key: "offers",       path: "/shop/offers",          icon: FiTag,         tone: "ro" },
  { key: "transactions", path: "/shop/transactions",    icon: FiCreditCard,  tone: "te" },
];

/* ------------------------------------------------------------------ data hooks */

/** Polled list loader: aborts stale requests, pauses while the tab is hidden. */
const useList = (path, params, mapList, pollMs = POLL_MS) => {
  const [state, setState] = useState({ items: [], loading: true, error: false });
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await api.get(path, { params, signal: controller.signal });
      if (!controller.signal.aborted) setState({ items: mapList(res.data), loading: false, error: false });
    } catch {
      if (!controller.signal.aborted) setState((s) => ({ ...s, loading: false, error: true }));
    }
  }, [path, params, mapList]);

  useEffect(() => {
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, pollMs);
    return () => { clearInterval(id); abortRef.current?.abort(); };
  }, [load, pollMs]);

  return { ...state, refresh: load };
};

const useUnread = () => {
  const shopId = useMemo(() => readStorage("id"), []);
  const [state, setState] = useState({ count: 0, loading: !!shopId, error: false });
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!shopId) { setState({ count: 0, loading: false, error: false }); return; }
    try {
      const { data } = await chatApi.unreadCount(shopId);
      if (alive.current) setState({ count: Math.max(0, Math.floor(toNum(parseCount(data)))), loading: false, error: false });
    } catch {
      if (alive.current) setState((s) => ({ ...s, loading: false, error: true }));
    }
  }, [shopId]);

  useEffect(() => {
    alive.current = true;
    load();
    const id = setInterval(() => { if (!document.hidden) load(); }, POLL_MS);
    const onUnread = (e) => {
      const n = Number(e.detail);
      if (Number.isFinite(n)) setState((s) => ({ ...s, count: Math.max(0, Math.floor(n)) }));
    };
    window.addEventListener(UNREAD_EVENT, onUnread);
    return () => {
      alive.current = false;
      clearInterval(id);
      window.removeEventListener(UNREAD_EVENT, onUnread);
    };
  }, [load]);

  return { ...state, refresh: load };
};

/** Accepts several backend shapes for the rating summary. */
const pickRating = (d) => {
  if (typeof d === "number") return Number.isFinite(d) && d > 0 ? { avg: d, count: 0 } : null;
  if (!d || typeof d !== "object") return null;
  const avg = Number(d.averageRating ?? d.average ?? d.avgRating ?? d.rating);
  const count = toNum(d.totalReviews ?? d.reviewsCount ?? d.reviewCount ?? d.totalRatings ?? d.count);
  if (!Number.isFinite(avg) || (avg <= 0 && count === 0)) return null;
  return { avg: Math.max(0, Math.min(5, avg)), count: Math.max(0, Math.floor(count)) };
};

const fetchRating = async (_range, signal) => {
  const res = await api.get(RATING_PATH, { signal });
  return pickRating(res.data);
};

/* ------------------------------------------------------------------ action center */

const ActionCard = memo(({ item, x, count, loading, failed, onOpen }) => {
  const { f } = useL();
  const text = x.items[item.key];
  const urgent = !loading && !failed && count > 0;
  const click = useCallback(() => onOpen(item.path), [onOpen, item.path]);
  const shown = loading ? "…" : failed ? "—" : count > 999 ? `${f.num.format(999)}+` : f.num.format(count);

  return (
    <li>
      <button
        type="button"
        onClick={click}
        aria-label={`${text.label}: ${shown}`}
        className={`${CARD} flex h-full w-full min-w-0 flex-col gap-3 p-4 text-start transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none ${FOCUS}`}
        style={urgent ? { boxShadow: `4px 4px 0 ${item.hex}` } : undefined}
      >
        <div className="flex items-center gap-3">
          <IconTile icon={item.icon} tone={item.tone} className="h-11 w-11 flex-shrink-0" size={19} />
          <div className="min-w-0 flex-1">
            <p className="nb-muted truncate text-[10px] font-bold uppercase rtl:tracking-normal">{text.label}</p>
            <p className="truncate text-2xl font-extrabold leading-tight tabular-nums">{shown}</p>
          </div>
        </div>
        <p className="nb-muted line-clamp-2 min-h-[2rem] text-[11px] font-semibold">{text.desc}</p>
        <div className="mt-auto flex items-center justify-between gap-2">
          {loading || failed ? <span /> : urgent ? (
            <span className="nb-chip !normal-case" style={{ background: item.hex, color: INK }}>
              <FiAlertCircle size={11} aria-hidden="true" /> {x.needsAction}
            </span>
          ) : (
            <span className="nb-chip !normal-case">
              <FiCheckCircle size={11} aria-hidden="true" /> {x.allClear}
            </span>
          )}
          <span className="nb-muted inline-flex items-center gap-1 text-[10px] font-extrabold uppercase rtl:tracking-normal">
            {x.open} <FiChevronRight size={12} className="rtl:rotate-180" aria-hidden="true" />
          </span>
        </div>
      </button>
    </li>
  );
});

const ActionCenter = memo(({ x, counts, loading, failed, onOpen }) => {
  const { f } = useL();
  const total = counts.orders + counts.repairs + counts.quotes + counts.stock + counts.messages;
  return (
    <section aria-labelledby="action-center-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <div id="action-center-title"><SectionTitle icon={FiZap}>{x.title}</SectionTitle></div>
          <p className="nb-muted mt-1.5 text-[11px] font-semibold">{x.subtitle}</p>
        </div>
        {total > 0 && !loading && (
          <span className="nb-chip !normal-case" role="status">{tpl(x.pendingTotal, { n: f.num.format(total) })}</span>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" aria-busy={loading}>
        {ACTIONS.map((a) => (
          <ActionCard
            key={a.key}
            item={a}
            x={x}
            count={counts[a.key]}
            loading={loading[a.key]}
            failed={failed[a.key]}
            onOpen={onOpen}
          />
        ))}
      </ul>
    </section>
  );
});

/* ------------------------------------------------------------------ rating */

const Stars = memo(({ value }) => {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <FiStar
          key={i}
          size={16}
          className={i <= filled ? "text-amber-400" : "nb-muted opacity-40"}
          style={i <= filled ? { fill: "currentColor" } : undefined}
        />
      ))}
    </span>
  );
});

const RatingCard = memo(({ x, rating, loading }) => {
  const { f } = useL();
  const r = x.rating;
  if (loading) return <SkeletonBlock className="h-[124px] sm:col-span-2" />;
  return (
    <section className={`${CARD} min-w-0 p-4 sm:col-span-2`} aria-label={r.title}>
      <div className="flex items-center gap-3">
        <IconTile icon={FiStar} tone="am" className="h-11 w-11 flex-shrink-0" size={19} />
        <div className="min-w-0 flex-1">
          <p className="nb-muted truncate text-[10px] font-bold uppercase rtl:tracking-normal">{r.title}</p>
          {rating ? (
            <p className="flex items-baseline gap-1.5 text-xl font-extrabold leading-tight tabular-nums">
              {f.dec.format(rating.avg)}
              <span className="nb-muted text-xs font-bold">{r.outOf}</span>
            </p>
          ) : (
            <p className="nb-muted text-sm font-extrabold">{r.noData}</p>
          )}
        </div>
        {rating && <Stars value={rating.avg} />}
      </div>
      {rating && (
        <>
          <div className="mt-3 flex items-center gap-2">
            <Meter pct={(rating.avg / 5) * 100} color="#fbbf24" className="h-2.5 flex-1" />
            <span className="w-9 text-end text-[10px] font-extrabold tabular-nums">{f.num.format(Math.round((rating.avg / 5) * 100))}%</span>
          </div>
          <p className="nb-muted mt-2 truncate text-[11px] font-semibold">
            {r.caption}{rating.count > 0 ? ` · ${tpl(r.reviews, { n: f.num.format(rating.count) })}` : ""}
          </p>
        </>
      )}
    </section>
  );
});

/* ------------------------------------------------------------------ calendar / quick links */

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
  const today = useMemo(() => new Date(), []);

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

/* ------------------------------------------------------------------ orders chart */

const bucketKey = (d, period) => {
  const p = (n) => String(n).padStart(2, "0");
  if (period === "DAILY") return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  if (period === "MONTHLY") return `${d.getFullYear()}-${p(d.getMonth() + 1)}`;
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
          backgroundColor: INK, titleColor: "#ecfdf5", bodyColor: "#ecfdf5",
          borderColor: "#34d399", borderWidth: 2, cornerRadius: 0, padding: 10,
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
        <Metric label={c.total} value={f.num.format(total)} />
        <Metric label={c.best} value={best ? best.label : "-"} />
        <Metric
          label={c.trend}
          value={trend ? `${trend.up ? "+" : "-"}${f.num.format(Math.abs(trend.pct))}%` : "-"}
          tone={trend ? (trend.up ? "text-emerald-600 dark:text-emerald-300" : "text-red-500") : undefined}
        />
        <Metric label={c.completion} value={`${f.num.format(doneRate)}%`} />
      </div>
    </Panel>
  );
});

/* ------------------------------------------------------------------ latest tables */

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
  <tr><td colSpan={3} className="px-6 py-8">{children}</td></tr>
);

const OrderRow = memo(({ o }) => {
  const { t, f } = useL();
  const d = t.latestOrders;
  const fullName = [o.firstName, o.lastName].filter(Boolean).join(" ");
  return (
    <tr className={ROW_CLS}>
      <td className="px-5 py-3">
        <p className="max-w-[200px] truncate text-xs font-extrabold">{fullName || d.unknownCustomer}</p>
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

const LatestRepairsTable = memo(({ repairs: all, loading, error, onRetry }) => {
  const { t } = useL();
  const d = t.latestRepairs;
  const repairs = useMemo(() => all.slice(0, 5), [all]);
  return (
    <TableShell icon={FiTool} tone="am" title={d.title}>
      <table className="w-full text-start">
        <TableHead cols={[[d.request, "text-start"], [d.status, "text-center"], [d.price, "text-end"]]} />
        <tbody>
          {loading ? <StateRow><LoadingBlock /></StateRow>
            : error && repairs.length === 0 ? <StateRow><RetryBlock onRetry={onRetry} /></StateRow>
            : repairs.length === 0 ? <StateRow><EmptyBlock text={d.empty} /></StateRow>
            : repairs.map((r) => <RepairRow key={r.id} r={r} />)}
        </tbody>
      </table>
    </TableShell>
  );
});

/* ------------------------------------------------------------------ page */

const ShopDashboard = ({ darkMode: darkModeProp }) => {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hookDark = useDarkMode();
  const darkMode = darkModeProp ?? hookDark;
  const loc = useShopLocale();
  const { language, L, dir, font } = loc;
  const isAr = loc.isAr ?? language === "ar";
  const t = L.dashboard;
  const r = pickReportText(loc);
  const x = ACTION_TEXT[isAr ? "ar" : "en"];
  const f = getFmt(L.locale || (isAr ? "ar-EG" : "en-US"));
  const fontFamily = font?.fontFamily;
  const ctx = useMemo(() => ({ t, r, f, fontFamily, darkMode }), [t, r, f, fontFamily, darkMode]);

  useEffect(() => { document.title = t.docTitle; }, [t.docTitle]);
  useEffect(() => { if (!accessToken) navigate("/login"); }, [accessToken, navigate]);

  const range = useDateRange(t);
  const { onRange } = range;
  const [showFilter, setShowFilter] = useState(false);
  const toggleFilter = useCallback(() => {
    if (showFilter) onRange("", "");
    setShowFilter(!showFilter);
  }, [showFilter, onRange]);

  const overview = useRangeResource(fetchOverview, range.applied, { pollMs: POLL_MS });
  const today = useRangeResource(fetchToday, EMPTY_RANGE, { pollMs: POLL_MS });
  const ratingRes = useRangeResource(fetchRating, EMPTY_RANGE, { pollMs: RATING_POLL_MS });

  // One request per resource; shared by the Action Center, chart and latest tables.
  const ordersQ = useList(ORDERS_PATH, LIST_PARAMS, listOf);
  const repairsQ = useList(REPAIRS_PATH, LIST_PARAMS, listOf);
  const stockQ = useList(INVENTORY_PATH, INVENTORY_PARAMS, mapInventory);
  const unreadQ = useUnread();

  const { reload: reloadOverview } = overview;
  const { reload: reloadToday } = today;
  const { reload: reloadRating } = ratingRes;
  const { refresh: refreshOrders } = ordersQ;
  const { refresh: refreshRepairs } = repairsQ;
  const { refresh: refreshStock } = stockQ;
  const { refresh: refreshUnread } = unreadQ;

  const refreshAll = useCallback(() => {
    reloadOverview();
    reloadToday();
    reloadRating();
    refreshOrders();
    refreshRepairs();
    refreshStock();
    refreshUnread();
  }, [reloadOverview, reloadToday, reloadRating, refreshOrders, refreshRepairs, refreshStock, refreshUnread]);

  const goTo = useCallback((to) => navigate(to), [navigate]);

  const ov = overview.data;
  const td = today.data;

  const counts = useMemo(() => {
    let orders = 0, repairs = 0, quotes = 0, stock = 0;
    for (const o of ordersQ.items) if (normStatus(o.status) === "PENDING") orders += 1;
    for (const rp of repairsQ.items) {
      const s = normStatus(rp.status);
      if (s === "SUBMITTED") repairs += 1;
      else if (s === "QUOTE_SENT" || s === "QUOTE_REJECTED") quotes += 1;
    }
    for (const i of stockQ.items) if (i.stock < i.threshold) stock += 1;
    return { orders, repairs, quotes, stock, messages: unreadQ.count };
  }, [ordersQ.items, repairsQ.items, stockQ.items, unreadQ.count]);

  const actionLoading = useMemo(() => ({
    orders: ordersQ.loading,
    repairs: repairsQ.loading,
    quotes: repairsQ.loading,
    stock: stockQ.loading,
    messages: unreadQ.loading,
  }), [ordersQ.loading, repairsQ.loading, stockQ.loading, unreadQ.loading]);

  const actionFailed = useMemo(() => ({
    orders: ordersQ.error && ordersQ.items.length === 0,
    repairs: repairsQ.error && repairsQ.items.length === 0,
    quotes: repairsQ.error && repairsQ.items.length === 0,
    stock: stockQ.error && stockQ.items.length === 0,
    messages: unreadQ.error && unreadQ.count === 0,
  }), [ordersQ.error, ordersQ.items.length, repairsQ.error, repairsQ.items.length, stockQ.error, stockQ.items.length, unreadQ.error, unreadQ.count]);

  const doneRate = useMemo(() => {
    if (ov?.orders) return Math.round(toNum(ov.orders.completionRate));
    const done = ordersQ.items.filter((o) => ["DELIVERED", "COMPLETED"].includes(normStatus(o.status))).length;
    return ordersQ.items.length ? Math.round((done / ordersQ.items.length) * 100) : 0;
  }, [ov, ordersQ.items]);

  const rating = useMemo(
    () => ratingRes.data ?? pickRating(ov?.shopRating ?? ov?.rating),
    [ratingRes.data, ov],
  );

  const statCards = useMemo(() => {
    const price = (v) => `${f.num.format(toNum(v))} ${t.currency}`;
    const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);
    const totalSales = toNum(ov?.sales?.totalSales);
    const totalRepairs = toNum(ov?.repairs?.totalRepairs);
    const todaySales = toNum(td?.todaySales);
    const todayRepairs = toNum(td?.todayRepairs);
    return [
      { key: "totalSales",   value: price(totalSales), delta: ov?.sales?.percentChange },
      { key: "todaySales",   value: price(todaySales), percent: pct(todaySales, totalSales) },
      { key: "totalOrders",  value: f.num.format(toNum(ov?.orders?.totalOrders)), delta: ov?.orders?.ordersPercentChange },
      { key: "todayRepairs", value: f.num.format(todayRepairs), percent: pct(todayRepairs, totalRepairs) },
      { key: "totalRepairs", value: f.num.format(totalRepairs), delta: ov?.repairs?.repairsPercentChange, wide: true },
    ].map((c) => ({
      ...c,
      meta: STAT_META[c.key],
      label: t.stats[c.key].label,
      caption: t.stats[c.key].caption,
    }));
  }, [ov, td, t, f]);

  const showSkeleton = overview.loading && !ov;
  const hasError = overview.error || today.error || ordersQ.error || repairsQ.error || stockQ.error || unreadQ.error || (td && td.ok === false);
  const lastUpdated = overview.updatedAt;
  const refreshing = overview.loading || today.loading;

  return (
    <LocaleCtx.Provider value={ctx}>
      <div dir={dir} lang={language} style={font} className="nb-page min-h-screen py-6 lg:ps-64 mt-16 text-start">
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
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="nb-chip !normal-case" role="status" aria-live="polite">
                {t.lastUpdated}: <span className="tabular-nums">{lastUpdated ? f.time.format(lastUpdated) : "..."}</span>
              </div>
              <button
                type="button"
                onClick={toggleFilter}
                aria-expanded={showFilter}
                aria-controls="date-filter-panel"
                className={`${showFilter ? BTN_PRIMARY : BTN_MD} h-10 uppercase`}
              >
                <FiFilter size={14} aria-hidden="true" /> {t.filter.title}
              </button>
              <button type="button" onClick={() => goTo(REPORTS_PATH)} className={`${BTN_MD} h-10 uppercase`}>
                <FiBarChart2 size={14} aria-hidden="true" /> {r.openReports}
              </button>
              <button type="button" onClick={refreshAll} aria-label={t.refresh} title={t.refresh} className={`${BTN_MD} h-10 uppercase`}>
                <FiRefreshCw size={14} className={refreshing ? "animate-spin motion-reduce:animate-none" : ""} /> {t.refresh}
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

          {/* 1) Action center */}
          <ActionCenter x={x} counts={counts} loading={actionLoading} failed={actionFailed} onOpen={goTo} />

          {showFilter && (
            <div id="date-filter-panel">
              <DateFilter
                startDate={range.startDate}
                endDate={range.endDate}
                onStartChange={range.onStartChange}
                onEndChange={range.onEndChange}
                onRange={range.onRange}
                onReset={range.reset}
                error={range.error}
                loading={overview.loading && !!ov}
              />
            </div>
          )}

          {/* 2) Stats + rating + calendar */}
          <section aria-labelledby="stats-title" className="space-y-3">
            <div>
              <div id="stats-title"><SectionTitle icon={FiActivity}>{x.statsTitle}</SectionTitle></div>
              <p className="nb-muted mt-1.5 text-[11px] font-semibold">{x.statsSubtitle}</p>
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2 lg:col-span-2" aria-busy={showSkeleton}>
                {showSkeleton
                  ? [...Array(5)].map((_, i) => <SkeletonBlock key={i} className={`h-[124px] ${i === 4 ? "sm:col-span-2" : ""}`} />)
                  : statCards.map(({ key, ...c }) => <StatTile key={key} {...c} onNavigate={goTo} />)}
                <RatingCard x={x} rating={rating} loading={ratingRes.loading && !ratingRes.data} />
              </div>
              <MiniCalendar />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Panel
              title={r.score.title}
              subtitle={r.insights.subtitle}
              icon={FiTarget}
              action={<button type="button" onClick={() => goTo(REPORTS_PATH)} className={`${BTN_MD} h-8 uppercase`}>{r.insights.viewAll}</button>}
            >
              {showSkeleton ? <LoadingBlock />
                : !ov ? <RetryBlock onRetry={reloadOverview} />
                : (
                  <div className="space-y-4">
                    <ScoreCard score={ov.overallScore} />
                    <InsightList insights={ov.insights} limit={3} />
                  </div>
                )}
            </Panel>

            <OrdersChartCard orders={ordersQ.items} loading={ordersQ.loading} doneRate={doneRate} />

            <Panel title={t.quick.title} subtitle={t.quick.subtitle} icon={FiZap}>
              <ul className="space-y-2.5">
                {QUICK_LINKS.map((q) => (
                  <QuickLink key={q.path} item={q} title={t.quick.items[q.key].title} desc={t.quick.items[q.key].desc} onOpen={goTo} />
                ))}
              </ul>
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <LatestOrdersTable orders={ordersQ.items} loading={ordersQ.loading} error={ordersQ.error} onRetry={refreshOrders} />
            <LatestRepairsTable repairs={repairsQ.items} loading={repairsQ.loading} error={repairsQ.error} onRetry={refreshRepairs} />
          </div>
        </div>
      </div>
    </LocaleCtx.Provider>
  );
};

export default memo(ShopDashboard);