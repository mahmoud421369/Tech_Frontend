import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiX, FiCopy, FiTrash2, FiInfo, FiMessageCircle,
  FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown,
  FiStar, FiClock, FiActivity, FiRefreshCw,FiCheck
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';

const ROWS_OPTIONS = [5, 10, 20, 50];

const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true });

const sanitize = (s) => DOMPurify.sanitize(String(s ?? ''));





const StarRating = memo(({ rating, size = 14 }) => (
  <div className="flex items-center justify-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <FiStar key={s} size={size} className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'} />
    ))}
  </div>
));

const StatCard = memo(({ icon: Icon, label, value, color }) => (
  <div className="bg-white/10  dark:bg-slate-900/40 backdrop-blur-md text-white  border  rounded-2xl p-5 dark:border-gray-700 shadow-xl  hover:shadow-xl hover:shadow-emerald-400/5 transition-all duration-500 group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gray-500/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform duration-700`} />
    <div className="relative flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center text-gray-500 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
));

const SortIcon = memo(({ field, sortField, sortDir }) => {
  if (sortField !== field) return <FiChevronDown size={11} className="text-gray-400 dark:text-gray-500" />;
  return sortDir === 'asc' ? <FiChevronUp size={11} className="text-emerald-600" /> : <FiChevronDown size={11} className="text-emerald-600" />;
});

const Th = memo(({ field, label, center = true, onSort, sortField, sortDir }) => (
  <th onClick={() => onSort(field)}
  scope='col'
    className={`text-slate-500 font-medium text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${center ? 'text-center' : 'text-right'}`}>
    <span className={`flex items-center gap-1.5 ${center ? 'justify-center' : ''}`}>
      {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </span>
  </th>
));

const RowsDropdown = memo(({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-transparent hover:border-emerald-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
        <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{value} Rows</span>
        <FiChevronDown size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {options.map(n => (
            <button key={n} onClick={() => { onChange(n); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest transition ${value === n ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {n} Rows
              {value === n && <FiCheck size={12} className="text-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const ReviewModal = memo(({ review, onClose }) => {
  if (!review) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-sm shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/80 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white uppercase tracking-[0.2em]">Feedback Detail</h3>
            <code className="text-[9px] font-black bg-lime-500 text-white px-1.5 py-0.5 rounded-lg">
              {String(review.id).slice(0, 6)}
            </code>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-red-500 transition-all">
            <FiX size={16} title="Close" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {[
            { l: 'Customer ID', v: sanitize(review.userId || 'N/A') },
            { l: 'Target Shop ID', v: sanitize(review.shopId || 'N/A') },
            { l: 'Submission Date', v: new Date(review.createdAt).toLocaleString() },
          ].map(f => (
            <div key={f.l} className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-transparent rounded-xl">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">{f.l}</p>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{f.v}</p>
            </div>
          ))}

          <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-transparent rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Platform Rating</p>
              <StarRating rating={review.rating} size={14} />
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Sentiment</p>
              <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">{review.rating >= 4 ? 'Positive' : review.rating <= 2 ? 'Critical' : 'Neutral'}</p>
            </div>
          </div>

          <div className="p-4 bg-lime-50 dark:bg-lime-900/20 border border-emerald-500/10 rounded-2xl">
            <p className="text-[8px] font-black text-emerald-700 dark:text-lime-400 uppercase tracking-widest mb-1.5">Customer Narrative</p>
            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic">"{sanitize(review.comment || 'No written testimony provided.')}"</p>
          </div>
        </div>

        <div className="px-4 pb-4 pt-1">
          <button onClick={onClose}
            className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 dark:hover:bg-emerald-500 dark:hover:text-white transition-all active:scale-[0.98] rounded-xl">
            Close
          </button>
        </div>
      </div>
    </div>
  );
});




const Reviews = ({ darkMode }) => {
  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem('authToken'));

  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => { document.title = 'Admin - Reviews'; }, []);

  useEffect(() => {
    const id = setTimeout(() => { setDebouncedSearch(search); setCurrentPage(1); }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const fetchReviews = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/reviews', { headers: { Authorization: `Bearer ${token}` } });
      setReviews(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      if (err?.response?.status === 401) { navigate('/login'); }
      else showToast('Sync failed', 'error');
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const stats = useMemo(() => ({
    total: reviews.length,
  }), [reviews]);

  const handleSort = useCallback((field) => {
    setSortField(prev => { if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; } setSortDir('asc'); return field; });
    setCurrentPage(1);
  }, []);

  const processed = useMemo(() => {
    const t = debouncedSearch.toLowerCase();
    let list = reviews.filter(r => {
      return !t || (r.userId || '').toLowerCase().includes(t) || (r.shopId || '').toLowerCase().includes(t) || (r.comment || '').toLowerCase().includes(t);
    });
    return [...list].sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (sortField === 'createdAt') { av = new Date(av || 0).getTime(); bv = new Date(bv || 0).getTime(); }
      else if (sortField === 'rating') { av = Number(av || 0); bv = Number(bv || 0); }
      else { av = String(av || '').toLowerCase(); bv = String(bv || '').toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [reviews, debouncedSearch, sortField, sortDir]);

  const totalPages = Math.ceil(processed.length / rowsPerPage);
  const paginated = useMemo(() => processed.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [processed, currentPage, rowsPerPage]);

  const deleteReview = useCallback(async (id) => {
    const token = tokenRef.current;
    const { isConfirmed } = await Swal.fire({
      title: 'Purge Review?', text: 'This will permanently remove the feedback.', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Confirm Purge', confirmButtonColor: '#ef4444',
      background: darkMode ? '#111827' : '#fff', color: darkMode ? '#fff' : '#000',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/api/admin/reviews/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Feedback Deleted', 'success'); fetchReviews();
    } catch { showToast('Deletion failed', 'error'); }
  }, [fetchReviews, darkMode]);

  const statCards = useMemo(() => [
    { icon: FiMessageCircle, label: 'Total Reviews', value: stats.total, color: 'lime' },
  ], [stats]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Public Sentiment</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Review Console</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Audit customer feedback and platform reputation metrics</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={fetchReviews} disabled={loading} title="Refresh"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all disabled:opacity-40">
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center text-gray-400">
                <FiActivity size={18} />
              </div>
              <div>
              
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Active Audit</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
              <input type="text" placeholder="Search by customer ID, shop ID, or keyword..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-transparent bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" />
              {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"><FiX size={16} title="Clear Search" /></button>}
            </div>
            <div className="flex items-center gap-3 px-4 border-l border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rows</span>
              <RowsDropdown value={rowsPerPage} options={ROWS_OPTIONS} onChange={n => { setRowsPerPage(n); setCurrentPage(1); }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-sm border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
          {loading ? (
            <div className="py-32 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 animate-pulse">Syncing platform feedback...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto w-full rounded-sm border border-gray-200 dark:border-gray-800 shadow-sm custom-scrollbar-thin">
                <table className="w-full table-auto border-collapse text-center text-sm text-gray-500  min-w-[900px]">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className={`text-slate-500 font-medium text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>ID</th>
                      <Th field="rating" label="Rating" onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <Th field="comment" label="Comment" center={true} onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <Th field="createdAt" label="Date" onSort={handleSort} sortField={sortField} sortDir={sortDir} />
                      <th className={`text-slate-500 font-medium text-xs tracking-wider uppercase border-b border-slate-200 dark:border-slate-800  p-4   cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {paginated.length === 0 ? (
                      <tr><td colSpan={5} className="py-32 text-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                          <FiMessageCircle size={32} className="text-gray-200" />
                        </div>
                        <p className="text-gray-400 font-bold">No Feedback Records identified</p>
                      </td></tr>
                    ) : paginated.map(review => (
                      <tr key={review.id} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-900/5 transition-colors group">
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-3">
                            <code className="text-[10px] font-black bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg text-gray-500 max-w-[100px] truncate block border border-transparent group-hover:border-lime-500/20 transition-all">{review.id}</code>
                            <button onClick={() => navigator.clipboard.writeText(review.id).then(() => showToast('ID Copied', 'success'))} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-lime-500 transition-all"><FiCopy size={14} title="Copy Feedback ID" /></button>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <StarRating rating={review.rating} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${review.rating >= 4 ? 'text-emerald-500' : 'text-amber-500'}`}>{review.rating}/5</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="max-w-[300px] truncate">
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium italic">"{sanitize(review.comment) || 'No narrative provided'}"</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ref: {sanitize(review.shopId).slice(0, 8)}...</p>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center gap-1 text-gray-400">
                            <FiClock size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setSelected(review)}
                              className="p-1.5 text-gray- border border-gray-200 hover:border-none dark:text-white dark:border-gray-900 dark:hover:text-white dark:bg-gray-900 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                              <FiInfo size={16} title="Feedback Details" />
                            </button>
                            <button onClick={() => deleteReview(review.id)}
                              className="p-1.5 text-gray- border border-gray-200 hover:border-none dark:text-white dark:border-gray-900 dark:hover:text-white dark:bg-gray-900 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                              <FiTrash2 size={16} title="Delete Feedback" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3 gap-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Showing {paginated.length} records of {processed.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-emerald-500 disabled:opacity-30 transition-all">
                      <FiChevronLeft size={16} title="Previous Page" />
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const p = i + 1;
                        return (
                          <button key={p} onClick={() => setCurrentPage(p)}
                            className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${currentPage === p ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:border-emerald-500/50'}`}>
                            {p}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-emerald-500 disabled:opacity-30 transition-all">
                      <FiChevronRight size={16} title="Next Page" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selected && <ReviewModal review={selected} onClose={() => setSelected(null)} />}
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

export default Reviews;