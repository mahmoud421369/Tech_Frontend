import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { 
  FiX, 
  FiSend, 
  FiXCircle, 
  FiMessageSquare, 
  FiClock, 
  FiUser, 
  FiCheckCircle 
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { v4 as uuidv4 } from 'uuid';
import api from '../api';
import DOMPurify from 'dompurify';

const ShopChatModal = memo(({ open, onClose }) => {
  const shopProfile = {
    email: localStorage.getItem('userEmail') || 'shop',
    id: localStorage.getItem('id') || 'shop-123',
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
  const [totalUnreadCount, setTotalUnreadCount] = useState(0); 

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const subscriptionRef = useRef(null);

  
  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/api/chats/shop/sessions');
      const data = res.data.content || res.data || [];
      const sessionsArray = Array.isArray(data) ? data : data.sessions || [];
      
      setSessions(sessionsArray.map(session => ({
        ...session,
        unreadCount: session.unreadCount || 0
      })));


      fetchTotalUnreadCount();
    } catch (err) {
      console.error('Error fetching sessions:', err);
      Swal.fire('خطأ', 'فشل تحميل المحادثات', 'error', { toast: true, position: 'top-end', timer: 1500 });
    }
  }, []);

  
  const fetchTotalUnreadCount = async () => {
    try {
      const res = await api.get('/api/chats/unread-count'); 
      setTotalUnreadCount(res.data || 0);
    } catch (err) {
      console.error('Failed to fetch unread count');
    }
  };


  const fetchMessages = useCallback(async () => {
    if (!activeSession) return;

    setIsLoadingMessages(true);
    try {
      const res = await api.get(`/api/chats/${activeSession.userId}/shop/${activeSession.shopId}/paginated`);

      let newMessages = [];
      if (res.data.content) newMessages = res.data.content;
      else if (Array.isArray(res.data)) newMessages = res.data;

      const reversed = newMessages.reverse();
      const unique = Array.from(new Map(reversed.map(m => [m.id, m])).values());

      setMessages(unique);

     
      markAsRead(activeSession.userId, activeSession.shopId);
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeSession]);

 
  const markAsRead = async (userId, shopId) => {
    try {
      await api.put(`/api/chats/${userId}/shop/${shopId}/mark-read`);
    
      setSessions(prev => prev.map(s => 
        s.userId === userId && s.shopId === shopId ? { ...s, unreadCount: 0 } : s
      ));
      fetchTotalUnreadCount();
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

 
  const closeChatSession = async (userId, shopId) => {
    try {
      await api.post(`/api/chats/${userId}/shop/${shopId}/close`);
      Swal.fire('تم', 'تم إغلاق المحادثة', 'success', { toast: true, position: 'top-end', timer: 1500 });
      
      setMessages([]);
      setActiveSession(null);
      setSessions(prev => prev.filter(s => !(s.userId === userId && s.shopId === shopId)));
    } catch (err) {
      Swal.fire('خطأ', 'فشل إغلاق المحادثة', 'error', { toast: true, position: 'top-end', timer: 1500 });
    }
  };

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

  
  useEffect(() => {
    if (isConnected && pendingMessages.length > 0 && stompClient) {
      pendingMessages.forEach(({ input, sessionId }) => {
        const messageBody = {
          type: "CHAT",
          action: "SEND",
          payload: DOMPurify.sanitize(input),
          senderId: shopProfile.id,
          senderType: "SHOP",
          recipientId: sessionId,
          timestamp: new Date().toISOString(),
        };
        stompClient.publish({
          destination: `/app/chat/user/${sessionId}/shop/${shopProfile.id}`,
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
          body: JSON.stringify(messageBody),
        });
      });
      setPendingMessages([]);
    }
  }, [isConnected, pendingMessages, stompClient, shopProfile.id]);

  
  useEffect(() => {
    if (!stompClient || !isConnected || !activeSession) return;

    const handleIncomingMessage = (msg) => {
      const body = JSON.parse(msg.body);
      console.log('Received:', body);

      if (body.type === "TYPING" && body.action === "TYPING_START" && body.senderType === "USER") {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        return;
      }

      if (body.type === "CHAT" && body.action === "CLOSED") {
        closeChatSession(activeSession.userId, activeSession.shopId);
        return;
      }

      if (body.type === "CHAT" && body.action === "SEND" && body.status === "SUCCESS") {
        const payload = body.payload;
        const sessionId = payload.sessionId || activeSession.id;

        const message = {
          id: payload.id || uuidv4(),
          content: payload.message || payload.content || payload.payload,
          senderType: payload.sentBy || payload.senderType,
          senderName: payload.sentBy === "USER" ? payload.userName : payload.shopName,
          createdAt: payload.createdAt || new Date().toISOString(),
        };

        if (sessionId === activeSession.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, message];
          });
        } else {
          
          setSessions(prev =>
            prev.map(s => s.id === sessionId ? { ...s, unreadCount: (s.unreadCount || 0) + 1 } : s)
          );
          fetchTotalUnreadCount();
        }
      }
    };

    const topicSub = stompClient.subscribe(
      `/topic/chat/${activeSession.id}/${shopProfile.id}`,
      handleIncomingMessage
    );

    subscriptionRef.current = topicSub;
    fetchMessages();

    return () => {
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [stompClient, isConnected, activeSession, shopProfile.id, fetchMessages]);

  const sendTypingEvent = useCallback(() => {
    if (stompClient && isConnected && activeSession) {
      stompClient.publish({
        destination: `/app/chat/${activeSession.id}/${shopProfile.id}/typing`,
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({
          type: "TYPING",
          action: "TYPING_START",
          senderId: shopProfile.id,
          senderType: "SHOP",
          recipientId: activeSession.id,
          timestamp: new Date().toISOString()
        }),
      });
    }
  }, [stompClient, isConnected, activeSession, shopProfile.id]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeSession) return;

    const sanitizedInput = DOMPurify.sanitize(input);
    const optimisticMessage = {
      id: uuidv4(),
      content: sanitizedInput,
      senderType: 'SHOP',
      senderName: shopProfile.email,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setInput('');

    if (!stompClient || !isConnected) {
      setPendingMessages(prev => [...prev, { input: sanitizedInput, sessionId: activeSession.id }]);
      return;
    }

    stompClient.publish({
      destination: `/app/chat/user/${activeSession.id}/shop/${shopProfile.id}`,
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify({
        type: "CHAT",
        action: "SEND",
        payload: sanitizedInput,
        senderId: shopProfile.id,
        senderType: "SHOP",
        recipientId: activeSession.id,
        timestamp: new Date().toISOString(),
      }),
    });
  }, [input, activeSession, stompClient, isConnected, shopProfile]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      sendTypingEvent();
    }
  }, [sendMessage, sendTypingEvent]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl flex overflow-hidden">
      
        <div className="w-full sm:w-96 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="flex items-center justify-between p-5 border-b bg-white">
            <div className="flex items-center gap-3">
              <FiMessageSquare className="text-2xl text-lime-600" />
              <h2 className="text-xl font-bold">محادثات العملاء</h2>
              {totalUnreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                  {totalUnreadCount}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <FiX className="text-xl" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <FiMessageSquare className="w-16 h-16 mx-auto opacity-30 mb-4" />
                <p className="text-lg">لا توجد محادثات حالياً</p>
              </div>
            ) : (
              sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all hover:shadow-md border ${
                    activeSession?.id === s.id
                      ? 'bg-lime-50 border-lime-400 shadow-sm'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center text-lime-700 font-bold text-lg">
                      {s.userName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-900">{s.userName || 'مجهول'}</h4>
                        {s.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {s.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {s.lastMessage?.content || 'ابدأ المحادثة'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {activeSession && (
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => closeChatSession(activeSession.userId, activeSession.shopId)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                <FiXCircle className="text-lg" />
                إغلاق المحادثة
              </button>
            </div>
          )}
        </div>

        
        <div className="flex-1 flex flex-col bg-gray-50">
          {activeSession ? (
            <>
              <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-lime-100 rounded-full flex items-center justify-center text-lime-700 font-bold text-xl">
                    {activeSession.userName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{activeSession.userName || 'مجهول'}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      {isConnected ? (
                        <>
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          متصل الآن
                        </>
                      ) : 'جاري الاتصال...'}
                    </p>
                  </div>
                </div>
                {isTyping && (
                  <p className="text-blue-600 animate-pulse flex items-center gap-2">
                    <span className="flex">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mx-1 delay-100"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                    </span>
                    يكتب...
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-6 border-lime-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <FiMessageSquare className="w-20 h-20 mx-auto opacity-20 mb-4" />
                    <p className="text-xl">ابدأ المحادثة!</p>
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`flex items-start gap-4 ${m.senderType === 'SHOP' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        m.senderType === 'SHOP' ? 'bg-lime-600' : 'bg-gray-500'
                      }`}>
                        {m.senderName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className={`max-w-lg ${m.senderType === 'SHOP' ? 'text-right' : ''}`}>
                        <div className={`inline-block px-6 py-4 rounded-3xl shadow-md ${
                          m.senderType === 'SHOP'
                            ? 'bg-lime-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}>
                          <p className="text-sm font-medium opacity-90 mb-2">{m.senderName}</p>
                          <div className="text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: m.content }} />
                          <p className="text-xs opacity-70 mt-3 flex items-center gap-1 justify-end">
                            <FiCheckCircle className="text-xs" />
                            {new Date(m.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-white border-t p-5">
                <div className="flex items-center gap-4">
                  <input
                    dir="rtl"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالتك هنا..."
                    className="flex-1 px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-lime-100 focus:border-lime-500 bg-gray-50 text-lg"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!isConnected || !input.trim()}
                    className={`px-8 py-4 rounded-2xl font-bold transition flex items-center gap-3 ${
                      isConnected && input.trim()
                        ? 'bg-lime-600 hover:bg-lime-700 text-white shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FiSend className="text-xl" />
                    إرسال
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FiMessageSquare className="w-24 h-24 mx-auto opacity-20 mb-6" />
                <p className="text-2xl font-medium">اختر محادثة لبدء الدردشة</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ShopChatModal;