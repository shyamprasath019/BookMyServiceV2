// File: server.js - Main server file

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { setupWebSocketServer } = require('./websocket');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gigRoutes = require('./routes/gigs');
const jobRoutes = require('./routes/jobs');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const messageRoutes = require('./routes/messages');
const walletRoutes = require('./routes/wallet')
const uploadRoutes = require('./routes/uploads');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/uploads', uploadRoutes);

// For the prototype, we'll create the asset directories if they don't exist
const { createDirIfNotExists } = require('./middleware/fileUpload');
const assetDirs = [
  path.join(__dirname, '../client/src/assets'),
  path.join(__dirname, '../client/src/assets/images'),
  path.join(__dirname, '../client/src/assets/images/profile'),
  path.join(__dirname, '../client/src/assets/images/gigs'),
  path.join(__dirname, '../client/src/assets/images/jobs')
];
assetDirs.forEach(createDirIfNotExists);

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';
  return res.status(status).json({
    success: false,
    status,
    message
  });
});

// Create HTTP server
const server = http.createServer(app);

// Setup WebSocket server
setupWebSocketServer(server);

const PORT = process.env.PORT || 5000;
const WS_PORT = process.env.WS_PORT || 5001;

// Start the server
server.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
  console.log(`WebSocket Server running on port ${WS_PORT}`);
});