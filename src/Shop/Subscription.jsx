import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import API from '../api';
import {
  FaCalendar,
  FaCheck,
  FaCreditCard,
  FaMoneyBillWave,
  FaSync,
  FaChevronDown,
  FaHeadset,
  FaCogs,
  FaStore,
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const VALID_SUB_TYPES = ['COMMISSION', 'RATIO'];
const PRICE_PER_MONTH = { COMMISSION: 1000, RATIO: 800 };
const CURRENCY = 'ج.م';

const Subscriptions = () => {
  const [currentSub, setCurrentSub] = useState(null);
  const [allSubs, setAllSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(1);
  const [type, setType] = useState('COMMISSION');
  const [typeOpen, setTypeOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);

  const totalPrice = PRICE_PER_MONTH[type] * duration;
  const hasActiveSub = currentSub && new Date(currentSub.endDate) > new Date();

  const abortCtrlRef = useRef(null);

  const getConfig = useCallback(() => {
    if (!abortCtrlRef.current) {
      abortCtrlRef.current = new AbortController();
    }
    return { signal: abortCtrlRef.current.signal };
  }, []);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const createPayload = useCallback(() => ({
    months: duration,
    type: type.toUpperCase(),
  }), [duration, type]);

  // Fetch subscriptions
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [currentRes, allRes] = await Promise.all([
        API.get('/api/subscriptions', getConfig()),
        API.get('/api/subscriptions/all', getConfig()),
      ]);

      setCurrentSub(currentRes.data?.content?.[0] ?? null);
      setAllSubs(Array.isArray(allRes.data?.content) ? allRes.data.content : allRes.data ?? []);
    } catch (err) {
      // if (err.name !== 'AbortError') {
      //   Swal.fire('خطأ', 'فشل تحميل بيانات الاشتراك', 'error');
      // }
    } finally {
      setLoading(false);
    }
  }, [getConfig]);

  useEffect(() => {
    abortCtrlRef.current?.abort();
    abortCtrlRef.current = new AbortController();
    fetchData();

    return () => abortCtrlRef.current?.abort();
  }, []);

  // Subscribe with Card (supports credit & redirect)
  const subscribeWithCard = async () => {
    const result = await Swal.fire({
      title: 'تأكيد الاشتراك',
      html: `
        <div class="text-right space-y-3">
          <p><strong>النوع:</strong> ${type === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'}</p>
          <p><strong>المدة:</strong> ${duration} شهر</p>
          <p><strong>الإجمالي:</strong> <span class="text-2xl font-bold text-lime-600">${totalPrice} ${CURRENCY}</span></p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'نعم، ادفع بالبطاقة',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#10b981',
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'جاري المعالجة...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await API.post('/api/subscriptions/card', createPayload(), getConfig());
      const { paymentURL, paymentId, message } = res.data;
console.log(res.data);
      if (!paymentURL) {
        // Paid with credit or already active
        await Swal.fire({
          icon: 'success',
          title: 'تم بنجاح!',
          text: message || 'تم تفعيل الاشتراك بنجاح',
          timer: 3000,
        });
        fetchData();
        return;
      }

      // Redirect to payment gateway
      await Swal.fire({
        icon: 'success',
        title: ' سيتم توجيهك الي الدفع',
        toast:true,
        position:"top-end",
        timer: 2500,
      });

      window.location.href = paymentURL;
    } catch (err) {
      const msg = err?.response?.data?.message || 'فشل إنشاء الدفع، حاول مرة أخرى';
      Swal.fire('فشل', msg, 'error');
    }
  };

  // Subscribe with Cash
  const subscribeWithCash = async () => {
    const result = await Swal.fire({
      title: 'طلب دفع نقدي',
      html: `
        <div class="text-right space-y-3">
          <p><strong>النوع:</strong> ${type === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'}</p>
          <p><strong>المدة:</strong> ${duration} شهر</p>
          <p><strong>الإجمالي:</strong> <span class="text-2xl font-bold text-orange-600">${totalPrice} ${CURRENCY}</span></p>
          <p class="text-sm text-gray-600 mt-4">سيتم التواصل معك لاستلام المبلغ نقدًا</p>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'إرسال الطلب',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#f97316',
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: 'جاري إرسال الطلب...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await API.post('/api/subscriptions/cash', createPayload(), getConfig());
      await Swal.fire({
        icon: 'success',
        title: 'تم إرسال الطلب',
        text: 'سنتواصل معك قريبًا لاستلام المبلغ نقدًا',
        timer: 4000,
      });
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.message || 'فشل إرسال الطلب';
      Swal.fire('فشل', msg, 'error');
    }
  };

  const durationOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);

  return (
    <div dir="rtl" style={{ marginLeft: "-25px", marginTop: "-600px" }} className="min-h-screen max-w-6xl mx-auto p-4 lg:p-8 font-cairo bg-gradient-to-br from-gray-50 via-white to-white">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-right bg-white p-6 shadow-sm border-l-4 border-lime-500">
          <h1 className="text-3xl font-bold text-black mb-2 flex items-center justify-start gap-3">
            <FaCalendar className="text-gray-500" />
            إدارة الاشتراكات
          </h1>
          <p className="text-sm text-gray-600">اختر خطتك أو جدد اشتراكك بسهولة</p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition group">
            <div className="flex items-center justify-start gap-3 mb-3">
              <div className="p-2 bg-lime-100 rounded-lg group-hover:bg-lime-200 transition">
                <FaStore className="w-6 h-6 text-lime-700" />
              </div>
              <h3 className="text-lg font-bold text-black">إدارة كاملة</h3>
            </div>
            <p className="text-sm text-gray-600 text-right">تحكم كامل في المتجر والطلبات</p>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition group">
            <div className="flex items-center justify-start gap-3 mb-3">
              <div className="p-2 bg-lime-100 rounded-lg group-hover:bg-lime-200 transition">
                <FaHeadset className="w-6 h-6 text-lime-700" />
              </div>
              <h3 className="text-lg font-bold text-black">دعم 24/7</h3>
            </div>
            <p className="text-sm text-gray-600 text-right">فريق دعم متاح على مدار الساعة</p>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition group">
            <div className="flex items-center justify-start gap-3 mb-3">
              <div className="p-2 bg-lime-100 rounded-lg group-hover:bg-lime-200 transition">
                <FaCogs className="w-6 h-6 text-lime-700" />
              </div>
              <h3 className="text-lg font-bold text-black">تحديثات تلقائية</h3>
            </div>
            <p className="text-sm text-gray-600 text-right">ميزات جديدة دائمًا بدون تكلفة</p>
          </div>
        </div>

        {/* Plan Card */}
        <div className="max-w-lg mx-auto">
          <div className="rounded-xl p-8 shadow-lg bg-white border-2 border-lime-100">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-lime-100 text-lime-700 rounded-full">
                <FaCalendar className="w-10 h-10" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-black mb-8">
              {hasActiveSub ? 'تجديد الاشتراك' : 'اشترك الآن'}
            </h2>

            {/* Type Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">نوع الاشتراك</label>
              <div className="relative">
                <button
                  onClick={() => setTypeOpen(!typeOpen)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 rounded-xl flex justify-between items-center hover:border-lime-500 transition text-right font-medium"
                >
                  <span>
                    {type === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'} ({PRICE_PER_MONTH[type]} {CURRENCY}/شهر)
                  </span>
                  <FaChevronDown className={`transition ${typeOpen ? 'rotate-180' : ''}`} />
                </button>
                {typeOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-lime-200 rounded-xl shadow-xl">
                    {VALID_SUB_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => { setType(t); setTypeOpen(false); }}
                        className="block w-full px-5 py-3 text-right hover:bg-lime-50 transition font-medium"
                      >
                        {t === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'} ({PRICE_PER_MONTH[t]} {CURRENCY}/شهر)
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Duration Dropdown */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-black mb-2">المدة</label>
              <div className="relative">
                <button
                  onClick={() => setDurationOpen(!durationOpen)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 rounded-xl flex justify-between items-center hover:border-lime-500 transition text-right font-medium"
                >
                  <span>{duration} شهر {duration === 12 && '(سنة كاملة)'}</span>
                  <FaChevronDown className={`transition ${durationOpen ? 'rotate-180' : ''}`} />
                </button>
                {durationOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-lime-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {durationOptions.map((m) => (
                      <button
                        key={m}
                        onClick={() => { setDuration(m); setDurationOpen(false); }}
                        className="block w-full px-5 py-3 text-right hover:bg-lime-50 transition"
                      >
                        {m} شهر {m === 12 && '(سنة كاملة)'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Total Price */}
            <div className="text-center mb-8 p-6 bg-gradient-to-r from-lime-50 to-emerald-50 rounded-xl">
              <div className="text-5xl font-bold text-lime-600">{totalPrice} {CURRENCY}</div>
              <p className="text-gray-600 mt-2">{PRICE_PER_MONTH[type]} × {duration} شهر</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={subscribeWithCard}
                className="flex items-center justify-center gap-3 py-4 font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition shadow-lg text-lg"
              >
                <FaCreditCard className="w-6 h-6" />
                بالبطاقة
              </button>
              <button
                onClick={subscribeWithCash}
                className="flex items-center justify-center gap-3 py-4 font-bold rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white transition shadow-lg text-lg"
              >
                <FaMoneyBillWave className="w-6 h-6" />
                نقدي
              </button>
            </div>
          </div>
        </div>

        {/* Current & History */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          {/* Current */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold mb-4">الاشتراك الحالي</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !currentSub ? (
              <p className="text-center text-gray-500 py-8 text-lg">لا يوجد اشتراك نشط</p>
            ) : (
              <div className="p-6 bg-gradient-to-r from-lime-50 to-emerald-50 rounded-xl">
                <p className="font-bold text-lg">{currentSub.type === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {formatDate(currentSub.startDate)} → {formatDate(currentSub.endDate)}
                </p>
                <p className="text-2xl font-bold mt-3">{currentSub.totalAmount} {CURRENCY}</p>
                <span className={`inline-block mt-4 px-4 py-2 rounded-full text-sm font-bold ${
                  hasActiveSub ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {hasActiveSub ? 'نشط' : 'منتهي'}
                </span>
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold mb-4">سجل الاشتراكات</h2>
            {allSubs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا توجد اشتراكات سابقة</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allSubs.map((s) => (
                  <div key={s.id} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <div className="text-right">
                        <p className="font-medium">{s.type === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'}</p>
                        <p className="text-xs text-gray-600">{formatDate(s.startDate)} - {formatDate(s.endDate)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        new Date(s.endDate) > new Date() ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {new Date(s.endDate) > new Date() ? 'نشط' : 'منتهي'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;