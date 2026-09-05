const {
  ensureDeliveryRecord,
  getAllDeliveries,
  getDeliveryByOrderId,
  updateDeliveryAssignment,
  updateDeliveryStatus,
  getDeliveryPartners,
  createDeliveryPartner,
  updateDeliveryPartner,
  deleteDeliveryPartner,
  getDeliveryStats
} = require('../models/deliveryModel');

// @desc    Get all deliveries with filters and search
// @route   GET /api/deliveries
// @access  Private (Admin, Farmer)
const getDeliveries = async (req, res) => {
  try {
    const { status, search } = req.query;
    const deliveries = await getAllDeliveries({ status, search });
    
    return res.status(200).json({
      success: true,
      count: deliveries.length,
      deliveries
    });
  } catch (error) {
    console.error('❌ Error getting deliveries:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving deliveries', error: error.message });
  }
};

// @desc    Get single delivery details by Order ID or Delivery ID
// @route   GET /api/deliveries/:id
// @access  Private
const getDeliveryById = async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await getDeliveryByOrderId(id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery record not found' });
    }

    return res.status(200).json({
      success: true,
      delivery
    });
  } catch (error) {
    console.error('❌ Error getting delivery details:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving delivery details', error: error.message });
  }
};

// @desc    Assign Delivery Partner & Estimated Delivery Date (Admin)
// @route   PUT /api/deliveries/:id/assign
// @access  Private (Admin)
const assignDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_partner_id, estimated_delivery_date, route_notes } = req.body;

    await updateDeliveryAssignment(id, {
      delivery_partner_id,
      estimated_delivery_date,
      route_notes
    });

    const updated = await getDeliveryByOrderId(id);

    return res.status(200).json({
      success: true,
      message: 'Delivery partner assigned successfully!',
      delivery: updated
    });
  } catch (error) {
    console.error('❌ Error assigning delivery partner:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to assign delivery partner' });
  }
};

// @desc    Update Delivery Status (Admin/Farmer)
// @route   PUT /api/deliveries/:id/status
// @access  Private (Admin/Farmer)
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_status, status } = req.body;
    const newStatus = delivery_status || status;

    const allowed = ['Pending', 'Ready for Pickup', 'Picked Up', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!newStatus || !allowed.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid delivery status. Allowed values: ${allowed.join(', ')}`
      });
    }

    await updateDeliveryStatus(id, newStatus);
    const updated = await getDeliveryByOrderId(id);

    return res.status(200).json({
      success: true,
      message: `Delivery status updated to '${newStatus}'!`,
      delivery: updated
    });
  } catch (error) {
    console.error('❌ Error updating delivery status:', error.message);
    return res.status(400).json({ success: false, message: error.message || 'Failed to update delivery status' });
  }
};

// @desc    Get all delivery partners
// @route   GET /api/delivery-partners
// @access  Private (Admin/Farmer)
const fetchPartners = async (req, res) => {
  try {
    const partners = await getDeliveryPartners();
    return res.status(200).json({
      success: true,
      count: partners.length,
      partners
    });
  } catch (error) {
    console.error('❌ Error getting delivery partners:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving delivery partners', error: error.message });
  }
};

// @desc    Create a new delivery partner (Admin)
// @route   POST /api/delivery-partners
// @access  Private (Admin)
const addPartner = async (req, res) => {
  try {
    const { full_name, phone, email, vehicle_type, vehicle_number, availability_status } = req.body;

    if (!full_name || !phone || !vehicle_number) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full_name, phone, and vehicle_number'
      });
    }

    const partner = await createDeliveryPartner({
      full_name,
      phone,
      email,
      vehicle_type,
      vehicle_number,
      availability_status
    });

    return res.status(201).json({
      success: true,
      message: 'Delivery partner added successfully!',
      partner
    });
  } catch (error) {
    console.error('❌ Error adding delivery partner:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to create delivery partner' });
  }
};

// @desc    Update delivery partner details (Admin)
// @route   PUT /api/delivery-partners/:id
// @access  Private (Admin)
const editPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, email, vehicle_type, vehicle_number, availability_status } = req.body;

    const partner = await updateDeliveryPartner(id, {
      full_name,
      phone,
      email,
      vehicle_type,
      vehicle_number,
      availability_status
    });

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Delivery partner updated successfully!',
      partner
    });
  } catch (error) {
    console.error('❌ Error updating delivery partner:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to update delivery partner' });
  }
};

// @desc    Delete delivery partner (Admin)
// @route   DELETE /api/delivery-partners/:id
// @access  Private (Admin)
const removePartner = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteDeliveryPartner(id);

    return res.status(200).json({
      success: true,
      message: 'Delivery partner deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting delivery partner:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to delete delivery partner' });
  }
};

// @desc    Get summary logistics stats
// @route   GET /api/deliveries/stats
// @access  Private (Admin)
const fetchStats = async (req, res) => {
  try {
    const stats = await getDeliveryStats();
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error getting delivery stats:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving delivery stats', error: error.message });
  }
};

module.exports = {
  getDeliveries,
  getDeliveryById,
  assignDelivery,
  updateStatus,
  fetchPartners,
  addPartner,
  editPartner,
  removePartner,
  fetchStats
};
