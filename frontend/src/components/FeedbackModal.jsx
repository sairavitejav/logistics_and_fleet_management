import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaTimes, FaUser, FaClock, FaComments, FaCar, FaPhone } from 'react-icons/fa';
import { feedbackService } from '../utils/feedbackAPI';
import { useToast } from './Toast';
import '../styles/FeedbackModal.css';

const FeedbackModal = ({ isOpen, onClose, ride, onFeedbackSubmitted }) => {
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [categories, setCategories] = useState({
    punctuality: 0,
    behavior: 0,
    vehicleCondition: 0,
    communication: 0
  });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryLabels = {
    punctuality: { label: 'Punctuality', icon: FaClock },
    behavior: { label: 'Behavior', icon: FaUser },
    vehicleCondition: { label: 'Vehicle Condition', icon: FaCar },
    communication: { label: 'Communication', icon: FaPhone }
  };

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair', 
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  const handleStarClick = (value, category = null) => {
    if (category) {
      setCategories(prev => ({ ...prev, [category]: value }));
    } else {
      setRating(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      showToast('Please provide an overall rating', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const feedbackData = {
        rideId: ride._id,
        rating,
        comment: comment.trim(),
        categories: Object.keys(categories).reduce((acc, key) => {
          if (categories[key] > 0) {
            acc[key] = categories[key];
          }
          return acc;
        }, {}),
        isAnonymous
      };

      await feedbackService.createFeedback(feedbackData);
      showToast('Thank you for your feedback!', 'success');
      onFeedbackSubmitted();
      onClose();
      
      // Reset form
      setRating(0);
      setComment('');
      setCategories({ punctuality: 0, behavior: 0, vehicleCondition: 0, communication: 0 });
      setIsAnonymous(false);
    } catch (error) {
      console.error('Feedback submission error:', error);
      if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
        showToast('Feedback system is currently unavailable. Please try again later.', 'error');
      } else {
        showToast(error.message || 'Failed to submit feedback', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, size = 24, category = null }) => (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={size}
          className={`star ${star <= (hoverRating || value) ? 'filled' : 'empty'}`}
          onClick={() => handleStarClick(star, category)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
        />
      ))}
    </div>
  );

  if (!ride) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="feedback-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="feedback-modal"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="feedback-modal-header">
              <h2>
                <FaComments /> Rate Your Ride Experience
              </h2>
              <button className="close-btn" onClick={onClose}>
                <FaTimes />
              </button>
            </div>

            <div className="feedback-modal-body">
              {/* Ride Info */}
              <div className="ride-info-section">
                <h3>Ride Details</h3>
                <div className="ride-summary">
                  <div className="driver-info">
                    <FaUser />
                    <span>Driver: {ride.driver?.name || 'Unknown'}</span>
                  </div>
                  <div className="ride-date">
                    {new Date(ride.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Overall Rating */}
                <div className="rating-section">
                  <h3>Overall Rating *</h3>
                  <div className="overall-rating">
                    <StarRating value={rating} onChange={setRating} size={32} />
                    <span className="rating-label">
                      {rating > 0 && ratingLabels[rating]}
                    </span>
                  </div>
                </div>

                {/* Category Ratings */}
                <div className="category-ratings">
                  <h3>Rate Specific Aspects (Optional)</h3>
                  <div className="categories-grid">
                    {Object.entries(categoryLabels).map(([key, { label, icon: Icon }]) => (
                      <div key={key} className="category-item">
                        <div className="category-header">
                          <Icon />
                          <span>{label}</span>
                        </div>
                        <StarRating 
                          value={categories[key]} 
                          onChange={(value) => setCategories(prev => ({ ...prev, [key]: value }))}
                          category={key}
                          size={20}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="comment-section">
                  <h3>Additional Comments (Optional)</h3>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience, suggestions, or any specific feedback..."
                    maxLength={500}
                    rows={4}
                  />
                  <div className="char-count">
                    {comment.length}/500 characters
                  </div>
                </div>

                {/* Anonymous Option */}
                <div className="anonymous-section">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Submit feedback anonymously
                  </label>
                </div>

                {/* Submit Button */}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || rating === 0}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;
