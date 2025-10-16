const nodemailer = require('nodemailer');

// Create transporter using environment variables or default settings
const createTransporter = () => {
  // Use SendGrid for production
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  // Fallback to Gmail for development
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD
    }
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_FROM_EMAIL || 'Logistics App <noreply@yourdomain.com>' : process.env.EMAIL_USER || 'noreply@logisticsapp.com',
      to: email,
      subject: 'Email Verification - Logistics & Fleet Management',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Hi ${name},</p>
          <p>Thank you for registering with our Logistics & Fleet Management system!</p>
          <p>To complete your registration and verify your email address, please use the following OTP:</p>

          <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 20px 0; text-align: center; border-radius: 5px;">
            <h1 style="color: #007bff; margin: 0; letter-spacing: 3px;">${otp}</h1>
          </div>

          <p>This OTP will expire in 10 minutes for security reasons.</p>

          <p>If you didn't request this verification, please ignore this email.</p>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #dee2e6;">
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            Logistics & Fleet Management Team
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email after successful verification
const sendWelcomeEmail = async (email, name, role) => {
  try {
    const transporter = createTransporter();

    const roleMessages = {
      customer: 'You can now book deliveries, track your packages, and manage your orders.',
      driver: 'You can now accept delivery requests, update your status, and manage your routes.',
      admin: 'You now have access to the admin dashboard to manage users, vehicles, and deliveries.'
    };

    const mailOptions = {
      from: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_FROM_EMAIL || 'Logistics App <noreply@yourdomain.com>' : process.env.EMAIL_USER || 'noreply@logisticsapp.com',
      to: email,
      subject: 'Welcome to Logistics & Fleet Management!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #28a745;">Welcome, ${name}!</h2>
          <p>Your email has been successfully verified and your account is now active.</p>

          <p>As a <strong>${role}</strong>, ${roleMessages[role] || 'you can now access all the features available to your role.'}</p>

          <div style="background-color: #e9ecef; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin: 0 0 10px 0;">Get Started:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Login to your account</li>
              <li>Complete your profile</li>
              <li>Explore the dashboard features</li>
            </ul>
          </div>

          <p>If you have any questions, feel free to contact our support team.</p>

          <hr style="margin: 20px 0; border: none; border-top: 1px solid #dee2e6;">
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            Logistics & Fleet Management Team
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Welcome email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail
};
