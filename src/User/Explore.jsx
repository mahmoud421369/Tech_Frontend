import React, { useEffect, useState, useRef } from "react";
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
  FiXSquare,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import { RiShoppingBag2Line, RiStore2Line } from "react-icons/ri";
import { RiShoppingBag3Line } from "@remixicon/react";

const Explore = ({ darkMode, addToCart }) => {
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
      const res = await fetch(`${API_BASE}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data.content || []);
    } catch (err) {
      console.error(err);
    }
  };


const fetchProductsByCategory = async (categoryId) => {
  try {
    const res = await fetch(`${API_BASE}/api/products/category/${categoryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch products");

    const data = await res.json();
    setProducts(data.content || []); 
  } catch (err) {
    console.error("❌ Error fetching products by category:", err);
  }
};

const handleCategoryChange = (e) => {
  const id = e.target.value;
  setSelectedCategory(id);
  fetchProductsByCategory(id);
};

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchMin = minPrice === "" || parseFloat(p.price) >= parseFloat(minPrice);
    const matchMax = maxPrice === "" || parseFloat(p.price) <= parseFloat(maxPrice);
    const matchCategory = selectedCategory === "" || p.category?.idd === selectedCategory;
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`},
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
      Swal.fire(" Error", "Failed to add product to cart", "error");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchShops();
    fetchCategories();
  }, []);

  return (
    <div
      className={`mx-auto mt-16 min-h-screen transition-all duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
    
      <div className="relative bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-900 dark:to-gray-800 text-white py-16 px-6 md:px-12 shadow-2xl">
        <div className="max-w-7xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Discover Amazing Products & Shops
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-6">
            Explore a wide range of high-quality products and connect with verified shops tailored to your needs.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })}
            className="inline-flex dark:bg-gray-950 dark:text-indigo-600 items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-full shadow-md hover:bg-gray-100 transition-all duration-300"
          >
            <FiShoppingBag className="text-xl" /> Start Shopping
          </button>
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 animate-bounce">
          <FiChevronsDown className="text-3xl text-white" />
        </div>
      </div>

      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
            <FiTag className="text-xl" /> Filter Products
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative flex-1 min-w-[150px]">
              <input
                type="number"
                placeholder="Min Price"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div className="relative flex-1 min-w-[150px]">
              <input
                type="number"
                placeholder="Max Price"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
        <div className="relative w-56" ref={dropdownRef}>
  <button
    type="button"
    onClick={() => setIsOpen(!isOpen)}
    className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition"
  >
    {selectedCategory
      ? categories.find((c) => c.id === selectedCategory)?.name
      : "Select Category"}
    <FiChevronDown
      className={`ml-2 h-5 w-5 transform transition-transform duration-300 ${
        isOpen ? "rotate-180" : ""
      }`}
    />
  </button>

  {isOpen && (
    <div className="absolute mt-2 w-full rounded-xl shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50 max-h-60 overflow-y-auto">
      <ul className="py-2">
        
        <li>
          <button
            onClick={() => {
              setSelectedCategory("");
              fetchProductsByCategory(""); 
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 rounded"
          >
            All Categories
          </button>
        </li>

       
        {categories.map((category) => (
          <li key={category.id}>
            <button
              onClick={() => {
                setSelectedCategory(category.id);
                fetchProductsByCategory(category.id);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 rounded"
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
      </div>

    
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-8 flex items-center gap-2 animate-fade-in">
          <FiShoppingCart className="text-2xl" /> Featured Products
        </h2>
        {paginatedProducts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center text-lg">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {paginatedProducts.map((product) => (
              <Link
                key={product.id}
                to={`/device/${product.id}`}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
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
                  <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2 line-clamp-1">
                    {product.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                    {product.description || "No description available"}
                  </p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-white bg-indigo-600 px-4 py-1 rounded-full">
                      {product.price.toFixed(2)} EGP
                    </span>
                    <span
                      className={`px-2 py-1 text-xs flex items-center gap-2 rounded ${
                        product.condition === "NEW"
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400"
                          : "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400"
                      }`}
                    >
                      <FiTag /> {product.condition}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600 dark:text-gray-300 mb-3">
                    <span>{product.stock < 6 ? `📦 Stock: ${product.stock} left `: ""}</span>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    {product.stock > 0 ? 
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(product);
                      }}
                      className="flex-1 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <FiShoppingCart /> Add to Cart
                    </button>
:   <button
                     disabled
                      className="flex-1 px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white font-semibold rounded-xl hover:bg-orange-700 dark:hover:bg-emerald-800 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <FiXSquare /> Out of stock
                    </button>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="flex justify-center gap-4 mb-12">
          <button
            disabled={productPage === 1}
            onClick={() => setProductPage((p) => p - 1)}
            className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
          >
            <FiChevronLeft className="text-lg" />
          </button>
          <button
            disabled={productPage * itemsPerPage >= filteredProducts.length}
            onClick={() => setProductPage((p) => p + 1)}
            className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
          >
            <FiChevronRight className="text-lg" />
          </button>
        </div>
      </div>

   
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-8 shadow-lg flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-2xl font-bold mb-2">Find Your Perfect Shop</h3>
            <p className="text-base">Browse verified shops and discover exclusive deals tailored for you!</p>
          </div>
          {/* <button
            onClick={() => window.scrollTo({ top: 1200, behavior: "smooth" })}
            className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-full shadow-md hover:bg-gray-100 transition-all duration-300"
          >
            Explore Shops
          </button> */}
        </div>
      </div>

  
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-8 flex items-center gap-2 animate-fade-in">
          <FiCheckCircle className="text-2xl" /> Verified Shops
        </h2>
        {paginatedShops.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center text-lg">No shops found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {paginatedShops.map((shop) => (
              <div
                key={shop.id}
                className="rounded-2xl p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <RiStore2Line className="text-xl" /> {shop.name}
                  </h2>
                  {shop.verified && (
                    <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 rounded-full">
                      <FiCheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 italic">
                  {shop.description || "No description available"}
                </p>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
                  <p className="flex items-center gap-2">
                    <FiMail className="text-indigo-500" /> {shop.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <FiPhone className="text-indigo-500" /> 0{shop.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <FiTag className="text-indigo-500" /> {shop.shopType}
                  </p>
                      {shop.shopAddress && (
                            <div className=" flex items-center gap-2 text-gray-700 dark:text-gray-300 rounded ">
                              <strong><FiMapPin className="text-indigo-500"/></strong> {shop.shopAddress.street}, {shop.shopAddress.city}, {shop.shopAddress.state}
                            </div>
                          )}
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">🟢</span> Active: {shop.activate ? "Yes" : "No"}
                  </p>
                </div>
                {shop.verified ? 
                <button
             
                  onClick={() => navigate(`/shops/${shop.id}`)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-300 shadow-md"
                >
                  Visit Shop
                </button>
 :   <button
             disabled
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-300 shadow-md"
                >
                  Not Verified
                </button> }
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-center gap-4 mb-12">
          <button
            disabled={shopPage === 1}
            onClick={() => setShopPage((p) => p - 1)}
            className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
          >
            <FiChevronLeft className="text-lg" />
          </button>
          <button
            disabled={shopPage * itemsPerPage >= shops.length}
            onClick={() => setShopPage((p) => p + 1)}
            className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
          >
            <FiChevronRight className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Explore;