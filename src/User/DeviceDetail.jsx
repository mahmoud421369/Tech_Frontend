
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaShoppingCart } from 'react-icons/fa';
import Swal from "sweetalert2";
import { FiTag } from 'react-icons/fi';
import api from '../api';

const DeviceDetail = ({ addToCart, darkMode }) => {
  const token = localStorage.getItem("authToken");
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);


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
          icon: "error",
          title: "Error",
          text: err.response?.data?.message || "Product not found",
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [id, token, darkMode]);

  

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
  }, [addToCart, token, quantity, darkMode]);



  const handleQuantityChange = useCallback((value) => {
    if (value >= 1 && value <= product.stock) setQuantity(value);
  }, [product?.stock]);

  

  useEffect(() => {
    Promise.all([fetchProduct()]).catch((err) =>
      console.error("Error in initial fetch:", err)
    );
  }, [fetchProduct]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-4 w-full max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mx-auto"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-10 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-6 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-20 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-12 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
          <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`w-full p-6 min-h-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-indigo-100'}`}>
        <div className="text-center space-y-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Device Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400">Sorry, we couldn't find the product you're looking for.</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
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
    <div className={`min-h-screen py-12 ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 to-indigo-100'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-semibold mb-8 hover:text-indigo-800 dark:hover:text-indigo-300 transition-all duration-200 group"
        >
          <FaChevronLeft className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" /> Back to Explore
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-10">
            <div className="space-y-4">
              <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl p-6 h-[400px] lg:h-[500px] overflow-hidden">
                <img
                  src={product.imageUrls?.[selectedImage] || product.imageUrl}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain transform transition-transform duration-300 hover:scale-105"
                />
              </div>
       
            </div>

            <div className="flex flex-col justify-center items-start space-y-6">
              <div className="flex flex-col justify-between gap-4 items-start">
                <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{product.name}</h1>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-4 py-2 font-semibold text-sm rounded-full ${stockStatus}`}>
                    {stockLabel}: {product.stock} left
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium text-sm rounded-full">
                  <FiTag className="mr-1" /> {product.condition}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{product.price?.toLocaleString()} EGP</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Including VAT and shipping</p>
              </div>

              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{product.description}</p>

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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 dark:bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
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
