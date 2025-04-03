// client/src/utils/simplifiedMessagingService.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from './api';

// Create a messaging context
const MessagingContext = createContext(null);

export const MessagingProvider = ({ children }) => {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch messages for the active thread
  const fetchMessages = useCallback(async (threadId, page = 1, showLoading = true) => {
    if (!threadId) return null;
    
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      
      const response = await api.get(`/messages/thread/${threadId}/messages?page=${page}`);
      
      if (response.data) {
        if (page === 1) {
          // First page, replace all messages
          setMessages(response.data.messages || []);
        } else {
          // Subsequent pages, prepend to existing messages
          setMessages(prev => [...response.data.messages || [], ...prev]);
        }
        
        // Set pagination info
        setTotalPages(response.data.totalPages || 1);
        setHasMore(page < (response.data.totalPages || 1));
        
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
      return null;
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  // Set active conversation and thread
  const setActiveChat = useCallback((conversationId, threadId) => {
    setActiveConversationId(conversationId);
    setActiveThreadId(threadId);
    
    // Clear existing messages when changing conversation/thread
    setMessages([]);
    setTotalPages(1);
    setHasMore(false);
    
    // Clear any existing polling interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Clean up polling when component unmounts
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Send a message
  const sendMessage = useCallback(async (content, attachments = []) => {
    if (!activeThreadId || !content.trim() && attachments.length === 0) return null;
    
    try {
      const response = await api.post(`/messages/thread/${activeThreadId}`, {
        content: content.trim(),
        attachments
      });
      
      // Add the new message to the current messages
      if (response.data) {
        setMessages(prev => [...prev, response.data]);
        
        // Fetch messages right after sending to ensure consistency
        setTimeout(() => {
          fetchMessages(activeThreadId, 1, false);
        }, 500);
      }
      
      return response.data;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      return null;
    }
  }, [activeThreadId, fetchMessages]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async (page) => {
    if (!activeThreadId) return null;
    
    const result = await fetchMessages(activeThreadId, page);
    if (result) {
      setHasMore(page < result.totalPages);
      return result;
    }
    return null;
  }, [activeThreadId, fetchMessages]);

  // Get or create a conversation thread
  const getOrCreateThread = useCallback(async (conversationId, type, entityId = null) => {
    try {
      let endpoint;
      
      if (type === 'general') {
        endpoint = `/messages/conversation/${conversationId}/thread/general`;
      } else if (type === 'order' && entityId) {
        endpoint = `/messages/conversation/${conversationId}/thread/order/${entityId}`;
      } else if (type === 'gig' && entityId) {
        endpoint = `/messages/conversation/${conversationId}/thread/gig/${entityId}`;
      } else {
        throw new Error('Invalid thread type or missing entity ID');
      }
      
      const response = await api.get(endpoint);
      return response.data;
    } catch (err) {
      console.error('Error getting thread:', err);
      setError('Failed to get or create thread');
      return null;
    }
  }, []);

  // Clean up when changing conversations
  useEffect(() => {
    // When activeThreadId changes, fetch messages right away
    if (activeThreadId) {
      fetchMessages(activeThreadId);
      
      // Set up polling for new messages
      const interval = setInterval(() => {
        fetchMessages(activeThreadId, 1, false);
      }, 3000);
      
      setPollingInterval(interval);
      
      return () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      };
    }
  }, [activeThreadId, fetchMessages]);

  // Context value
  const value = {
    activeConversationId,
    activeThreadId,
    messages,
    isLoading,
    error,
    hasMore,
    totalPages,
    setActiveChat,
    sendMessage,
    loadMoreMessages,
    getOrCreateThread
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

// Custom hook to use the messaging context
export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};