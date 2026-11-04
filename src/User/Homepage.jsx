import React, {
  useState, useRef, useEffect, useCallback, memo, useMemo, useId, Suspense, lazy,
} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiArrowRight, FiMapPin, FiPhone, FiPlus, FiCheck, FiArrowUp, FiAlertCircle,
  FiPackage, FiTool, FiShield, FiTag, FiHeart, FiAlertTriangle, FiRefreshCw, FiWifiOff,
  FiWatch, FiSpeaker, FiWifi, FiHardDrive, FiCpu, FiBattery, FiMic, FiBox,
  FiChevronLeft, FiChevronRight, FiZap, FiStar, FiTruck,
} from 'react-icons/fi';
import {
  RiStarFill, RiCookieLine, RiMacbookFill, RiGamepadFill, RiSmartphoneFill, RiTabletFill,
  RiTv2Fill, RiHeadphoneFill, RiCamera3Fill, RiComputerFill, RiPrinterFill,
} from 'react-icons/ri';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import poppins400 from '@fontsource/poppins/files/poppins-latin-400-normal.woff2';
import poppins600 from '@fontsource/poppins/files/poppins-latin-600-normal.woff2';
import poppins700 from '@fontsource/poppins/files/poppins-latin-700-normal.woff2';
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
import { Defs3D, Device3DStyles, useOnScreen, money } from '../components/user/Device3D';
import {
  safeImageUrl, StorefrontIllustration, loadSwal, clean, useBackToTop,
} from '../components/user/ListingKit';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import { IsoIllustration } from '../components/user/IsoIllustrations';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import HeroShowcase from '../components/user/Hero';

if (typeof document !== 'undefined') {
  [poppins400, poppins600, poppins700].forEach((href) => {
    if (!href || document.head.querySelector(`link[rel="preload"][href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = href;
    document.head.appendChild(link);
  });
}

const loadService = () => import('../components/user/Service');
const loadComponents = () => import('../components');
const makeOffersSlider = () => lazy(() => loadComponents().then((m) => ({ default: m.OffersSlider })));

const REDUCED_Q = '(prefers-reduced-motion: reduce)';
const prefersReduced = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_Q).matches;

let motionPromise = null;
const loadMotion = () => {
  motionPromise ||= Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis')])
    .then(([g, s, l]) => {
      const gsap = g.gsap || g.default;
      const ScrollTrigger = s.ScrollTrigger || s.default;
      const Lenis = l.default || l.Lenis;
      if (!gsap || !ScrollTrigger || !Lenis) return null;
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger, Lenis };
    })
    .catch(() => null);
  return motionPromise;
};

let activeLenis = null;
const setScrollLock = (locked) => {
  if (!activeLenis) return;
  if (locked) activeLenis.stop();
  else activeLenis.start();
};

const scrollToTop = () => {
  if (activeLenis) {
    activeLenis.scrollTo(0, { duration: 1.1 });
    return;
  }
  window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' });
};

const useSmoothMotion = (rootRef) => {
  useEffect(() => {
    if (typeof window === 'undefined' || prefersReduced()) return undefined;
    let disposed = false;
    let teardown = null;
    let idleId = 0;
    let timeoutId = 0;

    const boot = () => {
      loadMotion().then((m) => {
        if (disposed || !m) return;
        const { gsap, ScrollTrigger, Lenis } = m;
        const lenis = new Lenis({
          duration: 1.05,
          easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
          smoothWheel: true,
        });
        activeLenis = lenis;
        const onScroll = () => ScrollTrigger.update();
        lenis.on('scroll', onScroll);
        const tick = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        const ctx = gsap.context(() => {
          gsap.utils.toArray('[data-par]').forEach((el) => {
            gsap.fromTo(
              el,
              { yPercent: 7 },
              {
                yPercent: -7,
                ease: 'none',
                scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
              },
            );
          });
        }, rootRef.current || undefined);

        let refreshTimer = 0;
        const ro = typeof ResizeObserver === 'function'
          ? new ResizeObserver(() => {
            clearTimeout(refreshTimer);
            refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 250);
          })
          : null;
        if (ro && rootRef.current) ro.observe(rootRef.current);

        teardown = () => {
          clearTimeout(refreshTimer);
          ro?.disconnect();
          ctx.revert();
          gsap.ticker.remove(tick);
          lenis.off('scroll', onScroll);
          lenis.destroy();
          if (activeLenis === lenis) activeLenis = null;
        };
      });
    };

    if (typeof window.requestIdleCallback === 'function') idleId = window.requestIdleCallback(boot, { timeout: 1500 });
    else timeoutId = setTimeout(boot, 600);

    return () => {
      disposed = true;
      if (idleId && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
      clearTimeout(timeoutId);
      if (teardown) teardown();
    };
  }, [rootRef]);
};

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
    heroLabel: 'Featured offers', heroBadge: 'Today',
    heroDealsTitle: 'Mega deals', heroUpTo: 'Up to {{p}}% off',
    heroDealsSub: 'Big savings on phones, laptops and parts', heroDealsCta: 'Shop deals',
    heroNewTitle: 'Just landed', heroNewSub: 'Fresh devices from trusted shops', heroNewCta: 'See what’s new',
    trackTitle: 'Track your order', trackSub: 'See where your package is now', trackCta: 'Track order',
    prev: 'Previous', next: 'Next',
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
    heroLabel: 'العروض المميزة', heroBadge: 'اليوم',
    heroDealsTitle: 'عروض ضخمة', heroUpTo: 'خصم حتى {{p}}%',
    heroDealsSub: 'وفّر على الهواتف واللابتوب وقطع الغيار', heroDealsCta: 'تسوّق العروض',
    heroNewTitle: 'وصل للتو', heroNewSub: 'أجهزة جديدة من متاجر موثوقة', heroNewCta: 'شاهد الجديد',
    trackTitle: 'تتبّع طلبك', trackSub: 'اعرف مكان شحنتك الآن', trackCta: 'تتبّع الطلب',
    prev: 'السابق', next: 'التالي',
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
    heroLabel: 'Offres à la une', heroBadge: 'Aujourd’hui',
    heroDealsTitle: 'Méga offres', heroUpTo: 'Jusqu’à -{{p}}%',
    heroDealsSub: 'Économisez sur téléphones, ordinateurs et pièces', heroDealsCta: 'Voir les offres',
    heroNewTitle: 'Tout juste arrivé', heroNewSub: 'Appareils neufs de boutiques de confiance', heroNewCta: 'Voir les nouveautés',
    trackTitle: 'Suivez votre commande', trackSub: 'Voyez où est votre colis maintenant', trackCta: 'Suivre ma commande',
    prev: 'Précédent', next: 'Suivant',
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
  if (!raw || typeof raw !== 'string' || raw.length > 2048) return null;
  try {
    const v = JSON.parse(raw);
    return v && v.v === CONSENT_VERSION && v.prefs && typeof v.prefs === 'object' ? v : null;
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

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4';
const SHOP_GRID = 'grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-4';

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
const ABSOLUTE_SRC = /^(https?:)?\/\/|^data:image\/(png|jpe?g|webp|gif|avif);|^blob:/i;
const shopLogoSrc = (s) => {
  const found = [s?.logoUrl, s?.logo, s?.logoPath, s?.shopLogo].find((v) => typeof v === 'string' && v.trim());
  const raw = found ? found.trim() : '';
  if (!raw || raw.includes('..') || /^javascript:/i.test(raw)) return null;
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
  [/laptop|notebook|macbook|ordinateur|computer|\bpc\b|لابتوب|حاسوب|كمبيوتر/, RiMacbookFill],
  [/tablet|ipad|tablette|تابلت|لوحي|ايباد/, RiTabletFill],
  [/watch|wearable|smartband|montre|ساعه|ساعة|سوار/, FiWatch],
  [/speaker|haut-parleur|مكبر|سبيكر/, FiSpeaker],
  [/head|earbud|earphone|airpod|buds|audio|casque|ecouteur|سماع|صوتي/, RiHeadphoneFill],
  [/microphone|\bmic\b|ميكروفون/, FiMic],
  [/camera|photo|lens|drone|appareil photo|كاميرا|تصوير/, RiCamera3Fill],
  [/television|\btv\b|smart tv|\btele\b|تلفزيون|تلفاز/, RiTv2Fill],
  [/monitor|screen|display|ecran|شاشه|شاشة|شاشات/, RiComputerFill],
  [/gam|console|playstation|xbox|nintendo|joystick|controller|jeux|jeu\b|العاب/, RiGamepadFill],
  [/print|scanner|طابع|imprim/, RiPrinterFill],
  [/router|network|wifi|wi-fi|modem|routeur|reseau|راوتر|شبكه|شبكة/, FiWifi],
  [/storage|drive|\bssd\b|\bhdd\b|\busb\b|flash|memory|disk|stockage|disque|memoire|ذاكره|ذاكرة|تخزين/, FiHardDrive],
  [/charger|cable|power|battery|adapter|chargeur|batterie|شاحن|كابل|بطاريه|بطارية|باور/, FiBattery],
  [/cpu|gpu|processor|motherboard|\bram\b|component|composant|معالج|قطع/, FiCpu],
  [/accessor|case|cover|housse|coque|اكسسوار|ملحقات|جراب|حافظه|حافظة/, FiBox],
  [/phone|mobile|smartphone|iphone|android|galaxy|telephone|portable|هاتف|جوال|موبايل|محمول|تليفون/, RiSmartphoneFill],
];

const categoryIconCache = new Map();
const categoryIconFor = (name) => {
  const key = fold(name);
  if (categoryIconCache.has(key)) return categoryIconCache.get(key);
  const hit = CATEGORY_RULES.find(([re]) => re.test(key));
  const out = hit ? hit[1] : FiBox;
  categoryIconCache.set(key, out);
  return out;
};

const CAT_TONES = {
  light: [
    { bg: '#d1fae5', fg: '#047857' },
    { bg: '#fef3c7', fg: '#b45309' },
    { bg: '#dbeafe', fg: '#1d4ed8' },
    { bg: '#fce7f3', fg: '#be185d' },
    { bg: '#ede9fe', fg: '#6d28d9' },
    { bg: '#ffedd5', fg: '#c2410c' },
  ],
  dark: [
    { bg: '#0f2a20', fg: '#39ff88' },
    { bg: '#2a2210', fg: '#fbbf24' },
    { bg: '#10202e', fg: '#60a5fa' },
    { bg: '#2a1220', fg: '#f472b6' },
    { bg: '#1c1530', fg: '#a78bfa' },
    { bg: '#2a1a10', fg: '#fb923c' },
  ],
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
  '[content-visibility:auto] [contain-intrinsic-size:auto_640px]';

const HL_SVG = (c) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%23${c}' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")`;

const NB_CSS = `
@font-face{font-family:'Poppins Fallback';src:local('Arial'),local('Helvetica');size-adjust:112.6%;ascent-override:93.4%;descent-override:35.2%;line-gap-override:7.4%}
.nb{--dx:1;--hp-ease:cubic-bezier(.22,1,.36,1);--nb-bg:#ffffff;--nb-card:#ffffff;--nb-ink:#022c22;--nb-muted:#374151;--nb-line:rgba(6,78,59,.3);--nb-bd:#022c22;--nb-gray:#e6e8eb;--nb-media:#ffffff;--nb-accent:#047857;--nb-btn:#34d399;--nb-btn2:#6ee7b7;--nb-on:#022c22;--nb-ring:#10b981;--nb-scrim:rgba(0,0,0,.6);--nb-warn:#c2410c;--nb-warn-on:#ffffff;--nb-rose:#e11d48;--nb-thumb:#34d399;--nb-track:#e6e8eb;
--nb-sh2:calc(var(--dx)*2px) 2px 0 0 var(--nb-bd);--nb-sh3:calc(var(--dx)*3px) 3px 0 0 var(--nb-bd);--nb-sh4:calc(var(--dx)*4px) 4px 0 0 var(--nb-bd);--nb-sh6:calc(var(--dx)*6px) 6px 0 0 var(--nb-bd);--nb-sh8:calc(var(--dx)*8px) 8px 0 0 var(--nb-bd);
background:var(--nb-bg);color:var(--nb-ink);color-scheme:light;font-family:'Poppins','Poppins Fallback',ui-sans-serif,system-ui,-apple-system,'Segoe UI','Cairo',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.nb[dir=rtl]{--dx:-1}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#d4d4d4;--nb-line:#404040;--nb-bd:#000000;--nb-gray:#1e1e1e;--nb-media:#1e1e1e;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-btn2:#7dffb0;--nb-on:#000000;--nb-ring:#39ff88;--nb-scrim:rgba(0,0,0,.72);--nb-warn:#fdba74;--nb-warn-on:#000000;--nb-rose:#fb7185;--nb-thumb:#39ff88;--nb-track:#1e1e1e;color-scheme:dark}
.nb[lang=ar]{font-family:'Cairo','Poppins',ui-sans-serif,system-ui,sans-serif}
.nb[lang=ar] *{letter-spacing:0!important}
.nb button,.nb input,.nb textarea{font-family:inherit}
.nb-sec{background:var(--nb-bg)}
.nb-gray{background:var(--nb-gray)}
.nb-media{background:var(--nb-media)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-bd{border-color:var(--nb-bd)}
.nb-hl{padding-bottom:.2em;background-position:left bottom;background-repeat:no-repeat;background-size:0% .3em;-webkit-box-decoration-break:clone;box-decoration-break:clone;background-image:${HL_SVG('10b981')};transition:background-size .8s var(--hp-ease) .2s}
.nb-dark .nb-hl{background-image:${HL_SVG('39ff88')}}
.nb[dir=rtl] .nb-hl{background-position:right bottom}
.hp-rv[data-shown="1"] .nb-hl,.nb-hl-on{background-size:100% .3em}
.nb-card{background:var(--nb-card);border:3px solid var(--nb-bd);box-shadow:var(--nb-sh4);transition:transform .15s ease,box-shadow .15s ease}
.nb-big{box-shadow:var(--nb-sh8)}
@media (hover:hover){.nb-lift:hover{transform:translate3d(0,-2px,0);box-shadow:var(--nb-sh6)}}
.nb-chip{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;border:2px solid var(--nb-bd);background:var(--nb-btn);color:var(--nb-on);box-shadow:var(--nb-sh2)}
.nb-chip-bad{background:#fb7185;color:#000}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-bd);box-shadow:var(--nb-sh3);font-weight:700;text-transform:uppercase;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,background-color .15s ease,color .15s ease}
@media (hover:hover){.nb-btn:hover:not(:disabled){background:var(--nb-btn);color:var(--nb-on);box-shadow:var(--nb-sh4);transform:translate3d(0,-1px,0)}}
.nb-btn:active:not(:disabled){transform:translate3d(0,2px,0);box-shadow:none}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a{background:var(--nb-btn);color:var(--nb-on);border-width:3px;box-shadow:var(--nb-sh4)}
@media (hover:hover){.nb-btn-a:hover:not(:disabled){background:var(--nb-btn2)}}
.nb-btn-hot{background:var(--nb-warn);color:var(--nb-warn-on);border-width:3px;box-shadow:var(--nb-sh4)}
@media (hover:hover){.nb-btn-hot:hover:not(:disabled){background:var(--nb-warn);color:var(--nb-warn-on);filter:brightness(1.08)}}
.nb-btn:focus-visible,.nb-focus:focus-visible{outline:3px solid var(--nb-ring);outline-offset:2px}
.nb-dot{background:var(--nb-card);color:var(--nb-ink);border:3px dashed var(--nb-bd)}
.nb-sk{position:relative;overflow:hidden;background:color-mix(in srgb,var(--nb-ink) 10%,transparent)}
.nb-sk::after{content:"";position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--nb-card) 70%,transparent),transparent);animation:nbShimmer 1.3s ease-in-out infinite}
.nb[dir=rtl] .nb-sk::after{animation-direction:reverse}
@keyframes nbShimmer{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
.hp-rv{transition:opacity .55s var(--hp-ease) var(--d,0ms),transform .55s var(--hp-ease) var(--d,0ms)}
.hp-rv[data-shown="0"]{opacity:0;transform:translate3d(0,22px,0);will-change:opacity,transform}
.hp-rv[data-shown="0"][data-rv="fade"]{transform:translate3d(0,12px,0)}
.hp-rv[data-shown="0"][data-rv="scale"]{transform:translate3d(0,18px,0) scale(.95)}
.hp-rv[data-shown="0"][data-rv="start"]{transform:translate3d(-28px,0,0)}
.hp-rv[data-shown="0"][data-rv="end"]{transform:translate3d(28px,0,0)}
[dir="rtl"] .hp-rv[data-shown="0"][data-rv="start"]{transform:translate3d(28px,0,0)}
[dir="rtl"] .hp-rv[data-shown="0"][data-rv="end"]{transform:translate3d(-28px,0,0)}
.hp-rv[data-shown="1"]{opacity:1;transform:none}
@keyframes hpHero{from{opacity:0;transform:translate3d(0,14px,0)}to{opacity:1;transform:none}}
.hp-hero-in{animation:hpHero .55s var(--hp-ease) backwards}
.hp-tile{animation:hpHero .5s var(--hp-ease) backwards;animation-delay:calc(var(--i,0)*45ms)}
@keyframes hpFade{from{opacity:0}to{opacity:1}}
.hp-fade-in{animation:hpFade .35s ease-out both}
@keyframes hpConsentIn{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
.hp-consent-in{animation:hpConsentIn .32s cubic-bezier(.2,.8,.2,1) both}
@keyframes hpBanner{from{opacity:0;transform:translate(-50%,-12px)}to{opacity:1;transform:translate(-50%,0)}}
.hp-banner-in{animation:hpBanner .3s var(--hp-ease) both}
@keyframes hpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes hpTwinkle{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
.hp-float{animation:hpFloat 4.2s ease-in-out infinite}
.hp-float-slow{animation:hpFloat 5.6s ease-in-out infinite;animation-delay:-1.6s}
.hp-twinkle{transform-box:fill-box;transform-origin:center;animation:hpTwinkle 2.8s ease-in-out infinite}
.hp-twinkle-b{transform-box:fill-box;transform-origin:center;animation:hpTwinkle 2.8s ease-in-out infinite;animation-delay:-1.4s}
@keyframes hpPop{0%{transform:scale(.3);opacity:0}60%{transform:scale(1.25);opacity:1}100%{transform:scale(1)}}
.hp-pop{animation:hpPop .35s cubic-bezier(.34,1.56,.64,1) both}
@keyframes hpHeart{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}
.hp-heart{animation:hpHeart .3s ease-out}
.hp-hs{scrollbar-width:none;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch}
.hp-hs::-webkit-scrollbar{display:none}
.hp-progress{display:none;position:fixed;inset-block-start:0;inset-inline:0;height:4px;z-index:1000;background:var(--nb-btn);transform:scaleX(0);transform-origin:0 50%;pointer-events:none}
[dir="rtl"] .hp-progress{transform-origin:100% 50%}
@keyframes hpProgress{to{transform:scaleX(1)}}
@supports (animation-timeline:scroll()){.hp-progress{display:block;animation:hpProgress linear both;animation-timeline:scroll(root block)}}
html.lenis,html.lenis body{height:auto}
.lenis.lenis-smooth{scroll-behavior:auto!important}
.lenis.lenis-stopped{overflow:hidden}
.lenis.lenis-smooth iframe{pointer-events:none}
@media (prefers-reduced-motion:no-preference){html[data-hp-theme]:not(.lenis){scroll-behavior:smooth}}
html[data-hp-theme]{color-scheme:light}
html[data-hp-theme="dark"]{color-scheme:dark}
@supports (scrollbar-color:auto){html[data-hp-theme],.hp-sb{scrollbar-width:thin;scrollbar-color:var(--nb-thumb,#34d399) var(--nb-track,#e6e8eb)}}
.hp-sb::-webkit-scrollbar{width:8px;height:8px}
.hp-sb::-webkit-scrollbar-track{background:var(--nb-track)}
.hp-sb::-webkit-scrollbar-thumb{background:var(--nb-thumb);border:2px solid var(--nb-track)}
@media (prefers-reduced-motion:reduce){
.nb-card,.nb-btn{transition:none}
.nb-lift:hover,.nb-btn:hover:not(:disabled){transform:none}
.nb-sk::after{animation:none}
.nb-hl{background-size:100% .3em;transition:none}
.hp-pop,.hp-heart,.hp-float,.hp-float-slow,.hp-twinkle,.hp-twinkle-b{animation:none}
.hp-consent-in,.hp-hero-in,.hp-fade-in,.hp-progress,.hp-tile,.hp-banner-in{animation:none}
.hp-progress{display:none}
.hp-rv{transition:none}
.hp-rv[data-shown="0"]{opacity:1;transform:none;will-change:auto}
}
`;

let hpStylesInjected = false;
const injectHpStylesOnce = () => {
  if (hpStylesInjected || typeof document === 'undefined') return;
  const existing = document.querySelector('style[data-home-styles]');
  const tag = existing || document.createElement('style');
  tag.setAttribute('data-home-styles', 'true');
  if (tag.textContent !== NB_CSS) tag.textContent = NB_CSS;
  if (!existing) document.head.appendChild(tag);
  hpStylesInjected = true;
};
injectHpStylesOnce();

const BTN_BASE = 'nb-btn min-h-11 px-4 py-2.5 text-sm';
const btnCls = (primary) => `${BTN_BASE} ${primary ? 'nb-btn-a' : ''}`;

const PRODUCT_IMG_W = 480;
const PRODUCT_IMG_H = 384;
const PRODUCT_LINK =
  'outline-none after:absolute after:inset-0 after:z-[1] focus-visible:after:outline focus-visible:after:outline-[3px] ' +
  'focus-visible:after:-outline-offset-4 focus-visible:after:outline-[color:var(--nb-ring)]';

const Sk = memo(({ className = '' }) => <div aria-hidden="true" className={`nb-sk ${className}`} />);

const ProductCardSkeleton = memo(() => (
  <div aria-hidden="true" className="nb-card flex h-full flex-col overflow-hidden">
    <Sk className="aspect-[5/4] w-full" />
    <div className="flex flex-col gap-2.5 p-3.5">
      <Sk className="h-5 w-1/3" />
      <Sk className="h-3.5 w-full" />
      <Sk className="h-3.5 w-3/4" />
      <Sk className="h-3 w-1/2" />
    </div>
  </div>
));

const ShopCardSkeleton = memo(() => (
  <div aria-hidden="true" className="nb-card flex h-full flex-col overflow-hidden">
    <Sk className="h-40 w-full sm:h-44" />
    <div className="flex flex-col gap-3 p-4">
      <Sk className="h-4 w-2/3" />
      <Sk className="h-3 w-4/5" />
      <Sk className="h-3 w-full" />
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Sk className="h-8" />
        <Sk className="h-8" />
      </div>
      <Sk className="h-6 w-full" />
    </div>
  </div>
));

const TileSkeleton = memo(() => (
  <div aria-hidden="true" className="flex w-28 shrink-0 flex-col items-center gap-3 p-1 sm:w-36 lg:w-auto lg:min-w-0 lg:flex-1">
    <Sk className="h-24 w-24 sm:h-28 sm:w-28" />
    <Sk className="h-3.5 w-4/5" />
  </div>
));

const SkeletonGrid = memo(({ count, variant = 'product', grid = GRID }) => {
  const Card = variant === 'shop' ? ShopCardSkeleton : ProductCardSkeleton;
  return (
    <div className={grid} role="status" aria-busy="true">
      {Array.from({ length: count }, (_, i) => <Card key={i} />)}
    </div>
  );
});

const TileRowSkeleton = memo(() => (
  <div className="flex gap-2 overflow-hidden py-2" role="status" aria-busy="true">
    {Array.from({ length: 8 }, (_, i) => <TileSkeleton key={i} />)}
  </div>
));

const Band = memo(({ sectionRef, visible, label, className = '', children }) => (
  <section
    ref={sectionRef}
    aria-label={label}
    className={`nb-sec py-12 sm:py-20 ${LAZY_SECTION} ${visible === false ? 'anim-paused' : ''} ${className}`}
  >
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
  </section>
));

const StoreHead = memo(({ title, subtitle, to, ctaLabel }) => (
  <Reveal className="mb-8 sm:mb-10">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        <h2 className="text-2xl font-bold uppercase leading-snug [text-wrap:balance] sm:text-4xl">
          <span className="nb-hl">{title}</span>
        </h2>
        {subtitle && <p className="nb-muted mt-3 text-sm leading-relaxed sm:text-base">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className={`${btnCls(false)} flex-shrink-0`}>
          {ctaLabel}<FiArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      )}
    </div>
  </Reveal>
));

const ErrorState = memo(({ language, onRetry, retrying, compact }) => {
  const online = useOnline();
  const Icon = online ? FiAlertTriangle : FiWifiOff;
  return (
    <div
      role="alert"
      className={`nb-dot hp-fade-in flex flex-col items-center gap-3 px-5 text-center ${compact ? 'py-6' : 'py-10 sm:py-12'}`}
    >
      <span aria-hidden="true" className="nb-chip nb-chip-bad h-14 w-14">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="max-w-md text-lg font-bold [text-wrap:balance]">{tr(language, online ? 'loadFailedTitle' : 'offlineTitle')}</h3>
      <p className="nb-muted max-w-md text-sm leading-relaxed">{tr(language, online ? 'loadFailedText' : 'offlineText')}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} disabled={retrying} aria-busy={retrying} className={`${btnCls(true)} mt-1`}>
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
    const { language } = this.props;
    return (
      <Band className="!py-8">
        <ErrorState language={language} onRetry={this.reset} compact />
      </Band>
    );
  }
}

const LazyMount = memo(({ children, minHeight = 360, onShow }) => {
  const [ref, seen] = useInView(observeNear);
  useEffect(() => { if (seen) onShow?.(); }, [seen, onShow]);
  return (
    <div ref={ref} className="nb-sec" style={seen ? undefined : { minHeight }}>
      {seen ? <div className="hp-fade-in">{children}</div> : null}
    </div>
  );
});

const ConnectionBanner = memo(({ language }) => {
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
      className="nb-card hp-banner-in fixed left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[1090] flex max-w-[92vw] items-center gap-2.5 px-4 py-2.5 text-sm font-bold"
    >
      <Icon aria-hidden="true" className={`h-4 w-4 flex-shrink-0 ${online ? 'nb-ic' : 'text-[color:var(--nb-rose)]'}`} />
      <span className="truncate">{tr(language, online ? 'backOnline' : 'offlineTitle')}</span>
    </div>
  );
});

const CardFooter = memo(({ label }) => (
  <div className="nb-line mt-auto flex items-center justify-between gap-3 border-t-2 pt-3">
    <span className="truncate text-sm font-bold">{label}</span>
    <span aria-hidden="true" className="nb-chip h-8 w-8 transition-transform duration-200 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-1 rtl:[@media(hover:hover)]:group-hover:-translate-x-1">
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

const EmptyState = memo(({ kind, title, text, ctaLabel, to, darkMode }) => (
  <div className="nb-dot hp-fade-in flex flex-col items-center gap-3 px-5 py-10 text-center sm:py-14">
    <EmptyArt kind={kind} darkMode={darkMode} />
    <h3 className="max-w-md text-lg font-bold [text-wrap:balance] sm:text-2xl">{title}</h3>
    <p className="nb-muted max-w-md text-sm leading-relaxed sm:text-base">{text}</p>
    {to && (
      <Link to={to} className={`${btnCls(true)} mt-2`}>
        {ctaLabel}
        <FiArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      </Link>
    )}
  </div>
));

const RankBadge = memo(({ rank, language }) => (
  <span
    aria-hidden="true"
    className="nb-chip absolute start-2.5 top-2.5 z-[2] h-8 min-w-[2rem] px-2 text-sm font-bold leading-none tabular-nums"
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

const BenefitsBar = memo(({ language }) => (
  <section className={`nb-sec pt-8 sm:pt-12 ${LAZY_SECTION}`}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {BENEFITS.map(([Icon, key]) => (
            <li key={key} className="nb-card flex items-center gap-3 p-4">
              <span aria-hidden="true" className="nb-chip h-11 w-11">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold">{tr(language, `${key}Title`)}</h3>
                <p className="nb-muted line-clamp-2 text-xs">{tr(language, `${key}Text`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  </section>
));

const CookieSwitch = memo(({ checked, onChange, disabled, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={onChange}
    className={`nb-bd nb-focus relative h-7 w-12 flex-shrink-0 cursor-pointer border-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
      checked ? 'bg-[color:var(--nb-btn)]' : 'bg-[color:var(--nb-gray)]'
    }`}
  >
    <span
      aria-hidden="true"
      className={`nb-bd absolute start-0.5 top-0.5 h-5 w-5 border-2 bg-[color:var(--nb-card)] transition-transform duration-200 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
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

const CookieConsent = memo(({ language }) => {
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
    setScrollLock(true);
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
      setScrollLock(false);
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

  return (
    <div className="hp-fade-in fixed inset-0 z-[1100] flex items-end justify-center bg-[color:var(--nb-scrim)] p-4 sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="nb-card nb-big hp-consent-in hp-sb max-h-[90vh] w-full max-w-lg overflow-y-auto overscroll-contain p-5 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="nb-chip h-11 w-11">
            <RiCookieLine className="h-6 w-6" />
          </span>
          <h2 id={titleId} className="text-xl font-bold uppercase sm:text-2xl"><span className="nb-hl nb-hl-on">{ctr(language, 'title')}</span></h2>
        </div>

        <p id={descId} className="nb-muted mt-4 text-sm leading-relaxed sm:text-base">{ctr(language, 'text')}</p>

        {custom && (
          <ul className="mt-5 space-y-3">
            {COOKIE_OPTIONS.map(([key, labelKey, descKey, locked]) => (
              <li key={key} className="nb-gray nb-line hp-fade-in flex items-start justify-between gap-4 border-2 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{ctr(language, labelKey)}</p>
                  <p className="nb-muted mt-1 text-xs leading-relaxed">{ctr(language, descKey)}</p>
                </div>
                <CookieSwitch
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
              <button ref={primaryRef} type="button" onClick={saveChoices} className={btnCls(true)}>{ctr(language, 'save')}</button>
              <button type="button" onClick={rejectAll} className={btnCls(false)}>{ctr(language, 'rejectAll')}</button>
              <button type="button" onClick={toggleCustom} className={btnCls(false)}>{ctr(language, 'back')}</button>
            </>
          ) : (
            <>
              <button ref={primaryRef} type="button" onClick={acceptAll} className={btnCls(true)}>{ctr(language, 'acceptAll')}</button>
              <button type="button" onClick={rejectAll} className={btnCls(false)}>{ctr(language, 'rejectAll')}</button>
              <button type="button" onClick={toggleCustom} className={btnCls(false)}>{ctr(language, 'customize')}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

const dots = (base, dot) => ({
  backgroundColor: base,
  backgroundImage: `radial-gradient(${dot} 2px, transparent 2.5px)`,
  backgroundSize: '18px 18px',
});
const grid = (base, line) => ({
  backgroundColor: base,
  backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
  backgroundSize: '22px 22px',
});
const stripes = (base, line) => ({
  backgroundColor: base,
  backgroundImage: `repeating-linear-gradient(135deg, ${line} 0 2px, transparent 2px 14px)`,
});

const HERO_TONES = Object.freeze({
  neon: {
    style: dots('var(--nb-btn)', 'rgba(2,44,34,.16)'),
    ink: 'text-emerald-950', soft: 'text-emerald-950/80', chip: 'bg-emerald-950 text-white',
  },
  deep: {
    style: grid('#0b4a35', 'rgba(57,255,136,.16)'),
    ink: 'text-white', soft: 'text-white/80', chip: 'bg-[#39ff88] text-emerald-950',
  },
  sun: {
    style: stripes('#fbbf24', 'rgba(120,53,15,.16)'),
    ink: 'text-amber-950', soft: 'text-amber-950/80', chip: 'bg-amber-950 text-white',
  },
});

const HERO_WIDE = Object.freeze({
  shops: {
    to: '/shops', title: 'topShops', sub: 'shopsSubtitle', cta: 'viewAllShops',
    light: { style: dots('#d1fae5', 'rgba(5,150,105,.28)'), ink: 'text-emerald-950', soft: 'text-emerald-900/80', chip: 'bg-emerald-950 text-white' },
    dark: { style: dots('#0f2a20', 'rgba(57,255,136,.16)'), ink: 'text-white', soft: 'text-white/70', chip: 'bg-[#39ff88] text-emerald-950' },
  },
  track: {
    to: '/track', title: 'trackTitle', sub: 'trackSub', cta: 'trackCta',
    light: { style: stripes('#ecfccb', 'rgba(77,124,15,.16)'), ink: 'text-lime-950', soft: 'text-lime-900/80', chip: 'bg-lime-900 text-white' },
    dark: { style: stripes('#1a2410', 'rgba(190,242,100,.12)'), ink: 'text-white', soft: 'text-white/70', chip: 'bg-lime-300 text-lime-950' },
  },
});

const HERO_TILES = Object.freeze([
  { key: 'deals', to: '/offers', Icon: FiZap, label: 'dealsTitle' },
  { key: 'new', to: '/devices', Icon: FiStar, label: 'tabsTitle' },
  { key: 'shops', to: '/shops', Icon: FiMapPin, label: 'viewAllShops' },
  { key: 'repair', to: '/repair', Icon: FiTool, label: 'repairDevice' },
  { key: 'track', to: '/track', Icon: FiTruck, label: 'trackTitle' },
]);

const hideBroken = (e) => { e.currentTarget.style.visibility = 'hidden'; };

const TrackArt = memo(({ className }) => (
  <svg className={className} viewBox="0 0 160 140" fill="none" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" focusable="false">
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

const HeroTall = memo(({ to, tone, title, sub, cta, badge, image, art, eager }) => {
  const v = HERO_TONES[tone];
  return (
    <Link
      to={to}
      draggable={false}
      style={v.style}
      className="nb-card nb-lift nb-focus group relative flex h-full w-[15.5rem] flex-none snap-start flex-col overflow-hidden p-4 sm:w-[22rem] sm:p-6"
    >
      <div className="relative z-10 flex flex-col items-start gap-1.5 sm:gap-2">
        {badge && (
          <span className="rounded-md bg-black px-2 py-1 text-[11px] font-bold leading-none text-[#39ff88] sm:text-xs">{badge}</span>
        )}
        <h3 className={`text-2xl font-bold uppercase leading-[1.15] [text-wrap:balance] sm:text-4xl ${v.ink}`}>{title}</h3>
        <p className={`line-clamp-3 text-xs font-semibold leading-snug sm:text-base ${v.soft}`}>{sub}</p>
        <span className={`mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg border-2 border-black px-3 py-1.5 text-xs font-bold sm:rounded-xl sm:border-[3px] sm:px-4 sm:py-2 sm:text-sm ${v.chip}`}>
          {cta}
          <FiArrowRight className="h-3.5 w-3.5 flex-shrink-0 rtl:rotate-180" aria-hidden="true" />
        </span>
      </div>
      <div className="relative mt-3 min-h-0 flex-1 sm:mt-5">
        {image ? (
          <div className="absolute inset-0 grid place-items-center p-1 sm:p-3">
            <img
              src={image}
              alt=""
              width={320}
              height={320}
              loading={eager ? 'eager' : 'lazy'}
              fetchPriority={eager ? 'high' : 'auto'}
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
              onError={hideBroken}
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div aria-hidden="true" className="absolute inset-0">{art}</div>
        )}
      </div>
    </Link>
  );
});

const HeroWide = memo(({ cfg, art, language, darkMode }) => {
  const v = darkMode ? cfg.dark : cfg.light;
  return (
    <Link
      to={cfg.to}
      draggable={false}
      style={v.style}
      className="nb-card nb-lift nb-focus group relative flex min-h-0 flex-1 flex-row items-center justify-between gap-3 overflow-hidden p-4 sm:p-6"
    >
      <div className="relative z-10 flex min-w-0 flex-col items-start gap-1 sm:gap-2">
        <h3 className={`line-clamp-2 text-lg font-bold uppercase leading-tight sm:text-3xl ${v.ink}`}>{tr(language, cfg.title)}</h3>
        <p className={`line-clamp-2 text-[11px] font-semibold leading-snug sm:text-base ${v.soft}`}>{tr(language, cfg.sub)}</p>
        <span className={`mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg border-2 border-black px-2.5 py-1 text-xs font-bold sm:rounded-xl sm:border-[3px] sm:px-4 sm:py-2 sm:text-sm ${v.chip}`}>
          {tr(language, cfg.cta)}
          <FiArrowRight className="h-3.5 w-3.5 flex-shrink-0 rtl:rotate-180" aria-hidden="true" />
        </span>
      </div>
      <div aria-hidden="true" className="flex h-20 w-20 flex-none items-center justify-center sm:h-36 sm:w-36">{art}</div>
    </Link>
  );
});

const HeroRail = memo(({ children, label, prevLabel, nextLabel, isAr }) => {
  const ref = useRef(null);
  const scrollBy = useCallback((dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (isAr ? -1 : 1) * el.clientWidth * 0.7, behavior: prefersReduced() ? 'auto' : 'smooth' });
  }, [isAr]);
  const arrow = 'nb-btn nb-btn-a nb-focus absolute top-[calc(50%-1.25rem)] z-10 hidden h-10 w-10 !rounded-full !p-0 sm:inline-flex';
  return (
    <div className="relative">
      <div
        ref={ref}
        role="group"
        aria-roledescription="carousel"
        aria-label={label}
        className="hp-hs flex h-[27rem] snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-4 pb-3 pt-1 sm:h-[35rem] sm:gap-5 sm:px-6"
      >
        {children}
      </div>
      <button type="button" aria-label={prevLabel} onClick={() => scrollBy(-1)} className={`${arrow} start-3`}>
        <FiChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
      </button>
      <button type="button" aria-label={nextLabel} onClick={() => scrollBy(1)} className={`${arrow} end-3`}>
        <FiChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
      </button>
    </div>
  );
});

const HeroTiles = memo(({ language }) => (
  <ul className="hp-hs flex gap-3 overflow-x-auto px-4 pb-4 pt-4 sm:grid sm:grid-cols-5 sm:gap-5 sm:overflow-visible sm:px-6 sm:pt-6">
    {HERO_TILES.map(({ key, to, Icon, label }) => (
      <li key={key} className="w-24 flex-none sm:w-auto">
        <Link
          to={to}
          draggable={false}
          style={{ backgroundColor: 'var(--nb-btn)', color: 'var(--nb-on)' }}
          className="nb-card nb-lift nb-focus flex h-full flex-col items-center gap-2 px-2 pb-3 pt-4 text-center sm:flex-row sm:justify-center sm:gap-3 sm:px-4 sm:py-5 sm:text-start"
        >
          <span className="grid h-12 w-12 flex-none place-items-center rounded-full border-[3px] border-black bg-white text-emerald-950 sm:h-14 sm:w-14">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </span>
          <span className="line-clamp-2 text-xs font-bold leading-tight sm:text-base">{tr(language, label)}</span>
        </Link>
      </li>
    ))}
  </ul>
));

const HomeHero = memo(({ language, darkMode, dealImage, newImage, topPercent }) => {
  const isAr = language === 'ar';
  const label = tr(language, 'heroLabel');
  return (
    <section aria-label={label} className="nb-sec relative">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-32 border-b-[3px] border-[color:var(--nb-bd)] bg-[color:var(--nb-btn)] sm:h-48" />
      <div className="relative mx-auto w-full max-w-[120rem] pt-4 sm:pt-6">
        <HeroRail label={label} prevLabel={tr(language, 'prev')} nextLabel={tr(language, 'next')} isAr={isAr}>
          <HeroTall
            to="/offers"
            tone="neon"
            badge={tr(language, 'heroBadge')}
            title={topPercent > 0 ? tr(language, 'heroUpTo', { p: num(language, topPercent) }) : tr(language, 'heroDealsTitle')}
            sub={tr(language, 'heroDealsSub')}
            cta={tr(language, 'heroDealsCta')}
            image={dealImage}
            art={<IsoIllustration type="offersCard" onGreen={false} darkMode={darkMode} className="h-full w-full" />}
            eager
          />
          <HeroTall
            to="/repair"
            tone="deep"
            title={tr(language, 'repairDevice')}
            sub={tr(language, 'repairDescription')}
            cta={tr(language, 'bookRepair')}
            art={<IsoIllustration type="repairCard" onGreen={false} darkMode={darkMode} className="h-full w-full" />}
          />
          <HeroTall
            to="/devices"
            tone="sun"
            title={tr(language, 'heroNewTitle')}
            sub={tr(language, 'heroNewSub')}
            cta={tr(language, 'heroNewCta')}
            image={newImage}
            art={<ProductFallbackArt name="" categoryName="" label={tr(language, 'deviceLabel')} darkMode={darkMode} />}
          />
          <div className="flex h-full w-[19rem] flex-none snap-start flex-col gap-3 sm:w-[34rem] sm:gap-5">
            <HeroWide
              cfg={HERO_WIDE.shops}
              language={language}
              darkMode={darkMode}
              art={<StorefrontIllustration className="h-full w-auto max-w-full" />}
            />
            <HeroWide
              cfg={HERO_WIDE.track}
              language={language}
              darkMode={darkMode}
              art={<TrackArt className="h-full w-full" />}
            />
          </div>
        </HeroRail>
        <HeroTiles language={language} />
      </div>
    </section>
  );
});

const CategoryTile = memo(({ category, count, showCount, index, language, darkMode }) => {
  const id = safeId(category.id);
  const Icon = useMemo(() => categoryIconFor(category.name), [category.name]);
  const tone = CAT_TONES[darkMode ? 'dark' : 'light'][index % CAT_TONES.light.length];
  if (!id) return null;
  return (
    <div
      style={{ '--i': Math.min(index, 8) }}
      className="hp-tile w-28 shrink-0 snap-start sm:w-36 lg:w-auto lg:min-w-0 lg:flex-1"
    >
      <Link
        to={`/products/category/${id}`}
        aria-label={category.name}
        className="nb-focus group flex w-full flex-col items-center gap-3 p-1 text-center"
      >
        <span
          style={{ backgroundColor: tone.bg, color: tone.fg }}
          className="nb-card nb-lift relative grid h-24 w-24 place-items-center overflow-hidden sm:h-28 sm:w-28"
        >
          <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            <circle cx="82" cy="18" r="28" fill="currentColor" opacity="0.14" />
            <circle cx="14" cy="88" r="22" fill="currentColor" opacity="0.1" />
            <path d="M20 22l2.2 5.2 5.3.4-4 3.6 1.3 5.3-4.8-3-4.8 3 1.3-5.3-4-3.6 5.3-.4z" fill="currentColor" opacity="0.5" />
            <circle cx="84" cy="80" r="3" fill="currentColor" opacity="0.5" />
            <circle cx="70" cy="90" r="2" fill="currentColor" opacity="0.35" />
          </svg>
          <span
            className="nb-bd relative grid h-14 w-14 place-items-center rounded-2xl border-2 bg-[color:var(--nb-card)] [box-shadow:var(--nb-sh2)] transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none sm:h-16 sm:w-16 [@media(hover:hover)]:group-hover:-rotate-6 [@media(hover:hover)]:group-hover:scale-110"
          >
            <Icon aria-hidden="true" strokeWidth={2.2} className="h-8 w-8 sm:h-9 sm:w-9" />
          </span>
        </span>
        <span className="line-clamp-1 w-full text-sm font-bold">{category.name}</span>
        {showCount && (
          <span className="nb-muted text-xs font-semibold">
            <span dir="ltr" className="tabular-nums">{count}</span> {tr(language, count === 1 ? 'homeItemSingular' : 'homeItemPlural')}
          </span>
        )}
      </Link>
    </div>
  );
});

const CategorySection = memo(({ categories, counts, showCount, loading, failed, onRetry, retrying, language, darkMode }) => {
  const top = useMemo(
    () => [...categories].sort((a, b) => (counts[String(b.id)] || 0) - (counts[String(a.id)] || 0)).slice(0, CATEGORY_LIMIT),
    [categories, counts],
  );
  if (!loading && !failed && top.length === 0) return null;
  return (
    <Band label={tr(language, 'homeCategoriesTitle')}>
      <StoreHead title={tr(language, 'homeCategoriesTitle')} subtitle={tr(language, 'homeCategoriesSub')} />
      {loading ? (
        <TileRowSkeleton />
      ) : failed && top.length === 0 ? (
        <ErrorState language={language} onRetry={onRetry} retrying={retrying} compact />
      ) : (
        <div className="hp-sb -mx-4 flex snap-x gap-2 overflow-x-auto px-4 py-2 pb-5 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
          {top.map((c, i) => (
            <CategoryTile key={c.id} category={c} index={i} count={counts[String(c.id)] || 0} showCount={showCount} language={language} darkMode={darkMode} />
          ))}
        </div>
      )}
    </Band>
  );
});

const PromoBanner = memo(({ to, title, text, cta, scene, hot, variant, delay, darkMode }) => (
  <Reveal variant={variant} delay={delay} className="h-full">
    <Link
      to={to}
      className="nb-card nb-big nb-lift nb-focus group relative flex h-full min-h-[220px] items-center justify-between gap-4 overflow-hidden p-6 sm:min-h-[260px] sm:p-8"
    >
      <div className="relative z-[1] min-w-0 max-w-[62%]">
        <h3 className="text-2xl font-bold uppercase leading-tight [text-wrap:balance] sm:text-3xl">
          <span className="nb-hl nb-hl-on">{title}</span>
        </h3>
        <p className="nb-muted mt-3 line-clamp-3 text-sm sm:text-base">{text}</p>
        <span className={`nb-btn ${hot ? 'nb-btn-hot' : 'nb-btn-a'} mt-5 min-h-11 px-5 text-sm [@media(hover:hover)]:group-hover:translate-x-1 rtl:[@media(hover:hover)]:group-hover:-translate-x-1`}>
          {cta}<FiArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </span>
      </div>
      <div data-par aria-hidden="true" className="relative z-[1] w-[38%] max-w-[220px] shrink-0">
        <div className="transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-105">
          <IsoIllustration type={scene} onGreen={false} darkMode={darkMode} className="h-full w-full" />
        </div>
      </div>
    </Link>
  </Reveal>
));

const BannerSection = memo(({ darkMode, language }) => (
  <Band label={tr(language, 'todayPrompt')} className="!py-8 sm:!py-12">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
      <PromoBanner
        to="/repair" scene="repairCard" variant="start" delay={0} darkMode={darkMode}
        title={tr(language, 'repairDevice')} text={tr(language, 'repairDescription')} cta={tr(language, 'bookRepair')}
      />
      <PromoBanner
        to="/offers" scene="offersCard" hot variant="end" delay={120} darkMode={darkMode}
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

  const saveLabel = tr(language, isSaved ? 'saved' : 'save');

  return (
    <article aria-label={name} className="nb-card nb-lift group relative flex h-full min-w-0 flex-col overflow-hidden">
      <div className={`nb-bd relative aspect-[5/4] w-full flex-shrink-0 overflow-hidden border-b-[3px] [contain:layout_paint] ${showImage ? 'bg-white' : 'nb-media'}`}>
        {showImage ? (
          <>
            {!loaded && <div aria-hidden="true" className="nb-sk absolute inset-0" />}
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
          <div className="absolute inset-0">
            <ProductFallbackArt name={name} categoryName={product.categoryName} label={tr(language, 'deviceLabel')} darkMode={darkMode} />
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          aria-pressed={isSaved}
          aria-label={saveLabel}
          title={saveLabel}
          className="nb-btn nb-focus absolute end-2.5 top-2.5 z-10 h-9 w-9 !text-[color:var(--nb-ink)]"
        >
          <FiHeart key={String(isSaved)} aria-hidden="true" className={`h-4 w-4 ${isSaved ? 'hp-heart text-rose-500' : ''}`} fill={isSaved ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          onClick={handleCart}
          disabled={out || btn === 'adding'}
          aria-label={tr(language, 'addToCart')}
          title={tr(language, 'addToCart')}
          className="nb-btn nb-btn-a nb-focus absolute bottom-2.5 end-2.5 z-10 h-10 w-10"
        >
          {btn === 'adding' ? <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
            : btn === 'added' ? <FiCheck aria-hidden="true" className="hp-pop h-5 w-5" strokeWidth={3} /> : <FiPlus aria-hidden="true" className="h-5 w-5" strokeWidth={3} />}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <div className="min-w-0" dir="ltr">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={`truncate text-lg font-bold leading-tight tabular-nums sm:text-xl ${hasDiscount ? 'text-[color:var(--nb-warn)]' : ''}`}>
              <span className="sr-only">{hasDiscount ? `${tr(language, 'discountedPrice')}: ` : ''}</span>{money(product.finalPrice)}
            </span>
            {hasDiscount && product.discount >= 1 && (
              <span className="text-xs font-bold tabular-nums text-[color:var(--nb-warn)]">-{Math.round(product.discount)}%</span>
            )}
          </p>
          {hasDiscount && (
            <p className="nb-muted text-xs tabular-nums line-through">
              <span className="sr-only">{tr(language, 'originalPrice')}: </span>{money(product.price)}
            </p>
          )}
        </div>

        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug" title={name}>
          {id ? <Link to={`/device/${id}`} className={PRODUCT_LINK}>{name}</Link> : name}
        </h3>

        <p className="nb-muted line-clamp-1 text-xs leading-5">{product._snippet || tr(language, 'noProductDescription')}</p>

        {hasRating && (
          <p className="flex items-center gap-1 text-xs font-bold" dir="ltr">
            <RiStarFill className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
            <span className="tabular-nums">{product.rating.toFixed(1)}</span>
            {product.reviews > 0 && <span className="nb-muted font-medium tabular-nums">({COUNT_FORMAT.format(product.reviews)})</span>}
          </p>
        )}

        {out ? (
          <p className="flex items-center gap-1.5 text-xs font-bold text-[color:var(--nb-rose)]">
            <FiAlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span>{tr(language, 'outOfStock')}</span>
          </p>
        ) : low ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <FiAlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-[color:var(--nb-warn)]" aria-hidden="true" />
            <span>{tr(language, 'onlyLeft', { count: product.stock })}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
});

const ShopMedia = memo(({ shop }) => {
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
  return (
    <div ref={mediaRef} className={`nb-bd relative h-40 w-full flex-shrink-0 overflow-hidden border-b-[3px] [contain:layout_paint] sm:h-44 ${showLogo ? 'bg-white' : 'nb-gray'}`}>
      {showLogo ? (
        <>
          {!loaded && <div aria-hidden="true" className="nb-sk absolute inset-0" />}
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

const ShopStats = memo(({ orders, repairs, loading, language }) => {
  const values = { orders, repairs };
  return (
    <dl className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-1 lg:grid-cols-2">
      {STAT_ITEMS.map(([Icon, key, field]) => {
        const value = values[field];
        return (
          <div key={key} className="nb-gray nb-line flex min-w-0 items-center gap-1.5 border-2 px-2 py-1.5">
            <Icon className="nb-ic h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <dt className="min-w-0 flex-1 truncate text-[11px] font-semibold">{tr(language, key)}</dt>
            <dd dir="ltr" className="flex-shrink-0 text-sm font-bold leading-none tabular-nums">
              {value == null && loading
                ? <span className="nb-sk inline-block h-3.5 w-6" />
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

const ShopCard = memo(({ shop, rank, stats, statsLoading, language, onOpen }) => {
  const open = useCallback(() => onOpen(shop), [onOpen, shop]);
  const handleKey = useCallback((e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }, [open]);
  const hasRating = shop.rating > 0;
  const tel = phoneHref(shop.phone);
  return (
    <article
      onClick={open}
      onKeyDown={handleKey}
      tabIndex={0}
      aria-label={rank ? `${tr(language, 'rankLabel', { n: rank })}: ${shop.name || ''}` : shop.name}
      className="nb-card nb-lift nb-focus group relative flex h-full min-w-0 cursor-pointer flex-col overflow-hidden"
    >
      {rank ? <RankBadge rank={rank} language={language} /> : null}
      <ShopMedia shop={shop} />

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex flex-1 flex-col gap-2.5 pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-base font-bold leading-snug">
              <span className="line-clamp-1">{shop.name || tr(language, 'unnamedShop')}</span>
            </h3>
            {hasRating && (
              <span className="flex flex-shrink-0 items-center gap-1 text-sm font-bold">
                <RiStarFill className="h-4 w-4 text-amber-500" aria-hidden="true" /><span dir="ltr" className="tabular-nums">{shop.rating.toFixed(1)}</span>
                {shop.reviews > 0 && <span dir="ltr" className="nb-muted text-xs font-medium tabular-nums">({COUNT_FORMAT.format(shop.reviews)})</span>}
              </span>
            )}
          </div>
          {shop._address ? (
            <p className="nb-muted flex items-center gap-1.5 text-xs font-semibold">
              <FiMapPin className="nb-ic h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              <span className="line-clamp-1">{shop._address}</span>
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs font-bold text-[color:var(--nb-warn)]">
              <FiMapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />{tr(language, 'noAddress')}
            </p>
          )}
          {tel && (
            <a href={tel} onClick={(e) => e.stopPropagation()} className="nb-focus flex min-h-6 min-w-0 items-center gap-1.5 text-xs font-bold transition-colors duration-200 hover:text-[color:var(--nb-accent)]">
              <FiPhone className="nb-ic h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" /><span className="truncate" dir="ltr">{shop.phone}</span>
            </a>
          )}
          <p className="nb-muted line-clamp-2 min-h-[2.25rem] text-xs leading-relaxed">{shop._snippet || tr(language, 'shopDescription')}</p>
        </div>
        <ShopStats
          orders={statOf(shop, stats, 'orders')} repairs={statOf(shop, stats, 'repairs')}
          loading={statsLoading} language={language}
        />
        <CardFooter label={tr(language, 'visitShop')} />
      </div>
    </article>
  );
});

const ShopBadge = memo(({ shop, index }) => {
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
        className="nb-focus group flex w-full flex-col items-center gap-3 p-1 text-center"
      >
        <span className="nb-card nb-lift grid h-20 w-20 place-items-center overflow-hidden bg-white sm:h-24 sm:w-24">
          {logo && !bad ? (
            <img src={logo} alt="" width={96} height={96} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)} className="h-full w-full bg-white object-contain p-2" />
          ) : (
            <span aria-hidden="true" className="text-3xl font-bold text-emerald-700">{initial}</span>
          )}
        </span>
        <span className="line-clamp-1 w-full text-xs font-bold sm:text-sm">{shop.name}</span>
      </Link>
    </div>
  );
});

const ShopsTrustSection = memo(({ shops, loading, failed, language }) => {
  if (failed || (!loading && shops.length === 0)) return null;
  return (
    <Band label={tr(language, 'shopsTrustTitle')}>
      <StoreHead
        title={tr(language, 'shopsTrustTitle')} subtitle={tr(language, 'shopsTrustSub')}
        to="/shops" ctaLabel={tr(language, 'viewAllShops')}
      />
      {loading ? (
        <TileRowSkeleton />
      ) : (
        <div className="hp-sb -mx-4 flex snap-x gap-2 overflow-x-auto px-4 py-2 pb-5 sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
          {shops.map((s, i) => <ShopBadge key={s.id} shop={s} index={i} />)}
        </div>
      )}
    </Band>
  );
});

const TopRatedSection = memo(({ shops, stats, statsLoading, loading, failed, language, onOpen }) => {
  const [sectionRef, visible] = useOnScreen();
  if (failed || (!loading && shops.length === 0)) return null;
  return (
    <Band sectionRef={sectionRef} visible={visible} label={tr(language, 'topRatedTitle')}>
      <StoreHead title={tr(language, 'topRatedTitle')} subtitle={tr(language, 'topRatedSub')} />
      {loading ? <SkeletonGrid count={TOP_LIMIT} variant="shop" grid={SHOP_GRID} /> : (
        <ol className={SHOP_GRID}>
          {shops.map((s, i) => (
            <Reveal as="li" key={s.id} delay={stagger(i, 60)} className="h-full min-w-0">
              <ShopCard
                shop={s} rank={i + 1} stats={stats} statsLoading={statsLoading}
                language={language} onOpen={onOpen}
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
    <Band sectionRef={sectionRef} visible={visible} label={tr(language, 'topShops')}>
      <StoreHead
        title={tr(language, 'topShops')} subtitle={tr(language, 'shopsSubtitle')}
        to="/shops" ctaLabel={tr(language, 'viewAllShops')}
      />
      {loading ? <SkeletonGrid count={LATEST_SHOPS_LIMIT} variant="shop" grid={SHOP_GRID} />
        : failed ? <ErrorState language={language} onRetry={onRetry} retrying={retrying} />
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
                <ShopCard shop={s} stats={stats} statsLoading={statsLoading} language={language} onOpen={onOpen} />
              </Reveal>
            ))}
          </div>
        )}
    </Band>
  );
});

const ProductSection = memo(({
  title, subtitle, products, loading, failed, errorHost, onRetry, retrying, cta, emptyLabel, skeletonCount = 4,
  darkMode, language, saved, onSave, onAddToCart,
}) => {
  const [secRef, visible] = useOnScreen();
  if (failed && products.length === 0) {
    if (!errorHost) return null;
    return (
      <Band sectionRef={secRef} visible={visible} label={title}>
        <StoreHead title={title} subtitle={subtitle} to={cta?.to} ctaLabel={cta?.label} />
        <ErrorState language={language} onRetry={onRetry} retrying={retrying} />
      </Band>
    );
  }
  if (!loading && products.length === 0 && !emptyLabel) return null;
  return (
    <Band sectionRef={secRef} visible={visible} label={title}>
      <StoreHead title={title} subtitle={subtitle} to={cta?.to} ctaLabel={cta?.label} />
      {loading ? <SkeletonGrid count={skeletonCount} />
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
      <Suspense fallback={<div aria-hidden="true" className="nb-sk h-64 w-full" />}>
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
  const rootRef = useRef(null);

  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const [saved, toggleSaved] = useSavedProducts();
  const [lowerSeen, setLowerSeen] = useState(false);
  const markLowerSeen = useCallback(() => setLowerSeen(true), []);

  useSmoothMotion(rootRef);

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

  const heroMedia = useMemo(() => {
    const dealImage = deals.find((d) => d.imageUrl)?.imageUrl || '';
    const newImage = products.find((p) => p.imageUrl && p.imageUrl !== dealImage)?.imageUrl || '';
    const topPercent = deals.length ? Math.round(deals[0].discount) : 0;
    return { dealImage, newImage, topPercent };
  }, [deals, products]);

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
      ref={rootRef}
      dir={languageDirection(language)}
      lang={language}
      className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-clip`}
    >
      <Device3DStyles />
      <style>{EXTRAS_CSS}</style>
      <Defs3D />
      <Toaster darkMode={darkMode} />
      <ConnectionBanner language={language} />

      <div aria-hidden="true" className="hp-progress" />

      <div className="hp-hero-in">
        <SectionBoundary silent {...guard}>
          <HeroShowcase
            language={language}
            darkMode={darkMode}
            dealImage={heroMedia.dealImage}
            newImage={heroMedia.newImage}
            topPercent={heroMedia.topPercent}
          />
        </SectionBoundary>
      </div>

      <SectionBoundary {...guard}>
        <BenefitsBar language={language} />
      </SectionBoundary>

      <SectionBoundary {...guard}>
        <CategorySection
          categories={categories} counts={categoryCounts} showCount={!!data}
          loading={categoriesLoading} failed={categoriesError} onRetry={retryCategories} retrying={categoriesFetching}
          language={language} darkMode={darkMode}
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

      <SectionBoundary {...guard}>
        <ProductSection
          skeletonCount={RAIL_LIMIT}
          title={tr(language, 'tabsTitle')} subtitle={tr(language, 'tabsSub')}
          products={products} loading={isLoading} failed={productsFailed} emptyLabel={tr(language, 'noProducts')}
          darkMode={darkMode} language={language} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart}
        />
      </SectionBoundary>

      <LazyMount minHeight={320}>
        <SectionBoundary {...guard}>
          <ShopsTrustSection shops={latestShops} loading={isLoading} failed={shopsFailed} language={language} />
        </SectionBoundary>
      </LazyMount>

      <LazyMount minHeight={520} onShow={markLowerSeen}>
        <SectionBoundary {...guard}>
          <TopRatedSection
            shops={topShops} stats={shopStats} statsLoading={statsLoading}
            loading={isLoading} failed={shopsFailed} language={language} onOpen={openShop}
          />
        </SectionBoundary>
      </LazyMount>

      <LazyMount minHeight={520}>
        <SectionBoundary {...guard}>
          <ShopsSection
            shops={latestShops} stats={shopStats} statsLoading={statsLoading}
            loading={isLoading} failed={shopsFailed} onRetry={retryHome} retrying={homeFetching}
            darkMode={darkMode} language={language} onOpen={openShop}
          />
        </SectionBoundary>
      </LazyMount>

      <LazyMount minHeight={260}>
        <OffersLoader darkMode={darkMode} language={language} />
      </LazyMount>

      <div
        className={`fixed bottom-5 end-5 z-40 transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
          showTop ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible translate-y-4 scale-90 opacity-0'
        }`}
      >
        <button type="button" onClick={scrollToTop} aria-label={tr(language, 'backToTop')} className="nb-btn nb-btn-a nb-focus h-12 w-12">
          <FiArrowUp aria-hidden="true" className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>

      <CookieConsent language={language} />
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