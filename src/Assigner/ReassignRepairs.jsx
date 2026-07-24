import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiTool, FiSearch, FiUser, FiMapPin, FiCopy,
  FiTruck, FiPackage, FiXCircle, FiChevronLeft, FiChevronRight,
  FiCheck, FiClock, FiEye, FiInfo, FiClipboard, FiUserCheck, FiPhone,
  FiDollarSign
} from 'react-icons/fi';
import { RiStore2Line } from '@remixicon/react';
import Swal from 'sweetalert2';
import api from '../api';
import Modal from '../components/Modal';
import { RiMapPin2Line } from 'react-icons/ri';



const ROWS_OPTIONS = [10, 25, 50];



const STATUS_STYLE = {
  PENDING: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
  SUBMITTED: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
  QUOTE_PENDING: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  PENDING_PICKUP: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  ASSIGNED: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
  IN_TRANSIT: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  IN_PROGRESS: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-700', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
  COMPLETED: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
};

const getStatusStyle = (s) =>
  STATUS_STYLE[s] || { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' };

const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, timerProgressBar: true });

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
  return [addr.street, addr.city, addr.state].filter(Boolean).join(', ') || 'Not specified';
};




const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-md shadow-sm p-5 flex items-center justify-between group hover:shadow-lg hover:shadow-lime-500/5 transition-all duration-500">
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
    </div>
    <div className={`w-12 h-12 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-500 group-hover:scale-110 transition-transform duration-500`}>
      <Icon size={20} />
    </div>
  </div>
);




const ReassignRepairs = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [repairs, setRepairs] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isReassigning, setIsReassigning] = useState(false);

  useEffect(() => { document.title = 'Assigner - Reassign Repairs'; }, []);

  const fetchData = useCallback(async () => {
    if (!token) return navigate('/login');
    setLoading(true);
    try {
      const [logsRes, deliveryRes] = await Promise.all([
        api.get('/api/assigner/assignment-log', {
          headers: { Authorization: `Bearer ${token}` },
          params: { assignmentType: 'REPAIR' },
        }),
        api.get('/api/assigner/delivery-persons', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let pending = [];
      try {
        const repairsRes = await api.get('/api/assigner/repairs-for-assignment', {
          headers: { Authorization: `Bearer ${token}` },
        });
        pending = (repairsRes.data.content || repairsRes.data || []).map((r) => ({
          ...r,
          userName: `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.userName || 'Unknown Customer',
          price: r.price || 0
        }));
      } catch (repairErr) {
        console.warn('repairs-for-assignment unavailable:', repairErr?.response?.status);
      }

      const assigned = (logsRes.data.content || logsRes.data || []).map((l) => ({
        id: l.repairRequestId || l.id,
        userId: l.userId,
        firstName: l.firstName,
        lastName: l.lastName,
        userName: l.userName || `${l.firstName || ''} ${l.lastName || ''}`.trim(),
        userPhone: l.userPhone,
        userAddress: l.userAddress || {},
        shopId: l.shopId,
        shopName: l.shopName,
        shopPhone: l.shopPhone,
        shopAddress: l.shopAddress || {},
        deliveryAddress: l.deliveryAddress || null,
        status: l.status || 'ASSIGNED',
        createdAt: l.createdAt,
        deliveryId: l.deliveryId,
        price: l.price || 0
      }));

      const map = new Map();
      pending.forEach((r) => map.set(r.id, r));
      assigned.forEach((r) => { if (r.id) map.set(r.id, r); });

      setRepairs(Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setDeliveryPersons(deliveryRes.data.content || deliveryRes.data || []);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.clear(); navigate('/login'); }
      else showToast('Failed to load data', 'error');
    } finally { setLoading(false); }
  }, [token, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const reassignRepair = async (newDeliveryId) => {
    if (!selectedRepair?.id || !newDeliveryId) return;
    setIsReassigning(true);
    try {
      await api.put(
        `/api/assigner/reassign-repair/${selectedRepair.id}`,
        { newDeliveryId, notes },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showToast('Repair task transferred successfully', 'success');
      setSelectedRepair(null); setNotes(''); fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Reassignment failed', 'error');
    } finally { setIsReassigning(false); }
  };

  const stats = useMemo(() => ({
    total: repairs.length,
    assigned: repairs.filter(r => r.deliveryId).length,
    unassigned: repairs.filter(r => !r.deliveryId).length,
    estValue: repairs.reduce((acc, r) => acc + (parseFloat(r.price) || 0), 0)
  }), [repairs]);

  const filtered = useMemo(() => repairs.filter(r => {
    const searchable = [r.id, r.userName, r.shopName, r.status, r.deliveryId].join(' ').toLowerCase();
    return !searchTerm || searchable.includes(searchTerm.toLowerCase());
  }), [repairs, searchTerm]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = useMemo(() => filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filtered, currentPage, rowsPerPage]);

  const copyToClipboard = (id) => { navigator.clipboard.writeText(id); showToast('Repair ID copied', 'success'); };

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
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Logistic Override</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Reassign Repairs</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage and transfer repair logistics between agents</p>
          </div>
          <button onClick={fetchData} className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            Refresh Data
          </button>
        </div>



        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Repairs" value={stats.total} icon={FiTool} color="lime" />
          <StatCard label="In Progress" value={stats.assigned} icon={FiTruck} color="amber" />
          <StatCard label="Unassigned" value={stats.unassigned} icon={FiXCircle} color="red" />
          <StatCard label="Est. Revenue" value={`EGP ${stats.estValue.toLocaleString()}`} icon={FiClipboard} color="blue" />
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by ID, customer, shop, agent or status..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/10 focus:border-lime-200 transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rows</span>
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
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Repair ID</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>

                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 ">Actions</th>
                </tr>
              </thead>
              <tbody className="text-center divide-y divide-gray-100 dark:divide-gray-700">
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
                      <FiTool className="mx-auto text-gray-200 dark:text-gray-700 mb-4" size={48} />
                      <p className="text-gray-400 font-medium">No repairs found for reassignment</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(repair => {
                    const cs = getStatusStyle(repair.status);
                    return (
                      <tr key={repair.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                        <td className="px-4 py-3 text-xs text-center whitespace-nowrap">{formatDate(repair.createdAt)}</td>
                        <td className="px-4 py-3 text-xs text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">#{repair.id?.slice(-8)}</span>
                            <button onClick={() => copyToClipboard(repair.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-lime-500 transition-all">
                              <FiCopy size={12} />
                            </button>
                          </div>
                        </td>
                        <td className="text-xs font-black text-center text-gray-700 dark:text-gray-100 leading-none mb-1.5">
                          {repair.userName}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex justify-center items-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${cs.bg} ${cs.border} ${cs.text}`}>
                              <span className={`w-1 h-1 rounded-full ${cs.dot}`} />
                              {repair.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                          <div className="flex justify-center items-center gap-3">
                            <button
                              title="View Details"
                              onClick={() => setViewDetail(repair)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-transparent border-2 border-gray-100 dark:border-transparent dark:bg-gray-700 text-gray-400 dark:text-gray-300 text-xs font-bold transition-all"
                            >
                              <FiInfo size={14} />

                            </button>
                            <button
                              onClick={() => setSelectedRepair(repair)}
                              className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-transparent border border-emerald-200 dark:border-transparent dark:bg-gray-700 hover:opacity-70 text-emerald-400 dark:text-gray-300 text-xs font-bold transition-all "
                            >
                              <FiUserCheck size={14} />
                              Reassign
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
                Showing <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filtered.length)}</span> of <span className="text-gray-900 dark:text-white">{filtered.length}</span> repairs
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 transition-all"><FiChevronLeft size={18} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setCurrentPage(p)} className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === p ? 'bg-lime-500 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}>{p}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 transition-all"><FiChevronRight size={18} /></button>
              </div>
            </div>
          )}
        </div>



        {viewDetail && (
          <Modal onClose={() => setViewDetail(null)} title="Repair Case Details" darkMode={darkMode}>
            <div className="space-y-6">
              <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-md  space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Ref</p>
                  <p className="text-xs font-mono font-bold text-gray-950 dark:text-white tracking-tight">#{viewDetail.id}</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</p>
                  <span className={`inline-flex  px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${getStatusStyle(viewDetail.status).bg} ${getStatusStyle(viewDetail.status).border} ${getStatusStyle(viewDetail.status).text}`}>
                    {viewDetail.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                  <div className="flex items-center gap-2">
                    <FiUser className="text-gray-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">Customer Info</span>
                  </div><hr className="border border-gray-200 mt-3" />

                  <div className="space-y-1 flex items-center gap-3 flex-row-reverse">
                    <p className="text-xs font-semibold text-green-800 dark:text-gray-100">{viewDetail.userAddress?.city}, {viewDetail.userAddress?.state},{viewDetail.userAddress?.street},{viewDetail.userAddress?.building}</p>
                    <FiMapPin className='text-gray-500 text-lg' />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{viewDetail.userName} </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2"><FiPhone size={12} /> {viewDetail.phone || "Not specified"}</p>
                  </div>

                </div>
                <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-md  space-y-4">
                  <div className="flex items-center gap-2">
                    <FiClipboard className="text-gray-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Shop Info</span>
                  </div><hr className="border border-gray-200 mt-3" />

                  <div className="space-y-1 flex items-center gap-2 flex-row-reverse justify-end">
                    <p className="text-xs font-semibold text-green-800 dark:text-white">{viewDetail.shopName}</p>
                    <RiStore2Line size={12} className='text-gray-500 text-xs' />
                  </div>

                  <div className="space-y-1 flex items-center gap-2 flex-row-reverse justify-end">
                    <p className="text-xs font-semibold text-green-800 dark:text-white">{formatAddress(viewDetail.shopAddress)}</p>
                    <RiMapPin2Line className='text-gray-500 text-sm' />
                  </div>



                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md  space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <FiDollarSign size={14} className="text-lime-500" /> Total Price
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{viewDetail.totalPrice || "0.00"}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/10 rounded-md  space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
                    <FiMapPin size={14} /> Shipping Address
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatAddress(viewDetail.userAddress)}</p>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                <FiClock size={12} /> Recorded on: {new Date(viewDetail.createdAt).toLocaleString()}
              </div>
            </div>
          </Modal>
        )}



        {selectedRepair && (
          <Modal onClose={() => { setSelectedRepair(null); setNotes(''); }} title="Reassign Repair Agent" darkMode={darkMode}>
            <div className="space-y-6">
              <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Agent</p>
                  <p className="text-sm font-mono font-bold text-gray-500">ID: {selectedRepair.deliveryId ? `…${selectedRepair.deliveryId.slice(-12)}` : 'N/A'}</p>
                </div>
                {isReassigning && <FiClock className="animate-spin text-lime-500" size={20} />}
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Reassignment Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Reason for transferring this repair task..."
                  className="w-full px-5 py-4 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-lime-500/10 focus:border-lime-200 transition-all resize-none h-24"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select New Agent</label>
                <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-2 custom-scrollbar-thin">
                  {deliveryPersons.filter(p => p.id !== selectedRepair.deliveryId).map(person => (
                    <button
                      key={person.id}
                      onClick={() => reassignRepair(person.id)}
                      disabled={isReassigning}
                      className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-lime-500 hover:bg-lime-50/20 transition-all duration-300 disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:text-lime-500 transition-colors"><FiUser size={18} /></div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{person.name}</p>
                          <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                            {person.activeAssignments || 0} Active Tasks
                          </p>
                        </div>
                      </div>
                      <FiChevronRight size={18} className="text-gray-300 group-hover:text-lime-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #374151; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
};

export default ReassignRepairs;