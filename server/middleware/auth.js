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

const isFreelancer = (req, res, next) => {
  if (!req.user.roles.includes('freelancer')) {
    return res.status(403).json({ message: 'Access denied: Freelancer role required' });
  }
  next();
};

const isClient = (req, res, next) => {
  if (!req.user.roles.includes('client')) {
    return res.status(403).json({ message: 'Access denied: Client role required' });
  }
  next();
};

module.exports = { verifyToken, isFreelancer, isClient };