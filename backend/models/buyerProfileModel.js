const { pool } = require('../config/db');

// Get buyer profile by user_id
const getBuyerProfileByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT bp.*, u.full_name as user_full_name, u.email as user_email, u.phone as user_phone, u.role
     FROM buyer_profiles bp
     JOIN users u ON bp.user_id = u.id
     WHERE bp.user_id = ?`,
    [userId]
  );
  return rows[0] || null;
};

// Upsert buyer profile
const upsertBuyerProfile = async (userId, data) => {
  const { business_type, business_name, contact_person, business_phone, address, district, state, pincode } = data;
  
  const [existing] = await pool.query('SELECT id FROM buyer_profiles WHERE user_id = ?', [userId]);

  if (existing.length > 0) {
    await pool.query(
      `UPDATE buyer_profiles 
       SET business_type = ?, business_name = ?, contact_person = ?, business_phone = ?, address = ?, district = ?, state = ?, pincode = ?
       WHERE user_id = ?`,
      [business_type, business_name, contact_person, business_phone, address, district, state, pincode, userId]
    );
  } else {
    await pool.query(
      `INSERT INTO buyer_profiles (user_id, business_type, business_name, contact_person, business_phone, address, district, state, pincode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, business_type, business_name, contact_person, business_phone, address, district, state, pincode]
    );
  }

  return await getBuyerProfileByUserId(userId);
};

module.exports = {
  getBuyerProfileByUserId,
  upsertBuyerProfile
};
