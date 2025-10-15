const express = require('express');
const router = express.Router();
const {auth} = require('../middleware/auth');
const roles = require('../middleware/roles');
const {
    requestDelivery, 
    createDelivery, 
    updateDelivery, 
    getTrack,
    acceptRide,
    getAllDeliveries,
    getPendingRides,
    updateDriverLocation,
    updateDriverStatus,
    completeRide,
    cancelRide,
    getDriverStatistics
} = require('../controllers/deliveryController');

// Customer requests a ride
router.post('/request', auth, roles('customer'), requestDelivery);

// Admin creates delivery
router.post('/', auth, roles('admin'), createDelivery);

// 🔥 NEW: Get all deliveries/rides (filtered by role)
router.get('/', auth, getAllDeliveries);

// 🔥 NEW: Get pending rides (Driver only)
router.get('/pending', auth, roles('driver'), getPendingRides);

// 🔥 IMPORTANT: Specific routes MUST come BEFORE parameterized routes
// Otherwise Express will match '/driver/status' as '/:id/status' with id='driver'

// 🔥 NEW: Get driver statistics
router.get('/driver/statistics', auth, roles('driver'), getDriverStatistics);

// 🔥 NEW: Update driver location
router.post('/driver/location', auth, roles('driver'), updateDriverLocation);

// 🔥 NEW: Update driver status (online/offline)
router.put('/driver/status', auth, roles('driver'), updateDriverStatus);

// 🔥 NEW: Driver accepts a ride
router.post('/:id/accept', auth, roles('driver'), acceptRide);

// 🔥 NEW: Driver completes a ride
router.put('/:id/complete', auth, roles('driver'), completeRide);

// 🔥 NEW: Customer cancels a ride
router.put('/:id/cancel', auth, roles('customer'), cancelRide);

// 🔥 UPDATED: Update delivery status (Driver or Admin)
router.put('/:id/status', auth, roles('driver', 'admin'), updateDelivery);

// Track delivery
router.get('/:id/track', auth, getTrack);

module.exports = router;