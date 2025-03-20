// File: client/src/pages/FreelancerProfile.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const FreelancerProfile = () => {
  const { id } = useParams();
  const { currentUser, activeRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [freelancer, setFreelancer] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    fetchFreelancerDetails();
  }, [id]);
  
  const fetchFreelancerDetails = async () => {
    setIsLoading(true);
    try {
      // Get freelancer profile
      const profileResponse = await api.get(`/users/freelancer/${id}`);
      setFreelancer(profileResponse.data);
      
      // Get freelancer's gigs
      const gigsResponse = await api.get(`/gigs/user/${id}`);
      setGigs(gigsResponse.data);
      
      // Get freelancer's reviews
      const reviewsResponse = await api.get(`/users/${id}/reviews`);
      setReviews(reviewsResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch freelancer details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleContactFreelancer = async () => {
    try {
      setError('');
      
      // Show loading indication
      const loadingToast = toast ? toast.loading('Starting conversation...') : null;
      
      // Create or get conversation with this freelancer
      const response = await api.get(`/messages/conversation/user/${freelancer._id}`);
      const conversationId = response.data._id;
      
      // Dismiss loading toast if toasts are available
      if (loadingToast && toast) {
        toast.dismiss(loadingToast);
        toast.success('Conversation started');
      }
      
      // Navigate to the conversation
      navigate(`/messages/${conversationId}`);
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError(err.response?.data?.message || 'Failed to start conversation');
      
      // Show error toast if toasts are available
      if (toast) {
        toast.error('Failed to start conversation');
      }
    }
  };
  
  // Render star rating
  const renderRating = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-700">
          {rating ? rating.toFixed(1) : 'N/A'}
        </span>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Loading freelancer profile...</p>
      </div>
    );
  }
  
  if (error || !freelancer) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error || 'Freelancer not found'}
        </div>
        <Link to="/find-freelancers" className="text-blue-500 hover:underline">
          &larr; Back to Freelancers
        </Link>
      </div>
    );
  }
  
  // Categories
  const categories = [
    { id: 'technical', name: 'Technical Services' },
    { id: 'design', name: 'Design & Creative' },
    { id: 'writing', name: 'Writing & Translation' },
    { id: 'electrical', name: 'Electrical Work' },
    { id: 'plumbing', name: 'Plumbing Services' },
    { id: 'cleaning', name: 'Cleaning Services' },
    { id: 'grooming', name: 'Personal Grooming' },
    { id: 'caregiving', name: 'Caregiving' }
  ];
  
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <Link to="/find-freelancers" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Back to Freelancers
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - Profile Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden sticky top-20">
            <div className="bg-blue-500 text-white p-4 text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-white border-4 border-white overflow-hidden mb-2">
                {freelancer.profileImage ? (
                  <img 
                    src={freelancer.profileImage} 
                    alt={freelancer.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-500 text-3xl font-bold">
                    {freelancer.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h1 className="text-xl font-bold">{freelancer.username}</h1>
              {freelancer.location && (
                <p className="text-sm text-blue-100">
                  <span className="mr-1">📍</span> {freelancer.location}
                </p>
              )}
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-semibold">Rating</h2>
                  <div className="flex items-center">
                    {renderRating(freelancer.avgRating)}
                    <span className="ml-1 text-sm text-gray-500">
                      ({freelancer.totalReviews} reviews)
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-semibold">Hourly Rate</h2>
                  <span className="font-semibold text-blue-600">
                    BMS {freelancer.hourlyRate ? freelancer.hourlyRate.toFixed(2) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-semibold">Availability</h2>
                  <span className="capitalize">
                    {freelancer.availability?.replace('-', ' ') || 'Not specified'}
                  </span>
                </div>
              </div>
              
              {freelancer.serviceCategories && freelancer.serviceCategories.length > 0 && (
                <div className="mb-4">
                  <h2 className="font-semibold mb-2">Categories</h2>
                  <div className="flex flex-wrap gap-2">
                    {freelancer.serviceCategories.map((categoryId, index) => {
                      const category = categories.find(c => c.id === categoryId);
                      return (
                        <span 
                          key={index}
                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm"
                        >
                          {category ? category.name : categoryId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {freelancer.skills && freelancer.skills.length > 0 && (
                <div className="mb-4">
                  <h2 className="font-semibold mb-2">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {freelancer.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Contact Button */}
              {currentUser && currentUser._id !== freelancer._id && activeRole === 'client' && (
                <div className="mt-6">
                  <button
                    onClick={handleContactFreelancer}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                    disabled={isContactLoading}
                  >
                    {isContactLoading ? 'Starting Chat...' : 'Contact'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b">
              <nav className="flex -mb-px">
                <button
                  className={`py-4 px-6 ${
                    activeTab === 'overview'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`py-4 px-6 ${
                    activeTab === 'gigs'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('gigs')}
                >
                  Services ({gigs.length})
                </button>
                <button
                  className={`py-4 px-6 ${
                    activeTab === 'portfolio'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('portfolio')}
                >
                  Portfolio
                </button>
                <button
                  className={`py-4 px-6 ${
                    activeTab === 'reviews'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('reviews')}
                >
                  Reviews ({reviews.length})
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">About Me</h2>
                  <p className="text-gray-700 whitespace-pre-line">
                    {freelancer.bio || 'This freelancer has not added a bio yet.'}
                  </p>
                </div>
              )}
              
              {/* Gigs/Services Tab */}
              {activeTab === 'gigs' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Services Offered</h2>
                  
                  {gigs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gigs.map((gig) => (
                        <div key={gig._id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                          <div className="h-40 bg-gray-200">
                            {gig.images && gig.images.length > 0 ? (
                              <img
                                src={gig.images[0]}
                                alt={gig.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2 line-clamp-1">{gig.title}</h3>
                            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                              {gig.description}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-blue-600">BMS {gig.price.toFixed(2)}</span>
                              <Link
                                to={`/gigs/${gig._id}`}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      This freelancer has not created any services yet.
                    </p>
                  )}
                </div>
              )}
              
              {/* Portfolio Tab */}
              {activeTab === 'portfolio' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Portfolio</h2>
                  
                  {freelancer.portfolio && freelancer.portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {freelancer.portfolio.map((item, index) => (
                        <div key={index} className="border rounded-lg overflow-hidden">
                          {item.imageUrl ? (
                            <div className="h-40 bg-gray-200">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : null}
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                            <p className="text-gray-600 text-sm mb-3">
                              {item.description}
                            </p>
                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline text-sm"
                              >
                                View Project
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      This freelancer has not added any portfolio items yet.
                    </p>
                  )}
                </div>
              )}
              
              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Client Reviews</h2>
                  
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review, index) => (
                        <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center overflow-hidden">
                                {review.client?.profileImage ? (
                                  <img 
                                    src={review.client.profileImage} 
                                    alt={review.client.username}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-lg font-bold text-gray-400">
                                    {review.client?.username?.charAt(0).toUpperCase() || 'C'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold">{review.client?.username || 'Client'}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {renderRating(review.rating)}
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      This freelancer has not received any reviews yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfile;