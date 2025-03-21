// File: routes/messages.js - Updated for better reliability
const router = require('express').Router();
const Message = require('../models/Message');
const Thread = require('../models/Thread');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Order = require('../models/Order');
const { verifyToken } = require('../middleware/auth');

// Get or create conversation for an order
router.get('/conversation/order/:orderId', verifyToken, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is part of the order
    if (order.client.toString() !== req.user.id && order.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not part of this order' });
    }
    
    // Find existing conversation or create new one
    let conversation = await Conversation.findOne({ order: req.params.orderId });
    
    if (!conversation) {
      conversation = new Conversation({
        participants: [order.client, order.freelancer],
        order: order._id
      });
      
      await conversation.save();
    }
    
    // Populate participant information
    await conversation.populate('participants', 'username profileImage');
    await conversation.populate('order', 'title status');
    
    res.status(200).json(conversation);
  } catch (err) {
    next(err);
  }
});

// Get or create a direct conversation with another user
router.get('/conversation/user/:userId', verifyToken, async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;
    
    // Don't allow conversations with yourself
    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'Cannot create a conversation with yourself' });
    }
    
    // Verify the target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find existing conversation between these two users
    // Note: We need to find any conversation between these users, regardless of order or order association
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, targetUserId] },
      // Don't add order filter here to find general conversations too
    });
    
    // If no conversation exists, create a new one
    if (!conversation) {
      conversation = new Conversation({
        participants: [currentUserId, targetUserId]
      });
      
      await conversation.save();
      
      // Create a general thread for the new conversation
      const generalThread = new Thread({
        conversation: conversation._id,
        type: 'general',
        title: 'General'
      });
      
      await generalThread.save();
    }
    
    // Populate participant information
    await conversation.populate('participants', 'username profileImage');
    
    // Return the conversation
    res.status(200).json(conversation);
  } catch (err) {
    next(err);
  }
});

// Get all conversations for current user
router.get('/conversations', verifyToken, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
    .populate('participants', 'username profileImage')
    .populate({
      path: 'order',
      select: 'title status gig job',
      populate: [
        { path: 'gig', select: 'title' },
        { path: 'job', select: 'title' }
      ]
    })
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .exec();
    
    // Add unread count for each conversation
    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conversation) => {
        // Find all unread messages in this conversation sent by other participants
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          sender: { $ne: req.user.id },
          isRead: false
        });
        
        return {
          ...conversation.toObject(),
          unreadCount
        };
      })
    );
    
    res.status(200).json(conversationsWithUnreadCount);
  } catch (err) {
    next(err);
  }
});

// Get a specific conversation
router.get('/conversation/:conversationId', verifyToken, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate('participants', 'username profileImage email')
      .populate({
        path: 'order',
        select: 'title status gig job client freelancer',
        populate: [
          { path: 'gig', select: 'title' },
          { path: 'job', select: 'title' },
          { path: 'client', select: 'username profileImage' },
          { path: 'freelancer', select: 'username profileImage' }
        ]
      })
      .exec();
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is part of the conversation
    if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied: You are not part of this conversation' });
    }
    
    res.status(200).json(conversation);
  } catch (err) {
    next(err);
  }
});

// Send message in a conversation (this is a fallback, threads are preferred)
router.post('/conversation/:conversationId', verifyToken, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is part of the conversation
    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied: You are not part of this conversation' });
    }
    
    // Get or create a general thread for this conversation
    let thread = await Thread.findOne({ 
      conversation: conversation._id,
      type: 'general'
    });
    
    if (!thread) {
      thread = new Thread({
        conversation: conversation._id,
        type: 'general',
        title: 'General'
      });
      
      await thread.save();
    }
    
    // Create new message in the general thread
    const newMessage = new Message({
      conversation: conversation._id,
      thread: thread._id,
      sender: req.user.id,
      content: req.body.content,
      attachments: req.body.attachments || []
    });
    
    const savedMessage = await newMessage.save();
    
    // Populate sender info
    await savedMessage.populate('sender', 'username profileImage');
    
    // Update thread with last message and update time
    thread.lastMessage = savedMessage._id;
    thread.updatedAt = new Date();
    await thread.save();
    
    // Update conversation last message and update time
    conversation.lastMessage = savedMessage._id;
    conversation.updatedAt = new Date();
    await conversation.save();
    
    res.status(201).json(savedMessage);
  } catch (err) {
    next(err);
  }
});

// Get all threads for a conversation
router.get('/conversation/:conversationId/threads', verifyToken, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is part of the conversation
    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied: You are not part of this conversation' });
    }
    
    const threads = await Thread.find({ conversation: req.params.conversationId })
      .populate('lastMessage')
      .populate('order', 'title status')
      .populate('gig', 'title')
      .sort({ updatedAt: -1 })
      .exec();
    
    res.status(200).json(threads);
  } catch (err) {
    next(err);
  }
});

// Get or create a general thread for a conversation
router.get('/conversation/:conversationId/thread/general', verifyToken, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is part of the conversation
    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied: You are not part of this conversation' });
    }
    
    // Find or create general thread
    let thread = await Thread.findOne({ 
      conversation: req.params.conversationId,
      type: 'general'
    });
    
    if (!thread) {
      thread = new Thread({
        conversation: req.params.conversationId,
        type: 'general',
        title: 'General'
      });
      
      await thread.save();
    }
    
    res.status(200).json(thread);
  } catch (err) {
    next(err);
  }
});

// Get or create order thread
router.get('/conversation/:conversationId/thread/order/:orderId', verifyToken, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    const order = await Order.findById(req.params.orderId);
    
    if (!conversation || !order) {
      return res.status(404).json({ message: !conversation ? 'Conversation not found' : 'Order not found' });
    }
    
    // Check if user is part of the conversation
    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied: You are not part of this conversation' });
    }
    
    // Check if user is part of the order
    if (order.client.toString() !== req.user.id && order.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not part of this order' });
    }
    
    // Find or create order thread
    let thread = await Thread.findOne({ 
      conversation: req.params.conversationId,
      type: 'order',
      order: req.params.orderId
    });
    
    if (!thread) {
      thread = new Thread({
        conversation: req.params.conversationId,
        type: 'order',
        order: req.params.orderId,
        title: `Order: ${order.title}`
      });
      
      await thread.save();
    }
    
    res.status(200).json(thread);
  } catch (err) {
    next(err);
  }
});

// Send message in a thread
router.post('/thread/:threadId', verifyToken, async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.threadId).populate('conversation');
    
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    const conversation = thread.conversation;
    
    // Check if user is part of the conversation
    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied: You are not part of this conversation' });
    }
    
    // Create new message
    const newMessage = new Message({
      conversation: conversation._id,
      thread: thread._id,
      sender: req.user.id,
      content: req.body.content,
      attachments: req.body.attachments || []
    });
    
    const savedMessage = await newMessage.save();
    
    // Populate sender info
    await savedMessage.populate('sender', 'username profileImage');
    
    // Update thread with last message and update time
    thread.lastMessage = savedMessage._id;
    thread.updatedAt = new Date();
    await thread.save();
    
    // Update conversation last message and update time
    conversation.lastMessage = savedMessage._id;
    conversation.updatedAt = new Date();
    await conversation.save();
    
    res.status(201).json(savedMessage);
  } catch (err) {
    next(err);
  }
});

// Get messages for a thread
router.get('/thread/:threadId/messages', verifyToken, async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.threadId).populate('conversation');
    
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    const conversation = thread.conversation;
    
    // Check if user is part of the conversation
    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied: You are not part of this conversation' });
    }
    
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * parseInt(limit);
    
    const messages = await Message.find({ thread: req.params.threadId })
      .populate('sender', 'username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();
    
    // Mark messages as read if sent by the other user
    await Message.updateMany(
      { 
        thread: req.params.threadId,
        sender: { $ne: req.user.id },
        isRead: false
      },
      { isRead: true }
    );
    
    const totalMessages = await Message.countDocuments({ thread: req.params.threadId });
    
    res.status(200).json({
      messages: messages.reverse(), // Return in chronological order
      totalMessages,
      totalPages: Math.ceil(totalMessages / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (err) {
    next(err);
  }
});

// Mark messages as read
router.patch('/thread/:threadId/read', verifyToken, async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.threadId).populate('conversation');
    
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    
    const conversation = thread.conversation;
    
    // Check if user is part of the conversation
    if (!conversation.participants.some(p => p.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied: You are not part of this conversation' });
    }
    
    // Mark all messages in this thread as read if they were sent by others
    const result = await Message.updateMany(
      { 
        thread: req.params.threadId,
        sender: { $ne: req.user.id },
        isRead: false
      },
      { isRead: true }
    );
    
    res.status(200).json({ 
      success: true, 
      messagesRead: result.nModified 
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;