/**
 * Authentication utility functions
 */

import { state } from '../state.js';

/**
 * Create an access token for a user
 */
export const createAccessToken = (userId) => `ak_local_${userId}`;

/**
 * Create a refresh token
 */
export const createRefreshToken = () => `rt_local_${crypto.randomUUID()}`;

/**
 * Create an admin token
 */
export const createAdminToken = (userId) => `admin_local_${userId}_${crypto.randomUUID()}`;

/**
 * Parse Bearer token from Authorization header
 */
export const parseBearer = (value) => {
  if (!value) return null;
  return value.startsWith('Bearer ') ? value.slice(7).trim() : value.trim();
};

/**
 * Get user from authentication headers
 */
export const getUserFromAuth = (c) => {
  const headerAuth = parseBearer(c.req.header('Authorization'));
  const apiKey = c.req.header('X-API-Key');
  const token = headerAuth || apiKey;
  
  if (!token) return null;
  
  if (token.startsWith('ak_local_')) {
    const userId = token.replace('ak_local_', '');
    return state.users.get(userId) || null;
  }
  
  return null;
};

/**
 * Get admin user from authentication headers
 */
export const getAdminFromAuth = (c) => {
  const token = parseBearer(c.req.header('Authorization')) || c.req.header('X-Admin-Token');
  
  if (!token) return null;
  if (!token.startsWith('admin_local_')) return null;
  
  const withoutPrefix = token.replace('admin_local_', '');
  const parts = withoutPrefix.split('_');
  const userId = parts.shift();
  
  return state.users.get(userId) || null;
};

