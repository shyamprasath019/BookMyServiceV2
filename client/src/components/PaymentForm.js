// File: client/src/components/PaymentForm.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const PaymentForm = ({ order, onPaymentComplete }) => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    paymentMethod: 'wallet',
    acceptTerms: false
  });
  
  useEffect(() => {
    fetchWalletBalance();
  }, []);
  
  const fetchWalletBalance = async () => {
    try {
      const response = await api.get('/wallet/client');
      setWalletBalance(response.data.wallet.balance);
    } catch (err) {
      setError('Failed to fetch wallet balance');
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');
    
    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions');
      setIsProcessing(false);
      return;
    }
    
    try {
      if (formData.paymentMethod === 'wallet') {
        // Check if enough balance
        if (walletBalance < order.price) {
          throw new Error(`Insufficient wallet balance. Please deposit at least BMS ${(order.price - walletBalance).toFixed(2)} more.`);
        }
        
        // Process payment from wallet
        const response = await api.post(`/wallet/pay/${order._id}`);
        setSuccess(true);
        
        // Callback for parent component
        if (onPaymentComplete) {
          onPaymentComplete(response.data.order);
        }
      } else {
        // In a real app, you would process credit card payment here
        // For this mock, we'll just simulate adding money to wallet then paying
        await api.post('/wallet/client/deposit', { amount: order.price });
        const response = await api.post(`/wallet/pay/${order._id}`);
        setSuccess(true);
        
        // Callback for parent component
        if (onPaymentComplete) {
          onPaymentComplete(response.data.order);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 animate-fadeIn">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-green-800">Payment Successful!</h3>
          <p className="text-green-700 mt-2">
            Your payment of BMS {order.price.toFixed(2)} has been processed successfully.
          </p>
        </div>
        
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => navigate(`/orders/${order._id}`)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            View Order
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-blue-500 text-white px-6 py-4">
        <h3 className="text-lg font-bold">Payment Details</h3>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <h4 className="text-gray-700 font-semibold mb-3">Order Summary</h4>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-semibold">{order._id.substring(0, 8)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Service:</span>
            <span className="font-semibold">{order.title}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Freelancer:</span>
            <span className="font-semibold">{order.freelancer.username}</span>
          </div>
          <div className="flex justify-between text-lg border-t pt-2 mt-2">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-blue-600">BMS {order.price.toFixed(2)}</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h4 className="text-gray-700 font-semibold mb-3">Payment Method</h4>
            
            <div className="space-y-2">
              <div className="flex items-center p-3 border rounded-lg mb-2">
                <input
                  type="radio"
                  id="wallet"
                  name="paymentMethod"
                  value="wallet"
                  checked={formData.paymentMethod === 'wallet'}
                  onChange={handleChange}
                  className="mr-3"
                  required
                />
                <label htmlFor="wallet" className="flex flex-col">
                  <span className="font-medium">BMS Wallet</span>
                  <span className="text-sm text-gray-500">
                    Your current balance: <span className="font-semibold">BMS {walletBalance.toFixed(2)}</span>
                  </span>
                  {walletBalance < order.price && (
                    <span className="text-sm text-red-500 font-semibold">
                      Insufficient balance. Need BMS {(order.price - walletBalance).toFixed(2)} more.
                    </span>
                  )}
                </label>
              </div>
              
              <div className="flex items-center p-3 border rounded-lg">
                <input
                  type="radio"
                  id="credit-card"
                  name="paymentMethod"
                  value="credit-card"
                  checked={formData.paymentMethod === 'credit-card'}
                  onChange={handleChange}
                  className="mr-3"
                />
                <label htmlFor="credit-card" className="flex flex-col">
                  <span className="font-medium">Credit Card (Mock)</span>
                  <span className="text-sm text-gray-500">
                    For demo purposes, this will simulate a credit card payment
                  </span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="mr-2"
                required
              />
              <label htmlFor="acceptTerms">
                I agree to the terms of service and understand that payment will be held in escrow until the work is completed.
              </label>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-semibold"
              disabled={isProcessing || (formData.paymentMethod === 'wallet' && walletBalance < order.price)}
            >
              {isProcessing ? 'Processing...' : `Pay BMS ${order.price.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;