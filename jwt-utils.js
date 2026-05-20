/**
 * JWT Configuration & Utilities
 * Handles token generation and verification
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.REFRESH_EXPIRY || '7d';

/**
 * Generate JWT access token
 * @param {object} payload - Token payload (user data)
 * @returns {string} JWT token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    algorithm: 'HS256',
  });
};

/**
 * Generate JWT refresh token
 * @param {object} payload - Token payload
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
    algorithm: 'HS256',
  });
};

/**
 * Verify access token
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null
 */
export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {object|null} Decoded payload or null
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    console.error('Refresh token verification failed:', error.message);
    return null;
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
export const extractToken = (authHeader) => {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
};

/**
 * Create token pair (access + refresh)
 * @param {object} user - User data
 * @returns {object} { accessToken, refreshToken }
 */
export const createTokenPair = (user) => {
  const payload = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractToken,
  createTokenPair,
};
