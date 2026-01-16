import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiSearch,
  FiXCircle,
  FiCopy,
  FiCheckCircle,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiPackage,
  FiClock,
  FiInfo,
  FiUserCheck,
  FiUserX,
  FiTrash2,
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

const AssignersSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
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
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {['ID', 'Name', 'Email', 'Phone', 'Status', 'Created At', 'Actions'].map((_, idx) => (
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
              <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-28 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
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

const Assigners = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [assigners, setAssigners] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedAssigner, setSelectedAssigner] = useState(null);
  const [loading, setLoading] = useState(true);

  const sanitizedSearchTerm = useMemo(() => {
    return DOMPurify.sanitize(searchTerm.trim().toLowerCase());
  }, [searchTerm]);


   useEffect(() => {
      document.title = "Assigners - TechRepair";
    }, []);

  const stats = useMemo(() => {
    const totalHandled = assigners.reduce((sum, a) => sum + (a.totalAssignmentsHandled || 0), 0);
    const pending = assigners.reduce((sum, a) => sum + (a.pendingAssignments || 0), 0);
    const verified = assigners.filter(a => a.status === 'APPROVED').length;
    const suspended = assigners.filter(a => a.status === 'SUSPENDED').length;
    return { totalHandled, pending, verified, suspended };
  }, [assigners]);

  const fetchAssigners = useCallback(async () => {
    if (!token) {
      Swal.fire({ title: 'Error', text: 'Please log in.', icon: 'error' });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/assigners', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const processed = Array.isArray(data) ? data : data?.content || [];
      setAssigners(processed);
    } catch (error) {
      const msg = error.response?.status === 401 ? 'Session expired.' : 'Failed to load assigners.';
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
      }
      setAssigners([]);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  const filteredAssigners = useMemo(() => {
    let result = assigners;

    if (filter !== 'all') {
      const statusMap = {
        pending: 'PENDING',
        approved: 'APPROVED',
        suspended: 'SUSPENDED'
      };
      result = result.filter(a => a.status === statusMap[filter]);
    }

    if (sanitizedSearchTerm) {
      result = result.filter(a =>
        (a.name || '').toLowerCase().includes(sanitizedSearchTerm) ||
        (a.email || '').toLowerCase().includes(sanitizedSearchTerm) ||
        (a.phone || '').toLowerCase().includes(sanitizedSearchTerm)
      );
    }

    return result;
  }, [assigners, filter, sanitizedSearchTerm]);

  useEffect(() => {
    fetchAssigners();
  }, [fetchAssigners]);

  const fetchAssignerById = async (id) => {
    try {
      const { data } = await api.get(`/api/admin/assigners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedAssigner(data);
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to load details.', icon: 'error' });
    }
  };

  const updateStatus = async (id, action) => {
    const actionText = action === 'approve' ? 'Approve' : action === 'suspend' ? 'Suspend' : 'Delete';
    if (action === 'delete') {
      const result = await Swal.fire({
        title: 'Delete Assigner?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Yes, delete',
      });
      if (!result.isConfirmed) return;
    }

    try {
      const method = action === 'delete' ? 'delete' : 'put';
      const endpoint = action === 'delete' 
        ? `/api/admin/assigners/${id}` 
        : `/api/admin/assigners/${id}/${action}`;

      await api[method](endpoint, { headers: { Authorization: `Bearer ${token}` } });

      Swal.fire({
        title: 'Success!',
        text: `Assigner ${actionText.toLowerCase()}d successfully.`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 1500,
        showConfirmButton: false
      });

      fetchAssigners();
    } catch (error) {
      Swal.fire({ title: 'Error', text: `Failed to ${actionText.toLowerCase()} assigner.`, icon: 'error' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => Swal.fire({ title: 'Copied!', icon: 'success', toast: true, position: 'top-end', timer: 1000 }),
      () => Swal.fire({ title: 'Failed', icon: 'error', toast: true, position: 'top-end', timer: 1000 })
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      APPROVED: { bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-800 dark:text-green-400' },
      PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-800 dark:text-yellow-400' },
      SUSPENDED: { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-800 dark:text-red-400' },
    };
    const s = map[status] || map.PENDING;
    return <span className={`px-3 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>{status || 'PENDING'}</span>;
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-16 ml-3">
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: ${darkMode ? '#34d399' : '#10b981'}; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#6ee7b7' : '#059669'}; }
        `}
      </style>
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <FiUsers /> Assigners Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage assignment personnel</p>
        </div>

        {loading ? (
          <AssignersSkeleton darkMode={darkMode} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Assigners', value: assigners.length, color: 'emerald', icon: FiUsers },
                { label: 'Active (Approved)', value: stats.verified, color: 'green', icon: FiUserCheck },
                { label: 'Pending Approval', value: stats.pending, color: 'amber', icon: FiClock },
                { label: 'Suspended', value: stats.suspended, color: 'red', icon: FiUserX },
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

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-lg dark:text-white border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      <FiXCircle size={20} />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'approved', label: 'Approved' },
                    { key: 'suspended', label: 'Suspended' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-5 py-3 rounded-lg font-medium transition ${
                        filter === key
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAssigners.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <td className="px-6 py-4 text-xs dark:text-white font-mono">
                          {a.id}
                          <button onClick={() => copyToClipboard(a.id)} className="ml-2 text-emerald-600 hover:text-emerald-800">
                            <FiCopy className="inline" size={14} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-md font-semibold dark:text-teal-300">{DOMPurify.sanitize(a.name || 'N/A')}</td>
                        <td className="px-6 py-4 text-sm dark:text-gray-300">{DOMPurify.sanitize(a.email || 'N/A')}</td>
                        <td className="px-6 py-4 text-sm dark:text-gray-300">{DOMPurify.sanitize(a.phone || 'N/A')}</td>
                        <td className="px-6 py-4">{getStatusBadge(a.status)}</td>
                        <td className="px-6 py-4 text-sm text-center">{formatDate(a.createdAt)}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => fetchAssignerById(a.id)}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-950 rounded-lg font-medium border border-blue-200 dark:border-blue-800"
                            >
                              <FiInfo size={16} /> View
                            </button>
                            {a.status !== 'APPROVED' && (
                              <button
                                onClick={() => updateStatus(a.id, 'approve')}
                                className="text-green-600 hover:text-green-800 flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 dark:bg-green-950 rounded-lg font-medium border border-green-200 dark:border-green-800"
                              >
                                <FiCheckCircle size={16} /> Approve
                              </button>
                            )}
                            {a.status !== 'SUSPENDED' && (
                              <button
                                onClick={() => updateStatus(a.id, 'suspend')}
                                className="text-amber-600 hover:text-amber-800 flex items-center gap-1 text-xs px-3 py-1.5 bg-amber-50 dark:bg-amber-950 rounded-lg font-medium border border-amber-200 dark:border-amber-800"
                              >
                                <FiUserX size={16} /> Suspend
                              </button>
                            )}
                            { a.status !== 'PENDING' && (
                            <button
                              onClick={() => updateStatus(a.id, 'delete')}
                              className="text-red-600 hover:text-red-800 flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 dark:bg-red-950 rounded-lg font-medium border border-red-200 dark:border-red-800"
                            >
                              <FiTrash2 size={16} /> Delete
                            </button>
)}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAssigners.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500 text-lg">
                          No assigners found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {selectedAssigner && (
          <Modal onClose={() => setSelectedAssigner(null)} title="Assigner Details" darkMode={darkMode}>
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assigner Information</h4>
                  <button onClick={() => copyToClipboard(selectedAssigner.id)} className="text-gray-500 hover:text-emerald-600 transition">
                    <FiCopy className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                  <div className="flex items-center gap-3">
                    <FiUser className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Name</p>
                      <p className="font-medium">{DOMPurify.sanitize(selectedAssigner.name || 'N/A')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiMail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium">{DOMPurify.sanitize(selectedAssigner.email || 'N/A')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiPhone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium">{DOMPurify.sanitize(selectedAssigner.phone || 'N/A')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiInfo className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedAssigner.status)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiCalendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Created At</p>
                      <p className="font-medium">{formatDate(selectedAssigner.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiPackage className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Total Assignments Handled</p>
                      <p className="font-medium text-lg">{selectedAssigner.totalAssignmentsHandled || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiClock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Pending Assignments</p>
                      <p className="font-medium text-lg">{selectedAssigner.pendingAssignments || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedAssigner(null)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
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

export default Assigners;