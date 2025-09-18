import React, { useState } from 'react';
import { FiSave, FiMail, FiLock, FiCreditCard, FiBell } from 'react-icons/fi';

const Settings = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    companyName: 'Repair Devices',
    email: 'admin@repairdevices.com',
    phone: '+1 (555) 123-4567',
    address: '123 Tech Street, Silicon Valley, CA 94000',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    stripeKey: 'pk_test_1234567890',
    notificationEmail: true,
    notificationSMS: false,
    notificationPush: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Settings saved:', formData);
   
  };

  return (
    <div className={`p-6 transition-colors ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>
      
    
      <div className={`flex border-b mb-6 ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          onClick={() => setActiveTab('general')}
          className={`py-3 px-6 font-medium ${
            activeTab === 'general' 
              ? (darkMode ? 'border-b-2 border-blue-500 text-blue-400' : 'border-b-2 border-blue-600 text-blue-600') 
              : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`py-3 px-6 font-medium ${
            activeTab === 'payment' 
              ? (darkMode ? 'border-b-2 border-blue-500 text-blue-400' : 'border-b-2 border-blue-600 text-blue-600') 
              : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')
          }`}
        >
          Payment
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`py-3 px-6 font-medium ${
            activeTab === 'notifications' 
              ? (darkMode ? 'border-b-2 border-blue-500 text-blue-400' : 'border-b-2 border-blue-600 text-blue-600') 
              : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')
          }`}
        >
          Notifications
        </button>
      </div>
      
    
      {activeTab === 'general' && (
        <form onSubmit={handleSubmit} className={`p-6 rounded-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 font-medium">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">Email</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                />
                <FiMail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
            </div>
            
            <div>
              <label className="block mb-2 font-medium">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">Timezone</label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
              </select>
            </div>
            
            <div>
              <label className="block mb-2 font-medium">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className={`w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="JPY">Japanese Yen (¥)</option>
              </select>
            </div>
          </div>
          
          <button 
            type="submit"
            className={`flex items-center px-4 py-2 rounded-lg ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            <FiSave className="mr-2" />
            Save Changes
          </button>
        </form>
      )}
      
      {activeTab === 'payment' && (
        <form onSubmit={handleSubmit} className={`p-6 rounded-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
        }`}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Payment Gateway</h2>
            
            <div className="flex items-center mb-4">
              <div className="mr-3">
                <FiCreditCard className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium">Stripe Integration</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Securely process payments with Stripe
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">Stripe API Key</label>
              <div className="relative">
                <input
                  type="password"
                  name="stripeKey"
                  value={formData.stripeKey}
                  onChange={handleChange}
                  className={`w-full p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                />
                <FiLock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            className={`flex items-center px-4 py-2 rounded-lg ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            <FiSave className="mr-2" />
            Save Payment Settings
          </button>
        </form>
      )}
      
      {activeTab === 'notifications' && (
        <form onSubmit={handleSubmit} className={`p-6 rounded-lg ${
          darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
        }`}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
            
            <div className="flex items-center mb-4">
              <div className="mr-3">
                <FiBell className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium">Notification Settings</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Choose how you receive notifications
                </p>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Receive notifications via email
                  </p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="notificationEmail"
                    checked={formData.notificationEmail}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer ${
                    darkMode ? 'bg-gray-600' : 'bg-gray-300'
                  } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">SMS Notifications</h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Receive notifications via text message
                  </p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="notificationSMS"
                    checked={formData.notificationSMS}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer ${
                    darkMode ? 'bg-gray-600' : 'bg-gray-300'
                  } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Receive notifications on your devices
                  </p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="notificationPush"
                    checked={formData.notificationPush}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer ${
                    darkMode ? 'bg-gray-600' : 'bg-gray-300'
                  } peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                </label>
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            className={`flex items-center px-4 py-2 rounded-lg ${
              darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            <FiSave className="mr-2" />
            Save Notification Settings
          </button>
        </form>
      )}
    </div>
  );
};

export default Settings;