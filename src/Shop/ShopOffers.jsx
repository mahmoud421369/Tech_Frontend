import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FiXCircle,
  FiChevronDown,
  FiSearch,
  FiShoppingBag,
  FiInfo,
  FiCheckSquare,
  FiTag,
  FiTrash2,
  FiEdit2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ar } from 'date-fns/locale';
import api from '../api';
import debounce from 'lodash/debounce';

const ShopOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [newOffer, setNewOffer] = useState({
    name: '',
    description: '',
    discountValue: '',
    discountType: 'PERCENTAGE',
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
  });
  const [isDiscountTypeOpen, setIsDiscountTypeOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const discountTypeRef = useRef(null);
  const statusRef = useRef(null);

  const offersPerPage = 5;

  // Arabic translations
  const statusTranslations = {
    ACTIVE: 'نشط',
    SCHEDULED: 'قادم',
    EXPIRED: 'غير نشط',
  };

  const discountTypeTranslations = {
    PERCENTAGE: 'نسبة مئوية',
    FIXED_AMOUNT: 'مبلغ ثابت',
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        discountTypeRef.current && !discountTypeRef.current.contains(e.target) &&
        statusRef.current && !statusRef.current.contains(e.target)
      ) {
        setIsDiscountTypeOpen(false);
        setIsStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch offers
  const fetchOffers = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    try {
      const res = await api.get('/api/shop/offers', { signal: controller.signal });
      setOffers(Array.isArray(res.data) ? res.data : res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching offers:', err.response?.data || err.message);
        Swal.fire({
          title: 'خطأ',
          text: 'فشل في تحميل العروض',
          icon: 'error',
          toast: true,
          position: 'top-end',
          timer: 1500,
        });
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);

  // View offer details
  const viewOfferDetails = useCallback(async (offerId) => {
    try {
      const res = await api.get(`/api/shop/offers/${offerId}`);
      const offer = res.data;
      const startFormatted = offer.startDate
        ? new Date(offer.startDate).toLocaleString('ar-EG', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : '';
      const endFormatted = offer.endDate
        ? new Date(offer.endDate).toLocaleString('ar-EG', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : '';

      Swal.fire({
        title:` تفاصيل العرض #${offer.id || '__'}`,
        html: `
          <div class="text-right font-cairo space-y-2">
            <p class="flex justify-between flex-row-reverse"><strong>اسم العرض</strong> ${offer.name || ''}</p>
            <hr class="border-lime-100">
            <p class="flex justify-between flex-row-reverse"><strong>الوصف</strong> ${offer.description || ''}</p>
            <hr class="border-lime-100">
            <p class="flex justify-between flex-row-reverse"><strong>قيمة الخصم</strong> ${offer.discountValue || ''} ${offer.discountType === 'PERCENTAGE' ? '%' : 'ج.م'}</p>
            <hr class="border-lime-100">
            <p class="flex justify-between flex-row-reverse"><strong>نوع الخصم</strong> ${discountTypeTranslations[offer.discountType] || ''}</p>
            <hr class="border-lime-100">
            <p class="flex justify-between flex-row-reverse"><strong>الحالة</strong> ${statusTranslations[offer.status] || ''}</p>
            <hr class="border-lime-100">
            <p class="flex justify-between flex-row-reverse"><strong>تاريخ البداية</strong> ${startFormatted}</p>
            <hr class="border-lime-100">
            <p class="flex justify-between flex-row-reverse"><strong>تاريخ النهاية</strong> ${endFormatted}</p>
          </div>
        `,
        width: 600,
        icon: 'info',
        confirmButtonText: 'إغلاق',
        confirmButtonColor: '#84cc16',
      });
    } catch (err) {
      console.error('Error fetching offer details:', err.response?.data || err.message);
      Swal.fire({
        title: 'خطأ',
        text: 'فشل في تحميل تفاصيل العرض',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 1500,
      });
    }
  }, [statusTranslations, discountTypeTranslations]);

  // Add offer
  const addOffer = useCallback(async () => {
    if (!newOffer.name || !newOffer.description || !newOffer.discountValue || !newOffer.startDate || !newOffer.endDate) {
      Swal.fire({ title: 'خطأ', text: 'يرجى ملء جميع الحقول', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
      return;
    }
    try {
      await api.post('/api/shop/offers', { ...newOffer, discountValue: Number(newOffer.discountValue) });
      Swal.fire({ title: 'تم', text: 'تمت إضافة العرض', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      setNewOffer({
        name: '', description: '', discountValue: '', discountType: 'PERCENTAGE', status: 'ACTIVE', startDate: '', endDate: '',
      });
      fetchOffers();
    } catch (err) {
      console.error('Error adding offer:', err.response?.data || err.message);
      Swal.fire({ title: 'خطأ', text: 'فشل في إضافة العرض', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [fetchOffers, newOffer]);

  // Update offer
  const updateOffer = useCallback(async () => {
    if (!editingOffer.name || !editingOffer.description || !editingOffer.discountValue || !editingOffer.startDate || !editingOffer.endDate) {
      Swal.fire({ title: 'خطأ', text: 'يرجى ملء جميع الحقول', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
      return;
    }
    try {
      await api.put(`/api/shop/offers/${editingOffer.id}`, {
        ...editingOffer,
        discountValue: Number(editingOffer.discountValue),
      });
      Swal.fire({ title: 'تم', text: 'تم تعديل العرض', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      setEditingOffer(null);
      fetchOffers();
    } catch (err) {
      console.error('Error updating offer:', err.response?.data || err.message);
      Swal.fire({ title: 'خطأ', text: 'فشل في تعديل العرض', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [editingOffer, fetchOffers]);

  // Delete offer
  const deleteOffer = useCallback(async (offerId) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف العرض نهائيًا',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/shop/offers/${offerId}`);
      Swal.fire({ title: 'تم', text: 'تم حذف العرض', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      fetchOffers();
    } catch (err) {
      console.error('Error deleting offer:', err.response?.data || err.message);
      Swal.fire({ title: 'خطأ', text: 'فشل في حذف العرض', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  }, [fetchOffers]);

  // Debounced search
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
    []
  );

  const handleSearchChange = useCallback((e) => {
    debouncedSetSearchTerm(e.target.value);
    setCurrentPage(1);
  }, [debouncedSetSearchTerm]);

  useEffect(() => {
    return () => debouncedSetSearchTerm.cancel();
  }, [debouncedSetSearchTerm]);

  // Filter & pagination
  const filteredOffers = useMemo(
    () => offers.filter((o) => (o.name || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [offers, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / offersPerPage));
  const pageOffers = filteredOffers.slice(
    (currentPage - 1) * offersPerPage,
    currentPage * offersPerPage
  );

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return (
    <div style={{ marginTop: '-575px', marginLeft: '-25px' }} className="min-h-screen max-w-6xl mx-auto p-4 lg:p-8 font-cairo bg-gradient-to-br from-gray-50 via-white to-white">
      {/* Header */}
      <div className="mb-8 text-right bg-white p-6 shadow-md border-l-4 border-lime-500">
        <h1 className="text-3xl font-bold text-black mb-2 flex items-center justify-end gap-3">
          <FiShoppingBag className="text-gray-500" /> عروض المتجر
        </h1>
        <p className="text-sm text-gray-600">إدارة وتعديل عروض المتجر بسهولة</p>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center gap-4 mb-6 bg-white rounded-xl shadow-sm p-5 border border-lime-100">
        <div className="relative w-full ">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث في العروض"
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 rounded-lg border bg-gray-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none text-right"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-lime-100">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-black flex items-center justify-end gap-3">
            <FiTag className="text-lime-600" />
            {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
          </h2>
          {editingOffer && (
            <button
              onClick={() => setEditingOffer(null)}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <FiX className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(editingOffer ? [editingOffer] : [newOffer]).map((offer, idx) => (
            <React.Fragment key={idx}>
              {/* Name */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="اسم العرض"
                  value={offer.name}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, name: e.target.value })
                      : setNewOffer({ ...newOffer, name: e.target.value })
                  }
                  className="w-full pr-10 pl-4 py-3 rounded-lg border bg-gray-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none text-right"
                />
                <FiTag className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Description */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="الوصف"
                  value={offer.description}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, description: e.target.value })
                      : setNewOffer({ ...newOffer, description: e.target.value })
                  }
                  className="w-full pr-10 pl-4 py-3 rounded-lg border bg-gray-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none text-right"
                />
                <FiInfo className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Discount Value */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="قيمة الخصم"
                  value={offer.discountValue}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, discountValue: e.target.value })
                      : setNewOffer({ ...newOffer, discountValue: e.target.value })
                  }
                  className="w-full pr-10 pl-4 py-3 rounded-lg border bg-gray-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none text-right"
                />
                <FiCheckSquare className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Discount Type */}
              <div className="relative" ref={discountTypeRef}>
                <button
                  onClick={() => setIsDiscountTypeOpen(!isDiscountTypeOpen)}
                  className="w-full flex justify-between flex-row-reverse items-center pr-10 pl-4 py-3 bg-gray-50 border rounded-lg text-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none text-right"
                >
                  {discountTypeTranslations[offer.discountType]}
                  <FiChevronDown className={`transition ${isDiscountTypeOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDiscountTypeOpen && (
                  <div className="absolute w-full mt-2 bg-white border  rounded-lg shadow-xl z-10">
                    {['PERCENTAGE', 'FIXED_AMOUNT'].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          editingOffer
                            ? setEditingOffer({ ...editingOffer, discountType: type })
                            : setNewOffer({ ...newOffer, discountType: type });
                          setIsDiscountTypeOpen(false);
                        }}
                        className="w-full px-4 py-2 text-right hover:bg-lime-50 transition text-sm font-medium text-black"
                      >
                        {discountTypeTranslations[type]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="relative" ref={statusRef}>
                <button
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="w-full flex justify-between flex-row-reverse items-center pr-10 pl-4 py-3 bg-gray-50 border rounded-lg text-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none text-right"
                >
                  {statusTranslations[offer.status]}
                  <FiChevronDown className={`transition ${isStatusOpen ? 'rotate-180' : ''}`} />
                </button>
                {isStatusOpen && (
                  <div className="absolute w-full mt-2 bg-white border  rounded-lg shadow-xl z-10">
                    {['ACTIVE', 'SCHEDULED', 'EXPIRED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          editingOffer
                            ? setEditingOffer({ ...editingOffer, status })
                            : setNewOffer({ ...newOffer, status });
                          setIsStatusOpen(false);
                        }}
                        className="w-full px-4 py-2 text-right hover:bg-lime-50 transition text-sm font-medium text-black"
                      >
                        {statusTranslations[status]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Start Date */}
              <div className="relative">
                <DatePicker
                  selected={offer.startDate ? new Date(offer.startDate) : null}
                  onChange={(date) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, startDate: date?.toISOString() || '' })
                      : setNewOffer({ ...newOffer, startDate: date?.toISOString() || '' })
                  }
                  showTimeSelect
                  dateFormat="yyyy-MM-dd HH:mm"
                  locale={ar}
                  placeholderText="تاريخ البداية"
                  className="w-full pr-10 pl-4 py-3 rounded-lg border bg-gray-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none text-right"
                />
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* End Date */}
              <div className="relative">
                <DatePicker
                  selected={offer.endDate ? new Date(offer.endDate) : null}
                  onChange={(date) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, endDate: date?.toISOString() || '' })
                      : setNewOffer({ ...newOffer, endDate: date?.toISOString() || '' })
                  }
                  showTimeSelect
                  dateFormat="yyyy-MM-dd HH:mm"
                  locale={ar}
                  placeholderText="تاريخ النهاية"
                  className="w-full pr-10 pl-4 py-3 rounded-lg border bg-gray-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none text-right"
                />
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={editingOffer ? updateOffer : addOffer}
            className="px-6 py-2.5 bg-lime-500 text-white font-bold rounded-lg hover:bg-lime-600 transition shadow-sm"
          >
            {editingOffer ? 'تعديل' : 'إضافة'}
          </button>
          {editingOffer && (
            <button
              onClick={() => setEditingOffer(null)}
              className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border  overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-bold text-gray-700 min-w-16">#</th>
                  <th className="px-4 py-3 font-bold text-gray-700 min-w-32">الاسم</th>
                  <th className="px-4 py-3 font-bold text-gray-700 min-w-48">الوصف</th>
                  <th className="px-4 py-3 font-bold text-gray-700 min-w-24">الخصم</th>
                 
                  <th className="px-4 py-3 font-bold text-gray-700 min-w-24">الحالة</th>
                  <th className="px-4 py-3 font-bold text-gray-700 min-w-48">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lime-100 text-center">
                {pageOffers.length > 0 ? (
                  pageOffers.map((o, i) => {
                    const globalIdx = (currentPage - 1) * offersPerPage + i + 1;
                    return (
                      <tr key={o.id} className="hover:bg-lime-50 transition">
                        <td className="px-4 py-4 font-medium text-black">{globalIdx}</td>
                        <td className="px-4 py-4">{o.name || ''}</td>
                        <td className="px-4 py-4 text-xs truncate max-w-xs">{o.description || ''}</td>
                        <td className="px-4 py-4 text-center">
                          {o.discountValue || ''} {o.discountType === 'PERCENTAGE' ? '%' : 'ج.م'}
                        </td>
                        {/* <td className="px-4 py-4 text-center">{discountTypeTranslations[o.discountType] || ''}</td> */}
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              o.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : o.status === 'SCHEDULED'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {statusTranslations[o.status] || ''}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Details */}
                            <button
                              onClick={() => viewOfferDetails(o.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition text-xs font-medium"
                              title="تفاصيل"
                            >
                              <FiInfo className="w-4 h-4" />
                              تفاصيل
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => setEditingOffer(o)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-lime-100 text-lime-700 rounded-lg hover:bg-lime-200 transition text-xs font-medium"
                              title="تعديل"
                            >
                              <FiEdit2 className="w-4 h-4" />
                              تعديل
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => deleteOffer(o.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-xs font-medium"
                              title="حذف"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="text-lime-400 mb-4">
                        <FiTag className="w-20 h-20 mx-auto opacity-30" />
                      </div>
                      <h3 className="text-xl font-bold text-black mb-2">
                        {searchTerm ? 'لا توجد نتائج' : 'لا توجد عروض'}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm ? 'جرب تعديل البحث' : 'أضف عرضًا جديدًا'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-lime-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 transition"
          >
            <FiChevronLeft />
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                currentPage === i + 1
                  ? 'bg-lime-500 text-white border-lime-500'
                  : 'border-lime-200 hover:bg-lime-50 text-black'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-lime-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 transition"
          >
            <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopOffers;