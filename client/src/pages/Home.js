// File: client/src/pages/Home.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Home = () => {
  const [featuredGigs, setFeaturedGigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [testimonials, setTestimonials] = useState([]);
  const heroRef = useRef(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured gigs (top rated gigs)
        const gigsResponse = await api.get('/gigs?sort=top_rated&limit=8');
        setFeaturedGigs(gigsResponse.data);
        
        // Categories
        setCategories([
          { id: 'technical', name: 'Technical Services', icon: '💻', color: 'bg-blue-100 text-blue-600' },
          { id: 'design', name: 'Design & Creative', icon: '🎨', color: 'bg-purple-100 text-purple-600' },
          { id: 'writing', name: 'Writing & Translation', icon: '✍️', color: 'bg-green-100 text-green-600' },
          { id: 'electrical', name: 'Electrical Work', icon: '⚡', color: 'bg-yellow-100 text-yellow-600' },
          { id: 'plumbing', name: 'Plumbing Services', icon: '🚿', color: 'bg-blue-100 text-blue-600' },
          { id: 'cleaning', name: 'Cleaning Services', icon: '🧹', color: 'bg-green-100 text-green-600' },
          { id: 'grooming', name: 'Personal Grooming', icon: '💇', color: 'bg-purple-100 text-purple-600' },
          { id: 'caregiving', name: 'Caregiving', icon: '👵', color: 'bg-yellow-100 text-yellow-600' }
        ]);
        
        // Sample testimonials (in a real app, these would come from an API)
        setTestimonials([
          {
            id: 1,
            name: 'Sarah Johnson',
            role: 'Marketing Director',
            company: 'TechCorp',
            image: '/api/placeholder/80/80',
            text: 'BookMyService transformed how we find quality freelancers. We found exceptional talent within hours rather than weeks.',
            rating: 5
          },
          {
            id: 2,
            name: 'Michael Chen',
            role: 'Small Business Owner',
            company: 'Chen\'s Design',
            image: '/api/placeholder/80/80',
            text: 'As a small business owner, I needed reliable help without the overhead costs. This platform delivered exactly what I needed.',
            rating: 5
          },
          {
            id: 3,
            name: 'Elena Rodriguez',
            role: 'Freelance Developer',
            company: 'Self-employed',
            image: '/api/placeholder/80/80',
            text: 'I started freelancing through BookMyService and now have a steady stream of quality clients. The platform is intuitive and fair.',
            rating: 4
          }
        ]);
        
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Add parallax effect to hero section
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollPos = window.scrollY;
        heroRef.current.style.backgroundPositionY = `${scrollPos * 0.5}px`;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Navigate to search results
    window.location.href = `/gigs?search=${searchQuery}`;
  };
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }
  
  // Function to render star ratings
  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg 
            key={star} 
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen">
      {/* Hero Section with animated gradient background */}
      <div 
        ref={heroRef}
        className="relative min-h-screen flex items-center bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800 overflow-hidden"
      >
        {/* Animated shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-[20%] right-[15%] w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[30%] left-[25%] w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center text-white">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in">
            <span className="block">Your One-Stop Solution for</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">Professional Services</span>
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-blue-100 animate-fade-in animation-delay-300">
            Connect with skilled professionals across multiple industries for all your service needs, all in one place.
          </p>
          
          {/* Enhanced Search Bar */}
          <div className="max-w-3xl mx-auto mb-12 animate-fade-in animation-delay-500">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                className="w-full px-8 py-5 rounded-full text-lg text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg"
                placeholder="What service are you looking for today?"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full transition-colors shadow-md"
              >
                Search
              </button>
            </form>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row justify-center gap-4 animate-fade-in animation-delay-700">
            <Link
              to="/gigs"
              className="bg-white text-blue-700 hover:bg-blue-50 py-3 px-10 rounded-full font-bold text-lg shadow-lg transition-transform hover:scale-105"
            >
              Find Services
            </Link>
            <Link
              to="/jobs"
              className="bg-transparent hover:bg-blue-700 border-2 border-white text-white py-3 px-10 rounded-full font-bold text-lg shadow-md transition-transform hover:scale-105"
            >
              Browse Jobs
            </Link>
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg className="w-10 h-10 text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Stats Section
      <div className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-4">
              <div className="text-4xl font-bold text-blue-600 mb-2">10k+</div>
              <div className="text-gray-600">Freelancers</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-bold text-blue-600 mb-2">15k+</div>
              <div className="text-gray-600">Happy Clients</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-bold text-blue-600 mb-2">25k+</div>
              <div className="text-gray-600">Projects Completed</div>
            </div>
            <div className="p-4">
              <div className="text-4xl font-bold text-blue-600 mb-2">4.8+</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </div> */}
      
      {/* Categories Section - Enhanced */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">Explore Categories</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find the perfect service in our diverse range of categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/gigs?category=${category.id}`}
                className="service-card group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`${category.color} h-full p-8 text-center transition-all duration-300 group-hover:bg-opacity-90`}>
                  <div className="text-5xl mb-4">{category.icon}</div>
                  <h3 className="text-lg font-bold">{category.name}</h3>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-90">
                  <div className="text-white text-center p-4">
                    <h3 className="text-lg font-bold mb-2">{category.name}</h3>
                    <p className="text-sm">Browse services</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* How it Works - Improved */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">How BookMyService Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get your service needs fulfilled in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-500 rounded-full text-white text-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                1
              </div>
              <div className="hidden md:block absolute top-10 left-full w-1/3 h-0.5 bg-blue-200 transform -translate-x-4"></div>
              <h3 className="text-2xl font-bold text-center mb-4">Find the Perfect Service</h3>
              <p className="text-gray-600 text-center">
                Browse through our extensive catalog of services or post your specific job requirements. Our advanced search helps you find exactly what you need.
              </p>
            </div>
            
            <div className="relative">
              <div className="w-20 h-20 bg-blue-500 rounded-full text-white text-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                2
              </div>
              <div className="hidden md:block absolute top-10 left-full w-1/3 h-0.5 bg-blue-200 transform -translate-x-4"></div>
              <h3 className="text-2xl font-bold text-center mb-4">Connect with Experts</h3>
              <p className="text-gray-600 text-center">
                Review profiles, portfolios, and verified reviews of skilled professionals. Compare quotes and choose the perfect match for your project.
              </p>
            </div>
            
            <div>
              <div className="w-20 h-20 bg-blue-500 rounded-full text-white text-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold text-center mb-4">Get Work Done</h3>
              <p className="text-gray-600 text-center">
                Our secure payment system holds funds in escrow until you're satisfied with the service. Communicate easily and get your project completed on time.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Featured Services - Card Grid */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800">Featured Services</h2>
            <Link to="/gigs" className="text-blue-600 hover:text-blue-800 font-semibold flex items-center">
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          
          {featuredGigs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredGigs.map((gig) => (
                <Link to={`/gigs/${gig._id}`} key={gig._id} className="group">
                  <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    <div className="h-48 overflow-hidden">
                      {gig.images && gig.images.length > 0 ? (
                        <img
                          src={gig.images[0]}
                          alt={gig.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex-grow">
                      <div className="mb-3">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                          {gig.category}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {gig.title}
                      </h3>
                      
                      <div className="flex items-center mb-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center overflow-hidden">
                          {gig.owner?.profileImage ? (
                            <img
                              src={gig.owner.profileImage}
                              alt={gig.owner?.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="font-semibold text-gray-500">
                              {gig.owner?.username?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600 font-medium">{gig.owner?.username}</span>
                      </div>
                    </div>
                    
                    <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          <span className="text-sm font-medium">{gig.rating?.toFixed(1) || '0.0'}</span>
                          <span className="mx-1 text-gray-300">|</span>
                          <span className="text-sm text-gray-500">{gig.totalOrders || 0} orders</span>
                        </div>
                        <div className="text-blue-600 font-bold">BMS {gig.price?.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No featured services available at the moment.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Testimonials Section - New
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">What Our Users Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied clients and freelancers on our platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center mb-4">
                  {renderStars(testimonial.rating)}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
       */}
      {/* Improved CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
            <div className="absolute top-[30%] right-[15%] w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
            <div className="absolute bottom-[20%] left-[25%] w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
          </div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Join BookMyService Today</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Whether you're looking to offer services or hire professionals, BookMyService is your one-stop platform for all your service needs.
          </p>
          
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link
              to="/register?role=freelancer"
              className="bg-white text-blue-600 hover:bg-blue-50 py-4 px-8 rounded-full font-bold shadow-lg transition-transform hover:scale-105"
            >
              Become a Seller
            </Link>
            <Link
              to="/register?role=client"
              className="bg-transparent hover:bg-blue-700 border-2 border-white text-white py-4 px-8 rounded-full font-bold shadow-md transition-transform hover:scale-105"
            >
              Join as a Client
            </Link>
          </div>
        </div>
      </div>
      
      {/* Add custom styles for animations */}
      <style jsx>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 30px) scale(1.05); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.7s ease-out forwards;
        }
        
        .animate-blob {
          animation: blob 10s infinite;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        
        .animation-delay-700 {
          animation-delay: 0.7s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Home;