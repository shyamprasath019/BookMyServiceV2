// File: client/src/pages/EditGig.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const EditGig = () => {
  const { id } = useParams();
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subCategory: '',
    pricingType: 'fixed',
    price: '',
    deliveryTime: '',
    tags: [],
    images: []
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock categories for prototype
  const categories = [
    { id: 'technical', name: 'Technical Services', subCategories: ['Web Development', 'Mobile Apps', 'Software', 'IT Support'] },
    { id: 'design', name: 'Design & Creative', subCategories: ['Graphics & Design', 'Logo Design', 'Video Editing'] },
    { id: 'writing', name: 'Writing & Translation', subCategories: ['Content Writing', 'Translation', 'Proofreading'] },
    { id: 'electrical', name: 'Electrical Work', subCategories: ['Installations', 'Repairs', 'Maintenance'] },
    { id: 'plumbing', name: 'Plumbing Services', subCategories: ['Installations', 'Repairs', 'Maintenance'] },
    { id: 'cleaning', name: 'Cleaning Services', subCategories: ['Home Cleaning', 'Office Cleaning', 'Laundry', 'Carpet Cleaning'] },
    { id: 'grooming', name: 'Personal Grooming', subCategories: ['Haircut', 'Makeup', 'Spa', 'Massage'] },
    { id: 'caregiving', name: 'Caregiving', subCategories: ['Child Care', 'Elder Care', 'Pet Care'] }
  ];
  
  useEffect(() => {
    const fetchGig = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/gigs/${id}`);
        const gig = response.data;
        
        // Check if user is the gig owner
        if (gig.owner._id !== currentUser._id) {
          setError('You can only edit your own gigs');
          navigate('/dashboard');
          return;
        }
        
        setFormData({
          title: gig.title,
          description: gig.description,
          category: gig.category,
          subCategory: gig.subCategory || '',
          pricingType: gig.pricingType,
          price: gig.price,
          deliveryTime: gig.deliveryTime,
          tags: gig.tags,
          images: gig.images
        });
      } catch (err) {
        setError('Failed to fetch gig details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGig();
  }, [id, currentUser, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
      // Reset subcategory when category changes
      setFormData({
        ...formData,
        [name]: value,
        subCategory: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleTagsChange = (e) => {
    const tagsStr = e.target.value;
    const tagsArray = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    setFormData({
      ...formData,
      tags: tagsArray
    });
  };
  
  const handleFileChange = (e) => {
    // In a real implementation, this would handle file uploads
    // For prototype, we'll just store the file names
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      images: files.map(file => file.name)
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Update gig
      await api.put(`/gigs/${id}`, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subCategory: formData.subCategory,
        pricingType: formData.pricingType,
        price: parseFloat(formData.price),
        deliveryTime: parseInt(formData.deliveryTime),
        tags: formData.tags
        // Note: In a real implementation, you would handle image uploads here
      });
      
      navigate(`/gigs/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update gig');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Loading gig details...</div>;
  }
  
  return (
    <div className="max-w-3xl mx-auto bg-white p-8 border border-gray-300 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Edit Gig</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Gig Title
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="I will..."
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            id="description"
            name="description"
            rows="5"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your service in detail..."
            required
          ></textarea>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
              Category
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subCategory">
              Sub-Category
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              id="subCategory"
              name="subCategory"
              value={formData.subCategory}
              onChange={handleChange}
              disabled={!formData.category}
              required
            >
              <option value="">Select a sub-category</option>
              {formData.category && 
                categories
                  .find(cat => cat.id === formData.category)
                  ?.subCategories.map(subCat => (
                    <option key={subCat} value={subCat}>
                      {subCat}
                    </option>
                  ))
              }
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Pricing Type
            </label>
            <div className="mt-2">
              <div className="flex items-center">
                <input
                  id="fixed"
                  name="pricingType"
                  type="radio"
                  value="fixed"
                  checked={formData.pricingType === 'fixed'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="fixed" className="ml-2 block text-sm text-gray-700">
                  Fixed Price
                </label>
              </div>
              <div className="flex items-center mt-2">
                <input
                  id="hourly"
                  name="pricingType"
                  type="radio"
                  value="hourly"
                  checked={formData.pricingType === 'hourly'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hourly" className="ml-2 block text-sm text-gray-700">
                  Hourly Rate
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
              Price (USD)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
              <input
                className="w-full pl-8 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                min="5"
                step="0.01"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deliveryTime">
              Delivery Time (days)
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              type="number"
              id="deliveryTime"
              name="deliveryTime"
              value={formData.deliveryTime}
              onChange={handleChange}
              placeholder="1"
              min="1"
              max="30"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tags">
              Tags (comma separated)
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              type="text"
              id="tags"
              name="tags"
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
              placeholder="e.g. web design, logo, wordpress"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="images">
            Gig Images
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            type="file"
            id="images"
            name="images"
            onChange={handleFileChange}
            multiple
            accept="image/*"
          />
          <p className="mt-1 text-sm text-gray-500">
            Current images: {formData.images.length > 0 ? formData.images.join(', ') : 'None'}
          </p>
        </div>
        
        <div className="flex items-center justify-end mt-8">
          <button
            type="button"
            className="mr-4 text-gray-600 hover:text-gray-800"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Gig'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditGig;