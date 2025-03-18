// File: client/src/pages/Conversation.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const Conversation = () => {
  const { id } = useParams(); // This is the conversation ID
  const { currentUser, activeRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState([]);
  
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  
  useEffect(() => {
    fetchConversation();
  }, [id]);
  
  useEffect(() => {
    if (conversation) {
      fetchMessages();
    }
  }, [conversation, page]);
  
  useEffect(() => {
    // Scroll to bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const fetchConversation = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/messages/conversation/${id}`);
      setConversation(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        // Try to create conversation from order ID
        try {
          const orderResponse = await api.get(`/messages/conversation/order/${id}`);
          setConversation(orderResponse.data);
        } catch (orderErr) {
          setError(orderErr.response?.data?.message || 'Conversation not found');
        }
      } else {
        setError(err.response?.data?.message || 'Failed to load conversation');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMessages = async () => {
    try {
      const response = await api.get(`/messages/conversation/${conversation._id}/messages?page=${page}`);
      
      if (page === 1) {
        setMessages(response.data.messages);
      } else {
        setMessages(prev => [...response.data.messages, ...prev]);
      }
      
      setHasMore(page < response.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
    }
  };
  
  const loadMoreMessages = () => {
    if (hasMore) {
      setPage(prev => prev + 1);
    }
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(files);
  };
  
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && attachments.length === 0) {
      return;
    }
    
    try {
      // For a real app, you would upload files here
      // For this prototype, we'll just use the file names
      const attachmentNames = attachments.map(file => file.name);
      
      const response = await api.post(`/messages/conversation/${conversation._id}`, { 
        content: newMessage,
        attachments: attachmentNames
      });
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      setAttachments([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    }
  };
  
  if (loading && !conversation) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Loading conversation...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-20 p-8 bg-white shadow rounded-lg">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/messages')}
          className="text-blue-500 hover:underline"
        >
          &larr; Back to Messages
        </button>
      </div>
    );
  }
  
  if (!conversation) {
    return (
      <div className="max-w-4xl mx-auto mt-20 p-8 bg-white shadow rounded-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Conversation Not Found</h2>
          <p className="text-gray-600 mb-4">The conversation you're looking for doesn't exist or you don't have access to it.</p>
          <Link to="/messages" className="text-blue-500 hover:underline">
            &larr; Back to Messages
          </Link>
        </div>
      </div>
    );
  }
  
  // Determine the other participant
  const otherParticipant = conversation.participants.find(
    participant => participant._id !== currentUser._id
  );
  
  return (
    <div className="max-w-4xl mx-auto mt-20 bg-white shadow rounded-lg overflow-hidden">
      {/* Conversation Header */}
      <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-white text-blue-500 flex items-center justify-center font-bold mr-3">
            {otherParticipant?.profileImage ? (
              <img
                src={otherParticipant.profileImage}
                alt={otherParticipant.username}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              otherParticipant?.username.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="font-bold">{otherParticipant?.username}</h3>
            {conversation.order && (
              <p className="text-sm text-blue-100">
                Order: {conversation.order.title}
              </p>
            )}
          </div>
        </div>
        
        {conversation.order && (
          <Link
            to={`/orders/${conversation.order._id}`}
            className="bg-white text-blue-500 px-3 py-1 rounded text-sm hover:bg-blue-50"
          >
            View Order
          </Link>
        )}
      </div>
      
      {/* Messages Container */}
      <div 
        className="h-96 p-4 overflow-y-auto bg-gray-50"
        ref={messageContainerRef}
      >
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={loadMoreMessages}
              className="text-blue-500 hover:underline text-sm"
            >
              Load more messages
            </button>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-10">
            <p>No messages yet. Send the first message to start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={message._id} 
              className={`mb-4 flex ${
                message.sender._id === currentUser._id 
                  ? 'justify-end' 
                  : 'justify-start'
              }`}
            >
              <div 
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender._id === currentUser._id 
                    ? 'bg-blue-500 text-white rounded-br-none' 
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {message.sender.username}
                </div>
                <div className="break-words">
                  {message.content}
                </div>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs mb-1 font-semibold">Attachments:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.attachments.map((attachment, idx) => (
                        <div 
                          key={idx}
                          className={`text-xs px-2 py-1 rounded ${
                            message.sender._id === currentUser._id 
                              ? 'bg-blue-600' 
                              : 'bg-gray-300 text-gray-800'
                          }`}
                        >
                          {attachment}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div 
                  className={`text-xs mt-1 ${
                    message.sender._id === currentUser._id 
                      ? 'text-blue-200' 
                      : 'text-gray-500'
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="p-4 border-t">
        <form onSubmit={sendMessage} className="flex flex-col">
          <div className="flex-1 mb-2">
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              rows="3"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            ></textarea>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Attach
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              
              {attachments.length > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {attachments.length} file(s) selected
                </span>
              )}
            </div>
            
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              disabled={!newMessage.trim() && attachments.length === 0}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Conversation;