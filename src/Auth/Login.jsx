import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import { RiComputerLine, RiSmartphoneLine, RiToolsLine } from "react-icons/ri";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";

const Login = ({ onLogin, setAuthToken }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", general: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();




  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); 
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({ email: "", password: "", general: "" });

 
    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      setLoading(false);
      return;
    }
    if (!formData.password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.message.includes("email")) {
          setErrors((prev) => ({ ...prev, email: data.message }));
        } else if (data.message.includes("password")) {
          setErrors((prev) => ({ ...prev, password: data.message }));
        } else {
          setErrors((prev) => ({ ...prev, general: data.message || "Login failed" }));
        }
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem("role", JSON.stringify(data.role));

      if (setAuthToken) setAuthToken(data.access_token);

      console.log("Login success:", data);

      const decodedToken = jwtDecode(data.access_token);
      const roles = data.role || [];

      let redirectPath = "/dashboard";
      if (roles.includes("ROLE_ADMIN")) {
        redirectPath = "/dashboard";
      } else if (
        roles.includes("ROLE_REPAIRER") ||
        (roles.includes("ROLE_SELLER") && roles.includes("ROLE_SHOP_OWNER"))
      ) {
        redirectPath = "/shop-dashboard";
      } else if (roles.includes("ROLE_ASSIGNER")) {
        redirectPath = "/assigner-dashboard";
      } else if (roles.includes("ROLE_DELIVERY")) {
        redirectPath = "/delivery-dashboard";
      } else if (roles.includes("ROLE_GUEST")) {
        redirectPath = "/";
      }

      Swal.fire({
        icon: "success",
        title: "Login Success",
        position: "top",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        navigate(redirectPath);
      });
    } catch (err) {
      console.error("Login error:", err);
      // Swal.fire({
      //   icon: "error",
      //   title: "Login Failed",
      //   text: err.message,
      //   position: "top",
      // });
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async () => {
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
            const res = await fetch("http://localhost:8080/api/auth/resend-otp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });

            if (!res.ok) {
              let errorMessage = "Failed to resend OTP";
              try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorMessage;
              } catch {
           
              }
              throw new Error(errorMessage);
            }

            Swal.fire({
              icon: "success",
              title: "OTP Resent",
              text: "OTP sent successfully!",
              position: "top",
              timer: 2000,
              showConfirmButton: false,
            });
          } catch (err) {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: err.message,
              position: "top",
            });
          }
        });
      },
      focusConfirm: false,
      preConfirm: () => {
        const email = document.getElementById("swal-input1").value.trim();
        const otpCode = document.getElementById("swal-input2").value.trim();
        if (!email || !otpCode) {
          Swal.showValidationMessage("Email and OTP are required!");
          return false;
        }
        return { email, optCode: otpCode };
      },
      showCancelButton: true,
      confirmButtonText: "Verify",
    });

    if (!form) return;

    try {
      const res = await fetch("http://localhost:8080/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        let errorMessage = "Verification failed";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
         
        }
        throw new Error(errorMessage);
      }

      Swal.fire({
        icon: "success",
        title: "Verified",
        text: "Your email has been verified!",
        position: "top",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Verification error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        position: "top",
      });
    }
  };

  const forgotPassword = async () => {
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
          try {
            const res = await fetch("http://localhost:8080/api/auth/forgot-password", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });

            if (!res.ok) {
              let errorMessage = "Failed to send OTP to email";
              try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorMessage;
              } catch {
    
              }
              throw new Error(errorMessage);
            }

            Swal.fire({
              icon: "success",
              title: "OTP Sent",
              text: "OTP sent to your email!",
              position: "top",
              timer: 2000,
              showConfirmButton: false,
            });
          } catch (err) {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: err.message,
              position: "top",
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

        if (!email || !otp || !newPassword || !confirmPassword) {
          Swal.showValidationMessage("All fields are required!");
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
    });

    if (!form) return;

    try {
      const res = await fetch("http://localhost:8080/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        let errorMessage = "Password reset failed";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
         
        }
        throw new Error(errorMessage);
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Password has been reset!",
        position: "top",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
        position: "top",
      });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 p-4 overflow-hidden">
      <RiComputerLine className="absolute top-10 left-10 text-white opacity-10 text-7xl animate-bounce" />
      <RiSmartphoneLine className="absolute bottom-16 right-12 text-white opacity-10 text-6xl animate-pulse" />
      <RiToolsLine className="absolute top-1/2 left-1/3 text-white opacity-10 text-8xl animate-spin-slow" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Welcome Back
          </h1>
          <p className="text-white/80 text-center mb-6">
            Sign in to access your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`block w-full px-4 py-3 rounded-lg bg-white/90 text-gray-800 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                  errors.email ? "border-2 border-red-500" : "border border-gray-300"
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full px-4 py-3 rounded-lg bg-white/90 text-gray-800 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all ${
                    errors.password ? "border-2 border-red-500" : "border border-gray-300"
                  }`}
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-500"
                >
                  {showPassword ? (
                    <RiEyeOffLine className="text-lg" />
                  ) : (
                    <RiEyeLine className="text-lg" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {errors.general && (
              <div className="text-red-400 text-sm text-center">{errors.general}</div>
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

          <div className="mt-6 space-y-2 text-center text-sm text-white/80">
            <button onClick={verifyEmail} className="underline hover:text-white">
              Verify Email
            </button>{" "}
            |{" "}
            <button onClick={forgotPassword} className="underline hover:text-white">
              Forgot / Reset Password
            </button>
          </div>

          <button
            type="button"
           onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-bold py-3 rounded-lg shadow-md hover:bg-gray-100 transition-all mt-4"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Sign in with Google
          </button>

          <div className="mt-6 text-center text-sm text-white/80">
            New user?{" "}
            <Link to="/signup" className="font-medium text-white underline hover:text-indigo-200">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;