const routeModel = require('../models/routeModel');

// POST /api/routes/optimize/:deliveryId
const optimizeRoute = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    if (!deliveryId) {
      return res.status(400).json({ success: false, message: 'Delivery ID is required.' });
    }

    const { customPickupLat, customPickupLng, customDeliveryLat, customDeliveryLng, customSpeed } = req.body || {};

    const routeData = await routeModel.optimizeDeliveryRoute(deliveryId, {
      customPickupLat,
      customPickupLng,
      customDeliveryLat,
      customDeliveryLng,
      customSpeed
    });

    if (!routeData) {
      return res.status(404).json({ success: false, message: 'Unable to calculate the route for this delivery.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Route optimized successfully!',
      route: routeData
    });
  } catch (error) {
    console.error('Route optimization controller error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Route optimization failed. Please try again.'
    });
  }
};

// GET /api/routes/:deliveryId
const getRouteByDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    if (!deliveryId) {
      return res.status(400).json({ success: false, message: 'Delivery ID is required.' });
    }

    const routeData = await routeModel.getRouteByDeliveryId(deliveryId);

    if (!routeData) {
      return res.status(404).json({ success: false, message: 'Route information not found.' });
    }

    return res.status(200).json({
      success: true,
      route: routeData
    });
  } catch (error) {
    console.error('Get route controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch route details.'
    });
  }
};

// GET /api/routes
const getAllRoutesList = async (req, res) => {
  try {
    const { status, search } = req.query;
    const routes = await routeModel.getAllRoutes({ status, search });

    return res.status(200).json({
      success: true,
      count: routes.length,
      routes
    });
  } catch (error) {
    console.error('Get all routes controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch routes list.'
    });
  }
};

module.exports = {
  optimizeRoute,
  getRouteByDelivery,
  getAllRoutesList
};
