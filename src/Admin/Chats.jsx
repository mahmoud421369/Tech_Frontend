/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect, useRef } from 'react';
import { 
  FiPlus, FiEdit, FiTrash2, FiPaperclip, FiMic, FiSmile,
  FiSend
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';

 const Chats = () => {
  const [conversations, setConversations] = useState([
    { 
      id: 1, 
      name: 'Youssef Ehab', 
      lastMessage: 'Thanks', 
      time: '10:45 AM', 
      unread: 0,
      messages: [
        { id: 1, sender: 'user', type: 'text', content: 'Hello, I have a question about my repair order', time: '10:30 AM' },
        { id: 2, sender: 'admin', type: 'text', content: 'Hi there! How can I help you?', time: '10:31 AM' },
        { id: 3, sender: 'user', type: 'text', content: 'My order #12345 was supposed to be ready yesterday', time: '10:32 AM' },
        { id: 4, sender: 'admin', type: 'text', content: 'Let me check on that for you...', time: '10:33 AM' },
        { id: 5, sender: 'admin', type: 'text', content: 'I see the technician found an additional issue. Your device will be ready tomorrow.', time: '10:35 AM' }
      ]
    },
    { 
      id: 2, 
      name: 'Ahmed Ashraf', 
      lastMessage: 'When will my device be ready?', 
      time: '9:30 AM', 
      unread: 2,
      messages: [
        { id: 1, sender: 'user', type: 'text', content: 'Hi, what\'s the status of my iPhone?', time: '9:15 AM' },
        { id: 2, sender: 'admin', type: 'image', content: 'https://via.placeholder.com/150', fileName: 'repair-status.jpg', time: '9:20 AM' }
      ]
    },

       { 
      id: 3, 
      name: 'Mohamed Haytham', 
      lastMessage: 'When will my device be ready?', 
      time: '9:30 AM', 
      unread: 3,
      messages: [
        { id: 1, sender: 'user', type: 'text', content: 'Hi, what\'s the status of my iPhone?', time: '9:15 AM' },
        { id: 2, sender: 'admin', type: 'image', content: 'https://via.placeholder.com/150', fileName: 'repair-status.jpg', time: '9:20 AM' }
      ]
    },

          { 
      id: 3, 
      name: 'Yahia Ahmed', 
      lastMessage: 'When will my device be ready?', 
      time: '9:30 AM', 
      unread: 4,
      messages: [
        { id: 1, sender: 'user', type: 'text', content: 'Hi, what\'s the status of my iPhone?', time: '9:15 AM' },
        { id: 2, sender: 'admin', type: 'image', content: 'https://via.placeholder.com/150', fileName: 'repair-status.jpg', time: '9:20 AM' }
      ]
    },

          { 
      id: 5, 
      name: 'Mohamed Gaber', 
      lastMessage: 'When will my device be ready?', 
      time: '9:30 AM', 
      unread: 1,
      messages: [
        { id: 1, sender: 'user', type: 'text', content: 'Hi, what\'s the status of my iPhone?', time: '9:15 AM' },
        { id: 2, sender: 'admin', type: 'image', content: 'https://via.placeholder.com/150', fileName: 'repair-status.jpg', time: '9:20 AM' }
      ]
    },
  
  ]);
  
  const [activeConversation, setActiveConversation] = useState(1);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [recording, setRecording] = useState(false);
  const chatEndRef = useRef(null);
  

  useEffect(() => {
    const interval = setInterval(() => {
      
      if (Math.random() > 0.7) {
        const convId = Math.floor(Math.random() * conversations.length) + 1;
      
        
        setConversations(prev => prev.map(conv => 
          conv.id === convId 
            ? { ...conv, messages: [...conv.messages,[]] } 
            : conv
        ));
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [conversations.length]);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations.find(c => c.id === activeConversation)?.messages]);
  
  const handleSend = () => {
    if (newMessage.trim() !== '') {
      const message = {
        id: Date.now(),
        sender: 'admin',
        type: 'text',
        content: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation 
          ? { ...conv, messages: [...conv.messages, message] } 
          : conv
      ));
      setNewMessage('');
    }
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
  
    const fileType = file.type.startsWith('image') ? 'image' : 'file';
    
    const message = {
      id: Date.now(),
      sender: 'admin',
      type: fileType,
      content: URL.createObjectURL(file),
      fileName: file.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation 
        ? { ...conv, messages: [...conv.messages, message] } 
        : conv
    ));
  };
  
  const handleEmojiClick = (emoji) => {
    setNewMessage(prev => prev + emoji.emoji);
  };
  
  const startRecording = () => {
    setRecording(true);
  };
  
  const stopRecording = () => {
    setRecording(false);
    
    const message = {
      id: Date.now(),
      sender: 'admin',
      type: 'audio',
      content: 'https://example.com/audio.mp3',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation 
        ? { ...conv, messages: [...conv.messages, message] } 
        : conv
    ));
  };
  
  const editMessage = (messageId, newContent) => {
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation 
        ? { 
            ...conv, 
            messages: conv.messages.map(msg => 
              msg.id === messageId 
                ? { ...msg, content: newContent, edited: true } 
                : msg
            ) 
          } 
        : conv
    ));
    setEditingMessage(null);
  };
  
  const deleteMessage = (messageId) => {
    setConversations(prev => prev.map(conv => 
      conv.id === activeConversation 
        ? { 
            ...conv, 
            messages: conv.messages.filter(msg => msg.id !== messageId) 
          } 
        : conv
    ));
  };
  
  const currentConversation = conversations.find(c => c.id === activeConversation) || conversations[0];
  
  return (
    <div style={{marginTop:"-550px",marginLeft:"300px"}} className="max-w-4xl mx-auto bg-white rounded-lg shadow overflow-hidden">
      <div className="flex">
        
        <div className="w-1/3 border-r">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">Conversations</h2>
            <button className="p-1 rounded-full hover:bg-gray-100">
              <FiPlus className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto h-[500px]">
            {conversations.map(conversation => (
              <div 
                key={conversation.id} 
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  conversation.id === activeConversation ? 'bg-blue-50' : ''
                }`}
                onClick={() => setActiveConversation(conversation.id)}
              >
                <div className="flex justify-between">
                  <div className="font-semibold">{conversation.name}</div>
                  <div className="text-sm text-gray-500">{conversation.time}</div>
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-gray-600 truncate">
                    {conversation.lastMessage}
                  </p>
                  {conversation.unread > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
       
        <div className="w-2/3 flex flex-col">
          <div className="p-4 border-b flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">
              {currentConversation.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="font-semibold">{currentConversation.name}</div>
              <div className="text-sm text-gray-500">Online now</div>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 h-[400px]">
            <div className="space-y-4">
              {currentConversation.messages.map(message => (
                <MessageItem 
                  key={message.id} 
                  message={message} 
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  isEditing={editingMessage === message.id}
                  startEditing={() => setEditingMessage(message.id)}
                  cancelEditing={() => setEditingMessage(null)}
                />
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
          
          <div className="p-4 border-t relative">
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
            
            <div className="flex items-center">
              <button 
                className="p-2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <FiSmile className="w-5 h-5" />
              </button>
              
              <div className="relative mx-2">
                <input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileUpload}
                  accept="image/,audio/"
                />
                <label 
                  htmlFor="file-upload" 
                  className="p-2 text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <FiPaperclip className="w-5 h-5" />
                </label>
              </div>
              
              {recording ? (
                <button 
                  className="p-2 text-red-500 hover:text-red-700"
                  onClick={stopRecording}
                >
                  <div className="flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                    <FiMic className="w-5 h-5" />
                  </div>
                </button>
              ) : (
                <button 
                  className="p-2 text-gray-500 hover:text-gray-700"
                  onClick={startRecording}
                >
                  <FiMic className="w-5 h-5" />
                </button>
              )}
              
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-grow px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                className="bg-blue-500 text-white px-4 py-2 rounded-r-lg"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const MessageItem = ({ 
  message, 
  onEdit, 
  onDelete, 
  isEditing,
  startEditing,
  cancelEditing
}) => {
  const [editText, setEditText] = useState(message.content);
  
  const renderContent = () => {
    switch(message.type) {
      case 'image':
        return (
          <div className="mt-2">
            <img 
              src={message.content} 
              alt={message.fileName || 'Uploaded image'} 
              className="max-w-xs rounded-lg shadow-sm"
            />
            {message.fileName && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                {message.fileName}
              </div>
            )}
          </div>
        );
      case 'audio':
        return (
          <div className="mt-2">
            <audio controls className="w-full">
              <source src={message.content} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      case 'file':
        return (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="font-medium text-blue-700">{message.fileName}</div>
            <div className="text-xs text-gray-500">File attachment</div>
          </div>
        );
      default:
        return <p>{message.content}</p>;
    }
  };
  
  return (
    <div className={`flex ${message.sender === 'admin' ? 'justify-end' : ''}`}>
      <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg relative group ${
        message.sender === 'admin' 
          ? 'bg-blue-500 text-white rounded-br-none' 
          : 'bg-white border rounded-bl-none'
      }`}>
        {isEditing ? (
          <div className="mb-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-2 text-gray-800 rounded border"
              autoFocus
            />
            <div className="flex justify-end mt-2 space-x-2">
              <button
                className="text-xs px-2 py-1 bg-gray-200 rounded"
                onClick={cancelEditing}
              >
                Cancel
              </button>
              <button
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                onClick={() => onEdit(message.id, editText)}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            {renderContent()}
            <div className={`flex items-center mt-1 ${
              message.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <span className="text-xs">
                {message.time}
              </span>
              {message.edited && (
                <span className="text-xs italic ml-2">
                  (edited)
                </span>
              )}
            </div>
            
            {message.sender === 'admin' && (
              <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex bg-white rounded shadow-md p-1">
                  <button 
                    className="p-1 text-gray-600 hover:text-blue-500"
                    onClick={startEditing}
                  >
                    <FiEdit className="w-3 h-3" />
                  </button>
                  <button 
                    className="p-1 text-gray-600 hover:text-red-500"
                    onClick={() => onDelete(message.id)}
                  >
                    <FiTrash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default Chats