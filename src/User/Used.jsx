
import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Used = ({darkMode}) => {
  const [filters, setFilters] = useState({
    category: '',
    minPrice: 0,
    maxPrice: 2000
  });

  const [imageLoadStatus, setImageLoadStatus] = useState({});
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(0);




  
  const devices = [
    {
      id: 1,
      name: 'MacBook Pro 14"',
      category: 'Laptop',
      condition: 'Used',
      price: 1999,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202110?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1632788574000'
    },
    {
      id: 2,
      name: 'iPhone 13 Pro',
      category: 'Phone',
      condition: 'Used',
      price: 999,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-family-hero?wid=940&hei=1112&fmt=png-alpha&.v=1631220221000'
    },
    {
      id: 3,
      name: 'iPad Air',
      category: 'Tablet',
      condition: 'Used',
      price: 450,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-select-wifi-blue-202203?wid=940&hei=1112&fmt=png-alpha&.v=1645066731286'
    },
    {
      id: 4,
      name: 'PlayStation 5',
      category: 'Console',
      condition: 'Used',
      price: 499,
      imageUrl: 'https://media.direct.playstation.com/is/image/psdglobal/PS5-console-front'
    },
    {
      id: 5,
      name: 'MacBook Pro 14"',
      category: 'Laptop',
      condition: 'Used',
      price: 1999,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202110?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1632788574000'
    },
    {
      id: 6,
      name: 'iPhone 13 Pro',
      category: 'Phone',
      condition: 'Used',
      price: 999,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-family-hero?wid=940&hei=1112&fmt=png-alpha&.v=1631220221000'
    },
    {
      id: 7,
      name: 'iPad Air',
      category: 'Tablet',
      condition: 'Used',
      price: 450,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-select-wifi-blue-202203?wid=940&hei=1112&fmt=png-alpha&.v=1645066731286'
    },
    {
      id: 8,
      name: 'PlayStation 5',
      category: 'Console',
      condition: 'Used',
      price: 499,
      imageUrl: 'https://media.direct.playstation.com/is/image/psdglobal/PS5-console-front'
    }
  ];

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleImageLoad = (id) => {
    setImageLoadStatus(prev => ({ ...prev, [id]: true }));
  };

  const filteredDevices = devices.filter(device => {
    return (
      (filters.category === '' || device.category === filters.category) &&
      device.price >= filters.minPrice && 
      device.price <= filters.maxPrice
    );
  });

  const mostPurchasedDevices = [
    {
      id: 101,
      name: 'iPhone 14 Pro',
      category: 'Phone',
      condition: 'Used',
      price: 1099,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-model-unselect-gallery-1-202209?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1660753619946'
    },
    {
      id: 102,
      name: 'MacBook Air M2',
      category: 'Laptop',
      condition: 'Used',
      price: 1199,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1653084303665'
    },
    {
      id: 103,
      name: 'Samsung Galaxy S23',
      category: 'Phone',
      condition: 'Used',
      price: 799,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/levant/2202/gallery/levant-galaxy-s23-ultra-5g-sm-s918-412360-sm-s918bzkgmea-thumb-534606516?$216_216_PNG$'
    },
    {
      id: 104,
      name: 'iPad Pro 12.9"',
      category: 'Tablet',
      condition: 'Used',
      price: 1099,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-12-11-select-202210?wid=940&hei=1112&fmt=png-alpha&.v=1666989131057'
    }
  ];


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % mostPurchasedDevices.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mostPurchasedDevices.length]);


  return (
    <div className={`container-fluid ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-white to-indigo-50'} mx-auto mt-6 p-4 md:p-6`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl inline-block bg-blue-500 dark:bg-gray-800 text-white justify-center items-center gap-4 md:text-4xl font-bold mb-6 p-4 rounded-2xl border-blue-700"> 

          Used Devices
        </h1>
        
      
        <div className="bg-white p-5 rounded-xl shadow-lg mb-8 dark:bg-gray-950 dark:border-gray-800 border border-indigo-100">
          <h2 className="text-lg font-semibold text-gray-400 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            Filter By
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className='mt-2'>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 dark:bg-transparent text-sm font-semibold cursor-pointer text-blue-500 border-b-2 border-blue-500 focus:outline-none bg-white shadow-sm"
              >
                <option value="" className='font-bold'>All Categories</option>
                <option value="Laptop" className='font-bold'>Laptop</option>
                <option value="Phone" className='font-bold'>Phone</option>
                <option value="Tablet" className='font-bold'>Tablet</option>
                <option value="Screen" className='font-bold'>Screen</option>
                <option value="Console" className='font-bold'>Console</option>
              </select>
            </div>
        
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Price: <span className="font-bold text-blue-700">{filters.minPrice} EGP</span>
              </label>
              <input
                type="range"
                name="minPrice"
                min="0"
                max="2000"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 EGP</span>
                <span>2000 EGP</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Price: <span className="font-bold text-blue-700">{filters.maxPrice} EGP</span>
              </label>
              <input
                type="range"
                name="maxPrice"
                min="0"
                max="2000"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 EGP</span>
                <span>2000 EGP</span>
              </div>
            </div>
          </div>
        </div>
        
     
        
       
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDevices.map(device => (
            <div
              key={device.id}
              className="bg-white dark:bg-gray-950 dark:border-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
              onClick={() => navigate(`/device/${device.id}`)}
            >
              <div className="h-52 bg-gray-50 dark:bg-gray-900 border-b-2 dark:border-gray-800 p-4 flex items-center justify-center relative">
             
                {!imageLoadStatus[device.id] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg 
                      className="animate-spin h-10 w-10 text-blue-600" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      ></circle>
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                )}
                
                <img 
                  src={device.imageUrl} 
                  alt={device.name}
                  className={`max-h-full max-w-full object-contain ${imageLoadStatus[device.id] ? 'block' : 'invisible'}`}
                  onLoad={() => handleImageLoad(device.id)}
                />
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-1 dark:text-white">{device.name}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    device.condition === 'Used' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {device.condition}
                  </span>
                </div>
                <p className="text-gray-400 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {device.category}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-xl font-bold text-blue-600">{device.price.toLocaleString()} EGP</p>
                  <button className="text-sm bg-blue-600 font-bold hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition">
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredDevices.length === 0 && (
            <div className="col-span-full text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-medium text-gray-700 mt-4">No devices found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your filters to see more results</p>
            </div>
          )}
        </div>
      </div>




        <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg mb-8 mt-6 p-6">
            <div className='flex justify-between items-center'>
          <h2 className="text-2xl font-bold text-emerald-700 mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Most Purchased Devices
          </h2>
          <button className='bg-emerald-700 text-white p-3 rounded-2xl mb-4 text-sm font-bold '>Explore Devices</button>
          </div>

          
          <div className="relative overflow-hidden rounded-lg">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              // eslint-disable-next-line no-undef
                 style={{ transform: `translateX(-${currentSlide * 100}%)` }}

            >
              {mostPurchasedDevices.map((device, index) => (
                <div 
                  key={device.id} 
                  className="w-full mx-auto flex-shrink-0 px-2"
                >
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
                    <div className="h-64 bg-white dark:bg-gray-950 dark:border-gray-800 border-2 rounded-xl border-gray-200 p-4 flex items-center justify-center relative">
                      {!imageLoadStatus[`most-${device.id}`] && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg 
                            className="animate-spin h-10 w-10 text-blue-600" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24"
                          >
                            <circle 
                              className="opacity-25" 
                              cx="12" 
                              cy="12" 
                              r="10" 
                              stroke="currentColor" 
                              strokeWidth="4"
                            ></circle>
                            <path 
                              className="opacity-75" 
                              fill="currentColor" 
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </div>
                      )}
                      <img 
                        src={device.imageUrl} 
                        alt={device.name}
                        className={`max-h-full max-w-full object-contain ${imageLoadStatus[`most-${device.id}`] ? 'block' : 'invisible'}`}
                        onLoad={() => handleImageLoad(`most-${device.id}`)}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{device.name}</h3>
                      <p className="text-gray-400">{device.category}</p>
                      <p className="text-xl font-bold text-blue-600 mt-2">{device.price.toLocaleString()} EGP</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

  
          <div className="flex justify-center mt-6">
            {mostPurchasedDevices.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 mx-1 rounded-full transition-colors ${currentSlide === index ? 'bg-white' : 'bg-blue-200'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>




          <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg mb-8 mt-6 p-6">
            <div className='flex justify-between items-center'>
          <h2 className="text-3xl font-bold text-purple-700  mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
           Lastest Devices
          </h2>
          <button className='bg-purple-700 text-white p-3 rounded-2xl mb-4 text-sm font-bold '>Explore Devices</button>
          </div>

          
          <div className="relative overflow-hidden rounded-lg">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              // eslint-disable-next-line no-undef
                 style={{ transform: `translateX(-${currentSlide * 100}%)` }}

            >
              {mostPurchasedDevices.map((device, index) => (
                <div 
                  key={device.id} 
                  className="w-full mx-auto flex-shrink-0 px-2"
                >
                  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
                    <div className="h-64 bg-white dark:bg-gray-950 dark:border-gray-800 rounded-xl border-2 border-gray-200 p-4 flex items-center justify-center relative">
                      {!imageLoadStatus[`most-${device.id}`] && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg 
                            className="animate-spin h-10 w-10 text-blue-600" 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24"
                          >
                            <circle 
                              className="opacity-25" 
                              cx="12" 
                              cy="12" 
                              r="10" 
                              stroke="currentColor" 
                              strokeWidth="4"
                            ></circle>
                            <path 
                              className="opacity-75" 
                              fill="currentColor" 
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </div>
                      )}
                      <img 
                        src={device.imageUrl} 
                        alt={device.name}
                        className={`max-h-full max-w-full object-contain ${imageLoadStatus[`most-${device.id}`] ? 'block' : 'invisible'}`}
                        onLoad={() => handleImageLoad(`most-${device.id}`)}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{device.name}</h3>
                      <p className="text-gray-400">{device.category}</p>
                      <p className="text-xl font-bold text-blue-600 mt-2">{device.price.toLocaleString()} EGP</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          
          <div className="flex justify-center mt-6">
            {mostPurchasedDevices.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 mx-1 rounded-full transition-colors ${currentSlide === index ? 'bg-white' : 'bg-blue-500'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

    </div>
  );
};

export default Used;