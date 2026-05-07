import React, { useState, useEffect, useCallback,useMemo,memo } from 'react';
import {
  FiX, FiShoppingCart, FiCreditCard, FiTruck, FiTrash2,
  FiZap, FiChevronDown, FiCheck, FiMapPin, FiPackage,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api';




const STEPS = [
  { id: 'cart',     Icon: FiShoppingCart, label: 'Cart'     },
  { id: 'checkout', Icon: FiMapPin,        label: 'Delivery' },
  { id: 'complete', Icon: FiCheck,         label: 'Done'     },
];

const StepIndicator = React.memo(({ current }) => {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center justify-center gap-0 mt-5 mb-1 px-2 select-none">
      {STEPS.map((step, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={active ? { scale: [1, 1.12, 1] } : {}}
                transition={{ duration: 0.5, repeat: active ? Infinity : 0, repeatDelay: 2 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all duration-300 ${
                  done   ? 'bg-lime-500 text-white'
                  : active ? 'bg-gradient-to-br from-lime-400 to-emerald-600 text-white ring-2 ring-lime-400/40'
                           : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                }`}
              >
                {done ? <FiCheck className="w-4 h-4" /> : <step.Icon className="w-4 h-4" />}
              </motion.div>
              <span className={`text-[10px] font-semibold ${
                active ? 'text-lime-500 dark:text-lime-400' : done ? 'text-lime-400' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 rounded-full transition-all duration-500 ${
                i < currentIdx ? 'bg-lime-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});




const CartItem = React.memo(({ item, darkMode, onUpdate, onRemove }) => (
  <motion.div
    layout
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20, height: 0 }}
    transition={{ duration: 0.28 }}
    className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl mb-3 shadow-sm transition-colors ${
      darkMode ? 'bg-gray-800/60 border border-gray-700/60' : 'bg-white/70 border border-gray-100'
    }`}
  >


    {item.productImageUrl ? (
      <img
        src={item.productImageUrl}
        alt={item.productName}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain bg-gray-100 dark:bg-gray-700 flex-shrink-0"
      />
    ) : (
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-lime-100 to-emerald-100 dark:from-lime-900/30 dark:to-emerald-900/30 flex-shrink-0 flex items-center justify-center">
        <FiPackage className="w-5 h-5 sm:w-6 sm:h-6 text-lime-500" />
      </div>
    )}

    
    

    <div className="flex-1 min-w-0">
      <h4 className={`font-semibold text-xs sm:text-sm truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        {item.productName}
      </h4>
      <p className={`text-xs font-bold mt-0.5 ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
        EGP {item.productPrice?.toFixed(2)}
      </p>
    </div>

   
   

    <div className="flex items-center gap-1 flex-shrink-0">
      <button
        onClick={() => onUpdate(item.id, Number(item.quantity) - 1)}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-lime-500 hover:text-white transition-colors text-sm font-bold flex items-center justify-center flex-shrink-0"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-6 sm:w-7 text-center text-xs sm:text-sm font-bold flex-shrink-0">
        {item.quantity}
      </span>
      <button
        onClick={() => onUpdate(item.id, Number(item.quantity) + 1)}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-lime-500 hover:text-white transition-colors text-sm font-bold flex items-center justify-center flex-shrink-0"
        aria-label="Increase quantity"
      >
        +
      </button>
      <button
        onClick={() => onRemove(item.id)}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-500 hover:text-white transition-colors text-red-500 flex items-center justify-center flex-shrink-0 ml-0.5"
        aria-label="Remove item"
      >
        <FiTrash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      </button>
    </div>
  </motion.div>
));




const PaymentOption = React.memo(({ value, selected, onSelect, Icon, title, subtitle, darkMode }) => (
  <button
    onClick={() => onSelect(value)}
    className={`w-full p-3 sm:p-4 rounded-2xl border-2 flex items-center gap-3 sm:gap-4 transition-all text-left ${
      selected
        ? 'border-lime-500 bg-lime-50/70 dark:bg-lime-900/20 shadow-md shadow-lime-500/10'
        : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
    }`}
  >
    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
      selected ? 'bg-lime-500 text-white' : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
    }`}>
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`font-semibold text-xs sm:text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
      <p className={`text-xs mt-0.5 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>
    </div>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
      selected ? 'border-lime-500 bg-lime-500' : darkMode ? 'border-gray-600' : 'border-gray-300'
    }`}>
      {selected && <FiCheck className="w-3 h-3 text-white" />}
    </div>
  </button>
));




const Cart = ({ show, onClose, darkMode }) => {
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.productPrice * (item.quantity || 1)), 0);
  }, [cartItems]);

  const safeDecodeJwt = useCallback((token) => {
    if (!token || typeof token !== 'string' || !token.trim()) return null;
    try { return jwtDecode(token); } catch { return null; }
  }, []);

  const isTokenExpired = useCallback((token) => {
    const d = safeDecodeJwt(token);
    return !d || !d.exp || d.exp < Date.now() / 1000;
  }, [safeDecodeJwt]);

  const token = localStorage.getItem('authToken');
  const isAuthenticated = !!token && !isTokenExpired(token);

  const fetchCart = useCallback(async () => {
    if (!token || !isAuthenticated) { setCartItems([]); return; }
    const ctrl = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.get('/api/cart', { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal });
      const items = res.data.items || [];
      setCartItems(items);
    } catch (err) {
      if (err.name !== 'AbortError') { setCartItems([]); }
    } finally { setIsLoading(false); }
    return () => ctrl.abort();
  }, [token, isAuthenticated]);

  const fetchAddresses = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    const ctrl = new AbortController();
    try {
      const res = await api.get('/api/users/addresses', { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal });
      const list = res.data.content || [];
      setAddresses(list);
      if (list.length) setSelectedAddress(list[0].id);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
    return () => ctrl.abort();
  }, [token, isAuthenticated]);

  const updateQuantity = useCallback(async (itemId, qty) => {
    const newQty = Number(qty);
    if (newQty < 1) return removeFromCart(itemId);
    
    setCartItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQty } : i));

    try {
      await api.put(`/api/cart/items/${itemId}`, { quantity: newQty }, { 
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } 
      });
    } catch (err) {
      fetchCart();
    }
  }, [token, fetchCart]);

  const removeFromCart = useCallback(async (itemId) => {
    setCartItems(prev => prev.filter(i => i.id !== itemId));

    try {
      await api.delete(`/api/cart/items/${itemId}`, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ title: 'Removed', icon: 'success', toast: true, position: 'top-end', timer: 1200, showConfirmButton: false });
    } catch {
      fetchCart();
    }
  }, [token, fetchCart]);

  const clearCart = useCallback(async () => {
    setCartItems([]);
    try {
      await api.delete('/api/cart', { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      fetchCart();
    }
  }, [token, fetchCart]);

  const createOrder = useCallback(async () => {
    if (!isAuthenticated) {
      Swal.fire({ icon: 'info', title: 'Login Required', confirmButtonText: 'Go to Login' }).then(() => navigate('/login'));
      return;
    }
    if (!selectedAddress) { Swal.fire({ icon: 'warning', title: 'Select Address' }); return; }
    if (!paymentMethod)   { Swal.fire({ icon: 'warning', title: 'Select Payment Method' }); return; }

    setIsLoading(true);
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
        await Swal.fire({ icon: 'success', title: 'Order Confirmed!', text: `Order #${orderId} placed!`, confirmButtonColor: '#22c55e' });
      }
      setCartItems([]); setCheckoutStep('complete');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Order Failed', text: err.response?.data?.message || 'Something went wrong', confirmButtonColor: '#ef4444' });
    } finally { setIsLoading(false); }
  }, [token, isAuthenticated, selectedAddress, paymentMethod, navigate]);

  useEffect(() => {
    if (show && isAuthenticated) {
      Promise.all([fetchCart(), fetchAddresses()]).catch(console.error);
    } else if (show && !isAuthenticated) {
      setCartItems([]); setAddresses([]);
    }
  }, [show, isAuthenticated, fetchCart, fetchAddresses]);

  const handleClose = () => {
    onClose();
    setTimeout(() => { setCheckoutStep('cart'); setPaymentMethod(''); }, 300);
  };

  if (!show) return null;

  const selectedAddr = addresses.find((a) => a.id === selectedAddress);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      
      
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

     
     
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', ease: 'circOut', duration: 0.4 }}
        className={`relative w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col ${
          darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}
      >
        
        
        <div className={`relative overflow-hidden flex-shrink-0 ${
          darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-lime-50 to-emerald-50/60'
        } px-4 sm:px-6 pt-5 sm:pt-6 pb-4`}>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-lime-400/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <h2 className={`text-xl sm:text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {checkoutStep === 'cart'     ? 'Your Cart'
                 : checkoutStep === 'checkout' ? 'Checkout'
                 : 'Order Confirmed'}
              </h2>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {checkoutStep === 'cart'
                  ? `${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}`
                  : checkoutStep === 'checkout'
                  ? 'Almost there!'
                  : 'Thank you for your order'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className={`p-2 rounded-full shadow-md transition-colors flex-shrink-0 ${
                darkMode ? 'bg-gray-700/80 hover:bg-gray-600 text-gray-200' : 'bg-white/80 hover:bg-white text-gray-700'
              }`}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {cartItems.length > 0 && <StepIndicator current={checkoutStep} />}

          <div className={`flex items-center gap-2 mt-3 text-xs font-semibold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
            <FiZap className="w-3.5 h-3.5" />
            100% Secure & Encrypted
          </div>
        </div>

       
       
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto">
          {isLoading && checkoutStep !== 'complete' ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full"
              />
            </div>
          ) : (
            <AnimatePresence mode="wait">

             
             
              {checkoutStep === 'cart' && (
                <motion.div key="cart" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  {cartItems.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                      <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <FiShoppingCart className="w-9 h-9 text-gray-400" />
                      </div>
                      <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Your cart is empty</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add some products to get started</p>
                      <button
                        onClick={handleClose}
                        className="px-6 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-bold text-sm transition-colors"
                      >
                        Browse Devices
                      </button>
                    </div>
                  ) : (
                    <>
                      <AnimatePresence>
                        {cartItems.map((item) => (
                          <CartItem
                            key={item.id}
                            item={item}
                            darkMode={darkMode}
                            onUpdate={updateQuantity}
                            onRemove={removeFromCart}
                          />
                        ))}
                      </AnimatePresence>

                     
                     
                      <motion.div
                        layout
                        className={`mt-4 p-4 rounded-2xl ${darkMode ? 'bg-gray-800/60 border border-gray-700/60' : 'bg-white/70 border border-gray-100'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Subtotal</span>
                          <span className={`font-extrabold text-lg sm:text-xl ${darkMode ? 'text-lime-400' : 'text-lime-700'}`}>
                            EGP {cartTotal.toFixed(2)}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Delivery fees calculated at checkout
                        </p>
                      </motion.div>

                      
                      
                      <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-5">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setCheckoutStep('checkout')}
                          className="flex-1 py-3 sm:py-3.5 bg-gradient-to-r from-lime-500 to-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-lime-500/25 hover:shadow-lime-500/40 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                          <FiTruck className="w-4 h-4" /> Checkout
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={clearCart}
                          className="px-3 sm:px-4 py-3 sm:py-3.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl font-bold transition-all flex items-center gap-1.5 text-sm border border-red-500/30 hover:border-red-500 flex-shrink-0"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

            
            
              {checkoutStep === 'checkout' && (
                <motion.div
                  key="checkout"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5 sm:space-y-6"
                >
                  <button
                    onClick={() => setCheckoutStep('cart')}
                    className={`flex items-center gap-1.5 text-sm font-semibold ${darkMode ? 'text-gray-400 hover:text-lime-400' : 'text-gray-500 hover:text-lime-600'} transition-colors`}
                  >
                    ← Back to cart
                  </button>

                  
                  
                  <div>
                    <h3 className={`text-sm sm:text-base font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <FiMapPin className="w-4 h-4 text-lime-500 flex-shrink-0" /> Delivery Address
                    </h3>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowDropdown(!showDropdown)}
                        className={`w-full px-4 py-3 sm:py-3.5 rounded-2xl border-2 flex justify-between items-center text-left text-sm transition-all ${
                          showDropdown ? 'border-lime-500' : darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                        } ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                      >
                        <span className="truncate flex-1 mr-2">
                          {selectedAddr
                            ? `${selectedAddr.street}, ${selectedAddr.city}`
                            : 'Select delivery address'}
                        </span>
                        <FiChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      </button>

                      <AnimatePresence>
                        {showDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className={`absolute z-20 w-full mt-1 rounded-2xl shadow-xl border overflow-hidden max-h-52 overflow-y-auto ${
                              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                            }`}
                          >
                            {addresses.length > 0 ? addresses.map((addr) => (
                              <div
                                key={addr.id}
                                onClick={() => { setSelectedAddress(addr.id); setShowDropdown(false); }}
                                className={`px-4 py-3 flex items-center justify-between cursor-pointer text-sm transition-colors ${
                                  selectedAddress === addr.id
                                    ? darkMode ? 'bg-lime-900/30 text-lime-400' : 'bg-lime-50 text-lime-700'
                                    : darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <span className="truncate flex-1 mr-2">{addr.street}, {addr.city}</span>
                                {selectedAddress === addr.id && <FiCheck className="w-4 h-4 text-lime-500 flex-shrink-0" />}
                              </div>
                            )) : (
                              <div className="px-4 py-6 text-center text-sm text-gray-400">No addresses found</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                 
                 
                  <div>
                    <h3 className={`text-sm sm:text-base font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <FiCreditCard className="w-4 h-4 text-lime-500 flex-shrink-0" /> Payment Method
                    </h3>
                    <div className="space-y-3">
                      <PaymentOption value="cod" selected={paymentMethod === 'cod'} onSelect={setPaymentMethod}
                        Icon={FiTruck} title="Cash on Delivery" subtitle="Pay when you receive your order" darkMode={darkMode} />
                      <PaymentOption value="visa" selected={paymentMethod === 'visa'} onSelect={setPaymentMethod}
                        Icon={FiCreditCard} title="Credit / Debit Card" subtitle="Secure payment via gateway" darkMode={darkMode} />
                    </div>
                  </div>

                 
                 
                  <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-800/60 border border-gray-700/60' : 'bg-white/70 border border-gray-100'}`}>
                    <p className={`text-xs font-semibold mb-3 uppercase tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Order Summary</p>
                    <div className="space-y-1.5 text-xs sm:text-sm">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex justify-between gap-2">
                          <span className={`truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {item.productName} ×{item.quantity}
                          </span>
                          <span className={`flex-shrink-0 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            EGP {(item.productPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className={`flex justify-between items-center mt-3 pt-3 border-t font-extrabold text-sm sm:text-base ${darkMode ? 'border-gray-700 text-lime-400' : 'border-gray-100 text-lime-700'}`}>
                      <span>Total</span>
                      <span>EGP {cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                
                
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={createOrder}
                    disabled={!paymentMethod || !selectedAddress || isLoading}
                    className={`w-full py-3.5 sm:py-4 rounded-2xl font-extrabold text-white transition-all flex items-center justify-center gap-2 sm:gap-3 text-sm ${
                      paymentMethod && selectedAddress && !isLoading
                        ? 'bg-gradient-to-r from-lime-500 to-emerald-600 shadow-lg shadow-lime-500/25 hover:shadow-lime-500/40'
                        : 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Processing...
                      </>
                    ) : (
                      <><FiCheck className="w-5 h-5" /> Place Order · EGP {cartTotal.toFixed(2)}</>
                    )}
                  </motion.button>
                </motion.div>
              )}

              
              
              {checkoutStep === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-center py-12 space-y-5"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                    className="w-24 h-24 bg-gradient-to-br from-lime-400 to-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-xl shadow-lime-500/30"
                  >
                    <FiCheck className="w-12 h-12 text-white" />
                  </motion.div>
                  <div>
                    <h3 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Order Confirmed!</h3>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Thank you for shopping with Tech Bazaar.
                    </p>
                  </div>
                  <div className={`p-4 rounded-2xl text-sm ${darkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-lime-50 border border-lime-100'}`}>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Your order is being prepared and will be shipped soon. You'll receive a confirmation email shortly.
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-full py-3.5 bg-gradient-to-r from-lime-500 to-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-lime-500/30 transition-all"
                  >
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
};

export default memo(Cart);