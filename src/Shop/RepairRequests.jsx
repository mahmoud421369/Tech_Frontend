import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import { FiTool, FiDollarSign, FiInfo, FiChevronDown, FiSearch, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import ShopLayout from '../components/ShopLayout';
import { RiCheckLine, RiClockwiseLine } from 'react-icons/ri';
import api from '../api';
import debounce from 'lodash/debounce';

const RepairRequests = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [repairs, setRepairs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const repairsPerPage = 10;

  // Define status mappings for English to Arabic
  const statusTranslations = {
    SUBMITTED: 'مقدم',
    PRICED: 'تم التسعير',
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

  const statuses = [
    'SUBMITTED',
    'PRICED',
    'QUOTE_PENDING',
    'QUOTE_SENT',
    'QUOTE_APPROVED',
    'QUOTE_REJECTED',
    'DEVICE_COLLECTED',
    'REPAIRING',
    'REPAIR_COMPLETED',
    'DEVICE_DELIVERED',
    'CANCELLED',
    'FAILED',
  ];

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'QUOTE_PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'REPAIRING': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'REPAIR_COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'DEVICE_DELIVERED': return 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'FAILED': return 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }, []);

  const fetchRepairs = useCallback(async () => {
    setIsLoading(true);
    const controller = new AbortController();
    try {
      const url = statusFilter === 'all' ? '/api/shops/repair-request' : `/api/shops/repair-request/status/${statusFilter}`;
      const res = await api.get(url, {
        signal: controller.signal,
        params: { query: searchTerm },
      });
      setRepairs(res.data.content || []);
    } catch (err) {
      // if (err.name !== 'AbortError') {
      //   console.error('Error fetching repairs:', err.response?.data || err.message);
      //   Swal.fire('خطأ', 'فشل في جلب الطلبات', 'error');
      // }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [statusFilter, searchTerm]);

  const viewRepairDetails = useCallback(async (repairId) => {
    try {
      const res = await api.get(`/api/shops/repair-request/${repairId}`);
      const repair = res.data;

      Swal.fire({
        title: `تفاصيل الطلب #${repair.id}`,
        html: `
          <div class="text-right font-sans" style="line-height: 1.8;">
            <p class="flex justify-between flex-row-reverse"><strong class="text-blue-500">العميل</strong> ${repair.userId}</p><hr class="border-gray-100 p-1">
            <p class="flex justify-between flex-row-reverse"><strong class="text-blue-500">الوصف</strong> ${repair.description || 'غير متوفر'}</p><hr class="border-gray-100 p-1">
            <p class="flex justify-between flex-row-reverse"><strong class="text-blue-500">العنوان</strong> ${repair.deliveryAddress}</p><hr class="border-gray-100 p-1">
            <p class="flex justify-between flex-row-reverse"><strong class="text-blue-500">الفئة</strong> ${repair.deviceCategory}</p><hr class="border-gray-100 p-1">
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'إغلاق',
        customClass: {
          popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '',
        },
      });
    } catch (err) {
      console.error('Error fetching repair details:', err.response?.data || err.message);
      Swal.fire('خطأ', 'فشل في جلب تفاصيل الطلب', 'error');
    }
  }, [darkMode]);

  const updateRepairPrice = useCallback(async (repairId, price) => {
    try {
      await api.put(`/api/shops/repair-request/${repairId}/price`, { price });
      Swal.fire('نجاح', `تم تحديث السعر إلى ${price}`, 'success');
      fetchRepairs();
    } catch (err) {
      console.error('Error updating price:', err.response?.data || err.message);
      toast.error('فشل تحديث السعر');
    }
  }, [fetchRepairs]);

  const updateRepairStatus = useCallback(async (repairId, status) => {
    try {
      await api.put(`/api/shops/repair-request/${repairId}/status`, { status });
      toast.success(`تم تحديث الحالة إلى ${statusTranslations[status]}`);
      fetchRepairs();
    } catch (err) {
      console.error('Error updating status:', err.response?.data || err.message);
      toast.error('فشل في تحديث حالة الطلب');
    }
  }, [fetchRepairs]);

  const debouncedFetchRepairs = useMemo(() => debounce(fetchRepairs, 300), [fetchRepairs]);

  useEffect(() => {
    debouncedFetchRepairs();
    return () => debouncedFetchRepairs.cancel();
  }, [debouncedFetchRepairs]);

  const filteredRepairs = useMemo(
    () =>
      repairs.filter(
        (repair) =>
          repair.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          repair.userId?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [repairs, searchTerm]
  );

  const indexOfLastRepair = currentPage * repairsPerPage;
  const indexOfFirstRepair = indexOfLastRepair - repairsPerPage;
  const currentRepairs = filteredRepairs.slice(indexOfFirstRepair, indexOfLastRepair);
  const totalPages = Math.ceil(filteredRepairs.length / repairsPerPage);

  const changePage = useCallback((page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, [totalPages]);

  return (
    <ShopLayout>
      <div style={{marginTop:"-1230px",marginLeft:"250px"}} className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 lg:p-8 font-cairo">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-right bg-white p-4 rounded-xl dark:bg-gray-950">
            <h1 className="text-4xl font-bold text-indigo-600 mb-4 dark:text-white">طلبات التصليح</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">إدارة ومتابعة طلبات التصليح بسهولة</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <div className="p-6 bg-white dark:bg-gray-900  shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-indigo-600 dark:border-indigo-500 group">
              <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-indigo-600 dark:text-indigo-400">
                إجمالي طلبات التصليح <FiTool className="text-xl group-hover:scale-110 transition-transform duration-300" />
              </h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">{repairs.length}</p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900  shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-yellow-600 dark:border-yellow-500 group">
              <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-yellow-600 dark:text-yellow-400">
                طلبات معلقة <RiClockwiseLine className="text-xl group-hover:scale-110 transition-transform duration-300" />
              </h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">
                {repairs.filter((r) => r.status === 'QUOTE_PENDING').length}
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-900 shadow-md hover:shadow-xl transition-all duration-300 border-l-4 border-green-600 dark:border-green-500 group">
              <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-green-600 dark:text-green-400">
                طلبات مكتملة <RiCheckLine className="text-xl group-hover:scale-110 transition-transform duration-300" />
              </h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">
                {repairs.filter((r) => r.status === 'DEVICE_DELIVERED').length}
              </p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                placeholder="ابحث في طلبات التصليح..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 shadow-sm hover:shadow-lg text-sm text-right"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-56">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 shadow-sm hover:shadow-lg text-sm"
              >
                <span>{statusTranslations[statusFilter]}</span>
                <FiChevronDown className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {['all', ...statuses].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-right text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm"
                    >
                      {statusTranslations[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto text-sm text-right">
                      <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <tr>
                          <th className="px-6 py-4 font-semibold text-right">رقم الطلب</th>
                          <th className="px-6 py-4 font-semibold text-right">العميل</th>
                          <th className="px-6 py-4 font-semibold text-right">الوصف</th>
                          <th className="px-6 py-4 font-semibold text-right">الحالة</th>
                          <th className="px-6 py-4 font-semibold text-right">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700 dark:text-gray-200">
                        {currentRepairs.map((r, i) => (
                          <tr
                            key={r.id}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                          >
                            <td className="px-6 py-4">{indexOfFirstRepair + i + 1}</td>
                            <td className="px-6 py-4">{r.userId}</td>
                            <td className="px-6 py-4">{r.description || 'غير متوفر'}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(r.status)}`}>
                                {statusTranslations[r.status]}
                              </span>
                            </td>
                            <td className="px-6 py-4 flex justify-end gap-2">
                              <div className="relative w-40">
                                <select
                                  value={r.status}
                                  onChange={(e) => updateRepairStatus(r.id, e.target.value)}
                                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 text-sm text-right appearance-none"
                                >
                                  {statuses.map((s) => (
                                    <option key={s} value={s}>
                                      {statusTranslations[s]}
                                    </option>
                                  ))}
                                </select>
                                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 pointer-events-none" />
                              </div>
                              <button
                                onClick={() => viewRepairDetails(r.id)}
                                className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-200"
                                title="عرض التفاصيل"
                              >
                                <FiInfo />
                              </button>
                              <button
                                onClick={() =>
                                  Swal.fire({
                                    title: 'أدخل السعر الجديد',
                                    input: 'number',
                                    inputValue: r.price || '',
                                    showCancelButton: true,
                                    confirmButtonText: 'تحديث',
                                    cancelButtonText: 'إلغاء',
                                    preConfirm: (value) => updateRepairPrice(r.id, value),
                                    customClass: {
                                      popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '',
                                    },
                                  })
                                }
                                className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-200"
                                title="تحديث السعر"
                              >
                                <FiDollarSign />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {currentRepairs.length === 0 && (
                    <div className="p-8 text-center bg-white dark:bg-gray-900">
                      <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                        {repairs.length === 0 ? 'لا توجد طلبات تصليح' : 'لم يتم العثور على طلبات'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm ? 'حاول تعديل مصطلحات البحث' : 'جميع الطلبات تم تخصيصها أو لا توجد طلبات معلقة'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  className="px-4 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === 1}
                >
                  <FiChevronLeft />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => changePage(i + 1)}
                    className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-300 ${
                      currentPage === i + 1
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                        : 'bg-white dark:bg-gray-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => changePage(currentPage + 1)}
                  className="px-4 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === totalPages}
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </ShopLayout>
    );
};

export default RepairRequests;