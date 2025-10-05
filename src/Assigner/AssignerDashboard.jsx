import { RiRefreshLine, RiToolsLine } from "@remixicon/react";
import React from "react";
import { FiUsers, FiClipboard, FiTool, FiList, FiBox } from "react-icons/fi";
import { Link } from "react-router-dom";

const AssignerDashboard = () => {
  const cards = [
    { title: "Delivery Persons", icon: <FiUsers />, color: "bg-white",path:"/assigner/delivery-persons" },
    { title: "Orders for Assignment", icon: <FiClipboard />, color: "bg-white",path:"/assigner/orders" },
    { title: "Repair Requests",  icon: <FiTool />, color: "bg-white",path:"/assigner/repair-requests" },
    { title: "Logs", icon: <FiList />, color: "bg-white" ,path:"/assigner/assignment-logs" },
    { title: "Assigned Orders", icon: <FiBox />, color: "bg-white" ,path:"/assigner/assigned-orders" },
    { title: "Assigned Repairs", icon: <RiToolsLine />, color: "bg-white" ,path:"/assigner/assigned-repairs" },
    { title: "Reassign Repairs", icon: <RiRefreshLine />, color: "bg-white" ,path:"/assigner/reassign-repairs" },
    { title: "Reassign Orders", icon: <RiRefreshLine />, color: "bg-white" ,path:"/assigner/reassign-orders" },

  ];

  return (
    <div className="min-h-screen bg-gray-50 mb-6    dark:bg-gray-900">
    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 p-6 bg-gray-50 dark:bg-gray-900 ">
      {cards.map((c, i) => (
        <Link
        to = {c.path}
          key={i}
          className={`bg-white dark:bg-gray-950 rounded-2xl shadow hover:shadow-2xl transition transform hover:scale-105 p-6 flex flex-col justify-between gap-4 items-center ${c.color}`}
        >
          <div className="text-3xl text-blue-500 ">{c.icon}</div>
          <div>
            <p className="text-xl text-indigo-400 dark:text-white">{c.title}</p>
        
          </div>
        </Link>
      ))}
    </div>
    </div>
  );
};

export default AssignerDashboard;