const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    plate: {
        type: String,
        required: true,
        unique: true
    },
    make: {
        type: String
    },
    model: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['bike', 'auto', 'mini_truck', 'lorry'],
        default: 'bike'
    },
    // Weight capacity in kg (auto-set based on vehicle type)
    weightCapacity: {
        type: Number,
        required: false,
        default: 0
    },
    status: {
        type: String,
        enum: ['available', 'in_service', 'in_maintenance'],
        default: 'available'
    },
    // 🔥 NEW: Approval system for driver-added vehicles
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved' // Admin-added vehicles are auto-approved
    },
    // 🔥 NEW: Track who added the vehicle
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // 🔥 NEW: Driver assignment
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // 🔥 NEW: Vehicle details
    color: String,
    year: Number,
    image: String,
    // ✨ NEW: Driving license information
    drivingLicense: {
        licenseNumber: String,
        expiryDate: Date,
        licenseImage: String // URL or base64 string
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);