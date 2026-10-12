import React, { useState, useEffect, useCallback, useMemo, memo, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiTool, FiInfo, FiX, FiMail, FiPhone, FiCalendar, FiMapPin, FiCheck, FiCheckCircle, FiFileText,
  FiTag, FiXCircle, FiPackage, FiTruck, FiSlash, FiShield, FiChevronLeft, FiArrowRight,
} from 'react-icons/fi';
import {
  RiStoreLine, RiStarFill, RiVerifiedBadgeLine, RiSmartphoneLine, RiMacbookLine, RiTabletLine,
  RiTv2Line, RiComputerLine, RiGamepadLine, RiDeviceLine,
} from 'react-icons/ri';
import '../styles/style.css';
import api from '../api';
import { Hero } from '../components';
import { Defs3D, Device3DStyles, DeviceScene, Btn3D, Chip3D, TrustStrip } from '../components/Device3D';
import { SectionBanner, EmptyState, ErrorState, LoadingGrid, Pager } from '../components/PageKit';
import { authHeaders, cleanText, expireSession, isUnauthorized, toast, useAuthGuard } from '../utils/auth';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } } });

/* ───────────── helpers ───────────── */
const REPAIR_TRANSLATIONS = {
  en: enTranslations.repair,
  ar: arTranslations.repair || arTranslations.hero?.repair,
  fr: frTranslations.repair || frTranslations.hero?.repair,
};
const tr = (language, key) => REPAIR_TRANSLATIONS[language]?.[key] || REPAIR_TRANSLATIONS.en?.[key] || key;

const LOCALES = { en: 'en-GB', ar: 'ar-EG', fr: 'fr-FR' };
const dateFmtCache = {};
const formatDate = (iso, language) => {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return null;
  const loc = LOCALES[language] || 'en-GB';
  dateFmtCache[loc] ||= new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', year: 'numeric' });
  return dateFmtCache[loc].format(d);
};

const MAX_DESC = 1000;
const CATEGORY_PAGE_SIZE = 6;
const SHOP_PAGE_SIZE = 4;
const SUGGESTIONS = ['Screen cracked', 'Battery issue', 'Not charging', 'Overheating', 'Software crash', 'Water damage'];

const CATEGORY_ICONS = { phone: RiSmartphoneLine, laptop: RiMacbookLine, tablet: RiTabletLine, tv: RiTv2Line, desktop: RiComputerLine, gaming: RiGamepadLine };
const categoryIcon = (name) => CATEGORY_ICONS[String(name || '').toLowerCase()] || RiDeviceLine;

const STEP_DEFS = [
  { labelKey: 'describe', hintKey: 'describeHint', Icon: FiTool },
  { labelKey: 'category', hintKey: 'pickCategoryHint', Icon: RiDeviceLine },
  { labelKey: 'shop', hintKey: 'chooseShopHint', Icon: RiStoreLine },
  { labelKey: 'done', hintKey: 'sendRequestHint', Icon: FiCheckCircle },
];

const STEP_HEAD = [
  { title: 'describeProblem', subtitle: 'specificHelp', infoTitle: 'detailsTitle', infoBody: 'detailsBody' },
  { title: 'deviceType', subtitle: 'categorySubtitle', infoTitle: 'categoryTitle', infoBody: 'categoryBody' },
  { title: 'chooseShopTitle', subtitle: 'chooseShopSubtitle', infoTitle: 'shopTitle', infoBody: 'shopBody' },
  { title: 'doneTitle', subtitle: 'doneBody', infoTitle: 'doneTitle', infoBody: 'doneBody' },
];

const STATUS_JOURNEY = [
  { key: 'SUBMITTED', labelKey: 'submitted', descKey: 'submittedDesc', tone: 'progress', Icon: FiFileText },
  { key: 'QUOTE_SENT', labelKey: 'setPrice', descKey: 'setPriceDesc', tone: 'progress', Icon: FiTag },
  { key: 'QUOTE_APPROVED', labelKey: 'priceAccepted', descKey: 'priceAcceptedDesc', tone: 'success', Icon: FiCheckCircle },
  { key: 'QUOTE_REJECTED', labelKey: 'priceRejected', descKey: 'priceRejectedDesc', tone: 'danger', Icon: FiXCircle },
  { key: 'DEVICE_COLLECTED', labelKey: 'devicePickedUp', descKey: 'devicePickedUpDesc', tone: 'progress', Icon: FiPackage },
  { key: 'REPAIRING', labelKey: 'repairing', descKey: 'repairingDesc', tone: 'progress', Icon: FiTool },
  { key: 'REPAIR_COMPLETED', labelKey: 'repairCompleted', descKey: 'repairCompletedDesc', tone: 'success', Icon: FiShield },
  { key: 'DEVICE_DELIVERED', labelKey: 'deviceDelivered', descKey: 'deviceDeliveredDesc', tone: 'success', Icon: FiTruck },
  { key: 'CANCELLED', labelKey: 'cancelled', descKey: 'cancelledDesc', tone: 'danger', Icon: FiSlash },
];

// Only keep the fields the UI uses so unexpected API shapes can't leak into the DOM.
const toList = (res) => {
  const raw = res?.data?.content || res?.data || [];
  return Array.isArray(raw) ? raw : [];
};
const normalizeCategory = (c) => ({ id: String(c.id), name: String(c.name ?? '') });
const normalizeShop = (s) => ({
  id: String(s.id),
  name: String(s.name ?? ''),
  email: s.email ? String(s.email) : '',
  phone: s.phone ? String(s.phone) : '',
  description: s.description ? String(s.description) : '',
  shopType: s.shopType ? String(s.shopType) : '',
  verified: !!s.verified,
  activate: !!s.activate,
  rating: Number.isFinite(Number(s.rating)) && Number(s.rating) > 0 ? Number(s.rating) : null,
  createdAt: s.createdAt || null,
  shopAddress: s.shopAddress ? { street: s.shopAddress.street || '', city: s.shopAddress.city || '', state: s.shopAddress.state || '' } : null,
});

/* ───────────── shared card surface (same as Homepage ActionCard) ───────────── */
const surface = (darkMode) =>
  darkMode
    ? 'border-emerald-900/70 bg-gradient-to-b from-emerald-900/40 to-emerald-950 shadow-[0_6px_0_0_#022c22]'
    : 'border-emerald-200 bg-gradient-to-b from-white to-emerald-50 shadow-[0_6px_0_0_#a7f3d0]';
const innerBox = (darkMode) => (darkMode ? 'border-emerald-900/70 bg-gray-900/40' : 'border-emerald-100 bg-white');

/* ───────────── Stepper ───────────── */
const Stepper = memo(({ step, darkMode, t }) => (
  <ol aria-label="Progress" className="mb-8 grid grid-cols-4 gap-2 sm:gap-3">
    {STEP_DEFS.map(({ labelKey, hintKey, Icon }, i) => {
      const n = i + 1;
      const done = step > n;
      const active = step === n;
      return (
        <li
          key={labelKey}
          aria-current={active ? 'step' : undefined}
          className={`flex items-center justify-center gap-2.5 rounded-2xl border p-2.5 sm:justify-start sm:p-3 ${
            active ? (darkMode ? 'border-emerald-500 bg-emerald-500/10' : 'border-emerald-400 bg-emerald-50') : innerBox(darkMode)
          } ${!done && !active ? 'opacity-70' : ''}`}
        >
          {done || active ? (
            <Chip3D className="h-8 w-8 flex-shrink-0">{done ? <FiCheck className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</Chip3D>
          ) : (
            <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${darkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'}`}><Icon className="h-4 w-4" /></span>
          )}
          <div className="hidden min-w-0 sm:block">
            <p className={`truncate text-xs font-bold ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{t(labelKey)}</p>
            <p className={`truncate text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t(hintKey)}</p>
          </div>
        </li>
      );
    })}
  </ol>
));

/* ───────────── Wizard controls ───────────── */
const NavButtons = memo(({ onBack, onNext, nextLabel, nextDisabled, isLoading, showBack = true, darkMode, t }) => (
  <div className={`mx-auto mt-8 flex max-w-md gap-3 ${showBack ? 'justify-between' : 'justify-center'}`}>
    {showBack && (
      <Btn3D tone="soft" darkMode={darkMode} onClick={onBack} disabled={isLoading} className="px-5 py-3 text-sm">
        <FiChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t('back')}
      </Btn3D>
    )}
    <Btn3D onClick={onNext} disabled={nextDisabled || isLoading} aria-busy={isLoading} className="flex-1 justify-center px-6 py-3 text-sm sm:flex-none sm:px-10">
      {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
      {isLoading ? t('sending') : nextLabel || t('continue')}
      {!isLoading && <FiArrowRight className="h-4 w-4 rtl:rotate-180" />}
    </Btn3D>
  </div>
));

const CategoryTile = memo(({ cat, active, onSelect, darkMode }) => {
  const Icon = categoryIcon(cat.name);
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onSelect(cat)}
      className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-4 text-center transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 sm:p-5 ${
        active
          ? 'border-emerald-300 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_4px_0_0_#047857]'
          : `${innerBox(darkMode)} ${darkMode ? 'text-gray-200 hover:border-emerald-500' : 'text-gray-700 hover:border-emerald-400'}`
      }`}
    >
      {active ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20"><Icon className="h-6 w-6" /></span>
      ) : (
        <Chip3D className="h-12 w-12"><Icon className="h-6 w-6" /></Chip3D>
      )}
      <span className="text-xs font-bold sm:text-sm">{cat.name}</span>
    </button>
  );
});

const ShopOption = memo(({ shop, active, onSelect, onInfo, darkMode, language, t }) => {
  const select = useCallback(() => { if (shop.activate) onSelect(shop); }, [shop, onSelect]);
  const address = shop.shopAddress ? [shop.shopAddress.street, shop.shopAddress.city].filter(Boolean).join(', ') : '';
  const muted = active ? 'text-emerald-50/80' : darkMode ? 'text-gray-400' : 'text-gray-500';
  return (
    <div
      role="radio"
      aria-checked={active}
      aria-disabled={!shop.activate}
      tabIndex={shop.activate ? 0 : -1}
      onClick={select}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); select(); } }}
      className={`group relative flex flex-col gap-3 overflow-hidden rounded-2xl border-2 p-4 transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 sm:p-5 ${
        shop.activate ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-not-allowed opacity-50 grayscale'
      } ${
        active
          ? 'border-emerald-300 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_4px_0_0_#047857]'
          : `${innerBox(darkMode)} ${darkMode ? 'hover:border-emerald-500' : 'hover:border-emerald-400'}`
      }`}
    >
      <div className="flex items-start gap-3">
        {active ? (
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-lg font-black">{shop.name.charAt(0).toUpperCase() || 'S'}</span>
        ) : (
          <Chip3D className="h-11 w-11 flex-shrink-0 text-lg font-black">{shop.name.charAt(0).toUpperCase() || 'S'}</Chip3D>
        )}
        <div className="min-w-0 flex-1">
          <h3 className={`truncate text-sm font-semibold sm:text-base ${active ? 'text-white' : darkMode ? 'text-white' : 'text-gray-900'}`}>{shop.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${active ? 'bg-white/20 text-white' : darkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-600'}`}>
              <RiStarFill className="h-3 w-3" />{shop.rating ? shop.rating.toFixed(1) : t('newRating')}
            </span>
            {shop.verified && (
              <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold ${active ? 'bg-white/20 text-white' : 'bg-emerald-500 text-white'}`}>
                <RiVerifiedBadgeLine className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onInfo(shop); }}
          aria-label={t('shopDetailsAria')}
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${active ? 'bg-white/20 hover:bg-white/30' : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
        >
          <FiInfo className="h-4 w-4" />
        </button>
      </div>

      {address && (
        <p className={`flex items-center gap-1.5 text-xs ${muted}`}><FiMapPin className={`h-3 w-3 flex-shrink-0 ${active ? '' : 'text-emerald-500'}`} /><span className="line-clamp-1">{address}</span></p>
      )}

      <div className={`flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs ${active ? 'border-white/20' : darkMode ? 'border-emerald-900/70' : 'border-emerald-100'}`}>
        <span className={`flex items-center gap-1.5 font-semibold ${muted}`}><RiStoreLine className="h-3.5 w-3.5" />{shop.shopType || t('generalType')}</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          shop.activate ? (active ? 'bg-white/20 text-white' : darkMode ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700') : darkMode ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'
        }`}>{shop.activate ? t('active') : t('inactive')}</span>
      </div>
      {active && <span className="flex items-center justify-center gap-2 rounded-xl bg-white/20 py-1.5 text-xs font-bold"><FiCheck className="h-4 w-4" />{t('selected')}</span>}
    </div>
  );
});

const ShopDetailModal = memo(({ open, onClose, shop, darkMode, language, t }) => {
  const rows = shop ? [
    { Icon: FiMail, label: t('email'), value: shop.email },
    { Icon: FiPhone, label: t('phone'), value: shop.phone, ltr: true },
    { Icon: RiStoreLine, label: t('type'), value: shop.shopType },
    { Icon: FiMapPin, label: t('address'), value: shop.shopAddress ? [shop.shopAddress.street, shop.shopAddress.city, shop.shopAddress.state].filter(Boolean).join(', ') : '' },
    { Icon: FiCalendar, label: t('joined'), value: formatDate(shop.createdAt, language) },
  ].filter((r) => r.value) : [];
  const telHref = shop?.phone ? `tel:${shop.phone.replace(/[^\d+]/g, '')}` : null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[70]">
      <DialogBackdrop transition className="fixed inset-0 bg-black/60 backdrop-blur-sm duration-150 data-[closed]:opacity-0" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel transition className={`relative w-full max-w-md rounded-3xl border p-5 duration-150 data-[closed]:scale-95 data-[closed]:opacity-0 sm:p-6 ${surface(darkMode)}`}>
          {shop && (
            <>
              <div className="flex items-start gap-3">
                <Chip3D className="h-14 w-14 flex-shrink-0 text-2xl font-black">{shop.name.charAt(0).toUpperCase() || 'S'}</Chip3D>
                <div className="min-w-0 flex-1">
                  <DialogTitle className={`truncate text-lg font-extrabold ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{shop.name}</DialogTitle>
                  <p className={`mt-0.5 flex items-center gap-1.5 text-xs font-bold ${darkMode ? 'text-amber-300' : 'text-amber-600'}`}>
                    <RiStarFill className="h-3 w-3" />{shop.rating ? shop.rating.toFixed(1) : t('newRating')}
                    {shop.verified && <span className="ms-1 inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold text-white"><RiVerifiedBadgeLine className="h-3 w-3" /> Verified</span>}
                  </p>
                </div>
                <button type="button" onClick={onClose} aria-label={t('close') || 'Close'} className={`rounded-xl p-2 transition-colors ${darkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-500 hover:bg-emerald-100'}`}>
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              {shop.description && <p className={`mt-4 text-xs leading-relaxed sm:text-sm ${darkMode ? 'text-emerald-100/60' : 'text-emerald-900/70'}`}>{shop.description}</p>}
              <ul className="mt-4 space-y-2">
                {rows.map(({ Icon, label, value, ltr }) => (
                  <li key={label} className={`flex items-center gap-3 rounded-xl border p-2.5 ${innerBox(darkMode)}`}>
                    <Chip3D className="h-8 w-8 flex-shrink-0"><Icon className="h-4 w-4" /></Chip3D>
                    <div className="min-w-0">
                      <p className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                      <p className={`truncate text-xs font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`} dir={ltr ? 'ltr' : undefined}>{value}</p>
                    </div>
                  </li>
                ))}
              </ul>
              {telHref && (
                <Btn3D as="a" href={telHref} className="mt-5 w-full justify-center px-5 py-3 text-sm"><FiPhone className="h-4 w-4" /> {t('phone')}</Btn3D>
              )}
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
});

/* ───────────── Side panel ───────────── */
const InfoPanel = memo(({ step, darkMode, t }) => {
  const head = STEP_HEAD[step - 1];
  return (
    <div className={`relative overflow-hidden rounded-3xl border p-6 ${surface(darkMode)}`}>
      <DeviceScene compact className="mx-auto h-32 w-44" />
      <h3 className={`mt-4 text-sm font-extrabold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{t(head.infoTitle)}</h3>
      <p className={`mt-1.5 text-xs leading-relaxed ${darkMode ? 'text-emerald-100/60' : 'text-emerald-900/70'}`}>{t(head.infoBody)}</p>
    </div>
  );
});

/* ───────────── Journey (visible on every screen size) ───────────── */
const TONE = {
  progress: { chip: undefined, text: (d) => (d ? 'text-gray-100' : 'text-emerald-950') },
  success: { chip: undefined, text: (d) => (d ? 'text-gray-100' : 'text-emerald-950') },
  danger: { chip: 'am', text: (d) => (d ? 'text-red-400' : 'text-red-600') },
};
const JourneySection = memo(({ darkMode, t }) => (
  <section className={`py-12 sm:py-16 ${darkMode ? 'bg-[#04120b]' : 'bg-emerald-50/70'}`}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionBanner darkMode={darkMode} badge="Tracking" title={t('repairJourney')} subtitle="Follow your device from request to delivery." />
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STATUS_JOURNEY.map(({ key, labelKey, descKey, tone, Icon }) => (
          <li key={key} className={`flex items-start gap-3 rounded-2xl border p-4 ${innerBox(darkMode)}`}>
            <Chip3D tone={TONE[tone].chip} className="h-10 w-10 flex-shrink-0"><Icon className="h-5 w-5" /></Chip3D>
            <div className="min-w-0">
              <p className={`text-sm font-bold ${TONE[tone].text(darkMode)}`}>{t(labelKey)}</p>
              <p className={`mt-0.5 text-xs leading-snug ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{t(descKey)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  </section>
));

/* ───────────── Page ───────────── */
const RepairRequestContent = ({ darkMode }) => {
  const language = useAppLanguage();
  const navigate = useNavigate();
  const t = useCallback((key) => tr(language, key), [language]);
  const token = useAuthGuard();

  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(null);
  const [shop, setShop] = useState(null);
  const [submittedShop, setSubmittedShop] = useState(null);
  const [infoShop, setInfoShop] = useState(null);
  const [categoryPage, setCategoryPage] = useState(1);
  const [shopPage, setShopPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  useEffect(() => { document.title = 'Book Repair | Tech-Restore'; }, []);

  const categoriesQ = useQuery({
    queryKey: ['categories'],
    queryFn: async () => toList(await api.get('/api/categories', { headers: authHeaders() })).filter((c) => c && c.id != null).map(normalizeCategory),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  // Shops are only requested once the user actually reaches the shop step.
  const shopsQ = useQuery({
    queryKey: ['repairShops'],
    queryFn: async () =>
      toList(await api.get('/api/users/shops/all', { headers: authHeaders() }))
        .filter((s) => s && s.id != null)
        .map(normalizeShop)
        .filter((s) => s.shopType === 'BOTH' || s.shopType === 'REPAIRER'),
    enabled: step === 3 && !!category && !!token,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const err = categoriesQ.error || shopsQ.error;
    if (err && isUnauthorized(err)) expireSession(navigate);
  }, [categoriesQ.error, shopsQ.error, navigate]);

  const categories = categoriesQ.data || [];
  const shops = shopsQ.data || [];
  const categoryPages = Math.max(1, Math.ceil(categories.length / CATEGORY_PAGE_SIZE));
  const shopPages = Math.max(1, Math.ceil(shops.length / SHOP_PAGE_SIZE));
  const safeCatPage = Math.min(categoryPage, categoryPages);
  const safeShopPage = Math.min(shopPage, shopPages);
  const pagedCategories = useMemo(() => categories.slice((safeCatPage - 1) * CATEGORY_PAGE_SIZE, safeCatPage * CATEGORY_PAGE_SIZE), [categories, safeCatPage]);
  const pagedShops = useMemo(() => shops.slice((safeShopPage - 1) * SHOP_PAGE_SIZE, safeShopPage * SHOP_PAGE_SIZE), [shops, safeShopPage]);

  const submit = useMutation({
    mutationFn: ({ shopId, text, categoryId }) =>
      api.post(`/api/users/repair-request/${encodeURIComponent(shopId)}`, { description: text, deviceCategory: categoryId }, { headers: authHeaders() }),
    onSuccess: (_res, vars) => { setSubmittedShop(vars.shop); setStep(4); },
    onError: (err) => {
      if (isUnauthorized(err)) return expireSession(navigate);
      return toast({ icon: 'error', title: 'Failed to send', text: err.response?.data?.message || 'Something went wrong.' });
    },
  });

  const goTo = useCallback((n) => startTransition(() => setStep(n)), []);

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (!cleanText(description)) return toast({ icon: 'warning', title: 'Description required', text: "Please describe what's wrong with your device" });
      return goTo(2);
    }
    if (step === 2) {
      if (!category) return toast({ icon: 'warning', title: 'Select device type' });
      return goTo(3);
    }
    return undefined;
  }, [step, description, category, goTo]);

  const handleSend = useCallback(() => {
    if (!shop || !category || submit.isPending) return;
    const text = cleanText(description, MAX_DESC);
    if (!text) return;
    submit.mutate({ shopId: shop.id, text, categoryId: category.id, shop });
  }, [shop, category, description, submit]);

  const reset = useCallback(() => {
    setStep(1); setCategory(null); setShop(null); setDescription(''); setSubmittedShop(null); setCategoryPage(1); setShopPage(1); submit.reset();
  }, [submit]);

  const addSuggestion = useCallback((s) => setDescription((p) => (p ? `${p}, ${s.toLowerCase()}` : s).slice(0, MAX_DESC)), []);
  const closeInfo = useCallback(() => setInfoShop(null), []);

  const head = STEP_HEAD[step - 1];
  const heading = `text-center text-xl font-extrabold sm:text-2xl ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`;
  const sub = `mx-auto mt-1.5 mb-6 max-w-xl text-center text-xs sm:text-sm ${darkMode ? 'text-emerald-200/60' : 'text-emerald-800/70'}`;

  return (
    <div
      dir={languageDirection(language)}
      key={language}
      className={`min-h-screen overflow-x-hidden ${language === 'ar' ? 'font-cairo' : 'font-poppins'} ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
    >
      <Device3DStyles />
      <Defs3D />

      <Hero variant="repair" darkMode={darkMode} />
      <TrustStrip darkMode={darkMode} />

      <section className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionBanner
            darkMode={darkMode}
            badge={`${t('step')} ${step} ${t('of')} ${STEP_DEFS.length}`}
            title={t(head.title)}
            subtitle={t(head.subtitle)}
          />
          <Stepper step={step} darkMode={darkMode} t={t} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div aria-busy={isPending} className={`rounded-3xl border p-5 transition-opacity duration-150 sm:p-8 ${surface(darkMode)} ${isPending ? 'opacity-70' : ''}`}>
              {step === 1 && (
                <>
                  <h3 className={heading}>{t('describeProblem')}</h3>
                  <p className={sub}>{t('specificHelp')}</p>
                  <div className="mx-auto max-w-2xl">
                    <div className={`rounded-2xl border-2 transition-colors ${description.trim() ? 'border-emerald-500' : darkMode ? 'border-emerald-900/70' : 'border-emerald-100'} ${darkMode ? 'bg-gray-900/60' : 'bg-white'}`}>
                      <label htmlFor="repair-description" className="sr-only">{t('describeProblem')}</label>
                      <textarea
                        id="repair-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={MAX_DESC}
                        placeholder={t('issuePlaceholder')}
                        className={`min-h-[150px] w-full resize-none rounded-2xl bg-transparent px-4 py-4 text-sm outline-none sm:min-h-[180px] sm:px-5 sm:text-base ${darkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-500'}`}
                      />
                      <div className={`flex items-center justify-between border-t px-4 py-2 text-[11px] sm:px-5 ${darkMode ? 'border-emerald-900/70 text-gray-500' : 'border-emerald-100 text-gray-500'}`}>
                        <span>{t('tip')}</span>
                        <span className={`font-semibold tabular-nums ${description.length > 900 ? 'text-orange-500' : ''}`}>{description.length} / {MAX_DESC}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => addSuggestion(s)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${darkMode ? 'border-emerald-900/70 text-gray-300 hover:border-emerald-500 hover:text-emerald-300' : 'border-emerald-100 bg-white text-gray-600 hover:border-emerald-400 hover:text-emerald-700'}`}
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <NavButtons showBack={false} onNext={handleNext} nextDisabled={!description.trim()} darkMode={darkMode} t={t} />
                </>
              )}

              {step === 2 && (
                <>
                  <h3 className={heading}>{t('deviceType')}</h3>
                  <p className={sub}>{t('categorySubtitle')}</p>
                  {categoriesQ.isLoading ? (
                    <LoadingGrid count={6} darkMode={darkMode} className="grid grid-cols-2 gap-3 sm:grid-cols-3" itemClassName="h-28" />
                  ) : categoriesQ.isError ? (
                    <ErrorState darkMode={darkMode} label="We couldn't load device types." onRetry={categoriesQ.refetch} />
                  ) : categories.length === 0 ? (
                    <EmptyState darkMode={darkMode} label="No device types available yet." />
                  ) : (
                    <>
                      <div role="group" aria-label={t('deviceType')} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                        {pagedCategories.map((c) => (
                          <CategoryTile key={c.id} cat={c} active={category?.id === c.id} onSelect={setCategory} darkMode={darkMode} />
                        ))}
                      </div>
                      <Pager page={safeCatPage} totalPages={categoryPages} onChange={(p) => startTransition(() => setCategoryPage(p))} darkMode={darkMode} pending={isPending} />
                    </>
                  )}
                  <NavButtons onBack={() => goTo(1)} onNext={handleNext} nextDisabled={!category} darkMode={darkMode} t={t} />
                </>
              )}

              {step === 3 && (
                <>
                  <h3 className={heading}>{t('chooseShopTitle')}</h3>
                  <p className={sub}>{t('chooseShopSubtitle')}</p>
                  {shopsQ.isLoading ? (
                    <LoadingGrid count={4} darkMode={darkMode} className="grid grid-cols-1 gap-4 sm:grid-cols-2" itemClassName="h-44" />
                  ) : shopsQ.isError ? (
                    <ErrorState darkMode={darkMode} label="We couldn't load repair shops." onRetry={shopsQ.refetch} />
                  ) : shops.length === 0 ? (
                    <EmptyState darkMode={darkMode} label={t('noShops')} />
                  ) : (
                    <>
                      <div role="radiogroup" aria-label={t('chooseShopTitle')} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                        {pagedShops.map((s) => (
                          <ShopOption key={s.id} shop={s} active={shop?.id === s.id} onSelect={setShop} onInfo={setInfoShop} darkMode={darkMode} language={language} t={t} />
                        ))}
                      </div>
                      <Pager page={safeShopPage} totalPages={shopPages} onChange={(p) => startTransition(() => setShopPage(p))} darkMode={darkMode} pending={isPending} />
                    </>
                  )}
                  <NavButtons onBack={() => goTo(2)} onNext={handleSend} nextLabel={t('sendRepairRequest')} nextDisabled={!shop} isLoading={submit.isPending} darkMode={darkMode} t={t} />
                </>
              )}

              {step === 4 && (
                <div className="flex flex-col items-center py-4 text-center" role="status">
                  <DeviceScene compact className="h-28 w-40" />
                  <Chip3D className="-mt-2 h-14 w-14"><FiCheck className="h-7 w-7" /></Chip3D>
                  <h3 className={`mt-4 text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{t('requestSent')}</h3>
                  <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('requestSentTo')}</p>
                  <p className={`mt-1 text-base font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{submittedShop?.name || t('defaultShopName')}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {submittedShop?.shopAddress?.city || t('defaultCity')}{submittedShop?.shopAddress?.state ? `, ${submittedShop.shopAddress.state}` : ''}
                  </p>
                  <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
                    <Btn3D tone="soft" darkMode={darkMode} onClick={reset} className="flex-1 justify-center px-5 py-3 text-sm">{t('newRequest')}</Btn3D>
                    <Btn3D onClick={() => navigate('/account')} className="flex-1 justify-center px-5 py-3 text-sm">{t('viewMyRequests')} <FiArrowRight className="h-4 w-4 rtl:rotate-180" /></Btn3D>
                  </div>
                </div>
              )}
            </div>

            <aside className="hidden lg:block"><InfoPanel step={step} darkMode={darkMode} t={t} /></aside>
          </div>
        </div>
      </section>

      <JourneySection darkMode={darkMode} t={t} />

      <ShopDetailModal open={!!infoShop} onClose={closeInfo} shop={infoShop} darkMode={darkMode} language={language} t={t} />
    </div>
  );
};

const RepairRequest = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <RepairRequestContent {...props} />
  </QueryClientProvider>
));

export default RepairRequest;