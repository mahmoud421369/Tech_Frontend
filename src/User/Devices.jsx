import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  FiSearch,
  FiFilter,
  FiShoppingCart,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiChevronDown,
  FiPackage,
  FiStar,
  FiUsers,
  FiZap,
} from 'react-icons/fi';
import api from '../api';
import Swal from 'sweetalert2';

const ProductCard = ({ product, darkMode, onAddToCart }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      onClick={() => window.location.href = `/device/${product.id}`}
      className={`group p-6 rounded-2xl shadow-lg transition-all duration-500 transform hover:-translate-y-3 hover:shadow-2xl cursor-pointer ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
    >
      <div className="relative">
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-xl">
            <div className="w-10 h-10 border-4 border-lime-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={product.imageUrl || '/placeholder.png'}
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
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="p-3 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition transform hover:scale-110 shadow-md"
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
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const sliderRef = useRef(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  const pageSize = 12;
  const abortCtrlRef = useRef(new AbortController());

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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

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

  useEffect(() => {
    fetchProducts(selectedCategory);
    setCurrentPage(1);
  }, [selectedCategory, fetchProducts]);

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

  const latestProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);
  }, [products]);

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

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);

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

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange([0, 50000]);
    setSelectedCategory('all');
    setCurrentPage(1);
  };

  return (
    <>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-white via-lime-50 to-gray-100'} pt-16`}>
        <section className={`relative overflow-hidden py-16 md:py-24 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent">
                  Shop Premium Devices
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Discover new & refurbished phones, laptops, tablets, and accessories at unbeatable prices.
                </p>
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                    <div className="text-4xl font-bold text-lime-600 dark:text-lime-400 flex items-center justify-center gap-2">
                      <FiPackage /> 1,200+
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Products in stock</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                    <div className="text-4xl font-bold text-lime-600 dark:text-lime-400 flex items-center justify-center gap-2">
                      <FiUsers /> ~50K
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Happy customers</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-500 text-4xl">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">4.9 Average rating</p>
                  </div>
                </div>
              </div>
              <div className="relative h-96 lg:h-[600px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-150" />
                <div className="relative w-full h-full">
                  <div className="absolute top-10 left-10 w-48 h-64 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl rotate-12 hover:rotate-6 transition-transform duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="h-8 bg-lime-500 rounded w-16"></div>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="w-8 h-8 bg-lime-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-10 right-10 w-56 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl -rotate-6 hover:-rotate-3 transition-transform duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="w-10 h-10 bg-lime-500 rounded-full flex items-center justify-center">
                          <FiPackage className="text-white text-lg" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                        <div className="h-3 bg-lime-500 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-10 hover:scale-110 transition-all duration-700 overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="p-4">
                      <div className="w-16 h-16 bg-lime-500 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                        <FiZap className="text-white text-2xl" />
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 py-8 -mt-20 relative z-10">
          <div className={`rounded-3xl shadow-2xl p-6 ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/90 border border-gray-200'} backdrop-blur-md`}>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`w-full flex items-center justify-between text-lg font-semibold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}
            >
              Filters
              <FiChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {showFilters && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-lime-500`}
                  />
                </div>

                <div className="relative">
                  <button
                    className={`w-full px-4 py-3 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-lime-500`}
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
                {latestProducts.map((p) => (
                  <div
                    key={p.id}
                    className="snap-start flex-shrink-0 w-80"
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
            </div>
          </div>
        )}

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
                {paginatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} darkMode={darkMode} onAddToCart={handleAddToCart} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-12 gap-3">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-5 py-3 rounded-xl font-medium transition shadow-md ${
                        currentPage === page
                          ? 'bg-lime-600 text-white'
                          : darkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-lime-900'
                          : 'bg-white text-gray-700 hover:bg-lime-100'
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
    </>
  );
};

export default Products;