import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { 
  FiX, FiSend, FiXCircle, FiMessageSquare, FiCheckCircle 
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';
import DOMPurify from 'dompurify';

const ShopChatModal = memo(({ open, onClose }) => {
  const shopProfile = {
    email: localStorage.getItem('userEmail') || 'shop@example.com',
    id: localStorage.getItem('id') || null,
  };

  const [stompClient, setStompClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const subscriptionRef = useRef(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/api/chats/shop/sessions');
      const sessionsArray = Array.isArray(res.data) ? res.data : res.data.content || [];

      setSessions(sessionsArray.map(session => ({
        id: session.id,
        userId: session.userId,
        userName: session.userName || 'مستخدم',
        shopId: session.shopId,
        shopName: session.shopName || 'المتجر',
        createdAt: session.createdAt,
        lastMessage: session.lastMessage ? {
          id: session.lastMessage.id,
          message: session.lastMessage.message,
          sentBy: session.lastMessage.sentBy,
          createdAt: session.lastMessage.createdAt,
        } : null,
        unreadCount: session.unreadCount || 0,
        active: session.active,
      })));

      fetchTotalUnreadCount();
    } catch (err) {
      console.error('Error fetching sessions:', err);
      Swal.fire('خطأ', 'فشل تحميل المحادثات', 'error');
    }
  }, []);

  const fetchTotalUnreadCount = async () => {
    if (!shopProfile.id) return;
    try {
      const res = await api.get(`/api/chats/${shopProfile.id}/unread-count`);
      setTotalUnreadCount(res.data.unreadCount || res.data || 0);
    } catch (err) {
      console.error('Failed to fetch unread count');
    }
  };

  const fetchMessages = useCallback(async () => {
    if (!activeSession) return;

    setIsLoadingMessages(true);

    try {
      const res = await api.get(`/api/chats/${activeSession.userId}/shop/${activeSession.shopId}/paginated`);
      const messagesArray = res.data.content || [];

      const formattedMessages = messagesArray.map(msg => ({
        id: msg.id,
        content: msg.message,
        senderType: msg.sentBy,
        senderName: msg.sentBy === "USER" ? (msg.userName || 'مستخدم') : shopProfile.email,
        createdAt: msg.createdAt,
        read: msg.read || false,
      }));

      const sorted = formattedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(sorted);

     
      await api.put(`/api/chats/${activeSession.userId}/shop/${activeSession.shopId}/mark-read`);
      fetchTotalUnreadCount();
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeSession, shopProfile.email]);

  const closeChatSession = async () => {
    if (!activeSession) return;

    try {
      await api.delete(`/api/chats/${activeSession.userId}/shop/${activeSession.shopId}/close`);
      Swal.fire('تم', 'تم إغلاق المحادثة', 'success');

      setMessages([]);
      setActiveSession(null);
      setSessions(prev => prev.filter(s => s.id !== activeSession.id));
    } catch (err) {
      Swal.fire('خطأ', 'فشل إغلاق المحادثة', 'error');
    }
  };

  useEffect(() => {
    if (!open) {
      if (stompClient) stompClient.deactivate();
      setIsConnected(false);
      return;
    }

    fetchSessions();

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Shop WebSocket connected');
        setIsConnected(true);
      },
      onDisconnect: () => setIsConnected(false),
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

  useEffect(() => {
    if (activeSession) {
      fetchMessages();
    }
  }, [activeSession, fetchMessages]);

  useEffect(() => {
    if (!stompClient || !isConnected || !activeSession) return;

    const handleIncomingMessage = (msg) => {
      const body = JSON.parse(msg.body);

      if (body.type === "TYPING" && body.action === "TYPING_START" && body.senderType === "USER") {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        return;
      }

      if (body.type === "CHAT" && body.action === "SEND" && body.status === "SUCCESS") {
        const payload = body.payload;

        const message = {
          id: payload.id,
          content: payload.message || payload.content,
          senderType: payload.sentBy || payload.senderType,
          senderName: payload.sentBy === "USER" ? (payload.userName || 'مستخدم') : shopProfile.email,
          createdAt: payload.createdAt || new Date().toISOString(),
          read: payload.read || false,
        };

        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };

    const topic = `/topic/chat/${activeSession.userId}/${activeSession.shopId}`;
    const subscription = stompClient.subscribe(topic, handleIncomingMessage);
    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [stompClient, isConnected, activeSession, shopProfile.email]);

  const sendTypingIndicator = useCallback(() => {
    if (!stompClient || !isConnected || !activeSession || !input.trim()) return;

    stompClient.publish({
      destination: `/app/chat/${activeSession.userId}/${activeSession.shopId}/typing`,
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify({}),
    });
  }, [stompClient, isConnected, activeSession, input]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeSession || !isConnected || !stompClient) {
      Swal.fire('تحذير', 'لا يمكن إرسال الرسالة حالياً', 'warning');
      return;
    }

    const sanitizedInput = DOMPurify.sanitize(input.trim());

    stompClient.publish({
      destination: `/app/chat/user/${activeSession.userId}/shop/${activeSession.shopId}`,
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify({
        payload: sanitizedInput,
        senderId: shopProfile.id,
        senderType: "SHOP",
        recipientId: activeSession.userId,
      }),
    });

    setInput('');
  }, [input, activeSession, stompClient, isConnected, shopProfile.id]);





  const handleInputChange = (e) => {
    setInput(e.target.value);
    sendTypingIndicator();
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex overflow-hidden">
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b bg-white flex items-center justify-between flex-row-reverse">
            <div className="flex items-center gap-3">
              <FiMessageSquare className="text-xl text-lime-600" />
              <h2 className="text-lg font-bold">المحادثات</h2>
              {totalUnreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                  {totalUnreadCount}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <FiX className="text-lg" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FiMessageSquare className="w-12 h-12 mx-auto opacity-30 mb-3" />
                <p className="text-sm">لا توجد محادثات</p>
              </div>
            ) : (
              sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`p-3 rounded-xl cursor-pointer transition-all hover:shadow border ${
                    activeSession?.id === s.id
                      ? 'bg-lime-50 border-lime-400 shadow'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-lime-100 rounded-full flex items-center justify-center text-lime-700 font-bold text-sm">
                      {s.userName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{s.userName || 'مستخدم'}</h4>
                        {s.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {s.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-1">
                        {s.lastMessage?.message || 'ابدأ المحادثة'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {activeSession && (
            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={closeChatSession}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl text-sm font-medium transition flex items-center justify-center gap-2"
              >
                <FiXCircle className="text-base" />
                إغلاق المحادثة
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col bg-gray-50">
          {activeSession ? (
            <>
              <div className="bg-white border-b px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-lime-100 rounded-full flex items-center justify-center text-lime-700 font-bold text-lg">
                    {activeSession.userName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{activeSession.userName || 'مستخدم'}</h3>
                  </div>
                </div>

                {isTyping && (
                  <div className="text-sm text-lime-600 flex items-center gap-2 animate-pulse">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                    </div>
                    يكتب...
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-16">
                    <div className="w-10 h-10 border-4 border-lime-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <FiMessageSquare className="w-16 h-16 mx-auto opacity-20 mb-4" />
                    <p className="text-base">ابدأ المحادثة!</p>
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`flex items-start gap-3 ${m.senderType === 'SHOP' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm ${
                        m.senderType === 'SHOP' ? 'bg-white text-indigo-600 border' : 'bg-gray-500 bg-white border text-gray-600'
                      }`}>
                        {m.senderName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className={`max-w-xl ${m.senderType === 'SHOP' ? 'text-right' : ''}`}>
                        <div className={`  w-40 p-3 rounded-2xl shadow ${
                          m.senderType === 'SHOP'
                            ? 'bg-indigo-600 text-white border-4 border-indigo-500'
                            : 'bg-emerald-600 text-white border-4 border-emerald-500'
                        }`}>
                          <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: m.content }} />
                          <p className="text-xs opacity-70 mt-2 flex items-center gap-1 justify-end">
                            {m.senderType === 'SHOP' && m.read && <FiCheckCircle className="text-gray-300 text-xs" />}
                            {new Date(m.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-white border-t p-4">
                <div className="flex items-center gap-3">
                  <input
                    dir="rtl"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 px-5 py-3 border cursor-pointer border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-100 focus:border-lime-500 bg-gray-50 text-base"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!isConnected || !input.trim()}
                    className={`px-6 py-3 rounded-2xl font-medium transition flex items-center gap-2 ${
                      isConnected && input.trim()
                        ? 'bg-lime-600 hover:bg-lime-700 text-white shadow'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FiSend className="text-lg" />
                    إرسال
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FiMessageSquare className="w-20 h-20 mx-auto opacity-20 mb-4" />
                <p className="text-lg">اختر محادثة</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ShopChatModal;