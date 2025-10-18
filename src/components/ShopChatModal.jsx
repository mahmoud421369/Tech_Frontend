import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { FiX, FiSend, FiXCircle } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';
import api from '../api';
import DOMPurify from 'dompurify';

const ShopChatModal = memo(({ open, onClose, darkMode }) => {
  const shopProfile = {
    email: localStorage.getItem('email') || 'shop',
    id: localStorage.getItem('shopId') || 'shop-123',
  };

  const [stompClient, setStompClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    const controller = new AbortController();
    try {
      const res = await api.get('/api/chats/sessions', {
        signal: controller.signal,
      });
      const data = res.data;
      console.log('Shop sessions:', data);
      setSessions((data.content || data || []).map((session) => ({ ...session, unreadCount: 0 })));
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('❌ Error fetching sessions:', err.response?.data || err.message);
        Swal.fire({
          title: 'Error',
          text: 'Could not load chat sessions',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    }
    return () => controller.abort();
  }, [darkMode]);

  // Fetch messages for active session
  const fetchMessages = useCallback(async () => {
    if (!activeSession) return;

    setIsLoadingMessages(true);
    const controller = new AbortController();
    try {
      const res = await api.get(`/api/chats/${activeSession.id}/messages`, {
        signal: controller.signal,
      });
      const data = res.data;
      console.log('Messages API response:', data);
      setMessages(data.content || data || []);
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, unreadCount: 0 } : s))
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('❌ Error loading messages:', err.response?.data || err.message);
        Swal.fire({
          title: 'Error',
          text: 'Could not load messages',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    } finally {
      setIsLoadingMessages(false);
    }
    return () => controller.abort();
  }, [activeSession, darkMode]);

  // Initialize WebSocket
  useEffect(() => {
    if (!open) return;

    fetchSessions();

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('WebSocket error:', frame);
        setIsConnected(false);
        Swal.fire({
          title: 'Error',
          text: 'WebSocket connection failed',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
      setIsConnected(false);
    };
  }, [open, fetchSessions, darkMode]);

  // Handle pending messages on reconnect
  useEffect(() => {
    if (isConnected && pendingMessages.length > 0 && stompClient && activeSession) {
      pendingMessages.forEach(({ input, sessionId }) => {
        const message = {
          id: uuidv4(),
          sessionId,
          content: DOMPurify.sanitize(input),
          senderType: 'SHOP',
          senderName: shopProfile.email,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, message]);
        stompClient.publish({
          destination: '/app/chat/send',
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          body: JSON.stringify(message),
        });
        console.log('📤 Sent pending (shop):', message);
      });
      setPendingMessages([]);
    }
  }, [isConnected, pendingMessages, stompClient, activeSession, shopProfile.email]);

  // Subscribe to WebSocket messages and typing events
  useEffect(() => {
    if (!stompClient || !isConnected || !activeSession) return;

    const messageSubscription = stompClient.subscribe(
      `/user/${shopProfile.email}/queue/chat/messages/${activeSession.id}`,
      (msg) => {
        const body = JSON.parse(msg.body);
        console.log('📩 Received (shop):', body);
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === body.id);
          if (exists) return prev.map((m) => (m.id === body.id ? body : m));
          return [...prev, body];
        });
        if (activeSession?.id !== body.sessionId) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === body.sessionId ? { ...s, unreadCount: (s.unreadCount || 0) + 1 } : s
            )
          );
        }
      },
      { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    );

    const typingSubscription = stompClient.subscribe(
      `/user/${shopProfile.email}/queue/chat/typing/${activeSession.id}`,
      (msg) => {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      },
      { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    );

    fetchMessages();

    return () => {
      messageSubscription?.unsubscribe();
      typingSubscription?.unsubscribe();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [stompClient, isConnected, activeSession, shopProfile.email, fetchMessages]);

  // Send typing event
  const sendTypingEvent = useCallback(() => {
    if (stompClient && isConnected && activeSession) {
      stompClient.publish({
        destination: '/app/chat/typing',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ sessionId: activeSession.id, senderType: 'SHOP' }),
      });
    }
  }, [stompClient, isConnected, activeSession]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    if (!activeSession) {
      Swal.fire({
        title: 'Warning',
        text: 'No active session selected',
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      return;
    }
    if (!stompClient || !isConnected) {
      setPendingMessages((prev) => [...prev, { input, sessionId: activeSession.id }]);
      Swal.fire({
        title: 'Warning',
        text: 'Message will be sent when reconnected',
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      return;
    }

    const message = {
      id: uuidv4(),
      sessionId: activeSession.id,
      content: DOMPurify.sanitize(input),
      senderType: 'SHOP',
      senderName: shopProfile.email,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, message]);
    setInput('');

    stompClient.publish({
      destination: '/app/chat/send',
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify(message),
    });

    console.log('📤 Sent (shop):', message);
  }, [input, activeSession, stompClient, isConnected, shopProfile.email, darkMode]);

  // Handle Enter key for sending
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      } else {
        sendTypingEvent();
      }
    },
    [sendMessage, sendTypingEvent]
  );

  // End chat session
  const endChat = useCallback(
    async (sessionId) => {
      try {
        await api.post(`/api/chats/${sessionId}/end`);
        console.log('Chat ended:', sessionId);
        setMessages([]);
        setActiveSession(null);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        Swal.fire({
          title: 'Success',
          text: 'Chat session ended',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      } catch (err) {
        console.error('❌ Error ending chat:', err.response?.data || err.message);
        Swal.fire({
          title: 'Error',
          text: 'Failed to end chat session',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
    },
    [darkMode]
  );

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden border border-indigo-200 dark:border-indigo-700 transform transition-all duration-300 scale-95 sm:scale-100">
        <div className="w-full sm:w-80 bg-gradient-to-b from-indigo-600 to-blue-600 dark:from-indigo-900 dark:to-blue-900 flex flex-col border-r border-indigo-300 dark:border-indigo-700">
          <div className="flex items-center justify-between p-5 border-b border-indigo-500 dark:border-indigo-800 bg-indigo-700 dark:bg-indigo-800">
            <h2 className="text-xl font-bold text-white">محادثات العملاء</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-indigo-800 dark:hover:bg-indigo-900 text-white hover:text-red-400 transition-all duration-200 transform hover:scale-110"
              aria-label="Close chat modal"
            >
              <FiX className="text-2xl" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-300 dark:text-gray-400">
                <svg
                  className="w-16 h-16 mx-auto mb-2 text-indigo-300"
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
                <p className="text-lg font-medium">لا توجد محادثات</p>
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-300 relative border border-indigo-400 dark:border-indigo-600 hover:bg-indigo-500 dark:hover:bg-indigo-700 transform hover:-translate-y-1 shadow-md ${
                    activeSession?.id === s.id
                      ? 'bg-indigo-600 dark:bg-indigo-800 shadow-lg'
                      : 'bg-indigo-400 dark:bg-indigo-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-200 dark:bg-indigo-700 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-lg">
                      {s.userName?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-white truncate">{s.userName}</span>
                        <span className="text-xs text-gray-200 dark:text-gray-300">
                          {new Date(s.createdAt).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-sm text-gray-200 dark:text-gray-300 truncate">
                        {s.lastMessage?.content || 'لا توجد رسائل بعد'}
                      </div>
                    </div>
                    {s.unreadCount > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 animate-pulse">
                        {s.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {activeSession && (
            <button
              onClick={() => endChat(activeSession.id)}
              className="m-4 px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-xl hover:bg-red-600 dark:hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <FiXCircle className="text-lg" /> إنهاء المحادثة
            </button>
          )}
        </div>
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-800">
          {activeSession ? (
            <>
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-800 dark:to-blue-800 text-white p-5 border-b border-indigo-300 dark:border-indigo-700 shadow-md">
                <h3 className="text-xl font-bold">محادثة مع {activeSession.userName}</h3>
                <p className="text-sm opacity-90">
                  {isConnected ? 'متصل' : 'جاري إعادة الاتصال...'}
                </p>
                {isTyping && (
                  <p className="text-xs text-indigo-200 animate-pulse">يكتب...</p>
                )}
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 relative">
                {isLoadingMessages ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="animate-spin h-12 w-12 text-indigo-500"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-start gap-3 mb-4 animate-fade-in ${
                        m.senderType === 'SHOP' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className="w-10 h-10 bg-indigo-200 dark:bg-indigo-700 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm">
                        {m.senderName?.[0] || 'U'}
                      </div>
                      <div
                        className={`max-w-xs sm:max-w-md px-5 py-3 rounded-3xl shadow-md transition-all duration-200 ${
                          m.senderType === 'SHOP'
                            ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-indigo-100 dark:border-indigo-600'
                        }`}
                      >
                        <p className="text-sm font-semibold mb-1">{m.senderName || 'مجهول'}</p>
                        <p className="text-base">{m.content}</p>
                        <p className="text-xs opacity-70 mt-1 text-right">
                          {new Date(m.createdAt).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 mt-20 text-lg">
                    ابدأ المحادثة بالقول مرحبًا! 👋
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-5 border-t border-indigo-200 dark:border-indigo-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 border border-indigo-300 dark:border-indigo-600 rounded-xl px-5 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 placeholder-indigo-400 dir-rtl"
                  placeholder="اكتب رسالة..."
                  dir="rtl"
                />
                <button
                  onClick={sendMessage}
                  disabled={!isConnected && !input.trim()}
                  className={`bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center gap-2 ${
                    !isConnected || !input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:from-indigo-700 hover:to-blue-700'
                  }`}
                >
                  <FiSend className="text-xl" />
                  <span className="hidden sm:inline">إرسال</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center animate-fade-in">
                <svg
                  className="w-16 h-16 mx-auto mb-2 text-indigo-400"
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
                <p className="text-lg font-medium">اختر محادثة لعرض الرسائل</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ShopChatModal;