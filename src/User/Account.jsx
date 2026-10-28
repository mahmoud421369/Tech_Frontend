import React, {
  useState, useEffect, useCallback, useMemo, useRef, useId, useTransition, useDeferredValue, memo, Suspense, lazy,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiUser, FiMapPin, FiBox, FiTool, FiEdit2, FiTrash2, FiMail, FiPhone, FiPlus, FiInfo, FiCalendar,
  FiDollarSign, FiHome, FiXCircle, FiZap, FiCheckCircle, FiCreditCard, FiTruck, FiCheck, FiShield,
  FiNavigation, FiList, FiBell, FiSearch, FiClock, FiExternalLink, FiPieChart, FiTrendingUp,
  FiSend, FiAward, FiCompass, FiGlobe, FiX, FiShoppingBag, FiCopy, FiChevronDown, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { RiLogoutBoxRLine, RiVerifiedBadgeLine } from 'react-icons/ri';
import { jwtDecode } from 'jwt-decode';
import api from '../common/api/api';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import { useRepairPayment, clearPending, loadPending } from '../common/utils/paymentStatus';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { LISTING_CSS, useLangFont } from '../components/user/ListingKit';
import { IsoIllustration } from '../components/user/IsoIllustrations';

const Hero = lazy(() => import('../components/user/Hero'));

const MapPicker = lazy(() => import('./AccountMap'));
const prefetchMap = () => import('./AccountMap');

const NB_FONT_STYLE = { fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" };
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

const NB_EXTRA_CSS = `
.nb-dark input{color-scheme:dark}
.nb-btn-d{background:#e11d48;color:#fff}
.nb-btn-o{background:#ea580c;color:#fff}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-opt{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:start;cursor:pointer}
.nb-opt-active{background:var(--nb-gray)}
.nb-opt[aria-selected=true]{background:var(--nb-btn);color:var(--nb-on)}
.nb-box{display:flex;align-items:center;justify-content:center;flex:none;width:20px;height:20px;border:2px solid var(--nb-line);background:var(--nb-card);color:var(--nb-on)}
`;

const NB_CSS = `
.nb{--nb-bg:#f3f4f6;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e5e7eb;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-dark .border-dotted,.nb-dark .nb-dot{border-color:#3f3f3f}
.nb-bg{background:var(--nb-bg)}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:5px 5px 0 var(--nb-shadow);transition:transform .15s ease,box-shadow .15s ease}
.nb-lift:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:52px;height:16px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.nb-squig path{stroke:var(--nb-accent)}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.nb-chip-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-flip{display:inline-block}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-dot{background:var(--nb-card);color:var(--nb-ink);border:2px dotted var(--nb-line)}
${NB_EXTRA_CSS}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn{transition:none}.anim-fade-up{animation:none!important}}
`;

const MODAL_MS = 150;
const MODAL_CSS = `
@keyframes mdlFadeIn{from{opacity:0}to{opacity:1}}
@keyframes mdlFadeOut{from{opacity:1}to{opacity:0}}
@keyframes mdlPopIn{from{opacity:0;transform:translate3d(0,14px,0) scale(.97)}to{opacity:1;transform:none}}
@keyframes mdlPopOut{from{opacity:1;transform:none}to{opacity:0;transform:translate3d(0,8px,0) scale(.98)}}
.mdl-overlay{animation:mdlFadeIn 140ms ease-out both}
.mdl-overlay.is-closing{animation:mdlFadeOut ${MODAL_MS}ms ease-in both}
.mdl-panel{animation:mdlPopIn 180ms cubic-bezier(.16,1,.3,1) both;will-change:transform,opacity}
.mdl-panel.is-closing{animation:mdlPopOut ${MODAL_MS}ms ease-in both}
@media (prefers-reduced-motion: reduce){.mdl-overlay,.mdl-panel{animation:none!important}}
`;
const STYLE_EL = <style>{`${UI3D_CSS}${LISTING_CSS}${NB_CSS}${MODAL_CSS}`}</style>;
const REPAIRS_STYLE_EL = <style>{`${NB_EXTRA_CSS}${MODAL_CSS}`}</style>;

const STAGGER = Array.from({ length: 9 }, (_, i) => ({ '--i': i }));

const shouldRetry = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: shouldRetry } } });
const LIVE_POLL_MS = 20_000;
const NOTIF_POLL_MS = 60_000;

const ORDER_LIVE_SECTIONS = new Set(['orders', 'analytics', 'addresses']);
const REPAIR_LIVE_SECTIONS = new Set(['repairs', 'analytics', 'addresses']);
const VALID_SECTIONS = new Set(['profile', 'addresses', 'orders', 'repairs', 'notifications', 'analytics', 'about']);

const ACCOUNT_TRANSLATIONS = { en: enTranslations.account, ar: arTranslations.account, fr: frTranslations.account };
const tr = (lang, key, fallback) => ACCOUNT_TRANSLATIONS[lang]?.[key] || ACCOUNT_TRANSLATIONS.en?.[key] || fallback || key;
const LANGUAGES = [['en', 'English'], ['ar', 'العربية'], ['fr', 'Français']];
const LANG_OPTIONS = LANGUAGES.map(([value, label]) => ({ value, label }));
const LANGUAGE_NAMES = Object.fromEntries(LANGUAGES);

const isEmpty = (v) => v == null || (typeof v === 'string' && v.trim() === '') || v === 0;
const validPrice = (v) => Number.isFinite(Number(v)) && Number(v) > 0 && !(typeof v === 'string' && v.trim() === '');

const phoneValidationError = (v) => {
  const raw = String(v ?? '').trim();
  if (!raw) return 'Phone number is required';
  const compact = raw.replace(/[\s\-()]/g, '');
  return /^\+?\d{10,15}$/.test(compact) ? '' : 'Enter a valid phone number (10–15 digits, e.g. +201001234567)';
};

const friendlyError = (err, fallback) => {
  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const raw = String(data.message || '');
  const code = String(data.error_code || data.code || '');

  if (/amount_cents|amount must|price must/i.test(raw)) return "This repair doesn't have a valid price yet. Please wait for the shop to set one.";
  if (/repair not found/i.test(raw)) return 'We could not find this repair request. Please refresh and try again.';
  if (/order not found/i.test(raw)) return 'We could not find this order. Please refresh and try again.';
  if (/payment not found/i.test(raw)) return 'We could not find this payment. Please refresh and try again.';
  if (/not a cash payment/i.test(raw)) return 'This payment was made by card, so it cannot be confirmed as a cash payment.';
  if (/no enum constant|paymentstatus|cannot be converted|invalid status/i.test(raw)) return 'The selected payment status is not valid. Please choose a valid option and try again.';
  if (/given id must not be null/i.test(raw)) return 'Some required details are missing. Please check the form and try again.';
  if (/address/i.test(raw) && /not found|not exist|not belong|does not belong|invalid|not allowed/i.test(raw)) return 'The selected delivery address is not valid. Please choose one of your saved addresses and try again.';
  if (/cart is empty|empty cart|cart cannot be empty/i.test(raw)) return 'Your cart is empty. Add at least one product before placing an order.';
  if (/insufficient|out of stock|not enough stock|available stock|exceeds?/i.test(raw)) return 'One of the products is out of stock or the quantity is higher than what is available. Please update your cart and try again.';
  if (/uuid|invalid id|invalid format/i.test(raw)) return 'We could not find this item. Please refresh and try again.';
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 404) return 'We could not find this item. Please refresh and try again.';
  if (/already completed/i.test(raw)) return 'This payment could not be started. Please refresh the page and check the request status.';
  if (/duplicate|paymob|unprocessable/i.test(raw) || status === 422) return 'A payment for this repair is already in progress. Please check your requests before trying again.';
  if (status === 403) return 'You are not allowed to perform this action.';
  if (status >= 500 || /RUNTIME_ERROR|RT_001/i.test(`${raw} ${code}`) || !raw) return fallback || 'Something went wrong. Please try again.';
  return raw;
};
const unwrap = (res) => { const d = res.data?.content ?? res.data ?? []; return Array.isArray(d) ? d : []; };
const dayOf = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); };

const SHORT_FMT = new Intl.DateTimeFormat('en-EG', { month: 'short', day: 'numeric', year: 'numeric' });
const FULL_FMT = new Intl.DateTimeFormat('en-EG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Cairo' });
const formatWith = (fmt) => (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? 'Invalid Date' : fmt.format(d); };
const fmtShort = formatWith(SHORT_FMT);
const fmtFull = formatWith(FULL_FMT);
const directionsUrl = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

const CACHE_PREFIX = 'acct:';
const readCache = (k) => { try { const v = sessionStorage.getItem(CACHE_PREFIX + k); return v ? JSON.parse(v) : undefined; } catch { return undefined; } };
const writeCache = (k, v) => { try { sessionStorage.setItem(CACHE_PREFIX + k, JSON.stringify(v)); } catch { } };
const clearCache = () => { try { Object.keys(sessionStorage).filter((k) => k.startsWith(CACHE_PREFIX)).forEach((k) => sessionStorage.removeItem(k)); } catch { } };

const useAcct = (key, path, token, { list = true, ...opts } = {}) => useQuery({
  queryKey: [key],
  queryFn: async ({ signal }) => {
    const res = await api.get(path, { headers: { Authorization: `Bearer ${token}` }, signal });
    const data = list ? unwrap(res) : res.data;
    writeCache(key, data);
    return data;
  },
  initialData: () => readCache(key),
  initialDataUpdatedAt: 0,
  enabled: !!token,
  ...opts,
});

const ORDER_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'FINISHPROCESSING', 'SHIPPED', 'DELIVERED'];
const REPAIR_STEPS = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'DEVICE_COLLECTED', 'REPAIRING', 'REPAIR_COMPLETED', 'DEVICE_DELIVERED'];
const ORDER_BAD = new Set(['CANCELLED']);
const REPAIR_BAD = new Set(['CANCELLED', 'FAILED', 'QUOTE_REJECTED']);
const DONE = new Set(['DELIVERED', 'DEVICE_DELIVERED', 'CANCELLED', 'FAILED', 'QUOTE_REJECTED']);
const isDone = (status) => DONE.has(String(status || '').toUpperCase());
const ORDER_STATUSES = [...ORDER_STEPS, 'CANCELLED'];
const REPAIR_STATUSES = [...REPAIR_STEPS.slice(0, 3), 'QUOTE_REJECTED', ...REPAIR_STEPS.slice(3), 'CANCELLED', 'FAILED'];

const addrKey = (v) => {
  const id = v && typeof v === 'object' ? v.id : v;
  return id == null || id === '' ? null : String(id);
};
const addressOf = (x) => addrKey(x.deliveryAddress ?? x.deliveryAddressId ?? x.addressId);

const progressOf = (steps, bad) => (status) => {
  if (bad.has(status)) return -1;
  const i = steps.indexOf(status);
  return i < 0 ? 0 : Math.round((i / (steps.length - 1)) * 100);
};
const orderProgress = progressOf(ORDER_STEPS, ORDER_BAD);
const repairProgress = progressOf(REPAIR_STEPS, REPAIR_BAD);

let swalPromise;
const loadSwal = () => (swalPromise ||= import('sweetalert2').then((m) => m.default));
const toast = async ({ icon = 'success', title, text, timer = 2500 }) => {
  const Swal = await loadSwal();
  Swal.fire({ toast: true, position: 'top-end', icon, title, text, timer, timerProgressBar: true, showConfirmButton: false });
};

const TILE_TONES = {
  em: 'bg-emerald-500 text-white', sky: 'bg-sky-500 text-white', vi: 'bg-violet-500 text-white',
  am: 'bg-amber-400 text-[#04261a]', ro: 'bg-rose-500 text-white', te: 'bg-teal-500 text-white',
};
const BLOB = { sky: 'bg-sky-400', vi: 'bg-violet-400', am: 'bg-amber-400', ro: 'bg-rose-400', em: 'bg-emerald-400', te: 'bg-teal-400' };

const IconTile = memo(({ Icon, tone = 'em', className = 'h-9 w-9', iconClassName = 'h-4 w-4' }) => (
  <span aria-hidden="true" className={`nb-line flex flex-shrink-0 items-center justify-center border-2 ${TILE_TONES[tone] || TILE_TONES.em} ${className}`}>
    <Icon className={iconClassName} />
  </span>
));

const BTN_TONES = { soft: '', danger: 'nb-btn-d', orange: 'nb-btn-o' };
const Btn = ({ tone, className = '', children, ...rest }) => (
  <button type="button" className={`nb-btn ${tone ? BTN_TONES[tone] : 'nb-btn-a'} ${className}`} {...rest}>{children}</button>
);

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

const SectionHead = memo(({ eyebrow, title, subtitle, action }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0 max-w-2xl">
      {eyebrow && <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />{eyebrow}</p>}
      <h1 className="mt-3 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl"><UnderlinedTitle text={title} /></h1>
      {subtitle && <p className="nb-muted mt-3 text-base">{subtitle}</p>}
    </div>
    {action}
  </header>
));

const TabTitle = ({ icon, tone = 'em', children, right }) => (
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
    <h2 className="flex items-center gap-3 text-xl font-extrabold uppercase sm:text-2xl">
      <IconTile Icon={icon} tone={tone} className="h-10 w-10" iconClassName="h-5 w-5" /> <span className="nb-ul">{children}</span>
    </h2>
    {right}
  </div>
);

const NbDropdown = memo(({ value, onChange, options, ariaLabel, className = '', align = 'start', placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const uid = useId();
  const listId = `${uid}-list`;
  const selectedIdx = options.findIndex((o) => o.value === value);
  const current = options[selectedIdx];

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setIsOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [isOpen]);

  useEffect(() => { if (isOpen) setActive(Math.max(0, selectedIdx)); }, [isOpen, selectedIdx]);
  useEffect(() => { if (isOpen) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' }); }, [isOpen, active]);

  const choose = (i) => {
    const o = options[i];
    if (o) onChange(o.value);
    setIsOpen(false);
    btnRef.current?.focus();
  };

  const onKeyDown = (e) => {
    const last = options.length - 1;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (!isOpen) setIsOpen(true); else setActive((i) => Math.min(i + 1, last)); break;
      case 'ArrowUp': e.preventDefault(); if (!isOpen) setIsOpen(true); else setActive((i) => Math.max(i - 1, 0)); break;
      case 'Home': if (isOpen) { e.preventDefault(); setActive(0); } break;
      case 'End': if (isOpen) { e.preventDefault(); setActive(last); } break;
      case 'Enter': case ' ': e.preventDefault(); if (isOpen) choose(active); else setIsOpen(true); break;
      case 'Escape': if (isOpen) { e.preventDefault(); e.stopPropagation(); setIsOpen(false); } break;
      case 'Tab': setIsOpen(false); break;
      default:
    }
  };

  return (
    <div ref={rootRef} className={`relative ${isOpen ? 'z-30' : ''} ${className}`}>
      <button
        ref={btnRef} type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={listId}
        aria-activedescendant={isOpen ? `${uid}-o${active}` : undefined}
        onClick={() => setIsOpen((o) => !o)} onKeyDown={onKeyDown}
        className="nb-field flex h-10 w-full items-center justify-between gap-2 ps-3 pe-3 text-start text-xs font-bold uppercase"
      >
        <span className={`truncate ${current ? '' : 'opacity-60'}`}>{current ? current.label : placeholder}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul
          ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} tabIndex={-1}
          className={`nb-menu absolute top-full z-30 mt-2 max-h-64 min-w-full overflow-y-auto overscroll-contain py-1 ${align === 'end' ? 'end-0' : 'start-0'}`}
        >
          {options.map((o, i) => (
            <li
              key={o.value} id={`${uid}-o${i}`} role="option" aria-selected={o.value === value}
              onPointerEnter={() => setActive(i)} onClick={() => choose(i)}
              className={`nb-opt whitespace-nowrap ${i === active ? 'nb-opt-active' : ''}`}
            >
              <span>{o.label}</span>
              {o.value === value && <FiCheck aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={3} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

const TextField = memo(({ label, icon: Icon, as: Tag = 'input', className = '', ...rest }) => {
  const id = useId();
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-extrabold uppercase">{label}{rest.required && <span className="text-rose-500"> *</span>}</label>
      <div className="nb-field flex items-start gap-2 px-3 py-2.5">
        {Icon && <Icon aria-hidden="true" className="nb-ic mt-0.5 h-4 w-4 flex-shrink-0" />}
        <Tag id={id} {...rest} className="min-w-0 flex-1 resize-none bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60" />
      </div>
    </div>
  );
});

const DateField = memo(({ className = '', ...rest }) => (
  <label className={`nb-field flex h-10 items-center gap-2 px-3 ${className}`}>
    <FiCalendar aria-hidden="true" className="nb-ic h-4 w-4 flex-shrink-0" />
    <input type="date" {...rest} className="min-w-0 flex-1 bg-transparent text-xs font-bold uppercase outline-none" />
  </label>
));

const ProgressBar = memo(({ progress, label }) => {
  const bad = progress < 0;
  const pct = bad ? 100 : progress;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase">
        <span className="truncate">{label}</span>
        {!bad && <span dir="ltr" className="tabular-nums">{pct}%</span>}
      </div>
      <div className="nb-gray nb-line h-3 border-2">
        <div className={`h-full transition-[width] duration-500 motion-reduce:transition-none ${bad ? 'bg-rose-500' : 'bg-[color:var(--nb-accent)]'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
});

const InfoRow = memo(({ icon: Icon, children }) => (
  <p className="flex min-w-0 items-start gap-1.5 text-xs leading-snug">
    <Icon aria-hidden="true" className="nb-ic mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
    <span className="min-w-0 break-words">{children}</span>
  </p>
));

const EMPTY_ICONS = { box: FiBox, wrench: FiTool, pin: FiMapPin, bell: FiBell, chart: FiPieChart };
const EmptyState = memo(({ kind, title, subtitle }) => (
  <div className="nb-dot flex flex-col items-center gap-3 px-4 py-14 text-center">
    <IconTile Icon={EMPTY_ICONS[kind] || FiInfo} tone="em" className="h-16 w-16" iconClassName="h-8 w-8" />
    <p className="text-lg font-extrabold uppercase">{title}</p>
    {subtitle && <p className="nb-muted max-w-sm text-sm">{subtitle}</p>}
  </div>
));

const pageWindow = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, cur - 1, cur, cur + 1]);
  if (cur <= 3) [2, 3, 4].forEach((x) => set.add(x));
  if (cur >= total - 2) [total - 1, total - 2, total - 3].forEach((x) => set.add(x));
  const nums = [...set].filter((x) => x >= 1 && x <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((x, i) => { if (i && x - nums[i - 1] > 1) out.push(`gap-${x}`); out.push(x); });
  return out;
};

const Pagination = memo(({ page, total, onChange, t }) => {
  if (total <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2 pt-8">
      <button type="button" className="nb-btn h-10 w-10" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage', 'Previous page')}>
        <FiChevronLeft className="nb-flip h-4 w-4" />
      </button>
      {pageWindow(page, total).map((x) => (typeof x === 'number' ? (
        <button key={x} type="button" onClick={() => onChange(x)} aria-label={`${t('page', 'Page')} ${x}`} aria-current={x === page ? 'page' : undefined}
          className={`nb-btn h-10 min-w-[2.5rem] px-2 text-sm tabular-nums ${x === page ? 'nb-btn-on' : ''}`}>{x}</button>
      ) : <span key={x} aria-hidden="true" className="px-1 font-extrabold">…</span>))}
      <button type="button" className="nb-btn h-10 w-10" disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={t('nextPage', 'Next page')}>
        <FiChevronRight className="nb-flip h-4 w-4" />
      </button>
    </nav>
  );
});

const TONE = {
  good: '!bg-emerald-600 !text-white', bad: '!bg-rose-600 !text-white', info: '!bg-sky-600 !text-white',
  warn: '!bg-amber-400 !text-[#04261a]', violet: '!bg-violet-600 !text-white', teal: '!bg-teal-600 !text-white',
};
const TONES = {
  order: { DELIVERED: 'good', CANCELLED: 'bad', CONFIRMED: 'info', SHIPPED: 'violet', PROCESSING: 'teal', FINISHPROCESSING: 'teal' },
  repair: { DEVICE_DELIVERED: 'good', CANCELLED: 'bad', FAILED: 'bad', QUOTE_REJECTED: 'bad', QUOTE_APPROVED: 'good', QUOTE_SENT: 'violet', REPAIRING: 'teal', REPAIR_COMPLETED: 'teal', DEVICE_COLLECTED: 'info' },
};
const StatusBadge = memo(({ status, type = 'order', t }) => (
  <span className={`nb-chip flex-shrink-0 ${TONE[TONES[type][status]] || TONE.warn}`}>{t(`status_${status}`)}</span>
));

const SKELETON_ROWS = [0, 1, 2];
const SkeletonList = () => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" role="status">
    {SKELETON_ROWS.map((i) => <div key={i} className="nb-gray nb-line h-52 animate-pulse border-2 motion-reduce:animate-none" />)}
  </div>
);

const CardShell = ({ index, children }) => (
  <article style={STAGGER[Math.min(index, 8)]} className="anim-fade-up nb-card nb-lift flex h-full flex-col gap-3 p-3.5">
    {children}
  </article>
);

const Stat = memo(({ label, value, surface }) => (
  <div className={`nb-line min-w-0 border-2 px-2.5 py-1.5 ${surface === 'plain' ? 'bg-[color:var(--nb-card)]' : 'nb-gray'}`}>
    <p className="nb-muted text-[9px] font-extrabold uppercase tracking-widest">{label}</p>
    <p className="truncate text-sm font-bold">{value}</p>
  </div>
));

const Price = memo(({ value }) => (
  <p className="text-xl font-extrabold tabular-nums">{value} <span className="nb-muted text-xs font-bold">EGP</span></p>
));

const CARDS_PER_PAGE = 6;
const CARDS_GRID_CLS = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3';

const useListView = (items, { match, price, ipp = 6 }) => {
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const term = useDeferredValue(search).trim().toLowerCase();

  const filtered = useMemo(() => {
    const list = items.filter((x) => (!status || x.status === status) && (!date || dayOf(x.createdAt) === date) && (!term || match(x, term)));
    const n = (x) => Number(x[price]) || 0;
    const ts = (x) => Date.parse(x.createdAt) || 0;
    return list.sort((a, b) => (sort === 'oldest' ? ts(a) - ts(b) : sort === 'price_desc' ? n(b) - n(a) : sort === 'price_asc' ? n(a) - n(b) : ts(b) - ts(a)));
  }, [items, status, date, term, sort, match, price]);

  useEffect(() => { setPage(1); }, [status, date, term, sort]);
  const total = Math.max(1, Math.ceil(filtered.length / ipp));
  const current = Math.min(page, total);
  const pageItems = useMemo(() => filtered.slice((current - 1) * ipp, current * ipp), [filtered, current, ipp]);
  const active = !!(status || date || search || sort !== 'newest');
  const reset = useCallback(() => { setStatus(''); setDate(''); setSearch(''); setSort('newest'); }, []);
  return { status, setStatus, date, setDate, search, setSearch, sort, setSort, page: current, setPage, total, filtered, pageItems, active, reset };
};

const FilterBar = memo(({ view, statuses, t }) => {
  const { status, setStatus, date, setDate, search, setSearch, sort, setSort, active, reset, filtered } = view;
  const statusOptions = useMemo(() => [{ value: '', label: t('allStatuses') }, ...statuses.map((s) => ({ value: s, label: t(`status_${s}`) }))], [statuses, t]);
  const sortOptions = useMemo(() => [
    { value: 'newest', label: t('newestFirst') }, { value: 'oldest', label: t('oldestFirst') },
    { value: 'price_desc', label: t('highestPrice') }, { value: 'price_asc', label: t('lowestPrice') },
  ], [t]);
  return (
    <div className="nb-card mb-6 flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="nb-field flex h-10 min-w-[150px] flex-1 items-center gap-2 px-3">
          <FiSearch aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
          <input type="search" value={search} maxLength={60} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} aria-label={t('search')}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60" />
        </div>
        <NbDropdown value={status} onChange={setStatus} options={statusOptions} ariaLabel={t('allStatuses')} className="w-full sm:w-48" />
        <NbDropdown value={sort} onChange={setSort} options={sortOptions} ariaLabel={t('sortBy')} className="w-full sm:w-48" />
        <DateField value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" className="w-full sm:w-44" />
        {active && <Btn tone="soft" onClick={reset} className="h-10 px-3 text-xs uppercase"><FiX className="h-3.5 w-3.5" /> {t('clear')}</Btn>}
      </div>
      <p className="nb-muted text-[11px] font-bold" aria-live="polite">{filtered.length} result{filtered.length === 1 ? '' : 's'}</p>
    </div>
  );
});

const OrderCard = memo(({ order, t, index, onDetails, onCancel }) => {
  const items = order.orderItems || [];
  const count = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0) || items.length;
  const canCancel = !isDone(order.status);
  return (
    <CardShell index={index}>
      <div className="flex items-center gap-2.5">
        <IconTile Icon={FiBox} tone="am" className="h-11 w-11" iconClassName="h-5 w-5" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[11px] font-extrabold uppercase tracking-widest">ORD #{order.id.slice(0, 6)}</p>
          {!isEmpty(order.createdAt) && <p className="nb-muted flex items-center gap-1 text-[11px] font-semibold"><FiCalendar className="h-3 w-3" />{fmtShort(order.createdAt)}</p>}
        </div>
        <StatusBadge status={order.status} t={t} />
      </div>
      <ProgressBar progress={orderProgress(order.status)} label={t(`status_${order.status}`)} />
      <div className="grid grid-cols-2 gap-2">
        <Stat label={t('items')} value={count} />
        <Stat label={t('payment')} value={isEmpty(order.paymentMethod) ? '—' : order.paymentMethod.replace('_', ' ')} />
      </div>
      {!isEmpty(order.totalPrice) && <Price value={order.totalPrice} />}
      <div className={`nb-line mt-auto grid gap-2 border-t-2 pt-3 ${canCancel ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <Btn tone="soft" onClick={() => onDetails(order)} className="py-2 text-xs uppercase"><FiInfo className="h-3.5 w-3.5" /> {t('details')}</Btn>
        {canCancel && <Btn tone="danger" onClick={() => onCancel(order.id)} className="py-2 text-xs uppercase"><FiXCircle className="h-3.5 w-3.5" /> {t('cancelOrder')}</Btn>}
      </div>
    </CardShell>
  );
});

const RepairCard = memo(({ req, t, index, awaitingPayment, onDetails, onEdit, onAccept, onConfirm, onCancel, onPay }) => {
  const hasPrice = !isEmpty(req.price);
  const canAccept = validPrice(req.price);
  const canCancel = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_APPROVED'].includes(req.status);
  const needsConfirm = req.status === 'QUOTE_APPROVED' && !awaitingPayment;
  return (
    <CardShell index={index}>
      <div className="flex items-center gap-2.5">
        <IconTile Icon={FiTool} tone="vi" className="h-11 w-11" iconClassName="h-5 w-5" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[11px] font-extrabold uppercase tracking-widest">REQ #{req.id.slice(0, 6)}</p>
          <p className="truncate text-sm font-bold">{req.shopName}</p>
        </div>
        <StatusBadge status={req.status} type="repair" t={t} />
      </div>
      <ProgressBar progress={repairProgress(req.status)} label={t(`status_${req.status}`)} />
      {awaitingPayment && <span className="nb-chip w-fit !bg-amber-400 !text-[#04261a]"><FiClock className="h-3 w-3" /> Awaiting payment</span>}
      {!isEmpty(req.description) && <p className="line-clamp-2 text-xs leading-relaxed opacity-90">{req.description}</p>}
      {hasPrice && <Price value={req.price} />}
      <div className="nb-line mt-auto grid grid-cols-2 gap-2 border-t-2 pt-3">
        <Btn tone="soft" onClick={() => onDetails(req.id)} className="py-2 text-xs uppercase"><FiInfo className="h-3.5 w-3.5" /> {t('details')}</Btn>
        <Btn tone="soft" onClick={() => onEdit(req)} className="py-2 text-xs uppercase"><FiEdit2 className="h-3.5 w-3.5" /> {t('edit')}</Btn>
        {awaitingPayment && <Btn onClick={onPay} className="col-span-2 py-2 text-xs uppercase"><FiCreditCard className="h-3.5 w-3.5" /> Complete payment</Btn>}
        {req.status === 'QUOTE_SENT' && canAccept && <Btn onClick={() => onAccept(req)} className="col-span-2 py-2 text-xs uppercase"><FiCheckCircle className="h-3.5 w-3.5" /> {t('acceptQuote')}</Btn>}
        {needsConfirm && <Btn tone="orange" onClick={() => onConfirm(req)} className="col-span-2 py-2 text-xs uppercase"><FiCheckCircle className="h-3.5 w-3.5" /> Confirm repair</Btn>}
        {canCancel && <Btn tone="danger" onClick={() => onCancel(req.id)} className="col-span-2 py-2 text-xs uppercase"><FiXCircle className="h-3.5 w-3.5" /> {t('cancelRequest')}</Btn>}
      </div>
    </CardShell>
  );
});

const OrdersTab = memo(({ orders, onDetails, onCancel, t }) => {
  const match = useCallback((o, term) => o.id?.toLowerCase().includes(term), []);
  const view = useListView(orders, { match, price: 'totalPrice', ipp: CARDS_PER_PAGE });
  return (
    <>
      <TabTitle icon={FiBox} tone="am">{t('orders')}</TabTitle>
      <FilterBar view={view} statuses={ORDER_STATUSES} t={t} />
      {view.filtered.length === 0 ? (
        <EmptyState kind="box" title={t('noOrders')} subtitle={t('ordersHint')} />
      ) : (
        <>
          <div className={CARDS_GRID_CLS}>
            {view.pageItems.map((o, i) => <OrderCard key={o.id} order={o} index={i} t={t} onDetails={onDetails} onCancel={onCancel} />)}
          </div>
          <Pagination page={view.page} total={view.total} onChange={view.setPage} t={t} />
        </>
      )}
    </>
  );
});

const RepairsTab = memo(({ repairs, payingId, onDetails, onEdit, onAccept, onConfirm, onCancel, onPay, t }) => {
  const match = useCallback((r, term) => `${r.shopName || ''} ${r.description || ''} ${r.id || ''}`.toLowerCase().includes(term), []);
  const view = useListView(repairs, { match, price: 'price', ipp: CARDS_PER_PAGE });
  return (
    <>
      <TabTitle icon={FiTool} tone="vi">{t('repairs')}</TabTitle>
      <FilterBar view={view} statuses={REPAIR_STATUSES} t={t} />
      {view.filtered.length === 0 ? (
        <EmptyState kind="wrench" title={t('noRepairs')} subtitle={t('repairsHint')} />
      ) : (
        <>
          <div className={CARDS_GRID_CLS}>
            {view.pageItems.map((r, i) => (
              <RepairCard key={r.id} req={r} index={i} t={t} awaitingPayment={payingId === r.id}
                onDetails={onDetails} onEdit={onEdit} onAccept={onAccept} onConfirm={onConfirm} onCancel={onCancel} onPay={onPay} />
            ))}
          </div>
          <Pagination page={view.page} total={view.total} onChange={view.setPage} t={t} />
        </>
      )}
    </>
  );
});

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const ModalFrame = ({ onClose, size = 'sm:max-w-lg', label, role = 'dialog', backdropClose = true, closeRef, children }) => {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const timer = useRef(null);
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const close = useCallback((after) => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const done = typeof after === 'function' ? after : () => onCloseRef.current?.();
    timer.current = setTimeout(done, reducedMotion() ? 0 : MODAL_MS);
  }, []);

  useEffect(() => { if (closeRef) closeRef.current = close; }, [closeRef, close]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [close]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className={`mdl-overlay ${closing ? 'is-closing' : ''} absolute inset-0 bg-black/60`} onClick={backdropClose ? close : undefined} aria-hidden="true" />
      <div ref={panelRef} tabIndex={-1} role={role} aria-modal="true" aria-label={label}
        className={`nb-card mdl-panel ${closing ? 'is-closing' : ''} relative flex max-h-[92vh] w-full flex-col overflow-hidden outline-none ${size}`}>
        {typeof children === 'function' ? children(close) : children}
      </div>
    </div>
  );
};

const Sheet = ({ onClose, icon, tone = 'em', title, subtitle, size, footer, backdropClose, closeRef, children }) => (
  <ModalFrame onClose={onClose} size={size} label={title} backdropClose={backdropClose} closeRef={closeRef}>
    {(close) => (
      <>
        <header className="nb-gray nb-line flex flex-shrink-0 items-center gap-3 border-b-2 px-4 py-3.5 sm:px-5">
          <IconTile Icon={icon} tone={tone} className="h-10 w-10" iconClassName="h-5 w-5" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-extrabold uppercase"><span className="nb-ul">{title}</span></h2>
            {subtitle && <p className="nb-muted mt-1 truncate text-[11px] font-bold">{subtitle}</p>}
          </div>
          <button type="button" onClick={close} aria-label="Close" className="nb-btn h-9 w-9 flex-shrink-0"><FiX className="h-4 w-4" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {typeof children === 'function' ? children(close) : children}
        </div>
        {footer && (
          <footer className="nb-line nb-gray flex-shrink-0 border-t-2 px-4 py-3.5 sm:px-5">
            {typeof footer === 'function' ? footer(close) : footer}
          </footer>
        )}
      </>
    )}
  </ModalFrame>
);

const Section = memo(({ icon, tone, title, right, children }) => (
  <section className="nb-gray nb-line border-2 p-3.5">
    <h3 className="mb-3 flex items-center gap-2.5 text-xs font-extrabold uppercase">
      <IconTile Icon={icon} tone={tone} className="h-7 w-7" iconClassName="h-3.5 w-3.5" />
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {right}
    </h3>
    {children}
  </section>
));

const OptionTabs = memo(({ options, value, onChange, label, cols, disabled }) => (
  <div role="radiogroup" aria-label={label} className={`grid gap-2.5 ${cols}`}>
    {options.map((o) => {
      const on = value === o.value;
      const Icon = o.icon;
      return (
        <button key={o.value} type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => onChange(o.value)}
          className={`nb-btn flex-col gap-1 px-2 py-2.5 text-xs uppercase ${on ? 'nb-btn-on' : ''}`}>
          <Icon className="h-4 w-4" /> {o.label}
        </button>
      );
    })}
  </div>
));

const CONFIRM_TONES = {
  success: { icon: FiCheckCircle, tile: 'em', bar: 'bg-emerald-500', btn: undefined },
  danger: { icon: FiTrash2, tile: 'ro', bar: 'bg-rose-500', btn: 'danger' },
  warn: { icon: FiInfo, tile: 'am', bar: 'bg-amber-400', btn: undefined },
};

const ConfirmDialog = memo(({ dlg, onSettle, onClose }) => {
  const m = CONFIRM_TONES[dlg.tone] || CONFIRM_TONES.warn;
  const Icon = dlg.icon || m.icon;
  return (
    <ModalFrame onClose={onClose} size="sm:max-w-md" label={dlg.title} role="alertdialog">
      {(close) => (
        <>
          <div className={`nb-line h-3 w-full flex-shrink-0 border-b-2 ${m.bar}`} />
          <div className="px-6 pb-6 pt-7 text-center">
            <IconTile Icon={Icon} tone={m.tile} className="mx-auto h-16 w-16" iconClassName="h-7 w-7" />
            <h2 className="mt-4 text-xl font-extrabold uppercase"><span className="nb-ul">{dlg.title}</span></h2>
            {dlg.text && <p className="nb-muted mx-auto mt-3 max-w-xs text-sm leading-relaxed">{dlg.text}</p>}
          </div>
          <div className="nb-gray nb-line grid grid-cols-2 gap-3 border-t-2 px-5 py-4">
            <Btn tone="soft" onClick={close} className="py-3 text-sm uppercase">{dlg.cancelText || 'Cancel'}</Btn>
            <Btn tone={m.btn} onClick={() => { onSettle(true); close(); }} className="py-3 text-sm uppercase">{dlg.confirmText || 'Confirm'}</Btn>
          </div>
        </>
      )}
    </ModalFrame>
  );
});

const initialsOf = (first, last) => `${(first || '').trim().charAt(0)}${(last || '').trim().charAt(0)}`.toUpperCase();

const DetailCard = memo(({ icon, tone, label, value, copyable, ltr, children }) => {
  const has = !isEmpty(value);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      toast({ icon: 'success', title: 'Copied', text: String(value), timer: 1800 });
    } catch { toast({ icon: 'error', title: 'Could not copy', timer: 1800 }); }
  }, [value]);
  return (
    <div className="nb-card flex items-center gap-3 p-3">
      <IconTile Icon={icon} tone={tone} className="h-10 w-10" iconClassName="h-5 w-5" />
      <div className="min-w-0 flex-1">
        <p className="nb-muted text-[10px] font-extrabold uppercase tracking-widest">{label}</p>
        {children || <p dir={ltr ? 'ltr' : undefined} className={`truncate text-sm font-bold ${has ? '' : 'opacity-40'}`}>{has ? value : '—'}</p>}
      </div>
      {copyable && has && (
        <button type="button" onClick={copy} aria-label={`Copy ${label}`} title="Copy" className="nb-btn h-8 w-8 flex-shrink-0 !shadow-none">
          <FiCopy className="h-4 w-4" />
        </button>
      )}
    </div>
  );
});

const ProfileStat = memo(({ icon: Icon, value, label }) => (
  <div className="nb-gray nb-line flex flex-col items-center gap-0.5 border-2 px-2 py-3 text-center">
    <Icon className="nb-ic h-4 w-4" />
    <p className="text-xl font-extrabold tabular-nums">{value}</p>
    <p className="nb-muted truncate text-[10px] font-extrabold uppercase tracking-widest">{label}</p>
  </div>
));

const ProfileTab = memo(({ profile, form, setForm, counts, onSave, onDelete, onLogout, language, onChangeLanguage, t }) => {
  const [editing, setEditing] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const name = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
  const initials = initialsOf(profile?.first_name, profile?.last_name);
  const active = !!profile?.activate;
  const submit = async (e) => {
    e.preventDefault();
    const phoneErr = phoneValidationError(form.phone);
    if (phoneErr) { setPhoneError(phoneErr); return; }
    setEditing(false);
    if (!(await onSave())) setEditing(true);
  };
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const updPhone = (e) => { upd('phone')(e); setPhoneError(phoneValidationError(e.target.value)); };
  const cancelEdit = () => { setEditing(false); setPhoneError(''); };

  return (
    <div className="space-y-5">
      <TabTitle icon={FiUser} tone="em" right={!editing && (
        <Btn tone="soft" onClick={() => setEditing(true)} className="px-3 py-2 text-xs uppercase"><FiEdit2 className="nb-ic h-3.5 w-3.5" /> {t('editProfile')}</Btn>
      )}>{editing ? t('editProfile') : t('myProfile')}</TabTitle>

      {editing ? (
        <section className="nb-card p-4 sm:p-5">
          <form onSubmit={submit} noValidate className="mx-auto max-w-xl space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label={t('firstName')} icon={FiUser} value={form.first_name} onChange={upd('first_name')} autoComplete="given-name" required />
              <TextField label={t('lastName')} icon={FiUser} value={form.last_name} onChange={upd('last_name')} autoComplete="family-name" required />
            </div>
            <div className="space-y-1.5">
              <TextField label={t('phoneNumber')} icon={FiPhone} type="tel" value={form.phone} onChange={updPhone} autoComplete="tel" aria-invalid={!!phoneError} required />
              {phoneError && <p role="alert" className="text-xs font-bold text-rose-500">{phoneError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Btn tone="soft" onClick={cancelEdit} className="py-2.5 text-sm uppercase">{t('cancel')}</Btn>
              <Btn type="submit" className="py-2.5 text-sm uppercase"><FiCheck className="h-4 w-4" /> {t('saveChanges')}</Btn>
            </div>
          </form>
        </section>
      ) : (
        <section className="nb-card p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className={`nb-line flex h-20 w-20 flex-shrink-0 items-center justify-center border-2 text-3xl font-extrabold shadow-[4px_4px_0_var(--nb-shadow)] ${initials ? 'bg-emerald-500 text-white' : 'nb-gray'}`}>
              {initials || <FiUser className="h-9 w-9 text-[color:var(--nb-ink)]" />}
            </span>
            <div className="min-w-0 flex-1">
              {name && <p className="truncate text-xl font-extrabold uppercase sm:text-2xl"><span className="nb-ul">{name}</span></p>}
              {profile?.email && <p className="nb-muted mt-2 truncate text-sm font-semibold">{profile.email}</p>}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <ProfileStat icon={FiBox} value={counts.orders} label={t('orders')} />
            <ProfileStat icon={FiTool} value={counts.repairs} label={t('repairs')} />
            <ProfileStat icon={FiMapPin} value={counts.addresses} label={t('addresses')} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DetailCard icon={FiUser} tone="em" label={t('fullName', 'Full name')} value={name} />
            <DetailCard icon={FiMail} tone="sky" label={t('email', 'Email')} value={profile?.email} copyable />
            <DetailCard icon={FiPhone} tone="vi" label={t('phoneNumber')} value={profile?.phone} copyable ltr />
            <DetailCard icon={FiShield} tone={active ? 'te' : 'ro'} label={t('accountStatus')}>
              <p className={`flex items-center gap-1.5 text-sm font-bold ${active ? 'text-emerald-500' : 'text-rose-500'}`}>
                {active ? <FiCheckCircle className="h-4 w-4" /> : <FiXCircle className="h-4 w-4" />}
                {active ? t('active') : t('inactive')}
              </p>
            </DetailCard>
          </div>
        </section>
      )}

      <section className="nb-card flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="flex items-center gap-2 text-sm font-extrabold uppercase"><FiGlobe className="nb-ic h-4 w-4" /> {t('language')}</p>
        <NbDropdown value={language} onChange={onChangeLanguage} options={LANG_OPTIONS} ariaLabel={t('selectLanguage')} align="end" className="w-full sm:w-52" />
      </section>

      <section className="nb-card !border-rose-500 !shadow-[5px_5px_0_#e11d48] p-4">
        <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase text-rose-500"><FiTrash2 className="h-4 w-4" /> {t('dangerZone')}</h3>
        <p className="nb-muted mb-3 mt-1 text-xs">{t('dangerZoneHint')}</p>
        <div className="flex flex-wrap gap-3">
          <Btn tone="danger" onClick={onDelete} className="px-4 py-2 text-xs uppercase"><FiTrash2 className="h-3.5 w-3.5" /> {t('deleteAccount')}</Btn>
          <Btn tone="soft" onClick={onLogout} className="px-4 py-2 text-xs uppercase"><RiLogoutBoxRLine className="h-3.5 w-3.5" /> {t('logout')}</Btn>
        </div>
      </section>
    </div>
  );
});

const EMPTY_ADDR = { state: '', city: '', street: '', building: '', notes: '', isDefault: false, latitude: 0, longitude: 0 };
const COORD_FIELDS = [['latitude', 'Latitude'], ['longitude', 'Longitude']];
const MAP_FALLBACK_CLS = 'nb-gray nb-line h-[320px] animate-pulse border-2 motion-reduce:animate-none sm:h-[380px]';

const AddressesTab = memo(({ addresses, inUseIds, onCreate, onUpdate, onDelete, darkMode, t }) => {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_ADDR);
  const [mode, setMode] = useState('manual');
  const formOpen = editingId !== null;
  const close = () => { setEditingId(null); setForm(EMPTY_ADDR); setMode('manual'); };
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onMap = useCallback((lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng })), []);
  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form, latitude: form.latitude || 0, longitude: form.longitude || 0 };
    if (editingId === 'new') onCreate(payload); else onUpdate(editingId, payload);
    close();
  };
  const startEdit = (a) => {
    setForm({ state: a.state, city: a.city, street: a.street, building: a.building, notes: a.notes || '', isDefault: !!a.isDefault, latitude: a.latitude || 0, longitude: a.longitude || 0 });
    setEditingId(a.id);
  };

  if (formOpen) {
    const fields = [['state', t('stateGovernorate'), FiGlobe], ['city', t('city'), FiNavigation], ['street', t('street'), FiMapPin], ['building', t('buildingApartment'), FiHome]];
    return (
      <>
        <TabTitle icon={FiMapPin} tone="sky">{editingId === 'new' ? t('addAddress') : t('editAddress')}</TabTitle>
        <form onSubmit={submit} className="nb-card space-y-5 p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2.5" role="tablist">
            {[['manual', FiList, t('addressInformation')], ['map', FiNavigation, t('pickOnMap')]].map(([m, Icon, label]) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                className={`nb-btn px-2 py-2.5 text-xs uppercase ${mode === m ? 'nb-btn-on' : ''}`}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          {mode === 'manual' ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map(([k, label, Icon]) => <TextField key={k} label={label} icon={Icon} value={form[k]} onChange={upd(k)} required />)}
              </div>
              <TextField as="textarea" rows={3} label={t('additionalNotes')} value={form.notes} onChange={upd('notes')} />
            </div>
          ) : (
            <div className="space-y-4">
              <Suspense fallback={<div className={MAP_FALLBACK_CLS} />}>
                <MapPicker latitude={form.latitude} longitude={form.longitude} onChange={onMap} darkMode={darkMode} />
              </Suspense>
              <div className="grid grid-cols-2 gap-4">
                {COORD_FIELDS.map(([k, label]) => (
                  <TextField key={k} label={label} icon={FiCompass} type="number" step="any" value={form[k] || ''}
                    onChange={(e) => setForm((f) => ({ ...f, [k]: parseFloat(e.target.value) || 0 }))} />
                ))}
              </div>
              <p className="nb-gray nb-line flex items-start gap-2 border-2 border-dotted p-3 text-xs font-semibold"><FiInfo className="nb-ic mt-0.5 h-3.5 w-3.5 flex-shrink-0" />{t('manualAddressHint')}</p>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" className="h-4 w-4 accent-emerald-500" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
            <span className="text-sm font-bold">{t('setDefaultAddress')}</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Btn tone="soft" onClick={close} className="py-2.5 text-sm uppercase">{t('cancel')}</Btn>
            <Btn type="submit" className="py-2.5 text-sm uppercase"><FiCheck className="h-4 w-4" /> {editingId === 'new' ? t('save') : t('update')}</Btn>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <TabTitle icon={FiMapPin} tone="sky" right={<Btn onClick={() => setEditingId('new')} className="px-3 py-2 text-xs uppercase"><FiPlus className="h-3.5 w-3.5" /> {t('addAddress')}</Btn>}>{t('addresses')}</TabTitle>
      {addresses.length === 0 ? (
        <EmptyState kind="pin" title={t('noAddresses')} subtitle={t('addressHint')} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {addresses.map((a, i) => {
            const inUse = inUseIds.has(String(a.id));
            const hasCoords = !!a.latitude && !!a.longitude;
            return (
              <CardShell key={a.id} index={i}>
                <div className="flex items-start gap-2.5">
                  <IconTile Icon={FiMapPin} tone="sky" className="h-11 w-11" iconClassName="h-5 w-5" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-extrabold uppercase">{a.street}, {a.building}</h3>
                    <p className="nb-muted truncate text-xs font-semibold">{a.city}, {a.state}</p>
                  </div>
                  {a.isDefault && <span className="nb-chip nb-chip-a flex-shrink-0"><RiVerifiedBadgeLine className="h-3 w-3" /> {t('default')}</span>}
                </div>
                {!isEmpty(a.notes) && <p className="nb-gray line-clamp-2 px-2.5 py-1.5 text-xs italic">“{a.notes}”</p>}
                {hasCoords && (
                  <a href={directionsUrl(a.latitude, a.longitude)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase underline underline-offset-4">
                    <FiExternalLink className="nb-ic h-3 w-3" /> {t('getDirections')}
                    <span dir="ltr" className="nb-muted ms-auto font-mono font-normal normal-case">{Number(a.latitude).toFixed(4)}, {Number(a.longitude).toFixed(4)}</span>
                  </a>
                )}
                <div className="nb-line mt-auto border-t-2 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Btn tone="soft" disabled={inUse} onClick={() => startEdit(a)} className="py-2 text-xs uppercase"><FiEdit2 className="h-3.5 w-3.5" /> {inUse ? t('inUse') : t('edit')}</Btn>
                    <Btn tone="danger" disabled={inUse} onClick={() => onDelete(a.id)} className="py-2 text-xs uppercase" aria-label={t('delete')}><FiTrash2 className="h-3.5 w-3.5" /> {t('delete')}</Btn>
                  </div>
                  {inUse && <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-amber-500"><FiInfo className="h-3 w-3" /> {t('usedInActiveOrderRepair')}</p>}
                </div>
              </CardShell>
            );
          })}
        </div>
      )}
    </>
  );
});

const NotificationsTab = memo(({ items, onDelete, t }) => {
  const [page, setPage] = useState(1);
  const ipp = 6;
  const total = Math.max(1, Math.ceil(items.length / ipp));
  const current = Math.min(page, total);
  const pageItems = useMemo(() => items.slice((current - 1) * ipp, current * ipp), [items, current]);
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  return (
    <>
      <TabTitle icon={FiBell} tone="ro" right={unread > 0 && <span className="nb-chip !bg-rose-600 !text-white">{unread}</span>}>{t('notifications')}</TabTitle>
      {items.length === 0 ? <EmptyState kind="bell" title={t('noNotifications')} subtitle={t('notificationHint')} /> : (
        <>
          <ul className="space-y-4">
            {pageItems.map((n, i) => (
              <li key={n.id} style={STAGGER[Math.min(i, 8)]} className="anim-fade-up nb-card flex items-start gap-3 p-3.5">
                <IconTile Icon={FiBell} tone="ro" className="h-9 w-9" iconClassName="h-4 w-4" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-extrabold uppercase">
                    <span className="truncate">{n.title || n.subject || 'Notification'}</span>
                    {!n.read && <span className="nb-line h-2.5 w-2.5 flex-shrink-0 border-2 bg-emerald-500" aria-label="Unread" />}
                  </p>
                  {!isEmpty(n.message || n.body) && <p className="mt-1 text-xs leading-relaxed opacity-90">{n.message || n.body}</p>}
                  {!isEmpty(n.createdAt) && <p className="nb-muted mt-1.5 flex items-center gap-1 text-[10px] font-bold"><FiClock className="h-3 w-3" />{fmtFull(n.createdAt)}</p>}
                </div>
                <button type="button" onClick={() => onDelete(n.id)} aria-label={t('delete')} className="nb-btn h-8 w-8 flex-shrink-0"><FiTrash2 className="h-4 w-4 text-rose-500" /></button>
              </li>
            ))}
          </ul>
          <Pagination page={current} total={total} onChange={setPage} t={t} />
        </>
      )}
    </>
  );
});

const STATUS_COLORS = {
  PENDING: '#f59e0b', CONFIRMED: '#0ea5e9', PROCESSING: '#8b5cf6', FINISHPROCESSING: '#6366f1', SHIPPED: '#ec4899', DELIVERED: '#10b981', CANCELLED: '#f43f5e',
  SUBMITTED: '#f59e0b', QUOTE_SENT: '#a855f7', QUOTE_APPROVED: '#14b8a6', QUOTE_REJECTED: '#ef4444', DEVICE_COLLECTED: '#0ea5e9', REPAIRING: '#6366f1',
  REPAIR_COMPLETED: '#06b6d4', DEVICE_DELIVERED: '#10b981', FAILED: '#e11d48',
};
const FALLBACK_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#f43f5e', '#14b8a6'];

const Donut = memo(({ data, darkMode, size = 144, thickness = 22 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = data.length > 1 ? 3 : 0;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${total} total`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {total === 0 ? <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={darkMode ? '#1e1e1e' : '#e5e7eb'} strokeWidth={thickness} />
          : data.map((d, i) => {
            const frac = d.value / total;
            const len = Math.max(0, frac * c - gap);
            const el = <circle key={d.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={thickness} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc * c} />;
            acc += frac;
            return el;
          })}
      </g>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill={darkMode ? '#ffffff' : '#04261a'} style={{ fontSize: 24, fontWeight: 800 }}>{total}</text>
    </svg>
  );
});

const Legend = memo(({ data }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <ul className="min-w-[150px] flex-1 space-y-1.5">
      {data.map((d) => (
        <li key={d.label} className="flex items-center gap-2 text-xs">
          <span className="nb-line h-3 w-3 flex-shrink-0 border-2" style={{ backgroundColor: d.color }} />
          <span className="flex-1 truncate font-bold">{d.label}</span>
          <b>{d.value}</b>
          <span className="nb-muted w-9 text-end font-semibold">{Math.round((d.value / total) * 100)}%</span>
        </li>
      ))}
    </ul>
  );
});

const countBy = (list, label) => {
  const m = {};
  list.forEach((x) => { m[x.status] = (m[x.status] || 0) + 1; });
  return Object.entries(m).map(([k, value], i) => ({ label: label(k), value, color: STATUS_COLORS[k] || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }));
};

const AnalyticsTab = memo(({ orders, repairs, addresses, darkMode, t }) => {
  const spent = useMemo(() => orders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0) + repairs.reduce((s, r) => s + (Number(r.price) || 0), 0), [orders, repairs]);
  const orderData = useMemo(() => countBy(orders, (k) => t(`status_${k}`)), [orders, t]);
  const repairData = useMemo(() => countBy(repairs, (k) => t(`status_${k}`)), [repairs, t]);
  const n = useMemo(() => ({
    delivered: orders.filter((o) => o.status === 'DELIVERED').length,
    cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
    done: repairs.filter((r) => r.status === 'DEVICE_DELIVERED').length,
    failed: repairs.filter((r) => REPAIR_BAD.has(r.status)).length,
  }), [orders, repairs]);

  const stats = [
    { icon: FiBox, tone: 'sky', value: orders.length, label: t('totalOrders') },
    { icon: FiTool, tone: 'vi', value: repairs.length, label: t('totalRepairs') },
    { icon: FiDollarSign, tone: 'am', value: `${spent.toFixed(0)} EGP`, label: t('totalSpent') },
    { icon: FiMapPin, tone: 'ro', value: addresses.length, label: t('savedAddresses') },
  ];
  const bars = [
    [t('ordersDelivered'), n.delivered, orders.length, 'bg-emerald-500'],
    [t('ordersCancelled'), n.cancelled, orders.length, 'bg-rose-500'],
    [t('repairsCompleted'), n.done, repairs.length, 'bg-sky-500'],
    [t('repairsCancelledFailed'), n.failed, repairs.length, 'bg-amber-400'],
  ];
  const panel = 'nb-card p-4 sm:p-5';
  const h = 'mb-4 flex items-center gap-2 text-sm font-extrabold uppercase';

  return (
    <div className="space-y-5">
      <TabTitle icon={FiPieChart} tone="te">{t('analytics')}</TabTitle>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ icon, tone, value, label }) => (
          <div key={label} className="nb-card relative overflow-hidden p-3.5">
            <span aria-hidden="true" className={`pointer-events-none absolute -end-6 -top-6 h-20 w-20 rounded-full opacity-25 ${BLOB[tone]}`} />
            <IconTile Icon={icon} tone={tone} className="mb-2 h-9 w-9" iconClassName="h-4 w-4" />
            <p className="text-xl font-extrabold tabular-nums">{value}</p>
            <p className="nb-muted text-[11px] font-extrabold uppercase">{label}</p>
          </div>
        ))}
      </div>

      {orders.length === 0 && repairs.length === 0 ? (
        <EmptyState kind="chart" title={t('notEnoughActivity')} subtitle={t('analyticsHint')} />
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            {[[FiBox, t('ordersByStatus'), orderData, orders.length, t('noOrdersYet')], [FiTool, t('repairsByStatus'), repairData, repairs.length, t('noRepairs')]].map(([Icon, title, data, count, none]) => (
              <section key={title} className={panel}>
                <h3 className={h}><Icon className="nb-ic h-4 w-4" /> {title}</h3>
                {count === 0 ? <p className="nb-muted py-6 text-center text-xs font-semibold">{none}</p>
                  : <div className="flex flex-wrap items-center gap-4"><Donut data={data} darkMode={darkMode} /><Legend data={data} /></div>}
              </section>
            ))}
          </div>
          <section className={panel}>
            <h3 className={h}><FiTrendingUp className="nb-ic h-4 w-4" /> {t('performanceOverview')}</h3>
            <div className="space-y-4">
              {bars.map(([label, value, total, color]) => {
                const pct = total ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-extrabold uppercase">{label}</span>
                      <span dir="ltr" className="nb-muted font-bold">{value}/{total} · {pct}%</span>
                    </div>
                    <div className="nb-gray nb-line h-3 border-2">
                      <div className={`h-full transition-[width] duration-500 motion-reduce:transition-none ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
});

const AboutTab = memo(({ darkMode, t }) => {
  const values = [
    { icon: FiShield, tone: 'em', title: t('verifiedShops'), text: t('verifiedShopsText') },
    { icon: FiZap, tone: 'am', title: t('fastTurnaround'), text: t('fastTurnaroundText') },
    { icon: FiCreditCard, tone: 'vi', title: t('securePayments'), text: t('securePaymentsText') },
    { icon: FiTruck, tone: 'sky', title: t('doorstepDelivery'), text: t('doorstepDeliveryText') },
  ];
  return (
    <div className="space-y-5">
      <TabTitle icon={FiCompass} tone="sky">{t('aboutTechRestore')}</TabTitle>
      <section className="nb-card flex flex-col items-center gap-4 p-5 sm:flex-row">
        <div className="nb-gray nb-line flex-shrink-0 border-2 p-2">
          <IsoIllustration type="shop_store" tone="emerald" darkMode={darkMode} onGreen={false} className="h-28 w-28" />
        </div>
        <p className="text-sm leading-relaxed opacity-90">{t('aboutDescription')}</p>
      </section>
      <section className="nb-card p-4 sm:p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase"><FiAward className="nb-ic h-4 w-4" /> <span className="nb-ul">{t('whyChooseUs')}</span></h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {values.map(({ icon, tone, title, text }) => (
            <div key={title} className="nb-gray nb-line flex gap-3 border-2 p-3">
              <IconTile Icon={icon} tone={tone} className="h-10 w-10" iconClassName="h-5 w-5" />
              <div className="min-w-0"><p className="text-sm font-extrabold uppercase">{title}</p><p className="nb-muted mt-0.5 text-xs">{text}</p></div>
            </div>
          ))}
        </div>
      </section>
      <section className="nb-card p-4 sm:p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase"><FiSend className="nb-ic h-4 w-4" /> <span className="nb-ul">{t('getInTouch')}</span></h3>
        <div className="nb-gray nb-line grid gap-3 border-2 border-dotted p-3.5 sm:grid-cols-3">
          <InfoRow icon={FiMail}>support@tech-restore.com</InfoRow>
          <InfoRow icon={FiPhone}><span dir="ltr">+20 100 000 0000</span></InfoRow>
          <InfoRow icon={FiMapPin}>Cairo, Egypt</InfoRow>
        </div>
      </section>
    </div>
  );
});

const OrderModal = memo(({ order, onClose, t }) => {
  const items = order.orderItems || [];
  return (
    <Sheet onClose={onClose} icon={FiBox} tone="am" size="sm:max-w-2xl"
      title={`ORD #${order.id.slice(0, 8).toUpperCase()}`}
      subtitle={!isEmpty(order.createdAt) ? fmtFull(order.createdAt) : undefined}
      footer={(close) => <div className="flex justify-end"><Btn tone="soft" onClick={close} className="px-6 py-2 text-sm uppercase">{t('close')}</Btn></div>}>
      <div className="space-y-4">
        <Section icon={FiTruck} tone="sky" title={t('status')} right={<StatusBadge status={order.status} t={t} />}>
          <ProgressBar progress={orderProgress(order.status)} label={t(`status_${order.status}`)} />
        </Section>

        <Section icon={FiInfo} tone="vi" title="Order info">
          <div className="grid grid-cols-2 gap-2">
            {!isEmpty(order.createdAt) && <Stat surface="plain" label={t('orderDate')} value={fmtFull(order.createdAt)} />}
            {!isEmpty(order.paymentMethod) && <Stat surface="plain" label={t('paymentMethod')} value={order.paymentMethod.replace('_', ' ')} />}
          </div>
        </Section>

        <Section icon={FiBox} tone="am" title={t('orderItems')}>
          <ul className="nb-line divide-y-2 divide-[color:var(--nb-line)] border-2 bg-[color:var(--nb-card)]">
            {items.length === 0 ? <li className="nb-muted p-8 text-center text-sm">{t('noItems')}</li> : items.map((it, i) => (
              <li key={it.id ?? i} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold uppercase">{it.productName || '—'}</p>
                  <p className="nb-muted truncate text-xs font-semibold">{it.shopName || '—'} · {it.quantity} × EGP {Number(it.priceAtCheckout || 0).toFixed(2)}</p>
                </div>
                <b className="flex-shrink-0 text-sm tabular-nums">EGP {((Number(it.priceAtCheckout) || 0) * (Number(it.quantity) || 0)).toFixed(2)}</b>
              </li>
            ))}
            <li className="nb-gray flex items-center justify-between p-3">
              <span className="text-xs font-extrabold uppercase tracking-widest">{t('grandTotal')}</span>
              <b className="text-lg tabular-nums">EGP {order.totalPrice ?? '—'}</b>
            </li>
          </ul>
        </Section>
      </div>
    </Sheet>
  );
});

const RepairModal = memo(({ repair, onClose, t }) => (
  <Sheet onClose={onClose} icon={FiTool} tone="vi" title={`REQ #${repair.id.slice(0, 8).toUpperCase()}`} subtitle={repair.shopName || undefined}
    footer={(close) => <div className="flex justify-end"><Btn tone="soft" onClick={close} className="px-6 py-2 text-sm uppercase">{t('close')}</Btn></div>}>
    <div className="space-y-4">
      <Section icon={FiTruck} tone="sky" title={t('status')} right={<StatusBadge status={repair.status} type="repair" t={t} />}>
        <ProgressBar progress={repairProgress(repair.status)} label={t(`status_${repair.status}`)} />
      </Section>
      <Section icon={FiShoppingBag} tone="em" title={t('shop')}>
        <Stat surface="plain" label={t('shop')} value={repair.shopName || '—'} />
      </Section>
      {!isEmpty(repair.description) && (
        <Section icon={FiEdit2} tone="am" title="Reported problem">
          <p className="text-sm leading-relaxed">{repair.description}</p>
        </Section>
      )}
      {!isEmpty(repair.price) && (
        <Section icon={FiDollarSign} tone="vi" title={t('price', 'Price')}>
          <Price value={repair.price} />
        </Section>
      )}
    </div>
  </Sheet>
));

const EditRepairModal = memo(({ repair, categories, onClose, onSubmit }) => {
  const [desc, setDesc] = useState(repair.description || '');
  const [cat, setCat] = useState(repair.deviceCategory?.id || repair.deviceCategory || '');
  const [errors, setErrors] = useState({ desc: '', cat: '' });
  const closeRef = useRef(null);
  const catOptions = useMemo(() => categories.map((c) => ({ value: c.id, label: c.name })), [categories]);
  const submit = (e) => {
    e?.preventDefault?.();
    const text = desc.trim();
    const next = {
      desc: text ? '' : "Description can't be blank. Please describe what's wrong with your device.",
      cat: cat ? '' : 'Please select a device category.',
    };
    if (next.desc || next.cat) { setErrors(next); return; }
    onSubmit(repair, text, cat);
    closeRef.current?.();
  };
  return (
    <Sheet onClose={onClose} closeRef={closeRef} icon={FiEdit2} tone="am" title="Edit repair" subtitle={`REQ #${repair.id.slice(0, 8).toUpperCase()}`} size="sm:max-w-md"
      footer={(close) => (
        <div className="grid grid-cols-2 gap-3">
          <Btn tone="soft" onClick={close} className="py-2.5 text-sm uppercase">Cancel</Btn>
          <Btn onClick={submit} className="py-2.5 text-sm uppercase"><FiCheck className="h-4 w-4" /> Save</Btn>
        </div>
      )}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Section icon={FiTool} tone="vi" title="Device category">
          <NbDropdown placeholder="Select category" ariaLabel="Device category" value={cat} onChange={(v) => { setCat(v); setErrors((er) => ({ ...er, cat: '' })); }} options={catOptions} className="w-full" />
          {errors.cat && <p role="alert" className="mt-2 text-xs font-bold text-rose-500">{errors.cat}</p>}
        </Section>
        <Section icon={FiEdit2} tone="am" title="Description">
          <TextField as="textarea" rows={5} label="Description" required aria-invalid={!!errors.desc} value={desc} onChange={(e) => { setDesc(e.target.value); setErrors((er) => ({ ...er, desc: '' })); }} />
          {errors.desc && <p role="alert" className="mt-2 text-xs font-bold text-rose-500">{errors.desc}</p>}
        </Section>
      </form>
    </Sheet>
  );
});

const DELIVERY_OPTIONS = [
  { value: 'HOME_DELIVERY', label: 'Home', icon: FiHome },
  { value: 'SHOP_VISIT', label: 'Visit shop', icon: FiShoppingBag },
  { value: 'PICKUP', label: 'Courier', icon: FiTruck },
];

const ConfirmRepairModal = memo(({ req, addresses, token, onClose, onSuccess }) => {
  const [addrId, setAddrId] = useState(() => (addresses.find((a) => a.isDefault) || addresses[0])?.id || '');
  const [delivery, setDelivery] = useState('HOME_DELIVERY');
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);
  const closeRef = useRef(null);
  const priceOk = validPrice(req.price);
  const addrOptions = useMemo(() => addresses.map((a) => ({ value: a.id, label: `${a.street}, ${a.building} — ${a.city}${a.isDefault ? ' (Default)' : ''}` })), [addresses]);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!addrId || !priceOk || submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);
    try {
      await api.post(`/api/users/repair-request/repairs/${req.id}/confirm`, { deliveryAddress: addrId, deliveryMethod: delivery, paymentMethod: 'CASH' }, { headers: { Authorization: `Bearer ${token}` } });
      closeRef.current?.();
      toast({ icon: 'success', title: 'Repair confirmed', text: 'Your repair order has been placed.', timer: 3500 });
      onSuccess();
    } catch (err) { toast({ icon: 'error', title: 'Failed to confirm repair', text: friendlyError(err, 'Something went wrong. Please try again.'), timer: 3500 }); }
    finally { submittingRef.current = false; setBusy(false); }
  };

  return (
    <Sheet onClose={onClose} closeRef={closeRef} icon={FiCheckCircle} tone="em" title="Confirm repair order" subtitle={`REQ #${req.id.slice(0, 8).toUpperCase()}`} size="sm:max-w-lg" backdropClose={false}
      footer={(close) => (
        <div className="grid grid-cols-2 gap-3">
          <Btn tone="soft" onClick={close} disabled={busy} className="py-2.5 text-sm uppercase">Cancel</Btn>
          <Btn onClick={submit} disabled={busy || addresses.length === 0 || !priceOk} className="py-2.5 text-sm uppercase">{busy ? 'Processing…' : <><FiCheckCircle className="h-4 w-4" /> Confirm</>}</Btn>
        </div>
      )}>
      <form onSubmit={submit} className="space-y-4">
        <Section icon={FiShoppingBag} tone="em" title="Shop & quoted price">
          <div className="nb-line flex items-center justify-between gap-3 border-2 bg-[color:var(--nb-card)] p-3">
            <div className="min-w-0">
              <p className="nb-muted text-[9px] font-extrabold uppercase tracking-widest">Shop</p>
              <p className="truncate text-sm font-extrabold uppercase">{req.shopName || '—'}</p>
            </div>
            <div className="flex-shrink-0 text-end">
              <p className="nb-muted text-[9px] font-extrabold uppercase tracking-widest">Price quoted</p>
              <p className="text-2xl font-extrabold tabular-nums">{isEmpty(req.price) ? '—' : req.price} <span className="nb-muted text-xs font-bold">EGP</span></p>
            </div>
          </div>
          {!priceOk && <p role="alert" className="mt-2 text-xs font-bold text-rose-500">This quote doesn&apos;t have a valid price yet. Please wait for the shop to set one.</p>}
        </Section>

        <Section icon={FiMapPin} tone="sky" title="Delivery address">
          {addresses.length === 0
            ? <p className="text-sm font-bold text-rose-500">No addresses found. Please add one first.</p>
            : <NbDropdown ariaLabel="Delivery address" value={addrId} onChange={setAddrId} options={addrOptions} className="w-full" />}
        </Section>

        <Section icon={FiTruck} tone="am" title="Delivery method">
          <OptionTabs options={DELIVERY_OPTIONS} value={delivery} onChange={setDelivery} label="Delivery method" cols="grid-cols-3" disabled={busy} />
        </Section>
      </form>
    </Sheet>
  );
});

const RepairPaymentModal = memo(({ pay, repair, checking, onClose, onOpenPayment, onCheck, onRetry, onDismiss }) => {
  const closeRef = useRef(null);
  const failed = !!pay.failed;
  const closeThen = (fn) => () => (closeRef.current ? closeRef.current(fn) : fn());
  return (
    <Sheet onClose={onClose} closeRef={closeRef} icon={failed ? FiXCircle : FiClock} tone={failed ? 'ro' : 'am'} title={failed ? 'Payment failed' : 'Complete your payment'} size="sm:max-w-md">
      <div className="space-y-4 text-center" role="status" aria-live="polite">
        <p className="nb-muted text-sm leading-relaxed">
          {failed
            ? 'Your card was not charged and the repair order is not confirmed. You can try the payment again.'
            : 'Your repair order is confirmed only after the payment succeeds. If you closed the payment page, open it again.'}
        </p>
        <p className={`nb-chip !text-xs ${failed ? '!bg-rose-600 !text-white' : 'nb-chip-a'}`} dir="ltr">
          REQ #{String(pay.orderId).slice(0, 8)}{repair?.shopName ? ` · ${repair.shopName}` : ''}
        </p>
        {failed ? (
          <div className="grid grid-cols-2 gap-3">
            <Btn tone="soft" onClick={closeThen(onDismiss)} className="py-2.5 text-sm uppercase">Close</Btn>
            <Btn onClick={closeThen(onRetry)} className="py-2.5 text-sm uppercase"><FiCreditCard className="h-4 w-4" /> Try again</Btn>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Btn onClick={onOpenPayment} disabled={!pay.url} className="w-full py-3 text-sm uppercase"><FiCreditCard className="h-4 w-4" /> Open payment page</Btn>
            <Btn tone="soft" onClick={onCheck} disabled={checking} aria-busy={checking} className="w-full py-3 text-sm uppercase">
              {checking
                ? <><span className="h-4 w-4 animate-spin border-2 border-current border-t-transparent motion-reduce:animate-none" /> Checking payment…</>
                : <><FiCheck className="h-4 w-4" /> I&apos;ve paid, check status</>}
            </Btn>
            <button type="button" onClick={closeThen(onDismiss)} className="nb-muted text-sm font-bold underline underline-offset-4">Pay later</button>
          </div>
        )}
      </div>
    </Sheet>
  );
});

const TabButton = memo(({ tab, active, vertical, onSelect, onWarm }) => {
  const warm = tab.id === 'addresses' ? onWarm : undefined;
  return (
    <button type="button" onClick={() => onSelect(tab.id)} onPointerEnter={warm} onFocus={warm} aria-current={active ? 'page' : undefined}
      className={`nb-btn flex-shrink-0 text-xs uppercase ${active ? 'nb-btn-on' : ''} ${vertical ? 'w-full justify-start px-3 py-2.5' : 'whitespace-nowrap px-3 py-2'}`}>
      <tab.icon aria-hidden="true" className={`h-4 w-4 flex-shrink-0 ${active ? '' : 'nb-ic'}`} />
      <span className={vertical ? 'flex-1 text-start' : ''}>{tab.label}</span>
      {!!tab.badge && <span className="nb-chip">{tab.badge}</span>}
    </button>
  );
});

const useMutate = () => {
  const qc = useQueryClient();
  return useCallback(async (key, apply, request, { ok, fail, failText, wait = false }) => {
    const prev = qc.getQueryData(key);
    const syncable = key[0] === 'orders' || key[0] === 'repairs';
    if (!wait) qc.setQueryData(key, apply);
    try {
      const res = await request();
      if (wait) qc.setQueryData(key, apply);
      if (syncable) qc.invalidateQueries({ queryKey: key });
      toast({ icon: 'success', ...(typeof ok === 'string' ? { title: ok } : ok) });
      return res;
    } catch (err) {
      if (!wait) qc.setQueryData(key, prev);
      if (syncable) qc.invalidateQueries({ queryKey: key });
      toast({ icon: 'error', title: fail, text: friendlyError(err, failText || 'Something went wrong. Please try again.') });
      return null;
    }
  }, [qc]);
};

const useConfirmDialog = () => {
  const [dlg, setDlg] = useState(null);
  const resolver = useRef(null);
  const ask = useCallback((opts) => new Promise((resolve) => {
    resolver.current?.(false);
    resolver.current = resolve;
    setDlg(opts);
  }), []);
  const settle = useCallback((value) => {
    resolver.current?.(value);
    resolver.current = null;
  }, []);
  const close = useCallback(() => { settle(false); setDlg(null); }, [settle]);
  return { dlg, ask, settle, close };
};

const useRepairActions = ({ cfg, ask, mutate }) => {
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [editingRepair, setEditingRepair] = useState(null);
  const [confirmReq, setConfirmReq] = useState(null);

  const viewRepair = useCallback(async (id) => {
    try { setSelectedRepair((await api.get(`/api/users/repair-request/${id}`, cfg)).data); }
    catch { toast({ icon: 'error', title: 'Failed to load repair' }); }
  }, [cfg]);

  const submitRepairEdit = useCallback((repair, description, deviceCategory) => {
    mutate(['repairs'], (o = []) => o.map((r) => (r.id === repair.id ? { ...r, description, deviceCategory } : r)),
      () => api.put(`/api/users/repair-request/${repair.shopId}/${repair.id}`, { description, deviceCategory }, cfg), { ok: { title: 'Repair updated', text: 'The shop will see your changes.' }, fail: 'Failed to update repair' });
  }, [mutate, cfg]);

  const acceptQuote = useCallback(async (req) => {
    if (!validPrice(req.price)) { toast({ icon: 'warning', title: 'No valid price yet', text: 'The shop must set a valid price before you can accept the quote.' }); return; }
    const ok = await ask({ tone: 'success', icon: FiCheckCircle, title: 'Accept quote?', text: `Accept ${req.price} EGP from ${req.shopName}?`, confirmText: 'Yes, accept', cancelText: 'Not now' });
    if (!ok) return;
    const res = await mutate(['repairs'], (o = []) => o.map((r) => (r.id === req.id ? { ...r, status: 'QUOTE_APPROVED' } : r)),
      () => api.put(`/api/users/repair-request/${req.id}/status`, { status: 'QUOTE_APPROVED' }, cfg), { ok: { title: 'Quote accepted', text: 'Choose delivery to finish.' }, fail: 'Failed to accept quote', wait: true });
    if (res) setConfirmReq(req);
  }, [ask, mutate, cfg]);

  const openConfirm = useCallback((req) => setConfirmReq(req), []);

  const cancelRepair = useCallback(async (id) => {
    const ok = await ask({ tone: 'danger', icon: FiXCircle, title: 'Cancel request?', text: 'The repair request will be cancelled.', confirmText: 'Yes, cancel', cancelText: 'Keep request' });
    if (ok) mutate(['repairs'], (o = []) => o.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r)), () => api.delete(`/api/users/repair-request/${id}/cancel`, cfg),
      { ok: { title: 'Request cancelled' }, fail: 'Failed to cancel request', failText: "We couldn't cancel this request right now. Its status has not changed. Please try again.", wait: true });
  }, [ask, mutate, cfg]);

  const closeRepair = useCallback(() => setSelectedRepair(null), []);
  const closeEdit = useCallback(() => setEditingRepair(null), []);
  const closeConfirmReq = useCallback(() => setConfirmReq(null), []);

  return {
    selectedRepair, editingRepair, confirmReq, setEditingRepair, setConfirmReq,
    viewRepair, submitRepairEdit, acceptQuote, openConfirm, cancelRepair, closeRepair, closeEdit, closeConfirmReq,
  };
};

const RepairOverlays = memo(({ actions, token, cfg, addresses, onConfirmed, t }) => {
  const { selectedRepair, editingRepair, confirmReq, closeRepair, closeEdit, closeConfirmReq, submitRepairEdit } = actions;
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async ({ signal }) => unwrap(await api.get('/api/categories', { ...cfg, signal })),
    enabled: !!token && !!editingRepair,
    staleTime: 5 * 60_000,
  });
  return (
    <>
      {selectedRepair && <RepairModal repair={selectedRepair} onClose={closeRepair} t={t} />}
      {editingRepair && <EditRepairModal key={editingRepair.id} repair={editingRepair} categories={categories} onClose={closeEdit} onSubmit={submitRepairEdit} />}
      {confirmReq && <ConfirmRepairModal key={confirmReq.id} req={confirmReq} addresses={addresses} token={token} onClose={closeConfirmReq} onSuccess={onConfirmed} />}
    </>
  );
});

const LATEST_LIMIT = 3;
const byNewest = (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);

const LatestRepairs = memo(({ token, limit = LATEST_LIMIT }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const language = useAppLanguage();
  const t = useCallback((k, fallback) => tr(language, k, fallback), [language]);
  const cfg = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const mutate = useMutate();
  const { dlg, ask, settle, close } = useConfirmDialog();
  const actions = useRepairActions({ cfg, ask, mutate });

  const { data: repairs = [], isLoading } = useAcct('repairs', '/api/users/repair-request', token, { refetchOnMount: 'always' });
  const { data: addresses = [] } = useAcct('addresses', '/api/users/addresses', token, { enabled: !!token && !!actions.confirmReq });

  const awaitingId = useMemo(() => {
    const p = loadPending('repair');
    return p && !p.failed ? p.orderId : null;
  }, []);
  const latest = useMemo(() => [...repairs].sort(byNewest).slice(0, limit), [repairs, limit]);

  const goAccount = useCallback(() => navigate('/account', { state: { section: 'repairs' } }), [navigate]);
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ['repairs'] }), [qc]);

  if (!token || (!isLoading && latest.length === 0)) return null;

  return (
    <section aria-label={t('latestRepairs', 'Latest repairs')}>
      {REPAIRS_STYLE_EL}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide rtl:tracking-normal"><span className="nb-bar" aria-hidden="true" />{t('repairs')}</p>
          <h2 className="mt-3 text-2xl font-extrabold uppercase leading-tight sm:text-3xl"><span className="nb-ul">{t('latestRepairs', 'Latest repairs')}</span></h2>
        </div>
        <Btn tone="soft" onClick={goAccount} className="px-3 py-2 text-xs uppercase">
          {t('viewAll', 'View all')} <FiChevronRight className="nb-flip h-3.5 w-3.5" />
        </Btn>
      </header>

      {isLoading && latest.length === 0 ? <SkeletonList /> : (
        <div className={`${CARDS_GRID_CLS} pe-2 pb-2`}>
          {latest.map((r, i) => (
            <RepairCard key={r.id} req={r} index={i} t={t} awaitingPayment={awaitingId === r.id}
              onDetails={actions.viewRepair} onEdit={actions.setEditingRepair} onAccept={actions.acceptQuote}
              onConfirm={actions.openConfirm} onCancel={actions.cancelRepair} onPay={goAccount} />
          ))}
        </div>
      )}

      <RepairOverlays actions={actions} token={token} cfg={cfg} addresses={addresses} onConfirmed={refresh} t={t} />
      {dlg && <ConfirmDialog dlg={dlg} onSettle={settle} onClose={close} />}
    </section>
  );
});

const AccountContent = ({ darkMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const language = useAppLanguage();
  const font = useLangFont(language);
  const isAr = language === 'ar';
  const t = useCallback((k, fallback) => tr(language, k, fallback), [language]);
  const [, startTransition] = useTransition();

  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [section, setSection] = useState(() => (VALID_SECTIONS.has(location.state?.section) ? location.state.section : 'profile'));
  const [switching, setSwitching] = useState(false);
  const switchTimer = useRef(null);
  const cancellingRef = useRef(new Set());
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pendingPay, setPendingPay] = useState(() => loadPending('repair'));
  const [payModalOpen, setPayModalOpen] = useState(() => !!pendingPay);
  const [payChecking, setPayChecking] = useState(false);

  const mutate = useMutate();
  const { dlg: confirmDlg, ask, settle: settleConfirm, close: closeConfirm } = useConfirmDialog();

  useEffect(() => { ensureNbFont(); }, []);
  useEffect(() => { document.title = 'My Account | Tech-Restore'; }, []);
  useEffect(() => () => clearTimeout(switchTimer.current), []);

  useEffect(() => {
    const tk = localStorage.getItem('authToken');
    let ok = false;
    try { const d = tk && jwtDecode(tk); ok = !!(d && d.exp && d.exp > Date.now() / 1000); } catch { ok = false; }
    if (!ok) { localStorage.removeItem('authToken'); clearCache(); setIsAuthenticated(false); navigate('/login'); }
    else { setToken(tk); setIsAuthenticated(true); }
  }, [location.pathname, navigate]);

  const cfg = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const repairActions = useRepairActions({ cfg, ask, mutate });

  const pollOrders = ORDER_LIVE_SECTIONS.has(section) ? LIVE_POLL_MS : false;
  const pollRepairs = REPAIR_LIVE_SECTIONS.has(section) ? LIVE_POLL_MS : false;

  const { data: profile, isLoading: profileLoading } = useAcct('profile', '/api/users/profile', token, { list: false });
  const { data: addresses = [], isLoading: addressesLoading } = useAcct('addresses', '/api/users/addresses', token);
  const { data: orders = [], isLoading: ordersLoading } = useAcct('orders', '/api/users/orders', token, { refetchInterval: pollOrders });
  const { data: repairs = [], isLoading: repairsLoading } = useAcct('repairs', '/api/users/repair-request', token, { refetchInterval: pollRepairs, refetchOnMount: 'always' });
  const { data: notifications = [], isLoading: notificationsLoading } = useAcct('notifications', '/api/notifications/users', token, { refetchInterval: NOTIF_POLL_MS });

  const { data: payState, refetch: refetchPay } = useRepairPayment(pendingPay?.orderId, token, !!pendingPay && !pendingPay.failed);

  useEffect(() => {
    if (section !== 'addresses' || !token) return;
    qc.invalidateQueries({ queryKey: ['orders'] });
    qc.invalidateQueries({ queryKey: ['repairs'] });
  }, [section, token, qc]);

  useEffect(() => {
    if (!pendingPay || pendingPay.failed) return;
    if (payState === 'paid') {
      clearPending('repair');
      setPendingPay(null);
      setPayModalOpen(false);
      toast({ icon: 'success', title: 'Payment successful', text: 'Your repair order is confirmed.', timer: 3500 });
      qc.invalidateQueries({ queryKey: ['repairs'] });
    } else if (payState === 'failed') {
      clearPending('repair');
      setPendingPay((p) => (p ? { ...p, failed: true } : p));
      setPayModalOpen(true);
      qc.invalidateQueries({ queryKey: ['repairs'] });
    }
  }, [payState, pendingPay, qc]);

  useEffect(() => {
    if (profile) setProfileForm({ first_name: profile.first_name || '', last_name: profile.last_name || '', phone: profile.phone || '' });
  }, [profile]);

  const unread = useMemo(() => notifications.reduce((s, n) => s + (n.read ? 0 : 1), 0), [notifications]);

  const inUseIds = useMemo(() => {
    const s = new Set();
    const add = (list) => list.forEach((x) => {
      if (isDone(x.status)) return;
      const id = addressOf(x);
      if (id) s.add(id);
    });
    add(orders);
    add(repairs);
    return s;
  }, [orders, repairs]);

  const profileCounts = useMemo(() => ({ orders: orders.length, repairs: repairs.length, addresses: addresses.length }), [orders.length, repairs.length, addresses.length]);
  const payingRepair = useMemo(() => (pendingPay ? repairs.find((r) => r.id === pendingPay.orderId) : undefined), [repairs, pendingPay]);

  const saveProfile = useCallback(async () => {
    const phoneErr = phoneValidationError(profileForm.phone);
    if (phoneErr) { toast({ icon: 'warning', title: 'Invalid phone number', text: phoneErr }); return false; }
    const res = await mutate(['profile'], (o) => ({ ...o, ...profileForm }), () => api.put('/api/users/profile', profileForm, cfg),
      { ok: { title: 'Profile updated', text: 'Your changes have been saved.' }, fail: 'Update failed' });
    return !!res;
  }, [mutate, profileForm, cfg]);

  const deleteAccount = useCallback(async () => {
    const ok = await ask({ tone: 'danger', icon: FiTrash2, title: 'Delete account?', text: 'This action is irreversible. All your data will be permanently deleted.', confirmText: 'Yes, delete my account', cancelText: 'Keep my account' });
    if (!ok) return;
    try { await api.delete('/api/users/profile', cfg); localStorage.removeItem('authToken'); clearCache(); qc.clear(); navigate('/'); }
    catch { toast({ icon: 'error', title: 'Failed to delete account' }); }
  }, [ask, cfg, navigate, qc]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const currentToken = token || localStorage.getItem('authToken');
    try {
      if (currentToken) await api.post('/api/auth/logout', refreshToken ? { refreshToken } : {}, { headers: { Authorization: `Bearer ${currentToken}` } });
    } catch { }
    localStorage.clear(); clearCache(); qc.clear(); setToken(null); setIsAuthenticated(false);
    navigate('/login', { replace: true });
  }, [token, navigate, qc]);

  const changeLanguage = useCallback((lang) => {
    if (!lang || lang === language) return;
    setSwitching(true);
    clearTimeout(switchTimer.current);
    switchTimer.current = setTimeout(() => {
      localStorage.setItem('appLanguage', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      window.dispatchEvent(new Event('appLanguageChanged'));
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setSwitching(false);
        toast({ icon: 'success', title: tr(lang, 'languageChanged', 'Language updated'), text: LANGUAGE_NAMES[lang] });
      }));
    }, 180);
  }, [language]);

  const createAddress = useCallback(async (form) => {
    const tempId = `temp-${Date.now()}`;
    const res = await mutate(['addresses'], (o = []) => [...o, { id: tempId, ...form }], () => api.post('/api/users/addresses', form, cfg),
      { ok: { title: 'Address added', text: 'You can now use it for orders and repairs.' }, fail: 'Failed to add address' });
    if (res?.data?.id) qc.setQueryData(['addresses'], (o = []) => o.map((a) => (a.id === tempId ? res.data : a)));
  }, [mutate, cfg, qc]);
  const updateAddress = useCallback((id, form) => mutate(['addresses'], (o = []) => o.map((a) => (a.id === id ? { ...a, ...form, id } : a)), () => api.put(`/api/users/addresses/${id}`, { ...form, id }, cfg),
    { ok: { title: 'Address updated' }, fail: 'Failed to update address' }), [mutate, cfg]);
  const deleteAddress = useCallback(async (id) => {
    const ok = await ask({ tone: 'danger', icon: FiTrash2, title: 'Delete address?', text: 'This saved address will be removed from your account.', confirmText: 'Yes, delete', cancelText: 'Keep it' });
    if (ok) mutate(['addresses'], (o = []) => o.filter((a) => a.id !== id), () => api.delete(`/api/users/addresses/${id}`, cfg), { ok: { title: 'Address deleted' }, fail: 'Failed to delete address' });
  }, [ask, mutate, cfg]);

  const cancelOrder = useCallback(async (id) => {
    if (cancellingRef.current.has(id)) return;
    cancellingRef.current.add(id);
    try {
      const ok = await ask({ tone: 'danger', icon: FiXCircle, title: 'Cancel order?', text: 'The order will be cancelled and this cannot be undone.', confirmText: 'Yes, cancel order', cancelText: 'Keep order' });
      if (ok) await mutate(['orders'], (o = []) => o.map((x) => (x.id === id ? { ...x, status: 'CANCELLED' } : x)), () => api.delete(`/api/users/orders/${id}/cancel`, cfg),
        { ok: { title: 'Order cancelled' }, fail: 'Failed to cancel order', failText: "We couldn't cancel this order right now. Its status has not changed. Please try again.", wait: true });
    } finally { cancellingRef.current.delete(id); }
  }, [ask, mutate, cfg]);

  const deleteNotification = useCallback((id) => mutate(['notifications'], (o = []) => o.filter((n) => n.id !== id),
    () => api.delete(`/api/notifications/users/${id}`, cfg), { ok: { title: 'Notification deleted' }, fail: 'Failed to delete notification' }), [mutate, cfg]);

  const openPayModal = useCallback(() => setPayModalOpen(true), []);
  const hidePayModal = useCallback(() => setPayModalOpen(false), []);

  const dismissPayment = useCallback(() => {
    clearPending('repair');
    setPendingPay(null);
    setPayModalOpen(false);
  }, []);

  const openPaymentPage = useCallback(() => {
    if (pendingPay?.url) window.location.assign(pendingPay.url);
    else toast({ icon: 'warning', title: 'Payment page unavailable', text: 'Please try again or pay later from your repair requests.' });
  }, [pendingPay]);

  const { setConfirmReq } = repairActions;
  const retryPayment = useCallback(() => {
    const repair = repairs.find((r) => r.id === pendingPay?.orderId);
    dismissPayment();
    if (repair) setConfirmReq(repair);
  }, [repairs, pendingPay, dismissPayment, setConfirmReq]);

  const checkPayment = useCallback(async () => {
    if (payChecking) return;
    setPayChecking(true);
    try {
      const r = await refetchPay();
      if (r.data === 'pending') toast({ icon: 'info', title: 'Payment not received yet', text: 'If you closed the payment page, open it again.', timer: 4000 });
    } finally { setPayChecking(false); }
  }, [payChecking, refetchPay]);

  const closeOrder = useCallback(() => setSelectedOrder(null), []);
  const refreshRepairs = useCallback(() => qc.invalidateQueries({ queryKey: ['repairs'] }), [qc]);

  const tabs = useMemo(() => [
    { id: 'profile', label: t('profile'), icon: FiUser },
    { id: 'addresses', label: t('addresses'), icon: FiMapPin, badge: addresses.length },
    { id: 'orders', label: t('orders'), icon: FiBox, badge: orders.length },
    { id: 'repairs', label: t('repairs'), icon: FiTool, badge: repairs.length },
    { id: 'notifications', label: t('notifications'), icon: FiBell, badge: unread },
    { id: 'analytics', label: t('analytics'), icon: FiPieChart },
    { id: 'about', label: t('aboutUs'), icon: FiCompass },
  ], [t, addresses.length, orders.length, repairs.length, unread]);

  const loading = {
    profile: profileLoading, addresses: addressesLoading, orders: ordersLoading, repairs: repairsLoading,
    notifications: notificationsLoading, analytics: ordersLoading || repairsLoading,
  }[section];
  const go = useCallback((id) => startTransition(() => setSection(id)), []);
  const name = profile?.first_name;
  const payingId = pendingPay && !pendingPay.failed ? pendingPay.orderId : null;

  let content;
  if (loading) content = <SkeletonList />;
  else if (section === 'profile') content = <ProfileTab profile={profile} form={profileForm} setForm={setProfileForm} counts={profileCounts} onSave={saveProfile} onDelete={deleteAccount} onLogout={logout} language={language} onChangeLanguage={changeLanguage} t={t} />;
  else if (section === 'addresses') content = <AddressesTab addresses={addresses} inUseIds={inUseIds} onCreate={createAddress} onUpdate={updateAddress} onDelete={deleteAddress} darkMode={darkMode} t={t} />;
  else if (section === 'orders') content = <OrdersTab orders={orders} onDetails={setSelectedOrder} onCancel={cancelOrder} t={t} />;
  else if (section === 'repairs') content = <RepairsTab repairs={repairs} payingId={payingId} onDetails={repairActions.viewRepair} onEdit={repairActions.setEditingRepair} onAccept={repairActions.acceptQuote} onConfirm={repairActions.openConfirm} onCancel={repairActions.cancelRepair} onPay={openPayModal} t={t} />;
  else if (section === 'notifications') content = <NotificationsTab items={notifications} onDelete={deleteNotification} t={t} />;
  else if (section === 'analytics') content = <AnalyticsTab orders={orders} repairs={repairs} addresses={addresses} darkMode={darkMode} t={t} />;
  else content = <AboutTab darkMode={darkMode} t={t} />;

  return (
    <div dir={languageDirection(language)} lang={language} style={isAr ? font.style : NB_FONT_STYLE}
      className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-clip ${isAr ? font.className : ''}`}>
      {STYLE_EL}
      <Defs3D />

      <Suspense fallback={<div className="nb-gray h-[260px] w-full animate-pulse motion-reduce:animate-none sm:h-[320px]" />}>
        <Hero variant="account" darkMode={darkMode} />
      </Suspense>

      <div className={`mx-auto max-w-7xl px-4 py-8 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none sm:px-6 sm:py-12 lg:px-8 ${switching ? 'translate-y-1 opacity-0' : ''}`}>
        <div className="flex items-start gap-5 lg:gap-8">

          <aside className="sticky top-20 hidden max-h-[calc(100vh-5rem)] w-[17rem] min-w-0 flex-shrink-0 self-start overflow-y-auto overscroll-contain pb-2 pe-2 lg:block xl:w-[19rem]">
            <div className="nb-card flex flex-col gap-4 p-3 sm:p-4">
              <div className="nb-gray nb-line flex items-center gap-3 border-2 p-3">
                <IconTile Icon={FiUser} tone="em" className="h-11 w-11" iconClassName="h-5 w-5" />
                <div className="min-w-0 flex-1">
                  {name && <p className="truncate text-sm font-extrabold uppercase">{name} {profile?.last_name}</p>}
                  {profile?.email && <p className="nb-muted truncate text-xs font-semibold">{profile.email}</p>}
                </div>
                {isAuthenticated && (
                  <button type="button" onClick={logout} title={t('logout')} aria-label={t('logout')} className="nb-btn h-8 w-8 flex-shrink-0"><RiLogoutBoxRLine className="h-4 w-4 text-rose-500" /></button>
                )}
              </div>
              <nav className="flex flex-col gap-2.5" aria-label="Account sections">
                {tabs.map((tab) => <TabButton key={tab.id} tab={tab} active={section === tab.id} vertical onSelect={go} onWarm={prefetchMap} />)}
              </nav>
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <SectionHead eyebrow="Tech-Restore" title={`${t('welcomeBack')}${name ? `, ${name}` : ''}`} subtitle={t('manageAccount')} />

            <nav className="hide-scrollbar -mx-1 mb-6 flex gap-3 overflow-x-auto px-1 pb-3 pe-3 lg:hidden" aria-label="Account sections">
              {tabs.map((tab) => <TabButton key={tab.id} tab={tab} active={section === tab.id} vertical={false} onSelect={go} onWarm={prefetchMap} />)}
            </nav>

            <div key={section} className="anim-fade-up">{content}</div>
          </main>
        </div>
      </div>

      {selectedOrder && <OrderModal order={selectedOrder} onClose={closeOrder} t={t} />}
      <RepairOverlays actions={repairActions} token={token} cfg={cfg} addresses={addresses} onConfirmed={refreshRepairs} t={t} />
      {payModalOpen && pendingPay && (
        <RepairPaymentModal pay={pendingPay} repair={payingRepair} checking={payChecking}
          onClose={pendingPay.failed ? dismissPayment : hidePayModal} onOpenPayment={openPaymentPage} onCheck={checkPayment}
          onRetry={retryPayment} onDismiss={dismissPayment} />
      )}
      {confirmDlg && <ConfirmDialog dlg={confirmDlg} onSettle={settleConfirm} onClose={closeConfirm} />}
    </div>
  );
};

AccountContent.displayName = 'AccountContent';
export { queryClient, LatestRepairs };
export default function Account(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AccountContent {...props} />
    </QueryClientProvider>
  );
}