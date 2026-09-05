const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/db');
const { initDb } = require('./config/initDb');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const routeRoutes = require('./routes/routeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/delivery-partners', deliveryRoutes);
app.use('/api/routes', routeRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.send('Welcome to AGRIF2C API Server');
});

// Start Server, verify MySQL connection, and initialize database tables
app.listen(PORT, async () => {
  console.log(`🚀 AGRIF2C Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check endpoint available at http://localhost:${PORT}/api/health`);
  
  // Test MySQL connection & initialize database tables on server startup
  const dbStatus = await testConnection();
  if (dbStatus.success) {
    await initDb();
  }
});
