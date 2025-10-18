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

const ShopOffers = ({ darkMode }) => {
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

  // Handle click outside for dropdowns
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

  // Fetch offers
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
        Swal.fire({
          title: 'خطأ',
          text: 'فشل في تحميل العروض',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [darkMode]);

  // View offer details
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
          <div class="text-right font-sans">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">اسم العرض</strong> ${offer.name}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">الوصف</strong> ${offer.description}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">قيمة الخصم</strong> ${offer.discountValue} ${offer.discountType === 'PERCENTAGE' ? '%' : 'EGP'}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">نوع الخصم</strong> ${discountTypeTranslations[offer.discountType]}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">الحالة</strong> ${statusTranslations[offer.status]}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">تاريخ البداية</strong> ${startFormattedDate}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">تاريخ النهاية</strong> ${endFormattedDate}</p>
          </div>
        `,
        width: 600,
        icon: 'info',
        showCloseButton: true,
        confirmButtonText: 'إغلاق',
        customClass: {
          popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '',
        },
      });
    } catch (err) {
      console.error('Error fetching offer details:', err.response?.data || err.message);
      Swal.fire({
        title: 'خطأ',
        text: 'فشل في تحميل تفاصيل العرض',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    }
  }, [darkMode, statusTranslations, discountTypeTranslations]);

  // Add offer
  const addOffer = useCallback(async () => {
    if (!newOffer.name || !newOffer.description || !newOffer.discountValue || !newOffer.startDate || !newOffer.endDate) {
      Swal.fire({
        title: 'خطأ',
        text: 'يرجى ملء جميع الحقول المطلوبة',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      return;
    }
    try {
      await api.post('/api/shop/offers', { ...newOffer, discountValue: Number(newOffer.discountValue) });
      Swal.fire({
        title: 'نجاح',
        text: 'تمت إضافة العرض بنجاح',
        icon: 'success',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
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
      Swal.fire({
        title: 'خطأ',
        text: 'فشل في إضافة العرض',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    }
  }, [fetchOffers, newOffer, darkMode]);

  // Update offer
  const updateOffer = useCallback(async () => {
    if (!editingOffer.name || !editingOffer.description || !editingOffer.discountValue || !editingOffer.startDate || !editingOffer.endDate) {
      Swal.fire({
        title: 'خطأ',
        text: 'يرجى ملء جميع الحقول المطلوبة',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      return;
    }
    try {
      await api.put(`/api/shop/offers/${editingOffer.id}`, {
        ...editingOffer,
        discountValue: Number(editingOffer.discountValue),
      });
      Swal.fire({
        title: 'نجاح',
        text: 'تم تعديل العرض بنجاح',
        icon: 'success',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      setEditingOffer(null);
      fetchOffers();
    } catch (err) {
      console.error('Error updating offer:', err.response?.data || err.message);
      Swal.fire({
        title: 'خطأ',
        text: 'فشل في تعديل العرض',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    }
  }, [editingOffer, fetchOffers, darkMode]);

  // Delete offer
  const deleteOffer = useCallback(async (offerId) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف العرض بشكل نهائي',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      customClass: {
        popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '',
      },
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/shop/offers/${offerId}`);
      Swal.fire({
        title: 'تم الحذف',
        text: 'تم حذف العرض بنجاح',
        icon: 'success',
        customClass: {
          popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '',
        },
      });
      fetchOffers();
    } catch (err) {
      console.error('Error deleting offer:', err.response?.data || err.message);
      Swal.fire({
        title: 'خطأ',
        text: 'فشل في حذف العرض',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    }
  }, [fetchOffers, darkMode]);

  // Debounced search
  const debouncedSetSearchTerm = useMemo(
    () => debounce((value) => setSearchTerm(value), 300),
    []
  );

  const handleSearchChange = useCallback(
    (e) => {
      debouncedSetSearchTerm(e.target.value);
      setCurrentPage(1);
    },
    [debouncedSetSearchTerm]
  );

  // Cleanup debounce
  useEffect(() => {
    return () => debouncedSetSearchTerm.cancel();
  }, [debouncedSetSearchTerm]);

  // Filter offers
  const filteredOffers = useMemo(
    () => offers.filter((offer) => offer.name?.toLowerCase().includes(searchTerm.toLowerCase())),
    [offers, searchTerm]
  );

  // Pagination logic
  const indexOfLastOffer = currentPage * offersPerPage;
  const indexOfFirstOffer = indexOfLastOffer - offersPerPage;
  const currentOffers = filteredOffers.slice(indexOfFirstOffer, indexOfLastOffer);
  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / offersPerPage));

  // Fetch offers on mount
  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return (
    <div style={{ marginTop: "-600px", marginLeft: "250px" }} className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 lg:p-8 font-cairo">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-right bg-white p-4 rounded-xl dark:bg-gray-950">
          <h1 className="text-4xl font-bold mb-4 text-indigo-600 dark:text-white flex items-center justify-end gap-3">
            <FiShoppingBag className="text-indigo-600 dark:text-indigo-400" /> عروض المتجر
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-right">إدارة وتعديل عروض المتجر بسهولة</p>
        </div>

        {/* Search Bar */}
        <div className="flex justify-between items-center gap-4 mb-6 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              id="search"
              placeholder=" "
              onChange={handleSearchChange}
              className="peer w-full pl-10 pr-4 py-3 pt-6 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 text-right text-sm"
            />
            <label
              htmlFor="search"
              className="absolute right-10 top-0.5 text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0.5 peer-focus:text-sm peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400"
            >
              ابحث عن عرض...
            </label>
          </div>
        </div>

        {/* Add/Edit Offer Form */}
        <div className="max-w-7xl mx-auto mb-10 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex justify-end items-center gap-3">
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
                {/* Offer Name */}
                <div className="relative">
                  <input
                    type="text"
                    id="offer-name"
                    placeholder=" "
                    value={offer.name}
                    onChange={(e) =>
                      editingOffer
                        ? setEditingOffer({ ...editingOffer, name: e.target.value })
                        : setNewOffer({ ...newOffer, name: e.target.value })
                    }
                    className="peer w-full pr-10 pl-4 py-3 pt-6 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 text-right text-sm"
                    dir="rtl"
                  />
                  <FiTag className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                  <label
                    htmlFor="offer-name"
                    className="absolute right-10 top-0.5 text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0.5 peer-focus:text-sm peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400"
                  >
                    اسم العرض
                  </label>
                </div>

                {/* Description */}
                <div className="relative">
                  <input
                    type="text"
                    id="offer-description"
                    placeholder=" "
                    value={offer.description}
                    onChange={(e) =>
                      editingOffer
                        ? setEditingOffer({ ...editingOffer, description: e.target.value })
                        : setNewOffer({ ...newOffer, description: e.target.value })
                    }
                    className="peer w-full pr-10 pl-4 py-3 pt-6 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 text-right text-sm"
                    dir="rtl"
                  />
                  <FiInfo className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                  <label
                    htmlFor="offer-description"
                    className="absolute right-10 top-0.5 text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0.5 peer-focus:text-sm peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400"
                  >
                    الوصف
                  </label>
                </div>

                {/* Discount Value */}
                <div className="relative">
                  <input
                    type="text"
                    id="discount-value"
                    placeholder=" "
                    value={offer.discountValue}
                    onChange={(e) =>
                      editingOffer
                        ? setEditingOffer({ ...editingOffer, discountValue: e.target.value })
                        : setNewOffer({ ...newOffer, discountValue: e.target.value })
                    }
                    className="peer w-full pr-10 pl-4 py-3 pt-6 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500咕focus:border-indigo-500 outline-none transition-all duration-300 text-right text-sm"
                    dir="rtl"
                  />
                  <FiCheckSquare className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                  <label
                    htmlFor="discount-value"
                    className="absolute right-10 top-0.5 text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0.5 peer-focus:text-sm peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400"
                  >
                    قيمة الخصم
                  </label>
                </div>

                {/* Discount Type */}
                <div className="relative" ref={discountTypeRef}>
                  <button
                    onClick={() => setIsDiscountTypeOpen(!isDiscountTypeOpen)}
                    className="w-full flex items-center justify-between pr-10 pl-4 py-3 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 text-right text-sm"
                    dir="rtl"
                  >
                    {discountTypeTranslations[offer.discountType]}
                    <FiChevronDown className={`text-gray-400 dark:text-gray-300 transition-transform duration-300 ${isDiscountTypeOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDiscountTypeOpen && (
                    <div className="absolute w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-10">
                      <button
                        onClick={() => {
                          editingOffer
                            ? setEditingOffer({ ...editingOffer, discountType: 'PERCENTAGE' })
                            : setNewOffer({ ...newOffer, discountType: 'PERCENTAGE' });
                          setIsDiscountTypeOpen(false);
                        }}
                        className="w-full px-4 py-2 text-right text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm"
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
                        className="w-full px-4 py-2 text-right text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm"
                      >
                        مبلغ ثابت
                      </button>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="relative" ref={statusRef}>
                  <button
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                    className="w-full flex items-center justify-between pr-10 pl-4 py-3 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 text-right text-sm"
                    dir="rtl"
                  >
                    {statusTranslations[offer.status]}
                    <FiChevronDown className={`text-gray-400 dark:text-gray-300 transition-transform duration-300 ${isStatusOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isStatusOpen && (
                    <div className="absolute w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-10">
                      {['ACTIVE', 'SCHEDULED', 'EXPIRED'].map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            editingOffer
                              ? setEditingOffer({ ...editingOffer, status })
                              : setNewOffer({ ...newOffer, status });
                            setIsStatusOpen(false);
                          }}
                          className="w-full px-4 py-2 text-right text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm"
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
                        ? setEditingOffer({ ...editingOffer, startDate: date ? date.toISOString() : '' })
                        : setNewOffer({ ...newOffer, startDate: date ? date.toISOString() : '' })
                    }
                    showTimeSelect
                    dateFormat="yyyy-MM-dd HH:mm"
                    placeholderText=" "
                    locale={ar}
                    id="start-date"
                    className="peer w-full pr-10 pl-4 py-3 pt-6 text-right bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 text-sm"
                    wrapperClassName="w-full"
                    dir="rtl"
                  />
                  <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                  <label
                    htmlFor="start-date"
                    className="absolute right-10 top-0.5 text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0.5 peer-focus:text-sm peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400"
                  >
                    تاريخ البداية
                  </label>
                </div>

                {/* End Date */}
                <div className="relative">
                  <DatePicker
                    selected={offer.endDate ? new Date(offer.endDate) : null}
                    onChange={(date) =>
                      editingOffer
                        ? setEditingOffer({ ...editingOffer, endDate: date ? date.toISOString() : '' })
                        : setNewOffer({ ...newOffer, endDate: date ? date.toISOString() : '' })
                    }
                    showTimeSelect
                    dateFormat="yyyy-MM-dd HH:mm"
                    placeholderText=" "
                    locale={ar}
                    id="end-date"
                    className="peer w-full pr-10 pl-4 py-3 pt-6 text-right bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300 text-sm"
                    wrapperClassName="w-full"
                    dir="rtl"
                  />
                  <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                  <label
                    htmlFor="end-date"
                    className="absolute right-10 top-0.5 text-sm text-gray-500 dark:text-gray-400 transition-all duration-300 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0.5 peer-focus:text-sm peer-focus:text-indigo-500 dark:peer-focus:text-indigo-400"
                  >
                    تاريخ النهاية
                  </label>
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={editingOffer ? updateOffer : addOffer}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all duration-300 shadow-md"
            >
              {editingOffer ? 'تعديل العرض' : 'إضافة العرض'}
            </button>
            {editingOffer && (
              <button
                onClick={() => setEditingOffer(null)}
                className="px-6 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-300 shadow-md"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>

        {/* Offers Table */}
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto text-sm text-right">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-right">رقم العرض</th>
                        <th className="px-6 py-4 font-semibold text-right">اسم العرض</th>
                        <th className="px-6 py-4 font-semibold text-right">الوصف</th>
                        <th className="px-6 py-4 font-semibold text-right">قيمة الخصم</th>
                        <th className="px-6 py-4 font-semibold text-right">نوع الخصم</th>
                        <th className="px-6 py-4 font-semibold text-right">الحالة</th>
                        <th className="px-6 py-4 font-semibold text-right">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-gray-200">
                      {currentOffers.map((offer, index) => (
                        <tr
                          key={offer.id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                        >
                          <td className="px-6 py-4">{indexOfFirstOffer + index + 1}</td>
                          <td className="px-6 py-4">{offer.name}</td>
                          <td className="px-6 py-4">{offer.description}</td>
                          <td className="px-6 py-4">
                            {offer.discountValue} {offer.discountType === 'PERCENTAGE' ? '%' : 'EGP'}
                          </td>
                          <td className="px-6 py-4">{discountTypeTranslations[offer.discountType]}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                offer.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  : offer.status === 'SCHEDULED'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              }`}
                            >
                              {statusTranslations[offer.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex justify-end gap-2">
                            <button
                              onClick={() => viewOfferDetails(offer.id)}
                              className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-200"
                              title="عرض التفاصيل"
                            >
                              <FiInfo />
                            </button>
                            <button
                              onClick={() => setEditingOffer(offer)}
                              className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-200"
                              title="تعديل العرض"
                            >
                              <FiEdit2 />
                            </button>
                            <button
                              onClick={() => deleteOffer(offer.id)}
                              className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200"
                              title="حذف العرض"
                            >
                              <FiTrash2 />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {currentOffers.length === 0 && (
                  <div className="p-8 text-center bg-white dark:bg-gray-900">
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
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                      لا توجد عروض
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm ? 'حاول تعديل مصطلحات البحث' : 'أضف عرضًا جديدًا لبدء إدارة العروض'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-md">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-4 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
              >
                <FiChevronLeft />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-300 ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                      : 'bg-white dark:bg-gray-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
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
  );
};

export default ShopOffers;