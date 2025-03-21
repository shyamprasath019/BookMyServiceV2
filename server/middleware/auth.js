// File: middleware/auth.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Verify active role is freelancer
const isActiveFreelancer = (req, res, next) => {
  if (!req.user.roles.includes('freelancer') || req.user.activeRole !== 'freelancer') {
    return res.status(403).json({ 
      message: 'Access denied: You must be logged in as a freelancer to access this resource' 
    });
  }
  next();
};

// Verify active role is client
const isActiveClient = (req, res, next) => {
  if (!req.user.roles.includes('client') || req.user.activeRole !== 'client') {
    return res.status(403).json({ 
      message: 'Access denied: You must be logged in as a client to access this resource' 
    });
  }
  next();
};

// Check if user has freelancer role (regardless of active role)
const hasFreelancerRole = (req, res, next) => {
  if (!req.user.roles.includes('freelancer')) {
    return res.status(403).json({ 
      message: 'Access denied: Freelancer role required' 
    });
  }
  next();
};

// Check if user has client role (regardless of active role)
const hasClientRole = (req, res, next) => {
  if (!req.user.roles.includes('client')) {
    return res.status(403).json({ 
      message: 'Access denied: Client role required' 
    });
  }
  next();
};

module.exports = { 
  verifyToken, 
  isActiveFreelancer,
  isActiveClient,
  hasFreelancerRole,
  hasClientRole
};