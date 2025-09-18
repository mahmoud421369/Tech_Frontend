
import { useState,useRef,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FiStar, FiTool, FiShoppingBag,FiChevronLeft,FiChevronRight,FiShoppingCart,FiSmartphone,FiMapPin, FiMonitor, FiPhone, FiTag, FiDollarSign } from 'react-icons/fi';
import {motion} from 'framer-motion'
import Service from './Service';
import  "../styles/style.css";
import Swal from 'sweetalert2';
const Homepage = ({darkMode }) => {
  const [shops, setShops] = useState([]);

  const navigate = useNavigate();
  const [showPurchaseOptions, setShowPurchaseOptions] = useState(false);

  const handleRepairClick = () => {

    navigate('/repair');
  };

 const [imageLoadStatus, setImageLoadStatus] = useState({});

  const handlePurchaseUsed = () => {
    
    navigate('/purchase/used');
  };
    const handleImageLoad = (id) => {
    setImageLoadStatus(prev => ({ ...prev, [id]: true }));
  };


  const offers = [
    {
      id: 1,
      title: "MacBook Pro 16",
      description: "Latest M2 Max chip, 32GB RAM, 1TB SSD",
      price: 2499,
      discount: 300,
      image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-family-hero?wid=940&hei=1112&fmt=png-alpha&.v=1631220221000',
      rating: 4.8,
      stock: 15
    },
    {
      id: 2,
      title: "iPhone 14 Pro",
      description: "Super Retina XDR display, A16 Bionic chip",
      price: 999,
      discount: 100,
      image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-family-hero?wid=940&hei=1112&fmt=png-alpha&.v=1631220221000',
      rating: 4.9,
      stock: 42
    },
    {
      id: 3,
      title: "Samsung Galaxy S23",
      description: "200MP camera, Snapdragon 8 Gen 2, S Pen included",
      price: 1199,
      discount: 150,
      image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-family-hero?wid=940&hei=1112&fmt=png-alpha&.v=1631220221000',
      rating: 4.7,
      stock: 28
    },
    {
      id: 4,
      title: "Sony WH-1000XM5",
      description: "Industry-leading noise cancellation headphones",
      price: 399,
      discount: 50,
      image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-family-hero?wid=940&hei=1112&fmt=png-alpha&.v=1631220221000',
      rating: 4.9,
      stock: 63
    }
  ];

    const [selectedOffer, setSelectedOffer] = useState(null);
    const [activeTab, setActiveTab] = useState('all');


   const filteredOffers = activeTab === 'all' 
    ? offers 
    : offers.filter(offer => offer.shopId === parseInt(activeTab));

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



  <><section className={`relative mt-10 min-h-80  overflow-hidden ${darkMode ? 'bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 border-gray-800' : 'bg-gradient-to-r from-blue-600 to-indigo-700'} text-white`}>
  
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
      <p className="text-xl mb-8 text-blue-100">
        Find trusted repair shops and purchase refurbished devices at great prices
      </p>

        <div className="relative">
      <form 
        onSubmit={heroHandleSearch}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex flex-wrap justify-center items-center mb-10"
      >
        <input
          type="text"
          placeholder="Search for devices, shops, or services..."
          className="flex-grow px-4 py-3 dark:text-white cursor-pointer text-gray-800 dark:bg-gray-800 focus:outline-none focus:border-blue-800"
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
                <li key={item.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <a 
                    href={`#${item.id}`} 
                    className=" p-4 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.category}</p>
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
        <div className="bg-white bg-opacity-10 p-4 rounded-lg flex items-center backdrop-blur-sm">
          <FiTool className="text-3xl mr-3" />
          <div>
            <h3 className="font-bold">Expert Repairs</h3>
            <p className="text-blue-100">Certified technicians</p>
          </div>
        </div>

        <div className="bg-white bg-opacity-10 p-4 rounded-lg flex items-center backdrop-blur-sm">
          <FiShoppingBag className="text-3xl mr-3" />
          <div>
            <h3 className="font-bold">Quality Devices</h3>
            <p className="text-blue-100">Tested and guaranteed</p>
          </div>
        </div>

        <div className="bg-white bg-opacity-10 p-4 rounded-lg flex items-center backdrop-blur-sm">
          <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
            6
          </div>
          <div>
            <h3 className="font-bold">Months Warranty</h3>
            <p className="text-blue-100">On all repairs</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <style jsx global>{`
    @keyframes float {
      0%, 100% {
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

  <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-1 gap-6">
    
<motion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
  viewport={{ once: true, amount: 0.3 }}
  onClick={handleRepairClick}
  className="relative group rounded-2xl overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
>
 
  <div className="p-6 h-72 rounded-2xl  bg-gradient-to-br from-blue-500/90 via-blue-600/80 to-blue-800/70 dark:from-blue-900/90 dark:via-blue-800/80 dark:to-gray-900/70 backdrop-blur-xl shadow-lg flex flex-col items-center justify-center">
    

    <div className="flex items-center justify-center mb-5">
      <div className="bg-white/20 dark:bg-gray-700/40 p-5 rounded-full backdrop-blur-md shadow-md group-hover:scale-110 transition-transform duration-300">
        <svg xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      </div>
    </div>

   
    <h2 className="text-2xl font-bold text-white text-center mb-3 tracking-wide group-hover:text-yellow-300 transition-colors duration-300">
      Repair Device
    </h2>


    <p className="text-sm text-gray-100 text-center max-w-xs leading-relaxed">
      Get your device fixed by our <span className="font-semibold text-yellow-300">expert technicians</span> quickly and reliably.
    </p>
  </div>
</motion.div>
    {/* <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeIn" }}
      viewport={{ once: true, amount: 0.3 }}
      className="relative rounded-xl overflow-hidden cursor-pointer transition-transform transform hover:scale-105 hover:shadow-2xl"
    >
      <div className="p-6 h-72 bg-[#f1f5f9] border text-white">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-blue-500 bg-white  p-3 text-2xl rounded-3xl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-blue-500 text-center mb-2">Purchase Device</h2>

        {!showPurchaseOptions ? (
          <>
            <p className="text-gray-500 text-center mb-4">Buy a new or pre-owned device</p>
            <button
              onClick={() => setShowPurchaseOptions(true)}
              className="w-full bg-blue-500  text-white py-2 px-4 rounded-3xl font-medium transition"
            >
              Choose Option
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <Link to="/purchase/new" className="w-full bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg font-medium transition flex items-center justify-between">
              New Device
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>

            <button
              onClick={handlePurchaseUsed}
              className="w-full bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg font-medium transition flex items-center justify-between"
            >
              Used Device
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              onClick={() => setShowPurchaseOptions(false)}
              className="w-full text-white/80 hover:text-white py-2 text-sm font-medium transition"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </motion.div> */}
  </div>

        <Service darkMode={darkMode}/>





       {/* <div className='mt-10 container-fluid bg-white dark:bg-gray-900 p-5 rounded-2xl'>
      <h2 className="text-2xl inline-flex items-center gap-2 bg-blue-500 dark:bg-gray-700 p-3 rounded-2xl font-bold mb-6 mt-6  text-white text-center">
        <FiTag size={25} className=''/>Latest Devices Offers
      </h2>


      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-full ${activeTab === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          All Shops
        </button>
        {shops.map(shop => (
          <button
            key={shop.id}
            onClick={() => setActiveTab(shop.id.toString())}
            className={`px-4 py-2 rounded-full flex items-center gap-2 ${activeTab === shop.id.toString() ? 'bg-blue-500 text-white' : 'bg-[#f1f5f9] text-blue-500 dark:bg-gray-700'}`}
          >
            {shop.name}
            <span className="flex items-center">
              {shop.rating.toFixed(1)} <FiStar className="text-yellow-500 ml-1" />
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredOffers.map(offer => (
          <div 
            key={offer.id} 
            className="bg-white dark:bg-gray-800 dark:border-none rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedOffer(offer)}
          >
           


 <div className="relative">
                   <div className="h-52 bg-[#f1f5f9] dark:bg-gray-800 dark:border-gray-700   flex items-center justify-center relative">
                
                {!imageLoadStatus[offer.id] && (
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
                  src={offer.image} 
                  alt={offer.name}
                  className={`max-h-full max-w-full object-contain ${imageLoadStatus[offer.id] ? 'block' : 'invisible'}`}
                  onLoad={() => handleImageLoad(offer.id)}
                />
              </div><br />
                  <div className="absolute top-2 right-2 bg-red-100 text-red-500 dark:bg-blue-100 dark:text-blue-500 px-2 py-1 rounded-3xl text-sm font-bold">
                    Save {offer.discount} EGP
                  </div>
                </div>

                <div className="p-4  dark:border-none">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{offer.title}</h3>
                    <div className="flex items-center bg-yellow-100 px-2 py-1 rounded">
                      <span className="text-yellow-800 font-bold mr-1">{offer.rating}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm mt-2 h-12 overflow-hidden">
                    {offer.description}
                  </p><br />

 <span className={`text-sm ${offer.stock > 10 ? 'text-green-600 bg-green-50 dark:bg-gray-900 dark:text-white rounded-3xl px-3 py-2' : 'text-orange-600'}`}>
                      {offer.stock > 10 ? 'In Stock' : `${offer.stock} left`}
                    </span>
                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{offer.price} EGP</span>
                      <span className="text-sm text-gray-500 line-through ml-2">{offer.price + offer.discount} EGP</span>
                    </div>

                  </div>

 
                </div>




          </div>
        ))}
      </div>


      {selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h3 className="text-xl font-bold dark:text-white">{selectedOffer.title}</h3>
              <button 
                onClick={() => setSelectedOffer(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-center h-64">
                    <img 
                      src={selectedOffer.imageUrl} 
                      alt={selectedOffer.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>

                <div className="md:w-1/2">
                  <div className="mb-4">
                    <h4 className="font-bold dark:text-white">Shop Information</h4>
                    <div className="flex items-center mt-2">
                      <span className="font-medium dark:text-white">
                        {shops.find(s => s.id === selectedOffer.shopId)?.name}
                      </span>
                      <div className="flex items-center ml-4">
                        {renderStars(shops.find(s => s.id === selectedOffer.shopId)?.rating)}
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          ({shops.find(s => s.id === selectedOffer.shopId)?.reviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-bold dark:text-white">Description</h4>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                      {selectedOffer.description}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-bold dark:text-white">Price</h4>
                    <div className="flex items-center mt-2">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedOffer.price} EGP
                      </span>
                      <span className="text-sm text-gray-500 line-through ml-2">
                        {selectedOffer.price + selectedOffer.discount} EGP
                      </span>
                      <span className="ml-4 bg-red-100 text-red-500 dark:bg-blue-100 dark:text-blue-500 px-2 py-1 rounded-3xl text-sm font-bold">
                        Save {selectedOffer.discount} EGP
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-bold dark:text-white">Availability</h4>
                    <span className={`text-sm ${selectedOffer.stock > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                      {selectedOffer.stock > 10 ? 'In Stock' : `${selectedOffer.stock} left`}
                    </span>
                  </div>

                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition">
                    Add to Cart
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="font-bold text-lg dark:text-white mb-4">Customer Reviews</h4>
                <div className="space-y-4">
                  {[1, 2, 3].map(review => (
                    <div key={review} className="border-b dark:border-gray-700 pb-4">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          {renderStars(4)}
                        </div>
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          - {['Ahmed', 'Mohamed', 'Ali'][review - 1]}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">
                        {[
                          'Great product, works perfectly!',
                          'Fast delivery and good packaging',
                          'Exactly as described, very happy with my purchase'
                        ][review - 1]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div> */}





<br /><br />
<section
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
    </section>




      </div></>
  );
};

export default Homepage;