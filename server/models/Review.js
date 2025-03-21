// File: server/models/Review.js
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
  // Users who marked this review as helpful
  helpfulVotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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

// Update user's average rating when review is created/updated/deleted
ReviewSchema.post('save', async function(doc) {
  await updateUserRating(doc.recipient);
});

ReviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    await updateUserRating(doc.recipient);
  }
});

ReviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await updateUserRating(doc.recipient);
  }
});

// Helper function to update user's average rating
async function updateUserRating(userId) {
  const Review = mongoose.model('Review');
  
  try {
    // Calculate average rating from all visible reviews
    const result = await Review.aggregate([
      { $match: { recipient: userId, isVisible: true } },
      { $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    
    if (result.length > 0) {
      const { avgRating, totalReviews } = result[0];
      
      // Update the user's average rating and total reviews
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(userId, {
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalReviews
      });
    } else {
      // No reviews - reset rating and total
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(userId, {
        avgRating: 0,
        totalReviews: 0
      });
    }
  } catch (err) {
    console.error('Error updating user rating:', err);
  }
}

module.exports = mongoose.model('Review', ReviewSchema);