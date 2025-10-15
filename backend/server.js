const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');
// 🔥 NEW: Socket.IO imports
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5001;

// 🔥 NEW: Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"], // 🔥 UPDATED: Support both Vite ports
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
// 🔥 UPDATED: Increase payload limit for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 🔥 NEW: Make io accessible in routes
app.set('io', io);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/deliveries', require('./routes/deliveries'));
// app.use('/api/tracking', require('./routes/tracking'));

// 🔥 NEW: Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join room based on user role and ID
  socket.on('join', (data) => {
    const { userId, role } = data;
    socket.join(`${role}: ${userId}`);
    console.log(`User ${userId} joined as ${role}`);
  });
  
  // Handle driver location updates
  socket.on('update_location', (data) => {
    const { deliveryId, location } = data;
    io.to(`delivery: ${deliveryId}`).emit('driver_location', location);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

connectDB();

// 🔥 UPDATED: Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
