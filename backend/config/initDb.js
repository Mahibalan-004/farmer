const { pool } = require('./db');

const initDb = async () => {
  try {
    // 1. Create Users Table if not exists
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('Farmer', 'Consumer', 'Retailer', 'Restaurant', 'Bulk Buyer', 'Admin') NOT NULL DEFAULT 'Consumer',
        farm_location VARCHAR(255) DEFAULT NULL,
        district VARCHAR(100) DEFAULT NULL,
        state VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createUsersTableQuery);

    // Helper for safe column addition compatible with all MySQL versions
    const addColumnSafely = async (table, column, definition) => {
      try {
        await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      } catch (err) {
        // Ignored if column already exists (ER_DUP_FIELDNAME - 1060)
      }
    };

    await addColumnSafely('users', 'farm_location', 'VARCHAR(255) DEFAULT NULL');
    await addColumnSafely('users', 'district', 'VARCHAR(100) DEFAULT NULL');
    await addColumnSafely('users', 'state', 'VARCHAR(100) DEFAULT NULL');

    // 2. Create Products Table if not exists
    const createProductsTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        farmer_id INT NOT NULL,
        crop_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        location VARCHAR(255),
        district VARCHAR(100),
        state VARCHAR(100),
        harvest_date DATE,
        quality_grade VARCHAR(50),
        description TEXT,
        image_url VARCHAR(500),
        available_date DATE,
        status ENUM('Available', 'Sold Out', 'Inactive') DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;
    await pool.query(createProductsTableQuery);

    console.log('📋 Database Tables Initialized (users & products tables ready)');
  } catch (error) {
    console.error('❌ Error initializing database tables:', error.message);
  }
};

module.exports = { initDb };
