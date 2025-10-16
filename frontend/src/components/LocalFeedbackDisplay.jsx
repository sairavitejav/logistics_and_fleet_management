import { useState, useEffect } from 'react';
import { FaStar, FaUser, FaCalendarAlt, FaComments } from 'react-icons/fa';
import { motion } from 'framer-motion';

const LocalFeedbackDisplay = () => {
  const [localFeedback, setLocalFeedback] = useState({});

  useEffect(() => {
    const feedback = JSON.parse(localStorage.getItem('rideFeedback') || '{}');
    setLocalFeedback(feedback);
  }, []);

  const StarDisplay = ({ rating }) => (
    <div className="star-display">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          className={star <= rating ? 'star-filled' : 'star-empty'}
          style={{ color: star <= rating ? '#ffc107' : '#e0e0e0' }}
        />
      ))}
    </div>
  );

  const feedbackEntries = Object.entries(localFeedback);

  if (feedbackEntries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
        <FaComments size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h3>No feedback submitted yet</h3>
        <p>Complete rides and submit feedback to see them here</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FaComments /> My Submitted Feedback
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {feedbackEntries.map(([rideId, feedback], index) => (
          <motion.div
            key={rideId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <FaUser style={{ color: '#666' }} />
                  <span style={{ color: '#666' }}>
                    Driver: {feedback.driverName || 'Unknown'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaCalendarAlt style={{ color: '#666' }} />
                  <span style={{ color: '#666', fontSize: '0.9rem' }}>
                    {new Date(feedback.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <StarDisplay rating={feedback.rating} />
                  <span style={{ fontWeight: 'bold', color: '#333' }}>
                    ({feedback.rating}/5)
                  </span>
                </div>
                {feedback.isAnonymous && (
                  <span style={{ 
                    fontSize: '0.8rem', 
                    color: '#666',
                    background: '#f0f0f0',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px'
                  }}>
                    Anonymous
                  </span>
                )}
              </div>
            </div>

            {feedback.comment && (
              <div style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '8px',
                borderLeft: '4px solid #667eea'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#333', fontSize: '0.9rem' }}>
                  Your Comment:
                </h5>
                <p style={{ margin: 0, fontStyle: 'italic', color: '#555', lineHeight: 1.5 }}>
                  "{feedback.comment}"
                </p>
              </div>
            )}

            <div style={{ 
              marginTop: '1rem', 
              paddingTop: '1rem', 
              borderTop: '1px solid #e0e0e0',
              fontSize: '0.8rem',
              color: '#666'
            }}>
              Ride ID: {rideId}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LocalFeedbackDisplay;
