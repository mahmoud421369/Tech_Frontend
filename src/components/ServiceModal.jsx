
import React from 'react';
import { FiX } from 'react-icons/fi';

const ServiceModal = ({ services, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-lg font-semibold text-gray-800">Shop Services</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-4">
          <ul className="space-y-3">
            {services.map((service, index) => (
              <li 
                key={index} 
                className="flex items-start p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 mt-1 mr-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <span className="text-gray-700">{service}</span>
              </li>
            ))}
            
            {services.length === 0 && (
              <li className="text-center py-6 text-gray-500">
                No services available for this shop
              </li>
            )}
          </ul>
        </div>
        
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;