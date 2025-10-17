import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCreditCard, FaReceipt, FaCalendarAlt, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { paymentAPI } from '../utils/paymentAPI';
import { useToast } from './Toast';
import './PaymentHistory.css';

const PaymentHistory = () => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPaymentHistory();
  }, [currentPage]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getHistory(currentPage, 10);
      setPayments(response.payments);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      showToast('Failed to load payment history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodDisplay = (method) => {
    switch (method.type) {
      case 'card':
        return `${method.cardDetails?.cardType?.toUpperCase() || 'Card'} •••• ${method.cardDetails?.last4Digits}`;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'pending': return '#ffc107';
      case 'failed': return '#dc3545';
      case 'refunded': return '#6c757d';
      default: return '#6c757d';
    }
  };

  if (loading && currentPage === 1) {
    return (
      <div className="payment-history-loading">
        <FaSpinner className="spinner" />
        <p>Loading payment history...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="payment-history-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="payment-history-header">
        <h2><FaCreditCard /> Payment History</h2>
        <p>View all your payment transactions</p>
      </div>

      {payments.length === 0 ? (
        <motion.div
          className="no-payments"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <FaReceipt size={64} color="var(--gray)" />
          <h3>No Payment History</h3>
          <p>You haven't made any payments yet</p>
        </motion.div>
      ) : (
        <div className="payments-list">
          {payments.map((payment, index) => (
            <motion.div
              key={payment._id}
              className="payment-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="payment-header">
                <div className="payment-info">
                  <h4>Ride Payment</h4>
                  <p className="payment-id">#{payment.transactionId}</p>
                </div>
                <div className="payment-amount">
                  <span className="amount">₹{payment.amount.totalAmount}</span>
                  <span 
                    className="status"
                    style={{ color: getStatusColor(payment.status) }}
                  >
                    <FaCheckCircle /> {payment.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="payment-details">
                <div className="detail-row">
                  <span className="label">Date & Time:</span>
                  <span className="value">
                    <FaCalendarAlt /> {formatDate(payment.completedAt || payment.createdAt)}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="label">Payment Method:</span>
                  <span className="value">{getPaymentMethodDisplay(payment.paymentMethod)}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Receipt Number:</span>
                  <span className="value">{payment.receipt.receiptNumber}</span>
                </div>

                {payment.delivery && (
                  <div className="ride-details">
                    <div className="detail-row">
                      <span className="label">From:</span>
                      <span className="value">{payment.delivery.pickupLocation?.address || 'Pickup Location'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">To:</span>
                      <span className="value">{payment.delivery.dropoffLocation?.address || 'Drop Location'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Distance:</span>
                      <span className="value">{payment.delivery.distance || 0} km</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="payment-breakdown">
                <div className="breakdown-row">
                  <span>Base Fare:</span>
                  <span>₹{payment.amount.baseFare}</span>
                </div>
                <div className="breakdown-row">
                  <span>Distance Fare:</span>
                  <span>₹{payment.amount.distanceFare}</span>
                </div>
                <div className="breakdown-row total">
                  <span>Total:</span>
                  <span>₹{payment.amount.totalAmount}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            className="btn btn-outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || loading}
          >
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default PaymentHistory;
