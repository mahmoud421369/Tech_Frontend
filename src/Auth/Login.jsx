import React, { useState, useCallback, useMemo, useEffect } from "react";
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


  useEffect(() => {
    document.title = "Login";
  }, []);

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

    Swal.fire({
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

      Swal.fire({
        icon: "success",
        title: "Payment Created",
        text: `Payment ID: ${res.data.paymentId}`,
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });

      window.location.href = res.data.paymentUrl;
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Payment Failed",
        toast: true,
        position: "top-end",
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

      Swal.fire({
        icon: "success",
        title: "Request Sent",
        text: "Cash payment request submitted successfully",
        toast: true,
        position: "top-end",
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Request Failed",
        toast: true,
        position: "top-end",
        text: "Could not submit cash payment request",
      });
    }
  };

  const showRenewalPopup = (shopEmail) => {
    Swal.fire({
      title: "Renew Your Subscription",
      html: `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl text-center max-w-md mx-auto">
          <div class="bg-gradient-to-br from-emerald-50 to-lime-50 dark:from-emerald-900/20 dark:to-lime-900/20 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-700 mb-6">
            <h3 class="text-2xl font-bold mb-4 text-emerald-800 dark:text-emerald-200">Premium Plan</h3>
            <div class="text-4xl font-extrabold text-emerald-600 dark:text-emerald-300 mb-2">
              1200 <span class="text-lg font-normal">EGP</span>
            </div>
            <p class="text-sm text-emerald-700 dark:text-emerald-300 mb-6">per month</p>
            <div class="space-y-3 text-left text-emerald-800 dark:text-emerald-200 text-sm">
              <p class="flex items-center gap-3"><span class="text-emerald-500 text-xl">✓</span> Full Shop Management</p>
              <p class="flex items-center gap-3"><span class="text-emerald-500 text-xl">✓</span> 24/7 Priority Support</p>
              <p class="flex items-center gap-3"><span class="text-emerald-500 text-xl">✓</span> Free Updates</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <button id="pay-card" class="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h10m-9 4h8m-8-8h8"></path></svg>
              Pay with Card
            </button>
            <button id="pay-cash" class="bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Cash Payment
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      width: "560px",
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
          title: "Welcome back!",
          toast: true,
          position: "top-end",
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
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

        setErrors((prev) => ({ ...prev, general: errorMessage }));

        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: errorMessage,
          confirmButtonColor: "#ef4444",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-lime-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 relative overflow-hidden">
     
      <RiComputerLine className="absolute top-10 left-10 text-emerald-200 dark:text-emerald-600 text-8xl opacity-20 animate-pulse" />
      <RiSmartphoneLine className="absolute bottom-16 right-12 text-lime-200 dark:text-lime-600 text-7xl opacity-20 animate-bounce" />
      <RiToolsLine className="absolute top-1/3 left-1/4 text-emerald-200 dark:text-emerald-600 text-9xl opacity-15 animate-spin-slow" />

     
      <div className="w-full max-w-lg px-6">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 dark:border-gray-700 p-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-extrabold text-emerald-800 dark:text-emerald-200 mb-2">Welcome Back</h1>
            <p className="text-lg text-emerald-600 dark:text-emerald-300 font-medium">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={(e) => handleChange(e.target.name, e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-base"
                placeholder="Enter your email"
              />
            </div>

           
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleChange(e.target.name, e.target.value)}
                  className="w-full px-5 py-4 pr-12 rounded-xl bg-emerald-50/60 dark:bg-gray-800 border border-emerald-200 dark:border-gray-600 text-emerald-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-base"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200"
                >
                  {showPassword ? <RiEyeOffLine size={22} /> : <RiEyeLine size={22} />}
                </button>
              </div>
            </div>

            {errors.general && (
              <div className="text-center text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                {errors.general}
              </div>
            )}

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
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 underline text-sm font-medium">
              Forgot your password?
            </button>
          </div>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-emerald-200 dark:border-gray-600"></div>
            <span className="px-4 text-emerald-500 dark:text-emerald-400 text-sm font-medium bg-white dark:bg-gray-900">OR</span>
            <div className="flex-1 border-t border-emerald-200 dark:border-gray-600"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-emerald-200 dark:border-gray-600 text-emerald-800 dark:text-gray-200 font-semibold py-4 rounded-xl shadow hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-500 transition-all text-base"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-6 h-6"
            />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-emerald-700 dark:text-emerald-300 font-medium">
            New here?{" "}
            <Link to="/signup" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              Create an account
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

export default Login;