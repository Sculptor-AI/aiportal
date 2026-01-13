/**
 * In-memory state management
 * Note: User data is now stored in Cloudflare KV
 * This file is kept for any temporary in-memory state needs
 */

export const state = {
  // API keys are now stored in KV
  // This is kept for backwards compatibility during transition
  apiKeys: new Map()
};

/**
 * Get current ISO timestamp
 */
export const nowIso = () => new Date().toISOString();
