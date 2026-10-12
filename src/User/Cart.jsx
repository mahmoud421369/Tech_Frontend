import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  FiX, FiShoppingCart, FiCreditCard, FiTruck, FiTrash2, FiZap, FiChevronDown, FiCheck, FiMapPin, FiPackage,
} from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '../api';
import { Defs3D, Device3DStyles, DeviceScene, Btn3D, Chip3D, readStorage, safeImageUrl, money } from '../components/Device3D';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';

const queryClient = new QueryClient();
const loadSwal = () => import('sweetalert2').then((m) => m.default);
const CART_TRANSLATIONS = { en: enTranslations.cart, ar: arTranslations.cart, fr: frTranslations.cart };
const getCartTranslation = (language, key) => CART_TRANSLATIONS[language]?.[key] || CART_TRANSLATIONS.en?.[key] || key;

/* Small top-right toast (replaces the big centred dialogs) */
const showToast = async (icon, title, timer = 2500) => {
  const Swal = await loadSwal();
  Swal.fire({ toast: true, position: 'top-end', icon, title, timer, timerProgressBar: true, showConfirmButton: false });
};

const authHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export function prefetchCart(token) {
  if (!token) return;
  queryClient.prefetchQuery({
    queryKey: ['cartItems'],
    queryFn: async () => (await api.get('/api/cart', authHeaders(token))).data.items || [],
    staleTime: 15000,
  });
  queryClient.prefetchQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await api.get('/api/users/addresses', authHeaders(token))).data.content || [],
    staleTime: 5 * 60 * 1000,
  });
}

const getValidToken = () => {
  const tk = readStorage('authToken');
  if (!tk || !tk.trim()) return null;
  try { const d = jwtDecode(tk); return d?.exp && d.exp > Date.now() / 1000 ? tk : null; } catch { return null; }
};

/* ───────────── pieces ───────────── */
const CartSkeleton = memo(({ darkMode }) => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => <div key={i} className={`h-24 animate-pulse rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />)}
  </div>
));

const StepIndicator = memo(({ current, t, darkMode }) => {
  const steps = [
    { id: 'cart', Icon: FiShoppingCart, label: t('cart') },
    { id: 'checkout', Icon: FiMapPin, label: t('delivery') },
    { id: 'complete', Icon: FiCheck, label: t('done') },
  ];
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <ol className="mt-5 flex select-none items-center px-2" aria-label="Checkout progress">
      {steps.map((s, i) => {
        const reached = i <= idx;
        return (
          <React.Fragment key={s.id}>
            <li className="flex flex-col items-center gap-1" aria-current={i === idx ? 'step' : undefined}>
              {reached ? (
                <Chip3D className="h-9 w-9">{i < idx ? <FiCheck className="h-4 w-4" /> : <s.Icon className="h-4 w-4" />}</Chip3D>
              ) : (
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'}`}><s.Icon className="h-4 w-4" /></span>
              )}
              <span className={`text-[10px] font-semibold ${reached ? 'text-emerald-500' : 'text-gray-400'}`}>{s.label}</span>
            </li>
            {i < steps.length - 1 && <span className={`mx-1 mb-4 h-0.5 flex-1 rounded-full transition-colors duration-500 ${i < idx ? 'bg-emerald-500' : darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />}
          </React.Fragment>
        );
      })}
    </ol>
  );
});

const CartItem = memo(({ item, darkMode, onUpdate, onRemove, t }) => {
  const src = safeImageUrl(item.productImageUrl);
  return (
    <article className={`flex items-center gap-3 rounded-2xl border p-3 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
      <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl ${darkMode ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
        {src
          ? <img src={src} alt={item.productName} loading="lazy" width={64} height={64} referrerPolicy="no-referrer" className="h-full w-full object-contain p-1.5" />
          : <Chip3D className="h-10 w-10"><FiPackage className="h-5 w-5" /></Chip3D>}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className={`line-clamp-2 text-sm font-semibold leading-snug ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.productName}</h4>
        <p className={`mt-0.5 text-sm font-extrabold tabular-nums ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{money(item.productPrice)}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <Btn3D tone="soft" darkMode={darkMode} onClick={() => onUpdate(item.id, Number(item.quantity) - 1)} aria-label={t('decreaseQuantity')} className="h-8 w-8 text-base">−</Btn3D>
          <span className="w-7 text-center text-sm font-bold tabular-nums" aria-live="polite">{item.quantity}</span>
          <Btn3D tone="soft" darkMode={darkMode} onClick={() => onUpdate(item.id, Number(item.quantity) + 1)} aria-label={t('increaseQuantity')} className="h-8 w-8 text-base">+</Btn3D>
        </div>
      </div>

      <Btn3D tone="soft" darkMode={darkMode} onClick={() => onRemove(item.id)} aria-label={t('removeItem')} className="h-9 w-9 flex-shrink-0 self-start">
        <FiTrash2 className="h-4 w-4 text-rose-500" />
      </Btn3D>
    </article>
  );
});

const PaymentOption = memo(({ value, selected, onSelect, Icon, title, subtitle, darkMode }) => (
  <button
    type="button" role="radio" aria-checked={selected} onClick={() => onSelect(value)}
    className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-start transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${
      selected ? 'border-emerald-500 bg-emerald-500/10' : darkMode ? 'border-gray-700 bg-gray-800 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-emerald-300'
    }`}
  >
    {selected
      ? <Chip3D className="h-10 w-10 flex-shrink-0"><Icon className="h-5 w-5" /></Chip3D>
      : <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}><Icon className="h-5 w-5" /></span>}
    <div className="min-w-0 flex-1">
      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
      <p className={`mt-0.5 truncate text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
    </div>
    <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-emerald-500 bg-emerald-500' : darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
      {selected && <FiCheck className="h-3 w-3 text-white" />}
    </span>
  </button>
));

/* ───────────── Cart drawer ───────────── */
const CartContent = memo(({ show, onClose, darkMode }) => {
  const language = useAppLanguage();
  const dir = languageDirection(language);
  const isRtl = dir === 'rtl';
  const t = useCallback((key) => getCartTranslation(language, key), [language]);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // re-read whenever the drawer opens, so logging in/out is picked up
  const token = useMemo(() => getValidToken(), [show]); // eslint-disable-line react-hooks/exhaustive-deps
  const isAuthenticated = !!token;

  const { data: cartItems = [], isLoading: isCartLoading } = useQuery({
    queryKey: ['cartItems'],
    queryFn: async () => (await api.get('/api/cart', authHeaders(token))).data.items || [],
    enabled: isAuthenticated,
    staleTime: 15000,
  });
  const { data: addresses = [], isLoading: isAddressLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await api.get('/api/users/addresses', authHeaders(token))).data.content || [],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const refresh = () => qc.invalidateQueries({ queryKey: ['cartItems'] });
    window.addEventListener('cart:updated', refresh);
    return () => window.removeEventListener('cart:updated', refresh);
  }, [isAuthenticated, qc]);

  useEffect(() => { if (show && isAuthenticated) qc.invalidateQueries({ queryKey: ['cartItems'] }); }, [show, isAuthenticated, qc]);
  useEffect(() => { if (addresses.length > 0 && !selectedAddress) setSelectedAddress(addresses[0].id); }, [addresses, selectedAddress]);

  const cartTotal = useMemo(() => cartItems.reduce((sum, i) => sum + (Number(i.productPrice) || 0) * (Number(i.quantity) || 1), 0), [cartItems]);

  const handleClose = useCallback(() => {
    onClose();
    setShowDropdown(false);
    setTimeout(() => { setCheckoutStep('cart'); setPaymentMethod(''); }, 300);
  }, [onClose]);

  // Escape closes, background scroll locked while open
  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => e.key === 'Escape' && handleClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [show, handleClose]);

  /* mutations with optimistic updates + rollback */
  const rollback = (ctx) => { if (ctx?.previousCart) qc.setQueryData(['cartItems'], ctx.previousCart); };
  const optimistic = (updater) => async (arg) => {
    await qc.cancelQueries({ queryKey: ['cartItems'] });
    const previousCart = qc.getQueryData(['cartItems']);
    qc.setQueryData(['cartItems'], (old) => updater(old || [], arg));
    return { previousCart };
  };
  const settle = () => qc.invalidateQueries({ queryKey: ['cartItems'] });

  const updateQuantityMut = useMutation({
    mutationFn: ({ itemId, qty }) => api.put(`/api/cart/items/${itemId}`, { quantity: qty }, authHeaders(token)),
    onMutate: optimistic((old, { itemId, qty }) => old.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i))),
    onError: (e, v, ctx) => rollback(ctx),
    onSettled: settle,
  });
  const removeMut = useMutation({
    mutationFn: (itemId) => api.delete(`/api/cart/items/${itemId}`, authHeaders(token)),
    onMutate: optimistic((old, itemId) => old.filter((i) => i.id !== itemId)),
    onSuccess: () => showToast('success', t('removed'), 1500),
    onError: (e, v, ctx) => rollback(ctx),
    onSettled: settle,
  });
  const clearMut = useMutation({
    mutationFn: () => api.delete('/api/cart', authHeaders(token)),
    onMutate: optimistic(() => []),
    onError: (e, v, ctx) => rollback(ctx),
    onSettled: settle,
  });

  const updateQuantity = useCallback((itemId, qty) => {
    const n = Number(qty);
    if (n < 1) removeMut.mutate(itemId); else updateQuantityMut.mutate({ itemId, qty: n });
  }, [removeMut, updateQuantityMut]);
  const removeFromCart = useCallback((id) => removeMut.mutate(id), [removeMut]);
  const clearCart = useCallback(() => clearMut.mutate(), [clearMut]);

  const createOrder = useCallback(async () => {
    if (!isAuthenticated) {
      const Swal = await loadSwal();
      Swal.fire({ icon: 'info', title: t('loginRequired'), confirmButtonText: t('goToLogin') }).then(() => navigate('/login'));
      return;
    }
    if (!selectedAddress) { showToast('warning', t('selectAddressAlert'), 3000); return; }
    if (!paymentMethod) { showToast('warning', t('selectPayment'), 3000); return; }

    setIsProcessing(true);
    try {
      const orderRes = await api.post('/api/users/orders',
        { deliveryAddressId: selectedAddress, paymentMethod: paymentMethod === 'visa' ? 'CREDIT_CARD' : 'CASH' },
        authHeaders(token));
      const orderId = orderRes.data.id;

      if (paymentMethod === 'visa') {
        const payRes = await api.post(`/api/payments/order/card/${orderId}`, {}, authHeaders(token));
        const url = payRes.data?.paymentURL;
        if (typeof url === 'string' && /^https:\/\//i.test(url)) {
          showToast('success', t('redirectingPayment'));
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } else {
        showToast('success', `${t('orderConfirmed')} · #${orderId}`, 3500);
      }
      qc.setQueryData(['cartItems'], []);
      window.dispatchEvent(new Event('cart:updated'));
      setCheckoutStep('complete');
    } catch (err) {
      showToast('error', err.response?.data?.message || t('orderFailed'), 4000);
    } finally { setIsProcessing(false); }
  }, [token, isAuthenticated, selectedAddress, paymentMethod, navigate, qc, t]);

  const selectedAddr = useMemo(() => addresses.find((a) => a.id === selectedAddress), [addresses, selectedAddress]);

  if (!show) return null;

  const loading = (isCartLoading || isAddressLoading) && checkoutStep !== 'complete';
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const headIcon = checkoutStep === 'cart' ? FiShoppingCart : checkoutStep === 'checkout' ? FiTruck : FiCheck;
  const HeadIcon = headIcon;
  const canOrder = paymentMethod && selectedAddress && !isProcessing;

  return (
    <div dir={dir} className={`fixed inset-0 z-50 flex justify-end ${language === 'ar' ? 'font-cairo' : 'font-poppins'}`} role="dialog" aria-modal="true" aria-label={t('yourCart')}>
      <Defs3D />
      <Device3DStyles />
      <div className="anim-fade-in fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <aside
        className={`anim-slide-in relative flex h-full w-full max-w-md flex-col shadow-2xl ${darkMode ? 'border-s border-emerald-900/60 bg-gray-900 text-white' : 'border-s border-emerald-100 bg-gray-50 text-gray-900'}`}
        style={{ '--from': isRtl ? '-100%' : '100%' }}
      >
        {/* header */}
        <div className={`flex-shrink-0 border-b px-4 pb-4 pt-5 sm:px-6 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-emerald-100 bg-white'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Chip3D className="h-11 w-11 flex-shrink-0"><HeadIcon className="h-5 w-5" /></Chip3D>
              <div>
                <h2 className="text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
                  {checkoutStep === 'cart' ? t('yourCart') : checkoutStep === 'checkout' ? t('checkout') : t('orderConfirmed')}
                </h2>
                <p className={`mt-0.5 text-xs ${muted}`}>
                  {checkoutStep === 'cart' ? `${cartItems.length} ${cartItems.length !== 1 ? t('items') : t('item')}` : checkoutStep === 'checkout' ? t('almostThere') : t('thankYou')}
                </p>
              </div>
            </div>
            <Btn3D tone="soft" darkMode={darkMode} onClick={handleClose} aria-label="Close cart" className="h-10 w-10 flex-shrink-0"><FiX className="h-5 w-5" /></Btn3D>
          </div>

          {(cartItems.length > 0 || checkoutStep === 'complete') && <StepIndicator current={checkoutStep} t={t} darkMode={darkMode} />}

          <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${darkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
            <FiZap className="h-3 w-3" /> {t('secure')}
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? <CartSkeleton darkMode={darkMode} /> : (
            <>
              {checkoutStep === 'cart' && (
                cartItems.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <DeviceScene className="h-32 w-44" />
                    <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{t('empty')}</p>
                    <p className={`text-sm ${muted}`}>{t('addProducts')}</p>
                    <Btn3D onClick={handleClose} className="mt-2 px-6 py-3 text-sm">{t('browseDevices')}</Btn3D>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => <CartItem key={item.id} item={item} darkMode={darkMode} onUpdate={updateQuantity} onRemove={removeFromCart} t={t} />)}
                  </div>
                )
              )}

              {checkoutStep === 'checkout' && (
                <div className="space-y-6">
                  <button type="button" onClick={() => setCheckoutStep('cart')}
                    className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${darkMode ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-500 hover:text-emerald-600'}`}>
                    <span className={isRtl ? 'rotate-180' : ''}>←</span> {t('backToCart')}
                  </button>

                  <section>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><FiMapPin className="h-4 w-4 text-emerald-500" /> {t('deliveryAddress')}</h3>
                    <div className="relative">
                      <button type="button" onClick={() => setShowDropdown((v) => !v)} aria-expanded={showDropdown}
                        className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-start text-sm transition-colors ${
                          showDropdown ? 'border-emerald-500' : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-emerald-300'
                        } ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
                        <span className="me-2 flex-1 truncate">{selectedAddr ? `${selectedAddr.street}, ${selectedAddr.city}` : t('selectAddress')}</span>
                        <FiChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${showDropdown ? 'rotate-180' : ''} ${muted}`} />
                      </button>
                      {showDropdown && (
                        <div className={`anim-fade-in absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border shadow-lg ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                          {addresses.length > 0 ? addresses.map((addr) => (
                            <button key={addr.id} type="button" onClick={() => { setSelectedAddress(addr.id); setShowDropdown(false); }}
                              className={`flex w-full items-center justify-between px-4 py-3 text-start text-sm transition-colors ${
                                selectedAddress === addr.id
                                  ? darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                                  : darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                              }`}>
                              <span className="me-2 flex-1 truncate">{addr.street}, {addr.city}</span>
                              {selectedAddress === addr.id && <FiCheck className="h-4 w-4 flex-shrink-0 text-emerald-500" />}
                            </button>
                          )) : <div className="px-4 py-6 text-center text-sm text-gray-400">{t('noAddresses')}</div>}
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><FiCreditCard className="h-4 w-4 text-emerald-500" /> {t('paymentMethod')}</h3>
                    <div className="space-y-3" role="radiogroup" aria-label={t('paymentMethod')}>
                      <PaymentOption value="cod" selected={paymentMethod === 'cod'} onSelect={setPaymentMethod} Icon={FiTruck} title={t('cashOnDelivery')} subtitle={t('payOnReceive')} darkMode={darkMode} />
                      <PaymentOption value="visa" selected={paymentMethod === 'visa'} onSelect={setPaymentMethod} Icon={FiCreditCard} title={t('card')} subtitle={t('secureGateway')} darkMode={darkMode} />
                    </div>
                  </section>

                  <section className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
                    <p className={`mb-3 text-[11px] font-bold uppercase tracking-wide ${muted}`}>{t('orderSummary')}</p>
                    <div className="space-y-1.5 text-sm">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between gap-2">
                          <span className={`truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.productName} ×{item.quantity}</span>
                          <span className={`flex-shrink-0 tabular-nums ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{money((Number(item.productPrice) || 0) * (Number(item.quantity) || 1))}</span>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-3 flex items-center justify-between border-t pt-3 text-base font-extrabold ${darkMode ? 'border-gray-700 text-emerald-400' : 'border-gray-100 text-emerald-700'}`}>
                      <span>{t('total')}</span><span className="tabular-nums">{money(cartTotal)}</span>
                    </div>
                  </section>
                </div>
              )}

              {checkoutStep === 'complete' && (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="relative">
                    <DeviceScene className="h-32 w-44" />
                    <Chip3D className="absolute -bottom-2 start-1/2 h-14 w-14 -translate-x-1/2 rtl:translate-x-1/2"><FiCheck className="h-7 w-7" /></Chip3D>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-extrabold tracking-tight">{t('orderConfirmed')}</h3>
                    <p className={`mt-2 text-sm ${muted}`}>{t('orderConfirmedMessage')}</p>
                  </div>
                  <p className={`w-full rounded-2xl border p-4 text-sm ${darkMode ? 'border-emerald-900/70 bg-emerald-950/40 text-gray-300' : 'border-emerald-200 bg-emerald-50 text-gray-700'}`}>{t('orderPreparing')}</p>
                  <Btn3D onClick={handleClose} className="w-full py-3.5 text-sm">{t('continueShopping')}</Btn3D>
                </div>
              )}
            </>
          )}
        </div>

        {/* sticky footer */}
        {!loading && checkoutStep === 'cart' && cartItems.length > 0 && (
          <div className={`flex-shrink-0 border-t p-4 sm:p-5 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-emerald-100 bg-white'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('subtotal')}</span>
              <span className={`text-xl font-extrabold tabular-nums ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{money(cartTotal)}</span>
            </div>
            <p className={`mt-0.5 text-xs ${muted}`}>{t('deliveryFees')}</p>
            <div className="mt-4 flex gap-3">
              <Btn3D onClick={() => setCheckoutStep('checkout')} className="flex-1 py-3.5 text-sm"><FiTruck className="h-4 w-4" /> {t('checkout')}</Btn3D>
              <Btn3D tone="soft" darkMode={darkMode} onClick={clearCart} aria-label="Clear cart" className="w-12 flex-shrink-0"><FiTrash2 className="h-4 w-4 text-rose-500" /></Btn3D>
            </div>
          </div>
        )}
        {!loading && checkoutStep === 'checkout' && (
          <div className={`flex-shrink-0 border-t p-4 sm:p-5 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-emerald-100 bg-white'}`}>
            <Btn3D onClick={createOrder} disabled={!canOrder} className="w-full py-3.5 text-sm">
              {isProcessing
                ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> {t('processing')}</>
                : <><FiCheck className="h-5 w-5" /> {t('placeOrder')} · {money(cartTotal)}</>}
            </Btn3D>
          </div>
        )}
      </aside>
    </div>
  );
});

const Cart = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <CartContent {...props} />
  </QueryClientProvider>
));

export default Cart;