const { pool } = require('../config/db');

// State Machine for Delivery Status Transitions
const DELIVERY_STATUS_TRANSITIONS = {
  'Pending': ['Ready for Pickup', 'Cancelled'],
  'Placed': ['Ready for Pickup', 'Cancelled'],
  'Confirmed': ['Ready for Pickup', 'Cancelled'],
  'Processing': ['Ready for Pickup', 'Cancelled'],
  'Ready for Pickup': ['Picked Up', 'Cancelled'],
  'Picked Up': ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Cancelled'],
  'Delivered': [],
  'Cancelled': []
};

// Ensure a delivery record exists for an order
const ensureDeliveryRecord = async (order_id) => {
  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.query('SELECT * FROM deliveries WHERE order_id = ?', [order_id]);
    if (existing.length > 0) {
      return existing[0];
    }

    // Fetch order details & buyer details
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ?', [order_id]);
    if (orders.length === 0) return null;
    const order = orders[0];

    // Fetch farmer details from order_items
    const [items] = await connection.query(
      `SELECT oi.farmer_id, u.full_name, u.farm_location, u.district, u.state 
       FROM order_items oi 
       JOIN users u ON oi.farmer_id = u.id 
       WHERE oi.order_id = ? LIMIT 1`,
      [order_id]
    );

    const farmer = items.length > 0 ? items[0] : {};
    const pickup_address = farmer.farm_location || 'Farmer Location';
    const pickup_district = farmer.district || order.district;
    const pickup_state = farmer.state || order.state;

    // Insert delivery entry
    const [result] = await connection.query(
      `INSERT INTO deliveries (
        order_id, pickup_address, pickup_district, pickup_state,
        delivery_address, delivery_district, delivery_state, delivery_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_id,
        pickup_address,
        pickup_district,
        pickup_state,
        order.delivery_address,
        order.district,
        order.state,
        'Pending'
      ]
    );

    const [created] = await connection.query('SELECT * FROM deliveries WHERE id = ?', [result.insertId]);
    return created[0];
  } finally {
    connection.release();
  }
};

// Get All Deliveries for Admin Dashboard with filtering & search
const getAllDeliveries = async ({ status, search } = {}) => {
  let query = `
    SELECT 
      d.*,
      o.order_number, o.total_amount, o.payment_method, o.payment_status, o.created_at AS order_date,
      o.delivery_name AS buyer_name, o.delivery_phone AS buyer_phone, u_buyer.email AS buyer_email,
      u_farmer.full_name AS farmer_name, u_farmer.phone AS farmer_phone, u_farmer.farm_location,
      dp.full_name AS partner_name, dp.phone AS partner_phone, dp.vehicle_type, dp.vehicle_number, dp.availability_status AS partner_status
    FROM deliveries d
    JOIN orders o ON d.order_id = o.id
    JOIN users u_buyer ON o.buyer_id = u_buyer.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN users u_farmer ON oi.farmer_id = u_farmer.id
    LEFT JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
  `;

  const whereClauses = [];
  const queryParams = [];

  if (status && status !== 'All') {
    whereClauses.push('d.delivery_status = ?');
    queryParams.push(status);
  }

  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    whereClauses.push(`(
      o.order_number LIKE ? OR 
      o.id LIKE ? OR 
      o.delivery_name LIKE ? OR 
      u_farmer.full_name LIKE ? OR 
      dp.full_name LIKE ?
    )`);
    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' GROUP BY d.id ORDER BY d.created_at DESC';

  const [deliveries] = await pool.query(query, queryParams);
  return deliveries;
};

// Get Delivery Details by Order ID
const getDeliveryByOrderId = async (order_id) => {
  await ensureDeliveryRecord(order_id);

  const [rows] = await pool.query(
    `SELECT 
      d.*,
      o.order_number, o.total_amount, o.payment_method, o.payment_status, o.created_at AS order_date,
      o.delivery_name AS buyer_name, o.delivery_phone AS buyer_phone, o.pincode AS delivery_pincode,
      u_buyer.email AS buyer_email,
      u_farmer.full_name AS farmer_name, u_farmer.phone AS farmer_phone, u_farmer.farm_location,
      dp.full_name AS partner_name, dp.phone AS partner_phone, dp.email AS partner_email,
      dp.vehicle_type, dp.vehicle_number, dp.availability_status AS partner_status
    FROM deliveries d
    JOIN orders o ON d.order_id = o.id
    JOIN users u_buyer ON o.buyer_id = u_buyer.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN users u_farmer ON oi.farmer_id = u_farmer.id
    LEFT JOIN delivery_partners dp ON d.delivery_partner_id = dp.id
    WHERE d.order_id = ?
    LIMIT 1`,
    [order_id]
  );

  return rows.length > 0 ? rows[0] : null;
};

// Assign Delivery Partner and Set Estimated Delivery Date
const updateDeliveryAssignment = async (order_id, { delivery_partner_id, estimated_delivery_date, route_notes }) => {
  await ensureDeliveryRecord(order_id);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const updates = [];
    const params = [];

    if (delivery_partner_id !== undefined) {
      updates.push('delivery_partner_id = ?');
      params.push(delivery_partner_id ? parseInt(delivery_partner_id) : null);
    }

    if (estimated_delivery_date !== undefined) {
      updates.push('estimated_delivery_date = ?');
      params.push(estimated_delivery_date || null);
    }

    if (route_notes !== undefined) {
      updates.push('route_notes = ?');
      params.push(route_notes);
    }

    if (updates.length > 0) {
      params.push(order_id);
      await connection.query(
        `UPDATE deliveries SET ${updates.join(', ')} WHERE order_id = ?`,
        params
      );
    }

    // Update partner status to Busy if assigned
    if (delivery_partner_id) {
      await connection.query(
        "UPDATE delivery_partners SET availability_status = 'Busy' WHERE id = ?",
        [delivery_partner_id]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Update Delivery Status with State Machine & Synchronize Orders Table
const updateDeliveryStatus = async (order_id, new_status) => {
  await ensureDeliveryRecord(order_id);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [deliveries] = await connection.query('SELECT * FROM deliveries WHERE order_id = ? FOR UPDATE', [order_id]);
    if (deliveries.length === 0) {
      throw new Error('Delivery record not found');
    }

    const currentStatus = deliveries[0].delivery_status;

    if (currentStatus === new_status) {
      await connection.commit();
      return true;
    }

    const allowedNext = DELIVERY_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(new_status)) {
      throw new Error(`Invalid delivery status transition from "${currentStatus}" to "${new_status}". Allowed next status: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'None'}`);
    }

    let timestampUpdate = '';
    if (new_status === 'Picked Up') {
      timestampUpdate = ', picked_up_at = CURRENT_TIMESTAMP';
    } else if (new_status === 'Delivered') {
      timestampUpdate = ', delivered_at = CURRENT_TIMESTAMP';
    }

    // Update deliveries table
    await connection.query(
      `UPDATE deliveries SET delivery_status = ? ${timestampUpdate} WHERE order_id = ?`,
      [new_status, order_id]
    );

    // Synchronize orders table ONLY with valid order statuses
    if (new_status === 'Picked Up' || new_status === 'Out for Delivery') {
      await connection.query(
        "UPDATE orders SET order_status = 'Shipped' WHERE id = ?",
        [order_id]
      );
    } else if (new_status === 'Delivered') {
      await connection.query(
        "UPDATE orders SET order_status = 'Delivered' WHERE id = ?",
        [order_id]
      );
    } else if (new_status === 'Cancelled') {
      await connection.query(
        "UPDATE orders SET order_status = 'Cancelled' WHERE id = ?",
        [order_id]
      );
    }

    // If delivered, set delivery partner status back to Available
    if (new_status === 'Delivered' && deliveries[0].delivery_partner_id) {
      await connection.query(
        "UPDATE delivery_partners SET availability_status = 'Available' WHERE id = ?",
        [deliveries[0].delivery_partner_id]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Delivery Partner CRUD Functions
const getDeliveryPartners = async () => {
  const [rows] = await pool.query('SELECT * FROM delivery_partners ORDER BY created_at DESC');
  return rows;
};

const createDeliveryPartner = async ({ full_name, phone, email, vehicle_type, vehicle_number, availability_status }) => {
  const [result] = await pool.query(
    `INSERT INTO delivery_partners (full_name, phone, email, vehicle_type, vehicle_number, availability_status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      full_name,
      phone,
      email || null,
      vehicle_type || 'Bike',
      vehicle_number,
      availability_status || 'Available'
    ]
  );
  const [created] = await pool.query('SELECT * FROM delivery_partners WHERE id = ?', [result.insertId]);
  return created[0];
};

const updateDeliveryPartner = async (id, { full_name, phone, email, vehicle_type, vehicle_number, availability_status }) => {
  await pool.query(
    `UPDATE delivery_partners 
     SET full_name = ?, phone = ?, email = ?, vehicle_type = ?, vehicle_number = ?, availability_status = ?
     WHERE id = ?`,
    [
      full_name,
      phone,
      email || null,
      vehicle_type || 'Bike',
      vehicle_number,
      availability_status || 'Available',
      id
    ]
  );
  const [updated] = await pool.query('SELECT * FROM delivery_partners WHERE id = ?', [id]);
  return updated.length > 0 ? updated[0] : null;
};

const deleteDeliveryPartner = async (id) => {
  await pool.query('DELETE FROM delivery_partners WHERE id = ?', [id]);
  return true;
};

// Summary Statistics for Admin Logistics Dashboard
const getDeliveryStats = async () => {
  const [rows] = await pool.query(`
    SELECT 
      COUNT(*) AS total_deliveries,
      SUM(CASE WHEN delivery_status = 'Ready for Pickup' THEN 1 ELSE 0 END) AS ready_for_pickup,
      SUM(CASE WHEN delivery_status = 'Picked Up' THEN 1 ELSE 0 END) AS picked_up,
      SUM(CASE WHEN delivery_status = 'Out for Delivery' THEN 1 ELSE 0 END) AS out_for_delivery,
      SUM(CASE WHEN delivery_status = 'Delivered' THEN 1 ELSE 0 END) AS delivered,
      SUM(CASE WHEN delivery_status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
      SUM(CASE WHEN delivery_partner_id IS NULL AND delivery_status != 'Cancelled' THEN 1 ELSE 0 END) AS unassigned
    FROM deliveries
  `);

  return rows[0];
};

module.exports = {
  ensureDeliveryRecord,
  getAllDeliveries,
  getDeliveryByOrderId,
  updateDeliveryAssignment,
  updateDeliveryStatus,
  getDeliveryPartners,
  createDeliveryPartner,
  updateDeliveryPartner,
  deleteDeliveryPartner,
  getDeliveryStats
};
