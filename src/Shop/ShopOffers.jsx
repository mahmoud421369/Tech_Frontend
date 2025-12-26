import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FiSearch, FiPlus, FiInfo, FiEdit3, FiTrash2, FiX, FiCalendar, FiTag,
  FiPercent, FiDollarSign, FiClock, FiCheckCircle, FiAlertCircle,
  FiChevronRight,
  FiChevronLeft
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountValue: '',
    discountType: 'PERCENTAGE',
    status: 'ACTIVE',
    startDate: null,
    endDate: null,
  });

  const offersPerPage = 8;

  const statusTranslations = {
    ACTIVE: 'نشط',
    SCHEDULED: 'قادم',
    EXPIRED: 'منتهي',
  };

  const discountTypeTranslations = {
    PERCENTAGE: 'نسبة مئوية',
    FIXED_AMOUNT: 'مبلغ ثابت',
  };
useEffect(() => {
document.title = "إدارة العروض";

});

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/shop/offers');
      setOffers(Array.isArray(res.data) ? res.data : res.data.content || []);
    } catch (err) {
      Swal.fire({
        title: 'خطأ',
        text: 'فشل في تحميل العروض',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 1500,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

const viewOfferDetails = useCallback(async (offerId) => {
  try {
    const res = await api.get(`/api/shop/offers/${offerId}`);
    const offer = res.data;

    const startFormatted = offer.startDate
      ? new Date(offer.startDate).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
      : 'غير محدد';

    const endFormatted = offer.endDate
      ? new Date(offer.endDate).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })
      : 'غير محدد';

    const statusColor = 
      offer.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
      offer.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800';

    const discountIcon = offer.discountType === 'PERCENTAGE' 
      ? '<FiPercent class="w-6 h-6 text-lime-600 inline" />' 
      : '<FiDollarSign class="w-6 h-6 text-lime-600 inline" />';

    Swal.fire({
      title: `<div class="flex items-center gap-4 justify-center mb-6">
                <FiTag class="text-4xl text-lime-600" />
                <p class="text-3xl font-bold text-center mb-3 bg-lime-500 text-white px-3 py-2 rounded-lg flex justify-center items-center">تفاصيل العرض</p>
                <span class="text-3xl font-bold">#${offer.id}   </span>
              </div>`,
      html: `
        <div class="text-right space-y-6 text-lg font-medium max-w-2xl mx-auto">
          <div class="bg-gray-50 rounded-2xl p-6 shadow-sm">
            <p class="flex items-center justify-between flex-row-reverse gap-4">
              <span class="text-gray-600">اسم العرض</span>
              <span class="font-bold text-xl">${offer.name || '-'}</span>
            </p>
          </div>

          <div class="bg-gray-50 rounded-2xl p-6 shadow-sm">
            <p class="flex items-start justify-between flex-row-reverse gap-4">
              <span class="text-gray-600">الوصف</span>
              <span class="font-semibold max-w-md text-right">${offer.description || 'لا يوجد وصف'}</span>
            </p>
          </div>

          <div class="bg-gradient-to-r from-lime-50 to-emerald-50 rounded-2xl p-6 shadow-sm">
            <p class="flex items-center justify-between flex-row-reverse gap-4">
              <span class="text-gray-700 font-medium">قيمة الخصم</span>
              <span class="text-3xl font-bold text-lime-600 flex items-center gap-2">
                ${offer.discountValue}
                ${offer.discountType === 'PERCENTAGE' ? '<span class="text-2xl">%</span>' : 'ج.م'}
              </span>
            </p>
           
          </div>

          <div class="bg-gray-50 rounded-2xl p-6 shadow-sm">
            <p class="flex items-center justify-between flex-row-reverse gap-4">
              <span class="text-gray-600">الحالة</span>
              <span class="px-6 py-3 rounded-full text-lg font-bold ${statusColor}">
                ${statusTranslations[offer.status]}
              </span>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div class="bg-blue-50 rounded-2xl p-6 text-center">
              <p class="text-gray-600 mb-2">تاريخ البداية</p>
              <p class="text-xl font-bold text-blue-700">${startFormatted}</p>
            </div>
            <div class="bg-purple-50 rounded-2xl p-6 text-center">
              <p class="text-gray-600 mb-2">تاريخ النهاية</p>
              <p class="text-xl font-bold text-purple-700">${endFormatted}</p>
            </div>
          </div>
        </div>
      `,
      width: 900,
      showConfirmButton: true,
      confirmButtonText: 'إغلاق',
      confirmButtonColor: '#94a3b8',
      customClass: {
        popup: 'rounded-3xl',
        title: 'mb-0',
        htmlContainer: 'mt-6',
      },
      buttonsStyling: false,
    });
  } catch (err) {
    Swal.fire({
      title: 'خطأ',
      text: 'فشل تحميل تفاصيل العرض',
      icon: 'error',
      toast: true,
      position: 'top-end',
      timer: 2000,
      timerProgressBar: true,
    });
  }
}, [discountTypeTranslations, statusTranslations]);

  const openModalForAdd = () => {
    setEditingOffer(null);
    setFormData({
      name: '',
      description: '',
      discountValue: '',
      discountType: 'PERCENTAGE',
      status: 'ACTIVE',
      startDate: null,
      endDate: null,
    });
    setIsModalOpen(true);
  };

  const openModalForEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      ...offer,
      startDate: offer.startDate ? new Date(offer.startDate) : null,
      endDate: offer.endDate ? new Date(offer.endDate) : null,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.discountValue || !formData.startDate || !formData.endDate) {
      Swal.fire({ title: 'خطأ', text: 'يرجى ملء الحقول المطلوبة', icon: 'warning', toast: true, position: 'top-end', timer: 2000 });
      return;
    }

    try {
      const payload = {
        ...formData,
        discountValue: Number(formData.discountValue),
      };

      if (editingOffer) {
        await api.put(`/api/shop/offers/${editingOffer.id}`, payload);
        Swal.fire({ title: 'تم!', text: 'تم تعديل العرض بنجاح', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      } else {
        await api.post('/api/shop/offers', payload);
        Swal.fire({ title: 'تم!', text: 'تم إضافة العرض بنجاح', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      }

      setIsModalOpen(false);
      fetchOffers();
    } catch (err) {
      Swal.fire({ title: 'خطأ', text: 'حدث خطأ أثناء الحفظ', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  };

  const deleteOffer = async (offerId) => {
    const result = await Swal.fire({
      title: 'تأكيد الحذف',
      text: 'هل أنت متأكد من حذف هذا العرض؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/shop/offers/${offerId}`);
        Swal.fire({ title: 'تم الحذف', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
        fetchOffers();
      } catch (err) {
        Swal.fire({ title: 'خطأ', text: 'فشل الحذف', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
      }
    }
  };

  const debouncedSearch = useMemo(() => debounce((value) => setSearchTerm(value), 300), []);
  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const filteredOffers = useMemo(() =>
    offers.filter(o => (o.name || '').toLowerCase().includes(searchTerm.toLowerCase())),
    [offers, searchTerm]
  );

  const totalPages = Math.ceil(filteredOffers.length / offersPerPage);
  const pageOffers = filteredOffers.slice((currentPage - 1) * offersPerPage, currentPage * offersPerPage);

  return (
    <div  style={{ marginTop: "-575px", marginLeft: "-250px" }} className="min-h-screen bg-gray-50 font-cairo py-8">
      <div className="max-w-5xl mx-auto px-6">

        
        <div className="mb-10 bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between text-right gap-5">
            <div className="p-5 bg-lime-100 rounded-2xl">
              <FiTag className="text-4xl text-lime-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">عروض المتجر</h1>
              <p className="text-lg text-gray-600 mt-2">إنشاء وإدارة العروض والخصومات بسهولة تامة</p>
            </div>
          </div>
        </div>

      
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row-reverse gap-4 items-center justify-between">
            <div className="flex-1 relative max-w-md">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
              <input
                type="text"
                placeholder="ابحث في العروض بالاسم..."
                onChange={handleSearchChange}
                className="w-full pr-12 py-3.5 pl-4 rounded-xl border border-gray-300 focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none text-base transition bg-gray-50"
              />
            </div>

            <button
              onClick={openModalForAdd}
              className="px-8 py-3.5 bg-teal-500  text-white border border-teal-500 rounded-3xl font-semibold hover:bg-teal-500 hover:text-white shadow transition flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              إضافة عرض جديد
            </button>
          </div>
        </div>

      
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 border-6 border-lime-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-6 text-lg text-gray-600">جاري تحميل العروض...</p>
            </div>
          ) : pageOffers.length === 0 ? (
            <div className="p-20 text-center text-gray-500">
              <FiTag className="w-16 h-16 mx-auto opacity-30 mb-4" />
              <p className="text-xl">لا توجد عروض حالياً</p>
              <p className="mt-2">ابدأ بإضافة عرض جديد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-5 py-4 text-base font-bold">#</th>
                    <th className="px-5 py-4 text-base font-bold">اسم العرض</th>
                    <th className="px-5 py-4 text-base font-bold">الوصف</th>
                    <th className="px-5 py-4 text-base font-bold">الخصم</th>
                    <th className="px-5 py-4 text-base font-bold">الحالة</th>
                    <th className="px-5 py-4 text-base font-bold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pageOffers.map((offer, index) => {
                    const globalIndex = (currentPage - 1) * offersPerPage + index + 1;
                    return (
                      <tr key={offer.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-4 text-sm font-medium text-gray-800 text-center">{globalIndex}</td>
                        <td className="px-5 py-4 text-sm font-medium text-gray-800 text-center">{offer.name}</td>
                        <td className="px-5 py-4 text-sm text-gray-700 text-center max-w-xs truncate">{offer.description || '-'}</td>
                        <td className="px-5 py-4 text-center font-bold">
                          {offer.discountValue}
                          {offer.discountType === 'PERCENTAGE' ? <FiPercent className="inline ml-1 text-lime-600" /> : <FiDollarSign className="inline ml-1 text-lime-600" />}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                            offer.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            offer.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {statusTranslations[offer.status]}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => viewOfferDetails(offer.id)}
                              className="px-3 py-2 flex gap-2 bg-transparent text-amber-500 border border-amber-500 rounded-3xl text-xs font-medium transition"
                            >
                              <FiInfo className="w-4 h-4 inline ml-1" /> تفاصيل
                            </button>
                            <button
                              onClick={() => openModalForEdit(offer)}
                              className="px-3 py-2 flex gap-2 bg-transparent text-lime-500 border border-lime-500 rounded-3xl text-xs font-medium transition"
                            >
                              <FiEdit3 className="w-4 h-4 inline ml-1" /> تعديل
                            </button>
                            <button
                              onClick={() => deleteOffer(offer.id)}
                              className="px-3 py-2 flex gap-2 bg-transparent text-red-500 border border-red-500 rounded-3xl text-xs font-medium transition"
                            >
                              <FiTrash2 className="w-4 h-4 inline ml-1" /> حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

   
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-3 bg-white border border-lime-600 rounded-xl disabled:opacity-50 hover:bg-lime-50 text-lime-700 font-medium transition shadow-sm flex items-center gap-2"
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
                    currentPage === i + 1 ? 'bg-lime-600 text-white' : 'bg-white border border-lime-600 text-lime-700 hover:bg-lime-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-3 bg-white border border-lime-600 rounded-xl disabled:opacity-50 hover:bg-lime-50 text-lime-700 font-medium transition shadow-sm flex items-center gap-2"
            >
              التالي
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

       
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-6 text-right">
            <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center flex-row-reverse mb-10">
                <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-4">
                  <FiTag className="text-lime-600" />
                  {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-gray-100 rounded-full transition">
                  <FiX className="w-8 h-8" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-lg font-medium text-gray-800 mb-3">اسم العرض</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none text-lg bg-gray-50"
                    placeholder="مثال: خصم الجمعة البيضاء"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-800 mb-3">قيمة الخصم</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none text-lg bg-gray-50"
                    placeholder="مثال: 50"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-800 mb-3">نوع الخصم</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setFormData({ ...formData, discountType: 'PERCENTAGE' })}
                      className={`p-6 rounded-2xl border-4 transition-all text-xl font-bold ${
                        formData.discountType === 'PERCENTAGE'
                          ? 'border-lime-600 bg-lime-50'
                          : 'border-gray-300 hover:border-lime-400'
                      }`}
                    >
                      <FiPercent className="inline mr-2" />
                      نسبة مئوية
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, discountType: 'FIXED_AMOUNT' })}
                      className={`p-6 rounded-2xl border-4 transition-all text-xl font-bold ${
                        formData.discountType === 'FIXED_AMOUNT'
                          ? 'border-lime-600 bg-lime-50'
                          : 'border-gray-300 hover:border-lime-400'
                      }`}
                    >
                      <FiDollarSign className="inline mr-2" />
                      مبلغ ثابت
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-800 mb-3">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none text-lg bg-gray-50"
                  >
                    <option value="ACTIVE">نشط</option>
                    <option value="SCHEDULED">قادم</option>
                    <option value="EXPIRED">منتهي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-800 mb-3">تاريخ البداية</label>
                  <DatePicker
                    selected={formData.startDate}
                    onChange={(date) => setFormData({ ...formData, startDate: date })}
                    showTimeSelect
                    dateFormat="dd/MM/yyyy HH:mm"
                    locale={ar}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none text-lg bg-gray-50"
                    placeholderText="اختر تاريخ ووقت البداية"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-800 mb-3">تاريخ النهاية</label>
                  <DatePicker
                    selected={formData.endDate}
                    onChange={(date) => setFormData({ ...formData, endDate: date })}
                    showTimeSelect
                    dateFormat="dd/MM/yyyy HH:mm"
                    locale={ar}
                    className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none text-lg bg-gray-50"
                    placeholderText="اختر تاريخ ووقت النهاية"
                  />
                </div>
              </div>

              <div className="mt-10">
                <label className="block text-lg font-medium text-gray-800 mb-3">وصف العرض</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="5"
                  className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none text-lg bg-gray-50 resize-none"
                  placeholder="وصف تفصيلي للعرض..."
                />
              </div>

              <div className="mt-12 flex justify-end gap-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-10 py-4 border-2 border-gray-400 rounded-2xl text-xl font-bold hover:bg-gray-100 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-12 py-4 bg-lime-600 text-white rounded-2xl text-xl font-bold hover:bg-lime-700 transition shadow-2xl"
                >
                  {editingOffer ? 'حفظ التعديلات' : 'إضافة العرض'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopOffers;