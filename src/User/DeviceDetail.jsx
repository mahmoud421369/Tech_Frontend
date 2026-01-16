import React, { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaShoppingCart } from 'react-icons/fa';
import {
  FiTag,
  FiStar,
  FiUsers,
  FiZap,
  FiPackage,
  FiSmartphone,
  FiMonitor,
  FiTablet,
  FiHeadphones,
  FiWatch,
  FiTool,
  FiChevronLeft as FiChevronLeftIcon,
  FiChevronRight as FiChevronRightIcon,
  FiBox,
  FiRefreshCw,
} from 'react-icons/fi';
import Swal from "sweetalert2";
import api from '../api';

const categoryIcons = {
  Smartphone: FiSmartphone,
  Laptop: FiMonitor,
  Tablet: FiTablet,
  Headphones: FiHeadphones,
  Watch: FiWatch,
  Accessories: FiTool,
  default: FiPackage,
};

const RelatedProductCard = memo(({ product, darkMode }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const Icon = categoryIcons[product.categoryName] || categoryIcons.default;

  return (
    <div
      onClick={() => window.location.href = `/device/${product.id}`}
      className={`group p-5 rounded-2xl shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-xl cursor-pointer ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
    >
      <div className="relative h-48 mb-4">
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse flex items-center justify-center">
            <Icon className="w-16 h-16 text-lime-600 dark:text-lime-400 opacity-50" />
          </div>
        )}
        <img
          src={product.imageUrl || '/placeholder.png'}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover rounded-xl transition-opacity ${imgLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105 transition-transform duration-500`}
        />
      </div>
      <h3 className={`font-semibold text-lg line-clamp-2 mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {product.name}
      </h3>
      <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {product.brand || product.categoryName}
      </p>
      <div className="flex items-center justify-between">
        <span className={`text-xl font-bold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
          EGP {product.price?.toLocaleString()}
        </span>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
          product.condition === 'NEW' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
        }`}>
          {product.condition}
        </span>
      </div>
    </div>
  );
});

const RelatedSection = memo(({ title, icon: Icon, products, darkMode, currentPage, setCurrentPage, totalPages }) => {
  if (products.length === 0) return null;

  return (
    <div className="mt-20">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-lime-100 dark:bg-lime-900/50 rounded-2xl">
          <Icon className="w-10 h-10 text-lime-600 dark:text-lime-400" />
        </div>
        <h2 className={`text-3xl font-bold ${darkMode ? 'text-lime-400' : 'text-lime-600'}`}>
          {title}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((p) => (
          <RelatedProductCard key={p.id} product={p} darkMode={darkMode} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-lg disabled:opacity-50 hover:bg-lime-100 dark:hover:bg-lime-900 transition"
          >
            <FiChevronLeftIcon className="w-5 h-5 text-lime-600" />
          </button>
          <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-lg disabled:opacity-50 hover:bg-lime-100 dark:hover:bg-lime-900 transition"
          >
            <FiChevronRightIcon className="w-5 h-5 text-lime-600" />
          </button>
        </div>
      )}
    </div>
  );
});

const DeviceDetail = memo(({ addToCart, darkMode }) => {
  const token = localStorage.getItem("authToken");
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [catPage, setCatPage] = useState(1);
  const [condPage, setCondPage] = useState(1);

 useEffect(()=>{
   document.title = `Product Detail | ${product?.name}`
 })

  const itemsPerPage = 8;

  const fetchProductAndAll = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, allRes] = await Promise.all([
        api.get(`/api/products/${id}`),
        api.get('/api/products'),
      ]);

      const currentProduct = prodRes.data;
      setProduct(currentProduct);

      const allList = allRes.data.content || allRes.data || [];
      setAllProducts(allList.filter(p => p.id !== currentProduct.id));
    } catch (err) {
      console.error(err);
      setProduct(null);
      Swal.fire({
        title: 'Error',
        text: 'Product not found',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 2000,
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleAddToCart = useCallback(async () => {
    try {
      await api.post("/api/cart/items", {
        productId: product.id,
        quantity: quantity,
        price: product.price,
        name: product.name,
        imageUrl: product.imageUrl || (product.imageUrls && product.imageUrls[0]),
      });

      if (addToCart) {
        addToCart({ ...product, quantity });
      }

      Swal.fire({
        icon: "success",
        title: "Added to cart!",
        toast: true,
        position: "top-end",
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to add to cart",
        toast: true,
        position: "top-end",
        timer: 2000,
      });
    }
  }, [addToCart, product, quantity]);

  const handleQuantityChange = useCallback((delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= product?.stock) {
      setQuantity(newQty);
    }
  }, [quantity, product?.stock]);

  useEffect(() => {
    fetchProductAndAll();
  }, [fetchProductAndAll]);

  if (loading) {
    return (
      <>
        <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-16`}>
          <section className={`relative overflow-hidden py-16 md:py-24 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl w-full animate-pulse"></div>
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-full animate-pulse"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-5/6 animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl">
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mx-auto w-20"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mt-3 animate-pulse mx-auto w-24"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative h-96 lg:h-[600px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-150" />
                  <div className="grid grid-cols-2 gap-8 w-full h-full relative">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse" />
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse" />
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse col-span-2" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-16`}>
          <div className="text-center space-y-6 bg-white dark:bg-gray-800 p-12 rounded-3xl shadow-2xl max-w-md">
            <h2 className="text-3xl font-bold">Product Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400">The device you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition shadow-md"
            >
              <FaChevronLeft /> Back
            </button>
          </div>
        </div>
      </>
    );
  }

  const sameCategory = allProducts.filter(p => 
    (p.categoryName === product.categoryName || p.categoryId === product.categoryId)
  );
  const sameCondition = allProducts.filter(p => p.condition === product.condition);

  const paginatedCategory = sameCategory.slice((catPage - 1) * itemsPerPage, catPage * itemsPerPage);
  const paginatedCondition = sameCondition.slice((condPage - 1) * itemsPerPage, condPage * itemsPerPage);
  const catPages = Math.ceil(sameCategory.length / itemsPerPage);
  const condPages = Math.ceil(sameCondition.length / itemsPerPage);

  const CategoryIcon = categoryIcons[product.categoryName] || FiBox;
  const ConditionIcon = product.condition === 'NEW' ? FiPackage : FiRefreshCw;

  return (
    <>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-white via-lime-50 to-gray-100'} pt-16`}>
        <section className={`relative overflow-hidden py-16 md:py-24 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent">
                  {product.name}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Premium quality device with verified condition and full warranty.
                </p>
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                    <div className="text-4xl font-bold text-lime-600 dark:text-lime-400 flex items-center justify-center gap-2">
                      <FiZap /> 99.9%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Quality checked</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                    <div className="text-4xl font-bold text-lime-600 dark:text-lime-400 flex items-center justify-center gap-2">
                      <FiUsers /> 10K+
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Happy buyers</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-500 text-4xl">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">4.9 Rating</p>
                  </div>
                </div>
              </div>
              <div className="relative h-96 lg:h-[600px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-lime-200/30 to-emerald-200/30 dark:from-lime-900/20 dark:to-emerald-900/20 rounded-full blur-3xl scale-150" />
                <div className="relative w-full h-full">
                  <div className="absolute top-10 left-10 w-48 h-64 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl rotate-12 hover:rotate-6 transition-transform duration-700 overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <CategoryIcon className="w-32 h-32 text-lime-600 dark:text-lime-400 opacity-80" />
                  </div>
                  <div className="absolute bottom-10 right-10 w-56 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl -rotate-6 hover:-rotate-3 transition-transform duration-700 overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <FiPackage className="w-40 h-40 text-lime-600 dark:text-lime-400 opacity-70" />
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-10 hover:scale-110 transition-all duration-700 overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <CategoryIcon className="w-28 h-28 text-lime-600 dark:text-lime-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-lime-600 dark:text-lime-400 font-medium mb-8 hover:underline"
          >
            <FaChevronLeft className="mr-2" /> Back
          </button>

          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 flex items-center justify-center h-96">
                  <img
                    src={product.imageUrls?.[selectedImage] || product.imageUrl}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain rounded-xl hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {product.imageUrls && product.imageUrls.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {product.imageUrls.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-4 transition-all ${
                          selectedImage === i ? 'border-lime-500' : 'border-transparent'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center space-y-8">
                <div>
                  <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-4 mb-6">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      product.stock > 10 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                      product.stock > 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                    }`}>
                      {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
                    </span>
                    <span className="px-4 py-2 rounded-full bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-400 text-sm font-medium">
                      <FiTag className="inline mr-1" /> {product.condition}
                    </span>
                  </div>
                </div>

                <div className="text-4xl font-bold text-lime-600 dark:text-lime-400">
                  EGP {product.price?.toLocaleString()}
                </div>

                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                  {product.description}
                </p>

                <div className="flex items-center gap-6">
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-xl">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="px-6 py-3 font-semibold">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="flex-1 py-4 bg-lime-600 text-white font-bold rounded-xl hover:bg-lime-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    <FaShoppingCart className="text-xl" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>

          <RelatedSection
            title={`More ${product.categoryName || 'devices'} like this`}
            icon={CategoryIcon}
            products={paginatedCategory}
            darkMode={darkMode}
            currentPage={catPage}
            setCurrentPage={setCatPage}
            totalPages={catPages}
          />

          <RelatedSection
            title={`Other ${product.condition === 'NEW' ? 'Brand New' : 'Pre-owned'} devices`}
            icon={ConditionIcon}
            products={paginatedCondition}
            darkMode={darkMode}
            currentPage={condPage}
            setCurrentPage={setCondPage}
            totalPages={condPages}
          />
        </div>
      </div>
    </>
  );
});

export default DeviceDetail;