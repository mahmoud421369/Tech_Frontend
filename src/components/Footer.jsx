/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import { FiHome, FiCompass, FiMap, FiMail, FiPhone, FiClock, FiShoppingBag } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import logo from "../images/logo.png"
import { Link } from 'react-router-dom';


const Footer = ({darkMode}) => {
  return (
    <footer className={`bg-white border-t-2 border-gray-100 dark:bg-gray-800 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'} text-gray-900 pt-16 pb-8`}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className=" mb-4">
              <div className=" text-white font-bold text-xl rounded mr-2">
                <img src={logo} className="h-36 w-36 object-cover" alt="" />
              </div>
            
            </div>
            <p className="text-gray-400 mb-4">
              Your trusted partner for device repairs and refurbished electronics. Quality service guaranteed.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white bg-blue-500 dark:bg-gray-700 p-3 rounded-3xl hover:text-white">
                <FaFacebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-white bg-blue-500 p-3 dark:bg-gray-700 rounded-3xl hover:text-white">
                <FaTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-white bg-blue-500 p-3 dark:bg-gray-700 rounded-3xl hover:text-white">
                <FaInstagram className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 dark:text-white">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-blue-500 hover:text-blue-600 flex items-center font-semibold">
                  <FiHome className="mr-2" /> Home
                </Link>
              </li>
              <li>
                <Link to="/explore" className="text-blue-500 hover:text-blue-600 flex items-center font-semibold">
                  <FiCompass className="mr-2" /> Explore 
                </Link>
              </li>
              <li>
                <Link to="/purchase/new" className="text-blue-500 hover:text-blue-600 flex items-center font-semibold">
                  <FiShoppingBag className="mr-2" />  Purchase New
                </Link>
              </li>
              <li>
                <Link to="/purchase/used" className="text-blue-500 hover:text-blue-600 flex items-center font-semibold">
                  <FiShoppingBag className="mr-2" />  Purchase Used
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 dark:text-white">Our Services</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-blue-500 hover:text-blue-600 flex items-center font-semibold">Repair Device</a></li>
              <li><a href="#" className="text-blue-500 hover:text-blue-600 flex items-center font-semibold">Purchases Devices </a></li>
      
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 dark:text-white">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <FiMap className="mt-1 dark:text-blue-500 mr-3" />
                <span className="text-blue-500 hover:text-blue-600 flex items-center font-semibold">Cairo , Al maadi</span>
              </li>
              <li className="flex items-center">
                <FiPhone className="mr-3 dark:text-blue-500" />
                <span className="text-blue-500 hover:text-blue-600 flex items-center font-semibold">19999</span>
              </li>
              <li className="flex items-center">
                <FiMail className="mr-3 dark:text-blue-500" />
                <span className="text-blue-500 hover:text-blue-600 flex items-center font-semibold">support@techRestore.com</span>
              </li>
              <li className="flex items-start">
                <FiClock className="mt-1 mr-3 dark:text-blue-500" />
                <div>
                  <p className="text-blue-500 hover:text-blue-600 flex items-center font-semibold">24 / 7 Days</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-8 text-center dark:text-white dark:border-gray-700 text-gray-500">
          <p>&copy; {new Date().getFullYear()} Tech & Restore . All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;