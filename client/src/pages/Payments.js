// File: client/src/pages/Payments.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

const Payments = () => {
  const { orderId } = useParams();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await api.get(`/payments/order/${orderId}`);
        setPayment(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load payment details');
      }
    };

    fetchPayment();
  }, [orderId]);

  const releasePayment = async () => {
    try {
      const response = await api.patch(`/payments/release/${orderId}`);
      setPayment(response.data.payment);
      alert('Payment released successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to release payment');
    }
  };

  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (!payment) return <p>Loading payment details...</p>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Payment Details</h1>
      <p>Amount: ₹{payment.amount}</p>
      <p>Platform Fee: ₹{payment.platformFee}</p>
      <p>Total: ₹{payment.totalAmount}</p>
      <p>Status: {payment.status}</p>

      {payment.status === 'in_escrow' && (
        <button
          onClick={releasePayment}
          className="bg-green-500 text-white px-4 py-2 rounded mt-4"
        >
          Release Payment
        </button>
      )}
    </div>
  );
};

export default Payments;
