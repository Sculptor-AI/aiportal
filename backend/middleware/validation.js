import { decryptPacket } from '../utils/encryption.js';

/**
 * Validate chat completion request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateChatRequest = (req, res, next) => {
  const { modelType, prompt } = req.body;
  
  if (!modelType) {
    return res.status(400).json({ error: 'Missing required field: modelType' });
  }
  
  if (!prompt) {
    return res.status(400).json({ error: 'Missing required field: prompt' });
  }
  
  // If request is encrypted, decrypt it first
  if (req.body.encrypted) {
    try {
      const decrypted = decryptPacket(req.body.data);
      req.body = { ...req.body, ...decrypted };
    } catch (error) {
      return res.status(400).json({ error: 'Failed to decrypt request data' });
    }
  }
  
  // Validate boolean fields
  if (req.body.search !== undefined && typeof req.body.search !== 'boolean') {
    req.body.search = req.body.search === 'true';
  }
  
  if (req.body.deepResearch !== undefined && typeof req.body.deepResearch !== 'boolean') {
    req.body.deepResearch = req.body.deepResearch === 'true';
  }
  
  if (req.body.imageGen !== undefined && typeof req.body.imageGen !== 'boolean') {
    req.body.imageGen = req.body.imageGen === 'true';
  }
  
  next();
}; 