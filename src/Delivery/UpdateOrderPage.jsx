import React, { useState } from "react";
import Header from "../components/Header";

const UpdateOrderPage = () => {
  const [status, setStatus] = useState("Pending");

  const handleUpdate = () => {
    alert(`Order updated to: ${status}`);
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <Header />
      <div className="p-6">
        <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-blue-700 mb-4">Update Order Status</h2>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 w-full mb-4"
          >
            <option>Pending</option>
            <option>Out for Delivery</option>
            <option>Delivered</option>
          </select>
          <button
            onClick={handleUpdate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateOrderPage;