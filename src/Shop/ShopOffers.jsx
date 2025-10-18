
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FiXCircle,
  FiChevronDown,
  FiRefreshCw,
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

  const ordersPerPage = 5;


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (discountTypeRef.current && !discountTypeRef.current.contains(event.target)) {
        setIsDiscountTypeOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const fetchOffers = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    try {
      const res = await api.get('/api/shop/offers', {
        signal: controller.signal,
      });
      setOffers(Array.isArray(res.data) ? res.data : res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching offers:', err.response?.data || err.message);
        Swal.fire('Error', 'فشل في تحميل العروض', 'error');
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);

 
  const viewOfferDetails = useCallback(async (offerId) => {
    try {
      const res = await api.get(`/api/shop/offers/${offerId}`);
      const offer = res.data;
      const startFormattedDate = new Date(offer.startDate).toLocaleString('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      const endFormattedDate = new Date(offer.endDate).toLocaleString('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      Swal.fire({
        title: `تفاصيل العرض #${offer.id}`,
        html: `
          <div class="text-right font-cairo">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">اسم العرض</strong> ${offer.name}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">الوصف</strong> ${offer.description}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">قيمة الخصم</strong> ${offer.discountValue} ${offer.discountType === 'PERCENTAGE' ? '%' : 'EGP'}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">نوع الخصم</strong> ${offer.discountType === 'PERCENTAGE' ? 'نسبة مئوية' : 'مبلغ ثابت'}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">الحالة</strong> ${offer.status === 'ACTIVE' ? 'نشط' : offer.status === 'SCHEDULED' ? 'قادم' : 'غير نشط'}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">تاريخ البداية</strong> ${startFormattedDate}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">تاريخ النهاية</strong> ${endFormattedDate}</p>
          </div>
        `,
        width: 600,
        icon: 'info',
        showCloseButton: true,
        confirmButtonText: 'إغلاق',
        customClass: {
          popup: 'dark:bg-gray-800 dark:text-white',
        },
      });
    } catch (err) {
      console.error('Error fetching offer details:', err.response?.data || err.message);
      Swal.fire('Error', 'فشل في تحميل تفاصيل العرض', 'error');
    }
  }, []);


  const addOffer = useCallback(async () => {
    try {
      await api.post('/api/shop/offers', { ...newOffer, discountValue: Number(newOffer.discountValue) });
      console.log(newOffer)
      Swal.fire('Success!', 'تمت إضافة العرض بنجاح', 'success');
      setNewOffer({
        name: '',
        description: '',
        discountValue: '',
        discountType: 'PERCENTAGE',
        status: 'ACTIVE',
        startDate: '',
        endDate: '',
      });
      fetchOffers();
    } catch (err) {
      console.error('Error adding offer:', err.response?.data || err.message);
      Swal.fire('Error', 'فشل في إضافة العرض', 'error');
    }
  }, [fetchOffers, newOffer]);

  
  const updateOffer = useCallback(async () => {
    try {
      await api.put(`/api/shop/offers/${editingOffer.id}`, {
        ...editingOffer,
        discountValue: Number(editingOffer.discountValue),
      });
      Swal.fire('Success!', 'تم تعديل العرض بنجاح', 'success');
      setEditingOffer(null);
      fetchOffers();
    } catch (err) {
      console.error('Error updating offer:', err.response?.data || err.message);
      Swal.fire('Error', 'فشل في تعديل العرض', 'error');
    }
  }, [editingOffer, fetchOffers]);


  const deleteOffer = useCallback(async (offerId) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف العرض بشكل نهائي',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      customClass: {
        popup: 'dark:bg-gray-800 dark:text-white',
      },
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/shop/offers/${offerId}`);
      Swal.fire({
        title: 'Deleted!',
        text: 'تم حذف العرض',
        icon: 'success',
        customClass: {
          popup: 'dark:bg-gray-800 dark:text-white',
        },
      });
      fetchOffers();
    } catch (err) {
      console.error('Error deleting offer:', err.response?.data || err.message);
      Swal.fire('Error', 'فشل في حذف العرض', 'error');
    }
  }, [fetchOffers]);


  const debouncedSetSearchTerm = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
    []
  );


  const handleSearchChange = useCallback(
    (e) => {
      debouncedSetSearchTerm(e.target.value);
    },
    [debouncedSetSearchTerm]
  );


  useEffect(() => {
    return () => debouncedSetSearchTerm.cancel();
  }, [debouncedSetSearchTerm]);

 
  const filteredOffers = useMemo(
    () => offers.filter((offer) => offer.name?.toLowerCase().includes(searchTerm.toLowerCase())),
    [offers, searchTerm]
  );

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOffers = filteredOffers.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / ordersPerPage));

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return (
    <div style={{marginTop:"-600px",marginLeft:"250px"}} className="min-h-screen font-cairo bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      
      <div className="bg-white flex justify-between items-center flex-wrap flex-row-reverse dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-3">
          <FiShoppingBag className="text-xl sm:text-2xl" /> عروض المتجر
        </h1>
              <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              placeholder="...ابحث عن عرض"
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 placeholder:text-right bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 font-cairo"
             
            />
          </div>
      </div>

    
      <div className="max-w-6xl mx-auto mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex justify-end items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex justify-center flex-row-reverse text-right items-center gap-3">
            <FiTag className="text-indigo-600 dark:text-indigo-400" />
            {editingOffer ? 'تعديل العرض' : 'إضافة عرض جديد'}
          </h2>
          {editingOffer && (
            <button
              onClick={() => setEditingOffer(null)}
              className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
            >
              <FiX className="text-xl" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(editingOffer ? [editingOffer] : [newOffer]).map((offer, idx) => (
            <React.Fragment key={idx}>
             
              <div className="relative">
                <FiTag className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                <input
                  type="text"
                  placeholder="اسم العرض"
                  value={offer.name}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, name: e.target.value })
                      : setNewOffer({ ...newOffer, name: e.target.value })
                  }
                  className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 font-cairo"
                  dir="rtl"
                />
              </div>
           
              <div className="relative">
                <FiInfo className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                <input
                  type="text"
                  placeholder="الوصف"
                  value={offer.description}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, description: e.target.value })
                      : setNewOffer({ ...newOffer, description: e.target.value })
                  }
                  className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 font-cairo"
                  dir="rtl"
                />
              </div>
              
              <div className="relative">
                <FiCheckSquare className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                <input
                  type="text"
                  placeholder="قيمة الخصم"
                  value={offer.discountValue}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, discountValue: e.target.value })
                      : setNewOffer({ ...newOffer, discountValue: e.target.value })
                  }
                  className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 font-cairo"
                  dir="rtl"
                />
              </div>
              
              <div className="relative" ref={discountTypeRef}>
                <button
                  onClick={() => setIsDiscountTypeOpen(!isDiscountTypeOpen)}
                  className="w-full flex items-center justify-between pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 font-cairo"
                  dir="rtl"
                >
                  {offer.discountType === 'PERCENTAGE' ? 'نسبة مئوية' : 'مبلغ ثابت'}
                  <FiChevronDown className="text-gray-400 dark:text-gray-300" />
                </button>
                {isDiscountTypeOpen && (
                  <div className="absolute w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        editingOffer
                          ? setEditingOffer({ ...editingOffer, discountType: 'PERCENTAGE' })
                          : setNewOffer({ ...newOffer, discountType: 'PERCENTAGE' });
                        setIsDiscountTypeOpen(false);
                      }}
                      className="w-full px-4 py-2 text-right font-cairo dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-200"
                    >
                      نسبة مئوية
                    </button>
                    <button
                      onClick={() => {
                        editingOffer
                          ? setEditingOffer({ ...editingOffer, discountType: 'FIXED_AMOUNT' })
                          : setNewOffer({ ...newOffer, discountType: 'FIXED_AMOUNT' });
                        setIsDiscountTypeOpen(false);
                      }}
                      className="w-full px-4 py-2 text-right font-cairo dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-200"
                    >
                      مبلغ ثابت
                    </button>
                  </div>
                )}
              </div>
            
              <div className="relative" ref={statusRef}>
                <button
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  className="w-full flex items-center justify-between pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 font-cairo"
                  dir="rtl"
                >
                  {offer.status === 'ACTIVE' ? 'نشط' : offer.status === 'SCHEDULED' ? 'قادم' : 'غير نشط'}
                  <FiChevronDown className="text-gray-400 dark:text-gray-300" />
                </button>
                {isStatusOpen && (
                  <div className="absolute w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        editingOffer
                          ? setEditingOffer({ ...editingOffer, status: 'ACTIVE' })
                          : setNewOffer({ ...newOffer, status: 'ACTIVE' });
                        setIsStatusOpen(false);
                      }}
                      className="w-full px-4 py-2 text-right font-cairo hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-200"
                    >
                      نشط
                    </button>
                    <button
                      onClick={() => {
                        editingOffer
                          ? setEditingOffer({ ...editingOffer, status: 'SCHEDULED' })
                          : setNewOffer({ ...newOffer, status: 'SCHEDULED' });
                        setIsStatusOpen(false);
                      }}
                      className="w-full px-4 py-2 text-right font-cairo hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-200"
                    >
                      قادم
                    </button>
                    <button
                      onClick={() => {
                        editingOffer
                          ? setEditingOffer({ ...editingOffer, status: 'EXPIRED' })
                          : setNewOffer({ ...newOffer, status: 'EXPIRED' });
                        setIsStatusOpen(false);
                      }}
                      className="w-full px-4 py-2 text-right font-cairo hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-200"
                    >
                      غير نشط
                    </button>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                <DatePicker
                  selected={offer.startDate ? new Date(offer.startDate) : null}
                  onChange={(date) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, startDate: date ? date.toISOString() : '' })
                      : setNewOffer({ ...newOffer, startDate: date ? date.toISOString() : '' })
                  }
                  showTimeSelect
                  dateFormat="yyyy-MM-dd HH:mm"
                  placeholderText="تاريخ البداية"
                  locale={ar}
                  className="w-full pr-10 pl-4 py-2.5 text-right bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 font-cairo"
                  wrapperClassName="w-full"
                  dir="rtl"
                />
              </div>
           
              <div className="relative">
                <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                <DatePicker
                  selected={offer.endDate ? new Date(offer.endDate) : null}
                  onChange={(date) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, endDate: date ? date.toISOString() : '' })
                      : setNewOffer({ ...newOffer, endDate: date ? date.toISOString() : '' })
                  }
                  showTimeSelect
                  dateFormat="yyyy-MM-dd HH:mm"
                  placeholderText="تاريخ النهاية"
                  locale={ar}
                  className="w-full pr-10 pl-4 py-2.5 text-right bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 font-cairo"
                  wrapperClassName="w-full"
                  dir="rtl"
                />
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={editingOffer ? updateOffer : addOffer}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all duration-300 shadow-md font-cairo"
          >
            {editingOffer ? 'تعديل العرض' : 'إضافة العرض'}
          </button>
          {editingOffer && (
            <button
              onClick={() => setEditingOffer(null)}
              className="px-6 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-300 shadow-md font-cairo"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>



      
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <FiRefreshCw className="animate-spin text-indigo-600 dark:text-indigo-400 text-4xl" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-center text-sm font-cairo">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">اسم العرض</th>
                      <th className="px-4 py-3 font-semibold">الوصف</th>
                      <th className="px-4 py-3 font-semibold">الحالة</th>
                      <th className="px-4 py-3 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-200">
                    {currentOffers.map((offer, index) => (
                      <tr
                        key={offer.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        <td className="px-4 py-3">{indexOfFirstOrder + index + 1}</td>
                        <td className="px-4 py-3">{offer.name}</td>
                        <td className="px-4 py-3">{offer.description}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              offer.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : offer.status === 'SCHEDULED'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}
                          >
                            {offer.status === 'ACTIVE' ? 'نشط' : offer.status === 'SCHEDULED' ? 'قادم' : 'غير نشط'}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex justify-center gap-2">
                          <button
                            onClick={() => viewOfferDetails(offer.id)}
                            className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-200"
                          >
                            <FiInfo />
                          </button>
                          <button
                            onClick={() => setEditingOffer(offer)}
                            className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-200"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => deleteOffer(offer.id)}
                            className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentOffers.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center">
                          <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 font-cairo">
                            لا توجد عروض
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 font-cairo">
                            {searchTerm ? 'حاول تعديل مصطلحات البحث' : 'أضف عرضًا جديدًا لبدء إدارة العروض'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6 p-4">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-cairo"
                    disabled={currentPage === 1}
                  >
                    <FiChevronLeft />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-300 font-cairo ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                          : 'bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-cairo"
                    disabled={currentPage === totalPages}
                  >
                    <FiChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopOffers;
