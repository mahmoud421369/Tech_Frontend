import React from "react";
import { FiTool, FiSmartphone, FiShoppingBag, FiCheckCircle, FiTruck, FiShield } from "react-icons/fi";
import { motion } from "framer-motion";

const GradientBorderCard = ({ children, className = "" }) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-lime-500 rounded-3xl blur opacity-40 group-hover:opacity-70 transition duration-700"></div>
    <div className="relative bg-white dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-500">
      {children}
    </div>
  </div>
);

const Service = ({ darkMode }) => {
  const services = [
    {
      icon: <FiTool className="w-12 h-12" />,
      title: "Expert Repairs",
      desc: "Professional repairs by certified technicians using genuine parts for all device types.",
    },
    {
      icon: <FiSmartphone className="w-12 h-12" />,
      title: "Premium Devices",
      desc: "Handpicked refurbished smartphones and laptops — fully tested and certified.",
    },
    {
      icon: <FiShoppingBag className="w-12 h-12" />,
      title: "Easy Purchase",
      desc: "Buy new or refurbished devices with flexible payment options and warranty.",
    },
    {
      icon: <FiTruck className="w-12 h-12" />,
      title: "Fast Delivery",
      desc: "Quick and secure nationwide delivery with real-time tracking.",
    },
    {
      icon: <FiShield className="w-12 h-12" />,
      title: "Warranty Included",
      desc: "Up to 12 months warranty on repairs and refurbished devices.",
    },
    {
      icon: <FiCheckCircle className="w-12 h-12" />,
      title: "Quality Guaranteed",
      desc: "100% satisfaction with rigorous testing and quality checks.",
    },
  ];

  return (
    <section
      className={`relative py-20 overflow-hidden ${
        darkMode
          ? "bg-gradient-to-b from-gray-900 via-black to-gray-900"
          : "bg-gradient-to-b from-gray-50 via-white to-gray-50"
      }`}
    >
    
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-emerald-400/20 animate-float"></div>
        <div className="absolute top-32 right-16 w-40 h-40 rounded-full bg-lime-400/20 animate-float-slow"></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 rounded-full bg-emerald-500/20 animate-float"></div>
        <div className="absolute bottom-32 right-1/4 w-36 h-36 rounded-full bg-lime-500/20 animate-float-slow"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center z-10">
       
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className={`text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-emerald-600 to-lime-500 bg-clip-text text-transparent`}>
            Our Services
          </h2>
          <p className={`mt-6 text-lg sm:text-xl max-w-3xl mx-auto ${
            darkMode ? "text-gray-300" : "text-gray-600"
          }`}>
            Comprehensive solutions for device repair, sales, and support — all under one roof.
          </p>
        </motion.div>

       
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-16">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <GradientBorderCard>
                <div className="flex flex-col items-center text-center">
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-lime-500/20 text-emerald-600 dark:text-emerald-400 mb-6">
                    {service.icon}
                  </div>
                  <h3 className={`text-2xl font-bold mb-4 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}>
                    {service.title}
                  </h3>
                  <p className={`text-base leading-relaxed ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {service.desc}
                  </p>
                </div>
              </GradientBorderCard>
            </motion.div>
          ))}
        </div>
      </div>

      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default Service;