import React, { memo, useMemo } from "react";
import {
  FiTool,
  FiTruck,
  FiShield,
  FiCheckCircle,
  FiStar,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { RiSmartphoneLine, RiShoppingCartLine } from "react-icons/ri";

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1]
    }
  })
};

const ServiceCard = memo(({ icon: Icon, title, desc, accent, index, darkMode }) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-20px" }}
    whileHover={{ y: -5, transition: { duration: 0.3 } }}
    className={`relative group overflow-hidden rounded-[1.5rem] border p-6 transition-all duration-500
      hover:shadow-xl
      ${darkMode
        ? "bg-gray-900/40 border-gray-800 backdrop-blur-xl hover:border-gray-700"
        : "bg-white border-gray-100 hover:border-gray-200"
      }`}
  >
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1.5rem] pointer-events-none`}
      style={{
        padding: '1px',
        background: `linear-gradient(135deg, ${accent}, transparent 60%)`,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude'
      }}
    />

    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg relative transition-transform duration-500 group-hover:scale-110 overflow-hidden"
    >
        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500" 
             style={{ background: `linear-gradient(135deg, ${accent}, #000)` }} />
        <div className="absolute inset-0 backdrop-blur-sm" />
        <Icon className="w-6 h-6 relative z-10" style={{ color: accent }} />
    </div>

    <h3 className={`text-xl font-bold mb-2 tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
      {title}
    </h3>
    <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
      {desc}
    </p>

    <div
      className="absolute bottom-4 right-4 w-1 h-1 rounded-full opacity-20 group-hover:opacity-100 transition-all duration-300 group-hover:scale-[3]"
      style={{ background: accent }}
    />
  </motion.div>
));

const Service = memo(({ darkMode = false }) => {
  const services = useMemo(() => [
    {
      icon: FiTool,
      title: "Expert Repairs",
      desc: "Certified technicians restoring your devices to factory perfection.",
      accent: "#22c55e",
    },
    {
      icon: RiSmartphoneLine,
      title: "Premium Devices",
      desc: "An elite selection of handpicked, fully certified smartphones.",
      accent: "#6366f1",
    },
    {
      icon: RiShoppingCartLine,
      title: "Seamless Sales",
      desc: "Instant checkout with flexible trade-in options.",
      accent: "#06b6d4",
    },
    {
      icon: FiTruck,
      title: "Priority Shipping",
      desc: "Next-day nationwide delivery with real-time tracking.",
      accent: "#3b82f6",
    },
    {
      icon: FiShield,
      title: "Ironclad Warranty",
      desc: "Comprehensive 12-month protection plans for peace of mind.",
      accent: "#8b5cf6",
    },
    {
      icon: FiCheckCircle,
      title: "Quality First",
      desc: "Our 50-point inspection protocol ensures top standards.",
      accent: "#f59e0b",
    },
  ], []);

  return (
    <section className={`relative overflow-hidden py-16 lg:py-24 ${darkMode ? "bg-gray-950" : "bg-white"}`}>
     
     
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="mb-12">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="max-w-2xl"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold mb-4
                    bg-emerald-500/10 border-emerald-500/20 text-emerald-500 tracking-wider uppercase">
                    <FiStar className="w-3 h-3" />
                    The Industry Standard
                </div>

                <h2 className={`text-4xl sm:text-5xl font-black mb-4 tracking-tighter leading-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Modern <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Tech Care.</span>
                </h2>
                <p className={`text-base sm:text-lg max-w-xl ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Luxury service and technical excellence for the next generation of device support.
                </p>
            </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, i) => (
            <ServiceCard key={i} {...service} index={i} darkMode={darkMode} />
          ))}
        </div>
      </div>
    </section>
  );
});

export default Service;
