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
        const response = await fetch(`http://localhost:8080/api/products/${id}`,{headers:{Authorization:`Bearer ${token}`}});
        if (!response.ok) {
          throw new Error("Product not found");
        }
        const data = await response.json();
        setProduct(data);
       
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

  // const fetchReviews = async (shopId) => {
  //   try {
  //     setReviewsLoading(true);
  //     const response = await fetch(`http://localhost:8080/api/reviews/shops/${shopId}`);
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch reviews");
  //     }
  //     const reviewsData = await response.json();
  //     setReviews(reviewsData);
  //   } catch (err) {
  //     console.error("Error fetching reviews:", err);
  //     setSwalProps({
  //       show: true,
  //       title: 'Error',
  //       text: 'Failed to load reviews',
  //       icon: 'error'
  //     });
  //   } finally {
  //     setReviewsLoading(false);
  //   }
  // };

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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-indigo-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto"></div>
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
            <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl p-6 h-[400px] lg:h-[500px] overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-h-full max-w-full object-contain transform transition-transform duration-300 hover:scale-105"
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{product.name}</h1>
                <span className="inline-flex items-center px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 font-semibold text-sm rounded-full">
                  {product.stock} left in stock
                </span>
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

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product);
                }}
                className="w-full lg:w-auto inline-flex items-center justify-center px-8 py-4 bg-indigo-600 dark:bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <FaShoppingCart className="mr-2" /> Add to Cart
              </button>
            </div>
          </div>
        </div>

     
        {/* <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 lg:p-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-8">Customer Reviews</h2>

          {reviewsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
              <p className="ml-4 text-gray-600 dark:text-gray-400">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 py-4 text-center text-lg">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center mb-2 space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        i < review.rating ? 
                          <FilledStar key={i} className="text-yellow-400" /> : 
                          <EmptyStar key={i} className="text-yellow-400" />
                      ))}
                    </div>
                    {currentUser && review.author === currentUser.username && (
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => handleEditReview(review)}
                          className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a2 2 0 00-2 2v1m8 0a2 2 0 01-2-2V3m-4 4h.01M12 7h.01" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{review.comment}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">By {review.author} on {new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}

          <div id="review-form" className="mt-10">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingReviewId ? 'Edit Your Review' : 'Leave a Review'}
            </h3>
            <div className="flex items-center mb-4 space-x-2">
              {renderInteractiveStars()}
              <span className="ml-2 text-gray-600 dark:text-gray-400">({userRating}/5)</span>
            </div>
            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Write your review here..."
              className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              rows="5"
            />
            <div className="flex space-x-4 mt-4">
              <button
                onClick={handleSubmitReview}
                className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg"
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
                  className="px-6 py-3 bg-gray-500 dark:bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-all duration-300"
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