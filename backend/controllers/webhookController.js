const Payment = require('../models/payment');
const Delivery = require('../models/delivery');
const { verifyWebhookSignature, fetchPaymentDetails } = require('../services/razorpayService');
const { sendPaymentReceiptEmail } = require('../services/emailService');

/**
 * Handle Razorpay webhook events
 * This endpoint receives notifications from Razorpay about payment events
 */
const handleRazorpayWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        console.log('📨 Webhook received from Razorpay');
        console.log('Event:', req.body.event);

        // Verify webhook signature (if webhook secret is configured)
        if (webhookSecret) {
            const isValid = verifyWebhookSignature(
                JSON.stringify(req.body),
                webhookSignature,
                webhookSecret
            );

            if (!isValid) {
                console.error('❌ Invalid webhook signature');
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid signature' 
                });
            }

            console.log('✅ Webhook signature verified');
        } else {
            console.warn('⚠️ Webhook secret not configured, skipping signature verification');
        }

        const event = req.body.event;
        const payload = req.body.payload;

        // Handle different webhook events
        switch (event) {
            case 'payment.captured':
                await handlePaymentCaptured(payload.payment.entity);
                break;

            case 'payment.failed':
                await handlePaymentFailed(payload.payment.entity);
                break;

            case 'order.paid':
                await handleOrderPaid(payload.order.entity, payload.payment.entity);
                break;

            default:
                console.log(`ℹ️ Unhandled webhook event: ${event}`);
        }

        // Always respond with 200 to acknowledge receipt
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        // Still return 200 to prevent Razorpay from retrying
        res.status(200).json({ success: false, error: error.message });
    }
};

/**
 * Handle payment.captured event
 */
const handlePaymentCaptured = async (paymentEntity) => {
    try {
        console.log('💰 Processing payment.captured event:', paymentEntity.id);

        // Find payment by Razorpay payment ID
        const payment = await Payment.findOne({ 'razorpay.paymentId': paymentEntity.id })
            .populate('delivery')
            .populate('customer', 'name email')
            .populate('driver', 'name email');

        if (!payment) {
            console.warn('⚠️ Payment not found for Razorpay payment ID:', paymentEntity.id);
            return;
        }

        // Update payment if not already completed
        if (payment.status !== 'completed') {
            payment.status = 'completed';
            payment.completedAt = new Date(paymentEntity.created_at * 1000);
            payment.gatewayResponse = {
                responseCode: paymentEntity.status,
                responseMessage: 'Payment captured',
                gatewayTransactionId: paymentEntity.id,
                processedAt: new Date(paymentEntity.created_at * 1000),
                method: paymentEntity.method,
                bank: paymentEntity.bank,
                wallet: paymentEntity.wallet,
                vpa: paymentEntity.vpa,
                cardId: paymentEntity.card_id,
                email: paymentEntity.email,
                contact: paymentEntity.contact
            };
            await payment.save();

            console.log('✅ Payment updated to completed');

            // Update delivery status
            if (payment.delivery && payment.delivery.status === 'parcel_delivered') {
                const delivery = await Delivery.findById(payment.delivery._id);
                delivery.status = 'delivered';
                if (!delivery.meta) {
                    delivery.meta = {};
                }
                delivery.meta.deliveredAt = new Date();
                await delivery.save();

                console.log('✅ Delivery updated to delivered');
            }

            // Send email receipt
            try {
                await sendPaymentReceiptEmail(
                    payment.customer.email,
                    payment,
                    payment.customer.name
                );
                payment.receipt.emailSent = true;
                payment.receipt.emailSentAt = new Date();
                await payment.save();
                console.log('✅ Receipt email sent');
            } catch (emailError) {
                console.error('❌ Failed to send receipt email:', emailError);
            }
        }

    } catch (error) {
        console.error('❌ Error handling payment.captured:', error);
    }
};

/**
 * Handle payment.failed event
 */
const handlePaymentFailed = async (paymentEntity) => {
    try {
        console.log('❌ Processing payment.failed event:', paymentEntity.id);

        // Find payment by Razorpay order ID
        const payment = await Payment.findOne({ 'razorpay.orderId': paymentEntity.order_id });

        if (!payment) {
            console.warn('⚠️ Payment not found for order ID:', paymentEntity.order_id);
            return;
        }

        // Update payment status to failed
        if (payment.status === 'pending' || payment.status === 'processing') {
            payment.status = 'failed';
            payment.razorpay.paymentId = paymentEntity.id;
            payment.gatewayResponse = {
                responseCode: paymentEntity.status,
                responseMessage: paymentEntity.error_description || 'Payment failed',
                gatewayTransactionId: paymentEntity.id,
                processedAt: new Date(paymentEntity.created_at * 1000)
            };
            await payment.save();

            console.log('✅ Payment updated to failed');
        }

    } catch (error) {
        console.error('❌ Error handling payment.failed:', error);
    }
};

/**
 * Handle order.paid event
 */
const handleOrderPaid = async (orderEntity, paymentEntity) => {
    try {
        console.log('✅ Processing order.paid event:', orderEntity.id);

        // Find payment by Razorpay order ID
        const payment = await Payment.findOne({ 'razorpay.orderId': orderEntity.id })
            .populate('delivery')
            .populate('customer', 'name email')
            .populate('driver', 'name email');

        if (!payment) {
            console.warn('⚠️ Payment not found for order ID:', orderEntity.id);
            return;
        }

        // This is a backup handler in case payment.captured wasn't processed
        if (payment.status !== 'completed') {
            await handlePaymentCaptured(paymentEntity);
        }

    } catch (error) {
        console.error('❌ Error handling order.paid:', error);
    }
};

module.exports = {
    handleRazorpayWebhook
};
