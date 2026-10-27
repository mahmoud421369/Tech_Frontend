import React, {
  useState, useEffect, useCallback, useMemo, useRef, useDeferredValue, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiX, FiCopy, FiInfo, FiMapPin, FiPhone, FiClock, FiShoppingBag, FiClipboard,
  FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight, FiAlertCircle, FiCheck, FiTruck,
  FiNavigation, FiList, FiGrid, FiPackage, FiCreditCard, FiRefreshCw, FiShield,
} from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../components/user/UiExtras';

export const ORDERS_ASSIGNED_CONFIG = {
  noun: 'order',
  nounPlural: 'orders',
  icon: FiPackage,
  eyebrow: 'Tracking',
  title: 'Assigned Orders',
  subtitle: 'Look up the tasks assigned to a delivery agent',
  docTitle: 'Assigner - Assigned Orders | Tech Restore',
  currentPath: (id) => `/api/assigner/delivery/${encodeURIComponent(id)}/orders`,
  logType: 'ORDER',
  logIdField: 'orderId',
  priceField: 'totalPrice',
  priceLabel: 'Total amount',
  valueStatLabel: 'Total value',
  stopLabels: { pickup: 'Pickup · Shop', dropoff: 'Drop-off · Customer' },
};

const NB_FONT = "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const NB_FONT_STYLE = { fontFamily: NB_FONT };
const ensureNbFont = () => {
  if (typeof document === 'undefined' || document.getElementById('nb-font')) return;
  [['https://fonts.googleapis.com', false], ['https://fonts.gstatic.com', true]].forEach(([href, cors]) => {
    const l = document.createElement('link');
    l.rel = 'preconnect';
    l.href = href;
    if (cors) l.crossOrigin = '';
    document.head.appendChild(l);
  });
  const link = document.createElement('link');
  link.id = 'nb-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
};

const NB_CSS = `
.nb{--nb-bg:#f9fafb;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e8ebe9;--nb-dot:#04261a;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-dot:#3f3f3f;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);transition:transform .15s ease,box-shadow .15s ease}
.nb-lift:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:40px;height:12px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-squig path{stroke:var(--nb-accent)}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5;white-space:nowrap}
.nb-tile{display:inline-flex;align-items:center;justify-content:center;flex:none;border:2px solid var(--nb-line);color:#04261a}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow)}
.nb-field-warn{border-color:#f59e0b}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-opt{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:start;cursor:pointer}
.nb-opt:hover{background:var(--nb-gray)}
.nb-opt[aria-selected=true]{background:var(--nb-btn);color:var(--nb-on)}
.nb-rows>tr+tr{border-top:2px dotted var(--nb-dot)}
.nb-rows>tr:hover{background:var(--nb-gray)}
.nb-soft{background:var(--nb-gray);border:2px solid var(--nb-line);color:var(--nb-ink)}
.nb-tint{background-image:linear-gradient(rgba(52,211,153,.24),rgba(52,211,153,.24))}
.nb-row-on{background:rgba(52,211,153,.16)}
.nb-rows>tr.nb-row-on:hover{background:rgba(52,211,153,.3)}
.nb-overlay{background:rgba(4,38,26,.55)}
.nb-drawer{background:var(--nb-card);color:var(--nb-ink);border-inline-start:3px solid var(--nb-line);animation:nb-in .22s ease-out}
@keyframes nb-in{from{transform:translateX(100%)}to{transform:none}}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn{transition:none}.nb-drawer{animation:none}}
`;

const SCROLL_CSS = `
  .slim-scroll { scrollbar-width: thin; scrollbar-color: rgba(52,211,153,.6) transparent; }
  .slim-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .slim-scroll::-webkit-scrollbar-track { background: transparent; }
  .slim-scroll::-webkit-scrollbar-thumb { background: rgba(52,211,153,.55); }
  .slim-scroll::-webkit-scrollbar-thumb:hover { background: #34d399; }
`;

const STYLE_HTML = { __html: UI3D_CSS + EXTRAS_CSS + NB_CSS + SCROLL_CSS };

const ROWS_OPTIONS = [6, 12, 24, 48];
const ROWS_ITEMS = ROWS_OPTIONS.map((n) => ({ value: n, label: `${n} rows` }));
const SORT_ITEMS = [
  { value: 'date', label: 'Newest' },
  { value: 'price', label: 'Price' },
  { value: 'status', label: 'Status' },
  { value: 'user', label: 'Customer' },
  { value: 'shop', label: 'Shop' },
];
const DESC_FIRST = new Set(['date', 'price']);
const ID_MAX = 64;
const SEARCH_MAX = 60;
const COOLDOWN_MS = 1000;
const COLS = 7;
const TABLE_MQ = '(min-width: 1280px)';
const GRID_CLS = 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3';
const REDUCED = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const TONE_BG = {
  em: '#34d399', teal: '#2dd4bf', lime: '#a3e635', cyan: '#22d3ee', red: '#fb7185', amber: '#fbbf24', gray: '#d1d5db',
};
const STATUS_TONE = {
  PENDING: 'amber', PENDING_PICKUP: 'amber', ASSIGNED: 'em', IN_TRANSIT: 'cyan', IN_PROGRESS: 'cyan',
  SHIPPED: 'cyan', COMPLETED: 'em', CANCELLED: 'red',
};

const BTN_MD = 'nb-btn px-3 py-2 text-xs';
const BTN_ICON = 'nb-btn w-8 h-8';
const BTN_LG = 'nb-btn h-11 text-sm uppercase';

const DAY_FMT = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' });
const CLOCK_FMT = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const FULL_FMT = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const SHORT_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const PRICE_FMT = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const INT_FMT = new Intl.NumberFormat('en-US');

const isTokenExpired = (token) => {
  if (!token) return true;
  try { const d = jwtDecode(token); return !d.exp || d.exp < Date.now() / 1000; } catch { return true; }
};

const isNotAssigner = (token) => {
  try {
    const p = jwtDecode(token);
    const found = [p.role, p.roles, p.authorities, p.scope, localStorage.getItem('role')]
      .flat().filter(Boolean).join(' ').toUpperCase();
    return found !== '' && !found.includes('ASSIGNER');
  } catch { return false; }
};

const CTRL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const clean = (v) => String(v ?? '').replace(CTRL, '');
const txt = (v) => (typeof v === 'string' || typeof v === 'number' ? clean(v) : '');
const normalize = (v) => clean(v).normalize('NFKC');
const sanitizeId = (v) => normalize(v).replace(/[^A-Za-z0-9_-]/g, '').slice(0, ID_MAX);
const sanitizeSearch = (v) => normalize(v).replace(/[<>"'`\\]/g, '').replace(/\s{2,}/g, ' ').replace(/^\s+/, '').slice(0, SEARCH_MAX);
const isSafeId = (id) => /^[A-Za-z0-9_-]{1,64}$/.test(String(id));
const errText = (err) => String(err?.response?.data?.message || '').slice(0, 120) || undefined;
const asList = (res) => { const d = res?.data; return Array.isArray(d) ? d : d?.content || []; };
const shortId = (id) => clean(id).slice(-8).toUpperCase();
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const num = (v) => INT_FMT.format(v);
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const statusLabel = (s) => clean(s).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const formatPrice = (p) => `EGP ${PRICE_FMT.format(Number(p) || 0)}`;
const validDate = (v) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d : null; };
const fmtFull = (v) => { const d = validDate(v); return d ? FULL_FMT.format(d) : '—'; };
const fmtShort = (v) => { const d = validDate(v); return d ? SHORT_FMT.format(d) : '—'; };
const phoneHref = (p) => {
  const digits = String(p ?? '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
};
const mapsUrl = (a) => {
  const q = [a?.street, a?.city, a?.state].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
};
const notify = (icon, title, text) => toast({ icon, title, text });

const pageList = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [...new Set([1, total, cur - 1, cur, cur + 1])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  pages.forEach((p, i) => { if (i && p - pages[i - 1] > 1) out.push(`gap${p}`); out.push(p); });
  return out;
};

const nextSort = (s, field, first = 'asc') =>
  (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: first });

const normAddr = (a) => ({
  building: txt(a?.building), street: txt(a?.street), city: txt(a?.city), state: txt(a?.state),
});

const mapItem = (o, c) => ({
  id: o.id || o[c.logIdField],
  userName: `${txt(o.firstName)} ${txt(o.lastName)}`.trim() || txt(o.userName),
  userPhone: txt(o.phone) || txt(o.userPhone),
  userAddr: normAddr(o.userAddress),
  agentAddr: o.deliveryAddress
    ? [o.deliveryAddress.building, o.deliveryAddress.street, o.deliveryAddress.city, o.deliveryAddress.state].map(txt).filter(Boolean).join(', ') || 'N/A'
    : '',
  shopName: txt(o.shopName),
  shopPhone: txt(o.shopPhone),
  shopAddr: normAddr(o.shopAddress),
  amount: Number(o[c.priceField]) || 0,
  status: String(txt(o.status) || 'PENDING').toUpperCase(),
  createdAt: o.createdAt,
  ts: Date.parse(o.createdAt) || 0,
  payment: txt(o.paymentMethod),
});

const useDarkMode = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const el = document.documentElement;
    const mo = new MutationObserver(() => setDark(el.classList.contains('dark')));
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);
  return dark;
};

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
};

const UnderlinedTitle = memo(({ text }) => {
  const s = String(text || '');
  const i = s.lastIndexOf(' ');
  const head = i > 0 ? s.slice(0, i + 1) : '';
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

const Pill = memo(({ tone, children }) => (
  <span className="nb-chip" style={{ background: TONE_BG[tone] || TONE_BG.gray, color: '#04261a' }}>
    <span className="w-1.5 h-1.5 bg-[#04261a]" aria-hidden="true" />
    {children}
  </span>
));

const Ring = memo(({ percent, color }) => {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-16 h-16 flex-shrink-0" role="img" aria-label={`${percent}%`}>
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="8" style={{ stroke: 'var(--nb-gray)' }} />
        <circle
          cx="32" cy="32" r={r} fill="none" strokeWidth="8"
          stroke={color}
          strokeDasharray={`${(c * percent) / 100} ${c}`}
          style={{ transition: REDUCED ? 'none' : 'stroke-dasharray .6s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums">{percent}%</span>
    </div>
  );
});

const StatCard = memo(({ label, value, description, icon: Icon, color, percent }) => (
  <div className="nb-card nb-lift p-4 sm:p-5 flex items-center justify-between gap-3 min-w-0">
    <div className="min-w-0 flex-1 text-start">
      <div className="flex items-center gap-3">
        <span className="nb-tile w-11 h-11" style={{ background: color }}><Icon size={18} aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="nb-muted text-[11px] font-bold uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-extrabold tracking-tight leading-tight tabular-nums truncate">{value}</p>
        </div>
      </div>
      <p className="nb-muted mt-3 text-xs font-semibold truncate">{description}</p>
    </div>
    {percent !== undefined && <Ring percent={percent} color={color} />}
  </div>
));

const Tabs = memo(({ value, counts, onChange }) => (
  <div role="tablist" aria-label="Progress" className="nb-line flex gap-2 overflow-x-auto p-3 sm:px-4 border-b-2 last:border-b-0 [scrollbar-width:none]">
    {TABS.map(({ key, label }) => {
      const active = value === key;
      return (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(key)}
          className={`nb-btn flex-shrink-0 px-3 py-1.5 text-xs uppercase ${active ? 'nb-btn-on' : ''}`}
        >
          {label}
          <span className="nb-chip tabular-nums">{num(counts[key] || 0)}</span>
        </button>
      );
    })}
  </div>
));

const SortTh = memo(({ label, field, sort, onSort }) => {
  const active = sort.field === field;
  return (
    <th scope="col" className="px-3 py-3 text-start text-[11px] font-extrabold uppercase" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1 uppercase hover:underline underline-offset-4">
        {label}
        <span className={`flex flex-col -space-y-1 ${active ? 'nb-ic' : 'nb-muted'}`} aria-hidden="true">
          <FiChevronUp size={10} className={active && sort.dir === 'asc' ? '' : 'opacity-50'} />
          <FiChevronDown size={10} className={active && sort.dir === 'desc' ? '' : 'opacity-50'} />
        </span>
      </button>
    </th>
  );
});

const Th = ({ children }) => (
  <th scope="col" className="px-3 py-3 text-start text-[11px] font-extrabold uppercase">{children}</th>
);

const Dropdown = memo(({ value, options, onChange, ariaLabel }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} className={`${BTN_MD} h-10 min-w-[120px] justify-between uppercase`}>
        <span>{current?.label}</span>
        <FiChevronDown size={14} className={`transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div role="listbox" aria-label={ariaLabel} className="nb-menu absolute end-0 z-20 mt-2 w-full min-w-max overflow-hidden">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={value === o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="nb-opt"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const Pagination = memo(({ page, total, onChange }) => (
  <nav className="flex items-center gap-1.5" aria-label="Pagination">
    <button type="button" className={BTN_ICON} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page"><FiChevronLeft size={16} aria-hidden="true" /></button>
    {pageList(page, total).map((p) => (typeof p === 'string'
      ? <span key={p} className="w-6 text-center text-xs font-bold">…</span>
      : (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-label={`Go to page ${p}`}
          aria-current={p === page ? 'page' : undefined}
          className={`nb-btn w-8 h-8 text-xs tabular-nums ${p === page ? 'nb-btn-on' : ''}`}
        >
          {p}
        </button>
      )))}
    <button type="button" className={BTN_ICON} onClick={() => onChange(page + 1)} disabled={page >= total} aria-label="Next page"><FiChevronRight size={16} aria-hidden="true" /></button>
  </nav>
));

const PageBar = memo(({ page, totalPages, total, perPage, noun, onChange, boxed }) => {
  const from = total ? (page - 1) * perPage + 1 : 0;
  const to = Math.min(page * perPage, total);
  return (
    <div className={`${boxed ? 'nb-card' : 'nb-gray nb-line border-t-2'} px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3`}>
      <p className="text-xs font-semibold">
        Showing <b className="tabular-nums">{num(from)}–{num(to)}</b> of <b className="tabular-nums">{num(total)}</b> {noun}
      </p>
      {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={onChange} />}
    </div>
  );
});

const EmptyState = memo(({ title, subtitle, actionLabel, onAction, darkMode }) => (
  <div className="flex flex-col items-center">
    <EmptyState3D kind="box" title={title} subtitle={subtitle} darkMode={darkMode} />
    {actionLabel && <button type="button" onClick={onAction} className={`${BTN_MD} nb-btn-a mt-4 uppercase`}>{actionLabel}</button>}
  </div>
));

const ErrorState = memo(({ title, subtitle, retryLabel, onRetry }) => (
  <div className="text-center">
    <FiAlertCircle size={28} className="mx-auto text-red-500" aria-hidden="true" />
    <p className="mt-2 text-sm font-extrabold uppercase">{title}</p>
    <p className="nb-muted text-xs mb-4">{subtitle}</p>
    <button type="button" onClick={onRetry} className={`${BTN_MD} nb-btn-a uppercase`}><FiRefreshCw size={13} aria-hidden="true" /> {retryLabel}</button>
  </div>
));

const CardSkeleton = memo(() => (
  <li aria-hidden="true" className="nb-card p-4 animate-pulse motion-reduce:animate-none space-y-4">
    <div className="flex justify-between">
      <div className="space-y-2"><div className="nb-gray h-8 w-28" /><div className="nb-gray h-3 w-20" /></div>
      <div className="nb-gray h-6 w-24" />
    </div>
    <div className="nb-gray h-16" />
    <div className="space-y-3"><div className="nb-gray h-10" /><div className="nb-gray h-10" /></div>
    <div className="nb-gray h-11" />
  </li>
));

const Stop = memo(({ kind, label, title, subtitle, address }) => {
  const url = mapsUrl(address);
  const Icon = kind === 'pickup' ? FiShoppingBag : FiMapPin;
  return (
    <div className="relative flex items-start gap-3">
      <span className="nb-tile w-8 h-8" style={{ background: kind === 'pickup' ? TONE_BG.teal : TONE_BG.em }}>
        <Icon size={14} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="nb-muted text-[11px] font-extrabold uppercase tracking-wide">{label}</p>
        <p className="text-sm font-extrabold break-words">{title || 'Not provided'}</p>
        {subtitle && <p className="nb-muted text-xs font-semibold break-words">{subtitle}</p>}
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${kind === 'pickup' ? 'pickup' : 'drop-off'} location in maps`} className="nb-btn w-9 h-9 flex-shrink-0">
          <FiNavigation size={15} aria-hidden="true" />
        </a>
      )}
    </div>
  );
});

const Route = memo(({ item, labels }) => {
  const sa = item.shopAddr;
  const ua = item.userAddr;
  const shopSub = [sa.street, sa.city].filter(Boolean).join(', ') || item.shopPhone;
  const dropTitle = [ua.building, ua.street].filter(Boolean).join(' ') || 'Address not provided';
  const dropSub = [ua.city, ua.state].filter(Boolean).join(', ');
  return (
    <div className="relative space-y-4">
      <span aria-hidden="true" className="nb-line absolute start-4 top-8 bottom-8 border-s-2 border-dashed -translate-x-1/2" />
      <Stop kind="pickup" label={labels.pickup} title={item.shopName || 'Shop'} subtitle={shopSub} address={sa} />
      <Stop kind="dropoff" label={labels.dropoff} title={dropTitle} subtitle={dropSub} address={ua} />
    </div>
  );
});

const CustomerBox = memo(({ item }) => {
  const name = item.userName || 'Customer';
  const tel = phoneHref(item.userPhone);
  return (
    <div className="nb-soft flex items-center gap-3 p-3">
      <span className="nb-tile w-10 h-10 text-sm font-extrabold uppercase" style={{ background: TONE_BG.em }}>{name.charAt(0)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold uppercase truncate">{name}</p>
        <p dir="ltr" className="nb-muted text-xs font-semibold truncate text-start">{item.userPhone || 'No phone number'}</p>
      </div>
      {tel && (
        <a href={tel} aria-label={`Call ${name}`} className="nb-btn nb-btn-a w-10 h-10 flex-shrink-0">
          <FiPhone size={16} aria-hidden="true" />
        </a>
      )}
    </div>
  );
});

const InfoRow = memo(({ icon: Icon, label, value, ltr }) => (
  <div className="nb-soft flex items-center gap-3 p-3">
    <span className="nb-tile w-9 h-9" style={{ background: TONE_BG.em }}><Icon size={16} aria-hidden="true" /></span>
    <div className="min-w-0">
      <p className="nb-muted text-[11px] font-extrabold uppercase tracking-wide">{label}</p>
      <p dir={ltr ? 'ltr' : undefined} className="text-sm font-bold break-words text-start">{value || '—'}</p>
    </div>
  </div>
));

const TaskCard = memo(({ item, noun, labels, onOpen, onCopy }) => {
  const sid = shortId(item.id);
  return (
    <li className="min-w-0">
      <article className="nb-card nb-tint h-full flex flex-col gap-4 p-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button type="button" onClick={() => onCopy(item.id)} aria-label={`Copy ${noun} ID ${sid}`} className="nb-btn h-8 px-3 text-xs">
              #{sid} <FiCopy size={12} aria-hidden="true" />
            </button>
            <p className="nb-muted mt-2 text-xs font-bold">{fmtShort(item.createdAt)}</p>
          </div>
          <p className="text-base font-extrabold whitespace-nowrap tabular-nums">{formatPrice(item.amount)}</p>
        </header>

        <CustomerBox item={item} />
        <Route item={item} labels={labels} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Pill tone={STATUS_TONE[item.status] || 'gray'}>{statusLabel(item.status)}</Pill>
          {item.payment && (
            <span className="inline-flex items-center gap-1.5 min-w-0 text-xs font-extrabold">
              <FiCreditCard size={12} className="flex-shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[130px]">{item.payment}</span>
            </span>
          )}
        </div>

        <button type="button" onClick={() => onOpen(item)} aria-label={`View details for ${noun} ${sid}`} className={`${BTN_LG} mt-auto`}>
          Details
        </button>
      </article>
    </li>
  );
});

const Row = memo(({ item, noun, onOpen, onCopy }) => {
  const name = item.userName || 'Customer';
  const created = validDate(item.createdAt);
  const sid = shortId(item.id);
  return (
    <tr className="nb-row-on">
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="leading-tight">
          <p className="text-xs font-extrabold">{created ? DAY_FMT.format(created) : '—'}</p>
          <p className="nb-muted text-[10px] font-mono">{created ? CLOCK_FMT.format(created) : ''}</p>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5">
          <code className="text-[11px] font-mono font-bold">#{sid}</code>
          <button type="button" aria-label={`Copy ${noun} ID`} title="Copy ID" onClick={() => onCopy(item.id)} className="nb-muted hover:text-[var(--nb-accent)] transition-colors">
            <FiCopy size={12} aria-hidden="true" />
          </button>
        </span>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <span className="nb-tile w-9 h-9 text-sm font-extrabold uppercase" style={{ background: TONE_BG.em }}>{name.charAt(0)}</span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase truncate max-w-[170px]">{name}</p>
            <p dir="ltr" className="nb-muted text-[10px] font-semibold truncate max-w-[170px] text-start">{item.userPhone || 'No phone'}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-xs font-bold">
          <FiShoppingBag size={12} className="nb-ic flex-shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[150px]">{item.shopName || '—'}</span>
        </p>
        <p className="nb-muted flex items-center gap-1.5 text-[11px] font-semibold mt-0.5">
          <FiMapPin size={12} className="flex-shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[150px]">{item.userAddr.city || '—'}</span>
        </p>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap"><Pill tone={STATUS_TONE[item.status] || 'gray'}>{statusLabel(item.status)}</Pill></td>
      <td className="px-3 py-2.5 whitespace-nowrap text-xs font-extrabold tabular-nums">{formatPrice(item.amount)}</td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <button type="button" title="View details" aria-label={`View details for ${noun} ${sid}`} onClick={() => onOpen(item)} className={BTN_ICON}>
          <FiInfo size={14} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
});

const Drawer = ({ cfg, item, onClose, onCopy }) => {
  const closeRef = useRef(null);

  useEffect(() => {
    const prevFocus = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      prevFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const title = `${cap(cfg.noun)} details`;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="nb-overlay absolute inset-0" onClick={onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label={title} className="nb-drawer absolute inset-y-0 end-0 flex w-full max-w-md flex-col">
        <div className="nb-gray nb-line flex h-16 flex-shrink-0 items-center justify-between gap-3 border-b-2 px-5">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold uppercase">{title}</h2>
            <p className="nb-muted flex items-center gap-1.5 text-[10px] font-bold font-mono">
              #{shortId(item.id)}
              <button type="button" aria-label="Copy ID" onClick={() => onCopy(item.id)} className="hover:text-[var(--nb-accent)] transition-colors"><FiCopy size={10} aria-hidden="true" /></button>
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className={BTN_ICON}>
            <FiX size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="slim-scroll flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="nb-muted text-xs font-bold">{cfg.priceLabel}</p>
              <p className="text-2xl font-extrabold tabular-nums">{formatPrice(item.amount)}</p>
            </div>
            <Pill tone={STATUS_TONE[item.status] || 'gray'}>{statusLabel(item.status)}</Pill>
          </div>
          <CustomerBox item={item} />
          <Route item={item} labels={cfg.stopLabels} />
          <div className="space-y-2.5">
            <InfoRow icon={FiClock} label="Placed on" value={fmtFull(item.createdAt)} />
            {item.payment && <InfoRow icon={FiCreditCard} label="Payment" value={item.payment} />}
            {item.shopPhone && <InfoRow icon={FiPhone} label="Shop phone" value={item.shopPhone} ltr />}
            {item.agentAddr && <InfoRow icon={FiTruck} label="Agent address" value={item.agentAddr} />}
          </div>
        </div>

        <div className="nb-gray nb-line flex-shrink-0 border-t-2 px-5 py-4">
          <button type="button" onClick={onClose} className={`${BTN_LG} w-full`}>Close</button>
        </div>
      </aside>
    </div>
  );
};

export const AssignedQueue = memo(({ config = ORDERS_ASSIGNED_CONFIG }) => {
  const cfg = config;
  const navigate = useNavigate();
  const darkMode = useDarkMode();
  const isTable = useMediaQuery(TABLE_MQ);
  const tokenRef = useRef(localStorage.getItem('authToken'));
  const denied = useMemo(
    () => !tokenRef.current || isTokenExpired(tokenRef.current) || isNotAssigner(tokenRef.current),
    []
  );

  const [deliveryId, setDeliveryId] = useState('');
  const [idNotice, setIdNotice] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedId, setSearchedId] = useState('');
  const [filterText, setFilterText] = useState('');
  const [tab, setTab] = useState('all');
  const [view, setView] = useState('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_OPTIONS[0]);
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' });
  const [viewing, setViewing] = useState(null);

  const abortRef = useRef(null);
  const lastRunRef = useRef(0);
  const term = useDeferredValue(filterText).trim().toLowerCase();

  useEffect(() => { document.title = cfg.docTitle; }, [cfg.docTitle]);
  useEffect(() => { ensureNbFont(); }, []);

  useEffect(() => {
    if (!denied) return;
    const token = tokenRef.current;
    if (token && !isTokenExpired(token)) notify('error', 'Access denied', 'Assigner accounts only.');
    else localStorage.clear();
    navigate('/login', { replace: true });
  }, [denied, navigate]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const fetchItems = useCallback(async (override) => {
    if (denied) return;
    const id = sanitizeId(typeof override === 'string' ? override : deliveryId);
    if (!id) { notify('warning', 'Enter a delivery agent ID'); return; }
    if (!isSafeId(id)) { notify('error', 'Invalid ID', 'Use letters, numbers, - and _ only.'); return; }
    if (isTokenExpired(tokenRef.current)) { localStorage.clear(); navigate('/login', { replace: true }); return; }

    const now = Date.now();
    if (now - lastRunRef.current < COOLDOWN_MS) { notify('warning', 'Please wait a moment before searching again.'); return; }
    lastRunRef.current = now;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true); setError(false); setHasSearched(true); setSearchedId(id);
    const headers = { Authorization: `Bearer ${tokenRef.current}` };
    try {
      const [cur, log] = await Promise.allSettled([
        api.get(cfg.currentPath(id), { headers, signal: ctrl.signal }),
        api.get('/api/assigner/assignment-log', { headers, signal: ctrl.signal, params: { assignmentType: cfg.logType, deliveryId: id } }),
      ]);
      if (ctrl.signal.aborted) return;

      const statuses = [cur, log].map((r) => (r.status === 'rejected' ? r.reason?.response?.status : null));
      if (statuses.includes(401)) { localStorage.clear(); navigate('/login', { replace: true }); return; }
      if (statuses.includes(403)) { notify('error', 'Access denied', 'Assigner accounts only.'); navigate('/login', { replace: true }); return; }
      if (cur.status === 'rejected' && log.status === 'rejected') {
        setItems([]); setError(true);
        notify('error', statuses[0] === 404 ? `No assigned ${cfg.nounPlural} for this agent` : `Failed to load ${cfg.nounPlural}`, statuses[0] === 404 ? undefined : errText(cur.reason));
        return;
      }

      const current = cur.status === 'fulfilled' ? asList(cur.value).map((o) => mapItem(o, cfg)) : [];
      const assigned = log.status === 'fulfilled'
        ? asList(log.value).map((o) => ({ ...mapItem(o, cfg), status: String(txt(o.status) || 'ASSIGNED').toUpperCase() }))
        : [];

      const merged = new Map([...assigned, ...current].filter((o) => o.id).map((o) => [o.id, o]));
      setItems(Array.from(merged.values()));
      setTab('all');
      setFilterText('');
      setCurrentPage(1);
    } catch (err) {
      if (ctrl.signal.aborted || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
      setItems([]); setError(true);
      notify('error', `Failed to load ${cfg.nounPlural}`, errText(err));
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [denied, deliveryId, navigate, cfg]);

  const handleCopy = useCallback(async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      notify('success', 'Copied', 'ID copied to clipboard.');
    } catch {
      notify('error', 'Could not copy', 'Allow clipboard access in your browser.');
    }
  }, []);

  const index = useMemo(() => items.map((it) => {
    const user = it.userName.toLowerCase();
    const shop = it.shopName.toLowerCase();
    const id = String(it.id ?? '').toLowerCase();
    return {
      it, user, shop,
      status: it.status,
      price: it.amount,
      date: it.ts,
      done: it.status === 'COMPLETED',
      text: `${id} ${user} ${shop} ${it.userPhone.toLowerCase()} ${it.userAddr.city.toLowerCase()} ${it.status.toLowerCase().replace(/_/g, ' ')}`,
    };
  }), [items]);

  const stats = useMemo(() => {
    let done = 0; let value = 0;
    for (const e of index) { if (e.done) done += 1; value += e.price; }
    return { all: index.length, completed: done, active: index.length - done, value };
  }, [index]);
  const counts = useMemo(() => ({ all: stats.all, active: stats.active, completed: stats.completed }), [stats]);

  const filtered = useMemo(() => {
    const key = sort.field;
    const dir = sort.dir === 'asc' ? 1 : -1;
    const list = index.filter((e) => (
      (tab === 'all' || (tab === 'completed' ? e.done : !e.done))
      && (!term || e.text.includes(term))
    ));
    list.sort((a, b) => (a[key] < b[key] ? -dir : a[key] > b[key] ? dir : 0));
    return list.map((e) => e.it);
  }, [index, tab, term, sort]);

  useEffect(() => { setCurrentPage(1); }, [tab, term, rowsPerPage, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);

  const statCards = useMemo(() => [
    { label: 'Total tasks', value: num(stats.all), description: `${cap(cfg.nounPlural)} for this agent`, icon: cfg.icon, color: TONE_BG.em, percent: stats.all ? 100 : 0 },
    { label: 'Active', value: num(stats.active), description: 'Still in progress', icon: FiTruck, color: TONE_BG.teal, percent: pct(stats.active, stats.all) },
    { label: 'Completed', value: num(stats.completed), description: `Delivered ${cfg.nounPlural}`, icon: FiCheck, color: TONE_BG.lime, percent: pct(stats.completed, stats.all) },
    { label: cfg.valueStatLabel, value: formatPrice(stats.value), description: 'Across all tasks', icon: FiClipboard, color: TONE_BG.cyan },
  ], [stats, cfg]);

  const handleIdChange = useCallback((e) => {
    const raw = e.target.value;
    const next = sanitizeId(raw);
    setDeliveryId(next);
    setIdNotice(raw !== next);
  }, []);
  const handleFilterChange = useCallback((e) => setFilterText(sanitizeSearch(e.target.value)), []);
  const handleFilterKey = useCallback((e) => {
    if (e.key === 'Escape') setFilterText('');
    else if (e.key === 'Enter') e.preventDefault();
  }, []);
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData?.getData('text') || '';
    const next = sanitizeId(pasted);
    setDeliveryId(next);
    setIdNotice(pasted.trim() !== next);
  }, []);
  const handleSort = useCallback((field) => setSort((s) => nextSort(s, field, DESC_FIRST.has(field) ? 'desc' : 'asc')), []);
  const handleSortPick = useCallback((v) => setSort({ field: v, dir: DESC_FIRST.has(v) ? 'desc' : 'asc' }), []);
  const handleRowsPick = useCallback((v) => setRowsPerPage(Number(v)), []);
  const openItem = useCallback((item) => setViewing(item), []);
  const closeView = useCallback(() => setViewing(null), []);
  const refresh = useCallback(() => fetchItems(searchedId || undefined), [fetchItems, searchedId]);
  const clearFilter = useCallback(() => setFilterText(''), []);
  const goToPage = useCallback((p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  }, []);

  if (denied) return null;

  const showTable = isTable && view === 'table';
  const canSearch = !loading && !!deliveryId;
  const hasItems = items.length > 0;

  let stateNode = null;
  if (!loading) {
    if (!hasSearched) {
      stateNode = <EmptyState darkMode={darkMode} title="Find an agent's tasks" subtitle={`Enter a delivery agent ID above to see their ${cfg.nounPlural}`} />;
    } else if (error && !hasItems) {
      stateNode = <ErrorState title={`Couldn't load ${cfg.nounPlural} for this agent`} subtitle="Check the ID and try again." retryLabel="Try again" onRetry={refresh} />;
    } else if (filtered.length === 0) {
      stateNode = term
        ? <EmptyState darkMode={darkMode} title={`No matching ${cfg.nounPlural}`} subtitle="Try a different ID, customer, phone, shop or city, or switch tab." actionLabel="Clear search" onAction={clearFilter} />
        : <EmptyState darkMode={darkMode} title={`No assigned ${cfg.nounPlural}`} subtitle={`Nothing found for agent #${shortId(searchedId)} in this view`} />;
    }
  }

  return (
    <div
      style={NB_FONT_STYLE}
      className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen py-6 lg:ps-64 mt-16 text-start overflow-x-hidden`}
    >
      <style dangerouslySetInnerHTML={STYLE_HTML} />
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3 px-0.5">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />{cfg.eyebrow}</p>
            <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.25]">
              <UnderlinedTitle text={cfg.title} />
            </h1>
            <p className="nb-muted mt-2 text-sm font-medium">{cfg.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={!hasSearched || loading}
            aria-label={`Refresh ${cfg.nounPlural}`}
            title="Refresh"
            className={`${BTN_MD} h-10 uppercase`}
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <section className="nb-card overflow-hidden">
          <div className="nb-line p-3 sm:p-4 space-y-3 border-b-2">
            <form
              className="flex items-start gap-2.5"
              autoComplete="off"
              noValidate
              onSubmit={(e) => { e.preventDefault(); if (canSearch) fetchItems(); }}
            >
              <div className="flex-1 min-w-0">
                <div className={`nb-field flex h-10 items-center gap-2 px-3 ${idNotice ? 'nb-field-warn' : ''}`}>
                  <FiShield size={16} className="flex-shrink-0" aria-hidden="true" />
                  <label htmlFor="agent-id" className="sr-only">Delivery agent ID</label>
                  <input
                    id="agent-id"
                    name="agent-id"
                    type="text"
                    inputMode="text"
                    enterKeyHint="search"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    maxLength={ID_MAX}
                    pattern="[A-Za-z0-9_\-]{1,64}"
                    value={deliveryId}
                    onChange={handleIdChange}
                    onPaste={handlePaste}
                    aria-invalid={idNotice}
                    aria-describedby="agent-id-hint"
                    placeholder="Enter a delivery agent ID"
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
                  />
                </div>
                <p id="agent-id-hint" role="status" className={`mt-1.5 px-1 text-[11px] font-bold ${idNotice ? 'text-amber-600 dark:text-amber-400' : 'nb-muted'}`}>
                  {idNotice ? 'Only letters, numbers, - and _ are allowed. Other characters were removed.' : 'Letters, numbers, - and _ only.'}
                </p>
              </div>
              <button type="submit" disabled={!canSearch} className={`${BTN_MD} nb-btn-a h-10 px-5 flex-shrink-0 uppercase`}>
                {loading ? <FiRefreshCw size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <FiSearch size={15} aria-hidden="true" />}
                <span className="hidden sm:inline">{loading ? 'Loading' : `Find ${cfg.nounPlural}`}</span>
                <span className="sm:hidden">{loading ? '...' : 'Find'}</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="nb-field flex h-10 min-w-[220px] flex-1 items-center gap-2 px-3">
                <FiSearch size={16} className="flex-shrink-0" aria-hidden="true" />
                <label htmlFor="task-filter" className="sr-only">Search {cfg.nounPlural}</label>
                <input
                  id="task-filter"
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={SEARCH_MAX}
                  value={filterText}
                  disabled={!hasItems}
                  onChange={handleFilterChange}
                  onKeyDown={handleFilterKey}
                  placeholder="Search ID, customer, phone, shop or city"
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-search-cancel-button]:appearance-none"
                />
                {filterText && (
                  <button type="button" onClick={clearFilter} aria-label="Clear search" className="flex-shrink-0 nb-muted hover:text-[var(--nb-accent)]">
                    <FiX size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
              {!showTable && <Dropdown value={sort.field} options={SORT_ITEMS} onChange={handleSortPick} ariaLabel="Sort tasks" />}
              <Dropdown value={rowsPerPage} options={ROWS_ITEMS} onChange={handleRowsPick} ariaLabel="Tasks per page" />
              {isTable && (
                <div role="group" aria-label="View" className="flex gap-1.5">
                  <button type="button" onClick={() => setView('table')} aria-pressed={view === 'table'} className={`${BTN_MD} h-10 uppercase ${view === 'table' ? 'nb-btn-on' : ''}`}>
                    <FiList size={14} aria-hidden="true" /> Table
                  </button>
                  <button type="button" onClick={() => setView('cards')} aria-pressed={view === 'cards'} className={`${BTN_MD} h-10 uppercase ${view === 'cards' ? 'nb-btn-on' : ''}`}>
                    <FiGrid size={14} aria-hidden="true" /> Cards
                  </button>
                </div>
              )}
            </div>
          </div>
          <Tabs value={tab} counts={counts} onChange={setTab} />

          {showTable && (
            <>
              <div className="overflow-auto max-h-[68vh] slim-scroll">
                <table className="w-full min-w-[960px] text-start border-collapse">
                  <thead className="nb-gray sticky top-0 z-10 shadow-[0_2px_0_0_var(--nb-line)]">
                    <tr>
                      <SortTh label="Date" field="date" sort={sort} onSort={handleSort} />
                      <Th>ID</Th>
                      <SortTh label="Customer" field="user" sort={sort} onSort={handleSort} />
                      <SortTh label="Shop" field="shop" sort={sort} onSort={handleSort} />
                      <SortTh label="Status" field="status" sort={sort} onSort={handleSort} />
                      <SortTh label="Price" field="price" sort={sort} onSort={handleSort} />
                      <Th>Details</Th>
                    </tr>
                  </thead>
                  <tbody className="nb-rows">
                    {loading ? (
                      Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => (
                        <tr key={i} className="animate-pulse motion-reduce:animate-none">
                          {Array.from({ length: COLS }, (__, j) => (
                            <td key={j} className="px-3 py-4"><div className="nb-gray h-3.5 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    ) : stateNode ? (
                      <tr><td colSpan={COLS} className="px-6 py-14 text-center">{stateNode}</td></tr>
                    ) : (
                      paginated.map((i) => <Row key={i.id} item={i} noun={cfg.noun} onOpen={openItem} onCopy={handleCopy} />)
                    )}
                  </tbody>
                </table>
              </div>
              {filtered.length > 0 && !loading && (
                <PageBar page={page} totalPages={totalPages} total={filtered.length} perPage={rowsPerPage} noun={cfg.nounPlural} onChange={goToPage} />
              )}
            </>
          )}
        </section>

        {!showTable && (
          loading ? (
            <ul className={GRID_CLS} aria-busy="true" aria-label={`Loading ${cfg.nounPlural}`}>
              {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
            </ul>
          ) : stateNode ? (
            <div className="nb-card px-6 py-12">{stateNode}</div>
          ) : (
            <>
              <ul className={GRID_CLS}>
                {paginated.map((i) => <TaskCard key={i.id} item={i} noun={cfg.noun} labels={cfg.stopLabels} onOpen={openItem} onCopy={handleCopy} />)}
              </ul>
              <PageBar boxed page={page} totalPages={totalPages} total={filtered.length} perPage={rowsPerPage} noun={cfg.nounPlural} onChange={goToPage} />
            </>
          )
        )}
      </div>

      {viewing && <Drawer cfg={cfg} item={viewing} onClose={closeView} onCopy={handleCopy} />}
    </div>
  );
});

const AssignedOrders = () => <AssignedQueue config={ORDERS_ASSIGNED_CONFIG} />;

export default memo(AssignedOrders);