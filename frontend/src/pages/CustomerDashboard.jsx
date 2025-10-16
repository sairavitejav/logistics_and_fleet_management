import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaCar, FaHistory, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BookRide from '../components/BookRide';
import RideTracking from '../components/RideTracking';
import RideHistorySimple from '../components/RideHistorySimple';
import '../styles/Dashboard.css';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('book');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'book', label: 'Book Ride', icon: <FaMapMarkerAlt /> },
    { id: 'track', label: 'Track Ride', icon: <FaCar /> },
    { id: 'history', label: 'History', icon: <FaHistory /> }
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
            <span>RideBook</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
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
          <h1>Welcome back, {user?.name}! 👋</h1>
          <p>Ready for your next journey?</p>
        </motion.div>

        <div className="dashboard-content">
          {activeTab === 'book' && <BookRide onBookingSuccess={() => setActiveTab('track')} />}
          {activeTab === 'track' && <RideTracking />}
          {activeTab === 'history' && <RideHistorySimple />}
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;