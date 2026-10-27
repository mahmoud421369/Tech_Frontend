import React, {
  useState, useEffect, useMemo, useCallback, useRef, useDeferredValue, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus, FiEdit3, FiTrash2, FiCopy, FiSearch, FiX, FiChevronLeft, FiChevronRight,
  FiChevronDown, FiChevronUp, FiGrid, FiRefreshCw, FiLayers, FiAlertCircle, FiPackage,
  FiShoppingBag, FiShoppingCart, FiTool, FiCheckCircle,
} from 'react-icons/fi';
import api from '../common/api/api';
import useAuthStore from '../common/store/Auth';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../components/user/UiExtras';

const ROWS_OPTIONS = [5, 10, 20, 50];
const MAX_NAME = 255;
const SEARCH_MAX = 60;
const UNSAFE_CHARS = /[<>]/;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const REDUCED = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const METRICS = [
  { key: 'products', label: 'Products', hint: 'Products in this category', icon: FiPackage, tone: 'em' },
  { key: 'shops', label: 'Shops', hint: 'Shops selling products in this category', icon: FiShoppingBag, tone: 'teal' },
  { key: 'repairs', label: 'Repairs', hint: 'Repair requests for this category', icon: FiTool, tone: 'cyan' },
  { key: 'ordered', label: 'Ordered', hint: 'Order items from this category', icon: FiShoppingCart, tone: 'lime' },
];

const ZERO_STATS = Object.freeze({ products: 0, shops: 0, repairs: 0, ordered: 0 });

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
.nb-chip{display:inline-flex;align-items:center;justify-content:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5;white-space:nowrap}
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
const BTN_PRIMARY = 'nb-btn nb-btn-a px-4 py-2 text-xs uppercase';
const PANEL = 'nb-gray nb-line border-2 border-dotted';

const TONE_BG = { em: '#34d399', teal: '#2dd4bf', lime: '#a3e635', cyan: '#22d3ee', red: '#fb7185' };

const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });
const NUM_FMT = new Intl.NumberFormat('en-US');
const fmt = (n) => NUM_FMT.format(n);

const displayName = (str) => String(str ?? '').replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim();
const normalizeName = (str) => String(str ?? '').trim().replace(/\s+/g, ' ');
const sanitizeSearch = (v) => String(v ?? '').replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩<>]/g, '').replace(/\s{2,}/g, ' ').slice(0, SEARCH_MAX);
const isSafeId = (id) => /^[A-Za-z0-9_-]{1,64}$/.test(String(id));
const isCanceled = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const toCount = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};
const toList = (data) => (Array.isArray(data) ? data : data?.content || []);
const normStats = (s) => ({
  products: toCount(s?.productCount),
  shops: toCount(s?.shopCount),
  repairs: toCount(s?.repairCount),
  ordered: toCount(s?.orderedItemsCount),
});

const validateName = (raw, list, editingId) => {
  const name = normalizeName(raw);
  if (!name) return 'Category name is required.';
  if (name.length > MAX_NAME) return `Name must be ${MAX_NAME} characters or fewer.`;
  if (UNSAFE_CHARS.test(name)) return 'Name cannot contain < or > characters.';
  if (CONTROL_CHARS.test(name)) return 'Name contains invalid characters.';
  const lower = name.toLowerCase();
  if (list.some((c) => c.id !== editingId && normalizeName(c.name).toLowerCase() === lower)) {
    return 'A category with this name already exists.';
  }
  return '';
};

const safeMessage = (err, fallback, conflictMsg = 'A category with this name already exists.') => {
  switch (err?.response?.status) {
    case 400: return 'Invalid category data. Please check the name and try again.';
    case 401: return 'Your session has expired. Please log in again.';
    case 403: return 'You do not have permission to do this.';
    case 404: return 'This category no longer exists.';
    case 409: return conflictMsg;
    default: return fallback;
  }
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

const copyId = async (id) => {
  try {
    await navigator.clipboard.writeText(String(id));
    toast({ icon: 'success', title: 'Copied', text: 'Category ID copied to clipboard.', timer: 2000 });
  } catch {
    toast({ icon: 'error', title: 'Could not copy', text: 'Allow clipboard access in your browser.' });
  }
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

const CountPill = memo(({ value, tone, ready, label }) => {
  const on = ready && value > 0;
  return (
    <span
      title={ready ? `${label}: ${fmt(value)}` : label}
      className={`nb-chip min-w-[40px] tabular-nums ${on ? '' : 'nb-chip-n'}`}
      style={on ? { background: TONE_BG[tone], color: '#04261a' } : undefined}
    >
      {ready ? fmt(value) : '—'}
    </span>
  );
});

const MetricTile = memo(({ label, value, icon, tone }) => (
  <div className={`${PANEL} p-3 flex items-center gap-2.5 min-w-0`}>
    <IconTile icon={icon} tone={value ? tone : 'em'} className="w-9 h-9" size={15} />
    <div className="min-w-0">
      <p className="text-lg font-extrabold tabular-nums leading-none truncate">{fmt(value)}</p>
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

const SortTh = memo(({ label, field, sort, onSort, title }) => {
  const active = sort.field === field;
  return (
    <th scope="col" className="px-3 py-3 text-left text-[11px] font-extrabold uppercase" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" title={title} onClick={() => onSort(field)} className="inline-flex items-center gap-1 uppercase hover:underline underline-offset-4">
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

const CategoryRow = memo(({ category, name, stats, busy, onEdit, onDelete }) => (
  <tr className="transition-colors motion-reduce:transition-none">
    <td className="px-3 py-2.5 whitespace-nowrap">
      <div className="flex items-center gap-2.5">
        <span className="nb-tile w-9 h-9 text-sm font-extrabold uppercase" style={{ background: TONE_BG.em }}>
          {name.charAt(0) || '?'}
        </span>
        <p className="text-xs font-extrabold uppercase truncate max-w-[240px]">{name || 'Unnamed category'}</p>
      </div>
    </td>
    {METRICS.map(({ key, label, tone }) => (
      <td key={key} className="px-3 py-2.5 whitespace-nowrap">
        <CountPill value={stats ? stats[key] : 0} tone={tone} ready={!!stats} label={label} />
      </td>
    ))}
    <td className="px-3 py-2.5 whitespace-nowrap">
      <span className="inline-flex items-center gap-1.5">
        <code className="text-[11px] font-mono font-bold max-w-[110px] truncate block">{String(category.id)}</code>
        <button type="button" title="Copy category ID" aria-label="Copy category ID" onClick={() => copyId(category.id)} className="nb-muted hover:text-[color:var(--nb-accent)] transition-colors"><FiCopy size={12} /></button>
      </span>
    </td>
    <td className="px-3 py-2.5 whitespace-nowrap">
      <div className="flex items-center gap-1.5">
        <button type="button" disabled={busy} title="Edit category" aria-label="Edit category" onClick={() => onEdit(category)} className={BTN_ICON}><FiEdit3 size={14} /></button>
        <button type="button" disabled={busy} title="Delete category" aria-label="Delete category" onClick={() => onDelete(category)} className={`${BTN_ICON} !text-red-600 dark:!text-red-300`}><FiTrash2 size={14} /></button>
      </div>
    </td>
  </tr>
));

const CategoryModal = memo(({ editingCategory, stats, value, error, onChange, onClose, onSubmit, loading }) => {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={editingCategory ? 'Edit category' : 'Add category'} className="nb-card relative w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden">
        <div className="nb-gray nb-line px-5 py-3.5 border-b-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <IconTile icon={editingCategory ? FiEdit3 : FiPlus} tone="cyan" className="w-9 h-9" size={16} />
            <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">{editingCategory ? 'Edit category' : 'Add category'}</span></h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={BTN_ICON}><FiX size={15} /></button>
        </div>

        <div className="px-5 py-4 space-y-3 overflow-y-auto slim-scroll">
          {editingCategory && (
            <div className={`${PANEL} p-3 flex items-center justify-between gap-2`}>
              <div className="min-w-0">
                <p className="nb-muted text-[9px] font-bold uppercase">Category ID</p>
                <p className="text-[11px] font-mono font-bold truncate">{String(editingCategory.id)}</p>
              </div>
              <button type="button" onClick={() => copyId(editingCategory.id)} aria-label="Copy category ID" className={BTN_ICON}><FiCopy size={13} /></button>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="category-name" className="text-[11px] font-extrabold uppercase">Category name</label>
              <span className={`text-[10px] font-bold tabular-nums ${value.length > MAX_NAME ? 'text-red-500' : 'nb-muted'}`}>{value.length}/{MAX_NAME}</span>
            </div>
            <input
              id="category-name"
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. Smartphones"
              maxLength={MAX_NAME}
              autoComplete="off"
              autoFocus
              aria-invalid={!!error}
              aria-describedby={error ? 'category-name-err' : undefined}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              className={`nb-field w-full h-10 px-3 text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60 ${error ? '!border-red-500' : ''}`}
            />
            {error && <p id="category-name-err" role="alert" className="mt-1.5 text-[11px] font-bold text-red-500">{error}</p>}
          </div>

          {editingCategory && stats && (
            <div>
              <p className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />Usage</p>
              <div className="grid grid-cols-2 gap-2.5">
                {METRICS.map(({ key, label, icon, tone }) => (
                  <MetricTile key={key} label={label} icon={icon} tone={tone} value={stats[key]} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="nb-gray nb-line px-5 py-3.5 border-t-2 flex gap-2.5 flex-shrink-0">
          <button type="button" onClick={onClose} className={`${BTN_MD} flex-1 uppercase`}>Cancel</button>
          <button type="button" onClick={onSubmit} disabled={loading || !value.trim() || !!error} className={`${BTN_PRIMARY} flex-1`}>
            {loading ? 'Saving…' : editingCategory ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
});

const ConfirmDeleteModal = memo(({ category, name, stats, busy, onClose, onConfirm }) => {
  const guard = useCallback(() => { if (!busy) onClose(); }, [busy, onClose]);
  useEscape(guard);
  const inUse = stats && (stats.products > 0 || stats.repairs > 0 || stats.ordered > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={guard} aria-hidden="true" />
      <div role="alertdialog" aria-modal="true" aria-label="Delete category" className="nb-card relative w-full max-w-sm overflow-hidden">
        <div className="nb-gray nb-line px-5 py-4 flex items-center gap-3 border-b-2">
          <IconTile icon={FiTrash2} tone="red" className="w-10 h-10" size={16} />
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold uppercase">Delete category?</h3>
            <p className="nb-muted text-[11px] font-semibold">This will permanently delete the category.</p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className={`${PANEL} p-3 flex items-center gap-2.5`}>
            <FiLayers size={15} className="nb-ic flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase truncate">{name || 'Unnamed category'}</p>
              <p className="nb-muted text-[10px] font-semibold truncate">{String(category.id)}</p>
            </div>
          </div>
          {inUse && (
            <div role="alert" className="nb-line flex items-start gap-2.5 border-2 border-dashed p-3" style={{ background: '#fcd34d', color: '#04261a' }}>
              <FiAlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <p className="text-[11px] font-bold">
                This category is linked to {fmt(stats.products)} products, {fmt(stats.repairs)} repairs and {fmt(stats.ordered)} ordered items, so deleting it may be blocked.
              </p>
            </div>
          )}
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

const Categories = () => {
  const navigate = useNavigate();
  const darkMode = useDarkMode();
  const accessToken = useAuthStore((s) => s.accessToken);
  const roles = useAuthStore((s) => s.roles);
  const isAdmin = Array.isArray(roles) && roles.some((r) => /admin/i.test(String(r)));

  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ field: null, dir: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyIds, setBusyIds] = useState(() => new Set());

  const abortRef = useRef(null);
  const savingRef = useRef(false);
  const inflight = useRef(new Set());

  const term = useDeferredValue(search).trim().toLowerCase();

  useEffect(() => { document.title = 'Admin - Categories'; }, []);
  useEffect(() => { ensureNbFont(); }, []);

  useEffect(() => {
    if (!accessToken) navigate('/login');
    else if (Array.isArray(roles) && roles.length > 0 && !isAdmin) navigate('/');
  }, [accessToken, roles, isAdmin, navigate]);

  const fetchCategories = useCallback(async ({ silent = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!silent) setLoading(true);
    setError(false);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get('/api/admin/categories', { params: { page: 0, size: 200 }, signal: controller.signal }),
        api.get('/api/admin/categories/stats', { signal: controller.signal }).catch((e) => {
          if (isCanceled(e)) throw e;
          return null;
        }),
      ]);
      if (controller.signal.aborted) return;
      setCategories(toList(listRes.data));
      setStats(statsRes ? toList(statsRes.data) : null);
      setLastUpdated(new Date());
    } catch (err) {
      if (isCanceled(err)) return;
      if (err?.response?.status === 401) navigate('/login');
      else { setError(true); toast({ icon: 'error', title: 'Sync failed', text: safeMessage(err, 'Could not load categories.') }); }
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!accessToken) return undefined;
    fetchCategories();
    return () => abortRef.current?.abort();
  }, [fetchCategories, accessToken]);

  const statsMap = useMemo(
    () => (stats ? new Map(stats.map((s) => [s.id, normStats(s)])) : null),
    [stats],
  );

  const nameError = useMemo(
    () => (categoryName ? validateName(categoryName, categories, editingCategory?.id) : ''),
    [categoryName, categories, editingCategory],
  );

  const openCreate = useCallback(() => { setEditingCategory(null); setCategoryName(''); setIsModalOpen(true); }, []);
  const openEdit = useCallback((c) => { setEditingCategory(c); setCategoryName(displayName(c.name)); setIsModalOpen(true); }, []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const requestDelete = useCallback((c) => setDeleteTarget(c), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  const saveCategory = useCallback(async () => {
    if (savingRef.current) return;
    const err = validateName(categoryName, categories, editingCategory?.id);
    if (err) { toast({ icon: 'warning', title: 'Check the name', text: err }); return; }
    const name = normalizeName(categoryName);

    savingRef.current = true;
    setSaving(true);
    try {
      if (editingCategory) {
        if (!isSafeId(editingCategory.id)) throw new Error('bad id');
        await api.put(`/api/admin/categories/${encodeURIComponent(editingCategory.id)}`, { name });
        toast({ icon: 'success', title: 'Category updated' });
      } else {
        await api.post('/api/admin/categories', { name });
        toast({ icon: 'success', title: 'Category created' });
      }
      setCategoryName('');
      setEditingCategory(null);
      setIsModalOpen(false);
      fetchCategories({ silent: true });
    } catch (e) {
      if (e?.response?.status === 401) navigate('/login');
      else toast({ icon: 'error', title: 'Save failed', text: safeMessage(e, 'Could not save the category.') });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [categoryName, categories, editingCategory, fetchCategories, navigate]);

  const confirmDelete = useCallback(async () => {
    const category = deleteTarget;
    if (!category) return;
    const id = category.id;
    if (!isSafeId(id)) {
      toast({ icon: 'error', title: 'Delete failed', text: 'This category has an ID that cannot be sent to the server.' });
      setDeleteTarget(null);
      return;
    }
    if (inflight.current.has(id)) return;

    inflight.current.add(id);
    setBusyIds(new Set(inflight.current));
    try {
      await api.delete(`/api/admin/categories/${encodeURIComponent(id)}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast({ icon: 'success', title: 'Category deleted' });
    } catch (e) {
      if (e?.response?.status === 401) navigate('/login');
      else toast({ icon: 'error', title: 'Delete failed', text: safeMessage(e, 'Could not delete the category.', 'This category is in use by products and cannot be deleted.') });
    } finally {
      inflight.current.delete(id);
      setBusyIds(new Set(inflight.current));
      setDeleteTarget(null);
    }
  }, [deleteTarget, navigate]);

  const index = useMemo(() => categories.map((c) => {
    const name = displayName(c.name);
    return { c, name, lower: name.toLowerCase(), s: statsMap ? statsMap.get(c.id) || ZERO_STATS : null };
  }), [categories, statsMap]);

  const filtered = useMemo(() => {
    const list = term ? index.filter((e) => e.lower.includes(term)) : [...index];
    if (sort.field) {
      const d = sort.dir === 'asc' ? 1 : -1;
      const f = sort.field;
      const val = (e) => (f === 'name' ? e.lower : e.s ? e.s[f] : 0);
      list.sort((a, b) => {
        const av = val(a);
        const bv = val(b);
        return av < bv ? -d : av > bv ? d : 0;
      });
    }
    return list;
  }, [index, term, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);

  const statCards = useMemo(() => {
    const ready = !!statsMap;
    let products = 0;
    let inUse = 0;
    let matchProducts = 0;
    if (ready) {
      for (const e of index) {
        products += e.s.products;
        if (e.s.products > 0) inUse += 1;
      }
      for (const e of filtered) matchProducts += e.s.products;
    }
    return [
      { label: 'Total categories', value: fmt(categories.length), description: 'In the catalog registry', icon: FiGrid, tone: 'em', percent: categories.length ? 100 : 0, color: '#34d399' },
      { label: 'Matching results', value: fmt(filtered.length), description: term ? 'Matches your search' : 'Showing everything', icon: FiLayers, tone: 'teal', percent: pct(filtered.length, categories.length), color: '#2dd4bf' },
      { label: 'Products', value: ready ? fmt(products) : '—', description: 'Across all categories', icon: FiPackage, tone: 'cyan', percent: pct(matchProducts, products), color: '#22d3ee' },
      { label: 'In use', value: ready ? fmt(inUse) : '—', description: 'Categories with products', icon: FiCheckCircle, tone: 'lime', percent: ready ? pct(inUse, categories.length) : 0, color: '#a3e635' },
    ];
  }, [categories.length, filtered, index, statsMap, term]);

  const deleteName = useMemo(() => (deleteTarget ? displayName(deleteTarget.name) : ''), [deleteTarget]);
  const editingStats = editingCategory && statsMap ? statsMap.get(editingCategory.id) || ZERO_STATS : null;
  const deleteStats = deleteTarget && statsMap ? statsMap.get(deleteTarget.id) || ZERO_STATS : null;

  const handleSearch = useCallback((e) => { setSearch(sanitizeSearch(e.target.value)); setCurrentPage(1); }, []);
  const handleRows = useCallback((n) => { setRowsPerPage(n); setCurrentPage(1); }, []);
  const handleSort = useCallback((field) => {
    const first = field === 'name' ? 'asc' : 'desc';
    const second = field === 'name' ? 'desc' : 'asc';
    setSort((s) => {
      if (s.field !== field) return { field, dir: first };
      if (s.dir === first) return { field, dir: second };
      return { field: null, dir: 'asc' };
    });
    setCurrentPage(1);
  }, []);
  const refresh = useCallback(() => fetchCategories(), [fetchCategories]);

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
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />Catalog</p>
            <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
              <UnderlinedTitle text="Product Categories" />
            </h1>
            <p className="nb-muted mt-2 text-sm font-medium">Define and organize the platform catalog structure</p>
          </div>
          <div className="flex items-center gap-2.5">
            {lastUpdated && <p className="nb-muted hidden sm:block text-[11px] font-bold">Last updated: {TIME_FMT.format(lastUpdated)}</p>}
            <button type="button" onClick={refresh} aria-label="Refresh" title="Refresh" className={`${BTN_MD} h-10 uppercase`}>
              <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} /> Refresh
            </button>
            <button type="button" onClick={openCreate} className={`${BTN_PRIMARY} h-10`}><FiPlus size={15} /> New category</button>
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
                aria-label="Search categories"
                placeholder="Search categories"
                onChange={handleSearch}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
              />
            </div>
            <RowsDropdown value={rowsPerPage} onChange={handleRows} />
          </div>

          <div className="overflow-auto max-h-[68vh] slim-scroll">
            <table className="w-full min-w-[920px] text-left border-collapse">
              <thead className="nb-gray sticky top-0 z-10 shadow-[0_2px_0_0_var(--nb-line)]">
                <tr>
                  <SortTh label="Category" field="name" sort={sort} onSort={handleSort} />
                  {METRICS.map(({ key, label, hint }) => (
                    <SortTh key={key} label={label} field={key} title={hint} sort={sort} onSort={handleSort} />
                  ))}
                  <th scope="col" className="px-3 py-3 text-left text-[11px] font-extrabold uppercase">ID</th>
                  <th scope="col" className="px-3 py-3 text-left text-[11px] font-extrabold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="nb-rows">
                {loading && categories.length === 0 ? (
                  Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {Array.from({ length: 7 }, (__, j) => (
                        <td key={j} className="px-3 py-4"><div className="nb-gray h-3.5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : error && categories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <FiAlertCircle size={28} className="mx-auto text-red-500" />
                      <p className="mt-2 text-sm font-extrabold uppercase">Couldn't load categories</p>
                      <p className="nb-muted text-xs mb-4">Check your connection and try again.</p>
                      <button type="button" onClick={refresh} className={`${BTN_MD} nb-btn-a uppercase`}><FiRefreshCw size={13} /> Try again</button>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14">
                      <EmptyState3D kind="box" title="No categories found" subtitle="The list is empty or nothing matches your search" darkMode={darkMode} />
                    </td>
                  </tr>
                ) : (
                  paginated.map((e) => (
                    <CategoryRow
                      key={e.c.id}
                      category={e.c}
                      name={e.name}
                      stats={e.s}
                      busy={busyIds.has(e.c.id)}
                      onEdit={openEdit}
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
                Showing <b className="tabular-nums">{fmt(from)}–{fmt(to)}</b> of <b className="tabular-nums">{fmt(filtered.length)}</b> categories
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} />}
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <CategoryModal
          editingCategory={editingCategory}
          stats={editingStats}
          value={categoryName}
          error={nameError}
          onChange={setCategoryName}
          onClose={closeModal}
          onSubmit={saveCategory}
          loading={saving}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          category={deleteTarget}
          name={deleteName}
          stats={deleteStats}
          busy={busyIds.has(deleteTarget.id)}
          onClose={closeDelete}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default memo(Categories);