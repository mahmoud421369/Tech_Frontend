import React from "react";
import { FiTool, FiSmartphone, FiShoppingBag } from "react-icons/fi";

const Service = ({ darkMode }) => {
  return (
    <section
      className={`relative py-16 sm:py-20 ${
        darkMode
          ? "bg-gradient-to-b from-gray-900 to-gray-800"
          : "bg-gradient-to-b from-white to-gray-100"
      } text-gray-900 dark:text-white overflow-hidden`}
    >
      {/* Floating Bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 sm:w-24 sm:h-24 bg-indigo-300 dark:bg-indigo-600 opacity-20 rounded-full animate-float"></div>
        <div className="absolute top-20 right-12 sm:right-20 w-24 h-24 sm:w-32 sm:h-32 bg-blue-300 dark:bg-blue-600 opacity-20 rounded-full animate-float-slow"></div>
        <div className="absolute bottom-10 left-1/4 sm:left-1/3 w-16 h-16 bg-indigo-200 dark:bg-indigo-500 opacity-30 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-1/5 sm:right-1/4 w-16 h-16 sm:w-20 sm:h-20 bg-blue-200 dark:bg-blue-500 opacity-20 rounded-full animate-float-slow"></div>
      </div>

      <div className="relative max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8 z-10">
        {/* Header */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">
          Our Services
        </h2>
        <p className="mt-4 text-base sm:text-lg text-gray-700 dark:text-gray-200 max-w-xl sm:max-w-2xl mx-auto">
          Professional device repair and trusted services with fast turnaround.
        </p>

        {/* Service Cards with Glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-10 sm:mt-14">
          {/* Expert Repairs */}
          <div className="p-6 sm:p-8 bg-white/30 dark:bg-gray-800/30 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
            <div className="bg-indigo-500 p-3 sm:p-4 rounded-full w-fit mx-auto shadow-md">
              <FiTool className="text-2xl sm:text-3xl text-white" />
            </div>
            <h3 className="mt-4 sm:mt-5 text-lg sm:text-xl font-bold">
              Expert Repairs
            </h3>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Certified technicians who handle devices with care.
            </p>
          </div>

          {/* Quality Devices */}
          <div className="p-6 sm:p-8 bg-white/30 dark:bg-gray-800/30 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
            <div className="bg-indigo-600 p-3 sm:p-4 rounded-full w-fit mx-auto shadow-md">
              <FiSmartphone className="text-2xl sm:text-3xl text-white" />
            </div>
            <h3 className="mt-4 sm:mt-5 text-lg sm:text-xl font-bold">
              Quality Devices
            </h3>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Refurbished & tested devices ready for use.
            </p>
          </div>

          {/* Fast Delivery */}
          <div className="p-6 sm:p-8 bg-white/30 dark:bg-gray-800/30 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
            <div className="bg-indigo-700 p-3 sm:p-4 rounded-full w-fit mx-auto shadow-md">
              <FiShoppingBag className="text-2xl sm:text-3xl text-white" />
            </div>
            <h3 className="mt-4 sm:mt-5 text-lg sm:text-xl font-bold">
              Fast Delivery
            </h3>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Get your device repaired and delivered quickly.
            </p>
          </div>
        </div>
      </div>

      {/* Inline CSS for Floating Bubbles Animation */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-15px) translateX(8px);
          }
          100% {
            transform: translateY(0) translateX(0);
          }
        }
        @keyframes float-slow {
          0% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-10px) translateX(-8px);
          }
          100% {
            transform: translateY(0) translateX(0);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default Service;