import React, { useEffect, useState, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiPackage, FiUser, FiMapPin, FiHome, FiDollarSign,
  FiClock, FiCheckCircle, FiXCircle, FiTruck, FiRefreshCw
} from "react-icons/fi";
import { getAvailableOrders, acceptOrder, rejectOrder, updateOrderStatus } from "../api/deliveryApi";

const AvailableOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 8;

  const statusOptions = [
    { value: "PREPARING", label: "Preparing", color: "from-yellow-400 to-amber-500" },
    { value: "READY_FOR_PICKUP", label: "Ready for Pickup", color: "from-blue-400 to-cyan-500" },
    { value: "IN_TRANSIT", label: "In Transit", color: "from-indigo-500 to-purple-600" },
    { value: "DELIVERED", label: "Delivered", color: "from-emerald-500 to-teal-600" },
    { value: "CANCELLED", label: "Cancelled", color: "from-red-500 to-rose-600" }
  ];

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAvailableOrders();
      setOrders(data.content || data || []);
    } catch (err) {
      toast.error("Failed to load available orders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleAccept = async (id) => {
    try {
      await acceptOrder(id);
      toast.success("Order accepted successfully!");
      loadOrders();
    } catch (err) {
      toast.error("Failed to accept order");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectOrder(id);
      toast.success("Order rejected");
      loadOrders();
    } catch (err) {
      toast.error("Failed to reject order");
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;

    try {
      await updateOrderStatus(selectedOrder.id, { status: selectedStatus });
      toast.success(`Status updated to ${selectedStatus.replace(/_/g, " ")}`);
      setSelectedOrder(null);
      setSelectedStatus("");
      loadOrders();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const currentOrders = orders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  const getStatusGradient = (status) => {
    const map = {
      PREPARING: "from-yellow-400 to-amber-500",
      READY_FOR_PICKUP: "from-blue-400 to-cyan-500",
      IN_TRANSIT: "from-indigo-500 to-purple-600",
      DELIVERED: "from-emerald-500 to-teal-600",
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
                <FiPackage size={48} />
              </div>
              Available Orders
            </h1>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Pick up new delivery jobs instantly
            </p>
            <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-700 dark:text-emerald-400 font-semibold">
              <FiRefreshCw className={`animate-spin ${isLoading ? 'block' : 'hidden'}`} />
              Auto-refresh every 15s • {orders.length} available
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
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <FiPackage size={100} className="mx-auto text-gray-300 dark:text-gray-700 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
                No available orders right now
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mt-2">
                Check back soon — new orders appear in real-time!
              </p>
            </div>
          ) : (
            <>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {currentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="group relative bg-white dark:bg-gray-900 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-500 hover:-translate-y-4 cursor-pointer"
                  >
                    <div className={`h-2 bg-gradient-to-r ${getStatusGradient(order.status)}`} />

                    <div className="p-7">
                      <div className="flex justify-between items-start mb-5">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                          #{order.id.slice(-8)}
                        </h3>
                        <span className={`px-4 py-2 rounded-full text-white font-bold text-xs shadow-lg bg-gradient-to-r ${getStatusGradient(order.status)}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                          <FiUser className="text-emerald-600 mt-1" size={18} />
                          <div>
                            <div className="font-medium">Customer</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {order.userAddress?.street}, {order.userAddress?.city}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                          <FiHome className="text-teal-600 mt-1" size={18} />
                          <div>
                            <div className="font-medium">Pickup From</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {order.shopAddress?.street}, {order.shopAddress?.city}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 font-bold text-xl text-emerald-600 dark:text-emerald-400">
                            <FiDollarSign size={22} />
                            {order.totalPrice} EGP
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(order.id);
                          }}
                          className="py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <FiCheckCircle size={18} /> Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(order.id);
                          }}
                          className="py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all shadow-lg flex items-center justify-center gap-2"
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

       
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Update Order Status
                </h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <FiXCircle size={28} />
                </button>
              </div>

              <div className="mb-6 p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">Order ID</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  #{selectedOrder.id.slice(-8)}
                </p>
              </div>

              <div className="space-y-4">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelectedStatus(opt.value);
                      handleUpdateStatus();
                    }}
                    className={`w-full p-5 rounded-2xl border-2 transition-all text-left font-medium ${
                      selectedStatus === opt.value
                        ? `border-emerald-500 bg-gradient-to-r ${opt.color} text-white shadow-lg`
                        : 'border-gray-300 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.label}</span>
                      {selectedStatus === opt.value && <FiCheckCircle size={20} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AvailableOrders;