
import React, { useState, useEffect } from "react";
import { FiX, FiShoppingCart, FiCreditCard, FiTruck, FiTrash2 } from "react-icons/fi";
import {jwtDecode} from "jwt-decode";

const Cart = ({ show, onClose, darkMode }) => {
  const [checkoutStep, setCheckoutStep] = useState("cart");
   const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");

  const [cart, setCart] = useState([]);
const [showDropdown, setShowDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);


  const token = localStorage.getItem("authToken");
  const userId = token ? jwtDecode(token).userId : null; 


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
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`},
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
        headers: { "Authorization": `Bearer ${token}` },
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
            "Authorization": `Bearer ${token}`,
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
    alert("User not logged in!");
    return;
  }
  if (!selectedAddress) {
    alert("Please select a delivery address");
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
    if (!res.ok) throw new Error(data.message || "Unknown error");

    console.log("Order created:", data);

  
    if (paymentMethod === "visa") {
      const orderId = data.id;
      try {
        const paymentRes = await fetch(
          `http://localhost:8080/api/payments/order/card/${orderId}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const response =  await paymentRes.json();
        window.location.href = response.paymentURL;

        const paymentData = await paymentRes.json();
        if (!paymentRes.ok) throw new Error(paymentData.message || "Payment failed");

        console.log("Payment success:", paymentData);
        alert("Payment processed successfully!");
      } catch (paymentErr) {
        console.error("Payment failed:", paymentErr);
        alert("Payment failed: " + paymentErr.message);
        return; 
      }
    }

   
    setCart([]);
    setCheckoutStep("complete");

  } catch (err) {
    console.error("Create order failed:", err);
    alert("Failed to create order: " + err.message);
  }
};

  useEffect(() => {
    if (show) fetchCart();
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
      <div className="bg-white dark:bg-gray-950 w-full max-w-md h-full overflow-y-auto">
     



<div className="mb-4 p-3">
  
  <div className="relative p-3">
    <button
      type="button"
      className="w-full text-blue-600 rounded-md p-4 flex justify-between items-center bg-[#f1f5f9] dark:bg-gray-800 dark:text-white"
      onClick={() => setShowDropdown(!showDropdown)}
    >
      {selectedAddress
        ? addresses.find((a) => a.id === selectedAddress)?.street +
          ", " +
          addresses.find((a) => a.id === selectedAddress)?.city
        : "Select Address"}
      <svg
        className={`w-5 h-5 ml-4 transition-transform ${
          showDropdown ? "rotate-180" : ""
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    {showDropdown && (
      <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-900 border rounded-md shadow-lg max-h-48 overflow-y-auto">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            onClick={() => {
              setSelectedAddress(addr.id);
              setShowDropdown(false);
            }}
            className={`p-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-700 ${
              selectedAddress === addr.id ? "bg-blue-50 dark:bg-gray-800" : ""
            }`}
          >
            {addr.street}, {addr.city}
          </div>
        ))}
      </div>
    )}
  </div>
</div>



        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold dark:text-white flex items-center">
            <FiShoppingCart className="mr-3" />
            {checkoutStep === "cart" && "Your Cart"}
            {checkoutStep === "checkout" && "Checkout"}
            {checkoutStep === "complete" && "Order Complete"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <FiX className="w-6 h-6" />
          </button>
        </div>

     
{checkoutStep === "cart" && (
  <div className="p-6">
    {cartItems.length === 0 ? (
      <p className="text-center dark:text-white mt-6">Your cart is empty</p>
    ) : (
      <>
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center bg-[#f1f5f9] p-3 rounded-lg mb-4  pb-2 "
          >
            <div>
              <h4 className="font-bold text-indigo-500  dark:text-white">{item.productName}</h4>
              <p className="text-gray-600 dark:text-blue-400">{item.productPrice} EGP</p>
            </div>
            <div className="flex items-center">
              <button
                className="px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
              >
                -
              </button>
              <span className="mx-2 dark:text-white">{item.quantity}</span>
              <button
                className="px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                +
              </button>
            </div>
            <button
              onClick={() => removeFromCart(item.id)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <FiTrash2/>
            </button>
          </div>
        ))}

        <div className="mt-4 flex justify-between font-bold dark:text-white">
          <span>Total:</span>
          <span>{cartTotal.toFixed(2)} EGP</span>
        </div>

        
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setCheckoutStep("checkout")}
            className="flex-1 bg-blue-600 border-4 border-blue-500 text-white py-2 font-bold rounded-md hover:bg-blue-700"
          >
            Checkout
          </button>
          <button
            onClick={clearCart}
            className="flex items-center border-4 border-red-500 justify-center gap-2 bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700"
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
            <h3 className="font-bold mb-3 dark:text-white">Select Payment Method</h3>
            <div className="space-y-3">
              <button
                onClick={() => setPaymentMethod("cod")}
                className={`w-full p-3 border rounded-md dark:text-white ${paymentMethod === "cod" ? "border-blue-600 bg-blue-50 dark:bg-blue-900" : "dark:border-gray-700 dark:bg-gray-800"}`}
              >
                <FiTruck className="inline mr-2" /> Cash on Delivery
              </button>
              <button
                onClick={() => setPaymentMethod("visa")}
                className={`w-full p-3 border rounded-md dark:text-white ${paymentMethod === "visa" ? "border-blue-600 bg-blue-50 dark:bg-blue-900" : "dark:border-gray-700 dark:bg-gray-800"}`}
              >
                <FiCreditCard className="inline mr-2" /> Credit/Debit Card
              </button>
            </div>
            <button
              onClick={createOrder}
              disabled={!paymentMethod}
              className={`mt-4 w-full py-2 rounded-md text-white ${paymentMethod ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
            >
              Place Order
            </button>
          </div>
        )}

     
        {checkoutStep === "complete" && (
          <div className="p-6 text-center dark:text-white">
            <h3 className="text-2xl font-bold mb-2">Order Placed Successfully!</h3>
            <p>Thank you for your order.</p>
            <button
              onClick={() => {
                onClose();
                setCheckoutStep("cart");
                setPaymentMethod("");
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;