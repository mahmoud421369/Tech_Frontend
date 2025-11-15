import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { debounce } from "lodash";
import api from "../api";
import {
  RiUserLine, RiLockPasswordLine, RiMailLine, RiPhoneLine,
  RiHome4Line, RiMapPinLine, RiBuilding4Line, RiStore2Line,
  RiFileListLine, RiComputerLine, RiSmartphoneLine, RiToolsLine,
  RiTruckLine, RiUserSettingsLine
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
      title: "Verify Email",
      html: `
        <input id="swal-email" class="swal2-input" value="${email}" readonly>
        <input id="otp-code" type="text" inputmode="numeric" maxlength="6"
          class="swal2-input" style="text-align:center;font-size:20px;letter-spacing:5px;" 
          placeholder="Enter 6-digit OTP">
        <button id="resend-otp-btn" type="button" class="swal2-confirm swal2-styled mt-3">Resend OTP</button>
      `,
      didOpen: () => {
        const otpInput = Swal.getPopup().querySelector("#otp-code");
        setTimeout(() => otpInput.focus(), 50);
        otpInput.addEventListener("input", () => {
          otpInput.value = otpInput.value.replace(/\D/g, "");
        });
        Swal.getPopup().querySelector("#resend-otp-btn").addEventListener("click", async () => {
          try {
            await api.post("/api/auth/resend-otp", { email });
            Swal.fire({ icon: "success", title: "OTP Resent", toast: true, position: "top-end", timer: 1500, showConfirmButton: false });
          } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Failed to resend OTP" });
          }
        });
      },
      focusConfirm: false,
      preConfirm: () => {
        const otpCode = Swal.getPopup().querySelector("#otp-code").value.trim();
        if (!otpCode || otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
          Swal.showValidationMessage("Enter a valid 6-digit OTP!");
          return false;
        }
        return { email, otpCode };
      },
      confirmButtonText: "Verify",
      confirmButtonColor: "#10b981",
      showCancelButton: true,
      cancelButtonColor: "#ef4444",
    });

    if (!form) return;

    try {
      await api.post("/api/auth/verify-email", form);
      Swal.fire({ icon: "success", title: "Verified", toast: true, text: "Email verified successfully.", position: "top-end", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Verification failed" });
    }
  }, []);

  const handleUserSignup = useCallback(async (e) => {
    e.preventDefault(); setLoading(true); setErrors(prev => ({ ...prev, user: {} }));
    const newErrors = {};
    if (!userData.first_name) newErrors.first_name = "First name is required";
    if (!userData.last_name) newErrors.last_name = "Last name is required";
    if (!userData.email) newErrors.email = "Email is required";
    else if (!validateEmail(userData.email)) newErrors.email = "Invalid email format";
    if (!userData.phone) newErrors.phone = "Phone is required";
    else if (!validatePhone(userData.phone)) newErrors.phone = "Phone must be 10-15 digits";
    if (!userData.password) newErrors.password = "Password is required";
    else if (!validatePassword(userData.password)) newErrors.password = "Password must be at least 6 characters";

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, user: newErrors })); setLoading(false); return;
    }

    try {
      await api.post("/api/auth/register/user", userData);
      await Swal.fire({ icon: "success", title: "Success", text: "User registered! Verify your email.", timer: 2000, showConfirmButton: false });
      verifyEmail(userData.email);
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setErrors(prev => ({ ...prev, user: { general: msg } }));
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally { setLoading(false); }
  }, [userData, validateEmail, validatePhone, validatePassword, verifyEmail, navigate]);

  const handleShopSignup = useCallback(async (e) => {
    e.preventDefault(); setLoading(true); setErrors(prev => ({ ...prev, shop: {} }));
    const newErrors = {};
    if (!shopData.name) newErrors.name = "Shop name is required";
    if (!shopData.email) newErrors.email = "Email is required";
    else if (!validateEmail(shopData.email)) newErrors.email = "Invalid email format";
    if (!shopData.password) newErrors.password = "Password is required";
    else if (!validatePassword(shopData.password)) newErrors.password = "Password must be at least 6 characters";
    if (!shopData.phone) newErrors.phone = "Phone is required";
    else if (!validatePhone(shopData.phone)) newErrors.phone = "Phone must be 10-15 digits";
    if (!shopData.description) newErrors.description = "Description is required";
    if (!shopData.shopType) newErrors.shopType = "Shop type is required";
    if (!shopData.shopAddress.state) newErrors.state = "State is required";
    if (!shopData.shopAddress.city) newErrors.city = "City is required";
    if (!shopData.shopAddress.street) newErrors.street = "Street is required";
    if (!shopData.shopAddress.building) newErrors.building = "Building is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, shop: newErrors })); setLoading(false); return;
    }

    try {
      await api.post("/api/auth/register/shop", shopData);
      await Swal.fire({ icon: "success", title: "Success", text: "Shop registered! Verify your email.", timer: 2000, showConfirmButton: false });
      verifyEmail(shopData.email);
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setErrors(prev => ({ ...prev, shop: { general: msg } }));
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally { setLoading(false); }
  }, [shopData, validateEmail, validatePhone, validatePassword, verifyEmail, navigate]);

  const handleDeliverySignup = useCallback(async (e) => {
    e.preventDefault(); setLoading(true); setErrors(prev => ({ ...prev, delivery: {} }));
    const newErrors = {};
    if (!deliveryData.name) newErrors.name = "Name is required";
    if (!deliveryData.email) newErrors.email = "Email is required";
    else if (!validateEmail(deliveryData.email)) newErrors.email = "Invalid email format";
    if (!deliveryData.phone) newErrors.phone = "Phone is required";
    else if (!validatePhone(deliveryData.phone)) newErrors.phone = "Phone must be 10-15 digits";
    if (!deliveryData.password) newErrors.password = "Password is required";
    else if (!validatePassword(deliveryData.password)) newErrors.password = "Password must be at least 6 characters";
    if (!deliveryData.address) newErrors.address = "Address is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, delivery: newErrors })); setLoading(false); return;
    }

    try {
      await api.post("/api/auth/register/delivery", deliveryData);
      await Swal.fire({ icon: "success", title: "Success", text: "Delivery registered! Verify your email.", timer: 2000, showConfirmButton: false });
      verifyEmail(deliveryData.email);
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setErrors(prev => ({ ...prev, delivery: { general: msg } }));
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally { setLoading(false); }
  }, [deliveryData, validateEmail, validatePhone, validatePassword, verifyEmail, navigate]);

  const handleAssignerSignup = useCallback(async (e) => {
    e.preventDefault(); setLoading(true); setErrors(prev => ({ ...prev, assigner: {} }));
    const newErrors = {};
    if (!assignerData.name) newErrors.name = "Name is required";
    if (!assignerData.email) newErrors.email = "Email is required";
    else if (!validateEmail(assignerData.email)) newErrors.email = "Invalid email format";
    if (!assignerData.phone) newErrors.phone = "Phone is required";
    else if (!validatePhone(assignerData.phone)) newErrors.phone = "Phone must be 10-15 digits";
    if (!assignerData.password) newErrors.password = "Password is required";
    else if (!validatePassword(assignerData.password)) newErrors.password = "Password must be at least 6 characters";
    if (!assignerData.department) newErrors.department = "Department is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, assigner: newErrors })); setLoading(false); return;
    }

    try {
      await api.post("/api/auth/register/assigner", assignerData);
      await Swal.fire({ icon: "success", title: "Success", text: "Assigner registered! Verify your email.", timer: 2000, showConfirmButton: false });
      verifyEmail(assignerData.email);
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setErrors(prev => ({ ...prev, assigner: { general: msg } }));
      Swal.fire({ icon: "error", title: "Error", text: msg });
    } finally { setLoading(false); }
  }, [assignerData, validateEmail, validatePhone, validatePassword, verifyEmail, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-lime-50 to-white p-4 overflow-hidden font-cairo">
      {/* Floating Icons */}
      <RiComputerLine className="absolute top-10 left-10 text-lime-400 text-7xl animate-pulse opacity-20" />
      <RiSmartphoneLine className="absolute bottom-16 right-12 text-lime-500 text-6xl animate-bounce opacity-20" />
      <RiToolsLine className="absolute top-1/2 left-1/3 text-lime-600 text-8xl animate-spin-slow opacity-20" />

      <div className="w-full max-w-4xl relative z-10">
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-lime-700 text-center mb-2">
            Create an Account
          </h1>
          <p className="text-lime-600 text-center mb-6">
            Choose your role to get started
          </p>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              { key: "user", label: "User", icon: <RiUserLine /> },
              { key: "shop", label: "Shop Owner", icon: <RiStore2Line /> },
              { key: "delivery", label: "Delivery", icon: <RiTruckLine /> },
              { key: "assigner", label: "Assigner", icon: <RiUserSettingsLine /> }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === key
                    ? "bg-lime-600 text-white shadow-md"
                    : "bg-gray-100 text-lime-700 hover:bg-gray-200"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* ==== USER TAB ==== */}
          {activeTab === "user" && (
            <form onSubmit={handleUserSignup} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["first_name", "last_name", "email", "phone"].map((field) => (
                  <div key={field} className="relative">
                    <input
                      type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                      name={field}
                      placeholder={field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      onChange={(e) => { e.persist(); handleUserChange(e); }}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 text-lime-900 placeholder-lime-400 border ${
                        errors.user[field] ? "border-red-400" : "border-gray-300"
                      } focus:ring-2 focus:ring-lime-500 focus:outline-none transition-all`}
                    />
                    {field === "first_name" || field === "last_name" ? (
                      <RiUserLine className="absolute top-3.5 left-3 text-lime-600" />
                    ) : field === "email" ? (
                      <RiMailLine className="absolute top-3.5 left-3 text-lime-600" />
                    ) : (
                      <RiPhoneLine className="absolute top-3.5 left-3 text-lime-600" />
                    )}
                    {errors.user[field] && <p className="text-red-600 text-xs mt-1">{errors.user[field]}</p>}
                  </div>
                ))}
                <div className="relative sm:col-span-2">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={(e) => { e.persist(); handleUserChange(e); }}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 text-lime-900 placeholder-lime-400 border ${
                      errors.user.password ? "border-red-400" : "border-gray-300"
                    } focus:ring-2 focus:ring-lime-500 focus:outline-none transition-all`}
                  />
                  <RiLockPasswordLine className="absolute top-3.5 left-3 text-lime-600" />
                  {errors.user.password && <p className="text-red-600 text-xs mt-1">{errors.user.password}</p>}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-lime-500 to-green-600 text-white font-bold py-3 rounded-lg shadow hover:shadow-lime-500/50 transition-all disabled:opacity-70 flex items-center justify-center"
              >
                {loading ? "Signing up..." : "Sign up as User"}
              </button>
            </form>
          )}

          {/* ==== SHOP OWNER TAB ==== */}
          {activeTab === "shop" && (
            <form onSubmit={handleShopSignup} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["name", "email", "password", "description", "phone"].map((field) => (
                  <div key={field} className="relative">
                    <input
                      type={field === "email" ? "email" : field === "password" ? "password" : "text"}
                      name={field}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      onChange={(e) => { e.persist(); handleShopChange(e); }}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 text-lime-900 placeholder-lime-400 border ${
                        errors.shop[field] ? "border-red-400" : "border-gray-300"
                      } focus:ring-2 focus:ring-lime-500 focus:outline-none transition-all`}
                    />
                    {field === "name" && <RiStore2Line className="absolute top-3.5 left-3 text-lime-600" />}
                    {field === "email" && <RiMailLine className="absolute top-3.5 left-3 text-lime-600" />}
                    {field === "password" && <RiLockPasswordLine className="absolute top-3.5 left-3 text-lime-600" />}
                    {field === "description" && <RiFileListLine className="absolute top-3.5 left-3 text-lime-600" />}
                    {field === "phone" && <RiPhoneLine className="absolute top-3.5 left-3 text-lime-600" />}
                    {errors.shop[field] && <p className="text-red-600 text-xs mt-1">{errors.shop[field]}</p>}
                  </div>
                ))}
                <div className="relative">
                  <select
                    name="shopType"
                    onChange={(e) => { e.persist(); handleShopChange(e); }}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 text-lime-900 border ${
                      errors.shop.shopType ? "border-red-400" : "border-gray-300"
                    } focus:ring-2 focus:ring-lime-500 focus:outline-none transition-all appearance-none`}
                  >
                    <option value="">Select Shop Type</option>
                    <option value="REPAIRER">Repairer</option>
                    <option value="SELLER">Seller</option>
                    <option value="BOTH">Both</option>
                  </select>
                  <RiStore2Line className="absolute top-3.5 left-3 text-lime-600 pointer-events-none" />
                  {errors.shop.shopType && <p className="text-red-600 text-xs mt-1">{errors.shop.shopType}</p>}
                </div>
                {["state", "city", "street", "building"].map((field) => (
                  <div key={field} className="relative">
                    <input
                      type="text"
                      name={field}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      onChange={(e) => { e.persist(); handleShopChange(e); }}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 text-lime-900 placeholder-lime-400 border ${
                        errors.shop[field] ? "border-red-400" : "border-gray-300"
                      } focus:ring-2 focus:ring-lime-500 focus:outline-none transition-all`}
                    />
                    <RiMapPinLine className="absolute top-3.5 left-3 text-lime-600" />
                    {errors.shop[field] && <p className="text-red-600 text-xs mt-1">{errors.shop[field]}</p>}
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-lime-500 to-green-600 text-white font-bold py-3 rounded-lg shadow hover:shadow-lime-500/50 transition-all disabled:opacity-70"
              >
                {loading ? "Signing up..." : "Sign up as Shop Owner"}
              </button>
            </form>
          )}

          {/* ==== DELIVERY TAB ==== */}
          {activeTab === "delivery" && (
            <form onSubmit={handleDeliverySignup} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["name", "address", "email", "phone"].map((field) => (
                  <div key={field} className="relative">
                    <input
                      type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                      name={field}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      onChange={(e) => { e.persist(); handleDeliveryChange(e); }}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 text-lime-900 placeholder-lime-400 border ${
                        errors.delivery[field] ? "border-red-400" : "border-gray-300"
                      } focus:ring-2 focus:ring-lime-500 focus:outline-none transition-all`}
                    />
                    {field === "name" && <RiUserLine className="absolute top-3.5 left-3 text-lime-600" />}
                    {field === "address" && <RiHome4Line className="absolute top-3.5 left-3 text-lime-600" />}
                    {field === "email" && <RiMailLine className="absolute top-3.5 left-3 text-lime-600" />}
                    {field === "phone" && <RiPhoneLine className="absolute top-3.5 left-3 text-lime-600" />}
                    {errors.delivery[field] && <p className="text-red-600 text-xs mt-1">{errors.delivery[field]}</p>}
                  </div>
                ))}
                <div className="relative sm:col-span-2">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={(e) => { e.persist(); handleDeliveryChange(e); }}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 text-lime-900 placeholder-lime-400 border ${
                      errors.delivery.password ? "border-red-400" : "border-gray-300"
                    } focus:ring-2 focus:ring-lime-500 focus:outline-none transition-all`}
                  />
                  <RiLockPasswordLine className="absolute top-3.5 left-3 text-lime-600" />
                  {errors.delivery.password && <p className="text-red-600 text-xs mt-1">{errors.delivery.password}</p>}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-lime-500 to-green-600 text-white font-bold py-3 rounded-lg shadow hover:shadow-lime-500/50 transition-all disabled:opacity-70"
              >
                {loading ? "Signing up..." : "Sign up as Delivery"}
              </button>
            </form>
          )}

          {/* ==== ASSIGNER TAB ==== */}
          {activeTab === "assigner" && (
            <form onSubmit={handleAssignerSignup} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["name", "department", "email", "phone"].map((field) => (
                  <div key={field} className="relative">
                    <input
                      type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                      name={field}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      onChange={(e) => { e.persist(); handleAssignerChange(e); }}
                      className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 text-lime-900 placeholder-lime-400 border ${
                        errors.assigner[field] ? "border-red-400" : "border-gray-300"
                      } focus:ring-2 focus:ring-lime-500 focus:outline-none transition-all`}
                    />
                    {field === "name" && <RiUserLine className="absolute top-3.5 left-3 text-lime-600" />}
                    {field === "department" && <RiUserSettingsLine className="absolute top-3.5 left-3 text-lime-600" />}
                    {field === "email" && <RiMailLine className="absolute top-3.5 left-3 text-lime-600" />}
                    {field === "phone" && <RiPhoneLine className="absolute top-3.5 left-3 text-lime-600" />}
                    {errors.assigner[field] && <p className="text-red-600 text-xs mt-1">{errors.assigner[field]}</p>}
                  </div>
                ))}
                <div className="relative sm:col-span-2">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={(e) => { e.persist(); handleAssignerChange(e); }}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 text-lime-900 placeholder-lime-400 border ${
                      errors.assigner.password ? "border-red-400" : "border-gray-300"
                    } focus:ring-2 focus:ring-lime-500 focus:outline-none transition-all`}
                  />
                  <RiLockPasswordLine className="absolute top-3.5 left-3 text-lime-600" />
                  {errors.assigner.password && <p className="text-red-600 text-xs mt-1">{errors.assigner.password}</p>}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-lime-500 to-green-600 text-white font-bold py-3 rounded-lg shadow hover:shadow-lime-500/50 transition-all disabled:opacity-70"
              >
                {loading ? "Signing up..." : "Sign up as Assigner"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-lime-700">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-lime-600 underline hover:text-lime-700">
              Log in
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
      `}</style>
    </div>
  );
};

export default Signup;