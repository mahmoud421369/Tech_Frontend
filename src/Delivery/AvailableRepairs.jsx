import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { 
  FiTool, FiUser, FiMapPin, FiDollarSign, FiClock,
  FiCheckCircle, FiXCircle, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiSearch, FiCopy, FiTruck, FiZap
} from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import Swal from "sweetalert2";
import { getAvailableRepairs, acceptRepair, rejectRepair } from "../api/deliveryApi";
import api from "../api";
import { TableSkeleton } from "../components";





const ROWS_OPTIONS = [5,10, 25, 50];




const formatPrice = (p) => `EGP ${(p || 0).toLocaleString()}`;
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });




const AvailableRepairs = () => {
  const [repairs, setRepairs]         = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [searchTerm, setSearchTerm]   = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const showToast = useCallback((text, icon) => {
    Swal.fire({ text, icon, toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
  }, []);

  useEffect(() => {
    document.title = 'Available Repair Deliveries | Tech Restore';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = 'Claim pending technician repair deliveries in the live operational dispatch queue on Tech Restore.';
  }, []);
  

  const loadRepairs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAvailableRepairs();
      setRepairs(data.content || data || []);
    } catch { showToast("Failed to load available repairs", "error"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { 
    loadRepairs(); 
    const t = setInterval(loadRepairs, 30000); 
    return () => clearInterval(t); 
  }, [loadRepairs]);

  const handleAccept = useCallback(async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Accept Repair Job?',
      text: "This repair request will be assigned to you for delivery.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#84cc16',
      confirmButtonText: 'Accept Now'
    });
    if (!isConfirmed) return;
 
    

    setRepairs(prev => prev.filter(r => r.id !== id));
    try { 
      await acceptRepair(id); 
      showToast("Repair job accepted successfully", "success"); 
    } catch { 
      showToast("Failed to accept repair job", "error"); 
      loadRepairs(); 
    }
  }, [showToast, loadRepairs]);

  const handleReject = useCallback(async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Reject Repair Job?',
      text: "Pass on this repair delivery?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Reject'
    });
    if (!isConfirmed) return;
    
    
    setRepairs(prev => prev.filter(r => r.id !== id));
    try { 
      await rejectRepair(id); 
      showToast("Repair job rejected", "info"); 
    } catch { 
      showToast("Failed to reject repair job", "error"); 
      loadRepairs(); 
    }
  }, [showToast, loadRepairs]);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "success");
  }, [showToast]);

  const filtered = useMemo(() => {
    return repairs.filter(r => 
      String(r.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.userAddress?.street || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.shopAddress?.street || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [repairs, searchTerm]);

  const paginated = useMemo(() => filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filtered, currentPage, rowsPerPage]);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  if (isLoading && repairs.length === 0) {
    return <TableSkeleton title="Repairs" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

        
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-lime-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600">Operations</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Available <span className="text-lime-500">Repairs</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Claim technical repair deliveries from the active queue</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="px-5 py-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Live Repairs</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
                <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">{repairs.length} Service Jobs</span>
              </div>
            </div>
            <button 
              onClick={loadRepairs}
              aria-label="Refresh available repairs queue"
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
                placeholder="Search by Repair ID or Address..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="Search available repairs"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/10 focus:border-lime-200 transition-all"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Show</span>
                <select
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  aria-label="Select rows per page"
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
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Repair Ref</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Shop Pickup</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">User Delivery</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
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
                        <FiZap size={40} />
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Console Clear</p>
                      <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">No available repair tasks at this time</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(repair => (
                    <tr key={repair.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{formatDate(repair.createdAt)}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">Service Date</p>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-gray-800 dark:text-gray-200">#{repair.id?.slice(-8)}</span>
                          <button 
                            onClick={() => copyToClipboard(repair.id)} 
                            aria-label="Copy repair reference"
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-lime-500 transition-all"
                          >
                            <FiCopy size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
                            <FaStore size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 dark:text-white truncate max-w-[200px]">{repair.shopAddress?.street || "Tech Station"}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">{repair.shopAddress?.city || "Area Hub"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                            <FiMapPin size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 dark:text-white truncate max-w-[200px]">{repair.userAddress?.street || "Customer Site"}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">{repair.userAddress?.city || "Destination"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <p className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">{formatPrice(repair.price)}</p>
                        <p className="text-[10px] font-black text-lime-600 uppercase tracking-widest mt-0.5">Task Value</p>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleReject(repair.id)}
                            aria-label="Reject repair job"
                            className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          >
                            <FiXCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleAccept(repair.id)}
                            aria-label="Accept repair job"
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-lime-500 text-white text-xs font-black uppercase tracking-widest hover:bg-lime-600 transition-all shadow-lg shadow-lime-500/20 active:scale-95"
                          >
                            <FiCheckCircle size={16} /> Accept
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
                  aria-label="Previous page"
                  className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 transition-all"
                >
                  <FiChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      aria-label={`Go to page ${page}`}
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
                  aria-label="Next page"
                  className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-lime-500 disabled:opacity-30 transition-all"
                >
                  <FiChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
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

export default memo(AvailableRepairs);