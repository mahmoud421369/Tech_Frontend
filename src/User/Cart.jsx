
import React, { useState, useEffect, useCallback } from "react";
import { FiX, FiShoppingCart, FiCreditCard, FiTruck, FiTrash2 } from "react-icons/fi";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../api";

const Cart = ({ show, onClose, darkMode }) => {
  const [checkoutStep, setCheckoutStep] = useState("cart");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cartTotal, setCartTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("authToken");
  const userId = token ? jwtDecode(token).userId : null;
  const navigate = useNavigate();

  const fetchCart = useCallback(async () => {
    if (!token) return;
    const controller = new AbortController();
    try {
      setIsLoading(true);
      const res = await api.get("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      setCartItems(res.data.items || []);
      calculateTotal(res.data.items || []);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching cart:", err.response?.data || err.message);
        setCartItems([]);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Failed to fetch cart",
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [token, darkMode]);

  const calculateTotal = useCallback((items) => {
    const total = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
    setCartTotal(total);
  }, []);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    try {
      await api.post("/api/cart/items", { productId, quantity }, {
        headers: { "Content-Type": "application/json" },
      });
      await fetchCart();
    } catch (err) {
      console.error("Error adding to cart:", err.response?.data || err.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to add item",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
    }
  }, [darkMode, fetchCart]);

  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    if (newQuantity < 1) return removeFromCart(itemId);
    try {
      await api.put(`/api/cart/items/${itemId}`, { quantity: newQuantity }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      await fetchCart();
    } catch (err) {
      console.error("Error updating quantity:", err.response?.data || err.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to update quantity",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
    }
  }, [token, darkMode, fetchCart]);

  const removeFromCart = useCallback(async (itemId) => {
    try {
      await api.delete(`/api/cart/items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCart();
     Swal.fire({
                 title: 'Success',
                 text: 'Item removed!',
                 icon: 'success',
                 toast: true,
                 position: 'top-start',
                 showConfirmButton: false,
                 timer: 1500,
               })
    } catch (err) {
      console.error("Error removing item:", err.response?.data || err.message);
      Swal.fire({
                  title: 'error',
                  text: 'Item is not removed!',
                  icon: 'error',
                  toast: true,
                  position: 'top-end',
                  showConfirmButton: false,
                  timer: 1500,
                })
    }
  }, [token, darkMode, fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      await api.delete("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems([]);
      setCartTotal(0);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Cart cleared successfully",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
    } catch (err) {
      console.error("Error clearing cart:", err.response?.data || err.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to clear cart",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
    }
  }, [token, darkMode]);

  const fetchAddresses = useCallback(async () => {
    if (!token) return;
    const controller = new AbortController();
    try {
      const res = await api.get("/api/users/addresses", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      console.log("Fetched addresses:", res.data.content);
      setAddresses(res.data.content || []);
      if (res.data.content?.length > 0) {
        setSelectedAddress(res.data.content[0].id);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching addresses:", err.response?.data || err.message);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Failed to fetch addresses",
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
      }
    }
    return () => controller.abort();
  }, [token, darkMode]);

  const createOrder = useCallback(async () => {
    if (!token) {
      Swal.fire({
        icon: "info",
        title: "Not Logged In",
        text: "Create account or login if already have one",
        confirmButtonText: "Go to Login",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      }).then(() => {
        navigate("/login");
      });
      return;
    }

    if (!selectedAddress) {
      Swal.fire({
        icon: "info",
        title: "Missing Field",
        text: "Please select an address to continue",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
      return;
    }

    try {
      const orderPayload = {
        deliveryAddressId: selectedAddress,
        paymentMethod: paymentMethod === "visa" ? "CREDIT_CARD" : "CASH",
      };

      console.log("Sending order payload:", orderPayload);

      const res = await api.post("/api/users/orders", orderPayload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      console.log("Order created:", res.data);

      if (paymentMethod === "visa") {
        const orderId = res.data.id;
        try {
          const paymentRes = await api.post(`/api/payments/order/card/${orderId}`,{}, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          });

          console.log("Payment Response:", paymentRes.data);

          if (paymentRes.data.paymentURL) {
            window.open(paymentRes.data.paymentURL, "_blank");
          } else {
            throw new Error("Payment URL not found in response");
          }
        } catch (paymentErr) {
          console.error("Payment failed:", paymentErr.response?.data || paymentErr.message);
          Swal.fire({
            icon: "error",
            title: "Payment Failed",
            text: paymentErr.response?.data?.message || "Payment initialization failed",
            customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
          });
          return;
        }
      }

      setCartItems([]);
      setCheckoutStep("complete");
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Order placed successfully",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
    } catch (err) {
      console.error("Create order failed:", err.response?.data || err.message);
      Swal.fire({
        icon: "error",
        title: "Order Failed",
        text: err.response?.data?.message || "Failed to create order",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
    }
  }, [token, selectedAddress, paymentMethod, darkMode, navigate]);

  useEffect(() => {
    if (show) {
      Promise.all([fetchCart(), fetchAddresses()]).catch((err) =>
        console.error("Error in initial fetch:", err)
      );
    }
  }, [show, fetchCart, fetchAddresses]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50 transition-opacity duration-300">
      <div className={`w-full max-w-md h-full overflow-y-auto ${darkMode ? "bg-gray-900" : "bg-white"} shadow-2xl transform transition-transform duration-300 ease-in-out ${show ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <FiShoppingCart />
            {checkoutStep === "cart" && "Your Cart"}
            {checkoutStep === "checkout" && "Checkout"}
            {checkoutStep === "complete" && "Order Complete"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {checkoutStep === "cart" && (
              <div className="p-6">
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <FiShoppingCart className="text-gray-400 text-4xl mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      Your cart is empty
                    </p>
                  </div>
                ) : (
                  <>
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-4 shadow-sm transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {item.productName}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {item.productPrice} EGP
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="px-3 py-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="text-gray-900 dark:text-gray-100 font-medium">
                            {item.quantity}
                          </span>
                          <button
                            className="px-3 py-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 flex justify-between font-semibold text-gray-900 dark:text-gray-100">
                      <span>Total:</span>
                      <span>{cartTotal.toFixed(2)} EGP</span>
                    </div>
                    <div className="mt-6 flex gap-4">
                      <button
                        onClick={() => setCheckoutStep("checkout")}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition"
                      >
                        Proceed to Checkout
                      </button>
                      <button
                        onClick={clearCart}
                        className="flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition"
                      >
                        <FiTrash2 className="w-5 h-5" />
                        Clear Cart
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {checkoutStep === "checkout" && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Delivery Address
                </h3>
                <div className="relative mb-6">
                  <button
                    type="button"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-between text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    {selectedAddress
                      ? addresses.find((a) => a.id === selectedAddress)?.street +
                        ", " +
                        addresses.find((a) => a.id === selectedAddress)?.city
                      : "Select Address"}
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showDropdown && (
                    <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-md max-h-48 overflow-y-auto">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddress(addr.id);
                            setShowDropdown(false);
                          }}
                          className={`px-3 py-2 text-sm text-gray-800 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-gray-600 cursor-pointer transition ${
                            selectedAddress === addr.id ? "bg-indigo-50 dark:bg-gray-600" : ""
                          }`}
                        >
                          {addr.street}, {addr.city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Payment Method
                </h3>
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => setPaymentMethod("cod")}
                    className={`w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl flex items-center gap-2 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition ${
                      paymentMethod === "cod" ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900" : ""
                    }`}
                  >
                    <FiTruck className="text-indigo-600 dark:text-indigo-400" />
                    Cash on Delivery
                  </button>
                  <button
                    onClick={() => setPaymentMethod("visa")}
                    className={`w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl flex items-center gap-2 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition ${
                      paymentMethod === "visa" ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900" : ""
                    }`}
                  >
                    <FiCreditCard className="text-indigo-600 dark:text-indigo-400" />
                    Credit/Debit Card
                  </button>
                </div>
                <button
                  onClick={createOrder}
                  disabled={!paymentMethod}
                  className={`w-full py-3 rounded-xl text-white font-semibold transition ${
                    paymentMethod
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Place Order
                </button>
              </div>
            )}

            {checkoutStep === "complete" && (
              <div className="p-6 text-center">
                <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                  Order Placed Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Thank you for your order. You'll receive a confirmation soon.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    setCheckoutStep("cart");
                    setPaymentMethod("");
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
