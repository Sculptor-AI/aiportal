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

const image = new Hono();

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

    // Determine provider
    let selectedProvider = provider;
    if (!selectedProvider) {
      if (model?.includes('dall-e') || model?.includes('gpt-image')) {
        selectedProvider = 'dalle';
      } else {
        selectedProvider = 'imagen'; // Default to Imagen
      }
    }

    console.log(`Image generation: provider=${selectedProvider}, model=${model || 'default'}`);

    if (selectedProvider === 'dalle') {
      const apiKey = env.OPENAI_API_KEY;
      if (!apiKey) {
        return c.json({ error: 'OPENAI_API_KEY is not configured for DALL-E.' }, 500);
      }

      const result = await generateImageWithDALLE(prompt, apiKey, {
        model: model,
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
        provider: 'dalle',
        model: result.model,
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
      aspectRatio: body.aspectRatio || '1:1',
      imageSize: body.imageSize,
      count: body.n || 1,
      negativePrompt: body.negativePrompt,
      seed: body.seed
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
