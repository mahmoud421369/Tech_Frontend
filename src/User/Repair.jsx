import React, { useEffect, useState, useCallback, memo, useMemo, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import sanitizeHtml from "sanitize-html";
import { FaStar, FaStore, FaCheckCircle } from "react-icons/fa";
import { FiChevronRight, FiTool, FiChevronLeft, FiInfo, FiX, FiMail, FiPhone, FiCalendar, FiShield, FiMapPin } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import { RiDeviceLine, RiMap2Line } from "@remixicon/react";
import {
  RiCheckDoubleLine, RiCheckLine, RiCloseLine,
  RiPhoneLine, RiStore2Line,
} from "react-icons/ri";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Hero } from "../components";

const queryClient = new QueryClient();

const FAST = { duration: 0.18, ease: [0.16, 1, 0.3, 1] };
const FASTER = { duration: 0.12, ease: [0.16, 1, 0.3, 1] };
const EASE = [0.16, 1, 0.3, 1];

const palette = (darkMode) => ({
  line: darkMode ? "#34d399" : "#059669",
  lineSoft: darkMode ? "#6ee7b7" : "#10b981",
  fillSoft: darkMode ? "rgba(52,211,153,0.14)" : "rgba(52,211,153,0.12)",
  fillCard: darkMode ? "#0b1a12" : "#ffffff",
  cardBorder: darkMode ? "rgba(52,211,153,0.25)" : "rgba(5,150,105,0.18)",
  accent: "#f59e0b",
  danger: "#ef4444",
});

const WaveBottom = memo(({ darkMode }) => (
  <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
    <svg viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg"
      className="relative block w-full h-12 md:h-20" preserveAspectRatio="none">
      <path d="M0,50 C180,100 360,0 540,50 C720,100 900,0 1080,50 C1260,100 1380,20 1440,50 L1440,100 L0,100 Z"
        fill={darkMode ? "#111827" : "#f9fafb"} />
    </svg>
  </div>
));

const DescribeIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle cx="100" cy="102" r="70" fill={c.fillSoft}
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
      <rect x="58" y="46" width="84" height="112" rx="12" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
      {[0, 1, 2, 3].map((i) => (
        <motion.line key={i}
          x1="72" y1={70 + i * 16} x2={i === 3 ? 108 : 128} y2={70 + i * 16}
          stroke={c.lineSoft} strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.3 + i * 0.15, ease: EASE, repeat: Infinity, repeatDelay: 2.4 }}
        />
      ))}
      <motion.rect x="150" y="132" width="3" height="18" fill={c.line}
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }} />
      <motion.g
        animate={{ rotate: [-8, 8, -8] }}
        style={{ transformOrigin: "146px 150px" }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="146" cy="150" r="16" fill="none" stroke={c.accent} strokeWidth="3" />
        <line x1="157" y1="161" x2="168" y2="172" stroke={c.accent} strokeWidth="4" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
});

const CategoryPickIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  const cells = [
    { x: 66, y: 66, shape: "square" },
    { x: 134, y: 66, shape: "circle", active: true },
    { x: 66, y: 134, shape: "triangle" },
    { x: 134, y: 134, shape: "square" },
  ];
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {cells.map((cell, i) => (
        <motion.g key={i}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: cell.active ? [1, 1.14, 1] : 1 }}
          transition={cell.active
            ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.5, delay: i * 0.1, ease: EASE }}
        >
          {cell.shape === "square" && (
            <rect x={cell.x - 26} y={cell.y - 26} width="52" height="52" rx="12"
              fill={cell.active ? c.fillSoft : c.fillCard} stroke={cell.active ? c.line : c.cardBorder} strokeWidth={cell.active ? 3 : 2.5} />
          )}
          {cell.shape === "circle" && (
            <circle cx={cell.x} cy={cell.y} r="26"
              fill={cell.active ? c.fillSoft : c.fillCard} stroke={cell.active ? c.line : c.cardBorder} strokeWidth={cell.active ? 3 : 2.5} />
          )}
          {cell.shape === "triangle" && (
            <path d={`M${cell.x} ${cell.y - 28} L${cell.x + 26} ${cell.y + 20} L${cell.x - 26} ${cell.y + 20} Z`}
              fill={cell.active ? c.fillSoft : c.fillCard} stroke={cell.active ? c.line : c.cardBorder} strokeWidth={cell.active ? 3 : 2.5} strokeLinejoin="round" />
          )}
          {cell.active && (
            <path d={`M${cell.x - 9} ${cell.y} L${cell.x - 2} ${cell.y + 8} L${cell.x + 10} ${cell.y - 8}`}
              fill="none" stroke={c.line} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </motion.g>
      ))}
    </svg>
  );
});

const ShopPickIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <rect x="56" y="94" width="88" height="64" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
      <motion.g
        animate={{ rotate: [-1.5, 1.5, -1.5] }}
        style={{ transformOrigin: "100px 78px" }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M50,78 L150,78 L160,98 L40,98 Z" fill={c.fillSoft} stroke={c.cardBorder} strokeWidth="2.5" />
      </motion.g>
      <rect x="86" y="122" width="28" height="36" rx="3" fill={c.fillSoft} stroke={c.cardBorder} strokeWidth="2" />
      {[
        { angle: -40, delay: 0 },
        { angle: 40, delay: 0.4 },
      ].map((s, i) => {
        const rad = (s.angle * Math.PI) / 180;
        const cx = 100 + 78 * Math.sin(rad);
        const cy = 96 - 78 * Math.cos(rad) + 4;
        return (
          <motion.g key={i}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: s.delay }}
          >
            <circle cx={cx} cy={cy} r="6" fill="none" stroke={c.accent} strokeWidth="2" />
          </motion.g>
        );
      })}
    </svg>
  );
});

const DoneIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle cx="100" cy="100" r="70" fill={c.fillSoft}
        animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
      <circle cx="100" cy="100" r="46" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
      <motion.path
        d="M78,100 L94,116 L124,82"
        fill="none" stroke={c.line} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6, ease: EASE }}
      />
    </svg>
  );
});

const SentIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle cx="100" cy="100" r="78" fill={c.fillSoft}
        animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} />
      <motion.g
        animate={{ x: [0, 10, 0], y: [0, -6, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M46,120 L154,72 L118,158 L104,124 L46,120 Z" fill={c.fillCard} stroke={c.line} strokeWidth="3" strokeLinejoin="round" />
        <path d="M154,72 L104,124" stroke={c.line} strokeWidth="2.5" />
      </motion.g>
      {[
        { x: 148, y: 50, s: 6, d: 0 },
        { x: 168, y: 100, s: 5, d: 0.5 },
        { x: 40, y: 70, s: 7, d: 1 },
      ].map((sp, i) => (
        <motion.circle key={i} cx={sp.x} cy={sp.y} r={sp.s} fill="none" stroke={c.accent} strokeWidth="2"
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.15, 0.8] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: sp.d }} />
      ))}
    </svg>
  );
});

const ShopStoreIllustration = memo(({ darkMode }) => {
  const c = palette(darkMode);
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full">
      <circle cx="80" cy="82" r="62" fill={c.fillSoft} />
      <rect x="44" y="76" width="72" height="52" fill={c.fillCard} stroke={c.cardBorder} strokeWidth="2.5" />
      <motion.g
        animate={{ rotate: [-1.5, 1.5, -1.5] }}
        style={{ transformOrigin: "80px 62px" }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M38,62 L122,62 L132,80 L28,80 Z" fill={c.fillSoft} stroke={c.cardBorder} strokeWidth="2.5" />
      </motion.g>
      <rect x="68" y="98" width="24" height="30" rx="3" fill={c.fillSoft} stroke={c.cardBorder} strokeWidth="2" />
    </svg>
  );
});


const PhoneCatIllustration = memo(({ active, darkMode }) => {
  const c = palette(darkMode);
  const stroke = active ? "#ffffff" : c.line;
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect x="28" y="12" width="24" height="56" rx="6" fill="none" stroke={stroke} strokeWidth="3" />
      <line x1="34" y1="20" x2="46" y2="20" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="40" cy="59" r="3" fill="none" stroke={stroke} strokeWidth="2.2" />
    </svg>
  );
});
const LaptopCatIllustration = memo(({ active, darkMode }) => {
  const c = palette(darkMode);
  const stroke = active ? "#ffffff" : c.line;
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect x="20" y="20" width="40" height="26" rx="3" fill="none" stroke={stroke} strokeWidth="3" />
      <path d="M12,54 L68,54 L62,64 L18,64 Z" fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
});
const TabletCatIllustration = memo(({ active, darkMode }) => {
  const c = palette(darkMode);
  const stroke = active ? "#ffffff" : c.line;
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect x="18" y="14" width="44" height="52" rx="7" fill="none" stroke={stroke} strokeWidth="3" />
      <circle cx="40" cy="58" r="2.4" fill={stroke} />
    </svg>
  );
});
const TvCatIllustration = memo(({ active, darkMode }) => {
  const c = palette(darkMode);
  const stroke = active ? "#ffffff" : c.line;
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect x="12" y="18" width="56" height="36" rx="4" fill="none" stroke={stroke} strokeWidth="3" />
      <line x1="32" y1="64" x2="48" y2="64" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <line x1="40" y1="54" x2="40" y2="64" stroke={stroke} strokeWidth="3" />
    </svg>
  );
});
const DesktopCatIllustration = memo(({ active, darkMode }) => {
  const c = palette(darkMode);
  const stroke = active ? "#ffffff" : c.line;
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect x="14" y="16" width="52" height="34" rx="3" fill="none" stroke={stroke} strokeWidth="3" />
      <line x1="40" y1="50" x2="40" y2="60" stroke={stroke} strokeWidth="3" />
      <line x1="26" y1="64" x2="54" y2="64" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
});
const GamingCatIllustration = memo(({ active, darkMode }) => {
  const c = palette(darkMode);
  const stroke = active ? "#ffffff" : c.line;
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M22,32 h36 a10,10 0 0 1 10,10 v6 a10,10 0 0 1 -10,10 h-2 l-6,-8 h-20 l-6,8 h-2 a10,10 0 0 1 -10,-10 v-6 a10,10 0 0 1 10,-10 Z"
        fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round" />
      <line x1="30" y1="42" x2="30" y2="50" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="26" y1="46" x2="34" y2="46" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="54" cy="44" r="2.2" fill={stroke} />
      <circle cx="50" cy="49" r="2.2" fill={stroke} />
    </svg>
  );
});
const DefaultCatIllustration = memo(({ active, darkMode }) => {
  const c = palette(darkMode);
  const stroke = active ? "#ffffff" : c.line;
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <rect x="18" y="18" width="44" height="44" rx="8" fill="none" stroke={stroke} strokeWidth="3" />
      <circle cx="40" cy="40" r="10" fill="none" stroke={stroke} strokeWidth="2.4" />
    </svg>
  );
});

const CATEGORY_ILLUSTRATIONS = {
  Phone: PhoneCatIllustration,
  Laptop: LaptopCatIllustration,
  Tablet: TabletCatIllustration,
  TV: TvCatIllustration,
  Desktop: DesktopCatIllustration,
  Gaming: GamingCatIllustration,
};

const getCategoryIllustration = (name) => CATEGORY_ILLUSTRATIONS[name] || DefaultCatIllustration;


const StatusMiniIcon = memo(({ status, darkMode }) => {
  const c = palette(darkMode);
  const toneColor = { progress: c.line, success: c.line, danger: c.danger }[status.tone];
  const s = toneColor;
  const common = { fill: "none", stroke: s, strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full">
      {status.key === "SUBMITTED" && (
        <>
          <rect x="10" y="8" width="20" height="26" rx="3" {...common} />
          <line x1="14" y1="16" x2="26" y2="16" {...common} />
          <line x1="14" y1="22" x2="22" y2="22" {...common} />
        </>
      )}
      {status.key === "QUOTE_SENT" && (
        <>
          <path d="M8,20 L20,8 L32,20 L20,32 Z" {...common} />
          <circle cx="20" cy="20" r="3" fill={s} stroke="none" />
        </>
      )}
      {status.key === "QUOTE_APPROVED" && (
        <>
          <circle cx="20" cy="20" r="13" {...common} />
          <path d="M14,20 L18,25 L27,14" {...common} />
        </>
      )}
      {status.key === "QUOTE_REJECTED" && (
        <>
          <circle cx="20" cy="20" r="13" {...common} />
          <line x1="15" y1="15" x2="25" y2="25" {...common} />
          <line x1="25" y1="15" x2="15" y2="25" {...common} />
        </>
      )}
      {status.key === "DEVICE_COLLECTED" && (
        <>
          <rect x="9" y="16" width="22" height="16" rx="2" {...common} />
          <path d="M9,16 L20,8 L31,16" {...common} />
        </>
      )}
      {status.key === "REPAIRING" && (
        <>
          <path d="M14,26 L24,16" {...common} />
          <path d="M22,10 L30,10 L30,18" {...common} />
          <path d="M22,10 L27,15" {...common} />
        </>
      )}
      {status.key === "REPAIR_COMPLETED" && (
        <>
          <path d="M20,8 L30,12 L30,20 C30,27 25,31 20,33 C15,31 10,27 10,20 L10,12 Z" {...common} />
          <path d="M15,20 L19,24 L26,15" {...common} />
        </>
      )}
      {status.key === "DEVICE_DELIVERED" && (
        <>
          <rect x="6" y="18" width="18" height="12" rx="2" {...common} />
          <path d="M24,21 L31,21 L34,25 L34,30 L24,30 Z" {...common} />
          <circle cx="13" cy="31" r="2.4" {...common} />
          <circle cx="29" cy="31" r="2.4" {...common} />
        </>
      )}
      {status.key === "CANCELLED" && (
        <>
          <circle cx="20" cy="20" r="13" {...common} />
          <line x1="12" y1="28" x2="28" y2="12" {...common} />
        </>
      )}
      {status.key === "FAILED" && (
        <>
          <path d="M20,8 L33,30 L7,30 Z" {...common} strokeLinejoin="round" />
          <line x1="20" y1="17" x2="20" y2="23" {...common} />
          <circle cx="20" cy="26.5" r="1.4" fill={s} stroke="none" />
        </>
      )}
    </svg>
  );
});

const STATUS_JOURNEY = [
  { key: "SUBMITTED", label: "Submitted", desc: "Your request reaches the shop", tone: "progress" },
  { key: "QUOTE_SENT", label: "Set price", desc: "Shop sends a price estimate", tone: "progress" },
  { key: "QUOTE_APPROVED", label: "Price Accepted", desc: "You accepted the price", tone: "success" },
  { key: "QUOTE_REJECTED", label: "Price Rejected", desc: "You declined the price", tone: "danger" },
  { key: "DEVICE_COLLECTED", label: "Device Picked Up", desc: "Shop picked up your device", tone: "progress" },
  { key: "REPAIRING", label: "Repairing", desc: "Technicians are working on it", tone: "progress" },
  { key: "REPAIR_COMPLETED", label: "Repair Completed", desc: "Ready for return", tone: "success" },
  { key: "DEVICE_DELIVERED", label: "Device Delivered", desc: "Back in your hands", tone: "success" },
  { key: "CANCELLED", label: "Cancelled", desc: "Request was cancelled", tone: "danger" },
];

const RepairStatusMap = memo(({ darkMode }) => (
  <div className={`hidden lg:flex flex-col rounded-2xl border p-5 gap-1 w-full lg:w-80 ${
    darkMode ? "bg-gray-800/80 border-gray-700 backdrop-blur-md" : "bg-white border-gray-200 shadow-sm"
  }`}>
    <h4 className={`text-sm font-extrabold mb-3 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
      <RiDeviceLine size={16} className="text-emerald-500" /> Repair Journey
    </h4>
    <div className="relative pl-2">
      <div className={`absolute left-[19px] top-2 bottom-2 w-px ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
      {STATUS_JOURNEY.map((status, i) => (
        <motion.div key={status.key}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: i * 0.04, ease: EASE }}
          className="relative flex items-start gap-3 py-2"
        >
          <div className={`relative z-10 w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${
            status.tone === "danger"
              ? darkMode ? "bg-red-500/10 border-red-500/40" : "bg-red-50 border-red-200"
              : status.tone === "success"
              ? darkMode ? "bg-emerald-500/15 border-emerald-400/50" : "bg-emerald-50 border-emerald-300"
              : darkMode ? "bg-gray-800 border-emerald-500/30" : "bg-white border-emerald-200"
          }`}>
            <div className="w-5 h-5"><StatusMiniIcon status={status} darkMode={darkMode} /></div>
          </div>
          <div className="min-w-0 pt-1">
            <p className={`text-xs font-bold ${
              status.tone === "danger" ? darkMode ? "text-red-400" : "text-red-600"
                : darkMode ? "text-gray-100" : "text-gray-900"
            }`}>{status.label}</p>
            <p className={`text-[11px] leading-snug ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{status.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
));

const STEP_INFO = [
  {
    title: "Good details, better quotes",
    body: "Mention your device model, when the problem started, and any error messages you've seen. The more specific you are, the more accurate the shop's quote will be.",
    Illustration: DescribeIllustration,
  },
  {
    title: "Pick the closest match",
    body: "Choosing the right category routes your request to technicians who actually specialize in that device — faster replies, better diagnoses.",
    Illustration: CategoryPickIllustration,
  },
  {
    title: "Compare before you commit",
    body: "Check ratings, location, and shop type. You can switch shops any time before sending — nothing is final until you tap send.",
    Illustration: ShopPickIllustration,
  },
  {
    title: "You're all set",
    body: "Your request is on its way. Track its status any time from your account, and the shop will reach out shortly.",
    Illustration: DoneIllustration,
  },
];

const InfoPanel = memo(({ step, darkMode }) => {
  const info = STEP_INFO[Math.min(step, STEP_INFO.length) - 1];
  const Illustration = info.Illustration;
  return (
    <div className={`hidden lg:flex flex-col rounded-2xl border p-6 gap-4 shrink-0 w-full lg:w-80 ${
      darkMode ? "bg-gray-800/80 border-gray-700 backdrop-blur-md" : "bg-white border-gray-200 shadow-sm"
    }`}>
      <motion.div
        className="w-full aspect-square max-w-[180px] mx-auto"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={FAST}
            className="w-full h-full"
          >
            <Illustration darkMode={darkMode} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={FAST}
        >
          <h4 className={`text-sm font-extrabold mb-2 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
            {info.title}
          </h4>
          <p className={`text-xs leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {info.body}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

const INSTRUCTIONS = [
  { icon: <FiTool size={16} />, title: "Describe", text: "Tell us what's wrong" },
  { icon: <RiDeviceLine size={16} />, title: "Pick category", text: "Match your device type" },
  { icon: <FaStore size={14} />, title: "Choose a shop", text: "Compare ratings & details" },
  { icon: <RiCheckLine size={16} />, title: "Send it", text: "Track status from your account" },
];

const InstructionsStrip = memo(({ darkMode }) => (
  <div className={`max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2`}>
    {INSTRUCTIONS.map((ins, i) => (
      <motion.div key={ins.title}
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: i * 0.06, ease: EASE }}
        className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border ${
          darkMode ? "bg-gray-800/60 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          darkMode ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"
        }`}>{ins.icon}</div>
        <div className="min-w-0">
          <p className={`text-xs font-bold truncate ${darkMode ? "text-white" : "text-gray-900"}`}>{ins.title}</p>
          <p className={`text-[10px] truncate ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{ins.text}</p>
        </div>
      </motion.div>
    ))}
  </div>
));

const LoadingSpinner = memo(({ darkMode }) => (
  <div className="flex justify-center items-center h-48 sm:h-64">
    <div className={`w-10 h-10 sm:w-12 sm:h-12 border-4 ${darkMode ? "border-emerald-400" : "border-emerald-400"} border-t-transparent rounded-full animate-spin`} />
  </div>
));

const STEP_DEFS = [
  { label: "Describe", icon: <FiTool size={15} /> },
  { label: "Category", icon: <RiDeviceLine size={15} /> },
  { label: "Shop", icon: <FaStore size={13} /> },
  { label: "Done", icon: <FaCheckCircle size={14} /> },
];

const StepProgressBar = memo(({ step, darkMode }) => {
  const progress = useMemo(() => ((step - 1) / (STEP_DEFS.length - 1)) * 100, [step]);

  return (
    <div className={`flex-1 px-4 sm:px-6 py-6 sm:py-8 rounded-xl sm:rounded-2xl shadow-lg border ${
      darkMode ? "bg-gray-800/80 border-gray-700 backdrop-blur-md" : "bg-white border-gray-200"
    }`}>
      <div className="relative mb-5 sm:mb-6">
        <div className={`absolute top-5 sm:top-6 left-0 right-0 h-1.5 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
        <motion.div
          className="absolute top-5 sm:top-6 left-0 h-1.5 rounded-full bg-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
        <div className="relative flex justify-between">
          {STEP_DEFS.map((s, i) => {
            const isCompleted = step > i + 1;
            const isActive = step === i + 1;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 sm:gap-2">
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1, boxShadow: isActive ? "0 0 0 4px rgba(52,211,153,0.25)" : "none" }}
                  transition={{ duration: 0.18 }}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm border-2 transition-colors duration-200 ${
                    isCompleted ? "bg-emerald-400 border-transparent text-white shadow-lg"
                      : isActive ? "bg-white dark:bg-gray-900 border-emerald-400 text-emerald-500 dark:text-emerald-400 shadow-lg"
                      : darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {isCompleted ? <RiCheckLine size={16} className="text-white" /> : s.icon}
                </motion.div>
                <span className={`text-[10px] sm:text-xs font-bold transition-colors duration-200 ${
                  isCompleted || isActive ? "text-emerald-500 dark:text-emerald-400" : darkMode ? "text-gray-500" : "text-gray-400"
                }`}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="text-center">
        <span className={`text-[10px] sm:text-xs font-semibold px-3 py-1 rounded-full ${
          darkMode ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-600"
        }`}>
          Step {step} of {STEP_DEFS.length} — {STEP_DEFS[step - 1].label}
        </span>
      </div>
    </div>
  );
});

const NavButtons = memo(({ onBack, onNext, nextLabel = "Continue", nextDisabled = false, isLoading = false, showBack = true, darkMode }) => (
  <div className={`flex gap-3 mt-8 sm:mt-12 ${showBack ? "justify-between" : "justify-center"} max-w-md mx-auto`}>
    {showBack && (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={onBack}
        className={`flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-3.5 rounded-2xl font-bold text-sm border-2 shadow-sm transition-colors duration-150 ${
          darkMode ? "border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white bg-gray-800"
            : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white hover:shadow-md"
        }`}
      >
        <FiChevronLeft /> Back
      </motion.button>
    )}
    <motion.button
      whileHover={!nextDisabled && !isLoading ? { scale: 1.02, y: -1 } : {}}
      whileTap={{ scale: 0.97 }}
      onClick={onNext}
      disabled={nextDisabled || isLoading}
      className={`relative flex-1 sm:flex-none sm:px-12 py-3 sm:py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
        nextDisabled || isLoading
          ? darkMode ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-gradient-to-r from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
      }`}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : null}
      {isLoading ? "Sending..." : nextLabel}
      {!isLoading && <FiChevronRight />}
    </motion.button>
  </div>
));

const SuccessModal = memo(({ open, shop, onViewRequests, onNewRequest, darkMode }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FASTER}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="repair-success-title"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={FAST}
          className={`relative w-full max-w-md rounded-md shadow-2xl overflow-hidden ${
            darkMode ? "bg-gray-900" : "bg-white"
          }`}
        >
         
          <div className="p-6 sm:p-8 text-center">
            <div className="w-32 h-32 mx-auto mb-2">
              <SentIllustration darkMode={darkMode} />
            </div>
            <h3 id="repair-success-title" className={`text-xl sm:text-2xl font-extrabold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
              Request Sent!
            </h3>
            <p className={`text-sm leading-relaxed mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Your repair request has been sent to
            </p>
            <p className={`text-base font-bold mb-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
              {shop?.name || "the shop"}
            </p>
            <p className={`text-xs mb-6 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              {shop?.shopAddress?.city || "Cairo"}{shop?.shopAddress?.state ? `, ${shop.shopAddress.state}` : ""}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onNewRequest}
                className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all duration-150 ${
                  darkMode ? "border-gray-700 text-gray-300 hover:border-gray-500" : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                New Request
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onViewRequests}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all duration-150"
              >
                View My Requests
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
));

const ShopDetailModal = memo(({ open, onClose, shop, darkMode }) => (
  <Dialog open={open} onClose={onClose} className=" h-auto relative z-[60]">
    <DialogBackdrop className=" h-auto inset-0 bg-black/60 backdrop-blur-sm" />
    <div className="fixed h-auto  inset-0 flex items-center justify-center p-4 overflow-y-auto">
      <DialogPanel className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border ${
        darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      }`}>
        
        {shop && (
          <>
            <div className={`flex items-center justify-between mt-5 px-5 py-4 border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
              <DialogTitle className={`text-lg font-extrabold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                <FiInfo className="text-emerald-500" /> Shop Details
              </DialogTitle>
              <button onClick={onClose} className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex-shrink-0"><ShopStoreIllustration darkMode={darkMode} /></div>
                <div className="min-w-0">
                  <p className={`text-base font-extrabold truncate ${darkMode ? "text-white" : "text-gray-900"}`}>{shop.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <FaStar className="text-amber-400 text-xs" />
                    <span className={`text-xs font-bold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{shop.rating ? Number(shop.rating).toFixed(1) : "New"}</span>
                    {shop.verified && (
                      <span className={`ml-1 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${darkMode ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                        <FiShield size={10} /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {shop.description && (
                <p className={`text-xs leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{shop.description}</p>
              )}

              <div className="grid grid-cols-1 gap-2">
                {[
                  { icon: <FiMail size={13} />, label: "Email", value: shop.email },
                  { icon: <FiPhone size={13} />, label: "Phone", value: shop.phone },
                  { icon: <RiStore2Line size={14} />, label: "Type", value: shop.shopType },
                  { icon: <FiMapPin size={13} />, label: "Address", value: shop.shopAddress ? `${shop.shopAddress.street ? shop.shopAddress.street + ", " : ""}${shop.shopAddress.city || ""}${shop.shopAddress.state ? ", " + shop.shopAddress.state : ""}` : null },
                  { icon: <FiCalendar size={13} />, label: "Joined", value: shop.createdAt ? new Date(shop.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null },
                ].filter(row => row.value).map((row) => (
                  <div key={row.label} className={`flex items-center gap-3 p-2.5 rounded-xl ${darkMode ? "bg-gray-800/60" : "bg-gray-50"}`}>
                    <span className="text-emerald-500 flex-shrink-0">{row.icon}</span>
                    <div className="min-w-0">
                      <p className={`text-[10px] uppercase tracking-wide font-semibold ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{row.label}</p>
                      <p className={`text-xs font-semibold truncate ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{row.value}</p>
                    </div>
                  </div>
                ))}
                <div className={`flex items-center justify-between p-2.5 rounded-xl ${darkMode ? "bg-gray-800/60" : "bg-gray-50"}`}>
                  <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${shop.activate ? (darkMode ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600") : (darkMode ? "bg-red-500/15 text-red-400" : "bg-red-50 text-red-600")}`}>
                    {shop.activate ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          
          </>
        )}
      </DialogPanel>
    </div>
  </Dialog>
));

const SimplePagination = memo(({ page, totalPages, onChange, darkMode }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-1.5 mt-6">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        className={`p-2 rounded-lg border transition-all ${page === 1 ? "opacity-40 cursor-not-allowed" : darkMode ? "border-gray-700 text-gray-300 hover:border-emerald-400" : "border-gray-200 text-gray-600 hover:border-emerald-400"}`}>
        <FiChevronLeft size={14} />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-lg font-bold text-xs border transition-all ${
            p === page ? "bg-gradient-to-r from-emerald-400 to-emerald-500 text-white border-transparent shadow-md"
              : darkMode ? "border-gray-700 text-gray-300 hover:border-emerald-400" : "border-gray-200 text-gray-600 hover:border-emerald-400"
          }`}>{p}</button>
      ))}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className={`p-2 rounded-lg border transition-all ${page === totalPages ? "opacity-40 cursor-not-allowed" : darkMode ? "border-gray-700 text-gray-300 hover:border-emerald-400" : "border-gray-200 text-gray-600 hover:border-emerald-400"}`}>
        <FiChevronRight size={14} />
      </button>
    </div>
  );
});

const SUGGESTIONS = ["Screen cracked", "Battery issue", "Not charging", "Overheating", "Software crash", "Water damage"];
const CATEGORY_PAGE_SIZE = 6;
const SHOP_PAGE_SIZE = 4;

const fallbackCategories = [
  { id: "1", name: "Phone" },
  { id: "2", name: "Laptop" },
  { id: "3", name: "Tablet" },
  { id: "4", name: "TV" },
  { id: "5", name: "Desktop" },
  { id: "6", name: "Gaming" },
];

const fallbackShops = [
  { id: 1, name: "TechFix Pro", email: "contact@techfixpro.com", description: "Certified mobile and laptop repair specialists with same-day service.", verified: true, rating: 4.8, shopAddress: { street: "12 Abbas El Akkad", city: "Nasr City", state: "Cairo" }, phone: "+20 100 123 4567", shopType: "Mobile Repair", activate: true, createdAt: "2023-03-11T00:00:00" },
  { id: 2, name: "Mobile Clinic", email: "hello@mobileclinic.eg", description: "Fast, affordable laptop repairs backed by a 90-day warranty.", verified: false, rating: 4.7, shopAddress: { street: "4 Gamet El Dowal", city: "Mohandessin", state: "Giza" }, phone: "+20 111 222 3334", shopType: "Laptop Repair", activate: true, createdAt: "2022-11-02T00:00:00" },
  { id: 3, name: "FixZone", email: "support@fixzone.com", description: "All-device repair shop covering phones, laptops, tablets and consoles.", verified: true, rating: 4.9, shopAddress: { street: "9 Road 9", city: "Maadi", state: "Cairo" }, phone: "+20 155 789 0123", shopType: "All Devices", activate: true, createdAt: "2021-07-20T00:00:00" },
  { id: 4, name: "QuickRepair", email: "info@quickrepair.eg", description: "Walk-in and express repairs for every device type.", verified: false, rating: 4.3, shopAddress: { street: "21 Tahrir St", city: "Downtown", state: "Cairo" }, phone: "+20 122 456 7890", shopType: "BOTH", activate: true, createdAt: "2024-01-15T00:00:00" },
];

const getCategoryIcon = (name) => name;

const RepairRequestContent = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  const [step, setStep] = useState(1);
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submittedShop, setSubmittedShop] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [categoryPage, setCategoryPage] = useState(1);
  const [shopPage, setShopPage] = useState(1);
  const [infoShop, setInfoShop] = useState(null);
  const [isShopInfoOpen, setIsShopInfoOpen] = useState(false);

  const bgCard = useMemo(() => darkMode ? "bg-gray-800/90" : "bg-white", [darkMode]);
  const border = useMemo(() => darkMode ? "border-gray-700" : "border-gray-200", [darkMode]);
  const textPrimary = useMemo(() => darkMode ? "text-white" : "text-gray-900", [darkMode]);

  useEffect(() => { document.title = "Book Repair | Tech-Restore"; }, []);

  const sanitizeDescription = useCallback((input) =>
    sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim(), []);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await api.get("/api/categories", { headers: { Authorization: `Bearer ${token}` } });
        const data = res.data.content || res.data || [];
        return data.length > 0 ? data : fallbackCategories;
      } catch {
        return fallbackCategories;
      }
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const { data: shops = [], isLoading: shopsLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: async () => {
      try {
        const res = await api.get("/api/users/shops/all", { headers: { Authorization: `Bearer ${token}` } });
        const data = res.data.content || res.data || [];
        return data.length > 0 ? data : fallbackShops;
      } catch {
        return fallbackShops;
      }
    },
    enabled: step === 3 && !!selectedCategory && !!token,
    staleTime: 5 * 60 * 1000,
  });

  const filteredShops = useMemo(
    () => shops.filter(shop => shop.shopType === "BOTH" || shop.shopType === "REPAIRER"),
    [shops]
  );
  const categoryTotalPages = Math.max(1, Math.ceil(categories.length / CATEGORY_PAGE_SIZE));
  const pagedCategories = categories.slice((categoryPage - 1) * CATEGORY_PAGE_SIZE, categoryPage * CATEGORY_PAGE_SIZE);
  const shopTotalPages = Math.max(1, Math.ceil(filteredShops.length / SHOP_PAGE_SIZE));
  const pagedShops = filteredShops.slice((shopPage - 1) * SHOP_PAGE_SIZE, shopPage * SHOP_PAGE_SIZE);

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (!description.trim()) {
        Swal.fire({ icon: "warning", title: "Description required", text: "Please describe what's wrong with your device", confirmButtonColor: "#34d399" });
        return;
      }
      startTransition(() => setStep(2));
    } else if (step === 2) {
      if (!selectedCategory) {
        Swal.fire({ icon: "warning", title: "Select Device Type", confirmButtonColor: "#34d399" });
        return;
      }
      startTransition(() => setStep(3));
    }
  }, [step, description, selectedCategory]);

  const handleBack = useCallback(() => startTransition(() => setStep((s) => Math.max(1, s - 1))), []);

  const resetWizard = useCallback(() => {
    setStep(1);
    setSelectedCategory(null);
    setSelectedShop(null);
    setDescription("");
    setSubmitProgress(0);
    setSubmittedShop(null);
    setCategoryPage(1);
    setShopPage(1);
  }, []);

  const sendRepairRequest = useCallback(async () => {
    if (!selectedShop) return;
    setIsSubmitting(true);
    setSubmitProgress(0);
    const duration = 900;
    const interval = 50;
    let progress = 0;
    const timer = setInterval(() => {
      progress += (interval / duration) * 100;
      setSubmitProgress(prev => Math.min(100, progress));
      if (progress >= 100) clearInterval(timer);
    }, interval);
    try {
      await api.post(
        `/api/users/repair-request/${selectedShop.id}`,
        { description: sanitizeDescription(description), deviceCategory: selectedCategory.id },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      await new Promise((r) => setTimeout(r, duration));
      clearInterval(timer);
      setSubmitProgress(100);
      setSubmittedShop(selectedShop);
      setStep(4);
    } catch (err) {
      clearInterval(timer);
      setSubmitProgress(0);
      Swal.fire({ icon: "error", title: "Failed to Send", toast: true, position: "top-end", text: err.response?.data?.message || "Something went wrong.", confirmButtonColor: "#ef4444" });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedShop, description, selectedCategory, token, sanitizeDescription]);

  const handleViewRequests = useCallback(() => navigate("/account"), [navigate]);

  const openShopInfo = useCallback((shop, e) => {
    e?.stopPropagation();
    setInfoShop(shop);
    setIsShopInfoOpen(true);
  }, []);

  return (
    <div className={`min-h-screen overflow-x-hidden ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <Hero variant="repair" darkMode={darkMode} />

      <div className="px-4 sm:px-6 mt-6 sm:mt-10">
        <InstructionsStrip darkMode={darkMode} />
      </div>

      <div className="px-4 sm:px-6">
        {step <= 3 && (
          <div className="max-w-5xl mx-auto my-6 sm:my-10">
            <StepProgressBar step={step} darkMode={darkMode} />
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-16 sm:pb-20">
        {step <= 3 && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={FAST}>
                    <h2 className={`text-2xl sm:text-3xl font-extrabold text-center mb-2 sm:mb-3 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                      Describe the Problem
                    </h2>
                    <p className={`text-center text-xs sm:text-sm mb-6 sm:mb-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Be as specific as possible — this helps shops give accurate quotes
                    </p>
                    <div className="max-w-2xl mx-auto">
                      <div className={`relative rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${
                        description.trim() ? "border-emerald-400 shadow-lg shadow-emerald-400/10" : darkMode ? "border-gray-700" : "border-gray-200"
                      } ${bgCard}`}>
                        <textarea
                          className={`w-full px-4 sm:px-6 py-4 sm:py-5 bg-transparent rounded-xl sm:rounded-2xl dark:text-white focus:outline-none resize-none min-h-[140px] sm:min-h-[180px] text-sm sm:text-base`}
                          placeholder="e.g., Screen cracked, battery draining fast, not charging, overheating..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          maxLength={1000}
                        />
                        <div className={`flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 border-t ${border}`}>
                          <span className={`text-[10px] sm:text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                            Tip: include device model if possible
                          </span>
                          <span className={`text-[10px] sm:text-xs font-semibold ${description.length > 900 ? "text-orange-500" : darkMode ? "text-gray-500" : "text-gray-400"}`}>
                            {description.length} / 1000
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                        {SUGGESTIONS.map((s) => (
                          <button key={s} onClick={() => setDescription((prev) => prev ? `${prev}, ${s.toLowerCase()}` : s)}
                            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border transition-all duration-150 ${
                              darkMode ? "border-gray-700 text-gray-400 hover:border-emerald-400 hover:text-emerald-400"
                                : "border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600"
                            }`}>
                            + {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <NavButtons onNext={handleNext} nextDisabled={!description.trim()} showBack={false} darkMode={darkMode} />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={FAST}>
                    <h2 className={`text-2xl sm:text-3xl font-extrabold text-center mb-2 sm:mb-3 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                      Select Device Type
                    </h2>
                    <p className={`text-center text-xs sm:text-sm mb-6 sm:mb-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Choose the category that best matches your device
                    </p>
                    {categoriesLoading ? <LoadingSpinner darkMode={darkMode} /> : (
                      <>
                        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mt-4 sm:mt-6">
                          {pagedCategories.map((cat) => {
                            const CatIllustration = getCategoryIllustration(cat.name);
                            const active = selectedCategory?.id === cat.id;
                            return (
                              <motion.div key={cat.id} whileHover={{ y: -5, scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => setSelectedCategory(cat)}
                                className={`group cursor-pointer rounded-md sm:rounded-md flex flex-col justify-center items-center p-3 sm:p-5 lg:p-6 shadow-sm transition-all duration-200 border-2 ${
                                  active
                                    ? "bg-gradient-to-br from-emerald-400 to-emerald-500 text-white border-emerald-300 shadow-emerald-400/30 shadow-xl"
                                    : `${bgCard} ${darkMode ? "border-gray-700 hover:border-emerald-400" : "border-gray-200 hover:border-emerald-400"}`
                                }`}>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-4 transition-transform duration-200 group-hover:scale-110">
                                  <CatIllustration active={active} darkMode={darkMode} />
                                </div>
                                <p className={`text-center text-[10px] sm:text-xs lg:text-sm font-bold ${
                                  active ? "text-white" : textPrimary
                                }`}>
                                  {cat.name}
                                </p>
                                {active && (
                                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}
                                    className="mt-1 sm:mt-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/30 flex items-center justify-center">
                                    <RiCheckLine className="text-white text-xs" />
                                  </motion.div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                        <SimplePagination page={categoryPage} totalPages={categoryTotalPages} onChange={setCategoryPage} darkMode={darkMode} />
                      </>
                    )}
                    <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!selectedCategory} darkMode={darkMode} />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={FAST}>
                    <h2 className={`text-2xl sm:text-3xl font-extrabold text-center mb-2 sm:mb-3 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                      Choose Your Repair Shop
                    </h2>
                    <p className={`text-center text-xs sm:text-sm mb-6 sm:mb-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Select the shop you'd like to send your repair request to
                    </p>
                    {shopsLoading ? <LoadingSpinner darkMode={darkMode} /> : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                          {pagedShops.map((shop) => {
                            const active = selectedShop?.id === shop.id;
                            return (
                              <motion.div key={shop.id}
                                whileHover={shop.activate ? { y: -4 } : {}}
                                whileTap={shop.activate ? { scale: 0.99 } : {}}
                                transition={{ duration: 0.15 }}
                                onClick={() => shop.activate && setSelectedShop(shop)}
                                className={`relative group p-4 sm:p-6 rounded-md sm:rounded-md shadow-md transition-all duration-200 border-2 ${
                                  !shop.activate ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"
                                } ${
                                  active
                                    ? "bg-gradient-to-br from-emerald-400 to-emerald-500 text-white border-emerald-300 shadow-emerald-400/30 shadow-xl"
                                    : `${bgCard} ${!shop.activate ? (darkMode ? "border-gray-800" : "border-gray-200") : (darkMode ? "border-gray-700 hover:border-emerald-400" : "border-gray-200 hover:border-emerald-400")}`
                                }`}>
                                <button
                                  onClick={(e) => openShopInfo(shop, e)}
                                  className={`absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                    active ? "bg-white/20 text-white hover:bg-white/30" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                  }`}
                                  aria-label="Shop details"
                                >
                                  <FiInfo size={14} />
                                </button>

                                <div className="flex items-start justify-between mb-4 sm:mb-5 pr-8">
                                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0 ${
                                      active ? "bg-white/20" : "bg-emerald-100 dark:bg-emerald-900/30"
                                    }`}>
                                      <FaStore className={`text-base sm:text-xl ${active ? "text-white" : "text-emerald-500 dark:text-emerald-400"}`} />
                                    </div>
                                    <h3 className={`text-sm sm:text-lg font-bold truncate ${active ? "text-white" : textPrimary}`}>
                                      {shop.name}
                                    </h3>
                                  </div>
                                  <div className={`flex items-center gap-1.5 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-1.5 rounded-lg sm:rounded-xl flex-shrink-0 ml-1 ${
                                    active ? "bg-white/20" : darkMode ? "bg-gray-700" : "bg-gray-100"
                                  }`}>
                                    <FaStar className="text-amber-400 text-xs sm:text-sm" />
                                    <span className={`text-xs sm:text-sm font-bold ${active ? "text-white" : textPrimary}`}>
                                      {shop.rating ? Number(shop.rating).toFixed(1) : "New"}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                                  {[

                                    { icon: <RiStore2Line />, label: "Type", value: shop.shopType || "General" },
                                    {
                                      icon: shop.activate ? <RiCheckDoubleLine /> : <RiCloseLine />,
                                      label: "Status",
                                      value: shop.activate ? "Active" : "Inactive",
                                      valueClass: shop.activate
                                        ? active ? "text-emerald-100" : "text-green-600 dark:text-green-400"
                                        : "text-red-500",
                                    },
                                    
                                  ].map(({ icon, label, value, valueClass }) => (
                                    <div key={label} className={`flex items-start gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${
                                      active ? "bg-white/10" : darkMode ? "bg-gray-700/50" : "bg-gray-50"
                                    }`}>
                                      <span className={`mt-0.5 flex-shrink-0 text-sm ${active ? "text-emerald-200" : "text-emerald-500 dark:text-emerald-400"}`}>{icon}</span>
                                      <div className="min-w-0">
                                        <p className={`text-[9px] sm:text-[10px] uppercase tracking-wide font-semibold mb-0.5 ${
                                          active ? "text-emerald-200/70" : darkMode ? "text-emerald-500" : "text-gray-400"
                                        }`}>{label}</p>
                                        <p className={`text-[10px] sm:text-xs font-semibold truncate ${
                                          valueClass || (active ? "text-white" : textPrimary)
                                        }`}>{value}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {active && (
                                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
                                    className="flex items-center justify-center gap-2 bg-white/20 rounded-lg sm:rounded-xl py-2">
                                    <RiCheckLine className="text-white" />
                                    <span className="text-white text-xs font-bold">Selected</span>
                                  </motion.div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                        <SimplePagination page={shopPage} totalPages={shopTotalPages} onChange={setShopPage} darkMode={darkMode} />
                      </>
                    )}

                    <NavButtons onBack={handleBack} onNext={sendRepairRequest} nextLabel="Send Repair Request"
                      nextDisabled={!selectedShop} isLoading={isSubmitting} darkMode={darkMode} />

                    {isSubmitting && submitProgress > 0 && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="max-w-md mx-auto mt-6 sm:mt-8">
                        <div className={`w-full rounded-full h-2.5 overflow-hidden ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                          <motion.div className="h-full rounded-full bg-emerald-400"
                            initial={{ width: 0 }} animate={{ width: `${submitProgress}%` }} transition={{ duration: 0.12 }} />
                        </div>
                        <p className={`text-center text-xs mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Processing... {Math.round(submitProgress)}%
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-6 w-full lg:w-80 shrink-0">
              <InfoPanel step={step} darkMode={darkMode} />
              <RepairStatusMap darkMode={darkMode} />
            </div>
          </div>
        )}
      </div>

      <SuccessModal
        open={step === 4}
        shop={submittedShop}
        onViewRequests={handleViewRequests}
        onNewRequest={resetWizard}
        darkMode={darkMode}
      />

      <ShopDetailModal
        open={isShopInfoOpen}
        onClose={() => setIsShopInfoOpen(false)}
        shop={infoShop}
        darkMode={darkMode}
      />
    </div>
  );
};

const RepairRequest = memo((props) => (
  <QueryClientProvider client={queryClient}>
    <RepairRequestContent {...props} />
  </QueryClientProvider>
));

export default RepairRequest;