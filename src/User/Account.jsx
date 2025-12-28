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
  FiEdit3,
  FiChevronLeft,
  FiChevronRight,
  FiXCircle,
  FiStar,
  FiUsers,
  FiZap,
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
  // ──────────────────────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState("profile");
  const [userProfile, setUserProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [categories, setCategories] = useState([]);
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
  const [showCookieBanner, setShowCookieBanner] = useState(true);
  // ──────────────────────────────────────────────────────────────
  // FETCH ALL DATA (single request → less flicker)
  // ──────────────────────────────────────────────────────────────
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
    fetchAll();
  }, [fetchAll]);
  // ──────────────────────────────────────────────────────────────
  // ADDRESS HELPERS
  // ──────────────────────────────────────────────────────────────
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
  // ──────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────
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
  const safe = (val) =>
    val === null || val === undefined || val === "" ? "—" : String(val).trim();
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Africa/Cairo",
    });
  };
  const getStatusBadge = (status) => {
    const s = safe(status).toUpperCase();
    const map = {
      DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };
    const color = map[s] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    return <span class="px-3 py-1 rounded-full text-xs font-bold">${s}</span>;
  };
  // Build items HTML safely (no JSX inside template)
  const itemsHtml = order.orderItems?.length > 0
    ? order.orderItems
        .map((item) => {
          const shopLine = item.shopName
            ? <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Shop: <strong>{safe(item.shopName)}</strong></div>
            : "";
          return `
            <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
              <div class="flex-1">
                <div class="font-semibold text-gray-900 dark:text-white">
                  ${safe(item.productName)}
                  <span class="text-gray-500 dark:text-gray-400 text-sm"> × ${safe(item.quantity)}</span>
                </div>
                ${safe(item.shopName)}
              </div>
              <div class="font-bold text-lime-600 dark:text-lime-400">
                ${(Number(item.priceAtCheckout) * Number(item.quantity)).toFixed(2)} EGP
              </div>
            </div>
          `;
        })
        .join("")
    : '<p class="text-gray-500 dark:text-gray-400 text-center py-6">No items found</p>';
  // Delivery address (full details)
  // const addr = order.deliveryAddressDetails || order.address || {};
  // const addressHtml = addr.street
  // ? `
  // <div class="space-y-1 text-sm">
  // <p class="font-medium">${safe(addr || "Customer")}</p>
  // <p>${safe(addr.street)}, ${safe(addr.city)}${addr.governorate ? ", " + safe(addr.governorate) : ""}</p>
  // ${addr.apartment || addr.building ? <p class="text-xs text-gray-600 dark:text-gray-400">Apt/Floor: ${safe(addr.apartment)} - ${safe(addr.building)}</p> : ""}
  // <p class="text-xs text-gray-600 dark:text-gray-400">Phone: ${safe(addr.phone || "Not provided")}</p>
  // </div>
  // `
  // : '<p class="text-gray-500 dark:text-gray-400">No address selected</p>';
  // Payment method with icon
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
        ${order.paymentId ? <p class="text-xs text-gray-500 dark:text-gray-400">ID: ${safe(order.paymentId).slice(0, 12)}...</p> : ""}
      </div>
    </div>
  `;
  // Final SweetAlert
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
        <!-- Top Summary -->
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
        <!-- Items -->
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
        title:`Repair #${r.id.slice(0, 8)}`,
        html: `<div class="text-left space-y-2">
          <p><strong>Shop:</strong> ${r.shopName}</p>
          <p><strong>Issue:</strong> ${r.description}</p>
          <p><strong>Status:</strong> ${r.status}</p>
          ${r.price ? <p><strong>Quote:</strong> ${r.price} EGP</p> : ""}
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
  const handleCancelRepair = async (id) => {
    const c = await Swal.fire({ title: "Cancel Repair?", icon: "warning", showCancelButton: true });
    if (!c.isConfirmed) return;
    try {
      await api.delete(`/api/users/repair-request/${id}/cancel`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAll();
      Swal.fire({ title: "Cancelled!", icon: "success", toast: true, position: "top-end", timer: 1500 });
    } catch {
      Swal.fire({ title: "Error", text: "Failed to cancel", icon: "error", toast: true, position: "top-end", timer: 1500 });
    }
  };
  // ──────────────────────────────────────────────────────────────
  // RENDER SECTIONS (mono-tree)
  // ──────────────────────────────────────────────────────────────
  const renderProfile = () => {
    if (isEditingProfile) {
      return (
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-xl font-bold text-lime-600 dark:text-lime-400 mb-4 flex items-center gap-2">
            <FiEdit2 /> Edit Profile
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <input
              placeholder="First Name"
              value={profileForm.first_name}
              onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500"
              required
            />
            <input
              placeholder="Last Name"
              value={profileForm.last_name}
              onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500"
              required
            />
            <input
              placeholder="Phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500"
              required
            />
            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2.5 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition shadow-md">
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-5 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition shadow-md flex items-center gap-2"
              >
                <FiX /> Cancel
              </button>
            </div>
          </form>
        </div>
      );
    }
    return (
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-2">
            <FiUser /> My Profile
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditingProfile(true)}
              className="p-2 bg-white/50 dark:bg-black/30 text-lime-600 rounded-xl hover:bg-lime-100 dark:hover:bg-lime-900 transition"
            >
              <FiEdit2 />
            </button>
            <button
              onClick={handleDeleteAccount}
              className="p-2 bg-white/50 dark:bg-black/30 text-red-600 rounded-xl hover:bg-red-100 dark:hover:bg-red-900 transition"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <FiUser /> {userProfile?.first_name} {userProfile?.last_name}
          </p>
          <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <FiMail /> {userProfile?.email}
          </p>
          <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <FiPhone /> {userProfile?.phone || "—"}
          </p>
          <p className="flex items-center gap-2">
            Status:{" "}
            <span
              className={`ml-2 px-3 py-1 rounded-full text-xs font-bold ${
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
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-xl font-bold text-lime-600 dark:text-lime-400 mb-4">
            {editingAddressId ? "Edit" : "Add"} Address
          </h3>
          <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="State"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                className="px-4 py-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500"
                required
              />
              <input
                placeholder="City"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="px-4 py-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500"
                required
              />
              <input
                placeholder="Street"
                value={addressForm.street}
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                className="px-4 py-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500"
                required
              />
              <input
                placeholder="Building/Apt"
                value={addressForm.building}
                onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })}
                className="px-4 py-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500"
                required
              />
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={addressForm.notes}
              onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500"
              rows={2}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                className="w-4 h-4 text-lime-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Default address</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" className="px-5 py-2.5 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition shadow-md">
                {editingAddressId ? "Update" : "Add"}
              </button>
              <button type="button" onClick={resetAddressForm} className="px-5 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition shadow-md">
                Cancel
              </button>
            </div>
          </form>
        </div>
      );
    }
    return (
      <>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-2">
            <FiMapPin /> My Addresses
          </h3>
          <button
            onClick={() => setIsAddingAddress(true)}
            className="flex items-center gap-2 px-4 py-2 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition shadow-md text-sm"
          >
            <FiPlus /> Add
          </button>
        </div>
        {addresses.length === 0 ? (
          <div className="text-center py-12 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <FiMapPin className="mx-auto text-6xl text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No addresses yet.</p>
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-6 rounded-2xl shadow-lg border ${
                addr.isDefault ? "border-lime-500" : "border-gray-200/50 dark:border-gray-700/50"
              } mb-4 transition hover:-translate-y-1`}
            >
              {addr.isDefault && <span className="absolute top-3 right-3 bg-lime-600 text-white text-xs px-2 py-1 rounded-full">Default</span>}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-100">
                    {addr.street}, {addr.building}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {addr.city}, {addr.state}
                  </p>
                  {addr.notes && <p className="text-xs italic text-gray-500 dark:text-gray-400 mt-1">"{addr.notes}"</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditAddress(addr)}
                    className="p-2 bg-white/50 dark:bg-black/30 text-lime-600 rounded-xl hover:bg-lime-100 dark:hover:bg-lime-900 transition"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-2 bg-white/50 dark:bg-black/30 text-red-600 rounded-xl hover:bg-red-100 dark:hover:bg-red-900 transition"
                  >
                    <FiTrash2 />
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
        <h3 className="text-xl font-bold text-lime-600 dark:text-lime-400 mb-6 flex items-center gap-2">
          <FiBox /> My Orders
        </h3>
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <FiBox className="mx-auto text-6xl text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No orders yet.</p>
          </div>
        ) : (
          <>
            {pageOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 mb-4 transition hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <FiCalendar /> {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                        : order.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <FiFileText /> {order.paymentMethod}
                </p>
                <p className="font-bold text-lime-600 dark:text-lime-400">
                  <FiDollarSign /> {order.totalPrice} EGP
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => showOrderDetails(order)}
                    className="flex-1 flex justify-center gap-1 px-3 py-2 bg-white/50 dark:bg-black/30 text-lime-600 rounded-xl hover:bg-lime-100 dark:hover:bg-lime-900 transition text-sm"
                  >
                    <FiInfo /> View
                  </button>
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="flex-1 flex justify-center gap-1 px-3 py-2 bg-white/50 dark:bg-black/30 text-red-600 rounded-xl hover:bg-red-100 dark:hover:bg-red-900 transition text-sm"
                  >
                    <FiXCircle /> Cancel
                  </button>
                </div>
              </div>
            ))}
            {total > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                  disabled={ordersPage === 1}
                  className="p-2 bg-lime-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-lime-700 transition"
                >
                  <FiChevronLeft />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page {ordersPage} / {total}
                </span>
                <button
                  onClick={() => setOrdersPage((p) => Math.min(total, p + 1))}
                  disabled={ordersPage === total}
                  className="p-2 bg-lime-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-lime-700 transition"
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </>
    );
  };
  // const handleEditRepair = async (req) => {
  // let categories = [];
  // try {
  // const res = await api.get("/api/categories");
  // categories = res.data.content || res.data || [];
  // } catch {
  // categories = [
  // { id: "1", name: "Phone" }, { id: "2", name: "Laptop" }, { id: "3", name: "Tablet" },
  // { id: "4", name: "TV" }, { id: "5", name: "Desktop" }, { id: "6", name: "Gaming" },
  // ];
  // }
  // const { value: form } = await Swal.fire({
  // title: `Edit Repair #${req.id.slice(0, 8)}`,
  // html: `
  // <div class="space-y-5 text-left">
  // <div>
  // <label class="block text-sm font-medium mb-2">Device Category</label>
  // <div class="relative">
  // <button type="button" id="catBtn" class="w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl flex justify-between items-center">
  // <span>${categories.find(c => c.id === req.categoryId)?.name || "Select"}</span>
  // <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
  // </button>
  // <div id="catOptions" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto hidden">
  // ${categories.map(c => `
  // <button type="button" onclick="selectCat('${c.id}', '${c.name}')" class="block w-full text-left px-4 py-3 hover:bg-lime-50 dark:hover:bg-lime-900">
  // ${c.name}
  // </button>
  // `).join("")}
  // </div>
  // </div>
  // <input type="hidden" id="selectedCatId" value="${req.categoryId}">
  // </div>
  // <div>
  // <label class="block text-sm font-medium mb-2">Description</label>
  // <textarea id="description" class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-lime-500 resize-none" rows="4">${req.description || ""}</textarea>
  // </div>
  // <div>
  // <label class="block text-sm font-medium mb-2">Update Status</label>
  // <div class="relative">
  // <button type="button" id="statusBtn" class="w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl flex justify-between items-center">
  // <span>No change</span>
  // <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
  // </button>
  // <div id="statusOptions" class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg hidden">
  // <button type="button" onclick="selectStatus('')" class="block w-full text-left px-4 py-3 hover:bg-lime-50 dark:hover:bg-lime-900">No change</button>
  // <button type="button" onclick="selectStatus('PENDING')" class="block w-full text-left px-4 py-3 hover:bg-lime-50 dark:hover:bg-lime-900">Pending</button>
  // <button type="button" onclick="selectStatus('IN_PROGRESS')" class="block w-full text-left px-4 py-3 hover:bg-lime-50 dark:hover:bg-lime-900">In Progress</button>
  // <button type="button" onclick="selectStatus('READY_FOR_PICKUP')" class="block w-full text-left px-4 py-3 hover:bg-lime-50 dark:hover:bg-lime-900">Ready for Pickup</button>
  // <button type="button" onclick="selectStatus('COMPLETED')" class="block w-full text-left px-4 py-3 hover:bg-lime-50 dark:hover:bg-lime-900">Completed</button>
  // <button type="button" onclick="selectStatus('CANCELLED')" class="block w-full text-left px-4 py-3 hover:bg-lime-50 dark:hover:bg-lime-900">Cancelled</button>
  // </div>
  // </div>
  // <input type="hidden" id="selectedStatus" value="">
  // </div>
  // </div>
  // `,
  // showCancelButton: true,
  // confirmButtonText: "Update",
  // didOpen: () => {
  // document.getElementById("catBtn").onclick = () => document.getElementById("catOptions").classList.toggle("hidden");
  // document.getElementById("statusBtn").onclick = () => document.getElementById("statusOptions").classList.toggle("hidden");
  // window.selectCat = (id, name) => {
  // document.getElementById("catBtn").querySelector("span").textContent = name;
  // document.getElementById("selectedCatId").value = id;
  // document.getElementById("catOptions").classList.add("hidden");
  // };
  // window.selectStatus = (status) => {
  // const label = status === "" ? "No change" : status.replace(/_/g, " ");
  // document.getElementById("statusBtn").querySelector("span").textContent = label;
  // document.getElementById("selectedStatus").value = status;
  // document.getElementById("statusOptions").classList.add("hidden");
  // };
  // },
  // preConfirm: () => {
  // const payload = {};
  // const newDesc = document.getElementById("description").value.trim();
  // const newCat = document.getElementById("selectedCatId").value;
  // const newStatus = document.getElementById("selectedStatus").value;
  // if (newDesc !== req.description) payload.description = newDesc;
  // if (newCat !== req.categoryId.toString()) payload.categoryId = newCat;
  // return { main: Object.keys(payload).length > 0 ? payload : null, status: newStatus || null };
  // },
  // });
  // if (form) {
  // try {
  // if (form.main) {
  // await api.put(`/api/users/repair-request/${req.shopId}/${req.id}`, form.main, { headers: { Authorization: `Bearer ${token}` } });
  // }
  // if (form.status) {
  // await api.put(`/api/users/repair-request/${req.id}/status`, { status: form.status }, { headers: { Authorization: `Bearer ${token}` } });
  // }
  // fetchAll();
  // Swal.fire("Updated!", "Repair request updated", "success");
  // } catch {
  // Swal.fire("Error", "Update failed", "error");
  // }
  // }
  // };
const renderRepairs = () => {
  const itemsPerPage = 3;
  const totalPages = Math.ceil(repairRequests.length / itemsPerPage);
  const pageRepairs = repairRequests.slice(
    (repairsPage - 1) * itemsPerPage,
    repairsPage * itemsPerPage
  );
  // Fetch device categories (for edit modal)
  const fetchCategories = async () => {
    try {
      const res = await api.get('/api/categories');
      setCategories(res.data.content || res.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
      Swal.fire('Error', 'Failed to load device categories', 'error');
    }
  };
  // Accept Quote → Approve + Open Confirmation Modal
  const handleAcceptQuote = async (req) => {
    const result = await Swal.fire({
      title: 'Accept Quote?',
      text: `Accept ${req.price} EGP from ${req.shopName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Accept Quote',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
    });
    if (!result.isConfirmed) return;
    try {
      // Step 1: Approve the quote (change status to QUOTE_APPROVED)
      await api.put(
        `/api/users/repair-request/${req.id}/status`,
        { status: 'QUOTE_APPROVED' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Step 2: Refresh data
      fetchAll();
      // Step 3: Immediately show confirmation & payment modal
      setTimeout(() => handleConfirmRepair(req), 500); // Small delay to ensure UI updates
      Swal.fire({
        icon: 'success',
        title: 'Quote Accepted!',
        text: 'Now complete your order details',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to accept quote', 'error');
    }
  };
  // Confirm Repair (with address, delivery, payment)
  const handleConfirmRepair = async (req) => {
    if (!req.price) return Swal.fire('No Price', 'No quote available yet', 'info');
    let userAddresses = [];
    try {
      const res = await api.get('/api/users/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      userAddresses = res.data.content || res.data || [];
    } catch (err) {
      return Swal.fire('Error', 'Failed to load addresses', 'error');
    }
    if (userAddresses.length === 0) {
      return Swal.fire({
        title: 'No Address',
        text: 'Please add a delivery address first',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
    }
    const defaultAddr = userAddresses.find(a => a.isDefault) || userAddresses[0];
    const { value: form } = await Swal.fire({
      title: `Confirm Repair #${req.id.slice(0, 8)}`,
      width: '700px',
      html: `
        <div dir="ltr" class="text-left space-y-6 dark:bg-gray-950 font-cairo">
          <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border-2 ">
            <p class="text-lg font-bold">${req.shopName}</p>
            <p class="text-3xl font-bold text-lime-600 dark:text-lime-400 mt-3">${req.price} EGP</p>
          </div>
          <!-- Address Dropdown -->
          <div>
            <label class="block text-sm font-bold mb-2">Delivery Address</label>
            <div class="relative">
              <button type="button" id="addressBtn" class="w-full px-5 py-4 text-right bg-white dark:bg-gray-800 border-2 rounded-xl flex justify-between items-center hover:border-lime-500 transition">
                <span id="addrText">${defaultAddr.street}, ${defaultAddr.building}, ${defaultAddr.city}</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div id="addrOptions" class="absolute z-30 w-full mt-2 bg-white dark:bg-gray-800 border-2 rounded-xl shadow-2xl max-h-64 overflow-y-auto hidden">
                ${userAddresses.map(addr => `
                  <button type="button" onclick="selectAddr('${addr.id}', '${addr.street}, ${addr.building}, ${addr.city}')"
                    class="block w-full text-right px-5 py-3 hover:bg-lime-50 dark:hover:bg-lime-900 transition ${addr.isDefault ? 'bg-lime-100 font-medium' : ''}">
                    ${addr.street}, ${addr.building} - ${addr.city} ${addr.isDefault ? ' (Default)' : ''}
                  </button>
                `).join('')}
              </div>
            </div>
            <input type="hidden" id="selectedAddrId" value="${defaultAddr.id}">
          </div>
          <!-- Delivery Method -->
          <div>
            <label class="block text-sm font-bold mb-2">Delivery Method</label>
            <div class="relative">
              <button type="button" id="deliveryBtn" class="w-full px-5 py-4 text-right bg-white dark:bg-gray-800 border-2 rounded-xl flex justify-between items-center hover:border-lime-500 transition">
                <span>Home Delivery</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div id="deliveryOptions" class="absolute z-30 w-full mt-2 bg-white dark:bg-gray-800 border-2 rounded-xl shadow-2xl hidden">
                <button type="button" onclick="selectDelivery('HOME_DELIVERY')" class="block w-full text-right px-5 py-3 hover:bg-lime-50">Home Delivery</button>
                <button type="button" onclick="selectDelivery('SHOP_VISIT')" class="block w-full text-right px-5 py-3 hover:bg-lime-50">Visit Shop</button>
                <button type="button" onclick="selectDelivery('PICKUP')" class="block w-full text-right px-5 py-3 hover:bg-lime-50">Courier Pickup</button>
              </div>
            </div>
            <input type="hidden" id="deliveryMethod" value="HOME_DELIVERY">
          </div>
          <!-- Payment Method -->
          <div>
            <label class="block text-sm font-bold mb-2">Payment Method</label>
            <div class="relative">
              <button type="button" id="paymentBtn" class="w-full px-5 py-4 text-right bg-white dark:bg-gray-800 border-2 rounded-xl flex justify-between items-center hover:border-lime-500 transition">
                <span>Cash on Delivery</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <div id="paymentOptions" class="absolute z-30 w-full mt-2 bg-white dark:bg-gray-800 border-2 rounded-xl shadow-2xl hidden">
                <button type="button" onclick="selectPayment('CASH')" class="block w-full text-right px-5 py-3 hover:bg-lime-50">Cash on Delivery</button>
                <button type="button" onclick="selectPayment('CREDIT_CARD')" class="block w-full text-right px-5 py-3 hover:bg-lime-50">Credit Card</button>
              </div>
            </div>
            <input type="hidden" id="paymentMethod" value="CASH">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirm & Pay',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#84cc16',
      didOpen: () => {
        const addrBtn = document.getElementById('addressBtn');
        const addrOptions = document.getElementById('addrOptions');
        addrBtn.onclick = () => addrOptions.classList.toggle('hidden');
        window.selectAddr = (id, text) => {
          document.getElementById('addrText').textContent = text.length > 40 ? text.slice(0, 40) + '...' : text;
          document.getElementById('selectedAddrId').value = id;
          addrOptions.classList.add('hidden');
        };
        const deliveryBtn = document.getElementById('deliveryBtn');
        const deliveryOptions = document.getElementById('deliveryOptions');
        deliveryBtn.onclick = () => deliveryOptions.classList.toggle('hidden');
        window.selectDelivery = (val) => {
          const text = val === 'HOME_DELIVERY' ? 'Home Delivery' : val === 'SHOP_VISIT' ? 'Visit Shop' : 'Courier Pickup';
          deliveryBtn.querySelector('span').textContent = text;
          document.getElementById('deliveryMethod').value = val;
          deliveryOptions.classList.add('hidden');
        };
        const paymentBtn = document.getElementById('paymentBtn');
        const paymentOptions = document.getElementById('paymentOptions');
        paymentBtn.onclick = () => paymentOptions.classList.toggle('hidden');
        window.selectPayment = (val) => {
          paymentBtn.querySelector('span').textContent = val === 'CASH' ? 'Cash on Delivery' : 'Credit Card';
          document.getElementById('paymentMethod').value = val;
          paymentOptions.classList.add('hidden');
        };
      },
      preConfirm: () => ({
        deliveryAddress: document.getElementById('selectedAddrId').value,
        deliveryMethod: document.getElementById('deliveryMethod').value,
        paymentMethod: document.getElementById('paymentMethod').value,
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
        if (form.paymentMethod === 'CREDIT_CARD' && response.data.paymentURL) {
          Swal.fire({
            title: 'Redirecting to Payment',
            text: 'Please complete your payment',
            icon: 'info',
            timer: 2500,
            showConfirmButton: false,
          }).then(() => {
            window.location.href = response.data.paymentURL;
          });
        } else {
          Swal.fire('Success!', 'Your repair request has been confirmed', 'success');
        }
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Failed to confirm repair', 'error');
      }
    }
  };
  // Cancel Repair
  const handleCancelRepair = async (id) => {
    const result = await Swal.fire({
      title: 'Cancel Request?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Cancel',
      cancelButtonText: 'No, Keep',
      confirmButtonColor: '#ef4444',
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/users/repair-request/repairs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire('Cancelled', 'Repair request cancelled successfully', 'success');
        fetchAll();
      } catch (err) {
        Swal.fire('Error', 'Failed to cancel request', 'error');
      }
    }
  };
  return (
    <>
      <h3 className="text-2xl font-bold text-lime-600 dark:text-lime-400 mb-8 text-right">
        Repair Requests
      </h3>
      {repairRequests.length === 0 ? (
        <div className="text-center py-16 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl border border-gray-200/60">
          <p className="text-lg text-gray-600 dark:text-gray-400">No repair requests yet</p>
        </div>
      ) : (
        <>
          {pageRepairs.map((req) => {
            const isQuoteSent = req.status === 'QUOTE_SENT';
            const isQuoteApproved = req.status === 'QUOTE_APPROVED';
            const hasPrice = req.price;
            return (
              <div
                key={req.id}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/80 dark:border-gray-700/80 mb-6 transition-all hover:shadow-2xl"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xl font-bold">Request #{req.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{req.shopName}</p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-xs font-bold ${
                      isQuoteApproved
                        ? 'bg-emerald-100 text-emerald-700'
                        : isQuoteSent
                        ? 'bg-purple-100 text-purple-700'
                        : req.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {req.status}
                    {/* {isQuoteApproved
                      ? 'Quote Approved'
                      : isQuoteSent
                      ? 'Quote Sent'
                      : req.status === 'CANCELLED'
                      ? 'Cancelled'
                      : 'Pending'} */}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                  {req.description || 'No description'}
                </p>
                {hasPrice && (
                  <p className="text-2xl font-bold text-lime-600 dark:text-lime-400 mb-5">
                    {req.price} EGP
                  </p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleViewRepair(req.id)}
                    className="px-4 py-3 bg-white dark:bg-gray-700 border rounded-xl hover:bg-gray-50 transition text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleEditRepair(req)}
                    className="px-4 py-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition text-sm"
                  >
                    Edit
                  </button>
                  {/* Accept Quote Button - Only when QUOTE_SENT */}
                  {isQuoteSent && hasPrice && (
                    <button
                      onClick={() => handleAcceptQuote(req)}
                      className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-bold shadow-md"
                    >
                      Accept Quote
                    </button>
                  )}
                  {/* Confirm & Cancel - Only when QUOTE_APPROVED */}
                  {isQuoteApproved && hasPrice && (
                    <>
                      <button
                        onClick={() => handleConfirmRepair(req)}
                        className="px-4 py-3 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition font-bold shadow-md"
                      >
                        Confirm & Pay
                      </button>
                      <button
                        onClick={() => handleCancelRepair(req.id)}
                        className="px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-6 mt-8">
              <button
                onClick={() => setRepairsPage(p => Math.max(1, p - 1))}
                disabled={repairsPage === 1}
                className="px-5 py-3 bg-lime-600 text-white rounded-xl disabled:opacity-50 hover:bg-lime-700 transition font-medium"
              >
                Previous
              </button>
              <span className="text-lg font-bold">
                Page {repairsPage} of {totalPages}
              </span>
              <button
                onClick={() => setRepairsPage(p => Math.min(totalPages, p + 1))}
                disabled={repairsPage === totalPages}
                className="px-5 py-3 bg-lime-600 text-white rounded-xl disabled:opacity-50 hover:bg-lime-700 transition font-medium"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};
  // const renderRepairs = () => {
  // const itemsPerPage = 3;
  // const total = Math.ceil(repairRequests.length / itemsPerPage);
  // const pageRepairs = repairRequests.slice((repairsPage - 1) * itemsPerPage, repairsPage * itemsPerPage);
  // return (
  // <>
  // <h3 className="text-xl font-bold text-lime-600 dark:text-lime-400 mb-6 flex items-center gap-2">
  // <FiTool /> Repair Requests
  // </h3>
  // {repairRequests.length === 0 ? (
  // <div className="text-center py-12 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
  // <FiTool className="mx-auto text-6xl text-gray-400 mb-3" />
  // <p className="text-gray-600 dark:text-gray-400">No repair requests.</p>
  // </div>
  // ) : (
  // <>
  // {pageRepairs.map((req) => (
  // <div
  // key={req.id}
  // className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 mb-4 transition hover:-translate-y-1"
  // >
  // <div className="flex justify-between items-start mb-3">
  // <div>
  // <p className="font-bold text-gray-900 dark:text-gray-100">Repair #{req.id.slice(0, 8)}</p>
  // <p className="text-sm text-gray-600 dark:text-gray-400">
  // <FiHome /> {req.shopName}
  // </p>
  // </div>
  // <span
  // className={`px-3 py-1 rounded-full text-xs font-bold`}
  // >
  // {req.status}
  // </span>
  // </div>
  // <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
  // Issue: {req.description}
  // </p>
  // {req.price && (
  // <p className="font-bold text-lime-600 dark:text-lime-400">
  // <FiFileText /> {req.price} EGP
  // </p>
  // )}
  // <div className="flex gap-2 mt-4">
  // <button
  // onClick={() => handleViewRepair(req.id)}
  // className="flex-1 flex justify-center gap-1 px-3 py-2 bg-white/50 dark:bg-black/30 text-lime-600 rounded-xl hover:bg-lime-100 dark:hover:bg-lime-900 transition text-sm"
  // >
  // <FiInfo /> View
  // </button>
  // <button
  // onClick={() => handleEditRepair(req)}
  // className="flex-1 flex justify-center gap-1 px-3 py-2 bg-white/50 dark:bg-black/30 text-amber-600 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900 transition text-sm"
  // >
  // <FiEdit3 /> Edit
  // </button>
  // <button
  // onClick={() => handleCancelRepair(req.id)}
  // className="flex-1 flex justify-center gap-1 px-3 py-2 bg-white/50 dark:bg-black/30 text-red-600 rounded-xl hover:bg-red-100 dark:hover:bg-red-900 transition text-sm"
  // >
  // <FiXCircle /> Cancel
  // </button>
  // </div>
  // </div>
  // ))}
  // {total > 1 && (
  // <div className="flex justify-center items-center gap-4 mt-6">
  // <button
  // onClick={() => setRepairsPage((p) => Math.max(1, p - 1))}
  // disabled={repairsPage === 1}
  // className="p-2 bg-lime-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-lime-700 transition"
  // >
  // <FiChevronLeft />
  // </button>
  // <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
  // Page {repairsPage} / {total}
  // </span>
  // <button
  // onClick={() => setRepairsPage((p) => Math.min(total, p + 1))}
  // disabled={repairsPage === total}
  // className="p-2 bg-lime-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-lime-700 transition"
  // >
  // <FiChevronRight />
  // </button>
  // </div>
  // )}
  // </>
  // )}
  // </>
  // );
  // };
  // ──────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ──────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-white via-lime-50 to-gray-100"} pt-16`}>
      {/* ───── HERO (Monotree style) ───── */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-extrabold drop-shadow-md text-lime-700 font-bold leading-tight">
                 <span className="underline decoration-lime-500 decoration-4"> Account</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
                Manage profile, addresses, orders, and repairs – all in one fast, friendly dashboard.
              </p>
              {/* <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-5 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500 outline-none"
                />
                <button className="px-6 py-3 bg-lime-500 text-black font-semibold rounded-xl hover:bg-lime-400 transition shadow-md">
                  Book a demo
                </button>
              </div> */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div>
                  <div className="text-3xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                    <FiZap /> 75.2%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg daily activity</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                    <FiUsers /> ~20K
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active users</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(4)].map((_, i) => (
                      <FiStar key={i} fill="currentColor" />
                    ))}
                    <FiStar fill="currentColor" className="text-yellow-300" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">4.5 Avg rating</p>
                </div>
              </div>
            </div>
            {/* Right – 3D mockup */}
            <div className="relative hidden md:block">
              <div className="relative w-full h-96">
                <div className="absolute inset-0 bg-gradient-to-br from-lime-100 to-teal-100 dark:from-lime-900 dark:to-teal-900 rounded-3xl blur-3xl opacity-50"></div>
                <div className="absolute top-10 left-10 w-48 h-64 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl rotate-12 transform-gpu overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-8 bg-lime-500 rounded w-16"></div>
                  </div>
                </div>
                <div className="absolute bottom-10 right-10 w-56 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl -rotate-6 transform-gpu overflow-hidden">
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      <div className="w-10 h-10 bg-lime-500 rounded-full flex items-center justify-center">
                        <FiUser className="text-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
                  <div className="p-4">
                    <div className="w-16 h-16 bg-lime-500 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                      <FiMapPin className="text-white text-2xl" />
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ───── TABS ───── */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {[
            { id: "profile", label: "Profile", icon: <FiUser /> },
            { id: "addresses", label: "Addresses", icon: <FiMapPin /> },
            { id: "orders", label: "Orders", icon: <FiBox /> },
            { id: "repairs", label: "Repairs", icon: <FiTool /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
                activeSection === tab.id
                  ? "bg-lime-600 text-white shadow-lg"
                  : "bg-white/30 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 hover:bg-lime-100 dark:hover:bg-lime-900"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        {/* ───── CONTENT ───── */}
        <div className="space-y-6">
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
      {/* ───── COOKIE BANNER ───── */}
      {/* {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="text-xl">Cookie</div>
              <p>
                We use cookies to enhance your experience. Learn more in our{" "}
                <a href="#" className="underline">
                  Cookie Policy
                </a>
                .
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCookieBanner(false)}
                className="px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition"
              >
                Accept
              </button>
              <button
                onClick={() => setShowCookieBanner(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};
export default Account;