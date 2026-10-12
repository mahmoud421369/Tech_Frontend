import React, { useState, useEffect, useCallback, useMemo, memo, useTransition } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FiX, FiCalendar, FiClock, FiTag, FiArrowRight } from 'react-icons/fi';
import { RiStoreLine, RiPriceTag3Line } from 'react-icons/ri';
import '../styles/style.css';
import api from '../api';
import { Hero } from '../components';
import { Defs3D, Device3DStyles, Btn3D, Chip3D, TrustStrip, money } from '../components/Device3D';
import { SectionBanner, EmptyState, ErrorState, LoadingGrid, Pager } from '../components/PageKit';
import { authHeaders, expireSession, isUnauthorized, toast, useAuthGuard } from '../utils/auth';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } } });

/* ───────────── helpers ───────────── */
const OFFER_TRANSLATIONS = {
  en: enTranslations.offersPage,
  ar: arTranslations.offersPage || arTranslations.hero?.offersPage,
  fr: frTranslations.offersPage || frTranslations.hero?.offersPage,
};
const tr = (language, key) => OFFER_TRANSLATIONS[language]?.[key] || OFFER_TRANSLATIONS.en?.[key] || key;

const PAGE_SIZE = 6;
const LOCALES = { en: 'en-GB', ar: 'ar-EG', fr: 'fr-FR' };
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
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

// Whole days remaining, or null when the offer has already ended / has no valid date.
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

// Keep only the fields the UI needs and coerce their types.
const normalizeOffer = (o) => {
  const isPct = o.discountType === 'PERCENTAGE';
  const raw = Math.max(0, Number(o.discountValue) || 0);
  return {
    id: String(o.id),
    name: String(o.name ?? ''),
    description: o.description ? String(o.description) : '',
    discountType: isPct ? 'PERCENTAGE' : 'FIXED_VALUE',
    discountValue: isPct ? Math.min(raw, 100) : raw,
    startDate: o.startDate || null,
    endDate: o.endDate || null,
    status: o.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
    shopId: o.shopId != null ? String(o.shopId) : '',
    shopName: o.shopName ? String(o.shopName) : '',
  };
};

const shopPath = (id) => `/shops/${encodeURIComponent(id)}`;

const surface = (darkMode) =>
  darkMode
    ? 'border-emerald-900/70 bg-gradient-to-b from-emerald-900/40 to-emerald-950 shadow-[0_6px_0_0_#022c22]'
    : 'border-emerald-200 bg-gradient-to-b from-white to-emerald-50 shadow-[0_6px_0_0_#a7f3d0]';
const innerBox = (darkMode) => (darkMode ? 'border-emerald-900/70 bg-gray-900/40' : 'border-emerald-100 bg-white');

const useOfferMeta = (offer, language) =>
  useMemo(() => {
    const days = daysLeftNum(offer.endDate);
    return {
      isPct: offer.discountType === 'PERCENTAGE',
      isActive: offer.status === 'ACTIVE',
      days,
      remaining: days === null ? null : rtf(language).format(days, 'day'),
      urgent: days !== null && days <= 3,
      range: formatRange(offer.startDate, offer.endDate, language),
      amount: offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}%` : money(offer.discountValue),
    };
  }, [offer, language]);

const StatusPill = memo(({ isActive, remaining, urgent, darkMode, t }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
      isActive ? (darkMode ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : darkMode ? 'bg-red-500/15 text-red-300' : 'bg-red-100 text-red-700'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {isActive ? t('active') : t('inactive')}
    </span>
    {remaining && (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
        urgent ? (darkMode ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-100 text-amber-700') : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
      }`}>
        <FiClock className="h-3 w-3" />{remaining}
      </span>
    )}
  </div>
));

/* ───────────── Offer ticket card ───────────── */
const OfferCard = memo(({ offer, darkMode, language, onViewDetail, t }) => {
  const m = useOfferMeta(offer, language);
  const open = useCallback(() => onViewDetail(offer.id), [onViewDetail, offer.id]);
  const notch = darkMode ? 'bg-gray-900' : 'bg-white';
  const stub = m.isPct ? 'from-amber-400 to-orange-500' : 'from-emerald-500 to-emerald-700';

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border transition-transform duration-200 hover:-translate-y-0.5 ${surface(darkMode)}`}>
      <div className="relative grid flex-1 grid-cols-[88px_1fr] sm:grid-cols-[104px_1fr]">
        <div className={`relative flex flex-col items-center justify-center gap-0.5 bg-gradient-to-br px-2 py-6 text-center text-white ${stub}`}>
          <span className="text-2xl font-extrabold leading-none tabular-nums sm:text-3xl">{offer.discountValue}{m.isPct ? '%' : ''}</span>
          {!m.isPct && <span className="text-[10px] font-bold opacity-80">EGP</span>}
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest opacity-90">{t('off')}</span>
          <span className={`absolute -top-2.5 right-0 h-5 w-5 translate-x-1/2 rounded-full ${notch}`} />
          <span className={`absolute -bottom-2.5 right-0 h-5 w-5 translate-x-1/2 rounded-full ${notch}`} />
        </div>
        <div className={`pointer-events-none absolute bottom-3 left-[88px] top-3 border-l-2 border-dashed sm:left-[104px] ${darkMode ? 'border-emerald-900' : 'border-emerald-200'}`} />

        <div className="flex min-w-0 flex-col gap-2 p-4 sm:p-5">
          <StatusPill isActive={m.isActive} remaining={m.remaining} urgent={m.urgent} darkMode={darkMode} t={t} />
          <h3 className={`line-clamp-2 text-base font-extrabold leading-tight sm:text-lg ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{offer.name}</h3>
          <p className={`line-clamp-2 text-xs leading-relaxed sm:text-sm ${darkMode ? 'text-emerald-100/60' : 'text-emerald-900/70'}`}>{offer.description || t('descriptionFallback')}</p>
          <div className={`mt-auto space-y-1.5 pt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {m.range && <p className="flex items-center gap-2"><FiCalendar className="h-3 w-3 flex-shrink-0 text-emerald-500" />{m.range}</p>}
            {offer.shopName && offer.shopId && (
              <Link to={shopPath(offer.shopId)} className="flex w-fit items-center gap-2 font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                <RiStoreLine className="h-3.5 w-3.5 flex-shrink-0" />{offer.shopName}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className={`flex items-center justify-between gap-2 border-t px-4 py-3 sm:px-5 ${darkMode ? 'border-emerald-900/70' : 'border-emerald-100'}`}>
        <span className={`text-[11px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{m.isPct ? t('percentageDiscount') : ''}</span>
        <Btn3D tone="soft" darkMode={darkMode} onClick={open} className="px-3.5 py-2 text-xs">
          {t('details')} <FiArrowRight className="h-3.5 w-3.5 text-emerald-500 rtl:rotate-180" />
        </Btn3D>
      </div>
    </article>
  );
});

/* ───────────── Detail modal ───────────── */
const InfoRow = ({ Icon, label, value, darkMode, children }) => (
  <div className={`flex items-center gap-3 rounded-xl border p-3 ${innerBox(darkMode)}`}>
    <Chip3D className="h-9 w-9 flex-shrink-0"><Icon className="h-4 w-4" /></Chip3D>
    <div className="min-w-0 flex-1">
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
      <p className={`truncate text-sm font-bold ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{value}</p>
    </div>
    {children}
  </div>
);

const OfferDetailBody = memo(({ offer, darkMode, language, t, onClose }) => {
  const m = useOfferMeta(offer, language);
  return (
    <div className="space-y-3">
      <StatusPill isActive={m.isActive} remaining={m.remaining} urgent={m.urgent} darkMode={darkMode} t={t} />
      {offer.description && <p className={`text-xs leading-relaxed sm:text-sm ${darkMode ? 'text-emerald-100/60' : 'text-emerald-900/70'}`}>{offer.description}</p>}
      <InfoRow Icon={FiTag} label={t('youSave')} value={m.amount} darkMode={darkMode} />
      {m.range && <InfoRow Icon={FiCalendar} label={t('validPeriod')} value={m.range} darkMode={darkMode} />}
      {offer.shopName && (
        <InfoRow Icon={RiStoreLine} label={t('shop')} value={offer.shopName} darkMode={darkMode}>
          {offer.shopId && (
            <Link to={shopPath(offer.shopId)} onClick={onClose} className="flex-shrink-0 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600">{t('visit')}</Link>
          )}
        </InfoRow>
      )}
    </div>
  );
});

const OfferDetailModal = memo(({ open, onClose, offerId, darkMode, language, t }) => {
  const navigate = useNavigate();
  const { data: offer, isLoading, isError, error } = useQuery({
    queryKey: ['offerDetail', offerId],
    queryFn: async () => normalizeOffer((await api.get(`/api/users/offers/${encodeURIComponent(offerId)}`, { headers: authHeaders() })).data),
    enabled: open && !!offerId,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!isError) return;
    if (isUnauthorized(error)) expireSession(navigate);
    else toast({ icon: 'error', title: 'Failed to load offer' });
  }, [isError, error, navigate]);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[70]">
      <DialogBackdrop transition className="fixed inset-0 bg-black/60 backdrop-blur-sm duration-150 data-[closed]:opacity-0" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel transition className={`relative w-full max-w-md rounded-3xl border p-5 duration-150 data-[closed]:scale-95 data-[closed]:opacity-0 sm:p-6 ${surface(darkMode)}`}>
          <div className="mb-4 flex items-start gap-3">
            <Chip3D tone="am" className="h-11 w-11 flex-shrink-0"><RiPriceTag3Line className="h-5 w-5" /></Chip3D>
            <div className="min-w-0 flex-1">
              <DialogTitle className={`line-clamp-2 text-lg font-extrabold leading-snug ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{offer?.name || t('offerDetails')}</DialogTitle>
            </div>
            <button type="button" onClick={onClose} aria-label={t('close')} className={`rounded-xl p-2 transition-colors ${darkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-emerald-100'}`}>
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[65vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-12" role="status" aria-label="Loading"><span className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
            ) : offer ? (
              <OfferDetailBody offer={offer} darkMode={darkMode} language={language} t={t} onClose={onClose} />
            ) : (
              <p className={`py-10 text-center text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('notFound')}</p>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Btn3D tone="soft" darkMode={darkMode} onClick={onClose} className="px-4 py-2.5 text-xs">{t('close')}</Btn3D>
            {offer?.shopId && (
              <Btn3D as={Link} to={shopPath(offer.shopId)} onClick={onClose} className="px-4 py-2.5 text-xs"><RiStoreLine className="h-4 w-4" /> {t('visitShop')}</Btn3D>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
});

/* ───────────── Page ───────────── */
const OffersContent = ({ darkMode }) => {
  const language = useAppLanguage();
  const navigate = useNavigate();
  const t = useCallback((key) => tr(language, key), [language]);
  const token = useAuthGuard();

  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { document.title = 'Exclusive Offers | Tech-Restore'; }, []);

  const { data: offers = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const res = await api.get('/api/users/offers', { headers: authHeaders() });
      const raw = res.data?.content || res.data || [];
      return (Array.isArray(raw) ? raw : []).filter((o) => o && o.id != null).map(normalizeOffer);
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (isError && isUnauthorized(error)) expireSession(navigate);
  }, [isError, error, navigate]);

  const totalPages = Math.max(1, Math.ceil(offers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => offers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [offers, safePage]);

  const changePage = useCallback((p) => startTransition(() => setPage(Math.min(Math.max(1, p), totalPages))), [totalPages]);
  const openDetail = useCallback((id) => setDetailId(id), []);
  const closeDetail = useCallback(() => setDetailId(null), []);

  return (
    <div
      dir={languageDirection(language)}
      key={language}
      className={`min-h-screen overflow-x-hidden ${language === 'ar' ? 'font-cairo' : 'font-poppins'} ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
    >
      <Device3DStyles />
      <Defs3D />

      <Hero variant="offers" darkMode={darkMode} />
      <TrustStrip darkMode={darkMode} />

      <section className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionBanner
            darkMode={darkMode}
            badge={isLoading ? t('activeOffers') : `${offers.length} ${t('available')}`}
            title={t('activeOffers')}
            subtitle={t('checkBack')}
          />

          {isLoading ? (
            <LoadingGrid count={6} darkMode={darkMode} className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 sm:gap-6" itemClassName="h-60" />
          ) : isError && !isUnauthorized(error) ? (
            <ErrorState darkMode={darkMode} label="We couldn't load offers right now." onRetry={refetch} />
          ) : paged.length === 0 ? (
            <EmptyState darkMode={darkMode} label={t('noActive')} hint={t('checkBack')} />
          ) : (
            <>
              <div aria-busy={isPending} className={`grid grid-cols-1 gap-5 transition-opacity duration-150 md:grid-cols-2 lg:grid-cols-3 sm:gap-6 ${isPending ? 'opacity-70' : ''}`}>
                {paged.map((o) => (
                  <OfferCard key={o.id} offer={o} darkMode={darkMode} language={language} onViewDetail={openDetail} t={t} />
                ))}
              </div>
              <Pager page={safePage} totalPages={totalPages} onChange={changePage} darkMode={darkMode} pending={isPending} />
            </>
          )}
        </div>
      </section>

      <OfferDetailModal open={!!detailId} onClose={closeDetail} offerId={detailId} darkMode={darkMode} language={language} t={t} />
    </div>
  );
};

const Offers = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <OffersContent {...props} />
  </QueryClientProvider>
));

export default Offers;