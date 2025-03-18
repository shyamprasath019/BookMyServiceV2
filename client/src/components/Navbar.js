// File: client/src/components/Navbar.js
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, activeRole, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Determine navigation links based on activeRole
  const getNavLinks = () => {
    if (!currentUser) {
      return [
        { to: '/gigs', label: 'Find Services' },
        { to: '/jobs', label: 'Browse Jobs' }
      ];
    }
    
    if (activeRole === 'client') {
      return [
        { to: '/gigs', label: 'Find Services' },
        { to: '/find-freelancers', label: 'Find Freelancers' },
        { to: '/jobs/my-jobs', label: 'My Jobs' }
      ];
    }
    
    if (activeRole === 'freelancer') {
      return [
        { to: '/jobs', label: 'Find Jobs' },
        { to: '/gigs/my-gigs', label: 'My Gigs' },
        { to: '/portfolio', label: 'My Portfolio' }
      ];
    }
    
    return [];
  };
  
  const navLinks = getNavLinks();
  
  return (
    <nav className="bg-white shadow fixed w-full z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-blue-600 font-bold text-xl">BookMyService</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {navLinks.map((link, index) => (
                <Link 
                  key={index}
                  to={link.to}
                  className="px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center">
            {/* Search (Desktop) */}
            <div className="hidden md:flex md:items-center border rounded-lg overflow-hidden mx-4">
              <input
                type="text"
                placeholder="Search..."
                className="px-3 py-1 focus:outline-none"
              />
              <button className="px-3 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            
            {/* User Menu */}
            {currentUser ? (
              <div className="relative ml-3">
                <div>
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center text-sm focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {currentUser.profileImage ? (
                        <img
                          src={currentUser.profileImage}
                          alt={currentUser.username}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        currentUser.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="ml-2 hidden md:block">
                      {currentUser.username}
                      {activeRole && (
                        <span className="text-xs ml-1 bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                          {activeRole}
                        </span>
                      )}
                    </span>
                    <svg className="ml-1 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    
                    <Link
                      to="/messages"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Messages
                    </Link>
                    
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    {currentUser.roles.length > 1 && (
                      <div className="px-4 py-2">
                        <p className="text-xs text-gray-500 mb-1">Switch Account</p>
                        <div className="flex flex-col space-y-1">
                          {currentUser.roles.map(role => (
                            <Link
                              key={role}
                              to={`/login?switchTo=${role}`} 
                              className={`text-sm px-2 py-1 rounded ${
                                activeRole === role 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                              onClick={() => setUserMenuOpen(false)}
                            >
                              Login as {role}
                            </Link>
                          ))}
                        </div>
                        <div className="border-t border-gray-100 my-1"></div>
                      </div>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg ml-2 hover:bg-blue-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden ml-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                to={link.to}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/messages"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile Settings
                </Link>
                
                {currentUser.roles.length > 1 && (
                  <div className="px-3 py-2">
                    <p className="text-sm text-gray-500 mb-1">Switch Account</p>
                    <div className="flex flex-col space-y-1">
                      {currentUser.roles.map(role => (
                        <Link
                          key={role}
                          to={`/login?switchTo=${role}`}
                          className={`text-sm px-2 py-1 rounded ${
                            activeRole === role 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Login as {role}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;