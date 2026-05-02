import React from "react";
import {
  FiTool,
  FiTruck,
  FiShield,
  FiCheckCircle,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { RiSmartphoneLine, RiShoppingCartLine } from "react-icons/ri";




const WaveTop = ({ darkMode }) => (
  <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-10 md:h-16" preserveAspectRatio="none">
      <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,20 1440,40 L1440,0 L0,0 Z"
        fill={darkMode ? "#111827" : "#f9fafb"} />
    </svg>
  </div>
);

const WaveBottom = ({ darkMode }) => (
  <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-10 md:h-16" preserveAspectRatio="none">
      <path d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1380,20 1440,40 L1440,80 L0,80 Z"
        fill={darkMode ? "#111827" : "#f9fafb"} />
    </svg>
  </div>
);




const ServiceCard = ({ icon: Icon, title, desc, accent, index, darkMode }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.08 }}
    viewport={{ once: true }}
    whileHover={{ y: -8, scale: 1.02 }}
    className={`relative group overflow-hidden rounded-2xl border-2 p-7 transition-all duration-300
      hover:shadow-2xl cursor-default
      ${darkMode
        ? "bg-gray-800 border-gray-700 hover:border-opacity-60"
        : "bg-white border-gray-200"
      }`}
  >

    <div
      className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
      style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }}
    />


    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
      style={{ boxShadow: `0 0 40px ${accent}22` }}
    />


    <div
      className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
      style={{ background: accent }}
    />


    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
      style={{ background: `linear-gradient(135deg, ${accent}, ${accent}bb)` }}
    >
      <Icon className="w-7 h-7 text-white" />
    </div>

    <h3 className={`text-xl font-extrabold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
      {title}
    </h3>
    <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
      {desc}
    </p>


    <div
      className="absolute bottom-5 right-5 w-2 h-2 rounded-full opacity-40 group-hover:opacity-80 transition-opacity duration-300"
      style={{ background: accent }}
    />
  </motion.div>
);




const Service = ({ darkMode = false }) => {
  const services = [
    {
      icon: FiTool,
      title: "Expert Repairs",
      desc: "Professional repairs by certified technicians using genuine parts for all device types.",
      accent: "#16a34a",
    },
    {
      icon: RiSmartphoneLine,
      title: "Premium Devices",
      desc: "Handpicked refurbished smartphones and laptops — fully tested and certified.",
      accent: "#6366f1",
    },
    {
      icon: RiShoppingCartLine,
      title: "Easy Purchase",
      desc: "Buy new or refurbished devices with flexible payment options and warranty.",
      accent: "#0d9488",
    },
    {
      icon: FiTruck,
      title: "Fast Delivery",
      desc: "Quick and secure nationwide delivery with real-time tracking.",
      accent: "#3b82f6",
    },
    {
      icon: FiShield,
      title: "Warranty Included",
      desc: "Up to 12 months warranty on repairs and refurbished devices.",
      accent: "#8b5cf6",
    },
    {
      icon: FiCheckCircle,
      title: "Quality Guaranteed",
      desc: "100% satisfaction with rigorous testing and quality checks.",
      accent: "#f59e0b",
    },
  ];

  return (
    <section
      className={`relative overflow-hidden py-24 lg:py-32 ${darkMode ? "bg-gray-950" : "bg-white"
        }`}
    >

      <WaveTop darkMode={darkMode} />
      <WaveBottom darkMode={darkMode} />


      <div className="absolute top-16 left-10 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: "6s" }} />
      <div className="absolute bottom-16 right-10 w-80 h-80 rounded-full bg-lime-500/5 blur-3xl animate-pulse pointer-events-none" style={{ animationDuration: "8s" }} />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">


        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold mb-6
            bg-lime-500/10 border-lime-500/30 text-lime-600 dark:text-lime-400">
            <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
            Everything under one roof
          </div>

          <h2 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-emerald-600 via-lime-500 to-teal-500 bg-clip-text text-transparent mb-5">
            Our Services
          </h2>
          <p className={`text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Comprehensive solutions for device repair, sales, and support — all in one place.
          </p>
        </motion.div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, i) => (
            <ServiceCard key={i} {...service} index={i} darkMode={darkMode} />
          ))}
        </div>


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`mt-16 p-8 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-6 ${darkMode
              ? "bg-gray-800/60 border-gray-700 backdrop-blur-md"
              : "bg-gray-50 border-gray-200"
            }`}
        >
          <div>
            <h3 className={`text-xl font-extrabold mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Ready to get started?
            </h3>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Book a repair or browse devices — it takes less than 2 minutes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <motion.a
              whileTap={{ scale: 0.97 }}
              href="/repair"
              className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-lime-500 to-emerald-600
                shadow-lg shadow-lime-500/30 hover:shadow-lime-500/50 hover:-translate-y-0.5 transition-all duration-300"
            >
              Book a Repair
            </motion.a>
            <motion.a
              whileTap={{ scale: 0.97 }}
              href="/devices"
              className={`px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all duration-300 hover:-translate-y-0.5 ${darkMode
                  ? "border-gray-600 text-gray-300 hover:border-lime-500 hover:text-lime-400"
                  : "border-gray-300 text-gray-700 hover:border-lime-500 hover:text-lime-600"
                }`}
            >
              Browse Devices
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Service;