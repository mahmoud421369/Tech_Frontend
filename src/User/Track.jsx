import React, { useState, useEffect, useMemo, useCallback, useRef, useId, memo, Suspense, lazy } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiPackage, FiCheckCircle, FiTruck, FiXCircle, FiClock, FiBox, FiShoppingBag, FiLock, FiCheck, FiChevronDown,
  FiCreditCard, FiMapPin, FiCalendar, FiHeadphones, FiMessageCircle, FiShield, FiRefreshCw,
} from 'react-icons/fi';
import api from '../common/api/api';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { Defs3D } from '../components/user/Ui3D';

const Hero = lazy(() => import('../components/user/Hero'));
const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, gcTime: 10 * 60 * 1000 } } });


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

const shouldRetry = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const TRACK_TRANSLATIONS = {
  en: enTranslations.track,
  ar: arTranslations.track || arTranslations.hero?.track,
  fr: frTranslations.track || frTranslations.hero?.track,
};

const EXTRA = {
  en: { eyebrowTrack: 'Order tracking', eyebrowHelp: 'Need help?' },
  ar: { eyebrowTrack: 'تتبع الطلب', eyebrowHelp: 'تحتاج مساعدة؟' },
  fr: { eyebrowTrack: 'Suivi de commande', eyebrowHelp: "Besoin d'aide ?" },
};
const tr = (lang, key) => TRACK_TRANSLATIONS[lang]?.[key] || TRACK_TRANSLATIONS.en?.[key] || EXTRA[lang]?.[key] || EXTRA.en[key] || key;

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

const statusChip = (status) => (status === 'DELIVERED' ? 'nb-chip-a' : status === 'CANCELLED' ? 'nb-chip-r' : 'nb-chip-w');

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


const NB_CSS = `
.nb{--nb-bg:#eef9f3;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e8ebe9;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-dark .border-dotted{border-color:#3f3f3f}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:5px 5px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:52px;height:16px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.nb-chip-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-chip-r{background:#e11d48;color:#fff}
.nb-chip-w{background:#d97706;color:#fff}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-opt{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:start;cursor:pointer}
.nb-opt-active{background:var(--nb-gray)}
.nb-opt[aria-selected=true]{background:var(--nb-btn);color:var(--nb-on)}
.nb-sq{display:flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;border:2px solid var(--nb-line);background:var(--nb-card);color:var(--nb-muted)}
.nb-sq-on{background:var(--nb-btn);color:var(--nb-on);box-shadow:2px 2px 0 var(--nb-shadow)}
.nb-sq-bad{background:#e11d48;color:#fff;box-shadow:2px 2px 0 var(--nb-shadow)}
@media (prefers-reduced-motion:reduce){.nb-btn{transition:none}}
`;


const STYLE_EL = <style>{NB_CSS}</style>;

const UnderlinedTitle = memo(({ text }) => {
  const s = String(text || '');
  const i = s.lastIndexOf(' ');
  const head = i > 0 ? s.slice(0, i + 1) : '';
  const tail = i > 0 ? s.slice(i + 1) : s;
  return <>{head}<span className="nb-ul">{tail}</span></>;
});


const NbDropdown = memo(({ value, onChange, options, ariaLabel, className = '', align = 'start', placeholder = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const uid = useId();
  const listId = `${uid}-list`;
  const foundIdx = options.findIndex((o) => o.value === value);
  const selectedIdx = Math.max(0, foundIdx);
  const current = foundIdx >= 0 ? options[foundIdx] : null;

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setIsOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [isOpen]);
  useEffect(() => { if (isOpen) setActive(selectedIdx); }, [isOpen, selectedIdx]);
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
        className="nb-field flex h-11 w-full items-center justify-between gap-2 ps-3 pe-3 text-start text-xs font-bold uppercase"
      >
        <span className="truncate">{current?.label ?? placeholder}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} tabIndex={-1}
          className={`nb-menu absolute top-full z-30 mt-2 max-h-64 min-w-full overflow-y-auto overscroll-contain py-1 ${align === 'end' ? 'end-0' : 'start-0'}`}>
          {options.map((o, i) => (
            <li key={o.value} id={`${uid}-o${i}`} role="option" aria-selected={o.value === value}
              onPointerEnter={() => setActive(i)} onClick={() => choose(i)}
              className={`nb-opt whitespace-nowrap ${i === active ? 'nb-opt-active' : ''}`}>
              <span>{o.label}</span>
              {o.value === value && <FiCheck aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={3} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

const MetaTile = memo(({ icon: Icon, label, value }) => (
  <div className="nb-gray nb-line min-w-0 border-2 border-dotted p-2.5">
    <p className="nb-muted flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide">
      <Icon className="nb-ic h-3 w-3 flex-shrink-0" /> <span className="truncate">{label}</span>
    </p>
    <p className="mt-0.5 truncate text-xs font-extrabold">{value}</p>
  </div>
));

const StepRow = memo(({ step, isCompleted, isCurrent, isCancelledStep, isLast, timestamp, t }) => {
  const Icon = step.icon;
  const active = isCompleted || isCancelledStep;
  return (
    <li className={`relative flex gap-3 ${isLast ? '' : 'pb-5'}`} aria-current={isCurrent && !isCancelledStep ? 'step' : undefined}>
      {!isLast && (
        <span aria-hidden="true" className={`absolute start-[17px] top-9 bottom-0 w-0.5 ${isCompleted && !isCurrent ? 'bg-[color:var(--nb-btn)]' : 'bg-[color:var(--nb-muted)] opacity-40'}`} />
      )}
      <span className={`nb-sq relative z-10 ${isCancelledStep ? 'nb-sq-bad' : isCompleted ? 'nb-sq-on' : ''}`}>
        {isCurrent && !isCancelledStep && <span aria-hidden="true" className="absolute -inset-1 animate-ping border-2 border-[color:var(--nb-accent)] opacity-60 motion-reduce:animate-none" />}
        <Icon className="relative h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className={`text-sm font-extrabold uppercase leading-snug ${isCancelledStep ? 'text-rose-500' : active ? '' : 'nb-muted opacity-70'}`}>{step.label}</p>
          {timestamp && active && <span className="nb-muted text-[11px] font-bold">{timestamp}</span>}
        </div>
        <p className={`nb-muted text-xs ${active ? '' : 'opacity-60'}`}>{step.sub}</p>
        {isCurrent && !isCancelledStep && <span className="nb-chip nb-chip-a mt-1.5">{t('currentStatus')}</span>}
      </div>
    </li>
  );
});

const InfoPanel = memo(({ rows, status, statusText, t }) => (
  <aside className="nb-card flex h-fit flex-col gap-5 p-4 sm:p-5 lg:sticky lg:top-20">
    <div className="nb-gray nb-line flex items-center gap-3 border-2 p-3">
      <span className="nb-chip nb-chip-a !p-2.5"><FiBox className="h-6 w-6" /></span>
      <div className="min-w-0">
        <p className="nb-muted text-[10px] font-extrabold uppercase tracking-wider">{t('liveTracking')}</p>
        <span className={`nb-chip mt-1 ${statusChip(status)}`}>{statusText}</span>
      </div>
    </div>

    {rows.length > 0 && (
      <div>
        <h4 className="mb-3 text-xs font-extrabold uppercase"><span className="nb-ul">{t('orderDetails')}</span></h4>
        <ul className="space-y-3">
          {rows.map(({ icon: Icon, label, value }) => (
            <li key={label + value} className="flex items-start gap-2.5">
              <span className="nb-chip nb-chip-a !p-1.5"><Icon className="h-3.5 w-3.5" /></span>
              <div className="min-w-0">
                <p className="nb-muted text-[11px] font-bold uppercase">{label}</p>
                <p className="truncate text-sm font-extrabold">{value}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className="nb-gray nb-line flex items-start gap-2 border-2 border-dotted p-3 text-xs">
      <FiShield className="nb-ic mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
      <p className="opacity-90"><span className="font-extrabold">{t('trackingHelp')}</span> {t('trackingHelpText')}</p>
    </div>
  </aside>
));

export const CantFindCard = memo(({ t }) => (
  <div className="nb-card flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
    <span className="nb-chip nb-chip-a !p-2.5"><FiHeadphones className="h-5 w-5" /></span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-extrabold uppercase">{t('cantFindTitle')}</p>
      <p className="nb-muted text-xs">{t('cantFindText')}</p>
    </div>
    <div className="flex w-full gap-3 sm:w-auto">
      <a href="/support" className="nb-btn flex-1 px-3 py-2 text-xs uppercase sm:flex-none"><FiHeadphones className="h-3.5 w-3.5" /> {t('support')}</a>
      <a href="/chat" className="nb-btn nb-btn-a flex-1 px-3 py-2 text-xs uppercase sm:flex-none"><FiMessageCircle className="h-3.5 w-3.5" /> {t('liveChat')}</a>
    </div>
  </div>
));

const StateCard = ({ icon: Icon = FiBox, title, text, children }) => (
  <div className="nb-card mx-auto max-w-md px-6 py-10 text-center">
    <span className="nb-chip nb-chip-a mx-auto mb-4 !p-3"><Icon className="h-8 w-8" /></span>
    <p className="text-lg font-extrabold uppercase"><UnderlinedTitle text={title} /></p>
    {text && <p className="mt-3 mb-6 text-sm opacity-80">{text}</p>}
    {children}
  </div>
);

const SKELETON_W = [[60, 40], [72, 52], [50, 34], [66, 46]];
const TrackSkeleton = () => (
  <div className="nb-card space-y-4 p-5" aria-busy="true">
    <div className="nb-gray nb-line h-11 animate-pulse border-2 motion-reduce:animate-none" />
    {SKELETON_W.map(([a, b], i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="nb-gray nb-line h-9 w-9 animate-pulse border-2 motion-reduce:animate-none" />
        <div className="flex-1 space-y-1.5">
          <div className="nb-gray h-3.5 animate-pulse motion-reduce:animate-none" style={{ width: `${a}%` }} />
          <div className="nb-gray h-3 animate-pulse opacity-70 motion-reduce:animate-none" style={{ width: `${b}%` }} />
        </div>
      </div>
    ))}
  </div>
);

const TrackContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const t = useCallback((k) => tr(language, k), [language]);
  const loc = LOCALES[language] || 'en-GB';
  const isAr = language === 'ar';
  const [token] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null));
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => { ensureNbFont(); }, []);
  useEffect(() => { document.title = 'Track your order | Tech-Restore'; }, []);

  const { data: orders = [], isLoading, isError, isFetching, refetch } = useQuery({
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
    [isCancelled, t]
  );

  const timestamps = useMemo(
    () => (order ? steps.map((s) => stepTimestamp(order, s.key, loc)) : []),
    [order, steps, loc]
  );
  const meta = useMemo(() => (order ? buildMeta(order, t, loc) : []), [order, t, loc]);
  const rows = useMemo(() => (order ? buildDetails(order, t, loc) : []), [order, t, loc]);
  const orderOptions = useMemo(
    () => orders.map((o) => ({ value: o.id, label: `${t('orderNumber')} #${shortId(o)} · ${statusLabel(o.status)}` })),
    [orders, t, statusLabel]
  );

  let body;
  if (!token) {
    body = (
      <StateCard icon={FiLock} title={t('loginRequired')} text={t('loginTrack')}>
        <a href="/login" className="nb-btn nb-btn-a px-5 py-2.5 text-sm uppercase"><FiLock className="h-4 w-4" /> {t('goToLogin')}</a>
      </StateCard>
    );
  } else if (isLoading) {
    body = <TrackSkeleton />;
  } else if (isError) {
    body = (
      <StateCard title={t('loadErrorTitle')} text={t('loadErrorText')}>
        <button type="button" onClick={() => refetch()} className="nb-btn nb-btn-a px-5 py-2.5 text-sm uppercase"><FiRefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} /> {t('tryAgain')}</button>
      </StateCard>
    );
  } else if (!order) {
    body = (
      <StateCard icon={FiShoppingBag} title={t('noOrders')} text={t('startShopping')}>
        <a href="/devices" className="nb-btn nb-btn-a px-5 py-2.5 text-sm uppercase"><FiShoppingBag className="h-4 w-4" /> {t('startShoppingButton')}</a>
      </StateCard>
    );
  } else {
    body = (
      <div className="grid items-start gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="nb-card min-w-0 space-y-6 p-4 sm:p-6">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />{t('selectOrder')}</p>
            <NbDropdown ariaLabel={t('selectOrder')} value={order.id} onChange={setSelectedId} options={orderOptions} className="w-full" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
              {t('orderNumber')} <span className="nb-ul">#{shortId(order)}</span>
            </h2>
            <span className={`nb-chip ${statusChip(order.status)}`}>{statusLabel(order.status)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {meta.map((m) => <MetaTile key={m.label} {...m} />)}
          </div>

          {!isCancelled && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="nb-muted text-xs font-extrabold uppercase">{t('overallProgress')}</p>
                <p className="text-xs font-extrabold tabular-nums" dir="ltr">{progressPct}%</p>
              </div>
              <div className="nb-gray nb-line h-4 overflow-hidden border-2" role="progressbar" aria-label={t('overallProgress')} aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-[color:var(--nb-btn)] transition-[width] duration-700 ease-out motion-reduce:transition-none" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}

          <ol>
            {steps.map((step, i) => {
              const idx = STEP_INDEX[step.key];
              return (
                <StepRow
                  key={step.key} step={step} t={t}
                  isLast={i === steps.length - 1}
                  isCompleted={!isCancelled && idx <= currentIdx}
                  isCurrent={idx === currentIdx}
                  isCancelledStep={isCancelled && step.key === 'CANCELLED'}
                  timestamp={timestamps[i]}
                />
              );
            })}
          </ol>

          <div className="flex justify-center">
            <a href="/devices" className="nb-btn nb-btn-a px-5 py-2.5 text-sm uppercase"><FiShoppingBag className="h-4 w-4" /> {t('exploreDevices')}</a>
          </div>
        </section>

        <InfoPanel rows={rows} status={order.status} statusText={statusLabel(order.status)} t={t} />
      </div>
    );
  }

  return (
    <div
      dir={languageDirection(language)} lang={language} style={isAr ? undefined : NB_FONT_STYLE}
      className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-hidden pb-14 ${isAr ? 'font-cairo' : ''}`}
    >
      {STYLE_EL}
      <Defs3D />
      <Suspense fallback={<div className="nb-gray h-[260px] w-full animate-pulse motion-reduce:animate-none sm:h-[320px]" />}>
        <Hero variant="track" darkMode={darkMode} />
      </Suspense>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
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