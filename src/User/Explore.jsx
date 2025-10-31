import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import {
  FiShoppingCart,
  FiTag,
  FiChevronLeft,
  FiChevronRight,
  FiShoppingBag,
  FiChevronDown,
  FiX,
  FiSmartphone,
  FiCheckCircle,
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
  const [productPage, setProductPage] = useState(1);
  const [shopPage, setShopPage] = useState(1);
  const itemsPerPage = 8;
  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setCategorySearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetchers
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    const ctrl = new AbortController();
    try {
      const res = await api.get("/api/products", {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      });
      const list = res.data.content || [];
      setProducts(list);
      const imgLoad = {};
      list.forEach((p) => (imgLoad[p.id] = true));
      setImageLoading(imgLoad);
    } catch (err) {
      if (err.name !== "AbortError") showError("Could not load products!");
    } finally {
      setProductsLoading(false);
    }
    return () => ctrl.abort();
  }, [token]);

  const fetchProductsByCategory = useCallback(async (catId) => {
    setProductsLoading(true);
    setSelectedCategory(catId);
    const ctrl = new AbortController();
    try {
      const url = catId ? `/api/products/category/${catId}` : "/api/products";
      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      });
      const list = res.data.content || [];
      setProducts(list);
      const imgLoad = {};
      list.forEach((p) => (imgLoad[p.id] = true));
      setImageLoading(imgLoad);
    } catch (err) {
      if (err.name !== "AbortError") showError("Could not load products!");
    } finally {
      setProductsLoading(false);
      setIsOpen(false);
      setCategorySearch("");
    }
    return () => ctrl.abort();
  }, [token]);

  const fetchShops = useCallback(async () => {
    setShopsLoading(true);
    const ctrl = new AbortController();
    try {
      const res = await api.get("/api/users/shops/all", {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      });
      setShops(res.data.content || []);
    } catch (err) {
      if (err.name !== "AbortError") showError("Could not load shops!");
    } finally {
      setShopsLoading(false);
    }
    return () => ctrl.abort();
  }, [token]);

  const fetchCategories = useCallback(async () => {
    const ctrl = new AbortController();
    try {
      const res = await api.get("/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      });
      setCategories(res.data.content || []);
    } catch (err) {
      if (err.name !== "AbortError") showError("Could not load categories!");
    }
    return () => ctrl.abort();
  }, [token]);

  const handleAddToCart = useCallback(
    async (product) => {
      try {
        await api.post(
          "/api/cart/items",
          {
            productId: product.id,
            quantity: 1,
            price: product.price,
            name: product.name,
            imageUrl: product.imageUrl || product.imageUrls?.[0],
          },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
        addToCart?.(product);
        showSuccess(`${product.name} added to cart!`);
      } catch (err) {
        showError("Failed to add to cart!");
      }
    },
    [addToCart, token]
  );

  const debouncedSetSearch = useCallback(debounce(setSearch, 400), []);

  // Toast helpers
  const showError = (msg) => {
    Swal.fire({
      icon: "error",
      title: "Oops!",
      text: msg,
      toast: true,
      position: "top-end",
      timer: 2000,
      showConfirmButton: false,
      customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
    });
  };

  const showSuccess = (msg) => {
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: msg,
      toast: true,
      position: "top-end",
      timer: 1500,
      showConfirmButton: false,
      customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
    });
  };

  // Initial load
  useEffect(() => {
    if (!token) {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please log in again",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      }).then(() => navigate("/login"));
      return;
    }
    Promise.all([fetchProducts(), fetchShops(), fetchCategories()]);
  }, [token, navigate, fetchProducts, fetchShops, fetchCategories]);

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchMin = !minPrice || p.price >= parseFloat(minPrice);
    const matchMax = !maxPrice || p.price <= parseFloat(maxPrice);
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

  return (
    <div className={`min-h-screen mt-10 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* HERO SECTION WITH CURVED BG + DOTS PATTERN */}
      <section className="relative overflow-hidden">
        {/* Curved Background */}
        <div
          className={`absolute inset-0 ${darkMode ? "bg-gradient-to-br from-indigo-900 via-gray-900 to-purple-900" : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"}`}
        >
          <svg
            className="absolute bottom-0 w-full h-48"
            preserveAspectRatio="none"
            viewBox="0 0 1440 320"
          >
            <path
              fill={darkMode ? "#1f2937" : "#ffffff"}
              fillOpacity="1"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>

        {/* Animated Dots Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 ${darkMode ? "bg-indigo-300" : "bg-white"} rounded-full animate-pulse`}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Floating Icons */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <FiShoppingBag className="absolute top-20 left-10 w-16 h-16 text-white animate-bounce" />
          <FiSmartphone className="absolute bottom-20 right-20 w-20 h-20 text-white animate-pulse" />
          <FiShoppingCart className="absolute top-1/3 right-1/4 w-14 h-14 text-white animate-ping" />
        </div>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white drop-shadow-lg">
            Shop Smart, Shop Easy
          </h1>
          <p className="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            Discover thousands of products from trusted shops. Filter, search, and add to cart in seconds.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })}
            className="mt-10 inline-flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            <FiShoppingBag className="text-xl" /> Explore Now
          </button>
        </div>
      </section>

      {/* FILTERS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
          <h3 className="flex items-center gap-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6">
            <FiTag className="text-2xl" /> Find Your Product
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative group">
              <input
                type="text"
                placeholder="Search anything..."
                value={search}
                onChange={(e) => debouncedSetSearch(e.target.value)}
                className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:outline-none transition pr-12 text-lg"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    debouncedSetSearch("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                >
                  <FiX className="text-xl" />
                </button>
              )}
            </div>

            {/* Price Range */}
            {["Min Price", "Max Price"].map((label, i) => {
              const value = i === 0 ? minPrice : maxPrice;
              const setter = i === 0 ? setMinPrice : setMaxPrice;
              return (
                <div key={label} className="relative group">
                  <input
                    type="number"
                    placeholder={label}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:outline-none transition pr-12 text-lg"
                  />
                  {value && (
                    <button
                      onClick={() => setter("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                    >
                      <FiX className="text-xl" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Category */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center px-5 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl border-2 border-transparent hover:border-indigo-500 transition text-lg"
              >
                {selectedCategory
                  ? categories.find((c) => c.id === selectedCategory)?.name || "Category"
                  : "All Categories"}
                <FiChevronDown className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto z-50">
                  <div className="p-3">
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      onClick={() => fetchProductsByCategory("")}
                      className="w-full text-left px-5 py-3 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
                    >
                      All Categories
                    </button>
                    {filteredCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => fetchProductsByCategory(cat.id)}
                        className="w-full text-left px-5 py-3 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="flex items-center gap-3 text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-8">
          <FiShoppingCart className="text-3xl" /> Featured Products
        </h2>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array(4)
              .fill()
              .map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-500 dark:text-gray-400">No products found. Try adjusting filters!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => {
                const loading = imageLoading[product.id];
                return (
                  <Link
                    key={product.id}
                    to={`/device/${product.id}`}
                    className="group bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="relative h-56 overflow-hidden rounded-t-3xl">
                      {loading && (
                        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      <img
                        src={product.imageUrl || "https://via.placeholder.com/400x300"}
                        alt={product.name}
                        loading="lazy"
                        className={`w-full h-full object-cover transition-opacity ${loading ? "opacity-0" : "opacity-100"}`}
                        onLoad={() => setImageLoading((prev) => ({ ...prev, [product.id]: false }))}
                        onError={() => setImageLoading((prev) => ({ ...prev, [product.id]: false }))}
                      />
                    </div>

                    <div className="p-6">
                      <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <FiTag /> {product.categoryName || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-2">
                        {product.description || "No description available"}
                      </p>

                      <div className="flex justify-between items-center mt-4">
                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                          {product.price.toFixed(2)} EGP
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            product.condition === "NEW"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          }`}
                        >
                          {product.condition || "USED"}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105"
                      >
                        <FiShoppingCart /> Add to Cart
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-4 mt-12">
              <button
                disabled={productPage === 1 || productsLoading}
                onClick={() => setProductPage((p) => p - 1)}
                className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <FiChevronLeft className="text-xl" />
              </button>
              <button
                disabled={productPage * itemsPerPage >= filteredProducts.length || productsLoading}
                onClick={() => setProductPage((p) => p + 1)}
                className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <FiChevronRight className="text-xl" />
              </button>
            </div>
          </>
        )}
      </section>

      {/* SHOPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-b from-transparent to-gray-100 dark:to-gray-900">
        <h2 className="flex items-center gap-3 text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-8">
          <RiStore2Line className="text-3xl" /> Verified Shops
        </h2>

        {shopsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3)
              .fill()
              .map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
          </div>
        ) : paginatedShops.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-16">No shops available.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedShops.map((shop) => (
                <div
                  key={shop.id}
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      <RiStore2Line /> {shop.name}
                    </h3>
                    {shop.verified && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                        <FiCheckCircle /> Verified
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm italic mb-4 line-clamp-2">
                    {shop.description || "No description"}
                  </p>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p className="flex items-center gap-2">
                      <FiSmartphone /> {shop.phone ? `0${shop.phone}` : "—"}
                    </p>
                    <p className="flex items-center gap-2">
                      <FiTag /> {shop.shopType || "General"}
                    </p>
                    {shop.shopAddress ? (
                      <p className="flex items-center gap-2 text-xs">
                        <FiSmartphone /> {shop.shopAddress.city}
                      </p>
                    ) : null}
                  </div>

                  <button
                    onClick={() => navigate(`/shops/${shop.id}`)}
                    disabled={!shop.verified}
                    className={`mt-5 w-full py-3 rounded-2xl font-bold transition-all ${
                      shop.verified
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-gray-400 text-white cursor-not-allowed"
                    }`}
                  >
                    Visit Shop
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 mt-12">
              <button
                disabled={shopPage === 1 || shopsLoading}
                onClick={() => setShopPage((p) => p - 1)}
                className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <FiChevronLeft className="text-xl" />
              </button>
              <button
                disabled={shopPage * itemsPerPage >= shops.length || shopsLoading}
                onClick={() => setShopPage((p) => p + 1)}
                className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <FiChevronRight className="text-xl" />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
});

export default Explore;