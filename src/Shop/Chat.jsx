import React, { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import {
  FiSend,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiMessageSquare,
} from "react-icons/fi";



const WS_URL = "http://localhost:8080/ws";
const API_BASE = "http://localhost:8080";

const Chat = () => {
  const token = localStorage.getItem("authToken");
  const [conversations, setConversations] = useState([]); // {chatId, otherId, otherName, unreadCount, lastMessage,...}
  const [selectedConv, setSelectedConv] = useState(null); // conversation object
  const [messages, setMessages] = useState([]); // messages for the selected conversation
  const [msgText, setMsgText] = useState("");
  const [query, setQuery] = useState("");
  const [connecting, setConnecting] = useState(false);
  const stompRef = useRef(null);
  const messagesEndRef = useRef(null);

  // helper to scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  // fetch conversations for shop (sidebar)
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chats/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      // Expecting array. Normalize if backend returns content paged.
      const list = Array.isArray(data) ? data : data.content || [];
      setConversations(list);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load conversations", "error");
    }
  };

  // fetch messages for a conversation (shop/user)
  // your backend endpoint example: GET /api/chats/messages/{userId1}/{userId2}
  // Here we expect conversation object to contain senderId & recipientId OR chatId
  const fetchMessagesFor = async (conv) => {
    if (!conv) return;
    try {
      // if backend expects chatId:
      if (conv.chatId) {
        // adjust if your API path differs
        const res = await fetch(`${API_BASE}/api/chats/messages/${conv.chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.content || []);
      } else if (conv.senderId && conv.recipientId) {
        const res = await fetch(
          `${API_BASE}/api/chats/messages/${conv.senderId}/${conv.recipientId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.content || []);
      } else {
        // fallback: try using chatId-like id field
        const res = await fetch(`${API_BASE}/api/chats/messages/${conv.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : data.content || []);
      }
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load messages", "error");
    }
  };

  // connect to WebSocket / STOMP
  const connectStomp = () => {
    if (!window.SockJS || !window.Stomp) {
      console.error("SockJS / Stomp not loaded. Add CDN scripts to index.html");
      return;
    }

    if (stompRef.current && stompRef.current.connected) return;

    setConnecting(true);
    try {
      const sock = new window.SockJS(WS_URL);
      const client = window.Stomp.over(sock);

      // optionally disable debug logs:
      client.debug = () => {};

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      client.connect(
        headers,
        (frame) => {
          console.log("Connected STOMP:", frame);
          stompRef.current = client;
          setConnecting(false);

          // Subscribe to user queue for personal messages & notifications
          // According to your docs: /user/queue/messages
          client.subscribe(
            "/user/queue/messages",
            (message) => {
              // message.body is stringified JSON
              try {
                const payload = JSON.parse(message.body);
                handleIncoming(payload);
              } catch (e) {
                console.error("Invalid message body", e);
              }
            },
            headers
          );

          // Optionally: subscribe to a general topic for shop notifications
          // client.subscribe('/topic/notifications', (msg) => { ... }, headers);

          // re-fetch conversations on connect
          fetchConversations();
        },
        (err) => {
          console.error("STOMP connection error:", err);
          setConnecting(false);
          // try reconnect with delay
          setTimeout(() => {
            connectStomp();
          }, 3000);
        }
      );
    } catch (e) {
      console.error("connectStomp error", e);
      setConnecting(false);
    }
  };

  // disconnect on cleanup
  const disconnectStomp = () => {
    try {
      if (stompRef.current) {
        stompRef.current.disconnect(() => {
          console.log("STOMP disconnected");
        }, {});
      }
    } catch (e) {
      console.warn("Error disconnecting stomp", e);
    } finally {
      stompRef.current = null;
    }
  };

  // Handle incoming message/notification payload
  const handleIncoming = (payload) => {
    // payload shape documented in your message (could be Notification or Message)
    // If it's a chat message, check if it belongs to the selected conv and append
    const isChatMsg = payload.chatId || payload.content;
    if (isChatMsg) {
      // if current selected conversation matches payload (by chatId or sender/recipient)
      const belongsToSelected =
        (selectedConv && selectedConv.chatId && selectedConv.chatId === payload.chatId) ||
        (selectedConv &&
          ((selectedConv.senderId === payload.senderId && selectedConv.recipientId === payload.recipientId) ||
            (selectedConv.senderId === payload.recipientId && selectedConv.recipientId === payload.senderId)));

      if (belongsToSelected) {
        setMessages((prev) => [...prev, payload]);
        setTimeout(scrollToBottom, 50);
      } else {
        // increase unread count in list (if conversation exists in sidebar)
        setConversations((prev) =>
          prev.map((c) => {
            const match =
              (c.chatId && payload.chatId && c.chatId === payload.chatId) ||
              (c.otherId && (c.otherId === payload.senderId || c.otherId === payload.recipientId));
            if (match) {
              return { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: payload.content };
            }
            return c;
          })
        );
      }
    } else {
      // treat as notification (your Notification schema has id,senderId,senderName)
      // Optionally show a small toast
      console.log("Notification received", payload);
    }
    // Optionally re-fetch conversations to reflect lastMessage ordering
    fetchConversations();
  };

  // send message
  const sendMessage = async () => {
    if (!msgText.trim() || !selectedConv) return;
    const payload = {
      senderId: /* your shop or current user id */ localStorage.getItem("userId"),
      recipientId: selectedConv.otherId || selectedConv.recipientId,
      senderName: /* current user name */ localStorage.getItem("userName") || "Shop",
      recipientName: selectedConv.otherName || selectedConv.recipientName,
      content: msgText.trim(),
    };

    try {
      if (!stompRef.current || !stompRef.current.connected) {
        Swal.fire("Not connected", "Chat connection is not ready. Reconnecting...", "warning");
        connectStomp();
        return;
      }

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      stompRef.current.send("/app/chat.sendMessage", headers, JSON.stringify(payload));

      // Optimistically append message to UI with status RECEIVED
      setMessages((prev) => [
        ...prev,
        {
          id: "local-" + Date.now(),
          chatId: selectedConv.chatId || `${payload.senderId}-${payload.recipientId}`,
          senderId: payload.senderId,
          recipientId: payload.recipientId,
          senderRole: "SHOP_OWNER",
          recipientRole: "GUEST",
          senderName: payload.senderName,
          recipientName: payload.recipientName,
          content: payload.content,
          timestamp: new Date().toISOString(),
          status: "SENT",
        },
      ]);
      setMsgText("");
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Failed to send message", err);
      Swal.fire("Error", "Failed to send message", "error");
    }
  };

  // on selecting a conversation
  const handleSelectConversation = (conv) => {
    setSelectedConv(conv);
    // clear unread locally (could call mark-read API)
    setConversations((prev) => prev.map((c) => (c === conv ? { ...c, unreadCount: 0 } : c)));
    // fetch messages
    fetchMessagesFor(conv);
    // optionally call mark-read endpoint:
    // fetch(${API_BASE}/api/chats/messages/${conv.otherId}/${myId}/mark-read, { method: 'PUT', headers: { Authorization: Bearer ${token}}});
  };

  // search filter for sidebar
  const filteredConversations = conversations.filter((c) =>
    (c.otherName || c.senderName || c.recipientName || "")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  // mount / unmount
  useEffect(() => {
    fetchConversations();
    connectStomp();

    return () => {
      disconnectStomp();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div style={{ marginLeft: 275, marginTop: -460 }} className="min-h-screen p-6 bg-gray-50 font-cairo">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="col-span-1 bg-white rounded-2xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
              <FiMessageSquare /> الدردشات
            </h3>
            <div>
              <small className="text-gray-500">{connecting ? "Connecting..." : "Connected"}</small>
            </div>
          </div>

          <div className="mb-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-gray-100"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredConversations.map((c) => (
              <div
                key={c.chatId || c.otherId || c.id}
                onClick={() => handleSelectConversation(c)}
                className={`p-3 rounded-lg cursor-pointer flex justify-between items-start gap-3 ${
                  selectedConv && (selectedConv.chatId === c.chatId || selectedConv.otherId === c.otherId)
                    ? "bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col text-right">
                  <strong className="text-sm text-gray-800">{c.otherName || c.senderName || c.recipientName}</strong>
                  <span className="text-xs text-gray-500 truncate max-w-[160px]">{c.lastMessage || c.preview || ""}</span>
                </div>
                <div className="flex flex-col items-end">
                  <small className="text-xs text-gray-400">{c.lastTimestamp ? new Date(c.lastTimestamp).toLocaleTimeString() : ""}</small>
                  {c.unreadCount > 0 && (
                    <span className="mt-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{c.unreadCount}</span>
                  )}
                </div>
              </div>
            ))}
            {filteredConversations.length === 0 && <div className="text-center text-gray-400 p-4">No conversations</div>}
          </div>
        </div>

        {/* Chat area */}
        <div className="col-span-3 bg-white rounded-2xl shadow p-4 flex flex-col">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h4 className="text-lg font-semibold">
                {selectedConv ? (selectedConv.otherName || selectedConv.recipientName) : "Select a conversation"}
              </h4>
              <small className="text-gray-400">{selectedConv ? (selectedConv.otherId || selectedConv.chatId) : ""}</small>
            </div>
            <div className="text-sm text-gray-500">{/* actions */}</div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-3">
              {messages.map((m) => {
                const mine = m.senderId === localStorage.getItem("userId");
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`${mine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"} max-w-[70%] px-4 py-2 rounded-lg`}>
                      <div className="text-sm">{m.content}</div>
                      <div className="text-xs text-gray-300 mt-1 text-right">{new Date(m.timestamp || Date.now()).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Composer */}
          <div className="mt-3 border-t pt-3">
            <div className="flex gap-2">
              <textarea
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                rows={2}
                placeholder={selectedConv ? "Type a message..." : "Select a conversation to send messages"}
                className="flex-1 resize-none p-3 rounded-lg border border-gray-200"
                disabled={!selectedConv}
              />
              <button
                onClick={sendMessage}
                disabled={!selectedConv || !msgText.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <FiSend />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;