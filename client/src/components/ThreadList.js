// client/src/components/ThreadList.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ThreadList = ({ conversationId, activeThreadId, onThreadSelect }) => {
  const [threads, setThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (conversationId) {
      fetchThreads();
    }
  }, [conversationId]);

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/messages/conversation/${conversationId}/threads`);
      setThreads(response.data);
      
      // If no active thread is selected and we have threads, select the first one
      if (!activeThreadId && response.data.length > 0) {
        onThreadSelect(response.data[0]._id);
      }
    } catch (err) {
      setError('Failed to load conversation threads');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get thread icon based on type
  const getThreadIcon = (thread) => {
    switch (thread.type) {
      case 'general':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'order':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'gig':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        );
    }
  };
  
  // Get status badge for orders
  const getStatusBadge = (status) => {
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

  if (isLoading) {
    // client/src/components/ThreadList.js (continued)
    return (
        <div className="px-4 py-2 text-center">
          <div className="animate-spin h-5 w-5 mx-auto border-t-2 border-b-2 border-blue-500 rounded-full"></div>
          <p className="text-sm text-gray-500 mt-1">Loading threads...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="px-4 py-2 text-center text-red-500">
          <p>{error}</p>
          <button onClick={fetchThreads} className="text-blue-500 hover:underline mt-1 text-sm">
            Try again
          </button>
        </div>
      );
    }
  
    if (threads.length === 0) {
      return (
        <div className="px-4 py-2 text-center text-gray-500">
          <p>No threads found</p>
        </div>
      );
    }
  
    return (
      <div className="border-t">
        <div className="px-4 py-2 font-medium text-gray-700 bg-gray-50 border-b">
          Conversation Threads
        </div>
        <div className="max-h-48 overflow-y-auto">
          {threads.map((thread) => {
            const isActive = thread._id === activeThreadId;
            const statusBadge = thread.order && getStatusBadge(thread.order.status);
            
            return (
              <div
                key={thread._id}
                onClick={() => onThreadSelect(thread._id)}
                className={`px-4 py-3 flex items-center cursor-pointer hover:bg-gray-50 transition-colors ${
                  isActive ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="text-gray-500 mr-3">
                  {getThreadIcon(thread)}
                </div>
                <div className="flex-grow">
                  <div className="font-medium text-gray-800">
                    {thread.title}
                  </div>
                  {statusBadge && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color} inline-block mt-1`}>
                      {statusBadge.text}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  export default ThreadList;