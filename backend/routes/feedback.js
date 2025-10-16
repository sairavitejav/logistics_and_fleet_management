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
const { auth } = require('../middleware/auth');
const roles = require('../middleware/roles');

// Customer routes
router.post('/', auth, roles('customer'), createFeedback);
router.get('/my-feedback', auth, roles('customer'), getCustomerFeedback);
router.get('/can-rate/:rideId', auth, roles('customer'), canRateRide);

// Driver routes
router.get('/driver/:driverId', auth, roles('driver', 'admin'), getDriverFeedback);

// Admin routes
router.get('/all', auth, roles('admin'), getAllFeedback);
router.put('/respond/:feedbackId', auth, roles('admin'), respondToFeedback);

// General routes (accessible by multiple roles)
router.get('/ride/:rideId', auth, getRideFeedback);

module.exports = router;
