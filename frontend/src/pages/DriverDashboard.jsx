import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCar, FaList, FaHistory, FaUser, FaSignOutAlt, FaToggleOn, FaToggleOff, FaBars, FaTimes, FaMapMarkedAlt, FaMapMarkerAlt, FaMapPin } from 'react-icons/fa';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DriverVehicles from '../components/DriverVehicles';
import PendingRides from '../components/PendingRides';
import RideHistorySimple from '../components/RideHistorySimple';
import RideMapView from '../components/RideMapView';
import DriverFeedback from '../components/DriverFeedback';
import { deliveryAPI } from '../utils/api';
import { useToast } from '../components/Toast'; // ✨ Added Toast
import '../styles/Dashboard.css';

const DriverDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { showToast } = useToast(); // ✨ Initialize Toast
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rides');
  const [driverStatus, setDriverStatus] = useState(user?.driverStatus || 'offline');
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedRideForMap, setSelectedRideForMap] = useState(null);
  const [recentRides, setRecentRides] = useState([]);

  // Load recent rides when component mounts
  useEffect(() => {
    const loadRecentRides = async () => {
      try {
        const rides = await deliveryAPI.getAll();
        // Filter for completed rides and sort by most recent
        const completedRides = rides
          .filter(ride => ride.status === 'delivered' || ride.status === 'completed')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5); // Show only 5 most recent
        setRecentRides(completedRides);
      } catch (error) {
        console.error('Failed to load recent rides:', error);
      }
    };

    if (user?.role === 'driver' && user?.id) {
      loadRecentRides();
    }
  }, [user]);

  const handleSelectRideForMap = (ride) => {
    setSelectedRideForMap(ride);
    setActiveTab('map');
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Clear selected ride when switching away from map tab
    if (tabId !== 'map') {
      setSelectedRideForMap(null);
    }
  };

  useEffect(() => {
    // Check if driver has ongoing rides and navigate to history if so
    const checkOngoingRides = async () => {
      try {
        console.log('🔍 Checking ongoing rides for driver:', user?.id, 'Role:', user?.role);

        if (!user?.id || user?.role !== 'driver') {
          console.log('⚠️ User not ready or not a driver');
          return;
        }

        console.log('🔐 Making API call to get deliveries...');
        const rides = await deliveryAPI.getAll();
        console.log('📋 Found rides:', rides.length);

        if (!Array.isArray(rides)) {
          console.error('❌ API returned non-array data:', rides);
          return;
        }

        const ongoingRide = rides.find(r =>
          r.driver === user.id &&
          !['delivered', 'cancelled'].includes(r.status)
        );

        if (ongoingRide) {
          console.log('🚗 Found ongoing ride:', ongoingRide.status, '- navigating to history');
          setActiveTab('history');
        } else {
          console.log('✅ No ongoing rides found');
        }
      } catch (error) {
        console.error('❌ Failed to check ongoing rides:', error);

        // Check if it's an authentication error
        if (error.message?.includes('Session expired') || error.message?.includes('401')) {
          console.log('🔐 Authentication error - redirecting to login');
          // Don't show error toast as this might cause a loop
          return;
        }

        // For other errors, silently fail and stay on rides tab
        console.log('⚠️ API call failed, staying on rides tab');
      }
    };

    if (user?.role === 'driver' && user?.id) {
      // Add a small delay to ensure user is fully loaded
      setTimeout(checkOngoingRides, 100);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDriverStatus = async () => {
    setLoading(true);
    try {
      const newStatus = driverStatus === 'online' ? 'offline' : 'online';
      await deliveryAPI.updateDriverStatus(newStatus);
      setDriverStatus(newStatus);
      updateUser({ ...user, driverStatus: newStatus });
      showToast(`You are now ${newStatus}`, 'success'); // ✨ Toast notification
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast(error.message || 'Failed to update status', 'error'); // 
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'rides', label: 'Available Rides', icon: <FaList /> },
    { id: 'vehicles', label: 'Statistics', icon: <FaCar /> },
    { id: 'history', label: 'History', icon: <FaHistory /> },
    { id: 'feedback', label: 'My Ratings', icon: <FaUser /> },
    { id: 'map', label: 'Map View', icon: <FaMapMarkedAlt /> }
  ];

  return (
    <div className="dashboard-container">
      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="mobile-overlay active"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <FaCar className="logo-icon" />
            <span>RideBook Driver</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                handleTabChange(tab.id);
                setIsMobileMenuOpen(false); // Close mobile menu when tab is selected
              }}
              whileHover={{ x: 10 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="driver-status-toggle">
            <motion.button
              className={`status-btn ${driverStatus === 'online' ? 'online' : 'offline'}`}
              onClick={toggleDriverStatus}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {driverStatus === 'online' ? <FaToggleOn /> : <FaToggleOff />}
              <span>{driverStatus === 'online' ? 'Online' : 'Offline'}</span>
            </motion.button>
          </div>

          <div className="user-info">
            <div className="user-avatar">
              <FaUser />
            </div>
            <div className="user-details">
              <h4>{user?.name}</h4>
              <p>{user?.email}</p>
            </div>
          </div>
          <motion.button
            className="btn btn-danger btn-logout"
            onClick={() => {
              handleLogout();
              setIsMobileMenuOpen(false); // Close mobile menu on logout
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaSignOutAlt /> Logout
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <motion.div
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1>Welcome, {user?.name}! 🚗</h1>
          <p>
            Status: <span className={`badge badge-${driverStatus === 'online' ? 'success' : 'danger'}`}>
              {driverStatus}
            </span>
          </p>
        </motion.div>

        <div className="dashboard-content">
          {activeTab === 'rides' && <PendingRides onRideAccepted={() => handleTabChange('history')} />}
          {activeTab === 'vehicles' && <DriverVehicles />}
          {activeTab === 'history' && <RideHistorySimple onSelectRideForMap={handleSelectRideForMap} />}
          {activeTab === 'feedback' && <DriverFeedback />}
          {activeTab === 'map' && (
            <div>
              {selectedRideForMap ? (
                <RideMapView ride={selectedRideForMap} showDriverLocation={false} />
              ) : (
                <motion.div
                  className="map-recent-rides"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="recent-rides-header">
                    <h2><FaMapMarkedAlt /> Select a Ride to View on Map</h2>
                    <p>Choose from your recent completed rides below</p>
                  </div>

                  {recentRides.length === 0 ? (
                    <div className="no-recent-rides">
                      <FaMapMarkedAlt size={48} color="var(--gray)" />
                      <h3>No Recent Rides</h3>
                      <p>Complete some rides to see them here for map viewing</p>
                    </div>
                  ) : (
                    <div className="recent-rides-list">
                      {recentRides.map((ride) => (
                        <motion.div
                          key={ride._id}
                          className="recent-ride-card"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="ride-info">
                            <h4>Ride #{ride._id.slice(-8)}</h4>
                            <p className="ride-date">
                              {new Date(ride.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <div className="ride-locations">
                              <span className="location-item">
                                <FaMapMarkerAlt className="location-icon pickup" />
                                <span className="location-text">
                                  {ride.pickupLocation?.address?.split(',')[0] || 'Pickup Location'}
                                </span>
                              </span>
                              <span className="location-item">
                                <FaMapPin className="location-icon drop" />
                                <span className="location-text">
                                  {ride.dropoffLocation?.address?.split(',')[0] || 'Drop Location'}
                                </span>
                              </span>
                            </div>
                          </div>
                          <motion.button
                            className="btn btn-primary view-map-btn"
                            onClick={() => handleSelectRideForMap(ride)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FaMapMarkedAlt /> View on Map
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;