const User = require('../models/User');

// ============================================================================
// GET USER PROFILE
// ============================================================================
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ userID: req.user.userID }).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userID: user.userID,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      hospital: user.hospital,
      qualifications: user.qualifications,
      permissions: user.permissions,
      lastLogin: user.lastLogin,
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// UPDATE USER PROFILE
// ============================================================================
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, phone, qualifications } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (qualifications) updateData.qualifications = qualifications;

    const user = await User.findOneAndUpdate(
      { userID: req.user.userID },
      updateData,
      { new: true }
    ).select('-passwordHash');

    res.json({
      message: 'Profile updated successfully',
      user: {
        userID: user.userID,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        hospital: user.hospital,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// GET ALL USERS (ADMIN ONLY)
// ============================================================================
exports.getAllUsers = async (req, res) => {
  try {
    const { role, hospitalID, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    if (role) {
      filter.role = role; // Doctor, Nurse, Admin
    }

    if (hospitalID) {
      filter['hospital.hospitalID'] = hospitalID;
    }

    const users = await User.find(filter)
      .select('userID name email role hospital lastLogin')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      users,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// GET USERS BY HOSPITAL (for coordination)
// ============================================================================
exports.getUsersByHospital = async (req, res) => {
  try {
    const { hospitalID } = req.params;
    const { role } = req.query;

    const filter = {
      'hospital.hospitalID': hospitalID,
      isActive: true,
    };

    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('userID name email role phone lastLogin')
      .sort({ role: -1, name: 1 });

    res.json({
      hospitalID,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
