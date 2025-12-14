import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiClipboard, FiClock, FiUser, FiMapPin, FiCalendar } from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import api from '../api';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const LogsSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="space-y-4">
      <div className="h-8 w-64 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              {['Assigner', 'Type', 'Shop', 'User', 'Address', 'Created', 'Updated'].map((h) => (
                <th key={h} className="px-6 py-4 text-left">
                  <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, i) => (
              <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-64 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-36 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
                <td className="px-6 py-4"><div className="h-4 w-36 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const AdminAssignmentLogs = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

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
      });
      navigate('/login');
      return;
    }

    const controller = new AbortController();
    try {
      setLoading(true);
      const res = await api.get('/api/admin/assignment-logs', {
    
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data.content) ? res.data.content : [];
      console.log(data)
      setLogs(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        // console.error('Error fetching logs:', err.response?.data || err.message);
        // Swal.fire({
        //   title: 'Error',
        //   text: err.response?.data?.message || 'Failed to fetch logs',
        //   icon: 'error',
        //   toast: true,
        //   position: 'top-end',
        //   showConfirmButton: false,
        //   timer: 1500,
        // });
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
  }, [navigate, token]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    const parts = [
      addr.building,
      addr.street,
      addr.city,
      addr.state,
    ].filter(Boolean).join(', ');
    return addr.notes ? `${parts} (${addr.notes})` : parts || 'N/A';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-16 ml-3">
      <div className="max-w-7xl mx-auto">

        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <FiClipboard className="w-8 h-8" />
            Assignment Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track all assignment activities across assigners, shops, and users
          </p>
        </div>

        {loading ? (
          <LogsSkeleton darkMode={darkMode} />
        ) : logs.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FiUser className="w-4 h-4 text-emerald-600" />
                        Assigner
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaStore className="w-4 h-4 text-emerald-600" />
                        Shop
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FiMapPin className="w-4 h-4 text-emerald-600" />
                        Delivery Address
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FiCalendar className="w-4 h-4 text-emerald-600" />
                        Created At
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Updated At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {log.assignerName || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                          {log.assignmentType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {log.shopName || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {log.userName || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={formatAddress(log.userAddress)}>
                        {formatAddress(log.userAddress)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiClock className="w-4 h-4 text-emerald-600" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiClock className="w-4 h-4 text-amber-600" />
                          {formatDate(log.updatedAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-semibold">{logs.length}</span> assignment log{logs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-16 text-center border border-gray-200 dark:border-gray-700">
            <FiClipboard className="text-7xl mx-auto mb-6 text-emerald-600 dark:text-emerald-400 opacity-50" />
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">No Assignment Logs Found</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              There are currently no assignment activities recorded in the system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAssignmentLogs;