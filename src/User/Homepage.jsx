import React, {
  useState, useRef, useEffect, useCallback, memo, useMemo, useId, Suspense, lazy,
} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiArrowRight, FiChevronLeft, FiChevronRight, FiMapPin, FiPhone,
  FiPlus, FiCheck, FiArrowUp, FiAlertCircle, FiPackage, FiTool,
} from 'react-icons/fi';
import { RiStarFill, RiCookieLine } from 'react-icons/ri';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import '../common/styles/style.css';
import api from '../common/api/api';
import { resolveImageSrc } from '../common/utils/productutils';
import queryClient from '../common/utils/queryClient';
import useAuthStore from '../common/store/Auth';
import { recoverGoogleSession } from '../common/utils/googleSession';
import { redirectFor } from '../common/utils/authSession';
import { Hero } from '../components';
import {
  Defs3D, Device3DStyles, DeviceScene, Btn3D, useOnScreen, money,
} from '../components/user/Device3D';
import {
  safeImageUrl, StorefrontIllustration, loadSwal, clean, useBackToTop, kindOfCategory,
} from '../components/user/ListingKit';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import { IsoIllustration, isoCatKey } from '../components/user/IsoIllustrations';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

const loadService = () => import('./Service');
const loadComponents = () => import('../components');
const Service = lazy(loadService);
const OffersSlider = lazy(() => loadComponents().then((m) => ({ default: m.OffersSlider })));

const HOMEPAGE_TRANSLATIONS = {
  en: enTranslations.homepage,
  ar: arTranslations.homepage || arTranslations.hero?.homepage,
  fr: frTranslations.homepage || frTranslations.hero?.homepage,
};

const LOCAL_TEXT = {
  en: {
    noAddress: 'No address',
    youSave: 'Save {{value}}', originalPrice: 'Original price', discountedPrice: 'Price after discount', discountValue: 'Discount',
    onlyLeft: 'Only {{count}} left in stock',
    homeCategoriesLabel: 'Categories', homeCategoriesTitle: 'Shop by category', homeCategoriesSub: 'Pick a category to see every device in it',
    homeCategoryCta: 'View devices', homeItemSingular: 'item', homeItemPlural: 'items',
    topRatedLabel: 'Top rated', topRatedTitle: 'Our top rated shops', topRatedSub: 'The shops customers rate highest, ranked by rating',
    reviewsCount: '{{count}} reviews', outOf: '/ 5', rankLabel: 'Rank {{n}}',
    statOrders: 'Orders', statRepairs: 'Repairs', viewAllShops: 'View all shops',
  },
  ar: {
    noAddress: 'لا يوجد عنوان',
    youSave: 'وفّر {{value}}', originalPrice: 'السعر الأصلي', discountedPrice: 'السعر بعد الخصم', discountValue: 'الخصم',
    onlyLeft: 'متبقي {{count}} فقط في المخزون',
    homeCategoriesLabel: 'التصنيفات', homeCategoriesTitle: 'تسوّق حسب التصنيف', homeCategoriesSub: 'اختر تصنيفًا لعرض كل الأجهزة فيه',
    homeCategoryCta: 'عرض الأجهزة', homeItemSingular: 'منتج', homeItemPlural: 'منتجات',
    topRatedLabel: 'الأعلى تقييمًا', topRatedTitle: 'متاجرنا الأعلى تقييمًا', topRatedSub: 'المتاجر التي يقيّمها العملاء الأعلى، مرتبة حسب التقييم',
    reviewsCount: '{{count}} تقييم', outOf: '/ 5', rankLabel: 'المركز {{n}}',
    statOrders: 'الطلبات', statRepairs: 'الإصلاحات', viewAllShops: 'عرض كل المتاجر',
  },
  fr: {
    noAddress: 'Aucune adresse',
    youSave: 'Économisez {{value}}', originalPrice: "Prix d'origine", discountedPrice: 'Prix après remise', discountValue: 'Remise',
    onlyLeft: 'Plus que {{count}} en stock',
    homeCategoriesLabel: 'Catégories', homeCategoriesTitle: 'Acheter par catégorie', homeCategoriesSub: 'Choisissez une catégorie pour voir tous ses appareils',
    homeCategoryCta: 'Voir les appareils', homeItemSingular: 'article', homeItemPlural: 'articles',
    topRatedLabel: 'Mieux notées', topRatedTitle: 'Nos boutiques les mieux notées', topRatedSub: 'Les boutiques les plus appréciées, classées par note',
    reviewsCount: '{{count}} avis', outOf: '/ 5', rankLabel: 'Rang {{n}}',
    statOrders: 'Commandes', statRepairs: 'Réparations', viewAllShops: 'Voir toutes les boutiques',
  },
};

const tr = (language, key, vars) => {
  let s =
    HOMEPAGE_TRANSLATIONS[language]?.[key] ||
    LOCAL_TEXT[language]?.[key] ||
    HOMEPAGE_TRANSLATIONS.en?.[key] ||
    LOCAL_TEXT.en[key] ||
    key;
  if (vars) for (const k in vars) s = s.split(`{{${k}}}`).join(vars[k]);
  return s;
};

const COOKIE_TEXT = {
  en: {
    title: 'We value your privacy',
    text: 'We use cookies to keep the site working, remember your preferences and understand how it is used. You can accept all, reject the optional ones, or choose what to allow.',
    acceptAll: 'Accept all',
    rejectAll: 'Reject optional',
    customize: 'Customize',
    back: 'Back',
    save: 'Save choices',
    necessary: 'Necessary',
    necessaryDesc: 'Required for sign-in, your cart and security. Always on.',
    analytics: 'Analytics',
    analyticsDesc: 'Helps us understand how the site is used so we can improve it.',
    marketing: 'Marketing',
    marketingDesc: 'Used to show you offers and content that match your interests.',
  },
  ar: {
    title: 'خصوصيتك تهمنا',
    text: 'نستخدم ملفات تعريف الارتباط لتشغيل الموقع وتذكّر تفضيلاتك وفهم كيفية استخدامه. يمكنك قبول الكل أو رفض الاختيارية أو تحديد ما تسمح به.',
    acceptAll: 'قبول الكل',
    rejectAll: 'رفض الاختيارية',
    customize: 'تخصيص',
    back: 'رجوع',
    save: 'حفظ الاختيارات',
    necessary: 'الضرورية',
    necessaryDesc: 'مطلوبة لتسجيل الدخول والسلة والأمان. مفعّلة دائمًا.',
    analytics: 'التحليلات',
    analyticsDesc: 'تساعدنا على فهم استخدام الموقع لتحسينه.',
    marketing: 'التسويق',
    marketingDesc: 'تُستخدم لعرض عروض ومحتوى يناسب اهتماماتك.',
  },
  fr: {
    title: 'Votre vie privée compte',
    text: "Nous utilisons des cookies pour faire fonctionner le site, mémoriser vos préférences et comprendre son utilisation. Vous pouvez tout accepter, refuser les cookies facultatifs ou choisir.",
    acceptAll: 'Tout accepter',
    rejectAll: 'Refuser les facultatifs',
    customize: 'Personnaliser',
    back: 'Retour',
    save: 'Enregistrer mes choix',
    necessary: 'Nécessaires',
    necessaryDesc: 'Indispensables à la connexion, au panier et à la sécurité. Toujours actifs.',
    analytics: 'Statistiques',
    analyticsDesc: "Nous aident à comprendre l'utilisation du site pour l'améliorer.",
    marketing: 'Marketing',
    marketingDesc: 'Servent à vous proposer des offres et contenus adaptés à vos intérêts.',
  },
};

const ctr = (language, key) => COOKIE_TEXT[language]?.[key] || COOKIE_TEXT.en[key] || key;

const CONSENT_KEY = 'cookieConsent';
const CONSENT_VERSION = 1;
const CONSENT_DELAY_MS = 1200;
const CONSENT_MAX_AGE = 60 * 60 * 24 * 730;

const parseConsent = (raw) => {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && v.v === CONSENT_VERSION && v.prefs ? v : null;
  } catch {
    return null;
  }
};

const readConsentCookie = () => {
  try {
    const prefix = `${CONSENT_KEY}=`;
    const hit = document.cookie.split('; ').find((c) => c.startsWith(prefix));
    return hit ? parseConsent(decodeURIComponent(hit.slice(prefix.length))) : null;
  } catch {
    return null;
  }
};

const readConsentStore = (key) => {
  try { return parseConsent(window.localStorage.getItem(key)); } catch { return null; }
};

const persistConsent = (record) => {
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${CONSENT_KEY}=${encodeURIComponent(JSON.stringify(record))}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  } catch { }
  try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify(record)); } catch { }
};

let consentCache = null;

const readConsent = (identity) => {
  if (consentCache) return consentCache;
  const found =
    readConsentCookie() ||
    readConsentStore(CONSENT_KEY) ||
    (identity ? readConsentStore(`${CONSENT_KEY}:${identity}`) : null);
  if (found) {
    consentCache = found;
    persistConsent(found);
  }
  return found;
};

const writeConsent = (prefs) => {
  const record = {
    v: CONSENT_VERSION,
    prefs: { necessary: true, analytics: !!prefs.analytics, marketing: !!prefs.marketing },
    at: Date.now(),
  };
  consentCache = record;
  persistConsent(record);
  try { window.dispatchEvent(new CustomEvent('cookie:consent', { detail: record })); } catch { }
  return record;
};

export const getCookieConsent = () => {
  if (typeof window === 'undefined') return null;
  const { accessToken, userId, email } = useAuthStore.getState();
  return accessToken ? readConsent(userId ?? email ?? 'user') : null;
};

const NUMBER_LOCALE = { en: 'en', fr: 'fr', ar: 'ar-EG' };
const padFormats = {};
const pad2 = (language, n) => {
  const locale = NUMBER_LOCALE[language] || 'en';
  const fmt = (padFormats[locale] ||= new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }));
  return fmt.format(n);
};

const phoneHref = (phone) => {
  const digits = String(phone || '').replace(/[^\d+]/g, '').slice(0, 20);
  return digits ? `tel:${digits}` : undefined;
};

const SNIPPET_MAX = 90;
const snippet = (text, max = SNIPPET_MAX) => {
  const s = String(text ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const i = cut.lastIndexOf(' ');
  return `${cut.slice(0, i > max * 0.6 ? i : max).trimEnd()}…`;
};

const fold = (s) =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, '')
    .toLowerCase();

const safeId = (id) => {
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  const s = String(id);
  return s && s.length <= 128 ? encodeURIComponent(s) : null;
};

const RAIL_LIMIT = 8;
const CATEGORY_LIMIT = 6;
const LOW_STOCK_LIMIT = 5;
const TOP_LIMIT = 4;
const LATEST_SHOPS_LIMIT = 8;
const SHOPS_FETCH_SIZE = 100;
const STATS_STALE = 5 * 60 * 1000;
const EMPTY_LIST = [];
const EMPTY_OBJECT = {};
const STAGGER = Array.from({ length: LATEST_SHOPS_LIMIT }, (_, i) => ({ '--i': i }));
const COUNT_FORMAT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const round2 = (n) => Math.round(n * 100) / 100;

const STATS_SOURCES = {
  orders: ['/api/users/orders'],
  repairs: ['/api/users/repair-request'],
};
const STATS_DONE = { orders: 'DELIVERED', repairs: 'DEVICE_DELIVERED' };
const STATS_PAGE_SIZE = 1000;

const SHOP_ROW =
  'hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pe-2 pt-1 ' +
  'sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-2 sm:pt-0 lg:grid-cols-4 lg:gap-5';
const SHOP_ITEM = 'w-[85%] min-w-0 flex-shrink-0 snap-start sm:w-auto';

const toCount = (v) => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

const computeFinal = (price, type, value) => {
  if (!(price > 0) || !(value > 0) || !type) return price;
  if (type === 'PERCENTAGE') return value < 100 ? round2(price - (price * value) / 100) : price;
  return value < price ? round2(price - value) : price;
};

const normalizeProduct = (p) => {
  const price = Math.max(0, Number(p.price) || 0);
  const legacy = Math.min(Math.max(Number(p.discount) || 0, 0), 100);
  const apiFinal = Number(p.finalPrice);
  const discountValue = Number(p.discountValue) || 0;
  const apiType = p.discountType || null;
  let finalPrice = price;
  if (apiFinal > 0 && apiFinal < price) finalPrice = apiFinal;
  else if (discountValue > 0 && apiType) finalPrice = computeFinal(price, apiType, discountValue);
  else if (legacy) finalPrice = round2(price * (1 - legacy / 100));
  const saving = round2(Math.max(0, price - finalPrice));
  const rating = Number(p.rating ?? p.averageRating) || 0;
  const reviews = Number(p.reviewCount ?? p.ratingCount ?? p.reviewsCount) || 0;
  return {
    ...p,
    price,
    finalPrice,
    saving,
    rating,
    reviews,
    discount: price > 0 ? (saving / price) * 100 : 0,
    discountType: saving > 0 ? (apiType || 'PERCENTAGE') : null,
    discountValue: saving > 0 && discountValue > 0 ? discountValue : 0,
    imageUrl: safeImageUrl(p.imageUrl),
    _ts: Date.parse(p.createdAt || p.created_at) || 0,
    _text: fold(`${p.name || ''} ${p.description || ''}`),
  };
};

const latestOf = (catalog) => {
  const timed = catalog.some((p) => p._ts > 0);
  const ordered = timed ? [...catalog].sort((a, b) => b._ts - a._ts) : [...catalog].reverse();
  return ordered.slice(0, RAIL_LIMIT);
};

const latestShopsOf = (shops) => {
  const timed = shops.some((s) => s._ts > 0);
  const ordered = timed ? [...shops].sort((a, b) => b._ts - a._ts) : [...shops].reverse();
  return ordered.slice(0, LATEST_SHOPS_LIMIT);
};

const topShopsOf = (shops) =>
  shops
    .filter((s) => s.rating > 0)
    .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
    .slice(0, TOP_LIMIT);

const LOGO_DIR = '/uploads/shop-logos/';
const ABSOLUTE_SRC = /^(https?:)?\/\/|^data:image\/|^blob:/i;
const shopLogoSrc = (s) => {
  const found = [s?.logoUrl, s?.logo, s?.logoPath, s?.shopLogo].find((v) => typeof v === 'string' && v.trim());
  const raw = found ? found.trim() : '';
  if (!raw || raw.includes('..')) return null;
  if (ABSOLUTE_SRC.test(raw)) return raw;
  const path = raw.includes('/') ? (raw.startsWith('/') ? raw : `/${raw}`) : `${LOGO_DIR}${encodeURIComponent(raw)}`;
  return resolveImageSrc(path) || path;
};

const normalizeShop = (s) => ({
  ...s,
  services: s.services || [],
  rating: Number(s.rating ?? s.averageRating) || 0,
  reviews: Number(s.reviewCount ?? s.ratingCount ?? s.reviewsCount) || 0,
  _logo: shopLogoSrc(s),
  _ts: Date.parse(s.createdAt || s.created_at) || 0,
  _orders: toCount(s.completedOrders ?? s.completedOrdersCount ?? s.ordersCompleted),
  _repairs: toCount(s.completedRepairs ?? s.completedRepairsCount ?? s.repairsCompleted),
  _snippet: snippet(s.description),
  _address: [s.shopAddress?.street, s.shopAddress?.city].filter((x) => typeof x === 'string' && x.trim()).join(', '),
});

const nameKey = (v) => `n:${fold(v).trim()}`;

const shopKeysOf = (entity) => {
  const keys = new Set();
  const add = (id, name) => {
    if (id != null && id !== '') keys.add(`i:${id}`);
    else if (typeof name === 'string' && name.trim()) keys.add(nameKey(name));
  };
  add(entity.shopId ?? entity.shop?.id, entity.shopName ?? entity.shop?.name);
  if (Array.isArray(entity.orderItems)) {
    for (const it of entity.orderItems) add(it?.shopId ?? it?.shop?.id, it?.shopName ?? it?.shop?.name);
  }
  return keys;
};

const tally = (list, doneStatus) => {
  if (!Array.isArray(list)) return null;
  const map = {};
  for (const x of list) {
    if (!x || String(x.status || '').toUpperCase() !== doneStatus) continue;
    for (const k of shopKeysOf(x)) map[k] = (map[k] || 0) + 1;
  }
  return map;
};

const fetchList = async (paths, signal) => {
  for (const path of paths) {
    try {
      const res = await api.get(path, { params: { page: 0, size: STATS_PAGE_SIZE }, signal });
      const raw = res.data?.content ?? res.data;
      if (Array.isArray(raw)) return raw;
    } catch (e) {
      if (signal?.aborted) throw e;
    }
  }
  return null;
};

const fetchShopStats = async (signal) => {
  const [orders, repairs] = await Promise.all([
    fetchList(STATS_SOURCES.orders, signal),
    fetchList(STATS_SOURCES.repairs, signal),
  ]);
  return {
    orders: tally(orders, STATS_DONE.orders),
    repairs: tally(repairs, STATS_DONE.repairs),
  };
};

let sharedIO;
const seenCallbacks = new WeakMap();
const observeOnce = (el, cb) => {
  if (typeof IntersectionObserver === 'undefined') { cb(); return undefined; }
  sharedIO ||= new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const fn = seenCallbacks.get(e.target);
      sharedIO.unobserve(e.target);
      seenCallbacks.delete(e.target);
      fn?.();
    });
  }, { rootMargin: '200px' });
  seenCallbacks.set(el, cb);
  sharedIO.observe(el);
  return () => { sharedIO.unobserve(el); seenCallbacks.delete(el); };
};

const useSeen = () => {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen || !ref.current) return undefined;
    return observeOnce(ref.current, () => setSeen(true));
  }, [seen]);
  return [ref, seen];
};

const useShopLogo = (shop) => {
  const [ref, seen] = useSeen();
  const id = shop.id;
  const listLogo = shop._logo;
  const q = useQuery({
    queryKey: ['shop', id],
    queryFn: async ({ signal }) => {
      try {
        return (await api.get(`/api/shops/${encodeURIComponent(id)}`, { signal })).data;
      } catch (e) {
        if (signal?.aborted) throw e;
        return null;
      }
    },
    select: shopLogoSrc,
    enabled: seen && !listLogo && id != null,
    staleTime: STATS_STALE,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  return [ref, listLogo || q.data || null];
};

const LAZY_SECTION = '[content-visibility:auto] [contain-intrinsic-size:auto_760px]';

const DARK_PAGE = 'bg-[#141414]';

const HP_CSS = `
  .hp-hl, .hp-hl-dark, .hp-hl-gold, .hp-hl-gold-dark {
    padding-bottom: 0.2em;
    background-position: left bottom;
    background-repeat: no-repeat;
    background-size: 100% 0.3em;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .hp-hl      { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2310b981' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .hp-hl-dark { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .hp-hl-gold { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%23f59e0b' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .hp-hl-gold-dark { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%23facc15' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  @keyframes hpConsentIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  .hp-consent-in { animation: hpConsentIn 0.22s cubic-bezier(.2,.8,.2,1) both; }
  @keyframes hpRise { from { opacity: 0; transform: translateY(22px) scale(.97); } to { opacity: 1; transform: none; } }
  .hp-rise { animation: hpRise 0.42s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i, 0) * 35ms); }
  .hp-glow {
    background-image:
      radial-gradient(circle at 6% 0%, rgba(52, 211, 153, .2), transparent 38%),
      radial-gradient(circle at 96% 100%, rgba(249, 115, 22, .1), transparent 36%);
  }
  .hp-glow-dark {
    background-image:
      radial-gradient(circle at 6% 0%, rgba(57, 255, 136, .09), transparent 38%),
      radial-gradient(circle at 96% 100%, rgba(249, 115, 22, .07), transparent 36%);
  }
  .hp-pattern {
    --p1: rgba(4, 38, 26, .13);
    --p2: rgba(16, 185, 129, .12);
    background-image:
      radial-gradient(circle at 2px 2px, var(--p1) 1.6px, transparent 1.8px),
      repeating-linear-gradient(135deg, var(--p2) 0 2px, transparent 2px 18px);
    background-size: 22px 22px, auto;
  }
  .hp-pattern-dark { --p1: rgba(57, 255, 136, .14); --p2: rgba(57, 255, 136, .06); }
  .hp-media {
    --m-dot: rgba(4, 38, 26, .14);
    background-image: radial-gradient(circle at 1px 1px, var(--m-dot) 1px, transparent 1.4px);
    background-size: 14px 14px;
  }
  .hp-media-dark { --m-dot: rgba(57, 255, 136, .16); }
  .hp-cat { --dx: 1; --c-card: #ffffff; --c-ink: #04261a; --c-line: #04261a; --c-acc: #10b981; --c-on: #04261a; }
  [dir="rtl"] .hp-cat { --dx: -1; }
  .hp-cat-dark { --c-card: #2a2a2a; --c-ink: #ffffff; --c-line: #000000; --c-acc: #39ff88; --c-on: #022c22; }
  .hp-dot {
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
    background: var(--c-card); color: var(--c-ink); cursor: pointer;
    border: 3px solid var(--c-line); border-radius: 1rem;
    box-shadow: calc(var(--dx) * 5px) 5px 0 0 var(--c-line);
    transition: transform .2s ease, box-shadow .2s ease, background-color .2s ease, color .2s ease;
  }
  @media (hover: hover) {
    .hp-dot:hover {
      background: var(--c-acc); color: var(--c-on);
      transform: translateY(-4px);
      box-shadow: calc(var(--dx) * 7px) 9px 0 0 var(--c-line);
    }
  }
  .hp-dot:active { transform: translateY(2px); box-shadow: calc(var(--dx) * 2px) 2px 0 0 var(--c-line); }
  .hp-dot:focus-visible { outline: 3px solid var(--c-acc); outline-offset: 4px; }
  html[data-hp-theme] { --sb-thumb: #34d399; --sb-thumb-hover: #6ee7b7; --sb-track: #e8ebe9; --sb-ink: #022c22; }
  html[data-hp-theme="dark"] { --sb-thumb: #39ff88; --sb-thumb-hover: #86ffb4; --sb-track: #1e1e1e; --sb-ink: #000000; }
  html[data-hp-theme], .hp-sb { scrollbar-width: thin; scrollbar-color: var(--sb-thumb) var(--sb-track); }
  @supports selector(::-webkit-scrollbar) {
    html[data-hp-theme], .hp-sb { scrollbar-width: auto; scrollbar-color: auto; }
    html[data-hp-theme]::-webkit-scrollbar { width: 14px; height: 14px; }
    .hp-sb::-webkit-scrollbar { width: 10px; height: 10px; }
    html[data-hp-theme]::-webkit-scrollbar-track, .hp-sb::-webkit-scrollbar-track { background: var(--sb-track); }
    html[data-hp-theme]::-webkit-scrollbar-track:vertical, .hp-sb::-webkit-scrollbar-track:vertical { border-left: 3px solid var(--sb-ink); }
    html[data-hp-theme]::-webkit-scrollbar-track:horizontal, .hp-sb::-webkit-scrollbar-track:horizontal { border-top: 3px solid var(--sb-ink); }
    html[data-hp-theme]::-webkit-scrollbar-thumb, .hp-sb::-webkit-scrollbar-thumb { background: var(--sb-thumb); border: 3px solid var(--sb-ink); }
    html[data-hp-theme]::-webkit-scrollbar-thumb:hover, .hp-sb::-webkit-scrollbar-thumb:hover { background: var(--sb-thumb-hover); }
    html[data-hp-theme]::-webkit-scrollbar-corner, .hp-sb::-webkit-scrollbar-corner { background: var(--sb-track); }
  }
  @media (prefers-reduced-motion: reduce) {
    .hp-consent-in, .hp-rise { animation: none; }
    .hp-dot { transition: none; }
    .hp-dot:hover, .hp-dot:active { transform: none; }
  }
`;
let hpStylesInjected = false;
const injectHpStylesOnce = () => {
  if (hpStylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-home-styles', 'true');
  tag.textContent = HP_CSS;
  document.head.appendChild(tag);
  hpStylesInjected = true;
};
injectHpStylesOnce();

const NEO_THEME = {
  light: '[--dx:1] rtl:[--dx:-1] [--ink:#022c22] [--sh:#022c22] [--acc:#34d399]',
  dark: '[--dx:1] rtl:[--dx:-1] [--ink:#000] [--sh:#000] [--acc:#39ff88]',
};
const NEO_SURFACE = { light: 'bg-white', dark: 'bg-[#2a2a2a]' };
const NEO_BOX = {
  lg: 'flex flex-col rounded-2xl border-[3px] border-[color:var(--ink)] [box-shadow:calc(var(--dx)*8px)_8px_0_0_var(--sh)]',
  sm: 'flex flex-col rounded-2xl border-[3px] border-[color:var(--ink)] [box-shadow:calc(var(--dx)*6px)_6px_0_0_var(--sh)]',
};
const NEO_PRESS =
  'transition-[transform,box-shadow] duration-200 motion-reduce:transition-none ' +
  '[@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:[box-shadow:calc(var(--dx)*8px)_10px_0_0_var(--sh)] ' +
  'active:translate-y-[2px] active:translate-x-[calc(var(--dx)*2px)] active:[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[color:var(--acc)]';
const neoCard = (darkMode, size = 'lg', press = false) => {
  const k = darkMode ? 'dark' : 'light';
  return `${NEO_THEME[k]} ${NEO_BOX[size]} ${NEO_SURFACE[k]}${press ? ` ${NEO_PRESS}` : ''}`;
};

const GOLD_THEME = {
  light: '[--dx:1] rtl:[--dx:-1] [--ink:#422006] [--sh:#422006] [--acc:#fbbf24]',
  dark: '[--dx:1] rtl:[--dx:-1] [--ink:#000] [--sh:#000] [--acc:#facc15]',
};
const GOLD_SURFACE = { light: 'bg-amber-50', dark: 'bg-[#2a2a2a]' };
const goldCard = (darkMode, press = false) => {
  const k = darkMode ? 'dark' : 'light';
  return `${GOLD_THEME[k]} ${NEO_BOX.sm} ${GOLD_SURFACE[k]}${press ? ` ${NEO_PRESS}` : ''}`;
};

const NEO_ICON =
  'inline-flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 ' +
  '[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 ' +
  'active:translate-y-[3px] active:translate-x-[calc(var(--dx)*3px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const neoIcon = (darkMode) => `${NEO_THEME[darkMode ? 'dark' : 'light']} ${NEO_ICON}`;

const COOKIE_BTN =
  'inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border-[3px] border-[color:var(--ink)] px-4 py-3 text-sm font-extrabold uppercase ' +
  '[box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 ' +
  'active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';

const NEO_BTN =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-[color:var(--ink)] px-4 py-2.5 text-sm font-extrabold uppercase ' +
  '[box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  'active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const neoBtn = (darkMode, active) => {
  const k = darkMode ? 'dark' : 'light';
  const tone = active ? 'bg-[color:var(--acc)] text-emerald-950' : `${NEO_SURFACE[k]} ${darkMode ? 'text-white' : 'text-emerald-950'}`;
  return `${NEO_THEME[k]} ${NEO_BTN} ${tone}`;
};

const PRODUCT_IMG_W = 400;
const PRODUCT_IMG_H = 320;
const mediaBg = (darkMode) => (darkMode ? 'bg-[#1e1e1e]' : 'bg-white');
const productMediaBg = (darkMode) => (darkMode ? 'hp-media hp-media-dark bg-[#1e1e1e]' : 'bg-white');

const PRODUCT_MEDIA =
  'relative aspect-[5/4] w-full flex-shrink-0 overflow-hidden border-b-[3px] border-[color:var(--ink)] [contain:layout_paint]';
const PRODUCT_ADD_BTN =
  'relative z-10 inline-flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 ' +
  '[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  'active:translate-y-[3px] active:translate-x-[calc(var(--dx)*3px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  'disabled:cursor-not-allowed disabled:opacity-40 disabled:[box-shadow:none] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const PRODUCT_LINK =
  'outline-none after:absolute after:inset-0 after:z-[1] focus-visible:after:outline focus-visible:after:outline-[3px] ' +
  'focus-visible:after:-outline-offset-4 focus-visible:after:outline-[color:var(--acc)]';

const splitHeading = (text) => {
  const str = String(text ?? '');
  if (str.includes('**')) return str.split('**').map((part, i) => ({ part, hl: i % 2 === 1 }));
  const m = str.match(/^(.*[,،]\s*)([^,،]+)$/);
  if (m) return [{ part: m[1], hl: false }, { part: m[2], hl: true }];
  const words = str.split(' ');
  if (words.length < 2) return [{ part: str, hl: true }];
  const n = words.length <= 3 ? 1 : 2;
  return [{ part: `${words.slice(0, -n).join(' ')} `, hl: false }, { part: words.slice(-n).join(' '), hl: true }];
};

const SectionTitle = memo(({ title, subtitle, darkMode, isAr, gold, children }) => {
  const hl = gold ? (darkMode ? 'hp-hl-gold-dark' : 'hp-hl-gold') : (darkMode ? 'hp-hl-dark' : 'hp-hl');
  const ink = darkMode ? 'text-white' : gold ? 'text-amber-950' : 'text-emerald-950';
  const parts = useMemo(() => splitHeading(title), [title]);
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 sm:mb-14">
      <div className="min-w-0 max-w-3xl">
        <h2
          className={`text-3xl font-extrabold [text-wrap:balance] sm:text-5xl lg:text-6xl ${
            isAr ? 'leading-[1.4] tracking-normal' : 'leading-[1.18] tracking-[-0.04em]'
          } ${ink}`}
        >
          {parts.map(({ part, hl: on }, i) => (on ? <span key={i} className={hl}>{part}</span> : part))}
        </h2>
        {subtitle && (
          <p className={`mt-5 max-w-2xl text-base font-medium leading-relaxed sm:text-lg ${darkMode ? 'text-neutral-300' : 'text-gray-800'}`}>{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
});

const CardFooter = memo(({ label, darkMode, isAr, gold }) => (
  <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-[color:var(--ink)] pt-3">
    <span className={`truncate text-sm font-extrabold uppercase ${isAr ? 'tracking-normal' : 'tracking-wide'} ${darkMode ? 'text-white' : gold ? 'text-amber-950' : 'text-emerald-950'}`}>{label}</span>
    <span aria-hidden="true" className={`${NEO_ICON} ${gold ? '!text-amber-950' : ''}`}><FiArrowRight className="h-4 w-4 rtl:rotate-180" /></span>
  </div>
));

const useRail = (dep) => {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ back: false, forward: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf;
    const check = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const offset = Math.abs(el.scrollLeft);
        const back = offset > 2;
        const forward = offset + el.clientWidth < el.scrollWidth - 5;
        setEdge((s) => (s.back === back && s.forward === forward ? s : { back, forward }));
      });
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check, { passive: true });
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); cancelAnimationFrame(raf); };
  }, [dep]);
  const scroll = useCallback((dir) => {
    const el = ref.current;
    if (!el) return;
    const rtl = window.getComputedStyle(el).direction === 'rtl';
    const sign = (dir === 'forward' ? 1 : -1) * (rtl ? -1 : 1);
    el.scrollBy({ left: sign * el.clientWidth * 0.75, behavior: 'smooth' });
  }, []);
  return { ref, ...edge, scroll };
};

const ART_COLORS = {
  light: { bd: ['#FFFFFF', '#D1D5DB'], sd: ['#34D399', '#047857'], sc: ['#6EE7B7', '#059669'] },
  dark: { bd: ['#4B4B4B', '#2C2C2C'], sd: ['#39FF88', '#17C964'], sc: ['#1F1F1F', '#0F0F0F'] },
};

const ArtDefs = ({ p, darkMode }) => {
  const c = ART_COLORS[darkMode ? 'dark' : 'light'];
  return (
    <defs>
      <linearGradient id={`${p}bd`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.bd[0]} /><stop offset="1" stopColor={c.bd[1]} /></linearGradient>
      <linearGradient id={`${p}sd`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.sd[0]} /><stop offset="1" stopColor={c.sd[1]} /></linearGradient>
      <linearGradient id={`${p}sc`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.sc[0]} /><stop offset="1" stopColor={c.sc[1]} /></linearGradient>
      <linearGradient id={`${p}am`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FDE68A" /><stop offset="1" stopColor="#F59E0B" /></linearGradient>
    </defs>
  );
};

const DEVICE_KINDS = [
  ['laptop', /laptop|notebook|macbook|computer|pc\b/i],
  ['tablet', /tablet|ipad|tab\b/i],
  ['watch', /watch|band|wearable/i],
  ['audio', /head|ear|airpod|speaker|audio|buds/i],
];
const kindOf = (text) => (DEVICE_KINDS.find(([, re]) => re.test(text)) || ['phone'])[0];

const ProductFallbackArt = memo(({ name, categoryName, label, darkMode }) => {
  const p = useId().replace(/:/g, '');
  const kind = kindOf(`${name || ''} ${categoryName || ''}`);
  const body = `url(#${p}bd)`, side = `url(#${p}sd)`, screen = `url(#${p}sc)`;
  const neon = darkMode ? '#39FF88' : '#34D399';
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full p-3" role="img" aria-label={name || label} focusable="false">
      <ArtDefs p={p} darkMode={darkMode} />
      <ellipse cx="100" cy="132" rx="62" ry="8" fill={darkMode ? '#000' : '#064E3B'} opacity={darkMode ? 0.4 : 0.16} />
      <g>
        {kind === 'phone' && (
          <g transform="translate(70 14)">
            <rect x="6" y="7" width="60" height="108" rx="13" fill={side} />
            <rect width="60" height="108" rx="13" fill={body} />
            <rect x="4" y="4" width="52" height="100" rx="10" fill={screen} />
            <path d="M4 60V14a10 10 0 0110-10h26z" fill="#fff" opacity="0.28" />
            <rect x="22" y="8" width="16" height="4" rx="2" fill="#022C22" />
            <rect x="12" y="24" width="36" height="7" rx="3.5" fill={darkMode ? neon : '#fff'} opacity="0.9" />
            <rect x="12" y="36" width="22" height="5" rx="2.5" fill="#fff" opacity="0.55" />
            <rect x="12" y="62" width="36" height="28" rx="8" fill="#fff" opacity="0.25" />
          </g>
        )}
        {kind === 'laptop' && (
          <g transform="translate(34 24)">
            <rect x="5" y="6" width="126" height="78" rx="9" fill={side} />
            <rect width="126" height="78" rx="9" fill={body} />
            <rect x="5" y="5" width="116" height="68" rx="6" fill={screen} />
            <path d="M5 44V11a6 6 0 016-6h50z" fill="#fff" opacity="0.28" />
            <rect x="14" y="14" width="46" height="7" rx="3.5" fill={darkMode ? neon : '#fff'} opacity="0.9" />
            <rect x="14" y="48" width="30" height="18" rx="5" fill="#fff" opacity="0.25" />
            <rect x="48" y="48" width="30" height="18" rx="5" fill="#fff" opacity="0.25" />
            <rect x="-10" y="88" width="146" height="12" rx="6" fill={side} />
            <rect x="-10" y="84" width="146" height="12" rx="6" fill={body} />
            <rect x="52" y="84" width="22" height="4" rx="2" fill={darkMode ? neon : '#6EE7B7'} />
          </g>
        )}
        {kind === 'tablet' && (
          <g transform="translate(46 18)">
            <rect x="6" y="6" width="100" height="100" rx="14" fill={side} />
            <rect width="100" height="100" rx="14" fill={body} />
            <rect x="5" y="5" width="90" height="90" rx="10" fill={screen} />
            <path d="M5 55V15A10 10 0 0115 5h44z" fill="#fff" opacity="0.28" />
            <rect x="16" y="18" width="40" height="8" rx="4" fill={darkMode ? neon : '#fff'} opacity="0.9" />
            <rect x="16" y="56" width="26" height="24" rx="6" fill="#fff" opacity="0.25" />
            <rect x="48" y="56" width="26" height="24" rx="6" fill="#fff" opacity="0.25" />
          </g>
        )}
        {kind === 'watch' && (
          <g transform="translate(70 6)">
            <rect x="14" y="0" width="32" height="30" rx="6" fill={side} />
            <rect x="14" y="94" width="32" height="30" rx="6" fill={side} />
            <rect x="4" y="6" width="56" height="62" rx="18" fill={side} />
            <rect y="0" width="56" height="62" rx="18" fill={body} />
            <rect x="5" y="5" width="46" height="52" rx="13" fill={screen} />
            <circle cx="28" cy="31" r="13" fill="none" stroke={darkMode ? neon : '#fff'} strokeWidth="3" opacity="0.9" />
            <path d="M28 23v8l6 4" stroke={darkMode ? neon : '#fff'} strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        )}
        {kind === 'audio' && (
          <g transform="translate(40 14)">
            <path d="M12 70V52a48 48 0 0196 0v18" fill="none" stroke={side} strokeWidth="11" strokeLinecap="round" />
            <path d="M12 66V50a48 48 0 0196 0v16" fill="none" stroke={body} strokeWidth="8" strokeLinecap="round" />
            <rect x="0" y="62" width="26" height="46" rx="12" fill={side} />
            <rect x="-3" y="58" width="26" height="46" rx="12" fill={body} />
            <rect x="3" y="70" width="14" height="30" rx="7" fill={screen} />
            <rect x="94" y="62" width="26" height="46" rx="12" fill={side} />
            <rect x="97" y="58" width="26" height="46" rx="12" fill={body} />
            <rect x="103" y="70" width="14" height="30" rx="7" fill={screen} />
          </g>
        )}
      </g>
      <path d="M30 28l2.4-6 2.4 6 6 2.4-6 2.4-2.4 6-2.4-6-6-2.4z" fill={neon} opacity="0.8" />
      <circle cx="170" cy="40" r="3" fill="#FBBF24" opacity="0.85" />
    </svg>
  );
});

const AWNING_STRIPES = [0, 1, 2, 3, 4];

const TopShopArt = memo(({ darkMode }) => {
  const ink = darkMode ? '#000000' : '#422006';
  const wall = darkMode ? '#3f3f3f' : '#FEF3C7';
  const glass = darkMode ? '#FDE047' : '#FCD34D';
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full p-3" aria-hidden="true" focusable="false">
      <ellipse cx="100" cy="138" rx="76" ry="8" fill={darkMode ? '#000' : '#78350F'} opacity={darkMode ? 0.45 : 0.2} />
      <rect x="38" y="62" width="124" height="74" fill={wall} stroke={ink} strokeWidth="3" />
      {AWNING_STRIPES.map((i) => (
        <rect key={i} x={30 + i * 28} y="36" width="28" height="28" fill={i % 2 ? '#FFFFFF' : '#FBBF24'} stroke={ink} strokeWidth="3" />
      ))}
      <rect x="48" y="78" width="32" height="28" fill={glass} stroke={ink} strokeWidth="3" />
      <rect x="120" y="78" width="32" height="28" fill={glass} stroke={ink} strokeWidth="3" />
      <rect x="88" y="90" width="24" height="46" fill="#F59E0B" stroke={ink} strokeWidth="3" />
      <circle cx="106" cy="114" r="2.5" fill={ink} />
      <path d="M100 8l4.4 11 11.6 1-8.8 7.6 2.8 11.4L100 33l-10 6 2.8-11.4L84 20l11.6-1z" fill="#FBBF24" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
});

const Stars = memo(({ value, darkMode }) => (
  <span className="inline-flex" aria-hidden="true">
    {[1, 2, 3, 4, 5].map((i) => (
      <RiStarFill key={i} className={`h-4 w-4 ${value >= i - 0.5 ? 'text-amber-500' : darkMode ? 'text-neutral-600' : 'text-amber-200'}`} />
    ))}
  </span>
));

const RailArrows = ({ rail, darkMode, language }) => {
  if (!rail.back && !rail.forward) return null;
  const rtl = languageDirection(language) === 'rtl';
  const cls = neoIcon(darkMode);
  const btn = (dir, disabled) => {
    const left = (dir === 'back') !== rtl;
    return (
      <button
        type="button"
        onClick={() => rail.scroll(dir)}
        disabled={disabled}
        aria-label={tr(language, left ? 'scrollLeft' : 'scrollRight')}
        className={`${cls} !h-11 !w-11`}
      >
        {left ? <FiChevronLeft className="h-5 w-5" /> : <FiChevronRight className="h-5 w-5" />}
      </button>
    );
  };
  return <div className="flex gap-3 pb-2 pe-2">{btn('back', !rail.back)}{btn('forward', !rail.forward)}</div>;
};

const EmptyRail = memo(({ label, darkMode }) => (
  <div className={`flex flex-col items-center gap-3 rounded-2xl border-[3px] border-dashed py-12 text-center ${darkMode ? 'border-[#39ff88]/40 bg-[#1e1e1e]' : 'border-emerald-300 bg-white/60'}`}>
    <DeviceScene compact className="h-24 w-32" />
    <p className={`text-sm font-semibold sm:text-base ${darkMode ? 'text-neutral-300' : 'text-gray-600'}`}>{label}</p>
  </div>
));

const RailSkeleton = memo(({ w, h, darkMode }) => (
  <div className="flex gap-5 overflow-hidden pb-4">
    {Array.from({ length: 4 }).map((_, i) => <div key={i} className={`flex-shrink-0 animate-pulse rounded-2xl motion-reduce:animate-none ${w} ${h} ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200/70'}`} />)}
  </div>
));

const ShopSkeleton = memo(({ darkMode, gold, count }) => (
  <div className={`${SHOP_ROW} overflow-hidden`} role="status" aria-busy="true">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={`h-[430px] animate-pulse rounded-2xl motion-reduce:animate-none ${SHOP_ITEM} ${darkMode ? 'bg-[#2a2a2a]' : gold ? 'bg-amber-200/60' : 'bg-gray-200/70'}`}
      />
    ))}
  </div>
));

const CookieSwitch = memo(({ checked, onChange, disabled, label, darkMode }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={onChange}
    className={`relative h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-[color:var(--ink)] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)] ${
      checked ? 'bg-[color:var(--acc)]' : darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-200'
    }`}
  >
    <span
      aria-hidden="true"
      className={`absolute start-0.5 top-0.5 h-4 w-4 rounded-full border-2 border-[color:var(--ink)] bg-white transition-transform duration-150 motion-reduce:transition-none ${
        checked ? '[transform:translateX(calc(var(--dx)*20px))]' : ''
      }`}
    />
  </button>
));

const COOKIE_OPTIONS = [
  ['necessary', 'necessary', 'necessaryDesc', true],
  ['analytics', 'analytics', 'analyticsDesc', false],
  ['marketing', 'marketing', 'marketingDesc', false],
];

const INITIAL_PREFS = { analytics: false, marketing: false };

const CookieConsent = memo(({ darkMode, language }) => {
  const identity = useAuthStore((s) => (s.accessToken ? s.userId ?? s.email ?? 'user' : null));
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [prefs, setPrefs] = useState(INITIAL_PREFS);
  const dialogRef = useRef(null);
  const primaryRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const isAr = language === 'ar';

  useEffect(() => {
    if (!identity || readConsent(identity)) {
      setOpen(false);
      return undefined;
    }
    const id = setTimeout(() => {
      if (readConsent(identity)) return;
      setCustom(false);
      setPrefs(INITIAL_PREFS);
      setOpen(true);
    }, CONSENT_DELAY_MS);
    return () => clearTimeout(id);
  }, [identity]);

  useEffect(() => {
    if (!open) return undefined;
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    primaryRef.current?.focus();
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const nodes = dialogRef.current?.querySelectorAll('button:not([disabled])');
      if (!nodes || !nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
    };
  }, [open]);

  const decide = useCallback((choice) => {
    writeConsent(choice);
    setOpen(false);
  }, []);

  const acceptAll = useCallback(() => decide({ analytics: true, marketing: true }), [decide]);
  const rejectAll = useCallback(() => decide({ analytics: false, marketing: false }), [decide]);
  const saveChoices = useCallback(() => decide(prefs), [decide, prefs]);
  const toggleCustom = useCallback(() => setCustom((c) => !c), []);
  const togglePref = useCallback((key) => setPrefs((p) => ({ ...p, [key]: !p[key] })), []);

  if (!open) return null;

  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const muted = darkMode ? 'text-neutral-300' : 'text-gray-700';
  const surface = darkMode ? 'bg-[#2a2a2a] text-white' : 'bg-white text-emerald-950';
  const primary = `${COOKIE_BTN} bg-[color:var(--acc)] text-emerald-950`;
  const secondary = `${COOKIE_BTN} ${surface}`;
  const track = isAr ? 'tracking-normal' : 'tracking-wide';
  const linkBtn = `min-h-11 cursor-pointer text-center text-sm font-extrabold underline decoration-[color:var(--acc)] decoration-2 underline-offset-4 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)] ${ink}`;

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={`hp-consent-in hp-sb max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain p-5 sm:p-6 ${neoCard(darkMode, 'lg')}`}
      >
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 [box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]">
            <RiCookieLine className="h-6 w-6" />
          </span>
          <h2 id={titleId} className={`text-xl font-extrabold uppercase sm:text-2xl ${isAr ? 'tracking-normal' : 'tracking-[-0.02em]'} ${ink}`}>
            <span className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{ctr(language, 'title')}</span>
          </h2>
        </div>

        <p id={descId} className={`mt-4 text-sm font-medium leading-relaxed sm:text-base ${muted}`}>{ctr(language, 'text')}</p>

        {custom && (
          <ul className="mt-5 space-y-3">
            {COOKIE_OPTIONS.map(([key, labelKey, descKey, locked]) => (
              <li key={key} className={`flex items-start justify-between gap-4 rounded-xl border-2 border-[color:var(--ink)] p-3 ${darkMode ? 'bg-[#1e1e1e]' : 'bg-gray-50'}`}>
                <div className="min-w-0">
                  <p className={`text-sm font-extrabold uppercase ${track} ${ink}`}>{ctr(language, labelKey)}</p>
                  <p className={`mt-1 text-xs font-medium leading-relaxed ${muted}`}>{ctr(language, descKey)}</p>
                </div>
                <CookieSwitch
                  darkMode={darkMode}
                  label={ctr(language, labelKey)}
                  disabled={locked}
                  checked={locked ? true : prefs[key]}
                  onChange={() => togglePref(key)}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 grid gap-3 pe-1">
          {custom ? (
            <>
              <button ref={primaryRef} type="button" onClick={saveChoices} className={primary}>{ctr(language, 'save')}</button>
              <button type="button" onClick={rejectAll} className={secondary}>{ctr(language, 'rejectAll')}</button>
              <button type="button" onClick={toggleCustom} className={linkBtn}>{ctr(language, 'back')}</button>
            </>
          ) : (
            <>
              <button ref={primaryRef} type="button" onClick={acceptAll} className={primary}>{ctr(language, 'acceptAll')}</button>
              <button type="button" onClick={rejectAll} className={secondary}>{ctr(language, 'rejectAll')}</button>
              <button type="button" onClick={toggleCustom} className={linkBtn}>{ctr(language, 'customize')}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

const ActionCard = memo(({ darkMode, language, index, title, description, to, ctaLabel, scene }) => (
  <Link to={to} className={`group h-full p-5 sm:p-6 ${neoCard(darkMode, 'lg', true)}`}>
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className={`text-3xl font-black tabular-nums sm:text-4xl ${darkMode ? 'text-[#39ff88]' : 'text-emerald-600'}`}>
        {pad2(language, index)}
      </span>
      <h3 className={`text-xl font-extrabold uppercase sm:text-2xl ${language === 'ar' ? 'tracking-normal' : 'tracking-[-0.02em]'} ${darkMode ? 'text-white' : 'text-emerald-950'}`}>
        <span className={darkMode ? 'hp-hl-dark' : 'hp-hl'}>{title}</span>
      </h3>
    </div>

    <p className={`mt-4 text-base font-medium leading-relaxed sm:text-lg ${darkMode ? 'text-neutral-200' : 'text-gray-800'}`}>{description}</p>

    <div aria-hidden="true" className="my-6 aspect-[3/2] w-full">
      <IsoIllustration type={scene} onGreen={false} darkMode={darkMode} className="h-full w-full" />
    </div>

    <CardFooter label={ctaLabel} darkMode={darkMode} isAr={language === 'ar'} />
  </Link>
));

const ActionSection = memo(({ darkMode, language }) => (
  <section className={`hp-glow ${darkMode ? `hp-glow-dark ${DARK_PAGE}` : 'bg-gray-50'} py-14 sm:py-20 ${LAZY_SECTION}`}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionTitle
        title={tr(language, 'todayPrompt')}
        subtitle={tr(language, 'getStarted')}
        darkMode={darkMode}
        isAr={language === 'ar'}
      />

      <div className="grid grid-cols-1 gap-8 pb-2 pe-2 md:grid-cols-2 lg:gap-10">
        <ActionCard
          darkMode={darkMode} language={language} index={1} scene="repairCard"
          title={tr(language, 'repairDevice')}
          description={tr(language, 'repairDescription')}
          to="/repair" ctaLabel={tr(language, 'bookRepair')}
        />
        <ActionCard
          darkMode={darkMode} language={language} index={2} scene="offersCard"
          title={tr(language, 'latestOffers')}
          description={tr(language, 'offersDescription')}
          to="/offers" ctaLabel={tr(language, 'viewOffers')}
        />
      </div>
    </div>
  </section>
));

const CategoryCard = memo(({ category, count, showCount, darkMode, language }) => {
  const id = safeId(category.id);
  const catKey = useMemo(() => isoCatKey(kindOfCategory(category.name)), [category.name]);
  if (!id) return null;
  return (
    <Link
      to={`/products/category/${id}`}
      aria-label={category.name}
      className="hp-dot group relative min-h-11 p-3 pt-6 text-center sm:gap-2.5 sm:p-4 sm:pt-7"
    >
      <IsoIllustration
        type={catKey} darkMode={darkMode} onGreen={false}
        className="h-14 w-14 transition-transform duration-200 motion-reduce:transition-none group-hover:scale-110 sm:h-16 sm:w-16"
      />
      <span className="line-clamp-1 w-full text-sm font-extrabold uppercase">{category.name}</span>
      {showCount && (
        <span className="text-xs font-bold opacity-80">
          <span dir="ltr" className="tabular-nums">{count}</span> {tr(language, count === 1 ? 'homeItemSingular' : 'homeItemPlural')}
        </span>
      )}
    </Link>
  );
});

const CategorySection = memo(({ categories, counts, showCount, loading, darkMode, language }) => {
  const top = useMemo(
    () => [...categories].sort((a, b) => (counts[String(b.id)] || 0) - (counts[String(a.id)] || 0)).slice(0, CATEGORY_LIMIT),
    [categories, counts],
  );
  if (!loading && top.length === 0) return null;
  const grid = 'grid grid-cols-2 gap-4 pb-2 pe-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6';
  return (
    <section
      aria-label={tr(language, 'homeCategoriesTitle')}
      className={`hp-glow ${darkMode ? `hp-glow-dark ${DARK_PAGE}` : 'bg-gray-50'} py-14 sm:py-20 ${LAZY_SECTION}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          darkMode={darkMode} isAr={language === 'ar'}
          title={tr(language, 'homeCategoriesTitle')}
          subtitle={tr(language, 'homeCategoriesSub')}
        />
        <div className={`hp-cat ${darkMode ? 'hp-cat-dark' : ''}`}>
          {loading ? (
            <div className={grid} role="status" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className={`h-[150px] animate-pulse rounded-2xl motion-reduce:animate-none ${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-200/70'}`} />)}
            </div>
          ) : (
            <div className={grid}>
              {top.map((c) => (
                <CategoryCard key={c.id} category={c} count={counts[String(c.id)] || 0} showCount={showCount} darkMode={darkMode} language={language} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

const ProductCard = memo(({ product, darkMode, language, onAddToCart }) => {
  const [failed, setFailed] = useState(false);
  const [btn, setBtn] = useState('idle');
  const timer = useRef();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);
  useEffect(() => { setFailed(false); }, [product.imageUrl]);

  const id = safeId(product.id);
  const out = product.stock === 0;
  const low = typeof product.stock === 'number' && product.stock > 0 && product.stock <= LOW_STOCK_LIMIT;
  const hasDiscount = product.saving > 0;
  const hasRating = product.rating > 0;
  const showImage = !!product.imageUrl && !failed;

  const handleError = useCallback(() => setFailed(true), []);
  const handleCart = useCallback(async () => {
    if (out || btn === 'adding') return;
    setBtn('adding');
    const ok = await onAddToCart(product);
    if (!mounted.current) return;
    setBtn(ok ? 'added' : 'idle');
    if (ok) timer.current = setTimeout(() => mounted.current && setBtn('idle'), 1400);
  }, [out, btn, onAddToCart, product]);

  const ink = darkMode ? 'text-white' : 'text-emerald-950';
  const muted = darkMode ? 'text-neutral-400' : 'text-gray-600';
  const deal = darkMode ? 'text-orange-400' : 'text-orange-700';
  const alert = darkMode ? 'text-rose-400' : 'text-rose-600';

  return (
    <article aria-label={product.name} className={`group relative h-full overflow-hidden ${neoCard(darkMode, 'sm', true)}`}>
      <div className={`${PRODUCT_MEDIA} ${productMediaBg(darkMode)}`}>
        {showImage ? (
          <img
            src={product.imageUrl} alt={product.name} width={PRODUCT_IMG_W} height={PRODUCT_IMG_H}
            loading="lazy" decoding="async" fetchPriority="low" referrerPolicy="no-referrer"
            onError={handleError}
            className={`h-full w-full bg-white object-contain p-4 transition-transform duration-300 motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105 ${darkMode ? 'bg-transparent drop-shadow-[0_6px_6px_rgba(0,0,0,0.18)]' : ''} ${out ? 'opacity-50' : ''}`}
          />
        ) : (
          <ProductFallbackArt name={product.name} categoryName={product.categoryName} label={tr(language, 'deviceLabel')} darkMode={darkMode} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className={`line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug ${ink}`} title={product.name}>
          {id ? <Link to={`/device/${id}`} className={PRODUCT_LINK}>{product.name}</Link> : product.name}
        </h3>

        {hasRating && (
          <p className={`flex items-center gap-1 text-xs font-bold ${ink}`}>
            <RiStarFill className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
            <span dir="ltr" className="tabular-nums">{product.rating.toFixed(1)}</span>
            {product.reviews > 0 && <span dir="ltr" className={`font-medium tabular-nums ${muted}`}>({COUNT_FORMAT.format(product.reviews)})</span>}
          </p>
        )}

        {out ? (
          <p className={`flex items-center gap-1.5 text-xs font-bold ${alert}`}>
            <FiAlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span>{tr(language, 'outOfStock')}</span>
          </p>
        ) : low ? (
          <p className={`flex items-center gap-1.5 text-xs font-medium ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>
            <FiAlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-orange-500" aria-hidden="true" />
            <span>{tr(language, 'onlyLeft', { count: product.stock })}</span>
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 border-t-2 border-dotted border-[color:var(--ink)] pt-2.5">
          <div className="min-w-0">
            {hasDiscount && (
              <p className={`text-[11px] tabular-nums line-through ${muted}`}>
                <span className="sr-only">{tr(language, 'originalPrice')}: </span>{money(product.price)}
              </p>
            )}
            <p className={`truncate text-lg font-extrabold leading-tight tabular-nums ${hasDiscount ? deal : ink}`}>
              <span className="sr-only">{hasDiscount ? `${tr(language, 'discountedPrice')}: ` : ''}</span>{money(product.finalPrice)}
            </p>
            {hasDiscount && (
              <p className={`truncate text-[11px] font-bold ${deal}`}>
                {tr(language, 'youSave', { value: money(product.saving) })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleCart}
            disabled={out || btn === 'adding'}
            aria-label={tr(language, 'addToCart')}
            className={PRODUCT_ADD_BTN}
          >
            {btn === 'adding' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
              : btn === 'added' ? <FiCheck className="h-5 w-5" /> : <FiPlus className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </article>
  );
});

const SHOP_MEDIA = 'relative h-40 w-full flex-shrink-0 overflow-hidden border-b-[3px] border-[color:var(--ink)] [contain:layout_paint] sm:h-44';
const ShopMedia = memo(({ shop, darkMode, gold }) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);
  const [mediaRef, logo] = useShopLogo(shop);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [logo]);

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [logo, failed]);

  const handleError = useCallback(() => setFailed(true), []);
  const handleLoad = useCallback(() => setLoaded(true), []);
  const showLogo = !!logo && !failed;
  const bg = showLogo ? 'bg-white' : gold ? (darkMode ? 'bg-[#1e1e1e]' : 'bg-amber-100') : mediaBg(darkMode);
  return (
    <div ref={mediaRef} className={`${SHOP_MEDIA} ${bg}`}>
      {showLogo ? (
        <>
          {!loaded && <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-black/5 motion-reduce:animate-none" />}
          <img
            ref={imgRef}
            src={logo}
            alt={shop.name || ''}
            width={400}
            height={300}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            referrerPolicy="no-referrer"
            onLoad={handleLoad}
            onError={handleError}
            className={`absolute inset-0 h-full w-full object-contain p-4 transition-[opacity,transform] duration-300 motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      ) : (
        <div className="flex h-full w-full items-end justify-center px-4 pt-4">
          {gold ? (
            <TopShopArt darkMode={darkMode} />
          ) : (
            <StorefrontIllustration className="pointer-events-none h-full w-auto max-w-full transition-transform duration-200 motion-reduce:transition-none group-hover:scale-105" />
          )}
        </div>
      )}
    </div>
  );
});

const STAT_ITEMS = [
  [FiPackage, 'statOrders', 'orders'],
  [FiTool, 'statRepairs', 'repairs'],
];

const ShopStats = memo(({ orders, repairs, loading, darkMode, language, gold }) => {
  const values = { orders, repairs };
  const surface = darkMode ? 'bg-[#1e1e1e]' : gold ? 'bg-white' : 'bg-gray-50';
  const label = darkMode ? 'text-neutral-300' : 'text-gray-700';
  const icon = darkMode ? (gold ? 'text-[#facc15]' : 'text-[#39ff88]') : gold ? 'text-amber-600' : 'text-emerald-600';
  const ink = darkMode ? 'text-white' : gold ? 'text-amber-950' : 'text-emerald-950';
  return (
    <dl className="mb-3 grid grid-cols-2 gap-2">
      {STAT_ITEMS.map(([Icon, key, field]) => {
        const value = values[field];
        return (
          <div key={key} className={`flex min-w-0 items-center gap-1.5 rounded-lg border-2 border-[color:var(--ink)] px-2 py-1.5 ${surface}`}>
            <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${icon}`} aria-hidden="true" />
            <dt className={`min-w-0 flex-1 truncate text-[10px] font-extrabold uppercase ${label}`}>{tr(language, key)}</dt>
            <dd dir="ltr" className={`flex-shrink-0 text-sm font-black leading-none tabular-nums ${ink}`}>
              {value == null && loading
                ? <span className={`inline-block h-3.5 w-6 animate-pulse rounded motion-reduce:animate-none ${darkMode ? 'bg-white/15' : 'bg-black/10'}`} />
                : value == null ? '—' : COUNT_FORMAT.format(value)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
});

const statOf = (shop, stats, key) => {
  if (shop[`_${key}`] != null) return shop[`_${key}`];
  const map = stats?.[key];
  if (!map) return null;
  return map[`i:${shop.id}`] ?? map[nameKey(shop.name)] ?? 0;
};

const ShopCard = memo(({ shop, stats, statsLoading, darkMode, language, onOpen }) => {
  const open = useCallback(() => onOpen(shop), [onOpen, shop]);
  const handleKey = useCallback((e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }, [open]);
  const hasRating = shop.rating > 0;
  const tel = phoneHref(shop.phone);
  const isAr = language === 'ar';
  const neonText = darkMode ? 'text-[#39ff88]' : 'text-emerald-600';
  const amber = darkMode ? 'text-amber-300' : 'text-amber-700';
  const body = darkMode ? 'text-neutral-300' : 'text-gray-700';
  return (
    <article
      onClick={open}
      onKeyDown={handleKey}
      tabIndex={0}
      aria-label={shop.name}
      className={`group relative h-full cursor-pointer overflow-hidden ${neoCard(darkMode, 'sm', true)}`}
    >
      <ShopMedia shop={shop} darkMode={darkMode} />

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex flex-1 flex-col gap-2.5 pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`min-w-0 text-base font-extrabold uppercase leading-snug ${isAr ? 'tracking-normal' : 'tracking-[-0.01em]'} ${darkMode ? 'text-white' : 'text-emerald-950'}`}>
              <span className="line-clamp-1">{shop.name || tr(language, 'unnamedShop')}</span>
            </h3>
            {hasRating && (
              <span className={`flex flex-shrink-0 items-center gap-1 text-sm font-extrabold ${amber}`}>
                <RiStarFill className="h-4 w-4" aria-hidden="true" /><span dir="ltr" className="tabular-nums">{shop.rating.toFixed(1)}</span>
              </span>
            )}
          </div>
          {shop._address ? (
            <p className={`flex items-center gap-1.5 text-xs font-medium ${body}`}>
              <FiMapPin className={`h-3.5 w-3.5 flex-shrink-0 ${neonText}`} aria-hidden="true" />
              <span className="line-clamp-1">{shop._address}</span>
            </p>
          ) : (
            <p className={`flex items-center gap-1.5 text-xs font-bold ${amber}`}>
              <FiMapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />{tr(language, 'noAddress')}
            </p>
          )}
          {tel && (
            <a href={tel} onClick={(e) => e.stopPropagation()} className={`flex min-h-6 min-w-0 items-center gap-1.5 text-xs font-bold ${darkMode ? 'text-neutral-200 hover:text-[#39ff88]' : 'text-gray-800 hover:text-emerald-600'}`}>
              <FiPhone className={`h-3.5 w-3.5 flex-shrink-0 ${neonText}`} aria-hidden="true" /><span className="truncate" dir="ltr">{shop.phone}</span>
            </a>
          )}
          <p className={`line-clamp-2 min-h-[2.25rem] text-xs font-medium leading-relaxed ${body}`}>{shop._snippet || tr(language, 'shopDescription')}</p>
        </div>
        <ShopStats
          orders={statOf(shop, stats, 'orders')} repairs={statOf(shop, stats, 'repairs')}
          loading={statsLoading} darkMode={darkMode} language={language}
        />
        <CardFooter label={tr(language, 'visitShop')} darkMode={darkMode} isAr={isAr} />
      </div>
    </article>
  );
});

const GoldRow = memo(({ icon: Icon, children, className = '' }) => (
  <p className={`flex min-w-0 items-center gap-2 text-xs font-semibold ${className}`}>
    <Icon aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
    <span className="min-w-0 flex-1">{children}</span>
  </p>
));

const TopShopCard = memo(({ shop, rank, stats, statsLoading, darkMode, language, onOpen }) => {
  const open = useCallback(() => onOpen(shop), [onOpen, shop]);
  const handleKey = useCallback((e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }, [open]);
  const tel = phoneHref(shop.phone);
  const isAr = language === 'ar';
  const ink = darkMode ? 'text-white' : 'text-amber-950';
  const body = darkMode ? 'text-neutral-100' : 'text-gray-900';
  return (
    <article
      onClick={open}
      onKeyDown={handleKey}
      tabIndex={0}
      aria-label={`${tr(language, 'rankLabel', { n: rank })}: ${shop.name || ''}`}
      className={`group relative h-full cursor-pointer overflow-hidden ${goldCard(darkMode, true)}`}
    >
      <ShopMedia shop={shop} darkMode={darkMode} gold />

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex flex-1 flex-col gap-2.5 pb-3">
          <h3 className={`flex min-w-0 items-center gap-2 text-base font-extrabold uppercase leading-snug ${isAr ? 'tracking-normal' : 'tracking-[-0.01em]'} ${ink}`}>
            <span aria-hidden="true" className={`flex-shrink-0 text-2xl font-black tabular-nums ${darkMode ? 'text-[#facc15]' : 'text-amber-600'}`}>{pad2(language, rank)}</span>
            <span className="min-w-0 flex-1 truncate">{shop.name || tr(language, 'unnamedShop')}</span>
          </h3>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span className={`inline-flex items-center gap-1 text-lg font-black ${ink}`}>
              <RiStarFill className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <span dir="ltr" className="tabular-nums">{shop.rating.toFixed(1)}</span>
              <span dir="ltr" className="text-[10px] font-bold opacity-70">{tr(language, 'outOf')}</span>
            </span>
            <Stars value={shop.rating} darkMode={darkMode} />
            {shop.reviews > 0 && (
              <span className={`text-xs font-bold ${body}`}>{tr(language, 'reviewsCount', { count: COUNT_FORMAT.format(shop.reviews) })}</span>
            )}
          </div>

          {shop._address && <GoldRow icon={FiMapPin} className={body}><span className="line-clamp-1">{shop._address}</span></GoldRow>}
          {tel && (
            <GoldRow icon={FiPhone} className={body}>
              <a href={tel} onClick={(e) => e.stopPropagation()} dir="ltr" className="truncate underline decoration-[color:var(--acc)] decoration-2 underline-offset-4">{shop.phone}</a>
            </GoldRow>
          )}
          <p className={`line-clamp-2 min-h-[2.25rem] text-xs font-medium leading-relaxed ${darkMode ? 'text-neutral-300' : 'text-gray-800'}`}>{shop._snippet || tr(language, 'shopDescription')}</p>
        </div>
        <ShopStats
          orders={statOf(shop, stats, 'orders')} repairs={statOf(shop, stats, 'repairs')}
          loading={statsLoading} darkMode={darkMode} language={language} gold
        />
        <CardFooter label={tr(language, 'visitShop')} darkMode={darkMode} isAr={isAr} gold />
      </div>
    </article>
  );
});

const TopRatedSection = memo(({ shops, stats, statsLoading, loading, darkMode, language, onOpen, sectionRef, visible }) => {
  if (!loading && shops.length === 0) return null;
  return (
    <section
      ref={sectionRef}
      aria-label={tr(language, 'topRatedTitle')}
      className={`border-y-4 py-14 sm:py-20 ${LAZY_SECTION} ${visible ? '' : 'anim-paused'} ${
        darkMode ? 'border-[#facc15]/40 bg-[#1a1708]' : 'border-amber-300 bg-white'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          gold darkMode={darkMode} isAr={language === 'ar'}
          title={tr(language, 'topRatedTitle')}
          subtitle={tr(language, 'topRatedSub')}
        />
        {loading ? <ShopSkeleton darkMode={darkMode} gold count={TOP_LIMIT} /> : (
          <ol className={SHOP_ROW}>
            {shops.map((s, i) => (
              <li key={s.id} className={SHOP_ITEM}>
                <TopShopCard
                  shop={s} rank={i + 1} stats={stats} statsLoading={statsLoading}
                  darkMode={darkMode} language={language} onOpen={onOpen}
                />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
});

const ShopsSection = memo(({ shops, stats, statsLoading, loading, darkMode, language, onOpen, sectionRef, visible }) => {
  const isAr = language === 'ar';
  return (
    <section
      ref={sectionRef}
      className={`hp-pattern ${darkMode ? 'hp-pattern-dark' : ''} py-14 sm:py-20 ${LAZY_SECTION} ${visible ? '' : 'anim-paused'} ${darkMode ? DARK_PAGE : 'bg-gray-50'}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          darkMode={darkMode} isAr={isAr}
          title={tr(language, 'topShops')}
          subtitle={tr(language, 'shopsSubtitle')}
        >
          <div className="pb-2 pe-2">
            <Link to="/shops" className={neoBtn(darkMode, true)}>
              <span>{tr(language, 'viewAllShops')}</span>
              <FiArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        </SectionTitle>

        {loading ? <ShopSkeleton darkMode={darkMode} count={LATEST_SHOPS_LIMIT} />
          : shops.length === 0 ? <EmptyRail label={tr(language, 'noShops')} darkMode={darkMode} />
          : (
            <div className={SHOP_ROW}>
              {shops.map((s, i) => (
                <div key={s.id} className={`hp-rise ${SHOP_ITEM}`} style={STAGGER[i % LATEST_SHOPS_LIMIT]}>
                  <ShopCard shop={s} stats={stats} statsLoading={statsLoading} darkMode={darkMode} language={language} onOpen={onOpen} />
                </div>
              ))}
            </div>
          )}
      </div>
    </section>
  );
});

const HomepageContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';

  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => { document.title = tr(language, 'pageTitle'); }, [language]);

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.hpTheme = darkMode ? 'dark' : 'light';
    return () => { delete el.dataset.hpTheme; };
  }, [darkMode]);

  useEffect(() => {
    const warm = () => { loadService(); loadComponents(); };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(warm, 1500);
    return () => clearTimeout(id);
  }, []);

  const recoveredRef = useRef(false);
  useEffect(() => {
    if (recoveredRef.current || useAuthStore.getState().accessToken) return;
    recoveredRef.current = true;
    recoverGoogleSession().then((session) => {
      if (!session) return;
      const to = redirectFor(session.roles, '/');
      if (to !== '/') navigate(to, { replace: true });
    });
  }, [navigate]);

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['homeData', userId ?? 'anon'],
    enabled: !!accessToken,
    queryFn: async ({ signal }) => {
      const [shopRes, productRes] = await Promise.all([
        api.get('/api/users/shops/all', { params: { page: 0, size: SHOPS_FETCH_SIZE }, signal }),
        api.get('/api/products', { signal }).catch((e) => {
          if (signal?.aborted) throw e;
          return { data: { content: [] } };
        }),
      ]);
      const list = productRes.data?.content || productRes.data || [];
      const catalog = (Array.isArray(list) ? list : []).filter((p) => p && !p.deleted).map(normalizeProduct);
      const rawShops = shopRes.data?.content || (Array.isArray(shopRes.data) ? shopRes.data : []);
      const shops = rawShops.filter(Boolean).map(normalizeShop);
      return {
        catalog,
        latestProducts: latestOf(catalog),
        topShops: topShopsOf(shops),
        latestShops: latestShopsOf(shops),
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const isLoading = !!accessToken && queryLoading;

  const { data: categories = EMPTY_LIST, isLoading: categoriesLoading } = useQuery({
    queryKey: ['homeCategories'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/categories', { signal });
      const raw = res.data?.content || res.data || [];
      const out = [];
      if (Array.isArray(raw)) {
        for (const c of raw) {
          if (c && c.id != null) out.push({ id: c.id, name: clean(String(c.name || c.id), 60) });
        }
      }
      return out;
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const catalog = data?.catalog || EMPTY_LIST;
  const products = data?.latestProducts || EMPTY_LIST;
  const topShops = data?.topShops || EMPTY_LIST;
  const latestShops = data?.latestShops || EMPTY_LIST;

  const needsStats = useMemo(
    () => topShops.some((s) => s._orders == null || s._repairs == null) || latestShops.some((s) => s._orders == null || s._repairs == null),
    [topShops, latestShops],
  );

  const { data: shopStats = EMPTY_OBJECT, isLoading: statsQueryLoading } = useQuery({
    queryKey: ['homeShopStats', userId ?? 'anon'],
    enabled: !!accessToken && needsStats,
    queryFn: ({ signal }) => fetchShopStats(signal),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const statsLoading = needsStats && statsQueryLoading;

  const prodRail = useRail(products);
  const [prodSecRef, prodVisible] = useOnScreen();
  const [topSecRef, topVisible] = useOnScreen();
  const [shopSecRef, shopVisible] = useOnScreen();

  const categoryCounts = useMemo(() => {
    const map = {};
    for (const p of catalog) if (p.categoryId != null) map[String(p.categoryId)] = (map[String(p.categoryId)] || 0) + 1;
    return map;
  }, [catalog]);

  const showTop = useBackToTop();
  const scrollToTop = useCallback(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  const handleAddToCart = useCallback(async (product) => {
    if (!useAuthStore.getState().accessToken) {
      const Swal = await loadSwal();
      const r = await Swal.fire({
        title: tr(language, 'loginRequiredTitle'), text: tr(language, 'loginRequiredText'), icon: 'info',
        showCancelButton: true, confirmButtonText: tr(language, 'goToLogin'),
      });
      if (r.isConfirmed) navigate('/login');
      return false;
    }
    try {
      const res = await api.post('/api/cart/items', { productId: product.id, quantity: 1 });
      if (res.status < 200 || res.status >= 300) throw new Error('Unexpected response');
      window.dispatchEvent(new Event('cart:updated'));
      toast({
        icon: 'success', title: tr(language, 'addedTitle'),
        text: tr(language, 'addedToCart', { name: clean(product.name, 60) }), timer: 2800,
      });
      return true;
    } catch (err) {
      toast({ icon: 'error', title: tr(language, 'errorTitle'), text: err?.response?.data?.message || tr(language, 'addToCartFailed'), timer: 3500 });
      return false;
    }
  }, [navigate, language]);

  const openShop = useCallback((s) => {
    const id = safeId(s.id);
    if (id) navigate(`/shops/${id}`);
  }, [navigate]);

  const RAIL = 'hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-5 pt-1 sm:gap-6 motion-reduce:scroll-auto';
  const sectionBg = darkMode ? DARK_PAGE : 'bg-gray-50';

  return (
    <div
      dir={languageDirection(language)}
      className={`min-h-screen ${isAr ? 'font-cairo' : 'font-jakarta'} ${darkMode ? `${DARK_PAGE} text-white` : 'bg-gray-50 text-gray-900'}`}
    >
      <Device3DStyles />
      <style>{EXTRAS_CSS}</style>
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <Hero variant="home" darkMode={darkMode} />

      <ActionSection darkMode={darkMode} language={language} />

      <Suspense fallback={<div className={`h-[420px] w-full animate-pulse motion-reduce:animate-none ${darkMode ? DARK_PAGE : 'bg-emerald-50'}`} />}>
        <Service darkMode={darkMode} />
      </Suspense>

      <CategorySection
        categories={categories} counts={categoryCounts} showCount={!!data}
        loading={categoriesLoading} darkMode={darkMode} language={language}
      />

      <section
        ref={prodSecRef}
        className={`hp-pattern ${darkMode ? 'hp-pattern-dark' : ''} py-14 sm:py-20 ${LAZY_SECTION} ${prodVisible ? '' : 'anim-paused'} ${sectionBg}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            darkMode={darkMode} isAr={isAr}
            title={tr(language, 'featuredProducts')}
            subtitle={tr(language, 'featuredSubtitle')}
          >
            <RailArrows rail={prodRail} darkMode={darkMode} language={language} />
          </SectionTitle>

          {isLoading ? <RailSkeleton w="w-[210px] sm:w-[230px]" h="h-[380px]" darkMode={darkMode} />
            : products.length === 0 ? <EmptyRail label={tr(language, 'noProducts')} darkMode={darkMode} />
            : (
              <div ref={prodRail.ref} className={RAIL}>
                {products.map((p) => (
                  <div key={p.id} className="w-[210px] flex-shrink-0 snap-start pb-2 pe-2 sm:w-[230px]">
                    <ProductCard product={p} darkMode={darkMode} language={language} onAddToCart={handleAddToCart} />
                  </div>
                ))}
              </div>
            )}
        </div>
      </section>

      <TopRatedSection
        shops={topShops} stats={shopStats} statsLoading={statsLoading}
        loading={isLoading} darkMode={darkMode} language={language}
        onOpen={openShop} sectionRef={topSecRef} visible={topVisible}
      />

      <ShopsSection
        shops={latestShops} stats={shopStats} statsLoading={statsLoading}
        loading={isLoading} darkMode={darkMode} language={language}
        onOpen={openShop} sectionRef={shopSecRef} visible={shopVisible}
      />

      <Suspense fallback={<div className={`h-64 w-full animate-pulse motion-reduce:animate-none ${darkMode ? DARK_PAGE : 'bg-white'}`} />}>
        <OffersSlider darkMode={darkMode} />
      </Suspense>

      {showTop && (
        <div className="fixed bottom-5 end-5 z-40">
          <Btn3D onClick={scrollToTop} aria-label={tr(language, 'backToTop')} className="h-11 w-11">
            <FiArrowUp className="h-5 w-5" />
          </Btn3D>
        </div>
      )}

      <CookieConsent darkMode={darkMode} language={language} />
    </div>
  );
});

const Homepage = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <HomepageContent {...props} />
  </QueryClientProvider>
));

export { queryClient };
export default Homepage;