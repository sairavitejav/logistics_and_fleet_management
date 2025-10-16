import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaUser, FaCalendarAlt, FaComments, FaFilter, FaReply, FaChartBar } from 'react-icons/fa';
import { feedbackService } from '../utils/feedbackAPI';
import { useToast } from './Toast';
import { ListSkeleton } from './LoadingSkeleton';
import '../styles/AdminFeedback.css';

const AdminFeedback = () => {
  const { showToast } = useToast();
  const [feedback, setFeedback] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    rating: '',
    driverId: ''
  });
  const [responseModal, setResponseModal] = useState({ isOpen: false, feedbackId: null });
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    fetchAllFeedback();
  }, [currentPage, filters]);

  const fetchAllFeedback = async () => {
    try {
      setLoading(true);
      const response = await feedbackService.getAllFeedback(currentPage, 20, filters);
      setFeedback(response.feedback);
      setAnalytics(response.analytics);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Admin feedback fetch error:', error);
      if (error.message.includes('404') || error.message.includes('Failed to fetch')) {
        showToast('Feedback system is currently being deployed. Please check back in a few minutes.', 'info');
      } else {
        showToast('Failed to load feedback', 'error');
      }
      // Set empty state for graceful degradation
      setFeedback([]);
      setAnalytics({ averageRating: 0, totalFeedbacks: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleRespondToFeedback = async () => {
    if (!responseText.trim()) {
      showToast('Please enter a response message', 'error');
      return;
    }

    try {
      setSubmittingResponse(true);
      await feedbackService.respondToFeedback(responseModal.feedbackId, responseText);
      showToast('Response sent successfully', 'success');
      setResponseModal({ isOpen: false, feedbackId: null });
      setResponseText('');
      fetchAllFeedback(); // Refresh data
    } catch (error) {
      showToast(error.message || 'Failed to send response', 'error');
    } finally {
      setSubmittingResponse(false);
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

  const AnalyticsCard = ({ analytics }) => (
    <div className="analytics-card">
      <h3><FaChartBar /> Feedback Analytics</h3>
      <div className="analytics-grid">
        <div className="metric">
          <span className="metric-value">{analytics.averageRating}</span>
          <span className="metric-label">Average Rating</span>
          <StarDisplay rating={Math.round(analytics.averageRating)} size={18} />
        </div>
        <div className="metric">
          <span className="metric-value">{analytics.totalFeedbacks}</span>
          <span className="metric-label">Total Reviews</span>
        </div>
        <div className="rating-distribution-admin">
          <h4>Rating Distribution</h4>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = analytics.ratingDistribution[rating] || 0;
            const percentage = analytics.totalFeedbacks > 0 ? (count / analytics.totalFeedbacks) * 100 : 0;
            
            return (
              <div key={rating} className="rating-bar-admin">
                <span>{rating} <FaStar className="small-star" /></span>
                <div className="bar-container-admin">
                  <div className="bar-fill-admin" style={{ width: `${percentage}%` }}></div>
                </div>
                <span>({count})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="admin-feedback-container">
        <div className="feedback-header">
          <h2><FaComments /> Customer Feedback Management</h2>
        </div>
        <ListSkeleton count={5} />
      </div>
    );
  }

  return (
    <motion.div
      className="admin-feedback-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="feedback-header">
        <h2><FaComments /> Customer Feedback Management</h2>
      </div>

      {/* Analytics */}
      {analytics && <AnalyticsCard analytics={analytics} />}

      {/* Filters */}
      <div className="filters-section">
        <h3><FaFilter /> Filters</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="feedback-list">
        {feedback.length === 0 ? (
          <div className="no-feedback">
            <FaComments size={64} color="var(--gray)" />
            <h3>No feedback found</h3>
            <p>No feedback matches the current filters</p>
          </div>
        ) : (
          <>
            {feedback.map((item, index) => (
              <motion.div
                key={item._id}
                className="admin-feedback-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="feedback-card-header">
                  <div className="customer-driver-info">
                    <div className="info-item">
                      <FaUser />
                      <span>Customer: {item.isAnonymous ? 'Anonymous' : item.customer?.name}</span>
                    </div>
                    <div className="info-item">
                      <FaUser />
                      <span>Driver: {item.driver?.name}</span>
                    </div>
                  </div>
                  <div className="feedback-date">
                    <FaCalendarAlt />
                    <span>
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="feedback-rating">
                  <StarDisplay rating={item.rating} size={20} />
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

                {/* Admin Response */}
                {item.adminResponse ? (
                  <div className="admin-response">
                    <h5>Management Response:</h5>
                    <p>{item.adminResponse.message}</p>
                    <small>
                      Responded on {new Date(item.adminResponse.respondedAt).toLocaleDateString()}
                    </small>
                  </div>
                ) : (
                  <div className="response-actions">
                    <button
                      className="respond-btn"
                      onClick={() => setResponseModal({ isOpen: true, feedbackId: item._id })}
                    >
                      <FaReply /> Respond to Customer
                    </button>
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

      {/* Response Modal */}
      {responseModal.isOpen && (
        <div className="modal-overlay" onClick={() => setResponseModal({ isOpen: false, feedbackId: null })}>
          <div className="response-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Respond to Customer Feedback</h3>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Enter your response to the customer..."
              rows={4}
              maxLength={500}
            />
            <div className="char-count">{responseText.length}/500</div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setResponseModal({ isOpen: false, feedbackId: null })}
                disabled={submittingResponse}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRespondToFeedback}
                disabled={submittingResponse || !responseText.trim()}
              >
                {submittingResponse ? 'Sending...' : 'Send Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminFeedback;
