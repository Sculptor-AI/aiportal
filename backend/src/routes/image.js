/**
 * Image Generation Routes
 * 
 * Supports multiple providers:
 * - Google Imagen (via Gemini API)
 * - OpenAI DALL-E
 * - Gemini native image generation
 */

import { Hono } from 'hono';
import { generateImageWithImagen } from '../services/gemini.js';
import { generateImageWithDALLE, editImageWithDALLE } from '../services/openai.js';
import { listImageModels, getDefaultImageModel } from '../config/index.js';
import modelsConfig from '../config/models.json';

const image = new Hono();

/**
 * Look up model info from models.json
 */
function resolveImageModel(modelName) {
  if (!modelName) return { provider: 'google', apiId: null };
  
  // Check Google/Imagen models
  const googleModels = modelsConfig.image?.google?.models || {};
  if (googleModels[modelName]) {
    return { provider: 'google', apiId: googleModels[modelName] };
  }
  
  // Check OpenAI models
  const openaiModels = modelsConfig.image?.openai?.models || {};
  if (openaiModels[modelName]) {
    return { provider: 'openai', apiId: openaiModels[modelName] };
  }
  
  // If it's already an API ID, try to detect provider
  if (modelName.includes('gpt-image') || modelName.includes('dall-e')) {
    return { provider: 'openai', apiId: modelName };
  }
  
  // Default to Google
  return { provider: 'google', apiId: modelName };
}

/**
 * Generate image
 * 
 * POST /api/image/generate
 * Body:
 * - prompt: string (required)
 * - provider: 'imagen' | 'dalle' | 'gemini' (optional, auto-detects from model)
 * - model: string (optional)
 * - aspectRatio: string (optional, e.g., '1:1', '16:9')
 * - size: string (optional, e.g., '1024x1024', for DALL-E)
 * - quality: 'auto' | 'hd' | 'low' (optional, for DALL-E)
 * - style: 'vivid' | 'natural' | 'auto' (optional, for DALL-E)
 * - n: number (optional, number of images)
 * - negativePrompt: string (optional, for Imagen)
 */
image.post('/generate', async (c) => {
  const env = c.env;

  try {
    const body = await c.req.json();
    const { prompt, provider, model } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return c.json({ error: 'Prompt is required and must be a non-empty string' }, 400);
    }

    // Resolve model to get provider and API ID
    const resolved = resolveImageModel(model);
    
    // Use explicit provider if given, otherwise use resolved provider
    let selectedProvider = provider || resolved.provider;
    const resolvedApiId = resolved.apiId;

    console.log(`Image generation: provider=${selectedProvider}, model=${model || 'default'}, apiId=${resolvedApiId}`);

    if (selectedProvider === 'openai' || selectedProvider === 'dalle') {
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        return c.json({ error: 'OPENAI_API_KEY is not configured for DALL-E.' }, 500);
      }

      const result = await generateImageWithDALLE(prompt, apiKey, {
        model: resolvedApiId || 'gpt-image-1',
        size: body.size || '1024x1024',
        quality: body.quality || 'auto',
        style: body.style || 'auto',
        n: body.n || 1,
        response_format: 'b64_json'
      });

      if (!result.success) {
        return c.json({ error: result.error }, 500);
      }

      return c.json({
        provider: 'openai',
        model: model || result.model,
        images: result.images.map(img => ({
          imageData: img.data ? `data:image/png;base64,${img.data}` : null,
          imageUrl: img.url,
          revisedPrompt: img.revised_prompt
        }))
      });
    }

    // Imagen (Google)
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ error: 'GEMINI_API_KEY is not configured for Imagen.' }, 500);
    }

    const result = await generateImageWithImagen(prompt, apiKey, {
      model: model,
      apiId: resolvedApiId,
      aspectRatio: body.aspectRatio || '1:1',
      imageSize: body.imageSize,
      count: body.n || 1,
      negativePrompt: body.negativePrompt,
      seed: body.seed,
      history: body.history // Multi-turn conversation history
    });

    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      provider: 'imagen',
      model: result.model,
      images: result.images.map(img => ({
        imageData: `data:${img.mimeType};base64,${img.data}`
      }))
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

/**
 * Edit image (DALL-E only)
 * 
 * POST /api/image/edit
 * Body:
 * - image: string (base64 data URL or URL)
 * - prompt: string (required)
 * - mask: string (optional, base64 data URL)
 * - size: string (optional)
 * - n: number (optional)
 */
image.post('/edit', async (c) => {
  const env = c.env;
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    return c.json({ error: 'OPENAI_API_KEY is not configured.' }, 500);
  }

  try {
    const body = await c.req.json();
    const { image: imageData, prompt, mask, size, n, model } = body;

    if (!imageData) {
      return c.json({ error: 'Image is required' }, 400);
    }
    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    const result = await editImageWithDALLE(imageData, prompt, apiKey, {
      mask,
      size: size || '1024x1024',
      n: n || 1,
      model: model || 'gpt-image-1'
    });

    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      images: result.images.map(img => ({
        imageData: img.data ? `data:image/png;base64,${img.data}` : null,
        imageUrl: img.url
      }))
    });

  } catch (error) {
    console.error('Image edit error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

/**
 * List available image models
 * Uses centralized config
 */
image.get('/models', (c) => {
  const models = listImageModels();
  return c.json({ 
    models,
    _note: 'Model list is defined in src/config/models.json'
  });
});

export default image;
