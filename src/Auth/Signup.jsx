import React, { useState } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import {
  RiUserLine,
  RiLockPasswordLine,
  RiMailLine,
  RiPhoneLine,
  RiHome4Line,
  RiMapPinLine,
  RiBuilding4Line,
  RiStore2Line,
  RiFileListLine,
  RiGoogleFill,
  RiComputerLine,
  RiSmartphoneLine,
  RiToolsLine,
  RiTextBlock,
  RiMap2Line,
} from "react-icons/ri";

const Signup = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("user");

  
  const [userData, setUserData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });

  
  const [shopData, setShopData] = useState({
    name: "",
    email: "",
    password: "",
    description: "",
    phone: "",
    shopAddress: {
      state: "",
      city: "",
      street: "",
      building: "",
      isDefault: true,
    },
    shopType: "",
  });

  const [deliveryData, setDeliveryData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
  });

    const handleDeliveryChange = (e) =>
     setDeliveryData({ ...deliveryData, [e.target.name]: e.target.value });

     const handleDeliverySignup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/api/auth/register/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           name:deliveryData.name,
        address:deliveryData.address,
        email:deliveryData.email,
        phone:deliveryData.phone,
        password:deliveryData.password,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      Swal.fire("Success", "Delivery registered successfully!", "success");
      navigate("/login");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };


   const [assignerData, setAssignerData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    department: "",
  });

    const handleAssignerChange = (e) =>
     setAssignerData({ ...assignerData, [e.target.name]: e.target.value });

     const handleAssignerSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/api/auth/register/assigner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           name:assignerData.name,
        department:assignerData.department,
        email:assignerData.email,
        phone:assignerData.phone,
        password:assignerData.password,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      Swal.fire("Success", "Assigner registered successfully!", "success");
      navigate("/login");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };



  const handleUserChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleShopChange = (e) => {
    const { name, value } = e.target;
    if (["state", "city", "street", "building"].includes(name)) {
      setShopData({
        ...shopData,
        shopAddress: { ...shopData.shopAddress, [name]: value },
      });
    } else {
      setShopData({ ...shopData, [name]: value });
    }
  };

const verifyEmail = async (email) => {
  const { value: otp } = await Swal.fire({
    title: "Verify Email",
    html: `
      <div id="otp-container" style="display:flex;justify-content:center;gap:8px;">
        ${Array(6)
          .fill(0)
          .map(
            (_, i) =>
              <input id="otp-${i}" maxlength="1" class="swal2-input" style="width:40px;text-align:center;font-size:20px;" />
          )
          .join("")}
      </div>
      <button id="resend-otp-btn" type="button" class="swal2-confirm swal2-styled mt-3">Resend OTP</button>
    `,
    didOpen: () => {
      const inputs = Array.from(document.querySelectorAll("#otp-container input"));

      // Auto focus and move between fields
      inputs.forEach((input, idx) => {
        input.addEventListener("input", () => {
          if (input.value && idx < inputs.length - 1) {
            inputs[idx + 1].focus();
          }
        });
        input.addEventListener("keydown", (e) => {
          if (e.key === "Backspace" && !input.value && idx > 0) {
            inputs[idx - 1].focus();
          }
        });
      });

      // Resend OTP
      document.getElementById("resend-otp-btn").addEventListener("click", async () => {
        try {
          const res = await fetch("http://localhost:8080/api/auth/resend-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          if (!res.ok) throw new Error("Failed to resend OTP");
          Swal.fire("Success", "OTP resent successfully!", "success");
        } catch (err) {
          Swal.fire("Error", err.message, "error");
        }
      });
    },
    focusConfirm: false,
    preConfirm: () => {
      const otp = Array.from(document.querySelectorAll("#otp-container input"))
        .map((el) => el.value)
        .join("");
      if (otp.length !== 6) {
        Swal.showValidationMessage("Enter all 6 digits!");
        return false;
      }
      return otp;
    },
    confirmButtonText: "Verify",
    showCancelButton: true,
  });

  if (!otp) return;

 try {
  const res = await fetch("http://localhost:8080/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otpCode: otp }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || JSON.stringify(errorData));
  }

  Swal.fire("Verified", "Your email has been verified!", "success");
} catch (err) {
  Swal.fire("Error", err.message, "error");
}
};
const handleUserSignup = async (e) => {
  e.preventDefault();
  try {
    const res = await fetch("http://localhost:8080/api/auth/register/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name:userData.first_name,
        last_name:userData.last_name,
        email:userData.email,
        phone:userData.phone,
        password:userData.password,


      }),
    });
    console.log(userData);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Registration failed");
    }

    Swal.fire("Success", "User registered successfully, verify your email", "success");
    verifyEmail(userData.email)
    navigate("/login");
  } catch (err) {
    Swal.fire("Error", err.message, "error");
  }
};


  const handleShopSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8080/api/auth/register/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopData),
      });
       console.log(shopData);

      if (!res.ok) throw new Error(await res.text());
      Swal.fire("Success", "Shop registered successfully!", "success");
      navigate("/login");
    } catch (err) {
      Swal.fire(" Error", err.message, "error");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-400 p-4 overflow-hidden">
   
      <RiComputerLine className="absolute top-10 left-10 text-white opacity-20 text-6xl animate-bounce" />
      <RiSmartphoneLine className="absolute bottom-16 right-12 text-white opacity-20 text-5xl animate-pulse" />
      <RiToolsLine className="absolute top-1/2 left-1/4 text-white opacity-20 text-7xl animate-spin-slow" />

      <div className="w-full max-w-3xl mt-6 relative z-10">
        <div className="bg-gradient-to-br from-blue-100/50 to-blue-300/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Create an account
          </h1>
          <p className="text-white text-center mb-6">
            Register as a User or Shop Owner
          </p>

          
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setActiveTab("user")}
              className={`px-4 py-2 rounded-3xl m-3 font-bold ${
                activeTab === "user"
                  ? "bg-white text-blue-500"
                  : "bg-white/20 text-white"
              }`}
            >
              User
            </button>
            <button
              onClick={() => setActiveTab("shop")}
              className={`px-4 py-2 rounded-3xl m-3 font-bold ${
                activeTab === "shop"
                  ? "bg-white text-blue-500"
                  : "bg-white/20 text-white"
              }`}
            >
              Shop Owner
            </button>
            <button
              onClick={() => setActiveTab("delivery")}
              className={`px-4 py-2 rounded-3xl m-3 font-bold ${
                activeTab === "delivery"
                  ? "bg-white text-blue-500"
                  : "bg-white/20 text-white"
              }`}
            >
              Delivery
            </button>
           
            <button
              onClick={() => setActiveTab("assigner")}
              className={`px-4 py-2 rounded-3xl m-3 font-bold ${
                activeTab === "assigner"
                  ? "bg-white text-blue-500"
                  : "bg-white/20 text-white"
              }`}
            >
              Assigner
            </button>
           
          </div>

      
          {activeTab === "user" && (
            <form onSubmit={handleUserSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiUserLine className="mr-2 text-2xl text-white" />
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    value={userData.first_name}
                    onChange={handleUserChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiUserLine className="mr-2 text-2xl text-white" />
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    value={userData.last_name}
                    onChange={handleUserChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiMailLine className="mr-2 text-2xl text-white" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={userData.email}
                    onChange={handleUserChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiPhoneLine className="mr-2 text-2xl text-white" />
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone"
                    value={userData.phone}
                    onChange={handleUserChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2 flex items-center  p-2 rounded-xl">
                  <RiLockPasswordLine className="mr-2 text-2xl text-white" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={userData.password}
                    onChange={handleUserChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition">
                Sign up as User
              </button>
            </form>
          )}

        
          {activeTab === "shop" && (
            <form onSubmit={handleShopSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiStore2Line className="mr-2 text-2xl text-white" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Shop Name"
                    value={shopData.name}
                    onChange={handleShopChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiMailLine className="mr-2 text-white text-2xl" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={shopData.email}
                    onChange={handleShopChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiLockPasswordLine className="mr-2 text-white text-2xl" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={shopData.password}
                    onChange={handleShopChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiFileListLine className="mr-2 text-white text-2xl" />
                  <input
                    type="text"
                    name="description"
                    placeholder="Description"
                    value={shopData.description}
                    onChange={handleShopChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl">
                  <RiPhoneLine className="mr-2 text-white text-2xl" />
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone"
                    value={shopData.phone}
                    onChange={handleShopChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiStore2Line className="mr-2 text-white text-2xl" />
                  <select
                    name="shopType"
                    value={shopData.shopType}
                    onChange={handleShopChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white text-blue-500 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
                  >
                    <option value="">Select Shop Type</option>
                    <option value="REPAIRER">REPAIRER</option>
                    <option value="SELLER">SELLER</option>
                    <option value="BOTH">BOTH</option>
                  </select>
                </div>
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiHome4Line className="mr-2 text-white text-2xl" />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={shopData.shopAddress.state}
                    onChange={handleShopChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl">
                  <RiMapPinLine className="mr-2 text-white text-2xl" />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={shopData.shopAddress.city}
                    onChange={handleShopChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl">
                  <RiMapPinLine className="mr-2 text-white text-2xl" />
                  <input
                    type="text"
                    name="street"
                    placeholder="Street"
                    value={shopData.shopAddress.street}
                    onChange={handleShopChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl">
                  <RiBuilding4Line className="mr-2 text-white text-2xl" />
                  <input
                    type="text"
                    name="building"
                    placeholder="Building"
                    value={shopData.shopAddress.building}
                    onChange={handleShopChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition">
                Sign up as Shop
              </button>
            </form>
          )}



  {activeTab === "delivery" && (
            <form onSubmit={handleDeliverySignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiUserLine className="mr-2 text-2xl text-white" />
                  <input
                    type="text"
                    name="name"
                    placeholder=" Name"
                    value={deliveryData.name}
                    onChange={handleDeliveryChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
               <div className="flex items-center  p-2 rounded-xl ">
                  <RiMap2Line className="mr-2 text-2xl text-white" />
                  <input
                    type="text"
                    name="address"
                    placeholder="address"
                    value={deliveryData.address}
                    onChange={handleDeliveryChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiMailLine className="mr-2 text-2xl text-white" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={deliveryData.email}
                    onChange={handleDeliveryChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiPhoneLine className="mr-2 text-2xl text-white" />
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone"
                    value={deliveryData.phone}
                    onChange={handleDeliveryChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2 flex items-center  p-2 rounded-xl">
                  <RiLockPasswordLine className="mr-2 text-2xl text-white" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={deliveryData.password}
                    onChange={handleDeliveryChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition">
                Sign up as Delivery
              </button>
            </form>
          )}


{activeTab === "assigner" && (
            <form onSubmit={handleAssignerSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiUserLine className="mr-2 text-2xl text-white" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={assignerData.name}
                    onChange={handleAssignerChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
               <div className="flex items-center  p-2 rounded-xl ">
                  <RiStore2Line className="mr-2 text-2xl text-white" />
                  <input
                    type="text"
                    name="department"
                    placeholder="department"
                    value={assignerData.department}
                    onChange={handleAssignerChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiMailLine className="mr-2 text-2xl text-white" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={assignerData.email}
                    onChange={handleAssignerChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center  p-2 rounded-xl ">
                  <RiPhoneLine className="mr-2 text-2xl text-white" />
                  <input
                    type="text"
                    name="phone"
                    placeholder="Phone"
                    value={assignerData.phone}
                    onChange={handleAssignerChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="col-span-2 flex items-center  p-2 rounded-xl">
                  <RiLockPasswordLine className="mr-2 text-2xl text-white" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={assignerData.password}
                    onChange={handleAssignerChange}
                    className="block w-full pl-3 pr-10 py-3 rounded-xl bg-white backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition">
                Sign up as Assigner
              </button>
            </form>
          )}



          

          <div className="mt-6 text-center text-sm text-white">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-gray-200 underline">
              Log in
            </Link>
          </div>

      
        </div>
      </div>
    </div>
  );
};

export default Signup;