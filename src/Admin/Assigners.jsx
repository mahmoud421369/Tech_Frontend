import React, {
  useState, useEffect, useMemo, useCallback, useRef, useDeferredValue, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiX, FiCopy, FiTrash2, FiInfo, FiUsers, FiUser, FiMail, FiPhone, FiCalendar,
  FiPackage, FiClock, FiUserCheck, FiUserX,
  FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown, FiDownload, FiRefreshCw,
  FiAlertCircle,
} from 'react-icons/fi';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../components/user/UiExtras';

const ROWS_OPTIONS = [5, 10, 20, 50];
const SEARCH_MAX = 60;
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'suspended', label: 'Suspended' },
];
const REDUCED = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const STATUS_META = {
  APPROVED: { label: 'Approved', bg: '#34d399' },
  PENDING: { label: 'Pending', bg: '#fbbf24' },
  SUSPENDED: { label: 'Suspended', bg: '#fb7185' },
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
const PANEL = 'nb-gray nb-line border-2 border-dotted';

const TONE_BG = { em: '#34d399', teal: '#2dd4bf', lime: '#a3e635', cyan: '#22d3ee', amber: '#fbbf24', red: '#fb7185' };

const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });
const DATETIME_FMT = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const NUM_FMT = new Intl.NumberFormat('en-US');

const fmtDateTime = (d) => {
  if (!d) return 'N/A';
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? 'N/A' : DATETIME_FMT.format(t);
};

const CTRL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const clean = (v) => String(v ?? '').replace(CTRL, '');
const sanitizeSearch = (v) => clean(v).replace(/[<>]/g, '').replace(/\s{2,}/g, ' ').slice(0, SEARCH_MAX);
const isSafeId = (id) => /^[A-Za-z0-9_-]{1,64}$/.test(String(id));
const isCanceled = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const statusOf = (a) => clean(a.status || 'PENDING').toUpperCase();
const errText = (err) => String(err?.response?.data?.message || '').slice(0, 120) || undefined;

const deleteErrText = (err) => {
  const status = err?.response?.status;
  const server = errText(err);
  if (status === 409) return server || 'This assigner has linked records. Suspend the account instead.';
  if (status === 403) return server || 'You are not allowed to delete this account.';
  if (status === 404) return server || 'This assigner no longer exists. Refresh the list.';
  if (status >= 500) return server || 'The server could not delete this assigner.';
  if (!err?.response) return 'Network error. Check your connection and try again.';
  return server || 'Something went wrong. Try again.';
};

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

const StatusPill = memo(({ status }) => {
  const m = STATUS_META[status] || STATUS_META.PENDING;
  return (
    <span className="nb-chip" style={{ background: m.bg, color: '#04261a' }}>
      <span className="w-1.5 h-1.5 bg-[#04261a]" aria-hidden="true" />
      {m.label}
    </span>
  );
});

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

const AssignerRow = memo(({ assigner: a, busy, onView, onCopy, onApprove, onSuspend, onDelete }) => {
  const name = clean(a.name) || 'Unnamed assigner';
  const status = statusOf(a);
  return (
    <tr className="transition-colors motion-reduce:transition-none">
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <span className="nb-tile w-9 h-9 text-sm font-extrabold uppercase" style={{ background: TONE_BG.em }}>
            {name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase truncate max-w-[220px]">{name}</p>
            <p className="nb-muted text-[10px] font-semibold truncate max-w-[220px]">{clean(a.email) || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5">
          <code className="text-[11px] font-mono font-bold max-w-[110px] truncate block">{clean(a.id)}</code>
          <button type="button" title="Copy assigner ID" aria-label="Copy assigner ID" onClick={() => onCopy(a.id)} className="nb-muted hover:text-[var(--nb-accent)] transition-colors"><FiCopy size={12} /></button>
        </span>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap"><StatusPill status={status} /></td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className="nb-chip tabular-nums" style={{ background: TONE_BG.cyan, color: '#04261a' }}>
          <FiPackage size={11} aria-hidden="true" />
          {NUM_FMT.format(num(a.totalAssignmentsHandled))} assignments
        </span>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <button type="button" title="View details" aria-label="View details" onClick={() => onView(a)} className={BTN_ICON}><FiInfo size={14} /></button>
          {status !== 'APPROVED' && (
            <button type="button" disabled={busy} title="Approve assigner" aria-label="Approve assigner" onClick={() => onApprove(a)} className={`${BTN_ICON} !text-emerald-700 dark:!text-emerald-300`}><FiUserCheck size={14} /></button>
          )}
          {status !== 'SUSPENDED' && (
            <button type="button" disabled={busy} title="Suspend assigner" aria-label="Suspend assigner" onClick={() => onSuspend(a)} className={`${BTN_ICON} !text-amber-600 dark:!text-amber-300`}><FiUserX size={14} /></button>
          )}
          <button type="button" disabled={busy} title="Delete assigner" aria-label="Delete assigner" onClick={() => onDelete(a)} className={`${BTN_ICON} !text-red-600 dark:!text-red-300`}><FiTrash2 size={14} /></button>
        </div>
      </td>
    </tr>
  );
});

const AssignerModal = memo(({ assigner, onClose, onCopy }) => {
  useEscape(onClose);
  const rows = [
    { icon: FiUser, label: 'Assigner name', value: clean(assigner.name) || 'N/A' },
    { icon: FiMail, label: 'Email', value: clean(assigner.email) || 'N/A' },
    { icon: FiPhone, label: 'Phone', value: clean(assigner.phone) || 'N/A', ltr: true },
    { icon: FiCalendar, label: 'Commissioned on', value: fmtDateTime(assigner.createdAt) },
    { icon: FiPackage, label: 'Total handled', value: `${num(assigner.totalAssignmentsHandled)} jobs` },
    { icon: FiClock, label: 'Current queue', value: `${num(assigner.pendingAssignments)} active`, warn: true },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Assigner details" className="nb-card relative w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden">
        <div className="nb-gray nb-line px-5 py-3.5 border-b-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <IconTile icon={FiUsers} tone="cyan" className="w-9 h-9" size={16} />
            <div>
              <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">Assigner details</span></h3>
              <p className="nb-muted mt-1 flex items-center gap-1.5 text-[10px] font-bold font-mono">
                {clean(assigner.id).slice(0, 12)}
                <button type="button" aria-label="Copy assigner ID" onClick={() => onCopy(assigner.id)} className="hover:text-[var(--nb-accent)] transition-colors"><FiCopy size={10} /></button>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={BTN_ICON}><FiX size={15} /></button>
        </div>

        <div className="px-5 py-4 space-y-2.5 overflow-y-auto slim-scroll">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {rows.map(({ icon: Icon, label, value, ltr, warn }) => (
              <div key={label} className={`${PANEL} p-3 flex items-center gap-2.5`}>
                <Icon size={15} className={`${warn ? 'text-amber-500' : 'nb-ic'} flex-shrink-0`} />
                <div className="min-w-0">
                  <p className="nb-muted text-[9px] font-bold uppercase">{label}</p>
                  <p dir={ltr ? 'ltr' : undefined} className="text-xs font-extrabold truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={`${PANEL} p-3 flex items-center justify-between`}>
            <p className="nb-muted text-[9px] font-bold uppercase">Authorization</p>
            <StatusPill status={statusOf(assigner)} />
          </div>
        </div>

        <div className="nb-gray nb-line px-5 py-3.5 border-t-2 flex justify-end gap-2 flex-shrink-0">
          <button type="button" onClick={() => onCopy(assigner.id)} className={`${BTN_MD} uppercase`}><FiCopy size={13} /> Copy ID</button>
          <button type="button" onClick={onClose} className={`${BTN_MD} uppercase`}>Close</button>
        </div>
      </div>
    </div>
  );
});

const ConfirmDeleteModal = memo(({ assigner, busy, onClose, onConfirm }) => {
  const guard = useCallback(() => { if (!busy) onClose(); }, [busy, onClose]);
  useEscape(guard);
  const name = clean(assigner.name) || 'Unnamed assigner';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={guard} aria-hidden="true" />
      <div role="alertdialog" aria-modal="true" aria-label="Delete assigner" className="nb-card relative w-full max-w-sm overflow-hidden">
        <div className="nb-gray nb-line px-5 py-4 flex items-center gap-3 border-b-2">
          <IconTile icon={FiTrash2} tone="red" className="w-10 h-10" size={16} />
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold uppercase">Delete assigner?</h3>
            <p className="nb-muted text-[11px] font-semibold">This will permanently remove the assigner from the registry.</p>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className={`${PANEL} p-3 flex items-center gap-2.5`}>
            <FiUsers size={15} className="nb-ic flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase truncate">{name}</p>
              <p className="nb-muted text-[10px] font-semibold truncate">{clean(assigner.email) || clean(assigner.id)}</p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2.5">
          <button type="button" onClick={guard} disabled={busy} className={`${BTN_MD} flex-1 uppercase`}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy} className={`${BTN_DANGER} flex-1 uppercase`}>
            {busy ? <FiRefreshCw size={13} className="animate-spin motion-reduce:animate-none" /> : <FiTrash2 size={13} />}
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
});

const Assigners = () => {
  const navigate = useNavigate();
  const darkMode = useDarkMode();
  const tokenRef = useRef(localStorage.getItem('authToken'));
  const denied = useMemo(() => !tokenRef.current || isNotAdmin(tokenRef.current), []);
  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${tokenRef.current}` }), []);

  const [assigners, setAssigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());

  const inflight = useRef(new Set());
  const abortRef = useRef(null);
  const detailAbort = useRef(null);

  const term = useDeferredValue(search).trim().toLowerCase();

  useEffect(() => { document.title = 'Admin - Assigners'; }, []);
  useEffect(() => { ensureNbFont(); }, []);

  useEffect(() => {
    if (!tokenRef.current) { navigate('/login', { replace: true }); return; }
    if (denied) { toast({ icon: 'error', title: 'Access denied', text: 'Admin accounts only.' }); navigate('/login', { replace: true }); }
  }, [navigate, denied]);

  const fetchAssigners = useCallback(async ({ silent = false } = {}) => {
    if (!tokenRef.current || denied) return null;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (!silent) setLoading(true);
    setError(false);
    try {
      const { data } = await api.get('/api/admin/assigners', { headers: authHeaders(), signal: ctrl.signal });
      if (ctrl.signal.aborted) return null;
      const list = Array.isArray(data) ? data : data?.content || [];
      setAssigners(list);
      setLastUpdated(new Date());
      return list;
    } catch (err) {
      if (ctrl.signal.aborted || isCanceled(err)) return null;
      const status = err?.response?.status;
      if (status === 401) navigate('/login', { replace: true });
      else if (status === 403) { toast({ icon: 'error', title: 'Access denied', text: 'Admin accounts only.' }); navigate('/login', { replace: true }); }
      else { setError(true); toast({ icon: 'error', title: 'Failed to load assigners', text: errText(err) }); }
      return null;
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [navigate, denied, authHeaders]);

  useEffect(() => {
    fetchAssigners();
    return () => { abortRef.current?.abort(); detailAbort.current?.abort(); };
  }, [fetchAssigners]);

  const withBusy = useCallback(async (id, task) => {
    const key = String(id);
    if (!isSafeId(key) || inflight.current.has(key)) return;
    inflight.current.add(key);
    setBusyIds(new Set(inflight.current));
    try { await task(encodeURIComponent(key)); } finally {
      inflight.current.delete(key);
      setBusyIds(new Set(inflight.current));
    }
  }, []);

  const setStatus = useCallback((a, action) => withBusy(a.id, async (eid) => {
    const target = action === 'approve' ? 'APPROVED' : 'SUSPENDED';
    const before = a.status;
    const patch = (s) => setAssigners((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: s } : x)));
    patch(target);
    try {
      await api.put(`/api/admin/assigners/${eid}/${action}`, {}, { headers: authHeaders() });
      toast({ icon: 'success', title: action === 'approve' ? 'Assigner approved' : 'Assigner suspended' });
      const fresh = (await fetchAssigners({ silent: true }))?.find((x) => x.id === a.id);
      if (fresh && statusOf(fresh) !== target) {
        toast({ icon: 'warning', title: 'Status not saved', text: 'The server returned a different status.' });
      }
    } catch (err) {
      patch(before);
      toast({ icon: 'error', title: 'Action failed', text: errText(err) });
    }
  }), [withBusy, authHeaders, fetchAssigners]);

  const requestDelete = useCallback((a) => setDeleteTarget(a), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  const confirmDelete = useCallback(async () => {
    const a = deleteTarget;
    if (!a) return;
    if (!isSafeId(a.id)) {
      toast({ icon: 'error', title: 'Delete failed', text: 'This assigner has an ID that cannot be sent to the server.' });
      setDeleteTarget(null);
      return;
    }
    await withBusy(a.id, async (eid) => {
      try {
        await api.delete(`/api/admin/assigners/${eid}`, { headers: authHeaders() });
        setAssigners((prev) => prev.filter((x) => x.id !== a.id));
        setSelected((prev) => (prev && prev.id === a.id ? null : prev));
        toast({ icon: 'success', title: 'Assigner deleted' });
      } catch (err) {
        toast({ icon: 'error', title: 'Delete failed', text: deleteErrText(err) });
      }
    });
    setDeleteTarget(null);
  }, [deleteTarget, withBusy, authHeaders]);

  const viewAssigner = useCallback(async (a) => {
    setSelected(a);
    if (!isSafeId(a.id)) return;
    detailAbort.current?.abort();
    const ctrl = new AbortController();
    detailAbort.current = ctrl;
    try {
      const { data } = await api.get(`/api/admin/assigners/${encodeURIComponent(a.id)}`, { headers: authHeaders(), signal: ctrl.signal });
      if (!ctrl.signal.aborted) setSelected((prev) => (prev && prev.id === a.id ? { ...prev, ...data } : prev));
    } catch {}
  }, [authHeaders]);

  const index = useMemo(() => assigners.map((a) => {
    const name = clean(a.name).toLowerCase();
    const email = clean(a.email).toLowerCase();
    const phone = clean(a.phone).toLowerCase();
    return {
      a, name,
      status: statusOf(a).toLowerCase(),
      total: num(a.totalAssignmentsHandled),
      text: `${name} ${email} ${phone} ${String(a.id ?? '').toLowerCase()}`,
    };
  }), [assigners]);

  const counts = useMemo(() => {
    const c = { all: index.length, approved: 0, pending: 0, suspended: 0 };
    for (const e of index) if (e.status in c) c[e.status] += 1;
    return c;
  }, [index]);

  const filtered = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    const key = sort.field;
    const list = index.filter((e) => (tab === 'all' || e.status === tab) && (!term || e.text.includes(term)));
    list.sort((a, b) => (a[key] < b[key] ? -dir : a[key] > b[key] ? dir : 0));
    return list.map((e) => e.a);
  }, [index, tab, term, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);

  const statCards = useMemo(() => [
    { label: 'Total assigners', value: NUM_FMT.format(counts.all), description: 'All assignment staff', icon: FiUsers, tone: 'cyan', percent: counts.all ? 100 : 0, color: '#22d3ee' },
    { label: 'Authorized', value: NUM_FMT.format(counts.approved), description: 'Approved to assign', icon: FiUserCheck, tone: 'em', percent: pct(counts.approved, counts.all), color: '#34d399' },
    { label: 'Pending', value: NUM_FMT.format(counts.pending), description: 'Waiting for approval', icon: FiClock, tone: 'amber', percent: pct(counts.pending, counts.all), color: '#fbbf24' },
    { label: 'Suspended', value: NUM_FMT.format(counts.suspended), description: 'Blocked from assigning', icon: FiUserX, tone: 'red', percent: pct(counts.suspended, counts.all), color: '#fb7185' },
  ], [counts]);

  const handleSearch = useCallback((e) => { setSearch(sanitizeSearch(e.target.value)); setCurrentPage(1); }, []);
  const handleTab = useCallback((k) => { setTab(k); setCurrentPage(1); }, []);
  const handleRows = useCallback((n) => { setRowsPerPage(n); setCurrentPage(1); }, []);
  const handleSort = useCallback((field) => {
    setSort((s) => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }));
    setCurrentPage(1);
  }, []);
  const handleCopy = useCallback(async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ icon: 'success', title: 'Copied', text: 'Assigner ID copied to clipboard.', timer: 2000 });
    } catch {
      toast({ icon: 'error', title: 'Could not copy', text: 'Allow clipboard access in your browser.' });
    }
  }, []);
  const handleApprove = useCallback((a) => setStatus(a, 'approve'), [setStatus]);
  const handleSuspend = useCallback((a) => setStatus(a, 'suspend'), [setStatus]);
  const closeModal = useCallback(() => { detailAbort.current?.abort(); setSelected(null); }, []);
  const refresh = useCallback(() => fetchAssigners(), [fetchAssigners]);

  const exportCSV = useCallback(() => {
    downloadCSV(
      'assigners.csv',
      ['ID', 'Name', 'Email', 'Phone', 'Status', 'Total assignments', 'Pending assignments'],
      filtered.map((a) => [a.id, clean(a.name), clean(a.email), clean(a.phone), statusOf(a), num(a.totalAssignmentsHandled), num(a.pendingAssignments)]),
    );
  }, [filtered]);

  if (denied) return null;

  const hasData = assigners.length > 0;

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
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />Staff</p>
            <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
              <UnderlinedTitle text="Assigners Console" />
            </h1>
            <p className="nb-muted mt-2 text-sm font-medium">Coordinate and authorize platform assignment staff</p>
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
                aria-label="Search assigners"
                placeholder="Search by name, email, phone or ID"
                onChange={handleSearch}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
              />
            </div>
            <RowsDropdown value={rowsPerPage} onChange={handleRows} />
          </div>

          <Tabs label="Assigner status" tabs={TABS} value={tab} onChange={handleTab} counts={counts} />

          <div className="overflow-auto max-h-[68vh] slim-scroll">
            <table className="w-full min-w-[820px] text-left border-collapse">
              <thead className="nb-gray sticky top-0 z-10 shadow-[0_2px_0_0_var(--nb-line)]">
                <tr>
                  <SortTh label="Assigner" field="name" sort={sort} onSort={handleSort} />
                  <PlainTh>ID</PlainTh>
                  <SortTh label="Status" field="status" sort={sort} onSort={handleSort} />
                  <SortTh label="Total assigned" field="total" sort={sort} onSort={handleSort} />
                  <PlainTh>Actions</PlainTh>
                </tr>
              </thead>
              <tbody className="nb-rows">
                {loading && !hasData ? (
                  Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {Array.from({ length: 5 }, (__, j) => (
                        <td key={j} className="px-3 py-4"><div className="nb-gray h-3.5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : error && !hasData ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <FiAlertCircle size={28} className="mx-auto text-red-500" />
                      <p className="mt-2 text-sm font-extrabold uppercase">Couldn't load assigners</p>
                      <p className="nb-muted text-xs mb-4">Check your connection and try again.</p>
                      <button type="button" onClick={refresh} className={`${BTN_MD} nb-btn-a uppercase`}><FiRefreshCw size={13} /> Try again</button>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14">
                      <EmptyState3D kind="box" title="No assigners found" subtitle="The list is empty or nothing matches your search" darkMode={darkMode} />
                    </td>
                  </tr>
                ) : (
                  paginated.map((a) => (
                    <AssignerRow
                      key={a.id}
                      assigner={a}
                      busy={busyIds.has(String(a.id))}
                      onView={viewAssigner}
                      onCopy={handleCopy}
                      onApprove={handleApprove}
                      onSuspend={handleSuspend}
                      onDelete={requestDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="nb-gray nb-line px-4 py-3 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-semibold">
                Showing <b className="tabular-nums">{NUM_FMT.format(from)}–{NUM_FMT.format(to)}</b> of <b className="tabular-nums">{NUM_FMT.format(filtered.length)}</b> assigners
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} />}
            </div>
          )}
        </section>
      </div>

      {selected && <AssignerModal assigner={selected} onClose={closeModal} onCopy={handleCopy} />}

      {deleteTarget && (
        <ConfirmDeleteModal
          assigner={deleteTarget}
          busy={busyIds.has(String(deleteTarget.id))}
          onClose={closeDelete}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default memo(Assigners);