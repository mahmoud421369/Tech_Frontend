import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import debounce from "lodash/debounce";
import sanitizeHtml from "sanitize-html";
import {
  FaMobileAlt,
  FaLaptop,
  FaDesktop,
  FaTv,
  FaGamepad,
  FaTabletAlt,
  FaArrowAltCircleRight,
  FaClock,
  FaMapMarkedAlt,
  FaCheckCircle,
  FaTimes,
  FaInfoCircle,
  FaPhone,
  FaStar,
  FaSearch,
  FaArrowLeft,
  FaSpinner,
  FaStore,
  FaTruck,
  FaDollarSign,
  FaWrench,
  FaTools,
  FaCog,
  FaHeadset,
} from "react-icons/fa";
import { FiChevronLeft, FiChevronRight, FiList, FiMonitor, FiTool, FiSmartphone } from "react-icons/fi";
import api from "../api";
import { RiCarLine, RiMotorbikeLine } from "react-icons/ri";

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
  const [addressSearch, setAddressSearch] = useState("");
  const [step, setStep] = useState(1);
  const [shops, setShops] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [description, setDescription] = useState("");
  const [requestStatus, setRequestStatus] = useState(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [repairRequestId, setRepairRequestId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [price, setPrice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const shopsPerPage = 6;

  const deliveryOptions = [
    { id: 1, name: "Home Delivery", description: "Pickup & delivery", apiValue: "HOME_DELIVERY", icon: <FaTruck /> },
    { id: 2, name: "Drop Off", description: "Bring device to shop", apiValue: "SHOP_VISIT", icon: <FaStore /> },
    { id: 3, name: "Courier Service", description: "Courier pickup", apiValue: "PICKUP", icon: <RiCarLine /> },
  ];

  const paymentOptions = [
    { id: 1, name: "Cash on Delivery", desc: "Pay when repaired", apiValue: "CASH", icon: <FaDollarSign /> },
    { id: 2, name: "Credit Card", desc: "Pay securely online", apiValue: "CREDIT_CARD", icon: <FaDollarSign /> },
  ];

  const debouncedSetAddressSearch = useMemo(() => debounce((value) => setAddressSearch(value), 300), []);
  const filteredAddresses = useMemo(
    () =>
      addresses.filter((addr) =>
        `${addr.street} ${addr.city} ${addr.state}`.toLowerCase().includes(addressSearch.toLowerCase())
      ),
    [addresses, addressSearch]
  );

  const indexOfLastShop = currentPage * shopsPerPage;
  const indexOfFirstShop = indexOfLastShop - shopsPerPage;
  const currentShops = useMemo(() => shops.slice(indexOfFirstShop, indexOfLastShop), [shops, indexOfFirstShop, indexOfLastShop]);
  const totalPages = Math.ceil(shops.length / shopsPerPage);

  const sanitizeDescription = (input) => sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim();

  // ────── FETCH CATEGORIES ──────
  useEffect(() => {
    const controller = new AbortController();
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/api/categories", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = res.data.content || res.data || [];
        setCategories(
          data.map((cat) => ({
            ...cat,
            color: darkMode ? "text-lime-400" : "text-lime-600",
            icon: getCategoryIcon(cat.name),
          }))
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Categories not loaded, using fallback");
          setCategories(getFallbackCategories(darkMode));
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchCategories();
    } else {
      setCategories(getFallbackCategories(darkMode));
    }

    return () => controller.abort();
  }, [token, darkMode]);

  // ────── FETCH SHOPS BY CATEGORY ──────
  useEffect(() => {
    if (!selectedCategory || step !== 2) return;

    const controller = new AbortController();
    const fetchShops = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/api/shops/category/${selectedCategory.id}`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data.content || res.data || [];
        setShops(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Shops not loaded, using fallback");
          setShops(getFallbackShops());
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchShops();
    return () => controller.abort();
  }, [selectedCategory, step, token]);

  const getCategoryIcon = (name) => {
    const icons = {
      Phone: <FiSmartphone />,
      Laptop: <FaLaptop />,
      Tablet: <FaTabletAlt />,
      TV: <FaTv />,
      Desktop: <FaDesktop />,
      Gaming: <FaGamepad />,
      default: <FaMobileAlt />,
    };
    return icons[name] || icons.default;
  };

  const getFallbackCategories = (darkMode) => [
    { id: "1", name: "Phone", color: darkMode ? "text-lime-400" : "text-lime-600", icon: <FiSmartphone /> },
    { id: "2", name: "Laptop", color: darkMode ? "text-lime-400" : "text-lime-600", icon: <FaLaptop /> },
    { id: "3", name: "Tablet", color: darkMode ? "text-lime-400" : "text-lime-600", icon: <FaTabletAlt /> },
    { id: "4", name: "TV", color: darkMode ? "text-lime-400" : "text-lime-600", icon: <FaTv /> },
    { id: "5", name: "Desktop", color: darkMode ? "text-lime-400" : "text-lime-600", icon: <FaDesktop /> },
    { id: "6", name: "Gaming", color: darkMode ? "text-lime-400" : "text-lime-600", icon: <FaGamepad /> },
  ];

  const getFallbackShops = () => [
    { id: 1, name: "TechFix Pro", rating: 4.8, address: "123 Nile St, Cairo", phone: "+20 123 456 7890" },
    { id: 2, name: "FixIt Fast", rating: 4.6, address: "456 Giza Rd, Giza", phone: "+20 987 654 3210" },
    { id: 3, name: "Device Care", rating: 4.9, address: "789 Alexandria St", phone: "+20 111 222 3334" },
  ];

  const textPrimary = darkMode ? "text-gray-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-gray-300" : "text-gray-600";
  const bgCard = darkMode ? "bg-gray-800" : "bg-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  const steps = useMemo(() => {
    const base = ["Device Type", "Select Shop"];
    return requestStatus === "QUOTE_SENT" ? [...base, "Delivery & Address", "Payment Method"] : base;
  }, [requestStatus]);

  const handleNext = () => {
    if (step === 1 && !selectedCategory) {
      Swal.fire({
        icon: "warning",
        title: "Select a Category",
        text: "Please choose a device type to continue",
        confirmButtonColor: "#84cc16",
      });
      return;
    }
    if (step === 2 && !selectedShop) {
      Swal.fire({
        icon: "warning",
        title: "Select a Shop",
        text: "Please choose a repair shop",
        confirmButtonColor: "#84cc16",
      });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(Math.max(1, step - 1));
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-32">
        <div
          className={`absolute inset-0 ${
            darkMode
              ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700"
              : "bg-gradient-to-br from-white via-lime-50 to-gray-100"
          }`}
        />

        {/* Wave */}
        <svg
          className="absolute bottom-0 w-full h-48"
          preserveAspectRatio="none"
          viewBox="0 0 1440 320"
          aria-hidden="true"
        >
          <path
            fill={darkMode ? "#1f2937" : "#f3f4f6"}
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FiSmartphone className={`absolute top-16 left-12 w-14 h-14 ${darkMode ? "text-lime-400" : "text-lime-600"} animate-float-slow opacity-70`} />
          <FaWrench className={`absolute top-24 right-16 w-12 h-12 ${darkMode ? "text-lime-500" : "text-lime-700"} animate-float-medium opacity-60`} />
          <FaTools className={`absolute bottom-32 left-20 w-10 h-10 ${darkMode ? "text-gray-400" : "text-gray-700"} animate-float-fast opacity-60`} />
          <FiMonitor className={`absolute bottom-24 right-20 w-16 h-16 ${darkMode ? "text-lime-400" : "text-lime-600"} animate-float-slow opacity-70`} />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center z-10">
          {/* Left: Text */}
          <div>
            <h1 className={`text-5xl sm:text-6xl font-extrabold drop-shadow-md ${darkMode ? "text-lime-400" : "text-lime-700"}`}>
              Put your device first
            </h1>
            <p className={`mt-6 text-xl max-w-xl ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Fast, user-friendly and engaging - turn your repair request into a seamless experience with your trusted local shop.
            </p>

            {/* CTA */}
            {/* <div className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md">
              <button className="px-6 py-3 bg-lime-600 text-white font-semibold rounded-full hover:bg-lime-700 transition shadow-lg">
                Book a Repair
              </button>
            </div> */}

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 gap-8 text-center">
              <div>
                <h3 className={`text-4xl font-bold ${darkMode ? "text-lime-400" : "text-lime-600"}`}>75.2%</h3>
                <p className={`text-sm ${textSecondary}`}>Average repair success rate</p>
              </div>
              <div>
                <h3 className={`text-4xl font-bold ${darkMode ? "text-lime-400" : "text-lime-600"}`}>~20k</h3>
                <p className={`text-sm ${textSecondary}`}>Repairs completed monthly</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={i < 4 ? (darkMode ? "text-lime-400" : "text-lime-600") : "text-gray-400"}
                />
              ))}
              <span className={`ml-2 text-sm ${textSecondary}`}>4.5 Average user rating</span>
            </div>
          </div>

          {/* Right: 3D Animation */}
          <div className="relative h-96 lg:h-full flex justify-center items-center">
            <div className="relative w-80 h-96 perspective-1000">
              <div
                className="absolute top-12 left-16 w-48 h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-3xl shadow-2xl transform rotate-y-12 rotate-x-6 animate-float-3d border border-gray-300 dark:border-gray-600"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="p-6 h-full flex flex-col justify-between" style={{ transform: "translateZ(20px)" }}>
                  <div>
                    <div className="bg-gray-300 dark:bg-gray-600 h-6 rounded mb-3 w-3/4"></div>
                    <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-full mb-2"></div>
                    <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-2/3"></div>
                  </div>
                  <div className="bg-lime-500 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                    Repair Now
                  </div>
                </div>
              </div>

              <div
                className="absolute bottom-10 right-10 w-56 h-44 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl transform rotate-y--15 rotate-x-8 animate-float-3d-delay border border-gray-200 dark:border-gray-700"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="p-5" style={{ transform: "translateZ(15px)" }}>
                  <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-4/5"></div>
                </div>
              </div>

              <div
                className="absolute top-32 left-4 w-32 h-28 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform rotate-y-20 rotate-x-10 animate-float-3d-fast border-2 border-lime-500"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="p-4 text-center" style={{ transform: "translateZ(10px)" }}>
                  <FaCheckCircle className="text-lime-600 text-3xl mx-auto mb-1" />
                  <p className="text-sm font-bold text-lime-600">Fixed!</p>
                </div>
              </div>

              <div className="absolute top-20 right-20 w-12 h-12 animate-spin-slow opacity-70">
                <FaWrench className="text-lime-500 text-5xl" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS INDICATOR */}
      <div className={`flex justify-center items-center mb-12 max-w-5xl mx-auto mt-10 p-6 rounded-2xl shadow-md ${bgCard}`}>
        {steps.map((s, i) => (
          <div key={i} className="flex-1 text-center relative">
            <div
              className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center font-bold text-lg transition-all shadow-md ${
                step >= i + 1
                  ? darkMode
                    ? "bg-lime-500 text-white"
                    : "bg-lime-600 text-white"
                  : darkMode
                  ? "bg-gray-700 text-gray-400"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {i + 1}
            </div>
            <p
              className={`text-sm mt-3 font-semibold ${
                step >= i + 1 ? (darkMode ? "text-lime-400" : "text-lime-600") : textSecondary
              }`}
            >
              {s}
            </p>
            {i < steps.length - 1 && (
              <div
                className={`absolute top-6 left-1/2 w-1/2 h-1 transition-all ${
                  step > i + 1
                    ? darkMode
                      ? "bg-lime-500"
                      : "bg-lime-600"
                    : darkMode
                    ? "bg-gray-700"
                    : "bg-gray-300"
                }`}
                style={{ transform: "translateX(50%)" }}
              ></div>
            )}
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Step 1: Device Type */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h2 className={`text-3xl font-bold text-center mb-8 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
              Step 1: Select Device Type
            </h2>

            <label className={`block font-semibold mb-3 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
              Problem Description
            </label>
            <textarea
              className={`w-full px-4 py-3 rounded-xl ${bgCard} ${textPrimary} border ${border} focus:ring-2 focus:ring-lime-500 focus:outline-none transition mb-8 resize-none`}
              rows="5"
              placeholder="Describe the issue with your device..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />

            {isLoading ? (
              <LoadingSpinner darkMode={darkMode} />
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {categories.map((cat, index) => (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setStep(2);
                    }}
                    className={`group cursor-pointer rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 ${
                      selectedCategory?.id === cat.id
                        ? darkMode
                          ? "bg-lime-600 text-white ring-4 ring-lime-400"
                          : "bg-lime-600 text-white ring-4 ring-lime-500"
                        : `${bgCard} border ${border}`
                    } animate-slideIn`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`text-5xl mb-4 flex justify-center items-center transition-transform duration-300 group-hover:scale-110 ${cat.color}`}>
                      {cat.icon}
                    </div>
                    <p className={`font-bold text-center text-lg ${selectedCategory?.id === cat.id ? "text-white" : textPrimary}`}>
                      {cat.name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 text-lg">
                No categories available.
              </p>
            )}

            <div className="mt-12 flex justify-center">
              <button
                onKeyPress={(e) => e.key === "Enter" && handleNext()}
                onClick={handleNext}
                className="px-8 py-3 bg-lime-600 text-white font-bold rounded-full hover:bg-lime-700 transition shadow-lg flex items-center gap-2"
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Shop */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h2 className={`text-3xl font-bold text-center mb-8 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
              Step 2: Select Repair Shop
            </h2>

            {isLoading ? (
              <LoadingSpinner darkMode={darkMode} />
            ) : currentShops.length > 0 ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentShops.map((shop, i) => (
                    <div
                      key={shop.id}
                      onClick={() => setSelectedShop(shop)}
                      className={`p-6 rounded-2xl shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl ${
                        selectedShop?.id === shop.id
                          ? darkMode
                            ? "bg-lime-600 text-white ring-4 ring-lime-400"
                            : "bg-lime-600 text-white ring-4 ring-lime-500"
                          : `${bgCard} border ${border}`
                      } animate-slideIn`}
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className={`font-bold text-xl ${selectedShop?.id === shop.id ? "text-white" : textPrimary}`}>
                          {shop.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          <FaStar className="text-yellow-500 text-sm" />
                          <span className={`text-sm ${selectedShop?.id === shop.id ? "text-white" : textSecondary}`}>
                            {shop.rating || 4.5}
                          </span>
                        </div>
                      </div>
                      <p className={`text-sm ${selectedShop?.id === shop.id ? "text-lime-100" : textSecondary} mb-1`}>
                        {shop.address || shop.shopAddress?.street || "Cairo, Egypt"}
                      </p>
                      <p className={`text-sm ${selectedShop?.id === shop.id ? "text-lime-100" : textSecondary}`}>
                        {shop.phone || "+20 123 456 7890"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-full transition ${
                          currentPage === i + 1
                            ? "bg-lime-600 text-white"
                            : darkMode
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 text-lg">
                No shops found for this category.
              </p>
            )}

            <div className="mt-12 flex justify-between">
              <button
                onClick={handleBack}
                className={`px-6 py-3 rounded-full ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"} transition flex items-center gap-2`}
              >
                <FaArrowLeft /> Back
              </button>
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-lime-600 text-white font-bold rounded-full hover:bg-lime-700 transition shadow-lg flex items-center gap-2"
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* Other steps... */}
      </div>
    </div>
  );
};

export default RepairRequest;