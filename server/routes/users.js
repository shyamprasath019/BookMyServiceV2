// File: routes/users.js
const router = require('express').Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = 'uploads/profile';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG and PNG files are allowed.'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: fileFilter
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

// Get a specific user's public profile
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('username profileImage bio skills avgRating totalReviews roles');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res, next) => {
  try {
    // Prevent updating sensitive fields
    const { password, email, roles, ...updateData } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
});

// Update user profile image
router.put('/profile/image', verifyToken, upload.single('profileImage'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    // Get the image path relative to server
    const profileImage = `/${req.file.path}`;
    
    // Delete old profile image if exists
    const user = await User.findById(req.user.id);
    if (user.profileImage && user.profileImage !== '' && fs.existsSync(`.${user.profileImage}`)) {
      fs.unlinkSync(`.${user.profileImage}`);
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { profileImage } },
      { new: true }
    ).select('-password');
    
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
});

// Update user email (requires password verification)
router.put('/profile/email', verifyToken, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findById(req.user.id);
    
    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Incorrect password' });
    }
    
    // Check if email is already taken
    const emailExists = await User.findOne({ email, _id: { $ne: req.user.id } });
    if (emailExists) {
      return res.status(400).json({ message: 'Email is already taken' });
    }
    
    // Update email
    user.email = email;
    await user.save();
    
    const { password: pwd, ...userWithoutPassword } = user._doc;
    
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    next(err);
  }
});

// Update user password
router.put('/profile/password', verifyToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Find user
    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

// Add portfolio item
router.post('/portfolio', verifyToken, upload.single('image'), async (req, res, next) => {
  try {
    const { title, description, link } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    
    // Get the image path if uploaded
    let imageUrl = '';
    if (req.file) {
      imageUrl = `/${req.file.path}`;
    }
    
    const portfolioItem = {
      title,
      description,
      imageUrl,
      link: link || ''
    };
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { portfolio: portfolioItem } },
      { new: true }
    ).select('-password');
    
    res.status(201).json(updatedUser);
  } catch (err) {
    next(err);
  }
});

// Update portfolio item
router.put('/portfolio/:itemId', verifyToken, upload.single('image'), async (req, res, next) => {
  try {
    const { title, description, link } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    
    // Find portfolio item
    const portfolioItem = user.portfolio.id(req.params.itemId);
    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    
    // Update fields
    if (title) portfolioItem.title = title;
    if (description) portfolioItem.description = description;
    if (link) portfolioItem.link = link;
    
    // Update image if provided
    if (req.file) {
      // Delete old image if exists
      if (portfolioItem.imageUrl && portfolioItem.imageUrl !== '' && fs.existsSync(`.${portfolioItem.imageUrl}`)) {
        fs.unlinkSync(`.${portfolioItem.imageUrl}`);
      }
      portfolioItem.imageUrl = `/${req.file.path}`;
    }
    
    // Save user
    await user.save();
    
    const { password, ...userWithoutPassword } = user._doc;
    
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    next(err);
  }
});

// Delete portfolio item
router.delete('/portfolio/:itemId', verifyToken, async (req, res, next) => {
  try {
    // Find user
    const user = await User.findById(req.user.id);
    
    // Find portfolio item
    const portfolioItem = user.portfolio.id(req.params.itemId);
    if (!portfolioItem) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }
    
    // Delete image if exists
    if (portfolioItem.imageUrl && portfolioItem.imageUrl !== '' && fs.existsSync(`.${portfolioItem.imageUrl}`)) {
      fs.unlinkSync(`.${portfolioItem.imageUrl}`);
    }
    
    // Remove portfolio item
    user.portfolio.pull(req.params.itemId);
    
    // Save user
    await user.save();
    
    const { password, ...userWithoutPassword } = user._doc;
    
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    next(err);
  }
});

// Update user skills
router.put('/skills', verifyToken, async (req, res, next) => {
  try {
    const { skills } = req.body;
    
    if (!Array.isArray(skills)) {
      return res.status(400).json({ message: 'Skills must be an array' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { skills } },
      { new: true }
    ).select('-password');
    
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
});

// Add a skill
router.post('/skills', verifyToken, async (req, res, next) => {
  try {
    const { skill } = req.body;
    
    if (!skill) {
      return res.status(400).json({ message: 'Skill is required' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { skills: skill } }, // addToSet prevents duplicates
      { new: true }
    ).select('-password');
    
    res.status(201).json(updatedUser);
  } catch (err) {
    next(err);
  }
});

// Delete a skill
router.delete('/skills/:skill', verifyToken, async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { skills: req.params.skill } },
      { new: true }
    ).select('-password');
    
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
});

// Toggle user role (add/remove freelancer or client role)
router.put('/role/:role', verifyToken, async (req, res, next) => {
  try {
    const validRoles = ['freelancer', 'client'];
    const role = req.params.role.toLowerCase();
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be freelancer or client' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (user.roles.includes(role)) {
      // Role exists, check if it's the only role
      if (user.roles.length === 1) {
        return res.status(400).json({ message: 'Cannot remove the only role' });
      }
      
      // Remove role
      user.roles = user.roles.filter(r => r !== role);
    } else {
      // Add role
      user.roles.push(role);
    }
    
    await user.save();
    
    const { password, ...userWithoutPassword } = user._doc;
    
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    next(err);
  }
});

router.post('/activate-freelancer', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user already has freelancer role
    if (user.roles.includes('freelancer')) {
      return res.status(400).json({ message: 'Freelancer account already active' });
    }
    
    // Add freelancer role
    user.roles.push('freelancer');
    
    // Add freelancer details
    const { bio, skills, hourlyRate, availability, serviceCategories } = req.body;
    
    user.bio = bio;
    user.skills = skills;
    user.hourlyRate = hourlyRate;
    user.availability = availability;
    user.serviceCategories = serviceCategories;
    
    // Create initial portfolio array if not exists
    if (!user.portfolio) {
      user.portfolio = [];
    }
    
    await user.save();
    
    // Return user without password
    const { password, ...userWithoutPassword } = user._doc;
    
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    next(err);
  }
});

// Delete user account
router.delete('/', verifyToken, async (req, res, next) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required for account deletion' });
    }
    
    // Find user
    const user = await User.findById(req.user.id);
    
    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Incorrect password' });
    }
    
    // Delete profile image if exists
    if (user.profileImage && user.profileImage !== '' && fs.existsSync(`.${user.profileImage}`)) {
      fs.unlinkSync(`.${user.profileImage}`);
    }
    
    // Delete portfolio images
    for (const item of user.portfolio) {
      if (item.imageUrl && item.imageUrl !== '' && fs.existsSync(`.${item.imageUrl}`)) {
        fs.unlinkSync(`.${item.imageUrl}`);
      }
    }
    
    // Delete user
    await User.findByIdAndDelete(req.user.id);
    
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;