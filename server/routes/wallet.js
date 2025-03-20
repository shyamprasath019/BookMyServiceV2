// File: server/routes/wallet.js
const router = require('express').Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { verifyToken } = require('../middleware/auth');

// Get wallet data for user (client or freelancer)
router.get('/:role', verifyToken, async (req, res, next) => {
  try {
    const { role } = req.params;
    
    // Validate role
    if (role !== 'client' && role !== 'freelancer') {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Check if user has the role
    if (!req.user.roles.includes(role)) {
      return res.status(403).json({ message: `You don't have a ${role} account` });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get wallet based on role
    const wallet = role === 'client' ? user.clientWallet : user.freelancerWallet;
    const transactions = wallet.transactions.sort((a, b) => b.createdAt - a.createdAt);
    
    res.status(200).json({ wallet, transactions });
  } catch (err) {
    next(err);
  }
});

// Deposit to wallet
router.post('/:role/deposit', verifyToken, async (req, res, next) => {
  try {
    const { role } = req.params;
    const { amount } = req.body;
    
    // Validate role
    if (role !== 'client' && role !== 'freelancer') {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Check if user has the role
    if (!req.user.roles.includes(role)) {
      return res.status(403).json({ message: `You don't have a ${role} account` });
    }
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Please provide a valid amount' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get wallet based on role
    const wallet = role === 'client' ? user.clientWallet : user.freelancerWallet;
    
    // Create transaction
    const transaction = {
      type: 'deposit',
      amount,
      description: `Deposited BMS ${amount.toFixed(2)} to ${role} wallet`,
      createdAt: new Date()
    };
    
    // Update wallet
    wallet.balance += amount;
    wallet.transactions.push(transaction);
    
    await user.save();
    
    // Get updated transactions list sorted by creation date (newest first)
    const transactions = wallet.transactions.sort((a, b) => b.createdAt - a.createdAt);
    
    res.status(200).json({ wallet, transactions });
  } catch (err) {
    next(err);
  }
});

// Withdraw from wallet
router.post('/:role/withdraw', verifyToken, async (req, res, next) => {
  try {
    const { role } = req.params;
    const { amount } = req.body;
    
    // Validate role
    if (role !== 'client' && role !== 'freelancer') {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Check if user has the role
    if (!req.user.roles.includes(role)) {
      return res.status(403).json({ message: `You don't have a ${role} account` });
    }
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Please provide a valid amount' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get wallet based on role
    const wallet = role === 'client' ? user.clientWallet : user.freelancerWallet;
    
    // Check if user has enough balance
    if (wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    // Create transaction
    const transaction = {
      type: 'withdrawal',
      amount,
      description: `Withdrew BMS ${amount.toFixed(2)} from ${role} wallet`,
      createdAt: new Date()
    };
    
    // Update wallet
    wallet.balance -= amount;
    wallet.transactions.push(transaction);
    
    await user.save();
    
    // Get updated transactions list sorted by creation date (newest first)
    const transactions = wallet.transactions.sort((a, b) => b.createdAt - a.createdAt);
    
    res.status(200).json({ wallet, transactions });
  } catch (err) {
    next(err);
  }
});

// Payment to escrow (client only)
router.post('/pay/:orderId', verifyToken, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is the client
    if (order.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not the client for this order' });
    }
    
    // Check if order is already paid
    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ message: 'Order is already paid' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if client has enough balance
    if (user.clientWallet.balance < order.price) {
      return res.status(400).json({ 
        message: `Insufficient balance. Please deposit at least BMS ${order.price - user.clientWallet.balance} more.` 
      });
    }
    
    // Find freelancer
    const freelancer = await User.findById(order.freelancer);
    
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }
    
    // Create client transaction
    const clientTransaction = {
      type: 'payment',
      amount: order.price,
      description: `Payment for order #${order._id.toString().substring(0, 8)}`,
      relatedOrder: order._id,
      createdAt: new Date()
    };
    
    // Create escrow entry for freelancer
    const freelancerTransaction = {
      type: 'escrow',
      amount: order.price,
      description: `Payment in escrow for order #${order._id.toString().substring(0, 8)}`,
      relatedOrder: order._id,
      createdAt: new Date()
    };
    
    // Update wallets
    user.clientWallet.balance -= order.price;
    user.clientWallet.transactions.push(clientTransaction);
    
    freelancer.freelancerWallet.pendingBalance += order.price;
    freelancer.freelancerWallet.transactions.push(freelancerTransaction);
    
    // Update order
    order.paymentStatus = 'in_escrow';
    
    // Save all changes
    await user.save();
    await freelancer.save();
    await order.save();
    
    res.status(200).json({ 
      message: 'Payment successful. Funds are now in escrow.',
      order
    });
  } catch (err) {
    next(err);
  }
});

// Release payment from escrow (client only)
router.post('/release/:orderId', verifyToken, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is the client
    if (order.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not the client for this order' });
    }
    
    // Check if order is in escrow
    if (order.paymentStatus !== 'in_escrow') {
      return res.status(400).json({ message: 'Order payment is not in escrow' });
    }
    
    // Check if order is completed or under review
    if (order.status !== 'completed' && order.status !== 'under_review') {
      return res.status(400).json({ 
        message: 'Order is not ready for payment release. Order must be completed or under review.' 
      });
    }
    
    // Find freelancer
    const freelancer = await User.findById(order.freelancer);
    
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }
    
    // Create release transaction for freelancer
    const releaseTransaction = {
      type: 'release',
      amount: order.price,
      description: `Payment released for order #${order._id.toString().substring(0, 8)}`,
      relatedOrder: order._id,
      createdAt: new Date()
    };
    
    // Update freelancer wallet
    freelancer.freelancerWallet.pendingBalance -= order.price;
    freelancer.freelancerWallet.balance += order.price;
    freelancer.freelancerWallet.transactions.push(releaseTransaction);
    
    // Update order
    order.paymentStatus = 'released';
    order.status = 'completed';
    
    // Save changes
    await freelancer.save();
    await order.save();
    
    res.status(200).json({ 
      message: 'Payment released successfully.',
      order
    });
  } catch (err) {
    next(err);
  }
});

// NEW ROUTE: Refund payment from escrow when order is cancelled
router.post('/refund/:orderId', verifyToken, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is authorized (client or freelancer can initiate cancellation)
    const isClient = order.client.toString() === req.user.id;
    const isFreelancer = order.freelancer.toString() === req.user.id;
    
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'You are not authorized to refund this order' });
    }
    
    // Check if order status is cancelled
    if (order.status !== 'cancelled') {
      return res.status(400).json({ message: 'Only cancelled orders can be refunded' });
    }
    
    // Check if payment is in escrow
    if (order.paymentStatus !== 'in_escrow') {
      return res.status(400).json({ 
        message: 'Order payment is not in escrow or has already been refunded' 
      });
    }
    
    // Find client and freelancer
    const client = await User.findById(order.client);
    const freelancer = await User.findById(order.freelancer);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }
    
    // Create refund transaction for client
    const clientTransaction = {
      type: 'refund',
      amount: order.price,
      description: `Refund for cancelled order #${order._id.toString().substring(0, 8)}`,
      relatedOrder: order._id,
      createdAt: new Date()
    };
    
    // Create refund transaction for freelancer (to update escrow records)
    const freelancerTransaction = {
      type: 'refund',
      amount: order.price,
      description: `Escrow refunded for cancelled order #${order._id.toString().substring(0, 8)}`,
      relatedOrder: order._id,
      createdAt: new Date()
    };
    
    // Update client wallet (add refund)
    client.clientWallet.balance += order.price;
    client.clientWallet.transactions.push(clientTransaction);
    
    // Update freelancer wallet (remove pending amount)
    freelancer.freelancerWallet.pendingBalance -= order.price;
    freelancer.freelancerWallet.transactions.push(freelancerTransaction);
    
    // Update order payment status
    order.paymentStatus = 'refunded';
    
    // Save all changes
    await Promise.all([
      client.save(),
      freelancer.save(),
      order.save()
    ]);
    
    console.log(`Refund processed - Order: ${order._id}, Amount: ${order.price}, Client: ${client._id}, Freelancer: ${freelancer._id}`);
    
    res.status(200).json({ 
      message: 'Payment refunded successfully.',
      order
    });
  } catch (err) {
    console.error('Wallet refund error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'An error occurred processing the refund', error: err.message });
    }
    next(err);
  }
});

module.exports = router;