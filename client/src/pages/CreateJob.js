// File: client/src/pages/CreateJob.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';

const CreateJob = () => {
  const { currentUser } = useContext(AuthContext);
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
    attachments: []
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Add this new function for handling file uploads:
  const handleFileChange = (e) => {
    // In a real implementation, this would handle file uploads
    // For prototype, we'll just store the file names
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      attachments: files.map(file => file.name)
    });
  };

  // Mock categories (same as in CreateGig)
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
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validate min/max budget
    if (parseInt(formData.budget.min) > parseInt(formData.budget.max)) {
      setError('Minimum budget cannot be greater than maximum budget');
      setIsLoading(false);
      return;
    }
    
    try {
      // Convert skills from string to array
      const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
      
      // Prepare job data
      const jobData = {
        ...formData,
        budget: {
          min: parseInt(formData.budget.min),
          max: parseInt(formData.budget.max)
        },
        skills: skillsArray,
        attachments: formData.attachments
      };
      
      // Create job
      const response = await api.post('/jobs', jobData);
      
      navigate(`/jobs/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto bg-white p-8 border border-gray-300 rounded-lg shadow-md">
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
            Create a clear title that describes what you need.
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
            Provide detailed information about your project, requirements, and expectations.
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
              Budget Range (USD)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                  <input
                    className="w-full pl-8 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
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
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                  <input
                    className="w-full pl-8 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
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
        
        <div className="flex items-center justify-end mt-8">
          <button
            type="button"
            className="mr-4 text-gray-600 hover:text-gray-800"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="attachments">
              Job Images/Attachments
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              type="file"
              id="attachments"
              name="attachments"
              onChange={handleFileChange}
              multiple
              accept="image/*"
            />
            <p className="mt-1 text-sm text-gray-500">
              Upload up to 5 images that illustrate your project requirements. (For prototype, files won't be uploaded)
            </p>
          </div>

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