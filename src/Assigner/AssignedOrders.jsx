import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPackage, FiSearch, FiUser, FiClipboard, FiHome, FiCalendar,
  FiChevronLeft, FiChevronRight, FiMapPin, FiCreditCard,
  FiDollarSign, FiCheck, FiClock, FiTruck, FiEye, FiCopy, FiInfo, FiPhone
} from 'react-icons/fi';
import { RiCashLine, RiVisaLine, RiStore2Line } from '@remixicon/react';
import Swal from 'sweetalert2';
import api from '../api';
import Modal from '../components/Modal';




const ROWS_OPTIONS = [10, 25, 50];

const STATUS_STYLE = {
  PENDING: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
  PENDING_PICKUP: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  ASSIGNED: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
  IN_TRANSIT: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  IN_PROGRESS: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-700', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
  COMPLETED: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  SHIPPED: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
};

const getStatusStyle = (s) =>
  STATUS_STYLE[s] || { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' };

const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, timerProgressBar: true });

const formatPrice = (p) => `EGP ${(p || 0).toLocaleString('en', { minimumFractionDigits: 2 })}`;

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



const AssignedOrders = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [deliveryId, setDeliveryId] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewDetail, setViewDetail] = useState(null);

  useEffect(() => { document.title = 'Assigner - Assigned Orders'; }, []);

  const fetchOrders = useCallback(async () => {
    if (!token) return navigate('/login');
    if (!deliveryId.trim()) { showToast('Please enter a Delivery Person ID', 'warning'); return; }

    setLoading(true); setHasSearched(true);
    try {
      const [ordersRes, logsRes] = await Promise.allSettled([
        api.get(`/api/assigner/delivery/${deliveryId}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/assigner/assignment-log', {
          headers: { Authorization: `Bearer ${token}` },
          params: { assignmentType: 'ORDER', deliveryId },
        }),
      ]);

      const mapOrder = (o) => ({
        id: o.id || o.orderId,
        firstName: o.firstName || '',
        lastName: o.lastName || '',
        phone: o.phone || '',
        userAddress: o.userAddress || {},
        shopName: o.shopName || null,
        shopAddress: o.shopAddress || {},
        totalPrice: o.totalPrice || 0,
        status: o.status || 'PENDING',
        createdAt: o.createdAt,
        paymentMethod: o.paymentMethod || null,
      });

      const current = ordersRes.status === 'fulfilled' ? (ordersRes.value.data?.content || ordersRes.value.data || []).map(mapOrder) : [];
      const assigned = logsRes.status === 'fulfilled' ? (logsRes.value.data?.content || logsRes.value.data || []).map(o => ({ ...mapOrder(o), status: o.status || 'ASSIGNED' })) : [];

      const merged = Array.from(new Map([...current, ...assigned].map(o => [o.id, o])).values());
      setOrders(merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setCurrentPage(1);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.clear(); navigate('/login'); }
      else { showToast(err.response?.data?.message || 'Failed to load orders', 'error'); setOrders([]); }
    } finally { setLoading(false); }
  }, [token, deliveryId, navigate]);

  const stats = useMemo(() => ({
    total: orders.length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
    active: orders.filter(o => o.status !== 'COMPLETED').length,
    revenue: orders.reduce((acc, o) => acc + (parseFloat(o.totalPrice) || 0), 0)
  }), [orders]);

  const totalPages = Math.ceil(orders.length / rowsPerPage);
  const paginated = useMemo(() => orders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [orders, currentPage, rowsPerPage]);



  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    return [addr.street, addr.city, addr.state].filter(Boolean).join(', ') || 'Not specified';
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
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Agent Tracking</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Assigned Orders</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">View tasks specifically assigned to a delivery agent</p>
          </div>
        </div>



        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Tasks" value={stats.total} icon={FiPackage} color="lime" />
          <StatCard label="Active" value={stats.active} icon={FiTruck} color="amber" />
          <StatCard label="Completed" value={stats.completed} icon={FiCheck} color="emerald" />
          <StatCard label="Total Value" value={formatPrice(stats.revenue)} icon={FiClipboard} color="blue" />
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">


            <div className="relative flex-1 group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
              <input
                type="text"
                value={deliveryId}
                onChange={e => setDeliveryId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchOrders()}
                placeholder="Enter Delivery Person ID to search..."
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

              <button
                onClick={fetchOrders}
                disabled={loading || !deliveryId.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gray-900 dark:bg-emerald-500 text-white dark:text-black text-sm font-black hover:bg-emerald-500 transition-all shadow-md shadow-gray-200 dark:shadow-none disabled:opacity-50"
              >
                {loading ? <><FiClock className="animate-spin" /> Loading...</> : <><FiSearch /> Find Orders</>}
              </button>
            </div>
          </div>
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/30 text-center border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Price</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
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
                ) : !hasSearched ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                      <FiSearch className="mx-auto text-gray-200 dark:text-gray-700 mb-4" size={48} />
                      <p className="text-gray-400 font-medium">Enter a Delivery Person ID to view tasks</p>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                      <FiPackage className="mx-auto text-gray-200 dark:text-gray-700 mb-4" size={48} />
                      <p className="text-gray-400 font-medium">No assigned orders found for this agent</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(order => {
                    const cs = getStatusStyle(order.status);
                    const fullName = `${order.firstName} ${order.lastName}`;
                    return (
                      <tr key={order.id} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-900/5 transition-colors group">
                        <td className="px-4 py-3 text-xs text-center whitespace-nowrap">{formatDate(order.createdAt)}</td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2 font-bold text-gray-800 dark:text-gray-100 text-xs">

                            {order.status === "ASSIGNED" ? <p className='text-xs text-orange-700 font-mono'>Guest</p> : fullName}
                          </div>
                        </td>


                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex justify-center items-center">
                            <span className={`inline-flex text-center items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${cs.bg} ${cs.border} ${cs.text}`}>

                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>


                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-black text-gray-950 dark:text-white">
                          {order.status === "ASSIGNED" ? <p className='text-xs font-mono text-orange-700'>Not delivered yet</p> : <p className='text-xs font-mono text-green-500'>Delivered</p>}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex justify-center items-center">
                            <button
                              title='View Details'
                              onClick={() => setViewDetail(order)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-transparent border-2 border-gray-100 dark:border-transparent dark:bg-gray-700 text-gray-400 dark:text-gray-300 text-xs font-bold transition-all "
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
                Showing <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, orders.length)}</span> of <span className="text-gray-900 dark:text-white">{orders.length}</span> entries
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
          <Modal onClose={() => setViewDetail(null)} title="Order Case Details" darkMode={darkMode}>
            <div className="space-y-6">
              <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-md  flex justify-between items-center gap-3 flex-wrap">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</p>
                  <p className="text-xs font-mono font-bold text-gray-950 dark:text-white tracking-tight">#{viewDetail.id?.slice(0, 8)}</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider font-mono border-2   ${viewDetail.status}`}>
                    {viewDetail.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-md  space-y-4">
                  <div className="flex items-center gap-2">
                    <FiClipboard className="text-gray-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total Amount</span>
                  </div><hr className='border border-100 m-3' />
                  <p className="text-xl font-black text-gray-900 dark:text-white">{formatPrice(viewDetail.totalPrice)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-900/10 rounded-md space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
                    <FiHome size={14} /> Customer Address
                  </div>

                  <p className="text-sm font-semibold text-orange-700 dark:text-gray-200">{formatAddress(viewDetail.userAddress) || "Not specified"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-900/10 rounded-md space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
                    <FiMapPin size={14} /> Shop Address
                  </div>

                  <p className="text-sm font-semibold text-orange-700 dark:text-gray-200">{formatAddress(viewDetail.shopAddress) || "Not specified"}</p>
                </div>
              </div>


              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md  space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
                    <RiStore2Line size={14} className="text-gray-500" /> Store Name
                  </div>
                  <p className="text-sm font-semibold text-orange-700 dark:text-gray-200">{viewDetail.shopName}</p>
                </div>

              </div>

              <div className="pt-4 flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                <FiClock size={12} /> Placed on: {new Date(viewDetail.createdAt).toLocaleString()}
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

export default AssignedOrders;