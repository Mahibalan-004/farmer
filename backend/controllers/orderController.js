const {
  createOrderTransaction,
  getOrdersByBuyerId,
  getOrderById,
  getOrdersForFarmer,
  cancelOrderTransaction,
  updateOrderStatus
} = require('../models/orderModel');
const { getOrCreateCart, getCartItems } = require('../models/cartModel');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (Buyer)
const placeOrder = async (req, res) => {
  try {
    const {
      delivery_name,
      delivery_phone,
      delivery_address,
      district,
      state,
      pincode,
      phone,
      payment_method
    } = req.body;

    const recipientPhone = delivery_phone || phone;

    if (!delivery_address || !district || !state || !pincode || !recipientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all delivery details: delivery_name, phone, delivery_address, district, state, pincode'
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
      delivery_name,
      delivery_phone: recipientPhone,
      delivery_address,
      district,
      state,
      pincode,
      phone: recipientPhone,
      payment_method: selectedPaymentMethod,
      cart_id: cart.id,
      cart_items: cartItems
    });

    const createdOrder = await getOrderById(result.orderId);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully! Order ID: ' + (createdOrder.order_number || result.orderId),
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

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
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

    // Authorization check: buyer or associated farmer/admin
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

// @desc    Buyer cancel order (Only when status is 'Pending')
// @route   PUT /api/orders/:id/cancel
// @access  Private (Buyer)
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await cancelOrderTransaction(id, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully. Restored product stock.'
    });
  } catch (error) {
    console.error('❌ Error cancelling order:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel order'
    });
  }
};

// @desc    Update order status (Farmer/Admin)
// @route   PUT /api/orders/:id/status
// @access  Private (Farmer)
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const newStatus = req.body.order_status || req.body.status;

    const allowedStatuses = ['Pending', 'Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!newStatus || !allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses: ${allowedStatuses.join(', ')}`
      });
    }

    await updateOrderStatus(id, newStatus);

    return res.status(200).json({
      success: true,
      message: `Order #${id} status updated to '${newStatus}'`
    });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error updating order status' });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderDetails,
  getFarmerOrders,
  cancelOrder,
  updateStatus
};
