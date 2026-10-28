import React, {
  useState, useEffect, useCallback, useMemo, useRef, useDeferredValue, memo,
} from 'react';
import {
  FiSearch, FiInfo, FiChevronRight, FiX, FiCheck, FiFilter, FiCopy, FiTool, FiPackage,
  FiCreditCard, FiDollarSign, FiMapPin, FiAlertCircle, FiHome, FiTruck, FiClock,
  FiCheckCircle, FiXCircle, FiRefreshCw, FiEdit2,
} from 'react-icons/fi';
import { RiStore2Line } from 'react-icons/ri';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../components/user/UiExtras';
import {
  POLL_MS, SEARCH_MAX, SPAN_MS, BTN, BTN_MD, BTN_ICON, BTN_PRIMARY, CARD, PANEL, TH, SCROLL_CSS,
  toTs, fmt, num, formatPrice, timeAgo, tpl, renderTpl, sanitizeSearch, isSafeId, shortId, errText,
  upper, confirmDialog, useDarkMode, useEscape, useShopLocale,
  StatCard, RowsDropdown, SortTh, Pagination, Overlay, FilterPanel, IconTile, LABEL,
} from '../components/shop/TableKit';
import { ensureShopAssets } from '../common/utils/shopFonts';

ensureShopAssets();

const INK = '#04261a';
const STATUSES = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'QUOTE_REJECTED', 'DEVICE_COLLECTED', 'REPAIRING', 'REPAIR_COMPLETED', 'DEVICE_DELIVERED', 'CANCELLED', 'FAILED'];
const TABS = ['all', ...STATUSES];
const LIFECYCLE_STATUSES = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'DEVICE_COLLECTED', 'REPAIRING', 'REPAIR_COMPLETED', 'DEVICE_DELIVERED'];
const TERMINAL_NEGATIVE = ['CANCELLED', 'FAILED', 'QUOTE_REJECTED'];
const PRICE_STATUSES = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_REJECTED'];
const PRICE_MAX = 1_000_000;
const SKELETON_COLS = [0, 1, 2, 3, 4, 5, 6];

const NEXT_STATUSES = {
  SUBMITTED: ['CANCELLED'],
  QUOTE_SENT: ['QUOTE_APPROVED', 'QUOTE_REJECTED'],
  QUOTE_APPROVED: ['DEVICE_COLLECTED'],
  QUOTE_REJECTED: ['CANCELLED'],
  DEVICE_COLLECTED: ['REPAIRING'],
  REPAIRING: ['REPAIR_COMPLETED'],
  REPAIR_COMPLETED: [],
  DEVICE_DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
};

const DELIVERY_KEYS = ['SHOP_VISIT', 'HOME_DELIVERY', 'COURIER'];
const PAYMENT_KEYS = ['CASH', 'CARD', 'ONLINE'];
const SORT_KEYS = ['newest', 'oldest', 'highest', 'lowest'];
const RANGE_KEYS = ['all', 'today', 'week', 'month'];

const DELIVERY_ICON = { SHOP_VISIT: RiStore2Line, HOME_DELIVERY: FiHome, COURIER: FiTruck };
const PAYMENT_ICON = { CASH: FiDollarSign, CARD: FiCreditCard, CREDIT_CARD: FiCreditCard, ONLINE: FiCreditCard };

const normPayment = (v) => { const u = upper(v); return u === 'CREDIT_CARD' ? 'CARD' : u; };
const hasText = (v) => String(v ?? '').trim().length > 0;
const hasValidDate = (v) => v != null && v !== '' && !Number.isNaN(new Date(v).getTime());
const getNotSetLabel = (t, isAr) => t.notSelected || (isAr ? 'غير محدد' : 'Not selected');

const normDate = (v) => {
  if (Array.isArray(v) && v.length >= 3) {
    const [y, m, d, h = 0, mi = 0, s = 0] = v;
    return new Date(y, m - 1, d, h, mi, s).toISOString();
  }
  return v;
};

const shallowEqual = (a, b) => {
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
};

const mergeRepairs = (prev, next) => {
  const byId = new Map(prev.map((r) => [r.id, r]));
  let changed = prev.length !== next.length;
  const out = next.map((n, i) => {
    const p = byId.get(n.id);
    const item = p && shallowEqual(p, n) ? p : n;
    if (prev[i] !== item) changed = true;
    return item;
  });
  return changed ? out : prev;
};

const getDeliveryMeta = (v, labels) => {
  const k = upper(v);
  return { label: labels[k] || (v ? String(v).slice(0, 30) : '—'), icon: DELIVERY_ICON[k] || FiMapPin };
};
const getPaymentMeta = (v, labels) => {
  const k = normPayment(v);
  return { label: labels[k] || (v ? String(v).slice(0, 30) : '—'), icon: PAYMENT_ICON[upper(v)] || FiDollarSign };
};

const STATUS_META = {
  SUBMITTED:        { hex: '#38bdf8', ink: INK,       icon: FiClock,       tone: 'sky' },
  QUOTE_SENT:       { hex: '#2dd4bf', ink: INK,       icon: FiDollarSign,  tone: 'te' },
  QUOTE_APPROVED:   { hex: '#a3e635', ink: INK,       icon: FiCheckCircle, tone: 'lime' },
  QUOTE_REJECTED:   { hex: '#fbbf24', ink: INK,       icon: FiXCircle,     tone: 'am' },
  DEVICE_COLLECTED: { hex: '#a78bfa', ink: INK,       icon: FiPackage,     tone: 'vi' },
  REPAIRING:        { hex: '#fb923c', ink: INK,       icon: FiTool,        tone: 'am' },
  REPAIR_COMPLETED: { hex: '#34d399', ink: INK,       icon: FiCheck,       tone: 'em' },
  DEVICE_DELIVERED: { hex: '#10b981', ink: INK,       icon: FiTruck,       tone: 'em' },
  CANCELLED:        { hex: '#ef4444', ink: '#ffffff', icon: FiXCircle,     tone: 'ro' },
  FAILED:           { hex: '#dc2626', ink: '#ffffff', icon: FiAlertCircle, tone: 'ro' },
};
const FALLBACK_META = { hex: '#9ca3af', ink: INK, icon: FiInfo, tone: 'sky' };
const getMeta = (s) => STATUS_META[s] || FALLBACK_META;

const toStyles = (meta) => ({
  chip: { background: meta.hex, color: meta.ink },
  swatch: { background: meta.hex },
});
const STATUS_STYLES = Object.fromEntries(Object.entries(STATUS_META).map(([k, m]) => [k, toStyles(m)]));
const FALLBACK_STYLES = toStyles(FALLBACK_META);
const getStyles = (s) => STATUS_STYLES[s] || FALLBACK_STYLES;

const STEP_ON = { background: 'var(--nb-accent)' };
const STEP_OFF = { background: 'var(--nb-gray)' };
const LINE_ON = { background: 'var(--nb-accent)' };
const LINE_OFF = { background: 'var(--nb-dot)', opacity: 0.35 };
const TAB_CHIP_OFF = { background: 'var(--nb-gray)' };
const FILTER_BADGE = { background: 'var(--nb-accent)', color: INK };
const BOLD_STYLE = { color: 'var(--nb-ink)' };

const SORTERS = {
  newest: (a, b) => b.ts - a.ts,
  oldest: (a, b) => a.ts - b.ts,
  highest: (a, b) => b.price - a.price,
  lowest: (a, b) => a.price - b.price,
};

const PAGE_CSS = UI3D_CSS + EXTRAS_CSS + SCROLL_CSS;
const HEAD_CLS = 'sticky top-0 z-10 nb-gray shadow-[0_2px_0_0_var(--nb-line)]';
const ACTION_BTN = `${BTN} h-8 px-2.5 text-[11px] uppercase rtl:tracking-normal`;

const parsePrice = (v) => {
  const raw = String(v ?? '').trim();
  if (!raw || raw.includes('-')) return null;
  const n = Number(raw.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 && n <= PRICE_MAX ? Math.round(n * 100) / 100 : null;
};

const NotSetBadge = memo(({ label }) => (
  <span className="nb-chip nb-chip-n !normal-case">{label}</span>
));

const StatusPill = memo(({ status, labels }) => (
  <span className="nb-chip !normal-case" style={getStyles(status).chip}>
    {labels[status] || status || '—'}
  </span>
));

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
      <span className="nb-chip !px-1.5" style={active ? undefined : TAB_CHIP_OFF}>{count}</span>
    </button>
  );
});

const RepairTimeline = memo(({ status, t }) => {
  if (TERMINAL_NEGATIVE.includes(status)) {
    return (
      <div className="nb-line flex items-center gap-2.5 border-2 p-3" style={getStyles(status).chip}>
        <FiX size={18} aria-hidden="true" />
        <div className="min-w-0">
          <p className="break-words text-xs font-extrabold uppercase rtl:tracking-normal">{t.status[status]}</p>
          <p className="mt-0.5 break-words text-[10px] font-bold opacity-80">{t.timelineStopped}</p>
        </div>
      </div>
    );
  }
  const idx = LIFECYCLE_STATUSES.indexOf(status);
  const last = LIFECYCLE_STATUSES.length - 1;
  return (
    <ol className="flex flex-col gap-y-3 sm:grid sm:grid-cols-7 sm:gap-y-0">
      {LIFECYCLE_STATUSES.map((s, i) => {
        const done = i <= idx;
        return (
          <li
            key={s}
            aria-current={i === idx ? 'step' : undefined}
            className="relative flex min-w-0 items-start gap-3 sm:flex-col sm:items-center sm:gap-1.5 sm:text-center"
          >
            {i < last && (
              <span
                aria-hidden="true"
                className="absolute start-[5px] top-[7px] z-0 h-[calc(100%+0.75rem)] w-[3px] sm:start-1/2 sm:top-[5px] sm:h-[3px] sm:w-full"
                style={i < idx ? LINE_ON : LINE_OFF}
              />
            )}
            <span
              aria-hidden="true"
              className="nb-line relative z-10 block h-3.5 w-3.5 flex-shrink-0 border-2"
              style={done ? STEP_ON : STEP_OFF}
            />
            <span className={`min-w-0 break-words text-[10px] font-extrabold uppercase leading-tight rtl:tracking-normal sm:w-full sm:px-0.5 sm:text-[8px] ${done ? '' : 'nb-muted'}`}>
              {t.status[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
});

const RepairRow = memo(({ repair, busy, loc, onDetails, onCopy, onPrice, onOpenStatusModal }) => {
  const { L, fm, isAr } = loc;
  const t = L.repairs;
  const nf = fm.number;
  const notSet = getNotSetLabel(t, isAr);
  const meta = getMeta(repair.status);
  const hasNext = (NEXT_STATUSES[repair.status] || []).length > 0;
  const canPrice = PRICE_STATUSES.includes(repair.status);
  const delivery = getDeliveryMeta(repair.deliveryMethod, t.delivery);
  const DeliveryIcon = delivery.icon;
  const hasPayment = hasText(repair.paymentMethod);
  const payment = getPaymentMeta(repair.paymentMethod, t.payment);
  const PaymentIcon = payment.icon;
  const hasPrice = repair.price != null && repair.price !== '';

  const details = useCallback(() => onDetails(repair), [onDetails, repair]);
  const copy = useCallback(() => onCopy(repair.id), [onCopy, repair.id]);
  const price = useCallback(() => onPrice(repair), [onPrice, repair]);
  const status = useCallback(() => onOpenStatusModal(repair), [onOpenStatusModal, repair]);

  return (
    <tr>
      <td className="whitespace-nowrap px-3 py-3">
        <div className="flex items-center gap-2.5">
          <IconTile icon={meta.icon} tone={meta.tone} className="h-9 w-9" size={16} />
          <div>
            <p dir="ltr" className="text-start text-xs font-extrabold tabular-nums">#{shortId(repair.id)}</p>
            <p className="nb-muted max-w-[150px] truncate text-[10px] font-semibold">{repair.description || t.noDescription}</p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <p className="text-xs font-extrabold">{repair.shopName || '—'}</p>
        <p className="nb-muted inline-flex items-center gap-1 text-[10px] font-semibold">
          <DeliveryIcon size={11} className="nb-ic" aria-hidden="true" /> {delivery.label}
        </p>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        {hasPayment ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold">
            <PaymentIcon size={12} className="nb-ic" aria-hidden="true" />
            {payment.label}
          </span>
        ) : <NotSetBadge label={notSet} />}
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <p className="text-xs font-extrabold">{fmt(fm.date, repair.createdAt)}</p>
        <p className="nb-muted text-[10px] font-semibold">{fmt(fm.time, repair.createdAt)}</p>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        {hasPrice
          ? <span className="text-[13px] font-extrabold tabular-nums">{formatPrice(repair.price, L.table.price, nf)}</span>
          : <span className="text-[10px] font-extrabold uppercase text-red-500 rtl:tracking-normal">{t.notPriced}</span>}
      </td>
      <td className="whitespace-nowrap px-3 py-3"><StatusPill status={repair.status} labels={t.status} /></td>
      <td className="whitespace-nowrap px-3 py-3">
        <div className="flex items-center gap-1.5">
          {canPrice && (
            <button type="button" disabled={busy} onClick={price} className={ACTION_BTN}><FiDollarSign size={13} aria-hidden="true" /> {t.priceBtn}</button>
          )}
          {hasNext && (
            <button type="button" disabled={busy} onClick={status} className={ACTION_BTN}><FiEdit2 size={12} aria-hidden="true" /> {t.updateStatus}</button>
          )}
          <button type="button" title={t.detailsAria} aria-label={t.detailsAria} onClick={details} className={BTN_ICON}><FiInfo size={14} /></button>
          <button type="button" title={t.copyAria} aria-label={t.copyAria} onClick={copy} className={BTN_ICON}><FiCopy size={13} /></button>
        </div>
      </td>
    </tr>
  );
});

const InfoTile = memo(({ icon: Icon, label, children }) => (
  <div className={`${PANEL} flex min-w-0 items-start gap-2.5 p-3`}>
    <Icon size={15} className="nb-ic mt-0.5 flex-shrink-0" aria-hidden="true" />
    <div className="min-w-0">
      <p className="nb-muted mb-0.5 text-[9px] font-bold uppercase rtl:tracking-normal">{label}</p>
      <div className="break-words text-xs font-extrabold">{children}</div>
    </div>
  </div>
));

const ModalHeader = memo(({ icon, tone, title, children, onClose, closeLabel }) => (
  <div className="nb-gray nb-line flex flex-shrink-0 items-center justify-between gap-3 border-b-2 px-4 py-4 sm:px-5">
    <div className="flex min-w-0 items-center gap-2.5">
      <IconTile icon={icon} tone={tone} className="h-9 w-9 flex-shrink-0" size={16} />
      <div className="min-w-0">
        <h3 className="text-sm font-extrabold uppercase rtl:tracking-normal"><span className="nb-ul">{title}</span></h3>
        {children}
      </div>
    </div>
    {onClose && <button type="button" onClick={onClose} aria-label={closeLabel} className={`${BTN_ICON} flex-shrink-0`}><FiX size={15} /></button>}
  </div>
));

const RepairDetailsModal = memo(({ repair, busy, loc, onClose, onCopy, onPrice, onOpenStatusModal }) => {
  useEscape(onClose);
  const { L, fm, isAr } = loc;
  const t = L.repairs;
  const d = t.details;
  const nf = fm.number;
  const notSet = getNotSetLabel(t, isAr);
  const meta = getMeta(repair.status);
  const canPrice = PRICE_STATUSES.includes(repair.status);
  const hasNext = (NEXT_STATUSES[repair.status] || []).length > 0;
  const delivery = getDeliveryMeta(repair.deliveryMethod, t.delivery);
  const hasPayment = hasText(repair.paymentMethod);
  const payment = getPaymentMeta(repair.paymentMethod, t.payment);
  const hasPrice = repair.price != null && repair.price !== '';
  const hasDate = hasValidDate(repair.createdAt);
  const hasAddress = hasText(repair.deliveryAddressDetails);
  const copy = useCallback(() => onCopy(repair.id), [onCopy, repair.id]);

  return (
    <Overlay onClose={onClose}>
      <div role="dialog" aria-modal="true" aria-label={d.title} className="nb-card relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden">
        <ModalHeader icon={FiTool} tone="sky" title={d.title} onClose={onClose} closeLabel={d.close}>
          <p dir="ltr" className="nb-muted mt-1 flex items-center gap-1.5 text-[10px] font-bold tabular-nums">
            #{shortId(repair.id)}
            <button type="button" aria-label={t.copyAria} onClick={copy} className="hover:text-[color:var(--nb-accent)]"><FiCopy size={10} /></button>
          </p>
        </ModalHeader>

        <div className="slim-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5">
          <div className={`${PANEL} p-3 sm:p-3.5`}>
            <div className="flex items-center gap-3">
              <IconTile icon={meta.icon} tone={meta.tone} className="h-11 w-11 flex-shrink-0" size={19} />
              <div className="min-w-0">
                <p className="break-words text-sm font-extrabold uppercase rtl:tracking-normal">{t.status[repair.status] || repair.status}</p>
                <p className="nb-muted mt-0.5 break-words text-[10px] font-semibold">
                  {hasDate ? `${timeAgo(repair.createdAt, L.table.ago, nf)} · ${fmt(fm.full, repair.createdAt)}` : '—'}
                </p>
              </div>
            </div>
            <div className="mt-3.5"><RepairTimeline status={repair.status} t={t} /></div>
          </div>

          <InfoTile icon={FiTool} label={d.fault}>
            <span className="font-bold leading-relaxed">{repair.description || d.noFault}</span>
          </InfoTile>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoTile icon={RiStore2Line} label={d.shop}>{repair.shopName || '—'}</InfoTile>
            <InfoTile icon={delivery.icon} label={d.pickup}>{delivery.label}</InfoTile>
          </div>

          <InfoTile icon={FiMapPin} label={d.address}>
            {hasAddress
              ? <span className="font-bold leading-relaxed">{repair.deliveryAddressDetails}</span>
              : <NotSetBadge label={notSet} />}
          </InfoTile>

          <div className="grid grid-cols-2 gap-3">
            <div className={`${PANEL} min-w-0 p-3`}>
              <p className="nb-muted mb-1 text-[9px] font-bold uppercase rtl:tracking-normal">{d.payment}</p>
              {hasPayment
                ? <p className="break-words text-xs font-extrabold">{payment.label}</p>
                : <NotSetBadge label={notSet} />}
            </div>
            <div className={`${PANEL} min-w-0 p-3`}>
              <p className="nb-muted mb-1 text-[9px] font-bold uppercase rtl:tracking-normal">{d.amount}</p>
              <p className="break-words text-base font-extrabold tabular-nums">{hasPrice ? formatPrice(repair.price, L.table.price, nf) : '—'}</p>
            </div>
          </div>
        </div>

        <div className="nb-gray nb-line flex flex-shrink-0 flex-wrap gap-2.5 border-t-2 px-4 py-4 sm:px-5">
          {canPrice && <button type="button" disabled={busy} onClick={onPrice} className={`${BTN_PRIMARY} min-w-[110px] flex-1 uppercase rtl:tracking-normal`}><FiDollarSign size={13} aria-hidden="true" /> {d.setPrice}</button>}
          {hasNext && <button type="button" disabled={busy} onClick={onOpenStatusModal} className={`${BTN_MD} min-w-[110px] flex-1 uppercase rtl:tracking-normal`}>{t.updateStatus}</button>}
          {!canPrice && !hasNext && <p className="nb-muted min-w-[110px] flex-1 py-2 text-center text-[11px] font-bold">{d.noActions}</p>}
          <button type="button" onClick={onClose} className={`${BTN_MD} uppercase rtl:tracking-normal`}>{d.close}</button>
        </div>
      </div>
    </Overlay>
  );
});

const StatusOption = memo(({ s, label, busy, onSelect }) => {
  const click = useCallback(() => onSelect(s), [onSelect, s]);
  return (
    <button type="button" disabled={busy} onClick={click} className={`${BTN} w-full justify-between px-4 py-3 text-xs uppercase rtl:tracking-normal`}>
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="nb-line block h-3 w-3 flex-shrink-0 border-2" style={getStyles(s).swatch} aria-hidden="true" />
        <span className="min-w-0 break-words">{label}</span>
      </span>
      <FiChevronRight size={14} className="flex-shrink-0 rtl:rotate-180" aria-hidden="true" />
    </button>
  );
});

const StatusUpdateModal = memo(({ repair, busy, loc, onClose, onSelectStatus }) => {
  useEscape(onClose);
  const t = loc.L.repairs;
  const m = t.statusModal;
  const options = NEXT_STATUSES[repair.status] || [];
  return (
    <Overlay onClose={onClose}>
      <div role="dialog" aria-modal="true" aria-label={m.title} className="nb-card relative w-full max-w-sm overflow-hidden">
        <div className="nb-gray nb-line border-b-2 px-5 py-5 sm:px-6">
          <h3 className="text-base font-extrabold uppercase rtl:tracking-normal"><span className="nb-ul">{m.title}</span></h3>
          <p className="nb-muted mt-2 text-[11px] font-bold"><span dir="ltr" className="tabular-nums">#{shortId(repair.id)}</span> · {t.status[repair.status]}</p>
        </div>
        <div className="space-y-2.5 p-5 sm:p-6">
          <p className="nb-muted mb-1 text-[10px] font-bold uppercase rtl:tracking-normal">{m.choose}</p>
          {options.length
            ? options.map((s) => <StatusOption key={s} s={s} label={t.status[s]} busy={busy} onSelect={onSelectStatus} />)
            : <p className="nb-muted py-6 text-center text-xs font-bold">{m.none}</p>}
        </div>
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <button type="button" onClick={onClose} className={`${BTN_MD} w-full uppercase rtl:tracking-normal`}>{m.cancel}</button>
        </div>
      </div>
    </Overlay>
  );
});

const PriceModal = memo(({ repair, busy, loc, onClose, onSubmit }) => {
  useEscape(onClose);
  const { L, fm } = loc;
  const m = L.repairs.priceModal;
  const nf = fm.number;
  const [value, setValue] = useState(repair.price ? String(repair.price) : '');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (value.includes('-')) { setError(m.negative); return; }
    const price = parsePrice(value);
    if (price === null) { setError(tpl(m.invalid, { n: nf.format(PRICE_MAX) })); return; }
    onSubmit(price);
  };

  const change = useCallback((e) => {
    setValue(e.target.value.replace(/[^\d.-]/g, ''));
    setError('');
  }, []);

  return (
    <Overlay onClose={onClose}>
      <form onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-label={m.title} className="nb-card relative w-full max-w-sm overflow-hidden">
        <ModalHeader icon={FiDollarSign} tone="em" title={m.title}>
          <p dir="ltr" className="nb-muted mt-1 text-start text-[11px] font-bold tabular-nums">#{shortId(repair.id)}</p>
        </ModalHeader>
        <div className="p-5 sm:p-6">
          <label htmlFor="repair-price" className={LABEL}>{m.label}</label>
          <input
            id="repair-price"
            type="text"
            inputMode="decimal"
            dir="ltr"
            autoFocus
            autoComplete="off"
            maxLength={10}
            value={value}
            aria-invalid={!!error}
            aria-describedby={error ? 'repair-price-error' : undefined}
            onChange={change}
            className={`nb-input h-12 w-full text-center text-lg font-extrabold tabular-nums ${error ? '!border-red-500' : ''}`}
          />
          {error && <p id="repair-price-error" role="alert" className="mt-2 text-[11px] font-bold text-red-500">{error}</p>}
        </div>
        <div className="nb-gray nb-line flex gap-2.5 border-t-2 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className={`${BTN_MD} flex-1 uppercase rtl:tracking-normal`}>{m.cancel}</button>
          <button type="submit" disabled={busy} className={`${BTN_PRIMARY} flex-1 uppercase rtl:tracking-normal`}>{m.submit}</button>
        </div>
      </form>
    </Overlay>
  );
});

const RepairRequests = () => {
  const darkMode = useDarkMode();
  const loc = useShopLocale();
  const { language, L, fm, dir, font } = loc;
  const t = L.repairs;
  const tt = L.table;
  const nf = fm.number;

  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [statusModalId, setStatusModalId] = useState(null);
  const [priceModalId, setPriceModalId] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());

  const repairsRef = useRef(repairs);
  const inflight = useRef(new Set());
  const abortRef = useRef(null);
  const locRef = useRef(loc);
  repairsRef.current = repairs;
  locRef.current = loc;
  useEffect(() => { document.title = t.docTitle; }, [t.docTitle]);

  const term = useDeferredValue(search).trim().toLowerCase();

  const fetchRepairs = useCallback(async ({ silent = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/api/shops/repair-request', {
        params: { page: 0, size: 500, sort: 'createdAt,desc' },
        signal: controller.signal,
      });
      const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
      if (!controller.signal.aborted) {
        const next = data.map((r) => ({
          ...r,
          status: upper(r.status),
          createdAt: normDate(r.createdAt ?? r.created_at),
        }));
        setRepairs((prev) => mergeRepairs(prev, next));
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (!controller.signal.aborted && !silent) toast({ icon: 'error', title: locRef.current.L.repairs.toasts.loadFail, text: errText(err) });
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepairs();
    const iv = setInterval(() => { if (!document.hidden) fetchRepairs({ silent: true }); }, POLL_MS);
    return () => { clearInterval(iv); abortRef.current?.abort(); };
  }, [fetchRepairs]);

  const setBusy = useCallback(() => setBusyIds(new Set(inflight.current)), []);

  const updateRepairStatus = useCallback(async (repairId, newStatus) => {
    const x = locRef.current.L.repairs;
    const current = repairsRef.current.find((r) => r.id === repairId);
    if (!current || !isSafeId(repairId) || !(NEXT_STATUSES[current.status] || []).includes(newStatus)) {
      toast({ icon: 'error', title: x.toasts.notAllowed, text: x.toasts.badTransition });
      return;
    }
    if (inflight.current.has(repairId)) return;

    if (newStatus === 'CANCELLED' || newStatus === 'QUOTE_REJECTED') {
      const cancel = newStatus === 'CANCELLED';
      let isConfirmed = false;
      try {
        ({ isConfirmed } = await confirmDialog({
          title: cancel ? x.confirm.cancelTitle : x.confirm.rejectTitle,
          text: cancel ? x.confirm.cancelText : x.confirm.rejectText,
          icon: 'warning',
          confirmButtonText: x.confirm.yes,
          cancelButtonText: locRef.current.L.table.cancel,
          confirmButtonColor: '#ef4444',
        }));
      } catch {
        toast({ icon: 'error', title: x.toasts.confirmFail, text: x.toasts.confirmFailText });
        return;
      }
      if (!isConfirmed) return;
    }

    const oldStatus = current.status;
    inflight.current.add(repairId);
    setBusy();
    setRepairs((prev) => prev.map((r) => (r.id === repairId ? { ...r, status: newStatus } : r)));
    try {
      await api.put(`/api/shops/repair-request/${encodeURIComponent(repairId)}/status`, { status: newStatus });
      const y = locRef.current.L.repairs;
      const msg = newStatus === 'QUOTE_REJECTED'
        ? { title: y.toasts.rejected, text: y.toasts.rejectedText }
        : newStatus === 'CANCELLED'
          ? { title: y.toasts.cancelled, text: y.toasts.cancelledText }
          : { title: y.toasts.statusUpdated, text: tpl(y.toasts.statusUpdatedText, { s: y.status[newStatus] }) };
      toast({ icon: 'success', ...msg });
      fetchRepairs({ silent: true });
    } catch (err) {
      setRepairs((prev) => prev.map((r) => (r.id === repairId ? { ...r, status: oldStatus } : r)));
      toast({ icon: 'error', title: locRef.current.L.repairs.toasts.statusFail, text: errText(err) });
    } finally {
      inflight.current.delete(repairId);
      setBusy();
    }
  }, [fetchRepairs, setBusy]);

  const submitPrice = useCallback(async (repairId, price) => {
    const x = locRef.current.L.repairs;
    const current = repairsRef.current.find((r) => r.id === repairId);
    if (!current || !isSafeId(repairId) || !PRICE_STATUSES.includes(current.status)) {
      toast({ icon: 'error', title: x.toasts.notAllowed, text: x.toasts.badPriceStage });
      return;
    }
    if (!Number.isFinite(price) || price <= 0 || price > PRICE_MAX) {
      toast({ icon: 'error', title: x.toasts.invalidPrice, text: x.toasts.invalidPriceText });
      return;
    }
    if (inflight.current.has(repairId)) return;

    const oldPrice = current.price;
    inflight.current.add(repairId);
    setBusy();
    setRepairs((prev) => prev.map((r) => (r.id === repairId ? { ...r, price } : r)));
    setPriceModalId(null);
    try {
      await api.put(`/api/shops/repair-request/${encodeURIComponent(repairId)}/price`, { price });
      const { L: LL, fm: ff } = locRef.current;
      toast({
        icon: 'success',
        title: LL.repairs.toasts.priceSet,
        text: tpl(LL.repairs.toasts.priceSetText, { p: formatPrice(price, LL.table.price, ff.number) }),
      });
      fetchRepairs({ silent: true });
    } catch (err) {
      setRepairs((prev) => prev.map((r) => (r.id === repairId ? { ...r, price: oldPrice } : r)));
      toast({ icon: 'error', title: locRef.current.L.repairs.toasts.priceFail, text: errText(err) });
    } finally {
      inflight.current.delete(repairId);
      setBusy();
    }
  }, [fetchRepairs, setBusy]);

  const index = useMemo(() => repairs.map((r) => ({
    o: r,
    ts: toTs(r.createdAt),
    price: num(r.price),
    delivery: upper(r.deliveryMethod),
    payment: normPayment(r.paymentMethod),
    text: [r.id, r.description, r.shopName, r.deliveryAddressDetails, r.firstName, r.lastName, r.phoneNumber, t.status[r.status]]
      .filter(Boolean).join(' ').toLowerCase(),
  })), [repairs, t.status]);

  const counts = useMemo(() => {
    const c = { all: repairs.length };
    for (const r of repairs) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [repairs]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const span = SPAN_MS[dateRange];
    const list = [];
    for (const e of index) {
      if (
        (statusFilter === 'all' || e.o.status === statusFilter)
        && (deliveryFilter === 'all' || e.delivery === deliveryFilter)
        && (paymentFilter === 'all' || e.payment === paymentFilter)
        && (!span || now - e.ts <= span)
        && (!term || e.text.includes(term))
      ) list.push(e);
    }
    list.sort(SORTERS[sortBy] || SORTERS.newest);
    return list.map((e) => e.o);
  }, [index, statusFilter, deliveryFilter, paymentFilter, dateRange, term, sortBy]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, deliveryFilter, paymentFilter, dateRange, term, sortBy, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const skeletonRows = useMemo(() => Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => i), [rowsPerPage]);

  const statCards = useMemo(() => [
    { label: t.stats.total.label, value: nf.format(counts.all), description: t.stats.total.desc, icon: FiPackage, tone: 'sky' },
    { label: t.stats.awaiting.label, value: nf.format((counts.SUBMITTED || 0) + (counts.QUOTE_SENT || 0)), description: t.stats.awaiting.desc, icon: FiClock, tone: 'am' },
    { label: t.stats.repairing.label, value: nf.format(counts.REPAIRING || 0), description: t.stats.repairing.desc, icon: FiTool, tone: 'te' },
    { label: t.stats.done.label, value: nf.format((counts.REPAIR_COMPLETED || 0) + (counts.DEVICE_DELIVERED || 0)), description: t.stats.done.desc, icon: FiCheckCircle, tone: 'em' },
  ], [counts, t, nf]);

  const selectedRepair = useMemo(() => (selectedId == null ? null : repairs.find((r) => r.id === selectedId) || null), [repairs, selectedId]);
  const statusRepair = useMemo(() => (statusModalId == null ? null : repairs.find((r) => r.id === statusModalId) || null), [repairs, statusModalId]);
  const priceRepair = useMemo(() => (priceModalId == null ? null : repairs.find((r) => r.id === priceModalId) || null), [repairs, priceModalId]);

  const handleDetails = useCallback((r) => setSelectedId(r.id), []);
  const handleOpenStatusModal = useCallback((r) => setStatusModalId(r.id), []);
  const handlePrice = useCallback((r) => setPriceModalId(r.id), []);
  const handleCopy = useCallback(async (id) => {
    const x = locRef.current.L.repairs.toasts;
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ icon: 'success', title: x.copied, text: x.copiedText, timer: 2000 });
    } catch {
      toast({ icon: 'error', title: x.copyFail, text: x.copyFailText });
    }
  }, []);
  const resetFilters = useCallback(() => { setDeliveryFilter('all'); setPaymentFilter('all'); setDateRange('all'); setSortBy('newest'); }, []);
  const closeDetails = useCallback(() => setSelectedId(null), []);
  const closeStatus = useCallback(() => setStatusModalId(null), []);
  const closePrice = useCallback(() => setPriceModalId(null), []);
  const closeFilter = useCallback(() => setShowFilterPanel(false), []);
  const openFilter = useCallback(() => setShowFilterPanel(true), []);
  const refresh = useCallback(() => fetchRepairs(), [fetchRepairs]);
  const handleSearch = useCallback((e) => setSearch(sanitizeSearch(e.target.value)), []);

  const priceFromDetails = useCallback(() => { setPriceModalId(selectedId); closeDetails(); }, [selectedId, closeDetails]);
  const statusFromDetails = useCallback(() => { setStatusModalId(selectedId); closeDetails(); }, [selectedId, closeDetails]);
  const selectNextStatus = useCallback((s) => { updateRepairStatus(statusModalId, s); closeStatus(); }, [updateRepairStatus, statusModalId, closeStatus]);
  const submitPriceFromModal = useCallback((price) => submitPrice(priceModalId, price), [submitPrice, priceModalId]);

  const toggleDateSort = useCallback(() => setSortBy((s) => (s === 'newest' ? 'oldest' : 'newest')), []);
  const togglePriceSort = useCallback(() => setSortBy((s) => (s === 'highest' ? 'lowest' : 'highest')), []);

  const filterGroups = useMemo(() => [
    [t.groups.sort, SORT_KEYS.map((k) => ({ value: k, label: t.sort[k] })), sortBy, setSortBy],
    [t.groups.delivery, [{ value: 'all', label: t.deliveryAll }, ...DELIVERY_KEYS.map((k) => ({ value: k, label: t.delivery[k] }))], deliveryFilter, setDeliveryFilter],
    [t.groups.payment, [{ value: 'all', label: t.paymentAll }, ...PAYMENT_KEYS.map((k) => ({ value: k, label: t.payment[k] }))], paymentFilter, setPaymentFilter],
    [t.groups.range, RANGE_KEYS.map((k) => ({ value: k, label: t.ranges[k] })), dateRange, setDateRange],
  ], [t, sortBy, deliveryFilter, paymentFilter, dateRange]);

  const activeFilterCount = (deliveryFilter !== 'all') + (paymentFilter !== 'all') + (dateRange !== 'all') + (sortBy !== 'newest');
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);

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
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <section className={`${CARD} min-w-0 overflow-hidden`}>
          <div className="nb-gray nb-line flex flex-wrap items-center gap-2.5 border-b-2 p-3 sm:p-4">
            <div className="group relative min-w-[220px] flex-1">
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
                onChange={handleSearch}
                className="nb-input h-10 w-full ps-10 pe-3 text-sm font-semibold"
              />
            </div>
            <RowsDropdown value={rowsPerPage} onChange={setRowsPerPage} label={tt.rows} formatNumber={nf.format} />
            <button type="button" onClick={openFilter} className={`${BTN_MD} relative h-10 uppercase rtl:tracking-normal`}>
              <FiFilter size={14} aria-hidden="true" /> {tt.filter}
              {activeFilterCount > 0 && (
                <span className="nb-chip absolute -end-2 -top-2.5 !px-1.5" style={FILTER_BADGE}>{nf.format(activeFilterCount)}</span>
              )}
            </button>
          </div>

          <div role="tablist" aria-label={t.tabsAria} className="slim-scroll nb-line flex gap-2 overflow-x-auto border-b-2 p-3">
            {TABS.map((s) => (
              <TabBtn key={s} k={s} active={statusFilter === s} label={t.status[s]} count={nf.format(counts[s] || 0)} onSelect={setStatusFilter} />
            ))}
          </div>

          <div className="slim-scroll max-h-[68vh] overflow-auto" aria-busy={loading}>
            <table className="w-full min-w-[1000px] border-collapse text-start">
              <thead className={HEAD_CLS}>
                <tr>
                  <th scope="col" className={TH}>{t.columns.request}</th>
                  <th scope="col" className={TH}>{t.columns.shop}</th>
                  <th scope="col" className={TH}>{t.columns.payment}</th>
                  <SortTh label={t.columns.date} active={sortBy === 'newest' || sortBy === 'oldest'} dir={sortBy === 'oldest' ? 'asc' : 'desc'} onClick={toggleDateSort} />
                  <SortTh label={t.columns.price} active={sortBy === 'highest' || sortBy === 'lowest'} dir={sortBy === 'lowest' ? 'asc' : 'desc'} onClick={togglePriceSort} />
                  <th scope="col" className={TH}>{t.columns.status}</th>
                  <th scope="col" className={TH}>{t.columns.actions}</th>
                </tr>
              </thead>
              <tbody className="nb-rows">
                {loading && repairs.length === 0 ? (
                  skeletonRows.map((i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {SKELETON_COLS.map((j) => (
                        <td key={j} className="px-3 py-4"><div className="nb-gray nb-line h-3.5 w-full border-2" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14">
                      <EmptyState3D kind="box" title={t.empty.title} subtitle={t.empty.sub} darkMode={darkMode} />
                    </td>
                  </tr>
                ) : (
                  paginated.map((r) => (
                    <RepairRow
                      key={r.id}
                      repair={r}
                      busy={busyIds.has(r.id)}
                      loc={loc}
                      onDetails={handleDetails}
                      onCopy={handleCopy}
                      onPrice={handlePrice}
                      onOpenStatusModal={handleOpenStatusModal}
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
                  range: <b className="tabular-nums" style={BOLD_STYLE}>{nf.format(from)}–{nf.format(to)}</b>,
                  total: <b className="tabular-nums" style={BOLD_STYLE}>{nf.format(filtered.length)}</b>,
                })}
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} labels={tt} formatNumber={nf.format} />}
            </div>
          )}
        </section>
      </div>

      {selectedRepair && (
        <RepairDetailsModal
          repair={selectedRepair}
          busy={busyIds.has(selectedRepair.id)}
          loc={loc}
          onClose={closeDetails}
          onCopy={handleCopy}
          onPrice={priceFromDetails}
          onOpenStatusModal={statusFromDetails}
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

      {statusRepair && (
        <StatusUpdateModal
          repair={statusRepair}
          busy={busyIds.has(statusRepair.id)}
          loc={loc}
          onClose={closeStatus}
          onSelectStatus={selectNextStatus}
        />
      )}

      {priceRepair && (
        <PriceModal
          key={priceRepair.id}
          repair={priceRepair}
          busy={busyIds.has(priceRepair.id)}
          loc={loc}
          onClose={closePrice}
          onSubmit={submitPriceFromModal}
        />
      )}
    </div>
  );
};

export default memo(RepairRequests);