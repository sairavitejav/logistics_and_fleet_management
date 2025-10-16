const Feedback = require('../models/feedback');
const Delivery = require('../models/delivery');
const User = require('../models/user');

// Create feedback for a completed ride
const createFeedback = async (req, res) => {
    try {
        const { rideId, rating, comment, categories, isAnonymous } = req.body;
        const customerId = req.user.id;

        // Verify the ride exists and belongs to the customer
        const ride = await Delivery.findById(rideId).populate('driver');
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.customer.toString() !== customerId) {
            return res.status(403).json({ message: 'Not authorized to rate this ride' });
        }

        if (ride.status !== 'delivered') {
            return res.status(400).json({ message: 'Can only rate completed rides' });
        }

        // Check if feedback already exists
        const existingFeedback = await Feedback.findOne({ ride: rideId });
        if (existingFeedback) {
            return res.status(400).json({ message: 'Feedback already submitted for this ride' });
        }

        // Create feedback
        const feedback = new Feedback({
            ride: rideId,
            customer: customerId,
            driver: ride.driver._id,
            rating,
            comment,
            categories,
            isAnonymous: isAnonymous || false
        });

        await feedback.save();

        // Update driver's average rating
        const driverRating = await Feedback.getDriverRating(ride.driver._id);
        await User.findByIdAndUpdate(ride.driver._id, {
            averageRating: driverRating.averageRating,
            totalRatings: driverRating.totalFeedbacks
        });

        res.status(201).json({
            message: 'Feedback submitted successfully',
            feedback: await feedback.populate(['customer', 'driver', 'ride'])
        });
    } catch (error) {
        console.error('Error creating feedback:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get feedback for a specific ride
const getRideFeedback = async (req, res) => {
    try {
        const { rideId } = req.params;
        
        const feedback = await Feedback.findOne({ ride: rideId })
            .populate('customer', 'name email')
            .populate('driver', 'name email')
            .populate('ride');

        if (!feedback) {
            return res.status(404).json({ message: 'No feedback found for this ride' });
        }

        res.json(feedback);
    } catch (error) {
        console.error('Error fetching ride feedback:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all feedback for a driver
const getDriverFeedback = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const feedback = await Feedback.find({ driver: driverId })
            .populate('customer', 'name email')
            .populate('ride', 'pickupLocation dropoffLocation createdAt')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Feedback.countDocuments({ driver: driverId });
        const driverRating = await Feedback.getDriverRating(driverId);

        res.json({
            feedback,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
            driverRating
        });
    } catch (error) {
        console.error('Error fetching driver feedback:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get feedback given by a customer
const getCustomerFeedback = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        const feedback = await Feedback.find({ customer: customerId })
            .populate('driver', 'name email averageRating')
            .populate('ride', 'pickupLocation dropoffLocation createdAt')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Feedback.countDocuments({ customer: customerId });

        res.json({
            feedback,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error fetching customer feedback:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all feedback (Admin only)
const getAllFeedback = async (req, res) => {
    try {
        const { page = 1, limit = 20, rating, driverId } = req.query;
        
        let filter = {};
        if (rating) filter.rating = rating;
        if (driverId) filter.driver = driverId;

        const feedback = await Feedback.find(filter)
            .populate('customer', 'name email')
            .populate('driver', 'name email averageRating')
            .populate('ride', 'pickupLocation dropoffLocation createdAt')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Feedback.countDocuments(filter);

        // Get feedback analytics
        const analytics = await Feedback.aggregate([
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

        let ratingStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        if (analytics.length > 0) {
            analytics[0].ratingDistribution.forEach(rating => {
                ratingStats[rating] = (ratingStats[rating] || 0) + 1;
            });
        }

        res.json({
            feedback,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
            analytics: {
                averageRating: analytics.length > 0 ? Math.round(analytics[0].averageRating * 10) / 10 : 0,
                totalFeedbacks: analytics.length > 0 ? analytics[0].totalFeedbacks : 0,
                ratingDistribution: ratingStats
            }
        });
    } catch (error) {
        console.error('Error fetching all feedback:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin response to feedback
const respondToFeedback = async (req, res) => {
    try {
        const { feedbackId } = req.params;
        const { message } = req.body;
        const adminId = req.user.id;

        const feedback = await Feedback.findByIdAndUpdate(
            feedbackId,
            {
                adminResponse: {
                    message,
                    respondedBy: adminId,
                    respondedAt: new Date()
                }
            },
            { new: true }
        ).populate(['customer', 'driver', 'adminResponse.respondedBy']);

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        res.json({
            message: 'Response added successfully',
            feedback
        });
    } catch (error) {
        console.error('Error responding to feedback:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Check if ride can be rated
const canRateRide = async (req, res) => {
    try {
        const { rideId } = req.params;
        const customerId = req.user.id;

        const ride = await Delivery.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }

        if (ride.customer.toString() !== customerId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const existingFeedback = await Feedback.findOne({ ride: rideId });
        
        res.json({
            canRate: ride.status === 'delivered' && !existingFeedback,
            rideStatus: ride.status,
            alreadyRated: !!existingFeedback
        });
    } catch (error) {
        console.error('Error checking rating eligibility:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createFeedback,
    getRideFeedback,
    getDriverFeedback,
    getCustomerFeedback,
    getAllFeedback,
    respondToFeedback,
    canRateRide
};
