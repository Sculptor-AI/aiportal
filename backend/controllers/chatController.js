import axios from 'axios';
import { encryptPacket, decryptPacket } from '../utils/encryption.js';
import { formatResponsePacket } from '../utils/formatters.js';

/**
 * Process a chat completion request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const completeChat = async (req, res) => {
  try {
    const { modelType, prompt, search = false, deepResearch = false, imageGen = false } = req.body;
    
    // Format the request packet as shown in the diagram
    const requestPacket = {
      modelType,
      prompt,
      search: search.toString(),
      deepResearch: deepResearch.toString(),
      imageGen: imageGen.toString()
    };
    
    // Log the request (without sensitive data)
    console.log(`Request received for model: ${modelType}`);
    
    // Check against list of available models to prevent packet modification and abuse
    const allowedModels = process.env.ALLOWED_MODELS?.split(',') || [];
    if (!allowedModels.includes(modelType)) {
      return res.status(400).json({ error: 'Invalid model type requested' });
    }
    
    // Create payload for OpenRouter
    const openRouterPayload = {
      model: modelType,
      messages: [{ role: 'user', content: prompt }]
    };
    
    // Call OpenRouter API
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', openRouterPayload, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aiportal.com', // Replace with your actual site URL
        'X-Title': 'AI Portal' // Replace with your actual site name
      }
    });
    
    // Extract the content from OpenRouter response
    const aiResponse = response.data.choices[0].message.content;
    
    // Format the response
    const responsePacket = formatResponsePacket(modelType, prompt, aiResponse);
    
    // Encrypt response before sending (as shown in the diagram with AES-128)
    const encryptedResponse = encryptPacket(responsePacket);
    
    // Send encrypted response to client
    res.status(200).json({ data: encryptedResponse });
    
  } catch (error) {
    console.error('Error in chat completion:', error);
    res.status(error.response?.status || 500).json({
      error: 'Failed to complete chat request',
      details: error.response?.data || error.message
    });
  }
}; 