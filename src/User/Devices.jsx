// src/pages/Products.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from 'react';
import {
  FiSearch,
  FiFilter,
  FiShoppingCart,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiChevronDown,
  FiSmartphone,
  FiMonitor,
  FiTablet,
  FiHeadphones,
  FiWatch,
  FiTool,
  FiTag,
  FiDollarSign,
} from 'react-icons/fi';
import api from '../api';
import Swal from 'sweetalert2';
import debounce from 'lodash/debounce';

// ---------------------------------------------------------------------
// Memoized ProductCard – no unnecessary re‑renders
// ---------------------------------------------------------------------
const ProductCard = memo(({ product, darkMode, onAddToCart }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
    onClick={() => window.location.href = `/device/${product.id}`}
      className={`group p-6 rounded-2xl shadow-lg transition-all duration-500 transform hover:-translate-y-3 hover:shadow-2xl ${
        darkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-white border border-gray-200'
      } animate-slideIn`}
    >
      <div className="relative">
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-xl">
            <div className="w-10 h-10 border-4 border-lime-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={product.image || '/placeholder.png'}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-56 object-cover rounded-xl transition-opacity duration-300 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          } group-hover:scale-105 transition-transform duration-500`}
        />
        {product.discount && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            -{product.discount}%
          </span>
        )}
      </div>

      <div className="mt-5 space-y-3">
        <h3 className={`font-bold text-xl line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {product.name}
        </h3>
        <p className={`text-sm font-medium ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
          {product.brand}
        </p>

        <p className={`text-sm line-clamp-2 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {product.description || 'No description available.'}
        </p>

        <div className="flex flex-wrap gap-2 text-xs">
          <span
            className={`px-3 py-1.5 rounded-full font-medium ${
              product.condition === 'New'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : product.condition === 'Used'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {product.condition || 'Unknown'}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300 font-medium">
            {product.categoryName || product.category || 'Uncategorized'}
          </span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            {product.discount ? (
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
                  EGP {(product.price * (1 - product.discount / 100)).toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  EGP {product.price}
                </span>
              </div>
            ) : (
              <span className={`text-2xl font-bold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
                EGP {product.price}
              </span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product)}
            className="p-3 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition transform hover:scale-110 shadow-md"
          >
            <FiShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
});
ProductCard.displayName = 'ProductCard';

// ---------------------------------------------------------------------
// Main Component – MONOTREE STYLE
// ---------------------------------------------------------------------
const Products = ({ darkMode }) => {
  // -----------------------------------------------------------------
  // State
  // -----------------------------------------------------------------
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const sliderRef = useRef(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  const pageSize = 12;

  // -----------------------------------------------------------------
  // AbortController
  // -----------------------------------------------------------------
  const abortCtrlRef = useRef(new AbortController());

  // -----------------------------------------------------------------
  // Fetch Products
  // -----------------------------------------------------------------
  const fetchProducts = useCallback(
    async (category) => {
      abortCtrlRef.current.abort();
      abortCtrlRef.current = new AbortController();

      setIsLoading(true);
      try {
        const url =
          category === 'all'
            ? '/api/products'
            : `/api/products/category/${category}`;
        const res = await api.get(url, {
          signal: abortCtrlRef.current.signal,
        });
        setProducts(res.data.content || res.data || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // -----------------------------------------------------------------
  // Debounced Search
  // -----------------------------------------------------------------
  const debouncedSearch = useMemo(
    () => debounce((term) => {}, 300),
    []
  );

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    debouncedSearch(val);
  };

  // -----------------------------------------------------------------
  // Load Categories
  // -----------------------------------------------------------------
  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      try {
        const res = await api.get('/api/categories', {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });
        const cats = res.data.content || [];
        setCategories(['all', ...cats.map((c) => c.name || c.id)]);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setCategories(['all', 'phones', 'laptops', 'tablets', 'accessories']);
        }
      }
    };
    load();
    return () => ctrl.abort();
  }, [token]);

  // -----------------------------------------------------------------
  // Fetch on Category Change
  // -----------------------------------------------------------------
  useEffect(() => {
    fetchProducts(selectedCategory);
    setCurrentPage(1);
  }, [selectedCategory, fetchProducts]);

  // -----------------------------------------------------------------
  // Add to Cart
  // -----------------------------------------------------------------
  const handleAddToCart = useCallback(
    async (product) => {
      try {
        await api.post(
          '/api/cart/items',
          {
            productId: product.id,
            quantity: 1,
            price: product.price,
            name: product.name,
            imageUrl: product.image || '/placeholder.png',
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: 'Added!',
          text: `${product.name} added to cart`,
          icon: 'success',
          toast: true,
          position: 'top-end',
          timer: 1500,
          timerProgressBar: true,
        });
      } catch (err) {
        Swal.fire({
          title: 'Error',
          text: 'Failed to add to cart',
          icon: 'error',
          toast: true,
          position: 'top-end',
          timer: 1500,
        });
      }
    },
    [token]
  );

  // -----------------------------------------------------------------
  // Latest Products
  // -----------------------------------------------------------------
  const latestProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);
  }, [products]);

  // -----------------------------------------------------------------
  // Filtered Products
  // -----------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesPrice =
        p.price >= priceRange[0] && p.price <= priceRange[1];
      return matchesSearch && matchesPrice;
    });
  }, [products, searchTerm, priceRange]);

  // -----------------------------------------------------------------
  // Pagination
  // -----------------------------------------------------------------
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  // -----------------------------------------------------------------
  // Slider Navigation
  // -----------------------------------------------------------------
  const scrollSlider = (dir) => {
    if (!sliderRef.current) return;
    const amount = 320;
    sliderRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const getActiveSlide = () => {
    if (!sliderRef.current) return 0;
    const scroll = sliderRef.current.scrollLeft;
    return Math.round(scroll / 320);
  };

  // -----------------------------------------------------------------
  // Clear Filters
  // -----------------------------------------------------------------
  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange([0, 50000]);
    setSelectedCategory('all');
    setCurrentPage(1);
  };

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* ────── HERO – MONOTREE STYLE ────── */}
      <section className="relative overflow-hidden py-32">
        <div
          className={`absolute inset-0 ${
            darkMode
              ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700'
              : 'bg-gradient-to-br from-white via-lime-50 to-gray-100'
          }`}
        />

        {/* Wave */}
        <svg className="absolute bottom-0 w-full h-48" preserveAspectRatio="none" viewBox="0 0 1440 320" aria-hidden="true">
          <path
            fill={darkMode ? '#1f2937' : '#f3f4f6'}
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>

        {/* Floating Product Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FiSmartphone className={`absolute top-16 left-12 w-14 h-14 ${darkMode ? 'text-lime-400' : 'text-lime-600'} animate-float-slow opacity-70`} />
          <FiMonitor className={`absolute top-24 right-16 w-12 h-12 ${darkMode ? 'text-lime-500' : 'text-lime-700'} animate-float-medium opacity-60`} />
          <FiTablet className={`absolute bottom-32 left-20 w-10 h-10 ${darkMode ? 'text-gray-400' : 'text-gray-700'} animate-float-fast opacity-60`} />
          <FiHeadphones className={`absolute bottom-24 right-20 w-16 h-16 ${darkMode ? 'text-lime-400' : 'text-lime-600'} animate-float-slow opacity-70`} />
          <FiWatch className={`absolute top-1/3 left-1/4 w-11 h-11 ${darkMode ? 'text-gray-300' : 'text-gray-600'} animate-float-medium opacity-60`} />
       
          <FiTool className={`absolute top-10 right-1/3 w-10 h-10 ${darkMode ? 'text-lime-300' : 'text-lime-500'} animate-spin-slow opacity-60`} />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center z-10">
          {/* Left */}
          <div>
            <h1 className={`text-5xl sm:text-6xl font-extrabold drop-shadow-md ${darkMode ? 'text-lime-400' : 'text-lime-700'}`}>
              Shop Premium Devices
            </h1>
            <p className={`mt-6 text-xl max-w-xl ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Discover new & refurbished phones, laptops, tablets, and accessories at unbeatable prices.
            </p>

            {/* CTA */}
            {/* <div className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className={`px-5 py-3 rounded-full border ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-lime-500`}
              />
              <button className="px-6 py-3 bg-lime-600 text-white font-semibold rounded-full hover:bg-lime-700 transition shadow-lg">
                Browse Now
              </button>
            </div> */}

            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 gap-8 text-center">
              <div>
                <h3 className={`text-4xl font-bold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>1,200+</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Products in stock</p>
              </div>
              <div>
                <h3 className={`text-4xl font-bold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>4.8</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Average rating</p>
              </div>
            </div>
          </div>

          {/* Right: 3D Product Animation */}
          <div className="relative h-96 lg:h-full flex justify-center items-center">
            <div className="relative w-80 h-96 perspective-1000">
              {/* Main Phone */}
              <div
                className="absolute top-12 left-16 w-48 h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-3xl shadow-2xl transform rotate-y-12 rotate-x-6 animate-float-3d border border-gray-300 dark:border-gray-600 blur-3xl opacity-50"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="p-6 h-full flex flex-col justify-between" style={{ transform: 'translateZ(20px)' }}>
                  <div>
                    <div className="bg-gray-300 dark:bg-gray-600 h-6 rounded mb-3 w-3/4"></div>
                    <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-full mb-2"></div>
                    <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-2/3"></div>
                  </div>
                  <div className="bg-lime-500 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                    Buy Now
                  </div>
                </div>
              </div>

              {/* Tablet */}
              <div
                className="absolute bottom-10 right-10 w-56 h-44 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl transform rotate-y--15 rotate-x-8 animate-float-3d-delay border border-gray-200 dark:border-gray-700"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="p-5" style={{ transform: 'translateZ(15px)' }}>
                  <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-4/5"></div>
                </div>
              </div>

              {/* Discount Badge */}
              <div
                className="absolute top-32 left-4 w-32 h-28 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform rotate-y-20 rotate-x-10 animate-float-3d-fast border-2 border-lime-500"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="p-4 text-center" style={{ transform: 'translateZ(10px)' }}>
                  <FiTag className="text-lime-600 text-3xl mx-auto mb-1" />
                  <p className="text-sm font-bold text-lime-600">50% OFF</p>
                </div>
              </div>

              {/* Spinning Dollar */}
              <div className="absolute top-20 right-20 w-12 h-12 animate-spin-slow opacity-70">
                <FiDollarSign className="text-lime-500 text-5xl" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────── FILTER PANEL ────── */}
      <div className="max-w-7xl mx-auto px-6 py-8 -mt-20 relative z-10">
        <div
          className={`rounded-3xl shadow-2xl p-6 transition-all duration-300 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`w-full flex items-center justify-between text-lg font-semibold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}
          >
            Filters
            <FiChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-5 animate-fadeIn">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-lime-500`}
                />
              </div>

              <div className="relative">
                <button
                  className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                  } focus:outline-none focus:ring-2 focus:ring-lime-500`}
                >
                  {selectedCategory}
                  <FiChevronDown className="ml-2" />
                </button>
                <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-300 dark:border-gray-600 max-h-60 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full px-4 py-2 border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none text-sm"
                  />
                  {categories
                    .filter((c) =>
                      c.toLowerCase().includes(categorySearch.toLowerCase())
                    )
                    .map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setCategorySearch('');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-lime-50 dark:hover:bg-lime-900 text-sm capitalize"
                      >
                        {cat}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className={`flex justify-between text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span>EGP {priceRange[0]}</span>
                  <span>EGP {priceRange[1]}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="500"
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([+e.target.value, priceRange[1]])
                  }
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-lime-600"
                />
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="500"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], +e.target.value])
                  }
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-lime-600"
                />
              </div>

              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-md"
              >
                <FiX /> Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ────── LATEST ARRIVALS SLIDER ────── */}
      {!isLoading && latestProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <h2 className={`text-3xl font-bold mb-8 ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
            Latest Arrivals
          </h2>

          <div className="relative">
            <div
              ref={sliderRef}
              className="flex overflow-x-auto gap-6 snap-x snap-mandatory scroll-smooth hide-scrollbar"
            >
              {latestProducts.map((p, i) => (
                <div
                  key={p.id}
                  className="snap-start flex-shrink-0 w-80"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <ProductCard product={p} darkMode={darkMode} onAddToCart={handleAddToCart} />
                </div>
              ))}
            </div>

            <button
              onClick={() => scrollSlider('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-lime-100 dark:hover:bg-lime-900 transition z-10"
            >
              <FiChevronLeft className="w-6 h-6 text-lime-600" />
            </button>
            <button
              onClick={() => scrollSlider('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-lime-100 dark:hover:bg-lime-900 transition z-10"
            >
              <FiChevronRight className="w-6 h-6 text-lime-600" />
            </button>

            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: Math.max(1, latestProducts.length - 2) }, (_, i) => {
                const active = getActiveSlide() === i;
                return (
                  <button
                    key={i}
                    onClick={() =>
                      sliderRef.current?.scrollTo({
                        left: i * 320,
                        behavior: 'smooth',
                      })
                    }
                    className={`transition-all duration-300 rounded-full ${
                      active
                        ? 'w-10 h-3 bg-lime-600'
                        : 'w-3 h-3 bg-gray-400 dark:bg-gray-600 hover:bg-lime-400'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ────── MAIN GRID ────── */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-lime-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <FiShoppingCart className="mx-auto text-6xl text-gray-400 mb-4" />
            <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              No products found.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((p, i) => (
                <div key={p.id} style={{ animationDelay: `${i * 50}ms` }}>
                  <ProductCard product={p} darkMode={darkMode} onAddToCart={handleAddToCart} />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-12 gap-3">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    // className={`px-5 py-3 rounded-xl font-medium transition shadow-md ${
                    //   currentPage === page
                    //     ? 'bg-lime-600 text-white'
                    //     : darkMode
                    //     ? 'bg-gray-700 text-gray-300 hover:bg-lime-900'
                    //     : 'bg-white text-gray-700 hover:bg-lime-100'
                    // }`}
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