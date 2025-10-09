import React from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiClipboard, FiTool, FiList, FiBox, FiTable, FiRefreshCcw } from 'react-icons/fi';
import { RiToolsLine, RiRefreshLine } from '@remixicon/react';

const AssignerDashboard = ({ darkMode }) => {
  const cards = [
    { title: 'Delivery Persons', icon: <FiUsers />, path: '/assigner/delivery-persons' },
    { title: 'Orders for Assignment', icon: <FiClipboard />, path: '/assigner/orders' },
    { title: 'Repair Requests', icon: <FiTool />, path: '/assigner/repair-requests' },
    { title: 'Logs', icon: <FiList />, path: '/assigner/assignment-logs' },
    { title: 'Assigned Orders', icon: <FiBox />, path: '/assigner/assigned-orders' },
    { title: 'Assigned Repairs', icon: <FiTool />, path: '/assigner/assigned-repairs' },
    { title: 'Reassign Repairs', icon: <FiRefreshCcw />, path: '/assigner/reassign-repairs' },
    { title: 'Reassign Orders', icon: <FiRefreshCcw />, path: '/assigner/reassign-orders' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300 animate-fade-in">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {cards.map((card, index) => (
          <Link
            to={card.path}
            key={index}
            className="bg-white dark:bg-gray-950 rounded-xl shadow-md p-6 flex flex-col items-center justify-between gap-4 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="text-4xl text-indigo-500 dark:text-indigo-400">{card.icon}</div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
              {card.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AssignerDashboard;