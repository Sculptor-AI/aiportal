import axios from 'axios';
import { formatResponsePacket } from '../utils/formatters.js';

/**
 * Process a chat completion request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const completeChat = async (req, res) => {
  try {
    const { modelType, prompt, search = false, deepResearch = false, imageGen = false } = req.body;
    
    // Log the request (without sensitive data)
    console.log(`Request received for model: ${modelType}`);
    
    // Check against list of available models to prevent abuse
    const allowedModels = process.env.ALLOWED_MODELS?.split(',') || [];
    if (!allowedModels.includes(modelType)) {
      return res.status(400).json({ error: 'Invalid model type requested' });
    }
    
    // Model-specific adjustments and normalization
    let adjustedModelType = modelType;
    
    // Some models need specific handling - these mappings may need to be updated
    // based on OpenRouter's current model IDs
    const modelMappings = {
      'google/gemini-2.5-pro-exp-03-25': 'google/gemini-pro-1.5',
      'deepseek/deepseek-v3-base:free': 'deepseek/deepseek-chat-v3-0324:free',
      'deepseek/deepseek-r1:free': 'deepseek/deepseek-r1'
    };
    
    if (modelMappings[modelType]) {
      console.log(`Adjusting model ID from ${modelType} to ${modelMappings[modelType]}`);
      adjustedModelType = modelMappings[modelType];
    }
    
    // Create payload for OpenRouter
    const openRouterPayload = {
      model: adjustedModelType,
      messages: [{ role: 'user', content: prompt }]
    };
    
    console.log(`Sending request to OpenRouter with model: ${adjustedModelType}`);
    
    // Call OpenRouter API
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', openRouterPayload, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aiportal.com',
        'X-Title': 'AI Portal'
      }
    });
    
    // Extract the full response from OpenRouter
    const aiResponse = response.data;
    
    // Send the complete, unmodified OpenRouter response to the client
    res.status(200).json(aiResponse);
    
  } catch (error) {
    console.error('Error in chat completion:', error);
    console.error('Error details:', error.response?.data);
    
    // Pass through any OpenRouter error messages 
    if (error.response && error.response.data) {
      return res.status(error.response.status || 500).json({
        error: 'OpenRouter API error',
        details: error.response.data,
        modelType: req.body.modelType
      });
    }
    
    // Generic error handling
    res.status(500).json({
      error: 'Failed to complete chat request',
      details: error.message,
      modelType: req.body.modelType
    });
  }
};

/**
 * Process a streaming chat completion request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const streamChat = async (req, res) => {
  try {
    const { modelType, prompt, search = false, deepResearch = false, imageGen = false } = req.body;
    
    // Log the request (without sensitive data)
    console.log(`Streaming request received for model: ${modelType}`);
    
    // Check against list of available models
    const allowedModels = process.env.ALLOWED_MODELS?.split(',') || [];
    if (!allowedModels.includes(modelType)) {
      return res.status(400).json({ error: 'Invalid model type requested' });
    }
    
    // Model-specific adjustments - same as in completeChat
    let adjustedModelType = modelType;
    
    const modelMappings = {
      'google/gemini-2.5-pro-exp-03-25': 'google/gemini-pro-1.5',
      'deepseek/deepseek-v3-base:free': 'deepseek/deepseek-chat-v3-0324:free',
      'deepseek/deepseek-r1:free': 'deepseek/deepseek-r1'
    };
    
    if (modelMappings[modelType]) {
      console.log(`Adjusting streaming model ID from ${modelType} to ${modelMappings[modelType]}`);
      adjustedModelType = modelMappings[modelType];
    }
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Create payload for OpenRouter with streaming enabled
    const openRouterPayload = {
      model: adjustedModelType,
      messages: [{ role: 'user', content: prompt }],
      stream: true
    };
    
    console.log(`Sending streaming request to OpenRouter with model: ${adjustedModelType}`);
    
    // Make a streaming request to OpenRouter
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', 
      openRouterPayload, 
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aiportal.com',
          'X-Title': 'AI Portal'
        },
        responseType: 'stream'
      }
    );
    
    // Pipe the OpenRouter response directly to the client
    response.data.on('data', (chunk) => {
      const data = chunk.toString();
      // Forward each chunk to the client
      res.write(data);
    });
    
    response.data.on('end', () => {
      res.end();
    });
    
    // Handle client disconnect
    req.on('close', () => {
      response.data.destroy();
    });
    
  } catch (error) {
    console.error('Error in streaming chat:', error);
    console.error('Error details:', error.response?.data);
    
    // If headers haven't been sent yet, send an error response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to initiate streaming chat',
        details: error.message,
        modelType: req.body.modelType
      });
    } else {
      // Otherwise, try to send an error event
      try {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      } catch (e) {
        console.error('Error sending streaming error:', e);
      }
    }
  }
}; 