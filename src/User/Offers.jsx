import React, { useEffect, useState, useMemo } from "react";
import {
  FaTag,
  FaPercent,
  FaCalendarAlt,
  FaClock,
  FaStore,
  FaWrench,
  FaStar,
} from "react-icons/fa";
import { FiChevronLeft, FiChevronRight, FiTruck, FiSmartphone } from "react-icons/fi";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../api";
import { RiCarLine, RiMotorbikeLine } from "react-icons/ri";

const Offers = ({ darkMode }) => {
  const [offers, setOffers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6);
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem("authToken");

  // Fetch Offers from API
  useEffect(() => {
    const controller = new AbortController();
    const fetchOffers = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/api/users/offers", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = res.data.content || res.data || [];
        setOffers(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching offers:", err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: err.response?.data?.message || "Could not load offers",
            confirmButtonColor: "#84cc16",
            customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchOffers();
    } else {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please log in to view offers",
        confirmButtonColor: "#84cc16",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      }).then(() => {
        window.location.href = "/login";
      });
    }

    return () => controller.abort();
  }, [token, darkMode]);

  const totalPages = Math.ceil(offers.length / pageSize);
  const paginatedOffers = offers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDiscount = (offer) => {
    if (offer.discountType === "PERCENTAGE") {
      return `${offer.discountValue}%`;
    } else if (offer.discountType === "FIXED_VALUE") {
      return `${offer.discountValue} EGP`;
    }
    return "No discount";
  };

  const textPrimary = darkMode ? "text-gray-100" : "text-gray-800";
  const textSecondary = darkMode ? "text-gray-300" : "text-gray-600";
  const bgCard = darkMode ? "bg-gray-800" : "bg-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
      {/* HERO SECTION - MONOTREE STYLE */}
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
          <FaTag className={`absolute top-12 left-10 w-12 h-12 ${darkMode ? "text-lime-400" : "text-lime-600"} animate-float-slow opacity-70`} />
          <FaPercent className={`absolute top-20 right-16 w-14 h-14 ${darkMode ? "text-lime-500" : "text-lime-700"} animate-float-medium opacity-60`} />
          <FiTruck className={`absolute bottom-32 left-20 w-10 h-10 ${darkMode ? "text-gray-400" : "text-gray-700"} animate-float-fast opacity-60`} />
          <FaStore className={`absolute bottom-20 right-24 w-16 h-16 ${darkMode ? "text-lime-400" : "text-lime-600"} animate-float-slow opacity-70`} />
          <FaWrench className={`absolute top-1/3 left-1/4 w-11 h-11 ${darkMode ? "text-gray-300" : "text-gray-600"} animate-float-medium opacity-60`} />
         
          <FaPercent className={`absolute top-10 right-1/3 w-10 h-10 ${darkMode ? "text-lime-300" : "text-lime-500"} animate-spin-slow opacity-60`} />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center z-10">
          {/* Left: Text */}
          <div>
            <h1 className={`text-5xl sm:text-6xl font-extrabold drop-shadow-md ${darkMode ? "text-lime-400" : "text-lime-700"}`}>
              Exclusive Offers
            </h1>
            <p className={`mt-6 text-xl max-w-xl ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Discover amazing discounts and deals available at your favorite shops.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className={`px-5 py-3 rounded-full border ${
                  darkMode
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                } focus:outline-none focus:ring-2 focus:ring-lime-500`}
              />
              <button className="px-6 py-3 bg-lime-600 text-white font-semibold rounded-full hover:bg-lime-700 transition shadow-lg">
                Explore Offers
              </button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 gap-8 text-center">
              <div>
                <h3 className={`text-4xl font-bold ${darkMode ? "text-lime-400" : "text-lime-600"}`}>75.2%</h3>
                <p className={`text-sm ${textSecondary}`}>Average discount rate</p>
              </div>
              <div>
                <h3 className={`text-4xl font-bold ${darkMode ? "text-lime-400" : "text-lime-600"}`}>~20k</h3>
                <p className={`text-sm ${textSecondary}`}>Active offers monthly</p>
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
              {/* Main Offer Card */}
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
                    50% OFF
                  </div>
                </div>
              </div>

              {/* Floating Tag */}
              <div
                className="absolute bottom-10 right-10 w-56 h-44 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl transform rotate-y--15 rotate-x-8 animate-float-3d-delay border border-gray-200 dark:border-gray-700"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="p-5" style={{ transform: "translateZ(15px)" }}>
                  <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-4/5"></div>
                </div>
              </div>

              {/* Success Badge */}
              <div
                className="absolute top-32 left-4 w-32 h-28 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform rotate-y-20 rotate-x-10 animate-float-3d-fast border-2 border-lime-500"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="p-4 text-center" style={{ transform: "translateZ(10px)" }}>
                  <FaTag className="text-lime-600 text-3xl mx-auto mb-1" />
                  <p className="text-sm font-bold text-lime-600">Active</p>
                </div>
              </div>

              {/* Spinning Percent */}
              <div className="absolute top-20 right-20 w-12 h-12 animate-spin-slow opacity-70">
                <FaPercent className="text-lime-500 text-5xl" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OFFERS GRID */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`rounded-xl shadow-md p-6 ${bgCard} animate-pulse`}
              >
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : paginatedOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedOffers.map((offer, index) => (
              <div
                key={offer.id}
                className={`rounded-xl shadow-md p-6 transition-all duration-500 transform hover:scale-105 hover:shadow-xl ${bgCard} border ${border} animate-slideIn`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-between items-center mb-3">
                  <h2 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
                    <FaTag /> {offer.name}
                  </h2>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      offer.status === "ACTIVE"
                        ? darkMode
                          ? "bg-green-900 text-green-400"
                          : "bg-green-100 text-green-700"
                        : darkMode
                        ? "bg-red-900 text-red-400"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {offer.status}
                  </span>
                </div>

                <p className={`text-sm mb-3 line-clamp-2 ${textSecondary}`}>
                  {offer.description || "No description available"}
                </p>

                <div className={`flex items-center gap-2 font-bold text-lg mb-3 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
                  {offer.discountType === "PERCENTAGE" ? (
                    <FaPercent />
                  ) : (
                    <FaTag />
                  )}
                  {formatDiscount(offer)}
                </div>

                <div className={`space-y-1 text-sm ${textSecondary}`}>
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-500" /> Start:{" "}
                    {new Date(offer.startDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-red-500" /> End:{" "}
                    {new Date(offer.endDate).toLocaleDateString()}
                  </div>
                  {offer.shopName && offer.shopId && (
                    <Link
                      to={`/shops/${offer.shopId}`}
                      className={`flex items-center gap-2 ${darkMode ? "text-lime-400 hover:text-lime-300" : "text-lime-600 hover:text-lime-700"} hover:underline`}
                    >
                      <FaStore /> {offer.shopName}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className={`text-lg ${textSecondary}`}>
              No offers available at the moment.
            </p>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {offers.length > pageSize && (
        <div className="flex justify-center items-center gap-4 pb-12">
          <button
            disabled={currentPage === 1 || isLoading}
            onClick={() => setCurrentPage((p) => p - 1)}
            className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1 ${
              darkMode
                ? "bg-lime-600 text-white hover:bg-lime-500 disabled:bg-gray-700"
                : "bg-lime-600 text-white hover:bg-lime-700 disabled:bg-gray-400"
            } disabled:cursor-not-allowed`}
          >
            <FiChevronLeft /> Prev
          </button>
          <span className={`px-4 py-2 font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages || isLoading}
            onClick={() => setCurrentPage((p) => p + 1)}
            className={`px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1 ${
              darkMode
                ? "bg-lime-600 text-white hover:bg-lime-500 disabled:bg-gray-700"
                : "bg-lime-600 text-white hover:bg-lime-700 disabled:bg-gray-400"
            } disabled:cursor-not-allowed`}
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default Offers;