// Import required packages
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const Artist = require('../models/Artist');
const User = require('../models/User');



// ==================== MULTER SETUP ====================
// Configure where to store uploaded artist images
const storage = multer.diskStorage({
    // Save images to uploads/images folder
    destination: (req, file, cb) => {
        cb(null, 'uploads/images/');
    },
    // Give each file a unique name using the current timestamp
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Only allow image files to be uploaded
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (isValid) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// ==================== MIDDLEWARE ====================
// Middleware to verify JWT token and check if user is admin
const verifyAdmin = (req, res, next) => {
    // Get token from request header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, 'hexagon_secret_key_2024');

        // Check if the user is admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to verify JWT token for regular users
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, 'hexagon_secret_key_2024');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ==================== ROUTES ====================

// GET /api/artists
// Get all artists (accessible by everyone)
router.get('/', async (req, res) => {
    try {
        const artists = await Artist.find().sort({ name: 1 });
        res.status(200).json(artists);
    } catch (error) {
        console.error('Get artists error:', error.message);
        res.status(500).json({ message: 'Server error while fetching artists' });
    }
});

// GET /api/artists/:id
// Get a single artist by ID
router.get('/:id', async (req, res) => {
    try {
        const artist = await Artist.findById(req.params.id);
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }
        res.status(200).json(artist);
    } catch (error) {
        console.error('Get artist error:', error.message);
        res.status(500).json({ message: 'Server error while fetching artist' });
    }
});

// POST /api/artists
// Create a new artist (admin only)
router.post('/', verifyAdmin, upload.single('profileImage'), async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if all fields are provided
        if (!name || !description) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        // Create new artist object
        const newArtist = new Artist({
            name,
            description,
            // If an image was uploaded, save its filename, otherwise use default
            profileImage: req.file ? req.file.filename : 'default-artist.png'
        });

        // Save the artist to the database
        await newArtist.save();
        res.status(201).json({ message: 'Artist created successfully', artist: newArtist });

    } catch (error) {
        console.error('Create artist error:', error.message);
        res.status(500).json({ message: 'Server error while creating artist' });
    }
});

// GET /api/artists/:id/follow-status
// Check if the current user follows a specific artist
router.get('/:id/follow-status', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if artist ID is in user's followedArtists list
        const isFollowing = user.followedArtists.includes(req.params.id);
        res.status(200).json({ isFollowing });

    } catch (error) {
        console.error('Follow status error:', error.message);
        res.status(500).json({ message: 'Server error while checking follow status' });
    }
});

// POST /api/artists/:id/follow
// Follow or unfollow an artist
router.post('/:id/follow', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const artist = await Artist.findById(req.params.id);

        if (!user || !artist) {
            return res.status(404).json({ message: 'User or artist not found' });
        }

        // Check if user already follows this artist
        const isFollowing = user.followedArtists.includes(req.params.id);

        if (isFollowing) {
            // Unfollow: remove artist from user's followedArtists list
            user.followedArtists = user.followedArtists.filter(
                id => id.toString() !== req.params.id
            );
            // Decrease artist follower count
            artist.followers = Math.max(0, artist.followers - 1);
            await user.save();
            await artist.save();
            res.status(200).json({ message: 'Artist unfollowed successfully', isFollowing: false });
        } else {
            // Follow: add artist to user's followedArtists list
            user.followedArtists.push(req.params.id);
            // Increase artist follower count
            artist.followers += 1;
            await user.save();
            await artist.save();
            res.status(200).json({ message: 'Artist followed successfully', isFollowing: true });
        }

    } catch (error) {
        console.error('Follow/unfollow error:', error.message);
        res.status(500).json({ message: 'Server error while following artist' });
    }
});

// Export the router so server.js can use it
module.exports = router;