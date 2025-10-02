import React, { useEffect, useState,useRef } from "react";
import { useParams } from "react-router-dom";
import { FiSearch, FiStar, FiTrash2, FiEdit3, FiHome, FiXCircle, FiSend, FiUser, FiMessageSquare, FiX, FiMessageCircle } from "react-icons/fi";
import Swal from "sweetalert2";
import { RiChat1Fill } from "@remixicon/react";
import { RiMessage2Line, RiStore2Line } from "react-icons/ri";
import SockJS from "sockjs-client"
import { Client } from "@stomp/stompjs";

const Shop = () => {
  const { shopId } = useParams(); 
  const token = localStorage.getItem("authToken");

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState("");
  const [imageLoadStatus, setImageLoadStatus] = useState({});
  const [search, setSearch] = useState("");
  const [userRating, setUserRating] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });







  



  const fetchShopProfile = async () => {
    if (!token) {
      setError("No auth token found. Please log in.");
      return;
    }
    if (!shopId) {
      setError("No shop ID provided in the route.");
      return;
    }


    try {
      const res = await fetch(`http://localhost:8080/api/shops/${shopId}`, {
        headers: { "Content-Type" : "application/json",Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch shop profile");
      const data = await res.json();
      setShop(data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load shop profile");
      Swal.fire("خطأ", "تعذر تحميل بيانات المتجر", "error");
    }
  };

  useEffect(() => {
    fetchShopProfile();
  }, [shopId]);


  
  const fetchCategories = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/users/categories`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data.content || data);
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  };

  
  const fetchProductsByShop = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/products/shop/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data.content || data);
    } catch (err) {
      console.error(err);
      setError("Failed to load products");
    }
  };

  
  const fetchProductsByCategory = async (categoryId) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/users/${shopId}/${categoryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch products by category");
      const data = await res.json();
      setProducts(data.content || data);
    } catch (err) {
      console.error(err);
      setError("Failed to load products");
    }
  };

  
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    if (categoryId === "all") {
      fetchProductsByShop();
    } else {
      fetchProductsByCategory(categoryId);
    }
  };



  const fetchShopReviews = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/reviews/${shopId}/reviews`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch reviews: ${res.status}`);
      const data = await res.json();
      setReviews(data.content || data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load reviews", "error");
    }
  };


  const addReview = async () => {
    if (!newReview.comment || newReview.rating === 0) {
      Swal.fire("Warning", "Please add comment and rating", "warning");
      return;
    }
    try {
        const token = localStorage.getItem("authToken");
      const res = await fetch(`http://localhost:8080/api/reviews/${shopId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newReview),
      });
      if (!res.ok) throw new Error("Failed to add review");
      Swal.fire("Success", "Review added!", "success");
      setNewReview({ rating: 0, comment: "" });
      fetchShopReviews();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to add review", "error");
    }
  };

const updateReview = async (reviewId, updatedFields) => {
  if (!token) {
    Swal.fire("Error", "You must be logged in to update a review", "error");
    return;
  }

  try {
    const res = await fetch(`http://localhost:8080/api/reviews/${reviewId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedFields),
    });

    if (!res.ok) {
      let errData;
      try {
        errData = await res.json();
      } catch {
        errData = {};
      }
      throw new Error(errData.message || "Failed to update review");
    }

    Swal.fire(" Success", "Review updated!", "success");
    fetchShopReviews(); 
  } catch (err) {
    console.error("Update review error:", err);
    Swal.fire(" Error", err.message, "error");
  }
};

const handleEditReview = async (review) => {
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
};

  
 const deleteReview = async (reviewId) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`http://localhost:8080/api/reviews/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        let errData;
        try {
          errData = await res.json();
        } catch {
          errData = {};
        }
        throw new Error(errData.message || "Failed to delete review");
      }

      Swal.fire(" Deleted!", "Review has been deleted.", "success");
      fetchShopReviews();
    } catch (err) {
      console.error("Delete review error:", err);
      Swal.fire(" Error", err.message, "error");
    }
  }
};


  const handleAddToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const handleImageLoad = (id) => {
    setImageLoadStatus((prev) => ({ ...prev, [id]: true }));
  };

  const handleRatingClick = (rating) => {
    setUserRating(rating);
    setNewReview((prev) => ({ ...prev, rating }));
  };

  useEffect(() => {
    if (shopId && token) {
      fetchProductsByShop()
      fetchShopProfile();

      fetchShopReviews();
       fetchCategories();
             fetchCategories();
 


    }
  }, [shopId, token,selectedCategory]);







 const [connected, setConnected] = useState(false);
  const [sessions, setSessions] = useState([]);
    const [stompClient, setStompClient] = useState(null);
  
  const WS_URL = "http://localhost:8080/ws";
const API_BASE = "http://localhost:8080";
  const [isOpen, setIsOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  // const stompClient = useRef(null);
  
  const subscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);


  const messageQueue = useRef([]);

  const userEmail = localStorage.getItem("email") || "user@example.com";
  const userId = localStorage.getItem("userId") || "123";


  const [sessionId, setSessionId] = useState(null);
  const [open, setOpen] = useState(true);

  const [input, setInput] = useState("");
    const [userProfile, setUserProfile] = useState(null);
const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No token found, cannot fetch profile.");
      return;
    }

    const res = await fetch("http://localhost:8080/api/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch profile: ${res.status}`);
    }

    const data = await res.json();
    setUserProfile(data);
  
  } catch (err) {
    console.error("Error fetching profile:", err);
  }
};


  useEffect(() => {
    if (open) {
      fetch("http://localhost:8080/api/chats/sessions", {
        headers: { "Content-Type" : "application/json",Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("📂 Shop sessions:", data);
         setSessions(
  Array.isArray(data) 
    ? data 
    : data?.content && Array.isArray(data.content) 
    ? data.content 
    : data 
    ? [data] 
    : []
);
        })
        .catch((err) => console.error("❌ Error fetching sessions:", err));
    }
  }, [open]);



const connectWebSocket = (chatId) => {
  if (!chatId) {
    console.error("❌ Cannot connect, chatId is undefined");
    return;
  }

  const client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    onConnect: () => {
      console.log("✅ Connected. Subscribing to chat:", chatId);

      client.subscribe(
        `/user/${userProfile.email}/queue/chat/messages/${chatId}`,
        (msg) => {
          const body = JSON.parse(msg.body);
          console.log("📩 Received:", body);
          setMessages((prev) => [...prev, body]);
        },
        { Authorization: `Bearer ${token}` }
      );
    },
  });
     fetch(`http://localhost:8080/api/chats/${chatId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("📩 Messages:", data);
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch((err) =>
        console.error("❌ Error loading messages:", err)
      );


  client.activate();
  setStompClient(client);
};





const startChat = async () => {
  try {
    const res = await fetch("http://localhost:8080/api/chats/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shopId }),
    });

    const result = await res.json();
    console.log("✅ Chat start response:", result);

    if (!result.data?.id) {
      throw new Error("Chat id missing in response!");
    }

    const chatId = result.data.id;  
    setSessionId(chatId);
    connectWebSocket(chatId);
    setOpen(true);
  } catch (err) {
    console.error("❌ Error starting chat:", err);
  }
};
const sendMessage = () => {
  if (!input.trim() || !sessionId || !stompClient) return;

  stompClient.publish({
    destination: "/app/chat/send",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      sessionId, 
      content: input,
    }),
  });

  console.log("📤 Sent:", input);
  setInput("");
};

const onClose = () => {
  setOpen(false);   
  setIsOpen(false); 
};

useEffect(()=>{
fetchUserProfile()
},[])




  if (error) return <div className="text-red-500">{error}</div>;
  if (!shop) return <div className="text-gray-500">Loading shop...</div>;

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
      <div className="min-h-screen relative mt-16 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center flex-wrap gap-12 py-16 px-3 shadow-lg">
        <div>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-wrap">
            {shop.name}
          </h1>
          <h4 className="text-xl font-bold mb-4 text-gray-100">{shop.phone}</h4>
          <p className="text-lg max-w-2xl">{shop.description}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="ml-2 text-amber-400 flex items-center font-bold gap-2">
              <FiStar /> 4.6
            </span>
          </div>
        </div>
        <div className="p-4 text-9xl flex justify-center items-center">
          <RiStore2Line className="text-9xl" />
        </div>
      </div>

      <div className="flex flex-col items-center mt-8 mb-6 space-y-4">
        <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 px-4 py-3 w-full max-w-lg">
          <FiSearch className="text-gray-500 dark:text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full outline-none bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
            onClick={() => handleCategoryChange("all")}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 mb-16">
        <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-6">
          Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <div
                key={p.id}
                className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:bg-gray-950 p-4 rounded-2xl shadow hover:shadow-xl transition cursor-pointer"
              >
                <div className="h-48 flex items-center justify-center relative bg-white rounded-xl mb-4">
                  {!imageLoadStatus[p.id] && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="animate-spin h-10 w-10 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                          5.291A7.962 7.962 0 014 12H0c0 
                          3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                  )}
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className={`w-full h-full object-contain ${
                      imageLoadStatus[p.id] ? "block" : "hidden"
                    }`}
                    onLoad={() => handleImageLoad(p.id)}
                  />
                </div>

                <h3 className="font-bold text-lg text-white mb-1">{p.name}</h3>
                <p className="text-white mb-2">
                  {p.description?.substring(0, 60)}...
                </p>
                <p className="px-3 py-2 bg-white text-blue-500 rounded-3xl inline-block font-bold mb-2">
                  {p.price} EGP
                </p>
                <button
                  onClick={() => handleAddToCart(p)}
                  className="w-full mt-2 bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-xl transition"
                >
                  Add to Cart
                </button>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
              No products found
            </p>
          )}
        </div>
      </div>

  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-10 shadow-lg border border-gray-200 mx-auto w-full dark:border-gray-700">
    <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 text-lg">Leave a Review</h3>

    <div className="flex items-center mb-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStar
          key={star}
          className={`cursor-pointer text-3xl transition-transform transform hover:scale-110 ${
            newReview.rating >= star ? "text-yellow-400" : "text-gray-300 dark:text-gray-500"
          }`}
          onClick={() => setNewReview({ ...newReview, rating: star })}
        />
      ))}
    </div>


    <textarea
      value={newReview.comment}
      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
      placeholder="Write your comment..."
      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3 text-gray-700 dark:text-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:outline-none transition resize-none"
      rows="4"
    ></textarea>

    <div className="mt-4 flex justify-end">
      <button
        onClick={addReview}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-md transition"
      >
        Add Review
      </button>
    </div>
  </div>

  <div className="space-y-6">
    {reviews.length > 0 ? (
      reviews.map((r) => (
        <div
          key={r.id}
          className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-500 rounded-2xl p-6 shadow-md flex justify-between items-start relative overflow-hidden"
        >
     
          <div>
            <div className="flex items-center flex-wrap mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`text-xl transition ${
                    r.rating >= star ? "text-yellow-400" : "text-white/40"
                  }`}
                />
              ))}
              <span className="ml-3 text-white/80 text-sm">
                {new Date(r.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-white text-base leading-relaxed">{r.comment}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditReview(r)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
            >
              <FiEdit3 className="text-white text-xl" />
            </button>
            <button
              onClick={() => deleteReview(r.id)}
              className="p-2 rounded-full bg-white/20 hover:bg-red-400/70 transition"
            >
              <FiTrash2 className="text-white text-xl" />
            </button>
          </div>
        </div>
      ))
    ) : (
      <p className="text-gray-500 dark:text-gray-400 text-center text-lg">
        No reviews yet. Be the first to add one!
      </p>
    )}
  </div><br /><br />



    
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition"
      >
        <FiMessageCircle className="text-2xl" />
      </button>

      
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 w-[800px] h-[500px] rounded-xl shadow-lg flex overflow-hidden">
      
            <div className="w-64 bg-indigo-700 dark:bg-indigo-800 text-white flex flex-col">
              <div className="flex items-center justify-between flex-wrap p-3 border-b border-indigo-600 dark:border-indigo-700">
                <h2 className="font-bold">My Chats</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="hover:text-red-400"
                >
                  <FiX />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {sessions.map((s) => (
  <div
    key={s.id}
    onClick={() => setActiveSession(s)}
    className={`p-3 cursor-pointer ${
      activeSession?.id === s.id
        ? "bg-indigo-500"
        : "hover:bg-indigo-600"
    }`}
  >
    <div className="font-semibold">{s.shopName}</div>

  
    {s.lastMessage ? (
      <>
        <div className="text-sm opacity-80 truncate">
          {s.lastMessage.content}
        </div>
        <div className="text-xs opacity-60">
          {new Date(s.lastMessage.createdAt).toLocaleString()}
        </div>
      </>
    ) : (
      <div className="text-sm opacity-50">No messages yet</div>
    )}
  </div>
))}
              </div>
              <div className="p-2">
                <button
                  onClick={startChat}
                  className="w-full bg-green-500 py-2 rounded hover:bg-green-600"
                >
                  Start New Chat
                </button>
              </div>
            </div>


            <div className="flex-1 flex flex-col">
              {activeSession ? (
                <>
                  <div className="bg-indigo-600 text-white dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
                    Chat with {activeSession.shopName}
                  </div>
                  <div className="flex-1 p-3 overflow-y-auto">
                      <div className="p-4 space-y-3 overflow-y-auto h-[400px]">
      {messages.length > 0 ? (
        messages.map((msg) => (
          <div
            key={msg.id}
            className="p-3 rounded-lg shadow bg-gray-100 dark:bg-gray-800"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-sm">
                {msg.senderName || "Unknown"}
              </span>
              <span className="text-xs opacity-60">
                {new Date(msg.createdAt).toLocaleString()}
              </span>
            </div>
            
            <p className="text-sm">{msg.content}</p>
          </div>
        ))
      ) : (
        <div className="text-gray-500 dark:text-gray-400">
          No messages yet
        </div>
      )}
    </div>

                  </div>
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 border rounded-3xl cursor-pointer px-2 bg-gray dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      placeholder="Type a message..."
                    />
                    <button
                      onClick={() => {
                        sendMessage(input);
                        setInput("");
                      }}
                      className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded flex items-center"
                    >
                      <FiSend />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Select a chat to start messaging
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>






  );
};

export default Shop;