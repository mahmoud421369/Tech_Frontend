import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiSearch,
  FiStar,
  FiTrash2,
  FiEdit3,
  FiSend,
  FiX,
  FiMessageCircle,
  FiTag,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiTruck,
  FiPhone,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiChevronDown,
  FiShoppingCart,
  FiHeart,
} from "react-icons/fi";
import { RiChat1Fill } from "@remixicon/react";
import { RiCarLine, RiMotorbikeLine, RiStore2Line } from "react-icons/ri";
import Swal from "sweetalert2";
import { debounce } from "lodash";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import api from "../api";

const API_BASE = "http://localhost:8080";
const WS_URL = `${API_BASE}/ws`;

const Shop = ({ darkMode, addToCart }) => {
  const { shopId } = useParams();
  const token = localStorage.getItem("authToken");
  const userEmail = localStorage.getItem("email") || "user@example.com";
  const userId = localStorage.getItem("userId") || "123";
  const sliderRef = useRef(null);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [imageLoadStatus, setImageLoadStatus] = useState({});
  const [search, setSearch] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });
  const [connected, setConnected] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [open, setOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isLoading, setIsLoading] = useState({ shop: false, products: false, reviews: false, messages: false });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categorySearch, setCategorySearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const subscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);

  const debouncedSetSearch = useCallback(debounce((value) => setSearch(value), 300), []);

  const getSlidesPerView = () => {
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  };

  const [slidesPerView, setSlidesPerView] = useState(getSlidesPerView());

  useEffect(() => {
    const handleResize = () => setSlidesPerView(getSlidesPerView());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ────── SLIDER LOGIC ──────
  const totalPages = Math.ceil(reviews.length / slidesPerView);
  const handlePrev = () => setCurrentIndex((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev === totalPages - 1 ? 0 : prev + 1));

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

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
    if (!token || !shopId) return;
    setIsLoading((prev) => ({ ...prev, shop: true }));
    try {
      const response = await api.get(`/api/shops/${shopId}`);
      setShop(response.data);
    } catch (error) {
      console.warn("Failed to load shop, using fallback");
      setShop({
        id: shopId,
        name: "TechFix Pro",
        phone: "+20 123 456 7890",
        description: "Professional repair & device sales with warranty.",
        rating: 4.8,
        shopAddress: { street: "123 Nile St", city: "Cairo", state: "Cairo" },
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, shop: false }));
    }
  }, [shopId, token]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/api/categories");
      setCategories(response.data.content || response.data || []);
    } catch (error) {
      console.warn("Categories failed, using fallback");
      setCategories([
        { id: "1", name: "Phones" },
        { id: "2", name: "Laptops" },
        { id: "3", name: "Tablets" },
        { id: "4", name: "Accessories" },
      ]);
    }
  }, []);

  const fetchProductsByShop = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, products: true }));
    try {
      const response = await api.get(`/api/products/shop/${shopId}`);
      const data = response.data.content || response.data || [];
      setProducts(data);
      setImageLoadStatus(data.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}));
    } catch (error) {
      console.warn("Products failed, using fallback");
      setProducts([
        {
          id: 1,
          name: "iPhone 14 Pro",
          price: 35999,
          categoryName: "Phones",
          condition: "New",
          imageUrl: "/devices/phone.png",
        },
        {
          id: 2,
          name: "MacBook Air M2",
          price: 48999,
          categoryName: "Laptops",
          condition: "New",
          imageUrl: "/devices/laptop.png",
        },
      ]);
    } finally {
      setIsLoading((prev) => ({ ...prev, products: false }));
    }
  }, [shopId]);

  const fetchProductsByCategory = useCallback(async (categoryId) => {
    if (!shopId || !categoryId) return;
    setIsLoading((prev) => ({ ...prev, products: true }));
    const controller = new AbortController();
    try {
      const url = `/api/products/${shopId}/${categoryId}`;
      const response = await api.get(url, { signal: controller.signal });
      const data = response?.data?.content || response?.data || [];
      setProducts(data);
      setImageLoadStatus(data.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}));
    } catch (error) {
      if (error.name !== "AbortError") {
        console.warn("Category products failed, using fallback");
        setProducts([]);
      }
    } finally {
      setIsLoading((prev) => ({ ...prev, products: false }));
    }
    return () => controller.abort();
  }, [shopId]);

  const handleCategoryChange = useCallback(async (categoryId) => {
    if (categoryId === selectedCategory) return;
    setSelectedCategory(categoryId);
    setProducts([]);
    if (categoryId === "all") {
      await fetchProductsByShop();
    } else {
      await fetchProductsByCategory(categoryId);
    }
  }, [selectedCategory, fetchProductsByShop, fetchProductsByCategory]);

  const fetchShopReviews = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, reviews: true }));
    try {
      const response = await api.get(`/api/reviews/${shopId}/reviews`);
      setReviews(response.data.content || response.data || []);
      setCurrentIndex(0);
    } catch (error) {
      console.warn("Reviews failed, using fallback");
      setReviews([
        {
          id: 1,
          rating: 5,
          comment: "Excellent service and fast repair!",
          createdAt: new Date().toISOString(),
          userName: "Ahmed M.",
        },
      ]);
    } finally {
      setIsLoading((prev) => ({ ...prev, reviews: false }));
    }
  }, [shopId]);

  const handleAddToCart = useCallback(async (product) => {
    try {
      await api.post("/api/cart/items", {
        productId: product.id,
        quantity: 1,
        price: product.price,
        name: product.name,
        imageUrl: product.imageUrl,
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (addToCart) addToCart({ ...product });
      Swal.fire({
        title: "Added!",
        text: `${product.name} added to cart`,
        icon: "success",
        toast: true,
        position: "top-end",
        timer: 1500,
        timerProgressBar: true,
      });
    } catch (error) {
      console.warn("Cart add failed");
    }
  }, [addToCart, token]);

  const addReview = useCallback(async () => {
    if (!newReview.comment || newReview.rating === 0) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Review",
        text: "Please add a comment and rating.",
        confirmButtonColor: "#84cc16",
      });
      return;
    }

    try {
      await api.post(`/api/reviews/${shopId}`, newReview);
      setNewReview({ rating: 0, comment: "" });
      setUserRating(0);
      fetchShopReviews();
      Swal.fire({
        icon: "success",
        title: "Thank You!",
        text: "Your review has been submitted.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.warn("Review failed");
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Could not submit review. Try again later.",
      });
    }
  }, [newReview, shopId, fetchShopReviews]);

  const handleImageLoad = useCallback((id) => {
    setImageLoadStatus((prev) => ({ ...prev, [id]: true }));
  }, []);

  const handleRatingClick = useCallback((rating) => {
    setUserRating(rating);
    setNewReview((prev) => ({ ...prev, rating }));
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.get("/api/users/profile");
      setUserProfile(response.data);
    } catch (error) {
      console.warn("Profile failed");
    }
  }, [token]);

  const fetchChatSessions = useCallback(async () => {
    if (!open) return;
    try {
      const response = await api.get("/api/chats/sessions");
      setSessions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.warn("Sessions failed");
      setSessions([]);
    }
  }, [open]);

  const connectWebSocket = useCallback((chatId) => {
    if (!chatId || !token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        const sub = client.subscribe(
          `/user/${userProfile?.email}/queue/chat/messages/${chatId}`,
          (msg) => {
            const body = JSON.parse(msg.body);
            setMessages((prev) => [...prev, body]);
            if (activeSession?.id !== chatId) {
              setUnreadCounts((prev) => ({
                ...prev,
                [chatId]: (prev[chatId] || 0) + 1,
              }));
            }
          }
        );
        subscriptionRef.current = sub;

        api.get(`/api/chats/${chatId}/messages`)
          .then((res) => setMessages(res.data || []))
          .catch(() => setMessages([]))
          .finally(() => setIsLoading((prev) => ({ ...prev, messages: false })));
      },
      onStompError: () => setConnected(false),
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      client.deactivate();
    };
  }, [token, userProfile, activeSession]);

  const startChat = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.post("/api/chats/start", { shopId });
      const chatId = response.data.data?.id;
      if (!chatId) throw new Error("No chat ID");
      setActiveSession({ id: chatId, shopName: shop?.name });
      connectWebSocket(chatId);
      setOpen(true);
    } catch (error) {
      console.warn("Start chat failed");
    }
  }, [shopId, token, shop, connectWebSocket]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeSession?.id || !stompClient || !connected) return;

    const msg = {
      id: Date.now(),
      sessionId: activeSession.id,
      content: input,
      senderName: userProfile?.email || "You",
      senderType: "USER",
      createdAt: new Date().toISOString(),
    };

    stompClient.publish({
      destination: "/app/chat/send",
      body: JSON.stringify({ sessionId: activeSession.id, content: input }),
    });

    setMessages((prev) => [...prev, msg]);
    setInput("");
  }, [input, activeSession, stompClient, connected, userProfile]);

  const onClose = useCallback(() => {
    setOpen(false);
    if (stompClient && subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      stompClient.deactivate();
      setStompClient(null);
      setConnected(false);
    }
  }, [stompClient]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  useEffect(() => {
    if (shopId && token) {
      fetchShopProfile();
      fetchCategories();
      fetchProductsByShop();
      fetchShopReviews();
      fetchUserProfile();
    }
  }, [shopId, token]);

  useEffect(() => { if (open) fetchChatSessions(); }, [open, fetchChatSessions]);
  useEffect(() => { if (activeSession) connectWebSocket(activeSession.id); }, [activeSession, connectWebSocket]);
  useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    return () => {
      if (stompClient && subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        stompClient.deactivate();
      }
    };
  }, [stompClient]);

  useEffect(() => {
    const maxIndex = Math.max(0, reviews.length - slidesPerView);
    setCurrentIndex(prev => Math.min(prev, maxIndex));
  }, [reviews.length, slidesPerView]);

  if (isLoading.shop) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-16 animate-pulse">
        <div className="relative bg-gradient-to-br from-white via-lime-50 to-gray-100 dark:from-gray-900 via-gray-800 to-gray-700 py-20 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-4 w-full md:w-2/3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
            <div className="h-32 w-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? "bg-gray-900" : "bg-gray-100"} pt-16`}>
      {/* ────── HERO – MONOTREE STYLE ────── */}
      <section className="relative overflow-hidden py-32">
        <div className={`absolute inset-0 ${darkMode ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" : "bg-gradient-to-br from-white via-lime-50 to-gray-100"}`} />
        <svg className="absolute bottom-0 w-full h-48" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path fill={darkMode ? "#1f2937" : "#f3f4f6"} d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L0,320Z" />
        </svg>

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <RiStore2Line className={`absolute top-16 left-12 w-14 h-14 ${darkMode ? "text-lime-400" : "text-lime-600"} animate-float-slow opacity-70`} />
          <FiPhone className={`absolute top-24 right-16 w-12 h-12 ${darkMode ? "text-lime-500" : "text-lime-700"} animate-float-medium opacity-60`} />
          <FiMapPin className={`absolute bottom-32 left-20 w-10 h-10 ${darkMode ? "text-gray-400" : "text-gray-700"} animate-float-fast opacity-60`} />
          <FiTruck className={`absolute bottom-24 right-20 w-16 h-16 ${darkMode ? "text-lime-400" : "text-lime-600"} animate-float-slow opacity-70`} />
          <FiTag className={`absolute top-1/3 left-1/4 w-11 h-11 ${darkMode ? "text-gray-300" : "text-gray-600"} animate-float-medium opacity-60`} />
          <FiClock className={`absolute bottom-16 left-1/3 w-14 h-14 ${darkMode ? "text-lime-400" : "text-lime-600"} animate-float-slow opacity-70`} />
          <FiDollarSign className={`absolute top-20 right-1/4 w-12 h-12 ${darkMode ? "text-lime-400" : "text-lime-600"} animate-spin-slow opacity-70`} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center z-10">
          <div>
            <h1 className={`text-5xl sm:text-6xl font-extrabold drop-shadow-md ${darkMode ? "text-lime-400" : "text-lime-700"}`}>
              {shop?.name || "TechFix Pro"}
            </h1>
            <p className={`mt-6 text-xl max-w-xl ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              {shop?.description || "Professional repair & device sales with warranty."}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 max-w-md">
              <input
                type="text"
                placeholder="Ask about a device..."
                className={`px-5 py-3 rounded-full border ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-lime-500`}
              />
              <button className="px-6 py-3 bg-lime-600 text-white font-semibold rounded-full hover:bg-lime-700 transition shadow-lg">
                Contact Shop
              </button>
            </div>
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

          <div className="relative h-96 lg:h-full flex justify-center items-center">
            <div className="relative w-80 h-96 perspective-1000">
              <div className="absolute top-12 left-16 w-48 h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-3xl shadow-2xl transform rotate-y-12 rotate-x-6 animate-float-3d border border-gray-300 dark:border-gray-600">
                <div className="p-6 h-full flex flex-col justify-between" style={{ transform: "translateZ(20px)" }}>
                  <div>
                    <div className="bg-gray-300 dark:bg-gray-600 h-6 rounded mb-3 w-3/4"></div>
                    <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-full mb-2"></div>
                    <div className="bg-gray-300 dark:bg-gray-600 h-4 rounded w-2/3"></div>
                  </div>
                  <div className="bg-lime-500 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                    Open Now
                  </div>
                </div>
              </div>
              <div className="absolute bottom-10 right-10 w-56 h-44 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl transform rotate-y--15 rotate-x-8 animate-float-3d-delay border border-gray-200 dark:border-gray-700">
                <div className="p-5" style={{ transform: "translateZ(15px)" }}>
                  <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-4/5"></div>
                </div>
              </div>
              <div className="absolute top-32 left-4 w-32 h-28 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform rotate-y-20 rotate-x-10 animate-float-3d-fast border-2 border-lime-500">
                <div className="p-4 text-center" style={{ transform: "translateZ(10px)" }}>
                  <FiCheckCircle className="text-lime-600 text-3xl mx-auto mb-1" />
                  <p className="text-sm font-bold text-lime-600">Verified</p>
                </div>
              </div>
              <div className="absolute top-20 right-20 w-12 h-12 animate-spin-slow opacity-70">
                <FiTruck className="text-lime-500 text-5xl" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Categories */}
      <div className="max-w-7xl mx-auto px-6 py-8 -mt-20 relative z-10">
        <div className={`rounded-3xl shadow-2xl p-6 transition-all duration-300 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                onChange={(e) => debouncedSetSearch(e.target.value)}
                placeholder="Search products..."
                className={`w-full pl-12 pr-4 py-3 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-lime-500`}
              />
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full md:w-48 px-4 py-3 rounded-xl border flex items-center justify-between ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-lime-500`}
              >
                {selectedCategory === "all" ? "All Categories" : categories.find(c => c.id === selectedCategory)?.name}
                <FiChevronDown className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-300 dark:border-gray-600 max-h-60 overflow-y-auto">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full px-4 py-2 border-b border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none text-sm"
                  />
                  <button
                    onClick={() => { handleCategoryChange("all"); setIsOpen(false); setCategorySearch(""); }}
                    className="w-full px-4 py-2 text-left hover:bg-lime-50 dark:hover:bg-lime-900 text-sm"
                  >
                    All Products
                  </button>
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { handleCategoryChange(cat.id); setIsOpen(false); setCategorySearch(""); }}
                      className="w-full px-4 py-2 text-left hover:bg-lime-50 dark:hover:bg-lime-900 text-sm capitalize"
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

      {/* ────── ENHANCED PRODUCT CARDS ────── */}
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
              <div key={p.id} className="group animate-fadeIn" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                  <Link to={`/device/${p.id}`} className="block">
                    <div className="relative h-56 bg-gray-100 dark:bg-gray-700">
                      {!imageLoadStatus[p.id] && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 border-4 border-lime-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      <img
                        src={p.imageUrl || "/placeholder.png"}
                        alt={p.name}
                        onLoad={() => handleImageLoad(p.id)}
                        className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imageLoadStatus[p.id] ? "opacity-100" : "opacity-0"}`}
                      />
                      <div className="absolute top-3 right-3">
                        <button className="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-full shadow-md hover:scale-110 transition">
                          <FiHeart className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${p.condition === "New" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"}`}>
                          {p.condition}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="p-5 space-y-3">
                    <Link to={`/device/${p.id}`}>
                      <h3 className={`font-bold text-lg line-clamp-1 transition-colors ${darkMode ? "text-white hover:text-lime-400" : "text-gray-900 hover:text-lime-600"}`}>
                        {p.name}
                      </h3>
                    </Link>
                    <p className={`text-sm font-medium ${darkMode ? "text-lime-400" : "text-lime-600"}`}>{p.categoryName}</p>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-2xl font-bold ${darkMode ? "text-lime-400" : "text-lime-600"}`}>EGP {p.price.toLocaleString()}</span>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); handleAddToCart(p); }}
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
          <div className="text-center py-20">
            <p className={`text-xl ${darkMode ? "text-gray-400" : "text-gray-600"}`}>No products found for your search.</p>
          </div>
        )}
      </section>

      {/* ────── ENHANCED REVIEW SECTION WITH RATING INPUT ────── */}
      <section className="max-w-7xl mx-auto px-6 mb-20">
        <h2 className={`text-3xl font-bold mb-8 ${darkMode ? "text-lime-400" : "text-lime-600"}`}>Customer Reviews</h2>

        {/* Review Submission Card */}
        <div className={`mb-10 p-6 rounded-2xl shadow-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <h3 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>Leave a Review</h3>
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingClick(star)}
                className={`transition-all duration-200 ${userRating >= star ? "text-yellow-500 scale-110" : "text-gray-400"}`}
              >
                <FiStar className={`w-7 h-7 ${userRating >= star ? "fill-current" : ""}`} />
              </button>
            ))}
            <span className={`ml-3 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {userRating > 0 ? `${userRating} Star${userRating > 1 ? "s" : ""}` : "Rate your experience"}
            </span>
          </div>
          <textarea
            value={newReview.comment}
            onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Share your experience with this shop..."
            className={`w-full p-4 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-300 text-gray-800"} focus:outline-none focus:ring-2 focus:ring-lime-500 transition-all resize-none`}
            rows={4}
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={addReview}
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

        {/* Reviews Slider */}
        {reviews.length > 0 ? (
          <div className="relative">
            <div className="flex overflow-x-auto gap-6 snap-x snap-mandatory scroll-smooth hide-scrollbar" ref={sliderRef}>
              {reviews.map((r, i) => (
                <div key={r.id} className="snap-start flex-shrink-0 w-80 animate-fadeIn" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={`p-6 rounded-2xl shadow-md border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, s) => (
                          <FiStar key={s} className={`w-5 h-5 ${s < r.rating ? "text-yellow-500 fill-current" : "text-gray-400"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"} mb-3`}>
                      {r.comment}
                    </p>
                    <p className={`text-sm font-medium ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
                      — {r.userName || "Anonymous"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 dark:bg-gray-800/90 p-3 rounded-full shadow-lg hover:bg-lime-100 dark:hover:bg-lime-900 transition z-10"
            >
              <FiChevronLeft className="w-6 h-6 text-lime-600" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 dark:bg-gray-800/90 p-3 rounded-full shadow-lg hover:bg-lime-100 dark:hover:bg-lime-900 transition z-10"
            >
              <FiChevronRight className="w-6 h-6 text-lime-600" />
            </button>
          </div>
        ) : (
          <p className={`text-center py-10 text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Be the first to leave a review!</p>
        )}
      </section>

      {/* CHAT BUTTON & MODAL */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 bg-lime-600 text-white p-4 rounded-full shadow-2xl hover:bg-lime-700 transition-all duration-300 transform hover:scale-110 z-50"
      >
        <FiMessageCircle className="text-2xl" />
      </button>

      {/* Chat Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className={`w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"} border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            {/* Sessions */}
            <div className="w-80 flex flex-col border-r border-gray-200 dark:border-gray-700">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className={`font-bold text-lg ${darkMode ? "text-lime-400" : "text-lime-600"}`}>Chats</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-red-500"><FiX /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sessions.length > 0 ? sessions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => setActiveSession(s)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${activeSession?.id === s.id ? "bg-lime-100 dark:bg-lime-900" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                  >
                    <div className="font-semibold">{s.shopName}</div>
                    {s.lastMessage && <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{s.lastMessage.content}</div>}
                  </div>
                )) : (
                  <p className="text-center text-gray-500">No chats yet</p>
                )}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={startChat} className="w-full bg-lime-600 text-white py-3 rounded-xl font-semibold hover:bg-lime-700 transition">
                  New Chat
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 flex flex-col">
              {activeSession ? (
                <>
                  <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className={`font-bold text-lg ${darkMode ? "text-lime-400" : "text-lime-600"}`}>Chat with {activeSession.shopName}</h3>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {messages.map(m => (
                      <div key={m.id} className={`flex ${m.senderType === "USER" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs px-4 py-3 rounded-2xl ${m.senderType === "USER" ? "bg-lime-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"}`}>
                          <p>{m.content}</p>
                          <p className="text-xs opacity-70 mt-1">{new Date(m.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message..."
                      className={`flex-1 px-4 py-3 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"} focus:outline-none focus:ring-2 focus:ring-lime-500`}
                    />
                    <button onClick={sendMessage} className="bg-lime-600 text-white p-3 rounded-xl hover:bg-lime-700 transition">
                      <FiSend />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">Select a chat to start</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Shop;