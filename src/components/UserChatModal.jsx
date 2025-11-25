// src/components/ChatModal.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiSend, FiX } from "react-icons/fi";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import Swal from "sweetalert2";
import api from "../api";

const API_BASE = "http://localhost:8080";
const WS_URL = `${API_BASE}/ws`;

const UserChatModal = ({ shopId, shopName, onClose, darkMode }) => {
  const token = localStorage.getItem("authToken");
  const userEmail = localStorage.getItem("email") || "user@example.com";
  const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  const stompClientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch chat sessions
  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await api.get("/api/chats/sessions");
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Failed to load sessions");
    }
  }, []);

  // Start new chat
  const startNewChat = async () => {
    try {
      const { data } = await api.post("/api/chats/start", { shopId });
      const newSession = data.data;
      setActiveSession({ id: newSession.id, shopName: shopName || "Shop" });
      setMessages([]);
      connectWebSocket(newSession.id);
      fetchSessions();
    } catch (err) {
      Swal.fire("Error", "Could not start chat", "error");
    }
  };

  // Connect WebSocket
  const connectWebSocket = useCallback(
    (chatId) => {
      if (!token || !chatId) return;

      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          setConnected(true);

          // Subscribe to messages
          const sub = client.subscribe(
            `/user/${userEmail}/queue/chat/messages/${chatId}`,
            (msg) => {
              const message = JSON.parse(msg.body);
              setMessages((prev) => [...prev, message]);

              // Show unread if not active
              if (activeSession?.id !== chatId) {
                setUnreadCounts((prev) => ({
                  ...prev,
                  [chatId]: (prev[chatId] || 0) + 1,
                }));
              }
            }
          );
          subscriptionRef.current = sub;

          // Load history
          api
            .get(`/api/chats/${chatId}/messages`)
            .then((res) => setMessages(res.data || []))
            .catch(() => setMessages([]));
        },
        onStompError: (frame) => {
          console.error("STOMP error", frame);
          setConnected(false);
        },
        onDisconnect: () => setConnected(false),
      });

      client.activate();
      stompClientRef.current = client;
    },
    [token, userEmail, activeSession]
  );

  // Send message
  const sendMessage = () => {
    if (!input.trim() || !stompClientRef.current || !connected || !activeSession) return;

    const payload = {
      sessionId: activeSession.id,
      content: input.trim(),
    };

    stompClientRef.current.publish({
      destination: "/app/chat/send",
      body: JSON.stringify(payload),
    });

    const outgoingMsg = {
      id: Date.now(),
      content: input.trim(),
      senderName: userProfile.name || userEmail,
      senderType: "USER",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, outgoingMsg]);
    setInput("");
  };

  // Cleanup on close
  const handleClose = () => {
    if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    if (stompClientRef.current) stompClientRef.current.deactivate();
    onClose();
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Connect when active session changes
  useEffect(() => {
    if (activeSession?.id) {
      connectWebSocket(activeSession.id);
      setUnreadCounts((prev) => ({ ...prev, [activeSession.id]: 0 }));
    }
  }, [activeSession, connectWebSocket]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div
        className={`w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden ${
          darkMode ? "bg-gray-800" : "bg-white"
        } border ${darkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        {/* Sessions Sidebar */}
        <div className="w-80 flex flex-col border-r border-gray-200 dark:border-gray-700">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className={`font-bold text-lg ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
              Chats
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-red-500 transition"
              aria-label="Close chat"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sessions.length > 0 ? (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSession(s);
                    setMessages([]);
                  }}
                  className={`p-4 rounded-xl cursor-pointer transition-all relative ${
                    activeSession?.id === s.id
                      ? "bg-lime-100 dark:bg-lime-900"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="font-semibold text-sm">{s.shopName}</div>
                  {s.lastMessage && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                      {s.lastMessage.content}
                    </div>
                  )}
                  {unreadCounts[s.id] > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCounts[s.id]}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 text-sm">No chats yet</p>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={startNewChat}
              className="w-full bg-lime-600 text-white py-3 rounded-xl font-semibold hover:bg-lime-700 transition shadow-md"
            >
              New Chat
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {activeSession ? (
            <>
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className={`font-bold text-lg ${darkMode ? "text-lime-400" : "text-lime-600"}`}>
                  Chat with {activeSession.shopName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  <span className="text-xs text-gray-500">
                    {connected ? "Online" : "Connecting..."}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-900">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500">Start the conversation!</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.senderType === "USER" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm ${
                          m.senderType === "USER"
                            ? "bg-lime-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <p className="text-sm">{m.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 bg-gray-50 dark:bg-gray-900">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className={`flex-1 px-4 py-3 rounded-xl border ${
                    darkMode
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-lime-500`}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || !connected}
                  className="bg-lime-600 text-white p-3 rounded-xl hover:bg-lime-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a chat or start a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserChatModal;