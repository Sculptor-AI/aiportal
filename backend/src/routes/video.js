/**
 * Video Generation Routes
 *
 * Supports Google Veo 2 via Gemini API
 */

import { Hono } from 'hono';
import { generateVideoWithVeo, checkOperationStatus } from '../services/gemini.js';
import { requireAuthAndApproved } from '../middleware/auth.js';
import { videoGenerationRateLimit } from '../middleware/rateLimit.js';
import { validateOutboundUrl } from '../utils/urlValidation.js';

const video = new Hono();
const VIDEO_DOWNLOAD_HOST_ALLOWLIST = [
  'storage.googleapis.com',
  '*.storage.googleapis.com',
  '*.googleusercontent.com',
  '*.googleapis.com',
  '*.gvt1.com',
  '*.ggpht.com'
];

const isRedirectStatus = (status) => status >= 300 && status < 400;

// Apply auth middleware to all video routes
video.use('/*', requireAuthAndApproved);

/**
 * Generate video
 * 
 * POST /api/video/generate
 * Body:
 * - prompt: string (required)
 * - aspectRatio: string (optional, default '16:9')
 * - negativePrompt: string (optional)
 */
video.post('/generate', videoGenerationRateLimit, async (c) => {
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

    console.log('Video generation request received');

    const result = await generateVideoWithVeo(prompt, apiKey, {
      aspectRatio,
      negativePrompt
    });

    if (!result.success) {
      console.error('Video generation provider failure:', result.error);
      return c.json({ error: 'Video generation failed' }, 500);
    }

    return c.json({
      success: true,
      operationName: result.operationName,
      model: result.model
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return c.json({ error: 'Internal server error' }, 500);
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
      console.error('Video status provider failure:', result.error);
      return c.json({ error: 'Unable to retrieve video status' }, 500);
    }

    return c.json(result);

  } catch (error) {
    console.error('Video status error:', error);
    return c.json({ error: 'Internal server error' }, 500);
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

  const validation = validateOutboundUrl(videoUrl, VIDEO_DOWNLOAD_HOST_ALLOWLIST);
  if (!validation.valid) {
    return c.json({ error: 'Invalid download URL' }, 400);
  }

  try {
    let response = await fetch(validation.url.toString(), { redirect: 'manual' });

    if (isRedirectStatus(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        return c.json({ error: 'Invalid download redirect' }, 400);
      }

      const redirectedUrl = new URL(location, validation.url).toString();
      const redirectValidation = validateOutboundUrl(redirectedUrl, VIDEO_DOWNLOAD_HOST_ALLOWLIST);
      if (!redirectValidation.valid) {
        return c.json({ error: 'Invalid download redirect target' }, 400);
      }

      response = await fetch(redirectValidation.url.toString(), { redirect: 'manual' });
      if (isRedirectStatus(response.status)) {
        return c.json({ error: 'Too many redirects' }, 400);
      }
    }
    
    if (!response.ok) {
      return c.json({ error: 'Failed to fetch video' }, response.status);
    }

    const contentType = response.headers.get('content-type');
    const isAllowedContentType =
      !contentType ||
      contentType.startsWith('video/') ||
      contentType.startsWith('application/octet-stream');

    if (!isAllowedContentType) {
      return c.json({ error: 'Unexpected content type' }, 400);
    }

    const body = response.body;

    return c.newResponse(body, 200, {
      'Content-Type': contentType || 'video/mp4',
      'Content-Disposition': 'attachment; filename="generated-video.mp4"'
    });

  } catch (error) {
    console.error('Download proxy error:', error);
    return c.json({ error: 'Unable to download video' }, 500);
  }
});

export default video;

