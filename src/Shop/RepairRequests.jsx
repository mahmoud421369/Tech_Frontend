
import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  FiSearch,
  FiChevronDown,
  FiInfo,
  FiDollarSign,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import ShopLayout from '../components/ShopLayout';
import api from '../api';
import debounce from 'lodash/debounce';


const nextStatuses = {
  SUBMITTED: ['QUOTE_SENT', 'CANCELLED'],
  // QUOTE_PENDING: ['QUOTE_SENT'],
  QUOTE_SENT: ['QUOTE_APPROVED', 'QUOTE_REJECTED'],
  QUOTE_APPROVED: ['DEVICE_COLLECTED'],
  QUOTE_REJECTED: ['CANCELLED'],
  DEVICE_COLLECTED: ['REPAIRING'],
  REPAIRING: ['REPAIR_COMPLETED'],
  REPAIR_COMPLETED: ['DEVICE_DELIVERED'],
  DEVICE_DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
};


const getStatusColor = (status) => {
  const map = {
    SUBMITTED: 'bg-blue-100 text-blue-700',
    // QUOTE_PENDING: 'bg-yellow-100 text-yellow-700',
    QUOTE_SENT: 'bg-teal-100 text-teal-700',
    QUOTE_APPROVED: 'bg-emerald-100 text-emerald-700',
    QUOTE_REJECTED: 'bg-amber-100 text-amber-700',
    DEVICE_COLLECTED: 'bg-purple-100 text-purple-700',
    REPAIRING: 'bg-orange-100 text-orange-700',
    REPAIR_COMPLETED: 'bg-green-100 text-green-700',
    DEVICE_DELIVERED: 'bg-green-200 text-green-900',
    CANCELLED: 'bg-red-100 text-red-700',
    FAILED: 'bg-red-200 text-red-900',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};


const TableRow = memo(({ r, idx, openStatusModal, updatePrice, getStatusColor, nextStatuses }) => {
  const currentStatus = (r.status || '').toUpperCase();
  const hasNext = nextStatuses[currentStatus]?.length > 0;
  const hasPrice = !!r.price;
  const priceButtonDisabled = hasPrice && currentStatus === 'QUOTE_APPROVED';

  return (
    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 text-center font-medium" aria-label={` الطلب ${idx}`}>{idx}</td>
      <td className="px-6 py-4" aria-label="اسم المتجر">{r.shopName || '—'}</td>
      <td className="px-6 py-4 text-center font-bold text-lime-700" aria-label="السعر">
        {r.price ? `${r.price}` : 'غير محدد'}
      </td>
      <td className="px-6 py-4 text-right max-w-xs truncate" title={r.description}>{r.description || '—'}</td>

      <td className="px-6 py-4 text-center">
        <button
          onClick={() => openStatusModal(r)}
          disabled={!hasNext}
          aria-label={` حالة الطلب إلى ${currentStatus}`}
          className={`px-4 py-2 rounded-full text-xs font-bold transition hover:shadow-md ${getStatusColor(
            currentStatus
          )} disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-lime-500`}
        >
          <span aria-hidden="true">{currentStatus}</span>
          {hasNext && <FiChevronDown className="inline mr-1" aria-hidden="true" />}
        </button>
      </td>

      <td className="px-6 py-4">
        <div className="flex justify-center gap-3">
          <button
            onClick={() =>
              Swal.fire({
                title: hasPrice ? 'تعديل السعر' : 'تحديد السعر',
                input: 'number',
                inputValue: r.price || '',
                inputPlaceholder: 'السعر بالجنيه',
                showCancelButton: true,
                confirmButtonText: 'حفظ',
                cancelButtonText: 'إلغاء',
                preConfirm: (value) => {
                  if (value > 0) updatePrice(r.id, value);
                },
              })
            }
            disabled={priceButtonDisabled}
            aria-label={priceButtonDisabled ? 'السعر نهائي ولا يمكن تعديله' : 'تعديل أو تحديد السعر'}
            aria-disabled={priceButtonDisabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-lime-500 ${
              priceButtonDisabled
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : hasPrice
                ? 'bg-lime-100 text-lime-700 hover:bg-lime-200'
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            <FiDollarSign className="w-4 h-4" aria-hidden="true" />
            {hasPrice ? 'تعديل السعر' : 'تحديد السعر'}
          </button>

          <button
            onClick={() =>
              Swal.fire({
                title:` طلب تصليح #${r.id}`,
                html: `
                  <div class="text-right space-y-3">
                    <p><strong>المتجر:</strong> ${r.shopName || 'غير محدد'}</p>
                    <p><strong>الوصف:</strong> ${r.description || 'لا يوجد'}</p>
                    <p><strong>الحالة:</strong> <span class="${getStatusColor(
                      currentStatus
                    )} px-3 py-1 rounded-full text-xs font-bold">${currentStatus}</span></p>
                    <p><strong>السعر:</strong> ${r.price ? r.price + ' ج.م' : 'غير محدد'}</p>
                  </div>
                `,
                confirmButtonText: 'إغلاق',
              })
            }
            aria-label="عرض تفاصيل الطلب"
            className="flex items-center gap-1 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <FiInfo className="w-4 h-4" aria-hidden="true" /> <span>تفاصيل</span>
          </button>
        </div>
      </td>
    </tr>
  );
});

const RepairRequests = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [openFilterDropdown, setOpenFilterDropdown] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalRepair, setStatusModalRepair] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');

  const dropdownRef = useRef(null);
  const itemsPerPage = 10;

  
  useEffect(() => {
    document.title = 'طلبات التصليح | لوحة تحكم المتجر';
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const fetchRepairs = useCallback(() => {
    setLoading(true);
    const url =
      statusFilter === 'all'
        ? '/api/shops/repair-request'
        : `/api/shops/repair-request/status/${statusFilter}`;

    api
      .get(url, { params: { query: searchTerm } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.content || [];
        setRepairs(data);
      })
      .catch(() => toast.error('فشل جلب طلبات التصليح'))
      .finally(() => setLoading(false));
  }, [statusFilter, searchTerm]);

  const debouncedFetch = useMemo(() => debounce(fetchRepairs, 300), [fetchRepairs]);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  const openStatusModal = (repair) => {
    setStatusModalRepair(repair);
    setSelectedNewStatus('');
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedNewStatus) {
      toast.error('يرجى اختيار حالة جديدة');
      return;
    }

    const currentStatus = (statusModalRepair.status || '').toUpperCase().trim();
    if (!nextStatuses[currentStatus]?.includes(selectedNewStatus)) {
      toast.error('هذا الانتقال غير مسموح');
      return;
    }

    setRepairs((prev) =>
      prev.map((r) => (r.id === statusModalRepair.id ? { ...r, status: selectedNewStatus } : r))
    );

    toast.success(
      <div className="flex items-center gap-3">
        <span>تم تحديث الحالة إلى</span>
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${getStatusColor(selectedNewStatus)}`}>
          {selectedNewStatus}
        </span>
      </div>,
      { position: 'top-center', autoClose: 4000 }
    );

    setShowStatusModal(false);
    setSelectedNewStatus('');
    setStatusModalRepair(null);

    try {
      await api.put(`/api/shops/repair-request/${statusModalRepair.id}/status`, {
        newStatus: selectedNewStatus,
      });
      fetchRepairs();
    } catch (err) {
      setRepairs((prev) =>
        prev.map((r) =>
          r.id === statusModalRepair.id ? { ...r, status: statusModalRepair.status } : r
        )
      );
      toast.error('فشل تحديث الحالة - تم إرجاع الحالة السابقة');
      console.error(err);
    }
  };

  const updatePrice = async (id, price) => {
    if (!price || price <= 0) return toast.error('أدخل سعرًا صحيحًا');
    try {
      await api.put(`/api/shops/repair-request/${id}/price`, { price });
      toast.success('تم حفظ السعر');
      fetchRepairs();
    } catch {
      toast.error('فشل حفظ السعر');
    }
  };

  const sortedAndFiltered = useMemo(() => {
    let list = [...repairs];

   
    if (statusFilter !== 'all') {
      list = list.filter((r) => (r.status || '').toUpperCase() === statusFilter);
    }

 
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          String(r.id).includes(term) ||
          (r.description || '').toLowerCase().includes(term) ||
          (r.shopName || '').toLowerCase().includes(term)
      );
    }

    
    if (sortConfig.key) {
      list.sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [repairs, statusFilter, searchTerm, sortConfig]);

  const totalPages = Math.ceil(sortedAndFiltered.length / itemsPerPage);
  const pageItems = sortedAndFiltered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <ShopLayout>
      <div
        style={{ marginTop: '-1225px', marginLeft: '-25px' }}
        className="min-h-screen max-w-6xl mx-auto p-4 lg:p-8 font-cairo bg-gradient-to-br from-gray-50 via-white to-white"
        aria-labelledby="repair-requests-title"
      >
      
        <header className='p-4 bg-white border-l-4 border-lime-500 text-right'>
          <h1 id="repair-requests-title" className="text-3xl font-bold text-gray-900 mb-2">
            طلبات التصليح
          </h1>
          <p className="text-gray-600">إدارة ومتابعة جميع طلبات إصلاح الأجهزة في متجرك</p>
        </header>

        <section aria-label="فلاتر البحث والحالة" className="mt-8">
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6 flex flex-col md:flex-row-reverse gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <label htmlFor="search-repairs" className="sr-only">
                ابحث في طلبات التصليح
              </label>
              <input
                id="search-repairs"
                type="text"
                placeholder="...ابحث في طلبات التصليح"
                className="w-full pr-12 pl-4 py-3 rounded-lg border bg-gray-50 focus:ring-2 focus:ring-lime-500 outline-none text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="بحث في طلبات التصليح"
              />
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpenFilterDropdown(!openFilterDropdown)}
                className="px-6 py-3 bg-gray-50 border rounded-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                aria-haspopup="true"
                aria-expanded={openFilterDropdown}
                aria-label="فلترة حسب الحالة"
              >
                <span>{statusFilter === 'all' ? 'جميع الحالات' : statusFilter}</span>
                <FiChevronDown className={`transition ${openFilterDropdown ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {openFilterDropdown && (
                <div className="absolute top-full mt-2 w-64 bg-white border rounded-lg shadow-xl z-10">
                  {['all', ...Object.keys(nextStatuses)].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setOpenFilterDropdown(false);
                        setCurrentPage(1);
                      }}
                      className="block w-full text-right px-4 py-2 hover:bg-lime-50 focus:outline-none focus:bg-lime-100"
                    >
                      {s === 'all' ? 'جميع الحالات' : s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        
        <section aria-label="قائمة طلبات التصليح">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-20 text-center" aria-live="polite">
                <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto" aria-label="جاري التحميل..."></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" role="table" aria-label="جدول طلبات التصليح">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        { key: 'id', label: '#' },
                        { key: 'shopName', label: 'المتجر' },
                        { key: 'price', label: 'السعر' },
                        { key: 'description', label: 'الوصف' },
                        { key: 'status', label: 'الحالة' },
                        { key: null, label: 'إجراءات' },
                      ].map((col) => (
                        <th
                          key={col.key || 'actions'}
                          className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center cursor-pointer hover:bg-gray-100 transition"
                          onClick={() => col.key && handleSort(col.key)}
                          scope="col"
                          aria-sort={sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <span className="flex items-center justify-center gap-1">
                            {col.label}
                            {col.key && sortConfig.key === col.key && (
                              sortConfig.direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pageItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-20 text-gray-500 text-xl">
                          لا توجد طلبات تصليح
                        </td>
                      </tr>
                    ) : (
                      pageItems.map((r, i) => (
                        <TableRow
                          key={r.id}
                          r={r}
                          idx={(currentPage - 1) * itemsPerPage + i + 1}
                          openStatusModal={openStatusModal}
                          updatePrice={updatePrice}
                          getStatusColor={getStatusColor}
                          nextStatuses={nextStatuses}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

    
        {totalPages > 1 && (
          <nav className="flex justify-center items-center gap-2 mt-8" aria-label="التنقل بين الصفحات">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-lg disabled:opacity-50 hover:bg-teal-50 text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="الصفحة السابقة"
            >
              <FiChevronLeft />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-2 rounded-lg border transition ${
                  currentPage === i + 1
                    ? 'bg-teal-500 text-white border-teal-500'
                    : 'hover:bg-teal-50 text-teal-600 border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500'
                }`}
                aria-label={` ${i + 1}`}
                aria-current={currentPage === i + 1 ? 'page' : undefined}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-lg disabled:opacity-50 hover:bg-teal-50 text-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="الصفحة التالية"
            >
              <FiChevronRight />
            </button>
          </nav>
        )}

     
        {showStatusModal && statusModalRepair && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-modal-title"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-right">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 id="status-modal-title" className="text-2xl font-bold">
                  تحديث حالة الطلب #{statusModalRepair.id}
                </h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400"
                  aria-label="إغلاق النافذة"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-lg mb-3">الحالة الحالية:</p>
                <span
                  className={`px-5 py-2 rounded-full text-sm font-bold ${getStatusColor(
                    (statusModalRepair.status || '').toUpperCase()
                  )}`}
                >
                  {(statusModalRepair.status || '').toUpperCase()}
                </span>
              </div>

              <fieldset>
                <legend className="text-lg font-semibold mb-5">اختر الحالة الجديدة:</legend>
                <div className="space-y-3">
                  {nextStatuses[(statusModalRepair.status || '').toUpperCase()]?.map((status) => (
                    <label
                      key={status}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-lime-500 ${
                        selectedNewStatus === status ? 'border-lime-500 bg-lime-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="new-status"
                          value={status}
                          checked={selectedNewStatus === status}
                          onChange={(e) => setSelectedNewStatus(e.target.value)}
                          className="w-5 h-5 text-lime-600 focus:ring-lime-500"
                        />
                        <span className="font-bold">{status}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-6 py-3 border rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  disabled={!selectedNewStatus}
                  className="px-8 py-3 bg-lime-500 text-white rounded-xl hover:bg-lime-600 disabled:opacity-50 font-bold focus:outline-none focus:ring-2 focus:ring-lime-500"
                  aria-label="تأكيد تغيير الحالة"
                >
                  تأكيد التغيير
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
};

export default RepairRequests;