const { pool } = require('../config/db');

// Execute Order Creation in a MySQL Database Transaction
const createOrderTransaction = async ({
  buyer_id,
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

    const delivery_charge = 50.00;
    const total_amount = parseFloat((subtotal + delivery_charge).toFixed(2));
    const payment_status = (payment_method === 'Online Payment' || payment_method === 'UPI Payment') ? 'Paid' : 'Pending';

    // 2. Insert Order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        buyer_id, total_amount, delivery_charge, payment_method, payment_status,
        order_status, delivery_address, district, state, pincode, phone
      ) VALUES (?, ?, ?, ?, ?, 'Placed', ?, ?, ?, ?, ?)`,
      [
        buyer_id,
        total_amount,
        delivery_charge,
        payment_method,
        payment_status,
        delivery_address,
        district,
        state,
        pincode,
        phone
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
    return { orderId, total_amount };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Get Orders placed by Buyer
const getOrdersByBuyerId = async (buyer_id) => {
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC',
    [buyer_id]
  );
  return rows;
};

// Get Order Details with items
const getOrderById = async (order_id) => {
  const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [order_id]);
  if (orders.length === 0) return null;

  const order = orders[0];
  const [items] = await pool.query(
    `SELECT oi.*, p.image_url, p.unit
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
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
       o.order_status, o.payment_status, o.payment_method,
       o.delivery_address, o.district, o.state, o.pincode, o.phone AS buyer_phone,
       u.full_name AS buyer_name, u.email AS buyer_email
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN users u ON o.buyer_id = u.id
     WHERE oi.farmer_id = ?
     ORDER BY oi.created_at DESC`,
    [farmer_id]
  );
  return rows;
};

// Update Order Status (Farmer role operation)
const updateOrderStatus = async (order_id, new_status) => {
  const [result] = await pool.query(
    'UPDATE orders SET order_status = ? WHERE id = ?',
    [new_status, order_id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  createOrderTransaction,
  getOrdersByBuyerId,
  getOrderById,
  getOrdersForFarmer,
  updateOrderStatus
};
