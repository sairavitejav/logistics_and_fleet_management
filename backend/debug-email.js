// Debug email service configuration
require('dotenv').config();

console.log('=== EMAIL SERVICE DEBUG ===');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '***@***.com' : 'NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');
console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '***SET***' : 'NOT SET');
console.log('==========================');

const nodemailer = require('nodemailer');

// Test transporter creation
try {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD
    }
  });

  console.log('✅ Transporter created successfully');

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Transporter verification failed:', error.message);
    } else {
      console.log('✅ Transporter verified successfully');
    }
  });

} catch (error) {
  console.error('❌ Failed to create transporter:', error.message);
}
