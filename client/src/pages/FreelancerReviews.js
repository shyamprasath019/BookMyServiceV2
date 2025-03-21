// File: client/src/pages/FreelancerReviews.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ReviewsList from '../components/ReviewsList';
import ReviewStats from '../components/ReviewStats';
import api from '../utils/api';

const FreelancerReviews = () => {
  const { id } = useParams();
  const { currentUser, activeRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [freelancer, setFreelancer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchFreelancerDetails();
  }, [id]);
  
  const fetchFreelancerDetails = async () => {
    setIsLoading(true);
    try {
      // Get freelancer profile
      const profileResponse = await api.get(`/users/freelancer/${id}`);
      setFreelancer(profileResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch freelancer details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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
  
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <Link to={`/freelancers/${id}`} className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Back to {freelancer.username}'s Profile
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - Freelancer Info */}
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
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <ReviewStats
                  avgRating={freelancer.avgRating}
                  totalReviews={freelancer.totalReviews}
                  compact={true}
                />
              </div>
              
              {currentUser && currentUser._id !== freelancer._id && activeRole === 'client' && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate(`/freelancers/${id}`)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                  >
                    View Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content - Reviews */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">Reviews for {freelancer.username}</h2>
              
              <ReviewsList 
                userId={id} 
                showFilters={true} 
                limit={10} 
                showOrder={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerReviews;