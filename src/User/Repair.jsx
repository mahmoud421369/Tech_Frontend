import React, { useEffect, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import sanitizeHtml from "sanitize-html";
import {
  FaMobileAlt, FaLaptop, FaDesktop, FaTv,
  FaGamepad, FaTabletAlt, FaStar, FaStore, FaCheckCircle,
} from "react-icons/fa";
import { FiChevronRight, FiSmartphone, FiTool, FiChevronLeft } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { RiDeviceLine, RiMap2Line, RiStarLine } from "@remixicon/react";
import {
  RiCheckDoubleLine, RiCheckLine, RiCloseLine,
  RiPhoneLine, RiStore2Line, RiStarFill,
} from "react-icons/ri";




const WaveBottom = memo(({ darkMode }) => (
  <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-12 md:h-20" preserveAspectRatio="none">
      <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z"
        fill={darkMode ? "#111827" : "#f9fafb"} />
    </svg>
  </div>
));

const WaveTop = memo(({ darkMode }) => (
  <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-10 md:h-16" preserveAspectRatio="none">
      <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,0 L0,0 Z"
        fill={darkMode ? "#111827" : "#f9fafb"} />
    </svg>
  </div>
));



const StatCard = memo(({ icon, value, label, accent, delay, darkMode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.45, delay }}
    viewport={{ once: true }}
    whileHover={{ y: -4, scale: 1.02 }}
    className={`relative group overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg border transition-all duration-300 ${
      darkMode ? "bg-gray-800/80 border-gray-700/60 backdrop-blur-md" : "bg-white/90 border-gray-100 backdrop-blur-md"
    }`}
  >
    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
      style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>
        {icon}
      </div>
      <span className="text-lg sm:text-2xl font-extrabold tracking-tight" style={{ color: accent }}>{value}</span>
    </div>
    <p className={`text-[10px] sm:text-xs font-semibold leading-snug pl-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
  </motion.div>
));




const LoadingSpinner = memo(({ darkMode }) => (
  <div className="flex justify-center items-center h-48 sm:h-64">
    <div className={`w-10 h-10 sm:w-12 sm:h-12 border-4 ${darkMode ? "border-lime-400" : "border-lime-500"} border-t-transparent rounded-full animate-spin`} />
  </div>
));




const StepProgressBar = memo(({ step, darkMode }) => {
  const steps = [
    { label: "Describe", icon: <FiTool size={15} /> },
    { label: "Category", icon: <RiDeviceLine size={15} /> },
    { label: "Shop", icon: <FaStore size={13} /> },
  ];
  const progress = ((step - 1) / (steps.length - 1)) * 100;

  return (
    <div className={`max-w-2xl mx-auto my-6 sm:my-10 px-4 sm:px-6 py-6 sm:py-8 rounded-xl sm:rounded-2xl shadow-lg border ${
      darkMode ? "bg-gray-800/80 border-gray-700 backdrop-blur-md" : "bg-white border-gray-200"
    }`}>
      <div className="relative mb-5 sm:mb-6">
        <div className={`absolute top-5 sm:top-6 left-0 right-0 h-1.5 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        <motion.div
          className="absolute top-5 sm:top-6 left-0 h-1.5 rounded-full bg-gradient-to-r from-lime-500 to-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        <div className="relative flex justify-between">
          {steps.map((s, i) => {
            const isCompleted = step > i + 1;
            const isActive = step === i + 1;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 sm:gap-2">
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1, boxShadow: isActive ? "0 0 0 4px rgba(132,204,22,0.25)" : "none" }}
                  transition={{ duration: 0.3 }}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border-2 transition-all duration-300 ${
                    isCompleted ? "bg-gradient-to-br from-lime-500 to-emerald-500 border-transparent text-white shadow-lg"
                      : isActive ? "bg-white dark:bg-gray-900 border-lime-500 text-lime-600 dark:text-lime-400 shadow-lg"
                      : darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted ? <RiCheckLine size={16} className="text-white" /> : s.icon}
                </motion.div>
                <span className={`text-[10px] sm:text-xs font-bold transition-colors duration-300 ${
                  isCompleted || isActive ? "text-lime-600 dark:text-lime-400" : darkMode ? "text-gray-500" : "text-gray-400"
                }`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="text-center">
        <span className={`text-[10px] sm:text-xs font-semibold px-3 py-1 rounded-full ${
          darkMode ? "bg-lime-900/30 text-lime-400" : "bg-lime-50 text-lime-600"
        }`}>
          Step {step} of {steps.length} — {steps[step - 1].label}
        </span>
      </div>
    </div>
  );
});



const NavButtons = memo(({ onBack, onNext, nextLabel = "Continue", nextDisabled = false, isLoading = false, showBack = true, darkMode }) => (
  <div className={`flex gap-3 mt-8 sm:mt-12 ${showBack ? "justify-between" : "justify-center"} max-w-md mx-auto`}>
    {showBack && (
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onBack}
        className={`flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold text-sm border-2 transition-all duration-200 ${
          darkMode ? "border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white bg-gray-800"
            : "border-gray-200 text-gray-600 hover:border-gray-400 bg-white"
        }`}
      >
        <FiChevronLeft /> Back
      </motion.button>
    )}
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onNext}
      disabled={nextDisabled || isLoading}
      className="relative flex-1 sm:flex-none sm:px-10 py-3 sm:py-3.5 rounded-xl font-bold text-sm overflow-hidden flex items-center justify-center gap-2 group border-2 border-lime-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="absolute inset-0 bg-gradient-to-r from-lime-500 to-emerald-500 translate-y-full group-hover:translate-y-0 group-disabled:translate-y-full transition-transform duration-300 ease-out rounded-[10px]" />
      <span className={`relative z-10 transition-colors duration-300 ${
        nextDisabled ? darkMode ? "text-gray-500" : "text-gray-400"
          : "text-lime-600 dark:text-lime-400 group-hover:text-white"
      }`}>
        {isLoading ? "Sending..." : nextLabel}
      </span>
      {!isLoading && (
        <FiChevronRight className={`relative z-10 transition-colors duration-300 ${
          nextDisabled ? darkMode ? "text-gray-500" : "text-gray-400" : "text-lime-600 dark:text-lime-400 group-hover:text-white"
        }`} />
      )}
      {isLoading && <div className="relative z-10 w-4 h-4 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />}
    </motion.button>
  </div>
));




const SUGGESTIONS = ["Screen cracked", "Battery issue", "Not charging", "Overheating", "Software crash", "Water damage"];

const fallbackCategories = [
  { id: "1", name: "Phone" },
  { id: "2", name: "Laptop" },
  { id: "3", name: "Tablet" },
  { id: "4", name: "TV" },
  { id: "5", name: "Desktop" },
  { id: "6", name: "Gaming" },
];

const fallbackShops = [
  { id: 1, name: "TechFix Pro", rating: 4.8, shopAddress: { city: "Nasr City", state: "Cairo" }, phone: "+20 100 123 4567", shopType: "Mobile Repair", activate: true },
  { id: 2, name: "Mobile Clinic", rating: 4.7, shopAddress: { city: "Mohandessin", state: "Giza" }, phone: "+20 111 222 3334", shopType: "Laptop Repair", activate: true },
  { id: 3, name: "FixZone", rating: 4.9, shopAddress: { city: "Maadi", state: "Cairo" }, phone: "+20 155 789 0123", shopType: "All Devices", activate: true },
];

const getCategoryIcon = (name) => {
  const map = {
    Phone: <FiSmartphone className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
    Laptop: <FaLaptop className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
    Tablet: <FaTabletAlt className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
    TV: <FaTv className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
    Desktop: <FaDesktop className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
    Gaming: <FaGamepad className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />,
  };
  return map[name] || <RiDeviceLine className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />;
};





const RepairRequest = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);

  const bgCard = darkMode ? "bg-gray-800/90" : "bg-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";

  useEffect(() => { document.title = "Book Repair | Tech-Restore"; }, []);

  const sanitizeDescription = useCallback((input) =>
    sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim(), []);


  

  useEffect(() => {
    let cancelled = false;
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/api/categories", { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        const data = (res.data.content || res.data || []).map((cat) => ({ ...cat, icon: getCategoryIcon(cat.name) }));
        setCategories(data.length > 0 ? data : fallbackCategories.map(c => ({ ...c, icon: getCategoryIcon(c.name) })));
      } catch {
        if (!cancelled) setCategories(fallbackCategories.map(c => ({ ...c, icon: getCategoryIcon(c.name) })));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchCategories();
    return () => { cancelled = true; };
  }, [token]);

 
  

  useEffect(() => {
    if (step !== 3 || !selectedCategory) return;
    let cancelled = false;
    const fetchShops = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/api/users/shops/all", { headers: { Authorization: `Bearer ${token}` } });
        if (cancelled) return;
        const data = res.data.content || res.data || [];
        setShops(data.length > 0 ? data : fallbackShops);
      } catch {
        if (!cancelled) setShops(fallbackShops);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchShops();
    return () => { cancelled = true; };
  }, [step, selectedCategory, token]);

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (!description.trim()) {
        Swal.fire({ icon: "warning", title: "Description required", text: "Please describe what's wrong with your device", confirmButtonColor: "#84cc16" });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedCategory) {
        Swal.fire({ icon: "warning", title: "Select Device Type", confirmButtonColor: "#84cc16" });
        return;
      }
      setStep(3);
    }
  }, [step, description, selectedCategory]);

  const handleBack = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);

  const sendRepairRequest = useCallback(async () => {
    if (!selectedShop) return;
    setIsLoading(true);
    setSubmitProgress(0);
    const duration = 2000;
    const interval = 80;
    let progress = 0;
    const timer = setInterval(() => {
      progress += (interval / duration) * 100;
      setSubmitProgress(Math.min(100, progress));
      if (progress >= 100) clearInterval(timer);
    }, interval);
    try {
      await api.post(
        `/api/users/repair-request/${selectedShop.id}`,
        { description: sanitizeDescription(description), deviceCategory: selectedCategory.id },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      await new Promise((r) => setTimeout(r, duration));
      clearInterval(timer);
      setSubmitProgress(100);
      Swal.fire({
        icon: "success",
        title: "Request Sent!",
        html: `<p>Sent to <strong>${selectedShop.name}</strong><br><small>${selectedShop.shopAddress?.city || "Cairo"}</small></p>`,
        confirmButtonText: "View My Requests",
        cancelButtonText: "New Request",
        showCancelButton: true,
        confirmButtonColor: "#84cc16",
      }).then((result) => {
        if (result.isConfirmed) navigate("/account");
        else { setStep(1); setSelectedCategory(null); setSelectedShop(null); setDescription(""); setSubmitProgress(0); }
      });
    } catch (err) {
      clearInterval(timer);
      setSubmitProgress(0);
      Swal.fire({ icon: "error", title: "Failed to Send", toast: true, position: "top-end", text: err.response?.data?.message || "Something went wrong.", confirmButtonColor: "#ef4444" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedShop, description, selectedCategory, token, sanitizeDescription, navigate]);

  const heroStats = [
    { icon: <FiTool size={16} />, value: "75.2%", label: "Repair success rate", accent: "#16a34a", delay: 0.1 },
    { icon: <RiCheckLine size={16} />, value: "~20k", label: "Monthly repairs", accent: "#6366f1", delay: 0.2 },
    { icon: <RiStarFill size={16} />, value: "4.5★", label: "Avg user rating", accent: "#f59e0b", delay: 0.3 },
  ];

  return (
    <div className={`min-h-screen overflow-x-hidden ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

    
    
      <section className={`relative overflow-hidden pt-16 sm:pt-20 pb-24 sm:pb-32 md:pb-40 ${
        darkMode ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
          : "bg-gradient-to-br from-lime-50 via-white to-emerald-50"
      }`}>
        
        

        <div className="absolute w-72 h-72 sm:w-[500px] sm:h-[500px] -top-32 -left-20 rounded-full blur-3xl opacity-20 bg-lime-400 animate-pulse pointer-events-none" style={{ animationDuration: "5s" }} />
        <div className="absolute w-56 h-56 sm:w-[400px] sm:h-[400px] top-10 -right-16 rounded-full blur-3xl opacity-15 bg-emerald-500 animate-pulse pointer-events-none" style={{ animationDuration: "7s" }} />
     
     
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 39px,#000 39px,#000 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,#000 39px,#000 40px)" }} />
        <WaveTop darkMode={darkMode} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
           
           
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 mt-4 px-3 sm:px-4 py-1.5 rounded-full border text-xs sm:text-sm font-semibold bg-lime-500/10 border-lime-500/30 text-lime-600 dark:text-lime-400">
                <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping flex-shrink-0" />
                Expert technicians ready now
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08]">
                <span className="bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">Put Your</span>
                <br /><span className={darkMode ? "text-white" : "text-gray-900"}>Device</span>
                <br /><span style={{ WebkitTextStroke: darkMode ? "2px #84cc16" : "2px #16a34a", color: "transparent" }}>First</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className={`text-base sm:text-lg lg:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Fast, reliable repairs from trusted local shops. Describe your issue and get connected instantly.
              </motion.p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 pt-1">
                {heroStats.map((s) => <StatCard key={s.label} {...s} darkMode={darkMode} />)}
              </div>
            </div>

           
           
            <div className="relative h-56 sm:h-80 lg:h-[520px] hidden sm:block">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-125" />
              <div className="relative w-full h-full">
                <motion.div initial={{ opacity: 0, rotate: 8, y: 20 }} animate={{ opacity: 1, rotate: 12, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} whileHover={{ rotate: 4, scale: 1.04 }}
                  className={`absolute top-8 left-6 w-36 sm:w-48 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="h-1 bg-gradient-to-r from-lime-400 to-emerald-500" />
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div className={`h-2.5 rounded w-16 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className={`h-2.5 rounded w-24 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                    <div className="h-7 bg-gradient-to-r from-lime-500 to-emerald-500 rounded-lg w-14" />
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} whileHover={{ scale: 1.07, y: -4 }}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-32 sm:w-40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="h-1 bg-gradient-to-r from-lime-500 to-emerald-500" />
                  <div className="p-3 sm:p-4 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-lime-500 to-emerald-600 rounded-xl sm:rounded-2xl mx-auto mb-2 sm:mb-3 flex items-center justify-center shadow-lg">
                      <FaStore className="text-white text-xl sm:text-2xl" />
                    </div>
                    <span className="text-xs font-bold text-lime-500">Trusted ✓</span>
                  </div>
                </motion.div>
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/4 right-4 z-20 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-xs font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-xl">
                  🔧 3-Step Booking
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        <WaveBottom darkMode={darkMode} />
      </section>

      
      
      <div className="px-4 sm:px-6">
        <StepProgressBar step={step} darkMode={darkMode} />
      </div>

     
     
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-16 sm:pb-20">
        <AnimatePresence mode="wait">

         
         
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              <h2 className={`text-2xl sm:text-3xl font-extrabold text-center mb-2 sm:mb-3 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
                Describe the Problem
              </h2>
              <p className={`text-center text-xs sm:text-sm mb-6 sm:mb-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Be as specific as possible — this helps shops give accurate quotes
              </p>
              <div className="max-w-2xl mx-auto">
                <div className={`relative rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${
                  description.trim() ? "border-lime-500 shadow-lg shadow-lime-500/10" : darkMode ? "border-gray-700" : "border-gray-200"
                } ${bgCard}`}>
                  <textarea
                    className={`w-full px-4 sm:px-6 py-4 sm:py-5 bg-transparent rounded-xl sm:rounded-2xl dark:text-white focus:outline-none resize-none min-h-[140px] sm:min-h-[180px] text-sm sm:text-base`}
                    placeholder="e.g., Screen cracked, battery draining fast, not charging, overheating..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={1000}
                  />
                  <div className={`flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 border-t ${border}`}>
                    <span className={`text-[10px] sm:text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                      Tip: include device model if possible
                    </span>
                    <span className={`text-[10px] sm:text-xs font-semibold ${description.length > 900 ? "text-orange-500" : darkMode ? "text-gray-500" : "text-gray-400"}`}>
                      {description.length} / 1000
                    </span>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => setDescription((prev) => prev ? `${prev}, ${s.toLowerCase()}` : s)}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border transition-all ${
                        darkMode ? "border-gray-700 text-gray-400 hover:border-lime-500 hover:text-lime-400"
                          : "border-gray-200 text-gray-500 hover:border-lime-500 hover:text-lime-600"
                      }`}>
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
              <NavButtons onNext={handleNext} nextDisabled={!description.trim()} showBack={false} darkMode={darkMode} />
            </motion.div>
          )}

          
          
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              <h2 className={`text-2xl sm:text-3xl font-extrabold text-center mb-2 sm:mb-3 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
                Select Device Type
              </h2>
              <p className={`text-center text-xs sm:text-sm mb-6 sm:mb-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Choose the category that best matches your device
              </p>
              {isLoading ? <LoadingSpinner darkMode={darkMode} /> : (
                <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 mt-4 sm:mt-6">
                  {categories.map((cat) => (
                    <motion.div key={cat.id} whileHover={{ y: -5, scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedCategory(cat)}
                      className={`group cursor-pointer rounded-xl sm:rounded-2xl flex flex-col justify-center items-center p-3 sm:p-5 lg:p-6 shadow-md transition-all duration-300 border-2 ${
                        selectedCategory?.id === cat.id
                          ? "bg-gradient-to-br from-lime-500 to-emerald-600 text-white border-lime-400 shadow-lime-500/30 shadow-xl"
                          : `${bgCard} ${darkMode ? "border-gray-700 hover:border-lime-500" : "border-gray-200 hover:border-lime-400"}`
                      }`}>
                      <div className={`mb-2 sm:mb-4 transition-transform duration-300 group-hover:scale-110 ${
                        selectedCategory?.id === cat.id ? "text-white" : "text-lime-600 dark:text-lime-400"
                      }`}>
                        {cat.icon}
                      </div>
                      <p className={`text-center text-[10px] sm:text-xs lg:text-sm font-bold ${
                        selectedCategory?.id === cat.id ? "text-white" : textPrimary
                      }`}>
                        {cat.name}
                      </p>
                      {selectedCategory?.id === cat.id && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="mt-1 sm:mt-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/30 flex items-center justify-center">
                          <RiCheckLine className="text-white text-xs" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
              <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!selectedCategory} darkMode={darkMode} />
            </motion.div>
          )}

          
          
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              <h2 className={`text-2xl sm:text-3xl font-extrabold text-center mb-2 sm:mb-3 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
                Choose Your Repair Shop
              </h2>
              <p className={`text-center text-xs sm:text-sm mb-6 sm:mb-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Select the shop you'd like to send your repair request to
              </p>
              {isLoading ? <LoadingSpinner darkMode={darkMode} /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {shops.map((shop) => (
                    <motion.div key={shop.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedShop(shop)}
                      className={`group p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-md cursor-pointer transition-all duration-300 border-2 ${
                        selectedShop?.id === shop.id
                          ? "bg-gradient-to-br from-lime-500 to-emerald-600 text-white border-lime-400 shadow-lime-500/30 shadow-xl"
                          : `${bgCard} ${darkMode ? "border-gray-700 hover:border-lime-500" : "border-gray-200 hover:border-lime-400"}`
                      }`}>
                     
                     
                      <div className="flex items-start justify-between mb-4 sm:mb-5">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0 ${
                            selectedShop?.id === shop.id ? "bg-white/20" : "bg-lime-100 dark:bg-lime-900/30"
                          }`}>
                            <FaStore className={`text-base sm:text-xl ${selectedShop?.id === shop.id ? "text-white" : "text-lime-600 dark:text-lime-400"}`} />
                          </div>
                          <h3 className={`text-sm sm:text-lg font-bold truncate ${selectedShop?.id === shop.id ? "text-white" : textPrimary}`}>
                            {shop.name}
                          </h3>
                        </div>
                        <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl flex-shrink-0 ml-1 ${
                          selectedShop?.id === shop.id ? "bg-white/20" : darkMode ? "bg-gray-700" : "bg-gray-100"
                        }`}>
                          <FaStar className="text-amber-400 text-xs sm:text-sm" />
                          <span className={`text-xs sm:text-sm font-bold ${selectedShop?.id === shop.id ? "text-white" : textPrimary}`}>
                            {shop.rating ? shop.rating.toFixed(1) : "New"}
                          </span>
                        </div>
                      </div>

                    
                    
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                        {[
                          { icon: <RiPhoneLine />, label: "Phone", value: shop.phone || "N/A" },
                          { icon: <RiStore2Line />, label: "Type", value: shop.shopType || "General" },
                          {
                            icon: shop.activate ? <RiCheckDoubleLine /> : <RiCloseLine />,
                            label: "Status",
                            value: shop.activate ? "Active" : "Inactive",
                            valueClass: shop.activate
                              ? selectedShop?.id === shop.id ? "text-lime-100" : "text-green-600 dark:text-green-400"
                              : "text-red-500",
                          },
                          {
                            icon: <RiMap2Line />,
                            label: "City",
                            value: shop.shopAddress?.city ? `${shop.shopAddress.city}, ${shop.shopAddress.state || "EG"}` : "N/A",
                          },
                        ].map(({ icon, label, value, valueClass }) => (
                          <div key={label} className={`flex items-start gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${
                            selectedShop?.id === shop.id ? "bg-white/10" : darkMode ? "bg-gray-700/50" : "bg-gray-50"
                          }`}>
                            <span className={`mt-0.5 flex-shrink-0 text-sm ${selectedShop?.id === shop.id ? "text-lime-200" : "text-lime-600 dark:text-lime-400"}`}>{icon}</span>
                            <div className="min-w-0">
                              <p className={`text-[9px] sm:text-[10px] uppercase tracking-wide font-semibold mb-0.5 ${
                                selectedShop?.id === shop.id ? "text-lime-200/70" : darkMode ? "text-gray-500" : "text-gray-400"
                              }`}>{label}</p>
                              <p className={`text-[10px] sm:text-xs font-semibold truncate ${
                                valueClass || (selectedShop?.id === shop.id ? "text-white" : textPrimary)
                              }`}>{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedShop?.id === shop.id && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-center gap-2 bg-white/20 rounded-lg sm:rounded-xl py-2">
                          <RiCheckLine className="text-white" />
                          <span className="text-white text-xs font-bold">Selected</span>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              <NavButtons onBack={handleBack} onNext={sendRepairRequest} nextLabel="Send Repair Request"
                nextDisabled={!selectedShop} isLoading={isLoading} darkMode={darkMode} />

              
              
              {isLoading && submitProgress > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto mt-6 sm:mt-8">
                  <div className={`w-full rounded-full h-2.5 overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-lime-500 to-emerald-500"
                      initial={{ width: 0 }} animate={{ width: `${submitProgress}%` }} transition={{ duration: 0.2 }} />
                  </div>
                  <p className={`text-center text-xs mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Processing... {Math.round(submitProgress)}%
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default RepairRequest;