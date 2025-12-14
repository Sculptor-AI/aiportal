/**
 * In-memory state management
 * Persists for the lifetime of the worker instance
 */

export const state = {
  users: new Map(),
  apiKeys: new Map()
};

/**
 * Get current ISO timestamp
 */
export const nowIso = () => new Date().toISOString();

/**
 * Seed initial demo users
 */
export const seedUsers = () => {
  if (state.users.size > 0) return;
  
  const seededAt = nowIso();
  const seed = [
    {
      id: 'admin-1',
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      status: 'admin',
      role: 'admin'
    },
    {
      id: 'user-1',
      username: 'demo',
      email: 'demo@example.com',
      password: 'demo123',
      status: 'active',
      role: 'user'
    }
  ];
  
  seed.forEach((u) => {
    state.users.set(u.id, {
      ...u,
      created_at: seededAt,
      updated_at: seededAt,
      last_login: null,
      settings: { theme: 'light' }
    });
  });
};

// Initialize on import
seedUsers();

