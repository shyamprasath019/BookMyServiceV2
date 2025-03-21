// client/src/utils/websocketService.js
import React, { createContext, useEffect, useState, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// WebSocket connection URL
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5001';

// Create a new WebSocket service hook
export const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const { currentUser } = useContext(AuthContext);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!currentUser || !currentUser._id) return;
    
    // Create new WebSocket connection with authentication token
    const token = localStorage.getItem('token');
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    
    // Connection opened
    ws.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      
      // Send authentication message
      ws.send(JSON.stringify({
        type: 'authenticate',
        userId: currentUser._id
      }));
    };
    
    // Connection closed
    ws.onclose = (event) => {
      console.log('WebSocket Disconnected', event.code, event.reason);
      setIsConnected(false);
      
      // Attempt to reconnect after 3 seconds if not closed intentionally
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          // The effect cleanup will remove the old socket, and this effect will run again
        }, 3000);
      }
    };
    
    // Connection error
    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };
    
    // Listen for messages
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };
    
    // Set socket state
    setSocket(ws);
    
    // Clean up on unmount
    return () => {
      if (ws) {
        ws.close(1000, 'Component unmounted');
      }
    };
  }, [currentUser]);
  
  // Send message through WebSocket
  const sendMessage = useCallback((data) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, [socket, isConnected]);
  
  // Join a conversation room
  const joinConversation = useCallback((conversationId) => {
    if (!conversationId) return false;
    
    return sendMessage({
      type: 'join_conversation',
      conversationId
    });
  }, [sendMessage]);
  
  // Leave a conversation room
  const leaveConversation = useCallback((conversationId) => {
    if (!conversationId) return false;
    
    return sendMessage({
      type: 'leave_conversation',
      conversationId
    });
  }, [sendMessage]);
  
  // Send a chat message
  const sendChatMessage = useCallback((conversationId, content, attachments = []) => {
    if (!conversationId || !content) return false;
    
    return sendMessage({
      type: 'chat_message',
      conversationId,
      content,
      attachments
    });
  }, [sendMessage]);
  
  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage,
    joinConversation,
    leaveConversation,
    sendChatMessage
  };
};

// Create a WebSocket context for app-wide access
const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const wsService = useWebSocket();
  
  return (
    <WebSocketContext.Provider value={wsService}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  return useContext(WebSocketContext);
};