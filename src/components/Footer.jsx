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
    <footer className={`relative overflow-hidden py-16 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 ${darkMode ? "bg-indigo-400" : "bg-indigo-600"} rounded-full animate-pulse`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

    
      <div className="absolute top-0 left-0 right-0">
        <svg
          className="w-full h-16"
          preserveAspectRatio="none"
          viewBox="0 0 1440 320"
        >
          <path
            fill={darkMode ? "#111827" : "#f9fafb"}
            d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,160C672,128,768,96,864,96C960,96,1056,128,1152,144C1248,160,1344,160,1392,160L1440,160L1440,0L0,0Z"
          />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Tech & Restore"
                className="h-14 w-56 rounded-2xl  object-cover"
              />
              {/* <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-lime-600">
                Tech Bazaar
              </h1> */}
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"} max-w-xs`}>
              Your trusted partner for top-quality device repairs and refurbished electronics. Exceptional service, guaranteed.
            </p>

           
            <div className="flex gap-3">
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
                  className="p-2.5 rounded-xl bg-lime-500 text-white shadow-md hover:shadow-xl transform hover:scale-110 transition-all duration-300"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          
          <div>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-lime-400 mb-6">
              Quick Links
            </h3>
            <ul className="space-y-3">
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
                    className={`flex items-center gap-2 text-base font-medium transition-all duration-300 hover:text-lime-600 dark:hover:text-lime-400 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <Icon className="text-lime-500 dark:text-white " />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        
          <div>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-lime-400 mb-6">
              Our Services
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/services/repair", label: "Device Repair" },
                { to: "/services/refurbish", label: "Refurbished Sales" },
                { to: "/services/warranty", label: "Warranty Plans" },
                { to: "/services/delivery", label: "Fast Delivery" },
              ].map(({ to, label }, i) => (
                <li key={i}>
                  <Link
                    to={to}
                    className={`block text-base font-medium transition-all duration-300 hover:text-lime-600 dark:hover:text-lime-400 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          
          <div>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-lime-400 mb-6">
              Contact Us
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <FiMap className="mt-0.5 text-lime-500 dark:text-white" />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  Cairo, Al Maadi, Egypt
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="text-lime-500 dark:text-white" />
                <a
                  href="tel:+2019999"
                  className="text-lime-600 dark:text-lime-400 hover:underline"
                >
                  +20 19999
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="text-lime-500 dark:text-white" />
                <a
                  href="mailto:support@techrestore.com"
                  className="text-lime-600 dark:text-lime-400 hover:underline"
                >
                  support@techrestore.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FiClock className="mt-0.5 text-lime-500 dark:text-white" />
                <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                  24/7 Customer Support
                </span>
              </li>
            </ul>
          </div>
        </div>

        
        <div className={`pt-8 border-t ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
              &copy; {new Date().getFullYear()}{" "}
              <span className="font-semibold text-lime-600 dark:text-indigo-400">
                Tech & Restore
              </span>
              . All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <Link
                to="/privacy"
                className="hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 transition"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 transition"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>

      
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <FiPackage className="absolute top-10 left-10 w-16 h-16 text-lime-500 animate-float" />
        <FiTruck className="absolute bottom-20 right-20 w-20 h-20 text-lime-500 animate-pulse" />
        <FiCompass className="absolute top-1/3 right-1/4 w-14 h-14 text-lime-400 animate-ping" />
      </div>

      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </footer>
  );
};

export default Footer;