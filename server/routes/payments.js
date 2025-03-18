// File: routes/payments.js
const router = require('express').Router();
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { verifyToken, hasClientRole } = require('../middleware/auth');

// Create payment for order (client only)
router.post('/create/:orderId', verifyToken, hasClientRole, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is the client
    if (order.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not the client for this order' });
    }
    
    // Check if payment already exists
    const existingPayment = await Payment.findOne({ order: req.params.orderId });
    if (existingPayment) {
      return res.status(400).json({ message: 'Payment already exists for this order' });
    }
    
    // Calculate platform fee (10% of order price)
    const platformFee = order.price * 0.1;
    const totalAmount = order.price + platformFee;
    
    // Create new payment
    const newPayment = new Payment({
      order: order._id,
      client: order.client,
      freelancer: order.freelancer,
      amount: order.price,
      platformFee,
      totalAmount,
      paymentMethod: req.body.paymentMethod,
      transactionId: req.body.transactionId,
      status: 'completed',
      paidAt: new Date()
    });
    
    const savedPayment = await newPayment.save();
    
    // Update order payment status
    await Order.findByIdAndUpdate(req.params.orderId, {
      paymentStatus: 'in_escrow'
    });
    
    res.status(201).json(savedPayment);
  } catch (err) {
    next(err);
  }
});

// Get payment details for an order
router.get('/order/:orderId', verifyToken, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is part of the order
    if (order.client.toString() !== req.user.id && order.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not part of this order' });
    }
    
    const payment = await Payment.findOne({ order: req.params.orderId });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.status(200).json(payment);
  } catch (err) {
    next(err);
  }
});

// Release payment to freelancer (client only, or system on completion)
router.patch('/release/:orderId', verifyToken, hasClientRole, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is the client
    if (order.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not the client for this order' });
    }
    
    const payment = await Payment.findOne({ order: req.params.orderId });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check if payment is in escrow
    if (order.paymentStatus !== 'in_escrow') {
      return res.status(400).json({ message: 'Payment is not in escrow' });
    }
    
    // Update payment status
    payment.status = 'completed';
    payment.releasedAt = new Date();
    await payment.save();
    
    // Update order payment status
    order.paymentStatus = 'released';
    await order.save();
    
    res.status(200).json({ message: 'Payment released successfully', payment });
  } catch (err) {
    next(err);
  }
});

module.exports = router;