// File: models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  roles: {
    type: [String],
    enum: ['freelancer', 'client'],
    default: ['client']
  },
  profileImage: {
    type: String,
    default: ''
  },
  // General profile fields
  bio: {
    type: String,
    default: ''
  },
  // Freelancer specific fields
  skills: {
    type: [String],
    default: []
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  availability: {
    type: String,
    enum: ['full-time', 'part-time', 'weekends', 'custom'],
    default: 'full-time'
  },
  serviceCategories: {
    type: [String],
    default: []
  },
  portfolio: [{
    title: String,
    description: String,
    imageUrl: String,
    link: String
  }],
  // Client wallet
  clientWallet: {
    balance: {
      type: Number,
      default: 0
    },
    transactions: [{
      type: {
        type: String,
        enum: ['deposit', 'withdrawal', 'payment', 'refund', 'escrow', 'release']
      },
      amount: Number,
      description: String,
      relatedOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  // Freelancer wallet
  freelancerWallet: {
    balance: {
      type: Number,
      default: 0
    },
    pendingBalance: {
      type: Number,
      default: 0
    },
    transactions: [{
      type: {
        type: String,
        enum: ['deposit', 'withdrawal', 'payment', 'refund', 'release', 'escrow']
      },
      amount: Number,
      description: String,
      relatedOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  avgRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);