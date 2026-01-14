/**
 * Common utility functions
 * Note: User data is now stored in Cloudflare KV
 * 
 * Username/Email Case Handling:
 * - Lookups are case-INSENSITIVE (stored index keys are lowercase)
 * - User objects preserve ORIGINAL casing for display purposes
 * - This prevents "Admin" and "admin" from being different users
 * - Example: User registers as "JohnDoe", index key is "username:johndoe",
 *   but user.username remains "JohnDoe" for display
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
 * Note: Lookup is case-insensitive, but returned user preserves original casing
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
 * Note: Lookup is case-insensitive, but returned user preserves original casing
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
 * 
 * WARNING: This function scans all user keys and fetches each user individually.
 * It should only be used for admin dashboards with small user bases.
 * For large user bases, consider implementing pagination or caching.
 * 
 * Performance: O(n) KV operations where n = number of users
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
 * Note: Check is case-insensitive ("User@Example.com" and "user@example.com" are the same)
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
 * Note: Check is case-insensitive ("Admin" and "admin" are considered the same)
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
 * 
 * Note: This scans all sessions which can be slow with many active sessions.
 * Future optimization: Store a "usersessions:{userId}" index containing session hashes.
 * 
 * @param {Object} kv - KV namespace
 * @param {string} userId - User ID whose sessions should be invalidated
 */
export const invalidateUserSessions = async (kv, userId) => {
  if (!kv || !userId) return;

  try {
    // List all sessions and find ones belonging to this user
    // TODO: Consider storing usersessions:{userId} index for O(1) lookup
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
 * Uses stored keyHash in user's key list for efficient O(n) deletion
 * where n = number of keys for this user (not total keys)
 */
export const deleteUserApiKeys = async (kv, userId) => {
  if (!kv || !userId) return;

  try {
    const userKeysKey = `userkeys:${userId}`;

    // We need to find and delete the actual apikey entries
    // We store the keyHash in the user's key list, so we can delete the keys directly
    const deletePromises = [];
    const userKeys = await kv.get(userKeysKey, 'json');

    if (Array.isArray(userKeys) && userKeys.length > 0) {
      for (const keyInfo of userKeys) {
        if (keyInfo && keyInfo.keyHash) {
          deletePromises.push(kv.delete(`apikey:${keyInfo.keyHash}`));
        }
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