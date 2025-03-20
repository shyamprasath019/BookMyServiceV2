// server/routes/uploads.js
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/auth');

// Create directory structure if it doesn't exist
const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Initialize directories
const uploadsBaseDir = path.join(__dirname, '../uploads');
const profileDir = path.join(uploadsBaseDir, 'profile');
const gigsDir = path.join(uploadsBaseDir, 'gigs');
const jobsDir = path.join(uploadsBaseDir, 'jobs');
const messagesDir = path.join(uploadsBaseDir, 'messages');
const deliveriesDir = path.join(uploadsBaseDir, 'deliveries');

[uploadsBaseDir, profileDir, gigsDir, jobsDir, messagesDir, deliveriesDir].forEach(createDirIfNotExists);

// Storage configuration for different upload types
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      // Get user ID for user-specific folders
      const userId = req.user.id;
      const userFolder = path.join(destination, userId);
      createDirIfNotExists(userFolder);
      cb(null, userFolder);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  });
};

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// General file filter
const generalFileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    // Documents
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt',
    // Archives
    '.zip', '.rar', '.7z',
    // Other
    '.csv', '.json'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const fileSizeLimit = 5 * 1024 * 1024; // 5MB
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Configure multer instances for different upload types
const profileImageUpload = multer({
  storage: createStorage(profileDir),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: imageFileFilter
});

const gigImagesUpload = multer({
  storage: createStorage(gigsDir),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: imageFileFilter
});

const jobAttachmentsUpload = multer({
  storage: createStorage(jobsDir),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: generalFileFilter
});

const messageAttachmentsUpload = multer({
  storage: createStorage(messagesDir),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: generalFileFilter
});

const deliveryAttachmentsUpload = multer({
  storage: createStorage(deliveriesDir),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: generalFileFilter
});

// Error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum file size allowed: 5MB' 
      });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// ===== Profile Image Upload =====
router.post('/profile-image', 
  verifyToken, 
  profileImageUpload.single('profileImage'),
  handleMulterError,
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Construct URL path to the file
    const relativePath = path.relative(uploadsBaseDir, req.file.path).replace(/\\/g, '/');
    const imageUrl = `/uploads/${relativePath}`;
    
    res.status(200).json({ 
      message: 'Profile image uploaded successfully',
      profileImage: imageUrl
    });
  }
);

// ===== Gig Images Upload =====
router.post('/gig-images', 
  verifyToken, 
  gigImagesUpload.array('gigImages', 5), // Max 5 images
  handleMulterError,
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Construct URL paths to the files
    const imageUrls = req.files.map(file => {
      const relativePath = path.relative(uploadsBaseDir, file.path).replace(/\\/g, '/');
      return `/uploads/${relativePath}`;
    });
    
    res.status(200).json({ 
      message: `${req.files.length} image(s) uploaded successfully`,
      imageUrls
    });
  }
);

// ===== Job Attachments Upload =====
router.post('/job-attachments', 
  verifyToken, 
  jobAttachmentsUpload.array('jobAttachments', 5), // Max 5 files
  handleMulterError,
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Construct URL paths to the files
    const attachmentUrls = req.files.map(file => {
      const relativePath = path.relative(uploadsBaseDir, file.path).replace(/\\/g, '/');
      return `/uploads/${relativePath}`;
    });
    
    res.status(200).json({ 
      message: `${req.files.length} attachment(s) uploaded successfully`,
      attachmentUrls
    });
  }
);

// ===== Message Attachments Upload =====
router.post('/message-attachments', 
  verifyToken, 
  messageAttachmentsUpload.array('messageAttachments', 5), // Max 5 files
  handleMulterError,
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Construct URL paths to the files
    const attachmentUrls = req.files.map(file => {
      const relativePath = path.relative(uploadsBaseDir, file.path).replace(/\\/g, '/');
      return `/uploads/${relativePath}`;
    });
    
    res.status(200).json({ 
      message: `${req.files.length} attachment(s) uploaded successfully`,
      attachmentUrls
    });
  }
);

// ===== Delivery Attachments Upload =====
router.post('/delivery-attachments', 
  verifyToken, 
  deliveryAttachmentsUpload.array('deliveryAttachments', 10), // Max 10 files
  handleMulterError,
  (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Construct URL paths to the files
    const deliveryUrls = req.files.map(file => {
      const relativePath = path.relative(uploadsBaseDir, file.path).replace(/\\/g, '/');
      return `/uploads/${relativePath}`;
    });
    
    res.status(200).json({ 
      message: `${req.files.length} attachment(s) uploaded successfully`,
      deliveryUrls
    });
  }
);

// Serve static files from uploads directory
// This route should be added to the main server.js file:
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = router;