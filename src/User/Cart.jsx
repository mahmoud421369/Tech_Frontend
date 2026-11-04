import React, { useState, useEffect, useCallback, useMemo, useRef, useId, memo } from 'react';
import {
  FiShoppingCart, FiTruck, FiTrash2, FiChevronDown, FiCheck, FiMapPin, FiPackage, FiArrowLeft, FiLock, FiMaximize2, FiX, FiShield, FiMinus, FiPlus, FiZap, FiClock,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../common/api/api';
import queryClient from '../common/utils/queryClient';
import useAuthStore from '../common/store/Auth';
import { markImg, isImgOk, isImgBad } from '../common/utils/imageCache';
import { money } from '../components/user/Device3D';
import { safeImageUrl } from '../components/user/ListingKit';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import { resolveImageSrc } from '../common/utils/productutils';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';

export { queryClient };

const CART_TRANSLATIONS = { en: enTranslations.cart, ar: arTranslations.cart, fr: frTranslations.cart };
const getCartTranslation = (language, key) => CART_TRANSLATIONS[language]?.[key] || CART_TRANSLATIONS.en?.[key] || key;

const LOCAL_TEXT = {
  en: {
    previewImage: 'Preview image', closePreview: 'Close preview', confirmTitle: 'Confirm your order', confirmText: 'Please review your order before placing it.',
    confirmOrder: 'Confirm order', cancel: 'Cancel', deliverTo: 'Deliver to', itemsLabel: 'Items', paymentLabel: 'Payment',
    clearCart: 'Clear cart', secureCheckout: 'Secure checkout', each: 'each', shoppingCart: 'Shopping cart',
    fastDelivery: 'Fast delivery', estimatedDelivery: 'Estimated delivery', recommended: 'Recommended for you', viewProduct: 'View product',
  },
  ar: {
    previewImage: 'معاينة الصورة', closePreview: 'إغلاق المعاينة', confirmTitle: 'تأكيد طلبك', confirmText: 'يرجى مراجعة طلبك قبل إتمامه.',
    confirmOrder: 'تأكيد الطلب', cancel: 'إلغاء', deliverTo: 'التوصيل إلى', itemsLabel: 'المنتجات', paymentLabel: 'الدفع',
    clearCart: 'إفراغ السلة', secureCheckout: 'دفع آمن', each: 'للقطعة', shoppingCart: 'سلة التسوق',
    fastDelivery: 'توصيل سريع', estimatedDelivery: 'التوصيل المتوقع', recommended: 'مقترح لك', viewProduct: 'عرض المنتج',
  },
  fr: {
    previewImage: "Aperçu de l'image", closePreview: "Fermer l'aperçu", confirmTitle: 'Confirmer votre commande', confirmText: 'Vérifiez votre commande avant de la valider.',
    confirmOrder: 'Confirmer la commande', cancel: 'Annuler', deliverTo: 'Livrer à', itemsLabel: 'Articles', paymentLabel: 'Paiement',
    clearCart: 'Vider le panier', secureCheckout: 'Paiement sécurisé', each: 'l’unité', shoppingCart: 'Panier',
    fastDelivery: 'Livraison rapide', estimatedDelivery: 'Livraison estimée', recommended: 'Suggestions pour vous', viewProduct: 'Voir le produit',
  },
};
const localText = (language, key) => LOCAL_TEXT[language]?.[key] || LOCAL_TEXT.en[key];

const DATE_LOCALES = { en: 'en-GB', ar: 'ar-EG', fr: 'fr-FR' };
const DELIVERY_DAYS = 3;
const MAX_QTY = 99;
const MAX_PRODUCTS = 500;
const RECOMMENDED_COUNT = 4;
const EMPTY_LIST = [];
const EMPTY_OBJECT = {};
const STAGGER = Array.from({ length: 8 }, (_, i) => ({ '--i': i }));
const SKELETON_ROWS = [1, 2, 3];

const HL_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")`;

const CART_CSS = `
  @font-face{font-family:'Poppins Fallback';src:local('Arial'),local('Helvetica');size-adjust:112.6%;ascent-override:93.4%;descent-override:35.2%;line-gap-override:7.4%}
  .ct{--dx:1;--pg:#ffffff;--card:#ffffff;--txt:#052e1e;--mut:rgba(5,46,30,.68);--line:#e5e7eb;--bd:#000000;--shd:#000000;--soft:#f3f4f6;--acc:#059669;--ink:#000000;--sale:#c2410c;background:var(--pg);color:var(--txt);color-scheme:light;font-family:'Poppins','Poppins Fallback',ui-sans-serif,system-ui,-apple-system,'Segoe UI','Cairo',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
  .ct[dir=rtl]{--dx:-1}
  .ct-dark{--pg:#141414;--card:#1c1c1e;--txt:#ffffff;--mut:rgba(255,255,255,.66);--line:rgba(255,255,255,.16);--bd:rgba(255,255,255,.16);--shd:#0b4a35;--soft:#2a2a2e;--acc:#39ff88;--ink:#000000;--sale:#fdba74;color-scheme:dark}
  .ct[lang=ar]{font-family:'Cairo','Poppins',ui-sans-serif,system-ui,sans-serif}
  .ct[lang=ar] *{letter-spacing:0!important}
  .ct button,.ct input{font-family:inherit}
  .ct-hl{padding-bottom:.2em;background:${HL_URL} left bottom/100% .3em no-repeat;-webkit-box-decoration-break:clone;box-decoration-break:clone}
  .ct[dir=rtl] .ct-hl{background-position:right bottom}
  @keyframes ctFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes ctPop { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: none; } }
  @keyframes ctZoom { from { opacity: 0; transform: translateY(10px) scale(.96); } to { opacity: 1; transform: none; } }
  @keyframes ctRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes ctFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes ctTwinkle { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
  .ct-fade { animation: ctFade .14s ease-out both; }
  .ct-pop { animation: ctPop .12s ease-out both; transform-origin: top; }
  .ct-zoom { animation: ctZoom .2s cubic-bezier(.2,.8,.2,1) both; }
  .ct-rise { animation: ctRise .22s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i, 0) * 24ms); }
  .ct-float { animation: ctFloat 3.2s ease-in-out infinite; }
  .ct-float-2 { animation: ctFloat 4s ease-in-out .6s infinite; }
  .ct-twinkle { animation: ctTwinkle 2s ease-in-out infinite; }
  .ct-sb { scrollbar-width: thin; scrollbar-color: var(--acc) var(--soft); }
  @media (prefers-reduced-motion: reduce) {
    .ct-fade, .ct-pop, .ct-zoom, .ct-rise, .ct-float, .ct-float-2, .ct-twinkle { animation: none; }
  }
`;

let cartStylesInjected = false;
const injectCartStylesOnce = () => {
  if (cartStylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-cart-styles', 'true');
  tag.textContent = `${EXTRAS_CSS}${CART_CSS}`;
  document.head.appendChild(tag);
  cartStylesInjected = true;
};
injectCartStylesOnce();

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';
const SH = (n) => `[box-shadow:calc(var(--dx)*${n}px)_${n}px_0_0_var(--shd)]`;

const BTN =
  'inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-xl font-bold ' +
  'transition-[transform,background-color,border-color,box-shadow,opacity] duration-150 motion-reduce:transition-none active:translate-y-0.5 active:[box-shadow:none] ' +
  `disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
const BTN_ACCENT = `${BTN} border-[3px] border-black bg-[#39ff88] text-emerald-950 ${SH(3)} hover:bg-[#7dffb0]`;
const BTN_PLAIN = `${BTN} border-2 border-[color:var(--bd)] bg-[color:var(--card)] text-[color:var(--txt)] ${SH(2)} hover:bg-[color:var(--soft)]`;

const CARD = `rounded-2xl border-[3px] border-[color:var(--bd)] bg-[color:var(--card)] ${SH(4)}`;

const TILE = 'flex flex-shrink-0 items-center justify-center rounded-lg border-2 border-black bg-[#39ff88] text-emerald-950';

const cleanText = (v, max = 120) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
const round2 = (n) => Math.round(n * 100) / 100;
const toMoney = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 1e9) : 0;
};

const shouldRetry = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const showToast = (icon, title, timer = 2500) => toast({ icon, title: cleanText(title, 200), timer });

const friendlyError = (err, fallback) => {
  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const raw = cleanText(data.message, 200);
  const code = cleanText(data.error_code || data.code, 40);
  if (/cart is empty/i.test(raw)) return 'Your cart is empty. Add a product before placing an order.';
  if (/stock|insufficient|not enough/i.test(raw)) {
    return status && status < 500 ? raw : 'Not enough stock is available for the requested quantity. Please lower the quantity and try again.';
  }
  if (/address/i.test(raw)) return 'The selected delivery address could not be used. Please choose another address.';
  if (/order not found/i.test(raw) || status === 404) return 'We could not find this order. Please refresh and try again.';
  if (status === 403) return 'You are not allowed to perform this action.';
  if (status >= 500 || /RUNTIME_ERROR|RT_001/i.test(`${raw} ${code}`) || !raw) return fallback;
  return raw;
};

const cartKeyFor = (userId) => ['cartItems', userId ?? 'anon'];
const addrKeyFor = (userId) => ['addresses', userId ?? 'anon'];

const IMAGE_FIELDS = ['imageUrl', 'productImageUrl', 'productImage', 'image', 'thumbnailUrl', 'imagePath'];
const OLD_PRICE_FIELDS = ['originalPrice', 'oldPrice', 'compareAtPrice', 'listPrice'];
const ABSOLUTE_HTTP = /^https?:\/\//i;
const isSafeSrc = (v) => ABSOLUTE_HTTP.test(v) || (v.startsWith('/') && !v.startsWith('//'));

const toSafeSrc = (value) => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || raw.length > 2048 || raw.includes('..') || /[\u0000-\u001f]/.test(raw)) return null;
  const direct = safeImageUrl(raw);
  if (direct && isSafeSrc(String(direct))) return String(direct);
  const path = ABSOLUTE_HTTP.test(raw) || raw.startsWith('/') ? raw : `/${raw}`;
  const resolved = resolveImageSrc(path) || path;
  return isSafeSrc(String(resolved)) ? String(resolved) : null;
};

const pickImage = (item) => {
  const nested = item?.product || EMPTY_OBJECT;
  const arrays = [item?.imageUrls, nested.imageUrls].find(Array.isArray) || EMPTY_LIST;
  const candidates = [
    ...IMAGE_FIELDS.map((k) => item?.[k]),
    ...IMAGE_FIELDS.map((k) => nested[k]),
    ...arrays,
  ];
  for (const c of candidates) {
    const src = toSafeSrc(c);
    if (src) return src;
  }
  return null;
};

const pickOldPrice = (item) => {
  const nested = item?.product || EMPTY_OBJECT;
  for (const k of OLD_PRICE_FIELDS) {
    const v = toMoney(item?.[k] ?? nested[k]);
    if (v > 0) return v;
  }
  return 0;
};

const productIdOf = (item) => {
  const id = item?.productId ?? item?.product?.id;
  return id == null ? '' : String(id);
};

const normalizeCart = (items) =>
  (Array.isArray(items) ? items : [])
    .filter((i) => i && i.id != null)
    .map((i) => {
      const price = toMoney(i.productPrice ?? i.product?.price);
      const oldPrice = pickOldPrice(i);
      return {
        ...i,
        _img: pickImage(i),
        productName: cleanText(i.productName ?? i.product?.name, 160),
        productPrice: price,
        productOldPrice: oldPrice > price && price > 0 ? oldPrice : 0,
        quantity: Math.min(MAX_QTY, Math.max(1, Math.trunc(Number(i.quantity)) || 1)),
      };
    });

const normalizeAddresses = (list) =>
  (Array.isArray(list) ? list : [])
    .filter((a) => a && a.id != null)
    .map((a) => ({ ...a, street: cleanText(a.street, 120), city: cleanText(a.city, 60) }));

const fetchCart = async ({ signal }) => {
  const items = (await api.get('/api/cart', { signal })).data?.items;
  return Array.isArray(items) ? items : [];
};
const fetchAddresses = async ({ signal }) => {
  const content = (await api.get('/api/users/addresses', { signal })).data?.content;
  return Array.isArray(content) ? content : [];
};
const fetchProducts = async ({ signal }) => {
  const res = await api.get('/api/products', { signal });
  const list = res.data?.content || res.data || [];
  if (!Array.isArray(list)) return EMPTY_LIST;
  const out = [];
  for (const p of list) {
    if (out.length >= MAX_PRODUCTS) break;
    if (!p || p.id == null) continue;
    out.push({
      id: String(p.id),
      name: cleanText(p.name, 160),
      price: toMoney(p.price),
      img: toSafeSrc(p.imageUrl),
    });
  }
  return out;
};

export function prefetchCart(token) {
  const state = useAuthStore.getState();
  if (!(token || state.accessToken)) return;
  queryClient.prefetchQuery({ queryKey: cartKeyFor(state.userId), queryFn: fetchCart, staleTime: 15000 });
  queryClient.prefetchQuery({ queryKey: addrKeyFor(state.userId), queryFn: fetchAddresses, staleTime: 5 * 60 * 1000 });
}

const AMBER = '#fbbf24';
const ORANGE = '#fb923c';
const MINT = '#6ee7b7';
const EMERALD = '#10b981';

const ArtBackdrop = () => (
  <>
    <circle cx="130" cy="96" r="80" fill="none" stroke="var(--acc)" strokeWidth="2" strokeDasharray="5 6" opacity=".7" />
    <ellipse cx="130" cy="180" rx="84" ry="8" fill="var(--soft)" />
  </>
);
const Sparkle = ({ x, y, s = 6, className = '' }) => (
  <path className={className} d={`M${x} ${y - s}V${y + s}M${x - s} ${y}H${x + s}`} stroke="var(--acc)" strokeWidth="3" strokeLinecap="square" />
);
const Wrench = ({ x, y, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round">
    <rect x="-4" y="-2" width="8" height="34" fill={AMBER} />
    <circle cx="0" cy="-8" r="10" fill={AMBER} />
    <rect x="-3.5" y="-20" width="7" height="12" fill="var(--card)" stroke="none" />
    <circle cx="0" cy="30" r="3" fill="var(--card)" />
  </g>
);
const Bag = ({ x, y, w = 36, h = 42, fill }) => (
  <g stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round">
    <path d={`M${x + w * 0.3} ${y} v-8 a${w * 0.2} ${w * 0.2} 0 0 1 ${w * 0.4} 0 v8`} fill="none" />
    <rect x={x} y={y} width={w} height={h} fill={fill} />
    <rect x={x} y={y} width={w} height="6" fill="var(--card)" opacity=".35" stroke="none" />
  </g>
);
const Phone = ({ x, y, w = 32, h = 56, screen = 'var(--acc)' }) => (
  <g stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round">
    <rect x={x} y={y} width={w} height={h} rx="6" fill="var(--card)" />
    <rect x={x + 4} y={y + 7} width={w - 8} height={h - 16} rx="2" fill={screen} stroke="none" />
    <circle cx={x + w / 2} cy={y + h - 5} r="1.6" fill="var(--ink)" stroke="none" />
  </g>
);
const Laptop = ({ x, y }) => (
  <g stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round">
    <rect x={x} y={y} width="52" height="34" rx="3" fill="var(--card)" />
    <rect x={x + 5} y={y + 5} width="42" height="24" fill={MINT} stroke="none" />
    <path d={`M${x - 6} ${y + 34} H${x + 58} L${x + 54} ${y + 40} H${x - 2} Z`} fill={EMERALD} />
  </g>
);
const Gear = ({ x, y, r = 11, className = '' }) => (
  <g className={className}>
    <circle cx={x} cy={y} r={r} fill="none" stroke={EMERALD} strokeWidth="6" strokeDasharray="5 4.2" />
    <circle cx={x} cy={y} r={r - 3} fill={EMERALD} stroke="var(--ink)" strokeWidth="2.5" />
    <circle cx={x} cy={y} r="3.5" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" />
  </g>
);

const EmptyCartArt = memo(() => (
  <svg viewBox="0 0 260 200" className="h-44 w-60 sm:h-48 sm:w-64" role="img" aria-hidden="true" focusable="false">
    <ArtBackdrop />
    <Sparkle x={36} y={52} className="ct-twinkle" />
    <Sparkle x={228} y={120} s={5} className="ct-twinkle" />
    <circle cx="214" cy="46" r="4" fill={AMBER} className="ct-twinkle" />
    <circle cx="48" cy="150" r="3.5" fill={ORANGE} />

    <g className="ct-float-2"><Gear x={46} y={92} /></g>
    <g className="ct-float"><Wrench x={214} y={72} rot={35} /></g>

    <Phone x={112} y={44} />
    <Laptop x={150} y={52} />

    <g stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M62 58 H80 L94 134 H178" fill="none" />
      <path d="M84 82 H204 L192 128 H96 Z" fill="var(--card)" />
      <path d="M100 82 L106 128 M124 82 L128 128 M148 82 L150 128 M172 82 L172 128" stroke="var(--acc)" strokeWidth="2.5" fill="none" />
      <circle cx="108" cy="150" r="10" fill="#39ff88" />
      <circle cx="172" cy="150" r="10" fill="#39ff88" />
      <circle cx="108" cy="150" r="3" fill="var(--card)" strokeWidth="2" />
      <circle cx="172" cy="150" r="3" fill="var(--card)" strokeWidth="2" />
    </g>

    <Bag x={30} y={128} w={34} h={42} fill={EMERALD} />
    <Bag x={64} y={142} w={28} h={28} fill={AMBER} />
  </svg>
));

const SuccessArt = memo(() => (
  <svg viewBox="0 0 260 200" className="h-44 w-60 sm:h-48 sm:w-64" role="img" aria-hidden="true" focusable="false">
    <ArtBackdrop />
    <Sparkle x={34} y={60} className="ct-twinkle" />
    <Sparkle x={232} y={64} s={7} className="ct-twinkle" />
    <Sparkle x={216} y={146} s={5} className="ct-twinkle" />
    <circle cx="54" cy="34" r="4" fill={ORANGE} className="ct-twinkle" />
    <circle cx="196" cy="26" r="3.5" fill={MINT} className="ct-twinkle" />
    <rect x="26" y="108" width="7" height="7" fill={AMBER} transform="rotate(20 29 111)" />
    <rect x="236" y="100" width="7" height="7" fill={EMERALD} transform="rotate(-15 239 103)" />

    <g className="ct-float-2"><Gear x={50} y={96} r={10} /></g>
    <g className="ct-float"><Wrench x={216} y={92} rot={-30} /></g>

    <g stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round">
      <rect x="80" y="92" width="100" height="74" fill="var(--card)" />
      <rect x="72" y="76" width="116" height="20" fill="var(--soft)" />
      <rect x="120" y="76" width="20" height="90" fill={AMBER} />
      <path d="M130 76 C112 56 96 62 104 72 C110 80 126 76 130 76 Z M130 76 C148 56 164 62 156 72 C150 80 134 76 130 76 Z" fill={AMBER} strokeWidth="2.5" />
    </g>
    <Phone x={92} y={110} w={22} h={38} screen={MINT} />

    <g className="ct-float">
      <circle cx="176" cy="66" r="24" fill="#39ff88" stroke="var(--ink)" strokeWidth="3" />
      <path d="M164 66 L173 75 L189 57" fill="none" stroke="#022c22" strokeWidth="5" strokeLinecap="square" />
    </g>

    <Bag x={192} y={134} w={32} h={36} fill={ORANGE} />
    <Bag x={34} y={138} w={30} h={32} fill={EMERALD} />
  </svg>
));

const ART_COLORS = {
  light: { bd: ['#FFFFFF', '#D1D5DB'], sd: ['#34D399', '#047857'], sc: ['#6EE7B7', '#059669'] },
  dark: { bd: ['#4B4B4B', '#2C2C2C'], sd: ['#39FF88', '#17C964'], sc: ['#1F1F1F', '#0F0F0F'] },
};

const DEVICE_KINDS = [
  ['laptop', /laptop|notebook|macbook|computer|pc\b/i],
  ['tablet', /tablet|ipad|tab\b/i],
  ['watch', /watch|band|wearable/i],
  ['audio', /head|ear|airpod|speaker|audio|buds/i],
];
const kindOf = (text) => (DEVICE_KINDS.find(([, re]) => re.test(text)) || ['phone'])[0];

const ProductFallbackArt = memo(({ name, darkMode }) => {
  const p = useId().replace(/:/g, '');
  const c = ART_COLORS[darkMode ? 'dark' : 'light'];
  const kind = kindOf(String(name || ''));
  const body = `url(#${p}bd)`;
  const side = `url(#${p}sd)`;
  const screen = `url(#${p}sc)`;
  const neon = darkMode ? '#39FF88' : '#34D399';
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full p-2" role="img" aria-label={name || ''} focusable="false">
      <defs>
        <linearGradient id={`${p}bd`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.bd[0]} /><stop offset="1" stopColor={c.bd[1]} /></linearGradient>
        <linearGradient id={`${p}sd`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.sd[0]} /><stop offset="1" stopColor={c.sd[1]} /></linearGradient>
        <linearGradient id={`${p}sc`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.sc[0]} /><stop offset="1" stopColor={c.sc[1]} /></linearGradient>
      </defs>
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

const ProductThumb = memo(({ src, name, darkMode, large = false, ratio = 'aspect-[4/3]' }) => {
  const imgRef = useRef(null);
  const [failed, setFailed] = useState(() => isImgBad(src));
  const [loaded, setLoaded] = useState(() => isImgOk(src));

  useEffect(() => {
    setFailed(isImgBad(src));
    setLoaded(isImgOk(src));
  }, [src]);

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      markImg(src, 'ok');
      setLoaded(true);
    }
  }, [src, failed]);

  const handleError = useCallback(() => { markImg(src, 'bad'); setFailed(true); }, [src]);
  const handleLoad = useCallback(() => { markImg(src, 'ok'); setLoaded(true); }, [src]);
  const showImage = !!src && !failed;

  return (
    <div className={`relative w-full overflow-hidden bg-white [contain:layout_paint] ${ratio}`}>
      {showImage ? (
        <>
          {!loaded && <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-black/5 motion-reduce:animate-none" />}
          <img
            ref={imgRef}
            src={src}
            alt={name}
            width={large ? 800 : 400}
            height={large ? 600 : 300}
            loading={large ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={large ? 'high' : 'low'}
            referrerPolicy="no-referrer"
            onLoad={handleLoad}
            onError={handleError}
            className={`absolute inset-0 h-full w-full bg-white object-contain transition-[opacity,transform] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${large ? 'p-6' : 'p-2'} ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-[color:var(--soft)]">
          <ProductFallbackArt name={name} darkMode={false} />
        </div>
      )}
    </div>
  );
});

const IconTile = memo(({ Icon, className = 'h-10 w-10', iconClassName = 'h-5 w-5' }) => (
  <span aria-hidden="true" className={`${TILE} ${className}`}>
    <Icon className={iconClassName} />
  </span>
));

const SkeletonBlock = ({ className }) => (
  <div className={`animate-pulse rounded-xl bg-[color:var(--soft)] motion-reduce:animate-none ${className}`} />
);

const CartPageSkeleton = memo(({ withAside = true }) => (
  <div
    role="status"
    aria-busy="true"
    className={`grid items-start gap-6 ${withAside ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : ''}`}
  >
    <div className="space-y-3">
      {SKELETON_ROWS.map((i) => <SkeletonBlock key={i} className="h-[148px]" />)}
    </div>
    {withAside && (
      <div className="space-y-4">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-5 w-full" />
        <SkeletonBlock className="h-12 w-full" />
      </div>
    )}
  </div>
));

const StepIndicator = memo(({ current, t }) => {
  const steps = [
    { id: 'cart', Icon: FiShoppingCart, label: t('cart') },
    { id: 'checkout', Icon: FiMapPin, label: t('delivery') },
    { id: 'complete', Icon: FiCheck, label: t('done') },
  ];
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <ol className="flex select-none items-center" aria-label="Checkout progress">
      {steps.map((s, i) => {
        const reached = i <= idx;
        return (
          <React.Fragment key={s.id}>
            <li className="flex items-center gap-2" aria-current={i === idx ? 'step' : undefined}>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-extrabold transition-colors duration-150 motion-reduce:transition-none ${
                  reached ? 'border-black bg-[#39ff88] text-emerald-950' : 'border-[color:var(--bd)] bg-[color:var(--soft)] text-[color:var(--mut)]'
                }`}
              >
                {i < idx ? <FiCheck className="h-4 w-4" strokeWidth={3} /> : <s.Icon className="h-4 w-4" />}
              </span>
              <span className={`text-xs font-bold sm:text-sm ${reached ? '' : 'text-[color:var(--mut)]'}`}>{s.label}</span>
            </li>
            {i < steps.length - 1 && (
              <li aria-hidden="true" className="mx-2 h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--line)] sm:mx-4">
                <div className={`h-full rounded-full bg-[#39ff88] transition-[width] duration-200 ease-out motion-reduce:transition-none ${i < idx ? 'w-full' : 'w-0'}`} />
              </li>
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
});

const STEP_BTN = `${BTN} h-8 w-8 flex-shrink-0 !rounded-full text-[color:var(--txt)] hover:bg-[color:var(--soft)] active:!translate-y-0`;

const CartItem = memo(({ item, index, onUpdate, onRemove, onPreview, t, previewLabel, eachLabel, deliveryLabel, busy, darkMode }) => {
  const src = item._img;
  const qty = Number(item.quantity);
  const lineTotal = round2(item.productPrice * qty);
  const oldPrice = item.productOldPrice;
  const hasDiscount = oldPrice > item.productPrice && item.productPrice > 0;
  const discountPct = hasDiscount ? Math.round((1 - item.productPrice / oldPrice) * 100) : 0;
  const dec = useCallback(() => onUpdate(item.id, qty - 1), [onUpdate, item.id, qty]);
  const inc = useCallback(() => onUpdate(item.id, qty + 1), [onUpdate, item.id, qty]);
  const remove = useCallback(() => onRemove(item.id), [onRemove, item.id]);
  const preview = useCallback(() => onPreview(item.id), [onPreview, item.id]);
  return (
    <article
      aria-busy={busy}
      style={STAGGER[index % STAGGER.length]}
      className={`ct-rise flex gap-3 p-3 transition-opacity duration-150 sm:gap-5 sm:p-5 ${busy ? 'opacity-60' : ''}`}
    >
      <div className="flex w-24 flex-shrink-0 flex-col gap-2 sm:w-32">
        <button
          type="button"
          onClick={preview}
          aria-label={`${previewLabel}: ${item.productName}`}
          className={`group relative w-full cursor-zoom-in overflow-hidden rounded-xl border-2 border-[color:var(--bd)] bg-white ${FOCUS}`}
        >
          <ProductThumb src={src} name={item.productName} darkMode={darkMode} ratio="aspect-square" />
          <span
            aria-hidden="true"
            className="absolute bottom-1.5 end-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-[#39ff88] text-emerald-950 opacity-90 transition-opacity duration-150 motion-reduce:transition-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-visible:opacity-100"
          >
            <FiMaximize2 className="h-3.5 w-3.5" />
          </span>
        </button>
        <div className="inline-flex w-full items-center justify-between rounded-full border-2 border-[color:var(--bd)] bg-[color:var(--card)] p-0.5">
          <button type="button" className={STEP_BTN} disabled={busy} onClick={dec} aria-label={qty <= 1 ? t('removeItem') : t('decreaseQuantity')}>
            {qty <= 1 ? <FiTrash2 className="h-4 w-4 text-rose-500" aria-hidden="true" /> : <FiMinus className="h-4 w-4" aria-hidden="true" />}
          </button>
          <span className="min-w-6 text-center text-sm font-extrabold tabular-nums" aria-live="polite">{qty}</span>
          <button type="button" className={STEP_BTN} disabled={busy || qty >= MAX_QTY} onClick={inc} aria-label={t('increaseQuantity')}>
            <FiPlus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2 className="line-clamp-3 text-sm font-semibold leading-snug sm:text-base">{item.productName}</h2>
          <ul className="mt-auto space-y-1.5 text-xs font-medium text-[color:var(--mut)] sm:text-sm">
            {deliveryLabel && (
              <li className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[color:var(--soft)] px-2 py-1 font-bold text-[color:var(--txt)]">
                <FiClock className="h-4 w-4 flex-shrink-0 text-[color:var(--acc)]" aria-hidden="true" />
                <span className="truncate">{deliveryLabel}</span>
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <FiTruck className="h-4 w-4 flex-shrink-0 text-[color:var(--acc)]" aria-hidden="true" />
              <span className="truncate">{t('cashOnDelivery')}</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end justify-between gap-2">
          <div className="text-end">
            <p dir="ltr" className="text-base font-extrabold tabular-nums sm:text-xl">{money(lineTotal)}</p>
            {hasDiscount && (
              <p dir="ltr" className="mt-0.5 flex items-center justify-end gap-1.5 text-xs font-medium tabular-nums text-[color:var(--mut)]">
                <span className="line-through">{money(round2(oldPrice * qty))}</span>
                <span className="font-bold text-[color:var(--sale)]">-{discountPct}%</span>
              </p>
            )}
            {qty > 1 && (
              <p dir="ltr" className="mt-0.5 text-xs font-medium tabular-nums text-[color:var(--mut)]">
                {money(item.productPrice)} {eachLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            aria-label={`${t('removeItem')}: ${item.productName}`}
            className={`${BTN_PLAIN} h-9 w-9 text-rose-500 hover:text-rose-600`}
          >
            <FiTrash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
});

const RecommendedCard = memo(({ product, onOpen, darkMode, viewLabel }) => (
  <li className="min-w-0">
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${viewLabel}: ${product.name}`}
      className={`group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border-2 border-[color:var(--bd)] bg-[color:var(--card)] text-start ${SH(3)} transition-[transform,box-shadow] duration-150 hover:-translate-y-px active:translate-y-0.5 active:[box-shadow:none] motion-reduce:transition-none ${FOCUS}`}
    >
      <ProductThumb src={product.img} name={product.name} darkMode={darkMode} ratio="aspect-square" />
      <span className="flex flex-1 flex-col gap-1 p-3">
        <span className="line-clamp-2 text-xs font-semibold leading-snug sm:text-sm">{product.name}</span>
        <span dir="ltr" className="mt-auto text-sm font-extrabold tabular-nums">{money(product.price)}</span>
      </span>
    </button>
  </li>
));

const Recommended = memo(({ products, onOpen, darkMode, title, viewLabel }) => (
  <section aria-label={title} className={`p-4 sm:p-5 ${CARD}`}>
    <h2 className="mb-4 text-lg font-extrabold sm:text-xl"><span className="ct-hl">{title}</span></h2>
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {products.map((p) => (
        <RecommendedCard key={p.id} product={p} onOpen={onOpen} darkMode={darkMode} viewLabel={viewLabel} />
      ))}
    </ul>
  </section>
));

const ImagePreview = memo(({ item, darkMode, onClose, closeLabel }) => {
  const closeRef = useRef(null);
  const src = item._img;

  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'Tab') { e.preventDefault(); closeRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus({ preventScroll: true });
    };
  }, [onClose]);

  const stop = useCallback((e) => e.stopPropagation(), []);

  return (
    <div className="ct-fade fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.productName}
        onClick={stop}
        className={`ct-zoom w-full max-w-lg overflow-hidden ${CARD}`}
      >
        <div className="flex items-start justify-between gap-3 bg-[#39ff88] p-4 text-emerald-950">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">{item.productName}</h2>
            <p dir="ltr" className="mt-0.5 text-sm font-extrabold tabular-nums">{money(item.productPrice)}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={closeLabel} className={`${BTN_PLAIN} h-10 w-10 flex-shrink-0 !rounded-full !bg-white !text-emerald-950`}>
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="border-t-[3px] border-black">
          <ProductThumb src={src} name={item.productName} darkMode={darkMode} large />
        </div>
      </div>
    </div>
  );
});

const ConfirmOrder = ({ address, count, total, processing, onConfirm, onCancel, labels, t }) => {
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);
  const processingRef = useRef(processing);
  const titleId = useId();
  const descId = useId();
  processingRef.current = processing;

  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    confirmRef.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!processingRef.current) onCancel();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = dialogRef.current?.querySelectorAll('button:not([disabled])');
      if (!nodes || !nodes.length) { e.preventDefault(); return; }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus({ preventScroll: true });
    };
  }, [onCancel]);

  const stop = useCallback((e) => e.stopPropagation(), []);
  const backdrop = useCallback(() => { if (!processingRef.current) onCancel(); }, [onCancel]);

  const rows = [
    [FiMapPin, labels.deliverTo, address],
    [FiPackage, labels.itemsLabel, String(count)],
    [FiTruck, labels.paymentLabel, t('cashOnDelivery')],
  ];

  return (
    <div className="ct-fade fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4" onClick={backdrop}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={stop}
        className={`ct-zoom w-full max-w-md p-5 sm:p-6 ${CARD}`}
      >
        <div className="flex items-center gap-3">
          <IconTile Icon={FiCheck} className="h-10 w-10 !rounded-full" />
          <h2 id={titleId} className="text-lg font-extrabold leading-tight sm:text-xl">{labels.confirmTitle}</h2>
        </div>
        <p id={descId} className="mt-3 text-sm font-medium text-[color:var(--mut)]">{labels.confirmText}</p>

        <dl className="mt-4 space-y-3 text-sm font-medium">
          {rows.map(([Icon, label, value]) => (
            <div key={label} className="flex items-start gap-3">
              <IconTile Icon={Icon} className="h-8 w-8 !rounded-full" iconClassName="h-4 w-4" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs font-bold text-[color:var(--mut)]">{label}</dt>
                <dd className="break-words font-bold">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex items-center justify-between border-t-2 border-[color:var(--line)] pt-3">
          <span className="text-sm font-bold">{t('total')}</span>
          <span dir="ltr" className="text-xl font-extrabold tabular-nums">{money(total)}</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} disabled={processing} className={`${BTN_PLAIN} min-h-12 py-3 text-sm`}>{labels.cancel}</button>
          <button ref={confirmRef} type="button" onClick={onConfirm} disabled={processing} className={`${BTN_ACCENT} min-h-12 py-3 text-sm`}>
            {processing
              ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" /> {t('processing')}</>
              : <><FiCheck className="h-5 w-5" aria-hidden="true" /> {labels.confirmOrder}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ Icon, children }) => (
  <h2 className="mb-3 flex items-center gap-2.5 text-base font-extrabold">
    <IconTile Icon={Icon} className="h-8 w-8" iconClassName="h-4 w-4" />
    <span>{children}</span>
  </h2>
);

const Summary = memo(({ step, total, originalTotal, units, itemCount, canOrder, processing, onCheckout, onOrder, t, secureLabel }) => {
  const isCart = step === 'cart';
  const hasSavings = originalTotal > total;
  return (
    <aside aria-label={t('orderSummary')} className={`p-4 sm:p-5 lg:sticky lg:top-32 ${CARD}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">{t('orderSummary')}</h2>
        <span className="rounded-full bg-[color:var(--soft)] px-2.5 py-0.5 text-xs font-bold text-[color:var(--mut)]">
          <span dir="ltr">{itemCount}</span> {itemCount !== 1 ? t('items') : t('item')}
        </span>
      </div>
      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="font-medium text-[color:var(--mut)]">{t('subtotal')} (<span dir="ltr">{units}</span>)</dt>
          <dd dir="ltr" className="flex items-center gap-2 font-bold tabular-nums">
            {hasSavings && <span className="text-xs font-medium text-[color:var(--mut)] line-through">{money(originalTotal)}</span>}
            <span>{money(total)}</span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-[color:var(--line)] pb-3">
          <dt className="font-medium text-[color:var(--mut)]">{t('delivery')}</dt>
          <dd className="text-end text-xs font-bold text-[color:var(--acc)]">{t('deliveryFees')}</dd>
        </div>
      </dl>
      <div className="my-4 flex items-center justify-between">
        <span className="text-base font-extrabold">{t('total')}</span>
        <span dir="ltr" className="text-2xl font-extrabold tabular-nums">{money(total)}</span>
      </div>
      {isCart ? (
        <button type="button" onClick={onCheckout} className={`${BTN_ACCENT} min-h-12 w-full py-3.5 text-sm`}>
          <FiTruck className="h-4 w-4" aria-hidden="true" /> {t('checkout')}
        </button>
      ) : (
        <button type="button" onClick={onOrder} disabled={!canOrder} className={`${BTN_ACCENT} min-h-12 w-full py-3.5 text-sm`}>
          {processing
            ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" /> {t('processing')}</>
            : <><FiCheck className="h-5 w-5" aria-hidden="true" /> {t('placeOrder')}</>}
        </button>
      )}
      <ul className="mt-4 space-y-2 border-t-2 border-[color:var(--line)] pt-4 text-xs font-medium text-[color:var(--mut)]">
        <li className="flex items-center gap-2"><FiShield className="h-4 w-4 flex-shrink-0 text-[color:var(--acc)]" aria-hidden="true" />{secureLabel}</li>
        <li className="flex items-center gap-2"><FiTruck className="h-4 w-4 flex-shrink-0 text-[color:var(--acc)]" aria-hidden="true" />{t('cashOnDelivery')} · {t('payOnReceive')}</li>
      </ul>
    </aside>
  );
});

function CartContent({ darkMode }) {
  const language = useAppLanguage();
  const dir = languageDirection(language);
  const t = useCallback((key) => getCartTranslation(language, key), [language]);
  const previewLabel = localText(language, 'previewImage');
  const closeLabel = localText(language, 'closePreview');
  const clearLabel = localText(language, 'clearCart');
  const secureLabel = localText(language, 'secureCheckout');
  const eachLabel = localText(language, 'each');
  const navigate = useNavigate();
  const qc = useQueryClient();

  const token = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.userId);
  const isAuthenticated = !!token;
  const cartKey = useMemo(() => cartKeyFor(userId), [userId]);
  const addrKey = useMemo(() => addrKeyFor(userId), [userId]);

  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submittingRef = useRef(false);
  const qtyQueueRef = useRef(Promise.resolve());
  const dropRef = useRef(null);
  const inflightRef = useRef(new Set());
  const [busyIds, setBusyIds] = useState(EMPTY_LIST);
  const lock = useCallback((id) => {
    if (inflightRef.current.has(id)) return false;
    inflightRef.current.add(id);
    setBusyIds((a) => [...a, id]);
    return true;
  }, []);
  const unlock = useCallback((id) => {
    inflightRef.current.delete(id);
    setBusyIds((a) => a.filter((x) => x !== id));
  }, []);

  const prevUserRef = useRef(userId);
  useEffect(() => {
    const prev = prevUserRef.current;
    prevUserRef.current = userId;
    if (prev == null || prev === userId) return;
    setCheckoutStep('cart');
    setOrderId(null);
    setSelectedAddress('');
    setShowDropdown(false);
    setPreviewId(null);
    setConfirmOpen(false);
    submittingRef.current = false;
    setIsProcessing(false);
    inflightRef.current.clear();
    setBusyIds(EMPTY_LIST);
  }, [userId]);

  const { data: rawCart = EMPTY_LIST, isLoading: isCartLoading } = useQuery({
    queryKey: cartKey,
    queryFn: fetchCart,
    select: normalizeCart,
    enabled: isAuthenticated,
    staleTime: 15000,
    retry: shouldRetry,
    refetchOnWindowFocus: false,
  });
  const { data: addresses = EMPTY_LIST, isLoading: isAddressLoading } = useQuery({
    queryKey: addrKey,
    queryFn: fetchAddresses,
    select: normalizeAddresses,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
    refetchOnWindowFocus: false,
  });

  const needsImages = useMemo(() => rawCart.some((i) => !i._img), [rawCart]);
  const wantsProducts = isAuthenticated && rawCart.length > 0 && (needsImages || checkoutStep === 'cart');
  const { data: products = EMPTY_LIST } = useQuery({
    queryKey: ['cartProducts'],
    queryFn: fetchProducts,
    enabled: wantsProducts,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const imageMap = useMemo(() => {
    if (!needsImages) return EMPTY_OBJECT;
    const map = {};
    for (const p of products) if (p.img) map[p.id] = p.img;
    return map;
  }, [needsImages, products]);

  const cartItems = useMemo(() => {
    if (!needsImages) return rawCart;
    return rawCart.map((i) => (i._img ? i : { ...i, _img: imageMap[productIdOf(i)] || null }));
  }, [rawCart, needsImages, imageMap]);

  const recommended = useMemo(() => {
    if (!products.length) return EMPTY_LIST;
    const inCart = new Set(rawCart.map(productIdOf));
    const out = [];
    for (const p of products) {
      if (out.length >= RECOMMENDED_COUNT) break;
      if (!p.name || p.price <= 0 || inCart.has(p.id)) continue;
      out.push(p);
    }
    return out;
  }, [products, rawCart]);

  const deliveryLabel = useMemo(() => {
    try {
      const date = new Date();
      date.setDate(date.getDate() + DELIVERY_DAYS);
      const text = new Intl.DateTimeFormat(DATE_LOCALES[language] || DATE_LOCALES.en, { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
      return `${localText(language, 'estimatedDelivery')}: ${text}`;
    } catch {
      return '';
    }
  }, [language]);

  useEffect(() => {
    if (!addresses.length) return;
    if (!addresses.some((a) => a.id === selectedAddress)) setSelectedAddress(addresses[0].id);
  }, [addresses, selectedAddress]);

  useEffect(() => {
    if (checkoutStep === 'checkout' && !isCartLoading && cartItems.length === 0) setCheckoutStep('cart');
  }, [checkoutStep, isCartLoading, cartItems.length]);

  useEffect(() => { window.scrollTo(0, 0); setPreviewId(null); setConfirmOpen(false); }, [checkoutStep]);

  const previewItem = useMemo(
    () => (previewId == null ? null : cartItems.find((i) => i.id === previewId) || null),
    [cartItems, previewId],
  );

  const cartTotal = useMemo(
    () => round2(cartItems.reduce((sum, i) => sum + i.productPrice * i.quantity, 0)),
    [cartItems],
  );
  const originalTotal = useMemo(
    () => round2(cartItems.reduce((sum, i) => sum + (i.productOldPrice || i.productPrice) * i.quantity, 0)),
    [cartItems],
  );
  const totalUnits = useMemo(() => cartItems.reduce((sum, i) => sum + i.quantity, 0), [cartItems]);

  useEffect(() => {
    if (!showDropdown) return undefined;
    const onDown = (e) => { if (!dropRef.current?.contains(e.target)) setShowDropdown(false); };
    const onKey = (e) => { if (e.key === 'Escape') setShowDropdown(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [showDropdown]);

  const rollback = (ctx) => { if (ctx?.previousCart) qc.setQueryData(cartKey, ctx.previousCart); };
  const optimistic = (updater) => async (arg) => {
    await qc.cancelQueries({ queryKey: cartKey });
    const previousCart = qc.getQueryData(cartKey);
    qc.setQueryData(cartKey, (old) => updater(Array.isArray(old) ? old : [], arg));
    return { previousCart };
  };
  const settle = () => qc.invalidateQueries({ queryKey: cartKey });

  const updateQuantityMut = useMutation({
    mutationFn: ({ itemId, qty }) => {
      const run = qtyQueueRef.current.catch(() => {}).then(() => api.put(`/api/cart/items/${encodeURIComponent(itemId)}`, { quantity: qty }));
      qtyQueueRef.current = run;
      return run;
    },
    onMutate: optimistic((old, { itemId, qty }) => old.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i))),
    onError: (e, v, ctx) => { rollback(ctx); showToast('error', friendlyError(e, "We couldn't update the quantity. Your previous quantity was kept."), 4000); },
    onSettled: (d, e, v) => { unlock(v.itemId); return settle(); },
  });
  const removeMut = useMutation({
    mutationFn: (itemId) => api.delete(`/api/cart/items/${encodeURIComponent(itemId)}`),
    onMutate: optimistic((old, itemId) => old.filter((i) => i.id !== itemId)),
    onError: (e, v, ctx) => { rollback(ctx); showToast('error', friendlyError(e, "We couldn't remove this item. Please try again."), 3500); },
    onSettled: (d, e, itemId) => { unlock(itemId); return settle(); },
  });
  const clearMut = useMutation({
    mutationFn: () => api.delete('/api/cart'),
    onMutate: optimistic(() => []),
    onError: (e, v, ctx) => { rollback(ctx); showToast('error', friendlyError(e, "We couldn't clear your cart. Please try again."), 3500); },
    onSettled: settle,
  });

  const { mutate: removeItem } = removeMut;
  const { mutate: updateItemQty } = updateQuantityMut;
  const { mutate: clearAll, isPending: isClearing } = clearMut;

  const updateQuantity = useCallback((itemId, qty) => {
    const n = Math.trunc(Number(qty));
    if (!Number.isFinite(n)) return;
    if (n > MAX_QTY) { showToast('warning', `You can order up to ${MAX_QTY} units of an item.`, 3000); return; }
    const found = (qc.getQueryData(cartKey) || []).find((i) => i.id === itemId);
    const max = Number(found?.stock ?? found?.availableStock ?? found?.productStock);
    if (Number.isFinite(max) && n > max) { showToast('warning', `Only ${max} left in stock.`, 3000); return; }
    if (!lock(itemId)) return;
    if (n < 1) removeItem(itemId); else updateItemQty({ itemId, qty: n });
  }, [removeItem, updateItemQty, lock, qc, cartKey]);
  const removeFromCart = useCallback((id) => { if (lock(id)) removeItem(id); }, [removeItem, lock]);
  const clearCart = useCallback(() => { if (!isClearing) clearAll(); }, [clearAll, isClearing]);
  const openPreview = useCallback((id) => setPreviewId(id), []);
  const closePreview = useCallback(() => setPreviewId(null), []);
  const closeConfirm = useCallback(() => setConfirmOpen(false), []);

  const createOrder = useCallback(async () => {
    if (!isAuthenticated) {
      setConfirmOpen(false);
      showToast('info', t('loginRequired'), 2500);
      navigate('/login');
      return;
    }
    if (!selectedAddress || !addresses.some((a) => a.id === selectedAddress)) { setConfirmOpen(false); showToast('warning', t('selectAddressAlert'), 3000); return; }
    if (cartItems.length === 0) { setConfirmOpen(false); showToast('warning', 'Your cart is empty. Add a product before placing an order.', 3000); return; }
    if (!Number.isFinite(cartTotal) || cartTotal <= 0) { setConfirmOpen(false); showToast('warning', 'Your order total must be greater than zero.', 3500); return; }
    if (submittingRef.current) return;
    submittingRef.current = true;

    setIsProcessing(true);
    try {
      const res = await api.post('/api/users/orders', { deliveryAddressId: selectedAddress, paymentMethod: 'CASH' });
      setOrderId(res.data?.id ?? null);
      qc.setQueryData(cartKey, []);
      window.dispatchEvent(new Event('cart:updated'));
      setCheckoutStep('complete');
    } catch (err) {
      showToast('error', friendlyError(err, t('orderFailed')), 4000);
    } finally {
      submittingRef.current = false;
      setIsProcessing(false);
      setConfirmOpen(false);
    }
  }, [isAuthenticated, selectedAddress, cartItems.length, cartTotal, addresses, navigate, qc, cartKey, t]);

  const selectedAddr = useMemo(() => addresses.find((a) => a.id === selectedAddress), [addresses, selectedAddress]);
  const toggleDropdown = useCallback(() => setShowDropdown((v) => !v), []);
  const pickAddress = useCallback((id) => { setSelectedAddress(id); setShowDropdown(false); }, []);
  const goCheckout = useCallback(() => setCheckoutStep('checkout'), []);
  const backToCart = useCallback(() => { setShowDropdown(false); setCheckoutStep('cart'); }, []);
  const goShopping = useCallback(() => navigate('/devices'), [navigate]);
  const goLogin = useCallback(() => navigate('/login'), [navigate]);

  const loading = isAuthenticated && checkoutStep !== 'complete' && (isCartLoading || (checkoutStep === 'checkout' && isAddressLoading));
  const headIcon = checkoutStep === 'cart' ? FiShoppingCart : checkoutStep === 'checkout' ? FiTruck : FiCheck;
  const canOrder = !!selectedAddress && cartItems.length > 0 && cartTotal > 0 && !isProcessing;
  const requestOrder = useCallback(() => { if (canOrder) setConfirmOpen(true); }, [canOrder]);
  const confirmLabels = useMemo(() => ({
    confirmTitle: localText(language, 'confirmTitle'),
    confirmText: localText(language, 'confirmText'),
    confirmOrder: localText(language, 'confirmOrder'),
    cancel: localText(language, 'cancel'),
    deliverTo: localText(language, 'deliverTo'),
    itemsLabel: localText(language, 'itemsLabel'),
    paymentLabel: localText(language, 'paymentLabel'),
  }), [language]);
  const showSteps = cartItems.length > 0 || checkoutStep === 'complete';
  const showAside = !loading && ((checkoutStep === 'cart' && cartItems.length > 0) || checkoutStep === 'checkout');
  const showPromo = !loading && checkoutStep === 'cart' && cartItems.length > 0;
  const title = checkoutStep === 'cart' ? t('yourCart') : checkoutStep === 'checkout' ? t('checkout') : t('orderConfirmed');
  const subtitle = checkoutStep === 'cart'
    ? `${cartItems.length} ${cartItems.length !== 1 ? t('items') : t('item')}`
    : checkoutStep === 'checkout' ? t('almostThere') : t('thankYou');
  const shell = `ct ${darkMode ? 'ct-dark' : ''} min-h-screen px-4 pb-28 pt-36 sm:px-6 md:pb-14 md:pt-32`;

  if (!isAuthenticated) {
    return (
      <main dir={dir} lang={language} className={shell}>
        <Toaster darkMode={darkMode} />
        <div className={`mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center ${CARD}`}>
          <IconTile Icon={FiLock} className="h-14 w-14 !rounded-full" iconClassName="h-6 w-6" />
          <h1 className="text-2xl font-extrabold tracking-tight rtl:tracking-normal"><span className="ct-hl">{t('loginRequired')}</span></h1>
          <button type="button" onClick={goLogin} className={`${BTN_ACCENT} min-h-12 w-full py-3.5 text-sm`}>{t('goToLogin')}</button>
        </div>
      </main>
    );
  }

  return (
    <main dir={dir} lang={language} className={shell} aria-busy={loading}>
      <Toaster darkMode={darkMode} />
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center gap-3">
          <IconTile Icon={headIcon} className="h-11 w-11 !rounded-full" iconClassName="h-5 w-5" />
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight rtl:tracking-normal sm:text-3xl"><span className="ct-hl">{title}</span></h1>
            <p className="mt-1 text-sm font-medium text-[color:var(--mut)]">{subtitle}</p>
          </div>
        </header>

        {showSteps && !loading && (
          <section aria-label="Checkout progress" className={`mb-6 max-w-xl px-4 py-3 ${CARD}`}>
            <StepIndicator current={checkoutStep} t={t} />
          </section>
        )}

        {showPromo && (
          <div className={`mb-6 flex items-center gap-3 rounded-2xl border-[3px] border-black bg-[#39ff88] px-4 py-3 text-emerald-950 sm:px-5 sm:py-4 ${SH(4)}`}>
            <FiTruck className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-sm font-extrabold sm:text-base">{t('cashOnDelivery')}</p>
            <p className="hidden text-xs font-semibold opacity-80 sm:block sm:text-sm">{t('payOnReceive')}</p>
          </div>
        )}

        {loading ? <CartPageSkeleton withAside={checkoutStep !== 'complete'} /> : (
          <div key={checkoutStep} className={`ct-rise grid items-start gap-6 ${showAside ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : ''}`}>
            <div className="min-w-0 space-y-6">
              {checkoutStep === 'cart' && (
                cartItems.length === 0 ? (
                  <div className={`flex flex-col items-center gap-3 px-4 py-10 text-center ${CARD}`}>
                    <EmptyCartArt />
                    <p className="text-lg font-extrabold">{t('empty')}</p>
                    <p className="text-sm font-medium text-[color:var(--mut)]">{t('addProducts')}</p>
                    <button type="button" onClick={goShopping} className={`${BTN_ACCENT} mt-2 min-h-11 px-6 py-3 text-sm`}>{t('browseDevices')}</button>
                  </div>
                ) : (
                  <>
                    <section aria-label={localText(language, 'shoppingCart')} className={`overflow-hidden ${CARD}`}>
                      <div className="flex items-center justify-between gap-3 border-b-[3px] border-black bg-[#39ff88] px-4 py-3 text-emerald-950 sm:px-5">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-extrabold text-emerald-950 sm:text-sm">
                            <FiZap className="h-4 w-4" aria-hidden="true" />
                            {localText(language, 'fastDelivery')}
                          </span>
                          <h2 className="truncate text-sm font-extrabold sm:text-base">
                            {localText(language, 'shoppingCart')} <span dir="ltr" className="text-xs font-bold text-emerald-950/70 sm:text-sm">({totalUnits})</span>
                          </h2>
                        </div>
                        <button type="button" onClick={clearCart} disabled={isClearing} className={`inline-flex min-h-9 flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border-2 border-black bg-white px-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}>
                          <FiTrash2 className="h-4 w-4" aria-hidden="true" />{clearLabel}
                        </button>
                      </div>
                      <div className="divide-y-2 divide-[color:var(--line)]">
                        {cartItems.map((item, i) => (
                          <CartItem
                            key={item.id}
                            item={item}
                            index={i}
                            onUpdate={updateQuantity}
                            onRemove={removeFromCart}
                            onPreview={openPreview}
                            t={t}
                            previewLabel={previewLabel}
                            eachLabel={eachLabel}
                            deliveryLabel={deliveryLabel}
                            busy={busyIds.includes(item.id)}
                            darkMode={darkMode}
                          />
                        ))}
                      </div>
                    </section>

                    {recommended.length > 0 && (
                      <Recommended
                        products={recommended}
                        onOpen={goShopping}
                        darkMode={darkMode}
                        title={localText(language, 'recommended')}
                        viewLabel={localText(language, 'viewProduct')}
                      />
                    )}
                  </>
                )
              )}

              {checkoutStep === 'checkout' && (
                <div className="space-y-6">
                  <button type="button" onClick={backToCart} className={`${BTN_PLAIN} min-h-11 px-4 py-2 text-xs`}>
                    <FiArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /> {t('backToCart')}
                  </button>

                  <section className={`p-4 sm:p-5 ${CARD}`}>
                    <SectionTitle Icon={FiMapPin}>{t('deliveryAddress')}</SectionTitle>
                    <div ref={dropRef} className="relative">
                      <button
                        type="button"
                        onClick={toggleDropdown}
                        aria-expanded={showDropdown}
                        aria-haspopup="listbox"
                        className={`${BTN_PLAIN} min-h-12 w-full justify-between px-4 py-3 text-start text-sm`}
                      >
                        <span className="me-2 flex-1 truncate">{selectedAddr ? `${selectedAddr.street}, ${selectedAddr.city}` : t('selectAddress')}</span>
                        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${showDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showDropdown && (
                        <ul
                          role="listbox"
                          className={`ct-pop ct-sb absolute z-20 mt-3 max-h-52 w-full overflow-y-auto overscroll-contain rounded-2xl p-1 ${CARD}`}
                        >
                          {addresses.length > 0 ? addresses.map((addr) => {
                            const active = selectedAddress === addr.id;
                            return (
                              <li
                                key={addr.id}
                                role="option"
                                aria-selected={active}
                                tabIndex={0}
                                onClick={() => pickAddress(addr.id)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickAddress(addr.id); } }}
                                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold outline-none transition-colors duration-100 ${
                                  active ? 'bg-[#39ff88] font-extrabold text-emerald-950' : 'hover:bg-[color:var(--soft)] focus-visible:bg-[color:var(--soft)]'
                                }`}
                              >
                                <span className="me-2 flex-1 truncate">{addr.street}, {addr.city}</span>
                                {active && <FiCheck aria-hidden="true" className="h-4 w-4 flex-shrink-0" strokeWidth={3} />}
                              </li>
                            );
                          }) : <li className="px-4 py-6 text-center text-sm font-medium text-[color:var(--mut)]">{t('noAddresses')}</li>}
                        </ul>
                      )}
                    </div>
                  </section>

                  <section className={`p-4 sm:p-5 ${CARD}`}>
                    <SectionTitle Icon={FiPackage}>{t('orderSummary')}</SectionTitle>
                    <div className="divide-y-2 divide-[color:var(--line)] text-sm font-medium">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                          <div className="w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 border-[color:var(--bd)]">
                            <ProductThumb src={item._img} name={item.productName} darkMode={darkMode} ratio="aspect-square" />
                          </div>
                          <span className="min-w-0 flex-1 truncate">{item.productName} <span dir="ltr" className="text-[color:var(--mut)]">×{item.quantity}</span></span>
                          <span dir="ltr" className="flex-shrink-0 font-extrabold tabular-nums">{money(round2(item.productPrice * item.quantity))}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {checkoutStep === 'complete' && (
                <div className={`mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-8 text-center ${CARD}`}>
                  <SuccessArt />
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight rtl:tracking-normal"><span className="ct-hl">{t('orderConfirmed')}</span></h2>
                    <p className="mt-3 text-sm font-medium text-[color:var(--mut)]">{t('orderConfirmedMessage')}</p>
                  </div>
                  {orderId != null && <p className="text-sm font-extrabold tabular-nums" dir="ltr">#{cleanText(orderId, 8)}</p>}
                  <p className="w-full rounded-xl bg-[color:var(--soft)] p-4 text-sm font-medium">{t('orderPreparing')}</p>
                  <button type="button" onClick={goShopping} className={`${BTN_ACCENT} min-h-12 w-full py-3.5 text-sm`}>{t('continueShopping')}</button>
                </div>
              )}
            </div>

            {showAside && (
              <Summary
                step={checkoutStep}
                total={cartTotal}
                originalTotal={originalTotal}
                units={totalUnits}
                itemCount={cartItems.length}
                canOrder={canOrder}
                processing={isProcessing}
                onCheckout={goCheckout}
                onOrder={requestOrder}
                t={t}
                secureLabel={secureLabel}
              />
            )}
          </div>
        )}
      </div>

      {previewItem && (
        <ImagePreview item={previewItem} darkMode={darkMode} onClose={closePreview} closeLabel={closeLabel} />
      )}
      {confirmOpen && selectedAddr && (
        <ConfirmOrder
          address={`${selectedAddr.street}, ${selectedAddr.city}`}
          count={totalUnits}
          total={cartTotal}
          processing={isProcessing}
          onConfirm={createOrder}
          onCancel={closeConfirm}
          labels={confirmLabels}
          t={t}
        />
      )}
    </main>
  );
}

const CartContentMemo = memo(CartContent);

export default function Cart(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <CartContentMemo darkMode={!!props.darkMode} />
    </QueryClientProvider>
  );
}