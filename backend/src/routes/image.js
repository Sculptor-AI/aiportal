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
import { requireAuthAndApproved } from '../middleware/auth.js';
import { imageGenerationRateLimit } from '../middleware/rateLimit.js';
import { evaluateUsageRequest, getGlobalUsageLimits, incrementUserUsage } from '../utils/usageLimits.js';

const image = new Hono();

// Apply auth middleware to generate and edit routes (models list is public)
image.use('/generate', requireAuthAndApproved);
image.use('/edit', requireAuthAndApproved);

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
image.post('/generate', imageGenerationRateLimit, async (c) => {
  const env = c.env;
  const kv = env.KV;
  const user = c.get('user');

  try {
    if (!kv) {
      return c.json({ error: 'Storage not configured' }, 500);
    }

    const body = await c.req.json();
    const { prompt, provider, model } = body;
    const imageCount = Math.max(1, Number(body.n) || 1);

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return c.json({ error: 'Prompt is required and must be a non-empty string' }, 400);
    }

    const usageLimits = await getGlobalUsageLimits(kv);
    const usageEvaluation = evaluateUsageRequest({
      user,
      limits: usageLimits,
      requested: { images: imageCount }
    });

    if (!usageEvaluation.allowed) {
      return c.json({
        error: usageEvaluation.message,
        code: 'usage_limit_exceeded',
        usage: usageEvaluation.usage,
        limits: usageEvaluation.limits,
        requested: usageEvaluation.requested,
        exceeded: usageEvaluation.field
      }, 429);
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
        n: imageCount,
        response_format: 'b64_json'
      });

      if (!result.success) {
        console.error('OpenAI image generation provider failure:', result.error);
        return c.json({ error: 'Image generation failed' }, 500);
      }

      await incrementUserUsage(kv, user.id, { images: result.images?.length || imageCount }).catch((error) => {
        console.error('Failed to increment image usage:', error);
      });

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
      count: imageCount,
      negativePrompt: body.negativePrompt,
      seed: body.seed,
      history: body.history // Multi-turn conversation history
    });

    if (!result.success) {
      console.error('Gemini image generation provider failure:', result.error);
      return c.json({ error: 'Image generation failed' }, 500);
    }

    await incrementUserUsage(kv, user.id, { images: result.images?.length || imageCount }).catch((error) => {
      console.error('Failed to increment image usage:', error);
    });

    return c.json({
      provider: 'imagen',
      model: result.model,
      images: result.images.map(img => ({
        imageData: `data:${img.mimeType};base64,${img.data}`
      }))
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return c.json({ error: 'Internal server error' }, 500);
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
image.post('/edit', imageGenerationRateLimit, async (c) => {
  const env = c.env;
  const apiKey = env.OPENAI_API_KEY;
  const kv = env.KV;
  const user = c.get('user');

  if (!apiKey) {
    return c.json({ error: 'OPENAI_API_KEY is not configured.' }, 500);
  }

  try {
    if (!kv) {
      return c.json({ error: 'Storage not configured' }, 500);
    }

    const body = await c.req.json();
    const { image: imageData, prompt, mask, size, n, model } = body;
    const imageCount = Math.max(1, Number(n) || 1);

    if (!imageData) {
      return c.json({ error: 'Image is required' }, 400);
    }
    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    const usageLimits = await getGlobalUsageLimits(kv);
    const usageEvaluation = evaluateUsageRequest({
      user,
      limits: usageLimits,
      requested: { images: imageCount }
    });

    if (!usageEvaluation.allowed) {
      return c.json({
        error: usageEvaluation.message,
        code: 'usage_limit_exceeded',
        usage: usageEvaluation.usage,
        limits: usageEvaluation.limits,
        requested: usageEvaluation.requested,
        exceeded: usageEvaluation.field
      }, 429);
    }

    const result = await editImageWithDALLE(imageData, prompt, apiKey, {
      mask,
      size: size || '1024x1024',
      n: imageCount,
      model: model || 'gpt-image-1'
    });

    if (!result.success) {
      console.error('OpenAI image edit provider failure:', result.error);
      return c.json({ error: 'Image edit failed' }, 500);
    }

    await incrementUserUsage(kv, user.id, { images: result.images?.length || imageCount }).catch((error) => {
      console.error('Failed to increment image usage:', error);
    });

    return c.json({
      images: result.images.map(img => ({
        imageData: img.data ? `data:image/png;base64,${img.data}` : null,
        imageUrl: img.url
      }))
    });

  } catch (error) {
    console.error('Image edit error:', error);
    return c.json({ error: 'Internal server error' }, 500);
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
