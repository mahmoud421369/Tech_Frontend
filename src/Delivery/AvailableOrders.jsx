import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiPackage, FiUser, FiHome, FiDollarSign, FiClock, FiMapPin } from "react-icons/fi";
import { getAvailableOrders, acceptOrder, rejectOrder, updateOrderStatus } from "../api/deliveryApi";

const AvailableOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 8;

  const statusOptions = {
    PREPARING: "Preparing",
    READY_FOR_PICKUP: "Ready for Pickup",
    IN_TRANSIT: "In Transit",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAvailableOrders();
      setOrders(data.content || data || []);
    } catch (err) {
      console.error("Error loading orders:", err);
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
      toast.success("Order accepted for delivery!");
      loadOrders();
    } catch (err) {
      console.error("Error accepting order:", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectOrder(id);
      toast.success("Order rejected successfully!");
      loadOrders();
    } catch (err) {
      console.error("Error rejecting order:", err);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      console.error("No status selected");
      return;
    }

    try {
      await updateOrderStatus(selectedOrder.id, { status: selectedStatus, notes: "" });
      toast.success("Order status updated!");
      loadOrders();
      setIsModalOpen(false);
      setSelectedStatus("");
      setSelectedOrder(null);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStatus("");
    setSelectedOrder(null);
  };


  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

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
        <FiPackage className="text-4xl" /> Available Orders
      </h2>

      {isLoading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="text-gray-500 dark:text-gray-400 text-center py-10">
          No available orders at the moment.
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 flex flex-col justify-between border border-gray-200 dark:border-gray-700"
              >
                <div className="mb-4 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-lg">
                    <FiPackage /> Order #{order.id}
                  </div>
                  {order.userAddress && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <FiMapPin />User Address : {order.userAddress.street}, {order.userAddress.city}, {order.userAddress.state}
                    </div>
                  )}
                  {order.shopAddress && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <FiHome />Shop Address : {order.shopAddress.street}, {order.shopAddress.city}, {order.userAddress.state}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 text-sm">
                    <FiDollarSign /> Price: {order.totalPrice} EGP
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                    <FiClock /> {new Date(order.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm font-medium">
                    Status:{" "}
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        order.status === "DELIVERED"
                          ? "bg-green-100 text-green-800"
                          : order.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleAccept(order.id)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      order.status === "CANCELLED"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                    disabled={order.status === "CANCELLED"}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(order.id)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      order.status === "CANCELLED"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                    disabled={order.status === "CANCELLED"}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => openStatusModal(order)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      order.status === "CANCELLED"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-indigo-200 hover:bg-indigo-300 text-indigo-800"
                    }`}
                    disabled={order.status === "CANCELLED"}
                  >
                    Update
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
                
              </button>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Update Order Status
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

export default AvailableOrders;