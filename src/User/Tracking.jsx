
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const Tracking = () => {
  const { deviceId } = useParams();
  const [currentStatus, setCurrentStatus] = useState('Processing');


  const device = {
    1: { name: 'MacBook Pro 14"', price: 1999 },
    2: { name: 'iPhone 13 Pro', price: 999 },
    3: { name: 'iPad Air', price: 450 },
    4: { name: 'Samsung Odyssey G7', price: 699 },
    5: { name: 'PlayStation 5', price: 499 }
  }[deviceId];

  
  useEffect(() => {
    const statuses = ['Processing', 'Confirmed', 'Preparing', 'Shipped', 'Out for Delivery', 'Delivered'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < statuses.length - 1) {
        currentIndex++;
        setCurrentStatus(statuses[currentIndex]);
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const statusSteps = [
    { id: 1, name: 'Processing', description: 'Your order is being verified' },
    { id: 2, name: 'Confirmed', description: 'Order confirmed and payment processed' },
    { id: 3, name: 'Preparing', description: 'Device is being prepared for shipment' },
    { id: 4, name: 'Shipped', description: 'Device has left our warehouse' },
    { id: 5, name: 'Out for Delivery', description: 'Device is with the delivery agent' },
    { id: 6, name: 'Delivered', description: 'Device has been delivered' }
  ];

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Order Tracking</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        <div className="flex items-center">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <span className="text-blue-600 text-xl"></span>
          </div>
          <div>
            <h3 className="font-bold">{device.name}</h3>
            <p className="text-blue-600 font-semibold">{device.price} EGP</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">Delivery Status</h2>
        
        <div className="relative">
          
          <div className="absolute left-4 top-0 h-full w-1 bg-gray-200"></div>
          
          {statusSteps.map((step) => (
            <div key={step.id} className="relative flex items-start mb-8">
              <div className={`z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                currentStatus === step.name ? 'bg-green-500' : 
                statusSteps.findIndex(s => s.name === currentStatus) >= step.id - 1 ? 'bg-blue-500' : 'bg-gray-300'
              } text-white mr-4`}>
                {currentStatus === step.name || 
                statusSteps.findIndex(s => s.name === currentStatus) >= step.id - 1 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <div className={`flex-1 ${currentStatus === step.name ? 'font-bold' : ''}`}>
                <h3 className="text-lg">{step.name}</h3>
                <p className="text-gray-600">{step.description}</p>
                {currentStatus === step.name && (
                  <p className="text-green-600 mt-1">Current Status</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {currentStatus === 'Delivered' && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg text-green-800">
            <p className="font-medium"> Your device has been delivered!</p>
            <p className="mt-1">Thank you for your purchase.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tracking;