// File: client/src/pages/Messages.js
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
  
  useEffect(() => {
    fetchConversations();
  }, []);
  
  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
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
  
  return (
    <div className="max-w-4xl mx-auto mt-20">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="bg-blue-500 text-white p-4">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 mb-4">You don't have any messages yet.</p>
            <Link
              to="/dashboard"
              className="text-blue-500 hover:underline"
            >
              &larr; Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map(conversation => {
              const otherParticipant = getOtherParticipant(conversation);
              return (
                <Link
                  key={conversation._id}
                  to={`/messages/${conversation._id}`}
                  className="block p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-4">
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
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {otherParticipant?.username}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.updatedAt)}
                        </span>
                      </div>
                      
                      {conversation.order && (
                        <p className="text-xs text-gray-500 truncate mb-1">
                          Order: {conversation.order.title}
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage ? (
                          conversation.lastMessage.content || 
                          (conversation.lastMessage.attachments?.length > 0 
                            ? `Sent ${conversation.lastMessage.attachments.length} attachment(s)` 
                            : 'Empty message')
                        ) : (
                          'No messages yet'
                        )}
                      </p>
                    </div>
                    
                    {conversation.order && (
                      <div className="ml-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
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
                          {conversation.order.status.replace('_', ' ')}
                        </span>
                      </div>
                    )}
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