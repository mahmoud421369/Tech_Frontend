
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FiSearch, FiStar, FiTrash2, FiEdit3, FiHome } from "react-icons/fi";
import Swal from "sweetalert2";
import { RiChat1Fill } from "@remixicon/react";
import { RiMessage2Line, RiStore2Line } from "react-icons/ri";

const Shop = ({darkMode}) => {
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






  const [stompClient, setStompClient] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");


  const shopName = "Tech&Restore";


  // useEffect(() => {

  //   const socket = new window.SockJS("http://localhost:8080/ws");
  //   const client = window.Stomp.over(socket);

  //   client.connect({ Authorization: `Bearer ${token}` }, () => {
  //     console.log("Connected to WebSocket");
  //     client.subscribe("/user/queue/messages", (msg) => {
  //       const body = JSON.parse(msg.body);
  //       setMessages((prev) => [...prev, body]);
  //     });
  //     setStompClient(client);
  //   });

  
  //   fetch("http://localhost:8080/api/chats/conversations", {
  //     headers: { Authorization: `Bearer ${token}` },
  //   })
  //     .then((res) => res.json())
  //     .then((data) => setConversations(data))
  //     .catch((err) => console.error(err));

  //   return () => client.disconnect();
  // }, []);

  // const loadMessages = (user) => {
  //   setSelectedUser(user);
  //   fetch(
  //     `http://localhost:8080/api/chats/messages/${user.id}/${shopId}`,
  //     { headers: { Authorization: `Bearer ${token}` } }
  //   )
  //     .then((res) => res.json())
  //     .then((data) => setMessages(data))
  //     .catch((err) => console.error(err));
  // };

  // const sendMessage = () => {
  //   if (!currentMessage.trim() || !selectedUser) return;

  //   const payload = {
  //     senderId: shopId,
  //     recipientId: selectedUser.id,
  //     senderName: shopName,
  //     recipientName: selectedUser.name,
  //     content: currentMessage,
  //   };

  //   stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(payload));
  //   setCurrentMessage("");
  // };







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

  if (error) return <div className="text-red-500">{error}</div>;
  if (!shop) return <div className="text-gray-500">Loading shop...</div>;

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen relative mt-16">
      



 
      <div className={`bg-gradient-to-r from-blue-600 to-indigo-600  text-white flex justify-between items-center flex-wrap gap-12  py-16 px-3  shadow-lg`}>
        <div>
        <h1 className="text-7xl font-bold mb-4 text-white text-wrap">{shop.name}</h1>
        <h4 className="text-xl font-bold mb-4 text-[#f1f5f9]">{shop.phone}</h4>
   


        <p className="text-lg max-w-2xl">{shop.description}</p>
       
        <div className="mt-4 flex items-center gap-2">

          <span className="ml-2 text-amber-500 flex items-center font-bold gap-2"><FiStar/> 4.6</span>
        </div>
</div>
       <div className="p-4 text-9xl flex justify-center items-center">
        <RiStore2Line className="text-9xl" />
       </div>

      </div>
        

       
      <div className="flex flex-col items-center mt-8 mb-6 space-y-4">
       
        <div className="flex items-center bg-gray-50  rounded-3xl border px-4 py-3 w-full max-w-lg">
          <FiSearch className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none bg-transparent
            "
          />
        </div>

        
        <div className="flex flex-wrap justify-center gap-3">
          <button
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
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
                  : "bg-gray-200 text-blue-500 hover:bg-gray-300"
              }`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>



   
      <div className="px-6 mb-16">
        <h2 className="text-3xl font-bold text-blue-600 mb-6">Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <div key={p.id} className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow hover:shadow-xl transition cursor-pointer">
                <div className="h-48 flex items-center p-0 justify-center relative bg-white rounded-xl mb-4">
                  {!imageLoadStatus[p.id] && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                  <img src={p.imageUrl} alt={p.name} className={`w-full h-full object-contain ${imageLoadStatus[p.id] ? "block" : "hidden"}`} onLoad={() => handleImageLoad(p.id)} />
                </div>

                <h3 className="font-bold text-lg text-white mb-1">{p.name}</h3>
                <p className="text-white mb-2">{p.description?.substring(0, 60)}...</p>
                <p className="px-3 py-2 bg-white text-blue-500 rounded-3xl inline-block font-bold mb-2">{p.price} EGP</p>
                <button onClick={() => handleAddToCart(p)} className="w-full mt-2 bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-xl transition">
                  Add to Cart
                </button>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">No products found</p>
          )}
        </div>
      </div>

      
     <div className="px-6 mb-20 bg-gray-50 dark:bg-gray-900 p-6 font-cairo">
  {/* Title */}
  <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-8 flex items-center gap-2 mt-4">
    <RiMessage2Line className="text-indigo-500" /> Customer Reviews
  </h2>

  {/* Leave a Review */}
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-10 shadow-lg border border-gray-200 dark:border-gray-700">
    <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 text-lg">Leave a Review</h3>

    {/* Stars */}
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

    {/* Comment box */}
    <textarea
      value={newReview.comment}
      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
      placeholder="Write your comment..."
      className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3 text-gray-700 dark:text-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:outline-none transition resize-none"
      rows="4"
    ></textarea>

    {/* Button */}
    <div className="mt-4 flex justify-end">
      <button
        onClick={addReview}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-md transition"
      >
        Add Review
      </button>
    </div>
  </div>

  {/* Reviews List */}
  <div className="space-y-6">
    {reviews.length > 0 ? (
      reviews.map((r) => (
        <div
          key={r.id}
          className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-500 rounded-2xl p-6 shadow-md flex justify-between items-start relative overflow-hidden"
        >
          {/* Review content */}
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

          {/* Actions */}
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
  </div>
</div>





    {/* <div className="flex h-[80vh] border rounded-lg overflow-hidden m-4 shadow-lg">
    
      <div className="w-1/4 bg-blue-700 text-white p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">User Conversations</h2>
        <ul>
          {conversations.map((user) => (
            <li
              key={user.id}
              className={`p-2 rounded mb-2 cursor-pointer hover:bg-blue-500 ${
                selectedUser?.id === user.id ? "bg-blue-500" : ""
              }`}
              onClick={() => loadMessages(user)}
            >
              {user.name}
            </li>
          ))}
        </ul>
      </div>

      
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          {selectedUser ? (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-2 flex ${
                  msg.senderId === shopId ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`p-2 rounded-lg max-w-xs ${
                    msg.senderId === shopId
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs text-gray-300">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Select a user to start chatting</p>
          )}
        </div>

    
        {selectedUser && (
          <div className="p-4 flex bg-gray-100 border-t">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded-lg"
            />
            <button
              onClick={sendMessage}
              className="ml-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div> */}


    </div>







  );
};

export default Shop;