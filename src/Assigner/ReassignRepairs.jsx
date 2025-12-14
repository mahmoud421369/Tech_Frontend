import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiTool, FiSearch, FiUser, FiMapPin, FiCopy,
  FiClipboard, FiXCircle, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';
import Modal from '../components/Modal';

const ReassignRepairs = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [repairs, setRepairs] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id);
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: 'Repair ID copied to clipboard',
      toast: true,
      position: 'top-end',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const fetchData = useCallback(async () => {
    if (!token) return navigate('/login');

    try {
      setLoading(true);
      const [repairsRes, logsRes, deliveryRes] = await Promise.all([
        api.get('/api/assigner/repairs-for-assignment', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/assigner/assignment-log', {
          headers: { Authorization: `Bearer ${token}` },
          params: { assignmentType: 'REPAIR' }
        }),
        api.get('/api/assigner/delivery-persons', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const currentRepairs = (repairsRes.data.content || repairsRes.data || []);
      const assignedRepairs = (logsRes.data.content || logsRes.data || []).map(log => ({
        id: log.repairRequestId,
        userId: log.userId,
        userName: log.userName,
        userAddress: log.userAddress,
        shopId: log.shopId,
        shopName: log.shopName,
        shopAddress: log.shopAddress,
        status: log.status || 'ASSIGNED',
        createdAt: log.createdAt,
        deliveryId: log.deliveryId
      }));

      const merged = [...currentRepairs, ...assignedRepairs];
      const unique = Array.from(new Map(merged.map(r => [r.id, r])).values());
      setRepairs(unique);
      setDeliveryPersons(deliveryRes.data.content || deliveryRes.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to load data',
          toast: true,
          position: 'top-end'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  const reassignRepair = async (newDeliveryId) => {
    if (!selectedRepair?.id || !newDeliveryId) return;

    try {
      await api.put(`/api/assigner/reassign-repair/${selectedRepair.id}`, {
        newDeliveryId,
        notes
      }, { headers: { Authorization: `Bearer ${token}` } });

      Swal.fire({
        icon: 'success',
        title: 'Reassigned!',
        text: 'Repair successfully reassigned',
        toast: true,
        position: 'top-end',
        timer: 2000
      });

      setSelectedRepair(null);
      setNotes('');
      fetchData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Reassignment Failed',
        text: err.response?.data?.message || 'Please try again',
        toast: true,
        position: 'top-end'
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRepairs = repairs.filter(r =>
    searchTerm === '' ||
    r.id?.toString().includes(searchTerm) ||
    r.userAddress?.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.shopAddress?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage);
  const currentRepairs = filteredRepairs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusGradient = (status) => {
    const map = {
      PENDING: 'from-yellow-400 to-amber-500',
      PENDING_PICKUP: 'from-orange-400 to-red-500',
      ASSIGNED: 'from-purple-500 to-pink-600',
      IN_TRANSIT: 'from-cyan-500 to-blue-600',
      IN_PROGRESS: 'from-indigo-500 to-purple-600',
      COMPLETED: 'from-emerald-500 to-teal-600',
      default: 'from-gray-400 to-gray-600'
    };
    return map[status] || map.default;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 pt-6 lg:pl-72 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      
        <div className="mb-12 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white flex items-center gap-5 justify-center lg:justify-start">
            <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl text-white shadow-2xl">
              <FiTool size={40} />
            </div>
            Reassign Repairs
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Transfer any repair pickup/delivery task to a new agent
          </p>
        </div>

     
        <div className="mb-10 flex justify-center lg:justify-start">
          <div className="relative max-w-md w-full">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search repairs..."
              className="w-full pl-14 pr-12 py-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-gray-800 dark:text-white text-lg"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 transition"
              >
                <FiXCircle size={22} />
              </button>
            )}
          </div>
        </div>

        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-8 animate-pulse border border-gray-200 dark:border-gray-800">
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full w-40 mb-4"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                </div>
              </div>
            ))}
          </div>
        ) : currentRepairs.length === 0 ? (
          <div className="text-center py-20">
            <FiTool size={100} className="mx-auto text-gray-300 dark:text-gray-700 mb-6" />
            <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No repairs match your search' : 'No repairs available for reassignment'}
            </h3>
          </div>
        ) : (
          <>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {currentRepairs.map((repair) => (
                <div
                  key={repair.id}
                  className="group bg-white dark:bg-gray-900 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:-translate-y-3 cursor-pointer"
                  onClick={() => setSelectedRepair(repair)}
                >
                  <div className={`h-2 bg-gradient-to-r ${getStatusGradient(repair.status)}`} />

                  <div className="p-7">
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                          #{repair.id?.slice(-8)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(repair.id);
                            }}
                            className="text-gray-500 hover:text-emerald-600 transition"
                          >
                            <FiCopy size={18} />
                          </button>
                        </h3>
                        <span className={`inline-block mt-3 px-5 py-2 rounded-full text-white font-bold text-sm shadow-lg bg-gradient-to-r ${getStatusGradient(repair.status)}`}>
                          {repair.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 text-sm">
                      {repair.userName && (
                        <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                          <FiUser className="text-emerald-600" size={18} />
                          <span>{repair.userName}</span>
                        </div>
                      )}

                      {repair.userAddress && (
                        <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                          <FiMapPin className="text-teal-600 mt-1" size={18} />
                          <div className="text-xs">
                            <div className="font-medium text-gray-800 dark:text-gray-200">Pickup</div>
                            <div>{repair.userAddress.street}, {repair.userAddress.city}</div>
                          </div>
                        </div>
                      )}

                      {repair.shopName && (
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                          <FiTool className="text-emerald-600" size={18} />
                          <span>{repair.shopName}</span>
                        </div>
                      )}
                    </div>

                    <button className="mt-6 w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg">
                      Reassign Repair
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

        
        {selectedRepair && (
          <Modal onClose={() => { setSelectedRepair(null); setNotes(''); }} title="Reassign Repair" darkMode={darkMode}>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                  Repair #{selectedRepair.id?.slice(-8)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <FiUser className="text-emerald-600" />
                    <span className="text-gray-700 dark:text-gray-300">{selectedRepair.userName || 'Customer'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiTool className="text-teal-600" />
                    <span className="text-gray-700 dark:text-gray-300">{selectedRepair.shopName || 'Repair Shop'}</span>
                  </div>
                </div>
                {selectedRepair.userAddress && (
                  <div className="mt-4 flex items-start gap-3 text-sm">
                    <FiMapPin className="text-emerald-600 mt-1" />
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">Pickup Address</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {selectedRepair.userAddress.street}, {selectedRepair.userAddress.city}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Reason for reassignment, special instructions..."
                  className="w-full px-5 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Select New Delivery Agent</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {deliveryPersons.length === 0 ? (
                    <p className="text-gray-500 text-center col-span-2 py-8">No delivery agents available</p>
                  ) : (
                    deliveryPersons.map((person) => (
                      <button
                        key={person.id}
                        onClick={() => reassignRepair(person.id)}
                        className="p-5 bg-white dark:bg-gray-900 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-600 hover:shadow-lg transition-all text-left"
                      >
                        <div className="font-bold text-gray-800 dark:text-white">{person.name || 'Unnamed Agent'}</div>
                        <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">ID: {person.id}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ReassignRepairs;