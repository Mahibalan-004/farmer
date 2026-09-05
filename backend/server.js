const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', healthRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.send('Welcome to AGRIF2C API Server');
});

// Start Server and test MySQL connection
app.listen(PORT, async () => {
  console.log(`🚀 AGRIF2C Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check endpoint available at http://localhost:${PORT}/api/health`);
  
  // Test MySQL connection on server startup
  await testConnection();
});
