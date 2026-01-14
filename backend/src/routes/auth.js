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

  // Username must start and end with alphanumeric, can contain underscores/hyphens in middle
  // Requires 2+ chars (but length check above enforces 3+ minimum)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(username)) {
    return c.json({ error: 'Username must start and end with a letter or number, and can only contain letters, numbers, underscores, and hyphens' }, 400);
  }

  if (password.length < 12) {
    return c.json({ error: 'Password must be at least 12 characters long' }, 400);
  }

  // Email validation with minimum 2-character TLD
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
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
  // Note: Username preserves original casing for display, email is normalized to lowercase
  // Index keys are always lowercase for case-insensitive lookups
  const id = crypto.randomUUID();
  const now = nowIso();
  const user = {
    id,
    username,                    // Preserves original casing (e.g., "JohnDoe")
    email: email.toLowerCase(),  // Normalized to lowercase
    passwordHash: hash,
    passwordSalt: salt,
    status: 'pending', // New users require approval
    role: 'user',
    created_at: now,
    updated_at: now,
    last_login: null,
    settings: { theme: 'light' }
  };

  // Store user and indexes with rollback on failure
  try {
    await kv.put(`user:${id}`, JSON.stringify(user));
    await kv.put(`username:${username.toLowerCase()}`, id);
    await kv.put(`email:${email.toLowerCase()}`, id);
  } catch (err) {
    // Best-effort rollback
    try {
      await kv.delete(`user:${id}`);
      await kv.delete(`username:${username.toLowerCase()}`);
      await kv.delete(`email:${email.toLowerCase()}`);
    } catch (_) {
      // Swallow rollback errors
    }
    console.error('Failed to create user:', err);
    return c.json({ error: 'Failed to create user account' }, 500);
  }

  // Log new registration for admin notification (email redacted for privacy)
  const redactedEmail = email.toLowerCase().replace(/^(.).*(@.*)$/, '$1***$2');
  console.log(`[AUTH] New user registration pending approval: id=${id}, username=${username}, email=${redactedEmail}`);

  return c.json({
    success: true,
    message: 'Registration successful. Your account is pending admin approval. You will not be able to log in until an administrator activates your account.',
    userId: id,
    status: user.status
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
  
  // Validate API key name
  let keyName = typeof body.name === 'string' ? body.name.trim() : '';
  if (keyName) {
    if (keyName.length > 100) {
      return c.json({ error: 'API key name must be at most 100 characters long' }, 400);
    }
    // Allow letters, numbers, spaces, underscores, hyphens, and periods
    if (!/^[\w .-]+$/.test(keyName)) {
      return c.json({ error: 'API key name contains invalid characters' }, 400);
    }
  } else {
    keyName = `API Key ${Date.now()}`;
  }

  // Generate API key
  const apiKey = generateApiKey();
  const keyHash = await hashToken(apiKey);
  const keyPrefix = getTokenPrefix(apiKey);

  const keyData = {
    id: crypto.randomUUID(),
    userId: user.id,
    name: keyName,
    keyHash,
    keyPrefix,
    created_at: nowIso(),
    last_used: null
  };

  // Store the API key with rollback on failure
  try {
    await kv.put(`apikey:${keyHash}`, JSON.stringify(keyData));

    // Store reference in user's key list (include keyHash for efficient deletion)
    const userKeysKey = `userkeys:${user.id}`;
    const existingKeys = await kv.get(userKeysKey, 'json') || [];
    existingKeys.push({
      id: keyData.id,
      name: keyData.name,
      keyPrefix: keyData.keyPrefix,
      keyHash: keyData.keyHash,
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
  } catch (err) {
    // Rollback API key creation if updating the user's key list fails
    try {
      await kv.delete(`apikey:${keyHash}`);
    } catch (rollbackErr) {
      console.error('Failed to rollback API key creation:', rollbackErr);
    }
    console.error('Failed to create API key:', err);
    return c.json({ error: 'Failed to create API key' }, 500);
  }
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

  // Remove keyHash from response (don't expose to client)
  const safeKeys = keys.map(({ keyHash, ...rest }) => rest);

  return c.json({
    success: true,
    data: safeKeys
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

  // Find the key to delete
  const keyIndex = existingKeys.findIndex(k => k.id === keyId);
  if (keyIndex === -1) {
    return c.json({ error: 'API key not found' }, 404);
  }

  const keyToDelete = existingKeys[keyIndex];

  // Delete the actual API key entry
  // Try using stored keyHash first (new keys), fallback to scanning (legacy keys)
  if (keyToDelete.keyHash) {
    await kv.delete(`apikey:${keyToDelete.keyHash}`);
  } else {
    // Fallback: scan for legacy keys without stored keyHash
    const apiKeyList = await kv.list({ prefix: 'apikey:' });
    for (const key of apiKeyList.keys) {
      const keyData = await kv.get(key.name, 'json');
      if (keyData && keyData.id === keyId && keyData.userId === user.id) {
        await kv.delete(key.name);
        break;
      }
    }
  }

  // Remove from user's key list
  existingKeys.splice(keyIndex, 1);
  await kv.put(userKeysKey, JSON.stringify(existingKeys));

  return c.json({ success: true });
});

export default auth;
