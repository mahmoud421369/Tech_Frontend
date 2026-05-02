import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMapPin, FiUser, FiSearch,
  FiCopy, FiUsers, FiTrendingUp, FiClock,
  FiChevronRight, FiChevronLeft, FiPhone, FiMail, FiCheck, FiInfo, FiEye
} from 'react-icons/fi';
import { RiMessage2Line, RiPhoneLine } from '@remixicon/react';
import Swal from 'sweetalert2';
import api from '../api';
import Modal from '../components/Modal';


const ROWS_OPTIONS = [6, 12, 24, 50];

const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, timerProgressBar: true });

const DeliveryPersons = ({ darkMode }) => {
  const navigate = useNavigate();

  const [persons, setPersons]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [currentPage, setCurrentPage]   = useState(1);
  const [rowsPerPage, setRowsPerPage]   = useState(12);
  const [searchTerm, setSearchTerm]     = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);

  useEffect(() => { document.title = 'Assigner - Delivery Agents'; }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setCurrentPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('ID copied to clipboard', 'success');
  };

  const fetchDeliveryPersons = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const res = await api.get('/api/assigner/delivery-persons', { headers: { Authorization: `Bearer ${token}` } });
      setPersons(res.data.content || res.data || []);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.clear(); navigate('/login'); }
      else showToast('Could not fetch delivery persons', 'error');
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchDeliveryPersons(); }, [fetchDeliveryPersons]);

  const filtered = useMemo(() =>
    persons.filter(p =>
      p.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.phone?.includes(debouncedSearch)
    ), [persons, debouncedSearch]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated  = useMemo(() => filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filtered, currentPage, rowsPerPage]);

  const stats = useMemo(() => ({
    total: persons.length,
    busy: persons.filter(p => (p.activeAssignments || 0) > 0).length,
    available: persons.filter(p => (p.activeAssignments || 0) === 0).length,
  }), [persons]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">

       
       
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">Personnel Management</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Delivery Agents</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monitor and manage your active delivery workforce</p>
          </div>
          <button 
            onClick={fetchDeliveryPersons}
            className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Refresh Agents
          </button>
        </div>

      
      
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 flex items-center justify-between group hover:shadow-lg transition-all duration-500">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Agents</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stats.total}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <FiUsers size={24} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 flex items-center justify-between group hover:shadow-lg transition-all duration-500">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Busy Agents</p>
              <p className="text-3xl font-black text-amber-600 tracking-tighter">{stats.busy}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <FiClock size={24} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 flex items-center justify-between group hover:shadow-lg transition-all duration-500">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Available</p>
              <p className="text-3xl font-black text-emerald-600 tracking-tighter">{stats.available}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <FiCheck size={24} />
            </div>
          </div>
        </div>

       
       
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            
            
            <div className="relative flex-1 group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by Name, Email, or Phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/10 focus:border-lime-200 transition-all"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Show</span>
                <div className="relative group">
                  <select
                    value={rowsPerPage}
                    onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="appearance-none pl-5 pr-12 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-lime-500/5 focus:border-lime-200 cursor-pointer transition-all"
                  >
                    {ROWS_OPTIONS.map(n => <option key={n} value={n} className="dark:bg-gray-800">{n}</option>)}
                  </select>
                  <FiChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-lime-500 transition-colors rotate-90" size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rows</span>
              </div>
            </div>
          </div>
        </div>

        
        
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Agent Details</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Active Tasks</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Contact Info</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-6 py-6"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center">
                      <FiUsers className="mx-auto text-gray-200 dark:text-gray-700 mb-4" size={48} />
                      <p className="text-gray-400 font-medium">No delivery agents found</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(person => {
                    const isBusy = (person.activeAssignments || 0) > 0;
                    return (
                      <tr key={person.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:text-lime-500 transition-colors">
                              <FiUser size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-800 dark:text-gray-100 leading-none mb-1.5">{person.name}</p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-gray-400">#{person.id?.slice(-8)}</span>
                                <button onClick={() => copyToClipboard(person.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-lime-500 transition-all">
                                  <FiCopy size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${isBusy ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'}`}>
                            <span className={`w-1 h-1 rounded-full ${isBusy ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            {isBusy ? 'Busy' : 'Available'}
                          </span>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FiTrendingUp className={`text-${isBusy ? 'amber' : 'emerald'}-500`} size={14} />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{person.activeAssignments || 0} tasks</span>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <FiMail size={12} className="text-lime-500" />
                              {person.email}
                            </div>
                            {/* <div className="flex items-center gap-2 text-xs text-gray-500">
                              <FiPhone size={12} className="text-lime-500" />
                              0{person.phone}
                            </div> */}
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedPerson(person)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-lime-500 hover:text-white transition-all shadow-sm"
                          >
                            <FiEye size={14} />
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        
        
          {totalPages > 1 && (
            <div className="px-6 py-5 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Showing <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filtered.length)}</span> of <span className="text-gray-900 dark:text-white">{filtered.length}</span> agents
              </p>
              
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <FiChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all ${currentPage === p ? 'bg-lime-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-lime-500 hover:text-lime-500'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        
        
        {selectedPerson && (
          <Modal onClose={() => setSelectedPerson(null)} title="Agent Information" darkMode={darkMode}>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-lime-500 border border-gray-100 dark:border-gray-700">
                  <FiUser size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{selectedPerson.name}</h2>
                  <p className="text-xs font-mono text-gray-400 mt-1 uppercase">ID: {selectedPerson.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Communication</span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <FiMail className="text-lime-500" /> {selectedPerson.email}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <FiPhone className="text-lime-500" /> 0{selectedPerson.phone}
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Workload</span>
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-black text-gray-900 dark:text-white">{selectedPerson.activeAssignments || 0}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-tight">Active tasks<br/>Assigned</div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Base Location</span>
                <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  <FiMapPin className="text-red-500 mt-1 flex-shrink-0" />
                  {selectedPerson.address || 'No base address registered for this agent.'}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #374151; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
};

export default DeliveryPersons;