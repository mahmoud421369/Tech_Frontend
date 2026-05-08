import React, { useState, useEffect, useCallback, memo, useMemo, useTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Swal from "sweetalert2";
import {
  FiUser, FiMapPin, FiBox, FiTool, FiEdit2, FiTrash2,
  FiX, FiMail, FiPhone, FiPlus, FiInfo, FiCalendar,
  FiDollarSign, FiHome, FiChevronLeft, FiChevronRight,
  FiXCircle, FiUsers, FiZap, FiCheckCircle,
  FiCreditCard, FiTruck, FiCheck, FiShield, FiEdit,
  FiMapPin as FiLocation,
} from "react-icons/fi";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { RiLogoutBoxRLine, RiVerifiedBadgeLine, RiStarFill } from "react-icons/ri";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";

const queryClient = new QueryClient();

const STYLES = `
  .lime-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
  .lime-scroll::-webkit-scrollbar-track { background: transparent; }
  .lime-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#84cc16,#10b981); border-radius: 999px; }
  .lime-scroll { scrollbar-width: thin; scrollbar-color: #84cc16 transparent; }
  .tabs-scroll::-webkit-scrollbar { display: none; }
  .tabs-scroll { -ms-overflow-style: none; scrollbar-width: none; }
`;

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
};

const WaveBottom = memo(({ darkMode }) => (
  <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-10 md:h-20" preserveAspectRatio="none">
      <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z"
        fill={darkMode ? "#111827" : "#f9fafb"} />
    </svg>
  </div>
));

const WaveTop = memo(({ darkMode }) => (
  <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-8 md:h-16" preserveAspectRatio="none">
      <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,0 L0,0 Z"
        fill={darkMode ? "#111827" : "#f9fafb"} />
    </svg>
  </div>
));

const StatCard = memo(({ icon, value, label, accent, delay, darkMode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.45, delay }}
    viewport={{ once: true }}
    whileHover={{ y: -4, scale: 1.02 }}
    className={`relative group overflow-hidden rounded-xl p-3 sm:p-4 shadow-lg border transition-all duration-300 ${darkMode ? "bg-gray-800/80 border-gray-700/60" : "bg-white/90 border-gray-100"
      }`}
  >
    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
      style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
    <div className="flex items-center gap-2 mb-1">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>
        {icon}
      </div>
      <span className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: accent }}>{value}</span>
    </div>
    <p className={`text-[10px] sm:text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
  </motion.div>
));

const LoadingSpinner = memo(() => (
  <div className="flex justify-center items-center py-16">
    <div className="w-10 h-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
  </div>
));

const StatusBadge = memo(({ status }) => {
  const map = {
    DELIVERED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700",
    QUOTE_APPROVED: "bg-emerald-100 text-emerald-700",
    QUOTE_SENT: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${map[status] || "bg-amber-100 text-amber-700"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
});

const Pagination = memo(({ page, total, setPage, darkMode }) => (
  <div className="flex justify-center mt-8 gap-1.5 flex-wrap">
    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
      className={`p-2 rounded-xl border transition-all ${page === 1 ? "opacity-40 cursor-not-allowed" : darkMode ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
      <FiChevronLeft size={14} />
    </button>
    {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
      <button key={p} onClick={() => setPage(p)}
        className={`w-9 h-9 rounded-xl font-bold text-sm transition-all border ${page === p
            ? "bg-gradient-to-r from-lime-500 to-emerald-500 text-white border-transparent shadow-lg"
            : darkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-200 text-gray-700 hover:bg-lime-50"
          }`}>{p}</button>
    ))}
    <button onClick={() => setPage((p) => Math.min(total, p + 1))} disabled={page === total}
      className={`p-2 rounded-xl border transition-all ${page === total ? "opacity-40 cursor-not-allowed" : darkMode ? "bg-gray-800 border-gray-700 text-white hover:bg-gray-700" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
      <FiChevronRight size={14} />
    </button>
  </div>
));

const ConfirmRepairModal = memo(({ open, onClose, req, token, onSuccess, darkMode }) => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("HOME_DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    api.get("/api/users/addresses", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const list = res.data.content || res.data || [];
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelectedAddrId(def.id);
      })
      .catch(() => { });
  }, [open, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAddrId) return;
    setSubmitting(true);
    try {
      const res = await api.post(
        `/api/users/repair-request/repairs/${req.id}/confirm`,
        { deliveryAddress: selectedAddrId, deliveryMethod, paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onClose();
      if (paymentMethod === "CREDIT_CARD" && res.data.paymentURL) {
        Swal.fire({ title: "Redirecting to Payment", icon: "info", timer: 2000, showConfirmButton: false })
          .then(() => { window.location.href = res.data.paymentURL; });
      } else {
        Swal.fire({ icon: "success", title: "Repair Confirmed!", toast: true, position: "top-end", timer: 2500, showConfirmButton: false });
        onSuccess();
      }
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to confirm repair", "error");
    } finally { setSubmitting(false); }
  };

  const selCls = `w-full px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"
    }`;
  const optBtn = (active) =>
    `flex-1 py-2.5 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all ${active ? "border-lime-500 bg-lime-500 text-white" : darkMode
      ? "border-gray-600 text-gray-300 hover:border-lime-500/60" : "border-gray-200 text-gray-600 hover:border-lime-400"
    }`;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
        <DialogPanel className={`relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden ${darkMode ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}>
          <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
          <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
          <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <DialogTitle className={`text-lg font-extrabold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
              <FiCheckCircle className="text-lime-500" /> Confirm Repair Order
            </DialogTitle>
            <button onClick={onClose} className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><FiX className="w-5 h-5" /></button>
          </div>
          {req && (
            <div className={`mx-5 mt-4 p-4 rounded-xl border ${darkMode ? "bg-gray-800/60 border-gray-700" : "bg-lime-50 border-lime-100"}`}>
              <p className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{req.shopName}</p>
              <p className="text-2xl font-black text-lime-600 mt-0.5">{req.price} <span className="text-sm font-medium">EGP</span></p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <FiLocation className="inline mr-1 text-lime-500" /> Delivery Address
              </label>
              {addresses.length === 0 ? (
                <p className="text-sm text-red-500 font-medium">No addresses found. Please add one in your profile.</p>
              ) : (
                <select value={selectedAddrId} onChange={(e) => setSelectedAddrId(e.target.value)} className={selCls} required>
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>{a.street}, {a.building} — {a.city}{a.isDefault ? " (Default)" : ""}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <FiTruck className="inline mr-1 text-lime-500" /> Delivery Method
              </label>
              <div className="flex gap-2">
                {[["HOME_DELIVERY", "Home Delivery"], ["SHOP_VISIT", "Visit Shop"], ["PICKUP", "Courier"]].map(([val, lbl]) => (
                  <button type="button" key={val} onClick={() => setDeliveryMethod(val)} className={optBtn(deliveryMethod === val)}>{lbl}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={`block text-sm font-bold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                <FiCreditCard className="inline mr-1 text-lime-500" /> Payment Method
              </label>
              <div className="flex gap-3">
                {[["CASH", "Cash"], ["CREDIT_CARD", "Credit Card"]].map(([val, lbl]) => (
                  <button type="button" key={val} onClick={() => setPaymentMethod(val)} className={optBtn(paymentMethod === val)}>{lbl}</button>
                ))}
              </div>
              {paymentMethod === "CREDIT_CARD" && (
                <p className={`text-xs mt-2 px-3 py-2 rounded-lg ${darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                  You'll be redirected to a secure payment gateway.
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-1 pb-1">
              <button type="button" onClick={onClose}
                className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                Cancel
              </button>
              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={submitting || addresses.length === 0}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</> : <><FiCheckCircle size={14} /> Confirm</>}
              </motion.button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
});

const ProfileTab = memo(({ isEditingProfile, setIsEditingProfile, userProfile, profileForm, setProfileForm, handleUpdateProfile, handleDeleteAccount, handleLogout, darkMode, isAuthenticated, inputCls }) => {
  if (isEditingProfile) return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit"
      className={`rounded-2xl shadow-xl border overflow-hidden ${darkMode ? "bg-gray-800/80 border-gray-700/60" : "bg-white border-gray-100"}`}>
      <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
      <div className="p-5 sm:p-7">
        <h3 className={`text-xl font-extrabold flex items-center gap-3 mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
          <FiEdit2 className="text-lime-500" /> Edit Profile
        </h3>
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full border-4 border-lime-500/40 shadow-lg flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <FiUser className="text-3xl text-lime-500" />
          </div>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>First Name</label>
              <input type="text" placeholder="First name" value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Last Name</label>
              <input type="text" placeholder="Last name" value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} className={inputCls} required />
            </div>
          </div>
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Phone Number</label>
            <input type="tel" placeholder="Phone number" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className={inputCls} required />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <motion.button whileTap={{ scale: 0.97 }} type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 text-sm">
              <FiCheck size={14} /> Save Changes
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => setIsEditingProfile(false)}
              className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              Cancel
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit"
      className={`rounded-2xl shadow-xl border overflow-hidden ${darkMode ? "bg-gray-800/80 border-gray-700/60" : "bg-white border-gray-100"}`}>
      <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
          <h3 className={`text-xl font-extrabold flex items-center gap-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <FiUser className="text-lime-500" /> My Profile
          </h3>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setIsEditingProfile(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-3xl border-2 border-lime-500 font-bold text-sm text-lime-600 dark:text-lime-400 hover:bg-lime-500 hover:text-white transition-all">
              <FiEdit2 size={13} /> Edit
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={handleDeleteAccount}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-red-400 text-red-500 font-bold text-sm hover:bg-red-500 hover:text-white transition-all">
              <FiTrash2 size={13} />
            </motion.button>
          </div>
        </div>
        <div className="flex justify-center mb-6">
          <div className={`w-24 h-24 rounded-full border-4 border-lime-500/40 shadow-xl flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
            <FiUser className="text-4xl text-lime-500" />
          </div>
        </div>
        <div className="space-y-2.5">
          {[
            { icon: <FiUser className="text-lime-500" />, value: `${userProfile?.first_name || ""} ${userProfile?.last_name || ""}` },
            { icon: <FiMail className="text-lime-500" />, value: userProfile?.email },
            { icon: <FiPhone className="text-lime-500" />, value: userProfile?.phone || "— Not provided" },
          ].map((row, i) => (
            <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
              {row.icon}
              <span className={`font-medium text-sm truncate ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{row.value}</span>
            </div>
          ))}
          <div className={`flex items-center flex-wrap justify-between gap-2 p-3.5 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
            <div className="flex items-center gap-3"><FiShield className="text-lime-500" /><span className={`font-medium text-sm ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Account Status</span></div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${userProfile?.activate ? "bg-lime-500/10 text-lime-600 border border-lime-500/30" : "bg-red-100 text-red-700"}`}>
              {userProfile?.activate ? "● Active" : "● Inactive"}
            </span>
          </div>
          {isAuthenticated && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout}
              className="w-full mt-1 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg transition-all text-sm">
              <RiLogoutBoxRLine size={16} /> Logout
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

const AddressesTab = memo(({ isAddingAddress, setIsAddingAddress, editingAddressId, setEditingAddressId, addressForm, setAddressForm, handleUpdateAddress, handleAddAddress, resetAddressForm, addresses, startEditAddress, handleDeleteAddress, isAddressInUse, darkMode, inputCls }) => {
  if (isAddingAddress || editingAddressId) return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit"
      className={`rounded-2xl shadow-xl border overflow-hidden ${darkMode ? "bg-gray-800/80 border-gray-700/60" : "bg-white border-gray-100"}`}>
      <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
      <div className="p-5 sm:p-7">
        <h3 className={`text-xl font-extrabold flex items-center gap-3 mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
          <FiMapPin className="text-lime-500" /> {editingAddressId ? "Edit" : "Add New"} Address
        </h3>
        <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[{ label: "State / Governorate", key: "state", ph: "e.g., Cairo" }, { label: "City", key: "city", ph: "e.g., Giza" }, { label: "Street", key: "street", ph: "e.g., Tahrir Street" }, { label: "Building / Apartment", key: "building", ph: "e.g., Bldg 12" }].map(({ label, key, ph }) => (
              <div key={key}>
                <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{label}</label>
                <input type="text" placeholder={ph} value={addressForm[key]} onChange={(e) => setAddressForm({ ...addressForm, [key]: e.target.value })} className={inputCls} required />
              </div>
            ))}
          </div>
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Additional Notes (optional)</label>
            <textarea placeholder="e.g., 3rd floor, near the pharmacy" value={addressForm.notes} onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })} className={`${inputCls} resize-none`} rows={3} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="w-4 h-4 rounded accent-lime-500" />
            <span className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Set as default address</span>
          </label>
          <div className="flex gap-3 pt-1">
            <motion.button whileTap={{ scale: 0.97 }} type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 text-sm">
              <FiCheck size={13} /> {editingAddressId ? "Update" : "Save"}
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={resetAddressForm}
              className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              Cancel
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h3 className={`text-xl font-extrabold flex items-center gap-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
          <FiMapPin className="text-lime-500" /> My Addresses
        </h3>
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => setIsAddingAddress(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-3xl border-2 border-lime-500 text-lime-600 dark:text-lime-400 font-bold text-sm hover:bg-lime-500 hover:text-white transition-all">
          <FiPlus size={13} /> Add Address
        </motion.button>
      </div>
      {addresses.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}>
          <FiMapPin className="mx-auto text-5xl text-gray-300 mb-3" />
          <p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>No saved addresses yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const inUse = isAddressInUse(addr.id);
            return (
              <motion.div key={addr.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }}
                className={`relative rounded-2xl shadow-md hover:shadow-xl border-2 transition-all duration-300 overflow-hidden ${addr.isDefault ? (darkMode ? "border-lime-500 bg-gray-800/80" : "border-lime-500 bg-white") : (darkMode ? "border-gray-700 bg-gray-800/80" : "border-gray-200 bg-white")
                  }`}>
                <div className={`h-1 ${addr.isDefault ? "bg-gradient-to-r from-lime-500 to-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                {addr.isDefault && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 bg-lime-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                    <RiVerifiedBadgeLine size={10} /> Default
                  </span>
                )}
                <div className="p-4 sm:p-5">
                  <h4 className={`text-base font-bold mb-0.5 pr-16 ${darkMode ? "text-white" : "text-gray-900"}`}>{addr.street}, {addr.building}</h4>
                  <p className={`text-sm mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{addr.city}, {addr.state}</p>
                  {addr.notes && <p className={`text-xs italic px-3 py-2 rounded-xl mb-3 ${darkMode ? "bg-gray-700/50 text-gray-400" : "bg-gray-50 text-gray-500"}`}>"{addr.notes}"</p>}
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => !inUse && startEditAddress(addr)} disabled={inUse}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-bold text-xs transition-all ${inUse ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400" : "border-lime-500 text-lime-600 dark:text-lime-400 hover:bg-lime-500 hover:text-white"
                        }`}>
                      <FiEdit2 size={11} /> {inUse ? "In Use" : "Edit"}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => !inUse && handleDeleteAddress(addr.id)} disabled={inUse}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 font-bold text-xs transition-all ${inUse ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400" : "border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
                        }`}>
                      <FiTrash2 size={11} />
                    </motion.button>
                  </div>
                  {inUse && <p className="text-[10px] mt-2 text-amber-500 font-semibold flex items-center gap-1"><FiInfo size={10} /> Used in active order/repair</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
});

const OrdersTab = memo(({ orders, ordersPage, setOrdersPage, setSelectedOrder, setIsOrderModalOpen, handleCancelOrder, darkMode }) => {
  const ipp = 3;
  const total = Math.ceil(orders.length / ipp);
  const pageOrders = orders.slice((ordersPage - 1) * ipp, ordersPage * ipp);
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit">
      <h3 className={`text-xl font-extrabold flex items-center gap-3 mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
        <FiBox className="text-lime-500" /> My Orders
      </h3>
      {orders.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}>
          <FiBox className="mx-auto text-5xl text-gray-300 mb-3" />
          <p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>No orders placed yet</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pageOrders.map((order) => {
              const isDelivered = order.status === "DELIVERED";
              const isCancelled = order.status === "CANCELLED";
              return (
                <motion.div key={order.id} whileHover={{ y: -3 }}
                  className={`rounded-2xl shadow-md hover:shadow-xl border transition-all overflow-hidden flex flex-col ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="h-1 bg-gradient-to-r from-lime-400 to-teal-500" />
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div>
                        <p className="font-mono text-[10px] text-lime-600 dark:text-lime-400 tracking-[2px] uppercase">ORD #{order.id.slice(0, 6)}</p>
                        <p className={`text-base font-bold mt-0.5 ${darkMode ? "text-white" : "text-gray-900"}`}>Order</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="mb-3 space-y-1.5">
                      <div className={`flex items-center gap-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <FiCalendar className="text-lime-500 flex-shrink-0" size={11} />
                        {new Date(order.createdAt).toLocaleDateString("en-EG", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="flex items-center gap-2 text-lime-600 dark:text-lime-400 text-xs">
                        <FiCreditCard size={11} className="flex-shrink-0" />
                        <span className="font-medium uppercase tracking-wide">{order.paymentMethod?.replace("_", " ")}</span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <span className="text-2xl sm:text-3xl font-black text-lime-600 dark:text-lime-400">{order.totalPrice}</span>
                      <span className={`text-xs ml-1 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>EGP</span>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setSelectedOrder(order); setIsOrderModalOpen(true); }}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1">
                        <FiInfo size={11} /> Details
                      </motion.button>
                      {!isDelivered && !isCancelled && (
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleCancelOrder(order.id)}
                          className="flex-1 bg-red-50 hover:bg-red-100 dark:bg-gray-700 text-red-600 dark:text-red-400 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1">
                          <FiXCircle size={11} /> Cancel
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {total > 1 && <Pagination page={ordersPage} total={total} setPage={setOrdersPage} darkMode={darkMode} />}
        </>
      )}
    </motion.div>
  );
});

const RepairsTab = memo(({ repairRequests, repairsPage, setRepairsPage, handleViewRepair, handleEditRepair, handleAcceptQuote, handleCancelRepair, darkMode }) => {
  const ipp = 3;
  const totalPages = Math.ceil(repairRequests.length / ipp);
  const pageRepairs = repairRequests.slice((repairsPage - 1) * ipp, repairsPage * ipp);
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit">
      <h3 className={`text-xl font-extrabold flex items-center gap-3 mb-6 ${darkMode ? "text-white" : "text-gray-900"}`}>
        <FiTool className="text-lime-500" /> Repair Requests
      </h3>
      {repairRequests.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}>
          <FiTool className="mx-auto text-5xl text-gray-300 mb-3" />
          <p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>No repair requests yet</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pageRepairs.map((req) => {
              const isQuoteSent = req.status === "QUOTE_SENT";
              const isQuoteApproved = req.status === "QUOTE_APPROVED";
              const hasPrice = req.price;
              return (
                <motion.div key={req.id} whileHover={{ y: -3 }}
                  className={`rounded-2xl shadow-md hover:shadow-xl border transition-all overflow-hidden flex flex-col ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="h-1 bg-gradient-to-r from-lime-400 to-teal-500" />
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] text-lime-600 dark:text-lime-400 tracking-[2px] uppercase">REQ #{req.id.slice(0, 6)}</p>
                        <p className={`text-base font-bold mt-0.5 truncate ${darkMode ? "text-white" : "text-gray-900"}`}>{req.shopName}</p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className={`text-xs sm:text-sm line-clamp-3 mb-3 flex-1 leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{req.description}</p>
                    {hasPrice && (
                      <div className="mb-3 flex items-end gap-1">
                        <span className="text-2xl font-black text-lime-600 dark:text-lime-400">{req.price}</span>
                        <span className={`text-xs mb-0.5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>EGP</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleViewRepair(req.id)}
                        className="bg-blue-50 hover:bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1">
                        <FiInfo size={10} /> View
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleEditRepair(req)}
                        className="bg-amber-50 hover:bg-amber-100 dark:bg-gray-700 text-amber-600 dark:text-amber-400 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1">
                        <FiEdit size={10} /> Edit
                      </motion.button>
                      {isQuoteSent && hasPrice && (
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleAcceptQuote(req)}
                          className="col-span-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm">
                          <FiCheckCircle size={10} /> Accept Quote
                        </motion.button>
                      )}
                      {(isQuoteApproved || isQuoteSent) && (
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleCancelRepair(req.id)}
                          className="col-span-2 bg-red-50 hover:bg-red-100 dark:bg-gray-700 text-red-600 dark:text-red-400 font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5">
                          <FiXCircle size={10} /> Cancel Request
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {totalPages > 1 && <Pagination page={repairsPage} total={totalPages} setPage={setRepairsPage} darkMode={darkMode} />}
        </>
      )}
    </motion.div>
  );
});

const AccountContent = ({ darkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [activeSection, setActiveSection] = useState("profile");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [addressForm, setAddressForm] = useState({ state: "", city: "", street: "", building: "", notes: "", isDefault: false });

  const [ordersPage, setOrdersPage] = useState(1);
  const [repairsPage, setRepairsPage] = useState(1);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [isEditRepairModalOpen, setIsEditRepairModalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isConfirmRepairOpen, setIsConfirmRepairOpen] = useState(false);
  const [confirmRepairReq, setConfirmRepairReq] = useState(null);

  const safe = (val) => (val == null || val === "" ? "—" : String(val).trim());
  const formatDate = (d) => new Date(d).toLocaleString("en-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Africa/Cairo" });

  const inputCls = `w-full px-4 py-3 sm:py-3.5 rounded-xl border text-sm transition-all outline-none ${darkMode
      ? "bg-gray-800/70 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
      : "bg-white/70 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
    }`;

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get("/api/users/profile", { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data;
      setProfileForm({ first_name: data.first_name || "", last_name: data.last_name || "", phone: data.phone || "" });
      return data;
    },
    enabled: !!token
  });

  const { data: addresses = [], isLoading: addressesLoading } = useQuery({ queryKey: ['addresses'], queryFn: async () => (await api.get("/api/users/addresses", { headers: { Authorization: `Bearer ${token}` } })).data.content || [], enabled: !!token });
  const { data: orders = [], isLoading: ordersLoading } = useQuery({ queryKey: ['orders'], queryFn: async () => (await api.get("/api/users/orders", { headers: { Authorization: `Bearer ${token}` } })).data.content || [], enabled: !!token });
  const { data: repairRequests = [], isLoading: repairsLoading } = useQuery({ queryKey: ['repairs'], queryFn: async () => (await api.get("/api/users/repair-request", { headers: { Authorization: `Bearer ${token}` } })).data.content || [], enabled: !!token });
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get("/api/categories", { headers: { Authorization: `Bearer ${token}` } })).data.content || [], enabled: !!token });

  const isLoading = profileLoading || addressesLoading || ordersLoading || repairsLoading || categoriesLoading;

  useEffect(() => { document.title = "My Account | Tech-Restore"; }, []);

  const safeDecodeJwt = useCallback((tk) => { try { return jwtDecode(tk); } catch { return null; } }, []);
  const isTokenExpired = useCallback((tk) => { const d = safeDecodeJwt(tk); return !d || !d.exp || d.exp < Date.now() / 1000; }, [safeDecodeJwt]);

  useEffect(() => {
    const tk = localStorage.getItem("authToken");
    if (!tk || isTokenExpired(tk)) { localStorage.removeItem("authToken"); setIsAuthenticated(false); navigate("/login"); }
    else { setToken(tk); setIsAuthenticated(true); }
  }, [location.pathname, navigate, isTokenExpired]);

  const resetAddressForm = useCallback(() => { setEditingAddressId(null); setIsAddingAddress(false); setAddressForm({ state: "", city: "", street: "", building: "", notes: "", isDefault: false }); }, []);
  const startEditAddress = useCallback((addr) => { setEditingAddressId(addr.id); setAddressForm({ state: addr.state, city: addr.city, street: addr.street, building: addr.building, notes: addr.notes || "", isDefault: addr.isDefault }); }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put("/api/users/profile", profileForm, { headers: { Authorization: `Bearer ${token}` } });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditingProfile(false);
      Swal.fire({ title: "Updated!", icon: "success", toast: true, position: "top-end", timer: 1500 });
    } catch { Swal.fire({ title: "Error", text: "Update failed", icon: "error", toast: true, position: "top-end", timer: 1500 }); }
  };

  const handleDeleteAccount = async () => {
    const c = await Swal.fire({ title: "Delete Account?", text: "This cannot be undone.", icon: "warning", showCancelButton: true });
    if (!c.isConfirmed) return;
    try { await api.delete("/api/users/profile", { headers: { Authorization: `Bearer ${token}` } }); localStorage.removeItem("authToken"); navigate("/"); }
    catch { Swal.fire({ title: "Error", text: "Failed to delete", icon: "error", toast: true, position: "top-end", timer: 1500 }); }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try { await api.post("/api/users/addresses", addressForm, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['addresses'] }); resetAddressForm(); Swal.fire({ title: "Added!", icon: "success", toast: true, position: "top-end", timer: 1500 }); }
    catch { Swal.fire({ title: "Error", text: "Failed to add", icon: "error", toast: true, position: "top-end", timer: 1500 }); }
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try { await api.put(`/api/users/addresses/${editingAddressId}`, addressForm, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['addresses'] }); resetAddressForm(); Swal.fire({ title: "Updated!", icon: "success", toast: true, position: "top-end", timer: 1500 }); }
    catch { Swal.fire({ title: "Error", text: "Failed to update", icon: "error", toast: true, position: "top-end", timer: 1500 }); }
  };

  const handleDeleteAddress = useCallback(async (id) => {
    const c = await Swal.fire({ title: "Delete Address?", icon: "warning", showCancelButton: true });
    if (!c.isConfirmed) return;
    try { await api.delete(`/api/users/addresses/${id}`, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['addresses'] }); Swal.fire({ title: "Deleted!", icon: "success", toast: true, position: "top-end", timer: 1500 }); }
    catch { Swal.fire({ title: "Error", text: "Failed to delete", icon: "error", toast: true, position: "top-end", timer: 1500 }); }
  }, [token, queryClient]);

  const handleCancelOrder = useCallback(async (id) => {
    const c = await Swal.fire({ title: "Cancel Order?", icon: "warning", showCancelButton: true });
    if (!c.isConfirmed) return;
    try { await api.delete(`/api/users/orders/${id}/cancel`, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['orders'] }); Swal.fire({ title: "Cancelled!", icon: "success", toast: true, position: "top-end", timer: 1500 }); }
    catch { Swal.fire({ title: "Error", text: "Failed to cancel", icon: "error", toast: true, position: "top-end", timer: 1500 }); }
  }, [token, queryClient]);

  const handleViewRepair = useCallback(async (id) => {
    try { const res = await api.get(`/api/users/repair-request/${id}`, { headers: { Authorization: `Bearer ${token}` } }); setSelectedRepair(res.data); setIsRepairModalOpen(true); }
    catch { Swal.fire({ title: "Error", text: "Failed to load", icon: "error" }); }
  }, [token]);

  const handleEditRepair = useCallback((req) => { setEditingRepair(req); setEditDescription(req.description || ""); setSelectedCategory(req.deviceCategory || ""); setIsEditRepairModalOpen(true); }, []);

  const handleUpdateRepairDescription = async (e) => {
    e.preventDefault();
    if (!editingRepair) return;
    try {
      await api.put(`/api/users/repair-request/${editingRepair.shopId}/${editingRepair.id}`,
        { description: editDescription, deviceCategory: selectedCategory.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      setIsEditRepairModalOpen(false); setEditingRepair(null);
      Swal.fire({ icon: "success", title: "Updated!", toast: true, position: "top-end", timer: 2500, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Failed", toast: true, position: "top-end", timer: 2500, showConfirmButton: false }); }
  };

  const handleAcceptQuote = useCallback(async (req) => {
    const result = await Swal.fire({ title: "Accept Quote?", text: `Accept ${req.price} EGP from ${req.shopName}?`, icon: "question", showCancelButton: true, confirmButtonText: "Yes, Accept", confirmButtonColor: "#84cc16" });
    if (!result.isConfirmed) return;
    try {
      await api.put(`/api/users/repair-request/${req.id}/status`, { status: "QUOTE_APPROVED" }, { headers: { Authorization: `Bearer ${token}` } });
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      Swal.fire({ icon: "success", title: "Quote Accepted!", toast: true, position: "top-end", timer: 2000, showConfirmButton: false });
      setConfirmRepairReq(req); setIsConfirmRepairOpen(true);
    } catch (err) { Swal.fire("Error", err.response?.data?.message || "Failed to accept quote", "error"); }
  }, [token, queryClient]);

  const handleCancelRepair = useCallback(async (id) => {
    const result = await Swal.fire({ title: "Cancel Request?", icon: "warning", showCancelButton: true, confirmButtonText: "Yes, Cancel", confirmButtonColor: "#ef4444" });
    if (!result.isConfirmed) return;
    try { await api.delete(`/api/users/repair-request/${id}/cancel`, { headers: { Authorization: `Bearer ${token}` } }); queryClient.invalidateQueries({ queryKey: ['repairs'] }); Swal.fire({ title: "Cancelled", icon: "success", toast: true, position: "top-end", timer: 2000 }); }
    catch { Swal.fire("Error", "Failed to cancel request", "error"); }
  }, [token, queryClient]);

  const handleLogout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try { if (token && refreshToken) await api.post("/api/auth/logout", { refreshToken }); } catch { }
    localStorage.clear(); setToken(null); setIsAuthenticated(false);
    Swal.fire({ icon: "success", text: "Logged out", position: "top-end", toast: true });
    navigate("/login", { replace: true });
  }, [token, navigate]);

  const isAddressInUse = useCallback((addressId) => {
    const activeOrder = orders.some(o => o.deliveryAddress === addressId && o.status !== "DELIVERED" && o.status !== "CANCELLED");
    const activeRepair = repairRequests.some(r => r.deliveryAddress === addressId && r.status !== "DELIVERED" && r.status !== "CANCELLED");
    return activeOrder || activeRepair;
  }, [orders, repairRequests]);

  const heroStats = useMemo(() => [
    { icon: <FiZap size={13} />, value: "75.2%", label: "Daily activity", accent: "#f97316", delay: 0.1 },
    { icon: <FiUsers size={13} />, value: "~20K", label: "Active users", accent: "#6366f1", delay: 0.2 },
    { icon: <RiStarFill size={13} />, value: "4.9★", label: "Avg rating", accent: "#f59e0b", delay: 0.3 },
  ], []);

  const tabs = useMemo(() => [
    { id: "profile", label: "Profile", icon: <FiUser size={14} />, badge: null },
    { id: "addresses", label: "Addresses", icon: <FiMapPin size={14} />, badge: addresses.length || null },
    { id: "orders", label: "Orders", icon: <FiBox size={14} />, badge: orders.length || null },
    { id: "repairs", label: "Repairs", icon: <FiTool size={14} />, badge: repairRequests.length || null },
  ], [addresses.length, orders.length, repairRequests.length]);

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>
      <style>{STYLES}</style>

      <section className={`relative overflow-hidden pt-14 pb-20 sm:pt-20 sm:pb-32 md:pt-24 md:pb-40 ${darkMode ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" : "bg-gradient-to-br from-lime-50 via-white to-emerald-50"}`}>
        <div className="absolute w-[350px] h-[350px] -top-28 -left-20 rounded-full blur-3xl opacity-20 bg-lime-400 animate-pulse pointer-events-none" style={{ animationDuration: "5s" }} />
        <div className="absolute w-[250px] h-[250px] top-8 -right-12 rounded-full blur-3xl opacity-15 bg-emerald-500 animate-pulse pointer-events-none" style={{ animationDuration: "7s" }} />
        <WaveTop darkMode={darkMode} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="space-y-5 sm:space-y-6">
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
                className="inline-flex items-center mt-6 gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-semibold bg-lime-500/10 border-lime-500/30 text-lime-600 dark:text-lime-400">
                <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" /> Your personal dashboard
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1]">
                <span className="bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">My Account</span>
                <br /><span className={darkMode ? "text-white" : "text-gray-900"}>Dashboard</span>
                <br /><span className="hidden sm:inline" style={{ WebkitTextStroke: darkMode ? "2px #84cc16" : "2px #16a34a", color: "transparent" }}>& Settings</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                className={`text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Manage your profile, addresses, orders, and repair requests — all in one place.
              </motion.p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 pt-1">
                {heroStats.map((s) => <StatCard key={s.label} {...s} darkMode={darkMode} />)}
              </div>
            </div>
            <div className="relative hidden sm:block h-64 md:h-80 lg:h-[480px]">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-125" />
              <div className="relative w-full h-full">
                <motion.div initial={{ opacity: 0, rotate: 8, y: 20 }} animate={{ opacity: 1, rotate: 12, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} whileHover={{ rotate: 4, scale: 1.04 }}
                  className={`absolute top-8 left-6 w-40 sm:w-44 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="h-1 bg-gradient-to-r from-lime-400 to-emerald-500" />
                  <div className="p-4 space-y-3">
                    <div className={`h-2.5 rounded w-20 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className={`h-2.5 rounded w-28 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className="h-7 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-xl w-14" />
                    <div className="flex gap-2"><div className={`w-7 h-7 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`} /><div className="w-7 h-7 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full" /></div>
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} whileHover={{ scale: 1.06, y: -4 }}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-36 sm:w-40 rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="h-1 bg-gradient-to-r from-lime-500 to-emerald-500" />
                  <div className="p-4">
                    <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"><FiUser className="text-lime-400 text-3xl" /></div>
                    <div className={`h-2.5 rounded w-full mb-2 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} /><div className={`h-2.5 rounded w-3/4 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className="mt-2 text-center"><span className="text-xs font-bold text-lime-500">Verified ✓</span></div>
                  </div>
                </motion.div>
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/4 right-3 z-20 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-2xl shadow-xl">
                  👤 My Space
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        <WaveBottom darkMode={darkMode} />
      </section>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <div className="flex gap-5 lg:gap-8">
          <aside className={`hidden lg:flex flex-col w-60 xl:w-68 flex-shrink-0 sticky top-20 self-start rounded-2xl border shadow-lg overflow-hidden ${darkMode ? "bg-gray-800/60 border-gray-700 backdrop-blur-md" : "bg-white border-gray-200"}`}>
            <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
            <div className={`px-4 pt-5 pb-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full border-2 border-lime-500/40 flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-lime-50"}`}>
                  <FiUser className="text-lime-500 text-lg" />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-extrabold truncate ${darkMode ? "text-white" : "text-gray-900"}`}>{userProfile?.first_name} {userProfile?.last_name}</p>
                  <p className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{userProfile?.email}</p>
                </div>
              </div>
            </div>
            <div className="px-3 py-4 flex flex-col gap-1 flex-1">
              {tabs.map((tab) => (
                <motion.button key={tab.id} whileTap={{ scale: 0.97 }} onClick={() => startTransition(() => setActiveSection(tab.id))}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${activeSection === tab.id
                      ? "bg-gradient-to-r from-lime-500 to-emerald-500 text-white shadow-lg shadow-lime-500/25"
                      : darkMode ? "text-gray-300 hover:bg-gray-700/60 hover:text-white" : "text-gray-600 hover:bg-lime-50 hover:text-lime-700"
                    }`}>
                  <span className={activeSection === tab.id ? "text-white" : "text-lime-500"}>{tab.icon}</span>
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.badge !== null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${activeSection === tab.id ? "bg-white/20 text-white" : "bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-400"}`}>{tab.badge}</span>
                  )}
                </motion.button>
              ))}
              <div className={`mt-4 p-3.5 rounded-xl border ${darkMode ? "bg-gray-700/30 border-gray-700" : "bg-lime-50 border-lime-100"}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Quick Stats</p>
                <div className="space-y-2">
                  {[{ label: "Orders", val: orders.length, icon: <FiBox size={10} /> }, { label: "Addresses", val: addresses.length, icon: <FiMapPin size={10} /> }, { label: "Repairs", val: repairRequests.length, icon: <FiTool size={10} /> }].map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}><span className="text-lime-500">{s.icon}</span>{s.label}</div>
                      <span className={`text-xs font-extrabold ${darkMode ? "text-lime-400" : "text-lime-600"}`}>{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              {isAuthenticated && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout}
                  className={`mt-3 w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${darkMode ? "text-red-400 hover:bg-red-900/30" : "text-red-500 hover:bg-red-50"}`}>
                  <RiLogoutBoxRLine className="text-lg" /> Logout
                </motion.button>
              )}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="lg:hidden mb-5 -mx-0.5">
              <div className="tabs-scroll flex gap-2 overflow-x-auto pb-1 px-0.5">
                {tabs.map((tab) => (
                  <motion.button key={tab.id} whileTap={{ scale: 0.96 }} onClick={() => startTransition(() => setActiveSection(tab.id))}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm whitespace-nowrap ${activeSection === tab.id
                        ? "bg-gradient-to-r from-lime-500 to-emerald-500 text-white shadow-lime-500/20"
                        : darkMode ? "bg-gray-800 border border-gray-700 text-gray-300 hover:text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-lime-50"
                      }`}>
                    {tab.icon}
                    {tab.label}
                    {tab.badge !== null && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${activeSection === tab.id ? "bg-white/25 text-white" : "bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-400"}`}>{tab.badge}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {isLoading ? <LoadingSpinner key="spinner" /> : (
                  <div key="content">
                    {activeSection === "profile" && (
                      <ProfileTab
                        isEditingProfile={isEditingProfile}
                        setIsEditingProfile={setIsEditingProfile}
                        userProfile={userProfile}
                        profileForm={profileForm}
                        setProfileForm={setProfileForm}
                        handleUpdateProfile={handleUpdateProfile}
                        handleDeleteAccount={handleDeleteAccount}
                        handleLogout={handleLogout}
                        darkMode={darkMode}
                        isAuthenticated={isAuthenticated}
                        inputCls={inputCls}
                      />
                    )}
                    {activeSection === "addresses" && (
                      <AddressesTab
                        isAddingAddress={isAddingAddress}
                        setIsAddingAddress={setIsAddingAddress}
                        editingAddressId={editingAddressId}
                        setEditingAddressId={setEditingAddressId}
                        addressForm={addressForm}
                        setAddressForm={setAddressForm}
                        handleUpdateAddress={handleUpdateAddress}
                        handleAddAddress={handleAddAddress}
                        resetAddressForm={resetAddressForm}
                        addresses={addresses}
                        startEditAddress={startEditAddress}
                        handleDeleteAddress={handleDeleteAddress}
                        isAddressInUse={isAddressInUse}
                        darkMode={darkMode}
                        inputCls={inputCls}
                      />
                    )}
                    {activeSection === "orders" && (
                      <OrdersTab
                        orders={orders}
                        ordersPage={ordersPage}
                        setOrdersPage={setOrdersPage}
                        setSelectedOrder={setSelectedOrder}
                        setIsOrderModalOpen={setIsOrderModalOpen}
                        handleCancelOrder={handleCancelOrder}
                        darkMode={darkMode}
                      />
                    )}
                    {activeSection === "repairs" && (
                      <RepairsTab
                        repairRequests={repairRequests}
                        repairsPage={repairsPage}
                        setRepairsPage={setRepairsPage}
                        handleViewRepair={handleViewRepair}
                        handleEditRepair={handleEditRepair}
                        handleAcceptQuote={handleAcceptQuote}
                        handleCancelRepair={handleCancelRepair}
                        darkMode={darkMode}
                      />
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <DialogPanel className={`relative transform overflow-hidden rounded-t-2xl sm:rounded-2xl text-left shadow-2xl w-full sm:max-w-4xl border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
              {selectedOrder && (
                <div className="lime-scroll max-h-[90dvh] overflow-y-auto">
                  <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
                  <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
                  <div className={`sticky top-0 px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between z-10 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
                    <DialogTitle className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                      <FiBox className="text-lime-500" />
                      <span className="font-mono text-xs px-2 py-1 bg-lime-500 text-white rounded-lg">#{safe(selectedOrder.id).slice(0, 8).toUpperCase()}</span>
                    </DialogTitle>
                    <button onClick={() => setIsOrderModalOpen(false)} className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}><FiX className="w-5 h-5 text-gray-400" /></button>
                  </div>
                  <div className="p-4 sm:p-7 space-y-6 text-sm">
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl ${darkMode ? "bg-gray-800/50" : "bg-gray-50"}`}>
                      <div className="space-y-3">
                        <div><span className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Order Date</span><p className={`font-medium mt-0.5 ${darkMode ? "text-white" : "text-gray-900"}`}>{formatDate(selectedOrder.createdAt)}</p></div>
                        <div><span className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Status</span><div className="mt-1"><StatusBadge status={selectedOrder.status} /></div></div>
                        <div><span className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total</span><p className="text-2xl sm:text-3xl font-bold text-lime-600 dark:text-lime-400 mt-0.5">{safe(selectedOrder.totalPrice)} EGP</p></div>
                      </div>
                      <div>
                        <p className={`font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Payment Method</p>
                        <div className={`flex items-center gap-3 p-3 rounded-2xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedOrder.paymentMethod === "CREDIT_CARD" ? "bg-blue-100 dark:bg-blue-900" : "bg-orange-100"}`}>
                            {selectedOrder.paymentMethod === "CREDIT_CARD" ? <FiCreditCard className="w-4 h-4 text-blue-600" /> : <FiDollarSign className="w-4 h-4 text-orange-600" />}
                          </div>
                          <p className={`font-semibold capitalize text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{safe(selectedOrder.paymentMethod).toLowerCase().replace("_", " ")}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg mb-3 flex items-center gap-2 ${darkMode ? "text-gray-100" : "text-gray-800"}`}><FiBox className="text-lime-500" /> Order Items</h3>
                      <div className={`border rounded-2xl overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                        {selectedOrder.orderItems?.length > 0 ? selectedOrder.orderItems.map((item, index) => (
                          <div key={index} className={`flex items-center justify-between p-4 border-b last:border-b-0 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                            <div className="flex-1 min-w-0 pr-3">
                              <div className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{safe(item.productName)}<span className="text-gray-400 ml-1.5">× {safe(item.quantity)}</span></div>
                              {item.shopName && <div className="text-xs text-gray-500 mt-0.5">From: {safe(item.shopName)}</div>}
                            </div>
                            <div className="font-bold text-lime-600 dark:text-lime-400 text-sm flex-shrink-0">{(Number(item.priceAtCheckout) * Number(item.quantity)).toFixed(2)} EGP</div>
                          </div>
                        )) : <div className="p-10 text-center text-gray-400 text-sm">No items</div>}
                        <div className={`p-4 flex justify-between items-center border-t ${darkMode ? "bg-gray-700/50 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                          <span className="uppercase text-xs tracking-widest text-gray-500 font-medium">Grand Total</span>
                          <span className="text-2xl font-bold text-lime-600 dark:text-lime-400">{safe(selectedOrder.totalPrice)} EGP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`p-4 sm:p-6 border-t flex justify-end ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setIsOrderModalOpen(false)}
                      className={`px-6 py-2.5 rounded-xl font-bold transition text-sm ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                      Close
                    </motion.button>
                  </div>
                </div>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <Dialog open={isRepairModalOpen} onClose={() => setIsRepairModalOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <DialogPanel className={`relative transform overflow-hidden rounded-t-2xl sm:rounded-2xl text-left shadow-2xl w-full sm:max-w-lg border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
              {selectedRepair && (
                <div className="lime-scroll max-h-[85dvh] overflow-y-auto">
                  <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
                  <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
                  <div className={`px-5 sm:px-7 pt-5 pb-4 border-b flex items-center justify-between ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <DialogTitle className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}><FiTool className="text-lime-500" /> Repair #{safe(selectedRepair.id).slice(0, 8)}</DialogTitle>
                    <button onClick={() => setIsRepairModalOpen(false)} className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><FiXCircle className="w-5 h-5" /></button>
                  </div>
                  <div className="px-5 sm:px-7 py-5 space-y-4">
                    <div className={`rounded-2xl p-4 space-y-3.5 ${darkMode ? "bg-gray-800/60" : "bg-lime-50"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-gray-700" : "bg-lime-100"}`}><FiHome className="text-lime-500" /></div>
                        <div><p className="text-xs uppercase tracking-widest text-lime-600 font-medium">Shop</p><p className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{selectedRepair.shopName}</p></div>
                      </div>
                      <div><p className="text-xs uppercase tracking-widest text-lime-600 font-medium mb-1">Issue Description</p><p className={`leading-relaxed text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{selectedRepair.description}</p></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><p className="text-xs uppercase tracking-widest text-lime-600 font-medium mb-0.5">Status</p><p className="font-bold capitalize text-emerald-600 text-sm">{selectedRepair.status?.replace("_", " ")}</p></div>
                        {selectedRepair.price && <div><p className="text-xs uppercase tracking-widest text-lime-600 font-medium mb-0.5">Quote</p><p className="text-xl font-bold text-lime-600 dark:text-lime-400">{selectedRepair.price} EGP</p></div>}
                      </div>
                    </div>
                    <div className={`flex justify-between items-center p-3.5 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                      <div><p className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Payment Method</p><p className={`font-bold text-sm ${darkMode ? "text-orange-400" : "text-gray-800"}`}>{selectedRepair.paymentMethod || "Not set"}</p></div>
                      {selectedRepair.price && <div className="text-right"><p className={`text-xs uppercase tracking-widest font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total</p><p className="text-lg font-bold text-lime-600 dark:text-lime-400">{selectedRepair.price} EGP</p></div>}
                    </div>
                  </div>
                  <div className={`border-t px-5 sm:px-7 py-4 flex justify-end ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setIsRepairModalOpen(false)}
                      className="px-6 py-2.5 bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold rounded-xl shadow-md transition-all text-sm">
                      Close
                    </motion.button>
                  </div>
                </div>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <Dialog open={isEditRepairModalOpen} onClose={() => setIsEditRepairModalOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
            <DialogPanel className={`relative transform overflow-hidden rounded-t-2xl sm:rounded-2xl text-left shadow-2xl w-full sm:max-w-md border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
              {editingRepair && (
                <div>
                  <div className="h-1 bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500" />
                  <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
                  <div className={`flex items-center justify-between px-5 sm:px-7 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                    <DialogTitle className={`text-lg font-extrabold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}><FiEdit className="text-lime-500" /> Edit Repair</DialogTitle>
                    <button onClick={() => { setIsEditRepairModalOpen(false); setEditingRepair(null); }}
                      className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><FiX className="w-5 h-5" /></button>
                  </div>
                  <form onSubmit={handleUpdateRepairDescription} className="p-5 sm:p-7 space-y-5">
                    <div>
                      <label className={`block text-xs font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Device Category</label>
                      <div className="relative">
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={`${inputCls} appearance-none`}>
                          <option value="">Select category</option>
                          {categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"><FiChevronRight className="rotate-90" size={13} /></div>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Description</label>
                      <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={5} placeholder="Describe the issue…" className={`${inputCls} resize-y min-h-[100px]`} required />
                    </div>
                    <div className="flex gap-3">
                      <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => { setIsEditRepairModalOpen(false); setEditingRepair(null); }}
                        className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                        Cancel
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.97 }} type="submit"
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 text-sm">
                        <FiCheck size={13} /> Save
                      </motion.button>
                    </div>
                  </form>
                </div>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <ConfirmRepairModal
        open={isConfirmRepairOpen}
        onClose={() => setIsConfirmRepairOpen(false)}
        req={confirmRepairReq}
        token={token}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['repairs'] })}
        darkMode={darkMode}
      />
    </div>
  );
};

AccountContent.displayName = 'AccountContent';
export default function Account(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AccountContent {...props} />
    </QueryClientProvider>
  );
}
