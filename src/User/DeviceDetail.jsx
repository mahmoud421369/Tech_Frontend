
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaShoppingCart, FaStar, FaRegStar } from 'react-icons/fa';
import { FaStar as FilledStar, FaRegStar as EmptyStar } from 'react-icons/fa';
import Swal from "sweetalert2";
import { FiTag } from 'react-icons/fi';


const DeviceDetail = ({ addToCart, darkMode, currentUser }) => {
         const token = localStorage.getItem("authToken");
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [swalProps, setSwalProps] = useState({});


  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);


  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/products/${id}`);
        if (!response.ok) {
          throw new Error("Product not found");
        }
        const data = await response.json();
        setProduct(data);
        
   
        await fetchReviews(data.shopId);
      } catch (err) {
        console.error("Error fetching product:", err);
        setProduct(null);
             Swal.fire("Success!", "Product added successfully", "success");
       
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  
  const fetchReviews = async (shopId) => {
    try {
      setReviewsLoading(true);
      const response = await fetch(`http://localhost:8080/api/reviews/shops/${shopId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      const reviewsData = await response.json();
      setReviews(reviewsData);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setSwalProps({
        show: true,
        title: 'Error',
        text: 'Failed to load reviews',
        icon: 'error'
      });
    } finally {
      setReviewsLoading(false);
    }
  };


  const handleAddToCart = async (product) => {
    try {
      const response = await fetch("http://localhost:8080/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          price: product.price,
          name: product.name,
          imageUrl: product.imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add item to cart");
      }

      if (addToCart) {
        addToCart(product);
      }

      Swal.fire("Success!", `${product.name} added to cart!`, "success");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add item to cart. Please try again.");
    }
  };

  const handleQuantityChange = (value) => {
    if (value >= 1) setQuantity(value);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === Math.ceil(rating) && rating % 1 >= 0.5) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }
    return stars;
  };

  const renderInteractiveStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      return (
        <button
          key={starValue}
          type="button"
          onClick={() => setUserRating(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
        >
          {starValue <= (hoverRating || userRating)
            ? <FilledStar className="text-yellow-400 text-2xl" />
            : <EmptyStar className="text-yellow-400 text-2xl" />}
        </button>
      );
    });
  };

  const handleSubmitReview = async () => {
    if (userRating === 0 || userComment.trim() === "") {
      setSwalProps({
        show: true,
        title: 'Validation Error',
        text: 'Please provide both a rating and a comment.',
        icon: 'warning'
      });
      return;
    }

    try {
      const reviewData = {
        rating: userRating,
        comment: userComment,
        productId: id,
        shopId: product.shopId
      };

      let response;
      if (editingReviewId) {
       
        response = await fetch(`http://localhost:8080/api/reviews/${editingReviewId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reviewData)
        });
      } else {
        
        response = await fetch(`http://localhost:8080/api/reviews/${product.shopId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reviewData)
        });
      }

      if (!response.ok) {
        throw new Error(editingReviewId ? 'Failed to update review' : 'Failed to create review');
      }

      const result = await response.json();
      
      if (editingReviewId) {
        setReviews(reviews.map(review => 
          review.id === editingReviewId ? result : review
        ));
      } else {
        setReviews([result, ...reviews]);
      }

      setSwalProps({
        show: true,
        title: 'Success',
        text: editingReviewId ? 'Review updated successfully!' : 'Review submitted successfully!',
        icon: 'success'
      });

      
      setUserRating(0);
      setUserComment("");
      setEditingReviewId(null);

    } catch (err) {
      console.error("Error submitting review:", err);
      setSwalProps({
        show: true,
        title: 'Error',
        text: 'Failed to submit review. Please try again.',
        icon: 'error'
      });
    }
  };

  const handleEditReview = (review) => {
    if (currentUser && review.author === currentUser.username) {
      setUserRating(review.rating);
      setUserComment(review.comment);
      setEditingReviewId(review.id);
      
      
      document.getElementById('review-form').scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteReview = (reviewId) => {
    setSwalProps({
      show: true,
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });
    
    
    setSwalProps(prev => ({
      ...prev,
      onConfirm: async () => {
        try {
          const response = await fetch(`http://localhost:8080/api/reviews/reviews/${reviewId}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            throw new Error('Failed to delete review');
          }

          setReviews(reviews.filter(review => review.id !== reviewId));
          
          setSwalProps({
            show: true,
            title: 'Deleted!',
            text: 'Your review has been deleted.',
            icon: 'success'
          });
        } catch (err) {
          console.error("Error deleting review:", err);
          setSwalProps({
            show: true,
            title: 'Error',
            text: 'Failed to delete review. Please try again.',
            icon: 'error'
          });
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-white to-indigo-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg font-semibold text-blue-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`w-full p-6 min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-white to-indigo-50'}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-white mt-6">Device Not Found</h2>
          <p className="text-gray-600 dark:text-blue-500 mt-2 mb-8">Sorry, we couldn't find the product you're looking for.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center mx-auto"
          >
            <FaChevronLeft className="mr-2" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark:bg-gray-900' : 'bg-gradient-to-br from-white to-indigo-50'} mt-6 min-h-screen`}>
      <div className="container mx-auto px-4 py-8">
      
        
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 font-medium mb-6 hover:text-blue-800 transition"
        >
          <FaChevronLeft className="mr-2" /> Back to Explore
        </button>

        <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
        
            <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-900 rounded-lg p-4">
              <img src={product.imageUrl} alt={product.name} className="max-h-full max-w-full object-contain" />
            </div>

           
            <div>
              <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-3 dark:text-white">{product.name}</h1>
              <span className='text-red-500 bg-red-50 font-bold text-sm px-3 py-2  rounded-3xl mb-3'>{product.stock} left in stock</span>
</div>
              <div className="flex items-center mb-4">
             
                <span className=" text-indigo-600 font-bold text-sm flex items-center gap-2"><FiTag/>{product.condition}</span>
              </div>

              <div className="mb-6">
                <p className="text-3xl font-bold text-blue-600 mb-2">{product.price?.toLocaleString()} EGP</p>
                <p className="text-gray-600 mb-4">Including VAT and shipping</p>
              </div>

              <p className="text-gray-400 mb-8">{product.description}</p>

              <div className="flex flex-wrap items-center">
             
                <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(product);
            }}
                  className="flex-1 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center"
                >
                  <FaShoppingCart className="mr-2" /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>

       
        {/* <div className="mt-10 bg-white dark:bg-gray-950 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 dark:text-white">Customer Reviews</h2>

          {reviewsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="ml-4 text-gray-600">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-gray-600 py-4 text-center">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        i < review.rating ? 
                          <FilledStar key={i} className="text-yellow-400" /> : 
                          <EmptyStar key={i} className="text-yellow-400" />
                      ))}
                    </div>
                    {currentUser && review.author === currentUser.username && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditReview(review)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-white">{review.comment}</p>
                  <p className="text-sm text-gray-500">By {review.author} on {new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}

  
          <div id="review-form" className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 dark:text-white">
              {editingReviewId ? 'Edit Your Review' : 'Leave a Review'}
            </h3>
            <div className="flex items-center mb-4 space-x-1">
              {renderInteractiveStars()}
              <span className="ml-2 text-gray-600">({userRating}/5)</span>
            </div>
            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Write your review here..."
              className="w-full p-3 border bg-gray-50 border-gray-300 rounded-lg dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
            />
            <div className="flex space-x-4 mt-4">
              <button
                onClick={handleSubmitReview}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                {editingReviewId ? 'Update Review' : 'Submit Review'}
              </button>
              {editingReviewId && (
                <button
                  onClick={() => {
                    setUserRating(0);
                    setUserComment("");
                    setEditingReviewId(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default DeviceDetail;