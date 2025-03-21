// File: client/src/components/ReviewsList.js
import React, { useState, useEffect } from 'react';
import ReviewItem from './ReviewItem';
import api from '../utils/api';

const ReviewsList = ({ userId, showFilters = true, limit = 10, showOrder = true }) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [distribution, setDistribution] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    total: 0
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [filters, setFilters] = useState({
    sort: 'recent', // 'recent', 'oldest', 'highest', 'lowest', 'helpful'
    minRating: '', // '', '1', '2', '3', '4', '5'
    maxRating: ''  // '', '1', '2', '3', '4', '5'
  });
  
  // Fetch reviews when filters or pagination changes
  useEffect(() => {
    fetchReviews();
  }, [userId, filters, currentPage, limit]);
  
  const fetchReviews = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Build query string
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit,
        sort: filters.sort
      });
      
      if (filters.minRating) {
        queryParams.append('minRating', filters.minRating);
      }
      
      if (filters.maxRating) {
        queryParams.append('maxRating', filters.maxRating);
      }
      
      const response = await api.get(`/reviews/user/${userId}?${queryParams.toString()}`);
      
      setReviews(response.data.reviews);
      setTotalPages(response.data.totalPages);
      setDistribution(response.data.distribution);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Handle rating filter click
  const handleRatingFilter = (rating) => {
    // If already filtering by this rating, clear the filter
    if (filters.minRating === String(rating) && filters.maxRating === String(rating)) {
      setFilters(prev => ({
        ...prev,
        minRating: '',
        maxRating: ''
      }));
    } else {
      // Set both min and max to the same rating to filter by specific rating
      setFilters(prev => ({
        ...prev,
        minRating: String(rating),
        maxRating: String(rating)
      }));
    }
    setCurrentPage(1); // Reset to first page
  };
  
  // Calculate average rating
  const calculateAverage = () => {
    if (distribution.total === 0) return 0;
    
    const sum = 
      (5 * distribution[5]) +
      (4 * distribution[4]) +
      (3 * distribution[3]) +
      (2 * distribution[2]) +
      (1 * distribution[1]);
    
    return (sum / distribution.total).toFixed(1);
  };
  
  // Calculate percentage for rating bar
  const calculatePercentage = (count) => {
    if (distribution.total === 0) return 0;
    return (count / distribution.total) * 100;
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
        )}
        
        {isLoading && !reviews.length ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading reviews...</span>
          </div>
        ) : (
          <>
            {/* Rating Summary */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Rating Overview */}
                <div>
                  <div className="flex items-center mb-4">
                    <span className="text-3xl font-bold mr-2">{calculateAverage()}</span>
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(calculateAverage()) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-500">
                      {distribution.total} {distribution.total === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                  
                  {/* Rating Bars */}
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div
                      key={rating}
                      className="flex items-center mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                      onClick={() => handleRatingFilter(rating)}
                    >
                      <div className="flex items-center w-16">
                        <span className="text-sm mr-1">{rating}</span>
                        <svg
                          className="h-4 w-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 ml-2 mr-2">
                        <div
                          className="bg-yellow-400 h-2.5 rounded-full"
                          style={{ width: `${calculatePercentage(distribution[rating])}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-10 text-right">
                        {distribution[rating]}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Filters */}
                <div>
                  <h3 className="font-semibold mb-3">Filter & Sort</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort by
                    </label>
                    <select
                      name="sort"
                      value={filters.sort}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highest">Highest Rated</option>
                      <option value="lowest">Lowest Rated</option>
                      <option value="helpful">Most Helpful</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Rating
                      </label>
                      <select
                        name="minRating"
                        value={filters.minRating}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Any</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Rating
                      </label>
                      <select
                        name="maxRating"
                        value={filters.maxRating}
                        onChange={handleFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Any</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Clear Filters Button */}
                  {(filters.minRating || filters.maxRating || filters.sort !== 'recent') && (
                    <button
                      onClick={() => {
                        setFilters({
                          sort: 'recent',
                          minRating: '',
                          maxRating: ''
                        });
                        setCurrentPage(1);
                      }}
                      className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Reviews List */}
            <div className="border-t pt-6">
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No reviews found</p>
                  {(filters.minRating || filters.maxRating) && (
                    <button
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          minRating: '',
                          maxRating: ''
                        }));
                        setCurrentPage(1);
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Clear Rating Filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {reviews.map((review) => (
                    <ReviewItem key={review._id} review={review} showOrder={showOrder} />
                  ))}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <nav className="flex items-center">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`mx-1 px-3 py-1 rounded ${
                            currentPage === 1
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`mx-1 px-3 py-1 rounded ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`mx-1 px-3 py-1 rounded ${
                            currentPage === totalPages
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewsList;