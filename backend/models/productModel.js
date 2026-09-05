const { pool } = require('../config/db');

// Create Product
const createProduct = async (productData) => {
  const {
    farmer_id,
    crop_name,
    category,
    quantity,
    unit,
    price_per_unit,
    location,
    district,
    state,
    harvest_date,
    quality_grade,
    description,
    image_url,
    available_date,
    status
  } = productData;

  const [result] = await pool.query(
    `INSERT INTO products (
      farmer_id, crop_name, category, quantity, unit, price_per_unit,
      location, district, state, harvest_date, quality_grade, description,
      image_url, available_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      farmer_id, crop_name, category, quantity, unit, price_per_unit,
      location || null, district || null, state || null, harvest_date || null,
      quality_grade || null, description || null, image_url || null,
      available_date || null, status || 'Available'
    ]
  );
  return result.insertId;
};

// Get Product by ID
const getProductById = async (id) => {
  const [rows] = await pool.query(
    `SELECT 
       p.id, p.farmer_id, p.crop_name, p.category, p.quantity, p.unit, 
       p.price_per_unit, p.location, p.district, p.state, p.harvest_date, 
       p.quality_grade, p.description, p.image_url, p.available_date, p.status, 
       p.created_at, p.updated_at,
       u.full_name AS farmer_name, 
       u.phone AS farmer_phone, 
       u.email AS farmer_email
     FROM products p
     LEFT JOIN users u ON p.farmer_id = u.id
     WHERE p.id = ?`,
    [id]
  );
  return rows[0];
};

// Get Products owned by specific Farmer
const getProductsByFarmerId = async (farmer_id) => {
  const [rows] = await pool.query(
    'SELECT * FROM products WHERE farmer_id = ? ORDER BY created_at DESC',
    [farmer_id]
  );
  return rows;
};

// Get All Available Products (Public Market View)
const getAllAvailableProducts = async () => {
  const [rows] = await pool.query(
    `SELECT 
       p.id, p.farmer_id, p.crop_name, p.category, p.quantity, p.unit, 
       p.price_per_unit, p.location, p.district, p.state, p.harvest_date, 
       p.quality_grade, p.description, p.image_url, p.available_date, p.status, 
       p.created_at, p.updated_at,
       u.full_name AS farmer_name, 
       u.phone AS farmer_phone, 
       u.email AS farmer_email
     FROM products p
     LEFT JOIN users u ON p.farmer_id = u.id
     WHERE p.status = 'Available'
     ORDER BY p.created_at DESC`
  );
  return rows;
};

// Update Product (Strict Farmer Ownership check)
const updateProduct = async (id, farmer_id, updateData) => {
  const {
    crop_name,
    category,
    quantity,
    unit,
    price_per_unit,
    location,
    district,
    state,
    harvest_date,
    quality_grade,
    description,
    image_url,
    available_date,
    status
  } = updateData;

  const [result] = await pool.query(
    `UPDATE products 
     SET crop_name = COALESCE(?, crop_name),
         category = COALESCE(?, category),
         quantity = COALESCE(?, quantity),
         unit = COALESCE(?, unit),
         price_per_unit = COALESCE(?, price_per_unit),
         location = COALESCE(?, location),
         district = COALESCE(?, district),
         state = COALESCE(?, state),
         harvest_date = COALESCE(?, harvest_date),
         quality_grade = COALESCE(?, quality_grade),
         description = COALESCE(?, description),
         image_url = COALESCE(?, image_url),
         available_date = COALESCE(?, available_date),
         status = COALESCE(?, status)
     WHERE id = ? AND farmer_id = ?`,
    [
      crop_name, category, quantity, unit, price_per_unit,
      location, district, state, harvest_date, quality_grade,
      description, image_url, available_date, status,
      id, farmer_id
    ]
  );

  return result.affectedRows > 0;
};

// Delete Product (Strict Farmer Ownership check)
const deleteProduct = async (id, farmer_id) => {
  const [result] = await pool.query(
    'DELETE FROM products WHERE id = ? AND farmer_id = ?',
    [id, farmer_id]
  );
  return result.affectedRows > 0;
};

module.exports = {
  createProduct,
  getProductById,
  getProductsByFarmerId,
  getAllAvailableProducts,
  updateProduct,
  deleteProduct
};
