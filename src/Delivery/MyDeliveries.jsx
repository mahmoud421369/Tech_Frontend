import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { 
  FiPackage, FiMapPin, FiDollarSign, FiClock,
  FiTruck, FiCheckCircle, FiUser, FiPhone,
  FiChevronLeft, FiChevronRight, FiSearch, FiCopy,
  FiRefreshCw, FiExternalLink, FiX, FiInfo
} from "react-icons/fi";
import { RiAccountBox2Line, RiStore2Line, RiTruckLine } from "react-icons/ri";
import Swal from "sweetalert2";
import { getMyDeliveries, updateOrderStatus } from "../api/deliveryApi";
import api from "../api";




const ROWS_OPTIONS = [10, 25, 50];

const STATUS_STYLE = {
  DELIVERED:        { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  IN_TRANSIT:       { bg: "bg-indigo-50 dark:bg-indigo-900/20",   text: "text-indigo-700 dark:text-indigo-400",   dot: "bg-indigo-500"  },
  READY_FOR_PICKUP: { bg: "bg-blue-50 dark:bg-blue-900/20",       text: "text-blue-700 dark:text-blue-400",       dot: "bg-blue-500"    },
  CANCELLED:        { bg: "bg-red-50 dark:bg-red-900/20",         text: "text-red-700 dark:text-red-400",         dot: "bg-red-500"     },
};




const formatPrice = (p) => `EGP ${(p || 0).toLocaleString()}`;
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });




const MyDeliveries = () => {
  const [orders, setOrders]           = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [searchTerm, setSearchTerm]   = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const showToast = useCallback((text, icon) => {
    Swal.fire({ text, icon, toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
  }, []);

    useEffect(() => { document.title = ' My Orders | TechBazaar'; }, []);
  

  const loadDeliveries = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyDeliveries();
      
      setOrders(data.content || data || []);
    } catch { showToast("Failed to load deliveries", "error"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { 
    loadDeliveries(); 
    const t = setInterval(loadDeliveries, 30000); 
    return () => clearInterval(t); 
  }, [loadDeliveries]);

  const handleMarkDelivered = useCallback(async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Confirm Delivery?',
      text: "Mark this order as successfully delivered?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#84cc16',
      confirmButtonText: 'Yes, Delivered'
    });
    if (!isConfirmed) return;
    // Optimistic: update status in UI immediately
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'DELIVERED' } : o));
    try { 
      await updateOrderStatus(id, { status: "DELIVERED" }); 
      showToast("Order marked as delivered", "success"); 
    } catch { 
      showToast("Failed to update status", "error"); 
      loadDeliveries(); // rollback
    }
  }, [showToast, loadDeliveries]);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "success");
  }, [showToast]);

  const filtered = useMemo(() => {
    return orders.filter(o => 
      String(o.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${o.firstName} ${o.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(o.userAddress?.street || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const paginated = useMemo(() => filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filtered, currentPage, rowsPerPage]);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

        
        

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">Operations Log</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">My <span className="text-lime-500">Deliveries</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Manage and finalize your active delivery assignments</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="px-5 py-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Active Tasks</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">{orders.length} Current Loads</span>
              </div>
            </div>
            <button 
              onClick={loadDeliveries}
              className={`w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-lime-500 transition-all duration-700 ${isLoading ? 'rotate-180' : ''}`}
            >
              <FiRefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

       
       

        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by ID, Customer or Status..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/10 focus:border-lime-200 transition-all"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Show</span>
                <select
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-5 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-lime-500/10 cursor-pointer transition-all"
                >
                  {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n} rows</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

       
       
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Assignment Date</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Payout</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading && paginated.length === 0 ? (
                  [...Array(rowsPerPage)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-8 py-6"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-200 dark:text-gray-800">
                        <FiTruck size={40} />
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">No Active Loads</p>
                      <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Your delivery queue is currently clear</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(order => {
                    const st = STATUS_STYLE[order.status] || { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' };
                    return (
                      <tr key={order.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{formatDate(order.createdAt)}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">Assigned</p>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-gray-800 dark:text-gray-200">#{order.id?.slice(-8)}</span>
                            <button onClick={() => copyToClipboard(order.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-lime-500 transition-all">
                              <FiCopy size={12} />
                            </button>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-lime-50 dark:bg-lime-900/20 flex items-center justify-center text-lime-600">
                              <FiUser size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-gray-900 dark:text-white truncate max-w-[150px]">{order.firstName} {order.lastName}</p>
                              <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">{order.phone || "No Phone"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-transparent ${st.bg} ${st.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot} animate-pulse`} />
                            {order.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">{formatPrice(order.totalPrice)}</p>
                          <p className="text-[10px] font-black text-lime-600 uppercase tracking-widest mt-0.5">Earnings</p>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-lime-500 transition-all"
                            >
                              <FiInfo size={18} />
                            </button>
                            {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                              <button 
                                onClick={() => handleMarkDelivered(order.id)}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-lime-500 text-white text-xs font-black uppercase tracking-widest hover:bg-lime-600 transition-all shadow-lg shadow-lime-500/20 active:scale-95"
                              >
                                <FiCheckCircle size={16} /> Complete
                              </button>
                            )}
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
            <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Showing <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, filtered.length)}</span> of <span className="text-gray-900 dark:text-white">{filtered.length}</span> Results
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 transition-all"
                >
                  <FiChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                        currentPage === page 
                          ? "bg-lime-500 text-white shadow-lg shadow-lime-500/20" 
                          : "bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-lime-500"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 transition-all"
                >
                  <FiChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        
        
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setSelectedOrder(null)} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-lime-500 flex items-center justify-center text-white shadow-lg shadow-lime-500/20">
                      <FiPackage size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Delivery Details</h2>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ref: #{selectedOrder.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                    <FiX size={20} />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-700 pb-2">Parties Involved</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600"><FiUser size={14} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Customer</p>
                          <p className="text-sm font-black text-gray-900 dark:text-white">{selectedOrder.firstName} {selectedOrder.lastName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600"><FiPhone size={14} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Contact</p>
                          <p className="text-sm font-black text-gray-900 dark:text-white">{selectedOrder.phone || "Not Provided"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-700 pb-2">Logistics</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600"><RiStore2Line size={14} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Origin</p>
                          <p className="text-sm font-black text-gray-900 dark:text-white font-cairo truncate max-w-[200px]">{selectedOrder.shopAddress?.street + "," + selectedOrder.shopAddress?.state + "," +  selectedOrder.shopAddress?.city || "Merchant Hub"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600"><RiTruckLine size={14} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Destination</p>
                          <p className="text-sm font-black text-gray-900 dark:text-white font-cairo truncate max-w-[200px]">{selectedOrder.userAddress?.street + "," + selectedOrder.userAddress?.state + "," +  selectedOrder.userAddress?.city || "Customer Site"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl space-y-4">
                   <div className="flex justify-between items-center">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Financial Summary</p>
                      <p className="text-xl font-black text-lime-600 tracking-tighter">{formatPrice(selectedOrder.totalPrice)}</p>
                   </div>
                   {selectedOrder.status !== 'DELIVERED' && (
                     <button 
                        onClick={() => { handleMarkDelivered(selectedOrder.id); setSelectedOrder(null); }}
                        className="w-full py-4 bg-lime-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-lime-600 transition-all shadow-xl shadow-lime-500/20"
                     >
                       Confirm Final Delivery
                     </button>
                   )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
};

export default MyDeliveries;