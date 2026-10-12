import React, {
  useState, useEffect, useCallback, useRef, useMemo, memo, Suspense, lazy, useDeferredValue,
} from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiSearch, FiMapPin, FiChevronLeft, FiChevronRight, FiChevronDown, FiX, FiSliders, FiCheck,
  FiGrid, FiList, FiArrowRight, FiArrowUp, FiShield, FiTool, FiRefreshCw, FiPhone, FiShoppingBag,
  FiExternalLink, FiInfo,
} from 'react-icons/fi';
import { RiStarFill, RiVerifiedBadgeLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';

const Hero = lazy(() => import('../components/Hero'));
const queryClient = new QueryClient();

/* ───────────── helpers ───────────── */
const SHOPS_TRANSLATIONS = {
  en: enTranslations.shops,
  ar: arTranslations.shops || arTranslations.hero?.shops,
  fr: frTranslations.shops || frTranslations.hero?.shops,
};
const tr = (lang, key) => SHOPS_TRANSLATIONS[lang]?.[key] || SHOPS_TRANSLATIONS.en?.[key] || key;

// Assumes each shop has `role`: 'REPAIRER' | 'SELLER' | 'BOTH'. Change here if your API differs.
const getShopRole = (s) => s.role || 'BOTH';
const serviceLabel = (r) => (r === 'REPAIRER' ? 'Repair' : r === 'SELLER' ? 'Sell & Trade-in' : 'Repair & Sell');
const addressLine = (s) => [s.shopAddress?.street, s.shopAddress?.city].filter(Boolean).join(', ');
const PAGE_SIZES = [9, 18, 36];

// What a shop can do, derived from its role (shown in the details modal).
const REPAIR_CAPS = [
  { icon: FiTool, title: 'Device repairs', text: 'Screens, batteries, charging ports and diagnostics.' },
  { icon: FiShield, title: 'Certified work', text: 'Repairs are carried out by checked technicians.' },
];
const SELL_CAPS = [
  { icon: FiShoppingBag, title: 'Buy & sell devices', text: 'Browse devices or sell the ones you no longer use.' },
  { icon: FiRefreshCw, title: 'Trade-in credit', text: 'Get an estimate for your old device and save on the next.' },
];
const capabilitiesFor = (role) => {
  if (role === 'REPAIRER') return REPAIR_CAPS;
  if (role === 'SELLER') return SELL_CAPS;
  return [...REPAIR_CAPS, ...SELL_CAPS];
};

const pageStyles = `
  @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .anim-float { animation: floatY 6s ease-in-out infinite; }
  .hide-scrollbar { scrollbar-width: none; }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  @media (prefers-reduced-motion: reduce) { .anim-float { animation: none !important; } }
`;

/* ───────────── 3D emerald glyphs (gradients defined once) ───────────── */
const kindOf = (name = '') => {
  const k = name.toLowerCase();
  if (k.includes('repair') || k.includes('service') || k.includes('fix')) return 'wrench';
  if (k.includes('phone') || k.includes('mobile')) return 'phone';
  if (k.includes('laptop') || k.includes('computer') || k.includes('pc')) return 'laptop';
  return 'store';
};

const Defs3D = memo(() => (
  <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
    <defs>
      {[['em', '#6EE7B7', '#047857'], ['fr', '#0F766E', '#022C22'], ['sd', '#064E3B', '#011A14'], ['sc', '#A7F3D0', '#059669'], ['lt', '#FFFFFF', '#BBF7D0']].map(([id, a, b]) => (
        <linearGradient key={id} id={`g3-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={a} /><stop offset="100%" stopColor={b} />
        </linearGradient>
      ))}
    </defs>
  </svg>
));

const Glyph3D = memo(({ name = '', className = 'w-10 h-10' }) => {
  const fr = 'url(#g3-fr)', sd = 'url(#g3-sd)', sc = 'url(#g3-sc)', lt = 'url(#g3-lt)', em = 'url(#g3-em)';
  const W = '#fff';
  let body;
  switch (kindOf(name)) {
    case 'wrench':
      body = (<>
        <rect x="26" y="26" width="14" height="38" rx="6" fill={sd} transform="rotate(-40 33 45) translate(3 3)" />
        <rect x="26" y="26" width="14" height="38" rx="6" fill={fr} transform="rotate(-40 33 45)" />
        <circle cx="42" cy="22" r="15" fill={em} />
        <circle cx="42" cy="22" r="7" fill={sd} />
        <rect x="35" y="3" width="14" height="12" fill={sd} transform="rotate(25 42 22)" />
      </>); break;
    case 'phone':
      body = (<>
        <rect x="22" y="6" width="26" height="56" rx="7" fill={sd} />
        <rect x="18" y="2" width="26" height="56" rx="7" fill={fr} />
        <rect x="21" y="5.5" width="20" height="49" rx="4.5" fill={sc} />
        <path d="M21 32V10a4.5 4.5 0 014.5-4.5H34z" fill={W} opacity="0.3" />
        <rect x="24" y="12" width="14" height="3.5" rx="1.7" fill={W} opacity="0.9" />
        <rect x="24" y="40" width="14" height="10" rx="3" fill={W} opacity="0.3" />
      </>); break;
    case 'laptop':
      body = (<>
        <rect x="14" y="12" width="42" height="29" rx="4" fill={sd} />
        <rect x="11" y="9" width="42" height="29" rx="4" fill={fr} />
        <rect x="14" y="12" width="36" height="23" rx="2" fill={sc} />
        <path d="M14 28V14a2 2 0 012-2h20z" fill={W} opacity="0.3" />
        <rect x="4" y="45" width="56" height="8" rx="4" fill={sd} />
        <rect x="4" y="41" width="56" height="8" rx="4" fill={lt} />
      </>); break;
    default: // store
      body = (<>
        <rect x="10" y="26" width="46" height="34" rx="4" fill={sd} />
        <rect x="8" y="24" width="46" height="34" rx="4" fill={lt} />
        <rect x="26" y="38" width="14" height="20" rx="2" fill={fr} />
        <rect x="12" y="32" width="10" height="10" rx="2" fill={sc} />
        <path d="M6 24l5-16h42l5 16z" fill={em} />
        <path d="M6 24h52v5a8 8 0 01-13 0 8 8 0 01-13 0 8 8 0 01-13 0 8 8 0 01-13 0z" fill={fr} />
      </>);
  }
  return <svg viewBox="0 0 64 64" className={`drop-shadow-[0_6px_5px_rgba(2,44,34,0.35)] ${className}`} aria-hidden="true">{body}</svg>;
});

const ShopScene = memo(({ className = 'w-40 h-32', compact = false }) => (
  <div className={`relative flex-shrink-0 ${className}`} aria-hidden="true">
    <div className="absolute inset-x-3 bottom-0 h-4 rounded-full bg-emerald-900/25 blur-md" />
    <Glyph3D name="store" className="absolute bottom-1 left-0 h-[78%] w-[62%]" />
    <Glyph3D name="phone" className="anim-float absolute right-[10%] top-0 h-[72%] w-[28%]" />
    {!compact && <Glyph3D name="repair" className="absolute bottom-0 right-0 h-[40%] w-[24%]" />}
  </div>
));

const Btn3D = memo(({ as: Tag = 'button', tone = 'em', darkMode, className = '', children, ...rest }) => {
  const tones = {
    em: 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white ring-1 ring-inset ring-white/30 shadow-[0_4px_0_0_#047857,0_10px_16px_-8px_rgba(5,150,105,0.6)] hover:from-emerald-300 hover:to-emerald-500 active:shadow-[0_1px_0_0_#047857]',
    soft: darkMode
      ? 'bg-gray-800 text-gray-200 border border-gray-700 shadow-[0_4px_0_0_#030712] hover:bg-gray-700 active:shadow-[0_1px_0_0_#030712]'
      : 'bg-white text-gray-700 border border-gray-200 shadow-[0_4px_0_0_#d1d5db] hover:bg-gray-50 active:shadow-[0_1px_0_0_#d1d5db]',
  };
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all duration-100 active:translate-y-[3px] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
});

const Chip3D = ({ children, className = '' }) => (
  <span className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-600 text-white shadow-[0_3px_0_0_#047857] ${className}`}>
    <span className="drop-shadow-[0_2px_1px_rgba(0,0,0,0.35)]">{children}</span>
  </span>
);

/* ───────────── Shop card (compact) ───────────── */
const InfoRow = ({ icon: Icon, children, darkMode }) => (
  <p className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
    <Icon className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
    <span className="truncate">{children}</span>
  </p>
);

const ShopCard = memo(({ shop, darkMode, index = 0, layout = 'grid', onDetails }) => {
  const role = getShopRole(shop);
  const address = addressLine(shop);
  const isList = layout === 'list';
  const hasRating = typeof shop.rating === 'number' && shop.rating > 0;
  const go = useCallback(() => window.location.assign(`/shops/${encodeURIComponent(shop.id)}`), [shop.id]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.025 }}
      onClick={go}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) go(); }}
      tabIndex={0}
      aria-label={shop.name}
      className={`group relative flex h-full cursor-pointer gap-3 overflow-hidden rounded-2xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${
        isList ? 'flex-col sm:flex-row sm:items-center' : 'flex-col'
      } ${darkMode ? 'border-gray-700 bg-gray-800 hover:shadow-lg hover:shadow-black/30' : 'border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-200/70'}`}
    >
      {/* header: glyph + name + rating */}
      <div className={`flex min-w-0 items-center gap-3 ${isList ? 'sm:w-64 sm:flex-shrink-0' : ''}`}>
        <span className={`relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${darkMode ? 'bg-emerald-900/40' : 'bg-gradient-to-br from-emerald-50 to-emerald-100'}`}>
          <Glyph3D name={shop.shopType} className="h-9 w-9 transition-transform duration-200 group-hover:scale-110" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className={`truncate text-sm font-bold leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>{shop.name || 'Unnamed shop'}</h3>
            {shop.verified && <RiVerifiedBadgeLine className="h-4 w-4 flex-shrink-0 text-sky-500" title="Verified" />}
          </div>
          <p className={`truncate text-[11px] font-semibold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{shop.shopType || 'Electronics'}</p>
        </div>
        {hasRating && (
          <span className={`flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${darkMode ? 'bg-gray-900 text-white' : 'bg-amber-50 text-amber-700'}`}>
            <RiStarFill className="h-3 w-3 text-amber-400" /> {shop.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* key details with icons */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <InfoRow icon={FiTool} darkMode={darkMode}>{serviceLabel(role)}</InfoRow>
        {address && <InfoRow icon={FiMapPin} darkMode={darkMode}>{address}</InfoRow>}
        {shop.phone && <InfoRow icon={FiPhone} darkMode={darkMode}><span dir="ltr">{shop.phone}</span></InfoRow>}
      </div>

      {/* actions */}
      <div className={`grid grid-cols-2 gap-2 border-t pt-3 ${isList ? 'sm:w-56 sm:flex-shrink-0 sm:border-s sm:border-t-0 sm:ps-3 sm:pt-0' : 'mt-auto'} ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <Btn3D tone="soft" darkMode={darkMode} onClick={(e) => { e.stopPropagation(); onDetails?.(shop); }} className="py-2 text-xs">
          <FiInfo className="h-3.5 w-3.5" /> Details
        </Btn3D>
        <Btn3D onClick={(e) => { e.stopPropagation(); go(); }} className="py-2 text-xs">
          <FiExternalLink className="h-3.5 w-3.5" /> Visit shop
        </Btn3D>
      </div>
    </motion.article>
  );
});

/* ───────────── Shop details modal ───────────── */
const ShopDetailsModal = memo(({ shop, darkMode, onClose }) => {
  const role = getShopRole(shop);
  const caps = capabilitiesFor(role);
  const address = addressLine(shop);
  const hasRating = typeof shop.rating === 'number' && shop.rating > 0;
  const go = () => window.location.assign(`/shops/${encodeURIComponent(shop.id)}`);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const strong = darkMode ? 'text-white' : 'text-gray-900';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={shop.name}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }} transition={{ duration: 0.2 }}
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border shadow-2xl sm:max-w-lg sm:rounded-3xl ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-white'}`}
      >
        {/* header */}
        <div className={`relative flex items-center gap-4 p-5 ${darkMode ? 'bg-gradient-to-br from-emerald-900 to-gray-900' : 'bg-gradient-to-br from-emerald-50 to-emerald-100'}`}>
          <span className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl ${darkMode ? 'bg-white/10' : 'bg-white'}`}>
            <Glyph3D name={shop.shopType} className="h-11 w-11" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className={`truncate text-lg font-extrabold ${strong}`}>{shop.name || 'Unnamed shop'}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">{serviceLabel(role)}</span>
              {shop.verified && (
                <span className="flex items-center gap-1 rounded-md bg-sky-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                  <RiVerifiedBadgeLine className="h-3 w-3" /> Verified
                </span>
              )}
              {hasRating && (
                <span className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}>
                  <RiStarFill className="h-3 w-3 text-amber-400" /> {shop.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className={`absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-full ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* description */}
          <section>
            <h3 className={`mb-1.5 text-xs font-bold uppercase tracking-wider ${muted}`}>About</h3>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {shop.description || 'This shop has not added a description yet.'}
            </p>
          </section>

          {/* what it can do */}
          <section>
            <h3 className={`mb-2 text-xs font-bold uppercase tracking-wider ${muted}`}>What this shop can do</h3>
            <ul className="grid gap-2.5">
              {caps.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-3">
                  <Chip3D className="mt-0.5 h-8 w-8 flex-shrink-0"><Icon className="h-4 w-4" /></Chip3D>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${strong}`}>{title}</p>
                    <p className={`text-xs ${muted}`}>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* contact */}
          {(address || shop.phone || shop.shopType) && (
            <section className={`grid gap-2 rounded-2xl border p-3.5 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-100 bg-gray-50'}`}>
              {shop.shopType && <InfoRow icon={FiShoppingBag} darkMode={darkMode}>{shop.shopType}</InfoRow>}
              {address && <InfoRow icon={FiMapPin} darkMode={darkMode}>{address}</InfoRow>}
              {shop.phone && <InfoRow icon={FiPhone} darkMode={darkMode}><span dir="ltr">{shop.phone}</span></InfoRow>}
            </section>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Btn3D tone="soft" darkMode={darkMode} onClick={onClose} className="py-2.5 text-sm">Close</Btn3D>
            <Btn3D onClick={go} className="py-2.5 text-sm"><FiExternalLink className="h-4 w-4" /> Visit shop</Btn3D>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

/* ───────────── Specialty grid (white cards) ───────────── */
const SpecialtyGrid = memo(({ shopTypes, countsByType, selected, onToggle, onReset, darkMode, title, subtitle }) => {
  const top = useMemo(() => [...shopTypes].sort((a, b) => (countsByType[b] || 0) - (countsByType[a] || 0)).slice(0, 6), [shopTypes, countsByType]);
  if (!top.length) return null;
  return (
    <section className={`relative overflow-hidden py-12 sm:py-16 ${darkMode ? 'bg-[#04120b]' : 'bg-emerald-50/70'}`}>
      <div className={`pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full blur-3xl ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-300/30'}`} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6 sm:mb-10">
          <div className="flex items-center gap-6">
            <div>
              <h2 className={`text-2xl font-bold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{title}</h2>
              <p className={`mt-1.5 text-sm sm:text-base ${darkMode ? 'text-emerald-200/60' : 'text-emerald-800/70'}`}>{subtitle}</p>
            </div>
            <ShopScene className="hidden h-28 w-40 lg:block" />
          </div>
          <Btn3D onClick={onReset} className="px-4 py-2 text-sm">All shops <FiArrowRight className="h-4 w-4 rtl:rotate-180" /></Btn3D>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {top.map((type) => {
            const active = selected.includes(type);
            return (
              <button
                key={type} type="button" onClick={() => onToggle(type)} aria-pressed={active}
                className={`group relative flex flex-col items-center gap-2.5 overflow-hidden rounded-3xl border p-4 text-center transition-all duration-150 hover:-translate-y-1 active:translate-y-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 sm:p-5 ${
                  active
                    ? 'border-emerald-500 bg-white shadow-[0_6px_0_0_#047857,0_16px_24px_-10px_rgba(5,150,105,0.5)] ring-2 ring-emerald-500'
                    : 'border-gray-200 bg-white shadow-[0_6px_0_0_#d1fae5] hover:border-emerald-400'
                }`}
              >
                <span className={`flex h-20 w-20 items-center justify-center rounded-2xl ring-1 ${active ? 'bg-emerald-100 ring-emerald-300' : 'bg-emerald-50 ring-emerald-100'}`}>
                  <Glyph3D name={type} className="h-14 w-14 transition-transform duration-200 group-hover:scale-110" />
                </span>
                <span className="line-clamp-1 text-sm font-bold text-emerald-950">{type}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${active ? 'bg-emerald-500 text-white' : 'bg-emerald-600/10 text-emerald-700'}`}>
                  {countsByType[type] || 0} {countsByType[type] === 1 ? 'shop' : 'shops'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});

const TrustStrip = memo(({ darkMode }) => {
  const items = [
    { icon: RiVerifiedBadgeLine, title: 'Verified shops', text: 'Checked by our team' },
    { icon: FiTool, title: 'Certified repairs', text: '12-month warranty' },
    { icon: FiRefreshCw, title: 'Trade-in credit', text: 'Instant estimates' },
    { icon: FiShield, title: 'Safe recycling', text: 'Less e-waste' },
  ];
  return (
    <div className={`border-y ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 sm:px-6 md:grid-cols-4 lg:px-8">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3">
            <Chip3D className="h-10 w-10 flex-shrink-0"><Icon className="h-5 w-5" /></Chip3D>
            <div className="min-w-0">
              <p className={`truncate text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
              <p className={`truncate text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

/* ───────────── Filters ───────────── */
const FilterSection = memo(({ title, isOpen, onToggle, darkMode, children }) => (
  <div className={`border-b py-4 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
    <button type="button" onClick={onToggle} aria-expanded={isOpen}
      className={`flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
      {title}
      <FiChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
    </button>
    <div className={`grid transition-[grid-template-rows,opacity] duration-200 ${isOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="overflow-hidden">{children}</div>
    </div>
  </div>
));

const OptionRow = memo(({ type, label, count, selected, onClick, darkMode, icon }) => (
  <button type="button" role={type === 'radio' ? 'radio' : 'checkbox'} aria-checked={selected} onClick={onClick}
    className="group flex w-full items-center gap-3 rounded-md py-1.5 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400">
    <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center border-2 transition-colors ${type === 'radio' ? 'rounded-full' : 'rounded'} ${
      selected ? `border-emerald-500 ${type === 'check' ? 'bg-emerald-500' : ''}` : darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
      {selected && (type === 'radio' ? <span className="h-2 w-2 rounded-full bg-emerald-500" /> : <FiCheck className="h-3 w-3 text-white" />)}
    </span>
    <span className={`flex flex-1 items-center gap-1.5 truncate text-sm ${selected ? 'font-semibold text-emerald-500' : darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>{icon}{label}</span>
    {count !== undefined && <span className={`text-xs tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{count}</span>}
  </button>
));

const Pill = memo(({ label, active, onClick, darkMode }) => (
  <button type="button" onClick={onClick} aria-pressed={active}
    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${active ? 'border-emerald-500 bg-emerald-500 text-white' : darkMode ? 'border-gray-700 text-gray-300 hover:border-emerald-500' : 'border-gray-200 text-gray-600 hover:border-emerald-500'}`}>
    {label}
  </button>
));

const FilterPanel = memo((p) => {
  const { darkMode, t, shopTypes, countsByType, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    roleFilter, setRoleFilter, roleCounts, minRating, setMinRating, showVerifiedOnly, setShowVerifiedOnly,
    open, setOpen, clearFilters, activeFiltersCount } = p;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const star = <RiStarFill className="h-3.5 w-3.5 text-amber-400" />;
  return (
    <div className={`rounded-2xl border p-5 ${darkMode ? 'border-emerald-900/60 bg-gray-900' : 'border-emerald-100 bg-white'}`}>
      <div className="mb-1 flex items-center justify-between">
        <h3 className={`flex items-center gap-2 text-sm font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <Chip3D className="h-7 w-7"><FiSliders className="h-3.5 w-3.5" /></Chip3D> {t('filters')}
        </h3>
        {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className="text-xs font-semibold text-emerald-500 hover:text-emerald-400">Reset all</button>}
      </div>

      <FilterSection title="Service type" isOpen={open.role} onToggle={() => toggle('role')} darkMode={darkMode}>
        <div role="radiogroup" aria-label="Service type">
          <OptionRow type="radio" label="All shops" count={roleCounts.ALL} selected={roleFilter === 'ALL'} onClick={() => setRoleFilter('ALL')} darkMode={darkMode} />
          <OptionRow type="radio" label="Repair services" count={roleCounts.REPAIRER} selected={roleFilter === 'REPAIRER'} onClick={() => setRoleFilter('REPAIRER')} darkMode={darkMode} />
          <OptionRow type="radio" label="Sell & trade-in" count={roleCounts.SELLER} selected={roleFilter === 'SELLER'} onClick={() => setRoleFilter('SELLER')} darkMode={darkMode} />
        </div>
      </FilterSection>

      <FilterSection title={t('shopType')} isOpen={open.type} onToggle={() => toggle('type')} darkMode={darkMode}>
        {shopTypes.length === 0
          ? <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('noTypes')}</p>
          : <div className="max-h-52 overflow-y-auto pe-1">
              {shopTypes.map((ty) => <OptionRow key={ty} type="check" label={ty} count={countsByType[ty] || 0} selected={selectedShopTypes.includes(ty)} onClick={() => toggleShopType(ty)} darkMode={darkMode} />)}
            </div>}
      </FilterSection>

      {cities.length > 0 && (
        <FilterSection title={t('city')} isOpen={open.city} onToggle={() => toggle('city')} darkMode={darkMode}>
          <div className="flex flex-wrap gap-1.5">
            {cities.map((c) => <Pill key={c} label={c} active={selectedCities.includes(c)} onClick={() => toggleCity(c)} darkMode={darkMode} />)}
          </div>
        </FilterSection>
      )}

      <FilterSection title={t('minimumRating')} isOpen={open.rating} onToggle={() => toggle('rating')} darkMode={darkMode}>
        <div role="radiogroup" aria-label={t('minimumRating')}>
          {[{ v: 0, l: t('anyRating') }, { v: 4, l: '4+ stars', i: star }, { v: 4.5, l: '4.5+ stars', i: star }, { v: 4.8, l: '4.8+ stars', i: star }].map((o) => (
            <OptionRow key={o.v} type="radio" label={o.l} icon={o.i} selected={minRating === o.v} onClick={() => setMinRating(o.v)} darkMode={darkMode} />
          ))}
        </div>
        <div className="mt-1">
          <OptionRow type="check" label={t('verifiedOnly')} selected={showVerifiedOnly} onClick={() => setShowVerifiedOnly((v) => !v)} darkMode={darkMode} />
        </div>
      </FilterSection>
    </div>
  );
});

/* ───────────── Pagination ───────────── */
function getPaginationRange(current, total) {
  if (total <= 1) return [1];
  const middle = [];
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) middle.push(i);
  const range = [1];
  if (current - 1 > 2) range.push('…');
  range.push(...middle);
  if (current + 1 < total - 1) range.push('…');
  range.push(total);
  return range;
}

const PageBtn = memo(({ children, active, darkMode, ...rest }) => (
  <button type="button" aria-current={active ? 'page' : undefined} {...rest}
    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all duration-100 active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-40 ${
      active ? 'bg-emerald-500 text-white shadow-[0_3px_0_0_#047857]'
        : darkMode ? 'bg-gray-800 text-gray-300 shadow-[0_3px_0_0_#030712] hover:text-emerald-400' : 'border border-gray-200 bg-white text-gray-600 shadow-[0_3px_0_0_#d1d5db] hover:text-emerald-700'}`}>
    {children}
  </button>
));

/* ───────────── Page ───────────── */
const ShopsContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const t = useCallback((k) => tr(language, k), [language]);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [viewMode, setViewMode] = useState('grid');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedShopTypes, setSelectedShopTypes] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [detailsShop, setDetailsShop] = useState(null);
  const [open, setOpen] = useState({ role: true, type: true, city: true, rating: true });
  const [showTop, setShowTop] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const sliderRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => { document.title = 'Verified Shops | Tech-Restore'; }, []);

  const { data: shops = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['shopsList'],
    queryFn: async () => {
      const res = await api.get('/api/users/shops/all');
      const list = res.data?.content || res.data || [];
      return Array.isArray(list) ? list.filter(Boolean) : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  /* derived data – each memo depends only on what it needs */
  const shopTypes = useMemo(() => [...new Set(shops.map((s) => s.shopType).filter(Boolean))].sort(), [shops]);
  const cities = useMemo(() => [...new Set(shops.map((s) => s.shopAddress?.city).filter(Boolean))].sort(), [shops]);
  const countsByType = useMemo(() => {
    const m = {};
    shops.forEach((s) => { if (s.shopType) m[s.shopType] = (m[s.shopType] || 0) + 1; });
    return m;
  }, [shops]);
  const roleCounts = useMemo(() => {
    let rep = 0, sell = 0;
    shops.forEach((s) => { const r = getShopRole(s); if (r !== 'SELLER') rep++; if (r !== 'REPAIRER') sell++; });
    return { ALL: shops.length, REPAIRER: rep, SELLER: sell };
  }, [shops]);
  const topRated = useMemo(
    () => shops.filter((s) => s.rating > 0).sort((a, b) => b.rating - a.rating).slice(0, 8),
    [shops]
  );

  const filteredShops = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    const list = shops.filter((s) => {
      const role = getShopRole(s);
      if (roleFilter !== 'ALL' && role !== roleFilter && role !== 'BOTH') return false;
      if (selectedShopTypes.length && !selectedShopTypes.includes(s.shopType)) return false;
      if (selectedCities.length && !selectedCities.includes(s.shopAddress?.city)) return false;
      if ((s.rating || 0) < minRating) return false;
      if (showVerifiedOnly && !s.verified) return false;
      if (term) {
        const hay = `${s.name || ''} ${s.shopType || ''} ${s.shopAddress?.city || ''} ${s.shopAddress?.street || ''} ${s.description || ''} ${s.phone || ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    if (sortBy === 'ratingHighToLow') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === 'nameAZ') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return list;
  }, [shops, deferredSearch, roleFilter, selectedShopTypes, selectedCities, minRating, showVerifiedOnly, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredShops.length / pageSize));
  useEffect(() => { setCurrentPage(1); }, [pageSize, deferredSearch, roleFilter, selectedShopTypes, selectedCities, minRating, showVerifiedOnly, sortBy]);
  useEffect(() => { setCurrentPage((p) => Math.min(p, totalPages)); }, [totalPages]);

  const paginated = useMemo(() => filteredShops.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredShops, currentPage, pageSize]);
  const startItem = filteredShops.length ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, filteredShops.length);

  /* actions */
  const scrollToGrid = useCallback(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), []);
  const toggleShopType = useCallback((ty) => setSelectedShopTypes((p) => (p.includes(ty) ? p.filter((x) => x !== ty) : [...p, ty])), []);
  const toggleCity = useCallback((c) => setSelectedCities((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])), []);
  const pickSpecialty = useCallback((ty) => { toggleShopType(ty); scrollToGrid(); }, [toggleShopType, scrollToGrid]);
  const clearFilters = useCallback(() => {
    setSearchTerm(''); setRoleFilter('ALL'); setSelectedShopTypes([]); setSelectedCities([]); setMinRating(0); setShowVerifiedOnly(false); setSortBy('relevance'); setCurrentPage(1);
  }, []);
  const resetSpecialty = useCallback(() => { setSelectedShopTypes([]); scrollToGrid(); }, [scrollToGrid]);
  const openDetails = useCallback((shop) => setDetailsShop(shop), []);
  const closeDetails = useCallback(() => setDetailsShop(null), []);

  const activeFiltersCount = (searchTerm ? 1 : 0) + (roleFilter !== 'ALL' ? 1 : 0) + selectedShopTypes.length + selectedCities.length + (minRating > 0 ? 1 : 0) + (showVerifiedOnly ? 1 : 0);

  /* slider arrows (RTL-safe via Math.abs) */
  const scrollSlider = useCallback((dir) => {
    const sign = document.dir === 'rtl' ? -1 : 1;
    sliderRef.current?.scrollBy({ left: (dir === 'left' ? -340 : 340) * sign, behavior: 'smooth' });
  }, []);
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return undefined;
    let raf;
    const check = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = Math.abs(el.scrollLeft);
        setCanScrollLeft(x > 2);
        setCanScrollRight(x + el.clientWidth < el.scrollWidth - 5);
      });
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); cancelAnimationFrame(raf); };
  }, [topRated]);

  useEffect(() => {
    let raf;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setShowTop(window.scrollY > 700)); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setIsSidebarOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [isSidebarOpen]);

  const heroButtons = useMemo(() => [
    { label: language === 'ar' ? 'ابحث عن متجر' : language === 'fr' ? 'Trouver une boutique' : 'Find Nearby Shop', onClick: scrollToGrid, primary: true },
    { label: language === 'ar' ? 'تصفح الأجهزة' : language === 'fr' ? 'Parcourir les appareils' : 'Browse Devices', to: '/devices', primary: false },
  ], [scrollToGrid, language]);

  const sortLabels = useMemo(() => ({ relevance: 'Relevance', ratingHighToLow: 'Rating: high to low', nameAZ: 'Name: A to Z' }), []);

  const filterPanelProps = {
    darkMode, t, shopTypes, countsByType, selectedShopTypes, toggleShopType, cities, selectedCities, toggleCity,
    roleFilter, setRoleFilter, roleCounts, minRating, setMinRating, showVerifiedOnly, setShowVerifiedOnly,
    open, setOpen, clearFilters, activeFiltersCount,
  };

  const gridCols = viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1';
  const showSliderArrows = topRated.length > 3 && (canScrollLeft || canScrollRight);
  const arrowBtn = (dir, disabled) => (
    <Btn3D tone="soft" darkMode={darkMode} onClick={() => scrollSlider(dir)} disabled={disabled} aria-label={`Scroll ${dir}`} className="h-10 w-10">
      {dir === 'left' ? <FiChevronLeft className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}
    </Btn3D>
  );
  const chip = (label, onRemove) => (
    <span key={label} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${darkMode ? 'bg-emerald-400/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}><FiX className="h-3 w-3" /></button>
    </span>
  );
  const selectCls = `rounded-xl border px-3 py-2 text-sm font-medium outline-none focus:border-emerald-500 ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-200 bg-white text-gray-700'}`;
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const strong = darkMode ? 'text-white' : 'text-gray-900';

  return (
    <div
      dir={languageDirection(language)}
      className={`min-h-screen ${language === 'ar' ? 'font-cairo' : 'font-poppins'} ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
    >
      <style>{pageStyles}</style>
      <Defs3D />

      <Suspense fallback={<div className={`h-[420px] w-full animate-pulse sm:h-[480px] ${darkMode ? 'bg-gray-900' : 'bg-emerald-50'}`} />}>
        <Hero
          variant="shop"
          darkMode={darkMode}
          badge={language === 'ar' ? 'مراكز خدمة رسمية' : language === 'fr' ? 'Centres de service officiels' : 'Official Service Centers'}
          headingLine1={language === 'ar' ? 'أصلح، بِع، أو' : language === 'fr' ? 'Réparez, vendez ou' : 'Repair, Sell, or'}
          headingAccent={language === 'ar' ? 'طوّر' : language === 'fr' ? 'améliorez' : 'Upgrade'}
          headingLine2={language === 'ar' ? 'جهازك' : language === 'fr' ? 'votre appareil' : 'Your Tech'}
          description={
            language === 'ar'
              ? 'قم بزيارة متاجرنا المعتمدة للحصول على إصلاحات احترافية وأفضل قيمة استبدال. نعيد الحياة لأجهزتك مع تقليل النفايات الإلكترونية.'
              : language === 'fr'
              ? 'Visitez nos boutiques certifiées pour des réparations professionnelles et les meilleures valeurs de reprise. Nous redonnons vie à vos appareils tout en réduisant les déchets électroniques.'
              : 'Visit our certified shops for professional repairs and the best trade-in values. We breathe new life into your devices while reducing electronic waste.'
          }
          buttons={heroButtons}
        />
      </Suspense>

      <TrustStrip darkMode={darkMode} />
      {!isLoading && (
        <SpecialtyGrid shopTypes={shopTypes} countsByType={countsByType} selected={selectedShopTypes} onToggle={pickSpecialty} onReset={resetSpecialty}
          darkMode={darkMode} title={t('findExpert')} subtitle={t('browseSpecialty')} />
      )}

      {!isLoading && topRated.length > 0 && (
        <section className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={`relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-8 ${darkMode ? 'bg-gradient-to-br from-emerald-900 via-emerald-950 to-gray-950 ring-1 ring-emerald-500/20' : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800'}`}>
              <div className="pointer-events-none absolute -end-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div className="max-w-md">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white"><RiStarFill className="h-3 w-3 text-amber-300" /> Top rated</span>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Customer favorites</h2>
                  <p className="mt-1 text-sm text-emerald-50/80">The highest-rated shops right now.</p>
                  {showSliderArrows && <div className="mt-4 flex gap-2">{arrowBtn('left', !canScrollLeft)}{arrowBtn('right', !canScrollRight)}</div>}
                </div>
                <ShopScene className="hidden h-32 w-48 sm:block lg:h-36 lg:w-56" />
              </div>
            </div>
            <div ref={sliderRef} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 sm:gap-5">
              {topRated.map((s, i) => (
                <div key={s.id} className="w-[290px] flex-shrink-0 snap-start sm:w-[310px]">
                  <ShopCard shop={s} darkMode={darkMode} index={i} onDetails={openDetails} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div id="shop-results" ref={gridRef} className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex items-start gap-6 lg:gap-8">
          <aside className="sticky top-20 hidden max-h-[calc(100vh-5rem)] w-64 flex-shrink-0 self-start overflow-y-auto lg:block xl:w-72">
            <FilterPanel {...filterPanelProps} />
          </aside>

          <div className="w-full min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <p className={`whitespace-nowrap text-sm ${muted}`} aria-live="polite">
                  <b className={strong}>{startItem}–{endItem}</b> / <b className={strong}>{filteredShops.length}</b> {t('shopsFound')}
                </p>
                <div className={`flex min-w-[160px] max-w-xs flex-1 items-center gap-2 rounded-xl border px-3 py-2 focus-within:border-emerald-500 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                  <FiSearch className={`h-4 w-4 flex-shrink-0 ${muted}`} />
                  <input type="search" value={searchTerm} maxLength={80} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('search')} aria-label="Search shops"
                    className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${darkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-500'}`} />
                  {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search" className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}><FiX className="h-3.5 w-3.5" /></button>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex gap-1.5">
                  {[['grid', FiGrid], ['list', FiList]].map(([mode, Icon]) => (
                    <Btn3D key={mode} tone={viewMode === mode ? 'em' : 'soft'} darkMode={darkMode} onClick={() => setViewMode(mode)} aria-label={`${mode} view`} aria-pressed={viewMode === mode} className="h-9 w-9">
                      <Icon className="h-4 w-4" />
                    </Btn3D>
                  ))}
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label={t('sortBy')} className={selectCls}>
                  {Object.entries(sortLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Items per page" className={`hidden sm:block ${selectCls}`}>
                  {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
                <Btn3D tone="soft" darkMode={darkMode} onClick={() => setIsSidebarOpen(true)} className="px-3 py-2 text-xs lg:hidden">
                  <FiSliders className="h-3.5 w-3.5 text-emerald-500" /> {t('filters')}
                  {activeFiltersCount > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">{activeFiltersCount}</span>}
                </Btn3D>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {roleFilter !== 'ALL' && chip(serviceLabel(roleFilter), () => setRoleFilter('ALL'))}
                {selectedShopTypes.map((ty) => chip(ty, () => toggleShopType(ty)))}
                {selectedCities.map((c) => chip(c, () => toggleCity(c)))}
                {minRating > 0 && chip(`${minRating}+ stars`, () => setMinRating(0))}
                {showVerifiedOnly && chip('Verified', () => setShowVerifiedOnly(false))}
                {searchTerm && chip(`“${searchTerm.slice(0, 20)}”`, () => setSearchTerm(''))}
                <button type="button" onClick={clearFilters} className="text-xs font-semibold text-emerald-500 hover:text-emerald-400">Clear all</button>
              </div>
            )}

            {isLoading ? (
              <div className={`grid gap-4 sm:gap-5 lg:gap-6 ${gridCols}`}>
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className={`h-[190px] animate-pulse rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />)}
              </div>
            ) : isError ? (
              <div className="py-20 text-center">
                <ShopScene compact className="mx-auto mb-4 h-24 w-32" />
                <p className={`mb-2 text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>We couldn’t load the shops</p>
                <p className={`mb-6 text-sm ${muted}`}>Check your connection and try again.</p>
                <Btn3D onClick={() => refetch()} className="px-6 py-3 text-sm"><FiRefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Try again</Btn3D>
              </div>
            ) : filteredShops.length === 0 ? (
              <div className="py-20 text-center sm:py-28">
                <ShopScene compact className="mx-auto mb-4 h-24 w-32" />
                <p className={`mb-2 text-xl font-bold sm:text-2xl ${darkMode ? 'text-white' : 'text-gray-800'}`}>{shops.length ? t('noMatch') : t('noShops')}</p>
                <p className={`mb-6 text-sm sm:text-base ${muted}`}>{shops.length ? 'Try removing a filter or searching a different word.' : 'New shops are joining soon. Check back later.'}</p>
                {shops.length > 0 && <Btn3D onClick={clearFilters} className="px-6 py-3 text-sm sm:text-base">{t('clearFilters')}</Btn3D>}
              </div>
            ) : (
              <div className={`grid gap-4 sm:gap-5 lg:gap-6 ${gridCols}`}>
                {paginated.map((s, i) => <ShopCard key={s.id} shop={s} darkMode={darkMode} index={i} layout={viewMode} onDetails={openDetails} />)}
              </div>
            )}

            {totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:mt-14">
                <PageBtn darkMode={darkMode} aria-label="Previous page" onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); scrollToGrid(); }} disabled={currentPage === 1}><FiChevronLeft className="h-4 w-4 rtl:rotate-180" /></PageBtn>
                {getPaginationRange(currentPage, totalPages).map((pg, i) =>
                  pg === '…'
                    ? <span key={`d${i}`} className={`w-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>…</span>
                    : <PageBtn key={pg} darkMode={darkMode} active={currentPage === pg} onClick={() => { setCurrentPage(pg); scrollToGrid(); }}>{pg}</PageBtn>
                )}
                <PageBtn darkMode={darkMode} aria-label="Next page" onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); scrollToGrid(); }} disabled={currentPage === totalPages}><FiChevronRight className="h-4 w-4 rtl:rotate-180" /></PageBtn>
              </nav>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showTop && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-5 end-5 z-40">
            <Btn3D onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" className="h-11 w-11"><FiArrowUp className="h-5 w-5" /></Btn3D>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t('filters')}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.2 }}
              className={`absolute bottom-0 start-0 top-0 w-80 max-w-[90vw] overflow-y-auto p-4 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
              <div className="mb-3 flex justify-end">
                <Btn3D tone="soft" darkMode={darkMode} onClick={() => setIsSidebarOpen(false)} aria-label="Close filters" className="h-9 w-9"><FiX className="h-5 w-5" /></Btn3D>
              </div>
              <FilterPanel {...filterPanelProps} />
              <Btn3D onClick={() => { setIsSidebarOpen(false); scrollToGrid(); }} className="mt-4 w-full py-3 text-sm">Show {filteredShops.length} shops</Btn3D>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailsShop && <ShopDetailsModal key={detailsShop.id} shop={detailsShop} darkMode={darkMode} onClose={closeDetails} />}
      </AnimatePresence>
    </div>
  );
});

export default function Shops(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ShopsContent {...props} />
    </QueryClientProvider>
  );
}