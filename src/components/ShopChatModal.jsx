import React, { useEffect, useState } from "react";
import * as SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { FiX, FiSend, FiXCircle } from "react-icons/fi";

const ShopChatModal = ({ open, onClose }) => {
  const token = localStorage.getItem("authToken") ;
  const role = localStorage.getItem("role") ;
  
  const shopProfile = {
    email: localStorage.getItem("email") || "shop@example.com",
    id: localStorage.getItem("shopId") || "shop-123",
  };

  const [stompClient, setStompClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Fetch sessions for this shop
  useEffect(() => {
    if (open) {
      fetch("http://localhost:8080/api/chats/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("📂 Shop sessions:", data);
          setSessions(data.content || data || []);
        })
        .catch((err) => console.error("❌ Error fetching sessions:", err));
    }
  }, [open]);

  // Connect WebSocket when a session is selected
  useEffect(() => {
    if (!activeSession) return;

    const chatId = activeSession.id;
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ Shop connected. Subscribing to:", chatId);

     client.subscribe(
  `/user/${shopProfile.email}/queue/chat/messages/${activeSession.id}`,
  (msg) => {
    const body = JSON.parse(msg.body);
    console.log("📩 Received (shop):", body);

    // backend sends one object, not wrapped in content
    setMessages((prev) => [...prev, body]);
  },
  { Authorization: `Bearer ${token}` }
);
      },
    });

    client.activate();
    setStompClient(client);

    // Load previous messages
   fetch(`http://localhost:8080/api/chats/${chatId}/messages`, {
  headers: { Authorization: `Bearer ${token}` },
})
  .then((res) => res.json())
  .then((data) => {
    console.log("📩 Messages API response:", data);
    setMessages(data.content || data || []); // ✅ pick array from content
  })
  .catch((err) => console.error("❌ Error loading messages:", err));

    return () => {
      client.deactivate();
    };
  }, [activeSession]);

  const sendMessage = () => {
    if (!input.trim() || !activeSession || !stompClient) return;

    stompClient.publish({
      destination: "/app/chat/send",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        sessionId: activeSession.id, // 👈 backend expects this field
        content: input,
      }),
    });

    console.log("📤 Sent (shop):", input);
    setInput("");
  };

  const endChat = async (sessionId) => {
  try {
    const res = await fetch(
      `http://localhost:8080/api/chats/${sessionId}/end`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.ok) {
      console.log("✅ Chat ended:", sessionId);
      setMessages([]); 
      setActiveSession(null); 
    } else {
      const err = await res.json();
      console.error("❌ Failed to end chat:", err);
    }
  } catch (err) {
    console.error("❌ Error ending chat:", err);
  }
};

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-[900px] h-[550px] rounded-xl shadow-lg flex overflow-hidden">
        {/* Sidebar with sessions */}
        <div className="w-72 bg-indigo-700 text-white flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-indigo-600">
            <h2 className="font-bold">User Chats</h2>
            <button onClick={onClose} className="hover:text-red-400">
              <FiX />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
  {sessions.map((s) => (
    <div
      key={s.id}
      onClick={() => setActiveSession(s)}
      className={`p-3 cursor-pointer ${
        activeSession?.id === s.id
          ? "bg-blue-500"
          : "hover:bg-indigo-600"
      }`}
    >
      <div className="font-semibold flex justify-between text-md">{s.userName}
        <p className="text-sm">• {new Date(s.createdAt).toLocaleTimeString()}</p>
      </div>
      <div className="text-sm opacity-80 truncate">
        {s.lastMessage?.content || "No messages yet"}
      </div>
    </div>
  ))}
</div>
  <button
    onClick={() => endChat(activeSession.id)}
    className="bg-white/20  text-white px-3 text-center py-1 rounded flex items-center gap-2"
  >
    <FiXCircle className="text-lg" /> End Chat
  </button>

        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col">
          {activeSession ? (
            <>
<div className="flex-1 p-3 overflow-y-auto">
  {messages.map((m) => (
    <div
      key={m.id}
      className={`mb-3
         ${m.senderType === "SHOP"
          ? "text-left text-indigo-600"
          : "text-right text-gray-700"
        // m.senderId === shopProfile.id
        //   ? "text-right text-indigo-600"
        //   : "text-gray-700"
      }`}
    >
      <div className="text-xs text-gray-400 mb-1">
        {m.senderName} • {new Date(m.createdAt).toLocaleTimeString()}
      </div>
      <div className={`inline-block px-3 py-2 rounded-lg max-w-xs ${
        m.senderType === "SHOP"
          ? "bg-gray-200 text-blue-500"
          : "bg-blue-500 text-white"
      }`}
>
        {m.content}
      </div>
    </div>
  ))}
</div>
              <div className="p-2 border-t flex">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 border rounded-3xl  cursor-pointer text-blue-500 bg-gray-50 px-2 py-2 focus:outline-none focus:ring focus:ring-blue-500 "
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendMessage}
                  className="ml-2 bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                >
                  <FiSend />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a user to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ShopChatModal;