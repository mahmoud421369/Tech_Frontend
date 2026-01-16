import React, { useEffect, useState } from "react";
import ShopChatModal from "../components/ShopChatModal";
import { FiMessageSquare, FiBell, FiClock, FiZap } from "react-icons/fi";

const Chat = () => {
  const [openChat, setOpenChat] = useState(false);
useEffect(() => {
document.title = "إدارة المحادثات";

});
  return (
    <div  style={{ marginTop: "-540px", marginLeft: "-250px" }} className="min-h-screen bg-gray-50 font-cairo py-8">
      <div className="max-w-5xl mx-auto px-6">

        
        <div className="mb-10 bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between text-right gap-5">
            <div className="p-5 bg-lime-100 rounded-2xl">
              <FiMessageSquare className="text-4xl text-lime-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">إدارة المحادثات</h1>
              <p className="text-lg text-gray-600 mt-2">تواصل مع عملائك فورياً – ردود سريعة وإشعارات ذكية</p>
            </div>
          </div>
        </div>

       
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">محادثة فورية</p>
              </div>
              <FiZap className="text-6xl opacity-40 text-lime-600" />
            </div>
          </div>

          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">إشعارات فورية</p>
              </div>
              <FiBell className="text-6xl opacity-40 text-blue-600" />
            </div>
          </div>

          <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">سجل المحادثات</p>
              </div>
              <FiClock className="text-6xl opacity-40 text-purple-600" />
            </div>
          </div>
        </div>

       
        <div className="mb-12 bg-white rounded-3xl shadow-lg border border-gray-200 p-10 text-center">
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-lime-100 rounded-full">
              <FiMessageSquare className="w-16 h-16 text-lime-700" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            ابدأ المحادثة مع عملائك الآن
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10">
            انقر على الزر أدناه لفتح نافذة الدردشة المتكاملة – رد فوري، إشعارات ذكية، وسجل محادثات كامل يحفظ كل رسالة
          </p>
          <button
            onClick={() => setOpenChat(true)}
            className="px-12 py-5 bg-lime-600 hover:bg-lime-700 text-white font-bold text-2xl rounded-2xl shadow-2xl transition flex items-center justify-center gap-4 mx-auto"
          >
            <FiMessageSquare className="text-3xl" />
            فتح المحادثات
          </button>
        </div>

       
        <ShopChatModal open={openChat} onClose={() => setOpenChat(false)} />
      </div>
    </div>
  );
};

export default Chat;