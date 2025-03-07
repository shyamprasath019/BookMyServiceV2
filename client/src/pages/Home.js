// File: client/src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Home = () => {
  const [featuredGigs, setFeaturedGigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured gigs (top rated gigs)
        const gigsResponse = await api.get('/gigs?sort=top_rated&limit=8');
        setFeaturedGigs(gigsResponse.data);
        
        // Fetch categories - normally would be a separate API call
        // For now, hardcoding categories based on requirements
        setCategories([
          { id: 'technical', name: 'Technical Services', icon: '💻' },
          { id: 'design', name: 'Design & Creative', icon: '🎨' },
          { id: 'writing', name: 'Writing & Translation', icon: '✍️' },
          { id: 'electrical', name: 'Electrical Work', icon: '⚡' },
          { id: 'plumbing', name: 'Plumbing Services', icon: '🚿' },
          { id: 'cleaning', name: 'Cleaning Services', icon: '🧹' },
          { id: 'grooming', name: 'Personal Grooming', icon: '💇' },
          { id: 'caregiving', name: 'Caregiving', icon: '👵' }
        ]);
        
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }
  
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            BookMyService
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            A Multi-Industry Freelance Service Provider & Gig Work Platform
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link
              to="/gigs"
              className="bg-white text-blue-600 hover:bg-blue-100 py-3 px-6 rounded-lg font-bold"
            >
              Find Services
            </Link>
            <Link
              to="/jobs"
              className="bg-transparent hover:bg-blue-700 border-2 border-white py-3 px-6 rounded-lg font-bold"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>
      
      {/* Search Section */}
      <section className="py-10 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex">
              <input
                type="text"
                placeholder="What service are you looking for today?"
                className="w-full px-4 py-3 rounded-l-lg border-y border-l border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-r-lg"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/gigs?category=${category.id}`}
                className="bg-white hover:bg-blue-50 border border-gray-200 p-6 rounded-lg text-center transition-colors"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-semibold">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Gigs Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Featured Services</h2>
            <Link to="/gigs" className="text-blue-500 hover:underline">
              View All
            </Link>
          </div>
          
          {featuredGigs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredGigs.map((gig) => (
                <div key={gig._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200">
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
                    <div className="flex items-center mb-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 mr-2">
                        {gig.owner?.profileImage ? (
                          <img
                            src={gig.owner.profileImage}
                            alt={gig.owner.username}
                            className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                              {gig.owner?.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">{gig.owner?.username}</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                        <Link to={`/gigs/${gig._id}`} className="hover:text-blue-500">
                          {gig.title}
                        </Link>
                      </h3>
                      <div className="flex items-center text-sm mb-2">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span>{gig.rating.toFixed(1)}</span>
                        <span className="mx-1 text-gray-400">|</span>
                        <span>{gig.totalOrders} orders</span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Starting at</span>
                        <span className="font-bold text-lg">${gig.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No featured gigs available at the moment.</p>
            )}
          </div>
        </section>
        
        {/* How it Works Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-center">How BookMyService Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Find the Perfect Service</h3>
                <p className="text-gray-600">
                  Browse through various services or post a job with your specific requirements.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">Connect with Professionals</h3>
                <p className="text-gray-600">
                  Compare profiles, reviews, and quotes from skilled professionals.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Get Work Done</h3>
                <p className="text-gray-600">
                  Pay securely through our platform and receive quality services.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Join Section */}
        <section className="py-12 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Join BookMyService Today</h2>
            <p className="text-xl mb-6 max-w-2xl mx-auto">
              Whether you're looking to offer services or hire professionals, BookMyService is your one-stop platform.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Link
                to="/register?role=freelancer"
                className="bg-white text-blue-600 hover:bg-blue-100 py-2 px-6 rounded-lg font-bold"
              >
                Become a Seller
              </Link>
              <Link
                to="/register?role=client"
                className="bg-transparent hover:bg-blue-700 border-2 border-white py-2 px-6 rounded-lg font-bold"
              >
                Join as a Client
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  };
  
  export default Home;