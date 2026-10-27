import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  FiX, FiShoppingCart, FiTruck, FiTrash2, FiZap, FiChevronDown, FiCheck, FiMapPin, FiPackage,
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

const NB_FONT_STYLE = { fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif" };
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
.nb{--nb-bg:#eef9f3;--nb-card:#ffffff;--nb-ink:#04261a;--nb-muted:#4b6b5c;--nb-line:#04261a;--nb-shadow:#04261a;--nb-gray:#e8ebe9;--nb-accent:#10b981;--nb-btn:#059669;--nb-on:#ffffff;background:var(--nb-bg);color:var(--nb-ink)}
.nb-dark{--nb-bg:#141414;--nb-card:#2a2a2a;--nb-ink:#ffffff;--nb-muted:#a3a3a3;--nb-line:#000000;--nb-shadow:#000000;--nb-gray:#1e1e1e;--nb-accent:#39ff88;--nb-btn:#39ff88;--nb-on:#022c22}
.nb-dark.nb-line{border-color:#3a3a3a}
.nb-dark .border-dotted{border-color:#3f3f3f}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-line{border-color:var(--nb-line)}
.nb-card{background:var(--nb-card);border:2px solid var(--nb-line);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-ul{text-decoration:underline;text-decoration-color:var(--nb-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
.nb-chip{display:inline-flex;align-items:center;gap:4px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);padding:1px 6px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.5}
.nb-chip-a{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:3px 3px 0 var(--nb-shadow);font-weight:700;cursor:pointer;transition:transform .12s ease,box-shadow .12s ease,background-color .12s ease}
.nb-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:0 0 0 var(--nb-shadow)}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a,.nb-btn-on{background:var(--nb-btn);color:var(--nb-on)}
.nb-btn:focus-visible{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-line);box-shadow:4px 4px 0 var(--nb-shadow)}
.nb-sel{background:var(--nb-btn);color:var(--nb-on)}
.nb[dir=rtl] .nb-flip{transform:scaleX(-1)}
@keyframes nbFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes nbTwinkle{0%,100%{opacity:1}50%{opacity:.3}}
.nb-float{animation:nbFloat 3.2s ease-in-out infinite}
.nb-float-2{animation:nbFloat 4s ease-in-out .6s infinite}
.nb-twinkle{animation:nbTwinkle 2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.anim-fade-in,.anim-slide-in{animation:none!important}.nb-btn{transition:none}.nb-float,.nb-float-2,.nb-twinkle{animation:none}}
`;
const STYLE_EL = <style>{NB_CSS}</style>;

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
const SKY = '#38bdf8';
const VIOLET = '#8b5cf6';
const ROSE = '#fb7185';

const ArtBackdrop = () => (
  <>
    <circle cx="130" cy="96" r="80" fill="none" stroke="var(--nb-accent)" strokeWidth="2" strokeDasharray="5 6" opacity=".7" />
    <ellipse cx="130" cy="180" rx="84" ry="8" fill="var(--nb-gray)" />
  </>
);
const Sparkle = ({ x, y, s = 6, className = '' }) => (
  <path className={className} d={`M${x} ${y - s}V${y + s}M${x - s} ${y}H${x + s}`} stroke="var(--nb-accent)" strokeWidth="3" strokeLinecap="square" />
);
const Wrench = ({ x, y, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} stroke="var(--nb-line)" strokeWidth="2.5" strokeLinejoin="round">
    <rect x="-4" y="-2" width="8" height="34" fill={AMBER} />
    <circle cx="0" cy="-8" r="10" fill={AMBER} />
    <rect x="-3.5" y="-20" width="7" height="12" fill="var(--nb-card)" stroke="none" />
    <circle cx="0" cy="30" r="3" fill="var(--nb-card)" />
  </g>
);
const Bag = ({ x, y, w = 36, h = 42, fill }) => (
  <g stroke="var(--nb-line)" strokeWidth="2.5" strokeLinejoin="round">
    <path d={`M${x + w * 0.3} ${y} v-8 a${w * 0.2} ${w * 0.2} 0 0 1 ${w * 0.4} 0 v8`} fill="none" />
    <rect x={x} y={y} width={w} height={h} fill={fill} />
    <rect x={x} y={y} width={w} height="6" fill="var(--nb-card)" opacity=".35" stroke="none" />
  </g>
);
const Phone = ({ x, y, w = 32, h = 56, screen = 'var(--nb-accent)' }) => (
  <g stroke="var(--nb-line)" strokeWidth="2.5" strokeLinejoin="round">
    <rect x={x} y={y} width={w} height={h} rx="6" fill="var(--nb-card)" />
    <rect x={x + 4} y={y + 7} width={w - 8} height={h - 16} rx="2" fill={screen} stroke="none" />
    <circle cx={x + w / 2} cy={y + h - 5} r="1.6" fill="var(--nb-line)" stroke="none" />
  </g>
);
const Laptop = ({ x, y }) => (
  <g stroke="var(--nb-line)" strokeWidth="2.5" strokeLinejoin="round">
    <rect x={x} y={y} width="52" height="34" rx="3" fill="var(--nb-card)" />
    <rect x={x + 5} y={y + 5} width="42" height="24" fill={SKY} stroke="none" />
    <path d={`M${x - 6} ${y + 34} H${x + 58} L${x + 54} ${y + 40} H${x - 2} Z`} fill={VIOLET} />
  </g>
);
const Gear = ({ x, y, r = 11, className = '' }) => (
  <g className={className}>
    <circle cx={x} cy={y} r={r} fill="none" stroke={VIOLET} strokeWidth="6" strokeDasharray="5 4.2" />
    <circle cx={x} cy={y} r={r - 3} fill={VIOLET} stroke="var(--nb-line)" strokeWidth="2.5" />
    <circle cx={x} cy={y} r="3.5" fill="var(--nb-card)" stroke="var(--nb-line)" strokeWidth="2" />
  </g>
);

const EmptyCartArt = memo(() => (
  <svg viewBox="0 0 260 200" className="h-44 w-60 sm:h-48 sm:w-64" role="img" aria-hidden="true">
    <ArtBackdrop />
    <Sparkle x={36} y={52} className="nb-twinkle" />
    <Sparkle x={228} y={120} s={5} className="nb-twinkle" />
    <circle cx="214" cy="46" r="4" fill={AMBER} className="nb-twinkle" />
    <circle cx="48" cy="150" r="3.5" fill={ROSE} />

    <g className="nb-float-2"><Gear x={46} y={92} /></g>
    <g className="nb-float"><Wrench x={214} y={72} rot={35} /></g>

    <Phone x={112} y={44} />
    <Laptop x={150} y={52} />

    <g stroke="var(--nb-line)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M62 58 H80 L94 134 H178" fill="none" />
      <path d="M84 82 H204 L192 128 H96 Z" fill="var(--nb-card)" />
      <path d="M100 82 L106 128 M124 82 L128 128 M148 82 L150 128 M172 82 L172 128" stroke="var(--nb-accent)" strokeWidth="2.5" fill="none" />
      <circle cx="108" cy="150" r="10" fill="var(--nb-accent)" />
      <circle cx="172" cy="150" r="10" fill="var(--nb-accent)" />
      <circle cx="108" cy="150" r="3" fill="var(--nb-card)" strokeWidth="2" />
      <circle cx="172" cy="150" r="3" fill="var(--nb-card)" strokeWidth="2" />
    </g>

    <Bag x={30} y={128} w={34} h={42} fill={VIOLET} />
    <Bag x={64} y={142} w={28} h={28} fill={AMBER} />
  </svg>
));

const SuccessArt = memo(() => (
  <svg viewBox="0 0 260 200" className="h-44 w-60 sm:h-48 sm:w-64" role="img" aria-hidden="true">
    <ArtBackdrop />
    <Sparkle x={34} y={60} className="nb-twinkle" />
    <Sparkle x={232} y={64} s={7} className="nb-twinkle" />
    <Sparkle x={216} y={146} s={5} className="nb-twinkle" />
    <circle cx="54" cy="34" r="4" fill={ROSE} className="nb-twinkle" />
    <circle cx="196" cy="26" r="3.5" fill={SKY} className="nb-twinkle" />
    <rect x="26" y="108" width="7" height="7" fill={AMBER} transform="rotate(20 29 111)" />
    <rect x="236" y="100" width="7" height="7" fill={VIOLET} transform="rotate(-15 239 103)" />

    <g className="nb-float-2"><Gear x={50} y={96} r={10} /></g>
    <g className="nb-float"><Wrench x={216} y={92} rot={-30} /></g>

    <g stroke="var(--nb-line)" strokeWidth="3" strokeLinejoin="round">
      <rect x="80" y="92" width="100" height="74" fill="var(--nb-card)" />
      <rect x="72" y="76" width="116" height="20" fill="var(--nb-gray)" />
      <rect x="120" y="76" width="20" height="90" fill={AMBER} />
      <path d="M130 76 C112 56 96 62 104 72 C110 80 126 76 130 76 Z M130 76 C148 56 164 62 156 72 C150 80 134 76 130 76 Z" fill={AMBER} strokeWidth="2.5" />
    </g>
    <Phone x={92} y={110} w={22} h={38} screen={SKY} />

    <g className="nb-float">
      <circle cx="176" cy="66" r="24" fill="var(--nb-btn)" stroke="var(--nb-line)" strokeWidth="3" />
      <path d="M164 66 L173 75 L189 57" fill="none" stroke="var(--nb-on)" strokeWidth="5" strokeLinecap="square" />
    </g>

    <Bag x={192} y={134} w={32} h={36} fill={ROSE} />
    <Bag x={34} y={138} w={30} h={32} fill={VIOLET} />
  </svg>
));

const STEP_TONE = { cart: 'em', checkout: 'sky', complete: 'am' };
const TILE_TONES = {
  em: 'bg-emerald-500 text-white', sky: 'bg-sky-500 text-white', vi: 'bg-violet-500 text-white',
  am: 'bg-amber-400 text-[#04261a]', ro: 'bg-rose-500 text-white',
};

const IconTile = memo(({ Icon, tone, solid = true, className = 'h-9 w-9', iconClassName = 'h-4 w-4' }) => (
  <span aria-hidden="true" className={`nb-line flex flex-shrink-0 items-center justify-center border-2 ${solid ? TILE_TONES[tone] : 'bg-[color:var(--nb-card)]'} ${className}`}>
    <Icon className={iconClassName} />
  </span>
));

const SKELETON_ROWS = [1, 2, 3];
const CartSkeleton = memo(() => (
  <div className="space-y-3" aria-busy="true">
    {SKELETON_ROWS.map((i) => <div key={i} className="nb-gray nb-line h-24 animate-pulse border-2 motion-reduce:animate-none" />)}
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
              <span className={`nb-line flex h-9 w-9 items-center justify-center border-2 ${reached ? 'nb-btn-on' : 'bg-[color:var(--nb-card)] opacity-60'} ${i === idx ? 'shadow-[3px_3px_0_var(--nb-shadow)]' : ''}`}>
                {(i < idx ? <FiCheck className="h-4 w-4" /> : <s.Icon className="h-4 w-4" />)}
              </span>
              <span className={`text-[10px] font-extrabold uppercase ${reached ? '' : 'opacity-60'}`}>{s.label}</span>
            </li>
            {i < steps.length - 1 && (
              <li aria-hidden="true" className="nb-gray nb-line mx-1 mb-4 h-2 flex-1 border-2">
                <div className={`h-full bg-[color:var(--nb-accent)] transition-[width] duration-500 motion-reduce:transition-none ${i < idx ? 'w-full' : 'w-0'}`} />
              </li>
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
});

const CartItem = memo(({ item, onUpdate, onRemove, t, busy }) => {
  const src = safeImageUrl(item.productImageUrl);
  return (
    <article aria-busy={busy} className="nb-card flex items-center gap-3 p-3">
      <div className="nb-gray flex h-16 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl">
        {src
          ? <img src={src} alt={item.productName} loading="lazy" decoding="async" width={ITEM_IMG_W} height={ITEM_IMG_H} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          : <IconTile Icon={FiPackage} tone="vi" className="h-10 w-10" iconClassName="h-5 w-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-2 text-sm font-extrabold uppercase leading-snug">{item.productName}</h4>
        <p className="mt-0.5 text-sm font-extrabold tabular-nums">{money(item.productPrice)}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <button type="button" className="nb-btn h-8 w-8 text-base" disabled={busy} onClick={() => onUpdate(item.id, Number(item.quantity) - 1)} aria-label={t('decreaseQuantity')}>−</button>
          <span className="w-7 text-center text-sm font-bold tabular-nums" aria-live="polite">{item.quantity}</span>
          <button type="button" className="nb-btn h-8 w-8 text-base" disabled={busy} onClick={() => onUpdate(item.id, Number(item.quantity) + 1)} aria-label={t('increaseQuantity')}>+</button>
        </div>
      </div>

      <button type="button" className="nb-btn h-9 w-9 flex-shrink-0 self-start" disabled={busy} onClick={() => onRemove(item.id)} aria-label={t('removeItem')}>
        <FiTrash2 className="h-4 w-4 text-rose-500" />
      </button>
    </article>
  );
});

const SectionTitle = ({ Icon, tone, children }) => (
  <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase"><IconTile Icon={Icon} tone={tone} className="h-7 w-7" iconClassName="h-3.5 w-3.5" /> <span className="nb-ul">{children}</span></h3>
);

function CartContent({ show, onClose, darkMode }) {
  const language = useAppLanguage();
  const dir = languageDirection(language);
  const isRtl = dir === 'rtl';
  const isAr = language === 'ar';
  const t = useCallback((key) => getCartTranslation(language, key), [language]);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => { ensureNbFont(); }, []);

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
  const inflightRef = useRef(new Set());
  const [busyIds, setBusyIds] = useState([]);
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
    setBusyIds([]);
  }, [userId]);

  const { data: cartItems = [], isLoading: isCartLoading } = useQuery({
    queryKey: cartKey,
    queryFn: fetchCart,
    enabled: isAuthenticated,
    staleTime: 15000,
    retry: shouldRetry,
    refetchOnWindowFocus: false,
  });
  const { data: addresses = [], isLoading: isAddressLoading } = useQuery({
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
    closeTimerRef.current = setTimeout(() => { closeTimerRef.current = null; setCheckoutStep('cart'); setOrderId(null); }, 300);
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
    const onKey = (e) => e.key === 'Escape' && handleClose();
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
  const goCheckout = useCallback(() => setCheckoutStep('checkout'), []);
  const backToCart = useCallback(() => setCheckoutStep('cart'), []);

  if (!show) return null;

  const loading = ((isAuthenticated && isCartLoading) || (checkoutStep === 'checkout' && isAddressLoading)) && checkoutStep !== 'complete';
  const headIcon = checkoutStep === 'cart' ? FiShoppingCart : checkoutStep === 'checkout' ? FiTruck : FiCheck;
  const headTone = STEP_TONE[checkoutStep];
  const canOrder = selectedAddress && cartItems.length > 0 && cartTotal > 0 && !isProcessing;
  const showSteps = cartItems.length > 0 || checkoutStep === 'complete';
  const showCartTotal = !loading && checkoutStep === 'cart' && cartItems.length > 0;
  const showCheckoutTotal = !loading && checkoutStep === 'checkout';
  const sectionCls = 'nb-line flex-shrink-0 border-b-2 px-4 sm:px-6';
  const footerCls = 'nb-line flex-shrink-0 border-t-2 p-4 sm:p-5';

  return (
    <div dir={dir} className={`fixed inset-0 z-50 flex justify-end ${isAr ? 'font-cairo' : ''}`} style={isAr ? undefined : NB_FONT_STYLE} role="dialog" aria-modal="true" aria-label={t('yourCart')}>
      {STYLE_EL}
      <div className="anim-fade-in fixed inset-0 bg-black/60" onClick={handleClose} aria-hidden="true" />

      <aside
        ref={asideRef} tabIndex={-1}
        className={`nb ${darkMode ? 'nb-dark' : ''} nb-line anim-slide-in relative flex h-full w-full max-w-md flex-col border-s-2 outline-none`}
        style={{ '--from': isRtl ? '-100%' : '100%' }}
      >
        <header className={`${sectionCls} nb-gray py-5`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <IconTile Icon={headIcon} tone={headTone} className="h-11 w-11" iconClassName="h-5 w-5" />
              <div>
                <h2 className="text-xl font-extrabold uppercase leading-tight tracking-tight sm:text-2xl">
                  <span className="nb-ul">
                    {checkoutStep === 'cart' ? t('yourCart') : checkoutStep === 'checkout' ? t('checkout') : t('orderConfirmed')}
                  </span>
                </h2>
                <p className="nb-muted mt-1.5 text-xs">
                  {checkoutStep === 'cart' ? `${cartItems.length} ${cartItems.length !== 1 ? t('items') : t('item')}` : checkoutStep === 'checkout' ? t('almostThere') : t('thankYou')}
                </p>
              </div>
            </div>
            <button type="button" onClick={handleClose} aria-label="Close cart" className="nb-btn h-10 w-10 flex-shrink-0"><FiX className="h-5 w-5" /></button>
          </div>
          <div className="nb-chip nb-chip-a mt-3"><FiZap className="h-3 w-3" /> {t('secure')}</div>
        </header>

        {showSteps && (
          <section aria-label="Checkout progress" className={`${sectionCls} py-4`}>
            <StepIndicator current={checkoutStep} t={t} />
          </section>
        )}

        <section className="flex-1 overflow-y-auto overscroll-contain px-4 pb-5 pe-5 pt-6 sm:px-5 sm:pt-7">
          {loading ? <CartSkeleton /> : (
            <>
              {checkoutStep === 'cart' && (
                cartItems.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <EmptyCartArt />
                    <p className="text-lg font-extrabold uppercase">{t('empty')}</p>
                    <p className="nb-muted text-sm">{t('addProducts')}</p>
                    <button type="button" onClick={handleClose} className="nb-btn nb-btn-a mt-2 px-6 py-3 text-sm uppercase">{t('browseDevices')}</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => <CartItem key={item.id} item={item} onUpdate={updateQuantity} onRemove={removeFromCart} t={t} busy={busyIds.includes(item.id)} />)}
                  </div>
                )
              )}

              {checkoutStep === 'checkout' && (
                <div className="space-y-6">
                  <button type="button" onClick={backToCart} className="nb-btn px-3 py-1.5 text-xs uppercase">
                    <span className={isRtl ? 'rotate-180' : ''}>←</span> {t('backToCart')}
                  </button>

                  <section>
                    <SectionTitle Icon={FiMapPin} tone="sky">{t('deliveryAddress')}</SectionTitle>
                    <div className="relative">
                      <button type="button" onClick={toggleDropdown} aria-expanded={showDropdown} aria-haspopup="listbox"
                        className="nb-btn flex w-full items-center justify-between px-4 py-3 text-start text-sm">
                        <span className="me-2 flex-1 truncate">{selectedAddr ? `${selectedAddr.street}, ${selectedAddr.city}` : t('selectAddress')}</span>
                        <FiChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${showDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showDropdown && (
                        <div className="nb-menu anim-fade-in absolute z-20 mt-2 max-h-52 w-full overflow-y-auto">
                          {addresses.length > 0 ? addresses.map((addr) => (
                            <button key={addr.id} type="button" onClick={() => { setSelectedAddress(addr.id); setShowDropdown(false); }}
                              className={`flex w-full items-center justify-between px-4 py-3 text-start text-sm font-semibold transition-colors ${selectedAddress === addr.id ? 'nb-sel' : 'hover:bg-[color:var(--nb-gray)]'}`}>
                              <span className="me-2 flex-1 truncate">{addr.street}, {addr.city}</span>
                              {selectedAddress === addr.id && <FiCheck className="h-4 w-4 flex-shrink-0" strokeWidth={3} />}
                            </button>
                          )) : <div className="nb-muted px-4 py-6 text-center text-sm">{t('noAddresses')}</div>}
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="nb-card p-4">
                    <SectionTitle Icon={FiPackage} tone="ro">{t('orderSummary')}</SectionTitle>
                    <div className="space-y-1.5 text-sm">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between gap-2">
                          <span className="truncate">{item.productName} ×{item.quantity}</span>
                          <span className="flex-shrink-0 font-bold tabular-nums">{money((Number(item.productPrice) || 0) * (Number(item.quantity) || 1))}</span>
                        </div>
                      ))}
                    </div>
                    <p className="nb-muted nb-line mt-3 flex items-center gap-2 border-t-2 border-dotted pt-3 text-xs font-bold">
                      <FiTruck className="h-4 w-4 flex-shrink-0" /> {t('cashOnDelivery')} · {t('payOnReceive')}
                    </p>
                  </section>
                </div>
              )}

              {checkoutStep === 'complete' && (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <SuccessArt />
                  <div>
                    <h3 className="text-2xl font-extrabold uppercase tracking-tight"><span className="nb-ul">{t('orderConfirmed')}</span></h3>
                    <p className="nb-muted mt-4 text-sm">{t('orderConfirmedMessage')}</p>
                  </div>
                  {orderId != null && <p className="nb-chip nb-chip-a !text-xs" dir="ltr">#{String(orderId).slice(0, 8)}</p>}
                  <p className="nb-gray nb-line w-full border-2 border-dotted p-4 text-sm">{t('orderPreparing')}</p>
                  <button type="button" onClick={handleClose} className="nb-btn nb-btn-a w-full py-3.5 text-sm uppercase">{t('continueShopping')}</button>
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
            <p className="nb-muted mt-0.5 text-xs">{t('deliveryFees')}</p>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={goCheckout} className="nb-btn nb-btn-a flex-1 py-3.5 text-sm uppercase"><FiTruck className="h-4 w-4" /> {t('checkout')}</button>
              <button type="button" onClick={clearCart} aria-label="Clear cart" className="nb-btn w-12 flex-shrink-0"><FiTrash2 className="h-4 w-4 text-rose-500" /></button>
            </div>
          </footer>
        )}
        {showCheckoutTotal && (
          <footer className={footerCls}>
            <div className="mb-4 flex items-center justify-between text-base font-extrabold uppercase">
              <span>{t('total')}</span><span className="tabular-nums">{money(cartTotal)}</span>
            </div>
            <button type="button" onClick={createOrder} disabled={!canOrder} className="nb-btn nb-btn-a w-full py-3.5 text-sm uppercase">
              {isProcessing
                ? <><span className="h-5 w-5 animate-spin border-2 border-current border-t-transparent motion-reduce:animate-none" /> {t('processing')}</>
                : <><FiCheck className="h-5 w-5" /> {t('placeOrder')} · {money(cartTotal)}</>}
            </button>
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