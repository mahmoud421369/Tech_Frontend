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
  FaStar,
  FaSearch,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import { FaSpinner } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight, FiTool } from "react-icons/fi";

const RepairRequest = ({ onApproved, onRejected }) => {
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
  const [requestStatus, setRequestStatus] = useState("priced");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [repairRequestId, setRepairRequestId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [price, setPrice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const shopsPerPage = 6;

  const token = localStorage.getItem("authToken");

  const staticCategories = [
    { id: 1, name: "Laptop", icon: <FaLaptop size={28} />, color: "text-indigo-600" },
    { id: 2, name: "Phone", icon: <FaMobileAlt size={28} />, color: "text-indigo-600" },
    { id: 3, name: "Tablet", icon: <FaTabletAlt size={28} />, color: "text-indigo-600" },
    { id: 4, name: "Monitor", icon: <FaDesktop size={28} />, color: "text-indigo-600" },
    { id: 5, name: "PC", icon: <FaDesktop size={28} />, color: "text-indigo-600" },
    { id: 6, name: "Gaming Console", icon: <FaGamepad size={28} />, color: "text-indigo-600" },
    { id: 7, name: "TV", icon: <FaTv size={28} />, color: "text-indigo-600" },
    { id: 8, name: "Others", icon: <FaArrowAltCircleRight size={28} />, color: "text-indigo-600" },
  ];

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
    { id: 5, name: "Mobile Wallet", desc: "Pay with mobile wallet", apiValue: "MOBILE_WALLET", icon: "💳" },
  ];

  
  useEffect(() => {
    setSelectedDelivery(deliveryOptions[2]); 
    setSelectedPayment(paymentOptions[0]);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (!token) throw new Error("Login required");
        const res = await fetch("http://localhost:8080/api/categories", {
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
                color: "text-indigo-600",
              }))
        );
      } catch {
        setCategories(staticCategories);
      }
    };
    fetchCategories();
  }, [token]);

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

  const createRepairRequest = async (shop) => {
    if (!shop || !selectedCategory) {
      Swal.fire("Missing Info", "Please select a device category and shop.", "warning");
      return false;
    }

    if (!token) {
      Swal.fire("Login Required", "Please login first", "error");
      navigate("/login");
      return false;
    }

    if (!selectedAddress) {
      Swal.fire("Missing Address", "Please select a delivery address.", "warning");
      setStep(3);
      return false;
    }

    if (!description.trim()) {
      Swal.fire("Missing Description", "Please provide a description of the issue.", "warning");
      setStep(3);
      return false;
    }

    const requestData = {
      shopId: shop.id.toString(),
      deviceCategory: selectedCategory.id.toString(),
      description: description.trim(),
      deliveryAddress: selectedAddress.id.toString(),
      deliveryMethod: selectedDelivery.apiValue,
      paymentMethod: selectedPayment.apiValue,
    };

    try {
      setIsLoading(true);
      const res = await fetch(
        `http://localhost:8080/api/users/repair-request/${shop.id}`,
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
        return false;
      }

      setRepairRequestId(data.id);
      setProgressPercentage(0);
      setEstimatedTime(30);
      setStep(0); 
      return true;
    } catch (err) {
      console.error("Error creating repair request:", err);
      Swal.fire("Error", "Something went wrong. Please try again later.", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleShopSelect = async (shop) => {
    setSelectedShop(shop);
    setRequestStatus(null);
    setPrice(null);
    const success = await createRepairRequest(shop);
    if (!success) {
      setSelectedShop(null); 
    }
  };

  const handlePriceApproval = async () => {
    if (!repairRequestId) {
      Swal.fire("Error", "No repair request ID found. Please try again.", "error");
      setStep(2);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8080/api/users/repair-request/repairs/${repairRequestId}/confirm`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        Swal.fire("Error", data.message || "Failed to approve price.", "error");
        return;
      }

      Swal.fire("Success", "Shop offer approved successfully!", "success").then(() => {
        onApproved?.();
        setStep(3); 
      });
    } catch (err) {
      console.error("Error approving price:", err);
      Swal.fire("Error", "Something went wrong. Please try again later.", "error");
    }
  };

  const handlePriceRejection = async () => {
    if (!repairRequestId) {
      Swal.fire("Error", "No repair request ID found. Please try again.", "error");
      setStep(2);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8080/api/users/repair-request/${repairRequestId}/reject`,
        {
          method: "POST",
          headers: {
            "Authorization":`Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        Swal.fire("Error", data.message || "Failed to reject price.", "error");
        return;
      }

      Swal.fire("Rejected", "Price rejected. Please select another shop.", "info").then(() => {
        onRejected?.();
        setPrice(null);
        setRequestStatus(null);
        setRepairRequestId(null);
        setSelectedShop(null);
        setStep(2); 
      });
    } catch (err) {
      console.error("Error rejecting price:", err);
      Swal.fire("Error", "Something went wrong. Please try again later.", "error");
    }
  };

  const handleDeliverySelect = (option) => {
    setSelectedDelivery(option);
    setStep(4);
  };

  const handlePaymentSelect = (option) => {
    setSelectedPayment(option);
    setStep(4);
  };

  
  const indexOfLastShop = currentPage * shopsPerPage;
  const indexOfFirstShop = indexOfLastShop - shopsPerPage;
  const currentShops = shops.slice(indexOfFirstShop, indexOfLastShop);
  const totalPages = Math.ceil(shops.length / shopsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleBackStep = () => {
    if (step === 0 && requestStatus === "priced") {
      setStep(2); 
    } else if (step === 0 && requestStatus === "rejected") {
      setStep(2);
    } else if (step === 2) {
      setStep(1); 
    } else if (step === 3) {
      setStep(2); 
    } else if (step === 4) {
      setStep(3);
    }
  };

  const steps = [
    "Device Type",
    "Select Shop",
    "Delivery & Address",
    "Payment Method",
  ];

  useEffect(() => {
    if (!repairRequestId) return;

    let interval = setInterval(() => {
      setProgressPercentage((prev) => {
        if (prev >= 100) return 100;
        return prev + 5;
      });
      setEstimatedTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const responseTimeout = setTimeout(() => {
      const approved = Math.random() > 0.3;
      if (approved) {
        setPrice(Math.floor(Math.random() * 500) + 200);
        setRequestStatus("priced");
      } else {
        setRequestStatus("rejected");
      }
    }, 5000000);

    return () => {
      clearInterval(interval);
      clearTimeout(responseTimeout);
    };
  }, [repairRequestId]);

  const renderStep = () => {
    return (
      <div className="mb-8">
        {step !== 1 && (
          <button
            onClick={handleBackStep}
            className="mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <FaArrowLeft /> Back
          </button>
        )}
        {(() => {
          switch (step) {
            case 0:
              if (!requestStatus) {
                return (
                  <div className="flex flex-col items-center py-12">
                    <FaClock className="text-indigo-600 dark:text-indigo-400 text-4xl mb-4 animate-pulse" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      Waiting for Shop to Set Price...
                    </h2>
                    <div className="w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
                      <div
                        className="bg-indigo-600 dark:bg-indigo-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%`}}
                      ></div>
                    </div>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">
                      {estimatedTime}s remaining
                    </p>
                  </div>
                );
              }

              if (requestStatus === "priced" && price) {
                return (
                  <div className="flex flex-col items-center py-12">
                    <h2 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4">
                      Shop Has Set the Repair Price
                    </h2>
                    <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Repair Request Details
                      </h3>
                      <div className="space-y-3 text-gray-700 dark:text-gray-300">
                        <p>
                          <span className="font-semibold">Shop:</span> {selectedShop?.name || "N/A"}
                          {selectedShop?.shopAddress && (
                            <span>
                              {" "}
                              ({selectedShop.shopAddress.street}, {selectedShop.shopAddress.city}, {selectedShop.shopAddress.state})
                            </span>
                          )}
                        </p>
                        <p>
                          <span className="font-semibold">Device:</span> {selectedCategory?.name || "N/A"}
                        </p>
                        <p>
                          <span className="font-semibold">Issue Description:</span> {description || "No description provided"}
                        </p>
                        <p>
                          <span className="font-semibold">Delivery Method:</span> {selectedDelivery?.name || "N/A"}
                        </p>
                        <p>
                          <span className="font-semibold">Payment Method:</span> {selectedPayment?.name || "N/A"}
                        </p>
                        <p>
                          <span className="font-semibold">Delivery Address:</span>{" "}
                          {selectedAddress ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}` : "N/A"}
                        </p>
                        <p>
                          <span className="font-semibold">Estimated Price:</span>{" "}
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">${price}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={handlePriceApproval}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
                      >
                        Approve Shop Offer
                      </button>
                      <button
                        onClick={handlePriceRejection}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              }

              if (requestStatus === "rejected") {
                return (
                  <div className="flex flex-col items-center py-12">
                    <FaTimesCircle className="text-red-500 dark:text-red-400 text-4xl mb-4" />
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                      Shop Rejected the Repair Request
                    </p>
                    <button
                      onClick={() => {
                        setRequestStatus(null);
                        setRepairRequestId(null);
                        setSelectedShop(null);
                        setPrice(null);
                        setStep(2);
                      }}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                    >
                      Try Another Shop
                    </button>
                  </div>
                );
              }
              return null;

            case 1:
              return (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
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
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                      >
                        <div className={`text-3xl mb-4 flex justify-center items-center ${c.color} dark:text-indigo-400`}>
                          {c.icon}
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{c.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );

            case 2:
              if (isLoading) {
                return (
                  <div className="flex flex-col items-center py-16">
                    <FaSpinner className="animate-spin text-indigo-600 dark:text-indigo-400 text-4xl mb-4" />
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Loading Shops...
                    </p>
                  </div>
                );
              }

              return (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
                    Step 2: Select Shop
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentShops.map((shop) => (
                      <div
                        key={shop.id}
                        onClick={() => handleShopSelect(shop)}
                        className={`p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
                          selectedShop?.id === shop.id
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900"
                            : "bg-white dark:bg-gray-800"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                            {shop.name}
                          </h3>
                          <span className="flex items-center text-yellow-500 dark:text-yellow-400 font-semibold">
                            <FaStar className="mr-1" /> {shop.rating || "N/A"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <FaPhone className="text-green-500 dark:text-green-400" /> 0{shop.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <FaInfoCircle className="text-indigo-500 dark:text-indigo-400" /> {shop.shopType}
                          </div>
                          <div className="flex items-center gap-2">
                            {shop.verified ? (
                              <FaCheckCircle className="text-green-600 dark:text-green-400" />
                            ) : (
                              <FaTimesCircle className="text-red-500 dark:text-red-400" />
                            )}
                            {shop.verified ? "Verified" : "Unverified"}
                          </div>
                          <div className="flex items-center gap-2">
                            <FaClock className="text-purple-500 dark:text-purple-400" />
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
                            <FaMapMarkedAlt className="text-red-500 dark:text-red-400" />
                            {shop.shopAddress.street}, {shop.shopAddress.city}, {shop.shopAddress.state}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center mt-6 gap-4 items-center">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
                        currentPage === 1
                          ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      <FiChevronLeft /> 
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-xl ${
                            currentPage === page
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-indigo-100 dark:hover:bg-indigo-800"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-xl flex items-center gap-2 ${
                        currentPage === totalPages
                          ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                       <FiChevronRight />
                    </button>
                  </div>
                </div>
              );

            case 3:
              return (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
                    Step 3: Delivery & Address
                  </h2>
                  <label className="block text-indigo-600 dark:text-indigo-400 font-semibold mb-2">
                    Choose Delivery Address
                  </label>
                  <div className="relative mb-4">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                    <input
                      type="text"
                      placeholder="Search address..."
                      value={addressSearch}
                      onChange={(e) => setAddressSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    />
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm max-h-48 overflow-y-auto mb-6">
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
                          className={`px-4 py-3 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900 transition ${
                            selectedAddress?.id === addr.id ? "bg-indigo-50 dark:bg-indigo-900" : ""
                          }`}
                        >
                          {addr.street}, {addr.city}, {addr.state}
                        </div>
                      ))}
                  </div>
                  <label className="block text-indigo-600 dark:text-indigo-400 font-semibold mb-2">
                    Problem Description
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    rows="4"
                    placeholder="Describe your issue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                  <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-8 mb-4">
                    Select Delivery Method
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deliveryOptions.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => handleDeliverySelect(option)}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedDelivery?.id === option.id
                            ? "border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{option.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{option.name}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{option.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );

            case 4:
              return (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
                    Step 4: Payment
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentOptions.map((option) => (
                      <div
                        key={option.id}
                        onClick={() => handlePaymentSelect(option)}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedPayment?.id === option.id
                            ? "border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{option.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{option.name}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{option.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => Swal.fire("Success", "Repair request finalized!", "success").then(() => navigate("/"))}
                    disabled={isLoading}
                    className={`w-full mt-6 py-3 rounded-xl text-white font-semibold transition ${
                      isLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin" /> Submitting...
                      </span>
                    ) : (
                      "Finalize Repair Request"
                    )}
                  </button>
                </div>
              );

            default:
              return null;
          }
        })()}
      </div>
    );
  };

  return (
    <div className="min-h-screen mt-7 dark:bg-gray-900  w-full transition-all duration-300 ">
     




      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-900 dark:to-gray-800 text-white max-w-8xl py-12 px-6 mt-16 w-full shadow-xl">
        <div className="max-w-8xl mx-auto w-full text-center">
        <h1 className="text-3xl flex justify-center items-center gap-2 md:text-4xl font-extrabold tracking-tight mb-2 animate-fade-in">
       <FiTool/>   Create a Repair Request
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
          Easily schedule a repair for your device by selecting a shop, describing the issue, and choosing your preferred delivery and payment options.
        </p>
      </div>
</div><br /><br />
    
      <div className="flex justify-between items-center mb-12 relative">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 text-center relative">
            <div
              className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 z-10 relative ${
                step >= i + 1
                  ? "bg-indigo-600 dark:bg-indigo-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              {i + 1}
            </div>
            <p
              className={`text-sm mt-2 font-semibold ${
                step >= i + 1
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {s}
            </p>
            {i < steps.length - 1 && (
              <div
                className="absolute top-6 left-1/2 w-full h-1 bg-gray-300 dark:bg-gray-600 z-0"
                style={{ transform: "translateX(50%)" }}
              ></div>
            )}
          </div>
        ))}
      </div>

      {renderStep()}
    </div>
  );
};

export default RepairRequest;