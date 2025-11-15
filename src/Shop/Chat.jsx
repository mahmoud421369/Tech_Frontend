import React, { useState } from "react";
import ShopChatModal from "../components/ShopChatModal";
import { FiMessageSquare, FiBell, FiClock, FiZap } from "react-icons/fi";

const Chat = () => {
  const [openChat, setOpenChat] = useState(false);

  return (
    <div style={{marginTop:"-575px",marginLeft:"-25px"}} className="min-h-screen max-w-6xl mx-auto p-4 lg:p-8 font-cairo bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8 border border-gray-200">
        {/* Header */}
        <div className="mb-8 text-right">
          <h1 className="text-3xl font-bold text-black mb-2 flex items-center justify-end gap-3">
            <FiMessageSquare className="text-gray-500" />
            إدارة المحادثات
          </h1>
          <p className="text-sm text-gray-600">تواصل مع عملائك بسهولة وسرعة</p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1: Real-time */}
          <div className="bg-gradient-to-br from-lime-50 to-white p-6 rounded-xl border  shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-end gap-3 mb-3">
              <div className="p-2 bg-lime-100 rounded-lg group-hover:bg-lime-200 transition">
                <FiZap className="w-6 h-6 text-lime-700" />
              </div>
              <h3 className="text-lg font-bold text-black">محادثة فورية</h3>
            </div>
            <p className="text-sm text-gray-600 text-right">
              تواصل مع العملاء لحظة بلحظة، ردود سريعة وفعّالة.
            </p>
          </div>

          {/* Card 2: Notifications */}
          <div className="bg-gradient-to-br from-lime-50 to-white p-6 rounded-xl border  shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-end gap-3 mb-3">
              <div className="p-2 bg-lime-100 rounded-lg group-hover:bg-lime-200 transition">
                <FiBell className="w-6 h-6 text-lime-700" />
              </div>
              <h3 className="text-lg font-bold text-black">إشعارات فورية</h3>
            </div>
            <p className="text-sm text-gray-600 text-right">
              لا تفوت أي رسالة، إشعارات فورية عند وصول طلب جديد.
            </p>
          </div>

          {/* Card 3: History */}
          <div className="bg-gradient-to-br from-lime-50 to-white p-6 rounded-xl border  shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-end gap-3 mb-3">
              <div className="p-2 bg-lime-100 rounded-lg group-hover:bg-lime-200 transition">
                <FiClock className="w-6 h-6 text-lime-700" />
              </div>
              <h3 className="text-lg font-bold text-black">سجل المحادثات</h3>
            </div>
            <p className="text-sm text-gray-600 text-right">
              راجع جميع المحادثات السابقة بسهولة وسرعة.
            </p>
          </div>
        </div>

        {/* Open Chat Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setOpenChat(true)}
            className="flex items-center gap-2 px-8 py-3 bg-lime-500 text-white font-bold rounded-lg hover:bg-lime-600 transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2"
          >
            <FiMessageSquare className="text-xl" />
            فتح المحادثات
          </button>
        </div>
      </div>

      {/* Chat Modal */}
      <ShopChatModal open={openChat} onClose={() => setOpenChat(false)} />
    </div>
  );
};

export default Chat;