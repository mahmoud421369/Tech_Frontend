import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiClipboard, FiUser, FiSearch, FiXCircle,
  FiChevronLeft, FiChevronRight, FiInfo, FiCopy, FiCheck, FiUserCheck, FiPackage, FiTool, FiEye, FiMapPin, FiPhone, FiClock
} from 'react-icons/fi';
import { RiListCheck2, RiListCheck3, RiStore2Line, RiUser2Line } from '@remixicon/react';
import Swal from 'sweetalert2';
import api from '../api';
import Modal from '../components/Modal';
import { RiPhoneLine } from 'react-icons/ri';




const ROWS_OPTIONS = [10, 25, 50, 100];




const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, timerProgressBar: true });

const formatPrice = (price) => {
  if (price === undefined || price === null) return 'EGP 0.00';
  return `EGP ${parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

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
  return [addr.street, addr.city, addr.state].filter(Boolean).join(', ') || 'N/A';
};




const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm p-5 flex items-center justify-between group hover:shadow-lg hover:shadow-lime-500/5 transition-all duration-500">
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
    </div>
    <div className={`w-12 h-12 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-500 group-hover:scale-110 transition-transform duration-500`}>
      <Icon size={20} />
    </div>
  </div>
);




const RepairsForAssignment = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [repairs, setRepairs] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedRepair, setSelectedRepair] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => { document.title = 'Assigner - Repairs'; }, []);

  const fetchData = useCallback(async () => {
    if (!token) return navigate('/login');
    try {
      setLoading(true);
      const [pendingRes, logRes, agentsRes] = await Promise.all([
        api.get('/api/assigner/repairs-for-assignment', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/assigner/assignment-log', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/assigner/delivery-persons', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const pending = pendingRes.data.content || pendingRes.data || [];
      const logs = (logRes.data.content || logRes.data || []).filter(l => l.assignmentType === 'REPAIR');
      const agents = agentsRes.data.content || agentsRes.data || [];

      const map = new Map();
      pending.forEach(r => {
        const userName = `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.userName || 'Unknown Customer';
        map.set(r.id, { ...r, userName });
      });
      logs.forEach(l => {
        if (!l.repairRequestId) return;
        const existing = map.get(l.repairRequestId);
        const userName = l.userName || (existing ? existing.userName : `${l.firstName || ''} ${l.lastName || ''}`.trim()) || 'Unknown Customer';
        if (existing) {
          map.set(l.repairRequestId, { ...existing, status: l.status, deliveryId: l.deliveryId, userName });
        } else {
          map.set(l.repairRequestId, { id: l.repairRequestId, ...l, userName });
        }
      });

      setRepairs(Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setDeliveryPersons(agents);
    } catch (err) {
      showToast('Failed to load repairs', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    return repairs.filter(r => {
      const name = `${r.firstName} ${r.lastName}`.toLowerCase();
      const searchable = [r.id, name, r.shopId, r.status].join(' ').toLowerCase();
    
      return !searchTerm || searchable.includes(searchTerm.toLowerCase());
    });
  }, [repairs, searchTerm]);

  const stats = useMemo(() => ({
    total: repairs.length,
    pending: repairs.filter(r => !r.deliveryId).length,
    assigned: repairs.filter(r => r.deliveryId).length,
    revenue: repairs.reduce((acc, r) => acc + (parseFloat(r.price) || 0), 0)
  }), [repairs]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = useMemo(() => filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filtered, currentPage, rowsPerPage]);

  const assignRepair = async (agentId) => {
    if (!selectedRepair) return;
    try {
      setIsAssigning(true);
      await api.post('/api/assigner/assign-repair', { repairRequestId: selectedRepair.id, deliveryId: agentId, notes }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Repair assigned successfully', 'success');
      setSelectedRepair(null);
      setNotes('');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Assignment failed', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('ID copied', 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">


        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">Repair Logistics</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Repairs Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Coordinate pickup and delivery for repair requests</p>
          </div>
          <button onClick={fetchData} className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            Refresh Data
          </button>
        </div>




        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Repairs" value={stats.total} icon={FiTool} color="lime" />
          <StatCard label="To Assign" value={stats.pending} icon={FiUserCheck} color="amber" />
          <StatCard label="Assigned" value={stats.assigned} icon={FiCheck} color="emerald" />
          <StatCard label="Est. Revenue" value={formatPrice(stats.revenue)} icon={FiClipboard} color="blue" />
        </div>




        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by ID, Customer, or Shop..."
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



        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Repair ID</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Username</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Shop</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-6 py-6"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-24 text-center">
                      <FiTool className="mx-auto text-gray-200 dark:text-gray-700 mb-4" size={48} />
                      <p className="text-gray-400 font-medium">No repairs found for assignment</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(repair => {
                    return (
                      <tr key={repair.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                        <td className="px-6 py-6 whitespace-nowrap">{formatDate(repair.createdAt)}</td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">#{repair.id?.slice(-8)}</span>
                            <button onClick={() => copyToClipboard(repair.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-lime-500 transition-all">
                              <FiCopy size={12} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap font-semibold text-gray-800 dark:text-gray-100 text-xs ">
                          {repair.userName || '—'}
                        </td>

                        <td className="px-6 py-6 whitespace-nowrap text-gray-500 dark:text-gray-400 text-xs font-medium">
                          {repair.userPhone || 'N/A'}
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap font-black text-gray-900 text-xs font-cairo dark:text-white">
                          {repair.shopName}
                        </td>
                        <td className="px-6 py-6 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => setViewDetail(repair)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-lime-500 hover:text-white transition-all shadow-sm"
                          >
                            <FiEye size={14} />
                            Details
                          </button>
                          {repair.deliveryId ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-800">
                              <FiCheck size={14} /> Assigned
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedRepair(repair)}
                              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-900 dark:bg-lime-500 text-white dark:text-black text-xs font-black hover:bg-lime-500 transition-all shadow-md"
                            >
                              <FiUserCheck size={14} />
                              Assign
                            </button>
                          )}
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
              <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Repair ID</p>
                  <p className="text-lg font-mono font-bold text-gray-800 dark:text-white tracking-tight">#{viewDetail.id?.slice(0, 8)}</p>
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                  <div className="flex items-center gap-2">
                    <FiUser className="text-lime-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">Customer Info</span>
                  </div>

                  <div className="space-y-1 flex items-center gap-3 flex-row-reverse">
                    <p className="text-xs  font-semibold text-gray-800 dark:text-gray-100">{viewDetail.userAddress?.city}, {viewDetail.userAddress?.state},{viewDetail.userAddress?.street},{viewDetail.userAddress?.building}</p>
                    <FiMapPin className='text-gray-500 text-xs' size={12} />
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{viewDetail.userName} </p>
                    <p className="text-xs text-gray-500 flex items-center gap-2"><FiPhone size={12} /> {viewDetail.userPhone}</p>
                  </div>

                </div>
                <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                  <div className="flex items-center gap-2">
                    <FiClipboard className="text-lime-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Shop Info</span>
                  </div>

                  <div className="space-y-1 flex items-center gap-2 flex-row-reverse justify-end">
                    <p className="text-xs font-black text-gray-900 dark:text-white">{viewDetail.shopName}</p>
                    <RiStore2Line size={12} className='text-gray-500 text-xs' />
                  </div>

                  <div className="space-y-1 flex items-center gap-2 flex-row-reverse justify-end">
                    <p className="text-xs font-black text-gray-900 dark:text-white">{viewDetail.shopPhone}</p>
                    <RiPhoneLine size={12} className='text-gray-500 text-xs' />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <RiListCheck2 size={14} className="text-lime-500" /> Assign Info
                  </div>
                  <div className="space-y-1 flex items-center gap-3 flex-row-reverse justify-end">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{viewDetail.assignmentType}</p>
                    <RiListCheck3 size={12} className='text-gray-500 text-xs' />
                  </div>

                  <div className="space-y-1 flex items-center gap-3 flex-row-reverse justify-end">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{viewDetail.assignerName}</p>
                    <RiUser2Line size={12} className='text-gray-500 text-xs' />
                  </div>
                </div>
                <div className="p-4 bg-lime-50/30 dark:bg-lime-900/10 rounded-2xl border border-lime-100 dark:border-lime-900/30 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-lime-600">
                    <FiMapPin size={14} /> User Address
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatAddress(viewDetail.userAddress)}</p>
                </div>
                {viewDetail.deliveryAddress && (
                  <div className="p-4 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      <FiPackage size={14} /> Delivery Destination
                    </div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatAddress(viewDetail.deliveryAddress)}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                <FiClock size={12} /> Received on: {new Date(viewDetail.createdAt).toLocaleString()}
              </div>
            </div>
          </Modal>
        )}



        {selectedRepair && (
          <Modal onClose={() => { setSelectedRepair(null); setNotes(''); }} title="Assign Repair Logistics" darkMode={darkMode}>
            <div className="space-y-6">
              <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Est. Price</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{formatPrice(selectedRepair.price)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Repair Ref</p>
                  <p className="text-sm font-mono font-bold text-gray-500">#{selectedRepair.id?.slice(-12)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Logistics Instructions</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes for the pickup/delivery agent..."
                  className="w-full px-5 py-4 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-lime-500/10 focus:border-lime-200 transition-all resize-none h-24"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Available Agent</label>
                <div className="grid grid-cols-1 gap-2.5 max-h-72 overflow-y-auto pr-2 custom-scrollbar-thin">
                  {deliveryPersons.map(person => (
                    <button
                      key={person.id}
                      onClick={() => assignRepair(person.id)}
                      disabled={isAssigning}
                      className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-lime-500 hover:bg-lime-50/20 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:text-lime-500 transition-colors"><FiUser size={18} /></div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{person.name}</p>
                          <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                            <FiPackage size={10} /> {person.activeAssignments || 0} Active
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

export default RepairsForAssignment;