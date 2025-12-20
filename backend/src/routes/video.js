/**
 * Video Generation Routes
 * 
 * Supports Google Veo 2 via Gemini API
 */

import { Hono } from 'hono';
import { generateVideoWithVeo, checkOperationStatus } from '../services/gemini.js';

const video = new Hono();

/**
 * Generate video
 * 
 * POST /api/video/generate
 * Body:
 * - prompt: string (required)
 * - aspectRatio: string (optional, default '16:9')
 * - negativePrompt: string (optional)
 */
video.post('/generate', async (c) => {
  const env = c.env;
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    return c.json({ error: 'GEMINI_API_KEY is not configured for video generation.' }, 500);
  }

  try {
    const body = await c.req.json();
    const { prompt, aspectRatio, negativePrompt } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return c.json({ error: 'Prompt is required and must be a non-empty string' }, 400);
    }

    console.log(`Video generation request: "${prompt.substring(0, 50)}..."`);

    const result = await generateVideoWithVeo(prompt, apiKey, {
      aspectRatio,
      negativePrompt
    });

    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({
      success: true,
      operationName: result.operationName,
      model: result.model
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

/**
 * Check operation status
 * 
 * GET /api/video/status?name=operations/xxx
 */
video.get('/status', async (c) => {
  const env = c.env;
  const apiKey = env.GEMINI_API_KEY;
  const opName = c.req.query('name');

  if (!apiKey) {
    return c.json({ error: 'GEMINI_API_KEY is not configured.' }, 500);
  }

  if (!opName) {
    return c.json({ error: 'Operation name is required (pass as ?name=...)' }, 400);
  }

  try {
    const result = await checkOperationStatus(opName, apiKey);

    if (!result.success) {
      return c.json({ error: result.error }, 500);
    }

    return c.json(result);

  } catch (error) {
    console.error('Video status error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

/**
 * Proxy video download
 * 
 * GET /api/video/download?url=...
 * Proxies the request to avoid CORS issues if Google storage doesn't allow direct browser access
 */
video.get('/download', async (c) => {
  const videoUrl = c.req.query('url');
  
  if (!videoUrl) {
    return c.json({ error: 'URL is required' }, 400);
  }

  try {
    const response = await fetch(videoUrl);
    
    if (!response.ok) {
      return c.json({ error: 'Failed to fetch video' }, response.status);
    }

    const contentType = response.headers.get('content-type');
    const body = response.body;

    return c.newResponse(body, 200, {
      'Content-Type': contentType || 'video/mp4',
      'Content-Disposition': 'attachment; filename="generated-video.mp4"'
    });

  } catch (error) {
    console.error('Download proxy error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default video;

