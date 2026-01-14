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

/**
 * Check if email is already taken by another user
 */
export const isEmailTaken = async (kv, email, excludeUserId = null) => {
  if (!kv || !email) return false;
  const key = `email:${email.toLowerCase()}`;
  const userId = await kv.get(key);
  if (!userId) return false;
  return excludeUserId ? userId !== excludeUserId : true;
};

/**
 * Check if username is already taken by another user
 */
export const isUsernameTaken = async (kv, username, excludeUserId = null) => {
  if (!kv || !username) return false;
  const key = `username:${username.toLowerCase()}`;
  const userId = await kv.get(key);
  if (!userId) return false;
  return excludeUserId ? userId !== excludeUserId : true;
};

/**
 * Invalidate all sessions for a user
 * Note: This requires listing all sessions, which can be slow
 */
export const invalidateUserSessions = async (kv, userId) => {
  if (!kv || !userId) return;

  try {
    // List all sessions and find ones belonging to this user
    const list = await kv.list({ prefix: 'session:' });
    const deletePromises = [];

    for (const key of list.keys) {
      const sessionData = await kv.get(key.name, 'json');
      if (sessionData && sessionData.userId === userId) {
        deletePromises.push(kv.delete(key.name));
      }
    }

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }
  } catch (error) {
    console.error('Error invalidating user sessions:', error);
  }
};

/**
 * Delete all API keys for a user (including the actual key data)
 */
export const deleteUserApiKeys = async (kv, userId) => {
  if (!kv || !userId) return;

  try {
    // Get user's key list
    const userKeysKey = `userkeys:${userId}`;
    const existingKeys = await kv.get(userKeysKey, 'json') || [];

    // We need to find and delete the actual apikey entries
    // Since we don't store the keyHash in the user's key list, we need to list all apikeys
    const list = await kv.list({ prefix: 'apikey:' });
    const deletePromises = [];

    for (const key of list.keys) {
      const keyData = await kv.get(key.name, 'json');
      if (keyData && keyData.userId === userId) {
        deletePromises.push(kv.delete(key.name));
      }
    }

    // Also delete the user's key list
    deletePromises.push(kv.delete(userKeysKey));

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }
  } catch (error) {
    console.error('Error deleting user API keys:', error);
  }
};