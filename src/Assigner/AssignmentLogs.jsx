import React, {
  useState, useEffect, useCallback, useMemo, useRef, useDeferredValue, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiX, FiCopy, FiInfo, FiMapPin, FiPhone, FiClock, FiUser, FiShoppingBag, FiClipboard,
  FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight, FiRefreshCw, FiAlertCircle,
  FiCheck, FiPackage, FiTool, FiUserCheck, FiTruck, FiNavigation,
} from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../components/user/UiExtras';

const DOC_TITLE = 'Assigner - Assignment Logs | Tech Restore';
const ENDPOINT = '/api/assigner/assignment-log';
const ROWS_OPTIONS = [10, 25, 50, 100];
const SEARCH_MAX = 60;
const POLL_MS = 60_000;
const REDUCED = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'ORDER', label: 'Orders' },
  { key: 'REPAIR', label: 'Repairs' },
];
const SORT_KEY = { date: 'date', type: 'type', user: 'user', shop: 'shop', assigner: 'assigner', status: 'status' };
const TONE_BG = {
  em: '#34d399', teal: '#2dd4bf', lime: '#a3e635', cyan: '#22d3ee',
  amber: '#fbbf24', blue: '#60a5fa', violet: '#a78bfa', gray: '#d1d5db',
};
const TYPE_META = {
  ORDER: { tone: 'blue', label: 'Order' },
  REPAIR: { tone: 'violet', label: 'Repair' },
};
const UNKNOWN_META = { tone: 'gray', label: 'Unknown' };

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
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
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
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-opt{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:start;cursor:pointer}
.nb-opt:hover{background:var(--nb-gray)}
.nb-opt[aria-selected=true]{background:var(--nb-btn);color:var(--nb-on)}
.nb-rows>tr+tr{border-top:2px dotted var(--nb-dot)}
.nb-rows>tr:hover{background:var(--nb-gray)}
.nb-rows>tr.nb-done{box-shadow:inset 4px 0 0 0 var(--nb-accent)}
@keyframes drawer-in{from{transform:translateX(100%)}to{transform:none}}
.drawer-in{animation:drawer-in .22s ease-out}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn{transition:none}.drawer-in{animation:none}}
`;

const SCROLL_CSS = `
  .slim-scroll { scrollbar-width: thin; scrollbar-color: rgba(52,211,153,.6) transparent; }
  .slim-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .slim-scroll::-webkit-scrollbar-track { background: transparent; }
  .slim-scroll::-webkit-scrollbar-thumb { background: rgba(52,211,153,.55); }
  .slim-scroll::-webkit-scrollbar-thumb:hover { background: #34d399; }
`;

const PAGE_CSS = UI3D_CSS + EXTRAS_CSS + NB_CSS + SCROLL_CSS;
const STYLE_HTML = { __html: PAGE_CSS };

const BTN_MD = 'nb-btn px-3 py-2 text-xs';
const BTN_ICON = 'nb-btn w-8 h-8';
const PANEL = 'nb-gray nb-line border-2 border-dotted';

const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });
const DAY_FMT = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' });
const CLOCK_FMT = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const FULL_FMT = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
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
const sanitizeSearch = (v) => clean(v).replace(/[<>]/g, '').replace(/\s{2,}/g, ' ').slice(0, SEARCH_MAX);
const errText = (err) => String(err?.response?.data?.message || '').slice(0, 120) || undefined;
const asList = (res) => { const d = res?.data; return Array.isArray(d) ? d : d?.content || []; };
const shortId = (id) => clean(id).slice(-8).toUpperCase();
const num = (v) => INT_FMT.format(v);
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const refOf = (l) => (l.assignmentType === 'ORDER' ? l.orderId : l.repairRequestId) || l.id;
const statusLabel = (s) => clean(s).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const validDate = (v) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d : null; };
const fmtFull = (v) => { const d = validDate(v); return d ? FULL_FMT.format(d) : '—'; };
const phoneHref = (p) => {
  const digits = String(p ?? '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
};
const mapsUrl = (a) => {
  const q = [txt(a?.street), txt(a?.city), txt(a?.state)].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
};
const addrLine = (a) => (a ? [a.building, a.street, a.city, a.state].map(txt).filter(Boolean).join(', ') : '') || '';

const pageList = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [...new Set([1, total, cur - 1, cur, cur + 1])].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  pages.forEach((p, i) => { if (i && p - pages[i - 1] > 1) out.push(`gap${p}`); out.push(p); });
  return out;
};

const nextSort = (s, field, first = 'asc') =>
  (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: first });

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
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums">
        {percent}%
      </span>
    </div>
  );
});

const StatCard = memo(({ label, value, description, icon, tone, percent, color }) => (
  <div className="nb-card nb-lift p-4 sm:p-5 flex items-center justify-between gap-3 min-w-0">
    <div className="min-w-0 flex-1 text-start">
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

const RowsDropdown = memo(({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
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
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label="Logs per page" className={`${BTN_MD} h-10 min-w-[120px] justify-between uppercase`}>
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
          aria-label={`Go to page ${p}`}
          aria-current={p === page ? 'page' : undefined}
          className={`nb-btn w-8 h-8 text-xs tabular-nums ${p === page ? 'nb-btn-on' : ''}`}
        >
          {p}
        </button>
      )))}
    <button type="button" className={BTN_ICON} onClick={() => onChange(page + 1)} disabled={page >= total} aria-label="Next page"><FiChevronRight size={16} /></button>
  </nav>
));

const InfoRow = memo(({ icon: Icon, label, value, ltr, href }) => (
  <div className={`${PANEL} p-3 flex items-center gap-2.5`}>
    <Icon size={15} className="nb-ic flex-shrink-0" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="nb-muted text-[9px] font-bold uppercase">{label}</p>
      <p dir={ltr ? 'ltr' : undefined} className="text-xs font-extrabold break-words">{value || '—'}</p>
    </div>
    {href && (
      <a
        href={href}
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        aria-label={`Open ${label}`}
        className={`${BTN_ICON} flex-shrink-0`}
      >
        {href.startsWith('tel:') ? <FiPhone size={14} aria-hidden="true" /> : <FiNavigation size={14} aria-hidden="true" />}
      </a>
    )}
  </div>
));

const Row = memo(({ log, onOpen, onCopy }) => {
  const meta = TYPE_META[log.assignmentType] || UNKNOWN_META;
  const name = txt(log.userName) || 'Not specified';
  const ref = refOf(log);
  const d = validDate(log.createdAt);
  const done = log.status === 'COMPLETED';
  return (
    <tr className={`transition-colors motion-reduce:transition-none ${done ? 'nb-done' : ''}`}>
      <td className="px-3 py-2.5 whitespace-nowrap">
        {d ? (
          <div className="leading-tight">
            <p className="text-xs font-extrabold">{DAY_FMT.format(d)}</p>
            <p className="nb-muted text-[10px] font-bold font-mono">{CLOCK_FMT.format(d)}</p>
          </div>
        ) : <span className="nb-muted text-xs">—</span>}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap"><Pill tone={meta.tone}>{meta.label}</Pill></td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5">
          <code className="text-[11px] font-mono font-bold">#{shortId(ref)}</code>
          <button type="button" title="Copy ID" aria-label={`Copy ID ${shortId(ref)}`} onClick={() => onCopy(ref)} className="nb-muted hover:text-[var(--nb-accent)] transition-colors">
            <FiCopy size={12} aria-hidden="true" />
          </button>
        </span>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <span className="nb-tile w-9 h-9 text-sm font-extrabold uppercase" style={{ background: TONE_BG.em }}>
            {name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase truncate max-w-[170px]">{name}</p>
            <p dir="ltr" className="nb-muted text-[10px] font-semibold truncate max-w-[170px]">{txt(log.userPhone) || 'No phone'}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <p className="flex items-center gap-1.5 text-xs font-extrabold">
          <FiShoppingBag size={12} className="nb-ic flex-shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[150px]">{txt(log.shopName) || 'Not specified'}</span>
        </p>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap text-xs font-bold">
        <span className="block truncate max-w-[140px]">{txt(log.assignerName) || 'System'}</span>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <Pill tone={done ? 'em' : 'amber'}>{log.status ? statusLabel(log.status) : 'Assigned'}</Pill>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <button
          type="button"
          title="View details"
          aria-label={`View details for log ${shortId(ref)}`}
          onClick={() => onOpen(log)}
          className={BTN_ICON}
        >
          <FiInfo size={14} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
});

const Drawer = memo(({ log, onClose, onCopy }) => {
  const closeRef = useRef(null);
  const meta = TYPE_META[log.assignmentType] || UNKNOWN_META;
  const ref = refOf(log);
  const userAddr = addrLine(log.userAddress);
  const shopAddr = addrLine(log.shopAddress);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label="Assignment details" className="nb-card drawer-in absolute right-0 top-0 bottom-0 w-full max-w-md flex flex-col">
        <div className="nb-gray nb-line flex items-center justify-between gap-3 px-5 h-16 border-b-2 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <IconTile icon={FiClipboard} tone="cyan" className="w-9 h-9" size={16} />
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold uppercase truncate"><span className="nb-ul">Assignment details</span></h2>
              <p className="nb-muted mt-1 flex items-center gap-1.5 text-[10px] font-bold font-mono">
                #{shortId(ref)}
                <button type="button" aria-label="Copy ID" onClick={() => onCopy(ref)} className="hover:text-[var(--nb-accent)] transition-colors"><FiCopy size={10} aria-hidden="true" /></button>
              </p>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className={BTN_ICON}>
            <FiX size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto slim-scroll px-5 py-4 space-y-2.5">
          <div className="flex items-center justify-between gap-3 pb-1">
            <Pill tone={meta.tone}>{meta.label}</Pill>
            {log.status && <Pill tone={log.status === 'COMPLETED' ? 'em' : 'amber'}>{statusLabel(log.status)}</Pill>}
          </div>
          <InfoRow icon={FiUserCheck} label="Assigned by" value={txt(log.assignerName) || 'System'} />
          <InfoRow icon={FiUser} label="Customer" value={txt(log.userName) || 'N/A'} />
          <InfoRow icon={FiPhone} label="Customer phone" value={txt(log.userPhone) || 'N/A'} ltr href={phoneHref(log.userPhone)} />
          <InfoRow icon={FiMapPin} label="Customer address" value={userAddr || 'N/A'} href={mapsUrl(log.userAddress)} />
          <InfoRow icon={FiShoppingBag} label="Shop" value={txt(log.shopName) || 'N/A'} />
          <InfoRow icon={FiPhone} label="Shop phone" value={txt(log.shopPhone) || 'N/A'} ltr href={phoneHref(log.shopPhone)} />
          <InfoRow icon={FiMapPin} label="Shop address" value={shopAddr || 'N/A'} href={mapsUrl(log.shopAddress)} />
          {log.deliveryId && <InfoRow icon={FiTruck} label="Delivery agent" value={`#${shortId(log.deliveryId)}`} />}
          <InfoRow icon={FiClock} label="Recorded on" value={fmtFull(log.createdAt)} />
        </div>

        <div className="nb-gray nb-line px-5 py-3.5 border-t-2 flex justify-end flex-shrink-0">
          <button type="button" onClick={onClose} className={`${BTN_MD} uppercase`}>Close</button>
        </div>
      </aside>
    </div>
  );
});

const COLS = 8;

const AssignmentLogs = () => {
  const navigate = useNavigate();
  const darkMode = useDarkMode();
  const tokenRef = useRef(localStorage.getItem('authToken'));
  const denied = useMemo(
    () => !tokenRef.current || isTokenExpired(tokenRef.current) || isNotAssigner(tokenRef.current),
    []
  );

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_OPTIONS[0]);
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' });
  const [selected, setSelected] = useState(null);

  const abortRef = useRef(null);
  const term = useDeferredValue(search).trim().toLowerCase();

  useEffect(() => { document.title = DOC_TITLE; }, []);
  useEffect(() => { ensureNbFont(); }, []);

  useEffect(() => {
    if (!denied) return;
    const token = tokenRef.current;
    if (token && !isTokenExpired(token)) toast({ icon: 'error', title: 'Access denied', text: 'Assigner accounts only.' });
    else localStorage.clear();
    navigate('/login', { replace: true });
  }, [denied, navigate]);

  const fetchLogs = useCallback(async ({ silent = false } = {}) => {
    if (denied) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (!silent) setLoading(true);
    setError(false);
    try {
      const res = await api.get(ENDPOINT, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted) return;
      setLogs(asList(res));
      setLastUpdated(new Date());
    } catch (err) {
      if (ctrl.signal.aborted || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
      const status = err?.response?.status;
      if (status === 401) { localStorage.clear(); navigate('/login', { replace: true }); return; }
      if (status === 403) { toast({ icon: 'error', title: 'Access denied', text: 'Assigner accounts only.' }); navigate('/login', { replace: true }); return; }
      if (!silent) {
        setError(true);
        toast({ icon: 'error', title: 'Failed to load logs', text: errText(err) || (status === 404 ? 'Assignment log is unavailable' : undefined) });
      }
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [denied, navigate]);

  useEffect(() => {
    fetchLogs();
    return () => abortRef.current?.abort();
  }, [fetchLogs]);

  useEffect(() => {
    if (denied) return undefined;
    const id = setInterval(() => { if (!document.hidden) fetchLogs({ silent: true }); }, POLL_MS);
    return () => clearInterval(id);
  }, [denied, fetchLogs]);

  const handleCopy = useCallback(async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ icon: 'success', title: 'Copied', text: 'ID copied to clipboard.', timer: 2000 });
    } catch {
      toast({ icon: 'error', title: 'Could not copy', text: 'Allow clipboard access in your browser.' });
    }
  }, []);

  const index = useMemo(() => logs.map((l, n) => {
    const user = String(l.userName || '').toLowerCase();
    const shop = String(l.shopName || '').toLowerCase();
    const assigner = String(l.assignerName || '').toLowerCase();
    const status = String(l.status || '').toLowerCase();
    return {
      l,
      key: l.id ?? `${refOf(l)}-${n}`,
      user, shop, assigner, status,
      type: String(l.assignmentType || ''),
      date: Date.parse(l.createdAt) || 0,
      text: `${String(refOf(l) ?? '').toLowerCase()} ${user} ${shop} ${assigner} ${status.replace(/_/g, ' ')} ${String(l.deliveryId || '').toLowerCase()} ${String(l.userPhone || '').toLowerCase()}`,
    };
  }), [logs]);

  const stats = useMemo(() => {
    let orders = 0; let repairs = 0; let done = 0;
    for (const l of logs) {
      if (l.assignmentType === 'ORDER') orders += 1;
      else if (l.assignmentType === 'REPAIR') repairs += 1;
      if (l.status === 'COMPLETED') done += 1;
    }
    return { all: logs.length, ORDER: orders, REPAIR: repairs, completed: done };
  }, [logs]);

  const tabCounts = useMemo(() => ({ all: stats.all, ORDER: stats.ORDER, REPAIR: stats.REPAIR }), [stats]);

  const filtered = useMemo(() => {
    const key = SORT_KEY[sort.field] || 'date';
    const dir = sort.dir === 'asc' ? 1 : -1;
    const list = index.filter((e) => (tab === 'all' || e.type === tab) && (!term || e.text.includes(term)));
    list.sort((a, b) => (a[key] < b[key] ? -dir : a[key] > b[key] ? dir : 0));
    return list;
  }, [index, tab, term, sort]);

  useEffect(() => { setCurrentPage(1); }, [tab, term, rowsPerPage, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);

  const statCards = useMemo(() => [
    { label: 'Total logs', value: num(stats.all), description: 'Every assignment', icon: FiClipboard, tone: 'em', percent: stats.all ? 100 : 0, color: TONE_BG.em },
    { label: 'Orders', value: num(stats.ORDER), description: 'Order assignments', icon: FiPackage, tone: 'teal', percent: pct(stats.ORDER, stats.all), color: TONE_BG.teal },
    { label: 'Repairs', value: num(stats.REPAIR), description: 'Repair assignments', icon: FiTool, tone: 'lime', percent: pct(stats.REPAIR, stats.all), color: TONE_BG.lime },
    { label: 'Completed', value: num(stats.completed), description: 'Finished tasks', icon: FiCheck, tone: 'cyan', percent: pct(stats.completed, stats.all), color: TONE_BG.cyan },
  ], [stats]);

  const handleSort = useCallback((field) => setSort((s) => nextSort(s, field, field === 'date' ? 'desc' : 'asc')), []);
  const openLog = useCallback((l) => setSelected(l), []);
  const closeLog = useCallback(() => setSelected(null), []);
  const refresh = useCallback(() => fetchLogs(), [fetchLogs]);
  const clearSearch = useCallback(() => setSearch(''), []);
  const handleSearchChange = useCallback((e) => setSearch(sanitizeSearch(e.target.value)), []);
  const goToPage = useCallback((p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  }, []);

  if (denied) return null;

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
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />Assignments</p>
            <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
              <UnderlinedTitle text="Assignment Logs" />
            </h1>
            <p className="nb-muted mt-2 text-sm font-medium">Review every assignment you have made</p>
          </div>
          <div className="flex items-center gap-2.5">
            {lastUpdated && <p className="nb-muted hidden sm:block text-[11px] font-bold">Last updated: {TIME_FMT.format(lastUpdated)}</p>}
            <button type="button" onClick={refresh} aria-label="Refresh logs" title="Refresh" className={`${BTN_MD} h-10 uppercase`}>
              <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" /> Refresh
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
              <label htmlFor="log-search" className="sr-only">Search logs</label>
              <input
                id="log-search"
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                spellCheck={false}
                maxLength={SEARCH_MAX}
                value={search}
                onChange={handleSearchChange}
                placeholder="Search ID, customer, phone, shop or assigner"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
              />
              {search && (
                <button type="button" onClick={clearSearch} aria-label="Clear search" className="flex-shrink-0 nb-muted hover:text-[var(--nb-accent)]">
                  <FiX size={15} aria-hidden="true" />
                </button>
              )}
            </div>
            <RowsDropdown value={rowsPerPage} onChange={setRowsPerPage} />
          </div>

          <div role="tablist" aria-label="Assignment type" className="nb-line flex gap-2 overflow-x-auto p-3 sm:px-4 border-b-2 [scrollbar-width:none]">
            {TABS.map(({ key, label }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(key)}
                  className={`nb-btn flex-shrink-0 px-3 py-1.5 text-xs uppercase ${active ? 'nb-btn-on' : ''}`}
                >
                  {label}
                  <span className="nb-chip tabular-nums">{num(tabCounts[key] || 0)}</span>
                </button>
              );
            })}
          </div>

          <div className="overflow-auto max-h-[68vh] slim-scroll">
            <table className="w-full min-w-[980px] text-start border-collapse">
              <thead className="nb-gray sticky top-0 z-10 shadow-[0_2px_0_0_var(--nb-line)]">
                <tr>
                  <SortTh label="Date" field="date" sort={sort} onSort={handleSort} />
                  <SortTh label="Type" field="type" sort={sort} onSort={handleSort} />
                  <th scope="col" className="px-3 py-3 text-start text-[11px] font-extrabold uppercase">ID</th>
                  <SortTh label="Customer" field="user" sort={sort} onSort={handleSort} />
                  <SortTh label="Shop" field="shop" sort={sort} onSort={handleSort} />
                  <SortTh label="Assigned by" field="assigner" sort={sort} onSort={handleSort} />
                  <SortTh label="Status" field="status" sort={sort} onSort={handleSort} />
                  <th scope="col" className="px-3 py-3 text-start text-[11px] font-extrabold uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="nb-rows">
                {loading && logs.length === 0 ? (
                  Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {Array.from({ length: COLS }, (__, j) => (
                        <td key={j} className="px-3 py-4"><div className="nb-gray h-3.5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : error && logs.length === 0 ? (
                  <tr>
                    <td colSpan={COLS} className="px-6 py-14 text-center">
                      <FiAlertCircle size={28} className="mx-auto text-red-500" />
                      <p className="mt-2 text-sm font-extrabold uppercase">Couldn't load the logs</p>
                      <p className="nb-muted text-xs mb-4">Check your connection and try again.</p>
                      <button type="button" onClick={refresh} className={`${BTN_MD} nb-btn-a uppercase`}><FiRefreshCw size={13} /> Try again</button>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={COLS} className="px-6 py-14">
                      <EmptyState3D
                        kind="box"
                        title={logs.length === 0 ? 'No logs yet' : 'No matching logs'}
                        subtitle={logs.length === 0 ? 'Assignments you make will be recorded here' : 'Try a different ID, customer, phone, shop or assigner, or switch tab'}
                        darkMode={darkMode}
                      />
                    </td>
                  </tr>
                ) : (
                  paginated.map((e) => <Row key={e.key} log={e.l} onOpen={openLog} onCopy={handleCopy} />)
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="nb-gray nb-line px-4 py-3 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-semibold">
                Showing <b className="tabular-nums">{num(from)}–{num(to)}</b> of <b className="tabular-nums">{num(filtered.length)}</b> logs
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={goToPage} />}
            </div>
          )}
        </section>
      </div>

      {selected && <Drawer log={selected} onClose={closeLog} onCopy={handleCopy} />}
    </div>
  );
};

export default memo(AssignmentLogs);