import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiClipboard, FiUser, FiClock, FiPackage,
  FiTool, FiChevronLeft, FiChevronRight, FiPhone,
  FiCheck, FiSearch, FiInfo, FiMapPin
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../api';
import Modal from '../components/Modal';
import { RiMap2Line, RiPhoneLine, RiStore2Line, RiUser2Line } from '@remixicon/react';



const ROWS_OPTIONS = [10, 25, 50, 100];

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Assignments' },
  { value: 'ORDER', label: 'Orders' },
  { value: 'REPAIR', label: 'Repairs' },
];




const TYPE_STYLE = {
  ORDER: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
    label: 'Order'
  },
  REPAIR: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-700',
    text: 'text-purple-700 dark:text-purple-400',
    dot: 'bg-purple-500',
    label: 'Repair'
  },
};

const getTypeStyle = (t) =>
  TYPE_STYLE[t] || {
    bg: 'bg-gray-50 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-600 dark:text-gray-400',
    dot: 'bg-gray-400',
    label: 'Unknown'
  };

const showToast = (text, icon) =>
  Swal.fire({
    text,
    icon,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });

const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return (
    <div className="flex flex-col">
      <span className="font-bold text-gray-800 dark:text-gray-200">{d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
      <span className="text-[10px] text-gray-400 font-mono tracking-tighter">{d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
};

const formatAddress = (addr) => {
  if (!addr) return 'N/A';
  const parts = [addr.building, addr.street, addr.city, addr.state]
    .filter(Boolean)
    .join(', ');
  return parts || 'N/A';
};



const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm p-5 flex items-center justify-between group hover:shadow-lg hover:shadow-lime-500/5 transition-all duration-500">
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
    </div>
    <div className={`w-14 h-14 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-500 group-hover:scale-110 transition-transform duration-500`}>
      <Icon size={24} />
    </div>
  </div>
);



const AssignmentLogs = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => { document.title = 'Assigner - Logs'; }, []);

  const fetchLogs = useCallback(async () => {
    if (!token) return navigate('/login');
    try {
      setLoading(true);
      const res = await api.get('/api/assigner/assignment-log', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (res.data.content || res.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setLogs(data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        showToast('Failed to load logs', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const stats = useMemo(() => ({
    total: logs.length,
    orders: logs.filter(l => l.assignmentType === 'ORDER').length,
    repairs: logs.filter(l => l.assignmentType === 'REPAIR').length,
    completed: logs.filter(l => l.status === 'COMPLETED').length,
  }), [logs]);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const matchesType = typeFilter === 'ALL' || l.assignmentType === typeFilter;
      const searchable = [
        l.orderId, l.repairRequestId, l.userName, l.shopName,
        l.deliveryId, l.assignerName, l.userPhone
      ].join(' ').toLowerCase();
      const matchesSearch = !searchTerm || searchable.includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [logs, searchTerm, typeFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = useMemo(() => filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filtered, currentPage, rowsPerPage]);

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

  
  html[dir="rtl"],
  html[dir="rtl"] body,
  html[dir="rtl"] * {
    font-family: 'Cairo', sans-serif !important;
  }

  
  * {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db transparent;
  }
  *::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  *::-webkit-scrollbar-track {
    background: transparent;
  }
  *::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 999px;
  }
  *::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }

  .lime-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
  .lime-scroll::-webkit-scrollbar-track { background: transparent; }
  .lime-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
  .lime-scroll { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
  .tabs-scroll::-webkit-scrollbar { display: none; }
  .tabs-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  .leaflet-container { font-family: inherit; }
  [dir="rtl"] .rtl-flip { transform: scaleX(-1); }
`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">

      <style>{STYLES}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">



        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">History & Tracking</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Assignment Logs</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review all your previous assignments in detail</p>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <button
              onClick={fetchLogs}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all"
            >
              Refresh Data
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Grand Total" value={stats.total} icon={FiClipboard} color="lime" />
          <StatCard label="Orders" value={stats.orders} icon={FiPackage} color="blue" />
          <StatCard label="Repairs" value={stats.repairs} icon={FiTool} color="purple" />
          <StatCard label="Completed" value={stats.completed} icon={FiCheck} color="emerald" />
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">


            <div className="relative flex-1 group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by ID, User, Agent, or Shop..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/10 focus:border-lime-200 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">


              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Type</span>
                <div className="relative group">
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                    className="appearance-none pl-5 pr-12 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-lime-500/5 focus:border-lime-200 cursor-pointer transition-all"
                  >
                    {FILTER_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} className="dark:bg-gray-800">{opt.label}</option>
                    ))}
                  </select>
                  <FiChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-lime-500 transition-colors rotate-90" size={16} />
                </div>
              </div>



              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rows</span>
                <div className="relative group">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="appearance-none pl-5 pr-12 py-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-lime-500/5 focus:border-lime-200 cursor-pointer transition-all"
                  >
                    {ROWS_OPTIONS.map(n => (
                      <option key={n} value={n} className="dark:bg-gray-800">{n}</option>
                    ))}
                  </select>
                  <FiChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-lime-500 transition-colors rotate-90" size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/30 text-center border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Shop</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-6 py-6"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                      <FiClipboard className="mx-auto text-gray-200 dark:text-gray-700 mb-4" size={48} />
                      <p className="text-gray-400 font-medium">No logs found matching your criteria</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((log) => {
                    const ts = getTypeStyle(log.assignmentType);
                    const refId = log.assignmentType === 'ORDER' ? log.orderId : log.repairRequestId;

                    return (
                      <tr key={log.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                        <td className="px-4 py-3 text-xs text-emerald-400 text-center whitespace-nowrap">{formatDate(log.createdAt)}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="space-y-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${ts.bg} ${ts.border} ${ts.text}`}>
                              {ts.label}
                            </span>

                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2 font-bold text-gray-500  dark:text-gray-100 text-xs">
                            <FiUser size={12} className="text-gray-400" />
                            {log.userName || 'Not Specified'}
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-950 dark:text-gray-300">
                            <FaStore size={12} className="text-gray-950" />
                            {log.shopName || 'Not Specified'}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex justify-center items-center">
                            <button
                              title='View Details'
                              onClick={() => setSelectedLog(log)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-transparent border-2 border-gray-100 dark:border-transparent dark:bg-gray-700 text-gray-400 dark:text-gray-300 text-xs font-bold transition-all"
                            >
                              <FiInfo size={14} />

                            </button>
                          </div>

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
                Showing <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filtered.length)}</span> of <span className="text-gray-900 dark:text-white">{filtered.length}</span> entries
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronLeft size={18} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => {
                  if (totalPages <= 5) return true;
                  return Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages;
                }).map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all ${currentPage === p
                        ? 'bg-lime-500 text-white shadow-lg shadow-lime-500/30'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-lime-500 hover:text-lime-500'
                        }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>



        {selectedLog && (
          <Modal
            onClose={() => setSelectedLog(null)}
            title="Assignment Details"
            darkMode={darkMode}
          >
            <div className="space-y-6 bg-white">


              <div className="flex flex-col flex-wrap p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-100 dark:border-gray-700">
                <div className="space-y-1 ">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reference ID</p>
                  <p className="text-sm font-mono font-bold text-gray-950 dark:text-white tracking-tight">
                    #{(selectedLog.assignmentType === 'ORDER' ? selectedLog.orderId : selectedLog.repairRequestId)}
                  </p>
                </div><br />
                <div className="text-left space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Log Type</p>
                  <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${getTypeStyle(selectedLog.assignmentType).bg} ${getTypeStyle(selectedLog.assignmentType).border} ${getTypeStyle(selectedLog.assignmentType).text}`}>
                    {selectedLog.assignmentType}
                  </span>
                </div>
              </div>



              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">


                <div className="p-5 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-50 dark:border-gray-700 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center text-gray-500">
                      <FiUser size={16} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">Customer Info</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{selectedLog.userName || 'N/A'}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FiPhone size={12} className="text-lime-500" />
                      {selectedLog.userPhone || 'No phone provided'}
                    </div>
                  </div>
                </div>



                <div className="p-5 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-50 dark:border-gray-700 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center text-gray-500">
                      <FiPackage size={16} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">Assignment Info</span>
                  </div>
                  <div className="space-y-2">
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <FiCheck size={12} className="text-emerald-500" />
                      Assigned by: <br /><span className='font-bold font-sans text-gray-950' >{selectedLog.assignerName || 'System'}</span>
                    </div>
                  </div>
                </div>
              </div>



              <div className="space-y-4">
                <div className="p-5 bg-gray-50  dark:bg-gray-800 rounded-md   space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-900/20 flex items-center justify-center text-gray-500">
                      <FaStore size={14} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">Shop Details</span>
                  </div>
                  <div className="space-y-1 ml-5">
                    <span className="text-xs font-bold  tracking-wider text-gray-950 flex gap-3 items-center"><RiStore2Line size={12} />Store Name</span>

                    <p className="text-xs ml-6 font-semibold text-orange-800 dark:text-gray-100">{selectedLog.shopName || 'Not Specified'}</p>

                  </div>

                  <div className="space-y-1 ml-5">
                    <span className="text-xs font-bold  tracking-wider text-gray-950 flex gap-3 items-center"><RiPhoneLine size={12} />Phone</span>

                    <p className="text-xs ml-6 font-semibold text-orange-800 dark:text-gray-100">{selectedLog.shopPhone || 'Not Specified'}</p>

                  </div>

                  <div className="space-y-1 ml-5">
                    <span className="text-xs font-bold  tracking-wider text-gray-950 flex gap-3 items-center"><RiMap2Line size={12} />Address</span>

                    <p className="text-xs ml-6 font-semibold text-orange-800 dark:text-gray-100">{selectedLog.shopAddress?.city || 'Not Specified'}</p>

                  </div>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-lime-900/10 rounded-md   space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 ">
                      <FiMapPin size={16} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">Customer Details</span>
                  </div>

                  <div className="space-y-1 ml-5">
                    <span className="text-xs font-bold  tracking-wider text-gray-950 flex gap-3 items-center"><RiUser2Line size={12} />Customer Name</span>

                    <p className="text-xs ml-6 font-semibold text-orange-800 dark:text-gray-100">{selectedLog.userName || 'Not Specified'}</p>

                  </div>

                  <div className="space-y-1 ml-5">
                    <span className="text-xs font-bold  tracking-wider text-gray-950 flex gap-3 items-center"><RiPhoneLine size={12} />Phone</span>

                    <p className="text-xs ml-6 font-semibold text-orange-800 dark:text-gray-100">{selectedLog.userPhone || 'Not Specified'}</p>

                  </div>

                  <div className="space-y-1 ml-5">
                    <span className="text-xs font-bold  tracking-wider text-gray-950 flex gap-3 items-center"><RiMap2Line size={12} />Address</span>

                    <p className="text-xs ml-6 font-semibold text-orange-800 dark:text-gray-100">  {formatAddress(selectedLog.userAddress)}</p>

                  </div>


                </div>
              </div>

              <div className="pt-4 flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                <FiClock size={12} />
                Recorded on: {new Date(selectedLog.createdAt).toLocaleString()}
              </div>
            </div>
          </Modal>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-thin::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb {
          background: #374151;
        }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #84cc16;
        }
      `}} />
    </div>
  );
};

export default AssignmentLogs;