// Import required packages
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');

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

// GET /api/notifications
// Get all notifications for the logged in user
router.get('/', verifyToken, async (req, res) => {
    try {
        // Find all notifications for this user, newest first
        const notifications = await Notification.find({
            recipient: req.user.id
        }).sort({ createdAt: -1 });

        // Count how many are unread
        const unreadCount = notifications.filter(n => !n.isRead).length;

        res.status(200).json({ notifications, unreadCount });

    } catch (error) {
        console.error('Get notifications error:', error.message);
        res.status(500).json({ message: 'Server error while fetching notifications' });
    }
});

// PUT /api/notifications/read-all
// Mark all notifications as read when user opens the bell dropdown
router.put('/read-all', verifyToken, async (req, res) => {
    try {
        // Update all unread notifications for this user to isRead: true
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ message: 'All notifications marked as read' });

    } catch (error) {
        console.error('Mark read error:', error.message);
        res.status(500).json({ message: 'Server error while marking notifications as read' });
    }
});

// PUT /api/notifications/:id/read
// Mark a single notification as read
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Check if this notification belongs to the logged in user
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Mark as read
        notification.isRead = true;
        await notification.save();

        res.status(200).json({ message: 'Notification marked as read' });

    } catch (error) {
        console.error('Mark single read error:', error.message);
        res.status(500).json({ message: 'Server error while marking notification as read' });
    }
});

// DELETE /api/notifications/:id
// Delete a single notification
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Check if this notification belongs to the logged in user
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Delete the notification
        await Notification.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Notification deleted successfully' });

    } catch (error) {
        console.error('Delete notification error:', error.message);
        res.status(500).json({ message: 'Server error while deleting notification' });
    }
});

// Export the router so server.js can use it
module.exports = router;