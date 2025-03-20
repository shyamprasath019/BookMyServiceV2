// File: client/src/pages/JobDetails.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import BidForm from '../components/BidForm';
import api from '../utils/api';

const JobDetails = () => {
  const { id } = useParams();
  const { currentUser, activeRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [userBid, setUserBid] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [contactingBidId, setContactingBidId] = useState(null);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);
  
  const fetchJobDetails = async () => {
    setIsLoading(true);
    try {
      const jobResponse = await api.get(`/jobs/${id}`);
      setJob(jobResponse.data);
      
      // If current user is job owner, fetch all bids
      if (currentUser && jobResponse.data.client._id === currentUser._id && activeRole === 'client') {
        const bidsResponse = await api.get(`/jobs/${id}/bids`);
        setBids(bidsResponse.data);
      }
      
      // If current user is a freelancer, check if they have already bid
      if (currentUser && activeRole === 'freelancer') {
        try {
          const userBidResponse = await api.get(`/jobs/${id}/my-bid`);
          setUserBid(userBidResponse.data);
        } catch (err) {
          // No bid found, which is fine
          setUserBid(null);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch job details');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleJobStatus = async () => {
    try {
      setError('');
      
      // Create update object - only changing isActive status
      const updateData = {
        isActive: !job.isActive
      };
      
      // Update the job
      const response = await api.put(`/jobs/${id}`, updateData);
      
      // Update local job state
      setJob(prev => ({
        ...prev,
        isActive: !prev.isActive
      }));
      
      // Show success message
      alert(`Job has been ${job.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update job status');
    }
  };
  
  const handleDeleteJob = async () => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      try {
        setError('');
        await api.delete(`/jobs/${id}`);
        
        // Show success message and redirect
        alert('Job deleted successfully');
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete job');
      }
    }
  };

  const handleBidSubmitted = (newBid) => {
    setUserBid(newBid);
    
    // Update job to reflect new bid count
    setJob(prevJob => ({
      ...prevJob,
      totalBids: (prevJob.totalBids || 0) + 1
    }));
  };
  
  const handleAcceptBid = async (bidId) => {
    try {
      const response = await api.post(`/orders/from-bid/${bidId}`);
      navigate(`/orders/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept bid');
    }
  };
  
  const handleRejectBid = async (bidId) => {
    try {
      await api.patch(`/jobs/${id}/bids/${bidId}/reject`);
      
      // Update bids list
      setBids(prevBids => 
        prevBids.map(bid => 
          bid._id === bidId ? { ...bid, status: 'rejected' } : bid
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject bid');
    }
  };

  const handleContactBidder = async (freelancerId, bidId) => {
    try {
      setError('');
      setContactingBidId(bidId);
      
      // Create or get conversation with this freelancer
      const response = await api.get(`/messages/conversation/user/${freelancerId}`);
      const conversationId = response.data._id;
      
      // Navigate to the conversation
      navigate(`/messages/${conversationId}`);
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError(err.response?.data?.message || 'Failed to start conversation');
      setContactingBidId(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Loading job details...</p>
      </div>
    );
  }
  
  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error || 'Job not found'}
        </div>
        <Link to="/jobs" className="text-blue-500 hover:underline">
          &larr; Back to Jobs
        </Link>
      </div>
    );
  }
  
  // Determine if current user has placed a bid
  const hasPlacedBid = userBid !== null;
  
  // Determine if current user is the job owner
  const isJobOwner = currentUser && job.client._id === currentUser._id && activeRole === 'client';
  
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      {/* <Link to="/jobs" className="text-blue-500 hover:underline mb-4 inline-block">
        &larr; Back to Jobs
      </Link> */}
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <span className="mr-3">Posted by {job.client.username}</span>
                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {job.category}
                </span>
                {job.subCategory && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {job.subCategory}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm ${
                  job.location.type === 'remote'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {job.location.type === 'remote' ? 'Remote' : 'On-site'}
                </span>
                {job.location.type === 'onsite' && job.location.city && job.location.country && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {job.location.city}, {job.location.country}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">
                BMS {job.budget.min} - BMS {job.budget.max}
              </div>
              <div className="text-sm text-gray-500">Budget Range</div>
              {job.deadline && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <span className="font-semibold text-yellow-800">Deadline: </span>
                      <span className="text-yellow-800">{new Date(job.deadline).toLocaleDateString()}</span>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your delivery timeline must not exceed this deadline. Plan your bid accordingly.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Job Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
          </div>
          
          {job.attachments && job.attachments.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Attachments</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {job.attachments.map((attachment, index) => (
                  <div key={index} className="border rounded overflow-hidden">
                    <img
                      src={`/src/assets/uploads/jobs/${attachment}`}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
            <div className="text-gray-500">
              <span className="font-semibold">{job.totalBids || 0}</span> bids so far
            </div>
            {!isJobOwner && activeRole === 'freelancer' && !job.selectedBid && (
              <div>
                <a href="#bid-section" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                  Place Bid
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bid section for freelancers */}
      {activeRole === 'freelancer' && !isJobOwner && (
        <div id="bid-section">
          <BidForm 
            job={job} 
            onBidSubmitted={handleBidSubmitted} 
            userHasBid={hasPlacedBid}
          />
        </div>
      )}

      {isJobOwner && (
        <div className="mt-8 border-t pt-6 mb-8">
          <h3 className="text-lg font-semibold mb-3">Job Management</h3>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/jobs/${id}/edit`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Edit Job
            </Link>
            
            <button
              onClick={toggleJobStatus}
              className={`px-4 py-2 rounded text-white ${
                job.isActive 
                  ? 'bg-yellow-500 hover:bg-yellow-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {job.isActive ? 'Deactivate Job' : 'Activate Job'}
            </button>
            
            <button
              onClick={handleDeleteJob}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Delete Job
            </button>
          </div>
          
          {!job.isActive && (
            <p className="mt-3 text-sm text-gray-500">
              Note: This job is currently inactive. Freelancers cannot see or bid on inactive jobs.
            </p>
          )}
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
                    <th className="px-4 py-2">Proposal</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map(bid => (
                    <tr key={bid._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center text-white">
                            {bid.freelancer.profileImage ? (
                              <img 
                                src={bid.freelancer.profileImage} 
                                alt={bid.freelancer.username}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <span>
                                {bid.freelancer.username.charAt(0).toUpperCase()}
                              </span>
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
                      <td className="px-4 py-2 font-semibold">
                        BMS {bid.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        {bid.deliveryTime} days
                      </td>
                      <td className="px-4 py-2 max-w-xs truncate">
                        <button
                          onClick={() => alert(bid.proposal)}
                          className="text-blue-500 underline hover:text-blue-700"
                        >
                          View Proposal
                        </button>
                      </td>
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
                      <td className="px-4 py-2 whitespace-nowrap">
                        {bid.status === 'pending' && !job.selectedBid && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptBid(bid._id)}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectBid(bid._id)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleContactBidder(bid.freelancer._id, bid._id)}
                              className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded"
                              disabled={contactingBidId === bid._id}
                            >
                              {contactingBidId === bid._id ? 'Starting Chat...' : 'Contact'}
                            </button>
                          </div>
                        )}
                        {bid.status === 'accepted' && (
                          <span className="text-green-600 font-medium">Accepted</span>
                        )}
                        {bid.status === 'rejected' && (
                          <span className="text-red-600 font-medium">Rejected</span>
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
      
      {/* User's bid details (if they've placed a bid) */}
      {activeRole === 'freelancer' && userBid && (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-8">
          <div className="bg-blue-500 text-white px-6 py-4">
            <h3 className="text-lg font-bold">Your Bid</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Amount</h4>
                <p className="text-xl font-bold">BMS {userBid.amount.toFixed(2)}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Delivery Time</h4>
                <p className="text-xl font-bold">{userBid.deliveryTime} days</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Status</h4>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  userBid.status === 'accepted' 
                    ? 'bg-green-100 text-green-800' 
                    : userBid.status === 'rejected' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {userBid.status.charAt(0).toUpperCase() + userBid.status.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-1">Your Proposal</h4>
              <p className="text-gray-700 whitespace-pre-line border p-4 rounded bg-gray-50">
                {userBid.proposal}
              </p>
            </div>
            
            <div className="mt-6 text-sm text-gray-500">
              Bid submitted on {new Date(userBid.createdAt).toLocaleString()}
            </div>
            
            {userBid.status === 'accepted' && (
              <div className="mt-4 bg-green-50 border border-green-200 p-4 rounded">
                <p className="text-green-800">
                  Congratulations! Your bid has been accepted. The client will create an order to start the project.
                </p>
              </div>
            )}
            
            {userBid.status === 'rejected' && (
              <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded">
                <p className="text-red-800">
                  Your bid was not selected for this project. Keep trying with other jobs!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetails;