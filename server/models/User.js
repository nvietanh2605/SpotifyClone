// Import mongoose to create the schema
const mongoose = require('mongoose');

// Import bcryptjs to hash passwords before saving
const bcrypt = require('bcryptjs');

// Define the structure of a user in the database
const userSchema = new mongoose.Schema({
    // User's full name
    name: {
        type: String,
        required: true,
        trim: true
    },

    // User's email address (must be unique)
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    // User's password (will be hashed before saving)
    password: {
        type: String,
        required: true
    },

    // Role is either 'user' or 'admin'
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    // List of artist IDs that this user follows
    followedArtists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist'
    }],

    // List of playlist IDs saved to this user's library
    savedPlaylists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist'
    }]

}, {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true
});

// Before saving a user, hash their password automatically
// Note: async pre-save hooks in newer Mongoose do not use next()
userSchema.pre('save', async function() {
    // Only hash the password if it has been changed or is new
    if (!this.isModified('password')) return;

    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password in database
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Export the model so routes can use it
module.exports = mongoose.model('User', userSchema);