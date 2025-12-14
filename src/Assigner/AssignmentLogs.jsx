import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiClipboard, FiUser, FiMapPin, FiClock, FiPackage,
  FiTool, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../api';

const AssignmentLogs = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchLogs = useCallback(async () => {
    if (!token) return navigate('/login');

    try {
      setLoading(true);
      const res = await api.get('/api/assigner/assignment-log', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = (res.data.content || res.data || []).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      setLogs(data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to load logs',
          text: err.response?.data?.message || 'Please try again later',
          toast: true,
          position: 'top-end',
          timer: 3000
        });
        setLogs([]);
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const currentLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusGradient = (status) => {
    const gradients = {
      PENDING: 'from-yellow-400 to-amber-500',
      PENDING_PICKUP: 'from-orange-400 to-red-500',
      SUBMITTED: 'from-yellow-400 to-amber-500',
      QUOTE_PENDING: 'from-amber-400 to-orange-500',
      IN_PROGRESS: 'from-indigo-500 to-purple-600',
      ASSIGNED: 'from-purple-500 to-pink-600',
      IN_TRANSIT: 'from-cyan-500 to-blue-600',
      COMPLETED: 'from-emerald-500 to-teal-600',
      default: 'from-gray-400 to-gray-600'
    };
    return gradients[status] || gradients.default;
  };

  const formatDate = (date) => date ? new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 pt-6 lg:pl-72 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        
        <div className="mb-12 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white flex items-center gap-5 justify-center lg:justify-start">
            <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl text-white shadow-2xl">
              <FiClipboard size={40} />
            </div>
            Assignment Logs
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Complete history of all orders & repairs you've assigned
          </p>
        </div>

      
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-8 animate-pulse border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full w-40"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <FiClipboard size={100} className="mx-auto text-gray-300 dark:text-gray-700 mb-6" />
            <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
              No assignment logs yet
            </h3>
            <p className="mt-3 text-gray-500 dark:text-gray-500">
              Start assigning orders and repairs to see history here
            </p>
          </div>
        ) : (
          <>
           
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {currentLogs.map((log) => (
                <div
                  key={log.id}
                  className="group bg-white dark:bg-gray-900 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:-translate-y-3"
                >
                 
                  <div className={`h-2 bg-gradient-to-r ${getStatusGradient(log.status)}`} />

                  <div className="p-7">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        {log.assignmentType === 'ORDER' ? (
                          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl">
                            <FiPackage className="text-emerald-600 dark:text-emerald-400" size={20} />
                          </div>
                        ) : (
                          <div className="p-3 bg-teal-100 dark:bg-teal-900/40 rounded-2xl">
                            <FiTool className="text-teal-600 dark:text-teal-400" size={20} />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {log.assignmentType === 'ORDER' 
                              ? `#${log.orderId?.slice(-8)}` 
                              : `#${log.repairRequestId?.slice(-8)}`
                            }
                          </h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {log.assignmentType === 'ORDER' ? 'Order' : 'Repair Request'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <FiUser className="text-emerald-600" size={16} />
                        <span><strong>Assigner:</strong> {log.assignerName || 'You'}</span>
                      </div>

                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <FiUser className="text-teal-600" size={16} />
                        <span><strong>Agent ID:</strong> {log.deliveryId}</span>
                      </div>

                      {log.userName && (
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                          <FiUser className="text-emerald-500" size={16} />
                          <span>{log.userName}</span>
                        </div>
                      )}

                      {log.shopName && (
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                          <FaStore className="text-teal-600" size={16} />
                          <span>{log.shopName}</span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                        <span className={`inline-block px-5 py-2 rounded-full text-white font-bold text-sm shadow-lg bg-gradient-to-r ${getStatusGradient(log.status)}`}>
                          {log.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3">
                        <div className="flex items-center gap-2">
                          <FiClock size={14} />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                        {log.updatedAt && log.updatedAt !== log.createdAt && (
                          <span className="text-xs">Updated</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            
            {totalPages > 1 && (
              <div className="flex justify-center gap-3 flex-wrap">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                  <FiChevronLeft /> Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-12 h-12 rounded-xl font-bold transition-all ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AssignmentLogs;