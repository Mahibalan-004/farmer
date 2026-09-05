// Health Check Controller
const getHealthStatus = (req, res) => {
  res.status(200).json({
    message: "AGRIF2C Backend is Running Successfully"
  });
};

module.exports = {
  getHealthStatus
};
