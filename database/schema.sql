-- AGRIF2C Database Schema
-- Database: agrif2c_db

CREATE DATABASE IF NOT EXISTS agrif2c_db;
USE agrif2c_db;

-- 1. Users Table
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

-- 2. Products Table
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
