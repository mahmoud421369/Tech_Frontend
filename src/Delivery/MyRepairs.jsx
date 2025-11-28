import React, { useEffect, useState, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiTool, FiMapPin, FiDollarSign, FiClock,
  FiCheckCircle, FiHome, FiUser, FiPackage
} from "react-icons/fi";
import { getMyRepairs, updateRepairStatus } from "../api/deliveryApi";

const MyRepairs = () => {
  const [repairs, setRepairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const repairsPerPage = 8;

  const loadRepairs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyRepairs();
      setRepairs(data.content || data || []);
    } catch (err) {
      toast.error("Failed to load your repairs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRepairs();
    const interval = setInterval(loadRepairs, 15000);
    return () => clearInterval(interval);
  }, [loadRepairs]);

  const updateStatus = async (repairId, newStatus) => {
    try {
      await updateRepairStatus(repairId, { status: newStatus });
      toast.success(
        newStatus === "REPAIR_COMPLETED"
          ? "Repair marked as completed!"
          : newStatus === "DEVICE_DELIVERED"
          ? "Device delivered to customer!"
          : "Status updated!"
      );
      loadRepairs();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const totalPages = Math.ceil(repairs.length / repairsPerPage);
  const currentRepairs = repairs.slice((currentPage - 1) * repairsPerPage, currentPage * repairsPerPage);

  const getStatusStyle = (status) => {
    switch (status) {
      case "REPAIR_COMPLETED":
      case "DEVICE_DELIVERED":
        return "from-emerald-500 to-teal-600";
      case "CANCELLED":
        return "from-red-500 to-rose-600";
      case "PICKED_UP":
      case "DELIVERED_TO_SHOP":
      case "IN_REPAIR":
        return "from-indigo-500 to-purple-600";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      REPAIR_COMPLETED: "Repair Completed",
      DEVICE_DELIVERED: "Device Delivered",
      CANCELLED: "Cancelled",
      PICKED_UP: "Picked Up",
      DELIVERED_TO_SHOP: "Delivered to Shop",
      IN_REPAIR: "In Repair",
    };
    return labels[status] || status?.replace(/_/g, " ");
  };

  return (
    <>
      <ToastContainer position="top-right" theme={document.documentElement.classList.contains("dark") ? "dark" : "light"} />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-emerald-950/30 pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">

          
          <div className="text-center mb-12 mt-5">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-6">
              <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl text-white">
                <FiTool size={48} />
              </div>
              My Repair Deliveries
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Manage device pickup & delivery for repairs
            </p>
            <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-700 dark:text-emerald-400 font-semibold">
              Auto-refresh every 15s • {repairs.length} active
            </div>
          </div>

          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl h-80 animate-pulse shadow-xl border border-gray-200 dark:border-gray-800">
                  <div className="p-8 space-y-6">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-2xl w-3/4"></div>
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : repairs.length === 0 ? (
            <div className="text-center py-20">
              <FiTool size={100} className="mx-auto text-gray-300 dark:text-gray-700 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
                No repair jobs assigned
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mt-2">
                Accept repair requests from the "Available Repairs" page!
              </p>
            </div>
          ) : (
            <>
             
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {currentRepairs.map((repair) => (
                  <div
                    key={repair.id}
                    className="group relative bg-white dark:bg-gray-900 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-500 hover:-translate-y-4"
                  >
                    <div className={`h-2 bg-gradient-to-r ${getStatusStyle(repair.status)}`} />

                    <div className="p-7">
                      <div className="flex justify-between items-start mb-5">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                          #{repair.id?.slice(-8)}
                        </h3>
                        <span className={`px-4 py-2 rounded-full text-white font-bold text-xs shadow-lg bg-gradient-to-r ${getStatusStyle(repair.status)}`}>
                          {getStatusLabel(repair.status)}
                        </span>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                          <FiUser className="text-emerald-600 mt-1" size={18} />
                          <div>
                            <div className="font-medium">Customer Address</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {repair.userAddress?.street}, {repair.userAddress?.city}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 font-bold text-xl text-emerald-600 dark:text-emerald-400">
                            <FiDollarSign size={22} />
                            {repair.price || 0} EGP
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(repair.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                     
                      <div className="mt-6 space-y-3">
                        {repair.status === "REPAIR_COMPLETED" || repair.status === "DEVICE_DELIVERED" ? (
                          <div className="py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl text-center shadow-lg flex items-center justify-center gap-3">
                            <FiCheckCircle size={22} />
                            {repair.status === "DEVICE_DELIVERED" ? "Device Delivered" : "Repair Completed"}
                          </div>
                        ) : (
                          <>
                            {repair.status !== "CANCELLED" && (
                              <>
                                <button
                                  onClick={() => updateStatus(repair.id, "REPAIR_COMPLETED")}
                                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                  <FiPackage size={18} /> Mark Repair Completed
                                </button>
                                <button
                                  onClick={() => updateStatus(repair.id, "DEVICE_DELIVERED")}
                                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                  <FiCheckCircle size={18} /> Device Delivered
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

         
              {totalPages > 1 && (
                <div className="flex justify-center gap-3 mt-12 flex-wrap">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-6 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 flex items-center gap-2 font-medium"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-4 py-3 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-12 h-12 rounded-xl font-bold transition-all ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                              : 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-6 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 flex items-center gap-2 font-medium"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MyRepairs;