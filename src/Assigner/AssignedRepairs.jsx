import React, { useState } from "react";
import { FiUser, FiTool, FiHome, FiDollarSign, FiPackage, FiSearch } from "react-icons/fi";
import Swal from "sweetalert2";

const AssignedRepairs = () => {
  const token = localStorage.getItem("authToken");
  const [deliveryId, setDeliveryId] = useState("");
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRepairs = async () => {
    if (!deliveryId) {
      Swal.fire("خطأ", "Please enter a delivery ID", "warning");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:8080/api/assigner/delivery/${deliveryId}/repairs`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch repairs");

      const data = await res.json();
      setRepairs(data.content || data || []);
    } catch (err) {
      Swal.fire("خطأ", "Failed to fetch repairs", "error");
      setRepairs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <h2 className="text-2xl font-bold mb-6 text-blue-600 flex items-center gap-2">
        <FiTool /> Assigned Repairs by Delivery
      </h2>


      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={deliveryId}
          onChange={(e) => setDeliveryId(e.target.value)}
          placeholder="Enter Delivery ID"
          className="border p-2 rounded w-64 focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button
          onClick={fetchRepairs}
          className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-1 hover:bg-blue-700 transition"
        >
          <FiSearch /> Get Repairs
        </button>
      </div>

   
      {loading ? (
        <div className="text-center text-blue-500">Loading...</div>
      ) : repairs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repairs.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl shadow p-5 border hover:shadow-lg transition"
            >
              <div className="flex items-center gap-2 mb-3 text-blue-500">
                <FiPackage /> <span className="font-semibold">Repair ID: {r.id}</span>
              </div>

              <div className="text-gray-700 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FiUser className="text-blue-400" /> User: {r.userId}
                </div>
                <div className="flex items-center gap-2">
                  <FiHome className="text-blue-400" /> Shop: {r.shopId}
                </div>
                <div className="flex items-center gap-2">
                  <FiTool className="text-blue-400" /> Status: {r.status}
                </div>
                <div className="flex items-center gap-2">
                  <FiDollarSign className="text-green-500" /> Price: ${r.price}
                </div>
            
                {/* {r.userAddress && (
                  <div className="flex items-center gap-2">
                    <FiHome className="text-gray-400" /> 
                    Address: {r.userAddress.street}, {r.userAddress.city}, {r.userAddress.state}
                  </div>
                )} */}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-10">No repairs found</div>
      )}
    </div>
  );
};

export default AssignedRepairs;