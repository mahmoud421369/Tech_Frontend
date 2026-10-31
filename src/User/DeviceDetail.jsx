import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useParams, useNavigate, useNavigationType, Link } from 'react-router-dom';
import {
  FiChevronLeft, FiChevronRight, FiShoppingCart, FiCheck, FiTag, FiBox, FiCalendar, FiPackage,
  FiMinus, FiPlus, FiAlertCircle, FiDollarSign, FiAward, FiShield, FiHeart, FiStar, FiRotateCcw,
} from 'react-icons/fi';
import { RiStoreLine } from 'react-icons/ri';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../common/api/api';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import {
  LISTING_CSS, readStorage, safeImageUrl, kindOfCategory, clamp, clean, loadSwal, useLangFont, useHScroll,
} from '../components/user/ListingKit';
import { IsoIllustration, isoCatKey } from '../components/user/IsoIllustrations';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false, gcTime: 10 * 60 * 1000 } } });

const RELATED_LIMIT = 10;
const TOGETHER_LIMIT = 2;
const CARD_IMG_W = 480;
const CARD_IMG_H = 480;
const MAIN_IMG_W = 900;
const MAIN_IMG_H = 900;
const SAVED_KEY = 'nb_saved_devices';
const SPEC_MAX = 50;
const LOW_STOCK = 5;
const TAB_IDS = ['overview', 'specs', 'reviews'];
const TAB_KEYS = { overview: 'tabOverview', specs: 'tabSpecs', reviews: 'tabReviews' };
const EMPTY_LIST = [];

const categoryPath = (id) => `/products/category/${encodeURIComponent(id)}`;

const NB_FONT = "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const NB_FONT_STYLE = { fontFamily: NB_FONT };
const ensureNbFont = () => {
  if (typeof document === 'undefined' || document.getElementById('nb-font')) return;
  [['https://fonts.googleapis.com', false], ['https://fonts.gstatic.com', true]].forEach(([href, cors]) => {
    const l = document.createElement('link');
    l.rel = 'preconnect'; l.href = href; if (cors) l.crossOrigin = '';
    document.head.appendChild(l);
  });
  const link = document.createElement('link');
  link.id = 'nb-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
};

const NB_CSS = `
.nb{--nb-bg:#f3f4f6;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e2e5e9;--nb-soft:#e2e5e9;--nb-accent:#10b981;--nb-on:#04261a;--nb-sale:#dc2626;--nb-pos:#15803d;--nb-media:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#121212;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#212121;--nb-soft:#212121;--nb-accent:#39ff88;--nb-on:#022c22;--nb-sale:#fb7185;--nb-pos:#4ade80;--nb-media:#1e1e1e}
.nb-seq>section:nth-of-type(odd){background:var(--nb-bg)}
.nb-seq>section:nth-of-type(even){background:var(--nb-gray)}
.nb-seq>section+section{border-top:2px solid var(--nb-line)}
.nb-bg{background:var(--nb-bg)}
.nb-media{background:var(--nb-media)}
.nb-gray{background:var(--nb-gray)}
.nb-soft{background:var(--nb-soft)}
.nb-muted{color:var(--nb-muted)}
.nb-pos{color:var(--nb-pos)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-block{border-top:2px solid var(--nb-line);margin-top:20px;padding-top:16px}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:5px 5px 0 var(--nb-shadow)}
.nb-pcard{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);contain:layout style;transition:transform .15s ease,box-shadow .15s ease}
.nb-pcard:hover{transform:translate3d(-2px,-2px,0);box-shadow:5px 5px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:52px;height:16px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.nb-squig path{stroke:var(--nb-accent)}
.nb-crumb{border-radius:2px;transition:color .12s ease}
.nb-crumb:hover{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:3px;text-underline-offset:4px}
.nb-crumb:focus-visible{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.nb-chip-a{background:var(--nb-accent);color:var(--nb-on)}
.nb-chip-r{background:#e11d48;color:#ffffff}
.nb-chip-w{background:#f97316;color:#ffffff}
.nb-chip-s{background:#0284c7;color:#ffffff}
.nb-price-old{color:var(--nb-muted);text-decoration:line-through;text-decoration-thickness:1.5px}
.nb-rate{background:var(--nb-gray);border-radius:6px}
.nb-fab{display:flex;align-items:center;justify-content:center;flex:none;background:#ffffff;color:#111111;border:1.5px solid #d4d4d8;box-shadow:0 1px 3px rgba(0,0,0,.15);cursor:pointer;transition:transform .12s ease,background-color .12s ease}
.nb-fab:hover:not(:disabled){transform:scale(1.06)}
.nb-fab:active:not(:disabled){transform:scale(.94)}
.nb-fab:disabled{opacity:.45;cursor:not-allowed}
.nb-fab:focus-visible{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-fab-on{background:var(--nb-accent);color:var(--nb-on);border-color:var(--nb-line)}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-accent);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within,.nb-thumb:focus-visible{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-box{display:flex;align-items:center;justify-content:center;flex:none;width:20px;height:20px;border:2px solid var(--nb-line);background:var(--nb-card);color:var(--nb-on)}
.nb-box-on{background:var(--nb-accent)}
.nb-thumb{border:2px solid var(--nb-line);background:var(--nb-media);overflow:hidden;cursor:pointer;box-shadow:2px 2px 0 var(--nb-shadow);transition:transform .12s ease,box-shadow .12s ease}
.nb-thumb:hover{transform:translate(-1px,-1px)}
.nb-thumb-on{transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-accent)}
.nb-row:nth-child(odd){background:var(--nb-gray)}
.nb-fade{animation:nbFade .26s ease both}
@keyframes nbFade{from{opacity:0}to{opacity:1}}
.nb-up{animation:nbUp .22s ease both}
@keyframes nbUp{from{transform:translate3d(0,100%,0)}to{transform:translate3d(0,0,0)}}
.nb-hide-sb{scrollbar-width:none;-ms-overflow-style:none}
.nb-hide-sb::-webkit-scrollbar{display:none}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
@media (prefers-reduced-motion:reduce){.nb-pcard,.nb-btn,.nb-fab,.nb-thumb,.nb-crumb{transition:none}.nb-fade,.nb-up{animation:none}}
`;
const STYLE_EL = <style>{`${UI3D_CSS}${EXTRAS_CSS}${LISTING_CSS}${NB_CSS}`}</style>;

const useScrollTopOnEnter = () => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
};

const useInView = (margin = '500px') => {
  const [el, setEl] = useState(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (seen || !el) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [el, seen, margin]);
  return [setEl, seen];
};

const readSaved = () => {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const useSavedProducts = () => {
  const [ids, setIds] = useState(readSaved);
  const toggle = useCallback((id) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { }
      return next;
    });
  }, []);
  const set = useMemo(() => new Set(ids), [ids]);
  return [set, toggle];
};

const DEFAULT_TEXT = {
  en: {
    save: 'Save', saved: 'Saved',
    youSave: 'Save {{value}}', originalPrice: 'Original price', discountedPrice: 'Price after discount', discountValue: 'Discount', specifications: 'Specifications',
    breadcrumbHome: 'Home', ratingsCount: '{{count}} Ratings', sellingOutFast: 'Selling out fast',
    deliveryInfo: 'Delivery information', express: 'express', fastDelivery: 'Fast delivery', deliveryNote: 'Express shipping on in-stock items',
    paymentOptions: 'Payment options', boughtTogether: 'Frequently bought together', thisItem: 'This item', totalPrice: 'Total price', addSelected: 'Add {{count}} items to cart',
    soldBy: 'Sold by', returnsEasy: 'Easy and hassle-free returns', securePayments: 'Secure payments',
    tabOverview: 'Product overview', tabSpecs: 'Specifications', tabReviews: 'Ratings & reviews', highlights: 'Highlights',
    noReviews: 'No reviews yet', ratingOutOf: 'out of 5',
  },
  ar: {
    save: 'حفظ', saved: 'تم الحفظ',
    youSave: 'وفّر {{value}}', originalPrice: 'السعر الأصلي', discountedPrice: 'السعر بعد الخصم', discountValue: 'الخصم', specifications: 'المواصفات',
    breadcrumbHome: 'الرئيسية', ratingsCount: '{{count}} تقييم', sellingOutFast: 'ينفد بسرعة',
    deliveryInfo: 'معلومات التوصيل', express: 'إكسبريس', fastDelivery: 'توصيل سريع', deliveryNote: 'شحن إكسبريس للمنتجات المتوفرة',
    paymentOptions: 'خيارات الدفع', boughtTogether: 'يُشترى معًا بشكل متكرر', thisItem: 'هذا المنتج', totalPrice: 'السعر الإجمالي', addSelected: 'أضف {{count}} منتجات إلى السلة',
    soldBy: 'يباع بواسطة', returnsEasy: 'إرجاع سهل وبدون متاعب', securePayments: 'مدفوعات آمنة',
    tabOverview: 'نظرة عامة', tabSpecs: 'المواصفات', tabReviews: 'التقييمات والمراجعات', highlights: 'أبرز المميزات',
    noReviews: 'لا توجد مراجعات بعد', ratingOutOf: 'من 5',
  },
  fr: {
    save: 'Enregistrer', saved: 'Enregistré',
    youSave: 'Économisez {{value}}', originalPrice: "Prix d'origine", discountedPrice: 'Prix après remise', discountValue: 'Remise', specifications: 'Caractéristiques',
    breadcrumbHome: 'Accueil', ratingsCount: '{{count}} avis', sellingOutFast: 'Bientôt épuisé',
    deliveryInfo: 'Informations de livraison', express: 'express', fastDelivery: 'Livraison rapide', deliveryNote: 'Expédition express pour les produits en stock',
    paymentOptions: 'Modes de paiement', boughtTogether: 'Souvent achetés ensemble', thisItem: 'Cet article', totalPrice: 'Prix total', addSelected: 'Ajouter {{count}} articles au panier',
    soldBy: 'Vendu par', returnsEasy: 'Retours simples et sans souci', securePayments: 'Paiements sécurisés',
    tabOverview: 'Présentation', tabSpecs: 'Caractéristiques', tabReviews: 'Avis et évaluations', highlights: 'Points forts',
    noReviews: 'Aucun avis pour le moment', ratingOutOf: 'sur 5',
  },
};
const DETAIL_SECTIONS = {
  en: enTranslations.deviceDetail,
  ar: arTranslations.deviceDetail,
  fr: frTranslations.deviceDetail,
};
const translators = {};
const getT = (lang) => {
  if (!translators[lang]) {
    const dict = { ...DEFAULT_TEXT.en, ...DETAIL_SECTIONS.en, ...DEFAULT_TEXT[lang], ...DETAIL_SECTIONS[lang] };
    translators[lang] = (key, values) => {
      let text = dict[key] ?? key;
      if (values) for (const k of Object.keys(values)) text = text.split(`{{${k}}}`).join(String(values[k]));
      return text;
    };
  }
  return translators[lang];
};

const pick = (obj, key) => (typeof key === 'string' && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined);

const CONDITION = {
  NEW: { chip: 'nb-chip-a', badge: 'bg-emerald-700', key: 'conditionNew' },
  USED: { chip: 'nb-chip-w', badge: 'bg-amber-700', key: 'conditionUsed' },
  REFURBISHED: { chip: 'nb-chip-s', badge: 'bg-sky-700', key: 'conditionRefurbished' },
};
const condOf = (c) => pick(CONDITION, c) || null;
const condLabel = (t, c) => (pick(CONDITION, c) ? t(pick(CONDITION, c).key) : clean(c, 30) || t('conditionUnknown'));

const NUMBER_FORMAT = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const COMPACT_FORMAT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const fmt = (n) => NUMBER_FORMAT.format(Number(n) || 0);
const fmtPrice = (n, currency) => `${currency} ${fmt(n)}`;
const fmtDate = (v, lang) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
};
const round2 = (n) => Math.round(n * 100) / 100;

const computeFinal = (price, type, value) => {
  if (!(price > 0) || !(value > 0) || !type) return price;
  if (type === 'PERCENTAGE') return value < 100 ? round2(price - (price * value) / 100) : price;
  return value < price ? round2(price - value) : price;
};

const toSpecList = (v) => {
  const source = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[\n,،]/) : EMPTY_LIST;
  if (!source.length) return EMPTY_LIST;
  const out = [];
  for (const s of source) {
    const c = clean(typeof s === 'string' ? s : s?.name ?? s?.value ?? '', 120);
    if (c) out.push(c);
    if (out.length >= SPEC_MAX) break;
  }
  return out.length ? out : EMPTY_LIST;
};

const parseSpecs = (list) => {
  const highlights = [];
  const pairs = [];
  for (const s of list) {
    const hit = /^([^:：]{1,40})[:：]\s*(.+)$/.exec(s);
    if (hit) pairs.push([hit[1].trim(), hit[2].trim()]);
    else highlights.push(s);
  }
  return { highlights, pairs };
};

const galleryOf = (p) => {
  const extra = [p.images, p.imageUrls, p.gallery].find(Array.isArray) || [];
  const list = [p.imageUrl, ...extra.map((i) => (typeof i === 'string' ? i : i?.url || i?.imageUrl))]
    .map(safeImageUrl)
    .filter(Boolean);
  return [...new Set(list)].slice(0, 8);
};

const normalizeProduct = (p, detailed = false) => {
  const base = Math.max(0, Number(p.price) || 0);
  const legacyPct = clamp(Number(p.discount) || 0, 0, 100);
  const legacyOld = Math.max(0, Number(p.oldPrice ?? p.originalPrice) || 0);
  const apiFinal = Number(p.finalPrice);
  const discountValue = Number(p.discountValue) || 0;
  const apiType = p.discountType || null;
  let price = base;
  let finalPrice = base;
  if (apiFinal > 0 && apiFinal < base) finalPrice = apiFinal;
  else if (discountValue > 0 && apiType) finalPrice = computeFinal(base, apiType, discountValue);
  else if (legacyPct) finalPrice = round2(base * (1 - legacyPct / 100));
  else if (legacyOld > base) price = legacyOld;
  const saving = round2(Math.max(0, price - finalPrice));
  const discount = price > 0 ? (saving / price) * 100 : 0;
  const images = detailed ? galleryOf(p) : [safeImageUrl(p.imageUrl)].filter(Boolean);
  return {
    id: String(p.id),
    rawId: p.id,
    name: clean(String(p.name ?? ''), 160),
    description: clean(String(p.description ?? ''), detailed ? 3000 : 200),
    specifications: detailed ? toSpecList(p.specifications) : EMPTY_LIST,
    categoryId: p.categoryId ?? p.category?.id ?? null,
    categoryName: clean(String(p.categoryName ?? ''), 80),
    condition: typeof p.condition === 'string' ? p.condition : '',
    stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
    deleted: !!p.deleted,
    shopId: p.shopId != null ? String(p.shopId) : '',
    shopName: clean(String(p.shopName ?? p.brandName ?? ''), 80),
    createdAt: p.createdAt || null,
    rating: clamp(Number(p.rating ?? p.averageRating) || 0, 0, 5),
    reviews: Math.max(0, Number(p.reviewCount ?? p.reviewsCount ?? p.ratingCount) || 0),
    price,
    finalPrice,
    saving,
    discount,
    pct: saving > 0 ? Math.max(1, Math.round(discount)) : 0,
    images,
    imageUrl: images[0] || '',
  };
};

const Shell = ({ language, darkMode, className = '', children }) => {
  const font = useLangFont(language);
  const isAr = language === 'ar';
  return (
    <div dir={languageDirection(language)} lang={language} style={isAr ? font.style : NB_FONT_STYLE}
      className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-hidden ${isAr ? font.className : ''} ${className}`}>
      {STYLE_EL}
      <Defs3D />
      <Toaster darkMode={darkMode} />
      {children}
    </div>
  );
};

const UnderlinedTitle = memo(({ text }) => {
  const s = String(text || '');
  const i = s.lastIndexOf(' ');
  const head = i > 0 ? s.slice(0, i + 1) : '';
  const tail = i > 0 ? s.slice(i + 1) : s;
  return (
    <>
      {head}
      <span className="relative inline-block">
        {tail}
        <svg aria-hidden="true" focusable="false" viewBox="0 0 100 10" preserveAspectRatio="none" className="nb-squig pointer-events-none absolute inset-x-0 -bottom-2 h-2.5 w-full">
          <path d="M1 6 C 20 2, 40 9, 60 5 S 90 3, 99 6" fill="none" strokeWidth="5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </span>
    </>
  );
});

const CardTitle = memo(({ children }) => (
  <h2 className="mb-5 flex items-center gap-3 text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
    <span className="nb-bar flex-none" aria-hidden="true" />
    <span className="min-w-0"><span className="nb-ul">{children}</span></span>
  </h2>
));

const DeviceArt = memo(({ category, label, darkMode, big = false }) => (
  <div role="img" aria-label={label} className="nb-media relative flex h-full w-full items-center justify-center overflow-hidden">
    {big
      ? <IsoIllustration type={isoCatKey(kindOfCategory(category))} darkMode={darkMode} onGreen={false} className="relative h-4/5 w-4/5" />
      : <FiBox className="h-1/2 w-1/2 text-emerald-500" aria-hidden="true" />}
  </div>
));

const DeviceImage = memo(({ src, alt, category, className, label, darkMode, big = false, eager = false, width = CARD_IMG_W, height = CARD_IMG_H }) => {
  const [failed, setFailed] = useState(false);
  const handleError = useCallback(() => setFailed(true), []);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) return <DeviceArt category={category} label={label} darkMode={darkMode} big={big} />;
  return (
    <img
      src={src} alt={alt} width={width} height={height} decoding="async" referrerPolicy="no-referrer"
      loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'low'}
      onError={handleError} className={className}
    />
  );
});

const ExpressTag = memo(({ t }) => (
  <span className="nb-line inline-flex w-fit items-center overflow-hidden border-2 text-[11px] font-extrabold italic leading-none">
    <span className="bg-yellow-300 px-1.5 py-1 text-black">{t('express')}</span>
    <span className="bg-black px-1.5 py-1 text-white">{t('fastDelivery')}</span>
  </span>
));

const Stars = memo(({ value, size = 'h-5 w-5' }) => (
  <span className="inline-flex gap-0.5" aria-hidden="true">
    {[1, 2, 3, 4, 5].map((n) => (
      <FiStar key={n} className={`${size} ${n <= Math.round(value) ? 'nb-pos' : 'nb-muted'}`} fill={n <= Math.round(value) ? 'currentColor' : 'none'} />
    ))}
  </span>
));

const PriceLine = memo(({ product, currency, t, big = false }) => {
  const discounted = product.saving > 0;
  return (
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2" dir="ltr">
      <span className="sr-only">{discounted ? `${t('discountedPrice')}: ` : ''}</span>
      <span className={`font-semibold ${big ? 'text-sm' : 'text-xs'}`}>{currency}</span>
      <span className={`font-extrabold leading-tight tabular-nums tracking-tight ${big ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>{fmt(product.finalPrice)}</span>
      {discounted && (
        <>
          <span className={`nb-price-old font-semibold tabular-nums ${big ? 'text-sm' : 'text-[11px]'}`}>
            <span className="sr-only">{t('originalPrice')}: </span>
            {fmt(product.price)}
          </span>
          <span className={`nb-pos font-extrabold tabular-nums ${big ? 'text-base' : 'text-xs'}`} title={t('discountValue')}>{product.pct}%</span>
        </>
      )}
    </div>
  );
});

const ProductCard = memo(({ product, darkMode, onAddToCart, onOpen, onSave, isSaved = false, t }) => {
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(timer.current); }; }, []);

  const cond = condOf(product.condition);
  const out = product.stock <= 0;
  const low = product.stock > 0 && product.stock <= LOW_STOCK;
  const currency = t('currency');
  const open = useCallback(() => onOpen(product.id), [onOpen, product.id]);
  const save = useCallback((e) => { e.stopPropagation(); onSave(product.rawId); }, [onSave, product.rawId]);
  const handleKey = useCallback((e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }, [open]);
  const handleCart = useCallback(async (e) => {
    e.stopPropagation();
    if (out || busy) return;
    setBusy(true);
    const ok = await onAddToCart(product);
    if (!mounted.current) return;
    setBusy(false);
    if (ok) { setAdded(true); clearTimeout(timer.current); timer.current = setTimeout(() => mounted.current && setAdded(false), 1400); }
  }, [onAddToCart, product, out, busy]);

  return (
    <article
      onClick={open} onKeyDown={handleKey} tabIndex={0} aria-label={product.name}
      className="nb-pcard group relative flex h-full cursor-pointer flex-col focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--nb-accent)]"
    >
      <div className="nb-media relative aspect-square w-full overflow-hidden">
        <DeviceImage src={product.imageUrl} alt={product.name} category={product.categoryName} label={t('imageUnavailable')} darkMode={darkMode}
          className="absolute inset-0 h-full w-full object-contain p-3" />
        {cond && (
          <span className={`absolute start-0 top-0 z-10 px-2 py-1 text-[11px] font-bold leading-none text-white ${cond.badge}`}>{condLabel(t, product.condition)}</span>
        )}
        <button type="button" onClick={save} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
          className="nb-fab absolute end-2 top-2 z-10 h-8 w-8 rounded-full">
          <FiHeart className={`h-4 w-4 ${isSaved ? 'text-rose-500' : ''}`} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        <button type="button" onClick={handleCart} disabled={out || busy} aria-label={t('addToCart')} title={t('addToCart')}
          className={`nb-fab absolute bottom-2 end-2 z-10 h-9 w-9 rounded-lg ${added ? 'nb-fab-on' : ''}`}>
          {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            : added ? <FiCheck className="h-5 w-5" /> : <FiPlus className="h-5 w-5" />}
        </button>
      </div>
      <div className="nb-line flex min-w-0 flex-1 flex-col gap-1.5 border-t-2 p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">{product.name}</h3>
        <p className="nb-muted line-clamp-2 min-h-[2.5rem] text-xs leading-5">{product.description || t('noDescription')}</p>
        {product.rating > 0 && (
          <span className="nb-rate inline-flex w-fit items-center gap-1 px-1.5 py-0.5 text-xs font-bold tabular-nums" dir="ltr">
            <FiStar className="nb-pos h-3 w-3" fill="currentColor" aria-hidden="true" />
            {product.rating.toFixed(1)}
            {product.reviews > 0 && <span className="nb-muted font-medium">({COMPACT_FORMAT.format(product.reviews)})</span>}
          </span>
        )}
        <div className="mt-auto pt-1">
          <PriceLine product={product} currency={currency} t={t} />
        </div>
        {out ? <p className="text-xs font-bold text-rose-500">{t('outOfStock')}</p>
          : low ? (
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <span aria-hidden="true" className="h-3 w-3 flex-shrink-0 rounded-sm bg-orange-500" />{t('onlyLeft', { count: product.stock })}
            </p>
          ) : (
            <p className="nb-muted flex min-w-0 items-center gap-1.5 text-xs font-semibold">
              <FiTag aria-hidden="true" className="h-3 w-3 flex-shrink-0" /><span className="truncate">{product.categoryName || t('uncategorized')}</span>
            </p>
          )}
      </div>
    </article>
  );
});

const ProductSlider = memo(({ title, products, darkMode, isRTL, saved, onSave, onAddToCart, onOpen, t }) => {
  const { ref, edge, scroll } = useHScroll(products.length, isRTL);
  if (!products.length) return null;
  const BackIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const ForwardIcon = isRTL ? FiChevronLeft : FiChevronRight;
  return (
    <section aria-label={title}>
      <header className="mb-6 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />{t('breadcrumbShop')}</p>
          <h2 className="mt-3 text-2xl font-extrabold leading-[1.15] tracking-tight sm:text-3xl"><UnderlinedTitle text={title} /></h2>
        </div>
        <div className="flex flex-none gap-2">
          <button type="button" className="nb-btn h-10 w-10" onClick={() => scroll('back')} disabled={!edge.l} aria-label={t('previous')}><BackIcon className="h-4 w-4" /></button>
          <button type="button" className="nb-btn h-10 w-10" onClick={() => scroll('forward')} disabled={!edge.r} aria-label={t('next')}><ForwardIcon className="h-4 w-4" /></button>
        </div>
      </header>
      <div ref={ref} className="nb-hide-sb -mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-2 pb-6 pt-2 motion-reduce:scroll-auto">
        {products.map((p) => (
          <div key={p.id} className="w-44 flex-shrink-0 snap-start sm:w-56">
            <ProductCard product={p} darkMode={darkMode} onAddToCart={onAddToCart} onOpen={onOpen} onSave={onSave} isSaved={saved.has(p.rawId)} t={t} />
          </div>
        ))}
      </div>
    </section>
  );
});

const Breadcrumb = memo(({ categoryId, categoryName, productName, t }) => (
  <nav aria-label={t('breadcrumb')} className="flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase sm:text-sm">
    <Link to="/" className="nb-crumb">{t('breadcrumbHome')}</Link>
    <FiChevronRight className="nb-muted h-3 w-3 flex-shrink-0 rtl:rotate-180" aria-hidden="true" />
    <Link to="/devices" className="nb-crumb">{t('breadcrumbShop')}</Link>
    {categoryName && (
      <>
        <FiChevronRight className="nb-muted h-3 w-3 flex-shrink-0 rtl:rotate-180" aria-hidden="true" />
        {categoryId != null && categoryId !== ''
          ? <Link to={categoryPath(categoryId)} title={categoryName} className="nb-crumb max-w-[10rem] truncate">{categoryName}</Link>
          : <span className="max-w-[10rem] truncate">{categoryName}</span>}
      </>
    )}
    <FiChevronRight className="nb-muted h-3 w-3 flex-shrink-0 rtl:rotate-180" aria-hidden="true" />
    <span className="nb-muted max-w-[14rem] truncate" aria-current="page">{productName}</span>
  </nav>
));

const Gallery = memo(({ product, cond, darkMode, isSaved, onSave, t }) => {
  const images = product.images;
  const [active, setActive] = useState(0);
  const count = images.length;
  const src = images[active];
  const go = useCallback((d) => setActive((i) => (i + d + count) % count), [count]);

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {count > 1 && (
        <ul className="nb-hide-sb flex flex-none gap-3 overflow-x-auto p-1 pb-2 lg:max-h-[34rem] lg:w-[4.75rem] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-1 lg:pe-2">
          {images.map((s, i) => (
            <li key={s} className="flex-none">
              <button type="button" onClick={() => setActive(i)} aria-label={`${product.name} ${i + 1}`} aria-current={i === active ? 'true' : undefined}
                className={`nb-thumb block h-16 w-16 lg:h-[4.25rem] lg:w-[4.25rem] ${i === active ? 'nb-thumb-on' : ''}`}>
                <img src={s} alt="" width={96} height={96} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="block h-full w-full object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="nb-card relative aspect-square min-w-0 flex-1 overflow-hidden !bg-[color:var(--nb-media)] lg:max-h-[34rem]">
        {cond && <span className={`absolute start-0 top-0 z-10 px-3 py-1.5 text-xs font-bold leading-none text-white ${cond.badge}`}>{condLabel(t, product.condition)}</span>}
        <button type="button" onClick={onSave} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
          className="nb-fab absolute end-3 top-3 z-10 h-10 w-10 rounded-full">
          <FiHeart className={`h-5 w-5 ${isSaved ? 'text-rose-500' : ''}`} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        <DeviceImage key={src || 'none'} src={src} alt={product.name} category={product.categoryName} label={t('imageUnavailable')} darkMode={darkMode} big eager={active === 0}
          width={MAIN_IMG_W} height={MAIN_IMG_H} className="nb-fade absolute inset-0 h-full w-full object-contain p-6" />
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={t('previous')} className="nb-fab absolute start-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full opacity-90">
              <FiChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t('next')} className="nb-fab absolute end-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full opacity-90">
              <FiChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>
            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5" aria-hidden="true">
              {images.map((s, i) => <span key={s} className={`h-2 border-2 border-[color:var(--nb-line)] transition-all ${i === active ? 'w-5 bg-[color:var(--nb-accent)]' : 'w-2 bg-white'}`} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

const BoughtTogether = memo(({ product, others, onAddMany, currency, t }) => {
  const [excluded, setExcluded] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const items = useMemo(() => [product, ...others].filter((p) => p.stock > 0), [product, others]);
  const picked = useMemo(() => items.filter((p) => !excluded.has(p.id)), [items, excluded]);
  const total = useMemo(() => picked.reduce((s, p) => s + p.finalPrice, 0), [picked]);
  const toggle = useCallback((id) => setExcluded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }), []);
  const add = useCallback(async () => {
    if (busy || !picked.length) return;
    setBusy(true);
    try { await onAddMany(picked); } finally { setBusy(false); }
  }, [busy, picked, onAddMany]);

  if (items.length < 2) return null;

  return (
    <section aria-label={t('boughtTogether')} className="nb-block">
      <h3 className="mb-4 text-base font-extrabold uppercase"><span className="nb-ul">{t('boughtTogether')}</span></h3>
      <ul className="nb-hide-sb flex items-stretch gap-2 overflow-x-auto p-1 pb-3">
        {items.map((p, i) => {
          const on = !excluded.has(p.id);
          return (
            <React.Fragment key={p.id}>
              {i > 0 && <li aria-hidden="true" className="flex flex-none items-center"><FiPlus className="h-4 w-4" /></li>}
              <li className="w-32 flex-none">
                <label className={`nb-card relative block h-full cursor-pointer p-2 !shadow-[3px_3px_0_var(--nb-shadow)] transition-opacity ${on ? '' : 'opacity-55'}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(p.id)} className="peer sr-only" aria-label={p.name} />
                  <span className={`nb-box absolute end-1.5 top-1.5 z-10 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-[color:var(--nb-accent)] ${on ? 'nb-box-on' : ''}`}>
                    {on && <FiCheck className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
                  </span>
                  <span className="nb-line nb-media mb-2 block aspect-square overflow-hidden border-2">
                    <DeviceImage src={p.imageUrl} alt="" category={p.categoryName} label={p.name} className="h-full w-full object-contain p-1" />
                  </span>
                  <span className="line-clamp-2 block text-[11px] font-semibold leading-snug">{i === 0 ? t('thisItem') : p.name}</span>
                  <span className="mt-1 block text-xs font-extrabold tabular-nums" dir="ltr">{fmtPrice(p.finalPrice, currency)}</span>
                </label>
              </li>
            </React.Fragment>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          <span className="nb-muted font-semibold">{t('totalPrice')}: </span>
          <span className="font-extrabold tabular-nums" dir="ltr">{fmtPrice(total, currency)}</span>
        </p>
        <button type="button" onClick={add} disabled={busy || !picked.length} aria-busy={busy} className="nb-btn nb-btn-a h-10 px-4 text-xs uppercase">
          <FiShoppingCart className="h-4 w-4" /> {t('addSelected', { count: picked.length })}
        </button>
      </div>
    </section>
  );
});

const SpecTable = memo(({ pairs }) => {
  const half = Math.ceil(pairs.length / 2);
  const cols = pairs.length > 6 ? [pairs.slice(0, half), pairs.slice(half)] : [pairs];
  return (
    <div className={`grid gap-x-6 gap-y-4 ${cols.length > 1 ? 'lg:grid-cols-2' : ''}`}>
      {cols.map((rows, ci) => (
        <dl key={ci} className="nb-line min-w-0 overflow-hidden border-2">
          {rows.map(([k, v]) => (
            <div key={k} className="nb-row grid grid-cols-5 gap-3 px-3 py-2.5 text-sm">
              <dt className="nb-muted col-span-2 break-words font-bold">{k}</dt>
              <dd className="col-span-3 break-words font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  );
});

const StickyBuyBar = memo(({ product, currency, qty, adding, disabled, onAdd, darkMode, t }) => (
  <div className="nb-up nb-bg nb-line fixed inset-x-0 bottom-0 z-40 border-t-2 pb-[env(safe-area-inset-bottom)]">
    <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
      <span className="nb-line nb-media block h-12 w-12 flex-none overflow-hidden border-2">
        <DeviceImage src={product.imageUrl} alt="" category={product.categoryName} label={product.name} darkMode={darkMode} className="h-full w-full object-contain p-1" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold">{product.name}</p>
        <PriceLine product={product} currency={currency} t={t} />
      </div>
      <button type="button" onClick={onAdd} disabled={disabled || adding} aria-busy={adding} className="nb-btn nb-btn-a h-11 flex-none px-5 text-xs uppercase">
        <FiShoppingCart className="h-4 w-4" /> <span className="hidden sm:inline">{adding ? t('adding') : t('addToCart')}</span>
        {qty > 1 && <span className="tabular-nums">×{qty}</span>}
      </button>
    </div>
  </div>
));

const DetailSkeleton = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-8" aria-hidden="true" role="status">
    <div className="nb-gray nb-line aspect-square animate-pulse border-2 motion-reduce:animate-none lg:col-span-5" />
    <div className="space-y-4 lg:col-span-4">
      {[90, 60, 40, 100, 100, 70].map((w, i) => <div key={i} className="nb-gray h-6 animate-pulse motion-reduce:animate-none" style={{ width: `${w}%` }} />)}
    </div>
    <div className="nb-gray nb-line h-72 animate-pulse border-2 motion-reduce:animate-none md:col-span-2 lg:col-span-3" />
  </div>
);

const DeviceDetailContent = memo(({ id, addToCart, darkMode }) => {
  const navigate = useNavigate();
  const language = useAppLanguage();
  const isRTL = languageDirection(language) === 'rtl';
  const t = getT(language);
  useScrollTopOnEnter();

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [buyEl, setBuyEl] = useState(null);
  const [showBar, setShowBar] = useState(false);
  const [saved, toggleSaved] = useSavedProducts();
  const [relatedRef, relatedNear] = useInView('600px');

  useEffect(() => { ensureNbFont(); }, []);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: async ({ signal }) => normalizeProduct((await api.get(`/api/products/${encodeURIComponent(id)}`, { signal })).data, true),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allProducts = EMPTY_LIST } = useQuery({
    queryKey: ['productsAll'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/products', { signal });
      const list = res.data?.content || res.data || [];
      if (!Array.isArray(list)) return [];
      const out = [];
      for (const p of list) if (p && p.id != null && !p.deleted) out.push(normalizeProduct(p));
      return out;
    },
    enabled: !!product,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => { if (product?.name) document.title = `${product.name} | ${t('siteName')}`; }, [product?.name, t]);
  useEffect(() => { if (isError) toast({ icon: 'error', title: t('errorTitle'), text: t('productNotFound'), timer: 3500 }); }, [isError, t]);

  useEffect(() => {
    if (!buyEl || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(buyEl);
    return () => io.disconnect();
  }, [buyEl]);

  const productId = product?.id;
  useEffect(() => {
    if (!productId || typeof IntersectionObserver === 'undefined') return undefined;
    const els = TAB_IDS.map((tid) => document.getElementById(tid)).filter(Boolean);
    if (!els.length) return undefined;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActiveTab(e.target.id); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [productId]);

  const selectTab = useCallback((tid) => {
    setActiveTab(tid);
    document.getElementById(tid)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const specs = useMemo(() => parseSpecs(product?.specifications || EMPTY_LIST), [product?.specifications]);

  const { sameCategory, moreGroup } = useMemo(() => {
    if (!product) return { sameCategory: EMPTY_LIST, moreGroup: { title: '', products: EMPTY_LIST } };
    const pool = allProducts.filter((p) => p.id !== product.id);
    const cat = pool.filter((p) => p.categoryId != null && p.categoryId === product.categoryId);
    const seen = new Set(cat.map((p) => p.id));
    const rest = pool.filter((p) => !seen.has(p.id));
    const byShop = product.shopId ? rest.filter((p) => p.shopId === product.shopId) : EMPTY_LIST;
    return {
      sameCategory: cat.slice(-RELATED_LIMIT),
      moreGroup: byShop.length
        ? { title: t('moreFromShop', { name: product.shopName || t('breadcrumbShop') }), products: byShop.slice(-RELATED_LIMIT) }
        : { title: t('otherDevices', { condition: condLabel(t, product.condition).toLowerCase() }), products: rest.filter((p) => p.condition === product.condition).slice(-RELATED_LIMIT) },
    };
  }, [allProducts, product, t]);

  const togetherOthers = useMemo(() => sameCategory.filter((p) => p.stock > 0).slice(-TOGETHER_LIMIT), [sameCategory]);

  const postToCart = useCallback((p, qty) => api.post('/api/cart/items', { productId: p.id, quantity: qty }), []);

  const ensureLogin = useCallback(async () => {
    if (readStorage('authToken')) return true;
    const Swal = await loadSwal();
    const r = await Swal.fire({
      title: t('loginRequiredTitle'), text: t('loginRequiredText'), icon: 'info',
      showCancelButton: true, confirmButtonText: t('goToLogin'), cancelButtonText: t('cancel'),
    });
    if (r.isConfirmed) navigate('/login');
    return false;
  }, [navigate, t]);

  const successToast = useCallback((name) => {
    window.dispatchEvent(new Event('cart:updated'));
    toast({ icon: 'success', title: t('addedToCart'), text: t('addedToCartText', { name: clean(name, 60) }), timer: 2500 });
  }, [t]);
  const failToast = useCallback((err) => toast({ icon: 'error', title: t('errorTitle'), text: clean(err?.response?.data?.message, 120) || t('addFailed'), timer: 3000 }), [t]);

  const unavailable = !product || product.deleted || product.stock <= 0;

  const handleAddToCart = useCallback(async () => {
    if (!product || unavailable || adding) return;
    if (!(await ensureLogin())) return;
    setAdding(true);
    try {
      await postToCart(product, quantity);
      addToCart?.({ ...product, price: product.finalPrice, quantity });
      successToast(product.name);
    } catch (err) {
      failToast(err);
    } finally {
      setAdding(false);
    }
  }, [product, unavailable, adding, ensureLogin, postToCart, quantity, addToCart, successToast, failToast]);

  const handleAddMany = useCallback(async (items) => {
    if (!items.length || !(await ensureLogin())) return false;
    const results = await Promise.allSettled(items.map((p) => postToCart(p, 1)));
    const okItems = items.filter((_, i) => results[i].status === 'fulfilled');
    const failed = results.find((r) => r.status === 'rejected');
    if (okItems.length) successToast(okItems.map((p) => clean(p.name, 30)).join(', '));
    if (failed) failToast(failed.reason);
    return okItems.length > 0;
  }, [ensureLogin, postToCart, successToast, failToast]);

  const handleRelatedAdd = useCallback(async (p) => {
    if (!(await ensureLogin())) return false;
    try { await postToCart(p, 1); successToast(p.name); return true; } catch (err) { failToast(err); return false; }
  }, [ensureLogin, postToCart, successToast, failToast]);

  const openProduct = useCallback((pid) => navigate(`/device/${encodeURIComponent(pid)}`), [navigate]);
  const goBack = useCallback(() => navigate(-1), [navigate]);
  const saveCurrent = useCallback(() => { if (product) toggleSaved(product.rawId); }, [product, toggleSaved]);

  if (isLoading) {
    return (
      <Shell language={language} darkMode={darkMode}>
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 lg:px-8"><DetailSkeleton /></div>
      </Shell>
    );
  }

  if (!product) {
    return (
      <Shell language={language} darkMode={darkMode} className="flex items-center justify-center px-4">
        <div className="nb-card w-full max-w-sm space-y-4 p-8 text-center">
          <IsoIllustration type="shopEmpty" darkMode={darkMode} onGreen={false} className="mx-auto h-32 w-32" />
          <h2 className="text-xl font-extrabold uppercase">{t('productNotFound')}</h2>
          <button type="button" onClick={goBack} className="nb-btn nb-btn-a mx-auto px-5 py-2.5 text-xs uppercase"><FiChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t('goBack')}</button>
        </div>
      </Shell>
    );
  }

  const currency = t('currency');
  const cond = condOf(product.condition);
  const listed = fmtDate(product.createdAt, language);
  const isSaved = saved.has(product.rawId);
  const discounted = product.saving > 0;
  const lowStock = product.stock > 0 && product.stock <= LOW_STOCK;
  const stockStatus = unavailable
    ? { label: t('outOfStock'), cls: 'nb-chip-r' }
    : product.stock > 10
      ? { label: t('inStock'), cls: 'nb-chip-a' }
      : { label: t('onlyLeft', { count: product.stock }), cls: 'nb-chip-w' };
  const maxQty = Math.max(1, product.stock);
  const qty = clamp(quantity, 1, maxQty);

  const facts = [
    { icon: FiTag, text: product.categoryName || t('uncategorized') },
    { icon: FiBox, text: condLabel(t, product.condition) },
    { icon: FiPackage, text: product.stock > 0 ? t('stockCount', { count: product.stock }) : t('outOfStock') },
    listed && { icon: FiCalendar, text: t('listed', { date: listed }) },
  ].filter(Boolean);

  const buyTrust = [
    [FiRotateCcw, t('returnsEasy')],
    [FiShield, t('securePayments')],
    [FiDollarSign, t('cashOnDelivery')],
    [FiAward, t('authentic')],
  ];

  return (
    <Shell language={language} darkMode={darkMode}>
      <div className="nb-seq">
        <section aria-label={product.name}>
          <div className="mx-auto max-w-7xl mt-5 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
            <Breadcrumb categoryId={product.categoryId} categoryName={product.categoryName} productName={product.name} t={t} />

            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
              <div className="min-w-0 lg:col-span-5">
                <Gallery key={product.id} product={product} cond={cond} darkMode={darkMode} isSaved={isSaved} onSave={saveCurrent} t={t} />
              </div>

              <div className="min-w-0 lg:col-span-4">
                {product.shopName && product.shopId && (
                  <Link to={`/shops/${encodeURIComponent(product.shopId)}`} className="mb-3 inline-flex max-w-full items-center gap-1.5 text-sm font-bold underline-offset-4 hover:underline">
                    <RiStoreLine className="nb-ic h-4 w-4 flex-shrink-0" /><span className="truncate">{product.shopName}</span>
                  </Link>
                )}
                <h1 className="break-words text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{product.name}</h1>

                <div className="mt-5">
                  <PriceLine product={product} currency={currency} t={t} big />
                  {discounted && <p className="nb-pos mt-1.5 text-sm font-bold" dir="auto">{t('youSave', { value: fmtPrice(product.saving, currency) })}</p>}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {lowStock && <span className="nb-chip nb-chip-w"><FiAlertCircle className="h-3 w-3" aria-hidden="true" />{t('sellingOutFast')}</span>}
                  <span className={`nb-chip ${cond ? cond.chip : ''}`}>{condLabel(t, product.condition)}</span>
                  <span className={`nb-chip ${stockStatus.cls}`}>{stockStatus.label}</span>
                </div>

                {product.deleted && (
                  <p className="nb-chip nb-chip-r mt-4 !px-3 !py-2"><FiAlertCircle className="h-4 w-4 flex-shrink-0" /> {t('unavailable')}</p>
                )}

                <section aria-label={t('deliveryInfo')} className="nb-block">
                  <h3 className="mb-3 text-base font-extrabold uppercase"><span className="nb-ul">{t('deliveryInfo')}</span></h3>
                  {unavailable ? (
                    <p className="text-sm font-bold text-rose-500">{t('outOfStock')}</p>
                  ) : (
                    <ExpressTag t={t} />
                  )}
                </section>

                <section aria-label={t('paymentOptions')} className="nb-block">
                  <h3 className="mb-3 text-base font-extrabold uppercase"><span className="nb-ul">{t('paymentOptions')}</span></h3>
                  <p className="flex items-center gap-2 text-sm font-semibold"><FiDollarSign className="nb-ic h-4 w-4 flex-shrink-0" aria-hidden="true" />{t('cashOnDelivery')}</p>
                </section>

                {!unavailable && <BoughtTogether product={product} others={togetherOthers} onAddMany={handleAddMany} currency={currency} t={t} />}
              </div>

              <aside className="min-w-0 md:col-span-2 lg:col-span-3">
                <div ref={setBuyEl} className="nb-card flex flex-col gap-4 p-4 sm:p-5 lg:sticky lg:top-24">
                  <div>
                    <PriceLine product={product} currency={currency} t={t} big />
                    <span className={`nb-chip mt-2 ${stockStatus.cls}`}>{stockStatus.label}</span>
                  </div>

                  {product.shopName && (
                    <p className="flex items-center gap-2 text-sm">
                      <RiStoreLine className="nb-ic h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      <span className="nb-muted font-semibold">{t('soldBy')}</span>
                      {product.shopId
                        ? <Link to={`/shops/${encodeURIComponent(product.shopId)}`} className="min-w-0 truncate font-bold underline-offset-4 hover:underline">{product.shopName}</Link>
                        : <span className="min-w-0 truncate font-bold">{product.shopName}</span>}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-extrabold uppercase">{t('quantity')}</span>
                    <div className="nb-field inline-flex items-center">
                      <button type="button" aria-label={t('decreaseQuantity')} onClick={() => setQuantity(Math.max(1, qty - 1))} disabled={qty <= 1 || unavailable} className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-[color:var(--nb-gray)] disabled:opacity-40"><FiMinus className="h-4 w-4" /></button>
                      <span className="nb-line min-w-[2.5rem] border-x-2 px-2 py-2 text-center text-sm font-extrabold tabular-nums" aria-live="polite" dir="ltr">{qty}</span>
                      <button type="button" aria-label={t('increaseQuantity')} onClick={() => setQuantity(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty || unavailable} className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-[color:var(--nb-gray)] disabled:opacity-40"><FiPlus className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleAddToCart} disabled={unavailable || adding} aria-busy={adding} className="nb-btn nb-btn-a h-12 min-w-0 flex-1 text-xs uppercase">
                      <FiShoppingCart className="h-4 w-4" /> {adding ? t('adding') : t('addToCart')}
                    </button>
                    <button type="button" onClick={saveCurrent} aria-pressed={isSaved} aria-label={isSaved ? t('saved') : t('save')} title={isSaved ? t('saved') : t('save')}
                      className={`nb-btn h-12 w-12 flex-shrink-0 ${isSaved ? 'nb-btn-on' : ''}`}>
                      <FiHeart className="h-5 w-5" fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <ul className="nb-line grid gap-3 border-t-2 pt-4">
                    {buyTrust.map(([Icon, label]) => (
                      <li key={label} className="flex items-center gap-2.5 text-sm font-semibold">
                        <Icon className="nb-ic h-4 w-4 flex-shrink-0" aria-hidden="true" /><span className="min-w-0">{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section aria-label={t('tabOverview')}>
          <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <section id="overview" aria-label={t('tabOverview')} className="nb-card scroll-mt-40 p-4 sm:p-6">
              <CardTitle>{t('tabOverview')}</CardTitle>
              <p className="whitespace-pre-line break-words text-sm leading-relaxed sm:text-[15px]">{product.description || t('noDescription')}</p>

              {specs.highlights.length > 0 && (
                <>
                  <h3 className="mb-3 mt-7 text-base font-extrabold uppercase">{t('highlights')}</h3>
                  <ul className="grid gap-2.5 text-sm leading-relaxed">
                    {specs.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="nb-box nb-box-on mt-0.5 !h-5 !w-5"><FiCheck aria-hidden="true" className="h-3 w-3" strokeWidth={3} /></span>
                        <span className="min-w-0 break-words font-medium">{h}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <ul className="nb-gray nb-line mt-7 grid grid-cols-1 gap-3 border-2 p-4 sm:grid-cols-2">
                {facts.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex min-w-0 items-center gap-2 text-xs font-extrabold uppercase">
                    <Icon aria-hidden="true" className="nb-ic h-4 w-4 flex-shrink-0" /><span className="truncate">{text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section id="specs" aria-label={t('tabSpecs')} className="nb-card scroll-mt-40 p-4 sm:p-6">
              <CardTitle>{t('tabSpecs')}</CardTitle>
              {specs.pairs.length > 0 ? <SpecTable pairs={specs.pairs} /> : <p className="nb-muted text-sm">{t('noDescription')}</p>}
            </section>
          </div>
        </section>

        <section ref={relatedRef} aria-label={t('similarProducts')} style={relatedNear ? undefined : { minHeight: 480 }}>
          {relatedNear && (
            <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 pb-28 sm:space-y-16 sm:px-6 sm:py-16 lg:px-8 lg:pb-16">
              <ProductSlider title={t('similarProducts')} products={sameCategory} darkMode={darkMode} isRTL={isRTL} saved={saved} onSave={toggleSaved} onAddToCart={handleRelatedAdd} onOpen={openProduct} t={t} />
              <ProductSlider title={moreGroup.title} products={moreGroup.products} darkMode={darkMode} isRTL={isRTL} saved={saved} onSave={toggleSaved} onAddToCart={handleRelatedAdd} onOpen={openProduct} t={t} />
            </div>
          )}
        </section>
      </div>

      {showBar && <StickyBuyBar product={product} currency={currency} qty={qty} adding={adding} disabled={unavailable} onAdd={handleAddToCart} darkMode={darkMode} t={t} />}
    </Shell>
  );
});

function DeviceDetailRoute(props) {
  const { id } = useParams();
  return <DeviceDetailContent key={id} id={id} {...props} />;
}
export { queryClient };
export default function DeviceDetail(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <DeviceDetailRoute {...props} />
    </QueryClientProvider>
  );
}