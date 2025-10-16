// Quick CORS test script
const express = require('express');
const cors = require('cors');

const app = express();

// Same CORS configuration as main server
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 Request origin:', origin);
    
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://logistics-and-fleet-management-backend.onrender.com',
      'https://logistics-and-fleet-management-frontend.onrender.com',
      'https://logistics-and-fleet-management-frontend.vercel.app'
    ];

    const vercelPattern = /^https:\/\/.*\.vercel\.app$/;
    const renderPattern = /^https:\/\/.*\.onrender\.com$/;

    if (allowedOrigins.indexOf(origin) !== -1 || 
        vercelPattern.test(origin) || 
        renderPattern.test(origin)) {
      console.log('✅ Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ Origin blocked:', origin);
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

// Manual CORS middleware as fallback
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('🔧 Manual CORS check for:', origin);
  
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'https://logistics-and-fleet-management-frontend.onrender.com',
    'https://logistics-and-fleet-management-frontend.vercel.app'
  ];
  
  if (allowedOrigins.includes(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin) || /^https:\/\/.*\.onrender\.com$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log('✅ Manual CORS headers set for:', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling OPTIONS preflight request');
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());

// Test endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login endpoint hit');
  res.json({ 
    success: true, 
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    cors: 'Configured',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🧪 CORS test server running on port ${PORT}`);
  console.log(`📍 Test URL: http://localhost:${PORT}/health`);
  console.log('🔍 Monitoring CORS requests...');
});

module.exports = app;
