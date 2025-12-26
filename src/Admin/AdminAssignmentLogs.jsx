import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiClipboard, FiClock, FiUser, FiMapPin, FiCalendar, FiPackage, FiStore, FiUserCheck, FiTool, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../api';

const LogsSkeleton = () => (
  <div className="animate-pulse p-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="h-10 w-full md:w-80 bg-gray-300 dark:bg-gray-600 rounded-lg mb-6"></div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-750">
          <tr>
            {['Assigner', 'Type', 'Shop', 'User', 'Address', 'Created', 'Updated'].map((_, idx) => (
              <th key={idx} className="px-6 py-3">
                <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {[...Array(10)].map((_, idx) => (
            <tr key={idx}>
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
);

const AdminAssignmentLogs = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    document.title = "Assignment Logs - TechRepair";
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!token) {
      Swal.fire('Error', 'Please log in.', 'error');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/api/admin/assignment-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data.content) ? res.data.content : res.data || [];
      setLogs(data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
      setLogs([]);
    } finally {
      setLoading(false);
    }
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

  const stats = {
    totalLogs: logs.length,
    orderAssignments: logs.filter(l => l.assignmentType === 'ORDER').length,
    repairAssignments: logs.filter(l => l.assignmentType === 'REPAIR').length,
    uniqueAssigners: new Set(logs.map(l => l.assignerId)).size,
  };

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const paginatedLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-16">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <FiClipboard className="w-10 h-10" /> Assignment Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track all assignment activities across assigners, shops, and users
          </p>
        </div>

        {loading ? (
          <LogsSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Logs', value: stats.totalLogs, color: 'emerald', icon: FiClipboard },
                { label: 'Order Assignments', value: stats.orderAssignments, color: 'blue', icon: FiPackage },
                { label: 'Repair Assignments', value: stats.repairAssignments, color: 'purple', icon: FiTool },
                { label: 'Active Assigners', value: stats.uniqueAssigners, color: 'teal', icon: FiUserCheck },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                    <p className={`text-3xl font-bold mt-2 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-4 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                    <stat.icon className={`w-8 h-8 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100 dark:bg-gray-750">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FiUser className="w-4 h-4" />
                          Assigner
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          
                          Shop
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          
                          User
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                         
                          Delivery Address
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                        
                          Assigned At
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                         
                          Updated At
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedLogs.length > 0 ? (
                      paginatedLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                          <td className="px-6 py-4 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                            {log.assignerName || '—'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              log.assignmentType === 'ORDER'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                            }`}>
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
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                             
                              {formatDate(log.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              
                              {formatDate(log.updatedAt)}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-gray-500 dark:text-gray-400 text-lg">
                          <FiClipboard className="mx-auto text-6xl mb-4 text-gray-300 dark:text-gray-600" />
                          No assignment logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, logs.length)} of {logs.length} logs
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FiChevronLeft />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-medium transition-all ${
                            currentPage === page
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Next
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAssignmentLogs;