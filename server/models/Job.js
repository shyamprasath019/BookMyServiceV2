// File: server/models/Job.js
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String
  },
  budget: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    }
  },
  deadline: {
    type: Date
  },
  location: {
    type: {
      type: String,
      enum: ['remote', 'onsite'],
      default: 'remote'
    },
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  skills: {
    type: [String],
    default: []
  },
  attachments: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalBids: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  selectedBid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid'
  },
  completedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);