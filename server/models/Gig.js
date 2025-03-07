const mongoose = require('mongoose');

const GigSchema = new mongoose.Schema({
  owner: {
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
  pricingType: {
    type: String,
    enum: ['fixed', 'hourly'],
    default: 'fixed'
  },
  price: {
    type: Number,
    required: true
  },
  deliveryTime: {
    type: Number,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Gig', GigSchema);
