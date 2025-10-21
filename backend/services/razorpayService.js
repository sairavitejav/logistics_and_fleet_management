const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a Razorpay order
 * @param {Object} orderData - Order details
 * @param {Number} orderData.amount - Amount in rupees (will be converted to paise)
 * @param {String} orderData.currency - Currency code (default: INR)
 * @param {String} orderData.receipt - Receipt ID
 * @param {Object} orderData.notes - Additional notes
 * @returns {Promise<Object>} Razorpay order object
 */
const createOrder = async (orderData) => {
    try {
        const options = {
            amount: Math.round(orderData.amount * 100), // Convert to paise
            currency: orderData.currency || 'INR',
            receipt: orderData.receipt,
            notes: orderData.notes || {}
        };

        console.log('🔵 Creating Razorpay order with options:', options);
        const order = await razorpayInstance.orders.create(options);
        console.log('✅ Razorpay order created:', order.id);
        
        return {
            success: true,
            order
        };
    } catch (error) {
        console.error('❌ Razorpay order creation failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Verify Razorpay payment signature
 * @param {Object} paymentData - Payment verification data
 * @param {String} paymentData.razorpay_order_id - Razorpay order ID
 * @param {String} paymentData.razorpay_payment_id - Razorpay payment ID
 * @param {String} paymentData.razorpay_signature - Razorpay signature
 * @returns {Boolean} True if signature is valid
 */
const verifyPaymentSignature = (paymentData) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

        // Create signature
        const text = razorpay_order_id + '|' + razorpay_payment_id;
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(text)
            .digest('hex');

        console.log('🔐 Verifying signature...');
        console.log('Generated:', generated_signature);
        console.log('Received:', razorpay_signature);

        // Compare signatures
        const isValid = generated_signature === razorpay_signature;
        
        if (isValid) {
            console.log('✅ Payment signature verified successfully');
        } else {
            console.log('❌ Payment signature verification failed');
        }

        return isValid;
    } catch (error) {
        console.error('❌ Signature verification error:', error);
        return false;
    }
};

/**
 * Fetch payment details from Razorpay
 * @param {String} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
const fetchPaymentDetails = async (paymentId) => {
    try {
        console.log('🔍 Fetching payment details for:', paymentId);
        const payment = await razorpayInstance.payments.fetch(paymentId);
        console.log('✅ Payment details fetched:', payment.id);
        
        return {
            success: true,
            payment
        };
    } catch (error) {
        console.error('❌ Failed to fetch payment details:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Capture a payment
 * @param {String} paymentId - Razorpay payment ID
 * @param {Number} amount - Amount to capture in paise
 * @param {String} currency - Currency code
 * @returns {Promise<Object>} Captured payment details
 */
const capturePayment = async (paymentId, amount, currency = 'INR') => {
    try {
        console.log('💰 Capturing payment:', paymentId, 'Amount:', amount);
        const payment = await razorpayInstance.payments.capture(
            paymentId,
            amount,
            currency
        );
        console.log('✅ Payment captured successfully');
        
        return {
            success: true,
            payment
        };
    } catch (error) {
        console.error('❌ Payment capture failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Create a refund
 * @param {String} paymentId - Razorpay payment ID
 * @param {Number} amount - Amount to refund in paise (optional, full refund if not provided)
 * @returns {Promise<Object>} Refund details
 */
const createRefund = async (paymentId, amount = null) => {
    try {
        const options = { payment_id: paymentId };
        if (amount) {
            options.amount = amount;
        }

        console.log('🔄 Creating refund for payment:', paymentId);
        const refund = await razorpayInstance.payments.refund(paymentId, options);
        console.log('✅ Refund created successfully:', refund.id);
        
        return {
            success: true,
            refund
        };
    } catch (error) {
        console.error('❌ Refund creation failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Verify webhook signature
 * @param {String} webhookBody - Raw webhook body
 * @param {String} webhookSignature - Webhook signature from headers
 * @param {String} webhookSecret - Webhook secret
 * @returns {Boolean} True if signature is valid
 */
const verifyWebhookSignature = (webhookBody, webhookSignature, webhookSecret) => {
    try {
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(webhookBody)
            .digest('hex');

        return expectedSignature === webhookSignature;
    } catch (error) {
        console.error('❌ Webhook signature verification error:', error);
        return false;
    }
};

module.exports = {
    razorpayInstance,
    createOrder,
    verifyPaymentSignature,
    fetchPaymentDetails,
    capturePayment,
    createRefund,
    verifyWebhookSignature
};
