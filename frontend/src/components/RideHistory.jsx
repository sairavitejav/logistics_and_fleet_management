import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaHistory, FaMapMarkerAlt, FaMapPin, FaSpinner, FaCheckCircle, FaBox, FaTruck, FaFlagCheckered } from 'react-icons/fa';
import { deliveryAPI } from '../utils/api';
import { useToast } from './Toast'; // ✨ Added Toast
import { ListSkeleton } from './LoadingSkeleton'; // ✨ Added LoadingSkeleton
import { getVehicleIcon, getVehicleLabel } from '../utils/vehicleIcons'; // 🔥 NEW: Dynamic vehicle icons
import '../styles/RideHistory.css';

const RideHistory = () => {
  const { showToast } = useToast(); // ✨ Initialize Toast
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [completingRide, setCompletingRide] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const userRole = JSON.parse(localStorage.getItem('user'))?.role;
  const containerRef = useRef(null);

  useEffect(() => {
    fetchRides();
  }, [refreshTrigger]);

  // Refresh rides when component mounts (navigated to)
  useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
    // Scroll to top when component mounts
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const fetchRides = async () => {
    try {
      const data = await deliveryAPI.getAll();
      setRides(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Failed to fetch rides:', error);
      showToast('Failed to load ride history', 'error'); // ✨ Toast notification
    } finally {
      setLoading(false);
    }
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
    return ( // ✨ Replaced with ListSkeleton
      <div className="ride-history-container">
        <div className="history-header">
          <h2><FaHistory /> Ride History</h2>
        </div>
        <ListSkeleton count={5} />
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      className="ride-history-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="history-header">
        <h2><FaHistory /> Ride History</h2>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'accepted' ? 'active' : ''}`}
            onClick={() => setFilter('accepted')}
          >
            Accepted
          </button>
          <button
            className={`filter-btn ${filter === 'parcel_picked' ? 'active' : ''}`}
            onClick={() => setFilter('parcel_picked')}
          >
            Picked Up
          </button>
          <button
            className={`filter-btn ${filter === 'on_route' ? 'active' : ''}`}
            onClick={() => setFilter('on_route')}
          >
            On Route
          </button>
          <button
            className={`filter-btn ${filter === 'parcel_delivered' ? 'active' : ''}`}
            onClick={() => setFilter('parcel_delivered')}
          >
            Delivered
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button
            className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </button>
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

                {/* 🔥 NEW: Status Update Buttons for Drivers */}
                {userRole === 'driver' && ride.driver && ride.driver._id === JSON.parse(localStorage.getItem('user')).id && (
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
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default RideHistory;