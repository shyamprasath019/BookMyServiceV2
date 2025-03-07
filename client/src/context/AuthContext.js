// File: client/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setCurrentUser(JSON.parse(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    setLoading(false);
  }, []);

  const login = async (emailOrUsername, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { emailOrUsername, password });
      const { user, token } = response.data;
      
      // Set auth token in axios defaults
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data;
      
      // Set auth token in axios defaults
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    // Remove from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove auth token from axios defaults
    delete api.defaults.headers.common['Authorization'];
    
    // Update state
    setCurrentUser(null);
  };

  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await api.put(`/users/${currentUser._id}`, userData);
      const updatedUser = response.data;
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
      throw err;
    }
  };

  const switchRole = async (role) => {
    try {
      setError(null);
      const response = await api.patch(`/users/switch-role`, { role });
      const updatedUser = response.data;
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.response?.data?.message || 'Role switch failed');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      error,
      login,
      register,
      logout,
      updateProfile,
      switchRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};