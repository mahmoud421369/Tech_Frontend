import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiClipboard, FiClock, FiUser, FiMapPin, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../api';
import { FaStore } from 'react-icons/fa';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const LogsSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="flex items-center gap-2 mb-6">
      <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
      <div className="h-6 w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, idx) => (
        <div
          key={idx}
          className="p-5 rounded-xl shadow-md bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

const AdminAssignmentLogs = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  
  const getItemsPerPage = () => {
    if (window.innerWidth >= 1024) return 3; 
    if (window.innerWidth >= 768) return 2; 
    return 1; 
  };

  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());

  useEffect(() => {
    const handleResize = () => setItemsPerPage(getItemsPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

 
  const totalPages = Math.ceil(logs.length / itemsPerPage);


  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  const fetchLogs = useCallback(async () => {
    if (!token) {
      Swal.fire({
        title: 'Error',
        text: 'No authentication token found. Please log in.',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      navigate('/login');
      return;
    }

    const controller = new AbortController();
    try {
      setLoading(true);
      const res = await api.get('/api/admin/assignment-logs', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data.content) ? res.data.content : [];
      console.log('Logs:', data);
      setLogs(data);
      setCurrentIndex(0); 
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching logs:', err.response?.data || err.message);
        Swal.fire({
          title: 'Error',
          text: err.response?.data?.message || 'Failed to fetch logs',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          navigate('/login');
        }
        setLogs([]);
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [darkMode, navigate, token]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const currentLogs = logs.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  );

  return (
    <div style={{marginLeft:"250px"}} className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300 animate-fade-in mt-14">
       <div className="bg-white p-6 rounded-xl flex justify-between dark:bg-gray-950 items-center mb-8">
               <div>
                 <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                   <FiClipboard /> Assignment Logs
                 </h1>
                 <p className="text-gray-600 dark:text-gray-400">View all of the assignment logs</p>
               </div>
      
             </div>
      {loading ? (
        <LogsSkeleton darkMode={darkMode} />
      ) : currentLogs.length > 0 ? (
        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100 / itemsPerPage}%)` }}
            >
              {currentLogs.map((log) => (
                <div
                  key={log.id}
                  className="min-w-[100%] md:min-w-[50%] lg:min-w-[33.333%] p-5 bg-white dark:bg-gray-950 shadow rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                      <FiUser />
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Assigner: {log.assignerName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                      <FiClipboard />
                      <span className="text-gray-700 dark:text-gray-300">
                        Type: {log.assignmentType || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                      <FaStore />
                      <span className="text-gray-700 dark:text-gray-300">
                        Shop: {log.shopName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                      <FiUser />
                      <span className="text-gray-700 dark:text-gray-300">
                        User: {log.userName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                      <FiMapPin />
                      <span className="text-gray-700 dark:text-gray-300">
                        User Address: {log.userAddress
                          ? `${log.userAddress.building}, ${log.userAddress.street}, ${log.userAddress.city}, ${log.userAddress.state}${log.userAddress.notes ? ` (${log.userAddress.notes})` : ''}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                      <FiClock />
                      Created: {log.createdAt
                        ? new Date(log.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                      <FiClock />
                      Updated: {log.updatedAt
                        ? new Date(log.updatedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {totalPages > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-indigo-600 dark:bg-indigo-800 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentIndex === 0}
              >
                <FiChevronLeft className="text-2xl" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-indigo-600 dark:bg-indigo-800 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentIndex === totalPages - 1}
              >
                <FiChevronRight className="text-2xl" />
              </button>
              <div className="flex justify-center mt-6 gap-2">
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className={`h-3 w-3 rounded-full transition-all duration-300 ${
                      currentIndex === index
                        ? 'bg-indigo-600 dark:bg-indigo-400 scale-125'
                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-indigo-400 dark:hover:bg-indigo-500'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
          <FiClipboard className="text-6xl mx-auto mb-4 text-indigo-500 dark:text-indigo-400" />
          <p className="text-lg">No logs found</p>
        </div>
      )}
    </div>
  );
};

export default AdminAssignmentLogs;