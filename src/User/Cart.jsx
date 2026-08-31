import React, { useState, useEffect, useCallback, useMemo, memo, useTransition } from 'react';
import {
  FiX, FiShoppingCart, FiCreditCard, FiTruck, FiTrash2,
  FiZap, FiChevronDown, FiCheck, FiMapPin, FiPackage,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const loadSwal = () => import('sweetalert2').then((m) => m.default);

const EASE = [0.16, 1, 0.3, 1];

export function prefetchCart(token) {
  if (!token) return;
  queryClient.prefetchQuery({
    queryKey: ['cartItems'],
    queryFn: async () => {
      const res = await api.get('/api/cart', { headers: { Authorization: `Bearer ${token}` } });
      return res.data.items || [];
    },
    staleTime: 15000,
  });
  queryClient.prefetchQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await api.get('/api/users/addresses', { headers: { Authorization: `Bearer ${token}` } });
      return res.data.content || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

const palette = (darkMode) => ({
  line: darkMode ? '#34d399' : '#059669',
  fillSoft: darkMode ? 'rgba(52,211,153,0.14)' : 'rgba(52,211,153,0.1)',
  fillCard: darkMode ? '#0b1a12' : '#ffffff',
  cardBorder: darkMode ? 'rgba(52,211,153,0.25)' : 'rgba(5,150,105,0.18)',
  accent: '#f59e0b',
});

const GLASS_STRONG = 'backdrop-blur-2xl bg-white/85 dark:bg-gray-900/85 border-l border-black/10 dark:border-white/10';

const EmptyCartIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle cx="100" cy="102" r="72" fill={c.fillSoft}
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.g animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M60,90 L140,90 L132,150 Q131,158 123,158 L77,158 Q69,158 68,150 Z" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="3" />
        <path d="M78,90 L78,74 Q78,56 100,56 Q122,56 122,74 L122,90" fill="none" stroke={c.line} strokeWidth="4" strokeLinecap="round" />
        <circle cx="86" cy="172" r="7" fill="none" stroke={c.line} strokeWidth="3" />
        <circle cx="114" cy="172" r="7" fill="none" stroke={c.line} strokeWidth="3" />
      </motion.g>
      {[{ x: 44, y: 60, s: 6, d: 0 }, { x: 156, y: 70, s: 8, d: 0.4 }, { x: 150, y: 140, s: 5, d: 0.8 }].map((sp, i) => (
        <motion.circle key={i} cx={sp.x} cy={sp.y} r={sp.s} fill="none" stroke={c.accent} strokeWidth="2"
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.15, 0.8] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: sp.d }} />
      ))}
    </svg>
  );
});

const OrderConfirmedIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle cx="100" cy="100" r="76" fill={c.fillSoft}
        animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <circle cx="100" cy="100" r="50" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="3" />
      <motion.path d="M76,101 L93,118 L126,80" fill="none" stroke={c.line} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1.8, ease: EASE }} />
      {[{ x: 40, y: 50, s: 6, d: 0 }, { x: 160, y: 60, s: 8, d: 0.4 }, { x: 150, y: 150, s: 5, d: 0.8 }, { x: 44, y: 150, s: 7, d: 1.2 }].map((sp, i) => (
        <motion.path key={i}
          d={`M${sp.x} ${sp.y - sp.s} L${sp.x + sp.s * 0.3} ${sp.y - sp.s * 0.3} L${sp.x + sp.s} ${sp.y} L${sp.x + sp.s * 0.3} ${sp.y + sp.s * 0.3} L${sp.x} ${sp.y + sp.s} L${sp.x - sp.s * 0.3} ${sp.y + sp.s * 0.3} L${sp.x - sp.s} ${sp.y} L${sp.x - sp.s * 0.3} ${sp.y - sp.s * 0.3} Z`}
          fill={c.accent}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: sp.d }}
        />
      ))}
    </svg>
  );
});

const CartSkeleton = memo(({ darkMode }) => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className={`h-20 sm:h-24 animate-pulse border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`} />
    ))}
  </div>
));

const STEPS = [
  { id: 'cart', Icon: FiShoppingCart, label: 'Cart' },
  { id: 'checkout', Icon: FiMapPin, label: 'Delivery' },
  { id: 'complete', Icon: FiCheck, label: 'Done' },
];

const StepIndicator = memo(({ current }) => {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center justify-center gap-0 mt-5 mb-1 px-2 select-none">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300 ${
                done ? 'bg-emerald-500 border-emerald-500 text-white'
                  : active ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-transparent border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500'
              }`}>
                {done ? <FiCheck className="w-4 h-4" /> : <step.Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-semibold ${active ? 'text-emerald-500' : done ? 'text-emerald-500' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 transition-colors duration-500 ${i < currentIdx ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});

const CartItem = memo(({ item, darkMode, onUpdate, onRemove }) => (
  <motion.div
    layout="position"
    initial={{ opacity: 0, x: 12 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.16 }}
    className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 mb-3 border ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-200'}`}
  >
    {item.productImageUrl ? (
      <img src={item.productImageUrl} alt={item.productName} loading="lazy" width={56} height={56}
        className="w-12 h-12 sm:w-14 sm:h-14 object-contain bg-gray-50 dark:bg-gray-700 flex-shrink-0" />
    ) : (
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 dark:bg-emerald-900/30 flex-shrink-0 flex items-center justify-center">
        <FiPackage className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
      </div>
    )}

    <div className="flex-1 min-w-0">
      <h4 className={`font-semibold text-xs sm:text-sm truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{item.productName}</h4>
      <p className={`text-xs font-bold mt-0.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>EGP {item.productPrice?.toFixed(2)}</p>
    </div>

    <div className="flex items-center gap-1 flex-shrink-0">
      <button onClick={() => onUpdate(item.id, Number(item.quantity) - 1)}
        className="w-7 h-7 sm:w-8 sm:h-8 border bg-gray-100 dark:bg-gray-700 dark:border-gray-600 hover:bg-emerald-500 hover:text-white transition-colors duration-150 text-sm font-bold flex items-center justify-center flex-shrink-0"
        aria-label="Decrease quantity">−</button>
      <span className="w-6 sm:w-7 text-center text-xs sm:text-sm font-bold flex-shrink-0">{item.quantity}</span>
      <button onClick={() => onUpdate(item.id, Number(item.quantity) + 1)}
        className="w-7 h-7 sm:w-8 sm:h-8 border bg-gray-100 dark:bg-gray-700 dark:border-gray-600 hover:bg-emerald-500 hover:text-white transition-colors duration-150 text-sm font-bold flex items-center justify-center flex-shrink-0"
        aria-label="Increase quantity">+</button>
      <button onClick={() => onRemove(item.id)}
        className="w-7 h-7 sm:w-8 sm:h-8 border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 hover:bg-red-500 hover:text-white transition-colors duration-150 text-red-500 flex items-center justify-center flex-shrink-0 ml-0.5"
        aria-label="Remove item"><FiTrash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
    </div>
  </motion.div>
));

const PaymentOption = memo(({ value, selected, onSelect, Icon, title, subtitle, darkMode }) => (
  <button onClick={() => onSelect(value)}
    className={`w-full p-3 sm:p-4 border-2 flex items-center gap-3 sm:gap-4 transition-colors duration-150 text-left ${
      selected ? 'border-emerald-500 bg-emerald-500/10' : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
    }`}>
    <div className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-colors duration-150 flex-shrink-0 ${
      selected ? 'bg-emerald-500 text-white' : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
    }`}><Icon className="w-4 h-4 sm:w-5 sm:h-5" /></div>
    <div className="flex-1 min-w-0">
      <p className={`font-semibold text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
      <p className={`text-xs mt-0.5 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
    </div>
    <div className={`w-5 h-5 border-2 flex items-center justify-center transition-colors duration-150 flex-shrink-0 ${
      selected ? 'border-emerald-500 bg-emerald-500' : darkMode ? 'border-gray-600' : 'border-gray-300'
    }`}>{selected && <FiCheck className="w-3 h-3 text-white" />}</div>
  </button>
));

const CartContent = memo(({ show, onClose, darkMode }) => {
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [, startTransition] = useTransition();
  const navigate = useNavigate();
  const queryClientLocal = useQueryClient();

  const safeDecodeJwt = useCallback((token) => {
    if (!token || typeof token !== 'string' || !token.trim()) return null;
    try { return jwtDecode(token); } catch { return null; }
  }, []);

  const isTokenExpired = useCallback((token) => {
    const d = safeDecodeJwt(token);
    return !d || !d.exp || d.exp < Date.now() / 1000;
  }, [safeDecodeJwt]);

  const [token] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null));
  const isAuthenticated = !!token && !isTokenExpired(token);

  const { data: cartItems = [], isLoading: isCartLoading } = useQuery({
    queryKey: ['cartItems'],
    queryFn: async () => {
      const res = await api.get('/api/cart', { headers: { Authorization: `Bearer ${token}` } });
      return res.data.items || [];
    },
    enabled: isAuthenticated,
    staleTime: 15000,
  });

  const { data: addresses = [], isLoading: isAddressLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await api.get('/api/users/addresses', { headers: { Authorization: `Bearer ${token}` } });
      return res.data.content || [];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) setSelectedAddress(addresses[0].id);
  }, [addresses, selectedAddress]);

  const cartTotal = useMemo(() => cartItems.reduce((sum, item) => sum + (item.productPrice * (item.quantity || 1)), 0), [cartItems]);

  const updateQuantityMut = useMutation({
    mutationFn: ({ itemId, qty }) => api.put(`/api/cart/items/${itemId}`, { quantity: qty }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }),
    onMutate: async ({ itemId, qty }) => {
      await queryClientLocal.cancelQueries({ queryKey: ['cartItems'] });
      const previousCart = queryClientLocal.getQueryData(['cartItems']);
      queryClientLocal.setQueryData(['cartItems'], (old) => old?.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i)));
      return { previousCart };
    },
    onError: (err, vars, context) => queryClientLocal.setQueryData(['cartItems'], context.previousCart),
    onSettled: () => queryClientLocal.invalidateQueries({ queryKey: ['cartItems'] }),
  });

  const removeMut = useMutation({
    mutationFn: (itemId) => api.delete(`/api/cart/items/${itemId}`, { headers: { Authorization: `Bearer ${token}` } }),
    onMutate: async (itemId) => {
      await queryClientLocal.cancelQueries({ queryKey: ['cartItems'] });
      const previousCart = queryClientLocal.getQueryData(['cartItems']);
      queryClientLocal.setQueryData(['cartItems'], (old) => old?.filter((i) => i.id !== itemId));
      return { previousCart };
    },
    onSuccess: async () => {
      const Swal = await loadSwal();
      Swal.fire({ title: 'Removed', icon: 'success', toast: true, position: 'top-end', timer: 1200, showConfirmButton: false });
    },
    onError: (err, vars, context) => queryClientLocal.setQueryData(['cartItems'], context.previousCart),
    onSettled: () => queryClientLocal.invalidateQueries({ queryKey: ['cartItems'] }),
  });

  const clearMut = useMutation({
    mutationFn: () => api.delete('/api/cart', { headers: { Authorization: `Bearer ${token}` } }),
    onMutate: async () => {
      await queryClientLocal.cancelQueries({ queryKey: ['cartItems'] });
      const previousCart = queryClientLocal.getQueryData(['cartItems']);
      queryClientLocal.setQueryData(['cartItems'], []);
      return { previousCart };
    },
    onError: (err, vars, context) => queryClientLocal.setQueryData(['cartItems'], context.previousCart),
    onSettled: () => queryClientLocal.invalidateQueries({ queryKey: ['cartItems'] }),
  });

  const updateQuantity = useCallback((itemId, qty) => {
    startTransition(() => {
      const newQty = Number(qty);
      if (newQty < 1) removeMut.mutate(itemId);
      else updateQuantityMut.mutate({ itemId, qty: newQty });
    });
  }, [removeMut, updateQuantityMut]);

  const removeFromCart = useCallback((itemId) => startTransition(() => removeMut.mutate(itemId)), [removeMut]);
  const clearCart = useCallback(() => startTransition(() => clearMut.mutate()), [clearMut]);

  const createOrder = useCallback(async () => {
    const Swal = await loadSwal();
    if (!isAuthenticated) {
      Swal.fire({ icon: 'info', title: 'Login Required', confirmButtonText: 'Go to Login' }).then(() => navigate('/login'));
      return;
    }
    if (!selectedAddress) { Swal.fire({ icon: 'warning', title: 'Select Address' }); return; }
    if (!paymentMethod) { Swal.fire({ icon: 'warning', title: 'Select Payment Method' }); return; }

    setIsProcessing(true);
    try {
      const orderRes = await api.post('/api/users/orders',
        { deliveryAddressId: selectedAddress, paymentMethod: paymentMethod === 'visa' ? 'CREDIT_CARD' : 'CASH' },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      const orderId = orderRes.data.id;

      if (paymentMethod === 'visa') {
        const payRes = await api.post(`/api/payments/order/card/${orderId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        if (payRes.data.paymentURL) {
          Swal.fire({ icon: 'success', title: 'Redirecting to payment...', timer: 2000, showConfirmButton: false });
          window.open(payRes.data.paymentURL, '_blank');
        }
      } else {
        await Swal.fire({ icon: 'success', title: 'Order Confirmed!', text: `Order #${orderId} placed!`, confirmButtonColor: '#10b981' });
      }
      queryClientLocal.setQueryData(['cartItems'], []);
      setCheckoutStep('complete');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Order Failed', text: err.response?.data?.message || 'Something went wrong', confirmButtonColor: '#ef4444' });
    } finally { setIsProcessing(false); }
  }, [token, isAuthenticated, selectedAddress, paymentMethod, navigate, queryClientLocal]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => { setCheckoutStep('cart'); setPaymentMethod(''); }, 300);
  }, [onClose]);

  const selectedAddr = useMemo(() => addresses.find((a) => a.id === selectedAddress), [addresses, selectedAddress]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.24 }}
        className={`relative w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col ${GLASS_STRONG} ${darkMode ? 'text-white' : 'text-gray-900'}`}>

        <div className={`relative flex-shrink-0 border-b px-4 sm:px-6 pt-5 sm:pt-6 pb-4 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className={`text-xl sm:text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {checkoutStep === 'cart' ? 'Your Cart' : checkoutStep === 'checkout' ? 'Checkout' : 'Order Confirmed'}
              </h2>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {checkoutStep === 'cart'
                  ? `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}`
                  : checkoutStep === 'checkout' ? 'Almost there!' : 'Thank you for your order'}
              </p>
            </div>
            <button onClick={handleClose}
              className={`p-2 border transition-colors duration-150 flex-shrink-0 ${darkMode ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-200' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'}`}>
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {cartItems.length > 0 && <StepIndicator current={checkoutStep} />}

          <div className={`flex items-center gap-2 mt-3 text-xs font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
            <FiZap className="w-3.5 h-3.5" /> 100% Secure & Encrypted
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
          {(isCartLoading || isAddressLoading) && checkoutStep !== 'complete' ? (
            <div className="w-full"><CartSkeleton darkMode={darkMode} /></div>
          ) : (
            <AnimatePresence mode="wait">
              {checkoutStep === 'cart' && (
                <motion.div key="cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                  {cartItems.length === 0 ? (
                    <div className="text-center py-10 space-y-4">
                      <div className="w-36 h-36 mx-auto"><EmptyCartIllustration darkMode={darkMode} /></div>
                      <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Your cart is empty</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add some products to get started</p>
                      <button onClick={handleClose} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors duration-150">
                        Browse Devices
                      </button>
                    </div>
                  ) : (
                    <>
                      <AnimatePresence initial={false}>
                        {cartItems.map((item) => (
                          <CartItem key={item.id} item={item} darkMode={darkMode} onUpdate={updateQuantity} onRemove={removeFromCart} />
                        ))}
                      </AnimatePresence>

                      <div className={`mt-4 p-4 border ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-emerald-50 border-emerald-200'}`}>
                        <div className="flex justify-between items-center">
                          <span className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Subtotal</span>
                          <span className={`font-extrabold text-lg sm:text-xl tabular-nums ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>EGP {cartTotal.toFixed(2)}</span>
                        </div>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Delivery fees calculated at checkout</p>
                      </div>

                      <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-5">
                        <button onClick={() => setCheckoutStep('checkout')}
                          className="flex-1 py-3 sm:py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors duration-150 flex items-center justify-center gap-2 text-sm">
                          <FiTruck className="w-4 h-4" /> Checkout
                        </button>
                        <button onClick={clearCart}
                          className="px-3 sm:px-4 py-3 sm:py-3.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white font-bold transition-colors duration-150 flex items-center gap-1.5 text-sm border border-red-200 hover:border-red-500 flex-shrink-0">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {checkoutStep === 'checkout' && (
                <motion.div key="checkout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="space-y-5 sm:space-y-6">
                  <button onClick={() => setCheckoutStep('cart')}
                    className={`flex items-center gap-1.5 text-sm font-semibold transition-colors duration-150 ${darkMode ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-500 hover:text-emerald-600'}`}>
                    ← Back to cart
                  </button>

                  <div>
                    <h3 className={`text-sm sm:text-base font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <FiMapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Delivery Address
                    </h3>
                    <div className="relative">
                      <button type="button" onClick={() => setShowDropdown(!showDropdown)}
                        className={`w-full px-4 py-3 sm:py-3.5 border-2 flex justify-between items-center text-left text-sm transition-colors duration-150 ${
                          showDropdown ? 'border-emerald-500' : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                        } ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
                        <span className="truncate flex-1 mr-2">{selectedAddr ? `${selectedAddr.street}, ${selectedAddr.city}` : 'Select delivery address'}</span>
                        <FiChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 ${showDropdown ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      </button>

                      <AnimatePresence>
                        {showDropdown && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                            className={`absolute z-20 w-full mt-1 border overflow-hidden max-h-52 overflow-y-auto ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            {addresses.length > 0 ? addresses.map((addr) => (
                              <div key={addr.id} onClick={() => { setSelectedAddress(addr.id); setShowDropdown(false); }}
                                className={`px-4 py-3 flex items-center justify-between cursor-pointer text-sm transition-colors duration-150 ${
                                  selectedAddress === addr.id
                                    ? darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                                    : darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                                }`}>
                                <span className="truncate flex-1 mr-2">{addr.street}, {addr.city}</span>
                                {selectedAddress === addr.id && <FiCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                              </div>
                            )) : <div className="px-4 py-6 text-center text-sm text-gray-400">No addresses found</div>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-sm sm:text-base font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <FiCreditCard className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Payment Method
                    </h3>
                    <div className="space-y-3">
                      <PaymentOption value="cod" selected={paymentMethod === 'cod'} onSelect={setPaymentMethod} Icon={FiTruck} title="Cash on Delivery" subtitle="Pay when you receive your order" darkMode={darkMode} />
                      <PaymentOption value="visa" selected={paymentMethod === 'visa'} onSelect={setPaymentMethod} Icon={FiCreditCard} title="Credit / Debit Card" subtitle="Secure payment via gateway" darkMode={darkMode} />
                    </div>
                  </div>

                  <div className={`p-4 border ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-semibold mb-3 uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Order Summary</p>
                    <div className="space-y-1.5 text-xs sm:text-sm">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between gap-2">
                          <span className={`truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.productName} ×{item.quantity}</span>
                          <span className={`flex-shrink-0 tabular-nums ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>EGP {(item.productPrice * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className={`flex justify-between items-center mt-3 pt-3 border-t font-extrabold text-sm sm:text-base ${darkMode ? 'border-gray-700 text-emerald-400' : 'border-gray-200 text-emerald-700'}`}>
                      <span>Total</span><span className="tabular-nums">EGP {cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button onClick={createOrder} disabled={!paymentMethod || !selectedAddress || isProcessing}
                    className={`w-full py-3.5 sm:py-4 font-extrabold text-white transition-colors duration-150 flex items-center justify-center gap-2 sm:gap-3 text-sm ${
                      paymentMethod && selectedAddress && !isProcessing ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                    }`}>
                    {isProcessing ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        Processing...
                      </>
                    ) : (
                      <><FiCheck className="w-5 h-5" /> Place Order · EGP {cartTotal.toFixed(2)}</>
                    )}
                  </button>
                </motion.div>
              )}

              {checkoutStep === 'complete' && (
                <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }} className="text-center py-8 space-y-5">
                  <div className="w-36 h-36 mx-auto"><OrderConfirmedIllustration darkMode={darkMode} /></div>
                  <div>
                    <h3 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Order Confirmed!</h3>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Thank you for shopping with Tech Restore.</p>
                  </div>
                  <div className={`p-4 border text-sm ${darkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-emerald-50 border-emerald-200'}`}>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Your order is being prepared and will be shipped soon. You'll receive a confirmation email shortly.</p>
                  </div>
                  <button onClick={handleClose} className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors duration-150">
                    Continue Shopping
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
});

const Cart = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <CartContent {...props} />
  </QueryClientProvider>
));

export default Cart;