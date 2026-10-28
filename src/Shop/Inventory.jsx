import React, {
  useState, useEffect, useCallback, useMemo, useRef, useDeferredValue, memo,
} from 'react';
import {
  FiSearch, FiDownload, FiUpload, FiPackage, FiBox, FiInfo, FiX, FiFilter, FiRefreshCw,
  FiLayers, FiAlertTriangle, FiXCircle, FiDollarSign, FiShield, FiChevronUp, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiCheck,
} from 'react-icons/fi';
import api from '../common/api/api';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import {
  SEARCH_MAX, getFormats, getCollator, tpl, renderTpl, fmt, num, formatPrice,
  sanitizeSearch, isSafeId, errText, confirmDialog, useDarkMode, useEscape, useShopLocale,
} from '../components/shop/TableKit';
import { ensureShopAssets } from '../common/utils/shopFonts';

ensureShopAssets();

const API_BASE = '/api/shop/inventory';
const BADGE_EVENT = 'shopBadgeCounts';
const DEFAULT_THRESHOLD = 5;
const STOCK_MAX = 1_000_000;
const IMPORT_MAX_BYTES = 5 * 1024 * 1024;
const FETCH_SIZE = 500;
const SKELETON_COLS = [0, 1, 2, 3, 4];
const ROW_OPTIONS = [5, 10, 25, 50];

const TABLE_FALLBACK = {
  en: {
    showing: 'Showing {range} of {total} {unit}',
    rows: '{n} rows',
    prev: 'Previous',
    next: 'Next',
    paginationAria: 'Pagination',
    close: 'Close',
    reset: 'Reset',
    apply: 'Apply',
  },
  ar: {
    showing: 'عرض {range} من {total} {unit}',
    rows: '{n} صفوف',
    prev: 'السابق',
    next: 'التالي',
    paginationAria: 'ترقيم الصفحات',
    close: 'إغلاق',
    reset: 'إعادة ضبط',
    apply: 'تطبيق',
  },
};

const mergeLabels = (base, fallback) => {
  const out = { ...fallback };
  if (base) for (const k of Object.keys(base)) if (base[k] != null && base[k] !== '') out[k] = base[k];
  return out;
};

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
.pg-bar{display:inline-block;width:40px;height:12px;background:var(--pg-accent);border:2px solid var(--pg-line)}
.pg-ul{text-decoration:underline;text-decoration-color:var(--pg-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
.pg-chip{display:inline-flex;align-items:center;gap:6px;background:var(--pg-card);color:var(--pg-ink);border:2px solid var(--pg-line);padding:1px 8px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.6;white-space:nowrap}
.pg-tile{display:inline-flex;align-items:center;justify-content:center;flex:none;border:2px solid var(--pg-line);background:var(--pg-accent);color:#04261a}
.pg-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--pg-card);color:var(--pg-ink);border:2px solid var(--pg-line);box-shadow:2px 2px 0 var(--pg-shadow);font-weight:700;cursor:pointer;white-space:nowrap;transition:transform .12s ease,box-shadow .12s ease}
.pg-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--pg-shadow)}
.pg-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--pg-shadow)}
.pg-btn:disabled{opacity:.45;cursor:not-allowed}
.pg-btn-a,.pg-btn[aria-pressed="true"],.pg-btn[aria-selected="true"],.pg-btn[aria-current="page"]{background:var(--pg-btn);color:var(--pg-on)}
.pg-btn:focus-visible,.pg-sort:focus-visible{outline:3px solid var(--pg-accent);outline-offset:2px}
.pg-field{background:var(--pg-card);color:var(--pg-ink);border:2px solid var(--pg-line);box-shadow:2px 2px 0 var(--pg-shadow)}
.pg-field:focus,.pg-field:focus-within{outline:3px solid var(--pg-accent);outline-offset:2px}
.pg-field::placeholder{color:var(--pg-muted);opacity:.8}
.pg-th{background:var(--pg-gray);border-bottom:2px solid var(--pg-line);padding:12px;text-align:start;font-size:11px;font-weight:800;text-transform:uppercase;white-space:nowrap}
.pg-td{border-top:2px dotted var(--pg-dot)}
tbody tr:first-child .pg-td{border-top:0}
.pg-tr{transition:background-color .12s ease}
.pg-tr:hover{background:var(--pg-gray)}
.pg-scroll{scrollbar-width:thin;scrollbar-color:var(--pg-accent) transparent}
.pg-scroll::-webkit-scrollbar{width:6px;height:6px}
.pg-scroll::-webkit-scrollbar-track{background:transparent}
.pg-scroll::-webkit-scrollbar-thumb{background:var(--pg-accent);border:1px solid var(--pg-line)}
@keyframes pgFade{from{opacity:0}to{opacity:1}}
@keyframes pgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.pg-fade{animation:pgFade .2s ease-out both}
.pg-in{animation:pgIn .15s ease-out both}
@media (prefers-reduced-motion:reduce){.pg-btn,.pg-lift,.pg-tr{transition:none}.pg-fade,.pg-in{animation:none}}
`;
const PAGE_CSS = PG_CSS + EXTRAS_CSS;
const STYLE_EL = <style>{PAGE_CSS}</style>;

const TABS = ['all', 'ok', 'low', 'out'];
const SORT_VALUES = ['name', 'highest_price', 'lowest_price', 'highest_stock', 'lowest_stock'];
const STATUS_DOT = { ok: 'bg-emerald-500', low: 'bg-amber-400', out: 'bg-red-500' };
const TONES = { sky: '#22d3ee', am: '#facc15', ro: '#fb7185', vi: '#2dd4bf', em: '#34d399' };

const statusOf = (i) => (i.stock <= 0 ? 'out' : i.stock < i.threshold ? 'low' : 'ok');

const normalize = (i) => ({
  ...i,
  stock: Math.max(0, num(i.stock ?? i.stockQuantity)),
  price: num(i.price),
  threshold: num(i.threshold) > 0 ? num(i.threshold) : DEFAULT_THRESHOLD,
});

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toDigits = (v) => v.replace(/[٠-٩]/g, (d) => ARABIC_DIGITS.indexOf(d)).replace(/\D/g, '');

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

const StatusPill = memo(({ status, label }) => (
  <span className="pg-chip">
    <span className={`pg-line w-2 h-2 border ${STATUS_DOT[status]}`} />
    {label}
  </span>
));

const StatCard = memo(({ label, value, description, icon: Icon, tone }) => (
  <div className="pg-card pg-lift p-4 sm:p-5 flex items-center gap-3 min-w-0">
    <span className="pg-tile w-11 h-11" style={{ background: TONES[tone] || TONES.em }}>
      <Icon size={20} aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="pg-muted text-[11px] font-bold uppercase truncate">{label}</p>
      <p className="text-2xl font-extrabold tracking-tight leading-tight tabular-nums truncate">{value}</p>
      <p className="pg-muted text-xs font-semibold truncate">{description}</p>
    </div>
  </div>
));

const RowsSelect = memo(({ value, onChange, label, formatNumber }) => {
  const options = ROW_OPTIONS.includes(value) ? ROW_OPTIONS : [...ROW_OPTIONS, value].sort((a, b) => a - b);
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={tpl(label, { n: '' }).trim()}
      className="pg-field h-10 px-3 text-sm font-bold cursor-pointer"
    >
      {options.map((n) => (
        <option key={n} value={n}>{tpl(label, { n: formatNumber(n) })}</option>
      ))}
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
    <nav aria-label={labels.paginationAria} className="flex items-center gap-1.5 flex-wrap justify-center">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={labels.prev} className="pg-btn h-8 w-8">
        <FiChevronLeft size={14} className="rtl:rotate-180" aria-hidden="true" />
      </button>
      {pages.map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="pg-muted px-1 text-xs font-bold" aria-hidden="true">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className="pg-btn h-8 min-w-[32px] px-2 text-xs tabular-nums"
          >
            {formatNumber(p)}
          </button>
        )
      )}
      <button type="button" disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={labels.next} className="pg-btn h-8 w-8">
        <FiChevronRight size={14} className="rtl:rotate-180" aria-hidden="true" />
      </button>
    </nav>
  );
});

const Overlay = memo(({ onClose, children }) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="pg-fade absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      {children}
    </div>
  );
});

const FilterPanel = memo(({ title, note, groups, onReset, onClose, labels }) => {
  useEscape(onClose);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div className="pg-fade absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label={title} className="pg-card pg-in relative w-full max-w-xs h-full flex flex-col !shadow-none border-y-0 border-e-0">
        <div className="pg-gray pg-line px-5 py-4 border-b-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold uppercase"><span className="pg-ul">{title}</span></h3>
          <button type="button" onClick={onClose} aria-label={labels.close} className="pg-btn h-8 w-8"><FiX size={15} aria-hidden="true" /></button>
        </div>
        <div className="flex-1 overflow-y-auto pg-scroll p-5 space-y-5">
          {note && <p className="pg-muted text-xs font-semibold">{note}</p>}
          {groups.map(([groupTitle, options, value, setter]) => (
            <fieldset key={groupTitle} className="space-y-2">
              <legend className="mb-2 text-[11px] font-extrabold uppercase">{groupTitle}</legend>
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={value === o.value}
                  onClick={() => setter(o.value)}
                  className="pg-btn w-full justify-between px-3 h-10 text-xs uppercase"
                >
                  {o.label}
                  {value === o.value && <FiCheck size={14} aria-hidden="true" />}
                </button>
              ))}
            </fieldset>
          ))}
        </div>
        <div className="pg-line p-4 border-t-2 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={onReset} className="pg-btn h-10 text-xs uppercase">{labels.reset}</button>
          <button type="button" onClick={onClose} className="pg-btn pg-btn-a h-10 text-xs uppercase">{labels.apply}</button>
        </div>
      </aside>
    </div>
  );
});

const InventoryRow = memo(({ item, busy, L, onDetails, onUpdateStock }) => {
  const t = L.inventory;
  const fm = getFormats(L.locale);
  const status = statusOf(item);
  return (
    <tr className="pg-tr">
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <span className="pg-tile w-9 h-9"><FiBox size={16} aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase truncate max-w-[260px]">{item.name || '—'}</p>
            <p className="pg-muted text-[10px] font-semibold truncate max-w-[260px]">{item.category || item.categoryName || t.row.uncategorized}</p>
          </div>
        </div>
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap font-extrabold text-[13px] tabular-nums">{formatPrice(item.price, L.table.price, fm.number)}</td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <span className={`text-sm font-extrabold tabular-nums ${item.stock > 0 ? '' : 'text-red-500'}`}>{fm.number.format(item.stock)}</span>
        <span className="pg-muted text-[10px] font-semibold ms-1">{t.row.unit}</span>
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap"><StatusPill status={status} label={t.status[status]} /></td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <button type="button" disabled={busy} onClick={() => onUpdateStock(item)} className="pg-btn h-8 px-2.5 text-[11px] uppercase"><FiLayers size={12} aria-hidden="true" /> {t.row.updateStock}</button>
          <button type="button" title={t.row.details} aria-label={tpl(t.row.detailsOf, { name: item.name || t.row.fallbackName })} onClick={() => onDetails(item)} className="pg-btn h-8 w-8"><FiInfo size={14} aria-hidden="true" /></button>
        </div>
      </td>
    </tr>
  );
});

const DetailsModal = memo(({ item, L, onClose }) => {
  useEscape(onClose);
  const t = L.inventory;
  const fm = getFormats(L.locale);
  const status = statusOf(item);
  const cells = [
    [t.details.unitPrice, formatPrice(item.price, L.table.price, fm.number)],
    [t.details.quantity, `${fm.number.format(item.stock)} ${t.row.unit}`],
    [t.details.threshold, `${fm.number.format(item.threshold)} ${t.row.unit}`],
  ];
  return (
    <Overlay onClose={onClose}>
      <div role="dialog" aria-modal="true" aria-label={t.details.title} className="pg-card pg-in relative w-full max-w-sm overflow-hidden">
        <div className="pg-gray pg-line px-5 py-3.5 border-b-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="pg-tile h-9 w-9" style={{ background: TONES.sky }}><FiInfo size={16} aria-hidden="true" /></span>
            <h3 className="text-sm font-extrabold uppercase"><span className="pg-ul">{t.details.title}</span></h3>
          </div>
          <button type="button" onClick={onClose} aria-label={L.table.close} className="pg-btn h-8 w-8"><FiX size={15} aria-hidden="true" /></button>
        </div>

        <div className="px-5 py-4 space-y-3.5">
          <div className="flex items-center gap-3">
            <span className="pg-tile h-12 w-12"><FiPackage size={20} aria-hidden="true" /></span>
            <div className="min-w-0">
              <h4 className="text-sm font-extrabold uppercase break-words">{item.name || '—'}</h4>
              <p className="pg-muted text-[11px] font-semibold">{item.category || item.categoryName || t.row.uncategorized}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {cells.map(([label, value]) => (
              <div key={label} className="pg-gray pg-dot p-3 min-w-0">
                <p className="pg-muted text-[10px] font-bold uppercase mb-1 truncate">{label}</p>
                <p className="text-xs font-extrabold tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <div className="pg-gray pg-dot p-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase"><FiShield size={14} className="text-[var(--pg-accent)]" aria-hidden="true" /> {t.details.status}</span>
            <StatusPill status={status} label={t.status[status]} />
          </div>
        </div>

        <div className="pg-line px-5 py-3.5 border-t-2">
          <button type="button" onClick={onClose} className="pg-btn w-full h-10 text-xs uppercase">{L.table.close}</button>
        </div>
      </div>
    </Overlay>
  );
});

const StockModal = memo(({ item, busy, L, onClose, onSubmit }) => {
  useEscape(onClose);
  const t = L.inventory;
  const nf = getFormats(L.locale).number;
  const [value, setValue] = useState(String(item.stock));
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (busy) return;
    const n = Number(value);
    if (value === '' || !Number.isInteger(n) || n < 0 || n > STOCK_MAX) {
      setError(tpl(t.stockModal.error, { max: nf.format(STOCK_MAX) }));
      return;
    }
    onSubmit(n);
  };

  return (
    <Overlay onClose={onClose}>
      <form onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-label={t.stockModal.title} className="pg-card pg-in relative w-full max-w-sm overflow-hidden">
        <div className="pg-gray pg-line px-5 py-4 border-b-2 flex items-center gap-3">
          <span className="pg-tile h-10 w-10"><FiLayers size={16} aria-hidden="true" /></span>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold uppercase"><span className="pg-ul">{t.stockModal.title}</span></h3>
            <p className="pg-muted mt-1 text-[11px] font-semibold truncate">{tpl(t.stockModal.current, { name: item.name, n: nf.format(item.stock) })}</p>
          </div>
        </div>
        <div className="p-5 space-y-2">
          <label htmlFor="inv-stock" className="text-[11px] font-extrabold uppercase">{t.stockModal.newQty}</label>
          <input
            id="inv-stock"
            type="text"
            inputMode="numeric"
            dir="ltr"
            autoFocus
            autoComplete="off"
            maxLength={7}
            value={value}
            aria-invalid={!!error}
            aria-describedby={error ? 'inv-stock-err' : undefined}
            onChange={(e) => { setValue(toDigits(e.target.value)); setError(''); }}
            className="pg-field w-full h-12 text-lg font-extrabold text-center tabular-nums"
          />
          {error && <p id="inv-stock-err" role="alert" className="text-[11px] font-bold text-red-500">{error}</p>}
        </div>
        <div className="px-5 pb-5 flex gap-2.5">
          <button type="button" onClick={onClose} className="pg-btn flex-1 h-10 text-xs uppercase">{L.table.cancel}</button>
          <button type="submit" disabled={busy} className="pg-btn pg-btn-a flex-1 h-10 text-xs uppercase">{t.stockModal.submit}</button>
        </div>
      </form>
    </Overlay>
  );
});

const Inventory = () => {
  const darkMode = useDarkMode();
  const { language, isAr, dir, font, L, fm } = useShopLocale();
  const t = L.inventory;
  const nf = fm.number;
  const tl = useMemo(() => mergeLabels(L.table, isAr ? TABLE_FALLBACK.ar : TABLE_FALLBACK.en), [L.table, isAr]);

  const tRef = useRef(L);
  tRef.current = L;

  const [inventory, setInventory] = useState([]);
  const [totalValue, setTotalValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [detailsId, setDetailsId] = useState(null);
  const [stockId, setStockId] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const inventoryRef = useRef(inventory);
  const inflight = useRef(new Set());
  const abortRef = useRef(null);
  const totalAbortRef = useRef(null);
  const fileInputRef = useRef(null);
  inventoryRef.current = inventory;
  useEffect(() => { document.title = t.docTitle; }, [t.docTitle]);

  const term = useDeferredValue(search).trim().toLowerCase();

  const fetchTotalValue = useCallback(async () => {
    totalAbortRef.current?.abort();
    const controller = new AbortController();
    totalAbortRef.current = controller;
    try {
      const res = await api.get(`${API_BASE}/total-value`, { signal: controller.signal });
      if (!controller.signal.aborted) setTotalValue(num(res.data?.totalValue ?? res.data));
    } catch {
      setTotalValue((v) => v);
    }
  }, []);

  const fetchInventory = useCallback(async ({ silent = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`${API_BASE}/search`, {
        params: { query: '', page: 0, size: FETCH_SIZE },
        signal: controller.signal,
      });
      const raw = res.data;
      const list = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : [];
      if (!controller.signal.aborted) {
        const total = num(raw?.totalElements);
        setInventory(list.map(normalize));
        setTruncated(total > list.length || (!total && list.length >= FETCH_SIZE));
        setLoadError(false);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setLoadError(true);
        if (!silent) toast({ icon: 'error', title: tRef.current.inventory.toasts.loadFail, text: errText(err) });
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchTotalValue();
    return () => { abortRef.current?.abort(); totalAbortRef.current?.abort(); };
  }, [fetchInventory, fetchTotalValue]);

  const setBusy = useCallback(() => setBusyIds(new Set(inflight.current)), []);

  const refreshAll = useCallback(() => {
    if (loading) return;
    fetchInventory();
    fetchTotalValue();
  }, [loading, fetchInventory, fetchTotalValue]);

  const updateStock = useCallback(async (id, next) => {
    if (!isSafeId(id) || inflight.current.has(id)) return;
    const old = inventoryRef.current.find((i) => i.id === id)?.stock;
    inflight.current.add(id);
    setBusy();
    setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, stock: next } : i)));
    setStockId(null);
    try {
      await api.patch(`/api/shops/products/${encodeURIComponent(id)}/stock`, { newStock: next });
      toast({ icon: 'success', title: tRef.current.inventory.toasts.stockUpdated });
      fetchTotalValue();
    } catch (err) {
      setInventory((prev) => prev.map((i) => (i.id === id ? { ...i, stock: old ?? i.stock } : i)));
      toast({ icon: 'error', title: tRef.current.inventory.toasts.stockFail, text: errText(err) });
    } finally {
      inflight.current.delete(id);
      setBusy();
    }
  }, [fetchTotalValue, setBusy]);

  const exportCSV = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    const tt = tRef.current.inventory.toasts;
    try {
      const res = await api.get(`${API_BASE}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
      a.rel = 'noopener';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ icon: 'success', title: tt.exported });
    } catch (err) {
      toast({ icon: 'error', title: tt.exportFail, text: errText(err) });
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  const handleImport = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || importing) return;
    const cur = tRef.current;
    const tt = cur.inventory.toasts;
    if (!/\.csv$/i.test(file.name)) { toast({ icon: 'error', ...tt.unsupported }); return; }
    if (file.size === 0) { toast({ icon: 'error', title: tt.emptyFile }); return; }
    if (file.size > IMPORT_MAX_BYTES) {
      toast({ icon: 'error', title: tt.tooLarge.title, text: tpl(tt.tooLarge.text, { n: getFormats(cur.locale).number.format(IMPORT_MAX_BYTES / 1024 / 1024) }) });
      return;
    }

    const c = cur.inventory.importConfirm;
    const { isConfirmed } = await confirmDialog({
      title: c.title,
      text: tpl(c.text, { name: file.name.slice(0, 60) }),
      icon: 'question',
      confirmButtonText: c.button,
      cancelButtonText: cur.table.cancel,
      confirmButtonColor: '#059669',
    });
    if (!isConfirmed) return;

    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file, file.name);
      await api.post('/api/shops/products/import', fd);
      toast({ icon: 'success', title: tt.imported });
      fetchInventory({ silent: true });
      fetchTotalValue();
    } catch (err) {
      toast({ icon: 'error', title: tt.importFail, text: errText(err) });
    } finally {
      setImporting(false);
    }
  }, [importing, fetchInventory, fetchTotalValue]);

  const index = useMemo(() => inventory.map((i) => ({
    i,
    status: statusOf(i),
    text: [i.name, i.category, i.categoryName].filter(Boolean).join(' ').toLowerCase(),
  })), [inventory]);

  const counts = useMemo(() => {
    const c = { all: inventory.length, ok: 0, low: 0, out: 0 };
    for (const { status } of index) c[status] += 1;
    return c;
  }, [index, inventory.length]);

  // Share the "low / out of stock" count with the shop header badge (only after the first successful load).
  const lowStockCount = counts.low + counts.out;
  const loaded = lastUpdated !== null;
  useEffect(() => {
    if (!loaded) return;
    window.dispatchEvent(new CustomEvent(BADGE_EVENT, { detail: { stock: lowStockCount } }));
  }, [lowStockCount, loaded]);

  const computedValue = useMemo(() => inventory.reduce((s, i) => s + i.price * i.stock, 0), [inventory]);

  const filtered = useMemo(() => {
    const collator = getCollator(L.locale);
    const list = [];
    for (const { i, status, text } of index) {
      if ((statusFilter === 'all' || status === statusFilter) && (!term || text.includes(term))) list.push(i);
    }
    list.sort((a, b) => {
      if (sortBy === 'highest_price') return b.price - a.price;
      if (sortBy === 'lowest_price') return a.price - b.price;
      if (sortBy === 'highest_stock') return b.stock - a.stock;
      if (sortBy === 'lowest_stock') return a.stock - b.stock;
      return collator.compare(String(a.name || ''), String(b.name || ''));
    });
    return list;
  }, [index, statusFilter, term, sortBy, L.locale]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, term, sortBy, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);

  const statCards = useMemo(() => [
    { label: t.stats.total.label, value: nf.format(counts.all), description: t.stats.total.desc, icon: FiBox, tone: 'sky' },
    { label: t.stats.low.label, value: nf.format(counts.low), description: t.stats.low.desc, icon: FiAlertTriangle, tone: 'am' },
    { label: t.stats.out.label, value: nf.format(counts.out), description: t.stats.out.desc, icon: FiXCircle, tone: 'ro' },
    { label: t.stats.value.label, value: formatPrice(totalValue ?? computedValue, L.table.price, nf), description: t.stats.value.desc, icon: FiDollarSign, tone: 'vi' },
  ], [counts, totalValue, computedValue, t, nf, L.table.price]);

  const filterGroups = useMemo(() => [
    [t.filter.sortBy, SORT_VALUES.map((v) => ({ value: v, label: t.sort[v] })), sortBy, setSortBy],
  ], [t, sortBy]);

  const detailsItem = useMemo(() => (detailsId == null ? null : inventory.find((i) => i.id === detailsId) || null), [inventory, detailsId]);
  const stockItem = useMemo(() => (stockId == null ? null : inventory.find((i) => i.id === stockId) || null), [inventory, stockId]);
  const skeletonRows = useMemo(() => Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => i), [rowsPerPage]);

  const handleDetails = useCallback((i) => setDetailsId(i.id), []);
  const handleStock = useCallback((i) => setStockId(i.id), []);
  const closeDetails = useCallback(() => setDetailsId(null), []);
  const closeStock = useCallback(() => setStockId(null), []);
  const closeFilter = useCallback(() => setShowFilterPanel(false), []);
  const openFilter = useCallback(() => setShowFilterPanel(true), []);
  const resetFilters = useCallback(() => setSortBy('name'), []);
  const togglePriceSort = useCallback(() => setSortBy((s) => (s === 'highest_price' ? 'lowest_price' : 'highest_price')), []);
  const toggleStockSort = useCallback(() => setSortBy((s) => (s === 'highest_stock' ? 'lowest_stock' : 'highest_stock')), []);
  const submitStock = useCallback((n) => { if (stockId != null) updateStock(stockId, n); }, [stockId, updateStock]);
  const handleSearch = useCallback((e) => setSearch(sanitizeSearch(e.target.value)), []);
  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);

  const activeFilterCount = sortBy !== 'name' ? 1 : 0;
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);
  const bold = 'tabular-nums';
  const unitLabel = t.unit ?? t.row?.unit ?? '';
  const spin = 'animate-spin motion-reduce:animate-none';

  return (
    <div
      dir={dir}
      lang={language}
      style={font}
      className="pg min-h-screen py-6 lg:ps-64 mt-16 text-start overflow-x-hidden"
    >
      {STYLE_EL}
      <Toaster darkMode={darkMode} />

      <div key={language} className="pg-fade max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <header className="px-0.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
              {t.title[0]}<span className="pg-ul">{t.title[1]}</span>
            </h1>
            <p className="pg-muted mt-2 text-sm font-medium">{t.subtitle}</p>
          </header>
          <div className="flex flex-wrap items-center gap-2.5">
            {lastUpdated && <p className="pg-muted hidden sm:block text-[11px] font-bold">{tpl(L.table.lastUpdated, { time: fmt(fm.time, lastUpdated), t: fmt(fm.time, lastUpdated) })}</p>}
            <button type="button" onClick={refreshAll} disabled={loading} aria-label={L.table.refresh} title={L.table.refresh} className="pg-btn h-10 px-3 text-xs uppercase">
              <FiRefreshCw size={14} className={loading ? spin : ''} aria-hidden="true" /> {L.table.refresh}
            </button>
            <button type="button" disabled={importing} onClick={openFilePicker} className="pg-btn h-10 px-3 text-xs uppercase">
              <FiUpload size={14} aria-hidden="true" /> {importing ? t.importing : t.import}
            </button>
            <input ref={fileInputRef} type="file" className="hidden" accept=".csv,text/csv" onChange={handleImport} tabIndex={-1} aria-hidden="true" />
            <button type="button" disabled={exporting} onClick={exportCSV} className="pg-btn pg-btn-a h-10 px-3 text-xs uppercase">
              <FiDownload size={14} aria-hidden="true" /> {exporting ? t.exporting : t.export}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {truncated && (
          <div role="status" className="pg-card flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold">
            <span className="pg-tile h-7 w-7" style={{ background: TONES.am }}><FiAlertTriangle size={14} aria-hidden="true" /></span>
            {tpl(t.truncated, { n: nf.format(FETCH_SIZE) })}
          </div>
        )}

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
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
              />
            </div>
            <RowsSelect value={rowsPerPage} onChange={setRowsPerPage} label={tl.rows} formatNumber={nf.format} />
            <button type="button" onClick={openFilter} className="pg-btn relative h-10 px-3 text-xs uppercase">
              <FiFilter size={14} aria-hidden="true" /> {L.table.filter}
              {activeFilterCount > 0 && (
                <span className="pg-line absolute -top-2 -end-2 w-5 h-5 border-2 bg-[var(--pg-btn)] text-[var(--pg-on)] text-[10px] font-extrabold grid place-items-center">{nf.format(activeFilterCount)}</span>
              )}
            </button>
          </div>

          <div role="tablist" aria-label={t.tabsAria} className="pg-line pg-scroll flex gap-2 overflow-x-auto px-3 sm:px-4 py-3 border-b-2">
            {TABS.map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                className="pg-btn flex-shrink-0 h-9 px-3 text-xs uppercase"
              >
                {t.status[s]}
                <span className="tabular-nums opacity-80">{nf.format(counts[s])}</span>
              </button>
            ))}
          </div>

          <div className="overflow-auto max-h-[68vh] pg-scroll" aria-busy={loading}>
            <table className="w-full min-w-[820px] text-start border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th scope="col" className="pg-th">{t.columns.product}</th>
                  <SortTh label={t.columns.price} active={sortBy.endsWith('_price')} dir={sortBy === 'lowest_price' ? 'asc' : 'desc'} onClick={togglePriceSort} />
                  <SortTh label={t.columns.stock} active={sortBy.endsWith('_stock')} dir={sortBy === 'lowest_stock' ? 'asc' : 'desc'} onClick={toggleStockSort} />
                  <th scope="col" className="pg-th">{t.columns.status}</th>
                  <th scope="col" className="pg-th">{t.columns.actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading && inventory.length === 0 ? (
                  skeletonRows.map((i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {SKELETON_COLS.map((j) => (
                        <td key={j} className="pg-td px-3 py-4"><div className="pg-gray h-3.5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : loadError && inventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <p role="alert" className="text-sm font-extrabold uppercase text-red-500">{t.loadError.title}</p>
                      <p className="pg-muted mt-1 text-[11px] font-semibold">{t.loadError.hint}</p>
                      <button type="button" onClick={refreshAll} className="pg-btn pg-btn-a h-10 px-4 mt-4 text-xs uppercase">
                        <FiRefreshCw size={14} aria-hidden="true" /> {t.loadError.retry}
                      </button>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14">
                      <div className="flex flex-col items-center text-center gap-3">
                        <span className="pg-tile h-16 w-16"><FiBox size={28} aria-hidden="true" /></span>
                        <p className="text-base font-extrabold uppercase"><span className="pg-ul">{t.empty.title}</span></p>
                        <p className="pg-muted text-xs font-semibold max-w-xs">{t.empty.subtitle}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((i) => (
                    <InventoryRow
                      key={i.id}
                      item={i}
                      busy={busyIds.has(i.id)}
                      L={L}
                      onDetails={handleDetails}
                      onUpdateStock={handleStock}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="pg-gray pg-line px-4 py-3 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="pg-muted text-xs font-bold">
                {renderTpl(t.showing || tl.showing, {
                  range: <b className={bold}>{nf.format(from)}–{nf.format(to)}</b>,
                  total: <b className={bold}>{nf.format(filtered.length)}</b>,
                  unit: unitLabel,
                })}
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} labels={tl} formatNumber={nf.format} />}
            </div>
          )}
        </section>
      </div>

      {detailsItem && <DetailsModal item={detailsItem} L={L} onClose={closeDetails} />}

      {showFilterPanel && (
        <FilterPanel title={t.filter.title} note={t.filter.note} groups={filterGroups} onReset={resetFilters} onClose={closeFilter} labels={tl} />
      )}

      {stockItem && (
        <StockModal
          key={stockItem.id}
          item={stockItem}
          busy={busyIds.has(stockItem.id)}
          L={L}
          onClose={closeStock}
          onSubmit={submitStock}
        />
      )}
    </div>
  );
};

export default memo(Inventory);