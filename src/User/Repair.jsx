import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { 
  FaMobileAlt, FaLaptop, FaDesktop, FaTv, FaGamepad,
  FaTabletAlt,  FaArrowAltCircleRight,
   FaTimesCircle,  FaClock
} from 'react-icons/fa';
import { FiTool } from "react-icons/fi";


const RepairRequest = () => {
  const navigate = useNavigate();

 
  const [step, setStep] = useState(1);
  const [shops, setShops] = useState([]);
  const [addresses, setAddresses] = useState([]);
   const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [description, setDescription] = useState("");
  const [requestStatus, setRequestStatus] = useState(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [repairRequestId, setRepairRequestId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("authToken");

   
  const staticCategories = [
    { id: 1, name: "Laptop", icon: <FaLaptop size={40} className="text-blue-500" />, color: "bg-white text-blue-900" },
    { id: 2, name: "Phone", icon: <FaMobileAlt size={40} className="text-blue-500" />, color: "bg-white text-blue-900" },
    { id: 3, name: "Tablet", icon: <FaTabletAlt size={40} className="text-blue-500" />, color: "bg-white text-blue-900" },
    { id: 4, name: "Monitor", icon: <FaDesktop size={40} className="text-blue-500" />, color: "bg-white text-blue-900" },
    { id: 5, name: "PC", icon: <FaDesktop size={40} className="text-blue-500" />, color: "bg-white text-blue-900" },
    { id: 6, name: "Gaming Console", icon: <FaGamepad size={40} className="text-blue-500" />, color: "bg-white text-blue-900" },
    { id: 7, name: "TV", icon: <FaTv size={40} className="text-blue-500" />, color: "bg-white text-blue-900" },
    { id: 8, name: "Others", icon: <FaArrowAltCircleRight size={40} className="text-blue-500" />, color: "bg-white text-blue-900" },
  ];


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Login required");

        const res = await fetch("http://localhost:8080/api/users/categories", {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch categories");

        const data = await res.json();
        const content = data.content || [];
        if (content.length === 0) setCategories(staticCategories); 
        else setCategories(content.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: staticCategories.find(s => s.name === cat.name)?.icon || <FaArrowAltCircleRight size={40} className="text-blue-500" />,
          color: "bg-white text-blue-900"
        })));
      } catch (err) {
        console.error(err);
        Swal.fire("Error", err.message || "Cannot fetch categories", "error");
        setCategories(staticCategories);
      }
    };

    fetchCategories();
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setStep(2); 
  };



useEffect(() => {
  const fetchShops = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/users/shops/all", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch shops");
      const data = await res.json();
      setShops(data.content || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not load shops", "error");
    }
  };
  fetchShops();
}, [token]);




  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/users/addresses", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch addresses");
        const data = await res.json();
        setAddresses(data.content || []);
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Could not load addresses", "error");
      }
    };
    fetchAddresses();
  }, [token]);


const handleShopSelect = async (shop) => {
  setSelectedShop(shop);
  setIsLoading(true);
  setProgressPercentage(0);

  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      Swal.fire("Login Required", "Please login first", "error");
      navigate("/login");
      return;
    }

 
    setStep(3);

  } catch (err) {
    console.error(err);
    Swal.fire("Error", err.message, "error");
  } finally {
    setIsLoading(false);
  }
};

  const deliveryOptions = [
    {
      id: 1,
      name: "Home Delivery",
      description: "Pickup & delivery from your home",
      apiValue: "HOME_DELIVERY",
      icon: "🚚",
    },
    {
      id: 2,
      name: "Drop Off",
      description: "You drop off device at shop",
      apiValue: "SHOP_PICKUP",
      icon: "🏪",
    },
       {
      id: 3,
      name: "Courier service",
      description: "You drop off device at shop",
      apiValue: "COURIER_SERVICE",
      icon: "🏪",
    },
  ];


  const paymentOptions = [
    {
      id: 1,
      name: "Cash on Delivery",
      desc: "Pay when the device is repaired",
      apiValue: "CASH",
      icon: "💵",
    },
    {
      id: 2,
      name: "Credit Card",
      desc: "Pay securely online",
      apiValue: "CREDIT_CARD",
      icon: "💳",
    },
     {
      id: 3,
      name: "Debit Card",
      desc: "Pay securely online",
      apiValue: "DEBIT_CARD",
      icon: "💳",
    },
     {
      id: 4,
      name: "Bank Transfer",
      desc: "Pay securely online",
      apiValue: "BANK_TRANSFER",
      icon: "💳",
    },
  ];

  const handleDeliverySelect = (option) => {setSelectedDelivery(option); setStep(4)};
  const handlePaymentSelect = (option) => setSelectedPayment(option);

const createRepairRequest = async () => {
 
  if (!selectedShop || !selectedDelivery || !selectedPayment || !selectedAddress || !description) {
    Swal.fire("Missing Info", "Please complete all fields before submitting.", "warning");
    return;
  }

  const token = localStorage.getItem("authToken");
  if (!token) {
    Swal.fire("Login Required", "Please login first", "error");
    navigate("/login");
    return;
  }

  const requestData = {
    shopId: selectedShop.id.toString(),               
    deviceCategory: selectedCategory.id.toString(),   
    description: description || "No description provided",
    deliveryAddress: selectedAddress.id.toString(),  
    deliveryMethod: selectedDelivery.apiValue,       
    paymentMethod: selectedPayment.apiValue,    
  };

  try {
 
    const res = await fetch(
      `http://localhost:8080/api/users/repair-request/${selectedShop.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      }
    );

    console.log("Request Body:", requestData);

    const data = await res.json();
    console.log("🛠 Repair Request Response:", data);

    if (res.ok) {
      Swal.fire("Success!", "Your repair request has been created.", "success");
      setRepairRequestId(data.id);

      navigate("/repair-confirmation", {
        state: {
          category: selectedCategory,
          shop: selectedShop,
          delivery: selectedDelivery,
          payment: selectedPayment,
          requestId: data.id,
        },
      });
    } else {
      Swal.fire("Error", data.message || "Failed to create repair request.", "error");
    }
  } catch (err) {
    console.error("Error creating repair request:", err);

  }
};


  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 mt-32 bg-white">
            <h2 className="text-xl  text-center text-white px-3 py-2  bg-indigo-500 font-bold rounded-3xl inline-block ">Select Device Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`p-6 rounded-xl flex flex-col bg-gradient-to-br from-blue-500 to-indigo-600 items-center ${c.color} hover:scale-105 transition-transform`}
                  onClick={() => {
                    setSelectedCategory(c);
                    setStep(2);
                  }}
                >
                  <span className="text-4xl text-white mb-3"><FiTool/></span>
                  <span className="font-medium white text-sm text-white">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        if (isLoading)
          return (
            <div className="flex flex-col items-center py-12 mt-20">
              <FaClock className="text-blue-500 text-4xl mb-2" />
              <p>Waiting for shop approval...</p>
              <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mt-4">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="mt-2 text-gray-500">{estimatedTime}s remaining</p>
            </div>
          );

        if (requestStatus === "rejected")
          return (
            <div className="flex flex-col items-center py-12 mt-20">
              <FaTimesCircle className="text-red-500 text-4xl mb-4" />
              <p className="mb-4">Shop unavailable. Select another.</p>
              <button
                onClick={() => {
                  setRequestStatus(null);
                  setProgressPercentage(0);
                  setEstimatedTime(30);
                }}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg"
              >
                Try Another Shop
              </button>
            </div>
          );

        return (
          <div>
            <h2 className="text-xl mt-32  text-center text-white px-3 py-2  bg-indigo-500 font-bold rounded-3xl inline-block ">Select Shop </h2>

         
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className={`p-5 rounded-lg cursor-pointer ${
                  selectedShop?.id === shop.id
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-gray-300"
                } bg-gray-100`}
                onClick={() => handleShopSelect(shop)}
              >
                <div className="flex justify-between">
                  <h3 className="font-bold">{shop.name}</h3>
                  <span className="text-yellow-500">★ {shop.rating}</span>
                </div>
                <div className="flex justify-between text-gray-500 mt-2">
                  <span>Fee: {shop.fee}</span>
                  <span>Delivery: {shop.deliveryTime}</span>
                </div>
              </div>
            ))}
            <button
              className="mt-4 text-blue-500 hover:underline"
              onClick={() => setStep(1)}
            >
              ← Back to Categories
            </button>
          </div>
           </div>
        );

      case 3:
        return (
          <div className="space-y-4 mt-36 bg-[#f1f5f9] p-6 rounded-2xl">
        
            <div>
              <label className="block text-blue-500 font-medium mb-2">
                Choose Delivery Address
              </label>
              <select
                className="w-full pl-10 pr-3 py-3 rounded-xl cursor-pointer bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                value={selectedAddress?.id || ""}
                onChange={(e) => {
                  const addr = addresses.find((a) => a.id === e.target.value);
                  setSelectedAddress(addr);
                }}
              >
                <option value="">-- Select Address --</option>
                {addresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.street}, {addr.city}, {addr.state} 
                  </option>
                ))}
              </select>
            </div>

            
            <div>
              <label className="block text-blue-500 font-medium mb-4 mt-4">
                Problem Description
              </label>
              <textarea
                className="w-full pl-10 pr-3 py-3 rounded-xl cursor-pointer border bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                rows="4"
                placeholder="Describe your issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

       
            <h2 className="text-2xl font-bold text-center">Select Delivery Option</h2>
            {deliveryOptions.map((option) => (
              <div
                key={option.id}
                className={`p-4 rounded-lg bg-white cursor-pointer ${
                  selectedDelivery?.id === option.id
                    ? "border-blue-500 bg-blue-50"
                    : "hover:border-gray-300"
                } `}
                onClick={() => handleDeliverySelect(option)}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-3xl">{option.icon}</span>
                  <div>
                    <h3 className="font-bold">{option.name}</h3>
                    <p className="text-gray-500">{option.description}</p>
                  </div>
                </div>
              </div>
            ))}

            <button
              className="mt-4 text-blue-500 hover:underline"
              onClick={() => setStep(2)}
            >
              ← Back to Shops
            </button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 mt-20 bg-white p-5">
            <h2 className="text-2xl font-bold text-center">Select Payment Method</h2>
            {paymentOptions.map((option) => (
              <div
                key={option.id}
                className={`p-4 rounded-lg flex justify-between items-center cursor-pointer hover:scale-105 bg-gradient-to-br from-blue-500 to-indigo-600`}
                onClick={() => handlePaymentSelect(option)}
              >
                <div className="flex items-center space-x-4">
                  <span>{option.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{option.name}</h3>
                    <p className="text-white">{option.desc}</p>
                  </div>
                </div>
                <FaArrowAltCircleRight className="text-white" />
              </div>
            ))}
            <button
              className="mt-4 text-blue-500 hover:underline"
              onClick={() => setStep(3)}
            >
              ← Back to Delivery
            </button>

            <button
              onClick={createRepairRequest}
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg shadow font-bold hover:bg-blue-700 mt-6"
            >
              {isLoading ? "Submitting..." : "Submit Repair Request"}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="p-6 max-w-4xl mx-auto">{renderStep()}</div>;
};

export default RepairRequest;