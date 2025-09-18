import React, { useState,useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import { RiComputerLine, RiSmartphoneLine, RiToolsLine } from "react-icons/ri";

const Login = ({ onLogin,setAuthToken }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("user");
  const navigate = useNavigate();
  const { login } = useAuth();



  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);




  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const togglePasswordVisibility = () => setShowPassword(!showPassword);


useEffect(() => {
localStorage.setItem("authToken","eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJUZWNoIFJlc3RvcmUiLCJzdWIiOiJKV1QgVG9rZW4iLCJ1c2VybmFtZSI6ImZmZHlmdGozNEBnbWFpbC5jb20iLCJyb2xlcyI6WyJST0xFX0dVRVNUIl0sInRva2VuVHlwZSI6ImFjY2VzcyIsImV4cCI6MTc1ODE4MjA0MiwiaWF0IjoxNzU4MTc4NDQyfQ.zPvX_tWCh8XUdJKsVh8VbN_HFmzMKHGVV64_5fMt4kPoMWq-A-XNqEDhTwBTgdyK0oFQO_1rusJ83edfM8bOmw")
}, []);


const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

   
      localStorage.setItem("authToken", data.access_token);
      if (setAuthToken) setAuthToken(data.access_token);

      console.log("Login success:", data);

    
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  const verifyEmail = async () => {
    const { value: form } = await Swal.fire({
      title: "Verify Email",
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
            if (!res.ok) throw new Error("Failed to resend OTP");
            Swal.fire("Success", "OTP resent successfully!", "success");
          } catch (err) {
            Swal.fire("Error", err.message, "error");
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
        return { email, otpCode };
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

      if (!res.ok) throw new Error("Verification failed");
      Swal.fire("Verified", "Your email has been verified!", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };


  const forgotPassword = async () => {
    const { value: form } = await Swal.fire({
      title: "Forgot Password",
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
            if (!res.ok) throw new Error("Failed to send OTP to email");
            Swal.fire("Success", "OTP sent to your email!", "success");
          } catch (err) {
            Swal.fire("Error", err.message, "error");
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

      if (!res.ok) throw new Error("Password reset failed");
      Swal.fire("Success", "Password has been reset!", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };




const googleLogin = async () => {
  const res = window.open(
    "http://localhost:8080/oauth2/authorization/google",
    "_blank",
    "width=500,height=600"
  );


       
    localStorage.setItem("authToken","eyJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJUZWNoIFJlc3RvcmUiLCJzdWIiOiJKV1QgVG9rZW4iLCJ1c2VybmFtZSI6ImZmZHlmdGozNEBnbWFpbC5jb20iLCJyb2xlcyI6WyJST0xFX0dVRVNUIl0sInRva2VuVHlwZSI6ImFjY2VzcyIsImV4cCI6MTc1ODAwMzM0MCwiaWF0IjoxNzU3OTk5NzQwfQ.OOcUF0pg6BpbzFjwhCIYkXlVVS0JxlsgOaup4yFQEYGZ1z-ACGaVGejG0SNoXR1ztLermyrmn1jYk8ZOPGtnTg");


  
    } 


  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-400 p-4 overflow-hidden">
      <RiComputerLine className="absolute top-10 left-10 text-white opacity-20 text-6xl animate-bounce" />
      <RiSmartphoneLine className="absolute bottom-16 right-12 text-white opacity-20 text-5xl animate-pulse" />
      <RiToolsLine className="absolute top-1/2 left-1/4 text-white opacity-20 text-7xl animate-spin-slow" />

      <div className="w-full max-w-xl mt-6 relative z-10">
        <div className="bg-gradient-to-br from-blue-100/50 to-blue-300/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Welcome back
          </h1>
          <p className="text-white text-center mb-6">
            Sign in to continue to your account
          </p>

          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setActiveTab("user")}
              className={`px-4 py-2 rounded-l-lg font-bold ${
                activeTab === "user"
                  ? "bg-white text-blue-500"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              User
            </button>
            <button
              onClick={() => setActiveTab("shop")}
              className={`px-4 py-2 rounded-r-lg font-bold ${
                activeTab === "shop"
                  ? "bg-white text-blue-500"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Shop Owner
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                className="block w-full pl-3 pr-3 py-3 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="you@example.com"
              />
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
                  className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition"
            >
              {activeTab === "user" ? "Log in as User" : "Log in as Shop"}
            </button>
          </form>

          {/* Actions */}
          <div className="mt-6 space-y-2 text-center text-sm text-white">
            <button onClick={verifyEmail} className="underline">
              Verify Email
            </button>{" "}
            |{" "}
            <button onClick={forgotPassword} className="underline">
              Forgot / Reset Password
            </button>
          </div>

          {/* Google login */}
          <br />
          <button
            type="button"
            onClick={googleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-bold py-3 rounded-xl shadow-md hover:bg-gray-100 transition"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Sign in with Google
          </button>

          <div className="mt-6 text-center text-sm text-white">
            New user?{" "}
            <Link to="/signup" className="font-medium text-gray-200 underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;