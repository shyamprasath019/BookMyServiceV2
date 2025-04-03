// server/routes/uploads.js
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/auth');

// Create directories for file storage
const assetsDir = path.join(__dirname, '../../client/src/assets');
const imagesDir = path.join(assetsDir, 'images');
const createNeededDirs = () => {
  const dirs = [
    assetsDir, 
    imagesDir,
    path.join(imagesDir, 'gigs'),
    path.join(imagesDir, 'jobs'),
    path.join(imagesDir, 'profile'),
    path.join(imagesDir, 'messages'),
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Ensure directories exist
createNeededDirs();

// Set up storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { category, id } = req.body;
    
    // Create user-specific directory
    let uploadDir = path.join(imagesDir, category || 'misc');
    
    // Add ID-based subdirectory if provided
    if (id && id !== 'new') {
      uploadDir = path.join(uploadDir, id);
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a safe filename with timestamp to avoid collisions
    const timestamp = Date.now();
    const originalName = file.originalname;
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  }
});

// File filter to check allowed file types
const fileFilter = (req, file, cb) => {
  // Define allowed file types based on category
  const allowedTypes = {
    'profile': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'gigs': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'jobs': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword'],
    'messages': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    'default': ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  };
  
  const category = req.body.category || 'default';
  const allowed = allowedTypes[category] || allowedTypes.default;
  
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowed.join(', ')}`));
  }
};

// Configure multer with our storage and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Route for single file upload
router.post('/file', verifyToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  
  // Get the path relative to the client/src directory
  const relativePath = path.relative(
    path.join(__dirname, '../../client/src'),
    req.file.path
  ).replace(/\\/g, '/');
  
  res.status(200).json({
    success: true,
    message: 'File uploaded successfully',
    filePath: relativePath
  });
});

// Route for multiple file uploads
router.post('/files', verifyToken, upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  
  // Get paths relative to the client/src directory
  const relativePaths = req.files.map(file => {
    return path.relative(
      path.join(__dirname, '../../client/src'),
      file.path
    ).replace(/\\/g, '/');
  });
  
  res.status(200).json({
    success: true,
    message: `${req.files.length} files uploaded successfully`,
    filePaths: relativePaths
  });
});

// Route to delete a file
router.delete('/file', verifyToken, (req, res) => {
  const { filePath } = req.body;
  
  if (!filePath) {
    return res.status(400).json({ success: false, message: 'No file path provided' });
  }
  
  // Ensure the path is within our assets directory for security
  const fullPath = path.join(__dirname, '../../client/src', filePath);
  const assetsPath = path.resolve(assetsDir);
  
  if (!fullPath.startsWith(assetsPath)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied: Cannot delete files outside of assets directory' 
    });
  }
  
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      res.status(200).json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ success: false, message: 'Error deleting file' });
  }
});

module.exports = router;