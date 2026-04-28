// Import required packages
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');



// ==================== REGISTER ROUTE ====================
// POST /api/auth/register
// Creates a new user account
router.post('/register', async (req, res) => {
    try {
        // Get name, email and password from request body
        const { name, email, password } = req.body;

        // Check if all fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        // Check if email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        // Create a new user (password will be hashed automatically by User model)
        const newUser = new User({
            name,
            email,
            password,
            role: 'user'
        });

        // Save the user to the database
        await newUser.save();

        // Return success message
        res.status(201).json({ message: 'Account created successfully. Please login.' });

    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// ==================== LOGIN ROUTE ====================
// POST /api/auth/login
// Logs in both admin and regular users
router.post('/login', async (req, res) => {
    try {
        // Get email and password from request body
        const { email, password } = req.body;

        // Check if all fields are provided
        if (!email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        // Check if the email belongs to admin
        if (
            email === 'admin001@gmail.com' && password === 'Adm1n001'
        ) {
            // Create a JWT token for admin
            const token = jwt.sign(
                { email: email, role: 'admin' },
                'hexagon_secret_key_2024',
                { expiresIn: '1d' }
            );

            // Return token and admin role to frontend
            return res.status(200).json({
                token,
                role: 'admin',
                name: 'Admin',
                message: 'Admin login successful'
            });
        }

        // If not admin, check if user exists in database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if password is correct
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Create a JWT token for the user
        const token = jwt.sign(
            { id: user._id, role: 'user' },
            'hexagon_secret_key_2024',
            { expiresIn: '1d' }
        );

        // Return token and user info to frontend
        res.status(200).json({
            token,
            role: 'user',
            name: user.name,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Export the router so server.js can use it
module.exports = router;