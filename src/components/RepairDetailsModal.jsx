
import React from 'react';
import { FiX, FiUser, FiBox, FiTool, FiDollarSign } from 'react-icons/fi';

const RepairDetailsModal = ({ repair, onClose }) => {
  if (!repair) return null;
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'received': return 'Received';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 font-cairo">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold font-cairo"> تفاصيل الطلب</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
     
            <div className="bg-[#f1f5f9] p-4 rounded-lg">
              <h3 className="text-lg font-bold text-right mb-4 flex items-center justify-end text-blue-500 ">
                <FiUser className="mr-2" /> تفاصيل العميل
              </h3><hr className='border-gray-200' /><br />
              <div className="space-y-3 text-right">
                <div>
                  <p className="text-sm  mb-3 text-white badge px-3 py-2 rounded-3xl bg-blue-500 inline-block">اسم العميل</p>
                  <p className="font-medium">{repair.customerName}</p>
                </div>
                <div>
                  <p className="text-sm  mb-3 text-white badge px-3 py-2 rounded-3xl bg-blue-500 inline-block">الايميل</p>
                  <p className="font-medium">{repair.contact}</p>
                </div>
              </div>
            </div>
            
            
            <div className="bg-[#f1f5f9] p-4 rounded-lg">
              <h3 className="text-lg font-bold text-right mb-4 flex items-center justify-end text-blue-500">
                <FiBox className="mr-2" /> معلومات الجهاز
              </h3><hr className='border-gray-200' /><br />
              <div className="space-y-3 text-right">
                <div>
                  <p className="text-sm  mb-3 text-white badge px-3 py-2 rounded-3xl bg-blue-500 inline-block">نموذج الجهاز</p>
                  <p className="font-medium">{repair.model || repair.device}</p>
                </div>
                <div>
                  <p className="text-sm  mb-3 text-white badge px-3 py-2 rounded-3xl bg-blue-500 inline-block">الرقم التسلسلي</p>
                  <p className="font-medium">{repair.serialNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm  mb-3 text-white badge px-3 py-2 rounded-3xl bg-blue-500 inline-block">تصنيف الجهاز</p>
                  <p className="font-medium">{repair.category || ''}</p>
                </div>
              </div>


              
            </div>
          </div>
          
       
          <div className="bg-[#f1f5f9] p-4 rounded-lg mb-8 text-center">
            <h3 className="text-lg font-bold mb-4 flex items-center justify-end text-blue-500 ">
              <FiTool className="mr-2" /> تفاصيل التصليح
            </h3><hr className='border-gray-200' /><br />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
              <div>
                <p className="text-sm text-gray-500 mb-3">وصف المشكلة</p>
                <p className="font-medium">{repair.issue}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-3">حالة التصليح</p>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(repair.status)}`}>
                  {getStatusText(repair.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-3">تكلفة التصليح</p>
                <p className="font-medium">{repair.estimatedCost}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-3">الوقت المحدد للتصليح</p>
                <p className="font-medium">{repair.timeline}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-3">تأريخ الاستلام </p>
                <p className="font-medium">{repair.date}</p>
              </div>
            </div>
          </div>


            <div className="bg-[#f1f5f9] p-4 rounded-lg mb-8 text-center">
            <h3 className="text-lg font-bold mb-4 flex items-center justify-end text-blue-500 ">
              <FiDollarSign className="mr-2" /> تفاصيل الدفع
            </h3><hr className='border-gray-200' /><br />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
              <div>
                <p className="text-sm text-gray-500 mb-3">طريقة الدفع</p>
                <p className=" text-indigo-600 font-bold text-sm">{repair.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-3">التوصيل</p>
                <span className={`px-3 py-1 rounded-full text-blue-500 text-sm font-bold`}>
                  {getStatusText(repair.deliveryMethod)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-3"> العنؤان</p>
                <p className="font-bold text-blue-500 text-sm">{repair.deliveryAddress}</p>
              </div>
             
            </div>
          </div>
          
 
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">معلومات اضافية</h3>
            <p className="text-gray-700 whitespace-pre-line">
              {repair.notes || 'No additional notes provided.'}
            </p>
          </div>
        </div>
        
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepairDetailsModal;