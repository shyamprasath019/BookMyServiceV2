// client/src/pages/Conversation.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import fileUploadService from '../utils/fileUploadService';

const Conversation = () => {
  const { id } = useParams(); // This is the conversation ID
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  
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
  
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Validate files (max 5 files, each max 5MB)
    if (files.length > 5) {
      setError('You can upload a maximum of 5 files at once');
      return;
    }
    
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the 5MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    setAttachments(files);
  };
  
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleOpenFileDialog = () => {
    fileInputRef.current.click();
  };
  
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() && attachments.length === 0) {
      return;
    }
    
    setIsSending(true);
    setError('');
    
    try {
      let attachmentUrls = [];
      
      // Upload attachments if any
      if (attachments.length > 0) {
        setIsUploading(true);
        try {
          attachmentUrls = await fileUploadService.uploadMessageAttachments(attachments);
        } catch (uploadErr) {
          throw new Error('Failed to upload attachments: ' + (uploadErr.message || 'Unknown error'));
        } finally {
          setIsUploading(false);
        }
      }
      
      // Send message with attachments if any
      const response = await api.post(`/messages/conversation/${conversation._id}`, { 
        content: newMessage,
        attachments: attachmentUrls
      });
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      setAttachments([]);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };
  
  const formatMessageTime = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    
    // If message is from today, show only time
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  // Helper to get the proper styling based on the file type
  const getAttachmentStyle = (fileName) => {
    const extension = fileUploadService.getFileExtension(fileName).toLowerCase();
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return {
        icon: 'image',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700'
      };
    }
    
    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
      return {
        icon: 'document',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700'
      };
    }
    
    // Code/technical files
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'c', 'cpp'].includes(extension)) {
      return {
        icon: 'code',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700'
      };
    }
    
    // Default
    return {
      icon: 'file',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700'
    };
  };
  
  // Render file icon based on type
  const renderFileIcon = (type) => {
    if (type === 'image') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    
    if (type === 'document') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    
    if (type === 'code') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    }
    
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    );
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
      <div className="bg-blue-500 text-white p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-white text-blue-500 flex items-center justify-center font-bold mr-3 overflow-hidden">
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
            className="bg-white text-blue-500 px-3 py-1 rounded text-sm hover:bg-blue-50 transition-colors"
          >
            View Order
          </Link>
        )}
      </div>
      
      {/* Messages Container */}
      <div 
        className="h-[60vh] p-4 overflow-y-auto bg-gray-50"
        ref={messageContainerRef}
      >
        {hasMore && (
          <div className="text-center mb-4">
            <button
              onClick={loadMoreMessages}
              className="text-blue-500 hover:underline text-sm bg-white px-3 py-1 rounded-full shadow-sm"
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
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.sender._id === currentUser._id;
              const showDate = index === 0 || 
                new Date(message.createdAt).toDateString() !== 
                new Date(messages[index - 1].createdAt).toDateString();
              
              return (
                <React.Fragment key={message._id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <div className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {new Date(message.createdAt).toLocaleDateString([], { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  )}
                
                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex flex-col max-w-[75%]">
                      <div className={`flex items-start ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                        <div className="h-8 w-8 rounded-full flex-shrink-0 bg-gray-300 flex items-center justify-center text-white overflow-hidden">
                          {message.sender.profileImage ? (
                            <img 
                              src={message.sender.profileImage} 
                              alt={message.sender.username}
                              className="h-8 w-8 object-cover"
                            />
                          ) : (
                            <span>{message.sender.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div 
                          className={`px-4 py-2 rounded-lg mx-2 ${
                            isCurrentUser 
                              ? 'bg-blue-500 text-white rounded-tr-none' 
                              : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                          }`}
                        >
                          <div className="break-words">
                            {message.content}
                          </div>
                          
                          // Continuing from previous artifact
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment, idx) => {
                                const fileStyle = getAttachmentStyle(attachment);
                                return (
                                  <div 
                                    key={idx}
                                    className={`flex items-center ${fileStyle.bgColor} ${fileStyle.textColor} px-2 py-1 rounded text-xs`}
                                  >
                                    {renderFileIcon(fileStyle.icon)}
                                    <span className="truncate">{attachment.split('/').pop()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`text-xs mt-1 text-gray-500 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        {formatMessageTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 pt-2 bg-white border-t">
          <div className="text-sm font-medium text-gray-700 mb-2">Attachments ({attachments.length})</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((file, index) => {
              const isImage = fileUploadService.isImage(file);
              const fileSize = fileUploadService.formatFileSize(file.size);
              
              return (
                <div 
                  key={index} 
                  className="relative flex items-center border rounded-lg overflow-hidden bg-gray-50 group"
                >
                  {isImage ? (
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={file.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1 p-2">
                    <div className="text-xs text-gray-700 truncate max-w-[120px]">{file.name}</div>
                    <div className="text-xs text-gray-500">{fileSize}</div>
                  </div>
                  
                  <button 
                    onClick={() => removeAttachment(index)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-80 hover:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
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
              <button
                type="button"
                onClick={handleOpenFileDialog}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg flex items-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Attach
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
              </button>
              
              {attachments.length > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {attachments.length} file{attachments.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors flex items-center"
              disabled={(!newMessage.trim() && attachments.length === 0) || isSending || isUploading}
            >
              {(isSending || isUploading) ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isUploading ? 'Uploading...' : 'Sending...'}
                </>
              ) : (
                <>
                  Send
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Conversation;