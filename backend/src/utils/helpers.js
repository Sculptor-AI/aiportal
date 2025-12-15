/**
 * Common utility functions
 */

import { state } from '../state.js';

/**
 * Remove password from user object before returning
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

/**
 * Find user by username (case-insensitive)
 */
export const findUserByUsername = (username) => {
  if (!username) return null;
  const target = username.toLowerCase();
  for (const user of state.users.values()) {
    if (user.username.toLowerCase() === target) return user;
  }
  return null;
};

/**
 * Find user by email (case-insensitive)
 */
export const findUserByEmail = (email) => {
  if (!email) return null;
  const target = email.toLowerCase();
  for (const user of state.users.values()) {
    if (user.email.toLowerCase() === target) return user;
  }
  return null;
};

/**
 * Ensure API key store exists for a user
 */
export const ensureApiKeyStore = (userId) => {
  if (!state.apiKeys.has(userId)) {
    state.apiKeys.set(userId, []);
  }
  return state.apiKeys.get(userId);
};

