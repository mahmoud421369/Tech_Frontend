import React from "react";
import {
  FiTool,
  FiSmartphone,
  FiShoppingBag,
} from "react-icons/fi";

const Service = ({ darkMode }) => {
  return (
    <section className={`bg-gradient-to-b ${darkMode ? 'from-gray-900 to-indigo-900' : 'from-indigo-600 to-blue-600'} relative py-20  text-white overflow-hidden`}>
      {/* Floating Bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-24 h-24 bg-indigo-400 opacity-20 rounded-full animate-float"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-blue-400 opacity-20 rounded-full animate-float-slow"></div>
        <div className="absolute bottom-10 left-1/3 w-16 h-16 bg-indigo-300 opacity-30 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-1/4 w-20 h-20 bg-blue-300 opacity-20 rounded-full animate-float-slow"></div>
      </div>

      <div className="relative max-w-6xl mx-auto text-center px-6 z-10">
        {/* Header */}
        <h2 className="text-4xl md:text-5xl font-extrabold text-white">
          Our Services
        </h2>
        <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
          Professional device repair and trusted services with fast turnaround.
        </p>

        {/* Service Cards with Glassmorphism */}
        <div className="grid md:grid-cols-3 gap-8 mt-14">
          {/* Expert Repairs */}
          <div className="p-8 bg-white/10 dark:bg-gray-800/10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 backdrop-blur-md border border-white/20 dark:border-gray-700/20">
            <div className="bg-indigo-500 p-4 rounded-full w-fit mx-auto shadow-md">
              <FiTool className="text-3xl text-white" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">
              Expert Repairs
            </h3>
            <p className="mt-2 text-white/80">
              Certified technicians who handle devices with care.
            </p>
          </div>

          {/* Quality Devices */}
          <div className="p-8 bg-white/10 dark:bg-gray-800/10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 backdrop-blur-md border border-white/20 dark:border-gray-700/20">
            <div className="bg-indigo-600 p-4 rounded-full w-fit mx-auto shadow-md">
              <FiSmartphone className="text-3xl text-white" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">
              Quality Devices
            </h3>
            <p className="mt-2 text-white/80">
              Refurbished & tested devices ready for use.
            </p>
          </div>

          {/* Fast Delivery */}
          <div className="p-8 bg-white/10 dark:bg-gray-800/10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 backdrop-blur-md border border-white/20 dark:border-gray-700/20">
            <div className="bg-indigo-700 p-4 rounded-full w-fit mx-auto shadow-md">
              <FiShoppingBag className="text-3xl text-white" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-white">
              Fast Delivery
            </h3>
            <p className="mt-2 text-white/80">
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
            transform: translateY(-20px) translateX(10px);
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
            transform: translateY(-15px) translateX(-10px);
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