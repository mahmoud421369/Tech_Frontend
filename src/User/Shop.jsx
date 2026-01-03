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
  FiMessageCircle,
  FiPlus,
  FiMapPin,
  FiPhone,
  FiShield,
  FiTruck,
  FiClock,
  FiCheckCircle,
  FiChevronDown,
  FiZap,
} from "react-icons/fi";
import Swal from "sweetalert2";
import { debounce } from "lodash";
import api from "../api";

const ChatModal = lazy(() => import("../components/UserChatModal"));

const Shop = memo(({ darkMode, addToCart }) => {
  const { shopId } = useParams();
  const token = localStorage.getItem("authToken");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

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
  const [isOpen, setIsOpen] = useState(false);
  const [openChat, setOpenChat] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    document.title = shop?.name ? `${shop.name} | TechRestore` : "Loading Shop...";
  }, [shop?.name]);

  const debouncedSetSearch = useCallback(debounce((value) => setSearch(value), 300), []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchShopProfile = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, shop: true }));
    try {
      const { data } = await api.get(`/api/shops/${shopId}`);
      setShop(data);
    } catch (err) {
      console.error(err);
      setShop(null);
    } finally {
      setIsLoading((prev) => ({ ...prev, shop: false }));
    }
  }, [shopId]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/api/categories");
      setCategories(data.content || data || []);
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchProductsByShop = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, products: true }));
    try {
      const { data } = await api.get(`/api/products/shop/${shopId}`);
      const list = data.content || data || [];
      setProducts(list);
      setImageLoadStatus(list.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}));
    } catch {
      setProducts([]);
    } finally {
      setIsLoading((prev) => ({ ...prev, products: false }));
    }
  }, [shopId]);

  const fetchProductsByCategory = useCallback(async (categoryId) => {
    if (categoryId === "all") return fetchProductsByShop();
    setIsLoading((prev) => ({ ...prev, products: true }));
    try {
      const { data } = await api.get(`/api/products/${shopId}/${categoryId}`);
      const list = data?.content || data || [];
      setProducts(list);
      setImageLoadStatus(list.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}));
    } catch {
      setProducts([]);
    } finally {
      setIsLoading((prev) => ({ ...prev, products: false }));
    }
  }, [shopId, fetchProductsByShop]);

  const handleCategoryChange = useCallback((categoryId) => {
    if (categoryId === selectedCategory) return;
    setSelectedCategory(categoryId);
    fetchProductsByCategory(categoryId);
  }, [selectedCategory, fetchProductsByCategory]);

  const fetchShopReviews = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, reviews: true }));
    try {
      const { data } = await api.get(`/api/reviews/${shopId}/reviews`);
      setReviews(data.content || data || []);
    } catch {
      setReviews([]);
    } finally {
      setIsLoading((prev) => ({ ...prev, reviews: false }));
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
        if (result.isConfirmed) navigate("/login");
      });
      return;
    }

    try {
      await api.post("/api/cart/items", {
        productId: product.id,
        quantity: 1,
        price: product.price,
        name: product.name,
        imageUrl: product.imageUrl,
      });

      addToCart?.({ ...product, quantity: 1 });

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Added to cart!",
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to add to cart",
      });
    }
  }, [addToCart, token, navigate]);

  const submitReview = async () => {
    if (!newReview.comment?.trim() || newReview.rating === 0) {
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
    if (!editingReview?.comment?.trim() || editingReview.rating === 0) return;
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
    setImageLoadStatus((prev) => ({ ...prev, [id]: true }));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  useEffect(() => {
    if (shopId) {
      fetchShopProfile();
      fetchCategories();
      fetchProductsByShop();
      fetchShopReviews();
    }
  }, [shopId, fetchShopProfile, fetchCategories, fetchProductsByShop, fetchShopReviews]);

  if (isLoading.shop) {
    return (
      <>
        <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} pt-16 flex items-center justify-center`}>
          <div className="w-16 h-16 border-4 border-lime-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-white via-lime-50 to-gray-100"} pt-16`}>
        <section className={`relative overflow-hidden py-16 md:py-24 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-lime-600 to-emerald-600 bg-clip-text text-transparent">
                  {shop?.name || "Shop Name"}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  {shop?.description || "Quality products with excellent service."}
                </p>
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                    <div className="text-4xl font-bold text-lime-600 dark:text-lime-400 flex items-center justify-center gap-2">
                      <FiZap /> 98.9%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Customer satisfaction</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 shadow-xl text-center">
                    <div className="text-4xl font-bold text-lime-600 dark:text-lime-400 flex items-center justify-center gap-2">
                      <FiTruck /> 24h
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Avg delivery time</p>
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
                          <FiCheckCircle className="text-white text-lg" />
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
                        <FiShield className="text-white text-2xl" />
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

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className={`rounded-3xl shadow-2xl p-6 backdrop-blur-md ${darkMode ? "bg-gray-800/80 border border-gray-700" : "bg-white/90 border border-gray-200"}`}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  onChange={(e) => debouncedSetSearch(e.target.value)}
                  placeholder="Search products..."
                  className={`w-full pl-12 pr-4 py-3.5 rounded-xl border ${darkMode ? "bg-gray-700/50 border-gray-600 text-white" : "bg-gray-50 border-gray-300"} focus:outline-none focus:ring-2 focus:ring-lime-500 transition`}
                />
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className={`w-full md:w-56 px-5 py-3.5 rounded-xl border flex items-center justify-between ${darkMode ? "bg-gray-700/50 border-gray-600 text-white" : "bg-gray-50 border-gray-300"} focus:outline-none focus:ring-2 focus:ring-lime-500 transition`}
                >
                  <span className="truncate">
                    {selectedCategory === "all" ? "All Categories" : categories.find(c => c.id === selectedCategory)?.name || "Category"}
                  </span>
                  <FiChevronDown className={`ml-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && categories.length > 0 && (
                  <div className="absolute z-30 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-300 dark:border-gray-600 max-h-64 overflow-y-auto">
                    <button onClick={() => { handleCategoryChange("all"); setIsOpen(false); }} className="w-full px-4 py-3 text-left hover:bg-lime-50 dark:hover:bg-lime-900/30 font-medium">
                      All Products
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { handleCategoryChange(cat.id); setIsOpen(false); }}
                        className="w-full px-4 py-3 text-left hover:bg-lime-50 dark:hover:bg-lime-900/30 capitalize"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: FiShield, title: "Verified Shop", desc: "100% Authentic" },
              { icon: FiTruck, title: "Fast Delivery", desc: "Same-day available" },
              { icon: FiClock, title: "Warranty", desc: "Up to 1 year" },
              { icon: FiCheckCircle, title: "Easy Returns", desc: "30-day policy" },
            ].map((feature, i) => (
              <div
                key={i}
                className={`group p-6 rounded-2xl text-center backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-2xl ${darkMode ? "bg-gray-800/70 border border-gray-700" : "bg-white/80 border border-gray-200"}`}
              >
                <div className="relative inline-block mb-4">
                  <feature.icon className={`w-12 h-12 mx-auto transition-transform duration-500 group-hover:scale-110 ${darkMode ? "text-lime-400" : "text-lime-600"}`} />
                </div>
                <h4 className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-800"}`}>{feature.title}</h4>
                <p className="text-sm text-gray-500 mt-2">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-6 pb-16">
          {isLoading.products ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg animate-pulse">
                  <div className="h-64 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
                <div key={p.id} className="group">
                  <div className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                    <Link to={`/device/${p.id}`}>
                      <div className="relative h-64 bg-gray-100 dark:bg-gray-700 overflow-hidden">
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
                          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoadStatus[p.id] ? "opacity-100" : "opacity-0"}`}
                        />
                      </div>
                    </Link>
                    <div className="p-6">
                      <Link to={`/device/${p.id}`}>
                        <h3 className={`font-bold text-lg line-clamp-2 ${darkMode ? "text-white group-hover:text-lime-400" : "text-gray-900 group-hover:text-lime-600"} transition-colors`}>
                          {p.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mt-4">
                        <span className={`text-2xl font-extrabold ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
                          EGP {p.price?.toLocaleString()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(p);
                          }}
                          className="px-5 py-3 bg-lime-600 text-white rounded-xl font-medium hover:bg-lime-700 transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
                        >
                          <FiPlus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32">
              <p className="text-2xl text-gray-500">No products found.</p>
            </div>
          )}
        </section>

        <section className={`max-w-7xl mx-auto px-6 py-16 ${darkMode ? "bg-gray-800/50" : "bg-gray-50/80"} rounded-3xl`}>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className={`text-3xl font-bold mb-10 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
                Customer Reviews ({reviews.length})
              </h2>

              <div className={`mb-12 p-8 rounded-2xl shadow-xl ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                <h3 className="text-xl font-semibold mb-6">Write a Review</h3>
                <div className="flex gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => { setUserRating(star); setNewReview(prev => ({ ...prev, rating: star })); }}>
                      <FiStar className={`w-9 h-9 transition-all ${userRating >= star ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your experience..."
                  className={`w-full p-5 rounded-xl border-2 ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300"} focus:border-lime-500 transition resize-none`}
                  rows={4}
                />
                <button
                  onClick={submitReview}
                  disabled={!newReview.comment?.trim() || newReview.rating === 0}
                  className={`mt-6 px-8 py-3 rounded-xl font-semibold transition-all ${newReview.comment?.trim() && newReview.rating > 0 ? "bg-lime-600 text-white hover:bg-lime-700" : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"}`}
                >
                  Submit Review
                </button>
              </div>

              <div className="space-y-6">
                {reviews.length > 0 ? reviews.map((r) => (
                  <div key={r.id} className={`p-6 rounded-2xl shadow-md ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-lime-600 flex items-center justify-center text-white font-bold">
                          {r.userName?.[0]?.toUpperCase() || "A"}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <FiStar key={i} className={`w-5 h-5 ${i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}`} />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className={darkMode ? "text-gray-300" : "text-gray-700"}>{r.comment}</p>
                          <p className={`mt-3 font-medium ${darkMode ? "text-lime-400" : "text-lime-600"}`}>- {r.userName}</p>
                        </div>
                      </div>
                      {r.userId === userId && (
                        <div className="flex gap-3">
                          <button onClick={() => setEditingReview(r)} className="text-blue-600"><FiEdit3 /></button>
                          <button onClick={() => deleteReview(r.id)} className="text-red-600"><FiTrash2 /></button>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-12">No reviews yet. Be the first!</p>
                )}
              </div>
            </div>

            <div className="flex justify-center items-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 bg-gradient-to-br from-lime-100 to-emerald-100 dark:from-lime-900/30 dark:to-emerald-900/30 rounded-3xl transform rotate-y-20 rotate-x-10 border border-lime-300 dark:border-lime-700">
                  <div className="p-12 h-full flex flex-col justify-center items-center text-center">
                    <FiStar className="w-24 h-24 text-yellow-500 mb-6" />
                    <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">Loved by Customers</p>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Real reviews from real people</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <button
          onClick={() => setOpenChat(true)}
          className="fixed bottom-8 right-8 bg-lime-600 text-white p-5 rounded-full shadow-2xl hover:bg-lime-700 transition-all duration-300 hover:scale-110 z-50"
        >
          <FiMessageCircle className="text-3xl" />
        </button>

        {editingReview && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-xl p-8 rounded-3xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-2xl`}>
              <h3 className="text-2xl font-bold mb-6">Edit Review</h3>
              <div className="flex gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setEditingReview(prev => ({ ...prev, rating: star }))}>
                    <FiStar className={`w-10 h-10 ${editingReview.rating >= star ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={editingReview.comment}
                onChange={(e) => setEditingReview(prev => ({ ...prev, comment: e.target.value }))}
                className={`w-full p-5 rounded-xl border-2 ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300"} focus:border-lime-500 transition resize-none`}
                rows={6}
              />
              <div className="mt-8 flex justify-end gap-4">
                <button onClick={() => setEditingReview(null)} className="px-6 py-3 rounded-xl bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 transition">
                  Cancel
                </button>
                <button onClick={updateReview} className="px-8 py-3 rounded-xl bg-lime-600 text-white hover:bg-lime-700 transition shadow-lg">
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={null}>
          {openChat && <ChatModal shopId={shopId} shopName={shop?.name} onClose={() => setOpenChat(false)} />}
        </Suspense>
      </div>
    </>
  );
});

export default Shop;