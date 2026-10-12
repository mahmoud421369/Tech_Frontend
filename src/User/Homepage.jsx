import React, {
  useState, useRef, useEffect, useCallback, memo, useMemo, useDeferredValue, Suspense, lazy,
} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiSearch, FiX, FiArrowRight, FiChevronLeft, FiChevronRight, FiMapPin, FiPhone, FiTag,
  FiMonitor, FiShield, FiCheckCircle, FiDollarSign, FiTool,
} from 'react-icons/fi';
import {
  RiBattery2ChargeLine, RiDeviceLine, RiSettings3Line, RiVerifiedBadgeLine, RiWaterFlashLine,
  RiStarFill, RiStoreLine, RiCameraLine, RiPlugLine, RiHardDrive2Line, RiVolumeUpLine,
} from 'react-icons/ri';
import { jwtDecode } from 'jwt-decode';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../styles/style.css';
import api from '../api';
import { Hero } from '../components';
import {
  Defs3D, Device3DStyles, DeviceScene, Btn3D, Chip3D, TrustStrip, ProductCard,
  readStorage, safeImageUrl, money,
} from '../components/Device3D';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';

const Service = lazy(() => import('./Service'));
const OffersSlider = lazy(() => import('../components').then((m) => ({ default: m.OffersSlider })));
const loadSwal = () => import('sweetalert2').then((m) => m.default);

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } } });

/* ───────────── helpers ───────────── */
const CDN_BASE = 'https://cdn.tech-restore.com';
const HOMEPAGE_TRANSLATIONS = {
  en: enTranslations.homepage,
  ar: arTranslations.homepage || arTranslations.hero?.homepage,
  fr: frTranslations.homepage || frTranslations.hero?.homepage,
};
const tr = (language, key) => HOMEPAGE_TRANSLATIONS[language]?.[key] || HOMEPAGE_TRANSLATIONS.en?.[key] || key;

// CDN-prefix relative paths, then run through the same URL allow-list used on Products.
const resolveAsset = (path) => {
  if (!path || typeof path !== 'string') return '';
  const p = path.trim();
  if (/^(https?:|data:)/i.test(p)) return safeImageUrl(p);
  return safeImageUrl(`${CDN_BASE}${p.startsWith('/') ? p : `/${p}`}`);
};

const getValidToken = () => {
  const t = readStorage('authToken');
  if (!t || !t.trim()) return null;
  try {
    const d = jwtDecode(t);
    return d?.exp && d.exp > Date.now() / 1000 ? t : null;
  } catch { return null; }
};

const normalizeProduct = (p) => {
  const price = Number(p.price) || 0;
  const discount = Math.min(Math.max(Number(p.discount) || 0, 0), 100);
  return {
    ...p,
    price,
    discount,
    imageUrl: resolveAsset(p.imageUrl),
    finalPrice: discount ? Math.round(price * (1 - discount / 100) * 100) / 100 : price,
  };
};

// Placeholder promos (also used by the search dropdown) – swap for real data when available.
const OFFERS = [
  { id: 'o1', title: '20% off iPhone screen repair', Icon: FiMonitor },
  { id: 'o2', title: 'Laptop battery replacement – EGP 499', Icon: FiShield },
  { id: 'o3', title: 'Free diagnostics on any device', Icon: FiCheckCircle },
  { id: 'o4', title: 'Buy 2 accessories, get 10% off', Icon: FiDollarSign },
];

const REPAIR_FEATURES = [
  { icon: RiDeviceLine, key: 'screenReplacement' },
  { icon: RiBattery2ChargeLine, key: 'batteryReplacement' },
  { icon: RiWaterFlashLine, key: 'waterDamage' },
  { icon: RiSettings3Line, key: 'softwareIssues' },
  { icon: RiCameraLine, key: 'cameraRepair' },
  { icon: RiPlugLine, key: 'chargingPort' },
  { icon: RiHardDrive2Line, key: 'dataRecovery' },
  { icon: RiVolumeUpLine, key: 'speakerMic' },
];

/* horizontal rail: scroll state + arrows, one rAF-throttled listener */
const useRail = (dep) => {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ left: false, right: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf;
    const check = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const left = Math.abs(el.scrollLeft) > 2;
        const right = Math.abs(el.scrollLeft) + el.clientWidth < el.scrollWidth - 5;
        setEdge((s) => (s.left === left && s.right === right ? s : { left, right }));
      });
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); cancelAnimationFrame(raf); };
  }, [dep]);
  const scroll = useCallback((dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: (dir === 'left' ? -1 : 1) * el.clientWidth * 0.75, behavior: 'smooth' });
  }, []);
  return { ref, ...edge, scroll };
};

/* ───────────── Section banner (same gradient block as Products "Latest arrivals") ───────────── */
const SectionBanner = memo(({ badge, title, subtitle, children, darkMode }) => (
  <div className={`relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-8 ${darkMode ? 'bg-gradient-to-br from-emerald-900 via-emerald-950 to-gray-950 ring-1 ring-emerald-500/20' : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800'}`}>
    <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
    <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-emerald-300/10 blur-2xl" />
    <div className="relative flex flex-wrap items-center justify-between gap-6">
      <div className="max-w-md">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white"><FiTag className="h-3 w-3" /> {badge}</span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-emerald-50/80">{subtitle}</p>}
        {children}
      </div>
      <DeviceScene className="hidden h-32 w-48 sm:block lg:h-36 lg:w-56" />
    </div>
  </div>
));

const RailArrows = ({ rail, darkMode }) => {
  if (!rail.left && !rail.right) return null;
  const btn = (dir, disabled) => (
    <Btn3D tone="soft" darkMode={darkMode} onClick={() => rail.scroll(dir)} disabled={disabled} aria-label={`Scroll ${dir}`} className="h-10 w-10">
      {dir === 'left' ? <FiChevronLeft className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}
    </Btn3D>
  );
  return <div className="mt-4 flex gap-2">{btn('left', !rail.left)}{btn('right', !rail.right)}</div>;
};

const EmptyRail = memo(({ label, darkMode }) => (
  <div className={`flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed py-12 text-center ${darkMode ? 'border-gray-800 bg-gray-900/40' : 'border-emerald-200 bg-white/60'}`}>
    <DeviceScene compact className="h-24 w-32" />
    <p className={`text-sm font-semibold sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{label}</p>
  </div>
));

/* ───────────── Search ───────────── */
const SearchBar = memo(({ darkMode, products, shops, language }) => {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef(null);

  const results = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    if (!q) return { products: [], shops: [], offers: [] };
    return {
      products: products.filter((p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)).slice(0, 4),
      shops: shops.filter((s) => s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)).slice(0, 3),
      offers: OFFERS.filter((o) => o.title.toLowerCase().includes(q)).slice(0, 3),
    };
  }, [deferred, products, shops]);

  useEffect(() => {
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false); };
    const onKey = (e) => e.key === 'Escape' && setFocused(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, []);

  const hasQuery = query.trim().length > 0;
  const total = results.products.length + results.shops.length + results.offers.length;
  const muted = darkMode ? 'text-gray-500' : 'text-gray-400';
  const rowCls = `group flex items-center gap-3 rounded-xl px-1 py-2 transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-emerald-50'}`;
  const label = (txt) => <p className={`mb-1 text-[11px] font-bold uppercase tracking-wide ${muted}`}>{txt}</p>;
  const arrow = <FiArrowRight className={`h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 ${muted}`} />;

  return (
    <div className="relative z-[60] w-full max-w-xl" ref={wrapRef}>
      <div className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 backdrop-blur-xl transition-colors ${
        focused ? (darkMode ? 'border-emerald-500 bg-gray-900/80' : 'border-emerald-500 bg-white/90') : darkMode ? 'border-white/15 bg-white/5' : 'border-white/60 bg-white/60'
      }`}>
        <FiSearch className={`h-5 w-5 flex-shrink-0 ${focused ? 'text-emerald-500' : muted}`} />
        <input
          type="search"
          value={query}
          maxLength={80}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={tr(language, 'search')}
          aria-label="Search products and shops"
          className={`min-w-0 flex-1 bg-transparent text-sm font-medium outline-none ${darkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-500'}`}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}>
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>

      {focused && (
        <div className={`absolute left-0 right-0 top-full mt-2 max-h-[420px] overflow-y-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${darkMode ? 'border-emerald-900/70 bg-gray-900/95' : 'border-emerald-100 bg-white/95'}`}>
          {!hasQuery && (
            <>
              {label(tr(language, 'quickAccess'))}
              <div className="grid grid-cols-2 gap-2">
                {[
                  [tr(language, 'browseProducts'), '/devices', FiMonitor],
                  [tr(language, 'findShops'), '/shops', RiStoreLine],
                  [tr(language, 'bookRepair'), '/repair', FiTool],
                  [tr(language, 'latestOffers'), '/offers', FiTag],
                ].map(([text, href, Icon]) => (
                  <a key={href} href={href} className={`flex items-center gap-2.5 rounded-xl p-2.5 text-sm font-medium transition-colors ${darkMode ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-emerald-50'}`}>
                    <Chip3D className="h-8 w-8 flex-shrink-0"><Icon className="h-4 w-4" /></Chip3D> {text}
                  </a>
                ))}
              </div>
            </>
          )}

          {hasQuery && total === 0 && (
            <div className="py-6 text-center">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No results for “{query.slice(0, 30)}”</p>
              <p className={`mt-1 text-xs ${muted}`}>Try a different search term.</p>
            </div>
          )}

          {hasQuery && results.products.length > 0 && (
            <div className="mb-3">
              {label('Products')}
              {results.products.map((p) => (
                <a key={p.id} href={`/device/${encodeURIComponent(p.id)}`} className={rowCls}>
                  <div className={`h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl ${darkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
                    {p.imageUrl && <img src={p.imageUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-contain p-1" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                    <p className={`text-xs font-bold tabular-nums ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{money(p.finalPrice)}</p>
                  </div>
                  {arrow}
                </a>
              ))}
            </div>
          )}

          {hasQuery && results.shops.length > 0 && (
            <div className="mb-3">
              {label('Shops')}
              {results.shops.map((s) => (
                <a key={s.id} href={`/shops/${encodeURIComponent(s.id)}`} className={rowCls}>
                  <Chip3D className="h-10 w-10 flex-shrink-0 text-base font-black">{s.name?.charAt(0)?.toUpperCase() || 'S'}</Chip3D>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{s.name}</p>
                    {s.shopAddress?.city && <p className={`truncate text-xs ${muted}`}>{s.shopAddress.city}</p>}
                  </div>
                  {arrow}
                </a>
              ))}
            </div>
          )}

          {hasQuery && results.offers.length > 0 && (
            <div>
              {label('Offers')}
              {results.offers.map(({ id, title, Icon }) => (
                <a key={id} href="/offers" className={rowCls}>
                  <Chip3D tone="am" className="h-10 w-10 flex-shrink-0"><Icon className="h-4 w-4" /></Chip3D>
                  <p className={`flex-1 text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{title}</p>
                  {arrow}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

/* ───────────── Repair + Offers action cards ───────────── */
const ActionCard = memo(({ darkMode, tone, icon: Icon, eyebrow, title, description, to, ctaLabel, children }) => (
  <div className={`relative flex h-full flex-col overflow-hidden rounded-3xl border p-6 sm:p-8 ${
    darkMode
      ? 'border-emerald-900/70 bg-gradient-to-b from-emerald-900/40 to-emerald-950 shadow-[0_6px_0_0_#022c22]'
      : 'border-emerald-200 bg-gradient-to-b from-white to-emerald-50 shadow-[0_6px_0_0_#a7f3d0]'
  }`}>
    <DeviceScene compact className="absolute right-3 top-3 hidden h-20 w-28 opacity-90 sm:block" />
    <div className="relative flex flex-1 flex-col">
      <span className={`inline-flex items-center gap-2 self-start rounded-full py-1 pl-1 pr-3 text-[11px] font-bold ${darkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-600/10 text-emerald-700'}`}>
        <Chip3D tone={tone} className="h-6 w-6"><Icon className="h-3.5 w-3.5" /></Chip3D> {eyebrow}
      </span>
      <h3 className={`mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{title}</h3>
      <p className={`mt-2 max-w-sm text-sm leading-relaxed sm:text-base ${darkMode ? 'text-emerald-100/60' : 'text-emerald-900/70'}`}>{description}</p>
      <div className="my-6 flex-1">{children}</div>
      <Btn3D as={Link} to={to} className="self-start px-6 py-3 text-sm">
        {ctaLabel} <FiArrowRight className="h-4 w-4" />
      </Btn3D>
    </div>
  </div>
));

const ActionSection = memo(({ darkMode, language }) => {
  const isRtl = languageDirection(language) === 'rtl';
  return (
    <section className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <h2 className={`text-2xl font-bold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-emerald-950'}`}>{tr(language, 'todayPrompt')}</h2>
          <p className={`mt-1.5 text-sm sm:text-base ${darkMode ? 'text-emerald-200/60' : 'text-emerald-800/70'}`}>{tr(language, 'getStarted')}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 sm:gap-8">
          <ActionCard
            darkMode={darkMode} tone="em" icon={FiTool}
            eyebrow={tr(language, 'repairEyebrow')}
            title={tr(language, 'repairDevice')}
            description={tr(language, 'repairDescription')}
            to="/repair" ctaLabel={tr(language, 'bookRepair')}
          >
            <div className="grid grid-cols-2 gap-2.5">
              {REPAIR_FEATURES.map(({ icon: Icon, key }) => (
                <div key={key} className={`flex items-center gap-2.5 rounded-xl border p-2.5 ${darkMode ? 'border-emerald-900/70 bg-gray-900/40' : 'border-emerald-100 bg-white'}`}>
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}><Icon className="h-4 w-4" /></span>
                  <p className={`text-xs font-semibold leading-snug ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{tr(language, key)}</p>
                </div>
              ))}
            </div>
            <p className={`mt-3 text-[11px] font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{tr(language, 'repairMore')}</p>
          </ActionCard>

          <ActionCard
            darkMode={darkMode} tone="am" icon={FiTag}
            eyebrow={tr(language, 'offersEyebrow')}
            title={tr(language, 'latestOffers')}
            description={tr(language, 'offersDescription')}
            to="/offers" ctaLabel={tr(language, 'viewOffers')}
          >
            <ul className="space-y-2.5">
              {OFFERS.map(({ id, title, Icon }) => (
                <li key={id} className={`flex items-center gap-3 rounded-xl border p-2.5 ${darkMode ? 'border-emerald-900/70 bg-gray-900/40' : 'border-emerald-100 bg-white'}`}>
                  <Chip3D tone="am" className="h-9 w-9 flex-shrink-0"><Icon className="h-4 w-4" /></Chip3D>
                  <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{title}</span>
                  <FiArrowRight className={`ms-auto h-4 w-4 flex-shrink-0 ${isRtl ? 'rotate-180' : ''} ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                </li>
              ))}
            </ul>
          </ActionCard>
        </div>
      </div>
    </section>
  );
});

/* ───────────── Shop card ───────────── */
const ShopCard = memo(({ shop, darkMode, language, onOpen }) => {
  const open = useCallback(() => onOpen(shop), [onOpen, shop]);
  return (
    <article
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}
      tabIndex={0}
      aria-label={shop.name}
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${
        darkMode ? 'border-gray-700 bg-gray-800 hover:shadow-lg hover:shadow-black/30' : 'border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-200/70'
      }`}
    >
      <div className={`relative flex h-32 items-center justify-center overflow-hidden sm:h-36 ${darkMode ? 'bg-gradient-to-br from-emerald-950 via-gray-900 to-emerald-950' : 'bg-gradient-to-br from-emerald-50 via-white to-emerald-100'}`}>
        <div className={`absolute h-32 w-32 rounded-full blur-2xl ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-300/40'}`} />
        <DeviceScene compact className="absolute -bottom-2 -right-2 h-24 w-28 opacity-50" />
        <Chip3D className="relative h-16 w-16 text-3xl font-black">{shop.name?.charAt(0)?.toUpperCase() || 'S'}</Chip3D>
        {shop.verified && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-extrabold text-white shadow-[0_2px_0_0_rgba(0,0,0,0.25)]">
            <RiVerifiedBadgeLine className="h-3 w-3" /> {tr(language, 'verified')}
          </span>
        )}
        {shop.shopType && (
          <span className={`absolute bottom-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${darkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
            <RiStoreLine className="h-3 w-3" />{shop.shopType}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`line-clamp-1 text-sm font-semibold leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>{shop.name || tr(language, 'unnamedShop')}</h3>
          <span className={`flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${darkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-50 text-amber-600'}`}>
            <RiStarFill className="h-3 w-3" />{typeof shop.rating === 'number' ? shop.rating.toFixed(1) : '4.8'}
          </span>
        </div>
        {shop.shopAddress && (
          <p className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <FiMapPin className="h-3 w-3 flex-shrink-0 text-emerald-500" />
            <span className="line-clamp-1">{[shop.shopAddress.street, shop.shopAddress.city].filter(Boolean).join(', ')}</span>
          </p>
        )}
        <p className={`line-clamp-2 text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{shop.description || tr(language, 'shopDescription')}</p>

        <div className={`mt-auto flex items-center justify-between gap-2 border-t pt-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          {shop.phone ? (
            <a href={`tel:${shop.phone}`} onClick={(e) => e.stopPropagation()} className={`flex min-w-0 items-center gap-1.5 text-xs font-medium hover:text-emerald-500 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <FiPhone className="h-3 w-3 flex-shrink-0 text-emerald-500" /><span className="truncate" dir="ltr">{shop.phone}</span>
            </a>
          ) : <span />}
          <Btn3D tone="soft" darkMode={darkMode} onClick={(e) => { e.stopPropagation(); open(); }} className="flex-shrink-0 px-3 py-2 text-xs">
            {tr(language, 'visitShop')} <FiArrowRight className="h-3.5 w-3.5 text-emerald-500" />
          </Btn3D>
        </div>
      </div>
    </article>
  );
});

/* ───────────── Page ───────────── */
const HomepageContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const navigate = useNavigate();

  useEffect(() => { document.title = 'Home | Tech-Restore'; }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['homeData'],
    queryFn: async () => {
      const token = getValidToken();
      if (!token) throw new Error('Unauthorized');
      const headers = { Authorization: `Bearer ${token}` };
      const [shopRes, productRes] = await Promise.all([
        api.get('/api/users/shops/all', { headers }),
        api.get('/api/products', { headers }).catch(() => ({ data: { content: [] } })),
      ]);
      const list = productRes.data?.content || productRes.data || [];
      return {
        shops: (shopRes.data?.content || []).map((s) => ({ ...s, services: s.services || [] })),
        // hide soft-deleted products, cap the featured rail at 12
        products: (Array.isArray(list) ? list : []).filter((p) => p && !p.deleted).slice(0, 12).map(normalizeProduct),
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isError || !(error?.response?.status === 401 || error?.message === 'Unauthorized')) return;
    try { window.localStorage.removeItem('authToken'); } catch { /* ignore */ }
    loadSwal().then((Swal) =>
      Swal.fire({ icon: 'warning', title: 'Session expired', text: 'Please log in again', position: 'top-end', toast: true, timer: 2000, showConfirmButton: false })
    ).then(() => navigate('/login'));
  }, [isError, error, navigate]);

  const shops = data?.shops || [];
  const products = data?.products || [];
  // re-attach scroll listeners once the rails actually render
  const prodRail = useRail(products);
  const shopRail = useRail(shops);

  const handleAddToCart = useCallback(async (product) => {
    const token = getValidToken();
    const Swal = await loadSwal();
    if (!token) {
      const r = await Swal.fire({ title: 'Please log in', text: 'You need to log in before adding items to your cart.', icon: 'info', showCancelButton: true, confirmButtonText: 'Go to login' });
      if (r.isConfirmed) navigate('/login');
      return false;
    }
    try {
      // The server must re-validate price/name; the client sends only the product id and quantity.
      const res = await api.post('/api/cart/items', { productId: product.id, quantity: 1 }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status < 200 || res.status >= 300) throw new Error('Unexpected response');
      window.dispatchEvent(new Event('cart:updated'));
      Swal.fire({ title: 'Added!', text: `${product.name} added to cart`, icon: 'success', toast: true, position: 'top-end', timer: 1500, timerProgressBar: true, showConfirmButton: false });
      return true;
    } catch {
      Swal.fire({ title: 'Error', text: 'Failed to add to cart', icon: 'error', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
      return false;
    }
  }, [navigate]);

  const openProduct = useCallback((p) => navigate(`/device/${encodeURIComponent(p.id)}`), [navigate]);
  const openShop = useCallback((s) => navigate(`/shops/${encodeURIComponent(s.id)}`), [navigate]);

  const skeleton = (w, h) => (
    <div className="flex gap-4 overflow-hidden pb-4 sm:gap-5">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`flex-shrink-0 animate-pulse rounded-2xl ${w} ${h} ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />)}
    </div>
  );

  return (
    <div
      dir={languageDirection(language)}
      key={language}
      className={`min-h-screen ${language === 'ar' ? 'font-cairo' : 'font-poppins'} ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}
    >
      <Device3DStyles />
      <Defs3D />

      <Hero variant="home" darkMode={darkMode}>
        <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:gap-10">
          <SearchBar darkMode={darkMode} products={products} shops={shops} language={language} />
        </div>
      </Hero>

      <TrustStrip darkMode={darkMode} />
      <ActionSection darkMode={darkMode} language={language} />

      <Suspense fallback={<div className={`h-[420px] w-full animate-pulse ${darkMode ? 'bg-[#04120b]' : 'bg-emerald-50'}`} />}>
        <Service darkMode={darkMode} />
      </Suspense>

      {/* Featured products */}
      <section className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionBanner darkMode={darkMode} badge="Featured" title={tr(language, 'featuredProducts')} subtitle="Hand-picked devices, tested and ready to ship.">
            <RailArrows rail={prodRail} darkMode={darkMode} />
          </SectionBanner>

          {isLoading ? skeleton('w-[220px] sm:w-[260px]', 'h-[340px]')
            : products.length === 0 ? <EmptyRail label={tr(language, 'noProducts')} darkMode={darkMode} />
            : (
              <div ref={prodRail.ref} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 sm:gap-5">
                {products.map((p, i) => (
                  <div key={p.id} className="w-[220px] flex-shrink-0 snap-start sm:w-[260px] md:w-[280px]">
                    <ProductCard product={p} darkMode={darkMode} onAddToCart={handleAddToCart} onOpen={openProduct} index={i} />
                  </div>
                ))}
              </div>
            )}
        </div>
      </section>

      {/* Top shops */}
      <section className={`py-12 sm:py-16 ${darkMode ? 'bg-[#04120b]' : 'bg-emerald-50/70'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionBanner darkMode={darkMode} badge="Verified" title={tr(language, 'topShops')} subtitle="Repair and device shops near you.">
            <RailArrows rail={shopRail} darkMode={darkMode} />
          </SectionBanner>

          {isLoading ? skeleton('w-[260px] sm:w-[300px]', 'h-[330px]')
            : shops.length === 0 ? <EmptyRail label={tr(language, 'noShops')} darkMode={darkMode} />
            : (
              <div ref={shopRail.ref} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 sm:gap-5">
                {shops.map((s) => (
                  <div key={s.id} className="w-[260px] flex-shrink-0 snap-start sm:w-[300px]">
                    <ShopCard shop={s} darkMode={darkMode} language={language} onOpen={openShop} />
                  </div>
                ))}
              </div>
            )}
        </div>
      </section>

      <Suspense fallback={<div className={`h-64 w-full animate-pulse ${darkMode ? 'bg-gray-900' : 'bg-white'}`} />}>
        <OffersSlider darkMode={darkMode} />
      </Suspense>
    </div>
  );
});

const Homepage = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <HomepageContent {...props} />
  </QueryClientProvider>
));

export default Homepage;