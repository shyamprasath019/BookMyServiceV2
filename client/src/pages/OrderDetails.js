// File: client/src/pages/OrderDetails.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const OrderDetails = () => {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Delivery form
  const [deliveryForm, setDeliveryForm] = useState({
    description: '',
    attachments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState('');
  
  // Review form
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  
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
  
  // File: client/src/pages/OrderDetails.js (continued)
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
  
  const handleReviewFormChange = (e) => {
    const { name, value } = e.target;
    setReviewForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
  };
  
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');
    
    try {
      const response = await api.post(`/orders/${id}/review`, reviewForm);
      setReviewSuccess('Your review has been submitted successfully!');
      
      // Refresh order data
      fetchOrderDetails();
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };
  
  const handleStatusChange = async (status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      
      // Refresh order data
      fetchOrderDetails();
    } catch (err) {
      setError('Failed to update order status');
    }
  };
  
  const handlePayment = async () => {
    try {
      // For prototype, we'll use a mock payment
      const mockPaymentData = {
        paymentMethod: 'credit_card',
        transactionId: 'mock_' + Date.now()
      };
      
      await api.post(`/payments/create/${id}`, mockPaymentData);
      
      // Refresh order data
      fetchOrderDetails();
    } catch (err) {
      setError('Failed to process payment');
    }
  };
  
  const handleReleasePayment = async () => {
    try {
      await api.patch(`/payments/release/${id}`);
      
      // Refresh order data
      fetchOrderDetails();
    } catch (err) {
      setError('Failed to release payment');
    }
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Loading order details...</div>;
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
  const isClient = currentUser._id === order.client._id;
  const isFreelancer = currentUser._id === order.freelancer._id;
  
  // Check if user has already submitted a review
  const hasReviewed = isClient 
    ? order.reviewByClient 
    : isFreelancer 
    ? order.reviewByFreelancer 
    : false;
  
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
                {order.gig ? 'Gig Order' : 'Custom Job'}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-2xl">${order.price.toFixed(2)}</div>
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
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center text-white">
                  {order.client.profileImage ? (
                    <img 
                      src={order.client.profileImage} 
                      alt={order.client.username}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    order.client.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-semibold">{order.client.username}</div>
                  <div className="text-sm text-gray-500">{order.client.email}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Freelancer</h3>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-300 mr-3 flex items-center justify-center text-white">
                  {order.freelancer.profileImage ? (
                    <img 
                      src={order.freelancer.profileImage} 
                      alt={order.freelancer.username}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    order.freelancer.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-semibold">{order.freelancer.username}</div>
                  <div className="text-sm text-gray-500">{order.freelancer.email}</div>
                </div>
              </div>
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
              {/* Payment Section */}
              {order.paymentStatus === 'pending' && (
                <div>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
                    <p className="text-yellow-800">
                      Payment is required to start this order. Your payment will be held in escrow until the order is completed.
                    </p>
                  </div>
                  <button
                    onClick={handlePayment}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                  >
                    Pay Now (${order.price.toFixed(2)})
                  </button>
                </div>
              )}
              
              {/* Review Work Section */}
              {order.status === 'under_review' && order.paymentStatus === 'in_escrow' && (
                <div>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
                    <p className="text-blue-800">
                      The freelancer has delivered the work. Please review it and either accept or request revisions.
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleStatusChange('completed')}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                    >
                      Accept & Complete Order
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
              
              {/* Cancel Order */}
              {['pending', 'in_progress'].includes(order.status) && (
                <div className="mt-6">
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Freelancer Actions */}
          {isFreelancer && (
            <div className="space-y-4">
              {/* Accept Order */}
              {order.status === 'pending' && order.paymentStatus === 'in_escrow' && (
                <div>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
                    <p className="text-blue-800">
                      New order received! Accept it to start working.
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
              
              {/* Deliver Work */}
              {order.status === 'in_progress' && (
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
                        Upload files related to your delivery. (For prototype, files won't be uploaded)
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
              {order.reviewByClient ? (
                <div className="bg-gray-50 p-4 rounded">
                  <div className="flex items-center mb-2">
                    <div className="flex mr-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg 
                          key={star} 
                          className={`h-5 w-5 ${
                            star <= order.reviewByClient.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-600">
                      {new Date(order.reviewByClient.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{order.reviewByClient.comment}</p>
                </div>
              ) : isClient && !hasReviewed ? (
                <div>
                  {reviewError && (
                    <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                      {reviewError}
                    </div>
                  )}
                  {reviewSuccess && (
                    <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
                      {reviewSuccess}
                    </div>
                  )}
                  
                  <form onSubmit={handleReviewSubmit}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Rating
                      </label>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                            className="h-8 w-8 text-yellow-400 focus:outline-none"
                          >
                            <svg 
                              className={`h-7 w-7 ${
                                star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="comment">
                        Review Comment
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        id="comment"
                        name="comment"
                        rows="3"
                        value={reviewForm.comment}
                        onChange={handleReviewFormChange}
                        placeholder="Share your experience working with this freelancer..."
                        required
                      ></textarea>
                    </div>
                    
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              ) : (
                <p className="text-gray-500 italic">No review submitted yet.</p>
              )}
            </div>
            
            {/* Freelancer's Review */}
            <div>
              <h3 className="font-semibold mb-3">Freelancer's Review</h3>
              {order.reviewByFreelancer ? (
                <div className="bg-gray-50 p-4 rounded">
                  <div className="flex items-center mb-2">
                    <div className="flex mr-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg 
                          key={star} 
                          className={`h-5 w-5 ${
                            star <= order.reviewByFreelancer.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-gray-600">
                      {new Date(order.reviewByFreelancer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{order.reviewByFreelancer.comment}</p>
                </div>
              ) : isFreelancer && !hasReviewed ? (
                <div>
                  {reviewError && (
                    <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                      {reviewError}
                    </div>
                  )}
                  {reviewSuccess && (
                    <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
                      {reviewSuccess}
                    </div>
                  )}
                  
                  <form onSubmit={handleReviewSubmit}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Rating
                      </label>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                            className="h-8 w-8 text-yellow-400 focus:outline-none"
                          >
                            <svg 
                              className={`h-7 w-7 ${
                                star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="comment">
                        Review Comment
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        id="comment"
                        name="comment"
                        rows="3"
                        value={reviewForm.comment}
                        onChange={handleReviewFormChange}
                        placeholder="Share your experience working with this client..."
                        required
                      ></textarea>
                    </div>
                    
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              ) : (
                <p className="text-gray-500 italic">No review submitted yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Message Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Message Center</h2>
          <Link 
            to={`/messages/${order._id}`}
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Open Message Center
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;