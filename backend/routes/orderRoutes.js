const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getMyOrders,
  getOrderDetails,
  getFarmerOrders,
  cancelOrder,
  updateStatus
} = require('../controllers/orderController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Buyer Protected Routes
router.post('/', protect, placeOrder);
router.get('/my-orders', protect, getMyOrders);
router.put('/:id/cancel', protect, cancelOrder);

// Farmer Protected Routes
router.get('/farmer-orders', protect, authorizeRoles('Farmer'), getFarmerOrders);
router.put('/:id/status', protect, authorizeRoles('Farmer', 'Admin'), updateStatus);

// Order details by ID
router.get('/:id', protect, getOrderDetails);

module.exports = router;
