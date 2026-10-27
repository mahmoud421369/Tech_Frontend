import React, {
  useState, useEffect, useMemo, useCallback, useRef, useDeferredValue, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiX, FiCopy, FiInfo, FiCheck, FiChevronLeft, FiChevronRight, FiChevronUp,
  FiChevronDown, FiDownload, FiRefreshCw, FiFileText, FiCheckCircle, FiClock, FiDollarSign,
  FiActivity, FiCalendar, FiCreditCard, FiAlertCircle, FiXCircle,
} from 'react-icons/fi';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../components/user/UiExtras';

const ROWS_OPTIONS = [5, 10, 20, 50];
const SEARCH_MAX = 60;
const PAGE_SIZE = 100;
const MAX_SERVER_PAGES = 50;
const PRICE_PER_MONTH = 1000;
const TABS = [
  { key: 'all', label: 'All plans' },
  { key: 'cash', label: 'Cash queue' },
];
const REDUCED = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const STATUS_META = {
  PAID: { label: 'Settled', bg: '#34d399' },
  PENDING: { label: 'Pending', bg: '#fbbf24' },
  FAILED: { label: 'Failed', bg: '#fb7185' },
  REJECTED: { label: 'Rejected', bg: '#fb7185' },
  CANCELLED: { label: 'Cancelled', bg: '#fb7185' },
};
const STATUS_OTHER_BG = '#22d3ee';
const METHOD_BG = { CASH: '#fbbf24', CARD: '#22d3ee' };

const CASH_ACTIONS = {
  confirm: {
    endpoint: 'confirm',
    title: 'Authorize cash payment?',
    text: 'This will instantly activate the shop subscription.',
    confirmLabel: 'Confirm payment',
    icon: FiCheck,
    tone: 'em',
    danger: false,
    ok: 'Payment confirmed',
    fail: 'Confirmation failed',
  },
  reject: {
    endpoint: 'reject',
    title: 'Reject cash entry?',
    text: 'This will cancel the subscription request.',
    confirmLabel: 'Reject payment',
    icon: FiXCircle,
    tone: 'red',
    danger: true,
    ok: 'Payment rejected',
    fail: 'Rejection failed',
  },
};

const NB_FONT = "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const NB_FONT_STYLE = { fontFamily: NB_FONT };
const ensureNbFont = () => {
  if (typeof document === 'undefined' || document.getElementById('nb-font')) return;
  [['https://fonts.googleapis.com', false], ['https://fonts.gstatic.com', true]].forEach(([href, cors]) => {
    const l = document.createElement('link');
    l.rel = 'preconnect'; l.href = href; if (cors) l.crossOrigin = '';
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
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
.nb-squig path{stroke:var(--nb-accent)}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5;white-space:nowrap}
.nb-chip-n{background:var(--nb-gray);color:var(--nb-muted);border-style:dashed}
.nb-tile{display:inline-flex;align-items:center;justify-content:center;flex:none;border:2px solid var(--nb-line);color:#04261a}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn-danger{background:#ef4444;color:#fff}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow)}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-opt{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:start;cursor:pointer}
.nb-opt:hover{background:var(--nb-gray)}
.nb-opt[aria-selected=true]{background:var(--nb-btn);color:var(--nb-on)}
.nb select option{background:var(--nb-card);color:var(--nb-ink)}
.nb-track{height:12px;background:var(--nb-gray);border:2px solid var(--nb-line);overflow:hidden}
.nb-rows>tr+tr{border-top:2px dotted var(--nb-dot)}
.nb-rows>tr:hover{background:var(--nb-gray)}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn{transition:none}}
`;

const SCROLL_CSS = `
  .slim-scroll { scrollbar-width: thin; scrollbar-color: rgba(52,211,153,.6) transparent; }
  .slim-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .slim-scroll::-webkit-scrollbar-track { background: transparent; }
  .slim-scroll::-webkit-scrollbar-thumb { background: rgba(52,211,153,.55); }
  .slim-scroll::-webkit-scrollbar-thumb:hover { background: #34d399; }
`;

const PAGE_CSS = UI3D_CSS + EXTRAS_CSS + NB_CSS + SCROLL_CSS;

const BTN_MD = 'nb-btn px-3 py-2 text-xs';
const BTN_ICON = 'nb-btn w-8 h-8';
const BTN_DANGER = 'nb-btn nb-btn-danger px-3 py-2 text-xs';
const BTN_PRIMARY = 'nb-btn nb-btn-a px-3 py-2 text-xs';
const PANEL = 'nb-gray nb-line border-2 border-dotted';

const TONE_BG = { em: '#34d399', teal: '#2dd4bf', lime: '#a3e635', cyan: '#22d3ee', amber: '#fbbf24', red: '#fb7185' };

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });
const NF = new Intl.NumberFormat('en-US');
const fmt = (n) => NF.format(n);

const fmtDate = (d) => {
  if (!d) return '—';
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? '—' : DATE_FMT.format(t);
};
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const pct = (n, total) => (total ? Math.min(100, Math.round((n / total) * 100)) : 0);

const CTRL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const clean = (v) => String(v ?? '').replace(CTRL, '');
const sanitizeSearch = (v) => clean(v).replace(/[<>]/g, '').replace(/\s{2,}/g, ' ').slice(0, SEARCH_MAX);
const isSafeId = (id) => /^[A-Za-z0-9_-]{1,64}$/.test(String(id));
const errText = (err) => String(err?.response?.data?.message || '').slice(0, 120) || undefined;
const isCanceled = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';
const monthsText = (m) => (m ? `${m} ${m === 1 ? 'month' : 'months'}` : '—');
const nextSort = (s, field) => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });

const isNotAdmin = (token) => {
  try {
    const raw = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const p = JSON.parse(atob(raw));
    const found = [p.role, p.roles, p.authorities, p.scope, localStorage.getItem('role')]
      .flat().filter(Boolean).join(' ').toUpperCase();
    return found !== '' && !found.includes('ADMIN');
  } catch { return false; }
};

const csvCell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};
const downloadCSV = (name, head, rows) => {
  const text = [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([`\ufeff${text}`], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const pageList = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [...new Set([1, total, cur - 1, cur, cur + 1])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  pages.forEach((p, i) => { if (i && p - pages[i - 1] > 1) out.push(`gap${p}`); out.push(p); });
  return out;
};

const statusKey = (s) => (s.paymentStatus === 'PAID' || s.status === 'ACTIVE' ? 'PAID' : String(s.paymentStatus || s.status || 'PENDING').toUpperCase());

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

const useEscape = (fn) => {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') fn(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [fn]);
};

const normalizeSub = (item) => ({
  id: item.id || item.subscriptionId,
  subscriptionId: item.subscriptionId || item.id,
  shopId: item.shop?.id || item.shopId,
  shopName: item.shop?.name || item.shopName || 'Unknown shop',
  shopEmail: item.shop?.email || item.shopEmail,
  startDate: item.startDate,
  endDate: item.endDate,
  months: num(item.months),
  status: item.status || 'PENDING',
  paymentMethod: String(item.payment?.method || item.paymentMethod || 'CARD').toUpperCase(),
  paymentStatus: item.payment?.paymentStatus || item.paymentStatus || 'PENDING',
  amount: num(item.amount || item.payment?.amount),
  paymentId: item.payment?.id || item.paymentId,
});

const normalizeCash = (item) => ({
  id: item.id,
  paymentId: item.id,
  shopId: item.shop?.id || item.shopId,
  shopName: item.shop?.name || item.shopName || 'Unknown shop',
  shopEmail: item.shop?.email || item.shopEmail,
  paymentMethod: 'CASH',
  paymentStatus: item.paymentStatus || 'PENDING',
  status: item.status || 'PENDING',
  createdAt: item.createdAt,
  details: item.details,
  amount: num(item.amount),
});

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

const IconTile = memo(({ icon: Icon, tone = 'em', className = 'w-11 h-11', size = 18 }) => (
  <span className={`nb-tile ${className}`} style={{ background: TONE_BG[tone] }}>
    <Icon size={size} aria-hidden="true" />
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
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums">
        {percent}%
      </span>
    </div>
  );
});

const StatCard = memo(({ label, value, description, icon, tone, percent, color }) => (
  <div className="nb-card nb-lift p-4 sm:p-5 flex items-center justify-between gap-3 min-w-0">
    <div className="min-w-0 flex-1 text-left">
      <div className="flex items-center gap-3">
        <IconTile icon={icon} tone={tone} />
        <div className="min-w-0">
          <p className="nb-muted text-[11px] font-bold uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-extrabold tracking-tight leading-tight tabular-nums truncate">{value}</p>
        </div>
      </div>
      <p className="nb-muted mt-3 text-xs font-semibold truncate">{description}</p>
    </div>
    <Ring percent={percent} color={color} />
  </div>
));

const StatusPill = memo(({ k }) => {
  const m = STATUS_META[k];
  return (
    <span className="nb-chip" style={{ background: m ? m.bg : STATUS_OTHER_BG, color: '#04261a' }}>
      <span className="w-1.5 h-1.5 bg-[#04261a]" aria-hidden="true" />
      {m ? m.label : clean(k).charAt(0) + clean(k).slice(1).toLowerCase()}
    </span>
  );
});

const MethodPill = memo(({ method }) => (
  <span className="nb-chip" style={{ background: METHOD_BG[method] || METHOD_BG.CARD, color: '#04261a' }}>
    <FiCreditCard size={11} aria-hidden="true" /> {clean(method) || 'CARD'}
  </span>
));

const RowsDropdown = memo(({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} className={`${BTN_MD} h-10 min-w-[120px] justify-between uppercase`}>
        <span>{value} rows</span>
        <FiChevronDown size={14} className={`transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" className="nb-menu absolute right-0 z-20 mt-2 w-full overflow-hidden">
          {ROWS_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              role="option"
              aria-selected={value === n}
              onClick={() => { onChange(n); setOpen(false); }}
              className="nb-opt"
            >
              {n} rows
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const SortTh = memo(({ label, field, sort, onSort }) => {
  const active = sort.field === field;
  return (
    <th scope="col" className="px-3 py-3 text-left text-[11px] font-extrabold uppercase" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1 uppercase hover:underline underline-offset-4">
        {label}
        <span className={`flex flex-col -space-y-1 ${active ? 'nb-ic' : 'nb-muted'}`}>
          <FiChevronUp size={10} className={active && sort.dir === 'asc' ? '' : 'opacity-50'} />
          <FiChevronDown size={10} className={active && sort.dir === 'desc' ? '' : 'opacity-50'} />
        </span>
      </button>
    </th>
  );
});

const PlainTh = memo(({ children }) => (
  <th scope="col" className="px-3 py-3 text-left text-[11px] font-extrabold uppercase">{children}</th>
));

const Pagination = memo(({ page, total, onChange }) => (
  <nav className="flex items-center gap-1.5" aria-label="Pagination">
    <button type="button" className={BTN_ICON} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page"><FiChevronLeft size={16} /></button>
    {pageList(page, total).map((p) => (typeof p === 'string'
      ? <span key={p} className="w-6 text-center text-xs font-bold">…</span>
      : (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`nb-btn w-8 h-8 text-xs tabular-nums ${p === page ? 'nb-btn-on' : ''}`}
        >
          {p}
        </button>
      )))}
    <button type="button" className={BTN_ICON} onClick={() => onChange(page + 1)} disabled={page >= total} aria-label="Next page"><FiChevronRight size={16} /></button>
  </nav>
));

const Tabs = memo(({ tabs, value, onChange, counts }) => (
  <div role="tablist" aria-label="Subscription view" className="nb-line flex gap-2 overflow-x-auto p-3 sm:px-4 border-b-2 [scrollbar-width:none]">
    {tabs.map(({ key, label }) => {
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
          <span className="nb-chip tabular-nums">{fmt(counts[key] ?? 0)}</span>
        </button>
      );
    })}
  </div>
));

const ShopCell = memo(({ name, email }) => (
  <div className="flex items-center gap-2.5">
    <span className="nb-tile w-9 h-9 text-sm font-extrabold uppercase" style={{ background: TONE_BG.em }}>
      {name.charAt(0)}
    </span>
    <div className="min-w-0">
      <p className="text-xs font-extrabold uppercase truncate max-w-[220px]">{name}</p>
      <p className="nb-muted text-[10px] font-semibold truncate max-w-[220px]">{email || '—'}</p>
    </div>
  </div>
));

const SubRow = memo(({ sub, onView, onCopy }) => (
  <tr className="transition-colors motion-reduce:transition-none">
    <td className="px-3 py-2.5 whitespace-nowrap">
      <ShopCell name={clean(sub.shopName) || 'Unnamed shop'} email={clean(sub.shopEmail)} />
    </td>
    <td className="px-3 py-2.5 whitespace-nowrap">
      <span className="inline-flex items-center gap-1.5">
        <code className="text-[11px] font-mono font-bold max-w-[110px] truncate block">{clean(sub.shopId) || '—'}</code>
        {sub.shopId && (
          <button type="button" title="Copy shop ID" aria-label="Copy shop ID" onClick={() => onCopy(sub.shopId)} className="nb-muted hover:text-[var(--nb-accent)] transition-colors"><FiCopy size={12} /></button>
        )}
      </span>
    </td>
    <td className="px-3 py-2.5 whitespace-nowrap text-xs font-bold tabular-nums">{monthsText(sub.months)}</td>
    <td className="px-3 py-2.5 whitespace-nowrap"><MethodPill method={sub.paymentMethod} /></td>
    <td className="px-3 py-2.5 whitespace-nowrap"><StatusPill k={statusKey(sub)} /></td>
    <td className="px-3 py-2.5 whitespace-nowrap">
      <button type="button" title="View details" aria-label="View details" onClick={() => onView(sub)} className={BTN_ICON}><FiInfo size={14} /></button>
    </td>
  </tr>
));

const CashRow = memo(({ item, busy, onAct }) => (
  <tr className="transition-colors motion-reduce:transition-none">
    <td className="px-3 py-2.5 whitespace-nowrap">
      <ShopCell name={clean(item.shopName) || 'Unnamed shop'} email={clean(item.shopEmail)} />
    </td>
    <td className="px-3 py-2.5 whitespace-nowrap"><MethodPill method="CASH" /></td>
    <td className="px-3 py-2.5 whitespace-nowrap text-xs font-bold tabular-nums">{fmtDate(item.createdAt)}</td>
    <td className="nb-muted px-3 py-2.5 text-xs font-medium max-w-[220px] truncate" title={clean(item.details)}>{clean(item.details) || '—'}</td>
    <td className="px-3 py-2.5 whitespace-nowrap text-xs font-extrabold tabular-nums">
      <span className="nb-chip" style={{ background: TONE_BG.em, color: '#04261a' }}>EGP {fmt(item.amount)}</span>
    </td>
    <td className="px-3 py-2.5 whitespace-nowrap">
      <div className="flex items-center gap-1.5">
        <button type="button" disabled={busy} title="Accept payment" aria-label="Accept payment" onClick={() => onAct(item, 'confirm')} className={`${BTN_ICON} !text-emerald-700 dark:!text-emerald-300`}><FiCheck size={14} /></button>
        <button type="button" disabled={busy} title="Reject payment" aria-label="Reject payment" onClick={() => onAct(item, 'reject')} className={`${BTN_ICON} !text-red-600 dark:!text-red-300`}><FiXCircle size={14} /></button>
      </div>
    </td>
  </tr>
));

const SubscriptionModal = memo(({ sub, onClose, onCopy }) => {
  useEscape(onClose);
  const amount = sub.amount || (sub.months ? sub.months * PRICE_PER_MONTH : 0);
  const rows = [
    { icon: FiFileText, label: 'Shop', value: clean(sub.shopName) || '—' },
    { icon: FiActivity, label: 'Shop ID', value: clean(sub.shopId) || '—', mono: true },
    { icon: FiCalendar, label: 'Start date', value: fmtDate(sub.startDate) },
    { icon: FiCalendar, label: 'End date', value: fmtDate(sub.endDate) },
    { icon: FiClock, label: 'Duration', value: monthsText(sub.months) },
    { icon: FiDollarSign, label: 'Amount', value: amount ? `${fmt(amount)} EGP` : '—', accent: true },
    { icon: FiCreditCard, label: 'Method', value: clean(sub.paymentMethod || 'CARD').toUpperCase() },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Subscription details" className="nb-card relative w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden">
        <div className="nb-gray nb-line px-5 py-3.5 border-b-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <IconTile icon={FiFileText} tone="cyan" className="w-9 h-9" size={16} />
            <div>
              <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">Subscription details</span></h3>
              {sub.shopId && (
                <p className="nb-muted mt-1 flex items-center gap-1.5 text-[10px] font-bold font-mono">
                  {clean(sub.shopId).slice(0, 12)}
                  <button type="button" aria-label="Copy shop ID" onClick={() => onCopy(sub.shopId)} className="hover:text-[var(--nb-accent)] transition-colors"><FiCopy size={10} /></button>
                </p>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={BTN_ICON}><FiX size={15} /></button>
        </div>

        <div className="px-5 py-4 overflow-y-auto slim-scroll">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {rows.map(({ icon: Icon, label, value, mono, accent }) => (
              <div key={label} className={`${PANEL} p-3 flex items-center gap-2.5`}>
                <Icon size={15} className="nb-ic flex-shrink-0" />
                <div className="min-w-0">
                  <p className="nb-muted text-[9px] font-bold uppercase">{label}</p>
                  <p className={`text-xs font-extrabold truncate ${mono ? 'font-mono' : ''} ${accent ? 'nb-ic' : ''}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="nb-gray nb-line px-5 py-3.5 border-t-2 flex justify-end flex-shrink-0">
          <button type="button" onClick={onClose} className={`${BTN_MD} uppercase`}>Close</button>
        </div>
      </div>
    </div>
  );
});

const CashConfirmModal = memo(({ pending, busy, onClose, onConfirm }) => {
  const guard = useCallback(() => { if (!busy) onClose(); }, [busy, onClose]);
  useEscape(guard);
  const { item, kind } = pending;
  const a = CASH_ACTIONS[kind];
  const name = clean(item.shopName) || 'Unnamed shop';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={guard} aria-hidden="true" />
      <div role="alertdialog" aria-modal="true" aria-label={a.title} className="nb-card relative w-full max-w-sm overflow-hidden">
        <div className="nb-gray nb-line px-5 py-4 flex items-center gap-3 border-b-2">
          <IconTile icon={a.icon} tone={a.tone} className="w-10 h-10" size={16} />
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold uppercase">{a.title}</h3>
            <p className="nb-muted text-[11px] font-semibold">{a.text}</p>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className={`${PANEL} p-3 flex items-center justify-between gap-2.5`}>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase truncate">{name}</p>
              <p className="nb-muted text-[10px] font-semibold truncate">{clean(item.shopEmail) || '—'}</p>
            </div>
            <span className="nb-chip tabular-nums" style={{ background: TONE_BG.em, color: '#04261a' }}>EGP {fmt(item.amount)}</span>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2.5">
          <button type="button" onClick={guard} disabled={busy} className={`${BTN_MD} flex-1 uppercase`}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy} className={`${a.danger ? BTN_DANGER : BTN_PRIMARY} flex-1 uppercase`}>
            {busy ? <FiRefreshCw size={13} className="animate-spin motion-reduce:animate-none" /> : <a.icon size={13} />}
            {busy ? 'Working…' : a.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});

const AdminSubscriptions = () => {
  const navigate = useNavigate();
  const darkMode = useDarkMode();
  const tokenRef = useRef(localStorage.getItem('authToken'));
  const denied = useMemo(() => !tokenRef.current || isNotAdmin(tokenRef.current), []);
  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${tokenRef.current}` }), []);

  const [subs, setSubs] = useState([]);
  const [cash, setCash] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());

  const inflight = useRef(new Set());
  const abortRef = useRef(null);
  const detailAbort = useRef(null);

  const term = useDeferredValue(search).trim().toLowerCase();

  useEffect(() => { document.title = 'Admin - Subscriptions'; }, []);
  useEffect(() => { ensureNbFont(); }, []);

  useEffect(() => {
    if (!tokenRef.current) { navigate('/login', { replace: true }); return; }
    if (denied) { toast({ icon: 'error', title: 'Access denied', text: 'Admin accounts only.' }); navigate('/login', { replace: true }); }
  }, [navigate, denied]);

  const loadSubs = useCallback(async (signal) => {
    const url = '/api/admin/subscriptions/subscriptions-with-payment';
    const first = await api.get(url, { params: { page: 0, size: PAGE_SIZE }, headers: authHeaders(), signal });
    if (signal.aborted) return;
    const head = (first.data?.content || []).map(normalizeSub);
    setSubs(head);
    const pages = Math.min(first.data?.totalPages || 1, MAX_SERVER_PAGES);
    if (pages <= 1) return;
    const rest = await Promise.allSettled(
      Array.from({ length: pages - 1 }, (_, i) => api.get(url, { params: { page: i + 1, size: PAGE_SIZE }, headers: authHeaders(), signal })),
    );
    if (signal.aborted) return;
    let list = head;
    let failed = false;
    for (const r of rest) {
      if (r.status === 'fulfilled') list = list.concat((r.value.data?.content || []).map(normalizeSub));
      else if (!isCanceled(r.reason)) failed = true;
    }
    if (failed) toast({ icon: 'warning', title: 'Partial data', text: 'Some pages could not be loaded.' });
    if (list.length > head.length) setSubs(list);
  }, [authHeaders]);

  const loadCash = useCallback(async (signal) => {
    const { data } = await api.get('/api/admin/subscriptions/cash/pending', { headers: authHeaders(), signal });
    if (signal.aborted) return;
    setCash((Array.isArray(data) ? data : data?.content || []).map(normalizeCash));
  }, [authHeaders]);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!tokenRef.current || denied) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (!silent) setLoading(true);
    setError(false);

    const results = await Promise.allSettled([loadSubs(ctrl.signal), loadCash(ctrl.signal)]);
    if (ctrl.signal.aborted) return;

    const failed = results.filter((r) => r.status === 'rejected' && !isCanceled(r.reason));
    if (failed.length) {
      const status = failed[0].reason?.response?.status;
      if (status === 401) navigate('/login', { replace: true });
      else if (status === 403) toast({ icon: 'error', title: 'Access denied', text: 'Admin accounts only.' });
      else { setError(true); toast({ icon: 'error', title: 'Sync failed', text: errText(failed[0].reason) }); }
    } else {
      setLastUpdated(new Date());
    }
    if (abortRef.current === ctrl) setLoading(false);
  }, [navigate, denied, loadSubs, loadCash]);

  useEffect(() => {
    load();
    return () => { abortRef.current?.abort(); detailAbort.current?.abort(); };
  }, [load]);

  const withBusy = useCallback(async (id, task) => {
    if (!isSafeId(id) || inflight.current.has(String(id))) return;
    inflight.current.add(String(id));
    setBusyIds(new Set(inflight.current));
    try { await task(encodeURIComponent(id)); } finally {
      inflight.current.delete(String(id));
      setBusyIds(new Set(inflight.current));
    }
  }, []);

  const requestCash = useCallback((item, kind) => setPending({ item, kind }), []);
  const closeCash = useCallback(() => setPending(null), []);

  const runCash = useCallback(async () => {
    if (!pending) return;
    const { item, kind } = pending;
    const a = CASH_ACTIONS[kind];
    await withBusy(item.paymentId, async (eid) => {
      try {
        await api.post(`/api/admin/subscriptions/cash/${a.endpoint}/${eid}`, {}, { headers: authHeaders() });
        setCash((prev) => prev.filter((c) => c.paymentId !== item.paymentId));
        toast({ icon: 'success', title: a.ok });
        load({ silent: true });
      } catch (err) {
        toast({ icon: 'error', title: a.fail, text: errText(err) });
      }
    });
    setPending(null);
  }, [pending, withBusy, authHeaders, load]);

  const viewSub = useCallback(async (sub) => {
    setSelected(sub);
    const sid = sub.subscriptionId || sub.id;
    if (!isSafeId(sid)) return;
    detailAbort.current?.abort();
    const ctrl = new AbortController();
    detailAbort.current = ctrl;
    try {
      const { data } = await api.get(`/api/admin/subscriptions/${encodeURIComponent(sid)}`, { headers: authHeaders(), signal: ctrl.signal });
      if (!ctrl.signal.aborted) setSelected((prev) => (prev && prev.id === sub.id ? { ...prev, ...data } : prev));
    } catch {}
  }, [authHeaders]);

  const rows = tab === 'cash' ? cash : subs;

  const index = useMemo(() => rows.map((s) => {
    const name = clean(s.shopName).toLowerCase();
    const email = clean(s.shopEmail).toLowerCase();
    const id = String(s.shopId ?? '').toLowerCase();
    return {
      s, name, id,
      months: s.months || 0,
      method: String(s.paymentMethod || '').toLowerCase(),
      status: statusKey(s).toLowerCase(),
      date: s.createdAt ? new Date(s.createdAt).getTime() || 0 : 0,
      amount: s.amount || 0,
      text: `${name} ${email} ${id}`,
    };
  }), [rows]);

  const stats = useMemo(() => {
    let active = 0; let pendingCount = 0;
    for (const s of subs) {
      if (s.status === 'ACTIVE') active += 1;
      if (s.paymentStatus === 'PENDING' || s.status === 'PENDING') pendingCount += 1;
    }
    return { total: subs.length, active, pending: pendingCount, cash: cash.length };
  }, [subs, cash]);

  const filtered = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    const key = sort.field;
    const list = term ? index.filter((e) => e.text.includes(term)) : index.slice();
    list.sort((a, b) => (a[key] < b[key] ? -dir : a[key] > b[key] ? dir : 0));
    return list.map((e) => e.s);
  }, [index, term, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);

  const statCards = useMemo(() => [
    { label: 'Total subscriptions', value: fmt(stats.total), description: 'All merchant plans', icon: FiFileText, tone: 'em', percent: stats.total ? 100 : 0, color: '#34d399' },
    { label: 'Active plans', value: fmt(stats.active), description: 'Currently running', icon: FiCheckCircle, tone: 'teal', percent: pct(stats.active, stats.total), color: '#2dd4bf' },
    { label: 'Pending', value: fmt(stats.pending), description: 'Awaiting payment', icon: FiClock, tone: 'amber', percent: pct(stats.pending, stats.total), color: '#fbbf24' },
    { label: 'Pending cash', value: fmt(stats.cash), description: 'Needs admin review', icon: FiDollarSign, tone: 'lime', percent: pct(stats.cash, stats.total), color: '#a3e635' },
  ], [stats]);

  const counts = useMemo(() => ({ all: subs.length, cash: cash.length }), [subs, cash]);

  const handleSearch = useCallback((e) => { setSearch(sanitizeSearch(e.target.value)); setCurrentPage(1); }, []);
  const handleTab = useCallback((key) => { setTab(key); setSort({ field: 'name', dir: 'asc' }); setCurrentPage(1); }, []);
  const handleRows = useCallback((n) => { setRowsPerPage(n); setCurrentPage(1); }, []);
  const handleSort = useCallback((field) => { setSort((s) => nextSort(s, field)); setCurrentPage(1); }, []);
  const handleCopy = useCallback(async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ icon: 'success', title: 'Copied', text: 'Shop ID copied to clipboard.', timer: 2000 });
    } catch {
      toast({ icon: 'error', title: 'Could not copy', text: 'Allow clipboard access in your browser.' });
    }
  }, []);
  const closeModal = useCallback(() => { detailAbort.current?.abort(); setSelected(null); }, []);
  const refresh = useCallback(() => load(), [load]);

  const exportCSV = useCallback(() => {
    if (tab === 'cash') {
      downloadCSV(
        'cash_queue.csv',
        ['Payment ID', 'Shop', 'Email', 'Method', 'Status', 'Date', 'Notes', 'Amount'],
        filtered.map((s) => [s.paymentId, clean(s.shopName), clean(s.shopEmail), 'CASH', statusKey(s), fmtDate(s.createdAt), clean(s.details), s.amount]),
      );
    } else {
      downloadCSV(
        'subscriptions.csv',
        ['Subscription ID', 'Shop ID', 'Shop', 'Email', 'Months', 'Method', 'Status', 'Amount'],
        filtered.map((s) => [s.subscriptionId || s.id, s.shopId, clean(s.shopName), clean(s.shopEmail), s.months, s.paymentMethod, statusKey(s), s.amount]),
      );
    }
  }, [filtered, tab]);

  if (denied) return null;

  const hasData = rows.length > 0;

  return (
    <div
      style={NB_FONT_STYLE}
      className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen py-6 lg:pl-64 mt-16 text-left overflow-x-hidden`}
    >
      <style>{PAGE_CSS}</style>
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3 px-0.5">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />Billing</p>
            <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
              <UnderlinedTitle text="Subscriptions Console" />
            </h1>
            <p className="nb-muted mt-2 text-sm font-medium">Coordinate merchant access cycles and cash settlements</p>
          </div>
          <div className="flex items-center gap-2.5">
            {lastUpdated && <p className="nb-muted hidden sm:block text-[11px] font-bold">Last updated: {TIME_FMT.format(lastUpdated)}</p>}
            <button type="button" onClick={refresh} aria-label="Refresh" title="Refresh" className={`${BTN_MD} h-10 uppercase`}>
              <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} /> Refresh
            </button>
            <button type="button" onClick={exportCSV} disabled={!filtered.length} className={`${BTN_MD} h-10 uppercase`}>
              <FiDownload size={14} /> Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <section className="nb-card overflow-hidden">
          <div className="nb-line p-3 sm:p-4 flex flex-wrap items-center gap-2.5 border-b-2">
            <div className="nb-field relative flex h-10 min-w-[220px] flex-1 items-center gap-2 px-3">
              <FiSearch aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
              <input
                type="search"
                value={search}
                maxLength={SEARCH_MAX}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                aria-label="Search subscriptions"
                placeholder="Search by shop name, email or ID"
                onChange={handleSearch}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
              />
            </div>
            <RowsDropdown value={rowsPerPage} onChange={handleRows} />
          </div>

          <Tabs tabs={TABS} value={tab} onChange={handleTab} counts={counts} />

          <div className="overflow-auto max-h-[68vh] slim-scroll">
            <table className="w-full min-w-[820px] text-left border-collapse">
              <thead className="nb-gray sticky top-0 z-10 shadow-[0_2px_0_0_var(--nb-line)]">
                {tab === 'cash' ? (
                  <tr>
                    <SortTh label="Shop" field="name" sort={sort} onSort={handleSort} />
                    <SortTh label="Method" field="method" sort={sort} onSort={handleSort} />
                    <SortTh label="Date" field="date" sort={sort} onSort={handleSort} />
                    <PlainTh>Notes</PlainTh>
                    <SortTh label="Amount" field="amount" sort={sort} onSort={handleSort} />
                    <PlainTh>Actions</PlainTh>
                  </tr>
                ) : (
                  <tr>
                    <SortTh label="Shop" field="name" sort={sort} onSort={handleSort} />
                    <SortTh label="Shop ID" field="id" sort={sort} onSort={handleSort} />
                    <SortTh label="Duration" field="months" sort={sort} onSort={handleSort} />
                    <SortTh label="Method" field="method" sort={sort} onSort={handleSort} />
                    <SortTh label="Status" field="status" sort={sort} onSort={handleSort} />
                    <PlainTh>Actions</PlainTh>
                  </tr>
                )}
              </thead>
              <tbody className="nb-rows">
                {loading && !hasData ? (
                  Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {Array.from({ length: 6 }, (__, j) => (
                        <td key={j} className="px-3 py-4"><div className="nb-gray h-3.5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : error && !hasData ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14 text-center">
                      <FiAlertCircle size={28} className="mx-auto text-red-500" />
                      <p className="mt-2 text-sm font-extrabold uppercase">Couldn't load subscriptions</p>
                      <p className="nb-muted text-xs mb-4">Check your connection and try again.</p>
                      <button type="button" onClick={refresh} className={`${BTN_MD} nb-btn-a uppercase`}><FiRefreshCw size={13} /> Try again</button>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14">
                      <EmptyState3D
                        kind="box"
                        title={tab === 'cash' ? 'No cash payments waiting' : 'No subscriptions found'}
                        subtitle="The list is empty or nothing matches your search"
                        darkMode={darkMode}
                      />
                    </td>
                  </tr>
                ) : tab === 'cash' ? (
                  paginated.map((c) => (
                    <CashRow key={c.paymentId ?? c.id} item={c} busy={busyIds.has(String(c.paymentId))} onAct={requestCash} />
                  ))
                ) : (
                  paginated.map((s) => <SubRow key={s.id} sub={s} onView={viewSub} onCopy={handleCopy} />)
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="nb-gray nb-line px-4 py-3 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-semibold">
                Showing <b className="tabular-nums">{fmt(from)}–{fmt(to)}</b> of <b className="tabular-nums">{fmt(filtered.length)}</b> {tab === 'cash' ? 'payments' : 'subscriptions'}
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} />}
            </div>
          )}
        </section>
      </div>

      {selected && <SubscriptionModal sub={selected} onClose={closeModal} onCopy={handleCopy} />}

      {pending && (
        <CashConfirmModal
          pending={pending}
          busy={busyIds.has(String(pending.item.paymentId))}
          onClose={closeCash}
          onConfirm={runCash}
        />
      )}
    </div>
  );
};

export default memo(AdminSubscriptions);