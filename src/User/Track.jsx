import React, { useState, useEffect, useMemo, useCallback, memo, Suspense, lazy } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiPackage, FiCheckCircle, FiTruck, FiXCircle, FiClock, FiBox, FiShoppingBag, FiLock,
  FiCreditCard, FiMapPin, FiCalendar, FiHeadphones, FiMessageCircle, FiShield, FiRefreshCw,
} from 'react-icons/fi';
import api from '../api';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { Defs3D, Glyph3D, Btn3D, Chip3D, TrustStrip } from '../components/Ui3D';

const Hero = lazy(() => import('../components/Hero'));
const queryClient = new QueryClient();

/* ───────────── helpers ───────────── */
const TRACK_TRANSLATIONS = {
  en: enTranslations.track,
  ar: arTranslations.track || arTranslations.hero?.track,
  fr: frTranslations.track || frTranslations.hero?.track,
};
const tr = (lang, key) => TRACK_TRANSLATIONS[lang]?.[key] || TRACK_TRANSLATIONS.en?.[key] || key;

const STATUS_STEPS = [
  { key: 'PENDING', labelKey: 'orderPlaced', subKey: 'orderReceived', icon: FiClock },
  { key: 'CONFIRMED', labelKey: 'confirmed', subKey: 'orderConfirmed', icon: FiCheckCircle },
  { key: 'PROCESSING', labelKey: 'processing', subKey: 'itemsPrepared', icon: FiPackage },
  { key: 'FINISHPROCESSING', labelKey: 'readyToShip', subKey: 'packedReady', icon: FiBox },
  { key: 'SHIPPED', labelKey: 'outForDelivery', subKey: 'onTheWay', icon: FiTruck },
  { key: 'DELIVERED', labelKey: 'delivered', subKey: 'packageDelivered', icon: FiCheckCircle },
  { key: 'CANCELLED', labelKey: 'cancelled', subKey: 'orderCancelled', icon: FiXCircle },
];

const fmtDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};
const fmtDateTime = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};
const fmtMoney = (v) => (v === undefined || v === null || Number.isNaN(Number(v)) ? null : `EGP ${Number(v).toLocaleString()}`);
const addDays = (v, n) => { const d = v ? new Date(v) : new Date(); d.setDate(d.getDate() + n); return d; };

const stepTimestamp = (order, key) => {
  const h = order?.statusHistory?.find((x) => x.status === key);
  if (h?.timestamp) return fmtDateTime(h.timestamp);
  if (key === order?.status && key !== order?.statusHistory?.[0]?.status) return fmtDateTime(order?.updatedAt);
  return null;
};

const badgeCls = (status) =>
  status === 'DELIVERED' ? 'bg-emerald-500 text-white'
    : status === 'CANCELLED' ? 'bg-rose-500 text-white'
      : 'bg-amber-500 text-white';

const buildMeta = (o, t) => [
  { icon: FiPackage, label: t('trackingId'), value: o.trackingNumber ?? o.id?.slice(0, 12) },
  { icon: FiTruck, label: t('carrier'), value: o.carrier ?? t('standardCourier') },
  { icon: FiCalendar, label: t('orderDate'), value: fmtDate(o.createdAt) ?? '—' },
  { icon: FiClock, label: t('lastUpdated'), value: fmtDateTime(o.updatedAt) ?? '—' },
];

const buildDetails = (o, t) => {
  const count = o.items?.length ?? o.orderItems?.length ?? null;
  const total = fmtMoney(o.totalAmount ?? o.total ?? o.amount);
  const payment = o.paymentMethod ?? o.payment_method ?? null;
  const address = o.shippingAddress ?? o.address ?? null;
  const delivered = o.status === 'DELIVERED';
  const eta = delivered ? fmtDate(o.deliveredAt ?? o.updatedAt) : fmtDate(o.estimatedDelivery) ?? fmtDate(addDays(o.createdAt, 5));
  return [
    count !== null && { icon: FiPackage, label: t('items'), value: `${count} ${count === 1 ? t('item') : t('items')}` },
    total && { icon: FiCreditCard, label: t('orderTotal'), value: total },
    payment && { icon: FiCreditCard, label: t('payment'), value: payment },
    address && { icon: FiMapPin, label: t('deliveringTo'), value: typeof address === 'string' ? address : [address.street, address.city].filter(Boolean).join(', ') },
    o.status !== 'CANCELLED' && eta && { icon: FiCalendar, label: delivered ? t('deliveredOn') : t('estimatedDelivery'), value: eta },
  ].filter(Boolean);
};

/* ───────────── small pieces ───────────── */
const card = (dm) => `rounded-2xl border ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`;

const MetaTile = memo(({ icon: Icon, label, value, darkMode }) => (
  <div className={`min-w-0 rounded-xl border p-2.5 ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
    <p className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      <Icon className="h-3 w-3 flex-shrink-0 text-emerald-500" /> <span className="truncate">{label}</span>
    </p>
    <p className={`mt-0.5 truncate text-xs font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{value}</p>
  </div>
));

const StepRow = memo(({ step, isCompleted, isCurrent, isCancelledStep, isLast, darkMode, timestamp, t }) => {
  const Icon = step.icon;
  const active = isCompleted || isCancelledStep;
  return (
    <li className={`relative flex gap-3 ${isLast ? '' : 'pb-4'}`}>
      {!isLast && (
        <span aria-hidden="true" className={`absolute start-[17px] top-9 bottom-0 w-0.5 ${isCompleted && !isCurrent ? 'bg-emerald-400' : darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      )}
      <span className={`relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
        isCancelledStep ? 'bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-[0_3px_0_0_#9f1239]'
          : isCompleted ? 'bg-gradient-to-br from-emerald-300 to-emerald-600 text-white shadow-[0_3px_0_0_#047857]'
            : darkMode ? 'bg-gray-800 text-gray-500 ring-1 ring-gray-700' : 'bg-gray-50 text-gray-400 ring-1 ring-gray-200'}`}>
        {isCurrent && !isCancelledStep && <span className="absolute inset-0 animate-ping rounded-xl bg-emerald-400/40 motion-reduce:animate-none" />}
        <Icon className="relative h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className={`text-sm font-bold leading-snug ${
            isCancelledStep ? 'text-rose-500' : isCompleted ? (darkMode ? 'text-emerald-400' : 'text-emerald-700') : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{step.label}</p>
          {timestamp && active && <span className={`text-[11px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{timestamp}</span>}
        </div>
        <p className={`text-xs ${active ? (darkMode ? 'text-gray-400' : 'text-gray-500') : darkMode ? 'text-gray-600' : 'text-gray-300'}`}>{step.sub}</p>
        {isCurrent && !isCancelledStep && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold text-white">{t('currentStatus')}</span>
        )}
      </div>
    </li>
  );
});

const InfoPanel = memo(({ darkMode, rows, status, statusText, t }) => (
  <aside className={`${card(darkMode)} flex h-fit flex-col gap-4 p-4 lg:sticky lg:top-20`}>
    <div className={`flex items-center gap-3 rounded-xl p-3 ${darkMode ? 'bg-emerald-900/30' : 'bg-gradient-to-br from-emerald-50 to-emerald-100'}`}>
      <Glyph3D name="box" fallback="box" className="h-12 w-12 flex-shrink-0" />
      <div className="min-w-0">
        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-emerald-800/70'}`}>{t('liveTracking')}</p>
        <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${badgeCls(status)}`}>{statusText}</span>
      </div>
    </div>

    {rows.length > 0 && (
      <div>
        <h4 className={`mb-2 text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('orderDetails')}</h4>
        <ul className="space-y-2">
          {rows.map(({ icon: Icon, label, value }) => (
            <li key={label + value} className="flex items-start gap-2.5">
              <Chip3D className="h-7 w-7 flex-shrink-0"><Icon className="h-3.5 w-3.5" /></Chip3D>
              <div className="min-w-0">
                <p className={`text-[11px] font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                <p className={`truncate text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{value}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${darkMode ? 'border-gray-700 bg-gray-900/50 text-gray-400' : 'border-emerald-100 bg-emerald-50/60 text-gray-500'}`}>
      <FiShield className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
      <p><span className="font-semibold text-emerald-500">{t('trackingHelp')}</span> {t('trackingHelpText')}</p>
    </div>
  </aside>
));

const CantFindCard = memo(({ darkMode }) => (
  <div className={`${card(darkMode)} flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center`}>
    <Chip3D className="h-11 w-11 flex-shrink-0"><FiHeadphones className="h-5 w-5" /></Chip3D>
    <div className="min-w-0 flex-1">
      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Can&apos;t find your tracking number?</p>
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Look in your confirmation email or log in to your Tech-Restore account.</p>
    </div>
    <div className="flex w-full gap-2 sm:w-auto">
      <Btn3D as="a" href="/support" tone="soft" darkMode={darkMode} className="flex-1 px-3 py-2 text-xs sm:flex-none"><FiHeadphones className="h-3.5 w-3.5" /> Support</Btn3D>
      <Btn3D as="a" href="/chat" className="flex-1 px-3 py-2 text-xs sm:flex-none"><FiMessageCircle className="h-3.5 w-3.5" /> Live chat</Btn3D>
    </div>
  </div>
));

const StateCard = ({ darkMode, glyph = 'box', title, text, children }) => (
  <div className={`${card(darkMode)} mx-auto max-w-md px-6 py-10 text-center`}>
    <span className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl ${darkMode ? 'bg-emerald-900/40' : 'bg-gradient-to-br from-emerald-50 to-emerald-100'}`}>
      <Glyph3D name={glyph} fallback="box" className="h-11 w-11" />
    </span>
    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
    {text && <p className={`mt-1 mb-5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{text}</p>}
    {children}
  </div>
);

const TrackSkeleton = ({ darkMode }) => (
  <div className={`${card(darkMode)} space-y-4 p-5`}>
    <div className={`h-10 animate-pulse rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3">
        <div className={`h-9 w-9 animate-pulse rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />
        <div className="flex-1 space-y-1.5">
          <div className={`h-3.5 animate-pulse rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} style={{ width: `${[60, 72, 50, 66][i]}%` }} />
          <div className={`h-3 animate-pulse rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`} style={{ width: `${[40, 52, 34, 46][i]}%` }} />
        </div>
      </div>
    ))}
  </div>
);

/* ───────────── page ───────────── */
const TrackContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const t = useCallback((k) => tr(language, k), [language]);
  const [token] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null));
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => { document.title = 'Track your order | Tech-Restore'; }, []);

  const { data: orders = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['track_orders', token],
    queryFn: async () => {
      const res = await api.get('/api/users/orders', { headers: { Authorization: `Bearer ${token}` } });
      const list = res.data?.content || res.data || [];
      return Array.isArray(list) ? list.filter(Boolean) : [];
    },
    enabled: !!token,
    staleTime: 30 * 1000,
  });

  // Derived – no effect/extra render needed to "auto-select" the first order.
  const order = useMemo(() => orders.find((o) => o.id === selectedId) || orders[0] || null, [orders, selectedId]);
  const isCancelled = order?.status === 'CANCELLED';
  const currentIdx = useMemo(() => STATUS_STEPS.findIndex((s) => s.key === order?.status), [order?.status]);
  const progressPct = isCancelled || currentIdx < 0 ? 0 : Math.min(100, Math.round((currentIdx / (STATUS_STEPS.length - 2)) * 100));

  const statusLabel = useCallback((status) => {
    const s = STATUS_STEPS.find((x) => x.key === status);
    return s ? t(s.labelKey) : status;
  }, [t]);

  const steps = useMemo(
    () => STATUS_STEPS
      .filter((s) => (isCancelled ? s.key !== 'DELIVERED' : s.key !== 'CANCELLED'))
      .map((s) => ({ ...s, label: t(s.labelKey), sub: t(s.subKey) })),
    [isCancelled, t]
  );
  const meta = useMemo(() => (order ? buildMeta(order, t) : []), [order, t]);
  const rows = useMemo(() => (order ? buildDetails(order, t) : []), [order, t]);

  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const shortId = (o) => o.id?.slice(0, 8);

  let body;
  if (!token) {
    body = (
      <StateCard darkMode={darkMode} glyph="store" title={t('loginRequired')} text={t('loginTrack')}>
        <Btn3D as="a" href="/login" className="px-5 py-2.5 text-sm"><FiLock className="h-4 w-4" /> {t('goToLogin')}</Btn3D>
      </StateCard>
    );
  } else if (isLoading) {
    body = <TrackSkeleton darkMode={darkMode} />;
  } else if (isError) {
    body = (
      <StateCard darkMode={darkMode} title="We couldn’t load your orders" text="Check your connection and try again.">
        <Btn3D onClick={() => refetch()} className="px-5 py-2.5 text-sm"><FiRefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Try again</Btn3D>
      </StateCard>
    );
  } else if (!order) {
    body = (
      <StateCard darkMode={darkMode} title={t('noOrders')} text={t('startShopping')}>
        <Btn3D as="a" href="/devices" className="px-5 py-2.5 text-sm"><FiShoppingBag className="h-4 w-4" /> {t('startShoppingButton')}</Btn3D>
      </StateCard>
    );
  } else {
    body = (
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className={`${card(darkMode)} min-w-0 space-y-5 p-4 sm:p-5`}>
          {/* order picker */}
          <div>
            <label htmlFor="order-select" className={`mb-1.5 block text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Select order</label>
            <select
              id="order-select" value={order.id} onChange={(e) => setSelectedId(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500 ${darkMode ? 'border-gray-700 bg-gray-900 text-gray-100' : 'border-gray-200 bg-white text-gray-800'}`}
            >
              {orders.map((o) => <option key={o.id} value={o.id}>Order #{shortId(o)} · {statusLabel(o.status)}</option>)}
            </select>
          </div>

          {/* summary */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Order <span className="text-emerald-500">#{shortId(order)}</span>
            </p>
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${badgeCls(order.status)}`}>{statusLabel(order.status)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {meta.map((m) => <MetaTile key={m.label} {...m} darkMode={darkMode} />)}
          </div>

          {!isCancelled && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className={`text-xs font-semibold ${muted}`}>{t('overallProgress')}</p>
                <p className="text-xs font-bold text-emerald-500">{progressPct}%</p>
              </div>
              <div className={`h-2 overflow-hidden rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-[width] duration-700 ease-out" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}

          <ol>
            {steps.map((step, i) => {
              const idx = STATUS_STEPS.findIndex((s) => s.key === step.key);
              return (
                <StepRow
                  key={step.key} step={step} t={t} darkMode={darkMode}
                  isLast={i === steps.length - 1}
                  isCompleted={!isCancelled && idx <= currentIdx}
                  isCurrent={idx === currentIdx}
                  isCancelledStep={isCancelled && step.key === 'CANCELLED'}
                  timestamp={stepTimestamp(order, step.key)}
                />
              );
            })}
          </ol>

          <div className="flex justify-center">
            <Btn3D as="a" href="/devices" className="px-5 py-2.5 text-sm"><FiShoppingBag className="h-4 w-4" /> Explore more devices</Btn3D>
          </div>
        </section>

        <InfoPanel darkMode={darkMode} rows={rows} status={order.status} statusText={statusLabel(order.status)} t={t} />
      </div>
    );
  }

  return (
    <div dir={languageDirection(language)} className={`min-h-screen pb-14 ${language === 'ar' ? 'font-cairo' : 'font-poppins'} ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Defs3D />
      <Suspense fallback={<div className={`h-[260px] w-full animate-pulse sm:h-[320px] ${darkMode ? 'bg-gray-900' : 'bg-emerald-50'}`} />}>
        <Hero variant="track" darkMode={darkMode} />
      </Suspense>
      <TrustStrip darkMode={darkMode} />
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {body}
        <CantFindCard darkMode={darkMode} />
      </div>
    </div>
  );
});

export default function Track(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <TrackContent {...props} />
    </QueryClientProvider>
  );
}