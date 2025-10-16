// Comprehensive email service test
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailService() {
  console.log('=== COMPREHENSIVE EMAIL TEST ===');
  console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS configured:', !!process.env.EMAIL_PASS);

  try {
    // Test transporter creation
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD
      }
    });

    console.log('✅ Transporter created successfully');

    // Test connection
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Transporter verification failed:', error.message);
          reject(error);
        } else {
          console.log('✅ Transporter verified successfully');
          resolve(success);
        }
      });
    });

    // Send test email
    const testResult = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'sairaviteja1920@gmail.com',
      subject: 'Test Email - Logistics App',
      text: 'This is a test email to verify the email service is working correctly.',
      html: '<p>This is a test email to verify the email service is working correctly.</p>'
    });

    console.log('✅ Test email sent successfully');
    console.log('Message ID:', testResult.messageId);

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Full error:', error);
  }
}

testEmailService();
