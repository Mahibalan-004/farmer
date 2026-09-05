const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

// Protected Cart Routes
router.get('/', protect, getCart);
router.post('/', protect, addToCart);

// Register both /items/:itemId and /:itemId for quantity updates and item removal
router.put('/items/:itemId', protect, updateCartQuantity);
router.put('/:itemId', protect, updateCartQuantity);

router.delete('/items/:itemId', protect, removeFromCart);
router.delete('/:itemId', protect, removeFromCart);

module.exports = router;
