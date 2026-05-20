/**
 * Authentication Controller
 * Handles register, login, logout, token refresh
 */

import { hashPassword, comparePassword, validatePasswordStrength } from './password-utils.js';
import { createTokenPair, verifyRefreshToken } from './jwt-utils.js';
import { query, getOne } from './config-database.js';

/**
 * POST /auth/register
 * Register new user
 */
export const register = async (req, res) => {
  const { name, username, email, password } = req.body;

  // Validate input
  if (!name || !username || !password) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Name, username, and password are required',
    });
  }

  // Validate username format
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Username must be 3-30 characters (letters, numbers, or underscores only)',
    });
  }

  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid email format',
      });
    }
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Password too weak',
      details: passwordValidation.errors,
    });
  }

  try {
    // Check if username already exists
    const existingUser = await getOne('SELECT id FROM users WHERE username = $1', [username.toLowerCase()]);
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Username is already taken',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await query(
      `INSERT INTO users (name, username, email, password_hash, role) 
       VALUES ($1, $2, $3, $4, 'staff') 
       RETURNING id, name, username, email, role`,
      [name, username.toLowerCase(), email || null, passwordHash]
    );

    const user = result.rows[0];
    const tokens = createTokenPair(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /auth/login
 * Login user with email and password
 */
export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Username and password are required',
    });
  }

  try {
    // Find user by username
    const user = await getOne(
      'SELECT id, name, username, email, role, password_hash FROM users WHERE username = $1 AND is_active = true',
      [username.toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password',
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password',
      });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const tokens = createTokenPair(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
export const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Refresh token is required',
    });
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired refresh token',
    });
  }

  try {
    // Get fresh user data
    const user = await getOne(
      'SELECT id, name, username, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found or inactive',
      });
    }

    // Generate new tokens
    const tokens = createTokenPair(user);

    res.json({
      message: 'Token refreshed',
      ...tokens,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /auth/logout
 * Logout user (client-side mostly, for cleanup if needed)
 */
export const logout = async (req, res) => {
  // In a real app, you might invalidate refresh tokens in database
  // For now, this is mostly a client-side operation
  res.json({
    message: 'Logout successful',
  });
};

export default {
  register,
  login,
  refresh,
  logout,
};
