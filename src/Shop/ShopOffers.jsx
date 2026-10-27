import React, {
  useState, useEffect, useCallback, useMemo, useRef, useDeferredValue, memo, Suspense, lazy,
} from 'react';
import {
  FiSearch, FiInfo, FiX, FiCheck, FiFilter, FiCopy, FiPlus, FiEdit3, FiTrash2, FiTag,
  FiCalendar, FiRefreshCw, FiCheckCircle, FiPercent, FiDollarSign, FiPower,
} from 'react-icons/fi';
import { ar, enUS } from 'date-fns/locale';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D, Dropdown } from '../components/user/UiExtras';
import {
  SEARCH_MAX, BTN, BTN_MD, BTN_ICON, BTN_PRIMARY, CARD, PANEL, TH, SCROLL_CSS, LABEL,
  toTs, fmt, num, tpl, renderTpl, sanitizeSearch, isSafeId, shortId, errText,
  confirmDialog, useDarkMode, useEscape, useShopLocale,
  StatCard, RowsDropdown, SortTh, Pagination, Overlay, FilterPanel, IconTile,
} from '../components/shop/TableKit';
import { ensureShopAssets } from '../common/utils/shopFonts';

ensureShopAssets();

const DatePicker = lazy(() => Promise.all([
  import('react-datepicker'),
  import('react-datepicker/dist/react-datepicker.css'),
]).then(([m]) => ({ default: m.default })));

const INK = '#04261a';
const STATUSES = ['ACTIVE', 'SCHEDULED', 'EXPIRED'];
const TABS = ['all', ...STATUSES];
const TYPE_KEYS = ['all', 'PERCENTAGE', 'FIXED_AMOUNT'];
const SORT_KEYS = ['newest', 'oldest', 'highest', 'lowest'];
const FIXED = 'FIXED_AMOUNT';
const CURRENCY = 'EGP';
const SKELETON_COLS = [0, 1, 2, 3, 4];

const STATUS_STYLE = {
  ACTIVE:    { hex: '#34d399', ink: INK },
  SCHEDULED: { hex: '#fbbf24', ink: INK },
  EXPIRED:   { hex: '#ef4444', ink: '#ffffff' },
};
const FALLBACK_STATUS = { hex: '#9ca3af', ink: INK };

const EMPTY_FORM = {
  name: '', description: '', discountValue: '',
  discountType: FIXED, status: 'ACTIVE',
  startDate: null, endDate: null,
};

const MAX_FIXED = 1_000_000;
const NAME_MAX = 80;
const DESC_MAX = 300;

const INPUT = 'nb-input w-full px-3.5 py-2.5 text-sm font-semibold';
const HEAD_CLS = 'sticky top-0 z-10 nb-gray shadow-[0_2px_0_0_var(--nb-line)]';
const ACTION_BTN = `${BTN} h-8 px-2.5 text-[11px] uppercase rtl:tracking-normal`;


const DATEPICKER_CSS = `
.react-datepicker-wrapper{width:100%}
.react-datepicker{font-family:inherit;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);border-radius:0;box-shadow:3px 3px 0 var(--nb-shadow)}
.react-datepicker__header{background:var(--nb-gray);border-bottom:2px solid var(--nb-line);border-radius:0}
.react-datepicker__current-month,.react-datepicker__day-name,.react-datepicker-time__header,.react-datepicker__day,.react-datepicker__time-list-item{color:var(--nb-ink);font-weight:700}
.react-datepicker__day:hover,.react-datepicker__time-list-item:hover{background:var(--nb-gray)!important;border-radius:0}
.react-datepicker__day--selected,.react-datepicker__day--keyboard-selected,.react-datepicker__time-list-item--selected{background:var(--nb-btn)!important;color:var(--nb-on)!important;border-radius:0}
.react-datepicker__day--disabled{opacity:.35}
.react-datepicker__triangle{display:none}
.react-datepicker__time-container,.react-datepicker__time,.react-datepicker__time-box{background:var(--nb-card)}
.react-datepicker__time-container{border-inline-start:2px solid var(--nb-line)}
`;
const PAGE_CSS = `${UI3D_CSS}${EXTRAS_CSS}${SCROLL_CSS}${DATEPICKER_CSS}`;

const SORTERS = {
  newest: (a, b) => b.ts - a.ts,
  oldest: (a, b) => a.ts - b.ts,
  highest: (a, b) => b.value - a.value,
  lowest: (a, b) => a.value - b.value,
};

const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

const normType = (v) => {
  const s = String(v ?? '').toUpperCase();
  if (s === 'PERCENTAGE' || s === 'PERCENT') return 'PERCENTAGE';
  if (s === 'FIXED_AMOUNT' || s === 'FIXED_VALUE' || s === 'FIXED') return FIXED;
  return '';
};

const formatDiscount = (o, nf) => {
  const n = nf.format(num(o.discountValue));
  return o.discountType === 'PERCENTAGE' ? `${n}%` : `${n}\u00A0${CURRENCY}`;
};

const CLEAN_RE = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069<>]/g;
const cleanText = (v, max) => String(v ?? '').replace(CLEAN_RE, '').slice(0, max);
const sanitizeNumber = (v) => {
  const s = String(v ?? '').replace(/[^\d.]/g, '');
  const i = s.indexOf('.');
  return (i < 0 ? s : `${s.slice(0, i + 1)}${s.slice(i + 1).replace(/\./g, '')}`).slice(0, 10);
};

const validateForm = (f, v) => {
  const e = {};
  if (cleanText(f.name, NAME_MAX).trim().length < 2) e.name = v.name;
  const n = Number(f.discountValue);
  if (!f.discountValue || !Number.isFinite(n) || n <= 0) e.discountValue = v.value;
  else if (n > MAX_FIXED) e.discountValue = v.valueTooBig;
  if (!isValidDate(f.startDate)) e.startDate = v.startRequired;
  if (!isValidDate(f.endDate)) e.endDate = v.endRequired;
  else if (isValidDate(f.startDate) && f.endDate <= f.startDate) e.endDate = v.endAfter;
  return e;
};

const buildPayload = (f) => ({
  name: cleanText(f.name, NAME_MAX).trim(),
  description: cleanText(f.description, DESC_MAX).trim(),
  discountValue: Number(f.discountValue),
  discountType: FIXED,
  status: STATUSES.includes(f.status) ? f.status : 'ACTIVE',
  startDate: f.startDate.toISOString(),
  endDate: f.endDate.toISOString(),
});



const StatusPill = memo(({ status, labels }) => {
  const m = STATUS_STYLE[status] || FALLBACK_STATUS;
  return (
    <span className="nb-chip !normal-case" style={{ background: m.hex, color: m.ink }}>
      {labels[status] || status || '—'}
    </span>
  );
});

const TabBtn = memo(({ k, active, label, count, onSelect }) => {
  const click = useCallback(() => onSelect(k), [onSelect, k]);
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={click}
      className={`${BTN} flex-shrink-0 px-3 py-2 text-xs uppercase rtl:tracking-normal ${active ? 'nb-btn-on' : ''}`}
    >
      {label}
      <span className="nb-chip !px-1.5" style={active ? undefined : { background: 'var(--nb-gray)' }}>{count}</span>
    </button>
  );
});

const OfferRow = memo(({ offer, busy, loc, onDetails, onCopy, onToggle, onEdit, onDelete }) => {
  const { L, fm } = loc;
  const t = L.offers;
  const isActive = offer.status === 'ACTIVE';
  const toggle = useCallback(() => onToggle(offer), [onToggle, offer]);
  const edit = useCallback(() => onEdit(offer), [onEdit, offer]);
  const details = useCallback(() => onDetails(offer), [onDetails, offer]);
  const copy = useCallback(() => onCopy(offer.id), [onCopy, offer.id]);
  const del = useCallback(() => onDelete(offer.id), [onDelete, offer.id]);
  return (
    <tr>
      <td className="px-3 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <IconTile icon={FiTag} tone="am" className="h-9 w-9 flex-shrink-0" size={16} />
          <div className="min-w-0">
            <p className="max-w-[220px] truncate text-xs font-extrabold">{offer.name}</p>
            <p className="nb-muted max-w-[220px] truncate text-[10px] font-semibold">{offer.description || t.noDescription}</p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <span className="nb-chip !text-[13px] !normal-case tabular-nums" style={{ background: 'var(--nb-gray)' }}>
          {formatDiscount(offer, fm.number)}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <p className="text-xs font-extrabold">{fmt(fm.date, offer.startDate)}</p>
        <p className="nb-muted text-[10px] font-semibold">{tpl(t.to, { d: fmt(fm.date, offer.endDate) })}</p>
      </td>
      <td className="whitespace-nowrap px-3 py-3"><StatusPill status={offer.status} labels={t.status} /></td>
      <td className="whitespace-nowrap px-3 py-3">
        <div className="flex items-center gap-1.5">
          <button type="button" disabled={busy} onClick={toggle} className={ACTION_BTN}>
            <FiPower size={12} aria-hidden="true" /> {isActive ? t.stop : t.activate}
          </button>
          <button type="button" disabled={busy} onClick={edit} className={ACTION_BTN}><FiEdit3 size={12} aria-hidden="true" /> {t.edit}</button>
          <button type="button" title={t.detailsAria} aria-label={t.detailsAria} onClick={details} className={BTN_ICON}><FiInfo size={14} /></button>
          <button type="button" title={t.copyAria} aria-label={t.copyAria} onClick={copy} className={BTN_ICON}><FiCopy size={13} /></button>
          <button type="button" title={t.deleteAria} aria-label={t.deleteAria} disabled={busy} onClick={del} className={`${BTN_ICON} !text-red-600 dark:!text-red-300`}><FiTrash2 size={13} /></button>
        </div>
      </td>
    </tr>
  );
});

const OfferDetailsModal = memo(({ offer, busy, loc, onClose, onCopy, onToggle, onEdit }) => {
  useEscape(onClose);
  const { L, fm } = loc;
  const t = L.offers;
  const d = t.details;
  const isActive = offer.status === 'ACTIVE';
  const copy = useCallback(() => onCopy(offer.id), [onCopy, offer.id]);
  return (
    <Overlay onClose={onClose}>
      <div role="dialog" aria-modal="true" aria-label={d.title} className="nb-card relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden">
        <div className="nb-gray nb-line flex flex-shrink-0 items-center justify-between border-b-2 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <IconTile icon={FiTag} tone="am" className="h-9 w-9 flex-shrink-0" size={16} />
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold uppercase rtl:tracking-normal"><span className="nb-ul">{d.title}</span></h3>
              <p dir="ltr" className="nb-muted mt-1 flex items-center gap-1.5 text-[10px] font-bold tabular-nums">
                #{shortId(offer.id)}
                <button type="button" aria-label={t.copyAria} onClick={copy} className="hover:text-[color:var(--nb-accent)]"><FiCopy size={10} /></button>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={d.close} className={BTN_ICON}><FiX size={15} /></button>
        </div>

        <div className="slim-scroll space-y-4 overflow-y-auto px-5 py-4">
          <div className={`${PANEL} p-3.5`}>
            <p className="text-sm font-extrabold">{offer.name}</p>
            <p className="nb-muted mt-1.5 break-words text-[11px] font-semibold leading-relaxed">{offer.description || d.noDescription}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className={`${PANEL} p-3 text-center`}>
              <p className="nb-muted mb-1 text-[9px] font-bold uppercase rtl:tracking-normal">{d.value}</p>
              <p className="text-lg font-extrabold tabular-nums">{formatDiscount(offer, fm.number)}</p>
            </div>
            <div className={`${PANEL} p-3 text-center`}>
              <p className="nb-muted mb-1.5 text-[9px] font-bold uppercase rtl:tracking-normal">{d.status}</p>
              <StatusPill status={offer.status} labels={t.status} />
            </div>
          </div>

          <div className="nb-card overflow-hidden">
            <div className="nb-gray nb-line flex items-center gap-2 border-b-2 px-3.5 py-2.5">
              <FiCalendar className="nb-ic" size={12} aria-hidden="true" />
              <p className="text-[10px] font-extrabold uppercase rtl:tracking-normal">{d.period}</p>
            </div>
            <div className="nb-rows">
              <div className="flex items-center justify-between border-b-2 border-dotted px-3.5 py-2.5" style={{ borderColor: 'var(--nb-dot)' }}>
                <span className="nb-muted text-[11px] font-bold">{d.from}</span>
                <span className="text-xs font-extrabold">{fmt(fm.full, offer.startDate)}</span>
              </div>
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <span className="nb-muted text-[11px] font-bold">{d.until}</span>
                <span className="text-xs font-extrabold text-red-500">{fmt(fm.full, offer.endDate)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="nb-gray nb-line flex flex-shrink-0 gap-2.5 border-t-2 px-5 py-4">
          <button type="button" disabled={busy} onClick={onToggle} className={`${BTN_PRIMARY} flex-1 uppercase rtl:tracking-normal`}>
            {isActive ? d.stopOffer : d.activateOffer}
          </button>
          <button type="button" disabled={busy} onClick={onEdit} className={`${BTN_MD} flex-1 uppercase rtl:tracking-normal`}>{d.editOffer}</button>
          <button type="button" onClick={onClose} className={`${BTN_MD} uppercase rtl:tracking-normal`}>{d.close}</button>
        </div>
      </div>
    </Overlay>
  );
});

const Field = memo(({ label, htmlFor, error, className = '', children }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className={LABEL}>{label}</label>
    {children}
    {error && <p role="alert" className="mt-1.5 text-[11px] font-bold text-red-500">{error}</p>}
  </div>
));

const PICKER_FALLBACK = <div className={`${INPUT} h-[42px]`} aria-hidden="true" />;
const POPPER_PROPS = { strategy: 'fixed' };

const PickerSlot = (props) => (
  <Suspense fallback={PICKER_FALLBACK}>
    <DatePicker {...props} />
  </Suspense>
);

const AddEditModal = memo(({ editingOffer, formData, errors, saving, loc, darkMode, onChange, onClose, onSubmit }) => {
  useEscape(onClose);
  const { L, fm, isAr } = loc;
  const f = L.offers.form;
  const nf = fm.number;
  const dateLocale = isAr ? ar : enUS;
  const valueLabel = f.valueLabel[FIXED] || f.valueLabel.none;

  const setName = useCallback((e) => onChange((p) => ({ ...p, name: cleanText(e.target.value, NAME_MAX) })), [onChange]);
  const setValue = useCallback((e) => onChange((p) => ({ ...p, discountValue: sanitizeNumber(e.target.value) })), [onChange]);
  const setDesc = useCallback((e) => onChange((p) => ({ ...p, description: cleanText(e.target.value, DESC_MAX) })), [onChange]);
  const setStart = useCallback((v) => onChange((p) => ({ ...p, startDate: v })), [onChange]);
  const setEnd = useCallback((v) => onChange((p) => ({ ...p, endDate: v })), [onChange]);
  const setType = useCallback(() => onChange((p) => (p.discountType === FIXED ? p : { ...p, discountType: FIXED })), [onChange]);

  const typeOptions = useMemo(() => [{ value: FIXED, label: f.typeFixed }], [f.typeFixed]);
  const descLabel = useMemo(
    () => tpl(f.desc, { n: nf.format(formData.description.length), m: nf.format(DESC_MAX) }),
    [f.desc, nf, formData.description.length],
  );
  const handleFormSubmit = useCallback((e) => { e.preventDefault(); onSubmit(); }, [onSubmit]);

  return (
    <Overlay onClose={onClose}>
      <form
        noValidate
        onSubmit={handleFormSubmit}
        role="dialog"
        aria-modal="true"
        aria-label={editingOffer ? f.ariaEdit : f.ariaAdd}
        className="nb-card relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden"
      >
        <div className="nb-gray nb-line flex flex-shrink-0 items-center justify-between border-b-2 px-6 py-4">
          <div className="flex items-center gap-3">
            <IconTile icon={FiTag} tone="am" className="h-10 w-10" size={18} />
            <h3 className="text-base font-extrabold uppercase rtl:tracking-normal"><span className="nb-ul">{editingOffer ? f.titleEdit : f.titleAdd}</span></h3>
          </div>
          <button type="button" onClick={onClose} aria-label={f.close} className={BTN_ICON}><FiX size={15} /></button>
        </div>

        <div className="slim-scroll grid grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">
          <Field label={f.name} htmlFor="offer-name" error={errors.name} className="md:col-span-2">
            <input id="offer-name" type="text" value={formData.name} maxLength={NAME_MAX} autoComplete="off" aria-invalid={!!errors.name} onChange={setName} className={`${INPUT} ${errors.name ? '!border-red-500' : ''}`} />
          </Field>
          <Field label={valueLabel} htmlFor="offer-value" error={errors.discountValue}>
            <input id="offer-value" type="text" inputMode="decimal" value={formData.discountValue} autoComplete="off" aria-invalid={!!errors.discountValue} onChange={setValue} className={`${INPUT} ${errors.discountValue ? '!border-red-500' : ''}`} dir="ltr" />
          </Field>
          <Field label={f.type} error={errors.discountType}>
            <Dropdown
              value={FIXED}
              onChange={setType}
              options={typeOptions}
              placeholder={f.typePlaceholder}
              ariaLabel={f.type}
              icon={FiDollarSign}
              darkMode={darkMode}
            />
          </Field>
          <Field label={f.start} htmlFor="offer-start" error={errors.startDate}>
            <PickerSlot id="offer-start" selected={formData.startDate} onChange={setStart} showTimeSelect dateFormat="dd/MM/yyyy HH:mm" locale={dateLocale} autoComplete="off" popperProps={POPPER_PROPS} className={`${INPUT} ${errors.startDate ? '!border-red-500' : ''}`} />
          </Field>
          <Field label={f.end} htmlFor="offer-end" error={errors.endDate}>
            <PickerSlot id="offer-end" selected={formData.endDate} onChange={setEnd} showTimeSelect minDate={formData.startDate || undefined} dateFormat="dd/MM/yyyy HH:mm" locale={dateLocale} autoComplete="off" popperProps={POPPER_PROPS} className={`${INPUT} ${errors.endDate ? '!border-red-500' : ''}`} />
          </Field>
          <Field label={descLabel} htmlFor="offer-desc" className="md:col-span-2">
            <textarea id="offer-desc" value={formData.description} maxLength={DESC_MAX} rows="3" onChange={setDesc} className={`${INPUT} resize-none`} />
          </Field>
        </div>

        <div className="nb-gray nb-line flex flex-shrink-0 gap-3 border-t-2 px-6 py-4">
          <button type="button" onClick={onClose} className={`${BTN_MD} flex-1 py-2.5 uppercase rtl:tracking-normal`}>{f.cancel}</button>
          <button type="submit" disabled={saving} className={`${BTN_PRIMARY} flex-1 py-2.5 uppercase rtl:tracking-normal`}>
            {saving ? <FiRefreshCw size={13} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <FiCheck size={13} aria-hidden="true" />}
            {editingOffer ? f.save : f.create}
          </button>
        </div>
      </form>
    </Overlay>
  );
});



const ShopOffers = () => {
  const darkMode = useDarkMode();
  const loc = useShopLocale();
  const { language, L, fm, dir, font } = loc;
  const t = L.offers;
  const tt = L.table;
  const nf = fm.number;

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [detailsId, setDetailsId] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());

  const offersRef = useRef(offers);
  const inflight = useRef(new Set());
  const savingRef = useRef(false);
  const abortRef = useRef(null);
  const locRef = useRef(loc);
  offersRef.current = offers;
  locRef.current = loc;
  useEffect(() => { document.title = t.docTitle; }, [t.docTitle]);

  const term = useDeferredValue(search).trim().toLowerCase();

  const fetchOffers = useCallback(async ({ silent = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/api/shop/offers', { signal: controller.signal });
      const raw = Array.isArray(res.data) ? res.data : res.data?.content || [];
      const data = [];
      for (const o of raw) {
        if (o && o.id != null) data.push({ ...o, discountType: normType(o.discountType) });
      }
      if (!controller.signal.aborted) { setOffers(data); setLastUpdated(new Date()); }
    } catch (err) {
      if (!controller.signal.aborted && !silent) toast({ icon: 'error', title: locRef.current.L.offers.toasts.loadFail, text: errText(err) });
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
    return () => abortRef.current?.abort();
  }, [fetchOffers]);

  const handleEdit = useCallback((offer) => {
    setEditingOffer(offer);
    setFormData({
      name: cleanText(offer.name, NAME_MAX),
      description: cleanText(offer.description, DESC_MAX),
      discountValue: String(offer.discountValue ?? ''),
      discountType: FIXED,
      status: STATUSES.includes(offer.status) ? offer.status : 'ACTIVE',
      startDate: new Date(offer.startDate),
      endDate: new Date(offer.endDate),
    });
    setFormErrors({});
    setShowAddEdit(true);
  }, []);

  const runOnOffer = useCallback(async (id, optimistic, rollback, request, successToast, failTitle) => {
    if (!isSafeId(id) || inflight.current.has(id)) return false;
    inflight.current.add(id);
    setBusyIds(new Set(inflight.current));
    setOffers(optimistic);
    try {
      await request();
      toast({ icon: 'success', ...successToast });
      fetchOffers({ silent: true });
      return true;
    } catch (err) {
      setOffers(rollback);
      toast({ icon: 'error', title: failTitle, text: errText(err) });
      return false;
    } finally {
      inflight.current.delete(id);
      setBusyIds(new Set(inflight.current));
    }
  }, [fetchOffers]);

  const deleteOffer = useCallback(async (offerId) => {
    if (!isSafeId(offerId)) return;
    const offer = offersRef.current.find((o) => o.id === offerId);
    if (!offer) return;
    const { L: LL } = locRef.current;
    const x = LL.offers;
    let isConfirmed = false;
    try {
      ({ isConfirmed } = await confirmDialog({
        title: x.confirmDelete.title,
        text: x.confirmDelete.text,
        icon: 'warning',
        confirmButtonText: x.confirmDelete.yes,
        cancelButtonText: LL.table.cancel,
        confirmButtonColor: '#ef4444',
      }));
    } catch {
      toast({ icon: 'error', title: x.toasts.confirmFail, text: x.toasts.confirmFailText });
      return;
    }
    if (!isConfirmed) return;
    runOnOffer(
      offerId,
      (prev) => prev.filter((o) => o.id !== offerId),
      (prev) => (prev.some((o) => o.id === offerId) ? prev : [offer, ...prev]),
      () => api.delete(`/api/shop/offers/${encodeURIComponent(offerId)}`),
      { title: x.toasts.deleted, text: x.toasts.deletedText },
      x.toasts.deleteFail,
    );
  }, [runOnOffer]);

  const toggleOfferStatus = useCallback((offer) => {
    const x = locRef.current.L.offers.toasts;
    const next = offer.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
    return runOnOffer(
      offer.id,
      (prev) => prev.map((o) => (o.id === offer.id ? { ...o, status: next } : o)),
      (prev) => prev.map((o) => (o.id === offer.id ? { ...o, status: offer.status } : o)),
      () => api.put(`/api/shop/offers/${encodeURIComponent(offer.id)}`, {
        name: offer.name,
        description: offer.description || '',
        discountValue: num(offer.discountValue),
        discountType: offer.discountType || FIXED,
        startDate: offer.startDate,
        endDate: offer.endDate,
        status: next,
      }),
      next === 'ACTIVE'
        ? { title: x.activated, text: x.activatedText }
        : { title: x.stopped, text: x.stoppedText },
      x.toggleFail,
    );
  }, [runOnOffer]);

  const handleSubmit = useCallback(async () => {
    if (savingRef.current) return;
    const x = locRef.current.L.offers;
    const errors = validateForm(formData, x.validation);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    if (editingOffer && !isSafeId(editingOffer.id)) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const payload = buildPayload(formData);
      if (editingOffer) {
        await api.put(`/api/shop/offers/${encodeURIComponent(editingOffer.id)}`, payload);
        toast({ icon: 'success', title: x.toasts.edited, text: x.toasts.editedText });
      } else {
        await api.post('/api/shop/offers', payload);
        toast({ icon: 'success', title: x.toasts.added, text: x.toasts.addedText });
      }
      setShowAddEdit(false);
      fetchOffers({ silent: true });
    } catch (err) {
      toast({ icon: 'error', title: x.toasts.saveFail, text: errText(err) });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [formData, editingOffer, fetchOffers]);

  const index = useMemo(() => offers.map((o) => ({
    o,
    ts: toTs(o.startDate),
    value: num(o.discountValue),
    text: `${o.name || ''} ${o.description || ''}`.toLowerCase(),
  })), [offers]);

  const counts = useMemo(() => {
    const c = { all: offers.length, PERCENTAGE: 0, FIXED_AMOUNT: 0 };
    for (const o of offers) {
      c[o.status] = (c[o.status] || 0) + 1;
      if (o.discountType === 'PERCENTAGE' || o.discountType === FIXED) c[o.discountType] += 1;
    }
    return c;
  }, [offers]);

  const filtered = useMemo(() => {
    const list = [];
    for (const e of index) {
      const { o, text } = e;
      if (
        (statusFilter === 'all' || o.status === statusFilter)
        && (discountTypeFilter === 'all' || o.discountType === discountTypeFilter)
        && (!term || text.includes(term))
      ) list.push(e);
    }
    list.sort(SORTERS[sortBy] || SORTERS.newest);
    return list.map((e) => e.o);
  }, [index, statusFilter, discountTypeFilter, term, sortBy]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, discountTypeFilter, term, sortBy, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);

  const statCards = useMemo(() => [
    { label: t.stats.total.label, value: nf.format(counts.all), description: t.stats.total.desc, icon: FiTag, tone: 'am' },
    { label: t.stats.active.label, value: nf.format(counts.ACTIVE || 0), description: t.stats.active.desc, icon: FiCheckCircle, tone: 'em' },
    { label: t.stats.percent.label, value: nf.format(counts.PERCENTAGE), description: t.stats.percent.desc, icon: FiPercent, tone: 'sky' },
    { label: t.stats.fixed.label, value: nf.format(counts.FIXED_AMOUNT), description: t.stats.fixed.desc, icon: FiDollarSign, tone: 'vi' },
  ], [counts, t, nf]);

  const filterGroups = useMemo(() => [
    [t.groups.sort, SORT_KEYS.map((k) => ({ value: k, label: t.sort[k] })), sortBy, setSortBy],
    [t.groups.type, TYPE_KEYS.map((k) => ({ value: k, label: t.discountTypes[k] })), discountTypeFilter, setDiscountTypeFilter],
  ], [t, sortBy, discountTypeFilter]);

  const detailsOffer = useMemo(() => (detailsId == null ? null : offers.find((o) => o.id === detailsId) || null), [offers, detailsId]);

  const handleDetails = useCallback((o) => setDetailsId(o.id), []);
  const closeDetails = useCallback(() => setDetailsId(null), []);
  const closeFilter = useCallback(() => setShowFilterPanel(false), []);
  const openFilter = useCallback(() => setShowFilterPanel(true), []);
  const closeAddEdit = useCallback(() => { if (!savingRef.current) setShowAddEdit(false); }, []);
  const refresh = useCallback(() => fetchOffers(), [fetchOffers]);
  const handleCopy = useCallback(async (id) => {
    const x = locRef.current.L.offers.toasts;
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ icon: 'success', title: x.copied, text: x.copiedText, timer: 2000 });
    } catch {
      toast({ icon: 'error', title: x.copyFail, text: x.copyFailText });
    }
  }, []);
  const openAdd = useCallback(() => {
    setEditingOffer(null); setFormData(EMPTY_FORM); setFormErrors({}); setShowAddEdit(true);
  }, []);
  const resetFilters = useCallback(() => { setDiscountTypeFilter('all'); setSortBy('newest'); }, []);

  const toggleFromDetails = useCallback(() => {
    const o = offersRef.current.find((x) => x.id === detailsId);
    if (o) toggleOfferStatus(o);
    closeDetails();
  }, [detailsId, toggleOfferStatus, closeDetails]);
  const editFromDetails = useCallback(() => {
    const o = offersRef.current.find((x) => x.id === detailsId);
    if (o) handleEdit(o);
    closeDetails();
  }, [detailsId, handleEdit, closeDetails]);

  const toggleDateSort = useCallback(() => setSortBy((s) => (s === 'newest' ? 'oldest' : 'newest')), []);
  const toggleValueSort = useCallback(() => setSortBy((s) => (s === 'highest' ? 'lowest' : 'highest')), []);
  const onSearchChange = useCallback((e) => setSearch(sanitizeSearch(e.target.value)), []);

  const activeFilterCount = (discountTypeFilter !== 'all') + (sortBy !== 'newest');
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);
  const skeletonRows = useMemo(() => Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => i), [rowsPerPage]);

  return (
    <div
      dir={dir}
      lang={language}
      style={font}
      className="nb-page min-h-screen py-6 lg:ps-64 mt-16 text-start"
    >
      <style>{PAGE_CSS}</style>
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <div key={language} className="lang-fade mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="nb-bar" aria-hidden="true" />
            <h1 className="mt-2 text-2xl font-extrabold leading-[1.15] tracking-tight rtl:tracking-normal sm:text-3xl">
              <span className="nb-ul">{t.title[0]}{t.title[1]}</span>
            </h1>
            <p className="nb-muted mt-2 text-xs font-semibold">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2.5">
            {lastUpdated && (
              <p className="nb-chip hidden !normal-case sm:inline-flex" role="status" aria-live="polite">
                {tpl(tt.lastUpdated, { t: fmt(fm.time, lastUpdated) })}
              </p>
            )}
            <button type="button" onClick={refresh} aria-label={tt.refresh} title={tt.refresh} className={`${BTN_MD} h-10 uppercase rtl:tracking-normal`}>
              <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" /> {tt.refresh}
            </button>
            <button type="button" onClick={openAdd} className={`${BTN_PRIMARY} h-10 uppercase rtl:tracking-normal`}>
              <FiPlus size={15} aria-hidden="true" /> {t.add}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <section className={`${CARD} min-w-0 overflow-hidden`}>
          <div className="nb-gray nb-line flex flex-wrap items-center gap-2.5 border-b-2 p-3 sm:p-4">
            <div className="relative min-w-[220px] flex-1">
              <FiSearch className="nb-muted pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2" size={16} aria-hidden="true" />
              <input
                type="search"
                value={search}
                maxLength={SEARCH_MAX}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                aria-label={t.searchAria}
                placeholder={t.searchPlaceholder}
                onChange={onSearchChange}
                className="nb-input h-10 w-full ps-10 pe-3 text-sm font-semibold"
              />
            </div>
            <RowsDropdown value={rowsPerPage} onChange={setRowsPerPage} label={tt.rows} formatNumber={nf.format} />
            <button type="button" onClick={openFilter} className={`${BTN_MD} relative h-10 uppercase rtl:tracking-normal`}>
              <FiFilter size={14} aria-hidden="true" /> {tt.filter}
              {activeFilterCount > 0 && (
                <span className="nb-chip absolute -end-2 -top-2.5 !px-1.5" style={{ background: 'var(--nb-accent)', color: INK }}>{nf.format(activeFilterCount)}</span>
              )}
            </button>
          </div>

          <div role="tablist" aria-label={t.tabsAria} className="slim-scroll nb-line flex gap-2 overflow-x-auto border-b-2 p-3">
            {TABS.map((s) => (
              <TabBtn key={s} k={s} active={statusFilter === s} label={t.status[s]} count={nf.format(counts[s] || 0)} onSelect={setStatusFilter} />
            ))}
          </div>

          <div className="slim-scroll max-h-[68vh] overflow-auto" aria-busy={loading}>
            <table className="w-full min-w-[900px] border-collapse text-start">
              <thead className={HEAD_CLS}>
                <tr>
                  <th scope="col" className={TH}>{t.columns.offer}</th>
                  <SortTh label={t.columns.discount} active={sortBy === 'highest' || sortBy === 'lowest'} dir={sortBy === 'lowest' ? 'asc' : 'desc'} onClick={toggleValueSort} />
                  <SortTh label={t.columns.validity} active={sortBy === 'newest' || sortBy === 'oldest'} dir={sortBy === 'oldest' ? 'asc' : 'desc'} onClick={toggleDateSort} />
                  <th scope="col" className={TH}>{t.columns.status}</th>
                  <th scope="col" className={TH}>{t.columns.actions}</th>
                </tr>
              </thead>
              <tbody className="nb-rows">
                {loading && offers.length === 0 ? (
                  skeletonRows.map((i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {SKELETON_COLS.map((j) => (
                        <td key={j} className="px-3 py-4"><div className="nb-gray nb-line h-3.5 w-full border-2" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14">
                      <EmptyState3D kind="box" title={t.empty.title} subtitle={t.empty.sub} darkMode={darkMode} />
                    </td>
                  </tr>
                ) : (
                  paginated.map((o) => (
                    <OfferRow
                      key={o.id}
                      offer={o}
                      busy={busyIds.has(o.id)}
                      loc={loc}
                      onDetails={handleDetails}
                      onCopy={handleCopy}
                      onToggle={toggleOfferStatus}
                      onEdit={handleEdit}
                      onDelete={deleteOffer}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="nb-gray nb-line flex flex-col items-center justify-between gap-3 border-t-2 px-4 py-3 sm:flex-row">
              <p className="nb-muted text-xs font-semibold">
                {renderTpl(t.showing, {
                  range: <b className="tabular-nums" style={{ color: 'var(--nb-ink)' }}>{nf.format(from)}–{nf.format(to)}</b>,
                  total: <b className="tabular-nums" style={{ color: 'var(--nb-ink)' }}>{nf.format(filtered.length)}</b>,
                })}
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} labels={tt} formatNumber={nf.format} />}
            </div>
          )}
        </section>
      </div>

      {detailsOffer && (
        <OfferDetailsModal
          offer={detailsOffer}
          busy={busyIds.has(detailsOffer.id)}
          loc={loc}
          onClose={closeDetails}
          onCopy={handleCopy}
          onToggle={toggleFromDetails}
          onEdit={editFromDetails}
        />
      )}

      {showFilterPanel && (
        <FilterPanel
          title={t.filterTitle}
          note={t.filterNote}
          groups={filterGroups}
          labels={tt}
          onReset={resetFilters}
          onClose={closeFilter}
        />
      )}

      {showAddEdit && (
        <AddEditModal
          editingOffer={editingOffer}
          formData={formData}
          errors={formErrors}
          saving={saving}
          loc={loc}
          darkMode={darkMode}
          onChange={setFormData}
          onClose={closeAddEdit}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default memo(ShopOffers);