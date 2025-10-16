import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaArrowLeft, FaSpinner, FaRedo } from 'react-icons/fa';
import { authAPI } from '../utils/api';
import { useToast } from '../components/Toast';
import '../styles/Auth.css';

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Get email from location state (passed from registration)
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      showToast('Email not found. Please register again.', 'error');
      navigate('/register');
      return;
    }

    // Start countdown for resend button (60 seconds)
    setCountdown(60);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOTP({ email, otp });

      showToast('Email verified successfully! Welcome!', 'success');
      // Store token in localStorage
      localStorage.setItem('token', response.token);
      // Navigate to appropriate dashboard based on role
      navigate(`/${response.user.role}-dashboard`);
    } catch (err) {
      const errorMsg = err.message || 'OTP verification failed. Please try again.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    setError('');

    try {
      await authAPI.resendOTP({ email });
      showToast('OTP sent successfully! Please check your email.', 'success');
      setCountdown(60);

      // Restart countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const errorMsg = err.message || 'Failed to resend OTP. Please try again.';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="auth-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="auth-icon">
            <FaEnvelope />
          </div>
          <h1>Email Verification</h1>
          <p>Enter the verification code sent to your email</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginTop: '5px' }}>
            {email}
          </p>
        </motion.div>

        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <motion.div
            className="form-group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label htmlFor="otp">
              Verification Code
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              maxLength="6"
              required
              className="input"
              style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' }}
            />
          </motion.div>

          <motion.button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || otp.length !== 6}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <FaSpinner className="spin" /> Verifying...
              </>
            ) : (
              <>
                <FaEnvelope /> Verify Email
              </>
            )}
          </motion.button>
        </form>

        <motion.div
          className="auth-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{ marginBottom: '15px' }}>
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={countdown > 0 || resendLoading}
              className="btn btn-secondary btn-block"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {resendLoading ? (
                <>
                  <FaSpinner className="spin" /> Sending...
                </>
              ) : countdown > 0 ? (
                <>
                  <FaRedo /> Resend OTP ({countdown}s)
                </>
              ) : (
                <>
                  <FaRedo /> Resend OTP
                </>
              )}
            </button>
          </div>

          <p>
            <button
              type="button"
              onClick={handleBackToRegister}
              className="link-button"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <FaArrowLeft /> Back to Registration
            </button>
          </p>
        </motion.div>
      </motion.div>

      {/* Animated Background */}
      <div className="auth-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
    </div>
  );
};

export default OTPVerification;
