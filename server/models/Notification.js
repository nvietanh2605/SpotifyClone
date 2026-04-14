// Import mongoose to create the schema
const mongoose = require('mongoose');

// Define the structure of a notification in the database
const notificationSchema = new mongoose.Schema({
    // The user who will receive this notification
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // The artist who uploaded the new song
    artistName: {
        type: String,
        required: true
    },

    // The name of the newly uploaded song
    songName: {
        type: String,
        required: true
    },

    // The full notification message displayed to the user
    message: {
        type: String,
        required: true
    },

    // Whether the user has read this notification or not
    isRead: {
        type: Boolean,
        default: false
    }

}, {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true
});

// Export the model so routes can use it
module.exports = mongoose.model('Notification', notificationSchema);