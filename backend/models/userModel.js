const { pool } = require('../config/db');

// Find user by email
const findUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

// Find user by ID
const findUserById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, phone, role, farm_location, district, state, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
};

// Create a new user
const createUser = async ({ full_name, email, phone, password, role }) => {
  const [result] = await pool.query(
    'INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
    [full_name, email, phone, password, role]
  );
  return result.insertId;
};

// Update user profile
const updateUserProfile = async (id, { full_name, phone, farm_location, district, state }) => {
  await pool.query(
    `UPDATE users 
     SET full_name = COALESCE(?, full_name), 
         phone = COALESCE(?, phone), 
         farm_location = COALESCE(?, farm_location), 
         district = COALESCE(?, district), 
         state = COALESCE(?, state) 
     WHERE id = ?`,
    [full_name, phone, farm_location, district, state, id]
  );
  return await findUserById(id);
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile
};
