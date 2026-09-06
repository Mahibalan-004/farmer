const express = require('express');
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getMatchingRequests,
  respondAvailability
} = require('../controllers/bulkRequestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRequest);
router.get('/my-requests', protect, getMyRequests);
router.get('/matching', protect, getMatchingRequests);
router.put('/:id/availability', protect, respondAvailability);

module.exports = router;
