// File: client/src/pages/JobDetails.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [proposal, setProposal] = useState('');
  const [amount, setAmount] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${id}`);
        setJob(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load job');
      }
    };

    fetchJob();
  }, [id]);

  const handleBid = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/jobs/${id}/bids`, { proposal, amount, deliveryTime });
      alert('Bid placed successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid');
    }
  };

  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (!job) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold">{job.title}</h1>
      <p className="text-gray-700 mt-4">{job.description}</p>
      <p className="text-gray-900 font-semibold mt-2">
        Budget: ₹{job.budget.min} - ₹{job.budget.max}
      </p>
      <p className="text-gray-700 mt-2">Deadline: {new Date(job.deadline).toDateString()}</p>

      <form onSubmit={handleBid} className="mt-6">
        <textarea
          placeholder="Your proposal"
          value={proposal}
          onChange={(e) => setProposal(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Bid amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Delivery time (days)"
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Submit Bid
        </button>
      </form>
    </div>
  );
};

export default JobDetails;
