// File: client/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null); // 'client' or 'freelancer'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const userRole = localStorage.getItem('activeRole');
    
    if (token && user && userRole) {
      setCurrentUser(JSON.parse(user));
      setActiveRole(userRole);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    setLoading(false);
  }, []);

  const login = async (emailOrUsername, password, role) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { 
        emailOrUsername, 
        password,
        role // Send requested role to backend
      });
      
      const { user, token } = response.data;
      
      // Verify user has the requested role
      if (!user.roles.includes(role)) {
        throw new Error(`You don't have an active ${role} account.`);
      }
      
      // Set auth token in axios defaults
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('activeRole', role);
      
      // Update state
      setCurrentUser(user);
      setActiveRole(role);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
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
      
      // Save to localStorage with client role by default
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('activeRole', 'client'); // Default role is client
      
      // Update state
      setCurrentUser(user);
      setActiveRole('client');
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
    localStorage.removeItem('activeRole');
    
    // Remove auth token from axios defaults
    delete api.defaults.headers.common['Authorization'];
    
    // Update state
    setCurrentUser(null);
    setActiveRole(null);
  };

  const updateProfile = async (userData) => {
    try {
      setError(null);
      const response = await api.put('/users/profile', userData);
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

  const activateFreelancerAccount = async (freelancerData) => {
    try {
      setError(null);
      // Call API to add freelancer role
      const response = await api.post('/users/activate-freelancer', freelancerData);
      const updatedUser = response.data;
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state with new role but keep activeRole as client
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.response?.data?.message || 'Freelancer activation failed');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      activeRole,
      loading,
      error,
      login,
      register,
      logout,
      updateProfile,
      activateFreelancerAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};