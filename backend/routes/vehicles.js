const express = require('express');
const router = express.Router();
const {auth} = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const { 
    addVehicle, 
    getAllVehicles, 
    getVehicleById, 
    updateVehicleApproval, 
    updateVehicleStatus,
    deleteVehicle 
} = require('../controllers/vehicleController');

// 🔥 UPDATED: Add a new vehicle (Admin or Driver)
router.post('/', auth, authorizeRoles('admin', 'driver'), addVehicle);

// Get all vehicles (All roles)
router.get('/', auth, getAllVehicles);

// Get vehicle by ID (All roles)
router.get('/:id', auth, getVehicleById);

// 🔥 NEW: Approve/reject vehicle (Admin only)
router.put('/:id/approval', auth, authorizeRoles('admin'), updateVehicleApproval);

// 🔥 NEW: Update vehicle status (Admin or Driver)
router.put('/:id/status', auth, authorizeRoles('admin', 'driver'), updateVehicleStatus);

// 🔥 NEW: Delete vehicle (Admin or owner driver)
router.delete('/:id', auth, authorizeRoles('admin', 'driver'), deleteVehicle);

module.exports = router;