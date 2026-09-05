const {
  createProduct,
  getProductById,
  getProductsByFarmerId,
  getAllAvailableProducts,
  updateProduct,
  deleteProduct
} = require('../models/productModel');

// Helper to format image URL
const getImageUrl = (req) => {
  if (!req.file) return null;
  return `/uploads/products/${req.file.filename}`;
};

// @desc    Add a new product
// @route   POST /api/products
// @access  Private (Farmer)
const addProduct = async (req, res) => {
  try {
    const {
      crop_name,
      category,
      quantity,
      unit,
      price_per_unit,
      location,
      district,
      state,
      harvest_date,
      quality_grade,
      description,
      available_date,
      status
    } = req.body;

    // Validate required fields
    if (!crop_name || !category || !quantity || !unit || !price_per_unit) {
      return res.status(400).json({
        message: 'Please provide all required fields: crop_name, category, quantity, unit, price_per_unit'
      });
    }

    const image_url = getImageUrl(req);

    const productId = await createProduct({
      farmer_id: req.user.id,
      crop_name,
      category,
      quantity: parseFloat(quantity),
      unit,
      price_per_unit: parseFloat(price_per_unit),
      location,
      district,
      state,
      harvest_date,
      quality_grade,
      description,
      image_url,
      available_date,
      status
    });

    const newProduct = await getProductById(productId);

    return res.status(201).json({
      message: 'Product added successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ message: 'Server error adding product', error: error.message });
  }
};

// @desc    Get products owned by logged-in farmer
// @route   GET /api/products/my-products
// @access  Private (Farmer)
const getMyProducts = async (req, res) => {
  try {
    const products = await getProductsByFarmerId(req.user.id);
    return res.status(200).json({
      message: 'Farmer products retrieved successfully',
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error getting farmer products:', error);
    return res.status(500).json({ message: 'Server error retrieving products', error: error.message });
  }
};

// @desc    Get all available products (Public Marketplace View)
// @route   GET /api/products
// @access  Public
const getAllProducts = async (req, res) => {
  try {
    const products = await getAllAvailableProducts();
    return res.status(200).json({
      message: 'Available products retrieved successfully',
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error getting public products:', error);
    return res.status(500).json({ message: 'Server error retrieving available products', error: error.message });
  }
};

// @desc    Update a product (Farmer can update only their own product)
// @route   PUT /api/products/:id
// @access  Private (Farmer)
const updateProductController = async (req, res) => {
  try {
    const productId = req.params.id;
    const farmerId = req.user.id;

    // Check if product exists and belongs to this farmer
    const existingProduct = await getProductById(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (existingProduct.farmer_id !== farmerId) {
      return res.status(403).json({ message: 'Forbidden. You can update only your own products.' });
    }

    const {
      crop_name,
      category,
      quantity,
      unit,
      price_per_unit,
      location,
      district,
      state,
      harvest_date,
      quality_grade,
      description,
      available_date,
      status
    } = req.body;

    const image_url = req.file ? getImageUrl(req) : existingProduct.image_url;

    const updated = await updateProduct(productId, farmerId, {
      crop_name,
      category,
      quantity: quantity ? parseFloat(quantity) : undefined,
      unit,
      price_per_unit: price_per_unit ? parseFloat(price_per_unit) : undefined,
      location,
      district,
      state,
      harvest_date,
      quality_grade,
      description,
      image_url,
      available_date,
      status
    });

    if (!updated) {
      return res.status(400).json({ message: 'Failed to update product' });
    }

    const updatedProduct = await getProductById(productId);

    return res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Server error updating product', error: error.message });
  }
};

// @desc    Delete a product (Farmer can delete only their own product)
// @route   DELETE /api/products/:id
// @access  Private (Farmer)
const deleteProductController = async (req, res) => {
  try {
    const productId = req.params.id;
    const farmerId = req.user.id;

    // Check if product exists and belongs to this farmer
    const existingProduct = await getProductById(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (existingProduct.farmer_id !== farmerId) {
      return res.status(403).json({ message: 'Forbidden. You can delete only your own products.' });
    }

    const deleted = await deleteProduct(productId, farmerId);
    if (!deleted) {
      return res.status(400).json({ message: 'Failed to delete product' });
    }

    return res.status(200).json({
      message: 'Product deleted successfully',
      deleted_product_id: parseInt(productId)
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ message: 'Server error deleting product', error: error.message });
  }
};

module.exports = {
  addProduct,
  getMyProducts,
  getAllProducts,
  updateProduct: updateProductController,
  deleteProduct: deleteProductController
};
