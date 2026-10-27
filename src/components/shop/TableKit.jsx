import React, {
  useState, useEffect, useRef, useMemo, useCallback, useSyncExternalStore, memo,
} from 'react';
import {
  FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiX,
} from 'react-icons/fi';
import { useAppLanguage } from '../../common/utils/useAppLanguage';
import { getFontStyle } from '../../common/utils/shopFonts';
import shopAr from '../../common/ShopLocales/shopAr';
import shopEn from '../../common/ShopLocales/shopEn';

/* ───────── constants ───────── */

export const ROWS_OPTIONS = [5, 10, 25, 50];
export const POLL_MS = 60_000;
export const SEARCH_MAX = 60;
export const SPAN_MS = { today: 864e5, week: 6048e5, month: 2592e6 };

export const REDUCED = typeof window !== 'undefined'
  && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* Fallbacks so a missing locale key never renders the word "undefined". */
export const DEFAULT_LABELS = {
  paginationAria: 'Pagination',
  prev: 'Previous',
  next: 'Next',
  close: 'Close',
  reset: 'Reset',
  apply: 'Apply',
  rows: '{n}',
  showing: '{range} / {total} {unit}',
  price: '{n}',
};

/* ───────── shared class names (same tokens as ShopDashboard) ───────── */

export const BTN = 'nb-btn';
export const BTN_MD = `${BTN} px-3 py-2 text-xs`;
export const BTN_ICON = `${BTN} w-8 h-8`;
export const BTN_PRIMARY = `${BTN} nb-btn-a px-3 py-2 text-xs`;
export const BTN_DANGER = `${BTN} nb-btn-danger px-3 py-2 text-xs`;
export const CARD = 'nb-card';
export const PANEL = 'nb-gray nb-line border-2 border-dotted';
export const FIELD = 'nb-input w-full h-10 px-3 text-sm font-semibold';
export const LABEL = 'nb-muted block text-[10px] font-bold uppercase rtl:tracking-normal mb-1.5';
export const TH = 'px-3 py-2.5 text-start text-[10px] font-extrabold uppercase rtl:tracking-normal';
export const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400';
export const ROW_CLS = 'nb-line border-b-2 last:border-b-0';

export const TONE_BG = {
  em: '#34d399',
  te: '#2dd4bf',
  sky: '#38bdf8',
  vi: '#a78bfa',
  am: '#fbbf24',
  ro: '#fb7185',
  teal: '#2dd4bf',
  lime: '#a3e635',
  cyan: '#22d3ee',
  red: '#fb7185',
  amber: '#fbbf24',
};

const INK = '#04261a';

/* hex = chart / meter colour, ink = readable text colour on that hex */
export const STATUS_STYLE = {
  PENDING:     { hex: '#f59e0b', ink: INK },
  SUBMITTED:   { hex: '#f59e0b', ink: INK },
  PROCESSING:  { hex: '#3b82f6', ink: '#ffffff' },
  IN_PROGRESS: { hex: '#3b82f6', ink: '#ffffff' },
  SHIPPED:     { hex: '#6366f1', ink: '#ffffff' },
  DELIVERED:   { hex: '#10b981', ink: INK },
  COMPLETED:   { hex: '#34d399', ink: INK },
  REJECTED:    { hex: '#ef4444', ink: '#ffffff' },
  CANCELLED:   { hex: '#ef4444', ink: '#ffffff' },
};
const FALLBACK_STATUS = { hex: '#9ca3af', ink: INK };
export const normStatus = (s) => (s ? String(s).toUpperCase() : '');
export const getStatusStyle = (s) => STATUS_STYLE[normStatus(s)] || FALLBACK_STATUS;

/* ───────── CSS ───────── */

export const NB_CSS = `
:root{--nb-bg:#f9fafb;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e8ebe9;--nb-dot:#04261a;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff}
:root.dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-dot:#3f3f3f;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-page{background:var(--nb-bg);color:var(--nb-ink)}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);transition:transform .15s ease,box-shadow .15s ease}
.nb-lift:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:40px;height:12px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5;white-space:nowrap}
[dir=rtl] .nb-chip{letter-spacing:0}
.nb-chip-n{background:var(--nb-gray);color:var(--nb-muted);border-style:dashed}
.nb-ico{display:inline-flex;align-items:center;justify-content:center;flex:none;border:2px solid var(--nb-line);color:#04261a}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn-danger{background:#ef4444;color:#fff}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow)}
.nb-input{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);outline:none}
.nb-input:focus{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-input::placeholder{opacity:.6}
.nb-page select option{background:var(--nb-card);color:var(--nb-ink)}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-opt{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:start;cursor:pointer}
.nb-opt:hover{background:var(--nb-gray)}
.nb-opt[aria-selected=true]{background:var(--nb-btn);color:var(--nb-on)}
.nb-rows>tr+tr{border-top:2px dotted var(--nb-dot)}
.nb-rows>tr:hover{background:var(--nb-gray)}
.nb-track{height:12px;background:var(--nb-gray);border:2px solid var(--nb-line);overflow:hidden}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn{transition:none}.nb-lift:hover,.nb-btn:hover:not(:disabled),.nb-btn:active:not(:disabled){transform:none}}
`;

const SCROLL_BASE = `
  .slim-scroll { scrollbar-width: thin; scrollbar-color: rgba(52,211,153,.6) transparent; }
  .slim-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .slim-scroll::-webkit-scrollbar-track { background: transparent; }
  .slim-scroll::-webkit-scrollbar-thumb { background: rgba(52,211,153,.55); }
  .slim-scroll::-webkit-scrollbar-thumb:hover { background: #34d399; }
`;

export const SCROLL_CSS = SCROLL_BASE + NB_CSS;

/* ───────── formatters (cached per locale) ───────── */

const FORMATS = {};
export const getFormats = (locale) => (FORMATS[locale] ||= {
  date: new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }),
  time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }),
  full: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }),
  number: new Intl.NumberFormat(locale),
});

const COLLATORS = {};
export const getCollator = (locale) => (COLLATORS[locale] ||= new Intl.Collator(locale));

/* ───────── locale hook ───────── */

export const useShopLocale = () => {
  const language = useAppLanguage();
  return useMemo(() => {
    const isAr = language === 'ar';
    const L = isAr ? shopAr : shopEn;
    return {
      language,
      isAr,
      L,
      fm: getFormats(L.locale),
      dir: isAr ? 'rtl' : 'ltr',
      font: getFontStyle(language),
    };
  }, [language]);
};

/* ───────── pure helpers ───────── */

const TPL_RE = /\{(\w+)\}/g;
const TPL_SPLIT_RE = /(\{\w+\})/g;
const TPL_PART_RE = /^\{(\w+)\}$/;
const SEARCH_STRIP_RE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069<>]/g;
const MULTI_SPACE_RE = /\s{2,}/g;
const SAFE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const CSV_DANGER_RE = /^[=+\-@\t\r]/;

/* Null-safe: a missing template or variable renders '' instead of "undefined". */
export const tpl = (str, vars = {}) => (str == null
  ? ''
  : String(str).replace(TPL_RE, (_, k) => vars[k] ?? ''));

export const renderTpl = (str, vars = {}) => (str == null
  ? []
  : String(str).split(TPL_SPLIT_RE).map((part, i) => {
    const m = part.match(TPL_PART_RE);
    return m && m[1] in vars
      ? <React.Fragment key={i}>{vars[m[1]] ?? ''}</React.Fragment>
      : <React.Fragment key={i}>{part}</React.Fragment>;
  }));

export const toTs = (v) => { const t = new Date(v).getTime(); return Number.isNaN(t) ? 0 : t; };
export const fmt = (f, v) => { const t = toTs(v); return t ? f.format(t) : '—'; };
export const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
export const formatPrice = (p, template, nf) => tpl(template || DEFAULT_LABELS.price, { n: nf.format(num(p)) });

export const timeAgo = (v, tm = {}, nf) => {
  const t = toTs(v);
  if (!t) return '';
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return tm.now ?? '';
  if (mins < 60) return tpl(tm.min, { n: nf.format(mins) });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return tpl(tm.hour, { n: nf.format(hrs) });
  const days = Math.floor(hrs / 24);
  return days < 2 ? (tm.yesterday ?? '') : tpl(tm.days, { n: nf.format(days) });
};

export const sanitizeSearch = (v) => String(v ?? '')
  .replace(SEARCH_STRIP_RE, '')
  .replace(MULTI_SPACE_RE, ' ')
  .slice(0, SEARCH_MAX);

export const isSafeId = (id) => SAFE_ID_RE.test(String(id));
export const safePhone = (p) => String(p ?? '').replace(/[^\d+]/g, '').slice(0, 20);
export const shortId = (id) => String(id ?? '').slice(0, 8);
export const errText = (err) => String(err?.response?.data?.message || '').slice(0, 120) || undefined;
export const upper = (v) => String(v ?? '').toUpperCase();

export const pageList = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [...new Set([1, total, cur - 1, cur, cur + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out = [];
  pages.forEach((p, i) => { if (i && p - pages[i - 1] > 1) out.push(`gap${p}`); out.push(p); });
  return out;
};

export const csvCell = (v) => {
  let s = String(v ?? '');
  if (CSV_DANGER_RE.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

let swalPromise = null;
const loadSwal = () => (swalPromise ||= import('sweetalert2').then((m) => m.default).catch((e) => { swalPromise = null; throw e; }));
export const confirmDialog = (o) => loadSwal().then((S) => S.fire({ showCancelButton: true, ...o }));

/* ───────── hooks ───────── */

/* One shared MutationObserver for every consumer instead of one per component. */
const darkListeners = new Set();
let darkObserver = null;
const subscribeDark = (cb) => {
  darkListeners.add(cb);
  if (!darkObserver && typeof document !== 'undefined') {
    darkObserver = new MutationObserver(() => darkListeners.forEach((l) => l()));
    darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
  return () => {
    darkListeners.delete(cb);
    if (!darkListeners.size && darkObserver) { darkObserver.disconnect(); darkObserver = null; }
  };
};
const getDarkSnapshot = () => document.documentElement.classList.contains('dark');
const getDarkServerSnapshot = () => false;

export const useDarkMode = () => useSyncExternalStore(subscribeDark, getDarkSnapshot, getDarkServerSnapshot);

export const useEscape = (fn, active = true) => {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; }, [fn]);
  useEffect(() => {
    if (!active) return undefined;
    const h = (e) => { if (e.key === 'Escape') ref.current(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [active]);
};

/* Close on outside pointer / Escape — listeners only exist while open. */
export const useDismiss = (open, onClose) => {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => { if (ref.current && !ref.current.contains(e.target)) closeRef.current(); };
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return ref;
};

/* Fires once when the element nears the viewport (lazy charts, heavy blocks). */
export const useInView = (margin = '240px') => {
  const ref = useRef(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
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

/* ───────── page shell (same wrapper + font as ShopDashboard) ───────── */

export const NbStyles = memo(() => <style>{SCROLL_CSS}</style>);

export const ShopPage = memo(({ children, className = '' }) => {
  const { language, dir, font } = useShopLocale();
  return (
    <div
      dir={dir}
      lang={language}
      style={font}
      className={`nb-page min-h-screen py-6 lg:ps-64 mt-16 text-start ${className}`}
    >
      <NbStyles />
      <div key={language} className="lang-fade mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        {children}
      </div>
    </div>
  );
});

/* ───────── building blocks ───────── */

export const Spinner = memo(({ size = 20, className = '' }) => (
  <svg className={`animate-spin motion-reduce:animate-none ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-20" />
    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
));

export const SectionTitle = memo(({ icon: Icon, children }) => (
  <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase">
    {Icon && <Icon size={14} className="nb-ic flex-shrink-0" aria-hidden="true" />}
    <span className="nb-ul">{children}</span>
  </h3>
));

export const Meter = memo(({ pct, color, className = 'h-2.5' }) => (
  <span className={`nb-gray nb-line block overflow-hidden border-2 ${className}`} aria-hidden="true">
    <span
      className="block h-full"
      style={{
        width: `${Math.max(0, Math.min(100, pct))}%`,
        background: color || 'var(--nb-accent)',
        transition: REDUCED ? 'none' : 'width .5s ease',
      }}
    />
  </span>
));

export const SkeletonBlock = memo(({ className = '' }) => (
  <div className={`${CARD} nb-gray animate-pulse motion-reduce:animate-none ${className}`} />
));

export const Panel = memo(({ title, subtitle, icon, action, children, className = '' }) => (
  <section className={`${CARD} flex min-w-0 flex-col p-5 ${className}`}>
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

export const StatusChip = memo(({ status, labels = {} }) => {
  const st = getStatusStyle(status);
  return (
    <span className="nb-chip !normal-case" style={{ background: st.hex, color: st.ink }}>
      {labels[normStatus(status)] || status || '—'}
    </span>
  );
});

export const TableShell = memo(({ icon, tone, title, children }) => (
  <section className={`${CARD} min-w-0 overflow-hidden`}>
    <div className="nb-gray nb-line flex items-center gap-2.5 border-b-2 px-5 py-3.5">
      <IconTile icon={icon} tone={tone} className="h-9 w-9 flex-shrink-0" size={16} />
      <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">{title}</span></h3>
    </div>
    <div className="slim-scroll min-h-[260px] overflow-x-auto">{children}</div>
  </section>
));

export const TableHead = memo(({ cols }) => (
  <thead>
    <tr className="nb-line border-b-2">
      {cols.map(([label, align = 'text-start'], i) => (
        <th key={label} scope="col" className={`${TH} ${i === 0 || i === cols.length - 1 ? 'px-5' : ''} ${align}`}>{label}</th>
      ))}
    </tr>
  </thead>
));

export const IconTile = memo(({ icon: Icon, tone = 'em', className = 'w-11 h-11', size = 18 }) => (
  <span className={`nb-ico ${className}`} style={{ background: TONE_BG[tone] || TONE_BG.em }}>
    <Icon size={size} aria-hidden="true" />
  </span>
));

export const StatCard = memo(({ label, value, description, icon, tone, percent, color }) => (
  <div className="nb-card nb-lift p-4 min-w-0">
    <div className="flex items-center gap-3.5">
      <IconTile icon={icon} tone={tone} className="w-12 h-12 flex-shrink-0" size={20} />
      <div className="min-w-0 text-start">
        <p className="nb-muted text-[11px] font-bold uppercase rtl:tracking-normal truncate">{label}</p>
        <p className="text-2xl font-extrabold leading-tight tabular-nums truncate">{value}</p>
        {description && <p className="nb-muted text-[10px] font-semibold truncate">{description}</p>}
      </div>
    </div>
    {percent !== undefined && (
      <div className="mt-3 flex items-center gap-2">
        <Meter pct={percent} color={color || TONE_BG[tone]} className="h-2.5 flex-1" />
        <span className="w-9 text-end text-[10px] font-extrabold tabular-nums">{percent}%</span>
      </div>
    )}
  </div>
));

export const RowsDropdown = memo(({ value, onChange, label, formatNumber }) => {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const ref = useDismiss(open, close);
  const text = label || DEFAULT_LABELS.rows;

  const select = useCallback((e) => {
    onChange(Number(e.currentTarget.dataset.n));
    setOpen(false);
  }, [onChange]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${BTN_MD} h-10 min-w-[120px] justify-between uppercase`}
      >
        <span>{tpl(text, { n: formatNumber(value) })}</span>
        <FiChevronDown size={14} className={`transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" className="nb-menu absolute z-20 mt-2 w-full overflow-hidden">
          {ROWS_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              role="option"
              data-n={n}
              aria-selected={value === n}
              onClick={select}
              className={`nb-opt ${FOCUS}`}
            >
              {tpl(text, { n: formatNumber(n) })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export const SortTh = memo(({ label, active, dir, onClick, className = '' }) => (
  <th className={`${TH} ${className}`} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 uppercase hover:underline underline-offset-4 ${FOCUS}`}>
      {label}
      <span className={`flex flex-col -space-y-1 ${active ? 'nb-ic' : 'nb-muted'}`} aria-hidden="true">
        <FiChevronUp size={10} className={active && dir === 'asc' ? '' : 'opacity-50'} />
        <FiChevronDown size={10} className={active && dir === 'desc' ? '' : 'opacity-50'} />
      </span>
    </button>
  </th>
));

const PageBtn = memo(({ p, current, onChange, formatNumber }) => {
  const click = useCallback(() => onChange(p), [onChange, p]);
  return (
    <button
      type="button"
      onClick={click}
      aria-current={current ? 'page' : undefined}
      className={`${BTN} w-8 h-8 text-xs tabular-nums ${current ? 'nb-btn-on' : ''}`}
    >
      {formatNumber(p)}
    </button>
  );
});

export const Pagination = memo(({ page, total, onChange, labels = {}, formatNumber }) => {
  const pages = useMemo(() => pageList(page, total), [page, total]);
  const prev = useCallback(() => onChange(page - 1), [onChange, page]);
  const next = useCallback(() => onChange(page + 1), [onChange, page]);

  return (
    <nav className="flex items-center gap-1.5" aria-label={labels.paginationAria || DEFAULT_LABELS.paginationAria}>
      <button type="button" className={BTN_ICON} onClick={prev} disabled={page <= 1} aria-label={labels.prev || DEFAULT_LABELS.prev}>
        <FiChevronLeft size={16} className="rtl:rotate-180" />
      </button>
      {pages.map((p) => (typeof p === 'string'
        ? <span key={p} className="w-6 text-center text-xs font-bold" aria-hidden="true">…</span>
        : <PageBtn key={p} p={p} current={p === page} onChange={onChange} formatNumber={formatNumber} />))}
      <button type="button" className={BTN_ICON} onClick={next} disabled={page >= total} aria-label={labels.next || DEFAULT_LABELS.next}>
        <FiChevronRight size={16} className="rtl:rotate-180" />
      </button>
    </nav>
  );
});

export const Overlay = memo(({ onClose, children, bottom = false }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className={`fixed inset-0 z-[100] flex justify-center p-4 ${bottom ? 'items-end lg:items-center p-0 lg:p-4' : 'items-center'}`}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      {children}
    </div>
  );
});

/* Supports both <Choice onClick/> (legacy) and <Choice value onSelect/> (stable, memo-friendly). */
export const Choice = memo(({ active, onClick, value, onSelect, children }) => {
  const handle = useCallback(() => (onSelect ? onSelect(value) : onClick?.()), [onSelect, onClick, value]);
  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={active}
      className={`${BTN} px-4 py-2.5 text-xs uppercase rtl:tracking-normal ${active ? 'nb-btn-on' : ''}`}
    >
      {children}
    </button>
  );
});

const FilterGroup = memo(({ title, options, value, onChange }) => (
  <div>
    <p className="nb-muted text-[11px] font-bold uppercase rtl:tracking-normal mb-2.5">{title}</p>
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Choice key={o.value} value={o.value} active={value === o.value} onSelect={onChange}>{o.label}</Choice>
      ))}
    </div>
  </div>
));

export const FilterPanel = memo(({ title, note, groups, onReset, onClose, labels = {} }) => {
  useEscape(onClose);
  return (
    <Overlay onClose={onClose} bottom>
      <div role="dialog" aria-modal="true" aria-label={title} className="nb-card relative w-full lg:max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className="nb-gray nb-line px-5 py-4 border-b-2 flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">{title}</span></h3>
            {note && <p className="nb-muted text-[11px] font-semibold mt-1.5">{note}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={labels.close || DEFAULT_LABELS.close} className={BTN_ICON}><FiX size={15} /></button>
        </div>
        <div className="p-5 space-y-5 overflow-y-auto slim-scroll">
          {groups.map(([gTitle, options, value, onChange]) => (
            <FilterGroup key={gTitle} title={gTitle} options={options} value={value} onChange={onChange} />
          ))}
        </div>
        <div className="nb-gray nb-line px-5 py-4 border-t-2 flex gap-2.5 flex-shrink-0">
          <button type="button" onClick={onReset} className={`${BTN_MD} flex-1 uppercase`}>{labels.reset || DEFAULT_LABELS.reset}</button>
          <button type="button" onClick={onClose} className={`${BTN_PRIMARY} flex-1 uppercase`}>{labels.apply || DEFAULT_LABELS.apply}</button>
        </div>
      </div>
    </Overlay>
  );
});