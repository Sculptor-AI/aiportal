/**
 * Admin Routes
 * Note: User data is now stored in Cloudflare KV
 */

import { Hono } from 'hono';
import { nowIso } from '../state.js';
import { sanitizeUser, findUserByUsername, findUserById, getAllUsers, updateUser, isEmailTaken, isUsernameTaken, invalidateUserSessions, deleteUserApiKeys } from '../utils/helpers.js';
import { hashPassword, verifyPassword, generateSessionToken, hashToken } from '../utils/crypto.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const admin = new Hono();

/**
 * Admin login
 */
admin.post('/auth/login', async (c) => {
  const kv = c.env.KV;
  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const body = await c.req.json().catch(() => ({}));
  const { username, password } = body;

  if (!username || !password) {
    return c.json({ error: 'Username and password are required' }, 400);
  }

  const adminUser = await findUserByUsername(kv, username);

  if (!adminUser) {
    return c.json({ error: 'Invalid admin credentials' }, 401);
  }

  // Verify password
  const isValid = await verifyPassword(password, adminUser.passwordHash, adminUser.passwordSalt);
  if (!isValid) {
    return c.json({ error: 'Invalid admin credentials' }, 401);
  }

  // Check if user is admin
  if (adminUser.role !== 'admin' && adminUser.status !== 'admin') {
    return c.json({ error: 'Invalid admin credentials' }, 401);
  }

  // Generate admin session token
  const adminToken = generateSessionToken();
  const tokenHash = await hashToken(adminToken);

  // Store admin session with 8-hour TTL
  const sessionData = {
    userId: adminUser.id,
    isAdmin: true,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
  };

  await kv.put(`session:${tokenHash}`, JSON.stringify(sessionData), {
    expirationTtl: 28800 // 8 hours in seconds
  });

  // Update last login
  adminUser.last_login = nowIso();
  adminUser.updated_at = nowIso();
  await updateUser(kv, adminUser);

  return c.json({
    success: true,
    data: {
      user: sanitizeUser(adminUser),
      adminToken
    }
  });
});

/**
 * Admin logout
 */
admin.post('/auth/logout', requireAuth, async (c) => {
  const kv = c.env.KV;
  const token = c.get('token');

  if (kv && token) {
    const tokenHash = await hashToken(token);
    await kv.delete(`session:${tokenHash}`);
  }

  return c.json({ success: true });
});

/**
 * List all users
 */
admin.get('/users', requireAuth, requireAdmin, async (c) => {
  const kv = c.env.KV;
  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const users = await getAllUsers(kv);
  return c.json({ success: true, data: { users } });
});

/**
 * Get specific user
 */
admin.get('/users/:userId', requireAuth, requireAdmin, async (c) => {
  const kv = c.env.KV;
  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const userId = c.req.param('userId');
  const user = await findUserById(kv, userId);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ success: true, data: { user: sanitizeUser(user) } });
});

/**
 * Update user status
 */
admin.put('/users/:userId/status', requireAuth, requireAdmin, async (c) => {
  const kv = c.env.KV;
  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const currentUser = c.get('user');
  const userId = c.req.param('userId');

  // Prevent admins from modifying their own status
  if (currentUser.id === userId) {
    return c.json({ error: 'Cannot modify your own status' }, 403);
  }

  const user = await findUserById(kv, userId);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const body = await c.req.json().catch(() => ({}));
  if (!body.status) {
    return c.json({ error: 'Status is required' }, 400);
  }

  // Validate status
  const validStatuses = ['pending', 'active', 'suspended', 'banned', 'admin'];
  if (!validStatuses.includes(body.status)) {
    return c.json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') }, 400);
  }

  const oldStatus = user.status;
  user.status = body.status;
  user.updated_at = nowIso();
  await updateUser(kv, user);

  // Invalidate all sessions if user is suspended or banned
  if ((body.status === 'suspended' || body.status === 'banned') && oldStatus !== body.status) {
    await invalidateUserSessions(kv, userId);
  }

  return c.json({ success: true, data: { id: userId, status: user.status } });
});

/**
 * Update user
 */
admin.put('/users/:userId', requireAuth, requireAdmin, async (c) => {
  const kv = c.env.KV;
  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const userId = c.req.param('userId');
  const user = await findUserById(kv, userId);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const body = await c.req.json().catch(() => ({}));

  // Validate email is not already taken by another user
  if (body.email && body.email.toLowerCase() !== user.email.toLowerCase()) {
    if (await isEmailTaken(kv, body.email, userId)) {
      return c.json({ error: 'Email already in use by another user' }, 409);
    }
  }

  // Validate username is not already taken by another user
  if (body.username && body.username.toLowerCase() !== user.username.toLowerCase()) {
    if (await isUsernameTaken(kv, body.username, userId)) {
      return c.json({ error: 'Username already in use by another user' }, 409);
    }
  }

  // Update allowed fields
  if (body.email && body.email.toLowerCase() !== user.email.toLowerCase()) {
    // Update email index
    await kv.delete(`email:${user.email.toLowerCase()}`);
    user.email = body.email.toLowerCase();
    await kv.put(`email:${user.email}`, user.id);
  }

  if (body.username && body.username.toLowerCase() !== user.username.toLowerCase()) {
    // Update username index
    await kv.delete(`username:${user.username.toLowerCase()}`);
    user.username = body.username;
    await kv.put(`username:${user.username.toLowerCase()}`, user.id);
  }

  let passwordChanged = false;
  if (body.password) {
    // Validate password meets minimum requirements
    if (body.password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters long' }, 400);
    }
    const { hash, salt } = await hashPassword(body.password);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    passwordChanged = true;
  }

  if (body.role) {
    // Validate role
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(body.role)) {
      return c.json({ error: 'Invalid role. Must be one of: ' + validRoles.join(', ') }, 400);
    }
    user.role = body.role;
  }

  user.updated_at = nowIso();
  await updateUser(kv, user);

  // Invalidate all sessions if password was changed
  if (passwordChanged) {
    await invalidateUserSessions(kv, userId);
  }

  return c.json({ success: true, data: { user: sanitizeUser(user) } });
});

/**
 * Delete user
 */
admin.delete('/users/:userId', requireAuth, requireAdmin, async (c) => {
  const kv = c.env.KV;
  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const currentUser = c.get('user');
  const userId = c.req.param('userId');

  // Prevent admins from deleting themselves
  if (currentUser.id === userId) {
    return c.json({ error: 'Cannot delete your own account' }, 403);
  }

  const user = await findUserById(kv, userId);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Invalidate all sessions and delete API keys for the user
  await Promise.all([
    invalidateUserSessions(kv, userId),
    deleteUserApiKeys(kv, userId)
  ]);

  // Delete user and indexes
  await Promise.all([
    kv.delete(`user:${userId}`),
    kv.delete(`username:${user.username.toLowerCase()}`),
    kv.delete(`email:${user.email.toLowerCase()}`)
  ]);

  return c.json({ success: true });
});

/**
 * Dashboard stats
 */
admin.get('/dashboard/stats', requireAuth, requireAdmin, async (c) => {
  const kv = c.env.KV;
  if (!kv) {
    return c.json({ error: 'Storage not configured' }, 500);
  }

  const users = await getAllUsers(kv);

  let totalUsers = 0;
  let pendingUsers = 0;
  let activeUsers = 0;
  let adminUsers = 0;
  let suspendedUsers = 0;

  for (const user of users) {
    totalUsers += 1;
    if (user.status === 'pending') pendingUsers += 1;
    if (user.status === 'active') activeUsers += 1;
    if (user.status === 'admin' || user.role === 'admin') adminUsers += 1;
    if (user.status === 'suspended' || user.status === 'banned') suspendedUsers += 1;
  }

  return c.json({
    success: true,
    data: {
      stats: { totalUsers, pendingUsers, activeUsers, adminUsers, suspendedUsers }
    }
  });
});

export default admin;
