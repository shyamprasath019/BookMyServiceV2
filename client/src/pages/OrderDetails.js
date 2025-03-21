// File: client/src/pages/OrderDetails.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import PaymentForm from '../components/PaymentForm';
import EnhancedReviewForm from '../components/EnhancedReviewForm';

const OrderDetails = () => {
  const { id } = useParams();
  const { currentUser, activeRole } = useContext(AuthContext);
  //const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // Delivery form
  const [deliveryForm, setDeliveryForm] = useState({
    description: '',
    attachments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState('');

  const [isSubmittingClientReview, setIsSubmittingClientReview] = useState(false);
  const [isSubmittingFreelancerReview, setIsSubmittingFreelancerReview] = useState(false);
  //const [isEditingClientReview, setIsEditingClientReview] = useState(false);
  const [isEditingFreelancerReview, setIsEditingFreelancerReview] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  
  const [clientReview, setClientReview] = useState(null);
  const [freelancerReview, setFreelancerReview] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Conversation state
  const [orderConversation, setOrderConversation] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [isContactLoading, setIsContactLoading] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);
  
  const fetchOrderDetails = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (err) {
      setError('Failed to fetch order details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Separate useEffect for fetching conversation
  useEffect(() => {
    if (order && order._id) {
      getOrderConversation();
    }
  }, [order]);
  
  const handleDeliveryFormChange = (e) => {
    const { name, value } = e.target;
    setDeliveryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e) => {
    // In a real implementation, this would handle file uploads
    // For prototype, we'll just store the file names
    const files = Array.from(e.target.files);
    setDeliveryForm({
      ...deliveryForm,
      attachments: files.map(file => file.name)
    });
  };
  
  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setDeliveryError('');
    setDeliverySuccess('');
    
    try {
      const response = await api.post(`/orders/${id}/deliver`, deliveryForm);
      setDeliverySuccess('Your work has been delivered successfully!');
      setDeliveryForm({
        description: '',
        attachments: []
      });
      
      // Refresh order data
      fetchOrderDetails();
    } catch (err) {
      setDeliveryError(err.response?.data?.message || 'Failed to deliver work');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchReviews = async () => {
    if (!order || !order._id) return;
    
    setReviewsLoading(true);
    try {
      // Fetch all reviews for this order
      const response = await api.get(`/reviews/order/${order._id}`);
      const reviews = response.data;
      
      // Separate client and freelancer reviews
      if (reviews && reviews.length > 0) {
        reviews.forEach(review => {
          if (review.reviewer._id === order.client._id) {
            setClientReview(review);
          } else if (review.reviewer._id === order.freelancer._id) {
            setFreelancerReview(review);
          }
        });
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };
  
  useEffect(() => {
    if (order && order._id) {
      fetchReviews();
    }
  }, [order]);

  // const handleReviewFormChange = (e) => {
  //   const { name, value } = e.target;
  //   setReviewForm(prev => ({
  //     ...prev,
  //     [name]: name === 'rating' ? parseInt(value) : value
  //   }));
  // };
  
  // const handleReviewSubmit = async (e) => {
  //   e.preventDefault();
  //   setIsSubmittingReview(true);
  //   setReviewError('');
  //   setReviewSuccess('');
    
  //   try {
  //     const response = await api.post(`/orders/${id}/review`, reviewForm);
  //     setReviewSuccess('Your review has been submitted successfully!');
      
  //     // Refresh order data
  //     fetchOrderDetails();
  //   } catch (err) {
  //     setReviewError(err.response?.data?.message || 'Failed to submit review');
  //   } finally {
  //     setIsSubmittingReview(false);
  //   }
  // };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError('');
      // First update the order status to cancelled
      await api.patch(`/orders/${id}/status`, { status: 'cancelled' });
      
      // Then process the refund from escrow back to client
      const refundResponse = await api.post(`/wallet/refund/${id}`);
      
      // Refresh order data
      await fetchOrderDetails();
      
      // Show success message
      alert('Order has been cancelled and payment refunded successfully.');
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err.response?.data?.message || 'Failed to cancel order and process refund. Please try again.');
    }
  };
  
  const handleStatusChange = async (status) => {
    try {
      setError(''); // Clear any previous errors
      
      // Call the API to update the order status
      const response = await api.patch(`/orders/${id}/status`, { status });
      
      if (response.data) {
        // Update the local order state with the updated order
        setOrder(response.data);
        
        // Show success message based on the status change
        if (status === 'in_progress') {
          alert('Request for revisions has been sent to the freelancer.');
        } else if (status === 'completed') {
          alert('Order has been marked as completed.');
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.message || 'Failed to update order status. Please try again.');
    }
  };
  
  const handlePaymentComplete = (updatedOrder) => {
    setOrder(updatedOrder);
    setShowPaymentForm(false);
  };
  
  const handleReleasePayment = async () => {
    try {
      const response = await api.post(`/wallet/release/${id}`);
      fetchOrderDetails();
      alert('Payment released successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to release payment');
    }
  };

  // Helper function moved outside of the useEffect to prevent hooks ordering issues
  const getOrderConversation = async () => {
    setConversationLoading(true);
    try {
      // Check if the order object exists and has an _id
      if (!order || !order._id) {
        throw new Error('Invalid order data');
      }
      
      // First try to get an existing conversation between participants
      try {
        // Find conversation based on participants instead of order
        const convResponse = await api.get(`/messages/conversation/user/${
          order.client._id === currentUser._id ? order.freelancer._id : order.client._id
        }`);
        
        // If found, create an order thread if it doesn't exist
        const orderThreadResponse = await api.get(`/messages/conversation/${convResponse.data._id}/thread/order/${order._id}`);
        
        setOrderConversation({
          _id: convResponse.data._id,
          threadId: orderThreadResponse.data._id
        });
      } catch (error) {
        console.error('Error with conversation/thread:', error);
        setError('Failed to get conversation for this order');
      }
    } catch (err) {
      console.error('Error getting order conversation:', err);
      setError('Failed to get conversation for this order');
    } finally {
      setConversationLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Loading order details...</p>
      </div>
    );
  }
  
  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error || 'Order not found'}
        </div>
        <Link to="/dashboard" className="text-blue-500 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }
  
  // Determine user role in this order
  const isClient = activeRole === 'client';
  const isFreelancer = activeRole === 'freelancer';
  
  // Check if user has already submitted a review
  const hasReviewed = isClient 
    ? order.reviewByClient 
    : isFreelancer 
    ? order.reviewByFreelancer 
    : false;
  
  // Safe getter for username and profile image
  const getUsername = (user) => user?.username || 'User';
  const getInitial = (user) => {
    return user?.username ? user.username.charAt(0).toUpperCase() : 'U';
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/dashboard" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Back to Dashboard
      </Link>
      
      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="bg-blue-500 text-white px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Order #{order._id.substring(0, 8)}</h1>
            <div className="text-sm">
              Created: {new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">{order.title}</h2>
              <div className="text-gray-600 mb-4">
                {order.gig ? 'Gig Order' : 'Job Bid Order'}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-2xl">BMS {order.price.toFixed(2)}</div>
              <div className="text-gray-500">
                Delivery: {order.deliveryTime} days
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Order Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{order.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Client</h3>
              {order.client && (
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center text-white">
                    {order.client.profileImage ? (
                      <img 
                        src={order.client.profileImage} 
                        alt={getUsername(order.client)}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      getInitial(order.client)
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{getUsername(order.client)}</div>
                    <div className="text-sm text-gray-500">{order.client.email || 'No email available'}</div>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Freelancer</h3>
              {order.freelancer && (
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center text-white">
                    {order.freelancer.profileImage ? (
                      <img 
                        src={order.freelancer.profileImage} 
                        alt={getUsername(order.freelancer)}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      getInitial(order.freelancer)
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{getUsername(order.freelancer)}</div>
                    <div className="text-sm text-gray-500">{order.freelancer.email || 'No email available'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Status</h3>
                <div className={`text-base font-bold ${
                  order.status === 'completed' 
                    ? 'text-green-600' 
                    : order.status === 'cancelled' 
                    ? 'text-red-600' 
                    : 'text-blue-600'
                }`}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Payment Status</h3>
                <div className={`text-base font-bold ${
                  order.paymentStatus === 'released' 
                    ? 'text-green-600' 
                    : order.paymentStatus === 'in_escrow' 
                    ? 'text-blue-600' 
                    : 'text-yellow-600'
                }`}>
                  {order.paymentStatus.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Deadline</h3>
                <div className="text-base font-bold">
                  {order.deadline ? new Date(order.deadline).toLocaleDateString() : 'Flexible'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Order Actions */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Order Actions</h2>
          
          {/* Client Actions */}
          {isClient && (
            <div className="space-y-4">
              {/* Payment Section - Only show when payment is pending */}
              {order.paymentStatus === 'pending' && (
                <div>
                  {showPaymentForm ? (
                    <PaymentForm order={order} onPaymentComplete={handlePaymentComplete} />
                  ) : (
                    <div>
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
                        <p className="text-yellow-800">
                          Payment is required to start this order. Your payment will be held in escrow until the order is completed.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPaymentForm(true)}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                      >
                        Pay Now (BMS {order.price.toFixed(2)})
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Review Work Section - Only when work is delivered and payment is in escrow */}
              {order.status === 'under_review' && order.paymentStatus === 'in_escrow' && (
                <div>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
                    <p className="text-blue-800">
                      The freelancer has delivered the work. Please review it and either accept or request revisions.
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleReleasePayment}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                    >
                      Accept & Release Payment
                    </button>
                    <button
                      onClick={() => handleStatusChange('in_progress')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
                    >
                      Request Revisions
                    </button>
                  </div>
                </div>
              )}
              
              {/* Cancel Order - Only when order is active and payment is in escrow */}
              {['pending', 'in_progress'].includes(order.status) && order.paymentStatus === 'in_escrow' && (
                <div className="mt-6">
                  <button
                    onClick={handleCancelOrder}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                  >
                    Cancel Order & Request Refund
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Freelancer Actions */}
          {isFreelancer && (
            <div className="space-y-4">
              {/* Accept Order - Only when order is pending and payment is in escrow */}
              {order.status === 'pending' && order.paymentStatus === 'in_escrow' && (
                <div>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
                    <p className="text-blue-800">
                      New order received with payment in escrow! Accept it to start working.
                    </p>
                  </div>
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                  >
                    Accept Order
                  </button>
                </div>
              )}
              
              {/* Deliver Work - Only when order is in progress */}
              {order.status === 'in_progress' && order.paymentStatus === 'in_escrow' && (
                <div>
                  {deliveryError && (
                    <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                      {deliveryError}
                    </div>
                  )}
                  {deliverySuccess && (
                    <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
                      {deliverySuccess}
                    </div>
                  )}
                  
                  <form onSubmit={handleDeliverySubmit}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                        Delivery Message
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        id="description"
                        name="description"
                        rows="4"
                        value={deliveryForm.description}
                        onChange={handleDeliveryFormChange}
                        placeholder="Describe what you're delivering..."
                        required
                      ></textarea>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="attachments">
                        Attachments
                      </label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        type="file"
                        id="attachments"
                        name="attachments"
                        onChange={handleFileChange}
                        multiple
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Upload files related to your delivery.
                      </p>
                    </div>
                    
                    <button
                      type="submit"
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Deliver Work'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Delivered Work */}
      {order.deliveredWork && order.deliveredWork.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Delivered Work</h2>
            
            {order.deliveredWork.map((delivery, index) => (
              <div key={index} className={`${index > 0 ? 'border-t pt-4 mt-4' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">Delivery #{index + 1}</h3>
                  <div className="text-sm text-gray-500">
                    {new Date(delivery.submittedAt).toLocaleString()}
                  </div>
                </div>
                <p className="text-gray-700 mb-3 whitespace-pre-line">{delivery.description}</p>
                
                {delivery.attachments && delivery.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Attachments:</h4>
                    <ul className="list-disc pl-5 text-blue-500">
                      {delivery.attachments.map((file, fileIndex) => (
                        <li key={fileIndex} className="mb-1">
                          <a href="#" className="hover:underline">{file}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Reviews Section */}
      {order.status === 'completed' && (
  <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Reviews</h2>
      
      {/* Client's Review */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Client's Review</h3>
        {reviewsLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
            <span>Loading reviews...</span>
          </div>
        ) : clientReview ? (
          <div className="bg-gray-50 p-4 rounded">
            <div className="flex items-center mb-2">
              <div className="flex mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg 
                    key={star} 
                    className={`h-5 w-5 ${
                      star <= clientReview.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-600">
                {new Date(clientReview.createdAt).toLocaleDateString()}
              </span>
            </div>
            {clientReview.title && (
              <h4 className="font-bold mb-2">{clientReview.title}</h4>
            )}
            <p className="text-gray-700">{clientReview.comment}</p>
          </div>
        ) : isClient ? (
          <div>
            {isSubmittingClientReview ? (
              <EnhancedReviewForm 
                order={order} 
                onReviewSubmitted={(review) => {
                  setClientReview(review);
                  setIsSubmittingClientReview(false);
                  fetchReviews(); // Refresh reviews after submission
                }}
              />
            ) : (
              <div className="bg-blue-50 p-4 rounded">
                <p className="mb-3">You haven't reviewed this order yet. Share your experience working with this freelancer.</p>
                <button
                  onClick={() => setIsSubmittingClientReview(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Write Review
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 italic">The client hasn't submitted a review yet.</p>
        )}
      </div>
      
      {/* Freelancer's Review */}
      <div>
        <h3 className="font-semibold mb-3">Freelancer's Review</h3>
        {reviewsLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
            <span>Loading reviews...</span>
          </div>
        ) : freelancerReview ? (
          <div className="bg-gray-50 p-4 rounded">
            <div className="flex items-center mb-2">
              <div className="flex mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg 
                    key={star} 
                    className={`h-5 w-5 ${
                      star <= freelancerReview.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-600">
                {new Date(freelancerReview.createdAt).toLocaleDateString()}
              </span>
            </div>
            {freelancerReview.title && (
              <h4 className="font-bold mb-2">{freelancerReview.title}</h4>
            )}
            <p className="text-gray-700">{freelancerReview.comment}</p>
          </div>
        ) : isFreelancer ? (
          // Freelancer review form
          <div>
            {isSubmittingFreelancerReview ? (
              <EnhancedReviewForm 
                order={order}
                onReviewSubmitted={(review) => {
                  setFreelancerReview(review);
                  setIsSubmittingFreelancerReview(false);
                  fetchReviews()
                }}
                existingReview={editingReview}
              />
            ) : (
              <div className="bg-blue-50 p-4 rounded">
                <p className="mb-3">You haven't reviewed this order yet. Share your experience working with this client.</p>
                <button
                  onClick={() => setIsSubmittingFreelancerReview(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Write Review
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 italic">The freelancer hasn't submitted a review yet.</p>
        )}
      </div>
    </div>
  </div>
)}
      
      {/* Message Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Message Center</h2>
          
          {conversationLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="text-gray-500">Loading message center...</span>
            </div>
          ) : orderConversation ? (
            <Link 
              to={`/messages/${orderConversation._id}?thread=${orderConversation.threadId}`}
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Open Message Center
            </Link>
          ) : (
            <div className="text-red-500">
              Failed to load messaging center. Please try again.
              <button
                onClick={getOrderConversation}
                className="ml-3 text-blue-500 underline"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;