const { pool } = require('../config/db');

// Execute Order Creation in a MySQL Database Transaction
const createOrderTransaction = async ({
  buyer_id,
  delivery_name,
  delivery_phone,
  delivery_address,
  district,
  state,
  pincode,
  phone,
  payment_method,
  cart_id,
  cart_items
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let subtotal = 0;
    const validatedItems = [];

    // 1. Re-verify product stock and calculate price strictly on backend
    for (const item of cart_items) {
      const [products] = await connection.query(
        'SELECT * FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );

      if (products.length === 0) {
        throw new Error(`Product ID ${item.product_id} no longer exists.`);
      }

      const product = products[0];

      if (product.status !== 'Available' || parseFloat(product.quantity) < parseFloat(item.cart_quantity)) {
        throw new Error(`Insufficient stock for "${product.crop_name}". Available: ${product.quantity} ${product.unit}.`);
      }

      const itemTotal = parseFloat(product.price_per_unit) * parseFloat(item.cart_quantity);
      subtotal += itemTotal;

      validatedItems.push({
        product_id: product.id,
        farmer_id: product.farmer_id,
        product_name: product.crop_name,
        quantity: parseFloat(item.cart_quantity),
        price_per_unit: parseFloat(product.price_per_unit),
        total_price: parseFloat(itemTotal.toFixed(2)),
        current_stock: parseFloat(product.quantity)
      });
    }

    const delivery_charge = 0.00; // Free shipping as per theme summary
    const total_amount = parseFloat((subtotal + delivery_charge).toFixed(2));
    const payment_status = (payment_method === 'Online Payment' || payment_method === 'UPI Payment') ? 'Paid' : 'Pending';

    // Generate Order Number
    const order_number = `ORD-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
    const recipientPhone = delivery_phone || phone;

    // 2. Insert Order (Initial Status = 'Pending')
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        order_number, buyer_id, total_amount, delivery_charge, payment_method, payment_status,
        order_status, delivery_name, delivery_phone, delivery_address, district, state, pincode, phone
      ) VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_number,
        buyer_id,
        total_amount,
        delivery_charge,
        payment_method,
        payment_status,
        delivery_name || 'Buyer',
        recipientPhone,
        delivery_address,
        district,
        state,
        pincode,
        recipientPhone
      ]
    );

    const orderId = orderResult.insertId;

    // 3. Insert Order Items & Deduct Product Stock
    for (const item of validatedItems) {
      await connection.query(
        `INSERT INTO order_items (
          order_id, product_id, farmer_id, product_name, quantity, price_per_unit, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.farmer_id,
          item.product_name,
          item.quantity,
          item.price_per_unit,
          item.total_price
        ]
      );

      // Deduct stock quantity
      const remainingStock = item.current_stock - item.quantity;
      const newStatus = remainingStock <= 0 ? 'Sold Out' : 'Available';

      await connection.query(
        'UPDATE products SET quantity = ?, status = ? WHERE id = ?',
        [Math.max(0, remainingStock), newStatus, item.product_id]
      );
    }

    // 4. Clear buyer cart
    await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [cart_id]);

    await connection.commit();
    return { orderId, order_number, total_amount };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Get Orders placed by Buyer
const getOrdersByBuyerId = async (buyer_id) => {
  const [orders] = await pool.query(
    'SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC',
    [buyer_id]
  );

  for (const order of orders) {
    const [items] = await pool.query(
      `SELECT oi.*, p.crop_name, p.image_url, p.unit, u.full_name AS farmer_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN users u ON oi.farmer_id = u.id
       WHERE oi.order_id = ?`,
      [order.id]
    );
    order.items = items;
  }

  return orders;
};

// Get Order Details with items
const getOrderById = async (order_id) => {
  const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [order_id]);
  if (orders.length === 0) return null;

  const order = orders[0];
  const [items] = await pool.query(
    `SELECT oi.*, p.crop_name, p.image_url, p.unit, u.full_name AS farmer_name, u.phone AS farmer_phone
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     LEFT JOIN users u ON oi.farmer_id = u.id
     WHERE oi.order_id = ?`,
    [order_id]
  );

  order.items = items;
  return order;
};

// Get Orders for Farmer (Items belonging to crops listed by farmer)
const getOrdersForFarmer = async (farmer_id) => {
  const [rows] = await pool.query(
    `SELECT 
       oi.id AS order_item_id, oi.order_id, oi.product_name, oi.quantity,
       oi.price_per_unit, oi.total_price, oi.created_at,
       o.order_number, o.order_status, o.payment_status, o.payment_method,
       o.delivery_name, o.delivery_phone, o.delivery_address, o.district, o.state, o.pincode, o.phone AS buyer_phone,
       u.full_name AS buyer_name, u.email AS buyer_email,
       p.unit
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN users u ON o.buyer_id = u.id
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.farmer_id = ?
     ORDER BY oi.created_at DESC`,
    [farmer_id]
  );
  return rows;
};

// Cancel Order & Restore Product Quantities (Buyer trigger)
const cancelOrderTransaction = async (order_id, buyer_id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? AND buyer_id = ? FOR UPDATE',
      [order_id, buyer_id]
    );

    if (orders.length === 0) {
      throw new Error('Order not found or unauthorized.');
    }

    const order = orders[0];

    if (order.order_status !== 'Pending' && order.order_status !== 'Placed') {
      throw new Error(`Order cannot be cancelled because current status is "${order.order_status}". Only Pending orders can be cancelled.`);
    }

    // Restore stock for all items
    const [items] = await connection.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [order_id]
    );

    for (const item of items) {
      await connection.query(
        `UPDATE products 
         SET quantity = quantity + ?, status = 'Available' 
         WHERE id = ?`,
        [parseFloat(item.quantity), item.product_id]
      );
    }

    // Update status to Cancelled
    await connection.query(
      "UPDATE orders SET order_status = 'Cancelled' WHERE id = ?",
      [order_id]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Update Order Status (Farmer/Admin operation with automatic stock restoration if cancelled)
const updateOrderStatus = async (order_id, new_status) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? FOR UPDATE',
      [order_id]
    );

    if (orders.length === 0) {
      throw new Error('Order not found');
    }

    const currentStatus = orders[0].order_status;

    // If changing to Cancelled and wasn't already Cancelled, restore stock
    if (new_status === 'Cancelled' && currentStatus !== 'Cancelled') {
      const [items] = await connection.query(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [order_id]
      );

      for (const item of items) {
        await connection.query(
          `UPDATE products 
           SET quantity = quantity + ?, status = 'Available' 
           WHERE id = ?`,
          [parseFloat(item.quantity), item.product_id]
        );
      }
    }

    await connection.query(
      'UPDATE orders SET order_status = ? WHERE id = ?',
      [new_status, order_id]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createOrderTransaction,
  getOrdersByBuyerId,
  getOrderById,
  getOrdersForFarmer,
  cancelOrderTransaction,
  updateOrderStatus
};
