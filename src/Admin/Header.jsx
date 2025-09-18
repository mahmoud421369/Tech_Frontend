/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import { 
  FiHome, FiTool, FiUsers, FiSettings, 
  FiChevronDown, FiChevronRight, FiLogOut, FiMenu, FiX,
  FiBell,  FiUser,
  FiDollarSign,
  FiStar,
  FiTag,
  FiHeadphones
} from 'react-icons/fi';
import logo from "../images/logo.png"
import { Link } from 'react-router-dom';


const Header = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(3);
  
  const notifications = [
    {
      id: 1,
      title: 'New device registered',
      message: 'A new iPhone 13 was added to the system',
      time: '10 minutes ago',
      read: false
    },
    {
      id: 2,
      title: 'Maintenance required',
      message: 'Device #1234 needs servicing',
      time: '2 hours ago',
      read: true
    },
    {
      id: 3,
      title: 'New message',
      message: 'You have a new message from customer',
      time: '1 day ago',
      read: true
    }
  ];

  const user = {
    name: 'Mahmoud Ali',
    email: 'tech@repairdevices.com',
    role: 'Admin',
    avatar: null
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleDropdown = (item) => {
    setOpenDropdown({
      ...openDropdown,
      [item]: !openDropdown[item]
    });
  };

  const [openDropdown, setOpenDropdown] = useState({
    shops: false,
    devices: false,
    users: false,
    settings: false
  });

  const menuItems = [
    {
      name: 'dashboard',
      icon: <FiHome className="w-5 h-5" />,
      label: 'Dashboard',
      path:'/dashboard'
    },
    {
      name: 'users',
      icon: <FiUsers className="w-5 h-5" />,
      label: 'Users',
      path: '/users',

    },
    {
      name: 'repair shops',
      icon: <FiTool className="w-5 h-5" />,
      label: 'Repair Shops',
      path: '/repair-shops',

    },
    {
      name: 'Categories',
      icon: <FiMenu className="w-5 h-5" />,
      label: 'Categories',
      path: '/category',

    },
    {
      name: 'transactions',
      icon: <FiDollarSign className="w-5 h-5" />,
      label: 'Transactions',
      path:'/transactions'
  
    },
    {
      name: 'reviews',
      icon: <FiStar className="w-5 h-5" />,
      label: 'Reviews',
      path:'/reviews',
    
    },
      {
      name: 'promotional offers',
      icon: <FiTag className="w-5 h-5" />,
      label: 'Promotional Offers',
      path:'/promotional-offers'
    },
     
      {
      name: 'support ',
      icon: <FiHeadphones className="w-5 h-5" />,
      label: 'Support',
        path:'/support-requests'

    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchTerm);
    
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#f1f5f9] text-gray-800'}`}>
      
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed z-30 md:hidden m-2 p-2 rounded-lg ${
          darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
        }`}
      >
        {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      
      <div
        className={`fixed left-0 top-0 h-screen transition-all duration-300 z-20 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 border-r border-gray-200'
        } ${
          isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className={`flex items-center ${sidebarOpen ? 'mb-8 p-4' : 'justify-center py-6'}`}>
           <img src={logo} className="h-20 w-auto object-cover" alt="" />
                 {sidebarOpen && <h1 className="text-sm font-bold"> Tech & Restore</h1>}
        </div>
        
        <div className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.name} className="mb-1">
              <Link
              to={item.path}
                onClick={() => item.subItems ? toggleDropdown(item.name) : setActivePage(item.name)}
                className={`w-full flex items-center ${
                  sidebarOpen ? 'justify-between p-3' : 'justify-center p-3'
                } rounded-lg transition-colors ${
                  activePage === item.name ? (darkMode ? 'bg-blue-900' : 'bg-blue-100') : ''
                } ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <div className="flex items-center">
                  <span className={`${sidebarOpen ? 'mr-3' : ''} ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                    {item.icon}
                  </span>
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </div>
                {item.subItems && sidebarOpen && (
                  <span>
                    {openDropdown[item.name] ? <FiChevronDown /> : <FiChevronRight />}
                  </span>
                )}
              </Link>
              
              {item.subItems && openDropdown[item.name] && sidebarOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                    to={subItem.path}
                      key={subItem.name}
                      onClick={() => setActivePage(subItem.name)}
                      className={`w-full text-left p-2 pl-4 rounded-lg transition-colors
                        ${activePage === subItem.name ? (darkMode ? 'bg-blue-900' : 'bg-blue-50') : ''}
                        ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
       
      </div>
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'md:ml-64' : 'md:ml-20'
      }`}>
        
        <header className={`fixed top-0 right-0 h-16 z-10 transition-all duration-300 ${
          sidebarOpen ? 'md:left-64' : 'md:left-20'
        } ${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'}`}>
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center">
              <div className="md:hidden mr-4">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)} 
                  className="p-2 rounded-lg focus:outline-none"
                >
                  <FiMenu className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
                </button>
              </div>
              
              {/* <div className="hidden md:block">
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {activePage.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </h1>
              </div> */}
            </div>
            
            {/* Search Bar */}
            {/* <div className="flex-grow max-w-xl mx-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full py-2 cursor-pointer pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-800'
                  }`}
                />
                <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <FiSearch className="w-5 h-5" />
                </div>
              </form>
            </div> */}
            
           
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-full ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <FiBell className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* <button 
                className={`relative p-2 rounded-full ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <FiMail className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </button> */}
              
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className={`hidden md:block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {user.name}
                  </span>
                  <FiChevronDown className={`hidden md:block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>
                
              
                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-20
                    ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <a 
                      href="#" 
                      className={`block px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      <FiUser className="inline mr-2" /> Profile
                    </a>
                    <a 
                      href="#" 
                      className={`block px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      <FiSettings className="inline mr-2" /> Settings
                    </a>
                    <a 
                      href="#" 
                      className={`block px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      <FiLogOut className="inline mr-2" /> Logout
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          
          {showNotifications && (
            <div className={`absolute right-4 mt-2 w-80 rounded-md shadow-lg py-1 z-20 max-h-96 overflow-y-auto
              ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className={`px-4 py-2 border-b ${
                darkMode ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-900'
              }`}>
                <h3 className="font-medium">Notifications</h3>
                <p className="text-xs text-gray-500">{unreadCount} unread notifications</p>
              </div>
              
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`px-4 py-3 border-b ${
                    darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                  } ${!notification.read ? (darkMode ? 'bg-gray-900' : 'bg-blue-50') : ''}`}
                >
                  <div className="flex items-start">
                    <div className={`mr-3 mt-1 w-2 h-2 rounded-full ${
                      !notification.read ? 'bg-blue-500' : 'bg-transparent'
                    }`}></div>
                    <div>
                      <p className={`font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>{notification.title}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <a 
                href="#" 
                className={`block text-center py-2 text-sm ${
                  darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-50'
                }`}
              >
                View all notifications
              </a>
            </div>
          )}
        </header>

        
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        {/* <main className="flex-1 pt-16 pb-4 px-4 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className={`p-6 rounded-lg ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h2 className={`text-2xl font-bold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>
                Welcome back, {user.name}!
              </h2>
          
            </div>
          </div>
        </main> */}
      </div>
    </div>
  );
};

export default Header;