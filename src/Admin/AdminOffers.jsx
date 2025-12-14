import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiTag,
  FiPlus,
  FiSearch,
  FiEdit3,
  FiTrash2,
  FiCopy,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiPercent,
  FiDollarSign,
 
  FiClock,
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../api';
import Modal from '../components/Modal';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const OffersSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-10 w-1/3 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="h-10 w-full sm:w-80 bg-gray-300 dark:bg-gray-600 rounded-lg mb-6"></div>
      <table className="min-w-full">
        <thead>
          <tr>
            {['ID', 'Title', 'Discount', 'Status', 'Shop', 'Dates', 'Actions'].map((_, idx) => (
              <th key={idx} className="px-6 py-3 text-left">
                <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, idx) => (
            <tr key={idx}>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded-full"></div></td>
              <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-300 dark:bg-gray-600 rounded-full"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="flex gap-2"><div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div></div></td>
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
          <thead className="bg-gray-100 dark:bg-gray-750">
            <tr>
              {['ID', 'Title', 'Discount', 'Status', 'Shop', 'Validity', 'Actions'].map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map(renderRow)}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
                    <FiTag className="text-5xl" />
                    <p className="text-lg font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8 pb-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FiChevronLeft className="w-4 h-4" /> Prev
            </button>
            {getPageNumbers().map((num, i) => (
              <button
                key={i}
                onClick={() => typeof num === 'number' && setPage(num)}
                disabled={num === '...'}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  num === '...'
                    ? 'text-gray-500 dark:text-gray-400'
                    : page === num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-800'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const AdminOffers = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [offers, setOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const fetchOffers = useCallback(async () => {
    if (!token) {
      Swal.fire('Error', 'Please log in.', 'error');
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.get('/api/admin/offers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(data) ? data : data?.content || [];
      setOffers(list);
    } catch (error) {
      const msg = error.response?.status === 401 ? 'Session expired.' : 'Failed to load offers.';
      Swal.fire('Error', msg, 'error');
      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
      }
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate]);

  const deleteOffer = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Offer?',
      text: 'This cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
    });
    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      await api.delete(`/api/admin/offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire('Deleted!', 'Offer removed.', 'success').then(() => fetchOffers());
    } catch {
      Swal.fire('Error', 'Failed to delete offer.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({ title: 'Copied!', toast: true, position: 'top-end', timer: 1000, icon: 'success' });
  };

  const filteredOffers = useMemo(() => {
    if (!searchTerm) return offers;
    const lower = searchTerm.toLowerCase();
    return offers.filter(o =>
      o.name?.toLowerCase().includes(lower) ||
      o.description?.toLowerCase().includes(lower) ||
      o.shopName?.toLowerCase().includes(lower)
    );
  }, [offers, searchTerm]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);


  const activeCount = offers.filter(o => o.status === 'ACTIVE' && new Date(o.endDate) >= new Date()).length;
  const inactiveCount = offers.length - activeCount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-16 ml-3">
      <div className="max-w-7xl mx-auto space-y-8">

       
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
              <FiTag className="w-8 h-8" /> Offers Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Create and manage promotional offers</p>
          </div>
        </div>

        {isLoading ? <OffersSkeleton darkMode={darkMode} /> : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

          
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Offers</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{offers.length}</p>
                </div>

              
                <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Now</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{activeCount}</p>
                </div>

                
                <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive / Expired</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{inactiveCount}</p>
                </div>
              </div>
            </div>

            
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="relative max-w-lg">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, description or shop name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    <FiXCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

          
            <div className="p-6">
              <PaginatedTable
                data={filteredOffers}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                darkMode={darkMode}
                emptyMessage={offers.length === 0 ? 'No offers created yet' : 'No offers match your search'}
                renderRow={(offer) => {
                  const isActive = offer.status === 'ACTIVE' && new Date(offer.endDate) >= new Date();
                  const isExpired = offer.endDate && new Date(offer.endDate) < new Date();
                  const status = isActive ? 'ACTIVE' : isExpired ? 'EXPIRED' : 'INACTIVE';

                  const statusStyles = {
                    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300',
                    INACTIVE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                    EXPIRED: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',
                  };

                  const discountIcon = offer.discountType === 'PERCENTAGE' ? <FiPercent /> : <FiDollarSign />;
                  const discountText = offer.discountType === 'PERCENTAGE'
                    ? `${offer.discountValue}%`
                    : `${offer.discountValue.toFixed(2)}`;

                  const formatDate = (dateString) => {
                    return new Date(dateString).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    });
                  };

                  return (
                    <tr key={offer.id} className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition ${!isActive ? 'opacity-70' : ''}`}>
                      
                      <td className="px-6 py-4 text-xs font-mono text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-28">{offer.id}</span>
                          <button onClick={() => copyToClipboard(offer.id)} className="text-gray-400 hover:text-emerald-600">
                            <FiCopy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                   
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                        {offer.name || 'Unnamed Offer'}
                      </td>

                    
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                          {discountText} OFF
                        </span>
                      </td>

                      
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${statusStyles[status]}`}>
                          {status === 'ACTIVE' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                          {status === 'EXPIRED' && <FiXCircle className="w-4 h-4" />}
                          {status}
                        </span>
                      </td>

                     
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <FaStore className="w-4 h-4 text-gray-500" />
                          {offer.shopName || 'Global Offer'}
                        </div>
                      </td>

                      
                      <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2 text-gray-500">
                          <FiCalendar className="w-4 h-4" />
                          <span>{formatDate(offer.startDate)}</span>
                          <FiChevronRight className="w-3 h-3" />
                          <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                            {formatDate(offer.endDate)}
                          </span>
                        </div>
                        {isExpired && <span className="block text-red-600 text-xs mt-1">Expired</span>}
                      </td>

                     
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => deleteOffer(offer.id)}
                          className="px-3 py-1.5 text-xs bg-red-50 border border-gray-200 font-semibold dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
                          title="Delete offer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOffers;