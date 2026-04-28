// Import required packages
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const Playlist = require('../models/Playlist');
const User = require('../models/User');



// ==================== MULTER SETUP ====================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

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
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, 'hexagon_secret_key_2024');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

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

// GET /api/playlists/public
router.get('/public', async (req, res) => {
    try {
        const playlists = await Playlist.find({ isPublic: true })
            .populate('songs')
            .populate('publisher', 'name profileImage')
            .sort({ createdAt: -1 });
        res.status(200).json(playlists);
    } catch (error) {
        console.error('Get public playlists error:', error.message);
        res.status(500).json({ message: 'Server error while fetching playlists' });
    }
});

// GET /api/playlists/my
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

// GET /api/playlists/admin
// Get all playlists created by admin
router.get('/admin', verifyAdmin, async (req, res) => {
    try {
        const playlists = await Playlist.find({ type: 'admin' })
            .populate('songs')
            .populate('publisher', 'name profileImage')
            .sort({ createdAt: -1 });
        res.status(200).json(playlists);
    } catch (error) {
        console.error('Get admin playlists error:', error.message);
        res.status(500).json({ message: 'Server error while fetching admin playlists' });
    }
});

// GET /api/playlists/:id
router.get('/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate({
                path: 'songs',
                populate: { path: 'artist', select: 'name profileImage' }
            })
            .populate('publisher', 'name profileImage');
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
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { name, publisher } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Please provide a playlist name' });
        }

        const isAdmin = req.user.role === 'admin';

        if (isAdmin && !publisher) {
            return res.status(400).json({ message: 'Please select a publisher artist' });
        }

        const newPlaylist = new Playlist({
            name,
            image: req.file ? req.file.filename : 'default-playlist.png',
            createdBy: isAdmin ? '000000000000000000000000' : req.user.id,
            publisher: isAdmin ? publisher : null,
            type: isAdmin ? 'admin' : 'user',
            isPublic: isAdmin ? true : false
        });

        await newPlaylist.save();
        res.status(201).json({ message: 'Playlist created successfully', playlist: newPlaylist });

    } catch (error) {
        console.error('Create playlist error:', error.message);
        res.status(500).json({ message: 'Server error while creating playlist' });
    }
});

// POST /api/playlists/:id/songs
router.post('/:id/songs', verifyToken, async (req, res) => {
    try {
        const { songId } = req.body;
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        if (playlist.songs.includes(songId)) {
            return res.status(400).json({ message: 'Song is already in this playlist' });
        }

        playlist.songs.push(songId);
        await playlist.save();

        res.status(200).json({ message: 'Song added to playlist successfully', playlist });

    } catch (error) {
        console.error('Add song to playlist error:', error.message);
        res.status(500).json({ message: 'Server error while adding song to playlist' });
    }
});

// DELETE /api/playlists/:id/songs/:songId
router.delete('/:id/songs/:songId', verifyToken, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

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
router.post('/:id/save', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const playlist = await Playlist.findById(req.params.id);

        if (!user || !playlist) {
            return res.status(404).json({ message: 'User or playlist not found' });
        }

        const isSaved = user.savedPlaylists.includes(req.params.id);

        if (isSaved) {
            user.savedPlaylists = user.savedPlaylists.filter(
                id => id.toString() !== req.params.id
            );
            await user.save();
            res.status(200).json({ message: 'Playlist removed from library', isSaved: false });
        } else {
            user.savedPlaylists.push(req.params.id);
            await user.save();
            res.status(200).json({ message: 'Playlist added to library', isSaved: true });
        }

    } catch (error) {
        console.error('Save playlist error:', error.message);
        res.status(500).json({ message: 'Server error while saving playlist' });
    }
});

// PUT /api/playlists/:id
// Edit a playlist (owner only)
router.put('/:id', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { name } = req.body;
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        // Allow admin to edit any playlist, users can only edit their own
        if (req.user.role !== 'admin' && playlist.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only edit your own playlists' });
        }

        // Update name if provided
        if (name) playlist.name = name;

        // Update publisher if provided (admin only)
        const { publisher } = req.body;
        if (publisher && req.user.role === 'admin') playlist.publisher = publisher;

        // Update image if a new one was uploaded
        if (req.file) playlist.image = req.file.filename;

        await playlist.save();
        res.status(200).json({ message: 'Playlist updated successfully', playlist });

    } catch (error) {
        console.error('Edit playlist error:', error.message);
        res.status(500).json({ message: 'Server error while editing playlist' });
    }
});

// DELETE /api/playlists/:id
// Delete a playlist (owner only)
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

// Export the router
module.exports = router;