const { pool } = require('../config/db');

// Create a bulk request and format request_number as BULK-000001
const createBulkRequest = async (buyerId, data) => {
  const { product_name, category, required_quantity, unit, delivery_location, preferred_delivery_date, additional_notes } = data;

  const [result] = await pool.query(
    `INSERT INTO bulk_order_requests (buyer_id, product_name, category, required_quantity, unit, delivery_location, preferred_delivery_date, additional_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [buyerId, product_name, category || 'General', required_quantity, unit || 'kg', delivery_location, preferred_delivery_date, additional_notes || null]
  );

  const insertId = result.insertId;
  const requestNumber = `BULK-${String(insertId).padStart(6, '0')}`;

  await pool.query(
    'UPDATE bulk_order_requests SET request_number = ? WHERE id = ?',
    [requestNumber, insertId]
  );

  return await getBulkRequestById(insertId);
};

// Get bulk request by ID
const getBulkRequestById = async (id) => {
  const [rows] = await pool.query(
    `SELECT r.*, u.full_name as buyer_name, u.phone as buyer_phone, u.email as buyer_email
     FROM bulk_order_requests r
     JOIN users u ON r.buyer_id = u.id
     WHERE r.id = ?`,
    [id]
  );
  return rows[0] || null;
};

// Get all bulk requests created by a specific buyer
const getBulkRequestsByBuyerId = async (buyerId) => {
  const [rows] = await pool.query(
    `SELECT r.*, 
       (SELECT COUNT(*) FROM bulk_request_responses br WHERE br.bulk_request_id = r.id AND br.availability_status = 'Available') as interested_farmers_count
     FROM bulk_order_requests r
     WHERE r.buyer_id = ?
     ORDER BY r.created_at DESC`,
    [buyerId]
  );
  return rows;
};

// Get matching bulk requests for a farmer
const getMatchingBulkRequestsForFarmer = async (farmerId) => {
  // Fetch products grown by this farmer to match categories / crops
  const [farmerCrops] = await pool.query(
    'SELECT DISTINCT crop_name, category FROM products WHERE farmer_id = ?',
    [farmerId]
  );

  const cropNames = farmerCrops.map(c => c.crop_name.toLowerCase());
  const categories = farmerCrops.map(c => c.category.toLowerCase());

  const [allRequests] = await pool.query(
    `SELECT r.id, r.request_number, r.product_name, r.category, r.required_quantity, r.unit, 
            r.delivery_location, r.preferred_delivery_date, r.additional_notes, r.status, r.created_at,
            br.availability_status as farmer_response_status, br.notes as farmer_response_notes
     FROM bulk_order_requests r
     LEFT JOIN bulk_request_responses br ON r.id = br.bulk_request_id AND br.farmer_id = ?
     WHERE r.status != 'Cancelled'
     ORDER BY r.created_at DESC`,
    [farmerId]
  );

  // If farmer has specific crops, prioritize matching requests; fallback to all active requests
  if (cropNames.length > 0 || categories.length > 0) {
    return allRequests.map(req => {
      const isMatch = cropNames.includes(req.product_name.toLowerCase()) || 
                      categories.includes((req.category || '').toLowerCase());
      return { ...req, is_direct_match: isMatch };
    });
  }

  return allRequests.map(req => ({ ...req, is_direct_match: true }));
};

// Upsert farmer response for a bulk request
const upsertFarmerResponse = async (requestId, farmerId, { availability_status, notes }) => {
  const [existing] = await pool.query(
    'SELECT id FROM bulk_request_responses WHERE bulk_request_id = ? AND farmer_id = ?',
    [requestId, farmerId]
  );

  if (existing.length > 0) {
    await pool.query(
      `UPDATE bulk_request_responses 
       SET availability_status = ?, notes = ?
       WHERE bulk_request_id = ? AND farmer_id = ?`,
      [availability_status, notes || null, requestId, farmerId]
    );
  } else {
    await pool.query(
      `INSERT INTO bulk_request_responses (bulk_request_id, farmer_id, availability_status, notes)
       VALUES (?, ?, ?, ?)`,
      [requestId, farmerId, availability_status, notes || null]
    );
  }

  // Update request status if reviewing
  await pool.query(
    "UPDATE bulk_order_requests SET status = 'Reviewed' WHERE id = ? AND status = 'Pending'",
    [requestId]
  );

  return { bulk_request_id: requestId, farmer_id: farmerId, availability_status, notes };
};

module.exports = {
  createBulkRequest,
  getBulkRequestById,
  getBulkRequestsByBuyerId,
  getMatchingBulkRequestsForFarmer,
  upsertFarmerResponse
};
