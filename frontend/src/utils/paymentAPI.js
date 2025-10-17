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

  // Process payment with selected method
  process: async (paymentId, paymentMethod) => {
    return await fetchAPI(`/payments/${paymentId}/process`, {
      method: 'POST',
      body: JSON.stringify({ paymentMethod })
    });
  },

  // Get payment details
  getDetails: async (paymentId) => {
    return await fetchAPI(`/payments/${paymentId}`);
  },

  // Get payment history
  getHistory: async (page = 1, limit = 10) => {
    return await fetchAPI(`/payments/history/user?page=${page}&limit=${limit}`);
  },

  // Validate payment method
  validateMethod: async (paymentMethod) => {
    return await fetchAPI('/payments/validate-method', {
      method: 'POST',
      body: JSON.stringify({ paymentMethod })
    });
  }
};

// Dummy card numbers for testing
export const DUMMY_CARDS = {
  visa: [
    { number: '4111111111111111', type: 'visa', name: 'Visa Test Card' },
    { number: '4012888888881881', type: 'visa', name: 'Visa Debit Test' }
  ],
  mastercard: [
    { number: '5555555555554444', type: 'mastercard', name: 'Mastercard Test' },
    { number: '5105105105105100', type: 'mastercard', name: 'Mastercard Debit' }
  ],
  amex: [
    { number: '378282246310005', type: 'amex', name: 'American Express Test' },
    { number: '371449635398431', type: 'amex', name: 'Amex Gold Test' }
  ],
  discover: [
    { number: '6011111111111117', type: 'discover', name: 'Discover Test' },
    { number: '6011000990139424', type: 'discover', name: 'Discover Debit' }
  ]
};

// UPI providers for testing
export const UPI_PROVIDERS = [
  { id: 'googlepay', name: 'Google Pay', suffix: '@okaxis' },
  { id: 'phonepe', name: 'PhonePe', suffix: '@ybl' },
  { id: 'paytm', name: 'Paytm', suffix: '@paytm' },
  { id: 'bhim', name: 'BHIM UPI', suffix: '@upi' }
];

// Wallet providers
export const WALLET_PROVIDERS = [
  { id: 'paytm', name: 'Paytm Wallet', icon: '💰' },
  { id: 'phonepe', name: 'PhonePe Wallet', icon: '📱' },
  { id: 'googlepay', name: 'Google Pay', icon: '🔵' },
  { id: 'amazonpay', name: 'Amazon Pay', icon: '🛒' }
];

// Format card number for display
export const formatCardNumber = (number) => {
  return number.replace(/(\d{4})(?=\d)/g, '$1 ');
};

// Get card type from number
export const getCardType = (number) => {
  const cleanNumber = number.replace(/\s/g, '');
  
  if (cleanNumber.startsWith('4')) return 'visa';
  if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) return 'mastercard';
  if (cleanNumber.startsWith('3')) return 'amex';
  if (cleanNumber.startsWith('6')) return 'discover';
  
  return 'unknown';
};

// Validate card expiry
export const validateExpiry = (month, year) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const expYear = parseInt(year);
  const expMonth = parseInt(month);
  
  if (expYear < currentYear) return false;
  if (expYear === currentYear && expMonth < currentMonth) return false;
  
  return true;
};

// Generate dummy CVV
export const generateDummyCVV = (cardType) => {
  return cardType === 'amex' ? '1234' : '123';
};
