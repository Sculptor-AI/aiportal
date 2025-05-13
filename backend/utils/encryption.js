import CryptoJS from 'crypto-js';

/**
 * Encrypt data using AES-128
 * @param {Object} data - Data to encrypt
 * @returns {string} Encrypted data
 */
export const encryptPacket = (data) => {
  try {
    const jsonStr = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonStr, process.env.AES_ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt AES-128 encrypted data
 * @param {string} encryptedData - Encrypted data
 * @returns {Object} Decrypted data
 */
export const decryptPacket = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, process.env.AES_ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}; 