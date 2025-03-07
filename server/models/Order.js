// File: models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig'
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  bid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  deliveryTime: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'under_review'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'in_escrow', 'released', 'refunded'],
    default: 'pending'
  },
  deliveredWork: [{
    description: String,
    attachments: [String],
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  completedAt: {
    type: Date
  },
  deadline: {
    type: Date
  },
  reviewByClient: {
    rating: Number,
    comment: String,
    createdAt: Date
  },
  reviewByFreelancer: {
    rating: Number,
    comment: String,
    createdAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);