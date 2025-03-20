// File: client/src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific messaging errors
    if (error.response && error.response.status === 404) {
      if (error.config.url.includes('/messages/conversation/')) {
        // Conversation not found - log for debugging but don't redirect
        console.warn('Conversation not found, but will be handled by component:', error.config.url);
      }
    }
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect to login if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden errors with role information
    if (error.response && error.response.status === 403 && 
        error.response.data && error.response.data.message &&
        error.response.data.message.includes('role')) {
      console.warn('Role-based permission error:', error.response.data.message);
    }
    
    return Promise.reject(error);
  }
);

const safeApiCall = async (apiMethod, errorMessage = 'Operation failed') => {
  try {
    const response = await apiMethod();
    return { 
      success: true, 
      data: response.data, 
      status: response.status
    };
  } catch (error) {
    console.error(errorMessage, error);
    return { 
      success: false, 
      error: error.response?.data?.message || errorMessage,
      status: error.response?.status
    };
  }
};
api.safeCall = safeApiCall;

export default api;