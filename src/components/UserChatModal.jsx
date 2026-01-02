import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { FiX, FiSend, FiMessageSquare, FiCheckCircle } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';
import DOMPurify from 'dompurify';

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
  const loadedSessions = useRef(new Set());

  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;


  const getOrCreateSession = useCallback((shopIdFromMsg, shopNameFromMsg = 'Shop') => {
    const sid = String(shopIdFromMsg);
    let session = sessions.find(s => s.shopId === sid);

    if (!session) {
      session = {
        shopId: sid,
        shopName: shopNameFromMsg,
        lastMessage: null,
        unreadCount: 0,
      };
      setSessions(prev => {
       
        if (prev.some(s => s.shopId === sid)) return prev;
        return [session, ...prev];
      });
    } else {
      
      if (shopNameFromMsg && session.shopName === 'Shop') {
        setSessions(prev =>
          prev.map(s => (s.shopId === sid ? { ...s, shopName: shopNameFromMsg } : s))
        );
      }
    }
    return session;
  }, [sessions]);

 
  const loadMessageHistory = useCallback(async (session) => {
    if (!session || !userProfile.id || loadedSessions.current.has(session.shopId)) return;

    setIsLoadingHistory(true);
    loadedSessions.current.add(session.shopId);

    try {
      const res = await api.get(`/api/chats/${userProfile.id}/shop/${session.shopId}/paginated`);
      const rawMessages = res.data.content || [];

      const formatted = rawMessages.map(msg => ({
        id: msg.id,
        content: msg.message || '',
        senderType: msg.sentBy === 'USER' ? 'USER' : 'SHOP',
        senderName: msg.sentBy === 'USER' ? userProfile.email : (msg.shopName || session.shopName),
        createdAt: msg.createdAt,
        read: msg.read || false,
      }));

      formatted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(formatted);

    
      try {
        await api.put(`/api/chats/${userProfile.id}/shop/${session.shopId}/mark-read`);
        setSessions(prev =>
          prev.map(s => (s.shopId === session.shopId ? { ...s, unreadCount: 0 } : s))
        );
      } catch (e) {
        console.warn('Failed to mark as read');
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
      Swal.fire('Error', 'Failed to load chat history', 'error');
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
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
        return;
      }

      if (body.type === "CHAT" && body.action === "SEND" && body.status === "SUCCESS") {
        const payload = body.payload;
        const shopIdFromMsg = String(payload.senderId || body.shopId || payload.shopId);
        const shopNameFromMsg = payload.shopName || initialShopName || 'Shop';

        const newMessage = {
          id: payload.id || generateTempId(),
          content: payload.message || payload.content || '',
          senderType: "SHOP",
          senderName: shopNameFromMsg,
          createdAt: payload.createdAt || new Date().toISOString(),
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
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      }
    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  }, [activeSession, getOrCreateSession, initialShopName]);


  useEffect(() => {
    if (!userProfile.id) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/user/${userProfile.id}/chats`, handleIncomingMessage);
      },
      onDisconnect: () => setIsConnected(false),
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        setIsConnected(false);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [userProfile.id, handleIncomingMessage]);


  useEffect(() => {
    if (shopId && userProfile.id) {
      const session = getOrCreateSession(shopId, initialShopName || 'Shop');
      setActiveSession(session);
    }
  }, [shopId, initialShopName, userProfile.id, getOrCreateSession]);

 
  useEffect(() => {
    if (activeSession) {
      loadMessageHistory(activeSession);
    }
  }, [activeSession, loadMessageHistory]);

 
  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeSession || !isConnected || !stompClient) return;

    const sanitized = DOMPurify.sanitize(input.trim());
    const tempId = generateTempId();

    const optimisticMsg = {
      id: tempId,
      content: sanitized,
      senderType: "USER",
      senderName: userProfile.email,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setMessages(prev => [...prev, optimisticMsg]);

    setSessions(prev =>
      prev.map(s =>
        s.shopId === activeSession.shopId
          ? { ...s, lastMessage: { message: sanitized, sentBy: "USER" } }
          : s
      )
    );

    stompClient.publish({
      destination: `/app/chat/user/${userProfile.id}/shop/${activeSession.shopId}`,
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify({
        payload: sanitized,
        senderId: userProfile.id,
        senderType: "USER",
        recipientId: activeSession.shopId,
      }),
    });

    setInput('');
  }, [input, activeSession, stompClient, isConnected, userProfile]);

  const sendTyping = useCallback(() => {
    if (!stompClient || !isConnected || !activeSession || !input.trim()) return;

    stompClient.publish({
      destination: `/app/chat/${userProfile.id}/${activeSession.shopId}/typing`,
      body: JSON.stringify({}),
    });
  }, [stompClient, isConnected, activeSession, input]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    sendTyping();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="fixed inset-0 bg-black/70 dark:bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        <div className="w-full md:w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiMessageSquare className="text-xl text-lime-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">My Chats</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <FiX className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FiMessageSquare className="w-12 h-12 mx-auto opacity-30 mb-3" />
                <p>No chats yet</p>
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.shopId}
                  onClick={() => setActiveSession(s)}
                  className={`p-3 rounded-xl cursor-pointer transition-all hover:shadow border ${
                    activeSession?.shopId === s.shopId
                      ? 'bg-lime-50 dark:bg-lime-900/30 border-lime-400'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-lime-100 dark:bg-lime-800 rounded-full flex items-center justify-center text-lime-700 dark:text-lime-400 font-bold">
                      {s.shopName[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {s.shopName}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                        {s.lastMessage?.message || 'Start chatting'}
                      </p>
                    </div>
                    {s.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {s.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

     
        <div className="flex-1 flex flex-col">
          {activeSession ? (
            <>
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-lime-100 dark:bg-lime-800 rounded-full flex items-center justify-center text-lime-700 dark:text-lime-400 font-bold text-lg">
                    {activeSession.shopName[0]?.toUpperCase() || '?'}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {activeSession.shopName}
                  </h3>
                </div>
                {isTyping && (
                  <div className="text-sm text-lime-600 dark:text-lime-400 animate-pulse flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-current rounded-full animate-bounce delay-200"></span>
                    </div>
                    typing...
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingHistory ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="w-10 h-10 border-4 border-lime-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                    <FiMessageSquare className="w-16 h-16 mx-auto opacity-20 mb-4" />
                    <p>Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex items-start gap-3 ${m.senderType === 'USER' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        m.senderType === 'USER' ? 'bg-lime-600' : 'bg-gray-500'
                      }`}>
                        {m.senderName[0]?.toUpperCase() || '?'}
                      </div>
                      <div className={`max-w-lg ${m.senderType === 'USER' ? 'text-right' : ''}`}>
                        <div className={`inline-block px-5 py-3 rounded-2xl shadow ${
                          m.senderType === 'USER'
                            ? 'bg-lime-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                        }`}>
                          <div
                            className="text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.content) }}
                          />
                          <p className="text-xs opacity-70 mt-2 flex items-center gap-1 justify-end">
                            {m.senderType === 'USER' && m.read && <FiCheckCircle className="text-xs" />}
                            {new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3">
                  <input
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 px-5 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!isConnected || !input.trim()}
                    className={`px-6 py-3 rounded-2xl font-medium flex items-center gap-2 transition ${
                      isConnected && input.trim()
                        ? 'bg-lime-600 hover:bg-lime-700 text-white shadow'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FiSend className="text-lg" />
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <FiMessageSquare className="w-20 h-20 mx-auto opacity-20 mb-4" />
                <p className="text-lg">Select a shop to start chatting</p>
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