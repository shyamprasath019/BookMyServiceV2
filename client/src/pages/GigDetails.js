// File: client/src/pages/JobDetails.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const JobDetails = () => {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Bid form
  const [bidForm, setBidForm] = useState({
    amount: '',
    deliveryTime: '',
    proposal: ''
  });
  const [isBidding, setIsBidding] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  
  useEffect(() => {
    fetchJobDetails();
  }, [id]);
  
  const fetchJobDetails = async () => {
    setIsLoading(true);
    try {
      const jobResponse = await api.get(`/jobs/${id}`);
      setJob(jobResponse.data);
      
      // If current user is job owner, fetch bids
      if (currentUser && jobResponse.data.client._id === currentUser._id) {
        const bidsResponse = await api.get(`/jobs/${id}/bids`);
        setBids(bidsResponse.data);
      }
    } catch (err) {
      setError('Failed to fetch job details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBidFormChange = (e) => {
    const { name, value } = e.target;
    setBidForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setIsBidding(true);
    setBidError('');
    setBidSuccess('');
    
    try {
      const response = await api.post(`/jobs/${id}/bids`, {
        amount: parseFloat(bidForm.amount),
        deliveryTime: parseInt(bidForm.deliveryTime),
        proposal: bidForm.proposal
      });
      
      setBidSuccess('Your bid has been submitted successfully!');
      setBidForm({
        amount: '',
        deliveryTime: '',
        proposal: ''
      });
      
      // Update job to reflect new bid
      fetchJobDetails();
    } catch (err) {
      setBidError(err.response?.data?.message || 'Failed to submit bid');
    } finally {
      setIsBidding(false);
    }
  };
  
  const handleAcceptBid = async (bidId) => {
    try {
      const response = await api.post(`/orders/from-bid/${bidId}`);
      navigate(`/orders/${response.data._id}`);
    } catch (err) {
      setError('Failed to accept bid');
      console.error(err);
    }
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Loading job details...</div>;
  }
  
  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error || 'Job not found'}
        </div>
        <Link to="/jobs" className="text-blue-500 hover:underline">
          &larr; Back to Jobs
        </Link>
      </div>
    );
  }
  
  // Check if current user has already placed a bid
  const userHasBid = currentUser && 
    bids.some(bid => bid.freelancer._id === currentUser._id);
  
  // Check if current user is the job owner
  const isJobOwner = currentUser && job.client._id === currentUser._id;
  
  // Check if user is a freelancer
  const isFreelancer = currentUser && currentUser.roles.includes('freelancer');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/jobs" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Back to Jobs
      </Link>
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <span className="mr-3">Posted by {job.client.username}</span>
                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">${job.budget.min} - ${job.budget.max}</div>
              <div className="text-sm text-gray-500">Budget Range</div>
            </div>
          </div>
          
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Job Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
          </div>
          
          {job.skills && job.skills.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Skills Required</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <div>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {job.category}
              </span>
              {job.subCategory && (
                <span className="ml-2 text-gray-500">
                  / {job.subCategory}
                </span>
              )}
            </div>
            <div className="text-gray-500">
              {job.totalBids} bids so far
            </div>
          </div>
        </div>
      </div>
      
      {/* Bid section for freelancers */}
      {isFreelancer && !isJobOwner && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Place Your Bid</h2>
            
            {userHasBid ? (
              <div className="bg-yellow-100 text-yellow-700 p-4 rounded">
                You have already placed a bid on this job.
              </div>
            ) : bidSuccess ? (
              <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
                {bidSuccess}
              </div>
            ) : (
              <>
                {bidError && (
                  <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
                    {bidError}
                  </div>
                )}
                
                <form onSubmit={handleBidSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                        Bid Amount (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                        <input
                          className="w-full pl-8 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          type="number"
                          id="amount"
                          name="amount"
                          value={bidForm.amount}
                          onChange={handleBidFormChange}
                          placeholder="0.00"
                          min={job.budget.min}
                          max={job.budget.max}
                          step="0.01"
                          required
                        />
                      </div>
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
                        value={bidForm.deliveryTime}
                        onChange={handleBidFormChange}
                        placeholder="1"
                        min="1"
                        max="30"
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
                      value={bidForm.proposal}
                      onChange={handleBidFormChange}
                      placeholder="Explain why you're the best fit for this job..."
                      required
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                    disabled={isBidding}
                  >
                    {isBidding ? 'Submitting...' : 'Submit Bid'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Bids section for job owner */}
      {isJobOwner && bids.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Submitted Bids</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-4 py-2">Freelancer</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Delivery</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map(bid => (
                    <tr key={bid._id} className="border-b">
                      <td className="px-4 py-2">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center text-white">
                            {bid.freelancer.profileImage ? (
                              <img 
                                src={bid.freelancer.profileImage} 
                                alt={bid.freelancer.username}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              bid.freelancer.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{bid.freelancer.username}</div>
                            <div className="text-xs text-gray-500">
                              Rating: {bid.freelancer.avgRating?.toFixed(1) || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 font-semibold">${bid.amount.toFixed(2)}</td>
                      <td className="px-4 py-2">{bid.deliveryTime} days</td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {new Date(bid.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          bid.status === 'accepted' 
                            ? 'bg-green-100 text-green-800' 
                            : bid.status === 'rejected' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {bid.status === 'pending' && (
                          <button
                            onClick={() => handleAcceptBid(bid._id)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded"
                          >
                            Accept
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;