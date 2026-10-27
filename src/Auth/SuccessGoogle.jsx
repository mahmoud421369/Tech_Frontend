import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LazyMotion, domAnimation, MotionConfig, m, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiLoader, FiChevronRight } from "react-icons/fi";
import Cookies from "js-cookie";
import useAuthStore from "../common/store/Auth";
import queryClient from "../common/utils/queryClient";
import { parseAccessToken, redirectFor } from "../common/utils/authSession";
import { recoverGoogleSession } from "../common/utils/googleSession";

const PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  x: (i % 2 ? 1 : -1) * (40 + i * 5),
  y: (i < 3 ? -1 : 1) * (40 + i * 5),
}));

const REDIRECT_DELAY_MS = 1500;
const COOKIE_NAME = "client_access_token";

const MESSAGES = {
  missing: "No authentication token found. Please try logging in again.",
  expired: "Your Google sign-in has expired. Please sign in again.",
  failed: "Failed to finalize your session. Please try again.",
};

/* A readable handoff token (global or cookie), if the backend provides one. */
const findSession = () => {
  const candidates = [window.__INITIAL_DATA__?.access_token, Cookies.get(COOKIE_NAME)].filter(Boolean);
  for (const token of candidates) {
    const session = parseAccessToken(token);
    if (session) return { session, hadToken: true };
  }
  return { session: null, hadToken: candidates.length > 0 };
};

const clearHandoff = () => {
  Cookies.remove(COOKIE_NAME, { path: "/" });
  Cookies.remove(COOKIE_NAME);
  if (window.__INITIAL_DATA__) delete window.__INITIAL_DATA__.access_token;
};

const SuccessGoogle = () => {
  const navigate = useNavigate();
  const setUserData = useAuthStore((s) => s.setUserData);
  const [view, setView] = useState({ status: "verifying", error: null });
  const { status, error } = view;

  useEffect(() => {
    let cancelled = false;
    let timer;

    (async () => {
      let { session, hadToken } = findSession();

      if (session) {
        try {
          setUserData(session.token, session.roles, session.id, session.email);
          if (session.id != null) localStorage.setItem("id", session.id);
        } catch (err) {
          console.error("Auth Error:", err);
          if (!cancelled) setView({ status: "error", error: MESSAGES.failed });
          return;
        }
      } else {
        /* The cookies are HttpOnly, so JS cannot read them: ask the API to trade them for the token.
           This stores the session itself (same as the password login). */
        session = await recoverGoogleSession({ force: true });
        if (cancelled) return;
        if (!session) {
          setView({ status: "error", error: hadToken ? MESSAGES.expired : MESSAGES.missing });
          return;
        }
      }

      if (cancelled) return;
      const target = redirectFor(session.roles, "/");
      setView({ status: "success", error: null });
      timer = setTimeout(() => {
        clearHandoff();
        navigate(target, { replace: true });
      }, REDIRECT_DELAY_MS);
    })();

    return () => { cancelled = true; clearTimeout(timer); };
  }, [navigate, setUserData]);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-[#fafafa] dark:bg-gray-950 font-sans">

          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[radial-gradient(closest-side,rgba(99,102,241,0.14),transparent)] animate-pulse transform-gpu motion-reduce:animate-none" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-[radial-gradient(closest-side,rgba(59,130,246,0.14),transparent)] animate-pulse transform-gpu motion-reduce:animate-none" style={{ animationDelay: '1s' }} />
          </div>

          <AnimatePresence mode="wait">
            {status === "verifying" && (
              <m.div
                key="verifying"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="z-10 flex flex-col items-center text-center px-6"
              >
                <div className="relative mb-8" aria-hidden="true">
                  <div className="w-24 h-24 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center">
                    <FiLoader size={40} className="text-indigo-600 animate-spin motion-reduce:animate-none" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 rounded-full border-t-4 border-indigo-600 animate-[spin_1.5s_linear_infinite] motion-reduce:animate-none" />
                </div>

                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
                  Securely Signing In
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xs">
                  Establishing a secure connection with your account...
                </p>
              </m.div>
            )}

            {status === "success" && (
              <m.div
                key="success"
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="z-10 flex flex-col items-center text-center px-6"
              >
                <div className="relative mb-8">
                  <m.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                    className="w-28 h-28 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_20px_40px_-10px_rgba(16,185,129,0.4)]"
                  >
                    <FiCheckCircle size={56} aria-hidden="true" />
                  </m.div>

                  {PARTICLES.map((p, i) => (
                    <m.div
                      key={i}
                      aria-hidden="true"
                      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      animate={{ opacity: 1, scale: 1, x: p.x, y: p.y }}
                      className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-emerald-400/60"
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
                  <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse motion-reduce:animate-none flex items-center justify-center gap-2">
                    Redirecting you now <FiChevronRight aria-hidden="true" />
                  </p>
                </div>
              </m.div>
            )}

            {status === "error" && (
              <m.div
                key="error"
                role="alert"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="z-10 flex flex-col items-center max-w-sm w-full mx-auto p-8 rounded-[2.5rem] bg-white dark:bg-gray-900 shadow-2xl border border-red-100 dark:border-red-900/20"
              >
                <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                  <FiAlertCircle size={40} aria-hidden="true" />
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
                    type="button"
                    onClick={() => window.location.reload()}
                    className="h-12 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="h-12 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    Login Page
                  </button>
                </div>
              </m.div>
            )}
          </AnimatePresence>

          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-10 flex flex-col items-center gap-3"
          >
            <div className="h-[1px] w-12 bg-gray-200 dark:bg-white/10" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600">
              Secure Authentication
            </p>
          </m.div>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
};

/* kept for any file that still imports it from here; it is the shared app-wide client */
export { queryClient };
export default SuccessGoogle;