import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiEye,
  FiTrash2,
  FiCopy,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiFlag,
  FiMessageCircle,
  FiCheckCircle,
  FiInfo,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';
import Modal from '../components/Modal';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ReviewsSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[...Array(3)].map((_, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="h-10 w-full md:w-80 bg-gray-300 dark:bg-gray-600 rounded-lg mb-6"></div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {['ID', 'Rating', 'Comment', 'Date', 'Actions'].map((_, idx) => (
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
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-64 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const PaginatedTable = ({
  data,
  page,
  setPage,
  pageSize,
  renderRow,
  emptyMessage,
  darkMode,
}) => {
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
      if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
    }
    return pages;
  };

  return (
    <>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: ${darkMode ? '#34d399' : '#10b981'}; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#6ee7b7' : '#059669'}; }
        `}
      </style>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              {['ID', 'Rating', 'Comment', 'Date', 'Actions'].map((col, i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-gray-900 dark:text-gray-100">
            {paginatedData.map(renderRow)}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <FiMessageCircle className="text-4xl text-gray-400 dark:text-gray-500" />
                    <p className="text-lg font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
            >
              <FiChevronLeft /> Prev
            </button>
            {getPageNumbers().map((num, i) => (
              <button
                key={i}
                onClick={() => typeof num === 'number' && setPage(num)}
                disabled={num === '...'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  num === '...'
                    ? 'cursor-default text-gray-500 dark:text-gray-400'
                    : page === num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
            >
              Next <FiChevronRight />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const Reviews = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const stats = useMemo(() => {
    const total = reviews.length;
    const approved = reviews.filter(r => r.status === 'APPROVED').length;
    const pending = reviews.filter(r => r.status === 'PENDING').length;
    const flagged = reviews.filter(r => r.flagged).length;
    return { total, approved, pending, flagged };
  }, [reviews]);

  const fetchReviews = useCallback(async () => {
    if (!token) {
      Swal.fire({ title: 'Error', text: 'Please log in.', icon: 'error' });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/reviews', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const processed = Array.isArray(data) ? data : data?.content || [];
      console.log('Fetched Reviews:', processed);
      setReviews(processed);
    } catch (error) {
      const msg = error.response?.status === 401 ? 'Session expired.' : 'Failed to load reviews.';
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
      }
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  const deleteReview = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Review?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/admin/reviews/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ title: 'Deleted!', text: 'Review removed.', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      fetchReviews();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to delete.', icon: 'error' });
    }
  };

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id).then(
      () => Swal.fire({ title: 'Copied!', text: 'Review ID copied!', icon: 'success', toast: true, position: 'top-end', timer: 1000 }),
      () => Swal.fire({ title: 'Error', text: 'Failed to copy', icon: 'error', toast: true, position: 'top-end', timer: 1000 })
    );
  };

  const filteredReviews = useMemo(() => {
    if (!searchTerm.trim()) return reviews;
    const lower = searchTerm.toLowerCase();
    return reviews.filter(r =>
      r.userId?.toLowerCase().includes(lower) ||
      r.shopId?.toLowerCase().includes(lower) ||
      r.comment?.toLowerCase().includes(lower)
    );
  }, [reviews, searchTerm]);

  const renderStars = (rating) => (
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  const getStatusBadge = (status, flagged) => {
    if (flagged) {
      return (
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <FiFlag className="w-3 h-3 mr-1" /> Flagged
        </span>
      );
    }
    if (status === 'APPROVED') {
      return <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Approved</span>;
    }
    if (status === 'PENDING') {
      return <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>;
    }
    return <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{status}</span>;
  };

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-16 ml-3">
      <div className="max-w-7xl mx-auto space-y-8">

        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <FiMessageCircle /> Review Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage customer feedback</p>
        </div>

        {loading ? (
          <ReviewsSkeleton darkMode={darkMode} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

            
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {[
    { label: 'Total Reviews', value: stats.total, color: 'emerald', icon: FiMessageCircle },
    { label: 'Approved', value: stats.approved, color: 'green', icon: FiCheckCircle },
    { label: 'Flagged', value: stats.flagged, color: 'red', icon: FiFlag },
  ].map((stat, i) => (
    <div
      key={i}
      className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="text-left">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
        <p className={`text-3xl font-bold mt-2 text-${stat.color}-600 dark:text-${stat.color}-500`}>
          {stat.value}
        </p>
      </div>

      <div className={`p-4 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
        <stat.icon className={`w-8 h-8 text-${stat.color}-600 dark:text-${stat.color}-400`} />
      </div>
    </div>
  ))}
</div>
            </div>

      
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="relative max-w-md">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by customer, shop, or comment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 focus:outline-none rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      <FiXCircle />
                    </button>
                  )}
                </div>
              </div>
            </div>

           
            <div className="p-6">
              <PaginatedTable
                data={filteredReviews}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                filteredReviews={filteredReviews}
                darkMode={darkMode}
                renderRow={(review) => (
                  <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="truncate max-w-32">{review.id}</span>
                        <button onClick={() => copyToClipboard(review.id)} className="text-gray-500 hover:text-emerald-600">
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">{renderStars(review.rating)}</td>
                    <td className="px-6 py-4 text-sm max-w-xs truncate" title={DOMPurify.sanitize(review.comment)}>
                      {DOMPurify.sanitize(review.comment) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setIsModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs bg-emerald-50 flex gap-2 items-ceter border border-emerald-200 dark:bg-gray-950 dark:border-gray-900 text-emerald-700 dark:text-emerald-700 rounded"
                        >
                          <FiInfo/>View
                        </button>
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="px-3 py-1.5 text-xs flex gap-2 items-ceter bg-red-50 border border-red-200 dark:bg-gray-950 dark:border-gray-900 text-red-700 dark:text-red-700 rounded "
                        >
                         <FiTrash2/> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                emptyMessage={searchTerm ? 'No reviews match your search' : 'No reviews available'}
              />
            </div>
          </div>
        )}

      
        {isModalOpen && selectedReview && (
          <Modal onClose={() => setIsModalOpen(false)} title="Review Details" darkMode={darkMode}>
            <div className="space-y-5">
              <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Review Information</h4>
                  <button onClick={() => copyToClipboard(selectedReview.id)} className="text-gray-500 hover:text-emerald-600">
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <p><strong>ID:</strong> {selectedReview.id}</p>
                  <p><strong>Customer:</strong> {DOMPurify.sanitize(selectedReview.userId) || 'N/A'}</p>
                  <p><strong>Shop:</strong> {DOMPurify.sanitize(selectedReview.shopId) || 'N/A'}</p>
                  <p><strong>Rating:</strong> {renderStars(selectedReview.rating)}</p>
                  <p><strong>Comment:</strong> {DOMPurify.sanitize(selectedReview.comment) || 'N/A'}</p>
                  <p><strong>Date:</strong> {new Date(selectedReview.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
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