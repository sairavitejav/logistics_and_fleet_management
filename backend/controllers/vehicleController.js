const Vehicle = require('../models/vehicle');
const User = require('../models/user');

// 🔥 UPDATED: Add a new vehicle (Admin or Driver)
const addVehicle = async (req, res) => {
    try {
        // Accept both 'plate' and 'licensePlate' for compatibility
        const plate = req.body.plate || req.body.licensePlate;
        const {model, type, capacity, weightCapacity, color, year, driver, make, drivingLicense} = req.body;
        
        console.log('🚗 Adding vehicle - Received data:', {
            plate,
            model,
            make,
            type,
            capacity,
            weightCapacity,
            color,
            year,
            hasLicense: !!drivingLicense,
            userRole: req.user.role
        });
        
        if (!plate) {
            return res.status(400).json({message: 'License plate is required'});
        }
        
        if (!model) {
            return res.status(400).json({message: 'Vehicle model is required'});
        }
        
        const exists = await Vehicle.findOne({plate});
        if (exists) {
            return res.status(400).json({message: 'Vehicle with this plate already exists'});
        }
        
        // Determine approval status based on user role
        const approvalStatus = req.user.role === 'admin' ? 'approved' : 'pending';
        const addedBy = req.user.id;
        
        const vehicle = await Vehicle.create({
            plate, 
            model, 
            make,
            type: type || 'bike',
            capacity: capacity || 2,
            weightCapacity: weightCapacity || capacity || 0,
            color,
            year,
            status: 'available',
            approvalStatus,
            addedBy,
            driver: driver || (req.user.role === 'driver' ? req.user.id : null),
            drivingLicense
        });
        
        console.log('✅ Vehicle created successfully:', vehicle._id);
        res.status(201).json(vehicle);
    }
    catch (error) {
        console.error('❌ Error adding vehicle:', error);
        res.status(500).json({message: error.message || `${error}`});
    }
};

// 🔥 UPDATED: Get all vehicles (with filtering)
const getAllVehicles = async (req, res) => {
    try {
        const { status, approvalStatus } = req.query;
        let filter = {};
        
        // Admin sees all vehicles
        // Driver sees only their vehicles (vehicles they added)
        // Customer sees only approved and available vehicles
        if (req.user.role === 'driver') {
            filter.addedBy = req.user.id;
        } else if (req.user.role === 'customer') {
            filter.approvalStatus = 'approved';
            filter.status = 'available';
        }
        
        if (status) filter.status = status;
        if (approvalStatus && req.user.role === 'admin') filter.approvalStatus = approvalStatus;
        
        const vehicles = await Vehicle.find(filter)
            .populate('addedBy', 'name email')
            .populate('driver', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(vehicles);
    }
    catch (error) {
        console.error('Error in getAllVehicles:', error);
        res.status(500).json({message: 'Server error', error: error.message});
    }
};

// Get vehicle by ID 
const getVehicleById = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id)
            .populate('addedBy', 'name email')
            .populate('driver', 'name email phone');
        if (!vehicle) {
            return res.status(404).json({message: 'Vehicle not found'});
        }
        res.json(vehicle);
    }
    catch (error) {
        res.status(500).json({message: 'Server error'});
    }
};

// 🔥 NEW: Approve or reject vehicle (Admin only)
const updateVehicleApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const { approvalStatus } = req.body;
        
        if (!['approved', 'rejected'].includes(approvalStatus)) {
            return res.status(400).json({message: 'Invalid approval status'});
        }
        
        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({message: 'Vehicle not found'});
        }
        
        vehicle.approvalStatus = approvalStatus;
        await vehicle.save();
        
        res.json(vehicle);
    }
    catch (error) {
        res.status(500).json({message: `${error}`});
    }
};

// 🔥 NEW: Update vehicle status
const updateVehicleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['available', 'in_service', 'in_maintenance'].includes(status)) {
            return res.status(400).json({message: 'Invalid status'});
        }
        
        const vehicle = await Vehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({message: 'Vehicle not found'});
        }
        
        vehicle.status = status;
        await vehicle.save();
        
        res.json(vehicle);
    }
    catch (error) {
        res.status(500).json({message: `${error}`});
    }
};

// 🔥 NEW: Delete vehicle
const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findById(id);
        
        if (!vehicle) {
            return res.status(404).json({message: 'Vehicle not found'});
        }
        
        // Only admin or the driver who added it can delete
        if (req.user.role !== 'admin' && vehicle.addedBy.toString() !== req.user.id) {
            return res.status(403).json({message: 'Not authorized to delete this vehicle'});
        }
        
        await Vehicle.findByIdAndDelete(id);
        res.json({message: 'Vehicle deleted successfully'});
    }
    catch (error) {
        res.status(500).json({message: `${error}`});
    }
};

module.exports = {
    addVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicleApproval,
    updateVehicleStatus,
    deleteVehicle
};