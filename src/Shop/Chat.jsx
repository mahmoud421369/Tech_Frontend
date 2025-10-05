import React, { useState } from "react";
import ShopChatModal from "../components/ShopChatModal";
import { FiMessageSquare } from "react-icons/fi";
const  Chat = () => {
  const [openChat, setOpenChat] = useState(false);

  return (
    <div style={{ marginTop: "-550px", marginLeft: "270px" }} className="p-6 bg-white font-cairo flex justify-center items-center dark:bg-gray-950 dark:border-gray-700 max-w-4xl border ">

      <button
        onClick={() => setOpenChat(true)}
        className=" text-indigo-500 text-2xl justify-center text-center flex items-center  gap-2 px-4 py-2 rounded"
      >
      <FiMessageSquare/>  المحادثات
      </button>

      <ShopChatModal open={openChat} onClose={() => setOpenChat(false)} />
    </div>
  );
}
export default Chat;