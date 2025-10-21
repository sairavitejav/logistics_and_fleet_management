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
    origin: [
      "http://localhost:5173", 
      "http://localhost:5174", 
      "http://localhost:5175",
      "https://logistics-and-fleet-management-frontend.onrender.com",
      "https://logistics-and-fleet-management-frontend.vercel.app",
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.onrender\.com$/
    ], // 🔥 UPDATED: Support production URLs and patterns
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Configure CORS for Express routes
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://logistics-and-fleet-management-backend.onrender.com',
      'https://logistics-and-fleet-management-frontend.onrender.com',
      'https://logistics-and-fleet-management-frontend.vercel.app'
    ];

    // Check for Vercel and Render domain patterns
    const vercelPattern = /^https:\/\/.*\.vercel\.app$/;
    const renderPattern = /^https:\/\/.*\.onrender\.com$/;

    if (allowedOrigins.indexOf(origin) !== -1 || 
        vercelPattern.test(origin) || 
        renderPattern.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// 🔥 ADDITIONAL: Manual CORS headers as fallback
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'https://logistics-and-fleet-management-frontend.onrender.com',
    'https://logistics-and-fleet-management-frontend.vercel.app'
  ];
  
  if (allowedOrigins.includes(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin) || /^https:\/\/.*\.onrender\.com$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// 🔥 UPDATED: Increase payload limit for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 🔥 NEW: Make io accessible in routes
app.set('io', io);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/webhooks', require('./routes/webhook'));
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
