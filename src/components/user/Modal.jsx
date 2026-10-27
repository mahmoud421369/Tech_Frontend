import React from "react";
import { FiX } from "react-icons/fi";

const Modal = ({ title, children, onClose }) => {
  return (
    <div className="fixed  inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="relative bg-white dark:bg-gray-950 rounded-md shadow-lg w-full max-w-lg p-6">
       
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-900 pb-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-red-500 dark:text-gray-300"
          >
            <FiX size={22} />
          </button>
        </div>

    
        <div className="max-h-[60vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;