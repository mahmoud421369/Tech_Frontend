import React, { useEffect, useState } from "react";
import {
  FaTag,
  FaPercent,
  FaCalendarAlt,
  FaClock,
  FaStore,
} from "react-icons/fa";

const Offers = ({ darkMode }) => {
  const [offers, setOffers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6); 

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/users/offers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch offers");
      const data = await res.json();
      setOffers(data.content || data || []); 
    } catch (err) {
      console.error("Error fetching offers:", err);
    }
  };


  const totalPages = Math.ceil(offers.length / pageSize);
  const paginatedOffers = offers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div
      className={`mt-14 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      } min-h-screen`}
    >

      <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 py-20 px-6 text-center overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-bold text-white z-10 relative">
          🎉 Exclusive Offers
        </h1>
        <p className="mt-4 text-lg text-white/90 z-10 relative">
          Discover amazing discounts and deals available at your favorite shops.
        </p>

       
        <div className="absolute top-10 left-10 w-24 h-24 bg-pink-500 opacity-40 rounded-full animate-bounce"></div>
        <div className="absolute bottom-10 right-20 w-32 h-32 bg-yellow-400 opacity-30 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-10 w-20 h-20 bg-green-400 opacity-30 rounded-full animate-bounce"></div>
      </div>




 


      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedOffers.length > 0 ? (
          paginatedOffers.map((offer) => (
            <div
              key={offer.id}
              className={`rounded-xl shadow-md p-6 transition hover:shadow-xl ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FaTag className="text-indigo-500" /> {offer.name}
                </h2>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    offer.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {offer.status}
                </span>
              </div>

   
              <p className="text-sm mb-3">{offer.description}</p>

              <div className="flex items-center gap-2 font-semibold text-indigo-600 dark:text-indigo-400">
                <FaPercent /> {offer.discountValue} {offer.discountType}
              </div>

              <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <FaCalendarAlt className="text-blue-500" /> Start:{" "}
                  {new Date(offer.startDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <FaClock className="text-red-500" /> End:{" "}
                  {new Date(offer.endDate).toLocaleDateString()}
                </div>
              </div>

   
              <div className="mt-3 flex items-center gap-2 text-sm">
                <FaStore className="text-yellow-500" /> Shop ID:{" "}
                <span className="font-medium">{offer.shopId}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No offers available at the moment.
          </p>
        )}
      </div>


      {offers.length > pageSize && (
        <div className="flex justify-center items-center gap-2 pb-12">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="px-4 py-2 rounded-lg bg-indigo-500 text-white disabled:bg-gray-400"
          >
            Prev
          </button>
          <span className="px-4 py-2 font-semibold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-4 py-2 rounded-lg bg-indigo-500 text-white disabled:bg-gray-400"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Offers;