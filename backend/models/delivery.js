const mongoose = require('mongoose');

const geoPoint = {
    type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
    },
    coordinates: {
        type: [Number],
        required: true
    }
}

const deliverySchema = new mongoose.Schema({
    pickupLocation: {
        address: String,
        location: geoPoint
    },
    dropoffLocation: {
        address: String,
        location: geoPoint
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle'
    },
    status: {
        type: String,
        // 🔥 UPDATED: Added parcel pickup and delivery statuses for detailed ride flow
        enum: ['pending', 'accepted', 'parcel_picked', 'on_route', 'parcel_delivered', 'delivered', 'cancelled', 'expired'],
        default: 'pending'
    },
    // 🔥 NEW: Fare calculation
    fare: {
        type: Number,
        default: 0
    },
    // 🔥 NEW: Expiry time for pending rides (auto-cancel if not accepted)
    expiresAt: {
        type: Date,
        default: function() {
            // Set expiry to 5 minutes from creation
            return new Date(Date.now() + 5 * 60 * 1000);
        }
    },
    // Delivery item weight in kg
    deliveryWeight: {
        type: Number,
        required: false,
        min: 0,
        default: 0
    },
    // Vehicle type requested by customer
    vehicleType: {
        type: String,
        enum: ['bike', 'auto', 'mini_truck', 'lorry'],
        default: 'bike'
    },
    // 🔥 NEW: Distance in kilometers
    distance: {
        type: Number,
        default: 0
    },
    route: {
        startTime: Date,
        endTime: Date,
        wayPoints: [{lat: Number, lng: Number}]
    },
    scheduledAt: {
        type: Date,
        required: true,
        default: Date.now()
    },
    meta: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

deliverySchema.index({'pickupLocation.location': '2dsphere'});
deliverySchema.index({'dropoffLocation.location': '2dsphere'});

module.exports = mongoose.model('Delivery', deliverySchema);