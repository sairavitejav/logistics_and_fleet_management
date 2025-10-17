const express = require('express');
const router = express.Router();
const {
    initiatePayment,
    processPayment,
    getPaymentDetails,
    getPaymentHistory,
    validatePaymentMethod
} = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Initiate payment for a delivery
router.post('/initiate', initiatePayment);

// Process payment with selected method
router.post('/:paymentId/process', processPayment);

// Get payment details
router.get('/:paymentId', getPaymentDetails);

// Get payment history for user
router.get('/history/user', getPaymentHistory);

// Validate payment method
router.post('/validate-method', validatePaymentMethod);

// Test endpoint to check if payment system is working
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Payment system is working',
        user: req.user ? { id: req.user.id, role: req.user.role } : null,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
