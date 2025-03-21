// File: client/src/pages/MyReviews.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ReviewItem from '../components/ReviewItem';
import api from '../utils/api';

const MyReviews = () => {
  const { currentUser, activeRole } = useContext(AuthContext);
  const [reviewsGiven, setReviewsGiven] = useState([]);
  const [reviewsReceived, setReviewsReceived] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('given');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchReviews();
    }
  }, [currentUser, activeRole]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      // Fetch all reviews written by the current user
      const reviewsGivenResponse = await api.get('/reviews/my-orders');
      setReviewsGiven(reviewsGivenResponse.data);

      // Fetch all reviews about the current user (if they are a freelancer)
      if (currentUser.roles.includes('freelancer')) {
        const reviewsReceivedResponse = await api.get('/reviews/about-me');
        setReviewsReceived(reviewsReceivedResponse.data);
      }

      // Fetch completed orders that don't have reviews yet
      const ordersResponse = await api.get('/orders?status=completed');
      const completedOrders = ordersResponse.data;
      
      // Filter for orders where the user is the client and hasn't left a review yet
      const pendingReviewOrders = completedOrders.filter(order => {
        if (activeRole === 'client') {
          return order.client._id === currentUser._id && !order.reviewByClient;
        } else {
          return order.freelancer._id === currentUser._id && !order.reviewByFreelancer;
        }
      });
      
      setPendingReviews(pendingReviewOrders);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-2xl font-bold mb-6">My Reviews</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {/* Review Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 ${
                activeTab === 'given'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('given')}
            >
              Reviews Given
            </button>
            
            {currentUser && currentUser.roles.includes('freelancer') && (
              <button
                className={`py-4 px-6 ${
                  activeTab === 'received'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('received')}
              >
                Reviews Received
              </button>
            )}
            
            <button
              className={`py-4 px-6 ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Reviews
            </button>
          </nav>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading reviews...</span>
            </div>
          ) : (
            <>
              {/* Reviews Given Tab */}
              {activeTab === 'given' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Reviews You've Given</h2>
                  {reviewsGiven.length > 0 ? (
                    <div className="space-y-6">
                      {reviewsGiven.map(review => (
                        <ReviewItem key={review._id} review={review} showOrder={true} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 mb-2">You haven't written any reviews yet.</p>
                      <p className="text-gray-500">
                        After completing an order, you can leave a review for the freelancer.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Received Tab (for freelancers) */}
              {activeTab === 'received' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Reviews You've Received</h2>
                  {reviewsReceived.length > 0 ? (
                    <div className="space-y-6">
                      {reviewsReceived.map(review => (
                        <ReviewItem key={review._id} review={review} showOrder={true} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 mb-2">You haven't received any reviews yet.</p>
                      <p className="text-gray-500">
                        Complete orders and provide great service to get reviews from clients.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pending Reviews Tab */}
              {activeTab === 'pending' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Orders Waiting for Your Review</h2>
                  {pendingReviews.length > 0 ? (
                    <div className="grid gap-6">
                      {pendingReviews.map(order => (
                        <div key={order._id} className="border rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{order.title}</h3>
                              <p className="text-sm text-gray-500">
                                {activeRole === 'client' 
                                  ? `Freelancer: ${order.freelancer.username}` 
                                  : `Client: ${order.client.username}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                Completed on: {new Date(order.completedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Link
                              to={`/orders/${order._id}`}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                            >
                              Leave Review
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 mb-2">No pending reviews at this time.</p>
                      <p className="text-gray-500">
                        You've reviewed all your completed orders.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReviews;