// File: client/src/pages/JobsList.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const JobsList = () => {
  const { currentUser } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    minBudget: '',
    maxBudget: '',
    sort: 'newest'
  });
  
  // Categories (same as in CreateGig)
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
    fetchJobs();
  }, [filters]);
  
  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.minBudget) queryParams.append('minBudget', filters.minBudget);
      if (filters.maxBudget) queryParams.append('maxBudget', filters.maxBudget);
      if (filters.sort) queryParams.append('sort', filters.sort);
      
      const response = await api.get(`/jobs?${queryParams.toString()}`);
      setJobs(response.data);
    } catch (err) {
      setError('Failed to fetch jobs');
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
    fetchJobs();
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Browse Jobs</h1>
          <p className="text-gray-600">Find job opportunities posted by clients</p>
        </div>
        
        {currentUser && currentUser.roles.includes('client') && (
          <Link
            to="/create-job"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-4 md:mt-0"
          >
            Post a Job
          </Link>
        )}
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
                  placeholder="Search jobs..."
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              Min Budget
            </label>
            <input
              type="number"
              name="minBudget"
              value={filters.minBudget}
              onChange={handleFilterChange}
              placeholder="Min $"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Budget
            </label>
            <input
              type="number"
              name="maxBudget"
              value={filters.maxBudget}
              onChange={handleFilterChange}
              placeholder="Max $"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              name="sort"
              value={filters.sort}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="budget_high">Highest Budget</option>
              <option value="budget_low">Lowest Budget</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Jobs List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p>Loading jobs...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 mb-4">No jobs found matching your criteria</p>
          <button
            onClick={() => setFilters({
              category: '',
              search: '',
              minBudget: '',
              maxBudget: '',
              sort: 'newest'
            })}
            className="text-blue-500 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {jobs.map(job => (
            <div key={job._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      <Link to={`/jobs/${job._id}`} className="hover:text-blue-500">
                        {job.title}
                      </Link>
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <span className="mr-3">Posted by {job.client.username}</span>
                      <span>
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">${job.budget.min} - ${job.budget.max}</div>
                    <div className="text-sm text-gray-500">Budget Range</div>
                  </div>
                </div>
                
                <p className="text-gray-700 mt-4 mb-4">{job.description.length > 200 
                  ? `${job.description.substring(0, 200)}...` 
                  : job.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                      {job.category}
                    </span>
                    <span className="ml-2 text-gray-500 text-sm">
                      {job.totalBids} bids
                    </span>
                  </div>
                  <Link
                    to={`/jobs/${job._id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded"
                  >
                    View Details
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

export default JobsList;