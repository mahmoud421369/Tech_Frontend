// src/pages/Products.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiSearch, FiFilter, FiShoppingCart, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../api';
import Swal from 'sweetalert2';

const ProductCard = ({ product, darkMode, onAddToCart }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={`group p-5 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
      darkMode ? 'bg-gray-800/40 border border-gray-700/50' : 'bg-white/40 border border-gray-200/50'
    }`}>
      <div className="relative">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-xl">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <img
          src={product.image || '/placeholder.png'}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-48 object-cover rounded-xl transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {product.discount && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{product.discount}%
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">{product.brand}</p>

        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
          {product.description || 'No description available.'}
        </p>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`px-2 py-1 rounded-full font-medium ${
            product.condition === 'New' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
            product.condition === 'Used' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {product.condition || 'Unknown'}
          </span>
          <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-medium">
            {product.categoryName || product.category || 'Uncategorized'}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div>
            {product.discount ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  EGP {(product.price * (1 - product.discount / 100)).toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through">EGP {product.price}</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                EGP {product.price}
              </span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product)}
            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition transform hover:scale-110"
          >
            <FiShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Products = ({ darkMode }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const sliderRef = useRef(null);
  const token = localStorage.getItem('token');

  const pageSize = 12;

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      let url = '/api/products';
      if (selectedCategory !== 'all') {
        url = `/api/products/category/${selectedCategory}`;
      }
      const res = await api.get(url);
      setProducts(res.data.content || res.data || []);
    } catch (err) {
      // Swal.fire({ title: 'Error', text: 'Failed to load products', icon: 'error', toast: true, position: 'top-end', timer: 2000 });
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  // Add to Cart
  const handleAddToCart = useCallback(async (product) => {
    try {
      await api.post(
        "/api/cart/items",
        {
          productId: product.id,
          quantity: 1,
          price: product.price,
          name: product.name,
          imageUrl: product.image || '/placeholder.png',
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      Swal.fire({ title: 'Added!', text: `${product.name} added to cart`, icon: 'success', toast: true, position: 'top-end', timer: 1500 });
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to add to cart', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [token]);

  // Fetch Categories with AbortController (CORRECTED)
  useEffect(() => {
    const controller = new AbortController();

    const loadCategories = async () => {
      try {
        const res = await api.get("/api/categories", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const apiCategories = res.data.content || [];
        setCategories(['all', ...apiCategories.map(c => c.name || c.id)]);
      } catch (err) {
        if (err.name !== "AbortError") {
          Swal.fire({
            title: 'Warning',
            text: 'Could not load categories! Using defaults.',
            icon: 'warning',
            toast: true,
            position: 'top-end',
            timer: 2000,
          });
          setCategories(['all', 'phones', 'laptops', 'tablets', 'accessories']);
        }
      }
    };

    loadCategories();

    return () => controller.abort(); // Cleanup on unmount
  }, [token]);

  // Fetch products when category changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Latest 8 products
  const latestProducts = [...products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory || p.categoryName === selectedCategory;
    const matchesPrice = (!minPrice || p.price >= Number(minPrice)) && (!maxPrice || p.price <= Number(maxPrice));
    return matchesSearch && matchesCategory && matchesPrice;
  });

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;
    const scrollAmount = 300;
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const getActiveSlideIndex = () => {
    if (!sliderRef.current) return 0;
    const scrollLeft = sliderRef.current.scrollLeft;
    const cardWidth = 300;
    return Math.round(scrollLeft / cardWidth);
  };

  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-16`}>
      {/* Hero with Floating Devices */}
      <section className="relative overflow-hidden pb-20">
        <div className={`h-64 ${darkMode ? 'bg-gradient-to-br from-indigo-900 via-gray-900 to-purple-900' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'}`}>
          <div className="absolute inset-0 pointer-events-none">
            <img src="/devices/laptop.png" alt="" className="absolute top-10 left-20 w-32 animate-float" />
            <img src="/devices/phone.png" alt="" className="absolute bottom-20 right-20 w-24 animate-float animation-delay-1000" />
            <img src="/devices/tablet.png" alt="" className="absolute top-20 right-40 w-28 animate-float animation-delay-500" />
            <img src="/devices/accessory.png" alt="" className="absolute bottom-10 left-40 w-20 animate-float animation-delay-1500" />
          </div>
          <svg className="absolute bottom-0 w-full h-48" preserveAspectRatio="none" viewBox="0 0 1440 320">
            <path fill={darkMode ? '#111827' : '#ffffff'} d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L0,320Z" />
          </svg>
          <div className="relative max-w-7xl mx-auto px-6 pt-20 text-center">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white drop-shadow-lg">All Products</h1>
            <p className="mt-4 text-xl text-white/90">Shop the latest devices and accessories</p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-8 -mt-16 relative z-10">
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="px-5 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                {selectedCategory} <FiFilter className="w-4 h-4" />
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-20 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-300 dark:border-gray-600">
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full px-4 py-2 border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none text-sm"
                  />
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setShowCategoryDropdown(false);
                          setCategorySearch('');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900 capitalize text-sm"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-28 px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <input
                type="text"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-28 px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Latest Products Slider */}
      {!isLoading && latestProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Latest Arrivals</h2>
          
          <div className="relative">
            <div
              ref={sliderRef}
              className="flex overflow-x-auto gap-6 snap-x snap-mandatory scroll-smooth hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {latestProducts.map(product => (
                <div key={product.id} className="snap-start flex-shrink-0 w-72">
                  <ProductCard product={product} darkMode={darkMode} onAddToCart={handleAddToCart} />
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollSlider('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition z-10"
            >
              <FiChevronLeft className="w-5 h-5 text-indigo-600" />
            </button>

            <button
              onClick={() => scrollSlider('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition z-10"
            >
              <FiChevronRight className="w-5 h-5 text-indigo-600" />
            </button>

            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: Math.max(1, latestProducts.length - 3) }, (_, i) => {
                const activeIndex = getActiveSlideIndex();
                return (
                  <button
                    key={i}
                    onClick={() => sliderRef.current?.scrollTo({ left: i * 300, behavior: 'smooth' })}
                    className={`transition-all duration-300 rounded-full ${
                      activeIndex === i ? 'w-10 h-3 bg-indigo-600' : 'w-3 h-3 bg-gray-400 dark:bg-gray-600 hover:bg-indigo-400'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Products Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <FiShoppingCart className="mx-auto text-6xl text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400">No products found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map(product => (
                <ProductCard key={product.id} product={product} darkMode={darkMode} onAddToCart={handleAddToCart} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-10 gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-xl font-medium transition ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;