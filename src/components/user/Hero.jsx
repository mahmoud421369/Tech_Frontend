import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiMapPin, FiTag, FiCalendar } from 'react-icons/fi';
import { RiStarFill, RiStore2Line } from 'react-icons/ri';
import { useQuery, QueryClientProvider } from '@tanstack/react-query';
import api from '../../common/api/api';
import queryClient from '../../common/utils/queryClient';
import useAuthStore from '../../common/store/Auth';
import { resolveImageSrc } from '../../common/utils/productutils';
import { useAppLanguage, languageDirection } from '../../common/utils/useAppLanguage';
import { useOnScreen, money } from './Device3D';
import { safeImageUrl } from './ListingKit';

const LOCALES = { en: 'en-US', ar: 'ar-EG', fr: 'fr-FR' };
const MAX_ITEMS = 8;
const EMPTY = [];
const LOGO_DIR = '/uploads/shop-logos/';

const TEXT = {
  en: {
    label: 'Featured offers',
    repairTitle: 'Fix your device',
    repairSub: 'Book a technician in minutes',
    repairCta: 'Book a repair',
    trackTitle: 'Track your order',
    trackSub: 'See where your package is now',
    trackCta: 'Track order',
    dealsTitle: 'Mega deals',
    dealsSub: 'The biggest discounts right now',
    dealsCta: 'Shop deals',
    shopsTitle: 'Top rated shops',
    shopsSub: 'Chosen by real customers',
    shopsCta: 'Browse shops',
    offersTitle: 'Latest offers',
    offersSub: 'Fresh promotions from our shops',
    offersCta: 'View offers',
    off: 'off',
    ends: 'Ends {{date}}',
    partner: 'Partner shop',
    noDeals: 'No deals right now',
    noShops: 'No shops yet',
    noOffers: 'No offers right now',
      goTo: 'Show item {{n}}',
    na: 'N/A',
    prev: 'Previous',
    next: 'Next',
  },
  ar: {
    label: 'العروض المميزة',
    repairTitle: 'أصلح جهازك',
    repairSub: 'احجز فنيًا في دقائق',
    repairCta: 'احجز إصلاحًا',
    trackTitle: 'تتبّع طلبك',
    trackSub: 'اعرف مكان شحنتك الآن',
    trackCta: 'تتبّع الطلب',
    dealsTitle: 'عروض ضخمة',
    dealsSub: 'أكبر الخصومات الآن',
    dealsCta: 'تسوّق العروض',
    shopsTitle: 'متاجر الأعلى تقييمًا',
    shopsSub: 'اختيار العملاء الحقيقيين',
    shopsCta: 'تصفّح المتاجر',
    offersTitle: 'أحدث العروض',
    offersSub: 'عروض جديدة من متاجرنا',
    offersCta: 'شاهد العروض',
    off: 'خصم',
    ends: 'ينتهي {{date}}',
    partner: 'متجر شريك',
    noDeals: 'لا توجد عروض الآن',
    noShops: 'لا توجد متاجر بعد',
    noOffers: 'لا توجد عروض الآن',
    prev: 'السابق',
    next: 'التالي',
    goTo: 'عرض العنصر {{n}}',
    na: 'غير متاح',
  },
  fr: {
    label: 'Offres à la une',
    repairTitle: 'Réparez votre appareil',
    repairSub: 'Réservez un technicien en quelques minutes',
    repairCta: 'Réserver une réparation',
    trackTitle: 'Suivez votre commande',
    trackSub: 'Voyez où est votre colis maintenant',
    trackCta: 'Suivre ma commande',
    dealsTitle: 'Méga offres',
    dealsSub: 'Les plus grosses remises du moment',
    dealsCta: 'Voir les offres',
    shopsTitle: 'Boutiques les mieux notées',
    shopsSub: 'Choisies par de vrais clients',
    shopsCta: 'Voir les boutiques',
    offersTitle: 'Dernières promotions',
    offersSub: 'Promotions récentes de nos boutiques',
    offersCta: 'Voir les promotions',
    off: 'de remise',
    ends: 'Fin le {{date}}',
    partner: 'Boutique partenaire',
    noDeals: 'Aucune offre pour le moment',
    noShops: 'Aucune boutique pour le moment',
    noOffers: 'Aucune promotion pour le moment',
    prev: 'Précédent',
    next: 'Suivant',
    goTo: "Afficher l'élément {{n}}",
    na: 'N/D',
  },
};

const fill = (s, vars) => {
  let out = s;
  if (vars) for (const k in vars) out = out.split(`{{${k}}}`).join(vars[k]);
  return out;
};

const numFormats = {};
const dateFormats = {};
const fmtNum = (language, n) => {
  const loc = LOCALES[language] || LOCALES.en;
  return (numFormats[loc] ||= new Intl.NumberFormat(loc, { maximumFractionDigits: 0 })).format(n);
};
const fmtDate = (language, value) => {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return null;
  const loc = LOCALES[language] || LOCALES.en;
  return (dateFormats[loc] ||= new Intl.DateTimeFormat(loc, { month: 'short', day: 'numeric' })).format(d);
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const str = (v, max = 120) => (typeof v === 'string' ? v.replace(/[\p{Cc}\p{Cf}]/gu, ' ').trim().slice(0, max) : '');
const listOf = (d) => (Array.isArray(d?.content) ? d.content : Array.isArray(d) ? d : EMPTY);
const ts = (v) => Date.parse(v) || 0;

const finalPriceOf = (p, price) => {
  const apiFinal = num(p.finalPrice);
  if (apiFinal && apiFinal < price) return apiFinal;
  const dv = num(p.discountValue);
  if (dv && p.discountType === 'PERCENTAGE') return dv < 100 ? price - (price * dv) / 100 : price;
  if (dv && p.discountType) return dv < price ? price - dv : price;
  const legacy = Math.min(num(p.discount), 100);
  return legacy ? price * (1 - legacy / 100) : price;
};

const selectDeals = (raw) => {
  const out = [];
  for (const p of listOf(raw)) {
    if (!p || typeof p !== 'object' || p.deleted || p.id == null || p.stock === 0) continue;
    const price = num(p.price);
    if (!price) continue;
    const final = finalPriceOf(p, price);
    const percent = Math.round(((price - final) / price) * 100);
    if (percent < 1) continue;
    out.push({
      id: String(p.id).slice(0, 128),
      name: str(p.name) || '—',
      image: safeImageUrl(p.imageUrl),
      price,
      final: Math.round(final * 100) / 100,
      percent,
    });
  }
  return out.sort((a, b) => b.percent - a.percent).slice(0, MAX_ITEMS);
};

const shopLogo = (s) => {
  const found = [s.logoUrl, s.logo, s.logoPath, s.shopLogo].find((v) => typeof v === 'string' && v.trim());
  const raw = found ? found.trim() : '';
  if (!raw || raw.includes('..') || /^javascript:/i.test(raw)) return '';
  if (/^(https?:)?\/\/|^data:image\/(png|jpe?g|webp|gif|avif);|^blob:/i.test(raw)) return raw;
  const path = raw.includes('/') ? (raw.startsWith('/') ? raw : `/${raw}`) : `${LOGO_DIR}${encodeURIComponent(raw)}`;
  return resolveImageSrc(path) || path;
};

const selectShops = (raw) => {
  const all = [];
  for (const s of listOf(raw)) {
    if (!s || typeof s !== 'object' || s.id == null) continue;
    const name = str(s.name, 80);
    if (!name) continue;
    all.push({
      id: String(s.id).slice(0, 128),
      name,
      logo: shopLogo(s),
      rating: Math.min(5, num(s.rating ?? s.averageRating)),
      reviews: num(s.reviewCount ?? s.ratingCount ?? s.reviewsCount),
      address: [s.shopAddress?.street, s.shopAddress?.city].map((x) => str(x, 60)).filter(Boolean).join(', '),
      created: ts(s.createdAt ?? s.created_at),
    });
  }
  const rated = all.filter((s) => s.rating > 0).sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  const pool = rated.length ? rated : all.sort((a, b) => b.created - a.created);
  return pool.slice(0, MAX_ITEMS);
};

const selectOffers = (raw) => {
  const out = [];
  for (const o of listOf(raw)) {
    if (!o || typeof o !== 'object') continue;
    const status = str(o.status, 20).toLowerCase();
    if (status === 'expired') continue;
    const name = str(o.name, 100);
    if (!name) continue;
    const value = num(o.discountValue);
    out.push({
      id: o.id != null ? String(o.id).slice(0, 128) : name,
      name,
      description: str(o.description, 120),
      shop: str(o.shopName, 60),
      percentage: o.discountType === 'PERCENTAGE',
      value: o.discountType === 'PERCENTAGE' ? Math.min(value, 100) : value,
      endDate: o.endDate,
      created: ts(o.createdAt),
    });
  }
  return out.sort((a, b) => b.created - a.created).slice(0, MAX_ITEMS);
};

const retryPolicy = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const fetchProducts = async ({ signal }) => (await api.get('/api/products', { signal })).data;
const fetchShops = async ({ signal }) =>
  (await api.get('/api/users/shops/all', { params: { page: 0, size: 60 }, signal })).data;
const fetchOffers = async ({ signal }) => (await api.get('/api/users/offers', { signal })).data;

const queryBase = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: retryPolicy,
};

const useHeroData = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const uid = userId ?? 'anon';
  const enabled = !!accessToken;
  const deals = useQuery({ queryKey: ['heroProducts', uid], queryFn: fetchProducts, select: selectDeals, enabled, ...queryBase });
  const shops = useQuery({ queryKey: ['heroShops', uid], queryFn: fetchShops, select: selectShops, enabled, ...queryBase });
  const offers = useQuery({ queryKey: ['heroOffers', uid], queryFn: fetchOffers, select: selectOffers, enabled, ...queryBase });
  return {
    deals: { items: deals.data || EMPTY, loading: enabled && deals.isLoading },
    shops: { items: shops.data || EMPTY, loading: enabled && shops.isLoading },
    offers: { items: offers.data || EMPTY, loading: enabled && offers.isLoading },
  };
};

const prefersReduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const useCycle = (count, paused, ms) => {
  const [index, setIndex] = useState(0);
  useEffect(() => { setIndex((i) => (i >= count ? 0 : i)); }, [count]);
  useEffect(() => {
    if (count < 2 || paused || prefersReduced()) return undefined;
    const id = setInterval(() => { if (!document.hidden) setIndex((i) => (i + 1) % count); }, ms);
    return () => clearInterval(id);
  }, [count, paused, ms]);
  return [index, setIndex];
};

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

const TONES = Object.freeze({
  deals: { style: dots('#39ff88', 'rgba(5,46,30,.16)'), ink: 'text-emerald-950', soft: 'text-emerald-950/80', chip: 'bg-emerald-950 text-white' },
  shops: { style: grid('#0b4a35', 'rgba(57,255,136,.16)'), ink: 'text-white', soft: 'text-white/80', chip: 'bg-[#39ff88] text-emerald-950' },
  offers: { style: stripes('#fbbf24', 'rgba(120,53,15,.16)'), ink: 'text-amber-950', soft: 'text-amber-950/80', chip: 'bg-amber-950 text-white' },
});

const WIDE = Object.freeze({
  repair: {
    to: '/repair', title: 'repairTitle', sub: 'repairSub', cta: 'repairCta',
    light: { style: grid('#ccfbf1', 'rgba(13,148,136,.2)'), ink: 'text-teal-950', soft: 'text-teal-900/80', chip: 'bg-teal-900 text-white' },
    dark: { style: grid('#0a1f18', 'rgba(57,255,136,.12)'), ink: 'text-white', soft: 'text-white/70', chip: 'bg-[#39ff88] text-emerald-950' },
  },
  track: {
    to: '/track', title: 'trackTitle', sub: 'trackSub', cta: 'trackCta',
    light: { style: stripes('#ecfccb', 'rgba(77,124,15,.16)'), ink: 'text-lime-950', soft: 'text-lime-900/80', chip: 'bg-lime-900 text-white' },
    dark: { style: stripes('#1a2410', 'rgba(190,242,100,.12)'), ink: 'text-white', soft: 'text-white/70', chip: 'bg-lime-300 text-lime-950' },
  },
});

const THEMES = {
  light: { '--hs-bg': '#ffffff', '--hs-card': '#ffffff', '--hs-ink': '#052e1e', '--hs-line': '#000000', '--hs-sh': '#000000' },
  dark: { '--hs-bg': '#141414', '--hs-card': '#1c1c1e', '--hs-ink': '#ffffff', '--hs-line': 'rgba(255,255,255,.2)', '--hs-sh': '#0b4a35' },
};

const CARD =
  'relative flex overflow-hidden rounded-2xl border-[3px] border-[var(--hs-line)] outline-none sm:rounded-3xl [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--hs-sh)] sm:[box-shadow:calc(var(--dx)*6px)_6px_0_0_var(--hs-sh)]';
const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#39ff88]';
const CTA = 'mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg border-2 border-black px-3 py-1.5 text-xs font-bold sm:rounded-xl sm:border-[3px] sm:px-4 sm:py-2 sm:text-sm';

const RepairArt = memo(({ className }) => (
  <svg className={className} viewBox="0 0 160 140" fill="none" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true" focusable="false">
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
  </svg>
));

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

const WIDE_ART = { repair: RepairArt, track: TrackArt };

const WideCard = memo(({ id, t, darkMode }) => {
  const cfg = WIDE[id];
  const v = darkMode ? cfg.dark : cfg.light;
  const Art = WIDE_ART[id];
  return (
    <Link
      to={cfg.to}
      draggable={false}
      style={v.style}
      className={`${CARD} ${FOCUS} min-h-0 flex-1 flex-row items-center justify-between gap-3 p-4 sm:p-6 lg:p-8`}
    >
      <div className="relative z-10 flex min-w-0 flex-col items-start gap-1 sm:gap-2">
        <h3 className={`text-xl font-black leading-tight sm:text-3xl lg:text-4xl ${v.ink}`}>{t[cfg.title]}</h3>
        <p className={`text-xs font-semibold leading-snug sm:text-base ${v.soft}`}>{t[cfg.sub]}</p>
        <span className={`${CTA} ${v.chip}`}>
          {t[cfg.cta]}
          <FiArrowRight className="h-3.5 w-3.5 flex-shrink-0 rtl:rotate-180" aria-hidden="true" />
        </span>
      </div>
      <Art className="h-20 w-20 flex-none drop-shadow-[0_6px_10px_rgba(0,0,0,.25)] sm:h-32 sm:w-32 lg:h-44 lg:w-44" />
    </Link>
  );
});

const hideBroken = (e) => { e.currentTarget.style.visibility = 'hidden'; };

const near = (i, index, n) => {
  const d = Math.abs(i - index);
  return d <= 1 || d === n - 1;
};

const PILL = 'rounded-xl border-[3px] border-black bg-white px-3 py-2 text-emerald-950 [box-shadow:calc(var(--dx)*3px)_3px_0_0_#000]';
const SLIDE = 'flex h-full w-full flex-col gap-3 pb-7 outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#39ff88]';
const LOGO_BOX = 'grid h-32 w-32 place-items-center overflow-hidden rounded-3xl border-[3px] border-black bg-white [box-shadow:calc(var(--dx)*4px)_4px_0_0_#000] sm:h-40 sm:w-40 lg:h-48 lg:w-48';

const ProductSlide = memo(({ item, current, eager, language, t }) => (
  <Link to={`/device/${encodeURIComponent(item.id)}`} tabIndex={current ? 0 : -1} draggable={false} className={SLIDE}>
    <div className="relative min-h-0 flex-1">
      <span className="absolute start-0 top-0 z-10 rounded-lg border-2 border-black bg-white px-2 py-1 text-xs font-extrabold leading-none text-emerald-950">
        {fmtNum(language, item.percent)}% {t.off}
      </span>
      {item.image ? (
        <img
          src={item.image}
          alt=""
          width={400}
          height={400}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          draggable={false}
          referrerPolicy="no-referrer"
          onError={hideBroken}
          className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_14px_16px_rgba(0,0,0,.3)]"
        />
      ) : (
        <FiTag className="absolute inset-0 m-auto h-16 w-16 opacity-50" aria-hidden="true" />
      )}
    </div>
    <div className={PILL}>
      <h4 className="line-clamp-1 text-sm font-bold">{item.name}</h4>
      <p dir="ltr" className="mt-0.5 flex items-baseline gap-2">
        <span className="text-lg font-black tabular-nums">{money(item.final)}</span>
        <span className="text-xs font-medium tabular-nums line-through opacity-60">{money(item.price)}</span>
      </p>
    </div>
  </Link>
));

const ShopSlide = memo(({ item, current, eager }) => {
  const [bad, setBad] = useState(false);
  useEffect(() => { setBad(false); }, [item.logo]);
  return (
    <Link to={`/shops/${encodeURIComponent(item.id)}`} tabIndex={current ? 0 : -1} draggable={false} className={SLIDE}>
      <div className="grid min-h-0 flex-1 place-items-center">
        <div className={LOGO_BOX}>
          {item.logo && !bad ? (
            <img
              src={item.logo}
              alt=""
              width={240}
              height={240}
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
              onError={() => setBad(true)}
              className="h-full w-full object-contain p-3"
            />
          ) : (
            <span className="text-5xl font-black text-emerald-950">{item.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
      </div>
      <div className={PILL}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="line-clamp-1 text-sm font-bold">{item.name}</h4>
          {item.rating > 0 && (
            <span dir="ltr" className="flex flex-none items-center gap-1 text-sm font-bold">
              <RiStarFill className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <span className="tabular-nums">{item.rating.toFixed(1)}</span>
            </span>
          )}
        </div>
        {item.address && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold opacity-70">
            <FiMapPin className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
            <span className="line-clamp-1">{item.address}</span>
          </p>
        )}
      </div>
    </Link>
  );
});

const OfferSlide = memo(({ item, current, language, t }) => {
  const date = fmtDate(language, item.endDate);
  const big = item.value > 0 ? (item.percentage ? `${fmtNum(language, item.value)}%` : money(item.value)) : null;
  return (
    <Link to="/offers" tabIndex={current ? 0 : -1} draggable={false} className={SLIDE}>
      <div className="grid min-h-0 flex-1 place-items-center">
        {big ? (
          <div dir="ltr" className="flex items-center gap-2 rounded-xl border-[3px] border-black bg-white px-3 py-1.5 text-emerald-950 [box-shadow:calc(var(--dx)*3px)_3px_0_0_#000]">
            <span className="text-2xl font-black leading-none tabular-nums sm:text-3xl">{big}</span>
            <span className="text-xs font-extrabold leading-none">{t.off}</span>
          </div>
        ) : (
          <FiTag className="h-12 w-12 opacity-60" aria-hidden="true" />
        )}
      </div>
      <div className={PILL}>
        <h4 className="line-clamp-1 text-sm font-bold">{item.name}</h4>
        <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[11px] font-semibold opacity-70">
          <span className="flex min-w-0 items-center gap-1.5">
            <RiStore2Line className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
            <span className="truncate">{item.shop || t.partner}</span>
          </span>
          <span className="flex items-center gap-1">
            <FiCalendar className="h-3 w-3 flex-none" aria-hidden="true" />
            {date ? fill(t.ends, { date }) : t.na}
          </span>
        </div>
      </div>
    </Link>
  );
});

const SliderCard = memo(({ kind, tone, title, sub, cta, to, items, loading, empty, active, ms, language, t }) => {
  const [hovered, setHovered] = useState(false);
  const [index, setIndex] = useCycle(items.length, hovered || !active, ms);
  const v = TONES[tone];
  const on = useCallback(() => setHovered(true), []);
  const off = useCallback(() => setHovered(false), []);
  const Slide = kind === 'deals' ? ProductSlide : kind === 'shops' ? ShopSlide : OfferSlide;

  return (
    <article
      style={v.style}
      onMouseEnter={on}
      onMouseLeave={off}
      onFocus={on}
      onBlur={off}
      aria-roledescription="carousel"
      aria-label={title}
      className={`${CARD} h-full w-[17rem] flex-none snap-start flex-col p-4 sm:w-[21rem] sm:p-6 lg:w-[24rem] ${v.ink}`}
    >
      <div className="relative z-10 flex flex-col items-start gap-1 sm:gap-1.5">
        <h3 className="text-2xl font-black leading-[1.15] [text-wrap:balance] sm:text-3xl">{title}</h3>
        <p className={`text-xs font-semibold leading-snug sm:text-sm ${v.soft}`}>{sub}</p>
        <Link to={to} draggable={false} className={`${CTA} ${v.chip} ${FOCUS}`}>
          {cta}
          <FiArrowRight className="h-3.5 w-3.5 flex-shrink-0 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative mt-3 min-h-0 flex-1 sm:mt-4">
        {loading ? (
          <div aria-hidden="true" className="absolute inset-0 animate-pulse rounded-2xl bg-black/10 motion-reduce:animate-none" />
        ) : items.length === 0 ? (
          <p className="absolute inset-0 grid place-items-center px-4 text-center text-sm font-bold">{empty}</p>
        ) : (
          <div aria-live={hovered ? 'polite' : 'off'}>
            {items.map((item, i) => (
              <div
                key={item.id}
                aria-hidden={i !== index}
                className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
              >
                {near(i, index, items.length) ? (
                  <Slide item={item} current={i === index} eager={i === 0 && kind === 'deals'} language={language} t={t} />
                ) : null}
              </div>
            ))}
            {items.length > 1 && (
              <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center gap-1.5">
                {items.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={fill(t.goTo, { n: i + 1 })}
                    aria-current={i === index}
                    className={`h-2.5 rounded-full border-2 border-black transition-[width,background-color] duration-200 motion-reduce:transition-none ${FOCUS} ${i === index ? 'w-6 bg-white' : 'w-2.5 bg-black/30'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
});

const ARROW =
  'absolute top-[calc(50%-1.5rem)] z-20 hidden h-12 w-12 cursor-pointer place-items-center rounded-full border-[3px] border-black bg-white text-emerald-950 [box-shadow:3px_3px_0_0_#000] active:scale-95 sm:grid';

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap';
const FONT_STACK = "'Poppins', 'Cairo', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

const ensurePoppins = () => {
  if (typeof document === 'undefined' || document.getElementById('navbar-font')) return;
  const link = document.createElement('link');
  link.id = 'navbar-font';
  link.rel = 'stylesheet';
  link.href = FONT_URL;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
};

const HeroShowcaseContent = ({ darkMode = false, navOffset = 150, navOffsetSm = 132 }) => {
  const language = useAppLanguage();
  const dir = languageDirection(language);
  const isAr = language === 'ar';
  const t = TEXT[language] || TEXT.en;
  const data = useHeroData();
  const [wrapRef, onScreen] = useOnScreen();
  const railRef = useRef(null);

  useEffect(() => { ensurePoppins(); }, []);

  const scrollBy = useCallback((d) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: d * (isAr ? -1 : 1) * el.clientWidth * 0.7, behavior: prefersReduced() ? 'auto' : 'smooth' });
  }, [isAr]);
  const goPrev = useCallback(() => scrollBy(-1), [scrollBy]);
  const goNext = useCallback(() => scrollBy(1), [scrollBy]);

  const rootStyle = useMemo(
    () => ({
      ...(darkMode ? THEMES.dark : THEMES.light),
      backgroundColor: 'var(--hs-bg)',
      fontFamily: FONT_STACK,
      '--hs-nav': `${navOffset}px`,
      '--hs-nav-sm': `${navOffsetSm}px`,
    }),
    [darkMode, navOffset, navOffsetSm],
  );

  return (
    <section
      ref={wrapRef}
      dir={dir}
      aria-label={t.label}
      style={rootStyle}
      className="relative w-full pt-[var(--hs-nav)] [--dx:1] sm:pt-[var(--hs-nav-sm)] rtl:[--dx:-1]"
    >
      <div className="relative mx-auto w-full max-w-[120rem] py-4 sm:py-6">
        <div
          ref={railRef}
          role="group"
          aria-roledescription="carousel"
          aria-label={t.label}
          className="flex h-[30rem] max-h-[calc(100svh-var(--hs-nav)-2rem)] min-h-[26rem] snap-x snap-mandatory items-stretch gap-3 overflow-x-auto px-4 pb-3 pt-1 [overscroll-behavior-x:contain] [scrollbar-width:none] sm:h-[34rem] sm:max-h-[calc(100svh-var(--hs-nav-sm)-3rem)] sm:gap-5 sm:px-6 lg:h-[36rem] [&::-webkit-scrollbar]:hidden"
        >
          <SliderCard
            kind="deals" tone="deals" to="/offers"
            title={t.dealsTitle} sub={t.dealsSub} cta={t.dealsCta} empty={t.noDeals}
            items={data.deals.items} loading={data.deals.loading}
            active={onScreen} ms={4500} language={language} t={t}
          />
          <SliderCard
            kind="shops" tone="shops" to="/shops"
            title={t.shopsTitle} sub={t.shopsSub} cta={t.shopsCta} empty={t.noShops}
            items={data.shops.items} loading={data.shops.loading}
            active={onScreen} ms={5500} language={language} t={t}
          />
          <SliderCard
            kind="offers" tone="offers" to="/offers"
            title={t.offersTitle} sub={t.offersSub} cta={t.offersCta} empty={t.noOffers}
            items={data.offers.items} loading={data.offers.loading}
            active={onScreen} ms={6500} language={language} t={t}
          />
          <div className="flex h-full w-[20rem] flex-none snap-start flex-col gap-3 sm:w-[30rem] sm:gap-5 lg:w-[37.5rem]">
            <WideCard id="repair" t={t} darkMode={darkMode} />
            <WideCard id="track" t={t} darkMode={darkMode} />
          </div>
        </div>
        <button type="button" aria-label={t.prev} onClick={goPrev} className={`${ARROW} ${FOCUS} start-3`}>
          <FiChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </button>
        <button type="button" aria-label={t.next} onClick={goNext} className={`${ARROW} ${FOCUS} end-3`}>
          <FiChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};

const HeroShowcaseMemo = memo(HeroShowcaseContent);

const HeroShowcase = (props) => (
  <QueryClientProvider client={queryClient}>
    <HeroShowcaseMemo {...props} />
  </QueryClientProvider>
);

export default memo(HeroShowcase);