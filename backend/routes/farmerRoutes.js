const express = require('express');
const router = express.Router();
const { getFarmerProfile, updateFarmerProfile } = require('../controllers/farmerController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Protected Farmer Profile Routes (Farmer Role Only)
router.get('/profile', protect, authorizeRoles('Farmer'), getFarmerProfile);
router.put('/profile', protect, authorizeRoles('Farmer'), updateFarmerProfile);

module.exports = router;
