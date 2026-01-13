/**
 * Common utility functions
 * Note: User data is now stored in Cloudflare KV
 */

/**
 * Remove sensitive data from user object before returning
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  const { passwordHash, passwordSalt, ...safeUser } = user;
  return safeUser;
};

/**
 * Find user by username (KV-based)
 */
export const findUserByUsername = async (kv, username) => {
  if (!kv || !username) return null;
  const key = `username:${username.toLowerCase()}`;
  const userId = await kv.get(key);
  if (!userId) return null;
  return await kv.get(`user:${userId}`, 'json');
};

/**
 * Find user by email (KV-based)
 */
export const findUserByEmail = async (kv, email) => {
  if (!kv || !email) return null;
  const key = `email:${email.toLowerCase()}`;
  const userId = await kv.get(key);
  if (!userId) return null;
  return await kv.get(`user:${userId}`, 'json');
};

/**
 * Find user by ID (KV-based)
 */
export const findUserById = async (kv, userId) => {
  if (!kv || !userId) return null;
  return await kv.get(`user:${userId}`, 'json');
};

/**
 * Get all users (KV-based)
 * Note: This requires listing keys, which can be slow for large datasets
 */
export const getAllUsers = async (kv) => {
  if (!kv) return [];

  try {
    const list = await kv.list({ prefix: 'user:' });
    const users = [];

    for (const key of list.keys) {
      const user = await kv.get(key.name, 'json');
      if (user) {
        users.push(sanitizeUser(user));
      }
    }

    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

/**
 * Update user in KV
 */
export const updateUser = async (kv, user) => {
  if (!kv || !user || !user.id) return false;

  try {
    user.updated_at = new Date().toISOString();
    await kv.put(`user:${user.id}`, JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};
