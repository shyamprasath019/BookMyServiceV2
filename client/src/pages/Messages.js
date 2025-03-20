// client/src/pages/Messages.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useWebSocketContext } from '../utils/websocketService';
import api from '../utils/api';

const Messages = () => {
  const { currentUser } = useContext(AuthContext);
  const { lastMessage, isConnected } = useWebSocketContext();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByType, setFilterByType] = useState('all'); // 'all', 'direct', 'orders', 'gigs', 'jobs'
  const [activeCategory, setActiveCategory] = useState('all'); // 'all', 'unread', 'archived'
  
  useEffect(() => {
    fetchConversations();
  }, []);
  
  // Refetch when new message received through WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'new_message') {
      // Refresh conversation list to update last message and unread count
      fetchConversations();
    }
  }, [lastMessage]);
  
  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/messages/conversations');
      
      if (response.data && Array.isArray(response.data)) {
        // Sort conversations by most recent first
        const sortedConversations = response.data.sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        
        setConversations(sortedConversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.response?.data?.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter conversations based on search and type filters
  const filteredConversations = conversations.filter(conversation => {
    // First filter by category (all, unread, archived)
    if (activeCategory === 'unread' && !(conversation.unreadCount > 0)) {
      return false;
    }
    if (activeCategory === 'archived' && !conversation.isArchived) {
      return false;
    }
    
    // Then filter by type (all, direct, orders, gigs, jobs)
    if (filterByType === 'direct' && conversation.order) {
      return false;
    }
    if (filterByType === 'orders' && !conversation.order) {
      return false;
    }
    if (filterByType === 'gigs' && (!conversation.order || !conversation.order.gig)) {
      return false;
    }
    if (filterByType === 'jobs' && (!conversation.order || !conversation.order.job)) {
      return false;
    }
    
    // Finally, filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      // Search in other participant's username
      const otherParticipant = conversation.participants.find(
        p => p._id !== currentUser._id
      );
      
      if (otherParticipant?.username.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in order title
      if (conversation.order && conversation.order.title.toLowerCase().includes(query)) {
        return true;
      }
      
      // Search in last message
      if (conversation.lastMessage?.content?.toLowerCase().includes(query)) {
        return true;
      }
      
      return false;
    }
    
    return true;
  });
  
  // Get the other participant in a conversation
  const getOtherParticipant = (conversation) => {
    return conversation.participants.find(p => p._id !== currentUser._id) || { 
      username: 'User', 
      profileImage: null 
    };
  };
  
  // Format timestamp for last message
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
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

  // Get conversation type badge
  const getConversationBadge = (conversation) => {
    if (!conversation.order) {
      return { label: 'Direct', color: 'bg-gray-100 text-gray-700' };
    }
    
    if (conversation.order) {
      // Check if it's a gig or job order
      if (conversation.order.gig) {
        return { label: 'Gig', color: 'bg-blue-100 text-blue-700' };
      } else if (conversation.order.job) {
        return { label: 'Job', color: 'bg-purple-100 text-purple-700' };
      } else {
        return { label: 'Order', color: 'bg-green-100 text-green-700' };
      }
    }
    
    return { label: '', color: '' };
  };
  
  // Get order status badge
  const getOrderStatusBadge = (status) => {
    if (!status) return { color: '', text: '' };
    
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' };
      case 'in_progress':
        return { color: 'bg-blue-100 text-blue-800', text: 'In Progress' };
      case 'under_review':
        return { color: 'bg-purple-100 text-purple-800', text: 'Under Review' };
      case 'completed':
        return { color: 'bg-green-100 text-green-800', text: 'Completed' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', text: 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: status };
    }
  };
  
  // Create a new direct conversation with a user
  const startNewConversation = async () => {
    const userId = prompt('Enter user ID to start conversation:');
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const response = await api.get(`/messages/conversation/user/${userId}`);
      
      if (response.data && response.data._id) {
        navigate(`/messages/${response.data._id}`);
      }
    } catch (err) {
      setError('Failed to start conversation. Make sure the user ID is valid.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle filter by conversation type
  const handleFilterChange = (filterType) => {
    setFilterByType(filterType);
  };
  
  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  // Calculate total unread messages
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Messages</h1>
          
          {/* Connection indicator */}
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        
        {/* Filters Section */}
        <div className="border-b border-gray-200">
          <div className="p-4 flex flex-col gap-4">
            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleCategoryChange('unread')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center ${
                  activeCategory === 'unread' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread
                {totalUnread > 0 && (
                  <span className={`ml-1.5 text-xs rounded-full ${
                    activeCategory === 'unread' ? 'bg-white text-blue-700' : 'bg-blue-500 text-white'
                  } w-5 h-5 flex items-center justify-center`}>
                    {totalUnread}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleCategoryChange('archived')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === 'archived' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Archived
              </button>
            </div>
            
            {/* Types filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filterByType === 'all' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => handleFilterChange('direct')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filterByType === 'direct' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Direct
              </button>
              <button
                onClick={() => handleFilterChange('orders')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filterByType === 'orders' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => handleFilterChange('gigs')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filterByType === 'gigs' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Gigs
              </button>
              <button
                onClick={() => handleFilterChange('jobs')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filterByType === 'jobs' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Jobs
              </button>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={startNewConversation}
                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Conversation
              </button>
            </div>
          </div>
        </div>
        
        {/* Conversation List */}
        <div className="divide-y max-h-[calc(100vh-320px)] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-500">Loading conversations...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500 mb-2">{error}</div>
              <button 
                onClick={fetchConversations}
                className="text-blue-500 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              {conversations.length === 0 ? (
                <div>
                  <div className="text-5xl mb-4">💬</div>
                  <p className="text-gray-500 mb-4">No conversations yet</p>
                  <p className="text-gray-500 mb-4">
                    Start a conversation with a freelancer or client to begin messaging!
                  </p>
                  <button
                    onClick={startNewConversation}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Start New Conversation
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-gray-500 mb-4">No conversations match your filters</p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterByType('all');
                        setActiveCategory('all');
                      }}
                      className="text-blue-500 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            filteredConversations.map(conversation => {
              const otherParticipant = getOtherParticipant(conversation);
              const hasUnread = (conversation.unreadCount || 0) > 0;
              const badge = getConversationBadge(conversation);
              const statusBadge = conversation.order ? 
                getOrderStatusBadge(conversation.order.status) : null;
              
              return (
                <Link
                  key={conversation._id}
                  to={`/messages/${conversation._id}`}
                  className={`block hover:bg-gray-50 transition-colors ${hasUnread ? 'bg-blue-50' : 'bg-white'}`}
                >
                  <div className="p-4">
                    <div className="flex">
                      {/* User avatar with unread indicator */}
                      <div className="relative mr-3">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500">
                          {otherParticipant.profileImage ? (
                            <img 
                              src={otherParticipant.profileImage} 
                              alt={otherParticipant.username} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-semibold">
                              {otherParticipant.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {hasUnread && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>
                      
                      {/* Conversation details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className={`font-medium truncate ${hasUnread ? 'font-semibold' : ''}`}>
                              {otherParticipant.username}
                            </h3>
                            
                            {/* Badges for conversation type and status */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                                {badge.label}
                              </span>
                              
                              {statusBadge && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                                  {statusBadge.text}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Timestamp */}
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.updatedAt)}
                          </span>
                        </div>
                        
                        {/* Order title if exists */}
                        {conversation.order && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversation.order.title}
                          </p>
                        )}
                        
                        {/* Last message preview */}
                        <p className={`text-sm truncate mt-1 ${hasUnread ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                          {conversation.lastMessage ? (
                            conversation.lastMessage.sender === currentUser._id ? (
                              <span className="text-gray-400">You: </span>
                            ) : null
                          ) : null}
                          
                          {conversation.lastMessage ? (
                            conversation.lastMessage.content || (
                              conversation.lastMessage.attachments?.length ? (
                                `[${conversation.lastMessage.attachments.length} attachment${
                                  conversation.lastMessage.attachments.length !== 1 ? 's' : ''
                                }]`
                              ) : 'Empty message'
                            )
                          ) : (
                            <span className="italic">No messages yet</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;