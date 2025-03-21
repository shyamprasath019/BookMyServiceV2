// File: client/src/components/EnhancedReviewForm.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const EnhancedReviewForm = ({ order, onReviewSubmitted, existingReview = null }) => {
  const { currentUser, activeRole } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    orderId: order?._id || '',
    rating: existingReview ? existingReview.rating : 5,
    title: existingReview ? existingReview.title : '',
    comment: existingReview ? existingReview.comment : ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Determine if user is client or freelancer in this order
  const isClient = currentUser && order && order.client._id === currentUser._id;
  const isFreelancer = currentUser && order && order.freelancer._id === currentUser._id;
  
  useEffect(() => {
    // If the review form is being pre-filled with an existing review
    if (existingReview) {
      setFormData({
        orderId: order?._id || '',
        rating: existingReview.rating || 5,
        title: existingReview.title || '',
        comment: existingReview.comment || ''
      });
    }
  }, [existingReview, order]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is being edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleRatingChange = (newRating) => {
    setFormData(prev => ({
      ...prev,
      rating: newRating
    }));
    
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: null }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.rating) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (!formData.comment) {
      newErrors.comment = 'Please provide a review comment';
    } else if (formData.comment.length < 10) {
      newErrors.comment = 'Review comment must be at least 10 characters';
    }
    
    if (formData.title && formData.title.length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      let response;
      
      if (existingReview) {
        // Update existing review
        if (existingReview._id) {
          response = await api.put(`/reviews/${existingReview._id}`, {
            rating: formData.rating,
            comment: formData.comment,
            title: formData.title
          });
        } else {
          // Fallback if somehow we're editing a review without an ID
          response = await api.post(`/orders/${order._id}/review`, {
            rating: formData.rating,
            comment: formData.comment,
            title: formData.title
          });
        }
      } else {
        // Create new review through the order endpoint
        response = await api.post(`/orders/${order._id}/review`, {
          rating: formData.rating,
          comment: formData.comment,
          title: formData.title
        });
      }
      
      setSubmitSuccess(true);
      
      // Pass the review response back to parent component
      if (onReviewSubmitted) {
        onReviewSubmitted(response.data);
      }
    } catch (err) {
      console.error('Review submission error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to submit review';
      setErrors({ form: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If submission succeeded and we weren't editing
  if (submitSuccess && !existingReview) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Review submitted successfully!</h3>
              <p className="mt-2 text-sm text-green-700">
                Thank you for sharing your feedback. Your review will help others make informed decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h2>
      
      {errors.form && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Rating
          </label>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="text-yellow-400 focus:outline-none mr-1 h-8 w-8"
                onClick={() => handleRatingChange(star)}
              >
                <svg
                  className={`h-8 w-8 ${
                    star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </svg>
              </button>
            ))}
          </div>
          {errors.rating && (
            <p className="text-red-500 text-xs mt-1">{errors.rating}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Review Title (Optional)
          </label>
          <input
            className={`w-full px-3 py-2 border ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            } rounded focus:outline-none focus:border-blue-500`}
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Summarize your experience"
            maxLength={100}
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            {formData.title.length}/100 characters
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="comment">
            Review Comment
          </label>
          <textarea
            className={`w-full px-3 py-2 border ${
              errors.comment ? 'border-red-500' : 'border-gray-300'
            } rounded focus:outline-none focus:border-blue-500`}
            id="comment"
            name="comment"
            rows="4"
            value={formData.comment}
            onChange={handleChange}
            placeholder={`Share your experience working with this ${isClient ? 'freelancer' : 'client'}...`}
            required
            minLength={10}
            maxLength={1000}
          ></textarea>
          {errors.comment && (
            <p className="text-red-500 text-xs mt-1">{errors.comment}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            {formData.comment.length}/1000 characters
          </p>
        </div>
        
        <div className="flex items-center justify-end">
          {existingReview && (
            <button
              type="button"
              className="mr-4 text-gray-600 hover:text-gray-800"
              onClick={() => onReviewSubmitted?.(existingReview)}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? existingReview
                ? 'Updating...'
                : 'Submitting...'
              : existingReview
                ? 'Update Review'
                : 'Submit Review'
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedReviewForm;