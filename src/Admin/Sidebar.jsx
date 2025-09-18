import React, { useState, useEffect } from 'react';
import { 
  FiHome, FiShoppingBag, FiUsers, 
  FiChevronDown, FiChevronRight, FiMenu, FiX,
  FiMessageSquare, FiTag,
  FiDollarSign,
  FiStar,
} from 'react-icons/fi';
import logo from "../images/logo.png"
import { Link } from 'react-router-dom';


const Sidebar = ({ darkMode, toggleDarkMode, activePage, setActivePage }) => {
  const [openDropdown, setOpenDropdown] = useState({
    shops: false,
    devices: false,
    users: false,
    settings: false,
    offers: false,
    chats: false
  });
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const toggleDropdown = (item) => {
    setOpenDropdown({
      ...openDropdown,
      [item]: !openDropdown[item]
    });
  };

  const menuItems = [
    {
      name: 'dashboard',
      path: '/admin-dashboard',
      icon: <FiHome className="w-5 h-5" />,
      label: 'Dashboard'
    },
    // {
    //   name: 'devices',
    //   path: '/devices',
    //   icon: <FiTool className="w-5 h-5" />,
    //   label: 'Devices',
    //   subItems: [
    //     { name: 'all-devices', path: '/devices/all', label: 'All Devices' },
    //     { name: 'add-device', path: '/devices/add', label: 'Add New Device' },
    //   ]
    // },
    {
      name: 'shops',
      path: '/shops',
      icon: <FiShoppingBag className="w-5 h-5" />,
      label: 'Shops',
      subItems: [
        { name: 'all-shops', path: '/shops/all', label: 'All Shops' },
        { name: 'add-shop', path: '/shops/add', label: 'Add New Shop' },

      ]
    },
    {
      name: 'users',
      path: '/users',
      icon: <FiUsers className="w-5 h-5" />,
      label: 'Users',
      subItems: [
        { name: 'all-users', path: '/users/all', label: 'All Users' },
        { name: 'user-roles', path: '/users/roles', label: 'User Roles' }
      ]
    },
        {
      name: 'transactions',
      path: '/transactions',
      icon: <FiDollarSign className="w-5 h-5" />,
      label: 'Transactions',
      subItems: [
        { name: 'repair-transactions', path: '/transactions/repair', label: 'Repair Transactions' },
        { name: 'purchase-transactions', path: '/transactions/purchase', label: 'Purchased Transactions' },
      ]
    },
    {
      name: 'offers',
      path: '/offers',
      icon: <FiTag className="w-5 h-5" />,
      label: 'Offers',
      subItems: [
        { name: 'all-offers', path: '/offers/all', label: 'All Offers' },
        { name: 'create-offer', path: '/offers/create', label: 'Create Offer' }
      ]
    },
    {
      name: 'chats',
      path: '/chats',
      icon: <FiMessageSquare className="w-5 h-5" />,
      label: 'Support',
      subItems: [
        { name: 'all-chats', path: '/chats/all', label: 'All Conversations' },
      ]
    },
    {
      name: 'reviews',
      path: '/reviews',
      icon: <FiStar className="w-5 h-5" />,
      label: 'Reviews'
    }
  ];

  return (
    <>
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed z-30 md:hidden m-2 p-2 rounded-lg ${
          darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
        }`}
      >
        {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      <div
        className={`fixed left-0 top-0 h-screen transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 border-r border-gray-200'
        } ${
          isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className={`flex  items-center ${sidebarOpen ? 'mb-8 p-4' : 'justify-center py-6'}`}>
         <img src={logo} className="h-20 w-auto object-cover" alt="" />
          {sidebarOpen && <h1 className="text-sm font-bold"> Tech & Restore</h1>}
        </div>
        
        <div className="space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.name} className="mb-1">
              {item.subItems ? (
                <>
                  <button
                    onClick={() => toggleDropdown(item.name)}
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
                    {sidebarOpen && (
                      <span>
                        {openDropdown[item.name] ? <FiChevronDown /> : <FiChevronRight />}
                      </span>
                    )}
                  </button>
            
                  
                  {item.subItems && openDropdown[item.name] && sidebarOpen && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          to={subItem.path}
                          key={subItem.name}
                          className={`block w-full text-left p-2 pl-4 rounded-lg transition-colors text-blue-500 font-semibold text-sm  ${
                            activePage === subItem.name ? (darkMode ? 'bg-blue-900' : 'bg-blue-50') : ''
                          } ${
                            darkMode ? 'hover:bg-gray-700 text-blue-300' : 'hover:bg-gray-100 text-blue-600'
                          }`}
                          onClick={() => setActivePage(subItem.name)}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    
                    </div>
                    
                  )}
             
                </>
              ) : (
                <Link
                  to={item.path}
                  className={`w-full flex items-center ${
                    sidebarOpen ? 'justify-start p-3' : 'justify-center p-3'
                  } rounded-lg transition-colors ${
                    activePage === item.name ? (darkMode ? 'bg-blue-900' : 'bg-blue-100') : ''
                  } ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                  title={!sidebarOpen ? item.label : ''}
                  onClick={() => setActivePage(item.name)}
                >
                  <div className="flex items-center">
                    <span className={`${sidebarOpen ? 'mr-3' : ''} ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      {item.icon}
                    </span>
                    {sidebarOpen && <span className="font-medium">{item.label}</span>}
                  </div>
                </Link>
              )}
            </div>
          ))}
          
        </div>
        
        <div className={`absolute bottom-4 left-0 right-0 ${sidebarOpen ? 'px-4' : 'px-2'}`}>
          <button 
            onClick={toggleDarkMode}
            className={`w-full flex items-center ${
              sidebarOpen ? 'p-3' : 'p-2 justify-center'
            } rounded-lg ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 border hover:bg-gray-200'
            }`}
            title={!sidebarOpen ? (darkMode ? 'Light Mode' : 'Dark Mode') : ''}
          >
            <span className={`${sidebarOpen ? 'mr-3' : ''} ${darkMode ? 'text-yellow-300' : 'text-gray-700'}`}>
              {darkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </span>
            {sidebarOpen && <span className='text-blue-500 font-semibold'>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          
        
        </div>
      </div>

      
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
