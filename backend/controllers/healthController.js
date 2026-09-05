const { testConnection } = require('../config/db');

// Health Check Controller
const getHealthStatus = async (req, res) => {
  const dbStatus = await testConnection();

  res.status(200).json({
    message: "AGRIF2C Backend is Running Successfully",
    database: dbStatus.success ? "MySQL Connected Successfully" : dbStatus.message
  });
};

module.exports = {
  getHealthStatus
};
