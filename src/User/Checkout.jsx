
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';


const Checkout = () => {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    paymentMethod: 'Cash on Delivery',
    address: '',
    city: '',
    zipCode: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);



  const device = {
    1: {
      name: 'MacBook Pro 14"',
      price: 1999,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202110?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1632788574000'
    },
    2: {
      name: 'iPhone 13 Pro',
      price: 999,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-family-hero?wid=940&hei=1112&fmt=png-alpha&.v=1631220221000'
    },
    3: {
      name: 'iPad Air',
      price: 450,
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-select-wifi-blue-202203?wid=940&hei=1112&fmt=png-alpha&.v=1645066731286'
    },
    4: {
      name: 'Samsung Odyssey G7',
      price: 699,
      imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/br/ls32bg700nlxzd/gallery/br-odyssey-g7-g70b-ls32bg700nlxzd-532883917?$650_519_PNG$'
    },
    5: {
      name: 'PlayStation 5',
      price: 499,
      imageUrl: 'https://media.direct.playstation.com/is/image/psdglobal/PS5-console-front'
    }
  }[deviceId];

    const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuccess(true);
    

    setTimeout(() => {
      navigate(`/tracking/${deviceId}`);
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="container mx-auto p-4 max-w-2xl flex flex-col items-center justify-center h-96">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-4">Your order #{Math.floor(Math.random() * 10000)} has been confirmed.</p>
          <p className="text-gray-500">Redirecting to tracking page...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
    
        <div className="flex items-start mb-6 p-4 bg-gray-50 rounded-lg">
          <img 
            src={device.imageUrl} 
            alt={device.name}
            className="w-24 h-24 object-contain mr-4"
          />
          <div>
            <h2 className="font-bold text-xl">{device.name}</h2>
            <p className="text-blue-600 font-bold text-lg">${device.price}</p>
          </div>
        </div>
        
 
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Payment Method</h2>
          <div className="space-y-3">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:border-blue-400">
              <input
                type="radio"
                name="paymentMethod"
                value="Cash on Delivery"
                checked={formData.paymentMethod === 'Cash on Delivery'}
                onChange={handleChange}
                className="mr-3"
              />
              <div>
                <h3 className="font-medium">Cash on Delivery</h3>
                <p className="text-sm text-gray-600">Pay when you receive the device</p>
              </div>
            </label>
            
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:border-blue-400">
              <input
                type="radio"
                name="paymentMethod"
                value="Visa"
                checked={formData.paymentMethod === 'Visa'}
                onChange={handleChange}
                className="mr-3"
              />
              <div>
                <h3 className="font-medium">Credit/Debit Card (Visa)</h3>
                <p className="text-sm text-gray-600">Secure online payment</p>
              </div>
            </label>
          </div>
        </div>
        
      
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Delivery Address</h2>
          <div className="space-y-3">
            <div>
              <label className="block mb-1">Street Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="block w-full cursor-pointer pl-10 pr-3 py-3 bg-[#ECF0F3] border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="block w-full cursor-pointer pl-10 pr-3 py-3 bg-[#ECF0F3] border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="block w-full cursor-pointer pl-10 pr-3 py-3 bg-[#ECF0F3] border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
  
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          Complete Order
        </button>
      </div>
    </div>
  );
};

export default Checkout;