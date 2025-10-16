const express = require('express');
const router = express.Router();
const {
    createFeedback,
    getRideFeedback,
    getDriverFeedback,
    getCustomerFeedback,
    getAllFeedback,
    respondToFeedback,
    canRateRide
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

// Customer routes
router.post('/', protect, authorize('customer'), createFeedback);
router.get('/my-feedback', protect, authorize('customer'), getCustomerFeedback);
router.get('/can-rate/:rideId', protect, authorize('customer'), canRateRide);

// Driver routes
router.get('/driver/:driverId', protect, authorize('driver', 'admin'), getDriverFeedback);

// Admin routes
router.get('/all', protect, authorize('admin'), getAllFeedback);
router.put('/respond/:feedbackId', protect, authorize('admin'), respondToFeedback);

// General routes (accessible by multiple roles)
router.get('/ride/:rideId', protect, getRideFeedback);

module.exports = router;
