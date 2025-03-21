// client/src/pages/Conversation.js
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useMessaging } from '../utils/simplifiedMessagingService';
import api from '../utils/api';

// Helper components kept the same
const ConversationHeader = ({ conversation, otherParticipant, isLoading }) => {
  const navigate = useNavigate();
  
  if (isLoading || !conversation) {
    return (
      <div className="bg-blue-500 text-white p-4 flex items-center">
        <div className="animate-pulse flex items-center">
          <div className="bg-blue-400 h-10 w-10 rounded-full mr-3"></div>
          <div className="h-4 bg-blue-400 rounded w-24"></div>
        </div>
      </div>
    );
  }
  
  const getConversationTypeWithIcon = () => {
    if (!conversation.order) {
      return {
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
        title: 'Direct Message'
      };
    }
    
    if (conversation.order.gig) {
      return {
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
        title: 'Gig Order'
      };
    }
    
    if (conversation.order.job) {
      return {
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        title: 'Job Order'
      };
    }
    
    return {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      title: 'Order'
    };
  };
  
  const { icon, title } = getConversationTypeWithIcon();
  
  return (
    <div className="bg-blue-500 text-white p-4 flex justify-between items-center sticky top-0 z-10">
      <div className="flex items-center">
        <button 
          onClick={() => navigate('/messages')}
          className="mr-2 md:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
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
          
          <div className="flex items-center text-xs text-blue-100">
            {icon}
            <span>{title}</span>
            
            {conversation.order && (
              <span className="ml-1">: {conversation.order.title}</span>
            )}
          </div>
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
  );
};

const Message = ({ message, isCurrentUser, showDate, previousMessage }) => {
  // Determine if we should show sender name (when first message or different sender than previous)
  const showSenderName = !previousMessage || previousMessage.sender._id !== message.sender._id;
  
  // Format date/time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString([], { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Determine message alignment and styling based on sender
  const messageAlignment = isCurrentUser ? 'justify-end' : 'justify-start';
  const messageBubbleStyle = isCurrentUser 
    ? 'bg-blue-500 text-white rounded-tr-none' 
    : 'bg-white text-gray-800 rounded-tl-none border border-gray-200';
  
  // Helper to render file attachments
  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-1">
        {attachments.map((attachment, idx) => {
          const fileName = attachment.split('/').pop();
          const fileExtension = fileName.split('.').pop().toLowerCase();
          
          // Determine if attachment is an image
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
          
          if (isImage) {
            return (
              <div key={idx} className="rounded overflow-hidden">
                <img 
                  src={attachment} 
                  alt={`Attachment ${idx + 1}`} 
                  className="max-w-full max-h-60 object-contain"
                />
                <div className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'} mt-1`}>
                  {fileName}
                </div>
              </div>
            );
          }
          
          // Default file icon
          return (
            <div key={idx} className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <a 
                href={attachment} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`text-sm ${isCurrentUser ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'} underline`}
                download
              >
                {fileName}
              </a>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="mb-4">
      {/* Date separator */}
      {showDate && (
        <div className="flex justify-center my-4">
          <div className="bg-gray-200 text-gray-600 text-xs rounded-full px-3 py-1">
            {formatDate(message.createdAt)}
          </div>
        </div>
      )}
      
      <div className={`flex ${messageAlignment}`}>
        <div className="max-w-[80%]">
          {/* Sender name (only show for other person's messages) */}
          {!isCurrentUser && showSenderName && (
            <div className="ml-2 mb-1 text-xs text-gray-500">
              {message.sender.username}
            </div>
          )}
          
          {/* Message bubble */}
          <div className={`px-4 py-2 rounded-lg ${messageBubbleStyle}`}>
            {message.content && (
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
            )}
            
            {/* Attachments */}
            {renderAttachments(message.attachments)}
          </div>
          
          {/* Message time */}
          <div className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right mr-2' : 'ml-2'}`}>
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Thread List Component 
const ThreadList = ({ conversationId, threads, activeThreadId, onThreadSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-2 bg-gray-100 border-b border-gray-200 overflow-x-auto">
        <div className="animate-pulse flex space-x-2">
          <div className="h-8 w-24 bg-gray-300 rounded"></div>
          <div className="h-8 w-24 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!threads || threads.length === 0) {
    return null;
  }

  return (
    <div className="p-2 bg-gray-100 border-b border-gray-200 overflow-x-auto">
      <div className="flex space-x-2">
        {threads.map(thread => (
          <button
            key={thread._id}
            onClick={() => onThreadSelect(thread._id)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              activeThreadId === thread._id
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {thread.type === 'general' ? 'General' :
             thread.type === 'order' ? `Order: ${thread.order?.title?.substring(0, 10) || 'Order'}` :
             thread.type === 'gig' ? `Gig: ${thread.gig?.title?.substring(0, 10) || 'Gig'}` :
             thread.title || 'Thread'}
          </button>
        ))}
      </div>
    </div>
  );
};

const Conversation = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Use our simplified messaging context
  const { 
    messages, 
    isLoading: isLoadingMessages,
    error: messagingError,
    activeThreadId,
    setActiveChat,
    sendMessage,
    loadMoreMessages
  } = useMessaging();
  
  const [conversation, setConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [threads, setThreads] = useState([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);

  // Message input state
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Fetch conversation details
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Fetch conversation details
        const response = await api.get(`/messages/conversation/${id}`);
        setConversation(response.data);
      } catch (err) {
        console.error('Error fetching conversation:', err);
        setError(err.response?.data?.message || 'Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversation();
  }, [id]);

  // Fetch threads when conversation is loaded
  useEffect(() => {
    const fetchThreads = async () => {
      if (!conversation) return;
      
      try {
        setIsLoadingThreads(true);
        const response = await api.get(`/messages/conversation/${conversation._id}/threads`);
        
        setThreads(response.data);
        
        // If there are threads but no active thread, select the first one
        // or use the one from URL query params
        if (response.data.length > 0) {
          const threadIdFromUrl = searchParams.get('thread');
          
          if (threadIdFromUrl && response.data.some(t => t._id === threadIdFromUrl)) {
            // Use thread ID from URL
            setActiveChat(conversation._id, threadIdFromUrl);
          } else {
            // Default to first thread
            setActiveChat(conversation._id, response.data[0]._id);
          }
        } else {
          // If no threads exist, create a general thread
          createGeneralThread();
        }
      } catch (err) {
        console.error('Error fetching threads:', err);
      } finally {
        setIsLoadingThreads(false);
      }
    };
    
    fetchThreads();
  }, [conversation, searchParams, setActiveChat]);
  
  // Function to create a general thread if none exist
  const createGeneralThread = async () => {
    try {
      const response = await api.get(`/messages/conversation/${conversation._id}/thread/general`);
      setThreads([response.data]);
      setActiveChat(conversation._id, response.data._id);
    } catch (err) {
      console.error('Error creating general thread:', err);
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && page === 1) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, page]);
  
  // Focus on input when conversation loads
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);
  
  // Utility to determine if we should show date for a message
  const shouldShowDate = (message, index) => {
    if (index === 0) return true;
    
    const prevDate = new Date(messages[index - 1].createdAt).toDateString();
    const currDate = new Date(message.createdAt).toDateString();
    
    return prevDate !== currDate;
  };
  
  // Get other participant in conversation
  const getOtherParticipant = () => {
    if (!conversation || !conversation.participants) return null;
    
    return conversation.participants.find(p => p._id !== currentUser._id) || { 
      username: 'User', 
      profileImage: null 
    };
  };
  
  // Handle load more messages
  const handleLoadMore = async () => {
    if (!isLoadingMessages && hasMore) {
      const nextPage = page + 1;
      const result = await loadMoreMessages(nextPage);
      
      if (result) {
        setPage(nextPage);
        setHasMore(nextPage < result.totalPages);
      }
    }
  };
  
  // Handle thread selection
  const handleThreadSelect = (threadId) => {
    // Update URL with the selected thread
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('thread', threadId);
    navigate(`/messages/${id}?${newSearchParams.toString()}`);
    
    // Set active thread in messaging context
    setActiveChat(id, threadId);
    
    // Reset pagination
    setPage(1);
    setHasMore(false);
  };
  
  // Handle message input change
  const handleMessageChange = (e) => {
    setMessageText(e.target.value);
  };
  
  // Handle file selection for attachments
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Limit to 5 attachments
    if (attachments.length + files.length > 5) {
      alert('You can only attach up to 5 files per message');
      return;
    }
    
    // For a real app, upload files here
    // For this prototype, we'll just store the file objects
    setAttachments(prev => [...prev, ...files]);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove an attachment
  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    // Don't send empty messages
    if (!messageText.trim() && attachments.length === 0) return;
    
    try {
      setIsSending(true);
      
      // To-do in a real app: Upload attachments first
      let uploadedAttachments = [];
      
      // In a real app, this would upload the files and get their URLs
      if (attachments.length > 0) {
        // Mock successful uploads with the file names
        uploadedAttachments = attachments.map((file, index) => 
          `/uploads/messages/${currentUser._id}/${Date.now()}-${index}-${file.name}`
        );
      }
      
      // Send message via our messaging service
      await sendMessage(messageText.trim(), uploadedAttachments);
      
      // Reset input
      setMessageText('');
      setAttachments([]);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle open file picker
  const handleOpenFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Show error if any
  if (error || messagingError) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4 max-w-md">
          {error || messagingError}
        </div>
        <button
          onClick={() => navigate('/messages')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back to Messages
        </button>
      </div>
    );
  }
  
  const otherParticipant = getOtherParticipant();
  
  return (
    <div className="container mx-auto px-0 md:px-4 py-0 md:py-8 mt-16 h-[calc(100vh-64px)] md:h-auto">
      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full md:h-[calc(100vh-96px)]">
        {/* Conversation Header */}
        <ConversationHeader 
          conversation={conversation} 
          otherParticipant={otherParticipant} 
          isLoading={isLoading} 
        />
        
        {/* Thread List */}
        <ThreadList
          conversationId={id}
          threads={threads}
          activeThreadId={activeThreadId}
          onThreadSelect={handleThreadSelect}
          isLoading={isLoadingThreads}
        />
        
        {/* Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="flex-grow p-4 overflow-y-auto bg-gray-50"
        >
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mb-4">
              <button
                onClick={handleLoadMore}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm"
                disabled={isLoadingMessages}
              >
                {isLoadingMessages ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Load Earlier Messages'
                )}
              </button>
            </div>
          )}
          
          {/* Messages */}
          {isLoading || isLoadingThreads ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div>
              {messages.map((message, index) => (
                <Message
                  key={message._id}
                  message={message}
                  isCurrentUser={message.sender._id === currentUser._id}
                  showDate={shouldShowDate(message, index)}
                  previousMessage={index > 0 ? messages[index - 1] : null}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((file, index) => (
                <div 
                  key={index} 
                  className="bg-gray-100 rounded-lg p-2 flex items-center text-sm"
                >
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button
                    onClick={() => handleRemoveAttachment(index)}
                    className="ml-2 text-gray-500 hover:text-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <form 
            onSubmit={handleSendMessage}
            className="flex items-end gap-2"
          >
            <button
              type="button"
              onClick={handleOpenFilePicker}
              className="p-2 text-gray-500 hover:text-blue-500 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
            </button>
            
            <div className="flex-grow relative">
              <textarea
                ref={inputRef}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden"
                placeholder="Type a message..."
                value={messageText}
                onChange={handleMessageChange}
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            
            <button
              type="submit"
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSending || (!messageText.trim() && attachments.length === 0)}
            >
              {isSending ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Conversation;