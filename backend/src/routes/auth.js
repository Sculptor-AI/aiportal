/**
 * Authentication Routes
 * Handles user registration, login, and API key management
 */

import { Hono } from 'hono';
import { hashPassword, verifyPassword, generateSessionToken, generateApiKey, hashToken, getTokenPrefix } from '../utils/crypto.js';
import { requireAuth } from '../middleware/auth.js';

const auth = new Hono();

/**
 * Helper: Get current ISO timestamp
 */
const nowIso = () => new Date().toISOString();

/**
 * Helper: Sanitize user object (remove sensitive data)
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, passwordSalt, ...safeUser } = user;
  return safeUser;
};

/**
 * Helper: Check if username exists
 */
const usernameExists = async (kv, username) => {
  const key = `username:${username.toLowerCase()}`;
  const userId = await kv.get(key);
  return !!userId;
};

/**
 * Helper: Check if email exists
 */
const emailExists = async (kv, email) => {
  const key = `email:${email.toLowerCase()}`;
  const userId = await kv.get(key);
  return !!userId;
};

/**
 * Helper: Get user by username
 */
const getUserByUsername = async (kv, username) => {
  const key = `username:${username.toLowerCase()}`;
  const userId = await kv.get(key);
  if (!userId) return null;
  return await kv.get(`user:${userId}`, 'json');
};

/**
 * User registration
 * POST /api/auth/register
 */
auth.post('/register', async (c) => {
  const kv = c.env.KV;
  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const body = await c.req.json().catch(() => ({}));
  const { username, password, email } = body;

  // Validate input
  if (!username || !password || !email) {
    return c.json({ error: 'Username, password, and email are required' }, 400);
  }

  if (username.length < 3 || username.length > 30) {
    return c.json({ error: 'Username must be between 3 and 30 characters' }, 400);
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return c.json({ error: 'Username can only contain letters, numbers, underscores, and hyphens' }, 400);
  }

  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters long' }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Invalid email address' }, 400);
  }

  // Check for existing username/email
  if (await usernameExists(kv, username)) {
    return c.json({ error: 'Username already exists' }, 409);
  }

  if (await emailExists(kv, email)) {
    return c.json({ error: 'Email already exists' }, 409);
  }

  // Hash the password
  const { hash, salt } = await hashPassword(password);

  // Create user
  const id = crypto.randomUUID();
  const now = nowIso();
  const user = {
    id,
    username,
    email: email.toLowerCase(),
    passwordHash: hash,
    passwordSalt: salt,
    status: 'pending', // New users require approval
    role: 'user',
    created_at: now,
    updated_at: now,
    last_login: null,
    settings: { theme: 'light' }
  };

  // Store user and indexes
  await Promise.all([
    kv.put(`user:${id}`, JSON.stringify(user)),
    kv.put(`username:${username.toLowerCase()}`, id),
    kv.put(`email:${email.toLowerCase()}`, id)
  ]);

  return c.json({
    success: true,
    message: 'Registration successful. Your account is pending approval.',
    userId: id
  });
});

/**
 * User login
 * POST /api/auth/login
 */
auth.post('/login', async (c) => {
  const kv = c.env.KV;
  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const body = await c.req.json().catch(() => ({}));
  const { username, password } = body;

  if (!username || !password) {
    return c.json({ error: 'Username and password are required' }, 400);
  }

  // Get user by username
  const user = await getUserByUsername(kv, username);
  if (!user) {
    return c.json({ error: 'Invalid username or password' }, 401);
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!isValid) {
    return c.json({ error: 'Invalid username or password' }, 401);
  }

  // Check user status
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

  // Generate session token
  const accessToken = generateSessionToken();
  const tokenHash = await hashToken(accessToken);

  // Store session with 24-hour TTL
  const sessionData = {
    userId: user.id,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  await kv.put(`session:${tokenHash}`, JSON.stringify(sessionData), {
    expirationTtl: 86400 // 24 hours in seconds
  });

  // Update last login
  user.last_login = nowIso();
  user.updated_at = nowIso();
  await kv.put(`user:${user.id}`, JSON.stringify(user));

  return c.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      accessToken,
      refreshToken: null // Not implemented yet
    }
  });
});

/**
 * User logout
 * POST /api/auth/logout
 */
auth.post('/logout', requireAuth, async (c) => {
  const kv = c.env.KV;
  const token = c.get('token');

  if (kv && token) {
    const tokenHash = await hashToken(token);
    await kv.delete(`session:${tokenHash}`);
  }

  return c.json({ success: true });
});

/**
 * Get current user
 * GET /api/auth/me
 */
auth.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  return c.json({
    success: true,
    data: { user: sanitizeUser(user) }
  });
});

/**
 * Create API key
 * POST /api/auth/api-keys
 */
auth.post('/api-keys', requireAuth, async (c) => {
  const kv = c.env.KV;
  const user = c.get('user');

  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const body = await c.req.json().catch(() => ({}));
  const name = body.name || `API Key ${Date.now()}`;

  // Generate API key
  const apiKey = generateApiKey();
  const keyHash = await hashToken(apiKey);
  const keyPrefix = getTokenPrefix(apiKey);

  const keyData = {
    id: crypto.randomUUID(),
    userId: user.id,
    name,
    keyHash,
    keyPrefix,
    created_at: nowIso(),
    last_used: null
  };

  // Store the API key
  await kv.put(`apikey:${keyHash}`, JSON.stringify(keyData));

  // Store reference in user's key list
  const userKeysKey = `userkeys:${user.id}`;
  const existingKeys = await kv.get(userKeysKey, 'json') || [];
  existingKeys.push({
    id: keyData.id,
    name: keyData.name,
    keyPrefix: keyData.keyPrefix,
    created_at: keyData.created_at
  });
  await kv.put(userKeysKey, JSON.stringify(existingKeys));

  return c.json({
    success: true,
    data: {
      key: apiKey, // Only shown once
      id: keyData.id,
      name: keyData.name,
      prefix: keyData.keyPrefix
    }
  });
});

/**
 * List API keys
 * GET /api/auth/api-keys
 */
auth.get('/api-keys', requireAuth, async (c) => {
  const kv = c.env.KV;
  const user = c.get('user');

  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const userKeysKey = `userkeys:${user.id}`;
  const keys = await kv.get(userKeysKey, 'json') || [];

  return c.json({
    success: true,
    data: keys
  });
});

/**
 * Delete API key
 * DELETE /api/auth/api-keys/:keyId
 */
auth.delete('/api-keys/:keyId', requireAuth, async (c) => {
  const kv = c.env.KV;
  const user = c.get('user');
  const keyId = c.req.param('keyId');

  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  // Get user's keys
  const userKeysKey = `userkeys:${user.id}`;
  const existingKeys = await kv.get(userKeysKey, 'json') || [];

  // Find and remove the key
  const keyIndex = existingKeys.findIndex(k => k.id === keyId);
  if (keyIndex === -1) {
    return c.json({ error: 'API key not found' }, 404);
  }

  existingKeys.splice(keyIndex, 1);
  await kv.put(userKeysKey, JSON.stringify(existingKeys));

  return c.json({ success: true });
});

export default auth;
