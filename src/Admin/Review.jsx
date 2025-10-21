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
          <div className="h-8 w-1/4 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-600 rounded-lg mb-3"></div>
          <div className="h-8 w-1/4 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="relative w-full md:w-64 mb-6">
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['Customer', 'Repair Shop', 'Rating', 'Comment', 'Date', 'Actions'].map((header, idx) => (
                <th key={idx} className="px-6 py-4">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...Array(5)].map((_, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded-lg"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded-lg"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-200 dark:bg-gray-600 rounded-lg"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg"></div></td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
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
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
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
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
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
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
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
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
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
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
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
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
      });
      await fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to delete review',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : 'bg-white text-gray-800' },
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
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
          <FiFlag className="mr-1.5" /> Flagged
        </span>
      );
    }
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
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
          className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
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
    <div  className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 animate-fade-in mt-14">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-gray-100 flex items-center gap-3">
            <FiMessageCircle className="text-indigo-600 dark:text-indigo-400" /> Review Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Efficiently monitor and manage customer reviews</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: 'Total Reviews', value: computedStats.totalReviews },
            { title: 'Approved Reviews', value: computedStats.approvedReviews },
            { title: 'Flagged Reviews', value: computedStats.flaggedReviews },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stat.title}</h3>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="relative w-full md:w-80">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer, shop, or comment..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-10 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  <FiXCircle size={20} />
                </button>
              )}
            </div>
            <div className="flex items-center flex-wrap justify-center gap-4 text-sm">
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-full font-medium">
                Total: {computedStats.totalReviews}
              </span>
              <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-4 py-2 rounded-full font-medium">
                Approved: {computedStats.approvedReviews}
              </span>
              <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 px-4 py-2 rounded-full font-medium">
                Flagged: {computedStats.flaggedReviews}
              </span>
              <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 px-4 py-2 rounded-full font-medium">
                Page: {currentPage} of {totalPages}
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <ReviewsSkeleton darkMode={darkMode} />
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center border border-gray-200 dark:border-gray-700">
            <FiMessageCircle className="text-6xl mx-auto mb-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No reviews found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms' : 'No reviews available'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-x-auto border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {['ID', 'Rating', 'Comment', 'Date', 'Actions'].map((header, idx) => (
                      <th
                        key={idx}
                        className="px-6 py-4 text-sm font-semibold text-indigo-600 dark:text-gray-100 uppercase tracking-wider text-center"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentReviews.map((review) => (
                    <tr
                      key={review.id}
                      className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200"
                    >
                       <td className="px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 mt-3">
                                         <span className="truncate max-w-[150px]">{review.id}</span>
                                         <button
                                           onClick={() => copyToClipboard(review.id)}
                                           className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                                           title="Copy Offer ID"
                                         >
                                           <FiCopy size={16} />
                                           <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-200 text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                             Copy review ID
                                           </span>
                                         </button>
                                       </td>
                      {/* <td className="py-6 px-6 text-center text-gray-600 dark:text-gray-300">
                        {DOMPurify.sanitize(review.userId) || 'N/A'}
                      </td> */}
                      {/* <td className="py-6 px-6 text-center text-gray-600 dark:text-gray-300">
                        {DOMPurify.sanitize(review.shopId) || 'N/A'}
                      </td> */}
                      <td className="py-6 px-6 text-center">{renderStars(review.rating)}</td>
                      <td className="py-6 px-6 text-center text-gray-600 dark:text-gray-300 max-w-xs truncate">
                        {DOMPurify.sanitize(review.comment) || 'N/A'}
                      </td>
                      <td className="py-6 px-6 text-center text-gray-600 dark:text-gray-300">
                        {new Date(review.createdAt).toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="py-6 px-6 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openReviewDetails(review)}
                            className="p-2 bg-indigo-100 text-xs dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-200 hover:shadow-md"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteReview(review.id)}
                            className="p-2 bg-red-100 text-xs dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200 hover:shadow-md"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  <FiChevronLeft size={18} /> 
                </button>

                {getPageNumbers().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      page === '...' ? 'cursor-default text-gray-500 dark:text-gray-400' : currentPage === page ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                    }`}
                    disabled={page === '...'}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                   <FiChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}

        {isModalOpen && selectedReview && (
          <Modal onClose={() => setIsModalOpen(false)} title="Review Details" darkMode={darkMode}>
            <div className="space-y-6">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  Review Information
                  <button
                    onClick={() => copyToClipboard(selectedReview.id)}
                    className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                    title="Copy Review ID"
                  >
                    <FiCopy size={18} />
                    <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                      Copy Review ID
                    </span>
                  </button>
                </h4>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">ID:</strong> {selectedReview.id || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">Customer:</strong> {DOMPurify.sanitize(selectedReview.userId) || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">Shop:</strong> {DOMPurify.sanitize(selectedReview.shopId) || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">Rating:</strong> {renderStars(selectedReview.rating)}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">Comment:</strong> {DOMPurify.sanitize(selectedReview.comment) || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">Date:</strong> {new Date(selectedReview.createdAt).toLocaleDateString() || 'N/A'}
                  </p>
                 
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
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