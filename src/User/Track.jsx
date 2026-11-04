import React, { useState, useEffect, useMemo, useCallback, useRef, useId, memo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import {
  FiPackage, FiCheckCircle, FiTruck, FiXCircle, FiClock, FiBox, FiShoppingBag, FiLock, FiCheck, FiChevronDown, FiChevronRight,
  FiCreditCard, FiMapPin, FiCalendar, FiHeadphones, FiMessageCircle, FiShield, FiRefreshCw, FiAlertCircle, FiCopy,
} from 'react-icons/fi';
import api from '../common/api/api';
import useAuthStore from '../common/store/Auth';
import queryClient from '../common/utils/queryClient';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';

const EMPTY_LIST = [];
const ORDERS_MAX = 200;
const ITEMS_MAX = 30;
const TOKEN_KEY = 'authToken';
const TOKEN_RE = /^[A-Za-z0-9._~+/=-]{10,4096}$/;

const shouldRetry = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const TRACK_TRANSLATIONS = {
  en: enTranslations.track,
  ar: arTranslations.track || arTranslations.hero?.track,
  fr: frTranslations.track || frTranslations.hero?.track,
};

const EXTRA_TEXT = {
  en: {
    trackOrder: 'Track your order', breadcrumbHome: 'Home', arrivingBy: 'Arriving by', trackingDetails: 'Tracking details',
    shipmentItems: 'Items in this order', shipmentDetails: 'Shipment details', orderSummary: 'Order summary', quantity: 'Qty',
    cancelledNote: 'This order has been cancelled. Contact support if you have any questions.', scrollProgress: 'Page progress',
    copyTracking: 'Copy tracking number', copied: 'Copied',
  },
  ar: {
    trackOrder: 'تتبع طلبك', breadcrumbHome: 'الرئيسية', arrivingBy: 'يصل بحلول', trackingDetails: 'تفاصيل التتبع',
    shipmentItems: 'المنتجات في هذا الطلب', shipmentDetails: 'تفاصيل الشحنة', orderSummary: 'ملخص الطلب', quantity: 'الكمية',
    cancelledNote: 'تم إلغاء هذا الطلب. تواصل مع الدعم إذا كان لديك أي استفسار.', scrollProgress: 'تقدم الصفحة',
    copyTracking: 'نسخ رقم التتبع', copied: 'تم النسخ',
  },
  fr: {
    trackOrder: 'Suivre votre commande', breadcrumbHome: 'Accueil', arrivingBy: 'Livraison prévue le', trackingDetails: 'Détails du suivi',
    shipmentItems: 'Articles de cette commande', shipmentDetails: "Détails de l'expédition", orderSummary: 'Récapitulatif', quantity: 'Qté',
    cancelledNote: "Cette commande a été annulée. Contactez le support si vous avez des questions.", scrollProgress: 'Progression de la page',
    copyTracking: 'Copier le numéro de suivi', copied: 'Copié',
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
const STATUS_SET = new Set(STATUS_STEPS.map((s) => s.key));
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const STAGES = [
  { key: 'placed', icon: FiClock, labelKey: 'orderPlaced', statuses: ['PENDING', 'CONFIRMED'] },
  { key: 'processing', icon: FiPackage, labelKey: 'processing', statuses: ['PROCESSING', 'FINISHPROCESSING'] },
  { key: 'shipped', icon: FiTruck, labelKey: 'outForDelivery', statuses: ['SHIPPED'] },
  { key: 'delivered', icon: FiCheckCircle, labelKey: 'delivered', statuses: ['DELIVERED'] },
];

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const PRESS = 'transition-[transform,box-shadow,background-color,color,border-color] duration-150 active:translate-y-0.5 active:[box-shadow:none] motion-reduce:transition-none';
const SHADOW = (n) => `[box-shadow:calc(var(--dx)*${n}px)_${n}px_0_0_var(--shd)]`;
const CARD = `rounded-2xl border-[3px] border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)] ${SHADOW(4)}`;
const CHIP = 'border-2 border-black bg-[#39ff88] text-emerald-950';
const NODE_IDLE = 'border-2 border-[color:var(--ln)] bg-[color:var(--sf2)] text-[color:var(--mu)]';
const NODE_BAD = 'border-2 border-black bg-rose-400 text-black';
const BTN_BASE = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] px-5 py-2.5 text-sm font-extrabold ${PRESS} ${FOCUS} disabled:cursor-not-allowed disabled:opacity-50`;
const BTN_PRIMARY = `${BTN_BASE} border-black bg-[#39ff88] text-emerald-950 ${SHADOW(3)} hover:bg-[#7dffb0]`;
const BTN_SECONDARY = `${BTN_BASE} border-[color:var(--ln)] bg-[color:var(--sf)] text-[color:var(--tx)] ${SHADOW(3)} hover:bg-[color:var(--sf2)]`;
const TEXT_LINK = `rounded-md hover:underline hover:decoration-2 hover:underline-offset-4 ${FOCUS}`;

const clean = (v, max = 200) => (typeof v === 'string'
  ? v.replace(/[\p{Cc}\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
  : '');

const safeText = (v, max = 200) => {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return clean(v, max);
};

const safeImg = (v) => {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  if (!s || s.length > 2048 || /[\x00-\x1f\\<>"'`]/.test(s) || s.includes('..') || s.startsWith('//')) return '';
  if (s.startsWith('/')) return s;
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
};

const safeKey = (v) => {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const s = String(v);
  return s && s.length <= 128 ? s : null;
};

const readLegacyToken = () => {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
    return typeof raw === 'string' && TOKEN_RE.test(raw) ? raw : null;
  } catch {
    return null;
  }
};

const normalizeAddress = (a) => {
  if (typeof a === 'string') return clean(a, 300) || null;
  if (!a || typeof a !== 'object' || Array.isArray(a)) return null;
  const street = clean(a.street, 160);
  const city = clean(a.city, 80);
  return street || city ? { street, city } : null;
};

const normalizeHistory = (h) => (Array.isArray(h)
  ? h.slice(0, 40).filter((x) => x && typeof x === 'object' && typeof x.status === 'string')
    .map((x) => ({ status: x.status.toUpperCase(), timestamp: typeof x.timestamp === 'string' || typeof x.timestamp === 'number' ? x.timestamp : null }))
  : EMPTY_LIST);

const normalizeOrder = (o) => {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const id = safeKey(o.id);
  if (!id) return null;
  const status = typeof o.status === 'string' && STATUS_SET.has(o.status.toUpperCase()) ? o.status.toUpperCase() : '';
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (BLOCKED_KEYS.has(k)) continue;
    if (typeof v === 'number' || typeof v === 'boolean' || v === null) out[k] = v;
    else if (typeof v === 'string') out[k] = clean(v, 300);
  }
  const rawItems = Array.isArray(o.items) ? o.items : Array.isArray(o.orderItems) ? o.orderItems : null;
  return {
    ...out,
    id,
    status,
    trackingNumber: safeText(o.trackingNumber, 64) || undefined,
    carrier: safeText(o.carrier, 60) || undefined,
    paymentMethod: safeText(o.paymentMethod ?? o.payment_method, 60) || undefined,
    shippingAddress: normalizeAddress(o.shippingAddress ?? o.address) || undefined,
    address: undefined,
    items: rawItems ? rawItems.slice(0, ITEMS_MAX) : undefined,
    orderItems: undefined,
    statusHistory: normalizeHistory(o.statusHistory),
  };
};

const prefersReducedMotion = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const useScrollProgress = (barRef) => {
  useEffect(() => {
    const bar = barRef.current;
    if (!bar || prefersReducedMotion()) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = document.documentElement;
      const limit = el.scrollHeight - el.clientHeight;
      bar.style.transform = `scaleX(${limit > 0 ? Math.min(1, Math.max(0, window.scrollY / limit)) : 0})`;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [barRef]);
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
const fmtMoney = (v, loc, currency) => (
  v === undefined || v === null || v === '' || Number.isNaN(Number(v)) ? null : `${currency} ${Number(v).toLocaleString(loc)}`
);
const addDays = (v, n) => { const d = v ? new Date(v) : new Date(); d.setDate(d.getDate() + n); return d; };
const shortId = (o) => String(o.id).slice(0, 8);

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
  { icon: FiPackage, label: t('trackingId'), value: o.trackingNumber ?? String(o.id).slice(0, 12) },
  { icon: FiTruck, label: t('carrier'), value: o.carrier ?? t('standardCourier') },
  { icon: FiCalendar, label: t('orderDate'), value: fmtDate(o.createdAt, loc) ?? '—' },
  { icon: FiClock, label: t('lastUpdated'), value: fmtDateTime(o.updatedAt, loc) ?? '—' },
];

const buildDetails = (o, t, loc) => {
  const count = Array.isArray(o.items) ? o.items.length : null;
  const total = fmtMoney(o.totalAmount ?? o.total ?? o.amount, loc, t('currency'));
  const payment = o.paymentMethod ?? null;
  const address = o.shippingAddress ?? null;
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

const buildItems = (o, loc, currency) => {
  const list = Array.isArray(o.items) ? o.items : EMPTY_LIST;
  const out = [];
  for (let i = 0; i < list.length && out.length < ITEMS_MAX; i += 1) {
    const it = list[i];
    if (!it || typeof it !== 'object') continue;
    const p = it.product && typeof it.product === 'object' ? it.product : {};
    const img = safeImg(it.imageUrl ?? p.imageUrl ?? '');
    const pid = safeKey(it.productId ?? p.id ?? null);
    const name = safeText(it.productName ?? it.name ?? p.name ?? '', 160);
    if (!name) continue;
    out.push({
      key: `${safeKey(it.id) ?? pid ?? 'i'}-${i}`,
      name,
      qty: Math.min(9999, Math.max(1, Math.floor(Number(it.quantity)) || 1)),
      price: fmtMoney(it.price ?? it.unitPrice ?? p.price, loc, currency),
      img,
      href: pid ? `/device/${encodeURIComponent(pid)}` : null,
    });
  }
  return out;
};

const HL_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")`;

const PAGE_CSS = `
@font-face{font-family:'Poppins Fallback';src:local('Arial'),local('Helvetica');size-adjust:112.6%;ascent-override:93.4%;descent-override:35.2%;line-gap-override:7.4%}
.tk{--bd:#e5e7eb;--sf:#ffffff;--sf2:#f3f4f6;--tx:#052e1e;--mu:rgba(5,46,30,.68);--acc:#059669;--ln:#000000;--shd:#000000;--pg:#ecfdf5;--ping:#059669;--hi:rgba(255,255,255,.8);--dx:1;background:var(--pg);color:var(--tx);color-scheme:light;font-family:'Poppins','Poppins Fallback',ui-sans-serif,system-ui,-apple-system,'Segoe UI','Cairo',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.tk[dir=rtl]{--dx:-1}
.tk-dark{--bd:rgba(255,255,255,.16);--sf:#1c1c1e;--sf2:#2a2a2e;--tx:#ffffff;--mu:rgba(255,255,255,.66);--acc:#39ff88;--ln:rgba(255,255,255,.16);--shd:#0b4a35;--pg:#141414;--ping:#39ff88;--hi:rgba(255,255,255,.08);color-scheme:dark}
.tk[lang=ar]{font-family:'Cairo','Poppins',ui-sans-serif,system-ui,sans-serif}
.tk[lang=ar] *{letter-spacing:0!important}
.tk button,.tk input{font-family:inherit}
.tk-hl{padding-bottom:.2em;background:${HL_URL} left bottom/100% .3em no-repeat;-webkit-box-decoration-break:clone;box-decoration-break:clone}
[dir="rtl"] .tk-hl{background-position:right bottom}
@keyframes tkShimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.tk-sk{position:relative;overflow:hidden}
.tk-sk::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,var(--hi),transparent);animation:tkShimmer 1.3s ease-in-out infinite}
[dir="rtl"] .tk-sk::after{animation-direction:reverse}
@keyframes tkPop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}
.tk-pop{animation:tkPop .12s cubic-bezier(.2,.8,.2,1) both;transform-origin:top}
@keyframes tkRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.tk-body>[data-tk-first]{animation:tkRise .35s cubic-bezier(.2,.8,.2,1) both}
@keyframes tkSeg{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.tk-seg{transform-origin:left;animation:tkSeg .5s ease-out both}
[dir="rtl"] .tk-seg{transform-origin:right}
@keyframes tkPing{0%{opacity:.7;transform:scale(1)}80%,100%{opacity:0;transform:scale(1.5)}}
.tk-live{position:relative}
.tk-live::after{content:"";position:absolute;inset:-3px;border-radius:9999px;border:2px solid var(--ping);pointer-events:none;animation:tkPing 2s ease-out infinite}
.tk-defer{content-visibility:auto;contain-intrinsic-size:auto 320px}
.tk-scroll{scrollbar-width:thin;scrollbar-color:var(--acc) transparent;overscroll-behavior:contain}
@media (prefers-reduced-motion:reduce){.tk-sk::after,.tk-pop,.tk-body>[data-tk-first],.tk-seg,.tk-live::after{animation:none}}
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

const CardTitle = memo(({ children, className = 'mb-5' }) => (
  <h3 className={`${className} text-sm font-extrabold tracking-wide rtl:tracking-normal`}>
    <span className="tk-hl">{children}</span>
  </h3>
));

const Dropdown = memo(({ value, onChange, options, ariaLabel }) => {
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
        className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-[3px] border-[color:var(--ln)] bg-[color:var(--sf)] px-4 text-start text-sm font-bold text-[color:var(--tx)] ${SHADOW(3)} ${PRESS} ${FOCUS} hover:bg-[color:var(--sf2)]`}
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
          className={`tk-pop tk-scroll absolute start-0 top-full z-30 mt-3 max-h-64 min-w-full overflow-y-auto p-1 ${CARD}`}
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
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  selected ? 'bg-[#39ff88] font-extrabold text-emerald-950' : i === active ? 'bg-[color:var(--sf2)] font-bold' : 'font-semibold'
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

const StatusPill = memo(({ status, text }) => {
  const Icon = STATUS_STEPS[STEP_INDEX[status]]?.icon || FiBox;
  const tone = status === 'DELIVERED'
    ? 'bg-black text-[#39ff88]'
    : status === 'CANCELLED'
      ? 'bg-rose-400 text-black'
      : 'bg-white text-emerald-950';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border-2 border-black px-3 py-1.5 text-xs font-extrabold ${tone}`}>
      <Icon aria-hidden="true" className="h-4 w-4" />{text}
    </span>
  );
});

const TrackingChip = memo(({ value, label, doneLabel }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch { }
  }, [value]);
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? doneLabel : `${label}: ${value}`}
      title={label}
      className={`mt-4 inline-flex min-h-10 max-w-full cursor-pointer items-center gap-2 rounded-lg border-2 border-[color:var(--ln)] bg-[color:var(--sf2)] px-3 text-xs font-bold ${PRESS} ${FOCUS} hover:border-black`}
    >
      <FiTruck aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-[color:var(--acc)]" />
      <span dir="ltr" className="min-w-0 truncate tabular-nums">{value}</span>
      <span aria-live="polite" className="flex flex-shrink-0 items-center gap-1 text-[color:var(--acc)]">
        {copied ? <FiCheck aria-hidden="true" className="h-4 w-4" strokeWidth={3} /> : <FiCopy aria-hidden="true" className="h-4 w-4" />}
        {copied && <span>{doneLabel}</span>}
      </span>
    </button>
  );
});

const Stepper = memo(({ stages, stageIdx, label }) => (
  <ol className="mt-8 flex" aria-label={label}>
    {stages.map((s, i) => {
      const done = i <= stageIdx;
      const current = i === stageIdx;
      const Icon = s.icon;
      return (
        <li key={s.key} aria-current={current ? 'step' : undefined} className="relative flex min-w-0 flex-1 flex-col items-center px-1 text-center">
          {i > 0 && (
            <span aria-hidden="true" className="absolute start-[-50%] top-[17px] h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--bd)]">
              {done && <span className="tk-seg block h-full w-full rounded-full bg-[#39ff88]" style={{ animationDelay: `${0.25 + i * 0.12}s` }} />}
            </span>
          )}
          <span className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${done ? CHIP : NODE_IDLE} ${current ? 'tk-live' : ''}`}>
            <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
          </span>
          <span className={`mt-2.5 text-xs font-extrabold sm:text-sm ${done ? '' : 'text-[color:var(--mu)]'}`}>{s.label}</span>
          {done && s.ts && <span className="mt-0.5 text-[11px] font-semibold leading-tight text-[color:var(--mu)]">{s.ts}</span>}
        </li>
      );
    })}
  </ol>
));

const SummaryCard = memo(({ order, headline, subText, stages, stageIdx, isCancelled, statusText, t }) => (
  <section data-tk-first aria-label={t('orderNumber')} className={`overflow-hidden ${CARD}`}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-black bg-[#39ff88] px-5 py-3 text-emerald-950 sm:px-8">
      <p className="text-sm font-semibold">
        {t('orderNumber')} <span dir="ltr" className="font-extrabold">#{shortId(order)}</span>
      </p>
      <StatusPill status={order.status} text={statusText} />
    </div>
    <div className="p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`text-2xl font-extrabold tracking-tight sm:text-3xl ${isCancelled ? 'text-rose-500' : ''}`}>{headline}</h2>
          {subText && <p className="mt-1.5 text-sm font-medium text-[color:var(--mu)]">{subText}</p>}
        </div>
        {!isCancelled && stageIdx >= 0 && (
          <span dir="ltr" className={`rounded-full px-3 py-1 text-xs font-extrabold tabular-nums ${CHIP}`}>{stageIdx + 1}/{stages.length}</span>
        )}
      </div>
      {!isCancelled && order.trackingNumber && (
        <TrackingChip value={order.trackingNumber} label={t('copyTracking')} doneLabel={t('copied')} />
      )}
      {isCancelled ? (
        <p className="mt-6 flex items-start gap-3 rounded-xl border-2 border-rose-500 bg-rose-500/10 p-4 text-sm font-bold text-rose-500">
          <FiXCircle aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0" />{t('cancelledNote')}
        </p>
      ) : (
        <Stepper stages={stages} stageIdx={stageIdx} label={t('overallProgress')} />
      )}
    </div>
  </section>
));

const StepRow = memo(({ step, done, current, cancelledStep, last, timestamp, t }) => {
  const Icon = step.icon;
  const circle = cancelledStep ? NODE_BAD : done ? CHIP : NODE_IDLE;
  return (
    <li className={`relative flex gap-4 ${last ? '' : 'pb-6'}`} aria-current={current && !cancelledStep ? 'step' : undefined}>
      {!last && (
        <span aria-hidden="true" className={`absolute bottom-0 start-[16px] top-9 w-[3px] rounded-full ${done && !current ? 'bg-[#39ff88]' : 'bg-[color:var(--bd)]'}`} />
      )}
      <span className={`relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${circle}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className={`text-sm font-extrabold ${cancelledStep ? 'text-rose-500' : done ? '' : 'text-[color:var(--mu)]'}`}>{step.label}</p>
          {timestamp && (done || cancelledStep) && <span className="text-xs font-semibold text-[color:var(--mu)]">{timestamp}</span>}
        </div>
        <p className="mt-0.5 text-xs text-[color:var(--mu)]">{step.sub}</p>
        {current && !cancelledStep && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-extrabold text-[color:var(--acc)]">
            <FiChevronRight aria-hidden="true" className="h-3.5 w-3.5 rtl:rotate-180" />{t('currentStatus')}
          </p>
        )}
      </div>
    </li>
  );
});

const ItemsCard = memo(({ items, t }) => (
  <section aria-label={t('shipmentItems')} className={`tk-defer p-5 sm:p-6 ${CARD}`}>
    <CardTitle>{t('shipmentItems')}</CardTitle>
    <ul className="divide-y-2 divide-[color:var(--bd)]">
      {items.map((it) => {
        const thumb = (
          <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-[color:var(--ln)] bg-[color:var(--sf2)]">
            {it.img
              ? <img src={it.img} alt="" width={64} height={64} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-contain p-1" />
              : <FiBox aria-hidden="true" className="h-6 w-6 text-[color:var(--acc)]" />}
          </span>
        );
        const name = <span className="line-clamp-2 text-sm font-bold">{it.name}</span>;
        return (
          <li key={it.key} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
            {it.href ? <Link to={it.href} tabIndex={-1} aria-hidden="true">{thumb}</Link> : thumb}
            <div className="min-w-0 flex-1">
              {it.href ? <Link to={it.href} className={TEXT_LINK}>{name}</Link> : name}
              <p className="mt-1 text-xs font-semibold text-[color:var(--mu)]">{t('quantity')}: <span dir="ltr" className="font-extrabold tabular-nums">{it.qty}</span></p>
            </div>
            {it.price && <p className="flex-shrink-0 text-sm font-extrabold tabular-nums" dir="ltr">{it.price}</p>}
          </li>
        );
      })}
    </ul>
  </section>
));

const DetailCard = memo(({ title, rows }) => (rows.length ? (
  <section aria-label={title} className={`p-5 ${CARD}`}>
    <CardTitle className="mb-4">{title}</CardTitle>
    <dl className="space-y-4">
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-start gap-3">
          <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${CHIP}`}>
            <Icon aria-hidden="true" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <dt className="text-xs font-semibold text-[color:var(--mu)]">{label}</dt>
            <dd className="break-words text-sm font-bold">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  </section>
) : null));

const HelpNote = memo(({ t }) => (
  <div className={`flex items-start gap-3 p-4 text-xs text-[color:var(--mu)] ${CARD}`}>
    <FiShield aria-hidden="true" className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--acc)]" />
    <p className="leading-relaxed"><span className="font-extrabold text-[color:var(--tx)]">{t('trackingHelp')}</span> {t('trackingHelpText')}</p>
  </div>
));

export const CantFindCard = memo(({ t, darkMode = false }) => (
  <div dir="auto" className={`tk ${darkMode ? 'tk-dark' : 'tk-light'} flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center ${CARD}`}>
    <span aria-hidden="true" className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${CHIP}`}><FiHeadphones className="h-5 w-5" /></span>
    <div className="min-w-0 flex-1">
      <p className="text-base font-extrabold">{t('cantFindTitle')}</p>
      <p className="mt-1 text-sm text-[color:var(--mu)]">{t('cantFindText')}</p>
    </div>
    <div className="flex w-full flex-wrap gap-3 sm:w-auto">
      <Link to="/support" className={`${BTN_SECONDARY} flex-1 sm:flex-none`}><FiHeadphones aria-hidden="true" className="h-4 w-4" />{t('support')}</Link>
      <Link to="/chat" className={`${BTN_PRIMARY} flex-1 sm:flex-none`}><FiMessageCircle aria-hidden="true" className="h-4 w-4" />{t('liveChat')}</Link>
    </div>
  </div>
));

const StateCard = memo(({ icon: Icon = FiAlertCircle, title, text, children }) => (
  <div data-tk-first className={`mx-auto flex max-w-md flex-col items-center px-6 py-10 text-center ${CARD}`}>
    <span aria-hidden="true" className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${CHIP}`}><Icon className="h-8 w-8" /></span>
    <h2 className="text-xl font-extrabold tracking-tight rtl:tracking-normal"><span className="tk-hl">{title}</span></h2>
    {text && <p className="mb-6 mt-4 text-sm font-medium text-[color:var(--mu)]">{text}</p>}
    {children}
  </div>
));

const SK = 'tk-sk rounded-lg bg-[color:var(--bd)]';
const SK_STAGES = [0, 1, 2, 3];
const SK_ROWS = [0, 1, 2, 3, 4];
const SK_ITEMS = [0, 1];
const TrackSkeleton = memo(({ label }) => (
  <div role="status" aria-busy="true" aria-label={label} className="space-y-6">
    <div className={`overflow-hidden ${CARD}`}>
      <div className="h-[52px] border-b-[3px] border-black bg-[#39ff88]" />
      <div className="p-5 sm:p-8">
        <div className="space-y-3">
          <div className={`${SK} h-8 w-72 max-w-full`} />
          <div className={`${SK} h-4 w-48`} />
        </div>
        <div className="mt-8 flex">
          {SK_STAGES.map((i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className={`${SK} h-10 w-10 !rounded-full`} />
              <div className={`${SK} h-3 w-16`} />
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0 space-y-6">
        <div className={`space-y-6 p-5 sm:p-6 ${CARD}`}>
          <div className={`${SK} h-5 w-40`} />
          {SK_ROWS.map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`${SK} h-9 w-9 flex-shrink-0 !rounded-full`} />
              <div className="flex-1 space-y-2">
                <div className={`${SK} h-4 w-1/2`} />
                <div className={`${SK} h-3 w-1/3`} />
              </div>
            </div>
          ))}
        </div>
        <div className={`space-y-4 p-5 sm:p-6 ${CARD}`}>
          <div className={`${SK} h-5 w-44`} />
          {SK_ITEMS.map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`${SK} h-16 w-16 flex-shrink-0 !rounded-xl`} />
              <div className="flex-1 space-y-2">
                <div className={`${SK} h-4 w-2/3`} />
                <div className={`${SK} h-3 w-16`} />
              </div>
              <div className={`${SK} h-4 w-20`} />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        {SK_ITEMS.map((i) => (
          <div key={i} className={`space-y-3 p-5 ${CARD}`}>
            <div className={`${SK} h-5 w-32`} />
            <div className={`${SK} h-10 w-full`} />
            <div className={`${SK} h-10 w-full`} />
          </div>
        ))}
      </div>
    </div>
  </div>
));

const TrackContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const t = useCallback((k) => tr(language, k), [language]);
  const loc = LOCALES[language] || 'en-GB';
  const storeToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const [legacyToken] = useState(readLegacyToken);
  const token = storeToken || legacyToken;
  const [selectedId, setSelectedId] = useState(null);
  const barRef = useRef(null);

  useScrollProgress(barRef);
  useEffect(() => { document.title = `${t('trackOrder')} | Tech-Restore`; }, [t]);

  const { data: orders = EMPTY_LIST, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['track_orders', userId ?? 'me'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/users/orders', { signal, headers: { Authorization: `Bearer ${token}` } });
      const list = res.data?.content || res.data || [];
      if (!Array.isArray(list)) return [];
      const out = [];
      for (const item of list) {
        if (out.length >= ORDERS_MAX) break;
        const o = normalizeOrder(item);
        if (o) out.push(o);
      }
      return out;
    },
    enabled: !!token,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: shouldRetry,
  });

  const order = useMemo(() => orders.find((o) => o.id === selectedId) || orders[0] || null, [orders, selectedId]);
  const isCancelled = order?.status === 'CANCELLED';
  const currentIdx = STEP_INDEX[order?.status] ?? -1;
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

  const bodyKind = !token ? 'login' : isLoading ? 'loading' : isError ? 'error' : !order ? 'empty' : `order-${order.id}`;

  let body;
  if (!token) {
    body = (
      <StateCard icon={FiLock} title={t('loginRequired')} text={t('loginTrack')}>
        <Link to="/login" className={BTN_PRIMARY}><FiLock aria-hidden="true" className="h-4 w-4" />{t('goToLogin')}</Link>
      </StateCard>
    );
  } else if (isLoading) {
    body = <TrackSkeleton label={t('loading')} />;
  } else if (isError) {
    body = (
      <StateCard title={t('loadErrorTitle')} text={t('loadErrorText')}>
        <button type="button" onClick={() => refetch()} className={BTN_PRIMARY}>
          <FiRefreshCw aria-hidden="true" className={`h-4 w-4 ${isFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />{t('tryAgain')}
        </button>
      </StateCard>
    );
  } else if (!order) {
    body = (
      <StateCard icon={FiShoppingBag} title={t('noOrders')} text={t('startShopping')}>
        <Link to="/devices" className={BTN_PRIMARY}><FiShoppingBag aria-hidden="true" className="h-4 w-4" />{t('startShoppingButton')}</Link>
      </StateCard>
    );
  } else {
    body = (
      <div data-tk-first className="space-y-6">
        <SummaryCard
          order={order} headline={headline} subText={subText} stages={stages} stageIdx={stageIdx}
          isCancelled={isCancelled} statusText={statusLabel(order.status)} t={t}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0 space-y-6">
            <section aria-label={t('trackingDetails')} className={`p-5 sm:p-6 ${CARD}`}>
              <CardTitle>{t('trackingDetails')}</CardTitle>
              <ol>
                {steps.map((step, i) => {
                  const idx = STEP_INDEX[step.key];
                  return (
                    <StepRow
                      key={step.key} step={step} t={t}
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

            {items.length > 0 && <ItemsCard items={items} t={t} />}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-32">
            <DetailCard title={t('shipmentDetails')} rows={meta} />
            <DetailCard title={t('orderSummary')} rows={rows} />
            <HelpNote t={t} />
          </aside>
        </div>

        <div className="flex justify-center">
          <Link to="/devices" className={BTN_SECONDARY}><FiShoppingBag aria-hidden="true" className="h-4 w-4" />{t('exploreDevices')}</Link>
        </div>
      </div>
    );
  }

  const showSelector = !!token && !isLoading && !isError && orders.length > 1 && !!order;

  return (
    <div
      dir={languageDirection(language)}
      lang={language}
      className={`tk min-h-screen [overflow-x:clip] ${darkMode ? 'tk-dark' : 'tk-light'}`}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[1200] h-1">
        <div ref={barRef} className="h-full origin-left bg-[#39ff88] rtl:origin-right" style={{ transform: 'scaleX(0)' }} />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-36 sm:px-6 md:pb-16 md:pt-32 lg:px-8">
        <nav aria-label={t('trackOrder')} className="flex items-center gap-1.5 text-xs font-bold sm:text-sm">
          <Link to="/" className={TEXT_LINK}>{t('breadcrumbHome')}</Link>
          <FiChevronRight aria-hidden="true" className="h-3 w-3 flex-shrink-0 text-[color:var(--mu)] rtl:rotate-180" />
          <span className="text-[color:var(--mu)]" aria-current="page">{t('trackOrder')}</span>
        </nav>

        <div className="mb-8 mt-5 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight rtl:tracking-normal sm:text-3xl">
            <span className="tk-hl">{t('trackOrder')}</span>
          </h1>
          {showSelector && (
            <div className="w-full sm:w-80">
              <Dropdown ariaLabel={t('selectOrder')} value={order.id} onChange={setSelectedId} options={orderOptions} />
            </div>
          )}
        </div>

        <div key={bodyKind} className="tk-body">{body}</div>
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