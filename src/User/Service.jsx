
import React from 'react';
import { FiSmartphone, FiMonitor, FiTablet, FiDatabase, FiTool, FiShoppingBag } from 'react-icons/fi';

const Service = ({ darkMode }) => {
  const services = [
    {
      id: 1,
      title: "Smartphone Repair",
      icon: <FiSmartphone className="text-4xl text-white" />,
      description: "Screen replacement, battery issues, water damage, and more."
    },
    {
      id: 2,
      title: "Laptop Repair",
      icon: <FiMonitor className="text-4xl text-white" />,
      description: "Hardware upgrades, screen repair, keyboard replacement."
    },
    {
      id: 3,
      title: "Tablet Repair",
      icon: <FiTablet className="text-4xl text-white" />,
      description: "Screen repair, charging port issues, software problems."
    },
    {
      id: 4,
      title: "Data Recovery",
      icon: <FiDatabase className="text-4xl text-white" />,
      description: "Recover lost data from damaged devices."
    }
  ];

  return (
    <section
      id="services"
      style={{ borderTopLeftRadius: "25px", borderTopRightRadius: "25px" }}
      className={`relative min-h-80 max-w-full overflow-hidden mt-20 py-16 ${darkMode ? 'bg-gray-800' : 'bg-[#f1f5f9]'}`}
    >
  
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <FiTool className="absolute w-10 h-10 text-gray-400 bottom-1/3 right-1/5 animate-float-medium dark:text-blue-500" />
        <FiShoppingBag className="absolute w-10 h-10 text-gray-400 top-1/3 right-1/4 animate-float-slow dark:text-blue-500" />
        <FiShoppingBag className="absolute w-10 h-10 text-gray-400 bottom-1/4 left-1/3 animate-float-fast dark:text-blue-500" />
        <FiSmartphone className="absolute w-10 h-10 text-gray-400 top-10 left-10 animate-float-medium dark:text-blue-500" />
        <FiSmartphone className="absolute w-10 h-10 text-gray-400 right-20 animate-float-slow dark:text-blue-500" />
        <FiMonitor className="absolute w-10 h-10 text-gray-400 top-1/2 left-1/4 animate-float-fast dark:text-blue-500" />
      </div>

      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-blue-500 mb-4 dark:text-white flex justify-center items-center gap-4">
            <FiTool size={35} className='text-blue-500 dark:text-white' />Our Repair Services
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Professional repair services for all your devices with warranty
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map(service => (
            <div
              key={service.id}
              className={`${darkMode ? ' bg-white/10 border-white/20 ' : 'bg-gradient-to-br from-blue-500 to-indigo-600 backdrop-blur-md'}relative rounded-xl p-6  text-center cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-2xl`}
             
            >
              <div className="flex justify-center mb-4">
                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                  {service.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
              <p className="text-white/80">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Service;