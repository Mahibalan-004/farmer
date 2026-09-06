const bulkRequestModel = require('../models/bulkRequestModel');

// POST /api/bulk-requests
const createRequest = async (req, res) => {
  try {
    if (req.user.role !== 'Bulk Buyer' && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Bulk Buyers can submit Bulk Order Requests'
      });
    }

    const { product_name, category, required_quantity, unit, delivery_location, preferred_delivery_date, additional_notes } = req.body;

    if (!product_name || !product_name.trim()) {
      return res.status(400).json({ success: false, message: 'Product Name is required' });
    }
    const numQty = parseFloat(required_quantity);
    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({ success: false, message: 'Required Quantity must be greater than 0' });
    }
    if (!delivery_location || delivery_location.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Delivery Location must be at least 5 characters long' });
    }
    if (!preferred_delivery_date) {
      return res.status(400).json({ success: false, message: 'Preferred Delivery Date is required' });
    }

    const newRequest = await bulkRequestModel.createBulkRequest(req.user.id, {
      product_name: product_name.trim(),
      category: category ? category.trim() : 'Crops',
      required_quantity: numQty,
      unit: unit ? unit.trim() : 'kg',
      delivery_location: delivery_location.trim(),
      preferred_delivery_date,
      additional_notes: additional_notes ? additional_notes.trim() : null
    });

    return res.status(201).json({
      success: true,
      message: 'Bulk order request submitted successfully',
      data: newRequest
    });
  } catch (error) {
    console.error('Error creating bulk request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit bulk order request'
    });
  }
};

// GET /api/bulk-requests/my-requests
const getMyRequests = async (req, res) => {
  try {
    const requests = await bulkRequestModel.getBulkRequestsByBuyerId(req.user.id);
    return res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching bulk requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bulk requests'
    });
  }
};

// GET /api/bulk-requests/matching
const getMatchingRequests = async (req, res) => {
  try {
    if (req.user.role !== 'Farmer' && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Farmers can view matching bulk requests'
      });
    }

    const requests = await bulkRequestModel.getMatchingBulkRequestsForFarmer(req.user.id);
    return res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching matching bulk requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch matching bulk requests'
    });
  }
};

// PUT /api/bulk-requests/:id/availability
const respondAvailability = async (req, res) => {
  try {
    if (req.user.role !== 'Farmer' && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Farmers can respond to bulk requests'
      });
    }

    const requestId = parseInt(req.params.id, 10);
    const { availability_status, notes } = req.body;

    if (!['Available', 'Not Available'].includes(availability_status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Available' or 'Not Available'"
      });
    }

    const response = await bulkRequestModel.upsertFarmerResponse(requestId, req.user.id, {
      availability_status,
      notes
    });

    return res.status(200).json({
      success: true,
      message: `Availability marked as ${availability_status}`,
      data: response
    });
  } catch (error) {
    console.error('Error recording farmer availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record availability response'
    });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getMatchingRequests,
  respondAvailability
};
