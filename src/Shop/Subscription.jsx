import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FaCalendar, FaCreditCard, FaMoneyBillWave, FaStore,
  FaHeadset, FaCogs
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import API from '../api';
import { FiChevronDown } from 'react-icons/fi';

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

    Swal.fire({ title: 'جاري المعالجة...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const res = await API.post('/api/subscriptions/card', createPayload(), getConfig());
      const { paymentURL, message } = res.data;

      if (!paymentURL) {
        await Swal.fire({ icon: 'success', title: 'تم بنجاح!', text: message || 'تم تفعيل الاشتراك', timer: 3000 });
        fetchData();
        return;
      }

      await Swal.fire({ icon: 'success', title: 'سيتم توجيهك إلى الدفع', toast: true, position: "top-end", timer: 2500 });
      window.location.href = paymentURL;
    } catch (err) {
      const msg = err?.response?.data?.message || 'فشل إنشاء الدفع';
      Swal.fire('فشل', msg, 'error');
    }
  };

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

    Swal.fire({ title: 'جاري إرسال الطلب...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

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
    <div dir="rtl" style={{ marginLeft: "-250px", marginTop: "-600px" }} className="min-h-screen bg-gray-50 font-cairo py-8">
      <div className="max-w-5xl mx-auto px-6">

        
        <div className="mb-10 bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center flex-row-reverse justify-between text-right gap-5">
            <div className="p-5 bg-lime-100 rounded-2xl">
              <FaCalendar className="text-4xl text-lime-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">إدارة الاشتراكات</h1>
              <p className="text-lg text-gray-600 mt-2">اختر خطتك أو جدد اشتراكك بسهولة وأمان</p>
            </div>
          </div>
        </div>

     
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">إدارة كاملة للمتجر</p>
              </div>
              <FaStore className="text-6xl opacity-40 text-lime-600" />
            </div>
          </div>

          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">دعم فني 24/7</p>
              </div>
              <FaHeadset className="text-6xl opacity-40 text-blue-600" />
            </div>
          </div>

          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">تحديثات تلقائية مجانية</p>
              </div>
              <FaCogs className="text-6xl opacity-40 text-purple-600" />
            </div>
          </div>
        </div>




  <div className="col-span-full bg-white rounded-3xl shadow-lg border border-gray-200 p-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 flex items-center gap-5 justify-center">
              <FaCalendar className="text-lime-600 text-4xl" />
              سجل الاشتراكات الكامل
            </h2>

            {allSubs.length === 0 ? (
              <div className="text-center py-24 text-gray-500">
                <FaCalendar className="w-24 h-24 mx-auto opacity-30 mb-8" />
                <p className="text-3xl font-medium mb-4">لا توجد اشتراكات سابقة</p>
                <p className="text-xl">ستظهر هنا جميع اشتراكاتك السابقة والحالية عند إنشائها</p>
              </div>
            ) : (
              <div className="grid gap-8">
                {allSubs.map((s, index) => {
                  const isActive = new Date(s.endDate) > new Date();
                  const isCurrent = index === 0 && isActive;

                  return (
                    <div
                      key={s.id}
                      className={`relative p-10 rounded-3xl border-4 transition-all shadow-xl ${
                        isActive
                          ? 'bg-gradient-to-br from-lime-50 via-emerald-50 to-teal-50 border-lime-400'
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                  
                      {isCurrent && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-8 py-3 bg-lime-600 text-white font-bold rounded-full shadow-lg text-lg">
                          ← الاشتراك الحالي
                        </div>
                      )}

                      <div className="grid md:grid-cols-3 gap-8 items-center text-center md:text-right">
                       
                        <div>
                          <p className="text-3xl font-bold text-gray-900 mb-3">
                            {s.type === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'}
                          </p>
                          <span className={`inline-block px-8 py-4 rounded-full text-xl font-bold shadow-md ${
                            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {isActive ? 'نشط حاليًا' : 'منتهي الصلاحية'}
                          </span>
                        </div>

                    
                        <div className="space-y-4">
                          <p className="text-xl text-gray-700">
                            <span className="font-medium">بدأ في:</span>{' '}
                            <span className="font-bold text-2xl text-lime-700">{formatDate(s.startDate)}</span>
                          </p>
                          <p className="text-xl text-gray-700">
                            <span className="font-medium">ينتهي في:</span>{' '}
                            <span className="font-bold text-2xl text-red-600">{formatDate(s.endDate)}</span>
                          </p>
                        </div>

                        
                        <div className="space-y-4">
                          <p className="text-5xl font-extrabold text-lime-600">
                            {Number(s.totalAmount).toLocaleString()} {CURRENCY}
                          </p>
                          <p className="text-sm text-gray-500">
                            رقم الاشتراك: <span className="font-mono font-bold">#{s.id}</span>
                          </p>
                        </div>
                      </div>

                      
                      {isActive && (
                        <div className="mt-8 h-3 bg-gradient-to-r from-lime-500 to-emerald-600 rounded-full"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div><br />

      
        <div className="grid lg:grid-cols-1 gap-8 mb-12">

         
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex p-5 bg-lime-100 rounded-2xl mb-4">
                <FaCalendar className="text-4xl text-lime-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                {hasActiveSub ? 'تجديد الاشتراك' : 'اشترك الآن'}
              </h2>
            </div>

           
            <div className="mb-6">
              <label className="block text-lg font-medium text-gray-800 mb-3">نوع الاشتراك</label>
              <div className="relative">
                <button
                  onClick={() => setTypeOpen(!typeOpen)}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-300 rounded-2xl flex justify-between items-center hover:border-lime-500 transition font-medium text-lg"
                >
                  <span>
                    {type === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'} ({PRICE_PER_MONTH[type]} {CURRENCY}/شهر)
                  </span>
                  <FiChevronDown className={`text-xl transition ${typeOpen ? 'rotate-180' : ''}`} />
                </button>
                {typeOpen && (
                  <div className="absolute top-full mt-3 w-full bg-white border-2 border-lime-300 rounded-2xl shadow-xl z-10 overflow-hidden">
                    {VALID_SUB_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => { setType(t); setTypeOpen(false); }}
                        className="w-full px-6 py-4 text-right hover:bg-lime-50 transition font-medium"
                      >
                        {t === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'} ({PRICE_PER_MONTH[t]} {CURRENCY}/شهر)
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

           
            <div className="mb-8">
              <label className="block text-lg font-medium text-gray-800 mb-3">المدة بالشهور</label>
              <div className="relative">
                <button
                  onClick={() => setDurationOpen(!durationOpen)}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-300 rounded-2xl flex justify-between items-center hover:border-lime-500 transition font-medium text-lg"
                >
                  <span>{duration} شهر {duration === 12 && '(سنة كاملة)'}</span>
                  <FiChevronDown className={`text-xl transition ${durationOpen ? 'rotate-180' : ''}`} />
                </button>
                {durationOpen && (
                  <div className="absolute top-full mt-3 w-full bg-white border-2 border-lime-300 rounded-2xl shadow-xl z-10 max-h-64 overflow-y-auto">
                    {durationOptions.map((m) => (
                      <button
                        key={m}
                        onClick={() => { setDuration(m); setDurationOpen(false); }}
                        className="w-full px-6 py-4 text-right hover:bg-lime-50 transition"
                      >
                        {m} شهر {m === 12 && '(سنة كاملة)'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

           
            <div className="text-center p-8 bg-gradient-to-r from-lime-50 to-emerald-50 rounded-2xl mb-8">
              <p className="text-5xl font-bold text-lime-600">{totalPrice.toLocaleString()} {CURRENCY}</p>
              <p className="text-gray-700 mt-3 text-lg">{PRICE_PER_MONTH[type]} × {duration} شهر</p>
            </div>

           
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={subscribeWithCard}
                className="py-5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-3 text-lg"
              >
                <FaCreditCard className="text-xl" />
                بالبطاقة
              </button>
              <button
                onClick={subscribeWithCash}
                className="py-5 px-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-3 text-lg"
              >
                <FaMoneyBillWave className="text-xl" />
                نقدي
              </button>
            </div>
          </div>

          
          {/* <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">الاشتراك الحالي</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-6 border-lime-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !currentSub ? (
              <div className="text-center py-12 text-gray-500">
                <FaCalendar className="w-16 h-16 mx-auto opacity-30 mb-4" />
                <p className="text-xl">لا يوجد اشتراك نشط حاليًا</p>
              </div>
            ) : (
              <div className="p-8 bg-gradient-to-r from-lime-50 to-emerald-50 rounded-2xl">
                <p className="text-2xl font-bold text-gray-900">
                  {currentSub.type === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'}
                </p>
                <p className="text-lg text-gray-700 mt-3">
                  من {formatDate(currentSub.startDate)} إلى {formatDate(currentSub.endDate)}
                </p>
                <p className="text-4xl font-bold text-lime-600 mt-6">{currentSub.totalAmount} {CURRENCY}</p>
                <div className="mt-6 inline-block px-6 py-3 rounded-full text-lg font-bold bg-green-100 text-green-800">
                  {hasActiveSub ? 'نشط' : 'منتهي'}
                </div>
              </div>
            )}
          </div> */}

         
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;