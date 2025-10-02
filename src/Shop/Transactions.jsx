import React, { useState, useEffect, useRef } from "react";
import { FiChevronLeft, FiChevronRight, FiDollarSign } from "react-icons/fi";

const Transactions = ({ darkMode }) => {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [financialReport, setFinancialReport] = useState(null);
  const transactionsPerPage = 4;


  const timeSelectRef = useRef(null);

  const handlePageChange = (page) => {
    if (page < 1) return;
    setCurrentPage(page);
  };

 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const reportRes = await fetch(
          "http://localhost:8080/api/shops/payments/financial-report"
        );
        const reportData = await reportRes.json();
        setFinancialReport(reportData.content);

        const repairRes = await fetch(
          "http://localhost:8080/api/shops/payments/repairs"
        );
        const repairData = await repairRes.json();

        const orderRes = await fetch(
          "http://localhost:8080/api/shops/payments/orders"
        );
        const orderData = await orderRes.json();

        const allTransactions = [...repairData, ...orderData].map((t, idx) => ({
          id: t.id ?? idx,
          date: t.date,
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
      theme: "bootstrap4",
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
      } catch (e) {
        
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


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
    <div
      style={{ marginTop: "-550px", marginLeft: "300px" }}
      className={`p-6 font-cairo ${darkMode ? "bg-gray-900" : "bg-[#f1f5f9]"}`}
    >
          
           <div className="bg-white border p-4 rounded-2xl text-right mb-4">
                         <h1 className="text-3xl font-bold text-blue-500 flex items-center flex-row-reverse justify-start gap-2"><FiDollarSign/>الايرادات </h1>
                     
                       </div>
     

      <div className="flex justify-between gap-6 flex-row-reverse mt-6">
        <input
          type="text"
          placeholder="ابحث عن الطلبات"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10 block w-full rounded-xl cursor-pointer placeholder:text-right border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        <select
          ref={timeSelectRef}
          defaultValue={timeRange}
        
          onChange={() => {}}
          dir="rtl"
          className="block font-bold w-full border-4 border-gray-400 text-blue-600 pl-4 pr-3 py-3 bg-white cursor-pointer rounded-xl outline-none transition"
          style={{ minWidth: 160 }}
        >
          <option value="day">اليوم</option>
          <option value="week">الاسبوع</option>
          <option value="month">الشهر</option>
          <option value="year">السنة</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        <div className="bg-white p-6 rounded-lg shadow text-right">
          <h3 className="text-lg text-gray-500 font-semibold mb-2">اجمالي الارباح</h3>
          <p className="text-3xl font-bold text-blue-600">{totalEarnings.toFixed(2)} EGP</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-right">
          <h3 className="text-lg text-gray-500 font-semibold mb-2">تصليح ({repairPercentage}%)</h3>
          <p className="text-3xl font-bold text-green-600">{repairEarnings.toFixed(2)} EGP</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-right">
          <h3 className="text-lg text-gray-500 font-semibold mb-2">مبيعات ({salesPercentage}%)</h3>
          <p className="text-3xl font-bold text-yellow-600">{salesEarnings.toFixed(2)} EGP</p>
        </div>
      </div>

      <div className="overflow-x-auto bg-white p-5 mx-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#f1f5f9] text-center text-xs font-bold text-blue-600 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">التأريخ</th>
              <th className="px-6 py-3">نوع الخدمة</th>
              <th className="px-6 py-3">الجهاز</th>
              <th className="px-6 py-3">المكان</th>
              <th className="px-6 py-3">طريقة الدفع</th>
              <th className="px-6 py-3">الحساب</th>
              <th className="px-6 py-3">حالة العملية</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 text-center divide-y divide-gray-200">
            {currentTransactions.map((txn, index) => (
              <tr key={txn.id ?? index} className="hover:bg-[#f1f5f9]">
                <td className="p-2 font-medium">{txn.date}</td>
                <td className="p-2 font-medium whitespace-nowrap capitalize">{txn.type}</td>
                <td className="p-2 font-medium whitespace-nowrap">{txn.item}</td>
                <td className="p-2 font-medium whitespace-nowrap">{txn.shop}</td>
                <td className="p-2 font-medium whitespace-nowrap">{txn.paymentMethod}</td>
                <td className="p-2 font-medium whitespace-nowrap">{txn.amount.toFixed(2)} EGP</td>
                <td className="p-2 font-medium whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    txn.status === "completed" ? "bg-green-100 text-green-800" :
                    txn.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {txn.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={`flex items-center justify-between w-auto p-4 ${darkMode ? "bg-gray-700 text-white" : "bg-[#f1f5f9]"}`}>
          <div>
            عرض {indexOfFirstTransaction + 1} إلى {Math.min(indexOfLastTransaction, filteredTransactions.length)} من {filteredTransactions.length} عملية
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : darkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-200 hover:bg-gray-300"}`}
            >
              <FiChevronLeft />
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`w-10 h-10 rounded-lg ${currentPage === i + 1 ? "bg-blue-600 text-white" : darkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-200 hover:bg-gray-300"}`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : darkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-200 hover:bg-gray-300"}`}
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