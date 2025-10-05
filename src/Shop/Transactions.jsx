import React, { useState, useEffect, useRef } from "react";
import { FiChevronLeft, FiChevronRight, FiDollarSign, FiSearch } from "react-icons/fi";

const Transactions = ({ darkMode }) => {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [financialReport, setFinancialReport] = useState(null);
  const transactionsPerPage = 4;
  const token = localStorage.getItem("authToken");


  const timeSelectRef = useRef(null);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reportRes = await fetch(
          "http://localhost:8080/api/shops/payments/financial-report"
        ,{headers:{Authorization:`Bearer ${token}`}});
        const reportData = await reportRes.json();
        setFinancialReport(reportData);

        const repairRes = await fetch(
          "http://localhost:8080/api/shops/payments/repairs"
        ,{headers:{Authorization:`Bearer ${token}`}});
        const repairData = await repairRes.json();

        const orderRes = await fetch(
          "http://localhost:8080/api/shops/payments/orders"
        ,{headers:{Authorization:`Bearer ${token}`}});
        const orderData = await orderRes.json();

        const allTransactions = [...repairData, ...orderData].map((t, idx) => ({
          id: t.id ?? idx,
          date: t?.date,
          type: (t.type || "").toLowerCase().includes("repair") ? "repair" : "sale",
          item: (t.item || (t.type && t.type.includes("REPAIR") ? "إصلاح جهاز" : "طلب شراء")),
          shop: t.shop || "متجرك",
          paymentMethod: t.paymentMethod || "غير محدد",
          amount: Number(t.amount) || 0,
          status: (t.status || "Completed").toLowerCase(),
        }));

        setTransactions(allTransactions);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      }
    };

    fetchData();
  }, [timeRange]);

  useEffect(() => {
    const $ = window.jQuery || window.$;
    if (!$ || !$.fn || !$.fn.select2) {
      console.warn(
        "jQuery or Select2 not found. Make sure you added the CDN scripts in public/index.html"
      );
      return;
    }

    const $select = $(timeSelectRef.current);
    $select.select2({
      width: "resolve",
      dir: "rtl",
      theme: darkMode ? "bootstrap4-dark" : "bootstrap4",
      minimumResultsForSearch: Infinity,
    });

    $select.on("change.select2", (e) => {
      const val = $select.val();
      setTimeRange(val);
      setCurrentPage(1);
    });

    $select.val(timeRange).trigger("change.select2");

    return () => {
      $select.off("change.select2");
      try {
        $select.select2("destroy");
      } catch (e) {}
    };
  }, [darkMode]);

  useEffect(() => {
    const $ = window.jQuery || window.$;
    if ($ && $.fn && $.fn.select2 && timeSelectRef.current) {
      const $select = $(timeSelectRef.current);
      if ($select.val() !== timeRange) {
        $select.val(timeRange).trigger("change.select2");
      }
    }
  }, [timeRange]);

  const totalEarnings =
    financialReport?.totalEarnings ??
    transactions.reduce((sum, t) => sum + t.amount, 0);

  const repairEarnings =
    financialReport?.repairEarnings ??
    transactions
      .filter((t) => t.type === "repair")
      .reduce((sum, t) => sum + t.amount, 0);

  const salesEarnings =
    financialReport?.salesEarnings ??
    transactions
      .filter((t) => t.type === "sale")
      .reduce((sum, t) => sum + t.amount, 0);

  const repairPercentage =
    totalEarnings > 0 ? Math.round((repairEarnings / totalEarnings) * 100) : 0;
  const salesPercentage =
    totalEarnings > 0 ? Math.round((salesEarnings / totalEarnings) * 100) : 0;

  const filteredTransactions = transactions.filter((transaction) =>
    [transaction.date, transaction.type, transaction.shop]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / transactionsPerPage));

  return (
    <div style={{marginTop:"-600px"}} className="min-h-screen font-cairo bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
 

  
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              placeholder="... ابحث في العمليات"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 placeholder:text-right bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-3">
          <FiDollarSign className="text-xl sm:text-2xl" /> الإيرادات
        </h1>
          {/* <div className="relative w-full sm:w-56">
            <select
              ref={timeSelectRef}
              defaultValue={timeRange}
              onChange={() => {}}
              dir="rtl"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
            >
              <option value="day">اليوم</option>
              <option value="week">الأسبوع</option>
              <option value="month">الشهر</option>
              <option value="year">السنة</option>
            </select>
          </div> */}
        </div>
      </div>

  
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
        <div className="p-6 bg-white dark:bg-gray-800 shadow-lg border-l-4 border-indigo-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 text-right">إجمالي الأرباح</h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 text-right">{totalEarnings.toFixed(2)} EGP</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800  shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 text-right">تصليح ({repairPercentage}%)</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 text-right">{repairEarnings.toFixed(2)} EGP</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800  shadow-lg border-l-4 border-yellow-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 text-right">مبيعات ({salesPercentage}%)</h3>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 text-right">{salesEarnings.toFixed(2)} EGP</p>
        </div>
      </div>


      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-right text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">التاريخ</th>
                  <th className="px-4 py-3 font-semibold">نوع الخدمة</th>
                  <th className="px-4 py-3 font-semibold">الجهاز</th>
                  <th className="px-4 py-3 font-semibold">المكان</th>
                  <th className="px-4 py-3 font-semibold">طريقة الدفع</th>
                  <th className="px-4 py-3 font-semibold">الحساب</th>
                  <th className="px-4 py-3 font-semibold">حالة العملية</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-200">
                {currentTransactions.map((txn, index) => (
                  <tr
                    key={txn.id ?? index}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <td className="px-4 py-3">{txn.date}</td>
                    <td className="px-4 py-3 capitalize">{txn.type}</td>
                    <td className="px-4 py-3">{txn.item}</td>
                    <td className="px-4 py-3">{txn.shop}</td>
                    <td className="px-4 py-3">{txn.paymentMethod}</td>
                    <td className="px-4 py-3">{txn.amount.toFixed(2)} EGP</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          txn.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : txn.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {currentTransactions.length === 0 && (
            <div className="p-8 text-center bg-white dark:bg-gray-800">
              <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                لا توجد عمليات
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? "حاول تعديل مصطلحات البحث" : "لا توجد عمليات مالية متاحة"}
              </p>
            </div>
          )}
        </div><br />

        
        <div className="flex items-center justify-between max-w-6xl mx-auto p-4 bg-white dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            عرض {indexOfFirstTransaction + 1} إلى{" "}
            {Math.min(indexOfLastTransaction, filteredTransactions.length)} من{" "}
            {filteredTransactions.length} عملية
          </div>
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
            >
              <FiChevronLeft />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-300 ${
                  currentPage === i + 1
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;