// In server/models/Review.js (already exists)
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  // The user who is being reviewed (usually a freelancer)
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The user who wrote the review (usually a client)
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The order this review is associated with
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  // Rating from 1-5
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // Review text content
  comment: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000
  },
  // Review title (optional)
  title: {
    type: String,
    maxlength: 100
  },
  // Was this review helpful? (upvotes)
  helpfulVotes: {
    type: Number,
    default: 0
  },
  // Is this review visible?
  isVisible: {
    type: Boolean,
    default: true
  },
  // Was this review verified? (from a real order)
  isVerified: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);