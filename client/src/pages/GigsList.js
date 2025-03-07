// File: client/src/pages/GigsList.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const GigsList = () => {
  const { currentUser } = useContext(AuthContext);
  const [gigs, setGigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  
  // Filters
  const [filters, setFilters] = useState({
    category: queryParams.get('category') || '',
    search: queryParams.get('search') || '',
    minPrice: queryParams.get('minPrice') || '',
    maxPrice: queryParams.get('maxPrice') || '',
    sort: queryParams.get('sort') || 'newest'
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
    fetchGigs();
  }, [location.search]);
  
  const fetchGigs = async () => {
    setIsLoading(true);
    try {
      // Build query string from filters or from URL
      const params = new URLSearchParams(location.search);
      
      if (!params.toString()) {
        // If no params in URL, use state filters
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        if (filters.sort) params.append('sort', filters.sort);
      }
      
      const response = await api.get(`/gigs?${params.toString()}`);
      setGigs(response.data);
    } catch (err) {
      setError('Failed to fetch gigs');
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
    
    // Build query parameters
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.sort) params.append('sort', filters.sort);
    
    // Navigate with new search params
    navigate(`/gigs?${params.toString()}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Browse Services</h1>
          <p className="text-gray-600">Find services offered by skilled professionals</p>
        </div>
        
        {currentUser && currentUser.roles.includes('freelancer') && (
          <Link
            to="/create-gig"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-4 md:mt-0"
          >
            Create New Gig
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
                  placeholder="Search services..."
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
              Min Price
            </label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="Min $"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
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
              <option value="price_low">Lowest Price</option>
              <option value="price_high">Highest Price</option>
              <option value="top_rated">Top Rated</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Gigs List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading services...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 mb-4">No services found matching your criteria</p>
          <button
            onClick={() => {
              setFilters({
                category: '',
                search: '',
                minPrice: '',
                maxPrice: '',
                sort: 'newest'
              });
              navigate('/gigs');
            }}
            className="text-blue-500 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map(gig => (
            <div key={gig._id} className="bg-white rounded-lg shadow overflow-hidden transition duration-300 transform hover:-translate-y-1 hover:shadow-lg">
              <div className="h-48 bg-gray-200 relative">
                {gig.images && gig.images.length > 0 ? (
                  <img
                    src={gig.images[0]}
                    alt={gig.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {gig.category}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500 mr-3 flex items-center justify-center text-white">
                    {gig.owner?.profileImage ? (
                      <img
                        src={gig.owner.profileImage}
                        alt={gig.owner.username}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <span className="font-semibold">{gig.owner?.username?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">{gig.owner?.username}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 min-h-[50px]">
                  <Link to={`/gigs/${gig._id}`} className="hover:text-blue-500 transition duration-200">
                    {gig.title}
                  </Link>
                </h3>
                <div className="flex items-center text-sm mb-3">
                  <div className="flex items-center text-yellow-500 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 font-semibold">{gig.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <span className="text-gray-400">|</span>
                  <span className="ml-2 text-gray-600">{gig.totalOrders || 0} orders</span>
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Starting at</span>
                  <span className="font-bold text-xl text-blue-600">${gig.price?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GigsList;