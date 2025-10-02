import { RiRefreshLine, RiToolsLine } from "@remixicon/react";
import React from "react";
import { FiUsers, FiClipboard, FiTool, FiList, FiBox } from "react-icons/fi";
import { Link } from "react-router-dom";

const AssignerDashboard = () => {
  const cards = [
    { title: "Delivery Persons", count: 12, icon: <FiUsers />, color: "bg-white",path:"/assigner/delivery-persons" },
    { title: "Orders for Assignment", count: 34, icon: <FiClipboard />, color: "bg-white",path:"/assigner/orders" },
    { title: "Repair Requests", count: 8, icon: <FiTool />, color: "bg-white",path:"/assigner/repair-requests" },
    { title: "Logs", count: 58, icon: <FiList />, color: "bg-white" ,path:"/assigner/assignment-logs" },
    { title: "Assigned Orders", count: 58, icon: <FiBox />, color: "bg-white" ,path:"/assigner/assigned-orders" },
    { title: "Assigned Repairs", count: 58, icon: <RiToolsLine />, color: "bg-white" ,path:"/assigner/assigned-repairs" },
    { title: "Reassign Repairs", count: 58, icon: <RiRefreshLine />, color: "bg-white" ,path:"/assigner/reassign-repairs" },
    { title: "Reassign Orders", count: 58, icon: <RiRefreshLine />, color: "bg-white" ,path:"/assigner/reassign-orders" },

  ];

  return (
    <div className="min-h-screen bg-gray-50 mb-6    dark:bg-gray-900">
    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 p-6 bg-gray-50 dark:bg-gray-900 ">
      {cards.map((c, i) => (
        <Link
        to = {c.path}
          key={i}
          className={`bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-2xl transition transform hover:scale-105 p-6 flex flex-col justify-between gap-4 items-center ${c.color}`}
        >
          <div className="text-3xl text-blue-500 ">{c.icon}</div>
          <div>
            <p className="text-xl text-indigo-400 dark:text-white">{c.title}</p>
            {/* <p className="font-bold text-2xl text-gray-500">{c.count}</p> */}
          </div>
        </Link>
      ))}
    </div>
    </div>
  );
};

export default AssignerDashboard;