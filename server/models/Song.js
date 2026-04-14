// Import mongoose to create the schema
const mongoose = require('mongoose');

// Define the structure of a song in the database
const songSchema = new mongoose.Schema({
    // Song name
    name: {
        type: String,
        required: true,
        trim: true
    },

    // Song cover image filename (stored in uploads/images folder)
    image: {
        type: String,
        default: 'default-song.png'
    },

    // Audio file filename (stored in uploads/songs folder)
    audioFile: {
        type: String,
        required: true
    },

    // Reference to the artist who owns this song
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        required: true
    },

    // Genre is fixed to 3 options only
    genre: {
        type: String,
        enum: ['Classical', 'Jazz', 'Pop'],
        required: true
    },

    // Total number of times this song has been streamed
    streamCount: {
        type: Number,
        default: 0
    }

}, {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true
});

// Export the model so routes can use it
module.exports = mongoose.model('Song', songSchema);