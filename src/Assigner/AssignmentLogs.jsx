import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiClipboard, FiClock, FiInfo } from 'react-icons/fi';
import api from '../api';


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

const AssignmentLogs = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  const fetchLogs = useCallback(async () => {
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

    const controller = new AbortController();
    try {
      setLoading(true);
      const res = await api.get('/api/assigner/assignment-log', {
        signal: controller.signal,
      });
      const data = Array.isArray(res.data.content) ? res.data.content : [];
      setLogs(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching logs:', err.response?.data || err.message);
        Swal.fire({
          title: 'Error',
          text: err.response?.data?.message || 'Failed to fetch logs',
          icon: 'error',
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
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [fetchLogs]);

  const logsArray = Array.isArray(logs) ? logs : [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = logsArray.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(logsArray.length / itemsPerPage);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
        <FiClipboard /> Assignment Logs
      </h2>

      {loading ? (
        <LogsSkeleton darkMode={darkMode} />
      ) : currentLogs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentLogs.map((log, index) => (
              <div
                key={log.id || index}
                className="p-5 bg-white dark:bg-gray-950 shadow rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-2 mb-3 text-indigo-500 dark:text-indigo-400">
                  <FiInfo />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Log Message</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{log.message || 'N/A'}</p>
                <div className="flex items-center gap-2 mt-4 text-gray-500 dark:text-gray-400 text-xs">
                  <FiClock />
                  {log.createdAt
                    ? new Date(log.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                    currentPage === i + 1
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">
          <FiClipboard className="text-6xl mx-auto mb-4 text-indigo-500 dark:text-indigo-400" />
          <p className="text-lg">No logs found</p>
        </div>
      )}
    </div>
  );
};

export default AssignmentLogs;