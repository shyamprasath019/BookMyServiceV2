// File: routes/reviews.js
const router = require('express').Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');
const Order = require('../models/Order');
const { verifyToken } = require('../middleware/auth');

// Create a review (for a completed order)
// Create a review (for a completed order)
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { orderId, rating, comment, title } = req.body;
    
    if (!orderId || !rating || !comment) {
      return res.status(400).json({ message: 'Order ID, rating, and comment are required' });
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot review an incomplete order' });
    }
    
    // Determine if the user is client or freelancer
    const isClient = order.client.toString() === req.user.id;
    const isFreelancer = order.freelancer.toString() === req.user.id;
    
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'You are not part of this order' });
    }
    
    // Set recipient based on the reviewer's role
    const recipientId = isClient ? order.freelancer : order.client;
    
    // Check if user already submitted a review for this order
    const existingReview = await Review.findOne({
      order: orderId,
      reviewer: req.user.id
    });
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this order' });
    }
    
    // Create the review
    const newReview = new Review({
      recipient: recipientId,
      reviewer: req.user.id,
      order: orderId,
      rating,
      comment,
      title: title || '',
      isVerified: true
    });
    
    const savedReview = await newReview.save();
    
    // Populate reviewer info for the response
    await savedReview.populate('reviewer', 'username profileImage');
    
    res.status(201).json(savedReview);
  } catch (err) {
    next(err);
  }
});

// Update a review
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const { rating, comment, title } = req.body;
    
    // Find the review
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user is the reviewer
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }
    
    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Update the review
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;
    if (title !== undefined) review.title = title; // Allow empty titles
    
    const updatedReview = await review.save();
    
    // Populate reviewer info
    await updatedReview.populate('reviewer', 'username profileImage');
    
    res.status(200).json(updatedReview);
  } catch (err) {
    next(err);
  }
});

// Delete a review
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    // Find the review
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user is the reviewer
    if (review.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }
    
    await review.deleteOne();
    
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Get reviews for a specific user (recipient)
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, sort = 'recent', minRating, maxRating } = req.query;
    
    // Build query
    const query = { 
      recipient: userId,
      isVisible: true
    };
    
    // Filter by rating range if provided
    if (minRating) {
      query.rating = { ...query.rating, $gte: parseInt(minRating) };
    }
    
    if (maxRating) {
      query.rating = { ...query.rating, $lte: parseInt(maxRating) };
    }
    
    // Determine sort method
    let sortOption = {};
    switch (sort) {
      case 'recent':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highest':
        sortOption = { rating: -1 };
        break;
      case 'lowest':
        sortOption = { rating: 1 };
        break;
      case 'helpful':
        sortOption = { helpfulVotes: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count
    const total = await Review.countDocuments(query);
    
    // Get reviews
    const reviews = await Review.find(query)
      .populate('reviewer', 'username profileImage')
      .populate('order', 'title')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);
    
    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { recipient: mongoose.Types.ObjectId(userId), isVisible: true } },
      { $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    // Format distribution
    const distribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
      total: total
    };
    
    ratingDistribution.forEach(item => {
      distribution[item._id] = item.count;
    });
    
    res.status(200).json({
      reviews,
      totalReviews: total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      distribution
    });
  } catch (err) {
    next(err);
  }
});

// Get all reviews for the current user's orders (as a client)
router.get('/my-orders', verifyToken, async (req, res, next) => {
  try {
    const reviews = await Review.find({ 
      reviewer: req.user.id,
      isVisible: true
    })
      .populate('recipient', 'username profileImage')
      .populate('order', 'title')
      .sort({ createdAt: -1 });
    
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
});

// Get all reviews about the current user (as a freelancer)
router.get('/about-me', verifyToken, async (req, res, next) => {
  try {
    const reviews = await Review.find({ 
      recipient: req.user.id,
      isVisible: true
    })
      .populate('reviewer', 'username profileImage')
      .populate('order', 'title')
      .sort({ createdAt: -1 });
    
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
});

// Mark a review as helpful
router.post('/:id/helpful', verifyToken, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user already marked this review as helpful
    const alreadyVoted = review.helpfulVotedBy.includes(req.user.id);
    
    if (alreadyVoted) {
      // Remove the helpful vote
      review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
      review.helpfulVotedBy = review.helpfulVotedBy.filter(
        id => id.toString() !== req.user.id
      );
    } else {
      // Add a helpful vote
      review.helpfulVotes += 1;
      review.helpfulVotedBy.push(req.user.id);
    }
    
    await review.save();
    
    res.status(200).json({
      helpfulVotes: review.helpfulVotes,
      hasVoted: !alreadyVoted
    });
  } catch (err) {
    next(err);
  }
});

// Report a review (flag for moderation)
router.post('/:id/report', verifyToken, async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Reason for report is required' });
    }
    
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // In a real app, you would create a Report model and store the report
    // For now, we'll just acknowledge the report
    
    res.status(200).json({ 
      message: 'Review has been reported and will be reviewed by our team'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/order/:orderId', verifyToken, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is part of the order
    if (order.client.toString() !== req.user.id && order.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You are not part of this order' });
    }
    
    // Get all reviews for this order
    const reviews = await Review.find({ order: orderId })
      .populate('reviewer', 'username profileImage')
      .populate('recipient', 'username profileImage');
    
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
});

// Get reviews for a specific gig
router.get('/gig/:gigId', async (req, res, next) => {
  try {
    const { gigId } = req.params;
    
    // First find all orders related to this gig
    const orders = await Order.find({ gig: gigId, status: 'completed' });
    
    if (!orders || orders.length === 0) {
      return res.status(200).json([]);
    }
    
    // Get all order IDs
    const orderIds = orders.map(order => order._id);
    
    // Find reviews for these orders
    const reviews = await Review.find({ 
      order: { $in: orderIds },
      // Only show client reviews in gig details (clients reviewing freelancers)
      recipient: orders[0].freelancer // All orders have the same freelancer
    })
    .populate('reviewer', 'username profileImage')
    .populate('order', 'title')
    .sort({ createdAt: -1 });
    
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
});

module.exports = router;