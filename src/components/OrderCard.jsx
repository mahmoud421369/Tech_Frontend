import React from "react";

const OrderCard = ({ order, onAccept, onReject }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-blue-200">
      <h3 className="font-bold text-lg text-blue-700">Order #{order.id}</h3>
      <p className="text-gray-600">Customer: {order.customer}</p>
      <p className="text-gray-600">Address: {order.address}</p>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onAccept}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          Accept
        </button>
        <button
          onClick={onReject}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default OrderCard;