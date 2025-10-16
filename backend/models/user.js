const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'driver', 'customer'],
        default: 'customer'
    },
    // 🔥 NEW: Phone number
    phone: {
        type: String
    },
    // 🔥 NEW: Driver-specific fields
    driverStatus: {
        type: String,
        enum: ['offline', 'online', 'on_ride'],
        default: 'offline'
    },
    // 🔥 NEW: Current location for drivers
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    // NEW: Profile image
    avatar: {
        type: String,
        default: ''
    },
    // NEW: Rating fields for drivers
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    meta: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

// NEW: Index for geospatial queries
userSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('User', userSchema);                