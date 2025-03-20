// client/src/pages/Messages.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const Messages = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  
  useEffect(() => {
    fetchConversations();
  }, []);
  
  useEffect(() => {
    // Filter conversations based on search query and selected tab
    if (conversations.length > 0) {
      let filtered = [...conversations];
      
      // Filter by tab
      if (selectedTab === 'orders') {
        filtered = filtered.filter(conv => conv.order);
      } else if (selectedTab === 'unread') {
        filtered = filtered.filter(conv => conv.unreadCount > 0);
      }
      
      // Filter by search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(conv => {
          const otherUser = conv.participants.find(p => p._id !== currentUser._id);
          
          // Search by user name
          if (otherUser.username.toLowerCase().includes(query)) {
            return true;
          }
          
          // Search by order title
          if (conv.order && conv.order.title.toLowerCase().includes(query)) {
            return true;
          }
          
          // Search in last message
          if (conv.lastMessage && conv.lastMessage.content && 
              conv.lastMessage.content.toLowerCase().includes(query)) {
            return true;
          }
          
          return false;
        });
      }
      
      setFilteredConversations(filtered);
    }
  }, [conversations, searchQuery, selectedTab, currentUser]);
  
  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
      setFilteredConversations(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get the other participant for each conversation
  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(
      participant => participant._id !== currentUser._id
    );
  };
  
  // Format timestamp to show either time or date
  const formatTime = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      // Today, show time
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      // Yesterday
      return 'Yesterday';
    } else {
      // Other days, show date
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Loading conversations...</p>
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
          onClick={() => navigate('/dashboard')}
          className="text-blue-500 hover:underline"
        >
          &larr; Back to Dashboard
        </button>
      </div>
    );
  }
  
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  
  return (
    <div className="max-w-4xl mx-auto mt-20">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="bg-blue-500 text-white p-4">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        
        {/* Tabs and Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1.5 rounded-full transition ${
                  selectedTab === 'all' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleTabChange('all')}
              >
                All
              </button>
              <button
                className={`px-3 py-1.5 rounded-full transition flex items-center ${
                  selectedTab === 'unread' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleTabChange('unread')}
              >
                Unread
                {totalUnread > 0 && (
                  <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalUnread}
                  </span>
                )}
              </button>
              <button
                className={`px-3 py-1.5 rounded-full transition ${
                  selectedTab === 'orders' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => handleTabChange('orders')}
              >
                Orders
              </button>
            </div>
            
            <div className="relative w-full md:w-60">
              <input
                type="text"
                className="w-full bg-gray-100 border border-gray-300 rounded-full pl-10 pr-10 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={clearSearch}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            {conversations.length === 0 ? (
              <>
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-500 mb-4">You don't have any messages yet.</p>
                <Link
                  to="/dashboard"
                  className="text-blue-500 hover:underline"
                >
                  &larr; Back to Dashboard
                </Link>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-500 mb-4">No conversations found matching your search criteria.</p>
                <button
                  onClick={clearSearch}
                  className="text-blue-500 hover:underline"
                >
                  Clear search
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredConversations.map(conversation => {
              const otherParticipant = getOtherParticipant(conversation);
              const hasUnread = conversation.unreadCount > 0;
              
              return (
                <Link
                  key={conversation._id}
                  to={`/messages/${conversation._id}`}
                  className={`block p-4 hover:bg-gray-50 transition ${hasUnread ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-4 overflow-hidden">
                        {otherParticipant?.profileImage ? (
                          <img
                            src={otherParticipant.profileImage}
                            alt={otherParticipant.username}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          otherParticipant?.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      {hasUnread && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className={`text-sm font-medium truncate ${hasUnread ? 'text-blue-700 font-semibold' : 'text-gray-900'}`}>
                          {otherParticipant?.username}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatTime(conversation.updatedAt)}
                        </span>
                      </div>
                      
                      {conversation.order && (
                        <div className="flex items-center mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            conversation.order.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : conversation.order.status === 'in_progress' 
                            ? 'bg-blue-100 text-blue-800' 
                            : conversation.order.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : conversation.order.status === 'under_review'
                            ? 'bg-purple-100 text-purple-800'  
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          Order: {conversation.order.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500 ml-2 truncate">
                          {conversation.order.title}
                        </span>
                      </div>
                    )}
                    
                    <p className={`text-sm truncate mt-1 ${hasUnread ? 'text-gray-900' : 'text-gray-500'}`}>
                      {conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.sender._id === currentUser._id && "You: "}
                          {conversation.lastMessage.content ? (
                            conversation.lastMessage.content
                          ) : (
                            conversation.lastMessage.attachments?.length ? (
                              `${conversation.lastMessage.attachments.length} attachment${conversation.lastMessage.attachments.length !== 1 ? 's' : ''}`
                            ) : 'Empty message'
                          )}
                        </>
                      ) : (
                        'No messages yet'
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  </div>
);
};

export default Messages;