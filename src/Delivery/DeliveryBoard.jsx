import React, {
  useState, useEffect, useCallback, useMemo, useRef, useDeferredValue, memo, createContext, useContext,
} from "react";
import { Link } from "react-router-dom";
import {
  FiSearch, FiX, FiCopy, FiMapPin, FiPhone, FiClock, FiShoppingBag, FiClipboard,
  FiChevronDown, FiChevronLeft, FiChevronRight, FiRefreshCw, FiAlertTriangle,
  FiCheck, FiTrendingUp, FiNavigation, FiGrid, FiMap,
} from "react-icons/fi";
import DeliveryMap from "./DeliveryMap";
import { UI3D_CSS, Defs3D } from "../components/user/Ui3D";
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from "../components/user/UiExtras";
import { CARD, PANEL, SCROLL_CSS, useDarkMode, IconTile } from "../components/shop/TableKit";
import { useAppLanguage } from "../common/utils/useAppLanguage";
import { getFontStyle, ensureShopAssets } from "../common/utils/shopFonts";

ensureShopAssets();

const DRAWER_CSS = `
@keyframes drawer-in{from{transform:translateX(100%)}to{transform:none}}
@keyframes drawer-in-rtl{from{transform:translateX(-100%)}to{transform:none}}
.drawer-in{animation:drawer-in .22s ease-out}
[dir="rtl"] .drawer-in{animation-name:drawer-in-rtl}
@media (prefers-reduced-motion:reduce){.drawer-in{animation:none}}
`;
const PAGE_CSS = UI3D_CSS + EXTRAS_CSS + SCROLL_CSS + DRAWER_CSS;

const INK = "#04261a";
const DEFAULTS = { rowsOptions: [6, 12, 24, 48], defaultRows: 6, defaultSort: "oldest" };
const SORTERS = {
  oldest: (a, b) => a.date - b.date,
  newest: (a, b) => b.date - a.date,
  value: (a, b) => b.amount - a.amount,
};

const SEARCH_MAX = 60;
const POLL_MS = 30000;
const GRID_CLS = "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3";
const REDUCED = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const BTN = "nb-btn px-3 text-xs uppercase";
const BTN_ON = `${BTN} nb-btn-a`;
const BTN_DANGER = `${BTN} nb-btn-danger`;

const EN = {
  locale: "en-US",
  currency: "EGP",
  customer: "Customer",
  unknown: "Unknown",
  open: "Open",
  waiting: "Waiting",
  now: "Just now",
  min: "{n}m",
  hrMin: "{h}h {m}m",
  dayHr: "{d}d {h}h",
  all: "All",
  sorts: { oldest: "Oldest first", newest: "Newest first", value: "Highest value" },
  sortAria: "Sort order",
  rowsLabel: "{n} rows",
  rowsAria: "{nouns} per page",
  refresh: "Refresh",
  refreshAria: "Refresh {nouns}",
  lastUpdated: "Last updated",
  searchLabel: "Search {nouns}",
  searchPlaceholder: "Search ID, customer, phone or address",
  clearSearch: "Clear search",
  viewAria: "View",
  cards: "Cards",
  map: "Map",
  cardView: "Card view",
  mapView: "Map view",
  mapHint: "Drag to pan · scroll or pinch to zoom · tap a pin to see its route by road.",
  total: "Total {nouns}",
  mineAll: "Everything assigned to you",
  queueOpen: "Open in the live queue",
  active: "Active",
  activeDesc: "Still on the road",
  finished: "Finished",
  finishedDesc: "Delivered or closed",
  late: "Waiting 6h+",
  lateDesc: "Need a driver soon",
  longest: "Longest wait",
  longestDesc: "Oldest open request",
  acrossAll: "Across all {nouns}",
  showing: "Showing {from}–{to} of {total} {nouns}",
  paginationAria: "Pagination",
  prev: "Previous page",
  next: "Next page",
  goPage: "Go to page {n}",
  noMatch: "No matching {nouns}",
  noMatchHint: "Try a different ID, customer, phone or address, or switch tab.",
  clearFilters: "Clear search & filter",
  loadFail: "Couldn't load {nouns}",
  loadFailHint: "Check your connection and try again.",
  tryAgain: "Try again",
  refreshQueue: "Refresh queue",
  loadingAria: "Loading {nouns}",
  loadToast: "Failed to load {nouns}",
  copied: "ID copied to clipboard",
  copyFail: "Could not copy. Allow clipboard access in your browser.",
  copyAria: "Copy {noun} ID {id}",
  copyIdAria: "Copy ID",
  viewMapAria: "View {noun} {id} on the map",
  detailsMap: "Details & map",
  details: "Details",
  detailsTitle: "{Noun} details",
  close: "Close",
  closeSummary: "Close summary",
  received: "Received on",
  noPhone: "No phone number",
  callAria: "Call {name}",
  noAddress: "Address not provided",
  openPickup: "Open pickup location in Google Maps",
  openDrop: "Open drop-off location in Google Maps",
  actionAria: "{label} {noun} {id}",
  cancel: "Cancel",
  stops: { pickup: "Pickup · Shop", dropoff: "Drop-off · Customer" },
};

const AR = {
  locale: "ar-EG",
  currency: "ج.م",
  customer: "عميل",
  unknown: "غير معروف",
  open: "مفتوح",
  waiting: "بانتظار",
  now: "الآن",
  min: "{n} د",
  hrMin: "{h} س {m} د",
  dayHr: "{d} ي {h} س",
  all: "الكل",
  sorts: { oldest: "الأقدم أولًا", newest: "الأحدث أولًا", value: "الأعلى قيمة" },
  sortAria: "ترتيب النتائج",
  rowsLabel: "{n} صف",
  rowsAria: "عدد {nouns} في الصفحة",
  refresh: "تحديث",
  refreshAria: "تحديث {nouns}",
  lastUpdated: "آخر تحديث",
  searchLabel: "بحث في {nouns}",
  searchPlaceholder: "ابحث بالرقم أو العميل أو الهاتف أو العنوان",
  clearSearch: "مسح البحث",
  viewAria: "طريقة العرض",
  cards: "بطاقات",
  map: "خريطة",
  cardView: "عرض البطاقات",
  mapView: "عرض الخريطة",
  mapHint: "اسحب للتحريك · كبّر بالتمرير أو القرص · اضغط على دبوس لرؤية مساره بالطريق.",
  total: "إجمالي {nouns}",
  mineAll: "كل ما أُسند إليك",
  queueOpen: "مفتوح في الطابور المباشر",
  active: "نشط",
  activeDesc: "ما زال في الطريق",
  finished: "منتهي",
  finishedDesc: "تم التوصيل أو الإغلاق",
  late: "انتظار +6 س",
  lateDesc: "يحتاج مندوبًا قريبًا",
  longest: "أطول انتظار",
  longestDesc: "أقدم طلب مفتوح",
  acrossAll: "عبر كل {nouns}",
  showing: "عرض {from}–{to} من {total} {nouns}",
  paginationAria: "التنقل بين الصفحات",
  prev: "الصفحة السابقة",
  next: "الصفحة التالية",
  goPage: "اذهب إلى الصفحة {n}",
  noMatch: "لا توجد {nouns} مطابقة",
  noMatchHint: "جرّب رقمًا أو عميلًا أو هاتفًا أو عنوانًا مختلفًا، أو بدّل التبويب.",
  clearFilters: "مسح البحث والتصفية",
  loadFail: "تعذر تحميل {nouns}",
  loadFailHint: "تحقق من اتصالك وحاول مرة أخرى.",
  tryAgain: "حاول مرة أخرى",
  refreshQueue: "تحديث الطابور",
  loadingAria: "جارٍ تحميل {nouns}",
  loadToast: "تعذر تحميل {nouns}",
  copied: "تم نسخ الرقم",
  copyFail: "تعذر النسخ. اسمح للمتصفح بالوصول إلى الحافظة.",
  copyAria: "نسخ رقم {noun} {id}",
  copyIdAria: "نسخ الرقم",
  viewMapAria: "عرض {noun} {id} على الخريطة",
  detailsMap: "التفاصيل والخريطة",
  details: "التفاصيل",
  detailsTitle: "تفاصيل {noun}",
  close: "إغلاق",
  closeSummary: "إغلاق الملخص",
  received: "تاريخ الاستلام",
  noPhone: "لا يوجد رقم هاتف",
  callAria: "اتصل بـ {name}",
  noAddress: "العنوان غير متوفر",
  openPickup: "فتح موقع الاستلام في خرائط جوجل",
  openDrop: "فتح موقع التسليم في خرائط جوجل",
  actionAria: "{label} {noun} {id}",
  cancel: "إلغاء",
  stops: { pickup: "الاستلام · المتجر", dropoff: "التسليم · العميل" },
};

const LocaleCtx = createContext(null);
const useL = () => useContext(LocaleCtx);

const FMT_CACHE = {};
const getFmt = (locale) =>
  (FMT_CACHE[locale] ||= {
    num: new Intl.NumberFormat(locale),
    price: new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    time: new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    full: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }),
    short: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
  });

const CTRL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const SEARCH_STRIP_RE = /[^\p{L}\p{M}\p{N} @._+\-#,'’/()]/gu;
const clean = (v) => String(v ?? "").replace(CTRL, "");
const txt = (v) => (typeof v === "string" || typeof v === "number" ? clean(v) : "");
const sanitizeSearch = (v) =>
  clean(v).normalize("NFC").replace(SEARCH_STRIP_RE, "").replace(/\s{2,}/g, " ").replace(/^\s+/, "").slice(0, SEARCH_MAX);
const tpl = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const asList = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : []);
const shortId = (id) => clean(id).slice(-8).toUpperCase();
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const human = (s, t) =>
  String(s || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) || t.unknown;
const validDate = (v) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d : null; };
const phoneHref = (p) => { const digits = String(p ?? "").replace(/[^\d+]/g, ""); return digits ? `tel:${digits}` : null; };
const addrParts = (a) => ({ street: txt(a?.street), sub: [txt(a?.state), txt(a?.city)].filter(Boolean).join(", ") });
const mapsUrl = (a) => {
  const q = [txt(a?.street), txt(a?.state), txt(a?.city)].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
};
const waitHours = (v) => { const d = validDate(v); return d ? Math.max(0, (Date.now() - d.getTime()) / 3600000) : 0; };
const waitLabel = (v, t) => {
  const d = validDate(v);
  if (!d) return "—";
  const m = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (m < 1) return t.now;
  if (m < 60) return tpl(t.min, { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return tpl(t.hrMin, { h, m: m % 60 });
  return tpl(t.dayHr, { d: Math.floor(h / 24), h: h % 24 });
};
const waitTone = (v) => {
  const h = waitHours(v);
  if (h >= 24) return "text-red-500";
  if (h >= 6) return "text-amber-600 dark:text-amber-400";
  return "";
};
const pageList = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [...new Set([1, total, cur - 1, cur, cur + 1])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  pages.forEach((p, i) => { if (i && p - pages[i - 1] > 1) out.push(`gap${p}`); out.push(p); });
  return out;
};

const statusKey = (s) => String(s ?? "").trim().toLowerCase();
const statusEntry = (cfg, status) => cfg.statusMap?.get(statusKey(status)) || null;
const actionsOf = (cfg, it) => statusEntry(cfg, it.status)?.actions ?? cfg.actions ?? null;
const canAct = (cfg, it) => {
  if (statusEntry(cfg, it.status)?.final) return false;
  const a = actionsOf(cfg, it);
  return !!(a && (a.primary || a.secondary));
};

const normalize = (raw, cfg) => ({
  ...raw,
  userName: `${txt(raw.firstName)} ${txt(raw.lastName)}`.trim() || txt(raw.userName),
  phone: txt(raw.phone) || txt(raw.userPhone),
  amount: Number(raw[cfg.priceField]) || 0,
  pickup: raw.shopAddress || null,
  drop: raw[cfg.dropField] || null,
});

const nameOf = (it, t) => it.userName || t.customer;

const stateOf = (it, cfg, t) =>
  cfg.statuses
    ? statusEntry(cfg, it.status) || { label: human(it.status, t), tone: "am" }
    : { label: t.open, tone: "em" };

const mergeAction = (base, over) => (base || over ? { ...base, ...over } : undefined);

const buildStatusMap = (statuses) =>
  statuses ? new Map(Object.entries(statuses).map(([k, v]) => [statusKey(k), v])) : null;

const buildCfg = (config, isAr) => {
  const base = { ...DEFAULTS, ...config };
  const ar = isAr ? config.ar : null;
  let cfg = base;
  if (ar) {
    const actions = base.actions
      ? {
          primary: mergeAction(base.actions.primary, ar.actions?.primary),
          secondary: base.actions.secondary ? mergeAction(base.actions.secondary, ar.actions?.secondary) : undefined,
        }
      : base.actions;
    cfg = {
      ...base,
      ...ar,
      actions,
      tabs: base.tabs && base.tabs.map((x) => ({ ...x, label: ar.tabLabels?.[x.key] ?? x.label })),
      statuses: base.statuses
        ? Object.fromEntries(
            Object.entries(base.statuses).map(([k, v]) => {
              const sa = ar.statusActions?.[k];
              return [k, {
                ...v,
                label: ar.statusLabels?.[k] ?? v.label,
                actions: v.actions
                  ? {
                      primary: mergeAction(v.actions.primary, sa?.primary),
                      secondary: v.actions.secondary ? mergeAction(v.actions.secondary, sa?.secondary) : undefined,
                    }
                  : v.actions,
              }];
            })
          )
        : base.statuses,
    };
  }
  return { ...cfg, statusMap: buildStatusMap(cfg.statuses) };
};

const confirmDialog = async ({ title, text, icon, confirmText, confirmColor, cancelText }, darkMode) => {
  try {
    const { default: Swal } = await import("sweetalert2");
    const { isConfirmed } = await Swal.fire({
      title,
      text,
      icon: icon || "question",
      showCancelButton: true,
      confirmButtonColor: confirmColor || "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      background: darkMode ? "#2a2a2a" : "#ffffff",
      color: darkMode ? "#ffffff" : INK,
    });
    return isConfirmed;
  } catch {
    return false;
  }
};

const Meter = memo(({ pct: value, color }) => (
  <span className="nb-gray nb-line block h-2.5 flex-1 overflow-hidden border-2" aria-hidden="true">
    <span
      className="block h-full"
      style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color || "var(--nb-accent)", transition: REDUCED ? "none" : "width .5s ease" }}
    />
  </span>
));

const TONES = {
  em: ["#34d399", INK],
  am: ["#fbbf24", INK],
  gr: ["#d1d5db", INK],
  rd: ["#dc2626", "#ffffff"],
  sky: ["#38bdf8", INK],
  vi: ["#a78bfa", INK],
  te: ["#2dd4bf", INK],
  ro: ["#fb7185", INK],
};
TONES.on = TONES.em;

const Pill = memo(({ tone, children }) => {
  const [bg, ink] = TONES[tone] || TONES.gr;
  return <span className="nb-chip !normal-case" style={{ background: bg, color: ink }}>{children}</span>;
});

const Band = memo(({ tone, label, right }) => {
  const [bg, ink] = TONES[tone] || TONES.gr;
  return (
    <div className="nb-line flex items-center justify-between gap-2 border-b-2 px-4 py-2.5" style={{ background: bg, color: ink }}>
      <span className="inline-flex min-w-0 items-center gap-2 text-xs font-extrabold uppercase">
        <span className="h-2.5 w-2.5 flex-shrink-0 border-2" style={{ background: ink, borderColor: ink }} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      {right && <span className="inline-flex flex-shrink-0 items-center gap-1.5 text-[11px] font-extrabold tabular-nums">{right}</span>}
    </div>
  );
});

const StatCard = memo(({ label, value, description, icon, tone, percent, color }) => (
  <div className={`${CARD} min-w-0 p-4`}>
    <div className="flex items-center gap-3">
      <IconTile icon={icon} tone={tone} className="h-11 w-11 flex-shrink-0" size={19} />
      <div className="min-w-0">
        <p className="nb-muted truncate text-[10px] font-bold uppercase">{label}</p>
        <p className="truncate text-xl font-extrabold leading-tight tabular-nums">{value}</p>
      </div>
    </div>
    {percent !== undefined && (
      <div className="mt-3 flex items-center gap-2">
        <Meter pct={percent} color={color} />
        <span className="w-9 text-end text-[10px] font-extrabold tabular-nums">{percent}%</span>
      </div>
    )}
    <p className={`nb-muted truncate text-[11px] font-semibold ${percent !== undefined ? "mt-2" : "mt-3"}`}>{description}</p>
  </div>
));

const Tabs = memo(({ tabs, value, counts, onChange }) => {
  const { f } = useL();
  return (
    <div role="tablist" className="nb-sep flex gap-2 overflow-x-auto p-3 [scrollbar-width:none]">
      {tabs.map(({ key, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={`${BTN} h-8 flex-shrink-0 ${active ? "nb-btn-on" : ""}`}
          >
            {label}
            <span className="tabular-nums opacity-70">{f.num.format(counts[key] || 0)}</span>
          </button>
        );
      })}
    </div>
  );
});

const PageBar = memo(({ page, totalPages, total, perPage, noun, onChange }) => {
  const { t, f } = useL();
  const from = total ? (page - 1) * perPage + 1 : 0;
  const to = Math.min(page * perPage, total);
  return (
    <div className={`${CARD} flex flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row`}>
      <p className="nb-muted text-xs font-bold tabular-nums">
        {tpl(t.showing, { from: f.num.format(from), to: f.num.format(to), total: f.num.format(total), nouns: noun })}
      </p>
      {totalPages > 1 && (
        <nav className="flex items-center gap-1.5" aria-label={t.paginationAria}>
          <button type="button" className="nb-btn h-8 w-8" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label={t.prev}>
            <FiChevronLeft size={15} className="rtl:rotate-180" aria-hidden="true" />
          </button>
          {pageList(page, totalPages).map((p) => (typeof p === "string"
            ? <span key={p} className="nb-muted w-6 text-center text-xs font-bold">…</span>
            : (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                aria-label={tpl(t.goPage, { n: p })}
                aria-current={p === page ? "page" : undefined}
                className={`nb-btn h-8 w-8 text-xs tabular-nums ${p === page ? "nb-btn-on" : ""}`}
              >
                {f.num.format(p)}
              </button>
            )))}
          <button type="button" className="nb-btn h-8 w-8" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label={t.next}>
            <FiChevronRight size={15} className="rtl:rotate-180" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
});

const EmptyState = memo(({ title, message, actionLabel, onAction, children }) => {
  const { darkMode } = useL();
  return (
    <div className={`${CARD} flex flex-col items-center px-6 py-10 text-center sm:py-14`}>
      <EmptyState3D kind="box" title={title} darkMode={darkMode} />
      <p className="nb-muted mt-2 max-w-sm text-xs font-semibold">{message}</p>
      {actionLabel && <button type="button" onClick={onAction} className={`${BTN_ON} mt-5 h-11 px-6 text-sm`}>{actionLabel}</button>}
      {children}
    </div>
  );
});

const Dropdown = memo(({ value, options, onChange, ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const current = options.find((o) => o.value === value) || options[0];

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

  const pick = useCallback((v) => { onChange(v); setOpen(false); }, [onChange]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={`${BTN} h-10 min-w-[120px] justify-between`}
      >
        <span>{current?.label}</span>
        <FiChevronDown size={14} className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="listbox" aria-label={ariaLabel} className="nb-menu slim-scroll absolute end-0 z-20 mt-2 max-h-64 w-max min-w-full overflow-auto">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pick(o.value)}
                className={`nb-opt justify-between ${active ? "nb-btn-on" : ""}`}
              >
                {o.label}{active && <FiCheck size={13} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

const Stop = memo(({ kind, label, address }) => {
  const { t } = useL();
  const { street, sub } = addrParts(address);
  const url = mapsUrl(address);
  const Icon = kind === "pickup" ? FiShoppingBag : FiMapPin;
  return (
    <div className="relative flex items-start gap-3">
      <span className={`nb-tile h-8 w-8 ${kind === "pickup" ? "" : "nb-tile-warn"}`}><Icon size={14} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <p className="nb-muted text-[11px] font-extrabold uppercase">{label}</p>
        <p className="break-words text-sm font-extrabold">{street || t.noAddress}</p>
        {sub && <p className="nb-muted break-words text-xs font-bold">{sub}</p>}
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={kind === "pickup" ? t.openPickup : t.openDrop}
          className="nb-btn -mt-1 h-9 w-9 flex-shrink-0"
        >
          <FiNavigation size={15} aria-hidden="true" />
        </a>
      )}
    </div>
  );
});

const Route = memo(({ item, labels }) => (
  <div className={`${PANEL} relative space-y-4 p-3`}>
    <span aria-hidden="true" className="nb-line absolute bottom-10 start-7 top-10 border-s-2 border-dashed ltr:-translate-x-1/2 rtl:translate-x-1/2" />
    <Stop kind="pickup" label={labels.pickup} address={item.pickup} />
    <Stop kind="dropoff" label={labels.dropoff} address={item.drop} />
  </div>
));

const CustomerBox = memo(({ item }) => {
  const { t } = useL();
  const name = nameOf(item, t);
  const tel = phoneHref(item.phone);
  return (
    <div className={`${PANEL} flex items-center gap-3 p-3`}>
      <span className="nb-tile h-10 w-10 text-sm font-extrabold uppercase">{name.charAt(0)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold">{name}</p>
        <p dir="ltr" className="nb-muted truncate text-xs font-bold rtl:text-end">{item.phone || t.noPhone}</p>
      </div>
      {tel && (
        <a href={tel} aria-label={tpl(t.callAria, { name })} className="nb-btn nb-btn-a h-10 w-10 flex-shrink-0">
          <FiPhone size={16} aria-hidden="true" />
        </a>
      )}
    </div>
  );
});

const Actions = memo(({ cfg, it, onAct, busy, cls }) => {
  const { t } = useL();
  const acts = actionsOf(cfg, it);
  if (!acts) return null;
  const { primary, secondary } = acts;
  const aria = (a) => tpl(t.actionAria, { label: a.label, noun: cfg.noun, id: shortId(it.id) });
  return (
    <>
      {secondary && (
        <button type="button" disabled={busy} onClick={() => onAct(it.id, secondary)} aria-label={aria(secondary)} className={`flex-1 ${cls} ${BTN_DANGER}`}>
          {secondary.label}
        </button>
      )}
      {primary && (
        <button type="button" disabled={busy} onClick={() => onAct(it.id, primary)} aria-label={aria(primary)} className={`flex-1 ${cls} ${BTN_ON}`}>
          <FiCheck size={15} aria-hidden="true" /> {primary.label}
        </button>
      )}
    </>
  );
});

const QueueCard = memo(({ it, cfg, final, done, onOpen, onCopy, onAct }) => {
  const { t, f } = useL();
  const st = stateOf(it, cfg, t);
  const ageLabel = cfg.ageLabel ?? t.waiting;
  const labels = cfg.stopLabels || t.stops;
  const created = validDate(it.createdAt);
  const showActions = canAct(cfg, it);
  return (
    <li className="min-w-0">
      <article className={`${CARD} flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none`}>
        <Band
          tone={done ? "em" : st.tone}
          label={st.label}
          right={final ? null : (<><FiClock size={12} aria-hidden="true" /> {ageLabel} {waitLabel(it.createdAt, t)}</>)}
        />

        <div className="flex flex-1 flex-col gap-4 p-4">
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onCopy(it.id)}
                aria-label={tpl(t.copyAria, { noun: cfg.noun, id: shortId(it.id) })}
                className="nb-btn h-8 px-3 text-xs"
              >
                #{shortId(it.id)} <FiCopy size={12} aria-hidden="true" />
              </button>
              <p className="nb-muted mt-2 text-xs font-bold">{created ? f.short.format(created) : "—"}</p>
            </div>
            <div className="nb-gray nb-line whitespace-nowrap border-2 px-3 py-1.5 text-end">
              <p className="text-lg font-extrabold leading-tight tabular-nums">{f.price.format(it.amount)}</p>
              <p className="nb-muted text-[10px] font-extrabold uppercase">{t.currency}</p>
            </div>
          </header>

          <CustomerBox item={it} />
          <Route item={it} labels={labels} />

          <div className="mt-auto flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => onOpen(it.id)}
              aria-label={tpl(t.viewMapAria, { noun: cfg.noun, id: shortId(it.id) })}
              className={showActions ? `${BTN} h-11 w-11 flex-shrink-0` : `${BTN} h-11 flex-1 text-sm`}
            >
              <FiMap size={16} aria-hidden="true" />{!showActions && ` ${t.detailsMap}`}
            </button>
            {showActions && <Actions cfg={cfg} it={it} onAct={onAct} cls="h-11 text-sm" />}
          </div>
        </div>
      </article>
    </li>
  );
});

const CardSkeleton = memo(() => (
  <li aria-hidden="true" className={`${CARD} animate-pulse space-y-4 p-4 motion-reduce:animate-none`}>
    <div className="flex justify-between">
      <div className="space-y-2"><div className="nb-gray h-8 w-28" /><div className="nb-gray h-3 w-20" /></div>
      <div className="nb-gray h-6 w-24" />
    </div>
    <div className="nb-gray h-16" />
    <div className="space-y-3"><div className="nb-gray h-10" /><div className="nb-gray h-10" /></div>
    <div className="flex gap-3"><div className="nb-gray h-11 w-11" /><div className="nb-gray h-11 flex-1" /></div>
  </li>
));

const InfoRow = memo(({ icon: Icon, label, value }) => (
  <div className={`${PANEL} flex items-center gap-3 p-3`}>
    <span className="nb-tile h-9 w-9"><Icon size={16} aria-hidden="true" /></span>
    <div className="min-w-0">
      <p className="nb-muted text-[10px] font-extrabold uppercase">{label}</p>
      <p className="break-words text-sm font-extrabold">{value || "—"}</p>
    </div>
  </div>
));

const MapSheet = memo(({ cfg, it, final, busy, onClose, onOpen, onAct }) => {
  const { t, f } = useL();
  const st = stateOf(it, cfg, t);
  const ageLabel = cfg.ageLabel ?? t.waiting;
  const showActions = canAct(cfg, it);
  return (
    <div className={`${CARD} absolute bottom-3 end-3 start-3 space-y-3 p-3 sm:end-auto sm:w-96`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold">{nameOf(it, t)}</p>
          <p className="nb-muted text-xs font-bold tabular-nums">#{shortId(it.id)}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <p className="whitespace-nowrap text-sm font-extrabold tabular-nums">{f.price.format(it.amount)} {t.currency}</p>
          <button type="button" onClick={onClose} aria-label={t.closeSummary} className="nb-btn h-8 w-8"><FiX size={14} aria-hidden="true" /></button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={st.tone}>{st.label}</Pill>
        {!final && <span className={`text-xs font-extrabold ${waitTone(it.createdAt)}`}>{ageLabel} {waitLabel(it.createdAt, t)}</span>}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => onOpen(it.id)} className={`${BTN} h-10 flex-1`}>{t.details}</button>
        {showActions && <Actions cfg={cfg} it={it} onAct={onAct} busy={busy} cls="h-10" />}
      </div>
    </div>
  );
});

const Drawer = ({ cfg, it, final, busy, onClose, onAct, onCopy }) => {
  const { t, f } = useL();
  const closeRef = useRef(null);
  const st = stateOf(it, cfg, t);
  const ageLabel = cfg.ageLabel ?? t.waiting;
  const labels = cfg.stopLabels || t.stops;
  const mapItems = useMemo(() => [{ id: it.id, pickup: it.pickup, drop: it.drop }], [it.id, it.pickup, it.drop]);
  const title = tpl(t.detailsTitle, { noun: cfg.noun, Noun: cap(cfg.noun) });
  const created = validDate(it.createdAt);
  const showActions = canAct(cfg, it);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const act = useCallback(async (id, a) => {
    const ok = await onAct(id, a);
    if (ok && (!a.status || statusEntry(cfg, a.status)?.final)) onClose();
  }, [onAct, onClose, cfg]);

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/60" onClick={busy ? undefined : onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="drawer-in nb-surface nb-line absolute bottom-0 end-0 top-0 flex w-full max-w-md flex-col border-s-2"
      >
        <div className="nb-gray nb-line flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b-2 px-5">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold uppercase"><span className="nb-ul">{title}</span></h2>
            <p className="nb-muted mt-1 flex items-center gap-1.5 font-mono text-[10px] font-bold">
              #{shortId(it.id)}
              <button type="button" aria-label={t.copyIdAria} onClick={() => onCopy(it.id)} className="nb-ic"><FiCopy size={10} aria-hidden="true" /></button>
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} disabled={busy} aria-label={t.close} className="nb-btn h-9 w-9">
            <FiX size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="slim-scroll flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="nb-muted text-[10px] font-extrabold uppercase">{cfg.priceLabel}</p>
              <p className="text-2xl font-extrabold tabular-nums">{f.price.format(it.amount)} {t.currency}</p>
            </div>
            <div className="space-y-1.5 text-end">
              <Pill tone={st.tone}>{st.label}</Pill>
              {!final && <p className={`text-xs font-extrabold ${waitTone(it.createdAt)}`}>{ageLabel} {waitLabel(it.createdAt, t)}</p>}
            </div>
          </div>
          <DeliveryMap items={mapItems} selectedId={it.id} aspect={0.66} />
          <CustomerBox item={it} />
          <Route item={it} labels={labels} />
          <InfoRow icon={FiClock} label={t.received} value={created ? f.full.format(created) : "—"} />
        </div>

        <div className="nb-gray nb-line flex flex-shrink-0 gap-3 border-t-2 px-5 py-4">
          <button type="button" onClick={onClose} disabled={busy} className={`${BTN} h-11 flex-1 text-sm`}>{t.close}</button>
          {showActions && <Actions cfg={cfg} it={it} onAct={act} busy={busy} cls="h-11 text-sm" />}
        </div>
      </aside>
    </div>
  );
};

const DeliveryBoard = ({ config, darkMode: darkModeProp }) => {
  const hookDark = useDarkMode();
  const darkMode = darkModeProp ?? hookDark;
  const language = useAppLanguage();
  const isAr = language === "ar";
  const t = isAr ? AR : EN;
  const dir = isAr ? "rtl" : "ltr";
  const font = useMemo(() => getFontStyle(language), [language]);
  const f = getFmt(t.locale);
  const ctx = useMemo(() => ({ t, f, darkMode }), [t, f, darkMode]);

  const cfg = useMemo(() => buildCfg(config, isAr), [config, isAr]);
  const tabs = useMemo(() => cfg.tabs || [{ key: "all", label: t.all }], [cfg.tabs, t.all]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [sortKey, setSortKey] = useState(cfg.defaultSort);
  const [view, setView] = useState("cards");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(cfg.defaultRows);
  const [drawerId, setDrawerId] = useState(null);
  const [mapSel, setMapSel] = useState(null);
  const [busy, setBusy] = useState(false);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const hasDataRef = useRef(false);
  const actingRef = useRef(new Set());
  const sigRef = useRef(null);
  const cfgRef = useRef(cfg);
  const tRef = useRef(t);
  const darkRef = useRef(darkMode);
  cfgRef.current = cfg;
  tRef.current = t;
  darkRef.current = darkMode;
  const term = sanitizeSearch(useDeferredValue(search)).trim().toLowerCase();

  const isFinal = useCallback((it) => !!statusEntry(cfg, it.status)?.final, [cfg]);
  const isDone = useCallback((it) => !!statusEntry(cfg, it.status)?.done, [cfg]);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    document.title = cfg.docTitle;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = cfg.metaDesc || "";
  }, [cfg.docTitle, cfg.metaDesc]);

  const load = useCallback(async (silent = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (!silent) setLoading(true);
    try {
      const raw = asList(await config.load());
      if (!mountedRef.current) return;
      const acting = actingRef.current.size > 0;
      const sig = JSON.stringify(raw);
      if (acting || sig !== sigRef.current) {
        sigRef.current = acting ? null : sig;
        const list = raw.map((r) => normalize(r, config));
        setItems((prev) => {
          if (!actingRef.current.size) return list;
          if (!config.statuses) return list.filter((i) => !actingRef.current.has(i.id));
          const byId = new Map(prev.map((i) => [i.id, i]));
          return list.map((i) => (actingRef.current.has(i.id) ? byId.get(i.id) || i : i));
        });
      }
      hasDataRef.current = true;
      setError(false);
      setLastUpdated(new Date());
    } catch {
      if (!mountedRef.current) return;
      if (!hasDataRef.current) setError(true);
      if (!silent) toast({ icon: "error", title: tpl(tRef.current.loadToast, { nouns: cfgRef.current.nounPlural }) });
    } finally {
      inFlightRef.current = false;
      if (!silent && mountedRef.current) setLoading(false);
    }
  }, [config]);

  useEffect(() => { load(false); }, [load]);

  useEffect(() => {
    const tick = () => { if (!document.hidden) load(true); };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [load]);

  const refresh = useCallback(() => load(false), [load]);

  const runAction = useCallback(async (id, act) => {
    if (actingRef.current.has(id)) return false;
    actingRef.current.add(id);
    const ok = await confirmDialog({ ...act, cancelText: tRef.current.cancel }, darkRef.current);
    if (!ok) { actingRef.current.delete(id); return false; }
    sigRef.current = null;
    setBusy(true);
    setItems((prev) => (act.status ? prev.map((i) => (i.id === id ? { ...i, status: act.status } : i)) : prev.filter((i) => i.id !== id)));
    let failed = false;
    try {
      await (act.status ? act.call(id, { status: act.status }) : act.call(id));
      toast({ icon: act.okIcon || "success", title: act.okMsg });
    } catch {
      failed = true;
      toast({ icon: "error", title: act.failMsg });
    } finally {
      actingRef.current.delete(id);
      if (mountedRef.current) setBusy(false);
    }
    load(true);
    return !failed;
  }, [load]);

  const handleCopy = useCallback(async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ icon: "success", title: tRef.current.copied });
    } catch {
      toast({ icon: "error", title: tRef.current.copyFail });
    }
  }, []);

  const index = useMemo(() => items.map((it) => ({
    it,
    date: Date.parse(it.createdAt) || 0,
    amount: it.amount,
    text: [it.id, nameOf(it, t), it.phone, stateOf(it, cfg, t).label, it.pickup?.street, it.pickup?.city, it.drop?.street, it.drop?.city, it.drop?.state]
      .map((v) => String(v ?? "").toLowerCase()).join(" "),
  })), [items, cfg, t]);

  const counts = useMemo(
    () => Object.fromEntries(tabs.map((x) => [x.key, x.test ? items.filter(x.test).length : items.length])),
    [items, tabs]
  );

  const stats = useMemo(() => {
    let value = 0; let fin = 0; let late = 0; let oldest = 0;
    for (const i of items) {
      value += i.amount;
      if (isFinal(i)) fin += 1;
      else {
        if (waitHours(i.createdAt) >= 6) late += 1;
        const d = Date.parse(i.createdAt);
        if (d && (!oldest || d < oldest)) oldest = d;
      }
    }
    return { all: items.length, fin, active: items.length - fin, late, value, oldest };
  }, [items, isFinal]);

  const statCards = useMemo(() => {
    const nouns = cfg.nounPlural;
    const first = {
      label: tpl(t.total, { nouns }),
      value: f.num.format(stats.all),
      description: cfg.mode === "mine" ? t.mineAll : t.queueOpen,
      icon: cfg.icon,
      tone: "em",
      percent: stats.all ? 100 : 0,
      color: "#34d399",
    };
    const last = {
      label: cfg.valueStatLabel,
      value: `${f.price.format(stats.value)} ${t.currency}`,
      description: tpl(t.acrossAll, { nouns }),
      icon: FiClipboard,
      tone: "sky",
    };
    if (cfg.mode === "mine") {
      return [
        first,
        { label: t.active, value: f.num.format(stats.active), description: t.activeDesc, icon: FiTrendingUp, tone: "te", percent: pct(stats.active, stats.all), color: "#2dd4bf" },
        { label: t.finished, value: f.num.format(stats.fin), description: t.finishedDesc, icon: FiCheck, tone: "vi", percent: pct(stats.fin, stats.all), color: "#a78bfa" },
        last,
      ];
    }
    return [
      first,
      { label: t.late, value: f.num.format(stats.late), description: t.lateDesc, icon: FiClock, tone: "am", percent: pct(stats.late, stats.all), color: "#fbbf24" },
      { label: t.longest, value: stats.oldest ? waitLabel(stats.oldest, t) : "—", description: t.longestDesc, icon: FiTrendingUp, tone: "te" },
      last,
    ];
  }, [stats, cfg, t, f]);

  const filtered = useMemo(() => {
    const active = tabs.find((x) => x.key === tab);
    const list = index.filter((e) => (!active?.test || active.test(e.it)) && (!term || e.text.includes(term)));
    list.sort(SORTERS[sortKey] || SORTERS.oldest);
    return list.map((e) => e.it);
  }, [index, tabs, tab, term, sortKey]);

  useEffect(() => { setCurrentPage(1); }, [tab, term, rowsPerPage, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const mapItems = useMemo(() => paginated.map((i) => ({ id: i.id, pickup: i.pickup, drop: i.drop })), [paginated]);
  const selItem = useMemo(() => paginated.find((i) => i.id === mapSel) || null, [paginated, mapSel]);
  const drawerItem = useMemo(() => (drawerId ? items.find((i) => i.id === drawerId) || null : null), [items, drawerId]);

  useEffect(() => { if (drawerId && !drawerItem) setDrawerId(null); }, [drawerId, drawerItem]);

  const sortOptions = useMemo(() => Object.entries(t.sorts).map(([value, label]) => ({ value, label })), [t]);
  const rowsItems = useMemo(
    () => cfg.rowsOptions.map((n) => ({ value: n, label: tpl(t.rowsLabel, { n: f.num.format(n) }) })),
    [cfg.rowsOptions, t, f]
  );

  const openItem = useCallback((id) => setDrawerId(id), []);
  const closeDrawer = useCallback(() => setDrawerId(null), []);
  const closeSheet = useCallback(() => setMapSel(null), []);
  const clearSearch = useCallback(() => setSearch(""), []);
  const clearFilters = useCallback(() => { setSearch(""); setTab("all"); }, []);
  const handleRowsPick = useCallback((v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }, []);
  const handleSearchChange = useCallback((e) => setSearch(sanitizeSearch(e.target.value)), []);
  const handleSearchKey = useCallback((e) => { if (e.key === "Escape") setSearch(""); else if (e.key === "Enter") e.preventDefault(); }, []);
  const goToPage = useCallback((p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });
  }, []);

  const nouns = cfg.nounPlural;
  const firstLoad = loading && items.length === 0 && !error;
  let body;
  if (firstLoad) {
    body = (
      <ul className={GRID_CLS} aria-busy="true" aria-label={tpl(t.loadingAria, { nouns })}>
        {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
      </ul>
    );
  } else if (error && items.length === 0) {
    body = (
      <div role="alert" className={`${CARD} flex flex-col items-center px-6 py-12 text-center`}>
        <span className="nb-tile nb-tile-danger h-14 w-14"><FiAlertTriangle size={26} aria-hidden="true" /></span>
        <h2 className="mt-4 text-lg font-extrabold uppercase"><span className="nb-ul">{tpl(t.loadFail, { nouns })}</span></h2>
        <p className="nb-muted mt-2 text-xs font-semibold">{t.loadFailHint}</p>
        <button type="button" onClick={refresh} className={`${BTN_ON} mt-5 h-11 px-6 text-sm`}>{t.tryAgain}</button>
      </div>
    );
  } else if (items.length === 0) {
    body = (
      <EmptyState title={cfg.emptyTitle} message={cfg.emptyMessage} actionLabel={cfg.browse ? undefined : t.refreshQueue} onAction={refresh}>
        {cfg.browse && <Link to={cfg.browse.to} className={`${BTN_ON} mt-5 h-11 px-6 text-sm`}>{cfg.browse.label}</Link>}
      </EmptyState>
    );
  } else if (filtered.length === 0) {
    body = <EmptyState title={tpl(t.noMatch, { nouns })} message={t.noMatchHint} actionLabel={t.clearFilters} onAction={clearFilters} />;
  } else if (view === "map") {
    body = (
      <>
        <div className="relative">
          <DeliveryMap items={mapItems} selectedId={selItem?.id ?? null} onSelect={setMapSel} aspect={0.8} />
          {selItem && (
            <MapSheet cfg={cfg} it={selItem} final={isFinal(selItem)} busy={busy} onClose={closeSheet} onOpen={openItem} onAct={runAction} />
          )}
        </div>
        <p className="nb-muted px-1 text-xs font-semibold">{t.mapHint}</p>
        <PageBar page={page} totalPages={totalPages} total={filtered.length} perPage={rowsPerPage} noun={nouns} onChange={goToPage} />
      </>
    );
  } else {
    body = (
      <>
        <ul className={GRID_CLS}>
          {paginated.map((i) => (
            <QueueCard key={i.id} it={i} cfg={cfg} final={isFinal(i)} done={isDone(i)} onOpen={openItem} onCopy={handleCopy} onAct={runAction} />
          ))}
        </ul>
        <PageBar page={page} totalPages={totalPages} total={filtered.length} perPage={rowsPerPage} noun={nouns} onChange={goToPage} />
      </>
    );
  }

  return (
    <LocaleCtx.Provider value={ctx}>
      <div dir={dir} lang={language} style={font} className="nb-page mt-16 min-h-screen py-6 text-start lg:ps-64">
        <style>{PAGE_CSS}</style>
        <Defs3D />
        <Toaster darkMode={darkMode} />

        <div key={language} className="lang-fade mx-auto max-w-7xl space-y-5 px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-[1.15] tracking-tight rtl:tracking-normal sm:text-3xl">
                {cfg.title} <span className="nb-ul">{cfg.titleAccent}</span>
              </h1>
              <p className="nb-muted mt-2 text-xs font-semibold">{cfg.subtitle}</p>
            </div>
            <div className="flex items-center gap-2.5">
              {lastUpdated && (
                <div className="nb-chip hidden !normal-case sm:inline-flex" role="status" aria-live="polite">
                  {t.lastUpdated}: <span className="tabular-nums">{f.time.format(lastUpdated)}</span>
                </div>
              )}
              <button type="button" onClick={refresh} aria-label={tpl(t.refreshAria, { nouns })} title={t.refresh} className={`${BTN} h-10`}>
                <FiRefreshCw size={14} className={loading ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" /> {t.refresh}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          <section className={CARD}>
            <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
              <div role="search" className="nb-field flex h-10 min-w-[220px] flex-1 items-center gap-2 px-3">
                <FiSearch size={16} aria-hidden="true" className="flex-shrink-0" />
                <label htmlFor="board-search" className="sr-only">{tpl(t.searchLabel, { nouns })}</label>
                <input
                  id="board-search"
                  name="board-search"
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={SEARCH_MAX}
                  value={search}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKey}
                  placeholder={t.searchPlaceholder}
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60 [&::-webkit-search-cancel-button]:appearance-none"
                />
                {search && (
                  <button type="button" onClick={clearSearch} aria-label={t.clearSearch} className="nb-btn h-6 w-6 flex-shrink-0">
                    <FiX size={12} aria-hidden="true" />
                  </button>
                )}
              </div>
              <Dropdown value={sortKey} options={sortOptions} onChange={setSortKey} ariaLabel={t.sortAria} />
              <Dropdown value={rowsPerPage} options={rowsItems} onChange={handleRowsPick} ariaLabel={tpl(t.rowsAria, { nouns: cap(nouns) })} />
              <div role="group" aria-label={t.viewAria} className="nb-field flex h-10 items-center gap-1 p-1">
                <button type="button" onClick={() => setView("cards")} aria-pressed={view === "cards"} aria-label={t.cardView} className={`${BTN} h-7 ${view === "cards" ? "nb-btn-on" : ""}`}>
                  <FiGrid size={14} aria-hidden="true" /> {t.cards}
                </button>
                <button type="button" onClick={() => setView("map")} aria-pressed={view === "map"} aria-label={t.mapView} className={`${BTN} h-7 ${view === "map" ? "nb-btn-on" : ""}`}>
                  <FiMap size={14} aria-hidden="true" /> {t.map}
                </button>
              </div>
            </div>
            {cfg.tabs && <Tabs tabs={tabs} value={tab} counts={counts} onChange={setTab} />}
          </section>

          {body}
        </div>

        {drawerItem && (
          <Drawer cfg={cfg} it={drawerItem} final={isFinal(drawerItem)} busy={busy} onClose={closeDrawer} onAct={runAction} onCopy={handleCopy} />
        )}
      </div>
    </LocaleCtx.Provider>
  );
};

export default memo(DeliveryBoard);