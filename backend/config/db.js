const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const connectDB = async () => {
  try {
    // Check for multiple possible environment variable names
    const mongoUri = process.env.MONGODB_URI || process.env.CONNECTION_STRING || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('No MongoDB connection string found. Please set MONGODB_URI, CONNECTION_STRING, or MONGO_URI environment variable.');
    }
    
    console.log('🔗 Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(mongoUri, {

    });
    console.log(`MongoDB Connected: ${conn.connection.host} ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('⚠️ Running without database connection - some features may not work');
    // Don't exit the process - allow server to start without DB for testing
    // process.exit(1);
  }
};

module.exports = connectDB;