// middleware/auth.js
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');

/**
 * Auth middleware
 * Verifies JWT and attaches user info to req.user
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dummysecret');

    // Fetch user from Supabase
    const { data: user, error } = await supabase
      .from('profiles') // use your table, e.g., 'users' or 'profiles'
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Token is invalid or user not found.' });
    }

    // Optional: check if user is active
    if (user.isActive === false) {
      return res.status(401).json({ message: 'User account is deactivated.' });
    }

    // Attach user object to request
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Token is not valid.' });
  }
};

/**
 * Authorize middleware
 * Only allows access if user role matches allowed roles
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
