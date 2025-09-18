import React, { useEffect, useState } from "react";
import { FiCheckCircle, FiStar, FiShoppingCart, FiClock, FiFilter, FiHome, FiTag } from "react-icons/fi";
import { RiStore2Line } from "react-icons/ri";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Explore = ({ darkMode, addToCart }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [shops, setShops] = useState([]);

  const navigate = useNavigate();

  const [imageLoadStatus, setImageLoadStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("devices");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleImageLoad = (id) => {
    setImageLoadStatus((prev) => ({ ...prev, [id]: true }));
  };

 useEffect(() => {

   const token = localStorage.getItem("authToken");
 
   const fetchShops = async () => {
     try {
       const res = await fetch("http://localhost:8080/api/users/shops/all", {

         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token} `,
         },
      
       });
 
      //  if (!res.ok) {
      //    if (res.status === 401) {
          
      //      Swal.fire("Session Expired", "Please log in again", "warning");
      //      localStorage.removeItem("authToken");
      //      localStorage.removeItem("refreshToken");
      //      navigate("/login");
      //      return;
      //    }
      //    throw new Error(`Failed to fetch shops: ${res.status}`);
      //  }
 
       const data = await res.json();
 
       const shopsWithDevices = (data.content || []).map((shop) => ({
         ...shop,
         devices: [],
         services: shop.services || [],
       }));
       setShops(shopsWithDevices);
 
   
     } catch (err) {
       if (err.name !== "AbortError") {
         console.error("Error fetching shops:", err);
         Swal.fire("Error", "Could not load shops", "error");
       }
     }
   };
 
   fetchShops();

 }, [navigate]);





 const fetchProducts = async () => {
   const token = localStorage.getItem("authToken");

     try {
       const res = await fetch("http://localhost:8080/api/products", {
        
         headers: {
           "Content-Type": "application/json",
            Authorization: `Bearer ${token} `
         }
      
       });
 
       if (!res.ok) {
       
         throw new Error(`Failed to fetch shops: ${res.status}`);
       }
 
       const data = await res.json();
 
      
       setProducts(data.content || []);
 
   
     } catch (err) {
       if (err.name !== "AbortError") {
         console.error("Error fetching shops:", err);
         Swal.fire("Error", "Could not load shops", "error");
       }
     }
   };





   
  const fetchCategories = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/users/categories`,
        { headers: { "Content-Type":"application/json",Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data.content || data);
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  };

  useEffect(() => {
   
    fetchCategories();
     fetchProducts();
  }, []);


  const handleCategorySelect = async (categoryId) => {
    setSelectedCategory(categoryId);
    if (categoryId === "") {

      const res = await fetch("http://localhost:8080/api/products");
      const data = await res.json();
      setProducts(data.content || []);
    } else {
      const res = await fetch(
        `http://localhost:8080/api/products/category/${categoryId}`
      );
      const data = await res.json();
      setProducts(data.content || []);
    }
  };

  
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());

    const matchMin =
      minPrice === "" || parseFloat(p.price) >= parseFloat(minPrice);

    const matchMax =
      maxPrice === "" || parseFloat(p.price) <= parseFloat(maxPrice);

    return matchSearch && matchMin && matchMax;
  });

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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-blue-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-blue-600 text-xl font-semibold">
            Loading Explore...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`container-fluid ${
        darkMode
          ? "bg-gray-900"
          : "bg-gradient-to-br from-white to-indigo-50"
      } mx-auto mt-20 p-4 md:p-6`}
    >

      <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto custom-scroll scrollbar-hide">
        <div className="flex space-x-4 min-w-max">
          <button
            onClick={() => setActiveTab("devices")}
            className={`px-6 py-3 font-medium text-lg flex items-center ${
              activeTab === "devices"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <FiShoppingCart className="mr-2" /> Devices
          </button>
          <button
            onClick={() => setActiveTab("shops")}
            className={`px-6 py-3 font-medium text-lg flex items-center ${
              activeTab === "shops"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <FiCheckCircle className="mr-2" /> Verified Shops
          </button>
        </div>
      </div>

 
<div className={`${darkMode ? ' bg-white/10 border-white/20 ' : 'bg-gradient-to-br from-blue-500/80 to-indigo-600/80  backdrop-blur-md'}relative rounded-xl p-6  text-center cursor-pointer transform transition duration-300  hover:shadow-2xl`}>
<div className="block"><h3 className="mb-4 text-white  font-bold text-2xl flex items-center gap-2"><FiFilter/>Filter by</h3></div>
<div className="flex justify-between items-center gap-4">
  <input
    type="text"
    placeholder="Search products..."
    className="w-full md:w-3/4 bg-white/10 border-white/20 text-white hover:bg-white/20 px-4 py-3 rounded-3xl border  dark:bg-gray-900/40  placeholder-white dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />
  <input
    type="number"
    placeholder="Min Price"
    className="w-full md:w-1/4 px-4 py-3 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-3xl dark:bg-gray-900/40   placeholder-white dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    value={minPrice}
    onChange={(e) => setMinPrice(e.target.value)}
  />
  </div>
  <div className="flex justify-between items-center mt-2">
  
  <input
    type="number"
    placeholder="Max Price"
    className="w-full md:w-1/4 px-4 py-3 rounded-3xl border  dark:bg-gray-900/40 bg-white/10 border-white/20 text-white hover:bg-white/20  placeholder-white dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    value={maxPrice}
    onChange={(e) => setMaxPrice(e.target.value)}
  />
  </div>
</div>



      {activeTab === "devices" ? (
        <>
          <h1 className="text-3xl inline-block text-center bg-white  backdrop-blur-md border border-white/20 dark:bg-gray-800 text-blue-500 justify-center items-center gap-4 md:text-4xl font-bold mb-6 p-4 rounded-2xl border-blue-700">
            Explore Products
          </h1>


         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {filteredProducts.length > 0 ? (
    filteredProducts.map((p) => (
      <div
        key={p.id}
        onClick={() => navigate(`/device/${p.id}`)}
        className={`${darkMode ? 'bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 border-gray-800 ' : 'bg-gradient-to-br from-blue-500/80 to-indigo-600/80  '} border-none backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-2 cursor-pointer  overflow-hidden`}
      >
        <div className="h-52 bg-white dark:bg-gray-900/30 p-4 flex items-center justify-center relative">
          {!imageLoadStatus[p.id] && (
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
            src={p.imageUrl}
            alt={p.name}
            className={`w-full h-full object-contain ${
              imageLoadStatus[p.id] ? "block" : "hidden"
            }`}
            onLoad={() => handleImageLoad(p.id)}
          />
        </div>

        <div className="p-4 bg-white/20 dark:bg-gray-900/30 backdrop-blur-md">
        <div className="flex justify-between mb-2">
          <h2 className="font-bold text-lg mb-2 text-white dark:text-gray-100">
            {p.name}
          </h2>  
          <span className="text-indigo-600 text-xs rounded-3xl px-3 py-2 flex items-center gap-2 bg-slate-200 "><FiTag/>{p.condition}</span>
        </div>
      
          <p className="text-white/80 dark:text-gray-300 mb-2 text-sm">
            {p.description?.substring(0, 60)}...
          </p>
          <div className="flex justify-between items-center mb-2">
            <p className="px-4 py-1.5 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 block font-semibold text-sm shadow-md transition backdrop-blur-md border mb-2">{p.price} EGP</p>
            <span className="text-white/70 text-sm">
              {p.categoryName || "Uncategorized"}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(p);
            }}
            className="w-full mt-2 bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-xl transition"
          >
            Add to Cart
          </button>
        </div>
      </div>
    ))
  ) : (
    <p className="col-span-full text-center p-3 bg-[#f1f5f9] border rounded-xl text-blue-500 font-bold dark:text-gray-300">
      No products found
    </p>
  )}
</div>
        </>
      ) : (
        <>
          <h1 className="text-3xl inline-block text-center bg-white  backdrop-blur-md border border-white/20 dark:bg-gray-800 text-blue-500 justify-center items-center gap-4 md:text-4xl font-bold mb-6 p-4 rounded-2xl border-blue-700">
            Verified Shops
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                to={`/shops/${shop.id}`}
                className="bg-white dark:bg-gray-800 dark:border-gray-700 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
               
              >
                <div className="h-52 bg-gradient-to-br from-blue-500 to-indigo-600 text-white dark:bg-gray-900 p-4 flex items-center justify-center">
   <RiStore2Line size={70} className="text-white"/>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">
                    {shop.name}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                      {shop.rating} <FiStar className="inline" /> 4.7
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {shop.reviews} 120 reviews
                    </span>
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 mt-1">
                    <FiClock className="inline mr-1" /> {shop.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          
        </>
      )}

     
      <br />
      <div className="p-3 mb-8">
        <h3 className="text-3xl inline-block bg-indigo-500 dark:bg-gray-800 text-white justify-center items-center gap-4 md:text-4xl font-bold mb-6 p-4 rounded-2xl border-blue-700">
          Categories
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
          <div
            onClick={() => handleCategorySelect("")}
            className={`cursor-pointer p-6 bg-white rounded-2xl shadow hover:shadow-md text-center transition ${
              selectedCategory === "" ? "border-2 border-blue-500" : ""
            }`}
          >
            <h3 className="font-semibold text-gray-700">All</h3>
          </div>

          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`cursor-pointer p-6 bg-gradient-to-br from-blue-500 to-indigo-600  rounded-lg shadow hover:shadow-md text-center transition ${
                selectedCategory === cat.id ? "border-2 border-blue-500" : ""
              }`}
            >
              <h3 className="font-bold text-white">{cat.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default Explore;