// Test email service
require('dotenv').config();
const { sendOTPEmail } = require('./services/emailService');

async function testEmail() {
  try {
    console.log('Testing email service...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');

    const result = await sendOTPEmail(
      'test@example.com', // Change this to your actual email for testing
      '123456',
      'Test User'
    );

    console.log('Email result:', result);
  } catch (error) {
    console.error('Email test failed:', error.message);
  }
}

testEmail();
