import React, { useState, useEffect, useCallback } from "react";
import { FiX, FiShoppingCart, FiCreditCard, FiTruck, FiTrash2, FiStar, FiUsers, FiZap, FiChevronDown, FiCheck } from "react-icons/fi";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../api";

const Cart = ({ show, onClose, darkMode  }) => {
  const [checkoutStep, setCheckoutStep] = useState("cart");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cartTotal, setCartTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(true);

  const navigate = useNavigate();

  /* ------------------------------------------------------------------ */
  /*  SAFE JWT DECODE                                                   */
  /* ------------------------------------------------------------------ */
  const safeDecodeJwt = useCallback((token) => {
    if (!token || typeof token !== "string" || token.trim() === "") return null;
    try { return jwtDecode(token); } catch { return null; }
  }, []);

  const isTokenExpired = useCallback((token) => {
    const decoded = safeDecodeJwt(token);
    return !decoded || !decoded.exp || decoded.exp < Date.now() / 1000;
  }, [safeDecodeJwt]);

  const token = localStorage.getItem("authToken");
  const decodedToken = token ? safeDecodeJwt(token) : null;
  const userId = decodedToken?.userId || null;
  const isAuthenticated = !!token && !isTokenExpired(token);

  /* ------------------------------------------------------------------ */
  /*  CALCULATE TOTAL                                                   */
  /* ------------------------------------------------------------------ */
  const calculateTotal = useCallback((items) => {
    const total = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
    setCartTotal(total);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  FETCH CART                                                        */
  /* ------------------------------------------------------------------ */
  const fetchCart = useCallback(async () => {
    if (!token || !isAuthenticated) { setCartItems([]); return; }

    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.get("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      const items = res.data.items || [];
      setCartItems(items);
      calculateTotal(items);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching cart:", err.response?.data || err.message);
        setCartItems([]);
        calculateTotal([]);
        Swal.fire({ title: 'Error', text: 'Failed to load cart!', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [token, isAuthenticated, calculateTotal]);

  /* ------------------------------------------------------------------ */
  /*  ADD TO CART                                                       */
  /* ------------------------------------------------------------------ */
  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      Swal.fire({ icon: "info", title: "Login Required", text: "Please log in to add items to cart", confirmButtonText: "Go to Login" })
        .then(() => navigate("/login"));
      return;
    }

    const placeholder = { id: Date.now(), productId, quantity, productName: "Loading...", productPrice: 0 };
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === productId);
      return existing
        ? prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev, placeholder];
    });

    try {
      const res = await api.post("/api/cart/items", { productId, quantity }, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      setCartItems(res.data.items || []);
      calculateTotal(res.data.items || []);
    } catch (err) {
      console.error("Error adding to cart:", err.response?.data || err.message);
      fetchCart();
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Failed to add item", customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" } });
    }
  }, [token, isAuthenticated, darkMode, navigate, calculateTotal, fetchCart]);

  /* ------------------------------------------------------------------ */
  /*  UPDATE QUANTITY                                                   */
  /* ------------------------------------------------------------------ */
  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    if (newQuantity < 1) return removeFromCart(itemId);
    const prevItems = [...cartItems];
    setCartItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i));
    calculateTotal(cartItems.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i));

    try {
      await api.put(`/api/cart/items/${itemId}`, { quantity: newQuantity }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Error updating quantity:", err.response?.data || err.message);
      setCartItems(prevItems);
      calculateTotal(prevItems);
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Failed to update quantity", customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" } });
    }
  }, [token, cartItems, calculateTotal]);

  /* ------------------------------------------------------------------ */
  /*  REMOVE FROM CART                                                  */
  /* ------------------------------------------------------------------ */
  const removeFromCart = useCallback(async (itemId) => {
    const prevItems = [...cartItems];
    setCartItems(prev => prev.filter(i => i.id !== itemId));
    calculateTotal(cartItems.filter(i => i.id !== itemId));

    try {
      await api.delete(`/api/cart/items/${itemId}`, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ title: 'Success', text: 'Item removed!', icon: 'success', toast: true, position: 'top-start', timer: 1500 });
    } catch (err) {
      console.error("Error removing item:", err.response?.data || err.message);
      setCartItems(prevItems);
      calculateTotal(prevItems);
      Swal.fire({ title: 'Error', text: 'Failed to remove item!', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [token, cartItems, calculateTotal]);

  /* ------------------------------------------------------------------ */
  /*  CLEAR CART                                                        */
  /* ------------------------------------------------------------------ */
  const clearCart = useCallback(async () => {
    const prevItems = [...cartItems];
    setCartItems([]);
    setCartTotal(0);

    try {
      await api.delete("/api/cart", { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ icon: "success", title: "Success", text: "Cart cleared successfully", customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" } });
    } catch (err) {
      console.error("Error clearing cart:", err.response?.data || err.message);
      setCartItems(prevItems);
      calculateTotal(prevItems);
      Swal.fire({ title: 'Error', text: 'Failed to clear cart!', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [token, darkMode, cartItems, calculateTotal]);

  /* ------------------------------------------------------------------ */
  /*  FETCH ADDRESSES                                                   */
  /* ------------------------------------------------------------------ */
  const fetchAddresses = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    const controller = new AbortController();
    try {
      const res = await api.get("/api/users/addresses", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      const addrList = res.data.content || [];
      setAddresses(addrList);
      if (addrList.length > 0) setSelectedAddress(addrList[0].id);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching addresses:", err.response?.data || err.message);
        Swal.fire({ title: 'Error', text: 'Failed to load addresses!', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
      }
    }
    return () => controller.abort();
  }, [token, isAuthenticated]);

  /* ------------------------------------------------------------------ */
  /*  CREATE ORDER                                                      */
  /* ------------------------------------------------------------------ */
  const createOrder = useCallback(async () => {
    if (!isAuthenticated) {
      Swal.fire({ icon: "info", title: "Not Logged In", text: "Create account or login if already have one", confirmButtonText: "Go to Login", customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" } })
        .then(() => navigate("/login"));
      return;
    }

    if (!selectedAddress) {
      Swal.fire({ icon: "info", title: "Missing Address", text: "Please select a delivery address", customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" } });
      return;
    }

    if (!paymentMethod) {
      Swal.fire({ icon: "info", title: "Missing Payment", text: "Please select a payment method", customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" } });
      return;
    }

    try {
      const payload = {
        deliveryAddressId: selectedAddress,
        paymentMethod: paymentMethod === "visa" ? "CREDIT_CARD" : "CASH",
      };

      const orderRes = await api.post("/api/users/orders", payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      const orderId = orderRes.data.id;

      if (paymentMethod === "visa") {
        const paymentRes = await api.post(`/api/payments/order/card/${orderId}`, {}, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (paymentRes.data.paymentURL) {
          window.open(paymentRes.data.paymentURL, "_blank");
        } else {
          throw new Error("Payment URL missing");
        }
      }

      setCartItems([]);
      setCheckoutStep("complete");
      Swal.fire({ title: 'Success!', text: 'Order placed successfully!', icon: 'success', toast: true, position: 'top-end', timer: 2000 });
    } catch (err) {
      console.error("Order failed:", err.response?.data || err.message);
      Swal.fire({ title: 'Error', text: err.response?.data?.message || 'Failed to place order!', icon: 'error', toast: true, position: 'top-end', timer: 2000 });
    }
  }, [token, isAuthenticated, selectedAddress, paymentMethod, darkMode, navigate]);

  /* ------------------------------------------------------------------ */
  /*  INITIAL FETCH                                                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (show && isAuthenticated) {
      Promise.all([fetchCart(), fetchAddresses()]).catch(console.error);
    } else if (show && !isAuthenticated) {
      setCartItems([]);
      setAddresses([]);
    }
  }, [show, isAuthenticated, fetchCart, fetchAddresses]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal - Slides in from right */}
      <div
        className={`relative w-full max-w-md h-full overflow-y-auto shadow-2xl transform transition-transform duration-300 ease-in-out ${
          darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        } ${show ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* === MONOTREE HERO INSIDE MODAL === */}
        <section className="relative overflow-hidden bg-gradient-to-br from-lime-50 to-teal-50 dark:from-lime-900/20 dark:to-teal-900/20 p-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Text */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                Your <span className="underline decoration-lime-500 decoration-4">Cart</span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Review items, choose delivery, and checkout securely.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div>
                  <div className="text-xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                    <FiZap /> 100%
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Secure</p>
                </div>
                {/* <div>
                  <div className="text-xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                    <FiTruck /> 2-3 Days
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Delivery</p>
                </div> */}
              
              </div>
            </div>

            {/* Right: 3D Mockup */}
            <div className="relative hidden md:block h-48">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-100 to-teal-100 dark:from-lime-900 dark:to-teal-900 rounded-3xl blur-3xl opacity-50"></div>
              <div className="absolute top-4 left-4 w-32 h-40 bg-white dark:bg-gray-800 rounded-3xl shadow-xl rotate-12 transform-gpu overflow-hidden">
                <div className="p-3 space-y-2">
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-6 bg-lime-500 rounded w-12"></div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 w-36 h-44 bg-white dark:bg-gray-800 rounded-3xl shadow-xl -rotate-6 transform-gpu overflow-hidden">
                <div className="p-4">
                  <div className="w-8 h-8 bg-lime-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <FiShoppingCart className="text-white text-sm" />
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md hover:bg-white dark:hover:bg-gray-700 transition"
        >
          <FiX className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Cart Content */}
        <div className="p-6 pt-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-lime-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {checkoutStep === "cart" && (
                <div>
                  {cartItems.length === 0 ? (
                    <div className="text-center py-12">
                      <FiShoppingCart className="mx-auto text-6xl text-gray-400 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
                    </div>
                  ) : (
                    <>
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl mb-3 shadow-sm"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{item.productName}</h4>
                            <p className="text-sm text-lime-600 dark:text-lime-400">{item.productPrice} EGP</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-lime-600 text-white hover:bg-lime-700 transition"
                            >-</button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-lime-600 text-white hover:bg-lime-700 transition"
                            >+</button>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="ml-2 text-red-600 hover:text-red-700"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="mt-6 p-4 bg-lime-50 dark:bg-lime-900/30 rounded-2xl">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-lime-600 dark:text-lime-400">{cartTotal.toFixed(2)} EGP</span>
                        </div>
                      </div>
                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => setCheckoutStep("checkout")}
                          className="flex-1 py-3 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition font-semibold"
                        >
                          Proceed to Checkout
                        </button>
                        <button
                          onClick={clearCart}
                          className="px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2"
                        >
                          <FiTrash2 /> Clear
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {checkoutStep === "checkout" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-lime-600 dark:text-lime-400">Delivery Address</h3>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 flex justify-between items-center text-left"
                    >
                      <span className="truncate">
                        {selectedAddress
                          ? addresses.find(a => a.id === selectedAddress)?.street + ", " + addresses.find(a => a.id === selectedAddress)?.city
                          : "Select address"}
                      </span>
                      <FiChevronDown className={`transition-transform ${showDropdown ? "rotate-180" : ""}`} />
                    </button>
                    {showDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {addresses.map(addr => (
                          <div
                            key={addr.id}
                            onClick={() => { setSelectedAddress(addr.id); setShowDropdown(false); }}
                            className="px-4 py-2 hover:bg-lime-100 dark:hover:bg-lime-900 cursor-pointer"
                          >
                            {addr.street}, {addr.city}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-lime-600 dark:text-lime-400">Payment Method</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setPaymentMethod("cod")}
                      className={`w-full p-4 rounded-xl border flex items-center gap-3 transition ${
                        paymentMethod === "cod" ? "border-lime-600 bg-lime-50 dark:bg-lime-900/30" : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <FiTruck className="text-lime-600" /> Cash on Delivery
                    </button>
                    <button
                      onClick={() => setPaymentMethod("visa")}
                      className={`w-full p-4 rounded-xl border flex items-center gap-3 transition ${
                        paymentMethod === "visa" ? "border-lime-600 bg-lime-50 dark:bg-lime-900/30" : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <FiCreditCard className="text-lime-600" /> Credit/Debit Card
                    </button>
                  </div>

                  <button
                    onClick={createOrder}
                    disabled={!paymentMethod || !selectedAddress}
                    className={`w-full py-4 rounded-xl font-bold transition ${
                      paymentMethod && selectedAddress
                        ? "bg-lime-600 text-white hover:bg-lime-700"
                        : "bg-gray-400 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    Place Order
                  </button>
                </div>
              )}

              {checkoutStep === "complete" && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-lime-100 dark:bg-lime-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <FiCheck className="w-10 h-10 text-lime-600 dark:text-lime-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-lime-600 dark:text-lime-400 mb-2">Order Confirmed!</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Thank you for shopping with us.</p>
                  <button
                    onClick={() => { onClose(); setCheckoutStep("cart"); setPaymentMethod(""); }}
                    className="px-6 py-3 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </>
          )}
        </div>

   
        {/* {showCookieBanner && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
            <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                We use cookies to improve your cart experience. <a href="#" className="underline">Learn more</a>.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowCookieBanner(false)} className="px-3 py-1 bg-lime-600 text-white rounded-lg text-xs">Accept</button>
                <button onClick={() => setShowCookieBanner(false)} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs">Reject</button>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Cart;