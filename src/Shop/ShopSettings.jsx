import React, { useState } from 'react';


const ShopSettings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    theme: 'light',
    language: 'en',
    twoFactorAuth: false
  });

  const handleToggleChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleNestedToggleChange = (parent, child, value) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value
      }
    }));
  };

  return (
    <div style={{marginTop:"-550px",marginLeft:"270px"}}> 
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
      
      <div className="space-y-8">
  

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <button
                onClick={() => handleNestedToggleChange('notifications', 'email', !settings.notifications.email)}
                className={`${settings.notifications.email ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                <span className={`${settings.notifications.email ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                <p className="text-sm text-gray-500">Receive notifications via text message</p>
              </div>
              <button
                onClick={() => handleNestedToggleChange('notifications', 'sms', !settings.notifications.sms)}
                className={`${settings.notifications.sms ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                <span className={`${settings.notifications.sms ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                <p className="text-sm text-gray-500">Receive notifications on your device</p>
              </div>
              <button
                onClick={() => handleNestedToggleChange('notifications', 'push', !settings.notifications.push)}
                className={`${settings.notifications.push ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                <span className={`${settings.notifications.push ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} />
              </button>
            </div>
          </div>
        </div>
        


        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Appearance</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleToggleChange('theme', 'light')}
                  className={`px-4 py-2 border rounded-md ${settings.theme === 'light' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-white text-gray-700'}`}
                >
                  Light
                </button>
                <button
                  onClick={() => handleToggleChange('theme', 'dark')}
                  className={`px-4 py-2 border rounded-md ${settings.theme === 'dark' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-white text-gray-700'}`}
                >
                  Dark
                </button>
                <button
                  onClick={() => handleToggleChange('theme', 'system')}
                  className={`px-4 py-2 border rounded-md ${settings.theme === 'system' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 bg-white text-gray-700'}`}
                >
                  System
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => handleToggleChange('language', e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </div>
        
   

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Security</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <button
                onClick={() => handleToggleChange('twoFactorAuth', !settings.twoFactorAuth)}
                className={`${settings.twoFactorAuth ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                <span className={`${settings.twoFactorAuth ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} />
              </button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Change Password</h3>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Change Password
              </button>
            </div>
          </div>
        </div>
        


        <div className="bg-white p-6 rounded-lg shadow border border-red-200">
          <h2 className="text-xl font-semibold text-red-700 mb-4">Danger Zone</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Delete Account</h3>
              <p className="text-sm text-gray-500 mb-3">Once you delete your account, there is no going back. Please be certain.</p>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
      <br />
    </div>
  );
};

export default ShopSettings;