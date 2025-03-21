// File: client/src/pages/Reviews.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReviewsList from '../components/ReviewsList';
import api from '../utils/api';

const Reviews = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/users/${userId}`);
        setUser(response.data);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      fetchUserData();
    }
  }, [userId]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading user data...</span>
        </div>
      </div>
    );
  }
  
  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error || 'User not found'}
        </div>
        <Link to="/" className="text-blue-500 hover:underline">
          &larr; Back to Home
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      {/* Back Link */}
      <Link 
        to={`/freelancers/${userId}`} 
        className="text-blue-500 hover:underline mb-4 inline-block"
      >
        &larr; Back to {user.username}'s Profile
      </Link>
      
      {/* User Basic Info */}
      <div className="flex items-center mb-6">
        <div className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden mr-4">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white text-2xl font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.username}</h1>
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex text-yellow-400 mr-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-4 w-4 ${
                    star <= user.avgRating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-