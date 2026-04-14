// Import required packages
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const Playlist = require('../models/Playlist');
const User = require('../models/User');

// Load environment variables
require('dotenv').config();

// ==================== MULTER SETUP ====================
// Configure storage for playlist images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Only allow image files
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
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

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

// GET /api/playlists/public
// Get all public playlists for the home page (admin created playlists)
router.get('/public', async (req, res) => {
    try {
        const playlists = await Playlist.find({ isPublic: true })
            .populate('songs')
            .sort({ createdAt: -1 });
        res.status(200).json(playlists);
    } catch (error) {
        console.error('Get public playlists error:', error.message);
        res.status(500).json({ message: 'Server error while fetching playlists' });
    }
});

// GET /api/playlists/my
// Get all playlists created by the logged in user
router.get('/my', verifyToken, async (req, res) => {
    try {
        const playlists = await Playlist.find({ createdBy: req.user.id })
            .populate('songs');
        res.status(200).json(playlists);
    } catch (error) {
        console.error('Get my playlists error:', error.message);
        res.status(500).json({ message: 'Server error while fetching your playlists' });
    }
});

// GET /api/playlists/saved
// Get all playlists saved to user's library
router.get('/saved', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate({
                path: 'savedPlaylists',
                populate: { path: 'songs' }
            });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.savedPlaylists);
    } catch (error) {
        console.error('Get saved playlists error:', error.message);
        res.status(500).json({ message: 'Server error while fetching saved playlists' });
    }
});

// GET /api/playlists/:id
// Get a single playlist by ID
router.get('/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate({
                path: 'songs',
                populate: { path: 'artist', select: 'name profileImage' }
            });
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }
        res.status(200).json(playlist);
    } catch (error) {
        console.error('Get playlist error:', error.message);
        res.status(500).json({ message: 'Server error while fetching playlist' });
    }
});

// POST /api/playlists
// Create a new playlist (admin or user)
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { name } = req.body;

        // Check if playlist name is provided
        if (!name) {
            return res.status(400).json({ message: 'Please provide a playlist name' });
        }

        // Determine if creator is admin or user
        const isAdmin = req.user.role === 'admin';

        // Create new playlist object
        const newPlaylist = new Playlist({
            name,
            image: req.file ? req.file.filename : 'default-playlist.png',
            createdBy: isAdmin ? null : req.user.id,
            type: isAdmin ? 'admin' : 'user',
            // Admin playlists are public, user playlists are private
            isPublic: isAdmin ? true : false
        });

        // Save playlist to database
        await newPlaylist.save();
        res.status(201).json({ message: 'Playlist created successfully', playlist: newPlaylist });

    } catch (error) {
        console.error('Create playlist error:', error.message);
        res.status(500).json({ message: 'Server error while creating playlist' });
    }
});

// POST /api/playlists/:id/songs
// Add a song to a playlist
router.post('/:id/songs', verifyToken, async (req, res) => {
    try {
        const { songId } = req.body;
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        // Check if song is already in the playlist
        if (playlist.songs.includes(songId)) {
            return res.status(400).json({ message: 'Song is already in this playlist' });
        }

        // Add song to playlist
        playlist.songs.push(songId);
        await playlist.save();

        res.status(200).json({ message: 'Song added to playlist successfully', playlist });

    } catch (error) {
        console.error('Add song to playlist error:', error.message);
        res.status(500).json({ message: 'Server error while adding song to playlist' });
    }
});

// DELETE /api/playlists/:id/songs/:songId
// Remove a song from a playlist
router.delete('/:id/songs/:songId', verifyToken, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        // Remove song from playlist
        playlist.songs = playlist.songs.filter(
            id => id.toString() !== req.params.songId
        );

        await playlist.save();
        res.status(200).json({ message: 'Song removed from playlist successfully' });

    } catch (error) {
        console.error('Remove song error:', error.message);
        res.status(500).json({ message: 'Server error while removing song' });
    }
});

// POST /api/playlists/:id/save
// Save or unsave a public playlist to user's library
router.post('/:id/save', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const playlist = await Playlist.findById(req.params.id);

        if (!user || !playlist) {
            return res.status(404).json({ message: 'User or playlist not found' });
        }

        // Check if playlist is already saved
        const isSaved = user.savedPlaylists.includes(req.params.id);

        if (isSaved) {
            // Unsave: remove from saved playlists
            user.savedPlaylists = user.savedPlaylists.filter(
                id => id.toString() !== req.params.id
            );
            await user.save();
            res.status(200).json({ message: 'Playlist removed from library', isSaved: false });
        } else {
            // Save: add to saved playlists
            user.savedPlaylists.push(req.params.id);
            await user.save();
            res.status(200).json({ message: 'Playlist added to library', isSaved: true });
        }

    } catch (error) {
        console.error('Save playlist error:', error.message);
        res.status(500).json({ message: 'Server error while saving playlist' });
    }
});

// DELETE /api/playlists/:id
// Delete a playlist (admin or playlist owner only)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        // Delete the playlist
        await Playlist.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Playlist deleted successfully' });

    } catch (error) {
        console.error('Delete playlist error:', error.message);
        res.status(500).json({ message: 'Server error while deleting playlist' });
    }
});

// Export the router so server.js can use it
module.exports = router;