// File: client/src/pages/Messages.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/messages/conversations');
        setConversations(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load conversations');
      }
    };

    fetchConversations();
  }, []);

  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (!conversations.length) return <p>No conversations found.</p>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      {conversations.map(conv => (
        <Link key={conv._id} to={`/messages/${conv._id}`} className="block border p-4 mb-4 rounded">
          <p>Order: {conv.order?.title}</p>
          <p>Last Message: {conv.lastMessage?.content || 'No messages yet'}</p>
        </Link>
      ))}
    </div>
  );
};

export default Messages;
