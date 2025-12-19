import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { 
  FiX, FiSend, FiMessageSquare, FiClock, FiUser, FiCheckCircle 
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';
import api from '../api';
import DOMPurify from 'dompurify';

const PAGE_SIZE = 20;

const UserChatModal = memo(({ shopId, shopName, onClose }) => {
  const userProfile = {
    email: localStorage.getItem('email') || 'user@example.com',
    id: localStorage.getItem('userId') || 'user-123',
  };

  const [stompClient, setStompClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(0);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const subscriptionRef = useRef(null);

  
  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/api/chats/my/sessions');
      const data = res.data.content || res.data || [];
      setSessions(data.map(s => ({ ...s, unreadCount: s.unreadCount || 0 })));
    } catch (err) {
      console.error('Failed to load sessions:', err);
      Swal.fire('خطأ', 'فشل تحميل المحادثات', 'error', { toast: true, position: 'top-end', timer: 1500 });
    }
  }, []);

 
  const fetchMessages = useCallback(async (loadMore = false) => {
    if (!activeSession || !userProfile.id) return;

    if (!loadMore) {
      setIsLoadingMessages(true);
      setPage(0);
      setHasMoreMessages(true);
    }

    try {
      const res = await api.get(`/api/chats/${userProfile.id}/shop/${activeSession.shopId}/paginated`);

      const newMessages = res.data.content || [];
      // if (newMessages.length < PAGE_SIZE) setHasMoreMessages(false);

      if (loadMore) {
        setMessages(prev => [...newMessages.reverse(), ...prev]);
        setPage(p => p + 1);
      } else {
        setMessages(newMessages.reverse());
      }

      
      setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, unreadCount: 0 } : s));
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    } finally {
      if (!loadMore) setIsLoadingMessages(false);
    }
  }, [activeSession, userProfile.id, page]);

 
  const startNewChat = async () => {
    try {
      const res = await api.post('/api/chats/start', { shopId });
      const newSession = res.data.data || res.data;
      setActiveSession({ ...newSession, shopName: shopName || 'المتجر' });
      setMessages([]);
      setPage(0);
      setHasMoreMessages(true);
      fetchSessions();
    } catch (err) {
      Swal.fire('خطأ', 'فشل بدء المحادثة', 'error');
    }
  };

  useEffect(() => {
    if (activeSession) fetchMessages(false);
  }, [activeSession, fetchMessages]);

  useEffect(() => {
    fetchSessions();

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('User WebSocket connected');
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
  }, [fetchSessions]);

  
  useEffect(() => {
    if (!stompClient || !isConnected || !activeSession) return;

    const handleIncomingMessage = (msg) => {
      const body = JSON.parse(msg.body);

      if (body.type === "TYPING" && body.action === "TYPING_START" && body.senderType === "SHOP") {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        return;
      }

      if (body.type === "CHAT" && body.action === "CLOSED") {
        Swal.fire('تم الإغلاق', 'أنهى المتجر المحادثة', 'info', { toast: true, position: 'top-end', timer: 2000 });
        setMessages([]);
        setActiveSession(null);
        setSessions(prev => prev.filter(s => s.id !== activeSession.id));
        return;
      }

      if (body.type === "CHAT" && body.action === "SEND" && body.status === "SUCCESS") {
        const payload = body.payload;
        const message = {
          id: payload.id || uuidv4(),
          content: payload.message || payload.content || payload.payload,
          senderType: payload.sentBy || payload.senderType,
          senderName: payload.sentBy === "USER" ? userProfile.email : payload.shopName,
          createdAt: payload.createdAt || new Date().toISOString(),
        };

        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };

    const topicSub = stompClient.subscribe(`/topic/chat/${activeSession.id}/${activeSession.shopId}`, handleIncomingMessage);
    subscriptionRef.current = topicSub;

    return () => {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [stompClient, isConnected, activeSession, userProfile.email]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeSession) return;

    const sanitizedInput = DOMPurify.sanitize(input);
    const optimisticMessage = {
      id: uuidv4(),
      content: sanitizedInput,
      senderType: 'USER',
      senderName: userProfile.email,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setInput('');

    if (!stompClient || !isConnected) return;

    stompClient.publish({
      destination: `/app/chat/user/${activeSession.id}/shop/${activeSession.shopId}`,
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify({
        type: "CHAT",
        action: "SEND",
        payload: sanitizedInput,
        senderId: userProfile.id,
        senderType: "USER",
        recipientId: activeSession.id,
        timestamp: new Date().toISOString(),
      }),
    });
  }, [input, activeSession, stompClient, isConnected, userProfile]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);


  const handleScroll = useCallback((e) => {
    const { scrollTop } = e.target;
    if (scrollTop < 200 && hasMoreMessages && !isLoadingMessages) {
      const prevHeight = e.target.scrollHeight;
      fetchMessages(true).then(() => {
        requestAnimationFrame(() => {
          e.target.scrollTop = e.target.scrollHeight - prevHeight + scrollTop;
        });
      });
    }
  }, [fetchMessages, hasMoreMessages, isLoadingMessages]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-7xl h-[90vh] rounded-3xl shadow-2xl flex overflow-hidden">
        {/* Sessions Sidebar */}
        <div className="w-full lg:w-96 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b bg-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-lime-100 rounded-2xl">
                <FiMessageSquare className="text-2xl text-lime-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">محادثاتي</h2>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-xl transition">
              <FiX className="text-2xl text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <FiMessageSquare className="w-20 h-20 mx-auto opacity-30 mb-6" />
                <p className="text-xl">لا توجد محادثات بعد</p>
              </div>
            ) : (
              sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`p-5 rounded-2xl cursor-pointer transition-all hover:shadow-lg border-2 ${
                    activeSession?.id === s.id
                      ? 'bg-lime-50 border-lime-400 shadow-md'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-lime-100 rounded-full flex items-center justify-center text-lime-700 font-bold text-xl">
                      {s.shopName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-gray-900 text-lg">{s.shopName}</h4>
                        {s.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                            {s.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {s.lastMessage?.content || 'ابدأ المحادثة'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t bg-gray-50">
            <button
              onClick={startNewChat}
              className="w-full py-4 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-3 text-lg"
            >
              <FiMessageSquare className="text-xl" />
              بدء محادثة جديدة
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {activeSession ? (
            <>
              <div className="bg-white border-b px-8 py-6 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-lime-100 rounded-full flex items-center justify-center text-lime-700 font-bold text-2xl">
                    {activeSession.shopName?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{activeSession.shopName}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      {isConnected ? (
                        <>
                          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                          متصل الآن
                        </>
                      ) : 'جاري الاتصال...'}
                    </p>
                  </div>
                </div>
                {isTyping && (
                  <p className="text-lg text-lime-600 animate-pulse flex items-center gap-2">
                    <span className="flex">
                      <span className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-3 h-3 bg-gray-400 rounded-full animate-bounce mx-1 delay-100"></span>
                      <span className="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </span>
                    يكتب...
                  </p>
                )}
              </div>

              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-8 space-y-6"
              >
                {isLoadingMessages && page === 0 ? (
                  <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-6 border-lime-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-32 text-gray-500">
                    <FiMessageSquare className="w-24 h-24 mx-auto opacity-20 mb-6" />
                    <p className="text-2xl font-medium">ابدأ المحادثة!</p>
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`flex items-start gap-5 ${m.senderType === 'USER' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                        m.senderType === 'USER' ? 'bg-lime-600' : 'bg-gray-500'
                      }`}>
                        {m.senderName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className={`max-w-2xl ${m.senderType === 'USER' ? 'text-right' : ''}`}>
                        <div className={`inline-block px-8 py-5 rounded-3xl shadow-lg ${
                          m.senderType === 'USER'
                            ? 'bg-lime-600 text-white'
                            : 'bg-white text-gray-900 border-2 border-gray-200'
                        }`}>
                          <p className="text-lg font-medium mb-2">{m.senderName}</p>
                          <div className="text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: m.content }} />
                          <p className="text-sm opacity-70 mt-4 flex items-center gap-2 justify-end">
                            <FiCheckCircle className="text-sm" />
                            {new Date(m.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-white border-t p-6">
                <div className="flex items-center gap-5">
                  <input
                    dir="rtl"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالتك هنا..."
                    className="flex-1 px-8 py-5 border-2 border-gray-300 rounded-3xl focus:outline-none focus:ring-4 focus:ring-lime-100 focus:border-lime-500 bg-gray-50 text-xl"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!isConnected || !input.trim()}
                    className={`px-10 py-5 rounded-3xl font-bold transition flex items-center gap-4 text-xl shadow-xl ${
                      isConnected && input.trim()
                        ? 'bg-lime-600 hover:bg-lime-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FiSend className="text-2xl" />
                    إرسال
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FiMessageSquare className="w-32 h-32 mx-auto opacity-20 mb-8" />
                <p className="text-3xl font-medium">اختر محادثة أو ابدأ واحدة جديدة</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default UserChatModal;