import React, {
  useState, useRef, useEffect, useCallback, memo, useMemo, useId, Suspense, lazy,
} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiArrowRight, FiMapPin, FiPhone, FiPlus, FiCheck, FiArrowUp, FiAlertCircle,
  FiPackage, FiTool, FiShield, FiTag, FiHeart, FiAlertTriangle, FiRefreshCw, FiWifiOff,
  FiSmartphone, FiTablet, FiWatch, FiHeadphones, FiCamera, FiTv, FiMonitor, FiSpeaker,
  FiPrinter, FiHardDrive, FiWifi, FiCpu, FiBattery, FiMic, FiBox,
} from 'react-icons/fi';
import { RiStarFill, RiCookieLine, RiMacbookLine, RiGamepadLine } from 'react-icons/ri';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import '../common/styles/style.css';
import api from '../common/api/api';
import { resolveImageSrc } from '../common/utils/productutils';
import queryClient from '../common/utils/queryClient';
import useAuthStore from '../common/store/Auth';
import { recoverGoogleSession } from '../common/utils/googleSession';
import { redirectFor } from '../common/utils/authSession';
import {
  markImg, isImgOk, isImgBad, warmImages, readLogoEntry, writeLogo, LOGO_STALE_MS,
} from '../common/utils/imageCache';
import { Hero } from '../components';
import {
  Defs3D, Device3DStyles, Btn3D, useOnScreen, money,
} from '../components/user/Device3D';
import {
  safeImageUrl, StorefrontIllustration, loadSwal, clean, useBackToTop,
} from '../components/user/ListingKit';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import { IsoIllustration } from '../components/user/IsoIllustrations';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';

const loadService = () => import('../components/user/Service');
const loadComponents = () => import('../components');
const makeOffersSlider = () => lazy(() => loadComponents().then((m) => ({ default: m.OffersSlider })));

const HOMEPAGE_TRANSLATIONS = {
  en: enTranslations.homepage,
  ar: arTranslations.homepage || arTranslations.hero?.homepage,
  fr: frTranslations.homepage || frTranslations.hero?.homepage,
};

const LOCAL_TEXT = {
  en: {
    noAddress: 'No address',
    youSave: 'Save {{value}}', originalPrice: 'Original price', discountedPrice: 'Price after discount',
    onlyLeft: 'Only {{count}} left in stock',
    save: 'Save product', saved: 'Saved', noProductDescription: 'No description available',
    homeCategoriesTitle: 'Shop by category', homeCategoriesSub: 'Pick a category to see every device in it',
    homeItemSingular: 'item', homeItemPlural: 'items',
    topRatedTitle: 'Our top rated shops', topRatedSub: 'The shops customers rate highest, ranked by rating',
    reviewsCount: '{{count}} reviews', outOf: '/ 5', rankLabel: 'Rank {{n}}',
    statOrders: 'Orders', statRepairs: 'Repairs', viewAllShops: 'View all shops',
    dealsTitle: 'Hot deals', dealsSub: 'Devices with the biggest discounts right now',
    viewAllDevices: 'View all devices', viewAll: 'View all',
    tabsTitle: 'Latest devices', tabsSub: 'Fresh listings and customer favorites in one place',
    shopsTrustTitle: 'Shops we work with', shopsTrustSub: 'Verified shops you can buy from and repair with',
    condNew: 'New', condUsed: 'Used', condRefurb: 'Refurbished',
    trustShopsTitle: 'Rated shops', trustShopsText: 'Ranked by real customer ratings',
    trustRepairTitle: 'Easy repairs', trustRepairText: 'Book and follow it step by step',
    trustOffersTitle: 'Fresh offers', trustOffersText: 'New deals added regularly',
    trustNearbyTitle: 'Nearby shops', trustNearbyText: 'Find a shop close to you',
    emptyProductsText: 'New devices are on the way. Check back soon or browse the full catalog.',
    emptyShopsText: 'Shops are joining every day. Explore the shops page to see who is available.',
    exploreDevices: 'Browse devices', exploreShops: 'Explore shops',
    retry: 'Try again', loadFailedTitle: 'We could not load this section',
    loadFailedText: 'Something went wrong on our side. Please try again in a moment.',
    offlineTitle: 'You are offline', offlineText: 'Check your connection. We will refresh as soon as you are back online.',
    backOnline: 'Back online',
  },
  ar: {
    noAddress: 'لا يوجد عنوان',
    youSave: 'وفّر {{value}}', originalPrice: 'السعر الأصلي', discountedPrice: 'السعر بعد الخصم',
    onlyLeft: 'متبقي {{count}} فقط في المخزون',
    save: 'حفظ المنتج', saved: 'تم الحفظ', noProductDescription: 'لا يوجد وصف متاح',
    homeCategoriesTitle: 'تسوّق حسب التصنيف', homeCategoriesSub: 'اختر تصنيفًا لعرض كل الأجهزة فيه',
    homeItemSingular: 'منتج', homeItemPlural: 'منتجات',
    topRatedTitle: 'متاجرنا الأعلى تقييمًا', topRatedSub: 'المتاجر التي يقيّمها العملاء الأعلى، مرتبة حسب التقييم',
    reviewsCount: '{{count}} تقييم', outOf: '/ 5', rankLabel: 'المركز {{n}}',
    statOrders: 'الطلبات', statRepairs: 'الإصلاحات', viewAllShops: 'عرض كل المتاجر',
    dealsTitle: 'أقوى العروض', dealsSub: 'الأجهزة ذات أكبر الخصومات الآن',
    viewAllDevices: 'عرض كل الأجهزة', viewAll: 'عرض الكل',
    tabsTitle: 'أحدث الأجهزة', tabsSub: 'أحدث المنتجات وأكثرها تفضيلًا في مكان واحد',
    shopsTrustTitle: 'متاجر نتعامل معها', shopsTrustSub: 'متاجر موثّقة يمكنك الشراء والإصلاح منها',
    condNew: 'جديد', condUsed: 'مستعمل', condRefurb: 'مجدّد',
    trustShopsTitle: 'متاجر مقيَّمة', trustShopsText: 'مرتبة حسب تقييمات العملاء',
    trustRepairTitle: 'إصلاح سهل', trustRepairText: 'احجز وتابع خطوة بخطوة',
    trustOffersTitle: 'عروض جديدة', trustOffersText: 'عروض تُضاف باستمرار',
    trustNearbyTitle: 'متاجر قريبة', trustNearbyText: 'اعثر على متجر قريب منك',
    emptyProductsText: 'أجهزة جديدة في الطريق. عاود الزيارة قريبًا أو تصفّح الكتالوج كاملًا.',
    emptyShopsText: 'متاجر جديدة تنضم كل يوم. افتح صفحة المتاجر لتعرف من المتاح الآن.',
    exploreDevices: 'تصفّح الأجهزة', exploreShops: 'استكشف المتاجر',
    retry: 'حاول مرة أخرى', loadFailedTitle: 'تعذّر تحميل هذا القسم',
    loadFailedText: 'حدث خطأ من جانبنا. حاول مرة أخرى بعد قليل.',
    offlineTitle: 'لا يوجد اتصال بالإنترنت', offlineText: 'تحقق من اتصالك. سنحدّث الصفحة تلقائيًا فور عودة الاتصال.',
    backOnline: 'عاد الاتصال',
  },
  fr: {
    noAddress: 'Aucune adresse',
    youSave: 'Économisez {{value}}', originalPrice: "Prix d'origine", discountedPrice: 'Prix après remise',
    onlyLeft: 'Plus que {{count}} en stock',
    save: 'Enregistrer le produit', saved: 'Enregistré', noProductDescription: 'Aucune description disponible',
    homeCategoriesTitle: 'Acheter par catégorie', homeCategoriesSub: 'Choisissez une catégorie pour voir tous ses appareils',
    homeItemSingular: 'article', homeItemPlural: 'articles',
    topRatedTitle: 'Nos boutiques les mieux notées', topRatedSub: 'Les boutiques les plus appréciées, classées par note',
    reviewsCount: '{{count}} avis', outOf: '/ 5', rankLabel: 'Rang {{n}}',
    statOrders: 'Commandes', statRepairs: 'Réparations', viewAllShops: 'Voir toutes les boutiques',
    dealsTitle: 'Bonnes affaires', dealsSub: 'Les appareils les plus remisés du moment',
    viewAllDevices: 'Voir tous les appareils', viewAll: 'Voir tout',
    tabsTitle: 'Derniers appareils', tabsSub: 'Nouveautés et coups de cœur des clients au même endroit',
    shopsTrustTitle: 'Boutiques partenaires', shopsTrustSub: 'Boutiques vérifiées pour acheter et réparer',
    condNew: 'Neuf', condUsed: 'Occasion', condRefurb: 'Reconditionné',
    trustShopsTitle: 'Boutiques notées', trustShopsText: 'Classées par avis clients',
    trustRepairTitle: 'Réparation simple', trustRepairText: 'Réservez et suivez étape par étape',
    trustOffersTitle: 'Offres fraîches', trustOffersText: 'Nouvelles offres régulièrement',
    trustNearbyTitle: 'Boutiques proches', trustNearbyText: 'Trouvez une boutique près de chez vous',
    emptyProductsText: 'De nouveaux appareils arrivent bientôt. Revenez vite ou parcourez tout le catalogue.',
    emptyShopsText: 'De nouvelles boutiques nous rejoignent chaque jour. Découvrez celles disponibles.',
    exploreDevices: 'Parcourir les appareils', exploreShops: 'Découvrir les boutiques',
    retry: 'Réessayer', loadFailedTitle: 'Impossible de charger cette section',
    loadFailedText: 'Un problème est survenu de notre côté. Veuillez réessayer dans un instant.',
    offlineTitle: 'Vous êtes hors ligne', offlineText: 'Vérifiez votre connexion. Nous actualiserons dès votre retour en ligne.',
    backOnline: 'De retour en ligne',
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
    acceptAll: 'Accept all', rejectAll: 'Reject optional', customize: 'Customize', back: 'Back', save: 'Save choices',
    necessary: 'Necessary', necessaryDesc: 'Required for sign-in, your cart and security. Always on.',
    analytics: 'Analytics', analyticsDesc: 'Helps us understand how the site is used so we can improve it.',
    marketing: 'Marketing', marketingDesc: 'Used to show you offers and content that match your interests.',
  },
  ar: {
    title: 'خصوصيتك تهمنا',
    text: 'نستخدم ملفات تعريف الارتباط لتشغيل الموقع وتذكّر تفضيلاتك وفهم كيفية استخدامه. يمكنك قبول الكل أو رفض الاختيارية أو تحديد ما تسمح به.',
    acceptAll: 'قبول الكل', rejectAll: 'رفض الاختيارية', customize: 'تخصيص', back: 'رجوع', save: 'حفظ الاختيارات',
    necessary: 'الضرورية', necessaryDesc: 'مطلوبة لتسجيل الدخول والسلة والأمان. مفعّلة دائمًا.',
    analytics: 'التحليلات', analyticsDesc: 'تساعدنا على فهم استخدام الموقع لتحسينه.',
    marketing: 'التسويق', marketingDesc: 'تُستخدم لعرض عروض ومحتوى يناسب اهتماماتك.',
  },
  fr: {
    title: 'Votre vie privée compte',
    text: "Nous utilisons des cookies pour faire fonctionner le site, mémoriser vos préférences et comprendre son utilisation. Vous pouvez tout accepter, refuser les cookies facultatifs ou choisir.",
    acceptAll: 'Tout accepter', rejectAll: 'Refuser les facultatifs', customize: 'Personnaliser', back: 'Retour', save: 'Enregistrer mes choix',
    necessary: 'Nécessaires', necessaryDesc: 'Indispensables à la connexion, au panier et à la sécurité. Toujours actifs.',
    analytics: 'Statistiques', analyticsDesc: "Nous aident à comprendre l'utilisation du site pour l'améliorer.",
    marketing: 'Marketing', marketingDesc: 'Servent à vous proposer des offres et contenus adaptés à vos intérêts.',
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
const numFormats = {};
const num = (language, n) => {
  const locale = NUMBER_LOCALE[language] || 'en';
  const fmt = (numFormats[locale] ||= new Intl.NumberFormat(locale));
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

const SAVED_KEY = 'nb_saved_products';
const SAVED_MAX = 500;

const readSaved = () => {
  try {
    const v = JSON.parse(window.localStorage.getItem(SAVED_KEY) || '[]');
    if (!Array.isArray(v)) return [];
    return v.filter((x) => (typeof x === 'string' && x.length <= 64) || Number.isFinite(x)).slice(-SAVED_MAX);
  } catch {
    return [];
  }
};

const useSavedProducts = () => {
  const [ids, setIds] = useState(readSaved);
  const toggle = useCallback((id) => {
    if ((typeof id !== 'string' || id.length > 64) && !Number.isFinite(id)) return;
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-SAVED_MAX);
      try { window.localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);
  const set = useMemo(() => new Set(ids), [ids]);
  return [set, toggle];
};

const useOnline = () => {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
};

const RAIL_LIMIT = 8;
const CATEGORY_LIMIT = 10;
const LOW_STOCK_LIMIT = 5;
const TOP_LIMIT = 4;
const LATEST_SHOPS_LIMIT = 8;
const DEAL_LIMIT = 4;
const SHOPS_FETCH_SIZE = 100;
const STATS_STALE = 5 * 60 * 1000;
const WARM_LIMIT = 8;
const EMPTY_LIST = [];
const EMPTY_OBJECT = {};
const COUNT_FORMAT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const round2 = (n) => Math.round(n * 100) / 100;
const stagger = (i, step = 60, max = 5) => Math.min(i, max) * step;
const retryPolicy = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const STATS_SOURCES = {
  orders: ['/api/users/orders'],
  repairs: ['/api/users/repair-request'],
};
const STATS_DONE = { orders: 'DELIVERED', repairs: 'DEVICE_DELIVERED' };
const STATS_PAGE_SIZE = 1000;

const GRID = 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5';
const SHOP_GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5';

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
  const rating = Math.min(Math.max(Number(p.rating ?? p.averageRating) || 0, 0), 5);
  const reviews = Math.max(0, Number(p.reviewCount ?? p.ratingCount ?? p.reviewsCount) || 0);
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
    _cond: String(p.condition ?? p.productCondition ?? '').trim().toUpperCase(),
    _snippet: snippet(p.description, 140),
  };
};

const newestFirst = (list, limit) => {
  const timed = list.some((p) => p._ts > 0);
  return (timed ? [...list].sort((a, b) => b._ts - a._ts) : [...list].reverse()).slice(0, limit);
};

const latestOf = (catalog) => newestFirst(catalog, RAIL_LIMIT);
const latestShopsOf = (shops) => newestFirst(shops, LATEST_SHOPS_LIMIT);

const dealsOf = (catalog) =>
  catalog
    .filter((p) => p.saving > 0 && p.stock !== 0)
    .sort((a, b) => b.discount - a.discount || a.finalPrice - b.finalPrice)
    .slice(0, DEAL_LIMIT);

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

const CATEGORY_RULES = [
  [/laptop|notebook|macbook|ordinateur|computer|\bpc\b|لابتوب|حاسوب|كمبيوتر/, RiMacbookLine, 'indigo'],
  [/tablet|ipad|tablette|تابلت|لوحي|ايباد/, FiTablet, 'violet'],
  [/watch|wearable|smartband|montre|ساعه|ساعة|سوار/, FiWatch, 'rose'],
  [/speaker|haut-parleur|مكبر|سبيكر/, FiSpeaker, 'orange'],
  [/head|earbud|earphone|airpod|buds|audio|casque|ecouteur|سماع|صوتي/, FiHeadphones, 'teal'],
  [/microphone|\bmic\b|ميكروفون/, FiMic, 'rose'],
  [/camera|photo|lens|drone|appareil photo|كاميرا|تصوير/, FiCamera, 'amber'],
  [/television|\btv\b|smart tv|\btele\b|تلفزيون|تلفاز/, FiTv, 'sky'],
  [/monitor|screen|display|ecran|شاشه|شاشة|شاشات/, FiMonitor, 'cyan'],
  [/gam|console|playstation|xbox|nintendo|joystick|controller|jeux|jeu\b|العاب/, RiGamepadLine, 'violet'],
  [/print|scanner|طابع|imprim/, FiPrinter, 'slate'],
  [/router|network|wifi|wi-fi|modem|routeur|reseau|راوتر|شبكه|شبكة/, FiWifi, 'cyan'],
  [/storage|drive|\bssd\b|\bhdd\b|\busb\b|flash|memory|disk|stockage|disque|memoire|ذاكره|ذاكرة|تخزين/, FiHardDrive, 'slate'],
  [/charger|cable|power|battery|adapter|chargeur|batterie|شاحن|كابل|بطاريه|بطارية|باور/, FiBattery, 'amber'],
  [/cpu|gpu|processor|motherboard|\bram\b|component|composant|معالج|قطع/, FiCpu, 'indigo'],
  [/accessor|case|cover|housse|coque|اكسسوار|ملحقات|جراب|حافظه|حافظة/, FiBox, 'orange'],
  [/phone|mobile|smartphone|iphone|android|galaxy|telephone|portable|هاتف|جوال|موبايل|محمول|تليفون/, FiSmartphone, 'emerald'],
];

const CATEGORY_DEFAULT = [FiBox, 'emerald'];
const categoryIconCache = new Map();
const categoryIconFor = (name) => {
  const key = fold(name);
  if (categoryIconCache.has(key)) return categoryIconCache.get(key);
  const hit = CATEGORY_RULES.find(([re]) => re.test(key));
  const out = hit ? [hit[1], hit[2]] : CATEGORY_DEFAULT;
  categoryIconCache.set(key, out);
  return out;
};

const TILE_TONES = {
  emerald: {
    light: 'from-emerald-50 to-emerald-100 text-emerald-600 border-emerald-200 group-hover:border-emerald-500',
    dark: 'from-emerald-400/20 to-emerald-400/5 text-emerald-300 border-white/10 group-hover:border-emerald-300',
  },
  sky: {
    light: 'from-sky-50 to-sky-100 text-sky-600 border-sky-200 group-hover:border-sky-500',
    dark: 'from-sky-400/20 to-sky-400/5 text-sky-300 border-white/10 group-hover:border-sky-300',
  },
  violet: {
    light: 'from-violet-50 to-violet-100 text-violet-600 border-violet-200 group-hover:border-violet-500',
    dark: 'from-violet-400/20 to-violet-400/5 text-violet-300 border-white/10 group-hover:border-violet-300',
  },
  amber: {
    light: 'from-amber-50 to-amber-100 text-amber-600 border-amber-200 group-hover:border-amber-500',
    dark: 'from-amber-400/20 to-amber-400/5 text-amber-300 border-white/10 group-hover:border-amber-300',
  },
  rose: {
    light: 'from-rose-50 to-rose-100 text-rose-600 border-rose-200 group-hover:border-rose-500',
    dark: 'from-rose-400/20 to-rose-400/5 text-rose-300 border-white/10 group-hover:border-rose-300',
  },
  teal: {
    light: 'from-teal-50 to-teal-100 text-teal-600 border-teal-200 group-hover:border-teal-500',
    dark: 'from-teal-400/20 to-teal-400/5 text-teal-300 border-white/10 group-hover:border-teal-300',
  },
  indigo: {
    light: 'from-indigo-50 to-indigo-100 text-indigo-600 border-indigo-200 group-hover:border-indigo-500',
    dark: 'from-indigo-400/20 to-indigo-400/5 text-indigo-300 border-white/10 group-hover:border-indigo-300',
  },
  orange: {
    light: 'from-orange-50 to-orange-100 text-orange-600 border-orange-200 group-hover:border-orange-500',
    dark: 'from-orange-400/20 to-orange-400/5 text-orange-300 border-white/10 group-hover:border-orange-300',
  },
  cyan: {
    light: 'from-cyan-50 to-cyan-100 text-cyan-600 border-cyan-200 group-hover:border-cyan-500',
    dark: 'from-cyan-400/20 to-cyan-400/5 text-cyan-300 border-white/10 group-hover:border-cyan-300',
  },
  slate: {
    light: 'from-slate-50 to-slate-200 text-slate-600 border-slate-200 group-hover:border-slate-500',
    dark: 'from-slate-400/20 to-slate-400/5 text-slate-300 border-white/10 group-hover:border-slate-300',
  },
};

const makeObserveOnce = (options) => {
  let io;
  const callbacks = new WeakMap();
  return (el, cb) => {
    if (typeof IntersectionObserver === 'undefined') { cb(); return undefined; }
    io ||= new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const fn = callbacks.get(e.target);
        io.unobserve(e.target);
        callbacks.delete(e.target);
        fn?.();
      }
    }, options);
    callbacks.set(el, cb);
    io.observe(el);
    return () => { io.unobserve(el); callbacks.delete(el); };
  };
};

const observeOnce = makeObserveOnce({ rootMargin: '200px' });
const observeNear = makeObserveOnce({ rootMargin: '600px 0px' });
const observeReveal = makeObserveOnce({ rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

const useInView = (observe) => {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen || !ref.current) return undefined;
    return observe(ref.current, () => setSeen(true));
  }, [seen, observe]);
  return [ref, seen];
};

const useSeen = () => useInView(observeOnce);

const Reveal = memo(({ as: Tag = 'div', variant = 'up', delay = 0, className = '', children, ...rest }) => {
  const [ref, shown] = useInView(observeReveal);
  return (
    <Tag
      ref={ref}
      data-rv={variant}
      data-shown={shown ? '1' : '0'}
      style={delay ? { '--d': `${delay}ms` } : undefined}
      className={`hp-rv ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
});

const useShopLogo = (shop) => {
  const [ref, seen] = useSeen();
  const id = shop.id;
  const listLogo = shop._logo;
  const entry = listLogo ? undefined : readLogoEntry(id);
  const q = useQuery({
    queryKey: ['shop', id],
    queryFn: async ({ signal }) => {
      const res = await api.get(`/api/shops/${encodeURIComponent(id)}`, { signal });
      const src = shopLogoSrc(res.data);
      writeLogo(id, src);
      return src;
    },
    initialData: entry ? entry.u : undefined,
    initialDataUpdatedAt: entry ? entry.t : undefined,
    enabled: seen && !listLogo && id != null,
    staleTime: LOGO_STALE_MS,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  return [ref, listLogo || q.data || null];
};

const LAZY_SECTION =
  '[content-visibility:auto] [contain-intrinsic-size:auto_640px] transition-colors duration-500 motion-reduce:transition-none';

const DARK_PAGE = 'bg-[#141414]';
const DARK_ALT = 'bg-[#1a1a1a]';
const bgOf = (d, alt) => (d ? (alt ? DARK_ALT : DARK_PAGE) : alt ? 'bg-white' : 'bg-gray-50');

const HP_CSS = `
  html[data-hp-theme] { --hp-ease: cubic-bezier(.22, 1, .36, 1); }
  .hp-rv {
    transition:
      opacity .5s var(--hp-ease, cubic-bezier(.22, 1, .36, 1)) var(--d, 0ms),
      transform .5s var(--hp-ease, cubic-bezier(.22, 1, .36, 1)) var(--d, 0ms);
  }
  .hp-rv[data-shown="0"] { opacity: 0; transform: translate3d(0, 20px, 0); will-change: opacity, transform; }
  .hp-rv[data-shown="0"][data-rv="fade"]  { transform: translate3d(0, 12px, 0); }
  .hp-rv[data-shown="0"][data-rv="scale"] { transform: translate3d(0, 18px, 0) scale(.95); }
  .hp-rv[data-shown="0"][data-rv="start"] { transform: translate3d(-28px, 0, 0); }
  .hp-rv[data-shown="0"][data-rv="end"]   { transform: translate3d(28px, 0, 0); }
  [dir="rtl"] .hp-rv[data-shown="0"][data-rv="start"] { transform: translate3d(28px, 0, 0); }
  [dir="rtl"] .hp-rv[data-shown="0"][data-rv="end"]   { transform: translate3d(-28px, 0, 0); }
  .hp-rv[data-shown="1"] { opacity: 1; transform: none; }

  @keyframes hpHero { from { opacity: 0; transform: translate3d(0, 14px, 0); } to { opacity: 1; transform: none; } }
  .hp-hero-in { animation: hpHero .55s var(--hp-ease, cubic-bezier(.22, 1, .36, 1)) backwards; }
  .hp-tile { animation: hpHero .5s var(--hp-ease, cubic-bezier(.22, 1, .36, 1)) backwards; animation-delay: calc(var(--i, 0) * 45ms); }
  @keyframes hpFade { from { opacity: 0; } to { opacity: 1; } }
  .hp-fade-in { animation: hpFade .35s ease-out both; }
  @keyframes hpConsentIn { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: none; } }
  .hp-consent-in { animation: hpConsentIn 0.32s cubic-bezier(.2,.8,.2,1) both; }
  @keyframes hpBanner { from { opacity: 0; transform: translate(-50%, -12px); } to { opacity: 1; transform: translate(-50%, 0); } }
  .hp-banner-in { animation: hpBanner .3s var(--hp-ease, cubic-bezier(.22, 1, .36, 1)) both; }

  @keyframes hpFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes hpTwinkle { 0%, 100% { opacity: .35; transform: scale(.8); } 50% { opacity: 1; transform: scale(1.1); } }
  .hp-float { animation: hpFloat 4.2s ease-in-out infinite; }
  .hp-float-slow { animation: hpFloat 5.6s ease-in-out infinite; animation-delay: -1.6s; }
  .hp-twinkle { transform-box: fill-box; transform-origin: center; animation: hpTwinkle 2.8s ease-in-out infinite; }
  .hp-twinkle-b { transform-box: fill-box; transform-origin: center; animation: hpTwinkle 2.8s ease-in-out infinite; animation-delay: -1.4s; }

  .hp-progress {
    display: none; position: fixed; inset-block-start: 0; inset-inline: 0; height: 3px; z-index: 1000;
    background: var(--sb-thumb, #34d399); transform: scaleX(0); transform-origin: 0 50%; pointer-events: none;
  }
  [dir="rtl"] .hp-progress { transform-origin: 100% 50%; }
  @keyframes hpProgress { to { transform: scaleX(1); } }
  @supports (animation-timeline: scroll()) {
    .hp-progress { display: block; animation: hpProgress linear both; animation-timeline: scroll(root block); }
  }
  @media (prefers-reduced-motion: no-preference) {
    html[data-hp-theme] { scroll-behavior: smooth; }
  }

  html[data-hp-theme] { --sb-thumb: #34d399; --sb-thumb-hover: #6ee7b7; --sb-track: #e8ebe9; color-scheme: light; }
  html[data-hp-theme="dark"] { --sb-thumb: #39ff88; --sb-thumb-hover: #86ffb4; --sb-track: #1e1e1e; color-scheme: dark; }
  @supports (scrollbar-color: auto) {
    html[data-hp-theme], .hp-sb { scrollbar-width: thin; scrollbar-color: var(--sb-thumb) var(--sb-track); }
  }
  html[data-hp-theme]::-webkit-scrollbar { width: 12px; height: 12px; }
  .hp-sb::-webkit-scrollbar { width: 8px; height: 8px; }
  html[data-hp-theme]::-webkit-scrollbar-track, .hp-sb::-webkit-scrollbar-track { background: var(--sb-track); }
  html[data-hp-theme]::-webkit-scrollbar-corner, .hp-sb::-webkit-scrollbar-corner { background: var(--sb-track); }
  html[data-hp-theme]::-webkit-scrollbar-thumb, .hp-sb::-webkit-scrollbar-thumb {
    background: var(--sb-thumb); border-radius: 9999px; border: 2px solid var(--sb-track);
  }
  html[data-hp-theme]::-webkit-scrollbar-thumb:hover, .hp-sb::-webkit-scrollbar-thumb:hover { background: var(--sb-thumb-hover); }
  .hp-shine, .hp-shine-g { position: relative; overflow: hidden; isolation: isolate; }
  .hp-shine::after, .hp-shine-g::after {
    content: ''; position: absolute; inset-block: 0; inset-inline-start: -70%; width: 45%; pointer-events: none;
    background: linear-gradient(100deg, transparent, rgba(255,255,255,.38), transparent);
    transform: skewX(-20deg) translateX(0);
    transition: transform .65s var(--hp-ease, cubic-bezier(.22, 1, .36, 1));
  }
  @media (hover: hover) {
    .hp-shine:hover:not(:disabled)::after, .group:hover .hp-shine-g::after { transform: skewX(-20deg) translateX(480%); }
    [dir="rtl"] .hp-shine:hover:not(:disabled)::after, [dir="rtl"] .group:hover .hp-shine-g::after { transform: skewX(20deg) translateX(-480%); }
  }
  @keyframes hpPop { 0% { transform: scale(.3); opacity: 0; } 60% { transform: scale(1.25); opacity: 1; } 100% { transform: scale(1); } }
  .hp-pop { animation: hpPop .35s cubic-bezier(.34, 1.56, .64, 1) both; }
  @keyframes hpHeart { 0% { transform: scale(1); } 40% { transform: scale(1.35); } 100% { transform: scale(1); } }
  .hp-heart { animation: hpHeart .3s ease-out; }
  @keyframes hpShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
  .hp-shimmer {
    background-image: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.22) 50%, transparent 100%);
    background-size: 200% 100%; animation: hpShimmer 1.3s linear infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .hp-pop, .hp-shimmer, .hp-heart { animation: none; }
    .hp-float, .hp-float-slow, .hp-twinkle, .hp-twinkle-b { animation: none; }
    .hp-shine::after, .hp-shine-g::after { transition: none; }
    .hp-consent-in, .hp-hero-in, .hp-fade-in, .hp-progress, .hp-tile, .hp-banner-in { animation: none; }
    .hp-progress { display: none; }
    .hp-rv { transition: none; }
    .hp-rv[data-shown="0"] { opacity: 1; transform: none; will-change: auto; }
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

const THEME_VARS = {
  light: '[--acc:#10b981] [--acc-ink:#022c22]',
  dark: '[--acc:#39ff88] [--acc-ink:#022c22]',
};

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const BTN =
  `hp-shine inline-flex min-h-11 cursor-pointer select-none items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold tracking-[0.01em] ` +
  `transition-[transform,box-shadow,background-color,border-color,color,filter] duration-200 ease-[cubic-bezier(.22,1,.36,1)] ` +
  `[@media(hover:hover)]:hover:-translate-y-0.5 active:translate-y-0 active:scale-[.96] motion-reduce:transition-none motion-reduce:transform-none ` +
  `disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${FOCUS}`;
const BTN_PRIMARY = `${BTN} bg-[color:var(--acc)] text-[color:var(--acc-ink)] shadow-[0_6px_16px_-8px_var(--acc)] [@media(hover:hover)]:hover:shadow-[0_12px_24px_-10px_var(--acc)] hover:brightness-105`;
const btnGhost = (d) => `${BTN} border-2 ${d ? 'border-white/20 text-white hover:border-[#39ff88] hover:bg-white/5' : 'border-gray-300 text-emerald-950 hover:border-emerald-500 hover:bg-emerald-50'}`;

const ICON_BTN =
  `inline-flex flex-shrink-0 cursor-pointer items-center justify-center rounded-full transition-[transform,background-color] duration-200 ease-[cubic-bezier(.22,1,.36,1)] ` +
  `active:scale-90 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;

const lineOf = (d) => (d ? 'border-white/10' : 'border-gray-200');
const inkOf = (d) => (d ? 'text-white' : 'text-emerald-950');
const mutedOf = (d) => (d ? 'text-neutral-400' : 'text-gray-600');
const bodyOf = (d) => (d ? 'text-neutral-300' : 'text-gray-700');
const skBase = (d) => (d ? 'bg-[#2a2a2a]' : 'bg-gray-200/70');

const cardCls = (d) =>
  'group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border ' +
  'transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ' +
  '[@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-xl ' +
  (d ? 'border-white/10 bg-[#1e1e1e] hover:border-[#39ff88]' : 'border-gray-200 bg-white hover:border-emerald-500');

const productCardCls = (d) =>
  'group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border ' +
  'transition-[transform,border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ' +
  'active:scale-[.98] [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-xl [@media(hover:hover)]:hover:shadow-black/10 ' +
  (d
    ? 'border-white/10 bg-[#1e1e1e] text-white [@media(hover:hover)]:hover:border-[#39ff88]'
    : 'border-gray-200 bg-white text-emerald-950 [@media(hover:hover)]:hover:border-emerald-500/60 [@media(hover:hover)]:hover:bg-emerald-50/40');

const PRODUCT_IMG_W = 480;
const PRODUCT_IMG_H = 384;
const PRODUCT_MEDIA = 'relative aspect-[5/4] w-full flex-shrink-0 overflow-hidden bg-white [contain:layout_paint]';
const PRODUCT_LINK =
  'outline-none after:absolute after:inset-0 after:z-[1] focus-visible:after:outline focus-visible:after:outline-[3px] ' +
  'focus-visible:after:-outline-offset-4 focus-visible:after:outline-[color:var(--acc)]';

const Sk = memo(({ darkMode, className = '' }) => (
  <div aria-hidden="true" className={`hp-shimmer ${skBase(darkMode)} ${className}`} />
));

const ProductCardSkeleton = memo(({ darkMode }) => (
  <div aria-hidden="true" className={`flex h-full flex-col overflow-hidden rounded-2xl border ${lineOf(darkMode)} ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
    <Sk darkMode={darkMode} className="aspect-[5/4] w-full" />
    <div className="flex flex-col gap-2.5 p-3.5">
      <Sk darkMode={darkMode} className="h-5 w-1/3 rounded" />
      <Sk darkMode={darkMode} className="h-3.5 w-full rounded" />
      <Sk darkMode={darkMode} className="h-3.5 w-3/4 rounded" />
      <Sk darkMode={darkMode} className="h-3 w-1/2 rounded" />
    </div>
  </div>
));

const ShopCardSkeleton = memo(({ darkMode }) => (
  <div aria-hidden="true" className={`flex h-full flex-col overflow-hidden rounded-xl border ${lineOf(darkMode)} ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
    <Sk darkMode={darkMode} className="h-40 w-full sm:h-44" />
    <div className="flex flex-col gap-3 p-4">
      <Sk darkMode={darkMode} className="h-4 w-2/3 rounded" />
      <Sk darkMode={darkMode} className="h-3 w-4/5 rounded" />
      <Sk darkMode={darkMode} className="h-3 w-full rounded" />
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Sk darkMode={darkMode} className="h-8 rounded-lg" />
        <Sk darkMode={darkMode} className="h-8 rounded-lg" />
      </div>
      <Sk darkMode={darkMode} className="h-6 w-full rounded" />
    </div>
  </div>
));

const TileSkeleton = memo(({ darkMode, round = 'rounded-3xl' }) => (
  <div aria-hidden="true" className="flex w-28 shrink-0 flex-col items-center gap-2 p-2 sm:w-32 lg:w-auto lg:min-w-0 lg:flex-1">
    <Sk darkMode={darkMode} className={`h-20 w-20 sm:h-24 sm:w-24 ${round}`} />
    <Sk darkMode={darkMode} className="h-3.5 w-4/5 rounded" />
  </div>
));

const SkeletonGrid = memo(({ darkMode, count, variant = 'product', grid = GRID }) => {
  const Card = variant === 'shop' ? ShopCardSkeleton : ProductCardSkeleton;
  return (
    <div className={grid} role="status" aria-busy="true">
      {Array.from({ length: count }, (_, i) => <Card key={i} darkMode={darkMode} />)}
    </div>
  );
});

const TileRowSkeleton = memo(({ darkMode, round }) => (
  <div className="flex gap-2 overflow-hidden" role="status" aria-busy="true">
    {Array.from({ length: 8 }, (_, i) => <TileSkeleton key={i} darkMode={darkMode} round={round} />)}
  </div>
));

const Band = memo(({ darkMode, alt, sectionRef, visible, label, className = '', children }) => (
  <section
    ref={sectionRef}
    aria-label={label}
    className={`py-10 sm:py-14 ${LAZY_SECTION} ${visible === false ? 'anim-paused' : ''} ${bgOf(darkMode, alt)} ${className}`}
  >
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
  </section>
));

const StoreHead = memo(({ title, subtitle, to, ctaLabel, darkMode, isAr }) => (
  <Reveal className="mb-6 sm:mb-8">
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="h-8 w-1.5 shrink-0 rounded-full bg-[color:var(--acc)]" />
      <h2 className={`min-w-0 text-xl font-extrabold [text-wrap:balance] sm:text-3xl ${isAr ? 'leading-[1.4]' : 'tracking-[-0.02em]'} ${inkOf(darkMode)}`}>{title}</h2>
      <span aria-hidden="true" className={`hidden h-px flex-1 border-t sm:block ${lineOf(darkMode)}`} />
      {to && (
        <Link to={to} className={`ms-auto inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-extrabold transition-[background-color,border-color,color,transform] duration-200 active:scale-95 motion-reduce:transition-none sm:ms-0 ${FOCUS} ${darkMode ? 'border-[#39ff88]/40 text-[#39ff88] hover:bg-[#39ff88] hover:text-[#022c22]' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-600 hover:text-white'}`}>
          {ctaLabel}<FiArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      )}
    </div>
    {subtitle && <p className={`mt-2 ps-[18px] text-sm font-medium sm:text-base ${mutedOf(darkMode)}`}>{subtitle}</p>}
  </Reveal>
));

const ErrorState = memo(({ darkMode, language, onRetry, retrying, compact }) => {
  const online = useOnline();
  const Icon = online ? FiAlertTriangle : FiWifiOff;
  return (
    <div
      role="alert"
      className={`hp-fade-in flex flex-col items-center gap-3 rounded-2xl border px-5 text-center ${compact ? 'py-6' : 'py-10 sm:py-12'} ${
        darkMode ? 'border-rose-400/30 bg-[#1e1e1e]' : 'border-rose-200 bg-white'
      }`}
    >
      <span aria-hidden="true" className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className={`max-w-md text-lg font-extrabold [text-wrap:balance] ${inkOf(darkMode)}`}>{tr(language, online ? 'loadFailedTitle' : 'offlineTitle')}</h3>
      <p className={`max-w-md text-sm font-medium leading-relaxed ${mutedOf(darkMode)}`}>{tr(language, online ? 'loadFailedText' : 'offlineText')}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} disabled={retrying} aria-busy={retrying} className={`${BTN_PRIMARY} mt-1`}>
          <FiRefreshCw aria-hidden="true" className={`h-4 w-4 ${retrying ? 'animate-spin motion-reduce:animate-none' : ''}`} />
          {tr(language, 'retry')}
        </button>
      )}
    </div>
  );
});

class SectionBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  reset() {
    if (this.props.onRetry) this.props.onRetry();
    this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.silent) return null;
    const { darkMode, language, alt } = this.props;
    return (
      <Band darkMode={darkMode} alt={alt} className="!py-8">
        <ErrorState darkMode={darkMode} language={language} onRetry={this.reset} compact />
      </Band>
    );
  }
}

const LazyMount = memo(({ children, darkMode, alt, minHeight = 360, onShow }) => {
  const [ref, seen] = useInView(observeNear);
  useEffect(() => { if (seen) onShow?.(); }, [seen, onShow]);
  return (
    <div ref={ref} className={seen ? undefined : bgOf(darkMode, alt)} style={seen ? undefined : { minHeight }}>
      {seen ? <div className="hp-fade-in">{children}</div> : null}
    </div>
  );
});

const ConnectionBanner = memo(({ darkMode, language }) => {
  const online = useOnline();
  const [showBack, setShowBack] = useState(false);
  const wasOffline = useRef(false);
  useEffect(() => {
    if (!online) { wasOffline.current = true; setShowBack(false); return undefined; }
    if (!wasOffline.current) return undefined;
    wasOffline.current = false;
    setShowBack(true);
    const id = setTimeout(() => setShowBack(false), 2600);
    return () => clearTimeout(id);
  }, [online]);
  if (online && !showBack) return null;
  const Icon = online ? FiCheck : FiWifiOff;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`hp-banner-in fixed start-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[1090] flex max-w-[92vw] items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-extrabold shadow-xl ${
        online
          ? 'border-emerald-400/40 bg-emerald-600 text-white'
          : darkMode ? 'border-white/15 bg-[#262626] text-white' : 'border-gray-200 bg-white text-emerald-950'
      }`}
      style={{ transform: 'translateX(-50%)' }}
    >
      <Icon aria-hidden="true" className={`h-4 w-4 flex-shrink-0 ${online ? '' : 'text-rose-500'}`} />
      <span className="truncate">{tr(language, online ? 'backOnline' : 'offlineTitle')}</span>
    </div>
  );
});

const CardFooter = memo(({ label, darkMode }) => (
  <div className={`mt-auto flex items-center justify-between gap-3 border-t pt-3 ${lineOf(darkMode)}`}>
    <span className={`truncate text-sm font-extrabold ${inkOf(darkMode)}`}>{label}</span>
    <span
      aria-hidden="true"
      className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--acc)] text-[color:var(--acc-ink)] shadow-[0_4px_12px_-4px_var(--acc)] transition-transform duration-200 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-1 rtl:[@media(hover:hover)]:group-hover:-translate-x-1"
    >
      <FiArrowRight className="h-4 w-4 rtl:rotate-180" />
    </span>
  </div>
));

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
      {kind === 'phone' && (
        <g transform="translate(70 14)">
          <rect x="6" y="7" width="60" height="108" rx="13" fill={side} />
          <rect width="60" height="108" rx="13" fill={body} />
          <rect x="4" y="4" width="52" height="100" rx="10" fill={screen} />
          <rect x="22" y="8" width="16" height="4" rx="2" fill="#022C22" />
          <rect x="12" y="24" width="36" height="7" rx="3.5" fill={darkMode ? neon : '#fff'} opacity="0.9" />
          <rect x="12" y="62" width="36" height="28" rx="8" fill="#fff" opacity="0.25" />
        </g>
      )}
      {kind === 'laptop' && (
        <g transform="translate(34 24)">
          <rect x="5" y="6" width="126" height="78" rx="9" fill={side} />
          <rect width="126" height="78" rx="9" fill={body} />
          <rect x="5" y="5" width="116" height="68" rx="6" fill={screen} />
          <rect x="14" y="14" width="46" height="7" rx="3.5" fill={darkMode ? neon : '#fff'} opacity="0.9" />
          <rect x="-10" y="84" width="146" height="12" rx="6" fill={body} />
          <rect x="52" y="84" width="22" height="4" rx="2" fill={darkMode ? neon : '#6EE7B7'} />
        </g>
      )}
      {kind === 'tablet' && (
        <g transform="translate(46 18)">
          <rect x="6" y="6" width="100" height="100" rx="14" fill={side} />
          <rect width="100" height="100" rx="14" fill={body} />
          <rect x="5" y="5" width="90" height="90" rx="10" fill={screen} />
          <rect x="16" y="18" width="40" height="8" rx="4" fill={darkMode ? neon : '#fff'} opacity="0.9" />
          <rect x="16" y="56" width="26" height="24" rx="6" fill="#fff" opacity="0.25" />
        </g>
      )}
      {kind === 'watch' && (
        <g transform="translate(70 6)">
          <rect x="14" y="0" width="32" height="30" rx="6" fill={side} />
          <rect x="14" y="94" width="32" height="30" rx="6" fill={side} />
          <rect y="0" width="56" height="62" rx="18" fill={body} />
          <rect x="5" y="5" width="46" height="52" rx="13" fill={screen} />
          <circle cx="28" cy="31" r="13" fill="none" stroke={darkMode ? neon : '#fff'} strokeWidth="3" opacity="0.9" />
        </g>
      )}
      {kind === 'audio' && (
        <g transform="translate(40 14)">
          <path d="M12 66V50a48 48 0 0196 0v16" fill="none" stroke={body} strokeWidth="8" strokeLinecap="round" />
          <rect x="-3" y="58" width="26" height="46" rx="12" fill={body} />
          <rect x="3" y="70" width="14" height="30" rx="7" fill={screen} />
          <rect x="97" y="58" width="26" height="46" rx="12" fill={body} />
          <rect x="103" y="70" width="14" height="30" rx="7" fill={screen} />
        </g>
      )}
    </svg>
  );
});

const Sparkle = ({ x, y, s = 1, fill, className }) => (
  <path
    className={className}
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 -9 C1 -3 3 -1 9 0 C3 1 1 3 0 9 C-1 3 -3 1 -9 0 C-3 -1 -1 -3 0 -9 Z"
    fill={fill}
  />
);

const EmptyArt = memo(({ kind, darkMode }) => {
  const p = useId().replace(/:/g, '');
  const accent = darkMode ? '#39FF88' : '#10B981';
  const accentDeep = darkMode ? '#17C964' : '#047857';
  const accentSoft = darkMode ? '#39FF88' : '#6EE7B7';
  const surface = darkMode ? '#2E2E2E' : '#FFFFFF';
  const surfaceLow = darkMode ? '#1E1E1E' : '#ECFDF5';
  const stroke = darkMode ? '#4B4B4B' : '#A7F3D0';
  const ink = '#022C22';
  const orange = darkMode ? '#FB923C' : '#F97316';
  return (
    <svg viewBox="0 0 240 180" className="h-40 w-auto sm:h-48" role="img" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${p}glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={accent} stopOpacity={darkMode ? 0.28 : 0.3} />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={surface} />
          <stop offset="1" stopColor={surfaceLow} />
        </linearGradient>
        <linearGradient id={`${p}acc`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={accentSoft} />
          <stop offset="1" stopColor={accentDeep} />
        </linearGradient>
      </defs>

      <circle cx="120" cy="88" r="86" fill={`url(#${p}glow)`} />
      <circle cx="120" cy="88" r="70" fill="none" stroke={stroke} strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
      <ellipse cx="120" cy="156" rx="64" ry="7" fill={darkMode ? '#000' : '#064E3B'} opacity={darkMode ? 0.45 : 0.14} />

      {kind === 'shops' ? (
        <g>
          <g className="hp-float">
            <rect x="58" y="42" width="124" height="14" rx="7" fill={`url(#${p}acc)`} />
            <rect x="62" y="54" width="116" height="26" fill={accent} />
            <rect x="91" y="54" width="29" height="26" fill={surface} />
            <rect x="149" y="54" width="29" height="26" fill={surface} />
            <circle cx="76.5" cy="80" r="14.5" fill={accent} />
            <circle cx="105.5" cy="80" r="14.5" fill={surface} />
            <circle cx="134.5" cy="80" r="14.5" fill={accent} />
            <circle cx="163.5" cy="80" r="14.5" fill={surface} />
            <rect x="66" y="82" width="108" height="64" rx="8" fill={`url(#${p}body)`} stroke={stroke} strokeWidth="2" />
            <path d="M66 94h108" stroke={stroke} strokeWidth="2" />
            <rect x="108" y="102" width="24" height="44" rx="5" fill={`url(#${p}acc)`} />
            <circle cx="127" cy="125" r="1.8" fill={ink} />
            <rect x="76" y="102" width="24" height="22" rx="5" fill={accentSoft} opacity={darkMode ? 0.25 : 0.55} stroke={stroke} strokeWidth="1.5" />
            <rect x="140" y="102" width="24" height="22" rx="5" fill={accentSoft} opacity={darkMode ? 0.25 : 0.55} stroke={stroke} strokeWidth="1.5" />
            <path d="M81 110l9-3M81 117l12-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          </g>
          <g className="hp-float-slow">
            <rect x="150" y="14" width="46" height="26" rx="13" fill={surface} stroke={stroke} strokeWidth="2" />
            <path d="M166 40l-2 8 9-8z" fill={surface} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
            <path d="M169 27.5c0-2.2-1.7-3.5-3.4-3.5-1.4 0-2.4.8-2.8 1.6-.4-.8-1.4-1.6-2.8-1.6-1.7 0-3.4 1.3-3.4 3.5 0 3 6.2 6.5 6.2 6.5s6.2-3.5 6.2-6.5z" transform="translate(7 0)" fill={orange} />
          </g>
          <g className="hp-float-slow">
            <rect x="34" y="104" width="22" height="42" rx="6" fill="none" />
            <path d="M44 146v-18" stroke={accentDeep} strokeWidth="3" strokeLinecap="round" />
            <path d="M44 132c-10-1-14-8-13-16 9 0 14 6 13 16z" fill={accent} />
            <path d="M44 128c8-1 13-7 12-14-8 0-13 5-12 14z" fill={accentDeep} />
            <path d="M36 146h16l-2 10H38z" fill={orange} />
          </g>
        </g>
      ) : (
        <g>
          <g className="hp-float-slow">
            <g transform="rotate(-9 78 100)">
              <rect x="48" y="70" width="64" height="62" rx="10" fill={`url(#${p}body)`} stroke={stroke} strokeWidth="2" />
              <rect x="56" y="78" width="48" height="26" rx="6" fill={accentSoft} opacity={darkMode ? 0.22 : 0.6} />
              <circle cx="70" cy="91" r="6" fill={accent} />
              <path d="M62 102l10-8 8 6 9-9 7 11z" fill={accentDeep} opacity="0.55" />
              <rect x="56" y="110" width="34" height="5" rx="2.5" fill={stroke} />
              <rect x="56" y="119" width="22" height="5" rx="2.5" fill={stroke} />
            </g>
          </g>
          <g className="hp-float">
            <rect x="92" y="22" width="64" height="116" rx="15" fill={`url(#${p}acc)`} />
            <rect x="89" y="18" width="64" height="116" rx="15" fill={`url(#${p}body)`} stroke={ink} strokeWidth="2.5" />
            <rect x="95" y="25" width="52" height="102" rx="10" fill={darkMode ? '#141414' : '#F0FDF4'} />
            <rect x="109" y="29" width="24" height="5" rx="2.5" fill={ink} />
            <rect x="101" y="42" width="40" height="8" rx="4" fill={accent} />
            <rect x="101" y="56" width="26" height="5" rx="2.5" fill={stroke} />
            <rect x="101" y="70" width="18" height="18" rx="5" fill={accentSoft} opacity={darkMode ? 0.4 : 0.7} />
            <rect x="123" y="70" width="18" height="18" rx="5" fill={accent} opacity="0.85" />
            <rect x="101" y="94" width="40" height="22" rx="7" fill={accent} opacity={darkMode ? 0.18 : 0.14} stroke={accent} strokeWidth="1.5" strokeDasharray="3 4" />
            <path d="M121 99v12M115 105h12" stroke={accentDeep} strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <g className="hp-float">
            <circle cx="168" cy="112" r="17" fill={surface} fillOpacity={darkMode ? 0.92 : 0.85} stroke={ink} strokeWidth="2.5" />
            <circle cx="168" cy="112" r="11" fill="none" stroke={accent} strokeWidth="2" opacity="0.6" />
            <path d="M180 124l12 12" stroke={ink} strokeWidth="5" strokeLinecap="round" />
            <path d="M180 124l12 12" stroke={accent} strokeWidth="2" strokeLinecap="round" />
            <path d="M163 112h10" stroke={accentDeep} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>
      )}

      <Sparkle x={36} y={52} s={0.9} fill={accent} className="hp-twinkle" />
      <Sparkle x={204} y={78} s={0.7} fill={orange} className="hp-twinkle-b" />
      <Sparkle x={196} y={142} s={0.55} fill={accent} className="hp-twinkle" />
      <Sparkle x={52} y={156} s={0.5} fill={orange} className="hp-twinkle-b" />
      <circle cx="212" cy="40" r="3" fill={accentSoft} className="hp-twinkle" />
      <circle cx="26" cy="96" r="2.5" fill={accent} className="hp-twinkle-b" />
    </svg>
  );
});

const EMPTY_DOTS = {
  light: { backgroundImage: 'radial-gradient(rgba(16,185,129,.18) 1.4px, transparent 1.4px)', backgroundSize: '20px 20px' },
  dark: { backgroundImage: 'radial-gradient(rgba(57,255,136,.12) 1.4px, transparent 1.4px)', backgroundSize: '20px 20px' },
};

const EmptyState = memo(({ kind, title, text, ctaLabel, to, darkMode }) => (
  <div
    style={EMPTY_DOTS[darkMode ? 'dark' : 'light']}
    className={`hp-fade-in flex flex-col items-center gap-3 rounded-2xl border border-dashed px-5 py-10 text-center sm:py-14 ${
      darkMode ? 'border-[#39ff88]/40 bg-[#1e1e1e]' : 'border-emerald-300 bg-white/70'
    }`}
  >
    <EmptyArt kind={kind} darkMode={darkMode} />
    <h3 className={`max-w-md text-lg font-extrabold [text-wrap:balance] sm:text-2xl ${inkOf(darkMode)}`}>{title}</h3>
    <p className={`max-w-md text-sm font-medium leading-relaxed sm:text-base ${mutedOf(darkMode)}`}>{text}</p>
    {to && (
      <Link to={to} className={`${BTN_PRIMARY} mt-2`}>
        {ctaLabel}
        <FiArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      </Link>
    )}
  </div>
));

const RankBadge = memo(({ rank, language }) => (
  <span
    aria-hidden="true"
    className="absolute start-0 top-0 z-[2] flex h-8 min-w-[2rem] items-center justify-center rounded-ee-xl bg-[color:var(--acc)] px-2 text-sm font-black leading-none tabular-nums text-[color:var(--acc-ink)]"
  >
    <span dir="ltr">#{num(language, rank)}</span>
  </span>
));

const BENEFITS = [
  [FiShield, 'trustShops'],
  [FiTool, 'trustRepair'],
  [FiTag, 'trustOffers'],
  [FiMapPin, 'trustNearby'],
];

const BenefitsBar = memo(({ darkMode, language }) => (
  <section className={`${darkMode ? DARK_PAGE : 'bg-gray-50'} pt-6 sm:pt-8 ${LAZY_SECTION}`}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal>
        <ul className={`grid grid-cols-2 overflow-hidden rounded-xl border lg:grid-cols-4 ${lineOf(darkMode)} ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
          {BENEFITS.map(([Icon, key], i) => (
            <li
              key={key}
              className={`flex items-center gap-3 p-3.5 sm:p-4 ${lineOf(darkMode)} ${i % 2 === 0 ? 'border-e' : ''} ${i < 2 ? 'border-b lg:border-b-0' : ''} ${i === 1 ? 'lg:border-e' : ''}`}
            >
              <span aria-hidden="true" className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--acc)] text-[color:var(--acc-ink)]">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className={`truncate text-sm font-extrabold ${inkOf(darkMode)}`}>{tr(language, `${key}Title`)}</h3>
                <p className={`line-clamp-2 text-xs font-medium ${mutedOf(darkMode)}`}>{tr(language, `${key}Text`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  </section>
));

const CookieSwitch = memo(({ checked, onChange, disabled, label, darkMode }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={onChange}
    className={`relative h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS} ${
      checked ? 'bg-[color:var(--acc)]' : darkMode ? 'bg-neutral-600' : 'bg-gray-300'
    }`}
  >
    <span
      aria-hidden="true"
      className={`absolute start-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
        checked ? 'ltr:translate-x-5 rtl:-translate-x-5' : ''
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

  const ink = inkOf(darkMode);
  const muted = bodyOf(darkMode);
  const panel = darkMode ? 'border-white/10 bg-[#1e1e1e] text-white' : 'border-gray-200 bg-white text-emerald-950';
  const linkBtn = `min-h-11 cursor-pointer text-center text-sm font-extrabold underline decoration-[color:var(--acc)] decoration-2 underline-offset-4 ${FOCUS} ${ink}`;

  return (
    <div className={`hp-fade-in fixed inset-0 z-[1100] flex items-end justify-center bg-black/60 p-4 sm:items-center ${THEME_VARS[darkMode ? 'dark' : 'light']}`}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={`hp-consent-in hp-sb max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border p-5 shadow-2xl sm:p-6 ${panel}`}
      >
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--acc)] text-[color:var(--acc-ink)]">
            <RiCookieLine className="h-6 w-6" />
          </span>
          <h2 id={titleId} className={`text-xl font-extrabold sm:text-2xl ${ink}`}>{ctr(language, 'title')}</h2>
        </div>

        <p id={descId} className={`mt-4 text-sm font-medium leading-relaxed sm:text-base ${muted}`}>{ctr(language, 'text')}</p>

        {custom && (
          <ul className="mt-5 space-y-3">
            {COOKIE_OPTIONS.map(([key, labelKey, descKey, locked]) => (
              <li key={key} className={`hp-fade-in flex items-start justify-between gap-4 rounded-xl border p-3 ${lineOf(darkMode)} ${darkMode ? 'bg-[#141414]' : 'bg-gray-50'}`}>
                <div className="min-w-0">
                  <p className={`text-sm font-extrabold ${ink}`}>{ctr(language, labelKey)}</p>
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

        <div className="mt-6 grid gap-3">
          {custom ? (
            <>
              <button ref={primaryRef} type="button" onClick={saveChoices} className={BTN_PRIMARY}>{ctr(language, 'save')}</button>
              <button type="button" onClick={rejectAll} className={btnGhost(darkMode)}>{ctr(language, 'rejectAll')}</button>
              <button type="button" onClick={toggleCustom} className={linkBtn}>{ctr(language, 'back')}</button>
            </>
          ) : (
            <>
              <button ref={primaryRef} type="button" onClick={acceptAll} className={BTN_PRIMARY}>{ctr(language, 'acceptAll')}</button>
              <button type="button" onClick={rejectAll} className={btnGhost(darkMode)}>{ctr(language, 'rejectAll')}</button>
              <button type="button" onClick={toggleCustom} className={linkBtn}>{ctr(language, 'customize')}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

const CategoryTile = memo(({ category, count, showCount, index, darkMode, language }) => {
  const id = safeId(category.id);
  const [Icon, tone] = useMemo(() => categoryIconFor(category.name), [category.name]);
  if (!id) return null;
  const toneCls = TILE_TONES[tone][darkMode ? 'dark' : 'light'];
  return (
    <div
      style={{ '--i': Math.min(index, 8) }}
      className="hp-tile w-28 shrink-0 snap-start sm:w-32 lg:w-auto lg:min-w-0 lg:flex-1"
    >
      <Link
        to={`/products/category/${id}`}
        aria-label={category.name}
        className={`group flex w-full flex-col items-center gap-2 rounded-2xl p-2 text-center ${FOCUS}`}
      >
        <span
          className={`relative grid h-20 w-20 place-items-center rounded-3xl border bg-gradient-to-br shadow-sm transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none sm:h-24 sm:w-24 [@media(hover:hover)]:group-hover:-translate-y-1.5 [@media(hover:hover)]:group-hover:shadow-lg ${toneCls}`}
        >
          <Icon aria-hidden="true" className="h-9 w-9 transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none sm:h-10 sm:w-10 [@media(hover:hover)]:group-hover:scale-110 [@media(hover:hover)]:group-hover:-rotate-6" />
        </span>
        <span className={`line-clamp-1 w-full text-sm font-extrabold ${inkOf(darkMode)}`}>{category.name}</span>
        {showCount && (
          <span className={`text-xs font-semibold ${mutedOf(darkMode)}`}>
            <span dir="ltr" className="tabular-nums">{count}</span> {tr(language, count === 1 ? 'homeItemSingular' : 'homeItemPlural')}
          </span>
        )}
      </Link>
    </div>
  );
});

const CategorySection = memo(({ categories, counts, showCount, loading, failed, onRetry, retrying, darkMode, language }) => {
  const top = useMemo(
    () => [...categories].sort((a, b) => (counts[String(b.id)] || 0) - (counts[String(a.id)] || 0)).slice(0, CATEGORY_LIMIT),
    [categories, counts],
  );
  if (!loading && !failed && top.length === 0) return null;
  return (
    <Band darkMode={darkMode} label={tr(language, 'homeCategoriesTitle')}>
      <StoreHead darkMode={darkMode} isAr={language === 'ar'} title={tr(language, 'homeCategoriesTitle')} subtitle={tr(language, 'homeCategoriesSub')} />
      {loading ? (
        <TileRowSkeleton darkMode={darkMode} />
      ) : failed && top.length === 0 ? (
        <ErrorState darkMode={darkMode} language={language} onRetry={onRetry} retrying={retrying} compact />
      ) : (
        <div className="hp-sb -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
          {top.map((c, i) => (
            <CategoryTile key={c.id} category={c} index={i} count={counts[String(c.id)] || 0} showCount={showCount} darkMode={darkMode} language={language} />
          ))}
        </div>
      )}
    </Band>
  );
});

const PROMO_PATTERNS = {
  light: {
    green: {
      backgroundImage:
        'radial-gradient(rgba(16,185,129,.28) 1.5px, transparent 1.5px), linear-gradient(135deg, rgba(16,185,129,.10) 0%, rgba(16,185,129,0) 55%)',
      backgroundSize: '18px 18px, 100% 100%',
    },
    orange: {
      backgroundImage:
        'radial-gradient(rgba(249,115,22,.28) 1.5px, transparent 1.5px), linear-gradient(135deg, rgba(249,115,22,.10) 0%, rgba(249,115,22,0) 55%)',
      backgroundSize: '18px 18px, 100% 100%',
    },
  },
  dark: {
    green: {
      backgroundImage:
        'radial-gradient(rgba(57,255,136,.16) 1.5px, transparent 1.5px), linear-gradient(135deg, rgba(57,255,136,.10) 0%, rgba(57,255,136,0) 55%)',
      backgroundSize: '18px 18px, 100% 100%',
    },
    orange: {
      backgroundImage:
        'radial-gradient(rgba(251,146,60,.18) 1.5px, transparent 1.5px), linear-gradient(135deg, rgba(251,146,60,.12) 0%, rgba(251,146,60,0) 55%)',
      backgroundSize: '18px 18px, 100% 100%',
    },
  },
};

const PROMO_SURFACE = {
  light: 'bg-white',
  dark: 'bg-[#1e1e1e]',
};

const PROMO_TONES = {
  green: {
    light: { ring: 'border-emerald-200 hover:border-emerald-500', btn: 'bg-emerald-600 group-hover:bg-emerald-700' },
    dark: { ring: 'border-white/10 hover:border-[#39ff88]', btn: 'bg-emerald-600 group-hover:bg-emerald-500' },
  },
  orange: {
    light: { ring: 'border-orange-200 hover:border-orange-500', btn: 'bg-orange-600 group-hover:bg-orange-700' },
    dark: { ring: 'border-white/10 hover:border-orange-400', btn: 'bg-orange-600 group-hover:bg-orange-500' },
  },
};

const PromoBanner = memo(({ to, title, text, cta, scene, tone, variant, delay, darkMode }) => {
  const mode = darkMode ? 'dark' : 'light';
  const t = PROMO_TONES[tone][mode];
  return (
    <Reveal variant={variant} delay={delay} className="h-full">
      <Link
        to={to}
        style={PROMO_PATTERNS[mode][tone]}
        className={`group relative flex h-full min-h-[200px] items-center justify-between gap-4 overflow-hidden rounded-2xl border p-6 shadow-sm transition-[box-shadow,border-color] duration-300 motion-reduce:transition-none sm:min-h-[230px] sm:p-8 [@media(hover:hover)]:hover:shadow-xl ${PROMO_SURFACE[mode]} ${t.ring} ${FOCUS}`}
      >
        <div className="relative z-[1] min-w-0 max-w-[62%]">
          <h3 className={`text-2xl font-extrabold leading-tight [text-wrap:balance] sm:text-3xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
          <p className={`mt-2 line-clamp-3 text-sm font-medium sm:text-base ${darkMode ? 'text-neutral-300' : 'text-gray-600'}`}>{text}</p>
          <span className={`hp-shine-g mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-extrabold !text-white shadow-lg transition-[transform,background-color,box-shadow] duration-200 [@media(hover:hover)]:group-hover:translate-x-1 rtl:[@media(hover:hover)]:group-hover:-translate-x-1 ${t.btn}`}>
            <span className="text-white">{cta}</span>
          </span>
        </div>
        <div aria-hidden="true" className="relative z-[1] w-[38%] max-w-[220px] shrink-0 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105">
          <IsoIllustration type={scene} onGreen={false} darkMode={darkMode} className="h-full w-full" />
        </div>
      </Link>
    </Reveal>
  );
});

const BannerSection = memo(({ darkMode, language }) => (
  <Band darkMode={darkMode} label={tr(language, 'todayPrompt')} className="!py-6 sm:!py-8">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
      <PromoBanner
        to="/repair" scene="repairCard" tone="green" variant="start" delay={0} darkMode={darkMode}
        title={tr(language, 'repairDevice')} text={tr(language, 'repairDescription')} cta={tr(language, 'bookRepair')}
      />
      <PromoBanner
        to="/offers" scene="offersCard" tone="orange" variant="end" delay={120} darkMode={darkMode}
        title={tr(language, 'latestOffers')} text={tr(language, 'offersDescription')} cta={tr(language, 'viewOffers')}
      />
    </div>
  </Band>
));

const ProductCard = memo(({ product, darkMode, language, isSaved, onSave, onAddToCart }) => {
  const imgRef = useRef(null);
  const [failed, setFailed] = useState(() => isImgBad(product.imageUrl));
  const [loaded, setLoaded] = useState(() => isImgOk(product.imageUrl));
  const [btn, setBtn] = useState('idle');
  const timer = useRef();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);
  useEffect(() => {
    setFailed(isImgBad(product.imageUrl));
    setLoaded(isImgOk(product.imageUrl));
  }, [product.imageUrl]);
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      markImg(product.imageUrl, 'ok');
      setLoaded(true);
    }
  }, [product.imageUrl, failed]);

  const id = safeId(product.id);
  const name = clean(product.name, 120) || tr(language, 'product');
  const out = typeof product.stock === 'number' && product.stock <= 0;
  const low = typeof product.stock === 'number' && product.stock > 0 && product.stock <= LOW_STOCK_LIMIT;
  const hasDiscount = product.saving > 0;
  const hasRating = product.rating > 0;
  const showImage = !!product.imageUrl && !failed;

  const handleError = useCallback(() => { markImg(product.imageUrl, 'bad'); setFailed(true); }, [product.imageUrl]);
  const handleLoad = useCallback(() => { markImg(product.imageUrl, 'ok'); setLoaded(true); }, [product.imageUrl]);
  const handleSave = useCallback(() => onSave(product.id), [onSave, product.id]);
  const handleCart = useCallback(async () => {
    if (out || btn === 'adding') return;
    setBtn('adding');
    const ok = await onAddToCart(product);
    if (!mounted.current) return;
    setBtn(ok ? 'added' : 'idle');
    if (ok) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => mounted.current && setBtn('idle'), 1400);
    }
  }, [out, btn, onAddToCart, product]);

  const ink = inkOf(darkMode);
  const muted = mutedOf(darkMode);
  const deal = darkMode ? 'text-orange-400' : 'text-orange-700';
  const alert = darkMode ? 'text-rose-400' : 'text-rose-600';
  const saveLabel = tr(language, isSaved ? 'saved' : 'save');

  return (
    <article aria-label={name} className={productCardCls(darkMode)}>
      <div className={PRODUCT_MEDIA}>
        {showImage ? (
          <>
            {!loaded && <div aria-hidden="true" className="hp-shimmer absolute inset-0 bg-black/5" />}
            <img
              ref={imgRef}
              src={product.imageUrl} alt={name} width={PRODUCT_IMG_W} height={PRODUCT_IMG_H}
              loading="lazy" decoding="async" fetchPriority="low" referrerPolicy="no-referrer"
              onLoad={handleLoad}
              onError={handleError}
              className={`absolute inset-0 h-full w-full object-contain p-4 transition-[opacity,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'} ${out ? 'grayscale' : ''}`}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <ProductFallbackArt name={name} categoryName={product.categoryName} label={tr(language, 'deviceLabel')} darkMode={false} />
          </div>
        )}

        {hasDiscount && product.discount >= 1 && (
          <span dir="ltr" className="absolute start-2.5 top-2.5 z-10 rounded-full bg-orange-600 px-2.5 py-1 text-[11px] font-extrabold tabular-nums text-white">
            -{Math.round(product.discount)}%
          </span>
        )}

        <button
          type="button"
          onClick={handleSave}
          aria-pressed={isSaved}
          aria-label={saveLabel}
          title={saveLabel}
          className={`${ICON_BTN} absolute end-2.5 top-2.5 z-10 h-9 w-9 bg-white text-emerald-950 shadow-md shadow-black/10 hover:bg-emerald-50`}
        >
          <FiHeart key={String(isSaved)} aria-hidden="true" className={`h-4 w-4 ${isSaved ? 'hp-heart text-rose-500' : ''}`} fill={isSaved ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          onClick={handleCart}
          disabled={out || btn === 'adding'}
          aria-label={tr(language, 'addToCart')}
          title={tr(language, 'addToCart')}
          className={`${ICON_BTN} absolute bottom-2.5 end-2.5 z-10 h-10 w-10 bg-emerald-600 text-white shadow-lg shadow-black/25 hover:bg-emerald-500`}
        >
          {btn === 'adding' ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
            : btn === 'added' ? <FiCheck aria-hidden="true" className="hp-pop h-5 w-5" /> : <FiPlus aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:p-3.5">
        <div className="min-w-0" dir="ltr">
          {hasDiscount && (
            <p className={`text-[11px] tabular-nums line-through ${muted}`}>
              <span className="sr-only">{tr(language, 'originalPrice')}: </span>{money(product.price)}
            </p>
          )}
          <p className={`truncate text-base font-extrabold leading-tight tabular-nums sm:text-lg ${hasDiscount ? deal : ink}`}>
            <span className="sr-only">{hasDiscount ? `${tr(language, 'discountedPrice')}: ` : ''}</span>{money(product.finalPrice)}
          </p>
        </div>

        <h3 className={`line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug ${ink}`} title={name}>
          {id ? <Link to={`/device/${id}`} className={PRODUCT_LINK}>{name}</Link> : name}
        </h3>

        <p className={`line-clamp-1 text-xs leading-5 ${muted}`}>{product._snippet || tr(language, 'noProductDescription')}</p>

        {hasRating && (
          <p className={`flex items-center gap-1 text-xs font-bold ${ink}`} dir="ltr">
            <RiStarFill className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
            <span className="tabular-nums">{product.rating.toFixed(1)}</span>
            {product.reviews > 0 && <span className={`font-medium tabular-nums ${muted}`}>({COUNT_FORMAT.format(product.reviews)})</span>}
          </p>
        )}

        {out ? (
          <p className={`flex items-center gap-1.5 text-xs font-bold ${alert}`}>
            <FiAlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span>{tr(language, 'outOfStock')}</span>
          </p>
        ) : low ? (
          <p className={`flex items-center gap-1.5 text-xs font-medium ${bodyOf(darkMode)}`}>
            <FiAlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-orange-500" aria-hidden="true" />
            <span>{tr(language, 'onlyLeft', { count: product.stock })}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
});

const SHOP_MEDIA = 'relative h-40 w-full flex-shrink-0 overflow-hidden [contain:layout_paint] sm:h-44';
const ShopMedia = memo(({ shop, darkMode }) => {
  const imgRef = useRef(null);
  const [mediaRef, logo] = useShopLogo(shop);
  const [failed, setFailed] = useState(() => isImgBad(logo));
  const [loaded, setLoaded] = useState(() => isImgOk(logo));

  useEffect(() => {
    setFailed(isImgBad(logo));
    setLoaded(isImgOk(logo));
  }, [logo]);

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      markImg(logo, 'ok');
      setLoaded(true);
    }
  }, [logo, failed]);

  const handleError = useCallback(() => { markImg(logo, 'bad'); setFailed(true); }, [logo]);
  const handleLoad = useCallback(() => { markImg(logo, 'ok'); setLoaded(true); }, [logo]);
  const showLogo = !!logo && !failed;
  const bg = showLogo ? 'bg-white' : darkMode ? 'bg-[#262626]' : 'bg-gray-100';
  return (
    <div ref={mediaRef} className={`${SHOP_MEDIA} ${bg}`}>
      {showLogo ? (
        <>
          {!loaded && <div aria-hidden="true" className="hp-shimmer absolute inset-0 bg-black/5" />}
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
            className={`absolute inset-0 h-full w-full object-contain p-4 transition-[opacity,transform] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      ) : (
        <div className="flex h-full w-full items-end justify-center px-4 pt-4">
          <StorefrontIllustration className="pointer-events-none h-full w-auto max-w-full transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none group-hover:scale-105" />
        </div>
      )}
    </div>
  );
});

const STAT_ITEMS = [
  [FiPackage, 'statOrders', 'orders'],
  [FiTool, 'statRepairs', 'repairs'],
];

const formatStat = (value) => (value > 0 ? `${COUNT_FORMAT.format(value)}+` : COUNT_FORMAT.format(value));

const ShopStats = memo(({ orders, repairs, loading, darkMode, language }) => {
  const values = { orders, repairs };
  const surface = darkMode ? 'bg-[#141414]' : 'bg-gray-50';
  const icon = darkMode ? 'text-[#39ff88]' : 'text-emerald-600';
  return (
    <dl className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-1 lg:grid-cols-2">
      {STAT_ITEMS.map(([Icon, key, field]) => {
        const value = values[field];
        return (
          <div key={key} className={`flex min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 ${lineOf(darkMode)} ${surface}`}>
            <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${icon}`} aria-hidden="true" />
            <dt className={`min-w-0 flex-1 truncate text-[11px] font-bold ${bodyOf(darkMode)}`}>{tr(language, key)}</dt>
            <dd dir="ltr" className={`flex-shrink-0 text-sm font-black leading-none tabular-nums ${inkOf(darkMode)}`}>
              {value == null && loading
                ? <span className={`hp-shimmer inline-block h-3.5 w-6 rounded ${darkMode ? 'bg-white/15' : 'bg-black/10'}`} />
                : value == null ? '—' : <span className="hp-fade-in">{formatStat(value)}</span>}
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

const ShopCard = memo(({ shop, rank, stats, statsLoading, darkMode, language, onOpen }) => {
  const open = useCallback(() => onOpen(shop), [onOpen, shop]);
  const handleKey = useCallback((e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }, [open]);
  const hasRating = shop.rating > 0;
  const tel = phoneHref(shop.phone);
  const neonText = darkMode ? 'text-[#39ff88]' : 'text-emerald-600';
  const amber = darkMode ? 'text-amber-300' : 'text-amber-700';
  const body = bodyOf(darkMode);
  return (
    <article
      onClick={open}
      onKeyDown={handleKey}
      tabIndex={0}
      aria-label={rank ? `${tr(language, 'rankLabel', { n: rank })}: ${shop.name || ''}` : shop.name}
      className={`cursor-pointer ${FOCUS} ${cardCls(darkMode)}`}
    >
      {rank ? <RankBadge rank={rank} language={language} /> : null}
      <ShopMedia shop={shop} darkMode={darkMode} />

      <div className={`flex min-w-0 flex-1 flex-col border-t p-4 ${lineOf(darkMode)}`}>
        <div className="flex flex-1 flex-col gap-2.5 pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`min-w-0 text-base font-extrabold leading-snug ${inkOf(darkMode)}`}>
              <span className="line-clamp-1">{shop.name || tr(language, 'unnamedShop')}</span>
            </h3>
            {hasRating && (
              <span className={`flex flex-shrink-0 items-center gap-1 text-sm font-extrabold ${amber}`}>
                <RiStarFill className="h-4 w-4" aria-hidden="true" /><span dir="ltr" className="tabular-nums">{shop.rating.toFixed(1)}</span>
                {shop.reviews > 0 && <span dir="ltr" className={`text-xs font-medium tabular-nums ${body}`}>({COUNT_FORMAT.format(shop.reviews)})</span>}
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
            <a href={tel} onClick={(e) => e.stopPropagation()} className={`flex min-h-6 min-w-0 items-center gap-1.5 text-xs font-bold transition-colors duration-200 ${darkMode ? 'text-neutral-200 hover:text-[#39ff88]' : 'text-gray-800 hover:text-emerald-600'}`}>
              <FiPhone className={`h-3.5 w-3.5 flex-shrink-0 ${neonText}`} aria-hidden="true" /><span className="truncate" dir="ltr">{shop.phone}</span>
            </a>
          )}
          <p className={`line-clamp-2 min-h-[2.25rem] text-xs font-medium leading-relaxed ${body}`}>{shop._snippet || tr(language, 'shopDescription')}</p>
        </div>
        <ShopStats
          orders={statOf(shop, stats, 'orders')} repairs={statOf(shop, stats, 'repairs')}
          loading={statsLoading} darkMode={darkMode} language={language}
        />
        <CardFooter label={tr(language, 'visitShop')} darkMode={darkMode} />
      </div>
    </article>
  );
});

const ShopBadge = memo(({ shop, index, darkMode }) => {
  const [ref, logo] = useShopLogo(shop);
  const [bad, setBad] = useState(false);
  useEffect(() => { setBad(false); }, [logo]);
  const id = safeId(shop.id);
  if (!id) return null;
  const initial = String(shop.name || '?').trim().charAt(0).toUpperCase();
  return (
    <div
      style={{ '--i': Math.min(index, 8) }}
      className="hp-tile w-28 shrink-0 snap-start sm:w-32 lg:w-auto lg:min-w-0 lg:flex-1"
    >
      <Link
        ref={ref}
        to={`/shops/${id}`}
        aria-label={shop.name}
        className={`group flex w-full flex-col items-center gap-2 rounded-xl p-2 text-center ${FOCUS}`}
      >
        <span className={`grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 bg-white transition-[transform,border-color] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none sm:h-24 sm:w-24 ${darkMode ? 'border-white/10 group-hover:border-[#39ff88]' : 'border-gray-200 group-hover:border-emerald-500'} [@media(hover:hover)]:group-hover:-translate-y-1`}>
          {logo && !bad ? (
            <img src={logo} alt="" width={96} height={96} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)} className="h-full w-full object-contain p-2" />
          ) : (
            <span aria-hidden="true" className="text-3xl font-black text-emerald-700">{initial}</span>
          )}
        </span>
        <span className={`line-clamp-1 w-full text-xs font-extrabold sm:text-sm ${inkOf(darkMode)}`}>{shop.name}</span>
      </Link>
    </div>
  );
});

const ShopsTrustSection = memo(({ shops, loading, failed, darkMode, language }) => {
  if (failed || (!loading && shops.length === 0)) return null;
  return (
    <Band darkMode={darkMode} label={tr(language, 'shopsTrustTitle')}>
      <StoreHead
        darkMode={darkMode} isAr={language === 'ar'}
        title={tr(language, 'shopsTrustTitle')} subtitle={tr(language, 'shopsTrustSub')}
        to="/shops" ctaLabel={tr(language, 'viewAllShops')}
      />
      {loading ? (
        <TileRowSkeleton darkMode={darkMode} round="rounded-full" />
      ) : (
        <div className="hp-sb -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
          {shops.map((s, i) => <ShopBadge key={s.id} shop={s} index={i} darkMode={darkMode} />)}
        </div>
      )}
    </Band>
  );
});

const TopRatedSection = memo(({ shops, stats, statsLoading, loading, failed, darkMode, language, onOpen }) => {
  const [sectionRef, visible] = useOnScreen();
  if (failed || (!loading && shops.length === 0)) return null;
  return (
    <Band darkMode={darkMode} alt sectionRef={sectionRef} visible={visible} label={tr(language, 'topRatedTitle')}>
      <StoreHead darkMode={darkMode} isAr={language === 'ar'} title={tr(language, 'topRatedTitle')} subtitle={tr(language, 'topRatedSub')} />
      {loading ? <SkeletonGrid darkMode={darkMode} count={TOP_LIMIT} variant="shop" grid={SHOP_GRID} /> : (
        <ol className={SHOP_GRID}>
          {shops.map((s, i) => (
            <Reveal as="li" key={s.id} delay={stagger(i, 60)} className="h-full min-w-0">
              <ShopCard
                shop={s} rank={i + 1} stats={stats} statsLoading={statsLoading}
                darkMode={darkMode} language={language} onOpen={onOpen}
              />
            </Reveal>
          ))}
        </ol>
      )}
    </Band>
  );
});

const ShopsSection = memo(({ shops, stats, statsLoading, loading, failed, onRetry, retrying, darkMode, language, onOpen }) => {
  const [sectionRef, visible] = useOnScreen();
  return (
    <Band darkMode={darkMode} sectionRef={sectionRef} visible={visible} label={tr(language, 'topShops')}>
      <StoreHead
        darkMode={darkMode} isAr={language === 'ar'}
        title={tr(language, 'topShops')} subtitle={tr(language, 'shopsSubtitle')}
        to="/shops" ctaLabel={tr(language, 'viewAllShops')}
      />
      {loading ? <SkeletonGrid darkMode={darkMode} count={LATEST_SHOPS_LIMIT} variant="shop" grid={SHOP_GRID} />
        : failed ? <ErrorState darkMode={darkMode} language={language} onRetry={onRetry} retrying={retrying} />
        : shops.length === 0 ? (
          <EmptyState
            kind="shops" darkMode={darkMode}
            title={tr(language, 'noShops')} text={tr(language, 'emptyShopsText')}
            to="/shops" ctaLabel={tr(language, 'exploreShops')}
          />
        )
        : (
          <div className={SHOP_GRID}>
            {shops.map((s, i) => (
              <Reveal key={s.id} delay={stagger(i % 4, 50)} className="h-full min-w-0">
                <ShopCard shop={s} stats={stats} statsLoading={statsLoading} darkMode={darkMode} language={language} onOpen={onOpen} />
              </Reveal>
            ))}
          </div>
        )}
    </Band>
  );
});

const ProductSection = memo(({
  title, subtitle, products, loading, failed, errorHost, onRetry, retrying, cta, alt, emptyLabel, skeletonCount = 4,
  darkMode, language, saved, onSave, onAddToCart,
}) => {
  const [secRef, visible] = useOnScreen();
  if (failed && products.length === 0) {
    if (!errorHost) return null;
    return (
      <Band darkMode={darkMode} alt={alt} sectionRef={secRef} visible={visible} label={title}>
        <StoreHead darkMode={darkMode} isAr={language === 'ar'} title={title} subtitle={subtitle} to={cta?.to} ctaLabel={cta?.label} />
        <ErrorState darkMode={darkMode} language={language} onRetry={onRetry} retrying={retrying} />
      </Band>
    );
  }
  if (!loading && products.length === 0 && !emptyLabel) return null;
  return (
    <Band darkMode={darkMode} alt={alt} sectionRef={secRef} visible={visible} label={title}>
      <StoreHead
        darkMode={darkMode} isAr={language === 'ar'} title={title} subtitle={subtitle}
        to={cta?.to} ctaLabel={cta?.label}
      />
      {loading ? <SkeletonGrid darkMode={darkMode} count={skeletonCount} />
        : products.length === 0 ? (
          <EmptyState
            kind="products" darkMode={darkMode}
            title={emptyLabel} text={tr(language, 'emptyProductsText')}
            to="/devices" ctaLabel={tr(language, 'exploreDevices')}
          />
        )
        : (
          <ul className={GRID}>
            {products.map((p, i) => (
              <Reveal as="li" key={p.id} delay={stagger(i % 4, 50)} className="h-full min-w-0">
                <ProductCard
                  product={p} darkMode={darkMode} language={language}
                  isSaved={saved.has(p.id)} onSave={onSave} onAddToCart={onAddToCart}
                />
              </Reveal>
            ))}
          </ul>
        )}
    </Band>
  );
});

const OffersLoader = memo(({ darkMode, language }) => {
  const [attempt, setAttempt] = useState(0);
  const Offers = useMemo(() => makeOffersSlider(), [attempt]);
  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  return (
    <SectionBoundary key={attempt} darkMode={darkMode} language={language} onRetry={retry}>
      <Suspense fallback={<div aria-hidden="true" className={`hp-shimmer h-64 w-full ${skBase(darkMode)}`} />}>
        <Reveal variant="fade">
          <Offers darkMode={darkMode} />
        </Reveal>
      </Suspense>
    </SectionBoundary>
  );
});

const HomepageContent = memo(({ darkMode }) => {
  const language = useAppLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';

  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const [saved, toggleSaved] = useSavedProducts();
  const [lowerSeen, setLowerSeen] = useState(false);
  const markLowerSeen = useCallback(() => setLowerSeen(true), []);

  useEffect(() => { document.title = tr(language, 'pageTitle'); }, [language]);

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.hpTheme = darkMode ? 'dark' : 'light';
    return () => { delete el.dataset.hpTheme; };
  }, [darkMode]);

  useEffect(() => {
    const warm = () => { loadService().catch(() => { }); loadComponents().catch(() => { }); };
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
    }).catch(() => { });
  }, [navigate]);

  const {
    data, isLoading: queryLoading, isError: homeError, isFetching: homeFetching, refetch: refetchHome,
  } = useQuery({
    queryKey: ['homeData', userId ?? 'anon'],
    enabled: !!accessToken,
    queryFn: async ({ signal }) => {
      const [shopRes, productRes] = await Promise.allSettled([
        api.get('/api/users/shops/all', { params: { page: 0, size: SHOPS_FETCH_SIZE }, signal }),
        api.get('/api/products', { signal }),
      ]);
      const shopsFailed = shopRes.status === 'rejected';
      const productsFailed = productRes.status === 'rejected';
      if (shopsFailed && productsFailed) throw shopRes.reason;
      const list = productsFailed ? [] : (productRes.value.data?.content || productRes.value.data || []);
      const catalog = (Array.isArray(list) ? list : []).filter((p) => p && !p.deleted).map(normalizeProduct);
      const rawShops = shopsFailed ? [] : (shopRes.value.data?.content || (Array.isArray(shopRes.value.data) ? shopRes.value.data : []));
      const shops = rawShops.filter(Boolean).map(normalizeShop);
      const counts = {};
      for (const p of catalog) if (p.categoryId != null) counts[String(p.categoryId)] = (counts[String(p.categoryId)] || 0) + 1;
      return {
        counts,
        productsFailed,
        shopsFailed,
        latestProducts: latestOf(catalog),
        dealProducts: dealsOf(catalog),
        topShops: topShopsOf(shops),
        latestShops: latestShopsOf(shops),
      };
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: retryPolicy,
  });
  const isLoading = !!accessToken && queryLoading;

  const {
    data: categories = EMPTY_LIST, isLoading: categoriesLoading, isError: categoriesError,
    isFetching: categoriesFetching, refetch: refetchCategories,
  } = useQuery({
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
    retry: retryPolicy,
  });

  const categoryCounts = data?.counts || EMPTY_OBJECT;
  const products = data?.latestProducts || EMPTY_LIST;
  const deals = data?.dealProducts || EMPTY_LIST;
  const topShops = data?.topShops || EMPTY_LIST;
  const latestShops = data?.latestShops || EMPTY_LIST;
  const productsFailed = homeError || !!data?.productsFailed;
  const shopsFailed = homeError || !!data?.shopsFailed;

  useEffect(() => {
    const urls = [];
    for (const p of deals) if (p.imageUrl) urls.push(p.imageUrl);
    for (const p of products) if (p.imageUrl) urls.push(p.imageUrl);
    if (!urls.length) return undefined;
    return warmImages([...new Set(urls)].slice(0, WARM_LIMIT));
  }, [products, deals]);

  const needsStats = useMemo(
    () => topShops.some((s) => s._orders == null || s._repairs == null) || latestShops.some((s) => s._orders == null || s._repairs == null),
    [topShops, latestShops],
  );

  const { data: shopStats = EMPTY_OBJECT, isLoading: statsQueryLoading } = useQuery({
    queryKey: ['homeShopStats', userId ?? 'anon'],
    enabled: !!accessToken && needsStats && lowerSeen,
    queryFn: ({ signal }) => fetchShopStats(signal),
    staleTime: STATS_STALE,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const statsLoading = needsStats && lowerSeen && statsQueryLoading;

  const showTop = useBackToTop();
  const scrollToTop = useCallback(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  const retryHome = useCallback(() => { refetchHome(); }, [refetchHome]);
  const retryCategories = useCallback(() => { refetchCategories(); }, [refetchCategories]);

  const handleAddToCart = useCallback(async (product) => {
    if (product?.id == null) return false;
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
      const serverMsg = clean(err?.response?.data?.message, 120);
      toast({ icon: 'error', title: tr(language, 'errorTitle'), text: serverMsg || tr(language, 'addToCartFailed'), timer: 3500 });
      return false;
    }
  }, [navigate, language]);

  const openShop = useCallback((s) => {
    const id = safeId(s.id);
    if (id) navigate(`/shops/${id}`);
  }, [navigate]);

  const guard = { darkMode, language };

  return (
    <div
      dir={languageDirection(language)}
      className={`min-h-screen transition-colors duration-500 motion-reduce:transition-none ${THEME_VARS[darkMode ? 'dark' : 'light']} ${isAr ? 'font-cairo' : 'font-jakarta'} ${darkMode ? `${DARK_PAGE} text-white` : 'bg-gray-50 text-gray-900'}`}
    >
      <Device3DStyles />
      <style>{EXTRAS_CSS}</style>
      <Defs3D />
      <Toaster darkMode={darkMode} />
      <ConnectionBanner darkMode={darkMode} language={language} />

      <div aria-hidden="true" className="hp-progress" />

      <div className="hp-hero-in">
        <SectionBoundary silent {...guard}>
          <Hero variant="home" darkMode={darkMode} />
        </SectionBoundary>
      </div>

      <SectionBoundary {...guard}>
        <CategorySection
          categories={categories} counts={categoryCounts} showCount={!!data}
          loading={categoriesLoading} failed={categoriesError} onRetry={retryCategories} retrying={categoriesFetching}
          darkMode={darkMode} language={language}
        />
      </SectionBoundary>

      <SectionBoundary {...guard}>
        <BannerSection darkMode={darkMode} language={language} />
      </SectionBoundary>

      <SectionBoundary {...guard}>
        <ProductSection
          skeletonCount={DEAL_LIMIT}
          title={tr(language, 'dealsTitle')} subtitle={tr(language, 'dealsSub')}
          products={deals} loading={isLoading} failed={productsFailed} errorHost onRetry={retryHome} retrying={homeFetching}
          cta={{ to: '/offers', label: tr(language, 'viewOffers') }}
          darkMode={darkMode} language={language} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart}
        />
      </SectionBoundary>

      <SectionBoundary alt {...guard}>
        <ProductSection
          alt skeletonCount={RAIL_LIMIT}
          title={tr(language, 'tabsTitle')} subtitle={tr(language, 'tabsSub')}
          products={products} loading={isLoading} failed={productsFailed} emptyLabel={tr(language, 'noProducts')}
          darkMode={darkMode} language={language} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart}
        />
      </SectionBoundary>

      <LazyMount darkMode={darkMode} minHeight={320}>
        <SectionBoundary {...guard}>
          <ShopsTrustSection shops={latestShops} loading={isLoading} failed={shopsFailed} darkMode={darkMode} language={language} />
        </SectionBoundary>
      </LazyMount>

      <LazyMount darkMode={darkMode} alt minHeight={520} onShow={markLowerSeen}>
        <SectionBoundary alt {...guard}>
          <TopRatedSection
            shops={topShops} stats={shopStats} statsLoading={statsLoading}
            loading={isLoading} failed={shopsFailed} darkMode={darkMode} language={language} onOpen={openShop}
          />
        </SectionBoundary>
      </LazyMount>

      <LazyMount darkMode={darkMode} minHeight={520}>
        <SectionBoundary {...guard}>
          <ShopsSection
            shops={latestShops} stats={shopStats} statsLoading={statsLoading}
            loading={isLoading} failed={shopsFailed} onRetry={retryHome} retrying={homeFetching}
            darkMode={darkMode} language={language} onOpen={openShop}
          />
        </SectionBoundary>
      </LazyMount>

      <LazyMount darkMode={darkMode} minHeight={260}>
        <OffersLoader darkMode={darkMode} language={language} />
      </LazyMount>

      <div
        className={`fixed bottom-5 end-5 z-40 transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
          showTop ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible translate-y-4 scale-90 opacity-0'
        }`}
      >
        <Btn3D onClick={scrollToTop} aria-label={tr(language, 'backToTop')} className="h-11 w-11">
          <FiArrowUp className="h-5 w-5" />
        </Btn3D>
      </div>

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