import React, { useEffect, useState,useRef } from "react";
import {
  FiCheckCircle,
  FiShoppingCart,
  FiTag,
  FiChevronLeft,
  FiChevronRight,
  FiShoppingBag,
  FiChevronsDown,
  FiChevronDown,
  FiMail,
  FiMapPin,
  FiPhone,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import { RiShoppingBag2Line, RiStore2Line } from "react-icons/ri";
import { RiShoppingBag3Line } from "@remixicon/react";

const Explore = ({ darkMode, addToCart  }) => {
  const API_BASE = "http://localhost:8080";
  const token = localStorage.getItem("authToken");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);

  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
const [imageLoading, setImageLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);


  const [productPage, setProductPage] = useState(1);
  const [shopPage, setShopPage] = useState(1);
  const itemsPerPage = 6;

  const navigate = useNavigate();
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data.content || []);
    } catch (err) {
      console.error(err);
    }
  };


  const fetchShops = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/shops/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setShops(data.content || []);
    } catch (err) {
      console.error("Error fetching shops:", err);
    }
  };


  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data.content || []);
    } catch (err) {
      console.error(err);
    }
  };


  const filteredProducts = products.filter((p) => {
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchMin = minPrice === "" || parseFloat(p.price) >= parseFloat(minPrice);
    const matchMax = maxPrice === "" || parseFloat(p.price) <= parseFloat(maxPrice);
    const matchCategory =
      selectedCategory === "" || p.categoryId === selectedCategory;
    return matchSearch && matchMin && matchMax && matchCategory;
  });



  
  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * itemsPerPage,
    productPage * itemsPerPage
  );
  const paginatedShops = shops.slice(
    (shopPage - 1) * itemsPerPage,
    shopPage * itemsPerPage
  );


  const handleAddToCart = async (product) => {
    try {
      const res = await fetch(`${API_BASE}/api/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          price: product.price,
          name: product.name,
          imageUrl: product.imageUrl,
        }),
      });
      if (!res.ok) throw new Error("Failed to add item to cart");
      if (addToCart) addToCart(product);
      Swal.fire("Success", `${product.name} added to cart!`, "success");
    } catch (err) {
      Swal.fire("❌ Error", "Failed to add product to cart", "error");
    }
  };

  
  useEffect(() => {
    fetchProducts();
    fetchShops();
    fetchCategories();
  }, []);

  return (
    <div
      className={`mx-auto mt-16 p-6 min-h-screen transition ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >

      <div className="bg-white border dark:bg-gray-800 dark:border-none text-white rounded-2xl p-6 mb-10 shadow-lg">
        <h3 className="font-bold text-2xl text-blue-600 mb-4 flex items-center gap-2">
          <FiTag /> Filter Products
        </h3>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search..."
            className=" pl-3 pr-3 py-3 text-blue-500 rounded-xl dark:bg-gray-900 bg-gray-50 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="number"
            placeholder="Min Price"
            className="  pl-3 pr-3 py-3 text-blue-500 rounded-xl bg-gray-50 dark:bg-gray-900 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max Price"
            className="  pl-3 pr-3 py-3 text-blue-500 rounded-xl bg-gray-50 dark:bg-gray-900 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
               
        <div className="relative w-56" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex justify-between items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            {selectedCategory
              ? categories.find((c) => c.id === selectedCategory)?.name
              : "Select Category"}
            <FiChevronDown
              className={`ml-2 h-5 w-5 transform transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute mt-2 w-full rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50 max-h-60 overflow-y-auto">
              <ul className="py-2">
                <li>
                  <button
                    onClick={() => {
                      setSelectedCategory("");
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-600 rounded"
                  >
                    All Categories
                  </button>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <button
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-600 rounded"
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

    </div>

        </div>
      </div>

 
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <FiShoppingCart /> Explore Products
      </h2>
   {paginatedProducts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {paginatedProducts.map((product) => {
            
            return (
              <Link
              to={`/device/${product.id}`}
                
                className="bg-white dark:bg-gray-800 rounded-2xl cursor-pointer shadow-lg overflow-hidden hover:shadow-xl transition flex flex-col"
              >
            
                <div className="relative w-full h-48">
                  {imageLoading && (
                    <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-t-2xl" />
                  )}
                  <img
                    src={product.imageUrl || "https://via.placeholder.com/400x250"}
                    alt={product.name}
                    className={`w-full h-48 object-cover transition-opacity duration-500 ${
                      imageLoading ? "opacity-0" : "opacity-100"
                    }`}
                    onLoad={() => setImageLoading(false)}
                  />
                </div>

            
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2 line-clamp-1">
                    {product.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                    {product.description || "No description available"}
                  </p>

                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold dark:bg-gray-950 bg-gray-50 text-blue-600 px-3 py-2 rounded-3xl">
                      {product.price.toFixed(2)} EGP
                    </span>
                    <span
                      className={`px-2 py-1 text-xs flex items-center gap-2 rounded ${
                        product.condition === "NEW"
                          ? "bg-green-100 dark:bg-gray-900 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                     <FiTag/> {product.condition}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-3">
                    <span>{product.stock < 6 ? "📦 Stock:"+  product.stock +  "left" : ""} </span>
                    {/* <span>🕒 {new Date(product.createdAt).toLocaleDateString()}</span> */}
                  </div>

            
                  <div className="flex gap-2 mt-auto">
                    {/* <button
                      onClick={() => navigate(`/device/${product.id}`)}
                      className="flex-1 px-4 py-2 bg-amber-50 text-amber-600 dark:bg-gray-900 dark:text-white font-bold dark:border-none border-2 flex items-center justify-center gap-2 dark:border-none border-amber-100 rounded-xl  transition"
                    >
                      View
                    </button> */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-gray-950 dark:text-white font-bold border-2 flex items-center justify-center gap-2 dark:border-none border-emerald-100 rounded-xl  transition"
                    >
                      <FiShoppingCart/>Add to cart
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}


 
      <div className="flex justify-center gap-4 mb-12">
        <button
          disabled={productPage === 1}
          onClick={() => setProductPage((p) => p - 1)}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          <FiChevronLeft />
        </button>
        <button
          disabled={productPage * itemsPerPage >= filteredProducts.length}
          onClick={() => setProductPage((p) => p + 1)}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          <FiChevronRight />
        </button>
      </div>


      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <FiCheckCircle /> Verified Shops
      </h2>
      {paginatedShops.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No shops found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedShops.map((shop) => (
         <div
  key={shop.id}
  className="rounded-2xl p-5 transition transform hover:scale-[1.02] hover:shadow-2xl 
             bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl shadow-lg border border-white/30"
>

  <div className="flex justify-between flex-wrap items-center mb-3 gap-2">
    <h2 className="text-xl font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
     <RiStore2Line/> {shop.name}
    </h2>
    {shop.verified && (
      <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-200/50 
                       text-green-700 dark:bg-green-500/20 dark:text-green-400 
                       rounded-full">
        <FiCheckCircle className="w-3 h-3" /> Verified
      </span>
    )}
  </div>

  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 italic">
    {shop.description || "No description available"}
  </p>


  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
    <p className="flex items-center gap-2">
      <FiMail className="text-blue-500" /> {shop.email}
    </p>
    <p className="flex items-center gap-2">
      <FiPhone className="text-blue-500" />0{shop.phone}
    </p>
    <p className="flex items-center gap-2">
      <FiTag className="text-blue-500" /> {shop.shopType}
    </p>
    <p className="flex items-center gap-2">
      <FiMapPin className="text-blue-500" />{" "}
      {shop.shopAddress
        ? shop.shopAddress
        : "N/A"}
    </p>
    <p className="flex items-center gap-2">
      <span className="text-green-500">🟢</span> Active: {shop.activate ? "Yes" : "No"}
    </p>
  </div>

  <button
    onClick={() => navigate(`/shops/${shop.id}`)}
    className="w-full mt-2 px-4 py-2 bg-blue-600 dark:bg-gray-950 text-white rounded-xl 
               hover:bg-blue-700 transition shadow-md"
  >
    Visit Shop
  </button>
</div>
          ))}
        </div>
      )}

  
      <div className="flex justify-center gap-4 mb-12">
        <button
          disabled={shopPage === 1}
          onClick={() => setShopPage((p) => p - 1)}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          <FiChevronLeft />
        </button>
        <button
          disabled={shopPage * itemsPerPage >= shops.length}
          onClick={() => setShopPage((p) => p + 1)}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 disabled:opacity-50"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Explore;