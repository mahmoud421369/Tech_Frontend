import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUser, FiPhone, FiMail, FiMapPin, FiCheckCircle, 
  FiXCircle, FiClock, FiSearch, FiCopy, FiUsers, 
  FiTrendingUp, FiAlertCircle, FiRefreshCw, 
  FiChevronRight,
  FiChevronLeft
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';

const DeliveryPersons = ({ darkMode }) => {
  const navigate = useNavigate();
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const itemsPerPage = 6;


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

 
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      toast: true,
      icon: 'success',
      title: 'Copied!',
      text: 'Delivery Person ID copied',
      position: 'top-end',
      timer: 1500,
      showConfirmButton: false,
    });
  };


  const fetchDeliveryPersons = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/api/assigner/delivery-persons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPersons(res.data.content || res.data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Load',
          text: 'Could not fetch delivery persons',
          toast: true,
          position: 'top-end',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDeliveryPersons();
  }, [fetchDeliveryPersons]);

 
  const filteredPersons = persons.filter(person =>
    person.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    person.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    person.phone?.includes(debouncedSearchTerm)
  );

 
  const totalPages = Math.ceil(filteredPersons.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentPersons = filteredPersons.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-emerald-950/30 pt-8 lg:pl-72 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      
        <div className="mb-10 text-center lg:text-left">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-4 justify-center lg:justify-start">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white">
              <FiUsers size={32} />
            </div>
            Delivery Persons
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
            Manage and monitor all active delivery agents
          </p>
        </div>

        
        <div className="mb-8 max-w-2xl mx-auto lg:mx-0">
          <div className="relative">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-12 py-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-gray-800 dark:text-white placeholder-gray-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition"
              >
                <FiXCircle size={22} />
              </button>
            )}
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 text-center lg:text-left">
            {filteredPersons.length} delivery person{filteredPersons.length !== 1 ? 's' : ''} found
          </p>
        </div>

       
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                  <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : currentPersons.length === 0 ? (
          <div className="text-center py-20">
            <FiUsers size={80} className="mx-auto text-gray-300 dark:text-gray-700 mb-6" />
            <p className="text-xl text-gray-600 dark:text-gray-400">No delivery persons found</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {currentPersons.map((person) => (
                <div
                  key={person.id}
                  className="group bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:-translate-y-2"
                >
                
                  <div className={`h-2 bg-gradient-to-r ${
                    person.activate 
                      ? 'from-emerald-500 to-teal-600' 
                      : 'from-gray-400 to-gray-600'
                  }`} />

                  <div className="p-6">
                 
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-2xl">
                          <FiUser className="text-emerald-600 dark:text-emerald-400" size={28} />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                            {person.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {person.id}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(person.id)}
                        className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Copy ID"
                      >
                        <FiCopy className="text-emerald-600 dark:text-emerald-400" size={18} />
                      </button>
                    </div>

                  
                    <div className="mb-5">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                        person.activate
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                      }`}>
                        {person.activate ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
                        {person.activate ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    
                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-3">
                        <FiMail className="text-emerald-600 dark:text-emerald-400" size={18} />
                        <span className="text-sm truncate">{person.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiPhone className="text-emerald-600 dark:text-emerald-400" size={18} />
                        <span className="text-sm">0{person.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FiMapPin className="text-emerald-600 dark:text-emerald-400" size={18} />
                        <span className="text-sm truncate">{person.address || 'No address'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {person.verified ? (
                          <FiCheckCircle className="text-green-500" size={18} />
                        ) : (
                          <FiXCircle className="text-red-500" size={18} />
                        )}
                        <span className="text-sm">{person.verified ? 'Verified' : 'Not Verified'}</span>
                      </div>
                    </div>

                   
                    <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm">
                        <FiTrendingUp className="text-emerald-600 dark:text-emerald-400" />
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {person.activeAssignments || 0}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">Active Tasks</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FiClock size={14} />
                        Joined {person.createdAt ? new Date(person.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 flex-wrap">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-5 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <FiChevronLeft /> 
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-12 h-12 rounded-xl font-medium transition-all ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                          : 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-5 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                   <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeliveryPersons;