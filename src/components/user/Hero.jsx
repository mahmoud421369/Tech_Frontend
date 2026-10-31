import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import enTranslations from '../../locales/en/translation.json';
import arTranslations from '../../locales/ar/translation.json';
import frTranslations from '../../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../../common/utils/useAppLanguage';
import { HeroArt, ART_BY_VARIANT } from './HeroArt';

const EASE = 'cubic-bezier(0.16,1,0.3,1)';
const HERO_TRANSLATIONS = { en: enTranslations.hero, ar: arTranslations.hero, fr: frTranslations.hero };
const NO_TRANSLATION = Object.freeze({});
const EMPTY = Object.freeze([]);
const getHeroTranslation = (language, variant) =>
  HERO_TRANSLATIONS[language]?.variants?.[variant] ?? NO_TRANSLATION;

const DARK = {
  hero: '#1e1e1e',
  page: '#141414',
  card: '#2a2a2a',
  accent: '#39ff88',
  accentSoft: '#39ff88',
};

const HERO_GLOW = {
  light:
    'radial-gradient(circle at 12% 18%, rgba(52,211,153,.28), transparent 42%), radial-gradient(circle at 88% 78%, rgba(249,115,22,.16), transparent 38%)',
  dark:
    'radial-gradient(circle at 12% 18%, rgba(57,255,136,.14), transparent 42%), radial-gradient(circle at 88% 78%, rgba(249,115,22,.10), transparent 38%)',
};
const DOT_GRID = {
  backgroundImage: 'radial-gradient(currentColor 1.25px, transparent 1.25px)',
  backgroundSize: '24px 24px',
  WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, #000 25%, transparent 72%)',
  maskImage: 'radial-gradient(ellipse at 50% 45%, #000 25%, transparent 72%)',
};

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const ENDPOINTS = {
  products: '/api/products?sort=latest&limit=8',
  offers: '/api/offers?limit=6',
  shops: '/api/shops?limit=8',
};
const ROUTES = {
  product: (id) => `/devices/${encodeURIComponent(id)}`,
  shop: (id) => `/shops/${encodeURIComponent(id)}`,
  offers: '/offers',
  all: { products: '/devices', offers: '/offers', shops: '/shops' },
};
const LIMITS = { products: 8, offers: 6, shops: 8 };
const KEYS = ['products', 'offers', 'shops'];
const CACHE_TTL = 300000;
const AUTOPLAY_MS = 7000;
const LOCALES = { en: 'en-US', ar: 'ar-EG', fr: 'fr-FR' };
const TRUST_VARIANTS = new Set(['home', 'devices', 'shops', 'repair', 'offers']);

const HERO_EXTRA = {
  en: {
    eyebrow: 'Repairs · Devices · Trusted shops',
    trust: ['Verified shops', 'Warranty on every repair', 'Fast local service'],
  },
  ar: {
    eyebrow: 'إصلاح · أجهزة · متاجر موثوقة',
    trust: ['متاجر موثّقة', 'ضمان على كل إصلاح', 'خدمة محلية سريعة'],
  },
  fr: {
    eyebrow: 'Réparation · Appareils · Boutiques de confiance',
    trust: ['Boutiques vérifiées', 'Garantie sur chaque réparation', 'Service local rapide'],
  },
};
const TRUST_ICONS = ['shield', 'wrench', 'bolt'];

const SHOWCASE_TEXT = {
  en: {
    title: 'Fresh in the marketplace',
    subtitle: 'The newest devices, live offers and trusted shops, updated as they arrive.',
    tabs: { products: 'Latest products', offers: 'Latest offers', shops: 'Trusted shops' },
    viewAll: 'View all',
    prev: 'Previous slide',
    next: 'Next slide',
    goTo: 'Go to slide',
    claim: 'Get offer',
    visit: 'Visit shop',
    off: (p) => `${p}% off`,
    save: (a) => `Save ${a}`,
    ends: (d) => `Ends ${d}`,
  },
  ar: {
    title: 'جديد في السوق',
    subtitle: 'أحدث الأجهزة والعروض الحية وأفضل المتاجر الموثوقة، تُحدَّث فور وصولها.',
    tabs: { products: 'أحدث المنتجات', offers: 'أحدث العروض', shops: 'متاجر موثوقة' },
    viewAll: 'عرض الكل',
    prev: 'الشريحة السابقة',
    next: 'الشريحة التالية',
    goTo: 'الانتقال إلى الشريحة',
    claim: 'احصل على العرض',
    visit: 'زيارة المتجر',
    off: (p) => `خصم ${p}%`,
    save: (a) => `وفّر ${a}`,
    ends: (d) => `ينتهي ${d}`,
  },
  fr: {
    title: 'Nouveautés du marché',
    subtitle: 'Les derniers appareils, les offres en cours et des boutiques de confiance, mis à jour en direct.',
    tabs: { products: 'Derniers produits', offers: 'Dernières offres', shops: 'Boutiques de confiance' },
    viewAll: 'Voir tout',
    prev: 'Diapositive précédente',
    next: 'Diapositive suivante',
    goTo: 'Aller à la diapositive',
    claim: 'Profiter de l’offre',
    visit: 'Visiter la boutique',
    off: (p) => `-${p}%`,
    save: (a) => `Économisez ${a}`,
    ends: (d) => `Se termine le ${d}`,
  },
};

const HERO_STYLES = `
  .font-jakarta, .font-jakarta * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  .font-cairo, .font-cairo * { font-family: 'Cairo', system-ui, sans-serif; }

  @keyframes heroTilt3d {
    0%, 100% { transform: perspective(1500px) rotateX(7deg) rotateY(-12deg) translateY(0); }
    50%      { transform: perspective(1500px) rotateX(3deg) rotateY(-5deg) translateY(-12px); }
  }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(var(--ty, 16px)); } to { opacity: 1; transform: translateY(0); } }
  @keyframes scaleFadeIn { from { opacity: 0; transform: scale(var(--s-from, 0.94)); } to { opacity: 1; transform: scale(1); } }

  .fade-in-up     { animation: fadeInUp var(--fdur, 0.4s) ${EASE} both; }
  .scale-fade-in  { animation: scaleFadeIn var(--fdur, 0.5s) ${EASE} both; }

  .hero-hl {
    font-weight: 700;
    color: #064e3b;
    padding-bottom: 0.22em;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2334d399' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E") left bottom / 100% 0.32em no-repeat;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .hero-dark .hero-hl {
    color: #fff;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E") left bottom / 100% 0.32em no-repeat;
  }

  @media (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
    .hero-tilt-3d { animation: heroTilt3d 7s ease-in-out infinite; will-change: transform; }
  }
  .hero-stage[data-paused="true"] .hero-tilt-3d { animation-play-state: paused; will-change: auto; }

  @media (hover: hover) {
    .hero-3d-hover { transition: transform 0.3s ${EASE}; }
    .hero-3d-hover:hover { transform: scale(1.03); }
  }

  .showcase-section { content-visibility: auto; contain-intrinsic-size: auto 900px; }

  @media (prefers-reduced-motion: reduce) {
    .hero-3d-hover, .fade-in-up, .scale-fade-in { animation: none !important; transition: none !important; }
  }
`;

const FONT_URLS = {
  jakarta: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  cairo: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap',
};
const requested = new Set();
const addLink = (rel, href, extra) => {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (extra) Object.assign(link, extra);
  document.head.appendChild(link);
};
const ensureFont = (key) => {
  if (typeof document === 'undefined' || requested.has(key)) return;
  if (!requested.size) {
    addLink('preconnect', 'https://fonts.googleapis.com');
    addLink('preconnect', 'https://fonts.gstatic.com', { crossOrigin: 'anonymous' });
  }
  requested.add(key);
  addLink('stylesheet', FONT_URLS[key]);
};

let heroStylesInjected = false;
const injectHeroStylesOnce = () => {
  if (heroStylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-hero-styles', 'true');
  tag.textContent = HERO_STYLES;
  document.head.appendChild(tag);
  heroStylesInjected = true;
};
injectHeroStylesOnce();

const text = (v) => (typeof v === 'string' ? v.trim() : '');
const num = (v) => {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const ts = (v) => {
  const n = Date.parse(v);
  return Number.isFinite(n) ? n : 0;
};
const safeImg = (v) => {
  const s = text(v);
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || /^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(s)) return s;
  return /^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('//') ? '' : s;
};
const pickImage = (o) => {
  const first = Array.isArray(o.images) ? o.images[0] : undefined;
  return (
    safeImg(o.image) || safeImg(o.imageUrl) || safeImg(o.thumbnail) || safeImg(o.logo) ||
    safeImg(o.banner) || safeImg(typeof first === 'string' ? first : first?.url)
  );
};

const toProduct = (p) => {
  if (!p || typeof p !== 'object') return null;
  const id = p.id ?? p._id;
  const name = text(p.name ?? p.title);
  if (id == null || !name) return null;
  const sale = num(p.discountPrice ?? p.salePrice ?? p.discountedPrice);
  const list = num(p.originalPrice ?? p.oldPrice ?? p.price);
  const price = sale > 0 && sale < list ? sale : num(p.price) || list;
  return {
    id: String(id),
    name,
    image: pickImage(p),
    shop: text(p.shopName ?? p.shop?.name),
    price,
    oldPrice: list > price ? list : 0,
    created: ts(p.createdAt ?? p.created_at ?? p.createdDate),
  };
};

const toOffer = (o) => {
  if (!o || typeof o !== 'object') return null;
  const id = o.id ?? o._id;
  const title = text(o.title ?? o.name);
  if (id == null || !title) return null;
  const end = ts(o.endDate ?? o.expiresAt ?? o.validUntil ?? o.expiryDate);
  if (end && end < Date.now()) return null;
  const d = num(o.discountPercentage ?? o.discountPercent ?? o.discount ?? o.percentage);
  return {
    id: String(id),
    title,
    desc: text(o.description),
    image: pickImage(o),
    shop: text(o.shopName ?? o.shop?.name),
    discount: d > 0 && d <= 100 ? Math.round(d) : 0,
    end,
    created: ts(o.createdAt ?? o.created_at ?? o.startDate),
  };
};

const toShop = (s) => {
  if (!s || typeof s !== 'object') return null;
  const id = s.id ?? s._id;
  const name = text(s.name ?? s.shopName);
  if (id == null || !name) return null;
  return {
    id: String(id),
    name,
    image: pickImage(s),
    rating: Math.min(5, num(s.rating ?? s.averageRating)),
    address: text(s.address) || text(s.city),
    created: ts(s.createdAt ?? s.created_at),
  };
};

const MAPPERS = { products: toProduct, offers: toOffer, shops: toShop };

const normalizeList = (raw, key) => {
  if (!Array.isArray(raw)) return EMPTY;
  const mapper = MAPPERS[key];
  const list = [];
  for (const entry of raw) {
    const item = mapper(entry);
    if (item) list.push(item);
  }
  if (list.some((v) => v.created)) list.sort((a, b) => b.created - a.created);
  return list.slice(0, LIMITS[key]);
};

const toList = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return EMPTY;
  const inner = raw.data ?? raw.content ?? raw.items ?? raw.results ?? raw.products ?? raw.offers ?? raw.shops;
  if (Array.isArray(inner)) return inner;
  return inner && typeof inner === 'object' ? toList(inner) : EMPTY;
};

const listCache = new Map();
const loadList = (key) => {
  const hit = listCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.promise;
  const promise = fetch(API_BASE + ENDPOINTS[key], { headers: { Accept: 'application/json' } })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .then(toList)
    .catch(() => {
      listCache.delete(key);
      return EMPTY;
    });
  listCache.set(key, { at: Date.now(), promise });
  return promise;
};

const useShowcaseData = (source, enabled) => {
  const [remote, setRemote] = useState({});
  const need = KEYS.filter((k) => !source?.[k]);
  const needKey = need.join();

  useEffect(() => {
    if (!needKey || !enabled) return undefined;
    let alive = true;
    Promise.all(needKey.split(',').map((k) => loadList(k).then((list) => [k, list]))).then((pairs) => {
      if (alive) setRemote((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
    });
    return () => { alive = false; };
  }, [needKey, enabled]);

  const rawProducts = source?.products ?? remote.products;
  const rawOffers = source?.offers ?? remote.offers;
  const rawShops = source?.shops ?? remote.shops;

  const products = useMemo(() => normalizeList(rawProducts, 'products'), [rawProducts]);
  const offers = useMemo(() => normalizeList(rawOffers, 'offers'), [rawOffers]);
  const shops = useMemo(() => normalizeList(rawShops, 'shops'), [rawShops]);
  const loading = need.some((k) => remote[k] === undefined);

  return { products, offers, shops, loading };
};

const useIdleReady = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const done = () => setReady(true);
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(done, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(done, 250);
    return () => clearTimeout(id);
  }, []);
  return ready;
};

const formatters = {};
const getFormatters = (locale) => {
  if (formatters[locale]) return formatters[locale];
  let money = (v) => String(v);
  let date = () => '';
  try {
    const m = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 });
    money = (v) => m.format(v);
    const d = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
    date = (v) => d.format(v);
  } catch (e) {
    money = (v) => String(v);
  }
  formatters[locale] = { money, date };
  return formatters[locale];
};

const CARD_BASE =
  '[--dx:1] rtl:[--dx:-1] rounded-2xl border-[3px] border-[color:var(--ink)] [box-shadow:calc(var(--dx)*5px)_5px_0_0_var(--ink)]';
const CARD_MOTION =
  'group transition-[transform,box-shadow] duration-200 ease-out focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-emerald-500 ' +
  '[@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:[box-shadow:calc(var(--dx)*8px)_9px_0_0_var(--ink)] ' +
  'active:translate-y-[2px] active:translate-x-[calc(var(--dx)*2px)] active:[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--ink)]';
const CTRL_BASE =
  '[--dx:1] rtl:[--dx:-1] inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-[color:var(--ink)] px-4 py-2.5 text-sm font-extrabold sm:text-base ' +
  'transition-[transform,box-shadow,background-color] duration-150 ease-out [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--ink)] ' +
  'active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:none] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-emerald-500';
const CLAMP2 = '[display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden';
const IMG_ZOOM = 'transition-transform duration-300 motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105';

const THEMES = {
  light: {
    ink: '[--ink:#022c22]',
    card: `${CARD_BASE} ${CARD_MOTION} [--ink:#022c22] bg-white text-emerald-950`,
    frame: 'border-gray-200 bg-gray-50',
    muted: 'text-gray-600',
    accent: 'text-emerald-700',
    badge: 'border-emerald-950 bg-emerald-500 text-emerald-950',
    deal: 'border-emerald-950 bg-orange-500 text-black',
    tabOn: `${CTRL_BASE} [--ink:#022c22] bg-emerald-500 text-emerald-950`,
    tabOff: `${CTRL_BASE} [--ink:#022c22] bg-white text-emerald-950 hover:bg-emerald-50`,
    ctrl: `${CTRL_BASE} [--ink:#022c22] bg-white text-emerald-950 hover:bg-emerald-50`,
    dot: 'bg-white',
    dotOn: 'bg-emerald-500',
    title: 'text-emerald-950',
    skel: 'border-gray-200 bg-gray-200',
    chip: 'border-emerald-950 bg-white text-emerald-950 [--ink:#022c22]',
  },
  dark: {
    ink: '[--ink:#000]',
    card: `${CARD_BASE} ${CARD_MOTION} [--ink:#000] bg-[#2a2a2a] text-white`,
    frame: 'border-black bg-[#1e1e1e]',
    muted: 'text-neutral-400',
    accent: 'text-[#39ff88]',
    badge: 'border-black bg-[#39ff88] text-black',
    deal: 'border-black bg-orange-400 text-black',
    tabOn: `${CTRL_BASE} [--ink:#000] bg-[#39ff88] text-black`,
    tabOff: `${CTRL_BASE} [--ink:#000] bg-[#2a2a2a] text-white hover:bg-[#333]`,
    ctrl: `${CTRL_BASE} [--ink:#000] bg-[#2a2a2a] text-white hover:bg-[#333]`,
    dot: 'bg-[#2a2a2a]',
    dotOn: 'bg-[#39ff88]',
    title: 'text-white',
    skel: 'border-black bg-[#2a2a2a]',
    chip: 'border-black bg-[#2a2a2a] text-white [--ink:#000]',
  },
};

const GRID = {
  products: 'grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5',
  offers: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5',
  shops: 'grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5',
};
const range = (n) => Array.from({ length: n }, (_, i) => i);
const SKELETON = {
  products: { ids: range(8), grid: GRID.products, h: 'h-72' },
  offers: { ids: range(6), grid: GRID.offers, h: 'h-72' },
  shops: { ids: range(8), grid: GRID.shops, h: 'h-60' },
};

const ICON_PATHS = {
  shield: 'M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3zM9 12l2 2 4-4',
  wrench: 'M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
};

const Icon = memo(({ name, className = 'h-4 w-4' }) => (
  <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICON_PATHS[name]} />
  </svg>
));

const WaveBottom = memo(({ darkMode }) => (
  <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden leading-none">
    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg" className="relative block h-16 w-full md:h-24" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z" fill={darkMode ? DARK.page : '#f9fafb'} />
    </svg>
  </div>
));

const HeroBackdrop = memo(({ darkMode }) => (
  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
    <div className="absolute inset-0" style={{ backgroundImage: darkMode ? HERO_GLOW.dark : HERO_GLOW.light }} />
    <div
      className={`absolute inset-0 ${darkMode ? 'text-white/10' : 'text-emerald-900/15'}`}
      style={DOT_GRID}
    />
  </div>
));

const Burst = memo(({ darkMode }) => (
  <svg
    className={`pointer-events-none absolute end-[1%] top-[2%] z-10 w-14 sm:w-20 lg:w-24 rtl:-scale-x-100 ${darkMode ? 'text-[#39ff88] [filter:drop-shadow(0_0_8px_rgba(57,255,136,.8))]' : 'text-emerald-600'}`}
    viewBox="0 0 160 150" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" aria-hidden="true"
  >
    <path d="M22 10L12 108" />
    <path d="M127 13L30 122" />
    <path d="M150 103L40 137" />
  </svg>
));

const Illustration3DStage = memo(({ type, darkMode }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      ([entry]) => { el.dataset.paused = entry.isIntersecting ? 'false' : 'true'; },
      { rootMargin: '60px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="hero-stage absolute inset-0 z-[5]">
      <div className="hero-3d-hover h-full w-full">
        <div className="hero-tilt-3d h-full w-full">
          <HeroArt type={type} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
});

const Eyebrow = memo(({ label, darkMode }) => (
  <span
    className={`fade-in-up [--dx:1] rtl:[--dx:-1] inline-flex items-center gap-2.5 rounded-full border-[3px] px-4 py-1.5 text-xs font-extrabold [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--ink)] sm:text-sm ${
      darkMode ? 'border-black bg-[#2a2a2a] text-white [--ink:#000]' : 'border-emerald-950 bg-white text-emerald-900 [--ink:#022c22]'
    }`}
    style={{ '--ty': '8px', '--fdur': '0.3s' }}
  >
    <span className="relative flex h-2.5 w-2.5">
      <span className={`absolute inline-flex h-full w-full rounded-full opacity-70 motion-safe:animate-ping ${darkMode ? 'bg-[#39ff88]' : 'bg-emerald-500'}`} />
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${darkMode ? 'bg-[#39ff88]' : 'bg-emerald-600'}`} />
    </span>
    {label}
  </span>
));

const TrustStrip = memo(({ items, darkMode }) => {
  const th = THEMES[darkMode ? 'dark' : 'light'];
  return (
    <ul
      className="fade-in-up flex flex-wrap justify-center gap-2.5 lg:justify-start"
      style={{ '--ty': '8px', '--fdur': '0.3s', animationDelay: '0.22s' }}
    >
      {items.map((label, i) => (
        <li key={label} className={`inline-flex items-center gap-2 rounded-full border-2 px-3.5 py-1.5 text-xs font-bold sm:text-sm ${th.chip}`}>
          <Icon name={TRUST_ICONS[i % TRUST_ICONS.length]} className={`h-4 w-4 ${th.accent}`} />
          {label}
        </li>
      ))}
    </ul>
  );
});

const renderRich = (text) =>
  String(text ?? '').split('**').map((part, i) => (i % 2 ? <span key={i} className="hero-hl">{part}</span> : part));

const VARIANT_DEFAULTS = {
  home: {
    headingLine1: 'Put your', headingAccent: 'devices', headingLine2: 'first',
    description: 'Fast, trusted repairs and premium refurbished devices. Find **expert technicians** and **top shops** all in one place.',
    buttons: [{ label: 'Book a Repair', to: '/repair', primary: true }, { label: 'Browse Devices', to: '/devices', primary: false }],
  },
  devices: {
    headingLine1: 'Find your', headingAccent: 'next device', headingLine2: 'today',
    description: 'Browse **new, used and refurbished** phones and laptops from verified shops. Every listing is checked and warrantied.',
    buttons: [{ label: 'Browse Devices', to: '/devices', primary: true }, { label: 'Compare Shops', to: '/shops', primary: false }],
  },
  track: {
    headingLine1: 'Track your', headingAccent: 'orders', headingLine2: 'in real time',
    description: 'Watch every step of your delivery, **from warehouse to your doorstep**. Stay informed, stay in control.',
    buttons: [{ label: 'View My Orders', to: '/account', primary: true }, { label: 'Explore Shop', to: '/devices', primary: false }],
  },
  account: {
    headingLine1: 'Manage your', headingAccent: 'account', headingLine2: 'all in one place',
    description: 'Your **profile, addresses, orders** and **repair requests**, all in one place.',
    buttons: [{ label: 'My Orders', to: '/account', primary: true }, { label: 'Book a Repair', to: '/repair', primary: false }],
  },
  repair: {
    headingLine1: 'Put Your', headingAccent: 'Device', headingLine2: 'First',
    description: 'Fast, reliable repairs from **trusted local shops**. Describe your issue and get **connected instantly**.',
    buttons: [{ label: 'Book a Repair', to: '/repair', primary: true }, { label: 'My Orders', to: '/account', primary: false }],
  },
  offers: {
    headingLine1: 'Exclusive', headingAccent: 'Offers Just', headingLine2: 'For You',
    description: 'Save big on **repairs, accessories** and premium services at trusted shops near you. Limited time, grab them fast.',
    buttons: [{ label: 'Browse shops', to: '/shops', primary: true }, { label: 'Book a Repair', to: '/repair', primary: false }],
  },
  shop: {
    headingLine1: '', headingAccent: 'Trusted Shop', headingLine2: '',
    description: '**Genuine parts**, expert technicians and **fast turnaround** you can count on.',
    buttons: [{ label: 'View Products', href: '#shop-products', primary: true }, { label: 'Browse All Shops', to: '/shops', primary: false }],
  },
  shops: {
    headingLine1: 'Find the', headingAccent: 'right shop', headingLine2: 'near you',
    description: 'Compare **verified, rated shops** for repairs and device sales, then pick the one that fits.',
    buttons: [{ label: 'Browse Shops', to: '/shops', primary: true }, { label: 'Book a Repair', to: '/repair', primary: false }],
  },
  shopPage: {
    headingLine1: '', headingAccent: 'Trusted Shop', headingLine2: '',
    description: '**Genuine parts**, expert technicians and a team you can **chat with** any time.',
    buttons: [{ label: 'View Products', href: '#shop-products', primary: true }, { label: 'Browse All Shops', to: '/shops', primary: false }],
  },
  category: {
    headingLine1: 'Everything in', headingAccent: 'this category', headingLine2: '',
    description: '**Verified listings**, real conditions and fair prices. Filter by price and condition to find the right fit.',
    buttons: [{ label: 'View All Products', to: '/devices', primary: true }],
  },
  login: {
    headingLine1: 'Welcome', headingAccent: 'back', headingLine2: '',
    description: 'Sign in to see your **orders**, **repairs** and saved devices.',
    buttons: [],
  },
  signup: {
    headingLine1: 'Create your', headingAccent: 'account', headingLine2: '',
    description: 'Join in a minute to **book repairs**, **track orders** and shop verified devices.',
    buttons: [],
  },
  admin: {
    headingLine1: 'Run the', headingAccent: 'platform', headingLine2: 'with ease',
    description: 'Follow **shops, orders and logistics** from one dashboard.',
    buttons: [],
  },
};

const BTN_BASE =
  '[--dx:1] rtl:[--dx:-1] group inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 rounded-2xl border-[3px] border-[color:var(--ink)] px-7 py-4 text-base font-extrabold sm:px-9 sm:text-lg ' +
  'transition-[transform,box-shadow,background-color] duration-150 ease-out ' +
  '[box-shadow:calc(var(--dx)*7px)_7px_0_0_var(--ink)] ' +
  'hover:translate-y-[3px] hover:translate-x-[calc(var(--dx)*3px)] hover:[box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--ink)] ' +
  'active:translate-y-[7px] active:translate-x-[calc(var(--dx)*7px)] active:[box-shadow:0_0_0_0_var(--ink)] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4';
const BUTTON_CLASSES = {
  light: {
    primary: `${BTN_BASE} [--ink:#022c22] bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-600`,
    secondary: `${BTN_BASE} [--ink:#022c22] bg-white text-emerald-900 hover:bg-emerald-50 focus-visible:outline-emerald-600`,
  },
  dark: {
    primary: `${BTN_BASE} [--ink:#000] bg-[#39ff88] text-black hover:bg-[#6dffa8] focus-visible:outline-[#39ff88]`,
    secondary: `${BTN_BASE} [--ink:#000] bg-[#2a2a2a] text-white hover:bg-[#333] focus-visible:outline-[#39ff88]`,
  },
};

const Arrow = memo(() => (
  <svg
    className="h-5 w-5 shrink-0 transition-transform duration-150 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
));

const Chevron = memo(() => (
  <svg className="h-5 w-5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
));

const Star = memo(() => (
  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
  </svg>
));

const Pin = memo(() => (
  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
));

const Store = memo(() => (
  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0" />
  </svg>
));

const Placeholder = memo(({ className }) => (
  <svg className={`mx-auto h-full w-1/2 opacity-60 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="2.5" width="14" height="19" rx="3" />
    <path d="M10.5 18.5h3" />
  </svg>
));

const HeroButton = memo(({ btn, className }) => {
  const content = <>{btn.label}{btn.primary && <Arrow />}</>;
  if (btn.onClick) return <button type="button" onClick={btn.onClick} className={className}>{content}</button>;
  if (btn.href) return <a href={btn.href} className={className}>{content}</a>;
  return <Link to={btn.to} className={className}>{content}</Link>;
});

const ProductCard = memo(({ item, active, th, t, money }) => {
  const percent = item.oldPrice ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100) : 0;
  return (
    <Link to={ROUTES.product(item.id)} tabIndex={active ? 0 : -1} draggable={false} className={`${th.card} flex h-full flex-col overflow-hidden`}>
      <div className={`relative m-3 mb-0 aspect-square overflow-hidden rounded-xl border-2 p-3 ${th.frame}`}>
        {item.image ? (
          <img src={item.image} alt="" width="320" height="320" loading="lazy" decoding="async" draggable={false} referrerPolicy="no-referrer" className={`h-full w-full object-contain ${IMG_ZOOM}`} />
        ) : (
          <Placeholder className={th.muted} />
        )}
        {percent > 0 && (
          <span className={`absolute start-2 top-2 rounded-full border-2 px-2 py-0.5 text-xs font-extrabold ${th.deal}`}>{t.off(percent)}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className={`${CLAMP2} text-sm font-extrabold leading-snug sm:text-base`}>{item.name}</h3>
        {item.shop && (
          <p className={`flex items-center gap-1.5 text-xs font-medium ${th.muted}`}>
            <Store />
            <span className="truncate">{item.shop}</span>
          </p>
        )}
        {item.price > 0 && (
          <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2">
            <span className="text-lg font-extrabold">{money(item.price)}</span>
            {item.oldPrice > 0 && <span className={`text-xs line-through ${th.muted}`}>{money(item.oldPrice)}</span>}
          </div>
        )}
        {item.oldPrice > 0 && <span className={`text-xs font-bold ${th.accent}`}>{t.save(money(item.oldPrice - item.price))}</span>}
      </div>
    </Link>
  );
});

const OfferCard = memo(({ item, active, th, t, date }) => {
  const ends = item.end ? date(item.end) : '';
  return (
    <Link to={ROUTES.offers} tabIndex={active ? 0 : -1} draggable={false} className={`${th.card} flex h-full flex-col overflow-hidden`}>
      <div className={`relative m-3 mb-0 aspect-[16/9] overflow-hidden rounded-xl border-2 ${th.frame}`}>
        {item.image ? (
          <img src={item.image} alt="" width="480" height="270" loading="lazy" decoding="async" draggable={false} referrerPolicy="no-referrer" className={`h-full w-full object-cover ${IMG_ZOOM}`} />
        ) : (
          <Placeholder className={th.muted} />
        )}
        {item.discount > 0 && (
          <span className={`absolute end-2 top-2 rounded-full border-2 px-3 py-1 text-sm font-extrabold ${th.deal}`}>{t.off(item.discount)}</span>
        )}
        {item.shop && (
          <span className="absolute bottom-2 start-2 inline-flex max-w-[70%] items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 text-xs font-bold text-white">
            <Store />
            <span className="truncate">{item.shop}</span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className={`${CLAMP2} text-base font-extrabold leading-snug sm:text-lg`}>{item.title}</h3>
        {item.desc && <p className={`${CLAMP2} text-sm ${th.muted}`}>{item.desc}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2 text-xs font-bold">
          <span className={`truncate ${th.muted}`}>{ends ? t.ends(ends) : ''}</span>
          <span className={`inline-flex shrink-0 items-center gap-1 text-sm ${th.accent}`}>{t.claim}<Arrow /></span>
        </div>
      </div>
    </Link>
  );
});

const ShopCard = memo(({ item, active, th, t }) => (
  <Link to={ROUTES.shop(item.id)} tabIndex={active ? 0 : -1} draggable={false} className={`${th.card} flex h-full flex-col overflow-hidden`}>
    <div className={`m-3 mb-0 aspect-[4/3] overflow-hidden rounded-xl border-2 p-3 ${th.frame}`}>
      {item.image ? (
        <img src={item.image} alt="" width="320" height="240" loading="lazy" decoding="async" draggable={false} referrerPolicy="no-referrer" className={`h-full w-full object-contain ${IMG_ZOOM}`} />
      ) : (
        <Placeholder className={th.muted} />
      )}
    </div>
    <div className="flex flex-1 flex-col gap-1.5 p-4">
      <h3 className="truncate text-sm font-extrabold sm:text-base">{item.name}</h3>
      {(item.rating > 0 || item.address) && (
        <div className={`flex min-w-0 items-center gap-3 text-xs font-bold ${th.muted}`}>
          {item.rating > 0 && <span className={`inline-flex shrink-0 items-center gap-1 ${th.accent}`}><Star />{item.rating.toFixed(1)}</span>}
          {item.address && <span className="inline-flex min-w-0 items-center gap-1"><Pin /><span className="truncate">{item.address}</span></span>}
        </div>
      )}
      <span className={`mt-auto inline-flex items-center gap-1 pt-2 text-sm font-extrabold ${th.accent}`}>{t.visit}<Arrow /></span>
    </div>
  </Link>
));

const Skeleton = memo(({ kind, th }) => {
  const s = SKELETON[kind];
  return (
    <div className={s.grid} aria-hidden="true">
      {s.ids.map((i) => <div key={i} className={`${s.h} animate-pulse rounded-2xl border-[3px] ${th.skel}`} />)}
    </div>
  );
});

const SlideBody = memo(({ kind, items, active, th, t, money, date }) => {
  if (!items.length) return <Skeleton kind={kind} th={th} />;
  if (kind === 'products') {
    return <div className={GRID.products}>{items.map((item) => <ProductCard key={item.id} item={item} active={active} th={th} t={t} money={money} />)}</div>;
  }
  if (kind === 'offers') {
    return <div className={GRID.offers}>{items.map((item) => <OfferCard key={item.id} item={item} active={active} th={th} t={t} date={date} />)}</div>;
  }
  return <div className={GRID.shops}>{items.map((item) => <ShopCard key={item.id} item={item} active={active} th={th} t={t} />)}</div>;
});

const Showcase = memo(({ darkMode, language, source }) => {
  const t = SHOWCASE_TEXT[language] ?? SHOWCASE_TEXT.en;
  const th = THEMES[darkMode ? 'dark' : 'light'];
  const dir = languageDirection(language);
  const rtl = dir === 'rtl';
  const { money, date } = getFormatters(LOCALES[language] ?? LOCALES.en);
  const ready = useIdleReady();
  const { products, offers, shops, loading } = useShowcaseData(source, ready);

  const slides = useMemo(() => {
    const all = [
      { key: 'products', items: products },
      { key: 'offers', items: offers },
      { key: 'shops', items: shops },
    ];
    return loading ? all : all.filter((s) => s.items.length);
  }, [products, offers, shops, loading]);

  const n = slides.length;
  const hasSlides = n > 0;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduceMotion] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const sectionRef = useRef(null);
  const startRef = useRef(null);
  const draggedRef = useRef(false);
  const current = n ? Math.min(index, n - 1) : 0;

  const go = useCallback((i) => {
    if (n) setIndex(((i % n) + n) % n);
  }, [n]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [hasSlides]);

  useEffect(() => {
    if (n < 2 || paused || !inView || loading || reduceMotion) return undefined;
    const id = setTimeout(() => setIndex((i) => (Math.min(i, n - 1) + 1) % n), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [n, paused, inView, loading, reduceMotion, current]);

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY };
    draggedRef.current = false;
  };
  const onPointerUp = (e) => {
    const s = startRef.current;
    startRef.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      draggedRef.current = true;
      go(current + ((rtl ? dx > 0 : dx < 0) ? 1 : -1));
    }
  };
  const onClickCapture = (e) => {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      draggedRef.current = false;
    }
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') go(current + (rtl ? -1 : 1));
    else if (e.key === 'ArrowLeft') go(current + (rtl ? 1 : -1));
  };

  if (!hasSlides) return null;

  const activeKey = slides[current].key;

  return (
    <section
      ref={sectionRef}
      dir={dir}
      aria-label={t.title}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={`showcase-section relative pb-20 pt-6 sm:pb-28 ${rtl ? 'font-cairo' : 'font-jakarta'} ${darkMode ? '' : 'bg-gray-50'}`}
      style={darkMode ? { backgroundColor: DARK.page } : undefined}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className={`max-w-2xl space-y-3 ${th.title}`}>
          <h2 className={`font-extrabold [text-wrap:balance] text-3xl sm:text-5xl ${rtl ? 'leading-[1.35]' : 'leading-[1.05] tracking-[-0.035em]'}`}>{t.title}</h2>
          <p className={`text-base font-medium [text-wrap:pretty] sm:text-lg ${th.muted}`}>{t.subtitle}</p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div role="tablist" aria-label={t.title} className="flex flex-wrap gap-3">
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={i === current}
                onClick={() => go(i)}
                className={i === current ? th.tabOn : th.tabOff}
              >
                {t.tabs[s.key]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to={ROUTES.all[activeKey]} className={`group inline-flex min-h-11 items-center gap-1 text-sm font-extrabold underline-offset-4 hover:underline sm:text-base ${th.accent}`}>
              {t.viewAll}<Arrow />
            </Link>
            {n > 1 && (
              <>
                <button type="button" aria-label={t.prev} onClick={() => go(current - 1)} className={`${th.ctrl} !px-3`}>
                  <span className="inline-flex rotate-180"><Chevron /></span>
                </button>
                <button type="button" aria-label={t.next} onClick={() => go(current + 1)} className={`${th.ctrl} !px-3`}>
                  <Chevron />
                </button>
              </>
            )}
          </div>
        </div>

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label={t.tabs[activeKey]}
          aria-live={paused ? 'polite' : 'off'}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { startRef.current = null; }}
          onClickCapture={onClickCapture}
          onKeyDown={onKeyDown}
          onDragStart={(e) => e.preventDefault()}
          className="mt-6 touch-pan-y overflow-hidden focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          <div
            className="flex will-change-transform transition-transform duration-500 motion-reduce:transition-none"
            style={{ transform: `translate3d(${(rtl ? current : -current) * 100}%,0,0)`, transitionTimingFunction: EASE }}
          >
            {slides.map((s, i) => (
              <div
                key={s.key}
                role="group"
                aria-roledescription="slide"
                aria-label={t.tabs[s.key]}
                aria-hidden={i !== current}
                className="w-full shrink-0 basis-full p-2 pb-4"
              >
                <SlideBody kind={s.key} items={s.items} active={i === current} th={th} t={t} money={money} date={date} />
              </div>
            ))}
          </div>
        </div>

        {n > 1 && (
          <div className="mt-5 flex items-center justify-center gap-1">
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                aria-label={`${t.goTo} ${i + 1}`}
                aria-current={i === current}
                onClick={() => go(i)}
                className="flex h-8 cursor-pointer items-center px-1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-emerald-500"
              >
                <span
                  className={`block h-3 rounded-full border-2 border-[color:var(--ink)] transition-[width,background-color] duration-300 ${th.ink} ${i === current ? `w-9 ${th.dotOn}` : `w-3 ${th.dot}`}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

const Hero = memo(({ variant = 'home', darkMode = false, illustration, headingLine1, headingAccent, headingLine2, description, buttons, children, showcase, showcaseData, eyebrow, trust }) => {
  const language = useAppLanguage();
  const isAr = language === 'ar';

  useEffect(() => { ensureFont(isAr ? 'cairo' : 'jakarta'); }, [isAr]);

  const cfg = VARIANT_DEFAULTS[variant] ?? VARIANT_DEFAULTS.home;
  const translated = getHeroTranslation(language, variant);
  const extra = HERO_EXTRA[language] ?? HERO_EXTRA.en;
  const illoType = illustration ?? ART_BY_VARIANT[variant] ?? 'home';

  const resolvedLine1 = headingLine1 ?? translated[1] ?? cfg.headingLine1;
  const resolvedAccent = headingAccent ?? translated[2] ?? cfg.headingAccent;
  const resolvedLine2 = headingLine2 ?? translated[3] ?? cfg.headingLine2;
  const resolvedDesc = description ?? translated[4] ?? cfg.description;

  const richDesc = useMemo(() => renderRich(resolvedDesc), [resolvedDesc]);

  const resolvedButtons = useMemo(
    () => buttons ?? cfg.buttons.map((button, index) => ({ ...button, label: translated[index === 0 ? 5 : 6] || button.label })),
    [buttons, cfg, translated]
  );

  const btnClasses = BUTTON_CLASSES[darkMode ? 'dark' : 'light'];
  const showShowcase = showcase ?? variant === 'home';
  const eyebrowText = eyebrow === undefined ? (variant === 'home' ? extra.eyebrow : '') : eyebrow;
  const showTrust = trust ?? TRUST_VARIANTS.has(variant);

  return (
    <>
      <section
        dir={languageDirection(language)}
        className={`relative flex min-h-screen items-center overflow-hidden ${isAr ? 'font-cairo' : 'font-jakarta'} ${
          darkMode ? 'hero-dark' : 'bg-gray-100'
        }`}
        style={darkMode ? { backgroundColor: DARK.hero } : undefined}
      >
        <HeroBackdrop darkMode={darkMode} />

        <div className="relative mx-auto mt-10 w-full max-w-7xl px-6 py-20 sm:px-8 sm:py-24 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
            <div className="order-2 flex flex-col items-center space-y-7 text-center lg:order-1 lg:items-start lg:text-start">
          

              <h1
                className={`fade-in-up font-extrabold ${darkMode ? 'text-white' : 'text-emerald-900'} [text-wrap:balance] text-[2.75rem] sm:text-6xl md:text-7xl xl:text-[5.5rem] ${
                  isAr ? 'leading-[1.3] tracking-normal lg:text-7xl' : 'leading-[1.02] tracking-[-0.045em] lg:text-[4.75rem]'
                }`}
                style={{ '--ty': '18px', '--fdur': '0.4s', animationDelay: '0.05s' }}
              >
                {resolvedLine1 && <>{resolvedLine1}{' '}</>}
                <span className="relative inline-block">
                  <span className={`relative z-10 ${darkMode ? '' : 'text-emerald-600'}`} style={darkMode ? { color: DARK.accentSoft, textShadow: '0 0 18px rgba(57,255,136,.55)' } : undefined}>{resolvedAccent}</span>
                  <svg className="absolute -bottom-1 start-0 w-full" height="9" viewBox="0 0 200 9" preserveAspectRatio="none" aria-hidden="true">
                    <path
                      d="M3,6 Q50,1 100,5 T197,5"
                      stroke={darkMode ? DARK.accent : '#10b981'}
                      strokeOpacity={darkMode ? 1 : 0.9}
                      strokeWidth="5" fill="none" strokeLinecap="round"
                    />
                  </svg>
                </span>
                {resolvedLine2 && <>{' '}{resolvedLine2}</>}
              </h1>

              <p
                className={`fade-in-up mx-auto max-w-xl text-lg font-medium leading-[1.75] [text-wrap:pretty] sm:text-xl lg:mx-0 lg:text-2xl lg:leading-[1.7] ${darkMode ? 'text-neutral-300' : 'text-emerald-900'}`}
                style={{ '--ty': '12px', '--fdur': '0.35s', animationDelay: '0.1s' }}
              >
                {richDesc}
              </p>

              {children && (
                <div className="fade-in-up flex w-full justify-center lg:justify-start" style={{ '--ty': '10px', '--fdur': '0.3s', animationDelay: '0.14s' }}>
                  {children}
                </div>
              )}

              {resolvedButtons && resolvedButtons.length > 0 && (
                <div className="fade-in-up flex flex-wrap justify-center gap-5 pb-3 pe-3 lg:justify-start" style={{ '--ty': '10px', '--fdur': '0.3s', animationDelay: '0.18s' }}>
                  {resolvedButtons.map((btn) => (
                    <HeroButton key={btn.label} btn={btn} className={btn.primary ? btnClasses.primary : btnClasses.secondary} />
                  ))}
                </div>
              )}

             
            </div>

            <div
              className="scale-fade-in relative order-1 mx-auto aspect-square w-full max-w-[22rem] sm:max-w-[34rem] lg:order-2 lg:-mx-10 lg:max-w-none"
              style={{ '--s-from': 0.94, '--fdur': '0.5s', animationDelay: '0.05s' }}
            >
              <Burst darkMode={darkMode} />
              <Illustration3DStage type={illoType} darkMode={darkMode} />
            </div>
          </div>
        </div>

        <WaveBottom darkMode={darkMode} />
      </section>

      {showShowcase && <Showcase darkMode={darkMode} language={language} source={showcaseData} />}
    </>
  );
});

export default Hero;