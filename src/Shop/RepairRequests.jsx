import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import { FiSearch, FiChevronDown, FiInfo, FiDollarSign, FiRefreshCw, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import ShopLayout from '../components/ShopLayout';
import api from '../api';
import debounce from 'lodash/debounce';

// -------------------------------------------------
// Status translations
// -------------------------------------------------
const statusTranslations = {
  SUBMITTED: 'مقدم',
  QUOTE_PENDING: 'في انتظار عرض السعر',
  QUOTE_SENT: 'تم إرسال عرض السعر',
  QUOTE_APPROVED: 'تمت الموافقة على عرض السعر',
  QUOTE_REJECTED: 'تم رفض عرض السعر',
  DEVICE_COLLECTED: 'تم جمع الجهاز',
  REPAIRING: 'قيد التصليح',
  REPAIR_COMPLETED: 'اكتمل التصليح',
  DEVICE_DELIVERED: 'تم تسليم الجهاز',
  CANCELLED: 'ملغى',
  FAILED: 'فشل',
  all: 'الكل',
};


const getTranslatedStatus = (status) => {
  const normalized = status?.toString().toUpperCase().trim();
  return statusTranslations[normalized] ?? status ?? 'غير معروف';
};
const statuses = Object.keys(statusTranslations).filter((s) => s !== 'all');

// -------------------------------------------------
// Next valid statuses (define flow)
// -------------------------------------------------
const nextStatuses = {
  SUBMITTED: ['QUOTE_PENDING', 'CANCELLED'],
  QUOTE_PENDING: ['QUOTE_SENT'],
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
const normalizeStatus = (status) => {
  if (!status) return null;
  return status.toString().toUpperCase().trim();
};

// -------------------------------------------------
// Status badge colour
// -------------------------------------------------
const getStatusColor = (status) => {
  const map = {
    SUBMITTED: 'bg-blue-100 text-blue-800',
    QUOTE_PENDING: 'bg-yellow-100 text-yellow-800',
    QUOTE_SENT: 'bg-teal-100 text-teal-800',
    QUOTE_APPROVED: 'bg-emerald-100 text-emerald-800',
    QUOTE_REJECTED: 'bg-red-100 text-red-800',
    DEVICE_COLLECTED: 'bg-purple-100 text-purple-800',
    REPAIRING: 'bg-orange-100 text-orange-800',
    REPAIR_COMPLETED: 'bg-green-100 text-green-800',
    DEVICE_DELIVERED: 'bg-green-200 text-green-900',
    CANCELLED: 'bg-red-100 text-red-800',
    FAILED: 'bg-red-200 text-red-900',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
};
 


const RepairRequests = () => {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalRepair, setStatusModalRepair] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const dropdownRef = useRef(null);
  const repairsPerPage = 10;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // -------------------------------------------------
  // Fetch repairs
  // -------------------------------------------------
  const fetchRepairs = useCallback(async () => {
    setIsLoading(true);
    const controller = new AbortController();
    try {
      const url =
        statusFilter === 'all'
          ? '/api/shops/repair-request'
          : `/api/shops/repair-request/status/${statusFilter}`;
      const res = await api.get(url, {
        signal: controller.signal,
        params: { query: searchTerm },
      });
      setRepairs(res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error('فشل جلب الطلبات');
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [statusFilter, searchTerm]);

  const debouncedFetch = useMemo(() => debounce(fetchRepairs, 300), [fetchRepairs]);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  // -------------------------------------------------
  // View Details
  // -------------------------------------------------
  const viewRepairDetails = async (repairId) => {
    try {
      const { data } = await api.get(`/api/shops/repair-request/${repairId}`);
      const html = `
        <div class="text-right font-cairo space-y-3 text-sm">
          <p class="flex justify-between flex-row-reverse"><strong class="text-lime-600">المعرف</strong> ${data.id}</p>
          <p class="flex justify-between flex-row-reverse"><strong class="text-lime-600">اسم المتجر</strong> ${data.shopName || 'غير متوفر'}</p>
          <p class="flex justify-between flex-row-reverse"><strong class="text-lime-600">تفاصيل العنوان</strong> ${data.deliveryAddressDetails || 'غير متوفر'}</p>
          <p class="flex justify-between flex-row-reverse"><strong class="text-lime-600">الوصف</strong> ${data.description || 'غير متوفر'}</p>
          <p class="flex justify-between flex-row-reverse"><strong class="text-lime-600">طريقة التوصيل</strong> ${data.deliveryMethod || 'غير متوفر'}</p>
          <p class="flex justify-between flex-row-reverse"><strong class="text-lime-600">طريقة الدفع</strong> ${data.paymentMethod || 'غير متوفر'}</p>

<p className="flex justify-between flex-row-reverse">
  <strong className="text-lime-600">الحالة</strong>
  <span className={px-2 py-1 rounded-full text-xs ${getStatusColor(data.status)}}>
    {getTranslatedStatus(data.status)}
  </span>
</p>
          <p class="flex justify-between flex-row-reverse"><strong class="text-lime-600">تم التأكيد</strong> ${data.confirmed ? 'نعم' : 'لا'}</p>
        </div>`;
      Swal.fire({
        title:` # ${data.id}`,
        html,
        icon: 'info',
        confirmButtonText: 'إغلاق',
        confirmButtonColor: '#84cc16',
        width: '600px',
      });
    } catch (err) {
      toast.error('فشل جلب التفاصيل');
    }
  };

  // -------------------------------------------------
  // Update Price
  // -------------------------------------------------
  const updateRepairPrice = async (repairId, price) => {
    if (!price || price <= 0) return toast.error('السعر غير صالح');
    try {
      await api.put(`/api/shops/repair-request/${repairId}/price`, { price });
      toast.success(` تحديث السعر إلى ${price} ج.م`);
      fetchRepairs();
    } catch (err) {
      toast.error('فشل تحديث السعر');
    }
  };

  // -------------------------------------------------
  // Open Status Modal
  // -------------------------------------------------
  const openStatusUpdateModal = (repair) => {
    setStatusModalRepair(repair);
    setSelectedNewStatus('');
    setShowStatusModal(true);
  };

  // -------------------------------------------------
  // Confirm Status Update
  // -------------------------------------------------
const confirmStatusUpdate = async () => {
  if (!statusModalRepair || !selectedNewStatus) return;

  setUpdatingStatus(statusModalRepair.id);
  setShowStatusModal(false);

  try {
    await api.put(`/api/shops/repair-request/${statusModalRepair.id}/status`, {
      newStatus: selectedNewStatus,
    });

setRepairs(prev =>
  prev.map(item =>
    item.id === statusModalRepair.id
      ? { ...item, status: selectedNewStatus }
      : item
  )
);
    

    toast.success(` تحديث الحالة إلى ${statusTranslations[selectedNewStatus] || selectedNewStatus}`);


    await fetchRepairs();
  } catch (err) {
    toast.error(err.response?.data?.message || 'فشل تحديث الحالة');
  } finally {
    setUpdatingStatus(null);
  }
};

  const filteredRepairs = useMemo(() => {
    let list = [...repairs];

    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          (r.description || '').toLowerCase().includes(lower) ||
          (r.userId || '').toString().includes(lower) ||
          (r.shopName || '').toLowerCase().includes(lower)
      );
    }

    return list;
  }, [repairs, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredRepairs.length / repairsPerPage);
  const pageRepairs = filteredRepairs.slice(
    (currentPage - 1) * repairsPerPage,
    currentPage * repairsPerPage
  );

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };


  return (
    <ShopLayout>
      <div style={{ marginTop: '-1225px', marginLeft: '-25px' }} className="min-h-screen max-w-6xl mx-auto p-4 lg:p-8 font-cairo bg-gradient-to-br from-gray-50 via-white to-white">
        {/* Header */}
        <div className="mb-8 text-right bg-white p-6 shadow-md border-l-4 border-lime-500 ">
          <h1 className="text-3xl font-bold text-black mb-2">طلبات التصليح</h1>
          <p className="text-sm text-gray-600">إدارة ومتابعة طلبات التصليح بسهولة</p>
        </div>

        
        <div className="flex flex-col sm:flex-row sm:flex-row-reverse items-center justify-between gap-4 mb-6 bg-white rounded-xl shadow-sm p-5 border ">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder=" ...ابحث في الطلبات"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none transition-all text-sm text-right"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-56" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg flex justify-between flex-row-reverse items-center hover:bg-gray-100 transition-all text-sm font-medium text-black"
            >
              <span>{statusTranslations[statusFilter]}</span>
              <FiChevronDown className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {['all', ...statuses].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusFilter(s);
                      setIsDropdownOpen(false);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 text-right hover:bg-lime-50 transition-all text-sm font-medium text-black"
                  >
                    {statusTranslations[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

 
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border ">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">المتجر</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">السعر</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">الوصف</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {pageRepairs.length > 0 ? (
                    pageRepairs.map((r, i) => {
                      const globalIdx = (currentPage - 1) * repairsPerPage + i + 1;
                      const priceDisplay = r.price ? `${r.price} ج.م `:  "" ;

                      return (
                        <tr key={r.id} className="hover:bg-lime-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-black">{globalIdx}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-black">{r.shopName || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-black">{priceDisplay}</td>
                          <td className="px-6 py-4 text-sm text-center text-black max-w-xs truncate">{r.description || '—'}</td>

     <td className="px-6 py-4 whitespace-nowrap text-center">
  <button
    onClick={() => openStatusUpdateModal(r)}
    disabled={updatingStatus === r.id}
    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:shadow-md ${
      getStatusColor(r.status)
    } disabled:opacity-70 disabled:cursor-not-allowed`}
  >
    {updatingStatus === r.id ? (
      <>
        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>جاري...</span>
      </>
    ) : (
      <>
        <span>{getTranslatedStatus(r.status)}</span>
        {nextStatuses[r.status]?.length > 0 && <FiChevronDown className="w-3 h-3" />}
      </>
    )}
  </button>
</td>

                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
  <div className="flex items-center justify-center gap-2">
    <button
      onClick={() => viewRepairDetails(r.id)}
      className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-all text-xs"
    >
      <FiInfo className="w-4 h-4" /> تفاصيل
    </button>

    
    <button
      onClick={() => {
        Swal.fire({
          title: 'أدخل السعر الجديد',
          input: 'number',
          inputValue: r.price || '',
          showCancelButton: true,
          confirmButtonText: 'تحديث',
          cancelButtonText: 'إلغاء',
          confirmButtonColor: '#84cc16',
          preConfirm: (v) => {
            if (v && v > 0) updateRepairPrice(r.id, v);
            else toast.error('السعر يجب أن يكون أكبر من 0');
          },
        });
      }}
      className="flex items-center gap-1 px-3 py-1.5 bg-lime-100 text-lime-700 rounded-lg hover:bg-lime-200 transition-all text-xs"
    >
      <FiDollarSign className="w-4 h-4 " /> {r.price ? 'تحديث السعر' : 'إضافة سعر'}
    </button>
 
  </div>
</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="w-16 h-16 mx-auto text-lime-400 mb-4">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-black mb-2">
                          {repairs.length === 0 ? 'لا توجد طلبات' : 'لا توجد نتائج'}
                        </h3>
                        <p className="text-gray-600">
                          {searchTerm ? 'جرب تعديل كلمات البحث' : 'جميع الطلبات تمت معالجتها'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-6">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              السابق
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => changePage(page)}
                    className={`px-4 py-2 border rounded-lg transition-all text-sm font-medium ${
                      currentPage === page
                        ? 'bg-lime-500 text-white border-lime-500'
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-black'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="px-2 py-2 text-gray-600">...</span>}
            </div>

            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              التالي
            </button>
          </div>
        )}

     
        {showStatusModal && statusModalRepair && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md font-cairo text-right">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">تحديث حالة الطلب #{statusModalRepair.id}</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <FiX className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">الحالة الحالية:</p>
            
<span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(statusModalRepair.status)}`}>
  {getTranslatedStatus(statusModalRepair.status)}
</span>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">اختر الحالة الجديدة:</p>
                <div className="space-y-2">
                  {nextStatuses[statusModalRepair.status]?.map((s) => (
                    <label
                      key={s}
                      className="flex items-center justify-end gap-2 cursor-pointer p-2 rounded-lg hover:bg-lime-50 transition"
                    >
                      <input
                        type="radio"
                        name="newStatus"
                        value={s}
                        checked={selectedNewStatus === s}
                        onChange={(e) => setSelectedNewStatus(e.target.value)}
                        className="w-4 h-4 text-lime-600"
                      />
                      <span className="text-sm font-medium">{statusTranslations[s]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  disabled={!selectedNewStatus || updatingStatus}
                  className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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