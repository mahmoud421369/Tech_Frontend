// src/components/NotificationsDelivery.jsx
import React, { useEffect, useState } from "react";
import { getAssignedOrdersNotifications, getAssignedRepairsNotifications } from "../api/deliveryApi";

const NotificationsDelivery = ({ onClose }) => {
  const token = localStorage.getItem("authToken");
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [repairs, setRepairs] = useState([]);

  useEffect(() => {
    if (tab === "orders") {
      getAssignedOrdersNotifications(token).then(setOrders).catch(console.error);
    } else {
      getAssignedRepairsNotifications(token).then(setRepairs).catch(console.error);
    }
  }, [tab, token]);

  return (
    <div className="w-96 bg-white rounded shadow-lg">
      <div className="flex">
        <button onClick={() => setTab("orders")} className={`flex-1 py-2 ${tab==='orders'?'bg-indigo-100':''}`}>Orders</button>
        <button onClick={() => setTab("repairs")} className={`flex-1 py-2 ${tab==='repairs'?'bg-indigo-100':''}`}>Repairs</button>
      </div>

      <div className="p-3 max-h-72 overflow-y-auto">
        {tab === "orders" ? (
          orders.length === 0 ? (
            <p className="text-sm text-gray-500">No assigned orders</p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="p-2 border-b">
                <div className="font-medium">{o.userId}</div>
                <div className="text-xs text-gray-500">{o.status} • {new Date(o.createdAt).toLocaleString()}</div>
              </div>
            ))
          )
        ) : repairs.length === 0 ? (
          <p className="text-sm text-gray-500">No assigned repairs</p>
        ) : (
          repairs.map((r) => (
            <div key={r.id} className="p-2 border-b">
              <div className="font-medium">Repair #{r.id}</div>
              <div className="text-xs text-gray-500">{r.status} • {new Date(r.createdAt).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1 rounded bg-gray-100">Close</button>
      </div>
    </div>
  );
};

export default NotificationsDelivery;