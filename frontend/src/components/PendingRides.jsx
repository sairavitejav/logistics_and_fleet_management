import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaList, FaMapMarkerAlt, FaMapPin, FaCheck, FaSpinner, FaCar } from 'react-icons/fa';
import { deliveryAPI, vehicleAPI } from '../utils/api';
import { getSocket } from '../utils/socket';
import { useToast } from './Toast'; // ✨ Added Toast notification
import { ListSkeleton } from './LoadingSkeleton'; // ✨ Added Loading Skeleton
import { getVehicleIcon, getVehicleLabel } from '../utils/vehicleIcons'; // 🔥 NEW: Dynamic vehicle icons
import '../styles/PendingRides.css';

const PendingRides = ({ onRideAccepted }) => {
  const { showToast } = useToast(); // ✨ Initialize toast hook
  const [pendingRides, setPendingRides] = useState([]);
  const [myVehicles, setMyVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingRide, setAcceptingRide] = useState(null);

  useEffect(() => {
    fetchData();
    setupSocketListeners();

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('new_ride_request'); // 🔥 FIXED: Match backend event name
      }
    };
  }, []);

  const fetchData = async () => {
    try {
      const [rides, vehicles] = await Promise.all([
        deliveryAPI.getPending(), // 🔥 FIXED: Use correct API method
        vehicleAPI.getAll()
      ]);
      setPendingRides(rides);
      setMyVehicles(vehicles.filter(v => v.approvalStatus === 'approved'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('Failed to load rides', 'error'); // ✨ Toast notification
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    // 🔥 FIXED: Match backend event name (with underscore)
    socket.on('new_ride_request', (ride) => {
      setPendingRides(prev => [ride, ...prev]);
      showToast('New ride request available!', 'info'); // ✨ Toast notification
    });
  };

  const handleAcceptRide = async (rideId) => {
    if (myVehicles.length === 0) {
      showToast('You need an approved vehicle to accept rides', 'warning'); // ✨ Toast notification
      return;
    }

    setAcceptingRide(rideId);
    try {
      await deliveryAPI.acceptRide(rideId, myVehicles[0]._id);
      setPendingRides(prev => prev.filter(r => r._id !== rideId));
      showToast('Ride accepted successfully!', 'success'); // ✨ Toast notification
      
      // Navigate to History tab after successful acceptance
      if (onRideAccepted) {
        onRideAccepted();
      }
    } catch (error) {
      console.error('Failed to accept ride:', error);
      showToast(error.message || 'Failed to accept ride', 'error'); // ✨ Toast notification
    } finally {
      setAcceptingRide(null);
    }
  };

  if (loading) {
    return <ListSkeleton count={3} />; // ✨ Loading Skeleton
  }

  if (myVehicles.length === 0) {
    return (
      <motion.div
        className="no-vehicle-warning"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <FaCar size={64} color="var(--warning)" />
        <h2>No Approved Vehicle</h2>
        <p>You need to add and get approval for a vehicle before accepting rides</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="pending-rides-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="pending-header">
        <h2><FaList /> Available Rides</h2>
        <span className="ride-count">{pendingRides.length} rides available</span>
      </div>

      {pendingRides.length === 0 ? (
        <div className="no-rides">
          <FaList size={64} color="var(--gray)" />
          <h3>No rides available</h3>
          <p>New ride requests will appear here</p>
        </div>
      ) : (
        <div className="rides-grid">
          <AnimatePresence>
            {pendingRides.map((ride, index) => (
              <motion.div
                key={ride._id}
                className="pending-ride-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                layout
              >
                <div className="ride-badge">
                  <span className="badge badge-warning">New Request</span>
                </div>

                <div className="ride-locations">
                  <div className="location-row">
                    <FaMapMarkerAlt className="location-icon pickup" />
                    <div>
                      <span className="location-label">Pickup</span>
                      <p className="location-coords">
                        {ride.pickupLocation?.address || 
                         `${ride.pickupLocation?.location?.coordinates[1]?.toFixed(4)}, ${ride.pickupLocation?.location?.coordinates[0]?.toFixed(4)}`}
                      </p>
                    </div>
                  </div>

                  <div className="location-arrow">↓</div>

                  <div className="location-row">
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

                <div className="ride-details-grid">
                  <div className="detail-box">
                    <span>Vehicle Type</span>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {(() => {
                        const VehicleIcon = getVehicleIcon(ride.vehicleType);
                        return <VehicleIcon size={20} />;
                      })()}
                      {getVehicleLabel(ride.vehicleType)}
                    </strong>
                  </div>
                  <div className="detail-box">
                    <span>Distance</span>
                    <strong>{ride.distance} km</strong>
                  </div>
                  <div className="detail-box">
                    <span>Fare</span>
                    <strong className="fare-amount">₹{ride.fare}</strong>
                  </div>
                  <div className="detail-box">
                    <span>Customer</span>
                    <strong>{ride.customer?.name || 'N/A'}</strong>
                  </div>
                </div>

                <motion.button
                  className="btn btn-success btn-block"
                  onClick={() => handleAcceptRide(ride._id)}
                  disabled={acceptingRide === ride._id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {acceptingRide === ride._id ? (
                    <>
                      <FaSpinner className="spin" /> Accepting...
                    </>
                  ) : (
                    <>
                      <FaCheck /> Accept Ride
                    </>
                  )}
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default PendingRides;