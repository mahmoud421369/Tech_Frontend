
/* eslint-disable jsx-a11y/anchor-is-valid */
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
      className={`py-16 ${
        darkMode
          ? "bg-gradient-to-br from-indigo-900 to-blue-900 text-gray-200"
          : "bg-gradient-to-br from-indigo-50 to-blue-50 text-gray-800"
      } transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
         
          <div className="animate-fade-in">
            <div className="mb-6">
              <img
                src={logo}
                className="h-20 w-20 object-contain rounded-full shadow-md transform hover:scale-105 transition-transform duration-300"
                alt="Tech & Restore Logo"
              />
            </div>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 max-w-xs">
              Your trusted partner for top-quality device repairs and refurbished electronics. Exceptional service, guaranteed.
            </p>
            <div className="flex space-x-4 mt-6">
              {[
                { Icon: FaFacebook, color: "from-blue-600 to-blue-700", href: "#" },
                { Icon: FaTwitter, color: "from-sky-500 to-sky-600", href: "#" },
                { Icon: FaInstagram, color: "from-pink-500 to-pink-600", href: "#" },
              ].map(({ Icon, color, href }, index) => (
                <a
                  key={index}
                  href={href}
                  className={`p-3 rounded-full bg-gradient-to-r ${color} text-white shadow-md hover:shadow-lg transform hover:scale-110 transition-all duration-300`}
                >
                  <Icon className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>

       
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold mb-6 text-indigo-600 dark:text-indigo-300">
              Quick Links
            </h3>
            <ul className="space-y-4">
              {[
                { to: "/", Icon: FiHome, label: "Home" },
                { to: "/explore", Icon: FiCompass, label: "Explore" },
                { to: "/purchase/new", Icon: FiShoppingBag, label: "Purchase New" },
                { to: "/purchase/used", Icon: FiShoppingBag, label: "Purchase Used" },
              ].map(({ to, Icon, label }, index) => (
                <li key={index}>
                  <Link
                    to={to}
                    className="flex items-center text-base font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-400 hover:underline transition-colors duration-200"
                  >
                    <Icon className="mr-2 text-indigo-500 dark:text-indigo-400" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

         
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold mb-6 text-indigo-600 dark:text-indigo-300">
              Our Services
            </h3>
            <ul className="space-y-4">
              {[
                { href: "#", label: "Repair Devices" },
                { href: "#", label: "Purchase Devices" },
              ].map(({ href, label }, index) => (
                <li key={index}>
                  <a
                    href={href}
                    className="text-base font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-400 hover:underline transition-colors duration-200"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold mb-6 text-indigo-600 dark:text-indigo-300">
              Contact Us
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start">
                <FiMap className="mt-1 mr-3 text-indigo-500 dark:text-indigo-400 text-lg" />
                <span>Cairo, Al Maadi, Egypt</span>
              </li>
              <li className="flex items-center">
                <FiPhone className="mr-3 text-indigo-500 dark:text-indigo-400 text-lg" />
                <span>+20 19999</span>
              </li>
              <li className="flex items-center">
                <FiMail className="mr-3 text-indigo-500 dark:text-indigo-400 text-lg" />
                <span>support@techrestore.com</span>
              </li>
              <li className="flex items-start">
                <FiClock className="mt-1 mr-3 text-indigo-500 dark:text-indigo-400 text-lg" />
                <span>24/7 Customer Support</span>
              </li>
            </ul>
          </div>
        </div>

    
        <div className="pt-8 border-t border-indigo-200 dark:border-indigo-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()}{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-300">
              Tech & Restore
            </span>
            . All rights reserved.
          </p>
        </div>
      </div><br /><br />
    </footer>
  );
};

export default Footer;
