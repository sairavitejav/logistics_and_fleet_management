const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema({
    delivery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Delivery',
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    },
    coords: {
        type: [Number],
        index: '2dsphere',
        required: true
    },
    speed: {
        type: Number
    },
    heading: Number    
}, {
    timestamps: true
});

module.exports = mongoose.model('Tracking', trackingSchema);