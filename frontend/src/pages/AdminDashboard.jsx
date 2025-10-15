import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCar, FaUsers, FaClipboardList, FaUser, FaSignOutAlt, FaChartLine, FaBell, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { vehicleAPI } from '../utils/api';
import AdminVehicles from '../components/AdminVehicles';
import AdminUsers from '../components/AdminUsers';
import AdminRides from '../components/AdminRides';
import AdminStats from '../components/AdminStats';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🔥 NEW: Check for pending vehicle approvals on mount
  useEffect(() => {
    const checkPendingApprovals = async () => {
      try {
        const vehicles = await vehicleAPI.getAll();
        const pendingCount = vehicles.filter(v => v.approvalStatus === 'pending').length;
        setPendingApprovalsCount(pendingCount);
        
        // 🔥 Auto-route to vehicles tab if there are pending approvals
        if (pendingCount > 0) {
          setActiveTab('vehicles');
        }
      } catch (error) {
        console.error('Failed to check pending approvals:', error);
      }
    };

    checkPendingApprovals();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'stats', label: 'Statistics', icon: <FaChartLine /> },
    { id: 'vehicles', label: 'Vehicles', icon: <FaCar /> },
    { id: 'users', label: 'Users', icon: <FaUsers /> },
    { id: 'rides', label: 'All Rides', icon: <FaClipboardList /> }
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
            <span>RideBook Admin</span>
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
              {/* 🔥 NEW: Show notification badge for pending approvals */}
              {tab.id === 'vehicles' && pendingApprovalsCount > 0 && (
                <motion.span
                  className="notification-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  {pendingApprovalsCount}
                </motion.span>
              )}
            </motion.button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar admin">
              <FaUser />
            </div>
            <div className="user-details">
              <h4>{user?.name}</h4>
              <p className="badge badge-primary">Admin</p>
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
          <h1>Admin Dashboard 👨‍💼</h1>
          <p>Manage your ride booking platform</p>
        </motion.div>

        {/* 🔥 NEW: Pending Approvals Alert */}
        {pendingApprovalsCount > 0 && activeTab !== 'vehicles' && (
          <motion.div
            className="alert alert-warning"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              background: 'linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)',
              border: '1px solid #ffc107',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(255, 193, 7, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FaBell style={{ fontSize: '1.5rem', color: '#856404' }} />
              <div>
                <strong style={{ color: '#856404' }}>
                  {pendingApprovalsCount} vehicle{pendingApprovalsCount > 1 ? 's' : ''} pending approval
                </strong>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#856404' }}>
                  Review and approve driver vehicle registrations
                </p>
              </div>
            </div>
            <motion.button
              className="btn btn-warning"
              onClick={() => setActiveTab('vehicles')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ minWidth: '120px' }}
            >
              Review Now
            </motion.button>
          </motion.div>
        )}

        <div className="dashboard-content">
          {activeTab === 'stats' && <AdminStats />}
          {activeTab === 'vehicles' && <AdminVehicles />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'rides' && <AdminRides />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;