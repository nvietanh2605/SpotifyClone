// Import required packages
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');

// Load environment variables from .env file
require('dotenv').config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to enable CORS (allows frontend to talk to backend)
app.use(cors());

// Middleware to serve static files from the public folder
app.use(express.static(path.join(__dirname, '../public')));

// Middleware to serve uploaded files (songs and images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import all routes
const authRoutes = require('./routes/auth');
const songRoutes = require('./routes/songs');
const artistRoutes = require('./routes/artists');
const playlistRoutes = require('./routes/playlists');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');

// Register all routes with their base URLs
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Define the port from .env file
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Hexagon server is running on http://localhost:${PORT}`);
});