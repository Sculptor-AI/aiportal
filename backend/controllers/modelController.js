import axios from 'axios';

/**
 * Get the list of available models from OpenRouter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getModels = async (req, res) => {
  try {
    // Call OpenRouter API to get available models
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Filter models based on allowed list in env
    const allowedModels = process.env.ALLOWED_MODELS?.split(',') || [];
    
    let models;
    if (allowedModels.length > 0) {
      models = response.data.data.filter(model => 
        allowedModels.includes(model.id)
      );
    } else {
      models = response.data.data;
    }
    
    // Format the response data
    const formattedModels = models.map(model => ({
      id: model.id,
      name: model.name || model.id.split('/').pop(),
      provider: model.id.split('/')[0],
      pricing: {
        prompt: model.pricing?.prompt,
        completion: model.pricing?.completion
      },
      context_length: model.context_length,
      capabilities: model.capabilities || []
    }));
    
    res.status(200).json({ models: formattedModels });
    
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch models',
      details: error.response?.data || error.message
    });
  }
}; 