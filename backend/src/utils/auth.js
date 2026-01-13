/**
 * Authentication utility functions
 * Note: Most auth logic has moved to middleware/auth.js and utils/crypto.js
 * This file provides helper functions for route handlers
 */

/**
 * Parse Bearer token from Authorization header
 */
export const parseBearer = (value) => {
  if (!value) return null;
  return value.startsWith('Bearer ') ? value.slice(7).trim() : value.trim();
};

/**
 * Get user from Hono context (set by auth middleware)
 */
export const getUserFromContext = (c) => {
  return c.get('user') || null;
};

/**
 * Check if user is admin
 */
export const isAdmin = (user) => {
  if (!user) return false;
  return user.role === 'admin' || user.status === 'admin';
};

/**
 * Check if user is approved (active or admin)
 */
export const isApproved = (user) => {
  if (!user) return false;
  return user.status === 'active' || user.status === 'admin';
};
