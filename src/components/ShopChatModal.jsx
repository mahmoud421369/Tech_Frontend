import React, { useEffect, useState, useCallback, memo } from 'react';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { FiX, FiSend, FiXCircle } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api'; // Import the Axios instance from api.js

const ShopChatModal = memo(({ open, onClose }) => {
  const shopProfile = {
    email: localStorage.getItem('email') || 'shop@example.com',
    id: localStorage.getItem('shopId') || 'shop-123',
  };

  const [stompClient, setStompClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);

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
        Swal.fire('Error', 'Could not load chat sessions', 'error');
      }
    }
    return () => controller.abort();
  }, []);

  // Fetch messages for active session
  const fetchMessages = useCallback(async () => {
    if (!activeSession) return;

    const controller = new AbortController();
    try {
      const res = await api.get(`/api/chats/${activeSession.id}/messages`, {
        signal: controller.signal,
      });
      const data = res.data;
      console.log('Messages API response:', data);
      setMessages(data.content || data || []);
      // Reset unread count for active session
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSession.id ? { ...s, unreadCount: 0 } : s))
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('❌ Error loading messages:', err.response?.data || err.message);
        Swal.fire('Error', 'Could not load messages', 'error');
      }
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
        Swal.fire('Error', 'WebSocket connection failed', 'error');
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
      setIsConnected(false);
    };
  }, [open, fetchSessions]);

  // Subscribe to WebSocket messages for active session
  useEffect(() => {
    if (!stompClient || !isConnected || !activeSession) return;

    const subscription = stompClient.subscribe(
      `/user/${shopProfile.email}/queue/chat/messages/${activeSession.id}`,
      (msg) => {
        const body = JSON.parse(msg.body);
        console.log('📩 Received (shop):', body);
        setMessages((prev) => [...prev, body]);
        // Update unread count for non-active sessions
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

    fetchMessages();

    return () => {
      subscription?.unsubscribe();
    };
  }, [stompClient, isConnected, activeSession, shopProfile.email, fetchMessages]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!input.trim()) return;
    if (!activeSession) {
      Swal.fire('Warning', 'No active session selected', 'warning');
      return;
    }
    if (!stompClient || !isConnected) {
      Swal.fire('Error', 'Cannot send message: WebSocket is not connected', 'error');
      return;
    }

    const message = {
      sessionId: activeSession.id,
      content: input,
      senderType: 'SHOP',
      senderName: shopProfile.email,
      createdAt: new Date().toISOString(),
    };

    stompClient.publish({
      destination: '/app/chat/send',
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify(message),
    });

    console.log('Sent (shop):', message);
    setMessages((prev) => [...prev, message]); // Add message locally for instant feedback
    setInput('');
  }, [input, activeSession, stompClient, isConnected, shopProfile.email]);

  // Handle Enter key for sending
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // End chat session
  const endChat = useCallback(async (sessionId) => {
    try {
      await api.post(`/api/chats/${sessionId}/end`);
      console.log('Chat ended:', sessionId);
      setMessages([]);
      setActiveSession(null);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      Swal.fire('Success', 'Chat session ended', 'success');
    } catch (err) {
      console.error('❌ Error ending chat:', err.response?.data || err.message);
      Swal.fire('Error', 'Failed to end chat session', 'error');
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl h-[600px] rounded-2xl shadow-xl flex flex-col sm:flex-row overflow-hidden transform transition-all duration-300">
        <div className="w-full sm:w-80 bg-indigo-600 dark:bg-indigo-900 text-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-indigo-500 dark:border-indigo-700">
            <h2 className="text-lg font-semibold">محادثات العملاء</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-all duration-200"
              aria-label="Close chat modal"
            >
              <FiX className="text-xl" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="text-center py-6 text-gray-300">
                <svg
                  className="w-16 h-16 mx-auto mb-2"
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
                <p>لا توجد محادثات</p>
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSession(s)}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    activeSession?.id === s.id
                      ? 'bg-indigo-700 dark:bg-indigo-800'
                      : 'hover:bg-indigo-500 dark:hover:bg-indigo-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{s.userName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300">
                        {new Date(s.createdAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {s.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                          {s.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-200 truncate">
                    {s.lastMessage?.content || 'لا توجد رسائل بعد'}
                  </div>
                </div>
              ))
            )}
          </div>
          {activeSession && (
            <button
              onClick={() => endChat(activeSession.id)}
              className="m-4 px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FiXCircle /> إنهاء المحادثة
            </button>
          )}
        </div>
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
          {activeSession ? (
            <>
              <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`mb-4 flex ${
                      m.senderType === 'SHOP' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-sm px-4 py-2 rounded-3xl ${
                        m.senderType === 'SHOP'
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {m.senderName} •{' '}
                        {new Date(m.createdAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div>{m.content}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  placeholder="اكتب رسالة..."
                  dir="rtl"
                />
                <button
                  onClick={sendMessage}
                  disabled={!isConnected}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    isConnected
                      ? 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600'
                      : 'bg-gray-400 dark:bg-gray-600 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  <FiSend />
                  <span className="hidden sm:inline">إرسال</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-2"
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
                <p className="text-lg">اختر محادثة لعرض الرسائل</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ShopChatModal;