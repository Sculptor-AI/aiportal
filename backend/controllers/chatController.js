import axios from 'axios';
import { formatResponsePacket } from '../utils/formatters.js';

/**
 * Process a chat completion request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const completeChat = async (req, res) => {
  try {
    const { modelType, prompt, search = false, deepResearch = false, imageGen = false, imageData = null } = req.body;
    
    // Log the request (without sensitive data)
    console.log(`Request received for model: ${modelType}, search: ${search}, hasImage: ${!!imageData}`);
    
    // Check against list of available models to prevent abuse
    const allowedModels = process.env.ALLOWED_MODELS?.split(',') || [];
    if (!allowedModels.includes(modelType)) {
      return res.status(400).json({ error: 'Invalid model type requested' });
    }
    
    // If search is enabled, use the search processing functionality
    if (search) {
      console.log('Search functionality requested, performing search...');
      try {
        // Use internal API call to searchAndProcess
        const searchResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/search-process`, {
          query: prompt,
          max_results: deepResearch ? 5 : 3,
          model_prompt: "Based on the search results above, please answer this question in a comprehensive way with the most up-to-date information.",
          modelType: modelType // Pass the model type to use the same model
        });
        
        // Return the search results
        return res.status(200).json(searchResponse.data);
      } catch (error) {
        console.error('Error in search processing:', error);
        console.error('Error details:', error.response?.data);
        
        // Fall back to normal completion if search fails
        console.log('Search failed, falling back to normal completion');
      }
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
    
    // Prepare the message content based on whether we have an image or not
    let messageContent;
    
    if (imageData && imageData.data && imageData.mediaType) {
      // Format message content for multimodal models
      messageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: imageData.mediaType,
            data: imageData.data
          }
        },
        {
          type: "text",
          text: prompt
        }
      ];
    } else {
      // Plain text message
      messageContent = prompt;
    }
    
    // Create payload for OpenRouter
    const openRouterPayload = {
      model: adjustedModelType,
      messages: [{ 
        role: 'user', 
        content: messageContent 
      }]
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
  const { modelType, prompt, search, deepResearch, imageGen, imageData, fileTextContent } = req.body;
  
  if (!modelType || !prompt) {
    return res.status(400).json({ error: 'Missing required fields: modelType and prompt' });
  }
  
  console.log("Backend streamChat received:", { 
    modelType, 
    promptLength: prompt?.length,
    hasImage: !!imageData,
    hasFileText: !!fileTextContent,
    fileTextLength: fileTextContent?.length
  });
  
  // Set appropriate headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    // Convert boolean strings to actual booleans if needed
    const doSearch = search === 'true' || search === true;
    const doDeepResearch = deepResearch === 'true' || deepResearch === true;
    const doImageGen = imageGen === 'true' || imageGen === true;
    
    // Temporarily disabled until search functionality is implemented
    if (doSearch) {
      res.write(`data: Searching for information about "${prompt}"...\n\n`);
      // Future search implementation would go here
    }
    
    // Adjusted model name for OpenRouter (they use standardized model names)
    let adjustedModelType = modelType;
    
    // Map to standardized model names for OpenRouter if needed
    if (modelType === 'chatgpt-4' || modelType === 'gpt-4') {
      adjustedModelType = 'openai/gpt-4';
    } else if (modelType === 'chatgpt-4o' || modelType === 'gpt-4o') {
      adjustedModelType = 'openai/gpt-4o';
    } else if (modelType === 'chatgpt-3.5-turbo' || modelType === 'gpt-3.5-turbo') {
      adjustedModelType = 'openai/gpt-3.5-turbo';
    } else if (modelType === 'claude-3-opus') {
      adjustedModelType = 'anthropic/claude-3-opus';
    } else if (modelType === 'claude-3-sonnet') {
      adjustedModelType = 'anthropic/claude-3-sonnet';
    } else if (modelType === 'claude-3-haiku') {
      adjustedModelType = 'anthropic/claude-3-haiku';
    }
    
    // Prepare message content based on what was provided
    let messageContent;
    
    // If we have both image data and PDF text, combine them
    if (imageData && imageData.data && imageData.mediaType && fileTextContent) {
      messageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: imageData.mediaType,
            data: imageData.data
          }
        },
        {
          type: "text",
          text: `File Content:\n${fileTextContent}\n\nUser Message:\n${prompt}`
        }
      ];
    }
    // If we only have image data
    else if (imageData && imageData.data && imageData.mediaType) {
      messageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: imageData.mediaType,
            data: imageData.data
          }
        },
        {
          type: "text",
          text: prompt
        }
      ];
    }
    // If we only have PDF text
    else if (fileTextContent) {
      messageContent = `File Content:\n${fileTextContent}\n\nUser Message:\n${prompt}`;
    }
    // Plain text message
    else {
      messageContent = prompt;
    }
    
    // Create payload for OpenRouter with streaming enabled
    const openRouterPayload = {
      model: adjustedModelType,
      messages: [{ 
        role: 'user', 
        content: messageContent 
      }],
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

/**
 * Handle chat completion request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const handleChat = async (req, res) => {
  const { modelType, prompt, search, deepResearch, imageGen, imageData, fileTextContent } = req.body;
  
  if (!modelType || !prompt) {
    return res.status(400).json({ error: 'Missing required fields: modelType and prompt' });
  }
  
  console.log("Backend handleChat received:", { 
    modelType, 
    promptLength: prompt?.length,
    hasImage: !!imageData,
    hasFileText: !!fileTextContent,
    fileTextLength: fileTextContent?.length
  });
  
  try {
    // Adjusted model name for OpenRouter (they use standardized model names)
    let adjustedModelType = modelType;
    
    // Map to standardized model names for OpenRouter if needed
    if (modelType === 'chatgpt-4' || modelType === 'gpt-4') {
      adjustedModelType = 'openai/gpt-4';
    } else if (modelType === 'chatgpt-4o' || modelType === 'gpt-4o') {
      adjustedModelType = 'openai/gpt-4o';
    } else if (modelType === 'chatgpt-3.5-turbo' || modelType === 'gpt-3.5-turbo') {
      adjustedModelType = 'openai/gpt-3.5-turbo';
    } else if (modelType === 'claude-3-opus') {
      adjustedModelType = 'anthropic/claude-3-opus';
    } else if (modelType === 'claude-3-sonnet') {
      adjustedModelType = 'anthropic/claude-3-sonnet';
    } else if (modelType === 'claude-3-haiku') {
      adjustedModelType = 'anthropic/claude-3-haiku';
    }
    
    // Prepare message content based on what was provided
    let messageContent;
    
    // If we have both image data and PDF text, combine them
    if (imageData && imageData.data && imageData.mediaType && fileTextContent) {
      messageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: imageData.mediaType,
            data: imageData.data
          }
        },
        {
          type: "text",
          text: `File Content:\n${fileTextContent}\n\nUser Message:\n${prompt}`
        }
      ];
    }
    // If we only have image data
    else if (imageData && imageData.data && imageData.mediaType) {
      messageContent = [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: imageData.mediaType,
            data: imageData.data
          }
        },
        {
          type: "text",
          text: prompt
        }
      ];
    }
    // If we only have PDF text
    else if (fileTextContent) {
      messageContent = `File Content:\n${fileTextContent}\n\nUser Message:\n${prompt}`;
    }
    // Plain text message
    else {
      messageContent = prompt;
    }
    
    // Create payload for OpenRouter
    const openRouterPayload = {
      model: adjustedModelType,
      messages: [{ 
        role: 'user', 
        content: messageContent 
      }]
    };
    
    console.log(`Sending request to OpenRouter with model: ${adjustedModelType}`);
    
    // Make request to OpenRouter
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', 
      openRouterPayload, 
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aiportal.com',
          'X-Title': 'AI Portal'
        }
      }
    );
    
    console.log('OpenRouter response:', response.data);
    
    // Send the response
    res.json(response.data);
  } catch (error) {
    console.error('Error in chat:', error);
    console.error('Error details:', error.response?.data);
    
    res.status(500).json({ 
      error: 'Failed to process chat',
      details: error.message,
      modelType: req.body.modelType
    });
  }
}; 