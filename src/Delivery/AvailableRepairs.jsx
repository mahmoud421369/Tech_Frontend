import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { FiTool, FiUser, FiHome, FiDollarSign } from "react-icons/fi";
import { getAvailableRepairs, acceptRepair, rejectRepair } from "../api/deliveryApi";

const AvailableRepairs = () => {
  const token = localStorage.getItem("authToken");
  const [repairs, setRepairs] = useState([]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const load = async () => {
    try {
      const data = await getAvailableRepairs(token);
      setRepairs(data.content || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptRepair(token, id);
      Swal.fire("Accepted", "Repair accepted for pickup", "success");
      load();
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to accept", "error");
    }
  };

  const handleReject = async (id) => {
    const { value: reason } = await Swal.fire({
      title: "Reject repair",
      input: "textarea",
      inputPlaceholder: "Reason (optional)",
      showCancelButton: true,
    });
    if (reason === undefined) return;
    try {
      await rejectRepair(token, id);
      Swal.fire("Rejected", "Repair rejected", "success");
      load();
    } catch (err) {
      Swal.fire("Error", err.message || "Failed to reject", "error");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <h2 className="text-3xl font-bold mb-6 text-blue-600 dark:text-indigo-400 flex items-center gap-2">
        <FiTool /> Available Repairs
      </h2>

      {repairs.length === 0 && (
        <div className="text-gray-500 dark:text-gray-400">No available repairs</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {repairs.map((r) => (
          <div
            key={r.id}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-lg transition p-5 flex flex-col justify-between"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-lg">
                <FiTool /> Repair {r.id}
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 text-sm mt-2">
                <FiDollarSign /> Price: {r.price} EGP
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs mt-1">
                <FiUser /> User: {r.userId}
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs mt-1">
                <FiHome /> Address: {r.userAddress?.street}, {r.userAddress?.city}
              </div>
              <div className="mt-2 text-sm font-medium">
                Status: <span className="text-indigo-600 dark:text-indigo-400">{r.status}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-auto">
              <button
                onClick={() => handleAccept(r.id)}
                className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Accept
              </button>
              <button
                onClick={() => handleReject(r.id)}
                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableRepairs;