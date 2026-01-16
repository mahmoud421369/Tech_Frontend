import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { 
  FiX, FiSend, FiMessageSquare, FiCheckCircle, FiUser 
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';
import DOMPurify from 'dompurify';
import clsx from 'clsx';

const UserChatModal = memo(({ shopId, shopName: initialShopName, onClose }) => {
  const userProfile = {
    email: localStorage.getItem('email') || 'user@example.com',
    id: localStorage.getItem('userId') || null,
  };

  const [stompClient, setStompClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const loadedSessions = useRef(new Set());

  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

 
  
  const getOrCreateSession = useCallback((shopIdFromMsg, shopNameFromMsg = 'المتجر') => {
    const sid = String(shopIdFromMsg);
    let session = sessions.find(s => s.shopId === sid);

    if (!session) {
      session = {
        shopId: sid,
        shopName: shopNameFromMsg || 'المتجر',
        lastMessage: null,
        unreadCount: 0,
      };
      setSessions(prev => prev.some(s => s.shopId === sid) ? prev : [session, ...prev]);
    } else if (shopNameFromMsg && session.shopName === 'المتجر') {
      setSessions(prev =>
        prev.map(s => s.shopId === sid ? { ...s, shopName: shopNameFromMsg } : s)
      );
    }

    return session;
  }, [sessions]);

  

  const loadMessageHistory = useCallback(async (session) => {
    if (!session || !userProfile.id || loadedSessions.current.has(session.shopId)) return;

    setIsLoadingHistory(true);
    loadedSessions.current.add(session.shopId);

    try {
      const { data } = await api.get(`/api/chats/${userProfile.id}/shop/${session.shopId}/paginated`);
      const raw = data.content || [];

      const formatted = raw.map(msg => ({
        id: msg.id,
        content: msg.message || '',
        senderType: msg.sentBy === 'USER' ? 'USER' : 'SHOP',
        senderName: msg.sentBy === 'USER' ? userProfile.email : (msg.shopName || session.shopName),
        createdAt: msg.createdAt,
        read: msg.read || false,
      })).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      setMessages(formatted);

      try {
        await api.put(`/api/chats/${userProfile.id}/shop/${session.shopId}/mark-read`);
        setSessions(prev =>
          prev.map(s => s.shopId === session.shopId ? { ...s, unreadCount: 0 } : s)
        );
      } catch {}
    } catch (err) {
      console.error(err);
      setMessages([]);
      Swal.fire({ icon: 'error', title: 'خطأ', text: 'تعذر تحميل سجل المحادثة' });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [userProfile.id]);



  const handleIncomingMessage = useCallback((msg) => {
    try {
      const body = JSON.parse(msg.body);

      if (body.type === "TYPING" && body.action === "TYPING_START" && body.senderType === "SHOP") {
        if (activeSession?.shopId === String(body.shopId)) {
          setIsTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2800);
        }
        return;
      }

      if (body.type === "CHAT" && body.action === "SEND" && body.status === "SUCCESS") {
        const p = body.payload;
        const shopIdFromMsg = String(p.senderId || body.shopId || p.shopId);
        const shopNameFromMsg = p.shopName || initialShopName || 'المتجر';

        const newMessage = {
          id: p.id || generateTempId(),
          content: p.message || p.content || '',
          senderType: "SHOP",
          senderName: shopNameFromMsg,
          createdAt: p.createdAt || new Date().toISOString(),
          read: false,
        };

        const session = getOrCreateSession(shopIdFromMsg, shopNameFromMsg);

        setSessions(prev =>
          prev.map(s =>
            s.shopId === shopIdFromMsg
              ? {
                  ...s,
                  shopName: shopNameFromMsg,
                  lastMessage: { message: newMessage.content, sentBy: "SHOP" },
                  unreadCount: activeSession?.shopId === shopIdFromMsg ? 0 : s.unreadCount + 1,
                }
              : s
          )
        );

        if (activeSession?.shopId === shopIdFromMsg) {
          setMessages(prev => prev.some(m => m.id === newMessage.id) ? prev : [...prev, newMessage]);
        }
      }
    } catch (err) {
      console.error('WebSocket parse error:', err);
    }
  }, [activeSession, getOrCreateSession, initialShopName]);

  


  useEffect(() => {
    if (!userProfile.id) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/user/${userProfile.id}/chats`, handleIncomingMessage);
      },
      onDisconnect: () => setIsConnected(false),
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        setIsConnected(false);
      },
    });

    client.activate();
    setStompClient(client);

    return () => client.deactivate();
  }, [userProfile.id, handleIncomingMessage]);

  useEffect(() => {
    if (shopId && userProfile.id) {
      const session = getOrCreateSession(shopId, initialShopName);
      setActiveSession(session);
    }
  }, [shopId, initialShopName, userProfile.id, getOrCreateSession]);

  useEffect(() => {
    activeSession && loadMessageHistory(activeSession);
  }, [activeSession, loadMessageHistory]);

 


  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeSession || !isConnected || !stompClient) return;

    const clean = DOMPurify.sanitize(input.trim());
    const tempId = generateTempId();

    const optimistic = {
      id: tempId,
      content: clean,
      senderType: "USER",
      senderName: userProfile.email,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages(prev => [...prev, optimistic]);

    setSessions(prev =>
      prev.map(s =>
        s.shopId === activeSession.shopId
          ? { ...s, lastMessage: { message: clean, sentBy: "USER" } }
          : s
      )
    );

    stompClient.publish({
      destination: `/app/chat/user/${userProfile.id}/shop/${activeSession.shopId}`,
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify({
        payload: clean,
        senderId: userProfile.id,
        senderType: "USER",
        recipientId: activeSession.shopId,
      }),
    });

    setInput('');
    inputRef.current?.focus();
  }, [input, activeSession, stompClient, isConnected, userProfile]);

  const sendTyping = useCallback(() => {
    if (!stompClient || !isConnected || !activeSession || !input.trim()) return;

    stompClient.publish({
      destination: `/app/chat/${userProfile.id}/${activeSession.shopId}/typing`,
      body: '{}',
    });
  }, [stompClient, isConnected, activeSession, input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!userProfile.id) return null;

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-chat-title"
    >
      <div className="bg-white w-full max-w-4xl h-[86vh] rounded-2xl shadow-2xl overflow-hidden flex border border-gray-200/70">
        
        <div className="w-72 bg-gradient-to-b from-gray-50 to-white border-r flex flex-col">
          <div className="p-4 border-b bg-white/80 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FiMessageSquare className="text-xl text-emerald-600" />
              <h2 id="user-chat-title" className="text-lg font-bold text-gray-800">المحادثات</h2>
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
                <p className="text-sm">لا توجد محادثات بعد</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.shopId}
                  onClick={() => setActiveSession(session)}
                  className={clsx(
                    "p-3 rounded-xl cursor-pointer transition-all duration-200 border",
                    activeSession?.shopId === session.shopId
                      ? "bg-emerald-50 border-emerald-300 shadow-sm"
                      : "hover:bg-gray-50 border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
                      {session.shopName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="font-medium text-gray-900 truncate text-sm">
                          {session.shopName}
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
        </div>

        
        <div className="flex-1 flex flex-col bg-gray-50/40">
          {activeSession ? (
            <>
             
              <div className="bg-white border-b px-5 py-3.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    {activeSession.shopName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <h3 className="font-bold text-gray-900">{activeSession.shopName}</h3>
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
                {isLoadingHistory ? (
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
                    const isUser = msg.senderType === 'USER';
                    return (
                      <div
                        key={msg.id}
                        className={clsx(
                          "flex items-end gap-3 max-w-[80%]",
                          isUser ? "flex-row-reverse ml-auto" : "mr-auto"
                        )}
                      >
                        <div className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                          isUser
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-200 text-gray-700"
                        )}>
                          {msg.senderName?.[0]?.toUpperCase() || '?'}
                        </div>

                        <div className={clsx(
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                          isUser
                            ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-br-none"
                            : "bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-bl-none"
                        )}>
                          <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                          <div className="text-xs opacity-70 mt-1.5 flex items-center gap-1.5 justify-end">
                            {isUser && msg.read && <FiCheckCircle className="text-emerald-200" size={13} />}
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
                      sendTyping();
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
                <p className="text-xl font-medium">اختر متجر لبدء المحادثة</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

UserChatModal.displayName = 'UserChatModal';

export default UserChatModal;