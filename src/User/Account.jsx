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
  // ────── Helper to safely render any value ──────
  const safe = (val) =>
    val === null || val === undefined
      ? "—"
      : typeof val === "object"
      ? JSON.stringify(val, null, 2)
      : String(val);

  // ────── Items list ──────
  const itemsHtml =
    order.orderItems?.length > 0
      ? order.orderItems
          .map(
            (i) => `
            <div class="flex justify-between py-1">
              <span>• <strong>${safe(i.productName)}</strong> × ${safe(i.quantity)}</span>
              <span class="font-medium">${safe(i.priceAtCheckout)} EGP</span>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 ml-4">
              Shop: <strong>${safe(i.shopName)}</strong>
            </div>
          `
          )
          .join("")
      : '<p class="text-gray-500 dark:text-gray-400">No items</p>';

  // ────── Payment info ──────
  const paymentHtml = order.paymentMethod
    ? `
        <p>
          <strong>Payment Method:</strong>
          <span class="capitalize">
            ${safe(order.paymentMethod).toLowerCase().replace("_", " ")}
          </span>
          ${order.paymentId ? `<br/><span class="text-xs text-gray-500 dark:text-gray-400">ID: ${safe(order.paymentId).slice(0, 12)}…</span>` : ""}
        </p>
      `
    : '<p class="text-gray-500 dark:text-gray-400">—</p>';

  // ────── Delivery address ──────
  const deliveryHtml = order.deliveryAddressId
    ? <p><strong>Delivery Address ID:</strong> #${safe(order.deliveryAddressId)}</p>
    : '<p class="text-gray-500 dark:text-gray-400">—</p>';

  // ────── Title (shortened order ID) ──────
  const title = `Order #${safe(order.id).slice(0, 8).toUpperCase()}`;

  Swal.fire({
    title: <div class="text-xl font-bold">${title}</div>,
    html: `
      <div class="text-left space-y-3 text-sm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>User ID:</strong> <span class="font-mono text-xs">${safe(order.userId).slice(0, 12)}…</span></p>
            <p>
              <strong>Status:</strong>
              <span class="px-2 py-1 rounded-full text-xs font-medium ${
                order.status === "DELIVERED"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : order.status === "PENDING"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : order.status === "CANCELLED"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              }">
                ${safe(order.status)}
              </span>
            </p>
            <p><strong>Created:</strong> ${new Date(order.createdAt).toLocaleString("en-EG", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Africa/Cairo",
            })}</p>
          </div>

          <div>
            ${paymentHtml}
            ${deliveryHtml}
          </div>
        </div>

        <hr class="my-3 border-gray-300 dark:border-gray-600"/>

        <div>
          <p class="font-semibold mb-2">Items:</p>
          <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
            ${itemsHtml}
            <div class="border-t border-dashed border-gray-400 dark:border-gray-600 mt-2 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span class="text-lime-600 dark:text-lime-400">${safe(order.totalPrice)} EGP</span>
            </div>
          </div>
        </div>
      </div>
    `,
    width: 720,
    showCloseButton: true,
    customClass: {
      popup: "font-sans",
    },
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

  const renderRepairs = () => {
    const itemsPerPage = 3;
    const total = Math.ceil(repairRequests.length / itemsPerPage);
    const pageRepairs = repairRequests.slice((repairsPage - 1) * itemsPerPage, repairsPage * itemsPerPage);

    return (
      <>
        <h3 className="text-xl font-bold text-lime-600 dark:text-lime-400 mb-6 flex items-center gap-2">
          <FiTool /> Repair Requests
        </h3>

        {repairRequests.length === 0 ? (
          <div className="text-center py-12 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
            <FiTool className="mx-auto text-6xl text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No repair requests.</p>
          </div>
        ) : (
          <>
            {pageRepairs.map((req) => (
              <div
                key={req.id}
                className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 mb-4 transition hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">Repair #{req.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <FiHome /> {req.shopName}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      req.status.includes("ACCEPT") || req.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                        : req.status.includes("PENDING") || req.status === "QUOTE_SENT"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    }`}
                  >
                    {req.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                  Issue: {req.description}
                </p>
                {req.price && (
                  <p className="font-bold text-lime-600 dark:text-lime-400">
                    <FiFileText /> {req.price} EGP
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleViewRepair(req.id)}
                    className="flex-1 flex justify-center gap-1 px-3 py-2 bg-white/50 dark:bg-black/30 text-lime-600 rounded-xl hover:bg-lime-100 dark:hover:bg-lime-900 transition text-sm"
                  >
                    <FiInfo /> View
                  </button>
                  <button
                    onClick={() => handleEditRepair(req)}
                    className="flex-1 flex justify-center gap-1 px-3 py-2 bg-white/50 dark:bg-black/30 text-amber-600 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900 transition text-sm"
                  >
                    <FiEdit3 /> Edit
                  </button>
                  <button
                    onClick={() => handleCancelRepair(req.id)}
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
                  onClick={() => setRepairsPage((p) => Math.max(1, p - 1))}
                  disabled={repairsPage === 1}
                  className="p-2 bg-lime-600 text-white rounded-xl disabled:bg-gray-400 hover:bg-lime-700 transition"
                >
                  <FiChevronLeft />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page {repairsPage} / {total}
                </span>
                <button
                  onClick={() => setRepairsPage((p) => Math.min(total, p + 1))}
                  disabled={repairsPage === total}
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
              <h1 className="text-5xl md:text-6xl font-extrabold drop-shadow-md text-lime-700 font-bold  leading-tight">
                Your <span className="underline decoration-lime-500 decoration-4"> account</span> 
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