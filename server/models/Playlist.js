// Import mongoose to create the schema
const mongoose = require('mongoose');

// Define the structure of a playlist in the database
const playlistSchema = new mongoose.Schema({
    // Playlist name
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Playlist cover image filename (stored in uploads/images folder)
    image: {
        type: String,
        default: 'default-playlist.png'
    },

    // List of songs in this playlist
    songs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Song'
    }],

    // Who created this playlist - either admin or a user
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },

    // Artist who published this playlist (admin playlists only)
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        default: null
    },

    // Type of playlist - admin created or user created
    type: {
        type: String,
        enum: ['admin', 'user', 'auto'],
        default: 'user'
    },

    // If true, this playlist is visible on the home page for everyone
    // Only used for admin playlists and the auto Hit Songs playlist
    isPublic: {
        type: Boolean,
        default: false
    }

}, {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true
});

// Export the model so routes can use it
module.exports = mongoose.model('Playlist', playlistSchema);