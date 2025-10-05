import React, { useState, useEffect } from "react";
import { FiUser, FiTool, FiHome, FiDollarSign, FiPackage, FiSearch } from "react-icons/fi";
import Swal from "sweetalert2";

const AssignedOrders = () => {
  const token = localStorage.getItem("authToken");
  const [deliveryId, setDeliveryId] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);




  const fetchOrders = async () => {
    if (!deliveryId) {
      Swal.fire("خطأ", "Please enter a delivery ID", "warning");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:8080/api/assigner/delivery/${deliveryId}/orders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      console.log(data.content || data || [])
      setOrders(data.content || data || []);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch orders", "error");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
          <FiTool /> Assigned Orders by Delivery
        </h2>
       
      </div>


      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={deliveryId}
          onChange={(e) => setDeliveryId(e.target.value)}
          placeholder="Enter Delivery ID"
          className="border p-2 rounded w-64 focus:outline-none focus:ring focus:ring-blue-300 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-1 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
        >
          <FiSearch /> Get Orders
        </button>
      </div>

      {loading ? (
        <div className="text-center text-blue-500 py-10">Loading...</div>
      ) : orders.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 border hover:shadow-lg transition"
            >
              <div className="flex items-center gap-2 mb-3 text-blue-500">
                <FiPackage /> <span className="font-semibold">Order ID: {o.id}</span>
              </div>

              <div className="text-gray-700 dark:text-gray-200 space-y-2 text-sm">

                          {o.userAddress && (
                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                              <strong>User Address:</strong> {o.userAddress.street}, {o.userAddress.city}, {o.userAddress.state}
                            </div>
                          )}
          
                <div className="flex items-center gap-2">
                  <FiTool className="text-blue-400" /> Status: {o.status}
                </div>
                <div className="flex items-center gap-2">
                  <FiDollarSign className="text-green-500" /> Price: {o.totalPrice} EGP
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">No orders found</div>
      )}
    </div>
  );
};

export default AssignedOrders;