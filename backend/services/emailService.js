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

// Send payment receipt email
const sendPaymentReceiptEmail = async (email, paymentData, customerName) => {
  try {
    const transporter = createTransporter();
    
    const {
      transactionId,
      receipt,
      amount,
      paymentMethod,
      delivery,
      completedAt
    } = paymentData;

    const formatDate = (date) => {
      return new Date(date).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getPaymentMethodDisplay = (method) => {
      switch (method.type) {
        case 'card':
          return `${method.cardDetails?.cardType?.toUpperCase() || 'Card'} ending in ${method.cardDetails?.last4Digits}`;
        case 'upi':
          return `UPI - ${method.upiDetails?.upiId}`;
        case 'wallet':
          return `${method.walletDetails?.walletProvider?.toUpperCase() || 'Wallet'}`;
        case 'netbanking':
          return 'Net Banking';
        default:
          return 'Digital Payment';
      }
    };

    const mailOptions = {
      from: process.env.SENDGRID_API_KEY ? process.env.SENDGRID_FROM_EMAIL || 'Logistics App <noreply@yourdomain.com>' : process.env.EMAIL_USER || 'noreply@logisticsapp.com',
      to: email,
      subject: `Payment Receipt - ${receipt.receiptNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px;">
              <h1 style="color: #007bff; margin: 0; font-size: 28px;">🚚 Logistics & Fleet</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 16px;">Payment Receipt</p>
            </div>

            <!-- Receipt Details -->
            <div style="background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">✅ Payment Successful</h2>
              <p style="margin: 5px 0; color: #555;"><strong>Receipt Number:</strong> ${receipt.receiptNumber}</p>
              <p style="margin: 5px 0; color: #555;"><strong>Transaction ID:</strong> ${transactionId}</p>
              <p style="margin: 5px 0; color: #555;"><strong>Date & Time:</strong> ${formatDate(completedAt)}</p>
            </div>

            <!-- Customer Details -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Customer Details</h3>
              <p style="margin: 5px 0; color: #555;"><strong>Name:</strong> ${customerName}</p>
              <p style="margin: 5px 0; color: #555;"><strong>Email:</strong> ${email}</p>
            </div>

            <!-- Ride Details -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Ride Details</h3>
              <p style="margin: 5px 0; color: #555;"><strong>From:</strong> ${delivery.pickupLocation?.address || 'Pickup Location'}</p>
              <p style="margin: 5px 0; color: #555;"><strong>To:</strong> ${delivery.dropoffLocation?.address || 'Drop Location'}</p>
              <p style="margin: 5px 0; color: #555;"><strong>Vehicle Type:</strong> ${delivery.vehicleType?.toUpperCase() || 'N/A'}</p>
              <p style="margin: 5px 0; color: #555;"><strong>Distance:</strong> ${delivery.distance || 0} km</p>
            </div>

            <!-- Payment Breakdown -->
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Payment Breakdown</h3>
              <div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                <span style="color: #555;">Base Fare:</span>
                <span style="color: #333; font-weight: bold;">₹${amount.baseFare}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                <span style="color: #555;">Distance Fare:</span>
                <span style="color: #333; font-weight: bold;">₹${amount.distanceFare}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 15px 0 0 0; padding: 15px 0 0 0; border-top: 2px solid #007bff;">
                <span style="color: #333; font-size: 18px; font-weight: bold;">Total Amount:</span>
                <span style="color: #007bff; font-size: 20px; font-weight: bold;">₹${amount.totalAmount}</span>
              </div>
            </div>

            <!-- Payment Method -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Payment Method</h3>
              <p style="margin: 5px 0; color: #555; font-weight: bold;">${getPaymentMethodDisplay(paymentMethod)}</p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
              <p style="color: #666; margin: 5px 0; font-size: 14px;">Thank you for using our logistics service!</p>
              <p style="color: #666; margin: 5px 0; font-size: 14px;">For support, contact us at support@logistics.com</p>
              <div style="margin-top: 15px;">
                <span style="background-color: #28a745; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  ✓ PAYMENT VERIFIED
                </span>
              </div>
            </div>

          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Payment receipt email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendPaymentReceiptEmail
};
