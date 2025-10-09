
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiEye, FiTrash2, FiMessageCircle, FiCopy, FiChevronLeft, FiChevronRight, FiXCircle, FiFlag } from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';
import Modal from '../components/Modal';


const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);


const ReviewsSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="space-y-4 mb-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-950 p-4 rounded-lg shadow">
          <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
      <div className="relative w-full md:w-64 mb-4">
        <div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
      </div>
      <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              {['Customer', 'Repair Shop', 'Rating', 'Comment', 'Date', 'Actions'].map((header, idx) => (
                <th key={idx} className="px-6 py-3">
                  <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...Array(5)].map((_, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const Reviews = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

 
  const computedStats = useMemo(() => {
    const totalReviews = reviews.length;
    const approvedReviews = reviews.filter((r) => r.status === 'APPROVED').length;
    const pendingReviews = reviews.filter((r) => r.status === 'PENDING').length;
    const flaggedReviews = reviews.filter((r) => r.flagged).length;
    return {
      totalReviews,
      approvedReviews,
      pendingReviews,
      flaggedReviews,
    };
  }, [reviews]);

  
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleSearchChange = useCallback(
    debounce((value) => {
      setDebouncedSearchTerm(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  const copyToClipboard = useCallback((id) => {
    navigator.clipboard.writeText(id).then(
      () => {
        Swal.fire({
          title: 'Success',
          text: 'Review ID copied to clipboard!',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      },
      (err) => {
        console.error('Copy failed:', err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to copy review ID',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    );
  }, [darkMode]);

  const fetchReviews = useCallback(async () => {
    if (!token) {
      Swal.fire({
        title: 'Error',
        text: 'No authentication token found. Please log in.',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      navigate('/login');
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    try {
      const response = await api.get('/api/admin/reviews', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(response.data) ? response.data : response.data.content || [];
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to fetch reviews',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
      setReviews([]);
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [token, navigate, darkMode]);

  const deleteReview = useCallback(async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'This review will be deleted permanently',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/api/admin/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({
        title: 'Success',
        text: 'Review successfully deleted',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      await fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to delete review',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
    }
  }, [fetchReviews, token, navigate, darkMode]);

  const openReviewDetails = useCallback((review) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  }, []);

  const filteredReviews = useMemo(() => {
    return reviews.filter(
      (review) =>
        review.userId?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        review.shopId?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        review.comment?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [reviews, debouncedSearchTerm]);

  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = useMemo(() => {
    return filteredReviews.slice(indexOfFirstReview, indexOfLastReview);
  }, [filteredReviews, indexOfFirstReview, indexOfLastReview]);
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);

  const getPageNumbers = useCallback(() => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  const getStatusBadge = (status, flagged) => {
    if (flagged) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300">
          <FiFlag className="mr-1" /> Flagged
        </span>
      );
    }
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300">
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
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
          className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  useEffect(() => {
    fetchReviews();
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [fetchReviews]);

  useEffect(() => {
    handleSearchChange(searchTerm);
  }, [searchTerm, handleSearchChange]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 mt-14 transition-colors duration-300 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <FiMessageCircle /> Review Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage customer reviews</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-950 p-4 rounded-lg shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Total Reviews</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.totalReviews}</p>
          </div>
          <div className="bg-white dark:bg-gray-950 p-4 rounded-lg shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Approved Reviews</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.approvedReviews}</p>
          </div>
          <div className="bg-white dark:bg-gray-950 p-4 rounded-lg shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Flagged Reviews</h3>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.flaggedReviews}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="relative w-full md:w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                placeholder="Search by customer, shop, or comment..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <FiXCircle />
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full">
                Total: {computedStats.totalReviews}
              </span>
              <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-3 py-1 rounded-full">
                Approved: {computedStats.approvedReviews}
              </span>
              <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 px-3 py-1 rounded-full">
                Flagged: {computedStats.flaggedReviews}
              </span>
              <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 px-3 py-1 rounded-full">
                Page: {currentPage} of {totalPages}
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <ReviewsSkeleton darkMode={darkMode} />
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-8 text-center">
            <FiMessageCircle className="text-6xl mx-auto mb-4 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No reviews found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms' : 'No reviews available'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400">
                  <tr>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">Repair Shop</th>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">Comment</th>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentReviews.map((review) => (
                    <tr
                      key={review.id}
                      className="text-center text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300"
                    >
                      <td className="px-6 py-4 text-sm flex items-center justify-center gap-2">
                        {review.id}
                        <button
                          onClick={() => copyToClipboard(review.id)}
                          className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                          title="Copy Review ID"
                        >
                          <FiCopy />
                          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                            Copy Review ID
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-4">{DOMPurify.sanitize(review.userId) || 'N/A'}</td>
                      <td className="px-6 py-4">{DOMPurify.sanitize(review.shopId) || 'N/A'}</td>
                      <td className="px-6 py-4">{renderStars(review.rating)}</td>
                      <td className="px-6 py-4 max-w-xs truncate">{DOMPurify.sanitize(review.comment) || 'N/A'}</td>
                      <td className="px-6 py-4">{new Date(review.createdAt).toLocaleDateString() || 'N/A'}</td>
                      <td className="px-6 py-4">{getStatusBadge(review.status, review.flagged)}</td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button
                          onClick={() => openReviewDetails(review)}
                          className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-300"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <FiChevronLeft /> Previous
                </button>

                {getPageNumbers().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                      page === '...' ? 'cursor-default' : currentPage === page ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                    }`}
                    disabled={page === '...'}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}

        {isModalOpen && selectedReview && (
          <Modal onClose={() => setIsModalOpen(false)} title="Review Details" darkMode={darkMode}>
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  Review Information
                  <button
                    onClick={() => copyToClipboard(selectedReview.id)}
                    className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    title="Copy Review ID"
                  >
                    <FiCopy />
                    <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                      Copy Review ID
                    </span>
                  </button>
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>ID:</strong> {selectedReview.id || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Customer:</strong> {DOMPurify.sanitize(selectedReview.userId) || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Repair Shop:</strong> {DOMPurify.sanitize(selectedReview.shopId) || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Rating:</strong> {renderStars(selectedReview.rating)}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Comment:</strong> {DOMPurify.sanitize(selectedReview.comment) || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Date:</strong> {new Date(selectedReview.createdAt).toLocaleDateString() || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Status:</strong> {getStatusBadge(selectedReview.status, selectedReview.flagged)}
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Reviews;
