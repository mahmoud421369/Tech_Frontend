import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";

const SuccessGoogle = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Debug: Log all cookies (will exclude HttpOnly cookies)
    console.log("All cookies:", document.cookie);

    // Check for non-HttpOnly cookie
    const cookieToken = Cookies.get("client_access_token");
    console.log("client_access_token from Cookies.get:", cookieToken);

    // Check for server-rendered data
    const serverToken = window.__INITIAL_DATA__?.access_token;
    console.log("access_token from window.__INITIAL_DATA__:", serverToken);

    // Use token from cookie or server-rendered data
    const accessToken = cookieToken || serverToken;

    if (!accessToken) {
      setError(
        "Authentication failed: No accessible access token found. The access_token cookie is HttpOnly and cannot be read by JavaScript. Please ensure the backend sets a non-HttpOnly cookie (e.g., client_access_token) or provides the token in window.__INITIAL_DATA__.access_token."
      );
      setIsLoading(false);
      return;
    }

    try {
      // Store the access_token as authToken in localStorage
      localStorage.setItem("authToken", accessToken);

      // Simulate processing with a delay for UX
      const timer = setTimeout(() => {
        navigate("/", { replace: true }); // Replace history for cleaner navigation
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    } catch (err) {
      console.error("Error during authentication:", err);
      setError("Something went wrong while processing authentication.");
      setIsLoading(false);
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <AnimatePresence>
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6"
            role="status"
            aria-live="polite"
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 dark:border-indigo-400"></div>
              <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-2 border-indigo-200 dark:border-indigo-700 opacity-50"></div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Signing you in...
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Please wait while we authenticate your account.
            </p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4"
            role="alert"
            aria-live="assertive"
          >
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
              {error}
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()} // Retry by reloading
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors duration-200"
                aria-label="Retry authentication"
              >
                Retry
              </button>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 transition-colors duration-200"
                aria-label="Return to login page"
              >
                Back to Login
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.h2
            key="redirecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-semibold text-gray-900 dark:text-gray-100"
            aria-live="polite"
          >
            Redirecting...
          </motion.h2>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuccessGoogle;