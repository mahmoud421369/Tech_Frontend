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


const MOCK_OFFER = {
  id: "0199b7de-ded5-7fea-964d-616ca9af5d3c",
  name: "Offer 6",
  description: "The sixth offer",
  discountType: "FIXED_VALUE",
  discountValue: 200,
  startDate: "2025-10-05T21:00:00",
  endDate: "2025-10-30T22:00:00",
  status: "ACTIVE",
  shopId: "01998efa-6127-7218-bcd3-f701a640df92",
  shopName: "Star",
};

const Offers = ({ darkMode }) => {
  const [offers, setOffers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6);
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem("authToken");

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
        setOffers(data.length > 0 ? data : [MOCK_OFFER]); // fallback to mock
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching offers:", err);
          setOffers([MOCK_OFFER]); // show your offer even if API fails
          Swal.fire({
            icon: "info",
            title: "Demo Mode",
            text: "Showing sample offer (API unavailable)",
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
      setOffers([MOCK_OFFER]);
      Swal.fire({
        icon: "warning",
        title: "Please Log In",
        text: "Log in to see personalized offers",
        confirmButtonColor: "#84cc16",
      }).then(() => {
        window.location.href = "/login";
      });
    }

    return () => controller.abort();
  }, [token, darkMode]);

  const totalPages = Math.ceil(offers.length / pageSize);
  const paginatedOffers = offers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatDiscount = (offer) => {
    if (offer.discountType === "PERCENTAGE") return `${offer.discountValue}% OFF`;
    if (offer.discountType === "FIXED_VALUE") return `${offer.discountValue} EGP OFF`;
    return "Special Deal";
  };

  const textPrimary = darkMode ? "text-gray-100" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-400" : "text-gray-600";
  const bgCard = darkMode ? "bg-gray-800" : "bg-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* HERO SECTION - Clean & Modern */}
      <section className={`relative py-24 lg:py-32 overflow-hidden ${darkMode ? "bg-gray-900" : "bg-gradient-to-b from-lime-50 to-white"}`}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight ${darkMode ? "text-lime-400" : "text-lime-700"}`}>
            Exclusive Offers Just for You
          </h1>
          <p className={`mt-6 text-xl max-w-2xl mx-auto ${textSecondary}`}>
            Save big on repairs, accessories, and premium services at trusted shops near you.
          </p>

          {/* Simple Illustration */}
          <div className="mt-16 flex justify-center">
            <div className="relative">
              <div className="w-80 h-80 bg-lime-500/10 rounded-full blur-3xl absolute -top-20 -left-20"></div>
              <div className="w-96 h-96 bg-lime-400/20 rounded-full blur-3xl absolute -bottom-20 -right-20"></div>
              <div className="relative z-10 bg-lime-600/10 backdrop-blur-xl rounded-3xl p-12 border border-lime-500/20">
                <FaTag className="w-32 h-32 mx-auto text-lime-500 drop-shadow-2xl" />
                <p className="mt-6 text-3xl font-bold text-lime-600">Up to 50% OFF</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OFFERS GRID - Enhanced Cards */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`rounded-2xl p-8 ${bgCard} animate-pulse border ${border}`}>
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-lg w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-3"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : paginatedOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedOffers.map((offer, index) => (
              <div
                key={offer.id}
                className={`group relative overflow-hidden rounded-2xl border ${border} ${bgCard} p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 hover:border-lime-500/50`}
                style={{ animation: `fadeInUp 0.6s ease-out forwards ${index * 100}ms, opacity: 0`}}
              >
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-lime-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className={`text-2xl font-bold ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
                      {offer.name}
                    </h3>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full ${
                        offer.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {offer.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className={`mb-6 line-clamp-2 ${textSecondary}`}>
                    {offer.description || "Limited time offer on selected services and products."}
                  </p>

                  {/* Discount Badge */}
                  <div className="mb-6 inline-block">
                    <div className="bg-gradient-to-r from-lime-500 to-lime-600 text-white font-bold text-2xl px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
                      {offer.discountType === "PERCENTAGE" ? <FaPercent /> : <FaTag />}
                      {formatDiscount(offer)}
                    </div>
                  </div>

                  {/* Details */}
                  <div className={`space-y-3 text-sm ${textSecondary}`}>
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-lime-500" />
                      <span>Valid: {new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}</span>
                    </div>
                    {offer.shopName && (
                      <Link
                        to={`/shops/${offer.shopId}`}
                        className="flex items-center gap-2 text-lime-500 hover:text-lime-400 font-medium transition"
                      >
                        <FaStore />
                        {offer.shopName}
                      </Link>
                    )}
                  </div>

                  {/* Hover CTA */}
                  <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Link
                      to={`/offers/${offer.id}`}
                      className="block text-center bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 rounded-xl transition shadow-lg"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FaTag className="w-20 h-20 mx-auto text-gray-400 mb-4" />
            <p className={`text-xl ${textSecondary}`}>No active offers right now. Check back soon!</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {offers.length > pageSize && (
        <div className="flex justify-center items-center gap-6 py-12">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-6 py-3 rounded-full font-medium transition flex items-center gap-2 ${
              currentPage === 1
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-lime-600 hover:bg-lime-700 text-white shadow-lg"
            }`}
          >
            <FiChevronLeft /> Previous
          </button>

          <span className={`text-lg font-medium ${textPrimary}`}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-6 py-3 rounded-full font-medium transition flex items-center gap-2 ${
              currentPage === totalPages
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-lime-600 hover:bg-lime-700 text-white shadow-lg"
            }`}
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
      
      {/* Custom Animation Keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Offers;