// File: client/src/pages/CreateJob.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import FileUpload from '../components/FileUpload';
import fileUploadService from '../utils/fileUploadService';
import api from '../utils/api';

const CreateJob = () => {
  const { currentUser, activeRole } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subCategory: '',
    budget: {
      min: '',
      max: ''
    },
    deadline: '',
    skills: '',
    location: {
      type: 'remote', // remote or onsite
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    attachments: []
  });
  
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Categories
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
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
      // Reset subcategory when category changes
      setFormData({
        ...formData,
        [name]: value,
        subCategory: ''
      });
    } else if (name === 'minBudget' || name === 'maxBudget') {
      // Handle nested budget object
      setFormData({
        ...formData,
        budget: {
          ...formData.budget,
          [name === 'minBudget' ? 'min' : 'max']: value
        }
      });
    } else if (name.startsWith('location.')) {
      // Handle nested location object
      const locationField = name.split('.')[1];
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [locationField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleLocationTypeChange = (type) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        type
      }
    });
  };
  
  const handleAttachmentChange = (files) => {
    setFormData({
      ...formData,
      attachments: files
    });
  };

  const validateForm = () => {
    // Title validation
    if (formData.title.trim().length < 10) {
      setError('Title should be at least 10 characters long');
      return false;
    }
    
    // Description validation
    if (formData.description.trim().length < 30) {
      setError('Description should be at least 30 characters long');
      return false;
    }
    
    // Category validation
    if (!formData.category) {
      setError('Please select a category');
      return false;
    }
    
    // Budget validation
    if (!formData.budget.min || !formData.budget.max) {
      setError('Please provide both minimum and maximum budget');
      return false;
    }
    
    if (parseFloat(formData.budget.min) > parseFloat(formData.budget.max)) {
      setError('Minimum budget cannot be greater than maximum budget');
      return false;
    }
    
    // Location validation for onsite jobs
    if (formData.location.type === 'onsite') {
      if (!formData.location.city || !formData.location.country) {
        setError('Please provide at least city and country for onsite jobs');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  setIsLoading(true);
  setError('');
  
  try {
    // Upload attachments first if there are any
    let attachmentUrls = [];
    if (formData.attachments && formData.attachments.length > 0) {
      setIsUploading(true);
      // Only upload files that are File objects (not string paths)
      const filesToUpload = formData.attachments.filter(file => file instanceof File);
      if (filesToUpload.length > 0) {
        attachmentUrls = await fileUploadService.uploadFiles(filesToUpload, 'jobs');
      }
      
      // Include any existing attachment paths
      const existingAttachmentPaths = formData.attachments
        .filter(file => typeof file === 'string')
        .map(path => path);
      
      attachmentUrls = [...existingAttachmentPaths, ...attachmentUrls];
      setIsUploading(false);
    }
    
    // Convert skills from string to array
    const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
    
    // Prepare job data
    const jobData = {
      ...formData,
      budget: {
        min: parseFloat(formData.budget.min),
        max: parseFloat(formData.budget.max)
      },
      skills: skillsArray,
      attachments: attachmentUrls
    };
    
    // Create job
    const response = await api.post('/jobs', jobData);
    
    navigate(`/jobs/${response.data._id}`);
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to create job');
  } finally {
    setIsLoading(false);
    setIsUploading(false);
  }
};
  
  // Check if user is client
  if (activeRole !== 'client') {
    return (
      <div className="max-w-3xl mx-auto mt-20 bg-white p-8 border border-gray-300 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="mb-4">You need to be logged in as a client to post jobs.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto mt-20 bg-white p-8 border border-gray-300 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Post a New Job</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
            Job Title
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="E.g. Website Development, Logo Design, Home Cleaning"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Create a clear title that describes what you need (min. 10 characters).
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Job Description
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            id="description"
            name="description"
            rows="5"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your project in detail..."
            required
          ></textarea>
          <p className="mt-1 text-sm text-gray-500">
            Provide detailed information about your project, requirements, and expectations (min. 30 characters).
          </p>
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
              Budget Range (BMS Tokens)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">BMS</span>
                  <input
                    className="w-full pl-12 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    type="number"
                    id="minBudget"
                    name="minBudget"
                    value={formData.budget.min}
                    onChange={handleChange}
                    placeholder="Min"
                    min="5"
                    step="1"
                    required
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">BMS</span>
                  <input
                    className="w-full pl-12 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    type="number"
                    id="maxBudget"
                    name="maxBudget"
                    value={formData.budget.max}
                    onChange={handleChange}
                    placeholder="Max"
                    min={formData.budget.min || '5'}
                    step="1"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deadline">
              Deadline (Optional)
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]} // Today's date as minimum
            />
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="skills">
            Required Skills (comma separated)
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            type="text"
            id="skills"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            placeholder="e.g. react, photoshop, plumbing, electrical"
          />
          <p className="mt-1 text-sm text-gray-500">
            List the skills that freelancers should have to complete your job successfully.
          </p>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Location
          </label>
          <div className="flex space-x-4 mb-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="remote"
                checked={formData.location.type === 'remote'}
                onChange={() => handleLocationTypeChange('remote')}
                className="mr-2"
              />
              <label htmlFor="remote">Remote Work</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="onsite"
                checked={formData.location.type === 'onsite'}
                onChange={() => handleLocationTypeChange('onsite')}
                className="mr-2"
              />
              <label htmlFor="onsite">On-site Work</label>
            </div>
          </div>
          
          {formData.location.type === 'onsite' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location.address">
                  Address (Optional)
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  type="text"
                  id="location.address"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location.city">
                  City
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  type="text"
                  id="location.city"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  placeholder="City"
                  required={formData.location.type === 'onsite'}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location.state">
                  State/Province (Optional)
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  type="text"
                  id="location.state"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  placeholder="State or province"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location.country">
                  Country
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  type="text"
                  id="location.country"
                  name="location.country"
                  value={formData.location.country}
                  onChange={handleChange}
                  placeholder="Country"
                  required={formData.location.type === 'onsite'}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location.postalCode">
                  Postal Code (Optional)
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  type="text"
                  id="location.postalCode"
                  name="location.postalCode"
                  value={formData.location.postalCode}
                  onChange={handleChange}
                  placeholder="Postal or ZIP code"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="attachments">
            Attachments / Images
          </label>
          <FileUpload
            files={formData.attachments}
            onChange={handleAttachmentChange}
            category="jobs"
            acceptedTypes="image/*,.pdf,.doc,.docx"
            maxFiles={5}
            multiple={true}
          />
          <p className="mt-1 text-sm text-gray-500">
            Upload images or documents to help describe your job (optional). Maximum 5 files, 5MB each.
          </p>
          
          {/* Image preview
          {images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((file, index) => (
                <div key={index} className="w-20 h-20 relative bg-gray-100 rounded">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )} */}
        </div>
        
        <div className="flex items-center justify-end mt-8">
          <button
            type="button"
            className="mr-4 text-gray-600 hover:text-gray-800"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
            disabled={isLoading}
          >
            {isLoading ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateJob;