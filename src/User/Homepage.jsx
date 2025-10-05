
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

  <div className="absolute inset-0 opacity-5 pointer-events-none">
    <FiTool className="absolute w-20 h-20 bottom-1/3 right-1/5 animate-float-medium dark:text-blue-500" />
    <FiShoppingBag className="absolute w-24 h-24 top-1/3 right-1/4 animate-float-slow dark:text-blue-500" />
    <FiShoppingBag className="absolute w-16 h-16 bottom-1/4 left-1/3 animate-float-fast dark:text-blue-500" />
    <FiSmartphone className="absolute w-20 h-20 top-10 left-10 animate-float-medium dark:text-blue-500" />
    <FiSmartphone className="absolute w-28 h-28 bottom-20 right-20 animate-float-slow dark:text-blue-500" />
    <FiMonitor className="absolute w-18 h-18 top-1/2 left-1/4 animate-float-fast dark:text-blue-500" />
  </div>


  <div className="container mx-auto px-4 py-16 md:py-32 min-h-screen relative z-10">
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-bold mb-6">
        Repair & Buy Devices with Confidence
      </h1>
      <p className="text-xl mb-8 text-blue-700 dark:text-blue-100">
        Find trusted repair shops and purchase refurbished devices at great prices
      </p>

      
      <div className="relative ">
        <form
          onSubmit={heroHandleSearch}
          className="bg-white border dark:border-gray-700 rounded-lg dark:bg-gray-800 rounded-lg shadow-lg p-2 flex flex-wrap justify-center items-center mb-10"
        >
          <input
            type="text"
            placeholder="Search for devices, shops, or services..."
            className="flex-grow px-4 py-3 text-gray-800  dark:text-white cursor-pointer dark:bg-gray-800 focus:outline-none focus:border-blue-800"
            value={heroSearchQuery}
            onChange={(e) => heroSetSearchQuery(e.target.value)}
          />
        </form>

        
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
                      href={`/device/${item.id}`}
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

            
              <div className="mt-6 grid grid-cols-2 gap-4 text-center text-sm">
                {["Screen Replacement", "Battery Replacement", "Water Damage Fix", "Software Issues"].map(
                  (service, idx) => (
                    <div
                      key={idx}
                      className="flex items-center flex-wrap text-center justify-center dark:text-white gap-2"
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

{/* <section className="py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-black">
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
</section> */}


      






<section
  id="latest-devices"
  className="py-16 bg-gray-100 dark:bg-gray-900"
>
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
      className="text-center mb-12"
    >
      <h2 className="text-3xl md:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
        Latest Devices
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mt-3 max-w-2xl mx-auto">
        Browse the newest arrivals in refurbished and pre-owned devices
      </p>
    </motion.div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((device) => (
        <motion.div
          key={device.id}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          viewport={{ once: true }}
          onClick={() => navigate(`/device/${device.id}`)}
          className="group rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="bg-white dark:bg-gray-800 p-6 h-full flex flex-col">
            <div className="relative h-56 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
              {!imageLoadStatus[device.id] && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400"
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
                className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
                  imageLoadStatus[device.id] ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => handleImageLoad(device.id)}
              />
            </div>

            <div className="flex flex-col flex-grow mt-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FiSmartphone className="text-indigo-600 dark:text-indigo-400" size={20} />
                {device.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                {device.description?.substring(0, 60)}...
              </p>
              <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-lg">
                  {device.price.toFixed(2)} EGP
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(device);
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all duration-200"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
</section>


     </>
  );
};

export default Homepage;