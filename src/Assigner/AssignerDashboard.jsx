import React, { useState, useEffect, useCallback, useMemo, memo, useRef, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../common/api/api";
import {
  FiTrendingUp, FiChevronLeft, FiChevronRight, FiUsers, FiBox, FiTool,
  FiPackage, FiPieChart, FiBell, FiArchive, FiRefreshCw, FiClipboard,
} from "react-icons/fi";

const Chart = lazy(async () => {
  const [cjs, rc] = await Promise.all([import("chart.js"), import("react-chartjs-2")]);
  cjs.Chart.register(cjs.CategoryScale, cjs.LinearScale, cjs.BarElement, cjs.Tooltip, cjs.Legend, cjs.ArcElement);
  const { Doughnut, Bar } = rc;
  return {
    default: ({ type, data, options }) =>
      type === "bar" ? <Bar data={data} options={options} /> : <Doughnut data={data} options={options} />,
  };
});

let swalPromise = null;
const loadSwal = () => (swalPromise ||= import("sweetalert2").then((m) => m.default));
const showToast = async (text, icon) => {
  try {
    const Swal = await loadSwal();
    Swal.fire({ text, icon, toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
  } catch {
    return;
  }
};

const REFRESH_INTERVAL = 60_000;
const MIN_GAP = 15_000;
const MAX_INTERVAL = 300_000;
const CACHE_KEY = "assigner_dash_v3";
const NOTIF_KEY = "assigner_notifs_v1";
const NOTIF_EVENT = "assigner:notifs";
const OPEN_EVENT = "assigner:open-notifs";
const REDUCED = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const NEON = ["#34d399", "#2dd4bf", "#a3e635", "#22d3ee"];
const KEYS = ["orders", "repairs", "agents", "alerts"];
const LABELS = ["Orders", "Repairs", "Agents", "Alerts"];

const NB_FONT = "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const NB_FONT_STYLE = { fontFamily: NB_FONT };
const ensureNbFont = () => {
  if (typeof document === "undefined" || document.getElementById("nb-font")) return;
  [["https://fonts.googleapis.com", false], ["https://fonts.gstatic.com", true]].forEach(([href, cors]) => {
    const l = document.createElement("link");
    l.rel = "preconnect";
    l.href = href;
    if (cors) l.crossOrigin = "";
    document.head.appendChild(l);
  });
  const link = document.createElement("link");
  link.id = "nb-font";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
};

const NB_CSS = `
.nb{--nb-bg:#f9fafb;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e8ebe9;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-dark .nb-dot{border-color:#3f3f3f}
.nb-bg{background:var(--nb-bg)}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);transition:transform .15s ease,box-shadow .15s ease}
.nb-lift:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:40px;height:12px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
.nb-squig path{stroke:var(--nb-accent)}
.nb-tile{display:inline-flex;align-items:center;justify-content:center;flex:none;border:2px solid var(--nb-line);color:#04261a}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:focus-visible,.nb-row:focus-visible,.nb-card:focus-visible{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-row{display:flex;width:100%;align-items:center;gap:12px;text-align:start;padding:10px;background:var(--nb-card);color:var(--nb-ink);border:2px dotted var(--nb-line);cursor:pointer;transition:transform .15s ease,background-color .15s ease,border-color .15s ease}
.nb-dark .nb-row{border-color:#3f3f3f}
.nb-row:hover{background:var(--nb-btn);color:var(--nb-on);transform:translateY(-2px);border-style:solid;border-color:var(--nb-line)}
.nb-row:hover .nb-muted{color:inherit;opacity:.85}
.nb-arrow{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;background:var(--nb-btn);color:var(--nb-on);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);transition:transform .15s ease}
.nb-row:hover .nb-arrow{transform:translateX(3px);background:var(--nb-card);color:var(--nb-ink)}
.nb[dir="rtl"] .nb-arrow svg{transform:scaleX(-1)}
.nb-track{height:12px;background:var(--nb-gray);border:2px solid var(--nb-line);overflow:hidden}
.nb-today{background:var(--nb-btn);color:var(--nb-on);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);font-weight:800}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn,.nb-arrow,.nb-row{transition:none}}
`;
const STYLE_HTML = { __html: NB_CSS };

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const d = jwtDecode(token);
    return !d.exp || d.exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

const readCache = () => {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    return c && c.data ? c : null;
  } catch {
    return null;
  }
};

const countUnread = (list) => (Array.isArray(list) ? list.reduce((n, x) => n + (x.read ? 0 : 1), 0) : 0);

const readUnread = () => {
  try {
    return countUnread(JSON.parse(sessionStorage.getItem(NOTIF_KEY)));
  } catch {
    return 0;
  }
};

const asList = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  return Array.isArray(d?.content) ? d.content : [];
};

const num = (n) => Number(n) || 0;
const fmt = (n) => num(n).toLocaleString();
const ratio = (a, b) => (b ? (a / b).toFixed(1) : "0.0");

const useIsDark = (prop) => {
  const [dom, setDom] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    if (prop !== undefined) return undefined;
    const el = document.documentElement;
    const mo = new MutationObserver(() => setDom(el.classList.contains("dark")));
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, [prop]);
  return prop !== undefined ? prop : dom;
};

const useInView = (margin = "240px") => {
  const ref = useRef(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (seen || !ref.current) return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { rootMargin: margin });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen];
};

const openNotifications = () => window.dispatchEvent(new Event(OPEN_EVENT));

const STAT_META = [
  { label: "Pending Orders", caption: "Waiting for assignment", icon: FiPackage, to: "/assigner/orders" },
  { label: "Active Repairs", caption: "Waiting for assignment", icon: FiTool, to: "/assigner/repair-requests" },
  { label: "Total Agents", caption: "Delivery network", icon: FiUsers, to: "/assigner/delivery" },
  { label: "New Alerts", caption: "Unread notifications", icon: FiBell },
];

const UnderlinedTitle = memo(({ text }) => {
  const s = String(text || "");
  const i = s.lastIndexOf(" ");
  const head = i > 0 ? s.slice(0, i + 1) : "";
  const tail = i > 0 ? s.slice(i + 1) : s;
  return (
    <>
      {head}
      <span className="relative inline-block">
        {tail}
        <svg aria-hidden="true" focusable="false" viewBox="0 0 100 10" preserveAspectRatio="none" className="nb-squig pointer-events-none absolute inset-x-0 -bottom-2 h-2.5 w-full">
          <path d="M1 6 C 20 2, 40 9, 60 5 S 90 3, 99 6" fill="none" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </span>
    </>
  );
});

const Ring = memo(({ percent, color }) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-16 h-16 flex-shrink-0" role="img" aria-label={`${percent}% of total workload`}>
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="8" style={{ stroke: "var(--nb-gray)" }} />
        <circle
          cx="32" cy="32" r={r} fill="none" strokeWidth="8"
          stroke={color}
          strokeDasharray={`${(c * percent) / 100} ${c}`}
          style={{ transition: REDUCED ? "none" : "stroke-dasharray .6s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums">
        {percent}%
      </span>
    </div>
  );
});

const DashStat = memo(({ meta, value, percent, color }) => {
  const Icon = meta.icon;
  const cls = "nb-card nb-lift w-full text-start p-4 sm:p-5 flex items-center justify-between gap-3 min-w-0 cursor-pointer";
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <span className="nb-tile w-11 h-11" style={{ background: color }}>
            <Icon size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="nb-muted text-[11px] font-bold uppercase tracking-wide truncate">{meta.label}</p>
            <p className="text-2xl font-extrabold tracking-tight leading-tight tabular-nums truncate">{value}</p>
          </div>
        </div>
        <p className="nb-muted mt-3 text-xs font-semibold truncate">{meta.caption}</p>
      </div>
      <Ring percent={percent} color={color} />
    </>
  );
  return meta.to ? (
    <Link to={meta.to} aria-label={`View details for ${meta.label}`} className={cls}>{body}</Link>
  ) : (
    <button type="button" onClick={openNotifications} aria-label="Open notifications" className={cls}>{body}</button>
  );
});

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MiniCalendar = memo(() => {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const { title, cells } = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const arr = Array.from({ length: first }, () => null);
    for (let d = 1; d <= days; d++) arr.push(d);
    return { title: cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" }), cells: arr };
  }, [cursor]);

  const shift = useCallback((n) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1)), []);
  const prev = useCallback(() => shift(-1), [shift]);
  const next = useCallback(() => shift(1), [shift]);
  const sameMonth = cursor.getMonth() === today.getMonth() && cursor.getFullYear() === today.getFullYear();
  const todayLabel = useMemo(
    () => today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }),
    [today]
  );

  return (
    <div className="nb-card p-4 sm:p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prev} aria-label="Previous month" className="nb-btn w-8 h-8">
          <FiChevronLeft size={15} />
        </button>
        <h2 className="text-sm font-extrabold uppercase"><span className="nb-ul">{title}</span></h2>
        <button type="button" onClick={next} aria-label="Next month" className="nb-btn w-8 h-8">
          <FiChevronRight size={15} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w) => <span key={w} className="nb-muted text-[11px] font-bold uppercase py-1">{w}</span>)}
        {cells.map((d, i) => (
          <span
            key={i}
            className={`mx-auto w-8 h-8 flex items-center justify-center text-sm font-semibold ${sameMonth && d === today.getDate() ? "nb-today" : ""}`}
          >
            {d}
          </span>
        ))}
      </div>
      <div className="mt-auto pt-4">
        <div className="nb-gray nb-line border-2 border-dotted px-4 py-3">
          <p className="nb-muted text-[11px] font-bold uppercase">Today</p>
          <p className="text-sm font-extrabold">{todayLabel}</p>
        </div>
      </div>
    </div>
  );
});

const QUICK_LINKS = [
  { title: "Delivery Network", desc: "Agents and availability", path: "/assigner/delivery", icon: FiUsers },
  { title: "Order Queue", desc: "Orders waiting for agents", path: "/assigner/orders", icon: FiBox },
  { title: "Repair Queue", desc: "Repairs waiting for agents", path: "/assigner/repair-requests", icon: FiTool },
  { title: "Assigned Orders", desc: "Orders already handed off", path: "/assigner/assigned-orders", icon: FiArchive },
  { title: "Reassign Orders", desc: "Move orders to another agent", path: "/assigner/reassign-orders", icon: FiRefreshCw },
  { title: "Assignment Logs", desc: "Audit and activity", path: "/assigner/assignment-logs", icon: FiClipboard },
].map((q, i) => ({ ...q, color: NEON[i % NEON.length] }));

const QuickLink = memo(({ item }) => {
  const Icon = item.icon;
  return (
    <li>
      <Link to={item.path} className="nb-row group">
        <span className="nb-tile w-10 h-10" style={{ background: item.color }}>
          <Icon size={18} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold uppercase truncate">{item.title}</span>
          <span className="nb-muted block text-xs font-semibold truncate">{item.desc}</span>
        </span>
        <span className="nb-arrow" aria-hidden="true"><FiChevronRight size={15} /></span>
      </Link>
    </li>
  );
});

const SectionHead = memo(({ eyebrow, title, subtitle, large = false }) => (
  <header className="mb-4 px-0.5">
    {eyebrow && (
      <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide">
        <span className="nb-bar" aria-hidden="true" />{eyebrow}
      </p>
    )}
    <h2 className={`${eyebrow ? "mt-2.5" : ""} font-extrabold tracking-tight leading-[1.15] ${large ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"}`}>
      <UnderlinedTitle text={title} />
    </h2>
    {subtitle && <p className="nb-muted mt-2 text-sm font-medium">{subtitle}</p>}
  </header>
));

const BreakdownRow = memo(({ row }) => {
  const Icon = row.icon;
  return (
    <div className="nb-line grid grid-cols-[1.6fr_1fr] sm:grid-cols-[1.6fr_1fr_1.6fr_0.8fr] items-center gap-3 px-4 sm:px-5 py-3.5 border-t-2 border-dotted">
      <div className="flex items-center gap-3 min-w-0">
        <span className="nb-tile w-10 h-10" style={{ background: row.color }}>
          <Icon size={17} aria-hidden="true" />
        </span>
        <span className="text-sm font-extrabold uppercase truncate">{row.label}</span>
      </div>
      <span className="text-sm font-bold tabular-nums">{fmt(row.value)}</span>
      <div className="hidden sm:flex items-center gap-2">
        <span className="nb-track flex-1">
          <span className="block h-full" style={{ width: `${row.percent}%`, background: row.color }} />
        </span>
        <span className="w-9 text-end text-xs font-bold tabular-nums">{row.percent}%</span>
      </div>
      <span className="nb-muted hidden sm:block text-sm font-bold tabular-nums">{row.perAgent}</span>
    </div>
  );
});

const ChartFallback = () => <div className="nb-gray nb-line h-full w-full border-2 animate-pulse motion-reduce:animate-none" />;

const AnalyticsCard = memo(({ title, subtitle, icon: Icon, children, footer }) => {
  const [ref, seen] = useInView();
  return (
    <div className="nb-card p-4 sm:p-5 flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold uppercase"><span className="nb-ul">{title}</span></h2>
          <p className="nb-muted mt-1.5 text-xs font-semibold">{subtitle}</p>
        </div>
        <span className="nb-tile w-9 h-9 flex-shrink-0" style={{ background: "var(--nb-accent)" }}>
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
      <div ref={ref} className="relative h-56">{seen ? children : <ChartFallback />}</div>
      {footer}
    </div>
  );
});

const Legend = memo(({ rows }) => (
  <ul className="mt-4 space-y-2">
    {rows.map((r) => (
      <li key={r.label} className="flex items-center gap-2.5 text-sm">
        <span className="w-3 h-3 flex-shrink-0 border-2 nb-line" style={{ background: r.color }} />
        <span className="flex-1 font-semibold">{r.label}</span>
        <span className="font-extrabold tabular-nums">{fmt(r.value)}</span>
        <span className="nb-muted w-10 text-end text-xs font-bold tabular-nums">{r.percent}%</span>
      </li>
    ))}
  </ul>
));

const Insight = memo(({ label, value }) => (
  <div className="nb-gray nb-line border-2 border-dotted px-3.5 py-3 min-w-0">
    <p className="nb-muted text-[11px] font-bold uppercase truncate">{label}</p>
    <p className="mt-0.5 text-lg font-extrabold tabular-nums truncate">{value}</p>
  </div>
));

const AssignerDashboard = ({ darkMode: darkModeProp }) => {
  const navigate = useNavigate();
  const darkMode = useIsDark(darkModeProp);
  const tokenRef = useRef(localStorage.getItem("authToken"));
  const cached = useMemo(() => readCache(), []);

  const [stats, setStats] = useState(() => cached?.data ?? null);
  const [unread, setUnread] = useState(readUnread);
  const [loading, setLoading] = useState(false);

  const statsRef = useRef(stats);
  statsRef.current = stats;
  const abortRef = useRef(null);
  const lastRef = useRef(cached?.ts || 0);
  const failRef = useRef(0);

  useEffect(() => { document.title = "Assigner Dashboard | Tech Restore"; }, []);
  useEffect(() => { ensureNbFont(); }, []);

  useEffect(() => {
    const token = tokenRef.current;
    if (!token || isTokenExpired(token)) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const onNotifs = (e) => setUnread(countUnread(e.detail));
    window.addEventListener(NOTIF_EVENT, onNotifs);
    return () => window.removeEventListener(NOTIF_EVENT, onNotifs);
  }, []);

  const fetchData = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    const cfg = { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal };
    try {
      const results = await Promise.allSettled([
        api.get("/api/assigner/orders-for-assignment", cfg),
        api.get("/api/assigner/repairs-for-assignment", cfg),
        api.get("/api/assigner/delivery-persons", cfg),
      ]);
      if (ctrl.signal.aborted) return;

      const unauthorized = results.some(
        (x) => x.status === "rejected" && [401, 403].includes(x.reason?.response?.status)
      );
      if (unauthorized) {
        sessionStorage.removeItem(CACHE_KEY);
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }
      if (results.every((x) => x.status === "rejected")) throw new Error("sync");

      const [o, r, a] = results;
      const prev = statsRef.current;
      const next = {
        orders: o.status === "fulfilled" ? asList(o.value).length : prev?.orders ?? 0,
        repairs: r.status === "fulfilled" ? asList(r.value).length : prev?.repairs ?? 0,
        agents: a.status === "fulfilled" ? asList(a.value).length : prev?.agents ?? 0,
      };

      lastRef.current = Date.now();
      failRef.current = 0;
      setStats(
        prev && prev.orders === next.orders && prev.repairs === next.repairs && prev.agents === next.agents
          ? prev
          : next
      );
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: next, ts: lastRef.current }));
      } catch {
        return;
      }
    } catch {
      if (ctrl.signal.aborted) return;
      if (failRef.current++ === 0) showToast("Sync issue detected", "warning");
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
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
      abortRef.current?.abort();
    };
  }, [fetchData]);

  const initialLoading = loading && !stats;

  const values = useMemo(
    () => [num(stats?.orders), num(stats?.repairs), num(stats?.agents), unread],
    [stats, unread]
  );
  const total = useMemo(() => values.reduce((a, b) => a + b, 0), [values]);

  const rows = useMemo(() => {
    const agents = values[2];
    return KEYS.map((k, i) => ({
      key: k,
      label: LABELS[i],
      value: values[i],
      color: NEON[i],
      percent: total ? Math.round((values[i] / total) * 100) : 0,
      perAgent: i === 2 ? "-" : ratio(values[i], agents),
      icon: STAT_META[i].icon,
    }));
  }, [values, total]);

  const statCards = useMemo(
    () => rows.map((r, i) => ({
      key: r.key,
      meta: STAT_META[i],
      value: initialLoading ? "…" : fmt(r.value),
      percent: r.percent,
      color: r.color,
    })),
    [rows, initialLoading]
  );

  const insights = useMemo(() => {
    const top = rows.reduce((a, b) => (b.value > a.value ? b : a), rows[0]);
    return [
      { label: "Total workload", value: fmt(total) },
      { label: "Largest segment", value: total ? top.label : "-" },
      { label: "Orders per agent", value: ratio(values[0], values[2]) },
      { label: "Repairs per agent", value: ratio(values[1], values[2]) },
    ];
  }, [rows, total, values]);

  const ink = darkMode ? "#ffffff" : "#04261a";
  const edge = darkMode ? "#000000" : "#04261a";
  const grid = darkMode ? "rgba(255,255,255,0.12)" : "rgba(4,38,26,0.12)";

  const doughnutData = useMemo(() => ({
    labels: LABELS,
    datasets: [{ data: values, backgroundColor: NEON, borderColor: edge, borderWidth: 2, hoverOffset: 6 }],
  }), [values, edge]);

  const barData = useMemo(() => ({
    labels: LABELS,
    datasets: [{ data: values, backgroundColor: NEON, borderColor: edge, borderWidth: 2, borderRadius: 0, maxBarThickness: 44 }],
  }), [values, edge]);

  const tooltip = useMemo(() => ({
    backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
    titleColor: ink,
    bodyColor: ink,
    borderColor: edge,
    borderWidth: 2,
    cornerRadius: 0,
    displayColors: false,
    callbacks: {
      label: (ctx) => {
        const v = num(ctx.parsed?.y ?? ctx.parsed);
        const p = total ? Math.round((v / total) * 100) : 0;
        return ` ${v.toLocaleString()} (${p}%)`;
      },
    },
  }), [total, darkMode, ink, edge]);

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    animation: REDUCED ? false : { duration: 400 },
    plugins: { legend: { display: false }, tooltip },
  }), [tooltip]);

  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: REDUCED ? false : { duration: 400 },
    plugins: { legend: { display: false }, tooltip },
    scales: {
      x: { grid: { display: false }, border: { color: edge, width: 2 }, ticks: { color: ink, font: { weight: "600" } } },
      y: { beginAtZero: true, grid: { color: grid }, border: { color: edge, width: 2 }, ticks: { color: ink, precision: 0 } },
    },
  }), [ink, edge, grid, tooltip]);

  return (
    <div
      style={NB_FONT_STYLE}
      className={`nb ${darkMode ? "nb-dark" : ""} min-h-screen py-6 lg:ps-64 mt-16 overflow-x-hidden`}
    >
      <style dangerouslySetInnerHTML={STYLE_HTML} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

        <SectionHead
          large
          eyebrow="Overview"
          title="Assigner Control"
          subtitle="Assign orders and repairs to delivery agents across the Tech & Restore platform."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map(({ key, ...c }) => <DashStat key={key} {...c} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section aria-label="Quick access">
            <SectionHead eyebrow="Shortcuts" title="Quick Access" subtitle="Jump straight to a work area" />
            <ul className="nb-card p-3 space-y-2.5">
              {QUICK_LINKS.map((q) => <QuickLink key={q.path} item={q} />)}
            </ul>
          </section>

          <section aria-label="Workload breakdown" className="lg:col-span-2 min-w-0">
            <SectionHead eyebrow="Numbers" title="Workload Breakdown" subtitle="Totals, share of all items and ratio per agent" />
            <div className="nb-card overflow-hidden">
              <div className="nb-gray grid grid-cols-[1.6fr_1fr] sm:grid-cols-[1.6fr_1fr_1.6fr_0.8fr] gap-3 px-4 sm:px-5 py-3 text-[11px] font-extrabold uppercase">
                <span>Item</span>
                <span>Total</span>
                <span className="hidden sm:block">Share</span>
                <span className="hidden sm:block">Per agent</span>
              </div>
              {rows.map((r) => <BreakdownRow key={r.key} row={r} />)}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnalyticsCard
            title="Workload Distribution"
            subtitle="Share of each item type"
            icon={FiPieChart}
            footer={<Legend rows={rows} />}
          >
            <Suspense fallback={<ChartFallback />}><Chart type="doughnut" data={doughnutData} options={doughnutOptions} /></Suspense>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold tabular-nums">{fmt(total)}</span>
              <span className="nb-muted text-xs font-bold uppercase">Total workload</span>
            </div>
          </AnalyticsCard>

          <AnalyticsCard
            title="Queue Overview"
            subtitle="Totals side by side"
            icon={FiTrendingUp}
            footer={
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {insights.map((i) => <Insight key={i.label} {...i} />)}
              </div>
            }
          >
            <Suspense fallback={<ChartFallback />}><Chart type="bar" data={barData} options={barOptions} /></Suspense>
          </AnalyticsCard>

          <div className="md:col-span-2 xl:col-span-1">
            <MiniCalendar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(AssignerDashboard);