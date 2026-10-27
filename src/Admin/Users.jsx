import React, {
  useState, useEffect, useCallback, useMemo, useRef, useDeferredValue, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers, FiInfo, FiCheck, FiPause, FiTrash2, FiCopy, FiSearch, FiX, FiMail, FiPhone,
  FiUser, FiBriefcase, FiShield, FiCheckCircle, FiXCircle, FiChevronUp, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiRefreshCw, FiAlertCircle, FiHash, FiMapPin, FiTool,
  FiShoppingBag, FiStar,
} from 'react-icons/fi';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../components/user/UiExtras';

const ROWS_OPTIONS = [5, 10, 20, 50];
const ROLES = ['GUEST', 'ADMIN', 'DELIVERY', 'ASSIGNER'];
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
];
const SORT_KEY = { name: 'name', role: 'role', activate: 'act' };
const REDUCED = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const METRICS = [
  { key: 'addressCount', label: 'Addresses', icon: FiMapPin, tone: 'em' },
  { key: 'repairCount', label: 'Repairs', icon: FiTool, tone: 'teal' },
  { key: 'orderCount', label: 'Orders', icon: FiShoppingBag, tone: 'cyan' },
  { key: 'reviewCount', label: 'Reviews', icon: FiStar, tone: 'lime' },
];

/* ---------- Neo-brutalist style (shared language with the Shops page, small shadows) ---------- */

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

const TONE_BG = { em: '#34d399', teal: '#2dd4bf', lime: '#a3e635', cyan: '#22d3ee', red: '#fb7185' };

const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });
const NUM_FMT = new Intl.NumberFormat('en-US');

const isNotAdmin = (token) => {
  try {
    const raw = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const p = JSON.parse(atob(raw));
    const found = [p.role, p.roles, p.authorities, p.scope, localStorage.getItem('role')]
      .flat().filter(Boolean).join(' ').toUpperCase();
    return found !== '' && !found.includes('ADMIN');
  } catch { return false; }
};

const CTRL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const clean = (v) => String(v ?? '').replace(CTRL, '');

const SEARCH_MAX = 60;
const sanitizeSearch = (v) => clean(v).replace(/[<>]/g, '').replace(/\s{2,}/g, ' ').slice(0, SEARCH_MAX);

const isSafeId = (id) => /^[A-Za-z0-9_-]{1,64}$/.test(String(id));
const errText = (err) => String(err?.response?.data?.message || '').slice(0, 120) || undefined;
const fullName = (u) => `${u.firstName || ''} ${u.lastName || ''}`.trim();
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const toCount = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

const deleteErrText = (err) => {
  const status = err?.response?.status;
  const server = errText(err);
  if (status === 409) return server || 'This user has linked records (orders, repairs or a shop). Suspend the account instead.';
  if (status === 403) return server || 'You are not allowed to delete this account.';
  if (status === 404) return server || 'This user no longer exists. Refresh the list.';
  if (status === 405) return 'The server does not allow deleting users (DELETE /api/admin/users/:id). Ask the backend team to enable it.';
  if (status >= 500) return server || 'The server could not delete this user. It may still have linked records.';
  if (!err?.response) return 'Network error. Check your connection and try again.';
  return server || 'Something went wrong. Try again.';
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

const StatusPill = memo(({ active }) => (
  <span className="nb-chip" style={{ background: active ? '#34d399' : '#fb7185', color: '#04261a' }}>
    <span className="w-1.5 h-1.5 bg-[#04261a]" aria-hidden="true" />
    {active ? 'Active' : 'Suspended'}
  </span>
));

const MetricChips = memo(({ user }) => (
  <div className="flex items-center gap-1.5">
    {METRICS.map(({ key, label, icon: Icon, tone }) => {
      const n = toCount(user[key]);
      return (
        <span
          key={key}
          title={`${label}: ${NUM_FMT.format(n)}`}
          aria-label={`${label}: ${NUM_FMT.format(n)}`}
          className={`nb-chip !px-1.5 tabular-nums ${n ? '' : 'nb-chip-n'}`}
          style={n ? { background: TONE_BG[tone], color: '#04261a' } : undefined}
        >
          <Icon size={11} aria-hidden="true" />
          {NUM_FMT.format(n)}
        </span>
      );
    })}
  </div>
));

const MetricTile = memo(({ label, value, icon, tone }) => (
  <div className={`${PANEL} p-3 flex items-center gap-2.5 min-w-0`}>
    <IconTile icon={icon} tone={value ? tone : 'em'} className="w-9 h-9" size={15} />
    <div className="min-w-0">
      <p className="text-lg font-extrabold tabular-nums leading-none truncate">{NUM_FMT.format(value)}</p>
      <p className="nb-muted mt-1 text-[10px] font-bold uppercase truncate">{label}</p>
    </div>
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

const UserRow = memo(({ user, busy, pendingRole, onView, onToggle, onDelete, onPickRole, onSaveRole }) => {
  const name = clean(fullName(user)) || 'Unnamed user';
  const dirty = !!pendingRole && pendingRole !== user.role;
  const unknownRole = user.role && !ROLES.includes(user.role);

  return (
    <tr className="transition-colors motion-reduce:transition-none">
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <span className="nb-tile w-9 h-9 text-sm font-extrabold uppercase" style={{ background: TONE_BG.em }}>
            {name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase truncate max-w-[220px]">{name}</p>
            <p className="nb-muted text-[10px] font-semibold truncate max-w-[220px]">{clean(user.email) || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap"><MetricChips user={user} /></td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <select
            value={pendingRole || user.role || ''}
            onChange={(e) => onPickRole(user.id, e.target.value)}
            disabled={busy}
            aria-label={`Role for ${name}`}
            className="nb-btn h-8 pl-2.5 pr-1.5 text-xs uppercase"
          >
            {unknownRole && <option value={user.role}>{clean(user.role)}</option>}
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          {dirty && (
            <>
              <button type="button" disabled={busy} onClick={() => onSaveRole(user.id, pendingRole)} className="nb-btn nb-btn-a px-2.5 h-8 text-[11px] uppercase"><FiCheck size={13} /> Save</button>
              <button type="button" aria-label="Discard role change" onClick={() => onPickRole(user.id, user.role)} className={BTN_ICON}><FiX size={13} /></button>
            </>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap"><StatusPill active={!!user.activate} /></td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <button type="button" title="View details" aria-label="View details" onClick={() => onView(user)} className={BTN_ICON}><FiInfo size={14} /></button>
          <button
            type="button"
            disabled={busy}
            title={user.activate ? 'Suspend account' : 'Activate account'}
            aria-label={user.activate ? 'Suspend account' : 'Activate account'}
            onClick={() => onToggle(user)}
            className={`${BTN_ICON} ${user.activate ? '!text-amber-600 dark:!text-amber-300' : '!text-emerald-700 dark:!text-emerald-300'}`}
          >
            {user.activate ? <FiPause size={14} /> : <FiCheck size={14} />}
          </button>
          <button type="button" disabled={busy} title="Delete user" aria-label="Delete user" onClick={() => onDelete(user)} className={`${BTN_ICON} !text-red-600 dark:!text-red-300`}><FiTrash2 size={14} /></button>
        </div>
      </td>
    </tr>
  );
});

const UserModal = memo(({ user, onClose, onCopy }) => {
  useEscape(onClose);
  const rows = [
    { icon: FiUser, label: 'Name', value: clean(fullName(user)) || 'N/A' },
    { icon: FiMail, label: 'Email', value: clean(user.email) || 'N/A' },
    { icon: FiPhone, label: 'Phone', value: clean(user.phone) || 'N/A', ltr: true },
    { icon: FiBriefcase, label: 'Role', value: clean(user.role) || 'N/A' },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="User details" className="nb-card relative w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        <div className="nb-gray nb-line px-5 py-3.5 border-b-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <IconTile icon={FiUser} tone="cyan" className="w-9 h-9" size={16} />
            <div>
              <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">User details</span></h3>
              <p className="nb-muted mt-1 text-[10px] font-bold">Account overview and activity</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={BTN_ICON}><FiX size={15} /></button>
        </div>

        <div className="px-5 py-4 space-y-3 overflow-y-auto slim-scroll">
          <div className={`${PANEL} p-3 flex items-center gap-2.5`}>
            <FiHash size={15} className="nb-ic flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="nb-muted text-[9px] font-bold uppercase">User ID</p>
              <code className="block text-xs font-mono font-bold truncate">{clean(user.id) || 'N/A'}</code>
            </div>
            <button type="button" aria-label="Copy user ID" title="Copy user ID" onClick={() => onCopy(user.id)} className={BTN_ICON}><FiCopy size={13} /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {rows.map(({ icon: Icon, label, value, ltr }) => (
              <div key={label} className={`${PANEL} p-3 flex items-center gap-2.5`}>
                <Icon size={15} className="nb-ic flex-shrink-0" />
                <div className="min-w-0">
                  <p className="nb-muted text-[9px] font-bold uppercase">{label}</p>
                  <p dir={ltr ? 'ltr' : undefined} className="text-xs font-extrabold truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`${PANEL} p-3 flex items-center gap-2.5`}>
            {user.activate ? <FiCheckCircle size={15} className="nb-ic" /> : <FiXCircle size={15} className="text-red-500" />}
            <div>
              <p className="nb-muted mb-1 text-[9px] font-bold uppercase">Status</p>
              <StatusPill active={!!user.activate} />
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />Activity</p>
            <div className="grid grid-cols-2 gap-2.5">
              {METRICS.map(({ key, label, icon, tone }) => (
                <MetricTile key={key} label={label} icon={icon} tone={tone} value={toCount(user[key])} />
              ))}
            </div>
          </div>
        </div>

        <div className="nb-gray nb-line px-5 py-3.5 border-t-2 flex justify-end flex-shrink-0">
          <button type="button" onClick={onClose} className={`${BTN_MD} uppercase`}>Close</button>
        </div>
      </div>
    </div>
  );
});

const ConfirmDeleteModal = memo(({ user, busy, onClose, onConfirm }) => {
  const guard = useCallback(() => { if (!busy) onClose(); }, [busy, onClose]);
  useEscape(guard);
  const name = clean(fullName(user)) || 'Unnamed user';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={guard} aria-hidden="true" />
      <div role="alertdialog" aria-modal="true" aria-label="Delete user" className="nb-card relative w-full max-w-sm overflow-hidden">
        <div className="nb-gray nb-line px-5 py-4 flex items-center gap-3 border-b-2">
          <IconTile icon={FiTrash2} tone="red" className="w-10 h-10" size={16} />
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold uppercase">Delete user?</h3>
            <p className="nb-muted text-[11px] font-semibold">This will permanently remove the account.</p>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className={`${PANEL} p-3 flex items-center gap-2.5`}>
            <FiUser size={15} className="nb-ic flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase truncate">{name}</p>
              <p className="nb-muted text-[10px] font-semibold truncate">{clean(user.email) || clean(user.id)}</p>
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

const UsersPage = () => {
  const navigate = useNavigate();
  const darkMode = useDarkMode();
  const tokenRef = useRef(localStorage.getItem('authToken'));
  const denied = useMemo(() => !tokenRef.current || isNotAdmin(tokenRef.current), []);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });
  const [roleUpdates, setRoleUpdates] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());

  const inflight = useRef(new Set());
  const abortRef = useRef(null);
  const detailAbort = useRef(null);

  const term = useDeferredValue(search).trim().toLowerCase();
  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${tokenRef.current}` }), []);

  useEffect(() => { document.title = 'Admin - Users'; }, []);
  useEffect(() => { ensureNbFont(); }, []);

  useEffect(() => {
    if (!tokenRef.current) { navigate('/login', { replace: true }); return; }
    if (denied) { toast({ icon: 'error', title: 'Access denied', text: 'Admin accounts only.' }); navigate('/login', { replace: true }); }
  }, [navigate, denied]);

  const fetchUsers = useCallback(async ({ silent = false } = {}) => {
    if (!tokenRef.current || denied) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (!silent) setLoading(true);
    setError(false);
    try {
      const { data } = await api.get('/api/admin/users', {
        params: { page: 0, size: 200 },
        headers: authHeaders(),
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted) return;
      setUsers(Array.isArray(data) ? data : data?.content || []);
      setLastUpdated(new Date());
    } catch (err) {
      if (ctrl.signal.aborted || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
      const status = err?.response?.status;
      if (status === 401) navigate('/login', { replace: true });
      else if (status === 403) { toast({ icon: 'error', title: 'Access denied', text: 'Admin accounts only.' }); navigate('/login', { replace: true }); }
      else { setError(true); toast({ icon: 'error', title: 'Failed to load users', text: errText(err) }); }
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [navigate, denied, authHeaders]);

  useEffect(() => {
    fetchUsers();
    return () => { abortRef.current?.abort(); detailAbort.current?.abort(); };
  }, [fetchUsers]);

  const withBusy = useCallback(async (id, task) => {
    if (!isSafeId(id) || inflight.current.has(id)) return;
    inflight.current.add(id);
    setBusyIds(new Set(inflight.current));
    try { await task(encodeURIComponent(id)); } finally {
      inflight.current.delete(id);
      setBusyIds(new Set(inflight.current));
    }
  }, []);

  const setActive = useCallback((id, activate) => withBusy(id, async (eid) => {
    const patch = (value) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, activate: value } : u)));
    patch(activate);
    try {
      await api.put(`/api/admin/users/${eid}/${activate ? 'activate' : 'deactivate'}`, {}, { headers: authHeaders() });
      toast({ icon: 'success', title: activate ? 'User activated' : 'User suspended' });
    } catch (err) {
      patch(!activate);
      toast({ icon: 'error', title: 'Action failed', text: errText(err) });
    }
  }), [withBusy, authHeaders]);

  const requestDelete = useCallback((user) => setDeleteTarget(user), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  const confirmDelete = useCallback(async () => {
    const user = deleteTarget;
    if (!user) return;
    if (!isSafeId(user.id)) {
      toast({ icon: 'error', title: 'Delete failed', text: 'This account has an ID that cannot be sent to the server.' });
      setDeleteTarget(null);
      return;
    }
    const name = clean(fullName(user)) || 'The user';
    await withBusy(user.id, async (eid) => {
      try {
        await api.delete(`/api/admin/users/${eid}`, { headers: authHeaders() });
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setRoleUpdates((prev) => { const n = { ...prev }; delete n[user.id]; return n; });
        setSelectedUser((prev) => (prev && prev.id === user.id ? null : prev));
        toast({ icon: 'success', title: 'User deleted', text: `${name} was removed permanently.` });
      } catch (err) {
        toast({ icon: 'error', title: 'Delete failed', text: deleteErrText(err) });
      }
    });
    setDeleteTarget(null);
  }, [deleteTarget, withBusy, authHeaders]);

  const saveRole = useCallback((id, role) => {
    const next = String(role).trim().toUpperCase();
    if (!ROLES.includes(next)) { toast({ icon: 'error', title: 'Invalid role' }); return; }
    return withBusy(id, async (eid) => {
      try {
        await api.put(`/api/admin/users/${eid}`, { role: next }, { headers: authHeaders() });
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: next } : u)));
        setRoleUpdates((prev) => { const n = { ...prev }; delete n[id]; return n; });
        toast({ icon: 'success', title: 'Role updated' });
      } catch (err) {
        toast({ icon: 'error', title: 'Update failed', text: errText(err) });
      }
    });
  }, [withBusy, authHeaders]);

  const viewUser = useCallback(async (user) => {
    setSelectedUser(user);
    if (!isSafeId(user.id)) return;
    detailAbort.current?.abort();
    const ctrl = new AbortController();
    detailAbort.current = ctrl;
    try {
      const { data } = await api.get(`/api/admin/users/${encodeURIComponent(user.id)}`, { headers: authHeaders(), signal: ctrl.signal });
      if (!ctrl.signal.aborted) setSelectedUser((prev) => (prev && prev.id === user.id ? { ...prev, ...data } : prev));
    } catch {}
  }, [authHeaders]);

  const index = useMemo(() => users.map((u) => {
    const name = fullName(u).toLowerCase();
    const email = String(u.email || '').toLowerCase();
    return {
      u, name, email,
      role: String(u.role || '').toLowerCase(),
      act: u.activate ? 1 : 0,
      text: `${name} ${email} ${String(u.phone || '').toLowerCase()} ${String(u.id ?? '').toLowerCase()}`,
    };
  }), [users]);

  const counts = useMemo(() => {
    let active = 0; let admins = 0;
    for (const u of users) { if (u.activate) active += 1; if (u.role === 'ADMIN') admins += 1; }
    return { all: users.length, active, suspended: users.length - active, admins };
  }, [users]);

  const filtered = useMemo(() => {
    const key = SORT_KEY[sort.field] || 'name';
    const dir = sort.dir === 'asc' ? 1 : -1;
    const list = index.filter((e) => (
      (tab === 'all' || (tab === 'active' ? e.act === 1 : e.act === 0))
      && (!term || e.text.includes(term))
    ));
    list.sort((a, b) => (a[key] < b[key] ? -dir : a[key] > b[key] ? dir : 0));
    return list.map((e) => e.u);
  }, [index, tab, term, sort]);

  useEffect(() => { setCurrentPage(1); }, [tab, term, rowsPerPage, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);

  const statCards = useMemo(() => [
    { label: 'Total users', value: NUM_FMT.format(counts.all), description: 'All registered accounts', icon: FiUsers, tone: 'em', percent: counts.all ? 100 : 0, color: '#34d399' },
    { label: 'Active', value: NUM_FMT.format(counts.active), description: 'Authorized to sign in', icon: FiCheckCircle, tone: 'teal', percent: pct(counts.active, counts.all), color: '#2dd4bf' },
    { label: 'Suspended', value: NUM_FMT.format(counts.suspended), description: 'Access is blocked', icon: FiShield, tone: 'red', percent: pct(counts.suspended, counts.all), color: '#fb7185' },
    { label: 'Admins', value: NUM_FMT.format(counts.admins), description: 'Full platform access', icon: FiBriefcase, tone: 'lime', percent: pct(counts.admins, counts.all), color: '#a3e635' },
  ], [counts]);

  const handleSort = useCallback((field) => setSort((s) => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' })), []);
  const handleCopy = useCallback(async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ icon: 'success', title: 'Copied', text: 'User ID copied to clipboard.', timer: 2000 });
    } catch {
      toast({ icon: 'error', title: 'Could not copy', text: 'Allow clipboard access in your browser.' });
    }
  }, []);
  const handleToggle = useCallback((u) => setActive(u.id, !u.activate), [setActive]);
  const handlePickRole = useCallback((id, role) => setRoleUpdates((prev) => ({ ...prev, [id]: role })), []);
  const closeModal = useCallback(() => { detailAbort.current?.abort(); setSelectedUser(null); }, []);
  const refresh = useCallback(() => fetchUsers(), [fetchUsers]);

  if (denied) return null;

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
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />Accounts</p>
            <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
              <UnderlinedTitle text="Users Console" />
            </h1>
            <p className="nb-muted mt-2 text-sm font-medium">Manage platform authority and the account lifecycle</p>
          </div>
          <div className="flex items-center gap-2.5">
            {lastUpdated && <p className="nb-muted hidden sm:block text-[11px] font-bold">Last updated: {TIME_FMT.format(lastUpdated)}</p>}
            <button type="button" onClick={refresh} aria-label="Refresh" title="Refresh" className={`${BTN_MD} h-10 uppercase`}>
              <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} /> Refresh
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
                aria-label="Search users"
                placeholder="Search by name, email, phone or ID"
                onChange={(e) => setSearch(sanitizeSearch(e.target.value))}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
              />
            </div>
            <RowsDropdown value={rowsPerPage} onChange={setRowsPerPage} />
          </div>

          <div role="tablist" aria-label="Account status" className="nb-line flex gap-2 overflow-x-auto p-3 sm:px-4 border-b-2 [scrollbar-width:none]">
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
                  <span className="nb-chip tabular-nums">{NUM_FMT.format(counts[key])}</span>
                </button>
              );
            })}
          </div>

          <div className="overflow-auto max-h-[68vh] slim-scroll">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead className="nb-gray sticky top-0 z-10 shadow-[0_2px_0_0_var(--nb-line)]">
                <tr>
                  <SortTh label="User" field="name" sort={sort} onSort={handleSort} />
                  <th scope="col" className="px-3 py-3 text-left text-[11px] font-extrabold uppercase">Activity</th>
                  <SortTh label="Role" field="role" sort={sort} onSort={handleSort} />
                  <SortTh label="Status" field="activate" sort={sort} onSort={handleSort} />
                  <th scope="col" className="px-3 py-3 text-left text-[11px] font-extrabold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="nb-rows">
                {loading && users.length === 0 ? (
                  Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {Array.from({ length: 5 }, (__, j) => (
                        <td key={j} className="px-3 py-4"><div className="nb-gray h-3.5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : error && users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <FiAlertCircle size={28} className="mx-auto text-red-500" />
                      <p className="mt-2 text-sm font-extrabold uppercase">Couldn't load users</p>
                      <p className="nb-muted text-xs mb-4">Check your connection and try again.</p>
                      <button type="button" onClick={refresh} className={`${BTN_MD} nb-btn-a uppercase`}><FiRefreshCw size={13} /> Try again</button>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14">
                      <EmptyState3D kind="box" title="No users found" subtitle="The list is empty or nothing matches your search" darkMode={darkMode} />
                    </td>
                  </tr>
                ) : (
                  paginated.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      busy={busyIds.has(u.id)}
                      pendingRole={roleUpdates[u.id]}
                      onView={viewUser}
                      onToggle={handleToggle}
                      onDelete={requestDelete}
                      onPickRole={handlePickRole}
                      onSaveRole={saveRole}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="nb-gray nb-line px-4 py-3 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-semibold">
                Showing <b className="tabular-nums">{NUM_FMT.format(from)}–{NUM_FMT.format(to)}</b> of <b className="tabular-nums">{NUM_FMT.format(filtered.length)}</b> users
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} />}
            </div>
          )}
        </section>
      </div>

      {selectedUser && <UserModal user={selectedUser} onClose={closeModal} onCopy={handleCopy} />}

      {deleteTarget && (
        <ConfirmDeleteModal
          user={deleteTarget}
          busy={busyIds.has(deleteTarget.id)}
          onClose={closeDelete}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default memo(UsersPage);