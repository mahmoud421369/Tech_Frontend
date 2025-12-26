import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
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
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
} from 'react-icons/fi';
import api from '../api';

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
      Swal.fire({ title: "Profile Updated!", icon: "success", toast: true, position: "top-end", timer: 1500 });
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
      Swal.fire({ title: "Address Added!", icon: "success", toast: true, position: "top-end", timer: 1500 });
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
      Swal.fire({ title: "Address Updated!", icon: "success", toast: true, position: "top-end", timer: 1500 });
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
      Swal.fire({ title: "Address Deleted!", icon: "success", toast: true, position: "top-end", timer: 1500 });
    } catch {
      Swal.fire({ title: "Error", text: "Failed to delete", icon: "error", toast: true, position: "top-end", timer: 1500 });
    }
  };

  const showOrderDetails = (order) => {
    const safe = (val) => (val === null || val === undefined || val === "" ? "—" : String(val).trim());
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

    const itemsHtml = order.orderItems?.length > 0
      ? order.orderItems
          .map((item) => `
            <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
              <div class="flex-1">
                <div class="font-semibold text-gray-900 dark:text-white">
                  ${safe(item.productName)}
                  <span class="text-gray-500 dark:text-gray-400 text-sm"> × ${safe(item.quantity)}</span>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Shop: <strong>${safe(item.shopName)}</strong></div>
              </div>
              <div class="font-bold text-lime-600 dark:text-lime-400">
                ${(Number(item.priceAtCheckout) * Number(item.quantity)).toFixed(2)} EGP
              </div>
            </div>
          `)
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
              <p><strong>Status:</strong> <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">${safe(order.status)}</span></p>
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

  const renderProfile = () => {
    if (isEditingProfile) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-lime-600 dark:text-lime-400 mb-6 flex items-center gap-3">
            <FiEdit2 className="w-7 h-7" /> Edit Profile
          </h3>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                <input
                  type="text"
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/30 focus:border-lime-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                <input
                  type="text"
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/30 focus:border-lime-500 transition"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/30 focus:border-lime-500 transition"
                required
              />
            </div>
            <div className="flex gap-4">
              <button type="submit" className="px-8 py-3 bg-lime-600 text-white font-bold rounded-xl hover:bg-lime-700 transition shadow-lg">
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-8 py-3 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-400 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-3xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-4">
              <div className="w-16 h-16 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center">
                <FiUser className="w-8 h-8 text-lime-600 dark:text-lime-400" />
              </div>
              My Profile
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Personal information and account status</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-5 py-3 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition flex items-center gap-2 font-medium shadow-md"
            >
              <FiEdit2 /> Edit Profile
            </button>
            <button
              onClick={handleDeleteAccount}
              className="px-5 py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition flex items-center gap-2 font-medium"
            >
              <FiTrash2 /> Delete Account
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <FiUser className="w-6 h-6 text-lime-600 dark:text-lime-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {userProfile?.first_name} {userProfile?.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <FiMail className="w-6 h-6 text-lime-600 dark:text-lime-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email Address</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{userProfile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <FiPhone className="w-6 h-6 text-lime-600 dark:text-lime-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{userProfile?.phone || "Not provided"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              {userProfile?.activate ? (
                <FiCheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <FiAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Account Status</p>
                <p className={`text-lg font-semibold ${userProfile?.activate ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {userProfile?.activate ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <FiCalendar className="w-6 h-6 text-lime-600 dark:text-lime-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAddresses = () => {
    if (isAddingAddress || editingAddressId) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-lime-600 dark:text-lime-400 mb-6">
            {editingAddressId ? "Edit Address" : "Add New Address"}
          </h3>
          <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">State</label>
                <input
                  type="text"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/30 focus:border-lime-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City</label>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/30 focus:border-lime-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Street</label>
                <input
                  type="text"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/30 focus:border-lime-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Building / Apartment</label>
                <input
                  type="text"
                  value={addressForm.building}
                  onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })}
                  className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/30 focus:border-lime-500 transition"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
              <textarea
                value={addressForm.notes}
                onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })}
                rows={3}
                className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 focus:ring-4 focus:ring-lime-500/30 focus:border-lime-500 transition resize-none"
                placeholder="e.g. Near the pharmacy, 3rd floor"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="default"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                className="w-5 h-5 text-lime-600 rounded focus:ring-lime-500"
              />
              <label htmlFor="default" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Set as default address
              </label>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="px-8 py-3 bg-lime-600 text-white font-bold rounded-xl hover:bg-lime-700 transition shadow-lg">
                {editingAddressId ? "Update Address" : "Add Address"}
              </button>
              <button type="button" onClick={resetAddressForm} className="px-8 py-3 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-400 dark:hover:bg-gray-600 transition">
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
          <h3 className="text-3xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-4">
            <FiMapPin className="w-8 h-8" /> My Addresses
          </h3>
          <button
            onClick={() => setIsAddingAddress(true)}
            className="flex items-center gap-3 px-6 py-3 bg-lime-600 text-white font-bold rounded-xl hover:bg-lime-700 transition shadow-lg"
          >
            <FiPlus className="w-5 h-5" /> Add New Address
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700">
            <FiMapPin className="mx-auto text-8xl text-gray-300 dark:text-gray-600 mb-6" />
            <p className="text-xl text-gray-600 dark:text-gray-400">No addresses saved yet</p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">Add your first address to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border-2 transition-all hover:shadow-2xl ${
                  addr.isDefault ? "border-lime-500" : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {addr.isDefault && (
                  <div className="absolute top-4 right-4 bg-lime-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <FiCheckCircle /> Default
                  </div>
                )}
                <div className="space-y-3">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {addr.street}, {addr.building}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {addr.city}, {addr.state}
                  </p>
                  {addr.notes && (
                    <p className="text-sm italic text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                      "{addr.notes}"
                    </p>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => startEditAddress(addr)}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-3 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 rounded-xl hover:bg-lime-200 dark:hover:bg-lime-900/50 transition font-medium"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition font-medium"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
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
        <h3 className="text-3xl font-bold text-lime-600 dark:text-lime-400 mb-8 flex items-center gap-4">
          <FiBox className="w-8 h-8" /> My Orders
        </h3>
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700">
            <FiBox className="mx-auto text-8xl text-gray-300 dark:text-gray-600 mb-6" />
            <p className="text-xl text-gray-600 dark:text-gray-400">No orders yet</p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">Your order history will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {pageOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                        <FiCalendar /> {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold ${
                        order.status === "COMPLETED" || order.status === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          : order.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      }`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                      <p className="font-semibold capitalize">{order.paymentMethod?.replace("_", " ") || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Items</p>
                      <p className="font-semibold">{order.orderItems?.length || 0} product(s)</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                      <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{order.totalPrice} EGP</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => showOrderDetails(order)}
                      className="flex-1 flex justify-center items-center gap-2 px-6 py-3 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition font-medium shadow-md"
                    >
                      <FiInfo /> View Details
                    </button>
                    {(order.status === "PENDING" || order.status === "PROCESSING") && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex-1 flex justify-center items-center gap-2 px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition font-medium"
                      >
                        <FiXCircle /> Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {total > 1 && (
              <div className="flex justify-center items-center gap-6 mt-10">
                <button
                  onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                  disabled={ordersPage === 1}
                  className="px-6 py-3 bg-lime-600 text-white rounded-xl disabled:opacity-50 hover:bg-lime-700 transition font-medium flex items-center gap-2"
                >
                  <FiChevronLeft /> Previous
                </button>
                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  Page {ordersPage} of {total}
                </span>
                <button
                  onClick={() => setOrdersPage((p) => Math.min(total, p + 1))}
                  disabled={ordersPage === total}
                  className="px-6 py-3 bg-lime-600 text-white rounded-xl disabled:opacity-50 hover:bg-lime-700 transition font-medium flex items-center gap-2"
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
        <h3 className="text-3xl font-bold text-lime-600 dark:text-lime-400 mb-8 flex items-center gap-4">
          <FiTool className="w-8 h-8" /> Repair Requests
        </h3>
        {repairRequests.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700">
            <FiTool className="mx-auto text-8xl text-gray-300 dark:text-gray-600 mb-6" />
            <p className="text-xl text-gray-600 dark:text-gray-400">No repair requests yet</p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">Your repair history will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {pageRepairs.map((req) => {
                const status = req.status || "PENDING";
                const hasQuote = req.price > 0;
                return (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">Request #{req.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                          <FiHome /> {req.shopName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-bold ${
                            status === "COMPLETED" || status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                              : status === "CANCELLED"
                              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              : status.includes("QUOTE")
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          }`}
                        >
                          {status.replace("_", " ")}
                        </span>
                        {hasQuote && (
                          <p className="text-2xl font-bold text-lime-600 dark:text-lime-400 mt-3">
                            {req.price} EGP
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                      {req.description || "No description provided"}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <button
                        onClick={() => handleViewRepair(req.id)}
                        className="px-5 py-3 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 rounded-xl hover:bg-lime-200 dark:hover:bg-lime-900/50 transition font-medium flex items-center justify-center gap-2"
                      >
                        <FiInfo /> View
                      </button>
                      <button
                        onClick={() => handleEditRepair(req)}
                        className="px-5 py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900/50 transition font-medium flex items-center justify-center gap-2"
                      >
                        <FiEdit3 /> Edit
                      </button>
                      {hasQuote && status === "QUOTE_SENT" && (
                        <button
                          onClick={() => Swal.fire({ title: "Quote Received", text: `Shop quoted ${req.price} EGP`, icon: "info" })}
                          className="px-5 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition font-medium"
                        >
                          Accept Quote
                        </button>
                      )}
                      {(status === "PENDING" || status === "QUOTE_SENT") && (
                        <button
                          onClick={() => handleCancelRepair(req.id)}
                          className="px-5 py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition font-medium flex items-center justify-center gap-2"
                        >
                          <FiXCircle /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-10">
                <button
                  onClick={() => setRepairsPage(p => Math.max(1, p - 1))}
                  disabled={repairsPage === 1}
                  className="px-6 py-3 bg-lime-600 text-white rounded-xl disabled:opacity-50 hover:bg-lime-700 transition font-medium flex items-center gap-2"
                >
                  <FiChevronLeft /> Previous
                </button>
                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  Page {repairsPage} of {totalPages}
                </span>
                <button
                  onClick={() => setRepairsPage(p => Math.min(totalPages, p + 1))}
                  disabled={repairsPage === totalPages}
                  className="px-6 py-3 bg-lime-600 text-white rounded-xl disabled:opacity-50 hover:bg-lime-700 transition font-medium flex items-center gap-2"
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
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-extrabold drop-shadow-md text-lime-700 font-bold leading-tight">
                <span className="underline decoration-lime-500 decoration-4">Account</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
                Manage profile, addresses, orders, and repairs – all in one fast, friendly dashboard.
              </p>
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

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {[
            { id: "profile", label: "Profile", icon: <FiUser className="w-5 h-5" /> },
            { id: "addresses", label: "Addresses", icon: <FiMapPin className="w-5 h-5" /> },
            { id: "orders", label: "Orders", icon: <FiBox className="w-5 h-5" /> },
            { id: "repairs", label: "Repairs", icon: <FiTool className="w-5 h-5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
                activeSection === tab.id
                  ? "bg-lime-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-lime-50 dark:hover:bg-gray-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-10">
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