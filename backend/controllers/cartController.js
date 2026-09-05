const {
  getOrCreateCart,
  getCartItems,
  addOrUpdateCartItem,
  updateCartItemQuantity,
  removeCartItem
} = require('../models/cartModel');
const { getProductById } = require('../models/productModel');

// @desc    Get buyer cart items
// @route   GET /api/cart
// @access  Private (Buyer)
const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const items = await getCartItems(cart.id);

    // Calculate subtotal
    const subtotal = items.reduce((acc, item) => {
      return acc + (parseFloat(item.price_per_unit) * parseFloat(item.cart_quantity));
    }, 0);

    const delivery_charge = items.length > 0 ? 50 : 0;
    const total_amount = subtotal + delivery_charge;

    return res.status(200).json({
      success: true,
      cart_id: cart.id,
      count: items.length,
      items,
      summary: {
        total_items: items.length,
        subtotal: parseFloat(subtotal.toFixed(2)),
        delivery_charge,
        total_amount: parseFloat(total_amount.toFixed(2))
      }
    });
  } catch (error) {
    console.error('❌ Error getting cart:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving cart', error: error.message });
  }
};

// @desc    Add product to cart
// @route   POST /api/cart
// @access  Private (Buyer)
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const requestedQty = parseFloat(quantity) || 1;

    if (!product_id || requestedQty <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid product_id or quantity' });
    }

    // 1. Verify product existence & stock in database
    const product = await getProductById(product_id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.status !== 'Available' || parseFloat(product.quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'This crop product is out of stock' });
    }

    // 2. Check user cart
    const cart = await getOrCreateCart(req.user.id);
    const existingItems = await getCartItems(cart.id);
    const existingItem = existingItems.find(item => item.product_id === parseInt(product_id));
    const currentQtyInCart = existingItem ? parseFloat(existingItem.cart_quantity) : 0;

    if ((currentQtyInCart + requestedQty) > parseFloat(product.quantity)) {
      return res.status(400).json({
        success: false,
        message: `Cannot add requested quantity. Available stock is ${product.quantity} ${product.unit}.`
      });
    }

    // 3. Add or update item
    await addOrUpdateCartItem(cart.id, product_id, requestedQty);

    return res.status(200).json({
      success: true,
      message: `Added ${product.crop_name} to cart!`
    });
  } catch (error) {
    console.error('❌ Error adding to cart:', error);
    return res.status(500).json({ success: false, message: 'Server error adding to cart', error: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private (Buyer)
const updateCartQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const newQty = parseFloat(quantity);

    if (isNaN(newQty) || newQty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than 0' });
    }

    const cart = await getOrCreateCart(req.user.id);
    const items = await getCartItems(cart.id);
    const item = items.find(i => i.item_id === parseInt(itemId));

    if (!item) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    if (newQty > parseFloat(item.stock_quantity)) {
      return res.status(400).json({
        success: false,
        message: `Quantity exceeds available stock of ${item.stock_quantity} ${item.unit}`
      });
    }

    await updateCartItemQuantity(itemId, cart.id, newQty);

    return res.status(200).json({
      success: true,
      message: 'Cart item quantity updated'
    });
  } catch (error) {
    console.error('❌ Error updating cart item:', error);
    return res.status(500).json({ success: false, message: 'Server error updating cart item', error: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private (Buyer)
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await getOrCreateCart(req.user.id);
    await removeCartItem(itemId, cart.id);

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('❌ Error removing cart item:', error);
    return res.status(500).json({ success: false, message: 'Server error removing cart item', error: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart
};
