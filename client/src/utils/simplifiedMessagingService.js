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

  // Fetch messages for the active thread
  const fetchMessages = useCallback(async (threadId, page = 1) => {
    if (!threadId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(`/messages/thread/${threadId}/messages?page=${page}`);
      
      if (page === 1) {
        // First page, replace all messages
        setMessages(response.data.messages);
      } else {
        // Subsequent pages, prepend to existing messages
        setMessages(prev => [...response.data.messages, ...prev]);
      }
      
      return response.data;
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set active conversation and thread
  const setActiveChat = useCallback((conversationId, threadId) => {
    setActiveConversationId(conversationId);
    setActiveThreadId(threadId);
    
    // Clear existing messages when changing conversation/thread
    setMessages([]);
    
    // Start polling for new messages
    if (threadId) {
      // Clear any existing polling interval
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      
      // Fetch messages immediately
      fetchMessages(threadId);
      
      // Then set up polling every 5 seconds
      const interval = setInterval(() => {
        fetchMessages(threadId);
      }, 5000);
      
      setPollingInterval(interval);
    }
  }, [fetchMessages, pollingInterval]);

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
    if (!activeThreadId || !content.trim()) return null;
    
    try {
      const response = await api.post(`/messages/thread/${activeThreadId}`, {
        content: content.trim(),
        attachments
      });
      
      // Add the new message to the current messages
      setMessages(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      return null;
    }
  }, [activeThreadId]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async (page) => {
    if (!activeThreadId) return null;
    return fetchMessages(activeThreadId, page);
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
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      setActiveThreadId(null);
      setMessages([]);
    };
  }, [activeConversationId]);

  // Context value
  const value = {
    activeConversationId,
    activeThreadId,
    messages,
    isLoading,
    error,
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