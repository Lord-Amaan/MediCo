const jwt = require('jsonwebtoken');

// Verify JWT token middleware
exports.verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer token

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Check if user has specific permission
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user?.permissions?.includes(permission)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    next();
  };
};

// Check if user is specific role
exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!Array.isArray(roles)) roles = [roles];
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Role not authorized' });
    }
    next();
  };
};
