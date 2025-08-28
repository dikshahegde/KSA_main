const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');

/**
 * Auth middleware
 * Checks if the user has a valid JWT and is active
 */
const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify token using secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Look up user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Token is invalid or user not found.' });
    }

    //  check if user is active (if you have an "isActive" column)
    if (user.isActive === false) {
      return res.status(401).json({ message: 'User account is deactivated.' });
    }

    // Attach user object to request so routes can use it
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid.' });
  }
};

/**
 * Authorize middleware
 * Only allows access if user role matches one of the allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
      });
    }

    next();
  };
};

module.exports = { auth, authorize };
