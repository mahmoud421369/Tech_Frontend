import React, { useState } from "react";
import Header from "../components/Header";
import OrderCard from "../components/OrderCard";

const OrdersPage = () => {
  const [orders, setOrders] = useState([
    { id: 1, customer: "Ali Ahmed", address: "Cairo, Egypt" },
    { id: 2, customer: "Sara Mohamed", address: "Giza, Egypt" },
  ]);

  const handleAccept = (id) => {
    alert(`Order ${id} accepted`);
  };

  const handleReject = (id) => {
    alert(`Order ${id} rejected`);
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <Header />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            onAccept={() => handleAccept(o.id)}
            onReject={() => handleReject(o.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;