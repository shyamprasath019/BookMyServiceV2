// File: client/src/pages/FindFreelancers.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const FindFreelancers = () => {
  const [freelancers, setFreelancers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    minRating: '',
    skills: ''
  });
  
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
  
  useEffect(() => {
    fetchFreelancers();
  }, []);
  
  const fetchFreelancers = async () => {
    setIsLoading(true);
    try {
      // Build query string for filtering
      const queryParams = new URLSearchParams();
      
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.minRating) queryParams.append('minRating', filters.minRating);
      if (filters.skills) queryParams.append('skills', filters.skills);
      
      const response = await api.get(`/users/freelancers?${queryParams.toString()}`);
      setFreelancers(response.data);
    } catch (err) {
      setError('Failed to fetch freelancers');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFreelancers();
  };
  
  // Render star rating
  const renderRating = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-500">
          {rating ? rating.toFixed(1) : 'N/A'}
        </span>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Find Freelancers</h1>
          <p className="text-gray-600">Discover talented professionals for your projects</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-4">Search & Filters</h2>
          <form onSubmit={handleSearchSubmit}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Search freelancers by name or skill..."
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Search
              </button>
            </div>
          </form>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Rating
            </label>
            <select
              name="minRating"
              value={filters.minRating}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="">Any Rating</option>
              <option value="5">5 Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="1">1+ Star</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skills (comma separated)
            </label>
            <input
              type="text"
              name="skills"
              value={filters.skills}
              onChange={handleFilterChange}
              placeholder="e.g. web development, design"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Freelancers List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading freelancers...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      ) : freelancers.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 mb-4">No freelancers found matching your criteria</p>
          <button
            onClick={() => {
              setFilters({
                category: '',
                search: '',
                minRating: '',
                skills: ''
              });
              fetchFreelancers();
            }}
            className="text-blue-500 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freelancers.map(freelancer => (
            <div 
              key={freelancer._id} 
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition"
            >
              <div className="p-4 border-b relative">
                <div className="mb-4 flex items-center">
                  <div className="h-16 w-16 rounded-full bg-gray-200 mr-3 flex items-center justify-center overflow-hidden">
                    {freelancer.profileImage ? (
                      <img 
                        src={freelancer.profileImage} 
                        alt={freelancer.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-gray-400">
                        {freelancer.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{freelancer.username}</h3>
                    <div className="text-sm text-gray-500">
                      {renderRating(freelancer.avgRating)}
                    </div>
                  </div>
                </div>
                
                {freelancer.serviceCategories && freelancer.serviceCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {freelancer.serviceCategories.map((category, index) => (
                      <span 
                        key={index}
                        className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full"
                      >
                        {categories.find(cat => cat.id === category)?.name || category}
                      </span>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                  {freelancer.bio || 'No bio available'}
                </p>
              </div>
              
              <div className="p-4">
                {freelancer.skills && freelancer.skills.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Skills:</h4>
                    <div className="flex flex-wrap gap-1">
                      {freelancer.skills.slice(0, 4).map((skill, index) => (
                        <span 
                          key={index}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {freelancer.skills.length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{freelancer.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  {freelancer.hourlyRate && (
                    <div className="text-sm">
                      <span className="text-gray-500">Hourly rate: </span>
                      <span className="font-bold text-blue-600">BMS {freelancer.hourlyRate.toFixed(2)}</span>
                    </div>
                  )}
                  <Link
                    to={`/freelancers/${freelancer._id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindFreelancers;