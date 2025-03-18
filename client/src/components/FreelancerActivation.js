// File: client/src/components/FreelancerActivation.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const FreelancerActivation = () => {
  const { currentUser, activateFreelancerAccount } = useContext(AuthContext);
  const [isActivating, setIsActivating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    bio: '',
    skills: '',
    hourlyRate: '',
    availability: 'full-time',
    serviceCategories: []
  });
  
  // Check if user already has a freelancer role
  const hasFreelancerRole = currentUser?.roles.includes('freelancer');
  
  // Categories of services
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
  
  const handleToggleForm = () => {
    setShowForm(!showForm);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData(prev => ({
        ...prev,
        serviceCategories: [...prev.serviceCategories, value]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        serviceCategories: prev.serviceCategories.filter(cat => cat !== value)
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsActivating(true);
    setError('');
    
    try {
      // Convert skills from string to array
      const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
      
      // Prepare freelancer data
      const freelancerData = {
        ...formData,
        skills: skillsArray,
        hourlyRate: parseFloat(formData.hourlyRate)
      };
      
      await activateFreelancerAccount(freelancerData);
      setSuccess(true);
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate freelancer account');
    } finally {
      setIsActivating(false);
    }
  };
  
  // If user already has freelancer role, show different content
  if (hasFreelancerRole) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-green-800 mb-2">Freelancer Account Active</h3>
        <p className="text-green-700 mb-4">
          Your freelancer account is already active. You can log in as a freelancer to access freelancer features.
        </p>
        <p className="text-sm text-green-600">
          To switch to your freelancer account, please log out and log back in selecting the "Login as Freelancer" option.
        </p>
      </div>
    );
  }
  
  // If activation was successful, show success message
  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-green-800 mb-2">Freelancer Account Activated!</h3>
        <p className="text-green-700 mb-4">
          Your freelancer account has been successfully activated. You can now log in as a freelancer to access freelancer features.
        </p>
        <p className="text-sm text-green-600">
          To switch to your freelancer account, please log out and log back in selecting the "Login as Freelancer" option.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-bold text-blue-800 mb-2">Activate Freelancer Account</h3>
      <p className="text-blue-700 mb-4">
        Want to offer your services? Activate your freelancer account to start selling your skills on BookMyService!
      </p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {!showForm ? (
        <button
          onClick={handleToggleForm}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Activate Freelancer Account
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bio">
              Professional Bio
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              id="bio"
              name="bio"
              rows="3"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell clients about your experience and expertise..."
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="skills">
              Skills (comma separated)
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              type="text"
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g. web design, plumbing, content writing"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hourlyRate">
              Hourly Rate (USD)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
              <input
                className="w-full pl-8 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                type="number"
                id="hourlyRate"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleChange}
                placeholder="0.00"
                min="5"
                step="0.01"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="availability">
              Availability
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              id="availability"
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              required
            >
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="weekends">Weekends Only</option>
              <option value="custom">Custom Schedule</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Service Categories (select at least one)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(category => (
                <div key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={category.id}
                    value={category.id}
                    checked={formData.serviceCategories.includes(category.id)}
                    onChange={handleCategoryChange}
                    className="mr-2"
                  />
                  <label htmlFor={category.id}>{category.name}</label>
                </div>
              ))}
            </div>
            {formData.serviceCategories.length === 0 && (
              <p className="text-red-500 text-xs mt-1">Please select at least one category</p>
            )}
          </div>
          
          <div className="flex items-center">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-2"
              disabled={isActivating || formData.serviceCategories.length === 0}
            >
              {isActivating ? 'Activating...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={handleToggleForm}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FreelancerActivation;