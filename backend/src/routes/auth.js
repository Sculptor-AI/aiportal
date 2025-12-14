/**
 * Authentication Routes
 */

import { Hono } from 'hono';
import { state, nowIso } from '../state.js';
import { sanitizeUser, findUserByUsername, findUserByEmail, ensureApiKeyStore } from '../utils/helpers.js';
import { createAccessToken, createRefreshToken, getUserFromAuth } from '../utils/auth.js';

const auth = new Hono();

/**
 * User registration
 */
auth.post('/register', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { username, password, email } = body;

  if (!username || !password || !email) {
    return c.json({ error: 'Username, password, and email are required' }, 400);
  }

  if (findUserByUsername(username)) {
    return c.json({ error: 'Username already exists' }, 409);
  }

  if (findUserByEmail(email)) {
    return c.json({ error: 'Email already exists' }, 409);
  }

  const id = crypto.randomUUID();
  const now = nowIso();
  state.users.set(id, {
    id,
    username,
    email,
    password,
    status: 'active',
    role: 'user',
    created_at: now,
    updated_at: now,
    last_login: null,
    settings: { theme: 'light' }
  });

  return c.json({ success: true, message: 'Registration successful', userId: id });
});

/**
 * User login
 */
auth.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { username, password } = body;

  if (!username || !password) {
    return c.json({ error: 'Username and password are required' }, 400);
  }

  const user = findUserByUsername(username);
  if (!user || user.password !== password) {
    return c.json({ error: 'Invalid username or password' }, 401);
  }

  if (user.status === 'pending') {
    return c.json({ error: 'Account pending approval' }, 403);
  }

  user.last_login = nowIso();
  user.updated_at = nowIso();
  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken();

  return c.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    }
  });
});

/**
 * Create API key
 */
auth.post('/api-keys', async (c) => {
  const user = getUserFromAuth(c);
  if (!user) {
    return c.json({ error: 'User not authenticated' }, 401);
  }
  const keys = ensureApiKeyStore(user.id);
  const key = `ak_local_${crypto.randomUUID()}`;
  keys.push({ name: `Key ${keys.length + 1}`, value: key, created_at: nowIso() });
  return c.json({ success: true, data: { key, keys } });
});

/**
 * List API keys
 */
auth.get('/api-keys', (c) => {
  const user = getUserFromAuth(c);
  if (!user) {
    return c.json({ error: 'User not authenticated' }, 401);
  }
  const keys = ensureApiKeyStore(user.id);
  return c.json({ success: true, data: keys });
});

export default auth;

