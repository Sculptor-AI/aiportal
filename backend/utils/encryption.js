import crypto from 'crypto';

/**
 * Encrypt data using public key
 * @param {Object} data - Data to encrypt
 * @returns {string} Encrypted data as base64 string
 */
export const encryptPacket = (data) => {
  try {
    const jsonStr = JSON.stringify(data);
    const publicKey = process.env.PUBLIC_KEY.replace(/\\n/g, '\n');
    
    // Encrypt with public key
    // Note: RSA can only encrypt limited size data, so for larger data
    // we would need to use hybrid encryption (encrypt data with symmetric key
    // and then encrypt that key with the public key)
    const encryptedData = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(jsonStr)
    );
    
    return encryptedData.toString('base64');
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data using private key
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {Object} Decrypted data
 */
export const decryptPacket = (encryptedData) => {
  try {
    const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
    
    // Decrypt with private key
    const decryptedData = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(encryptedData, 'base64')
    );
    
    return JSON.parse(decryptedData.toString());
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}; 