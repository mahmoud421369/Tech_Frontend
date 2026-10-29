import React, {
  useState, useEffect, useCallback, useMemo, useRef, useDeferredValue, memo, Suspense, lazy,
} from 'react';
import {
  FiPackage, FiPlus, FiSearch, FiFilter, FiEdit3, FiTrash2, FiRefreshCw, FiCheckCircle,
  FiTag, FiX, FiLayers, FiAlertCircle, FiImage, FiChevronLeft, FiChevronRight, FiChevronUp,
  FiChevronDown, FiCheck, FiBox,
} from 'react-icons/fi';
import api from '../common/api/api';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import {
  SEARCH_MAX, fmt, num, formatPrice, tpl, renderTpl,
  getCollator, sanitizeSearch, isSafeId, errText, upper, confirmDialog, useDarkMode, useEscape,
  useShopLocale,
} from '../components/shop/TableKit';
import { ensureShopAssets } from '../common/utils/shopFonts';
import {
  CONDITIONS, EMPTY_PRODUCT, STOCK_MAX, rawImageOf, resolveImageSrc, validateProduct, buildFormData,
} from '../common/utils/productutils';

ensureShopAssets();

const ProductModal = lazy(() => import('../components/user/ProductModal'));

const PG_CSS = `
.pg{--pg-bg:#f9fafb;--pg-card:#ffffff;--pg-ink:#04261a;--pg-muted:#4b6b5c;--pg-line:#04261a;--pg-shadow:#04261a;--pg-gray:#e8ebe9;--pg-dot:#04261a;--pg-accent:#10b981;--pg-btn:#059669;--pg-on:#ffffff;background:var(--pg-bg);color:var(--pg-ink)}
.dark .pg{--pg-bg:#141414;--pg-card:#2a2a2a;--pg-ink:#ffffff;--pg-muted:#a3a3a3;--pg-line:#000000;--pg-shadow:#000000;--pg-gray:#1e1e1e;--pg-dot:#3f3f3f;--pg-accent:#39ff88;--pg-btn:#39ff88;--pg-on:#022c22}
.pg[dir="rtl"] *{letter-spacing:0!important}
.pg-gray{background:var(--pg-gray)}
.pg-muted{color:var(--pg-muted)}
.pg-line{border-color:var(--pg-line)}
.pg-dot{border:2px dotted var(--pg-dot)}
.pg-card{background:var(--pg-card);border:2px solid var(--pg-line);box-shadow:3px 3px 0 var(--pg-shadow)}
.pg-lift{transition:transform .15s ease,box-shadow .15s ease}
.pg-lift:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--pg-shadow)}
.pg-ul{text-decoration:underline;text-decoration-color:var(--pg-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
.pg-chip{display:inline-flex;align-items:center;gap:6px;background:var(--pg-card);color:var(--pg-ink);border:2px solid var(--pg-line);padding:1px 8px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.6;white-space:nowrap}
.pg-tile{display:inline-flex;align-items:center;justify-content:center;flex:none;border:2px solid var(--pg-line);background:var(--pg-accent);color:#04261a}
.pg-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--pg-card);color:var(--pg-ink);border:2px solid var(--pg-line);box-shadow:2px 2px 0 var(--pg-shadow);font-weight:700;cursor:pointer;white-space:nowrap;transition:transform .12s ease,box-shadow .12s ease}
.pg-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--pg-shadow)}
.pg-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--pg-shadow)}
.pg-btn:disabled{opacity:.45;cursor:not-allowed}
.pg-btn-a,.pg-btn[aria-pressed="true"],.pg-btn[aria-selected="true"],.pg-btn[aria-current="page"]{background:var(--pg-btn);color:var(--pg-on)}
.pg-btn-danger:hover:not(:disabled){background:#ef4444;color:#fff}
.pg-btn:focus-visible,.pg-sort:focus-visible,.pg-link:focus-visible{outline:3px solid var(--pg-accent);outline-offset:2px}
.pg-field{background:var(--pg-card);color:var(--pg-ink);border:2px solid var(--pg-line);box-shadow:2px 2px 0 var(--pg-shadow)}
.pg-field:focus,.pg-field:focus-within{outline:3px solid var(--pg-accent);outline-offset:2px}
.pg-field::placeholder{color:var(--pg-muted);opacity:.8}
.pg-th{background:var(--pg-gray);border-bottom:2px solid var(--pg-line);padding:12px;text-align:start;font-size:11px;font-weight:800;text-transform:uppercase;white-space:nowrap}
.pg-td{border-top:2px dotted var(--pg-dot)}
tbody tr:first-child .pg-td{border-top:0}
.pg-tr{transition:background-color .12s ease}
.pg-tr:hover{background:var(--pg-gray)}
.pg-zoom{cursor:zoom-in;display:inline-flex;flex:none}
.pg-zoom:disabled{cursor:default}
.pg-zoom:hover:not(:disabled) img{transform:scale(1.06)}
.pg-zoom img{transition:transform .15s ease}
.pg-scroll{scrollbar-width:thin;scrollbar-color:var(--pg-accent) transparent}
.pg-scroll::-webkit-scrollbar{width:6px;height:6px}
.pg-scroll::-webkit-scrollbar-track{background:transparent}
.pg-scroll::-webkit-scrollbar-thumb{background:var(--pg-accent);border:1px solid var(--pg-line)}
.pg-spin{border:4px solid var(--pg-accent);border-top-color:transparent;border-radius:50%;animation:pgSpin .8s linear infinite}
@keyframes pgSpin{to{transform:rotate(360deg)}}
@keyframes pgFade{from{opacity:0}to{opacity:1}}
@keyframes pgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.pg-fade{animation:pgFade .2s ease-out both}
.pg-in{animation:pgIn .15s ease-out both}
@media (prefers-reduced-motion:reduce){.pg-btn,.pg-lift,.pg-tr,.pg-zoom img{transition:none}.pg-fade,.pg-in,.pg-spin{animation:none}}
`;
const STYLE_EL = <style>{PG_CSS + EXTRAS_CSS}</style>;

const TONES = { sky: '#22d3ee', am: '#facc15', ro: '#fb7185', vi: '#a3e635', te: '#2dd4bf', em: '#34d399' };
const ROW_OPTIONS = [5, 10, 25, 50];

const DEFAULT_DISCOUNT_TYPE = 'PERCENTAGE';
const NEW_PRODUCT = {
  ...EMPTY_PRODUCT,
  specifications: '',
  discountType: DEFAULT_DISCOUNT_TYPE,
  discountValue: '',
};

const specsToText = (v) => (Array.isArray(v) ? v.filter(Boolean).join(', ') : v == null ? '' : String(v));

const toProductFormData = (data) => {
  const fd = buildFormData(data);
  if (!(fd instanceof FormData)) return fd;
  fd.set('specifications', specsToText(data.specifications));
  fd.delete('discountType');
  fd.delete('discountValue');
  if (parseFloat(data.discountValue) > 0) {
    fd.set('discountType', data.discountType || DEFAULT_DISCOUNT_TYPE);
    fd.set('discountValue', String(data.discountValue));
  }
  return fd;
};

const pageList = (page, total) => {
  const keep = new Set([1, total, page - 1, page, page + 1]);
  const nums = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
};

const useLockScroll = () => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
};

const Tile = memo(({ icon: Icon, tone = 'em', className = 'h-9 w-9', size = 16 }) => (
  <span className={`pg-tile ${className}`} style={{ background: TONES[tone] || TONES.em }}>
    <Icon size={size} aria-hidden="true" />
  </span>
));

const Empty = memo(({ title, subtitle }) => (
  <div className="flex flex-col items-center text-center gap-3">
    <span className="pg-tile h-16 w-16"><FiBox size={28} aria-hidden="true" /></span>
    <p className="text-base font-extrabold uppercase"><span className="pg-ul">{title}</span></p>
    <p className="pg-muted text-xs font-semibold max-w-xs">{subtitle}</p>
  </div>
));

const StatCard = memo(({ label, value, description, icon, tone }) => (
  <div className="pg-card pg-lift p-4 sm:p-5 flex items-center gap-3 min-w-0">
    <Tile icon={icon} tone={tone} className="h-11 w-11" size={20} />
    <div className="min-w-0">
      <p className="pg-muted text-[11px] font-bold uppercase truncate">{label}</p>
      <p className="text-2xl font-extrabold tracking-tight leading-tight tabular-nums truncate">{value}</p>
      <p className="pg-muted text-xs font-semibold truncate">{description}</p>
    </div>
  </div>
));

const RowsSelect = memo(({ value, onChange, label, formatNumber }) => {
  const options = ROW_OPTIONS.includes(value) ? ROW_OPTIONS : [...ROW_OPTIONS, value].sort((a, b) => a - b);
  const text = label || '{n}';
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={tpl(text, { n: '' }).trim()}
      className="pg-field h-10 px-3 text-sm font-bold cursor-pointer"
    >
      {options.map((n) => <option key={n} value={n}>{tpl(text, { n: formatNumber(n) })}</option>)}
    </select>
  );
});

const SortTh = memo(({ label, active, dir, onClick }) => (
  <th scope="col" className="pg-th" aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
    <button type="button" onClick={onClick} className="pg-sort inline-flex items-center gap-1 font-extrabold uppercase">
      {label}
      {active && dir === 'asc' ? <FiChevronUp size={13} aria-hidden="true" /> : <FiChevronDown size={13} aria-hidden="true" className={active ? '' : 'opacity-30'} />}
    </button>
  </th>
));

const Pagination = memo(({ page, total, onChange, labels, formatNumber }) => {
  const pages = useMemo(() => pageList(page, total), [page, total]);
  return (
    <nav aria-label={labels.paginationAria || 'Pagination'} className="flex items-center gap-1.5 flex-wrap justify-center">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={labels.prev || 'Previous'} className="pg-btn h-8 w-8">
        <FiChevronLeft size={14} className="rtl:rotate-180" aria-hidden="true" />
      </button>
      {pages.map((p) => (typeof p === 'string'
        ? <span key={p} className="pg-muted px-1 text-xs font-bold" aria-hidden="true">…</span>
        : (
          <button key={p} type="button" onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined} className="pg-btn h-8 min-w-[32px] px-2 text-xs tabular-nums">
            {formatNumber(p)}
          </button>
        )))}
      <button type="button" disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={labels.next || 'Next'} className="pg-btn h-8 w-8">
        <FiChevronRight size={14} className="rtl:rotate-180" aria-hidden="true" />
      </button>
    </nav>
  );
});

const Overlay = memo(({ onClose, children }) => {
  useLockScroll();
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="pg-fade absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      {children}
    </div>
  );
});

const FilterPanel = memo(({ title, note, groups, onReset, onClose, labels }) => {
  useEscape(onClose);
  useLockScroll();
  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div className="pg-fade absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label={title} className="pg-card pg-in relative w-full max-w-xs h-full flex flex-col !shadow-none border-y-0 border-e-0">
        <div className="pg-gray pg-line px-5 py-4 border-b-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold uppercase"><span className="pg-ul">{title}</span></h3>
          <button type="button" onClick={onClose} aria-label={labels.close || 'Close'} className="pg-btn h-8 w-8"><FiX size={15} aria-hidden="true" /></button>
        </div>
        <div className="flex-1 overflow-y-auto pg-scroll p-5 space-y-5">
          {note && <p className="pg-muted text-xs font-semibold">{note}</p>}
          {groups.map(([groupTitle, options, value, setter]) => (
            <fieldset key={groupTitle} className="space-y-2">
              <legend className="mb-2 text-[11px] font-extrabold uppercase">{groupTitle}</legend>
              {options.map((o) => (
                <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => setter(o.value)} className="pg-btn w-full justify-between px-3 h-10 text-xs uppercase">
                  {o.label}
                  {value === o.value && <FiCheck size={14} aria-hidden="true" />}
                </button>
              ))}
            </fieldset>
          ))}
        </div>
        <div className="pg-line p-4 border-t-2 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={onReset} className="pg-btn h-10 text-xs uppercase">{labels.reset || 'Reset'}</button>
          <button type="button" onClick={onClose} className="pg-btn pg-btn-a h-10 text-xs uppercase">{labels.apply || 'Apply'}</button>
        </div>
      </aside>
    </div>
  );
});

const LOW_STOCK = 5;
const TABS = ['all', ...CONDITIONS];
const UPLOAD_CONFIG = { timeout: 120_000 };

const uploadErrText = (err, u) => {
  const status = err?.response?.status;
  if (status === 413) return u.tooLarge;
  if (status === 415) return u.unsupported;
  if (err?.code === 'ECONNABORTED') return u.timeout;
  return errText(err);
};

const COND_DOT = { NEW: 'bg-emerald-500', USED: 'bg-amber-400', REFURBISHED: 'bg-blue-500' };
const STOCK_FILTER_KEYS = ['all', 'in', 'low', 'out'];
const SORT_KEYS = ['name', 'highest_price', 'lowest_price', 'highest_stock', 'lowest_stock'];

const stockMeta = (n, s) => {
  if (n <= 0) return { label: s.out, dot: 'bg-red-500' };
  if (n <= LOW_STOCK) return { label: s.low, dot: 'bg-amber-400' };
  return { label: s.in, dot: 'bg-emerald-500' };
};

const normalize = (p) => {
  const price = num(p.price);
  const apiFinal = num(p.finalPrice);
  return {
    ...p,
    condition: upper(p.condition),
    stock: Math.max(0, num(p.stock ?? p.stockQuantity)),
    price,
    finalPrice: apiFinal > 0 && apiFinal < price ? apiFinal : price,
    discountType: p.discountType || null,
    discountValue: num(p.discountValue),
    specifications: Array.isArray(p.specifications)
      ? p.specifications.filter(Boolean)
      : typeof p.specifications === 'string'
        ? p.specifications.split(/[\n,،]/).map((s) => s.trim()).filter(Boolean)
        : [],
    image: rawImageOf(p) || p.imageUrl || p.image_url || '',
  };
};

const ProductThumb = memo(({ raw, alt = '', className = 'w-12 h-12', iconSize = 18 }) => {
  const src = useMemo(() => resolveImageSrc(raw), [raw]);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setFailed(false); setLoaded(false); }, [src]);

  const showImage = src && !failed;

  return (
    <span className={`${className} pg-gray pg-line relative flex-shrink-0 overflow-hidden border-2 flex items-center justify-center`}>
      {showImage && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 motion-reduce:transition-none ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {(!showImage || !loaded) && (
        <FiImage size={iconSize} className={`pg-muted ${showImage ? 'animate-pulse motion-reduce:animate-none' : ''}`} aria-hidden="true" />
      )}
    </span>
  );
});

const ImagePreview = memo(({ product, closeLabel, onClose }) => {
  useEscape(onClose);
  const src = useMemo(() => resolveImageSrc(product.image), [product.image]);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const title = product.name || '';

  return (
    <Overlay onClose={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="pg-card pg-in relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden">
        <div className="pg-gray pg-line flex flex-shrink-0 items-center justify-between gap-3 border-b-2 px-5 py-3">
          <h3 className="min-w-0 truncate text-sm font-extrabold uppercase"><span className="pg-ul">{title || '—'}</span></h3>
          <button type="button" onClick={onClose} aria-label={closeLabel} className="pg-btn h-8 w-8 flex-shrink-0"><FiX size={15} aria-hidden="true" /></button>
        </div>
        <div className="pg-gray relative flex min-h-[220px] flex-1 items-center justify-center overflow-auto p-3">
          {src && !failed ? (
            <img
              src={src}
              alt={title}
              decoding="async"
              draggable={false}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className={`max-h-[72vh] max-w-full object-contain transition-opacity duration-200 motion-reduce:transition-none ${loaded ? 'opacity-100' : 'opacity-0'}`}
            />
          ) : (
            <FiImage size={48} className="pg-muted" aria-hidden="true" />
          )}
          {src && !failed && !loaded && <div className="pg-spin absolute h-8 w-8" aria-hidden="true" />}
        </div>
      </div>
    </Overlay>
  );
});

const Pill = memo(({ dot, children }) => (
  <span className="pg-chip">
    <span className={`pg-line w-2 h-2 border ${dot}`} />
    {children}
  </span>
));

const ProductRow = memo(({ product, busy, loc, onEdit, onDelete, onStock, onPreview }) => {
  const { L, fm } = loc;
  const t = L.products;
  const nf = fm.number;
  const sm = stockMeta(product.stock, t.stock);
  const hasImage = !!product.image;
  const discounted = product.finalPrice < product.price;
  const previewLabel = t.previewAria || t.imagePreview || 'Preview image';
  return (
    <tr className="pg-tr">
      <td className="pg-td px-3 py-2.5">
        <div className="flex items-center gap-3 min-w-[220px]">
          <button
            type="button"
            disabled={!hasImage}
            onClick={() => onPreview(product)}
            aria-label={hasImage ? previewLabel : undefined}
            title={hasImage ? previewLabel : undefined}
            className="pg-zoom pg-link"
          >
            <ProductThumb raw={product.image} alt="" className="w-14 h-14" iconSize={20} />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase truncate max-w-[240px]">{product.name || '—'}</p>
            <p className="pg-muted text-[10px] font-semibold truncate max-w-[240px]">{product.categoryName || t.uncategorized}</p>
          </div>
        </div>
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <Pill dot={COND_DOT[product.condition] || 'bg-gray-400'}>{t.conditions[product.condition] || product.condition || '—'}</Pill>
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <div className="flex flex-col gap-0.5">
          <span className="font-extrabold text-[13px] tabular-nums">{formatPrice(product.finalPrice, L.table.price, nf)}</span>
          {discounted && (
            <span className="pg-muted text-[10px] font-semibold tabular-nums line-through">{formatPrice(product.price, L.table.price, nf)}</span>
          )}
        </div>
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-extrabold tabular-nums ${product.stock > 0 ? '' : 'text-red-500'}`}>{nf.format(product.stock)}</span>
          <Pill dot={sm.dot}>{sm.label}</Pill>
        </div>
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <button type="button" disabled={busy} onClick={() => onStock(product)} className="pg-btn px-2.5 h-8 text-[11px] uppercase"><FiLayers size={12} aria-hidden="true" /> {t.stockBtn}</button>
          <button type="button" disabled={busy} title={t.editAria} aria-label={t.editAria} onClick={() => onEdit(product)} className="pg-btn h-8 w-8"><FiEdit3 size={14} aria-hidden="true" /></button>
          <button type="button" disabled={busy} title={t.deleteAria} aria-label={t.deleteAria} onClick={() => onDelete(product)} className="pg-btn pg-btn-danger h-8 w-8"><FiTrash2 size={14} aria-hidden="true" /></button>
        </div>
      </td>
    </tr>
  );
});

const StockModal = memo(({ product, busy, loc, onClose, onSubmit }) => {
  useEscape(onClose);
  const t = loc.L.products.stockModal;
  const nf = loc.fm.number;
  const [value, setValue] = useState(String(product.stock));
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const n = Number(value);
    if (value === '' || !Number.isInteger(n) || n < 0 || n > STOCK_MAX) { setError(tpl(t.invalid, { n: nf.format(STOCK_MAX) })); return; }
    onSubmit(n);
  };

  return (
    <Overlay onClose={onClose}>
      <form onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-label={t.title} className="pg-card pg-in relative w-full max-w-sm overflow-hidden">
        <div className="pg-gray pg-line px-5 py-4 border-b-2 flex items-center gap-3">
          <ProductThumb raw={product.image} alt="" className="w-10 h-10" iconSize={16} />
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold uppercase"><span className="pg-ul">{t.title}</span></h3>
            <p className="pg-muted mt-1 text-[11px] font-semibold truncate">{product.name} · {tpl(t.current, { n: nf.format(product.stock) })}</p>
          </div>
        </div>
        <div className="p-5 space-y-2">
          <label htmlFor="stock-new" className="text-[11px] font-extrabold uppercase">{t.newQty}</label>
          <input
            id="stock-new"
            type="text"
            inputMode="numeric"
            dir="ltr"
            autoFocus
            autoComplete="off"
            maxLength={7}
            value={value}
            aria-invalid={!!error}
            onChange={(e) => { setValue(e.target.value.replace(/\D/g, '')); setError(''); }}
            className="pg-field w-full h-12 text-lg font-extrabold text-center tabular-nums"
          />
          {error && <p role="alert" className="text-[11px] font-bold text-red-500">{error}</p>}
        </div>
        <div className="px-5 pb-5 flex gap-2.5">
          <button type="button" onClick={onClose} className="pg-btn flex-1 h-10 text-xs uppercase">{t.cancel}</button>
          <button type="submit" disabled={busy} className="pg-btn pg-btn-a flex-1 h-10 text-xs uppercase">{t.update}</button>
        </div>
      </form>
    </Overlay>
  );
});

const ModalFallback = memo(({ label }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="status" aria-label={label}>
    <div className="absolute inset-0 bg-black/60" />
    <div className="pg-spin relative w-10 h-10" />
  </div>
));

const Products = () => {
  const darkMode = useDarkMode();
  const loc = useShopLocale();
  const { language, L, fm, dir, font } = loc;
  const t = L.products;
  const tt = L.table;
  const nf = fm.number;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [conditionFilter, setConditionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [newProduct, setNewProduct] = useState(NEW_PRODUCT);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stockId, setStockId] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());

  const productsRef = useRef(products);
  const inflight = useRef(new Set());
  const savingRef = useRef(false);
  const abortRef = useRef(null);
  const categoriesAbortRef = useRef(null);
  const tRef = useRef(t);
  const ttRef = useRef(tt);
  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { tRef.current = t; ttRef.current = tt; }, [t, tt]);
  useEffect(() => { document.title = t.docTitle; }, [t.docTitle]);

  const term = useDeferredValue(search).trim().toLowerCase();

  const fetchProducts = useCallback(async ({ silent = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/api/shops/products', {
        params: { page: 0, size: 500 },
        signal: controller.signal,
      });
      const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
      if (!controller.signal.aborted) { setProducts(data.map(normalize)); setLastUpdated(new Date()); }
    } catch (err) {
      if (!controller.signal.aborted && !silent) toast({ icon: 'error', title: tRef.current.toasts.loadFail, text: errText(err) });
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    categoriesAbortRef.current?.abort();
    const controller = new AbortController();
    categoriesAbortRef.current = controller;
    try {
      const res = await api.get('/api/categories', { signal: controller.signal });
      if (!controller.signal.aborted) setCategories(Array.isArray(res.data) ? res.data : res.data?.content || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    return () => { abortRef.current?.abort(); categoriesAbortRef.current?.abort(); };
  }, [fetchProducts, fetchCategories]);

  const setBusy = useCallback(() => setBusyIds(new Set(inflight.current)), []);

  const addProduct = useCallback(async () => {
    if (savingRef.current) return;
    const x = tRef.current;
    const problem = validateProduct(newProduct, categories);
    if (problem) { toast({ icon: 'error', title: x.toasts.invalidData, text: problem }); return; }
    savingRef.current = true;
    setSaving(true);
    try {
      await api.post('/api/shops/products/v2', toProductFormData(newProduct), UPLOAD_CONFIG);
      toast({ icon: 'success', title: x.toasts.added });
      setShowAddModal(false);
      setNewProduct(NEW_PRODUCT);
      fetchProducts({ silent: true });
    } catch (err) {
      toast({ icon: 'error', title: x.toasts.addFail, text: uploadErrText(err, x.upload) });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [newProduct, categories, fetchProducts]);

  const updateProduct = useCallback(async () => {
    if (savingRef.current || !editingProduct) return;
    const x = tRef.current;
    const id = editingProduct.id;
    if (!isSafeId(id)) { toast({ icon: 'error', title: x.toasts.invalidId }); return; }
    const problem = validateProduct(editingProduct, categories);
    if (problem) { toast({ icon: 'error', title: x.toasts.invalidData, text: problem }); return; }
    savingRef.current = true;
    setSaving(true);
    try {
      await api.put(`/api/shops/products/${encodeURIComponent(id)}`, toProductFormData(editingProduct), UPLOAD_CONFIG);
      toast({ icon: 'success', title: x.toasts.updated });
      setEditingProduct(null);
      fetchProducts({ silent: true });
    } catch (err) {
      toast({ icon: 'error', title: x.toasts.updateFail, text: uploadErrText(err, x.upload) });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [editingProduct, categories, fetchProducts]);

  const updateStock = useCallback(async (id, next) => {
    if (!isSafeId(id) || inflight.current.has(id)) return;
    const x = tRef.current;
    const old = productsRef.current.find((p) => p.id === id)?.stock;
    inflight.current.add(id);
    setBusy();
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: next } : p)));
    setStockId(null);
    try {
      await api.patch(`/api/shops/products/${encodeURIComponent(id)}/stock`, { newStock: next });
      toast({ icon: 'success', title: x.toasts.stockUpdated });
    } catch (err) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: old ?? p.stock } : p)));
      toast({ icon: 'error', title: x.toasts.stockFail, text: errText(err) });
    } finally {
      inflight.current.delete(id);
      setBusy();
    }
  }, [setBusy]);

  const deleteProduct = useCallback(async (product) => {
    const { id } = product;
    if (!isSafeId(id) || inflight.current.has(id)) return;
    const x = tRef.current;
    let isConfirmed = false;
    try {
      ({ isConfirmed } = await confirmDialog({
        title: x.confirmDelete.title,
        text: x.confirmDelete.text,
        icon: 'warning',
        confirmButtonText: x.confirmDelete.yes,
        cancelButtonText: ttRef.current.cancel,
        confirmButtonColor: '#ef4444',
      }));
    } catch {
      toast({ icon: 'error', title: x.toasts.confirmFail, text: x.toasts.confirmFailText });
      return;
    }
    if (!isConfirmed) return;

    inflight.current.add(id);
    setBusy();
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.delete(`/api/shops/products/${encodeURIComponent(id)}`);
      toast({ icon: 'success', title: x.toasts.deleted });
    } catch (err) {
      setProducts((prev) => (prev.some((p) => p.id === id) ? prev : [product, ...prev]));
      toast({ icon: 'error', title: x.toasts.deleteFail, text: errText(err) });
    } finally {
      inflight.current.delete(id);
      setBusy();
    }
  }, [setBusy]);

  const index = useMemo(() => products.map((p) => ({
    p,
    text: [p.name, p.categoryName, p.description, ...p.specifications].filter(Boolean).join(' ').toLowerCase(),
  })), [products]);

  const counts = useMemo(() => {
    const c = { all: products.length, inStock: 0 };
    for (const p of products) { c[p.condition] = (c[p.condition] || 0) + 1; if (p.stock > 0) c.inStock += 1; }
    return c;
  }, [products]);

  const filtered = useMemo(() => {
    const collator = getCollator(L.locale);
    const list = index.filter(({ p, text }) => (
      (conditionFilter === 'all' || p.condition === conditionFilter)
      && (categoryFilter === 'all' || String(p.categoryId) === categoryFilter)
      && (stockFilter === 'all'
        || (stockFilter === 'in' && p.stock > 0)
        || (stockFilter === 'low' && p.stock > 0 && p.stock <= LOW_STOCK)
        || (stockFilter === 'out' && p.stock <= 0))
      && (!term || text.includes(term))
    )).map((e) => e.p);
    list.sort((a, b) => {
      if (sortBy === 'highest_price') return b.finalPrice - a.finalPrice;
      if (sortBy === 'lowest_price') return a.finalPrice - b.finalPrice;
      if (sortBy === 'highest_stock') return b.stock - a.stock;
      if (sortBy === 'lowest_stock') return a.stock - b.stock;
      return collator.compare(String(a.name || ''), String(b.name || ''));
    });
    return list;
  }, [index, conditionFilter, categoryFilter, stockFilter, term, sortBy, L.locale]);

  useEffect(() => { setCurrentPage(1); }, [conditionFilter, categoryFilter, stockFilter, term, sortBy, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const skeletonRows = useMemo(() => Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => i), [rowsPerPage]);

  const statCards = useMemo(() => [
    { label: t.stats.total.label, value: nf.format(counts.all), description: t.stats.total.desc, icon: FiPackage, tone: 'sky' },
    { label: t.stats.inStock.label, value: nf.format(counts.inStock), description: t.stats.inStock.desc, icon: FiCheckCircle, tone: 'em' },
    { label: t.stats.fresh.label, value: nf.format(counts.NEW || 0), description: t.stats.fresh.desc, icon: FiTag, tone: 'vi' },
    { label: t.stats.used.label, value: nf.format((counts.USED || 0) + (counts.REFURBISHED || 0)), description: t.stats.used.desc, icon: FiRefreshCw, tone: 'am' },
  ], [counts, t, nf]);

  const categoryOptions = useMemo(() => [
    { value: 'all', label: t.allCategories },
    ...categories.map((c) => ({ value: String(c.id), label: String(c.name ?? '').slice(0, 40) })),
  ], [categories, t]);

  const sortOptions = useMemo(() => SORT_KEYS.map((k) => ({ value: k, label: t.sort[k] })), [t]);
  const stockOptions = useMemo(
    () => STOCK_FILTER_KEYS.map((k) => ({ value: k, label: tpl(t.stockFilters[k], { n: nf.format(LOW_STOCK) }) })),
    [t, nf],
  );

  const filterGroups = useMemo(() => [
    [t.groups.sort, sortOptions, sortBy, setSortBy],
    [t.groups.stock, stockOptions, stockFilter, setStockFilter],
    ...(categories.length ? [[t.groups.category, categoryOptions, categoryFilter, setCategoryFilter]] : []),
  ], [t, sortOptions, stockOptions, sortBy, stockFilter, categoryFilter, categories.length, categoryOptions]);

  const stockProduct = useMemo(() => (stockId == null ? null : products.find((p) => p.id === stockId) || null), [products, stockId]);
  const previewProduct = useMemo(() => (previewId == null ? null : products.find((p) => p.id === previewId) || null), [products, previewId]);

  const handleEdit = useCallback((p) => {
    setEditingProduct({
      id: p.id,
      name: p.name || '',
      description: p.description || '',
      price: String(p.price ?? ''),
      categoryId: p.categoryId != null ? String(p.categoryId) : '',
      stockQuantity: String(p.stock ?? ''),
      condition: p.condition || 'NEW',
      image: p.image || null,
      specifications: specsToText(p.specifications),
      discountType: p.discountType || DEFAULT_DISCOUNT_TYPE,
      discountValue: p.discountValue > 0 ? String(p.discountValue) : '',
    });
  }, []);
  const handleStock = useCallback((p) => setStockId(p.id), []);
  const handlePreview = useCallback((p) => setPreviewId(p.id), []);
  const handleAddChange = useCallback((f, v) => setNewProduct((prev) => ({ ...prev, [f]: v })), []);
  const handleEditChange = useCallback((f, v) => setEditingProduct((prev) => (prev ? { ...prev, [f]: v } : prev)), []);
  const openAdd = useCallback(() => setShowAddModal(true), []);
  const closeAdd = useCallback(() => { if (!savingRef.current) { setShowAddModal(false); setNewProduct(NEW_PRODUCT); } }, []);
  const closeEdit = useCallback(() => { if (!savingRef.current) setEditingProduct(null); }, []);
  const closeStock = useCallback(() => setStockId(null), []);
  const closePreview = useCallback(() => setPreviewId(null), []);
  const openFilter = useCallback(() => setShowFilterPanel(true), []);
  const closeFilter = useCallback(() => setShowFilterPanel(false), []);
  const resetFilters = useCallback(() => { setStockFilter('all'); setCategoryFilter('all'); setSortBy('name'); }, []);
  const refresh = useCallback(() => fetchProducts(), [fetchProducts]);
  const clearSearch = useCallback(() => setSearch(''), []);
  const handleSearch = useCallback((e) => setSearch(sanitizeSearch(e.target.value)), []);
  const submitStock = useCallback((n) => updateStock(stockId, n), [updateStock, stockId]);
  const togglePriceSort = useCallback(() => setSortBy((s) => (s === 'highest_price' ? 'lowest_price' : 'highest_price')), []);
  const toggleStockSort = useCallback(() => setSortBy((s) => (s === 'highest_stock' ? 'lowest_stock' : 'highest_stock')), []);

  const activeFilterCount = (stockFilter !== 'all') + (categoryFilter !== 'all') + (sortBy !== 'name');
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);

  return (
    <div dir={dir} lang={language} style={font} className="pg min-h-screen py-6 lg:ps-64 mt-16 text-start overflow-x-hidden">
      {STYLE_EL}
      <Toaster darkMode={darkMode} />

      <div key={language} className="pg-fade max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <header className="px-0.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">{t.title[0]}<span className="pg-ul">{t.title[1]}</span></h1>
            <p className="pg-muted mt-2 text-sm font-medium">{t.subtitle}</p>
          </header>
          <div className="flex flex-wrap items-center gap-2.5">
            {lastUpdated && <p className="pg-muted hidden sm:block text-[11px] font-bold">{tpl(tt.lastUpdated, { t: fmt(fm.time, lastUpdated) })}</p>}
            <button type="button" onClick={refresh} aria-label={tt.refresh} title={tt.refresh} className="pg-btn h-10 px-3 text-xs uppercase">
              <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" /> {tt.refresh}
            </button>
            <button type="button" onClick={openAdd} className="pg-btn pg-btn-a h-10 px-3 text-xs uppercase">
              <FiPlus size={14} aria-hidden="true" /> {t.add}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <section className="pg-card overflow-hidden">
          <div className="pg-line p-3 sm:p-4 flex flex-wrap items-center gap-2.5 border-b-2">
            <div className="pg-field flex h-10 min-w-[220px] flex-1 items-center gap-2 px-3">
              <FiSearch size={16} className="flex-shrink-0" aria-hidden="true" />
              <input
                type="search"
                value={search}
                maxLength={SEARCH_MAX}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                aria-label={t.searchAria}
                placeholder={t.searchPlaceholder}
                onChange={handleSearch}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button type="button" aria-label={t.clearSearch} onClick={clearSearch} className="pg-link flex-shrink-0"><FiX size={14} aria-hidden="true" /></button>
              )}
            </div>
            <RowsSelect value={rowsPerPage} onChange={setRowsPerPage} label={tt.rows} formatNumber={nf.format} />
            <button type="button" onClick={openFilter} className="pg-btn relative h-10 px-3 text-xs uppercase">
              <FiFilter size={14} aria-hidden="true" /> {tt.filter}
              {activeFilterCount > 0 && (
                <span className="pg-line absolute -top-2 -end-2 w-5 h-5 border-2 bg-[var(--pg-btn)] text-[var(--pg-on)] text-[10px] font-extrabold grid place-items-center">{nf.format(activeFilterCount)}</span>
              )}
            </button>
          </div>

          <div role="tablist" aria-label={t.conditionsAria} className="pg-line pg-scroll flex gap-2 overflow-x-auto px-3 sm:px-4 py-3 border-b-2">
            {TABS.map((s) => (
              <button key={s} type="button" role="tab" aria-selected={conditionFilter === s} onClick={() => setConditionFilter(s)} className="pg-btn flex-shrink-0 h-9 px-3 text-xs uppercase">
                {t.conditions[s] || s}
                <span className="tabular-nums opacity-80">{nf.format(counts[s] || 0)}</span>
              </button>
            ))}
          </div>

          <div className="overflow-auto max-h-[68vh] pg-scroll" aria-busy={loading}>
            <table className="w-full min-w-[880px] text-start border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th scope="col" className="pg-th">{t.columns.product}</th>
                  <th scope="col" className="pg-th">{t.columns.condition}</th>
                  <SortTh label={t.columns.price} active={sortBy.endsWith('_price')} dir={sortBy === 'lowest_price' ? 'asc' : 'desc'} onClick={togglePriceSort} />
                  <SortTh label={t.columns.stock} active={sortBy.endsWith('_stock')} dir={sortBy === 'lowest_stock' ? 'asc' : 'desc'} onClick={toggleStockSort} />
                  <th scope="col" className="pg-th">{t.columns.actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading && products.length === 0 ? (
                  skeletonRows.map((i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {[0, 1, 2, 3, 4].map((j) => <td key={j} className="pg-td px-3 py-4"><div className="pg-gray h-3.5 w-full" /></td>)}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14">
                      <Empty title={term ? t.empty.noResults : t.empty.none} subtitle={term ? t.empty.noResultsSub : t.empty.noneSub} />
                    </td>
                  </tr>
                ) : (
                  paginated.map((p) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      busy={busyIds.has(p.id)}
                      loc={loc}
                      onEdit={handleEdit}
                      onDelete={deleteProduct}
                      onStock={handleStock}
                      onPreview={handlePreview}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="pg-gray pg-line px-4 py-3 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="pg-muted text-xs font-bold">
                {renderTpl(t.showing, {
                  range: <b className="tabular-nums">{nf.format(from)}–{nf.format(to)}</b>,
                  total: <b className="tabular-nums">{nf.format(filtered.length)}</b>,
                })}
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} labels={tt} formatNumber={nf.format} />}
            </div>
          )}
        </section>

        <p className="pg-muted flex items-center gap-1.5 text-[11px] font-bold">
          <FiAlertCircle size={12} aria-hidden="true" /> {t.lowNote}
        </p>
      </div>

      <Suspense fallback={<ModalFallback label={tt.loadingAria} />}>
        {showAddModal && (
          <ProductModal mode="add" data={newProduct} categories={categories} busy={saving} onChange={handleAddChange} onSubmit={addProduct} onClose={closeAdd} />
        )}
        {editingProduct && (
          <ProductModal mode="edit" data={editingProduct} categories={categories} busy={saving} onChange={handleEditChange} onSubmit={updateProduct} onClose={closeEdit} />
        )}
      </Suspense>

      {showFilterPanel && (
        <FilterPanel title={t.filterTitle} note={t.filterNote} groups={filterGroups} labels={tt} onReset={resetFilters} onClose={closeFilter} />
      )}

      {stockProduct && (
        <StockModal key={stockProduct.id} product={stockProduct} busy={busyIds.has(stockProduct.id)} loc={loc} onClose={closeStock} onSubmit={submitStock} />
      )}

      {previewProduct && (
        <ImagePreview key={previewProduct.id} product={previewProduct} closeLabel={tt.close || 'Close'} onClose={closePreview} />
      )}
    </div>
  );
};

export default memo(Products);