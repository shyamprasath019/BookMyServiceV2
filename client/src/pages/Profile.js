// File: client/src/pages/Profile.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const Profile = () => {
  const { currentUser, updateProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    bio: '',
    skills: '',
    profileImage: '',
    portfolio: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username,
        email: currentUser.email,
        phone: currentUser.phone,
        bio: currentUser.bio || '',
        skills: currentUser.skills?.join(', ') || '',
        profileImage: currentUser.profileImage || '',
        portfolio: currentUser.portfolio || []
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePortfolioChange = (index, field, value) => {
    const updatedPortfolio = [...formData.portfolio];
    updatedPortfolio[index][field] = value;
    setFormData({ ...formData, portfolio: updatedPortfolio });
  };

  const addPortfolioItem = () => {
    setFormData({
      ...formData,
      portfolio: [...formData.portfolio, { title: '', description: '', imageUrl: '', link: '' }]
    });
  };

  const removePortfolioItem = (index) => {
    const updatedPortfolio = formData.portfolio.filter((_, i) => i !== index);
    setFormData({ ...formData, portfolio: updatedPortfolio });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await updateProfile({
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim())
      });
      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      {error && <p className="text-red-500">{error}</p>}

      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <input name="username" type="text" value={formData.username} onChange={handleChange} required />
          <input name="email" type="email" value={formData.email} onChange={handleChange} required />
          <input name="phone" type="text" value={formData.phone} onChange={handleChange} required />
          <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Bio" />
          <input name="skills" type="text" value={formData.skills} onChange={handleChange} placeholder="Skills (comma-separated)" />
          <input name="profileImage" type="text" value={formData.profileImage} onChange={handleChange} placeholder="Profile Image URL" />

          <h3 className="mt-6">Portfolio</h3>
          {formData.portfolio.map((item, index) => (
            <div key={index} className="border p-4 mb-4 rounded">
              <input
                type="text"
                placeholder="Title"
                value={item.title}
                onChange={(e) => handlePortfolioChange(index, 'title', e.target.value)}
              />
              <textarea
                placeholder="Description"
                value={item.description}
                onChange={(e) => handlePortfolioChange(index, 'description', e.target.value)}
              />
              <input
                type="text"
                placeholder="Image URL"
                value={item.imageUrl}
                onChange={(e) => handlePortfolioChange(index, 'imageUrl', e.target.value)}
              />
              <input
                type="text"
                placeholder="Link"
                value={item.link}
                onChange={(e) => handlePortfolioChange(index, 'link', e.target.value)}
              />
              <button type="button" onClick={() => removePortfolioItem(index)} className="bg-red-500 text-white px-4 py-2 rounded">
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addPortfolioItem} className="bg-blue-500 text-white px-4 py-2 rounded">
            Add Portfolio Item
          </button>

          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mt-4">
            Save Changes
          </button>
          <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-500 text-white px-4 py-2 rounded mt-4">
            Cancel
          </button>
        </form>
      ) : (
        <div>
          <p><strong>Username:</strong> {formData.username}</p>
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Phone:</strong> {formData.phone}</p>
          <p><strong>Bio:</strong> {formData.bio}</p>
          <p><strong>Skills:</strong> {formData.skills}</p>
          {formData.profileImage && <img src={formData.profileImage} alt="Profile" className="w-32 h-32 rounded-full mt-4" />}

          <h3 className="mt-6">Portfolio</h3>
          {formData.portfolio.map((item, index) => (
            <div key={index} className="border p-4 mb-4 rounded">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-32 h-32" />}
              {item.link && <a href={item.link} className="text-blue-500">View Project</a>}
            </div>
          ))}

          <button onClick={() => setIsEditing(true)} className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
