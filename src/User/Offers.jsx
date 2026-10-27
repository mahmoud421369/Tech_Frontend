import React, {
  useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, memo, useTransition, lazy, Suspense,
} from 'react';
import { Link, useNavigate, useNavigationType } from 'react-router-dom';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiX, FiCalendar, FiClock, FiTag, FiArrowRight, FiChevronLeft, FiChevronRight, FiTrendingUp, FiRefreshCw,
} from 'react-icons/fi';
import { RiStoreLine } from 'react-icons/ri';
import { LazyMotion, MotionConfig, domAnimation, m, AnimatePresence } from 'framer-motion';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { LISTING_CSS, useLangFont, useModalLock, clean } from '../components/user/ListingKit';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import { IsoIllustration } from '../components/user/IsoIllustrations';
import { authHeaders, expireSession, isUnauthorized, useAuthGuard } from '../common/utils/auth';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

const LatestRepairs = lazy(() => import('./Account').then((mod) => ({ default: mod.LatestRepairs })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false, gcTime: 10 * 60 * 1000 } },
});

const OFFER_TRANSLATIONS = {
  en: enTranslations.offersPage,
  ar: arTranslations.offersPage || arTranslations.hero?.offersPage,
  fr: frTranslations.offersPage || frTranslations.hero?.offersPage,
};
const LOCAL_TEXT = {
  en: { crumbHome: 'Home', crumbOffers: 'Offers' },
  ar: { crumbHome: 'الرئيسية', crumbOffers: 'العروض' },
  fr: { crumbHome: 'Accueil', crumbOffers: 'Offres' },
};
const tr = (language, key) =>
  OFFER_TRANSLATIONS[language]?.[key] ||
  LOCAL_TEXT[language]?.[key] ||
  OFFER_TRANSLATIONS.en?.[key] ||
  LOCAL_TEXT.en[key] ||
  key;

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

const NB_CSS = `
.nb{--nb-bg:#eef9f3;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e8ebe9;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:5px 5px 0 var(--nb-shadow);transition:transform .15s ease,box-shadow .15s ease}
.nb-lift:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:52px;height:16px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.nb-chip-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-chip-w{background:#fbbf24;color:#04261a}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-arrow{display:inline-flex;align-items:center;justify-content:center;flex:none;width:34px;height:34px;background:var(--nb-btn);color:var(--nb-on);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);transition:transform .15s ease}
.nb-lift:hover .nb-arrow{transform:translateX(3px)}
.nb[dir=rtl] .nb-lift:hover .nb-arrow{transform:translateX(-3px)}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
@keyframes pgIn{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
.pg-enter{animation:pgIn 180ms cubic-bezier(.16,1,.3,1) backwards}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn,.nb-arrow{transition:none}.pg-enter{animation:none}}
`;
const STYLE_EL = <style>{`${UI3D_CSS}${EXTRAS_CSS}${LISTING_CSS}${NB_CSS}`}</style>;

const EASE = [0.16, 1, 0.3, 1];
const BACKDROP_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } },
};
const PANEL_MOTION = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.26, ease: EASE } },
  exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18, ease: 'easeIn' } },
};
const GPU = { willChange: 'transform, opacity' };

const useScrollTopOnEnter = () => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};

const useNearViewport = (rootMargin = '300px') => {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return undefined;
    if (typeof IntersectionObserver === 'undefined') { setNear(true); return undefined; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); io.disconnect(); }
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [near, rootMargin]);
  return [ref, near];
};

const PAGE_SIZE = 6;
const SOON_DAYS = 3;
const LOCALES = { en: 'en-GB', ar: 'ar-EG', fr: 'fr-FR' };

const numCache = {};
const money = (n, language) => {
  const loc = LOCALES[language] || 'en-GB';
  numCache[loc] ||= new Intl.NumberFormat(loc, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `EGP ${numCache[loc].format(Number(n || 0))}`;
};

const fmtCache = {};
const dateFmt = (language, withYear) => {
  const loc = LOCALES[language] || 'en-GB';
  const k = `${loc}:${withYear}`;
  fmtCache[k] ||= new Intl.DateTimeFormat(loc, withYear ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
  return fmtCache[k];
};
const rtfCache = {};
const rtf = (language) => {
  const loc = LOCALES[language] || 'en-GB';
  rtfCache[loc] ||= new Intl.RelativeTimeFormat(loc, { numeric: 'auto' });
  return rtfCache[loc];
};

const toDate = (v) => {
  if (v == null || v === '') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const daysLeftNum = (end) => {
  const e = toDate(end);
  if (!e) return null;
  const diff = Math.ceil((e - new Date()) / 86400000);
  return diff < 0 ? null : diff;
};

const formatRange = (start, end, language) => {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return '';
  return `${dateFmt(language, false).format(s)} — ${dateFmt(language, true).format(e)}`;
};

const normType = (t) => {
  const s = String(t ?? '').toUpperCase();
  if (s === 'PERCENTAGE' || s === 'PERCENT') return 'PERCENTAGE';
  if (s === 'FIXED_AMOUNT' || s === 'FIXED_VALUE' || s === 'FIXED') return 'FIXED_AMOUNT';
  return '';
};

const normalizeOffer = (o) => {
  const type = normType(o.discountType);
  const isPct = type === 'PERCENTAGE';
  const raw = Math.max(0, Number(o.discountValue) || 0);
  return {
    id: String(o.id),
    name: clean(String(o.name ?? ''), 120),
    description: o.description ? clean(String(o.description), 600) : '',
    discountType: type,
    discountValue: isPct ? Math.min(raw, 100) : raw,
    startDate: o.startDate || null,
    endDate: o.endDate || null,
    status: o.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
    shopId: o.shopId != null ? String(o.shopId) : '',
    shopName: o.shopName ? clean(String(o.shopName), 80) : '',
  };
};

const shopPath = (id) => `/shops/${encodeURIComponent(id)}`;
const findInList = (qc, id) => (qc.getQueryData(['offers']) || []).find((o) => o.id === id);

const EMPTY_OFFER = { discountType: '', discountValue: 0, status: 'INACTIVE' };

const useOfferMeta = (offer, language) =>
  useMemo(() => {
    const days = daysLeftNum(offer.endDate);
    const isPct = offer.discountType === 'PERCENTAGE';
    const isFixed = offer.discountType === 'FIXED_AMOUNT';
    return {
      isPct,
      isFixed,
      isActive: offer.status === 'ACTIVE',
      remaining: days === null ? null : rtf(language).format(days, 'day'),
      urgent: days !== null && days <= SOON_DAYS,
      range: formatRange(offer.startDate, offer.endDate, language),
      amount: isPct ? `${offer.discountValue}%` : isFixed ? money(offer.discountValue, language) : String(offer.discountValue),
    };
  }, [offer, language]);

const OffersBanner = memo(({ darkMode, eyebrow, title, subtitle, t }) => (
  <section className="nb-gray nb-line relative mt-20 overflow-hidden border-b-2">
    <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 sm:pb-36 sm:pt-12 lg:px-8 lg:pb-44">
      <nav aria-label="Breadcrumb" className="relative z-10 flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase sm:text-sm">
        <Link to="/" className="underline underline-offset-4 hover:no-underline">{t('crumbHome')}</Link>
        <FiChevronRight className="h-3 w-3 flex-shrink-0 rtl:rotate-180" />
        <span className="nb-muted max-w-[14rem] truncate" aria-current="page">{t('crumbOffers')}</span>
      </nav>
      <p className="relative z-10 mt-5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide rtl:tracking-normal"><span className="nb-bar" aria-hidden="true" />{eyebrow}</p>
      <h1 className="relative z-10 mt-3 max-w-xl text-2xl font-extrabold uppercase leading-tight sm:text-4xl lg:text-5xl"><span className="nb-ul">{title}</span></h1>
      {subtitle && <p className="relative z-10 mt-4 max-w-xl text-sm font-medium opacity-80 sm:text-base">{subtitle}</p>}
      <div aria-hidden="true" className="pointer-events-none absolute bottom-24 end-4 hidden h-40 w-40 sm:block lg:bottom-32 lg:end-16 lg:h-56 lg:w-56">
        <IsoIllustration type="offersCard" tone="emerald" darkMode={darkMode} onGreen={false} className="h-full w-full" />
      </div>
    </div>
  </section>
));

const StatsRow = memo(({ stats }) => (
  <dl className="grid grid-cols-3 gap-3 pe-2 pb-2 sm:gap-6">
    {stats.map(({ label, value, Icon }) => (
      <div key={label} className="nb-card min-w-0 p-3 text-center sm:p-5">
        <dt className="nb-muted mb-1.5 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase sm:text-xs">
          <Icon aria-hidden="true" className="nb-ic h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{label}</span>
        </dt>
        <dd dir="ltr" className="text-2xl font-extrabold tabular-nums sm:text-4xl">{value}</dd>
      </div>
    ))}
  </dl>
));

const Skeletons = memo(({ count, className, itemClassName }) => (
  <div className={className} role="status" aria-label="Loading">
    {Array.from({ length: count }).map((_, i) => <div key={i} className={`nb-gray animate-pulse motion-reduce:animate-none ${itemClassName}`} />)}
  </div>
));

const StateBox = memo(({ darkMode, label, hint, onRetry, fetching }) => (
  <div className="py-10 text-center">
    <IsoIllustration type="offers" tone="emerald" darkMode={darkMode} onGreen={false} className="mx-auto mb-3 h-32 w-32" />
    <p className="text-sm font-extrabold uppercase sm:text-base">{label}</p>
    {hint && <p className="nb-muted mt-2 text-xs font-medium sm:text-sm">{hint}</p>}
    {onRetry && (
      <button type="button" onClick={() => onRetry()} className="nb-btn nb-btn-a mx-auto mt-4 px-5 py-2.5 text-sm uppercase">
        <FiRefreshCw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} /> Try again
      </button>
    )}
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

const Pager = memo(({ page, totalPages, onChange, pending }) => {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" aria-busy={pending} className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button type="button" className="nb-btn h-10 w-10" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><FiChevronLeft className="nb-flip h-4 w-4" /></button>
      {pageWindow(page, totalPages).map((x) => (typeof x === 'number' ? (
        <button key={x} type="button" onClick={() => onChange(x)} aria-label={`Page ${x}`} aria-current={x === page ? 'page' : undefined}
          className={`nb-btn h-10 min-w-[2.5rem] px-2 text-sm tabular-nums ${x === page ? 'nb-btn-on' : ''}`}>{x}</button>
      ) : <span key={x} aria-hidden="true" className="px-1 font-extrabold">…</span>))}
      <button type="button" className="nb-btn h-10 w-10" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page"><FiChevronRight className="nb-flip h-4 w-4" /></button>
    </nav>
  );
});

const StatusChips = memo(({ isActive, remaining, urgent, t }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <span className={`nb-chip ${isActive ? 'nb-chip-a' : ''}`}>{isActive ? t('active') : t('inactive')}</span>
    {remaining && <span className={`nb-chip ${urgent ? 'nb-chip-w' : ''}`}><FiClock aria-hidden="true" className="h-3 w-3" />{remaining}</span>}
  </div>
));

const OfferCard = memo(({ offer, index, language, onViewDetail, t }) => {
  const m_ = useOfferMeta(offer, language);
  const open = useCallback(() => onViewDetail(offer.id), [onViewDetail, offer.id]);
  const stub = m_.isPct ? 'bg-amber-400 text-[#04261a]' : 'bg-[color:var(--nb-btn)] text-[color:var(--nb-on)]';

  return (
    <article
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}
      tabIndex={0}
      aria-label={offer.name}
      style={{ '--i': index % 8 }}
      className="anim-fade-up nb-card nb-lift group relative flex h-full cursor-pointer flex-col focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[color:var(--nb-accent)]"
    >
      <div className={`nb-line flex h-24 items-baseline justify-center gap-1.5 border-b-2 pt-5 ${stub}`}>
        <span dir="ltr" className="text-5xl font-extrabold leading-none tabular-nums">{offer.discountValue}{m_.isPct ? '%' : ''}</span>
        <span className="text-xs font-extrabold uppercase">{m_.isFixed ? 'EGP ' : ''}{t('off')}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <StatusChips isActive={m_.isActive} remaining={m_.remaining} urgent={m_.urgent} t={t} />
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-sm font-extrabold uppercase leading-snug"><span className="nb-ul">{offer.name}</span></h3>
          <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-5 opacity-90">{offer.description || t('descriptionFallback')}</p>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 text-xs font-medium">
          {m_.range && <p className="flex items-center gap-1.5"><FiCalendar aria-hidden="true" className="nb-ic h-3.5 w-3.5 flex-shrink-0" /><span dir="ltr" className="truncate">{m_.range}</span></p>}
          {offer.shopName && offer.shopId && (
            <Link to={shopPath(offer.shopId)} onClick={(e) => e.stopPropagation()} className="flex w-fit max-w-full items-center gap-1.5 font-bold underline underline-offset-4">
              <RiStoreLine aria-hidden="true" className="nb-ic h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{offer.shopName}</span>
            </Link>
          )}
        </div>
        <div className="nb-line mt-auto flex items-center justify-between gap-2 border-t-2 pt-3">
          <span className="nb-muted text-[10px] font-bold uppercase">{m_.isPct ? t('percentageDiscount') : ''}</span>
          <span className="nb-arrow" aria-hidden="true"><FiArrowRight className="nb-flip h-4 w-4" /></span>
        </div>
      </div>
    </article>
  );
});

const InfoRow = ({ Icon, label, value, children }) => (
  <div className="nb-gray nb-line flex items-center gap-3 border-2 border-dotted p-3">
    <span className="nb-chip nb-chip-a !p-1.5"><Icon aria-hidden="true" className="h-4 w-4" /></span>
    <div className="min-w-0 flex-1">
      <p className="nb-muted text-[10px] font-extrabold uppercase">{label}</p>
      <p className="truncate text-sm font-bold">{value}</p>
    </div>
    {children}
  </div>
);

const OfferDetailModal = memo(({ offerId, language, onClose, t }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  useModalLock(true, onClose);

  const { data: offer, isLoading, isError, error } = useQuery({
    queryKey: ['offerDetail', offerId],
    queryFn: async ({ signal }) => {
      try {
        const { data } = await api.get(`/api/users/offers/${encodeURIComponent(offerId)}`, { headers: authHeaders(), signal });
        if (!data || data.id == null) throw Object.assign(new Error('Invalid offer response'), { response: { status: 404 } });
        return normalizeOffer(data);
      } catch (err) {
        if (!isUnauthorized(err) && !signal?.aborted) {
          const cached = findInList(qc, offerId);
          if (cached) return cached;
        }
        throw err;
      }
    },
    enabled: !!offerId,
    staleTime: 60 * 1000,
    placeholderData: () => findInList(qc, offerId),
  });

  useEffect(() => {
    if (!isError) return;
    if (isUnauthorized(error)) expireSession(navigate);
    else toast({ icon: 'error', title: 'Failed to load offer', timer: 3500 });
  }, [isError, error, navigate]);

  const meta = useOfferMeta(offer || EMPTY_OFFER, language);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={offer?.name || t('offerDetails')}>
      <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/70" onClick={onClose} />
      <m.div {...PANEL_MOTION} style={GPU} className="nb-card relative max-h-[92vh] w-full transform-gpu overflow-y-auto overscroll-contain !transition-none sm:max-w-md">
        <div className="nb-gray nb-line relative border-b-2 p-4 pe-14 sm:p-5">
          <h2 className="line-clamp-2 text-base font-extrabold uppercase sm:text-lg"><span className="nb-ul">{offer?.name || t('offerDetails')}</span></h2>
          <button type="button" onClick={onClose} aria-label={t('close')} className="nb-btn absolute end-3 top-3 h-8 w-8"><FiX className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          {isLoading ? (
            <div className="flex justify-center py-12" role="status" aria-label="Loading"><span className="h-9 w-9 animate-spin rounded-full border-4 border-[color:var(--nb-accent)] border-t-transparent motion-reduce:animate-none" /></div>
          ) : offer ? (
            <>
              <StatusChips isActive={meta.isActive} remaining={meta.remaining} urgent={meta.urgent} t={t} />
              {offer.description && <p className="text-sm font-medium leading-relaxed opacity-90">{offer.description}</p>}
              <InfoRow Icon={FiTag} label={t('youSave')} value={meta.amount} />
              {meta.range && <InfoRow Icon={FiCalendar} label={t('validPeriod')} value={meta.range} />}
              {offer.shopName && (
                <InfoRow Icon={RiStoreLine} label={t('shop')} value={offer.shopName}>
                  {offer.shopId && <Link to={shopPath(offer.shopId)} onClick={onClose} className="nb-btn nb-btn-a flex-shrink-0 px-3 py-1.5 text-xs uppercase">{t('visit')}</Link>}
                </InfoRow>
              )}
            </>
          ) : (
            <p className="nb-muted py-10 text-center text-sm font-bold uppercase">{t('notFound')}</p>
          )}

          <div className="grid grid-cols-2 gap-3 pe-1 pb-1 pt-2">
            <button type="button" onClick={onClose} className="nb-btn py-2.5 text-sm uppercase">{t('close')}</button>
            {offer?.shopId && (
              <Link to={shopPath(offer.shopId)} onClick={onClose} className="nb-btn nb-btn-a py-2.5 text-sm uppercase"><RiStoreLine className="h-4 w-4" /> {t('visitShop')}</Link>
            )}
          </div>
        </div>
      </m.div>
    </div>
  );
});

const OffersContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const navigate = useNavigate();
  const t = useCallback((key) => tr(language, key), [language]);
  const font = useLangFont(language);
  const isAr = language === 'ar';
  const token = useAuthGuard();
  useScrollTopOnEnter();

  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [repairsRef, repairsNear] = useNearViewport();

  useEffect(() => { ensureNbFont(); }, []);
  useEffect(() => { document.title = 'Exclusive Offers | Tech-Restore'; }, []);

  const { data: offers = [], isLoading, isError, isFetching, error, refetch } = useQuery({
    queryKey: ['offers'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/users/offers', { headers: authHeaders(), signal });
      const raw = res.data?.content || res.data || [];
      return (Array.isArray(raw) ? raw : []).filter((o) => o && o.id != null).map(normalizeOffer);
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (isError && isUnauthorized(error)) expireSession(navigate);
  }, [isError, error, navigate]);

  const stats = useMemo(() => {
    let soon = 0;
    let best = 0;
    for (const o of offers) {
      const d = daysLeftNum(o.endDate);
      if (o.status === 'ACTIVE' && d !== null && d <= SOON_DAYS) soon += 1;
      if (o.discountType === 'PERCENTAGE' && o.discountValue > best) best = o.discountValue;
    }
    return [
      { label: t('activeOffers'), value: String(offers.length), Icon: FiTag },
      { label: 'Ending soon', value: String(soon), Icon: FiClock },
      { label: 'Best discount', value: best ? `${best}%` : '–', Icon: FiTrendingUp },
    ];
  }, [offers, t]);

  const totalPages = Math.max(1, Math.ceil(offers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => offers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [offers, safePage]);

  const changePage = useCallback((p) => startTransition(() => setPage(Math.min(Math.max(1, p), totalPages))), [totalPages]);
  const openDetail = useCallback((id) => setDetailId(id), []);
  const closeDetail = useCallback(() => setDetailId(null), []);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div
          dir={languageDirection(language)} lang={language} style={isAr ? font.style : NB_FONT_STYLE}
          className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-hidden ${isAr ? font.className : ''}`}
        >
          {STYLE_EL}
          <Defs3D />
          <Toaster darkMode={darkMode} />

          <div className="pg-enter">
            <OffersBanner
              darkMode={darkMode}
              eyebrow={isLoading ? t('activeOffers') : `${offers.length} ${t('available')}`}
              title={t('activeOffers')}
              subtitle={t('checkBack')}
              t={t}
            />

            <div className="relative z-20 mx-auto -mt-20 max-w-7xl px-4 sm:-mt-28 sm:px-6 lg:-mt-36 lg:px-8">
              <StatsRow stats={stats} />

              <div aria-busy={isPending} className={`nb-card mt-6 p-5 transition-opacity duration-150 sm:p-8 ${isPending ? 'opacity-70' : ''}`}>
                {isLoading ? (
                  <Skeletons count={6} className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" itemClassName="h-72" />
                ) : isError && !isUnauthorized(error) ? (
                  <StateBox darkMode={darkMode} label="We couldn't load offers right now." onRetry={refetch} fetching={isFetching} />
                ) : paged.length === 0 ? (
                  <StateBox darkMode={darkMode} label={t('noActive')} hint={t('checkBack')} />
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-5 pe-2 pb-2 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                      {paged.map((o, i) => (
                        <OfferCard key={o.id} offer={o} index={i} language={language} onViewDetail={openDetail} t={t} />
                      ))}
                    </div>
                    <Pager page={safePage} totalPages={totalPages} onChange={changePage} pending={isPending} />
                  </>
                )}
              </div>
            </div>

           
          </div>

          <AnimatePresence>
            {detailId && <OfferDetailModal key={detailId} offerId={detailId} language={language} onClose={closeDetail} t={t} />}
          </AnimatePresence>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
});

export { queryClient };
export default function Offers(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <OffersContent {...props} />
    </QueryClientProvider>
  );
}