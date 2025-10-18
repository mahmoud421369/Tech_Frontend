import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { FiSearch, FiStar, FiTrash2, FiEdit3, FiSend, FiX, FiMessageCircle, FiTag, FiCheckCircle, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { RiChat1Fill } from "@remixicon/react";
import { RiStore2Line } from "react-icons/ri";
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

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
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
  const [currentIndex, setCurrentIndex] = useState(0); // For custom pagination
  const subscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);
const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSetSearch = useCallback(
    debounce((value) => setSearch(value), 300),
    []
  );

  // Calculate number of reviews per page based on screen size
  const getSlidesPerView = () => {
    if (window.innerWidth >= 1024) return 3; // Desktop
    if (window.innerWidth >= 768) return 2; // Tablet
    return 1; // Mobile
  };

  const [slidesPerView, setSlidesPerView] = useState(getSlidesPerView());

  useEffect(() => {
    const handleResize = () => setSlidesPerView(getSlidesPerView());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(reviews.length / slidesPerView);

  // Handle navigation
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };
    const [categorySearch, setCategorySearch] = useState("");
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
    if (!token) {
      setError("No auth token found. Please log in.");
      Swal.fire({
        title: 'Authentication Required',
        text: 'Please login to your account or create one!',
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
      return;
    }
    if (!shopId) {
      setError("No shop ID provided in the route.");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Invalid shop ID",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
      return;
    }
    setIsLoading((prev) => ({ ...prev, shop: true }));
    try {
      const response = await api.get(`/api/shops/${shopId}`);
      setShop(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching shop profile:", error.response?.data || error.message);
      setError("Failed to load shop profile");
      Swal.fire({
        title: 'Error',
        text: 'Could not load shop details!',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, shop: false }));
    }
  }, [shopId, token, darkMode]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/api/categories");
      setCategories(response.data.content || response.data);
    } catch (error) {
      console.error("Error fetching categories:", error.response?.data || error.message);
      setCategories([]);
      Swal.fire({
        title: 'Error',
        text: 'Could not load categories!',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
    }
  }, [darkMode]);

  const fetchProductsByShop = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, products: true }));
    try {
      const response = await api.get(`/api/products/shop/${shopId}`);
      setProducts(response.data.content || response.data);
      setImageLoadStatus(
        (response.data.content || response.data).reduce(
          (acc, product) => ({ ...acc, [product.id]: false }),
          {}
        )
      );
    } catch (error) {
      console.error("Error fetching products:", error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: 'Could not load products!',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, products: false }));
            setCategorySearch("");
    }
  }, [shopId, darkMode]);

  const fetchProductsByCategory = useCallback(
  async (categoryId) => {
    // Avoid unnecessary calls
    if (!shopId || !categoryId) return;

    // Setup loading state
    setIsLoading((prev) => ({ ...prev, products: true }));
    setError(null);

    // Create AbortController once for this call
    const controller = new AbortController();

    try {
      const url = `/api/products/${shopId}/${categoryId}`;
      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      const data = response?.data?.content || response?.data || [];

      // Update products
      setProducts(data);

      // Track image loading states
      setImageLoadStatus(
        data.reduce((acc, product) => ({ ...acc, [product.id]: false }), {})
      );
    } catch (error) {
      // Handle aborts gracefully
      if (error.name === "CanceledError" || error.name === "AbortError") return;

      console.error("Error fetching products by category:", error.response?.data || error.message);
      setError("Failed to load products");

      Swal.fire({
        title: 'Error Loading Products',
        text: error.response?.data?.message || 'Could not load products. Please try again later.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, products: false }));
    }

    // Return a cleanup function to abort ongoing requests if needed
    return () => controller.abort();
  },
  [shopId, token]
);


  const handleCategoryChange = useCallback(
  async (categoryId) => {
    // Prevent redundant fetches
    if (categoryId === selectedCategory) return;

    setSelectedCategory(categoryId);
    setProducts([]); // Optional: clear old products for smoother UX

    if (categoryId === "all") {
      await fetchProductsByShop();
    } else {
      await fetchProductsByCategory(categoryId);
    }
  },
  [selectedCategory, fetchProductsByShop, fetchProductsByCategory]
);


  const fetchShopReviews = useCallback(async () => {
    setIsLoading((prev) => ({ ...prev, reviews: true }));
    try {
      const response = await api.get(`/api/reviews/${shopId}/reviews`);
      setReviews(response.data.content || response.data);
      setCurrentIndex(0); // Reset pagination on new reviews
    } catch (error) {
      console.error("Error fetching reviews:", error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: 'Could not load reviews!',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, reviews: false }));
    }
  }, [shopId, darkMode]);

  const handleAddToCart = useCallback(async (product) => {
    try {
      await api.post("/api/cart/items", {
        productId: product.id,
        quantity: 1,
        price: product.price,
        name: product.name,
        imageUrl: product.imageUrl || (product.imageUrls && product.imageUrls[0]),
      }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (addToCart) {
        addToCart({ ...product });
      }
      Swal.fire({
        title: 'Success',
        text: `${product.name} added to cart!`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    } catch (error) {
      console.error("Error adding to cart:", error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: 'Failed to add item to cart!',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
    }
  }, [addToCart, token, darkMode]);

  const addReview = useCallback(async () => {
    if (!newReview.comment || newReview.rating === 0) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please add comment and rating",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
      return;
    }
    try {
      await api.post(`/api/reviews/${shopId}`, newReview, {
        headers: { "Content-Type": "application/json" },
      });
      Swal.fire({
        title: 'Added',
        text: 'Review added',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
      setNewReview({ rating: 0, comment: "" });
      setUserRating(0);
      fetchShopReviews();
    } catch (error) {
      console.error("Error adding review:", error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: 'Failed to add review!',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
    }
  }, [newReview, shopId, fetchShopReviews, darkMode]);

  const updateReview = useCallback(
    async (reviewId, updatedFields) => {
      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "You must be logged in to update a review",
          customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        });
        return;
      }
      try {
        await api.put(`/api/reviews/${reviewId}`, updatedFields, {
          headers: { "Content-Type": "application/json" },
        });
        Swal.fire({
          title: 'Updated',
          text: 'Review updated!',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
        });
        fetchShopReviews();
      } catch (error) {
        console.error("Update review error:", error.response?.data || error.message);
        Swal.fire({
          title: 'Error',
          text: 'Failed to update review!',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
        });
      }
    },
    [fetchShopReviews, token, darkMode]
  );

  const handleEditReview = useCallback(
    async (review) => {
      const { value: formValues } = await Swal.fire({
        title: "Edit your review",
        html: `
          <textarea id="swal-comment" class="swal2-textarea" placeholder="Update your comment">${review.comment}</textarea>
          <input id="swal-rating" type="number" min="1" max="5" class="swal2-input" placeholder="Rating (1-5)" value="${review.rating || 1}">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Update",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#d33",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
        preConfirm: () => {
          const comment = document.getElementById("swal-comment").value.trim();
          const rating = parseInt(document.getElementById("swal-rating").value, 10);
          if (!comment) {
            Swal.showValidationMessage("Comment cannot be empty!");
          } else if (isNaN(rating) || rating < 1 || rating > 5) {
            Swal.showValidationMessage("Rating must be between 1 and 5");
          }
          return { comment, rating };
        },
      });
      if (formValues) {
        updateReview(review.id, formValues);
      }
    },
    [updateReview, darkMode]
  );

  const deleteReview = useCallback(
    async (reviewId) => {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#2563eb",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
      if (result.isConfirmed) {
        try {
          await api.delete(`/api/reviews/reviews/${reviewId}`);
          Swal.fire({
            title: 'Deleted',
            text: 'Review deleted!',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
          });
          fetchShopReviews();
        } catch(error) {
          console.error("Delete review error:", error.response?.data || error.message);
          Swal.fire({
            title: 'Error',
            text: 'Failed to delete review!',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
          });
        }
      }
    },
    [fetchShopReviews, darkMode]
  );

  const handleImageLoad = useCallback((id) => {
    setImageLoadStatus((prev) => ({ ...prev, [id]: true }));
  }, []);

  const handleRatingClick = useCallback(
    (rating) => {
      setUserRating(rating);
      setNewReview((prev) => ({ ...prev, rating }));
    },
    []
  );

  const fetchUserProfile = useCallback(async () => {
    if (!token) {
      console.error("No token found, cannot fetch profile.");
      return;
    }
    try {
      const response = await api.get("/api/users/profile");
      setUserProfile(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error.response?.data || error.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to fetch user profile",
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    }
  }, [token, darkMode]);

  const fetchChatSessions = useCallback(async () => {
    if (!open) return;
    try {
      const response = await api.get("/api/chats/sessions");
      const data = response.data;
      setSessions(
        Array.isArray(data)
          ? data
          : data?.content && Array.isArray(data.content)
          ? data.content
          : data
          ? [data]
          : []
      );
    } catch (error) {
      console.error("Error fetching sessions:", error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load chats!',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
    }
  }, [open, darkMode]);

  const connectWebSocket = useCallback(
    (chatId) => {
      if (!chatId) {
        console.error("Cannot connect, chatId is undefined");
        return;
      }
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        onConnect: () => {
          console.log("Connected. Subscribing to chat:", chatId);
          setConnected(true);
          const subscription = client.subscribe(
            `/user/${userProfile?.email}/queue/chat/messages/${chatId}`,
            (msg) => {
              const body = JSON.parse(msg.body);
              console.log("Received:", body);
              setMessages((prev) => [...prev, body]);
              if (activeSession?.id !== chatId) {
                setUnreadCounts((prev) => ({
                  ...prev,
                  [chatId]: (prev[chatId] || 0) + 1,
                }));
              }
            },
            { Authorization: `Bearer ${token}` }
          );
          subscriptionRef.current = subscription;
          setIsLoading((prev) => ({ ...prev, messages: true }));
          api
            .get(`/api/chats/${chatId}/messages`)
            .then((response) => {
              setMessages(Array.isArray(response.data) ? response.data : []);
            })
            .catch((error) => {
              console.error("Error loading messages:", error.response?.data || error.message);
              Swal.fire({
                icon: "error",
                title: "Error",
                text: error.response?.data?.message || "Failed to load messages",
                customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
              });
            })
            .finally(() => {
              setIsLoading((prev) => ({ ...prev, messages: false }));
            });
        },
        onStompError: (error) => {
          console.error("WebSocket error:", error);
          setConnected(false);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to connect to chat",
            customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
          });
        },
        onDisconnect: () => {
          console.log("Disconnected from WebSocket");
          setConnected(false);
        },
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
    },
    [token, userProfile, activeSession, darkMode]
  );

  const startChat = useCallback(async () => {
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please log in to start a chat",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
      return;
    }
    try {
      const response = await api.post(
        "/api/chats/start",
        { shopId },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const chatId = response.data.data?.id;
      if (!chatId) {
        throw new Error("Chat id missing in response!");
      }
      setActiveSession({ id: chatId, shopName: shop?.name });
      connectWebSocket(chatId);
      setOpen(true);
    } catch (error) {
      console.error("Error starting chat:", error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: 'Failed to start chat!',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
      });
    }
  }, [shopId, token, shop, connectWebSocket, darkMode]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeSession?.id || !stompClient || !connected) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Cannot send message. Ensure chat is active.",
        customClass: { popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "" },
      });
      return;
    }
    stompClient.publish({
      destination: "/app/chat/send",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        sessionId: activeSession.id,
        content: input,
      }),
    });
    console.log("📤 Sent:", input);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        senderName: userProfile?.email,
        content: input,
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput("");
  }, [input, activeSession, stompClient, connected, token, userProfile, darkMode]);

  const onClose = useCallback(() => {
    setOpen(false);
    if (stompClient && subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
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
  }, [shopId, token, fetchShopProfile, fetchCategories, fetchProductsByShop, fetchShopReviews, fetchUserProfile]);

  useEffect(() => {
    if (open) {
      fetchChatSessions();
    }
  }, [open, fetchChatSessions]);

  useEffect(() => {
    if (activeSession) {
      setUnreadCounts((prev) => ({
        ...prev,
        [activeSession.id]: 0,
      }));
      connectWebSocket(activeSession.id);
    }
  }, [activeSession, connectWebSocket]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (stompClient && subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        stompClient.deactivate();
        setConnected(false);
      }
    };
  }, [stompClient]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-red-600 dark:text-red-400 text-center text-lg font-semibold px-4">
        {error}
      </div>
    );
  }

  if (!shop || isLoading.shop) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-16 animate-pulse">
        <div className="relative bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 via-gray-800 to-gray-700 text-gray-900 dark:text-white py-16 px-6 md:px-12 shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-4 w-full md:w-2/3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
            <div className="h-32 w-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-100"} text-gray-900 dark:text-gray-100 pt-16 transition-all duration-300`}>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-900 dark:to-gray-800 text-white py-20 px-6 md:px-12 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-black"></div>
        <div className="absolute top-[-50px] left-[-50px] w-96 h-96 bg-indigo-300 rounded-full opacity-20 blur-3xl animate-float"></div>
        <div className="absolute bottom-[-80px] right-[-80px] w-80 h-80 bg-blue-300 rounded-full opacity-20 blur-3xl animate-float-slow"></div>
        <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-indigo-400 rounded-full opacity-15 blur-2xl animate-float delay-1000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-blue-400 rounded-full opacity-15 blur-2xl animate-float-slow delay-500"></div>
        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 z-10 animate-fade-in">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-md">{shop.name}</h1>
            <h4 className="text-xl md:text-2xl font-semibold text-indigo-200">0{shop.phone}</h4>
            <p className="text-base md:text-lg max-w-2xl leading-relaxed opacity-90">{shop.description || "No description available"}</p>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-yellow-300 flex items-center font-bold text-xl drop-shadow">
                <FiStar className="mr-1" fill="currentColor" /> {shop.rating || "4.6"}
              </span>
              <span className="text-indigo-200 text-sm ml-4">(Based on reviews)</span>
            </div>
          </div>
          <div className="flex justify-center items-center transform hover:scale-105 transition-transform duration-300">
            <RiStore2Line className="text-9xl md:text-10xl text-white opacity-80" />
          </div>
        </div>
      </div>

      {/* Search and Categories */}
      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col  justify-between items-center gap-4 sm:gap-6">
            <div className="relative w-full sm:w-1/2">
              <div className="flex items-center bg-white/30 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50 px-4 py-3 shadow-inner transition-all hover:shadow-md focus-within:ring-2 focus-within:ring-indigo-500 backdrop-blur-md">
                <FiSearch className="text-indigo-500 dark:text-indigo-400 mr-3 text-xl" />
                <input
                  type="text"
                  onChange={(e) => debouncedSetSearch(e.target.value)}
                  placeholder="Search products in this shop..."
                  className="w-full bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-300 text-base"
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      debouncedSetSearch("");
                    }}
                    className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition-colors"
                  >
                    <FiX className="text-lg" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <button
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-md ${
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-white/30 dark:bg-gray-800/30 text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 backdrop-blur-md"
                }`}
                onClick={() => handleCategoryChange("all")}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`px-4 py-2 rounded-3xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-md ${
                    selectedCategory === cat.id
                      ? "bg-indigo-600 text-white"
                      : "bg-white/30 dark:bg-gray-800/30 text-indigo-600 dark:text-indigo-400 border border-gray-100 dark:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 backdrop-blur-md"
                  }`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2 animate-fade-in">
          Available Products
        </h2>
        {isLoading.products ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-3/4"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((p) => (
              <Link
                to={`/device/${p.id}`}
                key={p.id}
                className="group bg-white/30 dark:bg-gray-800/30 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50"
              >
                <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  {!imageLoadStatus[p.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 dark:bg-gray-700/50 animate-pulse">
                      <div className="w-8 h-8 border-2 border-indigo-500 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <img
                    src={p.imageUrl || "https://images.pexels.com/photos/163097/black-smartphone-163097.jpeg"}
                    alt={p.name}
                    className={`w-full h-full object-cover transition-opacity duration-300 group-hover:scale-110 ${
                      imageLoadStatus[p.id] ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() => handleImageLoad(p.id)}
                    onError={() => handleImageLoad(p.id)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base sm:text-lg text-indigo-600 dark:text-indigo-400 mb-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <FiTag className="text-indigo-500 dark:text-indigo-400" />
                    {p.categoryName || "Uncategorized"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <FiCheckCircle className="text-green-500 dark:text-green-400" />
                    {p.condition || "New"}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{p.description || "No description available"}</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mb-3">{p.price} EGP</p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(p);
                    }}
                    className="w-full bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white font-semibold py-2 rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Add to Cart
                  </button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 text-base sm:text-lg">No products found matching your search.</p>
        )}
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2 animate-fade-in">
          Customer Reviews
        </h2>
        <div className="bg-white/30 dark:bg-gray-800/30 rounded-2xl p-4 sm:p-6 shadow-lg backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 mb-8">
          <h3 className="font-bold text-lg sm:text-xl text-indigo-600 dark:text-indigo-400 mb-4">Share Your Experience</h3>
          <div className="flex items-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar
                key={star}
                className={`cursor-pointer text-2xl sm:text-3xl transition-all duration-200 transform hover:scale-125 ${
                  newReview.rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"
                }`}
                onClick={() => handleRatingClick(star)}
              />
            ))}
          </div>
          <textarea
            value={newReview.comment}
            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
            placeholder="Write your detailed review here..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-4 text-gray-900 dark:text-gray-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 resize-none text-sm sm:text-base"
            rows="4"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={addReview}
              className="bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white px-6 py-2 rounded-xl font-semibold shadow-md transition-all duration-300 transform hover:scale-105"
            >
              Submit Review
            </button>
          </div>
        </div>
        {isLoading.reviews ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg animate-pulse border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center mb-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mr-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-full"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * (100 / slidesPerView)}%)`, width: `${100 * totalPages}%` }}
              >
                {reviews.map((r) => (
                  <div key={r.id} className="min-w-[100%] sm:min-w-[50%] lg:min-w-[33.333%] px-2">
                    <div className="bg-white/30 dark:bg-gray-800/30 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 transform hover:-translate-y-1 backdrop-blur-md">
                      <div className="flex items-center mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={`text-lg sm:text-xl ${r.rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                          />
                        ))}
                        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{r.comment}</p>
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => handleEditReview(r)}
                          className="p-2 rounded-full bg-white/30 dark:bg-gray-700/30 hover:bg-indigo-200/30 dark:hover:bg-indigo-800/30 transition-all duration-300 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50"
                        >
                          <FiEdit3 className="text-indigo-600 dark:text-indigo-400 text-lg" />
                        </button>
                        <button
                          onClick={() => deleteReview(r.id)}
                          className="p-2 rounded-full bg-white/30 dark:bg-gray-700/30 hover:bg-red-200/30 dark:hover:bg-red-800/30 transition-all duration-300 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50"
                        >
                          <FiTrash2 className="text-red-600 dark:text-red-400 text-lg" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {totalPages > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/30 dark:bg-gray-800/30 text-gray-900 dark:text-white p-3 rounded-full shadow-lg hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all duration-300 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50"
                >
                  <FiChevronLeft className="text-xl sm:text-2xl" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/30 dark:bg-gray-800/30 text-gray-900 dark:text-white p-3 rounded-full shadow-lg hover:bg-white/40 dark:hover:bg-gray-700/40 transition-all duration-300 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50"
                >
                  <FiChevronRight className="text-xl sm:text-2xl" />
                </button>
                <div className="flex justify-center mt-6 gap-2">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full transition-all duration-300 ${
                        currentIndex === index
                          ? "bg-indigo-600 dark:bg-indigo-400 scale-125"
                          : "bg-gray-300 dark:bg-gray-600 hover:bg-indigo-400 dark:hover:bg-indigo-500"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 text-base sm:text-lg">No reviews yet. Be the first to review this shop!</p>
        )}
      </div>

      {/* Chat Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 bg-indigo-600 dark:bg-indigo-700 text-white p-3 sm:p-4 rounded-full shadow-2xl hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-all duration-300 transform hover:scale-110 z-50 flex items-center justify-center backdrop-blur-md border border-indigo-200/50 dark:border-indigo-700/50"
        aria-label="Open chat"
      >
        <FiMessageCircle className="text-2xl sm:text-3xl" />
      </button>

      {/* Chat Modal */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-white/30 dark:bg-gray-800/30 w-full max-w-4xl sm:max-w-5xl h-[70vh] sm:h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
            <div className="w-full sm:w-80 bg-white/30 dark:bg-gray-800/30 flex flex-col border-r border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md">
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200/50 dark:border-gray-700/50 bg-indigo-600/30 dark:bg-indigo-800/30 backdrop-blur-md">
                <h2 className="font-bold text-lg sm:text-xl text-indigo-700 dark:text-indigo-300">Chats</h2>
                <button
                  onClick={onClose}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-red-500 transition-colors duration-200"
                  aria-label="Close chat"
                >
                  <FiX className="text-xl sm:text-2xl" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sessions.length > 0 ? (
                  sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setActiveSession(s)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 relative border border-indigo-300/50 dark:border-indigo-700/50 backdrop-blur-md ${
                        activeSession?.id === s.id
                          ? "bg-indigo-200/30 dark:bg-indigo-800/30 shadow-md"
                          : "bg-gradient-to-r from-indigo-50/30 to-blue-50/30 dark:from-indigo-800/30 to-blue-800/30 hover:bg-indigo-100/30 dark:hover:bg-indigo-900/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-indigo-700 dark:text-indigo-300">
                        <RiChat1Fill className="text-indigo-500 dark:text-indigo-400" />
                        {s.shopName}
                      </div>
                      {s.lastMessage ? (
                        <>
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{s.lastMessage.content}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(s.lastMessage.createdAt).toLocaleTimeString()}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-500">Start chatting now!</div>
                      )}
                      {unreadCounts[s.id] > 0 && (
                        <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-1 animate-pulse">
                          {unreadCounts[s.id]}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">No active chats. Start a new one!</div>
                )}
              </div>
              <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-indigo-100/30 dark:bg-indigo-900/30 backdrop-blur-md">
                <button
                  onClick={startChat}
                  className="w-full bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  New Chat with Shop
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col bg-white/30 dark:bg-gray-800/30 backdrop-blur-md">
              {activeSession ? (
                <>
                  <div className="bg-indigo-600/30 dark:bg-indigo-800/30 p-4 sm:p-5 border-b border-gray-200/50 dark:border-gray-700/50 shadow-md backdrop-blur-md">
                    <h3 className="font-bold text-lg sm:text-xl text-indigo-700 dark:text-indigo-300">Chat with {activeSession.shopName}</h3>
                    <p className="text-sm opacity-90 text-gray-200">Online - Responds quickly</p>
                  </div>
                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-white/10 to-blue-50/10 dark:from-gray-800/10 to-blue-900/10 backdrop-blur-sm">
                    {isLoading.messages ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, index) => (
                          <div key={index} className="flex items-start gap-3 animate-pulse">
                            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                            <div className="flex-1 bg-gray-200/50 dark:bg-gray-700/50 rounded-2xl p-4 max-w-xs sm:max-w-md backdrop-blur-md">
                              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-3 ${msg.senderType !== 'SHOP' ? "flex-row-reverse" : ""}`}
                        >
                          <div className="w-8 sm:w-10 h-8 sm:h-10 bg-indigo-200/50 dark:bg-indigo-700/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm backdrop-blur-md">
                            {msg.senderName?.[0] || "U"}
                          </div>
                          <div
                            className={`max-w-xs sm:max-w-md px-4 py-3 rounded-3xl shadow-md transition-all duration-200 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 ${
                              msg.senderType !== 'SHOP'
                                ? "bg-gradient-to-r from-indigo-500/50 to-blue-500/50 text-white"
                                : "bg-white/30 dark:bg-gray-700/30 text-gray-800 dark:text-gray-200"
                            }`}
                          >
                            <p className="text-sm font-semibold mb-1 text-gray-900 dark:text-gray-100">{msg.senderName || "Anonymous"}</p>
                            <p className="text-sm sm:text-base">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1 text-right text-gray-600 dark:text-gray-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 mt-20 text-base sm:text-lg">
                        Say hello to start the conversation! 👋
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-4 sm:p-5 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center gap-3 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1 border border-gray-200/50 dark:border-gray-600/50 rounded-xl px-4 sm:px-5 py-2 sm:py-3 bg-white/30 dark:bg-gray-700/30 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-300 backdrop-blur-md text-sm sm:text-base"
                      placeholder="Type your message..."
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white p-2 sm:p-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-110 backdrop-blur-md border border-indigo-200/50 dark:border-indigo-700/50"
                    >
                      <FiSend className="text-lg sm:text-xl" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-lg sm:text-xl font-medium">
                  Select a session or start a new chat
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;