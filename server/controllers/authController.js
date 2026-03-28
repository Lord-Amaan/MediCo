const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      userID: user.userID,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      hospitalID: user.hospital?.hospitalID,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ============================================================================
// LOGIN
// ============================================================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
      }
      await user.save();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({ error: 'Account locked. Try again in 15 minutes.' });
    }

    // Reset login attempts and lock
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    res.json({
      token,
      user: {
        userID: user.userID,
        name: user.name,
        email: user.email,
        role: user.role,
        hospital: user.hospital,
        permissions: user.permissions,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// GET CURRENT USER
// ============================================================================
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({ userID: req.user.userID }).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userID: user.userID,
      name: user.name,
      email: user.email,
      role: user.role,
      hospital: user.hospital,
      permissions: user.permissions,
      lastLogin: user.lastLogin,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================================================
// LOGOUT (Optional - mostly for frontend to clear token)
// ============================================================================
exports.logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is just frontend clearing the token
    // Could implement token blacklist in Redis if needed
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
