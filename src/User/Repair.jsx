import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import sanitizeHtml from "sanitize-html";
import {
  FaMobileAlt,
  FaLaptop,
  FaDesktop,
  FaTv,
  FaGamepad,
  FaTabletAlt,
  FaStar,
  FaStore,
  FaPhone,
} from "react-icons/fa";
import { FiChevronRight, FiSmartphone, FiMapPin, FiPhone as FiPhoneIcon, FiTool } from "react-icons/fi";
import api from "../api";

const LoadingSpinner = ({ darkMode }) => (
  <div className="flex justify-center items-center h-64">
    <div
      className={`w-12 h-12 border-4 ${
        darkMode ? "border-lime-400" : "border-lime-500"
      } border-t-transparent rounded-full animate-spin`}
    ></div>
  </div>
);

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

  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-400" : "text-gray-600";
  const bgCard = darkMode ? "bg-gray-800/90" : "bg-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  useEffect(() => {
    document.title = "Request Repair | TechRestore";
  }, []);

  const sanitizeDescription = (input) =>
    sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim();

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/api/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (res.data.content || res.data || []).map((cat) => ({
          ...cat,
          icon: getCategoryIcon(cat.name),
        }));
        setCategories(data.length > 0 ? data : fallbackCategories);
      } catch (err) {
        setCategories(fallbackCategories);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [token]);

  useEffect(() => {
    if (!selectedCategory || step !== 2) return;

    const fetchShops = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/api/users/shops/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data.content || res.data || [];
        setShops(data.length > 0 ? data : fallbackShops);
      } catch (err) {
        setShops(fallbackShops);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShops();
  }, [selectedCategory, step, token]);

  const getCategoryIcon = (name) => {
    const map = {
      Phone: <FiSmartphone className="w-12 h-12" />,
      Laptop: <FaLaptop className="w-12 h-12" />,
      Tablet: <FaTabletAlt className="w-12 h-12" />,
      TV: <FaTv className="w-12 h-12" />,
      Desktop: <FaDesktop className="w-12 h-12" />,
      Gaming: <FaGamepad className="w-12 h-12" />,
    };
    return map[name] || <FaMobileAlt className="w-12 h-12" />;
  };

  const fallbackCategories = [
    { id: "1", name: "Phone", icon: <FiSmartphone className="w-12 h-12" /> },
    { id: "2", name: "Laptop", icon: <FaLaptop className="w-12 h-12" /> },
    { id: "3", name: "Tablet", icon: <FaTabletAlt className="w-12 h-12" /> },
    { id: "4", name: "TV", icon: <FaTv className="w-12 h-12" /> },
    { id: "5", name: "Desktop", icon: <FaDesktop className="w-12 h-12" /> },
    { id: "6", name: "Gaming", icon: <FaGamepad className="w-12 h-12" /> },
  ];

  const fallbackShops = [
    { id: 1, name: "TechFix Pro", rating: 4.8, shopAddress: { city: "Nasr City", state: "Cairo" }, phone: "+20 100 123 4567" },
    { id: 2, name: "Mobile Clinic", rating: 4.7, shopAddress: { city: "Mohandessin", state: "Giza" }, phone: "+20 111 222 3334" },
    { id: 3, name: "FixZone", rating: 4.9, shopAddress: { city: "Maadi", state: "Cairo" }, phone: "+20 155 789 0123" },
  ];

  const sendRepairRequest = async () => {
    if (!description.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Description",
        text: "Please describe what's wrong with your device",
        confirmButtonColor: "#84cc16",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        description: sanitizeDescription(description),
        deviceCategory: selectedCategory.id,
      };

      await api.post(`/api/users/repair-request/${selectedShop.id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      Swal.fire({
        icon: "success",
        title: "Request Sent Successfully!",
        html: `
          <div class="text-center space-y-3">
            <p>Your repair request has been sent to:</p>
            <div class="bg-lime-100 dark:bg-lime-900/50 rounded-xl p-4 inline-block">
              <p class="font-bold text-lg">${selectedShop.name}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">${selectedShop.shopAddress?.city || "Cairo"}</p>
            </div>
            <p class="text-sm">They will contact you soon with a quote</p>
          </div>
        `,
        confirmButtonText: "View My Requests",
        cancelButtonText: "New Request",
        showCancelButton: true,
        confirmButtonColor: "#84cc16",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/account");
        } else {
          setStep(1);
          setSelectedCategory(null);
          setSelectedShop(null);
          setDescription("");
        }
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Send",
        toast:true,
        position:"top-end",
        text: err.response?.data?.message || "Something went wrong. Try again.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !selectedCategory) {
      Swal.fire({ icon: "warning", title: "Select Device Type", confirmButtonColor: "#84cc16" });
      return;
    }
    if (step === 2 && !selectedShop) {
      Swal.fire({ icon: "warning", title: "Select a Shop", confirmButtonColor: "#84cc16" });
      return;
    }
    if (step === 2) {
      sendRepairRequest();
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(Math.max(1, step - 1));

  return (
    <div className={`min-h-screen overflow-hidden ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-20`}>
      <section className={`py-16 lg:py-24 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-lime-500 to-emerald-600 bg-clip-text text-transparent">
                Put Your Device First
              </h1>
              <p className={`mt-6 text-xl ${textSecondary} max-w-2xl mx-auto lg:mx-0`}>
                Fast, reliable repairs from trusted local shops. Describe your issue and get connected instantly.
              </p>

              <div className="mt-12 grid grid-cols-2 gap-8">
                <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-center shadow-lg">
                  <h3 className={`text-2xl px-3 py-2 font-bold bg-emerald-50 text-emerald-600 rounded-3xl dark:bg-gray-950 dark:text-lime-400 flex items-center justify-center gap-2 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>75.2%</h3>
                  <p className={`text-sm mt-2 ${textSecondary}`}>Average repair success rate</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-center shadow-lg">
                  <h3 className={`text-2xl px-3 py-2 font-bold bg-emerald-50 text-emerald-600 rounded-3xl dark:bg-gray-950 dark:text-lime-400 flex items-center justify-center gap-2 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>~20k</h3>
                  <p className={`text-sm mt-2 ${textSecondary}`}>Repairs completed monthly</p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center lg:justify-start gap-2">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={i < 4 ? "text-yellow-500" : "text-gray-400"}
                    size={24}
                  />
                ))}
                <span className={`ml-3 text-lg ${textSecondary}`}>4.5 Average rating</span>
              </div>
            </div>

            <div className="relative h-96 lg:h-[600px] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-150" />

              <div className="relative w-full h-full">
                <div className="absolute top-10 left-10 w-48 h-64 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl rotate-12 hover:rotate-6 transition-transform duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-8 bg-lime-500 rounded w-16"></div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="w-8 h-8 bg-lime-500 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-10 right-10 w-56 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl -rotate-6 hover:-rotate-3 transition-transform duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      <div className="w-10 h-10 bg-lime-500 rounded-full flex items-center justify-center">
                        <FiTool className="text-white text-lg" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                      <div className="h-3 bg-lime-500 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-10 hover:scale-110 transition-all duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="p-4">
                    <div className="w-16 h-16 bg-lime-500 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                      <FaStore className="text-white text-2xl" />
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={`flex justify-center items-center my-12 max-w-2xl mx-auto p-6 rounded-2xl shadow-lg ${bgCard}`}>
        {["Device Type", "Select Shop"].map((s, i) => (
          <div key={i} className="flex-1 text-center relative">
            <div
              className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center text-xl font-bold shadow-md transition-all ${
                step >= i + 1
                  ? "bg-lime-600 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-600"
              }`}
            >
              {i + 1}
            </div>
            <p className={`text-sm mt-3 font-semibold ${step >= i + 1 ? "text-lime-600 dark:text-lime-400" : textSecondary}`}>
              {s}
            </p>
            {i < 1 && (
              <div
                className={`absolute top-7 left-1/2 w-full h-1 ${step > i + 1 ? "bg-lime-600" : "bg-gray-300 dark:bg-gray-700"}`}
                style={{ transform: "translateX(50%)" }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {step === 1 && (
          <div>
            <h2 className={`text-3xl font-bold text-center mb-8 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
              Step 1: Select Device Type
            </h2>

            <label className={`block font-semibold mb-3 text-center ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
              Describe the Problem
            </label>
            <textarea
              className={`w-full max-w-2xl mx-auto block dark:text-white px-6 py-4 rounded-2xl ${bgCard} border ${border} focus:ring-4 focus:ring-lime-500/50 focus:outline-none transition resize-none`}
              rows="5"
              placeholder="e.g., Screen cracked, battery draining fast, not charging..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />

            {isLoading ? (
              <LoadingSpinner darkMode={darkMode} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 mt-12">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`group cursor-pointer rounded-3xl flex flex-col justify-center items-center p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 ${
                      selectedCategory?.id === cat.id
                        ? "bg-gradient-to-br from-lime-500 to-emerald-600 text-white ring-4 ring-lime-400"
                        : `${bgCard} border ${border}`
                    }`}
                  >
                    <div className={`mx-auto mb-6 transition-transform group-hover:scale-110 ${selectedCategory?.id === cat.id ? "text-white" : "text-lime-600 dark:text-lime-400"}`}>
                      {cat.icon}
                    </div>
                    <p className={`text-center text-xl font-bold ${selectedCategory?.id === cat.id ? "text-white" : textPrimary}`}>
                      {cat.name}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <button
                onClick={() => selectedCategory && setStep(2)}
                disabled={!selectedCategory}
                className="px-10 py-4 bg-lime-600 text-white font-bold rounded-full hover:bg-lime-700 transition shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Shop Selection <FiChevronRight className="inline ml-2" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className={`text-3xl font-bold text-center mb-8 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
              Step 2: Choose Your Repair Shop
            </h2>

            {isLoading ? (
              <LoadingSpinner darkMode={darkMode} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    onClick={() => setSelectedShop(shop)}
                    className={`p-8 rounded-3xl shadow-xl cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 ${
                      selectedShop?.id === shop.id
                        ? "bg-gradient-to-br from-lime-500 to-emerald-600 text-white ring-4 ring-lime-400"
                        : `${bgCard} border ${border}`
                    }`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <h3 className={`text-2xl font-bold flex items-center gap-3 ${selectedShop?.id === shop.id ? "text-white" : textPrimary}`}>
                        <FaStore /> {shop.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        <FaStar className="text-yellow-500" />
                        <span className={selectedShop?.id === shop.id ? "text-white" : textSecondary}>
                          {shop.rating || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className={`space-y-4 text-lg ${selectedShop?.id === shop.id ? "text-lime-100" : textSecondary}`}>
                      <p className="flex items-center gap-3">
                        <FiMapPin /> {shop.shopAddress?.city}, {shop.shopAddress?.state || "Egypt"}
                      </p>
                      <p className="flex items-center gap-3">
                        <FiPhoneIcon /> {shop.phone}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-12 flex justify-between max-w-2xl mx-auto">
              <button
                onClick={handleBack}
                className="px-8 py-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedShop || isLoading}
                className="px-10 py-4 bg-lime-600 text-white font-bold rounded-full hover:bg-lime-700 transition shadow-xl disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send Repair Request"} <FiChevronRight className="inline ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairRequest;