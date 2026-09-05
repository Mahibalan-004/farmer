const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agrif2c_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to test connection status on server startup
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Connected Successfully');
    connection.release();
    return { success: true, message: 'MySQL Connected Successfully' };
  } catch (error) {
    console.error('❌ MySQL Connection Failed:', error.message);
    return { success: false, message: `MySQL Connection Failed: ${error.message}` };
  }
};

module.exports = {
  pool,
  testConnection
};
