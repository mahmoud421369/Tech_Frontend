import React, { useState, useEffect, useCallback, useMemo, useRef, memo, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiChevronLeft, FiShoppingCart, FiHeart, FiCheck, FiTag, FiBox, FiCalendar, FiPackage,
  FiMinus, FiPlus, FiAlertCircle,
} from 'react-icons/fi';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../api';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { Defs3D, Glyph3D, Btn3D, Chip3D, InfoRow, TrustStrip } from '../components/Ui3D';
import { FiShield, FiRefreshCw, FiTool } from 'react-icons/fi';
import { RiVerifiedBadgeLine } from 'react-icons/ri';

const Hero = lazy(() => import('../components/Hero'));
const queryClient = new QueryClient();

/* ───────────── helpers ───────────── */
const DETAIL_TRANSLATIONS = {
  en: enTranslations.deviceDetail,
  ar: arTranslations.deviceDetail || arTranslations.hero?.deviceDetail,
  fr: frTranslations.deviceDetail || frTranslations.hero?.deviceDetail,
};
const tr = (lang, key, values = {}) => {
  let text = DETAIL_TRANSLATIONS[lang]?.[key] || DETAIL_TRANSLATIONS.en?.[key] || key;
  Object.entries(values).forEach(([k, v]) => { text = text.replace(`{{${k}}}`, v); });
  return text;
};

// sweetalert2 is only needed for toasts – loaded on demand, never on first paint.
let swalPromise;
const loadSwal = () => (swalPromise ||= import('sweetalert2').then((m) => m.default || m));
const toast = (opts) => loadSwal().then((Swal) => Swal.fire({ toast: true, position: 'top-end', timer: 1800, timerProgressBar: true, ...opts }));

// Same condition enum + colors as the product grid (NEW / USED / REFURBISHED).
const CONDITION = {
  NEW: { badge: 'bg-emerald-500', label: 'New' },
  USED: { badge: 'bg-amber-500', label: 'Used' },
  REFURBISHED: { badge: 'bg-sky-500', label: 'Refurbished' },
};
const condOf = (c) => CONDITION[c] || { badge: 'bg-gray-400', label: c || 'Unknown' };

const fmtPrice = (n) => `EGP ${Number(n || 0).toLocaleString()}`;
const fmtDate = (v) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
};

const TRUST = [
  { icon: RiVerifiedBadgeLine, title: 'Quality checked', text: 'Tested before listing' },
  { icon: FiTool, title: 'Certified repairs', text: '12-month warranty' },
  { icon: FiRefreshCw, title: 'Trade-in credit', text: 'Instant estimates' },
  { icon: FiShield, title: 'Safe recycling', text: 'Less e-waste' },
];

const card = (dm) => `rounded-2xl border ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`;
const tile = (dm) => (dm ? 'bg-emerald-900/30' : 'bg-gradient-to-br from-emerald-50 to-emerald-100');

/* Product image with a 3D-glyph fallback (no extra /placeholder.png request). */
const DeviceImage = memo(({ src, alt, category, className, glyphClass }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <Glyph3D name={category} fallback="box" className={glyphClass} />;
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={className} />;
});

/* ───────────── compact related card ───────────── */
const ProductCard = memo(({ product, darkMode, onAddToCart, onOpen, index = 0 }) => {
  const [added, setAdded] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const cond = condOf(product.condition);
  const out = !(product.stock > 0);

  const open = () => onOpen(product.id);
  const handleCart = (e) => {
    e.stopPropagation();
    if (out) return;
    setAdded(true);
    onAddToCart(product);
    timer.current = setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}
      tabIndex={0}
      aria-label={product.name}
      style={{ animationDelay: `${Math.min(index, 8) * 25}ms` }}
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${
        darkMode ? 'border-gray-700 bg-gray-800 hover:shadow-lg hover:shadow-black/30' : 'border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-200/70'}`}
    >
      <div className={`relative flex aspect-[4/3] items-center justify-center ${tile(darkMode)}`}>
        <span className={`absolute start-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white ${cond.badge}`}>{cond.label}</span>
        <DeviceImage src={product.imageUrl} alt={product.name} category={product.categoryName}
          className="h-full w-full object-contain p-3 transition-transform duration-200 group-hover:scale-105" glyphClass="h-14 w-14 transition-transform duration-200 group-hover:scale-110" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <span className={`truncate text-[10px] font-bold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{product.categoryName || 'Uncategorized'}</span>
        <h3 className={`truncate text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="min-w-0">
            <p className={`truncate text-sm font-extrabold tabular-nums ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{fmtPrice(product.price)}</p>
            {out && <p className="text-[10px] font-semibold text-rose-500">Out of stock</p>}
          </div>
          <Btn3D onClick={handleCart} disabled={out} aria-label="Add to cart" className="h-8 w-8 flex-shrink-0 !shadow-[0_3px_0_0_#047857]">
            {added ? <FiCheck className="h-4 w-4" /> : <FiShoppingCart className="h-4 w-4" />}
          </Btn3D>
        </div>
      </div>
    </article>
  );
});

const RelatedSection = memo(({ title, glyph, products, darkMode, onAddToCart, onOpen }) => {
  const [visible, setVisible] = useState(8);
  if (!products.length) return null;
  const shown = products.slice(0, visible);
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tile(darkMode)}`}><Glyph3D name={glyph} fallback="box" className="h-7 w-7" /></span>
        <h2 className={`text-lg font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{products.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((p, i) => <ProductCard key={p.id} product={p} darkMode={darkMode} onAddToCart={onAddToCart} onOpen={onOpen} index={i} />)}
      </div>
      {products.length > visible && (
        <div className="mt-5 flex justify-center">
          <Btn3D tone="soft" darkMode={darkMode} onClick={() => setVisible((v) => v + 8)} className="px-4 py-2 text-xs">Show more</Btn3D>
        </div>
      )}
    </section>
  );
});

const DetailSkeleton = ({ darkMode }) => {
  const bar = darkMode ? 'bg-gray-700' : 'bg-gray-100';
  return (
    <div className={`${card(darkMode)} grid gap-5 p-4 sm:p-5 lg:grid-cols-2`}>
      <div className={`aspect-square max-h-[320px] animate-pulse rounded-2xl ${bar}`} />
      <div className="space-y-3">
        {[80, 40, 55, 90, 60].map((w, i) => <div key={i} className={`h-5 animate-pulse rounded-lg ${bar}`} style={{ width: `${w}%` }} />)}
      </div>
    </div>
  );
};

/* ───────────── page ───────────── */
const DeviceDetailContent = memo(({ id, addToCart, darkMode }) => {
  const navigate = useNavigate();
  const language = useAppLanguage();
  const t = useCallback((k, v) => tr(language, k, v), [language]);

  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);

  // 1) the product itself – renders as soon as this resolves
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/api/products/${id}`)).data,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // 2) related products – fetched after the main product, shared cache key with listings
  const { data: allProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/api/products');
      const list = res.data?.content || res.data || [];
      return Array.isArray(list) ? list : [];
    },
    enabled: !!product,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => { if (product?.name) document.title = `${product.name} | Tech-Restore`; }, [product?.name]);
  useEffect(() => { if (isError) toast({ icon: 'error', title: 'Error', text: 'Product not found' }); }, [isError]);

  const { sameCategory, sameCondition } = useMemo(() => {
    if (!product) return { sameCategory: [], sameCondition: [] };
    const pool = allProducts.filter((p) => p && p.id !== product.id && !p.deleted);
    const cat = pool.filter((p) => p.categoryId === product.categoryId);
    const seen = new Set(cat.map((p) => p.id));
    return { sameCategory: cat, sameCondition: pool.filter((p) => p.condition === product.condition && !seen.has(p.id)) };
  }, [allProducts, product]);

  const postToCart = useCallback((p, qty) => api.post('/api/cart/items', {
    productId: p.id, quantity: qty, price: p.price, name: p.name, imageUrl: p.imageUrl || '/placeholder.png',
  }), []);

  const unavailable = !product || product.deleted || !(product.stock > 0);

  const handleAddToCart = useCallback(async () => {
    if (!product || unavailable) return;
    setAdding(true);
    try {
      await postToCart(product, quantity);
      addToCart?.({ ...product, quantity });
      toast({ icon: 'success', title: 'Added to cart!' });
    } catch (err) {
      toast({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to add to cart', timer: 2000 });
    } finally {
      setAdding(false);
    }
  }, [product, unavailable, postToCart, quantity, addToCart]);

  const handleRelatedAdd = useCallback(async (p) => {
    try {
      await postToCart(p, 1);
      toast({ icon: 'success', title: 'Added!', text: `${p.name} added to cart`, timer: 1500 });
    } catch {
      toast({ icon: 'error', title: 'Error', text: 'Failed to add to cart', timer: 1500 });
    }
  }, [postToCart]);

  const openProduct = useCallback((pid) => navigate(`/device/${pid}`), [navigate]);
  const goBack = useCallback(() => navigate(-1), [navigate]);

  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const strong = darkMode ? 'text-white' : 'text-gray-900';
  const fontCls = language === 'ar' ? 'font-cairo' : 'font-poppins';
  const shell = `min-h-screen ${fontCls} ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`;

  if (isLoading) {
    return (
      <div dir={languageDirection(language)} className={shell}>
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8"><DetailSkeleton darkMode={darkMode} /></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div dir={languageDirection(language)} className={`${shell} flex items-center justify-center px-4`}>
        <Defs3D />
        <div className={`${card(darkMode)} w-full max-w-sm space-y-4 p-8 text-center shadow-xl`}>
          <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${tile(darkMode)}`}><Glyph3D name="box" className="h-11 w-11" /></span>
          <h2 className={`text-xl font-bold ${strong}`}>Product Not Found</h2>
          <Btn3D onClick={goBack} className="px-5 py-2.5 text-sm"><FiChevronLeft className="h-4 w-4 rtl:rotate-180" /> Go Back</Btn3D>
        </div>
      </div>
    );
  }

  const cond = condOf(product.condition);
  const listed = fmtDate(product.createdAt);
  const stockStatus = product.deleted || product.stock <= 0
    ? { label: t('outOfStock'), cls: 'bg-rose-500 text-white' }
    : product.stock > 10
      ? { label: t('inStock'), cls: 'bg-emerald-500 text-white' }
      : { label: t('onlyLeft', { count: product.stock }), cls: 'bg-amber-500 text-white' };

  return (
    <div dir={languageDirection(language)} className={`${shell} pb-14`}>
      <Defs3D />

      <Suspense fallback={<div className={`h-[260px] w-full animate-pulse sm:h-[320px] ${darkMode ? 'bg-gray-900' : 'bg-emerald-50'}`} />}>
        <Hero
          variant="home"
          darkMode={darkMode}
          badge={`${product.categoryName || 'Device'} · ${cond.label}`}
          headingLine1=""
          headingAccent={product.name}
          headingLine2=""
          description={t('premiumQuality')}
          buttons={[]}
          stats={[
            { value: '99.9%', label: t('qualityAssured') },
            { value: '10K+', label: t('happyBuyers') },
            { value: '4.9 ★', label: t('averageRating') },
          ]}
        />
      </Suspense>

      <TrustStrip darkMode={darkMode} items={TRUST} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <button type="button" onClick={goBack}
          className={`mb-4 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${darkMode ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-500 hover:text-emerald-600'}`}>
          <FiChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" /> {t('backToProducts')}
        </button>

        <section className={`${card(darkMode)} overflow-hidden`}>
          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-8 lg:p-6">
            {/* image */}
            <div className={`relative flex aspect-square max-h-[340px] items-center justify-center rounded-2xl lg:max-h-none ${tile(darkMode)}`}>
              <span className={`absolute start-3 top-3 rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white ${cond.badge}`}>{cond.label}</span>
              <DeviceImage src={product.imageUrl} alt={product.name} category={product.categoryName}
                className="h-full w-full object-contain p-6 sm:p-8" glyphClass="h-32 w-32" />
            </div>

            {/* info */}
            <div className="flex min-w-0 flex-col gap-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {product.categoryName && <p className={`mb-0.5 text-[11px] font-bold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{product.categoryName}</p>}
                    <h1 className={`text-xl font-extrabold leading-tight sm:text-2xl ${strong}`}>{product.name}</h1>
                  </div>
                  <Btn3D tone="soft" darkMode={darkMode} onClick={() => setSaved((s) => !s)} aria-pressed={saved}
                    aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} className={`h-9 w-9 flex-shrink-0 ${saved ? '!bg-rose-500 !text-white' : ''}`}>
                    <FiHeart className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
                  </Btn3D>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${stockStatus.cls}`}>{stockStatus.label}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white ${cond.badge}`}>{cond.label}</span>
                </div>
              </div>

              <div className={`rounded-2xl border p-3.5 ${darkMode ? 'border-emerald-900/60 bg-emerald-900/20' : 'border-emerald-100 bg-emerald-50/70'}`}>
                <span className={`text-2xl font-extrabold tabular-nums sm:text-3xl ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{fmtPrice(product.price)}</span>
              </div>

              {product.deleted && (
                <p className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-500">
                  <FiAlertCircle className="h-4 w-4 flex-shrink-0" /> This device is no longer available.
                </p>
              )}

              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {product.description || 'No description has been added for this device yet.'}
              </p>

              {/* specs */}
              <div className={`grid grid-cols-2 gap-2 rounded-2xl border p-3 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-100 bg-gray-50'}`}>
                <InfoRow icon={FiTag} darkMode={darkMode}>{product.categoryName || 'Uncategorized'}</InfoRow>
                <InfoRow icon={FiBox} darkMode={darkMode}>{cond.label}</InfoRow>
                <InfoRow icon={FiPackage} darkMode={darkMode}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</InfoRow>
                {listed && <InfoRow icon={FiCalendar} darkMode={darkMode}>Listed {listed}</InfoRow>}
              </div>

              {/* purchase */}
              <div className="mt-auto flex items-stretch gap-3">
                <div className={`inline-flex items-center overflow-hidden rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1 || unavailable}
                    className={`flex h-10 w-9 items-center justify-center disabled:opacity-40 ${darkMode ? 'text-white hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-100'}`}><FiMinus className="h-4 w-4" /></button>
                  <span className={`min-w-[2.25rem] px-2 text-center text-sm font-bold tabular-nums ${strong}`} aria-live="polite">{quantity}</span>
                  <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))} disabled={quantity >= (product.stock || 1) || unavailable}
                    className={`flex h-10 w-9 items-center justify-center disabled:opacity-40 ${darkMode ? 'text-white hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-100'}`}><FiPlus className="h-4 w-4" /></button>
                </div>
                <Btn3D onClick={handleAddToCart} disabled={unavailable || adding} className="h-10 flex-1 px-5 text-sm">
                  <FiShoppingCart className="h-4 w-4" /> {adding ? 'Adding…' : t('addToCart')}
                </Btn3D>
              </div>
            </div>
          </div>
        </section>

        <RelatedSection title={`More ${product.categoryName || 'devices'} like this`} glyph={product.categoryName} products={sameCategory}
          darkMode={darkMode} onAddToCart={handleRelatedAdd} onOpen={openProduct} />
        <RelatedSection title={`Other ${cond.label.toLowerCase()} devices`} glyph="box" products={sameCondition}
          darkMode={darkMode} onAddToCart={handleRelatedAdd} onOpen={openProduct} />
      </div>
    </div>
  );
});

// Keyed by id so quantity / wishlist state reset when navigating between devices.
function DeviceDetailRoute(props) {
  const { id } = useParams();
  return <DeviceDetailContent key={id} id={id} {...props} />;
}

export default function DeviceDetail(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <DeviceDetailRoute {...props} />
    </QueryClientProvider>
  );
}