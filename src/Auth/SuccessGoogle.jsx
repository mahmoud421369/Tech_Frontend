import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiLoader, FiChevronRight } from "react-icons/fi";
import Cookies from "js-cookie";
import useAuthStore from "../store/Auth";

const SuccessGoogle = () => {
  const navigate = useNavigate();
  const { setAccessToken } = useAuthStore();
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState(null);

  const processAuth = useCallback(async () => {
    const cookieToken = Cookies.get("client_access_token");
    const serverToken = window.__INITIAL_DATA__?.access_token;
    const accessToken = cookieToken || serverToken;

    if (!accessToken) {
      setError("No authentication token found. Please try logging in again.");
      setStatus("error");
      return;
    }

    try {
      
      
      setAccessToken(accessToken);
      
     
      
      setStatus("success");
      
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);

      return () => clearTimeout(timer);
    } catch (err) {
      console.error("Auth Error:", err);
      setError("Failed to finalize your session. Please try again.");
      setStatus("error");
    }
  }, [navigate, setAccessToken]);

  useEffect(() => {
    processAuth();
  }, [processAuth]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-[#fafafa] dark:bg-gray-950 font-sans">
      
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <AnimatePresence mode="wait">
        {status === "verifying" && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="z-10 flex flex-col items-center text-center px-6"
          >
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center">
                <FiLoader size={40} className="text-indigo-600 animate-spin" />
              </div>
              <div className="absolute inset-0 w-24 h-24 rounded-full border-t-4 border-indigo-600 animate-[spin_1.5s_linear_infinite]" />
            </div>
            
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
              Securely Signing In
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xs">
              Establishing a secure connection with your account...
            </p>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 flex flex-col items-center text-center px-6"
          >
            <div className="relative mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                className="w-28 h-28 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)]"
              >
                <FiCheckCircle size={56} />
              </motion.div>
              
              
              
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1, x: (i % 2 ? 1 : -1) * (40 + i * 5), y: (i < 3 ? -1 : 1) * (40 + i * 5) }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-emerald-400/60 blur-[1px]"
                  transition={{ duration: 0.6, delay: 0.3 }}
                />
              ))}
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                Welcome Back!
              </h2>
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                Authentication Successful
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse flex items-center justify-center gap-2">
                Redirecting you now <FiChevronRight />
              </p>
            </div>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-10 flex flex-col items-center max-w-sm w-full mx-auto p-8 rounded-[2.5rem] bg-white dark:bg-gray-900 shadow-2xl border border-red-100 dark:border-red-900/20"
          >
            <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
              <FiAlertCircle size={40} />
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-4 text-center">
              Login Problem
            </h2>
            
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20 text-center mb-8 w-full">
              <p className="text-sm font-bold text-red-600 dark:text-red-400 leading-relaxed">
                {error}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => window.location.reload()} 
                className="h-12 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
              >
                Retry
              </button>
              <button
                onClick={() => navigate("/login")}
                className="h-12 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-all"
              >
                Login Page
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 flex flex-col items-center gap-3"
      >
        <div className="h-[1px] w-12 bg-gray-200 dark:bg-white/10" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600">
          Secure Authentication 
        </p>
      </motion.div>
    </div>
  );
};

export default SuccessGoogle;
