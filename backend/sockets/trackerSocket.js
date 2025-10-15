const jwt = require('jsonwebtoken');
const tracking = require('../models/tracking');
const user = require('../models/user');
const delivery = require('../models/delivery');

module.exports = function(io) {
    io.on('connection', (socket) => {
        console.log('New client connected to trackerSocket');

        const token = socket.handshake.auth?.token;
        if (!token) {
            socket.disconnect(true);
            return;
        }
        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            socket.disconnect(true);
            return;
        }

        const userId = payload.id;
        socket.join(`user: ${userId}`);

        socket.on('driver: ready', () => {
            socket.join(`driver: ${userId}`);
        });

        socket.on('driver: location', async (payload) => {
            try {
                if (typeof payload.lat !== 'number' || typeof payload.lng !== 'number') {
                    return;
                }
                const doc = await tracking.create({
                    delivery: payload.deliveryId,
                    driver: userId,
                    vehicle: payload.vehicleId,
                    coords: [payload.lng, payload.lat],
                    speed: payload.speed,
                    heading: payload.heading
                });

                if (payload.deliveryId) {
                    io.to(`delivery: ${payload.deliveryId}`).emit('delivery: location', {
                        deliveryId: payload.deliveryId,
                        coords: doc.coords,
                        ts: doc.createdAt
                    });
                }
                io.to(`driver: ${userId}`).emit('driver: location:echo',doc);
            } catch (error) {
                console.error('Error saving tracking data:', error);
            }
        });
        socket.on('disconnect', () =>{
            console.log('Client disconnected from trackerSocket');
        });
    });

};