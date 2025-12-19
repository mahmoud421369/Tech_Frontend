import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  FiSearch,
  FiChevronDown,
  FiInfo,
  FiDollarSign,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiTool,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiCreditCard,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import ShopLayout from '../components/ShopLayout';
import api from '../api';
import debounce from 'lodash/debounce';

const nextStatuses = {
  SUBMITTED: ['QUOTE_SENT', 'CANCELLED'],
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
    SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
    QUOTE_SENT: 'bg-teal-100 text-teal-800 border-teal-200',
    QUOTE_APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    QUOTE_REJECTED: 'bg-amber-100 text-amber-800 border-amber-200',
    DEVICE_COLLECTED: 'bg-purple-100 text-purple-800 border-purple-200',
    REPAIRING: 'bg-orange-100 text-orange-800 border-orange-200',
    REPAIR_COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    DEVICE_DELIVERED: 'bg-green-200 text-green-900 border-green-300',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    FAILED: 'bg-red-200 text-red-900 border-red-300',
  };
  return map[status] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const statusArabic = {
  SUBMITTED: 'تم التقديم',
  QUOTE_SENT: 'تم إرسال العرض',
  QUOTE_APPROVED: 'تمت الموافقة على العرض',
  QUOTE_REJECTED: 'تم رفض العرض',
  DEVICE_COLLECTED: 'تم استلام الجهاز',
  REPAIRING: 'تحت الإصلاح',
  REPAIR_COMPLETED: 'تم الإصلاح',
  DEVICE_DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغاة',
  FAILED: 'فشلت',
};

const TableRow = memo(({ r, openStatusModal, updatePrice }) => {
  const currentStatus = (r.status || '').toUpperCase();
  const hasNext = nextStatuses[currentStatus]?.length > 0;
  const hasPrice = !!r.price;
  const priceDisabled = hasPrice && ['QUOTE_APPROVED', 'DEVICE_COLLECTED', 'REPAIRING', 'REPAIR_COMPLETED', 'DEVICE_DELIVERED'].includes(currentStatus);

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-200">
      <td className="px-6 py-5 text-sm text-gray-700">{r.shopName || '—'}</td>
      <td className="px-6 py-5 text-center">
        <span className={`font-bold ${r.price ? 'text-lime-700' : 'text-red-600'}`}>
          {r.price ? `${r.price} ج.م` : 'غير محدد'}
        </span>
      </td>
      <td className="px-6 py-5 text-sm text-gray-800 max-w-xs">
        <p className="truncate" title={r.description}>{r.description || '—'}</p>
      </td>
      <td className="px-6 py-5 text-center">
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold border ${getStatusColor(currentStatus)}`}>
          {statusArabic[currentStatus] || currentStatus.replace('_', ' ')}
        </span>
      </td>
      <td className="px-6 py-5 text-center text-sm">
        <span className="inline-flex items-center gap-1 text-gray-600">
          <FiPackage className="w-4 h-4" />
          {r.deliveryMethod || '—'}
        </span>
      </td>
      <td className="px-6 py-5 text-center text-sm">
        <span className="inline-flex items-center gap-1 text-gray-600">
          <FiCreditCard className="w-4 h-4" />
          {r.paymentMethod || '—'}
        </span>
      </td>
      <td className="px-6 py-5 text-center">
        <button
          onClick={() => openStatusModal(r)}
          disabled={!hasNext}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
            hasNext
              ? 'bg-lime-600 text-white hover:bg-lime-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          تحديث الحالة
        </button>
      </td>
      <td className="px-6 py-5">
        <div className="flex justify-center gap-3">
          <button
            onClick={() =>
              Swal.fire({
                title: hasPrice ? 'تعديل السعر' : 'تحديد السعر',
                input: 'number',
                inputValue: r.price || '',
                inputPlaceholder: 'السعر بالجنيه المصري',
                showCancelButton: true,
                confirmButtonText: 'حفظ',
                cancelButtonText: 'إلغاء',
                preConfirm: (value) => {
                  if (value && value > 0) {
                    updatePrice(r.id, value);
                    Swal.fire({ title: 'Success', text: 'تم تعديل السعر', icon: 'success', toast: true, position: 'top-end', timer: 1500 })
                  }
                  else {toast.error('يرجى إدخال سعر صحيح')};
                },
              })
            }
            disabled={priceDisabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-3xl text-sm font-medium transition-all shadow-sm ${
              priceDisabled
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-transparent text-emerald-500 border border-emerald-500 '
            }`}
          >
            <FiDollarSign className="w-4 h-4" />
            {hasPrice ? 'تعديل' : 'تحديد'}
          </button>

          <button
            onClick={() =>
              Swal.fire({
                title: `تفاصيل طلب التصليح #${r.id}`,
                icon: 'info',
                html: `
                  <div class="text-right space-y-4 text-sm">
                    <p><strong>المتجر:</strong> ${r.shopName || 'غير محدد'}</p>
                    <p><strong>الوصف:</strong> ${r.description || 'لا يوجد'}</p>
                    <p><strong>طريقة التسليم:</strong> ${r.deliveryMethod || '—'}</p>
                    <p><strong>طريقة الدفع:</strong> ${r.paymentMethod || '—'}</p>
                    <p><strong>عنوان التسليم:</strong> ${r.deliveryAddressDetails || '—'}</p>
                    <p><strong>الحالة:</strong> <span class="${getStatusColor(currentStatus)} px-3 py-1 rounded-full text-xs font-bold">${statusArabic[currentStatus] || currentStatus.replace('_', ' ')}</span></p>
                    <p><strong>السعر:</strong> ${r.price ? r.price + ' ج.م' : 'غير محدد'}</p>
                  </div>
                `,
                confirmButtonText: 'إغلاق',
              })
            }
            className="flex items-center gap-2 px-4 py-2 bg-transparent border border-amber-500 text-amber-500 rounded-3xl  text-sm font-medium transition shadow-sm"
          >
            <FiInfo className="w-4 h-4" /> تفاصيل
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

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalRepair, setStatusModalRepair] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');

  
  const [stats, setStats] = useState({
    totalRepairs: 0,
    todayRepairs: 0,
    pendingQuote: 0,
    underRepair: 0,
    completed: 0,
  });

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

  const fetchRepairs = useCallback(() => {
    setLoading(true);
    const url = statusFilter === 'all'
      ? '/api/shops/repair-request'
      : `/api/shops/repair-request/status/${statusFilter.toUpperCase()}`;

    api.get(url, { params: { query: searchTerm } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.content || [];
        setRepairs(data);

       
        const total = data.length;
        const today = data.filter(r => {
          const todayDate = new Date().toLocaleDateString('en-CA');
          const createdDate = new Date(r.createdAt || r.timestamp).toLocaleDateString('en-CA');
          return createdDate === todayDate;
        }).length;

        const pending = data.filter(r => ['SUBMITTED', 'QUOTE_SENT'].includes((r.status || '').toUpperCase())).length;
        const repairing = data.filter(r => (r.status || '').toUpperCase() === 'REPAIRING').length;
        const completed = data.filter(r => ['REPAIR_COMPLETED', 'DEVICE_DELIVERED'].includes((r.status || '').toUpperCase())).length;

        setStats({
          totalRepairs: total,
          todayRepairs: today,
          pendingQuote: pending,
          underRepair: repairing,
          completed: completed,
        });

        setCurrentPage(1);
      })
      .catch(() => toast.error('فشل جلب طلبات التصليح'))
      .finally(() => setLoading(false));
  }, [statusFilter, searchTerm]);

  const debouncedFetch = useMemo(() => debounce(fetchRepairs, 400), [fetchRepairs]);

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

    const currentStatus = (statusModalRepair.status || '').toUpperCase();
    if (!nextStatuses[currentStatus]?.includes(selectedNewStatus)) {
      toast.error('هذا الانتقال غير مسموح');
      return;
    }

    setRepairs((prev) =>
      prev.map((r) =>
        r.id === statusModalRepair.id ? { ...r, status: selectedNewStatus.toLowerCase() } : r
      )
    );

    toast.promise(
      api.put(`/api/shops/repair-request/${statusModalRepair.id}/status`, {
        newStatus: selectedNewStatus,
      }),
      {
        pending: 'جاري تحديث الحالة...',
        success: `تم تحديث الحالة إلى ${statusArabic[selectedNewStatus]}`,
        error: 'فشل تحديث الحالة',
      }
    )
      .then(() => fetchRepairs())
      .catch(() => {
        setRepairs((prev) =>
          prev.map((r) =>
            r.id === statusModalRepair.id ? { ...r, status: statusModalRepair.status } : r
          )
        );
      })
      .finally(() => {
        setShowStatusModal(false);
        setStatusModalRepair(null);
        setSelectedNewStatus('');
      });
  };

  const updatePrice = async (id, price) => {
    if (!price || price <= 0) return;
    try {
      await api.put(`/api/shops/repair-request/${id}/price`, { price: Number(price) });
      toast.success('تم حفظ السعر بنجاح');
      fetchRepairs();
    } catch {
      toast.error('فشل حفظ السعر');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...repairs];

    if (statusFilter !== 'all') {
      list = list.filter((r) => (r.status || '').toUpperCase() === statusFilter.toUpperCase());
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter((r) =>
        String(r.id).includes(term) ||
        (r.description || '').toLowerCase().includes(term) ||
        (r.shopName || '').toLowerCase().includes(term)
      );
    }

    list.sort((a, b) => b.id - a.id);
    return list;
  }, [repairs, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginatedItems = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (


    
    <ShopLayout>

     <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
            background:#059669;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
             background:#059669;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
           background:#059669;
            border-radius: 10px;
          }
        
        `}
      </style>

      <div style={{marginTop:"-1225px",marginLeft:"-250px"}} className="min-h-screen bg-gray-50 font-cairo py-8">
        <div className="max-w-5xl mx-auto px-6">

          
          <div className="mb-10 bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between text-right gap-5">
              <div className="p-5 bg-lime-100 rounded-2xl">
                <FiTool className="text-4xl text-lime-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">طلبات التصليح</h1>
                <p className="text-lg text-gray-600 mt-2">إدارة كاملة لطلبات إصلاح الأجهزة مع تحديث فوري للحالة والسعر</p>
              </div>
            </div>
          </div>

        
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">إجمالي الطلبات</p>
                  <p className="text-4xl font-bold mt-3">{stats.totalRepairs}</p>
                </div>
                <FiPackage className="text-6xl opacity-40" />
              </div>
            </div>

            {/* <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">اليوم</p>
                  <p className="text-4xl font-bold mt-3">{stats.todayRepairs}</p>
                </div>
                <FiClock className="text-6xl opacity-40" />
              </div>
            </div> */}

            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">في انتظار العرض</p>
                  <p className="text-4xl font-bold mt-3">{stats.pendingQuote}</p>
                </div>
                <FiAlertCircle className="text-6xl opacity-40" />
              </div>
            </div>

            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">تحت الإصلاح</p>
                  <p className="text-4xl font-bold mt-3">{stats.underRepair}</p>
                </div>
                <FiTool className="text-6xl opacity-40" />
              </div>
            </div>

            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">مكتملة</p>
                  <p className="text-4xl font-bold mt-3">{stats.completed}</p>
                </div>
                <FiCheckCircle className="text-6xl opacity-40 text-green-600" />
              </div>
            </div>
          </div>

        
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
    
              <div className="flex-1  relative">
              
                <input
                  type="text"
                  placeholder="ابحث برقم الطلب، الوصف، أو اسم المتجر..."
                  className="w-full pr-12 py-3.5 pl-4 rounded-xl border border-gray-300 focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none text-base transition bg-gray-50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                  <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
              </div>

             
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpenFilterDropdown((prev) => !prev)}
                  className="px-8 py-3.5 bg-gray-50 border  text-gray-600 rounded-xl flex items-center justify-between gap-4 min-w-48 font-medium text-base shadow transition"
                >
                  <span>
                    {statusFilter === 'all' 
                      ? 'جميع الحالات' 
                      : statusArabic[statusFilter.toUpperCase()] || statusFilter}
                  </span>
                  <FiChevronDown className={`text-xl transition ${openFilterDropdown ? 'rotate-180' : ''}`} />
                </button>

                {openFilterDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-xl shadow-xl z-30 overflow-hidden">
                    <button
                      onClick={() => { setStatusFilter('all'); setOpenFilterDropdown(false); }}
                      className="w-full text-right px-6 py-3 hover:bg-lime-50 transition text-base"
                    >
                      جميع الحالات
                    </button>
                    {Object.keys(statusArabic).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setOpenFilterDropdown(false); }}
                        className="w-full text-right px-6 py-3 hover:bg-lime-50 transition text-base"
                      >
                        {statusArabic[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

       
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-20 text-center">
                <div className="w-16 h-16 border-6 border-lime-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-6 text-lg text-gray-600">جاري تحميل الطلبات...</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-5 py-4 text-base font-bold text-right">المتجر</th>
                      <th className="px-5 py-4 text-base font-bold text-center">السعر</th>
                      <th className="px-5 py-4 text-base font-bold text-center">الوصف</th>
                      <th className="px-5 py-4 text-base font-bold text-center">الحالة</th>
                      <th className="px-5 py-4 text-base font-bold text-center">التسليم</th>
                      <th className="px-5 py-4 text-base font-bold text-center">الدفع</th>
                      <th className="px-5 py-4 text-base font-bold text-center">تحديث الحالة</th>
                      <th className="px-5 py-4 text-base font-bold text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-20 text-gray-500 text-xl">
                          لا توجد طلبات تصليح حالياً
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((r) => (
                        <TableRow
                          key={r.id}
                          r={r}
                          openStatusModal={openStatusModal}
                          updatePrice={updatePrice}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
                    
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-10">
           
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-3 bg-white border border-lime-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 text-lime-700 font-medium transition shadow-sm flex items-center gap-2"
              >
                <FiChevronLeft className="w-5 h-5" />
                السابق
              </button>

              {/* Page Numbers */}
              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-12 h-12 rounded-xl font-bold text-base transition shadow-sm flex items-center justify-center ${
                      currentPage === i + 1
                        ? 'bg-lime-600 text-white'
                        : 'bg-white border border-lime-600 text-lime-700 hover:bg-lime-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-3 bg-white border border-lime-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 text-lime-700 font-medium transition shadow-sm flex items-center gap-2"
              >
                التالي
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </ShopLayout>
  );
};

export default RepairRequests;