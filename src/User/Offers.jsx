import React, { useEffect, useState } from "react";
import {
  FaTag,
  FaPercent,
  FaCalendarAlt,
  FaStore,
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaGift,
} from "react-icons/fa";
import { FiChevronLeft, FiChevronRight, FiTag } from "react-icons/fi";
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
    document.title = "Exclusive Offers | TechRestore";
  }, []);

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
        setOffers(data.length > 0 ? data : [MOCK_OFFER]);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching offers:", err);
          setOffers([MOCK_OFFER]);
          // Swal.fire({
          //   icon: "info",
          //   title: "Demo Mode",
          //   text: "Showing sample offer (API unavailable)",
          //   confirmButtonColor: "#84cc16",
          // });
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
  }, [token]);

  const totalPages = Math.ceil(offers.length / pageSize);
  const paginatedOffers = offers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatDiscount = (offer) => {
    if (offer.discountType === "PERCENTAGE") return `${offer.discountValue}% OFF`;
    if (offer.discountType === "FIXED_VALUE") return `${offer.discountValue} EGP OFF`;
    return "Special Deal";
  };

  const textPrimary = darkMode ? "text-white" : "text-gray-900";
  const textSecondary = darkMode ? "text-gray-400" : "text-gray-600";
  const bgCard = darkMode ? "bg-gray-800/90" : "bg-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <div className={`min-h-screen overflow-hidden ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
     
      <section className={`py-16 lg:py-24 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-lime-500 to-emerald-600 bg-clip-text text-transparent">
                Exclusive Offers<br />Just for You
              </h1>
              <p className={`mt-6 text-xl ${textSecondary} max-w-2xl mx-auto lg:mx-0`}>
                Save big on repairs, accessories, and premium services at trusted shops near you.
              </p>
            </div>

          
            <div className="relative h-96 lg:h-[600px] flex items-center justify-center order-1 lg:order-2">
            
              <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-150" />

            
              <div className="relative w-full h-full">
         
                <div className="absolute top-10 left-10 w-64 h-80 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl rotate-12 hover:rotate-6 transition-transform duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                    <div className="h-10 bg-gradient-to-r from-lime-500 to-emerald-600 rounded-xl w-20"></div>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="w-10 h-10 bg-lime-500 rounded-full"></div>
                    </div>
                  </div>
                </div>

               
                <div className="absolute bottom-10 right-10 w-72 h-96 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl -rotate-12 hover:-rotate-6 transition-transform duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="w-14 h-14 bg-gradient-to-r from-lime-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
                        <FiTag className="text-white text-3xl" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                      <div className="h-8 bg-lime-500 rounded-xl w-2/3"></div>
                    </div>
                  </div>
                </div>

                
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-10 hover:scale-110 transition-all duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="p-6 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-lime-500 to-emerald-600 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-2xl">
                      <FaStore className="text-white text-4xl" />
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <section className="py-16 bg-gradient-to-b from-transparent to-gray-100 dark:to-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className={`text-4xl font-bold text-center mb-12 ${textPrimary}`}>
            Why Choose Our Offers?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <FaGift className="w-10 h-10" />, title: "Big Savings", desc: "Up to 50% off on repairs & devices" },
              { icon: <FaShieldAlt className="w-10 h-10" />, title: "Trusted Shops", desc: "Verified partners with quality guarantee" },
              { icon: <FaClock className="w-10 h-10" />, title: "Limited Time", desc: "Exclusive deals available now" },
              { icon: <FaCheckCircle className="w-10 h-10" />, title: "Easy Redemption", desc: "Apply instantly at checkout" },
            ].map((feature, i) => (
              <div
                key={i}
                className={`relative rounded-2xl ${bgCard} p-8 border ${border} overflow-hidden transition-transform hover:-translate-y-2 duration-300`}
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-lime-500 to-emerald-600" />
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-lime-500/20 to-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-6">
                    {feature.icon}
                  </div>
                  <h3 className={`text-2xl font-bold mb-3 ${textPrimary}`}>{feature.title}</h3>
                  <p className={textSecondary}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

     
      <div className="max-w-7xl mx-auto px-6 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`rounded-2xl p-8 ${bgCard} animate-pulse border ${border}`}>
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-lg w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedOffers.map((offer) => (
              <div
                key={offer.id}
                className={`group relative rounded-2xl border ${border} ${bgCard} p-8 transition-all duration-300 hover:shadow-xl hover:border-lime-500/50`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-lime-600 dark:text-lime-400">{offer.name}</h3>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      offer.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                    }`}
                  >
                    {offer.status}
                  </span>
                </div>

                <p className={`mb-6 line-clamp-2 ${textSecondary}`}>
                  {offer.description || "Limited time offer on selected services and products."}
                </p>

                <div className="mb-6">
                  <div className="inline-block bg-gradient-to-r from-lime-500 to-emerald-600 text-white font-bold text-2xl px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
                    {offer.discountType === "PERCENTAGE" ? <FaPercent /> : <FaTag />}
                    {formatDiscount(offer)}
                  </div>
                </div>

                <div className={`space-y-3 text-sm ${textSecondary}`}>
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-lime-500" />
                    <span>
                      {new Date(offer.startDate).toLocaleDateString()} -{" "}
                      {new Date(offer.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  {offer.shopName && (
                    <Link
                      to={`/shops/${offer.shopId}`}
                      className="flex items-center gap-2 text-lime-500 hover:text-lime-400 font-medium transition"
                    >
                      <FaStore /> {offer.shopName}
                    </Link>
                  )}
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

      {offers.length > pageSize && (
        <div className="flex justify-center items-center gap-6 py-12">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-6 py-3 rounded-full font-medium flex items-center gap-2 transition ${
              currentPage === 1
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500"
                : "bg-lime-600 hover:bg-lime-700 text-white shadow-lg"
            }`}
          >
            <FiChevronLeft /> Previous
          </button>

          <span className={`text-lg font-medium ${textPrimary}`}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`px-6 py-3 rounded-full font-medium flex items-center gap-2 transition ${
              currentPage === totalPages
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500"
                : "bg-lime-600 hover:bg-lime-700 text-white shadow-lg"
            }`}
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default Offers;