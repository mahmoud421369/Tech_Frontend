
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiInfo,FiUser, FiPhone, FiMail, FiMapPin, FiCheckCircle, FiXCircle, FiBell, FiClock, FiSearch, FiChevronLeft, FiChevronRight, FiCopy } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';


const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);


const PersonsSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        <div className="h-6 w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-10 w-64 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, idx) => (
        <div
          key={idx}
          className="p-5 rounded-xl shadow-md bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-5 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DeliveryPersons = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

 
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleSearchChange = useCallback(
    debounce((value) => {
      setDebouncedSearchTerm(value);
    }, 300),
    []
  );

  const copyToClipboard = useCallback((id) => {
    navigator.clipboard.writeText(id).then(
      () => {
        Swal.fire({
          title: 'Success',
          text: 'Delivery ID copied to clipboard!',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      },
      (err) => {
        console.error('Copy failed:', err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to copy delivery ID',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    );
  }, [darkMode]);

  const fetchDeliveryPersons = useCallback(async () => {
    if (!token) {
      Swal.fire({
        title: 'Error',
        text: 'No authentication token found. Please log in.',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      navigate('/login');
      return [];
    }

    const controller = new AbortController();
    try {
      setLoading(true);
      const res = await api.get('/api/assigner/delivery-persons', {
        signal: controller.signal,
      });
      return res.data.content || [];
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching delivery persons:', err.response?.data || err.message);
        Swal.fire({
          title: 'Error',
          text: err.response?.data?.message || 'Failed to fetch delivery persons',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          navigate('/login');
        }
        return [];
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [darkMode, navigate, token]);

  useEffect(() => {
    let isMounted = true;
    const loadPersons = async () => {
      const result = await fetchDeliveryPersons();
      if (isMounted) {
        setPersons(result);
      }
    };
    loadPersons();
    return () => {
      isMounted = false;
    };
  }, [fetchDeliveryPersons]);

  useEffect(() => {
    handleSearchChange(searchTerm);
  }, [searchTerm, handleSearchChange]);

  const filteredPersons = persons.filter(
    (p) =>
      p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      p.phone.includes(debouncedSearchTerm)
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPersons = filteredPersons.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPersons.length / itemsPerPage);

  const getPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      buttons.push(1);
      if (startPage > 2) buttons.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push('...');
      buttons.push(totalPages);
    }

    return buttons;
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300 animate-fade-in">
      <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-2xl max-w-8xl mx-auto shadow-md">
        <div className="bg-white dark:bg-gray-800 border dark:border-none p-4 rounded-2xl mb-6 flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <FiUser /> Delivery Persons
          </h2>
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <FiXCircle />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <PersonsSkeleton darkMode={darkMode} />
        ) : currentPersons.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPersons.map((person, idx) => (
                <div
                  key={person.id || idx}
                  className="p-5 bg-white dark:bg-gray-950 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FiUser className="text-indigo-500" />
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {person.name}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        person.activate
                          ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {person.activate ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <FiInfo className="text-indigo-500" />
                      <span>ID: {person.id}</span>
                      <button
                        onClick={() => copyToClipboard(person.id)}
                        className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                        title="Copy ID"
                      >
                        <FiCopy />
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                          Copy ID
                        </span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiMail className="text-indigo-500" /> {person.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <FiPhone className="text-indigo-500" /> 0{person.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <FiMapPin className="text-indigo-500" /> {person.address || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      {person.verified ? (
                        <FiCheckCircle className="text-green-500" />
                      ) : (
                        <FiXCircle className="text-red-500" />
                      )}
                      {person.verified ? 'Verified' : 'Not Verified'}
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock className="text-indigo-500" /> Created:{' '}
                      {person.createdAt
                        ? new Date(person.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <FiBell className="text-indigo-500" /> Notifications:{' '}
                      {person.notificationHistory || 'No history'}
                    </div>
                  </div>
                  <div className="mt-4 border-t dark:border-gray-800 pt-3 text-xs text-gray-600 dark:text-gray-400 space-y-2">
                    <div className="flex justify-between">
                      <span>Active Assignments:</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {person.activeAssignments || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <FiChevronLeft /> Prev
                </button>

                {getPaginationButtons().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                      page === '...' ? 'cursor-default' : currentPage === page ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                    }`}
                    disabled={page === '...'}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-10">
            <FiUser className="text-6xl mx-auto mb-4 text-indigo-500 dark:text-indigo-400" />
            <p className="text-lg">No delivery persons found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPersons;
