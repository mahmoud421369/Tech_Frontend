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
      className={`group p-5 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
        darkMode
          ? 'bg-gray-800/40 border border-gray-700/50'
          : 'bg-white/40 border border-gray-200/50'
      }`}
    >
      <div className="relative">
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-xl">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={product.image || '/placeholder.png'}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-48 object-cover rounded-xl transition-opacity duration-300 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {product.discount && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{product.discount}%
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
          {product.brand}
        </p>

        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
          {product.description || 'No description available.'}
        </p>

        <div className="flex flex-wrap gap-2 text-xs">
          <span
            className={`px-2 py-1 rounded-full font-medium ${
              product.condition === 'New'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : product.condition === 'Used'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
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
                  EGP{' '}
                  {(product.price * (1 - product.discount / 100)).toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  EGP {product.price}
                </span>
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
});
ProductCard.displayName = 'ProductCard';

// ---------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------
const Products = ({ darkMode }) => {
  // -----------------------------------------------------------------
  // State
  // -----------------------------------------------------------------
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 50000]); // [min, max]
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const sliderRef = useRef(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const pageSize = 12;

  // -----------------------------------------------------------------
  // AbortController for every fetch
  // -----------------------------------------------------------------
  const abortCtrlRef = useRef(new AbortController());

  // -----------------------------------------------------------------
  // API – ONE CALL per real change
  // -----------------------------------------------------------------
  const fetchProducts = useCallback(
    async (category) => {
      abortCtrlRef.current.abort(); // cancel previous
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

  // Debounced search – only fires after user stops typing
  const debouncedSearch = useMemo(
    () =>
      debounce((term) => {
        // search is client‑side, no extra request
      }, 300),
    []
  );

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    debouncedSearch(val);
  };

  // -----------------------------------------------------------------
  // Load categories (once)
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
  // Fetch products when category changes
  // -----------------------------------------------------------------
  useEffect(() => {
    fetchProducts(selectedCategory);
    setCurrentPage(1);
  }, [selectedCategory, fetchProducts]);

  // -----------------------------------------------------------------
  // Add to cart (no extra fetch)
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
  // Latest 8 products (memoized)
  // -----------------------------------------------------------------
  const latestProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);
  }, [products]);

  // -----------------------------------------------------------------
  // Client‑side filtering (search + price + category already applied)
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
  // Slider helpers
  // -----------------------------------------------------------------
  const scrollSlider = (dir) => {
    if (!sliderRef.current) return;
    const amount = 300;
    sliderRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const getActiveSlide = () => {
    if (!sliderRef.current) return 0;
    const scroll = sliderRef.current.scrollLeft;
    return Math.round(scroll / 300);
  };

  // -----------------------------------------------------------------
  // Clear filters
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
    <div
      className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-16`}
    >
      {/* ────── Hero ────── */}
      <section className="relative overflow-hidden pb-20">
        <div
          className={`h-64 ${
            darkMode
              ? 'bg-gradient-to-br from-indigo-900 via-gray-900 to-purple-900'
              : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
          }`}
        >
          {/* floating devices – unchanged */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="/devices/laptop.png"
              alt=""
              className="absolute top-10 left-20 w-32 animate-float"
            />
            <img
              src="/devices/phone.png"
              alt=""
              className="absolute bottom-20 right-20 w-24 animate-float animation-delay-1000"
            />
            <img
              src="/devices/tablet.png"
              alt=""
              className="absolute top-20 right-40 w-28 animate-float animation-delay-500"
            />
            <img
              src="/devices/accessory.png"
              alt=""
              className="absolute bottom-10 left-40 w-20 animate-float animation-delay-1500"
            />
          </div>

          <svg
            className="absolute bottom-0 w-full h-48"
            preserveAspectRatio="none"
            viewBox="0 0 1440 320"
          >
            <path
              fill={darkMode ? '#111827' : '#ffffff'}
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L0,320Z"
            />
          </svg>

          <div className="relative max-w-7xl mx-auto px-6 pt-20 text-center">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white drop-shadow-lg">
              Products
            </h1>
            <p className="mt-4 text-xl text-white/90">
              Shop the latest devices and accessories
            </p>
          </div>
        </div>
      </section>

      {/* ────── FILTER PANEL (ENHANCED) ────── */}
      <div className="max-w-7xl mx-auto px-6 py-8 -mt-16 relative z-10">
        <div
          className={`bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl shadow-2xl border ${
            darkMode
              ? 'border-gray-700/50'
              : 'border-gray-200/50'
          } p-4 transition-all duration-300`}
        >
          {/* Toggle button */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="w-full flex items-center justify-between text-lg font-semibold text-gray-800 dark:text-gray-100"
          >
            Filters
            <FiChevronDown
              className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Collapsible content */}
          {showFilters && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(true)} // keep open
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-300 dark:border-gray-600 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {selectedCategory}
                  <FiChevronDown className="ml-2" />
                </button>
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-300 dark:border-gray-600 max-h-60 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full px-3 py-2 border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none text-sm"
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
                        className="w-full px-3 py-2 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900 text-sm capitalize"
                      >
                        {cat}
                      </button>
                    ))}
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
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
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider-thumb"
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
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>

              {/* Clear */}
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
              >
                <FiX />
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ────── Latest Products Slider ────── */}
      {!isLoading && latestProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Latest Arrivals
          </h2>

          <div className="relative">
            <div
              ref={sliderRef}
              className="flex overflow-x-auto gap-6 snap-x snap-mandatory scroll-smooth hide-scrollbar"
            >
              {latestProducts.map((p) => (
                <div
                  key={p.id}
                  className="snap-start flex-shrink-0 w-72"
                >
                  <ProductCard
                    product={p}
                    darkMode={darkMode}
                    onAddToCart={handleAddToCart}
                  />
                </div>
              ))}
            </div>

            {/* navigation arrows */}
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

            {/* dots */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from(
                { length: Math.max(1, latestProducts.length - 3) },
                (_, i) => {
                  const active = getActiveSlide() === i;
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        sliderRef.current?.scrollTo({
                          left: i * 300,
                          behavior: 'smooth',
                        })
                      }
                      className={`transition-all duration-300 rounded-full ${
                        active
                          ? 'w-10 h-3 bg-indigo-600'
                          : 'w-3 h-3 bg-gray-400 dark:bg-gray-600 hover:bg-indigo-400'
                      }`}
                    />
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────── Main Grid ────── */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <FiShoppingCart className="mx-auto text-6xl text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-400">
              No products found.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  darkMode={darkMode}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-10 gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
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
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;