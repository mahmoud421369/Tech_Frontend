import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import {
  FiCheckCircle,
  FiShoppingCart,
  FiTag,
  FiChevronLeft,
  FiChevronRight,
  FiShoppingBag,
  FiChevronDown,
  FiX,
  FiTool,
  FiSmartphone,
} from "react-icons/fi";
import { RiStore2Line } from "react-icons/ri";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import debounce from "lodash/debounce";
import api from "../api";

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
  const itemsPerPage = 8;
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
      setImageLoading(
        res.data.content.reduce(
          (acc, product) => ({ ...acc, [product.id]: true }),
          {}
        )
      );
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching products:", err.response?.data || err.message);
        Swal.fire({
          title: "Error",
          text: "Could not load products!",
          icon: "error",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
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
      setImageLoading(
        res.data.content.reduce(
          (acc, product) => ({ ...acc, [product.id]: true }),
          {}
        )
      );
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching products by category:", err.response?.data || err.message);
        Swal.fire({
          title: "Error",
          text: "Could not load products!",
          icon: "error",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
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
      if (err.name !== "AbortError") {
        console.error("Error fetching shops:", err.response?.data || err.message);
        Swal.fire({
          title: "Error",
          text: "Could not load shops!",
          icon: "error",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
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
      if (err.name !== "AbortError") {
        console.error("Error fetching categories:", err.response?.data || err.message);
        Swal.fire({
          title: "Error",
          text: "Could not load categories!",
          icon: "error",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
      }
    }
    return () => controller.abort();
  }, [token, darkMode]);

  const handleAddToCart = useCallback(
    async (product) => {
      if (product.stock === 0) {
        Swal.fire({
          title: "Error",
          text: `${product.name} is out of stock!`,
          icon: "error",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
        return;
      }
      try {
        await api.post(
          "/api/cart/items",
          {
            productId: product.id,
            quantity: 1,
            price: product.price,
            name: product.name,
            imageUrl: product.imageUrl || (product.imageUrls && product.imageUrls[0]),
          },
          {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          }
        );
        if (addToCart) {
          addToCart({ ...product });
        }
        setCartItems((prev) => [...prev, product]);
        if (product.stock <= 5) {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === product.id ? { ...p, stock: p.stock - 1 } : p
            )
          );
        }
        Swal.fire({
          title: "Success",
          text: `${product.name} added to cart!`,
          icon: "success",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
      } catch (error) {
        console.error("Error adding to cart:", error.response?.data || error.message);
        Swal.fire({
          title: "Error",
          text: "Failed to add item to cart!",
          icon: "error",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
      }
    },
    [addToCart, token, darkMode]
  );

  const debouncedSetSearch = useCallback(debounce((value) => setSearch(value), 500), []);

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
  const paginatedShops = shops.slice((shopPage - 1) * itemsPerPage, shopPage * itemsPerPage);

  const stockStatus = (stock) => {
    if (stock === 0) return { class: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400", label: "Out of Stock" };
    if (stock <= 5) return { class: "bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400", label: `Low Stock: ${stock} left` };
    return { class: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400", label: "In Stock" };
  };

  return (
    <div
      className={`mx-auto min-h-screen transition-all duration-300 mt-14 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Hero Section */}
      <section
        className={`relative py-16 sm:py-20 ${
          darkMode
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700"
            : "bg-gradient-to-br from-white via-gray-50 to-gray-100"
        } text-gray-900 dark:text-white overflow-hidden`}
      >
        {/* Floating Icons */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <FiTool className="absolute w-16 h-16 sm:w-20 sm:h-20 bottom-1/3 right-1/5 animate-float-medium text-indigo-300 dark:text-indigo-500" />
          <FiShoppingBag className="absolute w-20 h-20 sm:w-24 sm:h-24 top-1/3 right-1/4 animate-float-slow text-indigo-300 dark:text-indigo-500" />
          <FiShoppingBag className="absolute w-12 h-12 sm:w-16 sm:h-16 bottom-1/4 left-1/3 animate-float-fast text-indigo-300 dark:text-indigo-500" />
          <FiSmartphone className="absolute w-16 h-16 sm:w-20 sm:h-20 top-10 left-10 animate-float-medium text-indigo-300 dark:text-indigo-500" />
          <FiSmartphone className="absolute w-24 h-24 sm:w-28 sm:h-28 bottom-20 right-12 sm:right-20 animate-float-slow text-indigo-300 dark:text-indigo-500" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold">
            Discover Amazing Products & Shops
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-200 max-w-xl sm:max-w-2xl mx-auto">
            Explore a wide range of high-quality products and connect with verified shops tailored to your needs.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white/30 dark:bg-gray-800/30 text-gray-900 dark:text-white font-semibold rounded-full shadow-md hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50"
            aria-label="Start shopping"
          >
            <FiShoppingBag className="text-lg" /> Start Shopping
          </button>
        </div>

        {/* Inline CSS for Animations */}
        <style jsx>{`
          @keyframes float {
            0% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-15px) translateX(8px); }
            100% { transform: translateY(0) translateX(0); }
          }
          @keyframes float-slow {
            0% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-10px) translateX(-8px); }
            100% { transform: translateY(0) translateX(0); }
          }
          @keyframes float-medium {
            0% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-12px) translateX(5px); }
            100% { transform: translateY(0) translateX(0); }
          }
          @keyframes float-fast {
            0% { transform: translateY(0) translateX(0); }
            50% { transform: translateY(-8px) translateX(10px); }
            100% { transform: translateY(0) translateX(0); }
          }
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
          .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
          .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fade-in 0.5s ease-out; }
        `}</style>
      </section>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/30 dark:bg-gray-800/30 rounded-2xl p-4 sm:p-6 shadow-lg backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
            <FiTag className="text-lg sm:text-xl" /> Filter Products
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition pr-10 text-sm sm:text-base"
                value={search}
                onChange={(e) => debouncedSetSearch(e.target.value)}
                aria-label="Search products"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    debouncedSetSearch("");
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Clear search"
                >
                  <FiX className="text-lg" />
                </button>
              )}
            </div>
            <div className="relative flex-1 min-w-0 sm:min-w-[120px]">
              <input
                type="number"
                placeholder="Min Price"
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition pr-10 text-sm sm:text-base"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                aria-label="Minimum price"
              />
              {minPrice && (
                <button
                  onClick={() => setMinPrice("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Clear minimum price"
                >
                  <FiX className="text-lg" />
                </button>
              )}
            </div>
            <div className="relative flex-1 min-w-0 sm:min-w-[120px]">
              <input
                type="number"
                placeholder="Max Price"
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition pr-10 text-sm sm:text-base"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                aria-label="Maximum price"
              />
              {maxPrice && (
                <button
                  onClick={() => setMaxPrice("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Clear maximum price"
                >
                  <FiX className="text-lg" />
                </button>
              )}
            </div>
            <div className="relative w-full z-50 sm:w-48" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between z-50 items-center px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition text-sm sm:text-base"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
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
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-sm"
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      aria-label="Search categories"
                    />
                  </div>
                  <ul className="py-1" role="listbox">
                    <li>
                      <button
                        onClick={() => fetchProductsByCategory("")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 rounded"
                        role="option"
                        aria-selected={!selectedCategory}
                      >
                        All Categories
                      </button>
                    </li>
                    {filteredCategories.map((category) => (
                      <li key={category.id}>
                        <button
                          onClick={() => fetchProductsByCategory(category.id)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-600 rounded"
                          role="option"
                          aria-selected={selectedCategory === category.id}
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

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-14">
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2 animate-fade-in">
          <FiShoppingCart className="text-lg sm:text-xl" /> Featured Products
        </h2>
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 animate-pulse">
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-t-2xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center text-base sm:text-lg">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
            {paginatedProducts.map((product) => {
              const { class: stockClass, label: stockLabel } = stockStatus(product.stock);
              const isImageLoading = imageLoading[product.id] || false;
              return (
                <Link
                  key={product.id}
                  to={`/device/${product.id}`}
                  className="bg-white/30 dark:bg-gray-800/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50"
                  aria-label={`View ${product.name}`}
                >
                  <div className="relative w-full h-48">
                    {isImageLoading && (
                      <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-700/50 flex items-center justify-center rounded-t-2xl animate-pulse">
                        <div className="w-8 h-8 border-2 border-indigo-500 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <img
                      src={product.imageUrl || "https://via.placeholder.com/400x250"}
                      alt={product.name}
                      loading="lazy"
                      className={`w-full h-48 object-cover rounded-t-2xl transition-opacity duration-300 ${
                        isImageLoading ? "opacity-0" : "opacity-100"
                      }`}
                      onLoad={() => setImageLoading((prev) => ({ ...prev, [product.id]: false }))}
                      onError={() => setImageLoading((prev) => ({ ...prev, [product.id]: false }))}
                    />
                    <span className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full ${stockClass}`}>
                      {stockLabel}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2 line-clamp-1">
                        {product.name}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-1">
                        <FiTag className="text-indigo-500" /> {product.categoryName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                        {product.description || "No description available"}
                      </p>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-indigo-600 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                        {product.price.toFixed(2)} EGP
                      </span>
                      <span
                        className={`px-2 py-1 text-xs flex items-center gap-1 rounded ${
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
                          className="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white font-semibold rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                          aria-label={`Add ${product.name} to cart`}
                        >
                          <FiShoppingCart /> Add to Cart
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 px-4 py-2 bg-gray-400 dark:bg-gray-600 text-white font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                          aria-disabled="true"
                        >
                          <FiX className="text-lg" /> Out of Stock
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
            className="px-4 py-2 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
            aria-label="Previous product page"
          >
            <FiChevronLeft className="text-lg" />
          </button>
          <button
            disabled={productPage * itemsPerPage >= filteredProducts.length || productsLoading}
            onClick={() => setProductPage((p) => p + 1)}
            className="px-4 py-2 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
            aria-label="Next product page"
          >
            <FiChevronRight className="text-lg" />
          </button>
        </div>
      </div>

      {/* Shops Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/30 dark:bg-gray-800/30 rounded-2xl p-4 sm:p-6 shadow-lg backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
            <FiShoppingBag className="text-lg sm:text-xl" /> Find Your Perfect Shop
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Browse verified shops and discover exclusive deals tailored for you!
          </p>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2 animate-fade-in">
          <FiCheckCircle className="text-lg sm:text-xl" /> Verified Shops
        </h2>
        {shopsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : paginatedShops.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center text-base sm:text-lg">No shops found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
            {paginatedShops.map((shop) => (
              <div
                key={shop.id}
                className="rounded-2xl p-4 sm:p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <RiStore2Line className="text-lg" /> {shop.name}
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
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <p className="flex items-center gap-2">
                    <FiSmartphone className="text-indigo-500" /> {shop.phone ? `0${shop.phone}` : "No phone"}
                  </p>
                  <p className="flex items-center gap-2">
                    <FiTag className="text-indigo-500" /> {shop.shopType || "General"}
                  </p>
                  {shop.shopAddress ? (
                    <p className="flex items-center gap-2">
                      <FiSmartphone className="text-indigo-500" /> {shop.shopAddress.street}, {shop.shopAddress.city}, {shop.shopAddress.state}
                    </p>
                  ) : (
                    <p className="flex items-center gap-2">
                      <FiSmartphone className="text-indigo-500" /> No Address
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <span className={shop.activate ? "text-green-500" : "text-red-500"}>
                      {shop.activate ? "🟢" : "🔴"}
                    </span>{" "}
                    Active: {shop.activate ? "Yes" : "No"}
                  </p>
                </div>
                {shop.verified ? (
                  <button
                    onClick={() => navigate(`/shops/${shop.id}`)}
                    className="w-full px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-all duration-300 transform hover:-translate-y-1"
                    aria-label={`Visit ${shop.name}`}
                  >
                    Visit Shop
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-2 bg-gray-400 dark:bg-gray-600 text-white rounded-xl font-semibold cursor-not-allowed"
                    aria-disabled="true"
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
            className="px-4 py-2 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
            aria-label="Previous shop page"
          >
            <FiChevronLeft className="text-lg" />
          </button>
          <button
            disabled={shopPage * itemsPerPage >= shops.length || shopsLoading}
            onClick={() => setShopPage((p) => p + 1)}
            className="px-4 py-2 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition-all duration-300"
            aria-label="Next shop page"
          >
            <FiChevronRight className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default Explore;