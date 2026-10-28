import React, {
  useState, useEffect, useMemo, useCallback, useRef, useDeferredValue, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiX, FiCopy, FiTrash2, FiEdit3, FiInfo, FiChevronLeft, FiChevronRight,
  FiChevronUp, FiChevronDown, FiDownload, FiRefreshCw, FiPackage, FiCheckCircle,
  FiXCircle, FiAlertCircle, FiDollarSign, FiAlignLeft, FiTag, FiUpload, FiRotateCcw,
} from 'react-icons/fi';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../components/user/UiExtras';

const ROWS_OPTIONS = [5, 10, 20, 50];
const SEARCH_MAX = 60;
const CONDITIONS = ['NEW', 'USED', 'REFURBISHED'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_ACCEPT = IMAGE_TYPES.join(',');
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_CONFIG = { timeout: 120_000 };
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'inStock', label: 'In stock' },
  { key: 'outOfStock', label: 'Out of stock' },
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
.nb-input{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);outline:none}
.nb-input:focus{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-input::placeholder{opacity:.6}
.nb select option{background:var(--nb-card);color:var(--nb-ink)}
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
const BTN_PRIMARY = 'nb-btn nb-btn-a px-3 py-2 text-xs';
const PANEL = 'nb-gray nb-line border-2 border-dotted';
const FIELD = 'nb-input w-full h-10 px-3 text-sm font-semibold';
const LABEL = 'nb-muted block text-[10px] font-bold uppercase mb-1.5';

const TONE_BG = { em: '#34d399', teal: '#2dd4bf', lime: '#a3e635', cyan: '#22d3ee', amber: '#fbbf24', red: '#fb7185' };

const COND_BG = { NEW: '#34d399', USED: '#fbbf24', REFURBISHED: '#22d3ee' };

const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });
const NF = new Intl.NumberFormat('en-US');
const fmt = (n) => NF.format(n);

const CTRL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const clean = (v) => String(v ?? '').replace(CTRL, '');
const sanitizeSearch = (v) => clean(v).replace(/[<>]/g, '').replace(/\s{2,}/g, ' ').slice(0, SEARCH_MAX);
const isSafeId = (id) => /^[A-Za-z0-9_-]{1,64}$/.test(String(id));
const errText = (err) => String(err?.response?.data?.message || '').slice(0, 120) || undefined;
const isCanceled = (err) => err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const money = (v) => (v || v === 0 ? `${fmt(num(v))} EGP` : '—');
const stockOf = (p) => num(p.stock);
const unitsText = (n) => `${fmt(n)} ${n === 1 ? 'unit' : 'units'}`;
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const nextSort = (s, field) => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });

const apiOrigin = () => {
  const base = String(api?.defaults?.baseURL || '').trim();
  if (/^https?:\/\//i.test(base)) return base.replace(/\/+$/, '').replace(/\/api$/i, '');
  return typeof window !== 'undefined' ? window.location.origin : '';
};

const imageSrc = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const value = raw.trim();
  if (!value) return '';
  if (/^(https?:|blob:)/i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return '';
  return `${apiOrigin()}${value.startsWith('/') ? value : `/${value}`}`;
};

const uploadErrText = (err) => {
  const status = err?.response?.status;
  if (status === 413) return 'Image is too large (max 5MB).';
  if (status === 415) return 'Unsupported image type. Use JPEG, PNG or WebP.';
  if (err?.code === 'ECONNABORTED') return 'Upload timed out. Try again.';
  return errText(err);
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

const ProductImage = memo(({ src, name, size = 'sm' }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) {
    if (size === 'lg') return null;
    return <span className="nb-tile w-9 h-9 text-sm font-extrabold uppercase" style={{ background: TONE_BG.em }}>{name.charAt(0)}</span>;
  }
  return size === 'lg' ? (
    <div className={`${PANEL} w-full h-40 overflow-hidden flex items-center justify-center`}>
      <img src={src} alt={name} loading="lazy" decoding="async" onError={() => setFailed(true)} className="max-h-full max-w-full object-contain" />
    </div>
  ) : (
    <img src={src} alt="" width="36" height="36" loading="lazy" decoding="async" onError={() => setFailed(true)} className="nb-line nb-gray w-9 h-9 border-2 object-cover flex-shrink-0" />
  );
});

const Tabs = memo(({ tabs, value, onChange, counts }) => (
  <div role="tablist" aria-label="Stock status" className="nb-line flex gap-2 overflow-x-auto p-3 sm:px-4 border-b-2 [scrollbar-width:none]">
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

const CondPill = memo(({ condition }) => {
  const bg = COND_BG[condition];
  return (
    <span className={`nb-chip ${bg ? '' : 'nb-chip-n'}`} style={bg ? { background: bg, color: '#04261a' } : undefined}>
      <span className="w-1.5 h-1.5 bg-current" aria-hidden="true" />
      {clean(condition) || 'Unset'}
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

const PlainTh = ({ children }) => (
  <th scope="col" className="px-3 py-3 text-left text-[11px] font-extrabold uppercase">{children}</th>
);

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

const ProductRow = memo(({ product: p, busy, onView, onEdit, onDelete, onCopy }) => {
  const name = clean(p.name) || 'Unnamed product';
  const stock = stockOf(p);
  return (
    <tr className="transition-colors motion-reduce:transition-none">
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <ProductImage src={imageSrc(p.imageUrl)} name={name} />
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase truncate max-w-[220px]">{name}</p>
            <p className="nb-muted text-[10px] font-semibold truncate max-w-[220px]">{clean(p.categoryName) || '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5">
          <code className="nb-muted text-[11px] font-mono font-bold max-w-[90px] truncate block">{clean(p.id)}</code>
          <button type="button" title="Copy product ID" aria-label="Copy product ID" onClick={() => onCopy(p.id)} className="nb-muted hover:text-emerald-500 transition-colors"><FiCopy size={12} /></button>
        </span>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap text-xs font-extrabold tabular-nums">{money(p.price)}</td>
      <td className="px-3 py-2.5 whitespace-nowrap"><CondPill condition={p.condition} /></td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className="nb-chip tabular-nums" style={{ background: stock > 0 ? '#34d399' : '#fb7185', color: '#04261a' }}>{unitsText(stock)}</span>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <button type="button" title="View details" aria-label="View details" onClick={() => onView(p)} className={BTN_ICON}><FiInfo size={14} /></button>
          <button type="button" disabled={busy} title="Edit product" aria-label="Edit product" onClick={() => onEdit(p)} className={`${BTN_ICON} !text-amber-600 dark:!text-amber-300`}><FiEdit3 size={14} /></button>
          <button type="button" disabled={busy} title="Delete product" aria-label="Delete product" onClick={() => onDelete(p)} className={`${BTN_ICON} !text-red-600 dark:!text-red-300`}><FiTrash2 size={14} /></button>
        </div>
      </td>
    </tr>
  );
});

const ModalShell = ({ title, subtitle, icon, tone = 'cyan', onClose, children, footer }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
    <div role="dialog" aria-modal="true" aria-label={title} className="nb-card relative w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden">
      <div className="nb-gray nb-line px-5 py-3.5 border-b-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <IconTile icon={icon} tone={tone} className="w-9 h-9" size={16} />
          <div>
            <h3 className="text-sm font-extrabold uppercase"><span className="nb-ul">{title}</span></h3>
            {subtitle}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className={BTN_ICON}><FiX size={15} /></button>
      </div>
      <div className="px-5 py-4 overflow-y-auto slim-scroll">{children}</div>
      <div className="nb-gray nb-line px-5 py-3.5 border-t-2 flex justify-end gap-2 flex-shrink-0">{footer}</div>
    </div>
  </div>
);

const DetailsModal = memo(({ product: p, onClose, onCopy }) => {
  useEscape(onClose);
  const name = clean(p.name) || 'Unnamed product';
  const stock = stockOf(p);
  const rows = [
    { icon: FiTag, label: 'Category', value: clean(p.category?.name) || '—' },
    { icon: FiDollarSign, label: 'Price', value: money(p.price) },
  ];
  return (
    <ModalShell
      title="Product details"
      icon={FiPackage}
      onClose={onClose}
      subtitle={(
        <p className="nb-muted mt-1 flex items-center gap-1.5 text-[10px] font-bold font-mono">
          {clean(p.id).slice(0, 12)}
          <button type="button" aria-label="Copy product ID" onClick={() => onCopy(p.id)} className="hover:text-emerald-500 transition-colors"><FiCopy size={10} /></button>
        </p>
      )}
      footer={<button type="button" onClick={onClose} className={`${BTN_MD} uppercase`}>Close</button>}
    >
      <div className="space-y-2.5">
        <ProductImage src={imageSrc(p.imageUrl)} name={name} size="lg" />
        <div className="flex flex-wrap gap-2">
          <CondPill condition={p.condition} />
          <span className="nb-chip tabular-nums" style={{ background: stock > 0 ? '#34d399' : '#fb7185', color: '#04261a' }}>{unitsText(stock)}</span>
        </div>
        <div className={`${PANEL} p-3`}>
          <p className="nb-muted text-[9px] font-bold uppercase">Product name</p>
          <p className="text-xs font-extrabold break-words">{clean(p.name) || '—'}</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className={`${PANEL} p-3 flex items-center gap-2.5`}>
              <Icon size={15} className="nb-ic flex-shrink-0" />
              <div className="min-w-0">
                <p className="nb-muted text-[9px] font-bold uppercase">{label}</p>
                <p className="text-xs font-extrabold truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={`${PANEL} p-3 flex items-start gap-2.5`}>
          <FiAlignLeft size={15} className="nb-ic flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="nb-muted text-[9px] font-bold uppercase">Description</p>
            <p className="text-xs font-semibold whitespace-pre-line break-words">{clean(p.description) || '—'}</p>
          </div>
        </div>
      </div>
    </ModalShell>
  );
});

const EditModal = memo(({ form, categories, saving, onChange, onClose, onSubmit }) => {
  useEscape(onClose);
  const fileRef = useRef(null);
  const catNames = useMemo(() => [...new Set([form.categoryName, ...categories.map((c) => c.name)].filter(Boolean))], [form.categoryName, categories]);
  const name = clean(form.name) || 'Product';

  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!form.imageFile) { setPreview(''); return undefined; }
    const url = URL.createObjectURL(form.imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.imageFile]);

  const shownSrc = preview || imageSrc(form.imageUrl);

  const pickImage = useCallback((e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast({ icon: 'error', title: 'Unsupported image', text: 'Use a JPEG, PNG or WebP file.' });
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      toast({ icon: 'error', title: 'Image too large', text: 'Maximum size is 5MB.' });
      return;
    }
    onChange('imageFile', file);
  }, [onChange]);

  const openPicker = useCallback(() => fileRef.current?.click(), []);
  const undoImage = useCallback(() => onChange('imageFile', null), [onChange]);
  const bind = useCallback((field) => (e) => onChange(field, e.target.value), [onChange]);

  return (
    <ModalShell
      title="Edit product"
      icon={FiEdit3}
      tone="amber"
      onClose={onClose}
      footer={(
        <>
          <button type="button" onClick={onClose} disabled={saving} className={`${BTN_MD} uppercase`}>Cancel</button>
          <button type="button" onClick={onSubmit} disabled={saving} className={`${BTN_PRIMARY} uppercase`}>
            {saving && <FiRefreshCw size={13} className="animate-spin motion-reduce:animate-none" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </>
      )}
    >
      <div className="mb-3 space-y-2">
        <ProductImage src={shownSrc} name={name} size="lg" />
        <input ref={fileRef} type="file" accept={IMAGE_ACCEPT} onChange={pickImage} className="hidden" aria-label="Product image" />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={saving} onClick={openPicker} className={`${BTN_MD} uppercase`}>
            <FiUpload size={13} /> {shownSrc ? 'Change image' : 'Upload image'}
          </button>
          {form.imageFile && (
            <button type="button" disabled={saving} onClick={undoImage} className={`${BTN_MD} uppercase`}>
              <FiRotateCcw size={13} /> Undo
            </button>
          )}
          <span className="nb-muted text-[10px] font-semibold truncate max-w-[180px]">
            {form.imageFile ? form.imageFile.name : 'JPEG, PNG or WebP · max 5MB'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label htmlFor="pf-name" className={LABEL}>Product name</label>
          <input id="pf-name" type="text" maxLength={150} value={form.name} onChange={bind('name')} className={FIELD} />
        </div>
        <div>
          <label htmlFor="pf-price" className={LABEL}>Price (EGP)</label>
          <input id="pf-price" type="number" inputMode="decimal" min="0" step="0.01" value={form.price} onChange={bind('price')} className={FIELD} />
        </div>
        <div>
          <label htmlFor="pf-stock" className={LABEL}>Stock</label>
          <input id="pf-stock" type="number" inputMode="numeric" min="0" step="1" value={form.stockQuantity} onChange={bind('stockQuantity')} className={FIELD} />
        </div>
        <div>
          <label htmlFor="pf-cat" className={LABEL}>Category</label>
          <select id="pf-cat" value={form.categoryName} onChange={bind('categoryName')} className={FIELD}>
            <option value="">Select category</option>
            {catNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pf-cond" className={LABEL}>Condition</label>
          <select id="pf-cond" value={form.condition} onChange={bind('condition')} className={FIELD}>
            <option value="">Select condition</option>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-3">
        <label htmlFor="pf-desc" className={LABEL}>Description</label>
        <textarea id="pf-desc" rows={4} maxLength={2000} value={form.description} onChange={bind('description')} className={`${FIELD} h-auto py-2 resize-none`} />
      </div>
    </ModalShell>
  );
});

const ConfirmDeleteModal = memo(({ product, busy, onClose, onConfirm }) => {
  const guard = useCallback(() => { if (!busy) onClose(); }, [busy, onClose]);
  useEscape(guard);
  const name = clean(product.name) || 'Unnamed product';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={guard} aria-hidden="true" />
      <div role="alertdialog" aria-modal="true" aria-label="Delete product" className="nb-card relative w-full max-w-sm overflow-hidden">
        <div className="nb-gray nb-line px-5 py-4 flex items-center gap-3 border-b-2">
          <IconTile icon={FiTrash2} tone="red" className="w-10 h-10" size={16} />
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold uppercase">Delete product?</h3>
            <p className="nb-muted text-[11px] font-semibold">This will remove it from all catalogues.</p>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className={`${PANEL} p-3 flex items-center gap-2.5`}>
            <FiPackage size={15} className="nb-ic flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase truncate">{name}</p>
              <p className="nb-muted text-[10px] font-semibold truncate">{clean(product.category?.name) || clean(product.id)}</p>
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

const SKELETON_ROWS = Array.from({ length: 8 }, (_, i) => i);
const SKELETON_CELLS = Array.from({ length: 6 }, (_, i) => i);

const AdminProducts = () => {
  const navigate = useNavigate();
  const darkMode = useDarkMode();
  const tokenRef = useRef(localStorage.getItem('authToken'));
  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${tokenRef.current}` }), []);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });
  const [detail, setDetail] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyIds, setBusyIds] = useState(() => new Set());

  const inflight = useRef(new Set());
  const abortRef = useRef(null);
  const detailAbort = useRef(null);
  const catAbort = useRef(null);

  const term = useDeferredValue(search).trim().toLowerCase();

  useEffect(() => { document.title = 'Admin - Products'; }, []);
  useEffect(() => { ensureNbFont(); }, []);

  const fetchProducts = useCallback(async ({ silent = false } = {}) => {
    if (!tokenRef.current) { navigate('/login', { replace: true }); return; }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (!silent) setLoading(true);
    setError(false);
    try {
      const { data } = await api.get('/api/admin/products', {
        headers: authHeaders(),
        params: { page: 0, size: 500 },
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted) return;
      setProducts(Array.isArray(data) ? data : data?.content || []);
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

  const fetchCategories = useCallback(async () => {
    if (!tokenRef.current) return;
    catAbort.current?.abort();
    const ctrl = new AbortController();
    catAbort.current = ctrl;
    try {
      const { data } = await api.get('/api/admin/categories', { headers: authHeaders(), signal: ctrl.signal });
      if (!ctrl.signal.aborted) setCategories(Array.isArray(data) ? data : data?.content || []);
    } catch {}
  }, [authHeaders]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    return () => { abortRef.current?.abort(); detailAbort.current?.abort(); catAbort.current?.abort(); };
  }, [fetchProducts, fetchCategories]);

  const withBusy = useCallback(async (id, task) => {
    if (!isSafeId(id) || inflight.current.has(String(id))) return;
    inflight.current.add(String(id));
    setBusyIds(new Set(inflight.current));
    try { await task(encodeURIComponent(id)); } finally {
      inflight.current.delete(String(id));
      setBusyIds(new Set(inflight.current));
    }
  }, []);

  const requestDelete = useCallback((p) => setDeleteTarget(p), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);

  const confirmDelete = useCallback(async () => {
    const p = deleteTarget;
    if (!p) return;
    await withBusy(p.id, async (eid) => {
      try {
        await api.delete(`/api/admin/products/${eid}`, { headers: authHeaders() });
        setProducts((prev) => prev.filter((x) => x.id !== p.id));
        toast({ icon: 'success', title: 'Product deleted' });
      } catch (err) {
        toast({ icon: 'error', title: 'Delete failed', text: errText(err) });
      }
    });
    setDeleteTarget(null);
  }, [deleteTarget, withBusy, authHeaders]);

  const viewProduct = useCallback(async (p) => {
    setDetail(p);
    if (!isSafeId(p.id)) return;
    detailAbort.current?.abort();
    const ctrl = new AbortController();
    detailAbort.current = ctrl;
    try {
      const { data } = await api.get(`/api/admin/products/${encodeURIComponent(p.id)}`, { headers: authHeaders(), signal: ctrl.signal });
      if (!ctrl.signal.aborted) setDetail((prev) => (prev && prev.id === p.id ? { ...prev, ...data } : prev));
    } catch {}
  }, [authHeaders]);

  const closeDetail = useCallback(() => { detailAbort.current?.abort(); setDetail(null); }, []);

  const hasCategories = categories.length > 0;
  const openEdit = useCallback((p) => {
    if (!hasCategories) fetchCategories();
    setEditForm({
      id: p.id,
      name: p.name || '',
      description: p.description || '',
      price: p.price ?? '',
      imageUrl: p.imageUrl || '',
      imageFile: null,
      categoryName: p.category?.name || '',
      stockQuantity: p.stock ?? '',
      condition: p.condition || '',
    });
  }, [hasCategories, fetchCategories]);

  const changeField = useCallback((field, value) => setEditForm((f) => (f ? { ...f, [field]: value } : f)), []);
  const closeEdit = useCallback(() => { if (!saving) setEditForm(null); }, [saving]);

  const submitEdit = useCallback(async () => {
    if (!editForm || saving) return;
    const price = Number(editForm.price);
    const stock = Number(editForm.stockQuantity);
    const name = clean(editForm.name).trim();
    let problem = '';
    if (!name) problem = 'Enter a product name.';
    else if (editForm.price === '' || !Number.isFinite(price) || price <= 0) problem = 'Enter a price greater than 0.';
    else if (!editForm.categoryName) problem = 'Choose a category.';
    else if (editForm.stockQuantity === '' || !Number.isInteger(stock) || stock < 0) problem = 'Stock must be a whole number, 0 or more.';
    if (problem) { toast({ icon: 'error', title: 'Check the form', text: problem }); return; }
    if (!isSafeId(editForm.id)) return;

    const imageUrl = editForm.imageUrl || null;
    const description = clean(editForm.description);
    const { imageFile } = editForm;

    const fd = new FormData();
    fd.append('data', new Blob([JSON.stringify({
      name,
      description,
      price,
      imageUrl,
      categoryName: editForm.categoryName,
      stockQuantity: stock,
      condition: editForm.condition,
    })], { type: 'application/json' }));
    if (imageFile) fd.append('image', imageFile);

    setSaving(true);
    try {
      await api.put(`/api/admin/products/${encodeURIComponent(editForm.id)}`, fd, { headers: authHeaders(), ...UPLOAD_CONFIG });
      setProducts((prev) => prev.map((p) => (p.id === editForm.id ? {
        ...p,
        name,
        description,
        price,
        ...(imageFile ? {} : { imageUrl }),
        stock,
        condition: editForm.condition,
        category: { ...(p.category || {}), name: editForm.categoryName },
      } : p)));
      toast({ icon: 'success', title: 'Product updated' });
      setEditForm(null);
      fetchProducts({ silent: true });
    } catch (err) {
      toast({ icon: 'error', title: 'Update failed', text: uploadErrText(err) });
    } finally {
      setSaving(false);
    }
  }, [editForm, saving, authHeaders, fetchProducts]);

  const { index, counts } = useMemo(() => {
    let inStock = 0;
    const rows = products.map((p) => {
      const name = clean(p.name).toLowerCase();
      const stock = stockOf(p);
      if (stock > 0) inStock += 1;
      return {
        p, name, stock,
        price: num(p.price),
        cond: clean(p.condition).toLowerCase(),
        text: `${name} ${clean(p.description).toLowerCase()} ${String(p.id ?? '').toLowerCase()}`,
      };
    });
    return { index: rows, counts: { all: rows.length, inStock, outOfStock: rows.length - inStock } };
  }, [products]);

  const filtered = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1;
    const key = sort.field;
    const list = index.filter((e) => (
      (tab === 'all' || (tab === 'inStock' ? e.stock > 0 : e.stock <= 0))
      && (!term || e.text.includes(term))
    ));
    list.sort((a, b) => (a[key] < b[key] ? -dir : a[key] > b[key] ? dir : 0));
    return list;
  }, [index, tab, term, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);

  const statCards = useMemo(() => [
    { label: 'Total products', value: fmt(counts.all), description: 'All catalogue listings', icon: FiPackage, tone: 'em', percent: counts.all ? 100 : 0, color: '#34d399' },
    { label: 'In stock', value: fmt(counts.inStock), description: 'Available to order', icon: FiCheckCircle, tone: 'teal', percent: pct(counts.inStock, counts.all), color: '#2dd4bf' },
    { label: 'Out of stock', value: fmt(counts.outOfStock), description: 'Needs restocking', icon: FiXCircle, tone: 'red', percent: pct(counts.outOfStock, counts.all), color: '#fb7185' },
  ], [counts]);

  const handleSearch = useCallback((e) => { setSearch(sanitizeSearch(e.target.value)); setCurrentPage(1); }, []);
  const handleTab = useCallback((key) => { setTab(key); setCurrentPage(1); }, []);
  const handleRows = useCallback((n) => { setRowsPerPage(n); setCurrentPage(1); }, []);
  const handleSort = useCallback((field) => { setSort((s) => nextSort(s, field)); setCurrentPage(1); }, []);
  const handleCopy = useCallback(async (id) => {
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ icon: 'success', title: 'Copied', text: 'Product ID copied to clipboard.', timer: 2000 });
    } catch {
      toast({ icon: 'error', title: 'Could not copy', text: 'Allow clipboard access in your browser.' });
    }
  }, []);
  const refresh = useCallback(() => fetchProducts(), [fetchProducts]);

  const exportCSV = useCallback(() => {
    downloadCSV(
      'products.csv',
      ['ID', 'Name', 'Category', 'Price (EGP)', 'Condition', 'Stock', 'Description'],
      filtered.map(({ p }) => [p.id, clean(p.name), clean(p.category?.name), p.price, clean(p.condition), stockOf(p), clean(p.description)]),
    );
  }, [filtered]);

  const hasData = products.length > 0;
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
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />Catalogue</p>
            <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
              <UnderlinedTitle text="Products Console" />
            </h1>
            <p className="nb-muted mt-2 text-sm font-medium">Manage product listings and inventory levels</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
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
                aria-label="Search products"
                placeholder="Search by name, description or ID"
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
                <tr>
                  <SortTh label="Product" field="name" sort={sort} onSort={handleSort} />
                  <PlainTh>ID</PlainTh>
                  <SortTh label="Price" field="price" sort={sort} onSort={handleSort} />
                  <SortTh label="Condition" field="cond" sort={sort} onSort={handleSort} />
                  <SortTh label="Stock" field="stock" sort={sort} onSort={handleSort} />
                  <PlainTh>Actions</PlainTh>
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
                    <td colSpan={6} className="px-6 py-14 text-center">
                      <FiAlertCircle size={28} className="mx-auto text-red-500" />
                      <p className="mt-2 text-sm font-extrabold uppercase">Couldn't load products</p>
                      <p className="nb-muted text-xs mb-4">Check your connection and try again.</p>
                      <button type="button" onClick={refresh} className={`${BTN_MD} nb-btn-a uppercase`}><FiRefreshCw size={13} /> Try again</button>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-14">
                      <EmptyState3D kind="box" title="No products found" subtitle="The list is empty or nothing matches your search" darkMode={darkMode} />
                    </td>
                  </tr>
                ) : (
                  paginated.map(({ p }) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      busy={busyIds.has(String(p.id))}
                      onView={viewProduct}
                      onEdit={openEdit}
                      onDelete={requestDelete}
                      onCopy={handleCopy}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="nb-gray nb-line px-4 py-3 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-semibold">
                Showing <b className="tabular-nums">{fmt(from)}–{fmt(to)}</b> of <b className="tabular-nums">{fmt(filtered.length)}</b> products
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} />}
            </div>
          )}
        </section>
      </div>

      {detail && <DetailsModal product={detail} onClose={closeDetail} onCopy={handleCopy} />}
      {editForm && (
        <EditModal form={editForm} categories={categories} saving={saving} onChange={changeField} onClose={closeEdit} onSubmit={submitEdit} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          product={deleteTarget}
          busy={busyIds.has(String(deleteTarget.id))}
          onClose={closeDelete}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default memo(AdminProducts);