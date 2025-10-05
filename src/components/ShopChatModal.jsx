import React, { useEffect, useState } from "react";
import * as SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { FiX, FiSend, FiXCircle } from "react-icons/fi";

const ShopChatModal = ({ open, onClose }) => {
  const token = localStorage.getItem("authToken");
  const shopProfile = {
    email: localStorage.getItem("email") || "shop@example.com",
    id: localStorage.getItem("shopId") || "shop-123",
  };

  const [stompClient, setStompClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false); 


  useEffect(() => {
    if (open) {
      fetch("http://localhost:8080/api/chats/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(" Shop sessions:", data);
          setSessions(data.content || data || []);
        })
        .catch((err) => console.error(" Error fetching sessions:", err));
    }
  }, [open, token]);


  useEffect(() => {
    if (!activeSession) return;

    const chatId = activeSession.id;
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Shop connected. Subscribing to:", chatId);
        setIsConnected(true); 

        client.subscribe(
          `/user/${shopProfile.email}/queue/chat/messages/${activeSession.id}`,
          (msg) => {
            const body = JSON.parse(msg.body);
            console.log("📩 Received (shop):", body);
            setMessages((prev) => [...prev, body]);
          },
          { Authorization: `Bearer ${token}` }
        );
      },
      onDisconnect: () => {
        console.log(" WebSocket disconnected");
        setIsConnected(false); 
      },
      onStompError: (frame) => {
        console.error(" WebSocket error:", frame);
        setIsConnected(false);
      },
    });

    client.activate();
    setStompClient(client);


    fetch(`http://localhost:8080/api/chats/${chatId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(" Messages API response:", data);
        setMessages(data.content || data || []);
      })
      .catch((err) => console.error(" Error loading messages:", err));

    return () => {
      client.deactivate();
      setIsConnected(false);
    };
  }, [activeSession, token, shopProfile.email]);

  const sendMessage = () => {
    if (!input.trim()) return;
    if (!activeSession) {
      console.warn(" No active session selected");
      return;
    }
    if (!stompClient || !isConnected) {
      console.warn(" WebSocket not connected");
      alert("Cannot send message: WebSocket is not connected. Please try again.");
      return;
    }

    stompClient.publish({
      destination: "/app/chat/send",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        sessionId: activeSession.id,
        content: input,
      }),
    });

    console.log(" Sent (shop):", input);
    setInput(""); 
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
        console.log(" Chat ended:", sessionId);
        setMessages([]);
        setActiveSession(null);
      } else {
        const err = await res.json();
        console.error(" Failed to end chat:", err);
      }
    } catch (err) {
      console.error(" Error ending chat:", err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl h-[600px] rounded-2xl shadow-xl flex flex-col sm:flex-row overflow-hidden transform transition-all duration-300">
        
        <div className="w-full sm:w-80 bg-indigo-600 dark:bg-indigo-900 text-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-indigo-500 dark:border-indigo-700">
            <h2 className="text-lg font-semibold">محادثات العملاء</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-all duration-200"
              aria-label="Close chat modal"
            >
              <FiX className="text-xl" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="text-center py-6 text-gray-300">
                <svg
                  className="w-16 h-16 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>لا توجد محادثات</p>
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    activeSession?.id === s.id
                      ? "bg-indigo-700 dark:bg-indigo-800"
                      : "hover:bg-indigo-500 dark:hover:bg-indigo-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{s.userName}</span>
                    <span className="text-xs text-gray-300">
                      {new Date(s.createdAt).toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-200 truncate">
                    {s.lastMessage?.content || "لا توجد رسائل بعد"}
                  </div>
                </div>
              ))
            )}
          </div>
          {activeSession && (
            <button
              onClick={() => endChat(activeSession.id)}
              className="m-4 px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FiXCircle /> إنهاء المحادثة
            </button>
          )}
        </div>

        
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
          {activeSession ? (
            <>
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`mb-4 flex ${
                      m.senderType === "SHOP"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-sm px-4 py-2 rounded-lg ${
                        m.senderType === "SHOP"
                          ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {m.senderName} •{" "}
                        {new Date(m.createdAt).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div>{m.content}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown} 
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  placeholder="اكتب رسالة..."
                  dir="rtl"
                />
                <button
                  onClick={sendMessage}
                  disabled={!isConnected}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    isConnected
                      ? "bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                      : "bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed"
                  }`}
                >
                  <FiSend />
                  <span className="hidden sm:inline">إرسال</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-lg">اختر محادثة لعرض الرسائل</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopChatModal;