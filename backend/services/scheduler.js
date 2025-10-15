const delivery = require('../models/delivery');

async function isAvailable({driverId, vehicleId, startTime, endTime, excludeDeliveryId}) {
    const query = {
        status: { $in: ['pending', 'on_route'] },
        $or: []
    };
    if (driverId) {
        query.$or.push({ driver: driverId });
    }
    if (vehicleId) {
        query.$or.push({ vehicle: vehicleId });
    }
    if (query.$or.length === 0) {
        return true; 
    }

    query['route.startTime'] = { $lte: endTime };
    query['route.endTime'] = { $gte: startTime };

    if (excludeDeliveryId) {
        query._id = { $ne: excludeDeliveryId };
    }

    const conflictingDeliveries = await delivery.findOne(query).lean();
    return !conflictingDeliveries;
}

module.exports = {isAvailable};