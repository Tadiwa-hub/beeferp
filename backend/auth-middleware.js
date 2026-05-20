/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

import { verifyAccessToken, extractToken } from './jwt-utils.js';

/**
 * Middleware: Verify JWT token
 * Adds user to req.user if valid
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No token provided',
    });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }

  req.user = decoded;
  next();
};

/**
 * Middleware: Check if user is admin
 * Must use after authenticate middleware
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }

  next();
};

/**
 * Middleware: Check if user is staff or admin
 * Must use after authenticate middleware
 */
export const requireStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (!['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Staff or admin access required',
    });
  }

  next();
};

/**
 * Middleware: Optional authentication
 * Sets req.user if token exists, but doesn't fail if missing
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};

export default {
  authenticate,
  requireAdmin,
  requireStaff,
  optionalAuth,
};
