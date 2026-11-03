import React, { useState, useEffect, useMemo, useCallback, useRef, useId, memo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiPackage, FiCheckCircle, FiTruck, FiXCircle, FiClock, FiBox, FiShoppingBag, FiLock, FiCheck, FiChevronDown, FiChevronRight,
  FiCreditCard, FiMapPin, FiCalendar, FiHeadphones, FiMessageCircle, FiShield, FiRefreshCw, FiAlertCircle,
} from 'react-icons/fi';
import api from '../common/api/api';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, gcTime: 10 * 60 * 1000 } } });

const shouldRetry = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const EMPTY_LIST = [];

const TRACK_TRANSLATIONS = {
  en: enTranslations.track,
  ar: arTranslations.track || arTranslations.hero?.track,
  fr: frTranslations.track || frTranslations.hero?.track,
};

const EXTRA_TEXT = {
  en: {
    trackOrder: 'Track your order', breadcrumbHome: 'Home', arrivingBy: 'Arriving by', trackingDetails: 'Tracking details',
    shipmentItems: 'Items in this order', shipmentDetails: 'Shipment details', orderSummary: 'Order summary', quantity: 'Qty',
    cancelledNote: 'This order has been cancelled. Contact support if you have any questions.',
  },
  ar: {
    trackOrder: 'تتبع طلبك', breadcrumbHome: 'الرئيسية', arrivingBy: 'يصل بحلول', trackingDetails: 'تفاصيل التتبع',
    shipmentItems: 'المنتجات في هذا الطلب', shipmentDetails: 'تفاصيل الشحنة', orderSummary: 'ملخص الطلب', quantity: 'الكمية',
    cancelledNote: 'تم إلغاء هذا الطلب. تواصل مع الدعم إذا كان لديك أي استفسار.',
  },
  fr: {
    trackOrder: 'Suivre votre commande', breadcrumbHome: 'Accueil', arrivingBy: 'Livraison prévue le', trackingDetails: 'Détails du suivi',
    shipmentItems: 'Articles de cette commande', shipmentDetails: "Détails de l'expédition", orderSummary: 'Récapitulatif', quantity: 'Qté',
    cancelledNote: "Cette commande a été annulée. Contactez le support si vous avez des questions.",
  },
};

const tr = (lang, key) => TRACK_TRANSLATIONS[lang]?.[key] || EXTRA_TEXT[lang]?.[key] || TRACK_TRANSLATIONS.en?.[key] || EXTRA_TEXT.en[key] || key;

const LOCALES = { en: 'en-GB', ar: 'ar-EG', fr: 'fr-FR' };

const STATUS_STEPS = [
  { key: 'PENDING', labelKey: 'orderPlaced', subKey: 'orderReceived', icon: FiClock },
  { key: 'CONFIRMED', labelKey: 'confirmed', subKey: 'orderConfirmed', icon: FiCheckCircle },
  { key: 'PROCESSING', labelKey: 'processing', subKey: 'itemsPrepared', icon: FiPackage },
  { key: 'FINISHPROCESSING', labelKey: 'readyToShip', subKey: 'packedReady', icon: FiBox },
  { key: 'SHIPPED', labelKey: 'outForDelivery', subKey: 'onTheWay', icon: FiTruck },
  { key: 'DELIVERED', labelKey: 'delivered', subKey: 'packageDelivered', icon: FiCheckCircle },
  { key: 'CANCELLED', labelKey: 'cancelled', subKey: 'orderCancelled', icon: FiXCircle },
];
const STEP_INDEX = Object.fromEntries(STATUS_STEPS.map((s, i) => [s.key, i]));

const STAGES = [
  { key: 'placed', icon: FiClock, labelKey: 'orderPlaced', statuses: ['PENDING', 'CONFIRMED'] },
  { key: 'processing', icon: FiPackage, labelKey: 'processing', statuses: ['PROCESSING', 'FINISHPROCESSING'] },
  { key: 'shipped', icon: FiTruck, labelKey: 'outForDelivery', statuses: ['SHIPPED'] },
  { key: 'delivered', icon: FiCheckCircle, labelKey: 'delivered', statuses: ['DELIVERED'] },
];

const THEME = {
  light: {
    page: 'bg-gray-50 text-emerald-950', card: 'bg-white border-gray-200', soft: 'bg-gray-50', ink: 'text-emerald-950', muted: 'text-gray-600',
    line: 'border-gray-200', accent: 'text-emerald-600', accentBg: 'bg-emerald-500', iconBg: 'bg-emerald-600', track: 'bg-gray-200', hover: 'hover:bg-emerald-50',
    warn: 'text-amber-700', sk: 'bg-gray-200/80',
  },
  dark: {
    page: 'bg-[#141414] text-white', card: 'bg-[#2a2a2a] border-[#3d3d3d]', soft: 'bg-[#1e1e1e]', ink: 'text-white', muted: 'text-neutral-400',
    line: 'border-[#3d3d3d]', accent: 'text-[#39ff88]', accentBg: 'bg-[#39ff88]', iconBg: 'bg-emerald-600', track: 'bg-neutral-700', hover: 'hover:bg-white/10',
    warn: 'text-amber-300', sk: 'bg-white/10',
  },
};

const DATE_OPTS = { month: 'short', day: 'numeric', year: 'numeric' };
const DATETIME_OPTS = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
const dtfCache = new Map();
const getDtf = (loc, kind, opts) => {
  const k = `${loc}|${kind}`;
  let f = dtfCache.get(k);
  if (!f) { f = new Intl.DateTimeFormat(loc, opts); dtfCache.set(k, f); }
  return f;
};
const fmtDate = (v, loc) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : getDtf(loc, 'date', DATE_OPTS).format(d);
};
const fmtDateTime = (v, loc) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : getDtf(loc, 'datetime', DATETIME_OPTS).format(d);
};
const fmtMoney = (v, loc, currency) =>
  (v === undefined || v === null || Number.isNaN(Number(v)) ? null : `${currency} ${Number(v).toLocaleString(loc)}`);
const addDays = (v, n) => { const d = v ? new Date(v) : new Date(); d.setDate(d.getDate() + n); return d; };
const shortId = (o) => o.id?.slice(0, 8);

const getEta = (o, loc) => (o.status === 'DELIVERED'
  ? fmtDate(o.deliveredAt ?? o.updatedAt, loc)
  : fmtDate(o.estimatedDelivery, loc) ?? fmtDate(addDays(o.createdAt, 5), loc));

const stepTimestamp = (order, key, loc) => {
  const h = order?.statusHistory?.find((x) => x.status === key);
  if (h?.timestamp) return fmtDateTime(h.timestamp, loc);
  if (key === order?.status && key !== order?.statusHistory?.[0]?.status) return fmtDateTime(order?.updatedAt, loc);
  return null;
};

const stageTimestamp = (order, statuses, loc) => {
  for (let i = statuses.length - 1; i >= 0; i -= 1) {
    const v = stepTimestamp(order, statuses[i], loc);
    if (v) return v;
  }
  return null;
};

const buildMeta = (o, t, loc) => [
  { icon: FiPackage, label: t('trackingId'), value: o.trackingNumber ?? o.id?.slice(0, 12) },
  { icon: FiTruck, label: t('carrier'), value: o.carrier ?? t('standardCourier') },
  { icon: FiCalendar, label: t('orderDate'), value: fmtDate(o.createdAt, loc) ?? '—' },
  { icon: FiClock, label: t('lastUpdated'), value: fmtDateTime(o.updatedAt, loc) ?? '—' },
];

const buildDetails = (o, t, loc) => {
  const count = o.items?.length ?? o.orderItems?.length ?? null;
  const total = fmtMoney(o.totalAmount ?? o.total ?? o.amount, loc, t('currency'));
  const payment = o.paymentMethod ?? o.payment_method ?? null;
  const address = o.shippingAddress ?? o.address ?? null;
  const delivered = o.status === 'DELIVERED';
  const eta = getEta(o, loc);
  return [
    count !== null && { icon: FiPackage, label: t('items'), value: `${count} ${count === 1 ? t('item') : t('items')}` },
    total && { icon: FiCreditCard, label: t('orderTotal'), value: total },
    payment && { icon: FiCreditCard, label: t('payment'), value: payment },
    address && { icon: FiMapPin, label: t('deliveringTo'), value: typeof address === 'string' ? address : [address.street, address.city].filter(Boolean).join(', ') },
    o.status !== 'CANCELLED' && eta && { icon: FiCalendar, label: delivered ? t('deliveredOn') : t('estimatedDelivery'), value: eta },
  ].filter(Boolean);
};

const IMG_OK = /^(https?:\/\/|\/)/i;
const buildItems = (o, loc, currency) => {
  const list = Array.isArray(o.items) ? o.items : Array.isArray(o.orderItems) ? o.orderItems : EMPTY_LIST;
  const out = [];
  for (let i = 0; i < list.length && out.length < 30; i += 1) {
    const it = list[i];
    const p = it?.product || {};
    const img = it?.imageUrl ?? p.imageUrl ?? '';
    const pid = it?.productId ?? p.id ?? null;
    const name = String(it?.productName ?? it?.name ?? p.name ?? '').slice(0, 160);
    if (!name) continue;
    out.push({
      key: `${it?.id ?? pid ?? 'i'}-${i}`,
      name,
      qty: Math.max(1, Number(it?.quantity) || 1),
      price: fmtMoney(it?.price ?? it?.unitPrice ?? p.price, loc, currency),
      img: typeof img === 'string' && IMG_OK.test(img) ? img : '',
      href: pid != null ? `/device/${encodeURIComponent(pid)}` : null,
    });
  }
  return out;
};

const PAGE_CSS = `
  @keyframes hpRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  .hp-rise { animation: hpRise 0.24s cubic-bezier(.2,.8,.2,1) both; }
  @keyframes hpPop { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
  .hp-pop { animation: hpPop 0.12s ease-out both; transform-origin: top; }
  @media (prefers-reduced-motion: reduce) { .hp-rise, .hp-pop { animation: none; } }
`;
let stylesInjected = false;
const injectStylesOnce = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-track-styles', 'true');
  tag.textContent = PAGE_CSS;
  document.head.appendChild(tag);
  stylesInjected = true;
};
injectStylesOnce();

const BTN_BASE =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors motion-reduce:transition-none ' +
  'disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-emerald-400';
const btn = (th, primary) => (primary
  ? `${BTN_BASE} ${th.iconBg} text-white hover:bg-emerald-700`
  : `${BTN_BASE} border ${th.card} ${th.ink} ${th.hover}`);

const Dropdown = memo(({ value, onChange, options, ariaLabel, th }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const uid = useId().replace(/:/g, '');
  const listId = `${uid}-list`;
  const foundIdx = options.findIndex((o) => o.value === value);
  const selectedIdx = Math.max(0, foundIdx);
  const current = foundIdx >= 0 ? options[foundIdx] : null;

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => { if (open) setActive(selectedIdx); }, [open, selectedIdx]);

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const choose = useCallback((i) => {
    const o = options[i];
    if (o) onChange(o.value);
    setOpen(false);
    btnRef.current?.focus();
  }, [options, onChange]);

  const onKeyDown = (e) => {
    const last = options.length - 1;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (!open) setOpen(true); else setActive((i) => Math.min(i + 1, last)); break;
      case 'ArrowUp': e.preventDefault(); if (!open) setOpen(true); else setActive((i) => Math.max(i - 1, 0)); break;
      case 'Home': if (open) { e.preventDefault(); setActive(0); } break;
      case 'End': if (open) { e.preventDefault(); setActive(last); } break;
      case 'Enter':
      case ' ': e.preventDefault(); if (open) choose(active); else setOpen(true); break;
      case 'Escape': if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false); } break;
      case 'Tab': setOpen(false); break;
      default:
    }
  };

  return (
    <div ref={rootRef} className={`relative ${open ? 'z-30' : ''}`}>
      <button
        ref={btnRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${uid}-o${active}` : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 text-start text-sm font-semibold outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${th.card} ${th.ink}`}
      >
        <span className="truncate">{current?.label}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
          className={`hp-pop absolute start-0 top-full z-30 mt-2 max-h-64 min-w-full overflow-y-auto overscroll-contain rounded-xl border py-1 shadow-xl ${th.card} ${th.ink}`}
        >
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                id={`${uid}-o${i}`}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 whitespace-nowrap px-3 py-2 text-sm font-semibold ${
                  selected ? `bg-emerald-500/15 ${th.accent}` : i === active ? th.soft : ''
                }`}
              >
                <span className="truncate">{o.label}</span>
                {selected && <FiCheck aria-hidden="true" className="h-4 w-4 flex-shrink-0" strokeWidth={3} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

const StatusPill = memo(({ status, text, th }) => {
  const Icon = STATUS_STEPS[STEP_INDEX[status]]?.icon || FiBox;
  const tone = status === 'DELIVERED'
    ? `bg-emerald-500/15 ${th.accent}`
    : status === 'CANCELLED'
      ? 'bg-rose-500/15 text-rose-500'
      : `bg-amber-500/15 ${th.warn}`;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${tone}`}>
      <Icon aria-hidden="true" className="h-4 w-4" />{text}
    </span>
  );
});

const Stepper = memo(({ stages, stageIdx, th, label }) => (
  <ol className="mt-8 flex" aria-label={label}>
    {stages.map((s, i) => {
      const done = i <= stageIdx;
      const current = i === stageIdx;
      const Icon = s.icon;
      return (
        <li key={s.key} aria-current={current ? 'step' : undefined} className="relative flex min-w-0 flex-1 flex-col items-center px-1 text-center">
          {i > 0 && <span aria-hidden="true" className={`absolute start-[-50%] top-[18px] h-1 w-full rounded-full ${done ? th.accentBg : th.track}`} />}
          <span
            className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
              done ? `${th.iconBg} border-transparent text-white` : `${th.card} ${th.muted}`
            } ${current ? 'ring-4 ring-emerald-500/25' : ''}`}
          >
            <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
          </span>
          <span className={`mt-2 text-xs font-bold sm:text-sm ${done ? th.ink : th.muted}`}>{s.label}</span>
          {done && s.ts && <span className={`mt-0.5 text-[11px] leading-tight ${th.muted}`}>{s.ts}</span>}
        </li>
      );
    })}
  </ol>
));

const SummaryCard = memo(({ order, headline, subText, stages, stageIdx, isCancelled, statusText, th, t }) => (
  <section aria-label={t('orderNumber')} className={`hp-rise rounded-2xl border p-5 sm:p-7 ${th.card}`}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className={`text-sm ${th.muted}`}>{t('orderNumber')} <span dir="ltr" className={`font-bold ${th.ink}`}>#{shortId(order)}</span></p>
        <h2 className={`mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl ${isCancelled ? 'text-rose-500' : th.ink}`}>{headline}</h2>
        {subText && <p className={`mt-1 text-sm ${th.muted}`}>{subText}</p>}
      </div>
      <StatusPill status={order.status} text={statusText} th={th} />
    </div>
    {isCancelled ? (
      <p className="mt-6 flex items-start gap-3 rounded-xl bg-rose-500/10 p-4 text-sm font-medium text-rose-500">
        <FiXCircle aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0" />{t('cancelledNote')}
      </p>
    ) : (
      <Stepper stages={stages} stageIdx={stageIdx} th={th} label={t('overallProgress')} />
    )}
  </section>
));

const StepRow = memo(({ step, done, current, cancelledStep, last, timestamp, th, t }) => {
  const Icon = step.icon;
  const circle = cancelledStep
    ? 'border-transparent bg-rose-500 text-white'
    : done
      ? `border-transparent ${th.iconBg} text-white`
      : `${th.soft} ${th.line} ${th.muted}`;
  return (
    <li className={`relative flex gap-4 ${last ? '' : 'pb-6'}`} aria-current={current && !cancelledStep ? 'step' : undefined}>
      {!last && <span aria-hidden="true" className={`absolute bottom-0 start-[17px] top-9 w-0.5 ${done && !current ? th.accentBg : th.track}`} />}
      <span className={`relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border ${circle}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className={`text-sm font-bold ${cancelledStep ? 'text-rose-500' : done ? th.ink : th.muted}`}>{step.label}</p>
          {timestamp && (done || cancelledStep) && <span className={`text-xs ${th.muted}`}>{timestamp}</span>}
        </div>
        <p className={`mt-0.5 text-xs ${th.muted}`}>{step.sub}</p>
        {current && !cancelledStep && (
          <p className={`mt-1.5 flex items-center gap-1 text-xs font-bold ${th.accent}`}>
            <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5 rtl:rotate-180" />{t('currentStatus')}
          </p>
        )}
      </div>
    </li>
  );
});

const ItemsCard = memo(({ items, th, t }) => (
  <section aria-label={t('shipmentItems')} className={`rounded-2xl border p-5 sm:p-6 ${th.card}`}>
    <h3 className={`mb-4 text-lg font-bold ${th.ink}`}>{t('shipmentItems')}</h3>
    <ul className={`divide-y ${th.line}`}>
      {items.map((it) => {
        const thumb = (
          <span className={`flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border ${th.line} ${th.soft}`}>
            {it.img
              ? <img src={it.img} alt="" width={64} height={64} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-contain p-1" />
              : <FiBox aria-hidden="true" className={`h-6 w-6 ${th.accent}`} />}
          </span>
        );
        const name = <span className={`line-clamp-2 text-sm font-semibold ${th.ink}`}>{it.name}</span>;
        return (
          <li key={it.key} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
            {it.href ? <Link to={it.href} tabIndex={-1} aria-hidden="true">{thumb}</Link> : thumb}
            <div className="min-w-0 flex-1">
              {it.href ? <Link to={it.href} className="hover:underline">{name}</Link> : name}
              <p className={`mt-1 text-xs ${th.muted}`}>{t('quantity')}: <span dir="ltr" className="font-bold tabular-nums">{it.qty}</span></p>
            </div>
            {it.price && <p className={`flex-shrink-0 text-sm font-extrabold tabular-nums ${th.ink}`} dir="ltr">{it.price}</p>}
          </li>
        );
      })}
    </ul>
  </section>
));

const DetailCard = memo(({ title, rows, th }) => (rows.length ? (
  <section aria-label={title} className={`rounded-2xl border p-5 ${th.card}`}>
    <h3 className={`mb-4 text-base font-bold ${th.ink}`}>{title}</h3>
    <dl className="space-y-3.5">
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-start gap-3">
          <Icon aria-hidden="true" className={`mt-0.5 h-4 w-4 flex-shrink-0 ${th.accent}`} />
          <div className="min-w-0">
            <dt className={`text-xs ${th.muted}`}>{label}</dt>
            <dd className={`break-words text-sm font-semibold ${th.ink}`}>{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  </section>
) : null));

const HelpNote = memo(({ th, t }) => (
  <div className={`flex items-start gap-2.5 rounded-2xl border p-4 text-xs ${th.card} ${th.muted}`}>
    <FiShield aria-hidden="true" className={`mt-0.5 h-4 w-4 flex-shrink-0 ${th.accent}`} />
    <p className="leading-relaxed"><span className={`font-bold ${th.ink}`}>{t('trackingHelp')}</span> {t('trackingHelpText')}</p>
  </div>
));

export const CantFindCard = memo(({ t, darkMode = false }) => {
  const th = darkMode ? THEME.dark : THEME.light;
  return (
    <div className={`flex flex-col items-start gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${th.card}`}>
      <span aria-hidden="true" className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${th.iconBg} text-white`}><FiHeadphones className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className={`text-base font-bold ${th.ink}`}>{t('cantFindTitle')}</p>
        <p className={`mt-1 text-sm ${th.muted}`}>{t('cantFindText')}</p>
      </div>
      <div className="flex w-full flex-wrap gap-3 sm:w-auto">
        <Link to="/support" className={`${btn(th, false)} flex-1 sm:flex-none`}><FiHeadphones aria-hidden="true" className="h-4 w-4" />{t('support')}</Link>
        <Link to="/chat" className={`${btn(th, true)} flex-1 sm:flex-none`}><FiMessageCircle aria-hidden="true" className="h-4 w-4" />{t('liveChat')}</Link>
      </div>
    </div>
  );
});

const StateCard = memo(({ icon: Icon = FiAlertCircle, title, text, th, children }) => (
  <div className={`mx-auto flex max-w-md flex-col items-center rounded-2xl border px-6 py-10 text-center ${th.card}`}>
    <span aria-hidden="true" className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${th.iconBg} text-white`}><Icon className="h-8 w-8" /></span>
    <h2 className={`text-xl font-extrabold ${th.ink}`}>{title}</h2>
    {text && <p className={`mb-6 mt-3 text-sm ${th.muted}`}>{text}</p>}
    <div>{children}</div>
  </div>
));

const SK_STAGES = [0, 1, 2, 3];
const SK_ROWS = [0, 1, 2, 3, 4];
const TrackSkeleton = memo(({ th }) => {
  const bar = `animate-pulse rounded motion-reduce:animate-none ${th.sk}`;
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <div className={`rounded-2xl border p-5 sm:p-7 ${th.card}`}>
        <div className="space-y-3">
          <div className={`${bar} h-4 w-32`} />
          <div className={`${bar} h-8 w-72 max-w-full`} />
          <div className={`${bar} h-4 w-48`} />
        </div>
        <div className="mt-8 flex">
          {SK_STAGES.map((i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className={`${bar} h-10 w-10 !rounded-full`} />
              <div className={`${bar} h-3 w-16`} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className={`space-y-6 rounded-2xl border p-5 sm:p-6 ${th.card}`}>
          <div className={`${bar} h-6 w-40`} />
          {SK_ROWS.map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`${bar} h-9 w-9 flex-shrink-0 !rounded-full`} />
              <div className="flex-1 space-y-2">
                <div className={`${bar} h-4 w-1/2`} />
                <div className={`${bar} h-3 w-1/3`} />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className={`space-y-3 rounded-2xl border p-5 ${th.card}`}>
            <div className={`${bar} h-5 w-32`} />
            <div className={`${bar} h-10 w-full`} />
            <div className={`${bar} h-10 w-full`} />
            <div className={`${bar} h-10 w-full`} />
          </div>
          <div className={`space-y-3 rounded-2xl border p-5 ${th.card}`}>
            <div className={`${bar} h-5 w-32`} />
            <div className={`${bar} h-10 w-full`} />
            <div className={`${bar} h-10 w-full`} />
          </div>
        </div>
      </div>
    </div>
  );
});

const TrackContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const t = useCallback((k) => tr(language, k), [language]);
  const loc = LOCALES[language] || 'en-GB';
  const isAr = language === 'ar';
  const th = darkMode ? THEME.dark : THEME.light;
  const [token] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null));
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => { document.title = 'Track your order | Tech-Restore'; }, []);

  const { data: orders = EMPTY_LIST, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['track_orders', token],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/users/orders', { signal, headers: { Authorization: `Bearer ${token}` } });
      const list = res.data?.content || res.data || [];
      return Array.isArray(list) ? list.filter(Boolean) : [];
    },
    enabled: !!token,
    staleTime: 30 * 1000,
    retry: shouldRetry,
  });

  const order = useMemo(() => orders.find((o) => o.id === selectedId) || orders[0] || null, [orders, selectedId]);
  const isCancelled = order?.status === 'CANCELLED';
  const currentIdx = useMemo(() => STEP_INDEX[order?.status] ?? -1, [order?.status]);
  const stageIdx = useMemo(() => STAGES.findIndex((s) => s.statuses.includes(order?.status)), [order?.status]);

  const statusLabel = useCallback((status) => {
    const s = STATUS_STEPS[STEP_INDEX[status]];
    return s ? t(s.labelKey) : status;
  }, [t]);

  const steps = useMemo(
    () => STATUS_STEPS
      .filter((s) => (isCancelled ? s.key !== 'DELIVERED' : s.key !== 'CANCELLED'))
      .map((s) => ({ ...s, label: t(s.labelKey), sub: t(s.subKey) })),
    [isCancelled, t],
  );

  const stages = useMemo(
    () => STAGES.map((s) => ({ ...s, label: t(s.labelKey), ts: order ? stageTimestamp(order, s.statuses, loc) : null })),
    [order, t, loc],
  );

  const timestamps = useMemo(() => (order ? steps.map((s) => stepTimestamp(order, s.key, loc)) : EMPTY_LIST), [order, steps, loc]);
  const meta = useMemo(() => (order ? buildMeta(order, t, loc) : EMPTY_LIST), [order, t, loc]);
  const rows = useMemo(() => (order ? buildDetails(order, t, loc) : EMPTY_LIST), [order, t, loc]);
  const items = useMemo(() => (order ? buildItems(order, loc, t('currency')) : EMPTY_LIST), [order, loc, t]);
  const orderOptions = useMemo(
    () => orders.map((o) => ({ value: o.id, label: `${t('orderNumber')} #${shortId(o)} · ${statusLabel(o.status)}` })),
    [orders, t, statusLabel],
  );

  const headline = useMemo(() => {
    if (!order) return '';
    if (isCancelled) return t('cancelled');
    const eta = getEta(order, loc);
    if (order.status === 'DELIVERED') return eta ? `${t('deliveredOn')} ${eta}` : t('delivered');
    return eta ? `${t('arrivingBy')} ${eta}` : statusLabel(order.status);
  }, [order, isCancelled, loc, t, statusLabel]);

  const subText = order ? t(STATUS_STEPS[STEP_INDEX[order.status]]?.subKey || 'orderReceived') : '';

  let body;
  if (!token) {
    body = (
      <StateCard icon={FiLock} title={t('loginRequired')} text={t('loginTrack')} th={th}>
        <Link to="/login" className={btn(th, true)}><FiLock aria-hidden="true" className="h-4 w-4" />{t('goToLogin')}</Link>
      </StateCard>
    );
  } else if (isLoading) {
    body = <TrackSkeleton th={th} />;
  } else if (isError) {
    body = (
      <StateCard title={t('loadErrorTitle')} text={t('loadErrorText')} th={th}>
        <button type="button" onClick={() => refetch()} className={btn(th, true)}>
          <FiRefreshCw aria-hidden="true" className={`h-4 w-4 ${isFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />{t('tryAgain')}
        </button>
      </StateCard>
    );
  } else if (!order) {
    body = (
      <StateCard icon={FiShoppingBag} title={t('noOrders')} text={t('startShopping')} th={th}>
        <Link to="/devices" className={btn(th, true)}><FiShoppingBag aria-hidden="true" className="h-4 w-4" />{t('startShoppingButton')}</Link>
      </StateCard>
    );
  } else {
    body = (
      <div className="space-y-6">
        <SummaryCard
          order={order} headline={headline} subText={subText} stages={stages} stageIdx={stageIdx}
          isCancelled={isCancelled} statusText={statusLabel(order.status)} th={th} t={t}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0 space-y-6">
            <section aria-label={t('trackingDetails')} className={`rounded-2xl border p-5 sm:p-6 ${th.card}`}>
              <h3 className={`mb-5 text-lg font-bold ${th.ink}`}>{t('trackingDetails')}</h3>
              <ol>
                {steps.map((step, i) => {
                  const idx = STEP_INDEX[step.key];
                  return (
                    <StepRow
                      key={step.key} step={step} th={th} t={t}
                      last={i === steps.length - 1}
                      done={!isCancelled && idx <= currentIdx}
                      current={idx === currentIdx}
                      cancelledStep={isCancelled && step.key === 'CANCELLED'}
                      timestamp={timestamps[i]}
                    />
                  );
                })}
              </ol>
            </section>

            {items.length > 0 && <ItemsCard items={items} th={th} t={t} />}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-32">
            <DetailCard title={t('shipmentDetails')} rows={meta} th={th} />
            <DetailCard title={t('orderSummary')} rows={rows} th={th} />
            <HelpNote th={th} t={t} />
          </aside>
        </div>

        <div className="flex justify-center">
          <Link to="/devices" className={btn(th, false)}><FiShoppingBag aria-hidden="true" className="h-4 w-4" />{t('exploreDevices')}</Link>
        </div>
      </div>
    );
  }

  const showSelector = !!token && !isLoading && !isError && orders.length > 1 && !!order;

  return (
    <div
      dir={languageDirection(language)}
      lang={language}
      className={`min-h-screen [overflow-x:clip] ${isAr ? 'font-cairo' : 'font-jakarta'} ${th.page}`}
    >
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-36 sm:px-6 sm:pt-44 lg:px-8">
        <nav aria-label={t('trackOrder')} className="flex items-center gap-1.5 text-xs font-semibold sm:text-sm">
          <Link to="/" className="hover:underline">{t('breadcrumbHome')}</Link>
          <FiChevronRight aria-hidden="true" className={`h-3 w-3 flex-shrink-0 rtl:rotate-180 ${th.muted}`} />
          <span className={th.muted} aria-current="page">{t('trackOrder')}</span>
        </nav>

        <div className="mb-6 mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t('trackOrder')}</h1>
          {showSelector && (
            <div className="w-full sm:w-80">
              <Dropdown ariaLabel={t('selectOrder')} value={order.id} onChange={setSelectedId} options={orderOptions} th={th} />
            </div>
          )}
        </div>

        {body}
      </div>
    </div>
  );
});

export { queryClient };
export default function Track(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <TrackContent {...props} />
    </QueryClientProvider>
  );
}