import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { debounce } from "lodash";
import api from "../api";
import {
  RiUserLine,
  RiLockPasswordLine,
  RiMailLine,
  RiPhoneLine,
  RiHome4Line,
  RiMapPinLine,
  RiBuilding4Line,
  RiStore2Line,
  RiFileListLine,
  RiComputerLine,
  RiSmartphoneLine,
  RiToolsLine,
  RiMap2Line,
  RiMapPin2Fill,
} from "react-icons/ri";

const Signup = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("user");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    user: {},
    shop: {},
    delivery: {},
    assigner: {},
  });

  const [userData, setUserData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [shopData, setShopData] = useState({
    name: "",
    email: "",
    password: "",
    description: "",
    phone: "",
    shopAddress: {
      state: "",
      city: "",
      street: "",
      building: "",
      isDefault: true,
    },
    shopType: "",
  });

  const [deliveryData, setDeliveryData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
  });

  const [assignerData, setAssignerData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    department: "",
  });

  // Validation functions
  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePhone = useCallback((phone) => {
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phone);
  }, []);

  const validatePassword = useCallback((password) => {
    return password.length >= 6;
  }, []);

  // Debounced input handlers
  const handleUserChange = useCallback(
    debounce((e) => {
      const { name, value } = e.target;
      setUserData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, user: { ...prev.user, [name]: "" } }));
    }, 300),
    []
  );

  const handleShopChange = useCallback(
    debounce((e) => {
      const { name, value } = e.target;
      if (["state", "city", "street", "building"].includes(name)) {
        setShopData((prev) => ({
          ...prev,
          shopAddress: { ...prev.shopAddress, [name]: value },
        }));
        setErrors((prev) => ({
          ...prev,
          shop: { ...prev.shop, [name]: "" },
        }));
      } else {
        setShopData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({
          ...prev,
          shop: { ...prev.shop, [name]: "" },
        }));
      }
    }, 300),
    []
  );

  const handleDeliveryChange = useCallback(
    debounce((e) => {
      const { name, value } = e.target;
      setDeliveryData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({
        ...prev,
        delivery: { ...prev.delivery, [name]: "" },
      }));
    }, 300),
    []
  );

  const handleAssignerChange = useCallback(
    debounce((e) => {
      const { name, value } = e.target;
      setAssignerData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({
        ...prev,
        assigner: { ...prev.assigner, [name]: "" },
      }));
    }, 300),
    []
  );

  // Email verification
  const verifyEmail = useCallback(
    async (email) => {
      const { value: form } = await Swal.fire({
        title: "Verify Email",
        position: "top",
        html: `
          <input id="swal-email" class="swal2-input" placeholder="Email" value="${email}" readonly>
          <input id="otp-code" type="text" inputmode="numeric" maxlength="6"
            class="swal2-input"
            style="text-align:center;font-size:20px;letter-spacing:5px;" 
            placeholder="Enter 6-digit OTP">
          <button id="resend-otp-btn" type="button" class="swal2-confirm swal2-styled mt-3">Resend OTP</button>
        `,
        didOpen: () => {
          const popup = Swal.getPopup();
          const otpInput = popup.querySelector("#otp-code");

          setTimeout(() => otpInput.focus(), 50);

          otpInput.addEventListener("input", () => {
            otpInput.value = otpInput.value.replace(/\D/g, "");
          });

          popup.querySelector("#resend-otp-btn").addEventListener("click", async () => {
            if (!email) {
              Swal.showValidationMessage("Email is required!");
              return;
            }
            try {
              await api.post("/api/auth/resend-otp", { email });
               Swal.fire({
          icon: "success",
          title: "OTP Resent",
          toast:true,
          text: "otp code resent",
          position: "top-end",
          timer: 1500,
          showConfirmButton: false,
        })
            } catch (err) {
              Swal.fire({
                icon: "error",
                title: "Error",
                text: err.response?.data?.message || "Failed to resend OTP",
                position: "top",
              });
            }
          });
        },
        focusConfirm: false,
        preConfirm: () => {
          const otpCode = Swal.getPopup().querySelector("#otp-code").value.trim();
          if (!otpCode) {
            Swal.showValidationMessage("OTP code cannot be blank!");
            return false;
          }
          if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
            Swal.showValidationMessage("Enter a valid 6-digit OTP!");
            return false;
          }
          return { email, otpCode };
        },
        confirmButtonText: "Verify",
        confirmButtonColor: "#2563eb",
        showCancelButton: true,
        cancelButtonColor: "#d33",
      });

      if (!form) return;

      try {
        await api.post("/api/auth/verify-email", form);
         Swal.fire({
          icon: "success",
          title: "Success",
          toast:true,
          text: "your email is verified.",
          position: "top-end",
          timer: 1500,
          showConfirmButton: false,
        })
      } catch (err) {
        console.error("Verification error:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Verification failed",
          position: "top",
        });
      }
    },
    []
  );

  // Signup handlers
  const handleUserSignup = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setErrors((prev) => ({ ...prev, user: {} }));

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
        setErrors((prev) => ({ ...prev, user: newErrors }));
        setLoading(false);
        return;
      }

      try {
        await api.post("/api/auth/register/user", userData);
        Swal.fire({
          icon: "success",
          title: "Success",
          toast:true,
          text: "User registered successfully! Please verify your email.",
          position: "top-end",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          verifyEmail(userData.email);
          setUserData({
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            password: "",
          });
          navigate("/login");
        });
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Registration failed";
        const newErrors = {};
        if (err.response?.status === 409) newErrors.email = "Email already exists";
        else if (errorMessage.includes("email")) newErrors.email = errorMessage;
        else if (errorMessage.includes("password")) newErrors.password = errorMessage;
        else if (errorMessage.includes("phone")) newErrors.phone = errorMessage;
        else if (errorMessage.includes("first_name")) newErrors.first_name = errorMessage;
        else if (errorMessage.includes("last_name")) newErrors.last_name = errorMessage;
        else newErrors.general = errorMessage;
        setErrors((prev) => ({ ...prev, user: newErrors }));
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          position: "top",
        });
      } finally {
        setLoading(false);
      }
    },
    [userData, validateEmail, validatePhone, validatePassword, verifyEmail, navigate]
  );

  const handleShopSignup = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setErrors((prev) => ({ ...prev, shop: {} }));

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
        setErrors((prev) => ({ ...prev, shop: newErrors }));
        setLoading(false);
        return;
      }

      try {
        await api.post("/api/auth/register/shop", shopData);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Shop registered successfully! Please verify your email.",
          position: "top",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          verifyEmail(shopData.email);
          setShopData({
            name: "",
            email: "",
            password: "",
            description: "",
            phone: "",
            shopAddress: {
              state: "",
              city: "",
              street: "",
              building: "",
              isDefault: true,
            },
            shopType: "",
          });
          navigate("/login");
        });
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Registration failed";
        const newErrors = {};
        if (err.response?.status === 409) newErrors.email = "Email already exists";
        else if (errorMessage.includes("email")) newErrors.email = errorMessage;
        else if (errorMessage.includes("password")) newErrors.password = errorMessage;
        else if (errorMessage.includes("phone")) newErrors.phone = errorMessage;
        else if (errorMessage.includes("name")) newErrors.name = errorMessage;
        else if (errorMessage.includes("description")) newErrors.description = errorMessage;
        else if (errorMessage.includes("shopType")) newErrors.shopType = errorMessage;
        else if (errorMessage.includes("state")) newErrors.state = errorMessage;
        else if (errorMessage.includes("city")) newErrors.city = errorMessage;
        else if (errorMessage.includes("street")) newErrors.street = errorMessage;
        else if (errorMessage.includes("building")) newErrors.building = errorMessage;
        else newErrors.general = errorMessage;
        setErrors((prev) => ({ ...prev, shop: newErrors }));
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          position: "top",
        });
      } finally {
        setLoading(false);
      }
    },
    [shopData, validateEmail, validatePhone, validatePassword, verifyEmail, navigate]
  );

  const handleDeliverySignup = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setErrors((prev) => ({ ...prev, delivery: {} }));

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
        setErrors((prev) => ({ ...prev, delivery: newErrors }));
        setLoading(false);
        return;
      }

      try {
        await api.post("/api/auth/register/delivery", deliveryData);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Delivery registered successfully! Please verify your email.",
          position: "top",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          verifyEmail(deliveryData.email);
          setDeliveryData({
            name: "",
            email: "",
            phone: "",
            password: "",
            address: "",
          });
          navigate("/login");
        });
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Registration failed";
        const newErrors = {};
        if (err.response?.status === 409) newErrors.email = "Email already exists";
        else if (errorMessage.includes("email")) newErrors.email = errorMessage;
        else if (errorMessage.includes("password")) newErrors.password = errorMessage;
        else if (errorMessage.includes("phone")) newErrors.phone = errorMessage;
        else if (errorMessage.includes("name")) newErrors.name = errorMessage;
        else if (errorMessage.includes("address")) newErrors.address = errorMessage;
        else newErrors.general = errorMessage;
        setErrors((prev) => ({ ...prev, delivery: newErrors }));
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          position: "top",
        });
      } finally {
        setLoading(false);
      }
    },
    [deliveryData, validateEmail, validatePhone, validatePassword, verifyEmail, navigate]
  );

  const handleAssignerSignup = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setErrors((prev) => ({ ...prev, assigner: {} }));

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
        setErrors((prev) => ({ ...prev, assigner: newErrors }));
        setLoading(false);
        return;
      }

      try {
        await api.post("/api/auth/register/assigner", assignerData);
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Assigner registered successfully! Please verify your email.",
          position: "top",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          verifyEmail(assignerData.email);
          setAssignerData({
            name: "",
            email: "",
            phone: "",
            password: "",
            department: "",
          });
          navigate("/login");
        });
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Registration failed";
        const newErrors = {};
        if (err.response?.status === 409) newErrors.email = "Email already exists";
        else if (errorMessage.includes("email")) newErrors.email = errorMessage;
        else if (errorMessage.includes("password")) newErrors.password = errorMessage;
        else if (errorMessage.includes("phone")) newErrors.phone = errorMessage;
        else if (errorMessage.includes("name")) newErrors.name = errorMessage;
        else if (errorMessage.includes("department")) newErrors.department = errorMessage;
        else newErrors.general = errorMessage;
        setErrors((prev) => ({ ...prev, assigner: newErrors }));
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
          position: "top",
        });
      } finally {
        setLoading(false);
      }
    },
    [assignerData, validateEmail, validatePhone, validatePassword, verifyEmail, navigate]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 p-4 overflow-hidden dark:bg-gray-900">
      <RiComputerLine className="absolute top-10 left-10 text-white dark:text-gray-700 opacity-10 text-7xl animate-bounce" />
      <RiSmartphoneLine className="absolute bottom-16 right-12 text-white dark:text-gray-700 opacity-10 text-6xl animate-pulse" />
      <RiToolsLine className="absolute top-1/2 left-1/3 text-white dark:text-gray-700 opacity-10 text-8xl animate-spin-slow" />

      <div className="w-full max-w-4xl relative z-10">
        <div className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-lg border border-white/20 dark:border-gray-700 rounded-md shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-white dark:text-gray-100 text-center mb-2">
            Create an Account
          </h1>
          <p className="text-white/80 dark:text-gray-300 text-center mb-6">
            Register as a User, Shop Owner, Delivery, or Assigner
          </p>

          <div className="flex flex-wrap justify-center mb-6 space-x-2">
            {["user", "shop", "delivery", "assigner"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md font-semibold transition-all shadow-sm hover:shadow-md ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "user" && (
            <form onSubmit={handleUserSignup} className="space-y-4 animate-fade-in">
              {errors.user.general && (
                <div className="text-red-400 text-sm text-center">{errors.user.general}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <RiUserLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    onChange={(e) => {
                      e.persist();
                      handleUserChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.user.first_name ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.user.first_name && (
                    <p className="text-red-400 text-xs mt-1">{errors.user.first_name}</p>
                  )}
                </div>
                <div className="relative">
                  <RiUserLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    onChange={(e) => {
                      e.persist();
                      handleUserChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.user.last_name ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.user.last_name && (
                    <p className="text-red-400 text-xs mt-1">{errors.user.last_name}</p>
                  )}
                </div>
                <div className="relative">
                  <RiMailLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={(e) => {
                      e.persist();
                      handleUserChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.user.email ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.user.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.user.email}</p>
                  )}
                </div>
                <div className="relative">
                  <RiPhoneLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone"
                    onChange={(e) => {
                      e.persist();
                      handleUserChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.user.phone ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.user.phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.user.phone}</p>
                  )}
                </div>
                <div className="relative sm:col-span-2">
                  <RiLockPasswordLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={(e) => {
                      e.persist();
                      handleUserChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.user.password ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.user.password && (
                    <p className="text-red-400 text-xs mt-1">{errors.user.password}</p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  "Sign up as User"
                )}
              </button>
            </form>
          )}

          {activeTab === "shop" && (
            <form onSubmit={handleShopSignup} className="space-y-4 animate-fade-in">
              {errors.shop.general && (
                <div className="text-red-400 text-sm text-center">{errors.shop.general}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <RiStore2Line className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Shop Name"
                    onChange={(e) => {
                      e.persist();
                      handleShopChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.shop.name ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.shop.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.shop.name}</p>
                  )}
                </div>
                <div className="relative">
                  <RiMailLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={(e) => {
                      e.persist();
                      handleShopChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.shop.email ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.shop.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.shop.email}</p>
                  )}
                </div>
                <div className="relative">
                  <RiLockPasswordLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={(e) => {
                      e.persist();
                      handleShopChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.shop.password ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.shop.password && (
                    <p className="text-red-400 text-xs mt-1">{errors.shop.password}</p>
                  )}
                </div>
                <div className="relative">
                  <RiFileListLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="description"
                    placeholder="Description"
                    onChange={(e) => {
                      e.persist();
                      handleShopChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.shop.description ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.shop.description && (
                    <p className="text-red-400 text-xs mt-1">{errors.shop.description}</p>
                  )}
                </div>
                <div className="relative">
                  <RiPhoneLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone"
                    onChange={(e) => {
                      e.persist();
                      handleShopChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.shop.phone ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.shop.phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.shop.phone}</p>
                  )}
                </div>
                <div className="relative">
                  <RiStore2Line className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <select
                    name="shopType"
                    onChange={(e) => {
                      e.persist();
                      handleShopChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all appearance-none ${
                      errors.shop.shopType ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <option value="">Select Shop Type</option>
                    <option value="REPAIRER">Repairer</option>
                    <option value="SELLER">Seller</option>
                    <option value="BOTH">Both</option>
                  </select>
                  {errors.shop.shopType && (
                    <p className="text-red-400 text-xs mt-1">{errors.shop.shopType}</p>
                  )}
                </div>
                <div className="relative">
                  <RiHome4Line className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    onChange={(e) => {
                      e.persist();
                      handleShopChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.shop.state ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.shop.state && (
                    <p className="text-red-400 text-xs mt-1">{errors.shop.state}</p>
                  )}
                </div>
                <div className="relative">
                  <RiMapPinLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    onChange={(e) => {
                      e.persist();
                      handleShopChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.shop.city ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.shop.city && (
                    <p className="text-red-400 text-xs mt-1">{errors.shop.city}</p>
                  )}
                </div>
                <div className="relative">
                  <RiMapPinLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="street"
                    placeholder="Street"
                    onChange={(e) => {
                      e.persist();
                      handleShopChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.shop.street ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.shop.street && (
                    <p className="text-red-400 text-xs mt-1">{errors.shop.street}</p>
                  )}
                </div>
                <div className="relative">
                  <RiBuilding4Line className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="building"
                    placeholder="Building"
                    onChange={(e) => {
                      e.persist();
                      handleShopChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.shop.building ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.shop.building && (
                    <p className="text-red-400 text-xs mt-1">{errors.shop.building}</p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  "Sign up as Shop"
                )}
              </button>
            </form>
          )}

          {activeTab === "delivery" && (
            <form onSubmit={handleDeliverySignup} className="space-y-4 animate-fade-in">
              {errors.delivery.general && (
                <div className="text-red-400 text-sm text-center">{errors.delivery.general}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <RiUserLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    onChange={(e) => {
                      e.persist();
                      handleDeliveryChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.delivery.name ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.delivery.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.delivery.name}</p>
                  )}
                </div>
                <div className="relative">
                  <RiMapPinLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    onChange={(e) => {
                      e.persist();
                      handleDeliveryChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.delivery.address ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.delivery.address && (
                    <p className="text-red-400 text-xs mt-1">{errors.delivery.address}</p>
                  )}
                </div>
                <div className="relative">
                  <RiMailLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={(e) => {
                      e.persist();
                      handleDeliveryChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.delivery.email ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.delivery.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.delivery.email}</p>
                  )}
                </div>
                <div className="relative">
                  <RiPhoneLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone"
                    onChange={(e) => {
                      e.persist();
                      handleDeliveryChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.delivery.phone ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.delivery.phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.delivery.phone}</p>
                  )}
                </div>
                <div className="relative sm:col-span-2">
                  <RiLockPasswordLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={(e) => {
                      e.persist();
                      handleDeliveryChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.delivery.password ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.delivery.password && (
                    <p className="text-red-400 text-xs mt-1">{errors.delivery.password}</p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  "Sign up as Delivery"
                )}
              </button>
            </form>
          )}

          {activeTab === "assigner" && (
            <form onSubmit={handleAssignerSignup} className="space-y-4 animate-fade-in">
              {errors.assigner.general && (
                <div className="text-red-400 text-sm text-center">{errors.assigner.general}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <RiUserLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    onChange={(e) => {
                      e.persist();
                      handleAssignerChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.assigner.name ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.assigner.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.assigner.name}</p>
                  )}
                </div>
                <div className="relative">
                  <RiStore2Line className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="department"
                    placeholder="Department"
                    onChange={(e) => {
                      e.persist();
                      handleAssignerChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.assigner.department ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.assigner.department && (
                    <p className="text-red-400 text-xs mt-1">{errors.assigner.department}</p>
                  )}
                </div>
                <div className="relative">
                  <RiMailLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={(e) => {
                      e.persist();
                      handleAssignerChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.assigner.email ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.assigner.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.assigner.email}</p>
                  )}
                </div>
                <div className="relative">
                  <RiPhoneLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone"
                    onChange={(e) => {
                      e.persist();
                      handleAssignerChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.assigner.phone ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.assigner.phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.assigner.phone}</p>
                  )}
                </div>
                <div className="relative sm:col-span-2">
                  <RiLockPasswordLine className="absolute top-3 left-3 text-indigo-600 dark:text-indigo-400 text-xl" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={(e) => {
                      e.persist();
                      handleAssignerChange(e);
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                      errors.assigner.password ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {errors.assigner.password && (
                    <p className="text-red-400 text-xs mt-1">{errors.assigner.password}</p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-md hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  "Sign up as Assigner"
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-white/80 dark:text-gray-300">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-white dark:text-indigo-400 underline hover:text-indigo-200 dark:hover:text-indigo-300">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;