import React, {
  useState, useEffect, useCallback, useMemo, useRef, useDeferredValue, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiX, FiCopy, FiMail, FiPhone, FiMapPin, FiUsers, FiUserCheck, FiUserX,
  FiActivity, FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight, FiRefreshCw,
  FiAlertCircle,
} from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../components/user/UiExtras';

const DOC_TITLE = 'Assigner - Delivery Network | Tech Restore';
const ENDPOINT = '/api/assigner/delivery-persons';
const ROWS_OPTIONS = [8, 16, 24, 48];
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'unavailable', label: 'Unavailable' },
];
const SEARCH_MAX = 60;
const POLL_MS = 60_000;
const REDUCED = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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
const STYLE_HTML = { __html: PAGE_CSS };

const BTN_MD = 'nb-btn px-3 py-2 text-xs';
const BTN_ICON = 'nb-btn w-8 h-8';
const TONE_BG = { em: '#34d399', teal: '#2dd4bf', lime: '#a3e635', cyan: '#22d3ee', red: '#fb7185', amber: '#fbbf24' };

const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });
const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
const SEARCH_STRIP_RE = /[^\p{L}\p{M}\p{N} @._+\-#,'’/()]/gu;
const clean = (v) => String(v ?? '').replace(CTRL, '');
const txt = (v) => (typeof v === 'string' || typeof v === 'number' ? clean(v) : '');
const sanitizeSearch = (v) =>
  clean(v)
    .normalize('NFC')
    .replace(SEARCH_STRIP_RE, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s+/, '')
    .slice(0, SEARCH_MAX);
const errText = (err) => String(err?.response?.data?.message || '').slice(0, 120) || undefined;
const asList = (res) => { const d = res?.data; return Array.isArray(d) ? d : d?.content || []; };
const shortId = (id) => clean(id).slice(-8).toUpperCase();
const num = (v) => INT_FMT.format(v);
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const validDate = (v) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d : null; };
const fmtDate = (v) => { const d = validDate(v); return d ? DATE_FMT.format(d) : '—'; };
const phoneHref = (p) => {
  const digits = String(p ?? '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
};
const mailHref = (e) => (/^[^\s@]+@[^\s@]+$/.test(String(e ?? '')) ? `mailto:${e}` : null);
const mapsUrl = (a) => (a ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}` : null);

const loadLevel = (n) => {
  if (n >= 8) return { color: TONE_BG.red, label: 'Overloaded' };
  if (n >= 5) return { color: TONE_BG.amber, label: 'Busy' };
  if (n >= 1) return { color: TONE_BG.em, label: 'Active' };
  return { color: TONE_BG.em, label: 'Idle' };
};

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

const StatusPill = memo(({ on }) => (
  <span className="nb-chip" style={{ background: on ? TONE_BG.em : TONE_BG.red, color: '#04261a' }}>
    <span className="w-1.5 h-1.5 bg-[#04261a]" aria-hidden="true" />
    {on ? 'Available' : 'Unavailable'}
  </span>
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
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label="Agents per page" className={`${BTN_MD} h-10 min-w-[120px] justify-between uppercase`}>
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

const AgentRow = memo(({ agent, onCopy }) => {
  const level = loadLevel(agent.active);
  const tel = phoneHref(agent.phone);
  const mail = mailHref(agent.email);
  const map = mapsUrl(agent.address);
  return (
    <tr className="transition-colors motion-reduce:transition-none">
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <span className="nb-tile w-9 h-9 text-sm font-extrabold uppercase" style={{ background: TONE_BG.em }}>
            {agent.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase truncate max-w-[200px]">{agent.name}</p>
            <p dir="ltr" className="nb-muted text-[10px] font-semibold truncate max-w-[200px]">{agent.email || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5">
          <code className="text-[11px] font-mono font-bold">#{shortId(agent.id)}</code>
          <button type="button" title="Copy agent ID" aria-label={`Copy agent ID ${shortId(agent.id)}`} onClick={() => onCopy(agent.id)} className="nb-muted hover:text-[var(--nb-accent)] transition-colors">
            <FiCopy size={12} aria-hidden="true" />
          </button>
        </span>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <p dir="ltr" className="text-xs font-bold">{agent.phone || '—'}</p>
      </td>
      <td className="px-3 py-2.5 text-xs font-semibold"><span className="block truncate max-w-[220px]">{agent.address || '—'}</span></td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-extrabold tabular-nums w-5">{agent.active}</span>
          <span className="nb-track w-20" title={level.label}>
            <span className="block h-full" style={{ width: `${Math.min(100, agent.active * 10)}%`, background: level.color }} />
          </span>
          <span className="nb-muted text-[10px] font-bold uppercase">{level.label}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap"><StatusPill on={agent.available} /></td>
      <td className="nb-muted px-3 py-2.5 whitespace-nowrap text-xs font-bold">{fmtDate(agent.createdAt)}</td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {tel && (
            <a href={tel} title="Call agent" aria-label={`Call ${agent.name}`} className={BTN_ICON}>
              <FiPhone size={14} aria-hidden="true" />
            </a>
          )}
          {mail && (
            <a href={mail} title="Email agent" aria-label={`Email ${agent.name}`} className={BTN_ICON}>
              <FiMail size={14} aria-hidden="true" />
            </a>
          )}
          {map && (
            <a href={map} target="_blank" rel="noopener noreferrer" title="Open address in maps" aria-label={`Open ${agent.name} address in maps`} className={BTN_ICON}>
              <FiMapPin size={14} aria-hidden="true" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
});

const COLS = 8;

const DeliveryNetwork = () => {
  const navigate = useNavigate();
  const darkMode = useDarkMode();
  const tokenRef = useRef(localStorage.getItem('authToken'));
  const denied = useMemo(
    () => !tokenRef.current || isTokenExpired(tokenRef.current) || isNotAssigner(tokenRef.current),
    []
  );

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_OPTIONS[0]);
  const [sort, setSort] = useState({ field: 'tasks', dir: 'asc' });

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

  const fetchData = useCallback(async ({ silent = false } = {}) => {
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
      setAgents(asList(res).map((a) => ({
        id: a.id,
        name: txt(a.name) || 'Unnamed agent',
        email: txt(a.email),
        phone: txt(a.phone),
        address: txt(a.address),
        active: Number(a.activeAssignments) || 0,
        createdAt: a.createdAt,
        available: a.available !== false,
      })));
      setLastUpdated(new Date());
    } catch (err) {
      if (ctrl.signal.aborted || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
      const status = err?.response?.status;
      if (status === 401) { localStorage.clear(); navigate('/login', { replace: true }); return; }
      if (status === 403) { toast({ icon: 'error', title: 'Access denied', text: 'Assigner accounts only.' }); navigate('/login', { replace: true }); return; }
      if (!silent) {
        setError(true);
        toast({ icon: 'error', title: 'Failed to load agents', text: errText(err) });
      }
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [denied, navigate]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  useEffect(() => {
    if (denied) return undefined;
    const id = setInterval(() => { if (!document.hidden) fetchData({ silent: true }); }, POLL_MS);
    return () => clearInterval(id);
  }, [denied, fetchData]);

  const handleCopy = useCallback(async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ icon: 'success', title: 'Copied', text: 'Agent ID copied to clipboard.', timer: 2000 });
    } catch {
      toast({ icon: 'error', title: 'Could not copy', text: 'Allow clipboard access in your browser.' });
    }
  }, []);

  const index = useMemo(() => agents.map((a) => ({
    a,
    name: a.name.toLowerCase(),
    id: String(a.id ?? '').toLowerCase(),
    phone: a.phone,
    address: a.address.toLowerCase(),
    tasks: a.active,
    joined: Date.parse(a.createdAt) || 0,
    status: a.available ? 1 : 0,
    text: `${a.id} ${a.name} ${a.email} ${a.phone} ${a.address}`.toLowerCase(),
  })), [agents]);

  const stats = useMemo(() => {
    let available = 0; let tasks = 0; let busy = 0;
    for (const a of agents) {
      if (a.available) available += 1;
      if (a.active > 0) busy += 1;
      tasks += a.active;
    }
    return { all: agents.length, available, unavailable: agents.length - available, tasks, busy };
  }, [agents]);

  const filtered = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    const key = sort.field;
    const list = index.filter((e) => (
      (tab === 'all' || (tab === 'available' ? e.status === 1 : e.status === 0))
      && (!term || e.text.includes(term))
    ));
    list.sort((x, y) => (x[key] < y[key] ? -dir : x[key] > y[key] ? dir : 0));
    return list.map((e) => e.a);
  }, [index, tab, term, sort]);

  useEffect(() => { setCurrentPage(1); }, [tab, term, rowsPerPage, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);

  const statCards = useMemo(() => [
    { label: 'Total agents', value: num(stats.all), description: 'In the delivery network', icon: FiUsers, tone: 'em', percent: stats.all ? 100 : 0, color: TONE_BG.em },
    { label: 'Available', value: num(stats.available), description: 'Ready for new work', icon: FiUserCheck, tone: 'teal', percent: pct(stats.available, stats.all), color: TONE_BG.teal },
    { label: 'Unavailable', value: num(stats.unavailable), description: 'Not taking assignments', icon: FiUserX, tone: 'red', percent: pct(stats.unavailable, stats.all), color: TONE_BG.red },
    { label: 'Active tasks', value: num(stats.tasks), description: `${num(stats.busy)} agents are working`, icon: FiActivity, tone: 'lime', percent: pct(stats.busy, stats.all), color: TONE_BG.lime },
  ], [stats]);

  const tabCounts = useMemo(
    () => ({ all: stats.all, available: stats.available, unavailable: stats.unavailable }),
    [stats]
  );

  const handleSort = useCallback((field) => setSort((s) => nextSort(s, field, field === 'joined' ? 'desc' : 'asc')), []);
  const refresh = useCallback(() => fetchData(), [fetchData]);
  const clearSearch = useCallback(() => setSearch(''), []);
  const handleSearchChange = useCallback((e) => setSearch(sanitizeSearch(e.target.value)), []);
  const handleSearchPaste = useCallback((e) => {
    const pasted = e.clipboardData?.getData('text') || '';
    if (pasted.length > 500) e.preventDefault();
  }, []);
  const handleSearchKey = useCallback((e) => {
    if (e.key === 'Escape') setSearch('');
    else if (e.key === 'Enter') e.preventDefault();
  }, []);
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
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />Logistics</p>
            <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
              <UnderlinedTitle text="Delivery Network" />
            </h1>
            <p className="nb-muted mt-2 text-sm font-medium">Track agent availability and workload</p>
          </div>
          <div className="flex items-center gap-2.5">
            {lastUpdated && <p className="nb-muted hidden sm:block text-[11px] font-bold">Last updated: {TIME_FMT.format(lastUpdated)}</p>}
            <button type="button" onClick={refresh} aria-label="Refresh agents" title="Refresh" className={`${BTN_MD} h-10 uppercase`}>
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
              <label htmlFor="agent-search" className="sr-only">Search agents</label>
              <input
                id="agent-search"
                name="agent-search"
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
                onPaste={handleSearchPaste}
                onKeyDown={handleSearchKey}
                placeholder="Search name, email, phone or address"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60 [&::-webkit-search-cancel-button]:appearance-none"
              />
              {search && (
                <button type="button" onClick={clearSearch} aria-label="Clear search" className="flex-shrink-0 nb-muted hover:text-[var(--nb-accent)]">
                  <FiX size={15} aria-hidden="true" />
                </button>
              )}
            </div>
            <RowsDropdown value={rowsPerPage} onChange={setRowsPerPage} />
          </div>

          <div role="tablist" aria-label="Agent availability" className="nb-line flex gap-2 overflow-x-auto p-3 sm:px-4 border-b-2 [scrollbar-width:none]">
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
            <table className="w-full min-w-[1040px] text-start border-collapse">
              <thead className="nb-gray sticky top-0 z-10 shadow-[0_2px_0_0_var(--nb-line)]">
                <tr>
                  <SortTh label="Agent" field="name" sort={sort} onSort={handleSort} />
                  <SortTh label="ID" field="id" sort={sort} onSort={handleSort} />
                  <SortTh label="Phone" field="phone" sort={sort} onSort={handleSort} />
                  <SortTh label="Address" field="address" sort={sort} onSort={handleSort} />
                  <SortTh label="Active tasks" field="tasks" sort={sort} onSort={handleSort} />
                  <SortTh label="Status" field="status" sort={sort} onSort={handleSort} />
                  <SortTh label="Joined" field="joined" sort={sort} onSort={handleSort} />
                  <th scope="col" className="px-3 py-3 text-start text-[11px] font-extrabold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="nb-rows">
                {loading && agents.length === 0 ? (
                  Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {Array.from({ length: COLS }, (__, j) => (
                        <td key={j} className="px-3 py-4"><div className="nb-gray h-3.5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : error && agents.length === 0 ? (
                  <tr>
                    <td colSpan={COLS} className="px-6 py-14 text-center">
                      <FiAlertCircle size={28} className="mx-auto text-red-500" />
                      <p className="mt-2 text-sm font-extrabold uppercase">Couldn't load agents</p>
                      <p className="nb-muted text-xs mb-4">Check your connection and try again.</p>
                      <button type="button" onClick={refresh} className={`${BTN_MD} nb-btn-a uppercase`}><FiRefreshCw size={13} /> Try again</button>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={COLS} className="px-6 py-14">
                      <EmptyState3D
                        kind="box"
                        title={agents.length === 0 ? 'No agents yet' : 'No matching agents'}
                        subtitle={agents.length === 0 ? 'Delivery agents will appear here once they join the network' : 'Try a different name, email, phone or address, or switch tab'}
                        darkMode={darkMode}
                      />
                    </td>
                  </tr>
                ) : (
                  paginated.map((a) => <AgentRow key={a.id} agent={a} onCopy={handleCopy} />)
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="nb-gray nb-line px-4 py-3 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-semibold">
                Showing <b className="tabular-nums">{num(from)}–{num(to)}</b> of <b className="tabular-nums">{num(filtered.length)}</b> agents
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={goToPage} />}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default memo(DeliveryNetwork);