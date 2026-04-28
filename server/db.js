// Import mongoose to connect to MongoDB
const mongoose = require('mongoose');

// Function to connect to MongoDB
const connectDB = async () => {
    try {
        // Attempt to connect to local MongoDB
        await mongoose.connect('mongodb://localhost:27017/hexagon');

        // If successful, log a confirmation message
        console.log('MongoDB connected successfully to Hexagon database');
    } catch (error) {
        // If connection fails, log the error and stop the server
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

// Export the function so server.js can use it
module.exports = connectDB;