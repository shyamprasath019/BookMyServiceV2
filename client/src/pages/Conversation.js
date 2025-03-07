// File: client/src/pages/Conversation.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

const Conversation = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/messages/conversation/${id}/messages`);
        setMessages(response.data.messages);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load messages');
      }
    };

    fetchMessages();
  }, [id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/messages/conversation/${id}`, { content: newMessage });
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    }
  };

  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Conversation</h1>
      <div className="border p-4 mb-4 h-64 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg._id} className={`mb-2 ${msg.sender === msg.currentUserId ? 'text-right' : 'text-left'}`}>
            <p className={`inline-block px-4 py-2 rounded ${msg.sender === msg.currentUserId ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {msg.content}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow px-4 py-2 border rounded-l"
          required
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-r">
          Send
        </button>
      </form>
    </div>
  );
};

export default Conversation;
