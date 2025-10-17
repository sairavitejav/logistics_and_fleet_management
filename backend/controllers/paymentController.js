const Payment = require('../models/payment');
const Delivery = require('../models/delivery');
const User = require('../models/user');
const { sendPaymentReceiptEmail } = require('../services/emailService');

// Dummy payment gateway simulation
const simulatePaymentGateway = async (paymentData) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Always return success as per requirements
    return {
        success: true,
        responseCode: '00',
        responseMessage: 'Transaction Successful',
        gatewayTransactionId: `GW${Date.now()}${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        processedAt: new Date()
    };
};

// Initiate payment process
const initiatePayment = async (req, res) => {
    console.log('🔥 PAYMENT INITIATE FUNCTION CALLED');
    console.log('🔥 Request body:', req.body);
    console.log('🔥 User:', req.user);
    
    try {
        const { deliveryId } = req.body;
        const customerId = req.user.id;

        console.log('🚀 Payment initiation request:', { deliveryId, customerId });

        // Get delivery details
        console.log('🔍 Looking for delivery with ID:', deliveryId);
        console.log('🔍 Delivery model:', Delivery);
        const deliveryDoc = await Delivery.findById(deliveryId)
            .populate('customer', 'name email')
            .populate('driver', 'name email');

        console.log('📦 Found delivery:', deliveryDoc ? { 
            id: deliveryDoc._id, 
            status: deliveryDoc.status, 
            customer: deliveryDoc.customer?._id,
            fare: deliveryDoc.fare 
        } : 'null');

        if (!deliveryDoc) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        // Verify customer ownership
        if (deliveryDoc.customer._id.toString() !== customerId) {
            return res.status(403).json({ message: 'Unauthorized access to delivery' });
        }

        // Check if delivery is ready for payment (parcel_delivered status)
        console.log('🔍 Checking delivery status:', deliveryDoc.status);
        if (deliveryDoc.status !== 'parcel_delivered') {
            console.log('❌ Payment not allowed for status:', deliveryDoc.status);
            return res.status(400).json({ 
                message: `Payment can only be made after parcel is delivered. Current status: ${deliveryDoc.status}`,
                currentStatus: deliveryDoc.status 
            });
        }

        // Check if driver exists - for dummy payments, we'll allow null driver
        if (!deliveryDoc.driver) {
            console.log('⚠️ No driver assigned to delivery - using dummy driver for payment testing');
            // For testing purposes, we'll create a dummy driver reference
            // In production, this should be properly handled
        }

        // Check if payment already exists
        const existingPayment = await Payment.findOne({ delivery: deliveryId });
        if (existingPayment) {
            return res.status(400).json({ 
                message: 'Payment already processed for this delivery',
                paymentId: existingPayment._id 
            });
        }

        // Calculate payment breakdown
        const baseFare = 50; // Fixed base fare
        const distanceFare = deliveryDoc.fare - baseFare;
        
        const paymentData = {
            delivery: deliveryId,
            customer: customerId,
            driver: deliveryDoc.driver ? deliveryDoc.driver._id : customerId, // Use customer as dummy driver if no driver
            amount: {
                baseFare,
                distanceFare,
                totalAmount: deliveryDoc.fare
            },
            status: 'pending'
        };

        // Create payment record
        console.log('💾 Creating payment with data:', paymentData);
        const payment = new Payment(paymentData);
        console.log('💾 Payment object created, saving...');
        await payment.save();
        console.log('✅ Payment saved successfully:', payment._id);

        // Return payment details for frontend
        res.status(201).json({
            paymentId: payment._id,
            transactionId: payment.transactionId,
            amount: payment.amount,
            delivery: {
                id: deliveryDoc._id,
                pickupLocation: deliveryDoc.pickupLocation,
                dropoffLocation: deliveryDoc.dropoffLocation,
                vehicleType: deliveryDoc.vehicleType,
                distance: deliveryDoc.distance
            },
            customer: {
                name: deliveryDoc.customer.name,
                email: deliveryDoc.customer.email
            }
        });

    } catch (error) {
        console.error('❌ Payment initiation error:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        // Send a more detailed error response
        res.status(500).json({ 
            message: 'Failed to initiate payment', 
            error: error.message,
            errorName: error.name,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });
    }
};

// Process payment with selected method
const processPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { paymentMethod } = req.body;
        const customerId = req.user.id;

        // Get payment record
        const payment = await Payment.findById(paymentId)
            .populate('delivery')
            .populate('customer', 'name email')
            .populate('driver', 'name email');

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Verify customer ownership
        if (payment.customer._id.toString() !== customerId) {
            return res.status(403).json({ message: 'Unauthorized access to payment' });
        }

        // Check if payment is still pending
        if (payment.status !== 'pending') {
            return res.status(400).json({ 
                message: 'Payment already processed',
                status: payment.status 
            });
        }

        // Update payment status to processing
        payment.status = 'processing';
        payment.paymentMethod = paymentMethod;
        await payment.save();

        // Simulate payment gateway processing
        const gatewayResponse = await simulatePaymentGateway({
            amount: payment.amount.totalAmount,
            paymentMethod
        });

        if (gatewayResponse.success) {
            // Update payment as completed
            payment.status = 'completed';
            payment.completedAt = new Date();
            payment.gatewayResponse = gatewayResponse;
            await payment.save();

            // Update delivery status to delivered (payment completed)
            const deliveryToUpdate = await Delivery.findById(payment.delivery._id);
            if (deliveryToUpdate && deliveryToUpdate.status === 'parcel_delivered') {
                deliveryToUpdate.status = 'delivered';
                if (!deliveryToUpdate.meta) {
                    deliveryToUpdate.meta = {};
                }
                deliveryToUpdate.meta.deliveredAt = new Date();
                await deliveryToUpdate.save();

                // Notify via socket
                const io = req.app.get('io');
                if (io) {
                    // Notify customer
                    io.to(`customer: ${customerId}`).emit('payment_completed', {
                        paymentId: payment._id,
                        transactionId: payment.transactionId,
                        status: 'completed',
                        delivery: deliveryToUpdate
                    });

                    // Notify driver (only if different from customer)
                    if (payment.driver._id.toString() !== customerId) {
                        io.to(`driver: ${payment.driver._id.toString()}`).emit('payment_received', {
                            paymentId: payment._id,
                            amount: payment.amount.totalAmount,
                            delivery: deliveryToUpdate
                        });
                    }

                    // Notify about delivery completion
                    io.to(`delivery: ${deliveryToUpdate._id}`).emit('delivery_update', {
                        id: deliveryToUpdate._id,
                        status: 'delivered',
                        delivery: deliveryToUpdate
                    });
                }
            }

            // Send email receipt
            try {
                const emailResult = await sendPaymentReceiptEmail(
                    payment.customer.email,
                    payment,
                    payment.customer.name
                );
                
                if (emailResult.success) {
                    payment.receipt.emailSent = true;
                    payment.receipt.emailSentAt = new Date();
                    await payment.save();
                }
            } catch (emailError) {
                console.error('Failed to send receipt email:', emailError);
                // Don't fail the payment if email fails
            }

            res.json({
                success: true,
                message: 'Payment completed successfully',
                payment: {
                    id: payment._id,
                    transactionId: payment.transactionId,
                    receiptNumber: payment.receipt.receiptNumber,
                    amount: payment.amount,
                    status: payment.status,
                    completedAt: payment.completedAt,
                    paymentMethod: payment.paymentMethod
                }
            });

        } else {
            // Payment failed (though this won't happen in dummy mode)
            payment.status = 'failed';
            payment.gatewayResponse = gatewayResponse;
            await payment.save();

            res.status(400).json({
                success: false,
                message: 'Payment failed',
                error: gatewayResponse.responseMessage
            });
        }

    } catch (error) {
        console.error('❌ Payment processing error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Failed to process payment', 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get payment details
const getPaymentDetails = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;

        const payment = await Payment.findById(paymentId)
            .populate('delivery')
            .populate('customer', 'name email')
            .populate('driver', 'name email');

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Check if user has access to this payment
        const hasAccess = payment.customer._id.toString() === userId || 
                         payment.driver._id.toString() === userId ||
                         req.user.role === 'admin';

        if (!hasAccess) {
            return res.status(403).json({ message: 'Unauthorized access to payment' });
        }

        res.json(payment);

    } catch (error) {
        console.error('Get payment details error:', error);
        res.status(500).json({ message: 'Failed to get payment details', error: error.message });
    }
};

// Get payment history for user
const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const query = req.user.role === 'driver' 
            ? { driver: userId }
            : { customer: userId };

        const payments = await Payment.find(query)
            .populate('delivery', 'pickupLocation dropoffLocation vehicleType distance')
            .populate('customer', 'name email')
            .populate('driver', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Payment.countDocuments(query);

        res.json({
            payments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ message: 'Failed to get payment history', error: error.message });
    }
};

// Dummy card validation (for realistic dummy numbers)
const validateDummyCard = (cardNumber) => {
    const dummyCards = {
        // Visa
        '4111111111111111': { type: 'visa', valid: true },
        '4012888888881881': { type: 'visa', valid: true },
        // Mastercard
        '5555555555554444': { type: 'mastercard', valid: true },
        '5105105105105100': { type: 'mastercard', valid: true },
        // American Express
        '378282246310005': { type: 'amex', valid: true },
        '371449635398431': { type: 'amex', valid: true },
        // Discover
        '6011111111111117': { type: 'discover', valid: true },
        '6011000990139424': { type: 'discover', valid: true }
    };

    return dummyCards[cardNumber] || { type: 'unknown', valid: false };
};

// Validate payment method
const validatePaymentMethod = async (req, res) => {
    try {
        const { paymentMethod } = req.body;

        let validation = { valid: true, message: 'Valid payment method' };

        switch (paymentMethod.type) {
            case 'card':
                const cardValidation = validateDummyCard(paymentMethod.cardNumber);
                if (!cardValidation.valid) {
                    validation = { valid: false, message: 'Invalid card number. Use dummy test cards.' };
                } else {
                    validation.cardType = cardValidation.type;
                    validation.last4Digits = paymentMethod.cardNumber.slice(-4);
                }
                break;

            case 'upi':
                // Simple UPI ID validation
                if (!paymentMethod.upiId || !paymentMethod.upiId.includes('@')) {
                    validation = { valid: false, message: 'Invalid UPI ID format' };
                }
                break;

            case 'wallet':
                // Validate wallet provider
                const validWallets = ['paytm', 'phonepe', 'googlepay', 'amazonpay'];
                if (!validWallets.includes(paymentMethod.walletProvider?.toLowerCase())) {
                    validation = { valid: false, message: 'Unsupported wallet provider' };
                }
                break;
        }

        res.json(validation);

    } catch (error) {
        console.error('Payment method validation error:', error);
        res.status(500).json({ message: 'Failed to validate payment method', error: error.message });
    }
};

module.exports = {
    initiatePayment,
    processPayment,
    getPaymentDetails,
    getPaymentHistory,
    validatePaymentMethod
};
