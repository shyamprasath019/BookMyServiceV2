// File: client/src/pages/Notifications.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/users/notifications');
        setNotifications(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load notifications');
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/users/notifications/${id}/read`);
      setNotifications(notifications.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (!notifications.length) return <p>No new notifications.</p>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      {notifications.map((notification) => (
        <div key={notification._id} className="border p-4 mb-4 rounded flex justify-between items-center">
          <p>{notification.message}</p>
          <button
            onClick={() => markAsRead(notification._id)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
