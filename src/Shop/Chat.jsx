import React, { useState } from "react";
import ShopChatModal from "../components/ShopChatModal";
import { FiMessageSquare } from "react-icons/fi";

const Chat = () => {
  const [openChat, setOpenChat] = useState(false);

  return (
    <div style={{marginTop:"-700px"}} className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gray-100 dark:bg-gray-950 transition-all duration-300 font-cairo">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold font-cairo text-gray-800 dark:text-gray-200">
            إدارة المحادثات
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            تواصل مع عملائك بسهولة وسرعة
          </p>
        </div>

        {/* Chat Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setOpenChat(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-lg font-cairo rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <FiMessageSquare className="text-xl" />
            فتح المحادثات
          </button>
        </div>

        {/* Chat Modal */}
        <ShopChatModal open={openChat} onClose={() => setOpenChat(false)} />
      </div>
    </div>
  );
};

export default Chat;