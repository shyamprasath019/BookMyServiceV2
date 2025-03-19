// File: client/src/pages/Portfolio.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const Portfolio = () => {
  const { currentUser, activeRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form data for adding/editing portfolio items
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    image: null
  });
  
  useEffect(() => {
    // Redirect if not logged in as freelancer
    if (!currentUser || activeRole !== 'freelancer') {
      navigate('/dashboard');
      return;
    }
    
    fetchPortfolioItems();
  }, [currentUser, activeRole, navigate]);
  
  const fetchPortfolioItems = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users/profile');
      if (response.data && response.data.portfolio) {
        setPortfolioItems(response.data.portfolio);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch portfolio items');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      image: e.target.files[0]
    }));
  };
  
  const handleAddItem = () => {
    setFormData({
      title: '',
      description: '',
      link: '',
      image: null
    });
    setEditingItem(null);
    setShowAddForm(true);
  };
  
  const handleEditItem = (item) => {
    setFormData({
      title: item.title,
      description: item.description,
      link: item.link || '',
      image: null
    });
    setEditingItem(item);
    setShowAddForm(true);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create form data for file upload
    const formDataObj = new FormData();
    formDataObj.append('title', formData.title);
    formDataObj.append('description', formData.description);
    formDataObj.append('link', formData.link);
    if (formData.image) {
      formDataObj.append('image', formData.image);
    }
    
    try {
      if (editingItem) {
        // Update existing item
        await api.put(`/users/portfolio/${editingItem._id}`, formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Add new item
        await api.post('/users/portfolio', formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      // Refresh portfolio items
      fetchPortfolioItems();
      setShowAddForm(false);
      setEditingItem(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save portfolio item');
    }
  };
  
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this portfolio item?')) {
      return;
    }
    
    try {
      await api.delete(`/users/portfolio/${itemId}`);
      // Refresh portfolio items
      fetchPortfolioItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete portfolio item');
    }
  };
  
  const handleCancel = () => {
    setShowAddForm(false);
    setEditingItem(null);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="text-center py-8">Loading portfolio...</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Portfolio</h1>
        {!showAddForm && (
          <button
            onClick={handleAddItem}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add Portfolio Item
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Title
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="link">
                Project Link (Optional)
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                type="url"
                id="link"
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="https://example.com/project"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
                Project Image {editingItem && '(Leave empty to keep current image)'}
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                type="file"
                id="image"
                name="image"
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                {editingItem ? 'Update' : 'Add'} Portfolio Item
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Portfolio Items */}
      {portfolioItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">You don't have any portfolio items yet.</p>
          {!showAddForm && (
            <button
              onClick={handleAddItem}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add Your First Portfolio Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map((item) => (
            <div key={item._id} className="bg-white rounded-lg shadow overflow-hidden transition hover:shadow-lg">
              {item.imageUrl ? (
                <div className="h-48 bg-gray-200">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.description}</p>
                
                <div className="flex justify-between items-center">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      View Project
                    </a>
                  ) : (
                    <span></span>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Portfolio;