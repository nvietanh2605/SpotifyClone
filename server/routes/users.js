// Import required packages
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Artist = require('../models/Artist');

// Load environment variables
require('dotenv').config();

// ==================== MIDDLEWARE ====================
// Middleware to verify JWT token for any logged in user
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ==================== ROUTES ====================

// GET /api/users/profile
// Get the logged in user's profile details
router.get('/profile', verifyToken, async (req, res) => {
    try {
        // Find user by ID from token, exclude password from response
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('followedArtists', 'name profileImage followers')
            .populate('savedPlaylists', 'name image');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error('Get profile error:', error.message);
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
});

// GET /api/users/library
// Get user's library (followed artists and saved playlists)
router.get('/library', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('followedArtists', 'name profileImage followers')
            .populate({
                path: 'savedPlaylists',
                populate: { path: 'songs' }
            });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return followed artists and saved playlists separately
        res.status(200).json({
            followedArtists: user.followedArtists,
            savedPlaylists: user.savedPlaylists
        });

    } catch (error) {
        console.error('Get library error:', error.message);
        res.status(500).json({ message: 'Server error while fetching library' });
    }
});

// PUT /api/users/profile
// Update the logged in user's profile (name only for now)
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Please provide a name' });
        }

        // Find user and update name
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Profile updated successfully', user });

    } catch (error) {
        console.error('Update profile error:', error.message);
        res.status(500).json({ message: 'Server error while updating profile' });
    }
});

// Export the router so server.js can use it
module.exports = router;