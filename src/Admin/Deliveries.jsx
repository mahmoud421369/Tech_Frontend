import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiTruck,
  FiSearch,
  FiXCircle,
  FiCopy,
  FiCheckCircle,
  FiInfo,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiUserCheck,
  FiUserX,
  FiClock,
  FiPackage,
  FiTool,
  FiCheckSquare,
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

const DeliveriesSkeleton = ({ darkMode }) => (
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
            {['ID', 'Name', 'Email', 'Phone', 'Status', 'Completed', 'Actions'].map((_, idx) => (
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
              <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
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

const Deliveries = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [allDeliveries, setAllDeliveries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  const sanitizedSearchTerm = useMemo(() => {
    return DOMPurify.sanitize(searchTerm.trim().toLowerCase());
  }, [searchTerm]);

  const fetchAllDeliveries = useCallback(async () => {
    if (!token) {
      Swal.fire({ title: 'Error', text: 'Please log in.', icon: 'error' });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/deliveries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const deliveriesList = Array.isArray(data) ? data : data?.content || [];
      setAllDeliveries(deliveriesList);
    } catch (error) {
      const msg = error.response?.status === 401 ? 'Session expired. Please log in again.' : 'Failed to load deliveries.';
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });

      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
      }
      setAllDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchAllDeliveries();
  }, [fetchAllDeliveries]);

  const filteredDeliveries = useMemo(() => {
    let filtered = allDeliveries;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => 
        d.status?.toLowerCase() === filterStatus.toLowerCase()
      );
    }

    if (sanitizedSearchTerm) {
      filtered = filtered.filter(d =>
        (d.name?.toLowerCase() || '').includes(sanitizedSearchTerm) ||
        (d.email?.toLowerCase() || '').includes(sanitizedSearchTerm) ||
        (d.phone?.toLowerCase() || '').includes(sanitizedSearchTerm)
      );
    }

    return filtered;
  }, [allDeliveries, filterStatus, sanitizedSearchTerm]);

  const stats = useMemo(() => {
    const total = allDeliveries.length;
    const pending = allDeliveries.filter(d => d.status === 'PENDING').length;
    const approved = allDeliveries.filter(d => d.status === 'APPROVED').length;
    const suspended = allDeliveries.filter(d => d.status === 'SUSPENDED').length;
    return { total, pending, approved, suspended };
  }, [allDeliveries]);

  const fetchDeliveryById = async (id) => {
    try {
      const { data } = await api.get(`/api/admin/deliveries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedDelivery(data);
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to load delivery details.', icon: 'error' });
    }
  };

  const updateStatus = async (id, action) => {
    const actionText = action === 'approve' ? 'Approve' : action === 'suspend' ? 'Suspend' : 'Delete';
    
    if (action === 'delete') {
      const result = await Swal.fire({
        title: 'Delete Delivery?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete',
      });
      if (!result.isConfirmed) return;
    }

    try {
      const method = action === 'delete' ? 'delete' : 'put';
      const endpoint = action === 'delete' 
        ? `/api/admin/deliveries/${id}` 
        : `/api/admin/deliveries/${id}/${action}`;

      await api[method](endpoint, { headers: { Authorization: `Bearer ${token}` } });

      Swal.fire({
        title: 'Success!',
        text: `Delivery ${actionText.toLowerCase()}d successfully.`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 1500,
        showConfirmButton: false
      });

      fetchAllDeliveries();
    } catch (error) {
      Swal.fire({ title: 'Error', text: `Failed to ${actionText.toLowerCase()} delivery.`, icon: 'error' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => Swal.fire({ title: 'Copied!', icon: 'success', toast: true, position: 'top-end', timer: 1000 }),
      () => Swal.fire({ title: 'Failed to copy', icon: 'error', toast: true, position: 'top-end', timer: 1000 })
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
            <FiTruck /> Delivery Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage delivery personnel</p>
        </div>

        {loading ? (
          <DeliveriesSkeleton darkMode={darkMode} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Delivery Personnel', value: stats.total, color: 'emerald', icon: FiTruck },
                { label: 'Active (Approved)', value: stats.approved, color: 'green', icon: FiUserCheck },
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
                      onClick={() => setFilterStatus(key)}
                      className={`px-5 py-3 rounded-lg font-medium transition ${
                        filterStatus === key
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
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Completed</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredDeliveries.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <td className="px-6 py-4 text-xs dark:text-white font-mono">
                          {d.id}
                          <button onClick={() => copyToClipboard(d.id)} className="ml-2 text-emerald-600 hover:text-emerald-800">
                            <FiCopy className="inline" size={14} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-md font-semibold dark:text-teal-300">{DOMPurify.sanitize(d.name || 'N/A')}</td>
                        <td className="px-6 py-4 text-sm dark:text-gray-300">{DOMPurify.sanitize(d.email || 'N/A')}</td>
                        <td className="px-6 py-4 text-sm dark:text-gray-300">0{DOMPurify.sanitize(d.phone || 'N/A')}</td>
                        <td className="px-6 py-4">{getStatusBadge(d.status)}</td>
                        <td className="px-6 py-4 text-center text-sm font-medium">{d.totalCompletedDeliveries || 0}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => fetchDeliveryById(d.id)}
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-950 rounded-lg font-medium border border-blue-200 dark:border-blue-800"
                            >
                              <FiInfo size={16} /> View
                            </button>
                            {d.status !== 'APPROVED' && (
                              <button
                                onClick={() => updateStatus(d.id, 'approve')}
                                className="text-green-600 hover:text-green-800 flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 dark:bg-green-950 rounded-lg font-medium border border-green-200 dark:border-green-800"
                              >
                                <FiCheckCircle size={16} /> Approve
                              </button>
                            )}
                            {d.status !== 'SUSPENDED' && (
                              <button
                                onClick={() => updateStatus(d.id, 'suspend')}
                                className="text-amber-600 hover:text-amber-800 flex items-center gap-1 text-xs px-3 py-1.5 bg-amber-50 dark:bg-amber-950 rounded-lg font-medium border border-amber-200 dark:border-amber-800"
                              >
                                <FiUserX size={16} /> Suspend
                              </button>
                            )}
                            <button
                              onClick={() => updateStatus(d.id, 'delete')}
                              className="text-red-600 hover:text-red-800 flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 dark:bg-red-950 rounded-lg font-medium border border-red-200 dark:border-red-800"
                            >
                              <FiTrash2 size={16} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredDeliveries.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500 text-lg">
                          No delivery personnel found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {selectedDelivery && (
          <Modal onClose={() => setSelectedDelivery(null)} title="Delivery Personnel Details" darkMode={darkMode}>
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personnel Information</h4>
                  <button onClick={() => copyToClipboard(selectedDelivery.id)} className="text-gray-500 hover:text-emerald-600 transition">
                    <FiCopy className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                  <div className="flex items-center gap-3">
                    <FiUser className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Name</p>
                      <p className="font-medium">{DOMPurify.sanitize(selectedDelivery.name || 'N/A')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiMail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium">{DOMPurify.sanitize(selectedDelivery.email || 'N/A')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiPhone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium">0{DOMPurify.sanitize(selectedDelivery.phone || 'N/A')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiMapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Address</p>
                      <p className="font-medium">{DOMPurify.sanitize(selectedDelivery.address || 'N/A')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiInfo className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedDelivery.status)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiPackage className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Active Orders</p>
                      <p className="font-medium text-lg">{selectedDelivery.activeOrderDeliveries || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiTool className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Active Repairs</p>
                      <p className="font-medium text-lg">{selectedDelivery.activeRepairDeliveries || 0}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FiCheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Total Completed</p>
                      <p className="font-medium text-lg">{selectedDelivery.totalCompletedDeliveries || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedDelivery(null)}
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

export default Deliveries;