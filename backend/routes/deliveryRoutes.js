const express = require('express');
const router = express.Router();
const {
  getDeliveries,
  getDeliveryById,
  assignDelivery,
  updateStatus,
  fetchPartners,
  addPartner,
  editPartner,
  removePartner,
  fetchStats
} = require('../controllers/deliveryController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Delivery Stats (Admin)
router.get('/stats', protect, authorizeRoles('Admin'), fetchStats);

// Deliveries Management
router.get('/', protect, getDeliveries);
router.get('/:id', protect, getDeliveryById);
router.put('/:id/assign', protect, authorizeRoles('Admin'), assignDelivery);
router.put('/:id/status', protect, authorizeRoles('Admin', 'Farmer'), updateStatus);

// Delivery Partners CRUD (Admin)
router.get('/partners/all', protect, fetchPartners);
router.post('/partners', protect, authorizeRoles('Admin'), addPartner);
router.put('/partners/:id', protect, authorizeRoles('Admin'), editPartner);
router.delete('/partners/:id', protect, authorizeRoles('Admin'), removePartner);

module.exports = router;
