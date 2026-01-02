import React from "react";
import { FiTool, FiSmartphone, FiShoppingBag, FiCheckCircle, FiTruck, FiShield } from "react-icons/fi";
import { motion } from "framer-motion";


const GradientBorderCard = ({ children }) => (
  <div className="relative group">
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500 to-lime-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    <div
      className="relative bg-white dark:bg-gray-900  border-t-4 border-transparent bg-clip-padding
                  p-8 shadow-lg hover:shadow-xl transition-all duration-500
                 [background:padding-box_linear-gradient(white,_white),_border-box_linear-gradient(to_right,_#10b981,_#a3e635)]
                 dark:[background:padding-box_linear-gradient(#111,_#111),_border-box_linear-gradient(to_right,_#10b981,_#a3e635)]"
    >
      {children}
    </div>
  </div>
);

const Service = ({ darkMode = false }) => {
  const services = [
    {
      icon: FiTool,
      title: "Expert Repairs",
      desc: "Professional repairs by certified technicians using genuine parts for all device types.",
    },
    {
      icon: FiSmartphone,
      title: "Premium Devices",
      desc: "Handpicked refurbished smartphones and laptops — fully tested and certified.",
    },
    {
      icon: FiShoppingBag,
      title: "Easy Purchase",
      desc: "Buy new or refurbished devices with flexible payment options and warranty.",
    },
    {
      icon: FiTruck,
      title: "Fast Delivery",
      desc: "Quick and secure nationwide delivery with real-time tracking.",
    },
    {
      icon: FiShield,
      title: "Warranty Included",
      desc: "Up to 12 months warranty on repairs and refurbished devices.",
    },
    {
      icon: FiCheckCircle,
      title: "Quality Guaranteed",
      desc: "100% satisfaction with rigorous testing and quality checks.",
    },
  ];

  return (
    <section
      className={`py-16 lg:py-24 overflow-hidden ${
        darkMode
          ? "bg-gray-950"
          : "bg-gray-50"
      }`}
    >
 
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-emerald-500/5 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-lime-500/5 animate-pulse delay-1000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-emerald-600 to-lime-500 bg-clip-text text-transparent">
            Our Services
          </h2>
          <p className={`mt-6 text-lg sm:text-xl max-w-3xl mx-auto ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Comprehensive solutions for device repair, sales, and support — all under one roof.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <GradientBorderCard>
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-lime-500/10 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className={`mt-6 text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {service.title}
                    </h3>
                    <p className={`mt-4 text-base leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {service.desc}
                    </p>
                  </div>
                </GradientBorderCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Service;