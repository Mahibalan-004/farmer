const buyerProfileModel = require('../models/buyerProfileModel');

// GET /api/buyer-profile/me
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await buyerProfileModel.getBuyerProfileByUserId(userId);
    
    if (!profile) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No business profile found. Please create one.'
      });
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching buyer profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch business profile'
    });
  }
};

// PUT /api/buyer-profile/me
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!['Retailer', 'Restaurant', 'Bulk Buyer'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Business profile is only available for Retailers, Restaurants, and Bulk Buyers'
      });
    }

    const { business_name, contact_person, business_phone, address, district, state, pincode } = req.body;

    // Validations
    if (!business_name || !business_name.trim()) {
      return res.status(400).json({ success: false, message: 'Business Name is required' });
    }
    if (!contact_person || !contact_person.trim()) {
      return res.status(400).json({ success: false, message: 'Contact Person is required' });
    }
    if (!business_phone || !business_phone.trim()) {
      return res.status(400).json({ success: false, message: 'Business Phone Number is required' });
    }
    if (!address || address.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Address must be at least 10 characters long' });
    }
    if (!district || !district.trim()) {
      return res.status(400).json({ success: false, message: 'District is required' });
    }
    if (!state || !state.trim()) {
      return res.status(400).json({ success: false, message: 'State is required' });
    }
    if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({ success: false, message: 'Pincode must be exactly 6 digits' });
    }

    const profileData = {
      business_type: userRole,
      business_name: business_name.trim(),
      contact_person: contact_person.trim(),
      business_phone: business_phone.trim(),
      address: address.trim(),
      district: district.trim(),
      state: state.trim(),
      pincode: pincode.trim()
    };

    const updatedProfile = await buyerProfileModel.upsertBuyerProfile(userId, profileData);

    return res.status(200).json({
      success: true,
      message: 'Business profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error updating buyer profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update business profile'
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile
};
