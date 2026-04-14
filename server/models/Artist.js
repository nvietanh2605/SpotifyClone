// Import mongoose to create the schema
const mongoose = require('mongoose');

// Define the structure of an artist in the database
const artistSchema = new mongoose.Schema({
    // Artist's name
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Short description of the artist
    description: {
        type: String,
        required: true,
        trim: true
    },

    // Profile image filename (stored in uploads/images folder)
    profileImage: {
        type: String,
        default: 'default-artist.png'
    },

    // Number of users following this artist
    followers: {
        type: Number,
        default: 0
    }

}, {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true
});

// Export the model so routes can use it
module.exports = mongoose.model('Artist', artistSchema);