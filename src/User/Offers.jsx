
import React, { useEffect, useState } from "react";
import {
  FaTag,
  FaPercent,
  FaCalendarAlt,
  FaClock,
  FaStore,
} from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../api";

const Offers = ({ darkMode }) => {
  const [offers, setOffers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6);
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem("authToken");

  // Fetch offers
  useEffect(() => {
    const controller = new AbortController();
    const fetchOffers = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/api/users/offers", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        setOffers(res.data.content || res.data || []);
      } catch (err) {
        // if (err.name !== "AbortError") {
        //   console.error("Error fetching offers:", err.response?.data || err.message);
        //   Swal.fire({
        //     icon: "error",
        //     title: "Error",
        //     text: err.response?.data?.message || "Could not load offers",
        //     customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        //   });
        // }
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
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
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
      return `${offer.discountValue}% Off`;
    }
    return `${offer.discountValue} EGP Off`;
  };

  return (
    <div
      className={`mt-14 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      } min-h-screen`}
    >
      <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-indigo-900 dark:to-gray-800 py-20 px-6 text-center overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-bold text-white z-10 relative">
          🎉 Exclusive Offers
        </h1>
        <p className="mt-4 text-lg text-white/90 z-10 relative max-w-2xl mx-auto">
          Discover amazing discounts and deals available at your favorite shops.
        </p>
        <div className="absolute top-10 left-10 w-24 h-24 bg-pink-500 opacity-40 rounded-full animate-bounce"></div>
        <div className="absolute bottom-10 right-20 w-32 h-32 bg-yellow-400 opacity-30 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-10 w-20 h-20 bg-green-400 opacity-30 rounded-full animate-bounce"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="rounded-xl shadow-md p-6 bg-white dark:bg-gray-800 animate-pulse"
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
            {paginatedOffers.map((offer) => (
              <div
                key={offer.id}
                className={`rounded-xl shadow-md p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FaTag className="text-indigo-500" /> {offer.name}
                  </h2>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      offer.status === "ACTIVE"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400"
                    }`}
                  >
                    {offer.status}
                  </span>
                </div>

                <p className="text-sm mb-3 text-gray-600 dark:text-gray-300 line-clamp-2">
                  {offer.description || "No description available"}
                </p>

                <div className="flex items-center gap-2 font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                  {offer.discountType === "PERCENTAGE" ? (
                    <FaPercent className="text-indigo-500" />
                  ) : (
                    <FaTag className="text-indigo-500" />
                  )}
                  {formatDiscount(offer)}
                </div>

                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
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
                      className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <FaStore className="text-indigo-500" /> {offer.shopName}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 text-lg col-span-full">
            No offers available at the moment.
          </p>
        )}
      </div>

      {offers.length > pageSize && (
        <div className="flex justify-center items-center gap-4 pb-12">
          <button
            disabled={currentPage === 1 || isLoading}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="px-4 py-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
          >
            <FiChevronLeft className="text-lg" />
          </button>
          <span className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages || isLoading}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-4 py-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
          >
            <FiChevronRight className="text-lg" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Offers;
