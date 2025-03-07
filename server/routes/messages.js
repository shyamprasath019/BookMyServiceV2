// File: routes/messages.js
const router = require('express').Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
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
    .populate('order', 'title status')
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .exec();
    
    res.status(200).json(conversations);
  } catch (err) {
    next(err);
  }
});

// Send message in a conversation
router.post('/conversation/:conversationId', verifyToken, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is part of the conversation
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied: You are not part of this conversation' });
    }
    
    // Create new message
    const newMessage = new Message({
      conversation: conversation._id,
      sender: req.user.id,
      content: req.body.content,
      attachments: req.body.attachments || []
    });
    
    const savedMessage = await newMessage.save();
    
    // Update conversation with last message and update time
    conversation.lastMessage = savedMessage._id;
    conversation.updatedAt = new Date();
    await conversation.save();
    
    res.status(201).json(savedMessage);
  } catch (err) {
    next(err);
  }
});

// Get messages for a conversation
router.get('/conversation/:conversationId/messages', verifyToken, async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is part of the conversation
    if (!conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied: You are not part of this conversation' });
    }
    
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();
    
    // Mark messages as read if sent by the other user
    await Message.updateMany(
      { 
        conversation: req.params.conversationId,
        sender: { $ne: req.user.id },
        isRead: false
      },
      { isRead: true }
    );
    
    const totalMessages = await Message.countDocuments({ conversation: req.params.conversationId });
    
    res.status(200).json({
      messages: messages.reverse(), // Return in chronological order
      totalMessages,
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;