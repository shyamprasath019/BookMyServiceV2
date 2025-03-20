// File: client/src/pages/EditJob.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const EditJob = () => {
  const { id } = useParams();
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
    skills: [],
    attachments: []
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Categories (same as in CreateJob)
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
    const fetchJob = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/jobs/${id}`);
        const job = response.data;
        
        // Check if user is the job owner
        if (job.client._id !== currentUser._id) {
          setError('You can only edit your own jobs');
          navigate('/dashboard');
          return;
        }
        
        // Make sure all necessary fields are populated from the API response
        setFormData({
          title: job.title || '',
          description: job.description || '',
          category: job.category || '',
          subCategory: job.subCategory || '',
          budget: {
            min: job.budget?.min || '',
            max: job.budget?.max || ''
          },
          deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
          skills: job.skills || [],
          location: {
            type: job.location?.type || 'remote',
            address: job.location?.address || '',
            city: job.location?.city || '',
            state: job.location?.state || '',
            country: job.location?.country || '',
            postalCode: job.location?.postalCode || ''
          }
        });
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError(err.response?.data?.message || 'Failed to fetch job details');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJob();
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
  
  const handleSkillsChange = (e) => {
    const skillsStr = e.target.value;
    const skillsArray = skillsStr.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
    setFormData({
      ...formData,
      skills: skillsArray
    });
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
      // Create job data object with properly formatted fields
      const jobData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subCategory: formData.subCategory || undefined,
        budget: {
          min: parseInt(formData.budget.min),
          max: parseInt(formData.budget.max)
        },
        deadline: formData.deadline || undefined,
        skills: formData.skills,
        location: formData.location
      };
      
      // Update job with formatted data
      const response = await api.put(`/jobs/${id}`, jobData);
      
      if (response.status === 200) {
        alert('Job updated successfully!');
        navigate(`/jobs/${id}`);
      }
    } catch (err) {
      console.error('Error updating job:', err);
      setError(err.response?.data?.message || 'Failed to update job');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Loading job details...</div>;
  }
  
  return (
    <div className="max-w-3xl mx-auto bg-white p-8 border border-gray-300 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Edit Job</h1>
      
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
            value={formData.skills.join(', ')}
            onChange={handleSkillsChange}
            placeholder="e.g. react, photoshop, plumbing, electrical"
          />
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
            {isLoading ? 'Updating...' : 'Update Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditJob;