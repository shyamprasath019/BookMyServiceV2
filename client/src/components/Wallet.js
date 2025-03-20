// File: client/src/components/Wallet.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const Wallet = () => {
  const { currentUser, activeRole } = useContext(AuthContext);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  
  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  useEffect(() => {
    fetchWalletData();
  }, [activeRole]);
  
  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/wallet/${activeRole}`);
      setWallet(response.data.wallet);
      setTransactions(response.data.transactions);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionSign = (transactionType, userRole) => {
    // Transaction types that increase balance (positive) for both roles
    if (transactionType === 'deposit') {
      return '+';
    }
    
    // Transaction types that decrease balance (negative) for both roles
    if (transactionType === 'withdrawal') {
      return '-';
    }
    
    // Role-specific transaction types
    if (userRole === 'client') {
      // Client transactions
      if (transactionType === 'payment') return '-'; // Client pays
      if (transactionType === 'refund') return '+';  // Client gets refund
      if (transactionType === 'escrow') return '(-)';  // Money goes to escrow
    } else if (userRole === 'freelancer') {
      // Freelancer transactions
      if (transactionType === 'release') return '+';  // Money released to freelancer
      if (transactionType === 'escrow') return '(+)';   // Money held in escrow (pending)
      if (transactionType === 'refund') return '-';   // Escrow money returned to client
    }
    
    // Default to negative for unknown transaction types
    return '-';
  };

  
  const handleDeposit = async (e) => {
    e.preventDefault();
    setIsDepositing(true);
    
    try {
      // Convert to number and validate
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      const response = await api.post(`/wallet/${activeRole}/deposit`, { amount });
      setWallet(response.data.wallet);
      setTransactions(response.data.transactions);
      setDepositAmount('');
      alert('Deposit successful!');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };
  
  const handleWithdraw = async (e) => {
    e.preventDefault();
    setIsWithdrawing(true);
    
    try {
      // Convert to number and validate
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      if (amount > wallet.balance) {
        throw new Error('Insufficient balance');
      }
      
      const response = await api.post(`/wallet/${activeRole}/withdraw`, { amount });
      setWallet(response.data.wallet);
      setTransactions(response.data.transactions);
      setWithdrawAmount('');
      alert('Withdrawal successful!');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
    }
  };
  
  if (loading) return <div>Loading wallet data...</div>;
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">My BMS Wallet</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {wallet && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <h3 className="text-gray-500 text-sm mb-1">Available Balance</h3>
              <p className="text-3xl font-bold text-blue-600">
                BMS {wallet.balance?.toFixed(2)}
              </p>
              {activeRole === 'freelancer' && wallet.pendingBalance > 0 && (
                <div className="mt-4">
                  <h3 className="text-gray-500 text-sm mb-1">Pending in Escrow</h3>
                  <p className="text-xl font-bold text-yellow-600">
                    BMS {wallet.pendingBalance?.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    This amount will be available after client approves completed work
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-gray-700 font-semibold mb-4">Quick Actions</h3>
              
              <div className="space-y-4">
                {/* Deposit Form */}
                <form onSubmit={handleDeposit} className="flex space-x-2">
                  <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">BMS</span>
                    <input
                      type="number"
                      className="w-full pl-12 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder="Amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      min="5"
                      step="0.01"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    disabled={isDepositing}
                  >
                    {isDepositing ? 'Processing...' : 'Deposit'}
                  </button>
                </form>
                
                {/* Withdraw Form */}
                <form onSubmit={handleWithdraw} className="flex space-x-2">
                  <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">BMS</span>
                    <input
                      type="number"
                      className="w-full pl-12 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder="Amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min="5"
                      max={wallet.balance}
                      step="0.01"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    disabled={isWithdrawing}
                  >
                    {isWithdrawing ? 'Processing...' : 'Withdraw'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Transaction History */}
        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-4">Transaction History</h3>
          
          {transactions.length === 0 ? (
            <p className="text-gray-500 italic">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Date</th>
                    <th className="py-2 px-4 border-b text-left">Type</th>
                    <th className="py-2 px-4 border-b text-left">Description</th>
                    <th className="py-2 px-4 border-b text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4">
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'deposit' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.type === 'withdrawal' 
                              ? 'bg-blue-100 text-blue-800' 
                              : transaction.type === 'payment' 
                              ? 'bg-red-100 text-red-800' 
                              : transaction.type === 'release' 
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-2 px-4">{transaction.description}</td>
                      <td className="py-2 px-4 text-right font-semibold">
  <span className={getTransactionSign(transaction.type, activeRole) === '+' 
    ? 'text-green-600' 
    : 'text-red-600'}>
    {getTransactionSign(transaction.type, activeRole)} BMS {transaction.amount.toFixed(2)}
  </span>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;