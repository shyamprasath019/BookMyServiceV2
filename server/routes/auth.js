// File: routes/auth.js
const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Register route
router.post('/register', [
  // Validation
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: req.body.email }, { username: req.body.username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      roles: req.body.roles || ['client']
    });

    // Save user
    const savedUser = await newUser.save();
    
    // Create JWT token
    const token = jwt.sign(
      { id: savedUser._id, roles: savedUser.roles },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return user without password
    const { password, ...userWithoutPassword } = savedUser._doc;
    
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (err) {
    next(err);
  }
});

// Login route
router.post('/login', async (req, res, next) => {
  try {
    const { emailOrUsername, password, role } = req.body;
    
    // Find user
    const user = await User.findOne({ 
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }] 
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check if user has the requested role
    if (role && !user.roles.includes(role)) {
      return res.status(403).json({ 
        message: `You don't have an active ${role} account. Please activate this role in your settings.` 
      });
    }

    // Create JWT token with active role
    const token = jwt.sign(
      { 
        id: user._id, 
        roles: user.roles,
        activeRole: role || user.roles[0] // Default to first role if none specified
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return user without password
    const { password: pwd, ...userWithoutPassword } = user._doc;
    
    res.status(200).json({ 
      user: userWithoutPassword, 
      token,
      activeRole: role || user.roles[0]
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;