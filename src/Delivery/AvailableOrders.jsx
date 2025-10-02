import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { FiPackage, FiUser, FiHome, FiDollarSign, FiClock } from "react-icons/fi";
import { getAvailableOrders, acceptOrder, rejectOrder, updateOrderStatus } from "../api/deliveryApi";

const AvailableOrders = () => {
  const token = localStorage.getItem("authToken");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const load = async () => {
    try {
      const data = await getAvailableOrders(token);
      setOrders(data.content || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptOrder(token, id);
      Swal.fire("Accepted", "Order accepted for delivery", "success");
      load();
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to accept", "error");
    }
  };

  const handleReject = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Reject order",
      input: "textarea",
      inputPlaceholder: "Reason for rejection (optional)",
      showCancelButton: true,
    });
    if (reason === undefined) return;
    try {
      await rejectOrder(token, id);
      Swal.fire("Rejected", "Order has been rejected", "success");
      load();
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to reject", "error");
    }
  };

  const handleUpdateStatus = (order) => {
    Swal.fire({
      title: "Update Status",
      input: "select",
      inputOptions: {
        PREPARING: "PREPARING",
        READY_FOR_PICKUP: "READY_FOR_PICKUP",
        IN_TRANSIT: "IN_TRANSIT",
        DELIVERED: "DELIVERED",
        CANCELLED: "CANCELLED",
      },
      inputPlaceholder: "Select status",
      showCancelButton: true,
      preConfirm: async (status) => {
        if (!status) throw new Error("Select a status");
        await updateOrderStatus(token, order.id, { status, notes: "" });
      },
    })
      .then(() => {
        Swal.fire("Updated", "Order status updated", "success");
        load();
      })
      .catch((err) => {
        if (err) Swal.fire("Error", err.message || "Failed", "error");
      });
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <h2 className="text-3xl font-bold mb-6 text-blue-600 dark:text-indigo-400 flex items-center gap-2">
        <FiPackage /> Available Orders
      </h2>

      {orders.length === 0 && (
        <div className="text-gray-500 dark:text-gray-400">No available orders</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((o) => (
          <div
            key={o.id}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg transition p-5 flex flex-col justify-between"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-lg">
                <FiPackage /> Order {o.id}
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 text-sm mt-2">
                <FiUser /> User: {o.userId}
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mt-1">
                <FiHome /> Shop: {o.shopId}
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 text-sm mt-1">
                <FiDollarSign /> Price: {o.totalPrice} EGP
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mt-1">
                <FiClock /> {new Date(o.createdAt).toLocaleString()}
              </div>
              <div className="mt-2 text-sm font-medium">
                Status: <span className="text-indigo-600 dark:text-indigo-400">{o.status}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-auto">
              <button
                onClick={() => handleAccept(o.id)}
                className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Accept
              </button>
              <button
                onClick={() => handleReject(o.id)}
                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
              >
                Reject
              </button>
              <button
                onClick={() => handleUpdateStatus(o)}
                className="flex-1 px-3 py-2 bg-indigo-200 hover:bg-indigo-300 text-indigo-800 rounded-lg transition"
              >
                Update Status
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableOrders;