import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaHistory, FaMapMarkerAlt, FaMapPin, FaSpinner, FaCheckCircle, FaBox, FaTruck, FaFlagCheckered, FaMapMarkedAlt, FaStar } from 'react-icons/fa';
import { deliveryAPI } from '../utils/api';
import { feedbackService } from '../utils/feedbackAPI';
import { useToast } from './Toast';
import { getVehicleIcon, getVehicleLabel } from '../utils/vehicleIcons';
import FeedbackModal from './FeedbackModal';
import '../styles/RideHistory.css';

const RideHistorySimple = ({ onSelectRideForMap }) => {
  const { showToast } = useToast();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [completingRide, setCompletingRide] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, ride: null });
  const [ridesFeedback, setRidesFeedback] = useState({});

  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  // Helper function to check if ride can be rated
  const canRateRide = (ride) => {
    if (!ride || userRole !== 'customer') return false;
    if (ride.status !== 'delivered' && ride.status !== 'parcel_delivered') return false;
    
    const localFeedback = JSON.parse(localStorage.getItem('rideFeedback') || '{}');
    return !localFeedback[ride._id];
  };

  // Helper function to check if feedback was submitted
  const hasFeedbackSubmitted = (ride) => {
    if (!ride) return false;
    const localFeedback = JSON.parse(localStorage.getItem('rideFeedback') || '{}');
    return !!localFeedback[ride._id];
  };

  const userData = getUserData();
  const userRole = userData?.role;

  // Simple fetch function
  const fetchRides = async () => {
    setLoading(true);
    
    try {
      const data = await deliveryAPI.getAll();
      const ridesArray = Array.isArray(data) ? data : [];
      setRides(ridesArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Failed to fetch rides:', error);
      setRides([]);
      showToast('Failed to load ride history', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchRides();
  }, []);

  // Simplified feedback status - no async needed since we use localStorage directly

  const checkRidesFeedbackStatus = async () => {
    const feedbackStatus = {};
    const localFeedback = JSON.parse(localStorage.getItem('rideFeedback') || '{}');
    
    for (const ride of rides) {
      if (ride.status === 'delivered') {
        // Check if feedback already exists locally
        const hasLocalFeedback = localFeedback[ride._id];
        
        if (hasLocalFeedback) {
          feedbackStatus[ride._id] = { canRate: false, alreadyRated: true };
        } else {
          try {
            const canRate = await feedbackService.canRateRide(ride._id);
            feedbackStatus[ride._id] = canRate;
          } catch (error) {
            console.log('Feedback service not available, checking local storage');
            // If feedback service is not available, check local storage and allow rating
            feedbackStatus[ride._id] = { canRate: true, alreadyRated: false };
          }
        }
      }
    }
    setRidesFeedback(feedbackStatus);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'info';
      case 'parcel_picked': return 'primary';
      case 'on_route': return 'info';
      case 'parcel_delivered': return 'success';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const handleCompleteRide = async (rideId) => {
    try {
      setCompletingRide(rideId);
      await deliveryAPI.completeRide(rideId);
      showToast('Ride completed successfully!', 'success');
      fetchRides(); // Refresh the list
    } catch (error) {
      console.error('Failed to complete ride:', error);
      showToast(error.message || 'Failed to complete ride', 'error');
    } finally {
      setCompletingRide(null);
    }
  };

  const handleStatusUpdate = async (rideId, newStatus) => {
    try {
      setCompletingRide(rideId);
      await deliveryAPI.updateStatus(rideId, newStatus);
      showToast(`Ride status updated to ${newStatus.replace('_', ' ')}!`, 'success');
      fetchRides(); // Refresh the list
    } catch (error) {
      console.error(`Failed to update ride status to ${newStatus}:`, error);
      showToast(error.message || `Failed to update ride status to ${newStatus.replace('_', ' ')}`, 'error');
    } finally {
      setCompletingRide(null);
    }
  };

  const filteredRides = rides.filter(ride => {
    if (filter === 'all') return true;
    if (filter === 'completed') return ride.status === 'delivered';
    return ride.status === filter;
  });


  if (loading) {
    return (
      <div className="ride-history-container">
        <div className="history-header">
          <h2><FaHistory /> Ride History</h2>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <FaSpinner className="spinner" size={32} />
          <p>Loading ride history...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="ride-history-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="history-header">
        <h2><FaHistory /> Ride History</h2>
        <div className="filter-buttons">
          {[
            { key: 'all', label: 'All' },
            { key: 'accepted', label: 'Accepted' },
            { key: 'parcel_picked', label: 'Picked Up' },
            { key: 'on_route', label: 'On Route' },
            { key: 'parcel_delivered', label: 'Delivered' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredRides.length === 0 ? (
        <div className="no-rides">
          <FaHistory size={64} color="var(--gray)" />
          <h3>No rides found</h3>
          <p>Your ride history will appear here</p>
        </div>
      ) : (
        <div className="rides-list">
          {filteredRides.map((ride, index) => (
            <motion.div
              key={ride._id}
              className={`ride-card ${index === 0 ? 'newest-ride' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="ride-card-header">
                <div>
                  <h3>Ride #{ride._id.slice(-8)}</h3>
                  <p className="ride-date">
                    {new Date(ride.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`badge badge-${getStatusColor(ride.status)}`}>
                  {ride.status}
                </span>
              </div>

              <div className="ride-card-body">
                <div className="location-info">
                  <div className="location-item">
                    <FaMapMarkerAlt className="location-icon pickup" />
                    <div>
                      <span className="location-label">Pickup</span>
                      <p className="location-coords">
                        {ride.pickupLocation?.address || 
                         `${ride.pickupLocation?.location?.coordinates[1]?.toFixed(4)}, ${ride.pickupLocation?.location?.coordinates[0]?.toFixed(4)}`}
                      </p>
                    </div>
                  </div>
                  <div className="location-divider"></div>
                  <div className="location-item">
                    <FaMapPin className="location-icon drop" />
                    <div>
                      <span className="location-label">Drop</span>
                      <p className="location-coords">
                        {ride.dropoffLocation?.address || 
                         `${ride.dropoffLocation?.location?.coordinates[1]?.toFixed(4)}, ${ride.dropoffLocation?.location?.coordinates[0]?.toFixed(4)}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="ride-card-footer">
                  <div className="ride-info-item">
                    <span>Vehicle Type</span>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {(() => {
                        const VehicleIcon = getVehicleIcon(ride.vehicleType);
                        return <VehicleIcon size={20} />;
                      })()}
                      {getVehicleLabel(ride.vehicleType)}
                    </strong>
                  </div>
                  <div className="ride-info-item">
                    <span>Distance</span>
                    <strong>{ride.distance} km</strong>
                  </div>
                  <div className="ride-info-item">
                    <span>Fare</span>
                    <strong>₹{ride.fare}</strong>
                  </div>
                  {ride.driver && (
                    <div className="ride-info-item">
                      <span>Driver</span>
                      <strong>{ride.driver.name}</strong>
                    </div>
                  )}
                </div>

                {/* Status Update Buttons for Drivers */}
                {userRole === 'driver' && ride.driver && ride.driver._id === userData?.id && (
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {ride.status === 'accepted' && (
                      <motion.button
                        className="btn btn-primary"
                        onClick={() => handleStatusUpdate(ride._id, 'parcel_picked')}
                        disabled={completingRide === ride._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {completingRide === ride._id ? (
                          <>
                            <FaSpinner className="spinner" /> Updating...
                          </>
                        ) : (
                          <>
                            <FaBox /> Pick Up Parcel
                          </>
                        )}
                      </motion.button>
                    )}

                    {ride.status === 'parcel_picked' && (
                      <motion.button
                        className="btn btn-info"
                        onClick={() => handleStatusUpdate(ride._id, 'on_route')}
                        disabled={completingRide === ride._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {completingRide === ride._id ? (
                          <>
                            <FaSpinner className="spinner" /> Updating...
                          </>
                        ) : (
                          <>
                            <FaTruck /> Start Journey
                          </>
                        )}
                      </motion.button>
                    )}

                    {ride.status === 'on_route' && (
                      <motion.button
                        className="btn btn-warning"
                        onClick={() => handleStatusUpdate(ride._id, 'parcel_delivered')}
                        disabled={completingRide === ride._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {completingRide === ride._id ? (
                          <>
                            <FaSpinner className="spinner" /> Updating...
                          </>
                        ) : (
                          <>
                            <FaFlagCheckered /> Deliver Parcel
                          </>
                        )}
                      </motion.button>
                    )}

                    {(ride.status === 'parcel_delivered') && (
                      <motion.button
                        className="btn btn-success"
                        onClick={() => handleCompleteRide(ride._id)}
                        disabled={completingRide === ride._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {completingRide === ride._id ? (
                          <>
                            <FaSpinner className="spinner" /> Completing...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle /> Complete Ride
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Feedback Button for Customers - Always Persistent */}
                {canRateRide(ride) && (
                  <motion.button
                    className="btn btn-warning"
                    onClick={() => setFeedbackModal({ isOpen: true, ride })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      marginTop: '1rem',
                      background: 'linear-gradient(135deg, #ffc107 0%, #ff8c00 100%)',
                      border: 'none',
                      color: 'white',
                      fontWeight: '500',
                      padding: '0.75rem 1rem',
                      borderRadius: '6px'
                    }}
                  >
                    <FaStar /> Rate This Ride
                  </motion.button>
                )}

                {/* Feedback Submitted Status */}
                {hasFeedbackSubmitted(ride) && (
                  <div style={{ 
                    marginTop: '1rem',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    color: '#28a745',
                    fontWeight: '500',
                    padding: '0.5rem',
                    background: '#d4edda',
                    borderRadius: '6px',
                    border: '1px solid #c3e6cb'
                  }}>
                    <FaStar style={{ color: '#ffc107' }} /> Feedback Submitted ✓
                  </div>
                )}


                {/* View on Map button for all users */}
                {onSelectRideForMap && (
                  <motion.button
                    className="btn btn-secondary"
                    onClick={() => onSelectRideForMap(ride)}
                    style={{ marginTop: '1rem' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaMapMarkedAlt /> View on Map
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ isOpen: false, ride: null })}
        ride={feedbackModal.ride}
        onFeedbackSubmitted={() => {
          // Force component re-render to update button states
          setRides(prev => [...prev]);
        }}
      />
    </motion.div>
  );
};

export default RideHistorySimple;
