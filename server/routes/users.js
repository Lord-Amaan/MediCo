const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Get current user profile
router.get('/me', verifyToken, userController.getUserProfile);

// Update current user profile
router.put('/me', verifyToken, userController.updateUserProfile);

// Get all users (admin only)
router.get('/', verifyToken, checkPermission('Admin'), userController.getAllUsers);

// Get users by hospital
router.get('/hospital/:hospitalID', verifyToken, userController.getUsersByHospital);

module.exports = router;
