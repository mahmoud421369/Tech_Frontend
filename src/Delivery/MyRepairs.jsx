import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiTool, FiMapPin, FiDollarSign, FiClock } from "react-icons/fi";
import { getMyRepairs, updateRepairStatus } from "../api/deliveryApi";

const MyRepairs = () => {
  const [repairs, setRepairs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const repairsPerPage = 8;

  const statusOptions = {
    PENDING_PICKUP: "Pending Pickup",
    PICKED_UP: "Picked Up",
    DELIVERED_TO_SHOP: "Delivered to Shop",
    IN_REPAIR: "In Repair",
    REPAIR_COMPLETED: "Repair Completed",
    READY_FOR_RETURN: "Ready for Return",
    DELIVERED_TO_USER: "Delivered to User",
    CANCELLED: "Cancelled",
  };

  const loadRepairs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyRepairs();
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

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      console.error("No status selected");
      return;
    }

    try {
      await updateRepairStatus(selectedRepair.id, { status: selectedStatus, notes: "" });
      toast.success("Repair status updated!");
      loadRepairs();
      setIsModalOpen(false);
      setSelectedStatus("");
      setSelectedRepair(null);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const openStatusModal = (repair) => {
    setSelectedRepair(repair);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStatus("");
    setSelectedRepair(null);
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
        <FiTool className="text-4xl" /> My Repair Deliveries
      </h2>

      {isLoading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
        </div>
      )}

      {!isLoading && repairs.length === 0 && (
        <div className="text-gray-500 dark:text-gray-400 text-center py-10">
          No repairs assigned yet.
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
                  {repair.userAddress && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <FiMapPin /> {repair.userAddress.street}, {repair.userAddress.city}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 text-sm">
                    <FiDollarSign /> Price: {repair.price} EGP
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                    <FiClock /> {new Date(repair.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm font-medium">
                    Status:{" "}
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        repair.status === "DELIVERED_TO_USER" || repair.status === "REPAIR_COMPLETED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : repair.status === "CANCELLED"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                          : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100"
                      }`}
                    >
                      {repair.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => openStatusModal(repair)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      repair.status === "DELIVERED_TO_USER"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {repair.status === "DELIVERED_TO_USER" ? "Delivered" : "Update Status"}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Update Repair Status
            </h3>
            <select
              className="w-full p-2 border rounded-md mb-4 text-gray-900 dark:text-gray-100 dark:bg-gray-700"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Select status</option>
              {Object.entries(statusOptions).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleUpdateStatus}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                disabled={!selectedStatus}
              >
                Submit
              </button>
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRepairs;