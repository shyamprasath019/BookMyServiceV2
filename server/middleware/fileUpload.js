// server/middleware/fileUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create directory structure if it doesn't exist
const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Initialize basic directories
const uploadsBaseDir = path.join(__dirname, '../uploads');
const profileDir = path.join(uploadsBaseDir, 'profile');
const gigsDir = path.join(uploadsBaseDir, 'gigs');
const jobsDir = path.join(uploadsBaseDir, 'jobs');
const messagesDir = path.join(uploadsBaseDir, 'messages');
const deliveriesDir = path.join(uploadsBaseDir, 'deliveries');

// Create directories
[
  uploadsBaseDir, 
  profileDir, 
  gigsDir, 
  jobsDir, 
  messagesDir, 
  deliveriesDir
].forEach(createDirIfNotExists);

// Utility to create user-specific storage
const createUserStorage = (baseDir, subDir = '') => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      if (!req.user || !req.user.id) {
        return cb(new Error('User authentication required for file uploads'));
      }
      
      // Create user-specific directory
      const userDir = path.join(baseDir, req.user.id, subDir);
      createDirIfNotExists(userDir);
      cb(null, userDir);
    },
    filename: (req, file, cb) => {
      // Generate a unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = path.basename(safeFileName, ext).substring(0, 30);
      cb(null, fileName + '-' + uniqueSuffix + ext);
    }
  });
};

// File filter functions
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, GIF and WEBP images are allowed.'), false);
  }
};

const documentFileFilter = (req, file, cb) => {
  const allowedMimes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Documents
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    // Archives
    'application/zip', 
    'application/x-rar-compressed',
    // Other
    'application/json',
    'text/csv'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: images, PDFs, Office documents, text files, and archives.'), false);
  }
};

// Configure upload instances
const profileImageUpload = multer({
  storage: createUserStorage(profileDir),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: imageFileFilter
});

const gigImagesUpload = multer({
  storage: createUserStorage(gigsDir),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFileFilter
});

const jobAttachmentsUpload = multer({
  storage: createUserStorage(jobsDir),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: documentFileFilter
});

const messageAttachmentsUpload = multer({
  storage: createUserStorage(messagesDir),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: documentFileFilter
});

const orderDeliveryUpload = multer({
  storage: createUserStorage(deliveriesDir),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: documentFileFilter
});

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Generate URL helpers
const getFileUrl = (filePath) => {
  // Get relative path from the uploads directory
  const relativePath = path.relative(uploadsBaseDir, filePath).replace(/\\/g, '/');
  return `/uploads/${relativePath}`;
};

module.exports = {
  // Upload middleware
  profileImageUpload,
  gigImagesUpload,
  jobAttachmentsUpload,
  messageAttachmentsUpload,
  orderDeliveryUpload,
  
  // Error handler
  handleMulterError,
  
  // Helper functions
  getFileUrl,
  createDirIfNotExists,
  
  // Directories
  uploadsBaseDir,
  profileDir,
  gigsDir,
  jobsDir,
  messagesDir,
  deliveriesDir
};