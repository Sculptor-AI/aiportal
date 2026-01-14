/**
 * Cryptographic utilities for password hashing and token generation
 * Uses Web Crypto API (native to Cloudflare Workers)
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

/**
 * Generate a random salt
 */
const generateSalt = () => {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return bufferToHex(salt);
};

/**
 * Convert ArrayBuffer to hex string
 */
const bufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Convert hex string to Uint8Array
 */
const hexToBuffer = (hex) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
};

/**
 * Hash a password using PBKDF2
 * @param {string} password - The plain text password
 * @param {string} salt - Optional salt (generated if not provided)
 * @returns {Promise<{hash: string, salt: string}>}
 */
export const hashPassword = async (password, salt = null) => {
  const useSalt = salt || generateSalt();
  const encoder = new TextEncoder();

  // Import the password as a key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBuffer(useSalt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    HASH_LENGTH * 8
  );

  return {
    hash: bufferToHex(derivedBits),
    salt: useSalt
  };
};

/**
 * Constant-time string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean}
 */
const constantTimeCompare = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

/**
 * Verify a password against a stored hash
 * Uses constant-time comparison to prevent timing attacks
 * @param {string} password - The plain text password to verify
 * @param {string} storedHash - The stored hash
 * @param {string} salt - The salt used for the original hash
 * @returns {Promise<boolean>}
 */
export const verifyPassword = async (password, storedHash, salt) => {
  const { hash } = await hashPassword(password, salt);
  return constantTimeCompare(hash, storedHash);
};

/**
 * Generate a secure random token
 * Uses purely random data for maximum security (no timestamp to prevent predictability)
 * @param {string} prefix - Optional prefix for the token
 * @returns {string}
 */
export const generateToken = (prefix = 'sk') => {
  // Use two UUIDs for extra entropy (256 bits total)
  const randomPart1 = crypto.randomUUID().replace(/-/g, '');
  const randomPart2 = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  return `${prefix}_${randomPart1}${randomPart2}`;
};

/**
 * Generate a secure session token
 * @returns {string}
 */
export const generateSessionToken = () => {
  return generateToken('sess');
};

/**
 * Generate an API key
 * @returns {string}
 */
export const generateApiKey = () => {
  return generateToken('ak');
};

/**
 * Hash a token for storage (we don't store tokens in plain text)
 * @param {string} token - The token to hash
 * @returns {Promise<string>}
 */
export const hashToken = async (token) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
};

/**
 * Get the prefix of a token (for display purposes)
 * @param {string} token - The full token
 * @returns {string}
 */
export const getTokenPrefix = (token) => {
  if (!token || token.length < 12) return token;
  return token.substring(0, 12) + '...';
};
