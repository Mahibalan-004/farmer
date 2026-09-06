const { pool } = require('./db');
const bcrypt = require('bcryptjs');

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
        order_number VARCHAR(50) DEFAULT NULL,
        buyer_id INT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash on Delivery',
        payment_status ENUM('Pending', 'Paid') DEFAULT 'Pending',
        order_status ENUM('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
        delivery_name VARCHAR(255) DEFAULT NULL,
        delivery_phone VARCHAR(50) DEFAULT NULL,
        delivery_address TEXT NOT NULL,
        district VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await addColumnSafely('orders', 'order_number', 'VARCHAR(50) DEFAULT NULL');
    await addColumnSafely('orders', 'delivery_name', 'VARCHAR(255) DEFAULT NULL');
    await addColumnSafely('orders', 'delivery_phone', 'VARCHAR(50) DEFAULT NULL');

    // Ensure order_status ENUM column is updated for existing databases
    try {
      await pool.query(`
        ALTER TABLE orders 
        MODIFY COLUMN order_status ENUM('Pending', 'Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending'
      `);
    } catch (enumErr) {
      console.log('Notice updating orders order_status enum:', enumErr.message);
    }

    // Safely migrate existing order numbers to clean sequential format AGRIF2C-000001, AGRIF2C-000002...
    try {
      await pool.query(`
        UPDATE orders 
        SET order_number = CONCAT('AGRIF2C-', LPAD(id, 6, '0'))
        WHERE order_number IS NULL OR order_number NOT LIKE 'AGRIF2C-%'
      `);
    } catch (migErr) {
      console.log('Notice migrating order numbers:', migErr.message);
    }

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

    // 7. Create Delivery Partners Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS delivery_partners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) DEFAULT NULL,
        vehicle_type ENUM('Bike', 'Auto', 'Van', 'Truck') NOT NULL DEFAULT 'Bike',
        vehicle_number VARCHAR(50) NOT NULL,
        availability_status ENUM('Available', 'Busy', 'Offline') NOT NULL DEFAULT 'Available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default delivery partners if empty
    const [existingPartners] = await pool.query('SELECT COUNT(*) AS count FROM delivery_partners');
    if (existingPartners[0].count === 0) {
      await pool.query(`
        INSERT INTO delivery_partners (full_name, phone, email, vehicle_type, vehicle_number, availability_status) VALUES
        ('Ramesh Kumar', '+91 98765 43210', 'ramesh.logistics@agrif2c.com', 'Van', 'TN-37-AB-1234', 'Available'),
        ('Suresh Patel', '+91 98765 43211', 'suresh.logistics@agrif2c.com', 'Truck', 'TN-37-CD-5678', 'Available'),
        ('Anita Sharma', '+91 98765 43212', 'anita.express@agrif2c.com', 'Auto', 'TN-37-EF-9012', 'Available')
      `);
    }

    // 8. Create Deliveries Table (Future AI Route Optimization Preparedness)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL UNIQUE,
        delivery_partner_id INT DEFAULT NULL,
        pickup_address TEXT DEFAULT NULL,
        pickup_district VARCHAR(100) DEFAULT NULL,
        pickup_state VARCHAR(100) DEFAULT NULL,
        delivery_address TEXT DEFAULT NULL,
        delivery_district VARCHAR(100) DEFAULT NULL,
        delivery_state VARCHAR(100) DEFAULT NULL,
        delivery_status ENUM('Pending', 'Ready for Pickup', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Pending',
        estimated_delivery_date DATE DEFAULT NULL,
        picked_up_at TIMESTAMP NULL DEFAULT NULL,
        delivered_at TIMESTAMP NULL DEFAULT NULL,
        route_notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners(id) ON DELETE SET NULL
      );
    `);

    // Add lat/long columns safely to deliveries table for existing schemas
    await addColumnSafely('deliveries', 'pickup_latitude', 'DECIMAL(10,8) DEFAULT NULL');
    await addColumnSafely('deliveries', 'pickup_longitude', 'DECIMAL(11,8) DEFAULT NULL');
    await addColumnSafely('deliveries', 'delivery_latitude', 'DECIMAL(10,8) DEFAULT NULL');
    await addColumnSafely('deliveries', 'delivery_longitude', 'DECIMAL(11,8) DEFAULT NULL');

    // 9. Create Routes Table for Smart Route Optimization
    await pool.query(`
      CREATE TABLE IF NOT EXISTS routes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        delivery_id INT NOT NULL UNIQUE,
        pickup_latitude DECIMAL(10,8) NOT NULL,
        pickup_longitude DECIMAL(11,8) NOT NULL,
        delivery_latitude DECIMAL(10,8) NOT NULL,
        delivery_longitude DECIMAL(11,8) NOT NULL,
        total_distance_km DECIMAL(10,2) NOT NULL,
        estimated_duration_minutes INT NOT NULL,
        average_speed_kmh INT DEFAULT 40,
        route_classification ENUM('Short Distance', 'Medium Distance', 'Long Distance') NOT NULL DEFAULT 'Short Distance',
        suggested_route_summary TEXT DEFAULT NULL,
        route_status ENUM('Not Optimized', 'Optimized') NOT NULL DEFAULT 'Optimized',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
      );
    `);

    // 10. Create Buyer Profiles Table (Retailer, Restaurant, Bulk Buyer)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS buyer_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        business_type ENUM('Retailer', 'Restaurant', 'Bulk Buyer') NOT NULL,
        business_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255) NOT NULL,
        business_phone VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        district VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 11. Create Bulk Order Requests Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bulk_order_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        request_number VARCHAR(50) DEFAULT NULL,
        buyer_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT NULL,
        required_quantity DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL DEFAULT 'kg',
        delivery_location TEXT NOT NULL,
        preferred_delivery_date DATE NOT NULL,
        additional_notes TEXT DEFAULT NULL,
        status ENUM('Pending', 'Reviewed', 'Accepted', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Ensure bulk_order_requests request_number LPAD migration
    try {
      await pool.query(`
        UPDATE bulk_order_requests 
        SET request_number = CONCAT('BULK-', LPAD(id, 6, '0'))
        WHERE request_number IS NULL OR request_number NOT LIKE 'BULK-%'
      `);
    } catch (migErr) {
      console.log('Notice migrating bulk request numbers:', migErr.message);
    }

    // 12. Create Bulk Request Responses Table (Farmer Availability)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bulk_request_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bulk_request_id INT NOT NULL,
        farmer_id INT NOT NULL,
        availability_status ENUM('Available', 'Not Available') NOT NULL,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (bulk_request_id) REFERENCES bulk_order_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_farmer_request (bulk_request_id, farmer_id)
      );
    `);

    // 13. Seed default Admin user if no Admin user exists in database
    const [existingAdmin] = await pool.query("SELECT id FROM users WHERE role = 'Admin' LIMIT 1");
    if (existingAdmin.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);
      await pool.query(
        `INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)`,
        ['System Administrator', 'admin@agrif2c.com', '+91 99999 00000', hashedPassword, 'Admin']
      );
      console.log('👑 Default Admin account seeded: admin@agrif2c.com');
    }

    console.log('📋 Database Tables Initialized (users, products, carts, cart_items, orders, order_items, delivery_partners, deliveries, routes, buyer_profiles, bulk_order_requests, bulk_request_responses, admin user ready)');
  } catch (error) {
    console.error('❌ Error initializing database tables:', error.message);
  }
};

module.exports = { initDb };
