// server/websocket.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');

// User connection map
const clients = new Map();
// Conversation subscriptions
const conversationSubscriptions = new Map();

function setupWebSocketServer(server) {
  // Create WebSocket server
  const wss = new WebSocket.Server({ 
    server,
    // This path should match client-side connection URL 
    path: '/ws'
  });
  
  console.log('WebSocket Server initialized');
  
  // Handle new connections
  wss.on('connection', async (ws, req) => {
    const query = url.parse(req.url, true).query;
    let userId = null;
    
    // Verify JWT token from query parameter
    if (query.token) {
      try {
        const decoded = jwt.verify(query.token, process.env.JWT_SECRET);
        userId = decoded.id;
        
        // Store client connection with userId for later use
        clients.set(userId, ws);
        console.log(`User ${userId} connected to WebSocket`);
      } catch (err) {
        console.error('Invalid token:', err.message);
        ws.close(4001, 'Authentication failed');
        return;
      }
    } else {
      ws.close(4000, 'No authentication token provided');
      return;
    }
    
    // Define custom properties
    ws.isAlive = true;
    ws.userId = userId;
    ws.subscribedConversations = new Set();
    
    // Setup ping interval to keep connection alive
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle messages from client
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'authenticate':
            // Already authenticated via token
            break;
            
          case 'join_conversation':
            await handleJoinConversation(ws, data);
            break;
            
          case 'leave_conversation':
            handleLeaveConversation(ws, data);
            break;
            
          case 'chat_message':
            await handleChatMessage(ws, data);
            break;
            
          default:
            console.warn(`Unknown message type: ${data.type}`);
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
        
        // Send error back to client
        ws.send(JSON.stringify({
          type: 'error',
          message: err.message
        }));
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log(`User ${userId} disconnected from WebSocket`);
      
      // Clean up subscriptions
      if (ws.subscribedConversations.size > 0) {
        for (const conversationId of ws.subscribedConversations) {
          handleLeaveConversation(ws, { conversationId });
        }
      }
      
      // Remove from clients map
      clients.delete(userId);
    });
    
    // Send initial connection success message
    ws.send(JSON.stringify({
      type: 'connection_established',
      userId
    }));
  });
  
  // Set up a heartbeat interval to detect and clean up dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds
  
  // Clear interval when server closes
  wss.on('close', () => {
    clearInterval(interval);
  });
  
  return wss;
}

// Handle joining a conversation
async function handleJoinConversation(ws, data) {
  const { conversationId } = data;
  
  // Verify conversation exists and user is a participant
  const conversation = await Conversation.findById(conversationId);
  
  if (!conversation) {
    throw new Error('Conversation not found');
  }
  
  // Check if user is a participant in this conversation
  if (!conversation.participants.some(p => p.toString() === ws.userId)) {
    throw new Error('Not authorized to join this conversation');
  }
  
  // Add user to conversation subscriptions
  if (!conversationSubscriptions.has(conversationId)) {
    conversationSubscriptions.set(conversationId, new Set());
  }
  
  conversationSubscriptions.get(conversationId).add(ws.userId);
  ws.subscribedConversations.add(conversationId);
  
  // Mark messages as read when joining a conversation
  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: ws.userId },
      isRead: false
    },
    { isRead: true }
  );
  
  // Notify user they've joined the conversation
  ws.send(JSON.stringify({
    type: 'joined_conversation',
    conversationId
  }));
  
  console.log(`User ${ws.userId} joined conversation ${conversationId}`);
}

// Handle leaving a conversation
function handleLeaveConversation(ws, data) {
  const { conversationId } = data;
  
  // Remove user from conversation subscriptions
  if (conversationSubscriptions.has(conversationId)) {
    conversationSubscriptions.get(conversationId).delete(ws.userId);
    
    // Cleanup empty conversation subscriptions
    if (conversationSubscriptions.get(conversationId).size === 0) {
      conversationSubscriptions.delete(conversationId);
    }
  }
  
  ws.subscribedConversations.delete(conversationId);
  
  // Notify user they've left the conversation
  ws.send(JSON.stringify({
    type: 'left_conversation',
    conversationId
  }));
  
  console.log(`User ${ws.userId} left conversation ${conversationId}`);
}

// Handle chat messages
async function handleChatMessage(ws, data) {
  const { conversationId, content, attachments = [] } = data;
  
  // Validate required fields
  if (!conversationId || !content) {
    throw new Error('Missing required fields');
  }
  
  // Create and save message to database
  const newMessage = new Message({
    conversation: conversationId,
    sender: ws.userId,
    content,
    attachments,
    isRead: false
  });
  
  const savedMessage = await newMessage.save();
  
  // Populate sender information for the response
  const populatedMessage = await Message.findById(savedMessage._id)
    .populate('sender', 'username profileImage');
  
  // Update conversation's last message and time
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: savedMessage._id,
    updatedAt: new Date()
  });
  
  // Create message payload to send
  const messagePayload = {
    type: 'new_message',
    conversationId,
    message: {
      _id: populatedMessage._id,
      sender: populatedMessage.sender,
      content: populatedMessage.content,
      attachments: populatedMessage.attachments,
      isRead: populatedMessage.isRead,
      createdAt: populatedMessage.createdAt
    }
  };
  
  // Send message to all subscribed clients
  if (conversationSubscriptions.has(conversationId)) {
    conversationSubscriptions.get(conversationId).forEach(userId => {
      const userWs = clients.get(userId);
      
      if (userWs && userWs.readyState === WebSocket.OPEN) {
        // Mark as read immediately if this is the sender
        if (userId === ws.userId) {
          messagePayload.message.isRead = true;
        }
        
        userWs.send(JSON.stringify(messagePayload));
      }
    });
  }
  
  console.log(`Message sent in conversation ${conversationId} by user ${ws.userId}`);
}

// Export notification function to use in other parts of the app
function notifyUser(userId, data) {
  const userWs = clients.get(userId);
  
  if (userWs && userWs.readyState === WebSocket.OPEN) {
    userWs.send(JSON.stringify(data));
    return true;
  }
  
  return false;
}

module.exports = {
  setupWebSocketServer,
  notifyUser
};