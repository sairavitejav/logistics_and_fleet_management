const express = require('express');
const router = express.Router();
const {register, login, currentUser, updateProfile, getAllUsers, updateUserRole, toggleUserActive} = require('../controllers/authController');
const {auth} = require('../middleware/auth');
const roles = require('../middleware/roles');

router.post('/register', register);
router.post('/login', login);
router.get('/current-user', auth, currentUser);
router.put('/update-profile', auth, updateProfile);

router.get('/users', auth, roles('admin'), getAllUsers);
router.put('/users/:id/role', auth, roles('admin'), updateUserRole);
router.put('/users/:id/status', auth, roles('admin'), toggleUserActive);

module.exports = router;