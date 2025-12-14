import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
  memo,
  lazy,
  Suspense,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FiSearch,
  FiStar,
  FiTrash2,
  FiEdit3,
  FiSend,
  FiX,
  FiMessageCircle,
  FiCheckCircle,
  FiShoppingCart,
  FiChevronDown,
} from "react-icons/fi";
import { RiStore2Line } from "react-icons/ri";
import Swal from "sweetalert2";
import { debounce } from "lodash";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import api from "../api";
// import { Helmet } from "react-helmet-async";

const API_BASE = "http://localhost:8080";
const WS_URL = `${API_BASE}/ws`;


const ChatModal = lazy(() => import("../components/UserChatModal"));

const Shop = memo(({ darkMode, addToCart }) => {
  const { shopId } = useParams();
  const token = localStorage.getItem("authToken");
  const userEmail = localStorage.getItem("email") || "user@example.com";
  const userId = localStorage.getItem("userId");

 
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [imageLoadStatus, setImageLoadStatus] = useState({});
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [userRating, setUserRating] = useState(0);
  const [editingReview, setEditingReview] = useState(null);
  const [isLoading, setIsLoading] = useState({ shop: true, products: true, reviews: true });
  const [categorySearch, setCategorySearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [openChat, setOpenChat] = useState(false);

  const dropdownRef = useRef(null);
  const modalRef = useRef(null);
  const navigate = useNavigate();
  
  const debouncedSetSearch = useCallback(debounce((value) => setSearch(value), 300), []);


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

  
  const fetchShopProfile = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, shop: true }));
    try {
      const { data } = await api.get(`/api/shops/${shopId}`);
      setShop(data);
    } catch {
      setShop({ id: shopId, name: "TechFix Pro", description: "Professional repair & device sales.", rating: 4.8 });
    } finally {
      setIsLoading(prev => ({ ...prev, shop: false }));
    }
  }, [shopId]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/api/categories");
      setCategories(data.content || data || []);
    } catch {
      setCategories([
        { id: "1", name: "Phones" },
        { id: "2", name: "Laptops" },
        { id: "3", name: "Tablets" },
        { id: "4", name: "Accessories" },
      ]);
    }
  }, []);

  const fetchProductsByShop = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, products: true }));
    try {
      const { data } = await api.get(`/api/products/shop/${shopId}`);
      const list = data.content || data || [];
      setProducts(list);
      setImageLoadStatus(list.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}));
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(prev => ({ ...prev, products: false }));
    }
  }, [shopId]);

  const fetchProductsByCategory = useCallback(async (categoryId) => {
    if (categoryId === "all") return fetchProductsByShop();
    setIsLoading(prev => ({ ...prev, products: true }));
    try {
      const { data } = await api.get(`/api/products/${shopId}/${categoryId}`);
      const list = data?.content || data || [];
      setProducts(list);
      setImageLoadStatus(list.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}));
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(prev => ({ ...prev, products: false }));
    }
  }, [shopId, fetchProductsByShop]);

  const handleCategoryChange = useCallback((categoryId) => {
    if (categoryId === selectedCategory) return;
    setSelectedCategory(categoryId);
    fetchProductsByCategory(categoryId);
  }, [selectedCategory, fetchProductsByCategory]);

  const fetchShopReviews = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, reviews: true }));
    try {
      const { data } = await api.get(`/api/reviews/${shopId}/reviews`);
      console.log(data.content || data)
      setReviews(data.content || data || []);
    } catch {
      setReviews([]);
    } finally {
      setIsLoading(prev => ({ ...prev, reviews: false }));
    }
  }, [shopId]);
const handleAddToCart = useCallback(async (product) => {
  if (!token) {
    Swal.fire({
      title: "Login Required",
      text: "Please log in to add items to cart",
      icon: "warning",
      confirmButtonText: "Login",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/login");
      }
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
        imageUrl: product.imageUrl,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

   
    if (typeof addToCart === "function") {
      addToCart({ ...product, quantity: 1 });
    }

    Swal.fire({
      title: "Added!",
      text: `${product.name} added to cart`,
      icon: "success",
      toast: true,
      position: "top-end",
      timer: 2000,
      timerProgressBar: true,
    });
  } catch (err) {
    console.error("Cart error:", err);
    Swal.fire({
      title: "Error",
      text: err.response?.data?.message || "Failed to add to cart",
      icon: "error",
    });
  }
}, [addToCart, token, navigate]);

  
  const submitReview = async () => {
    if (!newReview.comment || newReview.rating === 0) {
      Swal.fire({ icon: "warning", title: "Incomplete", text: "Please provide rating and comment" });
      return;
    }
    try {
      await api.post(`/api/reviews/${shopId}`, newReview);
      setNewReview({ rating: 0, comment: "" });
      setUserRating(0);
      fetchShopReviews();
      Swal.fire({ icon: "success", title: "Thank you!", text: "Review submitted", timer: 2000 });
    } catch {
      Swal.fire({ icon: "error", title: "Failed", text: "Could not submit review" });
    }
  };

  const updateReview = async () => {
    if (!editingReview?.comment || editingReview.rating === 0) return;
    try {
      await api.put(`/api/reviews/${editingReview.id}`, editingReview);
      setEditingReview(null);
      fetchShopReviews();
      Swal.fire("Updated!", "Your review has been updated", "success");
    } catch {
      Swal.fire("Error", "Could not update review", "error");
    }
  };

  const deleteReview = async (reviewId) => {
    const result = await Swal.fire({
      title: "Delete Review?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete",
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/api/reviews/cancel/${reviewId}`);
        fetchShopReviews();
        Swal.fire("Deleted!", "Review removed", "success");
      } catch {
        Swal.fire("Error", "Could not delete", "error");
      }
    }
  };

  const handleImageLoad = useCallback((id) => {
    setImageLoadStatus(prev => ({ ...prev, [id]: true }));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  useEffect(() => {
    if (shopId && token) {
      fetchShopProfile();
      fetchCategories();
      fetchProductsByShop();
      fetchShopReviews();
    }
  }, [shopId, token]);

  if (isLoading.shop) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-16 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-lime-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* <Helmet>
        <title>{shop?.name || "TechFix Pro"} | Verified Repair & Sales Shop</title>
        <meta name="description" content={shop?.description || "Professional device repair and sales with warranty"} />
        <meta property="og:title" content={shop?.name} />
        <meta property="og:description" content={shop?.description} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            name: shop?.name,
            description: shop?.description,
            telephone: shop?.phone,
            address: shop?.shopAddress,
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: shop?.rating || 4.8,
              reviewCount: reviews.length,
            },
          })}
        </script>
      </Helmet> */}

      <div className={`min-h-screen transition-all duration-500 ${darkMode ? "bg-gray-900" : "bg-gray-100"} pt-10 mb-0 pb-0`}>
        
        <section className="relative py-32 overflow-hidden">
          <div className={`absolute inset-0 ${darkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" : "bg-gradient-to-br from-white via-lime-50 to-gray-100"}`} />
          <div className="absolute inset-0 pointer-events-none">
            <RiStore2Line className={`absolute top-16 left-12 w-14 h-14 ${darkMode ? "text-lime-400" : "text-lime-600"} animate-float-slow opacity-70`} />
            <FiCheckCircle className={`absolute bottom-32 right-20 w-16 h-16 ${darkMode ? "text-lime-400" : "text-lime-600"} animate-float-medium opacity-70`} />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center z-10">
            <div>
              <h1 className={`text-5xl sm:text-6xl font-extrabold ${darkMode ? "text-lime-400" : "text-lime-700"}`}>
                {shop?.name || "TechFix Pro"}
              </h1>
              <p className={`mt-6 text-xl max-w-xl ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {shop?.description || "Professional repair & device sales with warranty."}
              </p>
              <div className="mt-12 grid grid-cols-2 gap-8 text-center">
                <div>
                  <h3 className={`text-4xl font-bold ${darkMode ? "text-lime-400" : "text-lime-600"}`}>{shop?.rating || 4.8}</h3>
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Shop Rating</p>
                </div>
                <div>
                  <h3 className={`text-4xl font-bold ${darkMode ? "text-lime-400" : "text-lime-600"}`}>24h</h3>
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Avg Response</p>
                </div>
              </div>
            </div>

            <div className="relative h-96 flex justify-center items-center">
              <div className="relative w-80 h-96 perspective-1000">
                <div
                  className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-3xl transform rotate-y-12 rotate-x-6 animate-float-3d border border-gray-300 dark:border-gray-600"
                  style={{ boxShadow: "0 30px 60px -12px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)" }}
                >
                  <div className="p-8 h-full flex flex-col justify-center items-center">
                    <div className="bg-lime-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg">
                      Open Now
                    </div>
                    <p className="mt-6 text-2xl font-bold text-gray-700 dark:text-gray-300">Verified Shop</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        
        <div className="max-w-7xl mx-auto px-6 py-8 -mt-20 relative z-10">
          <div className={`rounded-3xl shadow-2xl p-6 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                <input
                  type="text"
                  onChange={(e) => debouncedSetSearch(e.target.value)}
                  placeholder="Search products..."
                  aria-label="Search products in this shop"
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"} focus:outline-none focus:ring-2 focus:ring-lime-500`}
                />
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  className={`w-full md:w-48 px-4 py-3 rounded-xl border flex items-center justify-between ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"} focus:outline-none focus:ring-2 focus:ring-lime-500`}
                >
                  {selectedCategory === "all" ? "All Categories" : categories.find(c => c.id === selectedCategory)?.name || "Category"}
                  <FiChevronDown className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div role="menu" className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-300 dark:border-gray-600 max-h-60 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full px-4 py-2 border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none text-sm"
                    />
                    <button role="menuitem" onClick={() => { handleCategoryChange("all"); setIsOpen(false); setCategorySearch(""); }} className="w-full px-4 py-2 text-left hover:bg-lime-50 dark:hover:bg-lime-900 text-sm">
                      All Products
                    </button>
                    {categories
                      .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                      .map(cat => (
                        <button key={cat.id} role="menuitem" onClick={() => { handleCategoryChange(cat.id); setIsOpen(false); setCategorySearch(""); }} className="w-full px-4 py-2 text-left hover:bg-lime-50 dark:hover:bg-lime-900 text-sm capitalize">
                          {cat.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

       
        <section className="max-w-7xl mx-auto px-6 pb-16">
          {isLoading.products ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"} animate-pulse`}>
                  <div className="h-48 bg-gray-300 dark:bg-gray-700 rounded-xl mb-4"></div>
                  <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((p, i) => (
                <div
                  key={p.id}
                  className="group animate-in fade-in slide-in-from-bottom-4 duration-700"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                    <Link to={`/device/${p.id}`} aria-label={`View ${p.name}`}>
                      <div className="relative h-56 bg-gray-100 dark:bg-gray-700">
                        {!imageLoadStatus[p.id] && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-lime-600 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        <img
                          src={p.imageUrl || "/placeholder.png"}
                          alt={p.name}
                          loading="lazy"
                          onLoad={() => handleImageLoad(p.id)}
                          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imageLoadStatus[p.id] ? "opacity-100" : "opacity-0"}`}
                        />
                        <div className="absolute bottom-3 left-3">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${p.condition === "New" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {p.condition}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="p-5 space-y-3">
                      <Link to={`/device/${p.id}`}>
                        <h3 className={`font-bold text-lg line-clamp-1 ${darkMode ? "text-white hover:text-lime-400" : "text-gray-900 hover:text-lime-600"}`}>
                          {p.name}
                        </h3>
                      </Link>
                      <p className={`text-sm font-medium ${darkMode ? "text-lime-400" : "text-lime-600"}`}>{p.categoryName}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${darkMode ? "text-lime-400" : "text-lime-600"}`}>EGP {p.price.toLocaleString()}</span>
                        <button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleAddToCart(p);
  }}
  aria-label={`Add ${p.name} to cart`}
  className="p-3 bg-lime-600 text-white rounded-xl hover:bg-lime-700 transition transform hover:scale-110 shadow-md flex items-center gap-2"
>
  <FiShoppingCart className="w-5 h-5" />
  <span className="text-sm font-medium">Add</span>
</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-xl text-gray-500">No products found.</div>
          )}
        </section>

        
        <section className="max-w-7xl mx-auto px-6 mb-4">
          <h2 className={`text-3xl font-bold mb-8 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>Customer Reviews</h2>

         
          <div className={`mb-10 p-6 rounded-2xl shadow-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>Leave a Review</h3>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => { setUserRating(star); setNewReview(prev => ({ ...prev, rating: star })); }}
                  aria-label={`Rate ${star} stars`}
                >
                  <FiStar className={`w-7 h-7 transition-all ${userRating >= star ? "text-yellow-500 fill-current scale-110" : "text-gray-400"}`} />
                </button>
              ))}
              <span className={`ml-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {userRating > 0 ? `${userRating} Star${userRating > 1 ? "s" : ""}` : "Rate your experience"}
              </span>
            </div>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience..."
              aria-label="Write your review"
              className={`w-full p-4 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-300"} focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none`}
              rows={4}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={submitReview}
                disabled={!newReview.comment || newReview.rating === 0}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                  newReview.comment && newReview.rating > 0
                    ? "bg-lime-600 text-white hover:bg-lime-700 shadow-md"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                }`}
              >
                Submit Review
              </button>
            </div>
          </div>

          
          <div className="space-y-6">
            {reviews.length > 0 ? reviews.map((r, i) => (
              <div
                key={r.id}
                className="p-6 rounded-2xl shadow-md border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-8 duration-700"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, s) => (
                          <FiStar key={s} className={`w-5 h-5 ${s < r.rating ? "text-yellow-500 fill-current" : "text-gray-400"}`} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} mb-3`}>{r.comment}</p>
                    <p className={`font-medium ${darkMode ? "text-lime-400" : "text-lime-600"}`}>— {r.userName || "Anonymous"}</p>
                  </div>
                  {r.userId === userId && (
                    <div className="flex gap-3 ml-4">
                      <button
                        onClick={() => setEditingReview(r)}
                        aria-label="Edit review"
                        className="text-blue-600 hover:text-blue-800 transition"
                      >
                        <FiEdit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteReview(r.id)}
                        aria-label="Delete review"
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-center py-10 text-lg text-gray-500">Be the first to leave a review!</p>
            )}
          </div>
        </section>

        
        <button
          onClick={() => setOpenChat(true)}
          aria-label="Open chat with shop"
          className="fixed bottom-8 right-8 bg-lime-600 text-white p-4 rounded-full shadow-2xl hover:bg-lime-700 transition-all duration-300 transform hover:scale-110 z-50"
        >
          <FiMessageCircle className="text-2xl" />
        </button>

       
        {editingReview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
            <div ref={modalRef} className={`w-full max-w-lg p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-2xl`}>
              <h3 className={`text-2xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>Edit Your Review</h3>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setEditingReview(prev => ({ ...prev, rating: star }))}
                  >
                    <FiStar className={`w-8 h-8 transition-all ${editingReview.rating >= star ? "text-yellow-500 fill-current scale-110" : "text-gray-400"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={editingReview.comment}
                onChange={(e) => setEditingReview(prev => ({ ...prev, comment: e.target.value }))}
                className={`w-full p-4 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-300"} focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none`}
                rows={5}
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setEditingReview(null)}
                  className="px-6 py-2.5 rounded-xl bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={updateReview}
                  className="px-6 py-2.5 rounded-xl bg-lime-600 text-white hover:bg-lime-700 transition shadow-md"
                >
                  Update Review
                </button>
              </div>
            </div>
          </div>
        )}

        
        <Suspense fallback={null}>
          {openChat && <ChatModal shopId={shopId} shopName={shop?.name} onClose={() => setOpenChat(false)} darkMode={darkMode} />}
        </Suspense>

        
        <style jsx>{`
          @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
          @keyframes float-medium { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
          .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
          .animate-float-medium { animation: float-medium 4s ease-in-out infinite; }
        `}</style>
      </div>
    </>
  );
});

export default Shop;