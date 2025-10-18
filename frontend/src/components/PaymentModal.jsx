import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { paymentAPI, DUMMY_CARDS, UPI_PROVIDERS, WALLET_PROVIDERS, formatCardNumber, getCardType, validateExpiry, generateDummyCVV } from '../utils/paymentAPI';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, deliveryData, onPaymentSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Method Selection, 2: Details, 3: Processing, 4: Success
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [cardForm, setCardForm] = useState({
    number: '',
    holderName: '',
    expiry: { month: '', year: '' },
    cvv: ''
  });
  const [upiForm, setUpiForm] = useState({
    upiId: '',
    provider: ''
  });
  const [walletForm, setWalletForm] = useState({
    provider: '',
    walletId: ''
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedMethod('');
      setError('');
      setCardForm({ number: '', holderName: '', expiry: { month: '', year: '' }, cvv: '' });
      setUpiForm({ upiId: '', provider: '' });
      setWalletForm({ provider: '', walletId: '' });
    }
  }, [isOpen]);

  // Auto-fill dummy data when method is selected
  const fillDummyData = (method) => {
    switch (method) {
      case 'card':
        const randomCard = DUMMY_CARDS.visa[0];
        setCardForm({
          number: randomCard.number,
          holderName: 'John Doe',
          expiry: { month: '12', year: '2025' },
          cvv: generateDummyCVV('visa')
        });
        break;
      case 'upi':
        setUpiForm({
          upiId: 'user@okaxis',
          provider: 'googlepay'
        });
        break;
      case 'wallet':
        setWalletForm({
          provider: 'paytm',
          walletId: 'user@paytm'
        });
        break;
    }
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    fillDummyData(method);
    setCurrentStep(2);
  };

  const handlePaymentSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // First initiate payment
      let currentPaymentData = paymentData;
      if (!currentPaymentData) {
        console.log('🚀 Initiating payment for delivery:', deliveryData._id);
        console.log('📦 Delivery data:', deliveryData);
        const initResponse = await paymentAPI.initiate(deliveryData._id);
        
        if (!initResponse || !initResponse.paymentId) {
          throw new Error('Failed to initiate payment. Please try again.');
        }
        
        currentPaymentData = initResponse;
        setPaymentData(initResponse);
      }

      // Validate payment data
      if (!currentPaymentData || !currentPaymentData.paymentId) {
        throw new Error('Invalid payment data. Please refresh and try again.');
      }

      // Prepare payment method data
      let paymentMethod = { type: selectedMethod };

      switch (selectedMethod) {
        case 'card':
          paymentMethod.cardNumber = cardForm.number;
          paymentMethod.cardHolderName = cardForm.holderName;
          paymentMethod.expiryMonth = cardForm.expiry.month;
          paymentMethod.expiryYear = cardForm.expiry.year;
          paymentMethod.cvv = cardForm.cvv;
          break;
        case 'upi':
          paymentMethod.upiId = upiForm.upiId;
          paymentMethod.provider = upiForm.provider;
          break;
        case 'wallet':
          paymentMethod.walletProvider = walletForm.provider;
          paymentMethod.walletId = walletForm.walletId;
          break;
      }

      setCurrentStep(3); // Processing

      // Process payment
      const response = await paymentAPI.process(currentPaymentData.paymentId, paymentMethod);
      
      if (response.success) {
        setCurrentStep(4); // Success
        setTimeout(() => {
          onPaymentSuccess(response.payment);
          onClose();
        }, 3000);
      } else {
        throw new Error(response.message || 'Payment failed');
      }

    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setCurrentStep(2); // Go back to details
    } finally {
      setLoading(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  };

  const stepVariants = {
    hidden: { x: 300, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="payment-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="payment-modal"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="payment-header">
            <h2>💳 Complete Payment</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>

          {/* Progress Bar */}
          <div className="payment-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
            <div className="progress-steps">
              <span className={currentStep >= 1 ? 'active' : ''}>Method</span>
              <span className={currentStep >= 2 ? 'active' : ''}>Details</span>
              <span className={currentStep >= 3 ? 'active' : ''}>Processing</span>
              <span className={currentStep >= 4 ? 'active' : ''}>Complete</span>
            </div>
          </div>

          {/* Content */}
          <div className="payment-content">
            <AnimatePresence mode="wait">
              {/* Step 1: Method Selection */}
              {currentStep === 1 && (
                <motion.div
                  key="method-selection"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="payment-step"
                >
                  <h3>Choose Payment Method</h3>
                  
                  {/* Amount Display */}
                  <div className="amount-display">
                    <span>Amount to Pay</span>
                    <strong>₹{deliveryData?.fare || 0}</strong>
                  </div>

                  <div className="payment-methods">
                    <motion.div 
                      className="payment-method-card"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMethodSelect('card')}
                    >
                      <div className="method-icon">💳</div>
                      <div className="method-info">
                        <h4>Credit/Debit Card</h4>
                        <p>Visa, Mastercard, Amex</p>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="payment-method-card"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMethodSelect('upi')}
                    >
                      <div className="method-icon">📱</div>
                      <div className="method-info">
                        <h4>UPI</h4>
                        <p>Google Pay, PhonePe, Paytm</p>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="payment-method-card"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMethodSelect('wallet')}
                    >
                      <div className="method-icon">💰</div>
                      <div className="method-info">
                        <h4>Digital Wallet</h4>
                        <p>Paytm, PhonePe, Amazon Pay</p>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="payment-method-card"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMethodSelect('netbanking')}
                    >
                      <div className="method-icon">🏦</div>
                      <div className="method-info">
                        <h4>Net Banking</h4>
                        <p>All major banks</p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment Details */}
              {currentStep === 2 && (
                <motion.div
                  key="payment-details"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="payment-step"
                >
                  <div className="step-header">
                    <button 
                      className="back-btn"
                      onClick={() => setCurrentStep(1)}
                    >
                      ← Back
                    </button>
                    <h3>Enter {selectedMethod.toUpperCase()} Details</h3>
                  </div>

                  {error && (
                    <div className="error-message">
                      {error}
                    </div>
                  )}

                  {/* Card Form */}
                  {selectedMethod === 'card' && (
                    <div className="card-form">
                      <div className="form-group">
                        <label>Card Number</label>
                        <input
                          type="text"
                          value={formatCardNumber(cardForm.number)}
                          onChange={(e) => setCardForm({
                            ...cardForm,
                            number: e.target.value.replace(/\s/g, '')
                          })}
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                        />
                        <small>Use dummy test cards: 4111111111111111 (Visa)</small>
                      </div>

                      <div className="form-group">
                        <label>Cardholder Name</label>
                        <input
                          type="text"
                          value={cardForm.holderName}
                          onChange={(e) => setCardForm({
                            ...cardForm,
                            holderName: e.target.value
                          })}
                          placeholder="John Doe"
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Expiry Month</label>
                          <select
                            value={cardForm.expiry.month}
                            onChange={(e) => setCardForm({
                              ...cardForm,
                              expiry: { ...cardForm.expiry, month: e.target.value }
                            })}
                          >
                            <option value="">MM</option>
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                {String(i + 1).padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Expiry Year</label>
                          <select
                            value={cardForm.expiry.year}
                            onChange={(e) => setCardForm({
                              ...cardForm,
                              expiry: { ...cardForm.expiry, year: e.target.value }
                            })}
                          >
                            <option value="">YYYY</option>
                            {Array.from({ length: 10 }, (_, i) => (
                              <option key={i} value={2024 + i}>
                                {2024 + i}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>CVV</label>
                          <input
                            type="text"
                            value={cardForm.cvv}
                            onChange={(e) => setCardForm({
                              ...cardForm,
                              cvv: e.target.value
                            })}
                            placeholder="123"
                            maxLength="4"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UPI Form */}
                  {selectedMethod === 'upi' && (
                    <div className="upi-form">
                      <div className="form-group">
                        <label>UPI ID</label>
                        <input
                          type="text"
                          value={upiForm.upiId}
                          onChange={(e) => setUpiForm({
                            ...upiForm,
                            upiId: e.target.value
                          })}
                          placeholder="yourname@okaxis"
                        />
                      </div>

                      <div className="form-group">
                        <label>UPI Provider</label>
                        <div className="upi-providers">
                          {UPI_PROVIDERS.map(provider => (
                            <motion.div
                              key={provider.id}
                              className={`provider-option ${upiForm.provider === provider.id ? 'selected' : ''}`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setUpiForm({
                                ...upiForm,
                                provider: provider.id
                              })}
                            >
                              {provider.name}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wallet Form */}
                  {selectedMethod === 'wallet' && (
                    <div className="wallet-form">
                      <div className="form-group">
                        <label>Select Wallet</label>
                        <div className="wallet-providers">
                          {WALLET_PROVIDERS.map(wallet => (
                            <motion.div
                              key={wallet.id}
                              className={`provider-option ${walletForm.provider === wallet.id ? 'selected' : ''}`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setWalletForm({
                                ...walletForm,
                                provider: wallet.id
                              })}
                            >
                              <span className="wallet-icon">{wallet.icon}</span>
                              {wallet.name}
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Wallet ID</label>
                        <input
                          type="text"
                          value={walletForm.walletId}
                          onChange={(e) => setWalletForm({
                            ...walletForm,
                            walletId: e.target.value
                          })}
                          placeholder="your-wallet-id"
                        />
                      </div>
                    </div>
                  )}

                  {/* Net Banking */}
                  {selectedMethod === 'netbanking' && (
                    <div className="netbanking-form">
                      <div className="bank-selection">
                        <h4>Select Your Bank</h4>
                        <div className="bank-grid">
                          {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB'].map(bank => (
                            <motion.div
                              key={bank}
                              className="bank-option"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {bank}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <motion.button
                    className="pay-now-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePaymentSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Pay ₹${deliveryData?.fare || 0}`}
                  </motion.button>
                </motion.div>
              )}

              {/* Step 3: Processing */}
              {currentStep === 3 && (
                <motion.div
                  key="processing"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="payment-step processing-step"
                >
                  <div className="processing-animation">
                    <motion.div
                      className="spinner"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      💳
                    </motion.div>
                    <h3>Processing Payment...</h3>
                    <p>Please wait while we process your payment securely</p>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Success */}
              {currentStep === 4 && (
                <motion.div
                  key="success"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="payment-step success-step"
                >
                  <motion.div
                    className="success-animation"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <div className="success-icon">✅</div>
                    <h3>Payment Successful!</h3>
                    <p>Your payment has been processed successfully</p>
                    <div className="success-details">
                      <p><strong>Amount:</strong> ₹{deliveryData?.fare}</p>
                      <p><strong>Receipt:</strong> Sent to your email</p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;
