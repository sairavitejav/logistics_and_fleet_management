import { fetchAPI } from './api';

// Payment API endpoints
export const paymentAPI = {
  // Initiate payment for a delivery
  initiate: async (deliveryId) => {
    return await fetchAPI('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({ deliveryId })
    });
  },

  // Verify Razorpay payment
  verify: async (paymentId, razorpayResponse) => {
    return await fetchAPI(`/payments/${paymentId}/verify`, {
      method: 'POST',
      body: JSON.stringify(razorpayResponse)
    });
  },

  // Legacy process payment (for backward compatibility)
  process: async (paymentId, paymentMethod) => {
    return await fetchAPI(`/payments/${paymentId}/process`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod })
    });
  },

  // Get Razorpay key
  getRazorpayKey: async () => {
    return await fetchAPI('/payments/razorpay-key');
  },

  // Get payment details
  getDetails: async (paymentId) => {
    return await fetchAPI(`/payments/${paymentId}`);
  },

  // Get payment history
  getHistory: async (page = 1, limit = 10) => {
    return await fetchAPI(`/payments/history/user?page=${page}&limit=${limit}`);
  },

};

/**
 * Open Razorpay checkout
 * @param {Object} options - Razorpay checkout options
 * @param {Function} onSuccess - Success callback
 * @param {Function} onFailure - Failure callback
 */
export const openRazorpayCheckout = (options, onSuccess, onFailure) => {
  if (!window.Razorpay) {
    console.error('Razorpay SDK not loaded');
    onFailure(new Error('Razorpay SDK not loaded'));
    return;
  }

  const razorpay = new window.Razorpay({
    ...options,
    handler: function (response) {
      console.log('✅ Payment successful:', response);
      onSuccess(response);
    },
    modal: {
      ondismiss: function () {
        console.log('❌ Payment cancelled by user');
        onFailure(new Error('Payment cancelled'));
      }
    }
  });

  razorpay.on('payment.failed', function (response) {
    console.error('❌ Payment failed:', response.error);
    onFailure(response.error);
  });

  razorpay.open();
};

/**
 * Load Razorpay script dynamically (fallback if not loaded via HTML)
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
};
