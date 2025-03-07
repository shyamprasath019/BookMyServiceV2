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
  skills: {
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
  attachments: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
