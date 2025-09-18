import { useState, useEffect } from "react";
import { FiSearch, FiEye, FiTrash2, FiFlag, FiMessageCircle } from "react-icons/fi";
import Swal from "sweetalert2";

const Reviews = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("authToken");

 
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/admin/reviews", {
        headers: {"Content-Type" : "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : data.content || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch reviews", "error");
    } finally {
      setLoading(false);
    }
  };


  const deleteReview = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure",
      text: "This review will be deleted permanantly",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "yes,delete it",
      cancelButtonText: "Close",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:8080/api/admin/reviews/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete review");

        Swal.fire("Deleted", "Review successfully deleted", "success");
        fetchReviews();
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "error in deleting review", "error");
      }
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter(
    (review) =>
      review.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.repairShop?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status, flagged) => {
    if (flagged) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FiFlag className="mr-1" /> Flagged
        </span>
      );
    }
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const renderStars = (rating) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  const openReviewDetails = (review) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  return (
    <div style={{marginTop:"-575px",marginLeft:"275px"}} className="space-y-6 p-6 max-w-7xl mx-auto bg-[#f1f5f9] min-h-screen">
      <div className="bg-white border p-4 rounded-2xl text-left">
        <h1 className="text-3xl font-bold text-blue-500 flex items-center gap-2"><FiMessageCircle/>Review Management</h1>
        <p className="text-blue-500">Monitor and manage customer reviews</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-blue-700">Customer Reviews</h2>
          <div className="relative w-64">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

      
        <div className="p-5 overflow-x-auto">
          {loading ? (
            <p className="text-center text-blue-600">Loading reviews...</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100 text-blue-500">
                <tr>
                  <th className="px-6 py-3 text-left font-medium uppercase">Customer</th>
                  <th className="px-6 py-3 text-left font-medium uppercase">Repair Shop</th>
                  <th className="px-6 py-3 text-left font-medium uppercase">Rating</th>
                  <th className="px-6 py-3 text-left font-medium uppercase">Comment</th>
                  <th className="px-6 py-3 text-left font-medium uppercase">Date</th>
                 
                  <th className="px-6 py-3 text-left font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-blue-600">
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4">{review.userId}</td>
                    <td className="px-6 py-4">{review.shopId}</td>
                    <td className="px-6 py-4">{renderStars(review.rating)}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{review.comment}</td>
                    <td className="px-6 py-4">{review.createdAt}</td>
          
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button
                        onClick={() => openReviewDetails(review)}
                        className="p-2 bg-transparent border text-blue-700 rounded"
                      >
                        <FiEye />
                      </button>
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="p-2 bg-transparent border text-red-600 rounded "
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {filteredReviews.length === 0 && !loading && (
            <p className="text-center text-gray-500 py-4">No reviews found</p>
          )}
        </div>
      </div>

    
      {isModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-blue-700">Review Details</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
              <div className="mt-4 space-y-4 text-gray-700">
                <p><strong>Customer:</strong> {selectedReview.customer}</p>
                <p><strong>Repair Shop:</strong> {selectedReview.repairShop}</p>
                <p><strong>Rating:</strong> {renderStars(selectedReview.rating)}</p>
                <p><strong>Comment:</strong> {selectedReview.comment}</p>
                <p><strong>Date:</strong> {selectedReview.date}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedReview.status, selectedReview.flagged)}</p>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;