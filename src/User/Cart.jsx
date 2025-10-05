import React, { useState, useEffect } from "react";
import { FiX, FiShoppingCart, FiCreditCard, FiTruck, FiTrash2 } from "react-icons/fi";
import {jwtDecode} from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

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

  const fetchCart = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:8080/api/cart", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      setCartItems(data.items || []);
      calculateTotal(data.items || []);
    } catch (err) {
      console.error(err);
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
    setCartTotal(total);
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const res = await fetch("http://localhost:8080/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      await fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return removeFromCart(itemId);
    try {
      const res = await fetch(`http://localhost:8080/api/cart/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");
      await fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/cart/items/${itemId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to remove item");
      await fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  const clearCart = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/cart", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`},
      });
      if (!res.ok) throw new Error("Failed to clear cart");
      setCartItems([]);
      setCartTotal(0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) return;

    const fetchAddresses = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/users/addresses", {
          headers: {
            "Authorization":`Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch addresses");

        console.log("Fetched addresses:", data.content);
        setAddresses(data.content || []);
        if (data.length > 0) {
          setSelectedAddress(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching addresses:", err);
      }
    };

    fetchAddresses();
  }, [token]);

  const createOrder = async () => {
    if (!token) {
      Swal.fire({
        icon: "info",
        title: "Not Logged In",
        text: "Create account or login if already have one",
        confirmButtonText: "Go to Login",
      }).then(() => {
        navigate("/login");
      });
      return;
    }

    if (!selectedAddress) {
      Swal.fire({
        icon: "info",
        title: "Missing field",
        text: "Please select an address to continue",
      });
      return;
    }

    try {
      const orderPayload = {
        deliveryAddressId: selectedAddress,
        paymentMethod: paymentMethod === "visa" ? "CREDIT_CARD" : "CASH",
      };

      console.log("Sending order payload:", orderPayload);

      const res = await fetch("http://localhost:8080/api/users/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unknown error creating order");
      }

      console.log("Order created:", data);

      if (paymentMethod === "visa") {
        const orderId = data.id;
        try {
          const paymentRes = await fetch(
            `http://localhost:8080/api/payments/order/card/${orderId}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const response = await paymentRes.json();
          if (!paymentRes.ok) {
            throw new Error(response.message || "Payment initialization failed");
          }

          console.log(" Payment Response:", response);

          if (response.paymentURL) {
            window.open(response.paymentURL, "_blank");
          } else {
            throw new Error("Payment URL not found in response");
          }
        } catch (paymentErr) {
          console.error("Payment failed:", paymentErr);
          Swal.fire("Payment Failed", paymentErr.message, "error");
          return;
        }
      }

      setCartItems([]);
      setCheckoutStep("complete");
    } catch (err) {
      console.error(" Create order failed:", err);
      Swal.fire({
        icon: "error",
        title: "Order Failed",
        text: err.message,
      });
    }
  };

  useEffect(() => {
    if (show) fetchCart();
  }, [show]);

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