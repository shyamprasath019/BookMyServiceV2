// File: client/src/components/BidForm.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const BidForm = ({ job, onBidSubmitted, userHasBid }) => {
  const { currentUser, activeRole } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    amount: job?.budget?.min || '',
    deliveryTime: '7',
    proposal: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateForm = () => {
    // Validate amount
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bid amount');
      return false;
    }
    
    // Check if amount is within budget range
    if (amount < job.budget.min) {
      setError(`Bid amount cannot be less than the minimum budget (BMS ${job.budget.min})`);
      return false;
    }
    
    if (amount > job.budget.max) {
      setError(`Bid amount cannot be more than the maximum budget (BMS ${job.budget.max})`);
      return false;
    }
    
    // Validate delivery time
    const deliveryTime = parseInt(formData.deliveryTime);
    if (isNaN(deliveryTime) || deliveryTime <= 0) {
      setError('Please enter a valid delivery time');
      return false;
    }

    // Check if delivery time exceeds deadline (if job has a deadline)
  if (job.deadline) {
    const deadlineDate = new Date(job.deadline);
    const currentDate = new Date();
    const deliveryDate = new Date();
    deliveryDate.setDate(currentDate.getDate() + deliveryTime);
    
    if (deliveryDate > deadlineDate) {
      setError(`Delivery time exceeds the job deadline (${new Date(job.deadline).toLocaleDateString()}). Please provide a shorter delivery timeline.`);
      return false;
    }
  }
    
    // Validate proposal
    if (formData.proposal.trim().length < 30) {
      setError('Your proposal should be at least 30 characters long');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // Submit bid
      const bidData = {
        amount: parseFloat(formData.amount),
        deliveryTime: parseInt(formData.deliveryTime),
        proposal: formData.proposal
      };
      
      const response = await api.post(`/jobs/${job._id}/bids`, bidData);
      
      setSuccess('Your bid has been submitted successfully!');
      
      // Notify parent component that a bid was submitted
      if (onBidSubmitted) {
        onBidSubmitted(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit bid');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Check if user is a freelancer
  if (activeRole !== 'freelancer') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <p className="text-yellow-800">
          You need to be logged in as a freelancer to submit bids.
        </p>
      </div>
    );
  }
  
  // Check if user is the job owner
  if (job.client._id === currentUser?._id) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <p className="text-yellow-800">
          You cannot bid on your own job posting.
        </p>
      </div>
    );
  }
  
  // Show success message if bid was submitted
  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-green-800 mb-2">Bid Submitted!</h3>
        <p className="text-green-700">
          {success} The client will review your bid and may contact you for more details.
        </p>
      </div>
    );
  }
  
  // Show existing bid message if user already bid on this job
  if (userHasBid) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-blue-800 mb-2">Bid Already Placed</h3>
        <p className="text-blue-700">
          You have already placed a bid on this job. You can check the status in your dashboard.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
      <div className="bg-blue-500 text-white px-6 py-4">
        <h3 className="text-lg font-bold">Submit a Bid</h3>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                Bid Amount (BMS Tokens)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">BMS</span>
                <input
                  className="w-full pl-12 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min={job?.budget?.min}
                  max={job?.budget?.max}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Budget range: BMS {job?.budget?.min} - {job?.budget?.max}
              </p>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deliveryTime">
                Delivery Time (days)
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                type="number"
                id="deliveryTime"
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleChange}
                placeholder="7"
                min="1"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="proposal">
              Cover Letter / Proposal
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              id="proposal"
              name="proposal"
              rows="5"
              value={formData.proposal}
              onChange={handleChange}
              placeholder="Explain why you're the best fit for this job, your approach, and any questions you have for the client..."
              required
            ></textarea>
            <p className="mt-1 text-xs text-gray-500">
              Minimum 30 characters. A good proposal increases your chances of getting hired.
            </p>
          </div>
          
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Bid'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BidForm;