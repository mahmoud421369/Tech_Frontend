import React, { useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/Auth";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import { RiComputerLine, RiSmartphoneLine, RiToolsLine } from "react-icons/ri";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import api from "../api";
import { debounce } from "lodash";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", general: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUserData } = useAuthStore();

  const redirectMap = useMemo(
    () => ({
      ROLE_ADMIN: "/dashboard",
      ROLE_REPAIRER: "/shop-dashboard",
      ROLE_SELLER: "/shop-dashboard",
      ROLE_SHOP_OWNER: "/shop-dashboard",
      ROLE_ASSIGNER: "/assigner-dashboard",
      ROLE_DELIVERY: "/delivery-dashboard",
      ROLE_GUEST: "/",
    }),
    []
  );

  const handleChange = useCallback(
    debounce((name, value) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }, 300),
    []
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  
  const CURRENCY = "EGP";
  const PRICE_PER_MONTH = 1200;
  const DURATION = 1;
  const TOTAL_PRICE = DURATION * PRICE_PER_MONTH;

  const createPayload = () => ({
    duration: DURATION,
    totalPrice: TOTAL_PRICE,
  });

  const getConfig = () => ({
    headers: {
      Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
    },
  });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  
  const renewCard = async (shopEmail) => {
    if (!validateEmail(shopEmail)) {
      Swal.fire("Error", "Invalid email address", "error");
      return;
    }

    const confirm = await Swal.fire({
      title: "Confirm Card Payment",
      text: `${DURATION} month – ${TOTAL_PRICE} ${CURRENCY}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Pay Now",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444",
    });

    if (!confirm.isConfirmed) return;

    const { value: swalLoading } = await Swal.fire({
      title: "Processing...",
      text: "Creating card payment...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await api.post(
        `/api/subscriptions/renew/card/${shopEmail}`,
        createPayload(),
        getConfig()
      );

      await Swal.fire({
        icon: "success",
        title: "Payment Created",
        text: `Payment ID: ${res.data.paymentId}`,
        timer: 3000,
           toast:true,
        position:"top-end",
        showConfirmButton: false,
      });

      window.location.href = res.data.paymentUrl;
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Payment Failed",
           toast:true,
        position:"top-end",
        text: "Could not create card payment",
      });
    }
  };

 
  const renewCash = async (shopEmail) => {
    if (!validateEmail(shopEmail)) {
      Swal.fire("Error", "Invalid email address", "error");
      return;
    }

    const confirm = await Swal.fire({
      title: "Confirm Cash Payment",
      text: `${DURATION} month – ${TOTAL_PRICE} ${CURRENCY}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Submit Request",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444",
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.post(
        `/api/subscriptions/renew/cash/${shopEmail}`,
        createPayload(),
        getConfig()
      );

      await Swal.fire({
        icon: "success",
        title: "Request Sent",
        text: "Cash payment request submitted successfully",
        timer: 2500,
        toast:true,
        position:"top-end",
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Request Failed",
           toast:true,
        position:"top-end",
        text: "Could not submit cash payment request",
      });
    }
  };

  // --- RENEWAL POPUP ---
  const showRenewalPopup = (shopEmail) => {
    Swal.fire({
      title: "Renew Subscription",
      html: `
        <div class="bg-white p-6 rounded-2xl shadow-2xl text-center max-w-md mx-auto font-cairo">
          <div class="bg-gradient-to-br from-lime-50 to-white p-5 rounded-xl border border-lime-200 mb-4">
            <h3 class="text-2xl font-bold mb-3 text-lime-700">Choose a Paid Plan</h3>
            <div class="mb-4">
              <select id="duration" class="w-full p-3 rounded-lg bg-lime-50 text-lime-900 border border-lime-300 focus:ring-2 focus:ring-lime-500">
                <option value="1">1 Month (1200 EGP)</option>
              </select>
            </div>
            <div class="text-3xl font-bold mb-4 text-lime-600">
              1200 EGP
              <p class="text-sm opacity-80">1 × 1200 EGP</p>
            </div>
            <div class="flex flex-col gap-3 text-sm text-lime-700">
              <p class="flex items-center justify-center gap-2"><span class="text-lime-500">Check</span> Full Shop Management</p>
              <p class="flex items-center justify-center gap-2"><span class="text-lime-500">Check</span> 24/7 Support</p>
              <p class="flex items-center justify-center gap-2"><span class="text-lime-500">Check</span> Free Updates</p>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button id="pay-card" class="flex-1 bg-gradient-to-r from-lime-500 to-green-600 text-white font-bold py-3 rounded-lg shadow hover:shadow-lime-500/50 transition-all flex items-center justify-center gap-2 text-sm">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h10m-9 4h8m-8-8h8"></path></svg>
              Credit Card
            </button>
            <button id="pay-cash" class="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-3 rounded-lg shadow hover:shadow-teal-500/50 transition-all flex items-center justify-center gap-2 text-sm">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Cash Payment
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      width: "600px",
      background: "transparent",
      didOpen: () => {
        document.getElementById("pay-card").onclick = () => {
          Swal.close();
          renewCard(shopEmail);
        };
        document.getElementById("pay-cash").onclick = () => {
          Swal.close();
          renewCash(shopEmail);
        };
      },
    });
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setErrors({ email: "", password: "", general: "" });

      try {
        const response = await api.post("/api/auth/login", {
          email: formData.email,
          password: formData.password,
        });

        const {
          access_token: accessToken,
          role,
          id: backendUserId,
          email: backendEmail,
          requiresRenewal = false,
          shopEmail,
        } = response.data;

        if (!accessToken || typeof accessToken !== "string") {
          throw new Error("Invalid or missing access token");
        }

        let decodedToken;
        try {
          decodedToken = jwtDecode(accessToken);
        } catch (err) {
          console.warn("Failed to decode token");
        }

        const roles = Array.isArray(role) ? role : role ? [role] : [];
        const finalUserId = backendUserId ?? decodedToken?.sub ?? null;
        const finalEmail = backendEmail ?? formData.email;

      
        localStorage.setItem("id", finalUserId);

        setUserData(accessToken, roles, finalUserId, finalEmail);

        let redirectPath = "/dashboard";
        for (const r of roles) {
          if (redirectMap[r]) {
            redirectPath = redirectMap[r];
            break;
          }
        }

        await Swal.fire({
          icon: "success",
          title: "Login Successful",
          text: "Welcome back!",
          toast:true,
          position:'top-end',
          timer: 1500,
          showConfirmButton: false,
        });

        if (requiresRenewal && roles.includes("ROLE_SHOP_OWNER") && shopEmail) {
          showRenewalPopup(shopEmail);
        } else {
          navigate(redirectPath);
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Login failed. Please try again.";

        setErrors((prev) => ({
          ...prev,
          [errorMessage.includes("email") ? "email" : errorMessage.includes("password") ? "password" : "general"]: errorMessage,
        }));

        await Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    },
    [formData.email, formData.password, navigate, redirectMap, setUserData]
  );

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-white p-4 relative overflow-hidden font-cairo">
     
      <RiComputerLine className="absolute top-10 left-10 text-lime-400 text-7xl animate-pulse opacity-20" />
      <RiSmartphoneLine className="absolute bottom-16 right-12 text-lime-500 text-6xl animate-bounce opacity-20" />
      <RiToolsLine className="absolute top-1/2 left-1/3 text-lime-600 text-8xl animate-spin-slow opacity-20" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-lime-700 text-center mb-2">
            Welcome Back
          </h1>
          <p className="text-lime-600 text-center mb-6 text-sm">
            Log in to access your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-lime-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                onChange={(e) => handleChange(e.target.name, e.target.value)}
                className={`block w-full px-4 py-3 rounded-lg bg-gray-50 text-lime-900 placeholder-gray-400 border ${
                  errors.email ? "border-red-400" : "border-gray-300"
                } focus:ring-2 focus:ring-lime-500 focus:outline-none transition-all`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-lime-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  onChange={(e) => handleChange(e.target.name, e.target.value)}
                  className={`block w-full px-4 py-3 rounded-lg text-right placeholder:text-right bg-gray-50 text-lime-900 placeholder-gray-400 border ${
                    errors.password ? "border-red-400" : "border-gray-300"
                  } focus:ring-2 focus:ring-lime-500 focus:outline-none transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-lime-600 hover:text-lime-700"
                >
                  {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {errors.general && (
              <div className="text-red-600 text-sm text-center">
                {errors.general}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-lime-500 to-green-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-lime-500/50 transform hover:scale-105 transition-all disabled:opacity-70 flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-lime-700">
            <button className="underline hover:text-lime-800">
              Forgot password?
            </button>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-lime-700 font-bold py-3 rounded-lg shadow hover:bg-lime-50 transition-all mt-4"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="mt-6 text-center text-sm text-lime-700">
            New user?{" "}
            <Link to="/signup" className="font-medium text-lime-600 underline hover:text-lime-700">
              Create an account
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

export default Login;