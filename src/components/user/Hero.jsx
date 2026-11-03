import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSmartphone, FiTablet, FiMonitor, FiCpu, FiBattery, FiWatch, FiHeadphones, FiHardDrive, FiCamera, FiPrinter, FiTool,
} from 'react-icons/fi';
import enTranslations from '../../locales/en/translation.json';
import arTranslations from '../../locales/ar/translation.json';
import frTranslations from '../../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../../common/utils/useAppLanguage';
import api from '../../common/api/api';
import { resolveImageSrc } from '../../common/utils/productutils';

const HERO_TRANSLATIONS = { en: enTranslations.hero, ar: arTranslations.hero, fr: frTranslations.hero };
const NO_TRANSLATION = Object.freeze({});
const EMPTY = Object.freeze([]);
const getHeroTranslation = (language, variant) =>
  HERO_TRANSLATIONS[language]?.variants?.[variant] ?? NO_TRANSLATION;

const PAGE_DARK = '#141414';
const PAGE_LIGHT = '#f9fafb';
const HERO_H = 'min-h-[max(40rem,92svh)]';
const DELAY = Array.from({ length: 6 }, (_, i) => ({ '--d': i }));

const PRODUCTS_URL = '/api/products';
const productRoute = (id) => `/devices/${encodeURIComponent(id)}`;
const MAX_PRODUCTS = 8;
const AUTOPLAY_MS = 5000;
const CACHE_TTL = 300000;
const LOCALES = { en: 'en-US', ar: 'ar-EG', fr: 'fr-FR' };
const ACCENT = '#39ff88';
const GRID_STYLE = { '--hh': 'clamp(26rem, calc(100svh - 12rem), 37rem)' };

const MARKET_TEXT = {
  en: {
    fresh: 'New',
    bestSeller: 'Best seller',
    off: (p) => `${p}% off`,
    save: 'Save',
    goTo: 'Show product',
    shopsTitle: 'Find a trusted shop',
    shopsSub: 'Compare rated shops near you',
    shopsCta: 'Browse shops',
    repairTitle: 'Fix your device',
    repairSub: 'Book a technician in minutes',
    repairCta: 'Book a repair',
    trackTitle: 'Track your order',
    trackSub: 'See where your package is now',
    trackCta: 'Track order',
  },
  ar: {
    fresh: 'جديد',
    bestSeller: 'الأكثر مبيعًا',
    off: (p) => `خصم ${p}%`,
    save: 'وفّر',
    goTo: 'عرض المنتج',
    shopsTitle: 'اعثر على متجر موثوق',
    shopsSub: 'قارن المتاجر المقيّمة القريبة منك',
    shopsCta: 'تصفّح المتاجر',
    repairTitle: 'أصلح جهازك',
    repairSub: 'احجز فنيًا في دقائق',
    repairCta: 'احجز إصلاحًا',
    trackTitle: 'تتبّع طلبك',
    trackSub: 'اعرف مكان شحنتك الآن',
    trackCta: 'تتبّع الطلب',
  },
  fr: {
    fresh: 'Nouveau',
    bestSeller: 'Meilleure vente',
    off: (p) => `-${p}%`,
    save: 'Économisez',
    goTo: 'Voir le produit',
    shopsTitle: 'Trouvez une boutique de confiance',
    shopsSub: 'Comparez les boutiques notées près de vous',
    shopsCta: 'Voir les boutiques',
    repairTitle: 'Réparez votre appareil',
    repairSub: 'Réservez un technicien en quelques minutes',
    repairCta: 'Réserver une réparation',
    trackTitle: 'Suivez votre commande',
    trackSub: 'Voyez où est votre colis maintenant',
    trackCta: 'Suivre ma commande',
  },
};

const TILE_TONES = [
  { bg: 'linear-gradient(165deg,#a7f3d0 0%,#34d399 100%)', ink: 'text-emerald-950', soft: 'text-emerald-900/80', chip: 'bg-emerald-950/80 text-white' },
  { bg: 'linear-gradient(165deg,#052e1e 0%,#0b4a35 100%)', ink: 'text-white', soft: 'text-white/75', chip: 'bg-[#39ff88] text-emerald-950' },
  { bg: 'linear-gradient(165deg,#ccfbf1 0%,#2dd4bf 100%)', ink: 'text-teal-950', soft: 'text-teal-900/80', chip: 'bg-teal-950/80 text-white' },
  { bg: 'linear-gradient(165deg,#ecfccb 0%,#a3e635 100%)', ink: 'text-lime-950', soft: 'text-lime-900/80', chip: 'bg-lime-950/80 text-white' },
];

const HERO_STYLES = `
  .font-jakarta, .font-jakarta * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  .font-cairo, .font-cairo * { font-family: 'Cairo', system-ui, sans-serif; }

  .hp-hl-dark {
    padding-bottom: 0.2em;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E") left bottom / 100% 0.3em no-repeat;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .hp-hl { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2310b981' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .hp-hl {
    padding-bottom: 0.2em;
    background-position: left bottom;
    background-size: 100% 0.3em;
    background-repeat: no-repeat;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  [dir="rtl"] .hp-hl, [dir="rtl"] .hp-hl-dark { background-position: right bottom; }

  .hr-wall { contain: layout paint; }
  @keyframes hrDrift { from { transform: translate3d(0, 0, 0); } to { transform: translate3d(0, -7%, 0); } }
  .hr-drift { animation: hrDrift 48s linear infinite alternate; will-change: transform; }
  @keyframes hrIn { from { opacity: 0; transform: translate3d(0, 18px, 0); } to { opacity: 1; transform: none; } }
  .hr-in { animation: hrIn .6s cubic-bezier(.16,1,.3,1) both; animation-delay: calc(var(--d, 0) * 70ms); }

  .hx-tile { contain: layout paint; transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s ease; }
  .hx-img { transition: transform .6s cubic-bezier(.16,1,.3,1); }
  @media (hover: hover) {
    .hx-tile:hover { transform: translate3d(0, -4px, 0); box-shadow: 0 18px 36px -16px rgba(0,0,0,.45); }
    .hx-tile:hover .hx-img { transform: scale(1.05); }
  }
  .hx-tile:focus-visible { outline: 3px solid ${ACCENT}; outline-offset: 3px; }

  .hx-scroll { scrollbar-width: none; overscroll-behavior-x: contain; }
  .hx-scroll::-webkit-scrollbar { display: none; }

  .hx-svc { transition: transform .2s cubic-bezier(.16,1,.3,1); }
  .hx-ill { transition: transform .35s cubic-bezier(.16,1,.3,1); transform-origin: 50% 60%; }
  @media (hover: hover) {
    .hx-svc:hover { transform: translate3d(0, -3px, 0); }
    .hx-svc:hover .hx-ill { transform: rotate(-3deg) scale(1.05); }
  }
  .hx-svc:active { transform: translate3d(0, 2px, 0); }

  @media (prefers-reduced-motion: reduce) {
    .hr-drift, .hr-in { animation: none; }
    .hx-tile, .hx-img, .hx-svc, .hx-ill { transition: none !important; }
    .hx-tile:hover, .hx-tile:hover .hx-img { transform: none; box-shadow: none; }
    .hx-svc:hover, .hx-svc:active, .hx-svc:hover .hx-ill { transform: none; }
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

const text = (v) => (typeof v === 'string' ? v.replace(/[\p{Cc}\p{Cf}]/gu, ' ').trim() : '');
const num = (v) => {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const ts = (v) => {
  const n = Date.parse(v);
  return Number.isFinite(n) ? n : 0;
};
const resolveSrc = (v) => {
  try { return resolveImageSrc(v) || v; } catch (e) { return v; }
};
const safeImg = (v) => {
  const s = text(v);
  if (!s || s.length > 2048 || s.includes('..')) return '';
  if (/^https?:\/\//i.test(s) || /^data:image\/(png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=]+$/i.test(s)) return s;
  return /^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('//') ? '' : resolveSrc(s);
};
const pickImage = (o) => {
  const first = Array.isArray(o.images) ? o.images[0] : undefined;
  return (
    safeImg(o.image) || safeImg(o.imageUrl) || safeImg(o.thumbnail) || safeImg(o.logo) ||
    safeImg(o.banner) || safeImg(typeof first === 'string' ? first : first?.url)
  );
};

const toProduct = (p) => {
  if (!p || typeof p !== 'object' || p.deleted) return null;
  const id = p.id ?? p._id;
  const name = text(p.name ?? p.title);
  if (id == null || !name) return null;
  const sale = num(p.finalPrice ?? p.discountPrice ?? p.salePrice ?? p.discountedPrice);
  const list = num(p.originalPrice ?? p.oldPrice ?? p.price);
  const price = sale > 0 && sale < list ? sale : num(p.price) || list;
  const oldPrice = list > price ? list : 0;
  return {
    id: String(id),
    name,
    image: pickImage(p),
    shop: text(p.shopName ?? p.shop?.name),
    price,
    oldPrice,
    saved: oldPrice ? oldPrice - price : 0,
    percent: oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0,
    created: ts(p.createdAt ?? p.created_at ?? p.createdDate),
  };
};

const normalizeProducts = (raw) => {
  if (!Array.isArray(raw)) return EMPTY;
  const list = [];
  for (const entry of raw) {
    const item = toProduct(entry);
    if (item) list.push(item);
  }
  if (list.some((v) => v.created)) list.sort((a, b) => b.created - a.created);
  return list.slice(0, MAX_PRODUCTS);
};

const toList = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return EMPTY;
  const inner = raw.data ?? raw.content ?? raw.items ?? raw.results ?? raw.products;
  if (Array.isArray(inner)) return inner;
  return inner && typeof inner === 'object' ? toList(inner) : EMPTY;
};

let productsCache = null;
const loadProducts = () => {
  if (productsCache && Date.now() - productsCache.at < CACHE_TTL) return productsCache.promise;
  const promise = api
    .get(PRODUCTS_URL)
    .then((res) => normalizeProducts(toList(res.data)))
    .catch(() => {
      productsCache = null;
      return EMPTY;
    });
  productsCache = { at: Date.now(), promise };
  return promise;
};

const useProducts = (source) => {
  const hasSource = Array.isArray(source);
  const [remote, setRemote] = useState(() => (hasSource ? null : undefined));

  useEffect(() => {
    if (hasSource) return undefined;
    let alive = true;
    loadProducts().then((list) => { if (alive) setRemote(list); });
    return () => { alive = false; };
  }, [hasSource]);

  const sourceItems = useMemo(() => (hasSource ? normalizeProducts(source) : EMPTY), [hasSource, source]);
  if (hasSource) return { products: sourceItems, loading: false };
  return { products: remote ?? EMPTY, loading: remote === undefined };
};

const formatters = {};
const getFormatters = (locale) => {
  if (formatters[locale]) return formatters[locale];
  let parts = (v) => ({ cur: '', amount: String(v) });
  try {
    const m = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EGP',
      currencyDisplay: locale.startsWith('ar') ? 'symbol' : 'code',
      maximumFractionDigits: 0,
    });
    parts = (v) => {
      let cur = '';
      let amount = '';
      for (const p of m.formatToParts(v)) {
        if (p.type === 'currency') cur += p.value;
        else if (p.type !== 'literal') amount += p.value;
      }
      return { cur, amount };
    };
  } catch (e) {
    parts = (v) => ({ cur: '', amount: String(v) });
  }
  formatters[locale] = { parts };
  return formatters[locale];
};

const WALL_TONES = [
  'bg-emerald-400 text-emerald-950',
  'bg-[#0b4a35] text-[#39ff88]',
  'bg-[#2a2a2a] text-white',
  'bg-amber-400 text-amber-950',
  'bg-sky-400 text-sky-950',
  'bg-violet-400 text-violet-950',
];
const WALL_ICONS = [FiSmartphone, FiTablet, FiMonitor, FiCpu, FiBattery, FiWatch, FiHeadphones, FiHardDrive, FiCamera, FiPrinter, FiTool];
const WALL_TILES = Array.from({ length: 36 }, (_, i) => ({
  key: i,
  Icon: WALL_ICONS[(i * 5 + Math.floor(i / 6)) % WALL_ICONS.length],
  tone: WALL_TONES[(i * 7 + Math.floor(i / 3)) % WALL_TONES.length],
}));

const WallTile = memo(({ Icon, tone }) => (
  <div className={`flex aspect-[2/3] items-center justify-center rounded-xl border-[3px] border-black [box-shadow:4px_4px_0_0_#000] ${tone}`}>
    <Icon className="h-1/3 w-1/3" strokeWidth={1.75} />
  </div>
));

const HeroWall = memo(() => (
  <div aria-hidden="true" className="hr-wall pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute -inset-x-[15%] -top-[10%] -bottom-[30%] -rotate-12">
      <div className="hr-drift grid h-full grid-cols-4 gap-4 opacity-60 sm:grid-cols-6 sm:gap-5 lg:grid-cols-9 [&>*:nth-child(n+25)]:hidden sm:[&>*:nth-child(n+25)]:block">
        {WALL_TILES.map((tile) => <WallTile key={tile.key} Icon={tile.Icon} tone={tile.tone} />)}
      </div>
    </div>
    <div className="absolute inset-0 bg-[#020f0a]/55" />
    <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,rgba(2,15,10,.25)_0%,rgba(2,15,10,.9)_78%)]" />
    <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#020f0a] to-transparent" />
    <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#020f0a] to-transparent" />
  </div>
));

const HeroCurve = memo(({ darkMode }) => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 overflow-hidden sm:h-32">
    <div
      className="absolute -inset-x-[15%] top-8 h-[30rem] rounded-[50%] border-t-[4px] border-[#39ff88] sm:top-12"
      style={{
        backgroundColor: darkMode ? PAGE_DARK : PAGE_LIGHT,
        boxShadow: '0 -14px 60px -6px rgba(57,255,136,.55), inset 0 14px 40px -20px rgba(57,255,136,.45)',
      }}
    />
  </div>
));

const renderRich = (value) =>
  String(value ?? '').split('**').map((part, i) => (i % 2 ? <span key={i} className="hp-hl-dark">{part}</span> : part));

const hideBroken = (e) => { e.currentTarget.style.visibility = 'hidden'; };

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

const HERO_BTN =
  'inline-flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-black px-6 py-3 text-base font-extrabold uppercase ' +
  '[box-shadow:calc(var(--dx)*5px)_5px_0_0_#000] transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  '[@media(hover:hover)]:hover:-translate-y-0.5 active:translate-y-[5px] active:translate-x-[calc(var(--dx)*5px)] active:[box-shadow:0_0_0_0_#000] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white';
const BTN_PRIMARY = `${HERO_BTN} bg-[#39ff88] text-emerald-950`;
const BTN_SECONDARY = `${HERO_BTN} bg-[#0b4a35] text-white`;

const Arrow = memo(() => (
  <svg
    className="h-5 w-5 shrink-0 transition-transform duration-150 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
));

const Placeholder = memo(({ className }) => (
  <svg className={`mx-auto h-full w-1/2 opacity-50 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="2.5" width="14" height="19" rx="3" />
    <path d="M10.5 18.5h3" />
  </svg>
));

const HeroButton = memo(({ btn, className }) => {
  const content = <>{btn.label}{btn.primary && <Arrow />}</>;
  const cls = `group ${className}`;
  if (btn.onClick) return <button type="button" onClick={btn.onClick} className={cls}>{content}</button>;
  if (btn.href) return <a href={btn.href} className={cls}>{content}</a>;
  return <Link to={btn.to} className={cls}>{content}</Link>;
});

const ProductTile = memo(({ item, tone, eager, label, t, parts, flat }) => {
  const { cur, amount } = item.price > 0 ? parts(item.price) : { cur: '', amount: '' };
  const savedText = item.saved > 0 ? parts(item.saved).amount : '';
  return (
    <Link
      to={productRoute(item.id)}
      draggable={false}
      style={{ background: tone.bg }}
      className={`group relative flex h-full w-full flex-col overflow-hidden p-3 outline-none sm:p-4 ${flat ? 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-[#39ff88]' : 'hx-tile rounded-3xl'}`}
    >
      <span className={`absolute end-5 top-5 z-10 rounded-md px-2 py-0.5 text-[11px] font-extrabold sm:end-6 sm:top-6 ${tone.chip}`}>{label}</span>
      <div className="min-h-0 flex-1">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-white p-3 shadow-lg shadow-black/15">
          {item.image ? (
            <img
              src={item.image}
              alt=""
              width={480}
              height={480}
              loading={eager ? 'eager' : 'lazy'}
              fetchPriority={eager ? 'high' : 'auto'}
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
              onError={hideBroken}
              className="hx-img h-full w-full object-contain [@media(hover:hover)]:group-hover:scale-105"
            />
          ) : (
            <Placeholder className="text-emerald-700" />
          )}
        </div>
      </div>
      <div className="mt-3 flex min-w-0 flex-col gap-1">
        <h3 className={`line-clamp-2 text-base font-black leading-snug [text-wrap:balance] sm:text-lg ${tone.ink}`}>{item.name}</h3>
        {item.shop && <p className={`truncate text-xs font-semibold sm:text-sm ${tone.soft}`}>{item.shop}</p>}
        {item.price > 0 && (
          <p className={`flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 ${tone.ink}`}>
            {cur && <span className="text-xs font-bold">{cur}</span>}
            <span className="text-lg font-extrabold tabular-nums sm:text-xl">{amount}</span>
            {item.oldPrice > 0 && <span className={`ms-1 text-xs tabular-nums line-through ${tone.soft}`}>{parts(item.oldPrice).amount}</span>}
            {savedText && <span className="ms-1 rounded-md bg-white/70 px-1.5 py-0.5 text-[11px] font-extrabold text-emerald-950">{t.save} {savedText}</span>}
          </p>
        )}
      </div>
    </Link>
  );
});

const Dot = memo(({ index, active, label, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(index)}
    aria-label={`${label} ${index + 1}`}
    aria-current={active ? 'true' : undefined}
    className="grid h-6 cursor-pointer place-items-center px-0.5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#39ff88]"
  >
    <span className={`block h-2.5 rounded-full border-2 border-black transition-[width,background-color] duration-200 motion-reduce:transition-none ${active ? 'w-6 bg-black' : 'w-2.5 bg-white'}`} />
  </button>
));

const HeroSkeleton = memo(({ darkMode }) => {
  const base = `animate-pulse rounded-3xl motion-reduce:animate-none ${darkMode ? 'bg-[#1c1c1e]' : 'bg-[#e5e7eb]'}`;
  return (
    <div aria-hidden="true" style={GRID_STYLE} className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className={`${base} h-[28rem] sm:h-[30rem] lg:h-[var(--hh)]`} />)}
    </div>
  );
});

const ShopIllustration = memo(({ className }) => (
  <svg className={`hx-ill pointer-events-none flex-none ${className}`} viewBox="0 0 160 140" fill="none" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" focusable="false">
    <rect x="28" y="56" width="104" height="70" rx="6" fill="#fff" stroke="#000" strokeWidth="3" />
    <rect x="52" y="6" width="56" height="18" rx="5" fill="#39ff88" stroke="#000" strokeWidth="3" />
    <path d="M62 15h36" stroke="#000" strokeWidth="3" />
    <rect x="22" y="30" width="29" height="26" fill="#fbbf24" stroke="#000" strokeWidth="3" />
    <rect x="51" y="30" width="29" height="26" fill="#fff" stroke="#000" strokeWidth="3" />
    <rect x="80" y="30" width="29" height="26" fill="#fbbf24" stroke="#000" strokeWidth="3" />
    <rect x="109" y="30" width="29" height="26" fill="#fff" stroke="#000" strokeWidth="3" />
    <rect x="36" y="70" width="18" height="24" rx="3" fill="#99f6e4" stroke="#000" strokeWidth="3" />
    <rect x="106" y="70" width="18" height="24" rx="3" fill="#99f6e4" stroke="#000" strokeWidth="3" />
    <rect x="62" y="84" width="36" height="42" rx="4" fill="#0b4a35" stroke="#000" strokeWidth="3" />
    <circle cx="90" cy="106" r="2.5" fill="#39ff88" />
    <path d="M140 10l3.5 8 8.5.5-6.5 5.5 2 9-7.5-5-7.5 5 2-9-6.5-5.5 8.5-.5z" fill="#fff" stroke="#000" strokeWidth="3" />
  </svg>
));

const RepairIllustration = memo(({ className }) => (
  <svg className={`hx-ill pointer-events-none flex-none ${className}`} viewBox="0 0 160 140" fill="none" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" focusable="false">
    <circle cx="30" cy="40" r="19" stroke="#39ff88" strokeWidth="5" strokeDasharray="6 5.2" />
    <circle cx="30" cy="40" r="13" fill="#39ff88" stroke="#000" strokeWidth="3" />
    <circle cx="30" cy="40" r="4.5" fill="#052e1e" />
    <rect x="46" y="14" width="60" height="108" rx="10" fill="#fff" stroke="#000" strokeWidth="3" />
    <rect x="53" y="28" width="46" height="78" rx="4" fill="#0b4a35" />
    <rect x="68" y="19" width="16" height="3" rx="1.5" fill="#000" />
    <path d="M62 30l11 26-9 14 20 30" stroke="#39ff88" strokeWidth="3" />
    <path d="M120 112l16-50" stroke="#000" strokeWidth="15" />
    <path d="M120 112l16-50" stroke="#fbbf24" strokeWidth="9" />
    <circle cx="138" cy="56" r="12" fill="#fbbf24" stroke="#000" strokeWidth="3" />
    <circle cx="138" cy="52" r="4.5" fill="#052e1e" />
    <path d="M22 104v14M15 111h14M128 14v10M123 19h10" stroke="#39ff88" strokeWidth="3" />
  </svg>
));

const TrackIllustration = memo(({ className }) => (
  <svg className={`hx-ill pointer-events-none flex-none ${className}`} viewBox="0 0 160 140" fill="none" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" focusable="false">
    <rect x="14" y="28" width="132" height="98" rx="10" fill="#fff" stroke="#000" strokeWidth="3" />
    <path d="M14 60h132M14 92h132M56 28v98M102 28v98" stroke="#e5e7eb" strokeWidth="3" />
    <path d="M30 108C46 58 84 126 124 68" stroke="#0b4a35" strokeWidth="4" strokeDasharray="1 9" />
    <circle cx="30" cy="108" r="7" fill="#fbbf24" stroke="#000" strokeWidth="3" />
    <rect x="62" y="74" width="32" height="28" rx="3" fill="#fbbf24" stroke="#000" strokeWidth="3" />
    <path d="M78 74v28M62 86h32" stroke="#000" strokeWidth="3" />
    <path d="M126 10a16 16 0 0 1 16 16c0 14-16 40-16 40S110 40 110 26a16 16 0 0 1 16-16z" fill="#10b981" stroke="#000" strokeWidth="3" />
    <circle cx="126" cy="26" r="5.5" fill="#fff" stroke="#000" strokeWidth="3" />
  </svg>
));

const PATTERN_DOTS = {
  backgroundColor: '#34d399',
  backgroundImage: 'radial-gradient(rgba(2,46,30,.25) 2px, transparent 2.5px)',
  backgroundSize: '18px 18px',
};
const PATTERN_GRID = {
  backgroundColor: '#052e1e',
  backgroundImage: 'linear-gradient(rgba(57,255,136,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,136,.16) 1px, transparent 1px)',
  backgroundSize: '22px 22px',
};
const PATTERN_STRIPES = {
  backgroundColor: '#a3e635',
  backgroundImage: 'repeating-linear-gradient(135deg, rgba(26,46,5,.14) 0 2px, transparent 2px 14px)',
};

const SERVICES = [
  {
    key: 'shops', to: '/shops', style: PATTERN_DOTS, Art: ShopIllustration,
    ink: 'text-emerald-950', soft: 'text-emerald-950/80', chip: 'bg-emerald-950 text-white',
    title: 'shopsTitle', sub: 'shopsSub', cta: 'shopsCta',
  },
  {
    key: 'repair', to: '/repair', style: PATTERN_GRID, Art: RepairIllustration,
    ink: 'text-white', soft: 'text-white/75', chip: 'bg-[#39ff88] text-emerald-950',
    title: 'repairTitle', sub: 'repairSub', cta: 'repairCta',
  },
  {
    key: 'track', to: '/track', style: PATTERN_STRIPES, Art: TrackIllustration,
    ink: 'text-lime-950', soft: 'text-lime-950/80', chip: 'bg-lime-950 text-white',
    title: 'trackTitle', sub: 'trackSub', cta: 'trackCta',
  },
];

const SVC_LAYOUT = {
  card: 'flex-col items-start justify-between p-5 sm:p-6',
  art: 'mt-3 h-28 w-28 self-end sm:h-32 sm:w-32 lg:h-36 lg:w-36',
  title: 'text-2xl',
  sub: 'sm:text-base',
  cta: 'mt-3 px-4 py-2 text-sm',
};

const ServiceCard = memo(({ svc, t }) => {
  const { Art } = svc;
  const L = SVC_LAYOUT;
  return (
    <Link
      to={svc.to}
      draggable={false}
      style={svc.style}
      className={`hx-svc group relative flex h-full w-full overflow-hidden rounded-3xl border-[3px] border-black outline-none [box-shadow:calc(var(--dx)*6px)_6px_0_0_#000] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[#39ff88] ${L.card}`}
    >
      <div className="relative z-10 flex min-w-0 flex-col gap-1">
        <h3 className={`font-black leading-tight [text-wrap:balance] ${L.title} ${svc.ink}`}>{t[svc.title]}</h3>
        <p className={`text-xs font-semibold leading-snug [text-wrap:pretty] sm:text-sm ${L.sub} ${svc.soft}`}>{t[svc.sub]}</p>
        <span className={`inline-flex w-fit items-center gap-2 rounded-xl border-[3px] border-black font-extrabold ${L.cta} ${svc.chip}`}>
          {t[svc.cta]}
          <Arrow />
        </span>
      </div>
      <Art className={L.art} />
    </Link>
  );
});

const MarketHero = memo(({ darkMode = false, showcaseData }) => {
  const language = useAppLanguage();
  const isAr = language === 'ar';
  const dir = languageDirection(language);
  const t = MARKET_TEXT[language] ?? MARKET_TEXT.en;
  const { parts } = getFormatters(LOCALES[language] ?? LOCALES.en);
  const { products, loading } = useProducts(showcaseData?.products);
  const trackRef = useRef(null);
  const frameRef = useRef(0);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = products.length;

  useEffect(() => { ensureFont(isAr ? 'cairo' : 'jakarta'); }, [isAr]);

  const onScroll = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      const el = trackRef.current;
      if (!el || !el.clientWidth) return;
      setActive(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
    });
  }, []);

  useEffect(() => () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); }, []);

  const goTo = useCallback((i) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: (isAr ? -1 : 1) * i * el.clientWidth, behavior: 'smooth' });
  }, [isAr]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  useEffect(() => {
    if (total < 2 || paused) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setTimeout(() => goTo((active + 1) % total), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [active, total, paused, goTo]);

  const hasSlider = total > 0;

  return (
    <section
      dir={dir}
      className={`relative isolate overflow-hidden [--dx:1] rtl:[--dx:-1] ${isAr ? 'font-cairo' : 'font-jakarta'}`}
      style={{ backgroundColor: darkMode ? PAGE_DARK : PAGE_LIGHT }}
    >
      <div className="hr-in mx-auto w-full max-w-[120rem] px-3 pb-8 pt-36 sm:px-5 sm:pt-32" style={DELAY[0]}>
        {loading ? (
          <HeroSkeleton darkMode={darkMode} />
        ) : (
          <div
            style={GRID_STYLE}
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 ${hasSlider ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
          >
            {hasSlider && (
              <div
                style={DELAY[0]}
                className="hr-in relative h-[28rem] overflow-hidden rounded-3xl border-[3px] border-black [box-shadow:calc(var(--dx)*6px)_6px_0_0_#000] sm:h-[30rem] lg:h-[var(--hh)]"
                role="region"
                aria-roledescription="carousel"
                onTouchStart={pause}
                onTouchEnd={resume}
                onTouchCancel={resume}
              >
                <div
                  ref={trackRef}
                  onScroll={onScroll}
                  className="hx-scroll flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
                >
                  {products.map((item, i) => (
                    <div key={item.id} className="h-full w-full flex-none snap-center">
                      <ProductTile
                        flat
                        item={item}
                        tone={TILE_TONES[i % TILE_TONES.length]}
                        eager={i === 0}
                        label={item.percent > 0 ? t.off(item.percent) : i === 0 ? t.bestSeller : t.fresh}
                        t={t}
                        parts={parts}
                      />
                    </div>
                  ))}
                </div>
                {total > 1 && (
                  <>
                    <div className="absolute start-4 top-4 z-20 flex items-center sm:start-5 sm:top-5">
                      {products.map((item, i) => (
                        <Dot key={item.id} index={i} active={i === active} label={t.goTo} onSelect={goTo} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {SERVICES.map((svc, i) => (
              <div key={svc.key} style={DELAY[i + 1]} className="hr-in h-[28rem] sm:h-[30rem] lg:h-[var(--hh)]">
                <ServiceCard svc={svc} t={t} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

const ClassicHero = memo(({ variant = 'home', darkMode = false, badge, headingLine1, headingAccent, headingLine2, description, buttons, children }) => {
  const language = useAppLanguage();
  const isAr = language === 'ar';

  useEffect(() => { ensureFont(isAr ? 'cairo' : 'jakarta'); }, [isAr]);

  const cfg = VARIANT_DEFAULTS[variant] ?? VARIANT_DEFAULTS.home;
  const translated = getHeroTranslation(language, variant);

  const resolvedLine1 = headingLine1 ?? translated[1] ?? cfg.headingLine1;
  const resolvedAccent = headingAccent ?? translated[2] ?? cfg.headingAccent;
  const resolvedLine2 = headingLine2 ?? translated[3] ?? cfg.headingLine2;
  const resolvedDesc = description ?? translated[4] ?? cfg.description;

  const richDesc = useMemo(() => renderRich(resolvedDesc), [resolvedDesc]);

  const resolvedButtons = useMemo(
    () => buttons ?? cfg.buttons.map((button, index) => ({ ...button, label: translated[index === 0 ? 5 : 6] || button.label })),
    [buttons, cfg, translated]
  );

  return (
    <section
      dir={languageDirection(language)}
      className={`relative isolate overflow-hidden bg-[#020f0a] text-white [--dx:1] rtl:[--dx:-1] ${HERO_H} ${isAr ? 'font-cairo' : 'font-jakarta'}`}
    >
      <HeroWall />

      <div className={`relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center px-4 pb-44 pt-40 text-center sm:px-6 sm:pb-52 ${HERO_H}`}>
        {badge && (
          <span
            className="hr-in inline-flex items-center gap-1.5 rounded-lg border-[3px] border-black bg-[#39ff88] px-3 py-1 text-xs font-black uppercase text-emerald-950 [box-shadow:3px_3px_0_0_#000] rtl:[box-shadow:-3px_3px_0_0_#000]"
            style={DELAY[0]}
          >
            <FiTool aria-hidden="true" className="h-3.5 w-3.5" />
            <span>{badge}</span>
          </span>
        )}

        <h1
          className={`hr-in mt-6 break-words text-4xl font-black [text-wrap:balance] sm:text-6xl lg:text-7xl ${
            isAr ? 'leading-[1.35] tracking-normal' : 'leading-[1.06] tracking-[-0.035em]'
          }`}
          style={DELAY[1]}
        >
          {resolvedLine1 && <>{resolvedLine1}{' '}</>}
          <span className="hp-hl-dark">{resolvedAccent}</span>
          {resolvedLine2 && <>{' '}{resolvedLine2}</>}
        </h1>

        <p className="hr-in mt-6 max-w-2xl text-lg font-medium leading-relaxed text-white/85 [text-wrap:pretty] sm:text-xl" style={DELAY[2]}>
          {richDesc}
        </p>

        {children && (
          <div className="hr-in mt-8 flex w-full justify-center" style={DELAY[3]}>
            {children}
          </div>
        )}

        {resolvedButtons && resolvedButtons.length > 0 && (
          <div className="hr-in mt-8 flex flex-wrap justify-center gap-4 pb-1 pe-1" style={DELAY[4]}>
            {resolvedButtons.map((btn) => (
              <HeroButton key={btn.label} btn={btn} className={btn.primary ? BTN_PRIMARY : BTN_SECONDARY} />
            ))}
          </div>
        )}
      </div>

      <HeroCurve darkMode={darkMode} />
    </section>
  );
});

const Hero = memo((props) => {
  const { variant = 'home', layout } = props;
  const market = (layout ?? (variant === 'home' ? 'market' : 'classic')) === 'market';
  return market ? <MarketHero {...props} /> : <ClassicHero {...props} />;
});

export default Hero;