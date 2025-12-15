/**
 * Admin Routes
 */

import { Hono } from 'hono';
import { state, nowIso } from '../state.js';
import { sanitizeUser, findUserByUsername } from '../utils/helpers.js';
import { createAdminToken, getAdminFromAuth } from '../utils/auth.js';

const admin = new Hono();

/**
 * Admin login
 */
admin.post('/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { username, password } = body;
  const adminUser = findUserByUsername(username);

  if (!adminUser || adminUser.password !== password || adminUser.status !== 'admin') {
    return c.json({ error: 'Invalid admin credentials' }, 401);
  }

  const adminToken = createAdminToken(adminUser.id);
  adminUser.last_login = nowIso();
  adminUser.updated_at = nowIso();

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
admin.post('/auth/logout', (c) => {
  return c.json({ success: true });
});

/**
 * List all users
 */
admin.get('/users', (c) => {
  const adminUser = getAdminFromAuth(c);
  if (!adminUser) {
    return c.json({ error: 'Admin authentication required' }, 401);
  }
  const users = Array.from(state.users.values()).map(sanitizeUser);
  return c.json({ success: true, data: { users } });
});

/**
 * Get specific user
 */
admin.get('/users/:userId', (c) => {
  const adminUser = getAdminFromAuth(c);
  if (!adminUser) {
    return c.json({ error: 'Admin authentication required' }, 401);
  }
  const userId = c.req.param('userId');
  const user = state.users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json({ success: true, data: { user: sanitizeUser(user) } });
});

/**
 * Update user status
 */
admin.put('/users/:userId/status', async (c) => {
  const adminUser = getAdminFromAuth(c);
  if (!adminUser) {
    return c.json({ error: 'Admin authentication required' }, 401);
  }
  const userId = c.req.param('userId');
  const user = state.users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  const body = await c.req.json().catch(() => ({}));
  if (!body.status) return c.json({ error: 'Status is required' }, 400);
  user.status = body.status;
  user.updated_at = nowIso();
  return c.json({ success: true, data: { id: userId, status: user.status } });
});

/**
 * Update user
 */
admin.put('/users/:userId', async (c) => {
  const adminUser = getAdminFromAuth(c);
  if (!adminUser) {
    return c.json({ error: 'Admin authentication required' }, 401);
  }
  const userId = c.req.param('userId');
  const user = state.users.get(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  const body = await c.req.json().catch(() => ({}));
  if (body.email) user.email = body.email;
  if (body.username) user.username = body.username;
  if (body.password) user.password = body.password;
  user.updated_at = nowIso();
  return c.json({ success: true, data: { user: sanitizeUser(user) } });
});

/**
 * Dashboard stats
 */
admin.get('/dashboard/stats', (c) => {
  const adminUser = getAdminFromAuth(c);
  if (!adminUser) {
    return c.json({ error: 'Admin authentication required' }, 401);
  }
  let totalUsers = 0;
  let pendingUsers = 0;
  let activeUsers = 0;
  let adminUsers = 0;
  for (const user of state.users.values()) {
    totalUsers += 1;
    if (user.status === 'pending') pendingUsers += 1;
    if (user.status === 'active') activeUsers += 1;
    if (user.status === 'admin') adminUsers += 1;
  }
  return c.json({
    success: true,
    data: {
      stats: { totalUsers, pendingUsers, activeUsers, adminUsers }
    }
  });
});

export default admin;

