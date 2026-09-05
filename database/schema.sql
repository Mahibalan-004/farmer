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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
