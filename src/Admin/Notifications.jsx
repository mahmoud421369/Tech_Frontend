import React, { useState } from 'react';
import { FiBell, FiShoppingBag, FiUser, FiHome,FiDollarSign,FiTrash2, FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';

const Notifications = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 5;
 
  const notifications = [
    { id: 1, type: 'system', title: 'System Update', message: 'A new system update is available for installation', time: '2 minutes ago', read: false },
    { id: 2, type: 'order', title: 'New Order', message: 'You have received a new device repair order', time: '15 minutes ago', read: false },
    { id: 3, type: 'user', title: 'New User', message: 'A new user has registered on the platform', time: '1 hour ago', read: true },
    { id: 4, type: 'shop', title: 'Shop Approved', message: 'Your shop registration has been approved', time: '3 hours ago', read: true },
    { id: 5, type: 'payment', title: 'Payment Received', message: 'Payment for order #ORD-12345 has been received', time: '5 hours ago', read: true },
    { id: 6, type: 'system', title: 'Maintenance Notice', message: 'Scheduled maintenance will occur tonight at 2 AM', time: '1 day ago', read: true },
    { id: 7, type: 'device', title: 'Low Stock', message: 'iPhone 12 Pro is running low in stock', time: '2 days ago', read: true },
  ];
  
  
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notif => notif.type === activeTab);

  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = filteredNotifications.slice(indexOfFirstNotification, indexOfLastNotification);
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  const handleDelete = (id) => {
    console.log(`Delete notification with id: ${id}`);
  
  };
  
  const handleMarkAsRead = (id) => {
    console.log(`Mark notification ${id} as read`);
    
  };

  return (
    <div className={`p-6 transition-colors ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Notifications</h1>
        <div className="flex space-x-2">
          <button className={`px-4 py-2 rounded-lg ${
            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
          }`}>
            Mark All as Read
          </button>
          <button className={`px-4 py-2 rounded-lg ${
            darkMode ? 'bg-red-700 hover:bg-red-600' : 'bg-red-600 hover:bg-red-700'
          } text-white`}>
            Clear All
          </button>
        </div>
      </div>
      
     
      <div className={`flex border-b mb-6 ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          className={`py-3 px-6 font-medium ${
            activeTab === 'all' 
              ? (darkMode ? 'border-b-2 border-blue-500 text-blue-400' : 'border-b-2 border-blue-600 text-blue-600') 
              : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')
          }`}
        >
          All
        </button>
        <button
          onClick={() => { setActiveTab('system'); setCurrentPage(1); }}
          className={`py-3 px-6 font-medium ${
            activeTab === 'system' 
              ? (darkMode ? 'border-b-2 border-blue-500 text-blue-400' : 'border-b-2 border-blue-600 text-blue-600') 
              : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')
          }`}
        >
          System
        </button>
        <button
          onClick={() => { setActiveTab('order'); setCurrentPage(1); }}
          className={`py-3 px-6 font-medium ${
            activeTab === 'order' 
              ? (darkMode ? 'border-b-2 border-blue-500 text-blue-400' : 'border-b-2 border-blue-600 text-blue-600') 
              : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')
          }`}
        >
          Orders
        </button>
        <button
          onClick={() => { setActiveTab('user'); setCurrentPage(1); }}
          className={`py-3 px-6 font-medium ${
            activeTab === 'user' 
              ? (darkMode ? 'border-b-2 border-blue-500 text-blue-400' : 'border-b-2 border-blue-600 text-blue-600') 
              : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')
          }`}
        >
          Users
        </button>
      </div>
      
     
      <div className={`rounded-lg shadow-md overflow-hidden ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="space-y-1">
          {currentNotifications.length > 0 ? (
            currentNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 border-b ${
                  darkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'
                } ${!notification.read ? (darkMode ? 'bg-gray-900' : 'bg-blue-50') : ''}`}
              >
                <div className="flex justify-between">
                  <div className="flex items-start">
                    <div className={`mr-3 mt-1 w-2 h-2 rounded-full ${
                      !notification.read ? 'bg-blue-500' : 'bg-transparent'
                    }`}></div>
                    <div>
                      <div className="flex items-center">
                        <div className={`mr-2 ${
                          notification.type === 'system' ? 'text-blue-500' :
                          notification.type === 'order' ? 'text-green-500' :
                          notification.type === 'user' ? 'text-purple-500' :
                          notification.type === 'shop' ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {notification.type === 'system' && <FiBell className="w-5 h-5" />}
                          {notification.type === 'order' && <FiShoppingBag className="w-5 h-5" />}
                          {notification.type === 'user' && <FiUser className="w-5 h-5" />}
                          {notification.type === 'shop' && <FiHome className="w-5 h-5" />}
                          {notification.type === 'payment' && <FiDollarSign className="w-5 h-5" />}
                        </div>
                        <h3 className="font-medium">{notification.title}</h3>
                      </div>
                      <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {!notification.read && (
                      <button 
                        onClick={() => handleMarkAsRead(notification.id)}
                        className={`p-2 rounded-lg ${
                          darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <FiCheck className={`${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(notification.id)}
                      className={`p-2 rounded-lg ${
                        darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <FiTrash2 className={`${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <FiBell className={`mx-auto w-12 h-12 ${
                darkMode ? 'text-gray-600' : 'text-gray-400'
              } mb-4`} />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className={`${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                You don't have any notifications at this time.
              </p>
            </div>
          )}
        </div>
        
       
        {currentNotifications.length > 0 && (
          <div className={`flex items-center justify-between p-4 ${
            darkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <div>
              Showing {indexOfFirstNotification + 1} to {Math.min(indexOfLastNotification, filteredNotifications.length)} of {filteredNotifications.length} notifications
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg ${
                  currentPage === 1 
                    ? 'opacity-50 cursor-not-allowed' 
                    : darkMode 
                      ? 'bg-gray-600 hover:bg-gray-500' 
                      : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <FiChevronLeft />
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-10 h-10 rounded-lg ${
                    currentPage === i + 1
                      ? darkMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-600 text-white'
                      : darkMode 
                        ? 'bg-gray-600 hover:bg-gray-500' 
                        : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg ${
                  currentPage === totalPages 
                    ? 'opacity-50 cursor-not-allowed' 
                    : darkMode 
                      ? 'bg-gray-600 hover:bg-gray-500' 
                      : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;