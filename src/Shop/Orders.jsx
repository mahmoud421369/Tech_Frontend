import React, {
  useState, useEffect, useCallback, useMemo, useRef, useDeferredValue, memo,
} from 'react';
import {
  FiSearch, FiInfo, FiChevronRight, FiChevronLeft, FiChevronUp, FiChevronDown, FiX,
  FiClock, FiTruck, FiCheckCircle, FiCheck, FiFilter, FiCopy, FiUser, FiPhone,
  FiPackage, FiDollarSign, FiCreditCard, FiAlertCircle, FiRefreshCw, FiShoppingBag,
  FiXCircle, FiEdit2, FiBox,
} from 'react-icons/fi';
import api from '../common/api/api';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import {
  POLL_MS, SEARCH_MAX, SPAN_MS, DEFAULT_LABELS,
  getFormats, tpl, renderTpl, toTs, fmt, num, formatPrice, timeAgo, sanitizeSearch, isSafeId, safePhone,
  shortId, errText, confirmDialog, useDarkMode, useEscape, useShopLocale,
} from '../components/shop/TableKit';
import { ensureShopAssets } from '../common/utils/shopFonts';

ensureShopAssets();

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
const STYLE_EL = <style>{PG_CSS + EXTRAS_CSS}</style>;

const TONES = { sky: '#22d3ee', am: '#facc15', ro: '#fb7185', vi: '#a3e635', te: '#2dd4bf', em: '#34d399' };
const ROW_OPTIONS = [5, 10, 25, 50];

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
  const text = label || DEFAULT_LABELS.rows;
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={tpl(text, { n: '' }).trim() || undefined}
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

const Pagination = memo(({ page, total, onChange, labels = {}, formatNumber }) => {
  const pages = useMemo(() => pageList(page, total), [page, total]);
  return (
    <nav aria-label={labels.paginationAria || DEFAULT_LABELS.paginationAria} className="flex items-center gap-1.5 flex-wrap justify-center">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={labels.prev || DEFAULT_LABELS.prev} className="pg-btn h-8 w-8">
        <FiChevronLeft size={14} className="rtl:rotate-180" aria-hidden="true" />
      </button>
      {pages.map((p) => (typeof p === 'string'
        ? <span key={p} className="pg-muted px-1 text-xs font-bold" aria-hidden="true">…</span>
        : (
          <button key={p} type="button" onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined} className="pg-btn h-8 min-w-[32px] px-2 text-xs tabular-nums">
            {formatNumber(p)}
          </button>
        )))}
      <button type="button" disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={labels.next || DEFAULT_LABELS.next} className="pg-btn h-8 w-8">
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

const FilterPanel = memo(({ title, note, groups, onReset, onClose, labels = {} }) => {
  useEscape(onClose);
  useLockScroll();
  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div className="pg-fade absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label={title} className="pg-card pg-in relative w-full max-w-xs h-full flex flex-col !shadow-none border-y-0 border-e-0">
        <div className="pg-gray pg-line px-5 py-4 border-b-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold uppercase"><span className="pg-ul">{title}</span></h3>
          <button type="button" onClick={onClose} aria-label={labels.close || DEFAULT_LABELS.close} className="pg-btn h-8 w-8"><FiX size={15} aria-hidden="true" /></button>
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
          <button type="button" onClick={onReset} className="pg-btn h-10 text-xs uppercase">{labels.reset || DEFAULT_LABELS.reset}</button>
          <button type="button" onClick={onClose} className="pg-btn pg-btn-a h-10 text-xs uppercase">{labels.apply || DEFAULT_LABELS.apply}</button>
        </div>
      </aside>
    </div>
  );
});

const STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'FINISHPROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const LIFECYCLE_STATUSES = STATUSES.slice(0, 6);
const TABS = ['all', ...STATUSES];
const PAYMENT_VALUES = ['all', 'CASH', 'CARD'];
const SORT_VALUES = ['newest', 'oldest', 'highest', 'lowest'];
const DATE_VALUES = ['all', 'today', 'week', 'month'];

const NEXT_STATUSES = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING'],
  PROCESSING: ['FINISHPROCESSING'],
  FINISHPROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const STATUS_META = {
  PENDING:          { dot: 'bg-blue-500',    icon: FiClock,       tone: 'am' },
  CONFIRMED:        { dot: 'bg-lime-500',    icon: FiCheckCircle, tone: 'em' },
  PROCESSING:       { dot: 'bg-yellow-400',  icon: FiRefreshCw,   tone: 'te' },
  FINISHPROCESSING: { dot: 'bg-amber-500',   icon: FiCheck,       tone: 'vi' },
  SHIPPED:          { dot: 'bg-purple-500',  icon: FiTruck,       tone: 'sky' },
  DELIVERED:        { dot: 'bg-emerald-500', icon: FiPackage,     tone: 'em' },
  CANCELLED:        { dot: 'bg-red-500',     icon: FiXCircle,     tone: 'ro' },
};
const FALLBACK_META = { dot: 'bg-gray-400', icon: FiInfo, tone: 'sky' };
const getMeta = (s) => STATUS_META[s] || FALLBACK_META;

const fullName = (o) => [o.firstName, o.lastName].filter(Boolean).join(' ') || '—';

const successToast = (t, status) => {
  if (status === 'CONFIRMED') return t.toasts.accepted;
  if (status === 'CANCELLED') return t.toasts.rejected;
  return { title: t.toasts.statusUpdated.title, text: tpl(t.toasts.statusUpdated.text, { status: t.status[status] }) };
};

const StatusPill = memo(({ status, label }) => (
  <span className="pg-chip">
    <span className={`pg-line w-2 h-2 border ${getMeta(status).dot}`} />
    {label || status || '—'}
  </span>
));

const StatusTimeline = memo(({ status, labels }) => {
  if (status === 'CANCELLED') return null;
  const idx = LIFECYCLE_STATUSES.indexOf(status);
  return (
    <div className="flex items-center">
      {LIFECYCLE_STATUSES.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <span className={`pg-line w-3.5 h-3.5 border-2 ${i <= idx ? 'bg-[var(--pg-accent)]' : 'pg-gray'}`} />
            <span className={`text-[8px] font-extrabold uppercase text-center leading-tight w-12 ${i <= idx ? '' : 'pg-muted'}`}>{labels[s]}</span>
          </div>
          {i < LIFECYCLE_STATUSES.length - 1 && (
            <span className={`pg-line flex-1 h-1.5 mx-1 mb-4 border-y-2 ${i < idx ? 'bg-[var(--pg-accent)]' : 'pg-gray'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
});

const InfoTile = memo(({ icon: Icon, label, children }) => (
  <div className="pg-gray pg-dot p-3 flex items-center gap-2.5 min-w-0">
    <Icon size={15} className="text-[var(--pg-accent)] flex-shrink-0" aria-hidden="true" />
    <div className="min-w-0">
      <p className="pg-muted text-[9px] font-bold uppercase">{label}</p>
      <div className="text-xs font-extrabold truncate">{children}</div>
    </div>
  </div>
));

const OrderRow = memo(({ order, busy, L, onDetails, onCopy, onAccept, onReject, onOpenStatusModal }) => {
  const t = L.orders;
  const fm = getFormats(L.locale);
  const items = order.orderItems || [];
  const totalQty = items.reduce((s, i) => s + num(i.quantity), 0);
  const first = items[0];
  const extra = items.length - 1;
  const isPending = order.status === 'PENDING';
  const canAdvance = (NEXT_STATUSES[order.status] || []).length > 0 && !isPending;

  return (
    <tr className="pg-tr">
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <span className="pg-tile w-9 h-9"><FiBox size={16} aria-hidden="true" /></span>
          <div>
            <p className="text-xs font-mono font-extrabold">#{shortId(order.id)}</p>
            <p className="pg-muted text-[10px] font-semibold">{tpl(t.row.pieces, { n: fm.number.format(totalQty) })}</p>
          </div>
        </div>
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <p className="text-xs font-extrabold uppercase">{fullName(order)}</p>
        <p dir="ltr" className="pg-muted text-[10px] font-semibold text-start rtl:text-end">{order.phoneNumber || t.row.noPhone}</p>
      </td>
      <td className="pg-td px-3 py-2.5 max-w-[190px]">
        <p className="text-xs font-semibold truncate">{first?.productName || '—'}</p>
        {extra > 0 && <p className="pg-muted text-[10px] font-bold">{tpl(t.row.more, { n: fm.number.format(extra) })}</p>}
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold">
          {order.paymentMethod === 'CASH' ? <FiDollarSign size={12} aria-hidden="true" /> : <FiCreditCard size={12} aria-hidden="true" />}
          {t.payment[order.paymentMethod] || order.paymentMethod || '—'}
        </span>
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <p className="text-xs font-bold">{fmt(fm.date, order.createdAt)}</p>
        <p className="pg-muted text-[10px] font-semibold">{fmt(fm.time, order.createdAt)}</p>
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap font-extrabold text-[13px] tabular-nums">
        {formatPrice(order.totalPrice, L.table.price, fm.number)}
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap"><StatusPill status={order.status} label={t.status[order.status]} /></td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {isPending && (
            <>
              <button type="button" disabled={busy} onClick={() => onAccept(order)} className="pg-btn pg-btn-a px-2.5 h-8 text-[11px] uppercase"><FiCheck size={13} aria-hidden="true" /> {t.row.accept}</button>
              <button type="button" disabled={busy} onClick={() => onReject(order)} className="pg-btn pg-btn-danger px-2.5 h-8 text-[11px] uppercase"><FiX size={13} aria-hidden="true" /> {t.row.reject}</button>
            </>
          )}
          {canAdvance && (
            <button type="button" disabled={busy} onClick={() => onOpenStatusModal(order)} className="pg-btn px-2.5 h-8 text-[11px] uppercase"><FiEdit2 size={12} aria-hidden="true" /> {t.row.updateStatus}</button>
          )}
          <button type="button" title={t.row.details} aria-label={t.row.details} onClick={() => onDetails(order)} className="pg-btn h-8 w-8"><FiInfo size={14} aria-hidden="true" /></button>
          <button type="button" title={t.row.copyId} aria-label={t.row.copyId} onClick={() => onCopy(order.id)} className="pg-btn h-8 w-8"><FiCopy size={13} aria-hidden="true" /></button>
        </div>
      </td>
    </tr>
  );
});

const OrderDetailsModal = memo(({ order, busy, L, onClose, onCopy, onAccept, onReject, onOpenStatusModal }) => {
  useEscape(onClose);
  const t = L.orders;
  const fm = getFormats(L.locale);
  const meta = getMeta(order.status);
  const isPending = order.status === 'PENDING';
  const isDelivered = order.status === 'DELIVERED';
  const hasNext = (NEXT_STATUSES[order.status] || []).length > 0;
  const items = order.orderItems || [];
  const totalQty = items.reduce((s, i) => s + num(i.quantity), 0);
  const phone = safePhone(order.phoneNumber);
  const price = (v) => formatPrice(v, L.table.price, fm.number);

  return (
    <Overlay onClose={onClose}>
      <div role="dialog" aria-modal="true" aria-label={t.details.title} className="pg-card pg-in relative w-full max-w-md overflow-hidden">
        <div className="pg-gray pg-line px-5 py-3.5 border-b-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Tile icon={FiShoppingBag} tone="sky" />
            <div>
              <h3 className="text-sm font-extrabold uppercase"><span className="pg-ul">{t.details.title}</span></h3>
              <p className="pg-muted mt-1 flex items-center gap-1.5 text-[10px] font-bold font-mono">
                #{shortId(order.id)}
                <button type="button" aria-label={t.row.copyId} onClick={() => onCopy(order.id)} className="pg-link"><FiCopy size={10} aria-hidden="true" /></button>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={L.table.close || DEFAULT_LABELS.close} className="pg-btn h-8 w-8"><FiX size={15} aria-hidden="true" /></button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto max-h-[72vh] pg-scroll">
          <div className="pg-gray pg-dot p-3.5">
            <div className="flex items-center gap-3">
              <Tile icon={meta.icon} tone={meta.tone} className="h-11 w-11" size={20} />
              <div className="min-w-0">
                <p className="text-sm font-extrabold uppercase">{t.status[order.status] || order.status}</p>
                <p className="pg-muted text-[10px] font-semibold mt-0.5">{timeAgo(order.createdAt, L.header.time, fm.number)} · {fmt(fm.full, order.createdAt)}</p>
              </div>
            </div>
            {order.status !== 'CANCELLED' && <div className="mt-3.5"><StatusTimeline status={order.status} labels={t.status} /></div>}
            {(isPending || isDelivered) && (
              <div className="pg-card !shadow-none mt-3 flex items-start gap-1.5 px-2.5 py-2">
                <FiAlertCircle className="text-[var(--pg-accent)] flex-shrink-0 mt-0.5" size={12} aria-hidden="true" />
                <p className="text-[10px] font-bold">{isPending ? t.details.pendingNote : t.details.deliveredNote}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <InfoTile icon={FiUser} label={t.details.customer}>{fullName(order)}</InfoTile>
            <a href={phone ? `tel:${phone}` : undefined} className="pg-link min-w-0">
              <InfoTile icon={FiPhone} label={t.details.phone}><span dir="ltr" className="block text-start rtl:text-end">{order.phoneNumber || '—'}</span></InfoTile>
            </a>
          </div>

          <div className="pg-card !shadow-none overflow-hidden">
            <div className="pg-gray pg-line px-3.5 py-2.5 flex items-center justify-between border-b-2">
              <p className="text-[10px] font-extrabold uppercase">{t.details.items}</p>
              <span className="text-[10px] font-extrabold">{tpl(t.row.pieces, { n: fm.number.format(totalQty) })}</span>
            </div>
            <div>
              {items.map((item, idx) => (
                <div key={item.id ?? `${item.productName}-${idx}`} className="pg-td flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold truncate">{item.productName}</p>
                    <p className="pg-muted text-[10px] font-semibold truncate">{fm.number.format(num(item.quantity))} × {price(item.priceAtCheckout)}{item.shopName ? ` · ${item.shopName}` : ''}</p>
                  </div>
                  <p className="text-[11px] font-extrabold font-mono flex-shrink-0">{price(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="pg-gray pg-dot p-3">
              <p className="pg-muted text-[9px] font-bold uppercase mb-1">{t.details.payment}</p>
              <p className="text-xs font-extrabold">{order.paymentMethod === 'CASH' ? t.cashFull : (t.payment[order.paymentMethod] || order.paymentMethod || '—')}</p>
            </div>
            <div className="pg-gray pg-dot p-3">
              <p className="pg-muted text-[9px] font-bold uppercase mb-1">{t.details.finalTotal}</p>
              <p className="text-base font-extrabold tabular-nums">{price(order.totalPrice)}</p>
            </div>
          </div>
        </div>

        <div className="pg-line px-5 py-3.5 border-t-2 flex gap-2.5">
          {isPending ? (
            <>
              <button type="button" disabled={busy} onClick={onReject} className="pg-btn pg-btn-danger flex-1 h-10 text-xs uppercase"><FiX size={13} aria-hidden="true" /> {t.details.reject}</button>
              <button type="button" disabled={busy} onClick={onAccept} className="pg-btn pg-btn-a flex-1 h-10 text-xs uppercase"><FiCheck size={13} aria-hidden="true" /> {t.details.accept}</button>
            </>
          ) : hasNext ? (
            <button type="button" disabled={busy} onClick={onOpenStatusModal} className="pg-btn pg-btn-a flex-1 h-10 text-xs uppercase">{t.row.updateStatus}</button>
          ) : (
            <p className="pg-muted flex-1 py-2 text-center text-[11px] font-bold">{t.details.noActions}</p>
          )}
          <button type="button" onClick={onClose} className="pg-btn h-10 px-3 text-xs uppercase">{L.table.close || DEFAULT_LABELS.close}</button>
        </div>
      </div>
    </Overlay>
  );
});

const StatusUpdateModal = memo(({ order, busy, L, onClose, onSelectStatus }) => {
  useEscape(onClose);
  const t = L.orders;
  const options = NEXT_STATUSES[order.status] || [];
  return (
    <Overlay onClose={onClose}>
      <div role="dialog" aria-modal="true" aria-label={t.statusModal.title} className="pg-card pg-in relative w-full max-w-sm overflow-hidden">
        <div className="pg-gray pg-line px-5 py-4 border-b-2">
          <h3 className="text-sm font-extrabold uppercase"><span className="pg-ul">{t.statusModal.title}</span></h3>
          <p className="pg-muted text-[11px] font-bold font-mono mt-1">#{shortId(order.id)} · {t.status[order.status]}</p>
        </div>
        <div className="p-5 space-y-2">
          <p className="text-[11px] font-extrabold uppercase mb-1">{t.statusModal.choose}</p>
          {options.length ? options.map((s) => (
            <button key={s} type="button" disabled={busy} onClick={() => onSelectStatus(s)} className="pg-btn w-full justify-between px-4 h-11 text-xs uppercase">
              {t.status[s]}
              <FiChevronRight size={14} className="rtl:rotate-180" aria-hidden="true" />
            </button>
          )) : <p className="pg-muted py-6 text-center text-xs font-bold">{t.statusModal.none}</p>}
        </div>
        <div className="px-5 pb-5">
          <button type="button" onClick={onClose} className="pg-btn w-full h-10 text-xs uppercase">{L.table.cancel}</button>
        </div>
      </div>
    </Overlay>
  );
});

const Orders = () => {
  const darkMode = useDarkMode();
  const { language, dir, font, L, fm } = useShopLocale();
  const t = L.orders;
  const nf = fm.number;

  const tRef = useRef(L);
  tRef.current = L;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [statusModalId, setStatusModalId] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());

  const ordersRef = useRef(orders);
  const inflight = useRef(new Set());
  const abortRef = useRef(null);
  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { document.title = t.docTitle; }, [t.docTitle]);

  const term = useDeferredValue(search).trim().toLowerCase();

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/api/shops/orders/control', {
        params: { page: 0, size: 500, sort: 'createdAt,desc' },
        signal: controller.signal,
      });
      const data = Array.isArray(res.data) ? res.data : res.data?.content || [];
      if (!controller.signal.aborted) { setOrders(data); setLastUpdated(new Date()); }
    } catch (err) {
      if (!controller.signal.aborted && !silent) toast({ icon: 'error', title: tRef.current.orders.toasts.loadFail, text: errText(err) });
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(() => { if (!document.hidden) fetchOrders({ silent: true }); }, POLL_MS);
    return () => { clearInterval(iv); abortRef.current?.abort(); };
  }, [fetchOrders]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    const tt = tRef.current.orders;
    const current = ordersRef.current.find((o) => o.id === orderId);
    if (!current || !isSafeId(orderId) || !(NEXT_STATUSES[current.status] || []).includes(newStatus)) {
      toast({ icon: 'error', ...tt.toasts.notAllowed });
      return;
    }
    if (inflight.current.has(orderId)) return;

    if (newStatus === 'CONFIRMED' || newStatus === 'CANCELLED') {
      const accept = newStatus === 'CONFIRMED';
      const c = accept ? tt.confirm.accept : tt.confirm.reject;
      let isConfirmed = false;
      try {
        ({ isConfirmed } = await confirmDialog({
          title: c.title,
          text: c.text,
          icon: accept ? 'question' : 'warning',
          confirmButtonText: c.button,
          cancelButtonText: tRef.current.table.cancel,
          confirmButtonColor: accept ? '#059669' : '#ef4444',
        }));
      } catch {
        toast({ icon: 'error', ...tt.toasts.confirmFail });
        return;
      }
      if (!isConfirmed) return;
    }

    const id = encodeURIComponent(orderId);
    const fromStatus = current.status;
    inflight.current.add(orderId);
    setBusyIds(new Set(inflight.current));
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    try {
      if (newStatus === 'CONFIRMED') await api.post(`/api/shops/orders/control/${id}/accept`);
      else if (newStatus === 'CANCELLED') await api.post(`/api/shops/orders/control/${id}/reject`);
      else await api.put(`/api/shops/orders/control/${id}/status`, { status: newStatus });
      toast({ icon: 'success', ...successToast(tRef.current.orders, newStatus) });
      fetchOrders({ silent: true });
    } catch (err) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: fromStatus } : o)));
      toast({ icon: 'error', title: tRef.current.orders.toasts.statusFail, text: errText(err) });
    } finally {
      inflight.current.delete(orderId);
      setBusyIds(new Set(inflight.current));
    }
  }, [fetchOrders]);

  const index = useMemo(() => orders.map((o) => ({
    o,
    ts: toTs(o.createdAt),
    price: num(o.totalPrice),
    text: [o.id, o.firstName, o.lastName, o.phoneNumber, ...(o.orderItems || []).map((i) => i.productName)]
      .filter(Boolean).join(' ').toLowerCase(),
  })), [orders]);

  const counts = useMemo(() => {
    const c = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const span = SPAN_MS[dateRange];
    const list = index.filter(({ o, ts, text }) => (
      (statusFilter === 'all' || o.status === statusFilter)
      && (paymentFilter === 'all' || o.paymentMethod === paymentFilter)
      && (!span || now - ts <= span)
      && (!term || text.includes(term))
    ));
    list.sort((a, b) => {
      if (sortBy === 'oldest') return a.ts - b.ts;
      if (sortBy === 'highest') return b.price - a.price;
      if (sortBy === 'lowest') return a.price - b.price;
      return b.ts - a.ts;
    });
    return list.map((e) => e.o);
  }, [index, statusFilter, paymentFilter, dateRange, term, sortBy]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, paymentFilter, dateRange, term, sortBy, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const skeletonRows = useMemo(() => Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => i), [rowsPerPage]);

  const statCards = useMemo(() => [
    { label: t.stats.total.label, value: nf.format(counts.all), description: t.stats.total.desc, icon: FiShoppingBag, tone: 'sky' },
    { label: t.stats.pending.label, value: nf.format(counts.PENDING || 0), description: t.stats.pending.desc, icon: FiClock, tone: 'am' },
    { label: t.stats.confirmed.label, value: nf.format(counts.CONFIRMED || 0), description: t.stats.confirmed.desc, icon: FiCheckCircle, tone: 'em' },
    { label: t.stats.delivered.label, value: nf.format(counts.DELIVERED || 0), description: t.stats.delivered.desc, icon: FiTruck, tone: 'vi' },
  ], [counts, t, nf]);

  const filterGroups = useMemo(() => [
    [t.filter.sortBy, SORT_VALUES.map((v) => ({ value: v, label: t.sort[v] })), sortBy, setSortBy],
    [t.filter.payment, PAYMENT_VALUES.map((v) => ({ value: v, label: t.paymentFilter[v] })), paymentFilter, setPaymentFilter],
    [t.filter.dateRange, DATE_VALUES.map((v) => ({ value: v, label: t.dateRanges[v] })), dateRange, setDateRange],
  ], [t, sortBy, paymentFilter, dateRange]);

  const selectedOrder = useMemo(() => orders.find((o) => o.id === selectedId) || null, [orders, selectedId]);
  const statusOrder = useMemo(() => orders.find((o) => o.id === statusModalId) || null, [orders, statusModalId]);

  const handleDetails = useCallback((o) => setSelectedId(o.id), []);
  const handleOpenStatusModal = useCallback((o) => setStatusModalId(o.id), []);
  const handleAccept = useCallback((o) => updateOrderStatus(o.id, 'CONFIRMED'), [updateOrderStatus]);
  const handleReject = useCallback((o) => updateOrderStatus(o.id, 'CANCELLED'), [updateOrderStatus]);
  const handleCopy = useCallback(async (id) => {
    const tt = tRef.current.orders.toasts;
    try {
      await navigator.clipboard.writeText(String(id));
      toast({ icon: 'success', ...tt.copied, timer: 2000 });
    } catch {
      toast({ icon: 'error', ...tt.copyFail });
    }
  }, []);
  const resetFilters = useCallback(() => { setPaymentFilter('all'); setDateRange('all'); setSortBy('newest'); }, []);
  const closeDetails = useCallback(() => setSelectedId(null), []);
  const closeStatus = useCallback(() => setStatusModalId(null), []);
  const closeFilter = useCallback(() => setShowFilterPanel(false), []);
  const openFilter = useCallback(() => setShowFilterPanel(true), []);
  const refresh = useCallback(() => fetchOrders(), [fetchOrders]);
  const handleSearch = useCallback((e) => setSearch(sanitizeSearch(e.target.value)), []);

  const acceptSelected = useCallback(() => { updateOrderStatus(selectedId, 'CONFIRMED'); closeDetails(); }, [updateOrderStatus, selectedId, closeDetails]);
  const rejectSelected = useCallback(() => { updateOrderStatus(selectedId, 'CANCELLED'); closeDetails(); }, [updateOrderStatus, selectedId, closeDetails]);
  const openStatusFromDetails = useCallback(() => setStatusModalId(selectedId), [selectedId]);
  const selectNextStatus = useCallback((s) => { updateOrderStatus(statusModalId, s); closeStatus(); }, [updateOrderStatus, statusModalId, closeStatus]);

  const toggleDateSort = useCallback(() => setSortBy((s) => (s === 'newest' ? 'oldest' : 'newest')), []);
  const togglePriceSort = useCallback(() => setSortBy((s) => (s === 'highest' ? 'lowest' : 'highest')), []);

  const activeFilterCount = (paymentFilter !== 'all') + (dateRange !== 'all') + (sortBy !== 'newest');
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);
  const bold = 'tabular-nums';

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
          <div className="flex items-center gap-2.5">
            {lastUpdated && <p className="pg-muted hidden sm:block text-[11px] font-bold">{tpl(L.table.lastUpdated, { time: fmt(fm.time, lastUpdated) })}</p>}
            <button type="button" onClick={refresh} aria-label={L.table.refresh} title={L.table.refresh} className="pg-btn h-10 px-3 text-xs uppercase">
              <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" /> {L.table.refresh}
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
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60"
              />
            </div>
            <RowsSelect value={rowsPerPage} onChange={setRowsPerPage} label={L.table.rows} formatNumber={nf.format} />
            <button type="button" onClick={openFilter} className="pg-btn relative h-10 px-3 text-xs uppercase">
              <FiFilter size={14} aria-hidden="true" /> {L.table.filter}
              {activeFilterCount > 0 && (
                <span className="pg-line absolute -top-2 -end-2 w-5 h-5 border-2 bg-[var(--pg-btn)] text-[var(--pg-on)] text-[10px] font-extrabold grid place-items-center">{nf.format(activeFilterCount)}</span>
              )}
            </button>
          </div>

          <div role="tablist" aria-label={t.tabsAria} className="pg-line pg-scroll flex gap-2 overflow-x-auto px-3 sm:px-4 py-3 border-b-2">
            {TABS.map((s) => (
              <button key={s} type="button" role="tab" aria-selected={statusFilter === s} onClick={() => setStatusFilter(s)} className="pg-btn flex-shrink-0 h-9 px-3 text-xs uppercase">
                {t.status[s]}
                <span className="tabular-nums opacity-80">{nf.format(counts[s] || 0)}</span>
              </button>
            ))}
          </div>

          <div className="overflow-auto max-h-[68vh] pg-scroll" aria-busy={loading}>
            <table className="w-full min-w-[1000px] text-start border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th scope="col" className="pg-th">{t.columns.order}</th>
                  <th scope="col" className="pg-th">{t.columns.customer}</th>
                  <th scope="col" className="pg-th">{t.columns.products}</th>
                  <th scope="col" className="pg-th">{t.columns.payment}</th>
                  <SortTh label={t.columns.date} active={sortBy === 'newest' || sortBy === 'oldest'} dir={sortBy === 'oldest' ? 'asc' : 'desc'} onClick={toggleDateSort} />
                  <SortTh label={t.columns.total} active={sortBy === 'highest' || sortBy === 'lowest'} dir={sortBy === 'lowest' ? 'asc' : 'desc'} onClick={togglePriceSort} />
                  <th scope="col" className="pg-th">{t.columns.status}</th>
                  <th scope="col" className="pg-th">{t.columns.actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading && orders.length === 0 ? (
                  skeletonRows.map((i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((j) => <td key={j} className="pg-td px-3 py-4"><div className="pg-gray h-3.5 w-full" /></td>)}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-14"><Empty title={t.empty.title} subtitle={t.empty.subtitle} /></td></tr>
                ) : (
                  paginated.map((o) => (
                    <OrderRow
                      key={o.id}
                      order={o}
                      busy={busyIds.has(o.id)}
                      L={L}
                      onDetails={handleDetails}
                      onCopy={handleCopy}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onOpenStatusModal={handleOpenStatusModal}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="pg-gray pg-line px-4 py-3 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="pg-muted text-xs font-bold">
                {renderTpl(L.table.showing || DEFAULT_LABELS.showing, {
                  range: <b className={bold}>{nf.format(from)}–{nf.format(to)}</b>,
                  total: <b className={bold}>{nf.format(filtered.length)}</b>,
                  unit: t.unit ?? '',
                })}
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} labels={L.table} formatNumber={nf.format} />}
            </div>
          )}
        </section>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          busy={busyIds.has(selectedOrder.id)}
          L={L}
          onClose={closeDetails}
          onCopy={handleCopy}
          onAccept={acceptSelected}
          onReject={rejectSelected}
          onOpenStatusModal={openStatusFromDetails}
        />
      )}

      {showFilterPanel && (
        <FilterPanel title={t.filter.title} note={t.filter.note} groups={filterGroups} onReset={resetFilters} onClose={closeFilter} labels={L.table} />
      )}

      {statusOrder && (
        <StatusUpdateModal order={statusOrder} busy={busyIds.has(statusOrder.id)} L={L} onClose={closeStatus} onSelectStatus={selectNextStatus} />
      )}
    </div>
  );
};

export default memo(Orders);