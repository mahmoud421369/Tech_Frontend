import React, {
  useState, useEffect, useCallback, useRef, useMemo, memo,
  Suspense, lazy, useDeferredValue,
} from 'react';
import {
  FiSearch, FiShoppingCart, FiChevronLeft, FiChevronRight, FiX, FiChevronDown,
  FiSliders, FiCheck, FiGrid, FiList, FiArrowRight, FiArrowUp, FiTruck, FiShield,
  FiRefreshCw, FiHeadphones, FiTag,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';

const Hero = lazy(() => import('../components/Hero'));
const loadSwal = () => import('sweetalert2').then((m) => m.default);
const queryClient = new QueryClient();

/* ───────────── helpers (safe storage, translations, URL safety) ───────────── */
const readStorage = (key) => {
  try { return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null; } catch { return null; }
};
const DEVICE_TRANSLATIONS = {
  en: enTranslations.devices,
  ar: arTranslations.devices || arTranslations.hero?.devices,
  fr: frTranslations.devices || frTranslations.hero?.devices,
};
const getDeviceTranslation = (key) =>
  DEVICE_TRANSLATIONS[readStorage('appLanguage') || 'en']?.[key] || DEVICE_TRANSLATIONS.en?.[key] || key;

// Only allow http(s), same-site paths and inline images – blocks javascript: and similar schemes.
const safeImageUrl = (url) => {
  if (typeof url !== 'string') return '';
  const u = url.trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u) || (u.startsWith('/') && !u.startsWith('//')) || /^data:image\/(png|jpe?g|webp|gif|svg\+xml);/i.test(u)) return u;
  return '';
};
const money = (n) => `EGP ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

const conditionConfig = {
  NEW: { badge: 'bg-emerald-500', label: 'New' },
  USED: { badge: 'bg-amber-500', label: 'Used' },
  REFURBISHED: { badge: 'bg-sky-500', label: 'Refurbished' },
};

const pageStyles = `
  @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .anim-float { animation: floatY 6s ease-in-out infinite; }
  .hide-scrollbar { scrollbar-width: none; }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  @media (prefers-reduced-motion: reduce) { .anim-float { animation: none !important; } }
`;

/* ───────────── 3D icon system: emerald glass, gradients defined once ───────────── */
const kindOf = (name = '') => {
  const k = name.toLowerCase();
  if (k.includes('laptop') || k.includes('notebook') || k.includes('computer')) return 'laptop';
  if (k.includes('phone') || k.includes('mobile')) return 'phone';
  if (k.includes('tablet') || k.includes('ipad')) return 'tablet';
  if (k.includes('audio') || k.includes('headphone') || k.includes('earbud')) return 'audio';
  if (k.includes('watch') || k.includes('wear')) return 'watch';
  if (k.includes('monitor') || k.includes('screen') || k.includes('tv') || k.includes('display')) return 'monitor';
  return 'box';
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
    case 'laptop':
      body = (<>
        <rect x="14" y="12" width="42" height="29" rx="4" fill={sd} />
        <rect x="11" y="9" width="42" height="29" rx="4" fill={fr} />
        <rect x="14" y="12" width="36" height="23" rx="2" fill={sc} />
        <path d="M14 28V14a2 2 0 012-2h20z" fill={W} opacity="0.3" />
        <rect x="18" y="17" width="16" height="3" rx="1.5" fill={W} opacity="0.9" />
        <rect x="18" y="23" width="10" height="2.5" rx="1.2" fill={W} opacity="0.55" />
        <rect x="4" y="45" width="56" height="8" rx="4" fill={sd} />
        <rect x="4" y="41" width="56" height="8" rx="4" fill={lt} />
        <rect x="26" y="41" width="12" height="2.5" rx="1.2" fill="#6EE7B7" />
      </>); break;
    case 'phone':
      body = (<>
        <rect x="22" y="6" width="26" height="56" rx="7" fill={sd} />
        <rect x="18" y="2" width="26" height="56" rx="7" fill={fr} />
        <rect x="21" y="5.5" width="20" height="49" rx="4.5" fill={sc} />
        <path d="M21 32V10a4.5 4.5 0 014.5-4.5H34z" fill={W} opacity="0.3" />
        <rect x="24" y="12" width="14" height="3.5" rx="1.7" fill={W} opacity="0.9" />
        <rect x="24" y="19" width="9" height="2.5" rx="1.2" fill={W} opacity="0.55" />
        <rect x="24" y="40" width="14" height="10" rx="3" fill={W} opacity="0.3" />
      </>); break;
    case 'tablet':
      body = (<>
        <rect x="12" y="9" width="48" height="52" rx="8" fill={sd} />
        <rect x="8" y="5" width="48" height="52" rx="8" fill={fr} />
        <rect x="12" y="9" width="40" height="44" rx="4.5" fill={sc} />
        <path d="M12 36V13.5A4.5 4.5 0 0116.5 9H32z" fill={W} opacity="0.3" />
        <rect x="17" y="16" width="20" height="4" rx="2" fill={W} opacity="0.9" />
        <rect x="17" y="38" width="30" height="10" rx="3" fill={W} opacity="0.3" />
      </>); break;
    case 'audio':
      body = (<>
        <path d="M15 36v-5a17 17 0 0134 0v5" fill="none" stroke={sd} strokeWidth="7" strokeLinecap="round" transform="translate(2 3)" />
        <path d="M15 36v-5a17 17 0 0134 0v5" fill="none" stroke={em} strokeWidth="7" strokeLinecap="round" />
        <rect x="9" y="38" width="14" height="22" rx="6" fill={sd} />
        <rect x="45" y="38" width="14" height="22" rx="6" fill={sd} />
        <rect x="7" y="34" width="14" height="22" rx="6" fill={fr} />
        <rect x="43" y="34" width="14" height="22" rx="6" fill={fr} />
        <rect x="10" y="38" width="8" height="13" rx="4" fill={sc} />
        <rect x="46" y="38" width="8" height="13" rx="4" fill={sc} />
      </>); break;
    case 'watch':
      body = (<>
        <rect x="22" y="2" width="20" height="16" rx="4" fill={em} />
        <rect x="22" y="46" width="20" height="16" rx="4" fill={em} />
        <rect x="16" y="17" width="38" height="36" rx="11" fill={sd} />
        <rect x="13" y="14" width="38" height="36" rx="11" fill={fr} />
        <rect x="17" y="18" width="30" height="28" rx="8" fill={sc} />
        <path d="M17 34V26a8 8 0 018-8h10z" fill={W} opacity="0.3" />
        <path d="M32 24v8l5 3" stroke={W} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      </>); break;
    case 'monitor':
      body = (<>
        <rect x="8" y="11" width="54" height="36" rx="5" fill={sd} />
        <rect x="5" y="8" width="54" height="36" rx="5" fill={fr} />
        <rect x="9" y="12" width="46" height="28" rx="2.5" fill={sc} />
        <path d="M9 32V14.5A2.5 2.5 0 0111.5 12H34z" fill={W} opacity="0.3" />
        <rect x="14" y="17" width="18" height="3.5" rx="1.7" fill={W} opacity="0.9" />
        <rect x="28" y="44" width="8" height="8" fill={em} />
        <rect x="17" y="52" width="30" height="6" rx="3" fill={lt} />
      </>); break;
    default:
      body = (<>
        <path d="M32 5l24 12-24 12L8 17z" fill={lt} />
        <path d="M8 17l24 12v29L8 46z" fill={em} />
        <path d="M56 17L32 29v29l24-12z" fill={fr} />
        <path d="M20 11l24 12" stroke="#6EE7B7" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      </>);
  }
  return (
    <svg viewBox="0 0 64 64" className={`drop-shadow-[0_6px_5px_rgba(2,44,34,0.35)] ${className}`} aria-hidden="true">
      {body}
    </svg>
  );
});

/* Emerald illustration shown when a product image is missing / failed / too slow */
const DeviceArt = memo(({ name, categoryName, darkMode }) => (
  <div
    className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden ${darkMode ? 'bg-gradient-to-br from-emerald-950 via-gray-900 to-emerald-950' : 'bg-gradient-to-br from-emerald-50 via-white to-emerald-100'}`}
    role="img" aria-label={`${name || 'Product'} – image unavailable`}
  >
    <div className={`absolute h-40 w-40 rounded-full blur-2xl ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-300/40'}`} />
    <div className={`absolute h-[78%] w-[78%] rounded-full border-2 border-dashed ${darkMode ? 'border-emerald-500/25' : 'border-emerald-300/70'}`} />
    <span className="anim-float absolute left-[16%] top-[20%] h-2 w-2 rotate-45 bg-emerald-400/80" />
    <span className="anim-float absolute bottom-[26%] right-[15%] h-1.5 w-1.5 rotate-45 bg-emerald-500/70" />
    <Glyph3D name={categoryName || name} className="anim-float relative h-1/2 w-1/2" />
    <div className="relative -mt-1 h-2 w-1/3 rounded-full bg-emerald-900/25 blur-[3px]" />
    <span className={`relative mt-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${darkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>Image unavailable</span>
  </div>
));

/* Modern emerald device scene used for section illustrations */
const DeviceScene = memo(({ className = 'w-40 h-32', compact = false }) => (
  <div className={`relative flex-shrink-0 ${className}`} aria-hidden="true">
    <div className="absolute inset-x-3 bottom-0 h-4 rounded-full bg-emerald-900/25 blur-md" />
    <Glyph3D name="laptop" className="absolute bottom-1 left-0 h-[78%] w-[62%]" />
    <Glyph3D name="phone" className="anim-float absolute right-[10%] top-0 h-[72%] w-[28%]" />
    {!compact && <Glyph3D name="watch" className="absolute bottom-0 right-0 h-[40%] w-[24%]" />}
    {!compact && <Glyph3D name="audio" className="anim-float absolute left-[34%] top-0 h-[34%] w-[24%]" />}
  </div>
));

/* 3D push button (button or link) */
const Btn3D = memo(({ as: Tag = 'button', tone = 'em', darkMode, className = '', children, ...rest }) => {
  const tones = {
    em: 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white ring-1 ring-inset ring-white/30 shadow-[0_4px_0_0_#047857,0_10px_16px_-8px_rgba(5,150,105,0.6)] hover:from-emerald-300 hover:to-emerald-500 active:shadow-[0_1px_0_0_#047857]',
    rose: 'bg-rose-500 text-white shadow-[0_4px_0_0_#9f1239] hover:bg-rose-400 active:shadow-[0_1px_0_0_#9f1239]',
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

const Chip3D = ({ tone = 'em', children, className = '' }) => {
  const bg = { em: 'from-emerald-300 to-emerald-600 shadow-[0_3px_0_0_#047857]', sky: 'from-sky-300 to-sky-600 shadow-[0_3px_0_0_#075985]', am: 'from-amber-300 to-amber-600 shadow-[0_3px_0_0_#92400e]', vi: 'from-violet-300 to-violet-600 shadow-[0_3px_0_0_#5b21b6]' }[tone];
  return <span className={`flex items-center justify-center rounded-xl bg-gradient-to-br text-white ${bg} ${className}`}><span className="drop-shadow-[0_2px_1px_rgba(0,0,0,0.35)]">{children}</span></span>;
};

/* ───────────── Product card ───────────── */
const ProductCard = memo(({ product, darkMode, onAddToCart, index = 0, layout = 'grid' }) => {
  const src = safeImageUrl(product.imageUrl);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(!src);
  const [cartAdded, setCartAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  // Reset when the image changes; treat a very slow image as "not loaded".
  useEffect(() => {
    setImgLoaded(false);
    setImgError(!src);
    if (!src) return undefined;
    const t = setTimeout(() => setImgLoaded((ok) => { if (!ok) setImgError(true); return ok; }), 8000);
    return () => clearTimeout(t);
  }, [src]);

  const cond = conditionConfig[product.condition] || { badge: 'bg-gray-500', label: product.condition || 'Unknown' };
  const outOfStock = product.stock === 0;
  const isList = layout === 'list';
  const hasDiscount = product.discount > 0;

  const handleCart = useCallback(async (e) => {
    e.stopPropagation();
    if (outOfStock || adding) return;
    setAdding(true);
    const ok = await onAddToCart(product);
    if (!mounted.current) return;
    setAdding(false);
    if (ok) { setCartAdded(true); setTimeout(() => mounted.current && setCartAdded(false), 1400); }
  }, [onAddToCart, product, outOfStock, adding]);

  const go = useCallback(() => window.location.assign(`/device/${encodeURIComponent(product.id)}`), [product.id]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.025 }}
      onClick={go}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) go(); }}
      tabIndex={0}
      aria-label={product.name}
      className={`group relative flex h-full cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${isList ? 'flex-row' : 'flex-col'} ${
        darkMode ? 'border-gray-700 bg-gray-800 hover:shadow-lg hover:shadow-black/30' : 'border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-200/70'
      }`}
    >
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        <span className={`rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-[0_2px_0_0_rgba(0,0,0,0.25)] ${cond.badge}`}>{cond.label}</span>
        {hasDiscount && <span className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-extrabold text-white shadow-[0_2px_0_0_#9f1239]">-{product.discount}%</span>}
      </div>

      <div className={`relative aspect-square overflow-hidden ${isList ? 'w-40 flex-shrink-0 sm:w-52' : 'w-full'} ${darkMode ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
        {imgError ? (
          <DeviceArt name={product.name} categoryName={product.categoryName} darkMode={darkMode} />
        ) : (
          <>
            {!imgLoaded && <div className={`absolute inset-0 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />}
            <img
              src={src}
              alt={product.name}
              width={400}
              height={400}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`h-full w-full object-contain p-4 transition-opacity duration-200 sm:p-5 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        <span className={`text-[11px] font-bold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{product.categoryName || 'Uncategorized'}</span>
        <h3 className={`line-clamp-2 text-sm font-semibold leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
        <p className={`line-clamp-2 text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.description || 'No description available.'}</p>

        <div className={`mt-auto flex items-center justify-between gap-2 border-t pt-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex min-w-0 flex-col">
            <span className={`truncate text-lg font-extrabold tabular-nums tracking-tight ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{money(product.finalPrice)}</span>
            {hasDiscount && <span className={`text-xs tabular-nums line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{money(product.price)}</span>}
          </div>
          <Btn3D
            tone={cartAdded ? 'em' : 'soft'}
            darkMode={darkMode}
            onClick={handleCart}
            disabled={outOfStock || adding}
            aria-label={getDeviceTranslation('addToCart')}
            className="h-10 w-10 flex-shrink-0"
          >
            {adding ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              : cartAdded ? <FiCheck className="h-4 w-4 drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]" />
              : <FiShoppingCart className={`h-4 w-4 drop-shadow-[0_2px_0_rgba(0,0,0,0.2)] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />}
          </Btn3D>
        </div>
        {outOfStock && <p className="text-[11px] font-semibold text-rose-500">Out of stock</p>}
      </div>
    </motion.article>
  );
});

/* ───────────── Categories ───────────── */
const CategoryGrid = memo(({ categories, productsByCategory, selectedCategoryId, onSelect, darkMode }) => {
  const top = useMemo(
    () => [...categories].sort((a, b) => (productsByCategory[b.id]?.length || 0) - (productsByCategory[a.id]?.length || 0)).slice(0, 6),
    [categories, productsByCategory]
  );
  if (!top.length) return null;

  return (
    <section className={`relative overflow-hidden py-12 sm:py-16 ${darkMode ? 'bg-[#04120b]' : 'bg-emerald-50/70'}`}>
      <div className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl ${darkMode ? 'bg-emerald-500/10' : 'bg-emerald-300/30'}`} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6 sm:mb-10">
          <div className="flex items-center gap-6">
            <div>
              <h2 className={`text-2xl font-bold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-emerald-950'}`}>Browse categories</h2>
              <p className={`mt-1.5 text-sm sm:text-base ${darkMode ? 'text-emerald-200/60' : 'text-emerald-800/70'}`}>Pick a device type to filter the list below.</p>
            </div>
            <DeviceScene className="hidden h-28 w-40 lg:block" />
          </div>
          <Btn3D tone="em" onClick={() => onSelect('all')} className="px-4 py-2 text-sm">
            All categories <FiArrowRight className="h-4 w-4" />
          </Btn3D>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {top.map((cat) => {
            const active = selectedCategoryId === cat.id;
            const count = productsByCategory[cat.id]?.length || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelect(cat.id)}
                aria-pressed={active}
                className={`group relative flex flex-col items-center gap-2.5 overflow-hidden rounded-3xl border p-4 text-center transition-all duration-150 hover:-translate-y-1 active:translate-y-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 sm:p-5 ${
                  active
                    ? 'border-emerald-400 bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-[0_6px_0_0_#047857,0_16px_24px_-10px_rgba(5,150,105,0.6)]'
                    : darkMode
                    ? 'border-emerald-900/70 bg-gradient-to-b from-emerald-900/50 to-emerald-950 shadow-[0_6px_0_0_#022c22] hover:border-emerald-600'
                    : 'border-emerald-200 bg-gradient-to-b from-white to-emerald-100 shadow-[0_6px_0_0_#a7f3d0] hover:border-emerald-400'
                }`}
              >
                <span className={`flex h-20 w-20 items-center justify-center rounded-2xl ring-1 transition-transform duration-200 group-hover:scale-105 ${
                  active ? 'bg-white/20 ring-white/40' : darkMode ? 'bg-emerald-400/10 ring-emerald-400/20' : 'bg-white/80 ring-emerald-200'
                }`}>
                  <Glyph3D name={cat.name} className="h-14 w-14 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-110" />
                </span>
                <span className={`line-clamp-1 text-sm font-bold ${active ? 'text-white' : darkMode ? 'text-white' : 'text-emerald-950'}`}>{cat.name}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  active ? 'bg-white/25 text-white' : darkMode ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-600/10 text-emerald-700'
                }`}>{count} items</span>
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
    { icon: FiTruck, tone: 'em', title: 'Fast delivery', text: 'Across Egypt' },
    { icon: FiShield, tone: 'em', title: 'Warranty included', text: 'On every device' },
    { icon: FiRefreshCw, tone: 'em', title: 'Easy returns', text: '14-day window' },
    { icon: FiHeadphones, tone: 'em', title: 'Real support', text: 'Talk to a person' },
  ];
  return (
    <div className={`border-y ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 sm:px-6 md:grid-cols-4 lg:px-8">
        {items.map(({ icon: Icon, tone, title, text }) => (
          <div key={title} className="flex items-center gap-3">
            <Chip3D tone={tone} className="h-10 w-10 flex-shrink-0"><Icon className="h-5 w-5" /></Chip3D>
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

const OptionRow = memo(({ type, label, count, selected, onClick, darkMode }) => (
  <button type="button" role={type === 'radio' ? 'radio' : 'checkbox'} aria-checked={selected} onClick={onClick}
    className="group flex w-full items-center gap-3 rounded-md py-1.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400">
    <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center border-2 transition-colors ${type === 'radio' ? 'rounded-full' : 'rounded'} ${
      selected ? `border-emerald-500 ${type === 'check' ? 'bg-emerald-500' : ''}` : darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
      {selected && (type === 'radio' ? <span className="h-2 w-2 rounded-full bg-emerald-500" /> : <FiCheck className="h-3 w-3 text-white" />)}
    </span>
    <span className={`flex-1 truncate text-sm ${selected ? 'font-semibold text-emerald-500' : darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>{label}</span>
    {count !== undefined && <span className={`text-xs tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{count}</span>}
  </button>
));

const NumField = memo(({ value, onCommit, label, darkMode }) => {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => { const n = Number(draft); if (Number.isFinite(n)) onCommit(n); else setDraft(String(value)); };
  return (
    <label className="min-w-0 flex-1">
      <span className={`mb-1 block text-[11px] font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
      <div className={`flex items-center rounded-lg border px-2 py-1.5 text-xs font-bold focus-within:border-emerald-500 ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-800'}`}>
        <span className={`mr-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>EGP</span>
        <input type="number" inputMode="numeric" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()} className="w-full min-w-0 bg-transparent tabular-nums outline-none" />
      </div>
    </label>
  );
});

const PriceRangeFilter = memo(({ bounds, value, onChange, histogram, darkMode }) => {
  const { max, step } = bounds;
  const [lo, hi] = value;
  const leftPct = (lo / max) * 100;
  const rightPct = (hi / max) * 100;
  const peak = Math.max(1, ...histogram);
  const thumb =
    'absolute inset-0 h-1.5 w-full appearance-none bg-transparent pointer-events-none ' +
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full ' +
    '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_3px_0_0_#047857] ' +
    '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full ' +
    '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-500 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_3px_0_0_#047857]';
  const presets = [
    { label: 'Under 5K', r: [0, Math.min(5000, max)] },
    { label: '5K – 20K', r: [Math.min(5000, max), Math.min(20000, max)] },
    { label: '20K+', r: [Math.min(20000, max), max] },
  ].filter((p) => p.r[0] < p.r[1]);

  return (
    <div className="space-y-4">
      <div className="flex h-12 items-end gap-[3px]" aria-hidden="true">
        {histogram.map((c, i) => {
          const binStart = (i / histogram.length) * max;
          const binEnd = ((i + 1) / histogram.length) * max;
          const inRange = binEnd > lo && binStart < hi;
          return <div key={i} className={`flex-1 rounded-t ${inRange ? 'bg-emerald-500' : darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ height: `${Math.max(c ? 12 : 4, (c / peak) * 100)}%`, opacity: c ? 1 : 0.5 }} />;
        })}
      </div>
      <div className="relative flex h-5 items-center">
        <div className={`absolute inset-x-0 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className="absolute h-1.5 rounded-full bg-emerald-500" style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />
        <input type="range" aria-label="Minimum price" min={0} max={max} step={step} value={lo}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - step), hi])} className={thumb} style={{ zIndex: lo > max - step * 3 ? 5 : 3 }} />
        <input type="range" aria-label="Maximum price" min={0} max={max} step={step} value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])} className={thumb} style={{ zIndex: 4 }} />
      </div>
      <div className="flex gap-2">
        <NumField label="Min" value={lo} darkMode={darkMode} onCommit={(n) => onChange([clamp(n, 0, hi - step), hi])} />
        <NumField label="Max" value={hi} darkMode={darkMode} onCommit={(n) => onChange([lo, clamp(n, lo + step, max)])} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const on = lo === p.r[0] && hi === p.r[1];
          return (
            <button key={p.label} type="button" onClick={() => onChange(p.r)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${on ? 'border-emerald-500 bg-emerald-500 text-white' : darkMode ? 'border-gray-700 text-gray-300 hover:border-emerald-500' : 'border-gray-200 text-gray-600 hover:border-emerald-500'}`}>
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});

const TradeInCard = memo(({ darkMode }) => (
  <div className={`relative mt-5 overflow-hidden rounded-2xl p-5 ${darkMode ? 'bg-gradient-to-br from-emerald-900 to-gray-900 ring-1 ring-emerald-500/30' : 'bg-gradient-to-br from-emerald-500 to-emerald-700'}`}>
    <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
    <DeviceScene compact className="absolute -bottom-2 -right-2 h-24 w-28 opacity-95" />
    <div className="relative max-w-[62%]">
      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white"><FiTag className="h-3 w-3" /> Trade-in</span>
      <p className="mt-2 text-base font-extrabold leading-tight text-white">Get up to EGP 5,000 for your old device</p>
      <p className="mt-1 text-xs text-emerald-50/80">Credit applied to your next purchase.</p>
      <Btn3D as="a" href="/trade-in" tone="soft" darkMode={false} className="mt-3 px-3.5 py-2 text-xs !text-emerald-700">Get an estimate</Btn3D>
    </div>
  </div>
));

const FilterPanel = memo((p) => {
  const { darkMode, categories, productsByCategory, selectedCategoryId, setSelectedCategoryId, selectedConditions, toggleCondition, conditionCounts,
    priceBounds, priceValue, setPriceRange, histogram, inStockOnly, setInStockOnly, open, setOpen, clearFilters, activeFiltersCount, totalCount } = p;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <div className={`rounded-2xl border p-5 ${darkMode ? 'border-emerald-900/60 bg-gray-900' : 'border-emerald-100 bg-white'}`}>
      <div className={`relative mb-4 overflow-hidden rounded-xl p-4 ${darkMode ? 'bg-gradient-to-br from-emerald-900 to-emerald-950 ring-1 ring-emerald-500/20' : 'bg-gradient-to-br from-emerald-100 to-emerald-50 ring-1 ring-emerald-200'}`}>
        <div className="relative max-w-[58%]">
          <p className={`text-sm font-extrabold ${darkMode ? 'text-emerald-200' : 'text-emerald-900'}`}>Find your device</p>
          <p className={`mt-0.5 text-xs leading-snug ${darkMode ? 'text-emerald-200/60' : 'text-emerald-800/70'}`}>Narrow by price, condition and category.</p>
        </div>
        <DeviceScene compact className="absolute -bottom-1 -right-1 h-20 w-24" />
      </div>
      <div className="mb-1 flex items-center justify-between">
        <h3 className={`flex items-center gap-2 text-sm font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <Chip3D className="h-7 w-7"><FiSliders className="h-3.5 w-3.5" /></Chip3D> Filters
        </h3>
        {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className="text-xs font-semibold text-emerald-500 hover:text-emerald-400">Reset all</button>}
      </div>

      <FilterSection title={getDeviceTranslation('priceRange')} isOpen={open.price} onToggle={() => toggle('price')} darkMode={darkMode}>
        <PriceRangeFilter bounds={priceBounds} value={priceValue} onChange={setPriceRange} histogram={histogram} darkMode={darkMode} />
      </FilterSection>

      <FilterSection title={getDeviceTranslation('condition')} isOpen={open.cond} onToggle={() => toggle('cond')} darkMode={darkMode}>
        {Object.entries(conditionConfig).map(([value, cfg]) => (
          <OptionRow key={value} type="check" label={cfg.label} count={conditionCounts[value] || 0} selected={selectedConditions.includes(value)} onClick={() => toggleCondition(value)} darkMode={darkMode} />
        ))}
        <OptionRow type="check" label="In stock only" selected={inStockOnly} onClick={() => setInStockOnly((v) => !v)} darkMode={darkMode} />
      </FilterSection>

      <FilterSection title={getDeviceTranslation('category')} isOpen={open.cat} onToggle={() => toggle('cat')} darkMode={darkMode}>
        <div className="max-h-52 overflow-y-auto pr-1" role="radiogroup" aria-label="Category">
          <OptionRow type="radio" label="All" count={totalCount} selected={selectedCategoryId === 'all'} onClick={() => setSelectedCategoryId('all')} darkMode={darkMode} />
          {categories.map((c) => (
            <OptionRow key={c.id} type="radio" label={c.name} count={productsByCategory[c.id]?.length || 0} selected={selectedCategoryId === c.id} onClick={() => setSelectedCategoryId(c.id)} darkMode={darkMode} />
          ))}
        </div>
      </FilterSection>

      <TradeInCard darkMode={darkMode} />
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
        : darkMode ? 'bg-gray-800 text-gray-300 shadow-[0_3px_0_0_#030712] hover:text-emerald-400' : 'bg-white text-gray-600 shadow-[0_3px_0_0_#d1d5db] border border-gray-200 hover:text-emerald-700'}`}>
    {children}
  </button>
));

/* ───────────── Page ───────────── */
const PRICE_STEP = (max) => (max >= 20000 ? 500 : max >= 2000 ? 100 : 10);

const ProductsContent = memo(({ darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [priceRange, setPriceRangeState] = useState(null); // null = no price filter
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [viewMode, setViewMode] = useState('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [open, setOpen] = useState({ price: true, cond: true, cat: true });
  const [showTop, setShowTop] = useState(false);
  const [token] = useState(() => readStorage('authToken'));
  const sliderRef = useRef(null);
  const gridRef = useRef(null);

  useEffect(() => { document.title = 'Our Products | Tech-Restore'; }, []);

  const authConfig = useMemo(() => (token ? { headers: { Authorization: `Bearer ${token}` } } : undefined), [token]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/api/categories', authConfig);
      const cats = res.data?.content || res.data || [];
      return Array.isArray(cats) ? cats.map((c) => ({ id: c.id, name: String(c.name || c.id) })) : [];
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Always load the full list; category filtering happens client-side so counts stay correct.
  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/api/products');
      const list = res.data?.content || res.data || [];
      if (!Array.isArray(list)) return [];
      return list.filter((p) => p && !p.deleted).map((p) => {
        const price = Number(p.price) || 0;
        const discount = clamp(Number(p.discount) || 0, 0, 100);
        return { ...p, price, discount, finalPrice: discount ? Math.round(price * (1 - discount / 100) * 100) / 100 : price };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  /* price bounds follow real data, so expensive products are never hidden by a hard-coded cap */
  const priceBounds = useMemo(() => {
    const top = products.reduce((m, p) => Math.max(m, p.finalPrice, p.price), 0);
    const step = PRICE_STEP(top);
    return { max: Math.max(step * 10, Math.ceil(top / step) * step), step };
  }, [products]);
  const priceValue = useMemo(
    () => (priceRange ? [clamp(priceRange[0], 0, priceBounds.max), clamp(priceRange[1], 0, priceBounds.max)] : [0, priceBounds.max]),
    [priceRange, priceBounds.max]
  );
  const setPriceRange = useCallback((r) => {
    setPriceRangeState(r[0] <= 0 && r[1] >= priceBounds.max ? null : r);
  }, [priceBounds.max]);

  const productsByCategory = useMemo(() => {
    const map = {};
    products.forEach((p) => { if (p.categoryId != null) (map[p.categoryId] ||= []).push(p); });
    return map;
  }, [products]);

  const latestProducts = useMemo(
    () => [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
    [products]
  );

  /* everything except price – used for the histogram and condition counts */
  const baseFiltered = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) return false;
      if (term && !`${p.name || ''} ${p.categoryName || ''}`.toLowerCase().includes(term)) return false;
      if (inStockOnly && p.stock === 0) return false;
      return true;
    });
  }, [products, deferredSearch, selectedCategoryId, inStockOnly]);

  const conditionCounts = useMemo(() => {
    const c = {};
    baseFiltered.forEach((p) => { c[p.condition] = (c[p.condition] || 0) + 1; });
    return c;
  }, [baseFiltered]);

  const histogram = useMemo(() => {
    const bins = Array(16).fill(0);
    baseFiltered.forEach((p) => {
      if (selectedConditions.length && !selectedConditions.includes(p.condition)) return;
      bins[Math.min(15, Math.floor((p.finalPrice / priceBounds.max) * 16))]++;
    });
    return bins;
  }, [baseFiltered, selectedConditions, priceBounds.max]);

  const filteredProducts = useMemo(() => {
    const [lo, hi] = priceValue;
    const list = baseFiltered.filter(
      (p) => p.finalPrice >= lo && p.finalPrice <= hi && (!selectedConditions.length || selectedConditions.includes(p.condition))
    );
    if (sortBy === 'priceLowToHigh') list.sort((a, b) => a.finalPrice - b.finalPrice);
    else if (sortBy === 'priceHighToLow') list.sort((a, b) => b.finalPrice - a.finalPrice);
    else if (sortBy === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [baseFiltered, priceValue, selectedConditions, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  useEffect(() => { setCurrentPage(1); }, [selectedCategoryId, pageSize, deferredSearch, priceRange, selectedConditions, inStockOnly, sortBy]);
  useEffect(() => { setCurrentPage((pg) => Math.min(pg, totalPages)); }, [totalPages]);

  const paginatedProducts = useMemo(() => filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredProducts, currentPage, pageSize]);
  const startItem = filteredProducts.length ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, filteredProducts.length);

  const sortLabels = { relevance: 'Relevance', priceLowToHigh: 'Price: low to high', priceHighToLow: 'Price: high to low', newest: 'Newest arrivals' };

  const handleAddToCart = useCallback(async (product) => {
    if (!token) {
      const Swal = await loadSwal();
      const r = await Swal.fire({ title: 'Please log in', text: 'You need to log in before adding items to your cart.', icon: 'info', showCancelButton: true, confirmButtonText: 'Go to login' });
      if (r.isConfirmed) window.location.assign('/login');
      return false;
    }
    try {
      // The server must re-validate price/name; the client sends only the product id and quantity.
      const res = await api.post('/api/cart/items', { productId: product.id, quantity: 1 }, authConfig);
      if (res.status < 200 || res.status >= 300) throw new Error('Unexpected response');
      window.dispatchEvent(new Event('cart:updated'));
      const Swal = await loadSwal();
      Swal.fire({ title: 'Added!', text: `${product.name} added to cart`, icon: 'success', toast: true, position: 'top-end', timer: 1500, timerProgressBar: true, showConfirmButton: false });
      return true;
    } catch {
      const Swal = await loadSwal();
      Swal.fire({ title: 'Error', text: 'Failed to add to cart', icon: 'error', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
      return false;
    }
  }, [token, authConfig]);

  const scrollToGrid = useCallback(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), []);
  const selectCategory = useCallback((id) => { setSelectedCategoryId(id); scrollToGrid(); }, [scrollToGrid]);

  const scrollSlider = useCallback((dir) => sliderRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' }), []);
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return undefined;
    let raf;
    const check = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setCanScrollLeft(slider.scrollLeft > 2);
        setCanScrollRight(slider.scrollLeft + slider.clientWidth < slider.scrollWidth - 5);
      });
    };
    check();
    slider.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { slider.removeEventListener('scroll', check); window.removeEventListener('resize', check); cancelAnimationFrame(raf); };
  }, [latestProducts]);

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

  const clearFilters = useCallback(() => {
    setSearchTerm(''); setPriceRangeState(null); setSelectedCategoryId('all'); setSelectedConditions([]); setInStockOnly(false); setSortBy('relevance'); setCurrentPage(1);
  }, []);
  const toggleCondition = useCallback((c) => setSelectedConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])), []);

  const activeFiltersCount = (searchTerm ? 1 : 0) + (selectedCategoryId !== 'all' ? 1 : 0) + selectedConditions.length + (priceRange ? 1 : 0) + (inStockOnly ? 1 : 0);
  const showSliderArrows = latestProducts.length > 3 && (canScrollLeft || canScrollRight);
  const selectedCategoryName = categories.find((c) => c.id === selectedCategoryId)?.name;

  const filterPanelProps = {
    darkMode, categories, productsByCategory, selectedCategoryId, setSelectedCategoryId, selectedConditions, toggleCondition, conditionCounts,
    priceBounds, priceValue, setPriceRange, histogram, inStockOnly, setInStockOnly, open, setOpen, clearFilters, activeFiltersCount, totalCount: products.length,
  };

  const gridCols = viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1';
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

  return (
    <div className={`min-h-screen ${readStorage('appLanguage') === 'ar' ? 'font-cairo' : 'font-poppins'} ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <style>{pageStyles}</style>
      <Defs3D />

      <Suspense fallback={<div className={`h-[420px] w-full animate-pulse sm:h-[480px] ${darkMode ? 'bg-gray-900' : 'bg-emerald-50'}`} />}>
        <Hero variant="devices" darkMode={darkMode} buttons={undefined} />
      </Suspense>

      <TrustStrip darkMode={darkMode} />
      <CategoryGrid categories={categories} productsByCategory={productsByCategory} selectedCategoryId={selectedCategoryId} onSelect={selectCategory} darkMode={darkMode} />

      {!isLoading && latestProducts.length > 0 && (
        <section className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={`relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-8 ${darkMode ? 'bg-gradient-to-br from-emerald-900 via-emerald-950 to-gray-950 ring-1 ring-emerald-500/20' : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800'}`}>
              <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-emerald-300/10 blur-2xl" />
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div className="max-w-md">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white"><FiTag className="h-3 w-3" /> Just in</span>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Latest arrivals</h2>
                  <p className="mt-1 text-sm text-emerald-50/80">Freshly listed and ready to ship.</p>
                  {showSliderArrows && <div className="mt-4 flex gap-2">{arrowBtn('left', !canScrollLeft)}{arrowBtn('right', !canScrollRight)}</div>}
                </div>
                <DeviceScene className="hidden h-32 w-48 sm:block lg:h-36 lg:w-56" />
              </div>
            </div>
            <div ref={sliderRef} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 sm:gap-5">
              {latestProducts.map((p, i) => (
                <div key={p.id} className="w-[200px] flex-shrink-0 snap-start sm:w-[250px] md:w-[270px]">
                  <ProductCard product={p} darkMode={darkMode} onAddToCart={handleAddToCart} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div id="products-grid" ref={gridRef} className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex items-start gap-6 lg:gap-8">
          <aside className="sticky top-20 hidden max-h-[calc(100vh-5rem)] w-64 flex-shrink-0 self-start overflow-y-auto xl:w-72 lg:block">
            <FilterPanel {...filterPanelProps} />
          </aside>

          <div className="w-full min-w-0 flex-1">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <p className={`whitespace-nowrap text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} aria-live="polite">
                  Showing <b className={darkMode ? 'text-white' : 'text-gray-900'}>{startItem}–{endItem}</b> of <b className={darkMode ? 'text-white' : 'text-gray-900'}>{filteredProducts.length}</b> items
                </p>
                <div className={`flex min-w-[160px] max-w-xs flex-1 items-center gap-2 rounded-xl border px-3 py-2 focus-within:border-emerald-500 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                  <FiSearch className={`h-4 w-4 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input type="search" value={searchTerm} maxLength={80} onChange={(e) => setSearchTerm(e.target.value)} placeholder={getDeviceTranslation('search')} aria-label="Search products"
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
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort products"
                  className={`rounded-xl border px-3 py-2 text-sm font-medium outline-none focus:border-emerald-500 ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-200 bg-white text-gray-700'}`}>
                  {Object.entries(sortLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Items per page"
                  className={`hidden rounded-xl border px-3 py-2 text-sm font-medium outline-none focus:border-emerald-500 sm:block ${darkMode ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-200 bg-white text-gray-700'}`}>
                  {[12, 24, 48].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
                <Btn3D tone="soft" darkMode={darkMode} onClick={() => setIsSidebarOpen(true)} className="px-3 py-2 text-xs lg:hidden">
                  <FiSliders className="h-3.5 w-3.5 text-emerald-500" /> Filters
                  {activeFiltersCount > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">{activeFiltersCount}</span>}
                </Btn3D>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {selectedCategoryId !== 'all' && chip(selectedCategoryName || 'Category', () => setSelectedCategoryId('all'))}
                {selectedConditions.map((c) => chip(conditionConfig[c]?.label || c, () => toggleCondition(c)))}
                {priceRange && chip(`${money(priceValue[0])} – ${money(priceValue[1])}`, () => setPriceRangeState(null))}
                {inStockOnly && chip('In stock', () => setInStockOnly(false))}
                {searchTerm && chip(`“${searchTerm.slice(0, 20)}”`, () => setSearchTerm(''))}
                <button type="button" onClick={clearFilters} className="text-xs font-semibold text-emerald-500 hover:text-emerald-400">Clear all</button>
              </div>
            )}

            {isLoading ? (
              <div className={`grid gap-4 sm:gap-5 lg:gap-6 ${gridCols}`}>
                {Array.from({ length: 9 }).map((_, i) => <div key={i} className={`h-[300px] animate-pulse rounded-2xl sm:h-[360px] ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />)}
              </div>
            ) : isError ? (
              <div className="py-20 text-center">
                <DeviceScene compact className="mx-auto mb-4 h-24 w-32" />
                <p className={`mb-2 text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>We couldn’t load the products</p>
                <p className={`mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Check your connection and try again.</p>
                <Btn3D onClick={() => refetch()} className="px-6 py-3 text-sm">Try again</Btn3D>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center sm:py-28">
                <DeviceScene compact className="mx-auto mb-4 h-24 w-32" />
                <p className={`mb-2 text-xl font-bold sm:text-2xl ${darkMode ? 'text-white' : 'text-gray-800'}`}>{getDeviceTranslation('noProducts')}</p>
                <p className={`mb-6 text-sm sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getDeviceTranslation('adjustFilters')}</p>
                <Btn3D onClick={clearFilters} className="px-6 py-3 text-sm sm:text-base">{getDeviceTranslation('clearFilters')}</Btn3D>
              </div>
            ) : (
              <div className={`grid gap-4 sm:gap-5 lg:gap-6 ${gridCols}`}>
                {paginatedProducts.map((p, i) => <ProductCard key={p.id} product={p} darkMode={darkMode} onAddToCart={handleAddToCart} index={i} layout={viewMode} />)}
              </div>
            )}

            {totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:mt-14">
                <PageBtn darkMode={darkMode} aria-label="Previous page" onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); scrollToGrid(); }} disabled={currentPage === 1}><FiChevronLeft className="h-4 w-4" /></PageBtn>
                {getPaginationRange(currentPage, totalPages).map((pg, i) =>
                  pg === '…'
                    ? <span key={`d${i}`} className={`w-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>…</span>
                    : <PageBtn key={pg} darkMode={darkMode} active={currentPage === pg} onClick={() => { setCurrentPage(pg); scrollToGrid(); }}>{pg}</PageBtn>
                )}
                <PageBtn darkMode={darkMode} aria-label="Next page" onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); scrollToGrid(); }} disabled={currentPage === totalPages}><FiChevronRight className="h-4 w-4" /></PageBtn>
              </nav>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showTop && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-5 right-5 z-40">
            <Btn3D onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" className="h-11 w-11"><FiArrowUp className="h-5 w-5" /></Btn3D>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.2 }}
              className={`absolute bottom-0 left-0 top-0 w-80 max-w-[90vw] overflow-y-auto p-4 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
              <div className="mb-3 flex justify-end">
                <Btn3D tone="soft" darkMode={darkMode} onClick={() => setIsSidebarOpen(false)} aria-label="Close filters" className="h-9 w-9"><FiX className="h-5 w-5" /></Btn3D>
              </div>
              <FilterPanel {...filterPanelProps} />
              <Btn3D onClick={() => { setIsSidebarOpen(false); scrollToGrid(); }} className="mt-4 w-full py-3 text-sm">Show {filteredProducts.length} items</Btn3D>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

const Products = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <ProductsContent {...props} />
  </QueryClientProvider>
));

export default Products;