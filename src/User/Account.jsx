import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FiUser,
  FiMapPin,
  FiBox,
  FiTool,
  FiEdit2,
  FiTrash2,
  FiX,
  FiMail,
  FiPhone,
  FiPlus,
  FiInfo,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiHome,
  FiChevronLeft,
  FiChevronRight,
  FiXCircle,
  FiStar,
  FiUsers,
  FiZap,
  FiCheckCircle,
  FiCreditCard,
  FiTruck,
} from "react-icons/fi";
import api from "../api";

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const Account = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const [activeSection, setActiveSection] = useState("profile");
  const [userProfile, setUserProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [addressForm, setAddressForm] = useState({
    state: "",
    city: "",
    street: "",
    building: "",
    notes: "",
    isDefault: false,
  });
  const [ordersPage, setOrdersPage] = useState(1);
  const [repairsPage, setRepairsPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!token) {
      Swal.fire({
        title: "Login Required",
        icon: "warning",
        toast: true,
        position: "top-end",
        timer: 2000,
      }).then(() => navigate("/login"));
      return;
    }
    setIsLoading(true);
    try {
      const [profRes, addrRes, ordRes, repRes] = await Promise.all([
        api.get("/api/users/profile", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/api/users/addresses", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/api/users/orders", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/api/users/repair-request", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setUserProfile(profRes.data);
      setProfileForm({
        first_name: profRes.data.first_name || "",
        last_name: profRes.data.last_name || "",
        phone: profRes.data.phone || "",
      });
      setAddresses(addrRes.data.content || []);
      setOrders(ordRes.data.content || []);
      setRepairRequests(repRes.data.content || []);
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: "Failed to load data",
        icon: "error",
        toast: true,
        position: "top-end",
        timer: 1500,
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    document.title = "My Account | TechRestore";
    fetchAll();
  }, [fetchAll]);

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setIsAddingAddress(false);
    setAddressForm({ state: "", city: "", street: "", building: "", notes: "", isDefault: false });
  };

  const startEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      state: addr.state,
      city: addr.city,
      street: addr.street,
      building: addr.building,
      notes: addr.notes || "",
      isDefault: addr.isDefault,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put("/api/users/profile", profileForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserProfile((prev) => ({ ...prev, ...profileForm }));
      setIsEditingProfile(false);
      Swal.fire({ title: "Updated!", icon: "success", toast: true, position: "top-end", timer: 1500 });
    } catch {
      Swal.fire({ title: "Error", text: "Update failed", icon: "error", toast: true, position: "top-end", timer: 1500 });
    }
  };

  const handleDeleteAccount = async () => {
    const c = await Swal.fire({
      title: "Delete Account?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
    });
    if (!c.isConfirmed) return;
    try {
      await api.delete("/api/users/profile", { headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem("authToken");
      navigate("/");
    } catch {
      Swal.fire({ title: "Error", text: "Failed to delete", icon: "error", toast: true, position: "top-end", timer: 1500 });
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/users/addresses", addressForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAll();
      resetAddressForm();
      Swal.fire({ title: "Added!", icon: "success", toast: true, position: "top-end", timer: 1500 });
    } catch {
      Swal.fire({ title: "Error", text: "Failed to add", icon: "error", toast: true, position: "top-end", timer: 1500 });
    }
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/users/addresses/${editingAddressId}`, addressForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAll();
      resetAddressForm();
      Swal.fire({ title: "Updated!", icon: "success", toast: true, position: "top-end", timer: 1500 });
    } catch {
      Swal.fire({ title: "Error", text: "Failed to update", icon: "error", toast: true, position: "top-end", timer: 1500 });
    }
  };

  const handleDeleteAddress = async (id) => {
    const c = await Swal.fire({ title: "Delete Address?", icon: "warning", showCancelButton: true });
    if (!c.isConfirmed) return;
    try {
      await api.delete(`/api/users/addresses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAll();
      Swal.fire({ title: "Deleted!", icon: "success", toast: true, position: "top-end", timer: 1500 });
    } catch {
      Swal.fire({ title: "Error", text: "Failed to delete", icon: "error", toast: true, position: "top-end", timer: 1500 });
    }
  };

  const showOrderDetails = (order) => {
    const safe = (val) => (val === null || val === undefined || val === "" ? "—" : String(val).trim());
    const formatDate = (dateString) =>
      new Date(dateString).toLocaleString("en-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Africa/Cairo",
      });

    const itemsHtml = order.orderItems?.length > 0
      ? order.orderItems
          .map(
            (item) => `
            <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
              <div class="flex-1">
                <div class="font-semibold text-gray-900 dark:text-white">
                  ${safe(item.productName)}
                  <span class="text-gray-500 dark:text-gray-400 text-sm"> × ${safe(item.quantity)}</span>
                </div>
                ${item.shopName ? `<div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Shop: <strong>${safe(item.shopName)}</strong></div>` : ""}
              </div>
              <div class="font-bold text-lime-600 dark:text-lime-400">
                ${(Number(item.priceAtCheckout) * Number(item.quantity)).toFixed(2)} EGP
              </div>
            </div>
          `
          )
          .join("")
      : '<p class="text-gray-500 dark:text-gray-400 text-center py-6">No items found</p>';

    const paymentMethod = safe(order.paymentMethod).toLowerCase().replace("_", " ");
    const isCard = order.paymentMethod === "CREDIT_CARD";
    const paymentHtml = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full ${isCard ? "bg-blue-100 dark:bg-blue-900" : "bg-orange-100 dark:bg-orange-900"} flex items-center justify-center">
          ${isCard
            ? '<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4h12a2 2 0 012 2v1H2V6a2 2 0 012-2z"/><path fill-rule="evenodd" d="M2 9h16v5a2 2 0 01-2 2H4a2 2 0 01-2-2V9zm3 2a1 1 0 100 2h1a1 1 0 100-2H5z" clip-rule="evenodd"/></svg>'
            : '<svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4h12a2 2 0 02 2 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"/><path fill-rule="evenodd" d="M2 13h16v1a2 2 0 01-2 2H4a2 2 0 01-2-2v-1z" clip-rule="evenodd"/></svg>'}
        </div>
        <div>
          <p class="font-semibold capitalize">${paymentMethod}</p>
          ${order.paymentId ? `<p class="text-xs text-gray-500 dark:text-gray-400">ID: ${safe(order.paymentId).slice(0, 12)}...</p>` : ""}
        </div>
      </div>
    `;

    Swal.fire({
      title: `Order #${safe(order.id).slice(0, 10).toUpperCase()}`,
      icon: order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "error" : "info",
      width: 820,
      showCloseButton: true,
      customClass: {
        popup: "font-sans rounded-2xl",
        title: "text-2xl font-bold text-gray-900 dark:text-white",
      },
      html: `
        <div class="text-left space-y-6 text-sm">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl">
            <div class="space-y-3">
              <p><strong>Order Date:</strong> ${formatDate(order.createdAt)}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <p><strong>Total:</strong> <span class="text-2xl font-bold text-lime-600 dark:text-lime-400">${safe(order.totalPrice)} EGP</span></p>
            </div>
            <div>
              <p class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment Method</p>
              ${paymentHtml}
            </div>
          </div>
          <div>
            <h3 class="font-bold text-lg mb-3">Order Items</h3>
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              ${itemsHtml}
              <div class="bg-gray-50 dark:bg-gray-900 px-5 py-4 border-t-2 border-dashed border-lime-300 dark:border-lime-700">
                <div class="flex justify-between text-lg font-bold">
                  <span>Grand Total</span>
                  <span class="text-lime-600 dark:text-lime-400">${safe(order.totalPrice)} EGP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
    });
  };

  const handleCancelOrder = async (id) => {
    const c = await Swal.fire({ title: "Cancel Order?", icon: "warning", showCancelButton: true });
    if (!c.isConfirmed) return;
    try {
      await api.delete(`/api/users/orders/${id}/cancel`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAll();
      Swal.fire({ title: "Cancelled!", icon: "success", toast: true, position: "top-end", timer: 1500 });
    } catch {
      Swal.fire({ title: "Error", text: "Failed to cancel", icon: "error", toast: true, position: "top-end", timer: 1500 });
    }
  };

  const handleViewRepair = async (id) => {
    try {
      const res = await api.get(`/api/users/repair-request/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const r = res.data;
      Swal.fire({
        title: `Repair #${r.id.slice(0, 8)}`,
        html: `<div class="text-left space-y-2">
          <p><strong>Shop:</strong> ${r.shopName}</p>
          <p><strong>Issue:</strong> ${r.description}</p>
          <p><strong>Status:</strong> ${r.status}</p>
          ${r.price ? `<p><strong>Quote:</strong> ${r.price} EGP</p>` : ""}
        </div>`,
        icon: "info",
      });
    } catch {
      Swal.fire({ title: "Error", text: "Failed to load", icon: "error" });
    }
  };

  const handleEditRepair = (req) => {
    Swal.fire({
      title: "Edit Description",
      input: "textarea",
      inputValue: req.description,
      showCancelButton: true,
      preConfirm: (val) =>
        api.put(`/api/users/repair-request/${req.shopId}/${req.id}`, { description: val }, { headers: { Authorization: `Bearer ${token}` } }),
    }).then(() => fetchAll());
  };

  const handleAcceptQuote = async (req) => {
    const result = await Swal.fire({
      title: "Accept Quote?",
      text: `Accept ${req.price} EGP from ${req.shopName}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Accept Quote",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10b981",
    });
    if (!result.isConfirmed) return;
    try {
      await api.put(
        `/api/users/repair-request/${req.id}/status`,
        { status: "QUOTE_APPROVED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAll();
      setTimeout(() => handleConfirmRepair(req), 500);
      Swal.fire({
        icon: "success",
        title: "Quote Accepted!",
        text: "Now complete your order details",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to accept quote", "error");
    }
  };

  const handleConfirmRepair = async (req) => {
    if (!req.price) return Swal.fire("No Price", "No quote available yet", "info");
    let userAddresses = [];
    try {
      const res = await api.get("/api/users/addresses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      userAddresses = res.data.content || res.data || [];
    } catch (err) {
      return Swal.fire("Error", "Failed to load addresses", "error");
    }
    if (userAddresses.length === 0) {
      return Swal.fire({
        title: "No Address",
        text: "Please add a delivery address first",
        icon: "warning",
        confirmButtonText: "OK",
      });
    }
    const defaultAddr = userAddresses.find((a) => a.isDefault) || userAddresses[0];
    const { value: form } = await Swal.fire({
      title: `Confirm Repair #${req.id.slice(0, 8)}`,
      width: "700px",
      html: `
        <div class="text-left space-y-6">
          <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border-2">
            <p class="text-lg font-bold">${req.shopName}</p>
            <p class="text-3xl font-bold text-lime-600 dark:text-lime-400 mt-3">${req.price} EGP</p>
          </div>
          <div>
            <label class="block text-sm font-bold mb-2">Delivery Address</label>
            <div class="relative">
              <button type="button" id="addressBtn" class="w-full px-5 py-4 text-left bg-white dark:bg-gray-800 border-2 rounded-xl flex justify-between items-center hover:border-lime-500 transition">
                <span id="addrText">${defaultAddr.street}, ${defaultAddr.building}, ${defaultAddr.city}</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div id="addrOptions" class="absolute z-30 w-full mt-2 bg-white dark:bg-gray-800 border-2 rounded-xl shadow-2xl max-h-64 overflow-y-auto hidden">
                ${userAddresses
                  .map(
                    (addr) => `
                  <button type="button" onclick="selectAddr('${addr.id}', '${addr.street}, ${addr.building}, ${addr.city}')"
                    class="block w-full text-left px-5 py-3 hover:bg-lime-50 dark:hover:bg-lime-900 transition ${addr.isDefault ? "bg-lime-100 font-medium" : ""}">
                    ${addr.street}, ${addr.building} - ${addr.city} ${addr.isDefault ? " (Default)" : ""}
                  </button>
                `
                  )
                  .join("")}
              </div>
            </div>
            <input type="hidden" id="selectedAddrId" value="${defaultAddr.id}">
          </div>
          <div>
            <label class="block text-sm font-bold mb-2">Delivery Method</label>
            <div class="relative">
              <button type="button" id="deliveryBtn" class="w-full px-5 py-4 text-left bg-white dark:bg-gray-800 border-2 rounded-xl flex justify-between items-center hover:border-lime-500 transition">
                <span>Home Delivery</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div id="deliveryOptions" class="absolute z-30 w-full mt-2 bg-white dark:bg-gray-800 border-2 rounded-xl shadow-2xl hidden">
                <button type="button" onclick="selectDelivery('HOME_DELIVERY')" class="block w-full text-left px-5 py-3 hover:bg-lime-50">Home Delivery</button>
                <button type="button" onclick="selectDelivery('SHOP_VISIT')" class="block w-full text-left px-5 py-3 hover:bg-lime-50">Visit Shop</button>
                <button type="button" onclick="selectDelivery('PICKUP')" class="block w-full text-left px-5 py-3 hover:bg-lime-50">Courier Pickup</button>
              </div>
            </div>
            <input type="hidden" id="deliveryMethod" value="HOME_DELIVERY">
          </div>
          <div>
            <label class="block text-sm font-bold mb-2">Payment Method</label>
            <div class="relative">
              <button type="button" id="paymentBtn" class="w-full px-5 py-4 text-left bg-white dark:bg-gray-800 border-2 rounded-xl flex justify-between items-center hover:border-lime-500 transition">
                <span>Cash on Delivery</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div id="paymentOptions" class="absolute z-30 w-full mt-2 bg-white dark:bg-gray-800 border-2 rounded-xl shadow-2xl hidden">
                <button type="button" onclick="selectPayment('CASH')" class="block w-full text-left px-5 py-3 hover:bg-lime-50">Cash on Delivery</button>
                <button type="button" onclick="selectPayment('CREDIT_CARD')" class="block w-full text-left px-5 py-3 hover:bg-lime-50">Credit Card</button>
              </div>
            </div>
            <input type="hidden" id="paymentMethod" value="CASH">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Confirm & Pay",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#84cc16",
      didOpen: () => {
        const addrBtn = document.getElementById("addressBtn");
        const addrOptions = document.getElementById("addrOptions");
        addrBtn.onclick = () => addrOptions.classList.toggle("hidden");
        window.selectAddr = (id, text) => {
          document.getElementById("addrText").textContent = text.length > 40 ? text.slice(0, 40) + "..." : text;
          document.getElementById("selectedAddrId").value = id;
          addrOptions.classList.add("hidden");
        };
        const deliveryBtn = document.getElementById("deliveryBtn");
        const deliveryOptions = document.getElementById("deliveryOptions");
        deliveryBtn.onclick = () => deliveryOptions.classList.toggle("hidden");
        window.selectDelivery = (val) => {
          const text = val === "HOME_DELIVERY" ? "Home Delivery" : val === "SHOP_VISIT" ? "Visit Shop" : "Courier Pickup";
          deliveryBtn.querySelector("span").textContent = text;
          document.getElementById("deliveryMethod").value = val;
          deliveryOptions.classList.add("hidden");
        };
        const paymentBtn = document.getElementById("paymentBtn");
        const paymentOptions = document.getElementById("paymentOptions");
        paymentBtn.onclick = () => paymentOptions.classList.toggle("hidden");
        window.selectPayment = (val) => {
          paymentBtn.querySelector("span").textContent = val === "CASH" ? "Cash on Delivery" : "Credit Card";
          document.getElementById("paymentMethod").value = val;
          paymentOptions.classList.add("hidden");
        };
      },
      preConfirm: () => ({
        deliveryAddress: document.getElementById("selectedAddrId").value,
        deliveryMethod: document.getElementById("deliveryMethod").value,
        paymentMethod: document.getElementById("paymentMethod").value,
      }),
    });
    if (form) {
      try {
        const response = await api.post(
          `/api/users/repair-request/repairs/${req.id}/confirm`,
          {
            deliveryAddress: form.deliveryAddress,
            deliveryMethod: form.deliveryMethod,
            paymentMethod: form.paymentMethod,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchAll();
        if (form.paymentMethod === "CREDIT_CARD" && response.data.paymentURL) {
          Swal.fire({
            title: "Redirecting to Payment",
            text: "Please complete your payment",
            icon: "info",
            timer: 2500,
            showConfirmButton: false,
          }).then(() => {
            window.location.href = response.data.paymentURL;
          });
        } else {
          Swal.fire("Success!", "Your repair request has been confirmed", "success");
        }
      } catch (err) {
        Swal.fire("Error", err.response?.data?.message || "Failed to confirm repair", "error");
      }
    }
  };

  const handleCancelRepair = async (id) => {
    const result = await Swal.fire({
      title: "Cancel Request?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel",
      cancelButtonText: "No, Keep",
      confirmButtonColor: "#ef4444",
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/users/repair-request/repairs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire("Cancelled", "Repair request cancelled successfully", "success");
        fetchAll();
      } catch (err) {
        Swal.fire("Error", "Failed to cancel request", "error");
      }
    }
  };

  const renderProfile = () => {
    if (isEditingProfile) {
      return (
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-2xl font-bold text-lime-600 dark:text-lime-400 mb-6 flex items-center gap-3">
            <FiEdit2 className="text-3xl" /> Edit Profile
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <input
              placeholder="First Name"
              value={profileForm.first_name}
              onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
              className="w-full px-6 py-4 bg-white dark:bg-gray-700 rounded-2xl border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/50 transition"
              required
            />
            <input
              placeholder="Last Name"
              value={profileForm.last_name}
              onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
              className="w-full px-6 py-4 bg-white dark:bg-gray-700 rounded-2xl border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/50 transition"
              required
            />
            <input
              placeholder="Phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full px-6 py-4 bg-white dark:bg-gray-700 rounded-2xl border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/50 transition"
              required
            />
            <div className="flex gap-4">
              <button type="submit" className="px-8 py-4 bg-lime-600 text-white rounded-2xl hover:bg-lime-700 transition shadow-xl font-semibold">
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-8 py-4 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition shadow-xl flex items-center gap-2"
              >
                <FiX /> Cancel
              </button>
            </div>
          </form>
        </div>
      );
    }
    return (
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex justify-between items-start mb-8">
          <h3 className="text-2xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-3">
            <FiUser className="text-3xl" /> My Profile
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditingProfile(true)}
              className="p-3 bg-white/50 dark:bg-black/30 text-lime-600 rounded-2xl hover:bg-lime-100 dark:hover:bg-lime-900 transition shadow-md"
            >
              <FiEdit2 className="text-xl" />
            </button>
            <button
              onClick={handleDeleteAccount}
              className="p-3 bg-white/50 dark:bg-black/30 text-red-600 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900 transition shadow-md"
            >
              <FiTrash2 className="text-xl" />
            </button>
          </div>
        </div>
        <div className="space-y-5 text-lg">
          <p className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <FiUser /> {userProfile?.first_name} {userProfile?.last_name}
          </p>
          <p className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <FiMail /> {userProfile?.email}
          </p>
          <p className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <FiPhone /> {userProfile?.phone || "—"}
          </p>
          <p className="flex items-center gap-3">
            Status:
            <span
              className={`ml-3 px-4 py-2 rounded-full text-sm font-bold ${
                userProfile?.activate
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}
            >
              {userProfile?.activate ? "Active" : "Inactive"}
            </span>
          </p>
        </div>
      </div>
    );
  };

  const renderAddresses = () => {
    if (isAddingAddress || editingAddressId) {
      return (
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-2xl font-bold text-lime-600 dark:text-lime-400 mb-6 flex items-center gap-3">
            <FiMapPin className="text-3xl" /> {editingAddressId ? "Edit" : "Add New"} Address
          </h3>
          <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <input
                placeholder="State / Governorate"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                className="px-6 py-4 bg-white dark:bg-gray-700 rounded-2xl border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/50 transition"
                required
              />
              <input
                placeholder="City"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="px-6 py-4 bg-white dark:bg-gray-700 rounded-2xl border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/50 transition"
                required
              />
              <input
                placeholder="Street"
                value={addressForm.street}
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                className="px-6 py-4 bg-white dark:bg-gray-700 rounded-2xl border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/50 transition"
                required
              />
              <input
                placeholder="Building / Apartment"
                value={addressForm.building}
                onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })}
                className="px-6 py-4 bg-white dark:bg-gray-700 rounded-2xl border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/50 transition"
                required
              />
            </div>
            <textarea
              placeholder="Additional notes (floor, landmark, etc.)"
              value={addressForm.notes}
              onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })}
              className="w-full px-6 py-4 bg-white dark:bg-gray-700 rounded-2xl border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/50 transition resize-none"
              rows={3}
            />
            <label className="flex items-center gap-3 text-lg">
              <input
                type="checkbox"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                className="w-6 h-6 text-lime-600 rounded focus:ring-lime-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Set as default address</span>
            </label>
            <div className="flex gap-4">
              <button type="submit" className="px-8 py-4 bg-lime-600 text-white rounded-2xl hover:bg-lime-700 transition shadow-xl font-semibold">
                {editingAddressId ? "Update Address" : "Add Address"}
              </button>
              <button type="button" onClick={resetAddressForm} className="px-8 py-4 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition shadow-xl">
                Cancel
              </button>
            </div>
          </form>
        </div>
      );
    }
    return (
      <>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-3">
            <FiMapPin className="text-3xl" /> My Addresses
          </h3>
          <button
            onClick={() => setIsAddingAddress(true)}
            className="flex items-center gap-3 px-6 py-3 bg-lime-600 text-white rounded-2xl hover:bg-lime-700 transition shadow-xl font-semibold"
          >
            <FiPlus className="text-xl" /> Add New Address
          </button>
        </div>
        {addresses.length === 0 ? (
          <div className="text-center py-16 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50">
            <FiMapPin className="mx-auto text-8xl text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400">No saved addresses yet</p>
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-2 ${
                addr.isDefault ? "border-lime-500" : "border-gray-200/50 dark:border-gray-700/50"
              } mb-6 transition hover:shadow-3xl hover:-translate-y-2 relative`}
            >
              {addr.isDefault && (
                <span className="absolute top-4 right-6 bg-lime-600 text-white text-sm px-4 py-2 rounded-full font-bold flex items-center gap-2">
                  <FiCheckCircle /> Default
                </span>
              )}
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {addr.street}, {addr.building}
                  </p>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {addr.city}, {addr.state}
                  </p>
                  {addr.notes && <p className="text-sm italic text-gray-500 dark:text-gray-400">"{addr.notes}"</p>}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => startEditAddress(addr)}
                    className="p-3 bg-white/50 dark:bg-black/30 text-lime-600 rounded-2xl hover:bg-lime-100 dark:hover:bg-lime-900 transition shadow-md"
                  >
                    <FiEdit2 className="text-xl" />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-3 bg-white/50 dark:bg-black/30 text-red-600 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900 transition shadow-md"
                  >
                    <FiTrash2 className="text-xl" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </>
    );
  };

  const renderOrders = () => {
    const itemsPerPage = 3;
    const total = Math.ceil(orders.length / itemsPerPage);
    const pageOrders = orders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage);
    return (
      <>
        <h3 className="text-2xl font-bold text-lime-600 dark:text-lime-400 mb-8 flex items-center gap-3">
          <FiBox className="text-3xl" /> My Orders
        </h3>
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50">
            <FiBox className="mx-auto text-8xl text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400">No orders placed yet</p>
          </div>
        ) : (
          <>
            {pageOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 mb-6 transition hover:shadow-3xl hover:-translate-y-2"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                      <FiCalendar /> {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-5 py-2 rounded-full text-sm font-bold ${
                      order.status === "DELIVERED"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                        : order.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        : order.status === "CANCELLED"
                        ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-lg flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <FiCreditCard /> {order.paymentMethod.replace("_", " ")}
                  </p>
                  <p className="text-3xl font-bold text-lime-600 dark:text-lime-400">
                    {order.totalPrice} EGP
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => showOrderDetails(order)}
                    className="px-6 py-4 bg-white/50 dark:bg-black/30 text-lime-600 rounded-2xl hover:bg-lime-100 dark:hover:bg-lime-900 transition shadow-md flex items-center justify-center gap-2 font-semibold"
                  >
                    <FiInfo className="text-xl" /> View Details
                  </button>
                  {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="px-6 py-4 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-2xl hover:bg-red-200 dark:hover:bg-red-800 transition shadow-md flex items-center justify-center gap-2 font-semibold"
                    >
                      <FiXCircle className="text-xl" /> Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
            {total > 1 && (
              <div className="flex justify-center items-center gap-6 mt-8">
                <button
                  onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                  disabled={ordersPage === 1}
                  className="px-6 py-4 bg-lime-600 text-white rounded-2xl disabled:opacity-50 hover:bg-lime-700 transition font-semibold flex items-center gap-2"
                >
                  <FiChevronLeft /> Previous
                </button>
                <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  Page {ordersPage} of {total}
                </span>
                <button
                  onClick={() => setOrdersPage((p) => Math.min(total, p + 1))}
                  disabled={ordersPage === total}
                  className="px-6 py-4 bg-lime-600 text-white rounded-2xl disabled:opacity-50 hover:bg-lime-700 transition font-semibold flex items-center gap-2"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  const renderRepairs = () => {
    const itemsPerPage = 3;
    const totalPages = Math.ceil(repairRequests.length / itemsPerPage);
    const pageRepairs = repairRequests.slice((repairsPage - 1) * itemsPerPage, repairsPage * itemsPerPage);

    return (
      <>
        <h3 className="text-2xl font-bold text-lime-600 dark:text-lime-400 mb-8 flex items-center gap-3">
          <FiTool className="text-3xl" /> Repair Requests
        </h3>
        {repairRequests.length === 0 ? (
          <div className="text-center py-16 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50">
            <FiTool className="mx-auto text-8xl text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400">No repair requests yet</p>
          </div>
        ) : (
          <>
            {pageRepairs.map((req) => {
              const isQuoteSent = req.status === "QUOTE_SENT";
              const isQuoteApproved = req.status === "QUOTE_APPROVED";
              const hasPrice = req.price;
              return (
                <div
                  key={req.id}
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80 mb-6 transition-all hover:shadow-3xl hover:-translate-y-2"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">Request #{req.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-lg text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                        <FiHome /> {req.shopName}
                      </p>
                    </div>
                    <span
                      className={`px-5 py-2 rounded-full text-sm font-bold ${
                        isQuoteApproved
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          : isQuoteSent
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                          : req.status === "CANCELLED"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {req.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 line-clamp-3">{req.description || "No description provided"}</p>
                  {hasPrice && (
                    <p className="text-3xl font-bold text-lime-600 dark:text-lime-400 mb-8 flex items-center gap-2">
                      <FiDollarSign /> {req.price} EGP
                    </p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => handleViewRepair(req.id)}
                      className="px-6 py-4 bg-white/50 dark:bg-black/30 text-lime-600 rounded-2xl hover:bg-lime-100 dark:hover:bg-lime-900 transition shadow-md flex items-center justify-center gap-2 font-semibold"
                    >
                      <FiInfo className="text-xl" /> Details
                    </button>
                    <button
                      onClick={() => handleEditRepair(req)}
                      className="px-6 py-4 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-2xl hover:bg-amber-200 dark:hover:bg-amber-800 transition shadow-md flex items-center justify-center gap-2 font-semibold"
                    >
                      <FiEdit2 className="text-xl" /> Edit
                    </button>
                    {isQuoteSent && hasPrice && (
                      <button
                        onClick={() => handleAcceptQuote(req)}
                        className="px-6 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition shadow-xl font-bold flex items-center justify-center gap-2"
                      >
                        <FiCheckCircle className="text-xl" /> Accept Quote
                      </button>
                    )}
                    {isQuoteApproved && hasPrice && (
                      <>
                        <button
                          onClick={() => handleConfirmRepair(req)}
                          className="px-6 py-4 bg-lime-600 text-white rounded-2xl hover:bg-lime-700 transition shadow-xl font-bold flex items-center justify-center gap-2"
                        >
                          <FiTruck className="text-xl" /> Confirm & Pay
                        </button>
                        <button
                          onClick={() => handleCancelRepair(req.id)}
                          className="px-6 py-4 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-2xl hover:bg-red-200 dark:hover:bg-red-800 transition shadow-md flex items-center justify-center gap-2 font-semibold"
                        >
                          <FiXCircle className="text-xl" /> Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-8">
                <button
                  onClick={() => setRepairsPage((p) => Math.max(1, p - 1))}
                  disabled={repairsPage === 1}
                  className="px-8 py-4 bg-lime-600 text-white rounded-2xl disabled:opacity-50 hover:bg-lime-700 transition font-semibold flex items-center gap-2"
                >
                  <FiChevronLeft /> Previous
                </button>
                <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  Page {repairsPage} of {totalPages}
                </span>
                <button
                  onClick={() => setRepairsPage((p) => Math.min(totalPages, p + 1))}
                  disabled={repairsPage === totalPages}
                  className="px-8 py-4 bg-lime-600 text-white rounded-2xl disabled:opacity-50 hover:bg-lime-700 transition font-semibold flex items-center gap-2"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-white via-lime-50 to-gray-100"} pt-16`}>
      <section className={`relative overflow-hidden py-16 md:py-24 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent">
                My Account
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Manage your profile, addresses, orders, and repair requests — all in one place.
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                  <div className="text-4xl font-bold text-lime-600 dark:text-lime-400 flex items-center justify-center gap-2">
                    <FiZap /> 75.2%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Avg daily activity</p>
                </div>
                <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                  <div className="text-4xl font-bold text-lime-600 dark:text-lime-400 flex items-center justify-center gap-2">
                    <FiUsers /> ~20K
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Active users</p>
                </div>
                <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                  <div className="flex items-center justify-center gap-1 text-yellow-500 text-4xl">
                    {[...Array(4)].map((_, i) => (
                      <FiStar key={i} fill="currentColor" />
                    ))}
                    <FiStar fill="currentColor" className="text-yellow-300" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">4.5 Average rating</p>
                </div>
              </div>
            </div>
            <div className="relative h-96 lg:h-[600px] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-150" />
              <div className="relative w-full h-full">
                <div className="absolute top-10 left-10 w-48 h-64 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl rotate-12 hover:rotate-6 transition-transform duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-8 bg-lime-500 rounded w-16"></div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="w-8 h-8 bg-lime-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-10 right-10 w-56 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl -rotate-6 hover:-rotate-3 transition-transform duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      <div className="w-10 h-10 bg-lime-500 rounded-full flex items-center justify-center">
                        <FiUser className="text-white text-lg" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                      <div className="h-3 bg-lime-500 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-10 hover:scale-110 transition-all duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="p-4">
                    <div className="w-16 h-16 bg-lime-500 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                      <FiMapPin className="text-white text-2xl" />
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {[
            { id: "profile", label: "Profile", icon: <FiUser className="text-2xl" /> },
            { id: "addresses", label: "Addresses", icon: <FiMapPin className="text-2xl" /> },
            { id: "orders", label: "Orders", icon: <FiBox className="text-2xl" /> },
            { id: "repairs", label: "Repairs", icon: <FiTool className="text-2xl" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex flex-col items-center gap-3 px-8 py-6 rounded-3xl font-bold text-lg transition-all shadow-xl ${
                activeSection === tab.id
                  ? "bg-gradient-to-br from-lime-500 to-emerald-600 text-white scale-105"
                  : "bg-white/40 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:bg-lime-100 dark:hover:bg-lime-900"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-8">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {activeSection === "profile" && renderProfile()}
              {activeSection === "addresses" && renderAddresses()}
              {activeSection === "orders" && renderOrders()}
              {activeSection === "repairs" && renderRepairs()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Account;