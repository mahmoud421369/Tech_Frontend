import React from "react";
import {
  FiHome,
  FiCompass,
  FiMap,
  FiMail,
  FiPhone,
  FiClock,
  FiShoppingBag,
  FiTruck,
  FiPackage,
} from "react-icons/fi";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from "../images/logo-bg.png";

const Footer = ({ darkMode }) => {
  return (
    <footer className={`relative overflow-hidden py-20 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 rounded-full animate-pulse ${
              darkMode ? "bg-emerald-400" : "bg-emerald-600"
            }`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

    
      <div className="absolute top-0 left-0 right-0">
        <svg
          className="w-full h-20"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill={darkMode ? "#111827" : "#ffffff"}
            fillOpacity="1"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

         
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="Tech & Restore"
                className="h-16 w-auto rounded-2xl shadow-lg"
              />
            </div>
            <p className={`text-base leading-relaxed max-w-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              Your trusted partner for premium device repairs and certified refurbished electronics. Quality service, sustainable choices.
            </p>

         
            <div className="flex gap-4">
              {[
                { Icon: FaFacebook, href: "https://facebook.com", label: "Facebook" },
                { Icon: FaTwitter, href: "https://twitter.com", label: "Twitter" },
                { Icon: FaInstagram, href: "https://instagram.com", label: "Instagram" },
              ].map(({ Icon, href, label }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-md ${
                    darkMode
                      ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40"
                      : "bg-white text-emerald-600 hover:bg-emerald-50"
                  }`}
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

    
          <div>
            <h3 className={`text-xl font-bold mb-6 ${darkMode ? "text-emerald-400" : "text-gray-800"}`}>
              Quick Links
            </h3>
            <ul className="space-y-4">
              {[
                { to: "/", Icon: FiHome, label: "Home" },
                { to: "/explore", Icon: FiCompass, label: "Explore" },
                { to: "/track", Icon: FiTruck, label: "Track Order" },
                { to: "/purchase/new", Icon: FiShoppingBag, label: "Buy New" },
                { to: "/purchase/used", Icon: FiPackage, label: "Buy Used" },
              ].map(({ to, Icon, label }, i) => (
                <li key={i}>
                  <Link
                    to={to}
                    className={`flex items-center gap-3 text-base font-medium transition-all duration-300 hover:translate-x-2 ${
                      darkMode
                        ? "text-gray-300 hover:text-emerald-400"
                        : "text-gray-600 hover:text-emerald-600"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-emerald-500" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          
          <div>
            <h3 className={`text-xl font-bold mb-6 ${darkMode ? "text-emerald-400" : "text-gray-800"}`}>
              Our Services
            </h3>
            <ul className="space-y-4">
              {[
                { to: "/services/repair", label: "Device Repair" },
                { to: "/services/refurbish", label: "Refurbished Sales" },
                { to: "/services/warranty", label: "Warranty Plans" },
                { to: "/services/delivery", label: "Fast Delivery" },
              ].map(({ to, label }, i) => (
                <li key={i}>
                  <Link
                    to={to}
                    className={`block text-base font-medium transition-all duration-300 hover:translate-x-2 ${
                      darkMode
                        ? "text-gray-300 hover:text-emerald-400"
                        : "text-gray-600 hover:text-emerald-600"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          
          <div>
            <h3 className={`text-xl font-bold mb-6 ${darkMode ? "text-emerald-400" : "text-gray-800"}`}>
              Contact Us
            </h3>
            <ul className="space-y-5 text-base">
              <li className="flex items-start gap-4">
                <FiMap className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                  Cairo, Al Maadi,<br />Egypt
                </span>
              </li>
              <li className="flex items-center gap-4">
                <FiPhone className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <a
                  href="tel:+2019999"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  +20 19999
                </a>
              </li>
              <li className="flex items-center gap-4">
                <FiMail className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <a
                  href="mailto:support@techrestore.com"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  support@techrestore.com
                </a>
              </li>
              <li className="flex items-start gap-4">
                <FiClock className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                  24/7 Customer Support
                </span>
              </li>
            </ul>
          </div>
        </div>

        
        <div className={`pt-10 border-t ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
            <p className={darkMode ? "text-gray-500" : "text-gray-600"}>
              © {new Date().getFullYear()}{" "}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Tech & Restore
              </span>
              . All rights reserved.
            </p>
            <div className="flex gap-8">
              <Link
                to="/privacy"
                className={`transition-colors ${darkMode ? "text-gray-400 hover:text-emerald-400" : "text-gray-600 hover:text-emerald-600"}`}
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className={`transition-colors ${darkMode ? "text-gray-400 hover:text-emerald-400" : "text-gray-600 hover:text-emerald-600"}`}
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>

      
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <FiPackage className="absolute top-12 left-8 w-20 h-20 text-emerald-500 animate-float" />
        <FiTruck className="absolute bottom-24 right-12 w-24 h-24 text-emerald-500 animate-pulse" />
        <FiCompass className="absolute top-1/3 right-1/3 w-16 h-16 text-emerald-400 animate-ping" />
      </div>


      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>
    </footer>
  );
};

export default Footer;