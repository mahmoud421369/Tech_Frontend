import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import { RiComputerLine, RiSmartphoneLine, RiToolsLine } from "react-icons/ri";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";

const Login = ({ onLogin, setAuthToken }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
 
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>{
    const {name,value} = e.target;
  setFormData((prev)=>({
    ...prev,
    [name]:value
  }));

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password 
        }),

      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      localStorage.setItem("authToken", data.access_token);
      localStorage.setItem("role",Array(data.role));

      if (setAuthToken) setAuthToken(data.access_token);

      console.log("Login success:", data);

 
      const decodedToken = jwtDecode(data.access_token);
      const roles = data.role || [];

    
      if (roles[0] === "ROLE_ADMIN") {
        navigate("/dashboard");
           Swal.fire({
        icon: "success",
        title: "Login success",
      });
      } else if (roles[0] === "ROLE_REPAIRER" || roles[0] === "ROLE_SELLER" && roles[1] === "ROLE_SHOP_OWNER") {
        navigate("/shop-dashboard");
           Swal.fire({
        icon: "success",
        title: "Login success",
      });
      }
      else if (roles[0] === "ROLE_ASSIGNER") {
        navigate("/assigner-dashboard");
   Swal.fire({
        icon: "success",
        title: "Login success",
      });
      } 
      else if (roles[0] === "ROLE_DELIVERY") {
        navigate("/delivery-dashboard");
   Swal.fire({
        icon: "success",
        title: "Login success",
      });
      } else if (roles[0] === "ROLE_GUEST") {
        navigate("/");
         Swal.fire({
        icon: "success",
        title: "Login success",
      });
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: err.message,
      });
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
            
            if (!res.ok) {
              let errorMessage = "Failed to resend OTP";
              try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorMessage;
              } catch {
                // If JSON parsing fails, use default message
              }
              throw new Error(errorMessage);
            }
            
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
      
      Swal.fire("Verified", "Your email has been verified!", "success");
    } catch (err) {
      console.error("Verification error:", err);
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
            
            if (!res.ok) {
              let errorMessage = "Failed to send OTP to email";
              try {
                const errorData = await res.json();
                errorMessage = errorData.message || errorMessage;
              } catch {
               
              }
              throw new Error(errorMessage);
            }
            
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

      if (!res.ok) {
        let errorMessage = "Password reset failed";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
     
        }
        throw new Error(errorMessage);
      }
      
      Swal.fire("Success", "Password has been reset!", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };



  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      // Call your backend to trigger Google login
      const res = await fetch("http://localhost:8080/oauth2/authorization/google", {
        method: "GET",
       headers:{"Content-Type":"application/json"}
      });

      if (!res.ok) {
        throw new Error("Login failed");
      }

      const data = await res.json();
      console.log("Login response:", data);

      if (data.access_token) {
    
        localStorage.setItem("authToken", data.access_token);

      

        alert("✅ Logged in successfully!");
        navigate("/"); 
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error during login");
    } finally {
      setLoading(false);
    }
  };





  



  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-400 p-4 overflow-hidden">
      <RiComputerLine className="absolute top-10 left-10 text-white opacity-20 text-6xl animate-bounce" />
      <RiSmartphoneLine className="absolute bottom-16 right-12 text-white opacity-20 text-5xl animate-pulse" />
      <RiToolsLine className="absolute top-1/2 left-1/4 text-white opacity-20 text-7xl animate-spin-slow" />

      <div className="w-full max-w-xl mt-6 relative z-10">
        <div className="bg-gradient-to-br from-blue-100/50 to-blue-300/30 border-4 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Welcome back
          </h1>
          <p className="text-white text-center mb-6">
            Sign in to continue to your account
          </p>

       
        
 
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
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-500"
                >
                  {showPassword ? (
                    <RiEyeOffLine className="text-lg" />
                  ) : (
                    <RiEyeLine className="text-lg" />
                  )}
                </button>

              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition disabled:opacity-50"
            >
         Log In
            </button>
          </form>

    
          <div className="mt-6 space-y-2 text-center text-sm text-white">
            <button onClick={verifyEmail} className="underline">
              Verify Email
            </button>{" "}
            |{" "}
            <button onClick={forgotPassword} className="underline">
              Forgot / Reset Password
            </button>
          </div>

          
          <br />
          <button
            type="button"
            onClick={handleGoogleLogin}
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