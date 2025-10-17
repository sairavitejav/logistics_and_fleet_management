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

// Initiate payment for a delivery (temporarily without auth for testing)
router.post('/initiate', (req, res, next) => {
    console.log('🔥 INITIATE ROUTE HIT');
    console.log('🔥 Headers:', req.headers);
    console.log('🔥 Body:', req.body);
    next();
}, auth, initiatePayment);

// All other routes require authentication
router.use(auth);

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

// Simple test endpoint without authentication
router.post('/test-initiate', (req, res) => {
    console.log('🧪 TEST INITIATE CALLED');
    console.log('🧪 Request body:', req.body);
    res.json({ 
        message: 'Test initiate endpoint working',
        body: req.body,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
