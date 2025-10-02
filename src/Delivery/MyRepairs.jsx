import React, { useEffect, useState } from "react";
import { getMyRepairs, updateRepairStatus } from "../api/deliveryApi";
import Swal from "sweetalert2";
import { FiTool, FiUser, FiDollarSign, FiClock, FiMapPin } from "react-icons/fi";

const MyRepairs = () => {
  const token = localStorage.getItem("authToken");
  const [repairs, setRepairs] = useState([]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const load = async () => {
    try {
      const data = await getMyRepairs(token);
      setRepairs(data.content || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = (r) => {
    Swal.fire({
      title: "Update Repair Status",
      input: "select",
      inputOptions: {
        PENDING_PICKUP: "PENDING_PICKUP",
        PICKED_UP: "PICKED_UP",
        DELIVERED_TO_SHOP: "DELIVERED_TO_SHOP",
        IN_REPAIR: "IN_REPAIR",
        REPAIR_COMPLETED: "REPAIR_COMPLETED",
        READY_FOR_RETURN: "READY_FOR_RETURN",
        DELIVERED_TO_USER: "DELIVERED_TO_USER",
        CANCELLED: "CANCELLED",
      },
      showCancelButton: true,
      preConfirm: async (status) => {
        if (!status) throw new Error("Select a status");
        await updateRepairStatus(token, r.id, { status, notes: "" });
      },
    })
      .then(() => {
        Swal.fire("Updated", "Status updated", "success");
        load();
      })
      .catch((err) => {
        if (err) Swal.fire("Error", err.message || "Failed", "error");
      });
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <h2 className="text-3xl font-bold mb-6 text-blue-600 dark:text-indigo-400 flex items-center gap-2">
        <FiTool /> My Repair Deliveries
      </h2>

      {repairs.length === 0 && (
        <div className="text-gray-500 dark:text-gray-400">No repairs assigned</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {repairs.map((r) => (
          <div
            key={r.id}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg transition p-5 flex flex-col justify-between"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                <FiTool /> Repair # {r.id}
              </div><br />
           
              {r.userAddress && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-lg mt-1">
                  <FiMapPin /> {r.userAddress.street}, {r.userAddress.city}
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 text-lg mt-1">
                <FiDollarSign /> Price: {r.price} EGP
              </div>
              <div className="mt-2 dark:bg-gray-700 dark:text-white flex justify-between items-center p-3 rounded-3xl text-sm font-medium">
                Status: <span className="text-indigo-600 dark:text-indigo-400">{r.status}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-auto">
              <button
                onClick={() => handleUpdateStatus(r)}
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

export default MyRepairs;