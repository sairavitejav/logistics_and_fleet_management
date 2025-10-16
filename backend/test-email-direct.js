// Test email service directly
require('dotenv').config();
const { sendOTPEmail } = require('./services/emailService');

async function testEmail() {
  console.log('=== TESTING EMAIL SERVICE ===');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');

  try {
    const result = await sendOTPEmail(
      'sairaviteja1920@gmail.com',
      '123456',
      'Test User'
    );

    console.log('Email result:', result);
  } catch (error) {
    console.error('Email failed:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
