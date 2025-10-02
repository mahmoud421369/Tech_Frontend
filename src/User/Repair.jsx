import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaMobileAlt,
  FaLaptop,
  FaDesktop,
  FaTv,
  FaGamepad,
  FaTabletAlt,
  FaArrowAltCircleRight,
  FaTimesCircle,
  FaClock,
  FaMapMarkedAlt,
  FaCheckCircle,
  FaTimes,
  FaInfoCircle,
  FaPhone,
  FaEnvelope,
  FaStar,
} from "react-icons/fa";
import { FiList, FiTool } from "react-icons/fi";
import {FaSpinner } from "react-icons/fa";

const RepairRequest = ({onApproved, onRejected}) => {
  const navigate = useNavigate();
const [addressSearch, setAddressSearch] = useState("");
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
  const [paymentMethod, setPaymentMethod] = useState("");
  const [progress, setProgress] = useState(0);
const [waitingForPrice,setWaitingForPrice] = useState(false)
  const [status, setStatus] = useState("waiting"); 

  const token = localStorage.getItem("authToken");

  const staticCategories = [
    { id: 1, name: "Laptop", icon: <FaLaptop size={28} />, color: "text-blue-600" },
    { id: 2, name: "Phone", icon: <FaMobileAlt size={28} />, color: "text-blue-600" },
    { id: 3, name: "Tablet", icon: <FaTabletAlt size={28} />, color: "text-blue-600" },
    { id: 4, name: "Monitor", icon: <FaDesktop size={28} />, color: "text-blue-600" },
    { id: 5, name: "PC", icon: <FaDesktop size={28} />, color: "text-blue-600" },
    { id: 6, name: "Gaming Console", icon: <FaGamepad size={28} />, color: "text-blue-600" },
    { id: 7, name: "TV", icon: <FaTv size={28} />, color: "text-blue-600" },
    { id: 8, name: "Others", icon: <FaArrowAltCircleRight size={28} />, color: "text-blue-600" },
  ];


  useEffect(() => {
    if (status !== "waiting") return;

    const timer = setInterval(() => {
      setProgress((prev) => Math.min(prev + 100 / 60, 100)); 
      setEstimatedTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);


  useEffect(() => {
    const fakeResponse = setTimeout(() => {//
      const random = Math.random();
      if (random > 0.3) {
        setStatus("approved");
        onApproved?.(); 
      } else {
        setStatus("rejected");
        onRejected?.();
      }
    }, 2000000);

    return () => clearTimeout(fakeResponse);
  }, []);


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (!token) throw new Error("Login required");
        const res = await fetch("http://localhost:8080/api/users/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const content = data.content || [];
        setCategories(
          content.length === 0
            ? staticCategories
            : content.map((cat) => ({
                id: cat.id,
                name: cat.name,
                icon: staticCategories.find((s) => s.name === cat.name)?.icon || (
                  <FaArrowAltCircleRight size={28} />
                ),
                color: "text-blue-600",
              }))
        );
      } catch {
        setCategories(staticCategories);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/users/shops/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setShops(data.content || []);
      } catch {
        Swal.fire("Error", "Could not load shops", "error");
      }
    };
    fetchShops();
  }, [token]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/users/addresses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAddresses(data.content || []);
      } catch {
        Swal.fire("Error", "Could not load addresses", "error");
      }
    };
    fetchAddresses();
  }, [token]);

  const handleShopSelect = (shop) => {
    setSelectedShop(shop);
    setStep(3);
  };
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
    shopId: selectedShop?.id?.toString() || "",
    deviceCategory: selectedCategory?.id?.toString() || "",
    description: description?.trim() || "No description provided",
    deliveryAddress: selectedAddress?.id?.toString() || "",
    deliveryMethod: selectedDelivery?.apiValue || "",
    paymentMethod: selectedPayment?.apiValue || "",
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

    const data = await res.json();
    console.log("🛠 Repair Request Response:", data);

    if (!res.ok) {
      Swal.fire("Error", data.message || "Failed to create repair request.", "error");
      return;
    }


    if (["CREDIT_CARD", "VISA"].includes(selectedPayment.apiValue)) {
      const repairId = data.id;
      try {
        const paymentRes = await fetch(
          `http://localhost:8080/api/payments/repair/card/${repairId}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const paymentData = await paymentRes.json();
        console.log("💳 Payment Response:", paymentData);

        if (!paymentRes.ok) {
          Swal.fire("Payment Failed", paymentData.message || "Unable to process payment.", "error");
          return;
        }

   
        if (paymentData.paymentURL) {
          window.open(paymentData.paymentURL, "_blank");
        } else {
          Swal.fire("Error", "Payment URL missing in response.", "error");
        }
      } catch (paymentErr) {
        console.error("Payment failed:", paymentErr);
        Swal.fire("Payment Error", paymentErr.message || "Something went wrong.", "error");
      }
    } else {

      Swal.fire({
        icon: "success",
        title: "Repair Request Created",
        text: "Your repair request has been submitted successfully!",
      }).then(() => navigate("/"));
    }

 
    setRepairRequestId(data.id);
  } catch (err) {
    console.error("Error creating repair request:", err);
    Swal.fire("Error", "Something went wrong. Please try again later.", "error");
  }
};
  const deliveryOptions = [
    { id: 1, name: "Home Delivery", description: "Pickup & delivery", apiValue: "HOME_DELIVERY", icon: "🚚" },
    { id: 2, name: "Drop Off", description: "Bring device to shop", apiValue: "SHOP_VISIT", icon: "🏪" },
    { id: 3, name: "Courier Service", description: "Courier pickup", apiValue: "PICKUP", icon: "📦" },
  ];

const paymentOptions = [
  { id: 1, name: "Cash on Delivery", desc: "Pay when the device is repaired", apiValue: "CASH", icon: "💵" },
  { id: 2, name: "Credit Card", desc: "Pay securely online", apiValue: "CREDIT_CARD", icon: "💳" },
  { id: 3, name: "Debit Card", desc: "Pay securely online", apiValue: "DEBIT_CARD", icon: "💳" },
  { id: 4, name: "Bank Transfer", desc: "Pay via bank account", apiValue: "BANK_TRANSFER", icon: "🏦" },
  { id: 5, name: "Mobile Wallet", desc: "Pay with Visa card", apiValue: "MOBILE_WALLET", icon: "💳" }, 
];

useEffect(() => {
  if (!waitingForPrice) return;

  let interval = setInterval(() => {
    setProgressPercentage((prev) => {
      if (prev >= 100) return 100;
      return prev + 5;
    });
    setEstimatedTime((prev) => (prev > 0 ? prev - 3 : 0));
  }, 3000);


  const responseTimeout = setTimeout(() => {
    const approved = Math.random() > 0.3;
    if (approved) {
      setRequestStatus("approved");
      setWaitingForPrice(false);
      setStep(3);
    } else {
      setRequestStatus("rejected");
    }
  }, 20000000);

  return () => {
    clearInterval(interval);
    clearTimeout(responseTimeout);
  };
}, [waitingForPrice]);
  const handleDeliverySelect = (option) => {
    setSelectedDelivery(option);
    setStep(4);
  };

  const handlePaymentSelect = (option) => setSelectedPayment(option);

  const steps = [
    "Device Type",
    "Select Shop",
    "Delivery & Address",
    "Payment Method",
  ];
  const renderStep = () => {
    switch (step) {
      case 0: 
     if (waitingForPrice) {
  return (
    <div className="flex flex-col items-center py-12 mt-20">
      <FaClock className="text-blue-500 text-4xl mb-2" />
      <h2 className="text-lg font-bold mb-2">Waiting for shop to set price...</h2>

   
      <div className="w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-4">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%`}}
        ></div>
      </div>

      <p className="mt-2 text-gray-500 dark:text-gray-400">
        {estimatedTime}s remaining
      </p>

   
      {requestStatus === "rejected" && (
        <div className="mt-6 text-center">
          <FaTimesCircle className="text-red-500 text-4xl mb-3" />
          <p className="mb-3">Shop rejected the repair request.</p>
          <button
            onClick={() => {
              setWaitingForPrice(false);
              setRequestStatus(null);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Another Shop
          </button>
        </div>
      )}
    </div>
  );
}
      case 1:
        return (
          <div className="dark:bg-gray-900">
            <h2 className="text-2xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
              Step 1: Select Device Type
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCategory(c);
                    setStep(2);
                  }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  <div className="text-3xl mb-4 flex justify-center items-center text-indigo-600">
                    <FiList />
                  </div>
                  <p className="font-semibold dark:text-white">{c.name}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        if (isLoading)
          return (
            <div className="flex flex-col items-center py-16">
              <FaClock className="text-blue-500 text-5xl mb-3" />
              <p className="text-lg font-medium">Waiting for shop approval...</p>
              <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mt-6">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="mt-3 text-gray-500 dark:text-gray-400">
                {estimatedTime}s remaining
              </p>
            </div>
          );

        if (requestStatus === "rejected")
          return (
            <div className="flex flex-col items-center py-16">
              <FaTimesCircle className="text-red-500 text-5xl mb-5" />
              <p className="mb-6 text-lg font-semibold">
                Shop unavailable. Select another.
              </p>
              <button
                onClick={() => {
                  setRequestStatus(null);
                  setProgressPercentage(0);
                  setEstimatedTime(30);
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
              >
                Try Another Shop
              </button>
            </div>
          );

        return (
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
              Step 2: Select Shop
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {shops.map((shop) => (
                <div
                onClick={() => {
  handleShopSelect(shop);
  setWaitingForPrice(true); 
  setRequestStatus(null);
  setProgressPercentage(0);
  setEstimatedTime(60);
}}
                  key={shop.id}
                  className={`p-6 rounded-2xl shadow-md border transition cursor-pointer ${
                    selectedShop?.id === shop.id
                      ? "border-blue-500 bg-blue-50 dark:bg-gray-800"
                      : "bg-white dark:bg-gray-950 dark:border-gray-700 hover:shadow-xl"
                  }`}

                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                      {shop.name}
                    </h3>
                    <span className="flex items-center text-yellow-500 font-semibold">
                      <FaStar className="mr-1" /> {shop.rating || "N/A"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-green-500" /> 0{shop.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <FaInfoCircle className="text-indigo-500" /> {shop.shopType}
                    </div>
                    <div className="flex items-center gap-2">
                      {shop.verified ? (
                        <FaCheckCircle className="text-green-600" />
                      ) : (
                        <FaTimesCircle className="text-red-500" />
                      )}
                      {shop.verified ? "Verified" : "Unverified"}
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="text-purple-500" />{" "}
                      {new Date(shop.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {shop.description && (
                    <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
                      {shop.description}
                    </p>
                  )}

                  {shop.shopAddress && (
                    <p className="mt-2 flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                      <FaMapMarkedAlt className="text-red-500" />
                      {shop.shopAddress.street}, {shop.shopAddress.city},{" "}
                      {shop.shopAddress.state}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              className="mt-6 text-blue-500 hover:underline"
              onClick={() => setStep(1)}
            >
              ← Back to Categories
            </button>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
              Step 3: Delivery & Address
            </h2>

            <label className="block text-blue-500 font-medium mb-2">
              Choose Delivery Address
            </label>
            <input
              type="text"
              placeholder="Search address..."
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-lg border dark:bg-gray-950 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
            />

            <div className="border rounded-lg bg-white dark:bg-gray-900 dark:text-white shadow-sm max-h-48 overflow-y-auto">
              {addresses
                .filter((addr) =>
                  `${addr.street} ${addr.city} ${addr.state}`
                    .toLowerCase()
                    .includes(addressSearch.toLowerCase())
                )
                .map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    className={`px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-700 ${
                      selectedAddress?.id === addr.id
                        ? "bg-blue-200 dark:bg-blue-600"
                        : ""
                    }`}
                  >
                    {addr.street}, {addr.city}, {addr.state}
                  </div>
                ))}
            </div>

            <label className="block text-blue-500 font-medium mt-6 mb-2">
              Problem Description
            </label>
            <textarea
              className="w-full px-3 py-3 rounded-xl border bg-gray-100 dark:bg-gray-950 dark:border-gray-700 cursor-pointer dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Describe your issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>

            <h2 className="text-xl font-bold dark:text-white text-center mt-8 mb-4">
              Select Delivery Method
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliveryOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleDeliverySelect(option)}
                  className={`p-4 rounded-xl cursor-pointer transition ${
                    selectedDelivery?.id === option.id
                      ? "border-2 border-blue-500 bg-blue-50 dark:bg-blue-800"
                      : "bg-gray-100 dark:bg-gray-950 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{option.icon}</span>
                    <div>
                      <h3 className="font-semibold dark:text-indigo-500">{option.name}</h3>
                      <p className="text-gray-500 dark:text-gray-300 text-sm">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="mt-6 text-blue-500 hover:underline"
              onClick={() => setStep(2)}
            >
              ← Back to Shops
            </button>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
              Step 4: Payment
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handlePaymentSelect(option)}
                  className={`p-5 rounded-xl cursor-pointer transition ${
                    selectedPayment?.id === option.id
                      ? "border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-800"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <h3 className="font-bold">{option.name}</h3>
                      <p className="text-gray-500 dark:text-gray-300 text-sm">
                        {option.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={createRepairRequest}
              disabled={isLoading}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
            >
              {isLoading ? "Submitting..." : "Create Repair Request"}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-8xl mt-20 w-full dark:bg-gray-900">
    
      <div className="flex justify-between items-center mb-10">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 text-center">
            <div
              className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold transition ${
                step === i + 1
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              }`}
            >
              {i + 1}
            </div>
            <p
              className={`text-sm mt-2 ${
                step === i + 1 ? "font-semibold text-indigo-600 dark:text-indigo-400" : "text-gray-500"
              }`}
            >
              {s}
            </p>
          </div>
        ))}
      </div>

      {renderStep()}
    </div>

  );
};

export default RepairRequest;