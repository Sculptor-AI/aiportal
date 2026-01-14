/**
 * In-memory state management
 * Note: User data and API keys are now stored in Cloudflare KV
 * This file is kept for utility functions
 */

/**
 * Get current ISO timestamp
 */
export const nowIso = () => new Date().toISOString();
