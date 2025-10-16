const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Delivery',
        required: true,
        unique: true // One feedback per ride
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxlength: 500,
        trim: true
    },
    categories: {
        punctuality: {
            type: Number,
            min: 1,
            max: 5
        },
        behavior: {
            type: Number,
            min: 1,
            max: 5
        },
        vehicleCondition: {
            type: Number,
            min: 1,
            max: 5
        },
        communication: {
            type: Number,
            min: 1,
            max: 5
        }
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    adminResponse: {
        message: String,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: Date
    }
}, {
    timestamps: true
});

// Index for efficient queries
feedbackSchema.index({ driver: 1, createdAt: -1 });
feedbackSchema.index({ customer: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1 });

// Virtual for average rating calculation
feedbackSchema.virtual('averageRating').get(function() {
    const categories = this.categories;
    if (!categories) return this.rating;
    
    const categoryRatings = Object.values(categories).filter(rating => rating);
    if (categoryRatings.length === 0) return this.rating;
    
    const sum = categoryRatings.reduce((acc, rating) => acc + rating, 0);
    return (sum / categoryRatings.length).toFixed(1);
});

// Static method to calculate driver's overall rating
feedbackSchema.statics.getDriverRating = async function(driverId) {
    const result = await this.aggregate([
        { $match: { driver: mongoose.Types.ObjectId(driverId) } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalFeedbacks: { $sum: 1 },
                ratingDistribution: {
                    $push: '$rating'
                }
            }
        }
    ]);

    if (result.length === 0) {
        return {
            averageRating: 0,
            totalFeedbacks: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }

    const data = result[0];
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    data.ratingDistribution.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
    });

    return {
        averageRating: Math.round(data.averageRating * 10) / 10,
        totalFeedbacks: data.totalFeedbacks,
        ratingDistribution: distribution
    };
};

module.exports = mongoose.model('Feedback', feedbackSchema);
