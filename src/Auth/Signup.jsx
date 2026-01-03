import React, { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { debounce } from "lodash";
import api from "../api";
import {
  RiUserLine, RiLockPasswordLine, RiMailLine, RiPhoneLine,
  RiHome4Line, RiMapPinLine, RiStore2Line,
  RiFileListLine, RiTruckLine, RiUserSettingsLine
} from "react-icons/ri";

const Signup = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("user");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    user: {}, shop: {}, delivery: {}, assigner: {}
  });

  const [userData, setUserData] = useState({
    first_name: "", last_name: "", email: "", phone: "", password: ""
  });

  const [shopData, setShopData] = useState({
    name: "", email: "", password: "", description: "", phone: "",
    shopAddress: { state: "", city: "", street: "", building: "", isDefault: true },
    shopType: ""
  });

  const [deliveryData, setDeliveryData] = useState({
    name: "", email: "", phone: "", password: "", address: ""
  });

  const [assignerData, setAssignerData] = useState({
    name: "", email: "", phone: "", password: "", department: ""
  });

  useEffect(() => {
    document.title = "Sign Up | FixShop Pro";
  }, []);

  const validateEmail = useCallback((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), []);
  const validatePhone = useCallback((phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return /^\d{10,15}$/.test(cleaned);
  }, []);
  const validatePassword = useCallback((password) => password.length >= 6, []);

  const handleUserChange = useCallback(debounce((e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, user: { ...prev.user, [name]: "" } }));
  }, 300), []);

  const handleShopChange = useCallback(debounce((e) => {
    const { name, value } = e.target;
    if (["state", "city", "street", "building"].includes(name)) {
      setShopData(prev => ({
        ...prev,
        shopAddress: { ...prev.shopAddress, [name]: value }
      }));
      setErrors(prev => ({ ...prev, shop: { ...prev.shop, [name]: "" } }));
    } else {
      setShopData(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, shop: { ...prev.shop, [name]: "" } }));
    }
  }, 300), []);

  const handleDeliveryChange = useCallback(debounce((e) => {
    const { name, value } = e.target;
    setDeliveryData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, delivery: { ...prev.delivery, [name]: "" } }));
  }, 300), []);

  const handleAssignerChange = useCallback(debounce((e) => {
    const { name, value } = e.target;
    setAssignerData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, assigner: { ...prev.assigner, [name]: "" } }));
  }, 300), []);

  const verifyEmail = useCallback(async (email) => {
    const { value: form } = await Swal.fire({
      title: "Verify Your Email",
      html: `
        <input id="swal-email" class="swal2-input" value="${email}" readonly>
        <input id="otp-code" type="text" inputmode="numeric" maxlength="6"
          class="swal2-input" style="text-align:center;font-size:20px;letter-spacing:8px;" 
          placeholder="••••••">
        <button id="resend-otp-btn" type="button" class="swal2-confirm swal2-styled mt-4" style="background:#10b981;">Resend OTP</button>
      `,
      didOpen: () => {
        const otpInput = Swal.getPopup().querySelector("#otp-code");
        setTimeout(() => otpInput.focus(), 100);
        otpInput.addEventListener("input", (e) => {
          e.target.value = e.target.value.replace(/\D/g, "");
        });
        Swal.getPopup().querySelector("#resend-otp-btn").addEventListener("click", async () => {
          try {
            await api.post("/api/auth/resend-otp", { email });
            Swal.fire("OTP Resent", "", "success");
          } catch (err) {
            Swal.fire("Failed", err.response?.data?.message || "Could not resend OTP", "error");
          }
        });
      },
      focusConfirm: false,
      preConfirm: () => {
        const otpCode = Swal.getPopup().querySelector("#otp-code").value.trim();
        if (!/^\d{6}$/.test(otpCode)) {
          Swal.showValidationMessage("Please enter a valid 6-digit code");
          return false;
        }
        return { email, otpCode };
      },
      confirmButtonText: "Verify Email",
      confirmButtonColor: "#10b981",
      showCancelButton: true,
    });

    if (!form) return;

    try {
      await api.post("/api/auth/verify-email", form);
      await Swal.fire({
        icon: "success",
        title: "Email Verified!",
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire("Verification Failed", err.response?.data?.message || "Invalid OTP", "error");
    }
  }, []);

  const handleUserSignup = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors(prev => ({ ...prev, user: {} }));
    const newErrors = {};
    if (!userData.first_name) newErrors.first_name = "Required";
    if (!userData.last_name) newErrors.last_name = "Required";
    if (!userData.email || !validateEmail(userData.email)) newErrors.email = "Valid email required";
    if (!userData.phone || !validatePhone(userData.phone)) newErrors.phone = "Valid phone required";
    if (!userData.password || !validatePassword(userData.password)) newErrors.password = "Min 6 characters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, user: newErrors }));
      setLoading(false);
      return;
    }

    try {
      await api.post("/api/auth/register/user", userData);
      await Swal.fire({ icon: "success", title: "Account Created!", text: "Please verify your email.", toast: true, position: "top-end", timer: 2000 });
      verifyEmail(userData.email);
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setErrors(prev => ({ ...prev, user: { general: msg } }));
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  }, [userData, validateEmail, validatePhone, validatePassword, verifyEmail, navigate]);

  const handleShopSignup = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors(prev => ({ ...prev, shop: {} }));
    const newErrors = {};
    if (!shopData.name) newErrors.name = "Required";
    if (!shopData.email || !validateEmail(shopData.email)) newErrors.email = "Valid email required";
    if (!shopData.password || !validatePassword(shopData.password)) newErrors.password = "Min 6 characters";
    if (!shopData.phone || !validatePhone(shopData.phone)) newErrors.phone = "Valid phone required";
    if (!shopData.description) newErrors.description = "Required";
    if (!shopData.shopType) newErrors.shopType = "Required";
    if (!shopData.shopAddress.state) newErrors.state = "Required";
    if (!shopData.shopAddress.city) newErrors.city = "Required";
    if (!shopData.shopAddress.street) newErrors.street = "Required";
    if (!shopData.shopAddress.building) newErrors.building = "Required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, shop: newErrors }));
      setLoading(false);
      return;
    }

    try {
      await api.post("/api/auth/register/shop", shopData);
      await Swal.fire({ icon: "success", title: "Shop Created!", text: "Please verify your email.", toast: true, position: "top-end", timer: 2000 });
      verifyEmail(shopData.email);
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setErrors(prev => ({ ...prev, shop: { general: msg } }));
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  }, [shopData, validateEmail, validatePhone, validatePassword, verifyEmail, navigate]);

  const handleDeliverySignup = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors(prev => ({ ...prev, delivery: {} }));
    const newErrors = {};
    if (!deliveryData.name) newErrors.name = "Required";
    if (!deliveryData.email || !validateEmail(deliveryData.email)) newErrors.email = "Valid email required";
    if (!deliveryData.phone || !validatePhone(deliveryData.phone)) newErrors.phone = "Valid phone required";
    if (!deliveryData.password || !validatePassword(deliveryData.password)) newErrors.password = "Min 6 characters";
    if (!deliveryData.address) newErrors.address = "Required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, delivery: newErrors }));
      setLoading(false);
      return;
    }

    try {
      await api.post("/api/auth/register/delivery", deliveryData);
      await Swal.fire({ icon: "success", title: "Account Created!", text: "Please verify your email.", toast: true, position: "top-end", timer: 2000 });
      verifyEmail(deliveryData.email);
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setErrors(prev => ({ ...prev, delivery: { general: msg } }));
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  }, [deliveryData, validateEmail, validatePhone, validatePassword, verifyEmail, navigate]);

  const handleAssignerSignup = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors(prev => ({ ...prev, assigner: {} }));
    const newErrors = {};
    if (!assignerData.name) newErrors.name = "Required";
    if (!assignerData.email || !validateEmail(assignerData.email)) newErrors.email = "Valid email required";
    if (!assignerData.phone || !validatePhone(assignerData.phone)) newErrors.phone = "Valid phone required";
    if (!assignerData.password || !validatePassword(assignerData.password)) newErrors.password = "Min 6 characters";
    if (!assignerData.department) newErrors.department = "Required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, assigner: newErrors }));
      setLoading(false);
      return;
    }

    try {
      await api.post("/api/auth/register/assigner", assignerData);
      await Swal.fire({ icon: "success", title: "Account Created!", text: "Please verify your email.", toast: true, position: "top-end", timer: 2000 });
      verifyEmail(assignerData.email);
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setErrors(prev => ({ ...prev, assigner: { general: msg } }));
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  }, [assignerData, validateEmail, validatePhone, validatePassword, verifyEmail, navigate]);

  const tabConfig = [
    { key: "user", label: "User", icon: <RiUserLine size={20} /> },
    { key: "shop", label: "Shop Owner", icon: <RiStore2Line size={20} /> },
    { key: "delivery", label: "Delivery", icon: <RiTruckLine size={20} /> },
    { key: "assigner", label: "Assigner", icon: <RiUserSettingsLine size={20} /> }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 relative overflow-hidden">
      <RiUserLine className="absolute top-10 left-10 text-emerald-200 dark:text-emerald-600 text-8xl opacity-20 animate-pulse" />
      <RiStore2Line className="absolute bottom-16 right-12 text-lime-200 dark:text-lime-600 text-9xl opacity-20 animate-bounce" />
      <RiTruckLine className="absolute top-1/3 left-1/4 text-emerald-200 dark:text-emerald-600 text-8xl opacity-15 animate-spin-slow" />

      <div className="w-full max-w-3xl px-6 mt-5">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 dark:border-gray-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-emerald-800 dark:text-emerald-200 mb-2">Create Account</h1>
            <p className="text-lg text-emerald-600 dark:text-emerald-300 font-medium">Choose your role to get started</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {tabConfig.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all shadow-sm ${
                  activeTab === key
                    ? "bg-gradient-to-r from-emerald-500 to-lime-600 text-white shadow-md"
                    : "bg-emerald-50 dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-gray-700 border border-emerald-200 dark:border-gray-600"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {activeTab === "user" && (
            <form onSubmit={handleUserSignup} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">First Name</label>
                  <div className="relative">
                    <RiUserLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="text"
                      name="first_name"
                      onChange={handleUserChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter first name"
                    />
                  </div>
                  {errors.user.first_name && <p className="text-red-500 dark:text-red-400 text-xs">{errors.user.first_name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Last Name</label>
                  <div className="relative">
                    <RiUserLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="text"
                      name="last_name"
                      onChange={handleUserChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter last name"
                    />
                  </div>
                  {errors.user.last_name && <p className="text-red-500 dark:text-red-400 text-xs">{errors.user.last_name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Email Address</label>
                  <div className="relative">
                    <RiMailLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="email"
                      name="email"
                      onChange={handleUserChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter email"
                    />
                  </div>
                  {errors.user.email && <p className="text-red-500 dark:text-red-400 text-xs">{errors.user.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Phone Number</label>
                  <div className="relative">
                    <RiPhoneLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="tel"
                      name="phone"
                      onChange={handleUserChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter phone number"
                    />
                  </div>
                  {errors.user.phone && <p className="text-red-500 dark:text-red-400 text-xs">{errors.user.phone}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Password (min 6 characters)</label>
                  <div className="relative">
                    <RiLockPasswordLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="password"
                      name="password"
                      onChange={handleUserChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter password"
                    />
                  </div>
                  {errors.user.password && <p className="text-red-500 dark:text-red-400 text-xs">{errors.user.password}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-lime-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  "Sign Up as User"
                )}
              </button>
            </form>
          )}

          {activeTab === "shop" && (
            <form onSubmit={handleShopSignup} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Shop Name</label>
                  <div className="relative">
                    <RiStore2Line className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="text"
                      name="name"
                      onChange={handleShopChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter shop name"
                    />
                  </div>
                  {errors.shop.name && <p className="text-red-500 dark:text-red-400 text-xs">{errors.shop.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Email Address</label>
                  <div className="relative">
                    <RiMailLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="email"
                      name="email"
                      onChange={handleShopChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter email"
                    />
                  </div>
                  {errors.shop.email && <p className="text-red-500 dark:text-red-400 text-xs">{errors.shop.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Phone Number</label>
                  <div className="relative">
                    <RiPhoneLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="tel"
                      name="phone"
                      onChange={handleShopChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter phone"
                    />
                  </div>
                  {errors.shop.phone && <p className="text-red-500 dark:text-red-400 text-xs">{errors.shop.phone}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Shop Description</label>
                  <div className="relative">
                    <RiFileListLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="text"
                      name="description"
                      onChange={handleShopChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Brief description"
                    />
                  </div>
                  {errors.shop.description && <p className="text-red-500 dark:text-red-400 text-xs">{errors.shop.description}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Shop Type</label>
                  <div className="relative">
                    <RiStore2Line className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400 pointer-events-none" size={22} />
                    <select
                      name="shopType"
                      onChange={handleShopChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all appearance-none"
                    >
                      <option value="">Select type</option>
                      <option value="REPAIRER">Repairer</option>
                      <option value="SELLER">Seller</option>
                      <option value="BOTH">Both</option>
                    </select>
                  </div>
                  {errors.shop.shopType && <p className="text-red-500 dark:text-red-400 text-xs">{errors.shop.shopType}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">State</label>
                  <div className="relative">
                    <RiMapPinLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="text"
                      name="state"
                      onChange={handleShopChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="e.g. Cairo"
                    />
                  </div>
                  {errors.shop.state && <p className="text-red-500 dark:text-red-400 text-xs">{errors.shop.state}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">City</label>
                  <div className="relative">
                    <RiMapPinLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="text"
                      name="city"
                      onChange={handleShopChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="e.g. Giza"
                    />
                  </div>
                  {errors.shop.city && <p className="text-red-500 dark:text-red-400 text-xs">{errors.shop.city}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Street</label>
                  <div className="relative">
                    <RiMapPinLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="text"
                      name="street"
                      onChange={handleShopChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Street name"
                    />
                  </div>
                  {errors.shop.street && <p className="text-red-500 dark:text-red-400 text-xs">{errors.shop.street}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Building</label>
                  <div className="relative">
                    <RiMapPinLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="text"
                      name="building"
                      onChange={handleShopChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Building number"
                    />
                  </div>
                  {errors.shop.building && <p className="text-red-500 dark:text-red-400 text-xs">{errors.shop.building}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Password (min 6 characters)</label>
                  <div className="relative">
                    <RiLockPasswordLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="password"
                      name="password"
                      onChange={handleShopChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter password"
                    />
                  </div>
                  {errors.shop.password && <p className="text-red-500 dark:text-red-400 text-xs">{errors.shop.password}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-lime-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Shop...
                  </>
                ) : (
                  "Sign Up as Shop Owner"
                )}
              </button>
            </form>
          )}

          {activeTab === "delivery" && (
            <form onSubmit={handleDeliverySignup} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Full Name</label>
                  <div className="relative">
                    <RiUserLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="text"
                      name="name"
                      onChange={handleDeliveryChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter full name"
                    />
                  </div>
                  {errors.delivery.name && <p className="text-red-500 dark:text-red-400 text-xs">{errors.delivery.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Email Address</label>
                  <div className="relative">
                    <RiMailLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="email"
                      name="email"
                      onChange={handleDeliveryChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter email"
                    />
                  </div>
                  {errors.delivery.email && <p className="text-red-500 dark:text-red-400 text-xs">{errors.delivery.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Phone Number</label>
                  <div className="relative">
                    <RiPhoneLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="tel"
                      name="phone"
                      onChange={handleDeliveryChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter phone"
                    />
                  </div>
                  {errors.delivery.phone && <p className="text-red-500 dark:text-red-400 text-xs">{errors.delivery.phone}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Delivery Address</label>
                  <div className="relative">
                    <RiHome4Line className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="text"
                      name="address"
                      onChange={handleDeliveryChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter address"
                    />
                  </div>
                  {errors.delivery.address && <p className="text-red-500 dark:text-red-400 text-xs">{errors.delivery.address}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Password (min 6 characters)</label>
                  <div className="relative">
                    <RiLockPasswordLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="password"
                      name="password"
                      onChange={handleDeliveryChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter password"
                    />
                  </div>
                  {errors.delivery.password && <p className="text-red-500 dark:text-red-400 text-xs">{errors.delivery.password}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-lime-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  "Sign Up as Delivery"
                )}
              </button>
            </form>
          )}

          {activeTab === "assigner" && (
            <form onSubmit={handleAssignerSignup} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Full Name</label>
                  <div className="relative">
                    <RiUserLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="text"
                      name="name"
                      onChange={handleAssignerChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter full name"
                    />
                  </div>
                  {errors.assigner.name && <p className="text-red-500 dark:text-red-400 text-xs">{errors.assigner.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Department</label>
                  <div className="relative">
                    <RiUserSettingsLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="text"
                      name="department"
                      onChange={handleAssignerChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter department"
                    />
                  </div>
                  {errors.assigner.department && <p className="text-red-500 dark:text-red-400 text-xs">{errors.assigner.department}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Email Address</label>
                  <div className="relative">
                    <RiMailLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="email"
                      name="email"
                      onChange={handleAssignerChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter email"
                    />
                  </div>
                  {errors.assigner.email && <p className="text-red-500 dark:text-red-400 text-xs">{errors.assigner.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Phone Number</label>
                  <div className="relative">
                    <RiPhoneLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="tel"
                      name="phone"
                      onChange={handleAssignerChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter phone"
                    />
                  </div>
                  {errors.assigner.phone && <p className="text-red-500 dark:text-red-400 text-xs">{errors.assigner.phone}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">Password (min 6 characters)</label>
                  <div className="relative">
                    <RiLockPasswordLine className="absolute left-4 top-4 text-emerald-600 dark:text-emerald-400" size={22} />
                    <input
                      type="password"
                      name="password"
                      onChange={handleAssignerChange}
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                      placeholder="Enter password"
                    />
                  </div>
                  {errors.assigner.password && <p className="text-red-500 dark:text-red-400 text-xs">{errors.assigner.password}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-lime-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  "Sign Up as Assigner"
                )}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-emerald-700 dark:text-emerald-300 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 35s linear infinite; }
      `}</style>
    </div>
  );
};

export default Signup;