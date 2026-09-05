const { pool } = require('../config/db');

// Find user by email
const findUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

// Find user by ID
const findUserById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = ?',
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

module.exports = {
  findUserByEmail,
  findUserById,
  createUser
};
