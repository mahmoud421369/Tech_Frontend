
import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Transactions = ({darkMode}) => {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState('month');
  const transactionsPerPage = 4;
  const [searchTerm, setSearchTerm] = useState('');

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  useEffect(() => {

    const transactions = [
       {
      id: 1,
      date: '2023-05-15',
      type: 'sale',
      item: 'iPhone 13 Pro',
      shop: 'Tech Haven',
      paymentMethod:'VISA',
      amount: 999.00,
      status: 'Completed'
    },
    {
      id: 2,
      date: '2023-04-22',
      type: 'repair',
      item: 'MacBook Pro Screen Replacement',
      shop: 'Device Medic',
      paymentMethod:'Instapay',

      amount: 299.00,
      status: 'Completed'
    },
    {
      id: 3,
      date: '2023-03-10',
      type: 'sale',
      item: 'AirPods Pro',
      shop: 'Audio World',
      paymentMethod:'COD',

      amount: 249.00,
      status: 'Out for delivery'
    },
     {
      id: 4,
      date: '2023-03-10',
      type: 'sale',
      item: 'AirPods Pro',
      shop: 'Audio World',
      paymentMethod:'Fawry',

      amount: 249.00,
      status: 'Completed'
    },
     {
      id: 5,
      date: '2023-03-10',
      type: 'repair',
      item: 'AirPods Pro',
      shop: 'Audio World',
      paymentMethod:'Fawry',

      amount: 249.00,
      status: 'In Repair',
  
    }
    ];
    setTransactions(transactions);
  }, [timeRange]);


  const totalEarnings = transactions.reduce((sum, t) => sum + t.amount, 0);
  const repairEarnings = transactions.filter(t => t.type === 'repair').reduce((sum, t) => sum + t.amount, 0);
  const salesEarnings = transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
  const repairPercentage = totalEarnings > 0 ? Math.round((repairEarnings / totalEarnings) * 100) : 0;
  const salesPercentage = totalEarnings > 0 ? Math.round((salesEarnings / totalEarnings) * 100) : 0;


  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);


  const filteredTransactions = transactions.filter(transaction => 
    transaction.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.shop.toLowerCase().includes(searchTerm.toLowerCase())
  );
  

  


  return (
    <div style={{marginTop:"-550px",marginLeft:"300px"}} className="p-6 font-cairo bg-gray-50">
      
          <div className="bg-[#f1f5f9] p-4 m-2 border-l-4 border-blue-600 text-blue-500 text-right">
        <h1 className="text-3xl font-bold text-blue-600">الدخل والايرادات</h1><br />
        <p className="text-gray-400 text-sm font-bold">يمكنك رؤية الدخل الشهري او السنوي لطلبات التصليح والشراء من هنا</p>
      </div><br /><br />

      <div className='flex justify-between gap-6 flex-row-reverse'>

              
              <input
                type="text"
                placeholder="Search repair shops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
          
         

<select
          className="block font-bold w-full  border text-[#6079F6] pl-4 pr-3 py-3 bg-[#ECF0F3] cursor-pointer rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="day">اليوم</option>
          <option value="week"> الاسبوع</option>
          <option value="month"> الشهر</option>
          <option value="year">السنة</option>
        </select><br />

      </div><br /><br />
        
      

  
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow text-right">
          <h3 className="text-lg text-gray-400 font-semibold mb-2">اجمالي الارباح </h3>
          <p className="text-3xl font-bold text-blue-600">{totalEarnings.toFixed(2)} EGP</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-right">
          <h3 className="text-lg text-gray-400 font-semibold mb-2">تصليح ({repairPercentage}%)</h3>
          <p className="text-3xl font-bold text-green-600">{repairEarnings.toFixed(2)} EGP</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-right">
          <h3 className="text-lg text-gray-400 font-semibold mb-2">مبيعات ({salesPercentage}%)</h3>
          <p className="text-3xl font-bold text-yellow-600">{salesEarnings.toFixed(2)} EGP</p>
        </div>
      </div>

    

      <div className="overflow-x-auto bg-white p-5 mx-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#f1f5f9] text-center text-xs font-bold text-blue-600 uppercase tracking-wider">
            <tr>
              <th scope='col' className="px-6 py-3">التأريخ</th>
              <th scope='col' className="px-6 py-3">نوع الخدمة</th>
              <th scope='col' className="px-6 py-3">الجهاز</th>
              <th scope='col' className="px-6 py-3">المكان</th>
              <th scope='col' className="px-6 py-3">طريقة الدفع</th>
              <th scope='col' className="px-6 py-3">الحساب</th>
              <th scope='col' className="px-6 py-3">حالة العملية</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 text-center divide-y divide-gray-200">
            {currentTransactions.map((txn, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-2 font-medium">{txn.date}</td>
                <td className="p-2 font-medium whitespace-nowrap capitalize">{txn.type}</td>
                <td className="p-2 font-medium whitespace-nowrap">{txn.item}</td>
                <td className="p-2 font-medium whitespace-nowrap">{txn.shop}</td>
                <td className="p-2 font-medium whitespace-nowrap">{txn.paymentMethod}</td>
                <td className="p-2 font-medium whitespace-nowrap">{txn.amount.toFixed(2)} EGP</td>
                <td className="p-2 font-medium whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                    txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {txn.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>



   
      
            <div className={`flex items-center justify-between w-auto p-4 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div>
                Showing {indexOfFirstTransaction + 1} to {Math.min(indexOfLastTransaction, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${
                    currentPage === 1 
                      ? 'opacity-50 cursor-not-allowed' 
                      : darkMode 
                        ? 'bg-gray-600 hover:bg-gray-500' 
                        : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  <FiChevronLeft />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-10 h-10 rounded-lg ${
                      currentPage === i + 1
                        ? darkMode 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-600 text-white'
                        : darkMode 
                          ? 'bg-gray-600 hover:bg-gray-500' 
                          : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${
                    currentPage === totalPages 
                      ? 'opacity-50 cursor-not-allowed' 
                      : darkMode 
                        ? 'bg-gray-600 hover:bg-gray-500' 
                        : 'bg-gray-200 hover:bg-gray-300'
                  }`}
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
