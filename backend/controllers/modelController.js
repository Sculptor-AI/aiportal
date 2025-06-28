import axios from 'axios';
import { getGeminiModels } from '../services/geminiService.js';
import { getAnthropicModels } from '../services/anthropicService.js';
import { getOpenAIModels } from '../services/openaiService.js';

/**
 * Get the list of available models from OpenRouter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getModels = async (req, res) => {
  try {
    let allModels = [];
    
    // Get Anthropic models if API key is configured
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropicModels = getAnthropicModels();
        allModels = [...allModels, ...anthropicModels];
        console.log(`Added ${anthropicModels.length} Anthropic models`);
      } catch (error) {
        console.error('Error getting Anthropic models:', error);
      }
    }
    
    // Get OpenAI models if API key is configured
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiModels = getOpenAIModels();
        allModels = [...allModels, ...openaiModels];
        console.log(`Added ${openaiModels.length} OpenAI models`);
      } catch (error) {
        console.error('Error getting OpenAI models:', error);
      }
    }
    
    // Get Gemini models if API key is configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiModels = getGeminiModels();
        allModels = [...allModels, ...geminiModels];
        console.log(`Added ${geminiModels.length} Gemini models`);
      } catch (error) {
        console.error('Error getting Gemini models:', error);
      }
    }
    
    // Get OpenRouter models if API key is configured
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const response = await axios.get('https://openrouter.ai/api/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Filter models based on allowed list in env
        const allowedModels = process.env.ALLOWED_MODELS?.split(',') || [];
        
        let openRouterModels;
        if (allowedModels.length > 0) {
          openRouterModels = response.data.data.filter(model => 
            allowedModels.includes(model.id)
          );
        } else {
          openRouterModels = response.data.data;
        }
        
        // Format OpenRouter models
        const formattedOpenRouterModels = openRouterModels.map(model => ({
          id: model.id,
          name: model.name || model.id.split('/').pop(),
          provider: model.id.split('/')[0],
          source: 'openrouter',
          pricing: {
            prompt: model.pricing?.prompt,
            completion: model.pricing?.completion
          },
          context_length: model.context_length,
          capabilities: model.capabilities || [],
          isBackendModel: true
        }));
        
        allModels = [...allModels, ...formattedOpenRouterModels];
        console.log(`Added ${formattedOpenRouterModels.length} OpenRouter models`);
      } catch (error) {
        console.error('Error fetching OpenRouter models:', error);
      }
    }
    
    res.status(200).json({ models: allModels });
    
  } catch (error) {
    console.error('Error in getModels:', error);
    res.status(500).json({
      error: 'Failed to fetch models',
      details: error.message
    });
  }
}; 