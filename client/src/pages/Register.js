// File: client/src/pages/Register.js
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register, error: authError } = useContext(AuthContext);
  
  // Get role from query parameters (if any)
  const queryParams = new URLSearchParams(location.search);
  const roleFromQuery = queryParams.get('role');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    roles: roleFromQuery ? [roleFromQuery] : ['client']
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Update roles if query parameter changes
  useEffect(() => {
    if (roleFromQuery) {
      setFormData(prev => ({
        ...prev,
        roles: [roleFromQuery]
      }));
    }
  }, [roleFromQuery]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleRoleChange = (e) => {
    const role = e.target.value;
    if (role === 'both') {
      setFormData({
        ...formData,
        roles: ['client', 'freelancer']
      });
    } else {
      setFormData({
        ...formData,
        roles: [role]
      });
    }
  };
  
  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-300 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Create an Account</h1>
      
      {(error || authError) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || authError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            Username
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
            Phone Number
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Register as
          </label>
          <div className="mt-2">
            <div className="flex items-center">
              <input
                id="client"
                name="role"
                type="radio"
                value="client"
                checked={formData.roles.length === 1 && formData.roles[0] === 'client'}
                onChange={handleRoleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="client" className="ml-2 block text-sm text-gray-700">
                Client (I want to hire)
              </label>
            </div>
            <div className="flex items-center mt-2">
              <input
                id="freelancer"
                name="role"
                type="radio"
                value="freelancer"
                checked={formData.roles.length === 1 && formData.roles[0] === 'freelancer'}
                onChange={handleRoleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="freelancer" className="ml-2 block text-sm text-gray-700">
                Freelancer (I want to work)
              </label>
            </div>
            <div className="flex items-center mt-2">
              <input
                id="both"
                name="role"
                type="radio"
                value="both"
                checked={formData.roles.length === 2}
                onChange={handleRoleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="both" className="ml-2 block text-sm text-gray-700">
                Both
              </label>
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p>
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:text-blue-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;