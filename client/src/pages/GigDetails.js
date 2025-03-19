// File: client/src/pages/GigDetails.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const GigDetails = () => {
  const { id } = useParams();
  const { currentUser, activeRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [gig, setGig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  
  useEffect(() => {
    fetchGigDetails();
  }, [id]);
  
  const fetchGigDetails = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/gigs/${id}`);
      setGig(response.data);
    } catch (err) {
      setError('Failed to fetch gig details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateOrder = async () => {
    try {
      const response = await api.post(`/orders/from-gig/${id}`);
      navigate(`/orders/${response.data._id}`);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You need to be logged in as a client to place an order. Please switch roles or log in.');
      } else {
        setError(err.response?.data?.message || 'Failed to create order');
      }
    }
  };
  
  const handleContactFreelancer = () => {
    // In a real implementation, this would create a conversation
    navigate('/messages');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Loading gig details...</p>
      </div>
    );
  }
  
  if (error || !gig) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error || 'Gig not found'}
        </div>
        <Link to="/gigs" className="text-blue-500 hover:underline">
          &larr; Back to Gigs
        </Link>
      </div>
    );
  }
  
  // Check if the current user is the gig owner
  const isOwner = currentUser && gig.owner._id === currentUser._id;
  
  // Check if the current user is a client
  const isClient = currentUser && activeRole === 'client';
  
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      {/* <Link to="/gigs" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Back to Gigs
      </Link> */}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Gig Images */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="h-96 bg-gray-200 relative">
              {gig.images && gig.images.length > 0 ? (
                <img
                  src={gig.images[0]}
                  alt={gig.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  {gig.category}
                </span>
              </div>
            </div>
            
            {/* Gig Thumbnails (if multiple images) */}
            {gig.images && gig.images.length > 1 && (
              <div className="p-4 grid grid-cols-5 gap-2">
                {gig.images.map((image, index) => (
                  <div 
                    key={index}
                    className="h-16 bg-gray-200 rounded overflow-hidden cursor-pointer"
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Gig Details */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">{gig.title}</h1>
              
              <div className="flex items-center mb-6">
                <div className="h-10 w-10 rounded-full bg-blue-500 mr-3 flex items-center justify-center text-white overflow-hidden">
                  {gig.owner.profileImage ? (
                    <img
                      src={gig.owner.profileImage}
                      alt={gig.owner.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-semibold">{gig.owner.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="font-semibold">
                    <Link to={`/freelancers/${gig.owner._id}`} className="hover:text-blue-500">
                      {gig.owner.username}
                    </Link>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="flex items-center text-yellow-400 mr-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star} 
                          className={`h-4 w-4 ${
                            star <= gig.owner.avgRating ? 'text-yellow-400' : 'text-gray-300'
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span>{gig.owner.avgRating?.toFixed(1) || '0.0'}</span>
                    <span className="mx-1">|</span>
                    <span>{gig.owner.totalReviews || 0} reviews</span>
                  </div>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <div className="text-gray-700 mb-6 whitespace-pre-line">
                {gig.description}
              </div>
              
              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-2">Pricing Type</h3>
                  <p className="text-gray-700 capitalize">{gig.pricingType}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Delivery Time</h3>
                  <p className="text-gray-700">{gig.deliveryTime} days</p>
                </div>
              </div>
              
              {/* Tags */}
              {gig.tags && gig.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {gig.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Reviews Section (placeholder) */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Reviews</h2>
              <p className="text-gray-500 italic">No reviews yet for this gig.</p>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Pricing Card */}
          <div className="bg-white rounded-lg shadow overflow-hidden sticky top-20">
            <div className="p-6">
              <div className="border-b pb-4 mb-4">
                <h2 className="text-xl font-bold mb-2">Service Package</h2>
                <p className="text-sm text-gray-500 mb-2">{gig.title}</p>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  BMS {gig.price?.toFixed(2)}
                </div>
                <p className="text-sm text-gray-500">
                  Delivery in {gig.deliveryTime} days
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold mb-2">What's Included:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Complete service as described
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {gig.deliveryTime} days delivery
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Secure payment via escrow
                  </li>
                </ul>
              </div>
              
              {!isOwner && (
                <div className="space-y-3">
                  {isClient ? (
                    <>
                      {!showOrderConfirm ? (
                        <>
                          <button
                            onClick={() => setShowOrderConfirm(true)}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded font-bold"
                          >
                            Continue to Order (BMS {gig.price?.toFixed(2)})
                          </button>
                          <button
                            onClick={handleContactFreelancer}
                            className="w-full bg-white hover:bg-gray-50 text-blue-500 border border-blue-500 py-3 px-4 rounded font-bold"
                          >
                            Contact Freelancer
                          </button>
                        </>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <h3 className="font-semibold text-blue-800 mb-2">Confirm Your Order</h3>
                          <p className="text-blue-700 text-sm mb-4">
                            You're about to place an order for this service at BMS {gig.price?.toFixed(2)}. Proceed?
                          </p>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleCreateOrder}
                              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                            >
                              Confirm Order
                            </button>
                            <button
                              onClick={() => setShowOrderConfirm(false)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-700 text-sm">
                        Please log in as a client to order this service.
                      </p>
                      {currentUser ? (
                        <p className="text-yellow-700 text-sm mt-2">
                          You are currently logged in as a freelancer. Switch to client role to place an order.
                        </p>
                      ) : (
                        <div className="mt-2">
                          <Link to="/login" className="text-blue-500 hover:underline">
                            Login
                          </Link>
                          {' or '}
                          <Link to="/register" className="text-blue-500 hover:underline">
                            Register
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {isOwner && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-700 text-sm">
                    This is your own gig. You can edit it from your dashboard.
                  </p>
                  <Link
                    to={`/gigs/${gig._id}/edit`}
                    className="mt-2 inline-block text-blue-500 hover:underline"
                  >
                    Edit Gig
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GigDetails;