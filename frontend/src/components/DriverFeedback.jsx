import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaUser, FaCalendarAlt, FaComments, FaChartBar, FaTrophy } from 'react-icons/fa';
import { feedbackService } from '../utils/feedbackAPI';
import { useAuth } from '../Context/AuthContext';
import { useToast } from './Toast';
import { ListSkeleton } from './LoadingSkeleton';
import '../styles/DriverFeedback.css';

const DriverFeedback = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [feedback, setFeedback] = useState([]);
  const [driverRating, setDriverRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDriverFeedback();
  }, [currentPage]);

  const fetchDriverFeedback = async () => {
    try {
      setLoading(true);
      const response = await feedbackService.getDriverFeedback(user.id, currentPage, 10);
      setFeedback(response.feedback);
      setDriverRating(response.driverRating);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Driver feedback fetch error:', error);
      if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
        showToast('Feedback system is currently being set up. Please check back later.', 'info');
      } else {
        showToast('Failed to load feedback', 'error');
      }
      // Set empty state for graceful degradation
      setFeedback([]);
      setDriverRating({ averageRating: 0, totalFeedbacks: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const StarDisplay = ({ rating, size = 16 }) => (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={size}
          className={star <= rating ? 'star-filled' : 'star-empty'}
        />
      ))}
    </div>
  );

  const RatingDistribution = ({ distribution }) => {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    return (
      <div className="rating-distribution">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={rating} className="rating-bar">
              <span className="rating-number">{rating}</span>
              <FaStar className="rating-star" />
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="rating-count">({count})</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="driver-feedback-container">
        <div className="feedback-header">
          <h2><FaComments /> My Feedback & Ratings</h2>
        </div>
        <ListSkeleton count={3} />
      </div>
    );
  }

  return (
    <motion.div
      className="driver-feedback-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="feedback-header">
        <h2><FaComments /> My Feedback & Ratings</h2>
      </div>

      {/* Rating Overview */}
      {driverRating && (
        <motion.div
          className="rating-overview"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="rating-summary">
            <div className="overall-rating">
              <div className="rating-score">
                <span className="score">{driverRating.averageRating}</span>
                <StarDisplay rating={Math.round(driverRating.averageRating)} size={20} />
              </div>
              <div className="rating-info">
                <p className="total-reviews">
                  Based on {driverRating.totalFeedbacks} review{driverRating.totalFeedbacks !== 1 ? 's' : ''}
                </p>
                {driverRating.averageRating >= 4.5 && (
                  <div className="excellence-badge">
                    <FaTrophy /> Excellent Service
                  </div>
                )}
              </div>
            </div>
            
            <div className="rating-breakdown">
              <h4><FaChartBar /> Rating Breakdown</h4>
              <RatingDistribution distribution={driverRating.ratingDistribution} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Feedback List */}
      <div className="feedback-list">
        {feedback.length === 0 ? (
          <div className="no-feedback">
            <FaComments size={64} color="var(--gray)" />
            <h3>No feedback yet</h3>
            <p>Complete more rides to receive customer feedback</p>
          </div>
        ) : (
          <>
            {feedback.map((item, index) => (
              <motion.div
                key={item._id}
                className="feedback-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="feedback-header-card">
                  <div className="customer-info">
                    <FaUser />
                    <span>
                      {item.isAnonymous ? 'Anonymous Customer' : item.customer?.name}
                    </span>
                  </div>
                  <div className="feedback-date">
                    <FaCalendarAlt />
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                <div className="feedback-rating">
                  <StarDisplay rating={item.rating} size={18} />
                  <span className="rating-text">({item.rating}/5)</span>
                </div>

                {/* Category Ratings */}
                {Object.keys(item.categories || {}).length > 0 && (
                  <div className="category-ratings">
                    <h5>Detailed Ratings:</h5>
                    <div className="categories-grid">
                      {Object.entries(item.categories).map(([category, rating]) => (
                        <div key={category} className="category-item">
                          <span className="category-name">
                            {category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')}
                          </span>
                          <StarDisplay rating={rating} size={14} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comment */}
                {item.comment && (
                  <div className="feedback-comment">
                    <h5>Customer Comment:</h5>
                    <p>"{item.comment}"</p>
                  </div>
                )}

                {/* Ride Info */}
                <div className="ride-info">
                  <small>
                    Ride on {new Date(item.ride?.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </small>
                </div>

                {/* Admin Response */}
                {item.adminResponse && (
                  <div className="admin-response">
                    <h5>Management Response:</h5>
                    <p>{item.adminResponse.message}</p>
                    <small>
                      Responded on {new Date(item.adminResponse.respondedAt).toLocaleDateString()}
                    </small>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default DriverFeedback;
