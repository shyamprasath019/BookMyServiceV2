// File: client/src/components/ReviewStats.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ReviewStats = ({ userId, avgRating, totalReviews, showDistribution = true, compact = false }) => {
  const [distribution, setDistribution] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (userId && showDistribution) {
      fetchDistribution();
    }
  }, [userId]);
  
  const fetchDistribution = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await api.get(`/reviews/user/${userId}?limit=1`);
      if (response.data && response.data.distribution) {
        setDistribution(response.data.distribution);
      }
    } catch (err) {
      console.error('Error fetching rating distribution:', err);
      setError('Failed to load rating data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format the rating to 1 decimal place and handle null/undefined
  const formatRating = (rating) => {
    if (rating === null || rating === undefined) return '0.0';
    return Number(rating).toFixed(1);
  };
  
  // Calculate percentage for rating bar
  const calculatePercentage = (count) => {
    if (!totalReviews || totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };
  
  // Render star icons for a given rating
  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-5 w-5 ${
              star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };
  
  if (compact) {
    return (
      <div className="flex items-center">
        <span className="text-2xl font-bold mr-2">{formatRating(avgRating)}</span>
        <div className="flex items-center">
          {renderStars(avgRating)}
          <span className="ml-2 text-sm text-gray-500">
            ({totalReviews || 0})
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center mb-4">
        <span className="text-3xl font-bold mr-2">{formatRating(avgRating)}</span>
        <div className="flex items-center">
          {renderStars(avgRating)}
          <span className="ml-2 text-sm text-gray-500">
            {totalReviews || 0} {totalReviews === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      </div>
      
      {showDistribution && !isLoading && !error && (
        <div className="space-y-2">
          {/* Rating Bars */}
          {[5, 4, 3, 2, 1].map((rating) => (
            <div
              key={rating}
              className="flex items-center text-sm"
            >
              <div className="flex items-center w-12">
                <span className="text-sm mr-1">{rating}</span>
                <svg
                  className="h-4 w-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 ml-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${calculatePercentage(distribution[rating])}%` }}
                ></div>
              </div>
              <span className="ml-2 w-8 text-right text-gray-500">
                {distribution[rating] || 0}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {isLoading && (
        <div className="flex items-center text-gray-500 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          Loading rating data...
        </div>
      )}
      
      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default ReviewStats;