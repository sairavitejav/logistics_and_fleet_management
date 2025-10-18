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

// Debug endpoint to check models and environment (no auth required)
router.get('/debug', (req, res) => {
    const Payment = require('../models/payment');
    const Delivery = require('../models/delivery');
    const User = require('../models/user');
    
    res.json({
        message: 'Payment system debug info',
        models: {
            Payment: !!Payment,
            Delivery: !!Delivery,
            User: !!User
        },
        environment: {
            SECRET_KEY: process.env.SECRET_KEY ? 'SET' : 'MISSING',
            MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'MISSING',
            NODE_ENV: process.env.NODE_ENV || 'undefined'
        },
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

// Test endpoint to check if payment system is working (requires auth)
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Payment system is working',
        user: req.user ? { id: req.user.id, role: req.user.role } : null,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
