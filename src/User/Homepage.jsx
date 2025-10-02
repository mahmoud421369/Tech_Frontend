
import { useState,useRef,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FiStar, FiTool, FiShoppingBag,FiChevronLeft,FiChevronRight,FiShoppingCart,FiSmartphone,FiMapPin, FiMonitor, FiPhone, FiTag, FiDollarSign, FiShield, FiClock } from 'react-icons/fi';
import {motion} from 'framer-motion'
import Service from './Service';
import  "../styles/style.css";
import Swal from 'sweetalert2';
const Homepage = ({darkMode }) => {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);


  const navigate = useNavigate();
  const [showPurchaseOptions, setShowPurchaseOptions] = useState(false);
 const [imageLoadStatus, setImageLoadStatus] = useState({});
  const handleRepairClick = () => {

    navigate('/repair');
  };



  const handlePurchaseUsed = () => {
    
    navigate('/purchase/used');
  };
    const handleImageLoad = (id) => {
    setImageLoadStatus(prev => ({ ...prev, [id]: true }));
  };


    const [activeTab, setActiveTab] = useState('all');


  

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= Math.floor(rating) 
          ? <FiStar key={i} className="text-yellow-500" /> 
          : <FiStar key={i} className="text-yellow-500" />
      );
    }
    return stars;
  };


useEffect(() => {

  const token = localStorage.getItem("authToken");

  const fetchShops = async () => {
    try {
        const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:8080/api/users/shops/all", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
           Authorization: `Bearer ${token} `,
        },
      
      });

      // if (!res.ok) {
      //   if (res.status === 401) {
       
      //     Swal.fire("Session Expired", "Please log in again", "warning");
      //     localStorage.removeItem("authToken");
      //     localStorage.removeItem("refreshToken");
      //     navigate("/login");
      //     return;
      //   }
      //   throw new Error(`Failed to fetch shops: ${res.status}`);
      // }

      const data = await res.json();

      const shopsWithDevices = (data.content || []).map((shop) => ({
        ...shop,
        devices: [],
        services: shop.services || [],
      }));
      setShops(shopsWithDevices);

      shopsWithDevices.forEach((shop) => {
        fetchShopProducts(shop.id, token);
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching shops:", err);
        Swal.fire("Error", "Could not load shops", "error");
      }
    }
  };

  fetchShops();


}, [navigate]);

 
  const fetchShopProducts = async (shopId) => {
    try {
        const token = localStorage.getItem("authToken");
      const res = await fetch(
        `http://localhost:8080/api/products/shop/${shopId}`,
      {
        headers:{"Content-Type" : "application/json",Authorization:`Bearer ${token}`}
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const products = await res.json();
  const content = products.content;
     setProducts(content);
      setShops((prev) =>
        prev.map((s) =>
          s.id === shopId ? { ...s, devices: content } : s
        )
      );
    } catch (err) {
      console.error(`Error fetching products for shop ${shopId}:`, err);
    }
  };

  const addToCart = (device) => {
    Swal.fire("Added!", `${device.name} added to cart.`, "success");
  };





      const [searchQuery, setSearchQuery] = useState('');
      const [expandedShop, setExpandedShop] = useState(null);
      const shopScrollRef = useRef(null);

   const scrollShops = (direction) => {
    if (shopScrollRef.current) {
      const { scrollLeft, clientWidth } = shopScrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      shopScrollRef.current.scrollTo({
        left: scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const filteredShops = shops.filter(shop => {
    if (!searchQuery){
       return true
      }
    
    const query = searchQuery.toLowerCase();
    return (
      shop.name.toLowerCase().includes(query) ||
      shop.services.some(service => service.toLowerCase().includes(query)) ||
      shop.devices.some(device => device.name.toLowerCase().includes(query))
    );
  });



   const [heroSearchQuery, heroSetSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const sampleData = [
    { id: 1, name: 'iPhone 13 Pro', type: 'device', category: 'Phones' },
    { id: 2, name: 'MacBook Pro 14"', type: 'device', category: 'Laptops' },
    { id: 3, name: 'TechFix Pro', type: 'shop', category: 'Repair Services' },
    { id: 4, name: 'Screen Replacement', type: 'service', category: 'Repair Services' },
    { id: 5, name: 'iPad Air', type: 'device', category: 'Tablets' },
  ];



useEffect(() => {
  if (heroSearchQuery.trim() === "") {
    setSearchResults([]);
    return;
  }

  const timer = setTimeout(() => {
    setIsLoading(true);

    setTimeout(() => {
      
      const devices = shops.flatMap(shop =>
        (shop.devices || []).map(device => ({
          ...device,
          shopName: shop.name,
        }))
      );

  
      const results = [
      
        ...shops.filter(shop =>
          shop.name.toLowerCase().includes(heroSearchQuery.toLowerCase()) ||
          (shop.location || "").toLowerCase().includes(heroSearchQuery.toLowerCase())
        ),
        
        ...devices.filter(device =>
          device.name.toLowerCase().includes(heroSearchQuery.toLowerCase()) ||
          (device.category || "").toLowerCase().includes(heroSearchQuery.toLowerCase())
        ),
      ];

      setSearchResults(results);
      setIsLoading(false);
    }, 300);
  }, 500);

  return () => clearTimeout(timer);
}, [heroSearchQuery, shops]);

const heroHandleSearch = (e) => {
  e.preventDefault();
  console.log("Final search:", heroSearchQuery, searchResults);
};
        const token = localStorage.getItem("authToken");


    const handleAddToCart = async (product) => {
      try {
        const response = await fetch("http://localhost:8080/api/cart/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
  
          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
            price: product.price,
            name: product.name,
            imageUrl: product.imageUrl,
          }),
        });
  
        if (!response.ok) {
          throw new Error("Failed to add item to cart");
        }
  
        if (addToCart) {
          addToCart(product);
        }
  
        Swal.fire("Success!", `${product.name} added to cart!`, "success");
      } catch (error) {
        console.error("Error adding to cart:", error);
        alert("Failed to add item to cart. Please try again.");
      }
    };
  
  




  return (



  <><section
  className={`relative mt-10 min-h-80 overflow-hidden ${
    darkMode
      ? "bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 border-gray-800 text-white"
      : "bg-white text-gray-900"
  }`}
>
  {/* Floating Icons Layer */}
  <div className="absolute inset-0 opacity-5 pointer-events-none">
    <FiTool className="absolute w-20 h-20 bottom-1/3 right-1/5 animate-float-medium dark:text-blue-500" />
    <FiShoppingBag className="absolute w-24 h-24 top-1/3 right-1/4 animate-float-slow dark:text-blue-500" />
    <FiShoppingBag className="absolute w-16 h-16 bottom-1/4 left-1/3 animate-float-fast dark:text-blue-500" />
    <FiSmartphone className="absolute w-20 h-20 top-10 left-10 animate-float-medium dark:text-blue-500" />
    <FiSmartphone className="absolute w-28 h-28 bottom-20 right-20 animate-float-slow dark:text-blue-500" />
    <FiMonitor className="absolute w-18 h-18 top-1/2 left-1/4 animate-float-fast dark:text-blue-500" />
  </div>

  {/* Hero Content */}
  <div className="container mx-auto px-4 py-16 md:py-32 min-h-screen relative z-10">
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-bold mb-6">
        Repair & Buy Devices with Confidence
      </h1>
      <p className="text-xl mb-8 text-blue-700 dark:text-blue-100">
        Find trusted repair shops and purchase refurbished devices at great prices
      </p>

      {/* Search Bar */}
      <div className="relative">
        <form
          onSubmit={heroHandleSearch}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex flex-wrap justify-center items-center mb-10"
        >
          <input
            type="text"
            placeholder="Search for devices, shops, or services..."
            className="flex-grow px-4 py-3 text-gray-800 dark:text-white cursor-pointer dark:bg-gray-800 focus:outline-none focus:border-blue-800"
            value={heroSearchQuery}
            onChange={(e) => heroSetSearchQuery(e.target.value)}
          />
        </form>

        {/* Search Results */}
        {heroSearchQuery && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {searchResults.map((item) => (
                  <li
                    key={item.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <a
                      href={`#${item.id}`}
                      className="p-4 flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.category}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {item.type}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No results found for "{heroSearchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-white/10 bg-opacity-10 p-4 rounded-lg flex items-center backdrop-blur-sm">
          <FiTool className="text-3xl mr-3 text-blue-600 dark:text-white" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Expert Repairs</h3>
            <p className="text-blue-700 dark:text-blue-100">Certified technicians</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/10 bg-opacity-10 p-4 rounded-lg flex items-center backdrop-blur-sm">
          <FiShoppingBag className="text-3xl mr-3 text-blue-600 dark:text-white" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Quality Devices</h3>
            <p className="text-blue-700 dark:text-blue-100">Tested and guaranteed</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/10 bg-opacity-10 p-4 rounded-lg flex items-center backdrop-blur-sm">
          <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
            6
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Months Warranty</h3>
            <p className="text-blue-700 dark:text-blue-100">On all repairs</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Floating Animations */}
  <style jsx global>{`
    @keyframes float {
      0%,
      100% {
        transform: translateY(0) rotate(0deg);
      }
      50% {
        transform: translateY(-20px) rotate(5deg);
      }
    }
    .animate-float-slow {
      animation: float 8s ease-in-out infinite;
    }
    .animate-float-medium {
      animation: float 6s ease-in-out infinite;
      animation-delay: 1s;
    }
    .animate-float-fast {
      animation: float 4s ease-in-out infinite;
      animation-delay: 0.5s;
    }
  `}</style>
</section>

    <div className="p-6 bg-gray-50 dark:bg-gray-900">
      {/* Section Title */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <h1 className="text-4xl font-bold text-center text-blue-500 dark:text-white mb-8">
          What would you like to repair today?
        </h1>
      </motion.div>

 
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
     
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            className="relative group rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
          >
            <Link
              to="/repair"
              className="p-6 h-auto bg-white dark:bg-gray-950 dark:border-none rounded-2xl border shadow-lg flex flex-col justify-between"
            >
             
              <div className="flex items-center justify-center mb-5">
                <div className="bg-blue-500 dark:bg-blue-600 text-white p-5 rounded-full shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-14 w-14 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
              </div>

             
              <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 text-center mb-3">
                Repair Device
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-300 text-center max-w-xs mx-auto leading-relaxed">
                Get your device fixed by our{" "}
                <span className="font-semibold text-indigo-500 dark:text-indigo-400">
                  expert technicians
                </span>{" "}
                quickly and reliably.
              </p>

            
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                {["Screen Replacement", "Battery Replacement", "Water Damage Fix", "Software Issues"].map(
                  (service, idx) => (
                    <div
                      key={idx}
                      className="flex items-center flex-wrap justify-center dark:text-white gap-2"
                    >
                      <span className="bg-green-100 text-green-600 dark:bg-blue-500 dark:text-white p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      {service}
                    </div>
                  )
                )}
              </div>

             
              <button className="mt-6 bg-blue-600 dark:bg-black/80 text-white font-bold py-3 px-5 rounded-lg hover:bg-blue-700 dark:hover:bg-black transition">
                Book a Repair
              </button>
            </Link>
          </motion.div>

        
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            className="relative group rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
          >
            <div className="p-6 h-auto bg-white dark:bg-gray-950 dark:border-none rounded-2xl shadow-lg flex flex-col justify-between">
         
              <div className="flex items-center justify-center gap-2 mb-5">
                <div className="bg-blue-500 dark:bg-blue-600 dark:text-white text-white p-5 rounded-full shadow-md">
                  <FiTag size={50} />
                </div>
              </div>

              
              <div className="text-center">
                <h2 className="text-2xl text-blue-500 dark:text-blue-400 font-bold">
                  Latest Offers
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-300 text-center max-w-xs mx-auto leading-relaxed">
                  Check out exclusive discounts on devices & services.
                </p>
              </div>

              
              <ul className="mt-4 space-y-2">
                <li className="bg-gray-100 dark:bg-black/40 dark:text-white text-gray-800 p-2 rounded">
                  📱 20% off iPhone screen repair
                </li>
                <li className="bg-gray-100 dark:bg-black/40 dark:text-white text-gray-800 p-2 rounded">
                  💻 Laptop battery replacement EGP 499
                </li>
              </ul>

              
              <Link
                to="/offers"
                className="mt-8 bg-transparent border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 text-center font-bold py-3 px-5 rounded-lg hover:bg-blue-700 hover:text-white transition"
              >
                View Deals
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>



        <Service darkMode={darkMode}/>

<section className="py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-black">
  <div className="max-w-6xl mx-auto text-center">
    <h2 className="text-3xl font-bold text-indigo-600 dark:text-white mb-12">
      Why Choose Us?
    </h2>

    <div className="grid md:grid-cols-3 gap-8">
     
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition">
        <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="mt-4 font-bold text-lg text-gray-800 dark:text-white">6-Month Warranty</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Every repair comes with a <span className="font-semibold">6-month guarantee</span> for peace of mind.
        </p>
      </div>

   
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition">
        <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3v1H7l5 5 5-5h-2v-1c0-1.657-1.343-3-3-3z" />
          </svg>
        </div>
        <h3 className="mt-4 font-bold text-lg text-gray-800 dark:text-white">Trusted Shops</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Only <span className="font-semibold">verified & reliable shops</span> are part of our platform.
        </p>
      </div>

    
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition">
        <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 14h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="mt-4 font-bold text-lg text-gray-800 dark:text-white">24/7 Support</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Get <span className="font-semibold">round-the-clock assistance</span> from our support team.
        </p>
      </div>
    </div>
  </div>
</section>


      







<section
  id="latest-devices"
  className="py-16 bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-950 dark:to-indigo-900"
>
  <div className="max-w-6xl mx-auto px-4">

    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
      className="text-center mb-12"
    >
      <h2 className="text-3xl font-bold text-indigo-600 dark:text-white">
        Latest Devices
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        Browse the newest arrivals in refurbished and pre-owned devices
      </p>
    </motion.div>


    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((device) => (
        <motion.div
          key={device.id}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          onClick={() => navigate(`/device/${device.id}`)}
          className="rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all"
        >
    
          <div className="bg-gradient-to-br from-white to-indigo-100 dark:from-gray-800 dark:to-indigo-900 p-6 h-full flex flex-col">
       
            <div className="h-52 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center relative">
              {!imageLoadStatus[device.id] && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="animate-spin h-10 w-10 text-indigo-600"
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
                src={device.image}
                alt={device.name}
                className={`max-h-full max-w-full object-contain ${
                  imageLoadStatus[device.id] ? "block" : "invisible"
                }`}
                onLoad={() => handleImageLoad(device.id)}
              />
            </div>

         
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-4 mb-2 flex items-center gap-2">
              <FiSmartphone className="text-indigo-600 dark:text-indigo-300" />{" "}
              {device.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 flex-grow">
              {device.description?.substring(0, 60)}...
            </p>


            <div className="mt-4 flex items-center flex-wrap justify-between">
              <span className="text-indigo-600 dark:text-indigo-300 font-bold text-lg">
                {device.price.toFixed(2)} EGP
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); 
                  handleAddToCart(device);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
</section>
{/* <section
      style={{ borderTopRightRadius: "50px", borderTopLeftRadius: "50px" }}
      id="shops"
      className="py-16 bg-gray-50 dark:bg-gray-900"
    >
      <div className="container-fluid mx-auto px-4">
       
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-indigo-600 mb-4 dark:text-white flex items-center justify-center gap-2">
            <FiSmartphone className="w-7 h-7 text-blue-500" /> Featured Shops & Devices
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Browse our trusted repair shops and high-quality refurbished devices
          </p>
        </motion.div>

        <div className="mb-8 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            className="relative"
          >
            <input
              type="text"
              placeholder="Search shops or devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white p-4 pl-12 cursor-pointer hover:shadow-md transition-shadow rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </motion.div>
        </div>

      
        <motion.div className="relative mb-12">
          <div
            ref={shopScrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory py-4 scrollbar-hide custom-scroll space-x-6"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {filteredShops.map((shop) => (
              <div
                key={shop.id}
                className="snap-start flex-shrink-0 w-full sm:w-4/5 md:w-2/3 lg:w-1/2 xl:w-2/5 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-indigo-100 dark:border-gray-700"
              >
                <div className="p-6 border-b dark:border-gray-700">
                  <div className="flex flex-col flex-wrap justify-between">
                    <div>
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{shop.name}</h3>
                        <span className="flex items-center gap-2 text-indigo-600 font-semibold">
                          <FiMapPin /> {shop.shop_address}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={i < Math.floor(shop.rating) ? "fill-current" : ""}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-gray-500">
                          {shop.rating} ({shop.reviews} reviews)
                        </span>
                      </div>
                    </div>
                    <br />
                    <div className=" flex flex-wrap items-center text-sm text-blue-500 gap-2">
                    <FiPhone/> {shop.phone}
                    </div>
                  </div>
                </div>

                
                <div className="p-6">
                  <h4 className="font-bold text-gray-700 mb-4 dark:text-white flex items-center gap-2">
                    <FiSmartphone className="text-indigo-600" /> Available Devices
                  </h4>
                  <div className="relative">
                    <div className="flex overflow-x-auto pb-4 space-x-4">
                      {shop.devices.map((device) => (
                        <div
                          key={device.id}
                          className="cursor-pointer min-w-[280px] bg-[#f1f5f9] dark:bg-gray-900 dark:border-gray-700  rounded-2xl p-4 flex flex-col"
                        >
                          <div className="h-52 bg-white rounded-xl dark:bg-gray-800 border-b p-0 flex items-center justify-center relative">
                            {!imageLoadStatus[device.id] && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg
                                  className="animate-spin h-10 w-10 text-indigo-600"
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
                              src={device.image}
                              alt={device.name}
                              className={`max-h-full max-w-full object-contain ${imageLoadStatus[device.id] ? "block" : "invisible"}`}
                              onLoad={() => handleImageLoad(device.id)}
                            />
                          </div>
                          <br />
                          <div className="flex-grow">
                            <div className="flex justify-between items-center">
<h5 className="font-bold text-blue-500 mb-2 dark:text-white flex items-center  gap-2"><FiSmartphone/>{device.name}</h5>

<span className='bg-slate-50 text-emerald-500 flex items-center text-xs gap-2 px-3 py-2 rounded-3xl mb-2'><FiTag/>{device.condition}</span>
                            </div>
                            <p className='text-sm text-gray-500'>{device.description?.substring(0, 60)}...</p>
                            
                            <div className="mt-3  ">
                              <span className="font-bold  bg-indigo-100 px-3 py-2 text-sm rounded-3xl inline-block text-indigo-600 dark:text-indigo-400">
                              {device.price.toFixed(2)} EGP
                              </span>
                                <hr className="border-gray-200 dark:border-gray-700 my-2" />
                               <button
                                  onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(device);
            }}
                                className="bg-blue-500  text-white font-bold rounded-lg p-2 mt-2 flex justify-center items-center w-full "
                              >
                                <FiShoppingCart className="mr-2" /> Add to Cart
                              </button>
                            
                           
                            </div>
                           
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

       
          <button
            onClick={() => scrollShops("left")}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-indigo-500 text-white rounded-full p-2 shadow-md -ml-4"
          >
            <FiChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={() => scrollShops("right")}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-indigo-500 text-white rounded-full p-2 shadow-md -mr-4"
          >
            <FiChevronRight className="w-6 h-6 text-white" />
          </button>
        </motion.div>
      </div>
    </section> */}




     </>
  );
};

export default Homepage;