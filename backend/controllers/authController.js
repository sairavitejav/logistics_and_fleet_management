const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv').config();

// Register a new user
const register = async (req, res) => {
    const { name, email, password, role, pin, adminPin } = req.body;

    // Check admin PIN - accept both 'pin' and 'adminPin' for backward compatibility
    if (role === 'admin') {
        const providedPin = adminPin || pin;

        if (!providedPin || providedPin === "") {
            return res.status(400).json({ message: 'Admin pin is required' });
        }

        // Convert both to strings for comparison
        if (String(providedPin).trim() !== String(process.env.ADMIN_PIN).trim()) {
            return res.status(403).json({ message: 'Invalid admin pin' });
        }
    }

    try {
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with verified email (no OTP required)
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            emailVerified: true  // Email is verified by default
        });

        // Generate token for immediate login
        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '15m' });

        // Return success response with token
        res.status(201).json({
            message: 'Registration successful! Welcome to our platform.',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                emailVerified: user.emailVerified
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: `${error}` });
    }
};
// Login user
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: '15m' });
        // 🔥 UPDATED: Return user info along with token
        res.json({ 
            token,
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                phone: user.phone,
                avatar: user.avatar,
                driverStatus: user.driverStatus,
                isActive: user.isActive
            } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get current user
const currentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updates = req.body;
        
        // Don't allow updating password, role, or isActive through this endpoint
        delete updates.password;
        delete updates.role;
        delete updates.isActive;
        
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const { role, active } = req.query;
        let filter = {};

        if (role && role !== 'all') {
            filter.role = role;
        }

        if (typeof active !== 'undefined' && active !== 'all') {
            const isActiveValue = active === 'true';
            
            if (isActiveValue) {
                // For active users, include those with isActive=true or undefined/null
                const activeFilter = {
                    $or: [
                        { isActive: true },
                        { isActive: { $exists: false } },
                        { isActive: null }
                    ]
                };
                
                // Combine with role filter if exists
                if (filter.role) {
                    filter = { $and: [{ role: filter.role }, activeFilter] };
                } else {
                    filter = activeFilter;
                }
            } else {
                // For inactive users, only those with isActive=false
                filter.isActive = false;
            }
        }

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['admin', 'driver', 'customer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Role updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const toggleUserActive = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive === 'undefined') {
            return res.status(400).json({ message: 'isActive is required' });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully`, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { register, login, currentUser, updateProfile, getAllUsers, updateUserRole, toggleUserActive };