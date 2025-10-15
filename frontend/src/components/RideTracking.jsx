import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkedAlt, FaSpinner, FaCar, FaPhone, FaTimes, FaClock } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { deliveryAPI } from '../utils/api';
import { getSocket } from '../utils/socket';
import { useToast } from './Toast';
import { MapSkeleton } from './LoadingSkeleton';
import 'leaflet/dist/leaflet.css';
import '../styles/RideTracking.css';

const RideTracking = () => {
  const { showToast } = useToast();
  const [activeRide, setActiveRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [hasShownExpirationToast, setHasShownExpirationToast] = useState(false);
  const isFirstTimerCheck = useRef(true);

  useEffect(() => {
    fetchActiveRide();
    setupSocketListeners();

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('rideAccepted');
        socket.off('rideStatusUpdated');
        socket.off('driverLocationUpdated');
        socket.off('rideCompleted');
        socket.off('ride_expired');
      }
    };
  }, []);

  // 🔥 NEW: Timer countdown for pending rides
  useEffect(() => {
    if (!activeRide || activeRide.status !== 'pending' || !activeRide.expiresAt) {
      setTimeRemaining(null);
      setHasShownExpirationToast(false); // Reset flag when ride changes
      isFirstTimerCheck.current = true; // Reset first check flag
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiryTime = new Date(activeRide.expiresAt).getTime();
      const remaining = Math.max(0, expiryTime - now);

      if (remaining === 0 && !hasShownExpirationToast) {
        // Only show toast if this isn't the first check (i.e., timer actually expired during countdown)
        if (!isFirstTimerCheck.current) {
          setTimeRemaining(0);
          setActiveRide(null);
          setHasShownExpirationToast(true); // Mark that we've shown the toast
          showToast('No driver accepted your ride. Please try again.', 'warning');
        } else {
          // First check and already expired - don't show toast, just set to null
          setTimeRemaining(0);
          setActiveRide(null);
        }
      } else {
        setTimeRemaining(remaining);
        if (remaining > 0) {
          setHasShownExpirationToast(false); // Reset flag if timer is still running
        }
      }

      // Mark that we've done the first check
      isFirstTimerCheck.current = false;
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeRide, hasShownExpirationToast]);

  const fetchActiveRide = async () => {
    try {
      const rides = await deliveryAPI.getAll();
      const active = rides.find(r => 
        r.status === 'pending' || r.status === 'accepted' || r.status === 'parcel_picked' || r.status === 'on_route' || r.status === 'parcel_delivered'
      );
      setActiveRide(active);
      isFirstTimerCheck.current = true; // Reset first check flag for new ride
      
      if (active?.driver?.currentLocation) {
        setDriverLocation([
          active.driver.currentLocation.coordinates[1],
          active.driver.currentLocation.coordinates[0]
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch active ride:', error);
      showToast('Failed to load ride information', 'error'); // ✨ Toast notification
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) {
      console.warn('⚠️ Socket not available in RideTracking');
      return;
    }

    console.log('🔌 Setting up socket listeners in RideTracking');

    socket.on('rideAccepted', (data) => {
      console.log('🚕 Ride accepted:', data);
      setActiveRide(data.ride);
      setHasShownExpirationToast(false); // Reset flag when ride is accepted
      if (data.ride.driver?.currentLocation) {
        setDriverLocation([
          data.ride.driver.currentLocation.coordinates[1],
          data.ride.driver.currentLocation.coordinates[0]
        ]);
      }
    });

    socket.on('rideStatusUpdated', (data) => {
      console.log('🔄 Ride status updated:', data);
      setActiveRide(data.ride);
    });

    socket.on('driverLocationUpdated', (data) => {
      setDriverLocation([data.location.coordinates[1], data.location.coordinates[0]]);
    });

    // 🔥 NEW: Listen for ride completion
    socket.on('rideCompleted', (data) => {
      showToast('Your ride has been completed!', 'success');
      setActiveRide(null);
    });

    // 🔥 NEW: Listen for ride expiration
    socket.on('ride_expired', (data) => {
      showToast(data.message || 'No driver accepted your ride. Please try again.', 'warning');
      setActiveRide(null);
      setTimeRemaining(null);
      setHasShownExpirationToast(false); // Reset flag for next ride
    });
  };

  const handleCancelRide = async () => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) {
      return;
    }

    try {
      setCancelling(true);
      await deliveryAPI.cancelRide(activeRide._id);
      showToast('Ride cancelled successfully', 'success');
      setActiveRide(null);
      setTimeRemaining(null);
      setHasShownExpirationToast(false); // Reset flag for next ride
    } catch (error) {
      console.error('Failed to cancel ride:', error);
      showToast(error.message || 'Failed to cancel ride', 'error');
    } finally {
      setCancelling(false);
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
      case 'expired': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Searching for driver...';
      case 'accepted': return 'Driver accepted your ride';
      case 'parcel_picked': return 'Driver picked up your parcel';
      case 'on_route': return 'Driver is on the way';
      case 'parcel_delivered': return 'Driver delivered your parcel';
      case 'delivered': return 'Ride completed';
      case 'cancelled': return 'Ride cancelled';
      case 'expired': return 'Request expired';
      default: return status;
    }
  };

  // 🔥 NEW: Format time remaining
  const formatTimeRemaining = (ms) => {
    if (!ms) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <MapSkeleton />; // ✨ Replaced with MapSkeleton
  }

  if (!activeRide) {
    return (
      <motion.div
        className="no-ride-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <FaCar size={64} color="var(--gray)" />
        <h2>No Active Ride</h2>
        <p>You don't have any active rides at the moment</p>
      </motion.div>
    );
  }

  const pickupCoords = [
    activeRide.pickupLocation?.location?.coordinates[1],
    activeRide.pickupLocation?.location?.coordinates[0]
  ];
  const dropCoords = [
    activeRide.dropoffLocation?.location?.coordinates[1],
    activeRide.dropoffLocation?.location?.coordinates[0]
  ];

  return (
    <motion.div
      className="ride-tracking-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="tracking-header">
        <h2><FaMapMarkedAlt /> Track Your Ride</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* 🔥 NEW: Timer for pending rides */}
          {activeRide.status === 'pending' && timeRemaining !== null && (
            <motion.div
              className="timer-badge"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              style={{
                background: timeRemaining < 60000 ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' : 'linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <FaClock /> {formatTimeRemaining(timeRemaining)}
            </motion.div>
          )}
          <span className={`badge badge-${getStatusColor(activeRide.status)}`}>
            {getStatusText(activeRide.status)}
          </span>
          {/* 🔥 NEW: Cancel Ride Button (only for pending/accepted/parcel_picked/on_route/parcel_delivered status) */}
          {(activeRide.status === 'pending' || activeRide.status === 'accepted' || activeRide.status === 'parcel_picked' || activeRide.status === 'on_route' || activeRide.status === 'parcel_delivered') && (
            <motion.button
              className="btn btn-danger"
              onClick={handleCancelRide}
              disabled={cancelling}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cancelling ? (
                <>
                  <FaSpinner className="spinner" /> Cancelling...
                </>
              ) : (
                <>
                  <FaTimes /> Cancel Ride
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      <div className="tracking-content">
        <div className="map-container">
          <MapContainer
            center={pickupCoords}
            zoom={13}
            style={{ height: '500px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {/* Pickup Marker */}
            <Marker position={pickupCoords}>
              <Popup>Pickup Location</Popup>
            </Marker>

            {/* Drop Marker */}
            <Marker position={dropCoords}>
              <Popup>Drop Location</Popup>
            </Marker>

            {/* Driver Location */}
            {driverLocation && (
              <Marker position={driverLocation}>
                <Popup>Driver Location</Popup>
              </Marker>
            )}

            {/* Route Line */}
            {driverLocation && (
              <Polyline
                positions={[driverLocation, pickupCoords, dropCoords]}
                color="var(--primary)"
                weight={3}
              />
            )}
          </MapContainer>
        </div>

        <div className="ride-details">
          <div className="detail-card">
            <h3>Ride Information</h3>
            <div className="detail-item">
              <span>Ride ID:</span>
              <strong>#{activeRide._id.slice(-8)}</strong>
            </div>
            <div className="detail-item">
              <span>Distance:</span>
              <strong>{activeRide.distance} km</strong>
            </div>
            <div className="detail-item">
              <span>Fare:</span>
              <strong>₹{activeRide.fare}</strong>
            </div>
            <div className="detail-item">
              <span>Status:</span>
              <span className={`badge badge-${getStatusColor(activeRide.status)}`}>
                {activeRide.status}
              </span>
            </div>
          </div>

          {activeRide.driver && (
            <div className="detail-card driver-card">
              <h3>Driver Details</h3>
              <div className="driver-info">
                <div className="driver-avatar">
                  <FaCar />
                </div>
                <div>
                  <h4>{activeRide.driver.name}</h4>
                  <p>{activeRide.driver.phone}</p>
                </div>
              </div>
              {activeRide.vehicle && (
                <div className="vehicle-info">
                  <p><strong>Vehicle:</strong> {activeRide.vehicle.make} {activeRide.vehicle.model}</p>
                  <p><strong>Number:</strong> {activeRide.vehicle.licensePlate}</p>
                  <p><strong>Type:</strong> {activeRide.vehicle.type}</p>
                </div>
              )}
              <motion.button
                className="btn btn-primary btn-block"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaPhone /> Call Driver
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RideTracking;