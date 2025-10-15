import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCar, FaCheck, FaTimes, FaSpinner, FaIdCard, FaEye } from 'react-icons/fa';
import { vehicleAPI } from '../utils/api';
import { useToast } from './Toast'; // ✨ Added Toast notification
import { TableSkeleton } from './LoadingSkeleton'; // ✨ Added Loading Skeleton
import { getVehicleIcon } from '../utils/vehicleIcons'; // 🔥 NEW: Dynamic vehicle icons
import '../styles/Vehicles.css';

const AdminVehicles = () => {
  const { showToast } = useToast(); // ✨ Initialize toast hook
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState(null); // 🔥 NEW: For viewing license details

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const data = await vehicleAPI.getAll();
      setVehicles(data);
    } catch (error) {
      console.error('Failed to fetch vehicles:', error);
      showToast('Failed to load vehicles', 'error'); // ✨ Toast notification
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (vehicleId, status) => {
    try {
      await vehicleAPI.updateApproval(vehicleId, status);
      fetchVehicles();
      showToast(`Vehicle ${status} successfully`, 'success'); // ✨ Toast notification
    } catch (error) {
      console.error('Failed to update approval:', error);
      showToast('Failed to update vehicle status', 'error'); // ✨ Toast notification
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    if (filter === 'all') return true;
    return v.approvalStatus === filter;
  });

  if (loading) {
    return <TableSkeleton rows={5} columns={5} />; // ✨ Loading Skeleton
  }

  return (
    <motion.div
      className="vehicles-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="vehicles-header">
        <h2><FaCar /> All Vehicles</h2>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
        </div>
      </div>

      <div className="vehicles-grid">
        {filteredVehicles.map((vehicle, index) => (
          <motion.div
            key={vehicle._id}
            className="vehicle-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="vehicle-card-header">
              <div className="vehicle-icon-wrapper">
                {(() => {
                  const VehicleIcon = getVehicleIcon(vehicle.type);
                  return <VehicleIcon />;
                })()}
              </div>
              <span className={`badge badge-${
                vehicle.approvalStatus === 'approved' ? 'success' :
                vehicle.approvalStatus === 'pending' ? 'warning' : 'danger'
              }`}>
                {vehicle.approvalStatus}
              </span>
            </div>

            <div className="vehicle-info">
              <h3>{vehicle.make} {vehicle.model}</h3>
              <div className="vehicle-details">
                <div className="detail-row">
                  <span>Owner:</span>
                  <strong>{vehicle.addedBy?.name || 'N/A'}</strong>
                </div>
                <div className="detail-row">
                  <span>Type:</span>
                  <strong>{vehicle.type}</strong>
                </div>
                <div className="detail-row">
                  <span>License Plate:</span>
                  <strong>{vehicle.plate || vehicle.licensePlate}</strong>
                </div>
                <div className="detail-row">
                  <span>Status:</span>
                  <strong>{vehicle.status}</strong>
                </div>
                {/* 🔥 NEW: Show license info if available */}
                {vehicle.drivingLicense && (
                  <div className="detail-row">
                    <span>License:</span>
                    <strong>{vehicle.drivingLicense.licenseNumber}</strong>
                  </div>
                )}
              </div>

              {/* 🔥 NEW: View License Details Button */}
              {vehicle.drivingLicense && (
                <motion.button
                  className="btn btn-info btn-block"
                  onClick={() => setSelectedVehicle(vehicle)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ marginTop: '10px' }}
                >
                  <FaIdCard /> View License Details
                </motion.button>
              )}

              {vehicle.approvalStatus === 'pending' && (
                <div className="approval-actions">
                  <motion.button
                    className="btn btn-success"
                    onClick={() => handleApproval(vehicle._id, 'approved')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaCheck /> Approve
                  </motion.button>
                  <motion.button
                    className="btn btn-danger"
                    onClick={() => handleApproval(vehicle._id, 'rejected')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaTimes /> Reject
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 🔥 NEW: License Details Modal */}
      <AnimatePresence>
        {selectedVehicle && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVehicle(null)}
          >
            <motion.div
              className="modal license-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2><FaIdCard /> Driver License Details</h2>
                <button
                  className="close-btn"
                  onClick={() => setSelectedVehicle(null)}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <div className="license-details">
                  <h3>Vehicle Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span>Vehicle:</span>
                      <strong>{selectedVehicle.make} {selectedVehicle.model}</strong>
                    </div>
                    <div className="detail-item">
                      <span>License Plate:</span>
                      <strong>{selectedVehicle.plate || selectedVehicle.licensePlate}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Type:</span>
                      <strong>{selectedVehicle.type}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Owner:</span>
                      <strong>{selectedVehicle.addedBy?.name || 'N/A'}</strong>
                    </div>
                  </div>

                  <h3 style={{ marginTop: '20px' }}>Driving License</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span>License Number:</span>
                      <strong>{selectedVehicle.drivingLicense?.licenseNumber}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Expiry Date:</span>
                      <strong>
                        {selectedVehicle.drivingLicense?.expiryDate 
                          ? new Date(selectedVehicle.drivingLicense.expiryDate).toLocaleDateString()
                          : 'N/A'}
                      </strong>
                    </div>
                  </div>

                  {selectedVehicle.drivingLicense?.licenseImage && (
                    <div className="license-image-container">
                      <h3>License Image</h3>
                      <img 
                        src={selectedVehicle.drivingLicense.licenseImage} 
                        alt="Driving License"
                        className="license-image"
                      />
                    </div>
                  )}
                </div>

                {selectedVehicle.approvalStatus === 'pending' && (
                  <div className="modal-actions">
                    <motion.button
                      className="btn btn-success"
                      onClick={() => {
                        handleApproval(selectedVehicle._id, 'approved');
                        setSelectedVehicle(null);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaCheck /> Approve Vehicle
                    </motion.button>
                    <motion.button
                      className="btn btn-danger"
                      onClick={() => {
                        handleApproval(selectedVehicle._id, 'rejected');
                        setSelectedVehicle(null);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaTimes /> Reject Vehicle
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminVehicles;