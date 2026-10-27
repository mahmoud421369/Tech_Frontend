import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import {
  FiMoon, FiSun, FiLogOut, FiMenu, FiX, FiBox, FiTool, FiSearch, FiBell,
  FiGrid, FiTag, FiMessageSquare, FiShoppingBag, FiCreditCard, FiPackage,
  FiCalendar, FiCheck, FiInfo, FiAlertTriangle, FiAlertCircle, FiChevronRight,
  FiTrash2, FiGlobe, FiUser,
} from "react-icons/fi";
import { RiCheckDoubleLine } from "react-icons/ri";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import api from "../../common/api/api";
import logo from "../../common/images/tech-restore-logo.webp";
import { useAppLanguage } from "../../common/utils/useAppLanguage";
import { getFontStyle, ensureShopAssets } from "../../common/utils/shopFonts";
import shopAr from "../../common/ShopLocales/shopAr";
import shopEn from "../../common/ShopLocales/shopEn";

ensureShopAssets();

const ICON = 18;
const POLL_MS = 30_000;
const MAX_BACKOFF_STEPS = 4;
const MAX_RENDERED_NOTIFS = 50;
const SEARCH_MAX = 40;
const YEAR = new Date().getFullYear();

const MENU_GROUPS = [
  {
    key: "main",
    items: [
      { key: "dashboard", path: "/shop/dashboard", icon: FiGrid },
      { key: "chats", path: "/shop/chats", icon: FiMessageSquare },
    ],
  },
  {
    key: "sales",
    items: [
      { key: "orders", path: "/shop/orders", icon: FiShoppingBag },
      { key: "offers", path: "/shop/offers", icon: FiTag },
      { key: "transactions", path: "/shop/transactions", icon: FiCreditCard },
    ],
  },
  {
    key: "services",
    items: [
      { key: "repairRequests", path: "/shop/repair-requests", icon: FiTool },
      { key: "devices", path: "/shop/devices", icon: FiPackage },
      { key: "inventory", path: "/shop/inventory", icon: FiBox },
    ],
  },
  {
    key: "account",
    items: [{ key: "subscriptions", path: "/shop/subscriptions", icon: FiCalendar }],
  },
];
const ALL_ITEMS = MENU_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.key })));
const PATH_KEY = Object.fromEntries(ALL_ITEMS.map((i) => [i.path, i.key]));
PATH_KEY["/shop/profile"] = "profile";

const LANGS = [
  { code: "ar", label: "عربي" },
  { code: "en", label: "EN" },
];

const sanitizeSearch = (v) =>
  String(v ?? "")
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069<>]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, SEARCH_MAX);

const tpl = (str, vars) => String(str).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const dfCache = {};
const getShortDate = (locale) =>
  (dfCache[locale] ||= new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }));

const formatTime = (ts, t, locale) => {
  if (!ts) return "";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  const mins = Math.floor((Date.now() - date) / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return t.time.now;
  if (mins < 60) return tpl(t.time.min, { n: mins });
  if (hours < 24) return tpl(t.time.hour, { n: hours });
  if (days === 1) return t.time.yesterday;
  if (days < 7) return tpl(t.time.days, { n: days });
  return getShortDate(locale).format(date);
};

const readStorage = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const writeStorage = (key, value) => { try { localStorage.setItem(key, value); } catch {} };

const setAppLanguage = (code) => {
  writeStorage("appLanguage", code);
  window.dispatchEvent(new Event("appLanguageChanged"));
};

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const d = jwtDecode(token);
    return !d.exp || d.exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

const readProfileName = (token) => {
  if (!token) return "";
  try {
    const d = jwtDecode(token);
    const name = d.name || d.fullName || d.username || d.sub || d.email || "";
    return String(name).split("@")[0];
  } catch {
    return "";
  }
};

const countUnread = (list) => list.reduce((c, n) => c + (n.read ? 0 : 1), 0);
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
  order: { Icon: FiShoppingBag, tone: "" },
  repair: { Icon: FiTool, tone: "" },
  payment: { Icon: FiCreditCard, tone: "" },
  warning: { Icon: FiAlertTriangle, tone: "nb-tile-warn" },
  error: { Icon: FiAlertCircle, tone: "nb-tile-danger" },
  message: { Icon: FiMessageSquare, tone: "" },
  info: { Icon: FiInfo, tone: "" },
};

const getNotifMeta = (n) => {
  const t = String(n.type || n.category || "").toLowerCase();
  if (t.includes("order") || t.includes("طلب")) return META.order;
  if (t.includes("repair") || t.includes("تصليح")) return META.repair;
  if (t.includes("payment") || t.includes("دفع") || t.includes("معاملة")) return META.payment;
  if (t.includes("warning") || t.includes("تحذير")) return META.warning;
  if (t.includes("error") || t.includes("خطأ")) return META.error;
  if (t.includes("message") || t.includes("رسالة") || t.includes("chat")) return META.message;
  return META.info;
};

const STYLES = `
html[lang="ar"] body{font-family:'Cairo',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif}
html[lang="en"] body{font-family:'Space Grotesk',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif}
html,body{overflow-x:hidden;max-width:100vw}
.nb{--nb-bg:#f9fafb;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#e6eae8;--nb-shadow:#e6eae8;--nb-gray:#f1f3f2;--nb-dot:#e6eae8;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-dot:#3f3f3f;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb[dir="rtl"] *{letter-spacing:0!important}
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
.nb-tile{align-items:center;justify-content:center;flex:none;border:2px solid var(--nb-line);color:var(--nb-on);background:var(--nb-btn)}
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
.nb-opt{width:100%;align-items:center;gap:10px;padding:9px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:start;cursor:pointer}
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
@keyframes nbFade{from{opacity:0}to{opacity:1}}
.notif-panel{animation:nbIn .16s ease-out both;transform-origin:top}
.badge-pop{animation:nbPop .3s ease-out both}
.bell-ring{animation:nbWiggle .5s ease-in-out 3;transform-origin:50% 0}
.lang-fade{animation:nbFade .2s ease-out both}
@media (prefers-reduced-motion:reduce){
  .nb-btn,.nb-link,.nb-field-link{transition:none}
  .notif-panel,.badge-pop,.bell-ring,.lang-fade{animation:none}
}
`;
const STYLE_HTML = { __html: STYLES };

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

const SidebarLink = memo(({ item, label, active, onClick }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`nb-link ${active ? "nb-link-on" : ""}`}
    >
      <Icon size={ICON} aria-hidden="true" className="flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
});

const SidebarNav = memo(({ t, pathname, onClick }) => (
  <nav aria-label={t.navAria} className="lang-fade flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-5 custom-scrollbar-thin">
    {MENU_GROUPS.map((g, i) => (
      <div key={g.key} className={`space-y-1.5 ${i === 0 ? "" : "nb-sep pt-5"}`}>
        {g.items.map((item) => (
          <SidebarLink key={item.path} item={item} label={t.pages[item.key]} active={pathname === item.path} onClick={onClick} />
        ))}
      </div>
    ))}
  </nav>
));

const SearchBox = memo(({ t, onNavigate }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const items = useMemo(
    () => ALL_ITEMS.map((i) => ({ ...i, name: t.pages[i.key], lower: t.pages[i.key].toLowerCase() })),
    [t]
  );
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (let i = 0; i < items.length && out.length < 6; i++) {
      if (items[i].lower.includes(q)) out.push(items[i]);
    }
    return out;
  }, [query, items]);

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
        <label htmlFor="shop-search" className="sr-only">{t.searchLabel}</label>
        <input
          id="shop-search"
          type="text"
          value={query}
          placeholder={t.searchPlaceholder}
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
                <span className="nb-muted hidden md:block text-[10px]">{t.groups[r.group]}</span>
                <FiChevronRight size={14} aria-hidden="true" className="rtl:rotate-180" />
              </button>
            );
          }) : (
            <p className="nb-muted px-4 py-3 text-sm font-semibold">{t.noResults}</p>
          )}
        </div>
      )}
    </div>
  );
});

const LanguageSwitch = memo(({ language, label, onChange }) => {
  const styles = useMemo(() => LANGS.map((l) => getFontStyle(l.code)), []);
  return (
    <div role="group" aria-label={label} className="nb-field flex items-center h-10 p-1 gap-1 flex-shrink-0">
      <FiGlobe size={14} aria-hidden="true" className="nb-ic mx-1.5 hidden md:block" />
      {LANGS.map((l, i) => (
        <button
          key={l.code}
          type="button"
          onClick={() => onChange(l.code)}
          aria-pressed={language === l.code}
          lang={l.code}
          style={styles[i]}
          className={`nb-btn h-7 px-2.5 text-xs ${language === l.code ? "nb-btn-on" : ""}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
});

const NotifItem = memo(({ notif, t, locale, onDelete, onMarkRead }) => {
  const { Icon, tone } = useMemo(() => getNotifMeta(notif), [notif]);
  const [exit, setExit] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (exit) return;
    setExit(true);
    timer.current = setTimeout(() => onDelete(notif.id), 200);
  };

  const handleRead = (e) => {
    e.stopPropagation();
    onMarkRead(notif.id);
  };

  return (
    <div
      className={`nb-row group relative flex items-start gap-2.5 px-3.5 py-3 transition duration-200 motion-reduce:transition-none
        ${exit ? "opacity-0 ltr:-translate-x-2 rtl:translate-x-2" : ""}
        ${notif.read ? "" : "nb-gray"}`}
    >
      {!notif.read && <span aria-hidden="true" className="nb-accent-bg absolute end-0 top-0 bottom-0 w-1" />}

      <span className={`nb-tile w-8 h-8 mt-0.5 ${tone}`}>
        <Icon size={14} aria-hidden="true" />
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[13px] font-extrabold leading-snug truncate">{notif.title}</p>
          <span className="nb-muted shrink-0 text-[10px] font-bold">
            {formatTime(notif.timestamp || notif.createdAt, t, locale)}
          </span>
        </div>
        <p className="nb-muted mt-0.5 text-xs font-semibold leading-5 line-clamp-2">{notif.message}</p>
      </div>

      <div className="shrink-0 flex flex-col gap-1 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 motion-reduce:transition-none">
        {!notif.read && (
          <button
            type="button"
            onClick={handleRead}
            title={t.notifications.markRead || "Mark as read"}
            aria-label={t.notifications.markRead || "Mark as read"}
            className="nb-btn h-6 w-6"
          >
            <FiCheck size={12} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          title={t.notifications.delete}
          aria-label={t.notifications.delete}
          className="nb-btn nb-btn-danger h-6 w-6"
        >
          <FiX size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});

const NotificationPanel = memo(({
  t, locale, notifications, loading, unreadCount,
  onDelete, onMarkRead, onMarkAllRead, onClearAll,
}) => {
  const n = t.notifications;
  const visible = useMemo(
    () => (notifications.length > MAX_RENDERED_NOTIFS ? notifications.slice(0, MAX_RENDERED_NOTIFS) : notifications),
    [notifications]
  );

  return (
    <div
      role="dialog"
      aria-label={n.title}
      onClick={(e) => e.stopPropagation()}
      className="notif-panel nb-menu fixed top-[4.25rem] inset-x-3 sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-3 sm:w-[360px] overflow-hidden z-50"
    >
      <div className="nb-line flex items-center justify-between gap-2 px-3.5 py-2.5 border-b-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-sm font-extrabold uppercase">
            <span className="nb-ul">{n.title}</span>
          </h2>
          {unreadCount > 0 && (
            <span className="nb-muted text-[11px] font-bold">{tpl(n.newCount, { n: unreadCount })}</span>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={onMarkAllRead}
              disabled={unreadCount === 0}
              title={n.markAllRead || "Mark all as read"}
              aria-label={n.markAllRead || "Mark all as read"}
              className="nb-btn h-7 w-7"
            >
              <RiCheckDoubleLine size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClearAll}
              title={n.clearAll || "Clear all"}
              aria-label={n.clearAll || "Clear all"}
              className="nb-btn nb-btn-danger h-7 w-7"
            >
              <FiTrash2 size={13} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div className="max-h-[min(400px,60vh)] overflow-y-auto custom-scrollbar-thin overscroll-contain">
        {loading ? (
          <div className="p-3 space-y-3" role="status" aria-label={t.loadingAria}>
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
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-1.5">
            <div className="w-20 h-20"><AllCaughtUp /></div>
            <p className="nb-muted text-sm font-extrabold uppercase">{n.empty}</p>
            <p className="nb-muted px-4 text-center text-xs font-semibold">{n.emptyHint}</p>
          </div>
        ) : (
          <>
            {visible.map((x) => (
              <NotifItem key={x.id} notif={x} t={t} locale={locale} onDelete={onDelete} onMarkRead={onMarkRead} />
            ))}
            {notifications.length > visible.length && (
              <p className="nb-muted px-3 py-2 text-center text-[10px] font-bold">
                {tpl(n.onlyLatest, { n: MAX_RENDERED_NOTIFS })}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
});

const NotificationCenter = memo(({ t, locale, darkMode, token }) => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [badgeKey, setBadgeKey] = useState(0);
  const [ringing, setRinging] = useState(false);
  const unreadCount = useMemo(() => countUnread(notifications), [notifications]);

  const wrapRef = useRef(null);
  const prevUnreadRef = useRef(0);
  const ringTimer = useRef(null);
  const notifsRef = useRef(notifications);
  const fetchAbortRef = useRef(null);
  const busyRef = useRef(new Set());
  const failCountRef = useRef(0);
  const tRef = useRef(t);
  notifsRef.current = notifications;
  tRef.current = t;

  useEffect(() => { prevUnreadRef.current = unreadCount; }, [unreadCount]);

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

  const fetchNotifications = useCallback(async () => {
    if (!token) return true;
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    try {
      const res = await api.get("/api/notifications/shops", { signal: controller.signal });
      if (controller.signal.aborted) return true;
      const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
      if (notifSignature(data) !== notifSignature(notifsRef.current)) {
        const newUnread = countUnread(data);
        setNotifications(data);
        if (newUnread > prevUnreadRef.current) {
          setBadgeKey((k) => k + 1);
          setRinging(true);
          clearTimeout(ringTimer.current);
          ringTimer.current = setTimeout(() => setRinging(false), 1800);
        }
      }
      return true;
    } catch {
      return controller.signal.aborted;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let timer;
    let stopped = false;
    let generation = 0;

    const run = async () => {
      const mine = ++generation;
      if (!document.hidden) {
        const ok = await fetchNotifications();
        failCountRef.current = ok ? 0 : Math.min(failCountRef.current + 1, MAX_BACKOFF_STEPS);
      }
      if (stopped || mine !== generation) return;
      timer = setTimeout(run, POLL_MS * 2 ** failCountRef.current);
    };

    const onVisible = () => {
      if (document.hidden) return;
      clearTimeout(timer);
      run();
    };

    run();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearTimeout(ringTimer.current);
      fetchAbortRef.current?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, fetchNotifications]);

  const handleDelete = useCallback(async (id) => {
    const key = `del:${id}`;
    if (busyRef.current.has(key)) return;
    busyRef.current.add(key);
    try {
      await api.delete(`/api/notifications/shops/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success(tRef.current.toasts.deleted);
    } catch {
      toast.error(tRef.current.toasts.deleteFail);
    } finally {
      busyRef.current.delete(key);
    }
  }, []);

  const handleMarkRead = useCallback(async (id) => {
    const key = `read:${id}`;
    if (busyRef.current.has(key)) return;
    busyRef.current.add(key);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.put(`/api/notifications/shops/${id}/read`);
    } catch {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
      toast.error(tRef.current.toasts.markReadFail);
    } finally {
      busyRef.current.delete(key);
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    if (busyRef.current.has("read-all")) return;
    busyRef.current.add("read-all");
    const snapshot = notifsRef.current;
    setNotifications((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
    try {
      await api.put("/api/notifications/shops/read-all");
      toast.success(tRef.current.toasts.markAllOk);
    } catch {
      setNotifications(snapshot);
      toast.error(tRef.current.toasts.markAllFail);
    } finally {
      busyRef.current.delete("read-all");
    }
  }, []);

  const handleClearAll = useCallback(async () => {
    if (busyRef.current.has("clear-all")) return;
    busyRef.current.add("clear-all");
    try {
      const d = tRef.current.dialogs;
      const ok = await confirmDialog({
        title: d.clearTitle,
        text: d.clearText,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: d.clearConfirm,
        cancelButtonText: d.cancel,
      }, darkMode);
      if (!ok) return;
      try {
        await api.delete("/api/notifications/shops/clear-all");
        setNotifications([]);
        toast.success(tRef.current.toasts.clearOk);
      } catch {
        toast.error(tRef.current.toasts.clearFail);
      }
    } finally {
      busyRef.current.delete("clear-all");
    }
  }, [darkMode]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <div className="relative flex-shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unreadCount > 0 ? tpl(t.bellAria, { n: unreadCount }) : t.notifications.title}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`nb-btn relative w-10 h-10 ${open ? "nb-btn-on" : ""}`}
      >
        <FiBell size={ICON} aria-hidden="true" className={ringing ? "bell-ring" : ""} />
        {unreadCount > 0 && (
          <span
            key={badgeKey}
            aria-hidden="true"
            className="badge-pop nb-line absolute -top-2 -end-2 min-w-[18px] h-[18px] px-1 grid place-items-center text-[9px] font-extrabold leading-none text-white bg-red-500 border-2"
          >
            {unreadCount > 9 ? "+9" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationPanel
          t={t}
          locale={locale}
          notifications={notifications}
          loading={loading}
          unreadCount={unreadCount}
          onDelete={handleDelete}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearAll}
        />
      )}
    </div>
  );
});

const ShopHeader = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const language = useAppLanguage();
  const isAr = language === "ar";
  const L = isAr ? shopAr : shopEn;
  const t = L.header;
  const locale = L.locale;
  const dir = isAr ? "rtl" : "ltr";
  const fontStyle = useMemo(() => getFontStyle(language), [language]);

  const [darkMode, setDarkMode] = useState(() => readStorage("darkMode") === "true");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = useMemo(() => {
    const stored = readStorage("authToken");
    return isTokenExpired(stored) ? null : stored;
  }, []);
  const profileName = useMemo(() => readProfileName(token), [token]);
  const busyRef = useRef(false);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    writeStorage("darkMode", String(darkMode));
  }, [darkMode]);
  const setLight = useCallback(() => setDarkMode(false), []);
  const setDark = useCallback(() => setDarkMode(true), []);

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

  const handleLogout = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const refreshToken = readStorage("refreshToken");
      const d = tRef.current.dialogs;
      const ok = await confirmDialog({
        title: d.logoutTitle,
        text: d.logoutText,
        confirmButtonColor: "#059669",
        cancelButtonColor: "#ef4444",
        confirmButtonText: d.logoutConfirm,
        cancelButtonText: d.cancel,
      }, darkMode);
      if (!ok) return;
      try {
        if (token && refreshToken)
          await api.post("/api/auth/logout", { refreshToken }, { headers: { Authorization: `Bearer ${token}` } });
      } catch {}
      const lang = readStorage("appLanguage");
      try { localStorage.clear(); sessionStorage.clear(); } catch {}
      writeStorage("darkMode", String(darkMode));
      if (lang) writeStorage("appLanguage", lang);
      navigate("/login", { replace: true });
    } finally {
      busyRef.current = false;
    }
  }, [token, navigate, darkMode]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const goTo = useCallback((path) => navigate(path), [navigate]);

  const toastStyle = useMemo(() => ({
    ...fontStyle,
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 0,
    border: "2px solid var(--nb-line)",
    boxShadow: "3px 3px 0 var(--nb-shadow)",
    background: "var(--nb-card)",
    color: "var(--nb-ink)",
  }), [fontStyle]);

  const pageKey = PATH_KEY[pathname];
  const pageTitle = pathname === "/shop/dashboard"
    ? t.dashboardTitle
    : (pageKey && t.pages[pageKey]) || t.pages.fallback;

  return (
    <div className={`nb ${darkMode ? "nb-dark" : ""} contents`} dir={dir} lang={language} style={fontStyle}>
      <ToastContainer
        position={isAr ? "top-left" : "top-right"}
        rtl={isAr}
        theme={darkMode ? "dark" : "light"}
        toastStyle={toastStyle}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] lg:hidden" onClick={closeSidebar} aria-hidden="true" />
      )}

      <aside
        aria-label={t.sidebarAria}
        className={`nb-surface nb-line fixed inset-y-0 start-0 z-[70] w-64 flex flex-col border-e-2 transition-[transform,visibility] duration-300 motion-reduce:transition-none
          ${sidebarOpen ? "translate-x-0 visible" : "-translate-x-full rtl:translate-x-full invisible"}
          lg:translate-x-0 lg:rtl:translate-x-0 lg:visible`}
      >
        <div className="nb-line flex items-center justify-between gap-2 px-4 h-16 flex-shrink-0 border-b-2">
          <Link
            to="/shop/dashboard"
            aria-label={t.logoAlt}
            onClick={closeSidebar}
            className="nb-link !border-transparent !bg-transparent !p-1 !shadow-none flex items-center gap-3 min-w-0"
          >
            <img
              src={logo}
              alt={t.logoAlt}
              width="40"
              height="40"
              decoding="async"
              fetchPriority="high"
              className="h-10 w-auto max-w-[64px] flex-shrink-0 object-contain"
            />
            <span key={language} className="lang-fade min-w-0 leading-tight normal-case">
              <span className="block text-xl font-extrabold tracking-tight truncate">
                {t.brand[0]}<span className="nb-ul">{t.brand[1]}</span>
              </span>
              <span className="nb-muted block text-[10px] font-semibold tracking-normal truncate">{t.brandSub}</span>
            </span>
          </Link>
          {sidebarOpen && (
            <button
              type="button"
              onClick={closeSidebar}
              aria-label={t.closeMenu}
              className="nb-btn lg:hidden h-9 w-9 flex-shrink-0"
            >
              <FiX size={ICON} aria-hidden="true" />
            </button>
          )}
        </div>

        <SidebarNav key={language} t={t} pathname={pathname} onClick={closeSidebar} />

        <div className="nb-line p-3 space-y-2.5 flex-shrink-0 border-t-2">
          <div role="group" aria-label={t.theme.label} className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={setLight}
              aria-pressed={!darkMode}
              className={`nb-btn py-1.5 text-xs uppercase ${!darkMode ? "nb-btn-on" : ""}`}
            >
              <FiSun size={14} aria-hidden="true" /> {t.theme.light}
            </button>
            <button
              type="button"
              onClick={setDark}
              aria-pressed={darkMode}
              className={`nb-btn py-1.5 text-xs uppercase ${darkMode ? "nb-btn-on" : ""}`}
            >
              <FiMoon size={14} aria-hidden="true" /> {t.theme.dark}
            </button>
          </div>
          <button type="button" onClick={handleLogout} className="nb-btn nb-btn-a w-full py-2 text-xs uppercase">
            <FiLogOut size={14} aria-hidden="true" className="rtl:rotate-180" /> {t.logout}
          </button>
          <p className="nb-muted pt-0.5 text-center text-[10px] font-semibold">© {YEAR} Tech &amp; Restore</p>
        </div>
      </aside>

      <header
        role="banner"
        className="nb-surface nb-line fixed top-0 start-0 end-0 lg:start-64 h-16 z-40 border-b-2 flex items-center justify-between gap-4 px-4 sm:px-6"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={openSidebar}
            aria-label={t.openMenu}
            aria-expanded={sidebarOpen}
            className="nb-btn lg:hidden w-10 h-10 flex-shrink-0"
          >
            <FiMenu size={20} aria-hidden="true" />
          </button>
          <h1
            key={`${language}-${pathname}`}
            className="lang-fade text-base sm:text-lg font-extrabold uppercase tracking-tight truncate"
          >
            <span className="nb-ul">{pageTitle}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-1 justify-end min-w-0">
          <div className="hidden sm:flex flex-1 justify-end min-w-0">
            <SearchBox t={t} onNavigate={goTo} />
          </div>

          <LanguageSwitch language={language} label={t.language} onChange={setAppLanguage} />

          <NotificationCenter t={t} locale={locale} darkMode={darkMode} token={token} />

          <Link
            to="/shop/profile"
            className="nb-field nb-field-link flex items-center gap-2.5 h-10 ps-1 pe-1 md:pe-3 flex-shrink-0"
          >
            <span className="nb-tile w-7 h-7 text-sm font-extrabold uppercase">
              {profileName ? profileName.charAt(0) : <FiUser size={16} aria-hidden="true" />}
            </span>
            <span key={language} className="lang-fade hidden md:block leading-tight text-start">
              <span className="block text-xs font-extrabold uppercase truncate max-w-[110px]">
                {profileName || t.owner}
              </span>
              <span className="nb-muted block text-[10px] font-bold">{t.businessProfile}</span>
            </span>
          </Link>
        </div>
      </header>

      <style dangerouslySetInnerHTML={STYLE_HTML} />
    </div>
  );
};

export default memo(ShopHeader);