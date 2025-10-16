import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCar, FaPlus, FaTimes, FaSpinner, FaIdCard, FaUpload, FaTruck, FaChartLine } from 'react-icons/fa';
import { vehicleAPI } from '../utils/api';
import { useToast } from './Toast'; // ✨ Added Toast
import { CardSkeleton } from './LoadingSkeleton'; // ✨ Added LoadingSkeleton
import { getVehicleIcon } from '../utils/vehicleIcons'; // 🔥 NEW: Dynamic vehicle icons
import DriverStatistics from './DriverStatistics'; // 🔥 NEW: Statistics component
import '../styles/Vehicles.css';

const DriverVehicles = () => {
  const { showToast } = useToast(); // ✨ Initialize Toast
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('statistics'); // 🔥 NEW: Sub-tab state
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    type: 'bike',
    color: '',
    // ✨ NEW: Driving license fields
    licenseNumber: '',
    licenseExpiry: '',
    licenseImage: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [licensePreview, setLicensePreview] = useState(null);

  // Vehicle weight capacity mapping (in kg)
  const VEHICLE_CAPACITY = {
    bike: 20,
    auto: 100,
    mini_truck: 500,
    lorry: 2000
  };

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ✨ NEW: Handle license image upload with compression
  const handleLicenseUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('License image must be less than 5MB', 'error');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
      }

      // Compress and convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 800px width)
          let width = img.width;
          let height = img.height;
          const maxWidth = 800;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
          
          setFormData({
            ...formData,
            licenseImage: compressedBase64
          });
          setLicensePreview(compressedBase64);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✨ Validate driving license fields
    if (!formData.licenseNumber || !formData.licenseExpiry || !formData.licenseImage) {
      showToast('Please provide all driving license details', 'warning');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare vehicle data with driving license and auto-set weight capacity
      const vehicleData = {
        plate: formData.licensePlate, // Backend expects 'plate'
        make: formData.make,
        model: formData.model,
        type: formData.type,
        color: formData.color,
        year: formData.year ? parseInt(formData.year) : undefined,
        capacity: VEHICLE_CAPACITY[formData.type], // Backend expects 'capacity'
        weightCapacity: VEHICLE_CAPACITY[formData.type], // Also send weightCapacity
        drivingLicense: {
          licenseNumber: formData.licenseNumber,
          expiryDate: formData.licenseExpiry,
          licenseImage: formData.licenseImage
        }
      };

      await vehicleAPI.add(vehicleData);
      showToast('Vehicle added successfully! Waiting for admin approval.', 'success'); // ✨ Toast notification
      setShowAddModal(false);
      setFormData({
        make: '',
        model: '',
        year: '',
        licensePlate: '',
        type: 'bike',
        color: '',
        licenseNumber: '',
        licenseExpiry: '',
        licenseImage: null
      });
      setLicensePreview(null);
      fetchVehicles();
    } catch (error) {
      console.error('Failed to add vehicle:', error);
      showToast(error.message || 'Failed to add vehicle', 'error'); // ✨ Toast notification
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return ( // ✨ Replaced with CardSkeleton
      <div className="vehicles-container">
        <div className="vehicles-header">
          <h2><FaCar /> My Vehicles</h2>
        </div>
        <div className="vehicles-grid">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="vehicles-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Sub-tabs Navigation */}
      <div className="sub-tabs">
        <button
          className={`sub-tab ${activeSubTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('statistics')}
        >
          <FaChartLine /> Statistics
        </button>
        <button
          className={`sub-tab ${activeSubTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('vehicles')}
        >
          <FaCar /> My Vehicles
        </button>
      </div>

      {/* Sub-tab Content */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'vehicles' && (
          <motion.div
            key="vehicles"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="vehicles-header">
              <h2><FaCar /> My Vehicles</h2>
              <motion.button
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaPlus /> Add Vehicle
              </motion.button>
            </div>

            {vehicles.length === 0 ? (
              <div className="no-vehicles">
                <FaCar size={64} color="var(--gray)" />
                <h3>No vehicles added</h3>
                <p>Add your first vehicle to start accepting rides</p>
              </div>
            ) : (
              <div className="vehicles-grid">
                {vehicles.map((vehicle, index) => (
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
                      <span className={`badge badge-${getStatusColor(vehicle.approvalStatus)}`}>
                        {vehicle.approvalStatus}
                      </span>
                    </div>

                    <div className="vehicle-info">
                      <h3>{vehicle.make} {vehicle.model}</h3>
                      <div className="vehicle-details">
                        <div className="detail-row">
                          <span>Type:</span>
                          <strong>{vehicle.type}</strong>
                        </div>
                        <div className="detail-row">
                          <span>Year:</span>
                          <strong>{vehicle.year}</strong>
                        </div>
                        <div className="detail-row">
                          <span>Color:</span>
                          <strong>{vehicle.color}</strong>
                        </div>
                        <div className="detail-row">
                          <span>License Plate:</span>
                          <strong>{vehicle.licensePlate}</strong>
                        </div>
                        <div className="detail-row">
                          <span>Weight Capacity:</span>
                          <strong>{vehicle.weightCapacity} kg</strong>
                        </div>
                        <div className="detail-row">
                          <span>Status:</span>
                          <strong>{vehicle.status}</strong>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === 'statistics' && (
          <motion.div
            key="statistics"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DriverStatistics />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Add New Vehicle</h2>
                <button
                  className="close-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="vehicle-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="make">Make</label>
                    <input
                      type="text"
                      id="make"
                      name="make"
                      value={formData.make}
                      onChange={handleChange}
                      placeholder="e.g., Honda"
                      required
                      className="input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="model">Model</label>
                    <input
                      type="text"
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="e.g., Activa"
                      required
                      className="input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="year">Year</label>
                    <input
                      type="number"
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      placeholder="2023"
                      required
                      className="input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="type">Type</label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="input"
                      required
                    >
                      <option value="bike">Bike (20 kg)</option>
                      <option value="auto">Auto (100 kg)</option>
                      <option value="mini_truck">Mini Truck (500 kg)</option>
                      <option value="lorry">Lorry (2000 kg)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="color">Color</label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="e.g., Black"
                    required
                    className="input"
                  />
                </div>

                <p className="capacity-info" style={{ color: 'var(--gray)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  💡 Weight capacity is automatically set based on vehicle type
                </p>

                <div className="form-group">
                  <label htmlFor="licensePlate">License Plate</label>
                  <input
                    type="text"
                    id="licensePlate"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    placeholder="e.g., DL01AB1234"
                    required
                    className="input"
                  />
                </div>

                {/* ✨ NEW: Driving License Section */}
                <div className="form-section-divider">
                  <h3><FaIdCard /> Driving License Details</h3>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="licenseNumber">License Number *</label>
                    <input
                      type="text"
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="e.g., DL-1420110012345"
                      required
                      className="input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="licenseExpiry">Expiry Date *</label>
                    <input
                      type="date"
                      id="licenseExpiry"
                      name="licenseExpiry"
                      value={formData.licenseExpiry}
                      onChange={handleChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="licenseImage">Upload License Image *</label>
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      id="licenseImage"
                      accept="image/*"
                      onChange={handleLicenseUpload}
                      className="file-input"
                      required
                    />
                    <label htmlFor="licenseImage" className="file-upload-label">
                      <FaUpload /> Choose License Image
                    </label>
                  </div>
                  {licensePreview && (
                    <div className="license-preview">
                      <img src={licensePreview} alt="License Preview" />
                      <button
                        type="button"
                        className="remove-preview-btn"
                        onClick={() => {
                          setLicensePreview(null);
                          setFormData({ ...formData, licenseImage: null });
                        }}
                      >
                        <FaTimes /> Remove
                      </button>
                    </div>
                  )}
                  <small style={{ color: 'var(--gray)', fontSize: '0.75rem' }}>
                    Max size: 5MB. Formats: JPG, PNG, JPEG
                  </small>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="spin" /> Adding...
                      </>
                    ) : (
                      <>
                        <FaPlus /> Add Vehicle
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DriverVehicles;