const express = require('express');
const router = express.Router();
const {
  addProduct,
  getMyProducts,
  getAllProducts,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public Route: View all available products
router.get('/', getAllProducts);

// Protected Farmer Routes
router.get('/my-products', protect, authorizeRoles('Farmer'), getMyProducts);
router.post('/', protect, authorizeRoles('Farmer'), upload.single('image'), addProduct);
router.put('/:id', protect, authorizeRoles('Farmer'), upload.single('image'), updateProduct);
router.delete('/:id', protect, authorizeRoles('Farmer'), deleteProduct);

module.exports = router;
