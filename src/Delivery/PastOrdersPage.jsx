import React from "react";
import Header from "../components/Header";

const PastOrdersPage = () => {
  const pastOrders = [
    { id: 10, customer: "Omar Khaled", status: "Delivered" },
    { id: 11, customer: "Mona Ali", status: "Delivered" },
  ];

  return (
    <div className="min-h-screen bg-blue-50">
      <Header />
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-700 mb-4">Past Orders</h2>
        <div className="bg-white rounded-lg shadow-md p-4">
          <ul className="divide-y">
            {pastOrders.map((o) => (
              <li key={o.id} className="py-2 flex justify-between">
                <span>Order #{o.id} - {o.customer}</span>
                <span className="text-green-600">{o.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PastOrdersPage;