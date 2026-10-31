import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  FiX, FiShoppingCart, FiTruck, FiTrash2, FiChevronDown, FiCheck, FiMapPin, FiPackage, FiArrowLeft,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../common/api/api';
import queryClient from '../common/utils/queryClient';
import useAuthStore from '../common/store/Auth';
import { safeImageUrl, money } from '../components/user/Device3D';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';

export { queryClient };

const loadSwal = () => import('sweetalert2').then((m) => m.default);
const CART_TRANSLATIONS = { en: enTranslations.cart, ar: arTranslations.cart, fr: frTranslations.cart };
const getCartTranslation = (language, key) => CART_TRANSLATIONS[language]?.[key] || CART_TRANSLATIONS.en?.[key] || key;

const ITEM_IMG_W = 96;
const ITEM_IMG_H = 64;
const CLOSE_DELAY_MS = 260;
const EMPTY_LIST = [];
const STAGGER = Array.from({ length: 8 }, (_, i) => ({ '--i': i }));

const CART_CSS = `
  .ct-hl, .ct-hl-dark {
    padding-bottom: 0.2em;
    background-position: left bottom;
    background-repeat: no-repeat;
    background-size: 100% 0.3em;
    -webkit-box-decoration-break: clone;
    box-decoration-break: clone;
  }
  .ct-hl      { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2310b981' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  .ct-hl-dark { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"); }
  @keyframes ctFade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes ctSlide { from { transform: translate3d(var(--from, 100%), 0, 0); } to { transform: none; } }
  @keyframes ctPop { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: none; } }
  @keyframes ctRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  @keyframes ctFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
  @keyframes ctTwinkle { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
  .ct-fade { animation: ctFade .16s ease-out both; }
  .ct-slide { animation: ctSlide .28s cubic-bezier(.2,.8,.2,1) both; will-change: transform; }
  .ct-pop { animation: ctPop .14s ease-out both; transform-origin: top; }
  .ct-rise { animation: ctRise .26s cubic-bezier(.2,.8,.2,1) both; animation-delay: calc(var(--i, 0) * 28ms); }
  .ct-float { animation: ctFloat 3.2s ease-in-out infinite; }
  .ct-float-2 { animation: ctFloat 4s ease-in-out .6s infinite; }
  .ct-twinkle { animation: ctTwinkle 2s ease-in-out infinite; }
  .ct-sb { scrollbar-width: thin; scrollbar-color: var(--acc) var(--soft); }
  @media (prefers-reduced-motion: reduce) {
    .ct-fade, .ct-slide, .ct-pop, .ct-rise, .ct-float, .ct-float-2, .ct-twinkle { animation: none; }
  }
`;

let cartStylesInjected = false;
const injectCartStylesOnce = () => {
  if (cartStylesInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.setAttribute('data-cart-styles', 'true');
  tag.textContent = CART_CSS;
  document.head.appendChild(tag);
  cartStylesInjected = true;
};
injectCartStylesOnce();

const THEME = {
  light: '[--dx:1] rtl:[--dx:-1] [--ink:#022c22] [--sh:#022c22] [--acc:#34d399] [--card:#ffffff] [--soft:#e8ebe9] [--txt:#022c22] [--mut:#4b5563]',
  dark: '[--dx:1] rtl:[--dx:-1] [--ink:#000000] [--sh:#000000] [--acc:#39ff88] [--card:#2a2a2a] [--soft:#1e1e1e] [--txt:#ffffff] [--mut:#a3a3a3]',
};

const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[color:var(--acc)]';

const BTN =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-[3px] border-[color:var(--ink)] font-extrabold uppercase ' +
  '[box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)] transition-[transform,box-shadow] duration-150 motion-reduce:transition-none ' +
  'active:translate-y-[4px] active:translate-x-[calc(var(--dx)*4px)] active:[box-shadow:0_0_0_0_var(--sh)] ' +
  `disabled:cursor-not-allowed disabled:opacity-40 disabled:[box-shadow:none] ${FOCUS}`;
const BTN_ACCENT = `${BTN} bg-[color:var(--acc)] text-emerald-950`;
const BTN_PLAIN = `${BTN} bg-[color:var(--card)] text-[color:var(--txt)]`;

const CARD =
  'rounded-2xl border-[3px] border-[color:var(--ink)] bg-[color:var(--card)] [box-shadow:calc(var(--dx)*5px)_5px_0_0_var(--sh)]';

const TILE =
  'flex flex-shrink-0 items-center justify-center rounded-xl border-[3px] border-[color:var(--ink)] bg-[color:var(--acc)] text-emerald-950 ' +
  '[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]';

const shouldRetry = (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const showToast = async (icon, title, timer = 2500) => {
  const Swal = await loadSwal();
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer, timerProgressBar: true, showConfirmButton: false });
};

const friendlyError = (err, fallback) => {
  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const raw = String(data.message || '');
  const code = String(data.error_code || data.code || '');
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

const fetchCart = async ({ signal }) => (await api.get('/api/cart', { signal })).data.items || [];
const fetchAddresses = async ({ signal }) => (await api.get('/api/users/addresses', { signal })).data.content || [];

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
      <circle cx="108" cy="150" r="10" fill="var(--acc)" />
      <circle cx="172" cy="150" r="10" fill="var(--acc)" />
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
      <circle cx="176" cy="66" r="24" fill="var(--acc)" stroke="var(--ink)" strokeWidth="3" />
      <path d="M164 66 L173 75 L189 57" fill="none" stroke="#022c22" strokeWidth="5" strokeLinecap="square" />
    </g>

    <Bag x={192} y={134} w={32} h={36} fill={ORANGE} />
    <Bag x={34} y={138} w={30} h={32} fill={EMERALD} />
  </svg>
));

const IconTile = memo(({ Icon, className = 'h-11 w-11', iconClassName = 'h-5 w-5' }) => (
  <span aria-hidden="true" className={`${TILE} ${className}`}>
    <Icon className={iconClassName} />
  </span>
));

const SKELETON_ROWS = [1, 2, 3];
const CartSkeleton = memo(() => (
  <div className="space-y-4 pe-1" role="status" aria-busy="true">
    {SKELETON_ROWS.map((i) => (
      <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-[color:var(--soft)] motion-reduce:animate-none" />
    ))}
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
    <ol className="flex select-none items-center px-2" aria-label="Checkout progress">
      {steps.map((s, i) => {
        const reached = i <= idx;
        return (
          <React.Fragment key={s.id}>
            <li className="flex flex-col items-center gap-1" aria-current={i === idx ? 'step' : undefined}>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-[3px] border-[color:var(--ink)] transition-colors duration-200 motion-reduce:transition-none ${
                  reached ? 'bg-[color:var(--acc)] text-emerald-950' : 'bg-[color:var(--card)] text-[color:var(--txt)] opacity-60'
                } ${i === idx ? '[box-shadow:calc(var(--dx)*3px)_3px_0_0_var(--sh)]' : ''}`}
              >
                {i < idx ? <FiCheck className="h-4 w-4" strokeWidth={3} /> : <s.Icon className="h-4 w-4" />}
              </span>
              <span className={`text-[11px] font-extrabold uppercase ${reached ? '' : 'opacity-60'}`}>{s.label}</span>
            </li>
            {i < steps.length - 1 && (
              <li aria-hidden="true" className="mx-1 mb-5 h-2.5 flex-1 overflow-hidden rounded-full border-2 border-[color:var(--ink)] bg-[color:var(--soft)]">
                <div className={`h-full bg-[color:var(--acc)] transition-[width] duration-300 ease-out motion-reduce:transition-none ${i < idx ? 'w-full' : 'w-0'}`} />
              </li>
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
});

const QTY_BTN = `${BTN_PLAIN} h-10 w-10 !rounded-lg !border-2 !text-base [box-shadow:calc(var(--dx)*2px)_2px_0_0_var(--sh)] active:!translate-y-[2px] active:!translate-x-[calc(var(--dx)*2px)]`;

const CartItem = memo(({ item, index, onUpdate, onRemove, t, busy }) => {
  const src = safeImageUrl(item.productImageUrl);
  const qty = Number(item.quantity);
  const dec = useCallback(() => onUpdate(item.id, qty - 1), [onUpdate, item.id, qty]);
  const inc = useCallback(() => onUpdate(item.id, qty + 1), [onUpdate, item.id, qty]);
  const remove = useCallback(() => onRemove(item.id), [onRemove, item.id]);
  return (
    <article aria-busy={busy} style={STAGGER[index % STAGGER.length]} className={`ct-rise flex items-center gap-3 p-3 ${CARD} ${busy ? 'opacity-70' : ''}`}>
      <div className="flex h-16 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-[color:var(--ink)] bg-[color:var(--soft)]">
        {src
          ? <img src={src} alt={item.productName} loading="lazy" decoding="async" width={ITEM_IMG_W} height={ITEM_IMG_H} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          : <IconTile Icon={FiPackage} className="h-10 w-10" />}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-sm font-extrabold uppercase leading-snug">{item.productName}</h4>
        <p className="mt-0.5 text-sm font-extrabold tabular-nums">{money(item.productPrice)}</p>
        <div className="mt-2 flex items-center gap-2">
          <button type="button" className={QTY_BTN} disabled={busy} onClick={dec} aria-label={t('decreaseQuantity')}>−</button>
          <span className="w-8 text-center text-sm font-extrabold tabular-nums" aria-live="polite">{item.quantity}</span>
          <button type="button" className={QTY_BTN} disabled={busy} onClick={inc} aria-label={t('increaseQuantity')}>+</button>
        </div>
      </div>

      <button type="button" className={`${BTN_PLAIN} h-10 w-10 flex-shrink-0 self-start !rounded-lg !border-2`} disabled={busy} onClick={remove} aria-label={t('removeItem')}>
        <FiTrash2 className="h-4 w-4 text-rose-500" />
      </button>
    </article>
  );
});

const SectionTitle = ({ Icon, darkMode, children }) => (
  <h3 className="mb-3 flex items-center gap-2.5 text-sm font-extrabold uppercase">
    <IconTile Icon={Icon} className="h-8 w-8 !rounded-lg !border-2" iconClassName="h-4 w-4" />
    <span className={darkMode ? 'ct-hl-dark' : 'ct-hl'}>{children}</span>
  </h3>
);

function CartContent({ show, onClose, darkMode }) {
  const language = useAppLanguage();
  const dir = languageDirection(language);
  const isRtl = dir === 'rtl';
  const isAr = language === 'ar';
  const t = useCallback((key) => getCartTranslation(language, key), [language]);
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
  const submittingRef = useRef(false);
  const qtyQueueRef = useRef(Promise.resolve());
  const closeTimerRef = useRef(null);
  const asideRef = useRef(null);
  const lastFocusRef = useRef(null);
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
    submittingRef.current = false;
    setIsProcessing(false);
    inflightRef.current.clear();
    setBusyIds(EMPTY_LIST);
  }, [userId]);

  const { data: cartItems = EMPTY_LIST, isLoading: isCartLoading } = useQuery({
    queryKey: cartKey,
    queryFn: fetchCart,
    enabled: isAuthenticated,
    staleTime: 15000,
    retry: shouldRetry,
    refetchOnWindowFocus: false,
  });
  const { data: addresses = EMPTY_LIST, isLoading: isAddressLoading } = useQuery({
    queryKey: addrKey,
    queryFn: fetchAddresses,
    enabled: isAuthenticated && show,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetry,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const refresh = () => qc.invalidateQueries({ queryKey: cartKey });
    window.addEventListener('cart:updated', refresh);
    return () => window.removeEventListener('cart:updated', refresh);
  }, [isAuthenticated, qc, cartKey]);

  useEffect(() => { if (show && isAuthenticated) qc.invalidateQueries({ queryKey: cartKey }); }, [show, isAuthenticated, qc, cartKey]);
  useEffect(() => { if (addresses.length > 0 && !selectedAddress) setSelectedAddress(addresses[0].id); }, [addresses, selectedAddress]);

  const cartTotal = useMemo(() => cartItems.reduce((sum, i) => sum + (Number(i.productPrice) || 0) * (Number(i.quantity) || 1), 0), [cartItems]);

  const handleClose = useCallback(() => {
    onClose();
    setShowDropdown(false);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => { closeTimerRef.current = null; setCheckoutStep('cart'); setOrderId(null); }, CLOSE_DELAY_MS);
  }, [onClose]);

  useEffect(() => {
    if (show && closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
      setCheckoutStep('cart');
      setOrderId(null);
    }
  }, [show]);
  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (dropRef.current?.querySelector('[aria-expanded="true"]')) setShowDropdown(false);
      else handleClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [show, handleClose]);

  useEffect(() => {
    if (!show) return undefined;
    lastFocusRef.current = document.activeElement;
    asideRef.current?.focus({ preventScroll: true });
    return () => { lastFocusRef.current?.focus?.({ preventScroll: true }); };
  }, [show]);

  useEffect(() => {
    if (!showDropdown) return undefined;
    const onDown = (e) => { if (!dropRef.current?.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [showDropdown]);

  const rollback = (ctx) => { if (ctx?.previousCart) qc.setQueryData(cartKey, ctx.previousCart); };
  const optimistic = (updater) => async (arg) => {
    await qc.cancelQueries({ queryKey: cartKey });
    const previousCart = qc.getQueryData(cartKey);
    qc.setQueryData(cartKey, (old) => updater(old || [], arg));
    return { previousCart };
  };
  const settle = () => qc.invalidateQueries({ queryKey: cartKey });

  const updateQuantityMut = useMutation({
    mutationFn: ({ itemId, qty }) => {
      const run = qtyQueueRef.current.catch(() => {}).then(() => api.put(`/api/cart/items/${itemId}`, { quantity: qty }));
      qtyQueueRef.current = run;
      return run;
    },
    onMutate: optimistic((old, { itemId, qty }) => old.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i))),
    onError: (e, v, ctx) => { rollback(ctx); showToast('error', friendlyError(e, "We couldn't update the quantity. Your previous quantity was kept."), 4000); },
    onSettled: (d, e, v) => { unlock(v.itemId); return settle(); },
  });
  const removeMut = useMutation({
    mutationFn: (itemId) => api.delete(`/api/cart/items/${itemId}`),
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
    const n = Number(qty);
    const found = (qc.getQueryData(cartKey) || []).find((i) => i.id === itemId);
    const max = Number(found?.stock ?? found?.availableStock ?? found?.productStock);
    if (Number.isFinite(max) && n > max) { showToast('warning', `Only ${max} left in stock.`, 3000); return; }
    if (!lock(itemId)) return;
    if (n < 1) removeItem(itemId); else updateItemQty({ itemId, qty: n });
  }, [removeItem, updateItemQty, lock, qc, cartKey]);
  const removeFromCart = useCallback((id) => { if (lock(id)) removeItem(id); }, [removeItem, lock]);
  const clearCart = useCallback(() => { if (!isClearing) clearAll(); }, [clearAll, isClearing]);

  const createOrder = useCallback(async () => {
    if (!isAuthenticated) {
      const Swal = await loadSwal();
      Swal.fire({ icon: 'info', title: t('loginRequired'), confirmButtonText: t('goToLogin') }).then(() => navigate('/login'));
      return;
    }
    if (!selectedAddress) { showToast('warning', t('selectAddressAlert'), 3000); return; }
    if (cartItems.length === 0) { showToast('warning', 'Your cart is empty. Add a product before placing an order.', 3000); return; }
    if (!Number.isFinite(cartTotal) || cartTotal <= 0) { showToast('warning', 'Your order total must be greater than zero.', 3500); return; }
    if (!addresses.some((a) => a.id === selectedAddress)) { showToast('warning', t('selectAddressAlert'), 3000); return; }
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
    }
  }, [isAuthenticated, selectedAddress, cartItems.length, cartTotal, addresses, navigate, qc, cartKey, t]);

  const selectedAddr = useMemo(() => addresses.find((a) => a.id === selectedAddress), [addresses, selectedAddress]);
  const toggleDropdown = useCallback(() => setShowDropdown((v) => !v), []);
  const pickAddress = useCallback((id) => { setSelectedAddress(id); setShowDropdown(false); }, []);
  const goCheckout = useCallback(() => setCheckoutStep('checkout'), []);
  const backToCart = useCallback(() => setCheckoutStep('cart'), []);

  if (!show) return null;

  const loading = ((isAuthenticated && isCartLoading) || (checkoutStep === 'checkout' && isAddressLoading)) && checkoutStep !== 'complete';
  const headIcon = checkoutStep === 'cart' ? FiShoppingCart : checkoutStep === 'checkout' ? FiTruck : FiCheck;
  const canOrder = selectedAddress && cartItems.length > 0 && cartTotal > 0 && !isProcessing;
  const showSteps = cartItems.length > 0 || checkoutStep === 'complete';
  const showCartTotal = !loading && checkoutStep === 'cart' && cartItems.length > 0;
  const showCheckoutTotal = !loading && checkoutStep === 'checkout';
  const hl = darkMode ? 'ct-hl-dark' : 'ct-hl';
  const track = isAr ? 'tracking-normal' : 'tracking-[-0.02em]';
  const surface = darkMode ? 'bg-[#141414]' : 'bg-gray-50';
  const sectionCls = 'flex-shrink-0 border-b-[3px] border-[color:var(--ink)] px-4 sm:px-6';
  const footerCls = `flex-shrink-0 border-t-[3px] border-[color:var(--ink)] p-4 sm:p-5 ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`;
  const title = checkoutStep === 'cart' ? t('yourCart') : checkoutStep === 'checkout' ? t('checkout') : t('orderConfirmed');
  const subtitle = checkoutStep === 'cart'
    ? `${cartItems.length} ${cartItems.length !== 1 ? t('items') : t('item')}`
    : checkoutStep === 'checkout' ? t('almostThere') : t('thankYou');

  return (
    <div dir={dir} className={`fixed inset-0 z-50 flex justify-end ${isAr ? 'font-cairo' : 'font-jakarta'}`} role="dialog" aria-modal="true" aria-label={t('yourCart')}>
      <div className="ct-fade fixed inset-0 bg-black/60" onClick={handleClose} aria-hidden="true" />

      <aside
        ref={asideRef}
        tabIndex={-1}
        className={`ct-slide ${darkMode ? THEME.dark : THEME.light} ${surface} relative flex h-full w-full max-w-md flex-col border-s-[3px] border-[color:var(--ink)] text-[color:var(--txt)] outline-none [contain:layout_paint]`}
        style={{ '--from': isRtl ? '-100%' : '100%' }}
      >
        <header className={`${sectionCls} py-5 ${darkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <IconTile Icon={headIcon} />
              <div className="min-w-0">
                <h2 className={`text-xl font-extrabold uppercase leading-tight sm:text-2xl ${track}`}>
                  <span className={hl}>{title}</span>
                </h2>
                <p className="mt-1.5 text-xs font-bold text-[color:var(--mut)]">{subtitle}</p>
              </div>
            </div>
            <button type="button" onClick={handleClose} aria-label="Close cart" className={`${BTN_PLAIN} h-11 w-11 flex-shrink-0`}>
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </header>

        {showSteps && (
          <section aria-label="Checkout progress" className={`${sectionCls} py-4`}>
            <StepIndicator current={checkoutStep} t={t} />
          </section>
        )}

        <section className="ct-sb flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-6 sm:px-5 sm:pt-7">
          {loading ? <CartSkeleton /> : (
            <>
              {checkoutStep === 'cart' && (
                cartItems.length === 0 ? (
                  <div className="ct-rise flex flex-col items-center gap-3 py-8 text-center">
                    <EmptyCartArt />
                    <p className="text-lg font-extrabold uppercase">{t('empty')}</p>
                    <p className="text-sm font-medium text-[color:var(--mut)]">{t('addProducts')}</p>
                    <button type="button" onClick={handleClose} className={`${BTN_ACCENT} mt-2 min-h-11 px-6 py-3 text-sm`}>{t('browseDevices')}</button>
                  </div>
                ) : (
                  <div className="space-y-4 pe-1">
                    {cartItems.map((item, i) => (
                      <CartItem key={item.id} item={item} index={i} onUpdate={updateQuantity} onRemove={removeFromCart} t={t} busy={busyIds.includes(item.id)} />
                    ))}
                  </div>
                )
              )}

              {checkoutStep === 'checkout' && (
                <div className="ct-rise space-y-6 pe-1">
                  <button type="button" onClick={backToCart} className={`${BTN_PLAIN} min-h-11 px-4 py-2 text-xs`}>
                    <FiArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /> {t('backToCart')}
                  </button>

                  <section>
                    <SectionTitle Icon={FiMapPin} darkMode={darkMode}>{t('deliveryAddress')}</SectionTitle>
                    <div ref={dropRef} className="relative">
                      <button
                        type="button"
                        onClick={toggleDropdown}
                        aria-expanded={showDropdown}
                        aria-haspopup="listbox"
                        className={`${BTN_PLAIN} min-h-12 w-full justify-between px-4 py-3 text-start text-sm normal-case`}
                      >
                        <span className="me-2 flex-1 truncate">{selectedAddr ? `${selectedAddr.street}, ${selectedAddr.city}` : t('selectAddress')}</span>
                        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 motion-reduce:transition-none ${showDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showDropdown && (
                        <ul
                          role="listbox"
                          className="ct-pop ct-sb absolute z-20 mt-2 max-h-52 w-full overflow-y-auto overscroll-contain rounded-xl border-[3px] border-[color:var(--ink)] bg-[color:var(--card)] py-1 [box-shadow:calc(var(--dx)*4px)_4px_0_0_var(--sh)]"
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
                                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 px-4 py-2.5 text-sm font-bold outline-none transition-colors duration-100 ${
                                  active ? 'bg-[color:var(--acc)] text-emerald-950' : 'hover:bg-[color:var(--soft)] focus-visible:bg-[color:var(--soft)]'
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

                  <section className={`p-4 ${CARD}`}>
                    <SectionTitle Icon={FiPackage} darkMode={darkMode}>{t('orderSummary')}</SectionTitle>
                    <div className="space-y-2 text-sm font-medium">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between gap-2">
                          <span className="truncate">{item.productName} <span dir="ltr">×{item.quantity}</span></span>
                          <span className="flex-shrink-0 font-extrabold tabular-nums">{money((Number(item.productPrice) || 0) * (Number(item.quantity) || 1))}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 flex items-center gap-2 border-t-2 border-dotted border-[color:var(--ink)] pt-3 text-xs font-bold text-[color:var(--mut)]">
                      <FiTruck className="h-4 w-4 flex-shrink-0" aria-hidden="true" /> {t('cashOnDelivery')} · {t('payOnReceive')}
                    </p>
                  </section>
                </div>
              )}

              {checkoutStep === 'complete' && (
                <div className="ct-rise flex flex-col items-center gap-4 py-6 text-center">
                  <SuccessArt />
                  <div>
                    <h3 className={`text-2xl font-extrabold uppercase ${track}`}><span className={hl}>{t('orderConfirmed')}</span></h3>
                    <p className="mt-4 text-sm font-medium text-[color:var(--mut)]">{t('orderConfirmedMessage')}</p>
                  </div>
                  {orderId != null && <p className="text-sm font-extrabold tabular-nums" dir="ltr">#{String(orderId).slice(0, 8)}</p>}
                  <p className={`w-full p-4 text-sm font-medium ${CARD}`}>{t('orderPreparing')}</p>
                  <button type="button" onClick={handleClose} className={`${BTN_ACCENT} min-h-12 w-full py-3.5 text-sm`}>{t('continueShopping')}</button>
                </div>
              )}
            </>
          )}
        </section>

        {showCartTotal && (
          <footer className={footerCls}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold uppercase">{t('subtotal')}</span>
              <span className="text-xl font-extrabold tabular-nums">{money(cartTotal)}</span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-[color:var(--mut)]">{t('deliveryFees')}</p>
            <div className="mt-4 flex gap-3 pe-1">
              <button type="button" onClick={goCheckout} className={`${BTN_ACCENT} min-h-12 flex-1 py-3.5 text-sm`}>
                <FiTruck className="h-4 w-4" aria-hidden="true" /> {t('checkout')}
              </button>
              <button type="button" onClick={clearCart} disabled={isClearing} aria-label="Clear cart" className={`${BTN_PLAIN} h-12 w-12 flex-shrink-0`}>
                <FiTrash2 className="h-4 w-4 text-rose-500" />
              </button>
            </div>
          </footer>
        )}
        {showCheckoutTotal && (
          <footer className={footerCls}>
            <div className="mb-4 flex items-center justify-between text-base font-extrabold uppercase">
              <span>{t('total')}</span><span className="tabular-nums">{money(cartTotal)}</span>
            </div>
            <div className="pe-1">
              <button type="button" onClick={createOrder} disabled={!canOrder} className={`${BTN_ACCENT} min-h-12 w-full py-3.5 text-sm`}>
                {isProcessing
                  ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" /> {t('processing')}</>
                  : <><FiCheck className="h-5 w-5" aria-hidden="true" /> {t('placeOrder')} · {money(cartTotal)}</>}
              </button>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
}

const CartContentMemo = memo(CartContent);

export default function Cart(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <CartContentMemo {...props} />
    </QueryClientProvider>
  );
}