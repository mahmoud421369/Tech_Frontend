import React, {
  useState, useEffect, useMemo, useCallback, useRef, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCreditCard, FiCopy, FiSearch, FiX, FiUser, FiDollarSign, FiClock, FiCheckCircle,
  FiXCircle, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiDownload,
  FiHash, FiRefreshCw, FiInfo, FiAlertCircle, FiFilter,
} from 'react-icons/fi';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../components/user/UiExtras';

const ROWS_OPTIONS = [5, 10, 20, 50];
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'COMPLETED', label: 'Settled' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'FAILED', label: 'Rejected' },
  { key: 'REFUNDED', label: 'Refunded' },
];
const STATUS_LABEL = { COMPLETED: 'Settled', PENDING: 'Pending', FAILED: 'Rejected', REFUNDED: 'Refunded' };
const REDUCED = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const STATUS_BG = { COMPLETED: '#34d399', PENDING: '#fbbf24', FAILED: '#fb7185', REFUNDED: '#c4b5fd' };
const STATUS_FALLBACK_BG = '#e8ebe9';

const METHOD_BG = {
  CASH: '#fbbf24',
  CARD: '#22d3ee',
  CREDIT_CARD: '#22d3ee',
  WALLET: '#c4b5fd',
};
const METHOD_FALLBACK_BG = '#34d399';

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
const PANEL = 'nb-gray nb-line border-2 border-dotted';

const TONE_BG = { em: '#34d399', teal: '#2dd4bf', lime: '#a3e635', cyan: '#22d3ee', amber: '#fbbf24', red: '#fb7185' };

const DATE_FMT = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });
const FULL_FMT = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });
const NUM_FMT = new Intl.NumberFormat('en-US');
const toTs = (v) => { const t = new Date(v).getTime(); return Number.isNaN(t) ? 0 : t; };
const fmtDate = (f, v) => { const t = toTs(v); return t ? f.format(t) : '—'; };

const num = (v) => Number(v) || 0;
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const money = (v) => `${NUM_FMT.format(num(v))} EGP`;
const statusOf = (t) => String(t.paymentStatus || t.status || '').toUpperCase();
const txDate = (t) => t.createdAt || t.paidAt;
const isSubscription = (t) => t.paymentType === 'SUBSCRIPTION_PAYMENT';
const accountOf = (t) => (isSubscription(t) ? { label: 'Shop', id: t.shopId, isUser: false } : { label: 'User', id: t.userId, isUser: true });

const CTRL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const clean = (v) => String(v ?? '').replace(CTRL, '');
const isSafeId = (id) => /^[A-Za-z0-9_-]{1,64}$/.test(String(id));
const shortId = (id) => clean(id).slice(0, 8) || '—';
const errText = (err) => String(err?.response?.data?.message || '').slice(0, 120) || undefined;
const isCanceled = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';
const methodOf = (t) => clean(t.paymentMethod).trim() || 'SYSTEM';
const methodLabel = (m) => m.replace(/_/g, ' ');

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
  const blob = new Blob([`\ufeff${text}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
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

const StatusPill = memo(({ status }) => (
  <span className="nb-chip" style={{ background: STATUS_BG[status] || STATUS_FALLBACK_BG, color: '#04261a' }}>
    <span className="w-1.5 h-1.5 bg-[#04261a]" aria-hidden="true" />
    {STATUS_LABEL[status] || status || 'Unset'}
  </span>
));

const MethodBadge = memo(({ method }) => {
  const bg = METHOD_BG[String(method).toUpperCase()];
  const isSystem = String(method).toUpperCase() === 'SYSTEM';
  return (
    <span
      className={`nb-chip ${isSystem ? 'nb-chip-n' : ''}`}
      style={!isSystem ? { background: bg || METHOD_FALLBACK_BG, color: '#04261a' } : undefined}
    >
      <FiCreditCard size={11} aria-hidden="true" />
      {methodLabel(method)}
    </span>
  );
});

const Tabs = memo(({ label, tabs, value, onChange, counts }) => (
  <div role="tablist" aria-label={label} className="nb-line flex gap-2 overflow-x-auto p-3 sm:px-4 border-b-2 [scrollbar-width:none]">
    {tabs.map(({ key, label: text }) => {
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
          {text}
          <span className="nb-chip tabular-nums">{NUM_FMT.format(counts[key] ?? 0)}</span>
        </button>
      );
    })}
  </div>
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

const TxRow = memo(({ tx, onDetails, onCopy, onFilterUser }) => {
  const acc = accountOf(tx);
  const accId = clean(acc.id);
  const method = methodOf(tx);
  const when = tx.paidAt || tx.createdAt;
  return (
    <tr className="transition-colors motion-reduce:transition-none">
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <IconTile icon={FiCreditCard} tone="em" className="w-9 h-9" size={16} />
          <span className="inline-flex items-center gap-1.5">
            <code className="text-xs font-mono font-bold">#{shortId(tx.id)}</code>
            <button type="button" title="Copy transaction ID" aria-label="Copy transaction ID" onClick={() => onCopy(tx.id, 'Transaction ID')} className="nb-muted hover:text-[var(--nb-accent)] transition-colors"><FiCopy size={12} /></button>
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <p className="nb-muted text-[10px] font-bold uppercase">{acc.label}</p>
        <span className="inline-flex items-center gap-1.5">
          <code className="text-[11px] font-mono font-bold max-w-[130px] truncate block" title={accId || undefined}>{accId || 'N/A'}</code>
          {accId && (
            <>
              <button type="button" title={`Copy ${acc.label.toLowerCase()} ID`} aria-label={`Copy ${acc.label.toLowerCase()} ID`} onClick={() => onCopy(acc.id, `${acc.label} ID`)} className="nb-muted hover:text-[var(--nb-accent)] transition-colors"><FiCopy size={12} /></button>
              {acc.isUser && (
                <button type="button" title="Show this user's transactions" aria-label="Show this user's transactions" onClick={() => onFilterUser(accId)} className="nb-muted hover:text-[var(--nb-accent)] transition-colors"><FiFilter size={12} /></button>
              )}
            </>
          )}
        </span>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap font-mono font-extrabold text-[13px] tabular-nums">
        {tx.amount !== undefined && tx.amount !== null ? money(tx.amount) : '—'}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap"><StatusPill status={statusOf(tx)} /></td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <p className="text-xs font-bold">{fmtDate(DATE_FMT, when)}</p>
        <p className="nb-muted text-[10px] font-semibold">{fmtDate(TIME_FMT, when)}</p>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <MethodBadge method={method} />
        <p className="nb-muted mt-1 text-[10px] font-semibold">{clean(tx.paymentType || tx.type) || 'N/A'}</p>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <button type="button" title="View details" aria-label="View details" onClick={() => onDetails(tx)} className={BTN_ICON}><FiInfo size={14} /></button>
      </td>
    </tr>
  );
});

const TransactionModal = memo(({ tx, onClose, onCopy, onFilterUser }) => {
  useEscape(onClose);
  const acc = accountOf(tx);
  const accId = clean(acc.id);
  const status = statusOf(tx);
  const rows = [
    { icon: FiHash, label: 'Transaction ID', value: clean(tx.id) || 'N/A', copy: tx.id, copyLabel: 'Transaction ID' },
    { icon: FiUser, label: `${acc.label} ID`, value: accId || 'N/A', copy: acc.id, copyLabel: `${acc.label} ID` },
    { icon: FiDollarSign, label: 'Amount', value: money(tx.amount) },
    { icon: FiCreditCard, label: 'Method', value: <MethodBadge method={methodOf(tx)} /> },
    { icon: FiClock, label: 'Date', value: fmtDate(FULL_FMT, tx.paidAt || tx.createdAt) },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Transaction details" className="nb-card relative w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden">
        <div className="nb-gray nb-line px-5 py-3.5 border-b-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <IconTile icon={FiCreditCard} tone="cyan" className="w-9 h-9" size={16} />
            <div>
              <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">Transaction details</span></h3>
              <p className="nb-muted mt-1 flex items-center gap-1.5 text-[10px] font-bold font-mono">
                #{shortId(tx.id)}
                <button type="button" aria-label="Copy transaction ID" onClick={() => onCopy(tx.id, 'Transaction ID')} className="hover:text-[var(--nb-accent)] transition-colors"><FiCopy size={10} /></button>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={BTN_ICON}><FiX size={15} /></button>
        </div>

        <div className="px-5 py-4 space-y-2.5 overflow-y-auto slim-scroll">
          <div className={`${PANEL} p-3 flex items-center justify-between`}>
            <div className="flex items-center gap-2.5">
              {status === 'COMPLETED' ? <FiCheckCircle size={15} className="nb-ic" /> : status === 'FAILED' ? <FiXCircle size={15} className="text-red-500" /> : <FiClock size={15} className="text-amber-500" />}
              <p className="nb-muted text-[9px] font-bold uppercase">Status</p>
            </div>
            <StatusPill status={status} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {rows.map(({ icon: Icon, label, value, copy, copyLabel }) => (
              <div key={label} className={`${PANEL} p-3 flex items-center gap-2.5`}>
                <Icon size={15} className="nb-ic flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="nb-muted text-[9px] font-bold uppercase">{label}</p>
                  <div className="text-xs font-extrabold truncate">{value}</div>
                </div>
                {copy && clean(copy) && (
                  <button type="button" aria-label={`Copy ${copyLabel}`} title={`Copy ${copyLabel}`} onClick={() => onCopy(copy, copyLabel)} className="nb-muted hover:text-[var(--nb-accent)] transition-colors flex-shrink-0"><FiCopy size={13} /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="nb-gray nb-line px-5 py-3.5 border-t-2 flex justify-end gap-2 flex-shrink-0">
          {acc.isUser && accId && (
            <button type="button" onClick={() => onFilterUser(accId)} className={`${BTN_MD} uppercase`}><FiFilter size={13} /> User's transactions</button>
          )}
          <button type="button" onClick={onClose} className={`${BTN_MD} uppercase`}>Close</button>
        </div>
      </div>
    </div>
  );
});

const TransactionsPage = () => {
  const navigate = useNavigate();
  const darkMode = useDarkMode();
  const tokenRef = useRef(localStorage.getItem('authToken'));
  const denied = useMemo(() => !tokenRef.current || isNotAdmin(tokenRef.current), []);
  const abortRef = useRef(null);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [activeUser, setActiveUser] = useState('');
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sort, setSort] = useState({ field: 'createdAt', dir: 'desc' });
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => { document.title = 'Admin - Transactions'; }, []);
  useEffect(() => { ensureNbFont(); }, []);

  useEffect(() => {
    if (!tokenRef.current) { navigate('/login', { replace: true }); return; }
    if (denied) { toast({ icon: 'error', title: 'Access denied', text: 'Admin accounts only.' }); navigate('/login', { replace: true }); }
  }, [navigate, denied]);

  const load = useCallback(async (userId = '', { silent = false } = {}) => {
    if (!tokenRef.current || denied) return;
    const id = userId.trim();
    if (id && !isSafeId(id)) {
      toast({ icon: 'warning', title: 'Invalid user ID', text: 'Use letters, numbers, - and _ only.' });
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (!silent) setLoading(true);
    setError(false);
    try {
      const url = id ? `/api/admin/transactions/${encodeURIComponent(id)}` : '/api/admin/transactions/all';
      const { data } = await api.get(url, { headers: { Authorization: `Bearer ${tokenRef.current}` }, signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      setTransactions(Array.isArray(data) ? data : data?.content || []);
      setActiveUser(id);
      setCurrentPage(1);
      setLastUpdated(new Date());
    } catch (err) {
      if (ctrl.signal.aborted || isCanceled(err)) return;
      const status = err?.response?.status;
      if (status === 401) navigate('/login', { replace: true });
      else if (status === 403) { toast({ icon: 'error', title: 'Access denied', text: 'Admin accounts only.' }); navigate('/login', { replace: true }); }
      else if (id && status === 404) {
        toast({ icon: 'info', title: 'User not found', text: 'No transactions exist for this user.' });
        setTransactions([]);
        setActiveUser(id);
        setCurrentPage(1);
      } else {
        setError(true);
        toast({ icon: 'error', title: 'Failed to load transactions', text: errText(err) });
      }
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [navigate, denied]);

  useEffect(() => {
    load('');
    return () => abortRef.current?.abort();
  }, [load]);

  const applyFilter = useCallback(() => load(userInput), [load, userInput]);
  const resetFilter = useCallback(() => { setUserInput(''); load(''); }, [load]);
  const refresh = useCallback(() => load(activeUser), [load, activeUser]);

  const filterByUser = useCallback((id) => {
    const safe = String(id ?? '').trim();
    if (!isSafeId(safe)) return;
    setUserInput(safe);
    setSelectedTx(null);
    load(safe);
  }, [load]);

  const index = useMemo(() => transactions.map((t) => ({
    t,
    status: statusOf(t),
    amount: num(t.amount),
    ts: toTs(txDate(t)),
  })), [transactions]);

  const stats = useMemo(() => {
    const counts = { all: index.length, COMPLETED: 0, PENDING: 0, FAILED: 0, REFUNDED: 0 };
    let volume = 0;
    for (const e of index) { if (e.status in counts) counts[e.status] += 1; volume += e.amount; }
    return { counts, volume };
  }, [index]);

  const filtered = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    const list = index.filter((e) => tab === 'all' || e.status === tab);
    list.sort((a, b) => {
      if (sort.field === 'amount') return (a.amount - b.amount) * dir;
      if (sort.field === 'status') return a.status < b.status ? -dir : a.status > b.status ? dir : 0;
      return (a.ts - b.ts) * dir;
    });
    return list.map((e) => e.t);
  }, [index, tab, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);

  const statCards = useMemo(() => {
    const { counts, volume } = stats;
    return [
      { label: 'Total volume', value: money(volume), description: 'Across all loaded records', icon: FiDollarSign, tone: 'cyan', percent: counts.all ? 100 : 0, color: '#22d3ee' },
      { label: 'Settled', value: NUM_FMT.format(counts.COMPLETED), description: 'Completed payments', icon: FiCheckCircle, tone: 'em', percent: pct(counts.COMPLETED, counts.all), color: '#34d399' },
      { label: 'Pending', value: NUM_FMT.format(counts.PENDING), description: 'Awaiting settlement', icon: FiClock, tone: 'amber', percent: pct(counts.PENDING, counts.all), color: '#fbbf24' },
      { label: 'Rejected', value: NUM_FMT.format(counts.FAILED), description: 'Failed payments', icon: FiXCircle, tone: 'red', percent: pct(counts.FAILED, counts.all), color: '#fb7185' },
    ];
  }, [stats]);

  const handleTab = useCallback((k) => { setTab(k); setCurrentPage(1); }, []);
  const handleRows = useCallback((n) => { setRowsPerPage(n); setCurrentPage(1); }, []);
  const handleSort = useCallback((field) => {
    setSort((s) => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'desc' }));
    setCurrentPage(1);
  }, []);
  const handleCopy = useCallback(async (id, label = 'Transaction ID') => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ icon: 'success', title: 'Copied', text: `${label} copied to clipboard.`, timer: 2000 });
    } catch {
      toast({ icon: 'error', title: 'Could not copy', text: 'Allow clipboard access in your browser.' });
    }
  }, []);
  const handleDetails = useCallback((t) => setSelectedTx(t), []);
  const closeDetails = useCallback(() => setSelectedTx(null), []);

  const exportCSV = useCallback(() => {
    downloadCSV(
      'financial_registry.csv',
      ['Transaction ID', 'User/Shop ID', 'Amount', 'Status', 'Date', 'Method', 'Type'],
      transactions.map((t) => [
        t.id, accountOf(t).id, num(t.amount).toFixed(2), statusOf(t),
        txDate(t) ? fmtDate(FULL_FMT, txDate(t)) : '', t.paymentMethod || '', t.paymentType || t.type || '',
      ]),
    );
  }, [transactions]);

  if (denied) return null;

  const hasData = transactions.length > 0;

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
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />Payments</p>
            <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
              <UnderlinedTitle text="Financial Transactions" />
            </h1>
            <p className="nb-muted mt-2 text-sm font-medium">Monitor platform cash flow and payment settlement status</p>
          </div>
          <div className="flex items-center gap-2.5">
            {lastUpdated && <p className="nb-muted hidden sm:block text-[11px] font-bold">Last updated: {TIME_FMT.format(lastUpdated)}</p>}
            <button type="button" onClick={refresh} aria-label="Refresh" title="Refresh" className={`${BTN_MD} h-10 uppercase`}>
              <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} /> Refresh
            </button>
            <button type="button" onClick={exportCSV} disabled={!hasData} className={`${BTN_MD} h-10 uppercase`}>
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
                value={userInput}
                maxLength={64}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                aria-label="Filter by user ID"
                placeholder="Filter by user ID"
                onChange={(e) => setUserInput(e.target.value.replace(/[^A-Za-z0-9_-]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
              />
            </div>
            <button type="button" onClick={applyFilter} className={`${BTN_MD} nb-btn-a h-10 uppercase`}>Filter</button>
            {(activeUser || userInput) && <button type="button" onClick={resetFilter} className={`${BTN_MD} h-10 uppercase`}><FiX size={13} /> Reset</button>}
            <RowsDropdown value={rowsPerPage} onChange={handleRows} />
          </div>

          {activeUser && (
            <p className="nb-gray nb-line px-4 py-2 text-[11px] font-bold border-b-2 flex items-center gap-2">
              <span>Showing transactions for user <b className="font-mono">{activeUser}</b></span>
              <button type="button" title="Copy user ID" aria-label="Copy user ID" onClick={() => handleCopy(activeUser, 'User ID')} className="hover:text-[var(--nb-accent)] transition-colors"><FiCopy size={12} /></button>
            </p>
          )}

          <Tabs label="Payment status" tabs={TABS} value={tab} onChange={handleTab} counts={stats.counts} />

          <div className="overflow-auto max-h-[68vh] slim-scroll">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead className="nb-gray sticky top-0 z-10 shadow-[0_2px_0_0_var(--nb-line)]">
                <tr>
                  <PlainTh>Transaction</PlainTh>
                  <PlainTh>Account</PlainTh>
                  <SortTh label="Amount" field="amount" sort={sort} onSort={handleSort} />
                  <SortTh label="Status" field="status" sort={sort} onSort={handleSort} />
                  <SortTh label="Date" field="createdAt" sort={sort} onSort={handleSort} />
                  <PlainTh>Method</PlainTh>
                  <PlainTh>Details</PlainTh>
                </tr>
              </thead>
              <tbody className="nb-rows">
                {loading && !hasData ? (
                  Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {Array.from({ length: 7 }, (__, j) => (
                        <td key={j} className="px-3 py-4"><div className="nb-gray h-3.5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : error && !hasData ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <FiAlertCircle size={28} className="mx-auto text-red-500" />
                      <p className="mt-2 text-sm font-extrabold uppercase">Couldn't load transactions</p>
                      <p className="nb-muted text-xs mb-4">Check your connection and try again.</p>
                      <button type="button" onClick={refresh} className={`${BTN_MD} nb-btn-a uppercase`}><FiRefreshCw size={13} /> Try again</button>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14">
                      <EmptyState3D kind="box" title="No transactions found" subtitle="The ledger is empty or nothing matches your filters" darkMode={darkMode} />
                    </td>
                  </tr>
                ) : (
                  paginated.map((t, i) => (
                    <TxRow key={t.id ?? `row-${i}`} tx={t} onDetails={handleDetails} onCopy={handleCopy} onFilterUser={filterByUser} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="nb-gray nb-line px-4 py-3 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-semibold">
                Showing <b className="tabular-nums">{NUM_FMT.format(from)}–{NUM_FMT.format(to)}</b> of <b className="tabular-nums">{NUM_FMT.format(filtered.length)}</b> records
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} />}
            </div>
          )}
        </section>
      </div>

      {selectedTx && <TransactionModal tx={selectedTx} onClose={closeDetails} onCopy={handleCopy} onFilterUser={filterByUser} />}
    </div>
  );
};

export default memo(TransactionsPage);