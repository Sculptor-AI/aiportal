/**
 * Authentication Middleware
 * Protects routes by validating session tokens and user status
 */

import { hashToken } from '../utils/crypto.js';

/**
 * Parse Bearer token from Authorization header
 */
const parseBearer = (value) => {
  if (!value) return null;
  return value.startsWith('Bearer ') ? value.slice(7).trim() : value.trim();
};

/**
 * Get token from request (header or query param)
 */
const getTokenFromRequest = (c) => {
  // Try Authorization header first
  const headerAuth = parseBearer(c.req.header('Authorization'));
  if (headerAuth) return headerAuth;

  // Try X-API-Key header
  const apiKey = c.req.header('X-API-Key');
  if (apiKey) return apiKey;

  // Try query parameter (for WebSocket)
  const queryToken = c.req.query('token');
  if (queryToken) return queryToken;

  return null;
};

/**
 * Get user from API key
 * @param {Object} kv - KV namespace
 * @param {string} apiKey - API key
 * @returns {Promise<Object|null>} User object or null
 */
const getUserFromApiKey = async (kv, apiKey) => {
  try {
    const keyHash = await hashToken(apiKey);
    const keyData = await kv.get(`apikey:${keyHash}`, 'json');

    if (!keyData) return null;

    // Update last_used timestamp
    keyData.last_used = new Date().toISOString();
    await kv.put(`apikey:${keyHash}`, JSON.stringify(keyData));

    // Get the user
    const user = await kv.get(`user:${keyData.userId}`, 'json');
    return user;
  } catch (error) {
    console.error('Error getting user from API key:', error);
    return null;
  }
};

/**
 * Get user from session token
 * @param {Object} kv - KV namespace
 * @param {string} token - Session token
 * @returns {Promise<Object|null>} User object or null
 */
const getUserFromSessionToken = async (kv, token) => {
  try {
    // Hash the token to look up session
    const tokenHash = await hashToken(token);
    const sessionKey = `session:${tokenHash}`;
    const sessionData = await kv.get(sessionKey, 'json');

    if (!sessionData) return null;

    // Check if session is expired
    if (sessionData.expiresAt && new Date(sessionData.expiresAt) < new Date()) {
      // Session expired, delete it
      await kv.delete(sessionKey);
      return null;
    }

    // Get the user
    const userKey = `user:${sessionData.userId}`;
    const user = await kv.get(userKey, 'json');

    return user;
  } catch (error) {
    console.error('Error getting user from session token:', error);
    return null;
  }
};

/**
 * Get user from token (session token or API key)
 * @param {Object} c - Hono context
 * @param {string} token - Session token or API key
 * @returns {Promise<Object|null>} User object or null
 */
const getUserFromToken = async (c, token) => {
  const kv = c.env.KV;
  if (!kv || !token) return null;

  // Check if it's an API key (prefixed with 'ak_')
  if (token.startsWith('ak_')) {
    return getUserFromApiKey(kv, token);
  }

  // Otherwise treat as session token
  return getUserFromSessionToken(kv, token);
};

/**
 * Middleware: Require authentication
 * Blocks requests without a valid session token
 */
export const requireAuth = async (c, next) => {
  const token = getTokenFromRequest(c);

  if (!token) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const user = await getUserFromToken(c, token);

  if (!user) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  // Attach user to context for downstream handlers
  c.set('user', user);
  c.set('token', token);

  await next();
};

/**
 * Middleware: Require approved user
 * Blocks pending users from accessing resources
 * Must be used after requireAuth
 */
export const requireApproved = async (c, next) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  if (user.status === 'pending') {
    return c.json({
      error: 'Account pending approval',
      message: 'Your account is awaiting admin approval. Please try again later.'
    }, 403);
  }

  if (user.status === 'suspended' || user.status === 'banned') {
    return c.json({
      error: 'Account suspended',
      message: 'Your account has been suspended. Please contact an administrator.'
    }, 403);
  }

  await next();
};

/**
 * Middleware: Require admin role
 * Blocks non-admin users
 * Must be used after requireAuth
 */
export const requireAdmin = async (c, next) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  if (user.role !== 'admin' && user.status !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }

  await next();
};

/**
 * Combined middleware: Auth + Approved
 * Convenience middleware that combines both checks
 */
export const requireAuthAndApproved = async (c, next) => {
  const token = getTokenFromRequest(c);

  if (!token) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const user = await getUserFromToken(c, token);

  if (!user) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  if (user.status === 'pending') {
    return c.json({
      error: 'Account pending approval',
      message: 'Your account is awaiting admin approval. Please try again later.'
    }, 403);
  }

  if (user.status === 'suspended' || user.status === 'banned') {
    return c.json({
      error: 'Account suspended',
      message: 'Your account has been suspended. Please contact an administrator.'
    }, 403);
  }

  // Attach user to context
  c.set('user', user);
  c.set('token', token);

  await next();
};

/**
 * Validate a token without middleware context
 * Useful for WebSocket authentication
 * Supports both session tokens and API keys
 */
export const validateToken = async (kv, token) => {
  if (!kv || !token) return null;

  try {
    let user = null;

    // Check if it's an API key (prefixed with 'ak_')
    if (token.startsWith('ak_')) {
      const keyHash = await hashToken(token);
      const keyData = await kv.get(`apikey:${keyHash}`, 'json');

      if (!keyData) return null;

      // Update last_used timestamp
      keyData.last_used = new Date().toISOString();
      await kv.put(`apikey:${keyHash}`, JSON.stringify(keyData));

      user = await kv.get(`user:${keyData.userId}`, 'json');
    } else {
      // Treat as session token
      const tokenHash = await hashToken(token);
      const sessionKey = `session:${tokenHash}`;
      const sessionData = await kv.get(sessionKey, 'json');

      if (!sessionData) return null;

      if (sessionData.expiresAt && new Date(sessionData.expiresAt) < new Date()) {
        await kv.delete(sessionKey);
        return null;
      }

      user = await kv.get(`user:${sessionData.userId}`, 'json');
    }

    if (!user) return null;

    // Check user status
    if (user.status === 'pending' || user.status === 'suspended' || user.status === 'banned') {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
};
