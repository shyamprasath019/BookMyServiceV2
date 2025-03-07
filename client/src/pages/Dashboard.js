// File: client/src/pages/Dashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeRole, setActiveRole] = useState('client');
  const [orders, setOrders] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [bids, setBids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Set initial active role based on user's roles
    if (currentUser.roles.includes('freelancer')) {
      setActiveRole('freelancer');
    } else {
      setActiveRole('client');
    }
    
    loadDashboardData();
  }, [currentUser, activeRole]);
  
  const loadDashboardData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch orders
      const ordersResponse = await api.get(`/orders?role=${activeRole}`);
      setOrders(ordersResponse.data);
      
      if (activeRole === 'freelancer') {
        // Fetch freelancer's gigs
        const gigsResponse = await api.get('/gigs/my-gigs');
        setGigs(gigsResponse.data);
        
        // Fetch freelancer's bids
        const bidsResponse = await api.get('/jobs/my-bids');
        setBids(bidsResponse.data);
      } else {
        // Fetch client's jobs
        const jobsResponse = await api.get('/jobs/my-jobs');
        setJobs(jobsResponse.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRoleSwitch = (role) => {
    setActiveRole(role);
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Dashboard stats calculation
  const getStats = () => {
    if (activeRole === 'freelancer') {
      return {
        activeGigs: gigs.filter(gig => gig.isActive).length,
        pendingOrders: orders.filter(order => order.status === 'pending').length,
        activeOrders: orders.filter(order => order.status === 'in_progress').length,
        completedOrders: orders.filter(order => order.status === 'completed').length,
        totalEarnings: orders
          .filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + order.price, 0)
      };
    } else {
      return {
        postedJobs: jobs.length,
        pendingOrders: orders.filter(order => order.status === 'pending').length,
        activeOrders: orders.filter(order => order.status === 'in_progress').length,
        completedOrders: orders.filter(order => order.status === 'completed').length,
        totalSpent: orders
          .filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + order.price, 0)
      };
    }
  };
  
  const stats = getStats();
  
  if (isLoading) {
    return <div className="text-center py-10">Loading dashboard data...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Dashboard</h1>
        
        {currentUser.roles.length > 1 && (
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              className={`px-4 py-2 rounded-md ${
                activeRole === 'client' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => handleRoleSwitch('client')}
            >
              Client Mode
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                activeRole === 'freelancer' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => handleRoleSwitch('freelancer')}
            >
              Freelancer Mode
            </button>
          </div>
        )}
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {activeRole === 'freelancer' ? (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm">Active Gigs</h3>
              <p className="text-2xl font-bold">{stats.activeGigs}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm">Active Orders</h3>
              <p className="text-2xl font-bold">{stats.activeOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm">Completed Orders</h3>
              <p className="text-2xl font-bold">{stats.completedOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm">Total Earnings</h3>
              <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm">Posted Jobs</h3>
              <p className="text-2xl font-bold">{stats.postedJobs}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm">Active Orders</h3>
              <p className="text-2xl font-bold">{stats.activeOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm">Completed Orders</h3>
              <p className="text-2xl font-bold">{stats.completedOrders}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm">Total Spent</h3>
              <p className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
            </div>
          </>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        {activeRole === 'freelancer' ? (
          <>
            <Link 
              to="/create-gig" 
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Create New Gig
            </Link>
            <Link 
              to="/jobs" 
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Find Jobs
            </Link>
          </>
        ) : (
          <>
            <Link 
              to="/create-job" 
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Post New Job
            </Link>
            <Link 
              to="/gigs" 
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Browse Gigs
            </Link>
          </>
        )}
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            className={`py-4 px-6 ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange('overview')}
          >
            Overview
          </button>
          <button
            className={`py-4 px-6 ${
              activeTab === 'orders'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange('orders')}
          >
            Orders
          </button>
          {activeRole === 'freelancer' ? (
            <>
              <button
                className={`py-4 px-6 ${
                  activeTab === 'gigs'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange('gigs')}
              >
                My Gigs
              </button>
              <button
                className={`py-4 px-6 ${
                  activeTab === 'bids'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange('bids')}
              >
                My Bids
              </button>
            </>
          ) : (
            <button
              className={`py-4 px-6 ${
                activeTab === 'jobs'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('jobs')}
            >
              My Jobs
            </button>
          )}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-left">Order ID</th>
                      <th className="py-2 px-4 text-left">Service</th>
                      <th className="py-2 px-4 text-left">Date</th>
                      <th className="py-2 px-4 text-left">Status</th>
                      <th className="py-2 px-4 text-left">Amount</th>
                      <th className="py-2 px-4 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order._id} className="border-b">
                        <td className="py-2 px-4">{order._id.substring(0, 8)}</td>
                        <td className="py-2 px-4">{order.title}</td>
                        <td className="py-2 px-4">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4">
                          <span 
                            className={`px-2 py-1 rounded text-xs ${
                              order.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : order.status === 'in_progress' 
                                ? 'bg-blue-100 text-blue-800' 
                                : order.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-4">${order.price.toFixed(2)}</td>
                        <td className="py-2 px-4">
                          <Link 
                            to={`/orders/${order._id}`}
                            className="text-blue-500 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No recent activity yet.</p>
            )}
            {orders.length > 5 && (
              <div className="mt-4 text-right">
                <button
                  className="text-blue-500 hover:underline"
                  onClick={() => handleTabChange('orders')}
                >
                  View all orders
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div>
            <h2 className="text-xl font-bold mb-4">My Orders</h2>
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-left">Order ID</th>
                      <th className="py-2 px-4 text-left">Service</th>
                      <th className="py-2 px-4 text-left">Date</th>
                      <th className="py-2 px-4 text-left">Status</th>
                      <th className="py-2 px-4 text-left">Amount</th>
                      <th className="py-2 px-4 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id} className="border-b">
                        <td className="py-2 px-4">{order._id.substring(0, 8)}</td>
                        <td className="py-2 px-4">{order.title}</td>
                        <td className="py-2 px-4">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4">
                          <span 
                            className={`px-2 py-1 rounded text-xs ${
                              order.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : order.status === 'in_progress' 
                                ? 'bg-blue-100 text-blue-800' 
                                : order.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-4">${order.price.toFixed(2)}</td>
                        <td className="py-2 px-4">
                          <Link 
                            to={`/orders/${order._id}`}
                            className="text-blue-500 hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No orders found.</p>
            )}
          </div>
        )}
        
        {activeTab === 'gigs' && activeRole === 'freelancer' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">My Gigs</h2>
              <Link 
                to="/create-gig" 
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Create New Gig
              </Link>
            </div>
            
            {gigs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gigs.map((gig) => (
                  <div key={gig._id} className="border rounded-lg overflow-hidden">
                    <div className="h-40 bg-gray-200">
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
                      <h3 className="font-bold text-lg mb-2">{gig.title}</h3>
                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                        {gig.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">${gig.price.toFixed(2)}</span>
                        <div className="flex space-x-2">
                          <Link
                            to={`/gigs/${gig._id}/edit`}
                            className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm"
                          >
                            Edit
                          </Link>
                          <button
                            className={`px-3 py-1 rounded text-sm ${
                              gig.isActive
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-green-600'
                            }`}
                          >
                            {gig.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven't created any gigs yet</p>
                <Link 
                  to="/create-gig" 
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  Create Your First Gig
                </Link>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'jobs' && activeRole === 'client' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">My Jobs</h2>
              <Link 
                to="/create-job" 
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Post New Job
              </Link>
            </div>
            
            {jobs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-left">Title</th>
                      <th className="py-2 px-4 text-left">Budget</th>
                      <th className="py-2 px-4 text-left">Bids</th>
                      <th className="py-2 px-4 text-left">Status</th>
                      <th className="py-2 px-4 text-left">Date Posted</th>
                      <th className="py-2 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job._id} className="border-b">
                        <td className="py-2 px-4">{job.title}</td>
                        <td className="py-2 px-4">
                          ${job.budget.min} - ${job.budget.max}
                        </td>
                        <td className="py-2 px-4">{job.totalBids}</td>
                        <td className="py-2 px-4">
                          <span 
                            className={`px-2 py-1 rounded text-xs ${
                              job.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {job.isActive ? 'Active' : 'Closed'}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex space-x-2">
                            <Link 
                              to={`/jobs/${job._id}`}
                              className="text-blue-500 hover:underline"
                            >
                              View
                            </Link>
                            <Link 
                              to={`/jobs/${job._id}/edit`}
                              className="text-green-500 hover:underline"
                            >
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven't posted any jobs yet</p>
                <Link 
                  to="/create-job" 
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                  Post Your First Job
                </Link>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'bids' && activeRole === 'freelancer' && (
          <div>
            <h2 className="text-xl font-bold mb-4">My Bids</h2>
            
            {bids.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-left">Job Title</th>
                      <th className="py-2 px-4 text-left">Bid Amount</th>
                      <th className="py-2 px-4 text-left">Delivery Time</th>
                      <th className="py-2 px-4 text-left">Status</th>
                      <th className="py-2 px-4 text-left">Date</th>
                      <th className="py-2 px-4 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map((bid) => (
                      <tr key={bid._id} className="border-b">
                        <td className="py-2 px-4">{bid.job.title}</td>
                        <td className="py-2 px-4">${bid.amount.toFixed(2)}</td>
                        <td className="py-2 px-4">{bid.deliveryTime} days</td>
                        <td className="py-2 px-4">
                          <span 
                            className={`px-2 py-1 rounded text-xs ${
                              bid.status === 'accepted' 
                                ? 'bg-green-100 text-green-800' 
                                : bid.status === 'rejected' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {bid.status}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          {new Date(bid.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4">
                          <Link 
                            to={`/jobs/${bid.job._id}`}
                            className="text-blue-500 hover:underline"
                          >
                            View Job
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">You haven't placed any bids yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;