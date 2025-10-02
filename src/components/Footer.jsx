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
import logo from "../images/logo.png";
import { Link } from "react-router-dom";

const Footer = ({ darkMode }) => {
  return (
    <footer
      className={`py-16 ${
        darkMode
          ? "bg-gradient-to-br from-gray-950 to-indigo-900 text-gray-300"
          : "bg-gradient-to-br from-gray-50 to-indigo-50 text-gray-800"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Logo & About */}
          <div>
            <div className="mb-6">
              <img src={logo} className="h-24 w-24 object-cover" alt="Logo" />
            </div>
            <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Your trusted partner for device repairs and refurbished
              electronics. Quality service guaranteed.
            </p>
            <div className="flex space-x-3">
              <a
                href="#"
                className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <FaFacebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-3 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition"
              >
                <FaTwitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-3 rounded-full bg-pink-500 text-white hover:bg-pink-600 transition"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-5 dark:text-white">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="flex items-center font-semibold text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  <FiHome className="mr-2" /> Home
                </Link>
              </li>
              <li>
                <Link
                  to="/explore"
                  className="flex items-center font-semibold text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  <FiCompass className="mr-2" /> Explore
                </Link>
              </li>
              <li>
                <Link
                  to="/purchase/new"
                  className="flex items-center font-semibold text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  <FiShoppingBag className="mr-2" /> Purchase New
                </Link>
              </li>
              <li>
                <Link
                  to="/purchase/used"
                  className="flex items-center font-semibold text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  <FiShoppingBag className="mr-2" /> Purchase Used
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-5 dark:text-white">
              Our Services
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="font-semibold text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  Repair Devices
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="font-semibold text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  Purchase Devices
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-5 dark:text-white">
              Contact Us
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start">
                <FiMap className="mt-1 mr-3 text-indigo-600 dark:text-indigo-300" />
                <span>Cairo, Al Maadi</span>
              </li>
              <li className="flex items-center">
                <FiPhone className="mr-3 text-indigo-600 dark:text-indigo-300" />
                <span>19999</span>
              </li>
              <li className="flex items-center">
                <FiMail className="mr-3 text-indigo-600 dark:text-indigo-300" />
                <span>support@techrestore.com</span>
              </li>
              <li className="flex items-start">
                <FiClock className="mt-1 mr-3 text-indigo-600 dark:text-indigo-300" />
                <span>24 / 7 Days</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()}{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-300">
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