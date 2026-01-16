import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { 
  FiX, FiSend, FiXCircle, FiMessageSquare, FiCheckCircle, FiUser 
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';
import DOMPurify from 'dompurify';
import clsx from 'clsx';

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
  const inputRef = useRef(null);




  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/api/chats/shop/sessions');
      const data = Array.isArray(res.data) ? res.data : res.data.content || [];
      
      setSessions(data.map(s => ({
        id: s.id,
        userId: s.userId,
        userName: s.userName || 'مستخدم',
        shopId: s.shopId,
        shopName: s.shopName || 'المتجر',
        createdAt: s.createdAt,
        lastMessage: s.lastMessage ? {
          id: s.lastMessage.id,
          message: s.lastMessage.message,
          sentBy: s.lastMessage.sentBy,
          createdAt: s.lastMessage.createdAt,
        } : null,
        unreadCount: s.unreadCount || 0,
        active: s.active,
      })));

      fetchTotalUnreadCount();
    } catch (err) {
      console.error('Error fetching sessions:', err);
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل تحميل المحادثات' });
    }
  }, []);

  const fetchTotalUnreadCount = async () => {
    if (!shopProfile.id) return;
    try {
      const { data } = await api.get(`/api/chats/${shopProfile.id}/unread-count`);
      setTotalUnreadCount(data.unreadCount ?? data ?? 0);
    } catch {}
  };




  const fetchMessages = useCallback(async () => {
    if (!activeSession) return;

    setIsLoadingMessages(true);
    try {
      const { data } = await api.get(
        `/api/chats/${activeSession.userId}/shop/${activeSession.shopId}/paginated`
      );

      const msgs = (data.content || []).map(msg => ({
        id: msg.id,
        content: msg.message,
        senderType: msg.sentBy,
        senderName: msg.sentBy === "USER" ? (msg.userName || 'مستخدم') : shopProfile.email,
        createdAt: msg.createdAt,
        read: msg.read || false,
      })).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      setMessages(msgs);

      await api.put(`/api/chats/${activeSession.userId}/shop/${activeSession.shopId}/mark-read`);
      fetchTotalUnreadCount();
    } catch (err) {
      console.error(err);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeSession, shopProfile.email]);

  const closeChatSession = async () => {
    if (!activeSession) return;

    try {
      await api.delete(`/api/chats/${activeSession.userId}/shop/${activeSession.shopId}/close`);
      Swal.fire({ icon: 'success', title: 'تم', text: 'تم إغلاق المحادثة', timer: 1800 });

      setMessages([]);
      setActiveSession(null);
      setSessions(prev => prev.filter(s => s.id !== activeSession.id));
    } catch {
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل إغلاق المحادثة' });
    }
  };

  


  useEffect(() => {
    if (!open) {
      stompClient?.deactivate();
      setIsConnected(false);
      return;
    }

    fetchSessions();

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onStompError: (frame) => {
        console.error('STOMP error', frame);
        setIsConnected(false);
      },
    });

    client.activate();
    setStompClient(client);

    return () => client.deactivate();
  }, [open, fetchSessions]);

  useEffect(() => {
    activeSession && fetchMessages();
  }, [activeSession, fetchMessages]);



  useEffect(() => {
    if (!stompClient || !isConnected || !activeSession) return;

    const topic = `/topic/chat/${activeSession.userId}/${activeSession.shopId}`;

    const sub = stompClient.subscribe(topic, (msg) => {
      const body = JSON.parse(msg.body);

      if (body.type === "TYPING" && body.action === "TYPING_START" && body.senderType === "USER") {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2800);
        return;
      }

      if (body.type === "CHAT" && body.action === "SEND" && body.status === "SUCCESS") {
        const p = body.payload;
        const message = {
          id: p.id,
          content: p.message || p.content,
          senderType: p.sentBy || p.senderType,
          senderName: p.sentBy === "USER" ? (p.userName || 'مستخدم') : shopProfile.email,
          createdAt: p.createdAt || new Date().toISOString(),
          read: p.read || false,
        };

        setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message]);
      }
    });

    subscriptionRef.current = sub;

    return () => {
      sub.unsubscribe();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [stompClient, isConnected, activeSession, shopProfile.email]);

  

  const sendTypingIndicator = useCallback(() => {
    if (!stompClient || !isConnected || !activeSession || !input.trim()) return;
    
    stompClient.publish({
      destination: `/app/chat/${activeSession.userId}/${activeSession.shopId}/typing`,
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: '{}',
    });
  }, [stompClient, isConnected, activeSession, input]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeSession || !isConnected || !stompClient) return;

    const clean = DOMPurify.sanitize(input.trim());

    stompClient.publish({
      destination: `/app/chat/user/${activeSession.userId}/shop/${activeSession.shopId}`,
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify({
        payload: clean,
        senderId: shopProfile.id,
        senderType: "SHOP",
        recipientId: activeSession.userId,
      }),
    });

    setInput('');
    inputRef.current?.focus();
  }, [input, activeSession, stompClient, isConnected, shopProfile.id]);

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
    <div 
      className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-modal-title"
    >
      <div className="bg-white w-full max-w-4xl h-[86vh] rounded-2xl shadow-2xl overflow-hidden flex border border-gray-200/80">
  
        <div className="w-72 bg-gradient-to-b from-gray-50 to-white border-r flex flex-col">
          <div className="p-4 border-b bg-white/80 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FiMessageSquare className="text-xl text-emerald-600" />
              <h2 id="chat-modal-title" className="text-lg font-bold text-gray-800">المحادثات</h2>
              {totalUnreadCount > 0 && (
                <span className="min-w-[1.6rem] h-5 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 flex items-center justify-center">
                  {totalUnreadCount}
                </span>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="إغلاق النافذة"
            >
              <FiX className="text-xl text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-2 scrollbar-thin">
            {sessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <FiMessageSquare size={48} className="opacity-30 mb-3" />
                <p className="text-sm">لا توجد محادثات حالياً</p>
              </div>
            ) : (
              sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => setActiveSession(session)}
                  className={clsx(
                    "p-3 rounded-xl cursor-pointer transition-all duration-200 border",
                    activeSession?.id === session.id
                      ? "bg-emerald-50 border-emerald-300 shadow-sm"
                      : "hover:bg-gray-50 border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
                      {session.userName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="font-medium text-gray-900 truncate text-sm">
                          {session.userName || 'مستخدم'}
                        </h4>
                        {session.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {session.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {session.lastMessage?.message || 'جاهز لبدء المحادثة'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {activeSession && (
            <div className="p-3 border-t bg-white/60">
              <button
                onClick={closeChatSession}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
              >
                <FiXCircle size={16} />
                إغلاق المحادثة
              </button>
            </div>
          )}
        </div>

       
        <div className="flex-1 flex flex-col bg-gray-50/40">
          {activeSession ? (
            <>
          
              <div className="bg-white border-b px-5 py-3.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    {activeSession.userName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{activeSession.userName || 'مستخدم'}</h3>
                  </div>
                </div>

                {isTyping && (
                  <div className="text-sm text-emerald-600 flex items-center gap-2 animate-pulse">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                    يكتب...
                  </div>
                )}
              </div>

          
              <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <FiUser size={64} className="opacity-20 mb-4" />
                    <p className="text-lg font-medium">ابدأ المحادثة الآن!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isShop = msg.senderType === 'SHOP';
                    return (
                      <div
                        key={msg.id}
                        className={clsx(
                          "flex items-end gap-3 max-w-[80%]",
                          isShop ? "flex-row-reverse ml-auto" : "mr-auto"
                        )}
                      >
                        <div className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                          isShop 
                            ? "bg-indigo-100 text-indigo-700" 
                            : "bg-gray-200 text-gray-700"
                        )}>
                          {msg.senderName?.[0]?.toUpperCase() || '?'}
                        </div>

                        <div className={clsx(
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                          isShop
                            ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-none"
                            : "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-bl-none"
                        )}>
                          <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                          <div className="text-xs opacity-70 mt-1.5 flex items-center gap-1.5 justify-end">
                            {isShop && msg.read && <FiCheckCircle className="text-indigo-200" size={13} />}
                            {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

        
              <div className="bg-white border-t p-4 shadow-inner">
                <div className="flex items-center gap-3">
                  <input
                    ref={inputRef}
                    dir="rtl"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      sendTypingIndicator();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 px-5 py-3.5 bg-gray-100 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all text-base"
                    aria-label="حقل كتابة الرسالة"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!isConnected || !input.trim()}
                    className={clsx(
                      "px-6 py-3.5 rounded-2xl font-medium transition-all flex items-center gap-2 shadow-sm",
                      isConnected && input.trim()
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    )}
                    aria-label="إرسال الرسالة"
                  >
                    <FiSend size={18} />
                    إرسال
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FiMessageSquare size={72} className="opacity-15 mb-4 mx-auto" />
                <p className="text-xl font-medium">اختر محادثة لبدء التواصل</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ShopChatModal;