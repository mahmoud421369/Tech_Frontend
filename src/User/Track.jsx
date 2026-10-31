import React, { useState, useEffect, useMemo, useCallback, useRef, useId, memo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiPackage, FiCheckCircle, FiTruck, FiXCircle, FiClock, FiBox, FiShoppingBag, FiLock, FiCheck, FiChevronDown, FiChevronRight,
  FiCreditCard, FiMapPin, FiCalendar, FiHeadphones, FiMessageCircle, FiShield, FiRefreshCw,
} from 'react-icons/fi';
import api from '../common/api/api';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { Hero } from '../components';
import { HeroArt } from '../components/user/HeroArt';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, gcTime: 10 * 60 * 1000 } } });

const shouldRetry = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const TRACK_TRANSLATIONS = {
  en: enTranslations.track,
  ar: arTranslations.track || arTranslations.hero?.track,
  fr: frTranslations.track || frTranslations.hero?.track,
};

const tr = (lang, key) => TRACK_TRANSLATIONS[lang]?.[key] || TRACK_TRANSLATIONS.en?.[key] || key;

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

const stepTimestamp = (order, key, loc) => {
  const h = order?.statusHistory?.find((x) => x.status === key);
  if (h?.timestamp) return fmtDateTime(h.timestamp, loc);
  if (key === order?.status && key !== order?.statusHistory?.[0]?.status) return fmtDateTime(order?.updatedAt, loc);
  return null;
};

const statusTone = (status, darkMode) => {
  if (status === 'DELIVERED') return darkMode ? 'text-[#39ff88]' : 'text-emerald-600';
  if (status === 'CANCELLED') return darkMode ? 'text-rose-400' : 'text-rose-600';
  return darkMode ? 'text-amber-300' : 'text-amber-700';
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
  const eta = delivered
    ? fmtDate(o.deliveredAt ?? o.updatedAt, loc)
    : fmtDate(o.estimatedDelivery, loc) ?? fmtDate(addDays(o.createdAt, 5), loc);
  return [
    count !== null && { icon: FiPackage, label: t('items'), value: `${count} ${count === 1 ? t('item') : t('items')}` },
    total && { icon: FiCreditCard, label: t('orderTotal'), value: total },
    payment && { icon: FiCreditCard, label: t('payment'), value: payment },
    address && { icon: FiMapPin, label: t('deliveringTo'), value: typeof address === 'string' ? address : [address.street, address.city].filter(Boolean).join(', ') },
    o.status !== 'CANCELLED' && eta && { icon: FiCalendar, label: delivered ? t('deliveredOn') : t('estimatedDelivery'), value: eta },
  ].filter(Boolean);
};

const PAGE_CSS = `
  .hp-hl, .hp-hl-dark {
    padding-bottom: 0.2em;
    background-position: left bottom;
    background-repeat: no-repeat;
    background-size: 100% 0.3em;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .hp-hl      { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2310b981' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .hp-hl-dark { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  @keyframes hpRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  .hp-rise { animation: hpRise 0.28s cubic-bezier(.2,.8,.2,1) both; }
  @keyframes hpPop { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: none; } }
  .hp-pop { animation: hpPop 0.14s ease-out both; transform-origin: top; }
  .hp-pattern {
    --p1: rgba(4, 38, 26, .13);
    --p2: rgba(16, 185, 129, .12);
    background-image:
      radial-gradient(circle at 2px 2px, var(--p1) 1.6px, transparent 1.8px),
      repeating-linear-gradient(135deg, var(--p2) 0 2px, transparent 2px 18px);
    background-size: 22px 22px, auto;
  }
  .hp-pattern-dark { --p1: rgba(57, 255, 136, .14); --p2: rgba(57, 255, 136, .06); }
  @media (prefers-reduced-motion: reduce) {
    .hp-rise, .hp-pop { animation: none; }
  }
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

const DARK_PAGE = 'bg-[#141414]';

const NEO_THEME = {
  light: '[--dx:1] rtl:[--dx:-1] [--ink:#022c22] [--sh:#022c22] [--acc:#34d399]',
  dark: '[--dx:1] rtl:[--dx:-1] [--ink:#000] [--sh:#000] [--acc:#39ff88]',
};
const NEO_SURFACE = { light: 'bg-white', dark: 'bg-[#2a2a2a]' };
const NEO_BOX = {
  lg: 'flex flex-col rounded-2xl border-[3px] border-[color:var(--ink)] [box-shadow:calc(var(--dx)*8px)_8px_0_0_var(--sh)]',
  sm: 'flex flex-col rounded-2xl border-[3px] border-[color:var(--ink)] [box-shadow:calc(var(--dx)*6px)_6px_0_0_var(--sh)]',
};
const neoCard = (darkMode, size = 'lg') => {
  const k = darkMode ? 'dark' : 'light';
  return `${NEO_THEME[k]} ${NEO_BOX[size]} ${NEO_SURFACE[k]}`;
};

const NEO_BTN =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-[color:var(--ink)] px-4 py-2.5 text-sm font-extrabold uppercase ' +
  '[box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  'active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'disabled:cursor-not-allowed disabled:opacity-40 ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const neoBtn = (darkMode, active) => {
  const k = darkMode ? 'dark' : 'light';
  const tone = active ? 'bg-[color:var(--acc)] text-emerald-950' : `${NEO_SURFACE[k]} ${darkMode ? 'text-white' : 'text-emerald-950'}`;
  return `${NEO_THEME[k]} ${NEO_BTN} ${tone}`;
};

const ICON_BOX =
  'inline-flex flex-shrink-0 items-center justify-center rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]';
const ROW_BOX = 'rounded-xl border-2 border-dotted border-[color:var(--ink)]';

const Dropdown = memo(({ value, onChange, options, ariaLabel, darkMode }) => {
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

  const surface = darkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-emerald-950';
  const hover = darkMode ? 'bg-white/10' : 'bg-emerald-100';

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
        className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border-2 border-[color:var(--ink)] px-3 text-start text-sm font-semibold outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)] ${surface}`}
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
          className={`hp-pop absolute start-0 top-full z-30 mt-2 max-h-64 min-w-full overflow-y-auto overscroll-contain rounded-xl border-[3px] border-[color:var(--ink)] py-1 [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] ${surface}`}
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
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 whitespace-nowrap px-3 py-2 text-sm font-bold ${
                  selected ? 'bg-[color:var(--acc)] text-emerald-950' : i === active ? hover : ''
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

const MetaTile = memo(({ icon: Icon, label, value, darkMode }) => (
  <div className={`min-w-0 p-3 ${ROW_BOX} ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
    <p className={`flex items-center gap-1.5 text-[11px] font-extrabold uppercase ${darkMode ? 'text-neutral-400' : 'text-gray-600'}`}>
      <Icon aria-hidden="true" className={`h-3.5 w-3.5 flex-shrink-0 ${darkMode ? 'text-[#39ff88]' : 'text-emerald-600'}`} /><span className="truncate">{label}</span>
    </p>
    <p className={`mt-1 truncate text-sm font-extrabold ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{value}</p>
  </div>
));

const StepRow = memo(({ step, isCompleted, isCurrent, isCancelledStep, isLast, timestamp, darkMode, t }) => {
  const Icon = step.icon;
  const active = isCompleted || isCancelledStep;
  const muted = darkMode ? 'text-neutral-400' : 'text-gray-600';
  const box = isCancelledStep
    ? 'bg-rose-500 text-white [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]'
    : isCompleted
      ? 'bg-[color:var(--acc)] text-emerald-950 [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]'
      : `${darkMode ? 'bg-[#1e1e1e] text-neutral-500' : 'bg-gray-100 text-gray-500'}`;
  return (
    <li className={`relative flex gap-4 ${isLast ? '' : 'pb-6'}`} aria-current={isCurrent && !isCancelledStep ? 'step' : undefined}>
      {!isLast && (
        <span
          aria-hidden="true"
          className={`absolute start-[18px] top-10 bottom-0 w-1 rounded-full ${isCompleted && !isCurrent ? 'bg-[color:var(--acc)]' : darkMode ? 'bg-neutral-700' : 'bg-gray-200'}`}
        />
      )}
      <span className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-2 border-[color:var(--ink)] ${box}`}>
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className={`text-sm font-extrabold uppercase leading-snug ${isCancelledStep ? 'text-rose-500' : active ? (darkMode ? 'text-white' : 'text-emerald-950') : muted}`}>{step.label}</p>
          {timestamp && active && <span className={`text-xs font-bold ${muted}`}>{timestamp}</span>}
        </div>
        <p className={`mt-0.5 text-xs font-medium ${muted}`}>{step.sub}</p>
        {isCurrent && !isCancelledStep && (
          <p className={`mt-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase ${darkMode ? 'text-[#39ff88]' : 'text-emerald-600'}`}>
            <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5 rtl:rotate-180" />{t('currentStatus')}
          </p>
        )}
      </div>
    </li>
  );
});

const StatusStrip = memo(({ order, options, onSelect, progressPct, isCancelled, statusText, darkMode, isAr, t }) => {
  const StatusIcon = STATUS_STEPS[STEP_INDEX[order.status]]?.icon || FiBox;
  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const muted = darkMode ? 'text-neutral-300' : 'text-gray-700';
  return (
    <div className={`relative z-20 mb-10 mr-2 p-5 sm:p-6 rtl:mr-0 rtl:ml-2 ${neoCard(darkMode, 'lg')}`}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-end lg:gap-10">
        <div>
          <p className={`mb-2 text-xs font-extrabold uppercase ${isAr ? 'tracking-normal' : 'tracking-wide'} ${ink}`}>{t('selectOrder')}</p>
          <Dropdown ariaLabel={t('selectOrder')} value={order.id} onChange={onSelect} options={options} darkMode={darkMode} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <h2 className={`text-2xl font-extrabold uppercase sm:text-3xl ${isAr ? 'tracking-normal' : 'tracking-[-0.02em]'} ${ink}`}>
              {t('orderNumber')} <span className={darkMode ? 'hp-hl-dark' : 'hp-hl'} dir="ltr">#{shortId(order)}</span>
            </h2>
            <p className={`flex items-center gap-2 text-sm font-extrabold uppercase ${statusTone(order.status, darkMode)}`}>
              <StatusIcon aria-hidden="true" className="h-5 w-5" />{statusText}
            </p>
          </div>
          {!isCancelled && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className={`text-xs font-extrabold uppercase ${muted}`}>{t('overallProgress')}</p>
                <p className={`text-xs font-extrabold tabular-nums ${ink}`} dir="ltr">{progressPct}%</p>
              </div>
              <div
                className={`h-4 overflow-hidden rounded-full border-2 border-[color:var(--ink)] ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-100'}`}
                role="progressbar" aria-label={t('overallProgress')} aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}
              >
                <div
                  className="h-full origin-left rounded-full bg-[color:var(--acc)] transition-transform duration-500 ease-out rtl:origin-right motion-reduce:transition-none"
                  style={{ transform: `scaleX(${progressPct / 100})` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const InfoPanel = memo(({ rows, status, statusText, darkMode, t }) => {
  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const muted = darkMode ? 'text-neutral-400' : 'text-gray-600';
  return (
    <aside className={`h-fit gap-5 p-5 lg:sticky lg:top-24 ${neoCard(darkMode, 'sm')}`}>
      <div className={`flex items-center gap-3 p-3 ${ROW_BOX} ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
        <span aria-hidden="true" className={`${ICON_BOX} h-12 w-12`}><FiBox className="h-6 w-6" /></span>
        <div className="min-w-0">
          <p className={`text-[11px] font-extrabold uppercase ${muted}`}>{t('liveTracking')}</p>
          <p className={`mt-0.5 truncate text-sm font-extrabold uppercase ${statusTone(status, darkMode)}`}>{statusText}</p>
        </div>
      </div>

      {rows.length > 0 && (
        <div>
          <h3 className={`mb-3 text-base font-extrabold uppercase ${ink}`}><span className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{t('orderDetails')}</span></h3>
          <ul className="space-y-3">
            {rows.map(({ icon: Icon, label, value }) => (
              <li key={label + value} className="flex items-start gap-3">
                <span aria-hidden="true" className={`${ICON_BOX} h-9 w-9`}><Icon className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className={`text-[11px] font-bold uppercase ${muted}`}>{label}</p>
                  <p className={`truncate text-sm font-extrabold ${ink}`}>{value}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`flex items-start gap-2.5 p-3 text-xs ${ROW_BOX} ${darkMode ? 'bg-[#1e1e1e] text-neutral-300' : 'bg-gray-50 text-gray-700'}`}>
        <FiShield aria-hidden="true" className={`mt-0.5 h-4 w-4 flex-shrink-0 ${darkMode ? 'text-[#39ff88]' : 'text-emerald-600'}`} />
        <p className="font-medium leading-relaxed"><span className={`font-extrabold ${ink}`}>{t('trackingHelp')}</span> {t('trackingHelpText')}</p>
      </div>
    </aside>
  );
});

export const CantFindCard = memo(({ t, darkMode = false }) => (
  <div className={`items-start gap-4 p-5 sm:flex-row sm:items-center ${neoCard(darkMode, 'sm')}`}>
    <span aria-hidden="true" className={`${ICON_BOX} h-11 w-11`}><FiHeadphones className="h-5 w-5" /></span>
    <div className="min-w-0 flex-1">
      <p className={`text-base font-extrabold uppercase ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{t('cantFindTitle')}</p>
      <p className={`mt-1 text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>{t('cantFindText')}</p>
    </div>
    <div className="flex w-full flex-wrap gap-3 pb-1 pe-1 sm:w-auto">
      <Link to="/support" className={`${neoBtn(darkMode, false)} flex-1 sm:flex-none`}><FiHeadphones aria-hidden="true" className="h-4 w-4" />{t('support')}</Link>
      <Link to="/chat" className={`${neoBtn(darkMode, true)} flex-1 sm:flex-none`}><FiMessageCircle aria-hidden="true" className="h-4 w-4" />{t('liveChat')}</Link>
    </div>
  </div>
));

const StateCard = memo(({ icon: Icon, title, text, darkMode, children }) => (
  <div className={`mx-auto max-w-md items-center px-6 py-10 text-center ${neoCard(darkMode, 'lg')}`}>
    {Icon ? (
      <span aria-hidden="true" className={`${ICON_BOX} mb-4 h-16 w-16 !rounded-xl`}><Icon className="h-8 w-8" /></span>
    ) : (
      <div aria-hidden="true" className="mb-3 h-40 w-40">
        <HeroArt type="track" darkMode={darkMode} />
      </div>
    )}
    <h2 className={`text-xl font-extrabold uppercase ${darkMode ? 'text-white' : 'text-emerald-950'}`}><span className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{title}</span></h2>
    {text && <p className={`mt-4 mb-6 text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>{text}</p>}
    <div className="pb-1 pe-1">{children}</div>
  </div>
));

const SKELETON_W = [[60, 40], [72, 52], [50, 34], [66, 46]];
const TrackSkeleton = memo(({ darkMode }) => {
  const bar = darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200/70';
  return (
    <div className="space-y-5" role="status" aria-busy="true">
      <div className={`h-12 animate-pulse rounded-2xl motion-reduce:animate-none ${bar}`} />
      {SKELETON_W.map(([a, b], i) => (
        <div key={i} className="flex items-center gap-4">
          <div className={`h-10 w-10 flex-shrink-0 animate-pulse rounded-lg motion-reduce:animate-none ${bar}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-4 animate-pulse rounded motion-reduce:animate-none ${bar}`} style={{ width: `${a}%` }} />
            <div className={`h-3 animate-pulse rounded motion-reduce:animate-none ${bar}`} style={{ width: `${b}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
});

const EMPTY_LIST = [];

const TrackContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const t = useCallback((k) => tr(language, k), [language]);
  const loc = LOCALES[language] || 'en-GB';
  const isAr = language === 'ar';
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
  const progressPct = isCancelled || currentIdx < 0 ? 0 : Math.min(100, Math.round((currentIdx / (STATUS_STEPS.length - 2)) * 100));

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

  const timestamps = useMemo(() => (order ? steps.map((s) => stepTimestamp(order, s.key, loc)) : EMPTY_LIST), [order, steps, loc]);
  const meta = useMemo(() => (order ? buildMeta(order, t, loc) : EMPTY_LIST), [order, t, loc]);
  const rows = useMemo(() => (order ? buildDetails(order, t, loc) : EMPTY_LIST), [order, t, loc]);
  const orderOptions = useMemo(
    () => orders.map((o) => ({ value: o.id, label: `${t('orderNumber')} #${shortId(o)} · ${statusLabel(o.status)}` })),
    [orders, t, statusLabel],
  );

  const ready = !!token && !isLoading && !isError && !!order;
  const ink = darkMode ? 'text-white' : 'text-emerald-950';

  let body;
  if (!token) {
    body = (
      <StateCard icon={FiLock} title={t('loginRequired')} text={t('loginTrack')} darkMode={darkMode}>
        <Link to="/login" className={neoBtn(darkMode, true)}><FiLock aria-hidden="true" className="h-4 w-4" />{t('goToLogin')}</Link>
      </StateCard>
    );
  } else if (isLoading) {
    body = <TrackSkeleton darkMode={darkMode} />;
  } else if (isError) {
    body = (
      <StateCard title={t('loadErrorTitle')} text={t('loadErrorText')} darkMode={darkMode}>
        <button type="button" onClick={() => refetch()} className={neoBtn(darkMode, true)}>
          <FiRefreshCw aria-hidden="true" className={`h-4 w-4 ${isFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />{t('tryAgain')}
        </button>
      </StateCard>
    );
  } else if (!order) {
    body = (
      <StateCard icon={FiShoppingBag} title={t('noOrders')} text={t('startShopping')} darkMode={darkMode}>
        <Link to="/devices" className={neoBtn(darkMode, true)}><FiShoppingBag aria-hidden="true" className="h-4 w-4" />{t('startShoppingButton')}</Link>
      </StateCard>
    );
  } else {
    body = (
      <div className="space-y-8">
        <div className="grid items-start gap-6 pb-2 pe-2 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
          <section aria-label={t('orderNumber')} className={`hp-rise min-w-0 gap-8 p-5 sm:p-8 ${neoCard(darkMode, 'lg')}`}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {meta.map((m) => <MetaTile key={m.label} {...m} darkMode={darkMode} />)}
            </div>

            <ol>
              {steps.map((step, i) => {
                const idx = STEP_INDEX[step.key];
                return (
                  <StepRow
                    key={step.key} step={step} darkMode={darkMode} t={t}
                    isLast={i === steps.length - 1}
                    isCompleted={!isCancelled && idx <= currentIdx}
                    isCurrent={idx === currentIdx}
                    isCancelledStep={isCancelled && step.key === 'CANCELLED'}
                    timestamp={timestamps[i]}
                  />
                );
              })}
            </ol>

            <div className="flex justify-center pb-1 pe-1">
              <Link to="/devices" className={neoBtn(darkMode, true)}><FiShoppingBag aria-hidden="true" className="h-4 w-4" />{t('exploreDevices')}</Link>
            </div>
          </section>

          <InfoPanel rows={rows} status={order.status} statusText={statusLabel(order.status)} darkMode={darkMode} t={t} />
        </div>

       
      </div>
    );
  }

  return (
    <div
      dir={languageDirection(language)}
      lang={language}
      className={`min-h-screen overflow-x-hidden ${isAr ? 'font-cairo' : 'font-jakarta'} ${darkMode ? `${DARK_PAGE} ${ink}` : 'bg-gray-50 text-gray-900'}`}
    >
      <Hero variant="track" darkMode={darkMode} />

      <section className={`hp-pattern ${darkMode ? 'hp-pattern-dark' : ''} py-10 sm:py-14 ${darkMode ? DARK_PAGE : 'bg-gray-50'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {ready && (
            <StatusStrip
              order={order} options={orderOptions} onSelect={setSelectedId}
              progressPct={progressPct} isCancelled={isCancelled} statusText={statusLabel(order.status)}
              darkMode={darkMode} isAr={isAr} t={t}
            />
          )}
          {body}
        </div>
      </section>
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