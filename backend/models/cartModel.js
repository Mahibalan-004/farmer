const { pool } = require('../config/db');

// Get or create cart for user
const getOrCreateCart = async (user_id) => {
  const [rows] = await pool.query('SELECT * FROM carts WHERE user_id = ?', [user_id]);
  if (rows.length > 0) {
    return rows[0];
  }

  const [result] = await pool.query('INSERT INTO carts (user_id) VALUES (?)', [user_id]);
  const [newCart] = await pool.query('SELECT * FROM carts WHERE id = ?', [result.insertId]);
  return newCart[0];
};

// Get cart items with product details
const getCartItems = async (cart_id) => {
  const [rows] = await pool.query(
    `SELECT 
       ci.id AS item_id, ci.cart_id, ci.product_id, ci.quantity AS cart_quantity,
       p.crop_name, p.category, p.unit, p.price_per_unit, p.image_url,
       p.quantity AS stock_quantity, p.status AS product_status,
       p.farmer_id, p.location, p.district, p.state,
       u.full_name AS farmer_name
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     JOIN users u ON p.farmer_id = u.id
     WHERE ci.cart_id = ?
     ORDER BY ci.created_at DESC`,
    [cart_id]
  );
  return rows;
};

// Add or update item in cart
const addOrUpdateCartItem = async (cart_id, product_id, requested_qty) => {
  // Check if item already exists in cart
  const [existing] = await pool.query(
    'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
    [cart_id, product_id]
  );

  if (existing.length > 0) {
    const newQty = parseFloat(existing[0].quantity) + parseFloat(requested_qty);
    await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ?',
      [newQty, existing[0].id]
    );
    return existing[0].id;
  } else {
    const [result] = await pool.query(
      'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
      [cart_id, product_id, requested_qty]
    );
    return result.insertId;
  }
};

// Update item quantity
const updateCartItemQuantity = async (item_id, cart_id, new_qty) => {
  const [result] = await pool.query(
    'UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?',
    [new_qty, item_id, cart_id]
  );
  return result.affectedRows > 0;
};

// Remove item from cart
const removeCartItem = async (item_id, cart_id) => {
  const [result] = await pool.query(
    'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
    [item_id, cart_id]
  );
  return result.affectedRows > 0;
};

// Clear entire cart
const clearCart = async (cart_id) => {
  await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cart_id]);
};

module.exports = {
  getOrCreateCart,
  getCartItems,
  addOrUpdateCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
};
