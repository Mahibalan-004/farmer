const { findUserById, updateUserProfile } = require('../models/userModel');

// @desc    Get logged in Farmer profile
// @route   GET /api/farmer/profile
// @access  Private (Farmer)
const getFarmerProfile = async (req, res) => {
  try {
    const farmer = await findUserById(req.user.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }
    return res.status(200).json({
      message: 'Farmer profile fetched successfully',
      farmer
    });
  } catch (error) {
    console.error('Error fetching farmer profile:', error);
    return res.status(500).json({ message: 'Server error fetching farmer profile', error: error.message });
  }
};

// @desc    Update logged in Farmer profile
// @route   PUT /api/farmer/profile
// @access  Private (Farmer)
const updateFarmerProfile = async (req, res) => {
  try {
    const { full_name, phone, farm_location, district, state } = req.body;

    const updatedFarmer = await updateUserProfile(req.user.id, {
      full_name,
      phone,
      farm_location,
      district,
      state
    });

    return res.status(200).json({
      message: 'Farmer profile updated successfully',
      farmer: updatedFarmer
    });
  } catch (error) {
    console.error('Error updating farmer profile:', error);
    return res.status(500).json({ message: 'Server error updating farmer profile', error: error.message });
  }
};

module.exports = {
  getFarmerProfile,
  updateFarmerProfile
};
