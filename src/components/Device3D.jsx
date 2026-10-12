import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiCheck, FiTruck, FiShield, FiRefreshCw, FiHeadphones } from 'react-icons/fi';

/* ───────────── helpers ───────────── */
export const readStorage = (key) => {
  try { return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null; } catch { return null; }
};

// Only allow http(s), same-site paths and inline images – blocks javascript: and similar schemes.
export const safeImageUrl = (url) => {
  if (typeof url !== 'string') return '';
  const u = url.trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u) || (u.startsWith('/') && !u.startsWith('//')) || /^data:image\/(png|jpe?g|webp|gif|svg\+xml);/i.test(u)) return u;
  return '';
};
export const money = (n) => `EGP ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
export const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

export const conditionConfig = {
  NEW: { badge: 'bg-emerald-500', label: 'New' },
  USED: { badge: 'bg-amber-500', label: 'Used' },
  REFURBISHED: { badge: 'bg-sky-500', label: 'Refurbished' },
};

/* ───────────── shared CSS (injected once, tiny) ───────────── */
const CSS = `
  @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes orbit { to { transform: rotate(360deg); } }
  .anim-float { animation: floatY 6s ease-in-out infinite; }
  .anim-orbit { animation: orbit 40s linear infinite; }
  .anim-paused .anim-float, .anim-paused .anim-orbit { animation-play-state: paused; }
  .hide-scrollbar { scrollbar-width: none; }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  @media (prefers-reduced-motion: reduce) { .anim-float, .anim-orbit { animation: none !important; } }
`;
let injected = false;
export const Device3DStyles = memo(() => {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    const tag = document.createElement('style');
    tag.setAttribute('data-device3d', 'true');
    tag.textContent = CSS;
    document.head.appendChild(tag);
    injected = true;
  }, []);
  return null;
});

/* Pauses CSS animations while a section is off-screen */
export const useOnScreen = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

/* ───────────── 3D icon system: emerald glass, gradients defined once ───────────── */
export const kindOf = (name = '') => {
  const k = name.toLowerCase();
  if (k.includes('laptop') || k.includes('notebook') || k.includes('computer')) return 'laptop';
  if (k.includes('phone') || k.includes('mobile')) return 'phone';
  if (k.includes('tablet') || k.includes('ipad')) return 'tablet';
  if (k.includes('audio') || k.includes('headphone') || k.includes('earbud')) return 'audio';
  if (k.includes('watch') || k.includes('wear')) return 'watch';
  if (k.includes('monitor') || k.includes('screen') || k.includes('tv') || k.includes('display')) return 'monitor';
  return 'box';
};

/* Render ONCE per page (the Homepage does it; pass standalone to Service if used alone) */
export const Defs3D = memo(() => (
  <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
    <defs>
      {[['em', '#6EE7B7', '#047857'], ['fr', '#0F766E', '#022C22'], ['sd', '#064E3B', '#011A14'], ['sc', '#A7F3D0', '#059669'], ['lt', '#FFFFFF', '#BBF7D0']].map(([id, a, b]) => (
        <linearGradient key={id} id={`g3-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={a} /><stop offset="100%" stopColor={b} />
        </linearGradient>
      ))}
    </defs>
  </svg>
));

export const Glyph3D = memo(({ name = '', className = 'w-10 h-10', style }) => {
  const fr = 'url(#g3-fr)', sd = 'url(#g3-sd)', sc = 'url(#g3-sc)', lt = 'url(#g3-lt)', em = 'url(#g3-em)';
  const W = '#fff';
  let body;
  switch (kindOf(name)) {
    case 'laptop':
      body = (<>
        <rect x="14" y="12" width="42" height="29" rx="4" fill={sd} />
        <rect x="11" y="9" width="42" height="29" rx="4" fill={fr} />
        <rect x="14" y="12" width="36" height="23" rx="2" fill={sc} />
        <path d="M14 28V14a2 2 0 012-2h20z" fill={W} opacity="0.3" />
        <rect x="18" y="17" width="16" height="3" rx="1.5" fill={W} opacity="0.9" />
        <rect x="18" y="23" width="10" height="2.5" rx="1.2" fill={W} opacity="0.55" />
        <rect x="4" y="45" width="56" height="8" rx="4" fill={sd} />
        <rect x="4" y="41" width="56" height="8" rx="4" fill={lt} />
        <rect x="26" y="41" width="12" height="2.5" rx="1.2" fill="#6EE7B7" />
      </>); break;
    case 'phone':
      body = (<>
        <rect x="22" y="6" width="26" height="56" rx="7" fill={sd} />
        <rect x="18" y="2" width="26" height="56" rx="7" fill={fr} />
        <rect x="21" y="5.5" width="20" height="49" rx="4.5" fill={sc} />
        <path d="M21 32V10a4.5 4.5 0 014.5-4.5H34z" fill={W} opacity="0.3" />
        <rect x="24" y="12" width="14" height="3.5" rx="1.7" fill={W} opacity="0.9" />
        <rect x="24" y="19" width="9" height="2.5" rx="1.2" fill={W} opacity="0.55" />
        <rect x="24" y="40" width="14" height="10" rx="3" fill={W} opacity="0.3" />
      </>); break;
    case 'tablet':
      body = (<>
        <rect x="12" y="9" width="48" height="52" rx="8" fill={sd} />
        <rect x="8" y="5" width="48" height="52" rx="8" fill={fr} />
        <rect x="12" y="9" width="40" height="44" rx="4.5" fill={sc} />
        <path d="M12 36V13.5A4.5 4.5 0 0116.5 9H32z" fill={W} opacity="0.3" />
        <rect x="17" y="16" width="20" height="4" rx="2" fill={W} opacity="0.9" />
        <rect x="17" y="38" width="30" height="10" rx="3" fill={W} opacity="0.3" />
      </>); break;
    case 'audio':
      body = (<>
        <path d="M15 36v-5a17 17 0 0134 0v5" fill="none" stroke={sd} strokeWidth="7" strokeLinecap="round" transform="translate(2 3)" />
        <path d="M15 36v-5a17 17 0 0134 0v5" fill="none" stroke={em} strokeWidth="7" strokeLinecap="round" />
        <rect x="9" y="38" width="14" height="22" rx="6" fill={sd} />
        <rect x="45" y="38" width="14" height="22" rx="6" fill={sd} />
        <rect x="7" y="34" width="14" height="22" rx="6" fill={fr} />
        <rect x="43" y="34" width="14" height="22" rx="6" fill={fr} />
        <rect x="10" y="38" width="8" height="13" rx="4" fill={sc} />
        <rect x="46" y="38" width="8" height="13" rx="4" fill={sc} />
      </>); break;
    case 'watch':
      body = (<>
        <rect x="22" y="2" width="20" height="16" rx="4" fill={em} />
        <rect x="22" y="46" width="20" height="16" rx="4" fill={em} />
        <rect x="16" y="17" width="38" height="36" rx="11" fill={sd} />
        <rect x="13" y="14" width="38" height="36" rx="11" fill={fr} />
        <rect x="17" y="18" width="30" height="28" rx="8" fill={sc} />
        <path d="M17 34V26a8 8 0 018-8h10z" fill={W} opacity="0.3" />
        <path d="M32 24v8l5 3" stroke={W} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      </>); break;
    case 'monitor':
      body = (<>
        <rect x="8" y="11" width="54" height="36" rx="5" fill={sd} />
        <rect x="5" y="8" width="54" height="36" rx="5" fill={fr} />
        <rect x="9" y="12" width="46" height="28" rx="2.5" fill={sc} />
        <path d="M9 32V14.5A2.5 2.5 0 0111.5 12H34z" fill={W} opacity="0.3" />
        <rect x="14" y="17" width="18" height="3.5" rx="1.7" fill={W} opacity="0.9" />
        <rect x="28" y="44" width="8" height="8" fill={em} />
        <rect x="17" y="52" width="30" height="6" rx="3" fill={lt} />
      </>); break;
    default:
      body = (<>
        <path d="M32 5l24 12-24 12L8 17z" fill={lt} />
        <path d="M8 17l24 12v29L8 46z" fill={em} />
        <path d="M56 17L32 29v29l24-12z" fill={fr} />
        <path d="M20 11l24 12" stroke="#6EE7B7" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
      </>);
  }
  return (
    <svg viewBox="0 0 64 64" style={style} className={`drop-shadow-[0_6px_5px_rgba(2,44,34,0.35)] ${className}`} aria-hidden="true">
      {body}
    </svg>
  );
});

/* Emerald illustration shown when a product image is missing / failed / too slow */
export const DeviceArt = memo(({ name, categoryName, darkMode }) => (
  <div
    className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden ${darkMode ? 'bg-gradient-to-br from-emerald-950 via-gray-900 to-emerald-950' : 'bg-gradient-to-br from-emerald-50 via-white to-emerald-100'}`}
    role="img" aria-label={`${name || 'Product'} – image unavailable`}
  >
    <div className={`absolute h-40 w-40 rounded-full blur-2xl ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-300/40'}`} />
    <div className={`absolute h-[78%] w-[78%] rounded-full border-2 border-dashed ${darkMode ? 'border-emerald-500/25' : 'border-emerald-300/70'}`} />
    <span className="anim-float absolute left-[16%] top-[20%] h-2 w-2 rotate-45 bg-emerald-400/80" />
    <span className="anim-float absolute bottom-[26%] right-[15%] h-1.5 w-1.5 rotate-45 bg-emerald-500/70" />
    <Glyph3D name={categoryName || name} className="anim-float relative h-1/2 w-1/2" />
    <div className="relative -mt-1 h-2 w-1/3 rounded-full bg-emerald-900/25 blur-[3px]" />
    <span className={`relative mt-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${darkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>Image unavailable</span>
  </div>
));

/* Small device cluster used for section illustrations */
export const DeviceScene = memo(({ className = 'w-40 h-32', compact = false }) => (
  <div className={`relative flex-shrink-0 ${className}`} aria-hidden="true">
    <div className="absolute inset-x-3 bottom-0 h-4 rounded-full bg-emerald-900/25 blur-md" />
    <Glyph3D name="laptop" className="absolute bottom-1 left-0 h-[78%] w-[62%]" />
    <Glyph3D name="phone" className="anim-float absolute right-[10%] top-0 h-[72%] w-[28%]" />
    {!compact && <Glyph3D name="watch" className="absolute bottom-0 right-0 h-[40%] w-[24%]" />}
    {!compact && <Glyph3D name="audio" className="anim-float absolute left-[34%] top-0 h-[34%] w-[24%]" />}
  </div>
));

/* 3D push button (button or link) */
export const Btn3D = memo(({ as: Tag = 'button', tone = 'em', darkMode, className = '', children, ...rest }) => {
  const tones = {
    em: 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white ring-1 ring-inset ring-white/30 shadow-[0_4px_0_0_#047857,0_10px_16px_-8px_rgba(5,150,105,0.6)] hover:from-emerald-300 hover:to-emerald-500 active:shadow-[0_1px_0_0_#047857]',
    rose: 'bg-rose-500 text-white shadow-[0_4px_0_0_#9f1239] hover:bg-rose-400 active:shadow-[0_1px_0_0_#9f1239]',
    soft: darkMode
      ? 'bg-gray-800 text-gray-200 border border-gray-700 shadow-[0_4px_0_0_#030712] hover:bg-gray-700 active:shadow-[0_1px_0_0_#030712]'
      : 'bg-white text-gray-700 border border-gray-200 shadow-[0_4px_0_0_#d1d5db] hover:bg-gray-50 active:shadow-[0_1px_0_0_#d1d5db]',
  };
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all duration-100 active:translate-y-[3px] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export const Chip3D = ({ tone = 'em', children, className = '' }) => {
  const bg = { em: 'from-emerald-300 to-emerald-600 shadow-[0_3px_0_0_#047857]', sky: 'from-sky-300 to-sky-600 shadow-[0_3px_0_0_#075985]', am: 'from-amber-300 to-amber-600 shadow-[0_3px_0_0_#92400e]', vi: 'from-violet-300 to-violet-600 shadow-[0_3px_0_0_#5b21b6]' }[tone];
  return <span className={`flex items-center justify-center rounded-xl bg-gradient-to-br text-white ${bg} ${className}`}><span className="drop-shadow-[0_2px_1px_rgba(0,0,0,0.35)]">{children}</span></span>;
};

/* ───────────── Trust strip ───────────── */
export const TrustStrip = memo(({ darkMode }) => {
  const items = [
    { icon: FiTruck, title: 'Fast delivery', text: 'Across Egypt' },
    { icon: FiShield, title: 'Warranty included', text: 'On every device' },
    { icon: FiRefreshCw, title: 'Easy returns', text: '14-day window' },
    { icon: FiHeadphones, title: 'Real support', text: 'Talk to a person' },
  ];
  return (
    <div className={`border-y ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 sm:px-6 md:grid-cols-4 lg:px-8">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3">
            <Chip3D className="h-10 w-10 flex-shrink-0"><Icon className="h-5 w-5" /></Chip3D>
            <div className="min-w-0">
              <p className={`truncate text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
              <p className={`truncate text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

/* ───────────── Product card (shared by Products + Homepage) ───────────── */
export const ProductCard = memo(({ product, darkMode, onAddToCart, onOpen, index = 0, layout = 'grid', addLabel = 'Add to cart' }) => {
  const src = safeImageUrl(product.imageUrl);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(!src);
  const [cartAdded, setCartAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  // Reset when the image changes; treat a very slow image as "not loaded".
  useEffect(() => {
    setImgLoaded(false);
    setImgError(!src);
    if (!src) return undefined;
    const t = setTimeout(() => setImgLoaded((ok) => { if (!ok) setImgError(true); return ok; }), 8000);
    return () => clearTimeout(t);
  }, [src]);

  const cond = conditionConfig[product.condition] || { badge: 'bg-gray-500', label: product.condition || 'Unknown' };
  const outOfStock = product.stock === 0;
  const isList = layout === 'list';
  const hasDiscount = product.discount > 0;
  const finalPrice = product.finalPrice ?? product.price;

  const handleCart = useCallback(async (e) => {
    e.stopPropagation();
    if (outOfStock || adding) return;
    setAdding(true);
    const ok = await onAddToCart(product);
    if (!mounted.current) return;
    setAdding(false);
    if (ok) { setCartAdded(true); setTimeout(() => mounted.current && setCartAdded(false), 1400); }
  }, [onAddToCart, product, outOfStock, adding]);

  const go = useCallback(() => {
    if (onOpen) onOpen(product);
    else window.location.assign(`/device/${encodeURIComponent(product.id)}`);
  }, [onOpen, product]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.025 }}
      onClick={go}
      onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) go(); }}
      tabIndex={0}
      aria-label={product.name}
      className={`group relative flex h-full cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${isList ? 'flex-row' : 'flex-col'} ${
        darkMode ? 'border-gray-700 bg-gray-800 hover:shadow-lg hover:shadow-black/30' : 'border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-200/70'
      }`}
    >
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        <span className={`rounded-md px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-[0_2px_0_0_rgba(0,0,0,0.25)] ${cond.badge}`}>{cond.label}</span>
        {hasDiscount && <span className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-extrabold text-white shadow-[0_2px_0_0_#9f1239]">-{product.discount}%</span>}
      </div>

      <div className={`relative aspect-square overflow-hidden ${isList ? 'w-40 flex-shrink-0 sm:w-52' : 'w-full'} ${darkMode ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
        {imgError ? (
          <DeviceArt name={product.name} categoryName={product.categoryName} darkMode={darkMode} />
        ) : (
          <>
            {!imgLoaded && <div className={`absolute inset-0 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} />}
            <img
              src={src}
              alt={product.name}
              width={400}
              height={400}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`h-full w-full object-contain p-4 transition-opacity duration-200 sm:p-5 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        <span className={`text-[11px] font-bold uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{product.categoryName || 'Uncategorized'}</span>
        <h3 className={`line-clamp-2 text-sm font-semibold leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
        <p className={`line-clamp-2 text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.description || 'No description available.'}</p>

        <div className={`mt-auto flex items-center justify-between gap-2 border-t pt-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex min-w-0 flex-col">
            <span className={`truncate text-lg font-extrabold tabular-nums tracking-tight ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{money(finalPrice)}</span>
            {hasDiscount && <span className={`text-xs tabular-nums line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{money(product.price)}</span>}
          </div>
          <Btn3D
            tone={cartAdded ? 'em' : 'soft'}
            darkMode={darkMode}
            onClick={handleCart}
            disabled={outOfStock || adding}
            aria-label={addLabel}
            className="h-10 w-10 flex-shrink-0"
          >
            {adding ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              : cartAdded ? <FiCheck className="h-4 w-4 drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]" />
              : <FiShoppingCart className={`h-4 w-4 drop-shadow-[0_2px_0_rgba(0,0,0,0.2)] ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />}
          </Btn3D>
        </div>
        {outOfStock && <p className="text-[11px] font-semibold text-rose-500">Out of stock</p>}
      </div>
    </motion.article>
  );
});