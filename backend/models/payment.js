const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    // Reference to the delivery/ride
    delivery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'delivery',
        required: true
    },
    
    // Customer who made the payment
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Driver who received the payment
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Payment amount details
    amount: {
        baseFare: {
            type: Number,
            required: true
        },
        distanceFare: {
            type: Number,
            required: true
        },
        totalAmount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'INR'
        }
    },
    
    // Payment method details
    paymentMethod: {
        type: {
            type: String,
            enum: ['card', 'upi', 'wallet', 'netbanking'],
            required: true
        },
        // For card payments
        cardDetails: {
            last4Digits: String,
            cardType: String, // visa, mastercard, etc.
            cardHolderName: String
        },
        // For UPI payments
        upiDetails: {
            upiId: String,
            bankName: String
        },
        // For wallet payments
        walletDetails: {
            walletProvider: String, // paytm, phonepe, etc.
            walletId: String
        }
    },
    
    // Payment status and tracking
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    
    // Transaction details
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    
    // Gateway response (dummy data)
    gatewayResponse: {
        responseCode: String,
        responseMessage: String,
        gatewayTransactionId: String,
        processedAt: Date
    },
    
    // Receipt details
    receipt: {
        receiptNumber: {
            type: String,
            required: true,
            unique: true
        },
        emailSent: {
            type: Boolean,
            default: false
        },
        emailSentAt: Date
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    completedAt: Date,
    
    // Additional metadata
    metadata: {
        userAgent: String,
        ipAddress: String,
        paymentInitiatedFrom: String // 'web', 'mobile'
    }
});

// Generate unique transaction ID
paymentSchema.pre('save', function(next) {
    if (!this.transactionId) {
        this.transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }
    if (!this.receipt.receiptNumber) {
        this.receipt.receiptNumber = `RCP${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
    next();
});

// Indexes for better query performance
paymentSchema.index({ delivery: 1 });
paymentSchema.index({ customer: 1 });
paymentSchema.index({ driver: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ 'receipt.receiptNumber': 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
