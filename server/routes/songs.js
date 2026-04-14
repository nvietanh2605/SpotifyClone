// Import required packages
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const Song = require('../models/Song');
const Artist = require('../models/Artist');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Load environment variables
require('dotenv').config();

// ==================== MULTER SETUP ====================
// Configure storage for song images and audio files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Save audio files to uploads/songs, images to uploads/images
        if (file.fieldname === 'audioFile') {
            cb(null, 'uploads/songs/');
        } else {
            cb(null, 'uploads/images/');
        }
    },
    // Give each file a unique name using the current timestamp
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Allow both image and audio file uploads
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'audioFile') {
            // Only allow mp3 and wav audio files
            const allowedTypes = /mp3|wav/;
            const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            if (isValid) {
                cb(null, true);
            } else {
                cb(new Error('Only mp3 and wav files are allowed'));
            }
        } else {
            // Only allow image files
            const allowedTypes = /jpeg|jpg|png|gif/;
            const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            if (isValid) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'));
            }
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

// GET /api/songs
// Get all songs sorted by stream count (highest first)
router.get('/', async (req, res) => {
    try {
        const songs = await Song.find()
            .populate('artist', 'name profileImage')
            .sort({ streamCount: -1 });
        res.status(200).json(songs);
    } catch (error) {
        console.error('Get songs error:', error.message);
        res.status(500).json({ message: 'Server error while fetching songs' });
    }
});

// GET /api/songs/top
// Get top 5 most streamed songs for Hit Songs playlist
router.get('/top', async (req, res) => {
    try {
        const songs = await Song.find()
            .populate('artist', 'name profileImage')
            .sort({ streamCount: -1 })
            .limit(5);
        res.status(200).json(songs);
    } catch (error) {
        console.error('Get top songs error:', error.message);
        res.status(500).json({ message: 'Server error while fetching top songs' });
    }
});

// GET /api/songs/search
// Search songs by name, artist name or genre
router.get('/search', async (req, res) => {
    try {
        const { keyword } = req.query;

        if (!keyword) {
            return res.status(400).json({ message: 'Please provide a search keyword' });
        }

        // Find songs where name or genre matches the keyword
        const songs = await Song.find({
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { genre: { $regex: keyword, $options: 'i' } }
            ]
        }).populate('artist', 'name profileImage');

        // Also search by artist name
        const artists = await Artist.find({
            name: { $regex: keyword, $options: 'i' }
        });

        // Get all songs by matching artists
        const artistIds = artists.map(a => a._id);
        const songsByArtist = await Song.find({
            artist: { $in: artistIds }
        }).populate('artist', 'name profileImage');

        // Combine results and remove duplicates
        const allSongs = [...songs, ...songsByArtist];
        const uniqueSongs = allSongs.filter(
            (song, index, self) =>
                index === self.findIndex(s => s._id.toString() === song._id.toString())
        );

        res.status(200).json({ songs: uniqueSongs, artists });

    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ message: 'Server error while searching' });
    }
});

// GET /api/songs/:id
// Get a single song by ID
router.get('/:id', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id)
            .populate('artist', 'name profileImage');
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }
        res.status(200).json(song);
    } catch (error) {
        console.error('Get song error:', error.message);
        res.status(500).json({ message: 'Server error while fetching song' });
    }
});

// POST /api/songs
// Upload a new song (admin only)
router.post('/', verifyAdmin, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audioFile', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, artist, genre } = req.body;

        // Check if all required fields are provided
        if (!name || !artist || !genre) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        // Check if audio file was uploaded
        if (!req.files || !req.files['audioFile']) {
            return res.status(400).json({ message: 'Please upload an audio file' });
        }

        // Create new song object
        const newSong = new Song({
            name,
            artist,
            genre,
            audioFile: req.files['audioFile'][0].filename,
            image: req.files['image'] ? req.files['image'][0].filename : 'default-song.png'
        });

        // Save song to database
        await newSong.save();

        // Get artist details for notification message
        const artistDetails = await Artist.findById(artist);

        // Find all users who follow this artist
        const followers = await User.find({
            followedArtists: artist
        });

        // Create a notification for each follower
        const notifications = followers.map(follower => ({
            recipient: follower._id,
            artistName: artistDetails.name,
            songName: name,
            message: `${artistDetails.name} has uploaded a new song ${name}`
        }));

        // Save all notifications to database if there are followers
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(201).json({ message: 'Song uploaded successfully', song: newSong });

    } catch (error) {
        console.error('Upload song error:', error.message);
        res.status(500).json({ message: 'Server error while uploading song' });
    }
});

// PUT /api/songs/:id
// Edit an existing song (admin only)
router.put('/:id', verifyAdmin, upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audioFile', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, artist, genre, streamCount } = req.body;

        // Find the song to update
        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Update fields if provided
        if (name) song.name = name;
        if (artist) song.artist = artist;
        if (genre) song.genre = genre;
        if (streamCount !== undefined) song.streamCount = Number(streamCount);

        // Update image if a new one was uploaded
        if (req.files && req.files['image']) {
            song.image = req.files['image'][0].filename;
        }

        // Save updated song to database
        await song.save();
        res.status(200).json({ message: 'Song updated successfully', song });

    } catch (error) {
        console.error('Edit song error:', error.message);
        res.status(500).json({ message: 'Server error while updating song' });
    }
});

// DELETE /api/songs/:id
// Delete a song (admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Delete the song from database
        await Song.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'The song has been deleted' });

    } catch (error) {
        console.error('Delete song error:', error.message);
        res.status(500).json({ message: 'Server error while deleting song' });
    }
});

// PUT /api/songs/:id/stream
// Increment stream count by 1 when a song is played
router.put('/:id/stream', verifyToken, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        // Increase stream count by 1
        song.streamCount += 1;
        await song.save();

        res.status(200).json({ message: 'Stream count updated', streamCount: song.streamCount });

    } catch (error) {
        console.error('Stream count error:', error.message);
        res.status(500).json({ message: 'Server error while updating stream count' });
    }
});

// Export the router so server.js can use it
module.exports = router;