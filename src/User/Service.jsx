import React, { memo } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

const palette = (darkMode) => ({
  line: darkMode ? "#34d399" : "#059669",
  lineSoft: darkMode ? "#6ee7b7" : "#10b981",
  fillSoft: darkMode ? "rgba(16,185,129,0.14)" : "rgba(16,185,129,0.1)",
  fillCard: darkMode ? "#0b1a12" : "#ffffff",
  cardBorder: darkMode ? "rgba(52,211,153,0.25)" : "rgba(5,150,105,0.18)",
  accent: "#f59e0b",
});

const RepairIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <m.circle cx="100" cy="102" r="70" fill={c.fillSoft}
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
      <rect x="70" y="55" width="60" height="96" rx="12" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
      <rect x="80" y="67" width="40" height="60" rx="4" fill={c.fillSoft} />
      {[0, 1, 2].map((i) => (
        <m.line key={i}
          x1={86 + i * 10} y1="76" x2={86 + i * 10} y2="118"
          stroke={c.accent} strokeWidth="1.6"
          animate={{ opacity: [0.15, 0.6, 0.15] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
        />
      ))}
      <m.g
        animate={{ rotate: [-16, 6, -16] }}
        style={{ transformOrigin: "142px 58px" }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="136" y="32" width="10" height="42" rx="3" fill={c.fillCard} stroke={c.line} strokeWidth="2" />
        <path d="M130,32 L152,32 L148,22 L134,22 Z" fill="none" stroke={c.line} strokeWidth="2" strokeLinejoin="round" />
      </m.g>
    </svg>
  );
});

const DevicesIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <m.rect x="34" y="96" width="104" height="66" rx="8" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5"
        animate={{ y: [96, 90, 96] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
      <rect x="44" y="104" width="84" height="44" rx="4" fill={c.fillSoft} />
      <rect x="70" y="160" width="28" height="5" rx="2" fill={c.cardBorder} />
      <m.g
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      >
        <rect x="108" y="42" width="52" height="90" rx="10" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
        <rect x="116" y="54" width="36" height="56" rx="3" fill={c.fillSoft} />
        <circle cx="134" cy="120" r="4" fill="none" stroke={c.line} strokeWidth="1.6" />
      </m.g>
      <m.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.15, 1], opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6, ease: EASE }}
      >
        <circle cx="56" cy="70" r="14" fill={c.accent} />
        <path d="M50,70 L54,75 L63,64" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </m.g>
    </svg>
  );
});

const ShippingIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <path d="M20,150 C60,150 55,90 95,78 C130,66 130,44 170,44"
        fill="none" stroke={c.cardBorder} strokeWidth="2.5" strokeDasharray="1 8" strokeLinecap="round" />
      <m.circle r="5" fill={c.line}
        animate={{ offsetDistance: ["0%", "100%"] }}
        style={{ offsetPath: "path('M20,150 C60,150 55,90 95,78 C130,66 130,44 170,44')" }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
      />
      <circle cx="20" cy="150" r="4.5" fill={c.fillCard} stroke={c.line} strokeWidth="2" />
      <m.circle cx="170" cy="44" r="9" fill="none" stroke={c.accent} strokeWidth="2"
        animate={{ scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} />
      <circle cx="170" cy="44" r="5" fill={c.accent} />
      <m.g
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="70" y="106" width="46" height="36" rx="6" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
        <path d="M70,116 L93,130 L116,116" fill="none" stroke={c.lineSoft} strokeWidth="1.8" />
        <line x1="93" y1="130" x2="93" y2="142" stroke={c.lineSoft} strokeWidth="1.8" />
      </m.g>
    </svg>
  );
});

const WarrantyIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <m.circle cx="100" cy="100" r="68" fill="none" stroke={c.cardBorder} strokeWidth="1.6" strokeDasharray="3 8"
        animate={{ rotate: 360 }} style={{ transformOrigin: "100px 100px" }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />
      <path d="M100,42 L146,60 L146,98 C146,130 126,150 100,160 C74,150 54,130 54,98 L54,60 Z"
        fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
      <m.path
        d="M78,100 L94,116 L124,82"
        fill="none" stroke={c.line} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4, ease: EASE }}
      />
    </svg>
  );
});

// NEW — Data Recovery: a drive with a pulsing "recovering" scan line
const DataRecoveryIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <m.circle cx="100" cy="102" r="70" fill={c.fillSoft}
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
      <rect x="56" y="76" width="88" height="60" rx="10" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
      <circle cx="100" cy="106" r="20" fill="none" stroke={c.lineSoft} strokeWidth="2" />
      <circle cx="100" cy="106" r="4" fill={c.line} />
      <m.line x1="56" y1="90" x2="144" y2="90"
        stroke={c.accent} strokeWidth="2" strokeLinecap="round"
        animate={{ y1: [90, 122, 90], y2: [90, 122, 90], opacity: [0.9, 0.2, 0.9] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} />
      <m.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.15, 1], opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
      >
        <circle cx="146" cy="140" r="14" fill={c.accent} />
        <path d="M146,133 v9 M146,146 v1" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      </m.g>
    </svg>
  );
});

// NEW — Trade-In Program: two devices swapping places in a loop
const TradeInIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <m.circle cx="100" cy="102" r="70" fill={c.fillSoft}
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
      <m.g
        animate={{ x: [0, 14, 0], opacity: [1, 0.5, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="46" y="80" width="40" height="60" rx="8" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
        <rect x="52" y="88" width="28" height="38" rx="3" fill={c.fillSoft} />
      </m.g>
      <m.g
        animate={{ x: [0, -14, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="114" y="66" width="40" height="60" rx="8" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
        <rect x="120" y="74" width="28" height="38" rx="3" fill={c.fillSoft} />
      </m.g>
      <m.path
        d="M92,150 a20,20 0 1,0 16,-8"
        fill="none" stroke={c.line} strokeWidth="3" strokeLinecap="round"
        animate={{ rotate: 360 }} style={{ transformOrigin: "100px 150px" }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <path d="M104,138 L110,144 L104,150" fill="none" stroke={c.line} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

const services = [
  {
    Illustration: RepairIllustration,
    title: "Expert Repairs",
    desc: "Certified technicians restoring your devices to factory perfection with precision and care.",
  },
  {
    Illustration: DevicesIllustration,
    title: "Premium Devices",
    desc: "An elite selection of handpicked, fully certified smartphones and gadgets.",
  },
  {
    Illustration: ShippingIllustration,
    title: "Priority Shipping",
    desc: "Fast nationwide delivery with real-time tracking and insurance.",
  },
  {
    Illustration: WarrantyIllustration,
    title: "Ironclad Warranty",
    desc: "Comprehensive 12-month protection plans for complete peace of mind.",
  },
  {
    Illustration: DataRecoveryIllustration,
    title: "Data Recovery",
    desc: "Secure retrieval of photos, files, and contacts from damaged or corrupted devices.",
  },
  {
    Illustration: TradeInIllustration,
    title: "Trade-In Program",
    desc: "Swap your old device for instant credit toward a certified upgrade.",
  },
];

const ServiceCard = memo(({ Illustration, title, desc, index, darkMode }) => (
  <m.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: (index % 3) * 0.08, ease: EASE }}
    viewport={{ once: true }}
    whileHover={{ y: -8, scale: 1.01 }}
    className={`group relative rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-xl h-full
      flex flex-col items-center text-center gap-5
      ${darkMode
        ? "bg-gray-900 border-emerald-500/20 hover:border-emerald-500/50"
        : "bg-white border-gray-100 hover:border-emerald-300 shadow-sm"
      }`}
  >
    <m.div
      className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: (index % 3) * 0.3 }}
      whileHover={{ scale: 1.06, transition: { duration: 0.3, ease: EASE } }}
    >
      <Illustration darkMode={darkMode} />
    </m.div>

    <div className="flex-1">
      <h3 className={`text-xl font-semibold mb-2 tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
        {title}
      </h3>
      <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        {desc}
      </p>
      <div className="mt-4 h-0.5 w-12 mx-auto bg-gradient-to-r from-emerald-400 to-lime-400 rounded-full opacity-60 group-hover:opacity-100 group-hover:w-16 transition-all" />
    </div>
  </m.div>
));

const Service = memo(({ darkMode = false }) => {
  return (
    <LazyMotion features={domAnimation}>
      <section className={`py-20 lg:py-24 ${darkMode ? "bg-gray-950" : "bg-zinc-50"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-5xl lg:text-6xl font-bold tracking-tighter mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Modern <span className="text-emerald-500">TechCare</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <ServiceCard
                key={service.title}
                {...service}
                index={i}
                darkMode={darkMode}
              />
            ))}
          </div>
        </div>
      </section>
    </LazyMotion>
  );
});

export default memo(Service);