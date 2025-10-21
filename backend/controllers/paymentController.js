const Payment = require('../models/payment');
const Delivery = require('../models/delivery');
const User = require('../models/user');
const { sendPaymentReceiptEmail } = require('../services/emailService');
const { createOrder, verifyPaymentSignature, fetchPaymentDetails } = require('../services/razorpayService');

// Initiate payment process
const initiatePayment = async (req, res) => {
    console.log('🔥 PAYMENT INITIATE FUNCTION CALLED');
    console.log('🔥 Request body:', req.body);
    console.log('🔥 User:', req.user);
    console.log('🔥 Environment check:', {
        SECRET_KEY: process.env.SECRET_KEY ? 'SET' : 'MISSING',
        MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV
    });
    
    try {
        const { deliveryId } = req.body;
        
        // Check if user exists and has required properties
        if (!req.user || !req.user.id) {
            console.error('❌ User authentication failed - no user or user.id');
            return res.status(401).json({ 
                message: 'Authentication failed - user not found',
                debug: { user: req.user ? 'exists' : 'null' }
            });
        }
        
        const customerId = req.user.id;

        console.log('🚀 Payment initiation request:', { deliveryId, customerId });

        // Get delivery details
        console.log('🔍 Looking for delivery with ID:', deliveryId);
        console.log('🔍 Delivery model available:', !!Delivery);
        
        if (!deliveryId) {
            console.error('❌ No deliveryId provided');
            return res.status(400).json({ 
                message: 'Delivery ID is required',
                debug: { deliveryId }
            });
        }
        
        // Check if deliveryId is a valid ObjectId
        if (!deliveryId.match(/^[0-9a-fA-F]{24}$/)) {
            console.error('❌ Invalid deliveryId format:', deliveryId);
            return res.status(400).json({ 
                message: 'Invalid delivery ID format',
                debug: { deliveryId }
            });
        }
        
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
        
        // Generate unique IDs
        const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const receiptNumber = `RCP${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        const paymentData = {
            delivery: deliveryId,
            customer: customerId,
            driver: deliveryDoc.driver ? deliveryDoc.driver._id : customerId, // Use customer as dummy driver if no driver
            amount: {
                baseFare,
                distanceFare,
                totalAmount: deliveryDoc.fare
            },
            status: 'pending',
            transactionId: transactionId,
            receipt: {
                receiptNumber: receiptNumber,
                emailSent: false
            }
        };

        // Create payment record
        console.log('💾 Creating payment with data:', paymentData);
        
        // Check if Payment model is available
        if (!Payment) {
            console.error('❌ Payment model not available');
            return res.status(500).json({ 
                message: 'Payment model not available',
                debug: { Payment: !!Payment }
            });
        }
        
        const payment = new Payment(paymentData);
        console.log('💾 Payment object created, saving...');
        
        try {
            await payment.save();
            console.log('✅ Payment saved successfully:', payment._id);
        } catch (saveError) {
            console.error('❌ Payment save error:', saveError);
            return res.status(500).json({ 
                message: 'Failed to save payment to database',
                error: saveError.message,
                debug: { paymentData }
            });
        }

        // Create Razorpay order
        const razorpayOrder = await createOrder({
            amount: payment.amount.totalAmount,
            currency: 'INR',
            receipt: payment.receipt.receiptNumber,
            notes: {
                deliveryId: deliveryDoc._id.toString(),
                customerId: customerId,
                customerName: deliveryDoc.customer.name,
                vehicleType: deliveryDoc.vehicleType
            }
        });

        if (!razorpayOrder.success) {
            // Delete the payment record if Razorpay order creation fails
            await Payment.findByIdAndDelete(payment._id);
            return res.status(500).json({ 
                message: 'Failed to create Razorpay order',
                error: razorpayOrder.error
            });
        }

        // Update payment with Razorpay order ID
        payment.razorpay = {
            orderId: razorpayOrder.order.id
        };
        await payment.save();

        console.log('✅ Razorpay order created:', razorpayOrder.order.id);

        // Return payment details for frontend
        res.status(201).json({
            paymentId: payment._id,
            transactionId: payment.transactionId,
            amount: payment.amount,
            razorpayOrderId: razorpayOrder.order.id,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
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

// Verify and complete payment
const verifyPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const customerId = req.user.id;

        console.log('🔐 Verifying payment:', { paymentId, razorpay_order_id, razorpay_payment_id });

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

        // Verify Razorpay order ID matches
        if (payment.razorpay.orderId !== razorpay_order_id) {
            return res.status(400).json({ 
                message: 'Order ID mismatch',
                expected: payment.razorpay.orderId,
                received: razorpay_order_id
            });
        }

        // Verify payment signature
        const isValidSignature = verifyPaymentSignature({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        });

        if (!isValidSignature) {
            payment.status = 'failed';
            payment.gatewayResponse = {
                responseCode: 'SIGNATURE_VERIFICATION_FAILED',
                responseMessage: 'Payment signature verification failed',
                processedAt: new Date()
            };
            await payment.save();

            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        // Fetch payment details from Razorpay
        const paymentDetailsResponse = await fetchPaymentDetails(razorpay_payment_id);
        
        if (!paymentDetailsResponse.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch payment details from Razorpay'
            });
        }

        const razorpayPayment = paymentDetailsResponse.payment;

        // Update payment status to processing
        payment.status = 'processing';
        payment.razorpay.paymentId = razorpay_payment_id;
        payment.razorpay.signature = razorpay_signature;
        await payment.save();

        // Check if payment was captured successfully
        if (razorpayPayment.status === 'captured' || razorpayPayment.status === 'authorized') {
            // Update payment as completed
            payment.status = 'completed';
            payment.completedAt = new Date();
            payment.paymentMethod = {
                type: razorpayPayment.method
            };
            payment.gatewayResponse = {
                responseCode: razorpayPayment.status,
                responseMessage: 'Payment successful',
                gatewayTransactionId: razorpay_payment_id,
                processedAt: new Date(razorpayPayment.created_at * 1000),
                method: razorpayPayment.method,
                bank: razorpayPayment.bank,
                wallet: razorpayPayment.wallet,
                vpa: razorpayPayment.vpa,
                cardId: razorpayPayment.card_id,
                email: razorpayPayment.email,
                contact: razorpayPayment.contact
            };
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
            // Payment failed or not captured
            payment.status = 'failed';
            payment.gatewayResponse = {
                responseCode: razorpayPayment.status,
                responseMessage: `Payment ${razorpayPayment.status}`,
                gatewayTransactionId: razorpay_payment_id,
                processedAt: new Date()
            };
            await payment.save();

            res.status(400).json({
                success: false,
                message: 'Payment not successful',
                status: razorpayPayment.status
            });
        }

    } catch (error) {
        console.error('❌ Payment verification error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Failed to verify payment', 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Legacy process payment endpoint (kept for backward compatibility)
const processPayment = verifyPayment;

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

// Get Razorpay key for frontend
const getRazorpayKey = async (req, res) => {
    try {
        res.json({
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Get Razorpay key error:', error);
        res.status(500).json({ message: 'Failed to get Razorpay key', error: error.message });
    }
};

module.exports = {
    initiatePayment,
    processPayment,
    verifyPayment,
    getPaymentDetails,
    getPaymentHistory,
    getRazorpayKey
};
