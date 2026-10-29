import React, {
  useEffect, useLayoutEffect, useState, useRef, useMemo, useCallback, useId, memo, lazy, Suspense, useDeferredValue, useTransition,
} from "react";
import { useNavigate, useNavigationType, useParams } from "react-router-dom";
import {
  FiSearch, FiTrash2, FiEdit3, FiMessageCircle, FiCheckCircle, FiShoppingCart, FiX, FiSliders,
  FiChevronLeft, FiChevronRight, FiArrowRight, FiCheck, FiChevronDown,
  FiShield, FiTruck, FiRefreshCw, FiTag, FiPackage, FiAward, FiExternalLink, FiArrowUp,
  FiCalendar, FiClock, FiHeart, FiCornerDownRight,
} from "react-icons/fi";
import { RiStarFill } from "react-icons/ri";
import { LazyMotion, MotionConfig, domAnimation, m, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import api from "../common/api/api";
import useAuthStore from "../common/store/Auth";
import { parseAccessToken } from "../common/utils/authSession";
import { recoverGoogleSession } from "../common/utils/googleSession";
import { useAppLanguage, languageDirection } from "../common/utils/useAppLanguage";
import { UI3D_CSS, Defs3D } from "../components/user/Ui3D";
import { EXTRAS_CSS, Toaster, toast } from "../components/user/UiExtras";
import {
  LISTING_CSS, PAGE_SIZES, CONDITIONS, safeImageUrl, priceStep, clamp, clean, loadSwal,
  useLangFont, useBackToTop, useModalLock, useHScroll,
} from "../components/user/ListingKit";
import { IsoIllustration, isoCatKey } from "../components/user/IsoIllustrations";
import enTranslations from "../locales/en/translation.json";
import arTranslations from "../locales/ar/translation.json";
import frTranslations from "../locales/fr/translation.json";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false, gcTime: 10 * 60 * 1000 } },
});

const SAVED_KEY = "nb_saved_products";
const MOBILE_BATCH = 8;
const HISTOGRAM_BINS = 16;

const NB_FONT = "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
const NB_FONT_STYLE = { fontFamily: NB_FONT };
const ensureNbFont = () => {
  if (typeof document === "undefined" || document.getElementById("nb-font")) return;
  [["https://fonts.googleapis.com", false], ["https://fonts.gstatic.com", true]].forEach(([href, cors]) => {
    const l = document.createElement("link");
    l.rel = "preconnect"; l.href = href; if (cors) l.crossOrigin = "";
    document.head.appendChild(l);
  });
  const link = document.createElement("link");
  link.id = "nb-font";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
};

const SHOP_TRANSLATIONS = {
  en: enTranslations.shop,
  ar: arTranslations.shop || arTranslations.hero?.shopPage,
  fr: frTranslations.shop || frTranslations.hero?.shopPage,
};
const OFFER_TRANSLATIONS = {
  en: enTranslations.offersPage,
  ar: arTranslations.offersPage || arTranslations.hero?.offersPage,
  fr: frTranslations.offersPage || frTranslations.hero?.offersPage,
};
const EXTRA = {
  en: {
    eyebrowCollections: "Collections", eyebrowProducts: "Catalog", eyebrowReviews: "Reviews", perPage: "per page", prevPage: "Previous page", nextPage: "Next page",
    pageN: "Page {n}", pagination: "Pagination", productDetails: "Details", imageUnavailable: "Image unavailable", noAddress: "No address listed",
    addressLabel: "Address", phoneLabel: "Phone", shopReply: "Shop reply",
    eyebrowOffers: "Offers", shopOffers: "Shop Offers", shopOffersSubtitle: "Current deals from this shop", viewAllOffers: "View all offers",
    save: "Save product", saved: "Saved", savedOnly: "Saved only", loadingMore: "Loading more products", endOfList: "You have seen all products",
    all: "All", moreFilters: "More filters", priceMin: "Min", priceMax: "Max", minPriceAria: "Minimum price", maxPriceAria: "Maximum price",
    errorInvalidNumber: "Enter a valid number", errorNegative: "Price can't be negative", errorMinGreater: "Min can't be above max",
    errorMaxLess: "Max can't be below min", errorMaxPrice: "Max price is {{max}}",
    youSave: "Save {{value}}", originalPrice: "Original price", discountedPrice: "Price after discount", discountValue: "Discount",
  },
  ar: {
    eyebrowCollections: "المجموعات", eyebrowProducts: "الكتالوج", eyebrowReviews: "التقييمات", perPage: "لكل صفحة", prevPage: "الصفحة السابقة", nextPage: "الصفحة التالية",
    pageN: "صفحة {n}", pagination: "التنقل بين الصفحات", productDetails: "التفاصيل", imageUnavailable: "الصورة غير متاحة", noAddress: "لا يوجد عنوان مسجل",
    addressLabel: "العنوان", phoneLabel: "الهاتف", shopReply: "رد المتجر",
    eyebrowOffers: "العروض", shopOffers: "عروض المتجر", shopOffersSubtitle: "أحدث العروض الحالية من هذا المتجر", viewAllOffers: "عرض كل العروض",
    save: "حفظ المنتج", saved: "تم الحفظ", savedOnly: "المحفوظة فقط", loadingMore: "جارٍ تحميل المزيد من المنتجات", endOfList: "لقد شاهدت جميع المنتجات",
    all: "الكل", moreFilters: "فلاتر إضافية", priceMin: "الأدنى", priceMax: "الأقصى", minPriceAria: "السعر الأدنى", maxPriceAria: "السعر الأقصى",
    errorInvalidNumber: "أدخل رقمًا صحيحًا", errorNegative: "لا يمكن أن يكون السعر سالبًا", errorMinGreater: "الحد الأدنى لا يمكن أن يتجاوز الأقصى",
    errorMaxLess: "الحد الأقصى لا يمكن أن يقل عن الأدنى", errorMaxPrice: "أقصى سعر هو {{max}}",
    youSave: "وفّر {{value}}", originalPrice: "السعر الأصلي", discountedPrice: "السعر بعد الخصم", discountValue: "الخصم",
  },
  fr: {
    eyebrowCollections: "Collections", eyebrowProducts: "Catalogue", eyebrowReviews: "Avis", perPage: "par page", prevPage: "Page précédente", nextPage: "Page suivante",
    pageN: "Page {n}", pagination: "Pagination", productDetails: "Détails", imageUnavailable: "Image indisponible", noAddress: "Aucune adresse indiquée",
    addressLabel: "Adresse", phoneLabel: "Téléphone", shopReply: "Réponse de la boutique",
    eyebrowOffers: "Offres", shopOffers: "Offres de la boutique", shopOffersSubtitle: "Les offres du moment de cette boutique", viewAllOffers: "Voir toutes les offres",
    save: "Enregistrer le produit", saved: "Enregistré", savedOnly: "Enregistrés uniquement", loadingMore: "Chargement d'autres produits", endOfList: "Vous avez vu tous les produits",
    all: "Tous", moreFilters: "Plus de filtres", priceMin: "Min", priceMax: "Max", minPriceAria: "Prix minimum", maxPriceAria: "Prix maximum",
    errorInvalidNumber: "Saisissez un nombre valide", errorNegative: "Le prix ne peut pas être négatif", errorMinGreater: "Le min ne peut pas dépasser le max",
    errorMaxLess: "Le max ne peut pas être inférieur au min", errorMaxPrice: "Le prix max est {{max}}",
    youSave: "Économisez {{value}}", originalPrice: "Prix d'origine", discountedPrice: "Prix après remise", discountValue: "Remise",
  },
};
const getShopTranslation = (language, key, fallbackOrParams) => {
  const fallback = typeof fallbackOrParams === "string" ? fallbackOrParams : undefined;
  const raw = SHOP_TRANSLATIONS[language]?.[key] || EXTRA[language]?.[key] || SHOP_TRANSLATIONS.en?.[key] || EXTRA.en[key] || fallback || key;
  if (fallbackOrParams && typeof fallbackOrParams === "object" && typeof raw === "string") {
    return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => (fallbackOrParams[k] !== undefined ? fallbackOrParams[k] : ""));
  }
  return raw;
};
const getOfferTranslation = (language, key) => OFFER_TRANSLATIONS[language]?.[key] || OFFER_TRANSLATIONS.en?.[key] || key;

const LOCALE_MAP = { en: "en-GB", ar: "ar-EG", fr: "fr-FR" };

const ChatModal = lazy(() => import("../components/user/UserChatModal"));
const prefetchChatModal = () => import("../components/user/UserChatModal");

const conditionLabel = (t, value) => (value ? t(`condition${value}`, String(value)) : t("conditionUnknown"));

const NUMBER_FORMAT = new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const COMPACT_FORMAT = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const money = (n, currency) => `${currency} ${NUMBER_FORMAT.format(Number(n) || 0)}`;
const round2 = (n) => Math.round(n * 100) / 100;

const computeFinal = (price, type, value) => {
  if (!(price > 0) || !(value > 0) || !type) return price;
  if (type === "PERCENTAGE") return value < 100 ? round2(price - (price * value) / 100) : price;
  return value < price ? round2(price - value) : price;
};

const normalizeProduct = (p) => {
  const price = Math.max(0, Number(p.price) || 0);
  const legacy = clamp(Number(p.discount) || 0, 0, 100);
  const apiFinal = Number(p.finalPrice);
  const discountValue = Number(p.discountValue) || 0;
  const apiType = p.discountType || null;
  let finalPrice = price;
  if (apiFinal > 0 && apiFinal < price) finalPrice = apiFinal;
  else if (discountValue > 0 && apiType) finalPrice = computeFinal(price, apiType, discountValue);
  else if (legacy) finalPrice = round2(price * (1 - legacy / 100));
  const saving = round2(Math.max(0, price - finalPrice));
  return {
    ...p,
    price,
    finalPrice,
    saving,
    discount: price > 0 ? (saving / price) * 100 : 0,
    discountType: saving > 0 ? (apiType || "PERCENTAGE") : null,
    discountValue: saving > 0 && discountValue > 0 ? discountValue : 0,
    imageUrl: safeImageUrl(p.imageUrl || p.image) || "",
    _final: finalPrice,
    _text: `${p.name || ""} ${p.description || ""} ${p.brand || ""}`.toLowerCase(),
    _cat: p.categoryName || p.category || "",
    _ts: Date.parse(p.createdAt) || 0,
  };
};

const discountBadge = (product, currency) => {
  if (product.discountValue > 0 && product.discountType === "FIXED_AMOUNT") return `-${money(product.discountValue, currency)}`;
  if (product.discountValue > 0 && product.discountType === "PERCENTAGE") return `-${NUMBER_FORMAT.format(product.discountValue)}%`;
  return product.discountType === "FIXED_AMOUNT"
    ? `-${money(product.saving, currency)}`
    : `-${Math.max(1, Math.round(product.discount))}%`;
};

const kindOf = (name = "") => {
  const k = String(name).toLowerCase();
  if (k.includes("laptop") || k.includes("notebook") || k.includes("computer")) return "laptop";
  if (k.includes("phone") || k.includes("mobile")) return "phone";
  if (k.includes("tablet") || k.includes("ipad")) return "tablet";
  if (k.includes("audio") || k.includes("headphone") || k.includes("earbud")) return "audio";
  if (k.includes("watch") || k.includes("wear")) return "watch";
  if (k.includes("monitor") || k.includes("screen") || k.includes("tv") || k.includes("display")) return "monitor";
  if (k.includes("game") || k.includes("console")) return "gaming";
  if (k.includes("camera") || k.includes("photo")) return "camera";
  return "box";
};

const REVIEWS_PER_PAGE = 6;
const TOAST_MS = 2800;
const STARS = [1, 2, 3, 4, 5];
const RATING_BARS = [5, 4, 3, 2, 1];
const SOON_DAYS = 3;
const OFFERS_SHOWN = 6;
const EMPTY_LIST = [];

const STAGGER = Array.from({ length: 8 }, (_, i) => ({ "--i": i }));
const ACCENT_FILL = { fill: "var(--nb-accent)" };

const fmtCache = {};
const dateFmt = (language, withYear) => {
  const loc = LOCALE_MAP[language] || "en-GB";
  const k = `${loc}:${withYear}`;
  fmtCache[k] ||= new Intl.DateTimeFormat(loc, withYear ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" });
  return fmtCache[k];
};
const rtfCache = {};
const rtf = (language) => {
  const loc = LOCALE_MAP[language] || "en-GB";
  rtfCache[loc] ||= new Intl.RelativeTimeFormat(loc, { numeric: "auto" });
  return rtfCache[loc];
};
const toDate = (v) => {
  if (v == null || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const daysLeftNum = (end) => {
  const e = toDate(end);
  if (!e) return null;
  const diff = Math.ceil((e - new Date()) / 86400000);
  return diff < 0 ? null : diff;
};
const formatRange = (start, end, language) => {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return "";
  return `${dateFmt(language, false).format(s)} — ${dateFmt(language, true).format(e)}`;
};
const normType = (type) => {
  const s = String(type ?? "").toUpperCase();
  if (s === "PERCENTAGE" || s === "PERCENT") return "PERCENTAGE";
  if (s === "FIXED_AMOUNT" || s === "FIXED_VALUE" || s === "FIXED") return "FIXED_AMOUNT";
  return "";
};
const normalizeOffer = (o) => {
  const type = normType(o.discountType);
  const isPct = type === "PERCENTAGE";
  const raw = Math.max(0, Number(o.discountValue) || 0);
  return {
    id: String(o.id),
    name: clean(String(o.name ?? ""), 120),
    description: o.description ? clean(String(o.description), 600) : "",
    discountType: type,
    discountValue: isPct ? Math.min(raw, 100) : raw,
    startDate: o.startDate || null,
    endDate: o.endDate || null,
    status: o.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    shopId: o.shopId != null ? String(o.shopId) : "",
    shopName: o.shopName ? clean(String(o.shopName), 80) : "",
  };
};
const EMPTY_OFFER = { discountType: "", discountValue: 0, status: "INACTIVE" };
const useOfferMeta = (offer, language, currency) =>
  useMemo(() => {
    const days = daysLeftNum(offer.endDate);
    const isPct = offer.discountType === "PERCENTAGE";
    const isFixed = offer.discountType === "FIXED_AMOUNT";
    return {
      isPct,
      isFixed,
      isActive: offer.status === "ACTIVE",
      remaining: days === null ? null : rtf(language).format(days, "day"),
      urgent: days !== null && days <= SOON_DAYS,
      range: formatRange(offer.startDate, offer.endDate, language),
      amount: isPct ? `${offer.discountValue}%` : isFixed ? money(offer.discountValue, currency) : String(offer.discountValue),
    };
  }, [offer, language, currency]);

const useIsMobile = (query = "(max-width: 1023.98px)") => {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return matches;
};

const readSaved = () => {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const useSavedProducts = () => {
  const [ids, setIds] = useState(readSaved);
  const toggle = useCallback((id) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);
  useEffect(() => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(ids)); } catch { }
  }, [ids]);
  const set = useMemo(() => new Set(ids), [ids]);
  return [set, toggle];
};

const NB_CSS = `
.nb{--nb-bg:#f3f4f6;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e2e5e9;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;--nb-sale:#dc2626;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#121212;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#212121;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22;--nb-sale:#fb7185}
.nb-dark .border-dotted,.nb-dark .nb-dot{border-color:#3f3f3f}
.nb-seq{border-top:2px solid var(--nb-line)}
.nb-seq>section:nth-of-type(odd){background:var(--nb-bg)}
.nb-seq>section:nth-of-type(even){background:var(--nb-gray)}
.nb-seq>section+section{border-top:2px solid var(--nb-line)}
.nb-bg{background:var(--nb-bg)}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:5px 5px 0 var(--nb-shadow);transition:transform .15s ease,box-shadow .15s ease}
.nb-lift{contain:layout style;backface-visibility:hidden}
.nb-lift:hover{transform:translate3d(-2px,-2px,0);box-shadow:7px 7px 0 var(--nb-shadow)}
.nb-num{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;background:var(--nb-btn);color:var(--nb-on);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);font-size:12px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1}
.nb-num-sm{width:24px;height:24px;font-size:10px;box-shadow:1px 1px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:52px;height:16px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.nb-rule{display:block;width:100%;height:4px;margin-top:8px;background:var(--nb-accent)}
.nb-squig path{stroke:var(--nb-accent)}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.nb-chip-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-chip-r{background:#e11d48;color:#fff}
.nb-chip-w{background:#fbbf24;color:#04261a}
.nb-chip-n{background:var(--nb-gray);color:var(--nb-muted);border-style:dashed}
.nb-sale{color:var(--nb-sale)}
.nb-price-old{color:var(--nb-muted);text-decoration:line-through;text-decoration-thickness:2px;text-decoration-color:var(--nb-sale)}
.nb-save{display:inline-flex;align-items:center;gap:4px;max-width:100%;padding:1px 7px;background:var(--nb-btn);color:var(--nb-on);border:2px solid var(--nb-line);font-size:10px;font-weight:800;text-transform:uppercase;line-height:1.5;white-space:nowrap}
.nb-ribbon{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:var(--nb-sale);color:#fff;border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);font-size:11px;font-weight:800;line-height:1.3;font-variant-numeric:tabular-nums}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-arrow{display:inline-flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;background:var(--nb-btn);color:var(--nb-on);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);cursor:pointer;transition:transform .15s ease}
.nb-arrow:focus-visible{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-lift:hover .nb-arrow{transform:translateX(3px)}
.nb[dir=rtl] .nb-lift:hover .nb-arrow{transform:translateX(-3px)}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-opt{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;text-align:start;cursor:pointer}
.nb-opt-active{background:var(--nb-gray)}
.nb-opt[aria-selected=true]{background:var(--nb-btn);color:var(--nb-on)}
.nb-media{background:var(--nb-gray)}
.nb-media-b{border:2px solid var(--nb-line)}
.nb-pic{border-radius:1rem;contain:layout paint}
.nb-box{display:flex;align-items:center;justify-content:center;flex:none;width:20px;height:20px;border:2px solid var(--nb-line);background:var(--nb-card);color:var(--nb-on)}
.nb-box-on{background:var(--nb-btn)}
.nb-bin{background:var(--nb-gray)}
.nb-bin-on{background:var(--nb-accent);box-shadow:inset 0 0 0 1.5px var(--nb-line)}
.nb-range{position:absolute;inset:0;width:100%;height:20px;margin:0;appearance:none;-webkit-appearance:none;background:transparent;pointer-events:none}
.nb-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;box-sizing:border-box;pointer-events:auto;width:20px;height:20px;border-radius:0;background:var(--nb-accent);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);cursor:grab}
.nb-range::-moz-range-thumb{box-sizing:border-box;pointer-events:auto;width:20px;height:20px;border-radius:0;background:var(--nb-accent);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);cursor:grab}
.nb-sub{background:var(--nb-gray);border:2px solid var(--nb-line);border-inline-start:5px solid var(--nb-accent)}
.nb-star-on{color:#f59e0b}
.nb-star-off{color:var(--nb-muted);opacity:.35}
@keyframes nbSpin{to{transform:rotate(360deg)}}
.nb-spin{animation:nbSpin .7s linear infinite}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn,.nb-arrow{transition:none}.nb-spin{animation:none}}
`;
const STYLE_EL = <style>{`${UI3D_CSS}${EXTRAS_CSS}${LISTING_CSS}${NB_CSS}`}</style>;

const EASE = [0.16, 1, 0.3, 1];
const BACKDROP_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: "easeIn" } },
};
const PANEL_MOTION = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.26, ease: EASE } },
  exit: { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18, ease: "easeIn" } },
};
const DRAWER_MOTION = {
  initial: { y: "100%" },
  animate: { y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { y: "100%", transition: { duration: 0.2, ease: "easeIn" } },
};
const GPU = { willChange: "transform, opacity" };

const useScrollTopOnEnter = (key) => {
  const navType = useNavigationType();
  useLayoutEffect(() => {
    if (navType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [key]);
};

const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

const isDuplicateReview = (err) => {
  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const text = `${data.message || ""} ${data.error_code || data.code || ""}`;
  return status === 409 || /already (submitted|reviewed)|duplicate/i.test(text);
};

const reviewError = (err, fallback, ctx, t) => {
  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const raw = String(data.message || "");
  const code = String(data.error_code || data.code || "");
  if (isDuplicateReview(err)) return t("alreadyReviewed");
  if (/only review a shop after delivery/i.test(raw)) return t("reviewAfterDelivery");
  if (/value too long|varying\(255\)/i.test(raw)) return t("commentSaveTooLong");
  if (/shop not found/i.test(raw)) return t("shopNotFoundRefresh");
  if (/only (update|delete) your review/i.test(raw)) return t("onlyOwnReviews");
  if (status === 403) return ctx === "create" ? t("reviewAfterDelivery") : t("onlyOwnReviews");
  if (status === 404) return t("reviewNotFoundRefresh");
  if (/intCompact|rating/i.test(raw)) return t("selectRatingFirst");
  if (status >= 500 || /RUNTIME_ERROR|RT_001/i.test(`${raw} ${code}`) || !raw) return fallback;
  return raw;
};

const PhoneArt = memo(({ className = "h-9 w-9" }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#000" opacity=".18" />
    <rect x="13" y="3" width="22" height="39" rx="5" fill="#0f172a" stroke="#04261a" strokeWidth="2" />
    <rect x="16" y="8" width="16" height="26" rx="2" style={ACCENT_FILL} />
    <path d="M16 8h16v6L16 24z" fill="#fff" opacity=".25" />
    <rect x="21" y="5" width="6" height="1.4" rx=".7" fill="#475569" />
    <circle cx="24" cy="38" r="1.8" fill="#94a3b8" />
  </svg>
));

const PinArt = memo(({ className = "h-9 w-9" }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
    <ellipse cx="24" cy="44" rx="10" ry="2.5" fill="#000" opacity=".18" />
    <path d="M24 42C24 42 9 28 9 18a15 15 0 0 1 30 0c0 10-15 24-15 24z" style={ACCENT_FILL} stroke="#04261a" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="24" cy="18" r="6" fill="#fff" stroke="#04261a" strokeWidth="2" />
  </svg>
));

const UnderlinedTitle = memo(({ text }) => {
  const s = String(text || "");
  const i = s.lastIndexOf(" ");
  const head = i > 0 ? s.slice(0, i + 1) : "";
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

const SectionHead = memo(({ eyebrow, title, subtitle, count, action, as: Tag = "h2" }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
    <div className="min-w-0 max-w-2xl">
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />{eyebrow}</p>
      <Tag className="mt-3 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
        <UnderlinedTitle text={title} />
        {count != null && <span dir="ltr" className="nb-chip ms-3 align-middle text-xs">{count}</span>}
      </Tag>
      {subtitle && <p className="nb-muted mt-4 text-base sm:text-lg">{subtitle}</p>}
    </div>
    {action}
  </header>
));

const NbDropdown = memo(({ value, onChange, options, ariaLabel, className = "", align = "start" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const uid = useId();
  const listId = `${uid}-list`;
  const selectedIdx = Math.max(0, options.findIndex((o) => o.value === value));
  const current = options[selectedIdx];

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setIsOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [isOpen]);
  useEffect(() => { if (isOpen) setActive(selectedIdx); }, [isOpen, selectedIdx]);
  useEffect(() => { if (isOpen) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" }); }, [isOpen, active]);

  const choose = (i) => {
    const o = options[i];
    if (o) onChange(o.value);
    setIsOpen(false);
    btnRef.current?.focus();
  };
  const onKeyDown = (e) => {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); if (!isOpen) setIsOpen(true); else setActive((i) => Math.min(i + 1, last)); break;
      case "ArrowUp": e.preventDefault(); if (!isOpen) setIsOpen(true); else setActive((i) => Math.max(i - 1, 0)); break;
      case "Home": if (isOpen) { e.preventDefault(); setActive(0); } break;
      case "End": if (isOpen) { e.preventDefault(); setActive(last); } break;
      case "Enter": case " ": e.preventDefault(); if (isOpen) choose(active); else setIsOpen(true); break;
      case "Escape": if (isOpen) { e.preventDefault(); e.stopPropagation(); setIsOpen(false); } break;
      case "Tab": setIsOpen(false); break;
      default:
    }
  };

  return (
    <div ref={rootRef} className={`relative ${isOpen ? "z-30" : ""} ${className}`}>
      <button
        ref={btnRef} type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={listId}
        aria-activedescendant={isOpen ? `${uid}-o${active}` : undefined}
        onClick={() => setIsOpen((o) => !o)} onKeyDown={onKeyDown}
        className="nb-field flex h-10 w-full items-center justify-between gap-2 ps-3 pe-3 text-start text-xs font-bold uppercase"
      >
        <span className="truncate">{current?.label}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} tabIndex={-1}
          className={`nb-menu absolute top-full z-30 mt-2 max-h-64 min-w-full overflow-y-auto overscroll-contain py-1 ${align === "end" ? "end-0" : "start-0"}`}>
          {options.map((o, i) => (
            <li key={o.value} id={`${uid}-o${i}`} role="option" aria-selected={o.value === value}
              onPointerEnter={() => setActive(i)} onClick={() => choose(i)}
              className={`nb-opt whitespace-nowrap ${i === active ? "nb-opt-active" : ""}`}>
              <span>{o.label}</span>
              {o.value === value && <FiCheck aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={3} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

const FilterChip = memo(({ label, onRemove }) => (
  <button type="button" onClick={onRemove} className="nb-btn gap-1.5 px-2.5 py-1 text-xs">
    <span className="max-w-[10rem] truncate">{label}</span><FiX className="h-3 w-3 flex-shrink-0" />
  </button>
));

const pageWindow = (cur, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, cur - 1, cur, cur + 1]);
  if (cur <= 3) [2, 3, 4].forEach((x) => set.add(x));
  if (cur >= total - 2) [total - 1, total - 2, total - 3].forEach((x) => set.add(x));
  const nums = [...set].filter((x) => x >= 1 && x <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((x, i) => { if (i && x - nums[i - 1] > 1) out.push(`gap-${x}`); out.push(x); });
  return out;
};

const PAGE_BTN = "inline-flex h-10 min-w-[2.5rem] items-center justify-center border-2 border-[color:var(--nb-line)] bg-[color:var(--nb-card)] px-2 text-sm font-bold tabular-nums text-[color:var(--nb-ink)] shadow-[3px_3px_0_var(--nb-shadow)] transition duration-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_var(--nb-shadow)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--nb-accent)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_var(--nb-shadow)] motion-reduce:transition-none";
const PAGE_BTN_ON = "!bg-[color:var(--nb-btn)] !text-[color:var(--nb-on)]";

const Pagination = memo(({ page, total, onChange, label, t }) => {
  const items = useMemo(() => pageWindow(page, total), [page, total]);
  if (total <= 1) return null;
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          <button type="button" className={PAGE_BTN} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t("prevPage")}>
            <FiChevronLeft aria-hidden="true" className="nb-flip h-4 w-4" />
          </button>
        </li>
        {items.map((x) => (typeof x === "number" ? (
          <li key={x}>
            <button type="button" onClick={() => onChange(x)} aria-label={t("pageN").replace("{n}", x)} aria-current={x === page ? "page" : undefined}
              className={`${PAGE_BTN} ${x === page ? PAGE_BTN_ON : ""}`}>{x}</button>
          </li>
        ) : <li key={x} aria-hidden="true" className="px-1 font-extrabold">…</li>))}
        <li>
          <button type="button" className={PAGE_BTN} disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={t("nextPage")}>
            <FiChevronRight aria-hidden="true" className="nb-flip h-4 w-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
});

const InfiniteSentinel = memo(({ hasMore, shown, total, onMore, t }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return undefined;
    if (typeof IntersectionObserver === "undefined") { onMore(); return undefined; }
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) onMore(); }, { rootMargin: "700px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, shown, onMore]);
  return (
    <div ref={ref} className="flex min-h-[3.5rem] items-center justify-center pt-8" role="status" aria-live="polite">
      {hasMore ? (
        <span className="nb-chip !px-3 !py-1.5">
          <span aria-hidden="true" className="nb-spin h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" />
          {t("loadingMore")}
        </span>
      ) : total > MOBILE_BATCH ? (
        <span className="nb-chip !px-3 !py-1.5"><FiCheck aria-hidden="true" className="h-3 w-3" />{t("endOfList")}</span>
      ) : null}
    </div>
  );
});

const Frame = ({ darkMode, dir, language, font, isAr, children }) => (
  <div dir={dir} lang={language} style={isAr ? font.style : NB_FONT_STYLE}
    className={`nb ${darkMode ? "nb-dark" : ""} min-h-screen overflow-x-hidden ${isAr ? font.className : ""}`}>
    {STYLE_EL}
    {children}
  </div>
);

const DeviceArt = memo(({ name, categoryName, darkMode, label }) => (
  <div
    className="nb-gray absolute inset-0 flex flex-col items-center justify-center gap-1 overflow-hidden"
    role="img" aria-label={name ? `${name} – ${label}` : label}
  >
    <IsoIllustration
      type={isoCatKey(kindOf(categoryName || name))} tone="emerald" darkMode={darkMode} onGreen={false}
      className="h-[64%] w-[64%] transition-transform duration-300 group-hover:scale-105"
    />
    <span className="nb-muted max-w-full truncate px-2 text-[9px] font-extrabold uppercase tracking-widest">{label}</span>
  </div>
));

const ShopBanner = memo(({ darkMode }) => (
  <section aria-hidden="true" className="nb-gray nb-line relative mt-10 h-56 overflow-hidden border-b-2 sm:h-72 lg:h-80">
    <IsoIllustration type="shopHero" darkMode={darkMode} onGreen={false} className="absolute inset-x-0 bottom-0 mx-auto aspect-square h-[92%] max-w-full" />
  </section>
));

const ContactTile = memo(({ art, label, href, children }) => {
  const cls = "nb-field flex w-full min-w-0 items-center justify-start gap-3 px-3 py-2.5 text-start";
  const body = (
    <>
      <span className="nb-media nb-media-b flex h-12 w-12 flex-shrink-0 items-center justify-center">{art}</span>
      <span className="min-w-0 flex-1">
        <span className="nb-muted block text-[10px] font-bold uppercase">{label}</span>
        <span className="block text-sm font-extrabold">{children}</span>
      </span>
    </>
  );
  return href
    ? <a href={href} className={`${cls} transition hover:-translate-x-px hover:-translate-y-px motion-reduce:transition-none`}>{body}</a>
    : <div className={cls}>{body}</div>;
});

const ShopDetails = memo(({ shop, darkMode, stats, onViewProducts, onChat, t }) => {
  const address = clean(shop?.shopAddress?.fullAddress || [shop?.shopAddress?.street, shop?.shopAddress?.city].filter(Boolean).join(", "), 200);
  const phone = shop?.phone ? clean(String(shop.phone), 30) : "";
  return (
    <section aria-label={clean(shop?.name, 120) || t("shopFallback")} className="relative z-20 mx-auto -mt-16 max-w-7xl px-4 pb-10 sm:-mt-24 sm:px-6 sm:pb-16 lg:px-8">
      <div className="nb-card p-4 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <span className="nb-media nb-media-b flex h-16 w-16 flex-shrink-0 items-center justify-center sm:h-24 sm:w-24">
              <IsoIllustration type="shop_store" darkMode={darkMode} onGreen={false} className="h-12 w-12 sm:h-20 sm:w-20" />
            </span>
            <div className="min-w-0">
              <span className="nb-chip nb-chip-a mb-2"><FiCheckCircle className="h-3 w-3" /> {shop?.verified ? t("verifiedShop") : t("officialShop")}</span>
              <h1 className="break-words text-2xl font-extrabold uppercase leading-tight tracking-tight sm:text-4xl">{clean(shop?.name, 120) || t("shopFallback")}</h1>
              <span className="nb-rule" aria-hidden="true" />
              <p className="mt-4 max-w-2xl text-sm leading-relaxed opacity-90 sm:text-base">{clean(shop?.description, 600) || t("shopDescription")}</p>
            </div>
          </div>

          <div className="grid w-full items-start justify-items-stretch gap-3 sm:grid-cols-2 lg:w-[24rem] lg:grid-cols-1">
            <ContactTile art={<PinArt />} label={t("addressLabel")}>
              {address ? <span className="line-clamp-2 break-words">{address}</span> : <span className="nb-chip nb-chip-n"><span className="truncate">{t("noAddress")}</span></span>}
            </ContactTile>
            {phone && (
              <ContactTile art={<PhoneArt />} label={t("phoneLabel")} href={telHref(phone)}>
                <span dir="ltr" className="block truncate text-start">{phone}</span>
              </ContactTile>
            )}
          </div>
        </div>

        <div className="nb-line mt-6 grid grid-cols-3 border-y-2 border-dotted py-4 text-center">
          {stats.map((s) => (
            <div key={s.label} className="min-w-0 px-1">
              <p className="text-xl font-extrabold tabular-nums sm:text-3xl" dir="ltr">{s.value}</p>
              <p className="nb-muted truncate text-[11px] font-bold uppercase sm:text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:max-w-md">
          <button type="button" onClick={onViewProducts} className="nb-btn nb-btn-a px-4 py-2.5 text-sm uppercase"><FiShoppingCart className="h-4 w-4" /> {t("viewProducts")}</button>
          <button type="button" onClick={onChat} onMouseEnter={prefetchChatModal} className="nb-btn px-4 py-2.5 text-sm uppercase"><FiMessageCircle className="nb-ic h-4 w-4" /> {t("chatWithShop")}</button>
        </div>
      </div>
    </section>
  );
});

const OfferStatusChips = memo(({ isActive, remaining, urgent, ot }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <span className={`nb-chip ${isActive ? "nb-chip-a" : ""}`}>{isActive ? ot("active") : ot("inactive")}</span>
    {remaining && <span className={`nb-chip ${urgent ? "nb-chip-w" : ""}`}><FiClock aria-hidden="true" className="h-3 w-3" />{remaining}</span>}
  </div>
));

const ShopOfferCard = memo(({ offer, index, language, currency, onOpen, ot }) => {
  const meta = useOfferMeta(offer, language, currency);
  const open = useCallback(() => onOpen(offer), [onOpen, offer]);
  const stub = meta.isPct ? "bg-amber-400 text-[#04261a]" : "bg-[color:var(--nb-btn)] text-[color:var(--nb-on)]";

  return (
    <article
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) open(); }}
      tabIndex={0}
      aria-label={offer.name}
      style={STAGGER[index % 8]}
      className="anim-fade-up nb-card nb-lift group relative flex h-full cursor-pointer flex-col focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[color:var(--nb-accent)]"
    >
      <div className={`nb-line flex h-24 items-baseline justify-center gap-1.5 border-b-2 pt-5 ${stub}`}>
        <span dir="ltr" className="text-5xl font-extrabold leading-none tabular-nums">{offer.discountValue}{meta.isPct ? "%" : ""}</span>
        <span className="text-xs font-extrabold uppercase">{meta.isFixed ? `${currency} ` : ""}{ot("off")}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        <OfferStatusChips isActive={meta.isActive} remaining={meta.remaining} urgent={meta.urgent} ot={ot} />
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-sm font-extrabold uppercase leading-snug">{offer.name}</h3>
          <span className="nb-rule" aria-hidden="true" />
          <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-5 opacity-90">{offer.description || ot("descriptionFallback")}</p>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 text-xs font-medium">
          {meta.range && <p className="flex items-center gap-1.5"><FiCalendar aria-hidden="true" className="nb-ic h-3.5 w-3.5 flex-shrink-0" /><span dir="ltr" className="truncate">{meta.range}</span></p>}
        </div>
        <div className="nb-line mt-auto flex items-center justify-between gap-2 border-t-2 pt-3">
          <span className="nb-muted text-[10px] font-bold uppercase">{meta.isPct ? ot("percentageDiscount") : ""}</span>
          <span className="nb-arrow" aria-hidden="true"><FiArrowRight className="nb-flip h-4 w-4" /></span>
        </div>
      </div>
    </article>
  );
});

const OfferInfoRow = ({ Icon, label, value }) => (
  <div className="nb-gray nb-line flex items-center gap-3 border-2 border-dotted p-3">
    <span className="nb-chip nb-chip-a !p-1.5"><Icon aria-hidden="true" className="h-4 w-4" /></span>
    <div className="min-w-0 flex-1">
      <p className="nb-muted text-[10px] font-extrabold uppercase">{label}</p>
      <p className="truncate text-sm font-bold">{value}</p>
    </div>
  </div>
);

const ShopOfferModal = memo(({ offer, language, currency, onClose, onViewProducts, ot, t }) => {
  useModalLock(true, onClose);
  const meta = useOfferMeta(offer || EMPTY_OFFER, language, currency);
  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={offer?.name || ot("offerDetails")}>
      <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/70" onClick={onClose} />
      <m.div {...PANEL_MOTION} style={GPU} className="nb-card relative max-h-[92vh] w-full transform-gpu overflow-y-auto overscroll-contain !transition-none sm:max-w-md">
        <div className="nb-gray nb-line relative border-b-2 p-4 pe-14 sm:p-5">
          <h2 className="line-clamp-2 text-base font-extrabold uppercase sm:text-lg">{offer?.name || ot("offerDetails")}</h2>
          <span className="nb-rule" aria-hidden="true" />
          <button type="button" onClick={onClose} aria-label={t("close")} className="nb-btn absolute end-3 top-3 h-8 w-8"><FiX className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          <OfferStatusChips isActive={meta.isActive} remaining={meta.remaining} urgent={meta.urgent} ot={ot} />
          {offer?.description && <p className="text-sm font-medium leading-relaxed opacity-90">{offer.description}</p>}
          <OfferInfoRow Icon={FiTag} label={ot("youSave")} value={meta.amount} />
          {meta.range && <OfferInfoRow Icon={FiCalendar} label={ot("validPeriod")} value={meta.range} />}
          <div className="grid grid-cols-2 gap-3 pb-1 pe-1 pt-2">
            <button type="button" onClick={onClose} className="nb-btn py-2.5 text-sm uppercase">{t("close")}</button>
            <button type="button" onClick={() => { onClose(); onViewProducts(); }} className="nb-btn nb-btn-a py-2.5 text-sm uppercase"><FiShoppingCart className="h-4 w-4" /> {t("viewProducts")}</button>
          </div>
        </div>
      </m.div>
    </div>
  );
});

const PriceBlock = memo(({ product, currency, t, big = false }) => {
  const discounted = product.saving > 0;
  return (
    <div className={`flex min-w-0 flex-col gap-0.5 ${big ? "" : "max-sm:rtl:items-end"}`} dir="ltr">
      {discounted && (
        <span className={`nb-price-old font-semibold tabular-nums ${big ? "text-sm" : "text-[11px]"}`}>
          <span className="sr-only">{t("originalPrice")}: </span>
          {money(product.price, currency)}
        </span>
      )}
      <span className={`truncate font-extrabold leading-tight tabular-nums tracking-tight ${big ? "text-2xl" : "text-base"} ${discounted ? "nb-sale" : ""}`}>
        <span className="sr-only">{discounted ? `${t("discountedPrice")}: ` : ""}</span>
        {money(product._final, currency)}
      </span>
      {discounted && (
        <span dir="auto" className="nb-save mt-1 self-start">
          <FiTag className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{t("youSave", { value: money(product.saving, currency) })}</span>
        </span>
      )}
    </div>
  );
});

const ProductCard = memo(({ product: p, darkMode, index = 0, isSaved = false, onSave, onAddToCart, onDetails, t, className = "" }) => {
  const src = p.imageUrl;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(!src);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const mounted = useRef(true);
  const loadedRef = useRef(false);
  const timer = useRef();

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    loadedRef.current = false;
    setImgLoaded(false);
    setImgError(!src);
    if (!src) return undefined;
    const id = setTimeout(() => { if (!loadedRef.current) setImgError(true); }, 8000);
    return () => clearTimeout(id);
  }, [src]);

  const hasDiscount = p.saving > 0;
  const inStock = p.stock == null || p.stock > 0;
  const name = clean(p.name, 120) || t("product");
  const currency = t("currency");
  const snippet = useMemo(() => clean(p.description, 140) || t("noProductDescription"), [p.description, t]);
  const badge = useMemo(() => (hasDiscount ? discountBadge(p, currency) : ""), [hasDiscount, p, currency]);
  const open = useCallback(() => onDetails(p), [onDetails, p]);
  const openFromArrow = useCallback((e) => { e.stopPropagation(); open(); }, [open]);
  const save = useCallback((e) => { e.stopPropagation(); onSave(p.id); }, [onSave, p.id]);
  const handleLoad = useCallback(() => { loadedRef.current = true; setImgLoaded(true); }, []);
  const handleImgError = useCallback(() => setImgError(true), []);

  const add = useCallback(async (e) => {
    e.stopPropagation();
    if (!inStock || adding) return;
    setAdding(true);
    const ok = await onAddToCart(p);
    if (!mounted.current) return;
    setAdding(false);
    if (ok) {
      setAdded(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => { if (mounted.current) setAdded(false); }, 1400);
    }
  }, [onAddToCart, p, inStock, adding]);

  return (
    <article
      onClick={open} tabIndex={0} aria-label={name} style={STAGGER[index % 8]}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) open(); }}
      className={`anim-fade-up nb-card nb-lift group relative flex h-full cursor-pointer flex-col focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--nb-accent)] ${className}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 min-h-[2.4rem] text-[13px] font-extrabold uppercase leading-snug sm:text-sm">{name}</h3>
          <span className="nb-rule" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="nb-muted mb-1 truncate text-[10px] font-bold uppercase tracking-wide">{clean(p.brand, 40) || clean(p._cat, 40) || t("uncategorized")}</p>
          <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-5 opacity-90">{snippet}</p>
        </div>

        <div className="nb-media nb-pic relative aspect-[3/2] w-full overflow-hidden">
          {imgError ? (
            <DeviceArt name={name} categoryName={p.categoryName || p._cat} darkMode={darkMode} label={t("imageUnavailable")} />
          ) : (
            <>
              {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-black/5" />}
              <img
                src={src} alt={name} width={600} height={400}
                loading="lazy" decoding="async" fetchPriority="low" referrerPolicy="no-referrer"
                onLoad={handleLoad} onError={handleImgError}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              />
            </>
          )}
          {hasDiscount && (
            <span dir="ltr" className="nb-ribbon absolute start-2 top-2 z-10" title={t("discountValue")}>
              <FiTag className="h-3 w-3" aria-hidden="true" />{badge}
            </span>
          )}
          <button type="button" onClick={save} aria-pressed={isSaved} aria-label={isSaved ? t("saved") : t("save")} title={isSaved ? t("saved") : t("save")}
            className={`nb-btn absolute end-2 top-2 z-10 h-8 w-8 ${isSaved ? "nb-btn-on" : ""}`}>
            <FiHeart className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
          </button>
          {p.condition && <span className="nb-chip nb-chip-a absolute bottom-2 end-2 z-10 max-w-[70%]"><span className="truncate">{conditionLabel(t, p.condition)}</span></span>}
        </div>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <PriceBlock product={p} currency={currency} t={t} />
          <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-shrink-0">
            <button type="button" onClick={add} disabled={!inStock || adding} aria-label={t("addToCart")} title={t("addToCart")}
              className={`nb-btn h-9 flex-1 sm:w-9 sm:flex-none ${added ? "nb-btn-on" : ""}`}>
              {adding ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                : added ? <FiCheck className="h-4 w-4" /> : <FiShoppingCart className="h-4 w-4" />}
            </button>
            <button type="button" onClick={openFromArrow} aria-label={t("productDetails")} title={t("productDetails")} className="nb-arrow">
              <FiArrowRight className="nb-flip h-4 w-4" />
            </button>
          </div>
        </div>
        {!inStock && <p className="text-[10px] font-extrabold uppercase text-rose-500">{t("outOfStock")}</p>}
      </div>
    </article>
  );
});

const ProductSkeleton = () => <div className="nb-gray nb-line h-[360px] animate-pulse border-2 motion-reduce:animate-none" />;

const StarRating = memo(({ value, onChange, size = "h-7 w-7 sm:h-9 sm:w-9", t }) => (
  <div className="flex gap-1 sm:gap-2" role="radiogroup" aria-label={t("rating")}>
    {STARS.map((star) => (
      <button key={star} type="button" role="radio" aria-checked={value === star} onClick={() => onChange(star)}
        aria-label={t("rateStars").replace("{star}", star)}
        className="transition-transform hover:scale-110 active:scale-95 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[color:var(--nb-accent)]">
        <RiStarFill className={`${size} ${value >= star ? "nb-star-on" : "nb-star-off"}`} />
      </button>
    ))}
  </div>
));

const ReviewForm = memo(({ t, hasReview, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const send = async () => {
    if (sending) return;
    setSending(true);
    const ok = await onSubmit({ rating, comment });
    if (!mounted.current) return;
    setSending(false);
    if (ok) { setRating(0); setComment(""); }
  };

  return (
    <div className="nb-card p-4 sm:p-6">
      <h3 className="mb-3 text-base font-extrabold uppercase sm:mb-4 sm:text-lg"><span className="nb-ul">{t("shareYourExperience")}</span></h3>
      {hasReview && <p role="status" className="nb-gray nb-line mb-3 border-2 border-dotted px-3 py-2 text-xs font-bold">{t("alreadyReviewedNote")}</p>}
      <StarRating value={rating} onChange={setRating} t={t} />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)}
        placeholder={t("reviewPlaceholder")} maxLength={1000} rows={3} aria-label={t("shareYourExperience")}
        className="nb-field mt-4 w-full resize-none p-3 text-sm font-medium leading-relaxed outline-none placeholder:opacity-60 sm:p-4" />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="nb-muted text-[11px] font-bold" dir="ltr">{comment.length}/1000</span>
      </div>
      <button type="button" onClick={send} disabled={!comment.trim() || rating === 0 || hasReview || sending} className="nb-btn nb-btn-a mt-3 w-full py-2.5 text-sm uppercase sm:py-3">{t("submitReview")}</button>
    </div>
  );
});

const EditReviewModal = memo(({ review, t, onClose, onSave }) => {
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment || "");
  useModalLock(true, onClose);
  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t("editReview")}>
      <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <m.div {...PANEL_MOTION} style={GPU} className="nb-card relative w-full max-w-lg transform-gpu p-5 !transition-none sm:p-8">
        <h3 className="mb-5 text-xl font-extrabold uppercase sm:text-2xl"><span className="nb-ul">{t("editReview")}</span></h3>
        <StarRating value={rating} onChange={setRating} t={t} />
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={4} aria-label={t("editReview")}
          className="nb-field mt-4 w-full resize-none p-3 text-sm font-medium outline-none sm:p-4" />
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="nb-btn px-5 py-2.5 text-sm uppercase">{t("cancel")}</button>
          <button type="button" onClick={() => onSave({ ...review, rating, comment })} className="nb-btn nb-btn-a px-6 py-2.5 text-sm uppercase">{t("update")}</button>
        </div>
      </m.div>
    </div>
  );
});

const ReviewCard = memo(({ review: r, mine, dateLocale, shopName, t, onEdit, onDelete }) => {
  const when = Date.parse(r.createdAt);
  const name = clean(r.userName, 60);
  const reply = r.reply ? clean(r.reply, 1000) : "";
  const replyWhen = Date.parse(r.repliedAt);
  return (
    <article className="nb-card flex h-full min-w-0 flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="nb-chip nb-chip-a !h-10 !w-10 flex-shrink-0 justify-center !text-base">
          {name?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-extrabold uppercase">{name || t("anonymous")}</p>
          {Number.isFinite(when) && (
            <p className="nb-muted text-[11px] font-bold" dir="ltr">
              {new Date(when).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
      <div className="flex" role="img" aria-label={`${r.rating} / 5`}>
        {STARS.map((n) => <RiStarFill key={n} className={`h-4 w-4 ${n <= r.rating ? "nb-star-on" : "nb-star-off"}`} />)}
      </div>
      <p className="flex-1 break-words text-sm leading-relaxed opacity-90">{clean(r.comment, 1000)}</p>
      {mine && (
        <div className="flex flex-shrink-0 gap-2">
          <button type="button" onClick={() => onEdit(r)} aria-label={t("editReview")} title={t("editReview")} className="nb-btn h-8 w-8"><FiEdit3 className="h-4 w-4" /></button>
          <button type="button" onClick={() => onDelete(r.id)} aria-label={t("deleteReview")} title={t("deleteReview")} className="nb-btn h-8 w-8 !text-red-500"><FiTrash2 className="h-4 w-4" /></button>
        </div>
      )}
      {reply && (
        <div role="note" aria-label={t("shopReply")} className="nb-sub ms-3 flex min-w-0 flex-col gap-2 p-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <FiCornerDownRight aria-hidden="true" className="nb-ic nb-flip h-4 w-4 flex-shrink-0" />
            <span className="nb-chip nb-chip-a">{t("shopReply")}</span>
            {shopName && <span className="min-w-0 max-w-full truncate text-[11px] font-extrabold uppercase">{shopName}</span>}
            {Number.isFinite(replyWhen) && (
              <span className="nb-muted text-[11px] font-bold" dir="ltr">
                {new Date(replyWhen).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          <p className="break-words text-sm leading-relaxed opacity-90">{reply}</p>
        </div>
      )}
    </article>
  );
});

const ProductDetailsModal = memo(({ product, darkMode, isSaved, onSave, onClose, onAddToCart, onView, t }) => {
  const hasStock = product.stock != null;
  const inStock = !hasStock || product.stock > 0;
  const hasDiscount = product.saving > 0;
  const currency = t("currency");
  const productName = clean(product.name, 120) || t("product");
  const badge = hasDiscount ? discountBadge(product, currency) : "";
  const [imgError, setImgError] = useState(!product.imageUrl);
  const [added, setAdded] = useState(false);
  const timer = useRef();
  useModalLock(true, onClose);
  useEffect(() => () => clearTimeout(timer.current), []);

  const offers = [
    { icon: FiShield, label: t("verified") },
    { icon: FiTruck, label: t("fastShip") },
    { icon: FiRefreshCw, label: t("returns") },
  ];
  const specs = [
    { icon: FiTag, label: t("category"), value: clean(product.categoryName || product.category, 80) || t("uncategorized") },
    { icon: FiCheckCircle, label: t("condition"), value: conditionLabel(t, product.condition) },
    product.brand && { icon: FiAward, label: t("brand"), value: clean(product.brand, 60) },
    hasStock && { icon: FiPackage, label: t("availability"), value: inStock ? t("inStock") : t("outOfStock") },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={productName}>
      <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <m.div {...PANEL_MOTION} style={GPU} className="nb-card relative max-h-[92vh] w-full transform-gpu overflow-y-auto overscroll-contain !transition-none sm:max-w-lg">
        <div className="absolute end-3 top-3 z-10 flex items-center gap-2">
          <button type="button" onClick={() => onSave(product.id)} aria-pressed={isSaved} aria-label={isSaved ? t("saved") : t("save")} title={isSaved ? t("saved") : t("save")}
            className={`nb-btn h-8 w-8 ${isSaved ? "nb-btn-on" : ""}`}>
            <FiHeart className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
          </button>
          <button type="button" onClick={onClose} aria-label={t("close")} className="nb-btn h-8 w-8"><FiX className="h-4 w-4" /></button>
        </div>

        <div className="nb-media nb-line relative aspect-[16/10] overflow-hidden border-b-2">
          {imgError ? (
            <DeviceArt name={productName} categoryName={product.categoryName || product._cat} darkMode={darkMode} label={t("imageUnavailable")} />
          ) : (
            <img src={product.imageUrl} alt={productName} referrerPolicy="no-referrer" decoding="async"
              onError={() => setImgError(true)} className="h-full w-full object-cover" />
          )}
          {hasDiscount && (
            <span dir="ltr" className="nb-ribbon absolute start-3 top-3" title={t("discountValue")}>
              <FiTag className="h-3 w-3" aria-hidden="true" />{badge}
            </span>
          )}
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-extrabold uppercase leading-snug sm:text-xl">{clean(product.name, 160) || t("product")}</h2>
            <span className="nb-rule" aria-hidden="true" />
            <div className="mt-3">
              <PriceBlock product={product} currency={currency} t={t} big />
            </div>
          </div>

          <section>
            <h3 className="mb-2 text-xs font-extrabold uppercase"><span className="nb-ul">{t("aboutProduct")}</span></h3>
            <p className="text-sm leading-relaxed opacity-90">{clean(product.description, 1500) || t("noProductDescription")}</p>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-extrabold uppercase"><span className="nb-ul">{t("details")}</span></h3>
            <div className="nb-gray nb-line grid grid-cols-1 gap-3 border-2 border-dotted p-3.5 min-[400px]:grid-cols-2">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex min-w-0 items-center gap-2.5">
                  <Icon className="nb-ic h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="nb-muted text-[10px] font-bold uppercase">{label}</p>
                    <p className="truncate text-xs font-extrabold">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <ul className="flex flex-wrap gap-2">
            {offers.map(({ icon: Icon, label }) => <li key={label} className="nb-chip !px-2 !py-1"><Icon className="h-3 w-3" /> {label}</li>)}
          </ul>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={!inStock} className={`nb-btn px-3 py-2.5 text-sm uppercase ${added ? "nb-btn-on" : ""}`}
              onClick={async () => {
                const ok = await onAddToCart(product);
                if (!ok) return;
                setAdded(true);
                clearTimeout(timer.current);
                timer.current = setTimeout(() => setAdded(false), 1600);
              }}>
              {added ? <><FiCheck className="h-4 w-4" /> {t("added")}</> : <><FiShoppingCart className="nb-ic h-4 w-4" /> {t("addToCart")}</>}
            </button>
            <button type="button" onClick={() => onView(product)} className="nb-btn nb-btn-a px-3 py-2.5 text-sm uppercase"><FiExternalLink className="h-4 w-4" /> {t("viewProduct")}</button>
          </div>
        </div>
      </m.div>
    </div>
  );
});

const CategorySlider = memo(({ category, items, darkMode, saved, onSave, onAddToCart, onDetails, t, isRTL }) => {
  const { ref: sliderRef, edge, scroll } = useHScroll(items.length, isRTL);
  const navigate = useNavigate();
  const goToCategory = useCallback(() => navigate(`/products/category/${encodeURIComponent(category.id)}`), [navigate, category.id]);

  const BackIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const ForwardIcon = isRTL ? FiChevronLeft : FiChevronRight;

  if (!items.length) return null;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <button type="button" onClick={goToCategory} className="min-w-0 text-start">
          <span className="block truncate text-lg font-extrabold uppercase sm:text-xl"><span className="nb-ul">{category.name}</span></span>
          <span className="nb-muted mt-1 block text-xs font-bold uppercase"><span dir="ltr">{items.length}</span> {items.length === 1 ? t("item") : t("items")}</span>
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={goToCategory} className="nb-btn nb-btn-a h-9 px-3 text-xs uppercase">
            {t("viewAll")} <FiArrowRight className="nb-flip h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => scroll("back")} disabled={!edge.l} aria-label={t("scrollBack")} className="nb-btn hidden h-9 w-9 sm:flex"><BackIcon className="h-4 w-4" /></button>
          <button type="button" onClick={() => scroll("forward")} disabled={!edge.r} aria-label={t("scrollForward")} className="nb-btn hidden h-9 w-9 sm:flex"><ForwardIcon className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={sliderRef} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 pe-3 ps-1 pt-1 sm:gap-6">
        {items.map((p, i) => (
          <div key={p.id} className="w-[220px] flex-shrink-0 snap-start sm:w-[270px]">
            <ProductCard product={p} darkMode={darkMode} index={i} isSaved={saved.has(p.id)} onSave={onSave} onAddToCart={onAddToCart} onDetails={onDetails} t={t} />
          </div>
        ))}
      </div>
    </div>
  );
});

const OptionRow = memo(({ type, label, count, selected, onClick }) => (
  <button
    type="button" role={type === "check" ? "checkbox" : "radio"} aria-checked={selected} onClick={onClick}
    className="flex w-full items-center gap-2.5 py-1.5 text-start text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--nb-accent)]"
  >
    <span className={`nb-box ${type === "radio" ? "rounded-full" : ""} ${selected ? "nb-box-on" : ""}`}>
      {selected && (type === "check" ? <FiCheck className="h-3 w-3" strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-[color:var(--nb-on)]" />)}
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && <span className="nb-muted text-xs tabular-nums" dir="ltr">{count}</span>}
  </button>
));

const FilterBlock = memo(({ num, title, isOpen, onToggle, children }) => (
  <section className="border-t-2 nb-line">
    <button type="button" onClick={onToggle} aria-expanded={isOpen} className="flex w-full items-center gap-2.5 py-3 text-start">
      <span className="nb-num nb-num-sm">{num}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-extrabold uppercase"><span className="nb-ul">{title}</span></span>
      <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
    </button>
    {isOpen && <div className="min-w-0 pb-4">{children}</div>}
  </section>
));

const NumField = memo(({ value, onCommit, label, t }) => {
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState("");
  useEffect(() => { setDraft(String(value)); }, [value]);
  const commit = () => {
    const n = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(n)) { setError(t("errorInvalidNumber")); setDraft(String(value)); return; }
    const msg = onCommit(n);
    if (msg) { setError(msg); setDraft(String(value)); } else setError("");
  };
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1 block text-[11px] font-bold uppercase">{label}</span>
      <div className={`nb-field flex items-center px-2 py-1.5 text-xs font-bold ${error ? "!border-rose-500" : ""}`} dir="ltr">
        <span className="nb-muted me-1">{t("currency")}</span>
        <input type="number" inputMode="numeric" min={0} value={draft} aria-invalid={!!error}
          onChange={(e) => { setDraft(e.target.value); setError(""); }} onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()} className="w-full min-w-0 bg-transparent tabular-nums outline-none" />
      </div>
      {error && <p role="alert" className="mt-1 text-[11px] font-semibold text-rose-500">{error}</p>}
    </label>
  );
});

const PriceRangeFilter = memo(({ bounds, value, onChange, histogram, t }) => {
  const { max, step } = bounds;
  const [lo, hi] = value;
  const leftPct = (lo / max) * 100;
  const rightPct = (hi / max) * 100;
  const peak = Math.max(1, ...histogram);
  const presets = useMemo(() => {
    const snap = (v) => Math.round(v / step) * step;
    const a = snap(max / 3);
    const b = snap((max * 2) / 3);
    if (!(a > 0 && b > a && b < max)) return [];
    return [
      { label: `< ${COMPACT_FORMAT.format(a)}`, r: [0, a] },
      { label: `${COMPACT_FORMAT.format(a)} – ${COMPACT_FORMAT.format(b)}`, r: [a, b] },
      { label: `> ${COMPACT_FORMAT.format(b)}`, r: [b, max] },
    ];
  }, [max, step]);

  const commitMin = (n) => {
    if (n < 0) return t("errorNegative");
    if (n > hi) return t("errorMinGreater");
    onChange([n, hi]);
    return "";
  };
  const commitMax = (n) => {
    if (n < 0) return t("errorNegative");
    if (n < lo) return t("errorMaxLess");
    if (n > max) return t("errorMaxPrice", { max: max.toLocaleString() });
    onChange([lo, n]);
    return "";
  };

  return (
    <div className="min-w-0 space-y-4" dir="ltr">
      <div className="flex h-12 items-end gap-[3px]" aria-hidden="true">
        {histogram.map((c, i) => {
          const binStart = (i / histogram.length) * max;
          const binEnd = ((i + 1) / histogram.length) * max;
          const inRange = binEnd > lo && binStart < hi;
          return <div key={i} className={`flex-1 ${inRange ? "nb-bin-on" : "nb-bin"}`} style={{ height: `${Math.max(c ? 12 : 4, (c / peak) * 100)}%`, opacity: c ? 1 : 0.5 }} />;
        })}
      </div>
      <div className="relative flex h-5 items-center">
        <div className="nb-gray nb-line absolute inset-x-0 h-2 border-2" />
        <div className="absolute h-2 border-y-2 nb-line bg-[color:var(--nb-accent)]" style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />
        <input type="range" aria-label={t("minPriceAria")} min={0} max={max} step={step} value={lo}
          onChange={(e) => onChange([Math.max(0, Math.min(Number(e.target.value), hi - step)), hi])} className="nb-range" style={{ zIndex: lo > max - step * 3 ? 5 : 3 }} />
        <input type="range" aria-label={t("maxPriceAria")} min={0} max={max} step={step} value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])} className="nb-range" style={{ zIndex: 4 }} />
      </div>
      <div className="flex flex-col gap-4 min-[380px]:flex-row min-[380px]:gap-6">
        <NumField label={t("priceMin")} value={lo} onCommit={commitMin} t={t} />
        <NumField label={t("priceMax")} value={hi} onCommit={commitMax} t={t} />
      </div>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const on = lo === p.r[0] && hi === p.r[1];
            return (
              <button key={p.r.join("-")} type="button" onClick={() => onChange(p.r)} aria-pressed={on}
                className={`nb-btn px-2.5 py-1 text-[11px] ${on ? "nb-btn-on" : ""}`}>
                {p.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

const FilterPanel = memo((p) => {
  const { t, flat, conditionCounts, selectedConditions, toggleCondition, categoryOptions, selectedCategory, setSelectedCategory, totalCount,
    priceBounds, priceValue, setPriceRange, histogram, inStockOnly, setInStockOnly, onSaleOnly, setOnSaleOnly, savedOnly, setSavedOnly,
    open, setOpen, clearFilters, activeFiltersCount } = p;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  return (
    <div className={flat ? "w-full min-w-0 max-w-full overflow-x-hidden" : "nb-card w-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-4"}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-3">
        <h3 className="flex min-w-0 items-center gap-2 text-base font-extrabold uppercase">
          <FiSliders aria-hidden="true" className="h-4 w-4 flex-shrink-0" /> <span className="nb-ul truncate">{t("filters")}</span>
        </h3>
        {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className="flex-shrink-0 text-xs font-bold underline underline-offset-4">{t("resetAll")}</button>}
      </div>

      {priceBounds.max > 0 && (
        <FilterBlock num="01" title={t("priceRange")} isOpen={open.price} onToggle={() => toggle("price")}>
          <div className="min-w-0 px-1">
            <PriceRangeFilter bounds={priceBounds} value={priceValue} onChange={setPriceRange} histogram={histogram} t={t} />
          </div>
        </FilterBlock>
      )}

      <FilterBlock num="02" title={t("condition")} isOpen={open.cond} onToggle={() => toggle("cond")}>
        <div className="min-w-0 break-words">
          {CONDITIONS.map((c) => (
            <OptionRow key={c} type="check" label={conditionLabel(t, c)} count={conditionCounts[c] || 0} selected={selectedConditions.includes(c)} onClick={() => toggleCondition(c)} />
          ))}
          <OptionRow type="check" label={t("inStockOnly")} selected={inStockOnly} onClick={() => setInStockOnly((v) => !v)} />
        </div>
      </FilterBlock>

      {categoryOptions.length > 0 && (
        <FilterBlock num="03" title={t("category")} isOpen={open.cat} onToggle={() => toggle("cat")}>
          <div className="max-h-44 min-w-0 overflow-y-auto overscroll-contain break-words pe-1 sm:max-h-52" role="radiogroup" aria-label={t("category")}>
            <OptionRow type="radio" label={t("all")} count={totalCount} selected={selectedCategory === "all"} onClick={() => setSelectedCategory("all")} />
            {categoryOptions.map(({ name, count }) => (
              <OptionRow key={name} type="radio" label={name} count={count} selected={selectedCategory === name} onClick={() => setSelectedCategory(name)} />
            ))}
          </div>
        </FilterBlock>
      )}

      <FilterBlock num="04" title={t("moreFilters")} isOpen={open.more} onToggle={() => toggle("more")}>
        <div className="min-w-0 break-words">
          <OptionRow type="check" label={t("onSaleOnly")} selected={onSaleOnly} onClick={() => setOnSaleOnly((v) => !v)} />
          <OptionRow type="check" label={t("savedOnly")} selected={savedOnly} onClick={() => setSavedOnly((v) => !v)} />
        </div>
      </FilterBlock>
    </div>
  );
});

const ChatCTABanner = memo(({ darkMode, onOpenChat, t }) => (
  <section aria-label={t("chatBannerTitle")} className="lk-cv py-10 sm:py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div onMouseEnter={prefetchChatModal} className="nb-card group flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:gap-8 sm:p-10 sm:text-start">
        <span className="nb-media nb-media-b flex h-20 w-20 flex-shrink-0 items-center justify-center sm:h-24 sm:w-24">
          <IsoIllustration type="shopChat" darkMode={darkMode} onGreen={false} hoverOnly className="h-16 w-16 sm:h-20 sm:w-20" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 text-lg font-extrabold uppercase sm:text-2xl"><span className="nb-ul">{t("chatBannerTitle")}</span></h3>
          <p className="mt-3 text-sm opacity-80 sm:text-base">{t("chatBannerDescription")}</p>
        </div>
        <button type="button" onClick={onOpenChat} className="nb-btn nb-btn-a w-full flex-shrink-0 px-6 py-3 text-sm uppercase sm:w-auto"><FiMessageCircle className="h-4 w-4" /> {t("startChat")}</button>
      </div>
    </div>
  </section>
));

const ShopContent = ({ darkMode, addToCart }) => {
  const language = useAppLanguage();
  const t = useCallback((key, fallback) => getShopTranslation(language, key, fallback), [language]);
  const ot = useCallback((key) => getOfferTranslation(language, key), [language]);
  const { shopId } = useParams();

  const accessToken = useAuthStore((s) => s.accessToken);
  const storeUserId = useAuthStore((s) => s.userId);
  const tokenClaims = useMemo(() => parseAccessToken(accessToken, { checkExpiry: false }), [accessToken]);
  const knownUserId = storeUserId ?? tokenClaims?.id ?? null;
  const { data: profileIdentity } = useQuery({
    queryKey: ["me", accessToken],
    queryFn: async ({ signal }) => {
      try { return (await api.get("/api/users/profile", { signal })).data; } catch { return null; }
    },
    enabled: !!accessToken && knownUserId == null,
    staleTime: Infinity,
  });
  const userId = knownUserId ?? (profileIdentity?.id != null ? profileIdentity.id : null);
  const isAuthenticated = !!accessToken;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [, startTransition] = useTransition();
  useScrollTopOnEnter(shopId);

  const dir = languageDirection(language);
  const isRTL = dir === "rtl";
  const isAr = language === "ar";
  const dateLocale = LOCALE_MAP[language] || "en-GB";
  const font = useLangFont(language);

  const [saved, toggleSaved] = useSavedProducts();
  const [search, setSearch] = useState("");
  const [conditions, setConditions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRangeState] = useState(null);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(MOBILE_BATCH);
  const [reviewPage, setReviewPage] = useState(1);
  const [editingReview, setEditingReview] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [offerDetail, setOfferDetail] = useState(null);
  const [openChat, setOpenChat] = useState(false);
  const [open, setOpen] = useState({ price: true, cond: true, cat: true, more: true });
  const queryClientLocal = useQueryClient();

  const reviewBusyRef = useRef(false);
  const showTop = useBackToTop();
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const drawerOpen = isMobile && isSidebarOpen;
  useModalLock(drawerOpen, closeSidebar);
  useEffect(() => { if (!isMobile) setIsSidebarOpen(false); }, [isMobile]);
  useEffect(() => { ensureNbFont(); }, []);
  useEffect(() => {
    if (!useAuthStore.getState().accessToken) recoverGoogleSession();
  }, []);

  const filters = useMemo(
    () => ({ search, conditions, selectedCategory, priceRange, onSaleOnly, inStockOnly, savedOnly, sortBy }),
    [search, conditions, selectedCategory, priceRange, onSaleOnly, inStockOnly, savedOnly, sortBy]
  );
  const deferred = useDeferredValue(filters);
  const isStale = deferred !== filters;
  const {
    search: dSearch, conditions: dConds, selectedCategory: dCat, priceRange: dPrice,
    onSaleOnly: dSale, inStockOnly: dStock, savedOnly: dSaved, sortBy: dSort,
  } = deferred;

  useEffect(() => {
    const run = () => prefetchChatModal();
    const id = "requestIdleCallback" in window ? window.requestIdleCallback(run) : setTimeout(run, 1500);
    return () => { if ("cancelIdleCallback" in window) window.cancelIdleCallback(id); else clearTimeout(id); };
  }, []);

  const closeChat = useCallback(() => setOpenChat(false), []);
  const closeEdit = useCallback(() => setEditingReview(null), []);
  const openDetails = useCallback((product) => setDetailsProduct(product), []);
  const closeDetails = useCallback(() => setDetailsProduct(null), []);
  const openOfferDetail = useCallback((offer) => setOfferDetail(offer), []);
  const closeOfferDetail = useCallback(() => setOfferDetail(null), []);
  const goToOffers = useCallback(() => navigate("/offers"), [navigate]);
  const viewProduct = useCallback((product) => navigate(`/device/${encodeURIComponent(product.id)}`), [navigate]);

  const askLogin = useCallback(async () => {
    const Swal = await loadSwal();
    Swal.fire({ title: t("loginRequiredTitle"), text: t("loginRequiredText"), icon: "warning", confirmButtonText: t("loginButton") })
      .then((r) => { if (r.isConfirmed) navigate("/login"); });
  }, [navigate, t]);

  const handleOpenChat = useCallback(() => {
    if (!useAuthStore.getState().accessToken) { askLogin(); return; }
    setOpenChat(true);
  }, [askLogin]);

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ["shop", shopId],
    queryFn: async ({ signal }) => {
      try { return (await api.get(`/api/shops/${encodeURIComponent(shopId)}`, { signal })).data; } catch { return null; }
    },
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories = EMPTY_LIST } = useQuery({
    queryKey: ["categories"],
    queryFn: async ({ signal }) => {
      try {
        const { data } = await api.get("/api/categories", { signal });
        return (data.content || data || []).map((c) => ({ id: c.id, name: String(c.name || c.id) }));
      } catch { return []; }
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: products = EMPTY_LIST, isLoading: productsLoading } = useQuery({
    queryKey: ["products", shopId],
    queryFn: async ({ signal }) => {
      try {
        const { data } = await api.get(`/api/products/shop/${encodeURIComponent(shopId)}`, { signal });
        const list = data.content || data || [];
        if (!Array.isArray(list)) return [];
        return list.filter(Boolean).map(normalizeProduct);
      } catch { return []; }
    },
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: shopOffers = EMPTY_LIST } = useQuery({
    queryKey: ["shopOffers", shopId, userId ?? "anon"],
    queryFn: async ({ signal }) => {
      try {
        const res = await api.get("/api/users/offers", { signal });
        const raw = res.data?.content || res.data || [];
        return (Array.isArray(raw) ? raw : [])
          .filter((o) => o && o.id != null && o.shopId != null && String(o.shopId) === String(shopId))
          .map(normalizeOffer)
          .sort((a, b) => (a.status === "ACTIVE" ? 0 : 1) - (b.status === "ACTIVE" ? 0 : 1));
      } catch { return []; }
    },
    enabled: !!shopId && isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  const { data: reviews = EMPTY_LIST, isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", shopId],
    queryFn: async ({ signal }) => {
      try {
        const { data } = await api.get(`/api/reviews/${encodeURIComponent(shopId)}/reviews`, { signal });
        const list = data.content || data || [];
        return Array.isArray(list) ? list : [];
      } catch { return []; }
    },
    enabled: !!shopId,
    staleTime: 60 * 1000,
  });

  const myReview = useMemo(
    () => (userId != null ? reviews.find((r) => String(r.userId) === String(userId)) || null : null),
    [reviews, userId]
  );

  useEffect(() => {
    document.title = shop?.name ? `${clean(shop.name, 80)} | Tech-Restore` : t("loadingShop");
  }, [shop?.name, t]);

  const handleAddToCart = useCallback(async (product) => {
    if (!useAuthStore.getState().accessToken) {
      askLogin();
      return false;
    }
    try {
      await api.post("/api/cart/items", { productId: product.id, quantity: 1 });
      addToCart?.({ ...product, price: product.finalPrice, quantity: 1 });
      window.dispatchEvent(new Event("cart:updated"));
      toast({ icon: "success", title: t("addedToCartToast"), text: clean(product.name, 60), timer: TOAST_MS });
      return true;
    } catch (err) {
      toast({ icon: "error", title: t("errorTitle"), text: err?.response?.data?.message || t("addToCartFailed"), timer: 3500 });
      return false;
    }
  }, [addToCart, askLogin, t]);

  const submitReview = useCallback(async ({ rating: rawRating, comment: rawComment }) => {
    if (!shop || reviewBusyRef.current) return false;
    if (!useAuthStore.getState().accessToken) {
      askLogin();
      return false;
    }
    if (myReview) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "info", title: t("errorTitle"), text: t("alreadyReviewed") });
      return false;
    }
    const comment = clean(rawComment, 1001);
    const rating = Number(rawRating);
    if (!comment || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "warning", title: t("incompleteTitle"), text: t("provideRatingComment") });
      return false;
    }
    if (comment.length > 1000) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "warning", title: t("tooLongTitle"), text: t("commentTooLong") });
      return false;
    }
    reviewBusyRef.current = true;
    try {
      await api.post(`/api/reviews/${encodeURIComponent(shopId)}`, { rating: clamp(rating, 1, 5), comment });
      queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
      toast({ icon: "success", title: t("reviewAddedToast"), timer: TOAST_MS });
      return true;
    } catch (err) {
      const Swal = await loadSwal();
      const duplicate = isDuplicateReview(err);
      Swal.fire({ icon: duplicate ? "info" : "error", title: t("errorTitle"), text: reviewError(err, t("submitReviewFailed"), "create", t) });
      if (duplicate) queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
      return false;
    } finally {
      reviewBusyRef.current = false;
    }
  }, [shop, myReview, shopId, queryClientLocal, askLogin, t]);

  const updateReview = useCallback(async (draft) => {
    const comment = clean(draft?.comment, 1001);
    if (!comment || !draft?.rating) return;
    if (reviewBusyRef.current) return;
    if (userId == null || String(draft.userId) !== String(userId)) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "error", title: t("errorTitle"), text: t("onlyOwnReviews") });
      setEditingReview(null);
      return;
    }
    if (comment.length > 1000) {
      const Swal = await loadSwal();
      Swal.fire({ icon: "warning", title: t("tooLongTitle"), text: t("commentTooLong") });
      return;
    }
    reviewBusyRef.current = true;
    try {
      await api.put(`/api/reviews/${encodeURIComponent(draft.id)}`, { rating: clamp(Number(draft.rating), 1, 5), comment });
      setEditingReview(null);
      queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
      toast({ icon: "success", title: t("reviewUpdatedToast"), timer: TOAST_MS });
    } catch (err) {
      const Swal = await loadSwal();
      Swal.fire(t("errorTitle"), reviewError(err, t("updateReviewFailed"), "update", t), "error");
    } finally {
      reviewBusyRef.current = false;
    }
  }, [userId, queryClientLocal, shopId, t]);

  const deleteReview = useCallback(async (reviewId) => {
    if (reviewBusyRef.current) return;
    const Swal = await loadSwal();
    const target = reviews.find((r) => r.id === reviewId);
    if (!target || userId == null || String(target.userId) !== String(userId)) {
      Swal.fire(t("errorTitle"), t("onlyOwnReviews"), "error");
      return;
    }
    const result = await Swal.fire({ title: t("deleteReviewTitle"), text: t("deleteReviewText"), icon: "warning", showCancelButton: true, cancelButtonText: t("cancel"), confirmButtonColor: "#ef4444", confirmButtonText: t("deleteConfirmButton") });
    if (!result.isConfirmed) return;
    reviewBusyRef.current = true;
    try {
      await api.delete(`/api/reviews/cancel/${encodeURIComponent(reviewId)}`);
      queryClientLocal.invalidateQueries({ queryKey: ["reviews", shopId] });
      toast({ icon: "success", title: t("reviewRemovedToast"), timer: TOAST_MS });
    } catch (err) {
      Swal.fire(t("errorTitle"), reviewError(err, t("deleteReviewFailed"), "delete", t), "error");
    } finally {
      reviewBusyRef.current = false;
    }
  }, [reviews, userId, queryClientLocal, shopId, t]);

  const toggleCondition = useCallback((c) => setConditions((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])), []);

  const clearFilters = useCallback(() => {
    setSearch(""); setConditions([]); setSelectedCategory("all"); setPriceRangeState(null);
    setOnSaleOnly(false); setInStockOnly(false); setSavedOnly(false); setSortBy("relevance"); setCurrentPage(1); setVisibleCount(MOBILE_BATCH);
  }, []);
  useEffect(() => { clearFilters(); }, [shopId, clearFilters]);
  useEffect(() => { setReviewPage(1); setOfferDetail(null); }, [shopId]);

  const priceBounds = useMemo(() => {
    const top = products.reduce((mx, p) => Math.max(mx, p._final), 0);
    if (!top) return { max: 0, step: 1 };
    const step = priceStep(top) || 1;
    return { max: Math.max(step * 10, Math.ceil(top / step) * step), step };
  }, [products]);
  const priceValue = useMemo(() => {
    if (!priceRange) return [0, priceBounds.max];
    const hi = clamp(Number(priceRange[1]) || 0, 0, priceBounds.max);
    const lo = Math.min(clamp(Number(priceRange[0]) || 0, 0, priceBounds.max), hi);
    return [lo, hi];
  }, [priceRange, priceBounds.max]);
  const setPriceRange = useCallback((r) => {
    const hi = clamp(Number(r[1]) || 0, 0, priceBounds.max);
    const lo = Math.min(clamp(Number(r[0]) || 0, 0, priceBounds.max), hi);
    setPriceRangeState(lo <= 0 && hi >= priceBounds.max ? null : [lo, hi]);
  }, [priceBounds.max]);

  const { categoryOptions, productsByCategory } = useMemo(() => {
    const cats = {}, byCat = {};
    for (const p of products) {
      if (p._cat) cats[p._cat] = (cats[p._cat] || 0) + 1;
      const catId = p.categoryId ?? p.category?.id ?? p.category;
      if (catId != null) (byCat[catId] ||= []).push(p);
    }
    return {
      categoryOptions: Object.entries(cats).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      productsByCategory: byCat,
    };
  }, [products]);

  const categorySections = useMemo(() => categories
    .map((cat) => ({ category: cat, items: (productsByCategory[cat.id] || []).slice(0, 10) }))
    .filter((s) => s.items.length > 0)
    .slice(0, 6), [categories, productsByCategory]);

  const baseFiltered = useMemo(() => {
    const term = dSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (dCat !== "all" && p._cat !== dCat) return false;
      if (dSale && !(p.saving > 0)) return false;
      if (dStock && p.stock != null && p.stock <= 0) return false;
      if (dSaved && !saved.has(p.id)) return false;
      if (term && !p._text.includes(term)) return false;
      return true;
    });
  }, [products, saved, dSearch, dCat, dSale, dStock, dSaved]);

  const conditionCounts = useMemo(() => {
    const c = {};
    for (const p of baseFiltered) if (p.condition) c[p.condition] = (c[p.condition] || 0) + 1;
    return c;
  }, [baseFiltered]);

  const histogram = useMemo(() => {
    const bins = Array(HISTOGRAM_BINS).fill(0);
    if (!priceBounds.max) return bins;
    for (const p of baseFiltered) {
      if (dConds.length && !dConds.includes(p.condition)) continue;
      bins[Math.min(HISTOGRAM_BINS - 1, Math.floor((p._final / priceBounds.max) * HISTOGRAM_BINS))]++;
    }
    return bins;
  }, [baseFiltered, dConds, priceBounds.max]);

  const filteredProducts = useMemo(() => {
    const lo = dPrice ? dPrice[0] : 0;
    const hi = dPrice ? dPrice[1] : Infinity;
    const result = baseFiltered.filter((p) => p._final >= lo && p._final <= hi && (!dConds.length || dConds.includes(p.condition)));
    if (dSort === "priceLowToHigh") result.sort((a, b) => a._final - b._final);
    else if (dSort === "priceHighToLow") result.sort((a, b) => b._final - a._final);
    else if (dSort === "nameAsc") result.sort((a, b) => (a.name || "").localeCompare(b.name || "", language));
    else if (dSort === "discount") result.sort((a, b) => b.discount - a.discount);
    else if (dSort === "newest") result.sort((a, b) => b._ts - a._ts);
    return result;
  }, [baseFiltered, dPrice, dConds, dSort, language]);

  const sortOptions = useMemo(() => [
    { value: "relevance", label: t("sortRelevance") },
    { value: "priceLowToHigh", label: t("sortPriceLow") },
    { value: "priceHighToLow", label: t("sortPriceHigh") },
    { value: "nameAsc", label: t("sortNameAsc") },
    { value: "discount", label: t("sortDiscount") },
    { value: "newest", label: t("sortNewest") },
  ], [t]);
  const rowOptions = useMemo(() => PAGE_SIZES.map((n) => ({ value: n, label: `${n} ${t("perPage")}` })), [t]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  useEffect(() => { setCurrentPage(1); setVisibleCount(MOBILE_BATCH); }, [pageSize, deferred]);
  useEffect(() => { setCurrentPage((p) => Math.min(p, totalPages)); }, [totalPages]);
  const pageOffset = (currentPage - 1) * pageSize;
  const paginatedProducts = useMemo(() => filteredProducts.slice(pageOffset, pageOffset + pageSize), [filteredProducts, pageOffset, pageSize]);
  const infiniteProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);
  const listProducts = isMobile ? infiniteProducts : paginatedProducts;
  const hasMore = isMobile && visibleCount < filteredProducts.length;
  const startItem = filteredProducts.length ? (isMobile ? 1 : pageOffset + 1) : 0;
  const endItem = isMobile ? infiniteProducts.length : Math.min(pageOffset + pageSize, filteredProducts.length);
  const loadMore = useCallback(() => startTransition(() => setVisibleCount((c) => c + MOBILE_BATCH)), []);

  const reviewPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));
  const safeReviewPage = Math.min(reviewPage, reviewPages);
  const pagedReviews = useMemo(
    () => reviews.slice((safeReviewPage - 1) * REVIEWS_PER_PAGE, safeReviewPage * REVIEWS_PER_PAGE),
    [reviews, safeReviewPage]
  );

  const activeFiltersCount = (search ? 1 : 0) + conditions.length + (selectedCategory !== "all" ? 1 : 0) + (priceRange ? 1 : 0) + (onSaleOnly ? 1 : 0) + (inStockOnly ? 1 : 0) + (savedOnly ? 1 : 0);

  const scrollToProducts = useCallback(() => document.getElementById("shop-products")?.scrollIntoView({ behavior: "smooth", block: "start" }), []);
  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);
  const goToPage = useCallback((pg) => { setCurrentPage(pg); scrollToProducts(); }, [scrollToProducts]);
  const goToReviewPage = useCallback((pg) => {
    setReviewPage(pg);
    document.getElementById("shop-reviews-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const { avgRating, ratingCounts } = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of reviews) {
      sum += Number(r.rating) || 0;
      if (c[r.rating] !== undefined) c[r.rating]++;
    }
    return { avgRating: reviews.length ? (sum / reviews.length).toFixed(1) : "–", ratingCounts: c };
  }, [reviews]);
  const reviewWord = useCallback((count) => (count === 1 ? t("reviewSingular") : t("reviewPlural")), [t]);

  const stats = useMemo(() => [
    { value: String(products.length), label: t("products") },
    { value: avgRating === "–" ? "–" : `${avgRating}★`, label: t("avgRating") },
    { value: String(reviews.length), label: reviewWord(reviews.length) },
  ], [products.length, avgRating, reviews.length, reviewWord, t]);

  const filterPanelProps = useMemo(() => ({
    t, conditionCounts, selectedConditions: conditions, toggleCondition, categoryOptions, selectedCategory, setSelectedCategory,
    totalCount: products.length, priceBounds, priceValue, setPriceRange, histogram,
    inStockOnly, setInStockOnly, onSaleOnly, setOnSaleOnly, savedOnly, setSavedOnly,
    open, setOpen, clearFilters, activeFiltersCount,
  }), [t, conditionCounts, conditions, toggleCondition, categoryOptions, selectedCategory, products.length, priceBounds, priceValue,
    setPriceRange, histogram, inStockOnly, onSaleOnly, savedOnly, open, clearFilters, activeFiltersCount]);
  const frameProps = { darkMode, dir, language, font, isAr };
  const currency = t("currency");

  if (shopLoading) return (
    <Frame {...frameProps}>
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-[color:var(--nb-accent)] border-t-transparent motion-reduce:animate-none" role="status" aria-label={t("loading")} />
      </div>
    </Frame>
  );

  if (!shop) return (
    <Frame {...frameProps}>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="nb-card px-6 py-14 text-center sm:px-12">
          <IsoIllustration type="shopEmpty" darkMode={darkMode} onGreen={false} className="mx-auto mb-4 h-32 w-32 sm:h-40 sm:w-40" />
          <p className="text-xl font-extrabold uppercase">{t("shopNotFound")}</p>
        </div>
      </div>
    </Frame>
  );

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <Frame {...frameProps}>
          <Defs3D />
          <Toaster darkMode={darkMode} />

          <ShopBanner darkMode={darkMode} />
          <ShopDetails shop={shop} darkMode={darkMode} stats={stats} onViewProducts={scrollToProducts} onChat={handleOpenChat} t={t} />

          <div className="nb-seq">
            {shopOffers.length > 0 && (
              <section id="shop-offers" aria-label={t("shopOffers")} className="lk-cv py-10 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <SectionHead
                    eyebrow={t("eyebrowOffers")} title={t("shopOffers")} subtitle={t("shopOffersSubtitle")} count={shopOffers.length}
                    action={<IsoIllustration type="offersCard" tone="emerald" darkMode={darkMode} onGreen={false} className="lk-float-slow pointer-events-none hidden h-40 w-40 flex-shrink-0 sm:block lg:h-52 lg:w-52" />}
                  />
                  <div className="grid grid-cols-1 gap-6 pb-2 pe-2 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                    {shopOffers.slice(0, OFFERS_SHOWN).map((o, i) => (
                      <ShopOfferCard key={o.id} offer={o} index={i} language={language} currency={currency} onOpen={openOfferDetail} ot={ot} />
                    ))}
                  </div>
                  {shopOffers.length > OFFERS_SHOWN && (
                    <div className="flex justify-center pt-8">
                      <button type="button" onClick={goToOffers} className="nb-btn nb-btn-a px-6 py-3 text-sm uppercase">
                        {t("viewAllOffers")} <FiArrowRight className="nb-flip h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {!productsLoading && categorySections.length > 0 && (
              <section aria-label={t("browseCollections")} className="lk-cv py-10 sm:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <SectionHead eyebrow={t("eyebrowCollections")} title={t("browseCollections")} subtitle={t("browseCategory")} />
                  <div className="space-y-10 sm:space-y-14">
                    {categorySections.map(({ category, items }) => (
                      <CategorySlider key={category.id} category={category} items={items} darkMode={darkMode} saved={saved} onSave={toggleSaved} onAddToCart={handleAddToCart} onDetails={openDetails} t={t} isRTL={isRTL} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section aria-label={t("allProducts")}>
              <div id="shop-products" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
                <SectionHead eyebrow={t("eyebrowProducts")} title={t("allProducts")} subtitle={t("allProductsSubtitle")} />

                <div className="flex items-stretch gap-5 lg:gap-8">
                  {!isMobile && (
                    <aside className="flex w-[17rem] min-w-0 flex-shrink-0 xl:w-[19rem]">
                      <div className="nb-card min-w-0 flex-1 p-3 sm:p-4">
                        <div className="sticky top-20">
                          <FilterPanel {...filterPanelProps} flat />
                        </div>
                      </div>
                    </aside>
                  )}

                  <div className="w-full min-w-0 flex-1">
                    <div className="nb-card mb-6 flex flex-col gap-3 p-3 sm:p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm opacity-80" aria-live="polite">
                          <b dir="ltr">{startItem}–{endItem}</b> / <b dir="ltr">{filteredProducts.length}</b> {t("productsFound")}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {!isMobile && (
                            <NbDropdown ariaLabel={t("rowsPerPage", "Rows per page")} value={pageSize} onChange={setPageSize} options={rowOptions} align="end" className="w-36 flex-shrink-0" />
                          )}
                          {isMobile && (
                            <button type="button" onClick={openSidebar} className="nb-btn nb-btn-a h-10 px-3 text-xs uppercase">
                              <FiSliders className="h-3.5 w-3.5" /> {t("filters")}
                              {activeFiltersCount > 0 && <span className="flex h-4 min-w-[1rem] items-center justify-center bg-white px-1 text-[10px] font-bold text-[#04261a]">{activeFiltersCount}</span>}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="nb-field relative flex h-10 min-w-0 flex-1 items-center gap-2 px-3">
                          <FiSearch aria-hidden="true" className="h-4 w-4 flex-shrink-0" />
                          <input type="text" inputMode="search" autoComplete="off" value={search} maxLength={100} onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("searchProducts")} aria-label={t("searchProducts")}
                            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:font-medium placeholder:opacity-60" />
                          {isStale && <span aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                          {search && <button type="button" onClick={() => setSearch("")} aria-label={t("clear")} className="flex-shrink-0"><FiX className="h-4 w-4" /></button>}
                        </div>
                        <NbDropdown ariaLabel={t("sortBy")} value={sortBy} onChange={setSortBy} options={sortOptions} align="end" className="w-full sm:w-52" />
                      </div>
                    </div>

                    {activeFiltersCount > 0 && (
                      <div className="mb-6 flex flex-wrap items-center gap-2">
                        {selectedCategory !== "all" && <FilterChip label={selectedCategory} onRemove={() => setSelectedCategory("all")} />}
                        {conditions.map((c) => <FilterChip key={c} label={conditionLabel(t, c)} onRemove={() => toggleCondition(c)} />)}
                        {priceRange && <FilterChip label={`${money(priceValue[0], currency)} – ${money(priceValue[1], currency)}`} onRemove={() => setPriceRangeState(null)} />}
                        {onSaleOnly && <FilterChip label={t("onSaleOnly")} onRemove={() => setOnSaleOnly(false)} />}
                        {inStockOnly && <FilterChip label={t("inStockOnly")} onRemove={() => setInStockOnly(false)} />}
                        {savedOnly && <FilterChip label={t("savedOnly")} onRemove={() => setSavedOnly(false)} />}
                        {search && <FilterChip label={`“${search.slice(0, 20)}”`} onRemove={() => setSearch("")} />}
                        <button type="button" onClick={clearFilters} className="text-xs font-bold underline underline-offset-4">{t("clearAllFilters")}</button>
                      </div>
                    )}

                    <div aria-busy={isStale} className={`transition-opacity duration-150 ${isStale ? "opacity-70" : "opacity-100"}`}>
                      {productsLoading ? (
                        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3" role="status" aria-label={t("loading")}>{Array.from({ length: 9 }).map((_, i) => <ProductSkeleton key={i} />)}</div>
                      ) : filteredProducts.length > 0 ? (
                        <>
                          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
                            {listProducts.map((product, i) => (
                              <ProductCard key={product.id} product={product} darkMode={darkMode} index={i} isSaved={saved.has(product.id)} onSave={toggleSaved} onAddToCart={handleAddToCart} onDetails={openDetails} t={t} />
                            ))}
                          </div>
                          {isMobile ? (
                            <InfiniteSentinel hasMore={hasMore} shown={visibleCount} total={filteredProducts.length} onMore={loadMore} t={t} />
                          ) : totalPages > 1 && (
                            <div className="flex flex-col items-center gap-3 pt-8">
                              <Pagination page={currentPage} total={totalPages} onChange={goToPage} label={t("pagination")} t={t} />
                              <p className="nb-muted text-xs">
                                <span dir="ltr">{startItem}–{endItem}</span> / <span dir="ltr">{filteredProducts.length}</span> {t("productsFound")}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="nb-card px-4 py-14 text-center sm:py-24">
                          <IsoIllustration type="shopEmpty" darkMode={darkMode} onGreen={false} className="mx-auto mb-4 h-32 w-32 sm:h-40 sm:w-40" />
                          <p className="mb-2 text-lg font-extrabold uppercase sm:text-2xl">{t("noProducts")}</p>
                          <p className="mb-6 text-sm opacity-80 sm:text-base">{t("adjustFilters")}</p>
                          {activeFiltersCount > 0 && <button type="button" onClick={clearFilters} className="nb-btn nb-btn-a px-6 py-3 text-sm uppercase">{t("clearFilters")}</button>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <ChatCTABanner darkMode={darkMode} onOpenChat={handleOpenChat} t={t} />

            <section id="shop-reviews" aria-label={t("customerReviews")} className="lk-cv py-10 sm:py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHead
                  eyebrow={t("eyebrowReviews")} title={t("customerReviews")}
                  subtitle={<><span dir="ltr">{reviews.length}</span> {reviewWord(reviews.length)}{reviews.length > 0 && <> · {t("avgLabel")} <span dir="ltr">{avgRating}</span> ★</>}</>}
                />

                <div className="grid items-start gap-6 lg:grid-cols-[20rem_1fr] lg:gap-8 xl:grid-cols-[22rem_1fr]">
                  <aside className="nb-card p-5 sm:p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="flex items-center gap-3 lg:flex-col">
                        <RiStarFill className="nb-star-on h-12 w-12 sm:h-16 sm:w-16" aria-hidden="true" />
                        <div>
                          <p className="text-3xl font-extrabold tabular-nums sm:text-4xl" dir="ltr">{avgRating} / 5</p>
                          <p className="text-sm font-extrabold uppercase">{reviews.length > 0 ? t("lovedByCustomers") : t("noReviewsYet")}</p>
                          <p className="nb-muted text-xs font-bold">{t("basedOn")} <span dir="ltr">{reviews.length}</span> {reviewWord(reviews.length)}</p>
                        </div>
                      </div>
                      <div className="mt-5 w-full space-y-2">
                        {RATING_BARS.map((n) => {
                          const pct = reviews.length ? (ratingCounts[n] / reviews.length) * 100 : 0;
                          return (
                            <div key={n} className="flex items-center gap-2" dir="ltr">
                              <span className="w-3 text-xs font-bold">{n}</span>
                              <RiStarFill className="nb-star-on h-3 w-3 flex-shrink-0" aria-hidden="true" />
                              <div className="nb-gray nb-line h-3 flex-1 overflow-hidden border-2">
                                <div className="h-full bg-[color:var(--nb-btn)]" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-6 text-end text-[10px] font-bold tabular-nums">{ratingCounts[n]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </aside>

                  <ReviewForm t={t} hasReview={!!myReview} onSubmit={submitReview} />
                </div>

                <div id="shop-reviews-list" className="mt-8 scroll-mt-24">
                  {reviewsLoading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="nb-gray nb-line h-44 animate-pulse border-2 motion-reduce:animate-none" />)}
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                      {pagedReviews.map((r) => (
                        <ReviewCard key={r.id} review={r} mine={userId != null && String(r.userId) === String(userId)}
                          dateLocale={dateLocale} shopName={clean(shop?.name, 80)} t={t} onEdit={setEditingReview} onDelete={deleteReview} />
                      ))}
                    </div>
                  ) : (
                    <div className="nb-card px-4 py-10 text-center sm:py-14">
                      <IsoIllustration type="shopReviews" darkMode={darkMode} onGreen={false} className="mx-auto mb-3 h-32 w-32 sm:h-36 sm:w-36" />
                      <p className="mb-1 text-base font-extrabold uppercase sm:text-lg">{t("noReviewsYet")}</p>
                      <p className="text-xs opacity-80 sm:text-sm">{t("beFirstReview")}</p>
                    </div>
                  )}
                </div>

                {!reviewsLoading && reviews.length > REVIEWS_PER_PAGE && (
                  <div className="flex flex-col items-center gap-3 pt-8">
                    <Pagination page={safeReviewPage} total={reviewPages} onChange={goToReviewPage} label={t("reviewsPagination")} t={t} />
                    <p className="nb-muted text-xs">
                      <span dir="ltr">{(safeReviewPage - 1) * REVIEWS_PER_PAGE + 1}–{Math.min(safeReviewPage * REVIEWS_PER_PAGE, reviews.length)}</span> / <span dir="ltr">{reviews.length}</span> {reviewWord(reviews.length)}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <AnimatePresence>
            {drawerOpen && (
              <div className="fixed inset-0 z-[1050]" role="dialog" aria-modal="true" aria-label={t("filters")}>
                <m.div {...BACKDROP_MOTION} className="absolute inset-0 bg-black/60" onClick={closeSidebar} />
                <m.div {...DRAWER_MOTION} style={GPU}
                  className="nb-bg nb-line absolute inset-x-0 bottom-0 flex max-h-[88vh] min-w-0 transform-gpu flex-col border-t-2 sm:inset-y-0 sm:end-auto sm:start-0 sm:max-h-none sm:w-[22rem] sm:max-w-[90vw] sm:border-e-2 sm:border-t-0 md:w-96">
                  <div className="flex items-center justify-between px-3 pb-2 pt-4 sm:px-4">
                    <h3 className="text-base font-extrabold uppercase"><span className="nb-ul">{t("filters")}</span></h3>
                    <button type="button" onClick={closeSidebar} aria-label={t("closeFilters")} className="nb-btn h-9 w-9"><FiX className="h-5 w-5" /></button>
                  </div>
                  <div className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pe-4 sm:px-4 sm:pe-5"><FilterPanel {...filterPanelProps} /></div>
                  <div className="nb-line border-t-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
                    <button type="button" onClick={() => { closeSidebar(); scrollToProducts(); }} className="nb-btn nb-btn-a w-full py-3 text-sm uppercase">{t("showProducts").replace("{count}", filteredProducts.length)}</button>
                  </div>
                </m.div>
              </div>
            )}
          </AnimatePresence>

          <div className="fixed bottom-5 end-4 z-40 flex flex-col gap-3 sm:end-6 lg:bottom-8 lg:end-8">
            {showTop && <button type="button" onClick={scrollToTop} aria-label={t("backToTop")} title={t("backToTop")} className="nb-btn h-11 w-11"><FiArrowUp className="h-5 w-5" /></button>}
            <button type="button" onClick={handleOpenChat} onMouseEnter={prefetchChatModal} aria-label={t("chatWithShop")} title={t("chatWithShop")} className="nb-btn nb-btn-a h-12 w-12 sm:h-14 sm:w-14"><FiMessageCircle className="h-5 w-5 sm:h-6 sm:w-6" /></button>
          </div>

          <AnimatePresence>
            {editingReview && <EditReviewModal key={editingReview.id} review={editingReview} t={t} onClose={closeEdit} onSave={updateReview} />}
          </AnimatePresence>

          <AnimatePresence>
            {detailsProduct && (
              <ProductDetailsModal key={detailsProduct.id} product={detailsProduct} darkMode={darkMode} isSaved={saved.has(detailsProduct.id)} onSave={toggleSaved}
                onClose={closeDetails} onAddToCart={handleAddToCart} onView={viewProduct} t={t} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {offerDetail && (
              <ShopOfferModal key={offerDetail.id} offer={offerDetail} language={language} currency={currency} onClose={closeOfferDetail} onViewProducts={scrollToProducts} ot={ot} t={t} />
            )}
          </AnimatePresence>

          <Suspense fallback={null}>
            <AnimatePresence>
              {openChat && isAuthenticated && <ChatModal shopId={shopId} shopName={shop?.name} open={openChat} onClose={closeChat} darkMode={darkMode} />}
            </AnimatePresence>
          </Suspense>
        </Frame>
      </MotionConfig>
    </LazyMotion>
  );
};

const Shop = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <ShopContent {...props} />
  </QueryClientProvider>
));

Shop.displayName = "Shop";
export { queryClient };
export default Shop;