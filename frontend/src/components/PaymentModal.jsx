import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { paymentAPI, openRazorpayCheckout, loadRazorpayScript } from '../utils/paymentAPI';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, deliveryData, onPaymentSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Initiating, 2: Processing, 3: Success
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize payment when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setError('');
      setPaymentData(null);
      initiatePaymentProcess();
    }
  }, [isOpen]);

  const initiatePaymentProcess = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🚀 Initiating payment for delivery:', deliveryData._id);
      
      // Ensure Razorpay script is loaded
      await loadRazorpayScript();
      
      // Initiate payment on backend
      const initResponse = await paymentAPI.initiate(deliveryData._id);
      
      if (!initResponse || !initResponse.paymentId) {
        throw new Error('Failed to initiate payment. Please try again.');
      }

      console.log('✅ Payment initiated:', initResponse);
      setPaymentData(initResponse);

      // Open Razorpay checkout
      const options = {
        key: initResponse.razorpayKeyId,
        amount: initResponse.amount.totalAmount * 100, // Convert to paise
        currency: 'INR',
        name: 'Logistics & Fleet Management',
        description: `Payment for ${initResponse.delivery.vehicleType} delivery`,
        order_id: initResponse.razorpayOrderId,
        prefill: {
          name: initResponse.customer.name,
          email: initResponse.customer.email,
          contact: '' // Add contact if available
        },
        notes: {
          deliveryId: initResponse.delivery.id,
          pickupLocation: initResponse.delivery.pickupLocation,
          dropoffLocation: initResponse.delivery.dropoffLocation
        },
        theme: {
          color: '#3399cc'
        }
      };

      setCurrentStep(2); // Processing
      setLoading(false);

      openRazorpayCheckout(
        options,
        (razorpayResponse) => handlePaymentSuccess(razorpayResponse, initResponse.paymentId),
        (error) => handlePaymentFailure(error)
      );

    } catch (err) {
      console.error('❌ Payment initiation error:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (razorpayResponse, paymentId) => {
    try {
      console.log('🔐 Verifying payment...');
      setCurrentStep(2); // Processing

      // Verify payment on backend
      const verifyResponse = await paymentAPI.verify(paymentId, razorpayResponse);

      if (verifyResponse.success) {
        console.log('✅ Payment verified successfully');
        setCurrentStep(3); // Success
        
        setTimeout(() => {
          onPaymentSuccess(verifyResponse.payment);
          onClose();
        }, 2000);
      } else {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('❌ Payment verification error:', err);
      setError(err.message || 'Payment verification failed');
      setCurrentStep(1);
    }
  };

  const handlePaymentFailure = (error) => {
    console.error('❌ Payment failed:', error);
    setError(error.message || 'Payment failed. Please try again.');
    setCurrentStep(1);
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
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
            <div className="progress-steps">
              <span className={currentStep >= 1 ? 'active' : ''}>Initiating</span>
              <span className={currentStep >= 2 ? 'active' : ''}>Processing</span>
              <span className={currentStep >= 3 ? 'active' : ''}>Complete</span>
            </div>
          </div>

          {/* Content */}
          <div className="payment-content">
            <AnimatePresence mode="wait">
              {/* Step 1: Initiating */}
              {currentStep === 1 && (
                <motion.div
                  key="initiating"
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
                    <h3>Initiating Payment...</h3>
                    <p>Please wait while we prepare your payment</p>
                    
                    {/* Amount Display */}
                    <div className="amount-display" style={{ marginTop: '20px' }}>
                      <span>Amount to Pay</span>
                      <strong>₹{deliveryData?.fare || 0}</strong>
                    </div>

                    {error && (
                      <div className="error-message" style={{ marginTop: '20px' }}>
                        {error}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Processing */}
              {currentStep === 2 && (
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
                    <h3>Verifying Payment...</h3>
                    <p>Please wait while we verify your payment with Razorpay</p>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Success */}
              {currentStep === 3 && (
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
