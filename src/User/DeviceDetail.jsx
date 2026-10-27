import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useParams, useNavigate, useNavigationType, Link } from 'react-router-dom';
import {
  FiChevronLeft, FiChevronRight, FiShoppingCart, FiCheck, FiTag, FiBox, FiCalendar, FiPackage,
  FiMinus, FiPlus, FiAlertCircle, FiDollarSign, FiAward, FiShield, FiFileText,
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

const RELATED_LIMIT = 8;
const CARD_IMG_W = 600;
const CARD_IMG_H = 400;
const MAIN_IMG_W = 900;
const MAIN_IMG_H = 600;

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
.nb{--nb-bg:#eef9f3;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e8ebe9;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;--nb-media:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22;--nb-media:#1e1e1e}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-dark .nb-dotted{border-color:#3f3f3f}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:5px 5px 0 var(--nb-shadow);transition:transform .15s ease,box-shadow .15s ease}
.nb-lift:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--nb-shadow)}
.nb-bar{display:inline-block;width:52px;height:16px;background:var(--nb-accent);border:2px solid var(--nb-line)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:4px;text-underline-offset:5px;text-decoration-skip-ink:none}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.nb-chip-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-chip-r{background:#e11d48;color:#fff}
.nb-chip-w{background:#d97706;color:#fff}
.nb-chip-s{background:#0284c7;color:#fff}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible,.nb-field:focus-within{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-arrow{display:inline-flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;background:var(--nb-btn);color:var(--nb-on);border:2px solid var(--nb-line);box-shadow:2px 2px 0 var(--nb-shadow);cursor:pointer;transition:transform .15s ease}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow)}
.nb-media{background:var(--nb-gray)}
.nb-media-w{background:var(--nb-media);contain:layout paint}
.nb-media-b{border-radius:1rem}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
@media (prefers-reduced-motion:reduce){.nb-card,.nb-btn,.nb-arrow{transition:none}}
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

const DETAIL_SECTIONS = {
  en: enTranslations.deviceDetail,
  ar: arTranslations.deviceDetail,
  fr: frTranslations.deviceDetail,
};
const translators = {};
const getT = (lang) => {
  if (!translators[lang]) {
    const dict = { ...DETAIL_SECTIONS.en, ...DETAIL_SECTIONS[lang] };
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
  NEW: { chip: 'nb-chip-a', key: 'conditionNew' },
  USED: { chip: 'nb-chip-w', key: 'conditionUsed' },
  REFURBISHED: { chip: 'nb-chip-s', key: 'conditionRefurbished' },
};
const DEFAULT_COND = { chip: 'nb-chip-a' };
const condOf = (c) => pick(CONDITION, c) || DEFAULT_COND;
const condLabel = (t, c) => (pick(CONDITION, c) ? t(pick(CONDITION, c).key) : clean(c, 30) || t('conditionUnknown'));

const NUMBER_FORMAT = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const fmtPrice = (n, currency) => `${currency} ${NUMBER_FORMAT.format(Number(n) || 0)}`;
const fmtDate = (v, lang) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
};

const galleryOf = (p) => {
  const extra = [p.images, p.imageUrls, p.gallery].find(Array.isArray) || [];
  const list = [p.imageUrl, ...extra.map((i) => (typeof i === 'string' ? i : i?.url || i?.imageUrl))]
    .map(safeImageUrl)
    .filter(Boolean);
  return [...new Set(list)].slice(0, 8);
};

const normalizeProduct = (p) => {
  const base = Math.max(0, Number(p.price) || 0);
  const discount = clamp(Number(p.discount) || 0, 0, 100);
  const legacyOld = Math.max(0, Number(p.oldPrice ?? p.originalPrice) || 0);
  const price = discount ? Math.round(base * (1 - discount / 100) * 100) / 100 : base;
  const oldPrice = discount ? base : legacyOld > base ? legacyOld : 0;
  const images = galleryOf(p);
  return {
    id: String(p.id),
    name: clean(String(p.name ?? ''), 160),
    description: clean(String(p.description ?? ''), 3000),
    categoryId: p.categoryId ?? null,
    categoryName: clean(String(p.categoryName ?? ''), 80),
    condition: typeof p.condition === 'string' ? p.condition : '',
    stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
    deleted: !!p.deleted,
    shopId: p.shopId != null ? String(p.shopId) : '',
    shopName: clean(String(p.shopName ?? p.brandName ?? ''), 80),
    createdAt: p.createdAt || null,
    price,
    oldPrice,
    images,
    imageUrl: images[0] || '',
  };
};

const SNIPPET_MAX = 90;
const snippetOf = (text, max = SNIPPET_MAX) => {
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

const DetailBanner = memo(({ darkMode, product, t }) => (
  <section className="nb-gray nb-line relative mt-20 overflow-hidden border-b-2">
    <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-6 sm:pb-36 sm:pt-12 lg:px-8 lg:pb-44">
      <nav aria-label={t('breadcrumb')} className="relative z-10 flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase sm:text-sm">
        <Link to="/devices" className="underline underline-offset-4 hover:no-underline">{t('breadcrumbShop')}</Link>
        <FiChevronRight className="h-3 w-3 flex-shrink-0 rtl:rotate-180" />
        {product.categoryName && (<><span className="max-w-[10rem] truncate">{product.categoryName}</span><FiChevronRight className="h-3 w-3 flex-shrink-0 rtl:rotate-180" /></>)}
        <span className="nb-muted max-w-[14rem] truncate" aria-current="page">{product.name}</span>
      </nav>
      <p className="relative z-10 mt-5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide"><span className="nb-bar" aria-hidden="true" />{t('deviceDetails')}</p>
      <p className="relative z-10 mt-3 line-clamp-2 max-w-xl text-lg font-extrabold uppercase leading-tight sm:text-2xl lg:text-3xl">{product.name}</p>
      <div aria-hidden="true" className="pointer-events-none absolute bottom-24 end-4 hidden h-40 w-40 sm:block lg:bottom-32 lg:end-16 lg:h-56 lg:w-56">
        <IsoIllustration type={isoCatKey(kindOfCategory(product.categoryName))} darkMode={darkMode} onGreen={false} className="h-full w-full" />
      </div>
    </div>
  </section>
));

const DeviceArt = memo(({ category, label, darkMode, big = false }) => (
  <div role="img" aria-label={label} className="nb-media-w relative flex h-full w-full items-center justify-center overflow-hidden">
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

const ProductCard = memo(({ product, darkMode, onAddToCart, onOpen, t }) => {
  const [added, setAdded] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const cond = condOf(product.condition);
  const out = product.stock <= 0;
  const snippet = useMemo(() => snippetOf(product.description) || t('noDescription'), [product.description, t]);
  const open = useCallback(() => onOpen(product.id), [onOpen, product.id]);
  const handleKey = useCallback((e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }, [open]);
  const handleCart = async (e) => {
    e.stopPropagation();
    if (out) return;
    const ok = await onAddToCart(product);
    if (ok) { setAdded(true); clearTimeout(timer.current); timer.current = setTimeout(() => setAdded(false), 1400); }
  };

  return (
    <article
      onClick={open}
      onKeyDown={handleKey}
      tabIndex={0}
      aria-label={product.name}
      className="nb-card nb-lift group relative flex h-full cursor-pointer flex-col focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--nb-accent)]"
    >
      <div className="p-2.5 pb-0">
        <div className="nb-media-w nb-media-b relative aspect-[3/2] overflow-hidden">
          <span className={`nb-chip ${cond.chip} absolute start-2 top-2 z-10 !rounded-full`}>{condLabel(t, product.condition)}</span>
          <DeviceImage src={product.imageUrl} alt={product.name} category={product.categoryName} label={t('imageUnavailable')} darkMode={darkMode}
            width={CARD_IMG_W} height={CARD_IMG_H}
            className="block h-full w-full object-cover transition-transform duration-300 motion-reduce:transition-none group-hover:scale-105" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="nb-muted truncate text-[10px] font-bold uppercase tracking-wide">{product.categoryName || t('uncategorized')}</span>
        <h3 className="line-clamp-2 min-h-[2.4rem] text-[13px] font-extrabold uppercase leading-snug"><span className="nb-ul">{product.name}</span></h3>
        <p className="line-clamp-2 min-h-[2rem] text-xs leading-4 opacity-90">{snippet}</p>
        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 max-sm:rtl:text-end" dir="ltr">
            <p className="truncate text-sm font-extrabold tabular-nums sm:text-base">{fmtPrice(product.price, t('currency'))}</p>
            {out && <p className="text-[10px] font-bold uppercase text-rose-600">{t('outOfStock')}</p>}
          </div>
          <button type="button" onClick={handleCart} disabled={out} aria-label={t('addToCart')} className="nb-btn nb-btn-a h-9 w-full flex-shrink-0 sm:w-9">
            {added ? <FiCheck className="h-4 w-4" /> : <FiShoppingCart className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
});

const ProductSlider = memo(({ title, products, darkMode, isRTL, onAddToCart, onOpen, t }) => {
  const { ref, edge, scroll } = useHScroll(products.length, isRTL);
  if (!products.length) return null;
  const BackIcon = isRTL ? FiChevronRight : FiChevronLeft;
  const ForwardIcon = isRTL ? FiChevronLeft : FiChevronRight;

  return (
    <section aria-label={title}>
      <div className="mb-4 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-extrabold uppercase sm:text-2xl"><span className="nb-ul">{title}</span></h2>
          <p className="nb-muted mt-1 text-xs font-bold" dir="ltr">{products.length}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="nb-btn h-9 w-9" onClick={() => scroll('back')} disabled={!edge.l} aria-label={t('previous')}><BackIcon className="h-4 w-4" /></button>
          <button type="button" className="nb-btn h-9 w-9" onClick={() => scroll('forward')} disabled={!edge.r} aria-label={t('next')}><ForwardIcon className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={ref} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 pe-3 ps-1 pt-1 sm:gap-6 motion-reduce:scroll-auto">
        {products.map((p) => (
          <div key={p.id} className="w-[200px] flex-shrink-0 snap-start sm:w-[260px]">
            <ProductCard product={p} darkMode={darkMode} onAddToCart={onAddToCart} onOpen={onOpen} t={t} />
          </div>
        ))}
      </div>
    </section>
  );
});

const Gallery = memo(({ product, cond, label, darkMode, t }) => {
  const images = product.images;
  const [active, setActive] = useState(0);
  const src = images[active];

  return (
    <div className="nb-card min-w-0 p-3 sm:p-4">
      <div className="flex flex-col-reverse gap-3 lg:flex-row">
        {images.length > 1 && (
          <ul className="hide-scrollbar flex gap-2 overflow-x-auto p-1 lg:max-h-[560px] lg:w-24 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
            {images.map((s, i) => (
              <li key={s} className="flex-none">
                <button type="button" onClick={() => setActive(i)} aria-label={`${product.name} ${i + 1}`} aria-current={i === active ? 'true' : undefined}
                  className={`nb-media-w nb-media-b block aspect-[3/2] w-24 overflow-hidden !rounded-xl transition-[box-shadow,opacity] ${
                    i === active ? 'shadow-[3px_3px_0_var(--nb-shadow)]' : 'opacity-70 hover:opacity-100'} focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[color:var(--nb-accent)]`}>
                  <img src={s} alt="" width={96} height={64} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="block h-full w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="nb-media-w nb-media-b relative aspect-[3/2] min-w-0 flex-1 overflow-hidden lg:max-h-[560px]">
          <span className={`nb-chip ${cond.chip} absolute start-3 top-3 z-10 !rounded-full`}>{label}</span>
          <DeviceImage src={src} alt={product.name} category={product.categoryName} label={t('imageUnavailable')} darkMode={darkMode} big eager={active === 0}
            width={MAIN_IMG_W} height={MAIN_IMG_H}
            className="block h-full w-full object-cover transition-transform duration-300 motion-reduce:transition-none hover:scale-105" />
        </div>
      </div>
    </div>
  );
});

const DetailSkeleton = () => (
  <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-6" aria-hidden="true" role="status">
    <div className="nb-card p-4"><div className="nb-gray aspect-[3/2] animate-pulse rounded-2xl motion-reduce:animate-none" /></div>
    <div className="nb-card space-y-4 p-6">
      {[80, 40, 55, 100, 100].map((w, i) => <div key={i} className="nb-gray h-6 animate-pulse motion-reduce:animate-none" style={{ width: `${w}%` }} />)}
    </div>
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

  const [relatedRef, relatedNear] = useInView('600px');

  useEffect(() => { ensureNbFont(); }, []);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: async ({ signal }) => normalizeProduct((await api.get(`/api/products/${encodeURIComponent(id)}`, { signal })).data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['productsAll'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/products', { signal });
      const list = res.data?.content || res.data || [];
      if (!Array.isArray(list)) return [];
      const out = [];
      for (const p of list) if (p && p.id != null && !p.deleted) out.push(normalizeProduct(p));
      return out;
    },
    enabled: !!product && relatedNear,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => { if (product?.name) document.title = `${product.name} | ${t('siteName')}`; }, [product?.name, t]);
  useEffect(() => { if (isError) toast({ icon: 'error', title: t('errorTitle'), text: t('productNotFound'), timer: 3500 }); }, [isError, t]);

  const { sameCategory, moreGroup } = useMemo(() => {
    if (!product) return { sameCategory: [], moreGroup: { title: '', products: [] } };
    const pool = allProducts.filter((p) => p.id !== product.id);
    const cat = pool.filter((p) => p.categoryId != null && p.categoryId === product.categoryId);
    const seen = new Set(cat.map((p) => p.id));
    const rest = pool.filter((p) => !seen.has(p.id));
    const byShop = product.shopId ? rest.filter((p) => p.shopId === product.shopId) : [];
    return {
      sameCategory: cat.slice(-RELATED_LIMIT),
      moreGroup: byShop.length
        ? { title: t('moreFromShop', { name: product.shopName || t('breadcrumbShop') }), products: byShop.slice(-RELATED_LIMIT) }
        : { title: t('otherDevices', { condition: condLabel(t, product.condition).toLowerCase() }), products: rest.filter((p) => p.condition === product.condition).slice(-RELATED_LIMIT) },
    };
  }, [allProducts, product, t]);

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
      addToCart?.({ ...product, quantity });
      successToast(product.name);
    } catch (err) {
      failToast(err);
    } finally {
      setAdding(false);
    }
  }, [product, unavailable, adding, ensureLogin, postToCart, quantity, addToCart, successToast, failToast]);

  const handleRelatedAdd = useCallback(async (p) => {
    if (!(await ensureLogin())) return false;
    try { await postToCart(p, 1); successToast(p.name); return true; } catch (err) { failToast(err); return false; }
  }, [ensureLogin, postToCart, successToast, failToast]);

  const openProduct = useCallback((pid) => navigate(`/device/${encodeURIComponent(pid)}`), [navigate]);
  const goBack = useCallback(() => navigate(-1), [navigate]);

  if (isLoading) {
    return (
      <Shell language={language} darkMode={darkMode}>
        <div className="mx-auto max-w-7xl px-4 py-10 pt-28 sm:px-6 lg:px-8"><DetailSkeleton /></div>
      </Shell>
    );
  }

  if (!product) {
    return (
      <Shell language={language} darkMode={darkMode} className="flex items-center justify-center px-4">
        <div className="nb-card w-full max-w-sm space-y-4 p-8 text-center">
          <IsoIllustration type="shopEmpty" darkMode={darkMode} onGreen={false} className="mx-auto h-32 w-32" />
          <h2 className="text-xl font-extrabold uppercase">{t('productNotFound')}</h2>
          <button type="button" onClick={goBack} className="nb-btn nb-btn-a mx-auto px-5 py-2.5 text-sm uppercase"><FiChevronLeft className="h-4 w-4 rtl:rotate-180" /> {t('goBack')}</button>
        </div>
      </Shell>
    );
  }

  const currency = t('currency');
  const cond = condOf(product.condition);
  const listed = fmtDate(product.createdAt, language);
  const off = product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const stockStatus = product.deleted || product.stock <= 0
    ? { label: t('outOfStock'), cls: 'nb-chip-r' }
    : product.stock > 10
      ? { label: t('inStock'), cls: 'nb-chip-a' }
      : { label: t('onlyLeft', { count: product.stock }), cls: 'nb-chip-w' };
  const maxQty = Math.max(1, product.stock);
  const qty = clamp(quantity, 1, maxQty);

  const trust = [
    { icon: FiDollarSign, label: t('cashOnDelivery') },
    { icon: FiAward, label: t('bestPrice') },
    { icon: FiShield, label: t('authentic') },
  ];
  const specs = [
    { icon: FiTag, text: product.categoryName || t('uncategorized') },
    { icon: FiBox, text: condLabel(t, product.condition) },
    { icon: FiPackage, text: product.stock > 0 ? t('stockCount', { count: product.stock }) : t('outOfStock') },
    listed && { icon: FiCalendar, text: t('listed', { date: listed }) },
  ].filter(Boolean);

  return (
    <Shell language={language} darkMode={darkMode}>
      <DetailBanner darkMode={darkMode} product={product} t={t} />

      <div className="relative z-20 mx-auto -mt-20 max-w-7xl px-4 sm:-mt-28 sm:px-6 lg:-mt-36 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-6">
          <Gallery key={product.id} product={product} cond={cond} label={condLabel(t, product.condition)} darkMode={darkMode} t={t} />

          <aside className="nb-card flex min-w-0 flex-col gap-5 p-4 sm:p-6">
            <div className="text-center lg:text-start">
              {product.categoryName && <p className="nb-muted mb-1 text-[11px] font-extrabold uppercase tracking-wide">{product.categoryName}</p>}
              <h1 className="break-words text-xl font-extrabold uppercase leading-snug sm:text-2xl"><span className="nb-ul">{product.name}</span></h1>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5 lg:justify-start">
                <span className={`nb-chip ${stockStatus.cls}`}>{stockStatus.label}</span>
                <span className={`nb-chip ${cond.chip}`}>{condLabel(t, product.condition)}</span>
              </div>
              {product.shopName && product.shopId && (
                <Link to={`/shops/${encodeURIComponent(product.shopId)}`} className="mt-3 inline-flex max-w-full items-center gap-1.5 text-xs font-extrabold uppercase underline underline-offset-4 hover:no-underline">
                  <RiStoreLine className="nb-ic h-3.5 w-3.5 flex-shrink-0" /><span className="truncate">{product.shopName}</span>
                </Link>
              )}
            </div>

            <div className="text-center lg:text-start" dir="ltr">
              <p className="break-words text-3xl font-extrabold tabular-nums sm:text-4xl">{fmtPrice(product.price, currency)}</p>
              {off > 0 && (
                <p className="mt-1 flex items-center justify-center gap-2 lg:justify-start">
                  <s className="nb-muted text-sm tabular-nums">{fmtPrice(product.oldPrice, currency)}</s>
                  <span className="nb-chip nb-chip-r">-{off}%</span>
                </p>
              )}
            </div>

            {product.deleted && (
              <p className="nb-chip nb-chip-r !px-3 !py-2 text-xs normal-case">
                <FiAlertCircle className="h-4 w-4 flex-shrink-0" /> {t('unavailable')}
              </p>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="nb-muted text-xs font-extrabold uppercase">{t('quantity')}</span>
                <div className="nb-field inline-flex items-center">
                  <button type="button" aria-label={t('decreaseQuantity')} onClick={() => setQuantity(Math.max(1, qty - 1))} disabled={qty <= 1 || unavailable} className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-[color:var(--nb-gray)] disabled:opacity-40"><FiMinus className="h-4 w-4" /></button>
                  <span className="min-w-[2.5rem] px-2 text-center text-sm font-extrabold tabular-nums" aria-live="polite" dir="ltr">{qty}</span>
                  <button type="button" aria-label={t('increaseQuantity')} onClick={() => setQuantity(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty || unavailable} className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-[color:var(--nb-gray)] disabled:opacity-40"><FiPlus className="h-4 w-4" /></button>
                </div>
              </div>
              <button type="button" onClick={handleAddToCart} disabled={unavailable || adding} aria-busy={adding} className="nb-btn nb-btn-a h-12 w-full text-sm uppercase">
                <FiShoppingCart className="h-4 w-4" /> {adding ? t('adding') : t('addToCart')}
              </button>
            </div>

            <ul className="nb-line nb-dotted grid grid-cols-3 gap-2 border-t-2 border-dotted pt-4">
              {trust.map(({ icon: Icon, label }) => (
                <li key={label} className="flex flex-col items-center gap-2 text-center">
                  <span className="nb-chip nb-chip-a !p-2.5"><Icon className="h-5 w-5" /></span>
                  <span className="nb-muted text-[10px] font-extrabold uppercase leading-tight tracking-wide">{label}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:space-y-14 sm:px-6 sm:py-14 lg:px-8">
        <section className="nb-card p-4 sm:p-6">
          <h2 className="mb-4 flex items-center gap-3 text-lg font-extrabold uppercase sm:text-xl">
            <span className="nb-chip nb-chip-a !p-2"><FiFileText className="h-4 w-4" /></span> <span className="nb-ul">{t('productDescription')}</span>
          </h2>
          <p className="whitespace-pre-line break-words text-sm leading-relaxed opacity-90">{product.description || t('noDescription')}</p>
          <ul className="nb-gray nb-line nb-dotted mt-5 grid grid-cols-1 gap-3 border-2 border-dotted p-3.5 sm:grid-cols-2">
            {specs.map(({ icon: Icon, text }) => (
              <li key={text} className="flex min-w-0 items-center gap-2 text-xs font-bold">
                <Icon aria-hidden="true" className="nb-ic h-4 w-4 flex-shrink-0" /> <span className="truncate">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <div ref={relatedRef} className="lk-cv space-y-10 sm:space-y-14">
          <ProductSlider title={t('similarProducts')} products={sameCategory} darkMode={darkMode} isRTL={isRTL} onAddToCart={handleRelatedAdd} onOpen={openProduct} t={t} />
          <ProductSlider title={moreGroup.title} products={moreGroup.products} darkMode={darkMode} isRTL={isRTL} onAddToCart={handleRelatedAdd} onOpen={openProduct} t={t} />
        </div>
      </div>
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