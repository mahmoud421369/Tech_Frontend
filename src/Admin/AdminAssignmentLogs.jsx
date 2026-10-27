import React, {
  useState, useEffect, useMemo, useCallback, useRef, useDeferredValue, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiX, FiClipboard, FiUser, FiPackage, FiTool, FiUserCheck,
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
  { key: 'order', label: 'Orders' },
  { key: 'repair', label: 'Repairs' },
];
const REDUCED = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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
.nb-squig path{stroke:var(--nb-accent)}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5;white-space:nowrap}
.nb-chip-n{background:var(--nb-gray);color:var(--nb-muted);border-style:dashed}
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

const TONE_BG = { em: '#34d399', teal: '#2dd4bf', lime: '#a3e635', cyan: '#22d3ee', amber: '#fbbf24', red: '#fb7185' };

const TYPE_META = {
  ORDER: { label: 'Order', bg: '#22d3ee' },
  REPAIR: { label: 'Repair', bg: '#fbbf24' },
  OTHER: { label: 'Other', bg: null },
};

const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });
const DATETIME_FMT = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const NF = new Intl.NumberFormat('en-US');
const fmt = (n) => NF.format(n);
const fmtDateTime = (d) => {
  if (!d) return '—';
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? '—' : DATETIME_FMT.format(t);
};
const toTime = (d) => {
  const t = d ? new Date(d).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
};

const CTRL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const clean = (v) => String(v ?? '').replace(CTRL, '');
const sanitizeSearch = (v) => clean(v).replace(/[<>]/g, '').replace(/\s{2,}/g, ' ').slice(0, SEARCH_MAX);
const isCanceled = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';
const errText = (err) => String(err?.response?.data?.message || '').slice(0, 120) || undefined;
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const nextSort = (s, field) => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });
const typeOf = (l) => {
  const t = clean(l.assignmentType).toUpperCase();
  return t === 'ORDER' || t === 'REPAIR' ? t : 'OTHER';
};

const formatAddress = (addr) => {
  if (!addr) return '';
  const parts = [addr.building, addr.street, addr.city, addr.state].map(clean).filter(Boolean).join(', ');
  const notes = clean(addr.notes);
  return notes ? `${parts} (${notes})` : parts;
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

const Tabs = memo(({ tabs, value, onChange, counts }) => (
  <div role="tablist" aria-label="Assignment type" className="nb-line flex gap-2 overflow-x-auto p-3 sm:px-4 border-b-2 [scrollbar-width:none]">
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

const TypePill = memo(({ type }) => {
  const m = TYPE_META[type] || TYPE_META.OTHER;
  return (
    <span className={`nb-chip ${m.bg ? '' : 'nb-chip-n'}`} style={m.bg ? { background: m.bg, color: '#04261a' } : undefined}>
      <span className="w-1.5 h-1.5 bg-current" aria-hidden="true" />
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
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', h);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('pointerdown', h);
      document.removeEventListener('keydown', k);
    };
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

const LogRow = memo(({ entry: e }) => (
  <tr className="transition-colors motion-reduce:transition-none">
    <td className="px-3 py-2.5 whitespace-nowrap">
      <div className="flex items-center gap-2.5">
        <IconTile icon={FiUser} tone="em" className="w-9 h-9" size={14} />
        <p className="text-xs font-extrabold uppercase truncate max-w-[200px]">{e.assignerLabel}</p>
      </div>
    </td>
    <td className="px-3 py-2.5 whitespace-nowrap"><TypePill type={e.type} /></td>
    <td className="px-3 py-2.5 whitespace-nowrap text-xs font-bold truncate max-w-[180px]">{e.shopLabel}</td>
    <td className="px-3 py-2.5 whitespace-nowrap text-xs font-bold truncate max-w-[180px]">{e.userLabel}</td>
    <td className="px-3 py-2.5">
      <p className="nb-muted text-[11px] font-semibold max-w-[240px] line-clamp-2" title={e.destLabel}>{e.destLabel}</p>
    </td>
    <td className="nb-muted px-3 py-2.5 whitespace-nowrap text-[11px] font-semibold tabular-nums">{e.createdLabel}</td>
    <td className="nb-muted px-3 py-2.5 whitespace-nowrap text-[11px] font-semibold tabular-nums">{e.updatedLabel}</td>
  </tr>
));

const SKELETON_ROWS = Array.from({ length: 8 }, (_, i) => i);
const SKELETON_CELLS = Array.from({ length: 7 }, (_, i) => i);

const AdminAssignmentLogs = () => {
  const navigate = useNavigate();
  const darkMode = useDarkMode();
  const tokenRef = useRef(localStorage.getItem('authToken'));
  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${tokenRef.current}` }), []);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sort, setSort] = useState({ field: 'createdAt', dir: 'desc' });

  const abortRef = useRef(null);
  const term = useDeferredValue(search).trim().toLowerCase();

  useEffect(() => { document.title = 'Admin - Assignment Logs'; }, []);
  useEffect(() => { ensureNbFont(); }, []);

  const fetchLogs = useCallback(async ({ silent = false } = {}) => {
    if (!tokenRef.current) { navigate('/login', { replace: true }); return; }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (!silent) setLoading(true);
    setError(false);
    try {
      const { data } = await api.get('/api/admin/assignment-logs', { headers: authHeaders(), signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      setLogs(Array.isArray(data) ? data : data?.content || []);
      setLastUpdated(new Date());
    } catch (err) {
      if (ctrl.signal.aborted || isCanceled(err)) return;
      const status = err?.response?.status;
      if (status === 401) navigate('/login', { replace: true });
      else if (status === 403) toast({ icon: 'error', title: 'Access denied', text: 'Admin accounts only.' });
      else { setError(true); toast({ icon: 'error', title: 'Sync failed', text: errText(err) }); }
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [navigate, authHeaders]);

  useEffect(() => {
    fetchLogs();
    return () => abortRef.current?.abort();
  }, [fetchLogs]);

  const { index, counts, uniqueAssigners } = useMemo(() => {
    const c = { all: logs.length, order: 0, repair: 0 };
    const ids = new Set();
    const rows = logs.map((l, i) => {
      const assigner = clean(l.assignerName);
      const shop = clean(l.shopName);
      const user = clean(l.userName);
      const dest = formatAddress(l.userAddress);
      const type = typeOf(l);
      const tabKey = type.toLowerCase();
      if (tabKey in c) c[tabKey] += 1;
      const who = l.assignerId ?? (assigner || null);
      if (who != null) ids.add(who);
      return {
        key: l.id ?? `row-${i}`,
        id: l.id,
        type,
        tab: tabKey,
        assignerLabel: assigner || '—',
        shopLabel: shop || '—',
        userLabel: user || '—',
        destLabel: dest || '—',
        createdLabel: fmtDateTime(l.createdAt),
        updatedLabel: fmtDateTime(l.updatedAt),
        assignerName: assigner.toLowerCase(),
        assignmentType: type,
        shopName: shop.toLowerCase(),
        userName: user.toLowerCase(),
        destination: dest.toLowerCase(),
        createdAt: toTime(l.createdAt),
        updatedAt: toTime(l.updatedAt),
        text: `${assigner} ${shop} ${user} ${dest}`.toLowerCase(),
      };
    });
    return { index: rows, counts: c, uniqueAssigners: ids.size };
  }, [logs]);

  const filtered = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    const key = sort.field;
    const list = index.filter((e) => (tab === 'all' || e.tab === tab) && (!term || e.text.includes(term)));
    list.sort((a, b) => (a[key] < b[key] ? -dir : a[key] > b[key] ? dir : 0));
    return list;
  }, [index, tab, term, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);

  const statCards = useMemo(() => [
    { label: 'Total assignments', value: fmt(counts.all), description: 'All logged activity', icon: FiClipboard, tone: 'em', percent: counts.all ? 100 : 0, color: '#34d399' },
    { label: 'Order assignments', value: fmt(counts.order), description: 'Delivery jobs', icon: FiPackage, tone: 'cyan', percent: pct(counts.order, counts.all), color: '#22d3ee' },
    { label: 'Repair assignments', value: fmt(counts.repair), description: 'Repair jobs', icon: FiTool, tone: 'amber', percent: pct(counts.repair, counts.all), color: '#fbbf24' },
    { label: 'Active assigners', value: fmt(uniqueAssigners), description: 'Staff with logged work', icon: FiUserCheck, tone: 'lime', percent: uniqueAssigners ? 100 : 0, color: '#a3e635' },
  ], [counts, uniqueAssigners]);

  const handleSearch = useCallback((e) => { setSearch(sanitizeSearch(e.target.value)); setCurrentPage(1); }, []);
  const clearSearch = useCallback(() => { setSearch(''); setCurrentPage(1); }, []);
  const handleTab = useCallback((key) => { setTab(key); setCurrentPage(1); }, []);
  const handleRows = useCallback((n) => { setRowsPerPage(n); setCurrentPage(1); }, []);
  const handleSort = useCallback((field) => { setSort((s) => nextSort(s, field)); setCurrentPage(1); }, []);
  const refresh = useCallback(() => fetchLogs(), [fetchLogs]);

  const exportCSV = useCallback(() => {
    downloadCSV(
      'assignment-logs.csv',
      ['ID', 'Assigner', 'Type', 'Shop', 'User', 'Destination', 'Created', 'Last update'],
      filtered.map((e) => [e.id ?? '', e.assignerLabel, e.type, e.shopLabel, e.userLabel, e.destLabel, e.createdLabel, e.updatedLabel]),
    );
  }, [filtered]);

  const hasData = logs.length > 0;
  const skeletonRows = SKELETON_ROWS.slice(0, Math.min(rowsPerPage, 8));

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
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />Activity</p>
            <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
              <UnderlinedTitle text="Assignment Logs" />
            </h1>
            <p className="nb-muted mt-2 text-sm font-medium">Full history of assignment activity across the platform</p>
          </div>
          <div className="flex items-center gap-2.5">
            {lastUpdated && <p className="nb-muted hidden sm:block text-[11px] font-bold">Last updated: {TIME_FMT.format(lastUpdated)}</p>}
            <button type="button" onClick={refresh} disabled={loading} aria-label="Refresh" title="Refresh" className={`${BTN_MD} h-10 uppercase`}>
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
                type="text"
                value={search}
                maxLength={SEARCH_MAX}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                aria-label="Search assignment logs"
                placeholder="Search by assigner, shop, user or destination"
                onChange={handleSearch}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
              />
              {search && (
                <button type="button" onClick={clearSearch} aria-label="Clear search" className="flex-shrink-0 hover:text-red-500 transition-colors">
                  <FiX size={15} />
                </button>
              )}
            </div>
            <RowsDropdown value={rowsPerPage} onChange={handleRows} />
          </div>

          <Tabs tabs={TABS} value={tab} onChange={handleTab} counts={counts} />

          <div className="overflow-auto max-h-[68vh] slim-scroll">
            <table className="w-full min-w-[980px] text-left border-collapse">
              <thead className="nb-gray sticky top-0 z-10 shadow-[0_2px_0_0_var(--nb-line)]">
                <tr>
                  <SortTh label="Assigner" field="assignerName" sort={sort} onSort={handleSort} />
                  <SortTh label="Type" field="assignmentType" sort={sort} onSort={handleSort} />
                  <SortTh label="Shop" field="shopName" sort={sort} onSort={handleSort} />
                  <SortTh label="User" field="userName" sort={sort} onSort={handleSort} />
                  <SortTh label="Destination" field="destination" sort={sort} onSort={handleSort} />
                  <SortTh label="Date" field="createdAt" sort={sort} onSort={handleSort} />
                  <SortTh label="Last update" field="updatedAt" sort={sort} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="nb-rows">
                {loading && !hasData ? (
                  skeletonRows.map((i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {SKELETON_CELLS.map((j) => (
                        <td key={j} className="px-3 py-4"><div className="nb-gray h-3.5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : error && !hasData ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <FiAlertCircle size={28} className="mx-auto text-red-500" />
                      <p className="mt-2 text-sm font-extrabold uppercase">Couldn't load assignment logs</p>
                      <p className="nb-muted text-xs mb-4">Check your connection and try again.</p>
                      <button type="button" onClick={refresh} className={`${BTN_MD} nb-btn-a uppercase`}><FiRefreshCw size={13} /> Try again</button>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14">
                      <EmptyState3D kind="box" title="No logs found" subtitle="The list is empty or nothing matches your search" darkMode={darkMode} />
                    </td>
                  </tr>
                ) : (
                  paginated.map((e) => <LogRow key={e.key} entry={e} />)
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="nb-gray nb-line px-4 py-3 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-semibold">
                Showing <b className="tabular-nums">{fmt(from)}–{fmt(to)}</b> of <b className="tabular-nums">{fmt(filtered.length)}</b> logs
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} />}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default memo(AdminAssignmentLogs);