import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import {
  FiSearch,
  FiChevronDown,
  FiInfo,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiTool,
  FiPackage,
  FiCreditCard,
  FiDollarSign,
  FiCheckCircle,
} from 'react-icons/fi';
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
    SUBMITTED: 'bg-blue-100 text-blue-800',
    QUOTE_SENT: 'bg-teal-100 text-teal-800',
    QUOTE_APPROVED: 'bg-emerald-100 text-emerald-800',
    QUOTE_REJECTED: 'bg-amber-100 text-amber-800',
    DEVICE_COLLECTED: 'bg-purple-100 text-purple-800',
    REPAIRING: 'bg-orange-100 text-orange-800',
    REPAIR_COMPLETED: 'bg-green-100 text-green-800',
    DEVICE_DELIVERED: 'bg-green-200 text-green-900',
    CANCELLED: 'bg-red-100 text-red-800',
    FAILED: 'bg-red-200 text-red-900',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
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

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceModalRepair, setPriceModalRepair] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsRepair, setDetailsRepair] = useState(null);

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
    document.title = ' ادارة طلبات التصليح';
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
        console.log(data)
        setRepairs(data);

        const total = data.length;
        const today = data.filter(r => {
          const todayDate = new Date().toLocaleDateString('en-CA');
          const createdDate = new Date(r.createdAt || r.timestamp || r.date).toLocaleDateString('en-CA');
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
      .catch(() => toast.error('فشل جلب طلبات التصليح', { position: 'top-end' }))
      .finally(() => setLoading(false));
  }, [statusFilter, searchTerm]);

  const debouncedFetch = useMemo(() => debounce(fetchRepairs, 400), [fetchRepairs]);

  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel();
  }, [debouncedFetch]);

  const openStatusModal = (repair) => {
    const currentStatus = (repair.status || '').toUpperCase();
    if (!nextStatuses[currentStatus]?.length) {
      toast.info('لا يمكن تحديث حالة هذا الطلب', { position: 'top-end' });
      return;
    }
    setStatusModalRepair(repair);
    setSelectedNewStatus('');
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedNewStatus) {
      toast.error('يرجى اختيار حالة جديدة', { position: 'top-end' });
      return;
    }

    const currentStatus = (statusModalRepair.status || '').toUpperCase();
    if (!nextStatuses[currentStatus]?.includes(selectedNewStatus)) {
      toast.error('هذا الانتقال غير مسموح', { position: 'top-end' });
      return;
    }

    const prevRepairs = [...repairs];
    setRepairs(prevRepairs.map(r => 
      r.id === statusModalRepair.id ? { ...r, status: selectedNewStatus } : r
    ));

    try {
      await api.put(`/api/shops/repair-request/${statusModalRepair.id}/status`, {
        sessionId: statusModalRepair.sessionId || statusModalRepair.id,
        content: '',
      });
      toast.success(`تم تحديث الحالة إلى ${statusArabic[selectedNewStatus]}`, { position: 'top-end' });
    } catch (err) {
      setRepairs(prevRepairs);
      toast.error('فشل تحديث الحالة', { position: 'top-end' });
    } finally {
      setShowStatusModal(false);
      setStatusModalRepair(null);
      setSelectedNewStatus('');
    }
  };

  const openPriceModal = (repair) => {
    setPriceModalRepair(repair);
    setNewPrice(repair.price || '');
    setShowPriceModal(true);
  };

  const confirmPriceUpdate = async () => {
    if (!newPrice || newPrice <= 0) {
      toast.error('يرجى إدخال سعر صحيح', { position: 'top-end' });
      return;
    }

    const prevRepairs = [...repairs];
    setRepairs(prevRepairs.map(r => 
      r.id === priceModalRepair.id ? { ...r, price: Number(newPrice) } : r
    ));

    try {
      await api.put(`/api/shops/repair-request/${priceModalRepair.id}/price`, { price: Number(newPrice) });
      toast.success('تم حفظ السعر بنجاح', { position: 'top-end' });
    } catch {
      setRepairs(prevRepairs);
      toast.error('فشل حفظ السعر', { position: 'top-end' });
    } finally {
      setShowPriceModal(false);
      setPriceModalRepair(null);
      setNewPrice('');
    }
  };

  const openDetailsModal = (repair) => {
    setDetailsRepair(repair);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'تاريخ غير صالح';
    return date.toLocaleDateString('ar-EG');
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
      <div style={{ marginTop: "-1225px", marginLeft: "-250px" }} className="min-h-screen bg-gray-50 font-cairo py-8">
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

            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">في انتظار العرض</p>
                  <p className="text-4xl font-bold mt-3">{stats.pendingQuote}</p>
                </div>
                <FiInfo className="text-6xl opacity-40" />
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
              <div className="flex-1 relative">
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
                  className="px-8 py-3.5 bg-gray-50 border text-gray-600 rounded-xl flex items-center justify-between gap-4 min-w-48 font-medium text-base shadow transition"
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-5 py-4 text-base font-bold text-right">#</th>
                      <th className="px-5 py-4 text-base font-bold">المتجر</th>
                      <th className="px-5 py-4 text-base font-bold">السعر</th>
                      {/* <th className="px-5 py-4 text-base font-bold">التاريخ</th> */}
                      <th className="px-5 py-4 text-base font-bold">الحالة</th>
                      <th className="px-5 py-4 text-base font-bold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-20 text-gray-500 text-xl">
                          لا توجد طلبات تصليح حالياً
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((r, i) => {
                        const globalIdx = (currentPage - 1) * itemsPerPage + i + 1;
                        return (
                          <tr key={r.id} className="hover:bg-gray-50 transition">
                            <td className="px-5 py-4 text-sm font-medium text-gray-800">{globalIdx}</td>
                            <td className="px-5 py-4 text-sm text-gray-700 text-right">{r.shopName || '—'}</td>
                            <td className="px-5 py-4 text-center font-bold">
                              <span className={`${r.price ? 'text-lime-700' : 'text-red-600'}`}>
                                {r.price ? `${r.price} ج.م` : 'غير محدد'}
                              </span>
                            </td>
                            {/* <td className="px-5 py-4 text-center text-sm">
                              {formatDate(r.createdAt || r.timestamp || r.date)}
                            </td> */}
                            <td className="px-5 py-4 text-center">
                              <button
                                onClick={() => openStatusModal(r)}
                                className={`px-4 py-2 rounded-full text-xs font-bold ${getStatusColor((r.status || '').toUpperCase())} hover:shadow transition`}
                              >
                                {statusArabic[(r.status || '').toUpperCase()] || 'غير معروف'}
                              </button>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => openPriceModal(r)}
                                  className="px-3 py-2 flex items-center gap-1 bg-transparent text-emerald-500 border border-emerald-500 rounded-3xl text-xs font-medium transition shadow-sm"
                                >
                                  <FiDollarSign className="w-4 h-4" />
                                  {r.price ? 'تعديل السعر' : 'تحديد السعر'}
                                </button>

                                <button
                                  onClick={() => openDetailsModal(r)}
                                  className="px-3 py-2 flex items-center gap-1 bg-transparent border border-amber-500 text-amber-500 rounded-3xl text-xs font-medium transition shadow-sm"
                                >
                                  <FiInfo className="w-4 h-4" /> تفاصيل
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

          {showStatusModal && statusModalRepair && (
            <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-bold text-gray-900">
                    تحديث حالة طلب التصليح #{statusModalRepair.id}
                  </h3>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="p-4 hover:bg-gray-100 rounded-full transition"
                  >
                    <FiX className="w-8 h-8" />
                  </button>
                </div>

                <div className="text-center mb-12">
                  <p className="text-xl text-gray-700 mb-6">الحالة الحالية</p>
                  <span className={`inline-block px-8 py-4 rounded-2xl text-2xl font-bold ${getStatusColor((statusModalRepair.status || '').toUpperCase())}`}>
                    {statusArabic[(statusModalRepair.status || '').toUpperCase()] || statusModalRepair.status}
                  </span>
                </div>

                <div>
                  <p className="text-2xl font-bold text-center mb-10">اختر الحالة الجديدة</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {nextStatuses[(statusModalRepair.status || '').toUpperCase()]?.map((status) => (
                      <button
                        key={status}
                        onClick={() => setSelectedNewStatus(status)}
                        className={`p-10 rounded-3xl border-4 transition-all shadow-lg ${
                          selectedNewStatus === status
                            ? 'border-lime-600 bg-lime-50 scale-105'
                            : 'border-gray-300 hover:border-lime-400 hover:bg-lime-50'
                        }`}
                      >
                        <p className="text-2xl font-bold mb-4">{statusArabic[status]}</p>
                        <span className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${getStatusColor(status)}`}>
                          معاينة
                        </span>
                      </button>
                    ))}
                  </div>
                  {nextStatuses[(statusModalRepair.status || '').toUpperCase()]?.length === 0 && (
                    <p className="text-center text-xl text-gray-600 mt-10">
                      لا توجد حالات متاحة للتحديث (الطلب مرفوض أو مكتمل)
                    </p>
                  )}
                </div>

                <div className="flex justify-center gap-8 mt-16">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="px-12 py-5 border-4 border-gray-400 rounded-2xl text-xl font-bold hover:bg-gray-100 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmStatusUpdate}
                    disabled={!selectedNewStatus}
                    className="px-16 py-6 bg-lime-600 text-white rounded-2xl text-2xl font-bold hover:bg-lime-700 disabled:opacity-50 transition shadow-2xl"
                  >
                    تأكيد التحديث
                  </button>
                </div>
              </div>
            </div>
          )}

          {showPriceModal && priceModalRepair && (
            <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {priceModalRepair.price ? 'تعديل السعر' : 'تحديد السعر'} - طلب #{priceModalRepair.id}
                  </h3>
                  <button
                    onClick={() => setShowPriceModal(false)}
                    className="p-4 hover:bg-gray-100 rounded-full transition"
                  >
                    <FiX className="w-8 h-8" />
                  </button>
                </div>

                <div className="text-center mb-10">
                  <p className="text-xl text-gray-700 mb-6">السعر الحالي</p>
                  <p className="text-4xl font-bold text-lime-700">
                    {priceModalRepair.price ? `${priceModalRepair.price} ج.م` : 'غير محدد'}
                  </p>
                </div>

                <div className="mb-12">
                  <label className="block text-xl font-bold text-gray-800 mb-4 text-center">
                    أدخل السعر الجديد
                  </label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="السعر بالجنيه المصري"
                    className="w-full px-6 py-5 text-2xl text-center border-4 border-gray-300 rounded-2xl focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none transition"
                    min="1"
                  />
                </div>

                <div className="flex justify-center gap-8">
                  <button
                    onClick={() => setShowPriceModal(false)}
                    className="px-12 py-5 border-4 border-gray-400 rounded-2xl text-xl font-bold hover:bg-gray-100 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmPriceUpdate}
                    disabled={!newPrice || newPrice <= 0}
                    className="px-16 py-6 bg-lime-600 text-white rounded-2xl text-2xl font-bold hover:bg-lime-700 disabled:opacity-50 transition shadow-2xl"
                  >
                    حفظ السعر
                  </button>
                </div>
              </div>
            </div>
          )}

          {showDetailsModal && detailsRepair && (
            <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-10">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-bold text-gray-900">
                    تفاصيل طلب التصليح #{detailsRepair.id}
                  </h3>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-4 hover:bg-gray-100 rounded-full transition"
                  >
                    <FiX className="w-8 h-8" />
                  </button>
                </div>

                <div className="space-y-8 text-right text-lg">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <p className="font-bold text-xl mb-3">المتجر</p>
                    <p className="text-gray-700">{detailsRepair.shopName || 'غير محدد'}</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <p className="font-bold text-xl mb-3">الوصف</p>
                    <p className="text-gray-700">{detailsRepair.description || 'لا يوجد وصف'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <p className="font-bold text-xl mb-3">طريقة التسليم</p>
                      <p className="text-gray-700">{detailsRepair.deliveryMethod || '—'}</p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6">
                      <p className="font-bold text-xl mb-3">طريقة الدفع</p>
                      <p className="text-gray-700">{detailsRepair.paymentMethod || '—'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <p className="font-bold text-xl mb-3">عنوان التسليم</p>
                    <p className="text-gray-700">{detailsRepair.deliveryAddressDetails || '—'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-2xl p-6 text-center">
                      <p className="font-bold text-xl mb-3">الحالة الحالية</p>
                      <span className={`inline-block px-8 py-4 rounded-2xl text-2xl font-bold ${getStatusColor((detailsRepair.status || '').toUpperCase())}`}>
                        {statusArabic[(detailsRepair.status || '').toUpperCase()] || detailsRepair.status}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 text-center">
                      <p className="font-bold text-xl mb-3">السعر</p>
                      <p className="text-4xl font-bold text-lime-700">
                        {detailsRepair.price ? `${detailsRepair.price} ج.م` : 'غير محدد'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <p className="font-bold text-xl mb-3">تاريخ الطلب</p>
                    <p className="text-gray-700">{formatDate(detailsRepair.createdAt || detailsRepair.timestamp || detailsRepair.date)}</p>
                  </div>
                </div>

                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-16 py-6 bg-lime-600 text-white rounded-2xl text-2xl font-bold hover:bg-lime-700 transition shadow-2xl"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ShopLayout>
  );
};

export default RepairRequests;