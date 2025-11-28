import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiTool, FiSearch, FiCopy, FiXCircle, FiUser,
  FiMapPin, FiDollarSign, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../api';
import Modal from '../components/Modal';

const RepairsForAssignment = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [repairs, setRepairs] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  const itemsPerPage = 6;


  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      toast: true,
      icon: 'success',
      title: 'Copied!',
      text: 'Repair ID copied',
      position: 'top-end',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const fetchRepairs = useCallback(async () => {
    if (!token) return navigate('/login');
    setIsLoading(true);
    try {
      const [repairsRes, logsRes] = await Promise.all([
        api.get('/api/assigner/repairs-for-assignment', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/assigner/assignment-log', {
          headers: { Authorization: `Bearer ${token}` },
          params: { assignmentType: 'REPAIR' }
        })
      ]);

      const pending = repairsRes.data.content || repairsRes.data || [];
      const assigned = (logsRes.data.content || logsRes.data || []).map(log => ({
        id: log.repairRequestId,
        userId: log.userId,
        userName: log.userName,
        userAddress: log.userAddress,
        shopId: log.shopId,
        shopName: log.shopName,
        shopAddress: log.shopAddress,
        price: log.price,
        status: log.status || 'ASSIGNED',
        createdAt: log.createdAt,
      }));

      const merged = [...pending, ...assigned];
      const unique = Array.from(new Map(merged.map(r => [r.id, r])).values());
      setRepairs(unique);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        Swal.fire({ icon: 'error', title: 'Failed to load repairs', toast: true, position: 'top-end' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate]);

  
  const fetchDeliveryPersons = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get('/api/assigner/delivery-persons', { headers: { Authorization: `Bearer ${token}` } });
      setDeliveryPersons(res.data.content || res.data || []);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchRepairs();
    fetchDeliveryPersons();
  }, [fetchRepairs, fetchDeliveryPersons]);

  
  const assignRepair = async (deliveryId) => {
    if (!selectedRepair?.id || !deliveryId) return;

    setIsAssigning(true);
    try {
      await api.post('/api/assigner/assign-repair', {
        repairRequestId: selectedRepair.id,
        deliveryId,
        notes
      }, { headers: { Authorization: `Bearer ${token}` } });

      Swal.fire({
        icon: 'success',
        title: 'Assigned!',
        text: 'Repair request assigned successfully',
        toast: true,
        position: 'top-end',
        timer: 2000
      });

      setSelectedRepair(null);
      setNotes('');
      fetchRepairs();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Assignment Failed',
        text: err.response?.data?.message || 'Please try again',
        toast: true,
        position: 'top-end'
      });
    } finally {
      setIsAssigning(false);
    }
  };

 
  const filteredRepairs = repairs.filter(repair =>
    JSON.stringify(repair).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage);
  const currentRepairs = filteredRepairs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusGradient = (status) => {
    const gradients = {
      PENDING: 'from-yellow-400 to-amber-500',
      PENDING_PICKUP: 'from-orange-400 to-red-500',
      ASSIGNED: 'from-purple-500 to-pink-600',
      IN_TRANSIT: 'from-cyan-500 to-blue-600',
      IN_PROGRESS: 'from-indigo-500 to-purple-600',
      COMPLETED: 'from-emerald-500 to-teal-600',
      default: 'from-gray-400 to-gray-600'
    };
    return gradients[status] || gradients.default;
  };

  const formatPrice = (price) => price ? `${price.toLocaleString()} EGP` : '0 EGP';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-emerald-950/30 pt-6 lg:pl-72 transition-all duration-500">
      <div className="max-w-7xl mx-auto  px-4 sm:px-6 lg:px-8 py-8">

       
        <div className="mb-10  text-center lg:text-left">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-4 justify-center lg:justify-start">
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-xl">
              <FiTool size={36} />
            </div>
            Repairs for Assignment
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
            Assign repair pickup & delivery tasks to agents
          </p>
        </div>

        
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="relative">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by ID, user, shop, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-12 py-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-gray-800 dark:text-white"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                <FiXCircle size={22} />
              </button>
            )}
          </div>

          <div className="flex gap-4 justify-center lg:justify-end">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg px-6 py-4 border border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Repairs</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{repairs.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg px-6 py-4 border border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Filtered</p>
              <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{filteredRepairs.length}</p>
            </div>
          </div>
        </div>

      
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 animate-pulse border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between mb-4">
                  <div className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                  <div className="h-10 w-24 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : currentRepairs.length === 0 ? (
          <div className="text-center py-20">
            <FiTool size={90} className="mx-auto text-gray-300 dark:text-gray-700 mb-6" />
            <p className="text-2xl text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No repairs match your search' : 'No pending repair requests'}
            </p>
          </div>
        ) : (
          <>
           
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {currentRepairs.map((repair) => (
                <div
                  key={repair.id}
                  className="group bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:-translate-y-2"
                >
                 
                  <div className={`h-2 bg-gradient-to-r ${getStatusGradient(repair.status)}`} />

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            #{repair.id?.slice(-8) || 'N/A'}
                          </h3>
                          <button onClick={() => copyToClipboard(repair.id)} className="opacity-0 group-hover:opacity-100 transition p-1">
                            <FiCopy className="text-emerald-600 dark:text-emerald-400" />
                          </button>
                        </div>
                        <span className={`inline-block mt-2 px-4 py-2 rounded-full text-sm font-bold text-white shadow-md bg-gradient-to-r ${getStatusGradient(repair.status)}`}>
                          {repair.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(repair.price)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      {repair.userName && (
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                          <FiUser className="text-emerald-600" />
                          <span>{repair.userName}</span>
                        </div>
                      )}
                      {repair.shopName && (
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                          <FaStore className="text-teal-600" />
                          <span>{repair.shopName}</span>
                        </div>
                      )}
                      {repair.userAddress && (
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                          <FiMapPin className="text-emerald-500" />
                          <span className="truncate">{repair.userAddress.street}, {repair.userAddress.city}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedRepair(repair)}
                      className="mt-6 w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-4 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <FiTool /> Assign Repair
                    </button>
                  </div>
                </div>
              ))}
            </div>

            
            {totalPages > 1 && (
              <div className="flex justify-center gap-3 flex-wrap">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 flex items-center gap-2"
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
                  className="px-6 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 flex items-center gap-2"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}

       
        {selectedRepair && (
          <Modal onClose={() => { setSelectedRepair(null); setNotes(''); }} title="Assign Repair Request" darkMode={darkMode}>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Repair Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>ID:</strong> {selectedRepair.id}</div>
                  <div><strong>Price:</strong> {formatPrice(selectedRepair.price)}</div>
                  <div><strong>User:</strong> {selectedRepair.userName || 'N/A'}</div>
                  <div><strong>Shop:</strong> {selectedRepair.shopName || 'N/A'}</div>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Device is fragile, call before arrival..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Select Delivery Person</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {deliveryPersons.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No agents available</p>
                  ) : (
                    deliveryPersons.map(person => (
                      <button
                        key={person.id}
                        onClick={() => assignRepair(person.id)}
                        disabled={isAssigning}
                        className="w-full text-left p-4 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded-xl border border-emerald-200 dark:border-emerald-700 transition-all"
                      >
                        <div className="font-medium">{person.name}</div>
                        <div className="text-sm text-emerald-600 dark:text-emerald-400">ID: {person.id}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {isAssigning && (
                <div className="flex items-center justify-center gap-3 text-emerald-600">
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Assigning repair...</span>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default RepairsForAssignment;