import React from "react";
import { FiTool, FiSmartphone, FiShoppingBag } from "react-icons/fi";
import { motion } from "framer-motion";

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${className}`}
  >
    {children}
  </div>
);

const Service = ({ darkMode }) => {
  return (
    <section
      className={`relative py-16 sm:py-20 overflow-hidden ${
        darkMode
          ? "bg-gradient-to-b from-black via-gray-900 to-black"
          : "bg-gradient-to-b from-white via-gray-50 to-white"
      }`}
    >
      
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className={`absolute top-10 left-10 w-20 h-20 rounded-full animate-float ${darkMode ? 'bg-lime-400' : 'bg-gray-300'}`}></div>
        <div className={`absolute top-20 right-12 w-28 h-28 rounded-full animate-float-slow ${darkMode ? 'bg-lime-500' : 'bg-gray-400'}`}></div>
        <div className={`absolute bottom-10 left-1/4 w-16 h-16 rounded-full animate-float ${darkMode ? 'bg-lime-600' : 'bg-gray-200'}`}></div>
        <div className={`absolute bottom-20 right-1/5 w-20 h-20 rounded-full animate-float-slow ${darkMode ? 'bg-lime-400' : 'bg-gray-300'}`}></div>
      </div>

      <div className="relative max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8 z-10">
     
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Our Services
          </h2>
          <p className={`mt-4 text-base sm:text-lg max-w-2xl mx-auto ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Professional device repair and trusted services with fast turnaround.
          </p>
        </motion.div>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {[
            { icon: <FiTool />, title: 'Expert Repairs', desc: 'Certified technicians who handle devices with care.' },
            { icon: <FiSmartphone />, title: 'Quality Devices', desc: 'Refurbished & tested devices ready for use.' },
            { icon: <FiShoppingBag />, title: 'Fast Delivery', desc: 'Get your device repaired and delivered quickly.' },
          ].map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
              viewport={{ once: true }}
            >
              <GlassCard className="text-center">
                <div className={`p-4 rounded-full w-fit mx-auto mb-4 ${
                  darkMode ? 'bg-lime-500/20 text-lime-400' : 'bg-lime-100 text-lime-600'
                }`}>
                  {React.cloneElement(service.icon, { className: 'w-8 h-8' })}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {service.title}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {service.desc}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

    
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
      `}</style>
    </section>
  );
};

export default Service;