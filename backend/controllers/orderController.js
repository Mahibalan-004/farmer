const {
  createOrderTransaction,
  getOrdersByBuyerId,
  getOrderById,
  getOrdersForFarmer,
  updateOrderStatus
} = require('../models/orderModel');
const { getOrCreateCart, getCartItems } = require('../models/cartModel');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Buyer)
const placeOrder = async (req, res) => {
  try {
    const {
      delivery_address,
      district,
      state,
      pincode,
      phone,
      payment_method
    } = req.body;

    if (!delivery_address || !district || !state || !pincode || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all delivery details: delivery_address, district, state, pincode, phone'
      });
    }

    const validPaymentMethods = ['Cash on Delivery', 'UPI Payment', 'Online Payment'];
    const selectedPaymentMethod = validPaymentMethods.includes(payment_method)
      ? payment_method
      : 'Cash on Delivery';

    // 1. Fetch buyer cart
    const cart = await getOrCreateCart(req.user.id);
    const cartItems = await getCartItems(cart.id);

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Add crops to cart before checking out.'
      });
    }

    // 2. Execute order transaction with backend stock and price validation
    const result = await createOrderTransaction({
      buyer_id: req.user.id,
      delivery_address,
      district,
      state,
      pincode,
      phone,
      payment_method: selectedPaymentMethod,
      cart_id: cart.id,
      cart_items: cartItems
    });

    const createdOrder = await getOrderById(result.orderId);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: createdOrder
    });

  } catch (error) {
    console.error('❌ Error placing order:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to place order'
    });
  }
};

// @desc    Get buyer orders
// @route   GET /api/orders/my-orders
// @access  Private (Buyer)
const getMyOrders = async (req, res) => {
  try {
    const orders = await getOrdersByBuyerId(req.user.id);

    // Populate order items for each order
    const populatedOrders = await Promise.all(
      orders.map(order => getOrderById(order.id))
    );

    return res.status(200).json({
      success: true,
      count: populatedOrders.length,
      orders: populatedOrders
    });
  } catch (error) {
    console.error('❌ Error getting buyer orders:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving orders', error: error.message });
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check: buyer or associated farmer
    if (order.buyer_id !== req.user.id && req.user.role !== 'Farmer' && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('❌ Error getting order details:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving order details', error: error.message });
  }
};

// @desc    Get farmer orders (Order items for farmer's crops)
// @route   GET /api/orders/farmer-orders
// @access  Private (Farmer)
const getFarmerOrders = async (req, res) => {
  try {
    const farmerOrders = await getOrdersForFarmer(req.user.id);
    return res.status(200).json({
      success: true,
      count: farmerOrders.length,
      orders: farmerOrders
    });
  } catch (error) {
    console.error('❌ Error getting farmer orders:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving farmer orders', error: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Farmer)
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const updated = await updateOrderStatus(id, status);
    if (!updated) {
      return res.status(400).json({ success: false, message: 'Order not found or update failed' });
    }

    return res.status(200).json({
      success: true,
      message: `Order #${id} status updated to ${status}`
    });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return res.status(500).json({ success: false, message: 'Server error updating order status', error: error.message });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderDetails,
  getFarmerOrders,
  updateStatus
};
