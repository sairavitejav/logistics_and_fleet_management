# Razorpay Payment Integration Guide

## Overview
This application now uses **Razorpay** as the payment gateway instead of the previous dummy payment system. Razorpay provides secure, real payment processing with support for multiple payment methods including cards, UPI, wallets, and net banking.

## Features Implemented

### Backend
- ✅ Razorpay SDK integration
- ✅ Order creation and management
- ✅ Payment signature verification
- ✅ Webhook support for payment events
- ✅ Payment history and tracking
- ✅ Email receipts after successful payment
- ✅ Real-time socket notifications

### Frontend
- ✅ Razorpay Checkout integration
- ✅ Seamless payment modal
- ✅ Automatic payment verification
- ✅ Success/failure handling
- ✅ Payment history display

## Setup Instructions

### 1. Backend Configuration

#### Install Dependencies
The Razorpay SDK has already been installed:
```bash
cd backend
npm install razorpay crypto
```

#### Configure Environment Variables
Update your `.env` file with the Razorpay credentials:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_RW7FFAnNK5CDJf
RAZORPAY_KEY_SECRET=uWg6E61DTI3CxhekGD1kIGyG
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

**Note:** The webhook secret is optional for testing but recommended for production. You can generate it from the Razorpay Dashboard under Settings > Webhooks.

### 2. Frontend Configuration

The Razorpay Checkout script is already added to `index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

No additional frontend configuration is required.

### 3. Razorpay Dashboard Setup

#### Create Webhooks (Optional but Recommended)
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** > **Webhooks**
3. Click **Create New Webhook**
4. Enter your webhook URL: `https://your-domain.com/api/webhooks/razorpay`
5. Select the following events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
6. Copy the webhook secret and add it to your `.env` file

## Payment Flow

### 1. Payment Initiation
When a driver marks a delivery as "Parcel Delivered":
1. Customer sees "Pay Now" button
2. Customer clicks the button
3. Frontend calls `/api/payments/initiate` with delivery ID
4. Backend creates a Razorpay order and returns order details

### 2. Razorpay Checkout
1. Frontend opens Razorpay Checkout modal
2. Customer selects payment method (Card/UPI/Wallet/Net Banking)
3. Customer completes payment through Razorpay
4. Razorpay returns payment response with:
   - `razorpay_order_id`
   - `razorpay_payment_id`
   - `razorpay_signature`

### 3. Payment Verification
1. Frontend sends payment response to `/api/payments/:paymentId/verify`
2. Backend verifies the signature using Razorpay secret
3. Backend fetches payment details from Razorpay
4. Backend updates payment status to "completed"
5. Backend updates delivery status to "delivered"
6. Backend sends email receipt to customer
7. Socket notification sent to customer and driver

### 4. Webhook Processing (Background)
Razorpay also sends webhook events to `/api/webhooks/razorpay`:
- Provides redundancy in case frontend verification fails
- Handles payment status updates
- Ensures payment consistency

## API Endpoints

### Payment Endpoints

#### 1. Initiate Payment
```http
POST /api/payments/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "deliveryId": "delivery_id_here"
}
```

**Response:**
```json
{
  "paymentId": "payment_id",
  "transactionId": "TXN123456",
  "razorpayOrderId": "order_xyz",
  "razorpayKeyId": "rzp_test_xxx",
  "amount": {
    "baseFare": 50,
    "distanceFare": 100,
    "totalAmount": 150
  },
  "delivery": { ... },
  "customer": { ... }
}
```

#### 2. Verify Payment
```http
POST /api/payments/:paymentId/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_xyz",
  "razorpay_payment_id": "pay_abc",
  "razorpay_signature": "signature_hash"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "payment": {
    "id": "payment_id",
    "transactionId": "TXN123456",
    "receiptNumber": "RCP123456",
    "amount": { ... },
    "status": "completed",
    "completedAt": "2024-01-01T00:00:00.000Z",
    "paymentMethod": { "type": "card" }
  }
}
```

#### 3. Get Payment History
```http
GET /api/payments/history/user?page=1&limit=10
Authorization: Bearer <token>
```

#### 4. Get Razorpay Key
```http
GET /api/payments/razorpay-key
```

**Response:**
```json
{
  "key": "rzp_test_RW7FFAnNK5CDJf"
}
```

### Webhook Endpoint

```http
POST /api/webhooks/razorpay
X-Razorpay-Signature: <signature>
Content-Type: application/json

{
  "event": "payment.captured",
  "payload": { ... }
}
```

## Testing

### Test Mode
The application is currently configured with **test mode** credentials:
- Key ID: `rzp_test_RW7FFAnNK5CDJf`
- Key Secret: `uWg6E61DTI3CxhekGD1kIGyG`

### Test Cards (Razorpay Test Mode)
Use these test cards for testing payments:

**Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- Name: Any name

**Failed Payment:**
- Card Number: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date

**Test UPI IDs:**
- `success@razorpay` - Successful payment
- `failure@razorpay` - Failed payment

### Testing Workflow
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Create a delivery as a customer
4. Accept the delivery as a driver
5. Mark delivery as "Parcel Delivered"
6. Click "Pay Now" as customer
7. Complete payment using test credentials
8. Verify payment success and delivery completion

## Production Deployment

### 1. Switch to Live Mode
1. Log in to Razorpay Dashboard
2. Switch to **Live Mode**
3. Generate live API keys from Settings > API Keys
4. Update `.env` with live credentials:
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=your_live_secret
   ```

### 2. Configure Webhooks
1. Create webhook with production URL
2. Add webhook secret to `.env`
3. Test webhook delivery

### 3. Enable Payment Methods
In Razorpay Dashboard:
1. Go to Settings > Payment Methods
2. Enable desired payment methods:
   - Cards (Visa, Mastercard, Amex, etc.)
   - UPI
   - Wallets (Paytm, PhonePe, etc.)
   - Net Banking
   - EMI options (if needed)

### 4. KYC and Activation
Complete KYC requirements in Razorpay Dashboard to activate live payments.

## Security Considerations

### 1. API Keys
- ✅ Never commit API keys to version control
- ✅ Use environment variables
- ✅ Rotate keys periodically
- ✅ Use different keys for test and production

### 2. Signature Verification
- ✅ Always verify payment signatures on backend
- ✅ Never trust frontend payment responses alone
- ✅ Use webhook signature verification

### 3. HTTPS
- ✅ Always use HTTPS in production
- ✅ Razorpay requires HTTPS for live mode

### 4. Amount Validation
- ✅ Verify payment amount matches order amount
- ✅ Check order status before processing
- ✅ Prevent duplicate payments

## Troubleshooting

### Payment Initiation Fails
**Error:** "Failed to create Razorpay order"
**Solution:**
- Check if Razorpay credentials are correct in `.env`
- Verify internet connectivity
- Check Razorpay Dashboard for API status

### Payment Verification Fails
**Error:** "Payment signature verification failed"
**Solution:**
- Ensure `RAZORPAY_KEY_SECRET` is correct
- Check if payment was actually successful in Razorpay Dashboard
- Verify order ID matches

### Webhook Not Receiving Events
**Solution:**
- Check webhook URL is publicly accessible
- Verify webhook secret matches
- Check Razorpay Dashboard > Webhooks > Event Logs
- Ensure server is running and accessible

### Payment Stuck in Processing
**Solution:**
- Check payment status in Razorpay Dashboard
- Verify webhook is configured correctly
- Check backend logs for errors
- Manually verify payment using payment ID

## Support and Resources

### Razorpay Documentation
- [API Documentation](https://razorpay.com/docs/api/)
- [Checkout Documentation](https://razorpay.com/docs/payments/payment-gateway/web-integration/)
- [Webhooks Guide](https://razorpay.com/docs/webhooks/)
- [Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

### Contact
- Razorpay Support: support@razorpay.com
- Dashboard: https://dashboard.razorpay.com/

## Migration from Dummy System

### What Changed
1. **Removed:**
   - Dummy payment simulation
   - Manual payment method selection forms
   - Dummy card validation

2. **Added:**
   - Real Razorpay integration
   - Automatic payment method selection via Razorpay Checkout
   - Signature verification
   - Webhook support

### Database Compatibility
The payment model has been updated to include Razorpay-specific fields:
- `razorpay.orderId`
- `razorpay.paymentId`
- `razorpay.signature`

Existing payment records will continue to work, but new payments will use Razorpay.

## Conclusion

Your application now has a fully functional, production-ready payment system powered by Razorpay. The integration supports all major payment methods in India and provides a secure, seamless payment experience for your customers.

For any issues or questions, refer to the Razorpay documentation or contact their support team.
