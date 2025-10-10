import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiTool, FiUser, FiHome, FiDollarSign } from "react-icons/fi";
import { getAvailableRepairs, acceptRepair, rejectRepair } from "../api/deliveryApi";

const AvailableRepairs = () => {
  const [repairs, setRepairs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const repairsPerPage = 8;

  const loadRepairs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAvailableRepairs();
      setRepairs(data.content || data || []);
    } catch (err) {
      console.error("Error loading repairs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRepairs();
    const interval = setInterval(loadRepairs, 15000);
    return () => clearInterval(interval);
  }, [loadRepairs]);

  const handleAccept = async (id) => {
    try {
      await acceptRepair(id);
      toast.success("Repair accepted for pickup!");
      loadRepairs();
    } catch (err) {
      console.error("Error accepting repair:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectRepair(id);
      toast.success("Repair rejected successfully!");
      loadRepairs();
    } catch (err) {
      console.error("Error rejecting repair:", err);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(repairs.length / repairsPerPage);
  const indexOfLastRepair = currentPage * repairsPerPage;
  const indexOfFirstRepair = indexOfLastRepair - repairsPerPage;
  const currentRepairs = repairs.slice(indexOfFirstRepair, indexOfLastRepair);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <h2 className="text-3xl font-bold mb-6 text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
        <FiTool className="text-4xl" /> Available Repairs
      </h2>

      {isLoading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
        </div>
      )}

      {!isLoading && repairs.length === 0 && (
        <div className="text-gray-500 dark:text-gray-400 text-center py-10">
          No available repairs at the moment.
        </div>
      )}

      {!isLoading && repairs.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentRepairs.map((repair) => (
              <div
                key={repair.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 flex flex-col justify-between border border-gray-200 dark:border-gray-700"
              >
                <div className="mb-4 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-lg">
                    <FiTool /> Repair #{repair.id}
                  </div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 text-sm">
                    <FiDollarSign /> Price: {repair.price} EGP
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <FiUser /> User: {repair.userId}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                    <FiHome /> Address: {repair.userAddress?.street}, {repair.userAddress?.city}
                  </div>
                  <div className="text-sm font-medium">
                    Status:{" "}
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        repair.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : repair.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {repair.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleAccept(repair.id)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      repair.status === "CANCELLED"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                    disabled={repair.status === "CANCELLED"}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(repair.id)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      repair.status === "CANCELLED"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                    disabled={repair.status === "CANCELLED"}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <button
                onClick={handlePrevious}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  currentPage === 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {[...Array(totalPages).keys()].map((page) => (
                <button
                  key={page + 1}
                  onClick={() => handlePageChange(page + 1)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    currentPage === page + 1
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  {page + 1}
                </button>
              ))}
              <button
                onClick={handleNext}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  currentPage === totalPages
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AvailableRepairs;