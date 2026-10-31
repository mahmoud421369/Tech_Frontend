import React, { useState, useEffect, useCallback, useId, memo } from 'react';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiPercent, FiTag } from 'react-icons/fi';
import { RiStore2Line } from 'react-icons/ri';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import api from '../../common/api/api';
import queryClient from '../../common/utils/queryClient';
import useAuthStore from '../../common/store/Auth';
import { Defs3D, Device3DStyles, DeviceScene, useOnScreen } from './Device3D';
import enTranslations from '../../locales/en/translation.json';
import arTranslations from '../../locales/ar/translation.json';
import frTranslations from '../../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../../common/utils/useAppLanguage';

const NS = {
  en: enTranslations.offersSlider,
  ar: arTranslations.offersSlider,
  fr: frTranslations.offersSlider,
};

const t = (language, key, vars) => {
  let s = NS[language]?.[key] || NS.en?.[key] || key;
  if (vars) for (const k in vars) s = s.split(`{{${k}}}`).join(vars[k]);
  return s;
};

const LOCALES = { en: 'en-US', ar: 'ar-EG', fr: 'fr-FR' };
const dateFmts = {};
const numFmts = {};
const dateFmt = (language) =>
  dateFmts[language] || (dateFmts[language] = new Intl.DateTimeFormat(LOCALES[language] || LOCALES.en, { month: 'short', day: 'numeric', year: 'numeric' }));
const numFmt = (language) =>
  numFmts[language] || (numFmts[language] = new Intl.NumberFormat(LOCALES[language] || LOCALES.en, { maximumFractionDigits: 2 }));

const MAX_OFFERS = 12;
const AUTOPLAY_MS = 5500;
const EMPTY = [];

const shouldRetry = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const fetchOffers = async ({ signal }) => {
  const { data } = await api.get('/api/users/offers', { signal });
  return Array.isArray(data?.content) ? data.content.filter((o) => o && typeof o === 'object') : [];
};

const selectLatest = (list) => {
  const ts = (o) => Date.parse(o.createdAt) || 0;
  return [...list].sort((a, b) => ts(b) - ts(a)).slice(0, MAX_OFFERS);
};

const STATUS_STYLES = {
  active: '!bg-emerald-600 !text-white',
  expired: '!bg-rose-600 !text-white',
  pending: '!bg-amber-400 !text-amber-950',
};
const STATUS_KEYS = { active: 'statusActive', expired: 'statusExpired', pending: 'statusPending' };

const pick = (obj, key) => (typeof key === 'string' && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined);
const clean = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const pad = (n) => String(n).padStart(2, '0');

const formatDate = (d, language) => {
  if (!d) return t(language, 'notAvailable');
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? t(language, 'notAvailable') : dateFmt(language).format(date);
};

const OF_CSS = `
.of-root{--dx:1;--of-bg:#f9fafb;--of-card:#ffffff;--of-ink:#022c22;--of-muted:#4b5563;--of-line:#022c22;--of-shadow:#022c22;--of-gray:#f3f4f6;--of-accent:#34d399;--of-on:#022c22;background:var(--of-bg);color:var(--of-ink)}
.of-root[dir=rtl]{--dx:-1}
.of-dark{--of-bg:#141414;--of-card:#2a2a2a;--of-ink:#ffffff;--of-muted:#a3a3a3;--of-line:#000;--of-shadow:#000;--of-gray:#1e1e1e;--of-accent:#39ff88;--of-on:#04261a}
.of-gray{background:var(--of-gray)}
.of-muted{color:var(--of-muted)}
.of-line{border-color:var(--of-line)}
.of-ticket{--stub:7rem;position:relative;display:flex;width:100%;height:100%;background:var(--of-card);border:3px solid var(--of-line);box-shadow:calc(var(--dx)*6px) 6px 0 var(--of-shadow);transition:transform .15s ease,box-shadow .15s ease}
.of-ticket:hover{transform:translate(calc(var(--dx)*3px),3px);box-shadow:calc(var(--dx)*3px) 3px 0 var(--of-shadow)}
@media (min-width:640px){.of-ticket{--stub:9rem}}
.of-stub{position:relative;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:space-between;width:var(--stub);border-inline-end:3px dashed var(--of-line)}
.of-notch{position:absolute;z-index:2;width:24px;height:24px;border-radius:50%;background:var(--of-bg);border:3px solid var(--of-line);inset-inline-start:calc(var(--stub) - 13.5px)}
.of-notch-t{top:-15px;clip-path:inset(50% 0 0 0)}
.of-notch-b{bottom:-15px;clip-path:inset(0 0 50% 0)}
.of-code{flex:none;align-self:stretch;width:16px;margin:14px 12px 14px 4px;opacity:.5;background:repeating-linear-gradient(to bottom,var(--of-ink) 0 2px,transparent 2px 4px,var(--of-ink) 4px 5px,transparent 5px 9px,var(--of-ink) 9px 12px,transparent 12px 14px)}
.of-num{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;background:var(--of-accent);color:var(--of-on);border:2px solid var(--of-line);box-shadow:calc(var(--dx)*2px) 2px 0 var(--of-shadow);font-size:12px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1}
.of-bar{display:inline-block;width:48px;height:14px;background:var(--of-accent);border:2px solid var(--of-line)}
.of-ul{text-decoration:underline;text-decoration-color:var(--of-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.of-squig path{stroke:var(--of-accent)}
.of-chip{display:inline-flex;align-items:center;gap:4px;background:var(--of-card);color:var(--of-ink);border:2px solid var(--of-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.of-btn{display:inline-flex;align-items:center;justify-content:center;background:var(--of-accent);color:var(--of-on);border:2px solid var(--of-line);box-shadow:calc(var(--dx)*3px) 3px 0 var(--of-shadow);cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
.of-btn:active:not(:disabled){transform:translate(calc(var(--dx)*3px),3px);box-shadow:0 0 0 var(--of-shadow)}
.of-btn:disabled{opacity:.4;cursor:not-allowed}
.of-btn:focus-visible,.of-pip:focus-visible{outline:3px solid var(--of-accent);outline-offset:3px}
.of-pip{height:12px;border:2px solid var(--of-line);background:var(--of-card);transition:width .25s ease,background-color .25s ease}
.of-dark .of-pip{border-color:#525252}
.of-pip-on{background:var(--of-accent)}
.of-dark .of-pip-on{border-color:#000}
@media (prefers-reduced-motion:reduce){.of-ticket,.of-btn,.of-pip{transition:none}}
`;

const OfferDefs = memo(({ gid }) => (
  <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${gid}front`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#047857" /></linearGradient>
      <linearGradient id={`${gid}tag`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#f59e0b" /></linearGradient>
    </defs>
  </svg>
));

const OfferArt = memo(({ gid, className = '' }) => (
  <svg viewBox="0 0 160 120" className={className} role="presentation" aria-hidden="true" focusable="false">
    <ellipse cx="78" cy="109" rx="56" ry="7" fill="#000" opacity=".28" />

    <polygon points="26,62 56,50 118,50 88,62" fill="#a7f3d0" />
    <rect x="26" y="62" width="62" height="44" rx="3" fill={`url(#${gid}front)`} />
    <polygon points="88,62 118,50 118,94 88,106" fill="#065f46" />

    <rect x="51" y="62" width="12" height="44" fill="#fbbf24" />
    <polygon points="51,62 63,62 93,50 81,50" fill="#fde68a" />
    <polygon points="88,78 118,66 118,74 88,86" fill="#d97706" />

    <path d="M72 52c-10-14-26-10-22-3 3 5 14 5 22 3zM72 52c10-14 26-10 22-3-3 5-14 5-22 3z" fill="#f59e0b" />
    <circle cx="72" cy="52" r="4" fill="#fbbf24" />

    <rect x="26" y="62" width="10" height="44" rx="3" fill="#fff" opacity=".16" />

    <g transform="translate(96 8) rotate(12)">
      <rect x="2" y="4" width="54" height="40" rx="9" fill="#b45309" opacity=".35" />
      <rect x="0" y="0" width="54" height="40" rx="9" fill={`url(#${gid}tag)`} />
      <rect x="0" y="0" width="54" height="12" rx="9" fill="#fff" opacity=".25" />
      <circle cx="8" cy="20" r="3.5" fill="#fff" opacity=".9" />
      <circle cx="25" cy="15" r="4.5" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="41" cy="28" r="4.5" fill="none" stroke="#fff" strokeWidth="3" />
      <line x1="43" y1="11" x2="24" y2="32" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    </g>

    <path d="M0-6 1.5-1.5 6 0 1.5 1.5 0 6-1.5 1.5-6 0-1.5-1.5z" fill="#34d399" transform="translate(16 36)" />
    <path d="M0-6 1.5-1.5 6 0 1.5 1.5 0 6-1.5 1.5-6 0-1.5-1.5z" fill="#fbbf24" transform="translate(146 76) scale(.8)" />
  </svg>
));

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
        <svg aria-hidden="true" focusable="false" viewBox="0 0 100 10" preserveAspectRatio="none" className="of-squig pointer-events-none absolute inset-x-0 -bottom-2 h-2.5 w-full">
          <path d="M1 6 C 20 2, 40 9, 60 5 S 90 3, 99 6" fill="none" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </span>
    </>
  );
});

const OfferCard = memo(({ offer, index, language, gid }) => {
  const isPercentage = offer.discountType === 'PERCENTAGE';
  const raw = Number(offer.discountValue);
  const hasDiscount = offer.discountValue !== null && offer.discountValue !== '' && Number.isFinite(raw) && raw > 0;
  const value = isPercentage ? Math.min(raw, 100) : raw;
  const rawStatus = clean(offer.status, 20) || 'Active';
  const statusLower = rawStatus.toLowerCase();
  const statusKey = pick(STATUS_KEYS, statusLower);
  const statusText = statusKey ? t(language, statusKey) : rawStatus;
  const statusCls = pick(STATUS_STYLES, statusLower) || '!bg-gray-600 !text-white';

  return (
    <article className="of-ticket">
      <span className="of-notch of-notch-t" aria-hidden="true" />
      <span className="of-notch of-notch-b" aria-hidden="true" />

      <div className="of-stub of-gray px-2 pb-1 pt-3">
        {hasDiscount ? (
          <div className="flex flex-col items-center leading-none" dir="ltr">
            <div className="flex items-baseline gap-0.5">
              {!isPercentage && <span className="text-xs font-extrabold">{t(language, 'currency')}</span>}
              <span className="text-3xl font-black tabular-nums tracking-tight">{numFmt(language).format(value)}</span>
              {isPercentage && <FiPercent className="h-5 w-5 self-center" strokeWidth={3} />}
            </div>
            <span className="mt-1 text-[10px] font-extrabold uppercase tracking-widest">{t(language, 'off')}</span>
          </div>
        ) : (
          <span className="of-num !h-9 !w-9"><FiTag className="h-4 w-4" /></span>
        )}
        <OfferArt gid={gid} className="h-16 w-full" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 py-3 pe-2 ps-4 sm:py-4 sm:ps-5">
        <div className="flex items-center justify-between gap-2">
          <span className="of-num">{pad(index + 1)}</span>
          <span className={`of-chip ${statusCls}`}>{statusText}</span>
        </div>
        <h3 className="line-clamp-2 text-[13px] font-extrabold uppercase leading-snug sm:text-sm">
          <span className="of-ul">{clean(offer.name, 120)}</span>
        </h3>
        <p className="of-muted line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-5">
          {clean(offer.description, 140) || t(language, 'defaultDescription')}
        </p>
        <div className="of-line mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t-2 border-dashed pt-2.5 text-[11px]">
          <span className="flex min-w-0 items-center gap-1.5 font-bold uppercase">
            <RiStore2Line aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{clean(offer.shopName, 60) || t(language, 'partnerShop')}</span>
          </span>
          <span className="of-muted flex items-center gap-1 font-semibold">
            <FiCalendar aria-hidden="true" className="h-3 w-3 flex-shrink-0" />
            {t(language, 'ends', { date: formatDate(offer.endDate, language) })}
          </span>
        </div>
      </div>

      <span className="of-code" aria-hidden="true" />
    </article>
  );
});

const SkeletonCard = memo(({ className = '' }) => (
  <div className={`of-gray h-[190px] animate-pulse ${className}`} />
));

const computeCount = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return 1;
  return window.matchMedia('(min-width: 1280px)').matches ? 3 : window.matchMedia('(min-width: 768px)').matches ? 2 : 1;
};
const useVisibleCount = () => {
  const [count, setCount] = useState(computeCount);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const md = window.matchMedia('(min-width: 768px)');
    const xl = window.matchMedia('(min-width: 1280px)');
    const update = () => setCount(xl.matches ? 3 : md.matches ? 2 : 1);
    update();
    md.addEventListener('change', update);
    xl.addEventListener('change', update);
    return () => { md.removeEventListener('change', update); xl.removeEventListener('change', update); };
  }, []);
  return count;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const OffersSliderContent = ({ darkMode = false, standalone = false }) => {
  const language = useAppLanguage();
  const isRtl = languageDirection(language) === 'rtl';
  const isAr = language === 'ar';
  const gid = useId().replace(/:/g, '');

  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['offers', userId ?? 'anon'],
    queryFn: fetchOffers,
    select: selectLatest,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
    refetchOnWindowFocus: false,
  });
  const offers = data || EMPTY;
  const isLoading = !!accessToken && queryLoading;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [wrapRef, onScreen] = useOnScreen();
  const visibleCount = useVisibleCount();

  const maxIndex = Math.max(0, offers.length - visibleCount);
  const showArrows = offers.length > visibleCount;

  useEffect(() => { setCurrentIndex((i) => Math.min(i, maxIndex)); }, [maxIndex]);

  const next = useCallback(() => setCurrentIndex((i) => (i >= maxIndex ? 0 : i + 1)), [maxIndex]);
  const goPrev = useCallback(() => setCurrentIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setCurrentIndex((i) => Math.min(maxIndex, i + 1)), [maxIndex]);
  const setHoverOn = useCallback(() => setHovered(true), []);
  const setHoverOff = useCallback(() => setHovered(false), []);

  useEffect(() => {
    if (isLoading || !showArrows || hovered || !onScreen || prefersReducedMotion()) return undefined;
    const id = setInterval(() => { if (!document.hidden) next(); }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [isLoading, showArrows, hovered, onScreen, next]);

  const atStart = currentIndex === 0;
  const atEnd = currentIndex >= maxIndex;
  const cardPct = 100 / visibleCount;
  const offset = currentIndex * cardPct * (isRtl ? 1 : -1);

  return (
    <section
      ref={wrapRef}
      dir={languageDirection(language)}
      className={`of-root ${darkMode ? 'of-dark' : ''} relative overflow-hidden py-14 sm:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_520px] ${onScreen ? '' : 'anim-paused'} ${isAr ? 'font-cairo' : 'font-jakarta'}`}
    >
      <style>{OF_CSS}</style>
      {standalone && <Defs3D />}
      <Device3DStyles />
      <OfferDefs gid={gid} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mb-14">
          <div className="min-w-0 max-w-3xl">
            <p className={`mb-5 flex items-center gap-3 text-sm font-bold uppercase ${isAr ? 'tracking-normal' : 'tracking-wide'}`}>
              <span className="of-bar" aria-hidden="true" />{t(language, 'badge')}
            </p>
            <h2 className={`text-3xl font-extrabold [text-wrap:balance] sm:text-5xl lg:text-6xl ${isAr ? 'leading-[1.4] tracking-normal' : 'leading-[1.18] tracking-[-0.04em]'}`}>
              <UnderlinedTitle text={t(language, 'title')} />
            </h2>
            <p className="of-muted mt-5 max-w-2xl text-base font-medium leading-relaxed sm:text-lg">{t(language, 'subtitle')}</p>
          </div>
          {showArrows && (
            <div className="flex gap-3 pb-2 pe-2">
              <button type="button" onClick={goPrev} disabled={atStart} aria-label={t(language, 'previous')} className="of-btn h-11 w-11">
                <FiChevronLeft className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
              <button type="button" onClick={goNext} disabled={atEnd} aria-label={t(language, 'next')} className="of-btn h-11 w-11">
                <FiChevronRight className={`h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} className={i === 3 ? 'hidden xl:block' : i === 2 ? 'hidden md:block' : ''} />)}
          </div>
        ) : offers.length === 0 ? (
          <div className="of-gray flex flex-col items-center gap-3 border-[3px] border-dashed border-[color:var(--of-accent)]/50 py-12 text-center">
            <DeviceScene compact className="h-20 w-28" />
            <p className="text-lg font-extrabold uppercase">{t(language, 'noOffers')}</p>
            <p className="of-muted text-sm font-medium">{t(language, 'checkBack')}</p>
          </div>
        ) : (
          <>
            <div
              className="overflow-hidden pb-4 pt-1.5"
              role="region"
              aria-roledescription="carousel"
              aria-label={t(language, 'title')}
              onMouseEnter={setHoverOn}
              onMouseLeave={setHoverOff}
              onFocus={setHoverOn}
              onBlur={setHoverOff}
            >
              <div
                className="flex will-change-transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                style={{ transform: `translateX(${offset}%)` }}
              >
                {offers.map((offer, i) => (
                  <div key={offer.id ?? i} style={{ minWidth: `${cardPct}%` }} className="box-border flex px-2 pe-3" aria-hidden={i < currentIndex || i >= currentIndex + visibleCount}>
                    <OfferCard offer={offer} index={i} language={language} gid={gid} />
                  </div>
                ))}
              </div>
            </div>

            {maxIndex > 0 && (
              <div className="mt-6 flex justify-center gap-2" role="group" aria-label={t(language, 'chooseSlide')}>
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    aria-label={t(language, 'goToSlide', { n: i + 1 })}
                    aria-current={i === currentIndex}
                    className={`of-pip ${i === currentIndex ? 'of-pip-on w-8' : 'w-3'}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

const OffersSliderMemo = memo(OffersSliderContent);

const OffersSlider = (props) => (
  <QueryClientProvider client={queryClient}>
    <OffersSliderMemo {...props} />
  </QueryClientProvider>
);

export default memo(OffersSlider);