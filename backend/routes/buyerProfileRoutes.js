const express = require('express');
const router = express.Router();
const { getMyProfile, updateMyProfile } = require('../controllers/buyerProfileController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);

module.exports = router;
