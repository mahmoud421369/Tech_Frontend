
import React, { useEffect, useState, useRef, useCallback, memo } from "react";
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
  FiX,
  FiTool,
  FiSmartphone,
  FiMonitor,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import { RiStore2Line } from "react-icons/ri";
import debounce from 'lodash.debounce';
import api from '../api';

const Explore = memo(({ darkMode, addToCart }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [productsLoading, setProductsLoading] = useState(false);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState({});
  const [cartItems, setCartItems] = useState([]);

  const [isOpen, setIsOpen] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [shopPage, setShopPage] = useState(1);
  const itemsPerPage = 6;
  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();
  const dropdownRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setCategorySearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

 
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    const controller = new AbortController();
    try {
      const res = await api.get("/api/products", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      setProducts(res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching products:", err.response?.data || err.message);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Could not load products",
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
      }
    } finally {
      setProductsLoading(false);
    }
    return () => controller.abort();
  }, [token, darkMode]);


 
  const fetchProductsByCategory = useCallback(async (categoryId) => {
    setProductsLoading(true);
    setSelectedCategory(categoryId);
    const controller = new AbortController();
    try {
      const url = categoryId ? `/api/products/category/${categoryId}` : "/api/products";
      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      setProducts(res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching products by category:", err.response?.data || err.message);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Could not load products",
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
      }
    } finally {
      setProductsLoading(false);
      setIsOpen(false);
      setCategorySearch("");
    }
    return () => controller.abort();
  }, [token, darkMode]);



  const fetchShops = useCallback(async () => {
    setShopsLoading(true);
    const controller = new AbortController();
    try {
      const res = await api.get("/api/users/shops/all", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      setShops(res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Error fetching shops:", err.response?.data || err.message);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Could not load shops",
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
      }
    } finally {
      setShopsLoading(false);
    }
    return () => controller.abort();
  }, [token, darkMode]);



  const fetchCategories = useCallback(async () => {
    const controller = new AbortController();
    try {
      const res = await api.get("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      setCategories(res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(" Error fetching categories:", err.response?.data || err.message);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Could not load categories",
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
      }
    }
    return () => controller.abort();
  }, [token, darkMode]);

 

 const handleAddToCart = useCallback(async (product) => {
    try {
      await api.post("/api/cart/items", {
        productId: product.id,
        quantity: 1,
        price: product.price,
        name: product.name,
        imageUrl: product.imageUrl || (product.imageUrls && product.imageUrls[0]),
      }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (addToCart) {
        addToCart({ ...product, });
      }
  Swal.fire({
             title: 'Success',
             text: `${product.name} added to cart!`,
             icon: 'success',
             toast: true,
             position: 'top-end',
             showConfirmButton: false,
             timer: 1500,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },

           })
    
    } catch (error) {
      console.error("Error adding to cart:", error.response?.data || error.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to add item to cart",
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    }
  }, [addToCart, token, darkMode]);

  const cartCount = cartItems.length;
  
  const debouncedSetSearch = useCallback(
    debounce((value) => setSearch(value), 500),
    []
  );

 
  useEffect(() => {
    if (token) {
      Promise.all([fetchProducts(), fetchShops(), fetchCategories()]).catch((err) =>
        console.error("Error in initial fetch:", err)
      );
    } else {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please log in again",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      }).then(() => navigate("/login"));
    }
  }, [token, navigate, fetchProducts, fetchShops, fetchCategories, darkMode]);



  const filteredProducts = products.filter((p) => {
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchMin = minPrice === "" || parseFloat(p.price) >= parseFloat(minPrice);
    const matchMax = maxPrice === "" || parseFloat(p.price) <= parseFloat(maxPrice);
    return matchSearch && matchMin && matchMax;
  });

  
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * itemsPerPage,
    productPage * itemsPerPage
  );
  const paginatedShops = shops.slice(
    (shopPage - 1) * itemsPerPage,
    shopPage * itemsPerPage
  );

  const stockStatus = (stock) => {
    if (stock === 0) return { class: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400", label: "Out of Stock" };
    if (stock <= 5) return { class: "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400", label: `Low Stock: ${stock} left` };
    return { class: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400", label: "In Stock" };
  };

  return (
    <div
      className={`mx-auto mt-16 min-h-screen transition-all duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="relative bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-900 dark:to-gray-800 text-white py-16 px-6 md:px-12 shadow-2xl">
          <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <FiTool className="absolute w-20 h-20 bottom-1/3 right-1/5 animate-float-medium dark:text-blue-500" />
                  <FiShoppingBag className="absolute w-24 h-24 top-1/3 right-1/4 animate-float-slow dark:text-blue-500" />
                  <FiShoppingBag className="absolute w-16 h-16 bottom-1/4 left-1/3 animate-float-fast dark:text-blue-500" />
                  <FiSmartphone className="absolute w-20 h-20 top-10 left-10 animate-float-medium dark:text-blue-500" />
                  <FiSmartphone className="absolute w-28 h-28 bottom-20 right-20 animate-float-slow dark:text-blue-500" />
                  <FiMonitor className="absolute w-18 h-18 top-1/2 left-1/4 animate-float-fast dark:text-blue-500" />
                </div>
        <div className="max-w-7xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Discover Amazing Products & Shops
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-6">
            Explore a wide range of high-quality products and connect with verified shops tailored to your needs.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/30 dark:bg-gray-950 text-white dark:text-indigo-400 font-semibold rounded-full shadow-md  dark:hover:bg-gray-800 transition-all duration-300 transform hover:-translate-y-1"
          >
            <FiShoppingBag className="text-xl" /> Start Shopping
          </button>
        </div>
        {/* <div className="absolute mr-2 bottom-0 left-1/2 transform -translate-x-1/2 animate-bounce">
          <FiChevronsDown className="text-3xl text-white" />
        </div> */}
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
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition pr-10"
                value={search}
                onChange={(e) => debouncedSetSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    debouncedSetSearch("");
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <FiX />
                </button>
              )}
            </div>
            <div className="relative flex-1 min-w-[150px]">
              <input
                type="number"
                placeholder="Min Price"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition pr-10"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              {minPrice && (
                <button
                  onClick={() => setMinPrice("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <FiX />
                </button>
              )}
            </div>
            <div className="relative flex-1 min-w-[150px]">
              <input
                type="number"
                placeholder="Max Price"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition pr-10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
              {maxPrice && (
                <button
                  onClick={() => setMaxPrice("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <FiX />
                </button>
              )}
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
                  className={`ml-2 h-5 w-5 transform transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="absolute mt-2 w-full rounded-xl shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search categories..."
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                    />
                  </div>
                  <ul className="py-2">
                    <li>
                      <button
                        onClick={() => fetchProductsByCategory("")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 rounded"
                      >
                        All Categories
                      </button>
                    </li>
                    {filteredCategories.map((category) => (
                      <li key={category.id}>
                        <button
                          onClick={() => fetchProductsByCategory(category.id)}
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
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 animate-pulse">
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-t-2xl"></div>
                <div className="p-4 space-y-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center text-lg">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {paginatedProducts.map((product) => {
              const { class: stockClass, label: stockLabel } = stockStatus(product.stock);
              return (
                <Link
                  key={product.id}
                  to={`/device/${product.id}`}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col"
                >
                  <div className="relative w-full h-48">
                    {!imageLoading[product.id] ? null : (
                      <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700 rounded-t-2xl" />
                    )}
                    <img
                      src={product.imageUrl || "https://via.placeholder.com/400x250"}
                      alt={product.name}
                      loading="lazy"
                      className={`w-full h-48 object-cover rounded-t-2xl transition-opacity duration-500 ${
                        imageLoading[product.id] ? "opacity-0" : "opacity-100"
                      }`}
                      onLoad={() => setImageLoading((prev) => ({ ...prev, [product.id]: false }))}
                    />
                    <span className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full ${stockClass}`}>
                      {stockLabel}
                    </span>
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
                    <div className="flex gap-2 mt-auto">
                      {product.stock > 0 ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(product);
                          }}
                          className="flex-1 px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                          <FiShoppingCart /> Add to Cart
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 px-4 py-2 bg-orange-600 dark:bg-orange-700 text-white font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <FiXSquare /> Out of Stock
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        <div className="flex justify-center gap-4 mb-12">
          <button
            disabled={productPage === 1 || productsLoading}
            onClick={() => setProductPage((p) => p - 1)}
            className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
          >
            <FiChevronLeft className="text-lg" />
          </button>
          <button
            disabled={productPage * itemsPerPage >= filteredProducts.length || productsLoading}
            onClick={() => setProductPage((p) => p + 1)}
            className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
          >
            <FiChevronRight className="text-lg" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:border-grat-700 dark:bg-black/30 text-white rounded-2xl p-8 shadow-lg flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h3 className="text-2xl font-bold mb-2">Find Your Perfect Shop</h3>
            <p className="text-base">Browse verified shops and discover exclusive deals tailored for you!</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-8 flex items-center gap-2 animate-fade-in">
          <FiCheckCircle className="text-2xl" /> Verified Shops
        </h2>
        {shopsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedShops.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center text-lg">No shops found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {paginatedShops.map((shop) => (
              <div
                key={shop.id}
                className="rounded-2xl p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
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
                    <FiPhone className="text-indigo-500" /> 0{shop.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <FiTag className="text-indigo-500" /> {shop.shopType}
                  </p>
                  {shop.shopAddress  ?  (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 rounded">
                      <FiMapPin className="text-indigo-500" /> {shop.shopAddress.street}, {shop.shopAddress.city}, {shop.shopAddress.state}
                    </div>
                  ) :  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 rounded">
                      <FiMapPin className="text-indigo-500" /> No Address
                    </div>}
                  <p className="flex items-center gap-2">
                    <span className={shop.activate ? "text-green-500" : "text-red-500"}>{shop.activate ? "🟢" : "🔴"}</span> Active: {shop.activate ? "Yes" : "No"}
                  </p>
                </div>
                {shop.verified ? (
                  <button
                    onClick={() => navigate(`/shops/${shop.id}`)}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md"
                  >
                    Visit Shop
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-2 bg-gray-400 text-white rounded-xl font-semibold cursor-not-allowed"
                  >
                    Visit Shop
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-center gap-4 mb-12">
          <button
            disabled={shopPage === 1 || shopsLoading}
            onClick={() => setShopPage((p) => p - 1)}
            className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
          >
            <FiChevronLeft className="text-lg" />
          </button>
          <button
            disabled={shopPage * itemsPerPage >= shops.length || shopsLoading}
            onClick={() => setShopPage((p) => p + 1)}
            className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
          >
            <FiChevronRight className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default Explore;
