import React from "react";
import {
  FiSmartphone,
  FiMonitor,
  FiTablet,
  FiDatabase,
  FiTool,
  FiShoppingBag,
} from "react-icons/fi";

const Service = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-black">
      <div className="max-w-6xl mx-auto text-center px-6">
     
        <h2 className="text-4xl font-extrabold text-indigo-700 dark:text-white">
          Our Services
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Professional device repair and trusted services with fast turnaround.
        </p>

       
        <div className="grid md:grid-cols-3 gap-10 mt-14">
     
          <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="bg-indigo-600 p-4 rounded-full w-fit mx-auto shadow-md">
              <FiTool className="text-3xl text-white" />
            </div>
            <h3 className="mt-5 text-lg font-bold dark:text-white">
              Expert Repairs
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Certified technicians who handle devices with care.
            </p>
          </div>

   
          <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="bg-purple-600 p-4 rounded-full w-fit mx-auto shadow-md">
              <FiSmartphone className="text-3xl text-white" />
            </div>
            <h3 className="mt-5 text-lg font-bold dark:text-white">
              Quality Devices
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Refurbished & tested devices ready for use.
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="bg-indigo-500 p-4 rounded-full w-fit mx-auto shadow-md">
              <FiShoppingBag className="text-3xl text-white" />
            </div>
            <h3 className="mt-5 text-lg font-bold dark:text-white">
              Fast Delivery
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Get your device repaired and delivered quickly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Service;