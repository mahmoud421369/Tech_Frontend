import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaShoppingCart } from 'react-icons/fa';
import { FiTag, FiStar, FiUsers, FiZap } from 'react-icons/fi';
import Swal from "sweetalert2";
import api from '../api';

const DeviceDetail = ({ addToCart, darkMode }) => {
  const token = localStorage.getItem("authToken");
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showCookieBanner, setShowCookieBanner] = useState(true);

  const fetchProduct = useCallback(async () => {
    const controller = new AbortController();
    try {
      setLoading(true);
      const response = await api.get(`/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      setProduct(response.data);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching product:", err.response?.data || err.message);
        setProduct(null);
        Swal.fire({
          title: 'Error',
          text: 'Product not found',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [id, token]);

  const handleAddToCart = useCallback(async (product) => {
    try {
      await api.post("/api/cart/items", {
        productId: product.id,
        quantity: quantity,
        price: product.price,
        name: product.name,
        imageUrl: product.imageUrl || (product.imageUrls && product.imageUrls[0]),
      }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (addToCart) {
        addToCart({ ...product, quantity });
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `${product.name} added to cart!`,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    } catch (error) {
      console.error("Error adding to cart:", error.response?.data || error.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to add item to cart",
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    }
  }, [addToCart, token, quantity]);

  const handleQuantityChange = useCallback((value) => {
    if (value >= 1 && value <= product?.stock) setQuantity(value);
  }, [product?.stock]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // === SKELETON LOADER ===
  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-16`}>
        {/* Hero Skeleton */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl w-96 animate-pulse"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-full animate-pulse"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-5/6 animate-pulse"></div>
                <div className="flex gap-3">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex-1 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-32 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-3 gap-6 pt-8">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden md:block">
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Skeleton */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 shadow-xl animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="space-y-6">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/3"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-16`}>
        <div className="text-center space-y-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Device Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400">Sorry, we couldn't find the product you're looking for.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-6 py-3 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-all shadow-md"
          >
            <FaChevronLeft className="mr-2" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  const stockStatus = product.stock > 10 ? 'text-green-600 dark:text-green-400' : product.stock > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
  const stockLabel = product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} pt-16`}>
      {/* === HERO SECTION - MONOTREE STYLE === */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Discover <span className="underline decoration-lime-500 decoration-4">your device</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
                Premium quality, certified pre-owned devices at unbeatable prices. Shop with confidence.
              </p>

              {/* CTA */}
              {/* <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="text"
                  placeholder="Search devices..."
                  className="flex-1 px-5 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-lime-500 outline-none"
                />
                <button className="px-6 py-3 bg-lime-500 text-black font-semibold rounded-xl hover:bg-lime-400 transition shadow-md">
                  Explore Now
                </button>
              </div> */}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div>
                  <div className="text-3xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                    <FiZap /> 99.9%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-lime-600 dark:text-lime-400 flex items-center gap-1">
                    <FiUsers /> 10K+
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Happy users</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => <FiStar key={i} fill="currentColor" />)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">4.9 Rating</p>
                </div>
              </div>
            </div>

            {/* Right: 3D Illustration */}
            <div className="relative hidden md:block">
              <div className="relative w-full h-96">
                <div className="absolute inset-0 bg-gradient-to-br from-lime-100 to-teal-100 dark:from-lime-900 dark:to-teal-900 rounded-3xl blur-3xl opacity-50"></div>

                <div className="absolute top-10 left-10 w-48 h-64 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl rotate-12 transform-gpu overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-8 bg-lime-500 rounded w-16"></div>
                  </div>
                </div>

                <div className="absolute bottom-10 right-10 w-56 h-72 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl -rotate-6 transform-gpu overflow-hidden">
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      <div className="w-10 h-10 bg-lime-500 rounded-full flex items-center justify-center">
                        <FaShoppingCart className="text-white text-lg" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
                  <div className="p-4">
                    <div className="w-16 h-16 bg-lime-500 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                      <img src={product.imageUrls?.[0] || product.imageUrl} alt="" className="w-12 h-12 object-contain" />
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === PRODUCT DETAIL (Mono-tree Style) === */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-lime-600 dark:text-lime-400 font-semibold mb-8 hover:text-lime-800 dark:hover:text-lime-300 transition-all group"
        >
          <FaChevronLeft className="mr-2 transform group-hover:-translate-x-1 transition-transform" /> Back to Explore
        </button>

        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-10">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl p-6 h-[400px] lg:h-[500px] overflow-hidden">
                <img
                  src={product.imageUrls?.[selectedImage] || product.imageUrl}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain rounded-xl transform transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Thumbnails */}
              {product.imageUrls && product.imageUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.imageUrls.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === i ? 'border-lime-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center space-y-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">{product.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-4 py-2 font-semibold text-sm rounded-full ${stockStatus}`}>
                    {stockLabel}: {product.stock} left
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 bg-lime-100 dark:bg-lime-900/50 text-lime-600 dark:text-lime-400 font-medium text-sm rounded-full">
                  <FiTag className="mr-1" /> {product.condition}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-3xl font-bold text-lime-600 dark:text-lime-400">{product.price?.toLocaleString()} EGP</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Including VAT and shipping</p>
              </div>

              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{product.description}</p>

              {/* Quantity & Add to Cart */}
              <div className="flex items-center flex-wrap gap-4">
                <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-gray-900 dark:text-gray-100 font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="inline-flex items-center justify-center px-8 py-4 bg-lime-600 text-white font-semibold rounded-lg hover:bg-lime-500 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  disabled={product.stock === 0}
                >
                  <FaShoppingCart className="mr-2" /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

  

    </div>
  );
};

export default DeviceDetail;