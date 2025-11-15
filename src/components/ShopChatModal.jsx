import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { FiX, FiSend, FiXCircle } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';
import api from '../api';
import DOMPurify from 'dompurify';

const ShopChatModal = memo(({ open, onClose }) => {
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
  const subscriptionRef = useRef({ topic: null, queue: null, typing: null });

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    const controller = new AbortController();
    try {
      const res = await api.get('/api/chats/sessions', { signal: controller.signal });
      const data = res.data;
      setSessions((data.content || data || []).map((session) => ({ ...session, unreadCount: 0 })));
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching sessions:', err.response?.data || err.message);
        Swal.fire({
          title: 'خطأ',
          text: 'فشل تحميل المحادثات',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
        });
      }
    }
    return () => controller.abort();
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!activeSession) return;
    setIsLoadingMessages(true);
    const controller = new AbortController();
    try {
      const res = await api.get(`/api/chats/${activeSession.id}/messages`, { signal: controller.signal });
      setMessages(res.data.content || res.data || []);
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, unreadCount: 0 } : s))
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error loading messages:', err.response?.data || err.message);
        Swal.fire({
          title: 'خطأ',
          text: 'فشل تحميل الرسائل',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
        });
      }
    } finally {
      setIsLoadingMessages(false);
    }
    return () => controller.abort();
  }, [activeSession]);

  // Initialize WebSocket
  useEffect(() => {
    if (!open) return;

    fetchSessions();

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Shop WebSocket connected');
        setIsConnected(true);
      },
      onDisconnect: () => {
        console.log('Shop WebSocket disconnected');
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('WebSocket error:', frame);
        setIsConnected(false);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
      setIsConnected(false);
    };
  }, [open, fetchSessions]);

  // Send pending messages on reconnect
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
      });
      setPendingMessages([]);
    }
  }, [isConnected, pendingMessages, stompClient, activeSession, shopProfile.email]);

  // Subscribe to shared topic + private queue + typing
  useEffect(() => {
    if (!stompClient || !isConnected || !activeSession) return;

    const handleIncomingMessage = (msg) => {
      const body = JSON.parse(msg.body);
      console.log('Shop received:', body);

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === body.id);
        if (exists) return prev.map((m) => (m.id === body.id ? body : m));
        return [...prev, body];
      });

      if (activeSession.id !== body.sessionId) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === body.sessionId ? { ...s, unreadCount: (s.unreadCount || 0) + 1 } : s
          )
        );
      } else {
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSession.id ? { ...s, unreadCount: 0 } : s))
        );
      }
    };

    // Shared topic
    const topicSub = stompClient.subscribe(
      `/topic/chat/${activeSession.id}`,
      handleIncomingMessage
    );

    // Private queue
    const queueSub = stompClient.subscribe(
      `/user/${shopProfile.email}/queue/chat/messages/${activeSession.id}`,
      handleIncomingMessage,
      { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    );

    // Typing indicator
    const typingSub = stompClient.subscribe(
      `/user/${shopProfile.email}/queue/chat/typing/${activeSession.id}`,
      () => {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      },
      { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    );

    subscriptionRef.current = { topic: topicSub, queue: queueSub, typing: typingSub };

    fetchMessages();

    return () => {
      Object.values(subscriptionRef.current).forEach(sub => sub?.unsubscribe());
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
    if (!input.trim() || !activeSession) return;

    const message = {
      id: uuidv4(),
      sessionId: activeSession.id,
      content: DOMPurify.sanitize(input),
      senderType: 'SHOP',
      senderName: shopProfile.email,
      createdAt: new Date().toISOString(),
    };

    // Show instantly
    setMessages((prev) => [...prev, message]);
    setInput('');

    if (!stompClient || !isConnected) {
      setPendingMessages((prev) => [...prev, { input, sessionId: activeSession.id }]);
      return;
    }

    stompClient.publish({
      destination: '/app/chat/send',
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify(message),
    });
  }, [input, activeSession, stompClient, isConnected, shopProfile.email]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      sendTypingEvent();
    }
  }, [sendMessage, sendTypingEvent]);

  const endChat = useCallback(async (sessionId) => {
    try {
      await api.post(`/api/chats/${sessionId}/end`);
      setMessages([]);
      setActiveSession(null);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      Swal.fire({
        title: 'تم',
        text: 'تم إنهاء المحادثة',
        icon: 'success',
        toast: true,
        position: 'top-end',
        timer: 1500,
      });
    } catch (err) {
      Swal.fire({
        title: 'خطأ',
        text: 'فشل إنهاء المحادثة',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 1500,
      });
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex overflow-hidden ">
        {/* Sessions List */}
        <div className="w-full sm:w-80 bg-gradient-to-b from-gray-500 to-white flex flex-col border-r border-lime-300">
          <div className="flex items-center justify-between flex-row-reverse p-5 border-b border-lime-400 bg-lime-600">
            <h2 className="text-xl font-bold text-white text-right">محادثات العملاء</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-lime-700 text-white transition">
              <FiX className="text-2xl" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-lime-100">
                <p className="text-lg">لا توجد محادثات</p>
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`p-4 rounded-xl cursor-pointer relative border   transition ${
                    activeSession?.id === s.id ? 'bg-lime-600' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-lime-200 rounded-full flex items-center justify-center text-gray-700 font-bold">
                      {s.userName?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-500 truncate">{s.userName}</span>
                        <span className="text-xs text-gray-500 font-bold">
                          {new Date(s.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm text-black  truncate">
                        {s.lastMessage?.content || 'ابدأ المحادثة'}
                      </div>
                    </div>
                    {s.unreadCount > 0 && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
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
              className="m-4 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 flex items-center justify-center gap-2 transition"
            >
              <FiXCircle /> إنهاء المحادثة
            </button>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {activeSession ? (
            <>
              <div className="text-right bg-gradient-to-r from-lime-500 to-lime-600 text-white p-5 border-b border-lime-400">
                <h3 className="text-xl font-bold">محادثة مع {activeSession.userName}</h3>
                <p className="text-sm flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      متصل
                    </>
                  ) : (
                    'جاري إعادة الاتصال...'
                  )}
                </p>
                {isTyping && (
                  <p className="text-xs animate-pulse mt-1">يكتب...</p>
                )}
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center">
                    <div className="animate-spin h-10 w-10 border-4 border-lime-500 rounded-full border-t-transparent"></div>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-start gap-3 ${m.senderType === 'SHOP' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="w-10 h-10 bg-lime-200 rounded-full flex items-center justify-center text-lime-700 font-bold text-sm">
                        {m.senderName[0]}
                      </div>
                      <div
                        className={`max-w-xs sm:max-w-md px-5 py-3 rounded-3xl shadow-sm ${
                          m.senderType === 'SHOP'
                            ? 'bg-gradient-to-r from-lime-500 to-lime-600 text-white'
                            : 'bg-white text-gray-800 border border-lime-200'
                        }`}
                      >
                        <p className="text-sm font-semibold">{m.senderName}</p>
                        <p className="text-sm">{m.content}</p>
                        <p className="text-xs opacity-70 text-right mt-1">
                          {new Date(m.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 mt-20">ابدأ المحادثة!</p>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-5 border-t flex items-center gap-3 bg-white">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 border border-lime-300 rounded-xl px-5 py-3 bg-lime-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-500 text-right"
                  placeholder="اكتب رسالة..."
                  dir="rtl"
                />
                <button
                  onClick={sendMessage}
                  disabled={!isConnected || !input.trim()}
                  className={`bg-gradient-to-r from-lime-500 to-lime-600 text-white p-3 rounded-xl flex items-center gap-2 transition ${
                    !isConnected || !input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:from-lime-600'
                  }`}
                >
                  <FiSend />
                  <span className="hidden sm:inline">إرسال</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p className="text-lg">اختر محادثة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ShopChatModal;