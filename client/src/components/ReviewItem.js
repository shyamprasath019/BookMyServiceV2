// File: client/src/components/ReviewItem.js
import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const ReviewItem = ({ review, showOrder = true }) => {
  const { currentUser } = useContext(AuthContext);
  const [helpfulVotes, setHelpfulVotes] = useState(review.helpfulVotes || 0);
  const [hasVoted, setHasVoted] = useState(
    review.helpfulVotedBy?.includes(currentUser?._id) || false
  );
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  
  // Format the review date
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Handle marking review as helpful
  const handleMarkHelpful = async () => {
    if (!currentUser) return;
    
    try {
      const response = await api.post(`/reviews/${review._id}/helpful`);
      
      // Update local state
      setHelpfulVotes(response.data.helpfulVotes);
      setHasVoted(response.data.hasVoted);
    } catch (err) {
      console.error('Error marking review as helpful:', err);
    }
  };
  
  // Handle report submission
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    if (!reportReason.trim()) return;
    
    try {
      setIsReporting(true);
      await api.post(`/reviews/${review._id}/report`, { reason: reportReason });
      setReportSuccess(true);
      setReportReason('');
    } catch (err) {
      console.error('Error reporting review:', err);
    } finally {
      setIsReporting(false);
    }
  };
  
  // Handle report cancellation
  const handleCancelReport = () => {
    setIsReporting(false);
    setReportReason('');
  };
  
  return (
    <div className="mb-6 pb-6 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0">
      {/* Review Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden mr-3">
            {review.reviewer?.profileImage ? (
              <img
                src={review.reviewer.profileImage}
                alt={review.reviewer.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white font-semibold">
                {review.reviewer?.username ? review.reviewer.username.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold">
              {review.reviewer?.username || 'Anonymous User'}
            </div>
            <div className="text-xs text-gray-500">{formatDate(review.createdAt)}</div>
          </div>
        </div>
        
        {/* Rating Stars */}
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`h-5 w-5 ${
                star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>
      
      {/* Review Title (if present) */}
      {review.title && (
        <h3 className="font-bold text-lg mb-2">{review.title}</h3>
      )}
      
      {/* Review Content */}
      <p className="text-gray-700 mb-3 whitespace-pre-line">{review.comment}</p>
      
      {/* Order Info (if showOrder is true) */}
      {showOrder && review.order && (
        <div className="bg-gray-50 p-2 rounded mb-3 text-sm">
          <span className="text-gray-600">For order: </span>
          <Link to={`/orders/${review.order._id}`} className="text-blue-600 hover:underline">
            {review.order.title || `Order #${review.order._id.substring(0, 8)}`}
          </Link>
        </div>
      )}
      
      {/* Verified Badge */}
      {review.isVerified && (
        <div className="flex items-center text-green-600 text-sm mb-3">
          <svg
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Verified Purchase</span>
        </div>
      )}
      
      {/* Helpful & Report */}
      <div className="flex justify-between items-center mt-3 text-sm">
        <div className="flex items-center">
          <button
            onClick={handleMarkHelpful}
            disabled={!currentUser}
            className={`flex items-center ${
              hasVoted ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            <svg
              className="h-4 w-4 mr-1"
              fill={hasVoted ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            <span>{hasVoted ? 'Helpful' : 'Mark as Helpful'}</span>
            {helpfulVotes > 0 && <span className="ml-1">({helpfulVotes})</span>}
          </button>
        </div>
        
        {/* Report Button */}
        {currentUser && !isReporting && !reportSuccess && (
          <button
            onClick={() => setIsReporting(true)}
            className="text-gray-500 hover:text-red-600"
          >
            <span>Report</span>
          </button>
        )}
      </div>
      
      {/* Report Form */}
      {isReporting && (
        <div className="mt-3 p-3 border border-gray-200 rounded">
          <h4 className="font-semibold text-sm mb-2">Report this review</h4>
          <form onSubmit={handleReportSubmit}>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
              placeholder="Please tell us why you're reporting this review"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
              required
            ></textarea>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                className="text-gray-600 hover:text-gray-800 text-sm mr-3"
                onClick={handleCancelReport}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
                disabled={!reportReason.trim()}
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Report Success Message */}
      {reportSuccess && (
        <div className="mt-3 p-3 bg-green-50 text-green-700 rounded text-sm">
          Thank you for reporting this review. Our team will review it shortly.
        </div>
      )}
    </div>
  );
};

export default ReviewItem;