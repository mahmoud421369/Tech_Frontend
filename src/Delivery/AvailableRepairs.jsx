import React, { useEffect, useState, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiTool, FiUser, FiMapPin, FiDollarSign, FiClock,
  FiCheckCircle, FiXCircle, FiRefreshCw
} from "react-icons/fi";
import { getAvailableRepairs, acceptRepair, rejectRepair } from "../api/deliveryApi";

const AvailableRepairs = () => {
  const [repairs, setRepairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const repairsPerPage = 8;

  const loadRepairs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAvailableRepairs();
      setRepairs(data.content || data || []);
    } catch (err) {
      toast.error("Failed to load repair requests");
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
      toast.success("Repair request accepted!");
      loadRepairs();
    } catch (err) {
      toast.error("Failed to accept repair");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectRepair(id);
      toast.success("Repair request rejected");
      loadRepairs();
    } catch (err) {
      toast.error("Failed to reject repair");
    }
  };

  const totalPages = Math.ceil(repairs.length / repairsPerPage);
  const currentRepairs = repairs.slice((currentPage - 1) * repairsPerPage, currentPage * repairsPerPage);

  const getStatusGradient = (status) => {
    const map = {
      PENDING: "from-yellow-400 to-amber-500",
      IN_PROGRESS: "from-indigo-500 to-purple-600",
      READY_FOR_DELIVERY: "from-blue-400 to-cyan-500",
      COMPLETED: "from-emerald-500 to-teal-600",
      CANCELLED: "from-red-500 to-rose-600",
      default: "from-gray-400 to-gray-600"
    };
    return map[status] || map.default;
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
              Available Repair Requests
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Pick up device repair delivery jobs
            </p>
            <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-700 dark:text-emerald-400 font-semibold">
              <FiRefreshCw className={`animate-spin ${isLoading ? 'block' : 'hidden'}`} />
              Auto-refresh every 15s • {repairs.length} available
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
                No repair requests available
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mt-2">
                New repair pickup jobs will appear here in real-time
              </p>
            </div>
          ) : (
            <>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {currentRepairs.map((repair) => (
                  <div
                    key={repair.id}
                    className="group relative bg-white dark:bg-gray-900 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-500 hover:-translate-y-4 cursor-pointer"
                  >
                    <div className={`h-2 bg-gradient-to-r ${getStatusGradient(repair.status)}`} />

                    <div className="p-7">
                      <div className="flex justify-between items-start mb-5">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                          #{repair.id.slice(-8)}
                        </h3>
                        <span className={`px-4 py-2 rounded-full text-white font-bold text-xs shadow-lg bg-gradient-to-r ${getStatusGradient(repair.status)}`}>
                          {repair.status?.replace(/_/g, " ") || "PENDING"}
                        </span>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                          <FiUser className="text-emerald-600 mt-1" size={18} />
                          <div>
                            <div className="font-medium">Customer</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {repair.userId}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                          <FiMapPin className="text-teal-600 mt-1" size={18} />
                          <div>
                            <div className="font-medium">Delivery Address</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {repair.userAddress?.street || "N/A"}, {repair.userAddress?.city || "N/A"}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 font-bold text-xl text-emerald-600 dark:text-emerald-400">
                            <FiDollarSign size={22} />
                            {repair.price || 0} EGP
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                            <FiClock size={14} />
                            {repair.createdAt ? new Date(repair.createdAt).toLocaleTimeString() : "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(repair.id);
                          }}
                          disabled={repair.status === "CANCELLED" || repair.status === "COMPLETED"}
                          className={`py-3 font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                            repair.status === "CANCELLED" || repair.status === "COMPLETED"
                              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                              : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                          }`}
                        >
                          <FiCheckCircle size={18} /> Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(repair.id);
                          }}
                          disabled={repair.status === "CANCELLED" || repair.status === "COMPLETED"}
                          className={`py-3 font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                            repair.status === "CANCELLED" || repair.status === "COMPLETED"
                              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                              : "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700"
                          }`}
                        >
                          <FiXCircle size={18} /> Reject
                        </button>
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
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
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

export default AvailableRepairs;