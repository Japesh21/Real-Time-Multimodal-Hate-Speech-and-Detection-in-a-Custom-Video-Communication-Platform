const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    name: {
        type: String,
        trim: true
    },

    logoURL: {
        type: String,
        default: ""
    },

    profileCompleted: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("User", userSchema);