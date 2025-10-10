import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/Auth";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import { RiComputerLine, RiSmartphoneLine, RiToolsLine } from "react-icons/ri";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import api from "../api";
import { GoogleLogin } from "@react-oauth/google";


import { debounce } from "lodash";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", general: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setAccessToken } = useAuthStore();

  
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
      console.log("API Response:", response.data);
      const { access_token: accessToken, role } = response.data;

      if (!accessToken || typeof accessToken !== "string") {
        throw new Error("Invalid or missing access token");
      }

      setAccessToken(accessToken);
      console.log("Stored Token:", useAuthStore.getState().accessToken);
      const decodedToken = jwtDecode(accessToken);
      const roles = Array.isArray(role) ? role : [];
      console.log("Roles:", roles); 

      let redirectPath = "/dashboard";
      for (const role of roles) {
        if (redirectMap[role]) {
          redirectPath = redirectMap[role];
          break;
        }
      }
      console.log("Redirecting to:", redirectPath); 
    Swal.fire({
             title: 'Success',
             text: 'Login success!',
             icon: 'success',
             toast: true,
             position: 'top-end',
             showConfirmButton: false,
             timer: 1500,
           }).then(() => {
        navigate(redirectPath);
      });
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please try again.";
      setErrors((prev) => ({
        ...prev,
        [errorMessage.includes("email") ? "email" : errorMessage.includes("password") ? "password" : "general"]: errorMessage,
      }));
       Swal.fire({
             title: 'Error',
             text: 'Login Failed!',
             icon: 'error',
             toast: true,
             position: 'top-end',
             showConfirmButton: false,
             timer: 1500,
           })
    } finally {
      setLoading(false);
    }
  },
  [formData, setAccessToken, navigate, redirectMap]
);

  
  const verifyEmail = useCallback(async () => {
    const { value: form } = await Swal.fire({
      title: "Verify Email",
      position: "top",
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Email">
        <input id="swal-input2" class="swal2-input" placeholder="OTP Code">
        <button id="resend-otp-btn" type="button" class="swal2-confirm swal2-styled mt-2">Resend OTP</button>
      `,
      didOpen: () => {
        const resendBtn = document.getElementById("resend-otp-btn");
        resendBtn.addEventListener("click", async () => {
          const email = document.getElementById("swal-input1").value.trim();
          if (!email) {
            Swal.showValidationMessage("Enter email before resending OTP!");
            return;
          }
          try {
            await api.post("/api/auth/resend-otp", { email });
          Swal.fire({
             title: 'Success',
             text: 'OTP Resent !',
             icon: 'OTP resent successfully',
             toast: true,
             position: 'top-end',
             showConfirmButton: false,
             timer: 1500,
           })
          } catch (error) {
            console.error("Error resending OTP:", error);
            Swal.fire({
              icon: "error",
              title: "Error",
              text: error.response?.data?.message || "Failed to resend OTP",
              position: "top",
              confirmButtonColor: "#2563eb",
            });
          }
        });
      },
      focusConfirm: false,
      preConfirm: () => {
        const email = document.getElementById("swal-input1").value.trim();
        const otpCode = document.getElementById("swal-input2").value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !otpCode) {
          Swal.showValidationMessage("Email and OTP are required!");
          return false;
        }
        if (!emailRegex.test(email)) {
          Swal.showValidationMessage("Invalid email format!");
          return false;
        }
        return { email, otpCode };
      },
      showCancelButton: true,
      confirmButtonText: "Verify",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
    });

    if (!form) return;

    try {
      await api.post("/api/auth/verify-email", form);
    Swal.fire({
             title: 'Success',
             text: 'Verified!',
             icon: 'email has been verified',
             toast: true,
             position: 'top-end',
             showConfirmButton: false,
             timer: 1500,
           })
    } catch (error) {
      console.error("Verification error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Verification failed",
        position: "top",
        confirmButtonColor: "#2563eb",
      });
    }
  }, []);


  const forgotPassword = useCallback(async () => {
    const { value: form } = await Swal.fire({
      title: "Forgot Password",
      position: "top",
      html: `
        <input id="swal-email" class="swal2-input" placeholder="Email">
        <input id="swal-otp" class="swal2-input" placeholder="OTP Code (after email)">
        <input id="swal-pass1" type="password" class="swal2-input" placeholder="New Password">
        <input id="swal-pass2" type="password" class="swal2-input" placeholder="Confirm Password">
        <button id="send-otp-btn" type="button" class="swal2-confirm swal2-styled mt-2">Send OTP</button>
      `,
      didOpen: () => {
        const sendOtpBtn = document.getElementById("send-otp-btn");
        sendOtpBtn.addEventListener("click", async () => {
          const email = document.getElementById("swal-email").value.trim();
          if (!email) {
            Swal.showValidationMessage("Enter email first!");
            return;
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            Swal.showValidationMessage("Invalid email format!");
            return;
          }
          try {
            await api.post("/api/auth/forgot-password", { email });
            Swal.fire({
              icon: "success",
              title: "OTP Sent",
              text: "OTP sent to your email!",
              position: "top",
              timer: 2000,
              showConfirmButton: false,
            });
          } catch (error) {
            console.error("Error sending OTP:", error);
            Swal.fire({
              icon: "error",
              title: "Error",
              text: error.response?.data?.message || "Failed to send OTP to email",
              position: "top",
              confirmButtonColor: "#2563eb",
            });
          }
        });
      },
      focusConfirm: false,
      preConfirm: () => {
        const email = document.getElementById("swal-email").value.trim();
        const otp = document.getElementById("swal-otp").value.trim();
        const newPassword = document.getElementById("swal-pass1").value.trim();
        const confirmPassword = document.getElementById("swal-pass2").value.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !otp || !newPassword || !confirmPassword) {
          Swal.showValidationMessage("All fields are required!");
          return false;
        }
        if (!emailRegex.test(email)) {
          Swal.showValidationMessage("Invalid email format!");
          return false;
        }
        if (newPassword.length < 6) {
          Swal.showValidationMessage("Password must be at least 6 characters!");
          return false;
        }
        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage("Passwords do not match!");
          return false;
        }

        return { email, otp, newPassword };
      },
      showCancelButton: true,
      confirmButtonText: "Reset Password",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
    });

    if (!form) return;

    try {
      await api.post("/api/auth/reset-password", form);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Password has been reset!",
        position: "top",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Reset password error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Password reset failed",
        position: "top",
        confirmButtonColor: "#2563eb",
      });
    }
  }, []);


   const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };







  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 p-4 overflow-hidden dark:bg-gray-900">
      <RiComputerLine className="absolute top-10 left-10 text-white dark:text-gray-700 opacity-10 text-7xl animate-bounce" />
      <RiSmartphoneLine className="absolute bottom-16 right-12 text-white dark:text-gray-700 opacity-10 text-6xl animate-pulse" />
      <RiToolsLine className="absolute top-1/2 left-1/3 text-white dark:text-gray-700 opacity-10 text-8xl animate-spin-slow" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-lg border border-white/20 dark:border-gray-700 rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-white dark:text-gray-100 text-center mb-2">
            Welcome Back
          </h1>
          <p className="text-white/80 dark:text-gray-300 text-center mb-6">
            Sign in to access your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white dark:text-gray-100 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                onChange={(e) => handleChange(e.target.name, e.target.value)}
                className={`block w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                  errors.email ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-white text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white dark:text-gray-100 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  onChange={(e) => handleChange(e.target.name, e.target.value)}
                  className={`block w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                    errors.password ? "border-2 border-red-500" : "border border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                >
                  {showPassword ? (
                    <RiEyeOffLine className="text-lg" />
                  ) : (
                    <RiEyeLine className="text-lg" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-white text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {errors.general && (
              <div className="text-white text-sm text-center">{errors.general}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                "Log In"
              )}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-white/80 dark:text-gray-300">
            <button onClick={verifyEmail} className="underline hover:text-white dark:hover:text-gray-100">
              Verify Email
            </button>{" "}
            |{" "}
            <button onClick={forgotPassword} className="underline hover:text-white dark:hover:text-gray-100">
              Forgot / Reset Password
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-bold py-3 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-all mt-4"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Sign in with Google
          </button>

          <div className="mt-6 text-center text-sm text-white/80 dark:text-gray-300">
            New user?{" "}
            <Link
              to="/signup"
              className="font-medium text-white dark:text-indigo-400 underline hover:text-indigo-200 dark:hover:text-indigo-300"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;