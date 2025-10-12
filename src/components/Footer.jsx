import React from "react";
import {
  FiHome,
  FiCompass,
  FiMap,
  FiMail,
  FiPhone,
  FiClock,
  FiShoppingBag,
} from "react-icons/fi";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";
import logo from "../images/logo.png";

const Footer = ({ darkMode }) => {
  return (
    <footer
      className={`py-16 bg-gradient-to-b from-blue-600 to-indigo-600 dark:from-black dark:to-gray-950 text-white transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="animate-fade-in flex flex-col items-start">
            <div className="mb-6">
              <img
                src={logo}
                className="h-16 w-16 object-contain rounded-full shadow-md transform hover:scale-105 transition-transform duration-300"
                alt="Tech & Restore Logo"
              />
            </div>
            <p className="text-sm leading-relaxed text-white/90 max-w-xs">
              Your trusted partner for top-quality device repairs and refurbished electronics. Exceptional service, guaranteed.
            </p>
            <div className="flex space-x-4 mt-6">
              {[
                { Icon: FaFacebook, href: "https://facebook.com", label: "Facebook" },
                { Icon: FaTwitter, href: "https://twitter.com", label: "Twitter" },
                { Icon: FaInstagram, href: "https://instagram.com", label: "Instagram" },
              ].map(({ Icon, href, label }, index) => (
                <a
                  key={index}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-indigo-700 text-white shadow-md hover:bg-indigo-500 transition-all duration-300 transform hover:scale-110"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Section */}
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold mb-6 text-indigo-200">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/", Icon: FiHome, label: "Home" },
                { to: "/explore", Icon: FiCompass, label: "Explore" },
                { to: "/purchase/new", Icon: FiShoppingBag, label: "Purchase New" },
                { to: "/purchase/used", Icon: FiShoppingBag, label: "Purchase Used" },
              ].map(({ to, Icon, label }, index) => (
                <li key={index}>
                  <Link
                    to={to}
                    className="flex items-center text-base font-medium text-white hover:text-indigo-200 transition-colors duration-200"
                  >
                    <Icon className="mr-2 text-indigo-300" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Section */}
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold mb-6 text-indigo-200">
              Our Services
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/services/repair", label: "Repair Devices" },
                { to: "/services/purchase", label: "Purchase Devices" },
              ].map(({ to, label }, index) => (
                <li key={index}>
                  <Link
                    to={to}
                    className="text-base font-medium text-white hover:text-indigo-200 transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us Section */}
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold mb-6 text-indigo-200">
              Contact Us
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start">
                <FiMap className="mt-1 mr-3 text-indigo-300 text-lg" />
                <span>Cairo, Al Maadi, Egypt</span>
              </li>
              <li className="flex items-center">
                <FiPhone className="mr-3 text-indigo-300 text-lg" />
                <a
                  href="tel:+2019999"
                  className="text-white hover:text-indigo-200 transition-colors duration-200"
                >
                  +20 19999
                </a>
              </li>
              <li className="flex items-center">
                <FiMail className="mr-3 text-indigo-300 text-lg" />
                <a
                  href="mailto:support@techrestore.com"
                  className="text-white hover:text-indigo-200 transition-colors duration-200"
                >
                  support@techrestore.com
                </a>
              </li>
              <li className="flex items-start">
                <FiClock className="mt-1 mr-3 text-indigo-300 text-lg" />
                <span>24/7 Customer Support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="pt-8 border-t border-indigo-500 text-center">
          <p className="text-sm text-white/80">
            &copy; {new Date().getFullYear()}{" "}
            <span className="font-semibold text-indigo-200">
              Tech & Restore
            </span>
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;