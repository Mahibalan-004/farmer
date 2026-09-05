const { pool } = require('./db');

const initDb = async () => {
  try {
    // 1. Create Users Table if not exists
    await pool.query(`
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
    `);

    // Helper for safe column addition compatible with all MySQL versions
    const addColumnSafely = async (table, column, definition) => {
      try {
        await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      } catch (err) {
        // Ignored if column already exists
      }
    };

    await addColumnSafely('users', 'farm_location', 'VARCHAR(255) DEFAULT NULL');
    await addColumnSafely('users', 'district', 'VARCHAR(100) DEFAULT NULL');
    await addColumnSafely('users', 'state', 'VARCHAR(100) DEFAULT NULL');

    // 2. Create Products Table if not exists
    await pool.query(`
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
    `);

    // 3. Create Carts Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 4. Create Cart Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    // 5. Create Orders Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buyer_id INT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 50.00,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash on Delivery',
        payment_status ENUM('Pending', 'Paid') DEFAULT 'Pending',
        order_status ENUM('Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Placed',
        delivery_address TEXT NOT NULL,
        district VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 6. Create Order Items Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        farmer_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        price_per_unit DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log('📋 Database Tables Initialized (users, products, carts, cart_items, orders, order_items ready)');
  } catch (error) {
    console.error('❌ Error initializing database tables:', error.message);
  }
};

module.exports = { initDb };
