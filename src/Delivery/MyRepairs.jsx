import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  FiTool, FiMapPin, FiDollarSign, FiClock,
  FiCheckCircle, FiUser, FiPackage, FiPhone,
  FiChevronLeft, FiChevronRight, FiSearch, FiCopy,
  FiRefreshCw, FiInfo, FiX, FiActivity, FiArrowRight
} from "react-icons/fi";
import { FaStore } from "react-icons/fa";
import Swal from "sweetalert2";
import { getMyRepairs, updateRepairStatus } from "../api/deliveryApi";
import api from "../api";
import { TableSkeleton } from "../components";
import { RiTruckLine } from "@remixicon/react";



const ROWS_OPTIONS = [5, 10, 25, 50];

const STATUS_STYLE = {
  REPAIR_COMPLETED: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  DEVICE_DELIVERED: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  CANCELLED: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
  PICKED_UP: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-500" },
  DELIVERED_TO_SHOP: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  IN_REPAIR: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-500" },
};

const STATUS_LABEL = {
  REPAIR_COMPLETED: "Repair Completed",
  DEVICE_DELIVERED: "Device Delivered",
  CANCELLED: "Cancelled",
  PICKED_UP: "Picked Up",
  DELIVERED_TO_SHOP: "Delivered to Shop",
  IN_REPAIR: "In Repair",
};



const formatPrice = (p) => `EGP ${(p || 0).toLocaleString()}`;
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });




const MyRepairs = () => {
  const [repairs, setRepairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRepair, setSelectedRepair] = useState(null);

  const showToast = useCallback((text, icon) => {
    Swal.fire({ text, icon, toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
  }, []);

  useEffect(() => {
    document.title = 'My Assigned Repair Services | Tech Restore';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = 'Track, manage, update, and finalize your active assigned technical repair delivery operations on Tech Restore.';
  }, []);


  const loadRepairs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMyRepairs();

      setRepairs(data.content || data || []);
    } catch { showToast("Failed to load repairs", "error"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    loadRepairs();
    const t = setInterval(loadRepairs, 30000);
    return () => clearInterval(t);
  }, [loadRepairs]);

  const handleUpdate = useCallback(async (id, newStatus) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Update Status?',
      text: `Change repair status to ${STATUS_LABEL[newStatus]}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#84cc16',
      confirmButtonText: 'Confirm'
    });
    if (!isConfirmed) return;



    setRepairs(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    try {
      await updateRepairStatus(id, { status: newStatus });
      showToast("Repair status updated", "success");
    } catch {
      showToast("Failed to update status", "error");
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
      `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.userAddress?.street || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [repairs, searchTerm]);

  const paginated = useMemo(() => filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [filtered, currentPage, rowsPerPage]);
  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  if (isLoading && repairs.length === 0) {
    return <TableSkeleton title="My Repairs" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">


        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Technical Hub</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">My <span className="text-emerald-500">Repairs</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Track device service cycles and manage delivery stages</p>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="px-5 py-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Assigned Service</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter">{repairs.length} Active Jobs</span>
              </div>
            </div>
            <button
              onClick={loadRepairs}
              aria-label="Refresh active repairs queue"
              className={`w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-lime-500 transition-all duration-700 ${isLoading ? 'rotate-180' : ''}`}
            >
              <FiRefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>



        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search by Repair ID, Tech or Customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                aria-label="Search my assigned repairs"
                className="w-full pl-12 pr-4 py-3.5 cursor-pointer rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/10 focus:border-lime-200 transition-all"
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



        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar-thin">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900/30 text-center  dark:border-gray-700">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Assignment Date</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Price</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
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
                        <FiTool size={40} />
                      </div>
                      <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">No Active Repairs</p>
                      <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">You have no repair deliveries in progress</p>
                    </td>
                  </tr>
                ) : (
                  paginated.map(repair => {
                    const st = STATUS_STYLE[repair.status] || { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' };
                    return (
                      <tr key={repair.id} className="hover:bg-lime-50/10 dark:hover:bg-lime-900/5 transition-colors group">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs text-center  text-gray-950 dark:text-white uppercase">{formatDate(repair.createdAt)}</p>

                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                              <FiUser size={12} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-gray-900 dark:text-white truncate max-w-[150px]">{repair.firstName} {repair.lastName}</p>
                              <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">{repair.phone || "No Contact"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex justify-center items-center">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-transparent ${st.bg} ${st.text}`}>

                              {STATUS_LABEL[repair.status] || repair.status?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm font-semibold text-center text-gray-950 dark:text-white tracking-tighter">{formatPrice(repair.price)}</p>

                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              title="View Details"
                              onClick={() => setSelectedRepair(repair)}
                              aria-label={`View details for repair ${repair.id}`}
                              className="flex items-center gap-2 dark:border-gray-700 px-6 py-3 hover:bg-amber-300 hover:text-white rounded-md bg-transparent border-2 border-gray-50 text-amber-400 text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all  active:scale-95"
                            >
                              <FiInfo size={18} />
                            </button>
                            {["REPAIR_COMPLETED", "DEVICE_DELIVERED", "CANCELLED"].indexOf(repair.status) === -1 && (
                              <button
                                onClick={() => handleUpdate(repair.id, "DEVICE_DELIVERED")}
                                aria-label={`Complete repair delivery for ticket ${repair.id}`}
                                className="flex items-center gap-2 dark:border-gray-700 px-6 py-3 hover:bg-emerald-300 hover:text-white rounded-md bg-transparent border-2 border-gray-50 text-emerald-400 text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all  active:scale-95"
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
                      className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === page
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



        {selectedRepair && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setSelectedRepair(null)} />
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-md shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-400 ">
                      <FiTool size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Request Details</h2>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ticket: #{selectedRepair.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRepair(null)}
                    aria-label="Close details modal"
                    className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Customer Info</h3>
                      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-lime-500 shadow-sm"><FiUser size={18} /></div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white">{selectedRepair.firstName} {selectedRepair.lastName}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{selectedRepair.phone || "Secure Contact"}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Current Status</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                          {STATUS_LABEL[selectedRepair.status] || selectedRepair.status}
                        </p>
                      </div>
                    </div>
                  </div>







                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Addresses</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <FaStore className="text-amber-500 mt-1" size={14} />
                          <div>
                            <p className="text-[10px] ml-2 font-bold text-gray-400 uppercase">Origin</p>
                            <p className="text-sm font-black ml-2 text-gray-900 dark:text-white font-sans truncate max-w-[200px]">{selectedRepair.shopAddress?.street + "," + selectedRepair.shopAddress?.state + "," + selectedRepair.shopAddress?.city || "Merchant Hub"}</p>
                          </div>
                        </div>


                        <div className="flex items-center -ml-2 gap-3">
                          <div className="w-8 h-8  flex items-center justify-center text-indigo-600"><RiTruckLine size={14} /></div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Destination</p>
                            <p className="text-sm font-black text-gray-900 dark:text-white font-sans truncate max-w-[200px]">{selectedRepair.deliveryAddress?.street + "," + selectedRepair.deliveryAddress?.state + "," + selectedRepair.deliveryAddress?.city || "Customer Site"}</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-md space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lime-500/10 flex items-center justify-center text-lime-500"><FiActivity size={18} /></div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Service Value</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{formatPrice(selectedRepair.price)}</p>
                    </div>
                  </div>
                  {["REPAIR_COMPLETED", "DEVICE_DELIVERED", "CANCELLED"].indexOf(selectedRepair.status) === -1 && (
                    <button
                      onClick={() => { handleUpdate(selectedRepair.id, "DEVICE_DELIVERED"); setSelectedRepair(null); }}
                      aria-label="Confirm repair delivery finalized to customer"
                      className="w-full py-4 bg-lime-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-lime-600 transition-all shadow-xl shadow-lime-500/20"
                    >
                      Mark Finalized <FiArrowRight />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `}} />
    </div>
  );
};

export default memo(MyRepairs);