// client/src/components/ThreadList.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ThreadList = ({ conversationId, activeThreadId, onThreadSelect }) => {
  const [threads, setThreads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (conversationId) {
      fetchThreads();
    }
  }, [conversationId]);

  const fetchThreads = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/messages/conversation/${conversationId}/threads`);
      
      setThreads(response.data);
      
      // If there are threads but no active thread, select the first one
      if (response.data.length > 0 && !activeThreadId) {
        onThreadSelect(response.data[0]._id);
      } else if (response.data.length === 0) {
        // If no threads exist, create a general thread
        createGeneralThread();
      }
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError('Failed to load conversation threads');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Function to create a general thread if none exist
  const createGeneralThread = async () => {
    try {
      const response = await api.get(`/messages/conversation/${conversationId}/thread/general`);
      setThreads([response.data]);
      onThreadSelect(response.data._id);
    } catch (err) {
      console.error('Error creating general thread:', err);
      setError('Failed to create conversation thread');
    }
  };

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

  if (error) {
    return (
      <div className="p-2 bg-gray-100 border-b border-gray-200">
        <div className="text-red-500 text-sm">{error}</div>
        <button 
          onClick={fetchThreads}
          className="text-blue-500 text-sm hover:underline"
        >
          Retry
        </button>
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

export default ThreadList;