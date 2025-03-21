// File: routes/orders.js
const router = require('express').Router();
const Order = require('../models/Order');
const Gig = require('../models/Gig');
const Job = require('../models/Job');
const Bid = require('../models/Bid');
const { verifyToken, isActiveClient } = require('../middleware/auth');

// Create order from gig (client only)
router.post('/from-gig/:gigId', verifyToken, isActiveClient , async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.gigId).populate('owner');
    
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }
    
    // Create new order
    const newOrder = new Order({
      client: req.user.id,
      freelancer: gig.owner._id,
      gig: gig._id,
      title: gig.title,
      description: gig.description,
      price: gig.price,
      deliveryTime: gig.deliveryTime,
      deadline: new Date(Date.now() + gig.deliveryTime * 24 * 60 * 60 * 1000) // days to milliseconds
    });
    
    const savedOrder = await newOrder.save();
    
    // Update gig's total orders count
    await Gig.findByIdAndUpdate(req.params.gigId, {
      $inc: { totalOrders: 1 }
    });
    
    res.status(201).json(savedOrder);
  } catch (err) {
    next(err);
  }
});

// Create order from bid (client only)
router.post('/from-bid/:bidId', verifyToken, isActiveClient , async (req, res, next) => {
  try {
    const bid = await Bid.findById(req.params.bidId)
      .populate('job')
      .populate('freelancer');
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    // Check if user is the job owner
    if (bid.job.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only accept bids for your own jobs' });
    }
    
    // Create new order
    const newOrder = new Order({
      client: req.user.id,
      freelancer: bid.freelancer._id,
      job: bid.job._id,
      bid: bid._id,
      title: bid.job.title,
      description: bid.job.description,
      price: bid.amount,
      deliveryTime: bid.deliveryTime,
      deadline: new Date(Date.now() + bid.deliveryTime * 24 * 60 * 60 * 1000) // days to milliseconds
    });
    
    const savedOrder = await newOrder.save();
    
    // Update bid status
    await Bid.findByIdAndUpdate(req.params.bidId, {
        status: 'accepted'
      });
      
      // Set job to inactive (since a bid was accepted)
      await Job.findByIdAndUpdate(bid.job._id, {
        isActive: false
      });
      
      res.status(201).json(savedOrder);
    } catch (err) {
      next(err);
    }
  });
  
  // Get all orders for current user (as client or freelancer)
  router.get('/', verifyToken, async (req, res, next) => {
    try {
      const { role, status } = req.query;
      
      const query = {};
      
      // Filter by role
      if (role === 'client') {
        query.client = req.user.id;
      } else if (role === 'freelancer') {
        query.freelancer = req.user.id;
      } else {
        // If no role specified, get both client and freelancer orders
        query.$or = [{ client: req.user.id }, { freelancer: req.user.id }];
      }
      
      // Filter by status
      if (status) {
        query.status = status;
      }
      
      const orders = await Order.find(query)
        .populate('client', 'username profileImage')
        .populate('freelancer', 'username profileImage')
        .populate('gig', 'title')
        .populate('job', 'title')
        .sort({ createdAt: -1 })
        .exec();
      
      res.status(200).json(orders);
    } catch (err) {
      next(err);
    }
  });
  
  // Get a specific order
  router.get('/:id', verifyToken, async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id)
        .populate('client', 'username profileImage email')
        .populate('freelancer', 'username profileImage email')
        .populate('gig')
        .populate('job')
        .populate('bid')
        .exec();
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Check if user is part of the order
      if (order.client._id.toString() !== req.user.id && order.freelancer._id.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied: You are not part of this order' });
      }
      
      res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  });
  
 // Update order status (based on role)
 router.patch('/:id/status', verifyToken, async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is part of the order
    if (order.client.toString() !== req.user.id && order.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not part of this order' });
    }
    
    // Apply status change based on role and current status
    if (req.user.id === order.freelancer.toString()) {
      // Freelancer actions
      if (status === 'in_progress' && order.status === 'pending') {
        order.status = 'in_progress';
      } else if (status === 'completed' && order.status === 'in_progress') {
        order.status = 'under_review';
        order.completedAt = new Date();
      } else {
        return res.status(400).json({ message: 'Invalid status change for freelancer' });
      }
    } else if (req.user.id === order.client.toString()) {
      // Client actions
      if (status === 'cancelled' && ['pending', 'in_progress'].includes(order.status)) {
        // Check if payment is in escrow before allowing cancellation
        if (order.paymentStatus !== 'in_escrow') {
          // If there's no payment yet, just allow cancellation
          if (order.paymentStatus === 'pending') {
            order.status = 'cancelled';
          } else {
            return res.status(400).json({ 
              message: 'Order cannot be cancelled at this stage of payment process'
            });
          }
        } else {
          order.status = 'cancelled';
          // Note: Refund will be handled by separate endpoint
        }
      } else if (status === 'completed' && order.status === 'under_review') {
        order.status = 'completed';
        
        // Update payment status to released if needed
        if (order.paymentStatus === 'in_escrow') {
          order.paymentStatus = 'released';
        }
      } else if (status === 'in_progress' && order.status === 'under_review') {
        // Allow client to request revisions, changing status back to in_progress
        order.status = 'in_progress';
      } else {
        return res.status(400).json({ message: 'Invalid status change for client' });
      }
    }
    
    const updatedOrder = await order.save();
    
    // Log the status change
    console.log(`Order ${updatedOrder._id} status changed to ${updatedOrder.status} by ${req.user.id}`);
    
    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error('Error updating order status:', err);
    next(err);
  }
});
  
  // Submit deliverable (freelancer only)
  router.post('/:id/deliver', verifyToken, async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Check if user is the freelancer
      if (order.freelancer.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied: You are not the freelancer for this order' });
      }
      
      // Add deliverable
      const deliverable = {
        description: req.body.description,
        attachments: req.body.attachments || [],
        submittedAt: new Date()
      };
      
      order.deliveredWork.push(deliverable);
      
      // Update status if first delivery
      if (order.status === 'in_progress') {
        order.status = 'under_review';
        order.completedAt = new Date();
      }
      
      const updatedOrder = await order.save();
      
      res.status(200).json(updatedOrder);
    } catch (err) {
      next(err);
    }
  });
  
  // Submit review (client or freelancer)
  router.post('/:id/review', verifyToken, async (req, res, next) => {
    try {
      const { rating, comment } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Ensure order is completed
      if (order.status !== 'completed') {
        return res.status(400).json({ message: 'Can only review completed orders' });
      }
      
      // Check if user is part of the order
      if (req.user.id === order.client.toString()) {
        // Client reviewing freelancer
        if (order.reviewByClient) {
          return res.status(400).json({ message: 'You have already submitted a review' });
        }
        
        order.reviewByClient = {
          rating,
          comment,
          createdAt: new Date()
        };
        
        // Update freelancer's avg rating
        // This would normally be done with an aggregation pipeline
        // For simplicity, we're just updating it directly here
        // In production, this should be a separate function or trigger
        
      } else if (req.user.id === order.freelancer.toString()) {
        // Freelancer reviewing client
        if (order.reviewByFreelancer) {
          return res.status(400).json({ message: 'You have already submitted a review' });
        }
        
        order.reviewByFreelancer = {
          rating,
          comment,
          createdAt: new Date()
        };
        
        // Update client's avg rating
        // Same note as above
        
      } else {
        return res.status(403).json({ message: 'Access denied: You are not part of this order' });
      }
      
      const updatedOrder = await order.save();
      
      res.status(200).json(updatedOrder);
    } catch (err) {
      next(err);
    }
  });

  // Create thread for order conversation
router.post('/:id/thread', verifyToken, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is part of the order
    if (order.client.toString() !== req.user.id && order.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not part of this order' });
    }
    
    // Find or create conversation between these users
    let conversation = await Conversation.findOne({
      participants: { $all: [order.client, order.freelancer] }
    });
    
    if (!conversation) {
      conversation = new Conversation({
        participants: [order.client, order.freelancer]
      });
      
      await conversation.save();
    }
    
    // Check if thread already exists for this order
    let thread = await Thread.findOne({
      conversation: conversation._id,
      type: 'order',
      order: order._id
    });
    
    if (!thread) {
      thread = new Thread({
        conversation: conversation._id,
        type: 'order',
        order: order._id,
        title: `Order: ${order.title}`
      });
      
      await thread.save();
    }
    
    res.status(200).json(thread);
  } catch (err) {
    next(err);
  }
});
  
  module.exports = router;