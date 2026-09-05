const express = require('express');
const router = express.Router();
const {
  optimizeRoute,
  getRouteByDelivery,
  getAllRoutesList
} = require('../controllers/routeController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Get all routes (Admin)
router.get('/', protect, getAllRoutesList);

// Get specific route by delivery or order ID (Admin, Farmer, Consumer, Retailer, Restaurant, Bulk Buyer)
router.get('/:deliveryId', protect, getRouteByDelivery);

// Optimize route for a delivery (Admin)
router.post('/optimize/:deliveryId', protect, authorizeRoles('Admin'), optimizeRoute);

module.exports = router;
