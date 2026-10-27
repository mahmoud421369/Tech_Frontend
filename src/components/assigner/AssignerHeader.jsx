import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  FiMoon, FiSun, FiLogOut, FiMenu, FiX, FiActivity, FiUsers, FiBox, FiTool,
  FiClipboard, FiSearch, FiRefreshCw, FiArchive, FiChevronRight, FiBell,
  FiInfo, FiAlertTriangle, FiAlertCircle, FiUser,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import api from "../../common/api/api";
import logo from "../../common/images/tech-restore-logo.webp";

const ICON = 18;
const REFRESH_INTERVAL = 60_000;
const MIN_GAP = 15_000;
const MAX_INTERVAL = 300_000;
const MAX_RENDERED_NOTIFS = 50;
const SEARCH_MAX = 40;
const NOTIF_KEY = "assigner_notifs_v1";
const NOTIF_EVENT = "assigner:notifs";
const OPEN_EVENT = "assigner:open-notifs";
const THEME_KEY = "darkMode";
const YEAR = new Date().getFullYear();

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

ensureNbFont();

const PAGES = {
  dashboard: "Dashboard",
  delivery: "Delivery Network",
  orders: "Order Queue",
  repairs: "Repair Queue",
  assignedOrders: "Assigned Orders",
  assignedRepairs: "Assigned Repairs",
  reassignOrders: "Reassign Orders",
  reassignRepairs: "Reassign Repairs",
  logs: "Assignment Logs",
  profile: "My Profile",
};
const FALLBACK_TITLE = "Assigner Hub";
const DASHBOARD_TITLE = "Dashboard Overview";

const GROUP_LABELS = { main: "Menu", queues: "Queues", assignments: "Assignments" };

const MENU_GROUPS = [
  {
    key: "main",
    items: [
      { key: "dashboard", path: "/assigner/dashboard", icon: FiActivity },
      { key: "delivery", path: "/assigner/delivery", icon: FiUsers },
    ],
  },
  {
    key: "queues",
    items: [
      { key: "orders", path: "/assigner/orders", icon: FiBox },
      { key: "repairs", path: "/assigner/repair-requests", icon: FiTool },
    ],
  },
  {
    key: "assignments",
    items: [
      { key: "assignedOrders", path: "/assigner/assigned-orders", icon: FiArchive },
      { key: "assignedRepairs", path: "/assigner/assigned-repairs", icon: FiArchive },
      { key: "reassignOrders", path: "/assigner/reassign-orders", icon: FiRefreshCw },
      { key: "reassignRepairs", path: "/assigner/reassign-repairs", icon: FiRefreshCw },
      { key: "logs", path: "/assigner/assignment-logs", icon: FiClipboard },
    ],
  },
];

const ALL_ITEMS = MENU_GROUPS.flatMap((g) => g.items.map((i) => ({
  ...i,
  group: g.key,
  name: PAGES[i.key],
  lower: PAGES[i.key].toLowerCase(),
})));
const PATH_TITLE = Object.fromEntries(ALL_ITEMS.map((i) => [i.path, i.name]));
PATH_TITLE["/assigner/profile"] = PAGES.profile;
PATH_TITLE["/assigner/dashboard"] = DASHBOARD_TITLE;

const CTRL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const sanitizeSearch = (v) => String(v ?? "").replace(CTRL, "").replace(/[<>]/g, "").replace(/\s{2,}/g, " ").slice(0, SEARCH_MAX);

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

const formatTime = (ts) => {
  if (!ts) return "";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  const mins = Math.floor((Date.now() - date) / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return SHORT_DATE.format(date);
};

const readStorage = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const writeStorage = (key, value) => { try { localStorage.setItem(key, value); } catch {} };

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const d = jwtDecode(token);
    return !d.exp || d.exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

const readName = (token) => {
  if (!token) return "";
  try {
    const d = jwtDecode(token);
    return String(d.name || d.fullName || d.username || d.sub || d.email || "").split("@")[0];
  } catch {
    return "";
  }
};

const readStoredTheme = () => {
  const saved = readStorage(THEME_KEY);
  if (saved === "true" || saved === "false") return saved === "true";
  return document.documentElement.classList.contains("dark");
};

const applyTheme = (dark) => {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  writeStorage(THEME_KEY, String(dark));
};

const clearSession = (darkMode) => {
  try { localStorage.clear(); sessionStorage.clear(); } catch {}
  writeStorage(THEME_KEY, String(darkMode));
};

const asList = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  return Array.isArray(d?.content) ? d.content : [];
};

const readNotifCache = () => {
  try {
    const c = JSON.parse(sessionStorage.getItem(NOTIF_KEY));
    return Array.isArray(c) ? c : [];
  } catch {
    return [];
  }
};

const countUnread = (list) => list.reduce((n, x) => n + (x.read ? 0 : 1), 0);
const notifSignature = (list) => list.map((n) => `${n.id}:${n.read ? 1 : 0}`).join("|");

const confirmDialog = async (opts, darkMode) => {
  const { default: Swal } = await import("sweetalert2");
  const { isConfirmed } = await Swal.fire({
    icon: "warning",
    showCancelButton: true,
    background: darkMode ? "#2a2a2a" : "#ffffff",
    color: darkMode ? "#ffffff" : "#04261a",
    ...opts,
  });
  return isConfirmed;
};

const META = {
  order: { Icon: FiBox, tone: "" },
  repair: { Icon: FiTool, tone: "" },
  assign: { Icon: FiClipboard, tone: "" },
  warning: { Icon: FiAlertTriangle, tone: "nb-tile-warn" },
  error: { Icon: FiAlertCircle, tone: "nb-tile-danger" },
  info: { Icon: FiInfo, tone: "" },
};

const getNotifMeta = (n) => {
  const t = String(n.type || n.category || "").toLowerCase();
  if (t.includes("order")) return META.order;
  if (t.includes("repair")) return META.repair;
  if (t.includes("assign")) return META.assign;
  if (t.includes("warning")) return META.warning;
  if (t.includes("error")) return META.error;
  return META.info;
};

const STYLES = `
html,body{overflow-x:hidden;max-width:100vw}
.nb{--nb-bg:#f9fafb;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e8ebe9;--nb-dot:#04261a;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-dot:#3f3f3f;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-surface{background:var(--nb-card);color:var(--nb-ink)}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-accent-bg{background:var(--nb-accent)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
.nb-sep{border-top:2px dotted var(--nb-dot)}
.nb-row{border-bottom:2px dotted var(--nb-dot)}
.nb-row:last-child{border-bottom:0}
:where(.nb-tile){display:inline-flex}
.nb-tile{align-items:center;justify-content:center;flex:none;border:2px solid var(--nb-line);color:#04261a;background:#34d399}
.nb-tile-warn{background:#facc15;color:#000}
.nb-tile-danger{background:#ef4444;color:#fff}
:where(.nb-btn){display:inline-flex}
.nb-btn{align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn-danger:hover:not(:disabled){background:#ef4444;color:#fff}
.nb-btn:focus-visible,.nb-field:focus-within,.nb-field:focus-visible,.nb-link:focus-visible{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow)}
.nb-field-link{transition:transform .12s ease,box-shadow .12s ease}
.nb-field-link:hover{transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
:where(.nb-opt){display:flex}
.nb-opt{width:100%;align-items:center;gap:10px;padding:9px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:left;cursor:pointer}
.nb-opt:hover{background:var(--nb-btn);color:var(--nb-on)}
:where(.nb-link){display:flex}
.nb-link{align-items:center;gap:12px;padding:9px 12px;border:2px solid transparent;font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:.02em;color:var(--nb-ink);transition:transform .12s ease,background-color .12s ease}
.nb-link:hover{background:var(--nb-gray);border:2px dotted var(--nb-dot)}
.nb-link-on,.nb-link-on:hover{background:var(--nb-btn);color:var(--nb-on);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow)}
.custom-scrollbar-thin{scrollbar-width:thin;scrollbar-color:rgba(52,211,153,.6) transparent}
.custom-scrollbar-thin::-webkit-scrollbar{width:5px}
.custom-scrollbar-thin::-webkit-scrollbar-track{background:transparent}
.custom-scrollbar-thin::-webkit-scrollbar-thumb{background:rgba(52,211,153,.55)}
.custom-scrollbar-thin::-webkit-scrollbar-thumb:hover{background:#34d399}
@keyframes nbIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@keyframes nbPop{0%{transform:scale(.4);opacity:0}65%{transform:scale(1.25)}100%{transform:scale(1);opacity:1}}
@keyframes nbWiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(14deg)}75%{transform:rotate(-14deg)}}
.notif-panel{animation:nbIn .16s ease-out both;transform-origin:top}
.badge-pop{animation:nbPop .3s ease-out both}
.bell-ring{animation:nbWiggle .5s ease-in-out 3;transform-origin:50% 0}
@media (prefers-reduced-motion:reduce){
  .nb-btn,.nb-link,.nb-field-link{transition:none}
  .notif-panel,.badge-pop,.bell-ring{animation:none}
}
`;
const STYLE_HTML = { __html: STYLES };

const TOAST_STYLE = {
  ...NB_FONT_STYLE,
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 0,
  border: "2px solid var(--nb-line)",
  boxShadow: "3px 3px 0 var(--nb-shadow)",
  background: "var(--nb-card)",
  color: "var(--nb-ink)",
};

const AllCaughtUp = memo(() => (
  <svg viewBox="0 0 160 160" fill="none" className="w-full h-full" aria-hidden="true">
    <circle cx="80" cy="80" r="70" style={{ fill: "var(--nb-gray)" }} />
    <path
      d="M80 40c-14 0-22 11-22 25v16l-9 13h62l-9-13V65c0-14-8-25-22-25z"
      style={{ fill: "var(--nb-accent)", stroke: "var(--nb-ink)" }}
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <rect x="74" y="28" width="12" height="10" style={{ fill: "var(--nb-ink)" }} />
    <path d="M70 100a10 10 0 0020 0" style={{ stroke: "var(--nb-ink)" }} strokeWidth="4" strokeLinecap="round" />
    <rect x="96" y="36" width="32" height="32" style={{ fill: "var(--nb-card)", stroke: "var(--nb-ink)" }} strokeWidth="3" />
    <path d="M104 52l6 6 11-12" style={{ stroke: "var(--nb-ink)" }} strokeWidth="4" strokeLinecap="square" />
  </svg>
));

const SidebarLink = memo(({ item, active, onClick }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`nb-link ${active ? "nb-link-on" : ""}`}
    >
      <Icon size={ICON} aria-hidden="true" className="flex-shrink-0" />
      <span className="truncate">{PAGES[item.key]}</span>
    </Link>
  );
});

const SidebarNav = memo(({ pathname, onClick }) => (
  <nav aria-label="Main navigation" className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-5 custom-scrollbar-thin">
    {MENU_GROUPS.map((g, i) => (
      <div key={g.key} className={`space-y-1.5 ${i === 0 ? "" : "nb-sep pt-5"}`}>
        {g.items.map((item) => (
          <SidebarLink key={item.path} item={item} active={pathname === item.path} onClick={onClick} />
        ))}
      </div>
    ))}
  </nav>
));

const SearchBox = memo(({ onNavigate }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (let i = 0; i < ALL_ITEMS.length && out.length < 6; i++) {
      if (ALL_ITEMS[i].lower.includes(q)) out.push(ALL_ITEMS[i]);
    }
    return out;
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const goTo = useCallback((path) => {
    onNavigate(path);
    setQuery("");
    setOpen(false);
  }, [onNavigate]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && results[0]) goTo(results[0].path);
    if (e.key === "Escape") { setQuery(""); setOpen(false); }
  };

  return (
    <div ref={ref} role="search" className="relative w-full max-w-md">
      <div className="nb-field flex h-10 items-center gap-2 px-3">
        <FiSearch size={16} aria-hidden="true" className="flex-shrink-0" />
        <label htmlFor="assigner-search" className="sr-only">Search pages</label>
        <input
          id="assigner-search"
          type="text"
          value={query}
          placeholder="Search pages..."
          maxLength={SEARCH_MAX}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          onChange={(e) => { setQuery(sanitizeSearch(e.target.value)); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
        />
      </div>

      {open && query.trim() && (
        <div className="nb-menu absolute inset-x-0 top-12 z-10 overflow-hidden">
          {results.length ? results.map((r) => {
            const Icon = r.icon;
            return (
              <button key={r.path} type="button" onClick={() => goTo(r.path)} className="nb-opt">
                <Icon size={16} aria-hidden="true" className="flex-shrink-0" />
                <span className="flex-1 truncate">{r.name}</span>
                <span className="nb-muted hidden md:block text-[10px]">{GROUP_LABELS[r.group]}</span>
                <FiChevronRight size={14} aria-hidden="true" />
              </button>
            );
          }) : (
            <p className="nb-muted px-4 py-3 text-sm font-semibold">No matching pages</p>
          )}
        </div>
      )}
    </div>
  );
});

const NotifItem = memo(({ notif, onDelete }) => {
  const { Icon, tone } = getNotifMeta(notif);
  const [exit, setExit] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (exit) return;
    setExit(true);
    timer.current = setTimeout(() => onDelete(notif.id), 200);
  };

  return (
    <div
      className={`nb-row group relative flex items-start gap-2.5 px-3.5 py-3 transition duration-200 motion-reduce:transition-none
        ${exit ? "opacity-0 -translate-x-2" : ""}
        ${notif.read ? "" : "nb-gray"}`}
    >
      {!notif.read && <span aria-hidden="true" className="nb-accent-bg absolute right-0 top-0 bottom-0 w-1" />}

      <span className={`nb-tile w-8 h-8 mt-0.5 ${tone}`}>
        <Icon size={14} aria-hidden="true" />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[13px] font-extrabold leading-snug truncate">
            {notif.title || notif.message || "New logistics activity"}
          </p>
          <span className="nb-muted shrink-0 text-[10px] font-bold">{formatTime(notif.timestamp || notif.createdAt)}</span>
        </div>
        {notif.title && notif.message && (
          <p className="nb-muted mt-0.5 text-xs font-semibold leading-5 line-clamp-2">{notif.message}</p>
        )}
      </div>

      <button
        type="button"
        onClick={handleDelete}
        title="Delete notification"
        aria-label="Delete notification"
        className="nb-btn nb-btn-danger h-6 w-6 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150 motion-reduce:transition-none"
      >
        <FiX size={12} aria-hidden="true" />
      </button>
    </div>
  );
});

const NotificationPanel = memo(({ list, loading, unread, onDelete, onRefresh }) => {
  const visible = useMemo(
    () => (list.length > MAX_RENDERED_NOTIFS ? list.slice(0, MAX_RENDERED_NOTIFS) : list),
    [list]
  );

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      onClick={(e) => e.stopPropagation()}
      className="notif-panel nb-menu fixed top-[4.25rem] inset-x-3 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[360px] overflow-hidden z-50"
    >
      <div className="nb-line flex items-center justify-between gap-2 px-3.5 py-2.5 border-b-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-sm font-extrabold uppercase"><span className="nb-ul">Notifications</span></h2>
          {unread > 0 && <span className="nb-muted text-[11px] font-bold">{unread} new</span>}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh notifications"
          aria-label="Refresh notifications"
          className="nb-btn h-7 w-7 flex-shrink-0"
        >
          <FiRefreshCw size={13} aria-hidden="true" className={loading ? "animate-spin motion-reduce:animate-none" : ""} />
        </button>
      </div>

      <div className="max-h-[min(400px,60vh)] overflow-y-auto custom-scrollbar-thin overscroll-contain">
        {loading && list.length === 0 ? (
          <div className="p-3 space-y-3" role="status" aria-label="Loading">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-2.5 animate-pulse motion-reduce:animate-none">
                <div className="nb-gray nb-line w-8 h-8 border-2" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <div className="nb-gray h-2.5 w-2/3" />
                  <div className="nb-gray h-2 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-1.5">
            <div className="w-20 h-20"><AllCaughtUp /></div>
            <p className="nb-muted text-sm font-extrabold uppercase">All caught up</p>
            <p className="nb-muted px-4 text-center text-xs font-semibold">New assignments and updates will show up here.</p>
          </div>
        ) : (
          visible.map((x) => <NotifItem key={x.id} notif={x} onDelete={onDelete} />)
        )}
      </div>
    </div>
  );
});

const NotificationMenu = memo(() => {
  const { pathname } = useLocation();
  const [list, setList] = useState(readNotifCache);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0);
  const [ringing, setRinging] = useState(false);

  const wrapRef = useRef(null);
  const listRef = useRef(list);
  const abortRef = useRef(null);
  const lastRef = useRef(0);
  const failRef = useRef(0);
  const ringTimer = useRef(null);
  const prevUnreadRef = useRef(countUnread(list));
  const busyRef = useRef(new Set());

  const unread = useMemo(() => countUnread(list), [list]);

  const publish = useCallback((next) => {
    listRef.current = next;
    setList(next);
    try { sessionStorage.setItem(NOTIF_KEY, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT, { detail: next }));
  }, []);

  const fetchNotifs = useCallback(async () => {
    const token = readStorage("authToken");
    if (!token || isTokenExpired(token)) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await api.get("/api/notifications/assigner", {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted) return;
      lastRef.current = Date.now();
      failRef.current = 0;
      const next = asList(res);
      if (notifSignature(next) !== notifSignature(listRef.current)) {
        const nu = countUnread(next);
        if (nu > prevUnreadRef.current) {
          setBadgeKey((k) => k + 1);
          setRinging(true);
          clearTimeout(ringTimer.current);
          ringTimer.current = setTimeout(() => setRinging(false), 1800);
        }
        prevUnreadRef.current = nu;
        publish(next);
      }
    } catch (err) {
      if (ctrl.signal.aborted || err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      failRef.current = Math.min(failRef.current + 1, 3);
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [publish]);

  useEffect(() => {
    let timer;
    let stopped = false;
    const stale = (ms) => Date.now() - lastRef.current > ms;
    const run = async () => {
      if (stopped) return;
      if (!document.hidden && stale(MIN_GAP)) await fetchNotifs();
      if (stopped) return;
      const wait = Math.min(REFRESH_INTERVAL * 2 ** failRef.current, MAX_INTERVAL) + Math.random() * 3000;
      timer = setTimeout(run, wait);
    };
    const onVisible = () => { if (!document.hidden && stale(REFRESH_INTERVAL)) fetchNotifs(); };
    run();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearTimeout(ringTimer.current);
      document.removeEventListener("visibilitychange", onVisible);
      abortRef.current?.abort();
    };
  }, [fetchNotifs]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  const handleDelete = useCallback(async (id) => {
    const key = `del:${id}`;
    if (busyRef.current.has(key)) return;
    busyRef.current.add(key);
    try {
      await api.delete(`/api/notifications/assigner/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${readStorage("authToken")}` },
      });
      const next = listRef.current.filter((n) => n.id !== id);
      prevUnreadRef.current = countUnread(next);
      publish(next);
      toast.success("Notification cleared");
    } catch {
      toast.error("Could not clear notification");
    } finally {
      busyRef.current.delete(key);
    }
  }, [publish]);

  return (
    <div ref={wrapRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`nb-btn relative w-10 h-10 ${open ? "nb-btn-on" : ""}`}
      >
        <FiBell size={ICON} aria-hidden="true" className={ringing ? "bell-ring" : ""} />
        {unread > 0 && (
          <span
            key={badgeKey}
            aria-hidden="true"
            className="badge-pop nb-line absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 grid place-items-center text-[9px] font-extrabold leading-none text-white bg-red-500 border-2"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          list={list}
          loading={loading}
          unread={unread}
          onDelete={handleDelete}
          onRefresh={fetchNotifs}
        />
      )}
    </div>
  );
});

const AssignerHeader = ({ darkMode: darkModeProp, toggleDarkMode }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tokenRef = useRef(readStorage("authToken"));
  const busyRef = useRef(false);

  const controlled = darkModeProp !== undefined && typeof toggleDarkMode === "function";
  const [localDark, setLocalDark] = useState(readStoredTheme);
  const darkMode = controlled ? !!darkModeProp : localDark;

  useEffect(() => { applyTheme(darkMode); }, [darkMode]);

  useEffect(() => {
    if (controlled) return undefined;
    const onStorage = (e) => {
      if (e.key === THEME_KEY && (e.newValue === "true" || e.newValue === "false")) setLocalDark(e.newValue === "true");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [controlled]);

  const setTheme = useCallback((next) => {
    if (next === darkMode) return;
    if (controlled) toggleDarkMode(next);
    else setLocalDark(next);
  }, [controlled, darkMode, toggleDarkMode]);
  const setLight = useCallback(() => setTheme(false), [setTheme]);
  const setDark = useCallback(() => setTheme(true), [setTheme]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState(() => readName(tokenRef.current));

  useEffect(() => {
    if (isTokenExpired(readStorage("authToken"))) {
      try {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
      } catch {}
      navigate("/login", { replace: true });
    }
  }, [pathname, navigate]);

  useEffect(() => {
    const token = tokenRef.current;
    if (isTokenExpired(token)) return undefined;
    const ctrl = new AbortController();
    api
      .get("/api/assigner/profile", {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      })
      .then(({ data }) => {
        if (ctrl.signal.aborted || !data?.name) return;
        const first = String(data.name).split(" ")[0];
        setName((prev) => (prev === first ? prev : first));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  const handleLogout = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const ok = await confirmDialog({
        title: "Confirm logout",
        text: "Ending your assigner session?",
        confirmButtonColor: "#059669",
        cancelButtonColor: "#ef4444",
        confirmButtonText: "Logout now",
        cancelButtonText: "Cancel",
      }, darkMode);
      if (!ok) return;

      const token = readStorage("authToken");
      const refreshToken = readStorage("refreshToken");
      try {
        if (token && refreshToken)
          await api.post("/api/auth/logout", { refreshToken }, { headers: { Authorization: `Bearer ${token}` } });
      } catch {}
      clearSession(darkMode);
      navigate("/login", { replace: true });
    } finally {
      busyRef.current = false;
    }
  }, [navigate, darkMode]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const goTo = useCallback((path) => navigate(path), [navigate]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen]);

  const pageTitle = PATH_TITLE[pathname] || FALLBACK_TITLE;

  return (
    <div className={`nb ${darkMode ? "nb-dark" : ""} contents`} lang="en" style={NB_FONT_STYLE}>
      <ToastContainer position="top-right" theme={darkMode ? "dark" : "light"} toastStyle={TOAST_STYLE} />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] lg:hidden" onClick={closeSidebar} aria-hidden="true" />
      )}

      <aside
        aria-label="Assigner portal sidebar"
        className={`nb-surface nb-line fixed inset-y-0 left-0 z-[70] w-64 flex flex-col border-r-2 transition-[transform,visibility] duration-300 motion-reduce:transition-none
          ${sidebarOpen ? "translate-x-0 visible" : "-translate-x-full invisible"}
          lg:translate-x-0 lg:visible`}
      >
        <div className="nb-line flex items-center justify-between gap-2 px-4 h-16 flex-shrink-0 border-b-2">
          <Link
            to="/assigner/dashboard"
            aria-label="Tech & Restore"
            onClick={closeSidebar}
            className="nb-link !border-transparent !bg-transparent !p-1 !shadow-none flex items-center gap-3 min-w-0"
          >
            <img
              src={logo}
              alt="Tech & Restore"
              width="40"
              height="40"
              decoding="async"
              fetchPriority="high"
              className="h-10 w-auto max-w-[64px] flex-shrink-0 object-contain"
            />
            <span className="min-w-0 leading-tight normal-case">
              <span className="block text-xl font-extrabold tracking-tight truncate">
                Assigner <span className="nb-ul">Hub</span>
              </span>
              <span className="nb-muted block text-[10px] font-semibold tracking-normal truncate">Tech &amp; Restore Logistics</span>
            </span>
          </Link>
          {sidebarOpen && (
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Close navigation sidebar"
              className="nb-btn lg:hidden h-9 w-9 flex-shrink-0"
            >
              <FiX size={ICON} aria-hidden="true" />
            </button>
          )}
        </div>

        <SidebarNav pathname={pathname} onClick={closeSidebar} />

        <div className="nb-line p-3 space-y-2.5 flex-shrink-0 border-t-2">
          <div role="group" aria-label="Theme" className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={setLight}
              aria-pressed={!darkMode}
              className={`nb-btn py-1.5 text-xs uppercase ${!darkMode ? "nb-btn-on" : ""}`}
            >
              <FiSun size={14} aria-hidden="true" /> Light
            </button>
            <button
              type="button"
              onClick={setDark}
              aria-pressed={darkMode}
              className={`nb-btn py-1.5 text-xs uppercase ${darkMode ? "nb-btn-on" : ""}`}
            >
              <FiMoon size={14} aria-hidden="true" /> Dark
            </button>
          </div>
          <button type="button" onClick={handleLogout} className="nb-btn nb-btn-a w-full py-2 text-xs uppercase">
            <FiLogOut size={14} aria-hidden="true" /> Logout
          </button>
          <p className="nb-muted pt-0.5 text-center text-[10px] font-semibold">© {YEAR} Tech &amp; Restore</p>
        </div>
      </aside>

      <header
        role="banner"
        className="nb-surface nb-line fixed top-0 left-0 right-0 lg:left-64 h-16 z-40 border-b-2 flex items-center justify-between gap-4 px-4 sm:px-6"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={openSidebar}
            aria-label="Open navigation sidebar"
            aria-expanded={sidebarOpen}
            className="nb-btn lg:hidden w-10 h-10 flex-shrink-0"
          >
            <FiMenu size={20} aria-hidden="true" />
          </button>
          <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-tight truncate">
            <span className="nb-ul">{pageTitle}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-1 justify-end min-w-0">
          <div className="hidden sm:flex flex-1 justify-end min-w-0">
            <SearchBox onNavigate={goTo} />
          </div>

          <NotificationMenu />

          <Link
            to="/assigner/profile"
            className="nb-field nb-field-link flex items-center gap-2.5 h-10 pl-1 pr-1 md:pr-3 flex-shrink-0"
          >
            <span className="nb-tile w-7 h-7 text-sm font-extrabold uppercase">
              {name ? name.charAt(0) : <FiUser size={16} aria-hidden="true" />}
            </span>
            <span className="hidden md:block leading-tight text-left">
              <span className="block text-xs font-extrabold uppercase truncate max-w-[110px]">{name || "Assigner"}</span>
              <span className="nb-muted block text-[10px] font-bold">Assigner</span>
            </span>
          </Link>
        </div>
      </header>

      <style dangerouslySetInnerHTML={STYLE_HTML} />
    </div>
  );
};

export default memo(AssignerHeader);