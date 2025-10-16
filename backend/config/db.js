const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.CONNECTION_STRING, {

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