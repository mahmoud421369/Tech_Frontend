import React, { useEffect, useState } from "react";
import { getMyDeliveries, updateOrderStatus } from "../api/deliveryApi";
import Swal from "sweetalert2";
import { FiPackage, FiUser, FiClock, FiDollarSign, FiMapPin } from "react-icons/fi";

const MyDeliveries = () => {
  const token = localStorage.getItem("authToken");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const load = async () => {
    try {
      const data = await getMyDeliveries(token);
      setOrders(data.content || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = (order) => {
    Swal.fire({
      title: "Update Delivery Status",
      input: "select",
      inputOptions: {


        IN_TRANSIT: "IN_TRANSIT",
        DELIVERED: "DELIVERED",
        CANCELLED: "CANCELLED",
      },
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
        <FiPackage /> My Deliveries
      </h2>

      {orders.length === 0 && (
        <div className="text-gray-500 dark:text-gray-400">No deliveries yet</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((o) => (
          <div
            key={o.id}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg transition p-5 flex flex-col justify-between"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                <FiPackage /> Order # {o.id}
              </div><br />
           
               {o.userAddress && (
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-lg mt-1">
                                <FiMapPin /> {o.userAddress.street}, {o.userAddress.city}
                              </div>
                            )}
              {o.totalPrice && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 text-sm mt-1">
                  <FiDollarSign /> Total: {o.totalPrice} EGP
                </div>
              )}
              <div className="mt-2 text-sm font-medium dark:bg-gray-700 rounded-lg dark:text-white flex justify-between items-center p-3">
                Status:{" "}
                <span className="text-indigo-600 dark:text-indigo-400">
                  {o.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-auto">
              <button
                onClick={() => handleUpdateStatus(o)}
                className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
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

export default MyDeliveries;